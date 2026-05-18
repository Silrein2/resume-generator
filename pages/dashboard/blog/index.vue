<template>
  <div class="blog-edit">
    <header class="page-header">
      <div>
        <p class="kicker">02 — Blog</p>
        <h2>Your articles</h2>
      </div>
      <div class="actions">
        <button class="btn btn--small" @click="createNew" :disabled="articles.length >= 50">
          + New article
        </button>
      </div>
    </header>

    <div class="article-list">
      <p v-if="articles.length >= 50" class="notice">
        You've reached the 50-article limit. Delete an existing article to add more.
      </p>
      <p v-if="!articles.length && !loading" class="empty">
        No articles yet. Hit "+ New article" to get started.
      </p>
      <div v-for="a in articles" :key="a.id" class="article-row">
        <div class="article-meta">
          <h3 class="article-title">
            <NuxtLink :to="`/dashboard/blog/${a.id}`">{{ a.title || 'Untitled' }}</NuxtLink>
          </h3>
          <p class="article-info">
            <span class="status" :class="{ 'status--draft': !a.published }">
              {{ a.published ? 'Published' : 'Draft' }}
            </span>
            <span v-if="a.updatedAt">· Updated {{ formatDate(a.updatedAt) }}</span>
          </p>
        </div>
        <div class="article-actions">
          <a
            v-if="a.published && auth.slug"
            :href="`/u/${auth.slug}/blog/${a.id}`"
            target="_blank"
            class="btn btn--ghost btn--small"
            title="Open the public version in a new tab"
          >View ↗</a>
          <NuxtLink
            :to="`/dashboard/blog/${a.id}`"
            class="btn btn--ghost btn--small"
            title="Edit this article"
          >Edit</NuxtLink>
          <button
            class="btn btn--ghost btn--small btn--danger"
            :disabled="deletingId === a.id"
            @click="confirmDelete(a)"
            title="Delete this article"
          >{{ deletingId === a.id ? 'Deleting…' : 'Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })
useHead({ title: 'Blog — Dashboard' })

const auth = useAuthStore()
const router = useRouter()

const articles = ref([])
const loading = ref(true)
const deletingId = ref('')

async function loadList() {
  if (!auth.uid) return
  loading.value = true
  try {
    const q = query(collection(useDb(), 'users', auth.uid, 'articles'), orderBy('updatedAt', 'desc'))
    const snap = await getDocs(q)
    articles.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loading.value = false
  }
}

function createNew() {
  router.push('/dashboard/blog/new')
}

async function confirmDelete(article) {
  const label = article.title || 'this article'
  if (!confirm(`Delete "${label}"? This cannot be undone.`)) return
  deletingId.value = article.id
  try {
    await deleteDoc(doc(useDb(), 'users', auth.uid, 'articles', article.id))
    // Remove from the in-memory list immediately so the UI updates without a refetch.
    articles.value = articles.value.filter(a => a.id !== article.id)
  } catch (e) {
    alert('Delete failed: ' + e.message)
  } finally {
    deletingId.value = ''
  }
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(loadList)
</script>

<style scoped>
.blog-edit { display: flex; flex-direction: column; gap: 24px; max-width: 880px; }

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
.actions { display: flex; gap: 8px; align-items: center; }

.article-list { display: flex; flex-direction: column; gap: 0; }
.article-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-soft);
}
.article-row:first-of-type { border-top: 1px solid var(--border-soft); }
.article-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  margin: 0 0 4px;
  font-weight: 500;
}
.article-title a { text-decoration: none; color: var(--ink); }
.article-title a:hover { color: var(--accent); }
.article-info {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
  font-family: var(--font-mono);
}
.status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(61, 107, 72, 0.1);
  color: var(--success);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.status--draft { background: var(--bg); color: var(--muted); }
.article-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.article-actions .btn { text-decoration: none; }

@media (max-width: 600px) {
  .article-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .article-actions { width: 100%; justify-content: flex-start; }
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}
</style>
