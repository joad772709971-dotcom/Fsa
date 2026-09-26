import React, { useState } from 'react';
import { DayRecord } from '../types';
import { calculateDay, calculatePeriodSummary, formatNumber } from '../utils/accounting';
import { exportToExcel } from '../utils/excelExport';
import { 
  Layers, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  ArrowUpDown, 
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Download
} from 'lucide-react';

interface MasterTableViewProps {
  days: DayRecord[];
  onSelectDay: (id: string) => void;
}

export const MasterTableView: React.FC<MasterTableViewProps> = ({
  days,
  onSelectDay,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'closed'>('all');

  const filteredDays = days.filter(day => {
    const matchesSearch = 
      day.dayTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      day.date.includes(searchTerm) ||
      (day.notes && day.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === 'active') return matchesSearch && !day.isClosed;
    if (filterType === 'closed') return matchesSearch && day.isClosed;
    return matchesSearch;
  });

  const periodSummary = calculatePeriodSummary(filteredDays);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">جدول حركة الأيام المجمع (كشف الحساب العام)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            جدول شامل ومفصل لحسابات جميع الأيام مع الإجماليات التفصيلية وتصدير الإكسل
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 no-print">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في الأيام أو الملاحظات..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-52"
            />
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">جميع الأيام ({days.length})</option>
            <option value="active">الأيام النشطة فقط</option>
            <option value="closed">الأيام المغلقة</option>
          </select>

          {/* Export Button */}
          <button
            onClick={() => exportToExcel(days)}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسل</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#1E293B] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700 font-bold">
                <th className="py-3 px-3.5 whitespace-nowrap">اليوم / التاريخ</th>
                <th className="py-3 px-3 whitespace-nowrap">الحالة</th>
                <th className="py-3 px-3 whitespace-nowrap text-amber-400">إكسسوارات</th>
                <th className="py-3 px-3 whitespace-nowrap text-cyan-400">جوالات واصل</th>
                <th className="py-3 px-3 whitespace-nowrap text-indigo-400">صيانة وبرمجة</th>
                <th className="py-3 px-3 whitespace-nowrap text-emerald-400">رصيد (مع الفائدة)</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-emerald-300 bg-emerald-950/20 font-black">إجمالي الدخل</th>
                <th className="py-3 px-3 whitespace-nowrap text-rose-400">مرتجعات</th>
                <th className="py-3 px-3 whitespace-nowrap text-rose-300">مصروفات</th>
                <th className="py-3 px-3 whitespace-nowrap text-emerald-400 font-black">بيت مصعب</th>
                <th className="py-3 px-3 whitespace-nowrap text-amber-400">مصعب شخصياً</th>
                <th className="py-3 px-3 whitespace-nowrap text-blue-400">عمال (حمدان/مهندس)</th>
                <th className="py-3 px-3 whitespace-nowrap text-amber-300">حوالات تجار</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-rose-300 bg-rose-950/20 font-black">إجمالي المخروجات</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-amber-400 bg-amber-950/20 font-black">صافي الصندوق</th>
                <th className="py-3 px-3 whitespace-nowrap no-print text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredDays.map(day => {
                const calc = calculateDay(day);
                return (
                  <tr 
                    key={day.id} 
                    className={`hover:bg-slate-700/40 transition group ${day.isClosed ? 'bg-slate-900/40 text-slate-500' : ''}`}
                  >
                    <td className="py-3 px-3.5 whitespace-nowrap font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span>{day.dayTitle}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({day.date})</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {day.isClosed ? (
                        <span className="bg-rose-950 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          مغلق
                        </span>
                      ) : (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          نشط
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-amber-400 font-semibold">
                      {formatNumber(calc.accessoriesTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-cyan-400 font-semibold">
                      {formatNumber(calc.phonesPaidTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-indigo-400 font-semibold">
                      {formatNumber(calc.maintenanceTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-emerald-400 font-semibold">
                      {formatNumber(calc.rechargeSalesWithProfit)}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap font-mono-num text-emerald-300 font-black bg-emerald-950/15">
                      {formatNumber(calc.grossDailyRevenue)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-rose-400">
                      {formatNumber(calc.returnsTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-rose-300">
                      {formatNumber(calc.expensesTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-emerald-400 font-bold bg-emerald-950/10">
                      {formatNumber(calc.musabHouseTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-amber-400 font-semibold">
                      {formatNumber(calc.musabPersonalTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-blue-400 font-semibold">
                      {formatNumber(calc.workersTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono-num text-amber-300 font-semibold">
                      {formatNumber(calc.supplierTransfersTotal)}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap font-mono-num text-rose-400 font-black bg-rose-950/15">
                      {formatNumber(calc.totalOutflows)}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap font-mono-num text-amber-400 font-black bg-amber-950/15">
                      {formatNumber(calc.netDayCashChange)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-center no-print">
                      <button
                        onClick={() => onSelectDay(day.id)}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                        title="فتح تفاصيل اليوم"
                      >
                        <Eye className="w-3 h-3" />
                        <span>عرض</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Grand Totals Footer */}
            <tfoot>
              <tr className="bg-[#0F172A] text-white font-black border-t-2 border-slate-700 text-xs">
                <td className="py-4 px-3.5 whitespace-nowrap text-indigo-400 text-sm">
                  الإجمالي المجمع ({filteredDays.length} يوم)
                </td>
                <td className="py-4 px-3 whitespace-nowrap text-slate-400 font-normal">
                  {periodSummary.activeDaysCount} نشط
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-amber-400 text-sm">
                  {formatNumber(periodSummary.totalAccessories)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-cyan-400 text-sm">
                  {formatNumber(periodSummary.totalPhonesPaid)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-indigo-400 text-sm">
                  {formatNumber(periodSummary.totalMaintenance)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-emerald-400 text-sm">
                  {formatNumber(periodSummary.totalRechargeWithProfit)}
                </td>
                <td className="py-4 px-3.5 whitespace-nowrap font-mono-num text-emerald-300 text-base bg-emerald-950/40">
                  {formatNumber(periodSummary.totalGrossRevenue)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-rose-400 text-sm">
                  {formatNumber(periodSummary.totalReturns)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-rose-300 text-sm">
                  {formatNumber(periodSummary.totalExpenses)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-emerald-400 text-sm bg-emerald-950/20">
                  {formatNumber(periodSummary.totalMusabHouse)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-amber-400 text-sm">
                  {formatNumber(periodSummary.totalMusabPersonal)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-blue-400 text-sm">
                  {formatNumber(periodSummary.totalHamdan + periodSummary.totalEngineer)}
                </td>
                <td className="py-4 px-3 whitespace-nowrap font-mono-num text-amber-300 text-sm">
                  {formatNumber(periodSummary.totalSupplierTransfers)}
                </td>
                <td className="py-4 px-3.5 whitespace-nowrap font-mono-num text-rose-400 text-base bg-rose-950/40">
                  {formatNumber(periodSummary.totalOutflows)}
                </td>
                <td className="py-4 px-3.5 whitespace-nowrap font-mono-num text-amber-300 text-base bg-amber-950/40">
                  {formatNumber(periodSummary.netCashFlow)}
                </td>
                <td className="py-4 px-3 no-print"></td>
              </tr>

              {/* Deduction of Musab Purchasing Cash Advance Row */}
              <tr className="bg-amber-950/30 text-amber-300 font-bold border-t border-amber-500/30 text-xs">
                <td colSpan={13} className="py-3 px-3.5 text-right">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-500/30">
                      بند خصم معتمد
                    </span>
                    <span>خصم عهدة مشتريات مصعب النقدية المسلمة له (150,000 كاش عبر باسم + 67,000 جوالي):</span>
                  </div>
                </td>
                <td className="py-3 px-3.5 font-mono-num text-amber-400 text-sm bg-amber-950/50" colSpan={2}>
                  - {formatNumber(periodSummary.musabPurchasingCashFromBox)} ر.ي
                </td>
                <td className="py-3 px-3 no-print"></td>
              </tr>

              {/* Deduction of Counterfeit/Damaged Cash */}
              <tr className="bg-rose-950/30 text-rose-300 font-bold border-t border-rose-500/30 text-xs">
                <td colSpan={13} className="py-3 px-3.5 text-right">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[11px] font-bold border border-rose-500/30">
                      استبعاد وتلف نقدي
                    </span>
                    <span>خصم واستبعاد عملة ورقية تالفة ومزورة من رصيد الصندوق:</span>
                  </div>
                </td>
                <td className="py-3 px-3.5 font-mono-num text-rose-400 text-sm bg-rose-950/50" colSpan={2}>
                  - {formatNumber(periodSummary.counterfeitCashLoss || 4000)} ر.ي
                </td>
                <td className="py-3 px-3 no-print"></td>
              </tr>

              {/* Final Net Cash Balance in Cash Box */}
              <tr className="bg-gradient-to-r from-emerald-950/80 via-[#0F172A] to-indigo-950/80 text-white font-black border-t-2 border-emerald-500 text-xs">
                <td colSpan={13} className="py-4 px-3.5 text-right text-emerald-300 text-sm">
                  صافي رصيد الصندوق الفعلي المحاسبي (المتبقي في الخزينة بعد خصم عهدة المشتريات والزلط التالفة):
                </td>
                <td className="py-4 px-3.5 font-mono-num text-emerald-400 text-lg bg-emerald-950/60" colSpan={2}>
                  {formatNumber(periodSummary.netCashFinalInBox)} ر.ي
                </td>
                <td className="py-4 px-3 no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Cash Box Reconciliation Notice Box */}
      <div className="bg-[#1E293B] border border-amber-500/40 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              توضيح محاسبي لسيولة الصندوق والخزينة
            </span>
            <span className="text-xs font-bold text-white">معادلة رصيد النقدية والخزينة الفعلي بالمحل:</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            المبلغ المسلم لمصعب لشراء التلفونات والبضاعة (<strong className="text-amber-400 font-mono-num">217,000 ر.ي</strong>) + العملة التالفة والمزورة المستبعدة (<strong className="text-rose-400 font-mono-num">4,000 ر.ي</strong>) تم خصمها مباشرة من رصيد الصندوق ليبقى النقد الفعلي المطابق بالخزينة.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-[#0F172A] px-5 py-3 rounded-xl border border-slate-700/80 shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block">صافي النقد الفعلي المتبقي بالخزينة:</span>
            <span className="text-xl font-black text-emerald-400 font-mono-num">
              {formatNumber(periodSummary.netCashFinalInBox)}
            </span>
            <span className="text-xs text-slate-400 mr-1">ر.ي</span>
          </div>
        </div>
      </div>

    </div>
  );
};
