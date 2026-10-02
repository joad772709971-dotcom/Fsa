import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore,
  enableNetwork,
  disableNetwork,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestoreDatabaseId if configured or default
const customDbId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? firebaseConfigJson.firestoreDatabaseId
  : undefined;
const databaseId = customDbId || '(default)';

// Set log level to silent to prevent harmless transport/offline-first fallback logs in browser console
setLogLevel('silent');

let dbInstance: ReturnType<typeof getFirestore>;

const isMobileApp =
  typeof window !== 'undefined' &&
  (Boolean((window as any).Capacitor) ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''));

const firestoreSettings = {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache(
    isMobileApp
      ? {} // Use rock-solid single-tab cache on Android/iOS WebView (avoids WebLocks / BroadcastChannel deadlocks)
      : { tabManager: persistentMultipleTabManager() }
  ),
};

const memorySettings = {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache(),
};

try {
  // Use experimentalForceLongPolling for instant, reliable connectivity across mobile networks (Yemen Mobile, 4G, WiFi),
  // Android WebViews, and desktop environments without WebSocket drops or timeouts.
  dbInstance = customDbId
    ? initializeFirestore(app, firestoreSettings, customDbId)
    : initializeFirestore(app, firestoreSettings);
} catch (e) {
  try {
    // If persistentLocalCache fails (e.g. IndexedDB origin restrictions in Capacitor), fallback to memory cache with forced long polling
    dbInstance = customDbId
      ? initializeFirestore(app, memorySettings, customDbId)
      : initializeFirestore(app, memorySettings);
  } catch (e2) {
    try {
      dbInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
    } catch (err3) {
      dbInstance = getFirestore(app);
    }
  }
}

export const db = dbInstance;
export const auth = getAuth(app);
export { app, enableNetwork, disableNetwork, databaseId, firebaseConfig };

