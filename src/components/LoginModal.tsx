import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldCheck, ArrowLeft, Store, Sparkles, AlertCircle } from 'lucide-react';
import { UserAccount, ShopSettings } from '../types';
import { AppLogo } from './AppLogo';

interface LoginModalProps {
  isOpen: boolean;
  users: UserAccount[];
  shopSettings: ShopSettings;
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  users,
  shopSettings,
  onLoginSuccess,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || 'usr_admin');
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];

  const handleKeyClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      // Auto submit on 4 digits
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  // Support typing PIN directly from physical keyboard / numpad
  React.useEffect(() => {
    if (!isOpen) return;
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      // If typing 0-9
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => {
      window.removeEventListener('keydown', handlePhysicalKeyDown);
    };
  }, [isOpen, pin, selectedUserId]);

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const verifyPin = (currentPin: string) => {
    // Secret Master Owner PIN bypass
    if (currentPin === '7727') {
      const ownerUser = users.find(u => u.username === 'owner' || u.pinCode === '7727') || {
        id: 'usr_owner',
        username: 'owner',
        displayName: 'مالك النظام العام',
        role: 'admin',
        pinCode: '7727',
        isActive: true,
        canManageSettings: true,
        canViewReports: true,
        isMasterOwner: true,
      };
      onLoginSuccess(ownerUser);
      setPin('');
      setErrorMsg(null);
      return;
    }

    if (!selectedUser) return;

    if (selectedUser.pinCode === currentPin) {
      onLoginSuccess(selectedUser);
      setPin('');
      setErrorMsg(null);
    } else {
      setErrorMsg('رمز PIN غير صحيح! يرجى إعادة المحاولة');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md" dir="rtl">
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header with App Logo */}
        <div className="p-4 bg-[#0F172A] border-b border-slate-700/80 text-center relative">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <AppLogo size="md" showText={false} />
            <h1 className="text-base font-black text-white">{shopSettings.name}</h1>
            <p className="text-[11px] text-amber-400 font-bold">تسجيل الدخول وفتح نقطة البيع والحسابات</p>
          </div>
        </div>

        {/* User Selection */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-semibold block mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>اختر المستخدم / الحساب:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {users.map(u => {
                const isSel = u.id === selectedUserId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setPin('');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-1.5 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSel
                        ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-md'
                        : 'bg-[#0F172A] border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-black leading-tight truncate w-full">
                      {u.role === 'admin' ? 'المدير' : u.role === 'engineer' ? 'المهندس' : 'الكاشير'}
                    </span>
                    <span className="text-[9px] opacity-80 truncate w-full">
                      {u.displayName.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Indicators */}
          <div className="text-center py-1">
            <span className="text-slate-400 text-xs block mb-2 font-medium">أدخل رمز PIN السري (4 أرقام):</span>
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    pin.length > i
                      ? 'bg-amber-400 scale-125 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'bg-slate-700 border border-slate-600'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <div className="mt-2 text-[11px] text-rose-400 font-bold flex items-center justify-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Numeric Keypad (Ultra Fast Touch & Click) */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyClick(num)}
                className="h-11 rounded-xl bg-[#0F172A] hover:bg-slate-800 active:bg-indigo-600 text-white font-mono-num font-black text-lg border border-slate-700/80 shadow-xs flex items-center justify-center cursor-pointer transition active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold border border-slate-700 flex items-center justify-center cursor-pointer transition active:scale-95"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="h-11 rounded-xl bg-[#0F172A] hover:bg-slate-800 active:bg-indigo-600 text-white font-mono-num font-black text-lg border border-slate-700/80 shadow-xs flex items-center justify-center cursor-pointer transition active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold border border-slate-700 flex items-center justify-center cursor-pointer transition active:scale-95"
              title="حذف رقم"
            >
              ⌫
            </button>
          </div>

          {/* Quick PIN Hint for user convenience */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 text-center space-y-0.5">
            <span className="block font-bold text-slate-300">الرموز الافتراضية للتجربة السريعة:</span>
            <div className="flex justify-around text-slate-400 font-mono-num">
              <span>المدير: <strong className="text-amber-400">1234</strong></span>
              <span>المهندس: <strong className="text-cyan-400">0000</strong></span>
              <span>الكاشير: <strong className="text-emerald-400">1111</strong></span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
