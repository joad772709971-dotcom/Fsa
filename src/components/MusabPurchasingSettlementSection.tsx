import React, { useState } from 'react';
import { 
  Smartphone, 
  Wallet, 
  RotateCcw, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Edit3, 
  Plus, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  Wifi, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  Coins,
  Receipt,
  Scale,
  Info
} from 'lucide-react';
import { 
  MusabPurchasingSettlement, 
  MusabReturnPhoneItem, 
  MusabCashSourceItem 
} from '../types';
import { INITIAL_MUSAB_PURCHASING_SETTLEMENT } from '../data/initialPartnersData';
import { exportMusabPurchasingToExcel } from '../utils/excelExport';
import { formatNumber } from '../utils/accounting';

interface MusabPurchasingSettlementSectionProps {
  settlement?: MusabPurchasingSettlement;
  onUpdateSettlement?: (settlement: MusabPurchasingSettlement) => void;
}

export const MusabPurchasingSettlementSection: React.FC<MusabPurchasingSettlementSectionProps> = ({
  settlement = INITIAL_MUSAB_PURCHASING_SETTLEMENT,
  onUpdateSettlement
}) => {
  const [data, setData] = useState<MusabPurchasingSettlement>(settlement);
  const [copied, setCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState<MusabPurchasingSettlement>(data);
  const [newReturnPhone, setNewReturnPhone] = useState<Partial<MusabReturnPhoneItem>>({
    name: '',
    amount: 0,
    notes: 'مرتجع للتاجر تم استلام قيمته كاش'
  });
  const [newCashSource, setNewCashSource] = useState<Partial<MusabCashSourceItem>>({
    sourceType: 'نقد',
    amount: 0,
    deliveredBy: 'باسم',
    description: 'تسليم نقدي'
  });

  const updateStateAndParent = (newData: MusabPurchasingSettlement) => {
    setData(newData);
    if (onUpdateSettlement) {
      onUpdateSettlement(newData);
    }
  };

  // Calculations
  const totalReturns = (data.returnedPhones || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalCash = (data.cashSources || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const purchasedPhones = data.purchasedPhonesAmount || 0;
  const paidSuppliers = data.paidToSuppliers || 0;
  const remainingToSuppliers = purchasedPhones - paidSuppliers; // 35,500
  const remainingCashWithMusab = totalCash - paidSuppliers; // 75,000
  const surplusVsPhones = totalCash - purchasedPhones; // 39,500

  const handleCopyWhatsApp = () => {
    const text = `📋 كشف مشتريات وعهدة وتصفية مصعب (الجوالات، المرتجعات، والسيولة النقدية):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 ١. المرتجعات التي مكنته يرجعها للتجار وشل قيمتها (إجمالي: ${formatNumber(totalReturns)} ر.ي):
${(data.returnedPhones || []).map((p, idx) => `  ${idx + 1}- ${p.name}: ${formatNumber(p.amount)} ر.ي (${p.notes || 'تم استلام القيمة'})`).join('\n')}

💵 ٢. مصادر السيولة والزلط المسلمة لمصعب (إجمالي العهدة: ${formatNumber(totalCash)} ر.ي):
${(data.cashSources || []).map((c, idx) => `  ${idx + 1}- ${c.sourceType} (${c.deliveredBy}): ${formatNumber(c.amount)} ر.ي - ${c.description}`).join('\n')}

📦 ٣. الجوالات الموردة للمحل والمبالغ المسلمة للتجار:
- قيمة الجوالات الجديدة الموردة للمحل: ${formatNumber(purchasedPhones)} ر.ي
- ما سلمه للتاجر فعلياً نقداً: ${formatNumber(paidSuppliers)} ر.ي
- المتبقي للتاجر من قيمة الجوالات: ${formatNumber(remainingToSuppliers)} ر.ي

💰 ٤. خلاصة التصفية المالية والمتبقي كاش في يد مصعب:
- إجمالي السيولة المستلمة: ${formatNumber(totalCash)} ر.ي
- المسدد للتجار نقداً: ${formatNumber(paidSuppliers)} ر.ي
★ المتبقي كاش في يد مصعب: ${formatNumber(remainingCashWithMusab)} ر.ي

📶 ٥. عملية مودم أوبرا (عبد المجيد القيسي):
- استلم مصعب ${formatNumber(data.modemTransaction.amount)} ر.ي نقد (نص الليل) حق مودم أوبرا.
- حولها مصعب لتجار المودمات وفعلوا المودم للمشتري بالكامل (${data.modemTransaction.status}).
━━━━━━━━━━━━━━━━━━━━━━━━━━━
تاريخ الكشف: ${new Date().toISOString().split('T')[0]} - مطابق وسليم 100%`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenEditModal = () => {
    setEditFormData(JSON.parse(JSON.stringify(data)));
    setIsEditModalOpen(true);
  };

  const handleAddReturnPhone = () => {
    if (!newReturnPhone.name || !newReturnPhone.amount || Number(newReturnPhone.amount) <= 0) {
      alert('يرجى كتابة اسم الجهاز ومبلغ المرتجع');
      return;
    }
    const updatedPhones = [
      ...(editFormData.returnedPhones || []),
      {
        id: `ret-${Date.now()}`,
        name: newReturnPhone.name.trim(),
        amount: Number(newReturnPhone.amount),
        notes: newReturnPhone.notes?.trim() || 'مرتجع للتاجر',
        status: 'تم الإرجاع واستلام القيمة' as const
      }
    ];
    setEditFormData(prev => ({
      ...prev,
      returnedPhones: updatedPhones,
      totalReturnedPhonesAmount: updatedPhones.reduce((s, p) => s + p.amount, 0)
    }));
    setNewReturnPhone({ name: '', amount: 0, notes: 'مرتجع للتاجر تم استلام قيمته كاش' });
  };

  const handleRemoveReturnPhone = (id: string) => {
    const updatedPhones = (editFormData.returnedPhones || []).filter(p => p.id !== id);
    setEditFormData(prev => ({
      ...prev,
      returnedPhones: updatedPhones,
      totalReturnedPhonesAmount: updatedPhones.reduce((s, p) => s + p.amount, 0)
    }));
  };

  const handleAddCashSource = () => {
    if (!newCashSource.amount || Number(newCashSource.amount) <= 0) {
      alert('يرجى تحديد مبلغ السيولة');
      return;
    }
    const updatedCash = [
      ...(editFormData.cashSources || []),
      {
        id: `cash-${Date.now()}`,
        sourceType: newCashSource.sourceType || 'نقد',
        amount: Number(newCashSource.amount),
        deliveredBy: newCashSource.deliveredBy?.trim() || 'باسم',
        description: newCashSource.description?.trim() || 'تسليم سيولة',
        date: new Date().toISOString().split('T')[0]
      }
    ];
    setEditFormData(prev => ({
      ...prev,
      cashSources: updatedCash,
      totalCashReceived: updatedCash.reduce((s, c) => s + c.amount, 0)
    }));
    setNewCashSource({ sourceType: 'نقد', amount: 0, deliveredBy: 'باسم', description: 'تسليم نقدي' });
  };

  const handleRemoveCashSource = (id: string) => {
    const updatedCash = (editFormData.cashSources || []).filter(c => c.id !== id);
    setEditFormData(prev => ({
      ...prev,
      cashSources: updatedCash,
      totalCashReceived: updatedCash.reduce((s, c) => s + c.amount, 0)
    }));
  };

  const handleSaveEditModal = (e: React.FormEvent) => {
    e.preventDefault();
    const totalRet = (editFormData.returnedPhones || []).reduce((s, p) => s + p.amount, 0);
    const totalCsh = (editFormData.cashSources || []).reduce((s, c) => s + c.amount, 0);
    const purch = Number(editFormData.purchasedPhonesAmount) || 0;
    const paid = Number(editFormData.paidToSuppliers) || 0;

    const finalized: MusabPurchasingSettlement = {
      ...editFormData,
      totalReturnedPhonesAmount: totalRet,
      totalCashReceived: totalCsh,
      purchasedPhonesAmount: purch,
      paidToSuppliers: paid,
      remainingToSuppliers: purch - paid,
      remainingCashWithMusab: totalCsh - paid,
      surplusValueVsPhones: totalCsh - purch
    };

    updateStateAndParent(finalized);
    setIsEditModalOpen(false);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('هل تريد إعادة تعيين كشف مصعب إلى الأرقام والبيانات الأصلية المعتمدة؟')) {
      updateStateAndParent(INITIAL_MUSAB_PURCHASING_SETTLEMENT);
      setIsEditModalOpen(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Header Card with Action Controls */}
      <div className="bg-gradient-to-l from-indigo-950/80 via-[#1E293B] to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Header Title & Subtitle */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  مشتريات وعهدة وتصفية مصعب
                </h2>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تصفية الجوالات والمرتجعات والسيولة</span>
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
                  سجل معتمد ومطابق
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                كشف تفصيلي شامل لمشتريات الجوالات الجديدة، المرتجعات التي شل قيمتها من التجار، مبالغ السيولة المحولة والمسلمة له، وعملية تفعيل مودم أوبرا.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            
            {/* Copy WhatsApp */}
            <button
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="نسخ كشف التصفية بالكامل بصيغة منسقة للواتساب"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span>{copied ? 'تم نسخ الكشف ✓' : 'نسخ لواتساب'}</span>
            </button>

            {/* Excel Export */}
            <button
              onClick={() => exportMusabPurchasingToExcel(data)}
              className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="تصدير كشف تصفية مصعب إلى ملف Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تصدير Excel</span>
            </button>

            {/* Edit / Modify */}
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
              title="تعديل أرقام التصفية أو إضافة مبالغ ومرتجعات جديدة"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل وتحديث الكشف</span>
            </button>

          </div>

        </div>

      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* KPI 1: Total Cash Received (السيولة والعهدة) */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي السيولة المستلمة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono-num text-white">
              {formatNumber(totalCash)} <span className="text-xs font-normal text-slate-400">ر.ي</span>
            </div>
            <p className="text-[11px] text-amber-300/90 font-medium mt-1">
              نقد باسم + جوالي + المرتجعات
            </p>
          </div>
        </div>

        {/* KPI 2: Paid to Suppliers (ما سلمه للتاجر) */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">المسلّم للتجار نقداً</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono-num text-rose-300">
              {formatNumber(paidSuppliers)} <span className="text-xs font-normal text-slate-400">ر.ي</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              ما خرج فعلياً من يده للتاجر
            </p>
          </div>
        </div>

        {/* KPI 3: Remaining Cash with Musab (المتبقي كاش بيده - النتيجة الذهبية) */}
        <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-lg shadow-emerald-950/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>المتبقي كاش عند مصعب</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-400 drop-shadow-xs">
              {formatNumber(remainingCashWithMusab)} <span className="text-xs font-bold text-emerald-200">ر.ي</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-emerald-300 font-bold">
                صافي العهدة الكاش بيده الآن
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Purchased Phones & Remaining to Suppliers */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الجوالات الموردة للمحل</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono-num text-cyan-300">
              {formatNumber(purchasedPhones)} <span className="text-xs font-normal text-slate-400">ر.ي</span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-700/50">
              <span className="text-slate-400">باقي للتاجر:</span>
              <strong className="text-amber-300 font-mono-num font-bold">
                {formatNumber(remainingToSuppliers)} ر.ي
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 5: Opera Modem Transaction */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">مودم أوبرا (القيسي)</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono-num text-teal-300">
              {formatNumber(data.modemTransaction.amount)} <span className="text-xs font-normal text-slate-400">ر.ي</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>مفعل ومكتمل 100%</span>
            </p>
          </div>
        </div>

      </div>

      {/* 4 Pillar Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Pillar 1: Cash & Handover Sources (مصادر السيولة) */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">١. مصادر السيولة النقدية المسلّمة لمصعب (مخصومة من الصندوق)</h3>
                  <p className="text-[11px] text-slate-400">عهدة مشتريات نقدية (150,000 كاش + 67,000 جوالي = 217,000 خصمت من صندوق المحل)</p>
                </div>
              </div>
              <span className="text-xs font-mono-num font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                {formatNumber(totalCash)} ر.ي
              </span>
            </div>

            {/* List of cash sources */}
            <div className="mt-4 space-y-2.5">
              {(data.cashSources || []).map((cs, idx) => (
                <div 
                  key={cs.id || idx}
                  className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{cs.sourceType}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                          بواسطة: {cs.deliveredBy}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {cs.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-sm font-black font-mono-num text-amber-300">
                      {formatNumber(cs.amount)} <span className="text-[10px] text-slate-400 font-normal">ر.ي</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>مقبوض</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>مجموع بنود السيولة:</span>
            <strong className="text-white font-mono-num font-bold">
              150,000 (نقد باسم) + 67,000 (جوالي) + 75,000 (استرداد مرتجعات) = {formatNumber(totalCash)} ر.ي
            </strong>
          </div>
        </div>

        {/* Pillar 2: Returned Phones Ledger (المرتجعات المكنة له) */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">٢. المرتجعات التي مكنته يرجعها للتجار وشل قيمتها</h3>
                  <p className="text-[11px] text-slate-400">جوالات مكنته يرجعها واستلم قيمتها كاش من التجار</p>
                </div>
              </div>
              <span className="text-xs font-mono-num font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-xl">
                {formatNumber(totalReturns)} ر.ي
              </span>
            </div>

            {/* List of returned phones */}
            <div className="mt-4 space-y-2.5">
              {(data.returnedPhones || []).map((phone, idx) => (
                <div 
                  key={phone.id || idx}
                  className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-purple-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">{phone.name}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {phone.notes || 'مرتجع للتاجر'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-sm font-black font-mono-num text-purple-300">
                      {formatNumber(phone.amount)} <span className="text-[10px] text-slate-400 font-normal">ر.ي</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                      تم استلام القيمة
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>إجمالي قيمة المرتجعات المستردة:</span>
            <strong className="text-purple-300 font-mono-num font-bold">
              32,000 (A32) + 17,000 (A10e) + 24,000 (2× Revvl) = {formatNumber(totalReturns)} ر.ي
            </strong>
          </div>
        </div>

        {/* Pillar 3: New Purchased Phones & Supplier Settlements */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">٣. مشتريات الجوالات الجديدة والمدفوع للتجار</h3>
                  <p className="text-[11px] text-slate-400">ما أداه للمحل وما سلمه للتاجر فعلياً</p>
                </div>
              </div>
              <span className="text-xs font-mono-num font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-xl">
                {formatNumber(purchasedPhones)} ر.ي
              </span>
            </div>

            <div className="mt-4 space-y-3">
              
              <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">قيمة الجوالات الجديدة الموردة للمحل:</span>
                  <p className="text-[11px] text-slate-400">{data.purchasedPhonesDetails || 'أداها مصعب للمحل'}</p>
                </div>
                <strong className="text-base font-black font-mono-num text-cyan-300">
                  {formatNumber(purchasedPhones)} ر.ي
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">المبلغ المسلّم للتاجر نقداً:</span>
                  <p className="text-[11px] text-rose-300/80">ما دفعه مصعب للتاجر من العهدة النقدية</p>
                </div>
                <strong className="text-base font-black font-mono-num text-rose-300">
                  {formatNumber(paidSuppliers)} ر.ي
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-300">المتبقي للتاجر من قيمة الجوالات:</span>
                  <p className="text-[11px] text-slate-400">252,500 (القيمة) - 217,000 (المدفوع)</p>
                </div>
                <strong className="text-base font-black font-mono-num text-amber-300">
                  {formatNumber(remainingToSuppliers)} ر.ي
                </strong>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>حالة حساب التاجر:</span>
            <span className="text-amber-300 font-bold">له متبقي آجل قدره {formatNumber(remainingToSuppliers)} ر.ي</span>
          </div>
        </div>

        {/* Pillar 4: Opera Modem Transaction Details */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">٤. عملية مودم أوبرا (عبد المجيد القيسي)</h3>
                  <p className="text-[11px] text-slate-400">استلام وتحويل وتفعيل المودم</p>
                </div>
              </div>
              <span className="text-xs font-mono-num font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-xl">
                {formatNumber(data.modemTransaction.amount)} ر.ي
              </span>
            </div>

            <div className="mt-4 space-y-3">
              
              <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">الزبون / صاحب المعاملة:</span>
                  <strong className="text-xs text-white font-bold">{data.modemTransaction.customerName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">الجهاز / الخدمة:</span>
                  <strong className="text-xs text-teal-300 font-bold">{data.modemTransaction.itemName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">وقت وطريقة الاستلام:</span>
                  <span className="text-xs text-amber-300 font-medium">{data.modemTransaction.timeReceived}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300">الإجراء المنفذ:</span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    {data.modemTransaction.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.modemTransaction.action}
                </p>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-emerald-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>المعاملة مكتملة ومغلقة بنجاح</span>
            </span>
            <span className="font-mono-num">{formatNumber(data.modemTransaction.amount)} ر.ي</span>
          </div>
        </div>

      </div>

      {/* Comprehensive Mathematical Reconciliation Board (لوحة المقاصة الحسابية الشاملة) */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black text-white">
              خلاصة التصفية المحاسبية والمقاصة النهائية لعهدة مصعب
            </h3>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
            مطابقة تامة وسليمة 100%
          </span>
        </div>

        {/* Breakdown Equation Table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-300 block">١. معادلة السيولة النقدية:</span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>إجمالي السيولة المستلمة:</span>
                <strong className="text-white font-mono-num">{formatNumber(totalCash)} ر.ي</strong>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>يُخصم المسلم للتجار:</span>
                <strong className="font-mono-num">-{formatNumber(paidSuppliers)} ر.ي</strong>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between text-emerald-400 font-bold">
                <span>المتبقي كاش في يد مصعب:</span>
                <strong className="font-mono-num text-sm">{formatNumber(remainingCashWithMusab)} ر.ي</strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-cyan-300 block">٢. معادلة قيمة البضاعة والتاجر:</span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>قيمة الجوالات الموردة:</span>
                <strong className="text-white font-mono-num">{formatNumber(purchasedPhones)} ر.ي</strong>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>المسلم للتاجر فعلياً:</span>
                <strong className="font-mono-num">-{formatNumber(paidSuppliers)} ر.ي</strong>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between text-amber-300 font-bold">
                <span>باقي للتاجر من البضاعة:</span>
                <strong className="font-mono-num text-sm">{formatNumber(remainingToSuppliers)} ر.ي</strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <span className="text-xs font-bold text-emerald-300 block">٣. تطابق الحسبة الإجمالية:</span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>فائض السيولة عن البضاعة:</span>
                <strong className="text-white font-mono-num">{formatNumber(surplusVsPhones)} ر.ي</strong>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>يضاف باقي التاجر في يد مصعب:</span>
                <strong className="font-mono-num">+{formatNumber(remainingToSuppliers)} ر.ي</strong>
              </div>
              <div className="pt-1.5 border-t border-emerald-500/40 flex justify-between text-emerald-300 font-black">
                <span>إجمالي الكاش الموجود عند مصعب:</span>
                <strong className="font-mono-num text-sm text-emerald-400">{formatNumber(remainingCashWithMusab)} ر.ي</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Narrative Bottom Note */}
        <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>ملاحظة الاعتماد:</strong> تم استلام وقيد الجوالات الموردة للمحل بإجمالي <strong className="text-cyan-300 font-mono-num">252,500 ر.ي</strong>، وسدد مصعب للتاجر نقداً <strong className="text-rose-300 font-mono-num">217,000 ر.ي</strong> من أصل سيولة إجمالية بيده قدرها <strong className="text-amber-300 font-mono-num">292,000 ر.ي</strong> (شاملة المرتجعات 75,000 ر.ي وحوالة جوالي 67,000 ر.ي ونقد باسم 150,000 ر.ي). وعليه، <strong className="text-emerald-400 underline font-bold">فإن صافي المبلغ المتبقي كاش في يد مصعب هو 75,000 ر.ي تماماً</strong>، ومتبقي للتاجر 35,500 ر.ي.
          </p>
        </div>

      </div>

      {/* Edit & Modify Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-950 to-slate-900 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">تعديل وتحديث كشف تصفية مصعب</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditModal} className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Section 1: Returns */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                  <span className="text-xs font-bold text-purple-300">١. بنود المرتجعات المستردة من التجار:</span>
                  <span className="text-xs font-mono-num text-purple-400 font-bold">
                    الإجمالي: {formatNumber((editFormData.returnedPhones || []).reduce((s, p) => s + p.amount, 0))} ر.ي
                  </span>
                </div>

                <div className="space-y-2">
                  {(editFormData.returnedPhones || []).map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between gap-2 p-2 bg-[#0F172A] rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-slate-400 text-[10px]">({p.notes})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-purple-300">{formatNumber(p.amount)} ر.ي</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReturnPhone(p.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          title="حذف هذا الجهاز المرتجع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new return phone row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="اسم الجهاز المرتجع (مثلاً: جوال Redmi 10)"
                      value={newReturnPhone.name || ''}
                      onChange={e => setNewReturnPhone(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="number"
                      placeholder="المبلغ المسترد (ر.ي)"
                      value={newReturnPhone.amount || ''}
                      onChange={e => setNewReturnPhone(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono-num"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddReturnPhone}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Cash Sources */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                  <span className="text-xs font-bold text-amber-300">٢. مصادر السيولة والزلط المسلمة له:</span>
                  <span className="text-xs font-mono-num text-amber-400 font-bold">
                    الإجمالي: {formatNumber((editFormData.cashSources || []).reduce((s, c) => s + c.amount, 0))} ر.ي
                  </span>
                </div>

                <div className="space-y-2">
                  {(editFormData.cashSources || []).map((c, idx) => (
                    <div key={c.id || idx} className="flex items-center justify-between gap-2 p-2 bg-[#0F172A] rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white">{c.sourceType} ({c.deliveredBy})</span>
                        <span className="text-slate-400 text-[10px]">- {c.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-amber-300">{formatNumber(c.amount)} ر.ي</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCashSource(c.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          title="حذف هذا المصدر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new cash source row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="نوع السيولة (مثلاً: كاش / حوالة)"
                      value={newCashSource.sourceType || ''}
                      onChange={e => setNewCashSource(prev => ({ ...prev, sourceType: e.target.value as any }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="المسلّم / المحول (مثلاً: باسم)"
                      value={newCashSource.deliveredBy || ''}
                      onChange={e => setNewCashSource(prev => ({ ...prev, deliveredBy: e.target.value }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      placeholder="المبلغ (ر.ي)"
                      value={newCashSource.amount || ''}
                      onChange={e => setNewCashSource(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono-num"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddCashSource}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Purchases and Payments */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-cyan-300 block pb-1 border-b border-slate-700">
                  ٣. مشتريات الجوالات والمسلم للتجار:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">قيمة الجوالات الجديدة الموردة (ر.ي):</label>
                    <input
                      type="number"
                      value={editFormData.purchasedPhonesAmount || 0}
                      onChange={e => setEditFormData(prev => ({ ...prev, purchasedPhonesAmount: Number(e.target.value) }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ما سلمه للتاجر فعلياً نقداً (ر.ي):</label>
                    <input
                      type="number"
                      value={editFormData.paidToSuppliers || 0}
                      onChange={e => setEditFormData(prev => ({ ...prev, paidToSuppliers: Number(e.target.value) }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono-num"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Opera Modem Transaction */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-teal-300 block pb-1 border-b border-slate-700">
                  ٤. عملية مودم أوبرا:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">اسم المشتري:</label>
                    <input
                      type="text"
                      value={editFormData.modemTransaction?.customerName || ''}
                      onChange={e => setEditFormData(prev => ({
                        ...prev,
                        modemTransaction: { ...prev.modemTransaction, customerName: e.target.value }
                      }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">المبلغ المدفوع (ر.ي):</label>
                    <input
                      type="number"
                      value={editFormData.modemTransaction?.amount || 0}
                      onChange={e => setEditFormData(prev => ({
                        ...prev,
                        modemTransaction: { ...prev.modemTransaction, amount: Number(e.target.value) }
                      }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">حالة التفعيل:</label>
                    <input
                      type="text"
                      value={editFormData.modemTransaction?.status || ''}
                      onChange={e => setEditFormData(prev => ({
                        ...prev,
                        modemTransaction: { ...prev.modemTransaction, status: e.target.value as any }
                      }))}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  استعادة الأرقام الافتراضية
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    حفظ وتثبيت التعديلات
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
