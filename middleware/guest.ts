// middleware/guest.ts
// Bounces signed-in users away from /login and /register to the dashboard.

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const auth = useAuthStore()
  await auth.waitForInit()

  if (auth.isSignedIn) {
    return navigateTo('/dashboard/resume')
  }
})
