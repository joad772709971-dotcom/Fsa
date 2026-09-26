import React, { useState } from "react";
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  BookOpen,
  Sparkles,
  CreditCard,
  Building,
} from "lucide-react";
import { CompanyProfile, PaymentMethod, Transaction, TransactionType } from "../types";
import { formatCurrency } from "../lib/storage";

interface TransactionsViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onOpenSmartModal: () => void;
  companyProfile: CompanyProfile;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onDeleteTransaction,
  onOpenSmartModal,
  companyProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [selectedTxForLedger, setSelectedTxForLedger] = useState<Transaction | null>(null);

  // Filter transactions
  const filtered = transactions.filter((t) => {
    if (selectedType !== "all" && t.type !== selectedType) return false;
    if (selectedMethod !== "all" && t.paymentMethod !== selectedMethod) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchParty = t.party?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      const matchRef = t.referenceNo?.toLowerCase().includes(q);
      if (!matchDesc && !matchParty && !matchCat && !matchRef) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = [
      "المعرف",
      "التاريخ",
      "الوصف",
      "النوع",
      "المبلغ الصافي",
      "نسبة الضريبة",
      "قيمة الضريبة",
      "المبلغ الإجمالي",
      "التصنيف",
      "طريقة الدفع",
      "الطرف الثاني",
      "الطرف المدين",
      "الطرف الدائن",
    ];

    const rows = filtered.map((t) => [
      t.id,
      t.date,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.type === "income" ? "إيراد" : t.type === "expense" ? "مصروف" : t.type,
      t.netAmount,
      `${t.vatRate}%`,
      t.vatAmount,
      t.amount,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      t.paymentMethod,
      `"${(t.party || "").replace(/"/g, '""')}"`,
      `"${(t.debitAccount || "").replace(/"/g, '""')}"`,
      `"${(t.creditAccount || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `دفتر_المعاملات_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case "bank":
        return "تحويل بنكي";
      case "card":
        return "بطاقة مدى / ائتمان";
      case "cash":
        return "صندوق النقدية";
      case "credit":
        return "آجل / على الحساب";
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>سجل القيود والمعاملات المحاسبية</span>
          </h2>
          <p className="text-xs text-slate-500">
            دفتر اليومية العامة والقيود المزدوجة ومتابعة حركة النقدية والمصروفات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="تصدير ملف إكسل CSV"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={onOpenSmartModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>إضافة قيد ذكي</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالوصف، العميل، المورد أو التصنيف..."
              className="w-full text-xs pr-9 pl-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white"
            >
              <option value="all">جميع أنواع العمليات</option>
              <option value="income">إيرادات ومبيعات (Income)</option>
              <option value="expense">مصروفات وتكاليف (Expense)</option>
              <option value="receivable">ذمم مدينة (مستحق على عميل)</option>
              <option value="payable">ذمم دائنة (مستحق لمورد)</option>
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white"
            >
              <option value="all">جميع طرق الدفع / الحسابات</option>
              <option value="bank">تحويل بنكي</option>
              <option value="card">بطاقة مدى / ائتمان</option>
              <option value="cash">صندوق النقدية (كاش)</option>
              <option value="credit">آجل / على الحساب</option>
            </select>
          </div>
        </div>

        {/* Count results */}
        <div className="text-[11px] text-slate-400 flex justify-between pt-1">
          <span>
            عرض <strong>{filtered.length}</strong> من أصل {transactions.length} قيد محاسبي
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-emerald-700 hover:underline cursor-pointer"
            >
              مسح البحث
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">بيان القيد / الوصف</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">طريقة السداد</th>
                <th className="py-3 px-4">المبلغ الصافي</th>
                <th className="py-3 px-4">الضريبة (15%)</th>
                <th className="py-3 px-4">الإجمالي</th>
                <th className="py-3 px-4 text-center">القيد المزدوج</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد معاملات مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 line-clamp-1">{tx.description}</div>
                      {tx.party && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{tx.party}</span>
                          {tx.referenceNo && (
                            <span className="text-slate-400">({tx.referenceNo})</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                      {getPaymentMethodLabel(tx.paymentMethod)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {formatCurrency(tx.netAmount ?? tx.amount ?? tx.price ?? 0, companyProfile.currency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {formatCurrency(tx.vatAmount ?? 0, companyProfile.currency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          tx.type === "income"
                            ? "text-emerald-700"
                            : tx.type === "expense"
                            ? "text-slate-900"
                            : "text-blue-700"
                        }`}
                      >
                        {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                        {formatCurrency(tx.amount ?? tx.price ?? 0, companyProfile.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTxForLedger(tx)}
                        className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        title="عرض القيد المزدوج"
                      >
                        <BookOpen className="w-3 h-3 text-emerald-600" />
                        <span>عرض القيد</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="حذف القيد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Double-Entry Ledger Details Modal */}
      {selectedTxForLedger && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>سند القيد المحاسبي المزدوج</span>
              </div>
              <button
                onClick={() => setSelectedTxForLedger(null)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-600 font-medium">
                <strong>البيان:</strong> {selectedTxForLedger.description}
              </div>
              <div className="text-slate-500">
                <strong>التاريخ:</strong> {selectedTxForLedger.date}
              </div>
            </div>

            {/* Accounting Table: Debit & Credit */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-2.5 font-bold text-slate-700 grid grid-cols-3 text-center border-b border-slate-200">
                <span>الحساب (Account)</span>
                <span>مدين (Debit)</span>
                <span>دائن (Credit)</span>
              </div>
              <div className="p-2.5 grid grid-cols-3 text-center border-b border-slate-100 bg-white">
                <span className="font-semibold text-right pr-2">
                  من حـ/ {selectedTxForLedger.debitAccount || "المصروفات"}
                </span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(selectedTxForLedger.amount ?? selectedTxForLedger.price ?? 0, companyProfile.currency)}
                </span>
                <span className="text-slate-300">-</span>
              </div>
              <div className="p-2.5 grid grid-cols-3 text-center bg-slate-50/50">
                <span className="font-semibold text-right pr-2">
                  إلى حـ/ {selectedTxForLedger.creditAccount || "البنك أو الصندوق"}
                </span>
                <span className="text-slate-300">-</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(selectedTxForLedger.amount ?? selectedTxForLedger.price ?? 0, companyProfile.currency)}
                </span>
              </div>
            </div>

            {selectedTxForLedger.notes && (
              <div className="text-[11px] bg-slate-50 p-3 rounded-lg text-slate-600 border border-slate-200">
                <strong>ملاحظات:</strong> {selectedTxForLedger.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTxForLedger(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
