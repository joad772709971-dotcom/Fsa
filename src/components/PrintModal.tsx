import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  ExternalLink,
  X,
  SlidersHorizontal,
  FileText,
  Receipt,
  Settings2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  registerPrintListener,
  PrintPayload,
  PaperSize,
  ColorMode,
  buildPrintableHtml,
  printViaIframe,
  directSystemPrint,
  printInNewWindow,
  syncPrintableArea,
} from '../utils/printHelper';
import { triggerFileDownload } from '../utils/fileExportHelper';

export const PrintModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [printPayload, setPrintPayload] = useState<PrintPayload>({
    html: '',
    rawContent: '',
    title: 'طباعة مستند',
    paperSize: 'a4',
    colorMode: 'color',
  });

  const [currentPaperSize, setCurrentPaperSize] = useState<PaperSize>('a4');
  const [currentColorMode, setCurrentColorMode] = useState<ColorMode>('color');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    registerPrintListener((payload: PrintPayload) => {
      setPrintPayload(payload);
      setCurrentPaperSize(payload.paperSize || 'a4');
      setCurrentColorMode(payload.colorMode || 'color');
      setIsOpen(true);

      // Auto-trigger print dialog after frame is mounted
      setTimeout(() => {
        try {
          const iframe = iframeRef.current;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        } catch (e) {
          console.warn('Auto print error:', e);
        }
      }, 500);
    });

    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'close-print-modal') {
        setIsOpen(false);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      registerPrintListener(null);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (!isOpen) return null;

  // Dynamically recomputed HTML based on selected paper size and color mode
  const currentHtml = buildPrintableHtml(
    printPayload.rawContent || printPayload.html,
    printPayload.title,
    {
      paperSize: currentPaperSize,
      colorMode: currentColorMode,
    }
  );

  const handleSystemPrint = () => {
    // 1. Synchronize the root #printableArea for clean document print
    syncPrintableArea(printPayload.rawContent || printPayload.html);

    // 2. Invoke the system print dialog through the iframe (or direct window)
    const success = printViaIframe(
      iframeRef.current,
      printPayload.rawContent || printPayload.html,
      printPayload.title
    );

    if (!success) {
      directSystemPrint(printPayload.rawContent || printPayload.html, {
        title: printPayload.title,
        paperSize: currentPaperSize,
        colorMode: currentColorMode,
      });
    }
  };

  const handleOpenInNewWindow = () => {
    printInNewWindow(
      printPayload.rawContent || printPayload.html,
      printPayload.title,
      {
        paperSize: currentPaperSize,
        colorMode: currentColorMode,
      }
    );
  };

  const handleDownloadReport = () => {
    const blob = new Blob(['\ufeff' + currentHtml], { type: 'text/html;charset=utf-8' });
    const filename = `${printPayload.title.replace(/\s+/g, '_')}_جاهز_للطباعة.html`;
    triggerFileDownload(blob, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 no-print">
      <div className="bg-white w-full max-w-5xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-xs cursor-pointer shrink-0"
              title="رجوع وإغلاق نافذة الطباعة"
            >
              <ArrowRight className="w-4 h-4" />
              <span>رجوع</span>
            </button>

            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white truncate">
                إعدادات وطباعة: {printPayload.title}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                إرسال المستند مباشرة إلى الطابعات المتصلة بالنظام (USB / Wi-Fi / بلوتوث) أو حفظه كـ PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-800/50 cursor-pointer"
              title="إغلاق نافذة الطباعة والعودة للنظام"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">إغلاق الطباعة</span>
            </button>
          </div>
        </div>

        {/* Printer & Paper Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 active:scale-98 text-slate-800 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition-all cursor-pointer border border-slate-300"
              title="إلغاء والعودة إلى الشاشة السابقة"
            >
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <span>رجوع للنظام</span>
            </button>

            <button
              onClick={handleSystemPrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
              title="فتح حوار الطباعة الأصلي للنظام لاختيار الطابعة وعدد النسخ ونطاق الصفحات"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ طباعة الآن (Print)</span>
            </button>

            <button
              onClick={handleOpenInNewWindow}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              title="فتح المستند في نافذة متصفح جديدة منفصلة تماماً لتخطي قيود الإطارات واستدعاء الطابعة"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>نافذة مستقلة للطابعة</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
              title="حفظ التقرير كملف HTML مجهز بالكامل للفتح في Microsoft Word أو الحفظ المكتبي"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>حفظ ملف Word/HTML</span>
            </button>
          </div>

          {/* Paper Size & Color Mode Selectors */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            
            {/* Paper Size Tabs */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/70">
              <button
                type="button"
                onClick={() => setCurrentPaperSize('a4')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPaperSize === 'a4'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ورق A4 قياسي مناسب لكشوفات الحساب وتقارير التصفية والفواتير العادية"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>ورق A4</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentPaperSize('receipt80')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPaperSize === 'receipt80'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="طابعة إيصالات حرارية بعرض 80 مم (طابعات الكاشير القياسية POS)"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>حراري 80mm</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentPaperSize('receipt58')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPaperSize === 'receipt58'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="طابعة إيصالات حرارية مدمجة بعرض 58 مم (طابعات بلوتوث المحمولة)"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                <span>حراري 58mm</span>
              </button>
            </div>

            {/* Color Mode Tabs */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/70">
              <button
                type="button"
                onClick={() => setCurrentColorMode('color')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentColorMode === 'color'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ألوان كاملة للطابعات النافثة للحبر والليزر الملونة"
              >
                🎨 ملون
              </button>
              <button
                type="button"
                onClick={() => setCurrentColorMode('grayscale')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentColorMode === 'grayscale'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="أبيض وأسود عالي التباين للطابعات الحرارية والليزرية العادية"
              >
                ⚫ أبيض/أسود
              </button>
            </div>

          </div>

        </div>

        {/* Informative Hardware Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-900 shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>خيارات الطابعة المتصلة:</strong> الضغط على <strong>"طباعة الآن"</strong> يفتح مربع حوار النظام لاختيار الطابعة (USB / Wi-Fi / بلوتوث)، وتحديد عدد النسخ، والصفحات، ونوع الورق.
            </span>
          </div>
          <span className="text-[10px] text-amber-800/80 hidden lg:inline font-mono">
            {currentPaperSize.toUpperCase()} • {currentColorMode.toUpperCase()}
          </span>
        </div>

        {/* Preview Frame */}
        <div className="flex-1 bg-slate-200/70 p-2 sm:p-4 overflow-hidden relative flex justify-center items-center">
          <iframe
            ref={iframeRef}
            id="print-preview-iframe"
            title="معاينة الطباعة"
            srcDoc={currentHtml}
            className={`w-full h-full bg-white rounded-xl border border-slate-300 shadow-md transition-all ${
              currentPaperSize === 'receipt80'
                ? 'max-w-[360px]'
                : currentPaperSize === 'receipt58'
                ? 'max-w-[290px]'
                : 'max-w-full'
            }`}
          />
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="truncate hidden sm:inline">
            نظام الرقم الأول - إدارة محلات الجوالات والصيانة • متوافق مع كافة طابعات الفواتير A4 والحرارية
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-4 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>رجوع للشاشة</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>إغلاق نافذة الطباعة</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

