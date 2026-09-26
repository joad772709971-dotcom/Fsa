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

/**
 * Upload single transaction to Firestore
 */
export async function syncTransactionToCloud(tx: Transaction): Promise<void> {
  try {
    unmarkTxDeleted(tx.id);
    deleteDoc(doc(db, 'deleted_transactions', tx.id)).catch(() => {});
    const docRef = doc(db, 'transactions', tx.id);
    const sanitized = cleanPayloadForFirestore({
      ...tx,
      updatedAt: tx.updatedAt || new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
    updateLastSyncTime();
  } catch (err: any) {
    console.warn('Offline or sync error for transaction:', tx.id, err);
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
    await deleteDoc(doc(db, 'transactions', id));
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
  } catch (err) {
    console.warn('Failed to delete transaction from cloud:', id, err);
  }
}

/**
 * Upload single day record to Firestore for multi-worker instant sync
 */
export async function syncDayToCloud(day: DayRecord): Promise<void> {
  try {
    const docRef = doc(db, 'days', day.id);
    const sanitized = cleanPayloadForFirestore({
      ...day,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
    updateLastSyncTime();
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
 */
export async function triggerFullSync(): Promise<{ success: boolean; message: string; count?: number }> {
  currentStatus.isSyncing = true;
  currentStatus.error = null;
  notifyStatus();

  try {
    const batchSize = 300;

    // 0. Sync tombstones from deleted_transactions
    const deletedSnap = await getDocs(collection(db, 'deleted_transactions')).catch(() => null);
    const deletedIds = getDeletedTxIds();
    if (deletedSnap && !deletedSnap.empty) {
      deletedSnap.forEach((d) => {
        deletedIds.add(d.id);
        markTxDeleted(d.id);
      });
    }

    // 1. Push all active local transactions to Firestore in batches (sanitized against undefined values)
    const localTxs = loadTransactions().filter((t) => !deletedIds.has(t.id));
    for (let i = 0; i < localTxs.length; i += batchSize) {
      const chunk = localTxs.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((tx) => {
        const docRef = doc(db, 'transactions', tx.id);
        batch.set(docRef, cleanPayloadForFirestore({ ...tx, updatedAt: new Date().toISOString() }), { merge: true });
      });
      await batch.commit();
    }

    // 2. Push Suppliers (sanitized)
    const suppliers = loadSuppliers();
    if (suppliers.length > 0) {
      const batch = writeBatch(db);
      suppliers.forEach((s) => {
        const docRef = doc(db, 'suppliers', s.id);
        batch.set(docRef, cleanPayloadForFirestore({ ...s, updatedAt: new Date().toISOString() }), { merge: true });
      });
      await batch.commit();
    }

    // 3. Push Customers (sanitized)
    const customers = loadCustomers();
    if (customers.length > 0) {
      const batch = writeBatch(db);
      customers.forEach((c) => {
        const docRef = doc(db, 'customers', c.id);
        batch.set(docRef, cleanPayloadForFirestore({ ...c, updatedAt: new Date().toISOString() }), { merge: true });
      });
      await batch.commit();
    }

    // 4. Push Employees (sanitized)
    const employees = loadEmployees();
    if (employees.length > 0) {
      const batch = writeBatch(db);
      employees.forEach((e) => {
        const docRef = doc(db, 'employees', e.id);
        batch.set(docRef, cleanPayloadForFirestore({ ...e, updatedAt: new Date().toISOString() }), { merge: true });
      });
      await batch.commit();
    }

    // 5. Push Price Memory Items (sanitized)
    const priceMem = loadPriceMemory();
    for (let i = 0; i < priceMem.length; i += batchSize) {
      const chunk = priceMem.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((p) => {
        const docRef = doc(db, 'price_memory', p.id);
        batch.set(docRef, cleanPayloadForFirestore({ ...p, updatedAt: new Date().toISOString() }), { merge: true });
      });
      await batch.commit();
    }

    // 6. Push Inventory Items (sanitized)
    const localInventory = loadInventory();
    for (let i = 0; i < localInventory.length; i += batchSize) {
      const chunk = localInventory.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((inv) => {
        const docRef = doc(db, 'inventory', inv.id);
        batch.set(docRef, cleanPayloadForFirestore({ ...inv, updatedAt: new Date().toISOString() }), { merge: true });
      });
      await batch.commit();
    }

    // 7. Push Days Records (sanitized)
    let localDays: DayRecord[] = [];
    try {
      const savedDaysStr = localStorage.getItem('mosaab_days_data_v2');
      if (savedDaysStr) localDays = JSON.parse(savedDaysStr);
    } catch (e) {}

    for (let i = 0; i < localDays.length; i += batchSize) {
      const chunk = localDays.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => {
        const docRef = doc(db, 'days', d.id);
        batch.set(docRef, cleanPayloadForFirestore({ ...d, updatedAt: new Date().toISOString() }), { merge: true });
      });
      await batch.commit();
    }

    // 8. Pull remote data and merge into local storage
    const remoteTxSnap = await getDocs(collection(db, 'transactions'));
    let totalSyncedTxs = localTxs.length;
    if (!remoteTxSnap.empty) {
      const cloudTxs: Transaction[] = [];
      remoteTxSnap.forEach((d) => {
        const data = d.data() as Transaction;
        if (deletedIds.has(data.id)) return;
        if (data.id && data.id.startsWith('tx_202608') && data.id.endsWith('_acc')) {
          deleteDoc(doc(db, 'transactions', data.id)).catch(() => {});
          return;
        }
        cloudTxs.push(data);
      });
      const localMap = new Map<string, Transaction>(localTxs.map((t) => [t.id, t]));
      cloudTxs.forEach((ct) => {
        if (!deletedIds.has(ct.id)) {
          localMap.set(ct.id, ct);
        }
      });
      const merged = Array.from(localMap.values()).filter((t) => !deletedIds.has(t.id));
      saveTransactions(merged);
      totalSyncedTxs = merged.length;
    }

    // 9. Pull remote inventory and merge
    const remoteInvSnap = await getDocs(collection(db, 'inventory'));
    if (!remoteInvSnap.empty) {
      const cloudInv: InventoryItem[] = [];
      remoteInvSnap.forEach((d) => {
        cloudInv.push(d.data() as InventoryItem);
      });
      const localInvMap = new Map<string, InventoryItem>(localInventory.map((i) => [i.id, i]));
      cloudInv.forEach((ci) => localInvMap.set(ci.id, ci));
      const mergedInv = Array.from(localInvMap.values());
      saveInventory(mergedInv);
    }

    // 10. Pull remote days and merge
    const remoteDaysSnap = await getDocs(collection(db, 'days'));
    if (!remoteDaysSnap.empty) {
      const cloudDays: DayRecord[] = [];
      remoteDaysSnap.forEach((d) => {
        cloudDays.push(d.data() as DayRecord);
      });
      const localDayMap = new Map<string, DayRecord>(localDays.map((d) => [d.id, d]));
      cloudDays.forEach((cd) => {
        const existing = localDayMap.get(cd.id);
        if (!existing) {
          localDayMap.set(cd.id, cd);
        } else {
          localDayMap.set(cd.id, {
            ...existing,
            ...cd,
            accessories: (cd.accessories && cd.accessories.length > 0) ? cd.accessories : (existing.accessories || []),
            phones: (cd.phones && cd.phones.length > 0) ? cd.phones : (existing.phones || []),
            maintenance: (cd.maintenance && cd.maintenance.length > 0) ? cd.maintenance : (existing.maintenance || []),
            recharge: (cd.recharge && cd.recharge.totalWithProfit > 0) ? cd.recharge : (existing.recharge || cd.recharge),
            supplierTransfers: (cd.supplierTransfers && cd.supplierTransfers.length > 0) ? cd.supplierTransfers : (existing.supplierTransfers || []),
          });
        }
      });
      const mergedDays = Array.from(localDayMap.values());
      try {
        localStorage.setItem('mosaab_days_data_v2', JSON.stringify(mergedDays));
      } catch (e) {}
    }

    updateLastSyncTime();

    // Notify the UI to instantly update state from localStorage
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloud_data_synced', {
        detail: { count: totalSyncedTxs, timestamp: Date.now() }
      }));
    }

    return {
      success: true,
      message: `تمت المزامنة السريعة بنجاح (${totalSyncedTxs} عملية مسجلة ومتطابقة)`,
      count: totalSyncedTxs,
    };
  } catch (err: any) {
    console.error('Fast Sync Error:', err);
    currentStatus.isSyncing = false;
    currentStatus.error = err.message || 'خطأ في الاتصال';
    notifyStatus();
    return { success: false, message: 'يعمل النظام في وضع الأوفلاين حالياً' };
  }
}
