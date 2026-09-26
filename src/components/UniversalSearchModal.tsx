import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Wrench,
  ShoppingBag,
  Signal,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Edit2,
  Printer,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ChevronRight,
  Filter,
  User,
  Clock,
  Coins,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Transaction, TransactionType, Supplier, MaintenanceTicket } from '../types';
import { PriceMemoryItem } from '../types/pricing';
import { formatCurrency } from '../utils/calculations';
import { loadPriceMemory } from '../utils/priceMemoryStorage';
import { printHtmlElement } from '../utils/printHelper';
import { downloadExcelWorkbook } from '../utils/fileExportHelper';
import { isCompoundDescription, parseCompoundItems } from '../utils/itemBreakdown';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  suppliers: Supplier[];
  onNavigateToDate: (date: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onViewAccountStatement?: (name: string) => void;
}

type SearchCategoryFilter =
  | 'all'
  | 'sale'
  | 'maintenance'
  | 'network'
  | 'purchase'
  | 'expense'
  | 'withdrawal'
  | 'price_guide'
  | 'tickets';

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  transactions,
  suppliers,
  onNavigateToDate,
  onEditTransaction,
  onViewAccountStatement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load price memory & maintenance tickets from storage
  const [priceMemoryItems, setPriceMemoryItems] = useState<PriceMemoryItem[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);

      const prices = loadPriceMemory();
      setPriceMemoryItems(prices);

      try {
        const rawTickets = localStorage.getItem('mosaab_maintenance_tickets_v1');
        if (rawTickets) {
          setMaintenanceTickets(JSON.parse(rawTickets));
        }
      } catch (e) {
        console.warn('Could not load tickets:', e);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Matches a transaction type with the category filter
  const matchesCategory = (type: TransactionType, cat: SearchCategoryFilter): boolean => {
    if (cat === 'all') return true;
    if (cat === 'sale') return type === 'sale';
    if (cat === 'maintenance') return type === 'maintenance';
    if (cat === 'network') return type === 'balance_hadi' || type === 'balance_qimma' || type === 'sim';
    if (cat === 'purchase') return type === 'purchase';
    if (cat === 'expense') {
      return (
        type === 'expense_shop' ||
        type === 'expense_engineer' ||
        type === 'expense_worker' ||
        type === 'expense_modem' ||
        type === 'shop_tools_outflow' ||
        type === 'damaged'
      );
    }
    if (cat === 'withdrawal') {
      return (
        type === 'withdrawal_mosaab' ||
        type === 'expense_home_mosaab' ||
        type === 'mosaab_purchases_fund' ||
        type === 'withdrawal_engineer' ||
        type === 'withdrawal_worker'
      );
    }
    return false;
  };

  // Search filtering logic
  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query && activeCategory === 'all') {
      return transactions.slice(0, 30);
    }

    if (activeCategory === 'price_guide' || activeCategory === 'tickets') {
      return [];
    }

    return transactions.filter((tx) => {
      if (!matchesCategory(tx.type, activeCategory)) {
        return false;
      }

      if (!query) return true;

      const descMatch = (tx.description || '').toLowerCase().includes(query);
      const notesMatch = (tx.notes || '').toLowerCase().includes(query);
      const catMatch = (tx.category || '').toLowerCase().includes(query);
      const supMatch = (tx.supplierName || '').toLowerCase().includes(query);
      const custMatch = (tx.customerName || '').toLowerCase().includes(query);
      const dateMatch = (tx.date || '').includes(query);
      const priceMatch = (tx.price || 0).toString().includes(query);

      let compoundMatch = false;
      if (isCompoundDescription(tx.description)) {
        const items = parseCompoundItems(tx.description, tx.price || 0, tx.cost || 0, tx.category);
        compoundMatch = items.some(
          (it) => it.name.toLowerCase().includes(query) || it.amount.toString().includes(query)
        );
      }

      return (
        descMatch ||
        notesMatch ||
        catMatch ||
        supMatch ||
        custMatch ||
        dateMatch ||
        priceMatch ||
        compoundMatch
      );
    });
  }, [transactions, searchTerm, activeCategory]);

  // Search in price guide
  const filteredPriceItems = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'price_guide') return [];
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    return priceMemoryItems.filter((it) => {
      const nameMatch = it.name.toLowerCase().includes(query);
      const catMatch = (it.categoryNameAr || it.category || '').toLowerCase().includes(query);
      const costMatch = (it.costPrice || 0).toString().includes(query);
      const priceMatch = (it.sellingPrice || 0).toString().includes(query);
      return nameMatch || catMatch || costMatch || priceMatch;
    });
  }, [priceMemoryItems, searchTerm, activeCategory]);

  // Search in maintenance tickets
  const filteredTickets = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'tickets') return [];
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    return maintenanceTickets.filter((tk) => {
      const numMatch = (tk.ticketNumber || '').toLowerCase().includes(query);
      const custMatch = (tk.customerName || '').toLowerCase().includes(query);
      const phoneMatch = (tk.customerPhone || '').includes(query);
      const devMatch = (tk.deviceModel || '').toLowerCase().includes(query);
      const probMatch = (tk.issueDescription || '').toLowerCase().includes(query);
      return numMatch || custMatch || phoneMatch || devMatch || probMatch;
    });
  }, [maintenanceTickets, searchTerm, activeCategory]);

  // Totals
  const totals = useMemo(() => {
    let totalAmount = 0;
    let totalProfit = 0;
    filteredTransactions.forEach((t) => {
      totalAmount += t.price || 0;
      totalProfit += t.profit || 0;
    });
    return { totalAmount, totalProfit };
  }, [filteredTransactions]);

  if (!isOpen) return null;

  const handlePrintResults = () => {
    printHtmlElement('universal-search-results-table', `نتائج_البحث_${searchTerm || 'شامل'}`);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['تقرير نتائج البحث في نظام محل مصعب الصوفي'],
      ['كلمة البحث:', searchTerm || 'عرض شامل'],
      ['تاريخ الاستخراج:', new Date().toLocaleDateString('ar-YE')],
      ['إجمالي النتائج:', filteredTransactions.length.toString()],
      ['إجمالي المبالغ:', totals.totalAmount.toString()],
      ['إجمالي الأرباح:', totals.totalProfit.toString()],
      [''],
      ['التاريخ', 'الوقت', 'النوع', 'التصنيف', 'البيان والتفاصيل', 'المبلغ (ر.ي)', 'التكلفة (الضمار)', 'الربح الصافي', 'المورد / العميل', 'الملاحظات'],
    ];

    filteredTransactions.forEach((t) => {
      rows.push([
        t.date,
        t.time || '',
        getTypeBadgeText(t.type),
        t.category || '',
        t.description,
        (Number(t.price) || 0).toString(),
        (Number(t.cost) || 0).toString(),
        (Number(t.profit) || 0).toString(),
        t.supplierName || t.customerName || '',
        t.notes || '',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    (ws as any)['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(wb, ws, 'نتائج البحث');
    downloadExcelWorkbook(wb, `نتائج_بحث_${searchTerm.replace(/\s+/g, '_') || 'شامل'}.xlsx`);
  };

  function getTypeBadgeColor(type: TransactionType) {
    if (type === 'sale') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (type === 'maintenance') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (type === 'balance_hadi' || type === 'balance_qimma' || type === 'sim') {
      return 'bg-sky-100 text-sky-800 border-sky-300';
    }
    if (type === 'purchase') return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    if (type.startsWith('expense') || type === 'shop_tools_outflow' || type === 'damaged') {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (type.startsWith('withdrawal') || type === 'mosaab_purchases_fund') {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  }

  function getTypeBadgeText(type: TransactionType) {
    switch (type) {
      case 'sale':
        return 'مبيعات';
      case 'maintenance':
        return 'صيانة';
      case 'balance_hadi':
        return 'رصيد الهادي';
      case 'balance_qimma':
        return 'رصيد الرقم';
      case 'sim':
        return 'شرائح';
      case 'purchase':
        return 'مشتريات';
      case 'expense_shop':
        return 'خرج المحل';
      case 'expense_home_mosaab':
        return 'صرفة بيت مصعب';
      case 'withdrawal_mosaab':
        return 'سحب مصعب';
      case 'mosaab_purchases_fund':
        return 'شراء بضاعة';
      case 'expense_engineer':
        return 'صرفة مهندس';
      case 'withdrawal_engineer':
        return 'سحب مهندس';
      case 'expense_worker':
        return 'صرفة عامل';
      case 'withdrawal_worker':
        return 'سحب عامل';
      case 'expense_modem':
        return 'خرج مودم';
      case 'shop_tools_outflow':
        return 'مخروجات للمحل';
      case 'damaged':
        return 'تالف';
      default:
        return type;
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 text-slate-900 font-bold px-1 rounded-xs">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 no-print">
      <div className="bg-white w-full max-w-5xl h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Search Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-950/30">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>محرك البحث الشامل في النظام</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    بحث فوري بكل شيء
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  ابحث باسم أي صنف، بيان، عميل، مورد، تاريخ، سعر، أو ضمار ليظهر لك فوراً
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="إغلاق (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="اكتب اسم الصنف (مثل: سماعة، وصلة، بطارية، شاشة)، أو المورد، أو العميل، أو التاريخ..."
              className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-sm sm:text-base font-semibold py-3 pr-12 pl-10 rounded-2xl border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title="مسح حقل البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              الكل ({filteredTransactions.length})
            </button>
            <button
              onClick={() => setActiveCategory('sale')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'sale'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🛍️ مبيعات
            </button>
            <button
              onClick={() => setActiveCategory('maintenance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'maintenance'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🔧 صيانة
            </button>
            <button
              onClick={() => setActiveCategory('network')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'network'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📶 رصيد شبكات
            </button>
            <button
              onClick={() => setActiveCategory('purchase')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'purchase'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📦 مشتريات
            </button>
            <button
              onClick={() => setActiveCategory('expense')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              💸 خرج ومصاريف
            </button>
            <button
              onClick={() => setActiveCategory('withdrawal')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'withdrawal'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              👑 سحوبات وصرفة
            </button>
            <button
              onClick={() => setActiveCategory('price_guide')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'price_guide'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🏷️ دليل الأسعار والضمار ({filteredPriceItems.length})
            </button>
            <button
              onClick={() => setActiveCategory('tickets')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'tickets'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🎫 كروت الصيانة ({filteredTickets.length})
            </button>
          </div>
        </div>

        {/* Action Bar & Stats Summary */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-600">
              النتائج المطابقة:{' '}
              <strong className="text-slate-900 font-black font-mono-numbers">
                {filteredTransactions.length}
              </strong>{' '}
              حركة
            </span>
            <div className="w-px h-4 bg-slate-300 hidden sm:block" />
            <span className="text-slate-600">
              إجمالي المبالغ:{' '}
              <strong className="text-emerald-700 font-bold font-mono-numbers">
                {formatCurrency(totals.totalAmount)}
              </strong>
            </span>
            <div className="w-px h-4 bg-slate-300 hidden sm:block" />
            <span className="text-slate-600">
              إجمالي الأرباح:{' '}
              <strong className="text-blue-700 font-bold font-mono-numbers">
                {formatCurrency(totals.totalProfit)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintResults}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl font-bold transition-all disabled:opacity-40 cursor-pointer"
              title="طباعة نتائج البحث"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>طباعة النتائج</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold transition-all disabled:opacity-40 cursor-pointer"
              title="تصدير النتائج إلى ملف إكسل معتمد"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          
          {/* Section 1: Price Guide Matches (if any) */}
          {filteredPriceItems.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs sm:text-sm text-amber-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>أصناف مطابقة من دليل أسعار الضمار ({filteredPriceItems.length})</span>
                </h4>
                <span className="text-[11px] text-amber-700">أسعار الشراء المقيدة سابقاً للضمار</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredPriceItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {highlightMatch(item.name, searchTerm)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        التصنيف: {item.categoryNameAr || item.category}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2 text-[11px]">
                      <span className="text-rose-700 font-bold">
                        الضمار: {formatCurrency(item.costPrice)}
                      </span>
                      <span className="text-emerald-700 font-bold">
                        البيع: {formatCurrency(item.sellingPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Maintenance Tickets Matches (if any) */}
          {filteredTickets.length > 0 && (
            <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs sm:text-sm text-teal-900 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-teal-600" />
                  <span>كروت صيانة مطابقة ({filteredTickets.length})</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredTickets.map((tk) => (
                  <div
                    key={tk.id}
                    className="bg-white p-3 rounded-xl border border-teal-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-800 font-mono">{tk.ticketNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                        {tk.status === 'delivered' ? 'مستلم' : tk.status === 'ready' ? 'جاهز' : 'قيد الصيانة'}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      {highlightMatch(tk.customerName, searchTerm)} - {highlightMatch(tk.deviceModel, searchTerm)}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      العطل: {highlightMatch(tk.issueDescription, searchTerm)}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold border-t border-slate-100 pt-1">
                      التكلفة: {formatCurrency(tk.estimatedCost)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Transactions Table */}
          <div id="universal-search-results-table" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-slate-800">لا توجد عمليات مطابقة لكلمة البحث</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  جرب البحث بكلمة أخرى، أو باسم صنف مختلف، أو تأكد من اختيار الفلتر المناسب من شريط التصنيفات أعلاه.
                </p>
              </div>
            ) : (
              <div className="table-responsive-container">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3 text-center w-24">التاريخ</th>
                      <th className="p-3 text-center w-24">النوع</th>
                      <th className="p-3 text-right">البيان والصنف التفصيلي</th>
                      <th className="p-3 text-center w-24">المبلغ</th>
                      <th className="p-3 text-center w-24">الضمار (التكلفة)</th>
                      <th className="p-3 text-center w-24">الربح</th>
                      <th className="p-3 text-right w-32">المورد / العميل</th>
                      <th className="p-3 text-center w-36 no-print">إجراءات سريعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => {
                      const isCompound = isCompoundDescription(tx.description);
                      const decomposedItems = isCompound
                        ? parseCompoundItems(tx.description, tx.price || 0, tx.cost || 0, tx.category)
                        : [];

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Date & Time */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="font-bold text-slate-900 font-mono-numbers">{tx.date}</div>
                            {tx.time && (
                              <div className="text-[10px] text-slate-400 font-mono-numbers">{tx.time}</div>
                            )}
                          </td>

                          {/* Type */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getTypeBadgeColor(
                                tx.type
                              )}`}
                            >
                              {getTypeBadgeText(tx.type)}
                            </span>
                          </td>

                          {/* Description & Compound breakdown */}
                          <td className="p-3">
                            <div className="font-bold text-slate-900 leading-snug">
                              {highlightMatch(tx.description, searchTerm)}
                            </div>
                            
                            {/* Decomposed sub-items pill badge if compound */}
                            {isCompound && decomposedItems.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {decomposedItems.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px]"
                                  >
                                    <span>{highlightMatch(item.name, searchTerm)}</span>
                                    <span className="font-bold font-mono-numbers text-blue-900">
                                      ({item.amount} ر.ي)
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {tx.notes && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                ملاحظات: {highlightMatch(tx.notes, searchTerm)}
                              </div>
                            )}
                          </td>

                          {/* Price */}
                          <td className="p-3 text-center font-bold text-slate-900 font-mono-numbers whitespace-nowrap">
                            {formatCurrency(tx.price)}
                          </td>

                          {/* Cost */}
                          <td className="p-3 text-center text-slate-600 font-mono-numbers whitespace-nowrap">
                            {tx.cost ? formatCurrency(tx.cost) : '-'}
                          </td>

                          {/* Profit */}
                          <td className="p-3 text-center font-bold text-emerald-700 font-mono-numbers whitespace-nowrap">
                            {tx.profit ? formatCurrency(tx.profit) : '-'}
                          </td>

                          {/* Supplier / Customer */}
                          <td className="p-3 text-right text-slate-700">
                            {tx.supplierName || tx.customerName ? (
                              <div className="flex items-center gap-1 font-semibold">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{highlightMatch(tx.supplierName || tx.customerName || '', searchTerm)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-2 text-center whitespace-nowrap no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  onNavigateToDate(tx.date);
                                  onClose();
                                }}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                                title="الانتقال إلى يومية هذا التاريخ لعرضها وتعديلها"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>

                              {onEditTransaction && (
                                <button
                                  onClick={() => {
                                    onEditTransaction(tx);
                                    onClose();
                                  }}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                                  title="تعديل هذه الحركة فوراً"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {(tx.supplierName || tx.customerName) && onViewAccountStatement && (
                                <button
                                  onClick={() => {
                                    onViewAccountStatement(tx.supplierName || tx.customerName || '');
                                    onClose();
                                  }}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                  title="عرض كشف حساب هذا الطرف"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">نظام الرقم الأول</span>
            <span>• ابحث عن أي صنف بالاسم أو جزء منه</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
          >
            إغلاق (Esc)
          </button>
        </div>

      </div>
    </div>
  );
};
