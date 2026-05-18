<template>
  <div class="page">
    <div class="error-screen">
      <div class="content">
        <p class="kicker">{{ error?.statusCode || '500' }}</p>
        <h1>{{ headline }}</h1>
        <p class="sub">{{ subtitle }}</p>
        <button class="btn btn--ghost" @click="handleHome">← Home</button>
      </div>
    </div>
    <VersionBadge />
  </div>
</template>

<script setup>
const props = defineProps({
  error: Object
})

const headline = computed(() => {
  if (props.error?.statusCode === 404) return 'Not here.'
  return 'Something went wrong.'
})

const subtitle = computed(() => {
  if (props.error?.statusCode === 404) {
    return props.error?.statusMessage
      || "The page you're looking for doesn't exist — or has moved somewhere quieter."
  }
  return props.error?.statusMessage || 'An unexpected error occurred. Try again in a moment.'
})

function handleHome() {
  clearError({ redirect: '/' })
}

useHead({
  title: () => props.error?.statusCode === 404 ? 'Not found' : 'Error'
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.error-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: var(--bg);
}
.content { max-width: 480px; text-align: center; }
.kicker {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.18em;
  color: var(--accent);
  margin: 0 0 12px;
}
h1 {
  font-family: var(--font-display);
  font-size: 3rem;
  font-style: italic;
  font-weight: 400;
  margin: 0 0 16px;
}
.sub { color: var(--ink-soft); margin: 0 0 28px; }
</style>
