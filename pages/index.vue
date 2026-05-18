<template>
  <div class="home">
    <div class="home-inner">
      <div class="brand">
        <span class="brand-mark">R</span>
        <span class="brand-divider">·</span>
        <span class="brand-text">Resume &amp; Notes</span>
      </div>

      <h1 class="lede">
        A quiet place for your<br />
        <em>résumé</em> and your <em>writing</em>.
      </h1>

      <p class="sub">
        Each editor gets a single, well-tended page on the open web — paper-grade
        formatting, a small blog beside it, and a link to send to whoever's asking.
      </p>

      <div class="cta-row">
        <NuxtLink to="/login" class="btn">Sign in</NuxtLink>
        <NuxtLink to="/register" class="btn btn--ghost">Register with token</NuxtLink>
      </div>

      <p class="hint">
        Looking for someone's profile? Open the link they shared with you — it looks like
        <code>/u/their-handle</code>.
      </p>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Resume & Blog — a quiet place for your career page',
  meta: [
    { name: 'description', content: 'A personal résumé and blog tool with paper-grade formatting and shareable public links.' }
  ]
})
</script>

<style scoped>
.home {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background:
    radial-gradient(ellipse at 20% 10%, rgba(122, 79, 58, 0.06), transparent 50%),
    radial-gradient(ellipse at 80% 90%, rgba(26, 29, 36, 0.04), transparent 50%),
    var(--bg);
  min-height: 100vh;
}
.home-inner { max-width: 640px; text-align: left; }
.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 80px;
  font-size: 13px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.brand-mark {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  color: var(--ink);
  line-height: 1;
}
.brand-divider { color: var(--accent); }

.lede {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
  color: var(--ink);
}
.lede em { font-style: italic; color: var(--accent); font-weight: 500; }

.sub {
  font-size: 1.05rem;
  color: var(--ink-soft);
  line-height: 1.6;
  max-width: 52ch;
  margin: 0 0 36px;
}

.cta-row { display: flex; gap: 12px; flex-wrap: wrap; }

.hint {
  margin-top: 60px;
  font-size: 0.85rem;
  color: var(--muted);
  border-top: 1px solid var(--border-soft);
  padding-top: 20px;
}
.hint code {
  font-family: var(--font-mono);
  background: var(--surface-2);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85em;
  color: var(--ink);
}
</style>
