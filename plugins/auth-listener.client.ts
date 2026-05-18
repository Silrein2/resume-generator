// plugins/auth-listener.client.ts
// Attaches the Firebase auth state listener to the Pinia store on the client.
// Runs only in the browser (the `.client` suffix is a Nuxt convention).

import { onAuthStateChanged } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  onAuthStateChanged(useAuth(), async (fbUser) => {
    await authStore._setUser(fbUser)
  })
})
