// utils/firebase-client.ts
// Firebase Auth and Storage — CLIENT ONLY (these depend on browser APIs).
// Calling these on the server will throw; that's intentional.

import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

let _auth: Auth | null = null
let _storage: FirebaseStorage | null = null

export function useAuth(): Auth {
  if (import.meta.server) {
    throw new Error('useAuth() called on server — auth is client-only.')
  }
  if (_auth) return _auth
  _auth = getAuth(useFirebaseApp())
  return _auth
}

export function useStorage(): FirebaseStorage {
  if (import.meta.server) {
    throw new Error('useStorage() called on server — storage is client-only.')
  }
  if (_storage) return _storage
  _storage = getStorage(useFirebaseApp())
  return _storage
}
