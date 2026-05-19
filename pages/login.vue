<template>
  <div class="auth-page">
    <div class="auth-card">
      <NuxtLink to="/" class="back">← Home</NuxtLink>
      <h2 class="auth-title">Sign in</h2>
      <p class="auth-sub">Editor and admin accounts only.</p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" required class="input" autocomplete="email" />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" required class="input" autocomplete="current-password" />
        </div>

        <p v-if="error" class="notice notice--error">{{ error }}</p>

        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>

        <button type="button" class="link-btn" @click="resetPassword">
          Forgot password?
        </button>
      </form>

      <p class="alt">
        New here? <NuxtLink to="/register">Register with a token →</NuxtLink>
      </p>

      <p v-if="resetMsg" class="notice notice--success" style="margin-top: 16px">{{ resetMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({ middleware: 'guest' })

useHead({ title: 'Sign in — PageOne' })

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const resetMsg = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.signIn({ email: email.value, password: password.value })
    const next = route.query.next || '/dashboard/resume'
    router.replace(next)
  } catch (e) {
    error.value = humanize(e)
  } finally {
    loading.value = false
  }
}

async function resetPassword() {
  resetMsg.value = ''
  error.value = ''
  if (!email.value) { error.value = 'Enter your email above first.'; return }
  try {
    await auth.sendReset(email.value)
    resetMsg.value = 'If an account exists for that email, a reset link is on its way.'
  } catch (e) {
    error.value = humanize(e)
  }
}

function humanize(e) {
  const code = e.code || ''
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential'))
    return 'Email or password is incorrect.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.'
  return e.message || String(e)
}
</script>

<style scoped>
.auth-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  min-height: 100vh;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 36px 32px;
  position: relative;
}
.back {
  position: absolute;
  top: 16px;
  left: 16px;
  font-size: 13px;
  text-decoration: none;
  color: var(--muted);
}
.back:hover { color: var(--ink); }
.auth-title {
  font-family: var(--font-display);
  font-size: 2rem;
  margin: 16px 0 4px;
}
.auth-sub { color: var(--ink-soft); margin-bottom: 28px; font-size: 14px; }
.btn { width: 100%; justify-content: center; }
.link-btn {
  background: none;
  border: none;
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 13px;
  margin-top: 12px;
  padding: 4px 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.link-btn:hover { color: var(--accent); }
.alt {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-soft);
  font-size: 14px;
  color: var(--ink-soft);
}
</style>
