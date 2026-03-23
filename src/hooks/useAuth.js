import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let auth = null;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

/**
 * Firebase 認證 Hook
 * @returns {{ user: object|null, auth: object|null }}
 */
export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase config or apiKey not found. Skipping authentication.");
      return;
    }

    const initAuth = async () => {
      try {
        if (import.meta.env.VITE_INITIAL_AUTH_TOKEN) {
          await signInWithCustomToken(auth, import.meta.env.VITE_INITIAL_AUTH_TOKEN);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return { user, auth };
}
