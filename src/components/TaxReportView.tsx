import React from "react";
import {
  FileCheck2,
  Printer,
  Calendar,
  AlertCircle,
  Building,
  CheckCircle2,
  Download,
  Info,
} from "lucide-react";
import { CompanyProfile, FinancialSummary, Transaction } from "../types";
import { formatCurrency } from "../lib/storage";

interface TaxReportViewProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  companyProfile: CompanyProfile;
}

export const TaxReportView: React.FC<TaxReportViewProps> = ({
  summary,
  transactions,
  companyProfile,
}) => {
  // Current Quarter
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();

  // Transactions with VAT
  const salesWithVat = transactions.filter((t) => t.type === "income" && t.vatAmount > 0);
  const purchasesWithVat = transactions.filter((t) => t.type === "expense" && t.vatAmount > 0);

  const printTaxReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              مسودة إقرار ضريبة القيمة المضافة (VAT Return)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            حسابات معتمدة لضريبة المخرجات والمدخلات متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={printTaxReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإقرار الضريبي</span>
          </button>
        </div>
      </div>

      {/* Tax Period Meta Card */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 text-xs">
        <div>
          <span className="text-emerald-900 font-bold block mb-1">
            الفترة الضريبية الحالية: الربع {currentQuarter} لسنة {year}
          </span>
          <span className="text-slate-600">
            المنشأة: <strong>{companyProfile.name}</strong> | الرقم الضريبي:{" "}
            <strong>{companyProfile.taxNumber}</strong>
          </span>
        </div>
        <div className="text-left">
          <span className="text-slate-500 block">تاريخ إعداد المسودة:</span>
          <span className="font-semibold text-slate-800">{new Date().toLocaleDateString("ar-SA")}</span>
        </div>
      </div>

      {/* Main Tax Schedule Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="bg-slate-900 text-white p-3 font-bold flex justify-between items-center">
          <span>جدول الإقرار الضريبي المعتمد (النسبة الأساسية 15%)</span>
          <span className="text-xs font-normal text-emerald-300">العملة: {companyProfile.currency}</span>
        </div>

        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-2.5 px-4 w-12">البند</th>
              <th className="py-2.5 px-4">بيان المعاملة الخاضعة للضريبة</th>
              <th className="py-2.5 px-4 text-left">المبلغ الصافي (الأساس)</th>
              <th className="py-2.5 px-4 text-left">مبلغ الضريبة (15%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Sales (Output VAT) */}
            <tr className="bg-slate-50/50 font-bold text-slate-900">
              <td colSpan={4} className="py-2 px-4 text-emerald-800">
                أولاً: المبيعات والإيرادات (ضريبة المخرجات)
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-slate-400">1</td>
              <td className="py-3 px-4 font-medium text-slate-800">
                المبيعات الخاضعة للنسبة الأساسية (15%)
                <span className="block text-[10px] text-slate-400">
                  عدد الفواتير الخاضعة: {salesWithVat.length}
                </span>
              </td>
              <td className="py-3 px-4 text-left font-semibold text-slate-800">
                {formatCurrency(summary.totalIncome, companyProfile.currency)}
              </td>
              <td className="py-3 px-4 text-left font-bold text-emerald-700">
                {formatCurrency(summary.collectedVat, companyProfile.currency)}
              </td>
            </tr>
            <tr className="bg-emerald-50/30 font-semibold text-emerald-900">
              <td className="py-2 px-4"></td>
              <td className="py-2 px-4">إجمالي ضريبة المخرجات المحصلة</td>
              <td className="py-2 px-4 text-left">
                {formatCurrency(summary.totalIncome, companyProfile.currency)}
              </td>
              <td className="py-2 px-4 text-left font-extrabold">
                {formatCurrency(summary.collectedVat, companyProfile.currency)}
              </td>
            </tr>

            {/* Purchases (Input VAT) */}
            <tr className="bg-slate-50/50 font-bold text-slate-900">
              <td colSpan={4} className="py-2 px-4 text-slate-700">
                ثانياً: المشتريات والمصروفات (ضريبة المدخلات القابلة للخصم)
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-slate-400">2</td>
              <td className="py-3 px-4 font-medium text-slate-800">
                المشتريات المحلية والمصروفات الخاضعة للنسبة الأساسية (15%)
                <span className="block text-[10px] text-slate-400">
                  عدد القيود الضريبية: {purchasesWithVat.length}
                </span>
              </td>
              <td className="py-3 px-4 text-left font-semibold text-slate-800">
                {formatCurrency(summary.totalExpense, companyProfile.currency)}
              </td>
              <td className="py-3 px-4 text-left font-bold text-rose-700">
                {formatCurrency(summary.paidVat, companyProfile.currency)}
              </td>
            </tr>
            <tr className="bg-slate-50 font-semibold text-slate-800">
              <td className="py-2 px-4"></td>
              <td className="py-2 px-4">إجمالي ضريبة المدخلات القابلة للخصم</td>
              <td className="py-2 px-4 text-left">
                {formatCurrency(summary.totalExpense, companyProfile.currency)}
              </td>
              <td className="py-2 px-4 text-left font-extrabold text-rose-700">
                {formatCurrency(summary.paidVat, companyProfile.currency)}
              </td>
            </tr>

            {/* Net VAT Due */}
            <tr className="bg-slate-900 text-white font-extrabold text-sm">
              <td className="py-4 px-4 text-center">3</td>
              <td className="py-4 px-4">
                صافي الضريبة المستحقة للسداد للهيئة (أو رصيد دائن مسترد)
                <span className="block text-[10px] text-slate-300 font-normal">
                  (ضريبة المخرجات - ضريبة المدخلات)
                </span>
              </td>
              <td className="py-4 px-4 text-left font-normal text-xs text-slate-300">
                الفرق بين الإيراد والمصروف: {formatCurrency(summary.netProfit, companyProfile.currency)}
              </td>
              <td className="py-4 px-4 text-left text-emerald-400 text-base">
                {formatCurrency(summary.netVatDue, companyProfile.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Guidance Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 block">إرشادات المحاسب القانوني:</span>
          <p>
            1. يجب سداد صافي الضريبة المستحقة قبل نهاية الشهر التالي لانتهاء الفترة الضريبية لتفادي
            غرامات التأخير.
          </p>
          <p>
            2. تأكد من الاحتفاظ بجميع الفواتير الضريبية المبسطة والإلكترونية لمدة 6 سنوات وفقاً للأنظمة
            المالية.
          </p>
        </div>
      </div>
    </div>
  );
};
