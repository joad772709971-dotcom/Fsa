import React, { useState } from 'react';
import {
  Radio,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Coins,
  Clock,
  RefreshCw,
  Volume2,
  ChevronDown,
  ChevronUp,
  Building2,
  ExternalLink,
  Percent,
  X,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { CFORadarAlert, AutonomousCFOContext, NavTab } from '../types';

interface CFORadarBannerProps {
  radarAlert: CFORadarAlert | null;
  cfoContext: AutonomousCFOContext;
  isScanning: boolean;
  onRescan: () => void;
  onPlayVoice?: (text: string) => void;
  onNavigateToTab?: (tab: NavTab) => void;
  isStandaloneView?: boolean;
  onDismissAlert?: () => void;
  onOpenDedicatedTab?: () => void;
}

export const CFORadarBanner: React.FC<CFORadarBannerProps> = ({
  radarAlert,
  cfoContext,
  isScanning,
  onRescan,
  onPlayVoice,
  onNavigateToTab,
  isStandaloneView = false,
  onDismissAlert,
  onOpenDedicatedTab,
}) => {
  const [showRatios, setShowRatios] = useState(false);

  const ratios = cfoContext.financialRatios;

  // Severity color maps
  const getSeverityTheme = (severity: CFORadarAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-950/90 border-rose-500/60 text-rose-50',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          iconColor: 'text-rose-400',
          btnBg: 'bg-rose-600 hover:bg-rose-500 text-white',
          pulseColor: 'bg-rose-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 border-amber-500/60 text-amber-50',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          iconColor: 'text-amber-400',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white',
          pulseColor: 'bg-amber-500',
        };
      case 'opportunity':
      default:
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/60 text-emerald-50',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          iconColor: 'text-emerald-400',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          pulseColor: 'bg-emerald-500',
        };
    }
  };

  const currentTheme = radarAlert
    ? getSeverityTheme(radarAlert.severity)
    : getSeverityTheme('opportunity');

  const handleActionClick = () => {
    if (!radarAlert || !onNavigateToTab) return;
    const type = radarAlert.type;
    if (type === 'debt_limit_exceeded') {
      onNavigateToTab('customers');
    } else if (type === 'dead_stock_liquidity') {
      onNavigateToTab('inventory');
    } else if (type === 'critical_liquidity_ratio') {
      onNavigateToTab('suppliers');
    } else if (type === 'cash_discrepancy') {
      onNavigateToTab('cash_drawer');
    } else {
      onNavigateToTab('daily_ledger');
    }
  };

  // 1. COMPACT NOTIFICATION STRIP FOR CHAT VIEW (Doesn't block or cover screen)
  if (!isStandaloneView) {
    if (isScanning) {
      return (
        <div className="bg-slate-900 border-b border-slate-700/80 px-3 py-1.5 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>جاري مسح الرادار المالي الاستباقي...</span>
          </div>
          {onDismissAlert && (
            <button
              onClick={onDismissAlert}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              title="إخفاء"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      );
    }

    if (!radarAlert) {
      return null; // Don't show anything in chat if there's no active alert
    }

    return (
      <div className={`border-b px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs flex items-center justify-between gap-2 shrink-0 transition-all ${currentTheme.bg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.pulseColor}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentTheme.pulseColor}`}></span>
          </span>
          <Radio className={`w-3.5 h-3.5 shrink-0 ${currentTheme.iconColor}`} />
          <span className="font-bold truncate text-[11px] sm:text-xs">
            {radarAlert.title}
          </span>
          {radarAlert.metricHighlight && (
            <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-amber-300 shrink-0">
              {radarAlert.metricHighlight}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenDedicatedTab && (
            <button
              type="button"
              onClick={onOpenDedicatedTab}
              className="px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white flex items-center gap-1 transition-colors cursor-pointer"
              title="فتح قسم الفحص المالي والإدارة الكامل"
            >
              <span>فتح الفحص الكامل</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}

          {onPlayVoice && (
            <button
              type="button"
              onClick={() => onPlayVoice(`${radarAlert.title}. التوصية: ${radarAlert.actionableRecommendation}`)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="سماع التنبيه صوتياً"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDismissAlert && (
            <button
              type="button"
              onClick={onDismissAlert}
              className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="إخفاء التنبيه من شاشة المحادثة"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. STANDALONE FULL SECTION VIEW (قسم الفحص المالي والإدارة المستقل)
  return (
    <div className="bg-slate-900 text-white min-h-full p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
      {/* Section Title & Header */}
      <div className="bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                قسم الفحص المالي والإدارة (Autonomous CFO Radar)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                مراقبة استباقية حية
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تدقيق ومراقبة مؤشرات السيولة، حركة المخزن، ديون العملاء، وحماية رأس المال للمحل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onRescan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="إعادة الفحص المالي الفوري لبيانات المحل"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'جاري الفحص...' : 'إعادة الفحص المالي'}</span>
          </button>
        </div>
      </div>

      {/* Radar Alert Card or Green Safe Notice */}
      {isScanning ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-8 text-center text-slate-300">
          <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto mb-2" />
          <div className="font-bold text-sm">جاري تشغيل خوارزميات التدقيق المالي وفحص مؤشرات المتجر...</div>
        </div>
      ) : radarAlert ? (
        <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-inner ${currentTheme.bg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.pulseColor}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${currentTheme.pulseColor}`}></span>
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base">
                <Radio className={`w-4 h-4 ${currentTheme.iconColor}`} />
                <span>تنبيه الرادار المالي العاجل</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentTheme.badgeBg}`}>
                {radarAlert.severity === 'critical'
                  ? '🔴 خطر سيولة عاجل'
                  : radarAlert.severity === 'warning'
                  ? '⚠️ تنبيه تدقيقي'
                  : '🟢 فرصة مالية'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onPlayVoice && (
                <button
                  type="button"
                  onClick={() =>
                    onPlayVoice(
                      `${radarAlert.title}. التحليل: ${radarAlert.insight}. التوصية: ${radarAlert.actionableRecommendation}`
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="استماع صوتي للتقرير"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>استماع صوتي</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-extrabold text-base sm:text-lg text-white leading-snug">
                {radarAlert.title}
              </h4>
              {radarAlert.metricHighlight && (
                <span className="self-start sm:self-auto text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 text-amber-300">
                  {radarAlert.metricHighlight}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium bg-black/20 p-3 rounded-xl border border-white/5">
              {radarAlert.insight}
            </p>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/15 text-xs sm:text-sm flex items-start gap-2.5">
              <span className="font-bold text-amber-300 shrink-0">💡 التوصية التنفيذية:</span>
              <span className="text-slate-100 leading-relaxed">{radarAlert.actionableRecommendation}</span>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleActionClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${currentTheme.btnBg}`}
              >
                <span>{radarAlert.actionButtonLabel}</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>المحل: {cfoContext.storeId} ({cfoContext.userRole})</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5 text-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base text-emerald-300">الوضع المالي سليم ومستقر</div>
            <div className="text-xs text-emerald-200/80 mt-0.5">
              لا توجد مخاطر ديون متجاوزة أو ركود بضاعة حالياً. السيولة كافية والعمليات تسير بشكل متزن.
            </div>
          </div>
        </div>
      )}

      {/* Complete Financial Ratios Dashboard (المؤشرات والنسب المالية الشاملة) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>لوحة المؤشرات والنسب المالية الدقيقة</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            الكاش السائل: {cfoContext.totalLiquidCash.toLocaleString()} ر.ي
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Quick Ratio */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>نسبة السيولة السريعة (Quick Ratio)</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              {ratios.quickRatio}x
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              كاش سائل: <span className="text-slate-200 font-bold">{ratios.totalQuickAssets.toLocaleString()} ر.ي</span> مقابل ديون الموردين: <span className="text-slate-200 font-bold">{ratios.totalCurrentLiabilities.toLocaleString()} ر.ي</span>
            </div>
            <div className="pt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                ratios.quickRatioStatus === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : ratios.quickRatioStatus === 'caution'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {ratios.quickRatioStatus === 'healthy' ? '✅ سيولة ممتازة' : ratios.quickRatioStatus === 'caution' ? '⚠️ سيولة متوسطة' : '🔴 سيولة منخفضة'}
              </span>
            </div>
          </div>

          {/* Receivables Turnover */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>دوران الذمم والديون (Receivables)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              {ratios.receivablesTurnover} دورة/شهر
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              متوسط فترة التحصيل: <span className="text-slate-200 font-bold">{ratios.averageCollectionDays} يوم</span> (إجمالي ديون الزبائن المعلقة: <span className="text-slate-200 font-bold">{ratios.totalReceivables.toLocaleString()} ر.ي</span>)
            </div>
            <div className="pt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                معدل تحصيل طبيعي
              </span>
            </div>
          </div>

          {/* Margin of Safety */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>هامش الأمان المالي (Safety Margin)</span>
              <Percent className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              {ratios.marginOfSafetyPercentage}%
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              حماية الأرباح الصافية فوق نقطة تغطية المصاريف التشغيلية للمحل
            </div>
            <div className="pt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                حماية تشغيلية جيدة
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Section Access Shortcuts */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-300 font-bold">الانتقال السريع للأقسام المرتبطة:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateToTab?.('customers')}
            className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
          >
            سجل ديون العملاء
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('inventory')}
            className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
          >
            جرد المخزن والأصناف الراكدة
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('suppliers')}
            className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
          >
            حسابات الموردين
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('cash_drawer')}
            className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
          >
            صندوق وكاش الدرج
          </button>
        </div>
      </div>
    </div>
  );
};

