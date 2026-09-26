import {
  TelecomStatementRow,
  TelecomStatementFilter,
  TelecomStatementSummary,
  CustomerDebt,
} from '../types';
import {
  loadCustomers,
  saveCustomers,
  getActiveStoreId,
  getActiveOwnerId,
} from './storage';

const TELECOM_ROWS_KEY = 'mosaab_telecom_statement_rows_v1';

export function loadTelecomStatementRows(): TelecomStatementRow[] {
  try {
    const storeId = getActiveStoreId();
    const raw = localStorage.getItem(TELECOM_ROWS_KEY);
    if (!raw) return [];
    const items: TelecomStatementRow[] = JSON.parse(raw);
    return items.filter((row) => !row.storeId || row.storeId === storeId);
  } catch (err) {
    console.error('Failed to load telecom statement rows:', err);
    return [];
  }
}

export function saveTelecomStatementRows(rows: TelecomStatementRow[]): void {
  try {
    const storeId = getActiveStoreId();
    const ownerId = getActiveOwnerId();
    const existing = loadTelecomStatementRows();

    // Deduplicate by referenceId + timestamp
    const existingRefMap = new Map(existing.map((r) => [`${r.referenceId}_${r.date}`, r]));

    rows.forEach((r) => {
      const key = `${r.referenceId}_${r.date}`;
      const stamped: TelecomStatementRow = {
        ...r,
        storeId: r.storeId || storeId,
        ownerId: r.ownerId || ownerId,
      };
      existingRefMap.set(key, stamped);
    });

    const combined = Array.from(existingRefMap.values());
    // Sort descending by date and time
    combined.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

    localStorage.setItem(TELECOM_ROWS_KEY, JSON.stringify(combined));
  } catch (err) {
    console.error('Failed to save telecom statement rows:', err);
  }
}

export function deleteTelecomStatementRow(id: string): void {
  try {
    const all = loadTelecomStatementRows();
    const filtered = all.filter((r) => r.id !== id);
    localStorage.setItem(TELECOM_ROWS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete telecom row:', err);
  }
}

export function clearAllTelecomStatementRows(): void {
  localStorage.removeItem(TELECOM_ROWS_KEY);
}

/**
 * فلترة العمليات زمنياً ووفق الشبكة ونوع العملية
 */
export function filterTelecomStatementRows(
  rows: TelecomStatementRow[],
  filter: TelecomStatementFilter
): TelecomStatementRow[] {
  return rows.filter((row) => {
    // 1. زمنياً
    if (filter.timePeriod === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (row.date !== today) return false;
    } else if (filter.timePeriod === 'month') {
      const monthPrefix = filter.selectedMonth || new Date().toISOString().substring(0, 7);
      if (!row.date.startsWith(monthPrefix)) return false;
    } else if (filter.timePeriod === 'year') {
      const yearPrefix = filter.selectedYear || new Date().getFullYear().toString();
      if (!row.date.startsWith(yearPrefix)) return false;
    } else if (filter.timePeriod === 'custom') {
      if (filter.customStartDate && row.date < filter.customStartDate) return false;
      if (filter.customEndDate && row.date > filter.customEndDate) return false;
    }

    // 2. حسب الشبكة / المزود
    if (filter.operator && filter.operator !== 'all') {
      if (row.operator !== filter.operator) return false;
    }

    // 3. حسب نوع العملية
    if (filter.operationType && filter.operationType !== 'all') {
      if (row.operationType !== filter.operationType) return false;
    }

    // 4. حسب الحالة
    if (filter.status && filter.status !== 'all') {
      if (row.status !== filter.status) return false;
    }

    // 5. البحث النصي
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      const matchNumber = row.targetNumber.toLowerCase().includes(q);
      const matchPackage = (row.packageName || '').toLowerCase().includes(q);
      const matchRef = row.referenceId.toLowerCase().includes(q);
      const matchCustomer = (row.customerName || '').toLowerCase().includes(q);
      const matchNotes = (row.notes || '').toLowerCase().includes(q);
      if (!matchNumber && !matchPackage && !matchRef && !matchCustomer && !matchNotes) {
        return false;
      }
    }

    return true;
  });
}

/**
 * حساب الملخص والمؤشرات الإحصائية والمالية لمجموعة من العمليات
 */
export function calculateTelecomStatementSummary(rows: TelecomStatementRow[]): TelecomStatementSummary {
  let totalAmount = 0;
  let totalSellingPrice = 0;
  let totalNetProfit = 0;
  let successCount = 0;
  let failedCount = 0;

  const byOperator: Record<string, { count: number; amount: number; profit: number }> = {};
  const byType: Record<string, { count: number; amount: number; profit: number }> = {};

  rows.forEach((row) => {
    if (row.status === 'success') {
      successCount++;
      totalAmount += row.amount || 0;
      totalSellingPrice += row.sellingPrice || 0;
      totalNetProfit += row.netProfit || 0;

      // Group by operator
      if (!byOperator[row.operator]) {
        byOperator[row.operator] = { count: 0, amount: 0, profit: 0 };
      }
      byOperator[row.operator].count++;
      byOperator[row.operator].amount += row.amount || 0;
      byOperator[row.operator].profit += row.netProfit || 0;

      // Group by type
      if (!byType[row.operationType]) {
        byType[row.operationType] = { count: 0, amount: 0, profit: 0 };
      }
      byType[row.operationType].count++;
      byType[row.operationType].amount += row.amount || 0;
      byType[row.operationType].profit += row.netProfit || 0;
    } else {
      failedCount++;
    }
  });

  const profitMarginPercentage = totalSellingPrice > 0 ? (totalNetProfit / totalSellingPrice) * 100 : 0;

  return {
    totalCount: rows.length,
    totalAmount,
    totalSellingPrice,
    totalNetProfit,
    profitMarginPercentage: Number(profitMarginPercentage.toFixed(1)),
    successCount,
    failedCount,
    byOperator,
    byType,
  };
}

/**
 * تحويل عملية سداد / باقة إلى دين عميل مع تحديث السجل وحساب العميل
 */
export function convertStatementRowToCustomerDebt(
  rowId: string,
  customerName: string,
  customerPhone?: string,
  notes?: string
): { success: boolean; customer: CustomerDebt; message: string } {
  const storeId = getActiveStoreId();
  const ownerId = getActiveOwnerId();
  const allRows = loadTelecomStatementRows();
  const rowIndex = allRows.findIndex((r) => r.id === rowId);

  if (rowIndex === -1) {
    throw new Error('العملية غير موجودة');
  }

  const row = allRows[rowIndex];
  const debtAmount = row.sellingPrice || row.amount;

  // 1. تحديث أو إنشاء حساب العميل
  const customers = loadCustomers();
  const custIndex = customers.findIndex(
    (c) => c.name.trim().toLowerCase() === customerName.trim().toLowerCase()
  );

  let updatedCustomer: CustomerDebt;

  if (custIndex >= 0) {
    const existingCust = customers[custIndex];
    updatedCustomer = {
      ...existingCust,
      phone: customerPhone || existingCust.phone,
      totalDebt: existingCust.totalDebt + debtAmount,
      remainingDebt: existingCust.remainingDebt + debtAmount,
      lastTransactionDate: row.date,
      notes: `${existingCust.notes || ''}\nدين سداد/باقة [${row.operatorNameAr}] للرقم (${row.targetNumber}) بمبلغ ${debtAmount} ر.ي بتاريخ ${row.date}`.trim(),
      storeId,
      ownerId,
    };
    customers[custIndex] = updatedCustomer;
  } else {
    updatedCustomer = {
      id: `cust_tel_${Date.now()}`,
      name: customerName,
      phone: customerPhone || '',
      totalDebt: debtAmount,
      totalPaid: 0,
      remainingDebt: debtAmount,
      lastTransactionDate: row.date,
      notes: `دين سداد/باقة [${row.operatorNameAr}] للرقم (${row.targetNumber}) بمبلغ ${debtAmount} ر.ي`,
      storeId,
      ownerId,
    };
    customers.push(updatedCustomer);
  }

  saveCustomers(customers);

  // 2. تحديث صف العملية
  allRows[rowIndex] = {
    ...row,
    isDebt: true,
    customerId: updatedCustomer.id,
    customerName: updatedCustomer.name,
    customerPhone: updatedCustomer.phone,
    notes: `${row.notes || ''} [تم تحويلها لدين على: ${updatedCustomer.name}]`.trim(),
  };

  localStorage.setItem(TELECOM_ROWS_KEY, JSON.stringify(allRows));

  return {
    success: true,
    customer: updatedCustomer,
    message: `تم تحويل العملية بنجاح إلى حساب العميل [${updatedCustomer.name}] بمبلغ ${debtAmount} ر.ي`,
  };
}
