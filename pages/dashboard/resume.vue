<template>
  <div class="resume-edit">
    <header class="page-header">
      <div>
        <p class="kicker">01 — Resume</p>
        <h2>Edit your résumé</h2>
      </div>
      <div class="actions">
        <button class="btn btn--ghost btn--small" @click="showShare = !showShare">
          {{ showShare ? 'Close share' : 'Share' }}
        </button>
        <button class="btn btn--small" @click="downloadPdf" :disabled="exporting">
          {{ exporting ? 'Generating…' : 'Download PDF' }}
        </button>
      </div>
    </header>

    <!-- Publish state banner -->
    <div class="publish-banner" :class="{ 'publish-banner--live': resume.published }">
      <div class="publish-banner-text">
        <span class="publish-pill" :class="{ 'publish-pill--live': resume.published }">
          {{ resume.published ? '● Live' : '○ Draft' }}
        </span>
        <span class="publish-msg">
          <template v-if="resume.published">
            Your résumé is publicly visible at <code>/u/{{ auth.slug }}</code>.
          </template>
          <template v-else>
            Your résumé isn't visible publicly yet. Anyone who visits your public link will see a "not found" page.
          </template>
        </span>
      </div>
      <button
        class="btn btn--small"
        :class="{ 'btn--ghost': resume.published }"
        @click="togglePublish"
        :disabled="togglingPublish"
      >
        {{ togglingPublish ? 'Saving…' : (resume.published ? 'Unpublish' : 'Publish') }}
      </button>
    </div>

    <!-- Analytics — visible only when résumé is published (no point showing
         zeros when nobody can visit it yet) -->
    <div v-if="resume.published" class="analytics card">
      <div class="analytics-stat">
        <div class="stat-label">Total views</div>
        <div class="stat-value">{{ resume.viewCount || 0 }}</div>
      </div>
      <div class="analytics-stat">
        <div class="stat-label">This month</div>
        <div class="stat-value">{{ viewsThisMonth }}</div>
      </div>
      <div class="analytics-stat">
        <div class="stat-label">Last viewed</div>
        <div class="stat-value stat-value--soft">{{ lastViewedDisplay }}</div>
      </div>
      <p class="analytics-hint">Your own visits aren't counted.</p>
    </div>

    <!-- Share panel -->
    <div v-if="showShare" class="share-panel card">
      <div class="share-grid">
        <div>
          <h3 class="share-title">Public link</h3>
          <div class="share-url">
            <input class="input" :value="publicUrl" readonly @focus="$event.target.select()" />
            <button class="btn btn--small" @click="copyUrl">{{ copied ? 'Copied' : 'Copy' }}</button>
          </div>
          <p class="share-hint">Anyone with this link can see your résumé and blog.</p>
        </div>
        <div class="share-qr">
          <h3 class="share-title">QR code</h3>
          <div class="qr-wrap">
            <ClientOnly>
              <QrcodeVue :value="publicUrl" :size="160" level="M" foreground="#1a1d24" background="#ffffff" />
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile tab switcher: shown only below the side-by-side breakpoint.
         Lets the user view edit form OR preview at full width without scrolling
         past a half-screen preview to reach the form. -->
    <div class="mobile-tabs no-print">
      <button
        type="button"
        class="mobile-tab"
        :class="{ active: mobileTab === 'edit' }"
        @click="mobileTab = 'edit'"
      >Edit</button>
      <button
        type="button"
        class="mobile-tab"
        :class="{ active: mobileTab === 'preview' }"
        @click="mobileTab = 'preview'"
      >Preview</button>
    </div>

    <!-- Editor + preview side-by-side -->
    <div class="edit-grid" :data-mobile-tab="mobileTab">
      <!-- Form -->
      <section class="edit-form mobile-pane mobile-pane--edit">
        <div class="card">
          <h3 class="section-h">Profile</h3>

          <div class="field">
            <label>Profile image</label>
            <div class="image-row">
              <div class="thumb">
                <img v-if="resume.profileImageUrl" :src="resume.profileImageUrl" />
                <span v-else>·</span>
              </div>
              <div>
                <button class="btn btn--ghost btn--small" @click="triggerProfileUpload" :disabled="uploadingPhoto">
                  {{ uploadingPhoto ? 'Uploading…' : 'Upload' }}
                </button>
                <button v-if="resume.profileImageUrl" class="btn btn--ghost btn--small" @click="resume.profileImageUrl = ''" style="margin-left: 6px">Remove</button>
                <input ref="photoInputRef" type="file" accept="image/*" hidden @change="uploadProfile" />
              </div>
            </div>
          </div>

          <div class="row-2">
            <div class="field">
              <label>Full name</label>
              <input v-model="resume.name" class="input" />
            </div>
            <div class="field">
              <label>Title / role</label>
              <input v-model="resume.title" class="input" placeholder="Software Engineer" />
            </div>
          </div>

          <div class="row-2">
            <div class="field">
              <label>Email</label>
              <input v-model="resume.email" class="input" />
            </div>
            <div class="field">
              <label>Phone</label>
              <input v-model="resume.phone" class="input" />
            </div>
          </div>

          <div class="field">
            <label>Location (optional)</label>
            <input v-model="resume.location" class="input" placeholder="Kuala Lumpur, MY" />
          </div>
        </div>

        <!-- Style card: fonts and colors for this résumé -->
        <div class="card">
          <h3 class="section-h">Style</h3>
          <p class="muted-note">Choose how your résumé looks. Changes are previewed live on the right.</p>

          <div class="row-2">
            <FontPicker
              v-model="resume.theme.displayFont"
              label="Display font (name, headings)"
              context="resumeDisplay"
              inline
            />
            <FontPicker
              v-model="resume.theme.bodyFont"
              label="Body font"
              context="resumeBody"
              inline
            />
          </div>

          <div class="theme-row">
            <ColorPicker
              v-model="resume.theme.accent"
              label="Accent"
              :palette="resumeAccents"
            />
            <ColorPicker
              v-model="resume.theme.paper"
              label="Paper / main background"
              :palette="resumePapers"
            />
            <ColorPicker
              v-model="resume.theme.ink"
              label="Text color"
              :palette="resumeInks"
            />
          </div>

          <details class="advanced-colors" :open="advancedColorsOpen">
            <summary @click.prevent="advancedColorsOpen = !advancedColorsOpen">
              {{ advancedColorsOpen ? '− Hide' : '+ Show' }} advanced colors
            </summary>
            <div class="theme-row">
              <ColorPicker
                v-model="resume.theme.headerBg"
                label="Header background"
                :palette="resumePapers"
              />
              <ColorPicker
                v-model="resume.theme.sidebarBg"
                label="Sidebar background"
                :palette="resumePapers"
              />
              <ColorPicker
                v-model="resume.theme.photoBg"
                label="Photo cell background"
                :palette="resumeDarks"
              />
            </div>
          </details>

          <button class="btn btn--ghost btn--small" @click="resetTheme">Reset to defaults</button>
        </div>

        <!-- Left column: simplified sections -->
        <div class="card">
          <div class="card-h">
            <h3 class="section-h">Sidebar sections (left)</h3>
            <button class="btn btn--ghost btn--small" @click="addLeftSection">+ Add</button>
          </div>
          <p class="muted-note">Lists like skills, languages, tools. Items appear one per line.</p>

          <div v-for="(section, idx) in resume.leftSections" :key="section.id" class="sub-section">
            <div class="sub-section-head">
              <input v-model="section.title" class="input input-title" placeholder="Section title" />
              <button class="btn btn--ghost btn--small" @click="removeLeftSection(idx)">Remove</button>
            </div>
            <textarea
              v-model="section.itemsText"
              class="textarea"
              placeholder="Python&#10;JavaScript&#10;Go"
              rows="4"
            />
          </div>
        </div>

        <!-- Right column: free-form sections -->
        <div class="card">
          <div class="card-h">
            <h3 class="section-h">Main sections (right)</h3>
            <button class="btn btn--ghost btn--small" @click="addRightSection">+ Add</button>
          </div>
          <p class="muted-note">Name these whatever you like — Experience, Education, Projects, Awards, anything.</p>

          <div v-for="(section, idx) in resume.rightSections" :key="section.id" class="sub-section">
            <div class="sub-section-head">
              <input v-model="section.title" class="input input-title" placeholder="Section title" />
              <div class="reorder">
                <button class="btn btn--ghost btn--small" :disabled="idx === 0" @click="moveRight(idx, -1)" title="Up">↑</button>
                <button class="btn btn--ghost btn--small" :disabled="idx === resume.rightSections.length - 1" @click="moveRight(idx, 1)" title="Down">↓</button>
                <button class="btn btn--ghost btn--small" @click="removeRightSection(idx)">Remove</button>
              </div>
            </div>
            <textarea
              v-model="section.body"
              class="textarea"
              rows="6"
              placeholder="Use plain text. Line breaks are preserved."
            />
          </div>
        </div>

        <div class="save-row">
          <span v-if="saved" class="save-status">Saved · {{ savedAt }}</span>
          <span v-else-if="dirty && !saving" class="save-status">Unsaved changes</span>
          <span v-else-if="saving" class="save-status">Saving…</span>
          <button class="btn" @click="save" :disabled="saving || !dirty">Save</button>
        </div>
      </section>

      <!-- Preview (with zoom controls) -->
      <section class="edit-preview mobile-pane mobile-pane--preview no-print">
        <div class="preview-frame">
          <header class="preview-controls">
            <span class="preview-label">Preview</span>
            <ZoomControls
              v-model="previewScale"
              :min="MIN_SCALE"
              :max="MAX_SCALE"
              :step="0.05"
              reset-label="Fit"
              @reset="resetZoom"
            />
          </header>

          <div class="preview-viewport" ref="viewportRef">
            <div class="preview-stage" :style="{ zoom: previewScale }">
              <ResumeView :resume="resume" ref="resumeRef" />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import QrcodeVue from 'qrcode.vue'
import { exportElementToPdf } from '~/composables/usePdfExport'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

useHead({ title: 'Edit résumé — Dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// The default theme — also used as the reset target. Each property maps to
// a CSS custom property on the .a4-page in ResumeView.
const DEFAULT_THEME = {
  displayFont: 'fraunces',
  bodyFont: 'public-sans',
  accent: '#7a4f3a',
  paper: '#ffffff',
  ink: '#1a1d24',
  headerBg: '#f3eee5',
  sidebarBg: '#ece6da',
  photoBg: '#2a2722'
}

// Color palettes for the swatch picker. Users can still pick custom colors
// via the "custom" swatch (which opens the native color input).
const resumeAccents = [
  { value: '#7a4f3a', label: 'Rust' },
  { value: '#9b5d3a', label: 'Copper' },
  { value: '#3d6b48', label: 'Forest' },
  { value: '#34556d', label: 'Steel blue' },
  { value: '#6c4a86', label: 'Plum' },
  { value: '#9b3232', label: 'Brick' },
  { value: '#1a1d24', label: 'Ink' },
  { value: '#8a8580', label: 'Stone' }
]
const resumePapers = [
  { value: '#ffffff', label: 'White' },
  { value: '#fbfaf7', label: 'Bone' },
  { value: '#f3eee5', label: 'Cream' },
  { value: '#ece6da', label: 'Warm grey' },
  { value: '#1f1f23', label: 'Dark ink' },
  { value: '#2a2722', label: 'Espresso' }
]
const resumeDarks = [
  { value: '#2a2722', label: 'Espresso' },
  { value: '#1a1d24', label: 'Ink' },
  { value: '#3d3d3d', label: 'Charcoal' },
  { value: '#7a4f3a', label: 'Rust' },
  { value: '#34556d', label: 'Steel blue' },
  { value: '#f3eee5', label: 'Cream' }
]
const resumeInks = [
  { value: '#1a1d24', label: 'Ink' },
  { value: '#2a2722', label: 'Espresso' },
  { value: '#3d3d3d', label: 'Charcoal' },
  { value: '#f3eee5', label: 'Cream' },
  { value: '#ffffff', label: 'White' }
]

const resume = reactive({
  profileImageUrl: '',
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  leftSections: [],
  rightSections: [],
  published: false,
  theme: { ...DEFAULT_THEME },
  // Analytics — populated from Firestore, never written from this page
  viewCount: 0,
  viewCountsByMonth: {},
  lastViewedAt: null
})

function resetTheme() {
  Object.assign(resume.theme, DEFAULT_THEME)
}

// Current YYYY-MM key for indexing into viewCountsByMonth.
const viewsThisMonth = computed(() => {
  const k = new Date().toISOString().slice(0, 7)
  return resume.viewCountsByMonth?.[k] || 0
})

// Human-friendly relative time for lastViewedAt (a Firestore Timestamp).
const lastViewedDisplay = computed(() => {
  const t = resume.lastViewedAt
  if (!t) return '—'
  const d = t.toDate ? t.toDate() : new Date(t)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
})

const dirty = ref(false)
const saving = ref(false)
const saved = ref(false)
const savedAt = ref('')
const loading = ref(true)

const showShare = ref(false)
const copied = ref(false)
const exporting = ref(false)
const togglingPublish = ref(false)
const mobileTab = ref('edit') // 'edit' | 'preview' — only effective below 1100px
const advancedColorsOpen = ref(false)

const resumeRef = ref(null)
const viewportRef = ref(null)
const photoInputRef = ref(null)
const uploadingPhoto = ref(false)

// ----- Preview zoom -----
// Default 75% (up from the old 62%). Range 40-120%. CSS `zoom` is used because
// — unlike `transform: scale()` — it affects layout, so the scrollable viewport
// naturally adjusts to the scaled content size.
const MIN_SCALE = 0.4
const MAX_SCALE = 1.2
const DEFAULT_SCALE = 0.75
const previewScale = ref(DEFAULT_SCALE)

function resetZoom() {
  previewScale.value = DEFAULT_SCALE
  // Scroll viewport back to top-left on reset
  nextTick(() => {
    if (viewportRef.value) {
      viewportRef.value.scrollTop = 0
      viewportRef.value.scrollLeft = 0
    }
  })
}

const publicUrl = computed(() => {
  if (!auth.slug) return ''
  const base = import.meta.client ? window.location.origin : config.public.siteUrl
  return `${base}/u/${auth.slug}`
})

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function addLeftSection() {
  resume.leftSections.push({ id: uid(), title: 'Skills', items: [], itemsText: '' })
}
function removeLeftSection(i) { resume.leftSections.splice(i, 1) }

function addRightSection() {
  resume.rightSections.push({ id: uid(), title: 'Experience', body: '' })
}
function removeRightSection(i) { resume.rightSections.splice(i, 1) }

function moveRight(i, delta) {
  const j = i + delta
  if (j < 0 || j >= resume.rightSections.length) return
  const tmp = resume.rightSections[i]
  resume.rightSections[i] = resume.rightSections[j]
  resume.rightSections[j] = tmp
}

async function load() {
  if (!auth.uid) return
  const snap = await getDoc(doc(useDb(), 'resumes', auth.uid))
  if (snap.exists()) {
    const data = snap.data()
    Object.assign(resume, data)
    // Seed itemsText from stored items so the textarea has something to bind to.
    // We edit through itemsText (a raw string) and re-derive items at save time.
    resume.leftSections = (data.leftSections || []).map(s => ({
      id: s.id,
      title: s.title || '',
      items: s.items || [],
      itemsText: (s.items || []).join('\n')
    }))
    resume.rightSections = data.rightSections || []
    resume.published = !!data.published
    // Merge stored theme with defaults so missing keys still have valid values
    // (handles users upgrading from a pre-theme version of the resume doc).
    resume.theme = { ...DEFAULT_THEME, ...(data.theme || {}) }
    // Analytics
    resume.viewCount = data.viewCount || 0
    resume.viewCountsByMonth = data.viewCountsByMonth || {}
    resume.lastViewedAt = data.lastViewedAt || null
  } else {
    resume.name = auth.profile?.displayName || ''
    resume.email = auth.profile?.email || ''
    resume.leftSections = [
      { id: uid(), title: 'Skills', items: [], itemsText: '' },
      { id: uid(), title: 'Languages', items: [], itemsText: '' }
    ]
    resume.rightSections = [
      { id: uid(), title: 'Summary', body: '' },
      { id: uid(), title: 'Experience', body: '' },
      { id: uid(), title: 'Education', body: '' }
    ]
    resume.published = false
    resume.theme = { ...DEFAULT_THEME }
  }
  loading.value = false
  await nextTick()
  dirty.value = false
}

async function save() {
  if (!auth.uid) return
  saving.value = true
  try {
    // Derive clean items from itemsText at save time. We keep itemsText only in
    // local state — Firestore only stores the cleaned items array.
    const cleanedLeft = resume.leftSections.map(s => ({
      id: s.id,
      title: s.title,
      items: (s.itemsText || '').split('\n').map(l => l.trim()).filter(Boolean)
    }))

    await setDoc(doc(useDb(), 'resumes', auth.uid), {
      profileImageUrl: resume.profileImageUrl,
      name: resume.name,
      title: resume.title,
      email: resume.email,
      phone: resume.phone,
      location: resume.location,
      leftSections: cleanedLeft,
      rightSections: resume.rightSections,
      published: !!resume.published,
      theme: { ...resume.theme },
      updatedAt: serverTimestamp()
    }, { merge: true })
    dirty.value = false
    saved.value = true
    savedAt.value = new Date().toLocaleTimeString()
    setTimeout(() => saved.value = false, 2200)
  } finally {
    saving.value = false
  }
}

watch(resume, () => {
  if (!loading.value) dirty.value = true
}, { deep: true })

function triggerProfileUpload() { photoInputRef.value?.click() }

async function uploadProfile(e) {
  const file = e.target.files?.[0]
  if (!file || !auth.uid) return
  uploadingPhoto.value = true
  try {
    const r = sRef(useStorage(), `profiles/${auth.uid}/${Date.now()}-${file.name}`)
    await uploadBytes(r, file)
    const url = await getDownloadURL(r)
    resume.profileImageUrl = url
  } catch (err) {
    alert('Upload failed: ' + err.message)
  } finally {
    uploadingPhoto.value = false
    e.target.value = ''
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copied.value = true
    setTimeout(() => copied.value = false, 1800)
  } catch {}
}

async function downloadPdf() {
  exporting.value = true
  try {
    if (dirty.value) await save()
    const el = resumeRef.value?.pageRef
    if (!el) throw new Error('Resume element not found')
    const filename = `${resume.name || 'resume'}.pdf`.replace(/\s+/g, '-').toLowerCase()
    await exportElementToPdf(el, filename)
  } catch (e) {
    alert('PDF export failed: ' + e.message)
  } finally {
    exporting.value = false
  }
}

async function togglePublish() {
  if (!auth.uid) return
  togglingPublish.value = true
  try {
    // If there are unsaved edits, persist them first so what gets published
    // matches what the user sees on screen.
    if (dirty.value) await save()
    const next = !resume.published
    await setDoc(doc(useDb(), 'resumes', auth.uid), {
      published: next,
      updatedAt: serverTimestamp()
    }, { merge: true })
    resume.published = next
  } catch (e) {
    alert('Failed to update publish state: ' + e.message)
  } finally {
    togglingPublish.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.resume-edit { display: flex; flex-direction: column; gap: 24px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 6px;
}
.page-header h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  margin: 0;
}
.actions { display: flex; gap: 8px; }

/* ============================================================
   Publish banner — shows draft/live state above the form.
   ============================================================ */
.publish-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  flex-wrap: wrap;
}
.publish-banner--live {
  border-color: rgba(61, 107, 72, 0.3);
  background: rgba(61, 107, 72, 0.05);
}
.publish-banner-text {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 200px;
}
.publish-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--bg);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 500;
  white-space: nowrap;
}
.publish-pill--live {
  background: rgba(61, 107, 72, 0.12);
  color: var(--success);
}
.publish-msg {
  font-size: 13px;
  color: var(--ink-soft);
  line-height: 1.5;
}
.publish-msg code {
  font-family: var(--font-mono);
  background: var(--bg);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: var(--ink);
}

/* ============================================================
   Analytics card — three stat blocks side by side.
   ============================================================ */
.analytics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  align-items: end;
  padding: 18px 24px;
  position: relative;
}
.analytics-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
  border-left: 1px solid var(--border-soft);
}
.analytics-stat:first-child {
  padding-left: 0;
  border-left: 0;
}
.stat-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.stat-value {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 500;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.stat-value--soft {
  font-size: 1.05rem;
  color: var(--ink-soft);
  font-weight: 400;
}
.analytics-hint {
  position: absolute;
  bottom: 6px;
  right: 16px;
  margin: 0;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--muted);
  letter-spacing: 0.04em;
}

@media (max-width: 600px) {
  .analytics {
    grid-template-columns: 1fr 1fr;
    gap: 16px 0;
    padding: 16px;
  }
  .analytics-stat:nth-child(3) {
    grid-column: 1 / -1;
    border-left: 0;
    padding-left: 0;
    border-top: 1px solid var(--border-soft);
    padding-top: 12px;
  }
  .stat-value { font-size: 1.6rem; }
  .analytics-hint { position: static; margin-top: 8px; }
}

.share-panel { background: var(--surface-2); }
.share-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: start;
}
.share-title {
  font-family: var(--font-display);
  font-size: 1rem;
  margin: 0 0 10px;
}
.share-url { display: flex; gap: 8px; }
.share-url .input { font-family: var(--font-mono); font-size: 13px; }
.share-hint { font-size: 12px; color: var(--muted); margin-top: 6px; }
.qr-wrap {
  padding: 12px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: inline-flex;
}
@media (max-width: 700px) {
  .share-grid { grid-template-columns: 1fr; }
}

/* ============================================================
   Edit grid — form left, preview right.
   The preview is a fixed-width sticky column so it stays in
   view as the form scrolls.
   ============================================================ */
.edit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 620px;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1400px) {
  .edit-grid { grid-template-columns: minmax(0, 1fr) 520px; }
}

/* ============================================================
   Mobile tab switcher — hidden on desktop. Below the
   side-by-side breakpoint, exactly one pane is visible at a
   time so the user always has full width to work with.
   ============================================================ */
.mobile-tabs {
  display: none;
  margin-bottom: 16px;
}

@media (max-width: 1100px) {
  .edit-grid {
    grid-template-columns: 1fr;
  }
  .mobile-tabs {
    display: inline-flex;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 4px;
    gap: 2px;
  }
  .mobile-tab {
    background: transparent;
    border: 0;
    padding: 6px 18px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-soft);
    border-radius: var(--radius);
    cursor: pointer;
    font-family: inherit;
  }
  .mobile-tab:hover { color: var(--ink); }
  .mobile-tab.active {
    background: var(--ink);
    color: var(--bg);
  }

  /* Show exactly the pane matching the active tab */
  .edit-grid[data-mobile-tab="edit"] .mobile-pane--preview { display: none; }
  .edit-grid[data-mobile-tab="preview"] .mobile-pane--edit { display: none; }

  /* Preview takes shorter viewport on mobile since the page itself can scroll */
  .preview-viewport { height: calc(100vh - 240px) !important; min-height: 360px !important; }
}

.edit-form { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.section-h {
  font-family: var(--font-display);
  font-size: 1.1rem;
  margin: 0 0 12px;
}
.card-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.muted-note {
  font-size: 12px;
  color: var(--muted);
  margin: 0 0 12px;
}
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 600px) { .row-2 { grid-template-columns: 1fr; } }

.theme-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px 12px;
  margin-top: 14px;
  margin-bottom: 14px;
}

.advanced-colors {
  margin-top: 4px;
  margin-bottom: 14px;
}
.advanced-colors summary {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--muted);
  letter-spacing: 0.04em;
  cursor: pointer;
  padding: 6px 0;
  list-style: none;
  user-select: none;
}
.advanced-colors summary::-webkit-details-marker { display: none; }
.advanced-colors summary:hover { color: var(--ink); }
.advanced-colors[open] summary { margin-bottom: 8px; }

@media (max-width: 600px) {
  .theme-row {
    grid-template-columns: 1fr 1fr;
    gap: 14px 10px;
  }
}

.image-row { display: flex; align-items: center; gap: 16px; }
.thumb {
  width: 64px;
  height: 64px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--muted);
}
.thumb img { width: 100%; height: 100%; object-fit: cover; }

.sub-section {
  padding: 14px 0;
  border-top: 1px dashed var(--border);
}
.sub-section:first-of-type { border-top: 0; padding-top: 4px; }
.sub-section-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.input-title { flex: 1; font-weight: 500; }
.reorder { display: flex; gap: 4px; }

.save-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  position: sticky;
  bottom: 0;
  background: var(--bg);
  padding: 12px 0;
}
.save-status {
  font-size: 12px;
  color: var(--ink-soft);
  font-family: var(--font-mono);
}

/* ============================================================
   Preview shell — sticky, with zoom controls and scrollable viewport.
   Uses CSS `zoom` so the scaled element's layout dimensions update,
   keeping the viewport scrollable correctly.
   ============================================================ */
.edit-preview {
  position: sticky;
  top: 24px;
  min-width: 0;
}
.preview-frame {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.preview-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border-soft);
}
.preview-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.preview-viewport {
  overflow: auto;
  background: var(--bg-grain);
  /* Fixed visible window — content scrolls inside. Tuned so the preview
     covers most of the viewport height while leaving room for the controls
     and header above. */
  height: calc(100vh - 200px);
  min-height: 480px;
}

.preview-stage {
  /* The ResumeView inside renders at A4 width (794px). With `zoom` applied,
     the rendered/layout size is scaled, so the viewport scrolls naturally. */
  display: inline-block;
  min-width: 100%;
  padding: 0;
}

/* Hide the version badge inside the preview iframe-style area to avoid duplicates */
.preview-stage :deep(.version-badge) { display: none; }
</style>
