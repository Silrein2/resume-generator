// nuxt.config.ts
// PageOne — Nuxt 3 configuration
import { buildGoogleFontsUrl } from './utils/fonts'

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

  // App-wide head config (Google Fonts + favicon).
  // The Google Fonts URL is built from utils/fonts.ts so the registry is the
  // single place where you add/remove available fonts.
  app: {
    head: {
      title: 'PageOne',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: buildGoogleFontsUrl() }
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
