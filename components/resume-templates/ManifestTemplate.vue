<template>
  <div class="tmpl-manifest">
    <header class="head">
      <h1 class="name">{{ resume.name || '—' }}<span class="dot">.</span></h1>
      <div class="head-meta">
        <p v-if="resume.title" class="title">{{ resume.title }}</p>
        <p class="contact">{{ contactLine(resume) }}</p>
      </div>
    </header>

    <hr class="rule" />

    <section
      v-for="section in resume.rightSections"
      :key="section.id"
      class="section section--prose"
    >
      <h2 class="section-title">{{ section.title }}</h2>
      <div class="section-body">{{ section.body }}</div>
    </section>

    <section
      v-for="section in resume.leftSections"
      :key="section.id"
      class="section section--list"
    >
      <h2 class="section-title">{{ section.title }}</h2>
      <p class="inline-list">{{ cleanItems(section).join('  ·  ') }}</p>
    </section>
  </div>
</template>

<script setup>
import { cleanItems, contactLine } from '~/utils/resume-helpers'

defineProps({
  resume: { type: Object, required: true }
})
</script>

<style scoped>
.tmpl-manifest {
  flex: 1;
  background: var(--rt-paper);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
  padding: 80px 72px 60px;
  font-size: 0.88rem;
  line-height: 1.65;
}

.head {
  margin-bottom: 28px;
}
.name {
  font-family: var(--rt-display-font);
  font-size: 3.6rem;
  font-weight: 400;
  font-style: italic;
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin: 0 0 14px;
  color: var(--rt-ink);
}
.name .dot {
  color: var(--rt-accent);
  font-style: normal;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 0.85rem;
  align-items: baseline;
}
.title {
  margin: 0;
  font-style: italic;
  opacity: 0.85;
  flex-shrink: 0;
}
.title::after {
  content: '·';
  margin-left: 14px;
  color: var(--rt-accent);
}
.contact {
  margin: 0;
  opacity: 0.65;
  font-size: 0.78rem;
}

.rule {
  border: 0;
  height: 1px;
  background: var(--rt-ink);
  opacity: 0.18;
  margin: 0 0 36px;
}

.section + .section { margin-top: 32px; }

.section-title {
  font-family: var(--rt-display-font);
  font-size: 1.2rem;
  font-weight: 500;
  font-style: italic;
  margin: 0 0 12px;
  color: var(--rt-accent);
}

.section-body { white-space: pre-wrap; }

.inline-list {
  margin: 0;
  font-size: 0.85rem;
}

.section--list + .section--list { margin-top: 14px; }
</style>
