import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Layers,
  Edit3,
  Check,
  Download,
  ExternalLink,
  Volume2,
  ChevronDown,
  ChevronUp,
  Save,
  Clock,
  Sparkles,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import {
  TelecomStatementRow,
  TelecomStatementSummary,
  TelecomPackagePricing,
  NavTab,
} from '../types';
import {
  calculateTelecomStatementSummary,
  saveTelecomStatementRows,
  filterTelecomStatementRows,
} from '../utils/telecomStatementStorage';
import {
  saveTelecomPackage,
  loadTelecomCatalog,
  findCatalogMatchForOperation,
} from '../utils/telecomCatalogStorage';
import { exportRechargeManagerToExcel } from '../utils/excelExport';

export interface ChatTelecomStatementData {
  statementId: string;
  sourceApp: string;
  statementPeriod?: string;
  fileName: string;
  allRows: TelecomStatementRow[];
  selectedPeriod: 'all' | 'today' | 'month' | 'specific_day' | 'custom_range';
  specificDay?: string;
  customStartDate?: string;
  customEndDate?: string;
}

interface Props {
  statement: ChatTelecomStatementData;
  onUpdateStatement: (updated: ChatTelecomStatementData) => void;
  onPlayVoice: (text: string) => void;
  onNavigateToTab?: (tab: NavTab) => void;
}

export const AIAssistantTelecomStatementCard: React.FC<Props> = ({
  statement,
  onUpdateStatement,
  onPlayVoice,
  onNavigateToTab,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'month' | 'specific_day' | 'custom_range'>(
    statement.selectedPeriod || 'all'
  );
  const [specificDay, setSpecificDay] = useState<string>(
    statement.specificDay || (statement.allRows[0]?.date || new Date().toISOString().split('T')[0])
  );
  const [customStartDate, setCustomStartDate] = useState<string>(statement.customStartDate || '');
  const [customEndDate, setCustomEndDate] = useState<string>(statement.customEndDate || '');

  // Package pricing editor state
  const [showPricingEditor, setShowPricingEditor] = useState(false);
  const [editedPrices, setEditedPrices] = useState<Record<string, { customerSellingPrice: number; netProfit: number }>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Extract unique available dates sorted descending
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    statement.allRows.forEach((r) => {
      if (r.date) set.add(r.date);
    });
    return Array.from(set).sort().reverse();
  }, [statement.allRows]);

  // Extract unique packages in this statement
  const uniquePackages = useMemo(() => {
    const map = new Map<string, { packageName: string; operator: string; operatorNameAr: string; amount: number; sellingPrice: number; netProfit: number; count: number }>();
    statement.allRows.forEach((r) => {
      const key = `${r.operator}_${r.packageName || 'رصيد'}_${r.amount}`;
      if (!map.has(key)) {
        map.set(key, {
          packageName: r.packageName || 'باقة رصيد',
          operator: r.operator,
          operatorNameAr: r.operatorNameAr || r.operator,
          amount: r.amount || 0,
          sellingPrice: r.sellingPrice || r.amount || 0,
          netProfit: r.netProfit || 0,
          count: 1,
        });
      } else {
        map.get(key)!.count++;
      }
    });
    return Array.from(map.values());
  }, [statement.allRows]);

  // Filter rows based on the selected period
  const filteredRows = useMemo(() => {
    return statement.allRows.filter((row) => {
      if (selectedPeriod === 'all') return true;
      if (selectedPeriod === 'today') {
        const today = new Date().toISOString().split('T')[0];
        return row.date === today;
      }
      if (selectedPeriod === 'month') {
        const currentMonth = new Date().toISOString().substring(0, 7);
        return (row.date || '').startsWith(currentMonth);
      }
      if (selectedPeriod === 'specific_day') {
        return row.date === specificDay;
      }
      if (selectedPeriod === 'custom_range') {
        if (customStartDate && row.date < customStartDate) return false;
        if (customEndDate && row.date > customEndDate) return false;
        return true;
      }
      return true;
    });
  }, [statement.allRows, selectedPeriod, specificDay, customStartDate, customEndDate]);

  // Calculate summary for selected days
  const summary: TelecomStatementSummary = useMemo(() => {
    return calculateTelecomStatementSummary(filteredRows);
  }, [filteredRows]);

  // Period label for display
  const periodLabel = useMemo(() => {
    if (selectedPeriod === 'all') return `كامل فترة الكشف (${uniqueDates.length} يوماً)`;
    if (selectedPeriod === 'today') return 'مبيعات اليوم فقط';
    if (selectedPeriod === 'month') return 'مبيعات هذا الشهر';
    if (selectedPeriod === 'specific_day') return `يوم ${specificDay}`;
    if (selectedPeriod === 'custom_range') return `من ${customStartDate || 'البداية'} إلى ${customEndDate || 'النهاية'}`;
    return 'الفترة المحددة';
  }, [selectedPeriod, uniqueDates.length, specificDay, customStartDate, customEndDate]);

  // Handle price change for a package
  const handlePriceChange = (pkgKey: string, cost: number, newSellingPrice: number) => {
    const profit = Math.max(0, newSellingPrice - cost);
    setEditedPrices((prev) => ({
      ...prev,
      [pkgKey]: {
        customerSellingPrice: newSellingPrice,
        netProfit: profit,
      },
    }));
  };

  // Save modified package pricing permanently and recalculate statement
  const handleSaveAllPackagePrices = () => {
    const currentCatalog = loadTelecomCatalog();
    let updatedRows = [...statement.allRows];

    uniquePackages.forEach((pkg) => {
      const key = `${pkg.operator}_${pkg.packageName}_${pkg.amount}`;
      const edited = editedPrices[key];
      if (edited) {
        // 1. Save or update package in permanent catalog
        const matchInCatalog = currentCatalog.find(
          (c) => c.operator === pkg.operator && c.packageName === pkg.packageName && Number(c.providerCostPrice) === Number(pkg.amount)
        );

        if (matchInCatalog) {
          saveTelecomPackage({
            ...matchInCatalog,
            customerSellingPrice: edited.customerSellingPrice,
            notes: 'تم تعديل التسعيرة عبر المحاسب الذكي',
          });
        } else {
          saveTelecomPackage({
            operator: (pkg.operator as any) || 'other',
            operatorNameAr: pkg.operator || 'أخرى',
            packageName: pkg.packageName,
            packageCategory: 'mix_bundle',
            providerCostPrice: pkg.amount,
            customerSellingPrice: edited.customerSellingPrice,
            netProfit: edited.customerSellingPrice - pkg.amount,
            profitMarginPercent: pkg.amount > 0 ? Math.round(((edited.customerSellingPrice - pkg.amount) / pkg.amount) * 100) : 0,
            isActive: true,
            notes: 'تم تعديل التسعيرة عبر المحاسب الذكي',
          });
        }

        // 2. Update matching rows in the statement
        updatedRows = updatedRows.map((row) => {
          if (row.operator === pkg.operator && (row.packageName === pkg.packageName || (!row.packageName && pkg.packageName === 'باقة رصيد')) && Number(row.amount) === Number(pkg.amount)) {
            const cost = Number(row.amount) || 0;
            const selling = edited.customerSellingPrice;
            const profit = selling - cost;
            return {
              ...row,
              sellingPrice: selling,
              netProfit: profit,
            };
          }
          return row;
        });
      }
    });

    // Save updated rows to storage
    saveTelecomStatementRows(updatedRows);

    // Update parent statement state
    const updatedStatement: ChatTelecomStatementData = {
      ...statement,
      allRows: updatedRows,
      selectedPeriod,
      specificDay,
      customStartDate,
      customEndDate,
    };
    onUpdateStatement(updatedStatement);

    setSaveSuccessMsg('تم حفظ التسعيرات الجديدة وتحديث جميع مبيعات وأرباح الكشف بنجاح!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Voice narration of the summary
  const handleVoiceSummary = () => {
    const speech = `تقرير مبيعات الرصيد للفترة: ${periodLabel}. إجمالي المبيعات بلغ ${summary.totalSellingPrice.toLocaleString('ar-YE')} ريال، وتكلفة الرصيد ${summary.totalAmount.toLocaleString('ar-YE')} ريال، وصافي الأرباح والفائدة المحققة هو ${summary.totalNetProfit.toLocaleString('ar-YE')} ريال بعدد ${summary.successCount} عملية ناجحة.`;
    onPlayVoice(speech);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredRows.map((r) => ({
      التاريخ: r.date,
      الوقت: r.time,
      الشبكة: r.operatorNameAr,
      النوع: r.packageName || r.operationType,
      'الرقم المسدد له': r.targetNumber,
      'تكلفة الشراء (المخصوم)': r.amount,
      'سعر البيع للزبون': r.sellingPrice,
      'صافي الربح': r.netProfit,
      المرجع: r.referenceId,
      الحالة: r.status === 'success' ? 'ناجحة' : 'فاشلة',
      ملاحظات: r.notes || '',
    }));
    exportRechargeManagerToExcel(exportData, `كشف_رصيد_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="mt-3 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 p-4 shadow-xl overflow-hidden animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">كشف سداد الرصيد وشبكات الاتصالات</h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                {statement.sourceApp || 'الهادي أونلاين'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              الملف: {statement.fileName} • إجمالي العمليات المستخرجة: {statement.allRows.length} عملية
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleVoiceSummary}
          className="p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-xl border border-indigo-400/30 transition-all cursor-pointer flex items-center gap-1.5 text-xs"
          title="استماع صوتي للملخص"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">نطق الملخص</span>
        </button>
      </div>

      {/* Days & Period Selector Bar */}
      <div className="mt-3.5 bg-black/30 rounded-xl p-2.5 border border-white/5 flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>تحديد الأيام والفترة المحسوبة:</span>
          </span>

          <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
            {periodLabel} ({filteredRows.length} عملية)
          </span>
        </div>

        {/* Period Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedPeriod('all')}
            className={`px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
              selectedPeriod === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            كل الأيام ({uniqueDates.length} يوم)
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('today')}
            className={`px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
              selectedPeriod === 'today'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            اليوم فقط
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('month')}
            className={`px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
              selectedPeriod === 'month'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            هذا الشهر
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('specific_day')}
            className={`px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
              selectedPeriod === 'specific_day'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            يوم محدد
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('custom_range')}
            className={`px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
              selectedPeriod === 'custom_range'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            فترة مخصصة
          </button>
        </div>

        {/* Specific Day Picker Dropdown */}
        {selectedPeriod === 'specific_day' && (
          <div className="flex items-center gap-2 mt-1 pt-2 border-t border-white/10">
            <span className="text-xs text-slate-300 shrink-0">اختر اليوم من الكشف:</span>
            <select
              value={specificDay}
              onChange={(e) => setSpecificDay(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none flex-1"
            >
              {uniqueDates.map((date) => (
                <option key={date} value={date}>
                  {date} ({statement.allRows.filter((r) => r.date === date).length} عملية)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Date Range Picker */}
        {selectedPeriod === 'custom_range' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pt-2 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 shrink-0">من تاريخ:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs w-full focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300 shrink-0">إلى تاريخ:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs w-full focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Calculated KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
        {/* Total Sales */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/40 border border-emerald-500/30 rounded-xl p-3">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-bold">مبيع الرصيد (المبيعات)</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-black text-white font-mono">
            {summary.totalSellingPrice.toLocaleString('ar-YE')}{' '}
            <span className="text-xs font-normal text-emerald-300">ريال</span>
          </div>
          <span className="text-[10px] text-emerald-300/80 mt-0.5 block">
            سعر بيع الباقات للزبائن
          </span>
        </div>

        {/* Total Cost */}
        <div className="bg-gradient-to-br from-amber-950/60 to-amber-900/40 border border-amber-500/30 rounded-xl p-3">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-bold">المخصوم (التكلفة)</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-black text-white font-mono">
            {summary.totalAmount.toLocaleString('ar-YE')}{' '}
            <span className="text-xs font-normal text-amber-300">ريال</span>
          </div>
          <span className="text-[10px] text-amber-300/80 mt-0.5 block">
            المبلغ المخصوم من التطبيق
          </span>
        </div>

        {/* Net Profit & Gain */}
        <div className="bg-gradient-to-br from-indigo-950/80 to-blue-900/60 border border-indigo-400/40 rounded-xl p-3 ring-2 ring-indigo-500/20 shadow-lg">
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-bold">صافي الفوائد والأرباح</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-black text-emerald-400 font-mono">
            +{summary.totalNetProfit.toLocaleString('ar-YE')}{' '}
            <span className="text-xs font-normal text-indigo-200">ريال</span>
          </div>
          <span className="text-[10px] text-indigo-200/80 mt-0.5 block">
            ربح صافي محقق ({summary.successCount} عملية)
          </span>
        </div>
      </div>

      {/* Network breakdown mini-row */}
      <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs bg-white/5 rounded-xl p-2 px-3 border border-white/5">
        <span className="text-slate-400 font-bold">الشبكات:</span>
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(summary.byOperator).map(([opKey, val]) => (
            <div key={opKey} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-slate-300">{opKey}:</span>
              <span className="font-bold text-white font-mono">{val.amount.toLocaleString()} ر.ي</span>
              <span className="text-emerald-400 font-mono text-[10px]">(+{val.profit.toLocaleString()})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Package Profit Pricing Editor Toggle Section */}
      <div className="mt-3.5 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowPricingEditor((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل تسعيرة فائدة الباقات وتحديث الكشف</span>
            {showPricingEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {saveSuccessMsg && (
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Pricing Editor Accordion */}
        {showPricingEditor && (
          <div className="mt-3 bg-slate-950/80 rounded-xl p-3 border border-amber-500/20 flex flex-col gap-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-white/10">
              <span>الباقات المكتشفة في الكشف ({uniquePackages.length} باقة):</span>
              <span className="text-[11px] text-amber-400">عدل سعر البيع للزبون واحفظ لتحديث الأرباح فورياً</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {uniquePackages.map((pkg) => {
                const key = `${pkg.operator}_${pkg.packageName}_${pkg.amount}`;
                const currentSelling = editedPrices[key]?.customerSellingPrice ?? pkg.sellingPrice;
                const currentProfit = currentSelling - pkg.amount;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{pkg.packageName}</div>
                      <div className="text-[10px] text-slate-400">
                        {pkg.operatorNameAr} • التكلفة: <span className="font-mono text-amber-300">{pkg.amount} ريال</span> • ظهرت {pkg.count} مرة
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-300">سعر البيع:</span>
                        <input
                          type="number"
                          value={currentSelling}
                          onChange={(e) => handlePriceChange(key, pkg.amount, Number(e.target.value) || 0)}
                          className="w-20 bg-slate-800 text-white font-bold font-mono px-2 py-1 rounded border border-slate-600 text-center text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="w-16 text-center">
                        <span className="text-[10px] text-slate-400 block">الفائدة:</span>
                        <span className="font-bold font-mono text-emerald-400 text-xs">+{currentProfit} ر.ي</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Button for Pricing */}
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleSaveAllPackagePrices}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التسعيرات وتحديث أرباح الكشف بالكامل</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>تصدير إكسل ({filteredRows.length})</span>
          </button>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('telecom_engine')}
              className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white px-3 py-1.5 rounded-xl border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح الكشف في الشاشة الكاملة</span>
            </button>
          )}
        </div>

        <span className="text-[10px] text-slate-400">
          تمت المطابقة الذكية مع كتالوج الباقات وحفظ العمليات
        </span>
      </div>
    </div>
  );
};
