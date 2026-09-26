import React, { useState, useMemo } from 'react';
import {
  Percent,
  Sliders,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Wrench,
  Smartphone,
  Signal,
  Save,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  RefreshCw,
  Printer,
  FileText,
  Utensils,
  Wifi,
  Building2,
  UserCheck,
  Wallet,
  X,
  Check,
} from 'lucide-react';
import { Transaction } from '../types';
import {
  ProfitSharingConfig,
  ProfitSharingModelType,
  ShopProfitAdditionType,
  ExpenseDistributionRules,
} from '../types/profitSharing';
import {
  getProfitSharingConfig,
  saveProfitSharingConfig,
  calculateProfitDistribution,
  DEFAULT_PROFIT_SHARING_CONFIG,
} from '../utils/profitSharingEngine';

interface ProfitSharingSettingsViewProps {
  transactions: Transaction[];
  onConfigSaved?: () => void;
}

export const ProfitSharingSettingsView: React.FC<ProfitSharingSettingsViewProps> = ({
  transactions,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<ProfitSharingConfig>(() => getProfitSharingConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'today' | 'month' | 'all' | 'custom_sim'>('all');
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  // Custom simulator variables
  const [simMaintProfit, setSimMaintProfit] = useState(50000);
  const [simSalesProfit, setSimSalesProfit] = useState(75000);
  const [simNetworksProfit, setSimNetworksProfit] = useState(25000);
  const [simFoodExpenses, setSimFoodExpenses] = useState(12000);
  const [simModemExpenses, setSimModemExpenses] = useState(6000);
  const [simShopExpenses, setSimShopExpenses] = useState(8000);
  const [simWithdrawals, setSimWithdrawals] = useState(5000);
  const [simDaysCount, setSimDaysCount] = useState(30);

  const handleSave = () => {
    saveProfitSharingConfig(config);
    setSavedSuccess(true);
    if (onConfigSaved) {
      onConfigSaved();
    }
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية لتقسيم الأرباح؟')) {
      setConfig(DEFAULT_PROFIT_SHARING_CONFIG);
      saveProfitSharingConfig(DEFAULT_PROFIT_SHARING_CONFIG);
      setSavedSuccess(true);
      if (onConfigSaved) {
        onConfigSaved();
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Filter transactions based on selection
  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'custom_sim') {
      const synthetic: Transaction[] = [
        {
          id: 'sim-maint',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          type: 'maintenance',
          category: 'maintenance',
          description: 'محاكاة أرباح صيانة',
          price: simMaintProfit + 10000,
          cost: 10000,
          profit: simMaintProfit,
        },
        {
          id: 'sim-sales',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          type: 'sale',
          category: 'phones',
          description: 'محاكاة أرباح مبيعات',
          price: simSalesProfit + 50000,
          cost: 50000,
          profit: simSalesProfit,
        },
        {
          id: 'sim-networks',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          type: 'balance_hadi',
          category: 'balance',
          description: 'محاكاة أرباح رصيد',
          price: simNetworksProfit + 20000,
          cost: 20000,
          profit: simNetworksProfit,
        },
        {
          id: 'sim-food',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          type: 'expense_engineer',
          category: 'expenses',
          description: 'محاكاة صرفة وأكل المهندس',
          price: simFoodExpenses,
          cost: 0,
          profit: 0,
        },
        {
          id: 'sim-modem',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          type: 'expense_modem',
          category: 'expenses',
          description: 'محاكاة خرج المودم والنت (مناصفة)',
          price: simModemExpenses,
          cost: 0,
          profit: 0,
        },
        {
          id: 'sim-shop',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          type: 'expense_shop',
          category: 'expenses',
          description: 'محاكاة مصاريف المحل',
          price: simShopExpenses,
          cost: 0,
          profit: 0,
        },
        {
          id: 'sim-withdraw',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          type: 'withdrawal_engineer',
          category: 'engineer',
          description: 'محاكاة مسحوبات وسلفيات المهندس',
          price: simWithdrawals,
          cost: 0,
          profit: 0,
        },
      ];
      return synthetic;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7);

    if (activeFilter === 'today') {
      return transactions.filter((t) => t.date === todayStr);
    }
    if (activeFilter === 'month') {
      return transactions.filter((t) => t.date && t.date.startsWith(currentMonthPrefix));
    }
    return transactions;
  }, [
    activeFilter,
    transactions,
    simMaintProfit,
    simSalesProfit,
    simNetworksProfit,
    simFoodExpenses,
    simModemExpenses,
    simShopExpenses,
    simWithdrawals,
  ]);

  // Compute live calculation using the profitSharingEngine
  const calculationResult = useMemo(() => {
    const customDays = activeFilter === 'custom_sim' ? simDaysCount : undefined;
    return calculateProfitDistribution(filteredTransactions, config, customDays);
  }, [filteredTransactions, config, activeFilter, simDaysCount]);

  const expenseRules = config.expenseRules || DEFAULT_PROFIT_SHARING_CONFIG.expenseRules;

  const updateExpenseRules = (updates: Partial<ExpenseDistributionRules>) => {
    setConfig((prev) => ({
      ...prev,
      expenseRules: {
        ...(prev.expenseRules || DEFAULT_PROFIT_SHARING_CONFIG.expenseRules),
        ...updates,
      },
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                محل مصعب الصوفي لخدمات الجوالات
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                المحرك المالي v2
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-amber-400" />
              نظام وإعدادات تقسيم الأرباح وتوزيع المصاريف
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ضبط قواعد تصفية الحسابات الدقيقة بين المحل (مصعب الصوفي) والمهندس: خصم الصرفة، توزيع مصاريف المودم، نسب الصيانة وأرباح المحل، وحساب الصافي المستحق للاستلام بدون أي تداخل أو كسور.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAgreementModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>معاينة وطباعة الاتفاقية</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700/60 cursor-pointer"
              title="استعادة الافتراضي"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">افتراضي</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد التعديلات</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم حفظ إعدادات وقواعد تقسيم الأرباح وتطبيقها على كافة كشوفات اليوم والشهر بنجاح ✓</span>
          </div>
        )}
      </div>

      {/* The 4 Financial Screens (شاشات الحسابات الأربعة الأساسية لمحل مصعب) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Screen 1: إجمالي أرباح المحل قبل الخصم */}
        <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-extrabold flex items-center gap-1.5 text-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                1. إجمالي الأرباح قبل الخصم
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                الدخل العام
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {calculationResult.totalGrossProfit.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">ر.ي</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">مجموع فوائد الصيانة والمبيعات والشبكات</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3 text-purple-600" />
                أرباح الصيانة:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {calculationResult.grossMaintenanceProfit.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-blue-600" />
                أرباح المبيعات:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {calculationResult.grossSalesProfit.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Signal className="w-3 h-3 text-emerald-600" />
                أرباح الشبكات والشرائح:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {calculationResult.grossNetworksProfit.toLocaleString('en-US')} ر.ي
              </span>
            </div>
          </div>
        </div>

        {/* Screen 2: الصرفة والمصاريف وتوزيعها */}
        <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-extrabold flex items-center gap-1.5 text-slate-800">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                2. الصرفة والمصاريف التشغيلية
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                إجمالي الخرج
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tracking-tight">
                {calculationResult.totalOperatingExpenses.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">ر.ي</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">تتحمل بين المحل والمهندس حسب القواعد</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Utensils className="w-3 h-3 text-amber-600" />
                صرفة وأكل المهندس:
              </span>
              <span className="font-mono font-bold text-rose-700">
                {calculationResult.shopExpensesBreakdown.dailyFoodLivingExpenses.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-sky-600" />
                خرج المودم والنت:
              </span>
              <span className="font-mono font-bold text-rose-700">
                {calculationResult.shopExpensesBreakdown.modemNetExpenses.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-600" />
                مصاريف وتجهيزات المحل:
              </span>
              <span className="font-mono font-bold text-rose-700">
                {calculationResult.shopExpensesBreakdown.shopExpenses.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            <div className="pt-1.5 border-t border-dashed border-slate-200 flex justify-between font-bold text-[10px]">
              <span className="text-indigo-700">
                المحل تحمّل: {calculationResult.expenseDistribution.shopCoveredExpenses.toLocaleString('en-US')}
              </span>
              <span className="text-purple-700">
                المهندس تحمّل: {calculationResult.expenseDistribution.engineerCoveredExpenses.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Screen 3: كم يطلع للعامل / المهندس (صافي الاستلام) */}
        <div className="bg-gradient-to-b from-indigo-900 to-slate-900 border-2 border-indigo-600 p-5 rounded-2xl shadow-md text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-indigo-300 pb-2 border-b border-indigo-800">
              <span className="font-extrabold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                3. كم يطلع للمهندس (صافي)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200">
                للاستلام
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                {calculationResult.engineerNetPayout.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-300">ر.ي</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">الصافي الجاهز للتسليم بعد خصم المسحوبات والمصاريف</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-800/60 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>إجمالي استحقاقه:</span>
              <span className="font-mono font-bold text-emerald-400">
                {calculationResult.engineerGrossTotal.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            {calculationResult.engineerExpenseDeductions > 0 && (
              <div className="flex justify-between text-rose-300">
                <span>خصم المصاريف المشتركة:</span>
                <span className="font-mono font-bold">
                  -{calculationResult.engineerExpenseDeductions.toLocaleString('en-US')} ر.ي
                </span>
              </div>
            )}
            <div className="flex justify-between text-rose-300">
              <span>مسحوباته وسلفياته:</span>
              <span className="font-mono font-bold">
                -{calculationResult.engineerDeductions.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-indigo-800/60">
              <span>المتبقي للمهندس:</span>
              <span className="font-mono">
                {calculationResult.engineerNetPayout.toLocaleString('en-US')} ر.ي
              </span>
            </div>
          </div>
        </div>

        {/* Screen 4: كم باقي للمحل (لصاحب المحل مصعب الصوفي) */}
        <div className="bg-gradient-to-b from-amber-950/70 to-slate-950 border-2 border-amber-500/50 p-5 rounded-2xl shadow-md text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-amber-300 pb-2 border-b border-amber-800/50">
              <span className="font-extrabold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                4. كم باقي للمحل (مصعب الصوفي)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                صافي المالك
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                {calculationResult.shopNetPayout.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-amber-200">ر.ي</span>
              </div>
              <p className="text-[11px] text-amber-200/80 mt-1">الصافي المتبقي للمحل بعد تغطية المصاريف ومستحقات العامل</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-800/50 space-y-1 text-[11px]">
            <div className="flex justify-between text-amber-200">
              <span>الصافي بعد المصاريف:</span>
              <span className="font-mono font-bold">
                {calculationResult.netDistributableProfit.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            <div className="flex justify-between text-amber-200">
              <span>المصاريف التي غطاها المحل:</span>
              <span className="font-mono font-bold text-rose-300">
                {calculationResult.shopExpensesPaid.toLocaleString('en-US')} ر.ي
              </span>
            </div>
            {calculationResult.mosaabHomeAndWithdrawals !== undefined && calculationResult.mosaabHomeAndWithdrawals > 0 && (
              <div className="flex justify-between text-rose-300">
                <span>سحب بيت مصعب وشخصي:</span>
                <span className="font-mono font-bold">
                  -{calculationResult.mosaabHomeAndWithdrawals.toLocaleString('en-US')} ر.ي
                </span>
              </div>
            )}
            <div className="flex justify-between text-emerald-300 font-bold pt-1 border-t border-amber-800/50">
              <span>صافي مصعب النهائي:</span>
              <span className="font-mono">
                {(calculationResult.mosaabFinalNet ?? calculationResult.shopNetPayout).toLocaleString('en-US')} ر.ي
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Simulator Selector Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">مصدر بيانات الحساب المالي:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كافة الحركات المسجلة ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'month'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اليوم فقط
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('custom_sim')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'custom_sim'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>محاكي فوري بأرقام تجريبية</span>
            </button>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500">
          النموذج النشط حالياً:{' '}
          <span className="text-indigo-700 font-extrabold">{calculationResult.modelTitle}</span>
        </div>
      </div>

      {/* Simulator Inputs (Shown only if custom_sim is selected) */}
      {activeFilter === 'custom_sim' && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between text-amber-950 font-bold text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>محاكي فوري بالأرقام التجريبية - غيّر أي رقم لتشاهد فورياً ناتج التقسيم في الشاشات الأربعة:</span>
            </div>
            <span className="text-[11px] text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-lg">
              حساب تجريبي مباشر
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">أرباح الصيانة</label>
              <input
                type="number"
                value={simMaintProfit}
                onChange={(e) => setSimMaintProfit(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">أرباح المبيعات</label>
              <input
                type="number"
                value={simSalesProfit}
                onChange={(e) => setSimSalesProfit(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">أرباح الشبكات</label>
              <input
                type="number"
                value={simNetworksProfit}
                onChange={(e) => setSimNetworksProfit(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">صرفة الأكل</label>
              <input
                type="number"
                value={simFoodExpenses}
                onChange={(e) => setSimFoodExpenses(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-mono font-bold text-rose-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">خرج المودم</label>
              <input
                type="number"
                value={simModemExpenses}
                onChange={(e) => setSimModemExpenses(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-mono font-bold text-rose-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">مصاريف المحل</label>
              <input
                type="number"
                value={simShopExpenses}
                onChange={(e) => setSimShopExpenses(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-mono font-bold text-rose-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">مسحوبات المهندس</label>
              <input
                type="number"
                value={simWithdrawals}
                onChange={(e) => setSimWithdrawals(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">عدد الأيام</label>
              <input
                type="number"
                value={simDaysCount}
                onChange={(e) => setSimDaysCount(Number(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION: قواعد توزيع المصاريف والخرج بين المحل والمهندس (Expense Distribution Rules) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                قواعد توزيع المصاريف والخرج بين المحل والمهندس
              </h2>
              <p className="text-xs text-slate-500">
                حدد من يتحمل الصرفة اليومية، خرج المودم وشبكة النت، ومصاريف تجهيزات المحل
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            قواعد تشغيلية
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rule 1: صرفة وأكل المهندس والعامل */}
          <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>1. صرفة وأكل المهندس اليومية</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              مصاريف الغداء والعشاء والشاي اليومي للعامل والمهندس:
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => updateExpenseRules({ engineerFoodBearer: 'shop_pool' })}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer transition-all flex items-start justify-between ${
                  expenseRules.engineerFoodBearer === 'shop_pool'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold">على المحل من رأس الأرباح</div>
                  <div className={`text-[10px] mt-0.5 ${expenseRules.engineerFoodBearer === 'shop_pool' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    تخصم أولاً من دخل المحل (الوضع السائد)
                  </div>
                </div>
                {expenseRules.engineerFoodBearer === 'shop_pool' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => updateExpenseRules({ engineerFoodBearer: 'shared_half' })}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer transition-all flex items-start justify-between ${
                  expenseRules.engineerFoodBearer === 'shared_half'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold">مناصفة (50% محل / 50% مهندس)</div>
                  <div className={`text-[10px] mt-0.5 ${expenseRules.engineerFoodBearer === 'shared_half' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    نصف على المحل ونصف يخصم من مستحقاته
                  </div>
                </div>
                {expenseRules.engineerFoodBearer === 'shared_half' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => updateExpenseRules({ engineerFoodBearer: 'engineer_personal' })}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer transition-all flex items-start justify-between ${
                  expenseRules.engineerFoodBearer === 'engineer_personal'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold">على حساب المهندس شخصياً</div>
                  <div className={`text-[10px] mt-0.5 ${expenseRules.engineerFoodBearer === 'engineer_personal' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    تخصم بالكامل من معاشه ومستحقاته
                  </div>
                </div>
                {expenseRules.engineerFoodBearer === 'engineer_personal' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>
            </div>
          </div>

          {/* Rule 2: خرج المودم والنت */}
          <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
              <Wifi className="w-4 h-4 text-sky-600" />
              <span>2. خرج المودم وشبكة النت</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              باقات وبطاقات إنترنت المحل والصيانة (المعتمد في محل مصعب مناصفة):
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => updateExpenseRules({ modemNetBearer: 'shared_half' })}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer transition-all flex items-start justify-between ${
                  expenseRules.modemNetBearer === 'shared_half'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold">مناصفة (50% محل / 50% مهندس)</div>
                  <div className={`text-[10px] mt-0.5 ${expenseRules.modemNetBearer === 'shared_half' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    خرج المودم مناصفة (المعتمد بمحل مصعب ✓)
                  </div>
                </div>
                {expenseRules.modemNetBearer === 'shared_half' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => updateExpenseRules({ modemNetBearer: 'shop_pool' })}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer transition-all flex items-start justify-between ${
                  expenseRules.modemNetBearer === 'shop_pool'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold">على المحل من رأس الأرباح</div>
                  <div className={`text-[10px] mt-0.5 ${expenseRules.modemNetBearer === 'shop_pool' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    يتحملها المحل بالكامل كمصروف عام
                  </div>
                </div>
                {expenseRules.modemNetBearer === 'shop_pool' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => updateExpenseRules({ modemNetBearer: 'engineer_personal' })}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer transition-all flex items-start justify-between ${
                  expenseRules.modemNetBearer === 'engineer_personal'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold">على المهندس فقط</div>
                  <div className={`text-[10px] mt-0.5 ${expenseRules.modemNetBearer === 'engineer_personal' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    يخصم خرج المودم من حساب المهندس
                  </div>
                </div>
                {expenseRules.modemNetBearer === 'engineer_personal' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>
            </div>
          </div>

          {/* Rule 3: مصاريف وأدوات وتجهيزات المحل */}
          <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
              <Building2 className="w-4 h-4 text-slate-700" />
              <span>3. مصاريف وتجهيزات وأدوات المحل</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              أدوات صيانة، شواحن، وصلات وتجهيزات ونظافة المحل:
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => updateExpenseRules({ shopToolsBearer: 'shop_pool' })}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer transition-all flex items-start justify-between ${
                  expenseRules.shopToolsBearer === 'shop_pool'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold">تخصم من رأس أرباح المحل أولاً</div>
                  <div className={`text-[10px] mt-0.5 ${expenseRules.shopToolsBearer === 'shop_pool' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    مصروف تشغيلي مشترك قبل توزيع الأرباح
                  </div>
                </div>
                {expenseRules.shopToolsBearer === 'shop_pool' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => updateExpenseRules({ shopToolsBearer: 'owner_only' })}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer transition-all flex items-start justify-between ${
                  expenseRules.shopToolsBearer === 'owner_only'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold">على صاحب المحل (مصعب) فقط</div>
                  <div className={`text-[10px] mt-0.5 ${expenseRules.shopToolsBearer === 'owner_only' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    تخصم من صافي أرباح مصعب بعد التقسيم
                  </div>
                </div>
                {expenseRules.shopToolsBearer === 'owner_only' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection & Customization Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                اختر نموذج تقسيم الأرباح المطلوب تطبيقه
              </h2>
              <p className="text-xs text-slate-500">
                انقر على النموذج المناسب لضبط تفاصيله وتطبيقه على كافة الحسابات
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            6 نماذج متكاملة
          </span>
        </div>

        {/* 6 Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* نموذج 1: الأساسي (الصرفة أولاً + نصف الصيانة + نسبة/معاش من المحل) */}
          <div
            onClick={() => setConfig((prev) => ({ ...prev, activeModel: 'maintenance_half_plus_shop_share' }))}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              config.activeModel === 'maintenance_half_plus_shop_share'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>النموذج 1: نصف الصيانة + (نسبة أو معاش من أرباح المحل)</span>
              </div>
              {config.activeModel === 'maintenance_half_plus_shop_share' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  النموذج المفعل
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <strong>قاعدة العمل:</strong> تُخصم الصرفة أولاً من رأس أرباح المحل. المهندس يستلم <strong>النصف (50%)</strong> في أرباح الصيانة، ومعه من باقي أرباح المحل إما نسبة مئوية من الصافي أو معاش شهري ثابت.
            </p>

            {/* Sub options for Model 1 */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">خصم الصرفة من رأس أرباح المحل أولاً:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  نعم (إلزامي ✓)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">نسبة المهندس في الصيانة:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={config.model1.engineerMaintenancePercent}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        model1: {
                          ...prev.model1,
                          engineerMaintenancePercent: Number(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                  />
                  <span className="font-bold text-slate-500">%</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[11px]">
                    (النصف افتراضياً)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-800">
                  ماذا يستلم المهندس من باقي أرباح المحل (المبيعات والشبكات)؟
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        model1: { ...prev.model1, shopAdditionType: 'percentage' },
                      }))
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                      config.model1.shopAdditionType === 'percentage'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    نسبة مئوية من الصافي
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        model1: { ...prev.model1, shopAdditionType: 'monthly_salary' },
                      }))
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                      config.model1.shopAdditionType === 'monthly_salary'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    معاش شهري ثابت
                  </button>
                </div>

                {config.model1.shopAdditionType === 'percentage' ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-600 font-bold">النسبة من أرباح المحل:</span>
                    <input
                      type="number"
                      value={config.model1.shopAdditionPercent}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          model1: { ...prev.model1, shopAdditionPercent: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                    <div className="flex gap-1 mr-auto">
                      {[10, 20, 25, 33.3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              model1: { ...prev.model1, shopAdditionPercent: val },
                            }))
                          }
                          className="px-2 py-0.5 text-[10px] rounded bg-slate-200 hover:bg-indigo-100 text-slate-700 font-mono font-bold cursor-pointer"
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-600 font-bold">المعاش الشهري للمهندس:</span>
                    <input
                      type="number"
                      value={config.model1.shopAdditionMonthlySalary}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          model1: {
                            ...prev.model1,
                            shopAdditionMonthlySalary: Number(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-32 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">ر.ي شهرياً</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* نموذج 2: خصم الصرفة من رأس الأرباح كامل ونسبة للعامل (الثلث أو النص) */}
          <div
            onClick={() => setConfig((prev) => ({ ...prev, activeModel: 'net_profit_share' }))}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              config.activeModel === 'net_profit_share'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>النموذج 2: خصم الصرفة من الكل + نسبة للعامل (الثلث أو النص)</span>
              </div>
              {config.activeModel === 'net_profit_share' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  النموذج المفعل
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <strong>قاعدة العمل:</strong> تُجمع كافة أرباح المحل (صيانة + مبيعات + شبكات)، وتُخصم الصرفة كاملة من رأس المال، ثم يُحسب للعامل/المهندس نسبة من الصافي المتبقي.
            </p>

            {/* Sub options for Model 2 */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-3" onClick={(e) => e.stopPropagation()}>
              <label className="block text-xs font-bold text-slate-800">
                اختر النسبة المستحقة للعامل المهندس من صافي الأرباح:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      model2: { ...prev.model2, ratioPreset: 'third', customPercent: 33.33 },
                    }))
                  }
                  className={`py-2 px-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    config.model2.ratioPreset === 'third'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  الثلث (33.33%)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      model2: { ...prev.model2, ratioPreset: 'half', customPercent: 50 },
                    }))
                  }
                  className={`py-2 px-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    config.model2.ratioPreset === 'half'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  النصف (50%)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      model2: { ...prev.model2, ratioPreset: 'custom' },
                    }))
                  }
                  className={`py-2 px-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    config.model2.ratioPreset === 'custom'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  نسبة أخرى
                </button>
              </div>

              {config.model2.ratioPreset === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-600 font-bold">النسبة المخصصة:</span>
                  <input
                    type="number"
                    value={config.model2.customPercent}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        model2: { ...prev.model2, customPercent: Number(e.target.value) || 0 },
                      }))
                    }
                    className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              )}
            </div>
          </div>

          {/* نموذج 3: معاش شهري مع الخرج (المحل يتحمل الصرفة) */}
          <div
            onClick={() => setConfig((prev) => ({ ...prev, activeModel: 'salary_with_expenses' }))}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              config.activeModel === 'salary_with_expenses'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>النموذج 3: معاش شهري ثابت مع الخرج</span>
              </div>
              {config.activeModel === 'salary_with_expenses' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  النموذج المفعل
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <strong>قاعدة العمل:</strong> راتب شهري ثابت للعامل/المهندس، مع <strong>تحمل المحل لكافة المصاريف والخرج والصرفة اليومية</strong> (أكل وغداء) دون أن تُخصم من راتبه.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
              <span className="font-bold text-slate-700">المعاش الشهري المتفق عليه:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={config.salaryModel.monthlyAmount}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      salaryModel: { ...prev.salaryModel, monthlyAmount: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                />
                <span className="font-bold text-slate-600">ر.ي</span>
              </div>
            </div>
          </div>

          {/* نموذج 4: معاش شهري بدون الخرج (الصرفة مخصومة عليه) */}
          <div
            onClick={() => setConfig((prev) => ({ ...prev, activeModel: 'salary_without_expenses' }))}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              config.activeModel === 'salary_without_expenses'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>النموذج 4: معاش شهري ثابت بدون الخرج</span>
              </div>
              {config.activeModel === 'salary_without_expenses' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  النموذج المفعل
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <strong>قاعدة العمل:</strong> راتب شهري ثابت، ولكن <strong>الصرفة والخرج الشخصي والأكل محسوبة على العامل</strong> وتُخصم من راتبه ومستحقاته عند التصفية.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
              <span className="font-bold text-slate-700">المعاش الشهري المتفق عليه:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={config.salaryModel.monthlyAmount}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      salaryModel: { ...prev.salaryModel, monthlyAmount: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                />
                <span className="font-bold text-slate-600">ر.ي</span>
              </div>
            </div>
          </div>

          {/* نموذج 5: نظام القبال للمحل بمبلغ يومي ثابت */}
          <div
            onClick={() => setConfig((prev) => ({ ...prev, activeModel: 'daily_qabal' }))}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              config.activeModel === 'daily_qabal'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <span>النموذج 5: نظام القبال (مبلغ يومي لصاحب المحل)</span>
              </div>
              {config.activeModel === 'daily_qabal' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  النموذج المفعل
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <strong>قاعدة العمل:</strong> مبلغ يومي ثابت متفق عليه يقدمه العامل/المهندس لصاحب المحل مصعب الصوفي، وما زاد من الأرباح بعد سداد المصاريف يؤول للعامل.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
              <span className="font-bold text-slate-700">مبلغ القبال اليومي للمحل:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={config.qabalModel.dailyTargetAmount}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      qabalModel: { ...prev.qabalModel, dailyTargetAmount: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                />
                <span className="font-bold text-slate-600">ر.ي يومياً</span>
              </div>
            </div>
          </div>

          {/* نموذج 6: شراكة بالنص مناصفة */}
          <div
            onClick={() => setConfig((prev) => ({ ...prev, activeModel: 'equal_partnership_half' }))}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              config.activeModel === 'equal_partnership_half'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  6
                </span>
                <span>النموذج 6: شراكة بالنصف (50% / 50% مناصفة)</span>
              </div>
              {config.activeModel === 'equal_partnership_half' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  النموذج المفعل
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <strong>قاعدة العمل:</strong> تُخصم الصرفة والمصاريف التشغيلية أولاً من رأس أرباح المحل كاملة، والصافي المتبقي يُقسم <strong>مناصفة 50% لصاحب المحل و 50% للشريك</strong>.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">نسبة الشراكة:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[11px]">
                50% لصاحب المحل | 50% للشريك
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Calculation Audit Log (تأكيد دقة الحسابات بالأرقام الصريحة) */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-7 text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>كشف تدقيق العمليات الرياضية خطوة بخطوة (دقة الحسابات 100%)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {calculationResult.modelTitle}
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs text-slate-300">
          {calculationResult.stepByStepLog.map((step, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            * المبالغ محسوبة بالريال اليمني بدون أي كسور عائمة وفقاً للمعايير المحاسبية المعتمدة لمحل مصعب الصوفي.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAgreementModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>طباعة سند الاتفاقية</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>اعتماد وحفظ الإعدادات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Agreement & Settlement Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 text-slate-900 border border-slate-200 relative my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">
                  وثيقة اتفاقية ونموذج تقسيم الأرباح وتصفية الحساب
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Section */}
            <div id="printable-agreement" className="space-y-4 text-xs leading-relaxed border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
              <div className="text-center pb-3 border-b border-slate-300">
                <h4 className="text-sm font-black text-slate-900">محل مصعب الصوفي لخدمات الجوالات والشبكات</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">سند اتفاقية تنظيم العمل وتصفية الأرباح المشتركة</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">التاريخ: {new Date().toISOString().split('T')[0]}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500 font-bold block">الطرف الأول (صاحب المحل):</span>
                  <span className="font-extrabold text-slate-900">مصعب الصوفي</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">الطرف الثاني (المهندس/العامل):</span>
                  <span className="font-extrabold text-slate-900">مهندس الصيانة وتشغيل المحل</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-[11px]">بنود ونظام العمل المتفق عليها:</div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">النموذج المعتمد:</span>
                    <span className="font-bold text-indigo-700">{calculationResult.modelTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">صرفة وأكل المهندس:</span>
                    <span className="font-bold text-slate-900">
                      {expenseRules.engineerFoodBearer === 'shop_pool'
                        ? 'على المحل من رأس الأرباح'
                        : expenseRules.engineerFoodBearer === 'shared_half'
                        ? 'مناصفة (50% على المحل و 50% على المهندس)'
                        : 'على حساب المهندس شخصياً'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">خرج المودم وشبكة النت:</span>
                    <span className="font-bold text-slate-900">
                      {expenseRules.modemNetBearer === 'shared_half'
                        ? 'مناصفة 50% / 50% (معتمد محل مصعب ✓)'
                        : expenseRules.modemNetBearer === 'shop_pool'
                        ? 'على رأس مال المحل'
                        : 'على المهندس'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">مصاريف وتجهيزات المحل:</span>
                    <span className="font-bold text-slate-900">
                      {expenseRules.shopToolsBearer === 'shop_pool' ? 'تخصم من رأس الأرباح أولاً' : 'على صاحب المحل فقط'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-[11px]">بيان الأرقام ومستحقات التصفية الحالية:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <span className="block text-indigo-700 text-[10px]">صافي استحقاق المهندس:</span>
                    <span className="text-base font-black text-indigo-950">
                      {calculationResult.engineerNetPayout.toLocaleString('en-US')} ر.ي
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="block text-amber-700 text-[10px]">صافي باقي المحل (مصعب):</span>
                    <span className="text-base font-black text-amber-950">
                      {calculationResult.shopNetPayout.toLocaleString('en-US')} ر.ي
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-6 text-center text-[11px]">
                <div className="space-y-8">
                  <span className="font-bold text-slate-700 block">توقيع صاحب المحل (مصعب الصوفي):</span>
                  <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
                </div>
                <div className="space-y-8">
                  <span className="font-bold text-slate-700 block">توقيع المهندس / الشريك:</span>
                  <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الوثيقة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
