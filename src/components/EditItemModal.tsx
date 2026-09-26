import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Camera, 
  Trash2, 
  Clock, 
  User, 
  Phone, 
  Building, 
  ShieldCheck, 
  Upload, 
  Calendar,
  MessageSquare,
  Send
} from 'lucide-react';
import { SHOP_INFO } from '../types';
import { openWhatsApp, buildCustomerInvoiceMessage, buildGuarantorAlertMessage } from '../utils/messaging';

export interface EditItemData {
  section: 'accessories' | 'phones' | 'maintenance' | 'expenses' | 'musabHouse' | 'musabPersonal' | 'workers' | 'supplierTransfers' | 'returns';
  id: string;
  title: string;
  amount: number; // سعر البيع للزبون
  cost?: number; // التكلفة / رأس المال / تكلفة القطع
  profit?: number; // الفائدة والربح التقريبي
  partCost?: number;
  laborCost?: number;
  paidAmount?: number;
  remainingAmount?: number;
  categoryOrType?: string;
  customerName?: string;
  customerPhone?: string;
  saleType?: 'نقد' | 'دين';
  workplace?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  dueDate?: string;
  dueTime?: string;
  imageUrl?: string;
  invoiceNumber?: string;
  notes?: string;
  workerName?: 'حمدان' | 'المهندس' | 'عبد الغني' | 'أخرى';
  supplierName?: string;
  transferMethod?: string;
  purchasesReceivedValue?: number;
}

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EditItemData | null;
  onSave: (updatedItem: EditItemData) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave
}) => {
  if (!isOpen || !item) return null;

  const [title, setTitle] = useState(item.title || '');
  const [amount, setAmount] = useState(item.amount?.toString() || '0');
  const [cost, setCost] = useState(item.cost !== undefined ? item.cost.toString() : '');
  const [profit, setProfit] = useState(item.profit !== undefined ? item.profit.toString() : '');
  const [paidAmount, setPaidAmount] = useState(item.paidAmount?.toString() || '');
  const [remainingAmount, setRemainingAmount] = useState(item.remainingAmount?.toString() || '');
  const [categoryOrType, setCategoryOrType] = useState(item.categoryOrType || '');
  const [customerName, setCustomerName] = useState(item.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(item.customerPhone || '');
  const [saleType, setSaleType] = useState<'نقد' | 'دين'>(item.saleType || 'نقد');
  const [workplace, setWorkplace] = useState(item.workplace || '');
  const [guarantorName, setGuarantorName] = useState(item.guarantorName || '');
  const [guarantorPhone, setGuarantorPhone] = useState(item.guarantorPhone || '');
  const [dueDate, setDueDate] = useState(item.dueDate || '');
  const [dueTime, setDueTime] = useState(item.dueTime || '20:00');
  const [imageUrl, setImageUrl] = useState<string | undefined>(item.imageUrl);
  const [invoiceNumber, setInvoiceNumber] = useState(item.invoiceNumber || '');
  const [notes, setNotes] = useState(item.notes || '');
  const [workerName, setWorkerName] = useState(item.workerName || 'حمدان');
  const [supplierName, setSupplierName] = useState(item.supplierName || 'عمر القاسمي');
  const [transferMethod, setTransferMethod] = useState(item.transferMethod || 'نقد');
  const [purchasesReceivedValue, setPurchasesReceivedValue] = useState(item.purchasesReceivedValue?.toString() || '');
  const [showMoreDetails, setShowMoreDetails] = useState(!!(item.guarantorName || item.workplace || item.dueDate || item.saleType === 'دين'));

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setAmount(item.amount?.toString() || '0');
      setCost(item.cost !== undefined ? item.cost.toString() : '');
      setProfit(item.profit !== undefined ? item.profit.toString() : '');
      setPaidAmount(item.paidAmount !== undefined ? item.paidAmount.toString() : '');
      setRemainingAmount(item.remainingAmount !== undefined ? item.remainingAmount.toString() : '');
      setCategoryOrType(item.categoryOrType || '');
      setCustomerName(item.customerName || '');
      setCustomerPhone(item.customerPhone || '');
      setSaleType(item.saleType || 'نقد');
      setWorkplace(item.workplace || '');
      setGuarantorName(item.guarantorName || '');
      setGuarantorPhone(item.guarantorPhone || '');
      setDueDate(item.dueDate || '');
      setDueTime(item.dueTime || '20:00');
      setImageUrl(item.imageUrl);
      setInvoiceNumber(item.invoiceNumber || '');
      setNotes(item.notes || '');
      setWorkerName(item.workerName || 'حمدان');
      setSupplierName(item.supplierName || 'عمر القاسمي');
      setTransferMethod(item.transferMethod || 'نقد');
      setPurchasesReceivedValue(item.purchasesReceivedValue?.toString() || '');
      setShowMoreDetails(!!(item.guarantorName || item.workplace || item.dueDate || item.saleType === 'دين'));
    }
  }, [item]);

  // Auto calculate profit if cost and amount change
  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (cost !== '' && val !== '') {
      const numAmt = Number(val) || 0;
      const numCost = Number(cost) || 0;
      setProfit(Math.max(0, numAmt - numCost).toString());
    }
  };

  const handleCostChange = (val: string) => {
    setCost(val);
    if (amount !== '' && val !== '') {
      const numAmt = Number(amount) || 0;
      const numCost = Number(val) || 0;
      setProfit(Math.max(0, numAmt - numCost).toString());
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount) || 0;
    let numPaid = paidAmount !== '' ? Number(paidAmount) : numAmount;
    let numRemaining = remainingAmount !== '' ? Number(remainingAmount) : Math.max(0, numAmount - numPaid);

    if (saleType === 'دين' && paidAmount === '') {
      numPaid = 0;
      numRemaining = numAmount;
    }

    const updated: EditItemData = {
      ...item,
      title,
      amount: numAmount,
      cost: cost !== '' ? Number(cost) : undefined,
      profit: profit !== '' ? Number(profit) : undefined,
      paidAmount: item.section === 'phones' ? numPaid : (paidAmount !== '' ? Number(paidAmount) : undefined),
      remainingAmount: item.section === 'phones' ? numRemaining : (remainingAmount !== '' ? Number(remainingAmount) : undefined),
      categoryOrType,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      saleType,
      workplace: workplace || undefined,
      guarantorName: guarantorName || undefined,
      guarantorPhone: guarantorPhone || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      imageUrl: imageUrl || undefined,
      invoiceNumber: invoiceNumber || undefined,
      notes: notes || undefined,
      workerName: item.section === 'workers' ? workerName : undefined,
      supplierName: item.section === 'supplierTransfers' ? supplierName : undefined,
      transferMethod: item.section === 'supplierTransfers' ? transferMethod : undefined,
      purchasesReceivedValue: purchasesReceivedValue !== '' ? Number(purchasesReceivedValue) : undefined
    };

    onSave(updated);
    onClose();
  };

  const handleSendInvoice = () => {
    let invType: any = 'مبيع إكسسوار';
    if (item.section === 'phones') invType = 'بيع جوال';
    else if (item.section === 'maintenance') invType = 'صيانة وبرمجة';
    else if (item.section === 'returns') invType = 'مرتجع';
    else if (item.section === 'expenses') invType = 'فاتورة مشتريات';

    const numAmount = Number(amount) || 0;
    const numPaid = paidAmount !== '' ? Number(paidAmount) : numAmount;

    const msg = buildCustomerInvoiceMessage({
      type: invType,
      customerName,
      customerPhone,
      itemName: title,
      totalAmount: numAmount,
      paidAmount: numPaid,
      remainingAmount: Math.max(0, numAmount - numPaid),
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
    const numAmount = Number(amount) || 0;
    const numPaid = paidAmount !== '' ? Number(paidAmount) : 0;
    const remaining = Math.max(0, numAmount - numPaid);

    const msg = buildGuarantorAlertMessage(
      guarantorName || 'الأخ الضمين',
      customerName || 'العميل',
      remaining,
      title,
      dueDate,
      dueTime === '20:00' ? '8:00 مساءً' : dueTime
    );

    openWhatsApp(guarantorPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              ✏️
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تعديل العملية وتفاصيل المستند</h3>
              <p className="text-xs text-slate-400">تعديل الأسعار، العميل، الضمين، وقت التنبيه، وإرفاق المستندات الورقية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Item Main Name / Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">البيان / اسم الصنف أو الجهاز / الخدمة: *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">سعر البيع / الإجمالي (ر.ي): *</label>
              <input
                type="number"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Cost & Profit calculation box for relevant sections (accessories, maintenance, phones) */}
          {(item.section === 'accessories' || item.section === 'maintenance' || item.section === 'phones') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                  <span>التكلفة / سعر الشراء / قطع الغيار (ر.ي):</span>
                  <span className="text-[10px] text-slate-400 font-normal">رأس المال</span>
                </label>
                <input
                  type="number"
                  value={cost}
                  placeholder="أدخل التكلفة لحساب الفائدة تلقائياً"
                  onChange={e => handleCostChange(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono-num focus:border-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-emerald-400 font-bold block mb-1 flex items-center justify-between">
                  <span>مبلغ الفائدة والربح التقريبي (ر.ي):</span>
                  <span className="text-[10px] text-emerald-300 font-normal">صافي الربح</span>
                </label>
                <input
                  type="number"
                  value={profit}
                  placeholder="يتم حسابه تلقائياً (البيع - التكلفة)"
                  onChange={e => setProfit(e.target.value)}
                  className="w-full bg-[#0F172A] border border-emerald-500/40 rounded-lg px-3 py-1.5 text-emerald-400 font-mono-num font-bold focus:border-emerald-500 focus:outline-none text-xs"
                />
              </div>
            </div>
          )}

          {/* If Phone, show Paid & Remaining */}
          {item.section === 'phones' && (
            <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">الواصل (المقبوض نقداً):</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-num focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">المتبقي (الآجل):</label>
                <input
                  type="number"
                  value={remainingAmount}
                  onChange={e => setRemainingAmount(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-num text-rose-400 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Supplier section specific */}
          {item.section === 'supplierTransfers' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">اسم التاجر:</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">قيمة المشتريات المستلمة:</label>
                <input
                  type="number"
                  value={purchasesReceivedValue}
                  onChange={e => setPurchasesReceivedValue(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-num focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">طريقة الحوالة:</label>
                <input
                  type="text"
                  value={transferMethod}
                  onChange={e => setTransferMethod(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Customer & Guarantor Section */}
          <div className="p-3.5 bg-[#0F172A] rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>بيانات العميل والفاتورة:</span>
              </span>
              
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
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">اسم العميل:</label>
                <input
                  type="text"
                  placeholder="اسم العميل..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">رقم هاتف العميل (واتساب/سند):</label>
                <input
                  type="tel"
                  placeholder="رقم الهاتف..."
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Toggle More Details */}
            <div>
              <button
                type="button"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer py-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{showMoreDetails ? 'إخفاء تفاصيل الضمين والموعد ⬆️' : 'تفاصيل أكثر: مكان العمل، الضمين، وقت تنبيه 8:00 م ⬇️'}</span>
              </button>

              {showMoreDetails && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-900/60 p-3 rounded-xl">
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">مكان العمل / العنوان:</label>
                    <input
                      type="text"
                      placeholder="جهة العمل أو العنوان..."
                      value={workplace}
                      onChange={e => setWorkplace(e.target.value)}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">اسم الضمين / المعرف:</label>
                    <input
                      type="text"
                      placeholder="اسم الضامن..."
                      value={guarantorName}
                      onChange={e => setGuarantorName(e.target.value)}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">رقم هاتف الضمين:</label>
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
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">تاريخ السداد:</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-amber-400 font-semibold block mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>وقت التنبيه:</span>
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
                      <span className="text-[10px] text-slate-400">تنبيه الضمين بخصوص السداد (افتراضي 8:00 مساءً):</span>
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

          {/* Attached Document & Receipt Image */}
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
                <div className="text-[11px] text-slate-300 flex-1">
                  <span className="text-emerald-400 font-bold block">✓ مستند مرفق</span>
                  <label className="text-indigo-400 hover:text-indigo-300 font-bold text-[10px] cursor-pointer underline block mt-1">
                    تبديل الصورة
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 bg-[#1E293B]/60 text-slate-400 hover:text-white transition cursor-pointer text-xs font-semibold">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>التقاط صورة بالكاميرا أو اختيار من المعرض للمطابقة الدفترية</span>
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

          {/* Notes */}
          <div>
            <label className="text-[11px] text-slate-300 font-semibold block mb-1">ملاحظات العملية:</label>
            <input
              type="text"
              placeholder="ملاحظات..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Quick WhatsApp Share Button */}
          {customerPhone && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>إرسال الفاتورة والشروط المحدثة للعميل عبر الواتساب:</span>
              </span>
              <button
                type="button"
                onClick={handleSendInvoice}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <span>واتساب</span>
              </button>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-700 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
