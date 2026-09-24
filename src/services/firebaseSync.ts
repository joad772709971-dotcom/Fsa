import { 
  doc, 
  setDoc, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Unique Device ID to distinguish local vs remote saves
const DEVICE_ID_KEY = 'snad_vip_device_id';
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getFirestoreDB(): Firestore | null {
  return db || null;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface CloudStorePayload {
  days: any[];
  inventory: any[];
  maintenanceDevices: any[];
  shortages: any[];
  damagedItems: any[];
  assets: any[];
  customers: any[];
  employees: any[];
  suppliers: any[];
  partnersFunding?: any[];
  shopSettings?: any;
  customTransfers?: any[];
  updatedAt: number;
  deviceId: string;
}

const COLLECTION_NAME = 'store_state';
const DOC_NAME = 'main_data';

// Debounce timer for saving to cloud
let saveTimeout: any = null;

export async function saveToCloudNow(payload: CloudStorePayload): Promise<boolean> {
  const db = getFirestoreDB();
  if (!db) return false;
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_NAME);
    // Sanitize payload to avoid undefined values which Firestore rejects
    const cleanPayload = JSON.parse(JSON.stringify(payload));
    await setDoc(docRef, cleanPayload, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving data to Firestore:', error);
    return false;
  }
}

export function queueCloudSave(
  payload: Omit<CloudStorePayload, 'updatedAt' | 'deviceId'>,
  onStatusChange?: (status: SyncStatus) => void
) {
  if (saveTimeout) clearTimeout(saveTimeout);
  
  if (onStatusChange && navigator.onLine) {
    onStatusChange('syncing');
  }

  saveTimeout = setTimeout(async () => {
    const fullPayload: CloudStorePayload = {
      ...payload,
      updatedAt: Date.now(),
      deviceId: getDeviceId()
    };

    if (!navigator.onLine) {
      if (onStatusChange) onStatusChange('offline');
      // Even offline, Firestore offline cache handles the write!
      saveToCloudNow(fullPayload).catch(() => {});
      return;
    }

    const success = await saveToCloudNow(fullPayload);
    if (onStatusChange) {
      onStatusChange(success ? 'synced' : 'error');
    }
  }, 1200);
}

export function subscribeToCloudStore(
  onDataReceived: (data: CloudStorePayload) => void,
  onStatusChange: (status: SyncStatus) => void
): () => void {
  const db = getFirestoreDB();
  if (!db) {
    onStatusChange('error');
    return () => {};
  }

  const docRef = doc(db, COLLECTION_NAME, DOC_NAME);
  
  if (!navigator.onLine) {
    onStatusChange('offline');
  } else {
    onStatusChange('syncing');
  }

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudStorePayload;
        // Check if change originated from another device or first load
        const myDeviceId = getDeviceId();
        if (data && data.deviceId !== myDeviceId) {
          onDataReceived(data);
        }
        onStatusChange(navigator.onLine ? 'synced' : 'offline');
      } else {
        // Document doesn't exist yet on cloud, will be created on first save
        onStatusChange(navigator.onLine ? 'synced' : 'offline');
      }
    },
    (error) => {
      console.warn('Firestore subscription notice:', error);
      onStatusChange(navigator.onLine ? 'error' : 'offline');
    }
  );

  return unsubscribe;
}
