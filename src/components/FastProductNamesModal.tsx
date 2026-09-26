import React, { useState } from 'react';
import {
  Sparkles,
  Barcode,
  Mic,
  MicOff,
  CheckCircle2,
  X,
  Boxes,
  Plus,
  Trash2,
  Layers,
  Tag,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { parseBulkProductNames, detectProductCategory } from '../utils/fastProductManager';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/voiceAndPermissions';

interface FastProductNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: InventoryItem[]) => void;
}

export const FastProductNamesModal: React.FC<FastProductNamesModalProps> = ({
  isOpen,
  onClose,
  onAddItems,
}) => {
  if (!isOpen) return null;

  const [rawText, setRawText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'auto' | 'accessories' | 'spare_parts' | 'phones' | 'sims' | 'tools'
  >('auto');
  const [isRecording, setIsRecording] = useState(false);
  const recognizerRef = React.useRef<any>(null);

  // Parse preview on the fly
  const previewItems = React.useMemo(() => {
    return parseBulkProductNames(
      rawText,
      selectedCategory === 'auto' ? undefined : selectedCategory
    );
  }, [rawText, selectedCategory]);

  const toggleVoiceRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('المتصفح لا يدعم التسجيل الصوتي المباشر. يمكنك استخدام لوحة المفاتيح.');
      return;
    }

    if (isRecording) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognizer = createSpeechRecognizer(
        (recognized) => {
          setRawText((prev) => {
            const separator = prev.trim().length > 0 ? '\n' : '';
            return prev + separator + recognized;
          });
        },
        (error: any) => {
          console.warn('Speech error', error);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );

      recognizerRef.current = recognizer;
      recognizer.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleApply = () => {
    if (previewItems.length === 0) {
      alert('يرجى كتابة أو إملاء اسم منتج واحد على الأقل.');
      return;
    }

    onAddItems(previewItems);
    setRawText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white p-5 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
              <Barcode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>إدخال سريع لأسماء منتجات المحل</span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                  توليد باركود تلقائي
                </span>
              </h3>
              <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                اكتب أو أملِ أسماء المنتجات فقط. سيقوم النظام بتوليد باركود فريد لكل صنف وإضافتها للمخزن مع ترك مربعات الأسعار والكميات فارغة لتسعيرها أو جردها في أي وقت!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/70">
          {/* Controls Bar: Category + Voice */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">القسم:</label>
              <select
                value={selectedCategory}
                onChange={(e: any) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
              >
                <option value="auto">تحديد تلقائي ذكي حسب الاسم</option>
                <option value="accessories">إكسسوارات</option>
                <option value="spare_parts">قطع صيانة وغيار</option>
                <option value="phones">جوالات وأجهزة</option>
                <option value="sims">شرايح وباقات</option>
                <option value="tools">أدوات ومعدات</option>
              </select>
            </div>

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
              title="انقر وتحدث بأسماء الأصناف وسيقوم الميكروفون بكتابتها فوراً"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'جاري الاستماع... (انقر للإيقاف)' : 'إملاء صوتي بالمايك'}</span>
            </button>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              قائمة أسماء المنتجات (كل منتج في سطر، أو مفصولة بفواصل):
            </label>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="مثال:&#10;سماعة الملك&#10;شاحن سامسونج 25W أصلي&#10;كفر ايفون 15 شفاف ضد الصدمات&#10;وصلة تايب سي إلى AUX&#10;شاشة ريلمي C53 أصلية"
              className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-900 leading-relaxed font-medium placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-xs"
            />
          </div>

          {/* Quick preset chips */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500">نماذج سريعة للتجربة:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'سماعة الملك، كفر ريلمي 11، شاحن ايفون 20W، حماية نوت 13',
                'شاشة سامسونج A12، بطارية نوت 10، فلاتة شحن ريلمي C21',
                'سماعة بلوتوث M10، شاحن سيارة سريع، عصا سيلفي',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawText((prev) => (prev ? prev + '\n' + sample : sample))}
                  className="text-[10px] bg-slate-200 hover:bg-amber-100 hover:text-amber-900 text-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-slate-300"
                >
                  + {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview of items to be created */}
          {previewItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  معاينة الأصناف الجاهزة للإضافة ({previewItems.length} صنف):
                </span>
                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  الأسعار والكميات فارغة (غير مسعرة)
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                {previewItems.map((item, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {item.category === 'phones' ? 'جوالات' : item.category === 'spare_parts' ? 'قطع صيانة' : 'إكسسوارات'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <Barcode className="w-3 h-3" />
                        {item.barcode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        التكلفة: - | العدد: -
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={previewItems.length === 0}
            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              previewItems.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>توليد الباركودات وإضافة ({previewItems.length}) صنف للمخزن فورياً</span>
          </button>
        </div>
      </div>
    </div>
  );
};
