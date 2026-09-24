import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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

try {
  // Check if we are running in an Android WebView / Capacitor mobile app
  const isMobileApp =
    typeof window !== 'undefined' &&
    (Boolean((window as any).Capacitor) ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''));

  // Initialize with persistent offline cache and auto-detect long-polling for stable connectivity
  dbInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
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
    dbInstance = getFirestore(app, databaseId);
  } catch (err2) {
    dbInstance = getFirestore(app);
  }
}

export const db = dbInstance;
export const auth = getAuth(app);
export { app, enableNetwork, disableNetwork };

