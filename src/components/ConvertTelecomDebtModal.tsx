import React, { useState, useEffect } from 'react';
import { X, UserPlus, CreditCard, CheckCircle2, Phone, User, FileText, AlertCircle } from 'lucide-react';
import { TelecomStatementRow, CustomerDebt } from '../types';
import { loadCustomers } from '../utils/storage';
import { convertStatementRowToCustomerDebt } from '../utils/telecomStatementStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  row: TelecomStatementRow;
  onSuccess: (updatedCustomer: CustomerDebt) => void;
}

export const ConvertTelecomDebtModal: React.FC<Props> = ({
  isOpen,
  onClose,
  row,
  onSuccess,
}) => {
  const [customers, setCustomers] = useState<CustomerDebt[]>([]);
  const [customerName, setCustomerName] = useState<string>(row.customerName || '');
  const [customerPhone, setCustomerPhone] = useState<string>(row.customerPhone || '');
  const [notes, setNotes] = useState<string>(
    `سداد باقة/رصيد ${row.operatorNameAr} للرقم ${row.targetNumber} (مرجع: ${row.referenceId})`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCustomers(loadCustomers());
    setCustomerName(row.customerName || '');
    setCustomerPhone(row.customerPhone || '');
  }, [row]);

  if (!isOpen) return null;

  const handleSelectExistingCustomer = (name: string) => {
    setCustomerName(name);
    const found = customers.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (found && found.phone) {
      setCustomerPhone(found.phone);
    }
  };

  const handleConfirm = () => {
    if (!customerName.trim()) {
      setError('يرجى إدخال اسم العميل لتحويل الدين إليه');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = convertStatementRowToCustomerDebt(row.id, customerName.trim(), customerPhone.trim(), notes);
      onSuccess(res.customer);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل في ربط الدين بالعميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const debtAmount = row.sellingPrice || row.amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تحويل عملية السداد إلى دين على عميل (آجل)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل المبلغ مباشرة في كشف حساب العميل مع تحديث السجل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 p-6">
          {/* Operation Summary Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">المزود / الشبكة:</span>
                <p className="font-bold text-slate-900 dark:text-white">{row.operatorNameAr}</p>
              </div>
              <div>
                <span className="text-slate-500">الرقم المسدد له:</span>
                <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{row.targetNumber}</p>
              </div>
              <div>
                <span className="text-slate-500">التكلفة من التطبيق:</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{row.amount.toLocaleString()} ر.ي</p>
              </div>
              <div>
                <span className="text-slate-500">مبلغ الدين المحصل:</span>
                <p className="font-black text-base text-rose-600 dark:text-rose-400">
                  {debtAmount.toLocaleString()} ر.ي
                </p>
              </div>
            </div>
          </div>

          {/* Customer Selection / Entry */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
              <User className="inline h-3.5 w-3.5 text-slate-400" /> اسم العميل المدين
            </label>
            <input
              type="text"
              list="customer-debt-names"
              value={customerName}
              onChange={(e) => handleSelectExistingCustomer(e.target.value)}
              placeholder="اختر عميل حالي أو اكتب اسماً جديداً..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <datalist id="customer-debt-names">
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.phone ? `(${c.phone})` : ''} - المتبقي عليه: {c.remainingDebt.toLocaleString()} ر.ي
                </option>
              ))}
            </datalist>
          </div>

          {/* Customer Phone */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
              <Phone className="inline h-3.5 w-3.5 text-slate-400" /> رقم هاتف العميل (اختياري)
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="77XXXXXXX / 73XXXXXXX"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
              <FileText className="inline h-3.5 w-3.5 text-slate-400" /> بيان القيد والملاحظات
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            تأكيد وتحويل لدين العميل
          </button>
        </div>
      </div>
    </div>
  );
};
