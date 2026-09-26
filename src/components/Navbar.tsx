import React, { useState, useEffect } from 'react';
import {
  Store,
  Calendar,
  Wallet,
  Coins,
  Sparkles,
  Search,
  Wifi,
  WifiOff,
  PlusCircle,
  FileDown,
  RefreshCw,
  CreditCard,
  Barcode,
  ShieldCheck,
  User,
  LogOut,
  Lock,
  Github,
  Download,
  Maximize,
  Minimize,
  Menu,
  Settings,
  Mic,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { DailySummary, AuthUser } from '../types';
import { SyncStatusBadge } from './SyncStatusBadge';
import { ZoomControl } from './ZoomControl';

interface NavbarProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  dailySummary: DailySummary;
  onOpenNewVoucher: () => void;
  onOpenSearch?: () => void;
  onOpenAIModal: () => void;
  onOpenHandsFreeVoice?: () => void;
  onOpenSystemAudit?: () => void;
  onOpenExportModal: () => void;
  onOpenPOS?: () => void;
  onOpenPermissions?: () => void;
  onOpenGitHubModal?: () => void;
  onOpenSettings?: () => void;
  onOpenForensicAudit?: () => void;
  currentUser?: AuthUser | null;
  onLockScreen?: () => void;
  onLogout?: () => void;
  isOnline: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onSyncComplete?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onDateChange,
  dailySummary,
  onOpenNewVoucher,
  onOpenSearch,
  onOpenAIModal,
  onOpenHandsFreeVoice,
  onOpenSystemAudit,
  onOpenExportModal,
  onOpenPOS,
  onOpenPermissions,
  onOpenGitHubModal,
  onOpenSettings,
  onOpenForensicAudit,
  currentUser,
  onLockScreen,
  onLogout,
  isOnline,
  onToggleSidebar,
  isSidebarOpen,
  onSyncComplete,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          (document.documentElement as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg no-print w-full pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-6 py-1 sm:py-2">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Right section: Sidebar toggle + Brand & Shop Title */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 border border-slate-700 transition-colors cursor-pointer shrink-0"
                title="القائمة الجانبية للأقسام"
                aria-label="القائمة الجانبية للأقسام"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            <img
              src="/icon.png"
              alt="الرقم الأول"
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl shadow-md object-cover border border-amber-500/40 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                <h1 className="font-black text-xs sm:text-base text-white leading-tight truncate">
                  الرقم الأول
                </h1>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  محل مصعب
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                نظام إدارة المبيعات • الصيانة • شبكات الرصيد • نقاط البيع
              </p>
            </div>
          </div>

          {/* Quick Stats Banner (Desktop/Tablet) */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-800/80 px-4 py-1.5 rounded-xl border border-slate-700/60 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">مبيعات اليوم:</span>
              <span className="font-bold text-emerald-400 font-mono-numbers">
                {formatCurrency(dailySummary.totalSales)}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">أرباح اليوم:</span>
              <span className="font-bold text-amber-300 font-mono-numbers">
                {formatCurrency(dailySummary.totalGrossProfit + dailySummary.shopMaintenanceShare)}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">كاش الدرج:</span>
              <span className="font-bold text-cyan-300 font-mono-numbers">
                {formatCurrency(dailySummary.netCashDrawer)}
              </span>
            </div>
          </div>

          {/* Desktop Actions & Tools (lg:flex) */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            {/* Active User Badge & Lock */}
            {currentUser && (
              <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 px-2 py-1 rounded-xl text-xs shrink-0">
                <div
                  className={`w-6 h-6 rounded-lg bg-gradient-to-br ${
                    currentUser.avatarBg || 'from-amber-600 to-amber-900'
                  } text-white flex items-center justify-center text-[10px] font-black shrink-0`}
                  title={currentUser.name}
                >
                  {currentUser.name[0]}
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-[11px] leading-none">{currentUser.name}</div>
                </div>

                {onLockScreen && (
                  <button
                    type="button"
                    onClick={onLockScreen}
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                    title="قفل الشاشة مؤقتاً"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                )}

                {(onLogout || onLockScreen) && (
                  <button
                    type="button"
                    onClick={onLogout || onLockScreen}
                    className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    title="تسجيل الخروج من الحساب"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Date Picker */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs text-slate-200 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer max-w-[125px]"
                title="اختر تاريخ اليومية"
              />
            </div>

            {/* POS Quick Button */}
            {onOpenPOS && (
              <button
                onClick={onOpenPOS}
                className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                title="فتح شاشة الكاشير السريعة"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-200" />
                <span>الكاشير</span>
              </button>
            )}

            {/* Universal Search Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                title="البحث الشامل عن أي صنف أو عملية أو ضمار (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5 text-blue-100" />
                <span>بحث</span>
              </button>
            )}

            {/* Hands-Free Voice Continuous Mode Button */}
            {onOpenHandsFreeVoice && (
              <button
                onClick={onOpenHandsFreeVoice}
                className="flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 border border-emerald-400/40 animate-pulse"
                title="المكالمة الصوتية المستمرة (Hands-Free): استماع متواصل وإدخال للقيود بدون لمس الشاشة"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-100" />
                <span className="hidden xl:inline">مكالمة مستمرة</span>
              </button>
            )}

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAIModal}
              className="flex items-center justify-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              title="المحاسب والمساعد الذكي"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>المحاسب</span>
            </button>

            {/* System Audit Button */}
            {onOpenSystemAudit && (
              <button
                onClick={onOpenSystemAudit}
                className="flex items-center justify-center gap-1 bg-gradient-to-r from-amber-600 to-purple-700 hover:from-amber-500 hover:to-purple-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 border border-amber-400/40"
                title="فاحص ومدقق النظام الذكي (Gemini Smart Auditor)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden xl:inline">فحص النظام</span>
              </button>
            )}

            {/* Quick New Voucher Button */}
            <button
              onClick={onOpenNewVoucher}
              className="flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-emerald-600 shadow-xs transition-all cursor-pointer shrink-0"
              title="إضافة سند / حركة جديدة"
            >
              <PlusCircle className="w-3.5 h-3.5 text-white" />
              <span>سند</span>
            </button>

            {/* System Settings Shortcut Button */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-xs transition-all cursor-pointer shrink-0"
                title="إعدادات النظام وتقسيم الأرباح"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xl:inline">الإعدادات</span>
              </button>
            )}

            {/* Forensic Auditor Quick Access Button */}
            {onOpenForensicAudit && (
              <button
                type="button"
                onClick={onOpenForensicAudit}
                className="flex items-center justify-center gap-1 bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-800 hover:to-slate-800 text-indigo-200 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-indigo-700/60 shadow-xs transition-all cursor-pointer shrink-0"
                title="وحدة التدقيق الجنائي المحاسبي المستقلة (Read-Only)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xl:inline">التدقيق الجنائي</span>
              </button>
            )}

            {/* Chrome-Style Global Font & Screen Zoom Control */}
            <ZoomControl />

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0 ${
                isFullscreen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={isFullscreen ? 'تصغير الشاشة والخروج من ملء الشاشة' : 'ملء الشاشة بالكامل (Fullscreen)'}
            >
              {isFullscreen ? (
                <Minimize className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Maximize className="w-3.5 h-3.5 text-slate-300" />
              )}
              <span className="hidden xl:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
            </button>

            {/* Cloud Sync Status Badge */}
            <SyncStatusBadge onSyncComplete={onSyncComplete} />
          </div>

          {/* Mobile Row 1 Controls (lg:hidden) */}
          <div className="flex lg:hidden items-center gap-1 shrink-0">
            {/* Date Picker on Mobile */}
            <div className="flex items-center gap-0.5 bg-slate-800 px-1.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-200 shrink-0">
              <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent border-none text-[11px] text-white focus:outline-none cursor-pointer max-w-[85px]"
                title="اختر تاريخ اليومية"
              />
            </div>

            {/* User Avatar & Lock */}
            {currentUser && (
              <div className="flex items-center gap-0.5 bg-slate-800 border border-slate-700 p-0.5 rounded-lg text-xs shrink-0">
                <div
                  className={`w-6 h-6 rounded bg-gradient-to-br ${
                    currentUser.avatarBg || 'from-amber-600 to-amber-900'
                  } text-white flex items-center justify-center text-[10px] font-black shrink-0`}
                  title={currentUser.name}
                >
                  {currentUser.name[0]}
                </div>
                {onLockScreen && (
                  <button
                    type="button"
                    onClick={onLockScreen}
                    className="p-1 hover:bg-slate-700 text-slate-400 rounded cursor-pointer"
                    title="قفل الشاشة"
                  >
                    <Lock className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Fullscreen Mobile */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs transition-all cursor-pointer shrink-0 ${
                isFullscreen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize className="w-3 h-3 text-amber-400" /> : <Maximize className="w-3 h-3" />}
            </button>

            {/* Cloud Sync Status Badge */}
            <SyncStatusBadge onSyncComplete={onSyncComplete} />
          </div>
        </div>

        {/* Mobile Row 2: Comprehensive, Non-Clipped Action Toolbar for Phones (lg:hidden) */}
        <div className="lg:hidden mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {/* POS Quick Button */}
          {onOpenPOS && (
            <button
              onClick={onOpenPOS}
              className="flex items-center gap-1 bg-emerald-600 active:scale-95 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xs cursor-pointer shrink-0"
              title="فتح شاشة الكاشير السريعة"
            >
              <CreditCard className="w-3 h-3 text-emerald-200" />
              <span>الكاشير</span>
            </button>
          )}

          {/* Quick New Voucher Button */}
          <button
            onClick={onOpenNewVoucher}
            className="flex items-center gap-1 bg-emerald-700 active:scale-95 text-white text-[11px] font-bold px-2 py-1 rounded-lg border border-emerald-600 shadow-xs cursor-pointer shrink-0"
            title="إضافة سند / حركة جديدة"
          >
            <PlusCircle className="w-3 h-3 text-white" />
            <span>سند جديد</span>
          </button>

          {/* Hands-Free Voice Continuous Mode Button */}
          {onOpenHandsFreeVoice && (
            <button
              onClick={onOpenHandsFreeVoice}
              className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 active:scale-95 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xs cursor-pointer shrink-0 border border-emerald-400/40 animate-pulse"
              title="المكالمة الصوتية المستمرة بدون لمس"
            >
              <Mic className="w-3 h-3 text-emerald-100" />
              <span>مكالمة صوتية</span>
            </button>
          )}

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 active:scale-95 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xs cursor-pointer shrink-0"
            title="المحاسب والمساعد الذكي"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>المحاسب</span>
          </button>

          {/* System Audit Button */}
          {onOpenSystemAudit && (
            <button
              onClick={onOpenSystemAudit}
              className="flex items-center gap-1 bg-gradient-to-r from-amber-600 to-purple-700 active:scale-95 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xs cursor-pointer shrink-0 border border-amber-400/40"
              title="فاحص ومدقق النظام الذكي (Gemini Smart Auditor)"
            >
              <ShieldCheck className="w-3 h-3 text-amber-300" />
              <span>فحص النظام</span>
            </button>
          )}

          {/* Universal Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1 bg-blue-600 active:scale-95 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xs cursor-pointer shrink-0"
              title="البحث الشامل"
            >
              <Search className="w-3 h-3 text-blue-100" />
              <span>بحث</span>
            </button>
          )}

          {/* System Settings Shortcut Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1 bg-slate-800 active:scale-95 text-indigo-300 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-700 shadow-xs cursor-pointer shrink-0"
              title="إعدادات النظام"
            >
              <Settings className="w-3 h-3 text-indigo-400" />
              <span>الإعدادات</span>
            </button>
          )}

          {/* Forensic Auditor Button */}
          {onOpenForensicAudit && (
            <button
              type="button"
              onClick={onOpenForensicAudit}
              className="flex items-center gap-1 bg-indigo-950 active:scale-95 text-indigo-200 text-[11px] font-bold px-2 py-1 rounded-lg border border-indigo-700/60 shadow-xs cursor-pointer shrink-0"
              title="التدقيق الجنائي"
            >
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>التدقيق الجنائي</span>
            </button>
          )}

          {/* Zoom Control */}
          <div className="shrink-0 scale-90 origin-right">
            <ZoomControl />
          </div>
        </div>
      </div>

      {/* Mobile Quick Stats Strip (only visible on mobile phones < sm) */}
      <div className="sm:hidden bg-slate-950/90 border-t border-slate-800/80 px-2.5 py-1 text-[10px] flex items-center justify-between font-mono-numbers">
        <div className="flex items-center gap-1 truncate">
          <span className="text-slate-400 text-[9px]">المبيعات:</span>
          <span className="font-bold text-emerald-400 truncate">{formatCurrency(dailySummary.totalSales)}</span>
        </div>
        <div className="w-px h-3 bg-slate-800 shrink-0 mx-1" />
        <div className="flex items-center gap-1 truncate">
          <span className="text-slate-400 text-[9px]">الأرباح:</span>
          <span className="font-bold text-amber-300 truncate">{formatCurrency(dailySummary.totalGrossProfit + dailySummary.shopMaintenanceShare)}</span>
        </div>
        <div className="w-px h-3 bg-slate-800 shrink-0 mx-1" />
        <div className="flex items-center gap-1 truncate">
          <span className="text-slate-400 text-[9px]">الدرج:</span>
          <span className="font-bold text-cyan-300 truncate">{formatCurrency(dailySummary.netCashDrawer)}</span>
        </div>
      </div>
    </header>
  );
};
