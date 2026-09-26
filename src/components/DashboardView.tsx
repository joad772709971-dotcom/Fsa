import React from 'react';
import {
  Smartphone,
  Wrench,
  Signal,
  CreditCard,
  TrendingDown,
  Truck,
  UserCheck,
  Sparkles,
  FileSpreadsheet,
  PlusCircle,
  Coins,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Store,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';
import { Transaction, DailySummary, MonthlySettlement, TransactionType } from '../types';
import { formatCurrency } from '../utils/calculations';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  currentDate: string;
  dailySummary: DailySummary;
  monthlySettlement: MonthlySettlement;
  transactions: Transaction[];
  onOpenNewVoucher: (defaultType?: TransactionType) => void;
  onOpenAIModal: () => void;
  onOpenSystemAudit?: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onSelectDate: (date: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentDate,
  dailySummary,
  monthlySettlement,
  transactions,
  onOpenNewVoucher,
  onOpenAIModal,
  onOpenSystemAudit,
  onNavigateTab,
  onSelectDate,
}) => {
  const recentTx = [...transactions]
    .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))
    .slice(0, 8);

  const quickActionButtons: {
    id: string;
    label: string;
    sub: string;
    type?: TransactionType;
    icon: React.ReactNode;
    bg: string;
    action?: () => void;
  }[] = [
    {
      id: 'ai',
      label: 'المحاسب الذكي',
      sub: 'إدخال بالكلام أو الصوت السريع',
      icon: <Sparkles className="w-5 h-5 text-amber-300" />,
      bg: 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md shadow-indigo-950/20',
      action: onOpenAIModal,
    },
    {
      id: 'system_audit',
      label: 'فحص وتدقيق النظام',
      sub: 'كشف الأخطاء والنواقص وتبسيط العمل',
      icon: <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />,
      bg: 'bg-gradient-to-r from-amber-600 to-purple-700 hover:from-amber-500 hover:to-purple-600 text-white shadow-md shadow-amber-950/20',
      action: onOpenSystemAudit,
    },
    {
      id: 'sale',
      label: 'بيع جوال / إكسسوارات',
      sub: 'تسجيل بيع سماعات وشواحن',
      type: 'sale',
      icon: <Smartphone className="w-5 h-5 text-blue-300" />,
      bg: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
    {
      id: 'maint',
      label: 'صيانة وشاشات (50/50)',
      sub: 'مناصفة الفائدة مع المهندس',
      type: 'maintenance',
      icon: <Wrench className="w-5 h-5 text-purple-300" />,
      bg: 'bg-purple-700 hover:bg-purple-600 text-white',
    },
    {
      id: 'hadi',
      label: 'رصيد الهادي (محمد مياس)',
      sub: 'تحويل وباقات تطبيق الهادي',
      type: 'balance_hadi',
      icon: <Signal className="w-5 h-5 text-teal-300" />,
      bg: 'bg-teal-700 hover:bg-teal-600 text-white',
    },
    {
      id: 'qimma',
      label: 'رصيد الرقم (فايز أبو علي)',
      sub: 'تحويل وباقات تطبيق الرقم',
      type: 'balance_qimma',
      icon: <Signal className="w-5 h-5 text-cyan-300" />,
      bg: 'bg-cyan-700 hover:bg-cyan-600 text-white',
    },
    {
      id: 'purch',
      label: 'مشتريات وقطع غيار',
      sub: 'العبصري / القاسمي / خليل',
      type: 'purchase',
      icon: <Truck className="w-5 h-5 text-orange-300" />,
      bg: 'bg-orange-700 hover:bg-orange-600 text-white',
    },
    {
      id: 'exp_home',
      label: 'صرفة بيت مصعب',
      sub: 'تخصم حصراً من أرباح مصعب',
      type: 'expense_home_mosaab',
      icon: <UserCheck className="w-5 h-5 text-emerald-300" />,
      bg: 'bg-emerald-700 hover:bg-emerald-600 text-white',
    },
    {
      id: 'with_mosaab',
      label: 'سحب مصعب شخصي',
      sub: 'سحب كاش للمالك مصعب',
      type: 'withdrawal_mosaab',
      icon: <UserCheck className="w-5 h-5 text-emerald-300" />,
      bg: 'bg-emerald-800 hover:bg-emerald-700 text-white',
    },
    {
      id: 'with_eng',
      label: 'سحب مهندس الصيانة',
      sub: 'يخصم من حسابه 50%',
      type: 'withdrawal_engineer',
      icon: <Wrench className="w-5 h-5 text-purple-300" />,
      bg: 'bg-slate-800 hover:bg-slate-700 text-white',
    },
    {
      id: 'exp_shop',
      label: 'خرج ومصروفات محل',
      sub: 'صرفة محل وغداء ومستلزمات',
      type: 'expense_shop',
      icon: <TrendingDown className="w-5 h-5 text-rose-300" />,
      bg: 'bg-rose-700 hover:bg-rose-600 text-white',
    },
    {
      id: 'reports',
      label: 'كشف Word Doc للمالك',
      sub: 'تصدير جدول doc لصاحب المحل',
      icon: <FileText className="w-5 h-5 text-sky-300" />,
      bg: 'bg-sky-700 hover:bg-sky-600 text-white',
      action: () => onNavigateTab('reports'),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              الرقم الأول - المحاسب الذكي
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-mono-numbers">
              اليوم: {currentDate}
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-black text-white">
            الرقم الأول • إدارة مبيعات وحسابات محل مصعب
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            توزيع الأرباح: <strong>ثلثين (2/3) للمالك مصعب</strong> و <strong>ثلث (1/3) للمدير</strong>، ومناصفة <strong>50% للمهندس</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenSystemAudit && (
            <button
              onClick={onOpenSystemAudit}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-purple-700 hover:from-amber-500 hover:to-purple-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer border border-amber-400/40"
              title="فاحص ومدقق النظام الذكي (Gemini Smart Auditor)"
            >
              <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
              <span>فحص وتدقيق النظام (جميني)</span>
            </button>
          )}

          <button
            onClick={onOpenAIModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
            <span>المحاسب الذكي (صوت وكتابة)</span>
          </button>
        </div>
      </div>

      {/* Today's Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* 1. Today's Sales */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs mb-1.5">
              <span>مبيعات اليوم:</span>
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
            </div>
            <div className="font-mono text-sm sm:text-lg lg:text-xl font-black text-slate-900 truncate tracking-tight">
              {formatCurrency(dailySummary.totalSales)}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 truncate">
            إجمالي المبيعات والرصيد
          </div>
        </div>

        {/* 2. Today's Distributable Net */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs mb-1.5">
              <span>صافي الأرباح:</span>
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            </div>
            <div className="font-mono text-sm sm:text-lg lg:text-xl font-black text-amber-600 truncate tracking-tight">
              {formatCurrency(dailySummary.netDistributableProfit)}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 truncate">
            بعد خصم المصاريف
          </div>
        </div>

        {/* 3. Mosaab's Share Today */}
        <div className="bg-emerald-950 text-white p-3.5 sm:p-5 rounded-2xl border border-emerald-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-200 text-[11px] sm:text-xs mb-1.5">
              <span>حصة مصعب (2/3):</span>
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            </div>
            <div className="font-mono text-sm sm:text-lg lg:text-xl font-black text-emerald-300 truncate tracking-tight">
              {formatCurrency(dailySummary.mosaabNetBalance)}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-200/70 mt-1.5 truncate">
            الصافي لمصعب اليوم
          </div>
        </div>

        {/* 4. Cash in Drawer */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs mb-1.5">
              <span>كاش الدرج:</span>
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
            </div>
            <div className="font-mono text-sm sm:text-lg lg:text-xl font-black text-cyan-300 truncate tracking-tight">
              {formatCurrency(dailySummary.netCashDrawer)}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 truncate">
            السيولة بالصندوق
          </div>
        </div>

      </div>

      {/* Operational Portals (بوابات الأنظمة التشغيلية المتطورة) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => onNavigateTab('pos_cashier')}
          className="p-3.5 bg-gradient-to-br from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white rounded-2xl shadow-xs transition-all text-right flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="p-2 bg-white/15 rounded-xl">
              <CreditCard className="w-5 h-5 text-emerald-200" />
            </span>
            <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full">
              POS
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs">كاشير نقاط البيع</h4>
            <p className="text-[10px] text-emerald-200/70 mt-0.5">فواتير حرارية سريعة</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('maintenance_tickets')}
          className="p-3.5 bg-gradient-to-br from-purple-800 to-indigo-950 hover:from-purple-700 hover:to-indigo-900 text-white rounded-2xl shadow-xs transition-all text-right flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="p-2 bg-white/15 rounded-xl">
              <Wrench className="w-5 h-5 text-purple-200" />
            </span>
            <span className="text-[10px] font-bold bg-purple-400/20 text-purple-200 px-2 py-0.5 rounded-full">
              صيانة
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs">كروت أجهزة الصيانة</h4>
            <p className="text-[10px] text-purple-200/70 mt-0.5">استلام وطباعة وقسمة 50%</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('cash_drawer')}
          className="p-3.5 bg-gradient-to-br from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white rounded-2xl shadow-xs transition-all text-right flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="p-2 bg-white/15 rounded-xl">
              <Wallet className="w-5 h-5 text-amber-200" />
            </span>
            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">
              الخزينة
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs">كاش الدرج والصندوق</h4>
            <p className="text-[10px] text-amber-200/70 mt-0.5">مطابقة الفئات والعجز</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('stock_alerts')}
          className="p-3.5 bg-gradient-to-br from-rose-800 to-rose-950 hover:from-rose-700 hover:to-rose-900 text-white rounded-2xl shadow-xs transition-all text-right flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="p-2 bg-white/15 rounded-xl">
              <Layers className="w-5 h-5 text-rose-200" />
            </span>
            <span className="text-[10px] font-bold bg-rose-400/20 text-rose-200 px-2 py-0.5 rounded-full">
              نواقص
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs">نواقص وطلبيات الشراء</h4>
            <p className="text-[10px] text-rose-200/70 mt-0.5">إرسال بالواتساب للموردين</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('official_vouchers')}
          className="p-3.5 bg-gradient-to-br from-indigo-800 to-slate-900 hover:from-indigo-700 hover:to-slate-800 text-white rounded-2xl shadow-xs transition-all text-right flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="p-2 bg-white/15 rounded-xl">
              <FileText className="w-5 h-5 text-indigo-200" />
            </span>
            <span className="text-[10px] font-bold bg-indigo-400/20 text-indigo-200 px-2 py-0.5 rounded-full">
              سندات
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs">سندات قبض وصرف</h4>
            <p className="text-[10px] text-indigo-200/70 mt-0.5">طباعة رسمية وتفقيط</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('account_statement')}
          className="p-3.5 bg-gradient-to-br from-blue-800 to-cyan-950 hover:from-blue-700 hover:to-cyan-900 text-white rounded-2xl shadow-xs transition-all text-right flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="p-2 bg-white/15 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-blue-200" />
            </span>
            <span className="text-[10px] font-bold bg-blue-400/20 text-blue-200 px-2 py-0.5 rounded-full">
              كشف
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs">كشف حساب له وعليه</h4>
            <p className="text-[10px] text-blue-200/70 mt-0.5">تصدير Word و Excel</p>
          </div>
        </button>
      </div>

      {/* Quick Action Buttons Grid (أزرار السندات والقيود السريعة) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              أزرار السندات والعمليات السريعة
            </h3>
            <p className="text-xs text-slate-500">
              اضغط على أي قسم لفتح سند مخصص مع التوزيع المحاسبي الفوري
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickActionButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                if (btn.action) btn.action();
                else if (btn.type) onOpenNewVoucher(btn.type);
              }}
              className={`p-3.5 rounded-2xl flex flex-col justify-between text-right transition-all hover:scale-[1.02] active:scale-[0.98] ${btn.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-black/15 rounded-xl">{btn.icon}</span>
                <PlusCircle className="w-4 h-4 opacity-70" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">{btn.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{btn.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Split Cards: Recent Transactions & Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">آخر الحركات والقيود المسجلة</h3>
              <button
                onClick={() => onNavigateTab('daily_ledger')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                عرض كشف اليومية والجداول &larr;
              </button>
            </div>

            {recentTx.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="text-xs font-bold text-slate-500">لا توجد حركات مسجلة حالياً</div>
                <p className="text-[11px] text-slate-400">
                  النظام جاهز ونظيف تماماً. يمكنك البدء بتسجيل المبيعات، الصيانة، فواتير القطع، أو عمليات الرصيد من الأزرار أعلاه.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] sm:min-w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">الفائدة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">{tx.date}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            {tx.type === 'sale'
                              ? 'مبيعات'
                              : tx.type === 'maintenance'
                              ? 'صيانة 50%'
                              : tx.type === 'balance_hadi'
                              ? 'رصيد الهادي'
                              : tx.type === 'balance_qimma'
                              ? 'رصيد الرقم'
                              : tx.type === 'expense_home_mosaab'
                              ? 'بيت مصعب'
                              : tx.type === 'withdrawal_mosaab'
                              ? 'سحب مصعب'
                              : tx.type === 'expense_engineer'
                              ? 'صرفة مهندس'
                              : tx.type === 'expense_shop'
                              ? 'خرج محل'
                              : tx.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{tx.description}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{formatCurrency(tx.price)}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">
                          {tx.profit > 0 ? `+${formatCurrency(tx.profit)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Settlement Quick Overview (1 col) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="font-bold text-sm text-white">تصفية شهر ({monthlySettlement.monthName})</span>
              <button
                onClick={() => onNavigateTab('monthly_settlement')}
                className="text-[11px] text-indigo-300 hover:text-white font-semibold underline"
              >
                الكشف الشهري الكامل
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>إجمالي مبيعات الشهر:</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(monthlySettlement.totalSales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>صافي الأرباح القابلة للتوزيع:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(monthlySettlement.shopNetDistributable)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-300 border-t border-white/10 pt-2 font-bold">
                <span>صافي مستحق مصعب (2/3):</span>
                <span className="font-mono text-emerald-400 text-sm">
                  {formatCurrency(monthlySettlement.mosaabFinalPayable)}
                </span>
              </div>
              <div className="flex justify-between text-sky-300">
                <span>مستحق المدير (1/3):</span>
                <span className="font-mono font-bold">{formatCurrency(monthlySettlement.managerTotalShare)}</span>
              </div>
              <div className="flex justify-between text-purple-300">
                <span>متبقي مهندس الصيانة:</span>
                <span className="font-mono font-bold">{formatCurrency(monthlySettlement.engineerRemaining)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('reports')}
            className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            تصدير كشف Doc / Excel
          </button>
        </div>

      </div>

    </div>
  );
};
