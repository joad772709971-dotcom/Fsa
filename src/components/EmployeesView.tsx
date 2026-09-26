import React from 'react';
import { Users, Wrench, UserCheck, PlusCircle, CheckCircle, TrendingDown, DollarSign } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, calculateMonthlySettlement } from '../utils/calculations';

interface EmployeesViewProps {
  transactions: Transaction[];
  currentMonth: string;
  onAddNewVoucher: (defaultType: TransactionType) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  transactions,
  currentMonth,
  onAddNewVoucher,
}) => {
  const settlement = calculateMonthlySettlement(currentMonth, transactions);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-950/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              الموظفين والعمال وحسابات الصيانة
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              مستحقات مهندس الصيانة (50%)، تصفية العامل يوم 5، ومستحقات المدير (ثلث 1/3)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddNewVoucher('withdrawal_engineer')}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>سحب لمهندس الصيانة</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('expense_engineer')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>صرفة مهندس (على المحل)</span>
          </button>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Maintenance Engineer */}
        <div className="bg-white p-5 rounded-2xl border-2 border-purple-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">مهندس الصيانة</h3>
                <span className="text-[11px] text-purple-700 font-bold">شريك الصيانة (50%)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>إجمالي مستحقات الصيانة (50%):</span>
              <strong className="font-mono text-purple-800 font-bold text-sm">
                {formatCurrency(settlement.engineerTotalShare)}
              </strong>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>إجمالي السحوبات المخصومة:</span>
              <span className="font-mono font-bold">-{formatCurrency(settlement.engineerTotalWithdrawals)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
              <span>المتبقي الصافي للمهندس:</span>
              <span className="font-mono text-purple-700 text-base">
                {formatCurrency(settlement.engineerRemaining)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              * صرفة الغداء للمهندس على حساب المحل وتخصم من رأس أرباح المحل قبل التقسيم.
            </p>
          </div>
        </div>

        {/* 2. Worker (Up to Day 5, 7500 final settlement) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">عامل المحل</h3>
                <span className="text-[11px] text-rose-600 font-bold">انتهى عمله يوم 5</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>تاريخ انتهاء العمل:</span>
              <span className="font-bold text-slate-800">5 يونيو 2026</span>
            </div>
            <div className="flex justify-between text-amber-800 font-bold">
              <span>المبلغ المسلم تصفية نهائية:</span>
              <span className="font-mono text-sm">{formatCurrency(7500)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>حالة الحساب:</span>
              <span className="font-bold text-emerald-600">تمت التصفية النهائية ومشى</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              * تم تسليم 7,500 ر.ي يوم 5 تصفية نهائية لكامل مستحقاته وخصمت من رأس المحل.
            </p>
          </div>
        </div>

        {/* 3. Shop Manager (1/3 Partner) */}
        <div className="bg-white p-5 rounded-2xl border-2 border-sky-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">المدير المستلم</h3>
                <span className="text-[11px] text-sky-700 font-bold">شريك الإدارة (ثلث 1/3)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>نسبة الإدارة المستلمة:</span>
              <strong className="font-bold text-sky-800">ثلث صافي أرباح المحل (1/3)</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
              <span>إجمالي مستحقات المدير للشهر:</span>
              <span className="font-mono text-sky-700 text-base">
                {formatCurrency(settlement.managerTotalShare)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              * تحسب بعد خصم كافة مصاريف المحل والمهندس والعامل ومناصفة خرج المودم.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
