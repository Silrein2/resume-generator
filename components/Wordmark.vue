<template>
  <component
    :is="tag"
    :to="tag === 'NuxtLink' ? '/' : undefined"
    :class="['wordmark', `wordmark--${size}`, { 'wordmark--inverse': inverse }]"
  >
    <span class="wm-page">Page</span><span class="wm-one">One</span>
  </component>
</template>

<script setup>
defineProps({
  size: { type: String, default: 'md' }, // 'sm' | 'md' | 'lg'
  // If true, swaps the colors for use on dark backgrounds
  inverse: { type: Boolean, default: false },
  // Whether this is a link or just text
  tag: { type: String, default: 'NuxtLink' }
})
</script>

<style scoped>
.wordmark {
  font-family: var(--font-display);
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: baseline;
  letter-spacing: -0.01em;
  line-height: 1;
  white-space: nowrap;
}
.wm-page { color: var(--ink); }
.wm-one {
  color: var(--accent);
  font-style: italic;
  font-weight: 400;
  margin-left: 0.5px;
}

.wordmark--sm { font-size: 16px; }
.wordmark--md { font-size: 22px; }
.wordmark--lg { font-size: 32px; }

.wordmark--inverse .wm-page { color: var(--bg); }
.wordmark--inverse .wm-one { color: var(--accent-soft); }

.wordmark:hover .wm-page { color: var(--accent); }
.wordmark:hover .wm-one { color: var(--ink); }
</style>
