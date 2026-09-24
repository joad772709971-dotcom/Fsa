import React, { useState } from 'react';
import { DayRecord, SupplierProfile, SupplierTransaction, SupplierTransferItem, SHOP_INFO } from '../types';
import { calculatePeriodSummary, formatNumber } from '../utils/accounting';
import { getTodayDateString } from '../utils/dateHelper';
import { 
  Truck, 
  Search, 
  FileSpreadsheet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  User, 
  CreditCard,
  Plus,
  Edit3,
  Paperclip,
  Printer,
  MessageSquare,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Filter,
  DollarSign,
  Building,
  Upload,
  Camera,
  X,
  Share2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { openWhatsApp, buildSupplierStatementMessage, buildSupplierTransferAlertMessage } from '../utils/messaging';
import { DocumentModal } from './DocumentModal';
import { exportSuppliersLedgerToExcel } from '../utils/excelExport';

export const initialSupplierProfiles: SupplierProfile[] = [
  {
    id: 'supp-1',
    name: 'محمد مياس',
    phone: '777444555',
    location: 'ذمار / صنعاء',
    dealingType: 'نقد',
    category: 'رصيد وباقات',
    notes: 'مورد رصيد تطبيق الهادي وتغذية الحسابات'
  },
  {
    id: 'supp-2',
    name: 'فايز أبو علي',
    phone: '777666777',
    location: 'ذمار',
    dealingType: 'نقد',
    category: 'رصيد وباقات',
    notes: 'مورد رصيد تطبيق الرقم وشرايح فورجي'
  },
  {
    id: 'supp-3',
    name: 'خليل الأغبري',
    phone: '777222333',
    location: 'صنعاء - سوق المقالح',
    dealingType: 'نقد ودين',
    category: 'قطع غيار',
    notes: 'مورد فلاتات وشاشات وكالة'
  },
  {
    id: 'supp-4',
    name: 'عمر القاسمي',
    phone: '777000111',
    location: 'صنعاء - شارع القصر',
    dealingType: 'نقد ودين',
    category: 'قطع غيار',
    notes: 'مورد رئيسي لقطع غيار الشاشات والبطاريات'
  },
  {
    id: 'supp-5',
    name: 'المصنف',
    phone: '777111222',
    location: 'صنعاء',
    dealingType: 'دين',
    category: 'جوالات',
    notes: 'توريد جوالات مستخدمة وجديدة'
  },
  {
    id: 'supp-6',
    name: 'العبصري',
    phone: '777888999',
    location: 'ذمار - الشارع العام',
    dealingType: 'نقد ودين',
    category: 'إكسسوارات',
    notes: 'مورد إكسسوارات وشواحن وكابلات'
  },
  {
    id: 'supp-7',
    name: 'أبو صالح الأقمري',
    phone: '777333444',
    location: 'ذمار',
    dealingType: 'نقد ودين',
    category: 'قطع غيار',
    notes: 'مورد بيوت شحن وآي سيات'
  }
];

interface SuppliersLedgerViewProps {
  days: DayRecord[];
  profiles?: SupplierProfile[];
  transactions?: SupplierTransaction[];
  onAddProfile?: (profile: SupplierProfile) => void;
  onUpdateProfile?: (profile: SupplierProfile) => void;
  onDeleteProfile?: (id: string) => void;
  onAddTransaction?: (tx: SupplierTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddTransferToDay?: (transfer: SupplierTransferItem, dayId: string) => void;
}

export const SuppliersLedgerView: React.FC<SuppliersLedgerViewProps> = ({ 
  days,
  profiles = initialSupplierProfiles,
  transactions = [],
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onAddTransaction,
  onDeleteTransaction,
  onAddTransferToDay
}) => {
  const periodSummary = calculatePeriodSummary(days);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [dealingFilter, setDealingFilter] = useState<'الكل' | 'نقد' | 'دين' | 'نقد ودين'>('الكل');
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>(
    profiles.length > 0 ? profiles[0].name : 'عمر القاسمي'
  );

  // Modals
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SupplierProfile | null>(null);

  // Transaction modals (Transfer vs Purchase)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [activeSupplierForAction, setActiveSupplierForAction] = useState<SupplierProfile | null>(null);

  // Form states for profile
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pDealingType, setPDealingType] = useState<'نقد' | 'دين' | 'نقد ودين'>('نقد ودين');
  const [pCategory, setPCategory] = useState<SupplierProfile['category']>('قطع غيار');
  const [pNotes, setPNotes] = useState('');

  // Form states for transaction
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(getTodayDateString());
  const [txMethod, setTxMethod] = useState<'نقد' | 'كريمي' | 'جوالي' | 'جيب' | 'صاحب المتر' | 'عبر البرنامج'>('كريمي');
  const [txTransferNumber, setTxTransferNumber] = useState('');
  const [txInvoiceNumber, setTxInvoiceNumber] = useState('');
  const [txImage, setTxImage] = useState<string | undefined>(undefined);
  const [txNotes, setTxNotes] = useState('');
  const [txTargetDayId, setTxTargetDayId] = useState(days[days.length - 1]?.id || days[0]?.id || 'day-1');

  // Statement & Document Modal
  const [statementModalSupplier, setStatementModalSupplier] = useState<SupplierProfile | null>(null);
  const [documentViewerData, setDocumentViewerData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    onSave: (url: string | undefined) => void;
  }>({
    isOpen: false,
    title: '',
    onSave: () => {}
  });

  // Extract all unique suppliers from profiles + day transfers + transactions
  const allSupplierNames = Array.from(
    new Set([
      ...(profiles || []).map(p => p.name),
      ...Object.keys(periodSummary?.supplierSummaries || {}),
      ...(transactions || []).map(t => t.supplierName)
    ])
  );

  // Build combined statistics for each supplier
  const supplierStats = allSupplierNames.map(name => {
    const profile: SupplierProfile = (profiles || []).find(p => p.name === name) || {
      id: `supp-gen-${name}`,
      name,
      phone: '',
      location: '',
      dealingType: 'نقد ودين',
      category: 'قطع غيار',
      notes: ''
    };

    // Data from Day Records
    const daySummary = (periodSummary?.supplierSummaries && periodSummary.supplierSummaries[name]) || {
      name,
      totalTransferred: 0,
      totalPurchases: 0,
      balance: 0,
      transferCount: 0,
      transactions: []
    };

    // Data from Manual Transactions
    const manualTxs = (transactions || []).filter(t => t.supplierName === name);
    const manualTransferred = manualTxs
      .filter(t => t.type === 'حوالة_مرسلة' || t.type === 'دفعة_نقدية')
      .reduce((sum, t) => sum + t.amount, 0);
    const manualPurchases = manualTxs
      .filter(t => t.type === 'شراء_بضاعة')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransferred = daySummary.totalTransferred + manualTransferred;
    const totalPurchases = daySummary.totalPurchases + manualPurchases;
    const balance = totalTransferred - totalPurchases;

    // Combined itemized transactions list
    const combinedTransactions = [
      ...(daySummary.transactions || []).map(t => ({
        id: `day-tx-${t.dayNumber}-${t.date}`,
        source: 'day' as const,
        dayNumber: t.dayNumber,
        date: t.date,
        transferred: t.amount,
        purchases: t.purchases,
        method: t.method || 'حوالة / نقد',
        notes: t.notes,
        imageUrl: undefined as string | undefined,
        refNumber: undefined as string | undefined
      })),
      ...manualTxs.map(t => ({
        id: t.id,
        source: 'manual' as const,
        dayNumber: undefined,
        date: t.date,
        transferred: (t.type === 'حوالة_مرسلة' || t.type === 'دفعة_نقدية') ? t.amount : 0,
        purchases: t.type === 'شراء_بضاعة' ? t.amount : 0,
        method: t.transferMethod || 'سند يدوي',
        notes: t.notes,
        imageUrl: t.imageUrl,
        refNumber: t.transferNumber || t.invoiceNumber
      }))
    ].sort((a, b) => b.date.localeCompare(a.date));

    return {
      profile,
      totalTransferred,
      totalPurchases,
      balance,
      transactionsCount: combinedTransactions.length,
      transactions: combinedTransactions
    };
  });

  // Filtered suppliers
  const filteredSuppliers = supplierStats.filter(s => {
    const matchesSearch = 
      s.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.profile.phone && s.profile.phone.includes(searchQuery)) ||
      (s.profile.location && s.profile.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDealing = dealingFilter === 'الكل' || s.profile.dealingType === dealingFilter;

    return matchesSearch && matchesDealing;
  });

  const selectedSupplierStat = supplierStats.find(s => s.profile.name === selectedSupplierName);

  // Profile Modal Handlers
  const handleOpenAddProfile = () => {
    setEditingProfile(null);
    setPName('');
    setPPhone('');
    setPLocation('');
    setPDealingType('نقد ودين');
    setPCategory('قطع غيار');
    setPNotes('');
    setIsAddProfileModalOpen(true);
  };

  const handleOpenEditProfile = (profile: SupplierProfile) => {
    setEditingProfile(profile);
    setPName(profile.name);
    setPPhone(profile.phone || '');
    setPLocation(profile.location || '');
    setPDealingType(profile.dealingType || 'نقد ودين');
    setPCategory(profile.category || 'قطع غيار');
    setPNotes(profile.notes || '');
    setIsAddProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    if (editingProfile) {
      const updated: SupplierProfile = {
        ...editingProfile,
        name: pName.trim(),
        phone: pPhone.trim() || undefined,
        location: pLocation.trim() || undefined,
        dealingType: pDealingType,
        category: pCategory,
        notes: pNotes.trim() || undefined
      };
      if (onUpdateProfile) onUpdateProfile(updated);
    } else {
      const newProfile: SupplierProfile = {
        id: `supp-${Date.now()}`,
        name: pName.trim(),
        phone: pPhone.trim() || undefined,
        location: pLocation.trim() || undefined,
        dealingType: pDealingType,
        category: pCategory,
        notes: pNotes.trim() || undefined
      };
      if (onAddProfile) onAddProfile(newProfile);
    }

    setIsAddProfileModalOpen(false);
  };

  // Transaction Handlers
  const handleOpenAddTransfer = (supplier: SupplierProfile) => {
    setActiveSupplierForAction(supplier);
    setTxAmount('');
    setTxDate(getTodayDateString());
    setTxMethod('كريمي');
    setTxTransferNumber('');
    setTxImage(undefined);
    setTxNotes('');
    setIsTransferModalOpen(true);
  };

  const handleOpenAddPurchase = (supplier: SupplierProfile) => {
    setActiveSupplierForAction(supplier);
    setTxAmount('');
    setTxDate(getTodayDateString());
    setTxInvoiceNumber('');
    setTxImage(undefined);
    setTxNotes('');
    setIsPurchaseModalOpen(true);
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplierForAction || !txAmount) return;

    const amount = Number(txAmount) || 0;
    
    // Save to daily ledger if callback exists
    if (onAddTransferToDay && txTargetDayId) {
      const transferItem: SupplierTransferItem = {
        id: `supp-tr-${Date.now()}`,
        supplierName: activeSupplierForAction.name,
        amountSent: amount,
        purchasesReceivedValue: 0,
        transferMethod: txMethod,
        invoiceNumber: txTransferNumber || undefined,
        imageUrl: txImage,
        notes: txNotes || `حوالة عبر ${txMethod}`
      };
      onAddTransferToDay(transferItem, txTargetDayId);
    } else if (onAddTransaction) {
      const newTx: SupplierTransaction = {
        id: `tx-${Date.now()}`,
        supplierName: activeSupplierForAction.name,
        type: 'حوالة_مرسلة',
        amount,
        date: txDate,
        transferMethod: txMethod,
        transferNumber: txTransferNumber || undefined,
        imageUrl: txImage,
        notes: txNotes || undefined
      };
      onAddTransaction(newTx);
    }

    setIsTransferModalOpen(false);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplierForAction || !txAmount) return;

    const amount = Number(txAmount) || 0;
    
    // Save to daily ledger or manual transactions
    if (onAddTransferToDay && txTargetDayId) {
      const transferItem: SupplierTransferItem = {
        id: `supp-pur-${Date.now()}`,
        supplierName: activeSupplierForAction.name,
        amountSent: 0,
        purchasesReceivedValue: amount,
        transferMethod: 'نقد',
        invoiceNumber: txInvoiceNumber || undefined,
        imageUrl: txImage,
        notes: txNotes || `فاتورة مشتريات رقم ${txInvoiceNumber || 'بدون'}`
      };
      onAddTransferToDay(transferItem, txTargetDayId);
    } else if (onAddTransaction) {
      const newTx: SupplierTransaction = {
        id: `tx-${Date.now()}`,
        supplierName: activeSupplierForAction.name,
        type: 'شراء_بضاعة',
        amount,
        date: txDate,
        invoiceNumber: txInvoiceNumber || undefined,
        imageUrl: txImage,
        notes: txNotes || undefined
      };
      onAddTransaction(newTx);
    }

    setIsPurchaseModalOpen(false);
  };

  // Image Upload helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTxImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Send WhatsApp Statement
  const handleSendWhatsAppStatement = (stat: typeof supplierStats[0]) => {
    const msg = buildSupplierStatementMessage({
      name: stat.profile.name,
      phone: stat.profile.phone,
      location: stat.profile.location,
      dealingType: stat.profile.dealingType,
      totalTransferred: stat.totalTransferred,
      totalPurchases: stat.totalPurchases,
      balance: stat.balance,
      transactionsCount: stat.transactionsCount,
      recentTransactions: stat.transactions.map(t => ({
        date: t.date,
        type: t.transferred > 0 ? 'حوالة مرسلة' : 'فاتورة مشتريات',
        amount: t.transferred > 0 ? t.transferred : t.purchases,
        method: t.method,
        notes: t.notes
      }))
    });

    openWhatsApp(stat.profile.phone || '', msg);
  };

  // Export to Excel
  const exportSuppliersExcel = () => {
    exportSuppliersLedgerToExcel(days, undefined, profiles);
  };

  const exportSelectedSupplierExcel = (supplierName: string) => {
    exportSuppliersLedgerToExcel(days, supplierName, profiles);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إدارة وحسابات الموردين والتجار وموردي الرصيد</h2>
              <p className="text-xs text-slate-400 mt-1">
                سجل التوريدات، الحوالات، كشوفات الحسابات اللحظية، ومطابقة الفواتير مع السندات والصور
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAddProfile}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة تاجر / مورد جديد</span>
          </button>

          <button
            onClick={exportSuppliersExcel}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer no-print"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسل</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-slate-700 shadow-md">
          <span className="text-xs text-slate-400 block mb-1">إجمالي الحوالات المرسلة للموردين:</span>
          <strong className="text-xl font-black text-rose-400 font-mono-num">
            {formatNumber(supplierStats.reduce((sum, s) => sum + s.totalTransferred, 0))} ر.ي
          </strong>
        </div>

        <div className="bg-[#1E293B] p-4 rounded-2xl border border-slate-700 shadow-md">
          <span className="text-xs text-slate-400 block mb-1">إجمالي المشتريات والبضائع المستلمة:</span>
          <strong className="text-xl font-black text-emerald-400 font-mono-num">
            {formatNumber(supplierStats.reduce((sum, s) => sum + s.totalPurchases, 0))} ر.ي
          </strong>
        </div>

        <div className="bg-[#1E293B] p-4 rounded-2xl border border-indigo-500/30 shadow-md">
          <span className="text-xs text-slate-400 block mb-1">عدد التجار والموردين المقيدين:</span>
          <strong className="text-xl font-black text-indigo-400 font-mono-num">
            {supplierStats.length} تاجر
          </strong>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[#1E293B] p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم التاجر، رقم الهاتف، أو السوق..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> نظام التعامل:
          </span>
          {(['الكل', 'نقد', 'دين', 'نقد ودين'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setDealingFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                dealingFilter === tab
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-[#0F172A] text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Suppliers Grid with Dedicated Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map(s => {
          const isSelected = s.profile.name === selectedSupplierName;
          return (
            <div
              key={s.profile.id || s.profile.name}
              className={`rounded-3xl border transition flex flex-col justify-between shadow-xl overflow-hidden ${
                isSelected
                  ? 'bg-[#1E293B] border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-[#1E293B] hover:border-slate-600 border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-indigo-800/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-black shadow-inner shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{s.profile.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                          s.profile.dealingType === 'نقد'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : s.profile.dealingType === 'دين'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        }`}>
                          نظام {s.profile.dealingType}
                        </span>
                        {s.profile.category && (
                          <span className="text-[10px] bg-[#0F172A] text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">
                            {s.profile.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit Profile Button */}
                  <button
                    onClick={() => handleOpenEditProfile(s.profile)}
                    className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
                    title="تعديل بيانات التاجر (الاسم، الهاتف، الموقع، نظام التعامل)"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Location & Phone Info */}
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-400 bg-[#0F172A]/70 p-3 rounded-2xl border border-slate-800">
                  {s.profile.phone && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>الهاتف:</span>
                      </span>
                      <a href={`tel:${s.profile.phone}`} className="text-indigo-300 font-mono-num hover:underline font-bold">
                        {s.profile.phone}
                      </a>
                    </div>
                  )}

                  {s.profile.location && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>الموقع:</span>
                      </span>
                      <span className="text-slate-300 truncate max-w-[170px]">{s.profile.location}</span>
                    </div>
                  )}

                  {s.profile.notes && (
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 truncate">
                      📝 {s.profile.notes}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0F172A] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">الحوالات المرسلة:</span>
                    <strong className="text-rose-400 font-mono-num text-sm block">
                      {formatNumber(s.totalTransferred)} ر.ي
                    </strong>
                  </div>

                  <div className="bg-[#0F172A] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">المشتريات المستلمة:</span>
                    <strong className="text-emerald-400 font-mono-num text-sm block">
                      {formatNumber(s.totalPurchases)} ر.ي
                    </strong>
                  </div>
                </div>

                {/* Net Balance Status */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">الرصيد الصافي:</span>
                  <span className={`font-black font-mono-num text-sm ${
                    s.balance > 0 ? 'text-rose-400' : s.balance < 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {s.balance === 0 
                      ? 'مسوى تماماً (0 ر.ي)' 
                      : s.balance > 0 
                      ? `لنا عنده ${formatNumber(s.balance)} ر.ي`
                      : `له عندنا ${formatNumber(Math.abs(s.balance))} ر.ي`}
                  </span>
                </div>
              </div>

              {/* Dedicated Action Buttons for EACH Supplier */}
              <div className="p-3 bg-[#0F172A] border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                
                {/* 1. Add Transfer Button */}
                <button
                  onClick={() => handleOpenAddTransfer(s.profile)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                  title="إضافة وتوثيق حوالة مرسلة للتاجر"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                  <span>+ حوالة</span>
                </button>

                {/* 2. Add Purchase / Goods Button */}
                <button
                  onClick={() => handleOpenAddPurchase(s.profile)}
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                  title="إضافة فاتورة شراء بضائع وقطع غيار"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ شراء بضاعة</span>
                </button>

                {/* 3. Account Statement Modal Button */}
                <button
                  onClick={() => {
                    setSelectedSupplierName(s.profile.name);
                    setStatementModalSupplier(s.profile);
                  }}
                  className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                  title="عرض كشف حساب تفصيلي بجميع الحركات"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>كشف حساب</span>
                </button>

                {/* 4. WhatsApp Statement Button */}
                <button
                  onClick={() => handleSendWhatsAppStatement(s)}
                  className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                  title="إرسال كشف حساب مطابقة عبر الواتساب للتاجر"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>واتساب</span>
                </button>

              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Selected Supplier Transactions Table (Inline Explorer) */}
      {selectedSupplierStat && (
        <div className="bg-[#1E293B] rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse"></div>
              <div>
                <h3 className="font-bold text-white text-base">
                  سجل حركة وحوالات التاجر: <span className="text-indigo-400">{selectedSupplierStat.profile.name}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  إجمالي العمليات المقيدة: {selectedSupplierStat.transactionsCount} عملية
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => exportSelectedSupplierExcel(selectedSupplierStat.profile.name)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                title={`تصدير كشف حساب التاجر ${selectedSupplierStat.profile.name} إلى إكسيل`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير كشف التاجر (Excel)</span>
              </button>

              <button
                onClick={() => handleOpenAddTransfer(selectedSupplierStat.profile)}
                className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حوالة</span>
              </button>

              <button
                onClick={() => handleOpenAddPurchase(selectedSupplierStat.profile)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة شراء بضاعة</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-slate-300 border-b border-slate-700 font-bold">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">المصدر</th>
                  <th className="py-3 px-4">المبلغ المحول / المرسل</th>
                  <th className="py-3 px-4">المشتريات المستلمة المقابلة</th>
                  <th className="py-3 px-4">طريقة التحويل / السند</th>
                  <th className="py-3 px-4">البيان والملاحظات</th>
                  <th className="py-3 px-4 text-center">المستند</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {selectedSupplierStat.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      لا توجد عمليات مقيدة لهذا التاجر بعد. يمكنك إضافة حوالة أو شراء بضاعة بالأزرار أعلاه.
                    </td>
                  </tr>
                ) : (
                  selectedSupplierStat.transactions.map((t, index) => (
                    <tr key={t.id || index} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-500 font-mono-num">{index + 1}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono-num">{t.date}</td>
                      <td className="py-3 px-4">
                        {t.dayNumber ? (
                          <span className="bg-[#0F172A] text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            دفتر يوم {t.dayNumber}
                          </span>
                        ) : (
                          <span className="bg-[#0F172A] text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px]">
                            سند مباشر
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-sm font-bold text-rose-400">
                        {t.transferred > 0 ? `${formatNumber(t.transferred)} ر.ي` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-sm font-bold text-emerald-400">
                        {t.purchases > 0 ? `${formatNumber(t.purchases)} ر.ي` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-[#0F172A] text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px]">
                          {t.method}
                        </span>
                        {t.refNumber && (
                          <span className="mr-1 text-[10px] text-slate-400 font-mono-num">
                            #{t.refNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{t.notes || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        {t.imageUrl ? (
                          <button
                            onClick={() => {
                              setDocumentViewerData({
                                isOpen: true,
                                title: `مستند معاملة المورد: ${selectedSupplierStat.profile.name}`,
                                subtitle: `${t.date} - ${t.notes || t.method}`,
                                imageUrl: t.imageUrl,
                                onSave: () => {}
                              });
                            }}
                            className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500 hover:text-white transition cursor-pointer"
                            title="عرض صورة السند / الفاتورة"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#0F172A] font-black text-white text-xs border-t-2 border-slate-700">
                  <td colSpan={3} className="py-4 px-4 text-sm text-indigo-400">
                    الإجمالي العام للمورد ({selectedSupplierStat.profile.name})
                  </td>
                  <td className="py-4 px-4 font-mono-num text-base text-rose-400">
                    {formatNumber(selectedSupplierStat.totalTransferred)} ر.ي
                  </td>
                  <td className="py-4 px-4 font-mono-num text-base text-emerald-400">
                    {formatNumber(selectedSupplierStat.totalPurchases)} ر.ي
                  </td>
                  <td colSpan={3} className="py-4 px-4">
                    <span className={`font-bold font-mono-num text-sm ${
                      selectedSupplierStat.balance > 0 ? 'text-rose-400' : selectedSupplierStat.balance < 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      الصافي: {selectedSupplierStat.balance === 0 ? 'مسوى تماماً' : `${formatNumber(selectedSupplierStat.balance)} ر.ي`}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 6. Modal: Add / Edit Supplier Profile */}
      {isAddProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-[#1E293B] rounded-3xl border border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editingProfile ? 'تعديل بيانات التاجر / المورد' : 'إضافة تاجر ومورد جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddProfileModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم التاجر / المورد *</label>
                <input
                  type="text"
                  placeholder="مثال: عمر القاسمي، خليل الأغبري..."
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الهاتف / الواتساب</label>
                  <input
                    type="tel"
                    placeholder="مثال: 777000111"
                    value={pPhone}
                    onChange={e => setPPhone(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none text-xs font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">نظام التعامل مع التاجر *</label>
                  <select
                    value={pDealingType}
                    onChange={e => setPDealingType(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none text-xs"
                  >
                    <option value="نقد ودين">نقد ودين (مختلط)</option>
                    <option value="نقد">نقد فقط (كاش)</option>
                    <option value="دين">آجل / دين</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الموقع / المدينة والسوق</label>
                  <input
                    type="text"
                    placeholder="مثال: صنعاء - شارع القصر / ذمار"
                    value={pLocation}
                    onChange={e => setPLocation(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">نوع التوريد والنشاط</label>
                  <select
                    value={pCategory}
                    onChange={e => setPCategory(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none text-xs"
                  >
                    <option value="قطع غيار">قطع غيار وشاشات</option>
                    <option value="رصيد وباقات">رصيد وباقات وتطبيقات</option>
                    <option value="إكسسوارات">إكسسوارات وجوالات</option>
                    <option value="جوالات">جوالات مستخدمة وجديدة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول طريقة التسليم أو الحسابات..."
                  value={pNotes}
                  onChange={e => setPNotes(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:border-indigo-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setIsAddProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md"
                >
                  {editingProfile ? 'حفظ التعديلات' : 'إضافة التاجر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Add Transfer to Supplier */}
      {isTransferModalOpen && activeSupplierForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-[#1E293B] rounded-3xl border border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  إرسال حوالة / دفعة للمورد: <span className="text-rose-400">{activeSupplierForAction.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المبلغ المحول (ر.ي) *</label>
                  <input
                    type="number"
                    placeholder="مثال: 50000"
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-rose-500/40 rounded-xl px-3.5 py-2.5 text-white font-mono-num font-bold text-sm focus:border-rose-400 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الحوالة</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-mono-num focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">طريقة التحويل / الصراف</label>
                  <select
                    value={txMethod}
                    onChange={e => setTxMethod(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none"
                  >
                    <option value="كريمي">حساب الكريمي</option>
                    <option value="جوالي">جوالي (شركة يمن موبايل)</option>
                    <option value="جيب">محفظة جيب</option>
                    <option value="صاحب المتر">مسلم يد بيد مع سائق المتر</option>
                    <option value="نقد">نقد مباشر (كاش بالمحل)</option>
                    <option value="عبر البرنامج">عبر البرنامج / تطبيق الرصيد</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم السند / الحوالة</label>
                  <input
                    type="text"
                    placeholder="مثال: #TR-9988"
                    value={txTransferNumber}
                    onChange={e => setTxTransferNumber(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono-num focus:outline-none"
                  />
                </div>
              </div>

              {/* Day selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">تقييد في اليومية</label>
                <select
                  value={txTargetDayId}
                  onChange={e => setTxTargetDayId(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                >
                  {days.map(d => (
                    <option key={d.id} value={d.id}>
                      يوم #{d.dayNumber} ({d.dayTitle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document upload */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">إرفاق صورة سند الحوالة / إشعار الصراف</label>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0F172A] border border-dashed border-slate-700 hover:border-indigo-500 cursor-pointer text-slate-400 hover:text-white transition">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>{txImage ? 'تم إرفاق صورة السند (اضغط للتغيير)' : 'رفع صورة إشعار أو سند الحوالة'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">البيان والملاحظات</label>
                <input
                  type="text"
                  placeholder="ملاحظات حول الحوالة..."
                  value={txNotes}
                  onChange={e => setTxNotes(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer shadow-md"
                >
                  حفظ وقيد الحوالة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Add Purchase / Invoice from Supplier */}
      {isPurchaseModalOpen && activeSupplierForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-[#1E293B] rounded-3xl border border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  قيد فاتورة شراء بضائع من: <span className="text-emerald-400">{activeSupplierForAction.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">قيمة المشتريات (ر.ي) *</label>
                  <input
                    type="number"
                    placeholder="مثال: 45000"
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-white font-mono-num font-bold text-sm focus:border-emerald-400 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الفاتورة</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-mono-num focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الفاتورة الورقية</label>
                <input
                  type="text"
                  placeholder="مثال: فاتورة #8820"
                  value={txInvoiceNumber}
                  onChange={e => setTxInvoiceNumber(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono-num focus:outline-none"
                />
              </div>

              {/* Target Day */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">تقييد في اليومية</label>
                <select
                  value={txTargetDayId}
                  onChange={e => setTxTargetDayId(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                >
                  {days.map(d => (
                    <option key={d.id} value={d.id}>
                      يوم #{d.dayNumber} ({d.dayTitle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document upload */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">إرفاق صورة الفاتورة الورقية أو سند الاستلام</label>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0F172A] border border-dashed border-slate-700 hover:border-emerald-500 cursor-pointer text-slate-400 hover:text-white transition">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{txImage ? 'تم إرفاق صورة الفاتورة (اضغط للتغيير)' : 'رفع صورة الفاتورة الورقية'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الأصناف والتفاصيل (البيان)</label>
                <textarea
                  rows={2}
                  placeholder="مثال: 5 شاشات سامسونج A32 + 10 لصقات حماية..."
                  value={txNotes}
                  onChange={e => setTxNotes(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md"
                >
                  حفظ الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Modal: Printable / Full Account Statement Modal */}
      {statementModalSupplier && selectedSupplierStat && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-[#1E293B] rounded-3xl border border-slate-700 w-full max-w-3xl p-6 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    كشف حساب ومطابقة مالية: {selectedSupplierStat.profile.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {SHOP_INFO.name} • {selectedSupplierStat.profile.location || 'ذمار'} • {selectedSupplierStat.profile.phone || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendWhatsAppStatement(selectedSupplierStat)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>إرسال واتساب</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>

                <button
                  onClick={() => setStatementModalSupplier(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Financial Summary Strip */}
            <div className="grid grid-cols-3 gap-3 text-center bg-[#0F172A] p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">إجمالي الحوالات المرسلة:</span>
                <strong className="text-base font-black text-rose-400 font-mono-num">
                  {formatNumber(selectedSupplierStat.totalTransferred)} ر.ي
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">إجمالي المشتريات المستلمة:</span>
                <strong className="text-base font-black text-emerald-400 font-mono-num">
                  {formatNumber(selectedSupplierStat.totalPurchases)} ر.ي
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">الرصيد الصافي المتبقي:</span>
                <strong className={`text-base font-black font-mono-num ${
                  selectedSupplierStat.balance > 0 ? 'text-rose-400' : selectedSupplierStat.balance < 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {selectedSupplierStat.balance === 0 ? 'مسوى (0)' : `${formatNumber(selectedSupplierStat.balance)} ر.ي`}
                </strong>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto max-h-80 border border-slate-700 rounded-2xl">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-slate-300 font-bold sticky top-0">
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">المبلغ المحول</th>
                    <th className="py-2.5 px-3">المشتريات المستلمة</th>
                    <th className="py-2.5 px-3">طريقة التحويل</th>
                    <th className="py-2.5 px-3">البيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 bg-[#1E293B]">
                  {selectedSupplierStat.transactions.map((t, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono-num text-slate-300">{t.date}</td>
                      <td className="py-2.5 px-3 font-mono-num font-bold text-rose-400">
                        {t.transferred > 0 ? `${formatNumber(t.transferred)} ر.ي` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-bold text-emerald-400">
                        {t.purchases > 0 ? `${formatNumber(t.purchases)} ر.ي` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{t.method}</td>
                      <td className="py-2.5 px-3 text-slate-200">{t.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setStatementModalSupplier(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
              >
                إغلاق الكشف
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 10. Document Viewer Modal */}
      <DocumentModal
        isOpen={documentViewerData.isOpen}
        onClose={() => setDocumentViewerData(prev => ({ ...prev, isOpen: false }))}
        title={documentViewerData.title}
        subtitle={documentViewerData.subtitle}
        imageUrl={documentViewerData.imageUrl}
        onSave={documentViewerData.onSave}
      />

    </div>
  );
};
