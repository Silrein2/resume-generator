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

    <!-- Editor + preview side-by-side -->
    <div class="edit-grid">
      <!-- Form -->
      <section class="edit-form">
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
      <section class="edit-preview no-print">
        <div class="preview-frame">
          <header class="preview-controls">
            <span class="preview-label">Preview</span>
            <div class="zoom-controls">
              <button
                class="zoom-btn"
                @click="zoomOut"
                :disabled="previewScale <= MIN_SCALE"
                title="Zoom out"
              >−</button>
              <input
                type="range"
                :min="MIN_SCALE * 100"
                :max="MAX_SCALE * 100"
                step="5"
                :value="previewScale * 100"
                @input="onSliderInput"
                class="zoom-slider"
                aria-label="Preview zoom"
              />
              <button
                class="zoom-btn"
                @click="zoomIn"
                :disabled="previewScale >= MAX_SCALE"
                title="Zoom in"
              >+</button>
              <span class="zoom-value">{{ Math.round(previewScale * 100) }}%</span>
              <button class="btn btn--ghost btn--small zoom-reset" @click="resetZoom" title="Reset to fit">
                Fit
              </button>
            </div>
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

const resume = reactive({
  profileImageUrl: '',
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  leftSections: [],
  rightSections: [],
  published: false
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

function zoomIn() {
  previewScale.value = Math.min(MAX_SCALE, +(previewScale.value + 0.05).toFixed(2))
}
function zoomOut() {
  previewScale.value = Math.max(MIN_SCALE, +(previewScale.value - 0.05).toFixed(2))
}
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
function onSliderInput(e) {
  const v = parseInt(e.target.value, 10)
  previewScale.value = v / 100
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
@media (max-width: 1100px) {
  .edit-grid { grid-template-columns: 1fr; }
  .edit-preview { order: -1; }
  .preview-viewport { max-height: 70vh !important; }
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
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.zoom-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-soft);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms ease;
}
.zoom-btn:hover:not(:disabled) {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
.zoom-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.zoom-slider {
  flex: 0 0 110px;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--border);
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}
.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
.zoom-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
.zoom-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-soft);
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.zoom-reset { margin-left: 4px; }

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
