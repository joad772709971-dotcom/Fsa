import React, { useState } from 'react';
import { 
  DayRecord, 
  AccessoryItem, 
  PhoneItem, 
  MaintenanceItem, 
  ExpenseItem, 
  MusabItem, 
  WorkerItem, 
  SupplierTransferItem, 
  ReturnItem,
  CustomerDebtItem,
  SupplierProfile,
  SHOP_INFO,
  SHOP_POLICIES
} from '../types';
import { calculateDay, formatNumber } from '../utils/accounting';
import { 
  ShoppingBag, 
  Smartphone, 
  Wrench, 
  Zap, 
  RotateCcw, 
  Receipt, 
  Home, 
  UserCheck, 
  Truck, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Layers,
  PlusCircle,
  Coins,
  ChevronDown,
  ChevronUp,
  Filter,
  Eye,
  SlidersHorizontal,
  FileText,
  MessageSquare,
  Send,
  Camera,
  User,
  Phone,
  ShieldCheck,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { QuickEntryModal, QuickEntryType } from './QuickEntryModal';
import { DocumentModal } from './DocumentModal';
import { EditItemModal, EditItemData } from './EditItemModal';
import { openWhatsApp, buildCustomerInvoiceMessage, buildGuarantorAlertMessage } from '../utils/messaging';
import { exportSingleDayToExcel, exportToExcel } from '../utils/excelExport';

interface DayDetailViewProps {
  day: DayRecord;
  allDays?: DayRecord[];
  onUpdateDay: (updatedDay: DayRecord) => void;
  onEditDayMeta?: () => void;
  onAddDebt?: (debt: CustomerDebtItem) => void;
  onAddSupplierProfile?: (profile: SupplierProfile) => void;
  supplierProfiles?: SupplierProfile[];
}

export const DayDetailView: React.FC<DayDetailViewProps> = ({
  day,
  allDays = [],
  onUpdateDay,
  onEditDayMeta,
  onAddDebt,
  onAddSupplierProfile,
  supplierProfiles = [],
}) => {
  const calc = calculateDay(day);

  // Section Filter State
  const [sectionFilter, setSectionFilter] = useState<'all' | 'income' | 'recharge' | 'expenses' | 'accounts'>('all');

  // Quick Modal State
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [quickModalType, setQuickModalType] = useState<QuickEntryType>('income_acc');

  const openQuickModal = (type: QuickEntryType) => {
    setQuickModalType(type);
    setIsQuickModalOpen(true);
  };

  // Quick Inline Add State
  const [activeModalSection, setActiveModalSection] = useState<string | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<EditItemData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Document Modal State
  const [documentModalData, setDocumentModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    whatsappMessage?: string;
    customerPhone?: string;
    onSave: (url: string | undefined) => void;
  }>({
    isOpen: false,
    title: '',
    onSave: () => {}
  });

  // Quick inputs for inline forms
  const [accName, setAccName] = useState('');
  const [accPrice, setAccPrice] = useState('');

  const [phoneModel, setPhoneModel] = useState('');
  const [phoneSalePrice, setPhoneSalePrice] = useState('');
  const [phonePaid, setPhonePaid] = useState('');
  const [phoneGuarantor, setPhoneGuarantor] = useState('');

  const [maintName, setMaintName] = useState('');
  const [maintPrice, setMaintPrice] = useState('');
  const [maintType, setMaintType] = useState<MaintenanceItem['type']>('شاشات');

  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseItem['category']>('صرفة المحل');
  const [expDesc, setExpDesc] = useState('');

  const [musabAmount, setMusabAmount] = useState('');
  const [musabDesc, setMusabDesc] = useState('');
  const [musabType, setMusabType] = useState<'بيت مصعب' | 'مصعب شخصياً'>('بيت مصعب');

  const [workerName, setWorkerName] = useState<'حمدان' | 'المهندس'>('حمدان');
  const [workerAmount, setWorkerAmount] = useState('');
  const [workerType, setWorkerType] = useState<'صرفة' | 'حساب'>('صرفة');

  const [suppName, setSuppName] = useState<SupplierTransferItem['supplierName']>('عمر القاسمي');
  const [suppAmount, setSuppAmount] = useState('');
  const [suppPurchases, setSuppPurchases] = useState('');
  const [suppNotes, setSuppNotes] = useState('');

  const [returnTitle, setReturnTitle] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [returnType, setReturnType] = useState<ReturnItem['returnType']>('مرتجع زبون');

  // Add Item Handlers
  const handleAddAccessory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accPrice) return;
    const newItem: AccessoryItem = {
      id: `acc-${Date.now()}`,
      name: accName,
      price: Number(accPrice) || 0,
    };
    onUpdateDay({
      ...day,
      accessories: [...(day.accessories || []), newItem],
    });
    setAccName('');
    setAccPrice('');
    setActiveModalSection(null);
  };

  const handleAddPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneModel || !phoneSalePrice) return;
    const price = Number(phoneSalePrice) || 0;
    const paid = Number(phonePaid) || price;
    const remaining = price > paid ? price - paid : 0;
    const newItem: PhoneItem = {
      id: `phone-${Date.now()}`,
      model: phoneModel,
      salePrice: price,
      paidAmount: paid,
      remainingAmount: remaining,
      guarantor: phoneGuarantor || undefined,
      status: remaining > 0 ? 'متبقي آجل' : 'تم الدفع بالكامل',
    };
    onUpdateDay({
      ...day,
      phones: [...(day.phones || []), newItem],
    });
    setPhoneModel('');
    setPhoneSalePrice('');
    setPhonePaid('');
    setPhoneGuarantor('');
    setActiveModalSection(null);
  };

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintName || !maintPrice) return;
    const newItem: MaintenanceItem = {
      id: `maint-${Date.now()}`,
      deviceOrService: maintName,
      price: Number(maintPrice) || 0,
      type: maintType,
      status: 'خالص',
    };
    onUpdateDay({
      ...day,
      maintenance: [...(day.maintenance || []), newItem],
    });
    setMaintName('');
    setMaintPrice('');
    setActiveModalSection(null);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !expDesc) return;
    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      amount: Number(expAmount) || 0,
      category: expCategory,
      description: expDesc,
    };
    onUpdateDay({
      ...day,
      expenses: [...(day.expenses || []), newItem],
    });
    setExpAmount('');
    setExpDesc('');
    setActiveModalSection(null);
  };

  const handleAddMusab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!musabAmount) return;
    const newItem: MusabItem = {
      id: `musab-${Date.now()}`,
      amount: Number(musabAmount) || 0,
      description: musabDesc || (musabType === 'بيت مصعب' ? 'سحب لبيت مصعب' : 'مصاريف مصعب'),
      type: musabType,
    };
    if (musabType === 'بيت مصعب') {
      onUpdateDay({
        ...day,
        musabHouse: [...(day.musabHouse || []), newItem],
      });
    } else {
      onUpdateDay({
        ...day,
        musabPersonal: [...(day.musabPersonal || []), newItem],
      });
    }
    setMusabAmount('');
    setMusabDesc('');
    setActiveModalSection(null);
  };

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerAmount) return;
    const newItem: WorkerItem = {
      id: `worker-${Date.now()}`,
      workerName,
      amount: Number(workerAmount) || 0,
      type: workerType,
      description: `${workerType} ${workerName}`,
    };
    onUpdateDay({
      ...day,
      workers: [...(day.workers || []), newItem],
    });
    setWorkerAmount('');
    setActiveModalSection(null);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppAmount) return;
    const sent = Number(suppAmount) || 0;
    const purchases = suppPurchases ? Number(suppPurchases) : sent;
    const newItem: SupplierTransferItem = {
      id: `supp-${Date.now()}`,
      supplierName: suppName,
      amountSent: sent,
      purchasesReceivedValue: purchases,
      notes: suppNotes,
    };
    onUpdateDay({
      ...day,
      supplierTransfers: [...(day.supplierTransfers || []), newItem],
    });
    setSuppAmount('');
    setSuppPurchases('');
    setSuppNotes('');
    setActiveModalSection(null);
  };

  const handleAddReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTitle || !returnAmount) return;
    const newItem: ReturnItem = {
      id: `ret-${Date.now()}`,
      title: returnTitle,
      amount: Number(returnAmount) || 0,
      returnType,
    };
    onUpdateDay({
      ...day,
      returns: [...(day.returns || []), newItem],
    });
    setReturnTitle('');
    setReturnAmount('');
    setActiveModalSection(null);
  };

  // Delete helpers (directly delete and update state to ensure responsiveness across all devices and iframes)
  const deleteAccessory = (id: string) => {
    onUpdateDay({ ...day, accessories: (day.accessories || []).filter(i => i.id !== id) });
  };
  const deletePhone = (id: string) => {
    onUpdateDay({ ...day, phones: (day.phones || []).filter(i => i.id !== id) });
  };
  const deleteMaintenance = (id: string) => {
    onUpdateDay({ ...day, maintenance: (day.maintenance || []).filter(i => i.id !== id) });
  };
  const deleteExpense = (id: string) => {
    onUpdateDay({ ...day, expenses: (day.expenses || []).filter(i => i.id !== id) });
  };
  const deleteMusabHouse = (id: string) => {
    onUpdateDay({ ...day, musabHouse: (day.musabHouse || []).filter(i => i.id !== id) });
  };
  const deleteMusabPersonal = (id: string) => {
    onUpdateDay({ ...day, musabPersonal: (day.musabPersonal || []).filter(i => i.id !== id) });
  };
  const deleteWorker = (id: string) => {
    onUpdateDay({ ...day, workers: (day.workers || []).filter(i => i.id !== id) });
  };
  const deleteSupplierTransfer = (id: string) => {
    onUpdateDay({ ...day, supplierTransfers: (day.supplierTransfers || []).filter(i => i.id !== id) });
  };
  const deleteReturn = (id: string) => {
    onUpdateDay({ ...day, returns: (day.returns || []).filter(i => i.id !== id) });
  };
  const deleteRechargeHadi = () => {
    onUpdateDay({ ...day, recharge: { ...day.recharge, hadi: undefined } });
  };
  const deleteRechargeQimmah = () => {
    onUpdateDay({ ...day, recharge: { ...day.recharge, qimmah: undefined } });
  };

  // Handle Save from Edit Modal
  const handleSaveEditedItem = (updated: EditItemData) => {
    if (updated.section === 'accessories') {
      const list = (day.accessories || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            name: updated.title,
            price: updated.amount,
            cost: updated.cost,
            profit: updated.profit,
            customerName: updated.customerName,
            customerPhone: updated.customerPhone,
            saleType: updated.saleType,
            guarantorName: updated.guarantorName,
            guarantorPhone: updated.guarantorPhone,
            workplace: updated.workplace,
            dueDate: updated.dueDate,
            dueTime: updated.dueTime,
            imageUrl: updated.imageUrl,
            notes: updated.notes
          };
        }
        return i;
      });
      onUpdateDay({ ...day, accessories: list });
    } else if (updated.section === 'phones') {
      const list = (day.phones || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            model: updated.title,
            salePrice: updated.amount,
            cost: updated.cost,
            profit: updated.profit,
            paidAmount: updated.paidAmount !== undefined ? updated.paidAmount : updated.amount,
            remainingAmount: updated.remainingAmount !== undefined ? updated.remainingAmount : 0,
            buyerName: updated.customerName,
            customerPhone: updated.customerPhone,
            saleType: updated.saleType,
            guarantor: updated.guarantorName,
            guarantorPhone: updated.guarantorPhone,
            workplace: updated.workplace,
            dueDate: updated.dueDate,
            dueTime: updated.dueTime,
            imageUrl: updated.imageUrl,
            notes: updated.notes,
            status: (updated.remainingAmount && updated.remainingAmount > 0) ? ('متبقي آجل' as const) : ('تم الدفع بالكامل' as const)
          };
        }
        return i;
      });
      onUpdateDay({ ...day, phones: list });
    } else if (updated.section === 'maintenance') {
      const list = (day.maintenance || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            deviceOrService: updated.title,
            price: updated.amount,
            cost: updated.cost,
            profit: updated.profit,
            customerName: updated.customerName,
            customerPhone: updated.customerPhone,
            saleType: updated.saleType,
            guarantorName: updated.guarantorName,
            guarantorPhone: updated.guarantorPhone,
            workplace: updated.workplace,
            dueDate: updated.dueDate,
            dueTime: updated.dueTime,
            imageUrl: updated.imageUrl,
            notes: updated.notes
          };
        }
        return i;
      });
      onUpdateDay({ ...day, maintenance: list });
    } else if (updated.section === 'expenses') {
      const list = (day.expenses || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            description: updated.title,
            amount: updated.amount,
            recipient: updated.customerName,
            invoiceNumber: updated.invoiceNumber,
            imageUrl: updated.imageUrl,
            notes: updated.notes
          };
        }
        return i;
      });
      onUpdateDay({ ...day, expenses: list });
    } else if (updated.section === 'musabHouse') {
      const list = (day.musabHouse || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            description: updated.title,
            amount: updated.amount,
            imageUrl: updated.imageUrl,
            notes: updated.notes
          };
        }
        return i;
      });
      onUpdateDay({ ...day, musabHouse: list });
    } else if (updated.section === 'musabPersonal') {
      const list = (day.musabPersonal || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            description: updated.title,
            amount: updated.amount,
            imageUrl: updated.imageUrl,
            notes: updated.notes
          };
        }
        return i;
      });
      onUpdateDay({ ...day, musabPersonal: list });
    } else if (updated.section === 'workers') {
      const list = (day.workers || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            description: updated.title,
            amount: updated.amount,
            workerName: updated.workerName || i.workerName,
            imageUrl: updated.imageUrl,
            notes: updated.notes
          };
        }
        return i;
      });
      onUpdateDay({ ...day, workers: list });
    } else if (updated.section === 'supplierTransfers') {
      const list = (day.supplierTransfers || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            supplierName: (updated.supplierName as any) || i.supplierName,
            amountSent: updated.amount,
            purchasesReceivedValue: updated.purchasesReceivedValue !== undefined ? updated.purchasesReceivedValue : updated.amount,
            transferMethod: (updated.transferMethod as any) || i.transferMethod,
            invoiceNumber: updated.invoiceNumber,
            imageUrl: updated.imageUrl,
            notes: updated.notes
          };
        }
        return i;
      });
      onUpdateDay({ ...day, supplierTransfers: list });
    } else if (updated.section === 'returns') {
      const list = (day.returns || []).map(i => {
        if (i.id === updated.id) {
          return {
            ...i,
            title: updated.title,
            amount: updated.amount,
            party: updated.customerName,
            customerPhone: updated.customerPhone,
            imageUrl: updated.imageUrl,
            notes: updated.notes
          };
        }
        return i;
      });
      onUpdateDay({ ...day, returns: list });
    }
  };

  // Helper to open Document Modal
  const openDocumentViewer = (
    title: string,
    subtitle: string,
    imageUrl: string | undefined,
    onSave: (url: string | undefined) => void,
    whatsappMessage?: string,
    customerPhone?: string
  ) => {
    setDocumentModalData({
      isOpen: true,
      title,
      subtitle,
      imageUrl,
      whatsappMessage,
      customerPhone,
      onSave
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Day Banner & Header */}
      <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-bold tracking-wide">
              اليوم #{day.dayNumber}
            </span>
            <h2 className="text-2xl font-bold text-white">{day.dayTitle}</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
              {SHOP_INFO.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            سجل العمليات اليومية، السندات، الفواتير الورقية، والتعديل والحذف المباشر
          </p>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToExcel(allDays && allDays.length > 0 ? allDays : [day])}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            title="تصدير كشف شامل لجميع الأيام في ملف إكسل واحد (كل يوم في صفحة منفصلة + صفحة التقرير المالي الشامل مع معادلات تفاعلية)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير جميع الأيام بملف واحد (Excel)</span>
          </button>

          <button
            onClick={() => exportSingleDayToExcel(day)}
            className="px-3 py-2 bg-[#0F172A] hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title={`تصدير كشف يوم ${day.dayNumber} فقط بكافة تفاصيله إلى إكسيل`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>كشف هذا اليوم فقط</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>

          <button
            onClick={() => openQuickModal('income_acc')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ عملية جديدة</span>
          </button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="bg-[#1E293B] p-2.5 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setSectionFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                sectionFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-[#0F172A] hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              🌟 كل الأقسام (9)
            </button>

            <button
              onClick={() => setSectionFilter('income')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                sectionFilter === 'income'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-[#0F172A] hover:bg-slate-800 text-emerald-300 border-slate-700'
              }`}
            >
              🟢 المبيعات والدخل (3)
            </button>

            <button
              onClick={() => setSectionFilter('recharge')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                sectionFilter === 'recharge'
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                  : 'bg-[#0F172A] hover:bg-slate-800 text-sky-300 border-slate-700'
              }`}
            >
              ⚡ الرصيد والتطبيقات (1)
            </button>

            <button
              onClick={() => setSectionFilter('expenses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                sectionFilter === 'expenses'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : 'bg-[#0F172A] hover:bg-slate-800 text-rose-300 border-slate-700'
              }`}
            >
              🔴 المصروفات والخرج (2)
            </button>

            <button
              onClick={() => setSectionFilter('accounts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                sectionFilter === 'accounts'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                  : 'bg-[#0F172A] hover:bg-slate-800 text-amber-300 border-slate-700'
              }`}
            >
              🏠 الحسابات والتجار (3)
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. قسم مبيع الإكسسوارات والشرايح */}
        {(sectionFilter === 'all' || sectionFilter === 'income') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <ShoppingBag className="w-5 h-5" />
              <span>قسم مبيع الإكسسوارات والشرايح</span>
              <span className="text-xs bg-[#0F172A] text-slate-300 px-2 py-0.5 rounded-full font-normal">
                {day.accessories?.length || 0} صنف
              </span>
            </div>
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'acc' ? null : 'acc')}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صنف</span>
            </button>
          </div>

          {/* Inline Add Accessory Form */}
          {activeModalSection === 'acc' && (
            <form onSubmit={handleAddAccessory} className="p-4 bg-[#0F172A] border-b border-slate-700 flex flex-wrap gap-2 items-center text-sm no-print">
              <input
                type="text"
                placeholder="اسم الإكسسوار (مثال: لاصق شاشة، غلاف...)"
                value={accName}
                onChange={e => setAccName(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 min-w-[160px] text-xs focus:border-amber-500 focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="السعر (ر.ي)"
                value={accPrice}
                onChange={e => setAccPrice(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-28 text-xs font-mono-num focus:border-amber-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-400 cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          {/* Table / List */}
          <div className="p-4 flex-1 overflow-x-auto">
            {(!day.accessories || day.accessories.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">لا توجد مبيعات إكسسوارات مسجلة لهذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {day.accessories.map(item => {
                  const invoiceMsg = buildCustomerInvoiceMessage({
                    type: 'مبيع إكسسوار',
                    customerName: item.customerName,
                    customerPhone: item.customerPhone,
                    itemName: item.name,
                    totalAmount: item.price,
                    notes: item.notes
                  });

                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-sm group hover:bg-slate-700/30 px-2 rounded-lg transition">
                      <div className="flex-1 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                          <span className="text-slate-200 font-medium">{item.name}</span>
                          {item.saleType === 'دين' && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-bold">
                              دين
                            </span>
                          )}
                          {item.customerName && (
                            <span className="text-xs text-indigo-300 font-semibold">({item.customerName})</span>
                          )}
                          {item.imageUrl && (
                            <button
                              onClick={() => openDocumentViewer(
                                item.name,
                                `سند مبيع إكسسوار: ${item.name}`,
                                item.imageUrl,
                                (url) => {
                                  const updated = (day.accessories || []).map(a => a.id === item.id ? { ...a, imageUrl: url } : a);
                                  onUpdateDay({ ...day, accessories: updated });
                                },
                                invoiceMsg,
                                item.customerPhone
                              )}
                              className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-indigo-500/30 cursor-pointer"
                              title="عرض المستند المرفق"
                            >
                              <FileText className="w-3 h-3" />
                              <span>مستند</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                          {item.customerPhone && <span>📞 {item.customerPhone}</span>}
                          {item.guarantorName && <span className="text-amber-300">🤝 الضمين: {item.guarantorName}</span>}
                          {item.profit !== undefined && item.profit > 0 && (
                            <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              ربح: +{formatNumber(item.profit)} ر.ي
                            </span>
                          )}
                          {item.cost !== undefined && item.cost > 0 && (
                            <span className="text-slate-400">
                              (التكلفة: {formatNumber(item.cost)} ر.ي)
                            </span>
                          )}
                          {item.notes && <span>({item.notes})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-amber-400 font-bold font-mono-num ml-2">
                          {formatNumber(item.price)} <span className="text-[10px] text-slate-400 font-normal">ر.ي</span>
                        </span>

                        {/* WhatsApp button */}
                        <button
                          onClick={() => openWhatsApp(item.customerPhone, invoiceMsg)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                          title="إرسال فاتورة واتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Attach Document button */}
                        <button
                          onClick={() => openDocumentViewer(
                            item.name,
                            `إرفاق / عرض مستند: ${item.name}`,
                            item.imageUrl,
                            (url) => {
                              const updated = (day.accessories || []).map(a => a.id === item.id ? { ...a, imageUrl: url } : a);
                              onUpdateDay({ ...day, accessories: updated });
                            },
                            invoiceMsg,
                            item.customerPhone
                          )}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                          title="إرفاق / عرض المستند والسند الورقي"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingItem({
                              section: 'accessories',
                              id: item.id,
                              title: item.name,
                              amount: item.price,
                              cost: item.cost,
                              profit: item.profit,
                              customerName: item.customerName,
                              customerPhone: item.customerPhone,
                              saleType: item.saleType,
                              guarantorName: item.guarantorName,
                              guarantorPhone: item.guarantorPhone,
                              workplace: item.workplace,
                              dueDate: item.dueDate,
                              dueTime: item.dueTime,
                              imageUrl: item.imageUrl,
                              notes: item.notes
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteAccessory(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-400">إجمالي مبيع الإكسسوارات:</span>
            <span className="text-amber-400 font-mono-num text-base font-black">
              {formatNumber(calc.accessoriesTotal)} ر.ي
            </span>
          </div>
        </div>
        )}

        {/* 2. قسم الجوالات */}
        {(sectionFilter === 'all' || sectionFilter === 'income') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
              <Smartphone className="w-5 h-5" />
              <span>قسم مبيعات الجوالات</span>
              <span className="text-xs bg-[#0F172A] text-slate-300 px-2 py-0.5 rounded-full font-normal">
                {day.phones?.length || 0} جهاز
              </span>
            </div>
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'phone' ? null : 'phone')}
              className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة جوال</span>
            </button>
          </div>

          {/* Inline Add Phone Form */}
          {activeModalSection === 'phone' && (
            <form onSubmit={handleAddPhone} className="p-4 bg-[#0F172A] border-b border-slate-700 flex flex-wrap gap-2 items-center text-sm no-print">
              <input
                type="text"
                placeholder="نوع الجوال (مثال: جوال UMAX، سامسونج A11...)"
                value={phoneModel}
                onChange={e => setPhoneModel(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 min-w-[140px] text-xs focus:border-cyan-500 focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="سعر البيع"
                value={phoneSalePrice}
                onChange={e => setPhoneSalePrice(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-24 text-xs font-mono-num focus:border-cyan-500 focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="الواصل"
                value={phonePaid}
                onChange={e => setPhonePaid(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-24 text-xs font-mono-num focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="الضامن"
                value={phoneGuarantor}
                onChange={e => setPhoneGuarantor(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-28 text-xs focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-cyan-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-cyan-400 cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          {/* Table / List */}
          <div className="p-4 flex-1 overflow-x-auto">
            {(!day.phones || day.phones.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">لا توجد مبيعات جوالات مسجلة في هذا اليوم</p>
            ) : (
              <div className="space-y-2.5">
                {day.phones.map(phone => {
                  const invoiceMsg = buildCustomerInvoiceMessage({
                    type: 'بيع جوال',
                    customerName: phone.buyerName,
                    customerPhone: phone.customerPhone,
                    itemName: phone.model,
                    totalAmount: phone.salePrice,
                    paidAmount: phone.paidAmount,
                    remainingAmount: phone.remainingAmount,
                    saleType: phone.saleType,
                    guarantorName: phone.guarantor,
                    guarantorPhone: phone.guarantorPhone,
                    workplace: phone.workplace,
                    dueDate: phone.dueDate,
                    dueTime: phone.dueTime,
                    notes: phone.notes
                  });

                  return (
                    <div key={phone.id} className="p-3 bg-[#0F172A] border border-slate-700/60 rounded-xl flex items-start justify-between text-sm group hover:border-slate-600 transition">
                      <div className="flex-1 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{phone.model}</span>
                          {phone.remainingAmount && phone.remainingAmount > 0 ? (
                            <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                              آجل (متبقي)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                              خالص
                            </span>
                          )}
                          {phone.buyerName && (
                            <span className="text-xs text-indigo-300 font-semibold">({phone.buyerName})</span>
                          )}
                          {phone.imageUrl && (
                            <button
                              onClick={() => openDocumentViewer(
                                phone.model,
                                `سند بيع جوال: ${phone.model}`,
                                phone.imageUrl,
                                (url) => {
                                  const updated = (day.phones || []).map(p => p.id === phone.id ? { ...p, imageUrl: url } : p);
                                  onUpdateDay({ ...day, phones: updated });
                                },
                                invoiceMsg,
                                phone.customerPhone
                              )}
                              className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-indigo-500/30 cursor-pointer"
                              title="عرض السند المرفق"
                            >
                              <FileText className="w-3 h-3" />
                              <span>سند مرفق</span>
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                          <span>السعر: <strong className="text-slate-200 font-mono-num">{formatNumber(phone.salePrice)}</strong> ر.ي</span>
                          <span>الواصل: <strong className="text-emerald-400 font-mono-num">{formatNumber(phone.paidAmount)}</strong> ر.ي</span>
                          {phone.remainingAmount && phone.remainingAmount > 0 && (
                            <span>المتبقي: <strong className="text-rose-400 font-mono-num">{formatNumber(phone.remainingAmount)}</strong> ر.ي</span>
                          )}
                          {phone.profit !== undefined && phone.profit > 0 && (
                            <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              ربح: +{formatNumber(phone.profit)} ر.ي
                            </span>
                          )}
                          {phone.cost !== undefined && phone.cost > 0 && (
                            <span className="text-slate-400">
                              (رأس المال: {formatNumber(phone.cost)} ر.ي)
                            </span>
                          )}
                          {phone.guarantor && (
                            <span className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                              🤝 الضمين: {phone.guarantor} {phone.guarantorPhone ? `(${phone.guarantorPhone})` : ''}
                            </span>
                          )}
                          {phone.customerPhone && <span>📞 هاتف: {phone.customerPhone}</span>}
                          {phone.notes && <span className="text-slate-400">({phone.notes})</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {/* WhatsApp button */}
                        <button
                          onClick={() => openWhatsApp(phone.customerPhone, invoiceMsg)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                          title="إرسال فاتورة وضمانات واتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Attach Document button */}
                        <button
                          onClick={() => openDocumentViewer(
                            phone.model,
                            `إرفاق / عرض مستند: ${phone.model}`,
                            phone.imageUrl,
                            (url) => {
                              const updated = (day.phones || []).map(p => p.id === phone.id ? { ...p, imageUrl: url } : p);
                              onUpdateDay({ ...day, phones: updated });
                            },
                            invoiceMsg,
                            phone.customerPhone
                          )}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                          title="إرفاق / عرض المستند والسند الورقي"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingItem({
                              section: 'phones',
                              id: phone.id,
                              title: phone.model,
                              amount: phone.salePrice,
                              cost: phone.cost,
                              profit: phone.profit,
                              paidAmount: phone.paidAmount,
                              remainingAmount: phone.remainingAmount,
                              customerName: phone.buyerName,
                              customerPhone: phone.customerPhone,
                              saleType: phone.saleType,
                              guarantorName: phone.guarantor,
                              guarantorPhone: phone.guarantorPhone,
                              workplace: phone.workplace,
                              dueDate: phone.dueDate,
                              dueTime: phone.dueTime,
                              imageUrl: phone.imageUrl,
                              notes: phone.notes
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => deletePhone(phone.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-400">واصل الجوالات (النقد المستلم):</span>
            <span className="text-cyan-400 font-mono-num text-base font-black">
              {formatNumber(calc.phonesPaidTotal)} ر.ي
            </span>
          </div>
        </div>
        )}

        {/* 3. قسم خدمات الصيانة والبرمجة */}
        {(sectionFilter === 'all' || sectionFilter === 'income') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
              <Wrench className="w-5 h-5" />
              <span>قسم خدمات الصيانة والبرمجة</span>
              <span className="text-xs bg-[#0F172A] text-slate-300 px-2 py-0.5 rounded-full font-normal">
                {day.maintenance?.length || 0} عملية
              </span>
            </div>
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'maint' ? null : 'maint')}
              className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صيانة</span>
            </button>
          </div>

          {/* Inline Add Maintenance Form */}
          {activeModalSection === 'maint' && (
            <form onSubmit={handleAddMaintenance} className="p-4 bg-[#0F172A] border-b border-slate-700 flex flex-wrap gap-2 items-center text-sm no-print">
              <input
                type="text"
                placeholder="البيان (شاشة ستايل فور، بيت شحن، برمجة...)"
                value={maintName}
                onChange={e => setMaintName(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 min-w-[160px] text-xs focus:border-indigo-500 focus:outline-none"
                required
              />
              <select
                value={maintType}
                onChange={e => setMaintType(e.target.value as any)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="شاشات">شاشات</option>
                <option value="بيوت شحن وفلاتات">بيوت شحن وفلاتات</option>
                <option value="برمجة وفورمات">برمجة وفورمات</option>
                <option value="تفعيل 4G/Volte">تفعيل 4G/VoLTE</option>
                <option value="حسابات وتخطي">تخطي وحسابات FRP</option>
                <option value="آي سيات وتصليح">آي سيات وتصليح بورد</option>
                <option value="أخرى">أخرى</option>
              </select>
              <input
                type="number"
                placeholder="السعر (ر.ي)"
                value={maintPrice}
                onChange={e => setMaintPrice(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-24 text-xs font-mono-num focus:border-indigo-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500 cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          {/* Maintenance List */}
          <div className="p-4 flex-1 overflow-x-auto">
            {(!day.maintenance || day.maintenance.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">لا توجد عمليات صيانة مسجلة لهذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {day.maintenance.map(item => {
                  const invoiceMsg = buildCustomerInvoiceMessage({
                    type: 'صيانة وبرمجة',
                    customerName: item.customerName,
                    customerPhone: item.customerPhone,
                    itemName: item.deviceOrService,
                    totalAmount: item.price,
                    notes: item.notes
                  });

                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-sm group hover:bg-slate-700/30 px-2 rounded-lg transition">
                      <div className="flex-1 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-semibold">
                            {item.type || 'صيانة'}
                          </span>
                          <span className="text-slate-200 font-medium">{item.deviceOrService}</span>
                          {item.customerName && (
                            <span className="text-xs text-indigo-300 font-semibold">({item.customerName})</span>
                          )}
                          {item.imageUrl && (
                            <button
                              onClick={() => openDocumentViewer(
                                item.deviceOrService,
                                `سند صيانة: ${item.deviceOrService}`,
                                item.imageUrl,
                                (url) => {
                                  const updated = (day.maintenance || []).map(m => m.id === item.id ? { ...m, imageUrl: url } : m);
                                  onUpdateDay({ ...day, maintenance: updated });
                                },
                                invoiceMsg,
                                item.customerPhone
                              )}
                              className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-indigo-500/30 cursor-pointer"
                              title="عرض المستند المرفق"
                            >
                              <FileText className="w-3 h-3" />
                              <span>مستند</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                          {item.customerPhone && <span>📞 {item.customerPhone}</span>}
                          {item.guarantorName && <span className="text-amber-300">🤝 الضمين: {item.guarantorName}</span>}
                          {item.profit !== undefined && item.profit > 0 && (
                            <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              فائدة/أجر: +{formatNumber(item.profit)} ر.ي
                            </span>
                          )}
                          {item.cost !== undefined && item.cost > 0 && (
                            <span className="text-slate-400">
                              (قطع: {formatNumber(item.cost)} ر.ي)
                            </span>
                          )}
                          {item.notes && <span>({item.notes})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-indigo-400 font-bold font-mono-num ml-2">
                          {formatNumber(item.price)} <span className="text-[10px] text-slate-400 font-normal">ر.ي</span>
                        </span>

                        {/* WhatsApp button */}
                        <button
                          onClick={() => openWhatsApp(item.customerPhone, invoiceMsg)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                          title="إرسال فاتورة صيانة واتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Attach Document button */}
                        <button
                          onClick={() => openDocumentViewer(
                            item.deviceOrService,
                            `إرفاق / عرض مستند: ${item.deviceOrService}`,
                            item.imageUrl,
                            (url) => {
                              const updated = (day.maintenance || []).map(m => m.id === item.id ? { ...m, imageUrl: url } : m);
                              onUpdateDay({ ...day, maintenance: updated });
                            },
                            invoiceMsg,
                            item.customerPhone
                          )}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                          title="إرفاق / عرض المستند والسند الورقي"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingItem({
                              section: 'maintenance',
                              id: item.id,
                              title: item.deviceOrService,
                              amount: item.price,
                              cost: item.cost,
                              profit: item.profit,
                              categoryOrType: item.type,
                              customerName: item.customerName,
                              customerPhone: item.customerPhone,
                              saleType: item.saleType,
                              guarantorName: item.guarantorName,
                              guarantorPhone: item.guarantorPhone,
                              workplace: item.workplace,
                              dueDate: item.dueDate,
                              dueTime: item.dueTime,
                              imageUrl: item.imageUrl,
                              notes: item.notes
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteMaintenance(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-400">إجمالي خدمات الصيانة والبرمجة:</span>
            <span className="text-indigo-400 font-mono-num text-base font-black">
              {formatNumber(calc.maintenanceTotal)} ر.ي
            </span>
          </div>
        </div>
        )}

        {/* 4. قسم حركة ومبيعات الرصيد (الهادي والقمة) */}
        {(sectionFilter === 'all' || sectionFilter === 'recharge') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <Zap className="w-5 h-5" />
              <span>قسم مبيعات الرصيد والشرايح (الهادي والرقم)</span>
            </div>
            <button
              onClick={() => openQuickModal('recharge')}
              className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة رصيد</span>
            </button>
          </div>

          <div className="p-4 flex-1 space-y-4">
            
            {/* Hadi App Card */}
            <div className="p-3.5 bg-[#0F172A] border border-slate-700/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  <strong className="text-sky-300 text-sm">تطبيق الهادي</strong>
                  <span className="text-xs text-slate-400">(محمد مياس)</span>
                </div>
                <div className="flex items-center gap-2">
                  {day.recharge?.hadi?.remainingInApp ? (
                    <span className="text-xs bg-sky-950 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono-num font-semibold">
                      باقي بالتطبيق: {formatNumber(day.recharge.hadi.remainingInApp)} ر.ي
                    </span>
                  ) : null}
                  {day.recharge?.hadi && (
                    <button
                      onClick={deleteRechargeHadi}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="حذف حركة رصيد الهادي لهذا اليوم"
                      aria-label="حذف رصيد الهادي"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-[#1E293B] p-2 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 block">المبيع (مع الفائدة)</span>
                  <span className="font-bold text-emerald-400 font-mono-num text-sm">
                    {formatNumber(day.recharge?.hadi?.salesWithProfit || (day.recharge?.totalWithProfit ? day.recharge.totalWithProfit : 0))} ر.ي
                  </span>
                </div>
                <div className="bg-[#1E293B] p-2 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 block">المبيع (بدون فائدة)</span>
                  <span className="font-bold text-slate-300 font-mono-num text-sm">
                    {formatNumber(day.recharge?.hadi?.salesWithoutProfit || (day.recharge?.totalWithoutProfit ? day.recharge.totalWithoutProfit : 0))} ر.ي
                  </span>
                </div>
                <div className="bg-[#1E293B] p-2 rounded-lg border border-slate-700/50 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block">الربح المقدر</span>
                  <span className="font-bold text-amber-400 font-mono-num text-sm">
                    {formatNumber(
                      (day.recharge?.hadi?.salesWithProfit || day.recharge?.totalWithProfit || 0) -
                      (day.recharge?.hadi?.salesWithoutProfit || day.recharge?.totalWithoutProfit || 0)
                    )} ر.ي
                  </span>
                </div>
              </div>
              {day.recharge?.hadi?.notes && (
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                  {day.recharge.hadi.notes}
                </p>
              )}
            </div>

            {/* Raqam App Card */}
            <div className="p-3.5 bg-[#0F172A] border border-slate-700/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
                  <strong className="text-violet-300 text-sm">تطبيق الرقم</strong>
                  <span className="text-xs text-slate-400">(فايز أبو علي)</span>
                </div>
                <div className="flex items-center gap-2">
                  {day.recharge?.qimmah?.remainingInApp ? (
                    <span className="text-xs bg-violet-950 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded font-mono-num font-semibold">
                      باقي بالتطبيق: {formatNumber(day.recharge.qimmah.remainingInApp)} ر.ي
                    </span>
                  ) : null}
                  {day.recharge?.qimmah && (
                    <button
                      onClick={deleteRechargeQimmah}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="حذف حركة رصيد الرقم لهذا اليوم"
                      aria-label="حذف رصيد الرقم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {day.recharge?.qimmah ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-[#1E293B] p-2 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block">المبيع (مع الفائدة)</span>
                      <span className="font-bold text-emerald-400 font-mono-num text-sm">
                        {formatNumber(day.recharge.qimmah.salesWithProfit)} ر.ي
                      </span>
                    </div>
                    <div className="bg-[#1E293B] p-2 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block">المبيع (بدون فائدة)</span>
                      <span className="font-bold text-slate-300 font-mono-num text-sm">
                        {formatNumber(day.recharge.qimmah.salesWithoutProfit)} ر.ي
                      </span>
                    </div>
                    <div className="bg-[#1E293B] p-2 rounded-lg border border-slate-700/50 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block">شراء الشرايح</span>
                      <span className="font-bold text-violet-300 font-mono-num text-sm">
                        {day.recharge.qimmah.simPurchases ? `${day.recharge.qimmah.simPurchases.count} شرايح` : '—'}
                      </span>
                    </div>
                  </div>
                  {day.recharge.qimmah.notes && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                      {day.recharge.qimmah.notes}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500">تم تسجيل إجمالي الرصيد ضمن الإيراد العام الموحد لهذا اليوم</p>
              )}
            </div>

          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-400">إجمالي مبيع الرصيد (مع الفائدة):</span>
            <span className="text-emerald-400 font-mono-num text-base font-black">
              {formatNumber(calc.rechargeSalesWithProfit)} ر.ي
            </span>
          </div>
        </div>
        )}

        {/* 5. قسم المرتجعات */}
        {(sectionFilter === 'all' || sectionFilter === 'expenses') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <RotateCcw className="w-5 h-5" />
              <span>قسم المرتجعات</span>
              <span className="text-xs bg-[#0F172A] text-slate-300 px-2 py-0.5 rounded-full font-normal">
                {day.returns?.length || 0} مرتجع
              </span>
            </div>
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'ret' ? null : 'ret')}
              className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مرتجع</span>
            </button>
          </div>

          {/* Inline Add Return Form */}
          {activeModalSection === 'ret' && (
            <form onSubmit={handleAddReturn} className="p-4 bg-[#0F172A] border-b border-slate-700 flex flex-wrap gap-2 items-center text-sm no-print">
              <input
                type="text"
                placeholder="البيان (مرتجع جوال يوماكس، شاشة ستايل 6...)"
                value={returnTitle}
                onChange={e => setReturnTitle(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 min-w-[160px] text-xs focus:border-rose-500 focus:outline-none"
                required
              />
              <select
                value={returnType}
                onChange={e => setReturnType(e.target.value as any)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-rose-500 focus:outline-none"
              >
                <option value="مرتجع زبون">مرتجع زبون</option>
                <option value="مرتجع لتاجر">مرتجع لتاجر</option>
                <option value="مسلم لمصعب">مسلم لمصعب</option>
              </select>
              <input
                type="number"
                placeholder="المبلغ (ر.ي)"
                value={returnAmount}
                onChange={e => setReturnAmount(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-24 text-xs font-mono-num focus:border-rose-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-400 cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          {/* Returns List */}
          <div className="p-4 flex-1 overflow-x-auto">
            {(!day.returns || day.returns.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">لا توجد مرتجعات في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {day.returns.map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-sm group hover:bg-slate-700/30 px-2 rounded-lg transition">
                    <div className="flex-1 pr-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-semibold">
                          {item.returnType}
                        </span>
                        <span className="text-slate-200 font-medium">{item.title}</span>
                        {item.party && <span className="text-xs text-slate-400">({item.party})</span>}
                        {item.imageUrl && (
                          <button
                            onClick={() => openDocumentViewer(
                              item.title,
                              `مستند المرتجع: ${item.title}`,
                              item.imageUrl,
                              (url) => {
                                const updated = (day.returns || []).map(r => r.id === item.id ? { ...r, imageUrl: url } : r);
                                onUpdateDay({ ...day, returns: updated });
                              }
                            )}
                            className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-indigo-500/30 cursor-pointer"
                            title="عرض المستند"
                          >
                            <FileText className="w-3 h-3" />
                            <span>مستند</span>
                          </button>
                        )}
                      </div>
                      {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-rose-400 font-bold font-mono-num ml-2">
                        {formatNumber(item.amount)} <span className="text-[10px] text-slate-400 font-normal">ر.ي</span>
                      </span>

                      {/* Attach Document button */}
                      <button
                        onClick={() => openDocumentViewer(
                          item.title,
                          `إرفاق / عرض مستند: ${item.title}`,
                          item.imageUrl,
                          (url) => {
                            const updated = (day.returns || []).map(r => r.id === item.id ? { ...r, imageUrl: url } : r);
                            onUpdateDay({ ...day, returns: updated });
                          }
                        )}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                        title="إرفاق / عرض المستند"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingItem({
                            section: 'returns',
                            id: item.id,
                            title: item.title,
                            amount: item.amount,
                            categoryOrType: item.returnType,
                            customerName: item.party,
                            customerPhone: item.customerPhone,
                            imageUrl: item.imageUrl,
                            notes: item.notes
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteReturn(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-400">إجمالي المرتجعات:</span>
            <span className="text-rose-400 font-mono-num text-base font-black">
              {formatNumber(calc.returnsTotal)} ر.ي
            </span>
          </div>
        </div>
        )}

        {/* 6. قسم المصروفات وفواتير المشتريات الخارجية */}
        {(sectionFilter === 'all' || sectionFilter === 'expenses') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Receipt className="w-5 h-5" />
              <span>المصروفات وفواتير المشتريات الخارجية</span>
              <span className="text-xs bg-[#0F172A] text-slate-300 px-2 py-0.5 rounded-full font-normal">
                {day.expenses?.length || 0} بند
              </span>
            </div>
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'exp' ? null : 'exp')}
              className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صرفة</span>
            </button>
          </div>

          {/* Inline Add Expense Form */}
          {activeModalSection === 'exp' && (
            <form onSubmit={handleAddExpense} className="p-4 bg-[#0F172A] border-b border-slate-700 flex flex-wrap gap-2 items-center text-sm no-print">
              <input
                type="text"
                placeholder="البيان (صرفة المحل، عشاء، كراء المتر...)"
                value={expDesc}
                onChange={e => setExpDesc(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 min-w-[160px] text-xs focus:border-rose-500 focus:outline-none"
                required
              />
              <select
                value={expCategory}
                onChange={e => setExpCategory(e.target.value as any)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-rose-500 focus:outline-none"
              >
                <option value="صرفة المحل">صرفة المحل</option>
                <option value="مشاوير وتوصيل">مشاوير وتوصيل</option>
                <option value="مودم واشتراكات">مودم وفواتير</option>
                <option value="أدوات ومعدات">أدوات ومعدات صيانة</option>
                <option value="أخرى">أخرى</option>
              </select>
              <input
                type="number"
                placeholder="المبلغ (ر.ي)"
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-24 text-xs font-mono-num focus:border-rose-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-400 cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          {/* Expenses List */}
          <div className="p-4 flex-1 overflow-x-auto">
            {(!day.expenses || day.expenses.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">لا توجد مصروفات إضافية مسجلة لهذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {day.expenses.map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-sm group hover:bg-slate-700/30 px-2 rounded-lg transition">
                    <div className="flex-1 pr-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-[#0F172A] text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span className="text-slate-200 font-medium">{item.description}</span>
                        {item.recipient && <span className="text-xs text-slate-400">({item.recipient})</span>}
                        {item.invoiceNumber && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono-num">
                            سند #{item.invoiceNumber}
                          </span>
                        )}
                        {item.imageUrl && (
                          <button
                            onClick={() => openDocumentViewer(
                              item.description,
                              `سند المصروف / الفاتورة الخارجية: ${item.description}`,
                              item.imageUrl,
                              (url) => {
                                const updated = (day.expenses || []).map(exp => exp.id === item.id ? { ...exp, imageUrl: url } : exp);
                                onUpdateDay({ ...day, expenses: updated });
                              }
                            )}
                            className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-indigo-500/30 cursor-pointer"
                            title="عرض سند المصروف المرفق"
                          >
                            <FileText className="w-3 h-3" />
                            <span>سند مرفق</span>
                          </button>
                        )}
                      </div>
                      {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-rose-400 font-bold font-mono-num ml-2">
                        {formatNumber(item.amount)} <span className="text-[10px] text-slate-400 font-normal">ر.ي</span>
                      </span>

                      {/* Attach Document button */}
                      <button
                        onClick={() => openDocumentViewer(
                          item.description,
                          `إرفاق / عرض سند وفاتورة خارجية: ${item.description}`,
                          item.imageUrl,
                          (url) => {
                            const updated = (day.expenses || []).map(exp => exp.id === item.id ? { ...exp, imageUrl: url } : exp);
                            onUpdateDay({ ...day, expenses: updated });
                          }
                        )}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                        title="إرفاق / عرض السند الورقي"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingItem({
                            section: 'expenses',
                            id: item.id,
                            title: item.description,
                            amount: item.amount,
                            categoryOrType: item.category,
                            customerName: item.recipient,
                            invoiceNumber: item.invoiceNumber,
                            imageUrl: item.imageUrl,
                            notes: item.notes
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteExpense(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-400">إجمالي المصروفات العامة:</span>
            <span className="text-rose-400 font-mono-num text-base font-black">
              {formatNumber(calc.expensesTotal)} ر.ي
            </span>
          </div>
        </div>
        )}

        {/* 7. قسم حساب بيت مصعب ومصعب (مفصول تماماً) */}
        {(sectionFilter === 'all' || sectionFilter === 'accounts') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <Home className="w-5 h-5" />
              <span>قسم حساب بيت مصعب ومصعب (مفصول)</span>
            </div>
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'musab' ? null : 'musab')}
              className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة سحب</span>
            </button>
          </div>

          {/* Inline Add Musab Form */}
          {activeModalSection === 'musab' && (
            <form onSubmit={handleAddMusab} className="p-4 bg-[#0F172A] border-b border-slate-700 flex flex-wrap gap-2 items-center text-sm no-print">
              <select
                value={musabType}
                onChange={e => setMusabType(e.target.value as any)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-emerald-500 focus:outline-none font-bold"
              >
                <option value="بيت مصعب">حساب بيت مصعب</option>
                <option value="مصعب شخصياً">مصعب شخصياً / باقات</option>
              </select>
              <input
                type="text"
                placeholder="البيان (سحب نقد، باقة مزايا، فلاتة...)"
                value={musabDesc}
                onChange={e => setMusabDesc(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 min-w-[140px] text-xs focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="المبلغ (ر.ي)"
                value={musabAmount}
                onChange={e => setMusabAmount(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-24 text-xs font-mono-num focus:border-emerald-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-400 cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          {/* List */}
          <div className="p-4 flex-1 space-y-3">
            
            {/* Musab House Sub-list */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-300 block">١. مسحوبات بيت مصعب:</span>
              {(!day.musabHouse || day.musabHouse.length === 0) ? (
                <p className="text-xs text-slate-500 pr-2">لا يوجد سحب لبيت مصعب في هذا اليوم</p>
              ) : (
                day.musabHouse.map(mh => (
                  <div key={mh.id} className="py-2 px-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs group hover:bg-emerald-950/50 transition">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-200 font-medium">{mh.description}</span>
                      {mh.imageUrl && (
                        <button
                          onClick={() => openDocumentViewer(
                            mh.description,
                            `سند بيت مصعب: ${mh.description}`,
                            mh.imageUrl,
                            (url) => {
                              const updated = (day.musabHouse || []).map(m => m.id === mh.id ? { ...m, imageUrl: url } : m);
                              onUpdateDay({ ...day, musabHouse: updated });
                            }
                          )}
                          className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-emerald-500/30 cursor-pointer"
                          title="عرض المستند"
                        >
                          <FileText className="w-3 h-3" />
                          <span>سند</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-300 font-mono-num ml-2">{formatNumber(mh.amount)} ر.ي</span>
                      
                      {/* Attach Document */}
                      <button
                        onClick={() => openDocumentViewer(
                          mh.description,
                          `إرفاق / عرض مستند: ${mh.description}`,
                          mh.imageUrl,
                          (url) => {
                            const updated = (day.musabHouse || []).map(m => m.id === mh.id ? { ...m, imageUrl: url } : m);
                            onUpdateDay({ ...day, musabHouse: updated });
                          }
                        )}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-400 cursor-pointer"
                        title="إرفاق / عرض المستند"
                      >
                        <Camera className="w-3 h-3" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditingItem({
                            section: 'musabHouse',
                            id: mh.id,
                            title: mh.description,
                            amount: mh.amount,
                            imageUrl: mh.imageUrl,
                            notes: mh.notes
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteMusabHouse(mh.id)}
                        className="p-1 rounded-md bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Musab Personal Sub-list */}
            <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
              <span className="text-xs font-bold text-amber-300 block">٢. مصعب شخصياً / باقات وتسليمات:</span>
              {(!day.musabPersonal || day.musabPersonal.length === 0) ? (
                <p className="text-xs text-slate-500 pr-2">لا توجد مصاريف شخصية أو باقات لمصعب في هذا اليوم</p>
              ) : (
                day.musabPersonal.map(mp => (
                  <div key={mp.id} className="py-2 px-2.5 bg-amber-950/30 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs group hover:bg-amber-950/50 transition">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-200 font-medium">{mp.description}</span>
                      {mp.imageUrl && (
                        <button
                          onClick={() => openDocumentViewer(
                            mp.description,
                            `سند مصعب شخصياً: ${mp.description}`,
                            mp.imageUrl,
                            (url) => {
                              const updated = (day.musabPersonal || []).map(m => m.id === mp.id ? { ...m, imageUrl: url } : m);
                              onUpdateDay({ ...day, musabPersonal: updated });
                            }
                          )}
                          className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer"
                          title="عرض المستند"
                        >
                          <FileText className="w-3 h-3" />
                          <span>سند</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-300 font-mono-num ml-2">{formatNumber(mp.amount)} ر.ي</span>
                      
                      {/* Attach Document */}
                      <button
                        onClick={() => openDocumentViewer(
                          mp.description,
                          `إرفاق / عرض مستند: ${mp.description}`,
                          mp.imageUrl,
                          (url) => {
                            const updated = (day.musabPersonal || []).map(m => m.id === mp.id ? { ...m, imageUrl: url } : m);
                            onUpdateDay({ ...day, musabPersonal: updated });
                          }
                        )}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-400 cursor-pointer"
                        title="إرفاق / عرض المستند"
                      >
                        <Camera className="w-3 h-3" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditingItem({
                            section: 'musabPersonal',
                            id: mp.id,
                            title: mp.description,
                            amount: mp.amount,
                            imageUrl: mp.imageUrl,
                            notes: mp.notes
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteMusabPersonal(mp.id)}
                        className="p-1 rounded-md bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">بيت مصعب: <strong className="text-emerald-400 font-mono-num">{formatNumber(calc.musabHouseTotal)}</strong> ر.ي | مصعب شخصياً: <strong className="text-amber-400 font-mono-num">{formatNumber(calc.musabPersonalTotal)}</strong> ر.ي</span>
            <span className="text-white font-mono-num text-sm font-black">
              المجموع: {formatNumber(calc.musabHouseTotal + calc.musabPersonalTotal)} ر.ي
            </span>
          </div>
        </div>
        )}

        {/* 8. قسم العمال (حمدان والمهندس) */}
        {(sectionFilter === 'all' || sectionFilter === 'accounts') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
              <UserCheck className="w-5 h-5" />
              <span>مستحقات وصرفة العمال (حمدان والمهندس)</span>
            </div>
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'worker' ? null : 'worker')}
              className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صرفة عامل</span>
            </button>
          </div>

          {/* Inline Add Worker Form */}
          {activeModalSection === 'worker' && (
            <form onSubmit={handleAddWorker} className="p-4 bg-[#0F172A] border-b border-slate-700 flex flex-wrap gap-2 items-center text-sm no-print">
              <select
                value={workerName}
                onChange={e => setWorkerName(e.target.value as any)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-blue-500 focus:outline-none font-bold"
              >
                <option value="حمدان">العامل حمدان</option>
                <option value="المهندس">المهندس (772315106)</option>
              </select>
              <select
                value={workerType}
                onChange={e => setWorkerType(e.target.value as any)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="صرفة">صرفة يومية</option>
                <option value="حساب">من الحساب</option>
              </select>
              <input
                type="number"
                placeholder="المبلغ (ر.ي)"
                value={workerAmount}
                onChange={e => setWorkerAmount(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-28 text-xs font-mono-num focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500 cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          {/* Workers List */}
          <div className="p-4 flex-1 overflow-x-auto">
            {(!day.workers || day.workers.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">لا توجد مسحوبات للعمال في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {day.workers.map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-sm group hover:bg-slate-700/30 px-2 rounded-lg transition">
                    <div className="flex-1 pr-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          item.workerName === 'حمدان' ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' : 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                        }`}>
                          {item.workerName} ({item.type})
                        </span>
                        <span className="text-slate-200 font-medium">{item.description || `${item.type} ${item.workerName}`}</span>
                        {item.imageUrl && (
                          <button
                            onClick={() => openDocumentViewer(
                              item.description || `سند عامل: ${item.workerName}`,
                              `سند استلام: ${item.workerName}`,
                              item.imageUrl,
                              (url) => {
                                const updated = (day.workers || []).map(w => w.id === item.id ? { ...w, imageUrl: url } : w);
                                onUpdateDay({ ...day, workers: updated });
                              }
                            )}
                            className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-blue-500/30 cursor-pointer"
                            title="عرض المستند"
                          >
                            <FileText className="w-3 h-3" />
                            <span>سند</span>
                          </button>
                        )}
                      </div>
                      {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-blue-400 font-bold font-mono-num ml-2">
                        {formatNumber(item.amount)} <span className="text-[10px] text-slate-400 font-normal">ر.ي</span>
                      </span>

                      {/* Attach Document */}
                      <button
                        onClick={() => openDocumentViewer(
                          item.description || `سند عامل: ${item.workerName}`,
                          `إرفاق / عرض سند: ${item.workerName}`,
                          item.imageUrl,
                          (url) => {
                            const updated = (day.workers || []).map(w => w.id === item.id ? { ...w, imageUrl: url } : w);
                            onUpdateDay({ ...day, workers: updated });
                          }
                        )}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                        title="إرفاق / عرض السند الورقي"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingItem({
                            section: 'workers',
                            id: item.id,
                            title: item.description || `${item.type} ${item.workerName}`,
                            amount: item.amount,
                            workerName: item.workerName,
                            categoryOrType: item.type,
                            imageUrl: item.imageUrl,
                            notes: item.notes
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteWorker(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">حمدان: <strong className="text-amber-400 font-mono-num">{formatNumber(calc.hamdanTotal)}</strong> ر.ي | المهندس: <strong className="text-blue-400 font-mono-num">{formatNumber(calc.engineerTotal)}</strong> ر.ي</span>
            <span className="text-blue-300 font-mono-num text-sm font-black">
              المجموع: {formatNumber(calc.workersTotal)} ر.ي
            </span>
          </div>
        </div>
        )}

        {/* 9. قسم مشتريات وحوالات التجار (المقاصة) */}
        {(sectionFilter === 'all' || sectionFilter === 'accounts') && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-lg flex flex-col lg:col-span-2">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Truck className="w-5 h-5" />
              <span>المشتريات والتحويلات للتجار والموردين وأرشفة الفواتير الورقية</span>
              <span className="text-xs bg-[#0F172A] text-slate-300 px-2 py-0.5 rounded-full font-normal">
                {day.supplierTransfers?.length || 0} معاملة
              </span>
            </div>
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'supp' ? null : 'supp')}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حوالة / مشتريات تاجر</span>
            </button>
          </div>

          {/* Inline Add Supplier Form */}
          {activeModalSection === 'supp' && (
            <form onSubmit={handleAddSupplier} className="p-4 bg-[#0F172A] border-b border-slate-700 flex flex-wrap gap-2 items-center text-sm no-print">
              <select
                value={suppName}
                onChange={e => setSuppName(e.target.value as any)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-500 focus:outline-none font-bold"
              >
                <option value="عمر القاسمي">عمر القاسمي</option>
                <option value="خليل الأغبري">خليل الأغبري</option>
                <option value="محمد مياس">محمد مياس (الهادي)</option>
                <option value="فايز أبو علي">فايز أبو علي (تطبيق الرقم)</option>
                <option value="العبصري">العبصري</option>
                <option value="المصنف">المصنف</option>
                <option value="أبو صالح الأقمري">أبو صالح الأقمري</option>
                <option value="أخرى">تاجر آخر</option>
              </select>
              <input
                type="number"
                placeholder="المبلغ المرسل (ر.ي)"
                value={suppAmount}
                onChange={e => setSuppAmount(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white w-32 text-xs font-mono-num focus:border-amber-500 focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="قيمة المشتريات المستلمة (إذا كانت متطابقة اتركها فارغة)"
                value={suppPurchases}
                onChange={e => setSuppPurchases(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 min-w-[180px] text-xs font-mono-num focus:border-amber-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="ملاحظات الحوالة أو البضاعة..."
                value={suppNotes}
                onChange={e => setSuppNotes(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 min-w-[200px] text-xs focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-400 cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          {/* Supplier Transfers List */}
          <div className="p-4 flex-1 overflow-x-auto">
            {(!day.supplierTransfers || day.supplierTransfers.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">لا توجد تحويلات أو مشتريات تجار مسجلة لهذا اليوم</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {day.supplierTransfers.map(item => (
                  <div key={item.id} className="p-3.5 bg-[#0F172A] border border-slate-700/60 rounded-xl flex items-start justify-between text-sm group hover:border-slate-600 transition">
                    <div className="flex-1 pr-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-amber-400 font-bold">{item.supplierName}</strong>
                        {item.transferMethod && (
                          <span className="text-[10px] bg-[#1E293B] text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                            {item.transferMethod}
                          </span>
                        )}
                        {item.invoiceNumber && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono-num">
                            سند #{item.invoiceNumber}
                          </span>
                        )}
                        {item.imageUrl && (
                          <button
                            onClick={() => openDocumentViewer(
                              item.supplierName,
                              `فاتورة مشتريات / سند حوالة: ${item.supplierName}`,
                              item.imageUrl,
                              (url) => {
                                const updated = (day.supplierTransfers || []).map(s => s.id === item.id ? { ...s, imageUrl: url } : s);
                                onUpdateDay({ ...day, supplierTransfers: updated });
                              }
                            )}
                            className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer"
                            title="عرض الفاتورة المرفقة"
                          >
                            <FileText className="w-3 h-3" />
                            <span>فاتورة مرفقة</span>
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 mt-2 space-y-1">
                        <div>
                          <span>المبلغ المرسل: </span>
                          <strong className="text-rose-400 font-mono-num">{formatNumber(item.amountSent)}</strong> ر.ي
                        </div>
                        <div>
                          <span>قيمة المشتريات المستلمة: </span>
                          <strong className="text-emerald-400 font-mono-num">{formatNumber(item.purchasesReceivedValue)}</strong> ر.ي
                        </div>
                        {item.notes && <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">{item.notes}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Attach Document / Invoice */}
                      <button
                        onClick={() => openDocumentViewer(
                          item.supplierName,
                          `إرفاق / عرض فاتورة المشتريات وسند الحوالة: ${item.supplierName}`,
                          item.imageUrl,
                          (url) => {
                            const updated = (day.supplierTransfers || []).map(s => s.id === item.id ? { ...s, imageUrl: url } : s);
                            onUpdateDay({ ...day, supplierTransfers: updated });
                          }
                        )}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                        title="إرفاق / عرض الفاتورة الورقية"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingItem({
                            section: 'supplierTransfers',
                            id: item.id,
                            title: `معاملة ${item.supplierName}`,
                            amount: item.amountSent,
                            supplierName: item.supplierName,
                            transferMethod: item.transferMethod,
                            purchasesReceivedValue: item.purchasesReceivedValue,
                            invoiceNumber: item.invoiceNumber,
                            imageUrl: item.imageUrl,
                            notes: item.notes
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteSupplierTransfer(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal Footer */}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-400">إجمالي الحوالات والمشتريات للتجار في هذا اليوم:</span>
            <span className="text-amber-400 font-mono-num text-base font-black">
              {formatNumber(calc.supplierTransfersTotal)} ر.ي
            </span>
          </div>
        </div>
        )}

      </div>

      {/* 10. Bottom Grand KPI Summary Boxes */}
      <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4 print-break-inside-avoid">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">إجماليات وملخص حساب اليوم #{day.dayNumber} ({day.dayTitle})</h3>
          </div>
          <span className="text-xs text-slate-400">كافة الإجماليات محسوبة آلياً</span>
        </div>

        {/* 8 Metric Summary Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          
          {/* 1. مبيع الإكسسوارات */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 text-center hover:border-amber-500/40 transition">
            <span className="text-xs text-slate-400 font-medium block">مبيع الإكسسوارات والشرايح</span>
            <span className="text-xl font-black text-amber-400 font-mono-num block mt-1">
              {formatNumber(calc.accessoriesTotal)}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">ريال يمني</span>
          </div>

          {/* 2. مبيع الجوالات */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 text-center hover:border-cyan-500/40 transition">
            <span className="text-xs text-slate-400 font-medium block">واصل مبيع الجوالات</span>
            <span className="text-xl font-black text-cyan-400 font-mono-num block mt-1">
              {formatNumber(calc.phonesPaidTotal)}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">ريال يمني</span>
          </div>

          {/* 3. خدمات الصيانة */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 text-center hover:border-indigo-500/40 transition">
            <span className="text-xs text-slate-400 font-medium block">خدمات الصيانة والبرمجة</span>
            <span className="text-xl font-black text-indigo-400 font-mono-num block mt-1">
              {formatNumber(calc.maintenanceTotal)}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">ريال يمني</span>
          </div>

          {/* 4. مبيع الرصيد */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 text-center hover:border-emerald-500/40 transition">
            <span className="text-xs text-slate-400 font-medium block">مبيع الرصيد (مع الفائدة)</span>
            <span className="text-xl font-black text-emerald-400 font-mono-num block mt-1">
              {formatNumber(calc.rechargeSalesWithProfit)}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">ريال يمني</span>
          </div>

          {/* 5. إجمالي الدخل اليومي */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-emerald-500/40 text-center shadow-lg">
            <span className="text-xs text-emerald-300 font-bold block">إجمالي الدخل اليومي (الإيراد)</span>
            <span className="text-2xl font-black text-emerald-400 font-mono-num block mt-1">
              {formatNumber(calc.grossDailyRevenue)}
            </span>
            <span className="text-[11px] text-emerald-500 font-normal">ريال يمني</span>
          </div>

          {/* 6. إجمالي المخروجات */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-rose-500/40 text-center shadow-lg">
            <span className="text-xs text-rose-300 font-bold block">إجمالي المخروجات والمصروفات</span>
            <span className="text-2xl font-black text-rose-400 font-mono-num block mt-1">
              {formatNumber(calc.totalOutflows)}
            </span>
            <span className="text-[11px] text-rose-500 font-normal">ريال يمني</span>
          </div>

          {/* 7. سحب بيت مصعب */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 text-center hover:border-emerald-500/40 transition">
            <span className="text-xs text-slate-400 font-medium block">سحب بيت مصعب (مفصول)</span>
            <span className="text-xl font-black text-emerald-300 font-mono-num block mt-1">
              {formatNumber(calc.musabHouseTotal)}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">ريال يمني</span>
          </div>

          {/* 8. صافي الصندوق */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-amber-500/50 text-center shadow-lg">
            <span className="text-xs text-amber-300 font-bold block">صافي النقدية / الصندوق</span>
            <span className="text-2xl font-black text-amber-400 font-mono-num block mt-1">
              {formatNumber(calc.netDayCashChange)}
            </span>
            <span className="text-[11px] text-amber-500 font-normal">ريال يمني</span>
          </div>

          {/* 9. الأرباح والفائدة المقدرة لليوم */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-emerald-500/60 bg-emerald-950/10 text-center shadow-lg col-span-2 sm:col-span-1 lg:col-span-4 flex flex-col sm:flex-row items-center justify-between px-6 py-3">
            <div className="text-right flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="text-xs text-emerald-300 font-bold block">إجمالي الأرباح والفائدة المقدرة لهذا اليوم (إكسسوارات + جوالات + صيانة + رصيد)</span>
                <span className="text-[11px] text-slate-400">محسوب من هوامش أرباح الأصناف المحددة وفائدة الرصيد</span>
              </div>
            </div>
            <div className="text-left mt-2 sm:mt-0">
              <span className="text-2xl font-black text-emerald-400 font-mono-num">
                +{formatNumber(calc.totalDailyEstimatedProfit)}
              </span>
              <span className="text-xs text-emerald-500 font-bold mr-1">ريال يمني</span>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button for Fast Mobile/Desktop Entry */}
      <div className="fixed bottom-6 left-6 z-40 no-print">
        <button
          id="floating-quick-add-btn"
          onClick={() => openQuickModal('income_acc')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-3 rounded-full shadow-2xl hover:shadow-indigo-500/40 active:scale-95 transition-all border border-indigo-400/30 cursor-pointer"
          title="تسجيل عملية سريعة لليوم (دخل / خرج / رصيد / مشتريات...)"
        >
          <PlusCircle className="w-5 h-5 animate-pulse" />
          <span className="text-xs sm:text-sm font-black">+ عملية سريعة</span>
        </button>
      </div>

      {/* Quick Entry Modal */}
      <QuickEntryModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        day={day}
        onUpdateDay={onUpdateDay}
        initialType={quickModalType}
        onAddDebt={onAddDebt}
        onAddSupplierProfile={onAddSupplierProfile}
        supplierProfiles={supplierProfiles}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={editingItem}
        onSave={handleSaveEditedItem}
      />

      {/* Document Viewer & Uploader Modal */}
      <DocumentModal
        isOpen={documentModalData.isOpen}
        onClose={() => setDocumentModalData({ ...documentModalData, isOpen: false })}
        title={documentModalData.title}
        subtitle={documentModalData.subtitle}
        imageUrl={documentModalData.imageUrl}
        whatsappMessage={documentModalData.whatsappMessage}
        customerPhone={documentModalData.customerPhone}
        onSaveImage={documentModalData.onSave}
      />

    </div>
  );
};
