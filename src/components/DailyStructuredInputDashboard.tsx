import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Save,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Wrench,
  Smartphone,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Copy,
  Check,
  HelpCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ArrowDownRight,
  UserCheck,
  Zap,
  ShoppingCart,
  Truck,
  Wallet,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  ArrowDownToLine,
  RotateCcw,
  Search,
  Edit3,
  Plus,
  X,
} from 'lucide-react';
import { Transaction, InventoryItem, Supplier, Category, TransactionType, ParsedTransactionItem } from '../types';
import {
  StructuredDailyInput,
  StructuredDailyResult,
  parseStructuredDailyEntry,
  distributeRawDayTextToSections,
  reverseTransactionsToStructuredSections,
  ParsedSupplierInvoice,
  ParsedCustodyItem,
} from '../utils/localAccountingParser';
import { formatArabicDateDisplay, getShiftedDate, parseDateFromNaturalText } from '../utils/aiDateHelper';

interface DailyStructuredInputDashboardProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  transactions: Transaction[];
  onSaveDayTransactions: (date: string, items: any[], isOverwrite: boolean) => void;
  onDeleteDayTransactions?: (date: string) => void;
  onDeleteSingleTransaction?: (id: string) => void;
  onEditSingleTransaction?: (tx: Transaction) => void;
  inventory?: InventoryItem[];
  suppliers?: Supplier[];
  onViewDayDetail?: (date: string) => void;
  onShowNotification?: (message: string, type?: 'success' | 'warning' | 'error') => void;
  forceRefreshTrigger?: number;
}

// نموذج تجريبي معتمد ليوم 1 شهر 9 مع مشتريات الموردين وعهدة مصعب
const SAMPLE_DAY_1_SEPTEMBER: StructuredDailyInput = {
  accessoriesText: `طفاية سيارة 700 ف200
لاصق 500 ف 400
وصله lt 3a بيع 750 ف 350
سماعة lt بيع 1500ف 400
سيفر ستار اكس 3200 ف400
أمبيثري 811 بيع 2500 ف 500
شاحن الملك k4 بيع 1000ف 150
وصلة سوبر ليزر 1200ف 300
كشاف 6622 2500 ف 250
سماعة ملون 500 ف300`,
  maintenanceText: `1000 تفعيل فورجي ف1000
500 تعريب ف5000
1000 مفتاح تشغيل ف1000
1500بيت شحن ف1450
6000 شاشة a02 ف2000
6500شاشة j7 ف 2000`,
  phonesText: `0`,
  balanceText: `تطبيق الهادي 18300 ف 1700
حول لي محمد مياس رصيد ب 20000
حولت لمحمد مياس 20000
تفاصيل شراء الرصيد تطبيق الهادي 20000`,
  expensesText: `1200 بيت مصعب
3000 صرفة للمحل`,
  purchasesText: `ق
شاشة a02 ش3500 ب5500
بطارية ردمي ش2000 ب3500
ح 4000
خ
شاشة j7 ش4000 ب6000
فلاتة شحن ش1200 ب2200
ح 3000
ص 15000`,
};

export const DailyStructuredInputDashboard: React.FC<DailyStructuredInputDashboardProps> = ({
  currentDate,
  onDateChange,
  availableDates,
  transactions,
  onSaveDayTransactions,
  onDeleteDayTransactions,
  onDeleteSingleTransaction,
  onEditSingleTransaction,
  inventory = [],
  suppliers = [],
  onViewDayDetail,
  onShowNotification,
  forceRefreshTrigger,
}) => {
  // الحقول النصية للأقسام الستة
  const [sections, setSections] = useState<StructuredDailyInput>({
    accessoriesText: '',
    maintenanceText: '',
    phonesText: '',
    balanceText: '',
    expensesText: '',
    purchasesText: '',
  });

  // حالة فتح نافذة "اللصق الذكي ليومية كاملة"
  const [isRawPasteOpen, setIsRawPasteOpen] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');

  // نتيجة المعالجة والتدقيق الحالية
  const [processedResult, setProcessedResult] = useState<StructuredDailyResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // حالة تعديل وحذف بنود الحركات المجلوبة
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<ParsedTransactionItem | null>(null);
  const [isAddingNewItem, setIsAddingNewItem] = useState<boolean>(false);
  const [newItemDraft, setNewItemDraft] = useState<ParsedTransactionItem>({
    type: 'sale',
    category: 'accessories',
    description: '',
    price: 0,
    profit: 0,
    cost: 0,
    notes: '',
  });

  // التحقق هل اليوم مسجل مسبقاً في قاعدة البيانات
  const existingDayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === currentDate);
  }, [transactions, currentDate]);

  const isDayAlreadyRegistered = existingDayTransactions.length > 0;

  // دالة مساعدة لتحويل ParsedTransactionItem إلى Transaction
  const itemToTransaction = (item: ParsedTransactionItem, index: number, targetDate: string): Transaction => {
    let cat: Category = item.category || 'accessories';
    let txType: TransactionType = item.type || 'sale';
    if (cat === 'maintenance') txType = 'maintenance';
    else if (cat === 'expenses') txType = item.type || 'expense_shop';
    else if (cat === 'purchases') txType = 'purchase';
    else if (cat === 'balance') txType = item.type || 'balance_hadi';

    return {
      id: item.id || `tx_item_${targetDate}_${index}_${Date.now()}`,
      date: targetDate,
      time: item.time || new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      type: txType,
      category: cat,
      description: item.description || 'بند يومي',
      price: Number(item.price) || 0,
      cost: Number(item.cost) || 0,
      profit: Number(item.profit) || 0,
      notes: item.notes || '',
      customerName: item.customerName,
      supplierName: item.supplierName,
      paymentMethod: item.paymentMethod || 'cash',
      remainingAmount: item.remainingAmount,
    };
  };

  // مزامنة الحركات المعدلة مع الأقسام النصية وإعادة الحساب المالي فورياً
  const syncItemsAndReevaluate = (updatedItems: ParsedTransactionItem[]) => {
    const txList = updatedItems.map((it, i) => itemToTransaction(it, i, currentDate));
    const newSections = reverseTransactionsToStructuredSections(txList);
    setSections(newSections);

    try {
      const res = parseStructuredDailyEntry(
        newSections,
        currentDate,
        transactions,
        inventory,
        suppliers
      );
      setProcessedResult(res);
    } catch (e) {
      console.error('Error re-parsing after item change:', e);
    }

    // إذا كان هذا اليوم مسجل مسبقاً في قاعدة البيانات، نقوم بتحديث الحفظ التلقائي فورياً
    if (isDayAlreadyRegistered) {
      onSaveDayTransactions(currentDate, updatedItems, true);
    }
  };

  // بدء تعديل بند محدد
  const handleStartEditItem = (idx: number, item: ParsedTransactionItem) => {
    setEditingItemIndex(idx);
    setEditingDraft({
      ...item,
      price: Number(item.price) || 0,
      profit: Number(item.profit) || 0,
      cost: Number(item.cost) || 0,
    });
  };

  // حفظ تعديل بند
  const handleSaveItemEdit = () => {
    if (editingItemIndex === null || !editingDraft || !processedResult) return;
    const nextItems = [...processedResult.items];
    const updatedDraft = {
      ...editingDraft,
      price: Number(editingDraft.price) || 0,
      cost: Number(editingDraft.cost) || 0,
      profit: Number(editingDraft.profit) || 0,
    };
    nextItems[editingItemIndex] = updatedDraft;
    syncItemsAndReevaluate(nextItems);
    setEditingItemIndex(null);
    setEditingDraft(null);
  };

  // إلغاء تعديل بند
  const handleCancelEdit = () => {
    setEditingItemIndex(null);
    setEditingDraft(null);
  };

  // حذف بند محدد من الحركات المجلوبة
  const handleDeleteItem = (idx: number, item: ParsedTransactionItem) => {
    if (!window.confirm(`هل أنت متأكد من حذف هذا البند: "${item.description || 'الحركة'}"؟`)) {
      return;
    }
    if (!processedResult) return;
    const nextItems = processedResult.items.filter((_, i) => i !== idx);
    syncItemsAndReevaluate(nextItems);
    if (editingItemIndex === idx) {
      setEditingItemIndex(null);
      setEditingDraft(null);
    }
  };

  // إضافة بند جديد
  const handleSaveNewItem = () => {
    if (!newItemDraft.description.trim()) {
      alert('يرجى كتابة بيان أو اسم الصنف.');
      return;
    }
    const currentItems = processedResult?.items || [];
    const itemToAdd: ParsedTransactionItem = {
      ...newItemDraft,
      price: Number(newItemDraft.price) || 0,
      cost: Number(newItemDraft.cost) || 0,
      profit: Number(newItemDraft.profit) || 0,
    };
    const nextItems = [...currentItems, itemToAdd];
    syncItemsAndReevaluate(nextItems);
    setIsAddingNewItem(false);
    setNewItemDraft({
      type: 'sale',
      category: 'accessories',
      description: '',
      price: 0,
      profit: 0,
      cost: 0,
      notes: '',
    });
  };

  // حذف قيود هذا اليوم بالكامل
  const handleDeleteEntireDay = () => {
    if (
      !window.confirm(
        `⚠️ تأكيد الحذف النهائي:\nهل أنت متأكد من حذف كافة قيود وحركات يوم ${currentDate} (${existingDayTransactions.length} حركة) نهائياً من النظام؟\n\nلن تتمكن من استرجاعها بعد التأكيد.`
      )
    ) {
      return;
    }

    if (onDeleteDayTransactions) {
      onDeleteDayTransactions(currentDate);
    }

    setSections({
      accessoriesText: '',
      maintenanceText: '',
      phonesText: '',
      balanceText: '',
      expensesText: '',
      purchasesText: '',
    });
    setProcessedResult(null);
    setEditingItemIndex(null);
    setEditingDraft(null);
  };

  // تحديث حقل محدد
  const handleSectionChange = (field: keyof StructuredDailyInput, value: string) => {
    setSections((prev) => ({ ...prev, [field]: value }));
  };

  // حالة البحث والتنقل السريع بالتواريخ
  const [naturalDateQuery, setNaturalDateQuery] = useState('');
  const [isQuickDateJumpOpen, setIsQuickDateJumpOpen] = useState(false);

  // دالة جلب بيانات اليوم المختار وتوزيع كل شيء في مكانه للتعديل
  const handleLoadDayData = (dateToLoad: string = currentDate) => {
    const txsForDate = transactions.filter((t) => t.date === dateToLoad);
    if (txsForDate.length === 0) {
      setSections({
        accessoriesText: '',
        maintenanceText: '',
        phonesText: '',
        balanceText: '',
        expensesText: '',
        purchasesText: '',
      });
      setProcessedResult(null);
      return;
    }

    const loadedSections = reverseTransactionsToStructuredSections(txsForDate);
    setSections(loadedSections);

    // تشغيل التحليل المباشر لإظهار الجداول والإجماليات فوراً
    try {
      const res = parseStructuredDailyEntry(
        loadedSections,
        dateToLoad,
        transactions,
        inventory,
        suppliers
      );
      setProcessedResult(res);
    } catch (e) {
      console.error('Error auto-evaluating loaded day:', e);
    }
  };

  // جلب وتوزيع بيانات اليوم تلقائياً عند اختيار أو تغيير التاريخ أو طلب الجلب السريع
  useEffect(() => {
    handleLoadDayData(currentDate);
  }, [currentDate, forceRefreshTrigger]);

  const handleJumpToDate = (targetDate: string) => {
    onDateChange(targetDate);
    handleLoadDayData(targetDate);
    setIsQuickDateJumpOpen(false);
    setNaturalDateQuery('');
  };

  const handleNaturalDateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!naturalDateQuery.trim()) return;
    const parsed = parseDateFromNaturalText(naturalDateQuery, currentDate, availableDates);
    if (parsed.targetDate) {
      handleJumpToDate(parsed.targetDate);
    } else {
      onShowNotification?.(`تعذر تحديد التاريخ من "${naturalDateQuery}". جرب كتابة: 6 شهر 8 أو 6/8`, 'warning');
    }
  };

  // تفريغ كافة الحقول
  const handleClearSections = () => {
    if (
      sections.accessoriesText ||
      sections.maintenanceText ||
      sections.phonesText ||
      sections.balanceText ||
      sections.expensesText ||
      sections.purchasesText
    ) {
      if (!window.confirm('هل أنت متأكد من تفريغ كافة حقول الإدخال اليومي؟')) {
        return;
      }
    }
    setSections({
      accessoriesText: '',
      maintenanceText: '',
      phonesText: '',
      balanceText: '',
      expensesText: '',
      purchasesText: '',
    });
    setProcessedResult(null);
  };

  // تحميل نموذج يوم 1 شهر 9 التجريبي
  const handleLoadSample = () => {
    setSections(SAMPLE_DAY_1_SEPTEMBER);
    onDateChange('2024-09-01');
    setProcessedResult(null);
    onShowNotification?.('تم تعبئة نموذج مسودة يوم 1 شهر 9 المعتمد مع المشتريات والعهدة!', 'success');
  };

  // معالجة اللصق الذكي وتوزيع النص
  const handleApplyRawPaste = () => {
    if (!rawPastedText.trim()) return;
    const distributed = distributeRawDayTextToSections(rawPastedText);
    setSections(distributed);
    setIsRawPasteOpen(false);
    setRawPastedText('');
    setProcessedResult(null);
    onShowNotification?.('تم توزيع بنود اليومية تلقائياً وبدقة على الأقسام المعتمدة!', 'success');
  };

  // زر الحفظ والمعالجة الذكي
  const handleProcessAndSave = (onlyPreview = false) => {
    const hasAnyContent =
      sections.accessoriesText.trim() ||
      sections.maintenanceText.trim() ||
      sections.phonesText.trim() ||
      sections.balanceText.trim() ||
      sections.expensesText.trim() ||
      sections.purchasesText.trim();

    if (!hasAnyContent) {
      alert('يرجى كتابة قيود في قسم واحد على الأقل قبل الحفظ والمعالجة.');
      return;
    }

    setIsProcessing(true);

    try {
      // تشغيل محرك التحليل والتدقيق المحلي
      const result = parseStructuredDailyEntry(
        sections,
        currentDate,
        transactions,
        inventory,
        suppliers
      );

      setProcessedResult(result);

      if (result.items.length === 0) {
        alert('لم يتم العثور على أي حركات صالحة للحفظ بعد تصفية الحقول الصفرية.');
        setIsProcessing(false);
        return;
      }

      if (onlyPreview) {
        setIsProcessing(false);
        return;
      }

      // إذا كان اليوم مسجل مسبقاً، نطلب تأكيد الاستبدال (Overwrite)
      if (isDayAlreadyRegistered) {
        const confirmOverwrite = window.confirm(
          `⚠️ تنبيه استبدال القيود (Overwrite):\nيوم ${currentDate} مسجل مسبقاً ويحتوي على (${existingDayTransactions.length}) حركة مقيدة.\n\nهل تريد استبدال وحذف بيانات هذا اليوم القديمة بالكامل، وتثبيت (${result.items.length}) حركة جديدة مكانها لمنع التكرار؟`
        );
        if (!confirmOverwrite) {
          setIsProcessing(false);
          return;
        }
      }

      // اعتماد الحفظ في قاعدة البيانات محلياً وسحابياً عبر App.tsx
      onSaveDayTransactions(currentDate, result.items, isDayAlreadyRegistered);

      const statusMsg = isDayAlreadyRegistered
        ? `✅ تم استبدال وتحديث يوم ${currentDate} بنجاح (${result.items.length} حركة جديدة)!`
        : `✨ تم إنشاء واعتماد يومية جديدة لـ ${currentDate} بنجاح (${result.items.length} حركة)!`;

      onShowNotification?.(statusMsg, 'success');
    } catch (err) {
      console.error('Error processing structured day:', err);
      alert('حدث خطأ أثناء معالجة اليومية. يرجى التحقق من الصيغة والمحاولة مجدداً.');
    } finally {
      setIsProcessing(false);
    }
  };

  // نسخ الملخص المالي للحافظة
  const handleCopySummary = () => {
    if (!processedResult) return;
    navigator.clipboard.writeText(processedResult.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
    onShowNotification?.('تم نسخ التقرير المالي المعتمد للحافظة بنجاح!', 'success');
  };

  return (
    <div id="daily-structured-input-dashboard" className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      {/* 1. شريط التحكم العلوي (Header Controls) */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* حقل اختيار التاريخ والتحكم السريع */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-900 border border-indigo-500/40 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => onDateChange(getShiftedDate(currentDate, 1))}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="اليوم اللاحق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => e.target.value && onDateChange(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs sm:text-sm font-bold focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => onDateChange(getShiftedDate(currentDate, -1))}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="اليوم السابق"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* نص اليوم بالعربي */}
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline-block bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              {formatArabicDateDisplay(currentDate)}
            </span>

            {/* زر جلب معلومات هذا اليوم للتعديل المباشر وكل شيء في مكانه */}
            <button
              type="button"
              onClick={() => handleLoadDayData(currentDate)}
              disabled={!isDayAlreadyRegistered}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                isDayAlreadyRegistered
                  ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-950/60 border border-sky-400/50 active:scale-95'
                  : 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
              title={
                isDayAlreadyRegistered
                  ? `جلب جميع قيود يوم ${currentDate} (${existingDayTransactions.length} حركة) ووضع كل شيء في مكانه لتعديله ثم استبداله`
                  : 'لا توجد حركات مسجلة لهذا التاريخ لكي يتم جلبها'
              }
            >
              <ArrowDownToLine className="w-4 h-4 text-sky-200 shrink-0" />
              <span>جلب بيانات هذا اليوم لتعديلها ({existingDayTransactions.length})</span>
            </button>

            {/* زر حذف قيود وحركات هذا اليوم بالكامل */}
            {isDayAlreadyRegistered && (
              <button
                type="button"
                onClick={handleDeleteEntireDay}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                title={`حذف جميع قيود وحركات يوم ${currentDate} (${existingDayTransactions.length} حركة) نهائياً من النظام`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>حذف حركات هذا اليوم ({existingDayTransactions.length})</span>
              </button>
            )}

            {/* زر البحث والانتقال السريع لتواريخ مسجلة مثل 6 شهر 8 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsQuickDateJumpOpen(!isQuickDateJumpOpen)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="كتابة تاريخ محدد مثل: 6 شهر 8 أو 6/8 للانتقال وجلب بياناته فوراً"
              >
                <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline">انتقال لتاريخ (مثال: 6 شهر 8)...</span>
                <span className="md:hidden">انتقال...</span>
              </button>

              {isQuickDateJumpOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-slate-950 border border-indigo-500/60 rounded-2xl shadow-2xl p-3 z-30 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      الانتقال وجلب بيانات يوم محدد
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsQuickDateJumpOpen(false)}
                      className="text-slate-400 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleNaturalDateSubmit} className="flex items-center gap-1.5 mb-2.5">
                    <input
                      type="text"
                      value={naturalDateQuery}
                      onChange={(e) => setNaturalDateQuery(e.target.value)}
                      placeholder="اكتب مثلاً: 6 شهر 8 أو 6/8"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      انتقال وجلب
                    </button>
                  </form>

                  {availableDates && availableDates.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        أيام مسجلة سابقاً في النظام:
                      </span>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {availableDates.map((dt) => {
                          const count = transactions.filter((t) => t.date === dt).length;
                          return (
                            <button
                              key={dt}
                              type="button"
                              onClick={() => handleJumpToDate(dt)}
                              className="w-full text-right px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span className="font-mono">{dt} ({formatArabicDateDisplay(dt)})</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold">
                                {count} حركة
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* مؤشر حالة اليوم (يوم جديد / يوم مسجل مسبقاً) */}
          <div className="flex items-center gap-2">
            {isDayAlreadyRegistered ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-xs"
                title="هذا اليوم مسجل مسبقاً. الحفظ الجديد سيستبدل بياناته بالكامل لمنع تكرار القيود"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>يوم مسجل مسبقاً ({existingDayTransactions.length} حركة) - استبدال (Overwrite)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>يوم جديد (غير مسجل مسبقاً)</span>
              </div>
            )}

            {/* أدوات سريعة */}
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="تعبئة نموذج مسودة يوم 1 شهر 9 تلقائياً"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">تجربة نموذج 1/9</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRawPasteOpen(!isRawPasteOpen)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="لصق مسودة يومية كاملة وتوزيعها تلقائياً على الأقسام الـ 5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>توزيع ذكي</span>
            </button>

            <button
              type="button"
              onClick={handleClearSections}
              className="p-1.5 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
              title="مسح الحقول"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* نافذة اللصق الذكي الموسعة */}
        {isRawPasteOpen && (
          <div className="mt-3 p-3.5 bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                الصق مسودة اليومية كاملة هنا وسيقوم النظام بتوزيعها آلياً على الأقسام الـ 5 المعتمدة:
              </span>
              <button
                type="button"
                onClick={() => setIsRawPasteOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                إغلاق ✕
              </button>
            </div>
            <textarea
              value={rawPastedText}
              onChange={(e) => setRawPastedText(e.target.value)}
              placeholder={`عمل يوم 1 شهر 9\nاكسوارات\nطفاية سيارة 700 ف200\n...\nعمل الصيانة\n1000 تفعيل فورجي ف1000\n...\nخرج\n1200 بيت مصعب\n3000 صرفة للمحل`}
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={handleApplyRawPaste}
                disabled={!rawPastedText.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>توزيع البنود آلياً على الأقسام</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* تنبيه الإدخال والقواعد الصفرية */}
      <div className="px-3 sm:px-4 pt-3 pb-1">
        <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">
              قواعد الإدخال: (ف) = صافي الربح | (ب) = الإجمالي | (ش) = التكلفة | (خ) = الخرج والمصروفات.
            </span>
          </div>
          <span className="text-[11px] text-amber-300/90 font-medium shrink-0 hidden md:inline">
            💡 الحقول التي لا يوجد فيها حركة تُترك فارغة أو قيمتها (0) ويتجاهلها النظام تلقائياً.
          </span>
        </div>
      </div>

      {/* 2. أقسام الإدخال السريع المقسمة كتابياً (The 5 Sections) */}
      <div className="p-3 sm:p-4 space-y-3.5 flex-1">
        {/* 1. قسم مبيعات الإكسسوارات */}
        <div className="bg-slate-950/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white">1. قسم مبيعات الإكسسوارات</h4>
                <p className="text-[10px] text-slate-400">سماعات، شواحن، كفرات، كشافات، وصلات، لواصق، إلكترونيات</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-800/40">
              {sections.accessoriesText.split('\n').filter((l) => l.trim() && l.trim() !== '0').length} صنف
            </span>
          </div>
          <textarea
            value={sections.accessoriesText}
            onChange={(e) => handleSectionChange('accessoriesText', e.target.value)}
            rows={4}
            placeholder={`اكتب مبيعات الإكسسوارات سطراً بسطر، مثال:\nطفاية سيارة 700 ف200\nلاصق 500 ف 400\nوصله lt 3a بيع 750 ف 350\nسماعة ملون 500 ف300`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
          />
        </div>

        {/* 2. قسم خدمات الصيانة والبرمجة */}
        <div className="bg-slate-950/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white">2. قسم خدمات الصيانة والبرمجة والقطع</h4>
                <p className="text-[10px] text-slate-400">شاشات، بيوت شحن، تعريب، تفعيل فورجي، مفاتيح، قطع وتصليح</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded-md border border-amber-800/40">
              {sections.maintenanceText.split('\n').filter((l) => l.trim() && l.trim() !== '0').length} عملية
            </span>
          </div>
          <textarea
            value={sections.maintenanceText}
            onChange={(e) => handleSectionChange('maintenanceText', e.target.value)}
            rows={3}
            placeholder={`اكتب خدمات الصيانة والبرمجة، مثال:\n1000 تفعيل فورجي ف1000\n500 تعريب ف5000\n1500بيت شحن ف1450\n6000 شاشة a02 ف2000`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed resize-y"
          />
        </div>

        {/* 3. قسم الجوالات */}
        <div className="bg-slate-950/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white">3. قسم الجوالات والأجهزة</h4>
                <p className="text-[10px] text-slate-400">مبيعات أجهزة جديدة أو مستخدمة (اتركه فارغاً أو 0 في حال عدم وجود حركة)</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-sky-300 bg-sky-950 px-2 py-0.5 rounded-md border border-sky-800/40">
              {sections.phonesText.split('\n').filter((l) => l.trim() && l.trim() !== '0').length} جهاز
            </span>
          </div>
          <textarea
            value={sections.phonesText}
            onChange={(e) => handleSectionChange('phonesText', e.target.value)}
            rows={2}
            placeholder={`اكتب عمليات الجوالات إن وجدت (أو اتركها 0)، مثال:\nمبيع جوال ردمي نوت 12 بـ 45000 ف 5000`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 leading-relaxed resize-y"
          />
        </div>

        {/* 4. قسم الرصيد والتحويلات */}
        <div className="bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white">4. قسم الرصيد والتحويلات وتطبيقات السداد</h4>
                <p className="text-[10px] text-slate-400">تطبيق الهادي، القمة، تحويلات مياس، شراء الرصيد وسداد الباقات</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800/40">
              {sections.balanceText.split('\n').filter((l) => l.trim() && l.trim() !== '0').length} حركة
            </span>
          </div>
          <textarea
            value={sections.balanceText}
            onChange={(e) => handleSectionChange('balanceText', e.target.value)}
            rows={3}
            placeholder={`اكتب حركات الرصيد والتحويلات، مثال:\nتطبيق الهادي 18300 ف 1700\nحول لي محمد مياس رصيد ب 20000\nحولت لمحمد مياس 20000\nتفاصيل شراء الرصيد تطبيق الهادي 20000`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed resize-y"
          />
        </div>

        {/* 5. قسم الخرج والمصروفات */}
        <div className="bg-slate-950/90 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white">5. قسم الخرج والمصروفات والمسحوبات اليومية</h4>
                <p className="text-[10px] text-slate-400">صرفة المحل، مسحوبات بيت مصعب، غداء، مصاريف نثرية</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded-md border border-rose-800/40">
              {sections.expensesText.split('\n').filter((l) => l.trim() && l.trim() !== '0').length} بنود
            </span>
          </div>
          <textarea
            value={sections.expensesText}
            onChange={(e) => handleSectionChange('expensesText', e.target.value)}
            rows={2}
            placeholder={`اكتب المصاريف والمسحوبات، مثال:\n1200 بيت مصعب\n3000 صرفة للمحل`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 leading-relaxed resize-y"
          />
        </div>

        {/* 6. قسم المشتريات وقطع الغيار والموردين وعهدة مصعب (رموز ش، ب، ح، ص، م، خ، ق، ع) */}
        <div className="bg-slate-950/90 border border-purple-900/40 hover:border-purple-500/60 rounded-2xl p-3 sm:p-4 transition-all shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/25 text-purple-300 flex items-center justify-center border border-purple-500/30">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                  <span>6. قسم المشتريات وقطع الغيار والموردين والعهدة</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/60">
                    الرموز الذكية: م، خ، ق، ع | ش، ب، ح، ص
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  فواتير قطع الغيار من الموردين (المصنف، خليل، القاسمي، العبصري) + حساب المتبقي للتاجر (ح) + عهدة ومشتريات مصعب (ص)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-purple-300 bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-800/60 font-bold">
                {sections.purchasesText.split('\n').filter((l) => l.trim() && l.trim() !== '0').length} سطر
              </span>
            </div>
          </div>

          {/* شريط الإدخال السريع للرموز وقواعد المشتريات */}
          <div className="mb-2.5 p-2.5 bg-slate-900/95 border border-purple-800/40 rounded-xl space-y-2 text-[11px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-slate-300 font-mono">
                <span className="text-purple-300 font-bold font-sans">رموز الموردين:</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-700">م: المصنف</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-sky-300 font-bold border border-slate-700">خ: خليل الأغبري</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-bold border border-slate-700">ق: القاسمي</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-purple-300 font-bold border border-slate-700">ع: العبصري</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 font-mono">
                <span className="text-purple-300 font-bold font-sans">رموز العمليات:</span>
                <span className="bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded font-bold border border-rose-800/40">ش: شراء</span>
                <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-800/40">ب: بيع</span>
                <span className="bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-800/40">م: مرتجع للمورد (خصم)</span>
                <span className="bg-teal-950/80 text-teal-300 px-2 py-0.5 rounded font-bold border border-teal-800/40">ح: حولت للتاجر</span>
                <span className="bg-sky-950/80 text-sky-300 px-2 py-0.5 rounded font-bold border border-sky-800/40">ص: عهدة مصعب</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[10px]">
              <span className="text-slate-300">
                💡 <strong className="text-white">المرتجع للتاجر (م):</strong> اكتب <strong className="text-amber-300 font-mono">ق م</strong> أو ضع <strong className="text-amber-300 font-mono">م</strong> بجانب الصنف مثل (<strong className="text-amber-300 font-mono">شاشة ش5000 م</strong>) وسيتم خصمها من الفاتورة آلياً!
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const samplePurchases = `ق\nشاشة a02 ش3500 ب5500\nبطارية ردمي ش2000 ب3500\nق م\nشاشة ش5000\nح 4000\nخ\nشاشة j7 ش4000 ب6000\nفلاتة شحن ش1200 ب2200\nح 3000\nص 15000`;
                    handleSectionChange('purchasesText', samplePurchases);
                  }}
                  className="px-2 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[10px] font-bold rounded-lg border border-purple-700/50 transition-colors cursor-pointer"
                >
                  + إدراج مثال عملي (مع مرتجع ق م)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const returnSample = `ق م\nشاشة ش5000\n`;
                    handleSectionChange('purchasesText', sections.purchasesText ? sections.purchasesText + '\n' + returnSample : returnSample);
                  }}
                  className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-800/50 transition-colors cursor-pointer"
                >
                  + إضافة بند مرتجع (ق م شاشة ش5000)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const draftSample = `ق\nشاشة ش٠ب٠\nبطاريةش٠ب٠\nح٠\nخ\nشاشة ش٠ب٠\nفلاتة شحن ش٠ب٠\nح٠\nص٠`;
                    handleSectionChange('purchasesText', draftSample);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  + مسودة صفرية (ق، خ)
                </button>
              </div>
            </div>
          </div>

          <textarea
            value={sections.purchasesText}
            onChange={(e) => handleSectionChange('purchasesText', e.target.value)}
            rows={6}
            placeholder={`اكتب فواتير الموردين والمشتريات والعهدة والمرتجعات، مثال:\nق\nشاشة a02 ش3500 ب5500\nبطارية ردمي ش2000 ب3500\nق م\nشاشة ش5000\nح 4000\nخ\nشاشة j7 ش4000 ب6000\nفلاتة شحن ش1200 ب2200\nح 3000\nص 15000`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 leading-relaxed resize-y"
          />
        </div>

        {/* 3. زر الحفظ والمعالجة الذكي (Save & Process Action) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => handleProcessAndSave(false)}
            disabled={isProcessing}
            className={`w-full sm:flex-1 py-3.5 px-6 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer border active:scale-[0.99] ${
              isDayAlreadyRegistered
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/60 border-amber-400/50'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/60 border-emerald-400/40'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>جاري معالجة وتدقيق وحفظ اليومية...</span>
              </>
            ) : isDayAlreadyRegistered ? (
              <>
                <Save className="w-5 h-5 text-amber-200" />
                <span>⚡ حفظ واستبدال بيانات اليوم بالكامل ({existingDayTransactions.length} حركة مسجلة) - بدلها وليس التكرار</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 text-emerald-200" />
                <span>⚡ حفظ واعتماد اليومية ومعالجة الرموز والجداول الذكية</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleProcessAndSave(true)}
            disabled={isProcessing}
            className="w-full sm:w-auto py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>معاينة وتدقيق فقط</span>
          </button>

          {isDayAlreadyRegistered && onViewDayDetail && (
            <button
              type="button"
              onClick={() => onViewDayDetail(currentDate)}
              className="w-full sm:w-auto py-3.5 px-4 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-bold text-xs rounded-2xl border border-indigo-800/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>عرض سجل اليوم</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* عرض ملخص المعالجة والتدقيق الذكي والجداول المعتمدة عند توفره */}
        {processedResult && (
          <div className="mt-4 bg-slate-950 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 animate-in fade-in">
            {/* رأس التقرير */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-white">
                    التقرير المالي والتدقيق المعتمد ليوم {processedResult.date}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    تم استخراج {processedResult.items.length} حركة محاسبية مطابقة
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'تم النسخ!' : 'نسخ التقرير'}</span>
              </button>
            </div>

            {/* بطاقات الإجماليات المالية الموسعة */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">إجمالي المبيعات (ب)</span>
                <span className="text-sm sm:text-base font-black text-white font-mono">
                  {processedResult.totals.revenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 mr-1">ر.ي</span>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-emerald-400 block mb-0.5 font-medium">صافي الأرباح (ف)</span>
                <span className="text-sm sm:text-base font-black text-emerald-300 font-mono">
                  {processedResult.totals.profit.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-500 mr-1">ر.ي</span>
              </div>

              <div className="bg-purple-950/40 border border-purple-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-purple-400 block mb-0.5 font-medium">فواتير قطع الغيار (ش)</span>
                <span className="text-sm sm:text-base font-black text-purple-300 font-mono">
                  {processedResult.totals.purchasesTotal.toLocaleString()}
                </span>
                <span className="text-[10px] text-purple-500 mr-1">ر.ي</span>
              </div>

              <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-rose-400 block mb-0.5 font-medium">المصروفات والخرج (خ)</span>
                <span className="text-sm sm:text-base font-black text-rose-300 font-mono">
                  {processedResult.totals.expenses.toLocaleString()}
                </span>
                <span className="text-[10px] text-rose-500 mr-1">ر.ي</span>
              </div>

              <div className="bg-teal-950/40 border border-teal-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-teal-400 block mb-0.5 font-medium">المحول للتجار (ح)</span>
                <span className="text-sm sm:text-base font-black text-teal-300 font-mono">
                  {processedResult.totals.transferredToSuppliers.toLocaleString()}
                </span>
                <span className="text-[10px] text-teal-500 mr-1">ر.ي</span>
              </div>

              <div className={`p-3 rounded-xl border ${
                processedResult.totals.remainingSupplierDebts > 0
                  ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300'
              }`}>
                <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">باقي للموردين في الذمة</span>
                <span className="text-sm sm:text-base font-black font-mono">
                  {processedResult.totals.remainingSupplierDebts.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 mr-1">ر.ي</span>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-amber-400 block mb-0.5 font-medium">مسحوبات بيت مصعب</span>
                <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
                  {processedResult.totals.mosaabWithdrawals.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-500 mr-1">ر.ي</span>
              </div>

              <div className="bg-sky-950/40 border border-sky-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-sky-400 block mb-0.5 font-medium">عهدة مصعب الصوفي (ص)</span>
                <span className="text-sm sm:text-base font-black text-sky-300 font-mono">
                  {processedResult.totals.mosaabCustodyTotal.toLocaleString()}
                </span>
                <span className="text-[10px] text-sky-500 mr-1">ر.ي</span>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-xl col-span-2">
                <span className="text-[10px] text-emerald-400 block mb-0.5 font-medium">صافي النقدية المتبقية</span>
                <span className="text-base sm:text-lg font-black text-emerald-200 font-mono">
                  {processedResult.totals.netCash.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-400 mr-1">ر.ي</span>
              </div>
            </div>

            {/* تنبيهات التدقيق الذكي */}
            {processedResult.auditAlerts.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 space-y-1.5">
                <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>تنبيهات وتصحيحات التدقيق المحاسبي الذكي:</span>
                </h5>
                <ul className="text-xs text-amber-200/90 space-y-1 pr-4 list-disc font-medium">
                  {processedResult.auditAlerts.map((alertText, idx) => (
                    <li key={idx}>{alertText}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* جداول فواتير الموردين وقطع الغيار المعتمدة (اعمل لها جداول) */}
            {processedResult.supplierInvoices && processedResult.supplierInvoices.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-400" />
                    <span>فواتير مشتريات قطع الغيار وحسابات الموردين (المصنف، خليل الأغبري، القاسمي، العبصري)</span>
                  </h5>
                  <span className="text-[11px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                    {processedResult.supplierInvoices.length} فواتير موردين
                  </span>
                </div>

                <div className="space-y-4">
                  {processedResult.supplierInvoices.map((inv, sIdx) => {
                    return (
                      <div
                        key={sIdx}
                        className="bg-slate-900 border border-purple-900/50 rounded-2xl overflow-hidden shadow-lg"
                      >
                        {/* ترويسة فاتورة المورد مع حساب الباقي له */}
                        <div className="bg-slate-950 p-3 sm:p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-300 font-black flex items-center justify-center border border-purple-500/40 text-sm">
                              {inv.supplierCode}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h6 className="font-black text-sm text-white">{inv.supplierName}</h6>
                                <span className="text-[10px] text-slate-400 font-mono">({inv.supplierCode})</span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {inv.items.length} أصناف | إجمالي المشتريات: {inv.totalInvoiceCost.toLocaleString()} ر.ي
                                {inv.totalReturnsCost && inv.totalReturnsCost > 0 ? (
                                  <span className="text-amber-300 mr-2">
                                    | مرتجع للمورد (م): -{inv.totalReturnsCost.toLocaleString()} ر.ي | صافي: {inv.netInvoiceCost.toLocaleString()} ر.ي
                                  </span>
                                ) : null}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {inv.remainingAmount > 0 ? (
                              <div className="px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>باقي له في الذمة: <strong className="font-mono">{inv.remainingAmount.toLocaleString()}</strong> ر.ي</span>
                              </div>
                            ) : inv.remainingAmount < 0 ? (
                              <div className="px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>مستحق استرداد من التاجر (فائض مرتجع): <strong className="font-mono">{Math.abs(inv.remainingAmount).toLocaleString()}</strong> ر.ي</span>
                              </div>
                            ) : (inv.totalInvoiceCost > 0 || (inv.netInvoiceCost && inv.netInvoiceCost > 0)) && inv.transferredAmount >= (inv.netInvoiceCost ?? inv.totalInvoiceCost) ? (
                              <div className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>خالص الحساب بالكامل ✅</span>
                              </div>
                            ) : (
                              <div className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                                <span>مسودة فاتورة</span>
                              </div>
                            )}

                            <div className="px-2.5 py-1 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-mono font-bold">
                              المحول له (ح): {inv.transferredAmount.toLocaleString()} ر.ي
                            </div>
                          </div>
                        </div>

                        {/* جدول أصناف فاتورة المورد (ش، ب، ف) */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/70 text-slate-400 font-bold border-b border-slate-800">
                              <tr>
                                <th className="p-2.5 text-center">#</th>
                                <th className="p-2.5">اسم القطعة / الصنف</th>
                                <th className="p-2.5 text-center">سعر الشراء والتكلفة (ش)</th>
                                <th className="p-2.5 text-center">سعر البيع المقترح في المحل (ب)</th>
                                <th className="p-2.5 text-center">الربح المتوقع (ف = ب - ش)</th>
                                <th className="p-2.5 text-center">هامش الربح</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 font-mono">
                              {inv.items.map((it, iIdx) => {
                                const marginPercent = it.costPrice > 0 ? Math.round((it.expectedProfit / it.costPrice) * 100) : 0;
                                return (
                                  <tr key={iIdx} className={`hover:bg-slate-800/50 transition-colors ${it.isReturn ? 'bg-amber-950/20' : ''}`}>
                                    <td className="p-2.5 text-center text-slate-500 font-sans">{iIdx + 1}</td>
                                    <td className="p-2.5 font-sans font-medium text-slate-200 flex items-center gap-1.5">
                                      {it.isReturn && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                          مرتجع (م)
                                        </span>
                                      )}
                                      <span>{it.name}</span>
                                    </td>
                                    <td className="p-2.5 text-center font-bold">
                                      {it.isReturn ? (
                                        <span className="text-amber-300 font-mono">
                                          -{it.costPrice ? it.costPrice.toLocaleString() : '0'} ر.ي
                                        </span>
                                      ) : (
                                        <span className="text-rose-300 font-mono">
                                          {it.costPrice ? `${it.costPrice.toLocaleString()} ر.ي` : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center font-bold text-emerald-300">
                                      {it.sellingPrice ? `${it.sellingPrice.toLocaleString()} ر.ي` : '-'}
                                    </td>
                                    <td className="p-2.5 text-center font-bold text-amber-300">
                                      {it.expectedProfit ? `+${it.expectedProfit.toLocaleString()} ر.ي` : '0'}
                                    </td>
                                    <td className="p-2.5 text-center text-slate-400 font-sans">
                                      {marginPercent > 0 ? `${marginPercent}%` : '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-950 font-bold text-xs border-t border-slate-800">
                              <tr>
                                <td colSpan={2} className="p-2.5 text-slate-300 font-sans">
                                  إجمالي فاتورة ({inv.supplierName}):
                                </td>
                                <td className="p-2.5 text-center font-mono text-rose-300">
                                  {inv.totalReturnsCost && inv.totalReturnsCost > 0 ? (
                                    <div className="space-y-0.5">
                                      <div className="text-rose-300">شراء: {inv.totalInvoiceCost.toLocaleString()} ر.ي</div>
                                      <div className="text-amber-400 text-[10px]">مرتجع: -{inv.totalReturnsCost.toLocaleString()} ر.ي</div>
                                      <div className="text-white border-t border-slate-700 pt-0.5">صافي: {inv.netInvoiceCost.toLocaleString()} ر.ي</div>
                                    </div>
                                  ) : (
                                    `${inv.totalInvoiceCost.toLocaleString()} ر.ي`
                                  )}
                                </td>
                                <td className="p-2.5 text-center font-mono text-emerald-300">
                                  {inv.totalSellingValue.toLocaleString()} ر.ي
                                </td>
                                <td className="p-2.5 text-center font-mono text-amber-300">
                                  +{inv.totalExpectedProfit.toLocaleString()} ر.ي
                                </td>
                                <td className="p-2.5 text-center text-slate-400 font-sans">
                                  {inv.totalInvoiceCost > 0 ? `${Math.round((inv.totalExpectedProfit / inv.totalInvoiceCost) * 100)}%` : '-'}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* ملخص الحساب الصافي للمورد */}
                        <div className="bg-slate-950/90 p-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs">
                          <div className="flex flex-wrap items-center gap-3 text-slate-300">
                            <span>صافي الفاتورة: <strong className="text-white font-mono">{inv.netInvoiceCost.toLocaleString()}</strong> ر.ي</span>
                            <span>-</span>
                            <span>المسدد والمحول (ح): <strong className="text-teal-300 font-mono">{inv.transferredAmount.toLocaleString()}</strong> ر.ي</span>
                          </div>
                          <div>
                            {inv.remainingAmount > 0 ? (
                              <span className="text-rose-400 font-bold">
                                📌 باقي للتاجر {inv.supplierName} في ذمة المحل: <strong className="text-rose-200 font-mono text-sm">{inv.remainingAmount.toLocaleString()} ر.ي</strong>
                              </span>
                            ) : inv.remainingAmount < 0 ? (
                              <span className="text-amber-400 font-bold">
                                📌 مستحق استرداد من التاجر {inv.supplierName}: <strong className="text-amber-200 font-mono text-sm">{Math.abs(inv.remainingAmount).toLocaleString()} ر.ي</strong>
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold">
                                ✅ الحساب خالص ولا توجد مبالغ متبقية للتاجر
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* جدول عهدة مصعب الصوفي (ص) المعتمد (اعمل لها جداول) */}
            {processedResult.custodyItems && processedResult.custodyItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-sky-400" />
                    <span>جدول عهدة ومشتريات مصعب الصوفي (ص)</span>
                  </h5>
                  <span className="text-[11px] text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-800 font-mono font-bold">
                    إجمالي العهدة: {processedResult.totals.mosaabCustodyTotal.toLocaleString()} ر.ي
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-sky-900/40 bg-slate-900">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5 text-center">#</th>
                        <th className="p-2.5">الرمز</th>
                        <th className="p-2.5">المستلم للعهدة</th>
                        <th className="p-2.5 text-center">المبلغ المسلم عهدة (ص)</th>
                        <th className="p-2.5">الغرض والبيان المحاسبي</th>
                        <th className="p-2.5">الأثر المالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {processedResult.custodyItems.map((cItem, cIdx) => (
                        <tr key={cIdx} className="hover:bg-slate-800/60 transition-colors">
                          <td className="p-2.5 text-center text-slate-500 font-sans">{cIdx + 1}</td>
                          <td className="p-2.5 font-bold text-sky-300">ص</td>
                          <td className="p-2.5 font-sans font-bold text-white">{cItem.recipient}</td>
                          <td className="p-2.5 text-center font-bold text-sky-300">
                            {cItem.amount ? `${cItem.amount.toLocaleString()} ر.ي` : '0 ر.ي (مسودة)'}
                          </td>
                          <td className="p-2.5 font-sans text-slate-300">{cItem.purpose}</td>
                          <td className="p-2.5 font-sans text-[11px] text-slate-400">
                            يُقيد كعهدة مشتريات نقدية مسلمة لمصعب
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* جدول تفاصيل الحركات اليومية الكاملة مع إمكانية التعديل والحذف المباشر */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h5 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>سجل القيود المحاسبية المستخرجة والمعتمدة ({processedResult.items.length} حركة)</span>
                </h5>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewItem(!isAddingNewItem)}
                    className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="إضافة حركة أو قيد يدوي جديد لهذا اليوم"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة قيد جديد</span>
                  </button>
                  {onViewDayDetail && (
                    <button
                      type="button"
                      onClick={() => onViewDayDetail(currentDate)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      title="فتح المحرر التفصيلي للتحكم بالبطاقات"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>المحرر التفصيلي</span>
                    </button>
                  )}
                </div>
              </div>

              {/* لوحة إضافة قيد جديد */}
              {isAddingNewItem && (
                <div className="p-3 bg-slate-950 border border-emerald-500/50 rounded-2xl shadow-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      إضافة حركة جديدة ليوم {currentDate}:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewItem(false)}
                      className="text-slate-400 hover:text-white text-xs px-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">القسم:</label>
                      <select
                        value={newItemDraft.category}
                        onChange={(e) => {
                          const cat = e.target.value as Category;
                          let tType: TransactionType = 'sale';
                          if (cat === 'maintenance') tType = 'maintenance';
                          else if (cat === 'expenses') tType = 'expense_shop';
                          else if (cat === 'purchases') tType = 'purchase';
                          else if (cat === 'balance') tType = 'balance_hadi';
                          setNewItemDraft((prev) => ({ ...prev, category: cat, type: tType }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="accessories">إكسسوارات</option>
                        <option value="maintenance">صيانة</option>
                        <option value="phones">جوالات</option>
                        <option value="balance">رصيد</option>
                        <option value="expenses">مصاريف</option>
                        <option value="purchases">مشتريات</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">البيان / الصنف:</label>
                      <input
                        type="text"
                        value={newItemDraft.description}
                        onChange={(e) => setNewItemDraft((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="مثال: شاشة سامسونج أو لاصق حماية"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">سعر البيع (ب):</label>
                      <input
                        type="number"
                        value={newItemDraft.price || ''}
                        onChange={(e) => {
                          const p = Number(e.target.value) || 0;
                          const prof = Number(newItemDraft.profit) || 0;
                          setNewItemDraft((prev) => ({
                            ...prev,
                            price: p,
                            cost: Math.max(0, p - prof),
                          }));
                        }}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">الربح (ف):</label>
                      <input
                        type="number"
                        value={newItemDraft.profit || ''}
                        onChange={(e) => {
                          const prof = Number(e.target.value) || 0;
                          const p = Number(newItemDraft.price) || 0;
                          setNewItemDraft((prev) => ({
                            ...prev,
                            profit: prof,
                            cost: Math.max(0, p - prof),
                          }));
                        }}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">التكلفة (ش):</label>
                      <input
                        type="number"
                        value={newItemDraft.cost || ''}
                        onChange={(e) => setNewItemDraft((prev) => ({ ...prev, cost: Number(e.target.value) || 0 }))}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500 text-center"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="text"
                      value={newItemDraft.notes || ''}
                      onChange={(e) => setNewItemDraft((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات إضافية (اختياري)..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 ml-2"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleSaveNewItem}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        حفظ وإضافة ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewItem(false)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">القسم</th>
                      <th className="p-2.5">البيان والتفاصيل</th>
                      <th className="p-2.5 text-center">المبلغ الإجمالي (ب)</th>
                      <th className="p-2.5 text-center">صافي الربح (ف)</th>
                      <th className="p-2.5 text-center">التكلفة (ش)</th>
                      <th className="p-2.5">ملاحظات</th>
                      <th className="p-2.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {processedResult.items.map((item, idx) => {
                      const isExpense = item.category === 'expenses';
                      const isPurchase = item.type === 'purchase';
                      const isTransfer = item.type?.startsWith('transfer_');
                      const isCustody = item.type === 'mosaab_purchases_fund';
                      const isEditingThis = editingItemIndex === idx && editingDraft !== null;

                      if (isEditingThis) {
                        return (
                          <tr key={idx} className="bg-indigo-950/40 border-2 border-indigo-500/80">
                            <td className="p-2 text-center text-indigo-300 font-sans font-bold">{idx + 1}</td>
                            <td className="p-1.5">
                              <select
                                value={editingDraft.category}
                                onChange={(e) => {
                                  const cat = e.target.value as Category;
                                  let tType: TransactionType = 'sale';
                                  if (cat === 'maintenance') tType = 'maintenance';
                                  else if (cat === 'expenses') tType = 'expense_shop';
                                  else if (cat === 'purchases') tType = 'purchase';
                                  else if (cat === 'balance') tType = 'balance_hadi';
                                  setEditingDraft((prev) => prev ? { ...prev, category: cat, type: tType } : null);
                                }}
                                className="bg-slate-900 border border-indigo-500 rounded p-1 text-xs text-white"
                              >
                                <option value="accessories">إكسسوارات</option>
                                <option value="maintenance">صيانة</option>
                                <option value="phones">جوالات</option>
                                <option value="balance">رصيد</option>
                                <option value="expenses">مصاريف</option>
                                <option value="purchases">مشتريات</option>
                              </select>
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={editingDraft.description}
                                onChange={(e) => setEditingDraft((prev) => prev ? { ...prev, description: e.target.value } : null)}
                                className="w-full bg-slate-900 border border-indigo-500 rounded p-1 text-xs text-white"
                              />
                            </td>
                            <td className="p-1.5 text-center">
                              <input
                                type="number"
                                value={editingDraft.price || ''}
                                onChange={(e) => {
                                  const p = Number(e.target.value) || 0;
                                  const prof = Number(editingDraft.profit) || 0;
                                  setEditingDraft((prev) => prev ? { ...prev, price: p, cost: Math.max(0, p - prof) } : null);
                                }}
                                className="w-20 bg-slate-900 border border-indigo-500 rounded p-1 text-xs text-white text-center font-mono"
                              />
                            </td>
                            <td className="p-1.5 text-center">
                              <input
                                type="number"
                                value={editingDraft.profit || ''}
                                onChange={(e) => {
                                  const prof = Number(e.target.value) || 0;
                                  const p = Number(editingDraft.price) || 0;
                                  setEditingDraft((prev) => prev ? { ...prev, profit: prof, cost: Math.max(0, p - prof) } : null);
                                }}
                                className="w-20 bg-slate-900 border border-indigo-500 rounded p-1 text-xs text-emerald-400 text-center font-mono"
                              />
                            </td>
                            <td className="p-1.5 text-center">
                              <input
                                type="number"
                                value={editingDraft.cost || ''}
                                onChange={(e) => setEditingDraft((prev) => prev ? { ...prev, cost: Number(e.target.value) || 0 } : null)}
                                className="w-20 bg-slate-900 border border-indigo-500 rounded p-1 text-xs text-slate-300 text-center font-mono"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={editingDraft.notes || ''}
                                onChange={(e) => setEditingDraft((prev) => prev ? { ...prev, notes: e.target.value } : null)}
                                className="w-full bg-slate-900 border border-indigo-500 rounded p-1 text-xs text-slate-300"
                              />
                            </td>
                            <td className="p-1.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={handleSaveItemEdit}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                                  title="حفظ التعديل"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="إلغاء التعديل"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors group">
                          <td className="p-2 text-slate-500 font-sans">{idx + 1}</td>
                          <td className="p-2 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPurchase
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                                  : isTransfer
                                  ? 'bg-teal-950 text-teal-300 border border-teal-800/50'
                                  : isCustody
                                  ? 'bg-sky-950 text-sky-300 border border-sky-800/50'
                                  : item.category === 'accessories'
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                                  : item.category === 'maintenance'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                                  : item.category === 'phones'
                                  ? 'bg-sky-950 text-sky-300 border border-sky-800/50'
                                  : item.category === 'expenses'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              }`}
                            >
                              {isPurchase
                                ? 'مشتريات'
                                : isTransfer
                                ? 'حوالة مورد'
                                : isCustody
                                ? 'عهدة مصعب'
                                : item.category === 'accessories'
                                ? 'إكسسوارات'
                                : item.category === 'maintenance'
                                ? 'صيانة'
                                : item.category === 'phones'
                                ? 'جوالات'
                                : item.category === 'expenses'
                                ? 'مصاريف'
                                : 'رصيد'}
                            </span>
                          </td>
                          <td className="p-2 text-slate-200 font-sans font-medium">{item.description}</td>
                          <td className="p-2 text-center font-bold text-white">
                            {item.price ? `${item.price.toLocaleString()} ر.ي` : '-'}
                          </td>
                          <td className="p-2 text-center font-bold text-emerald-400">
                            {item.profit ? `${item.profit.toLocaleString()} ر.ي` : isExpense ? '-' : '0'}
                          </td>
                          <td className="p-2 text-center text-slate-400">
                            {item.cost ? `${item.cost.toLocaleString()} ر.ي` : '-'}
                          </td>
                          <td className="p-2 text-[11px] font-sans text-slate-400 max-w-xs truncate">
                            {item.notes || '-'}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditItem(idx, item)}
                                className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-sky-950/80 rounded-lg transition-colors cursor-pointer"
                                title="تعديل هذا البند"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(idx, item)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/80 rounded-lg transition-colors cursor-pointer"
                                title="حذف هذا البند"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
