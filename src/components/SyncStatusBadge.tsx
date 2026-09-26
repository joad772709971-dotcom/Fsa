import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { subscribeToSyncStatus, triggerFullSync, SyncStatus } from '../utils/syncService';

interface SyncStatusBadgeProps {
  onSyncComplete?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ onSyncComplete }) => {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSynced: null,
    pendingChangesCount: 0,
    error: null,
  });
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToSyncStatus((s) => {
      setStatus(s);
    });
    return unsub;
  }, []);

  const handleManualSync = async () => {
    if (status.isSyncing) return;
    const res = await triggerFullSync();
    if (res.success) {
      setShowToast('تمت المزامنة بنجاح مع السحابة والأجهزة');
      onSyncComplete?.();
    } else {
      setShowToast(`تعذر الاتصال: ${res.message}`);
    }
    setTimeout(() => setShowToast(null), 4000);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        id="cloud-sync-status-button"
        type="button"
        onClick={handleManualSync}
        disabled={status.isSyncing}
        title={
          status.isOnline
            ? `المزامنة السحابية نشطة (APK + EXE + Web) - آخر مزامنة: ${status.lastSynced || 'الآن'}`
            : 'أنت تعمل بدون إنترنت (Offline). سيتم حفظ العمليات محلياً ومزامنتها تلقائياً عند عودة النت.'
        }
        className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer shrink-0 ${
          status.isOnline
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
        }`}
      >
        {status.isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">جارٍ المزامنة السحابية...</span>
          </>
        ) : status.isOnline ? (
          <>
            <div className="relative flex items-center justify-center shrink-0">
              <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="font-semibold flex items-center gap-1">
                مزامنة سحابية نشطة
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              </span>
              <span className="text-[10px] text-emerald-600 opacity-90">
                {status.lastSynced ? `مُحدّث ${status.lastSynced}` : 'جاهز للمزامنة'}
              </span>
            </div>
          </>
        ) : (
          <>
            <CloudOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="font-semibold text-amber-900">أوفلاين (بدون نت)</span>
              <span className="text-[10px] text-amber-700">حفظ محلي آمن</span>
            </div>
          </>
        )}
      </button>

      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-10 left-0 sm:right-0 sm:left-auto mt-2 z-50 min-w-[240px] max-w-xs bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{showToast}</span>
        </div>
      )}
    </div>
  );
};
