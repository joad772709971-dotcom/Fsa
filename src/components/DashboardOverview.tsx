import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  FileCheck2,
  Users,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Receipt,
  ScanLine,
  Bot,
  PlusCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { CompanyProfile, FinancialSummary, Transaction } from "../types";
import { formatCurrency } from "../lib/storage";

interface DashboardOverviewProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  companyProfile: CompanyProfile;
  onOpenSmartModal: () => void;
  onOpenScanner: () => void;
  onNavigateToInvoices: () => void;
  onNavigateToAdvisor: () => void;
  onNavigateToTransactions: () => void;
  onQuickNaturalTextSubmit: (text: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  summary,
  transactions,
  companyProfile,
  onOpenSmartModal,
  onOpenScanner,
  onNavigateToInvoices,
  onNavigateToAdvisor,
  onNavigateToTransactions,
  onQuickNaturalTextSubmit,
}) => {
  const [quickText, setQuickText] = useState("");

  // Profit Margin
  const profitMargin =
    summary.totalIncome > 0
      ? Math.round((summary.netProfit / summary.totalIncome) * 100)
      : 0;

  // Calculate expense categories for progress bars
  const expenseCategoriesMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === "expense" && t.status !== "cancelled")
    .forEach((t) => {
      const cat = t.category || "أخرى";
      expenseCategoriesMap[cat] = (expenseCategoriesMap[cat] || 0) + t.netAmount;
    });

  const sortedCategories = Object.entries(expenseCategoriesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalExpenseNet = summary.totalExpense || 1;

  // Recent 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;
    onQuickNaturalTextSubmit(quickText);
    setQuickText("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner & Quick AI Bar */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                لوحة التحكم المحاسبية
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString("ar-SA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white pt-1">
              مرحباً بك في {companyProfile.name}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              محاسبك الذكي جاهز لإدارة الدفاتر وتوليد القيود المحاسبية، مسح الفواتير، وفحص الإقرار الضريبي بنقرة واحدة.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenSmartModal}
              id="dash-quick-add"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>تسجيل ذكي بالذكاء الاصطناعي</span>
            </button>
            <button
              onClick={onOpenScanner}
              id="dash-quick-scan"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-emerald-300" />
              <span>مسح فاتورة أو إيصال</span>
            </button>
          </div>
        </div>

        {/* Embedded Fast NLP Input right on the banner */}
        <div className="mt-6 pt-5 border-t border-slate-700/60">
          <form onSubmit={handleQuickSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                id="dash-nlp-input"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder="اكتب المعاملة باللغة الطبيعية (مثال: دفعنا 500 ريال صرفة للمحل أو استلمنا 3000 ريال من العميل خالد)..."
                className="w-full bg-slate-800/80 border border-slate-600/80 text-white text-xs sm:text-sm rounded-xl pl-3 pr-4 py-2.5 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
              />
            </div>
            <button
              type="submit"
              id="dash-nlp-submit"
              disabled={!quickText.trim()}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تسجيل فوري</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي الإيرادات (المبيعات)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900">
              {formatCurrency(summary.totalIncome, companyProfile.currency)}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              المبالغ الصافية قبل الضريبة
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المصروفات (التشغيل)</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900">
              {formatCurrency(summary.totalExpense, companyProfile.currency)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              المصروفات والتكاليف المسجلة
            </span>
          </div>
        </div>

        {/* Net Profit & Margin */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">صافي الأرباح (Net Profit)</span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                summary.netProfit >= 0
                  ? "bg-teal-50 text-teal-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-xl font-bold ${
                summary.netProfit >= 0 ? "text-teal-700" : "text-rose-600"
              }`}
            >
              {formatCurrency(summary.netProfit, companyProfile.currency)}
            </div>
            <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-1">
              هامش الربح التشغيلي: <strong className="text-slate-900">{profitMargin}%</strong>
            </span>
          </div>
        </div>

        {/* Available Liquidity (Cash & Bank) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">السيولة المتاحة (النقد والبنك)</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900">
              {formatCurrency(summary.cashBalance + summary.bankBalance, companyProfile.currency)}
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between mt-1">
              <span>بنك: {formatCurrency(summary.bankBalance, companyProfile.currency)}</span>
              <span>صندوق: {formatCurrency(summary.cashBalance, companyProfile.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPI Bar: Tax & Receivables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* VAT Tax Status Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">صافي ضريبة القيمة المضافة المستحقة (VAT)</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(summary.netVatDue, companyProfile.currency)}
              </span>
            </div>
          </div>
          <div className="text-left text-xs text-slate-500">
            <div>مخرجات (مبيعات): {formatCurrency(summary.collectedVat, companyProfile.currency)}</div>
            <div>مدخلات (مشتريات): {formatCurrency(summary.paidVat, companyProfile.currency)}</div>
          </div>
        </div>

        {/* Receivables from Customers */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">ديون ومستحقات على العملاء (ذمم مدينة)</span>
              <span className="text-lg font-bold text-blue-700">
                {formatCurrency(summary.receivablesTotal, companyProfile.currency)}
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateToInvoices}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            متابعة الفواتير
          </button>
        </div>
      </div>

      {/* Two Column Section: Expense Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Expense Categories Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">توزيع المصروفات حسب التصنيف</h3>
            <span className="text-xs text-slate-500">أعلى بنود الإنفاق</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {sortedCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">لا توجد مصروفات مسجلة بعد</p>
            ) : (
              sortedCategories.map(([category, amt], index) => {
                const percentage = Math.round((amt / totalExpenseNet) * 100);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800">{category}</span>
                      <span className="text-slate-600">
                        {formatCurrency(amt, companyProfile.currency)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={onNavigateToAdvisor}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>استشر المحاسب الذكي لترشيد المصروفات</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">أحدث القيود والمعاملات</h3>
              <p className="text-xs text-slate-500">سجل القيود المسجلة مؤخراً بالدفتر</p>
            </div>
            <button
              onClick={onNavigateToTransactions}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              عرض الكل ({transactions.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد معاملات مسجلة</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === "income"
                          ? "bg-emerald-50 text-emerald-600"
                          : tx.type === "expense"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{tx.description}</div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                        {tx.party && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">{tx.party}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <div
                      className={`font-bold ${
                        tx.type === "income"
                          ? "text-emerald-700"
                          : tx.type === "expense"
                          ? "text-slate-900"
                          : "text-blue-700"
                      }`}
                    >
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatCurrency(tx.amount, companyProfile.currency)}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      ضريبة: {formatCurrency(tx.vatAmount, companyProfile.currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onOpenSmartModal}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة قيد جديد بالذكاء الاصطناعي</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
