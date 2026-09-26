import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  DollarSign, 
  Smartphone, 
  ShoppingBag, 
  Truck, 
  TrendingUp, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Receipt,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowUpRight,
  Wallet,
  RotateCcw,
  Check,
  Copy,
  Banknote,
  ArrowDownLeft,
  AlertCircle
} from 'lucide-react';
import { PartnerFundingItem, PhoneFunderItem, MusabPurchasingSettlement } from '../types';
import { INITIAL_OWNER_DAY4_SETTLEMENT, INITIAL_MUSAB_PURCHASING_SETTLEMENT } from '../data/initialPartnersData';
import { exportPartnersFundingToExcel } from '../utils/excelExport';
import { formatNumber } from '../utils/accounting';
import { MusabPurchasingSettlementSection } from './MusabPurchasingSettlementSection';

type PartnerViewTab = 'abdulghani' | 'musab_purchases' | 'day4_settlement';

interface PartnersFundingViewProps {
  fundingItems: PartnerFundingItem[];
  onAddFundingItem: (item: PartnerFundingItem) => void;
  onUpdateFundingItem: (item: PartnerFundingItem) => void;
  onDeleteFundingItem: (id: string) => void;
  musabSettlement?: MusabPurchasingSettlement;
  onUpdateMusabSettlement?: (settlement: MusabPurchasingSettlement) => void;
}

export const PartnersFundingView: React.FC<PartnersFundingViewProps> = ({
  fundingItems,
  onAddFundingItem,
  onUpdateFundingItem,
  onDeleteFundingItem,
  musabSettlement,
  onUpdateMusabSettlement,
}) => {
  const [activePartnerTab, setActivePartnerTab] = useState<PartnerViewTab>('abdulghani');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFunder, setSelectedFunder] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PartnerFundingItem | null>(null);
  const [showOwnerSettlement, setShowOwnerSettlement] = useState(true);
  const [copiedSettlement, setCopiedSettlement] = useState(false);

  const ownerSettlement = INITIAL_OWNER_DAY4_SETTLEMENT;

  const handleCopyOwnerSettlement = () => {
    const text = `📋 كشف تسليمات المالك وحركة السيولة في يوم الدعم (يوم 4 شهر 8):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ ما تم استلامه من العامل حمدان:
- إجمالي المستلم: 270,500 ر.ي (مبيعات جوالات سابقة محفوظة عند حمدان)
- إرجاع عملة تالفة لم تُقبل: -2,000 ر.ي
- صافي المقبول المسلّم للمالك: 268,500 ر.ي

2️⃣ ما تم استلامه من صندوق المحل (عمل يوم 1 + 2 + 3):
- إجمالي المستلم للرحلة: 50,000 ر.ي
- أوجه الصرف في صنعاء:
  • 15,000 ر.ي (توفية للشراء والدعم)
  • 18,500 ر.ي (مرسلة لمحمد مياس مسجلة بيوم 4)
  • 16,500 ر.ي (المتبقي من الـ 50 ألف تم رده للمحل)

3️⃣ إجمالي النقدية المردودة لدرج المحل:
- 16,500 ر.ي (متبقي زلط المحل) + 2,000 ر.ي (تالفة مردودة من عهدة حمدان) = 18,500 ر.ي مردود لدرج المحل.
━━━━━━━━━━━━━━━━━━━━━━━━━━━
المطابقة المالية: 320,500 ر.ي مستلم = 302,000 ر.ي مستنفذ + 18,500 ر.ي مردود (متطابق 100%)`;
    navigator.clipboard.writeText(text);
    setCopiedSettlement(true);
    setTimeout(() => setCopiedSettlement(false), 2500);
  };

  // Form state
  const [formData, setFormData] = useState<Partial<PartnerFundingItem>>({
    funderName: 'عبد الغني',
    funderRole: 'داعم ذمار للمحل',
    date: '2026-08-04',
    dayNumber: 4,
    amount: 0,
    category: 'مشتريات إكسسوارات',
    description: '',
    supplierOrParty: '',
    paymentMethod: 'نقد',
    status: 'مقيد في رأس المال',
    notes: '',
  });

  const [customPhones, setCustomPhones] = useState<PhoneFunderItem[]>([]);
  const [newPhoneName, setNewPhoneName] = useState('');
  const [newPhoneCount, setNewPhoneCount] = useState<number>(1);

  // Calculate Metrics
  const stats = useMemo(() => {
    const totalFunding = fundingItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    // Day 4 funding
    const day4Items = fundingItems.filter(item => item.dayNumber === 4 || item.date === '2026-08-04');
    const day4Total = day4Items.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Day 5 funding
    const day5Items = fundingItems.filter(item => item.dayNumber === 5 || item.date === '2026-08-05');
    const day5Total = day5Items.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Categories Breakdown
    const accessoriesFunding = fundingItems
      .filter(i => i.category === 'مشتريات إكسسوارات' || i.category === 'إرسالية بضاعة')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const phonesFunding = fundingItems
      .filter(i => i.category === 'شراء جوالات')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const sparePartsFunding = fundingItems
      .filter(i => i.category === 'قطع غيار وصيانة' || i.category === 'قطع غيار')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const expensesFunding = fundingItems
      .filter(i => i.category === 'مصاريف ومخاريج طلعة')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Total Phones Count
    const totalPhonesCount = fundingItems.reduce((acc, curr) => {
      if (curr.phonesList && curr.phonesList.length > 0) {
        return acc + curr.phonesList.reduce((pAcc, p) => pAcc + (p.count || 1), 0);
      }
      return acc;
    }, 0);

    return {
      totalFunding,
      day4Total,
      day5Total,
      accessoriesFunding,
      phonesFunding,
      sparePartsFunding,
      expensesFunding,
      totalPhonesCount,
      totalCount: fundingItems.length,
    };
  }, [fundingItems]);

  // Unique Funders
  const uniqueFunders = useMemo(() => {
    return Array.from(new Set(fundingItems.map(i => i.funderName).filter(Boolean)));
  }, [fundingItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return fundingItems.filter(item => {
      const matchSearch = 
        item.funderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplierOrParty && item.supplierOrParty.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchFunder = selectedFunder === 'all' || item.funderName === selectedFunder;

      return matchSearch && matchCategory && matchFunder;
    });
  }, [fundingItems, searchQuery, selectedCategory, selectedFunder]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      funderName: 'عبد الغني',
      funderRole: 'داعم ذمار للمحل',
      date: new Date().toISOString().split('T')[0],
      dayNumber: 4,
      amount: 0,
      category: 'مشتريات إكسسوارات',
      description: '',
      supplierOrParty: '',
      paymentMethod: 'نقد',
      status: 'مقيد في رأس المال',
      notes: '',
    });
    setCustomPhones([]);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: PartnerFundingItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setCustomPhones(item.phonesList ? [...item.phonesList] : []);
    setIsAddModalOpen(true);
  };

  const handleAddPhoneToCustomList = () => {
    if (!newPhoneName.trim()) return;
    setCustomPhones(prev => [
      ...prev,
      {
        id: `phone-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: newPhoneName.trim(),
        count: Number(newPhoneCount) || 1,
      }
    ]);
    setNewPhoneName('');
    setNewPhoneCount(1);
  };

  const handleRemovePhoneFromCustomList = (id: string) => {
    setCustomPhones(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.funderName || !formData.amount || Number(formData.amount) <= 0) {
      alert('يرجى كتابة اسم الداعم/الشريك وتحديد المبلغ بشكل صحيح');
      return;
    }

    const itemToSave: PartnerFundingItem = {
      id: editingItem ? editingItem.id : `fund-${Date.now()}`,
      funderName: formData.funderName.trim(),
      funderRole: formData.funderRole || 'داعم ذمار للمحل',
      date: formData.date || new Date().toISOString().split('T')[0],
      dayNumber: Number(formData.dayNumber) || 4,
      amount: Number(formData.amount),
      category: (formData.category as any) || 'مشتريات إكسسوارات',
      description: formData.description?.trim() || 'تمويل ودعم للمحل',
      supplierOrParty: formData.supplierOrParty?.trim() || '',
      paymentMethod: (formData.paymentMethod as any) || 'نقد',
      status: (formData.status as any) || 'مقيد في رأس المال',
      notes: formData.notes?.trim() || '',
      phonesList: customPhones.length > 0 ? customPhones : undefined,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    if (editingItem) {
      onUpdateFundingItem(itemToSave);
    } else {
      onAddFundingItem(itemToSave);
    }

    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Users className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  قسم الداعمين والشركاء ورأس المال
                </h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  💎 دعم ذمار للمحل
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                سجل توثيق تمويلات الشركاء والداعمين (عبد الغني)، تفاصيل المشتريات، الجوالات، إرساليات البضائع، ومخاريج السفر
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap no-print">
            <button
              onClick={() => exportPartnersFundingToExcel(fundingItems)}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
              title="تصدير كشف الداعمين والشركاء وتصفية رحلة صنعاء إلى إكسيل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير كشف الداعمين (Excel)</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تمويل / دعم جديد</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="طباعة تقرير الداعمين والشركاء"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>طباعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-x-auto shadow-sm no-print">
        <button
          onClick={() => setActivePartnerTab('abdulghani')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activePartnerTab === 'abdulghani'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>💎 تمويلات عبد الغني ورأس المال ({formatNumber(stats.totalFunding)} ر.ي)</span>
        </button>

        <button
          onClick={() => setActivePartnerTab('musab_purchases')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer relative ${
            activePartnerTab === 'musab_purchases'
              ? 'bg-indigo-600 text-white shadow-md font-black'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4 text-indigo-300" />
          <span>📱 مشتريات وعهدة وتصفية مصعب (الجوالات والمرتجعات)</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
            باقي كاش 75,000 ر.ي
          </span>
        </button>

        <button
          onClick={() => setActivePartnerTab('day4_settlement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activePartnerTab === 'day4_settlement'
              ? 'bg-emerald-600 text-white shadow-md font-black'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>💼 تصفية رحلة صنعاء ويوم 4 (حمدان وزلط المحل)</span>
        </button>
      </div>

      {/* VIEW: Musab Purchasing Settlement */}
      {activePartnerTab === 'musab_purchases' && (
        <MusabPurchasingSettlementSection
          settlement={musabSettlement}
          onUpdateSettlement={onUpdateMusabSettlement}
        />
      )}

      {/* VIEW: Day 4 Sana'a Trip Settlement (Dedicated Full Mode) */}
      {activePartnerTab === 'day4_settlement' && (
        <div className="bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-900 border border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  سند تصفية رحلة صنعاء وحركة السيولة في يوم الدعم (يوم 4 شهر 8)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  توثيق المبالغ المستلمة من العامل حمدان، وصندوق المحل، وأوجه الصرف، والنقدية المردودة للدرج
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyOwnerSettlement}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              {copiedSettlement ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSettlement ? 'تم النسخ بنجاح' : 'نسخ كشف تصفية يوم 4'}</span>
            </button>
          </div>

          {/* 3 Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Pillar 1 */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    ١. استلام من العامل حمدان (جوالات)
                  </span>
                  <span className="text-[10px] bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-md font-bold">
                    عهدة مبيعات
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">إجمالي المبلغ المستلم من حمدان:</span>
                    <span className="font-mono-num font-bold text-white">
                      {formatNumber(ownerSettlement.hamdanHandover.totalReceived)} ر.ي
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-rose-400 bg-rose-950/30 p-1.5 rounded-lg border border-rose-500/20">
                    <span>إرجاع عملة تالفة لم تُقبل:</span>
                    <span className="font-mono-num font-bold">
                      - {formatNumber(ownerSettlement.hamdanHandover.damagedReturned)} ر.ي
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-cyan-300 font-bold">صافي المقبول المسلّم للمالك:</span>
                    <span className="font-mono-num font-black text-cyan-400 text-sm">
                      {formatNumber(ownerSettlement.hamdanHandover.netAccepted)} ر.ي
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-xl">
                {ownerSettlement.hamdanHandover.details}
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    ٢. استلام من زلط المحل (أيام 1+2+3)
                  </span>
                  <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-md font-bold font-mono-num">
                    50,000 ر.ي
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5 text-xs">
                  <span className="text-[11px] text-slate-400 block font-bold">
                    أوجه استنفاد الـ 50,000 ر.ي في صنعاء:
                  </span>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-slate-300">توفية ومكملة لشراء الدعم:</span>
                    <span className="font-mono-num font-bold text-amber-300">
                      {formatNumber(ownerSettlement.shopCashHandover.disbursements.fundingCoverage)} ر.ي
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-slate-300">مرسلة لمحمد مياس (يوم 4):</span>
                    <span className="font-mono-num font-bold text-teal-300">
                      {formatNumber(ownerSettlement.shopCashHandover.disbursements.mohammedMayasTransfer)} ر.ي
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                    <span className="text-emerald-300 font-bold">الباقي المردود للمحل:</span>
                    <span className="font-mono-num font-black text-emerald-400">
                      {formatNumber(ownerSettlement.shopCashHandover.disbursements.returnedToShop)} ر.ي
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                مجموع المصروف والمرسل = 33,500 ر.ي + متبقي 16,500 ر.ي = 50,000 ر.ي تماماً
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    ٣. إجمالي النقدية المردودة للمحل
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                    أُعيدت للدرج
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-300">متبقي زلط الـ 50 ألف:</span>
                    <span className="font-mono-num font-bold text-white">
                      {formatNumber(ownerSettlement.shopCashHandover.disbursements.returnedToShop)} ر.ي
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-300">العملة التالفة من حمدان:</span>
                    <span className="font-mono-num font-bold text-rose-300">
                      {formatNumber(ownerSettlement.hamdanHandover.damagedReturned)} ر.ي
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-emerald-300 font-black">إجمالي الكاش المردود للمحل:</span>
                    <span className="font-mono-num font-black text-emerald-400 text-base">
                      {formatNumber(ownerSettlement.shopCashHandover.totalReturnedToShop)} ر.ي
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>تم استلام المردود وتوريده لدرج المحل</span>
              </div>
            </div>

          </div>

          {/* Bottom Summary Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">
                {ownerSettlement.summaryNotes}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
              <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400 text-[10px] block">إجمالي المقبوض في اليد:</span>
                <strong className="text-white font-mono-num text-xs">320,500 ر.ي</strong>
              </div>
              <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400 text-[10px] block">إجمالي المستنفذ في صنعاء:</span>
                <strong className="text-amber-300 font-mono-num text-xs">302,000 ر.ي</strong>
              </div>
              <div className="bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                <span className="text-emerald-400 text-[10px] block font-bold">المردود لدرج المحل:</span>
                <strong className="text-emerald-300 font-mono-num text-xs">18,500 ر.ي</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Abdulghani Funding Ledger (Default Tab) */}
      {activePartnerTab === 'abdulghani' && (
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Total Funding Card */}
        <div className="bg-[#1E293B] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">إجمالي الدعم والتمويل (ذمار):</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-num">
              {formatNumber(stats.totalFunding)}
              <span className="text-xs text-slate-400 font-normal mr-1.5">ر.ي</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>الداعم:</span>
              <strong className="text-slate-200">عبد الغني</strong>
              <span>({stats.totalCount} عمليات مقيدة)</span>
            </p>
          </div>
        </div>

        {/* Day 4 Funding Card */}
        <div className="bg-[#1E293B] border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300">تمويل يوم 4 شهر 8 (صنعاء):</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono-num">
              {formatNumber(stats.day4Total)}
              <span className="text-xs text-slate-400 font-normal mr-1.5">ر.ي</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              بيلة (134k + 114k) + جوالات (230.5k) + مخاريج (6.5k)
            </p>
          </div>
        </div>

        {/* Day 5 Funding Card */}
        <div className="bg-[#1E293B] border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-300">تمويل يوم 5 شهر 8 (المصنف):</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-teal-300 font-mono-num">
              {formatNumber(stats.day5Total)}
              <span className="text-xs text-slate-400 font-normal mr-1.5">ر.ي</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              إرسالية مشتريات إكسسوارات مرسلة للمصنف
            </p>
          </div>
        </div>

        {/* Total Phones Funded Card */}
        <div className="bg-[#1E293B] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">الجوالات الممولة (صنعاء):</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono-num">
              {stats.totalPhonesCount} <span className="text-sm font-bold text-slate-300">جوالات</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              بقيمة 230,500 ر.ي (A32, J3, 2×A11, 2×Revvl, LG, S10e)
            </p>
          </div>
        </div>

      </div>

      {/* Category Breakdown & Funder Profile Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Funder Profile Box */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                👑
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">بطاقة الداعم الممول: عبد الغني</h3>
                <span className="text-[11px] text-amber-400 font-medium">داعم ذمار للمحل • تمويل رأس المال</span>
              </div>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">إجمالي مساهمة عبد الغني:</span>
                <span className="font-black text-amber-400 font-mono-num text-sm">
                  {formatNumber(stats.totalFunding)} ر.ي
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">مشتريات الإكسسوارات:</span>
                <span className="font-bold text-emerald-300 font-mono-num">
                  {formatNumber(stats.accessoriesFunding)} ر.ي
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">شراء الجوالات (10 أجهزة):</span>
                <span className="font-bold text-cyan-300 font-mono-num">
                  {formatNumber(stats.phonesFunding)} ر.ي
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">قطع غيار وصيانة:</span>
                <span className="font-bold text-amber-300 font-mono-num">
                  {formatNumber(stats.sparePartsFunding)} ر.ي
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">مخاريج ومصاريف طلعة صنعاء:</span>
                <span className="font-bold text-rose-300 font-mono-num">
                  {formatNumber(stats.expensesFunding)} ر.ي
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              الحساب معتمد ومقيد في رأس مال المحل
            </span>
          </div>
        </div>

        {/* 10 Phones Detail Table Box */}
        <div className="lg:col-span-2 bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  كشف وتفصيل الجوالات الممولة في يوم 4 شهر 8 (230,500 ر.ي)
                </h3>
              </div>
              <span className="text-[11px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-lg font-bold">
                10 جوالات جملة
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">1× جوال</span>
                <strong className="text-white text-xs mt-1">J3 مطور</strong>
                <span className="text-[10px] text-cyan-400 font-mono-num mt-1">سامسونج جي 3</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">1× جوال</span>
                <strong className="text-white text-xs mt-1">Galaxy A32</strong>
                <span className="text-[10px] text-cyan-400 font-mono-num mt-1">سامسونج ايه 32</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex flex-col justify-between">
                <span className="text-amber-400 text-[11px] font-bold">2× جوالات</span>
                <strong className="text-white text-xs mt-1">Galaxy A11</strong>
                <span className="text-[10px] text-cyan-400 font-mono-num mt-1">سامسونج ايه 11 (2)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex flex-col justify-between">
                <span className="text-amber-400 text-[11px] font-bold">2× جوالات</span>
                <strong className="text-white text-xs mt-1">Revvl (ريفل)</strong>
                <span className="text-[10px] text-cyan-400 font-mono-num mt-1">ريفل فور/بلس (2)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">1× جوال</span>
                <strong className="text-white text-xs mt-1">LG K51</strong>
                <span className="text-[10px] text-cyan-400 font-mono-num mt-1">ال جي كي 51</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex flex-col justify-between">
                <span className="text-amber-400 text-[11px] font-bold">2× جوالات</span>
                <strong className="text-white text-xs mt-1">Galaxy A10e</strong>
                <span className="text-[10px] text-cyan-400 font-mono-num mt-1">سامسونج ايه 10 اي (2)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">1× جوال</span>
                <strong className="text-white text-xs mt-1">Galaxy S10e</strong>
                <span className="text-[10px] text-cyan-400 font-mono-num mt-1">سامسونج اس 10 اي</span>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-900/40 border border-indigo-500/30 flex flex-col justify-between">
                <span className="text-indigo-300 text-[11px] font-bold">المخاريج المرافقة</span>
                <strong className="text-white text-xs mt-1">طلعة صنعاء</strong>
                <span className="text-[10px] text-amber-300 font-mono-num mt-1 font-bold">6,500 ر.ي</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
            <span>إجمالي شراء الجوالات + مخاريج السفر لطلعة صنعاء:</span>
            <span className="font-mono-num font-black text-cyan-300 text-xs">
              {formatNumber(230500 + 6500)} ر.ي
            </span>
          </div>
        </div>

      </div>

      {/* Owner Day 4 Handover & Cash Settlement Section (تسليمات المالك وحركة السيولة في يوم الدعم) */}
      <div className="bg-gradient-to-br from-[#1E293B] via-slate-900 to-[#1E293B] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xl shadow-inner">
              💼
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  كشف تسليمات المالك وحركة السيولة في يوم الدعم (يوم 4 شهر 8)
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  ✓ مطابقة ومصفّاة بالكامل
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                توثيق المبالغ المستلمة من العامل حمدان (مبيعات جوالات)، والمستلم من صندوق المحل، وأوجه الصرف في صنعاء، والمردود لدرج المحل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end no-print">
            <button
              onClick={handleCopyOwnerSettlement}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                copiedSettlement
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
              title="نسخ كشف التسليمات والتصفية"
            >
              {copiedSettlement ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedSettlement ? 'تم النسخ بنجاح' : 'نسخ الكشف'}</span>
            </button>

            <button
              onClick={() => setShowOwnerSettlement(!showOwnerSettlement)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              <span>{showOwnerSettlement ? 'طي التفاصيل' : 'عرض التفاصيل'}</span>
              {showOwnerSettlement ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showOwnerSettlement && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            
            {/* Top 3 Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Pillar 1: Hamdan Handover */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      ١. استلام من العامل حمدان (جوالات)
                    </span>
                    <span className="text-[10px] bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-md font-bold">
                      عهدة مبيعات
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">إجمالي المبلغ المستلم من حمدان:</span>
                      <span className="font-mono-num font-bold text-white">
                        {formatNumber(ownerSettlement.hamdanHandover.totalReceived)} ر.ي
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-rose-400 bg-rose-950/30 p-1.5 rounded-lg border border-rose-500/20">
                      <span>إرجاع عملة تالفة لم تُقبل:</span>
                      <span className="font-mono-num font-bold">
                        - {formatNumber(ownerSettlement.hamdanHandover.damagedReturned)} ر.ي
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">صافي المقبول المسلّم للمالك:</span>
                      <span className="font-mono-num font-black text-cyan-400 text-sm">
                        {formatNumber(ownerSettlement.hamdanHandover.netAccepted)} ر.ي
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-xl">
                  {ownerSettlement.hamdanHandover.details}
                </div>
              </div>

              {/* Pillar 2: Shop Cash Handover & Disbursements in Sana'a */}
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-indigo-400" />
                      ٢. استلام من زلط المحل (أيام 1+2+3)
                    </span>
                    <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-md font-bold font-mono-num">
                      50,000 ر.ي
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1.5 text-xs">
                    <span className="text-[11px] text-slate-400 block font-bold">
                      أوجه استنفاد الـ 50,000 ر.ي في صنعاء:
                    </span>
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-300">توفية ومكملة لشراء الدعم:</span>
                      <span className="font-mono-num font-bold text-amber-300">
                        {formatNumber(ownerSettlement.shopCashHandover.disbursements.fundingCoverage)} ر.ي
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-300">مرسلة لمحمد مياس (يوم 4):</span>
                      <span className="font-mono-num font-bold text-teal-300">
                        {formatNumber(ownerSettlement.shopCashHandover.disbursements.mohammedMayasTransfer)} ر.ي
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                      <span className="text-emerald-300 font-bold">الباقي المردود للمحل:</span>
                      <span className="font-mono-num font-black text-emerald-400">
                        {formatNumber(ownerSettlement.shopCashHandover.disbursements.returnedToShop)} ر.ي
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  مجموع المصروف والمرسل = 33,500 ر.ي + متبقي 16,500 ر.ي = 50,000 ر.ي تماماً
                </div>
              </div>

              {/* Pillar 3: Cash Returned to Shop Register */}
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-emerald-400" />
                      ٣. إجمالي النقدية المردودة للمحل
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                      أُعيدت للدرج
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-300">متبقي زلط الـ 50 ألف:</span>
                      <span className="font-mono-num font-bold text-white">
                        {formatNumber(ownerSettlement.shopCashHandover.disbursements.returnedToShop)} ر.ي
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-300">العملة التالفة من حمدان:</span>
                      <span className="font-mono-num font-bold text-rose-300">
                        {formatNumber(ownerSettlement.hamdanHandover.damagedReturned)} ر.ي
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-emerald-300 font-black">إجمالي الكاش المردود للمحل:</span>
                      <span className="font-mono-num font-black text-emerald-400 text-base">
                        {formatNumber(ownerSettlement.shopCashHandover.totalReturnedToShop)} ر.ي
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>تم استلام المردود وتوريده لدرج المحل</span>
                </div>
              </div>

            </div>

            {/* Comprehensive Reconciliation Bar */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-medium">
                  {ownerSettlement.summaryNotes}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">إجمالي المقبوض في اليد:</span>
                  <strong className="text-white font-mono-num text-xs">320,500 ر.ي</strong>
                </div>
                <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">إجمالي المستنفذ في صنعاء:</span>
                  <strong className="text-amber-300 font-mono-num text-xs">302,000 ر.ي</strong>
                </div>
                <div className="bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                  <span className="text-emerald-400 text-[10px] block font-bold">المردود لدرج المحل:</span>
                  <strong className="text-emerald-300 font-mono-num text-xs">18,500 ر.ي</strong>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث بالداعم، المورد، أو البيان..."
            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل ({fundingItems.length})
          </button>

          <button
            onClick={() => setSelectedCategory('مشتريات إكسسوارات')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'مشتريات إكسسوارات'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            إكسسوارات
          </button>

          <button
            onClick={() => setSelectedCategory('شراء جوالات')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'شراء جوالات'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            جوالات
          </button>

          <button
            onClick={() => setSelectedCategory('إرسالية بضاعة')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'إرسالية بضاعة'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            إرساليات
          </button>

          <button
            onClick={() => setSelectedCategory('قطع غيار وصيانة')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'قطع غيار وصيانة'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            قطع غيار
          </button>

          <button
            onClick={() => setSelectedCategory('مصاريف ومخاريج طلعة')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'مصاريف ومخاريج طلعة'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            مخاريج وسفر
          </button>
        </div>
      </div>

      {/* Main Table View of Funding Records */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              جدول قيود التمويل والدعم المفصلة (دعم ذمار)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono-num">
            {filteredItems.length} بند مسجل
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0F172A] text-slate-300 border-b border-slate-700 font-bold">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">التاريخ واليوم</th>
                <th className="p-3">الداعم / الشريك</th>
                <th className="p-3">البيان والتفاصيل</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">المورد / الجهة</th>
                <th className="p-3 text-left">المبلغ بالريال</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 text-slate-500 font-mono-num">{idx + 1}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-bold text-white">{item.date}</div>
                    <span className="text-[10px] text-amber-400">
                      {item.dayNumber ? `يوم ${item.dayNumber} شهر 8` : 'دفعة تمويلية'}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <span>👑</span>
                      <span>{item.funderName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{item.funderRole || 'داعم للمحل'}</span>
                  </td>
                  <td className="p-3 max-w-xs">
                    <div className="font-bold text-slate-200">{item.description}</div>
                    {item.phonesList && item.phonesList.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.phonesList.map((p, pIdx) => (
                          <span 
                            key={pIdx}
                            className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                          >
                            {p.count > 1 ? `${p.count}× ` : ''}{p.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">{item.notes}</p>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      item.category === 'مشتريات إكسسوارات'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : item.category === 'شراء جوالات'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : item.category === 'إرسالية بضاعة'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                        : item.category === 'قطع غيار وصيانة' || item.category === 'قطع غيار'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="font-medium text-slate-300">
                      {item.supplierOrParty || '—'}
                    </span>
                  </td>
                  <td className="p-3 text-left whitespace-nowrap">
                    <span className="font-black text-amber-400 font-mono-num text-sm">
                      {formatNumber(item.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 mr-1">ر.ي</span>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap no-print">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                        title="تعديل القيد"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف قيد التمويل بمبلغ ${formatNumber(item.amount)} ر.ي؟`)) {
                            onDeleteFundingItem(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                        title="حذف القيد"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#0F172A] border-t-2 border-slate-700 font-black text-white">
              <tr>
                <td colSpan={6} className="p-3 text-right">
                  الإجمالي الكلي لتمويل ودعم المحل (دعم ذمار من عبد الغني):
                </td>
                <td className="p-3 text-left font-mono-num text-amber-400 text-base">
                  {formatNumber(filteredItems.reduce((acc, curr) => acc + curr.amount, 0))} ر.ي
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* Modal for Add / Edit Funding Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" dir="rtl">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  {editingItem ? '✏️' : '➕'}
                </div>
                <h3 className="text-base font-black text-white">
                  {editingItem ? 'تعديل قيد تمويل ودعم' : 'إضافة قيد تمويل / دعم جديد للمحل'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم الداعم / الشريك *</label>
                  <input
                    type="text"
                    required
                    value={formData.funderName || ''}
                    onChange={e => setFormData({ ...formData, funderName: e.target.value })}
                    placeholder="مثلاً: عبد الغني"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">صفة الداعم / نوع التمويل</label>
                  <input
                    type="text"
                    value={formData.funderRole || ''}
                    onChange={e => setFormData({ ...formData, funderRole: e.target.value as any })}
                    placeholder="داعم ذمار للمحل"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المبلغ بالريال اليمني *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="المبلغ ر.ي"
                    className="w-full bg-[#0F172A] border border-amber-500/50 rounded-xl px-3 py-2 text-amber-400 font-mono-num font-black focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم اليوم في الدفتر</label>
                  <input
                    type="number"
                    value={formData.dayNumber || 4}
                    onChange={e => setFormData({ ...formData, dayNumber: Number(e.target.value) })}
                    placeholder="4"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">التصنيف الرئيسي *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="مشتريات إكسسوارات">مشتريات إكسسوارات</option>
                    <option value="شراء جوالات">شراء جوالات (دفعة أجهزة)</option>
                    <option value="قطع غيار وصيانة">قطع غيار وصيانة</option>
                    <option value="إرسالية بضاعة">إرسالية بضاعة ومشتريات</option>
                    <option value="مصاريف ومخاريج طلعة">مصاريف ومخاريج طلعة صنعاء</option>
                    <option value="تمويل عام ورأس مال">تمويل عام ورأس مال</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">المورد أو الجهة</label>
                  <input
                    type="text"
                    value={formData.supplierOrParty || ''}
                    onChange={e => setFormData({ ...formData, supplierOrParty: e.target.value })}
                    placeholder="حسين بيلة / مراد بيلة / المصنف..."
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">البيان والوصف التفصيلي *</label>
                <input
                  type="text"
                  required
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="مشتريات من حسين بيلة / شراء دفعة جوالات..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Sub-phones list builder (if category is phones or custom) */}
              {formData.category === 'شراء جوالات' && (
                <div className="p-3 bg-[#0F172A] border border-cyan-500/30 rounded-2xl space-y-2">
                  <span className="block text-[11px] font-bold text-cyan-400">
                    قائمة الجوالات المشمولة في هذه الدفعة:
                  </span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPhoneName}
                      onChange={e => setNewPhoneName(e.target.value)}
                      placeholder="اسم وموديل الجوال (مثلاً: جوال Samsung A32)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="number"
                      min={1}
                      value={newPhoneCount}
                      onChange={e => setNewPhoneCount(Number(e.target.value))}
                      placeholder="العدد"
                      className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-center text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhoneToCustomList}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>

                  {customPhones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {customPhones.map(p => (
                        <span
                          key={p.id}
                          className="flex items-center gap-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-xs"
                        >
                          <span>{p.count > 1 ? `${p.count}× ` : ''}{p.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoneFromCustomList(p.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold mr-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي تفاصيل أو سندات مرتبطة..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs shadow-lg transition cursor-pointer"
                >
                  {editingItem ? 'حفظ التعديلات' : 'تسجيل التمويل'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
