<template>
  <div class="auth-page">
    <div class="auth-card">
      <NuxtLink to="/" class="back">← Home</NuxtLink>
      <h2 class="auth-title">Register</h2>
      <p class="auth-sub">You'll need a registration token from an admin.</p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label>Registration token</label>
          <input v-model="token" type="text" required class="input" placeholder="e.g. ab1c2d3e4f5g" />
          <small class="hint">Ask an admin to generate one for you.</small>
        </div>

        <div class="field">
          <label>Display name</label>
          <input v-model="displayName" type="text" required class="input" placeholder="Jane Doe" />
        </div>

        <div class="field">
          <label>URL handle (your shareable slug)</label>
          <input v-model="slugChoice" type="text" required class="input" placeholder="jane-doe"
                 pattern="[a-z0-9-]{2,40}" @input="cleanSlug" />
          <small class="hint">Your public link will be <code>/u/{{ slugChoice || 'your-handle' }}</code></small>
        </div>

        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" required class="input" autocomplete="email" />
        </div>

        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" required minlength="8" class="input" autocomplete="new-password" />
          <small class="hint">At least 8 characters.</small>
        </div>

        <p v-if="error" class="notice notice--error">{{ error }}</p>

        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="alt">
        Already have an account? <NuxtLink to="/login">Sign in →</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({ middleware: 'guest' })

useHead({ title: 'Register — PageOne' })

const auth = useAuthStore()
const router = useRouter()

const token = ref('')
const displayName = ref('')
const slugChoice = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function cleanSlug() {
  slugChoice.value = slugChoice.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
}

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register({
      email: email.value,
      password: password.value,
      slugChoice: slugChoice.value,
      displayName: displayName.value,
      token: token.value
    })
    router.replace('/dashboard/resume')
  } catch (e) {
    error.value = humanize(e)
  } finally {
    loading.value = false
  }
}

function humanize(e) {
  const code = e.code || ''
  if (code.includes('email-already-in-use')) return 'An account already exists for that email.'
  if (code.includes('weak-password')) return 'Password is too weak. Use 8+ characters.'
  if (code.includes('invalid-email')) return 'That email looks invalid.'
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
  max-width: 460px;
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
.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}
.hint code {
  font-family: var(--font-mono);
  background: var(--bg);
  padding: 1px 5px;
  border-radius: 3px;
}
.alt {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-soft);
  font-size: 14px;
  color: var(--ink-soft);
}
</style>
