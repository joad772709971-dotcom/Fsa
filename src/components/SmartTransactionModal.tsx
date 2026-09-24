import React, { useState } from "react";
import {
  Sparkles,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Building,
  CreditCard,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { CompanyProfile, PaymentMethod, Transaction, TransactionType } from "../types";
import { standardCategories } from "../data/initialData";
import { formatCurrency } from "../lib/storage";
import { getTodayDateString } from "../utils/dateHelper";

interface SmartTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  companyProfile: CompanyProfile;
}

export const SmartTransactionModal: React.FC<SmartTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companyProfile,
}) => {
  const [naturalText, setNaturalText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<number | "">("");
  const [vatRate, setVatRate] = useState<number>(companyProfile.defaultVatRate || 15);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [netAmount, setNetAmount] = useState<number>(0);
  const [category, setCategory] = useState("مصروفات تشغيلية");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [party, setParty] = useState("");
  const [debitAccount, setDebitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState("");
  const [parsedOnce, setParsedOnce] = useState(false);

  if (!isOpen) return null;

  const examplePrompts = [
    "شراء أدوات مكتبية بـ 460 ريال شامل الضريبة نقداً من المكتبة",
    "استلمنا 11,500 ريال من شركة الأمل مقابل تطوير موقع تحويل بنكي",
    "شراء مستلزمات ونظافة للمحل 850 ريال نقداً",
    "شراء بضاعة بالآجل من المورد أحمد بقيمة 6,900 ريال مع ضريبة 15%",
  ];

  const handleAmountChange = (newTotal: number, newVatRate: number) => {
    setAmount(newTotal);
    setVatRate(newVatRate);
    if (!newTotal || isNaN(newTotal)) {
      setNetAmount(0);
      setVatAmount(0);
      return;
    }
    if (newVatRate > 0) {
      const net = Math.round((newTotal / (1 + newVatRate / 100)) * 100) / 100;
      const vat = Math.round((newTotal - net) * 100) / 100;
      setNetAmount(net);
      setVatAmount(vat);
    } else {
      setNetAmount(newTotal);
      setVatAmount(0);
    }
  };

  const handleAiParse = async (textToParse = naturalText) => {
    if (!textToParse.trim()) {
      setError("يرجى إدخال وصف المعاملة المالية للتحليل");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/parse-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToParse,
          defaultVatRate: companyProfile.defaultVatRate || 15,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "تعذر تحليل المعاملة");
      }

      const data = resData.data;
      setDescription(data.description || textToParse);
      setType(data.type || "expense");
      const parsedAmount = Number(data.amount) || 0;
      const parsedVatRate = Number(data.vatRate) ?? 15;
      setAmount(parsedAmount);
      setVatRate(parsedVatRate);
      setVatAmount(Number(data.vatAmount) || 0);
      setNetAmount(Number(data.netAmount) || parsedAmount);
      setCategory(data.category || "مصروفات عامة");
      setPaymentMethod(data.paymentMethod || "bank");
      setParty(data.party || "");
      setDebitAccount(data.debitAccount || "");
      setCreditAccount(data.creditAccount || "");
      setNotes(data.notes || "");
      setParsedOnce(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء الاتصال بالمحاسب الذكي");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("يرجى إدخال وصف المعاملة");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("يرجى إدخال مبلغ صحيح");
      return;
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date,
      description,
      type,
      amount: Number(amount),
      vatRate,
      vatAmount,
      netAmount,
      category,
      paymentMethod,
      party: party.trim() || undefined,
      debitAccount: debitAccount.trim() || undefined,
      creditAccount: creditAccount.trim() || undefined,
      notes: notes.trim() || undefined,
      status: "completed",
    };

    onSave(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تسجيل ذكي بالذكاء الاصطناعي</h2>
              <p className="text-xs text-slate-300">
                اكتب المعاملة بلغتك الطبيعية وسيقوم المحاسب الذكي بإعداد القيد وحساب الضريبة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Natural Language Prompt Input */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              اكتب ما حدث باللغة الطبيعية (العامية أو الفصحى):
            </label>
            <div className="flex gap-2">
              <textarea
                id="smart-input-textarea"
                rows={2}
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder="مثال: اشترينا اليوم كراسي جديدة للمكتب بـ 2300 ريال بالبطاقة شامل الضريبة..."
                className="w-full text-sm bg-white border border-emerald-300 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAiParse();
                  }
                }}
              />
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <span className="text-[11px] text-slate-500 font-medium ml-1">أمثلة سريعة:</span>
              {examplePrompts.map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setNaturalText(example);
                    handleAiParse(example);
                  }}
                  className="text-xs bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer text-right"
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Parse button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                id="btn-trigger-ai-parse"
                disabled={isLoading || !naturalText.trim()}
                onClick={() => handleAiParse()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري التحليل المحاسبي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>تحليل المعاملة وتوليد القيد</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {parsedOnce && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
              <span>
                تم تحليل المعاملة وإعداد القيد المحاسبي المزدوج. يمكنك مراجعة وتعديل أي بيان قبل الحفظ.
              </span>
            </div>
          )}

          {/* Form fields for review & adjustment */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  بيان المعاملة (الوصف) *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف المعاملة المالية..."
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نوع المعاملة *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
                >
                  <option value="expense">مصروف (Expense)</option>
                  <option value="income">إيراد (Income)</option>
                  <option value="receivable">ذمة مدينة / مستحق على عميل</option>
                  <option value="payable">ذمة دائنة / مستحق لمورد</option>
                </select>
              </div>
            </div>

            {/* Financial Calculations: Amount, VAT, Net */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-slate-500" />
                  المبلغ الإجمالي ({companyProfile.currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  value={amount}
                  onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0, vatRate)}
                  placeholder="0.00"
                  className="w-full text-sm font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نسبة الضريبة (VAT %)
                </label>
                <select
                  value={vatRate}
                  onChange={(e) => handleAmountChange(Number(amount) || 0, parseFloat(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white"
                >
                  <option value="15">15% (النسبة الأساسية)</option>
                  <option value="5">5% (نسبة مخفضة)</option>
                  <option value="0">0% (معفى / صفري)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  تفصيل الضريبة والصافي
                </label>
                <div className="text-xs space-y-0.5 pt-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>الصافي:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(netAmount, companyProfile.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>قيمة الضريبة:</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(vatAmount, companyProfile.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  التصنيف المحاسبي *
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white"
                />
                <datalist id="category-suggestions">
                  {standardCategories.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  طريقة السداد / الحساب *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white"
                >
                  <option value="bank">تحويل بنكي / حساب جاري</option>
                  <option value="card">بطاقة بنكية / مدى / ائتمان</option>
                  <option value="cash">نقداً من الخزينة (الصندوق)</option>
                  <option value="credit">آجل (على الحساب / ذمة)</option>
                </select>
              </div>
            </div>

            {/* Party & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  الطرف الثاني (العميل / المورد / الجهة)
                </label>
                <input
                  type="text"
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  placeholder="اسم العميل أو المتجر أو المورد..."
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ المعاملة
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            {/* Accounting Double Entry (الطرف المدين والدائن) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>أطراف القيد المحاسبي المزدوج (Double-Entry Ledger):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">الطرف المدين (من حـ/):</span>
                  <input
                    type="text"
                    value={debitAccount}
                    onChange={(e) => setDebitAccount(e.target.value)}
                    placeholder={type === "expense" ? "حـ/ المصروفات" : "حـ/ البنك أو الصندوق"}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">الطرف الدائن (إلى حـ/):</span>
                  <input
                    type="text"
                    value={creditAccount}
                    onChange={(e) => setCreditAccount(e.target.value)}
                    placeholder={type === "expense" ? "حـ/ البنك أو الصندوق" : "حـ/ الإيرادات والمبيعات"}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                id="btn-save-transaction"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ المعاملة في الدفتر</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
