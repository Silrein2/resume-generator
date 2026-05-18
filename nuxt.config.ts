// nuxt.config.ts
// Resume & Blog — Nuxt 3 configuration
export default defineNuxtConfig({
  compatibilityDate: '2024-08-01',
  devtools: { enabled: true },

  // Modules
  modules: ['@pinia/nuxt'],

  // Global CSS
  css: ['~/assets/main.css'],

  // Public runtime config — exposed to client via useRuntimeConfig().public
  // These are populated from environment variables prefixed NUXT_PUBLIC_*
  runtimeConfig: {
    public: {
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      // Default site URL for absolute share links (override per environment)
      siteUrl: 'http://localhost:3000'
    }
  },

  // App-wide head config (Google Fonts + favicon)
  app: {
    head: {
      title: 'Resume & Blog',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
        }
      ]
    }
  },

  // Render mode: 'ssr' (default) so observer pages can server-render meta tags.
  // Dashboard pages still hydrate on the client — auth is client-only.
  ssr: true,

  // Vite tweaks
  vite: {
    optimizeDeps: {
      // Pre-bundle these so dev server starts smoothly
      include: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage']
    }
  }
})
