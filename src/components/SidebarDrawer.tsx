import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Calendar, 
  Layers, 
  Home, 
  Users, 
  Smartphone, 
  TrendingUp, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle,
  Search,
  ChevronLeft,
  LayoutDashboard,
  Package,
  AlertTriangle,
  RotateCcw,
  Trash2,
  UserCheck,
  Building2,
  HardDrive,
  Archive,
  CreditCard,
  Radio,
  Truck,
  Wrench,
  Barcode,
  Settings,
  Sparkles,
  Handshake
} from 'lucide-react';
import { DayRecord, ActiveTab, SHOP_INFO } from '../types';
import { calculatePeriodSummary, formatNumber } from '../utils/accounting';
import { AppLogo } from './AppLogo';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  days: DayRecord[];
  selectedDayId: string;
  onSelectDay: (id: string) => void;
  onExportExcel: () => void;
  onResetData?: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  days,
  selectedDayId,
  onSelectDay,
  onExportExcel,
  onResetData,
}) => {
  const [daySearch, setDaySearch] = useState('');
  const summary = calculatePeriodSummary(days);

  const filteredDays = days.filter(d => 
    d.dayTitle.includes(daySearch) || 
    d.dayNumber.toString().includes(daySearch) ||
    (d.notes && d.notes.includes(daySearch))
  );

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  const handleDayClick = (id: string) => {
    onSelectDay(id);
    setActiveTab('daily');
    onClose();
  };

  if (!isOpen) return null;

  const navSections: {
    title: string;
    items: {
      id: ActiveTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      badge?: string;
    }[];
  }[] = [
    {
      title: 'العمليات والمبيعات اليومية',
      items: [
        { id: 'dashboard', label: 'لوحة التحكم والمؤشرات', icon: LayoutDashboard, color: 'text-indigo-400' },
        { id: 'cashier', label: 'كاشير الشراء والبيع السريع', icon: Barcode, color: 'text-amber-400', badge: '⚡ POS' },
        { id: 'daily', label: 'السجل واليومية النشطة', icon: Calendar, color: 'text-cyan-400' },
        { id: 'recharge', label: 'حركة الرصيد (الهادي والرقم)', icon: Smartphone, color: 'text-emerald-400' },
        { id: 'sims', label: 'الشرايح وباقات الاتصال', icon: Radio, color: 'text-teal-400' },
      ]
    },
    {
      title: 'الصيانة والمخزون والقطع',
      items: [
        { id: 'maintenance', label: 'كروت الصيانة والفحص', icon: Wrench, color: 'text-indigo-400', badge: 'سندات' },
        { id: 'inventory', label: 'المخزن وقطع الغيار', icon: Package, color: 'text-amber-400' },
        { id: 'shortages', label: 'النواقص والطلبيات (2:00 ظ)', icon: AlertTriangle, color: 'text-rose-400', badge: 'يومي' },
        { id: 'returns', label: 'المرتجع (زبائن وموردين)', icon: RotateCcw, color: 'text-orange-400' },
        { id: 'damaged', label: 'التالف والفاقد والضياع', icon: Trash2, color: 'text-red-400' },
      ]
    },
    {
      title: 'الصناديق والحسابات والأطراف',
      items: [
        { id: 'partners', label: 'الداعمين والشركاء (عبد الغني)', icon: Handshake, color: 'text-amber-400', badge: '💎 دعم ذمار' },
        { id: 'accounts', label: 'الحسابات والصناديق العامة', icon: CreditCard, color: 'text-violet-400' },
        { id: 'musab', label: 'حساب بيت المالك والشخصي', icon: Home, color: 'text-emerald-400' },
        { id: 'suppliers', label: 'حسابات الموردين والتطبيقات', icon: Users, color: 'text-blue-400' },
        { id: 'customers', label: 'العملاء والديون والضمانات', icon: UserCheck, color: 'text-sky-400' },
        { id: 'delivery', label: 'خدمة التوصيل والمشاوير', icon: Truck, color: 'text-amber-400' },
        { id: 'employees', label: 'الموظفين (حمدان والمهندس)', icon: Users, color: 'text-indigo-400' },
      ]
    },
    {
      title: 'التقارير والأرشيف العام',
      items: [
        { id: 'reports', label: 'التقارير ومطابقة الدفتر', icon: TrendingUp, color: 'text-purple-400' },
        { id: 'master', label: 'الكشف العام المجمع للأيام', icon: Layers, color: 'text-yellow-400' },
        { id: 'assets', label: 'الأصول ومعدات المحل', icon: HardDrive, color: 'text-slate-400' },
        { id: 'archive', label: 'الأرشيف والنسخ الاحتياطي', icon: Archive, color: 'text-slate-400' },
        { id: 'owner_portal', label: 'لوحة المالك وتراخيص المحلات', icon: Building2, color: 'text-amber-400', badge: '👑 المالك' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-[280px] sm:max-w-xs bg-[#1E293B] border-l border-slate-700 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
          
          {/* Header with App Logo */}
          <div className="p-3 bg-[#0F172A] border-b border-slate-700/90 flex items-center justify-between shrink-0">
            <AppLogo size="xs" showText={true} subTitle="نظام المحل والصيانة المطور ⚡" />

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
              title="إغلاق القائمة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Financial Summary Widget (Compact) */}
          <div className="p-2.5 bg-slate-900/90 border-b border-slate-700/80 shrink-0 text-xs">
            <div className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
              <span>حركة الصندوق ({days.length} يوم):</span>
              <span className="text-emerald-400 font-mono-num font-bold">
                صافي: {formatNumber(summary.netCashFlow)} ر.ي
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="p-1.5 bg-[#1E293B] rounded-lg border border-slate-700/60">
                <span className="text-[9px] text-emerald-400 block font-semibold leading-none mb-0.5">الدخل المحصل:</span>
                <span className="text-[11px] font-black text-emerald-300 font-mono-num block truncate">
                  {formatNumber(summary.totalGrossRevenue)}
                </span>
              </div>
              <div className="p-1.5 bg-[#1E293B] rounded-lg border border-slate-700/60">
                <span className="text-[9px] text-rose-400 block font-semibold leading-none mb-0.5">المخروجات:</span>
                <span className="text-[11px] font-black text-rose-300 font-mono-num block truncate">
                  {formatNumber(summary.totalOutflows)}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Navigation & Days List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
            
            {/* Grouped Navigation Links */}
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold px-1.5 block mb-0.5">
                  {section.title}
                </span>
                <div className="space-y-0.5">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-item-${item.id}`}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : item.color}`} />
                          <span className="truncate text-[11.5px]">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.badge && (
                            <span className="text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
                              {item.badge}
                            </span>
                          )}
                          <ChevronLeft className="w-3 h-3 opacity-60" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quick Days Jump */}
            <div className="pt-2 border-t border-slate-700/60">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold">
                  سجل الأيام ({days.length})
                </span>
              </div>

              {/* Day Filter Input */}
              <div className="relative mb-1.5">
                <Search className="w-3 h-3 text-slate-400 absolute right-2.5 top-2" />
                <input
                  type="text"
                  placeholder="ابحث عن يوم..."
                  value={daySearch}
                  onChange={e => setDaySearch(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pr-7 pl-2 py-1 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Days List */}
              <div className="space-y-0.5 max-h-36 overflow-y-auto pr-0.5">
                {filteredDays.map(d => {
                  const isSelected = d.id === selectedDayId && activeTab === 'daily';
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleDayClick(d.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition text-right cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500 font-bold'
                          : d.isClosed
                          ? 'bg-slate-900/40 text-slate-500 hover:bg-slate-800/50'
                          : 'bg-[#0F172A]/60 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {d.isClosed ? (
                          <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate text-[11px]">{d.dayTitle}</span>
                      </div>
                      {d.isClosed && (
                        <span className="text-[8.5px] text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded font-normal">
                          مغلق
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-2.5 bg-[#0F172A] border-t border-slate-700 space-y-1.5 shrink-0">
            <button
              onClick={() => {
                onExportExcel();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2.5 rounded-xl text-xs transition cursor-pointer min-h-[36px] shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير إكسل شامل (XLSX)</span>
            </button>

            {onResetData && (
              <button
                onClick={() => {
                  onResetData();
                  onClose();
                }}
                className="w-full text-center text-[10px] text-slate-400 hover:text-rose-400 py-0.5 transition cursor-pointer"
              >
                استعادة البيانات الأصلية
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

