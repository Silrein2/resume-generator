// utils/firebase.ts
// Firebase app + Firestore — universal (works on both server and client).
// Auto-imported by Nuxt; call useDb() anywhere to get a Firestore handle.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

let _app: FirebaseApp | null = null
let _db: Firestore | null = null

function getOrInitApp(): FirebaseApp {
  if (_app) return _app
  if (getApps().length) {
    _app = getApps()[0]!
    return _app
  }
  const config = useRuntimeConfig()
  _app = initializeApp({
    apiKey: config.public.firebaseApiKey as string,
    authDomain: config.public.firebaseAuthDomain as string,
    projectId: config.public.firebaseProjectId as string,
    storageBucket: config.public.firebaseStorageBucket as string,
    messagingSenderId: config.public.firebaseMessagingSenderId as string,
    appId: config.public.firebaseAppId as string
  })
  return _app
}

export function useFirebaseApp(): FirebaseApp {
  return getOrInitApp()
}

export function useDb(): Firestore {
  if (_db) return _db
  _db = getFirestore(getOrInitApp())
  return _db
}
