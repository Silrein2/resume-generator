<template>
  <div class="tmpl-classic">
    <header class="head">
      <h1 class="name">{{ resume.name || '—' }}</h1>
      <p v-if="resume.title" class="title">{{ resume.title }}</p>
      <p class="contact">{{ contactLine(resume) || '\u00A0' }}</p>
    </header>

    <hr class="rule" />

    <!-- Main sections (Experience, Education, etc.) -->
    <section
      v-for="section in resume.rightSections"
      :key="section.id"
      class="section section--prose"
    >
      <h2 class="section-title">{{ section.title }}</h2>
      <div class="section-body">{{ section.body }}</div>
    </section>

    <!-- Left sections (Skills, Languages, etc.) — folded into the same column,
         rendered as middle-dot-separated lists since there's no sidebar. -->
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
.tmpl-classic {
  flex: 1;
  background: var(--rt-paper);
  color: var(--rt-ink);
  font-family: var(--rt-body-font);
  padding: 56px 64px;
  font-size: 0.85rem;
  line-height: 1.55;
}

.head {
  text-align: center;
  margin-bottom: 18px;
}
.name {
  font-family: var(--rt-display-font);
  font-size: 2.2rem;
  font-weight: 500;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
  color: var(--rt-ink);
}
.title {
  font-size: 0.95rem;
  margin: 0 0 6px;
  opacity: 0.75;
  letter-spacing: 0.04em;
}
.contact {
  font-family: var(--rt-body-font);
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.7;
  letter-spacing: 0.02em;
}

.rule {
  border: 0;
  height: 1px;
  background: var(--rt-accent);
  margin: 0 0 26px;
}

.section + .section { margin-top: 22px; }

.section-title {
  font-family: var(--rt-display-font);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  margin: 0 0 10px;
  color: var(--rt-accent);
}

.section-body { white-space: pre-wrap; }

.inline-list {
  margin: 0;
  font-size: 0.85rem;
}
</style>
