import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Share2,
  Download,
  CheckCircle,
  FileCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '../types';
import { exportMonthlyDocReport } from '../utils/docExport';
import { exportToExcel } from '../utils/excelExport';
import { calculateMonthlySettlement, formatCurrency } from '../utils/calculations';
import { printHtmlElement } from '../utils/printHelper';

interface ExportReportsViewProps {
  transactions: Transaction[];
  currentMonth: string;
}

export const ExportReportsView: React.FC<ExportReportsViewProps> = ({
  transactions,
  currentMonth,
}) => {
  const [shopOwner, setShopOwner] = useState('مصعب الصوفي');
  const [copiedLink, setCopiedLink] = useState(false);

  const settlement = calculateMonthlySettlement(currentMonth, transactions);

  const handleExportDoc = () => {
    exportMonthlyDocReport(currentMonth, transactions, shopOwner);
  };

  const handleExportExcel = () => {
    exportToExcel(currentMonth, transactions, shopOwner);
  };

  const handleDirectPrint = () => {
    const reportHtml = `
      <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif;">
        <div style="text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="color: #1e3a8a; font-size: 20pt; margin: 0 0 6px 0;">محل ${shopOwner} للجوالات والصيانة</h1>
          <h2 style="color: #047857; font-size: 14pt; margin: 0;">كشف حساب وتصفية الشهر (${settlement.monthName})</h2>
          <p style="font-size: 11pt; color: #64748b; margin: 4px 0 0 0;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-YE')}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11pt;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #1e293b;">
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">البيان المالي</th>
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; width: 220px;">المبلغ (ر.ي)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="border: 1px solid #cbd5e1; padding: 8px 12px;">إجمالي المبيعات</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-weight: bold;">${formatCurrency(settlement.totalSales)}</td></tr>
            <tr><td style="border: 1px solid #cbd5e1; padding: 8px 12px;">إجمالي المشتريات</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center;">${formatCurrency(settlement.totalPurchases)}</td></tr>
            <tr><td style="border: 1px solid #cbd5e1; padding: 8px 12px;">إجمالي المصاريف والخرج</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; color: #dc2626;">${formatCurrency(settlement.totalExpenses)}</td></tr>
            <tr><td style="border: 1px solid #cbd5e1; padding: 8px 12px;">إجمالي الصيانة المقبوضة</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-weight: bold; color: #059669;">${formatCurrency(settlement.totalMaintenance)}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="border: 1px solid #cbd5e1; padding: 8px 12px;">مستحق مهندس الصيانة (50%)</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center;">${formatCurrency(settlement.engineerTotalShare)}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="border: 1px solid #cbd5e1; padding: 8px 12px;">سحوبات المهندس المخصومة</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; color: #dc2626;">${formatCurrency(settlement.engineerTotalWithdrawals)}</td></tr>
            <tr style="background-color: #ecfdf5;"><td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold;">صافي أرباح المحل القابلة للقسمة</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-weight: bold; color: #047857;">${formatCurrency(settlement.shopNetDistributable)}</td></tr>
            <tr style="background-color: #fef08a;"><td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold;">حصة المالك مصعب الصوفي (ثلثين 2/3)</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-weight: bold;">${formatCurrency(settlement.mosaabTotalShare)}</td></tr>
            <tr style="background-color: #fef08a;"><td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold;">حصة المدير المستلم (ثلث 1/3)</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-weight: bold;">${formatCurrency(settlement.managerTotalShare)}</td></tr>
            <tr><td style="border: 1px solid #cbd5e1; padding: 8px 12px;">صرفة بيت مصعب الشخصية</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; color: #dc2626;">${formatCurrency(settlement.mosaabTotalHomeExpenses)}</td></tr>
            <tr><td style="border: 1px solid #cbd5e1; padding: 8px 12px;">سحوبات مصعب النقدية</td><td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; color: #dc2626;">${formatCurrency(settlement.mosaabTotalWithdrawals)}</td></tr>
            <tr style="background-color: #10b981; color: white; font-weight: bold; font-size: 13pt;"><td style="border: 2px solid #047857; padding: 12px;">صافي المستحق النهائي للمالك مصعب</td><td style="border: 2px solid #047857; padding: 12px; text-align: center; font-weight: 900;">${formatCurrency(settlement.mosaabFinalPayable)}</td></tr>
            <tr style="background-color: #0f172a; color: white; font-weight: bold;"><td style="border: 1px solid #334155; padding: 10px;">صافي النقد المتبقي في الدرج</td><td style="border: 1px solid #334155; padding: 10px; text-align: center; color: #38bdf8;">${formatCurrency(settlement.closingCashInDrawer)}</td></tr>
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center;">
          <div style="width: 45%;"><strong>توقيع المدير / المحاسب المستلم</strong><br><br><br>__________________________</div>
          <div style="width: 45%;"><strong>توقيع ومصادقة المالك (مصعب الصوفي)</strong><br><br><br>__________________________</div>
        </div>
      </div>
    `;
    printHtmlElement(reportHtml, `كشف_حساب_وتصفية_${settlement.monthName}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-950/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              التقارير والتصدير وكشوفات الحساب
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تصدير كشف حساب رسمي في جدول Word DOC منظم لإرساله لصاحب المحل (مصعب الصوفي)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportDoc}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-950/20"
          >
            <FileText className="w-4 h-4" />
            <span>تصدير كشف Word Doc فوراً</span>
          </button>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. DOCX Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              كشف الحساب في جدول Word DOC
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              توليد ملف DOC جاهز للفتح في Microsoft Word يحتوي على:
              جداول مفصلة لكل يوم، تصفية كل يوم على حدة، وفي آخر الكشف ورقة تصفية وخلاصة عمل الشهر كامل.
            </p>
          </div>

          <button
            onClick={handleExportDoc}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>تحميل ملف Word (.doc)</span>
          </button>
        </div>

        {/* 2. Excel Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              مصنف Excel كامل (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تصدير الجداول إلى أوراق عمل Excel متكاملة:
              ورقة تصفية الشهر، ورقة سجل الحركات اليومية الكاملة، وورقة تصفية الأيام.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>تحميل مصنف Excel (.xlsx)</span>
          </button>
        </div>

        {/* 3. Direct Print / PDF Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              الطباعة المباشرة و PDF
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              طباعة كشف الحساب وتصفية الشهر بأعلى جودة بتنسيق A4 مناسب للطباعة الورقية أو الحفظ كملف PDF.
            </p>
          </div>

          <button
            onClick={handleDirectPrint}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>معاينة وطباعة / حفظ PDF</span>
          </button>
        </div>

      </div>

      {/* Report Info Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-base text-white mb-1">
            ملخص الكشف الحالي الجاهز للتصدير: شهر ({settlement.monthName})
          </h4>
          <p className="text-xs text-slate-400">
            المالك: <strong>{shopOwner}</strong> • صافي مستحق مصعب النهائي:{' '}
            <strong className="text-emerald-400 font-mono font-bold">
              {formatCurrency(settlement.mosaabFinalPayable)}
            </strong>{' '}
            • كاش الدرج المتراكم:{' '}
            <strong className="text-cyan-400 font-mono font-bold">
              {formatCurrency(settlement.closingCashInDrawer)}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={shopOwner}
            onChange={(e) => setShopOwner(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            placeholder="اسم صاحب المحل"
          />
        </div>
      </div>
    </div>
  );
};
