import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Camera, 
  FileText, 
  ExternalLink, 
  Printer, 
  Download, 
  Check,
  MessageSquare,
  Eye
} from 'lucide-react';
import { openWhatsApp } from '../utils/messaging';
import { SHOP_INFO } from '../types';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onSaveImage?: (url: string | undefined) => void;
  onSave?: (url: string) => void;
  whatsappMessage?: string;
  customerPhone?: string;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  imageUrl,
  onSaveImage,
  onSave,
  whatsappMessage,
  customerPhone
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(imageUrl);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    setPreviewUrl(imageUrl);
  }, [imageUrl, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert('حدث خطأ أثناء قراءة الصورة. يرجى المحاولة مرة أخرى.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveImage?.(previewUrl);
    onSave?.(previewUrl || '');
    onClose();
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Image Display or Upload Area */}
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/50 max-h-[50vh] flex items-center justify-center group">
                <img 
                  src={previewUrl} 
                  alt="مستند مرفق" 
                  className="max-h-[50vh] w-auto object-contain rounded-xl"
                />
                
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <button
                    onClick={handleRemove}
                    className="p-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg transition cursor-pointer"
                    title="حذف المستند"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <a
                    href={previewUrl}
                    download="document-receipt.png"
                    className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white shadow-lg transition cursor-pointer"
                    title="تنزيل الصورة"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
                <span>تم إرفاق المستند بنجاح ويمكن مراجعته ومطابقته دفترياً.</span>
                <label className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer underline">
                  تبديل الصورة
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 text-center transition bg-[#0F172A]/50 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">إرفاق صورة سند القبض / فاتورة المشتريات / الورقيات</p>
                <p className="text-xs text-slate-400 mt-1">التقط صورة بالكاميرا أو اختر مستنداً من الاستوديو للمطابقة الدفترية</p>
              </div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md transition">
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'جاري التحميل...' : 'رفع أو تصوير المستند'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>
          )}

          {/* Quick WhatsApp Share Button if message available */}
          {whatsappMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-bold">إرسال تفاصيل الفاتورة والشروط عبر الواتساب</span>
              </div>
              <button
                onClick={() => openWhatsApp(customerPhone, whatsappMessage)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>إرسال واتساب</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#0F172A] border-t border-slate-700 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ المستند</span>
          </button>
        </div>

      </div>
    </div>
  );
};
