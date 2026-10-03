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

// Automatic cleanup of legacy demo caches & purge of all previous entries
(() => {
  try {
    const PURGE_KEY = 'mosaab_system_clean_reset_v6';
    if (typeof localStorage !== 'undefined' && localStorage.getItem(PURGE_KEY) !== 'true') {
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
        'mosaab_shop_transactions_v2',
        'mosaab_days_data_v2',
        'mosaab_shop_inventory_v2',
        'mosaab_shop_customers_v2',
        'mosaab_pending_cloud_tx_queue',
        'mosaab_deleted_tx_ids',
        'mosaab_price_memory_v1',
        'mosaab_shop_suppliers_v2',
        'mosaab_shop_employees_v2',
        'mosaab_system_initialized_flag',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('mosaab_shop_transactions_v2', JSON.stringify([]));
      localStorage.setItem('mosaab_days_data_v2', JSON.stringify([]));
      localStorage.setItem(PURGE_KEY, 'true');
    }
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
    name: 'عبد الغني المحفلي (المالك)',
    role: 'owner',
    phone: '',
    dailyAllowance: 0,
    salaryOrShare: 'المالك والمشرف العام (تصفية رأس المال والأرباح)',
    totalWithdrawals: 0,
    totalAllowances: 0,
    totalEarned: 0,
    currentBalance: 0,
    status: 'active',
  },
  {
    id: 'emp_partner_mosaab',
    name: 'مصعب الصوفي (الشريك / الإدارة)',
    role: 'manager',
    phone: '777000111',
    dailyAllowance: 0,
    salaryOrShare: 'إدارة المحل والمبيعات وتصفية الشركاء',
    totalWithdrawals: 0,
    totalAllowances: 0,
    totalEarned: 0,
    currentBalance: 0,
    status: 'active',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [];

// قاعدة بيانات المعاملات مصفية ومصفرة بالكامل لبدء العمل النظيف
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CUSTOMERS: CustomerDebt[] = [];

// سجل معرفات القيود المحذوفة لمنع استرجاعها تلقائياً عند إعادة فتح التطبيق أو المزامنة
const DELETED_TX_IDS_KEY = 'mosaab_deleted_tx_ids';

export function getDeletedTxIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_TX_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
}

export function markTxDeleted(id: string): void {
  try {
    const set = getDeletedTxIds();
    set.add(id);
    localStorage.setItem(DELETED_TX_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function unmarkTxDeleted(id: string): void {
  try {
    const set = getDeletedTxIds();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(DELETED_TX_IDS_KEY, JSON.stringify(Array.from(set)));
    }
  } catch (e) {}
}

export function loadTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const deletedIds = getDeletedTxIds();

    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // تنقية وتحديث أي معاملات ملغية أو محذوفة سابقاً
        const cleanedParsed = parsed.filter((t: Transaction) => {
          if (!t || !t.id) return false;
          if (deletedIds.has(t.id)) return false;

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

          // تنقية العمليات الملغية لمياس / الهادي
          const isMayasOrHadi =
            (t.supplierName && t.supplierName.includes('مياس')) ||
            (t.description && (t.description.includes('مياس') || t.description.includes('الهادي'))) ||
            t.type === 'balance_hadi' ||
            t.type === 'transfer_mohammed_mayas';

          if (isMayasOrHadi && t.date >= '2026-08-01' && t.date <= '2026-09-22' && !t.id.startsWith('hadi-')) {
            return false;
          }

          return true;
        });

        // فرز العمليات تنازلياً بحسب التاريخ والوقت
        cleanedParsed.sort((a, b) => {
          const dateCmp = (b.date || '').localeCompare(a.date || '');
          if (dateCmp !== 0) return dateCmp;
          return (b.time || '').localeCompare(a.time || '');
        });

        // عزل أي سجلات أجنبية برمجياً بواسطة خدمة التدقيق الجنائي
        const { validItems } = ForensicAuditorService.quarantineBreachedItems(cleanedParsed, CURRENT_STORE_ID);
        return validItems;
      }
    }

    // إذا كان النظام قد تم تشغيله وتهيئته مسبقاً، لا يتم إعادة توليد العمليات التجريبية إطلاقاً
    const hasInitialized = localStorage.getItem('mosaab_system_initialized_flag');
    if (hasInitialized === 'true') {
      return [];
    }
  } catch (e) {
    console.error('Failed to load transactions from localStorage', e);
  }

  // التهيئة الأولية للمرة الأولى فقط عند تشغيل التطبيق في جهاز فارغ تماماً لأول مرة
  try {
    localStorage.setItem('mosaab_system_initialized_flag', 'true');
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
  } catch (err) {}
  return INITIAL_TRANSACTIONS;
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    const deletedIds = getDeletedTxIds();
    // تصفية أي معاملات محذوفة والتأكد من وسوم المتجر والوقت
    const active = transactions.filter((t) => t && t.id && !deletedIds.has(t.id));
    const stampedTransactions = active.map((t) => ({
      ...t,
      storeId: t.storeId || CURRENT_STORE_ID,
      ownerId: t.ownerId || OWNER_USER_ID,
      updatedAt: t.updatedAt || new Date().toISOString(),
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
