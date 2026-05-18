// middleware/auth.ts
// Requires the user to be signed in. Redirects to /login if not.
// Auth is client-only; on the server we skip the check (the client will run it after hydration).

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const auth = useAuthStore()
  await auth.waitForInit()

  if (!auth.isSignedIn) {
    return navigateTo({ path: '/login', query: { next: to.fullPath } })
  }
})
