import React, { useState } from 'react';
import {
  PieChart,
  FileText,
  FileSpreadsheet,
  Printer,
  Calendar,
  UserCheck,
  Wrench,
  TrendingDown,
  TrendingUp,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Users,
  Percent,
  Calculator,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Layers,
  Box,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { Transaction, MonthlySettlement } from '../types';
import {
  calculateMonthlySettlement,
  calculatePeriodSettlement,
  calculateDailySummary,
  formatCurrency,
  getUniqueDates,
} from '../utils/calculations';
import { getProfitSharingConfig, calculateProfitDistribution } from '../utils/profitSharingEngine';
import { exportMonthlyDocReport } from '../utils/docExport';
import { exportToExcel } from '../utils/excelExport';
import { printHtmlElement } from '../utils/printHelper';

interface MonthlySettlementViewProps {
  transactions: Transaction[];
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onSelectDate: (date: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const MonthlySettlementView: React.FC<MonthlySettlementViewProps> = ({
  transactions,
  currentMonth,
  onMonthChange,
  onSelectDate,
  onNavigateTab,
}) => {
  // Filter mode: 'month' (specific month), 'all' (all days), 'range' (between two dates)
  const [filterMode, setFilterMode] = useState<'month' | 'range' | 'all'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Compute filtered transactions and period name
  let filteredTx = transactions;
  let periodTitle = `شهر ${currentMonth}`;

  if (filterMode === 'month') {
    filteredTx = transactions.filter((t) => t.date.startsWith(currentMonth));
    const [year, month] = currentMonth.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const mIdx = parseInt(month, 10) - 1;
    periodTitle = `شهر ${monthNames[mIdx] || month} ${year}`;
  } else if (filterMode === 'range') {
    if (startDate && endDate) {
      filteredTx = transactions.filter((t) => t.date >= startDate && t.date <= endDate);
      periodTitle = `الفترة من (${startDate}) إلى (${endDate})`;
    } else if (startDate) {
      filteredTx = transactions.filter((t) => t.date >= startDate);
      periodTitle = `من تاريخ (${startDate})`;
    } else if (endDate) {
      filteredTx = transactions.filter((t) => t.date <= endDate);
      periodTitle = `حتى تاريخ (${endDate})`;
    } else {
      periodTitle = 'فترة مخصصة بين تاريخين';
    }
  } else if (filterMode === 'all') {
    filteredTx = transactions;
    periodTitle = 'كافة الأيام المسجلة في النظام';
  }

  const uniqueDays = getUniqueDates(filteredTx);
  const settlement = calculatePeriodSettlement(filteredTx, periodTitle);

  // Active profit-sharing model for the period
  const profitConfig = getProfitSharingConfig();
  const monthProfitResult = settlement.profitSharingResult || calculateProfitDistribution(filteredTx, profitConfig, uniqueDays.length);
  const [showMonthlyAudit, setShowMonthlyAudit] = useState<boolean>(false);

  // Multi-Year and Month selector options (e.g. 2024 to 2035)
  const years = Array.from({ length: 12 }, (_, i) => 2024 + i);
  const months = [
    { num: '01', name: 'يناير' },
    { num: '02', name: 'فبراير' },
    { num: '03', name: 'مارس' },
    { num: '04', name: 'أبريل' },
    { num: '05', name: 'مايو' },
    { num: '06', name: 'يونيو' },
    { num: '07', name: 'يوليو' },
    { num: '08', name: 'أغسطس' },
    { num: '09', name: 'سبتمبر' },
    { num: '10', name: 'أكتوبر' },
    { num: '11', name: 'نوفمبر' },
    { num: '12', name: 'ديسمبر' },
  ];

  const currentYearStr = currentMonth.split('-')[0] || '2026';
  const currentMonthNum = currentMonth.split('-')[1] || '06';

  const handleYearChange = (y: string) => {
    onMonthChange(`${y}-${currentMonthNum}`);
  };

  const handleMonthChange = (m: string) => {
    onMonthChange(`${currentYearStr}-${m}`);
  };

  // Preset quick ranges
  const applyLastDays = (daysCount: number) => {
    const allDates = getUniqueDates(transactions);
    if (allDates.length === 0) return;
    const latest = allDates[0];
    const latestDateObj = new Date(latest);
    const pastDateObj = new Date(latestDateObj);
    pastDateObj.setDate(pastDateObj.getDate() - daysCount + 1);
    const startStr = pastDateObj.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(latest);
    setFilterMode('range');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Comprehensive Filter Bar (Month / All Days / Custom Range) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                تصفية وخلاصة الحسابات ({periodTitle})
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ملخص الأيام والكشف الإجمالي المعتمد للمحل، مصعب الصوفي، المدير، ومهندس الصيانة
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Export Buttons */}
            <button
              onClick={() => exportMonthlyDocReport(currentMonth, filteredTx, 'مصعب الصوفي')}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all no-print cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>تصدير Word Doc</span>
            </button>

            <button
              onClick={() => exportToExcel(currentMonth, filteredTx, 'مصعب الصوفي')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all no-print cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={() => printHtmlElement('monthly-settlement-print-area')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all no-print cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكشف</span>
            </button>
          </div>
        </div>

        {/* Filter Mode Selector & Range Pickers */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>شهر محدد</span>
            </button>

            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>كافة الأيام ({transactions.length > 0 ? getUniqueDates(transactions).length : 0} يوم)</span>
            </button>

            <button
              onClick={() => setFilterMode('range')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'range'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>بين تاريخين</span>
            </button>
          </div>

          {/* Controls based on filter mode */}
          {filterMode === 'month' && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Year Select */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 font-bold">السنة:</span>
                <select
                  value={currentYearStr}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y.toString()} className="text-slate-900">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Select */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 font-bold">الشهر:</span>
                <select
                  value={currentMonthNum}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m.num} value={m.num} className="text-slate-900">
                      {m.num} - {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {filterMode === 'range' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 font-bold">من تاريخ:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 font-bold">إلى تاريخ:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
                />
              </div>

              {/* Quick Range Presets */}
              <button
                onClick={() => applyLastDays(30)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
              >
                آخر 30 يوم
              </button>
              <button
                onClick={() => applyLastDays(7)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
              >
                آخر 7 أيام
              </button>
            </div>
          )}

          {filterMode === 'all' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>يتم الآن عرض وتحليل كافة الأيام والحركات المسجلة في تاريخ المحل ({uniqueDays.length} يوم)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Settlement Sheet Card (Grand Financial Summary) */}
      <div id="monthly-settlement-full-card" className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-indigo-500/30 print-break-inside-avoid space-y-6">
        
        {/* Header Title & Model Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>كشف حساب وتصفية الشهر الرسمي</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>{monthProfitResult.modelTitle}</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              تصفية عمل شهر ({settlement.monthName}) لمحل مصعب الصوفي ({settlement.daysCount} يوم عمل)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              المالك: <strong>مصعب الصوفي</strong> • الصيانة وإدارة الفرع: <strong>المهندس / المدير</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('profit_sharing')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-slate-200 transition-all cursor-pointer no-print"
              >
                <Percent className="w-3.5 h-3.5 text-indigo-400" />
                <span>إعدادات ونماذج الأرباح ⚙️</span>
              </button>
            )}

            <div className="bg-slate-900/90 px-4 py-2 rounded-2xl border border-cyan-500/40 text-right">
              <span className="text-[10px] text-cyan-300 block font-bold">صافي كاش الدرج التراكمي:</span>
              <span className="font-mono font-black text-lg sm:text-xl text-cyan-200">
                {formatCurrency(settlement.closingCashInDrawer)}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* الشاشات الأربع للأرباح والخرج لشهر كامل (The 4 Monthly Screens) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* 1. شاشة إجمالي أرباح الشهر قبل الخصم */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-amber-500/30 shadow-lg space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-black text-xs sm:text-sm text-amber-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>1. أرباح الشهر قبل الخصم</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                  خام
                </span>
              </div>

              <div className="text-xs space-y-2 pt-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">إجمالي أرباح الصيانة:</span>
                  <span className="font-mono font-bold text-purple-300">
                    {formatCurrency(monthProfitResult.grossMaintenanceProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">أرباح المبيعات والإكسسوار:</span>
                  <span className="font-mono font-bold text-blue-300">
                    {formatCurrency(monthProfitResult.grossSalesProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">أرباح شبكات الرصيد والشرائح:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatCurrency(monthProfitResult.grossNetworksProfit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-amber-200">الإجمالي العام لشهر ({settlement.monthName}):</span>
              <span className="font-mono font-black text-base text-amber-300">
                {formatCurrency(monthProfitResult.totalGrossProfit)}
              </span>
            </div>
          </div>

          {/* 2. شاشة الصرفة والمصروفات المخصومة أولاً للشهر */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-rose-500/30 shadow-lg space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-black text-xs sm:text-sm text-rose-300 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span>2. صرفة وخرج الشهر المخصومة</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                  تخصم أولاً
                </span>
              </div>

              <div className="text-xs space-y-2 pt-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">صرفة الأكل والمعيشة ({settlement.daysCount} يوم):</span>
                  <span className="font-mono font-bold text-rose-300">
                    -{formatCurrency(monthProfitResult.shopExpensesBreakdown.dailyFoodLivingExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">مصاريف وتجهيزات وأدوات المحل:</span>
                  <span className="font-mono font-bold text-rose-300">
                    -{formatCurrency(monthProfitResult.shopExpensesBreakdown.shopExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">خرج الرصيد والمودم:</span>
                  <span className="font-mono font-bold text-rose-300">
                    -{formatCurrency(monthProfitResult.shopExpensesBreakdown.modemNetExpenses)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 mt-2">
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-200">إجمالي الصرفة والخرج:</span>
                <span className="font-mono font-black text-sm text-rose-300">
                  -{formatCurrency(monthProfitResult.totalOperatingExpenses)}
                </span>
              </div>
              <div className="text-[11px] text-emerald-300 text-center flex justify-between px-1">
                <span>صافي المحل بعد الصرفة:</span>
                <strong className="font-mono text-emerald-200">{formatCurrency(monthProfitResult.netDistributableProfit)}</strong>
              </div>
            </div>
          </div>

          {/* 3. شاشة كم يطلع للعامل المهندس للشهر */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border-2 border-indigo-500/50 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-black text-xs sm:text-sm text-indigo-300 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-indigo-400" />
                  <span>3. كم يطلع للعامل المهندس</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  مستحق الصرف
                </span>
              </div>

              <div className="text-xs space-y-2 pt-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">حصة الصيانة الشهرية:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {formatCurrency(monthProfitResult.engineerMaintenanceShare)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">حصة أرباح المحل أو المعاش:</span>
                  <span className="font-mono font-bold text-indigo-200">
                    {formatCurrency(monthProfitResult.engineerShopShare + monthProfitResult.engineerSalaryShare)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span className="text-rose-400">سلفيات ومسحوبات شخصية:</span>
                  <span className="font-mono">
                    {monthProfitResult.engineerDeductions > 0 ? `-${formatCurrency(monthProfitResult.engineerDeductions)}` : '0 ر.ي'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border-2 border-indigo-400/50 rounded-xl p-3 flex flex-col justify-between gap-1 mt-2">
              <span className="text-xs font-bold text-indigo-200">صافي استحقاق المهندس للشهر:</span>
              <span className="font-mono font-black text-lg text-indigo-300 text-left">
                {formatCurrency(monthProfitResult.engineerNetPayout)}
              </span>
            </div>
          </div>

          {/* 4. شاشة كم باقي للمحل (لصاحب المحل مصعب الصوفي) */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border-2 border-emerald-500/50 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-black text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>4. كم باقي للمحل (مصعب)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  صاحب المحل
                </span>
              </div>

              <div className="text-xs space-y-2 pt-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">صافي أرباح المحل المتبقية:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatCurrency(monthProfitResult.shopNetPayout)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span className="text-rose-400">خصم صرفة بيت مصعب:</span>
                  <span className="font-mono">
                    {settlement.mosaabTotalHomeExpenses > 0 ? `-${formatCurrency(settlement.mosaabTotalHomeExpenses)}` : '0 ر.ي'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span className="text-rose-400">خصم سحوبات مصعب للشهر:</span>
                  <span className="font-mono">
                    {settlement.mosaabTotalWithdrawals > 0 ? `-${formatCurrency(settlement.mosaabTotalWithdrawals)}` : '0 ر.ي'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border-2 border-emerald-400/50 rounded-xl p-3 flex flex-col justify-between gap-1 mt-2">
              <span className="text-xs font-bold text-emerald-200">صافي المستحق النهائي لمصعب:</span>
              <span className="font-mono font-black text-lg text-emerald-300 text-left">
                {formatCurrency(settlement.mosaabFinalPayable)}
              </span>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* سجل التدقيق الرياضي والعمليات خطوة بخطوة للشهر (Collapsible) */}
        {/* ======================================================== */}
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowMonthlyAudit(!showMonthlyAudit)}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>كشف التدقيق الرياضي لشهر ({settlement.monthName}) خطوة بخطوة بالريال اليمني ({monthProfitResult.stepByStepLog.length} خطوات)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px]">{showMonthlyAudit ? 'إخفاء التفاصيل' : 'عرض التدقيق الرياضي'}</span>
              {showMonthlyAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showMonthlyAudit && (
            <div className="p-4 pt-1 border-t border-slate-800 space-y-2 text-xs font-mono">
              {monthProfitResult.stepByStepLog.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Closing Drawer Cash */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-cyan-200">
              صافي الكاش الفعلي المتراكم في الدرج:
            </span>
          </div>
          <span className="font-mono font-black text-xl text-cyan-300">
            {formatCurrency(settlement.closingCashInDrawer)}
          </span>
        </div>

      </div>

      {/* Daily Breakdown Table for the selected period */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>جدول ملخص الأيام ({periodTitle}) - إجمالي: {uniqueDays.length} يوم</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              اضغط على زر (عرض الحاوية 📦) لعرض تفاصيل اليوم داخل صندوق مغلق، أو اضغط على التاريخ للانتقال المباشر للدفتر
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800">
              {uniqueDays.length} يوم عمل
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] sm:min-w-full text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <th className="p-3 text-center">الحاوية</th>
                <th className="p-3">اليوم</th>
                <th className="p-3">المبيعات</th>
                <th className="p-3">الأرباح الخام</th>
                <th className="p-3">فايدة الصيانة (محل)</th>
                <th className="p-3">فايدة المهندس</th>
                <th className="p-3">المصاريف المشتركة</th>
                <th className="p-3">الصافي القابل للتوزيع</th>
                <th className="p-3">حصة مصعب (2/3)</th>
                <th className="p-3">صرفة بيت مصعب</th>
                <th className="p-3">حصة المدير (1/3)</th>
                <th className="p-3">كاش الدرج</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {uniqueDays.map((dayDate) => {
                const s = calculateDailySummary(dayDate, filteredTx);
                const isExpanded = expandedDay === dayDate;

                return (
                  <React.Fragment key={dayDate}>
                    <tr
                      className={`transition-colors ${
                        isExpanded
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Toggle Enclosed Box Container */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDay(isExpanded ? null : dayDate);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer mx-auto ${
                            isExpanded
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700'
                          }`}
                          title="عرض تفاصيل اليوم في حاوية مغلقة"
                        >
                          <Box className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'إغلاق' : 'الحاوية'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>

                      <td className="p-3 font-bold text-sky-700 dark:text-sky-400 font-mono">
                        <button
                          type="button"
                          onClick={() => onSelectDate(dayDate)}
                          className="hover:underline flex items-center gap-1 cursor-pointer text-right"
                          title="الانتقال للدفتر اليومي لهذا اليوم"
                        >
                          <span>{s.date}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </button>
                      </td>

                      <td className="p-3 font-mono">{formatCurrency(s.totalSales)}</td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(s.totalGrossProfit + s.shopMaintenanceShare)}
                      </td>
                      <td className="p-3 font-mono text-purple-700 dark:text-purple-400 font-bold">
                        {formatCurrency(s.shopMaintenanceShare)}
                      </td>
                      <td className="p-3 font-mono text-indigo-700 dark:text-indigo-400">
                        {formatCurrency(s.engineerShare)}
                      </td>
                      <td className="p-3 font-mono text-rose-600 dark:text-rose-400">
                        -{formatCurrency(s.totalSharedDeductions)}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(s.netDistributableProfit)}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(s.mosaabShare)}
                      </td>
                      <td className="p-3 font-mono text-rose-600 dark:text-rose-400">
                        {s.mosaabHomeExpenses > 0 ? `-${formatCurrency(s.mosaabHomeExpenses)}` : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-sky-800 dark:text-sky-300">
                        {formatCurrency(s.managerShare)}
                      </td>
                      <td className="p-3 font-mono font-bold text-cyan-800 dark:text-cyan-300">
                        {formatCurrency(s.netCashDrawer)}
                      </td>
                    </tr>

                    {/* The Enclosed Box Container (حاوية أو مربع مغلق) */}
                    {isExpanded && (
                      <tr className="bg-slate-900/5 dark:bg-slate-950/60">
                        <td colSpan={12} className="p-3 sm:p-5">
                          <div className="bg-slate-900 text-slate-100 rounded-2xl border-2 border-indigo-500/60 shadow-2xl p-4 sm:p-6 space-y-4 ring-4 ring-indigo-500/10 animate-in zoom-in-95 duration-150">
                            
                            {/* Container Header */}
                            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                                  <Box className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-black text-base text-white">
                                      حاوية تفاصيل يوم ({s.date}) المغلقة
                                    </h4>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold">
                                      مربع مغلق للتدقيق المالي
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    جميع بنود وحسابات اليوم مفصلة داخل هذه الحاوية ومطابقة لدفتر اليومية
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onSelectDate(dayDate)}
                                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                                >
                                  <span>الانتقال للدفتر اليومي</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedDay(null)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                                  title="إغلاق الحاوية"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* 4 Internal Enclosed Sub-Boxes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                              
                              {/* Sub-Box 1: Sales & Cost */}
                              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-sky-500/30 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-sky-300 font-bold border-b border-slate-800 pb-1.5">
                                  <span>🛒 صندوق المبيعات والسلع</span>
                                  <span className="font-mono">{formatCurrency(s.totalSales)}</span>
                                </div>
                                <div className="space-y-1 text-slate-300">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">إجمالي المبيعات:</span>
                                    <span className="font-mono font-bold">{formatCurrency(s.totalSales)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">الأرباح الخام من المبيعات:</span>
                                    <span className="font-mono text-emerald-400 font-bold">{formatCurrency(s.totalGrossProfit)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Sub-Box 2: Maintenance & Engineer */}
                              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-purple-500/30 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-purple-300 font-bold border-b border-slate-800 pb-1.5">
                                  <span>🔧 صندوق الصيانة والمهندس</span>
                                  <span className="font-mono">{formatCurrency(s.maintenanceTotal)}</span>
                                </div>
                                <div className="space-y-1 text-slate-300">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">دخل الصيانة الإجمالي:</span>
                                    <span className="font-mono font-bold">{formatCurrency(s.maintenanceTotal)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">فايدة الصيانة للمحل (50%):</span>
                                    <span className="font-mono text-purple-300 font-bold">{formatCurrency(s.shopMaintenanceShare)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">مستحق مهندس الصيانة (50%):</span>
                                    <span className="font-mono text-indigo-300 font-bold">{formatCurrency(s.engineerShare)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Sub-Box 3: Expenses & Home */}
                              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-rose-500/30 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-rose-300 font-bold border-b border-slate-800 pb-1.5">
                                  <span>📉 صندوق الخرج والمصاريف</span>
                                  <span className="font-mono text-rose-400">-{formatCurrency(s.totalSharedDeductions + s.mosaabHomeExpenses)}</span>
                                </div>
                                <div className="space-y-1 text-slate-300">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">مصاريف المحل المشتركة:</span>
                                    <span className="font-mono text-rose-400">-{formatCurrency(s.totalSharedDeductions)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">صرفة بيت مصعب الصوفي:</span>
                                    <span className="font-mono text-rose-400">
                                      {s.mosaabHomeExpenses > 0 ? `-${formatCurrency(s.mosaabHomeExpenses)}` : '0 ر.ي'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">سحوبات مصعب الشخصية:</span>
                                    <span className="font-mono text-rose-400">
                                      {s.mosaabWithdrawals > 0 ? `-${formatCurrency(s.mosaabWithdrawals)}` : '0 ر.ي'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Sub-Box 4: Net Distribution & Drawer Cash */}
                              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-emerald-500/30 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-emerald-300 font-bold border-b border-slate-800 pb-1.5">
                                  <span>💰 صندوق التوزيع والكاش</span>
                                  <span className="font-mono text-cyan-300">{formatCurrency(s.netCashDrawer)}</span>
                                </div>
                                <div className="space-y-1 text-slate-300">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">الصافي القابل للتوزيع:</span>
                                    <span className="font-mono text-amber-400 font-bold">{formatCurrency(s.netDistributableProfit)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">حصة مصعب (2/3):</span>
                                    <span className="font-mono text-emerald-400 font-bold">{formatCurrency(s.mosaabShare)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">حصة المدير (1/3):</span>
                                    <span className="font-mono text-sky-400 font-bold">{formatCurrency(s.managerShare)}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-800 pt-1 text-cyan-200">
                                    <span>كاش الدرج الصافي:</span>
                                    <span className="font-mono font-black">{formatCurrency(s.netCashDrawer)}</span>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* Enclosed Box Footer Note */}
                            <div className="flex flex-wrap items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>البيانات داخل هذه الحاوية محكمة ومغلقة ولا يتم التعديل عليها إلا من واقع قيود الدفتر اليومي.</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => onSelectDate(dayDate)}
                                className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                              >
                                عرض وتعديل كل حركة منفردة في الدفتر ↗
                              </button>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
