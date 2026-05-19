<template>
  <div class="tmpl-editorial">
    <!-- Top-left: profile image (15% × 15%) -->
    <div class="cell cell-tl">
      <img v-if="resume.profileImageUrl" :src="resume.profileImageUrl" alt="Profile" />
      <span v-else class="placeholder">{{ initialsOf(resume.name) }}</span>
    </div>

    <!-- Top-right: title, phone, email -->
    <div class="cell cell-tr">
      <h1 class="name">{{ resume.name || '—' }}</h1>
      <p class="title">{{ resume.title || 'Title' }}</p>
      <div class="contact">
        <span v-if="resume.phone">{{ resume.phone }}</span>
        <span v-if="resume.email">{{ resume.email }}</span>
        <span v-if="resume.location">{{ resume.location }}</span>
      </div>
    </div>

    <!-- Bottom-left: sidebar (skills, languages, etc.) -->
    <aside class="cell cell-bl">
      <div v-for="section in resume.leftSections" :key="section.id" class="section">
        <h3 class="section-title">{{ section.title }}</h3>
        <ul>
          <li v-for="(item, i) in cleanItems(section)" :key="i">{{ item }}</li>
        </ul>
      </div>
    </aside>

    <!-- Bottom-right: main sections (Experience, Education, etc.) -->
    <main class="cell cell-br">
      <div v-for="section in resume.rightSections" :key="section.id" class="section">
        <h3 class="section-title">{{ section.title }}</h3>
        <div class="section-body">{{ section.body }}</div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { cleanItems, initialsOf } from '~/utils/resume-helpers'

defineProps({
  resume: { type: Object, required: true }
})
</script>

<style scoped>
.tmpl-editorial {
  /* Fill the .a4-page's min-height via flex: 1. Internal layout is a 15/15
     grid that maps onto the page's full dimensions. */
  flex: 1;
  display: grid;
  grid-template-rows: 15% 1fr;
  grid-template-columns: 15% 1fr;
}
.cell { overflow: hidden; }

/* Top-left: photo cell */
.cell-tl {
  background: var(--rt-photo-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}
.cell-tl img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 2px;
}
.cell-tl .placeholder {
  font-family: var(--rt-display-font);
  font-size: 2rem;
  color: var(--rt-photo-bg);
  filter: invert(1) grayscale(1) opacity(0.6);
}

/* Top-right: header */
.cell-tr {
  background: var(--rt-header-bg);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
  padding: 18px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.name {
  font-family: var(--rt-display-font);
  font-size: 1.8rem;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--rt-ink);
}
.title {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.7;
  letter-spacing: 0.04em;
}
.contact {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 4px;
  font-size: 0.78rem;
  opacity: 0.75;
}
.contact span::before {
  content: '— ';
  color: var(--rt-accent);
}

/* Bottom-left: sidebar */
.cell-bl {
  background: var(--rt-sidebar-bg);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
  padding: 22px 14px;
  font-size: 0.72rem;
  line-height: 1.45;
}
.cell-bl .section + .section { margin-top: 18px; }
.cell-bl .section-title {
  font-family: var(--rt-display-font);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 8px;
  color: var(--rt-accent);
}
.cell-bl ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.cell-bl li {
  padding: 3px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.15);
}
.cell-bl li:last-child { border-bottom: none; }

/* Bottom-right: main */
.cell-br {
  background: var(--rt-paper);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
  padding: 24px 32px;
  font-size: 0.82rem;
  line-height: 1.55;
}
.cell-br .section + .section { margin-top: 20px; }
.cell-br .section-title {
  font-family: var(--rt-display-font);
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 8px;
  padding-bottom: 4px;
  border-bottom: 1.5px solid var(--rt-accent);
  display: inline-block;
}
.cell-br .section-body { white-space: pre-wrap; }
</style>
