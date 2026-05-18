<template>
  <div class="observer">
    <ObserverNav :slug="slug" current="resume" />

    <div v-if="error" class="state state--error">
      <h2>{{ error }}</h2>
      <NuxtLink to="/" class="btn btn--ghost">Go home</NuxtLink>
    </div>
    <template v-else-if="resume">
      <ResumeView :resume="resume" />
    </template>
  </div>
</template>

<script setup>
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))

// SSR-friendly data fetching — runs on the server first so we can populate
// meta tags for link previews. The Firebase client SDK works in Node;
// our Firestore security rules allow public reads on users/resumes/articles.
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
      // Either no resume exists, or it's still in draft. Either way, the public
      // page shouldn't expose it — 404 looks identical to "user doesn't exist",
      // which is what we want for unpublished drafts.
      throw createError({ statusCode: 404, statusMessage: 'No one lives at this address.' })
    }
    const resumeData = resSnap.data()

    const resume = resumeData ?? {
      profileImageUrl: '',
      name: displayName,
      title: '',
      email: '',
      phone: '',
      location: '',
      leftSections: [],
      rightSections: []
    }

    return { resume, displayName }
  }
)

const resume = computed(() => data.value?.resume)
const displayName = computed(() => data.value?.displayName || '')
const error = computed(() => fetchError.value ? (fetchError.value.statusMessage || 'Failed to load.') : '')

// SSR meta tags — this is the payoff for migrating to Nuxt. When someone
// pastes the URL into LinkedIn, Slack, etc., the preview shows real data.
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
.observer { display: flex; flex-direction: column; flex: 1; }
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
</style>
