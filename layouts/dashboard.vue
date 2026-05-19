<template>
  <div class="dash">
    <!-- Mobile-only top bar with hamburger -->
    <div class="dash-mobile-bar">
      <button
        class="hamburger"
        :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span /><span /><span />
      </button>
      <Wordmark size="sm" />
      <div class="mobile-bar-spacer" />
    </div>

    <!-- Sidebar — sticky on desktop, slide-out drawer on mobile -->
    <aside
      class="dash-side"
      :class="{ 'dash-side--open': menuOpen }"
      @click.self="menuOpen = false"
    >
      <div class="dash-side-inner">
        <div class="dash-brand">
          <Wordmark size="md" />
        </div>

        <nav class="dash-nav">
          <NuxtLink to="/dashboard/resume" class="nav-item" @click="menuOpen = false">
            <span class="num">01</span> Resume
          </NuxtLink>
          <NuxtLink to="/dashboard/blog" class="nav-item" @click="menuOpen = false">
            <span class="num">02</span> Blog
          </NuxtLink>
          <NuxtLink to="/dashboard/settings" class="nav-item" @click="menuOpen = false">
            <span class="num">03</span> Settings
          </NuxtLink>
          <NuxtLink v-if="auth.isAdmin" to="/dashboard/admin" class="nav-item nav-item--accent" @click="menuOpen = false">
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
      </div>
    </aside>

    <!-- Backdrop — mobile only when drawer is open -->
    <div v-if="menuOpen" class="dash-backdrop" @click="menuOpen = false" />

    <main class="dash-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const menuOpen = ref(false)

// Close the drawer whenever the route changes (e.g. user taps a nav link)
watch(() => route.fullPath, () => { menuOpen.value = false })

// Close on Escape key for keyboard users
function onKey(e) {
  if (e.key === 'Escape') menuOpen.value = false
}
onMounted(() => { if (import.meta.client) window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { if (import.meta.client) window.removeEventListener('keydown', onKey) })

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

.dash-mobile-bar { display: none; }

.dash-side {
  background: var(--surface);
  border-right: 1px solid var(--border-soft);
  position: sticky;
  top: 0;
  height: 100vh;
}

.dash-side-inner {
  display: flex;
  flex-direction: column;
  padding: 28px 20px;
  height: 100%;
}

.dash-brand { margin-bottom: 40px; }

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
.user-block { font-size: 13px; }
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

.dash-backdrop { display: none; }

/* ============================================================
   Mobile — sidebar becomes a slide-in drawer triggered by the
   hamburger in the top bar. Backdrop dims the main content
   while the drawer is open.
   ============================================================ */
@media (max-width: 760px) {
  .dash { grid-template-columns: 1fr; }

  .dash-mobile-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--surface);
    border-bottom: 1px solid var(--border-soft);
    position: sticky;
    top: 0;
    z-index: 30;
  }
  .mobile-bar-spacer { flex: 1; }

  .hamburger {
    width: 36px;
    height: 36px;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: var(--radius);
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    padding: 0;
  }
  .hamburger span {
    display: block;
    width: 18px;
    height: 2px;
    background: var(--ink);
    border-radius: 1px;
  }

  .dash-side {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 260px;
    height: 100vh;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 220ms ease;
    box-shadow: var(--shadow-lg);
  }
  .dash-side--open { transform: translateX(0); }

  .dash-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(26, 29, 36, 0.4);
    z-index: 40;
    animation: fade-in 160ms ease;
  }

  .dash-main { padding: 20px 16px; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
