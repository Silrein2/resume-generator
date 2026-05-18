<template>
  <div class="observer">
    <ObserverNav :slug="slug" current="blog" />

    <div class="blog-shell">
      <div v-if="error" class="state state--error">
        <h2>{{ error }}</h2>
        <NuxtLink to="/" class="btn btn--ghost">Go home</NuxtLink>
      </div>
      <template v-else-if="data">
        <header class="blog-header">
          <p class="kicker">Articles by {{ data.displayName }}</p>
          <h1>Writing</h1>
        </header>

        <p v-if="!data.articles.length" class="empty">
          No published articles yet.
        </p>

        <div v-else class="article-feed">
          <article v-for="a in data.articles" :key="a.id" class="feed-row">
            <div class="feed-date">{{ formatDate(a.updatedAt) }}</div>
            <div class="feed-body">
              <h2 class="feed-title">
                <NuxtLink :to="`/u/${slug}/blog/${a.id}`">{{ a.title || 'Untitled' }}</NuxtLink>
              </h2>
              <p class="feed-excerpt">{{ excerpt(a.content) }}</p>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import {
  doc, getDoc, collection, query, where, getDocs, limit, orderBy
} from 'firebase/firestore'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))

const { data, error: fetchError } = await useAsyncData(
  `blog-${slug.value}`,
  async () => {
    const db = useDb()
    const q = query(collection(db, 'users'), where('slug', '==', slug.value), limit(1))
    const userSnap = await getDocs(q)
    if (userSnap.empty) {
      throw createError({ statusCode: 404, statusMessage: 'No one lives at this address.' })
    }
    const uid = userSnap.docs[0].id
    const displayName = userSnap.docs[0].data().displayName || 'this writer'

    const aQ = query(collection(db, 'users', uid, 'articles'), orderBy('updatedAt', 'desc'))
    const aSnap = await getDocs(aQ)
    const articles = aSnap.docs
      .map(d => {
        const data = d.data()
        // Convert Firestore Timestamp to ISO string for SSR serialization
        return {
          id: d.id,
          title: data.title,
          content: data.content,
          published: data.published,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        }
      })
      .filter(a => a.published)

    return { articles, displayName }
  }
)

const error = computed(() => fetchError.value ? (fetchError.value.statusMessage || 'Failed to load.') : '')

useSeoMeta({
  title: () => `${data.value?.displayName || slug.value} — Writing`,
  description: () => `Articles by ${data.value?.displayName || slug.value}`,
  ogTitle: () => `${data.value?.displayName || slug.value} — Writing`,
  ogDescription: () => `Articles by ${data.value?.displayName || slug.value}`,
  ogUrl: () => `${config.public.siteUrl}/u/${slug.value}/blog`,
  twitterCard: 'summary'
})

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function excerpt(html) {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 220 ? text.slice(0, 220) + '…' : text
}
</script>

<style scoped>
.observer { display: flex; flex-direction: column; flex: 1; }
.blog-shell {
  max-width: 760px;
  margin: 0 auto;
  padding: 60px 24px 80px;
  width: 100%;
  flex: 1;
}
.blog-header { margin-bottom: 48px; }
.kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 8px;
}
.blog-header h1 {
  font-family: var(--font-display);
  font-size: 3.2rem;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
  margin: 0;
  font-style: italic;
  color: var(--ink);
}

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

.empty {
  padding: 40px;
  text-align: center;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.article-feed { display: flex; flex-direction: column; }
.feed-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 24px;
  padding: 28px 0;
  border-bottom: 1px solid var(--border-soft);
}
.feed-row:first-child { border-top: 1px solid var(--border-soft); }
.feed-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding-top: 6px;
}
.feed-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 500;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}
.feed-title a {
  text-decoration: none;
  color: var(--ink);
  background-image: linear-gradient(var(--accent), var(--accent));
  background-size: 0 1px;
  background-repeat: no-repeat;
  background-position: 0 100%;
  transition: background-size 240ms ease;
}
.feed-title a:hover { background-size: 100% 1px; color: var(--ink); }
.feed-excerpt {
  font-size: 0.95rem;
  color: var(--ink-soft);
  margin: 0;
}

@media (max-width: 600px) {
  .feed-row { grid-template-columns: 1fr; gap: 8px; }
  .blog-header h1 { font-size: 2.4rem; }
}
</style>
