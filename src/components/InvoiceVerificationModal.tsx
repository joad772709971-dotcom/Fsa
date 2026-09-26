import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Hash,
  DollarSign,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  UserCheck,
  ShieldCheck,
  FileText,
  Calculator,
} from 'lucide-react';
import { ScannedInvoiceResult, ScannedInvoiceItem, Supplier } from '../types';
import { loadSuppliers } from '../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: ScannedInvoiceResult;
  onApprove: (verifiedInvoice: ScannedInvoiceResult) => void;
}

export const InvoiceVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  invoice: initialInvoice,
  onApprove,
}) => {
  const [invoice, setInvoice] = useState<ScannedInvoiceResult>(initialInvoice);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setInvoice(initialInvoice);
    setSuppliers(loadSuppliers());
  }, [initialInvoice]);

  if (!isOpen) return null;

  // Recalculate subtotal and remaining balance dynamically
  const subtotal = invoice.items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const totalAmount = Math.max(0, subtotal - (Number(invoice.discount) || 0));
  const remainingBalance = Math.max(0, (Number(invoice.previousBalance) || 0) + totalAmount - (Number(invoice.paidAmount) || 0));

  const handleItemChange = (index: number, field: keyof ScannedInvoiceItem, value: any) => {
    const updatedItems = [...invoice.items];
    const targetItem = { ...updatedItems[index], [field]: value };

    // Auto calculate total cost if quantity or unit cost changes
    if (field === 'quantity' || field === 'unitCost') {
      const q = field === 'quantity' ? Number(value) : Number(targetItem.quantity);
      const c = field === 'unitCost' ? Number(value) : Number(targetItem.unitCost);
      targetItem.totalCost = q * c;

      // Auto update suggested sale price if not manually customized
      if (field === 'unitCost' && targetItem.suggestedSalePrice <= c) {
        targetItem.suggestedSalePrice = Math.round(c * 1.3);
      }
    }

    updatedItems[index] = targetItem;
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      totalAmount,
      remainingBalance,
    });
  };

  const handleAddItem = () => {
    const newItem: ScannedInvoiceItem = {
      id: `item_${Date.now()}`,
      name: '',
      category: 'spare_parts',
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      suggestedSalePrice: 0,
    };
    setInvoice({
      ...invoice,
      items: [...invoice.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({
      ...invoice,
      items: updatedItems,
    });
  };

  const handleSupplierSelect = (supplierName: string) => {
    const matched = suppliers.find((s) => s.name === supplierName);
    setInvoice({
      ...invoice,
      supplierName,
      supplierId: matched?.id,
      previousBalance: matched ? matched.remainingBalance : invoice.previousBalance,
    });
  };

  const handleFinalApprove = () => {
    setIsSubmitting(true);
    try {
      const verified: ScannedInvoiceResult = {
        ...invoice,
        subtotal,
        totalAmount,
        remainingBalance,
        paymentStatus: remainingBalance === 0 ? 'paid' : (invoice.paidAmount || 0) > 0 ? 'partial' : 'credit',
        verifiedAt: new Date().toISOString(),
      };
      onApprove(verified);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                نافذة فحص وتدقيق الفاتورة المستخرجة بالذكاء الاصطناعي (Gemini Vision)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                راجع الأصناف والأسعار والباقي السابق مع الصورة المرفقة قبل الاعتماد والترحيل للمخزون
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Split Screen (Image Preview vs Form/Table) */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left Column (5 cols): Scanned Invoice Image with Zoom Controls */}
          <div className="relative flex flex-col border-b border-slate-200 bg-slate-950/90 lg:col-span-5 lg:border-b-0 lg:border-l dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="h-4 w-4 text-emerald-400" />
                صورة الفاتورة المرفقة (أصل خط اليد)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  className="rounded p-1 hover:bg-slate-800"
                  title="تكبير"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  className="rounded p-1 hover:bg-slate-800"
                  title="تصغير"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="rounded p-1 hover:bg-slate-800"
                  title="إعادة ضبط"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              {invoice.imageBase64 ? (
                <div
                  className="transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                >
                  <img
                    src={invoice.imageBase64}
                    alt="Scanned Handwritten Invoice"
                    className="max-h-[70vh] rounded-lg shadow-lg ring-1 ring-white/10"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <FileText className="h-12 w-12 stroke-1" />
                  <p className="mt-2 text-sm">لا توجد صورة مرفقة</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (7 cols): Editable Verification Table & Financial Settlement */}
          <div className="flex flex-col overflow-y-auto p-5 lg:col-span-7">
            {/* Header Metadata Form: Supplier, Date, Invoice No */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Building2 className="inline h-3.5 w-3.5 text-slate-400" /> اسم المورد / المحل
                </label>
                <input
                  type="text"
                  list="suppliers-list"
                  value={invoice.supplierName}
                  onChange={(e) => handleSupplierSelect(e.target.value)}
                  placeholder="العبصري، القاسمي، خليل..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <datalist id="suppliers-list">
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Calendar className="inline h-3.5 w-3.5 text-slate-400" /> تاريخ الفاتورة
                </label>
                <input
                  type="date"
                  value={invoice.invoiceDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setInvoice({ ...invoice, invoiceDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Hash className="inline h-3.5 w-3.5 text-slate-400" /> رقم الفاتورة الورقية
                </label>
                <input
                  type="text"
                  value={invoice.invoiceNumber || ''}
                  onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                  placeholder="رقم الفاتورة إن وجد"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Editable Items Table */}
            <div className="mt-5 flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  الأصناف والقطع المستخرجة ({invoice.items.length} صنف)
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <Plus className="h-3.5 w-3.5" /> إضافة بند يدوي
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">اسم الصنف / القطعة</th>
                      <th className="p-2.5">التصنيف</th>
                      <th className="p-2.5">الكمية</th>
                      <th className="p-2.5">سعر التكلفة</th>
                      <th className="p-2.5">الإجمالي</th>
                      <th className="p-2.5">سعر البيع المقترح</th>
                      <th className="p-2.5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full min-w-[140px] rounded border border-slate-200 bg-transparent px-2 py-1 font-semibold text-slate-900 focus:bg-white focus:outline-none dark:border-slate-700 dark:text-white dark:focus:bg-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                            className="rounded border border-slate-200 bg-transparent px-1.5 py-1 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <option value="screens">شاشات</option>
                            <option value="spare_parts">قطع غيار</option>
                            <option value="batteries">بطاريات</option>
                            <option value="maintenance_tools">أدوات صيانة</option>
                            <option value="accessories">إكسسوارات</option>
                            <option value="other">أخرى</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-14 rounded border border-slate-200 bg-transparent px-2 py-1 text-center font-bold text-slate-900 focus:bg-white focus:outline-none dark:border-slate-700 dark:text-white dark:focus:bg-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => handleItemChange(idx, 'unitCost', Number(e.target.value))}
                            className="w-20 rounded border border-slate-200 bg-transparent px-2 py-1 text-center font-bold text-slate-900 focus:bg-white focus:outline-none dark:border-slate-700 dark:text-white dark:focus:bg-slate-800"
                          />
                        </td>
                        <td className="p-2 font-bold text-slate-900 dark:text-white">
                          {(item.totalCost || item.quantity * item.unitCost).toLocaleString()} ر.ي
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.suggestedSalePrice || Math.round(item.unitCost * 1.3)}
                            onChange={(e) => handleItemChange(idx, 'suggestedSalePrice', Number(e.target.value))}
                            className="w-20 rounded border border-emerald-300 bg-emerald-50/50 px-2 py-1 text-center font-bold text-emerald-700 focus:bg-white focus:outline-none dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Calculations & Balances */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    إجمالي البنود الحالية
                  </label>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    {subtotal.toLocaleString()} ر.ي
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    الخصم الممنوح
                  </label>
                  <input
                    type="number"
                    value={invoice.discount || 0}
                    onChange={(e) => setInvoice({ ...invoice, discount: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    الباقي السابق (من الفاتورة)
                  </label>
                  <input
                    type="number"
                    value={invoice.previousBalance || 0}
                    onChange={(e) => setInvoice({ ...invoice, previousBalance: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-amber-600 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    المدفوع نقداً (واصل)
                  </label>
                  <input
                    type="number"
                    value={invoice.paidAmount || 0}
                    onChange={(e) => setInvoice({ ...invoice, paidAmount: Number(e.target.value) })}
                    className="w-full rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-bold text-emerald-600 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  صافي الباقي المتبقي للمورد (الآجل):
                </span>
                <span
                  className={`text-lg font-black ${
                    remainingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {remainingBalance.toLocaleString()} ر.ي
                </span>
              </div>
            </div>

            {/* Linkage to Debts (Supplier & Customer) */}
            <div className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={invoice.linkToSupplierDebt ?? true}
                  onChange={(e) => setInvoice({ ...invoice, linkToSupplierDebt: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  ترحيل وتحديث رصيد المورد ({invoice.supplierName || 'المورد'}) تلقائياً وإضافة الباقي لدفتر ديونه
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={invoice.linkToCustomerDebt ?? false}
                  onChange={(e) => setInvoice({ ...invoice, linkToCustomerDebt: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  تسجيل هذه القطع أو جزء منها كدين على زبون صيانة معين
                </span>
              </label>

              {invoice.linkToCustomerDebt && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="اسم الزبون المستلم للقطع"
                    value={invoice.debtCustomerName || ''}
                    onChange={(e) => setInvoice({ ...invoice, debtCustomerName: e.target.value })}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="رقم هاتف الزبون"
                    value={invoice.debtCustomerPhone || ''}
                    onChange={(e) => setInvoice({ ...invoice, debtCustomerPhone: e.target.value })}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Notes input */}
            <div className="mt-3">
              <input
                type="text"
                value={invoice.notes || ''}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                placeholder="ملاحظات تدقيق إضافية..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Action Bar */}
            <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleFinalApprove}
                disabled={isSubmitting || invoice.items.length === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                اعتماد وترحيل للمخزون والحسابات
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
