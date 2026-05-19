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

      <!-- Style card: per-article font and colors -->
      <div class="card">
        <div class="card-h">
          <h3 class="section-h">Style</h3>
          <button class="btn btn--ghost btn--small" @click="resetTheme">Reset to defaults</button>
        </div>
        <p class="muted-note">Choose how this article looks. The preview below updates live.</p>

        <div class="row-2">
          <FontPicker
            v-model="article.theme.font"
            label="Font"
            context="article"
            inline
          />
          <div /> <!-- spacer -->
        </div>

        <div class="theme-row">
          <ColorPicker
            v-model="article.theme.background"
            label="Background"
            :palette="articleBackgrounds"
          />
          <ColorPicker
            v-model="article.theme.text"
            label="Text color"
            :palette="articleTexts"
          />
          <ColorPicker
            v-model="article.theme.accent"
            label="Accent (links, quotes)"
            :palette="articleAccents"
          />
        </div>
      </div>

      <div class="field">
        <label>Body</label>
        <BlogEditor v-model="article.content" :article-id="String(articleId)" />
      </div>

      <!-- Live preview so the user can see fonts/colors applied in context -->
      <div class="field preview-field">
        <label>Preview</label>
        <article
          class="article-preview"
          :style="previewStyle"
        >
          <h1 :style="{ fontFamily: previewStyle.fontFamily }">{{ article.title || 'Untitled' }}</h1>
          <div class="article-body" v-html="article.content || '<p><em>Start writing in the editor above…</em></p>'" />
        </article>
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
  collection, doc, getDoc, deleteDoc,
  serverTimestamp, addDoc, updateDoc
} from 'firebase/firestore'
import { getFont } from '~/utils/fonts'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })
useHead({ title: 'Edit article — Dashboard' })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const articleId = computed(() => route.params.articleId)
const isNew = ref(false)

// Default article theme — used for new articles and as the reset target.
const DEFAULT_THEME = {
  font: 'public-sans',
  background: '#ffffff',
  text: '#1a1d24',
  accent: '#7a4f3a'
}

const articleBackgrounds = [
  { value: '#ffffff', label: 'White' },
  { value: '#fbfaf7', label: 'Bone' },
  { value: '#f3eee5', label: 'Cream' },
  { value: '#ece6da', label: 'Warm grey' },
  { value: '#1f1f23', label: 'Dark ink' },
  { value: '#2a2722', label: 'Espresso' }
]
const articleTexts = [
  { value: '#1a1d24', label: 'Ink' },
  { value: '#2a2722', label: 'Espresso' },
  { value: '#3d3d3d', label: 'Charcoal' },
  { value: '#f3eee5', label: 'Cream' },
  { value: '#ffffff', label: 'White' }
]
const articleAccents = [
  { value: '#7a4f3a', label: 'Rust' },
  { value: '#3d6b48', label: 'Forest' },
  { value: '#34556d', label: 'Steel blue' },
  { value: '#6c4a86', label: 'Plum' },
  { value: '#9b3232', label: 'Brick' },
  { value: '#1a1d24', label: 'Ink' }
]

const article = reactive({
  title: '',
  content: '',
  published: false,
  theme: { ...DEFAULT_THEME }
})
const loadErr = ref('')
const saving = ref(false)
const saved = ref(false)
const savedAt = ref('')

// Inline style for the live preview — maps theme keys to CSS properties.
const previewStyle = computed(() => ({
  fontFamily: getFont(article.theme.font, 'article').cssFamily,
  background: article.theme.background,
  color: article.theme.text,
  '--article-accent': article.theme.accent
}))

function resetTheme() {
  Object.assign(article.theme, DEFAULT_THEME)
}

async function loadOne(id) {
  loadErr.value = ''
  if (id === 'new') {
    isNew.value = true
    article.title = ''
    article.content = ''
    article.published = false
    Object.assign(article.theme, DEFAULT_THEME)
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
  // Merge with defaults so older articles without a theme still get sane values.
  Object.assign(article.theme, DEFAULT_THEME, d.theme || {})
}

async function save() {
  if (!auth.uid) return
  saving.value = true
  try {
    const payload = {
      title: article.title || 'Untitled',
      content: article.content,
      published: article.published,
      theme: { ...article.theme },
      updatedAt: serverTimestamp()
    }
    if (isNew.value) {
      const refDoc = await addDoc(collection(useDb(), 'users', auth.uid, 'articles'), {
        ...payload,
        createdAt: serverTimestamp()
      })
      router.replace(`/dashboard/blog/${refDoc.id}`)
    } else {
      await updateDoc(doc(useDb(), 'users', auth.uid, 'articles', articleId.value), payload)
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

.card-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.section-h {
  font-family: var(--font-display);
  font-size: 1.1rem;
  margin: 0;
}
.muted-note {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 12px;
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}
@media (max-width: 600px) { .row-2 { grid-template-columns: 1fr; } }
.theme-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px 12px;
}

/* Live preview */
.preview-field { display: flex; flex-direction: column; gap: 6px; }
.preview-field label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.article-preview {
  padding: 32px 36px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  min-height: 200px;
  line-height: 1.7;
  transition: background 200ms ease, color 200ms ease;
}
.article-preview h1 {
  font-size: 1.8rem;
  margin: 0 0 16px;
  font-weight: 500;
  color: inherit;
}
.article-preview :deep(a) { color: var(--article-accent); }
.article-preview :deep(blockquote) {
  border-left: 3px solid var(--article-accent);
}
.article-preview :deep(p),
.article-preview :deep(li) { color: inherit; }
.article-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
  margin: 12px 0;
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
