import React, { useState, useMemo } from 'react';
import {
  Coins,
  Vault,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { Transaction, CashDrawerShift } from '../types';
import { formatCurrency } from '../utils/calculations';

interface CashDrawerShiftViewProps {
  transactions: Transaction[];
  currentDate: string;
}

export const CashDrawerShiftView: React.FC<CashDrawerShiftViewProps> = ({
  transactions,
  currentDate,
}) => {
  // Stored shifts
  const [shifts, setShifts] = useState<CashDrawerShift[]>(() => {
    const saved = localStorage.getItem('mosaab_cash_shifts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'current_shift' | 'history'>('current_shift');
  const [openingCashInput, setOpeningCashInput] = useState<number>(0);
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  // Denominations counter for closing cash
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    1000: 0,
    500: 0,
    250: 0,
    200: 0,
    100: 0,
    50: 0,
  });

  const [closingNotes, setClosingNotes] = useState('');

  // Calculate current date transactions for cash drawer
  const todayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === currentDate);
  }, [transactions, currentDate]);

  // Current active shift
  const currentShift = useMemo(() => {
    return shifts.find((s) => s.date === currentDate && s.status === 'open') || null;
  }, [shifts, currentDate]);

  // Real-time cash calculations from today's ledger
  const currentCashStats = useMemo(() => {
    let salesCash = 0;
    let maintCash = 0;
    let networkCash = 0;
    let expenseCash = 0;
    let withdrawalCash = 0;
    let purchasesCash = 0;

    todayTransactions.forEach((t) => {
      // Inflow
      if (t.type === 'sale' || t.type === 'sim') {
        salesCash += t.price;
      } else if (t.type === 'maintenance') {
        salesCash += t.price; // repair sales
        maintCash += t.price;
      } else if (t.type === 'balance_hadi' || t.type === 'balance_qimma') {
        networkCash += t.price;
      }
      // Outflow
      else if (
        t.type === 'expense_shop' ||
        t.type === 'expense_home_mosaab' ||
        t.type === 'expense_engineer' ||
        t.type === 'expense_worker' ||
        t.type === 'expense_modem'
      ) {
        expenseCash += t.price;
      } else if (
        t.type === 'withdrawal_mosaab' ||
        t.type === 'withdrawal_engineer' ||
        t.type === 'withdrawal_worker' ||
        t.type === 'mosaab_purchases_fund'
      ) {
        withdrawalCash += t.price;
      } else if (t.type === 'purchase') {
        purchasesCash += t.price;
      }
    });

    const totalCashIn = salesCash + networkCash;
    const totalCashOut = expenseCash + withdrawalCash + purchasesCash;
    const opening = currentShift ? currentShift.openingCash : 0;
    const expectedDrawerCash = opening + totalCashIn - totalCashOut;

    return {
      opening,
      salesCash,
      maintCash,
      networkCash,
      totalCashIn,
      expenseCash,
      withdrawalCash,
      purchasesCash,
      totalCashOut,
      expectedDrawerCash,
    };
  }, [todayTransactions, currentShift]);

  // Actual cash from counting denominations
  const actualCountedCash = useMemo(() => {
    return Object.entries(denominations).reduce((sum, [denom, count]) => {
      return sum + Number(denom) * (Number(count) || 0);
    }, 0);
  }, [denominations]);

  const difference = useMemo(() => {
    return actualCountedCash - currentCashStats.expectedDrawerCash;
  }, [actualCountedCash, currentCashStats.expectedDrawerCash]);

  const saveShifts = (updated: CashDrawerShift[]) => {
    setShifts(updated);
    localStorage.setItem('mosaab_cash_shifts', JSON.stringify(updated));
  };

  const handleOpenShift = () => {
    const newShift: CashDrawerShift = {
      id: 'shift-' + Date.now(),
      date: currentDate,
      openedAt: new Date().toTimeString().slice(0, 5),
      cashierName: 'مصعب الصوفي / المدير المسؤول',
      openingCash: Number(openingCashInput) || 0,
      cashSales: 0,
      cashMaintenance: 0,
      cashExpenses: 0,
      cashWithdrawals: 0,
      expectedCash: Number(openingCashInput) || 0,
      status: 'open',
      notes: 'بدء وردية وفتح الصندوق',
    };

    const updated = [newShift, ...shifts.filter((s) => s.date !== currentDate)];
    saveShifts(updated);
    setIsOpeningModalOpen(false);
  };

  const handleCloseShift = () => {
    if (!currentShift) return;

    const closed: CashDrawerShift = {
      ...currentShift,
      closedAt: new Date().toTimeString().slice(0, 5),
      cashSales: currentCashStats.salesCash,
      cashMaintenance: currentCashStats.maintCash,
      cashExpenses: currentCashStats.expenseCash,
      cashWithdrawals: currentCashStats.withdrawalCash + currentCashStats.purchasesCash,
      expectedCash: currentCashStats.expectedDrawerCash,
      actualCash: actualCountedCash,
      difference: difference,
      status: 'closed',
      notes: closingNotes || (difference === 0 ? 'مطابقة تامة' : `فارق: ${difference}`),
    };

    const updated = shifts.map((s) => (s.id === currentShift.id ? closed : s));
    saveShifts(updated);
    setIsClosingModalOpen(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Vault className="w-6 h-6" />
            </span>
            <h1 className="text-xl font-black tracking-tight">
              إدارة الخزينة ومطابقة كاش الدرج اليومي
            </h1>
          </div>
          <p className="text-xs text-emerald-200/80">
            تتبع حركة النقدية اللحظية، فتح وإغلاق الصندوق، عد الفئات النقدية، واكتشاف العجز أو الزيادة بدقة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!currentShift ? (
            <button
              onClick={() => setIsOpeningModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs"
            >
              <Unlock className="w-4 h-4" />
              فتح درج الصندوق لليوم
            </button>
          ) : (
            <button
              onClick={() => setIsClosingModalOpen(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs"
            >
              <Lock className="w-4 h-4" />
              إغلاق وتصفية الدرج (Z-Report)
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('current_shift')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'current_shift'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          حركة الصندوق المباشرة (اليوم {currentDate})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سجل إغلاقات الصندوق السابقة ({shifts.length})
        </button>
      </div>

      {activeTab === 'current_shift' && (
        <div className="space-y-6">
          {/* Main Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Opening Cash */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>العهدة الافتتاحية</span>
                <Vault className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(currentCashStats.opening)}
              </div>
              <div className="text-[11px] text-slate-400">
                {currentShift ? `افتتاح الساعة ${currentShift.openedAt}` : 'لم يتم تسجيل عهدة بعد'}
              </div>
            </div>

            {/* Total Inflow */}
            <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                <span>إجمالي المقبوضات (داخل)</span>
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900">
                +{formatCurrency(currentCashStats.totalCashIn)}
              </div>
              <div className="text-[11px] text-emerald-700">
                مبيعات: {formatCurrency(currentCashStats.salesCash)} | رصيد:{' '}
                {formatCurrency(currentCashStats.networkCash)}
              </div>
            </div>

            {/* Total Outflow */}
            <div className="bg-rose-50/80 p-5 rounded-2xl border border-rose-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
                <span>إجمالي المدفوعات (خارج)</span>
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-900">
                -{formatCurrency(currentCashStats.totalCashOut)}
              </div>
              <div className="text-[11px] text-rose-700">
                مصاريف: {formatCurrency(currentCashStats.expenseCash)} | سحوبات ومشتريات:{' '}
                {formatCurrency(currentCashStats.withdrawalCash + currentCashStats.purchasesCash)}
              </div>
            </div>

            {/* Expected Cash in Drawer */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl border border-indigo-800 text-white shadow-md space-y-2">
              <div className="flex items-center justify-between text-indigo-300 text-xs font-bold">
                <span>الكاش النظري المفترض في الدرج</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {formatCurrency(currentCashStats.expectedDrawerCash)}
              </div>
              <div className="text-[11px] text-indigo-200">
                = العهدة + المقبوضات - المدفوعات
              </div>
            </div>
          </div>

          {/* Detailed Drawer Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              تفاصيل حركة السيولة النقدية اليومية ({todayTransactions.length} حركة مسجلة)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inflow Items */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl flex items-center justify-between">
                  <span>المقبوضات النقدية الواردة للدرج</span>
                  <span>+{formatCurrency(currentCashStats.totalCashIn)}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between text-slate-700">
                    <span>مبيعات الجوالات والإكسسوارات</span>
                    <span className="font-bold font-mono">
                      {formatCurrency(currentCashStats.salesCash - currentCashStats.maintCash)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between text-slate-700">
                    <span>مقبوضات وعربون صيانة الجوالات</span>
                    <span className="font-bold font-mono">
                      {formatCurrency(currentCashStats.maintCash)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between text-slate-700">
                    <span>تحصيلات شبكات الرصيد (الهادي والرقم)</span>
                    <span className="font-bold font-mono">
                      {formatCurrency(currentCashStats.networkCash)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Outflow Items */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-2 rounded-xl flex items-center justify-between">
                  <span>المدفوعات والمخروجات النقدية من الدرج</span>
                  <span>-{formatCurrency(currentCashStats.totalCashOut)}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between text-slate-700">
                    <span>مصاريف تشغيل المحل والضيافة والنظافة</span>
                    <span className="font-bold font-mono text-rose-700">
                      {formatCurrency(currentCashStats.expenseCash)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between text-slate-700">
                    <span>سحوبات ومسلمات مصعب (شخصي / بيت / شراء بضاعة)</span>
                    <span className="font-bold font-mono text-rose-700">
                      {formatCurrency(
                        todayTransactions
                          .filter(
                            (t) =>
                              t.type === 'expense_home_mosaab' ||
                              t.type === 'withdrawal_mosaab' ||
                              t.type === 'mosaab_purchases_fund'
                          )
                          .reduce((sum, t) => sum + t.price, 0)
                      )}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between text-slate-700">
                    <span>سحوبات ومستحقات المهندس والعامل</span>
                    <span className="font-bold font-mono text-rose-700">
                      {formatCurrency(
                        todayTransactions
                          .filter(
                            (t) =>
                              t.type === 'withdrawal_engineer' ||
                              t.type === 'withdrawal_worker' ||
                              t.type === 'expense_engineer' ||
                              t.type === 'expense_worker'
                          )
                          .reduce((sum, t) => sum + t.price, 0)
                      )}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between text-slate-700">
                    <span>مشتريات قطع غيار وبضاعة كاش</span>
                    <span className="font-bold font-mono text-rose-700">
                      {formatCurrency(currentCashStats.purchasesCash)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900">سجل الإغلاقات والورديات اليومية</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">أمين الصندوق</th>
                  <th className="p-3">العهدة الافتتاحية</th>
                  <th className="p-3">المقبوضات (+)</th>
                  <th className="p-3">المدفوعات (-)</th>
                  <th className="p-3">الكاش المفترض</th>
                  <th className="p-3">الكاش الفعلي</th>
                  <th className="p-3">الفارق (عجز/زيادة)</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">{shift.date}</td>
                    <td className="p-3">{shift.cashierName}</td>
                    <td className="p-3 font-mono">{formatCurrency(shift.openingCash)}</td>
                    <td className="p-3 font-mono text-emerald-700">
                      +{formatCurrency(shift.cashSales + shift.cashMaintenance)}
                    </td>
                    <td className="p-3 font-mono text-rose-700">
                      -{formatCurrency(shift.cashExpenses + shift.cashWithdrawals)}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {formatCurrency(shift.expectedCash)}
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-700">
                      {shift.actualCash !== undefined ? formatCurrency(shift.actualCash) : '—'}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {shift.difference === 0 ? (
                        <span className="text-emerald-600">مطابق (0)</span>
                      ) : (shift.difference || 0) > 0 ? (
                        <span className="text-emerald-700">
                          زيادة +{formatCurrency(shift.difference || 0)}
                        </span>
                      ) : (
                        <span className="text-rose-700">
                          عجز {formatCurrency(shift.difference || 0)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {shift.status === 'open' ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                          مفتوح الآن
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                          مغلق ومطابق ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opening Shift Modal */}
      {isOpeningModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">فتح وردية درج الصندوق اليومي</h3>
              </div>
              <button
                onClick={() => setIsOpeningModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                أدخل مبلغ العهدة الافتتاحية (الفكة والنقدية الأولية) الموجودة في الصندوق لبدء العمل:
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  مبلغ العهدة الافتتاحية (ر.ي)
                </label>
                <input
                  type="number"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-indigo-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                سيتم تتبع جميع المبيعات والصيانة والمصروفات المسجلة في اليومية تلقائياً لإعطائك الكاش
                المتوقع بدقة.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsOpeningModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleOpenShift}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  تأكيد فتح الصندوق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closing Shift Modal (Denominations Counter) */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">إغلاق الصندوق وعد النقدية (Z-Report)</h3>
              </div>
              <button
                onClick={() => setIsClosingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-bold">الكاش النظري المفترض:</span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(currentCashStats.expectedDrawerCash)}
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-slate-500 font-bold">إجمالي العد الفعلي:</span>
                  <div className="text-xl font-black text-indigo-700 font-mono">
                    {formatCurrency(actualCountedCash)}
                  </div>
                </div>
              </div>

              {/* Denominations table */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  حاسبة عد فئات العملة الورقية في الدرج:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[1000, 500, 250, 200, 100, 50].map((denom) => (
                    <div
                      key={denom}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                    >
                      <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                        <span>فئة {denom} ر.ي</span>
                        <span className="text-indigo-700 font-mono">
                          {formatCurrency(denom * (denominations[denom] || 0))}
                        </span>
                      </div>
                      <input
                        type="number"
                        placeholder="عدد الأوراق"
                        value={denominations[denom] || ''}
                        onChange={(e) =>
                          setDenominations({
                            ...denominations,
                            [denom]: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Difference analysis */}
              <div
                className={`p-4 rounded-xl border ${
                  difference === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : difference > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>نتيجة المطابقة:</span>
                  <span className="font-mono">
                    {difference === 0
                      ? '✓ الصندوق مطابق تماماً'
                      : difference > 0
                      ? `زيادة نقدية بمبلغ +${formatCurrency(difference)}`
                      : `عجز في الصندوق بمبلغ ${formatCurrency(difference)}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات الإغلاق</label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="ملاحظات حول تسليم الوردية..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCloseShift}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-md flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  اعتماد الإغلاق وتصفية الدرج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
