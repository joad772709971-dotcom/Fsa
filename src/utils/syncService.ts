import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  getDocs,
  setDoc,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, Supplier, Employee, InventoryItem, CustomerDebt, DayRecord } from '../types';
import { PriceMemoryItem } from '../types/pricing';
import { getApiBaseUrl } from './apkConfig';
import {
  loadTransactions,
  loadSuppliers,
  loadEmployees,
  loadInventory,
  loadCustomers,
  saveTransactions,
  saveSuppliers,
  saveEmployees,
  saveInventory,
  saveCustomers,
  isSalesMaintBalanceTx,
  getDeletedTxIds,
  markTxDeleted,
  unmarkTxDeleted,
} from './storage';
import { loadPriceMemory, savePriceMemory } from './priceMemoryStorage';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  pendingChangesCount: number;
  error: string | null;
}

type SyncListener = (status: SyncStatus) => void;
const listeners: Set<SyncListener> = new Set();

let currentStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSynced: typeof localStorage !== 'undefined' ? localStorage.getItem('mosaab_last_sync_time') : null,
  pendingChangesCount: 0,
  error: null,
};

function notifyStatus() {
  listeners.forEach((listener) => {
    try {
      listener({ ...currentStatus });
    } catch (err) {
      console.error('Error in sync listener:', err);
    }
  });
}

export function subscribeToSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener({ ...currentStatus });
  return () => {
    listeners.delete(listener);
  };
}

// Window online/offline event handlers
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentStatus.isOnline = true;
    notifyStatus();
    triggerFullSync();
  });

  window.addEventListener('offline', () => {
    currentStatus.isOnline = false;
    notifyStatus();
  });
}

/**
 * Sanitize objects before sending to Firestore.
 * Firestore throws a fatal 'Unsupported field value: undefined' exception if any key has an undefined value.
 * JSON serialization cleanses all undefined values safely.
 */
export function cleanPayloadForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

const PENDING_TX_QUEUE_KEY = 'mosaab_pending_cloud_tx_queue';

function getPendingTxQueue(): Map<string, Transaction> {
  try {
    const raw = localStorage.getItem(PENDING_TX_QUEUE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Map(arr.map((t: Transaction) => [t.id, t]));
    }
  } catch (e) {}
  return new Map();
}

function queuePendingTx(tx: Transaction) {
  try {
    const q = getPendingTxQueue();
    q.set(tx.id, tx);
    localStorage.setItem(PENDING_TX_QUEUE_KEY, JSON.stringify(Array.from(q.values())));
  } catch (e) {}
}

function removePendingTx(id: string) {
  try {
    const q = getPendingTxQueue();
    if (q.has(id)) {
      q.delete(id);
      localStorage.setItem(PENDING_TX_QUEUE_KEY, JSON.stringify(Array.from(q.values())));
    }
  } catch (e) {}
}

/**
 * Upload single transaction to Firestore and sync server
 */
export async function syncTransactionToCloud(tx: Transaction): Promise<void> {
  const sanitized = cleanPayloadForFirestore({
    ...tx,
    updatedAt: tx.updatedAt || new Date().toISOString(),
  });

  // 1. Instant sync via backend server (APK, Web, and EXE sync relay)
  try {
    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/sync/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: sanitized }),
    }).catch(() => {});
  } catch (e) {}

  // 2. Cloud Firestore sync
  try {
    unmarkTxDeleted(tx.id);
    deleteDoc(doc(db, 'deleted_transactions', tx.id)).catch(() => {});
    const docRef = doc(db, 'transactions', tx.id);
    await setDoc(docRef, sanitized, { merge: true });
    removePendingTx(tx.id);
    updateLastSyncTime();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloud_data_synced', { detail: { count: 1, timestamp: Date.now() } }));
    }
  } catch (err: any) {
    console.warn('Firestore offline or quota exceeded, transaction preserved in local queue and server relay:', tx.id, err?.message || err);
    queuePendingTx(tx);
  }
}

/**
 * Upload single supplier to Firestore
 */
export async function syncSupplierToCloud(sup: Supplier): Promise<void> {
  try {
    const docRef = doc(db, 'suppliers', sup.id);
    const sanitized = cleanPayloadForFirestore({
      ...sup,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    console.warn('Offline or sync error for supplier:', sup.id, err);
  }
}

/**
 * Upload single customer debt to Firestore
 */
export async function syncCustomerToCloud(cust: CustomerDebt): Promise<void> {
  try {
    const docRef = doc(db, 'customers', cust.id);
    const sanitized = cleanPayloadForFirestore({
      ...cust,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    console.warn('Offline or sync error for customer:', cust.id, err);
  }
}

/**
 * Upload single employee to Firestore
 */
export async function syncEmployeeToCloud(emp: Employee): Promise<void> {
  try {
    const docRef = doc(db, 'employees', emp.id);
    const sanitized = cleanPayloadForFirestore({
      ...emp,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    console.warn('Offline or sync error for employee:', emp.id, err);
  }
}

/**
 * Upload single inventory item to Firestore
 */
export async function syncInventoryToCloud(item: InventoryItem): Promise<void> {
  try {
    const docRef = doc(db, 'inventory', item.id);
    const sanitized = cleanPayloadForFirestore({
      ...item,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    console.warn('Offline or sync error for inventory item:', item.id, err);
  }
}

/**
 * Upload single price memory item to Firestore
 */
export async function syncPriceMemoryToCloud(mem: PriceMemoryItem): Promise<void> {
  try {
    const docRef = doc(db, 'price_memory', mem.id);
    const sanitized = cleanPayloadForFirestore({
      ...mem,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err: any) {
    console.warn('Offline or sync error for price memory:', mem.id, err);
  }
}

/**
 * Delete transaction from cloud and record tombstone to prevent resurrection across devices
 */
export async function deleteTransactionFromCloud(id: string): Promise<void> {
  try {
    markTxDeleted(id);
    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/sync/transactions/${id}`, {
      method: 'DELETE',
    }).catch(() => {});

    await deleteDoc(doc(db, 'transactions', id)).catch(() => {});
    // تسجيل علامة الحذف سحابياً لمنع أي جهاز آخر من إعادة رفع أو استرجاع العملية
    await setDoc(
      doc(db, 'deleted_transactions', id),
      {
        id,
        deletedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch(() => {});
    updateLastSyncTime();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloud_data_synced', { detail: { count: 0, timestamp: Date.now() } }));
    }
  } catch (err) {
    console.warn('Failed to delete transaction from cloud:', id, err);
  }
}

/**
 * Upload single day record to Firestore for multi-worker instant sync
 */
export async function syncDayToCloud(day: DayRecord): Promise<void> {
  const sanitized = cleanPayloadForFirestore({
    ...day,
    updatedAt: new Date().toISOString(),
  });

  try {
    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/sync/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day: sanitized }),
    }).catch(() => {});
  } catch (e) {}

  try {
    const docRef = doc(db, 'days', day.id);
    await setDoc(docRef, sanitized, { merge: true });
    updateLastSyncTime();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloud_data_synced', { detail: { timestamp: Date.now() } }));
    }
  } catch (err: any) {
    console.warn('Offline or sync error for day record:', day.id, err);
  }
}

/**
 * Real-time subscribers for all tables
 */
let unsubscribers: Unsubscribe[] = [];

export function startRealtimeSync(
  onDataUpdate?: (
    type: 'transactions' | 'suppliers' | 'employees' | 'inventory' | 'customers' | 'price_memory' | 'days',
    details?: { newTransactions?: Transaction[]; days?: DayRecord[] }
  ) => void
): () => void {
  // Stop existing listeners if any
  stopRealtimeSync();

  // 0. Deleted Transactions Listener (Instant propagation of deletions across all devices: APK, EXE, Web)
  const unsubDeleted = onSnapshot(
    collection(db, 'deleted_transactions'),
    (snapshot) => {
      if (!snapshot.empty) {
        let changed = false;
        const localTxs = loadTransactions();
        const deletedIds = getDeletedTxIds();

        snapshot.forEach((docSnap) => {
          const id = docSnap.id;
          if (!deletedIds.has(id)) {
            markTxDeleted(id);
            deletedIds.add(id);
            changed = true;
          }
        });

        if (changed) {
          const active = localTxs.filter((t) => !deletedIds.has(t.id));
          saveTransactions(active);
          onDataUpdate?.('transactions');
        }
      }
    },
    (_err) => {}
  );
  unsubscribers.push(unsubDeleted);

  // 1. Transactions Listener
  const unsubTx = onSnapshot(
    collection(db, 'transactions'),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudTxs: Transaction[] = [];
        const deletedIds = getDeletedTxIds();

        snapshot.forEach((docSnap) => {
          const t = docSnap.data() as Transaction;
          if (!deletedIds.has(t.id)) {
            cloudTxs.push(t);
          }
        });

        // Merge with local transactions
        const localTxs = loadTransactions();
        const localMap = new Map<string, Transaction>(localTxs.map((t) => [t.id, t]));
        const incomingNewTxs: Transaction[] = [];

        // Identify new transactions added remotely and handle removals
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            markTxDeleted(change.doc.id);
            localMap.delete(change.doc.id);
          } else if (change.type === 'added') {
            const data = change.doc.data() as Transaction;
            if (!deletedIds.has(data.id) && !localMap.has(data.id)) {
              incomingNewTxs.push(data);
            }
          }
        });

        cloudTxs.forEach((cTx) => {
          if (deletedIds.has(cTx.id)) return;
          // Remove any legacy compound August transactions from cloud if found
          if (cTx.id && cTx.id.startsWith('tx_202608') && cTx.id.endsWith('_acc')) {
            deleteDoc(doc(db, 'transactions', cTx.id)).catch(() => {});
            return;
          }
          const localTx = localMap.get(cTx.id);
          // حماية التعديلات المحلية (خاصة أثناء انقطاع الإنترنت أو التعديل الفوري)
          if (localTx && localTx.updatedAt && cTx.updatedAt && localTx.updatedAt > cTx.updatedAt) {
            return;
          }
          localMap.set(cTx.id, cTx);
        });

        const merged = Array.from(localMap.values()).filter((t) => !deletedIds.has(t.id));
        merged.sort((a, b) => {
          const dateCmp = (b.date || '').localeCompare(a.date || '');
          if (dateCmp !== 0) return dateCmp;
          return (b.time || '').localeCompare(a.time || '');
        });

        saveTransactions(merged);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cloud_data_synced', {
              detail: { count: merged.length, timestamp: Date.now() },
            })
          );
        }
        onDataUpdate?.('transactions', { newTransactions: incomingNewTxs });
        updateLastSyncTime();
      }
    },
    (_err) => {
      // Benign offline or transient reconnection state
    }
  );
  unsubscribers.push(unsubTx);

  // 2. Suppliers Listener
  const unsubSup = onSnapshot(
    collection(db, 'suppliers'),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudSups: Supplier[] = [];
        snapshot.forEach((docSnap) => {
          cloudSups.push(docSnap.data() as Supplier);
        });

        const localSups = loadSuppliers();
        const localMap = new Map<string, Supplier>(localSups.map((s) => [s.id, s]));
        cloudSups.forEach((cs) => {
          localMap.set(cs.id, cs);
        });

        const merged = Array.from(localMap.values());
        saveSuppliers(merged);
        onDataUpdate?.('suppliers');
      }
    },
    (_err) => {
      // Benign offline or transient reconnection state
    }
  );
  unsubscribers.push(unsubSup);

  // 3. Customers Listener
  const unsubCust = onSnapshot(
    collection(db, 'customers'),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudCusts: CustomerDebt[] = [];
        snapshot.forEach((docSnap) => {
          cloudCusts.push(docSnap.data() as CustomerDebt);
        });

        const localCusts = loadCustomers();
        const localMap = new Map<string, CustomerDebt>(localCusts.map((c) => [c.id, c]));
        cloudCusts.forEach((cc) => {
          localMap.set(cc.id, cc);
        });

        const merged = Array.from(localMap.values());
        saveCustomers(merged);
        onDataUpdate?.('customers');
      }
    },
    (_err) => {
      // Benign offline or transient reconnection state
    }
  );
  unsubscribers.push(unsubCust);

  // 4. Employees Listener
  const unsubEmp = onSnapshot(
    collection(db, 'employees'),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudEmps: Employee[] = [];
        snapshot.forEach((docSnap) => {
          cloudEmps.push(docSnap.data() as Employee);
        });

        const localEmps = loadEmployees();
        const localMap = new Map<string, Employee>(localEmps.map((e) => [e.id, e]));
        cloudEmps.forEach((ce) => {
          localMap.set(ce.id, ce);
        });

        const merged = Array.from(localMap.values());
        saveEmployees(merged);
        onDataUpdate?.('employees');
      }
    },
    (_err) => {
      // Benign offline or transient reconnection state
    }
  );
  unsubscribers.push(unsubEmp);

  // 5. Price Memory Listener
  const unsubPrice = onSnapshot(
    collection(db, 'price_memory'),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudPrices: PriceMemoryItem[] = [];
        snapshot.forEach((docSnap) => {
          cloudPrices.push(docSnap.data() as PriceMemoryItem);
        });

        const localPrices = loadPriceMemory();
        const localMap = new Map<string, PriceMemoryItem>(localPrices.map((p) => [p.id, p]));
        cloudPrices.forEach((cp) => {
          localMap.set(cp.id, cp);
        });

        const merged = Array.from(localMap.values());
        savePriceMemory(merged);
        onDataUpdate?.('price_memory');
      }
    },
    (_err) => {
      // Benign offline or transient reconnection state
    }
  );
  unsubscribers.push(unsubPrice);

  // 6. Inventory Items Listener (Real-time stock across devices)
  const unsubInventory = onSnapshot(
    collection(db, 'inventory'),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudInventory: InventoryItem[] = [];
        snapshot.forEach((docSnap) => {
          cloudInventory.push(docSnap.data() as InventoryItem);
        });

        const localInventory = loadInventory();
        const localMap = new Map<string, InventoryItem>(localInventory.map((i) => [i.id, i]));
        cloudInventory.forEach((ci) => {
          localMap.set(ci.id, ci);
        });

        const merged = Array.from(localMap.values());
        saveInventory(merged);
        onDataUpdate?.('inventory');
      }
    },
    (_err) => {
      // Benign offline or transient reconnection state
    }
  );
  unsubscribers.push(unsubInventory);

  // 7. Daily Ledgers Listener (Instant sync of cashier sales & daily ledgers across workers)
  const unsubDays = onSnapshot(
    collection(db, 'days'),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudDays: DayRecord[] = [];
        snapshot.forEach((docSnap) => {
          const rawDay = docSnap.data() as DayRecord;
          cloudDays.push(rawDay);
        });

        let localDays: DayRecord[] = [];
        try {
          const saved = localStorage.getItem('mosaab_days_data_v2');
          if (saved) localDays = JSON.parse(saved);
        } catch (e) {}

        const localMap = new Map<string, DayRecord>(localDays.map((d) => [d.id, d]));
        cloudDays.forEach((cd) => {
          const existing = localMap.get(cd.id);
          if (!existing) {
            localMap.set(cd.id, cd);
          } else {
            // إذا كانت النسخة المحلية أحدث (تم تعديلها أو حفظها محلياً)، نحتفظ بالتعديل المحلي
            if (existing.updatedAt && cd.updatedAt && existing.updatedAt > cd.updatedAt) {
              return;
            }
            localMap.set(cd.id, cd);
          }
        });

        const mergedDays = Array.from(localMap.values());
        try {
          localStorage.setItem('mosaab_days_data_v2', JSON.stringify(mergedDays));
        } catch (e) {}

        onDataUpdate?.('days', { days: mergedDays });
      }
    },
    (_err) => {
      // Benign offline or transient reconnection state
    }
  );
  unsubscribers.push(unsubDays);

  // 8. Server Relay Heartbeat (Instant sync between APK, Web, and EXE across different networks)
  if (typeof window !== 'undefined') {
    const serverInterval = setInterval(async () => {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/sync/transactions`, { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
            const deletedIds = getDeletedTxIds();
            if (Array.isArray(data.tombstones)) {
              data.tombstones.forEach((tId: string) => {
                deletedIds.add(tId);
                markTxDeleted(tId);
              });
            }

            const localTxs = loadTransactions();
            const localMap = new Map<string, Transaction>(localTxs.map((t) => [t.id, t]));
            let hasNewOrUpdated = false;

            data.transactions.forEach((sTx: Transaction) => {
              if (!sTx || !sTx.id || deletedIds.has(sTx.id)) return;
              const existing = localMap.get(sTx.id);
              if (!existing) {
                localMap.set(sTx.id, sTx);
                hasNewOrUpdated = true;
              } else if (sTx.updatedAt && existing.updatedAt && sTx.updatedAt > existing.updatedAt) {
                localMap.set(sTx.id, sTx);
                hasNewOrUpdated = true;
              }
            });

            if (hasNewOrUpdated) {
              const merged = Array.from(localMap.values()).filter((t) => !deletedIds.has(t.id));
              merged.sort((a, b) => {
                const dateCmp = (b.date || '').localeCompare(a.date || '');
                if (dateCmp !== 0) return dateCmp;
                return (b.time || '').localeCompare(a.time || '');
              });
              saveTransactions(merged);
              onDataUpdate?.('transactions');
              updateLastSyncTime();
            }
          }
        }
      } catch (e) {
        // benign transient offline
      }
    }, 6000);

    unsubscribers.push(() => clearInterval(serverInterval));
  }

  return stopRealtimeSync;
}

export function stopRealtimeSync(): void {
  unsubscribers.forEach((unsub) => {
    try {
      unsub();
    } catch (err) {
      // ignore
    }
  });
  unsubscribers = [];
}

function updateLastSyncTime() {
  const now = new Date().toLocaleTimeString('ar-YE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  currentStatus.lastSynced = now;
  currentStatus.isSyncing = false;
  currentStatus.error = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('mosaab_last_sync_time', now);
  }
  notifyStatus();
}

/**
 * Trigger full initial or on-demand push & pull synchronization (المزامنة السريعة الفورية)
 * بنية المزامنة السحابية فائقة السرعة والمطابقة الموحدة بين الأجهزة
 */
export async function triggerFullSync(): Promise<{ success: boolean; message: string; count?: number }> {
  currentStatus.isSyncing = true;
  currentStatus.error = null;
  notifyStatus();

  try {
    const deletedIds = getDeletedTxIds();
    const pendingQueue = getPendingTxQueue();

    // 0. Pull from server relay first (APK / EXE / Web instant synchronization)
    const apiBase = getApiBaseUrl();
    let serverData: any = null;

    try {
      const serverRes = await fetch(`${apiBase}/api/sync/all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: Array.from(pendingQueue.values()),
          deletedIds: Array.from(deletedIds),
        }),
      });
      if (serverRes.ok) {
        serverData = await serverRes.json();
      }
    } catch (e) {}

    if (serverData?.tombstones && Array.isArray(serverData.tombstones)) {
      serverData.tombstones.forEach((tId: string) => {
        deletedIds.add(tId);
        markTxDeleted(tId);
      });
    }

    // 1. Pull tombstones from Firestore
    const deletedSnap = await getDocs(collection(db, 'deleted_transactions')).catch(() => null);
    if (deletedSnap && !deletedSnap.empty) {
      deletedSnap.forEach((d) => {
        deletedIds.add(d.id);
        markTxDeleted(d.id);
      });
    }

    // 2. Load local transactions & merge with server & Firestore
    const localTxs = loadTransactions().filter((t) => !deletedIds.has(t.id));
    const localTxMap = new Map<string, Transaction>(localTxs.map((t) => [t.id, t]));

    // Merge server data
    if (serverData?.transactions && Array.isArray(serverData.transactions)) {
      serverData.transactions.forEach((st: Transaction) => {
        if (!st || !st.id || deletedIds.has(st.id)) return;
        const local = localTxMap.get(st.id);
        if (!local || (st.updatedAt && local.updatedAt && st.updatedAt >= local.updatedAt)) {
          localTxMap.set(st.id, st);
        }
      });
    }

    // Pull from Firestore
    const remoteTxSnap = await getDocs(collection(db, 'transactions')).catch((e) => {
      console.warn('Could not read remote transactions from Firestore:', e);
      return null;
    });

    if (remoteTxSnap && !remoteTxSnap.empty) {
      remoteTxSnap.forEach((d) => {
        const data = d.data() as Transaction;
        if (!data || !data.id || deletedIds.has(data.id)) return;
        const local = localTxMap.get(data.id);
        if (!local || (data.updatedAt && local.updatedAt && data.updatedAt >= local.updatedAt)) {
          localTxMap.set(data.id, data);
        }
      });
    }

    const mergedTxs = Array.from(localTxMap.values()).filter((t) => !deletedIds.has(t.id));
    mergedTxs.sort((a, b) => {
      const dateCmp = (b.date || '').localeCompare(a.date || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.time || '').localeCompare(a.time || '');
    });
    saveTransactions(mergedTxs);

    // 3. Sync Days
    let localDays: DayRecord[] = [];
    try {
      const savedDaysStr = localStorage.getItem('mosaab_days_data_v2');
      if (savedDaysStr) localDays = JSON.parse(savedDaysStr);
    } catch (e) {}
    const localDayMap = new Map<string, DayRecord>(localDays.map((d) => [d.id, d]));

    if (serverData?.days && Array.isArray(serverData.days)) {
      serverData.days.forEach((sd: DayRecord) => {
        if (!sd || !sd.id) return;
        const existing = localDayMap.get(sd.id);
        if (!existing || (sd.updatedAt && existing.updatedAt && sd.updatedAt >= existing.updatedAt)) {
          localDayMap.set(sd.id, sd);
        }
      });
    }

    const remoteDaysSnap = await getDocs(collection(db, 'days')).catch(() => null);
    if (remoteDaysSnap && !remoteDaysSnap.empty) {
      remoteDaysSnap.forEach((d) => {
        const cd = d.data() as DayRecord;
        if (!cd || !cd.id) return;
        const existing = localDayMap.get(cd.id);
        if (!existing || (cd.updatedAt && existing.updatedAt && cd.updatedAt >= existing.updatedAt)) {
          localDayMap.set(cd.id, cd);
        }
      });
    }

    const mergedDays = Array.from(localDayMap.values());
    try {
      localStorage.setItem('mosaab_days_data_v2', JSON.stringify(mergedDays));
    } catch (e) {}

    // 4. Sync Inventory
    const remoteInvSnap = await getDocs(collection(db, 'inventory')).catch(() => null);
    const localInventory = loadInventory();
    const localInvMap = new Map<string, InventoryItem>(localInventory.map((i) => [i.id, i]));
    if (remoteInvSnap && !remoteInvSnap.empty) {
      remoteInvSnap.forEach((d) => {
        const ci = d.data() as InventoryItem;
        if (ci && ci.id) localInvMap.set(ci.id, ci);
      });
      saveInventory(Array.from(localInvMap.values()));
    }

    // 5. Push ONLY pending user-created transactions to Firestore (Protect free quota!)
    const pendingTxs = Array.from(pendingQueue.values()).filter((t) => !deletedIds.has(t.id));
    if (pendingTxs.length > 0) {
      const batch = writeBatch(db);
      pendingTxs.forEach((tx) => {
        const docRef = doc(db, 'transactions', tx.id);
        batch.set(docRef, cleanPayloadForFirestore({ ...tx, updatedAt: tx.updatedAt || new Date().toISOString() }), { merge: true });
      });
      await batch.commit().then(() => {
        pendingTxs.forEach((tx) => removePendingTx(tx.id));
      }).catch((err) => {
        console.warn('Batch push to Firestore skipped or quota limit reached:', err?.message || err);
      });
    }

    updateLastSyncTime();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cloud_data_synced', {
          detail: { count: mergedTxs.length, timestamp: Date.now() },
        })
      );
    }

    return {
      success: true,
      message: `تمت المزامنة السحابية الفورية بنجاح (${mergedTxs.length} عملية موحدة عبر APK و Web و EXE)`,
      count: mergedTxs.length,
    };
  } catch (err: any) {
    console.error('Fast Sync Error:', err);
    currentStatus.isSyncing = false;
    currentStatus.error = err.message || 'خطأ في الاتصال';
    notifyStatus();
    return { success: false, message: 'يعمل النظام في وضع الأوفلاين حالياً' };
  }
}
