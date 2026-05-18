<template>
  <div class="dash">
    <aside class="dash-side">
      <div class="dash-brand">
        <NuxtLink to="/" class="brand-link">
          <span class="mark">R</span><span class="dot">·</span>
        </NuxtLink>
      </div>

      <nav class="dash-nav">
        <NuxtLink to="/dashboard/resume" class="nav-item">
          <span class="num">01</span> Resume
        </NuxtLink>
        <NuxtLink to="/dashboard/blog" class="nav-item">
          <span class="num">02</span> Blog
        </NuxtLink>
        <NuxtLink to="/dashboard/settings" class="nav-item">
          <span class="num">03</span> Settings
        </NuxtLink>
        <NuxtLink v-if="auth.isAdmin" to="/dashboard/admin" class="nav-item nav-item--accent">
          <span class="num">★</span> Admin
        </NuxtLink>
      </nav>

      <div class="dash-foot">
        <div class="user-block" v-if="auth.profile">
          <div class="user-name">{{ auth.profile.displayName || auth.profile.email }}</div>
          <div class="user-role">{{ auth.profile.role }}</div>
          <a v-if="auth.slug" :href="`/u/${auth.slug}`" target="_blank" class="user-link">
            View public page ↗
          </a>
        </div>
        <button class="btn btn--ghost btn--small" @click="signOut">Sign out</button>
      </div>
    </aside>

    <main class="dash-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
const auth = useAuthStore()
const router = useRouter()

async function signOut() {
  await auth.signOut()
  router.replace('/login')
}
</script>

<style scoped>
.dash {
  flex: 1;
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.dash-side {
  background: var(--surface);
  border-right: 1px solid var(--border-soft);
  display: flex;
  flex-direction: column;
  padding: 28px 20px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.dash-brand { margin-bottom: 40px; }
.brand-link {
  text-decoration: none;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}
.mark {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  color: var(--ink);
}
.dot { color: var(--accent); font-size: 24px; }

.dash-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }

.nav-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 12px;
  text-decoration: none;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius);
  border-left: 2px solid transparent;
  transition: all 120ms ease;
}
.nav-item .num {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.05em;
}
.nav-item:hover {
  color: var(--ink);
  background: var(--bg);
}
.nav-item.router-link-active {
  color: var(--ink);
  border-left-color: var(--accent);
  background: var(--surface-2);
}
.nav-item.router-link-active .num { color: var(--accent); }
.nav-item--accent .num { color: var(--accent); }

.dash-foot {
  border-top: 1px solid var(--border-soft);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.user-block {
  font-size: 13px;
}
.user-name { font-weight: 500; color: var(--ink); }
.user-role {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.1em;
  margin-top: 2px;
}
.user-link {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--accent);
  text-decoration: none;
}
.user-link:hover { text-decoration: underline; }

.dash-main {
  background: var(--bg);
  padding: 32px;
  overflow-x: auto;
  min-width: 0;
}

@media (max-width: 760px) {
  .dash { grid-template-columns: 1fr; }
  .dash-side {
    position: static;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 16px;
  }
  .dash-brand { margin: 0; }
  .dash-nav { flex-direction: row; flex: 1 1 100%; flex-wrap: wrap; }
  .dash-foot { flex-direction: row; align-items: center; border: 0; padding: 0; }
}
</style>
