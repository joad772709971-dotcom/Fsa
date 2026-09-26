import React, { useState } from 'react';
import { Shield, Key, CheckCircle, Clock, X, AlertTriangle, Smartphone } from 'lucide-react';
import { SystemLicense, ShopSettings } from '../types';
import { validateLicenseKey, getDeviceFingerprint } from '../utils/license';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLicense: SystemLicense | null;
  shopSettings: ShopSettings;
  onActivateLicense: (license: SystemLicense) => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  currentLicense,
  shopSettings,
  onActivateLicense,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [clientNameInput, setClientNameInput] = useState(shopSettings.name);
  const [clientPhoneInput, setClientPhoneInput] = useState(shopSettings.engineerPhone);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const deviceFingerprint = getDeviceFingerprint();

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);
    setActivationSuccess(null);

    const validation = validateLicenseKey(keyInput, clientNameInput, clientPhoneInput);
    if (!validation.isValid) {
      setActivationError(validation.message);
      return;
    }

    const newLicense: SystemLicense = {
      licenseKey: keyInput.trim().toUpperCase(),
      clientName: clientNameInput.trim(),
      clientPhone: clientPhoneInput.trim(),
      activatedAt: new Date().toISOString(),
      expiresAt: validation.expiresAt || 'LIFETIME',
      licenseType: validation.licenseType || 'annual',
      deviceFingerprint,
      isActivated: true,
    };

    onActivateLicense(newLicense);
    setActivationSuccess(validation.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-[#1E293B] border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-[#0F172A] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">ترخيص وتفعيل النظام</h2>
              <p className="text-[11px] text-slate-400">تفعيل كود الترخيص للاستخدام المستمر دون انقطاع</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Current Status Box */}
          <div className="bg-[#0F172A] p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">حالة التفعيل الحالية:</span>
              {currentLicense?.isActivated ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مفعل ({currentLicense.licenseType === 'lifetime' ? 'مدى الحياة' : currentLicense.licenseType === 'two_years' ? 'سنتين' : 'سنة'})</span>
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>نسخة تجريبية</span>
                </span>
              )}
            </div>

            {currentLicense && (
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                <p>المرخص له: <strong className="text-white">{currentLicense.clientName}</strong></p>
                <p>تاريخ الانتهاء: <strong className="text-amber-400 font-mono-num">{currentLicense.expiresAt}</strong></p>
                <p className="font-mono-num text-[10px] text-slate-500 truncate">كود الترخيص: {currentLicense.licenseKey}</p>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleActivate} className="space-y-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1">اسم المحل المرخص له:</label>
              <input
                type="text"
                required
                value={clientNameInput}
                onChange={e => setClientNameInput(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                placeholder="اسم المحل"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">رقم الهاتف المرتبط بالترخيص:</label>
              <input
                type="text"
                required
                value={clientPhoneInput}
                onChange={e => setClientPhoneInput(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:outline-none focus:border-indigo-500"
                placeholder="77XXXXXXX"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">مفتاح التفعيل (License Key):</label>
              <input
                type="text"
                required
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono-num font-bold tracking-wider uppercase focus:outline-none focus:border-amber-500 text-center"
                placeholder="NESMA-LFT-9999-XXXX-YYYY"
              />
            </div>

            {activationError && (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 font-bold text-center">
                {activationError}
              </div>
            )}

            {activationSuccess && (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-center">
                {activationSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>تفعيل وحفظ الترخيص</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
