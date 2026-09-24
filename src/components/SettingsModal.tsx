import React, { useState } from "react";
import {
  Settings,
  X,
  Building,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CompanyProfile } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSaveProfile: (profile: CompanyProfile) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetData,
}) => {
  const [name, setName] = useState(profile.name);
  const [taxNumber, setTaxNumber] = useState(profile.taxNumber);
  const [crNumber, setCrNumber] = useState(profile.crNumber || "");
  const [address, setAddress] = useState(profile.address);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email || "");
  const [currency, setCurrency] = useState(profile.currency);
  const [defaultVatRate, setDefaultVatRate] = useState(profile.defaultVatRate);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name,
      taxNumber,
      crNumber: crNumber.trim() || undefined,
      address,
      phone,
      email: email.trim() || undefined,
      currency,
      defaultVatRate: Number(defaultVatRate) || 15,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleExportBackup = () => {
    const data = {
      profile,
      exportDate: new Date().toISOString(),
      transactions: localStorage.getItem("smart_accountant_transactions_v1"),
      invoices: localStorage.getItem("smart_accountant_invoices_v1"),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `نسخة_المحاسب_الذكي_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">إعدادات المنشأة والضريبة</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ الإعدادات بنجاح.</span>
            </div>
          )}

          {/* Business Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1">
              بيانات المنشأة الرسمية:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم المنشأة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الرقم الضريبي (15 رقم) *</label>
                <input
                  type="text"
                  required
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="300XXXXXXXXXXX"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم السجل التجاري (CR)</label>
                <input
                  type="text"
                  value={crNumber}
                  onChange={(e) => setCrNumber(e.target.value)}
                  placeholder="1010XXXXXX"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">العنوان والمقر *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Financial & Currency Settings */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1">
              إعدادات المحاسبة والعملة:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">العملة الافتراضية</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium"
                >
                  <option value="ر.س">ريال سعودي (ر.س - SAR)</option>
                  <option value="د.إ">درهم إماراتي (د.إ - AED)</option>
                  <option value="ج.م">جنيه مصري (ج.م - EGP)</option>
                  <option value="د.ك">دينار كويتي (د.ك - KWD)</option>
                  <option value="ر.ع">ريال عماني (ر.ع - OMR)</option>
                  <option value="ر.ق">ريال قطري (ر.ق - QAR)</option>
                  <option value="$">دولار أمريكي ($ - USD)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">نسبة ضريبة القيمة المضافة الافتراضية</label>
                <select
                  value={defaultVatRate}
                  onChange={(e) => setDefaultVatRate(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium"
                >
                  <option value="15">15% (النسبة الأساسية - المملكة العربية السعودية)</option>
                  <option value="5">5% (الإمارات / البحرين / سلطنة عمان)</option>
                  <option value="14">14% (مصر)</option>
                  <option value="0">0% (معفى من الضريبة)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Backup & Reset */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">النسخ الاحتياطي وإعادة التعيين:</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير نسخة احتياطية (JSON)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("هل أنت متأكد من رغبتك في إعادة ضبط البيانات للقيم النموذجية؟")) {
                    onResetData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة البيانات النموذجية الأولية</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
