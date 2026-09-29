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
const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';

// Set log level to silent to prevent harmless transport/offline-first fallback logs in browser console
setLogLevel('silent');

let dbInstance: ReturnType<typeof getFirestore>;

const isMobileApp =
  typeof window !== 'undefined' &&
  (Boolean((window as any).Capacitor) ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''));

try {
  // Use experimentalForceLongPolling for instant, reliable connectivity across mobile networks (Yemen Mobile, 4G, WiFi),
  // Android WebViews, and desktop environments without WebSocket drops or timeouts.
  dbInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache(
        isMobileApp
          ? {} // Use rock-solid single-tab cache on Android/iOS WebView (avoids WebLocks / BroadcastChannel deadlocks)
          : { tabManager: persistentMultipleTabManager() }
      ),
    },
    databaseId
  );
} catch (e) {
  try {
    // If persistentLocalCache fails (e.g. IndexedDB origin restrictions in Capacitor), fallback to memory cache with forced long polling
    dbInstance = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache(),
      },
      databaseId
    );
  } catch (e2) {
    try {
      dbInstance = getFirestore(app, databaseId);
    } catch (err3) {
      dbInstance = getFirestore(app);
    }
  }
}

export const db = dbInstance;
export const auth = getAuth(app);
export { app, enableNetwork, disableNetwork, databaseId, firebaseConfig };

