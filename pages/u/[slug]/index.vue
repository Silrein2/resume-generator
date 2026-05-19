<template>
  <div class="observer">
    <ObserverNav :slug="slug" current="resume" />

    <div v-if="error" class="state state--error">
      <h2>{{ error }}</h2>
      <NuxtLink to="/" class="btn btn--ghost">Go home</NuxtLink>
    </div>
    <template v-else-if="resume">
      <!-- Sticky control bar: zoom controls always reachable -->
      <div class="reader-bar">
        <div class="reader-bar-inner">
          <ZoomControls
            v-model="zoom"
            :min="MIN_ZOOM"
            :max="MAX_ZOOM"
            reset-label="Fit width"
            @reset="fitToWidth"
          />
        </div>
      </div>

      <!-- Scrollable viewport. Horizontal scrollbar appears only when the
           zoomed content exceeds viewport width; vertical scrollbar appears
           when the resume grows past viewport height. -->
      <div class="reader-viewport" ref="viewportRef">
        <div class="reader-stage" :style="{ zoom }">
          <ResumeView :resume="resume" />
        </div>
        <!-- Publication-style colophon, fixed to the bottom of the viewport
             content so it appears under the résumé but inside the scroll area. -->
        <footer class="colophon">
          <Wordmark size="sm" tag="span" />
          <span class="colophon-sep">·</span>
          <span class="colophon-issue">{{ issueLabel }}</span>
          <span v-if="updatedLabel" class="colophon-sep">·</span>
          <span v-if="updatedLabel" class="colophon-updated">{{ updatedLabel }}</span>
        </footer>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  collection, query, where, getDocs, limit,
  doc, getDoc, updateDoc, increment, serverTimestamp
} from 'firebase/firestore'

const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuthStore()
const slug = computed(() => String(route.params.slug))

// SSR-friendly data fetching — runs on the server first so we can populate
// meta tags for link previews.
const { data, error: fetchError } = await useAsyncData(
  `resume-${slug.value}`,
  async () => {
    const db = useDb()
    const userQ = query(collection(db, 'users'), where('slug', '==', slug.value), limit(1))
    const userSnap = await getDocs(userQ)
    if (userSnap.empty) {
      throw createError({ statusCode: 404, statusMessage: 'No one lives at this address.' })
    }
    const userDoc = userSnap.docs[0]
    const uid = userDoc.id
    const displayName = userDoc.data().displayName || ''

    const resSnap = await getDoc(doc(db, 'resumes', uid))
    if (!resSnap.exists() || !resSnap.data().published) {
      throw createError({ statusCode: 404, statusMessage: 'No one lives at this address.' })
    }
    const r = resSnap.data()

    // Build a POJO with only the fields we render. Firestore Timestamps
    // (updatedAt/createdAt) aren't serializable by Nuxt's SSR payload encoder,
    // so we convert to ISO strings where we want to use them.
    const resume = {
      profileImageUrl: r.profileImageUrl || '',
      name: r.name || displayName,
      title: r.title || '',
      email: r.email || '',
      phone: r.phone || '',
      location: r.location || '',
      leftSections: r.leftSections || [],
      rightSections: r.rightSections || [],
      // Theme is a flat object of strings — safe to pass through directly.
      theme: r.theme || {},
      // Template id — defaults to 'editorial' to keep pre-template résumés rendering correctly.
      templateId: r.templateId || 'editorial'
    }

    const updatedAtIso = r.updatedAt?.toDate?.()?.toISOString() || null

    // Return uid so the client can target it for analytics increments and to
    // check whether the current viewer is the owner.
    return { resume, displayName, uid, updatedAtIso }
  }
)

const resume = computed(() => data.value?.resume)
const error = computed(() => fetchError.value ? (fetchError.value.statusMessage || 'Failed to load.') : '')

// Colophon — publication-style metadata under the résumé. Volume = year,
// Number = month from the last-updated timestamp (or current month if unknown).
const issueLabel = computed(() => {
  const iso = data.value?.updatedAtIso
  const d = iso ? new Date(iso) : new Date()
  const yr = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  return `Vol. ${yr} No. ${mo}`
})

const updatedLabel = computed(() => {
  const iso = data.value?.updatedAtIso
  if (!iso) return ''
  const d = new Date(iso)
  return `Last revised ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
})

// ============================================================
// Zoom — default fit-to-width, capped at 100% on wide screens.
// ============================================================
const A4_WIDTH = 794             // résumé page natural width in CSS px
const MIN_ZOOM = 0.3
const MAX_ZOOM = 2.0
const zoom = ref(1)              // initial value; corrected on mount
const viewportRef = ref(null)

function fitToWidth() {
  if (!import.meta.client || !viewportRef.value) return
  const w = viewportRef.value.clientWidth
  if (!w) return
  // Leave a small breathing margin so the page isn't hugging the edge.
  // Cap at 1.0 so we don't artificially upscale on large desktop screens.
  const fit = Math.min(1, (w - 24) / A4_WIDTH)
  zoom.value = Math.max(MIN_ZOOM, +fit.toFixed(2))
}

onMounted(async () => {
  await nextTick()
  fitToWidth()
  // Fire-and-forget analytics increment. See recordView() for ownership and
  // bot exclusions. Wrapped so a failure here never breaks the page render.
  try { await recordView() } catch (e) { /* swallow */ }
})

/**
 * Increment view-tracking fields on the resume doc. Runs only on the client
 * after hydration, so:
 *   - Bots that don't execute JS never trigger this (free filtering)
 *   - We can access auth state to skip the owner's own views
 * Firestore security rules permit this anonymous update only on published
 * résumés and only for the three view-tracking fields (see firestore.rules).
 */
async function recordView() {
  if (!import.meta.client) return
  const ownerUid = data.value?.uid
  if (!ownerUid) return

  // Wait until the auth listener has settled so we can reliably tell whether
  // the visitor is the owner (or any signed-in user).
  await auth.waitForInit()
  if (auth.uid === ownerUid) return // owner's own page view doesn't count

  // Honor the user's Do-Not-Track preference if set.
  if (navigator.doNotTrack === '1') return

  const monthKey = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  await updateDoc(doc(useDb(), 'resumes', ownerUid), {
    viewCount: increment(1),
    [`viewCountsByMonth.${monthKey}`]: increment(1),
    lastViewedAt: serverTimestamp()
  })
}

// SSR meta tags
useSeoMeta({
  title: () => resume.value?.name
    ? `${resume.value.name} — Resume`
    : `${slug.value} — Resume`,
  description: () => {
    const r = resume.value
    if (!r) return ''
    const parts = [r.title, r.location].filter(Boolean)
    return parts.length ? parts.join(' · ') : `Résumé and writing by ${r.name || slug.value}.`
  },
  ogTitle: () => resume.value?.name ? `${resume.value.name} — Resume` : `${slug.value} — Resume`,
  ogDescription: () => {
    const r = resume.value
    if (!r) return ''
    const parts = [r.title, r.location].filter(Boolean)
    return parts.length ? parts.join(' · ') : `Résumé and writing by ${r.name || slug.value}.`
  },
  ogType: 'profile',
  ogImage: () => resume.value?.profileImageUrl || undefined,
  ogUrl: () => `${config.public.siteUrl}/u/${slug.value}`,
  twitterCard: 'summary_large_image'
})
</script>

<style scoped>
.observer { display: flex; flex-direction: column; flex: 1; min-height: 100vh; }

.state {
  padding: 80px 24px;
  text-align: center;
  color: var(--ink-soft);
}
.state--error h2 {
  font-family: var(--font-display);
  font-size: 1.8rem;
  margin-bottom: 16px;
}

/* ============================================================
   Reader bar — sticky strip with zoom controls.
   ============================================================ */
.reader-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--surface);
  border-bottom: 1px solid var(--border-soft);
  box-shadow: var(--shadow-sm);
}
.reader-bar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 16px;
  display: flex;
  justify-content: flex-end;
}

/* ============================================================
   Reader viewport — the scrollable window the resume sits in.
   Horizontal scrollbar appears only when zoomed content > viewport width.
   Vertical scrollbar appears for tall content. The page itself doesn't
   scroll past this — same model as a PDF viewer.
   ============================================================ */
.reader-viewport {
  flex: 1;
  overflow: auto;
  background: var(--bg-grain);
  min-height: 0;
}
.reader-stage {
  /* inline-block sizes to content; min-width: 100% prevents the stage from
     being narrower than the viewport when content is small. With CSS `zoom`
     applied, the layout dimensions scale, so the browser scrolls correctly. */
  display: inline-block;
  min-width: 100%;
}

/* Trim the surrounding padding the ResumeView's a4-stage adds, since the
   reader-viewport already provides the surrounding chrome. */
.reader-stage :deep(.a4-stage) {
  padding: 16px;
  background: transparent;
}

/* ============================================================
   Publication colophon — small editorial footer under the page.
   ============================================================ */
.colophon {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 18px 16px 32px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.04em;
  text-align: center;
}
.colophon-sep { color: var(--accent); }
.colophon-issue,
.colophon-updated { white-space: nowrap; }

@media (max-width: 600px) {
  .reader-bar-inner { padding: 6px 10px; }
  .reader-stage :deep(.a4-stage) { padding: 8px; }
  .colophon { padding: 14px 12px 24px; font-size: 10px; }
}
</style>
