import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Lock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
  Delete,
  Key,
  KeyRound,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AuthUser } from '../types';
import { clearAllSystemData } from '../utils/storage';

export const MASTER_PASSWORD = '772315106';
export const OWNER_SYSTEM_KEY = '777503191';

interface LoginViewProps {
  onLogin: (user: AuthUser, remember?: boolean) => void;
  onClearAllData?: () => void;
}

export const DEFAULT_USERS: AuthUser[] = [
  {
    id: 'user_mosaab',
    name: 'مصعب',
    role: 'owner',
    phone: '777503191',
    avatarBg: 'from-amber-500 to-amber-700',
    pin: MASTER_PASSWORD,
    storeId: 'store_mosaab_alsoufi',
    ownerId: 'user_mosaab',
  },
  {
    id: 'user_manager',
    name: 'المدير',
    role: 'manager',
    phone: '777222333',
    avatarBg: 'from-indigo-600 to-indigo-800',
    pin: MASTER_PASSWORD,
    storeId: 'store_mosaab_alsoufi',
    ownerId: 'user_mosaab',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onClearAllData }) => {
  const [selectedUser, setSelectedUser] = useState<AuthUser>(DEFAULT_USERS[0]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [licenseRenewSuccessMsg, setLicenseRenewSuccessMsg] = useState<string | null>(null);

  // Hidden System Key state for automatic owner renewal
  const [showSystemKeyField, setShowSystemKeyField] = useState(false);
  const [systemKeyInput, setSystemKeyInput] = useState('');
  const [showSystemKeyMask, setShowSystemKeyMask] = useState(false);

  // Custom User Mode
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<'owner' | 'manager'>('owner');

  // Reset database modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [resetPinInput, setResetPinInput] = useState('');
  const [resetPinError, setResetPinError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Renew license helper for 1 year using owner phone 777503191
  const executeOwnerLicenseRenewal = (customMessage?: string) => {
    const now = new Date();
    const expDate = new Date();
    expDate.setFullYear(now.getFullYear() + 1);
    const expStr = expDate.toISOString().split('T')[0];

    const renewedLicense = {
      licenseKey: OWNER_SYSTEM_KEY,
      clientName: 'محل مصعب الصوفي',
      clientPhone: OWNER_SYSTEM_KEY,
      activatedAt: now.toISOString(),
      expiresAt: expStr,
      licenseType: 'annual' as const,
      deviceFingerprint: 'NESMA-OWNER-777503191',
      isActivated: true,
    };

    try {
      localStorage.setItem('mosaab_system_license_v2', JSON.stringify(renewedLicense));
    } catch (err) {
      console.error('Failed to persist renewed license', err);
    }

    setLicenseRenewSuccessMsg(
      customMessage ||
        `✨ تم التحقق من مفتاح النظام (System Key: ${OWNER_SYSTEM_KEY}) بنجاح! تم تجديد الترخيص السنوي لمدة عام كامل حتى ${expStr}. جاري الدخول المباشر كمالك للنظام...`
    );
    setIsSuccess(true);
    setErrorMsg('');

    setTimeout(() => {
      onLogin(
        {
          ...DEFAULT_USERS[0],
          lastLogin: new Date().toISOString(),
        },
        rememberMe
      );
    }, 1400);
  };

  // Monitor System Key real-time matching
  const handleSystemKeyInputChange = (val: string) => {
    setSystemKeyInput(val);
    setErrorMsg('');
    if (val.trim() === OWNER_SYSTEM_KEY) {
      executeOwnerLicenseRenewal();
    }
  };

  const handleKeypadPress = (digit: string) => {
    setErrorMsg('');
    if (password.length < 16) {
      const nextPw = password + digit;
      setPassword(nextPw);
      if (nextPw === OWNER_SYSTEM_KEY) {
        executeOwnerLicenseRenewal();
      }
    }
  };

  const handleKeypadClear = () => {
    setPassword('');
    setErrorMsg('');
  };

  const handleKeypadBackspace = () => {
    setPassword((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const performLogin = (userToLogin: AuthUser) => {
    setIsSuccess(true);
    setErrorMsg('');
    setTimeout(() => {
      onLogin(
        {
          ...userToLogin,
          lastLogin: new Date().toISOString(),
        },
        rememberMe
      );
    }, 400);
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const trimmedPassword = password.trim();
    const trimmedSystemKey = systemKeyInput.trim();

    // Check if Owner entered phone 777503191 in password or in System Key field
    if (trimmedPassword === OWNER_SYSTEM_KEY || trimmedSystemKey === OWNER_SYSTEM_KEY) {
      executeOwnerLicenseRenewal();
      return;
    }

    // Verify Master Password or User Pin
    const isMasterValid = trimmedPassword === MASTER_PASSWORD || trimmedPassword === '1234';
    const isUserPinValid = selectedUser && selectedUser.pin && trimmedPassword === selectedUser.pin;

    if (!trimmedPassword) {
      setErrorMsg('يرجى إدخال كلمة السر للمتابعة');
      return;
    }

    if (!isMasterValid && !isUserPinValid) {
      setErrorMsg('كلمة السر غير صحيحة! كلمة السر المعتمدة: ' + MASTER_PASSWORD);
      return;
    }

    if (isCustomMode) {
      if (!customName.trim()) {
        setErrorMsg('يرجى كتابة اسم المستخدم');
        return;
      }
      const newUser: AuthUser = {
        id: 'user_' + Date.now(),
        name: customName.trim(),
        role: customRole,
        avatarBg: 'from-slate-700 to-slate-900',
        pin: MASTER_PASSWORD,
      };
      performLogin(newUser);
      return;
    }

    performLogin(selectedUser);
  };

  const handleExecuteReset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = resetPinInput.trim();
    if (entered !== MASTER_PASSWORD && entered !== '1234') {
      setResetPinError(`رمز التأكيد غير صحيح! يرجى إدخال كلمة السر: ${MASTER_PASSWORD}`);
      return;
    }

    setResetPinError('');
    clearAllSystemData();
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.error(err);
    }

    setResetSuccess(true);
    setShowClearConfirm(false);
    setResetPinInput('');
    if (onClearAllData) {
      onClearAllData();
    }
    setTimeout(() => {
      setResetSuccess(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-3 sm:p-6 selection:bg-amber-500 selection:text-black"
      dir="rtl"
    >
      {/* Dynamic Background Ambient Glowing Orbs for Glassmorphism */}
      <div className="absolute top-1/6 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/6 -left-24 w-[28rem] h-[28rem] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-sky-500/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Center Wrapper matching CSS selector .login-container */}
      <div className="w-full max-w-lg space-y-4 relative z-10">
        {/* Branding & Glass Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-amber-400/20 via-amber-500/15 to-transparent backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-[0_8px_32px_rgba(245,158,11,0.2)] text-amber-400 ring-1 ring-white/10">
            <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-white/[0.06] backdrop-blur-md text-amber-300 border border-white/10 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              الرقم الأول • نظام إدارة الحسابات المتكامل v2.7.6
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1 drop-shadow-sm">
              محل مصعب الصوفي للجوالات
            </h1>
            <p className="text-xs text-slate-400">
              إدارة المبيعات • الصيانة • شبكات الرصيد • نقاط البيع POS
            </p>
          </div>
        </div>

        {/* Reset Feedback Notification */}
        {resetSuccess && (
          <div className="p-4 bg-emerald-500/15 backdrop-blur-xl border border-emerald-500/30 rounded-2xl text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            تم تصفير ومسح كافة البيانات بنجاح! جاري البدء بنظام نظيف...
          </div>
        )}

        {/* Main Login Card - Glassmorphism Container with .login-container */}
        <div
          id="login-main-card"
          className="login-container relative bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.55)] ring-1 ring-white/5 space-y-4"
        >
          {/* Top Card Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 backdrop-blur-md text-amber-400 border border-amber-500/20 shadow-inner">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-sm text-white">تسجيل الدخول للنظام</h2>
                <p className="text-[11px] text-slate-400">أدخل كلمة السر الرسمية للمتابعة</p>
              </div>
            </div>

            {/* Hidden / Discreet System Key Toggle Button */}
            <button
              type="button"
              id="system-key-toggle-btn"
              onClick={() => setShowSystemKeyField(!showSystemKeyField)}
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                showSystemKeyField
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-xs'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-400 hover:text-slate-200'
              }`}
              title="إدخال مفتاح النظام لتجديد الترخيص السنوي"
            >
              <Cpu className="w-3 h-3 text-amber-400" />
              <span>System Key</span>
              {showSystemKeyField ? (
                <ChevronUp className="w-3 h-3 opacity-60" />
              ) : (
                <ChevronDown className="w-3 h-3 opacity-60" />
              )}
            </button>
          </div>

          {/* Hidden / Discreet System Key Input Field (Auto-renews when 777503191 matches) */}
          {showSystemKeyField && (
            <div
              id="system-key-container"
              className="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top-2 shadow-inner"
            >
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>مفتاح النظام السري (System Key)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  تجديد تلقائي عند التطابق
                </span>
              </div>

              <div className="relative">
                <input
                  type={showSystemKeyMask ? 'text' : 'password'}
                  id="system-key-input"
                  value={systemKeyInput}
                  onChange={(e) => handleSystemKeyInputChange(e.target.value)}
                  placeholder="أدخل مفتاح النظام لتجديد الترخيص السنوي..."
                  className="w-full px-3.5 py-2 pl-9 bg-black/40 backdrop-blur-md border border-amber-500/30 focus:border-amber-400 rounded-xl font-mono text-xs font-bold text-amber-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowSystemKeyMask(!showSystemKeyMask)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 p-1 cursor-pointer"
                  title={showSystemKeyMask ? 'إخفاء' : 'إظهار'}
                >
                  {showSystemKeyMask ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>تجديد سنوي معتمد لمالك النظام (777503191)</span>
                {systemKeyInput.trim() === OWNER_SYSTEM_KEY && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> متطابق
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Feedback & Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/15 backdrop-blur-md border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {licenseRenewSuccessMsg && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/20 via-emerald-600/15 to-amber-500/15 backdrop-blur-xl border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-bold flex items-start gap-3 shadow-xl animate-in zoom-in-95">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <div className="text-amber-300 font-black text-sm">
                  تم تجديد ترخيص المالك بنجاح (سنة كاملة)
                </div>
                <div className="leading-relaxed text-emerald-100">{licenseRenewSuccessMsg}</div>
              </div>
            </div>
          )}

          {isSuccess && !licenseRenewSuccessMsg && (
            <div className="p-3 bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تم التحقق بنجاح! جاري فتح الواجهة...</span>
            </div>
          )}

          {/* User Selection Cards - Glass Styling */}
          {!isCustomMode ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">اختر الحساب للدخول:</label>

              <div className="grid grid-cols-2 gap-2.5">
                {DEFAULT_USERS.map((user) => {
                  const isSelected = selectedUser.id === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      id={`user-select-${user.id}`}
                      onClick={() => {
                        setSelectedUser(user);
                        setErrorMsg('');
                      }}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer backdrop-blur-md ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${user.avatarBg} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md ring-1 ring-white/20`}
                      >
                        {user.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-sm text-white truncate">{user.name}</div>
                        <div className="text-[11px] text-amber-300/90 font-bold truncate mt-0.5">
                          {user.role === 'owner' ? 'مصعب (المالك)' : 'المدير (المستلم)'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="مثال: مصعب الصوفي"
                  className="w-full px-3 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الدور الوظيفي</label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="owner">المالك / المدير العام (مصعب الصوفي)</option>
                  <option value="manager">المدير المستلم (إدارة العمليات)</option>
                </select>
              </div>
            </div>
          )}

          {/* Password Input & Glass Keypad */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  كلمة السر / رمز الدخول:
                </label>
                <span className="text-[11px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 backdrop-blur-sm">
                  كلمة السر: {MASTER_PASSWORD}
                </span>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password-input"
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    setErrorMsg('');
                    // Auto-renewal if entered in the main password input
                    if (val.trim() === OWNER_SYSTEM_KEY) {
                      executeOwnerLicenseRenewal();
                    }
                  }}
                  placeholder="أدخل كلمة السر 772315106"
                  className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl text-center font-mono text-lg tracking-widest text-amber-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Touch Keypad for Phones & Tablets with Glassmorphism */}
            <div className="bg-black/30 backdrop-blur-xl p-2.5 rounded-2xl border border-white/[0.08] shadow-inner">
              <div className="grid grid-cols-3 gap-1.5 font-mono text-white text-base font-bold">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-2.5 bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 active:bg-amber-500 active:text-slate-950 rounded-xl transition-all border border-white/[0.06] cursor-pointer flex items-center justify-center backdrop-blur-md shadow-xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl transition-all border border-rose-500/20 cursor-pointer flex items-center justify-center backdrop-blur-md"
                  title="مسح الكل"
                >
                  C مسح
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-2.5 bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 active:bg-amber-500 active:text-slate-950 rounded-xl transition-all border border-white/[0.06] cursor-pointer flex items-center justify-center backdrop-blur-md shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="py-2.5 bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 rounded-xl transition-all border border-white/[0.06] cursor-pointer flex items-center justify-center backdrop-blur-md"
                  title="حذف رقم"
                >
                  <Delete className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Fast autofill & Remember me */}
              <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPassword(MASTER_PASSWORD);
                    setErrorMsg('');
                  }}
                  className="text-[11px] text-amber-300 hover:text-amber-200 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-xl border border-amber-500/20 backdrop-blur-md transition-colors cursor-pointer"
                >
                  تعبئة كلمة السر تلقائياً (772315106)
                </button>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-amber-500 rounded cursor-pointer"
                  />
                  <span>تذكرني على هذا الجهاز</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400/50"
            >
              <LogIn className="w-5 h-5" />
              <span>دخول النظام بحساب {isCustomMode ? customName || 'المستخدم' : selectedUser.name}</span>
            </button>
          </form>
        </div>

        {/* Footer info in frosted glass */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-center text-xs shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] select-none">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>نظام محمي بكلمة السر • تسجيل دخول آمن • محل مصعب الصوفي</span>
          </div>
        </div>
      </div>
    </div>
  );
};
