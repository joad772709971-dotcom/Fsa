import { ScannedInvoiceResult, Transaction, InventoryItem, Supplier, CustomerDebt } from '../types';
import {
  loadTransactions,
  saveTransactions,
  loadInventory,
  saveInventory,
  loadSuppliers,
  saveSuppliers,
  loadCustomers,
  saveCustomers,
  getActiveStoreId,
  getActiveOwnerId,
} from './storage';

const ARCHIVED_INVOICES_KEY = 'mosaab_archived_invoices_v1';

export function loadArchivedInvoices(): ScannedInvoiceResult[] {
  try {
    const storeId = getActiveStoreId();
    const raw = localStorage.getItem(ARCHIVED_INVOICES_KEY);
    if (!raw) return [];
    const items: ScannedInvoiceResult[] = JSON.parse(raw);
    return items.filter((inv) => !inv.storeId || inv.storeId === storeId);
  } catch (err) {
    console.error('Failed to load archived invoices:', err);
    return [];
  }
}

export function saveArchivedInvoice(invoice: ScannedInvoiceResult): void {
  try {
    const storeId = getActiveStoreId();
    const ownerId = getActiveOwnerId();
    const all = loadArchivedInvoices();
    const existingIndex = all.findIndex((i) => i.id === invoice.id);

    const stamped: ScannedInvoiceResult = {
      ...invoice,
      storeId: invoice.storeId || storeId,
      ownerId: invoice.ownerId || ownerId,
      verifiedAt: invoice.verifiedAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      all[existingIndex] = stamped;
    } else {
      all.unshift(stamped);
    }

    localStorage.setItem(ARCHIVED_INVOICES_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save archived invoice:', err);
  }
}

export function deleteArchivedInvoice(id: string): void {
  try {
    const all = loadArchivedInvoices();
    const filtered = all.filter((i) => i.id !== id);
    localStorage.setItem(ARCHIVED_INVOICES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete archived invoice:', err);
  }
}

/**
 * الاعتماد والترحيل النهائي للفاتورة المفحوصة إلى:
 * 1. سجل المشتريات (Transactions)
 * 2. المخزون (Inventory)
 * 3. حساب المورد (Suppliers)
 * 4. ذمم العملاء (Customer Debts - إذا كانت بطلب العميل)
 * 5. أرشفة صورة الفاتورة للمراجعة والتدقيق
 */
export function approveAndPostScannedInvoice(invoice: ScannedInvoiceResult): {
  success: boolean;
  transactionId: string;
  itemsCount: number;
  message: string;
} {
  const storeId = getActiveStoreId();
  const ownerId = getActiveOwnerId();
  const todayDate = invoice.invoiceDate || new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', hour12: false });

  // 1. إنشاء قيد المشتريات الرئيسي
  const transactions = loadTransactions();
  const itemsSummary = invoice.items.map((i) => `${i.name} (${i.quantity}×${i.unitCost})`).join('، ');
  const purchaseTransactionId = `txn_ocr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newTransaction: Transaction = {
    id: purchaseTransactionId,
    date: todayDate,
    time: nowTime,
    type: 'purchase',
    category: 'purchases',
    description: `فاتورة مشتريات مورد [${invoice.supplierName}] رقم (${invoice.invoiceNumber || 'يدوي'}): ${itemsSummary.substring(0, 150)}`,
    price: invoice.totalAmount, // إجمالي قيمة الفاتورة
    cost: invoice.totalAmount,
    profit: 0,
    storeId,
    ownerId,
    supplierId: invoice.supplierId,
    supplierName: invoice.supplierName,
    notes: invoice.notes ? `ملاحظات: ${invoice.notes}` : undefined,
    attachmentUrl: invoice.imageBase64, // حفظ الصورة مع المعاملة
    paymentMethod: invoice.paymentStatus === 'paid' ? 'cash' : invoice.paymentStatus === 'credit' ? 'debt' : 'transfer',
  };

  transactions.unshift(newTransaction);
  saveTransactions(transactions);

  // 2. ترحيل وتحديث بنود المخزون
  const inventory = loadInventory();
  invoice.items.forEach((item) => {
    // البحث عن صنف مشابه في المخزون
    const existingIndex = inventory.findIndex(
      (inv) => inv.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      // تحديث الكمية والتكلفة
      const existing = inventory[existingIndex];
      const newQty = existing.quantity + item.quantity;
      inventory[existingIndex] = {
        ...existing,
        quantity: newQty,
        costPrice: item.unitCost,
        purchasePrice: item.unitCost,
        sellingPrice: item.suggestedSalePrice || existing.sellingPrice,
        supplierName: invoice.supplierName,
        storeId,
        ownerId,
      };
    } else {
      // إضافة صنف جديد للمخزون
      const newInvItem: InventoryItem = {
        id: `inv_ocr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        category:
          item.category === 'screens'
            ? 'قطع غيار'
            : item.category === 'batteries'
            ? 'قطع غيار'
            : item.category === 'spare_parts'
            ? 'قطع غيار'
            : item.category === 'maintenance_tools'
            ? 'أدوات صيانة'
            : item.category === 'accessories'
            ? 'إكسسوارات'
            : 'قطع غيار',
        quantity: item.quantity,
        costPrice: item.unitCost,
        purchasePrice: item.unitCost,
        sellingPrice: item.suggestedSalePrice || Math.round(item.unitCost * 1.3),
        supplierName: invoice.supplierName,
        supplierId: invoice.supplierId,
        barcode: item.barcode,
        storeId,
        ownerId,
      };
      inventory.push(newInvItem);
    }
  });
  saveInventory(inventory);

  // 3. تحديث حساب المورد (إذا تم تحديد مورد أو اختيار الربط)
  if (invoice.linkToSupplierDebt && invoice.supplierName) {
    const suppliers = loadSuppliers();
    const supIndex = suppliers.findIndex(
      (s) =>
        (invoice.supplierId && s.id === invoice.supplierId) ||
        s.name.trim().toLowerCase() === invoice.supplierName.trim().toLowerCase()
    );

    if (supIndex >= 0) {
      const sup = suppliers[supIndex];
      const addedPurchases = invoice.totalAmount;
      const addedPaid = invoice.paidAmount || 0;
      const addedRemaining = invoice.remainingBalance > 0 ? invoice.remainingBalance : addedPurchases - addedPaid;

      suppliers[supIndex] = {
        ...sup,
        totalPurchases: sup.totalPurchases + addedPurchases,
        totalPaid: sup.totalPaid + addedPaid,
        remainingBalance: sup.remainingBalance + addedRemaining,
        notes: `${sup.notes || ''}\nفاتورة OCR بتاريخ ${todayDate} بمبلغ ${addedPurchases} ر.ي`.trim(),
        storeId,
        ownerId,
      };
      saveSuppliers(suppliers);
    } else {
      // مورد جديد
      const newSup: Supplier = {
        id: `sup_ocr_${Date.now()}`,
        name: invoice.supplierName,
        type: 'spare_parts',
        phone: '',
        location: 'صنعاء',
        initialBalance: invoice.previousBalance || 0,
        totalPurchases: invoice.totalAmount,
        totalPaid: invoice.paidAmount || 0,
        remainingBalance: invoice.remainingBalance || (invoice.totalAmount - (invoice.paidAmount || 0)),
        notes: `مورد تم إضافته تلقائياً من فاتورة OCR بتاريخ ${todayDate}`,
        storeId,
        ownerId,
      };
      suppliers.push(newSup);
      saveSuppliers(suppliers);
    }
  }

  // 4. ترحيل كدين عميل (إذا كانت المشتريات لزبون معين أو طلب العميل تسجيلها عليه)
  if (invoice.linkToCustomerDebt && invoice.debtCustomerName && invoice.remainingBalance > 0) {
    const customers = loadCustomers();
    const custIndex = customers.findIndex(
      (c) => c.name.trim().toLowerCase() === invoice.debtCustomerName!.trim().toLowerCase()
    );

    if (custIndex >= 0) {
      const cust = customers[custIndex];
      customers[custIndex] = {
        ...cust,
        totalDebt: cust.totalDebt + invoice.remainingBalance,
        remainingDebt: cust.remainingDebt + invoice.remainingBalance,
        lastTransactionDate: todayDate,
        notes: `${cust.notes || ''}\nفاتورة قطع رقم ${invoice.invoiceNumber || 'يدوي'} بمبلغ ${invoice.remainingBalance} ر.ي`.trim(),
        storeId,
        ownerId,
      };
      saveCustomers(customers);
    } else {
      const newCust: CustomerDebt = {
        id: `cust_ocr_${Date.now()}`,
        name: invoice.debtCustomerName,
        phone: invoice.debtCustomerPhone || '',
        totalDebt: invoice.remainingBalance,
        totalPaid: 0,
        remainingDebt: invoice.remainingBalance,
        lastTransactionDate: todayDate,
        notes: `دين فاتورة قطع صيانة (${invoice.supplierName}) رقم ${invoice.invoiceNumber || 'يدوي'}`,
        storeId,
        ownerId,
      };
      customers.push(newCust);
      saveCustomers(customers);
    }
  }

  // 5. حفظ الفاتورة المؤرشفة
  saveArchivedInvoice({
    ...invoice,
    id: invoice.id || `inv_arch_${Date.now()}`,
    verifiedAt: new Date().toISOString(),
  });

  return {
    success: true,
    transactionId: purchaseTransactionId,
    itemsCount: invoice.items.length,
    message: `تم اعتماد الفاتورة وترحيل ${invoice.items.length} صنف إلى المخزون وسجل المشتريات بنجاح.`,
  };
}
