import React, { useState } from 'react';
import { DayRecord } from '../types';
import { calculatePeriodSummary, formatNumber } from '../utils/accounting';
import { exportToExcel } from '../utils/excelExport';
import { DailyNotebookMatcher } from './DailyNotebookMatcher';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Smartphone, 
  Wrench, 
  Zap, 
  Receipt, 
  Home, 
  Users, 
  Truck,
  FileSpreadsheet,
  PieChart,
  BarChart3,
  Calendar,
  BookOpen
} from 'lucide-react';

interface ReportsViewProps {
  days: DayRecord[];
  onSelectDay?: (dayId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ days, onSelectDay }) => {
  const [reportSubTab, setReportSubTab] = useState<'matcher' | 'monthly'>('matcher');
  const summary = calculatePeriodSummary(days);

  // Revenue Stream percentages
  const revTotal = summary.totalGrossRevenue || 1;
  const accPct = Math.round((summary.totalAccessories / revTotal) * 100);
  const phonesPct = Math.round((summary.totalPhonesPaid / revTotal) * 100);
  const maintPct = Math.round((summary.totalMaintenance / revTotal) * 100);
  const rechargePct = Math.round((summary.totalRechargeWithProfit / revTotal) * 100);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">التقارير المحاسبية ومطابقة الدفتر اليومي</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            مطابقة فورية لكافة بنود الدفتر اليومي (1:1) مع ملخصات شاملة للإيرادات والمخروجات لشهر 8
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(days)}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer no-print"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير تقرير شامل إكسل</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation (Matcher vs Monthly Analysis) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#1E293B] rounded-2xl border border-slate-700 max-w-md no-print">
        <button
          onClick={() => setReportSubTab('matcher')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer min-h-[40px] ${
            reportSubTab === 'matcher'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>مطابقة الدفتر اليومي السريعة</span>
        </button>

        <button
          onClick={() => setReportSubTab('monthly')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer min-h-[40px] ${
            reportSubTab === 'monthly'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>الإحصائيات التراكمية الشهرية</span>
        </button>
      </div>

      {/* 1. Fast Daily Matcher View */}
      {reportSubTab === 'matcher' && (
        <DailyNotebookMatcher 
          days={days} 
          onSelectDay={onSelectDay} 
        />
      )}

      {/* 2. Monthly Summary & Deep Dive */}
      {reportSubTab === 'monthly' && (
        <div className="space-y-6">
          {/* Top Level Grand Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-gradient-to-br from-emerald-950/40 via-[#1E293B] to-[#1E293B] p-5 rounded-2xl border border-emerald-500/30 shadow-lg">
              <span className="text-xs font-bold text-emerald-300">إجمالي الدخل المحصل (الإيرادات)</span>
              <div className="mt-2">
                <span className="text-2xl font-black text-emerald-400 font-mono-num">
                  {formatNumber(summary.totalGrossRevenue)}
                </span>
                <span className="text-xs text-emerald-500 mr-1">ر.ي</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{summary.activeDaysCount} يوم عمل فعلي</p>
            </div>

            <div className="bg-gradient-to-br from-rose-950/40 via-[#1E293B] to-[#1E293B] p-5 rounded-2xl border border-rose-500/30 shadow-lg">
              <span className="text-xs font-bold text-rose-300">إجمالي المخروجات والمصروفات</span>
              <div className="mt-2">
                <span className="text-2xl font-black text-rose-400 font-mono-num">
                  {formatNumber(summary.totalOutflows)}
                </span>
                <span className="text-xs text-rose-500 mr-1">ر.ي</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">تشمل المصروفات، سحب مصعب، والتجار</p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/40 via-[#1E293B] to-[#1E293B] p-5 rounded-2xl border border-amber-500/30 shadow-lg">
              <span className="text-xs font-bold text-amber-300">صافي التدفق النقدي للصندوق</span>
              <div className="mt-2">
                <span className="text-2xl font-black text-amber-400 font-mono-num">
                  {formatNumber(summary.netCashFlow)}
                </span>
                <span className="text-xs text-amber-500 mr-1">ر.ي</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">الرصيد التراكمي المتبقي</p>
            </div>

            <div className="bg-[#1E293B] p-5 rounded-2xl border border-slate-700 shadow-lg">
              <span className="text-xs font-bold text-slate-300">إجمالي مسحوبات بيت مصعب</span>
              <div className="mt-2">
                <span className="text-2xl font-black text-white font-mono-num">
                  {formatNumber(summary.totalMusabHouse)}
                </span>
                <span className="text-xs text-slate-400 mr-1">ر.ي</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">+ {formatNumber(summary.totalMusabPersonal)} ر.ي شخصي وباقات</p>
            </div>

          </div>

          {/* Cash Box Reconciliation Notice Card */}
          <div className="bg-gradient-to-r from-amber-950/40 via-[#1E293B] to-indigo-950/40 border border-amber-500/40 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  مطابقة رصيد الصندوق المعتمدة
                </span>
                <span className="text-xs font-bold text-white">خصم عهدة مشتريات مصعب من صندوق المحل:</span>
              </div>
              <p className="text-xs text-slate-300">
                الزلط النقدية المسلمة لمصعب للمشتريات (<strong className="text-amber-400 font-mono-num">150,000 ر.ي</strong> كاش عبر باسم + <strong className="text-amber-400 font-mono-num">67,000 ر.ي</strong> جوالي = <strong className="text-amber-300 font-mono-num">217,000 ر.ي</strong>) مخصومة ومقيدة من صندوق وسيولة المحل لتمويل المشتريات.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-[#0F172A] px-4 py-2.5 rounded-xl border border-slate-700/80 shrink-0">
              <div>
                <span className="text-[10px] text-slate-400 block">صافي رصيد الصندوق المحاسبي:</span>
                <span className="text-lg font-black text-emerald-400 font-mono-num">
                  {formatNumber(summary.netCashAfterMusabPurchasing)}
                </span>
                <span className="text-xs text-slate-400 mr-1">ر.ي</span>
              </div>
            </div>
          </div>

          {/* Revenue Streams Distribution */}
          <div className="bg-[#1E293B] rounded-2xl border border-slate-700 p-6 shadow-xl space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>توزيع مصادر الدخل والإيرادات (شهر 8)</span>
            </h3>

            {/* Visual Progress Bars */}
            <div className="space-y-4">
              
              {/* Accessories */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 font-bold text-amber-400">
                    <ShoppingBag className="w-4 h-4" />
                    <span>مبيعات الإكسسوارات والشرايح</span>
                  </span>
                  <span className="font-mono-num font-bold text-slate-200">
                    {formatNumber(summary.totalAccessories)} ر.ي ({accPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#0F172A] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${accPct}%` }}></div>
                </div>
              </div>

              {/* Phones */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 font-bold text-cyan-400">
                    <Smartphone className="w-4 h-4" />
                    <span>مبيعات الجوالات (المحصلة)</span>
                  </span>
                  <span className="font-mono-num font-bold text-slate-200">
                    {formatNumber(summary.totalPhonesPaid)} ر.ي ({phonesPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#0F172A] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${phonesPct}%` }}></div>
                </div>
              </div>

              {/* Maintenance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 font-bold text-indigo-400">
                    <Wrench className="w-4 h-4" />
                    <span>خدمات الصيانة والبرمجة والقطع</span>
                  </span>
                  <span className="font-mono-num font-bold text-slate-200">
                    {formatNumber(summary.totalMaintenance)} ر.ي ({maintPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#0F172A] rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full transition-all duration-500" style={{ width: `${maintPct}%` }}></div>
                </div>
              </div>

              {/* Recharge */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 font-bold text-emerald-400">
                    <Zap className="w-4 h-4" />
                    <span>مبيعات الرصيد (الهادي والرقم)</span>
                  </span>
                  <span className="font-mono-num font-bold text-slate-200">
                    {formatNumber(summary.totalRechargeWithProfit)} ر.ي ({rechargePct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#0F172A] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${rechargePct}%` }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* Outflows Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Outflows Breakdown Table */}
            <div className="bg-[#1E293B] rounded-2xl border border-slate-700 p-6 shadow-xl space-y-4">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                <span>تفصيل إجمالي المخروجات والمدفوعات</span>
              </h4>

              <div className="divide-y divide-slate-700/60 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">حوالات ومشتريات التجار والموردين:</span>
                  <strong className="text-amber-400 font-mono-num text-sm">{formatNumber(summary.totalSupplierTransfers)} ر.ي</strong>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">مسحوبات حساب بيت مصعب (المنزلي):</span>
                  <strong className="text-emerald-400 font-mono-num text-sm">{formatNumber(summary.totalMusabHouse)} ر.ي</strong>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">مصعب شخصياً (باقات مزايا ومودم وتسليمات):</span>
                  <strong className="text-amber-300 font-mono-num text-sm">{formatNumber(summary.totalMusabPersonal)} ر.ي</strong>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">مستحقات وصرفة العمال (حمدان + المهندس):</span>
                  <strong className="text-blue-400 font-mono-num text-sm">{formatNumber(summary.totalHamdan + summary.totalEngineer)} ر.ي</strong>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">المصروفات اليومية وصرفة المحل والمودم والمشاوير:</span>
                  <strong className="text-rose-400 font-mono-num text-sm">{formatNumber(summary.totalExpenses)} ر.ي</strong>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">المرتجعات المسلمة للزبائن:</span>
                  <strong className="text-rose-300 font-mono-num text-sm">{formatNumber(summary.totalReturns)} ر.ي</strong>
                </div>
              </div>
            </div>

            {/* Staff & Accounts Summary */}
            <div className="bg-[#1E293B] rounded-2xl border border-slate-700 p-6 shadow-xl space-y-4">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>ملخص حسابات العمال والأفراد</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#0F172A] border border-slate-700/60 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-amber-300 text-sm block">العامل حمدان</strong>
                    <span className="text-slate-400">إجمالي الصرفة والمستحقات المستلمة</span>
                  </div>
                  <span className="text-base font-black text-amber-400 font-mono-num">
                    {formatNumber(summary.totalHamdan)} ر.ي
                  </span>
                </div>

                <div className="p-3.5 bg-[#0F172A] border border-slate-700/60 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-blue-300 text-sm block">المهندس (مهندس الصيانة)</strong>
                    <span className="text-slate-400">إجمالي الحساب والصرفة اليومية</span>
                  </div>
                  <span className="text-base font-black text-blue-400 font-mono-num">
                    {formatNumber(summary.totalEngineer)} ر.ي
                  </span>
                </div>

                <div className="p-3.5 bg-[#0F172A] border border-slate-700/60 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-emerald-300 text-sm block">حساب بيت مصعب</strong>
                    <span className="text-slate-400">المسحوبات التراكمية لشهر 8</span>
                  </div>
                  <span className="text-base font-black text-emerald-400 font-mono-num">
                    {formatNumber(summary.totalMusabHouse)} ر.ي
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

