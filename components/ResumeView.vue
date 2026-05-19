<template>
  <div class="a4-stage" ref="stageRef">
    <div class="a4-page themed" ref="pageRef" :style="themeStyle">
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
import { getFont } from '~/utils/fonts'

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

// Resolve theme values from the resume doc, falling back to the original
// design tokens. We apply them as inline CSS custom properties on the page
// container — the .themed styles below consume them.
const themeStyle = computed(() => {
  const t = props.resume.theme || {}
  return {
    '--rt-display-font': getFont(t.displayFont, 'resumeDisplay').cssFamily,
    '--rt-body-font': getFont(t.bodyFont, 'resumeBody').cssFamily,
    '--rt-accent': t.accent || '#7a4f3a',
    '--rt-paper': t.paper || '#ffffff',
    '--rt-ink': t.ink || '#1a1d24',
    '--rt-header-bg': t.headerBg || '#f3eee5',
    '--rt-sidebar-bg': t.sidebarBg || '#ece6da',
    '--rt-photo-bg': t.photoBg || '#2a2722'
  }
})

function cleanItems(section) {
  const raw = section.itemsText != null
    ? section.itemsText
    : (section.items || []).join('\n')
  return raw.split('\n').map(l => l.trim()).filter(Boolean)
}

defineExpose({ stageRef, pageRef })
</script>

<style scoped>
/* Themed overrides — these take precedence over the global .a4-page rules in
   assets/main.css. We only override the bits that are theme-driven; the grid
   layout, dimensions, and structural styles stay in the global stylesheet. */

.a4-page.themed { background: var(--rt-paper); }

.themed .a4-top-left { background: var(--rt-photo-bg); }

.themed .a4-top-right {
  background: var(--rt-header-bg);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
}
.themed .a4-top-right .name {
  font-family: var(--rt-display-font);
  color: var(--rt-ink);
}
.themed .a4-top-right .title { color: var(--rt-ink); opacity: 0.7; }
.themed .a4-top-right .contact { color: var(--rt-ink); opacity: 0.75; }
.themed .a4-top-right .contact span::before { color: var(--rt-accent); }

.themed .a4-bottom-left {
  background: var(--rt-sidebar-bg);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
}
.themed .a4-bottom-left .section-title {
  font-family: var(--rt-display-font);
  color: var(--rt-accent);
}
.themed .a4-bottom-left li { border-bottom-color: rgba(0, 0, 0, 0.12); }

.themed .a4-bottom-right {
  background: var(--rt-paper);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
}
.themed .a4-bottom-right .section-title {
  font-family: var(--rt-display-font);
  color: var(--rt-ink);
  border-bottom-color: var(--rt-accent);
}
</style>
