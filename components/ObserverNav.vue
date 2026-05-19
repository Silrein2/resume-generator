<template>
  <header class="obs-nav no-print">
    <div class="obs-nav-inner">
      <div class="left">
        <Wordmark size="sm" />
        <span class="slug">/u/{{ slug }}</span>
      </div>

      <nav class="tabs">
        <NuxtLink :to="`/u/${slug}`" class="tab" :class="{ active: current === 'resume' }">
          Resume
        </NuxtLink>
        <NuxtLink :to="`/u/${slug}/blog`" class="tab" :class="{ active: current === 'blog' }">
          Blog
        </NuxtLink>
      </nav>

      <div class="right">
        <NuxtLink v-if="!auth.isSignedIn" to="/login" class="login-link">Login →</NuxtLink>
        <NuxtLink v-else to="/dashboard/resume" class="login-link">Your dashboard →</NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  slug: { type: String, required: true },
  current: { type: String, default: 'resume' }
})

const auth = useAuthStore()
</script>

<style scoped>
.obs-nav {
  background: var(--surface);
  border-bottom: 1px solid var(--border-soft);
  padding: 14px 0;
}
.obs-nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.left { display: flex; align-items: center; gap: 12px; }
.slug {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.tabs { display: flex; gap: 4px; }
.tab {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  color: var(--ink-soft);
  border-radius: var(--radius);
  letter-spacing: 0.04em;
}
.tab:hover { background: var(--bg); color: var(--ink); }
.tab.active {
  background: var(--ink);
  color: var(--bg);
}

.right .login-link {
  font-size: 13px;
  color: var(--ink-soft);
  text-decoration: none;
}
.right .login-link:hover { color: var(--accent); }

/* ============================================================
   Mobile portrait — tighten everything so the nav fits ~360px viewports.
   ============================================================ */
@media (max-width: 600px) {
  .obs-nav { padding: 10px 0; }
  .obs-nav-inner {
    padding: 0 12px;
    gap: 8px;
  }
  .slug { display: none; }
  .tab {
    padding: 6px 10px;
    font-size: 12px;
  }
  .right .login-link { font-size: 12px; }
}

@media (max-width: 380px) {
  .right .login-link { display: none; }
}
</style>
