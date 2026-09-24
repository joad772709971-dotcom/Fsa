import React, { useState, useRef } from 'react';
import {
  Calendar,
  Eye,
  Edit,
  Wrench,
  ShoppingBag,
  Package,
  CreditCard,
  User,
  Building,
  Users,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
  Plus,
  Coins,
  Brain,
  ShieldCheck,
  Camera,
  Tag,
  Bot,
  Radio,
} from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { formatArabicDateDisplay, getShiftedDate } from '../utils/aiDateHelper';

export type SmartAIAssistantViewMode =
  | 'daily_input'
  | 'chat'
  | 'system_audit'
  | 'cfo_radar'
  | 'invoice_ocr'
  | 'telecom_engine'
  | 'package_catalog'
  | 'day_detail';

export interface SmartAIQuickActionsBarProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  viewMode: SmartAIAssistantViewMode;
  onToggleViewMode: (mode: SmartAIAssistantViewMode) => void;
  onSaveQuickTransaction: (tx: Transaction) => void;
  onPromptSend?: (promptText: string) => void;
  onOpenTraining?: () => void;
}

interface QuickActionModalState {
  isOpen: boolean;
  actionTitle: string;
  type: TransactionType;
  category: Category;
  defaultDescription: string;
  color: string;
  showCostField?: boolean;
  maintenanceType?: 'income' | 'expense';
}

export const SmartAIQuickActionsBar: React.FC<SmartAIQuickActionsBarProps> = ({
  currentDate,
  onDateChange = () => {},
  availableDates = [],
  viewMode = 'chat',
  onToggleViewMode = () => {},
  onSaveQuickTransaction = () => {},
  onPromptSend,
  onOpenTraining = () => {},
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Quick action modal state
  const [modalState, setModalState] = useState<QuickActionModalState>({
    isOpen: false,
    actionTitle: '',
    type: 'sale',
    category: 'accessories',
    defaultDescription: '',
    color: 'indigo',
    showCostField: false,
  });

  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formCost, setFormCost] = useState<number | ''>('');
  const [formNotes, setFormNotes] = useState('');

  // Refs and draggable scroll helpers for mode tabs & quick actions ribbon
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const ribbonScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      // In RTL, negative scrolls to the left, positive to the right
      const amount = direction === 'left' ? -220 : 220;
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Drag-to-scroll utility
  const bindDragScroll = (ref: React.RefObject<HTMLDivElement | null>) => {
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    return {
      onMouseDown: (e: React.MouseEvent) => {
        if (!ref.current) return;
        isDown = true;
        startX = e.pageX - ref.current.offsetLeft;
        scrollStart = ref.current.scrollLeft;
      },
      onMouseLeave: () => {
        isDown = false;
      },
      onMouseUp: () => {
        isDown = false;
      },
      onMouseMove: (e: React.MouseEvent) => {
        if (!isDown || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        ref.current.scrollLeft = scrollStart - walk;
      },
    };
  };

  const tabsDragProps = bindDragScroll(tabsScrollRef);
  const ribbonDragProps = bindDragScroll(ribbonScrollRef);

  // Close any open popovers
  const closeAllPopups = () => {
    setIsDatePickerOpen(false);
    setActiveDropdown(null);
  };

  // Open Quick Entry Modal for a category
  const openQuickEntry = (config: {
    actionTitle: string;
    type: TransactionType;
    category: Category;
    defaultDescription: string;
    color: string;
    showCostField?: boolean;
    maintenanceType?: 'income' | 'expense';
  }) => {
    closeAllPopups();
    setModalState({
      isOpen: true,
      ...config,
    });
    setFormDescription(config.defaultDescription);
    setFormPrice('');
    setFormCost('');
    setFormNotes('');
  };

  // Submit quick transaction
  const handleSaveModalEntry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formPrice || formPrice <= 0) return;

    const p = Number(formPrice);
    let c = Number(formCost) || 0;
    let pr = 0;

    if (modalState.type === 'sale') {
      pr = Math.max(0, p - c);
    } else if (modalState.type === 'maintenance') {
      if (modalState.maintenanceType === 'expense') {
        c = p;
        pr = 0;
      } else {
        const netLabor = Math.max(0, p - c);
        pr = Math.round(netLabor * 0.5);
      }
    } else if (
      modalState.type.startsWith('expense') ||
      modalState.type.startsWith('withdrawal') ||
      modalState.type === 'shop_tools_outflow'
    ) {
      c = p;
      pr = 0;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newTx: Transaction = {
      id: `tx_quick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: currentDate,
      time: timeStr,
      type: modalState.type,
      category: modalState.category,
      description: formDescription.trim() || modalState.actionTitle,
      price: p,
      cost: c,
      profit: pr,
      notes: formNotes.trim() || undefined,
    };

    onSaveQuickTransaction(newTx);

    // Close modal
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white shrink-0 relative z-30">
      {/* Upper Main Action Row */}
      <div className="p-2 sm:px-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left Side: Date Selector + Training Button */}
        <div className="flex items-center gap-2">
          {/* Date Selector Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDatePickerOpen((prev) => !prev);
                setActiveDropdown(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="تعيين التاريخ"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-200" />
              <span>📅 {currentDate}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Date Picker Popover */}
            {isDatePickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40"
                  onClick={() => setIsDatePickerOpen(false)}
                />
                <div className="absolute top-full right-0 mt-1.5 w-72 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="font-bold text-xs text-slate-800">تعيين تاريخ العمل المحاسبي</span>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    onDateChange(today);
                    setIsDatePickerOpen(false);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-[11px] font-semibold text-center cursor-pointer transition-colors"
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDateChange(getShiftedDate(currentDate, -1));
                    setIsDatePickerOpen(false);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-[11px] font-semibold text-center cursor-pointer transition-colors"
                >
                  أمس
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDateChange(getShiftedDate(currentDate, -2));
                    setIsDatePickerOpen(false);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-[11px] font-semibold text-center cursor-pointer transition-colors"
                >
                  أول أمس
                </button>
              </div>

              {/* Native Date Input */}
              <div className="mb-2.5">
                <label className="block text-[10px] text-slate-500 mb-1">اختر من التقويم مباشرة:</label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      onDateChange(e.target.value);
                      setIsDatePickerOpen(false);
                    }
                  }}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Recorded Available Dates List */}
              {(availableDates || []).length > 0 && (
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">أيام مسجلة في النظام:</label>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {(availableDates || []).slice(0, 15).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          onDateChange(d);
                          setIsDatePickerOpen(false);
                        }}
                        className={`w-full text-right px-2 py-1 rounded-lg text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                          currentDate === d
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{formatArabicDateDisplay(d)}</span>
                        <span className="font-mono text-[10px] opacity-75">{d}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* AI Training & Learning Studio Button */}
      <button
        type="button"
        onClick={onOpenTraining}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        title="استوديو تدريب وتعليم المحاسب الذكي"
      >
        <Brain className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>🧠 تدريب المحاسب</span>
      </button>
    </div>

    {/* View vs Tools Mode Tabs (المحادثة، قارئ الفواتير Vision AI، كشوفات السداد PDF، كتالوج الباقات، كشف اليومية) - قابل للتمرير والتحريك */}
        <div className="relative flex items-center max-w-full group">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollContainer(tabsScrollRef, 'left')}
            className="shrink-0 p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 mr-1 cursor-pointer transition-all shadow-xs active:scale-95 z-10"
            title="تمرير الخيارات يساراً"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div
            ref={tabsScrollRef}
            {...tabsDragProps}
            className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 overflow-x-auto max-w-full scrollbar-none cursor-grab active:cursor-grabbing select-none"
          >
            <button
              type="button"
              onClick={() => onToggleViewMode('daily_input')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                viewMode === 'daily_input'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-1 ring-emerald-400/50'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60 border border-emerald-500/30'
              }`}
              title="لوحة الإدخال اليومي المنظم (الأقسام الـ 5 المعتمدة لمحل مصعب)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>📋 الإدخال اليومي المنظم</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('chat')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                viewMode === 'chat'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="المحادثة والمساعد الذكي"
            >
              <Edit className="w-3.5 h-3.5 text-indigo-200" />
              <span>✍️ المحادثة والاستفسار</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('system_audit')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                viewMode === 'system_audit'
                  ? 'bg-gradient-to-r from-amber-600 to-purple-600 text-white shadow-xs'
                  : 'text-amber-300 hover:text-white hover:bg-amber-900/40 border border-amber-500/30'
              }`}
              title="فحص وتدقيق النظام بالكامل بالذكاء الاصطناعي (Gemini System Audit)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>⚡ فحص وتدقيق النظام (جميني)</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('cfo_radar')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                viewMode === 'cfo_radar'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="قسم الفحص المالي والإدارة الاستباقية ومراقبة المؤشرات (Autonomous CFO Radar)"
            >
              <Radio className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
              <span>📡 الفحص والإدارة (الرادار)</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('invoice_ocr')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                viewMode === 'invoice_ocr'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="قارئ الفواتير الذكي بالرؤية الحاسوبية - قراءة فواتير خط اليد والمطبوعة"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-200" />
              <span>📸 قارئ الفواتير (Vision AI)</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('telecom_engine')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                viewMode === 'telecom_engine'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="محرك كشوفات سداد الرصيد والشبكات PDF - تدقيق وحساب الأرباح"
            >
              <FileText className="w-3.5 h-3.5 text-blue-200" />
              <span>📄 كشوفات السداد (محرك PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('package_catalog')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                viewMode === 'package_catalog'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="كتالوج تسعير الباقات وهوامش الأرباح لجميع الشبكات"
            >
              <Tag className="w-3.5 h-3.5 text-amber-200" />
              <span>🏷️ تسعير الباقات</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('day_detail')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                viewMode === 'day_detail'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="عرض وتدقيق وتعديل كشف حركات اليومية بالكامل"
            >
              <Eye className="w-3.5 h-3.5 text-purple-200" />
              <span>👁️ كشف اليومية</span>
            </button>
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollContainer(tabsScrollRef, 'right')}
            className="shrink-0 p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 ml-1 cursor-pointer transition-all shadow-xs active:scale-95 z-10"
            title="تمرير الخيارات يميناً"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Categorized Quick Action Buttons Ribbon with Left & Right scroll arrows and drag to scroll */}
      <div className="px-2 pb-2 relative flex items-center group">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => scrollContainer(ribbonScrollRef, 'left')}
          className="shrink-0 p-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 mr-1 cursor-pointer shadow-xs active:scale-95 transition-all z-10"
          title="تمرير الأزرار يساراً"
        >
          <ChevronRight className="w-3 h-3" />
        </button>

        <div
          ref={ribbonScrollRef}
          {...ribbonDragProps}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none cursor-grab active:cursor-grabbing select-none py-0.5"
        >
        {/* Quick Launchers for Core AI Tools */}
        <button
          type="button"
          onClick={() => onToggleViewMode('invoice_ocr')}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 shadow-2xs"
          title="الانتقال المباشر لقارئ الفواتير Vision AI"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-300" />
          <span>📸 قارئ الفواتير (Vision AI)</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleViewMode('telecom_engine')}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 shadow-2xs"
          title="الانتقال المباشر لمحرك كشوفات السداد PDF"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-300" />
          <span>📄 كشوفات السداد (محرك PDF)</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleViewMode('package_catalog')}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 shadow-2xs"
          title="الانتقال المباشر لكتالوج تسعير الباقات"
        >
          <Tag className="w-3.5 h-3.5 text-amber-300" />
          <span>🏷️ كتالوج تسعير الباقات</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5 shrink-0" />
        {/* 1. Maintenance Button */}
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'maint' ? null : 'maint')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors border ${
            activeDropdown === 'maint'
              ? 'bg-blue-600 text-white border-blue-400'
              : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-100 border-blue-500/40'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>صيانة</span>
          <ChevronDown
            className={`w-3 h-3 opacity-70 transition-transform ${
              activeDropdown === 'maint' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* 2. Sales Button */}
        <button
          type="button"
          onClick={() =>
            openQuickEntry({
              actionTitle: 'تسجيل مبيعات جديدة',
              type: 'sale',
              category: 'accessories',
              defaultDescription: 'إكسسوار أو صنف مبيعات',
              color: 'emerald',
              showCostField: true,
            })
          }
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-100 border border-emerald-500/40 rounded-lg font-bold cursor-pointer transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>مبيعات</span>
        </button>

        {/* 3. Purchases Button */}
        <button
          type="button"
          onClick={() =>
            openQuickEntry({
              actionTitle: 'مشتريات وبضاعة جديدة',
              type: 'purchase',
              category: 'purchases',
              defaultDescription: 'مشتريات بضاعة من مورد',
              color: 'indigo',
              showCostField: false,
            })
          }
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-100 border border-indigo-500/40 rounded-lg font-bold cursor-pointer transition-colors"
        >
          <Package className="w-3.5 h-3.5" />
          <span>مشتريات</span>
        </button>

        {/* 4. Balance / Recharges Button */}
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'balance' ? null : 'balance')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors border ${
            activeDropdown === 'balance'
              ? 'bg-teal-600 text-white border-teal-400'
              : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 hover:text-teal-100 border-teal-500/40'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>رصيد</span>
          <ChevronDown
            className={`w-3 h-3 opacity-70 transition-transform ${
              activeDropdown === 'balance' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* 5. Musab Expenses Button */}
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'mosaab' ? null : 'mosaab')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors border ${
            activeDropdown === 'mosaab'
              ? 'bg-orange-600 text-white border-orange-400'
              : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-100 border-orange-500/40'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>خرج مصعب</span>
          <ChevronDown
            className={`w-3 h-3 opacity-70 transition-transform ${
              activeDropdown === 'mosaab' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* 6. Shop Expenses Button */}
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'shop' ? null : 'shop')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors border ${
            activeDropdown === 'shop'
              ? 'bg-amber-600 text-white border-amber-400'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 border-amber-500/40'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>خرج المحل</span>
          <ChevronDown
            className={`w-3 h-3 opacity-70 transition-transform ${
              activeDropdown === 'shop' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* 7. Staff & Engineer Button */}
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'staff' ? null : 'staff')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors border ${
            activeDropdown === 'staff'
              ? 'bg-sky-600 text-white border-sky-400'
              : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-sky-100 border-sky-500/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>العمال والمهندس</span>
          <ChevronDown
            className={`w-3 h-3 opacity-70 transition-transform ${
              activeDropdown === 'staff' ? 'rotate-180' : ''
            }`}
          />
        </button>
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => scrollContainer(ribbonScrollRef, 'right')}
          className="shrink-0 p-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 ml-1 cursor-pointer shadow-xs active:scale-95 transition-all z-10"
          title="تمرير الأزرار يميناً"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
      </div>

      {/* Floating Elevated Submenu (Placed outside overflow-x-auto, completely above chat with Z-50 and Backdrop) */}
      {activeDropdown && (
        <div className="relative z-50">
          {/* Backdrop Click Dismiss */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[0.5px]"
            onClick={() => setActiveDropdown(null)}
          />

          {/* Elevated Popup Card */}
          <div className="absolute right-2 sm:right-6 top-1 z-50 w-72 max-w-[92vw] bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-2 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                {activeDropdown === 'maint' && (
                  <>
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>عمليات الصيانة وقطع الغيار</span>
                  </>
                )}
                {activeDropdown === 'balance' && (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                    <span>شبكات الرصيد وتفعيل الشرايح</span>
                  </>
                )}
                {activeDropdown === 'mosaab' && (
                  <>
                    <User className="w-3.5 h-3.5 text-orange-600" />
                    <span>مصاريف ومسحوبات مصعب</span>
                  </>
                )}
                {activeDropdown === 'shop' && (
                  <>
                    <Building className="w-3.5 h-3.5 text-amber-600" />
                    <span>مصاريف واحتياجات المحل</span>
                  </>
                )}
                {activeDropdown === 'staff' && (
                  <>
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>العمال ومهندس الصيانة</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setActiveDropdown(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Menu Items for Maintenance */}
            {activeDropdown === 'maint' && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'دخل صيانة (فايدة 50%)',
                      type: 'maintenance',
                      category: 'maintenance',
                      defaultDescription: 'صيانة وتصليح جهاز',
                      color: 'blue',
                      showCostField: true,
                      maintenanceType: 'income',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-blue-50 rounded-xl text-xs text-blue-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>🟢 دخل صيانة (أجور تصليح)</span>
                  </div>
                  <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md font-bold">
                    فايدة 50%
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'خرج صيانة / قطع غيار',
                      type: 'maintenance',
                      category: 'maintenance',
                      defaultDescription: 'قطع غيار صيانة (شاشة/فلاتة)',
                      color: 'red',
                      showCostField: false,
                      maintenanceType: 'expense',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-rose-50 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span>🔴 خرج صيانة / قطع غيار (شاشات/فلاتات)</span>
                </button>
              </div>
            )}

            {/* Menu Items for Balance */}
            {activeDropdown === 'balance' && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'رصيد الهادي (محمد مياس)',
                      type: 'balance_hadi',
                      category: 'balance',
                      defaultDescription: 'تحويل رصيد شبكة الهادي',
                      color: 'teal',
                      showCostField: true,
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-teal-50 rounded-xl text-xs text-teal-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>💳 رصيد الهادي (محمد مياس)</span>
                  <span className="text-[10px] text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-md font-mono font-bold">
                    الهادي
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'رصيد الرقم (فايز أبو علي)',
                      type: 'balance_qimma',
                      category: 'balance',
                      defaultDescription: 'تحويل رصيد تطبيق الرقم',
                      color: 'cyan',
                      showCostField: true,
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-cyan-50 rounded-xl text-xs text-cyan-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>💳 رصيد الرقم (فايز أبو علي)</span>
                  <span className="text-[10px] text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded-md font-mono font-bold">
                    الرقم
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'بيع شرايح وتفعيل',
                      type: 'sim',
                      category: 'sims',
                      defaultDescription: 'شريحة اتصال / باقة',
                      color: 'purple',
                      showCostField: true,
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-purple-50 rounded-xl text-xs text-purple-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>📶 بيع شرايح وتفعيل باقات</span>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md font-bold">
                    شرايح
                  </span>
                </button>
              </div>
            )}

            {/* Menu Items for Musab */}
            {activeDropdown === 'mosaab' && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'خرج بيت مصعب (صرفة بيت)',
                      type: 'expense_home_mosaab',
                      category: 'mosaab',
                      defaultDescription: 'صرفة بيت مصعب',
                      color: 'orange',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-orange-50 rounded-xl text-xs text-orange-900 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>🏠 خرج بيت مصعب (صرفة بيت)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'سحب مصعب شخصي',
                      type: 'withdrawal_mosaab',
                      category: 'mosaab',
                      defaultDescription: 'سحب شخصي لمصعب',
                      color: 'rose',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-rose-50 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>💵 سحب مصعب شخصي نقدي</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'مسلم لمصعب لشراء بضاعة',
                      type: 'mosaab_purchases_fund',
                      category: 'mosaab',
                      defaultDescription: 'عهدة شراء بضاعة لمصعب',
                      color: 'amber',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-amber-50 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>📦 عهدة شراء بضاعة لمصعب</span>
                </button>
              </div>
            )}

            {/* Menu Items for Shop */}
            {activeDropdown === 'shop' && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'مصاريف عامة للمحل',
                      type: 'expense_shop',
                      category: 'expenses',
                      defaultDescription: 'صرفة محل وضيافة وبوفية',
                      color: 'amber',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-amber-50 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>☕ ضيافة وصرفة محل وبوفية</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'أدوات ووصلات للمحل',
                      type: 'shop_tools_outflow',
                      category: 'expenses',
                      defaultDescription: 'شواحن ووصلات للمحل',
                      color: 'yellow',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-yellow-50 rounded-xl text-xs text-yellow-900 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>🔌 أدوات وشواحن ووصلات للمحل</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'اشتراك مودم ورصيد نت',
                      type: 'expense_modem',
                      category: 'expenses',
                      defaultDescription: 'باقة مودم ورصيد نت',
                      color: 'violet',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-violet-50 rounded-xl text-xs text-violet-900 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>🌐 اشتراك مودم وباقة نت (مناصفة)</span>
                </button>
              </div>
            )}

            {/* Menu Items for Staff */}
            {activeDropdown === 'staff' && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'صرفة مهندس (على المحل)',
                      type: 'expense_engineer',
                      category: 'engineer',
                      defaultDescription: 'صرفة غداء مهندس الصيانة',
                      color: 'sky',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-sky-50 rounded-xl text-xs text-sky-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>👷 صرفة غداء مهندس (على المحل)</span>
                  <span className="text-[10px] text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded-md font-bold">
                    محل
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'سحب مهندس (تصفية نسبة)',
                      type: 'withdrawal_engineer',
                      category: 'engineer',
                      defaultDescription: 'سحب مهندس من نسبته',
                      color: 'red',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-red-50 rounded-xl text-xs text-red-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>👷 سحب مهندس (يحسب عليه من نسبته)</span>
                  <span className="text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md font-bold">
                    سحب
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'صرفة عامل المحل',
                      type: 'expense_worker',
                      category: 'worker',
                      defaultDescription: 'صرفة عامل المحل (حمدان/غيره)',
                      color: 'slate',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-slate-100 rounded-xl text-xs text-slate-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>👥 صرفة عامل المحل (على المحل)</span>
                  <span className="text-[10px] text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded-md font-bold">
                    محل
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickEntry({
                      actionTitle: 'تصفية مستحقات العامل (7500 ومشى)',
                      type: 'withdrawal_worker',
                      category: 'worker',
                      defaultDescription: 'تصفية مستحقات العامل ومشى',
                      color: 'red',
                    })
                  }
                  className="w-full text-right px-2.5 py-2 hover:bg-red-50 rounded-xl text-xs text-red-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>👥 تصفية ومستحقات العامل (7500 ومشى)</span>
                  <span className="text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md font-bold">
                    تصفية
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Quick Entry Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in">
          <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-xs sm:text-sm">{modalState.actionTitle}</h4>
              </div>
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveModalEntry} className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-500">تاريخ القيد المستهدف:</span>
                <span className="font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {currentDate}
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البيان والتفاصيل:
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="اكتب البيان هنا..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              {/* Price / Amount */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المبلغ (ريال يمني):
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPrice}
                    onChange={(e) =>
                      setFormPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    placeholder="المبلغ المقبوض أو المدفوع"
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                    dir="ltr"
                  />
                </div>

                {/* Optional Cost for Sales/Maintenance */}
                {modalState.showCostField && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      التكلفة (إن وجدت):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formCost}
                      onChange={(e) =>
                        setFormCost(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      placeholder="رأس المال أو التكلفة"
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              {/* Real-time Profit Preview */}
              {modalState.showCostField && formPrice && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-semibold">
                    {modalState.type === 'maintenance' ? 'الربح المحسوب (نسبة 50%):' : 'الربح المتوقع:'}
                  </span>
                  <span className="font-bold font-mono text-emerald-950">
                    {modalState.type === 'maintenance'
                      ? Math.round(Math.max(0, Number(formPrice) - (Number(formCost) || 0)) * 0.5).toLocaleString()
                      : Math.max(0, Number(formPrice) - (Number(formCost) || 0)).toLocaleString()}{' '}
                    ر.ي
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات إضافية (اختياري):
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="اسم العميل أو تفاصيل أخرى..."
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!formPrice || formPrice <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>💾 حفظ واعتماد فوري</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
