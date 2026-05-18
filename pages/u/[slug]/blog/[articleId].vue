<template>
  <div class="observer">
    <ObserverNav :slug="slug" current="blog" />

    <div class="article-shell">
      <div v-if="error" class="state state--error">
        <h2>{{ error }}</h2>
        <NuxtLink :to="`/u/${slug}/blog`" class="btn btn--ghost">← Back to blog</NuxtLink>
      </div>
      <template v-else-if="data">
        <header class="article-header">
          <p class="kicker">
            <NuxtLink :to="`/u/${slug}/blog`">← All articles</NuxtLink>
          </p>
          <h1>{{ data.article.title || 'Untitled' }}</h1>
          <p class="meta">
            {{ formatDate(data.article.updatedAt) }} · by {{ data.displayName }}
          </p>
        </header>

        <article class="article-body" v-html="data.article.content" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))
const articleId = computed(() => String(route.params.articleId))

const { data, error: fetchError } = await useAsyncData(
  `article-${slug.value}-${articleId.value}`,
  async () => {
    const db = useDb()
    const userQ = query(collection(db, 'users'), where('slug', '==', slug.value), limit(1))
    const userSnap = await getDocs(userQ)
    if (userSnap.empty) {
      throw createError({ statusCode: 404, statusMessage: 'No one lives at this address.' })
    }
    const uid = userSnap.docs[0].id
    const displayName = userSnap.docs[0].data().displayName || ''

    // Don't expose articles if the public page is in draft.
    const resSnap = await getDoc(doc(db, 'resumes', uid))
    if (!resSnap.exists() || !resSnap.data().published) {
      throw createError({ statusCode: 404, statusMessage: 'No one lives at this address.' })
    }

    const aSnap = await getDoc(doc(db, 'users', uid, 'articles', articleId.value))
    if (!aSnap.exists() || !aSnap.data().published) {
      throw createError({ statusCode: 404, statusMessage: 'This article is not available.' })
    }

    const aData = aSnap.data()
    // Convert Firestore Timestamp to ISO string for SSR serialization
    const article = {
      title: aData.title,
      content: aData.content,
      published: aData.published,
      updatedAt: aData.updatedAt?.toDate?.()?.toISOString() || null,
      createdAt: aData.createdAt?.toDate?.()?.toISOString() || null
    }

    return { article, displayName, uid }
  }
)

const error = computed(() => fetchError.value ? (fetchError.value.statusMessage || 'Failed to load.') : '')

// Per-article SSR meta tags — clean link previews on social shares.
useSeoMeta({
  title: () => `${data.value?.article.title || 'Article'} — ${data.value?.displayName || ''}`,
  description: () => excerpt(data.value?.article.content || ''),
  ogTitle: () => data.value?.article.title || 'Article',
  ogDescription: () => excerpt(data.value?.article.content || ''),
  ogType: 'article',
  ogUrl: () => `${config.public.siteUrl}/u/${slug.value}/blog/${articleId.value}`,
  articleAuthor: () => data.value?.displayName || undefined,
  articlePublishedTime: () => data.value?.article.createdAt || undefined,
  articleModifiedTime: () => data.value?.article.updatedAt || undefined,
  twitterCard: 'summary'
})

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function excerpt(html, max = 200) {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? text.slice(0, max) + '…' : text
}
</script>

<style scoped>
.observer { display: flex; flex-direction: column; flex: 1; }
.article-shell {
  max-width: 680px;
  margin: 0 auto;
  padding: 60px 24px 80px;
  width: 100%;
  flex: 1;
}
.article-header { margin-bottom: 40px; }
.kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 16px;
}
.kicker a {
  text-decoration: none;
  color: var(--accent);
}
.kicker a:hover { color: var(--ink); }

.article-header h1 {
  font-family: var(--font-display);
  font-size: 2.8rem;
  font-weight: 500;
  line-height: 1.1;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}
.meta {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.04em;
  margin: 0;
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
.article-body { padding: 0; }

@media (max-width: 600px) {
  .article-shell { padding: 32px 18px 60px; }
  .article-header h1 { font-size: 1.9rem; }
  .article-header { margin-bottom: 28px; }
}
</style>
