import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Camera,
  Mic,
  Bell,
  HardDrive,
  Bluetooth,
  CheckCircle2,
  AlertTriangle,
  X,
  Smartphone,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  checkAllPermissions,
  requestCameraPermission,
  requestMicrophonePermission,
  requestNotificationPermission,
  requestEssentialAppPermissions,
} from '../utils/voiceAndPermissions';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose }) => {
  const [cameraStatus, setCameraStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('prompt');
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('prompt');
  const [notifStatus, setNotifStatus] = useState<string>('default');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isRequestingAll, setIsRequestingAll] = useState(false);

  const refreshPermissions = async () => {
    try {
      const perms = await checkAllPermissions();
      setMicStatus(perms.microphone === 'granted' ? 'granted' : perms.microphone === 'denied' ? 'denied' : 'prompt');
      setCameraStatus(perms.camera === 'granted' ? 'granted' : perms.camera === 'denied' ? 'denied' : 'prompt');
      setNotifStatus(perms.notifications);
    } catch (err) {
      console.log('Permission check err:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshPermissions();
    }
  }, [isOpen]);

  const handleRequestCamera = async () => {
    setCameraStatus('checking');
    const granted = await requestCameraPermission();
    setCameraStatus(granted ? 'granted' : 'denied');
    setTestResult(
      granted
        ? '✓ تم تفعيل إذن الكاميرا بنجاح! يعمل ماسح الباركود الآن بسرعة ودقة.'
        : '⚠️ لم يتم تفعيل إذن الكاميرا. يرجى الضغط على "السماح" من إعدادات المتصفح أو التطبيق.'
    );
  };

  const handleRequestMic = async () => {
    setMicStatus('checking');
    const granted = await requestMicrophonePermission();
    setMicStatus(granted ? 'granted' : 'denied');
    setTestResult(
      granted
        ? '✓ تم تفعيل إذن الميكروفون بنجاح! المحاسب الصوتي الذكي جاهز للتحدث والاستماع.'
        : '⚠️ لم يتم تفعيل إذن الميكروفون. يرجى الضغط على "السماح" من شريط المتصفح أو التطبيق.'
    );
  };

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? 'granted' : 'denied');
    setTestResult(
      granted
        ? '✓ تم تفعيل إذن الإشعارات بنجاح لتنبيهات المخزون ومتابعة الصيانة.'
        : '⚠️ لم يتم تفعيل الإشعارات.'
    );
  };

  const handleGrantAll = async () => {
    setIsRequestingAll(true);
    setTestResult('جاري طلب وتفعيل الأذونات تباعاً...');
    const res = await requestEssentialAppPermissions();
    setMicStatus(res.microphone ? 'granted' : 'denied');
    setCameraStatus(res.camera ? 'granted' : 'denied');
    setNotifStatus(res.notifications ? 'granted' : 'denied');
    setIsRequestingAll(false);
    setTestResult('✓ تم فحص وطلب كافة أذونات النظام الرئيسية!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">أذونات وتصاريح تطبيق الرقم الأول (Permissions)</h3>
              <p className="text-[11px] text-slate-400">إدارة صلاحيات الكاميرا، الميكروفون الصوتي، الإشعارات، وحفظ الملفات</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
          
          {/* Quick Grant All Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm">تفعيل كافة الصلاحيات بنقرة واحدة</h4>
                <p className="text-[11px] text-emerald-100/90">يضمن عمل المحاسب الصوتي، وماسح الباركود، وطباعة الفواتير بدون قيود</p>
              </div>
            </div>
            <button
              onClick={handleGrantAll}
              disabled={isRequestingAll}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm shrink-0 cursor-pointer"
            >
              {isRequestingAll ? 'جاري التفعيل...' : '⚡ تفعيل الكل الآن'}
            </button>
          </div>

          {/* Microphone Permission Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">إذن الميكروفون والتحدث الصوتي (Audio & Mic)</h4>
                <p className="text-slate-500 text-[11px] truncate sm:whitespace-normal">
                  ضروري للمحادثة الصوتية المباشرة مع المحاسب الذكي وإدخال اليوميات بالكلام
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                  micStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : micStatus === 'denied'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {micStatus === 'granted' ? 'مفعل ✓' : micStatus === 'denied' ? 'مرفوض ✕' : 'مطلوب'}
              </span>
              <button
                onClick={handleRequestMic}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold rounded-lg transition-colors text-[11px] cursor-pointer"
              >
                تفعيل
              </button>
            </div>
          </div>

          {/* Camera Permission Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">إذن الكاميرا (Camera Barcode Scanner)</h4>
                <p className="text-slate-500 text-[11px] truncate sm:whitespace-normal">
                  لقراءة ومسح باركود الأصناف وإضافتها فورياً لسلة المبيعات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                  cameraStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : cameraStatus === 'denied'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {cameraStatus === 'granted' ? 'مفعل ✓' : cameraStatus === 'denied' ? 'مرفوض ✕' : 'مطلوب'}
              </span>
              <button
                onClick={handleRequestCamera}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-lg transition-colors text-[11px] cursor-pointer"
              >
                تفعيل
              </button>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">إذن التنبيهات والإشعارات (Notifications)</h4>
                <p className="text-slate-500 text-[11px] truncate sm:whitespace-normal">
                  تنبيهات نواقص المخزون ومواعيد تسليم أجهزة الصيانة للزبائن
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                  notifStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : notifStatus === 'denied'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {notifStatus === 'granted' ? 'مفعل ✓' : notifStatus === 'denied' ? 'مرفوض ✕' : 'مطلوب'}
              </span>
              <button
                onClick={handleRequestNotif}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold rounded-lg transition-colors text-[11px] cursor-pointer"
              >
                تفعيل
              </button>
            </div>
          </div>

          {/* Android Manifest Permissions Overview */}
          <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/60 text-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>أذونات حزمة الأندرويد المحقونة تلقائياً (Android APK Manifest):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
              <div className="flex items-center gap-1.5">
                <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
                <span>طابعات البلوتوث والحراري (POS)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>حفظ ملفات Excel و PDF والنسخ الاحتياطي</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>تحديث البيانات السحابية (Internet)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>الاهتزاز اللمسي الصوتي (Vibration)</span>
              </div>
            </div>
          </div>

          {/* Test Result Feedback Box */}
          {testResult && (
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 font-bold text-[11px] animate-in fade-in duration-150">
              {testResult}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={refreshPermissions}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة فحص الأذونات</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            إغلاق ومتابعة العمل
          </button>
        </div>

      </div>
    </div>
  );
};

