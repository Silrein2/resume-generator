<template>
  <div class="settings">
    <header class="page-header">
      <p class="kicker">03 — Settings</p>
      <h2>Account settings</h2>
    </header>

    <div class="card">
      <h3 class="section-h">Profile</h3>

      <div class="field">
        <label>Display name</label>
        <input v-model="displayName" class="input" />
      </div>

      <div class="field">
        <label>Public URL handle</label>
        <input v-model="slugChoice" class="input" pattern="[a-z0-9-]{2,40}" @input="cleanSlug" />
        <small class="hint">Your link will be <code>/u/{{ slugChoice || 'your-handle' }}</code></small>
      </div>

      <p v-if="profileMsg" class="notice" :class="profileMsgKind === 'error' ? 'notice--error' : 'notice--success'">
        {{ profileMsg }}
      </p>
      <button class="btn" @click="saveProfile" :disabled="savingProfile">
        {{ savingProfile ? 'Saving…' : 'Save profile' }}
      </button>
    </div>

    <div class="card">
      <h3 class="section-h">Change email</h3>
      <p class="hint">
        We'll send a verification link to your new email. The change takes effect
        only after you click that link.
      </p>

      <div class="field">
        <label>Current email</label>
        <input :value="auth.user?.email" class="input" disabled />
      </div>
      <div class="field">
        <label>New email</label>
        <input v-model="newEmail" type="email" class="input" />
      </div>
      <div class="field">
        <label>Current password (to confirm)</label>
        <input v-model="emailPassword" type="password" class="input" />
      </div>

      <p v-if="emailMsg" class="notice" :class="emailMsgKind === 'error' ? 'notice--error' : 'notice--success'">
        {{ emailMsg }}
      </p>
      <button class="btn" @click="changeEmail" :disabled="changingEmail">
        {{ changingEmail ? 'Sending…' : 'Send verification link' }}
      </button>
    </div>

    <div class="card">
      <h3 class="section-h">Change password</h3>

      <div class="field">
        <label>Current password</label>
        <input v-model="oldPassword" type="password" class="input" autocomplete="current-password" />
      </div>
      <div class="field">
        <label>New password</label>
        <input v-model="newPassword" type="password" class="input" autocomplete="new-password" minlength="8" />
        <small class="hint">At least 8 characters.</small>
      </div>
      <div class="field">
        <label>Confirm new password</label>
        <input v-model="confirmPassword" type="password" class="input" autocomplete="new-password" />
      </div>

      <p v-if="passMsg" class="notice" :class="passMsgKind === 'error' ? 'notice--error' : 'notice--success'">
        {{ passMsg }}
      </p>
      <button class="btn" @click="changePass" :disabled="changingPass">
        {{ changingPass ? 'Updating…' : 'Update password' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  EmailAuthProvider, reauthenticateWithCredential,
  verifyBeforeUpdateEmail, updatePassword
} from 'firebase/auth'
import { doc, updateDoc, query, where, getDocs, collection, limit } from 'firebase/firestore'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })
useHead({ title: 'Settings — Dashboard' })

const auth = useAuthStore()

const displayName = ref('')
const slugChoice = ref('')
const savingProfile = ref(false)
const profileMsg = ref('')
const profileMsgKind = ref('')

const newEmail = ref('')
const emailPassword = ref('')
const changingEmail = ref(false)
const emailMsg = ref('')
const emailMsgKind = ref('')

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const changingPass = ref(false)
const passMsg = ref('')
const passMsgKind = ref('')

onMounted(() => {
  displayName.value = auth.profile?.displayName || ''
  slugChoice.value = auth.profile?.slug || ''
})

function cleanSlug() {
  slugChoice.value = slugChoice.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
}

async function saveProfile() {
  profileMsg.value = ''
  savingProfile.value = true
  try {
    if (slugChoice.value !== auth.profile?.slug) {
      const q = query(collection(useDb(), 'users'), where('slug', '==', slugChoice.value), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty && snap.docs[0].id !== auth.uid) {
        profileMsgKind.value = 'error'
        profileMsg.value = 'That URL handle is already taken.'
        return
      }
    }
    await updateDoc(doc(useDb(), 'users', auth.uid), {
      displayName: displayName.value,
      slug: slugChoice.value
    })
    await auth.refreshProfile()
    profileMsgKind.value = 'success'
    profileMsg.value = 'Profile updated.'
  } catch (e) {
    profileMsgKind.value = 'error'
    profileMsg.value = e.message
  } finally {
    savingProfile.value = false
  }
}

async function changeEmail() {
  emailMsg.value = ''
  if (!newEmail.value || !emailPassword.value) {
    emailMsgKind.value = 'error'
    emailMsg.value = 'Both new email and current password are required.'
    return
  }
  changingEmail.value = true
  try {
    const fbAuth = useAuth()
    const cred = EmailAuthProvider.credential(fbAuth.currentUser.email, emailPassword.value)
    await reauthenticateWithCredential(fbAuth.currentUser, cred)
    await verifyBeforeUpdateEmail(fbAuth.currentUser, newEmail.value)
    emailMsgKind.value = 'success'
    emailMsg.value = 'Verification email sent to ' + newEmail.value + '. Click the link to complete the change.'
    emailPassword.value = ''
  } catch (e) {
    emailMsgKind.value = 'error'
    emailMsg.value = humanize(e)
  } finally {
    changingEmail.value = false
  }
}

async function changePass() {
  passMsg.value = ''
  if (newPassword.value.length < 8) {
    passMsgKind.value = 'error'; passMsg.value = 'New password must be 8+ characters.'; return
  }
  if (newPassword.value !== confirmPassword.value) {
    passMsgKind.value = 'error'; passMsg.value = 'New password and confirmation do not match.'; return
  }
  changingPass.value = true
  try {
    const fbAuth = useAuth()
    const cred = EmailAuthProvider.credential(fbAuth.currentUser.email, oldPassword.value)
    await reauthenticateWithCredential(fbAuth.currentUser, cred)
    await updatePassword(fbAuth.currentUser, newPassword.value)
    passMsgKind.value = 'success'
    passMsg.value = 'Password updated.'
    oldPassword.value = newPassword.value = confirmPassword.value = ''
  } catch (e) {
    passMsgKind.value = 'error'
    passMsg.value = humanize(e)
  } finally {
    changingPass.value = false
  }
}

function humanize(e) {
  const code = e.code || ''
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Current password is incorrect.'
  if (code.includes('email-already-in-use')) return 'That email is already in use.'
  return e.message || String(e)
}
</script>

<style scoped>
.settings { display: flex; flex-direction: column; gap: 24px; max-width: 640px; }
.page-header h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  margin: 0;
}
.kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 6px;
}
.section-h {
  font-family: var(--font-display);
  font-size: 1.2rem;
  margin: 0 0 16px;
}
.hint {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}
.hint code {
  font-family: var(--font-mono);
  background: var(--bg);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.85em;
}
.notice { margin-bottom: 12px; }
</style>
