import React, { useState } from 'react';
import { X, Store, User, Phone, MapPin, Sparkles, Check, RotateCcw } from 'lucide-react';
import { ShopSettings, DEFAULT_SHOP_SETTINGS } from '../types';
import { AppLogo } from './AppLogo';

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onSaveSettings: (newSettings: ShopSettings) => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetToDefault = () => {
    if (window.confirm('هل تريد استعادة الإعدادات الافتراضية للنظام؟')) {
      setFormData({ ...DEFAULT_SHOP_SETTINGS });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-[#1E293B] border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-[#0F172A] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo size="xs" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">إعدادات هوية المحل والمالك</h2>
              <p className="text-[11px] text-slate-400">تخصيص اسم المحل، المالك، الأرقام، وتفاصيل الفواتير</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          
          {/* Shop Name */}
          <div>
            <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>اسم المحل / النظام:</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
              placeholder="نسمة نمو لخدمات الجوالات"
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>اسم مالك المحل (الافتراضي: مصعب):</span>
            </label>
            <input
              type="text"
              required
              value={formData.ownerName}
              onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
              placeholder="مصعب"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              💡 تغيير اسم المالك سيقوم بتحديث حساب المالك، السحوبات الشخصية، وكشوفات الحسابات تلقائياً.
            </span>
          </div>

          {/* Tagline */}
          <div>
            <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>الوصف وشعار النشاط (الترويسة):</span>
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={e => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              placeholder="صيانة وبرمجة احترافية، بيع وبرمجة الجوالات، إكسسوارات وشرايح"
            />
          </div>

          {/* Phones Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>رقم هاتف المهندس:</span>
              </label>
              <input
                type="text"
                value={formData.engineerPhone}
                onChange={e => setFormData({ ...formData, engineerPhone: e.target.value })}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:outline-none focus:border-cyan-500"
                placeholder="772315106"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>رقم هاتف المحل:</span>
              </label>
              <input
                type="text"
                value={formData.shopPhone}
                onChange={e => setFormData({ ...formData, shopPhone: e.target.value })}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:outline-none focus:border-teal-500"
                placeholder="779040507"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>عنوان وموقع المحل:</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              placeholder="ذمار - الشارع العام"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 text-slate-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الافتراضي</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer text-xs"
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md transition cursor-pointer text-xs active:scale-95"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>تم الحفظ!</span>
                  </>
                ) : (
                  <span>حفظ التعديلات 💾</span>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
