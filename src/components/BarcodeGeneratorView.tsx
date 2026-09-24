import React, { useState, useRef, useEffect } from 'react';
import {
  Barcode,
  Printer,
  Sparkles,
  Camera,
  Search,
  PlusCircle,
  Copy,
  CheckCircle,
  RefreshCw,
  Sliders,
  FileText,
  Boxes,
  Tag,
  Eye,
} from 'lucide-react';
import { generateAutoBarcode, getBarcodeSVGString } from '../utils/barcode';
import { formatCurrency } from '../utils/calculations';
import { printHtmlElement } from '../utils/printHelper';

interface BarcodeProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  barcode: string;
}

export const BarcodeGeneratorView: React.FC = () => {
  // Product List for Barcode Generation (starts empty / loads from storage)
  const [products, setProducts] = useState<BarcodeProductItem[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_barcode_catalog');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [];
  });

  // Generator State
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [customBarcode, setCustomBarcode] = useState<string>(generateAutoBarcode());
  const [shopName, setShopName] = useState<string>('محل مصعب الصوفي');
  const [printCopies, setPrintCopies] = useState<number>(12);
  const [labelSize, setLabelSize] = useState<'standard' | 'small' | 'large'>('standard');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Scanner State
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto Generate new random barcode
  const handleRegenerateBarcode = () => {
    setCustomBarcode(generateAutoBarcode());
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(customBarcode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Add Item with Barcode to Catalog
  const handleAddToCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !customBarcode.trim()) return;

    const newItem: BarcodeProductItem = {
      id: `bar_${Date.now()}`,
      name: customItemName.trim(),
      category: 'إكسسوارات',
      price: Number(customPrice) || 0,
      barcode: customBarcode.trim(),
    };

    const updated = [newItem, ...products];
    setProducts(updated);
    localStorage.setItem('mosaab_barcode_catalog', JSON.stringify(updated));
    alert(`تم حفظ الصنف (${newItem.name}) بالباركود: ${newItem.barcode}`);
  };

  // Select Item from Catalog
  const handleSelectProduct = (p: BarcodeProductItem) => {
    setCustomItemName(p.name);
    setCustomPrice(p.price);
    setCustomBarcode(p.barcode);
  };

  // Camera Scanner Functions
  const startCamera = async () => {
    try {
      setIsScannerActive(true);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('تعذر فتح الكاميرا. يرجى التأكد من منح الإذن لاستخدام الكاميرا.');
      setIsScannerActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScannerActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-950/20">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              توليد وطباعة الباركود وقارئ الأصناف
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              توليد باركود تلقائي أو مخصص، طباعة ملصقات الأسعار الورقية والحرارية، وماسح الكاميرا
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => printHtmlElement('printable-barcode-sheet-grid', `ملصقات_باركود_${customItemName || customBarcode}`)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>طباعة صفحة الملصقات (Print Labels)</span>
          </button>
        </div>
      </div>

      {/* Grid: Barcode Creator & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 6 cols: Generator Form */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900">إعداد وتوليد الباركود</h3>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
              توليد اختياري وتلقائي
            </span>
          </div>

          <form onSubmit={handleAddToCatalog} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم الصنف أو القطعة:</label>
              <input
                type="text"
                required
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="مثال: شاشة سامسونج / شاحن سريع..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">سعر البيع (ر.ي):</label>
                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المحل على الملصق:</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">رقم الباركود (Barcode Number):</label>
                <button
                  type="button"
                  onClick={handleRegenerateBarcode}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>توليد كود تلقائي جديد</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={customBarcode}
                  onChange={(e) => setCustomBarcode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900 text-sm"
                />
                <button
                  type="button"
                  onClick={handleCopyBarcode}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1 shrink-0"
                >
                  {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عدد الملصقات للطباعة:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={printCopies}
                  onChange={(e) => setPrintCopies(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">حجم الملصق:</label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="standard">قياسي (50mm × 30mm)</option>
                  <option value="small">صغير (38mm × 25mm)</option>
                  <option value="large">كبير (70mm × 40mm)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>حفظ في كتالوج الباركود</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 6 cols: Live Single Label & Scanner */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Live Single Label Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500">معاينة ملصق السعر والباركود الفردي</span>
              <Eye className="w-4 h-4 text-slate-400" />
            </div>

            {/* Sticker Preview Box */}
            <div className="w-64 p-3.5 bg-white border-2 border-dashed border-slate-400 rounded-xl shadow-sm space-y-1.5 font-sans text-slate-900">
              <div className="font-black text-[11px] text-slate-950 truncate">{shopName}</div>
              <div className="text-xs font-bold text-slate-800 truncate">{customItemName || 'اسم الصنف / القطعة'}</div>
              <div className="font-mono font-black text-sm text-emerald-700">
                السعر: {formatCurrency(Number(customPrice) || 0)}
              </div>
              <div
                className="flex justify-center py-1"
                dangerouslySetInnerHTML={{
                  __html: getBarcodeSVGString(customBarcode, 200, 50, true),
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              جاهز للطباعة على طابعات ورق الملصقات (A4 Labels Sheet أو طابعة الباركود الحرارية).
            </p>
          </div>

          {/* Camera Scanner Test Box */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-sm text-white">فحص وقراءة الباركود بالكاميرا</h4>
              </div>
              <button
                onClick={isScannerActive ? stopCamera : startCamera}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  isScannerActive ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isScannerActive ? 'إيقاف الكاميرا' : 'تشغيل ماسح الكاميرا'}
              </button>
            </div>

            {isScannerActive ? (
              <div className="relative h-44 bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                <div className="absolute inset-0 border-2 border-dashed border-indigo-400 m-6 rounded pointer-events-none" />
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                استخدم كاميرا الجوال لمسح باركود أي منتج فورياً والتحقق من سعره أو إضافته مباشرة لسندات البيع أو المخزون.
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Printable Barcode Labels Sheet (Visible on screen and perfectly formatted for window.print()) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              شبكة ملصقات الباركود الجاهزة للطباعة ({printCopies} ملصق)
            </h3>
            <p className="text-xs text-slate-500">
              اضغط على زر الطباعة لطباعة هذه الملصقات على ورق A4 مقسم أو رول حراري
            </p>
          </div>
          <button
            onClick={() => printHtmlElement('printable-barcode-sheet-grid', `ملصقات_باركود_${customItemName || customBarcode}`)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الكل</span>
          </button>
        </div>

        {/* Labels Grid */}
        <div id="printable-barcode-sheet-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-3 print:gap-2">
          {Array.from({ length: printCopies }).map((_, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-slate-300 rounded-xl text-center flex flex-col justify-between items-center text-slate-950 font-sans shadow-2xs print:border print:border-black print:p-2"
            >
              <div className="text-[10px] font-black">{shopName}</div>
              <div className="text-[11px] font-bold truncate max-w-full my-0.5">{customItemName}</div>
              <div className="font-mono font-black text-xs text-emerald-700">
                {formatCurrency(Number(customPrice) || 0)}
              </div>
              <div
                className="flex justify-center mt-1"
                dangerouslySetInnerHTML={{
                  __html: getBarcodeSVGString(customBarcode, 160, 42, true),
                }}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
