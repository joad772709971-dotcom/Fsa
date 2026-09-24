import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wrench,
  ShoppingBag,
  Home,
  User,
  Zap,
  Building,
  DollarSign,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  Edit3,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { formatArabicDateDisplay, getShiftedDate } from '../utils/aiDateHelper';

interface SmartAIDayEditorProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  transactions: Transaction[];
  onSaveTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onCloseDetailedView?: () => void;
}

const TYPE_CONFIG: Partial<
  Record<
    TransactionType,
    { label: string; category: Category; color: string; badgeClass: string }
  >
> = {
  sale: { label: 'مبيعات', category: 'accessories', color: 'emerald', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  maintenance: { label: 'صيانة (50%)', category: 'maintenance', color: 'blue', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  balance_hadi: { label: 'رصيد الهادي (مياس)', category: 'balance', color: 'teal', badgeClass: 'bg-teal-100 text-teal-800 border-teal-300' },
  balance_qimma: { label: 'رصيد الرقم (فايز)', category: 'balance', color: 'cyan', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  sim: { label: 'شرايح', category: 'sims', color: 'purple', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
  purchase: { label: 'مشتريات بضاعة', category: 'purchases', color: 'indigo', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  expense_shop: { label: 'خرج المحل', category: 'expenses', color: 'amber', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  expense_home_mosaab: { label: 'بيت مصعب', category: 'mosaab', color: 'orange', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300' },
  withdrawal_mosaab: { label: 'سحب مصعب', category: 'mosaab', color: 'rose', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
  mosaab_purchases_fund: { label: 'مسلم لمصعب (بضاعة)', category: 'mosaab', color: 'amber', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  expense_engineer: { label: 'صرفة مهندس', category: 'engineer', color: 'sky', badgeClass: 'bg-sky-100 text-sky-800 border-sky-300' },
  withdrawal_engineer: { label: 'سحب مهندس', category: 'engineer', color: 'red', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
  expense_worker: { label: 'صرفة عامل', category: 'worker', color: 'slate', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' },
  withdrawal_worker: { label: 'سحب عامل', category: 'worker', color: 'red', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
  expense_modem: { label: 'رصيد مودم', category: 'expenses', color: 'violet', badgeClass: 'bg-violet-100 text-violet-800 border-violet-300' },
  shop_tools_outflow: { label: 'أدوات للمحل', category: 'expenses', color: 'yellow', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  damaged: { label: 'تالف', category: 'damaged', color: 'zinc', badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300' },
};

export const SmartAIDayEditor: React.FC<SmartAIDayEditorProps> = ({
  currentDate,
  onDateChange = () => {},
  availableDates = [],
  transactions = [],
  onSaveTransaction = () => {},
  onDeleteTransaction = () => {},
  onCloseDetailedView,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [saveStatusText, setSaveStatusText] = useState<string>('الحفظ التلقائي الفوري مفعل');

  // Display mode: 'cards' for comfortable mobile view, 'table' for classical spreadsheet
  const [viewFormat, setViewFormat] = useState<'cards' | 'table'>('cards');
  // Collapsible KPI banner to save vertical screen space on mobile
  const [isKpiExpanded, setIsKpiExpanded] = useState<boolean>(false);
  // Collapsible quick add panel at bottom
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState<boolean>(false);
  // Track which card is in expanded editing mode
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Quick Add Row State
  const [newType, setNewType] = useState<TransactionType>('sale');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newCost, setNewCost] = useState<number | ''>('');
  const [newProfit, setNewProfit] = useState<number | ''>('');

  // Transactions for the current date
  const dayTxList = useMemo(() => {
    return (transactions || []).filter((t) => t && t.date === currentDate);
  }, [transactions, currentDate]);

  // Daily KPI summary calculations
  const summary = useMemo(() => {
    let totalSales = 0;
    let totalMaintenance = 0;
    let totalBalanceProfit = 0;
    let totalShopExpenses = 0;
    let totalMusabWithdrawals = 0;
    let totalStaffExpenses = 0;
    let totalPurchases = 0;
    let totalProfit = 0;

    dayTxList.forEach((tx) => {
      const price = Number(tx.price) || 0;
      const profit = Number(tx.profit) || 0;

      if (tx.type === 'sale') {
        totalSales += price;
        totalProfit += profit;
      } else if (tx.type === 'maintenance') {
        totalMaintenance += price;
        totalProfit += profit;
      } else if (tx.type === 'balance_hadi' || tx.type === 'balance_qimma') {
        totalBalanceProfit += profit;
        totalProfit += profit;
      } else if (
        tx.type === 'expense_shop' ||
        tx.type === 'expense_modem' ||
        tx.type === 'shop_tools_outflow'
      ) {
        totalShopExpenses += price;
      } else if (
        tx.type === 'expense_home_mosaab' ||
        tx.type === 'withdrawal_mosaab' ||
        tx.type === 'mosaab_purchases_fund'
      ) {
        totalMusabWithdrawals += price;
      } else if (
        tx.type === 'expense_engineer' ||
        tx.type === 'expense_worker' ||
        tx.type === 'withdrawal_engineer' ||
        tx.type === 'withdrawal_worker'
      ) {
        totalStaffExpenses += price;
      } else if (tx.type === 'purchase') {
        totalPurchases += price;
      }
    });

    const netCashInDrawer =
      totalSales +
      totalMaintenance -
      (totalShopExpenses + totalMusabWithdrawals + totalStaffExpenses + totalPurchases);

    return {
      count: dayTxList.length,
      totalSales,
      totalMaintenance,
      totalBalanceProfit,
      totalShopExpenses,
      totalMusabWithdrawals,
      totalStaffExpenses,
      totalPurchases,
      totalProfit,
      netCashInDrawer,
    };
  }, [dayTxList]);

  // Filtered transactions list
  const filteredList = useMemo(() => {
    return dayTxList.filter((tx) => {
      // Category filter
      if (filterCategory !== 'all') {
        if (filterCategory === 'sales' && tx.type !== 'sale') return false;
        if (filterCategory === 'maintenance' && tx.type !== 'maintenance') return false;
        if (
          filterCategory === 'balance' &&
          tx.type !== 'balance_hadi' &&
          tx.type !== 'balance_qimma' &&
          tx.type !== 'sim'
        )
          return false;
        if (
          filterCategory === 'shop_expenses' &&
          tx.type !== 'expense_shop' &&
          tx.type !== 'expense_modem' &&
          tx.type !== 'shop_tools_outflow'
        )
          return false;
        if (
          filterCategory === 'mosaab' &&
          tx.type !== 'expense_home_mosaab' &&
          tx.type !== 'withdrawal_mosaab' &&
          tx.type !== 'mosaab_purchases_fund'
        )
          return false;
        if (
          filterCategory === 'staff' &&
          tx.type !== 'expense_engineer' &&
          tx.type !== 'expense_worker' &&
          tx.type !== 'withdrawal_engineer' &&
          tx.type !== 'withdrawal_worker'
        )
          return false;
        if (filterCategory === 'purchases' && tx.type !== 'purchase') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = (tx.description || '').toLowerCase().includes(q);
        const matchPrice = (tx.price || 0).toString().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        return matchDesc || matchPrice || matchNotes;
      }

      return true;
    });
  }, [dayTxList, filterCategory, searchQuery]);

  // Notify auto-save feedback
  const triggerSaveFeedback = useCallback((id: string) => {
    setLastSavedId(id);
    setSaveStatusText('✓ تم الحفظ والمزامنة السحابية فوراً');
    setTimeout(() => {
      setLastSavedId(null);
    }, 2000);
  }, []);

  // Update a field on any transaction and auto-save instantly
  const handleUpdateTransactionField = useCallback(
    (
      tx: Transaction,
      field: 'description' | 'price' | 'cost' | 'profit' | 'type' | 'time' | 'notes',
      value: any
    ) => {
      let updated: Transaction = { ...tx, [field]: value };

      // Recalculate profit if price or cost changed for sales or maintenance
      if (field === 'price' || field === 'cost' || field === 'type') {
        const p = field === 'price' ? Number(value) || 0 : Number(updated.price) || 0;
        const c = field === 'cost' ? Number(value) || 0 : Number(updated.cost) || 0;
        const currentType = field === 'type' ? (value as TransactionType) : updated.type;

        if (currentType === 'sale') {
          updated.profit = Math.max(0, p - c);
          updated.category = 'accessories';
        } else if (currentType === 'maintenance') {
          // In Mosaab shop, maintenance profit is 50%
          const netLabor = Math.max(0, p - c);
          updated.profit = Math.round(netLabor * 0.5);
          updated.category = 'maintenance';
        } else if (
          currentType === 'expense_shop' ||
          currentType === 'expense_home_mosaab' ||
          currentType === 'withdrawal_mosaab' ||
          currentType === 'expense_engineer' ||
          currentType === 'expense_worker'
        ) {
          updated.cost = p;
          updated.profit = 0;
          updated.category = TYPE_CONFIG[currentType]?.category || 'expenses';
        }
      }

      onSaveTransaction(updated);
      triggerSaveFeedback(tx.id);
    },
    [onSaveTransaction, triggerSaveFeedback]
  );

  // Add new row quickly
  const handleQuickAdd = () => {
    if (!newDescription.trim() && !newPrice) return;

    const p = Number(newPrice) || 0;
    let c = Number(newCost) || 0;
    let pr = Number(newProfit) || 0;

    if (newType === 'sale') {
      if (!newProfit && p > c) pr = p - c;
      if (!newCost && p > pr) c = p - pr;
    } else if (newType === 'maintenance') {
      const net = Math.max(0, p - c);
      pr = Math.round(net * 0.5);
    } else if (newType.startsWith('expense') || newType.startsWith('withdrawal')) {
      c = p;
      pr = 0;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newTx: Transaction = {
      id: `tx_smart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: currentDate,
      time: timeStr,
      type: newType,
      category: TYPE_CONFIG[newType]?.category || 'accessories',
      description: newDescription.trim() || TYPE_CONFIG[newType]?.label || 'بند جديد',
      price: p,
      cost: c,
      profit: pr,
    };

    onSaveTransaction(newTx);
    triggerSaveFeedback(newTx.id);

    // Reset inputs
    setNewDescription('');
    setNewPrice('');
    setNewCost('');
    setNewProfit('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-in fade-in duration-200">
      {/* Top Header & Day Navigation */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white">
                كشف وتفاصيل عمل: {formatArabicDateDisplay(currentDate)}
              </h3>
              <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded text-indigo-200">
                {currentDate}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-300">{saveStatusText}</span>
              </span>
              <span>•</span>
              <span className="text-[11px]">{dayTxList.length} حركة محاسبية مسجلة</span>
            </div>
          </div>
        </div>

        {/* Date Switcher & Close Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDateChange(getShiftedDate(currentDate, -1))}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="اليوم السابق"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">السابق</span>
          </button>

          {/* Quick Date Selector Dropdown */}
          <input
            type="date"
            value={currentDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
            title="اختيار تاريخ محدد"
          />

          <button
            type="button"
            onClick={() => onDateChange(getShiftedDate(currentDate, 1))}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="اليوم التالي"
          >
            <span className="hidden sm:inline">التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>

          {onCloseDetailedView && (
            <button
              type="button"
              onClick={onCloseDetailedView}
              className="mr-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>العودة للدردشة</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Financial Statistics Bar (Collapsible to save massive vertical space on mobile) */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        {/* Sleek Compact Summary Strip */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 font-medium">
            <div className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-normal">المبيعات:</span>
              <span className="font-bold font-mono">{formatCurrency(summary.totalSales)}</span>
            </div>

            <div className="flex items-center gap-1 text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-normal">الصيانة:</span>
              <span className="font-bold font-mono">{formatCurrency(summary.totalMaintenance)}</span>
            </div>

            <div className="flex items-center gap-1 text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-normal">الأرباح:</span>
              <span className="font-bold font-mono">{formatCurrency(summary.totalProfit)}</span>
            </div>

            <div className="flex items-center gap-1 text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
              <DollarSign className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px] font-normal">الصندوق:</span>
              <span className="font-bold font-mono">{formatCurrency(summary.netCashInDrawer)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsKpiExpanded(!isKpiExpanded)}
            className="px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            title={isKpiExpanded ? 'طي المؤشرات التفصيلية' : 'عرض كافة المؤشرات الستة'}
          >
            <span>{isKpiExpanded ? 'إخفاء التفاصيل' : 'المؤشرات (6)'}</span>
            {isKpiExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Detailed 6 KPI Grid (Shown when expanded) */}
        {isKpiExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2.5 pt-0 bg-slate-50 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                إجمالي المبيعات
              </span>
              <span className="text-sm font-bold font-mono text-emerald-950 mt-1">
                {formatCurrency(summary.totalSales)}
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                دخل الصيانة
              </span>
              <span className="text-sm font-bold font-mono text-blue-950 mt-1">
                {formatCurrency(summary.totalMaintenance)}
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-amber-600" />
                خرج ومصاريف المحل
              </span>
              <span className="text-sm font-bold font-mono text-amber-950 mt-1">
                {formatCurrency(summary.totalShopExpenses)}
              </span>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[11px] text-orange-800 font-semibold flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-orange-600" />
                خرج وسحب مصعب
              </span>
              <span className="text-sm font-bold font-mono text-orange-950 mt-1">
                {formatCurrency(summary.totalMusabWithdrawals)}
              </span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[11px] text-indigo-800 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                الأرباح التقديرية
              </span>
              <span className="text-sm font-bold font-mono text-indigo-950 mt-1">
                {formatCurrency(summary.totalProfit)}
              </span>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[11px] text-slate-700 font-semibold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-700" />
                صافي الصندوق
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 mt-1">
                {formatCurrency(summary.netCashInDrawer)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar & View Mode Switcher */}
      <div className="p-2 sm:p-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 sm:pb-0 max-w-full">
          {[
            { key: 'all', label: `الكل (${dayTxList.length})` },
            { key: 'sales', label: 'المبيعات' },
            { key: 'maintenance', label: 'الصيانة' },
            { key: 'balance', label: 'الرصيد والشرايح' },
            { key: 'shop_expenses', label: 'خرج المحل' },
            { key: 'mosaab', label: 'حساب مصعب' },
            { key: 'staff', label: 'العمال والمهندس' },
            { key: 'purchases', label: 'المشتريات' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterCategory(tab.key)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterCategory === tab.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle (Cards vs Table) */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setViewFormat('cards')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewFormat === 'cards'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض البطاقات المريحة للجوال"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>بطاقات</span>
            </button>
            <button
              type="button"
              onClick={() => setViewFormat('table')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewFormat === 'table'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض الجدول المالي الكامل"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>جدول</span>
            </button>
          </div>

          {/* Search within Day */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالصنف أو السعر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-1 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Transactions Scroll Container (Generous vertical scrolling, full viewport space) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-3 space-y-2.5 pb-20 sm:pb-8">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
            <Sparkles className="w-9 h-9 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-xs sm:text-sm text-slate-700">لا توجد حركات مسجلة تطابق التصفية لهذا اليوم.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              انقر على زر "إضافة بند جديد" في الأسفل لإضافة حركة فوراً.
            </p>
          </div>
        ) : viewFormat === 'cards' ? (
          /* Cards View Mode - Optimized for Mobile & Touch Screen Readability */
          <div className="space-y-2.5">
            {filteredList.map((tx, idx) => {
              const cfg = TYPE_CONFIG[tx.type] || {
                label: tx.type,
                badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
              };
              const isSaved = lastSavedId === tx.id;
              const isEditing = editingCardId === tx.id;

              return (
                <div
                  key={tx.id}
                  className={`bg-white rounded-2xl border transition-all duration-150 p-3 sm:p-4 shadow-xs ${
                    isSaved
                      ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {/* Card Header: Type Badge, Index, Time, and Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg.badgeClass} truncate`}>
                        {cfg.label}
                      </span>
                      {tx.time && (
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-0.5 shrink-0">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{tx.time}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingCardId(isEditing ? null : tx.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isEditing
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="تعديل سريع للصنف"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{isEditing ? 'إغلاق' : 'تعديل'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف هذا البند"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body: Description or Inline Form */}
                  {isEditing ? (
                    <div className="space-y-2.5 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع الحركة:</label>
                        <select
                          value={tx.type}
                          onChange={(e) => handleUpdateTransactionField(tx, 'type', e.target.value as TransactionType)}
                          className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="sale">🛒 مبيعات</option>
                          <option value="maintenance">🔧 دخل صيانة (50%)</option>
                          <option value="balance_hadi">💳 رصيد الهادي (مياس)</option>
                          <option value="balance_qimma">💳 رصيد الرقم (فايز)</option>
                          <option value="sim">📶 شرايح</option>
                          <option value="expense_shop">🏪 خرج المحل</option>
                          <option value="expense_home_mosaab">🏠 بيت مصعب</option>
                          <option value="withdrawal_mosaab">💵 سحب مصعب</option>
                          <option value="mosaab_purchases_fund">📦 مسلم لمصعب (بضاعة)</option>
                          <option value="expense_engineer">👷 صرفة مهندس</option>
                          <option value="withdrawal_engineer">👷 سحب مهندس</option>
                          <option value="expense_worker">👥 صرفة عامل</option>
                          <option value="purchase">📦 مشتريات بضاعة</option>
                          <option value="shop_tools_outflow">🔌 أدوات للمحل</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">البيان / الصنف:</label>
                        <input
                          type="text"
                          defaultValue={tx.description}
                          onBlur={(e) => handleUpdateTransactionField(tx, 'description', e.target.value)}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">المبلغ:</label>
                          <input
                            type="number"
                            defaultValue={tx.price || ''}
                            onBlur={(e) => handleUpdateTransactionField(tx, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-mono font-bold px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-left"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">التكلفة:</label>
                          <input
                            type="number"
                            defaultValue={tx.cost || ''}
                            onBlur={(e) => handleUpdateTransactionField(tx, 'cost', parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-left"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">الربح:</label>
                          <input
                            type="number"
                            defaultValue={tx.profit || ''}
                            onBlur={(e) => handleUpdateTransactionField(tx, 'profit', parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-mono font-bold text-emerald-700 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingCardId(null)}
                        className="w-full py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تم التعديل والحفظ تلقائياً</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Generous Description */}
                      <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug break-words mb-2.5">
                        {tx.description}
                      </p>

                      {/* Financial Metrics Strip */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="bg-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-600 font-medium">المبلغ:</span>
                          <span className="font-black text-slate-900 font-mono text-sm">
                            {formatCurrency(tx.price)}
                          </span>
                        </div>

                        {Number(tx.cost) > 0 && (
                          <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                            <span className="text-[11px] text-amber-800 font-medium">التكلفة:</span>
                            <span className="font-bold text-amber-900 font-mono text-xs">
                              {formatCurrency(tx.cost)}
                            </span>
                          </div>
                        )}

                        {Number(tx.profit) > 0 && (
                          <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                            <span className="text-[11px] text-emerald-800 font-medium">الربح:</span>
                            <span className="font-bold text-emerald-700 font-mono text-xs">
                              +{formatCurrency(tx.profit)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Classical Spreadsheet Table View */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                    <th className="p-2.5 w-12 text-center">#</th>
                    <th className="p-2.5 w-36">النوع</th>
                    <th className="p-2.5 min-w-[180px]">البيان / الصنف</th>
                    <th className="p-2.5 w-24">المبلغ</th>
                    <th className="p-2.5 w-24">التكلفة</th>
                    <th className="p-2.5 w-24">الربح</th>
                    <th className="p-2.5 w-20 text-center">الوقت</th>
                    <th className="p-2.5 w-16 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((tx, idx) => {
                    const isJustSaved = lastSavedId === tx.id;

                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isJustSaved ? 'bg-emerald-50/70 ring-1 ring-emerald-400' : ''
                        }`}
                      >
                        <td className="p-2 text-center text-slate-400 font-mono text-[10px]">
                          {idx + 1}
                        </td>

                        <td className="p-1.5">
                          <select
                            value={tx.type}
                            onChange={(e) =>
                              handleUpdateTransactionField(
                                tx,
                                'type',
                                e.target.value as TransactionType
                              )
                            }
                            className={`w-full text-[11px] font-bold p-1 rounded-lg border focus:outline-none cursor-pointer ${
                              TYPE_CONFIG[tx.type]?.badgeClass || 'bg-slate-50'
                            }`}
                          >
                            <option value="sale">🛒 مبيعات</option>
                            <option value="maintenance">🔧 صيانة (50%)</option>
                            <option value="balance_hadi">💳 رصيد الهادي (مياس)</option>
                            <option value="balance_qimma">💳 رصيد الرقم (فايز)</option>
                            <option value="sim">📶 شرايح</option>
                            <option value="expense_shop">🏪 خرج المحل</option>
                            <option value="expense_home_mosaab">🏠 بيت مصعب</option>
                            <option value="withdrawal_mosaab">💵 سحب مصعب</option>
                            <option value="mosaab_purchases_fund">📦 مسلم لمصعب (بضاعة)</option>
                            <option value="expense_engineer">👷 صرفة مهندس</option>
                            <option value="withdrawal_engineer">👷 سحب مهندس</option>
                            <option value="expense_worker">👥 صرفة عامل</option>
                            <option value="withdrawal_worker">👥 سحب عامل</option>
                            <option value="purchase">📦 مشتريات بضاعة</option>
                            <option value="expense_modem">🌐 رصيد مودم</option>
                            <option value="shop_tools_outflow">🔌 أدوات للمحل</option>
                            <option value="damaged">⚠️ تالف</option>
                          </select>
                        </td>

                        <td className="p-1.5">
                          <input
                            type="text"
                            defaultValue={tx.description}
                            key={`desc_${tx.id}_${tx.description}`}
                            onBlur={(e) => {
                              if (e.target.value !== tx.description) {
                                handleUpdateTransactionField(tx, 'description', e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            placeholder="البيان..."
                            className="w-full px-2 py-1 bg-white hover:bg-slate-50 focus:bg-white rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                          />
                        </td>

                        <td className="p-1.5">
                          <input
                            type="number"
                            defaultValue={tx.price}
                            key={`price_${tx.id}_${tx.price}`}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val !== tx.price) {
                                handleUpdateTransactionField(tx, 'price', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-full px-2 py-1 bg-white hover:bg-slate-50 focus:bg-white rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-mono font-bold text-slate-900 text-left"
                            dir="ltr"
                          />
                        </td>

                        <td className="p-1.5">
                          <input
                            type="number"
                            defaultValue={tx.cost || 0}
                            key={`cost_${tx.id}_${tx.cost}`}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val !== (tx.cost || 0)) {
                                handleUpdateTransactionField(tx, 'cost', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-full px-2 py-1 bg-white hover:bg-slate-50 focus:bg-white rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-mono text-slate-600 text-left"
                            dir="ltr"
                          />
                        </td>

                        <td className="p-1.5">
                          <input
                            type="number"
                            defaultValue={tx.profit || 0}
                            key={`profit_${tx.id}_${tx.profit}`}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val !== (tx.profit || 0)) {
                                handleUpdateTransactionField(tx, 'profit', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-full px-2 py-1 bg-white hover:bg-slate-50 focus:bg-white rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-mono font-bold text-emerald-700 text-left"
                            dir="ltr"
                          />
                        </td>

                        <td className="p-1.5 text-center">
                          <input
                            type="text"
                            defaultValue={tx.time || '00:00'}
                            key={`time_${tx.id}_${tx.time}`}
                            onBlur={(e) => {
                              if (e.target.value !== tx.time) {
                                handleUpdateTransactionField(tx, 'time', e.target.value);
                              }
                            }}
                            className="w-16 px-1 py-1 text-[11px] font-mono text-center bg-white rounded border border-slate-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </td>

                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="حذف هذا البند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Docked / Expandable Quick Add Bar (Prevents crowding out transactions on mobile) */}
      <div className="bg-white border-t border-slate-200 shrink-0 shadow-lg">
        {!isQuickAddExpanded ? (
          <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsQuickAddExpanded(true)}
              className="flex-1 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة حركة أو صنف جديد ({currentDate})</span>
            </button>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-2 rounded-xl whitespace-nowrap">
              {filteredList.length} / {dayTxList.length} بند
            </span>
          </div>
        ) : (
          <div className="p-2.5 sm:p-3.5 bg-indigo-50/70 border-t border-indigo-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-indigo-100">
              <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>إضافة بند سريع ومباشر لهذا اليوم ({currentDate}):</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddExpanded(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                title="إغلاق نموذج الإضافة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              {/* Type */}
              <div className="sm:col-span-3">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TransactionType)}
                  className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="sale">🛒 مبيعات</option>
                  <option value="maintenance">🔧 دخل صيانة (50%)</option>
                  <option value="balance_hadi">💳 رصيد الهادي (مياس)</option>
                  <option value="balance_qimma">💳 رصيد الرقم (فايز)</option>
                  <option value="sim">📶 شرايح</option>
                  <option value="expense_shop">🏪 خرج المحل</option>
                  <option value="expense_home_mosaab">🏠 بيت مصعب</option>
                  <option value="withdrawal_mosaab">💵 سحب مصعب</option>
                  <option value="mosaab_purchases_fund">📦 مسلم لمصعب (بضاعة)</option>
                  <option value="expense_engineer">👷 صرفة مهندس</option>
                  <option value="withdrawal_engineer">👷 سحب مهندس</option>
                  <option value="expense_worker">👥 صرفة عامل</option>
                  <option value="purchase">📦 مشتريات بضاعة</option>
                  <option value="shop_tools_outflow">🔌 أدوات للمحل</option>
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="البيان (مثال: شاحن سفري أو صيانة A12)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Price / Amount */}
              <div className="sm:col-span-2">
                <input
                  type="number"
                  placeholder="المبلغ (ر.ي)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                  className="w-full text-xs font-mono font-bold px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>

              {/* Cost */}
              <div className="sm:col-span-1">
                <input
                  type="number"
                  placeholder="التكلفة"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                  className="w-full text-xs font-mono px-2 py-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickAdd();
                  }}
                  disabled={!newDescription.trim() && !newPrice}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>حفظ فوري</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
