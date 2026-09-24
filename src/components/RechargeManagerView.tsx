import React from 'react';
import { DayRecord } from '../types';
import { calculatePeriodSummary, formatNumber } from '../utils/accounting';
import { Smartphone, Zap, ArrowUpRight, CheckCircle2, TrendingUp, AlertCircle, ShoppingCart, FileSpreadsheet, Printer } from 'lucide-react';
import { exportRechargeManagerToExcel } from '../utils/excelExport';

interface RechargeManagerViewProps {
  days: DayRecord[];
}

export const RechargeManagerView: React.FC<RechargeManagerViewProps> = ({ days }) => {
  const periodSummary = calculatePeriodSummary(days);

  // Latest app balances from recorded days
  const latestHadiDay = [...days].reverse().find(d => d.recharge?.hadi?.remainingInApp && d.recharge.hadi.remainingInApp > 0);
  const latestHadiBalance = latestHadiDay?.recharge?.hadi?.remainingInApp ?? 24640.20;
  const latestQimmahBalance = 2500;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">إدارة وحركة تطبيقات الرصيد والشرايح</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة دقيقة لمبيعات الرصيد (مع وبدون الفائدة)، الحوالات وشراء الرصيد، والأرصدة المتبقية في تطبيقي (الهادي والرقم)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportRechargeManagerToExcel(days)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
            title="تصدير كشف حركة الرصيد والتطبيقات إلى إكسيل"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير كشف الرصيد (Excel)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>

          <div className="bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-xl text-right">
            <span className="text-[11px] text-emerald-300 block">إجمالي مبيعات الرصيد لشهر 8</span>
            <span className="text-xl font-black text-emerald-400 font-mono-num">
              {formatNumber(periodSummary.totalRechargeWithProfit)} <span className="text-xs font-normal">ر.ي</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2 App KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hadi App Card */}
        <div className="bg-[#1E293B] rounded-2xl border border-sky-500/30 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">تطبيق الهادي</h3>
                <span className="text-xs text-sky-300 font-semibold">المورد: محمد مياس</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">الرصيد الحالي في التطبيق</span>
              <span className="text-xl font-black text-sky-300 font-mono-num">
                {formatNumber(latestHadiBalance)} <span className="text-xs font-normal">ر.ي</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] border border-slate-700/60 rounded-xl">
              <span className="text-slate-400">إجمالي الحوالات الموجهة لمياس:</span>
              <strong className="text-white font-mono-num text-sm">
                {formatNumber(periodSummary.supplierSummaries['محمد مياس']?.totalTransferred || 0)} ر.ي
              </strong>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] border border-slate-700/60 rounded-xl">
              <span className="text-slate-400">طبيعة الحساب:</span>
              <span className="text-sky-300 font-bold">رصيد مباشر + تحويلات دين وسداد</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 bg-[#0F172A]/50 p-3 rounded-xl border border-slate-700/60">
            يتم تسجيل مبيعات رصيد الهادي بدقة (مع الفائدة وبدون الفائدة) مع تدوين الرصيد المتبقي داخل التطبيق يومياً.
          </p>
        </div>

        {/* Raqam App Card (Faiez Abu Ali) */}
        <div className="bg-[#1E293B] rounded-2xl border border-violet-500/30 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 font-black">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">تطبيق الرقم</h3>
                <span className="text-xs text-violet-300 font-semibold">المورد: فايز أبو علي</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">الرصيد الحالي في التطبيق</span>
              <span className="text-xl font-black text-violet-300 font-mono-num">
                {formatNumber(latestQimmahBalance)} <span className="text-xs font-normal">ر.ي</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] border border-slate-700/60 rounded-xl">
              <span className="text-slate-400">إجمالي الحوالات الموجهة لفايز أبو علي:</span>
              <strong className="text-white font-mono-num text-sm">
                {formatNumber(periodSummary.supplierSummaries['فايز أبو علي']?.totalTransferred || 0)} ر.ي
              </strong>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] border border-slate-700/60 rounded-xl">
              <span className="text-slate-400">مشتريات الشرايح من التطبيق:</span>
              <span className="text-violet-300 font-bold font-mono-num">10 شرايح (7,500 ر.ي مخصومة)</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 bg-[#0F172A]/50 p-3 rounded-xl border border-slate-700/60">
            تطبيق الرقم (فايز أبو علي) يُستخدم لتعبئة رصيد الاتصال وشراء وتفعيل باقات الشرايح مع الخصم الآلي عند إضافة الشرايح.
          </p>
        </div>

      </div>

      {/* Daily Recharge Log Table */}
      <div className="bg-[#1E293B] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">سجل مبيعات وصرفات الرصيد اليومية المدمجة</h3>
          <span className="text-xs text-emerald-400 font-semibold">مبيعات الرصيد + صرفات وتغذية الحسابات</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700 font-bold">
                <th className="py-3 px-4">اليوم</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4 text-emerald-400">إجمالي المبيع (مع الفائدة)</th>
                <th className="py-3 px-4 text-slate-400">إجمالي المبيع (بدون فائدة)</th>
                <th className="py-3 px-4 text-amber-400">الربح الصافي</th>
                <th className="py-3 px-4 text-sky-400">تطبيق الهادي (محمد مياس)</th>
                <th className="py-3 px-4 text-violet-400">تطبيق الرقم (فايز أبو علي)</th>
                <th className="py-3 px-4">ملاحظات وصرفات الرصيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {days.map(day => {
                const r = day.recharge;
                const profit = (Number(r?.totalWithProfit) || 0) - (Number(r?.totalWithoutProfit) || 0);
                return (
                  <tr key={day.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-bold text-white">{day.dayTitle}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono-num">{day.date}</td>
                    <td className="py-3 px-4 font-mono-num text-sm font-bold text-emerald-400">
                      {formatNumber(r?.totalWithProfit || 0)} ر.ي
                    </td>
                    <td className="py-3 px-4 font-mono-num text-slate-300">
                      {formatNumber(r?.totalWithoutProfit || 0)} ر.ي
                    </td>
                    <td className="py-3 px-4 font-mono-num font-bold text-amber-400">
                      {formatNumber(profit)} ر.ي
                    </td>
                    <td className="py-3 px-4">
                      {r?.hadi ? (
                        <div className="font-mono-num">
                          <span className="text-sky-300 font-semibold">{formatNumber(r.hadi.salesWithProfit)} ر.ي</span>
                          {r.hadi.remainingInApp ? (
                            <span className="text-[10px] text-slate-400 block">باقي: {formatNumber(r.hadi.remainingInApp)}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r?.qimmah ? (
                        <div className="font-mono-num">
                          <span className="text-violet-300 font-semibold">{formatNumber(r.qimmah.salesWithProfit)} ر.ي</span>
                          {r.qimmah.remainingInApp ? (
                            <span className="text-[10px] text-slate-400 block">باقي: {formatNumber(r.qimmah.remainingInApp)}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={r?.generalNotes || ''}>
                      {r?.generalNotes || r?.hadi?.notes || r?.qimmah?.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
