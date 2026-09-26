import React, { useState, useRef } from "react";
import {
  ScanLine,
  Upload,
  Image as ImageIcon,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  Building,
  Receipt,
  DollarSign,
} from "lucide-react";
import { CompanyProfile, Transaction } from "../types";
import { formatCurrency } from "../lib/storage";

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: Transaction) => void;
  companyProfile: CompanyProfile;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
  companyProfile,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)");
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setExtractedData(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("يرجى سحب ملف صورة صالح");
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setExtractedData(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const generateSampleReceipt = (type: "tech" | "fuel" | "office") => {
    // Generate an illustrative receipt canvas image as base64 for instant testing
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 750;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Receipt background paper
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Text styling
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.font = "bold 26px sans-serif";

    if (type === "tech") {
      ctx.fillText("مكتبة جرير - JARIR BOOKSTORE", 300, 70);
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("فاتورة ضريبية مبسطة رقم: 9817203", 300, 105);
      ctx.fillText("الرقم الضريبي: 300056182900003", 300, 130);
      ctx.fillText("التاريخ: 2026-09-15 11:30 AM", 300, 155);

      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(40, 180);
      ctx.lineTo(560, 180);
      ctx.stroke();

      ctx.font = "18px sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("1. ماوس لوجيتك لاسلكي MX Master 3S", 540, 220);
      ctx.fillText("400.00 ر.س", 140, 220);

      ctx.fillText("2. لوحة مفاتيح ميكانيكية احترافية", 540, 270);
      ctx.fillText("600.00 ر.س", 140, 270);

      ctx.beginPath();
      ctx.moveTo(40, 310);
      ctx.lineTo(560, 310);
      ctx.stroke();

      ctx.fillText("المجموع الفرعي الخاضع للضريبة:", 540, 350);
      ctx.fillText("1,000.00 ر.س", 140, 350);

      ctx.fillText("ضريبة القيمة المضافة 15%:", 540, 390);
      ctx.fillText("150.00 ر.س", 140, 390);

      ctx.font = "bold 22px sans-serif";
      ctx.fillStyle = "#047857";
      ctx.fillText("الإجمالي النهائي شامل الضريبة:", 540, 440);
      ctx.fillText("1,150.00 ر.س", 140, 440);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText("طريقة الدفع: بطاقة مدى بنكية (**** 8841)", 300, 500);
      ctx.fillText("شكراً لتسوقكم معنا", 300, 530);
    } else if (type === "fuel") {
      ctx.fillText("محطة ساسكو للوقود SASCO", 300, 70);
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("إيصال وقود - مضخة رقم 04", 300, 105);
      ctx.fillText("الرقم الضريبي: 300189201900003", 300, 130);
      ctx.fillText("التاريخ: 2026-09-14 04:15 PM", 300, 155);

      ctx.font = "18px sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("بنزين 95 ممتاز - سيارة الشركة", 540, 230);
      ctx.fillText("200.00 ر.س", 140, 230);

      ctx.fillText("المبلغ الصافي: 173.91 ر.س", 540, 280);
      ctx.fillText("ضريبة القيمة المضافة 15%: 26.09 ر.س", 540, 320);

      ctx.font = "bold 22px sans-serif";
      ctx.fillStyle = "#047857";
      ctx.fillText("المبلغ الإجمالي المدفوع: 200.00 ر.س", 540, 370);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText("سداد: Apple Pay", 300, 430);
    } else {
      ctx.fillText("شركة التموين المكتبي المتطورة", 300, 70);
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("فاتورة بيع رقم: 2026-4401", 300, 105);
      ctx.fillText("الرقم الضريبي: 310892018200003", 300, 130);
      ctx.fillText("التاريخ: 2026-09-13", 300, 155);

      ctx.font = "18px sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("ورق طباعة A4 فاخر (5 كراتين)", 540, 220);
      ctx.fillText("350.00 ر.س", 140, 220);

      ctx.fillText("أحبار طابعات ليزر ملونة", 540, 270);
      ctx.fillText("550.00 ر.س", 140, 270);

      ctx.fillText("الصافي: 900.00 ر.س | الضريبة: 135.00 ر.س", 540, 330);
      ctx.font = "bold 22px sans-serif";
      ctx.fillStyle = "#047857";
      ctx.fillText("الإجمالي: 1,035.00 ر.س", 540, 380);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText("سداد: تحويل بنكي", 300, 440);
    }

    const dataUrl = canvas.toDataURL("image/png");
    setMimeType("image/png");
    setSelectedImage(dataUrl);
    setExtractedData(null);
    setError(null);
  };

  const handleScanReceipt = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          defaultVatRate: companyProfile.defaultVatRate || 15,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "فشل مسح الإيصال واستخراج البيانات");
      }

      setExtractedData(resData.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء قراءة الفاتورة الذكية");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveToLedger = () => {
    if (!extractedData) return;

    const total = Number(extractedData.totalAmount) || 0;
    const vatRate = Number(extractedData.vatRate) ?? 15;
    let net = Number(extractedData.subtotal);
    let vat = Number(extractedData.vatAmount);

    if (!net || isNaN(net)) {
      net = Math.round((total / (1 + vatRate / 100)) * 100) / 100;
      vat = Math.round((total - net) * 100) / 100;
    }

    const tx: Transaction = {
      id: `tx-ocr-${Date.now()}`,
      date: extractedData.date || new Date().toISOString().split("T")[0],
      description: `فاتورة ${extractedData.vendor || "مشتريات"} - ${extractedData.description || "مصروف"}`,
      type: "expense",
      amount: total,
      vatRate,
      vatAmount: vat,
      netAmount: net,
      category: extractedData.category || "مصروفات عامة",
      paymentMethod: extractedData.paymentMethod === "cash" ? "cash" : "card",
      party: extractedData.vendor || undefined,
      referenceNo: extractedData.invoiceNumber || undefined,
      debitAccount: `مصروفات ${extractedData.category || "عامة"}`,
      creditAccount: extractedData.paymentMethod === "cash" ? "صندوق النقدية" : "البنك / البطاقة",
      notes: extractedData.taxId ? `الرقم الضريبي للمورد: ${extractedData.taxId}` : undefined,
      status: "completed",
    };

    onSaveTransaction(tx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">مسح الإيصالات والفواتير الذكي</h2>
              <p className="text-xs text-emerald-100">
                ارفع صورة أي إيصال أو فاتورة وسيتولى Gemini استخراج البنود والضريبة وإدراجها بالدفتر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preset sample buttons */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            <span className="font-bold text-slate-800">تجربة سريعة بفواتير جاهزة:</span>
            <button
              type="button"
              onClick={() => generateSampleReceipt("tech")}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg transition-colors cursor-pointer font-medium"
            >
              📄 إيصال مكتبة جرير (أجهزة)
            </button>
            <button
              type="button"
              onClick={() => generateSampleReceipt("fuel")}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg transition-colors cursor-pointer font-medium"
            >
              ⛽ إيصال محطة وقود (سفريات)
            </button>
            <button
              type="button"
              onClick={() => generateSampleReceipt("office")}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg transition-colors cursor-pointer font-medium"
            >
              📦 فاتورة أدوات مكتبية
            </button>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              selectedImage
                ? "border-emerald-400 bg-emerald-50/20"
                : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedImage ? (
              <div className="flex flex-col items-center">
                <div className="relative max-h-56 max-w-sm rounded-lg overflow-hidden border border-slate-200 shadow-sm mb-3">
                  <img src={selectedImage} alt="Receipt preview" className="object-contain max-h-56" />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  انقر لاختيار صورة أخرى أو اسحب ملفًا جديدًا هنا
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  اسحب وأفلت صورة الإيصال أو الفاتورة هنا
                </p>
                <p className="text-xs text-slate-500">يدعم صيغ JPG، PNG، WebP</p>
              </div>
            )}
          </div>

          {/* Action to scan */}
          {selectedImage && !extractedData && (
            <div className="flex justify-center">
              <button
                type="button"
                id="btn-ocr-scan"
                disabled={isScanning}
                onClick={handleScanReceipt}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري فحص الإيصال واستخراج البنود...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span>بدء المسح والاستخراج الذكي (OCR)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Extracted Data Result */}
          {extractedData && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    تم استخراج بيانات الفاتورة بنجاح:
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  مطابق لمعايير المحاسبة
                </span>
              </div>

              {/* Grid of basic details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> المتجر / المورد:
                  </span>
                  <span className="font-bold text-slate-900">{extractedData.vendor || "غير محدد"}</span>
                  {extractedData.taxId && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      ضريبي: {extractedData.taxId}
                    </span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> تاريخ الفاتورة:
                  </span>
                  <span className="font-bold text-slate-900">{extractedData.date || "اليوم"}</span>
                  {extractedData.invoiceNumber && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      رقم: {extractedData.invoiceNumber}
                    </span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5" /> التصنيف المقترح:
                  </span>
                  <span className="font-bold text-emerald-800">{extractedData.category || "مصروفات"}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    الدفع: {extractedData.paymentMethod || "بطاقة"}
                  </span>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                  <span className="text-emerald-900 block mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> الإجمالي النهائي:
                  </span>
                  <span className="font-extrabold text-sm text-emerald-900">
                    {formatCurrency(Number(extractedData.totalAmount) || 0, companyProfile.currency)}
                  </span>
                  <span className="block text-[10px] text-emerald-700 mt-0.5">
                    الضريبة (15%): {formatCurrency(Number(extractedData.vatAmount) || 0, companyProfile.currency)}
                  </span>
                </div>
              </div>

              {/* Items breakdown if present */}
              {extractedData.items && extractedData.items.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    قائمة البنود المستخرجة:
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 pb-1">
                          <th className="py-1">البند</th>
                          <th className="py-1">الكمية</th>
                          <th className="py-1">السعر</th>
                          <th className="py-1">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-50 text-slate-700">
                            <td className="py-1.5 font-medium">{item.name || item.description}</td>
                            <td className="py-1.5">{item.quantity || 1}</td>
                            <td className="py-1.5">{item.unitPrice || "-"}</td>
                            <td className="py-1.5 font-semibold text-slate-900">{item.total || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action: Add to ledger */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  إعادة المحاولة
                </button>
                <button
                  type="button"
                  id="btn-confirm-ocr-save"
                  onClick={handleSaveToLedger}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وإدراج في دفتر القيود</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
