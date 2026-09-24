import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  Wrench,
  Signal,
  CreditCard,
  TrendingDown,
  Truck,
  UserCheck,
  Upload,
  Image as ImageIcon,
  Calculator,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Tag,
  Search,
  BookOpen,
} from 'lucide-react';
import { Transaction, TransactionType, Category, Supplier } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import {
  searchPriceMemory,
  findBestMatchPrice,
  learnOrUpdatePriceMemory,
  calculateBalanceValues,
  loadPriceMemory,
  normalizeArabic,
} from '../utils/priceMemoryStorage';
import { PriceMemoryItem, PriceCategory } from '../types/pricing';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  initialTransaction?: Transaction | null;
  suppliers: Supplier[];
  currentDate: string;
  defaultType?: TransactionType;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  suppliers,
  currentDate,
  defaultType = 'sale',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [date, setDate] = useState<string>(currentDate);
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString('ar-YE', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number | ''>('');
  const [cost, setCost] = useState<number | ''>('');
  const [profit, setProfit] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'debt'>('cash');

  // Auto-complete suggestions state
  const [suggestions, setSuggestions] = useState<PriceMemoryItem[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isQuickGuideOpen, setIsQuickGuideOpen] = useState(false);
  const [selectedDamarItem, setSelectedDamarItem] = useState<PriceMemoryItem | null>(null);

  // Specific for Mosaab delivered purchase fund
  const [mosaabDelivered, setMosaabDelivered] = useState<number | ''>('');
  const [mosaabPurchased, setMosaabPurchased] = useState<number | ''>('');

  const descriptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || '');
      setDescription(initialTransaction.description);
      setPrice(initialTransaction.price !== undefined ? initialTransaction.price : (initialTransaction.amount || ''));
      setCost(initialTransaction.cost !== undefined ? initialTransaction.cost : '');
      setProfit(initialTransaction.profit !== undefined ? initialTransaction.profit : '');
      setSupplierId(initialTransaction.supplierId || '');
      setSupplierName(initialTransaction.supplierName || '');
      setNotes(initialTransaction.notes || '');
      setAttachmentUrl(initialTransaction.attachmentUrl || '');
      setPaymentMethod((initialTransaction.paymentMethod as 'cash' | 'transfer' | 'debt') || 'cash');
      setMosaabDelivered(initialTransaction.mosaabDeliveredAmount || '');
      setMosaabPurchased(initialTransaction.mosaabPurchasedAmount || '');
    } else {
      setType(defaultType);
      setDate(currentDate);
      setTime(
        new Date().toLocaleTimeString('ar-YE', { hour12: false, hour: '2-digit', minute: '2-digit' })
      );
      setDescription('');
      setPrice('');
      setCost('');
      setProfit('');
      setSupplierId('');
      setSupplierName('');
      setNotes('');
      setAttachmentUrl('');
      setPaymentMethod('cash');
      setMosaabDelivered('');
      setMosaabPurchased('');
    }
    setSelectedDamarItem(null);
    setSuggestions([]);
    setIsSuggestionsOpen(false);
  }, [initialTransaction, isOpen, defaultType, currentDate]);

  // Handle auto-complete search when description changes
  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (val.trim().length > 0) {
      let catFilter: PriceCategory | undefined = undefined;
      if (type === 'sale') catFilter = 'accessories';
      else if (type === 'maintenance') catFilter = 'screens';
      else if (type === 'balance_hadi' || type === 'balance_qimma') catFilter = 'balance';

      const results = searchPriceMemory(val, catFilter, 8);
      setSuggestions(results);
      setIsSuggestionsOpen(results.length > 0);

      // If user typed exact match
      const exactMatch = results.find(
        (r) => normalizeArabic(r.name) === normalizeArabic(val.trim())
      );
      if (exactMatch && (!cost || Number(cost) === 0)) {
        setCost(exactMatch.costPrice);
        if (!price || Number(price) === 0) {
          setPrice(exactMatch.sellingPrice);
          setProfit(exactMatch.profit);
        }
        setSelectedDamarItem(exactMatch);
      }
    } else {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      setSelectedDamarItem(null);
    }
  };

  // On blur: auto fill cost and price from memory if not already filled
  const handleDescriptionBlur = () => {
    setTimeout(() => {
      setIsSuggestionsOpen(false);
      if (description.trim() && (!cost || Number(cost) === 0)) {
        const best = findBestMatchPrice(description.trim());
        if (best) {
          setCost(best.costPrice);
          if (!price || Number(price) === 0) {
            setPrice(best.sellingPrice);
            setProfit(best.profit);
          } else if (typeof price === 'number') {
            setProfit(Math.max(0, price - best.costPrice));
          }
          setSelectedDamarItem(best);

          // Auto match supplier if available
          if (!supplierId && best.supplierName) {
            const matchedSup = suppliers.find(
              (s) => s.name.includes(best.supplierName!) || (best.supplierName && best.supplierName.includes(s.name))
            );
            if (matchedSup) {
              setSupplierId(matchedSup.id);
              setSupplierName(matchedSup.name);
            }
          }
        }
      }
    }, 200);
  };

  // Select item from price memory / damar
  const handleSelectPriceItem = (item: PriceMemoryItem) => {
    setDescription(item.name);
    setCost(item.costPrice);
    setPrice(item.sellingPrice);
    setProfit(item.profit);
    setSelectedDamarItem(item);
    setIsSuggestionsOpen(false);
    setIsQuickGuideOpen(false);

    // Auto assign type if appropriate
    if (item.category === 'screens' || item.category === 'spare_parts') {
      setType('maintenance');
    } else if (item.category === 'accessories') {
      setType('sale');
    } else if (item.category === 'balance') {
      setType('balance_hadi');
    }

    // Match supplier if not already set
    if (!supplierId && item.supplierName) {
      const matched = suppliers.find(
        (s) => s.name.includes(item.supplierName!) || (item.supplierName && item.supplierName.includes(s.name))
      );
      if (matched) {
        setSupplierId(matched.id);
        setSupplierName(matched.name);
      }
    }
  };

  // Auto calculate profit or cost when price changes
  const handlePriceChange = (val: number | '') => {
    setPrice(val);
    if (typeof val === 'number') {
      if (type === 'balance_hadi' || type === 'balance_qimma') {
        // Automatic 7% balance profit calculation (700 per 10,000)
        const balanceCalc = calculateBalanceValues(val);
        setProfit(balanceCalc.profit);
        setCost(balanceCalc.cost);
      } else {
        const numCost = typeof cost === 'number' ? cost : 0;
        setProfit(Math.max(0, val - numCost));
      }
    }
  };

  const handleCostChange = (val: number | '') => {
    setCost(val);
    if (typeof price === 'number') {
      const numCost = typeof val === 'number' ? val : 0;
      setProfit(Math.max(0, price - numCost));
    }
  };

  const handleProfitChange = (val: number | '') => {
    setProfit(val);
    if (typeof price === 'number' && typeof val === 'number') {
      setCost(Math.max(0, price - val));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSupplierSelect = (id: string) => {
    setSupplierId(id);
    const sup = suppliers.find((s) => s.id === id);
    if (sup) {
      setSupplierName(sup.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let category: Category = 'expenses';
    if (type === 'sale') category = description.includes('جوال') || description.includes('تلفون') || description.includes('هاتف') ? 'phones' : 'accessories';
    else if (type === 'maintenance') category = 'maintenance';
    else if (type === 'balance_hadi' || type === 'balance_qimma') category = 'balance';
    else if (type === 'sim') category = 'sims';
    else if (type === 'purchase') category = 'purchases';
    else if (type.includes('mosaab')) category = 'mosaab';
    else if (type.includes('engineer')) category = 'engineer';
    else if (type.includes('worker')) category = 'worker';
    else if (type === 'damaged') category = 'damaged';

    const numPrice = Number(price) || 0;
    const numCost = Number(cost) || 0;
    const numProfit = Number(profit) || 0;

    let mosaabRemaining: number | undefined = undefined;
    if (type === 'mosaab_purchases_fund') {
      const del = Number(mosaabDelivered) || numPrice;
      const pur = Number(mosaabPurchased) || 0;
      mosaabRemaining = Math.max(0, del - pur);
    }

    // Auto-learning: Store cost & price in offline Price Memory catalog
    if (description.trim() && (numCost > 0 || numPrice > 0)) {
      try {
        let priceCat: PriceCategory = 'accessories';
        if (category === 'maintenance') priceCat = 'screens';
        else if (category === 'balance') priceCat = 'balance';
        else if (category === 'sims') priceCat = 'accessories';
        else if (category === 'phones') priceCat = 'phones';

        if (description.includes('برمجة') || description.includes('تخطي') || description.includes('فورمات') || description.includes('فك قفل')) {
          priceCat = 'software';
        } else if (description.includes('شاشة') || description.includes('شاشه')) {
          priceCat = 'screens';
        } else if (description.includes('كونكتر') || description.includes('كاميرا') || description.includes('سماعة داخلية') || description.includes('مايك') || description.includes('بطارية')) {
          priceCat = 'spare_parts';
        }

        learnOrUpdatePriceMemory(
          description.trim(),
          numCost,
          numPrice,
          priceCat,
          supplierName || undefined,
          notes.trim() || undefined
        );
      } catch (err) {
        console.error('Failed to auto-learn price memory:', err);
      }
    }

    const tx: Transaction = {
      id: initialTransaction ? initialTransaction.id : `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date,
      time: time || '12:00',
      type,
      category,
      description: description.trim() || 'حركة مسجلة',
      price: numPrice,
      cost: numCost,
      profit: numProfit,
      supplierId: supplierId || undefined,
      supplierName: supplierName || undefined,
      notes: notes.trim() || undefined,
      attachmentUrl: attachmentUrl || undefined,
      paymentMethod,
      mosaabDeliveredAmount: typeof mosaabDelivered === 'number' ? mosaabDelivered : undefined,
      mosaabPurchasedAmount: typeof mosaabPurchased === 'number' ? mosaabPurchased : undefined,
      mosaabRemainingAmount: mosaabRemaining,
    };

    onSave(tx);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
              <span>{initialTransaction ? 'تعديل سند / حركة' : 'إضافة سند وقيد جديد'}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-normal">
                <Sparkles className="w-3 h-3" />
                <span>الذاكرة الدائمة وتعبئة الضمار التلقائي</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              اختر نوع الحركة وادخل المبلغ والتكلفة والربح وملاحظات التوثيق
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Type Selector Buttons Grid */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 mb-2">اختر نوع العملية:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { id: 'sale', label: 'بيع جوال / قطع', icon: <Smartphone className="w-3.5 h-3.5" />, color: 'hover:border-blue-500' },
              { id: 'maintenance', label: 'صيانة (50/50)', icon: <Wrench className="w-3.5 h-3.5" />, color: 'hover:border-purple-500' },
              { id: 'balance_hadi', label: 'رصيد الهادي (7%)', icon: <Signal className="w-3.5 h-3.5" />, color: 'hover:border-teal-500' },
              { id: 'balance_qimma', label: 'رصيد الرقم (فايز)', icon: <Signal className="w-3.5 h-3.5" />, color: 'hover:border-teal-500' },
              { id: 'sim', label: 'بيع / شراء شرائح', icon: <CreditCard className="w-3.5 h-3.5" />, color: 'hover:border-indigo-500' },
              { id: 'purchase', label: 'مشتريات قطع غيار', icon: <Truck className="w-3.5 h-3.5" />, color: 'hover:border-orange-500' },
              { id: 'expense_shop', label: 'خرج ومصاريف محل', icon: <TrendingDown className="w-3.5 h-3.5" />, color: 'hover:border-rose-500' },
              { id: 'expense_home_mosaab', label: 'صرفة بيت مصعب', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hover:border-emerald-500' },
              { id: 'withdrawal_mosaab', label: 'سحب مصعب شخصي', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hover:border-emerald-500' },
              { id: 'mosaab_purchases_fund', label: 'مسلم لمصعب مشتريات', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hover:border-emerald-500' },
              { id: 'expense_engineer', label: 'صرفة مهندس (على المحل)', icon: <Wrench className="w-3.5 h-3.5" />, color: 'hover:border-purple-500' },
              { id: 'withdrawal_engineer', label: 'سحب مهندس (عليه)', icon: <Wrench className="w-3.5 h-3.5" />, color: 'hover:border-purple-500' },
              { id: 'expense_worker', label: 'صرفة عامل', icon: <TrendingDown className="w-3.5 h-3.5" />, color: 'hover:border-rose-500' },
              { id: 'withdrawal_worker', label: 'تصفية عامل 7500', icon: <TrendingDown className="w-3.5 h-3.5" />, color: 'hover:border-rose-500' },
              { id: 'expense_modem', label: 'خرج مودم ورصيد نت', icon: <TrendingDown className="w-3.5 h-3.5" />, color: 'hover:border-rose-500' },
              { id: 'shop_tools_outflow', label: 'مخروجات للمحل', icon: <TrendingDown className="w-3.5 h-3.5" />, color: 'hover:border-rose-500' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setType(btn.id as TransactionType);
                  if (btn.id === 'balance_hadi' || btn.id === 'balance_qimma') {
                    if (typeof price === 'number') {
                      const res = calculateBalanceValues(price);
                      setCost(res.cost);
                      setProfit(res.profit);
                    }
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-right cursor-pointer ${
                  type === btn.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="shrink-0">{btn.icon}</span>
                <span className="truncate text-[11px]">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الوقت:</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description with Smart Auto-Complete & Damar Quick Picker */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                البيان والتفاصيل (ابحث لتعبئة سعر الضمار آلياً):
              </label>
              <button
                type="button"
                onClick={() => setIsQuickGuideOpen(!isQuickGuideOpen)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span>دليل أسعار الضمار المعتمد</span>
              </button>
            </div>

            <div className="relative">
              <input
                ref={descriptionInputRef}
                type="text"
                required
                placeholder={
                  type === 'sale'
                    ? 'اكتب اسم الصنف (مثل: شاحن الملك K8، وصلة LT 5A)...'
                    : type === 'maintenance'
                    ? 'اكتب اسم الشاشة أو العطل (مثل: شاشة سامسونج A12، بيت شحن)...'
                    : type === 'balance_hadi' || type === 'balance_qimma'
                    ? 'مبيعات رصيد وباقات...'
                    : 'اكتب بيان الحركة بالتفصيل...'
                }
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onBlur={handleDescriptionBlur}
                onFocus={() => {
                  if (description.trim()) {
                    const results = searchPriceMemory(description, undefined, 8);
                    setSuggestions(results);
                    setIsSuggestionsOpen(results.length > 0);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none pr-8"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Auto-Complete Suggestions Dropdown */}
            {isSuggestionsOpen && suggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 flex items-center justify-between">
                  <span>نتائج الذاكرة وأسعار الضمار المعتمدة:</span>
                  <span>اضغط لاختيار الصنف وملء التكلفة والربح</span>
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPriceItem(item)}
                    className="w-full text-right p-2.5 hover:bg-emerald-50/70 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">#{item.code}</span>
                        <span>{item.name}</span>
                        <span className="text-[10px] font-normal text-slate-500">({item.categoryNameAr})</span>
                      </div>
                      {item.notes && <div className="text-[10px] text-slate-400 mt-0.5">{item.notes}</div>}
                    </div>

                    <div className="text-left shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-700">
                        ضمار: {formatNumber(item.costPrice)} ر.ي
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 font-semibold">
                        بيع: {formatNumber(item.sellingPrice)} ر.ي (فائدة: {formatNumber(item.profit)})
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Damar Guide Drawer */}
            {isQuickGuideOpen && (
              <div className="mt-2 p-3 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between font-bold text-slate-300 pb-1 border-b border-slate-800">
                  <span>اختر صنفاً من قائمة الضمار لشهر أغسطس:</span>
                  <button
                    type="button"
                    onClick={() => setIsQuickGuideOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {loadPriceMemory().slice(0, 30).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPriceItem(item)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-900/60 text-right border border-slate-700 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="font-mono text-amber-400 font-bold shrink-0 mr-2 text-[11px]">
                        {formatNumber(item.costPrice)} ر.ي
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDamarItem && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  تم تطبيق سعر الضمار المعتمد ({selectedDamarItem.name}): ضمار <strong>{formatNumber(selectedDamarItem.costPrice)} ر.ي</strong> • بيع <strong>{formatNumber(selectedDamarItem.sellingPrice)} ر.ي</strong>
                </span>
              </div>
            )}
          </div>

          {/* Supplier selector (for purchases, maintenance parts, balance networks) */}
          {(type === 'purchase' || type === 'maintenance' || type === 'balance_hadi' || type === 'balance_qimma') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المورد / التاجر:</label>
              <select
                value={supplierId}
                onChange={(e) => handleSupplierSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="">-- اختر المورد أو شبكة الرصيد --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location || s.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Financial Amounts: Price, Cost, Profit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type.startsWith('expense_') || type.startsWith('withdrawal_') || type === 'shop_tools_outflow'
                  ? 'قيمة المبلغ المصروف (ر.ي):'
                  : type === 'purchase'
                  ? 'المبلغ المدفوع / المحول (ر.ي):'
                  : 'المبلغ / سعر البيع (ر.ي):'}
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="0"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            {/* Cost / Damar (for sales, maintenance, balance) */}
            {!type.startsWith('expense_') && !type.startsWith('withdrawal_') && type !== 'shop_tools_outflow' && (
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  {type === 'maintenance' ? 'تكلفة قطع الغيار / الضمار:' : 'سعر التكلفة / الضمار (ر.ي):'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={cost}
                  onChange={(e) => handleCostChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold font-mono text-amber-900 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-amber-50/40"
                />
              </div>
            )}

            {/* Profit (auto or editable) */}
            {!type.startsWith('expense_') && !type.startsWith('withdrawal_') && type !== 'shop_tools_outflow' && (
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  {type === 'maintenance' ? 'صافي فايدة الصيانة:' : 'الربح / الفائدة (ر.ي):'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={profit}
                  onChange={(e) => handleProfitChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold font-mono text-emerald-700 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/50"
                />
              </div>
            )}
          </div>

          {/* Balance 7% Rule Note */}
          {(type === 'balance_hadi' || type === 'balance_qimma') && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 text-xs text-teal-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signal className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>قاعدة أرباح الرصيد (7%):</strong> يتم احتساب 700 ر.ي ربح صافي لكل 10,000 ر.ي مبيعات آلياً.
                </span>
              </div>
            </div>
          )}

          {/* Maintenance 50/50 Live Note */}
          {type === 'maintenance' && typeof profit === 'number' && profit > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 flex items-center justify-between">
              <div>
                <span className="font-bold">توزيع فايدة الصيانة تلقائياً:</span>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  نصف للمحل (50%): <strong>{formatCurrency(profit / 2)}</strong> • نصف للمهندس (50%): <strong>{formatCurrency(profit / 2)}</strong>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-purple-600 shrink-0" />
            </div>
          )}

          {/* Mosaab purchases fund delivered amount */}
          {type === 'mosaab_purchases_fund' && (
            <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
              <div>
                <label className="block font-bold text-amber-900 mb-1">كم اشترى بضاعة بمبلغ:</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={mosaabPurchased}
                  onChange={(e) => setMosaabPurchased(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-amber-300 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-amber-900 mb-1">المتبقي عند مصعب:</label>
                <div className="font-bold font-mono text-amber-800 py-1.5">
                  {formatCurrency(
                    Math.max(0, (Number(price) || 0) - (Number(mosaabPurchased) || 0))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-slate-700">طريقة الدفع:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>نقداً (كاش)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="transfer"
                checked={paymentMethod === 'transfer'}
                onChange={() => setPaymentMethod('transfer')}
                className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>تحويل بنكي / زلط</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="debt"
                checked={paymentMethod === 'debt'}
                onChange={() => setPaymentMethod('debt')}
                className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>آجل / ذمم</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
            <textarea
              rows={2}
              placeholder="اكتب أي ملاحظة عن الزبون أو رقم السند أو الفاتورة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Image Upload for Receipt/Invoice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              صورة التوثيق / الفاتورة (اختياري):
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 text-slate-600 hover:text-emerald-700 text-xs font-medium cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>رفع صورة من الجوال أو الكمبيوتر</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {attachmentUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={attachmentUrl}
                    alt="التوثيق"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachmentUrl('')}
                    className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer"
                  >
                    حذف الصورة
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-950/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{initialTransaction ? 'حفظ التعديلات' : 'حفظ وقيد السند'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
