// Central Firebase setup. All values come from environment variables so no
// secrets are ever committed to GitHub. See SETUP.md for where to get them.
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True once the .env values are filled in — the UI shows a friendly setup
 *  screen instead of crashing when they are missing. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

export function firebaseAuth(): Auth {
  return getAuth(getApp());
}

let firestore: Firestore | null = null;

/**
 * Firestore with an on-device cache. This is what makes Kite work offline:
 * previously loaded rooms/messages still open with no signal, and anything
 * you write while offline is queued and sent automatically once you are
 * back online — no extra code at the call sites.
 */
export function db(): Firestore {
  if (!firestore) {
    const app = getApp();
    try {
      firestore = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      // Already initialised (fast refresh), or storage blocked (private mode).
      firestore = getFirestore(app);
    }
  }
  return firestore;
}

export function storage(): FirebaseStorage {
  return getStorage(getApp());
}

/** Deterministic DM thread id for a pair of users, order-independent. */
export function dmThreadId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}
