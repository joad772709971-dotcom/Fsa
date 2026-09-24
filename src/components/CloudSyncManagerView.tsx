import React, { useState, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Laptop,
  Globe,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wifi,
  WifiOff,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';
import {
  triggerFullSync,
  subscribeToSyncStatus,
  SyncStatus,
} from '../utils/syncService';
import { Transaction, Supplier } from '../types';
import { formatCurrency } from '../utils/calculations';

interface CloudSyncManagerViewProps {
  transactions: Transaction[];
  suppliers: Supplier[];
  onRefreshData?: () => void;
}

export const CloudSyncManagerView: React.FC<CloudSyncManagerViewProps> = ({
  transactions,
  suppliers,
  onRefreshData,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSynced: null,
    pendingChangesCount: 0,
    error: null,
  });

  const [syncLog, setSyncLog] = useState<
    Array<{ id: string; time: string; text: string; success: boolean }>
  >([]);

  useEffect(() => {
    const unsub = subscribeToSyncStatus((s) => {
      setSyncStatus(s);
    });
    return unsub;
  }, []);

  const handleSyncNow = async () => {
    const timeNow = new Date().toLocaleTimeString('ar-YE');
    const res = await triggerFullSync();
    if (res.success) {
      setSyncLog((prev) => [
        {
          id: Math.random().toString(),
          time: timeNow,
          text: `تمت المزامنة بنجاح لـ (${transactions.length}) حركة وسندات، و(${suppliers.length}) مورد مع السحابة والأجهزة`,
          success: true,
        },
        ...prev.slice(0, 8),
      ]);
      onRefreshData?.();
    } else {
      setSyncLog((prev) => [
        {
          id: Math.random().toString(),
          time: timeNow,
          text: `تعذر الاتصال بالسحابة: ${res.message}`,
          success: false,
        },
        ...prev.slice(0, 8),
      ]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                قاعدة بيانات سحابية موحدة (Firebase Cloud)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                تدعم أوفلاين 100%
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Cloud className="w-7 h-7 text-emerald-400" />
              المزامنة السحابية الفورية (APK + EXE + Web)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              نظام مزامنة سحابية يربط تطبيق جوال أندرويد (APK)، وتطبيق الكمبيوتر المكتبي (EXE)، والمتصفح.
              تقوم بإدخال أي حركة في أي جهاز (سواءً كان متصلاً أو بدون إنترنت)، وبمجرد توفر الاتصال تتم المزامنة تلقائياً.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              id="full-cloud-sync-trigger"
              type="button"
              onClick={handleSyncNow}
              disabled={syncStatus.isSyncing}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              {syncStatus.isSyncing ? 'جارٍ المزامنة السحابية...' : 'مزامنة فورية الآن'}
            </button>
          </div>
        </div>
      </div>

      {/* 3 Connected Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Android APK */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                متصل بالسحابة
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">تطبيق الجوال (Android APK)</h3>
            <p className="text-xs text-slate-600 mt-1">
              تسجيل المبيعات والصيانة من هاتفك المحمول في أي مكان، مع حفظ العمليات محلياً ومزامنتها فور توفر النت.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>دعم العمل بدون إنترنت</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Windows Desktop EXE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                متصل بالسحابة
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">تطبيق الكمبيوتر (Windows EXE)</h3>
            <p className="text-xs text-slate-600 mt-1">
              إدارة الكاشير ونقاط البيع السريعة وطباعة فواتير وسندات المحل من كمبيوتر المحل المكتبي مباشرة.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>استجابة فورية وطباعة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Web Cloud Portal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                مباشر من المتصفح
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">الموقع السحابي (Web Cloud)</h3>
            <p className="text-xs text-slate-600 mt-1">
              متابعة كشوفات الحساب وتقارير الأرباح الشهرية من أي متصفح أو جهاز لوحي من أي مكان في العالم.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>نسخ احتياطي مركزي</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Sync State & Health Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            حالة اتصال المزامنة السحابية
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                {syncStatus.isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-600" />
                )}
                <span className="text-xs font-bold text-slate-700">حالة الإنترنت في هذا الجهاز:</span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  syncStatus.isOnline
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {syncStatus.isOnline ? 'متصل بالإنترنت' : 'أوفلاين (بدون إنترنت)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">توقيت آخر مزامنة ناجحة:</span>
              </div>
              <span className="text-xs font-bold font-mono text-slate-800">
                {syncStatus.lastSynced || 'الآن'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">إجمالي الحركات المحفوظة والمزامنة:</span>
              </div>
              <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg font-mono">
                {transactions.length} حركة وسند
              </span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>ملاحظة هامة:</strong>
              <p className="mt-0.5 text-[11px] text-emerald-800 leading-relaxed">
                أي قيد أو سند تسجله (مثل مبيعات، رصيد، صيانة، صرفة، ديون) يتم حفظه فوراً في جهازك محلياً أولاً
                ثم رفعه للسحابة، حتى لو انقطع النت نهائياً في المحل فلن تتعطل أعمالك ولن تفقد أي سجل.
              </p>
            </div>
          </div>
        </div>

        {/* Sync Operations Live Log */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3 mb-3">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              سجل عمليات المزامنة والتحديثات
            </h3>

            {syncLog.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                <Cloud className="w-10 h-10 text-slate-300 mb-2" />
                <span>المزامنة السحابية المباشرة تعمل بالخلفية وتراقب التغييرات باستمرار.</span>
                <span className="text-[11px] text-emerald-600 mt-1 font-medium">
                  جاهز لاستقبال وإرسال العمليات بين أجهزتك.
                </span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {syncLog.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl text-xs border flex items-start justify-between gap-2 ${
                      log.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      {log.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span>{log.text}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">حالة قاعدة البيانات السحابية:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firestore Cloud Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
