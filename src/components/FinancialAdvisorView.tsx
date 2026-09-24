import React, { useState, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { AdvisorMessage, CompanyProfile, FinancialSummary, Transaction } from "../types";

interface FinancialAdvisorViewProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  companyProfile: CompanyProfile;
}

export const FinancialAdvisorView: React.FC<FinancialAdvisorViewProps> = ({
  summary,
  transactions,
  companyProfile,
}) => {
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<any | null>(null);

  const quickQuestions = [
    "هل الوضع المالي للمنشأة صحي هذا الشهر؟",
    "ما هو موقفي من ضريبة القيمة المضافة وكيف أعد الإقرار؟",
    "ما هي أكثر بنود المصروفات استنزافاً للأرباح؟",
    "كيف أحسن تحصيل الديون ومستحقات العملاء المتأخرة؟",
  ];

  const fetchAuditAnalysis = async (userQuery?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          recentTransactions: transactions.slice(0, 15),
          companyProfile,
          query: userQuery,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "فشل الاتصال بالمستشار المالي");
      }

      const data = resData.data;
      setAuditData(data);

      const aiMsg: AdvisorMessage = {
        id: `msg-${Date.now()}`,
        sender: "ai",
        text: data.analysisText,
        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        recommendations: data.recommendations,
        metrics: data.metrics,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: AdvisorMessage = {
        id: `msg-${Date.now()}`,
        sender: "ai",
        text: "عذراً، حدث خطأ أثناء إعداد التحليل المالي. يرجى المحاولة مرة أخرى.",
        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial auto-audit if empty
    if (messages.length === 0) {
      fetchAuditAnalysis();
    }
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const query = inputText.trim();
    const userMsg: AdvisorMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    fetchAuditAnalysis(query);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">المستشار المالي والمحاسب الذكي (CPA)</h2>
              <span className="text-[10px] bg-teal-400/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-400/30">
                تدقيق حي مباشر
              </span>
            </div>
            <p className="text-xs text-slate-300">
              تحليل تلقائي متقدم للسيولة وهوامش الربح والالتزامات الضريبية وتوجيهات عملية لدعم قراراتك
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAuditAnalysis("إعادة التدقيق المالي الشامل وتحديث التقرير")}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>إعادة التدقيق</span>
        </button>
      </div>

      {/* Health Metrics from AI */}
      {auditData?.metrics && auditData.metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {auditData.metrics.map((m: any, idx: number) => {
            const isGood = m.status === "good";
            const isAlert = m.status === "alert";
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border bg-white shadow-xs ${
                  isGood
                    ? "border-emerald-200"
                    : isAlert
                    ? "border-rose-200"
                    : "border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>{m.label}</span>
                  {isGood ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isAlert ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isGood
                      ? "text-emerald-700"
                      : isAlert
                      ? "text-rose-600"
                      : "text-amber-700"
                  }`}
                >
                  {m.value}
                </div>
                <span className="text-[10px] text-slate-400">
                  {isGood ? "مؤشر صحي ممتاز" : isAlert ? "يتطلب تدخلاً عاجلاً" : "بحاجة لمراقبة"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tax & VAT Advice Alert Card */}
      {auditData?.vatAdvice && (
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <FileCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">نصيحة الإقرار وضريبة القيمة المضافة:</span>
            <p className="leading-relaxed">{auditData.vatAdvice}</p>
          </div>
        </div>
      )}

      {/* Q&A Chat Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            محادثة المستشار المالي (اسأل عن أي مسألة محاسبية أو ضريبية)
          </span>
          <span className="text-[11px] text-slate-500">Gemini 3.8 Flash</span>
        </div>

        {/* Messages feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {msg.sender === "user" ? "أنت" : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                  msg.sender === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-800"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Recommendations bullet list */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                    <span className="font-bold text-emerald-800 block">
                      التوصيات المحاسبية المقترحة:
                    </span>
                    <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-700">
                      {msg.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 block text-left">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-2 text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>المحاسب الذكي يعكف على تدقيق الحسابات وإعداد التقرير...</span>
              </div>
            </div>
          )}
        </div>

        {/* Preset quick questions chips */}
        <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-400 self-center">أسئلة شائعة:</span>
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setInputText(q);
              }}
              className="text-[11px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex gap-2 bg-white">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="اكتب استشارتك المالية أو المحاسبية هنا..."
            className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال</span>
          </button>
        </form>
      </div>
    </div>
  );
};
