import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  PieChart,
  Smartphone,
  Wrench,
  Signal,
  CreditCard,
  TrendingDown,
  Truck,
  Boxes,
  UserCheck,
  Users,
  UserSquare2,
  Sparkles,
  Search,
  FileSpreadsheet,
  CloudUpload,
  Cloud,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Lock,
  Percent,
  Scan,
  Activity,
  Package,
  RotateCcw,
  Trash2,
  Building2,
  HardDrive,
  Archive,
  Handshake,
  BookOpen,
  Settings,
  Key,
  Receipt,
  Layers,
  Barcode,
  ShoppingBag,
  LogOut,
} from 'lucide-react';

export type NavTab =
  // العمليات واليوميات
  | 'dashboard'
  | 'pos_cashier'
  | 'cashier_full'
  | 'daily_ledger'
  | 'master_table'
  | 'cash_drawer'
  | 'official_vouchers'
  | 'monthly_settlement'
  // الصيانة والشرائح والمخزن
  | 'maintenance'
  | 'maintenance_tickets'
  | 'sims'
  | 'networks'
  | 'recharge_manager'
  | 'cost_pricing_guide'
  | 'inventory'
  | 'stock_alerts'
  | 'shortages'
  | 'returns'
  | 'damaged'
  | 'barcode_manager'
  // الحسابات والشركاء والموردين
  | 'partners_funding'
  | 'mosaab_account'
  | 'musab_ledger'
  | 'suppliers'
  | 'suppliers_ledger'
  | 'customers'
  | 'delivery'
  | 'employees'
  | 'accounts'
  // التقارير والأدوات الذكية
  | 'ai_assistant'
  | 'system_audit'
  | 'reports'
  | 'notebook_matcher'
  | 'account_statement'
  | 'forensic_audit'
  | 'invoice_ocr'
  | 'telecom_engine'
  | 'package_catalog'
  | 'assets'
  // النظام والنسخ الاحتياطي
  | 'profit_sharing'
  | 'cloud_sync'
  | 'archive'
  | 'owner_portal'
  | 'backup_github'
  // توافق رجعي
  | 'sales'
  | 'expenses';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSearch?: () => void;
  onOpenPermissions?: () => void;
  onOpenShopSettings?: () => void;
  onOpenLicense?: () => void;
  onLockScreen?: () => void;
  onExitSystem?: () => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  transactionsCount: number;
}

interface NavSection {
  title: string;
  items: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    color?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
  onOpenPermissions,
  onOpenShopSettings,
  onOpenLicense,
  onLockScreen,
  onExitSystem,
  isOpenMobile,
  onToggleMobile,
  transactionsCount,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const sections: NavSection[] = [
    {
      title: 'العمليات واليوميات',
      items: [
        {
          id: 'dashboard',
          label: 'لوحة التحكم',
          icon: <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-emerald-500',
        },
        {
          id: 'pos_cashier',
          label: 'كاشير ونقاط البيع الموحدة (بيع وشراء)',
          icon: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'بيع وشراء',
          color: 'text-emerald-500',
        },
        {
          id: 'daily_ledger',
          label: 'دفتر اليومية النشط',
          icon: <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'مهم',
          color: 'text-sky-500',
        },
        {
          id: 'master_table',
          label: 'الكشف العام المجمع للأيام',
          icon: <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'شامل',
          color: 'text-yellow-600',
        },
        {
          id: 'cash_drawer',
          label: 'كاش الخزينة والصندوق',
          icon: <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'الصندوق',
          color: 'text-amber-500',
        },
        {
          id: 'official_vouchers',
          label: 'سندات القبض والصرف',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'سندات',
          color: 'text-indigo-600',
        },
        {
          id: 'monthly_settlement',
          label: 'التصفية الشهرية للأرباح',
          icon: <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-amber-500',
        },
      ],
    },
    {
      title: 'الصيانة والشرائح والمخزن',
      items: [
        {
          id: 'maintenance',
          label: 'مركز وتذاكر الصيانة (50%)',
          icon: <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'صيانة',
          color: 'text-purple-600',
        },
        {
          id: 'sims',
          label: 'إدارة الشرائح وباقات الاتصال',
          icon: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'شرائح',
          color: 'text-indigo-500',
        },
        {
          id: 'recharge_manager',
          label: 'الرصيد والشحن ومطابقة مياس',
          icon: <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'الهادي',
          color: 'text-emerald-500',
        },
        {
          id: 'cost_pricing_guide',
          label: 'المخزن ودليل الأسعار',
          icon: <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'المخزن',
          color: 'text-amber-500',
        },
        {
          id: 'inventory',
          label: 'مخزون قطع الغيار والإكسسوار',
          icon: <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-amber-600',
        },
        {
          id: 'shortages',
          label: 'نواقص المخزن وطلبيات (2:00 ظ)',
          icon: <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'طلبيات',
          color: 'text-rose-500',
        },
        {
          id: 'returns',
          label: 'المرتجع والمردودات (زبائن وتجار)',
          icon: <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-orange-500',
        },
        {
          id: 'damaged',
          label: 'سجل التالف والفاقد والضياع',
          icon: <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-rose-600',
        },
        {
          id: 'barcode_manager',
          label: 'طباعة وتوليد الباركود',
          icon: <Barcode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-indigo-500',
        },
      ],
    },
    {
      title: 'الحسابات والشركاء والموردين',
      items: [
        {
          id: 'partners_funding',
          label: 'الداعم الممول (عبد الغني) ورأس المال',
          icon: <Handshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'داعم ذمار',
          color: 'text-amber-600',
        },
        {
          id: 'mosaab_account',
          label: 'حساب وكشف مصعب والمسحوبات',
          icon: <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'المالك',
          color: 'text-emerald-600',
        },
        {
          id: 'suppliers',
          label: 'إدارة وحسابات الموردين والتجار',
          icon: <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'تجار وموردين',
          color: 'text-orange-500',
        },
        {
          id: 'customers',
          label: 'العملاء والديون والضمانات',
          icon: <UserSquare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-slate-600',
        },
        {
          id: 'delivery',
          label: 'خدمة التوصيل والمشاوير (المتر)',
          icon: <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'المتر',
          color: 'text-amber-500',
        },
        {
          id: 'employees',
          label: 'الموظفين والرواتب (حمدان والمهندس)',
          icon: <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-cyan-600',
        },
        {
          id: 'accounts',
          label: 'دليل الحسابات والصناديق والسيولة',
          icon: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-purple-600',
        },
      ],
    },
    {
      title: 'التقارير والأدوات والذكاء الاصطناعي',
      items: [
        {
          id: 'ai_assistant',
          label: 'المحاسب الذكي',
          icon: <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'AI',
          color: 'text-violet-500',
        },
        {
          id: 'system_audit',
          label: 'تدقيق وفحص النظام (Gemini)',
          icon: <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'جديد',
          color: 'text-amber-500',
        },
        {
          id: 'invoice_ocr',
          label: 'قارئ الفواتير (Vision OCR)',
          icon: <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'OCR',
          color: 'text-emerald-500',
        },
        {
          id: 'telecom_engine',
          label: 'كشوفات السداد (محرك PDF)',
          icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'PDF',
          color: 'text-sky-500',
        },
        {
          id: 'package_catalog',
          label: 'كتالوج تسعير الباقات',
          icon: <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'تسعير',
          color: 'text-purple-500',
        },
        {
          id: 'account_statement',
          label: 'كشف الحساب التفصيلي للجهات',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'مطور',
          color: 'text-blue-600',
        },
        {
          id: 'notebook_matcher',
          label: 'مطابقة الدفتر اليومي الورقي',
          icon: <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'تدقيق',
          color: 'text-amber-600',
        },
        {
          id: 'reports',
          label: 'التقارير المحاسبية والتصدير',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'Doc/XLS',
          color: 'text-blue-600',
        },
        {
          id: 'assets',
          label: 'سجل أصول ومعدات وتجهيزات المحل',
          icon: <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-slate-500',
        },
        {
          id: 'forensic_audit',
          label: 'التدقيق الجنائي المستقل',
          icon: <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'سري',
          color: 'text-indigo-600',
        },
      ],
    },
    {
      title: 'إدارة النظام والمالك',
      items: [
        {
          id: 'profit_sharing',
          label: 'إعدادات النظام وتقسيم الأرباح',
          icon: <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'أساسي',
          color: 'text-indigo-600',
        },
        {
          id: 'cloud_sync',
          label: 'المزامنة السحابية الفورية',
          icon: <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'سحابي',
          color: 'text-emerald-500',
        },
        {
          id: 'archive',
          label: 'أرشيف السجلات والنسخ الاحتياطي',
          icon: <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          color: 'text-slate-500',
        },
        {
          id: 'owner_portal',
          label: 'بوابة المالك وتراخيص المحلات',
          icon: <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'المالك',
          color: 'text-amber-500',
        },
        {
          id: 'backup_github',
          label: 'تنزيل التطبيقات (APK & EXE)',
          icon: <CloudUpload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
          badge: 'تطبيقات',
          color: 'text-emerald-700',
        },
      ],
    },
  ];

  const filteredSections = useMemo(() => {
    if (!filterQuery.trim()) return sections;
    const q = filterQuery.trim().toLowerCase();
    return sections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((it) => it.label.toLowerCase().includes(q) || (it.badge && it.badge.toLowerCase().includes(q))),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [sections, filterQuery]);

  return (
    <>
      {/* Mobile Toggle Trigger floating button - Compact & sleek */}
      <button
        onClick={onToggleMobile}
        className="lg:hidden fixed bottom-3 right-3 z-50 w-9 h-9 sm:w-11 sm:h-11 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full shadow-lg shadow-emerald-950/40 flex items-center justify-center transition-all no-print"
        aria-label="القائمة الجانبية"
        title="فتح القائمة الجانبية"
      >
        {isOpenMobile ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          onClick={onToggleMobile}
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity no-print"
        />
      )}

      {/* Sidebar container - Mobile optimized width */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] bottom-0 right-0 z-40 w-[225px] sm:w-64 max-w-[78vw] bg-white border-l border-slate-200 shadow-xl lg:shadow-none flex flex-col h-full lg:h-[calc(100vh-57px)] transition-transform duration-300 ease-in-out no-print ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header inside sidebar on mobile */}
        <div className="p-2 sm:p-2.5 border-b border-slate-100 flex items-center justify-between lg:hidden bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <img src="/icon.png" alt="الرقم الأول" className="w-5 h-5 rounded-md object-cover border border-amber-500/40 shrink-0" />
            <span className="font-bold text-xs truncate">أقسام المحاسب</span>
          </div>
          <button
            onClick={onToggleMobile}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            title="إغلاق القائمة"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-2">
          {/* Quick Search inside Sidebar */}
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="بحث سريع في الأقسام..."
              className="w-full pr-8 pl-6 py-1.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg text-[11px] text-slate-800 placeholder-slate-400 outline-hidden transition-all"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute left-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                title="مسح البحث"
              >
                ×
              </button>
            )}
          </div>

          {onOpenSearch && (
            <button
              onClick={() => {
                onOpenSearch();
                if (isOpenMobile) onToggleMobile();
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg font-bold text-[11px] sm:text-xs bg-blue-50 text-blue-800 border border-blue-200/80 hover:bg-blue-100 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>البحث الشامل في القيود</span>
              </div>
              <kbd className="text-[8px] sm:text-[9px] bg-blue-200/80 text-blue-900 px-1 py-0.2 rounded font-mono">
                /
              </kbd>
            </button>
          )}

          {filteredSections.map((section, secIdx) => (
            <div key={secIdx} className="space-y-0.5">
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 px-2 pt-1.5 pb-0.5 uppercase tracking-wider flex items-center justify-between border-t border-slate-100 first:border-t-0">
                <span>{section.title}</span>
                <span className="text-[8px] px-1 rounded bg-slate-100 text-slate-500 font-mono">
                  {section.items.length}
                </span>
              </div>

              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (isOpenMobile) onToggleMobile();
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all group text-right ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                      <span className={`${isActive ? 'text-emerald-600' : item.color || 'text-slate-500'} shrink-0`}>
                        {item.icon}
                      </span>
                      <span className="truncate text-[11px] sm:text-xs">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded font-bold ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 rotate-180 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Compact Security & Permissions Widget (مربع أمان القائمة المصغر) */}
        <div className="mx-2 mb-1 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[10px] text-slate-600 shrink-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>إدارة النظام والترخيص</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">محمي 🔒</span>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-200/60">
            {onOpenShopSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenShopSettings();
                  if (isOpenMobile) onToggleMobile();
                }}
                className="py-1 px-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-1"
                title="إعدادات المحل والهوية"
              >
                <Settings className="w-3 h-3 text-slate-500" />
                <span>إعدادات المحل</span>
              </button>
            )}
            {onOpenLicense && (
              <button
                type="button"
                onClick={() => {
                  onOpenLicense();
                  if (isOpenMobile) onToggleMobile();
                }}
                className="py-1 px-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-amber-700 text-[10px] font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-1"
                title="تراخيص النظام"
              >
                <Key className="w-3 h-3 text-amber-500" />
                <span>الترخيص</span>
              </button>
            )}
            {onOpenPermissions && (
              <button
                type="button"
                onClick={() => {
                  onOpenPermissions();
                  if (isOpenMobile) onToggleMobile();
                }}
                className="py-1 px-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold text-center cursor-pointer transition-colors"
                title="أذونات وتصاريح التطبيق"
              >
                الصلاحيات
              </button>
            )}
            {onLockScreen && (
              <button
                type="button"
                onClick={() => {
                  onLockScreen();
                  if (isOpenMobile) onToggleMobile();
                }}
                className="py-1 px-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-0.5"
                title="قفل الشاشة فوراً"
              >
                <Lock className="w-3 h-3 text-amber-700" />
                <span>قفل</span>
              </button>
            )}
            {onExitSystem && (
              <button
                type="button"
                onClick={() => {
                  onExitSystem();
                  if (isOpenMobile) onToggleMobile();
                }}
                className="py-1 px-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-0.5"
                title="تأكيد الخروج من النظام"
              >
                <LogOut className="w-3 h-3 text-rose-600" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer info in sidebar - Compact */}
        <div className="p-2 sm:p-2.5 border-t border-slate-100 bg-slate-50/80 text-slate-500 text-[10px] shrink-0">
          <div className="flex items-center justify-between mb-0.5">
            <span>المالك:</span>
            <strong className="text-slate-800">مصعب الصوفي</strong>
          </div>
          <div className="flex items-center justify-between mb-0.5">
            <span>إجمالي الحركات:</span>
            <span className="font-mono font-bold text-slate-700">{transactionsCount}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
            <span>إصدار النظام:</span>
            <span className="font-mono font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">v2.7.6</span>
          </div>
        </div>
      </aside>
    </>
  );
};
