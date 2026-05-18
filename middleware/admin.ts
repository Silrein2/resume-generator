// middleware/admin.ts
// Requires the user to be signed in AND have role 'admin'.

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const auth = useAuthStore()
  await auth.waitForInit()

  if (!auth.isSignedIn) {
    return navigateTo('/login')
  }
  if (!auth.isAdmin) {
    return navigateTo('/dashboard/resume')
  }
})
