<script setup>
// /dashboard with no sub-path redirects straight to /dashboard/resume.
definePageMeta({
  middleware: [
    'auth',
    () => navigateTo('/dashboard/resume', { replace: true })
  ],
  layout: 'dashboard'
})
</script>

<template>
  <div />
</template>
