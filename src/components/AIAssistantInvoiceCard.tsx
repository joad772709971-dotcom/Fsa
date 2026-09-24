import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Hash,
  DollarSign,
  Package,
  Layers,
  Edit3,
  ExternalLink,
  Volume2,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { ScannedInvoiceResult } from '../types';

export interface ChatScannedInvoiceData {
  invoice: ScannedInvoiceResult;
  isApproved?: boolean;
  approvedTxId?: string;
}

interface Props {
  data: ChatScannedInvoiceData;
  onOpenVerificationModal: (invoice: ScannedInvoiceResult) => void;
  onPlayVoice: (text: string) => void;
}

export const AIAssistantInvoiceCard: React.FC<Props> = ({
  data,
  onOpenVerificationModal,
  onPlayVoice,
}) => {
  const { invoice, isApproved } = data;

  const handleVoiceSummary = () => {
    const text = `فاتورة مشتريات من مؤسسة ${invoice.supplierName || 'المورد'}. إجمالي الفاتورة ${invoice.totalAmount.toLocaleString('ar-YE')} ريال بعدد ${invoice.items.length} أصناف، والمدفوع ${invoice.paidAmount.toLocaleString('ar-YE')} ريال، والمتبقي ${invoice.remainingBalance.toLocaleString('ar-YE')} ريال.`;
    onPlayVoice(text);
  };

  return (
    <div className="mt-3 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-500/30 p-4 shadow-xl overflow-hidden animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">{invoice.supplierName || 'فاتورة مشتريات'}</h4>
              {isApproved ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>معتمدة ومرحلة للمخزن</span>
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>بانتظار المراجعة والاعتماد</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              رقم الفاتورة: #{invoice.invoiceNumber || '---'} • التاريخ: {invoice.invoiceDate || '---'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleVoiceSummary}
          className="p-2 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-xl border border-emerald-400/30 transition-all cursor-pointer flex items-center gap-1.5 text-xs"
          title="استماع صوتي للملخص"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">نطق</span>
        </button>
      </div>

      {/* Invoice Details Layout (Thumbnail & Key Financials) */}
      <div className="mt-3.5 flex flex-col sm:flex-row gap-3 items-start">
        {/* Thumbnail Preview */}
        {invoice.imageBase64 && (
          <div
            onClick={() => onOpenVerificationModal(invoice)}
            className="w-full sm:w-28 h-28 rounded-xl overflow-hidden border border-white/10 bg-black/40 shrink-0 relative group cursor-pointer"
            title="انقر لتكبير ومعاينة صورة الفاتورة"
          >
            <img
              src={invoice.imageBase64}
              alt="صورة الفاتورة"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] px-1.5 py-0.5 rounded text-slate-200">
              مخطوطة اليد
            </span>
          </div>
        )}

        {/* Financial KPIs */}
        <div className="flex-1 grid grid-cols-3 gap-2 w-full">
          <div className="bg-black/30 rounded-xl p-2 border border-white/5">
            <span className="text-[10px] text-slate-400 block">إجمالي الفاتورة:</span>
            <span className="font-bold text-sm sm:text-base text-white font-mono">
              {invoice.totalAmount.toLocaleString('ar-YE')}{' '}
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </span>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-300 block">المدفوع نقداً:</span>
            <span className="font-bold text-sm sm:text-base text-emerald-400 font-mono">
              {invoice.paidAmount.toLocaleString('ar-YE')}{' '}
              <span className="text-[10px] text-emerald-300">ر.ي</span>
            </span>
          </div>

          <div className="bg-rose-950/40 rounded-xl p-2 border border-rose-500/20">
            <span className="text-[10px] text-rose-300 block">المتبقي (آجل للمورد):</span>
            <span className="font-bold text-sm sm:text-base text-rose-400 font-mono">
              {invoice.remainingBalance.toLocaleString('ar-YE')}{' '}
              <span className="text-[10px] text-rose-300">ر.ي</span>
            </span>
          </div>
        </div>
      </div>

      {/* Extracted Line Items Preview */}
      <div className="mt-3 bg-black/20 rounded-xl p-2.5 border border-white/5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-bold text-slate-300">الأصناف المستخرجة ({invoice.items.length} صنف):</span>
          <span className="text-[10px] text-emerald-400">تم التحليل عبر Gemini OCR للخط اليدوي</span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar text-xs">
          {invoice.items.map((it, idx) => (
            <div
              key={it.id || idx}
              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/5 text-slate-200"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-slate-500 font-mono text-[10px]">{idx + 1}.</span>
                <span className="font-bold truncate text-white">{it.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  ({it.quantity} × {it.unitCost} ر.ي)
                </span>
              </div>
              <span className="font-bold font-mono text-emerald-300 shrink-0">
                {it.totalCost.toLocaleString()} ر.ي
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
        {isApproved ? (
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>تم ترحيل الفاتورة وإدراج الأصناف في المخزن وحساب المورد بنجاح</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpenVerificationModal(invoice)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>مراجعة وتعديل بنود الفاتورة والموافقة للترحيل للمخزن</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenVerificationModal(invoice)}
          className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
        >
          عرض تفاصيل الفاتورة
        </button>
      </div>
    </div>
  );
};
