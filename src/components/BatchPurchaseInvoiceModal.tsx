import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  Package,
  Wrench,
  ShoppingBag,
  CreditCard,
  Building2,
  DollarSign,
  AlertCircle,
  Calendar,
  TrendingUp,
  Tag,
  Truck,
  Phone,
  User,
} from 'lucide-react';
import { Transaction, PaymentMethod } from '../types';
import { normalizeSupplierName } from '../utils/storage';
import { findBestMatchPrice, learnOrUpdatePriceMemory } from '../utils/priceMemoryStorage';
import { normalizeArabicNumerals } from '../utils/keyboardHelper';

export type DestinationCategory = 'maintenance_parts' | 'maintenance_expense' | 'shop_stock' | 'balance_topup';

export interface BatchItem {
  id: string;
  description: string;
  destination: DestinationCategory;
  quantity: number;
  unitCost: number; // سعر الشراء للقطعة
  totalCost: number; // إجمالي الشراء
  sellingPrice: number; // سعر البيع المقترح للزبون
}

import { getTodayDateString } from '../utils/dateHelper';

interface BatchPurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  allKnownSuppliers: string[];
  onSaveBatch: (purchasesTransactions: Transaction[], expenseTransferTx?: Transaction) => void;
}

export const BatchPurchaseInvoiceModal: React.FC<BatchPurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  allKnownSuppliers,
  onSaveBatch,
}) => {
  // Invoice Date (Allows entering purchases for ANY day)
  const [invoiceDate, setInvoiceDate] = useState<string>(() => currentDate || getTodayDateString());

  useEffect(() => {
    setInvoiceDate(currentDate || getTodayDateString());
  }, [currentDate]);
  // Supplier selection
  const [selectedSupplier, setSelectedSupplier] = useState<string>('مؤسسة العبصري لقطع الغيار');
  const [customSupplier, setCustomSupplier] = useState<string>('');
  const [isNewSupplier, setIsNewSupplier] = useState<boolean>(false);

  // Quick Smart Text Input for instant parsing
  const [quickInputText, setQuickInputText] = useState<string>('');

  // Items in invoice - defaulted to empty on open
  const [items, setItems] = useState<BatchItem[]>([
    {
      id: 'item_1',
      description: '',
      destination: 'maintenance_parts',
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      sellingPrice: 0,
    },
  ]);

  // Payment amounts (centralized - empty default)
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [invoiceRef, setInvoiceRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [autoCreateExpenseTransfer, setAutoCreateExpenseTransfer] = useState<boolean>(true);

  // Delivery Courier Details (بيانات من وصل البضاعة ورقم هاتفه وأجرة التوصيل)
  const [showCourierSection, setShowCourierSection] = useState<boolean>(false);
  const [courierName, setCourierName] = useState<string>('');
  const [courierPhone, setCourierPhone] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<string>('');
  const [deliveryPaidBy, setDeliveryPaidBy] = useState<'shop' | 'supplier'>('shop');

  // Reset defaults when opening modal: names and prices empty!
  useEffect(() => {
    if (isOpen) {
      setInvoiceDate(currentDate);
      setItems([
        {
          id: `item_${Date.now()}`,
          description: '',
          destination: 'maintenance_parts',
          quantity: 1,
          unitCost: 0,
          totalCost: 0,
          sellingPrice: 0,
        },
      ]);
      setPaidAmount('');
      setInvoiceRef('');
      setNotes('');
      setCourierName('');
      setCourierPhone('');
      setDeliveryFee('');
      setShowCourierSection(false);
      setQuickInputText('');
    }
  }, [isOpen, currentDate]);

  // Calculate invoice total (total purchase cost)
  const totalInvoiceAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  }, [items]);

  // Calculate expected total selling amount and profit
  const totalExpectedSales = useMemo(() => {
    return items.reduce((sum, item) => sum + ((Number(item.sellingPrice) || 0) * (Number(item.quantity) || 1)), 0);
  }, [items]);

  const totalExpectedProfit = Math.max(0, totalExpectedSales - totalInvoiceAmount);

  // Calculate remaining
  const numPaid = Number(normalizeArabicNumerals(paidAmount)) || 0;
  const remainingAmount = Math.max(0, totalInvoiceAmount - numPaid);

  if (!isOpen) return null;

  const actualSupplierName = isNewSupplier
    ? customSupplier.trim() || 'تاجر جديد'
    : normalizeSupplierName(selectedSupplier);

  // Add a blank row
  const handleAddItem = (destination: DestinationCategory = 'maintenance_parts') => {
    const newItem: BatchItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      description: '',
      destination,
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      sellingPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update an item
  const handleUpdateItem = (id: string, field: keyof BatchItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // If description changed, check if we have a match in price catalog to auto-suggest
        if (field === 'description' && typeof value === 'string' && value.trim().length >= 3) {
          const matched = findBestMatchPrice(value);
          if (matched && (!item.unitCost || item.unitCost === 0)) {
            updated.unitCost = matched.costPrice || 0;
            updated.sellingPrice = matched.sellingPrice || 0;
            const q = Number(item.quantity) || 1;
            updated.totalCost = q * (matched.costPrice || 0);
          }
        }

        if (field === 'quantity' || field === 'unitCost') {
          const q = Number(field === 'quantity' ? value : item.quantity) || 1;
          const c = Number(field === 'unitCost' ? value : item.unitCost) || 0;
          updated.totalCost = q * c;
        }
        return updated;
      })
    );
  };

  // Remove an item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setItems([{
        id: `item_${Date.now()}`,
        description: '',
        destination: 'maintenance_parts',
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
        sellingPrice: 0,
      }]);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Smart Parser: parses strings like "شاشة A10 5000 + 2 شلك 1200 + 5 شواحن 3000 + كرت 1000"
  const handleParseQuickInput = () => {
    if (!quickInputText.trim()) return;

    // Split by +, comma, or newline
    const segments = quickInputText.split(/[+،,\n]+/).map((s) => s.trim()).filter(Boolean);
    const newParsedItems: BatchItem[] = [];

    segments.forEach((seg) => {
      const numbers = seg.match(/\d+(\.\d+)?/g);
      let qty = 1;
      let cost = 0;
      let sell = 0;

      if (numbers && numbers.length >= 3) {
        qty = parseFloat(numbers[0]);
        cost = parseFloat(numbers[1]);
        sell = parseFloat(numbers[2]);
      } else if (numbers && numbers.length === 2) {
        const n1 = parseFloat(numbers[0]);
        const n2 = parseFloat(numbers[1]);
        if (n1 <= 50 && n2 > n1) {
          qty = n1;
          cost = n2;
        } else {
          cost = n1;
          sell = n2;
        }
      } else if (numbers && numbers.length === 1) {
        cost = parseFloat(numbers[0]);
      }

      // Clean description by removing price words
      const cleanedDesc = seg
        .replace(/بـ|بسعر|بمبلغ|ريال|ر\.ي|شراء|بيع/g, '')
        .trim();

      // Guess destination category
      let dest: DestinationCategory = 'shop_stock';
      const lower = cleanedDesc.toLowerCase();
      if (
        lower.includes('شلك') ||
        lower.includes('غراء') ||
        lower.includes('فلكس') ||
        lower.includes('لحام') ||
        lower.includes('قصدير') ||
        lower.includes('لصق') ||
        lower.includes('سيم') ||
        lower.includes('مفك') ||
        lower.includes('مستلزمات') ||
        lower.includes('خرج')
      ) {
        dest = 'maintenance_expense';
      } else if (
        lower.includes('شاشة') ||
        lower.includes('شاشه') ||
        lower.includes('بطارية') ||
        lower.includes('بطاريه') ||
        lower.includes('فلاتة') ||
        lower.includes('فلاته') ||
        lower.includes('كاميرا') ||
        lower.includes('مدخل') ||
        lower.includes('سماعة داخلية') ||
        lower.includes('ايسي') ||
        lower.includes('باغة') ||
        lower.includes('صيانة')
      ) {
        dest = 'maintenance_parts';
      } else if (
        lower.includes('رصيد') ||
        lower.includes('كرت') ||
        lower.includes('شحن') ||
        lower.includes('باقة') ||
        lower.includes('يمن موبايل') ||
        lower.includes('سبأفون') ||
        lower.includes('يو')
      ) {
        dest = 'balance_topup';
      }

      const unitCostVal = cost > 0 ? (qty > 1 && numbers?.length === 1 ? Math.round(cost / qty) : cost) : 0;
      const calculatedSelling = sell > 0 ? sell : (unitCostVal > 0 ? Math.round(unitCostVal * 1.35) : 0);

      newParsedItems.push({
        id: `parsed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        description: cleanedDesc || 'صنف مشتريات',
        destination: dest,
        quantity: qty,
        unitCost: unitCostVal,
        totalCost: unitCostVal * qty,
        sellingPrice: calculatedSelling,
      });
    });

    if (newParsedItems.length > 0) {
      setItems((prev) => {
        const validPrev = prev.filter((p) => p.description.trim() || p.totalCost > 0);
        return [...validPrev, ...newParsedItems];
      });
      setQuickInputText('');
    }
  };

  // Submit invoice
  const handleSaveInvoice = () => {
    const validItems = items.filter((i) => i.description.trim() || i.totalCost > 0);
    if (validItems.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل في الفاتورة');
      return;
    }

    const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // 1. Create a purchase transaction for each item with both purchase cost and selling price
    const purchaseTxs: Transaction[] = validItems.map((item, idx) => {
      const destLabel =
        item.destination === 'maintenance_parts'
          ? 'قطع صيانة'
          : item.destination === 'maintenance_expense'
          ? 'خرج صيانة ومستلزمات (شلك وغيره)'
          : item.destination === 'balance_topup'
          ? 'رصيد وكروت شحن'
          : 'بضاعة وإكسسوارات المحل';

      // Learn / save into memory so future sales & maintenance recall both buying and selling prices!
      try {
        const catMap = item.destination === 'maintenance_parts'
          ? 'screens'
          : item.destination === 'maintenance_expense'
          ? 'spare_parts'
          : item.destination === 'balance_topup'
          ? 'other'
          : 'accessories';

        learnOrUpdatePriceMemory(
          item.description.trim() || `صنف من ${actualSupplierName}`,
          item.unitCost,
          item.sellingPrice || Math.round(item.unitCost * 1.3),
          catMap as any,
          actualSupplierName,
          `مشتريات ${invoiceDate} من ${actualSupplierName}`,
          item.quantity
        );
      } catch (err) {
        console.warn('Could not auto-learn price memory item:', err);
      }

      const batchNum = invoiceRef.trim() || `PUR-${Date.now().toString().slice(-5)}`;
      const courierInfo = courierName.trim()
        ? ` | موصل البضاعة: ${courierName.trim()}${courierPhone.trim() ? ` (${courierPhone.trim()})` : ''}${deliveryFee ? ` (أجرة توصيل: ${deliveryFee} ر.ي)` : ''}`
        : '';

      return {
        id: `purch_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
        date: invoiceDate,
        time: currentTime,
        type: 'purchase',
        category: 'purchases',
        description: item.description.trim() || `صنف من ${actualSupplierName}`,
        quantity: item.quantity,
        cost: item.totalCost,
        price: item.sellingPrice || 0, // Recorded as proposed selling price
        profit: Math.max(0, (item.sellingPrice - item.unitCost) * item.quantity),
        supplierName: actualSupplierName,
        destinationCategory: item.destination,
        paidAmount: 0, // Centralized at invoice level - not mashed into individual items!
        remainingAmount: 0,
        notes: `فاتورة شراء #${batchNum} [${actualSupplierName}] | الوجهة: ${destLabel} | شراء للقطعة: ${item.unitCost.toLocaleString()} ر.ي | بيع مقترح: ${(item.sellingPrice || 0).toLocaleString()} ر.ي | إجمالي الفاتورة: ${totalInvoiceAmount.toLocaleString()} ر.ي | الواصل: ${numPaid.toLocaleString()} ر.ي | باقي له: ${remainingAmount.toLocaleString()} ر.ي${courierInfo}${notes ? ` | ${notes}` : ''}`,
        paymentMethod: paymentMethod,
        status: remainingAmount > 0 ? 'partially_paid' : 'paid',
      };
    });

    // 2. Create the centralized Expense / Transfer transaction in the Expenses section ("الواصل للتاجر")
    let expenseTx: Transaction | undefined = undefined;
    if (autoCreateExpenseTransfer && numPaid > 0) {
      const batchNum = invoiceRef.trim() || `PUR-${Date.now().toString().slice(-5)}`;
      const courierInfo = courierName.trim()
        ? ` | موصل البضاعة: ${courierName.trim()}${courierPhone.trim() ? ` (هاتف: ${courierPhone.trim()})` : ''}${deliveryFee ? ` | أجرة التوصيل: ${deliveryFee} ر.ي (${deliveryPaidBy === 'shop' ? 'على المحل' : 'مخصوم من التاجر'})` : ''}`
        : '';

      expenseTx = {
        id: `exp_transfer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: invoiceDate,
        time: currentTime,
        type: 'transfer_to_supplier', // appears directly in expTx in DailyLedgerView
        category: 'purchases',
        description: `واصل مسدد للتاجر ${actualSupplierName} (إجمالي المشتريات: ${totalInvoiceAmount.toLocaleString()} ر.ي | الواصل: ${numPaid.toLocaleString()} ر.ي | باقي له: ${remainingAmount.toLocaleString()} ر.ي)`,
        price: numPaid,
        cost: numPaid,
        profit: 0,
        supplierName: actualSupplierName,
        paidAmount: numPaid,
        remainingAmount: remainingAmount,
        paymentMethod: paymentMethod,
        notes: `واصل فاتورة مشتريات #${batchNum} [${invoiceDate}] | شراء أصناف: (${validItems.map((i) => `${i.description} ×${i.quantity}`).join(' + ')}) | إجمالي المشتريات: ${totalInvoiceAmount.toLocaleString()} ر.ي | الواصل المسدد: ${numPaid.toLocaleString()} ر.ي | باقي للتاجر: ${remainingAmount.toLocaleString()} ر.ي${courierInfo}${invoiceRef ? ` | سند: ${invoiceRef}` : ''}${notes ? ` | ${notes}` : ''}`,
      };
    }

    onSaveBatch(purchaseTxs, expenseTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Receipt className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">فاتورة مشتريات مجمعة من تاجر</h2>
              <p className="text-[11px] sm:text-xs text-teal-200 mt-0.5">
                تحديد التاجر وتاريخ أي يوم، وتحديد سعر الشراء وسعر البيع لكل صنف مع ترحيل "كم رسلت له" في الخرج
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {/* Top Bar: Date & Supplier Selection */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Invoice Date Picker */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>تاريخ المشتريات (لأي يوم):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 font-mono cursor-pointer"
                />
                {invoiceDate !== currentDate && (
                  <button
                    type="button"
                    onClick={() => setInvoiceDate(currentDate)}
                    className="text-[10px] px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold shrink-0 cursor-pointer"
                    title="العودة لليوم المحدد في اليومية"
                  >
                    اليوم
                  </button>
                )}
              </div>
            </div>

            {/* Supplier Selector */}
            <div className="md:col-span-5 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>التاجر / المورد:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewSupplier(!isNewSupplier)}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-800 underline flex items-center gap-1 cursor-pointer"
                >
                  {isNewSupplier ? '← من القائمة' : '+ تاجر جديد'}
                </button>
              </div>

              {isNewSupplier ? (
                <input
                  type="text"
                  value={customSupplier}
                  onChange={(e) => setCustomSupplier(e.target.value)}
                  placeholder="اكتب اسم التاجر الجديد..."
                  className="w-full p-2 bg-slate-50 border border-teal-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              ) : (
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {allKnownSuppliers.map((sup) => (
                    <option key={sup} value={sup}>
                      {sup}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Invoice Reference / Number */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">رقم الفاتورة / السند:</label>
              <input
                type="text"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="رقم السند (اختياري)..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Smart AI Quick Parser Bar */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>إدخال نصي سريع ذكي (يكفيك سطر واحد لتفكيك الأصناف):</span>
              </label>
              <span className="text-[10px] text-amber-700">مثال: شاشة A10 شراء 5500 بيع 8000 + 2 شلك 800</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickInputText}
                onChange={(e) => setQuickInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleParseQuickInput();
                  }
                }}
                placeholder="اكتب الأصناف مفصولة بـ + (مثال: شاشة سامسونج 6000 بيع 9000 + 5 كابلات 1200)..."
                className="flex-1 p-2 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleParseQuickInput}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تفكيك الفاتورة ⚡</span>
              </button>
            </div>
          </div>

          {/* Items Table with Buying Price & Selling Price */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800">
                  أصناف الفاتورة ({items.length} صنف)
                </span>
                <span className="text-[11px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  💡 تذكر: سعر الشراء يحسب التكلفة، وسعر البيع يحفظ في الذاكرة للبيع المستقبلي
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddItem('maintenance_parts')}
                  className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Wrench className="w-3 h-3" />
                  <span>+ قطعة صيانة</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('maintenance_expense')}
                  className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>+ خرج شلك ومستلزمات</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('shop_stock')}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>+ بضاعة للمحل</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('balance_topup')}
                  className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>+ رصيد</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2 min-w-[180px]">اسم الصنف / البيان</th>
                    <th className="p-2 w-36">الوجهة</th>
                    <th className="p-2 w-16 text-center">الكمية</th>
                    <th className="p-2 w-28 text-center bg-amber-50/60 text-amber-950">سعر الشراء (للقطعة)</th>
                    <th className="p-2 w-28 text-center font-black">إجمالي الشراء</th>
                    <th className="p-2 w-28 text-center bg-emerald-50/60 text-emerald-950">سعر البيع (المقترح)</th>
                    <th className="p-2 w-24 text-center">ربح القطعة</th>
                    <th className="p-2 w-10 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => {
                    const unitProfit = Math.max(0, (item.sellingPrice || 0) - (item.unitCost || 0));
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2 text-center text-slate-400 font-mono font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            placeholder="مثلاً: شاشة A10، بطارية نوت 9، شلك..."
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-teal-500"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.destination}
                            onChange={(e) => handleUpdateItem(item.id, 'destination', e.target.value as DestinationCategory)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                          >
                            <option value="maintenance_parts">🔧 قطع صيانة</option>
                            <option value="maintenance_expense">🧪 خرج صيانة (شلك)</option>
                            <option value="shop_stock">📱 بضاعة للمحل</option>
                            <option value="balance_topup">💳 رصيد وشحن</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(normalizeArabicNumerals(e.target.value)) || 1)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-800"
                          />
                        </td>
                        <td className="p-2 bg-amber-50/30">
                          <input
                            type="number"
                            min="0"
                            value={item.unitCost || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'unitCost', parseFloat(normalizeArabicNumerals(e.target.value)) || 0)}
                            placeholder="0"
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-black text-center text-amber-950 focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-2 text-center font-mono font-black text-slate-900 bg-slate-50/80">
                          {(item.totalCost || 0).toLocaleString()}
                        </td>
                        <td className="p-2 bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            value={item.sellingPrice || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'sellingPrice', parseFloat(normalizeArabicNumerals(e.target.value)) || 0)}
                            placeholder="0"
                            className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-black text-center text-emerald-950 focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2 text-center font-mono text-[11px] font-bold text-emerald-700">
                          {unitProfit > 0 ? `+${unitProfit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Courier Section: "بيانات من وصل البضاعة ومن هو وكم رقمه وأجرة التوصيل" */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-xs transition-all">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">بيانات من وصل البضاعة (السائق / الموصل):</span>
                    {courierName && (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[11px] font-bold">
                        {courierName} {courierPhone ? `(${courierPhone})` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    توثيق هوية موصل البضاعة ورقم هاتفه للرجوع إليه والاتصال به عند الحاجة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCourierSection(!showCourierSection)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showCourierSection || courierName
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{showCourierSection ? 'إخفاء بيانات الموصل ▲' : '🚚 إضافة بيانات من وصل البضاعة ورقم هاتفه ▼'}</span>
              </button>
            </div>

            {/* Expandable Courier Fields */}
            {showCourierSection && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Courier Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      اسم من وصل البضاعة (السائق / الموصل):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="مثال: صاحب المتر، سائق البيجوت..."
                        className="w-full p-2 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                    {/* Quick suggestion chips */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {['صاحب المتر', 'سائق البيجوت', 'سائق باص', 'مندوب التاجر'].map((quickLabel) => (
                        <button
                          key={quickLabel}
                          type="button"
                          onClick={() => setCourierName(quickLabel)}
                          className="text-[10px] bg-slate-200/80 hover:bg-teal-100 hover:text-teal-900 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          + {quickLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Courier Phone */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      رقم هاتف الموصل (للاتصال أو الواتساب):
                    </label>
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          value={courierPhone}
                          onChange={(e) => setCourierPhone(normalizeArabicNumerals(e.target.value))}
                          placeholder="77XXXXXXX"
                          className="w-full p-2 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 text-left"
                          dir="ltr"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                      </div>
                      {courierPhone && (
                        <>
                          <a
                            href={`tel:${courierPhone}`}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                            title="اتصال مباشر"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${courierPhone.startsWith('967') ? courierPhone : `967${courierPhone.replace(/^0+/, '')}`}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer shrink-0 text-[11px] font-bold"
                            title="محادثة واتساب"
                          >
                            واتس
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delivery Fee */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      أجرة التوصيل المسلمة (إن وجدت):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(normalizeArabicNumerals(e.target.value))}
                        placeholder="0"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                      />
                      <select
                        value={deliveryPaidBy}
                        onChange={(e) => setDeliveryPaidBy(e.target.value as any)}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 shrink-0"
                      >
                        <option value="shop">على المحل</option>
                        <option value="supplier">مخصوم من التاجر</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment & Accounting Section: "كم رسلت له" */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-teal-700" />
                <span>حساب التاجر والخرج (كم رسلت له / كم باقي له):</span>
              </h3>
              {totalExpectedProfit > 0 && (
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>إجمالي الربح المتوقع عند بيع الأصناف: {totalExpectedProfit.toLocaleString()} ر.ي</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Invoice */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-center">
                <span className="text-[11px] font-bold text-slate-500 block">إجمالي الفاتورة المطلوب</span>
                <span className="text-lg font-black font-mono text-slate-900 mt-1 block">
                  {totalInvoiceAmount.toLocaleString()} <span className="text-xs font-normal">ر.ي</span>
                </span>
              </div>

              {/* Paid / Transferred: كم رسلت له */}
              <div className="bg-white p-3 rounded-xl border-2 border-emerald-400 shadow-xs">
                <label className="text-[11px] font-black text-emerald-800 block mb-1">
                  كم رسلت له الآن (المبلغ المحول)؟
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(normalizeArabicNumerals(e.target.value))}
                    placeholder="0"
                    className="w-full p-1.5 bg-emerald-50/60 border border-emerald-300 rounded-lg text-base font-mono font-black text-emerald-900 text-center focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-700">ر.ي</span>
                </div>
              </div>

              {/* Remaining: كم باقي له */}
              <div className={`p-3 rounded-xl border shadow-xs text-center ${remainingAmount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className="text-[11px] font-bold text-slate-600 block">كم باقي للتاجر (آجل)؟</span>
                <span className={`text-lg font-black font-mono mt-1 block ${remainingAmount > 0 ? 'text-amber-900' : 'text-emerald-700'}`}>
                  {remainingAmount.toLocaleString()} <span className="text-xs font-normal">ر.ي</span>
                </span>
              </div>
            </div>

            {/* Payment Method & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">طريقة دفع المبلغ المسلّم:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="cash">نقداً من درج الصندوق (كاش)</option>
                  <option value="transfer">تحويل بنكي / صرافة (كريمي، ون كاش، جيب)</option>
                  <option value="delayed">آجل بالكامل (لم يسلم شيء الآن)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات حول الفاتورة أو رقم التحويل..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Crucial Automation Checkbox */}
            <div className="bg-white/95 p-3 rounded-lg border-2 border-teal-400 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="auto-transfer-check"
                checked={autoCreateExpenseTransfer}
                onChange={(e) => setAutoCreateExpenseTransfer(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="auto-transfer-check" className="text-xs text-slate-800 cursor-pointer leading-relaxed">
                <strong className="text-teal-900 block font-black">
                  ✅ ترحيل المبلغ المحول ("كم رسلت له: {numPaid.toLocaleString()} ر.ي") فوراً إلى جدول الخرج اليومي
                </strong>
                <span className="text-[11px] text-slate-600">
                  يسجل حركة خروج نقدية للمورد {actualSupplierName} في خانة الخرج لليوم ({invoiceDate})، ويوثق المتبقي له ({remainingAmount.toLocaleString()} ر.ي) بدون أي إعادة إدخال!
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-bold">
            <span>التاريخ: </span>
            <span className="text-slate-900 font-mono">{invoiceDate}</span>
            <span className="mx-2">•</span>
            <span>التاجر: </span>
            <span className="text-teal-800">{actualSupplierName}</span>
            <span className="mx-2">•</span>
            <span>الأصناف: </span>
            <span className="text-slate-900 font-mono">{items.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveInvoice}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ الفاتورة وترحيل الخرج والأسعار ⚡</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
