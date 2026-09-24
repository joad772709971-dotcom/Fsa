import React from 'react';
import { LogOut, AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">تأكيد الخروج من النظام</h3>
              <p className="text-xs text-rose-200/80">نظام الرقم الأول - نقاط البيع والمحاسبة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-sm text-slate-600 space-y-2">
              <p className="font-semibold text-slate-900 text-base">
                هل أنت متأكد من رغبتك في تسجيل الخروج {userName ? `يا (${userName})` : ''}؟
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                سيتم حفظ كافة البيانات المحاسبية والمبيعات تلقائياً وأمان تام. ستحتاج لإدخال كلمة المرور أو رمز الدخول مجدداً لاستئناف العمل.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>بيانات الدرج والمبيعات واليوميات محفوظة ومؤمّنة سحابياً ومحلياً.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            إلغاء والتراجع
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-950/20 active:scale-98 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد الخروج الآن</span>
          </button>
        </div>

      </div>
    </div>
  );
};
