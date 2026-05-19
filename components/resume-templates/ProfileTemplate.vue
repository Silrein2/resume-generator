<template>
  <div class="tmpl-profile">
    <!-- Left: full-height sidebar with photo + contact + list sections -->
    <aside class="sidebar">
      <div class="photo">
        <img v-if="resume.profileImageUrl" :src="resume.profileImageUrl" alt="Profile" />
        <span v-else class="placeholder">{{ initialsOf(resume.name) }}</span>
      </div>

      <div class="contact-block">
        <p v-if="resume.email" class="contact-line"><span class="lbl">Email</span> {{ resume.email }}</p>
        <p v-if="resume.phone" class="contact-line"><span class="lbl">Phone</span> {{ resume.phone }}</p>
        <p v-if="resume.location" class="contact-line"><span class="lbl">Location</span> {{ resume.location }}</p>
      </div>

      <div v-for="section in resume.leftSections" :key="section.id" class="side-section">
        <h3 class="side-title">{{ section.title }}</h3>
        <ul>
          <li v-for="(item, i) in cleanItems(section)" :key="i">{{ item }}</li>
        </ul>
      </div>
    </aside>

    <!-- Right: header + main content -->
    <main class="main">
      <header class="main-head">
        <h1 class="name">{{ resume.name || '—' }}</h1>
        <p v-if="resume.title" class="title">{{ resume.title }}</p>
      </header>

      <section
        v-for="section in resume.rightSections"
        :key="section.id"
        class="section"
      >
        <h2 class="section-title">{{ section.title }}</h2>
        <div class="section-body">{{ section.body }}</div>
      </section>
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
.tmpl-profile {
  flex: 1;
  background: var(--rt-paper);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
  display: grid;
  grid-template-columns: 32% 1fr;
}

/* ---- Sidebar ---- */
.sidebar {
  background: var(--rt-sidebar-bg);
  color: var(--rt-ink);
  padding: 32px 22px;
  font-size: 0.75rem;
  line-height: 1.5;
}

.photo {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 20px;
  background: var(--rt-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--rt-accent);
  max-width: 160px;
}
.photo img { width: 100%; height: 100%; object-fit: cover; }
.photo .placeholder {
  font-family: var(--rt-display-font);
  font-size: 2.5rem;
  color: var(--rt-accent);
  opacity: 0.7;
}

.contact-block {
  margin: 0 0 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.contact-line {
  margin: 0 0 6px;
  font-size: 0.7rem;
  word-break: break-word;
}
.lbl {
  display: block;
  font-family: var(--rt-display-font);
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--rt-accent);
  margin-bottom: 2px;
}

.side-section + .side-section { margin-top: 18px; }
.side-title {
  font-family: var(--rt-display-font);
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin: 0 0 8px;
  color: var(--rt-accent);
}
.sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sidebar li {
  padding: 3px 0;
  font-size: 0.72rem;
}

/* ---- Main column ---- */
.main {
  padding: 38px 38px 30px;
  font-size: 0.85rem;
  line-height: 1.6;
}
.main-head { margin-bottom: 26px; }
.name {
  font-family: var(--rt-display-font);
  font-size: 2.2rem;
  font-weight: 500;
  margin: 0 0 4px;
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--rt-ink);
}
.title {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.72;
  letter-spacing: 0.04em;
}

.section + .section { margin-top: 22px; }
.section-title {
  font-family: var(--rt-display-font);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--rt-ink);
  position: relative;
  padding-left: 14px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.4em;
  width: 6px;
  height: 6px;
  background: var(--rt-accent);
  border-radius: 50%;
}
.section-body { white-space: pre-wrap; }
</style>
