<template>
  <ClientOnly>
    <div class="tiptap-shell">
      <div v-if="editor" class="tiptap-toolbar">
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          title="Heading"
        >H2</button>
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          title="Subheading"
        >H3</button>
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
        ><strong>B</strong></button>
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
        ><em>I</em></button>
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
        ><s>S</s></button>
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >&ldquo;&nbsp;Quote</button>
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
        >• List</button>
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >1. List</button>
        <button
          type="button"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >Code</button>
        <button type="button" @click="addLink">Link</button>
        <button type="button" @click="triggerImageUpload" :disabled="uploading">
          {{ uploading ? 'Uploading…' : 'Image' }}
        </button>
        <button type="button" @click="editor.chain().focus().undo().run()">Undo</button>
        <button type="button" @click="editor.chain().focus().redo().run()">Redo</button>
      </div>
      <EditorContent :editor="editor" class="tiptap-content" />
      <input ref="fileInputRef" type="file" accept="image/*" hidden @change="onFileSelected" />
    </div>

    <template #fallback>
      <div class="tiptap-shell tiptap-fallback">Loading editor…</div>
    </template>
  </ClientOnly>
</template>

<script setup>
import { onBeforeUnmount, watch, ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const props = defineProps({
  modelValue: { type: String, default: '' },
  articleId: { type: String, default: 'draft' }
})
const emit = defineEmits(['update:modelValue'])

const auth = useAuthStore()
const fileInputRef = ref(null)
const uploading = ref(false)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Image.configure({ inline: false, allowBase64: false }),
    Link.configure({ openOnClick: false, autolink: true }),
    Placeholder.configure({ placeholder: 'Start writing your article…' })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  if (val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val || '', false)
  }
})

onBeforeUnmount(() => editor.value?.destroy())

function addLink() {
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previousUrl || 'https://')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function triggerImageUpload() {
  fileInputRef.value?.click()
}

async function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!auth.uid) { alert('Not signed in.'); return }
  uploading.value = true
  try {
    const path = `blog-images/${auth.uid}/${props.articleId}/${Date.now()}-${file.name}`
    const r = sRef(useStorage(), path)
    await uploadBytes(r, file)
    const url = await getDownloadURL(r)
    editor.value.chain().focus().setImage({ src: url, alt: file.name }).run()
  } catch (err) {
    alert('Image upload failed: ' + err.message)
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}
</script>

<style scoped>
.tiptap-fallback {
  padding: 40px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  min-height: 320px;
}
</style>
