// stores/auth.ts
// Auth + user profile store. Mostly client-side; auth listener attaches
// via the auth-listener.client plugin after Nuxt is initialized.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  type User as FbUser
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  query, collection, where, getDocs, limit
} from 'firebase/firestore'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  slug: string
  role: 'editor' | 'admin'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<FbUser | null>(null)
  const profile = ref<UserProfile | null>(null)
  const initialized = ref(false) // flips to true after first auth state resolution

  const isSignedIn = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isEditor = computed(() => profile.value?.role === 'editor' || isAdmin.value)
  const uid = computed(() => user.value?.uid || null)
  const slug = computed(() => profile.value?.slug || null)

  async function loadProfile(uidVal: string) {
    const snap = await getDoc(doc(useDb(), 'users', uidVal))
    profile.value = snap.exists() ? { id: snap.id, ...snap.data() } as UserProfile : null
  }

  // Called by the client plugin when Firebase auth state changes.
  async function _setUser(fbUser: FbUser | null) {
    user.value = fbUser
    if (fbUser) {
      await loadProfile(fbUser.uid)
    } else {
      profile.value = null
    }
    initialized.value = true
  }

  /**
   * Register a new editor. Requires a valid unused registration token.
   * Admin role is bootstrapped manually via Firebase console — see README.
   */
  async function register(opts: {
    email: string
    password: string
    slugChoice: string
    displayName: string
    token: string
  }) {
    const db = useDb()
    const tk = opts.token?.trim()
    if (!tk) throw new Error('A registration token is required.')

    const tokenDocRef = doc(db, 'tokens', tk)
    const tokenSnap = await getDoc(tokenDocRef)
    if (!tokenSnap.exists()) throw new Error('Invalid registration token.')
    const t = tokenSnap.data()
    if (t.usedBy) throw new Error('This token has already been used.')

    // Slug uniqueness
    const slugQ = query(collection(db, 'users'), where('slug', '==', opts.slugChoice), limit(1))
    const slugSnap = await getDocs(slugQ)
    if (!slugSnap.empty) throw new Error('That URL handle is already taken.')

    // Create Firebase auth account (client only)
    const cred = await createUserWithEmailAndPassword(useAuth(), opts.email, opts.password)

    // Create Firestore user doc as editor
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: opts.email,
      displayName: opts.displayName || '',
      slug: opts.slugChoice,
      role: 'editor',
      createdAt: serverTimestamp()
    })

    // Mark token as used
    await updateDoc(tokenDocRef, {
      usedBy: cred.user.uid,
      usedAt: serverTimestamp()
    })

    await loadProfile(cred.user.uid)
    return cred.user
  }

  async function signIn(opts: { email: string; password: string }) {
    const cred = await signInWithEmailAndPassword(useAuth(), opts.email, opts.password)
    await loadProfile(cred.user.uid)
    return cred.user
  }

  async function signOut() {
    await fbSignOut(useAuth())
    profile.value = null
  }

  async function sendReset(email: string) {
    await sendPasswordResetEmail(useAuth(), email)
  }

  async function refreshProfile() {
    if (user.value) await loadProfile(user.value.uid)
  }

  /**
   * Wait until the auth listener has fired at least once.
   * Used in client-side middleware so guards have a settled auth state.
   */
  function waitForInit(): Promise<void> {
    if (initialized.value) return Promise.resolve()
    return new Promise((resolve) => {
      const stop = setInterval(() => {
        if (initialized.value) { clearInterval(stop); resolve() }
      }, 30)
    })
  }

  return {
    user, profile, initialized,
    isSignedIn, isAdmin, isEditor, uid, slug,
    register, signIn, signOut, sendReset, refreshProfile,
    waitForInit, _setUser
  }
})
