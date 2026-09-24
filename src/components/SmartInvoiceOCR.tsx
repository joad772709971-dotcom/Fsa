import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  Scan,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Eye,
  Trash2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { ScannedInvoiceResult } from '../types';
import { loadArchivedInvoices, approveAndPostScannedInvoice, deleteArchivedInvoice } from '../utils/invoiceOcrStorage';
import { InvoiceVerificationModal } from './InvoiceVerificationModal';
import { getActiveStoreId, getActiveOwnerId } from '../utils/storage';
import { getApiBaseUrl } from '../utils/apkConfig';
import { compressImageForOcr } from '../utils/imageCompressor';

export const SmartInvoiceOCR: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'archive'>('upload');

  // Verification modal state
  const [verifiedInvoice, setVerifiedInvoice] = useState<ScannedInvoiceResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Archive state
  const [archivedInvoices, setArchivedInvoices] = useState<ScannedInvoiceResult[]>([]);
  const [previewArchiveImage, setPreviewArchiveImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setArchivedInvoices(loadArchivedInvoices());
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('يرجى اختيار صورة صالحة للفاتورة (JPG, PNG, WebP) أو ملف PDF');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setStatusMessage('جاري تحسين وضغط الصورة وتجهيزها للتحليل الذكي...');

    try {
      const { base64, mimeType } = await compressImageForOcr(file, 1600, 1600, 0.82);
      setSelectedImage(base64);
      processWithGeminiOCR(base64, mimeType);
    } catch (err: any) {
      console.error('Failed to process/compress image:', err);
      // Fallback to direct reading if compression fails
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setSelectedImage(base64);
        processWithGeminiOCR(base64, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const processWithGeminiOCR = async (imageBase64: string, mimeType: string = 'image/jpeg') => {
    setIsProcessing(true);
    setStatusMessage('جاري تحليل خط اليد واستخراج بنود الفاتورة والأسعار عبر محرك Gemini Vision...');
    setErrorMessage(null);

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/gemini/ocr-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          storeId: getActiveStoreId(),
          ownerId: getActiveOwnerId(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'تعذر معالجة صورة الفاتورة');
      }

      const data = await response.json();
      const items = (data.items || []).map((item: any, idx: number) => ({
        id: `item_${Date.now()}_${idx}`,
        name: item.name || 'قطعة غيار',
        category: item.category || 'spare_parts',
        quantity: Number(item.quantity) || 1,
        unitCost: Number(item.unitCost) || 0,
        totalCost: Number(item.totalCost) || (Number(item.quantity) || 1) * (Number(item.unitCost) || 0),
        suggestedSalePrice: Number(item.suggestedSalePrice) || Math.round((Number(item.unitCost) || 0) * 1.3),
        notes: item.notes,
      }));

      const subtotal = items.reduce((sum: number, it: any) => sum + (it.totalCost || 0), 0);
      const discount = Number(data.discount) || 0;
      const totalAmount = Math.max(0, subtotal - discount);
      const previousBalance = Number(data.previousBalance) || 0;
      const paidAmount = Number(data.paidAmount) || 0;
      const remainingBalance = Number(data.remainingBalance) || Math.max(0, previousBalance + totalAmount - paidAmount);

      const parsedInvoice: ScannedInvoiceResult = {
        id: `inv_scan_${Date.now()}`,
        invoiceNumber: data.invoiceNumber || `REC-${Date.now().toString().slice(-4)}`,
        invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
        supplierName: data.supplierName || 'مؤسسة العبصري لقطع الغيار',
        items,
        subtotal,
        discount,
        totalAmount,
        previousBalance,
        paidAmount,
        remainingBalance,
        paymentStatus: remainingBalance === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'credit',
        linkToSupplierDebt: true,
        imageBase64,
        notes: data.notes || '',
        storeId: getActiveStoreId(),
        ownerId: getActiveOwnerId(),
      };

      setVerifiedInvoice(parsedInvoice);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('OCR Processing error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء قراءة الفاتورة، يرجى المحاولة مرة أخرى أو استخدام صورة أوضح.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  // Sample handwritten invoice simulator for rapid testing
  const loadSampleHandwrittenInvoice = () => {
    // Generate a clean dummy SVG invoice data URL
    const svgInvoice = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:%23fff9e6;font-family:sans-serif;">
      <text x="300" y="50" text-anchor="middle" font-size="22" font-weight="bold" fill="%232b2b2b">مؤسسة العبصري لقطع الغيار والشاشات</text>
      <text x="300" y="80" text-anchor="middle" font-size="14" fill="%23666">صنعاء - شارع القصر - تلفون: 777123456</text>
      <line x1="40" y1="95" x2="560" y2="95" stroke="%23333" stroke-width="2"/>
      <text x="540" y="130" text-anchor="end" font-size="15" font-weight="bold" fill="%23111">المطلوب من الأخ: محل مصعب الصوفي للجوالات</text>
      <text x="540" y="160" text-anchor="end" font-size="14" fill="%23333">التاريخ: ${new Date().toISOString().split('T')[0]}</text>
      <text x="100" y="160" text-anchor="start" font-size="14" fill="%23333">رقم الفاتورة: 4892</text>
      <rect x="40" y="180" width="520" height="35" fill="%23e8dfc8" stroke="%23333"/>
      <text x="520" y="203" font-size="14" font-weight="bold">البيان (خط اليد)</text>
      <text x="280" y="203" font-size="14" font-weight="bold">الكمية</text>
      <text x="180" y="203" font-size="14" font-weight="bold">السعر</text>
      <text x="70" y="203" font-size="14" font-weight="bold">الإجمالي</text>
      <text x="520" y="245" font-size="14">شاشة سامسونج A12 وكالة أصلي</text><text x="290" y="245">2</text><text x="180" y="245">8500</text><text x="70" y="245">17000</text>
      <text x="520" y="285" font-size="14">بطارية ردمي نوت 11 أصلية</text><text x="290" y="285">3</text><text x="180" y="285">3200</text><text x="70" y="285">9600</text>
      <text x="520" y="325" font-size="14">شاشة آيفون X سوفت OLED</text><text x="290" y="325">1</text><text x="180" y="325">14000</text><text x="70" y="325">14000</text>
      <text x="520" y="365" font-size="14">فلاتة شحن سامسونج A51</text><text x="290" y="365">5</text><text x="180" y="365">900</text><text x="70" y="365">4500</text>
      <text x="520" y="405" font-size="14">سلك لحام ميكانيك + مساعد لحام</text><text x="290" y="405">2</text><text x="180" y="405">1200</text><text x="70" y="405">2400</text>
      <line x1="40" y1="435" x2="560" y2="435" stroke="%23333" stroke-width="1.5"/>
      <text x="520" y="470" font-size="15" font-weight="bold">إجمالي الفاتورة الحالية:</text><text x="70" y="470" font-size="16" font-weight="bold">47500 ر.ي</text>
      <text x="520" y="510" font-size="15">الباقي السابق (حساب سابق):</text><text x="70" y="510" font-size="15" fill="%23b83232">12000 ر.ي</text>
      <text x="520" y="550" font-size="15">المدفوع نقداً (واصل):</text><text x="70" y="550" font-size="15" fill="%232b7a2b">30000 ر.ي</text>
      <line x1="40" y1="580" x2="560" y2="580" stroke="%23333" stroke-width="2"/>
      <text x="520" y="620" font-size="18" font-weight="bold" fill="%23b83232">الباقي المتبقي له:</text><text x="70" y="620" font-size="20" font-weight="bold" fill="%23b83232">29500 ر.ي</text>
      <text x="300" y="740" text-anchor="middle" font-size="12" fill="%23777">شكراً لتعاملكم معنا - توقيع المستلم: .................</text>
    </svg>`;

    const mockResult: ScannedInvoiceResult = {
      id: `inv_sample_${Date.now()}`,
      invoiceNumber: '4892',
      invoiceDate: new Date().toISOString().split('T')[0],
      supplierName: 'مؤسسة العبصري لقطع الغيار',
      items: [
        {
          id: '1',
          name: 'شاشة سامسونج A12 وكالة أصلي',
          category: 'screens',
          quantity: 2,
          unitCost: 8500,
          totalCost: 17000,
          suggestedSalePrice: 11500,
        },
        {
          id: '2',
          name: 'بطارية ردمي نوت 11 أصلية',
          category: 'batteries',
          quantity: 3,
          unitCost: 3200,
          totalCost: 9600,
          suggestedSalePrice: 4500,
        },
        {
          id: '3',
          name: 'شاشة آيفون X سوفت OLED',
          category: 'screens',
          quantity: 1,
          unitCost: 14000,
          totalCost: 14000,
          suggestedSalePrice: 18000,
        },
        {
          id: '4',
          name: 'فلاتة شحن سامسونج A51',
          category: 'spare_parts',
          quantity: 5,
          unitCost: 900,
          totalCost: 4500,
          suggestedSalePrice: 1500,
        },
        {
          id: '5',
          name: 'سلك لحام ميكانيك + مساعد لحام',
          category: 'maintenance_tools',
          quantity: 2,
          unitCost: 1200,
          totalCost: 2400,
          suggestedSalePrice: 1800,
        },
      ],
      subtotal: 47500,
      discount: 0,
      totalAmount: 47500,
      previousBalance: 12000,
      paidAmount: 30000,
      remainingBalance: 29500,
      paymentStatus: 'partial',
      linkToSupplierDebt: true,
      imageBase64: svgInvoice,
      notes: 'فاتورة يد مطابقة لمحل العبصري - صنعاء شارع القصر',
      storeId: getActiveStoreId(),
      ownerId: getActiveOwnerId(),
    };

    setSelectedImage(svgInvoice);
    setVerifiedInvoice(mockResult);
    setIsModalOpen(true);
  };

  const handleApproveInvoice = (approved: ScannedInvoiceResult) => {
    const result = approveAndPostScannedInvoice(approved);
    setIsModalOpen(false);
    setArchivedInvoices(loadArchivedInvoices());
    alert(`✅ ${result.message}`);
  };

  const handleDeleteArchive = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة المؤرشفة؟')) {
      deleteArchivedInvoice(id);
      setArchivedInvoices(loadArchivedInvoices());
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tabs */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-700 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-emerald-200">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-bold tracking-wider uppercase">وحدة المحاسبة الذكية المتقدمة</span>
          </div>
          <h1 className="mt-1 text-2xl font-black">قارئ ومدقق فواتير المشتريات (Smart Invoice OCR)</h1>
          <p className="mt-1 max-w-xl text-xs text-emerald-100">
            تصوير أو رفع فواتير خط اليد لمحلات قطع الغيار والشاشات، وقراءتها تلقائياً عبر Gemini Vision مع نافذة مراجعة
            وتدقيق واعتماد فوري وترحيل للمخزون وحسابات الموردين.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'bg-emerald-800/40 text-white hover:bg-emerald-800/60'
            }`}
          >
            <Scan className="h-4 w-4" /> فحص وتصوير فاتورة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'archive'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'bg-emerald-800/40 text-white hover:bg-emerald-800/60'
            }`}
          >
            <FileText className="h-4 w-4" /> أرشيف الفواتير ({archivedInvoices.length})
          </button>
        </div>
      </div>

      {/* Main Upload / Camera View */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left / Center Upload Area (8 cols) */}
          <div className="space-y-4 lg:col-span-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex min-h-[340px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              {/* Invisible file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {isProcessing ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                      <Scan className="h-8 w-8 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      جاري التدقيق البصري لخط اليد
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{statusMessage}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Scan className="h-8 w-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      اسحب وأسقط صورة الفاتورة المكتوبة بخط اليد هنا
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      يدعم فواتير محلات الصيانة والشاشات وبطاريات الجوالات (JPG, PNG, PDF)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
                    >
                      <Upload className="h-4 w-4" /> اختيار صورة من الجهاز
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Camera className="h-4 w-4 text-emerald-600" /> تصوير بالكاميرا الآن
                    </button>

                    <button
                      type="button"
                      onClick={loadSampleHandwrittenInvoice}
                      className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <Sparkles className="h-4 w-4" /> تجربة فاتورة نموذجية (العبصري)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Right Instructions / Features Card (4 cols) */}
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                آلية الفحص والتدقيق المحاسبي
              </h3>

              <ul className="mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    1
                  </span>
                  <span>
                    <strong>تحويل خط اليد لأرقام:</strong> تفريغ اسم القطعة (شاشات، بطاريات، أدوات صيانة) والكمية وسعر الحبة.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    2
                  </span>
                  <span>
                    <strong>التحقق الرياضي من الباقي:</strong> فحص ومطابقة الباقي السابق مع المدفوع نقداً وحساب الرصيد الآجل.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    3
                  </span>
                  <span>
                    <strong>شاشة فحص وتعديل (Verification Modal):</strong> لا يتم اعتماد أي فاتورة إلا بعد موافقتك ومراجعتك المباشرة.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    4
                  </span>
                  <span>
                    <strong>الربط الآلي وحفظ المرفقات:</strong> ترحيل الكميات للمخزون، وتحديث كشف حساب المورد، وأرشفة صورة الفاتورة للأبد.
                  </span>
                </li>
              </ul>
            </div>

            {/* Quick Metrics of Archived Invoices */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إحصائيات الفواتير المؤرشفة</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white p-3 shadow-xs dark:bg-slate-800">
                  <span className="text-[10px] text-slate-500">الفواتير المؤرشفة</span>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">{archivedInvoices.length}</p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-xs dark:bg-slate-800">
                  <span className="text-[10px] text-slate-500">إجمالي المشتريات</span>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {archivedInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString()} ر.ي
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Tab: List of verified handwritten invoices with full image preview */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          {archivedInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد فواتير مؤرشفة بعد</h3>
              <p className="mt-1 text-xs text-slate-500">قم بفحص وتصوير فاتورة لتظهر في الأرشيف الدائم مع أصل الصورة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> تم الاعتماد والترحيل
                        </span>
                        <h4 className="mt-2 text-sm font-black text-slate-900 dark:text-white">{inv.supplierName}</h4>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{inv.invoiceDate}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                      <div>
                        <span className="text-slate-500">قيمة الفاتورة:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {inv.totalAmount.toLocaleString()} ر.ي
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">الباقي الآجل:</span>
                        <p
                          className={`font-bold ${
                            inv.remainingBalance > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {inv.remainingBalance.toLocaleString()} ر.ي
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      <span>الأصناف ({inv.items.length}): </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {inv.items.map((i) => i.name).slice(0, 3).join('، ')}
                        {inv.items.length > 3 ? '...' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                    {inv.imageBase64 && (
                      <button
                        type="button"
                        onClick={() => setPreviewArchiveImage(inv.imageBase64 || null)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        <Eye className="h-3.5 w-3.5" /> معاينة الصورة الأصلية
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteArchive(inv.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                      title="حذف من الأرشيف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editable Verification Modal */}
      {verifiedInvoice && isModalOpen && (
        <InvoiceVerificationModal
          isOpen={isModalOpen}
          invoice={verifiedInvoice}
          onClose={() => setIsModalOpen(false)}
          onApprove={handleApproveInvoice}
        />
      )}

      {/* Image Preview Modal for Archive */}
      {previewArchiveImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-slate-900 p-2">
            <button
              onClick={() => setPreviewArchiveImage(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <Trash2 className="hidden" />
              <span className="text-sm font-bold">✕ إغلاق</span>
            </button>
            <img
              src={previewArchiveImage}
              alt="Archived handwritten invoice"
              className="rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
