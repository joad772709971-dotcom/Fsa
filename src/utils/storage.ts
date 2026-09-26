import { Transaction, Supplier, Employee, InventoryItem, CustomerDebt } from '../types';
import { AUGUST_TRANSACTIONS } from '../data/augustData';
import { SEPTEMBER_TRANSACTIONS } from '../data/septemberData';
import { generateHadiOfficialTransactions } from '../data/hadiOfficialRecords';
import { CURRENT_STORE_ID, OWNER_USER_ID, ForensicAuditorService } from '../services/forensicAuditorService';

const STORAGE_KEYS = {
  TRANSACTIONS: 'mosaab_shop_transactions_v2',
  SUPPLIERS: 'mosaab_shop_suppliers_v2',
  EMPLOYEES: 'mosaab_shop_employees_v2',
  INVENTORY: 'mosaab_shop_inventory_v2',
  CUSTOMERS: 'mosaab_shop_customers_v2',
  SETTINGS: 'mosaab_shop_settings_v2',
  AUTH_USER: 'mosaab_shop_auth_user_v2',
  SHIFTS: 'mosaab_cash_shifts_v2',
  TICKETS: 'mosaab_maintenance_tickets_v2',
};

// Function to check if a transaction is a sale, maintenance, or balance/recharge transaction
export function isSalesMaintBalanceTx(t: Transaction | { type?: string; category?: string }): boolean {
  if (!t) return false;
  const isSale =
    t.type === 'sale' ||
    t.category === 'accessories' ||
    t.category === 'phones' ||
    t.category === 'sale' ||
    t.category === 'sales';
  const isMaint = t.type === 'maintenance' || t.category === 'maintenance';
  const isBalance =
    t.type === 'balance_hadi' ||
    t.type === 'balance_qimma' ||
    t.type === 'recharge' ||
    t.type === 'balance_network' ||
    t.category === 'balance' ||
    t.category === 'recharge';
  return isSale || isMaint || isBalance;
}

// Automatic cleanup of legacy demo caches & purge of sales, maintenance, and balance records
(() => {
  try {
    const legacyKeys = [
      'mosaab_shop_transactions_v1',
      'mosaab_shop_suppliers_v1',
      'mosaab_shop_employees_v1',
      'mosaab_shop_inventory_v1',
      'mosaab_shop_customers_v1',
      'mosaab_transactions',
      'mosaab_suppliers',
      'mosaab_pos_products',
      'mosaab_barcode_catalog',
      'mosaab_shifts_v1',
      'mosaab_maintenance_tickets',
      'mosaab_maintenance_tickets_v1',
      'mosaab_maintenance_tickets_v2',
      'mosaab_maintenance_devices_v2',
      'mosaab_cash_shifts',
      'mosaab_cash_shifts_v2',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // Ignore in SSR / restricted iframe
  }
})();

// Initial empty suppliers with zero balances (ready for real data)
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    name: 'مؤسسة العبصري لقطع الغيار',
    type: 'spare_parts',
    phone: '',
    location: 'صنعاء',
    initialBalance: 0,
    totalPurchases: 0,
    totalPaid: 0,
    remainingBalance: 0,
    notes: 'مورد شاشات أصلية وبطاريات وقطع صيانة معتمدة',
  },
  {
    id: 'sup_2',
    name: 'عمر القاسمي لقطع الصيانة',
    type: 'spare_parts',
    phone: '',
    location: 'صنعاء',
    initialBalance: 0,
    totalPurchases: 0,
    totalPaid: 0,
    remainingBalance: 0,
    notes: 'مورد فلاتات وشواحن وقطع هواتف حديثة',
  },
  {
    id: 'sup_3',
    name: 'خليل الأغبري للإكسسوارات وقطع الغيار',
    type: 'spare_parts',
    phone: '',
    location: 'صنعاء',
    initialBalance: 0,
    totalPurchases: 0,
    totalPaid: 0,
    remainingBalance: 0,
    notes: 'مورد شواحن، كفرات، وسماعات وقطع صيانة',
  },
  {
    id: 'sup_4',
    name: 'محمد مياس (تطبيق الهادي)',
    type: 'balance_network',
    phone: '',
    location: 'صنعاء',
    initialBalance: 0,
    totalPurchases: 0,
    totalPaid: 0,
    remainingBalance: 0,
    notes: 'رصيد اتصالات وفورجي ويمن موبايل وسبأفون ويو - تطبيق الهادي (محمد مياس)',
  },
  {
    id: 'sup_5',
    name: 'فايز أبو علي (شبكة القمة)',
    type: 'balance_network',
    phone: '',
    location: 'صنعاء',
    initialBalance: 0,
    totalPurchases: 0,
    totalPaid: 0,
    remainingBalance: 0,
    notes: 'تغذية رصيد وباقات فوري وبطاقات شحن - شبكة القمة (فايز أبو علي)',
  },
];

/**
 * Normalizes merchant and recharge network supplier names to prevent confusion and duplicate entries
 */
export function normalizeSupplierName(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.includes('مياس') || trimmed.includes('الهادي')) {
    return 'محمد مياس (تطبيق الهادي)';
  }
  if (trimmed.includes('فايز') || trimmed.includes('القمة') || trimmed.includes('الرقم')) {
    return 'فايز أبو علي (شبكة القمة)';
  }
  if (trimmed.includes('العبصري')) {
    return 'مؤسسة العبصري لقطع الغيار';
  }
  if (trimmed.includes('الأغبري') || trimmed.includes('الاغبري')) {
    return 'خليل الأغبري للإكسسوارات وقطع الغيار';
  }
  if (trimmed.includes('القاسمي')) {
    return 'عمر القاسمي لقطع الصيانة';
  }
  if (trimmed.includes('المصنف')) {
    return 'تاجر المصنف';
  }
  if (trimmed.includes('صنعاء')) {
    return 'تاجر صنعاء جوالات';
  }
  return trimmed;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_owner',
    name: 'مصعب الصوفي (المالك)',
    role: 'owner',
    phone: '777000111',
    dailyAllowance: 0,
    salaryOrShare: 'ثلثين (2/3) من صافي أرباح المحل + نصف فايدة الصيانة المخصصة للمحل',
    totalWithdrawals: 0,
    totalAllowances: 0,
    totalEarned: 0,
    currentBalance: 0,
    status: 'active',
  },
  {
    id: 'emp_manager',
    name: 'المدير المستلم للمحل',
    role: 'manager',
    phone: '',
    dailyAllowance: 2000,
    salaryOrShare: 'ثلث (1/3) من صافي أرباح المحل',
    totalWithdrawals: 0,
    totalAllowances: 0,
    totalEarned: 0,
    currentBalance: 0,
    status: 'active',
  },
  {
    id: 'emp_engineer',
    name: 'مهندس الصيانة',
    role: 'engineer',
    phone: '',
    dailyAllowance: 2500,
    salaryOrShare: '50% (نصف صافي فايدة الصيانة) وصرفته على المحل وسحبه يخصم من حسابه',
    totalWithdrawals: 0,
    totalAllowances: 0,
    totalEarned: 0,
    currentBalance: 0,
    status: 'active',
  },
  {
    id: 'emp_worker',
    name: 'العامل / الكاشير',
    role: 'worker',
    phone: '',
    dailyAllowance: 1500,
    salaryOrShare: 'صرفة على المحل + راتب محدد',
    totalWithdrawals: 0,
    totalAllowances: 0,
    totalEarned: 0,
    currentBalance: 0,
    status: 'active',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [];

const HADI_OFFICIAL_TXS = generateHadiOfficialTransactions();

// Clean out legacy Mayas / Hadi transactions from raw static arrays for the updated period
const CLEAN_AUGUST_TRANSACTIONS = AUGUST_TRANSACTIONS.filter((t) => {
  const isMayas =
    (t.supplierName && t.supplierName.includes('مياس')) ||
    (t.description && (t.description.includes('مياس') || t.description.includes('الهادي'))) ||
    t.type === 'balance_hadi' ||
    t.type === 'transfer_mohammed_mayas';
  return !isMayas;
});

const CLEAN_SEPTEMBER_TRANSACTIONS = SEPTEMBER_TRANSACTIONS.filter((t) => {
  const isMayas =
    (t.supplierName && t.supplierName.includes('مياس')) ||
    (t.description && (t.description.includes('مياس') || t.description.includes('الهادي'))) ||
    t.type === 'balance_hadi' ||
    t.type === 'transfer_mohammed_mayas';
  return !isMayas;
});

export const INITIAL_TRANSACTIONS: Transaction[] = [
  ...HADI_OFFICIAL_TXS,
  ...CLEAN_SEPTEMBER_TRANSACTIONS,
  ...CLEAN_AUGUST_TRANSACTIONS,
];

export const INITIAL_CUSTOMERS: CustomerDebt[] = [];

export function loadTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // تنقية وتحديث وإزالة أي معاملات قديمة أو ملغية لمياس / الهادي للفترة 2026-08-01 حتى 2026-09-22
        const hasLegacyCompound = parsed.some((t: Transaction) => t.id && t.id.startsWith('tx_202608') && t.id.endsWith('_acc'));
        let cleanedParsed = parsed.filter(
          (t: Transaction) => {
            if (
              t.id === 'tx-101' ||
              t.id === 'tx-102' ||
              t.id === 'tx-103' ||
              t.id === 'tx-104' ||
              t.id === 'tx-105' ||
              t.id === 'tx-106' ||
              t.id === 'tx-107' ||
              t.id === 'tx-108' ||
              t.referenceNo === 'RENT-Q3' ||
              t.referenceNo === 'UTIL-0926' ||
              t.description?.includes('إيجار مقر') ||
              t.description?.includes('ايجار مقر') ||
              t.description?.includes('فاتورة كهرباء وإنترنت للمقر')
            ) {
              return false;
            }

            // Purge old Mayas/Hadi records for the updated period
            const isMayasOrHadi =
              (t.supplierName && t.supplierName.includes('مياس')) ||
              (t.description && (t.description.includes('مياس') || t.description.includes('الهادي'))) ||
              t.type === 'balance_hadi' ||
              t.type === 'transfer_mohammed_mayas';

            if (isMayasOrHadi && t.date >= '2026-08-01' && t.date <= '2026-09-22' && !t.id.startsWith('hadi-')) {
              return false;
            }

            // إزالة عمليات البيع والصيانة المكررة المحذوفة من يوم 1 شهر 8
            if (
              t.date === '2026-08-01' &&
              (t.type === 'sale' || t.type === 'maintenance' || t.category === 'accessories' || t.category === 'maintenance') &&
              !INITIAL_TRANSACTIONS.some((seed) => seed.id === t.id)
            ) {
              return false;
            }

            return true;
          }
        );
        if (hasLegacyCompound) {
          cleanedParsed = cleanedParsed.filter((t: Transaction) => !(t.id && t.id.startsWith('tx_202608') && t.id.endsWith('_acc')));
        }

        // Merge missing seed transactions (including official Hadi transactions) if not present
        const existingIds = new Set(cleanedParsed.map((t: Transaction) => t.id));
        const missingSeeds = INITIAL_TRANSACTIONS.filter((seed) => !existingIds.has(seed.id));
        let mergedList = cleanedParsed;
        if (missingSeeds.length > 0 || hasLegacyCompound) {
          mergedList = [...missingSeeds, ...cleanedParsed];
        }
        // ضمان عدم تكرار أي عملية بنفس المعرف الفريد ID
        const uniqueTxMap = new Map<string, Transaction>();
        mergedList.forEach((t: Transaction) => {
          if (t.id && !uniqueTxMap.has(t.id)) {
            uniqueTxMap.set(t.id, t);
          }
        });
        mergedList = Array.from(uniqueTxMap.values());
        mergedList.sort((a, b) => {
          const dateCmp = (b.date || '').localeCompare(a.date || '');
          if (dateCmp !== 0) return dateCmp;
          return (b.time || '').localeCompare(a.time || '');
        });
        if (missingSeeds.length > 0 || hasLegacyCompound || mergedList.length !== parsed.length) {
          try {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(mergedList));
          } catch (err) {
            // ignore
          }
        }
        // عزل أي سجلات أجنبية برمجياً بواسطة خدمة التدقيق الجنائي
        const { validItems } = ForensicAuditorService.quarantineBreachedItems(mergedList, CURRENT_STORE_ID);
        return validItems;
      }
    }
  } catch (e) {
    console.error('Failed to load transactions from localStorage', e);
  }
  return INITIAL_TRANSACTIONS;
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    // وسم وتأكيد هوية المتجر (CURRENT_STORE_ID) والمالك (OWNER_USER_ID) لجميع العمليات
    const stampedTransactions = transactions.map((t) => ({
      ...t,
      storeId: t.storeId || CURRENT_STORE_ID,
      ownerId: t.ownerId || OWNER_USER_ID,
    }));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(stampedTransactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
}

export function loadSuppliers(): Supplier[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (data) {
      const parsed = JSON.parse(data);
      const { validItems } = ForensicAuditorService.quarantineBreachedItems<Supplier>(parsed, CURRENT_STORE_ID);
      return validItems;
    }
  } catch (e) {
    console.error('Failed to load suppliers', e);
  }
  return INITIAL_SUPPLIERS;
}

export function saveSuppliers(suppliers: Supplier[]): void {
  try {
    const stamped = suppliers.map((s) => ({
      ...s,
      storeId: s.storeId || CURRENT_STORE_ID,
      ownerId: s.ownerId || OWNER_USER_ID,
    }));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(stamped));
  } catch (e) {
    console.error('Failed to save suppliers', e);
  }
}

export function loadEmployees(): Employee[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load employees', e);
  }
  return INITIAL_EMPLOYEES;
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch (e) {
    console.error('Failed to save employees', e);
  }
}

export function loadInventory(): InventoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (data) {
      const parsed = JSON.parse(data);
      const { validItems } = ForensicAuditorService.quarantineBreachedItems<InventoryItem>(parsed, CURRENT_STORE_ID);
      return validItems;
    }
  } catch (e) {
    console.error('Failed to load inventory', e);
  }
  return INITIAL_INVENTORY;
}

export function saveInventory(inventory: InventoryItem[]): void {
  try {
    const stamped = inventory.map((i) => ({
      ...i,
      storeId: i.storeId || CURRENT_STORE_ID,
      ownerId: i.ownerId || OWNER_USER_ID,
    }));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(stamped));
  } catch (e) {
    console.error('Failed to save inventory', e);
  }
}

export function loadCustomers(): CustomerDebt[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (data) {
      const parsed = JSON.parse(data);
      const { validItems } = ForensicAuditorService.quarantineBreachedItems<CustomerDebt>(parsed, CURRENT_STORE_ID);
      return validItems;
    }
  } catch (e) {
    console.error('Failed to load customers', e);
  }
  return INITIAL_CUSTOMERS;
}

export function saveCustomers(customers: CustomerDebt[]): void {
  try {
    const stamped = customers.map((c) => ({
      ...c,
      storeId: c.storeId || CURRENT_STORE_ID,
      ownerId: c.ownerId || OWNER_USER_ID,
    }));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(stamped));
  } catch (e) {
    console.error('Failed to save customers', e);
  }
}

// Clear all data completely (تصفير ومسح شامل لكافة العمليات والبيانات)
export function clearAllSystemData(): void {
  try {
    const allKeysToClear = [
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.CUSTOMERS,
      STORAGE_KEYS.INVENTORY,
      STORAGE_KEYS.SHIFTS,
      STORAGE_KEYS.TICKETS,
      STORAGE_KEYS.SUPPLIERS,
      'mosaab_shop_transactions_v1',
      'mosaab_shop_transactions_v2',
      'mosaab_shop_suppliers_v1',
      'mosaab_shop_suppliers_v2',
      'mosaab_shop_inventory_v1',
      'mosaab_shop_inventory_v2',
      'mosaab_shop_customers_v1',
      'mosaab_shop_customers_v2',
      'mosaab_transactions',
      'mosaab_suppliers',
      'mosaab_pos_products',
      'mosaab_pos_products_v2',
      'mosaab_barcode_catalog',
      'mosaab_shifts_v1',
      'mosaab_cash_shifts',
      'mosaab_cash_shifts_v2',
      'mosaab_maintenance_tickets',
      'mosaab_maintenance_tickets_v2',
    ];
    allKeysToClear.forEach((key) => localStorage.removeItem(key));

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
  } catch (e) {
    console.error('Failed to clear data', e);
  }
}

export function exportFullBackup(): string {
  const fullBackup = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    shopName: 'محل جوالات وصيانة مصعب الصوفي',
    transactions: loadTransactions(),
    suppliers: loadSuppliers(),
    employees: loadEmployees(),
    inventory: loadInventory(),
    customers: loadCustomers(),
  };
  return JSON.stringify(fullBackup, null, 2);
}

export function importFullBackup(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.transactions) saveTransactions(parsed.transactions);
    if (parsed.suppliers) saveSuppliers(parsed.suppliers);
    if (parsed.employees) saveEmployees(parsed.employees);
    if (parsed.inventory) saveInventory(parsed.inventory);
    if (parsed.customers) saveCustomers(parsed.customers);
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}

export function exportBackupJSON(transactions: Transaction[], suppliers: Supplier[]): void {
  const data = exportFullBackup();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `نسخة_احتياطية_محل_مصعب_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackupJSON(jsonString: string): boolean {
  return importFullBackup(jsonString);
}

export function purgeSalesMaintenanceAndBalance(): {
  removedTransactionsCount: number;
  remainingTransactionsCount: number;
} {
  try {
    const rawTxs = loadTransactions();
    const beforeCount = rawTxs.length;
    const remaining = rawTxs.filter((t) => !isSalesMaintBalanceTx(t));
    saveTransactions(remaining);

    const daysRaw = localStorage.getItem('mosaab_days_data_v2');
    if (daysRaw) {
      const parsedDays: any[] = JSON.parse(daysRaw);
      const cleanedDays = parsedDays.map((d) => ({
        ...d,
        accessories: [],
        phones: [],
        maintenance: [],
        recharge: {
          totalWithoutProfit: 0,
          totalWithProfit: 0,
          totalProfit: 0,
          hadi: { salesWithProfit: 0, salesWithoutProfit: 0, transferredToApp: 0, remainingInApp: 0 },
          qimmah: { salesWithProfit: 0, salesWithoutProfit: 0, transferredToApp: 0, remainingInApp: 0 },
        },
      }));
      localStorage.setItem('mosaab_days_data_v2', JSON.stringify(cleanedDays));
    }

    localStorage.removeItem('mosaab_maintenance_tickets');
    localStorage.removeItem('mosaab_maintenance_tickets_v1');
    localStorage.removeItem('mosaab_maintenance_tickets_v2');
    localStorage.removeItem('mosaab_maintenance_devices_v2');
    localStorage.removeItem('mosaab_shifts_v1');
    localStorage.removeItem('mosaab_cash_shifts');
    localStorage.removeItem('mosaab_cash_shifts_v2');

    return {
      removedTransactionsCount: beforeCount - remaining.length,
      remainingTransactionsCount: remaining.length,
    };
  } catch (err) {
    console.error('Error purging sales, maintenance, and balance:', err);
    return { removedTransactionsCount: 0, remainingTransactionsCount: 0 };
  }
}

export function getActiveStoreId(): string {
  return CURRENT_STORE_ID;
}

export function getActiveOwnerId(): string {
  return OWNER_USER_ID;
}
