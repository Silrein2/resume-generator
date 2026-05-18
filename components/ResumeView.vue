<template>
  <div class="a4-stage" ref="stageRef">
    <div class="a4-page" ref="pageRef">
      <!-- Top-left: profile image (15% × 15%) -->
      <div class="a4-top-left">
        <img v-if="resume.profileImageUrl" :src="resume.profileImageUrl" alt="Profile" />
        <span v-else class="placeholder">{{ initials }}</span>
      </div>

      <!-- Top-right: title, phone, email -->
      <div class="a4-top-right">
        <h1 class="name">{{ resume.name || '—' }}</h1>
        <p class="title">{{ resume.title || 'Title' }}</p>
        <div class="contact">
          <span v-if="resume.phone">{{ resume.phone }}</span>
          <span v-if="resume.email">{{ resume.email }}</span>
          <span v-if="resume.location">{{ resume.location }}</span>
        </div>
      </div>

      <!-- Bottom-left: simplified sections (skills, languages, etc.) -->
      <aside class="a4-bottom-left">
        <div
          v-for="section in resume.leftSections"
          :key="section.id"
          class="section"
        >
          <h3 class="section-title">{{ section.title }}</h3>
          <ul>
            <li v-for="(item, i) in cleanItems(section)" :key="i">{{ item }}</li>
          </ul>
        </div>
      </aside>

      <!-- Bottom-right: editable-title sections -->
      <main class="a4-bottom-right">
        <div
          v-for="section in resume.rightSections"
          :key="section.id"
          class="section"
        >
          <h3 class="section-title">{{ section.title }}</h3>
          <div class="section-body">{{ section.body }}</div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  resume: { type: Object, required: true }
})

const stageRef = ref(null)
const pageRef = ref(null)

const initials = computed(() => {
  const n = (props.resume.name || '').trim()
  if (!n) return '·'
  return n.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase()
})

// Skip blank/whitespace-only entries when rendering the sidebar lists.
// Accepts either a section with `itemsText` (live editor buffer — a raw string
// with newlines) or with `items` (the saved array form). This lets the same
// component render in the dashboard preview and on the public /u/:slug page.
function cleanItems(section) {
  const raw = section.itemsText != null
    ? section.itemsText
    : (section.items || []).join('\n')
  return raw.split('\n').map(l => l.trim()).filter(Boolean)
}

defineExpose({ stageRef, pageRef })
</script>
