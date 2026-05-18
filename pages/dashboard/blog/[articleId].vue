<template>
  <div class="blog-edit">
    <header class="page-header">
      <div>
        <p class="kicker">02 — Blog</p>
        <h2>{{ isNew ? 'New article' : 'Edit article' }}</h2>
      </div>
      <div class="actions">
        <NuxtLink to="/dashboard/blog" class="btn btn--ghost btn--small">← Back to list</NuxtLink>
        <button v-if="!isNew" class="btn btn--ghost btn--small btn--danger" @click="del">Delete</button>
        <button class="btn btn--small" @click="save" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </header>

    <div class="article-editor">
      <p v-if="loadErr" class="notice notice--error">{{ loadErr }}</p>

      <div class="field title-field">
        <label>Title</label>
        <input v-model="article.title" class="input title-input" placeholder="Untitled" />
      </div>

      <div class="field">
        <label>Body</label>
        <BlogEditor v-model="article.content" :article-id="String(articleId)" />
      </div>

      <div class="publish-row">
        <label class="publish-toggle">
          <input type="checkbox" v-model="article.published" />
          <span>Published (visible on your public blog)</span>
        </label>
        <span v-if="saved" class="save-status">Saved · {{ savedAt }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  collection, doc, getDoc, setDoc, deleteDoc,
  serverTimestamp, addDoc, updateDoc
} from 'firebase/firestore'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })
useHead({ title: 'Edit article — Dashboard' })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const articleId = computed(() => route.params.articleId)
const isNew = ref(false)

const article = reactive({ title: '', content: '', published: false })
const loadErr = ref('')
const saving = ref(false)
const saved = ref(false)
const savedAt = ref('')

async function loadOne(id) {
  loadErr.value = ''
  if (id === 'new') {
    isNew.value = true
    article.title = ''
    article.content = ''
    article.published = false
    return
  }
  isNew.value = false
  if (!auth.uid) return
  const snap = await getDoc(doc(useDb(), 'users', auth.uid, 'articles', id))
  if (!snap.exists()) { loadErr.value = 'Article not found.'; return }
  const d = snap.data()
  article.title = d.title || ''
  article.content = d.content || ''
  article.published = !!d.published
}

async function save() {
  if (!auth.uid) return
  saving.value = true
  try {
    if (isNew.value) {
      const refDoc = await addDoc(collection(useDb(), 'users', auth.uid, 'articles'), {
        title: article.title || 'Untitled',
        content: article.content,
        published: article.published,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      router.replace(`/dashboard/blog/${refDoc.id}`)
    } else {
      await updateDoc(doc(useDb(), 'users', auth.uid, 'articles', articleId.value), {
        title: article.title || 'Untitled',
        content: article.content,
        published: article.published,
        updatedAt: serverTimestamp()
      })
    }
    saved.value = true
    savedAt.value = new Date().toLocaleTimeString()
    setTimeout(() => saved.value = false, 2200)
  } catch (e) {
    alert('Save failed: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function del() {
  if (!confirm('Delete this article? This cannot be undone.')) return
  await deleteDoc(doc(useDb(), 'users', auth.uid, 'articles', articleId.value))
  router.replace('/dashboard/blog')
}

watch(() => route.params.articleId, async (id) => {
  if (id) await loadOne(id)
})

onMounted(async () => {
  if (articleId.value) await loadOne(articleId.value)
})
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

.article-editor { display: flex; flex-direction: column; gap: 16px; }
.title-input {
  font-family: var(--font-display);
  font-size: 1.8rem;
  padding: 14px 16px;
  font-weight: 500;
}
.publish-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}
.publish-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--ink-soft);
  cursor: pointer;
}
.save-status {
  font-size: 12px;
  color: var(--ink-soft);
  font-family: var(--font-mono);
}
</style>
