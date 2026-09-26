import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Smartphone,
  User,
  Clock,
  Coins,
  ArrowDownRight,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Transaction } from '../types';

interface MaintenancePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  transactions: Transaction[];
  onDeliverDevice: (
    originalTx: Transaction,
    collectedToday: number,
    paymentMethod: string,
    pickupNotes?: string
  ) => void;
}

export const MaintenancePickupModal: React.FC<MaintenancePickupModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  transactions,
  onDeliverDevice,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('تم تسليم الجوال للزبون واستلام المتبقي وفحص الجهاز بنجاح');

  // Find all maintenance transactions across all dates that have a remaining balance or are not delivered
  const pendingMaintenanceList = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type !== 'maintenance') return false;

      // Has remaining amount explicitly
      if (tx.remainingAmount && tx.remainingAmount > 0) return true;

      // Or if agreedAmount is greater than price (advance paid)
      if (tx.agreedAmount && tx.agreedAmount > (tx.price || 0)) return true;

      // Or notes mention باقي or واصل with remaining
      const descAndNotes = `${tx.description} ${tx.notes || ''}`.toLowerCase();
      if (
        (descAndNotes.includes('باقي') || descAndNotes.includes('واصل') || descAndNotes.includes('عربة') || descAndNotes.includes('متبقي')) &&
        tx.maintenanceStatus !== 'delivered'
      ) {
        // If remaining is not numeric, we can still include it
        return true;
      }

      return false;
    });
  }, [transactions]);

  // Filtered by search query
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pendingMaintenanceList;
    return pendingMaintenanceList.filter((tx) => {
      const fullText = `${tx.description} ${tx.customerName || ''} ${tx.customerPhone || ''} ${tx.technicianName || ''} ${tx.notes || ''}`.toLowerCase();
      return fullText.includes(q);
    });
  }, [pendingMaintenanceList, searchQuery]);

  const selectedTx = useMemo(() => {
    return pendingMaintenanceList.find((t) => t.id === selectedTxId) || null;
  }, [pendingMaintenanceList, selectedTxId]);

  // Auto-calculate suggested remaining when selecting a transaction
  const calculatedRemaining = useMemo(() => {
    if (!selectedTx) return 0;
    if (selectedTx.remainingAmount !== undefined && selectedTx.remainingAmount > 0) {
      return selectedTx.remainingAmount;
    }
    if (selectedTx.agreedAmount && selectedTx.agreedAmount > (selectedTx.price || 0)) {
      return selectedTx.agreedAmount - (selectedTx.price || 0);
    }
    // Attempt parsing from description/notes e.g. "باقي 5000"
    const match = `${selectedTx.description} ${selectedTx.notes || ''}`.match(/باقي[:\s]*(\d+)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return 0;
  }, [selectedTx]);

  const handleSelectTx = (tx: Transaction) => {
    setSelectedTxId(tx.id);
    const rem =
      tx.remainingAmount !== undefined && tx.remainingAmount > 0
        ? tx.remainingAmount
        : tx.agreedAmount && tx.agreedAmount > (tx.price || 0)
        ? tx.agreedAmount - (tx.price || 0)
        : 0;
    setCollectedAmount(rem > 0 ? String(rem) : '');
  };

  const handleConfirmPickup = () => {
    if (!selectedTx) {
      alert('يرجى اختيار جهاز من القائمة لتسليمه');
      return;
    }

    const numCollected = Number(collectedAmount) || 0;
    if (numCollected <= 0) {
      if (!window.confirm('المبلغ المستلم اليوم 0 ريال. هل أنت متأكد من تسليم الجهاز بدون استلام أي مبلغ؟')) {
        return;
      }
    }

    onDeliverDevice(selectedTx, numCollected, paymentMethod, notes.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Smartphone className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                تسليم جهاز صيانة واستلام المبلغ المتبقي (بز الجوال)
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">
                ربط حسابات الواصل بالباقي: إدخال المقبوض اليوم في الصندوق دون تكرار تكلفة القطع السابقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الزبون، نوع الجوال، العطل، أو المهندس..."
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 shadow-xs"
            />
          </div>

          {/* Pending Devices List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>أجهزة الصيانة المعلقة وبانتظار التسليم / استلام الباقي ({filteredList.length}):</span>
              {pendingMaintenanceList.length === 0 && (
                <span className="text-slate-400">لا توجد أجهزة صيانة معلقة مسجلة بباقي</span>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {filteredList.map((tx) => {
                const isSelected = tx.id === selectedTxId;
                const advancePaid = tx.price || 0;
                const agreed = tx.agreedAmount || (advancePaid + (tx.remainingAmount || 0));
                const remaining =
                  tx.remainingAmount !== undefined && tx.remainingAmount > 0
                    ? tx.remainingAmount
                    : agreed > advancePaid
                    ? agreed - advancePaid
                    : 0;

                return (
                  <div
                    key={tx.id}
                    onClick={() => handleSelectTx(tx)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-50/90 border-purple-600 shadow-md'
                        : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                          {tx.description}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {tx.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {tx.customerName && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <User className="w-3 h-3 text-purple-600" />
                            <span>{tx.customerName}</span>
                          </span>
                        )}
                        <span>المهندس: {tx.technicianName || 'المهندس'}</span>
                        {tx.notes && <span className="text-slate-400">({tx.notes})</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-left font-mono">
                        <div className="text-[10px] text-slate-400">
                          الاتفاق: {agreed > 0 ? agreed.toLocaleString() : '-'} | واصل: {advancePaid.toLocaleString()}
                        </div>
                        <div className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mt-0.5">
                          المتبقي: {remaining.toLocaleString()} ر.ي
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredList.length === 0 && pendingMaintenanceList.length > 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  لا يوجد جهاز يطابق بحثك
                </div>
              )}
            </div>
          </div>

          {/* Details of selected item to deliver */}
          {selectedTx && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>بيانات تسليم الجهاز والمبلغ المقبوض اليوم:</span>
                </span>
                <span className="text-[11px] text-purple-800 font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                  الجهاز: {selectedTx.description}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <label className="text-xs font-bold text-purple-900 block mb-1">
                    المبلغ المستلم الآن عند التسليم (يدخل الصندوق اليوم):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={collectedAmount}
                      onChange={(e) => setCollectedAmount(e.target.value)}
                      placeholder="0"
                      className="w-full p-2 bg-purple-50/50 border border-purple-300 rounded-lg text-sm font-mono font-black text-purple-900 text-center focus:bg-white"
                    />
                    <span className="text-xs font-bold text-purple-800">ر.ي</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    المتبقي المطلوب حسب الدفتر: {calculatedRemaining.toLocaleString()} ر.ي
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    طريقة قبض المبلغ:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="cash">نقداً في صندوق المحل</option>
                    <option value="transfer">تحويل صرافة / كريمي</option>
                  </select>
                  <span className="text-[10px] text-emerald-700 mt-1 block font-semibold">
                    ✓ التكلفة صفر لأنها سُجلت وخُصمت مسبقاً عند شراء القطعة
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ملاحظات التسليم والتجربة:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات التسليم..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Accounting Rule Clarification */}
              <div className="p-2.5 bg-white/80 rounded-lg border border-purple-200 text-[11px] text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-purple-700" />
                  <span>الأثر المحاسبي التلقائي لهذا الإجراء:</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  1. يدخل المبلغ المقبوض ({Number(collectedAmount || 0).toLocaleString()} ر.ي) في صندوق اليوم الحالي كإيراد صيانة.
                  <br />
                  2. تكلفة القطع = 0 ر.ي حتى لا تتكرر التكلفة التي خُصمت سابقاً عند استلام الجهاز.
                  <br />
                  3. يتم تقسيم فائدة هذا المبلغ مناصفة 50% للمحل و50% للمهندس، وتصفير المتبقي على الزبون.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={!selectedTx}
            onClick={handleConfirmPickup}
            className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all ${
              selectedTx
                ? 'bg-purple-700 hover:bg-purple-600 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد التسليم واستلام الباقي (بز الجوال) ⚡</span>
          </button>
        </div>
      </div>
    </div>
  );
};
