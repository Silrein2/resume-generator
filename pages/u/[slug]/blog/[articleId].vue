<template>
  <div class="observer">
    <ObserverNav :slug="slug" current="blog" />

    <div v-if="error" class="state state--error">
      <h2>{{ error }}</h2>
      <NuxtLink :to="`/u/${slug}/blog`" class="btn btn--ghost">← Back to blog</NuxtLink>
    </div>
    <template v-else-if="data">
      <!-- Themed page surface — the user's chosen background fills the entire
           reading area, not just the text column. Their text color applies
           everywhere inside. -->
      <div class="themed-surface" :style="surfaceStyle">
        <div class="article-shell">
          <header class="article-header">
            <p class="kicker">
              <NuxtLink :to="`/u/${slug}/blog`">← All articles</NuxtLink>
            </p>
            <h1 :style="{ fontFamily: surfaceStyle.fontFamily }">
              {{ data.article.title || 'Untitled' }}
            </h1>
            <p class="meta">
              {{ formatDate(data.article.updatedAt) }} · by {{ data.displayName }}
            </p>
          </header>

          <article class="article-body" v-html="data.article.content" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { getFont } from '~/utils/fonts'

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
    // Convert Firestore Timestamp to ISO string for SSR serialization.
    // Theme is a plain string-keyed object — pass through directly.
    const article = {
      title: aData.title,
      content: aData.content,
      published: aData.published,
      updatedAt: aData.updatedAt?.toDate?.()?.toISOString() || null,
      createdAt: aData.createdAt?.toDate?.()?.toISOString() || null,
      theme: aData.theme || {}
    }

    return { article, displayName, uid }
  }
)

const error = computed(() => fetchError.value ? (fetchError.value.statusMessage || 'Failed to load.') : '')

// Build the inline style applied to the themed surface. We pull each theme key
// with a sensible fallback so old articles (no theme stored) render in the
// original design.
const surfaceStyle = computed(() => {
  const t = data.value?.article?.theme || {}
  return {
    fontFamily: getFont(t.font, 'article').cssFamily,
    background: t.background || '#ffffff',
    color: t.text || '#1a1d24',
    '--article-accent': t.accent || '#7a4f3a'
  }
})

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

.themed-surface {
  flex: 1;
  width: 100%;
  /* Fonts and colors come from inline :style binding above */
  transition: background 200ms ease, color 200ms ease;
}
.article-shell {
  max-width: 680px;
  margin: 0 auto;
  padding: 60px 24px 80px;
  width: 100%;
}
.article-header { margin-bottom: 40px; }
.kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 16px;
  opacity: 0.7;
}
.kicker a {
  text-decoration: none;
  color: var(--article-accent);
}
.kicker a:hover { opacity: 0.7; }

.article-header h1 {
  font-size: 2.8rem;
  font-weight: 500;
  line-height: 1.1;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
  color: inherit;
}
.meta {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  margin: 0;
  opacity: 0.6;
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

/* The TipTap content. Inside a themed-surface, text inherits the user's
   chosen text color; links and blockquotes pick up the user's accent. */
.article-body { padding: 0; }
.article-body :deep(a) {
  color: var(--article-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.article-body :deep(blockquote) {
  border-left: 3px solid var(--article-accent);
  padding-left: 16px;
  margin: 16px 0;
  font-style: italic;
  opacity: 0.85;
}
.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3) { color: inherit; }
.article-body :deep(p),
.article-body :deep(li) { color: inherit; }
.article-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
  margin: 12px 0;
}
.article-body :deep(code) {
  font-family: var(--font-mono);
  background: rgba(0, 0, 0, 0.08);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
.article-body :deep(pre) {
  background: rgba(0, 0, 0, 0.85);
  color: #f3eee5;
  padding: 16px;
  border-radius: var(--radius);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13px;
}
.article-body :deep(u) { text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 600px) {
  .article-shell { padding: 32px 18px 60px; }
  .article-header h1 { font-size: 1.9rem; }
  .article-header { margin-bottom: 28px; }
}
</style>
