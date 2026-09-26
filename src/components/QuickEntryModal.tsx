import React, { useState, useEffect } from 'react';
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
import { 
  X, 
  PlusCircle, 
  ShoppingBag, 
  Smartphone, 
  Wrench, 
  Zap, 
  Receipt, 
  Home, 
  UserCheck, 
  Truck, 
  RotateCcw,
  Check,
  Camera,
  Upload,
  Clock,
  User,
  Phone,
  Building,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { openWhatsApp, openSMS, buildCustomerInvoiceMessage, buildGuarantorAlertMessage } from '../utils/messaging';

export type QuickEntryType = 
  | 'income_acc' 
  | 'income_phone' 
  | 'maintenance' 
  | 'recharge' 
  | 'expense' 
  | 'musab' 
  | 'worker' 
  | 'supplier' 
  | 'return';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayRecord;
  onUpdateDay: (updatedDay: DayRecord) => void;
  initialType?: QuickEntryType;
  onAddDebt?: (debt: CustomerDebtItem) => void;
  onAddSupplierProfile?: (profile: SupplierProfile) => void;
  supplierProfiles?: SupplierProfile[];
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  day,
  onUpdateDay,
  initialType = 'income_acc',
  onAddDebt,
  onAddSupplierProfile,
  supplierProfiles = []
}) => {
  const [selectedType, setSelectedType] = useState<QuickEntryType>(initialType);

  // Common customer & payment fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleType, setSaleType] = useState<'نقد' | 'دين'>('نقد');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  
  // Extended guarantor & credit fields
  const [workplace, setWorkplace] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('20:00'); // 8:00 PM default

  // Attached Image / Receipt
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // 1. Accessory / Income
  const [accName, setAccName] = useState('');
  const [accPrice, setAccPrice] = useState('');
  const [accCost, setAccCost] = useState('');
  const [accProfit, setAccProfit] = useState('');

  // 2. Phone
  const [phoneModel, setPhoneModel] = useState('');
  const [phoneSalePrice, setPhoneSalePrice] = useState('');
  const [phoneCost, setPhoneCost] = useState('');
  const [phoneProfit, setPhoneProfit] = useState('');
  const [phonePaid, setPhonePaid] = useState('');

  // 3. Maintenance
  const [maintName, setMaintName] = useState('');
  const [maintPrice, setMaintPrice] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintProfit, setMaintProfit] = useState('');
  const [maintType, setMaintType] = useState<MaintenanceItem['type']>('شاشات');

  // 4. Recharge
  const [rechargeApp, setRechargeApp] = useState<'hadi' | 'qimmah'>('hadi');
  const [rechargeSalesWithProfit, setRechargeSalesWithProfit] = useState('');
  const [rechargeSalesWithoutProfit, setRechargeSalesWithoutProfit] = useState('');
  const [rechargeSimCount, setRechargeSimCount] = useState('');
  const [rechargeSimAmount, setRechargeSimAmount] = useState('');
  const [rechargeNotes, setRechargeNotes] = useState('');

  // 5. Expense / Outflow
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseItem['category']>('صرفة المحل');
  const [expRecipient, setExpRecipient] = useState('');
  const [expInvoiceNum, setExpInvoiceNum] = useState('');

  // 6. Musab
  const [musabType, setMusabType] = useState<'بيت مصعب' | 'مصعب شخصياً'>('بيت مصعب');
  const [musabDesc, setMusabDesc] = useState('');
  const [musabAmount, setMusabAmount] = useState('');

  // 7. Worker
  const [workerName, setWorkerName] = useState<'حمدان' | 'المهندس'>('حمدان');
  const [workerType, setWorkerType] = useState<'صرفة' | 'حساب'>('صرفة');
  const [workerAmount, setWorkerAmount] = useState('');

  // 8. Supplier
  const [suppName, setSuppName] = useState<SupplierTransferItem['supplierName']>('عمر القاسمي');
  const [suppAmount, setSuppAmount] = useState('');
  const [suppPurchases, setSuppPurchases] = useState('');
  const [suppMethod, setSuppMethod] = useState<SupplierTransferItem['transferMethod']>('نقد');
  const [suppNotes, setSuppNotes] = useState('');
  const [suppInvoiceNum, setSuppInvoiceNum] = useState('');

  // 9. Return
  const [returnTitle, setReturnTitle] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [returnType, setReturnType] = useState<ReturnItem['returnType']>('مرتجع زبون');
  const [returnParty, setReturnParty] = useState('');

  // Sync initial type when opening
  useEffect(() => {
    if (isOpen && initialType) {
      setSelectedType(initialType);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedType === 'income_acc') {
      if (!accName || !accPrice) return;
      const price = Number(accPrice) || 0;
      const cost = accCost !== '' ? Number(accCost) : undefined;
      const profit = accProfit !== '' ? Number(accProfit) : (cost !== undefined ? Math.max(0, price - cost) : undefined);
      const newItem: AccessoryItem = {
        id: `acc-${Date.now()}`,
        name: accName,
        price,
        cost,
        profit,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        saleType,
        guarantorName: guarantorName || undefined,
        guarantorPhone: guarantorPhone || undefined,
        workplace: workplace || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        imageUrl: imageUrl || undefined,
        notes: notes || undefined
      };
      onUpdateDay({
        ...day,
        accessories: [...(day.accessories || []), newItem],
      });

      // Auto-register customer debt if credit sale
      if (saleType === 'دين' && onAddDebt) {
        onAddDebt({
          id: `debt-${Date.now()}`,
          customerName: customerName.trim() || 'عميل آجل',
          phone: customerPhone.trim() || undefined,
          dayId: day.id,
          date: day.date,
          description: `مبيع إكسسوار: ${accName}`,
          totalAmount: price,
          paidAmount: 0,
          remainingAmount: price,
          guarantor: guarantorName.trim() || undefined,
          guarantorPhone: guarantorPhone.trim() || undefined,
          workplace: workplace.trim() || undefined,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          saleType: 'دين',
          status: 'متبقي',
          notes: notes || undefined
        });
      }
    } else if (selectedType === 'income_phone') {
      if (!phoneModel || !phoneSalePrice) return;
      const price = Number(phoneSalePrice) || 0;
      const cost = phoneCost !== '' ? Number(phoneCost) : undefined;
      const profit = phoneProfit !== '' ? Number(phoneProfit) : (cost !== undefined ? Math.max(0, price - cost) : undefined);
      const paid = phonePaid !== '' ? Number(phonePaid) : (saleType === 'دين' ? 0 : price);
      const remaining = price > paid ? price - paid : 0;
      const newItem: PhoneItem = {
        id: `phone-${Date.now()}`,
        model: phoneModel,
        salePrice: price,
        cost,
        profit,
        paidAmount: paid,
        remainingAmount: remaining,
        buyerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        saleType,
        guarantor: guarantorName || undefined,
        guarantorPhone: guarantorPhone || undefined,
        workplace: workplace || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        imageUrl: imageUrl || undefined,
        status: remaining > 0 ? 'متبقي آجل' : 'تم الدفع بالكامل',
        notes: notes || undefined
      };
      onUpdateDay({
        ...day,
        phones: [...(day.phones || []), newItem],
      });

      // Auto-register customer debt if credit sale or remaining debt exists
      if ((saleType === 'دين' || remaining > 0) && onAddDebt) {
        onAddDebt({
          id: `debt-${Date.now()}`,
          customerName: customerName.trim() || 'عميل جوال آجل',
          phone: customerPhone.trim() || undefined,
          dayId: day.id,
          date: day.date,
          description: `مبيع جوال: ${phoneModel}`,
          totalAmount: price,
          paidAmount: paid,
          remainingAmount: remaining,
          guarantor: guarantorName.trim() || undefined,
          guarantorPhone: guarantorPhone.trim() || undefined,
          workplace: workplace.trim() || undefined,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          saleType: 'دين',
          status: remaining === 0 ? 'سدد بالكامل' : 'متبقي',
          notes: notes || undefined
        });
      }
    } else if (selectedType === 'maintenance') {
      if (!maintName || !maintPrice) return;
      const price = Number(maintPrice) || 0;
      const cost = maintCost !== '' ? Number(maintCost) : undefined;
      const profit = maintProfit !== '' ? Number(maintProfit) : (cost !== undefined ? Math.max(0, price - cost) : undefined);
      const newItem: MaintenanceItem = {
        id: `maint-${Date.now()}`,
        deviceOrService: maintName,
        price,
        cost,
        profit,
        type: maintType,
        status: 'خالص',
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        saleType,
        guarantorName: guarantorName || undefined,
        guarantorPhone: guarantorPhone || undefined,
        workplace: workplace || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        imageUrl: imageUrl || undefined,
        notes: notes || undefined
      };
      onUpdateDay({
        ...day,
        maintenance: [...(day.maintenance || []), newItem],
      });

      // Auto-register customer debt if credit maintenance
      if (saleType === 'دين' && onAddDebt) {
        onAddDebt({
          id: `debt-${Date.now()}`,
          customerName: customerName.trim() || 'عميل صيانة آجل',
          phone: customerPhone.trim() || undefined,
          dayId: day.id,
          date: day.date,
          description: `صيانة: ${maintName}`,
          totalAmount: price,
          paidAmount: 0,
          remainingAmount: price,
          guarantor: guarantorName.trim() || undefined,
          guarantorPhone: guarantorPhone.trim() || undefined,
          workplace: workplace.trim() || undefined,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          saleType: 'دين',
          status: 'متبقي',
          notes: notes || undefined
        });
      }
    } else if (selectedType === 'recharge') {
      const currentRecharge = day.recharge || {
        hadi: { salesWithProfit: 0, salesWithoutProfit: 0, transferredToApp: 0, remainingInApp: 0 },
        qimmah: { salesWithProfit: 0, salesWithoutProfit: 0, transferredToApp: 0, remainingInApp: 0 },
        totalWithProfit: 0,
        totalWithoutProfit: 0,
        totalProfit: 0
      };

      if (rechargeApp === 'hadi') {
        const addedWith = Number(rechargeSalesWithProfit) || 0;
        const addedWithout = Number(rechargeSalesWithoutProfit) || addedWith;
        const prevHadi = currentRecharge.hadi || { salesWithProfit: 0, salesWithoutProfit: 0, transferredToApp: 0, remainingInApp: 0 };

        onUpdateDay({
          ...day,
          recharge: {
            ...currentRecharge,
            hadi: {
              ...prevHadi,
              salesWithProfit: prevHadi.salesWithProfit + addedWith,
              salesWithoutProfit: prevHadi.salesWithoutProfit + addedWithout,
              notes: rechargeNotes || prevHadi.notes,
            },
          },
        });
      } else {
        const addedWith = Number(rechargeSalesWithProfit) || 0;
        const addedWithout = Number(rechargeSalesWithoutProfit) || addedWith;
        const prevQimmah = currentRecharge.qimmah || { salesWithProfit: 0, salesWithoutProfit: 0, transferredToApp: 0, remainingInApp: 0 };
        const simCount = Number(rechargeSimCount) || 0;
        const simAmt = Number(rechargeSimAmount) || 0;

        onUpdateDay({
          ...day,
          recharge: {
            ...currentRecharge,
            qimmah: {
              ...prevQimmah,
              salesWithProfit: prevQimmah.salesWithProfit + addedWith,
              salesWithoutProfit: prevQimmah.salesWithoutProfit + addedWithout,
              simPurchases: simCount > 0 ? {
                count: (prevQimmah.simPurchases?.count || 0) + simCount,
                cost: simCount > 0 ? (simAmt / simCount) : 0,
                total: (prevQimmah.simPurchases?.total || 0) + simAmt,
              } : prevQimmah.simPurchases,
              notes: rechargeNotes || prevQimmah.notes,
            },
          },
        });
      }
    } else if (selectedType === 'expense') {
      if (!expAmount || !expDesc) return;
      const newItem: ExpenseItem = {
        id: `exp-${Date.now()}`,
        amount: Number(expAmount) || 0,
        category: expCategory,
        description: expDesc,
        recipient: expRecipient || undefined,
        imageUrl: imageUrl || undefined,
        invoiceNumber: expInvoiceNum || undefined,
        notes: notes || undefined
      };
      onUpdateDay({
        ...day,
        expenses: [...(day.expenses || []), newItem],
      });
    } else if (selectedType === 'musab') {
      if (!musabAmount) return;
      const newItem: MusabItem = {
        id: `musab-${Date.now()}`,
        amount: Number(musabAmount) || 0,
        description: musabDesc || (musabType === 'بيت مصعب' ? 'سحب لبيت مصعب' : 'مصاريف شخصية لمصعب'),
        type: musabType,
        imageUrl: imageUrl || undefined,
        notes: notes || undefined
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
    } else if (selectedType === 'worker') {
      if (!workerAmount) return;
      const newItem: WorkerItem = {
        id: `worker-${Date.now()}`,
        workerName,
        amount: Number(workerAmount) || 0,
        type: workerType,
        description: notes || `${workerType} ${workerName}`,
        imageUrl: imageUrl || undefined,
        notes: notes || undefined
      };
      onUpdateDay({
        ...day,
        workers: [...(day.workers || []), newItem],
      });
    } else if (selectedType === 'supplier') {
      if (!suppAmount) return;
      const sent = Number(suppAmount) || 0;
      const purchases = suppPurchases ? Number(suppPurchases) : sent;
      const newItem: SupplierTransferItem = {
        id: `supp-${Date.now()}`,
        supplierName: suppName,
        amountSent: sent,
        purchasesReceivedValue: purchases,
        transferMethod: suppMethod,
        invoiceNumber: suppInvoiceNum || undefined,
        imageUrl: imageUrl || undefined,
        notes: suppNotes || notes || undefined,
      };
      onUpdateDay({
        ...day,
        supplierTransfers: [...(day.supplierTransfers || []), newItem],
      });

      // Auto-register supplier profile if new merchant
      if (onAddSupplierProfile && suppName && !supplierProfiles.some(p => p.name === suppName)) {
        onAddSupplierProfile({
          id: `supp-${Date.now()}`,
          name: suppName,
          dealingType: 'نقد ودين',
          category: 'قطع غيار',
          notes: `تمت إضافته تلقائياً من عملية حوالة/شراء`
        });
      }
    } else if (selectedType === 'return') {
      if (!returnTitle || !returnAmount) return;
      const newItem: ReturnItem = {
        id: `ret-${Date.now()}`,
        title: returnTitle,
        amount: Number(returnAmount) || 0,
        returnType,
        party: returnParty || customerName || undefined,
        customerPhone: customerPhone || undefined,
        imageUrl: imageUrl || undefined,
        notes: notes || undefined
      };
      onUpdateDay({
        ...day,
        returns: [...(day.returns || []), newItem],
      });
    }

    onClose();
  };

  const handleSendInvoiceViaWhatsApp = () => {
    let itemName = '';
    let total = 0;
    let paid = 0;
    let invType: any = 'مبيع إكسسوار';

    if (selectedType === 'income_acc') {
      itemName = accName || 'إكسسوار / شريحة';
      total = Number(accPrice) || 0;
      paid = saleType === 'دين' ? 0 : total;
      invType = 'مبيع إكسسوار';
    } else if (selectedType === 'income_phone') {
      itemName = phoneModel || 'جوال';
      total = Number(phoneSalePrice) || 0;
      paid = phonePaid ? Number(phonePaid) : (saleType === 'دين' ? 0 : total);
      invType = 'بيع جوال';
    } else if (selectedType === 'maintenance') {
      itemName = maintName || 'خدمة صيانة وبرمجة';
      total = Number(maintPrice) || 0;
      paid = saleType === 'دين' ? 0 : total;
      invType = 'صيانة وبرمجة';
    }

    const msg = buildCustomerInvoiceMessage({
      type: invType,
      customerName,
      customerPhone,
      itemName,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: Math.max(0, total - paid),
      saleType,
      guarantorName,
      guarantorPhone,
      workplace,
      dueDate,
      dueTime,
      notes
    });

    openWhatsApp(customerPhone, msg);
  };

  const handleSendGuarantorAlert = () => {
    if (!guarantorPhone && !guarantorName) {
      alert('يرجى إدخال اسم أو رقم هاتف الضمين أولاً.');
      return;
    }
    let itemName = accName || phoneModel || maintName || 'حساب مشتريات';
    let total = Number(accPrice || phoneSalePrice || maintPrice) || 0;
    let paid = phonePaid ? Number(phonePaid) : 0;
    let remaining = Math.max(0, total - paid);

    const msg = buildGuarantorAlertMessage(
      guarantorName || 'الأخ الضمين',
      customerName || 'العميل',
      remaining,
      itemName,
      dueDate,
      dueTime === '20:00' ? '8:00 مساءً' : dueTime
    );

    openWhatsApp(guarantorPhone, msg);
  };

  const categories: { id: QuickEntryType; label: string; icon: React.FC<{ className?: string }>; color: string; badge: string }[] = [
    { id: 'income_acc', label: 'دخل إكسسوار وشرايح', icon: ShoppingBag, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10', badge: 'دخل' },
    { id: 'income_phone', label: 'بيع جوال (نقد/آجل)', icon: Smartphone, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10', badge: 'دخل' },
    { id: 'maintenance', label: 'صيانة وبرمجة', icon: Wrench, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10', badge: 'خدمة' },
    { id: 'recharge', label: 'رصيد (الهادي / الرقم)', icon: Zap, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', badge: 'رصيد' },
    { id: 'expense', label: 'خرج ومصروف المحل', icon: Receipt, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10', badge: 'خرج' },
    { id: 'musab', label: 'سحب بيت مصعب / شخصي', icon: Home, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10', badge: 'سحب' },
    { id: 'supplier', label: 'حوالة / مشتريات تاجر', icon: Truck, color: 'text-amber-300 border-amber-500/40 bg-amber-500/10', badge: 'تاجر' },
    { id: 'worker', label: 'صرفة عمال (حمدان/المهندس)', icon: UserCheck, color: 'text-blue-400 border-blue-500/40 bg-blue-500/10', badge: 'عمال' },
    { id: 'return', label: 'تسجيل مرتجع', icon: RotateCcw, color: 'text-rose-300 border-rose-500/40 bg-rose-500/10', badge: 'مرتجع' },
  ];

  const isCustomerRelevant = ['income_acc', 'income_phone', 'maintenance', 'return'].includes(selectedType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">إدخال عملية - {day.dayTitle}</h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                  {SHOP_INFO.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">إدخال الفواتير والسندات مع الشروط والضمين وإرفاق المستندات</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="p-3 bg-slate-900/70 border-b border-slate-700/80 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex gap-2 min-w-max pb-1">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedType === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedType(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isSelected
                      ? `${cat.color} ring-2 ring-indigo-500 shadow-md font-extrabold`
                      : 'bg-[#1E293B] text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Customer & Sale Type Section (Shown for customer facing types) */}
          {isCustomerRelevant && (
            <div className="p-3.5 bg-[#0F172A] rounded-xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                  <User className="w-4 h-4" />
                  <span>بيانات العميل ونوع الفاتورة (نقد / دين):</span>
                </div>
                
                {/* Sale Type Toggle */}
                <div className="flex items-center bg-[#1E293B] p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSaleType('نقد')}
                    className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                      saleType === 'نقد' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💵 نقد
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaleType('دين');
                      setShowMoreDetails(true);
                    }}
                    className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                      saleType === 'دين' 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⏳ دين / آجل
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">اسم العميل (عميل جديد أو دائم):</label>
                  <input
                    type="text"
                    placeholder="اكتب اسم العميل..."
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">رقم هاتف العميل (للواتساب والفاتورة):</label>
                  <input
                    type="tel"
                    placeholder="مثال: 772315106 أو 779040507"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggle More Details (Workplace, Guarantor, Due Date, 8:00 PM Alert) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMoreDetails(!showMoreDetails)}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer py-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{showMoreDetails ? 'إخفاء تفاصيل الضمين والسداد ⬆️' : 'تفاصيل أكثر: مكان عمله، الضمين، ووقت تنبيه السداد 8:00 م ⬇️'}</span>
                </button>

                {showMoreDetails && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-900/60 p-3 rounded-xl">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">مكان عمل العميل / وظيفته / عنوانه:</label>
                      <input
                        type="text"
                        placeholder="مثال: مدرس في مدرسة...، سوق الجملة..."
                        value={workplace}
                        onChange={e => setWorkplace(e.target.value)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">اسم الضمين / المعرف:</label>
                      <input
                        type="text"
                        placeholder="اسم الشخص الضامن للعميل..."
                        value={guarantorName}
                        onChange={e => setGuarantorName(e.target.value)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">رقم هاتف الضمين (لإرسال تنبيه السداد):</label>
                      <input
                        type="tel"
                        placeholder="رقم جوال الضمين..."
                        value={guarantorPhone}
                        onChange={e => setGuarantorPhone(e.target.value)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-num focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">تاريخ السداد المتفق:</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-amber-400 font-semibold block mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>وقت التنبيه (افتراضي 8 م):</span>
                        </label>
                        <input
                          type="time"
                          value={dueTime}
                          onChange={e => setDueTime(e.target.value)}
                          className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono-num text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {guarantorPhone && (
                      <div className="sm:col-span-2 pt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">يمكنك إرسال رسالة تذكير للضمين بضغطة زر:</span>
                        <button
                          type="button"
                          onClick={handleSendGuarantorAlert}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>إرسال تنبيه للضمين واتساب</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1. Accessory Entry */}
          {selectedType === 'income_acc' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShoppingBag className="w-4 h-4" />
                <span>إضافة صنف إكسسوار أو شريحة (دخل)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">اسم الصنف أو القطعة: *</label>
                  <input
                    type="text"
                    placeholder="مثال: شاحن أصلي، كفر حماية، لاصق شاشة، شريحة سبأفون..."
                    value={accName}
                    onChange={e => setAccName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">سعر البيع للزبون (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="المبلغ بالريال"
                    value={accPrice}
                    onChange={e => {
                      setAccPrice(e.target.value);
                      if (accCost !== '' && e.target.value !== '') {
                        setAccProfit(Math.max(0, (Number(e.target.value) || 0) - (Number(accCost) || 0)).toString());
                      }
                    }}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">ملاحظات إضافية:</label>
                  <input
                    type="text"
                    placeholder="ملاحظات..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Profit & Cost box */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-2.5 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                  <div>
                    <label className="text-[10px] text-slate-300 font-semibold block mb-1">سعر الشراء / التكلفة (اختياري):</label>
                    <input
                      type="number"
                      placeholder="التكلفة (ر.ي)"
                      value={accCost}
                      onChange={e => {
                        setAccCost(e.target.value);
                        if (accPrice !== '' && e.target.value !== '') {
                          setAccProfit(Math.max(0, (Number(accPrice) || 0) - (Number(e.target.value) || 0)).toString());
                        }
                      }}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono-num text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-400 font-bold block mb-1">مبلغ الفائدة والربح التقريبي:</label>
                    <input
                      type="number"
                      placeholder="الفائدة المقدرة (ر.ي)"
                      value={accProfit}
                      onChange={e => setAccProfit(e.target.value)}
                      className="w-full bg-[#0F172A] border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono-num font-bold text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Phone Entry */}
          {selectedType === 'income_phone' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>تسجيل بيع جوال جديد / مستخدم (مع شروط الضمان 24 ساعة)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">موديل ونوع الجوال: *</label>
                  <input
                    type="text"
                    placeholder="مثال: جوال UMAX، سامسونج A12، ردمي نوت 11..."
                    value={phoneModel}
                    onChange={e => setPhoneModel(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">سعر البيع الإجمالي (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="إجمالي السعر"
                    value={phoneSalePrice}
                    onChange={e => {
                      setPhoneSalePrice(e.target.value);
                      if (phoneCost !== '' && e.target.value !== '') {
                        setPhoneProfit(Math.max(0, (Number(e.target.value) || 0) - (Number(phoneCost) || 0)).toString());
                      }
                    }}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبلغ الواصل (المقبوض نقداً):</label>
                  <input
                    type="number"
                    placeholder={saleType === 'دين' ? '0 (دين كامل)' : 'اتركه فارغاً إن دفع كاملاً'}
                    value={phonePaid}
                    onChange={e => setPhonePaid(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Profit & Cost box for Phone */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-2.5 bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl">
                  <div>
                    <label className="text-[10px] text-slate-300 font-semibold block mb-1">سعر شراء الجوال (التكلفة):</label>
                    <input
                      type="number"
                      placeholder="رأس المال (ر.ي)"
                      value={phoneCost}
                      onChange={e => {
                        setPhoneCost(e.target.value);
                        if (phoneSalePrice !== '' && e.target.value !== '') {
                          setPhoneProfit(Math.max(0, (Number(phoneSalePrice) || 0) - (Number(e.target.value) || 0)).toString());
                        }
                      }}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono-num text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-400 font-bold block mb-1">مبلغ الفائدة والربح التقريبي:</label>
                    <input
                      type="number"
                      placeholder="الفائدة المقدرة (ر.ي)"
                      value={phoneProfit}
                      onChange={e => setPhoneProfit(e.target.value)}
                      className="w-full bg-[#0F172A] border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono-num font-bold text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-[10px] text-slate-400">
                  ⚠️ <span className="font-bold text-amber-300">تذكير الشروط:</span> ضمانة تجربة قوة البطارية والتغطية 24 ساعة فقط بشرط فيديو إثبات، ولا يرد الجوال طافياً أو مكسوراً.
                </div>
              </div>
            </div>
          )}

          {/* 3. Maintenance Entry */}
          {selectedType === 'maintenance' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Wrench className="w-4 h-4" />
                <span>إضافة خدمة صيانة أو برمجة</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">البيان ونوع القطعة/الجهاز: *</label>
                  <input
                    type="text"
                    placeholder="مثال: شاشة سامسونج A32، تغيير مدخل شحن، فك شفرة..."
                    value={maintName}
                    onChange={e => setMaintName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">نوع الخدمة:</label>
                  <select
                    value={maintType}
                    onChange={e => setMaintType(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none font-bold"
                  >
                    <option value="شاشات">شاشات وتاتش</option>
                    <option value="بيوت شحن وفلاتات">بيوت شحن وفلاتات</option>
                    <option value="آي سيات وتصليح">آي سيات وتصليح ماذر بورد</option>
                    <option value="برمجة وفورمات">برمجة وسوفتوير وفورمات</option>
                    <option value="تفعيل 4G/Volte">تفعيل 4G / Volte</option>
                    <option value="حسابات وتخطي">حسابات وتخطي FRP</option>
                    <option value="أخرى">صيانة وقطع أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبلغ المحصل من الزبون (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="المبلغ بالريال"
                    value={maintPrice}
                    onChange={e => {
                      setMaintPrice(e.target.value);
                      if (maintCost !== '' && e.target.value !== '') {
                        setMaintProfit(Math.max(0, (Number(e.target.value) || 0) - (Number(maintCost) || 0)).toString());
                      }
                    }}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Profit & Cost box for Maintenance */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-2.5 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl">
                  <div>
                    <label className="text-[10px] text-slate-300 font-semibold block mb-1">تكلفة قطع الغيار / القطعة (ر.ي):</label>
                    <input
                      type="number"
                      placeholder="تكلفة القطعة (ر.ي)"
                      value={maintCost}
                      onChange={e => {
                        setMaintCost(e.target.value);
                        if (maintPrice !== '' && e.target.value !== '') {
                          setMaintProfit(Math.max(0, (Number(maintPrice) || 0) - (Number(e.target.value) || 0)).toString());
                        }
                      }}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono-num text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-400 font-bold block mb-1">الفائدة المقدرة / أجر اليد (ر.ي):</label>
                    <input
                      type="number"
                      placeholder="صافي الربح التقديري"
                      value={maintProfit}
                      onChange={e => setMaintProfit(e.target.value)}
                      className="w-full bg-[#0F172A] border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono-num font-bold text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Recharge Entry */}
          {selectedType === 'recharge' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Zap className="w-4 h-4" />
                <span>إضافة حركة رصيد وشرايح (تطبيقي الهادي أو الرقم)</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRechargeApp('hadi')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    rechargeApp === 'hadi' 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500' 
                      : 'bg-[#0F172A] text-slate-400 border-slate-700'
                  }`}
                >
                  تطبيق الهادي (محمد مياس)
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeApp('qimmah')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    rechargeApp === 'qimmah' 
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500' 
                      : 'bg-[#0F172A] text-slate-400 border-slate-700'
                  }`}
                >
                  تطبيق الرقم (فايز أبو علي)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبيع مع الفائدة (المقبوض): *</label>
                  <input
                    type="number"
                    placeholder="المبلغ المحصل من الزبائن"
                    value={rechargeSalesWithProfit}
                    onChange={e => setRechargeSalesWithProfit(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبيع بدون فائدة (رأس المال):</label>
                  <input
                    type="number"
                    placeholder="رأس مال الرصيد"
                    value={rechargeSalesWithoutProfit}
                    onChange={e => setRechargeSalesWithoutProfit(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {rechargeApp === 'qimmah' && (
                  <>
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold block mb-1">عدد الشرايح المشتراة (اختياري):</label>
                      <input
                        type="number"
                        placeholder="عدد الشرايح"
                        value={rechargeSimCount}
                        onChange={e => setRechargeSimCount(e.target.value)}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold block mb-1">قيمة شراء الشرايح (ر.ي):</label>
                      <input
                        type="number"
                        placeholder="المبلغ الإجمالي للشرايح"
                        value={rechargeSimAmount}
                        onChange={e => setRechargeSimAmount(e.target.value)}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">ملاحظات:</label>
                  <input
                    type="text"
                    placeholder="ملاحظات حول حركة الرصيد..."
                    value={rechargeNotes}
                    onChange={e => setRechargeNotes(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Expense Entry */}
          {selectedType === 'expense' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Receipt className="w-4 h-4" />
                <span>تسجيل خرج ومصروف / فاتورة مشتريات خارجية للمطابقة</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">بيان المصروف أو المشتريات: *</label>
                  <input
                    type="text"
                    placeholder="مثال: فاتورة مشتريات خارجية، صرفة المحل، كراء متر، أدوات..."
                    value={expDesc}
                    onChange={e => setExpDesc(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">تصنيف المصروف:</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none font-bold"
                  >
                    <option value="صرفة المحل">صرفة المحل</option>
                    <option value="مشاوير وتوصيل">مشاوير وتوصيل</option>
                    <option value="مودم واشتراكات">مودم واشتراكات</option>
                    <option value="أدوات ومعدات">أدوات ومعدات صيانة</option>
                    <option value="شخصي">شخصي</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبلغ المنصرف (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="المبلغ بالريال"
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المستلم / اسم التاجر الخارجي:</label>
                  <input
                    type="text"
                    placeholder="اسم الشخص أو المحل الخارجي..."
                    value={expRecipient}
                    onChange={e => setExpRecipient(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">رقم السند أو الفاتورة الخارجية:</label>
                  <input
                    type="text"
                    placeholder="رقم الفاتورة الورقية..."
                    value={expInvoiceNum}
                    onChange={e => setExpInvoiceNum(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. Musab Entry */}
          {selectedType === 'musab' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Home className="w-4 h-4" />
                <span>سحب لحساب بيت مصعب أو مصعب شخصياً (مفصول)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">الجهة المسحوب لها:</label>
                  <select
                    value={musabType}
                    onChange={e => setMusabType(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none font-bold"
                  >
                    <option value="بيت مصعب">حساب بيت مصعب (المنزل)</option>
                    <option value="مصعب شخصياً">مصعب شخصياً / باقات خاصة</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">البيان والتفصيل:</label>
                  <input
                    type="text"
                    placeholder="مثال: سحب مصاريف المنزل، تسليم يدوي، باقة مزايا..."
                    value={musabDesc}
                    onChange={e => setMusabDesc(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبلغ المسحوب (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="المبلغ بالريال"
                    value={musabAmount}
                    onChange={e => setMusabAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. Worker Entry */}
          {selectedType === 'worker' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <UserCheck className="w-4 h-4" />
                <span>صرفة أو سلفة للعمال (حمدان والمهندس)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">اسم العامل:</label>
                  <select
                    value={workerName}
                    onChange={e => setWorkerName(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none font-bold"
                  >
                    <option value="حمدان">العامل حمدان</option>
                    <option value="المهندس">المهندس (772315106)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">نوع المبلغ:</label>
                  <select
                    value={workerType}
                    onChange={e => setWorkerType(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="صرفة">صرفة يومية</option>
                    <option value="حساب">سحب من الحساب / راتب</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبلغ (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="المبلغ بالريال"
                    value={workerAmount}
                    onChange={e => setWorkerAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. Supplier Entry */}
          {selectedType === 'supplier' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Truck className="w-4 h-4" />
                <span>تسجيل حوالة أو مشتريات تاجر ومورد (المقاصة)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">اسم التاجر أو المورد:</label>
                  <select
                    value={suppName}
                    onChange={e => setSuppName(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none font-bold"
                  >
                    <option value="عمر القاسمي">عمر القاسمي</option>
                    <option value="خليل الأغبري">خليل الأغبري</option>
                    <option value="محمد مياس">محمد مياس</option>
                    <option value="فايز أبو علي">فايز أبو علي</option>
                    <option value="العبصري">العبصري</option>
                    <option value="المصنف">المصنف</option>
                    <option value="أبو صالح الأقمري">أبو صالح الأقمري</option>
                    <option value="أخرى">تاجر ومورد آخر</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">طريقة الحوالة / السداد:</label>
                  <select
                    value={suppMethod}
                    onChange={e => setSuppMethod(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="نقد">نقد يدوي</option>
                    <option value="كريمي">حوالة كريمي</option>
                    <option value="جوالي">جوالي</option>
                    <option value="جيب">محفظة جيب</option>
                    <option value="صاحب المتر">مع صاحب المتر</option>
                    <option value="عبر البرنامج">عبر البرنامج / التطبيق</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبلغ المحول / المدفوع (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="مبلغ الحوالة"
                    value={suppAmount}
                    onChange={e => setSuppAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">قيمة المشتريات المستلمة (ر.ي):</label>
                  <input
                    type="number"
                    placeholder="اتركه فارغاً إن كانت مطابقة"
                    value={suppPurchases}
                    onChange={e => setSuppPurchases(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">رقم سند الحوالة أو ملاحظات:</label>
                  <input
                    type="text"
                    placeholder="مثال: رقم الحوالة، اسم القطع المستلمة..."
                    value={suppNotes}
                    onChange={e => setSuppNotes(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 9. Return Entry */}
          {selectedType === 'return' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <RotateCcw className="w-4 h-4" />
                <span>تسجيل مرتجع (زبون أو تاجر)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">البيان وسبب الارجاع: *</label>
                  <input
                    type="text"
                    placeholder="مثال: مرتجع شاشة، إرجاع جوال، إكسسوار تالف..."
                    value={returnTitle}
                    onChange={e => setReturnTitle(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">نوع المرتجع:</label>
                  <select
                    value={returnType}
                    onChange={e => setReturnType(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none font-bold"
                  >
                    <option value="مرتجع زبون">مرتجع زبون</option>
                    <option value="مرتجع لتاجر">مرتجع لتاجر</option>
                    <option value="مسلم لمصعب">مسلم لمصعب</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">المبلغ المرتجع (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="المبلغ بالريال"
                    value={returnAmount}
                    onChange={e => setReturnAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Attached Document & Receipt Image (For ANY transaction) */}
          <div className="p-3 bg-[#0F172A] rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>إرفاق صورة سند القبض / الفاتورة الخارجية / الورقيات:</span>
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>حذف الصورة</span>
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="flex items-center gap-3 bg-[#1E293B] p-2 rounded-xl border border-slate-700">
                <img src={imageUrl} alt="سند مرفق" className="w-16 h-16 object-cover rounded-lg border border-slate-600" />
                <div className="text-[11px] text-slate-300">
                  <span className="text-emerald-400 font-bold block">✓ تم إرفاق المستند بنجاح</span>
                  <span className="text-[10px] text-slate-400">سيتم حفظ الصورة في السجل للمطابقة الدفترية.</span>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 bg-[#1E293B]/60 text-slate-400 hover:text-white transition cursor-pointer text-xs font-semibold">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>التقاط صورة بالكاميرا أو اختيار من المعرض</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
            )}
          </div>

          {/* Quick WhatsApp / SMS Direct Send Option */}
          {isCustomerRelevant && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-300">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-bold">إرسال الفاتورة والشروط مباشرة للعميل:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSendInvoiceViaWhatsApp}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  title="إرسال عبر الواتساب"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const msg = buildCustomerInvoiceMessage({
                      type: 'مبيع إكسسوار',
                      customerName,
                      customerPhone,
                      itemName: accName || phoneModel || maintName || 'فاتورة',
                      totalAmount: Number(accPrice || phoneSalePrice || maintPrice) || 0,
                      notes
                    });
                    openSMS(customerPhone, msg);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-sky-300 border border-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  title="إرسال عبر SMS"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer with Actions */}
          <div className="pt-3.5 border-t border-slate-700 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer min-h-[40px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer min-h-[40px]"
            >
              <Check className="w-4 h-4" />
              <span>حفظ العملية وإضافتها لليوم</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
