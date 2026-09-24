import React, { useState } from "react";
import {
  ReceiptText,
  Plus,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Trash2,
  QrCode,
  Download,
  X,
  FileText,
} from "lucide-react";
import { CompanyProfile, Invoice, InvoiceItem } from "../types";
import { arabicNumberToWords, formatCurrency } from "../lib/storage";
import { getTodayDateString } from "../utils/dateHelper";

interface InvoicesViewProps {
  invoices: Invoice[];
  onSaveInvoice: (invoice: Invoice) => void;
  onUpdateInvoiceStatus: (id: string, status: "paid" | "unpaid" | "overdue") => void;
  onDeleteInvoice: (id: string) => void;
  companyProfile: CompanyProfile;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onSaveInvoice,
  onUpdateInvoiceStatus,
  onDeleteInvoice,
  companyProfile,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // New Invoice Form State
  const [customerName, setCustomerName] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [issueDate, setIssueDate] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "item-1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      vatRate: companyProfile.defaultVatRate || 15,
      subtotal: 0,
      vatAmount: 0,
      total: 0,
    },
  ]);
  const [notes, setNotes] = useState("شكراً لتعاملكم معنا.");
  const [terms, setTerms] = useState("يُرجى سداد الفاتورة خلال المدة المحددة بموجب العقد.");

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    return true;
  });

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: val };

    const qty = Number(current.quantity) || 0;
    const price = Number(current.unitPrice) || 0;
    const rate = Number(current.vatRate) ?? 15;

    const sub = qty * price;
    const vat = Math.round((sub * (rate / 100)) * 100) / 100;
    const tot = sub + vat;

    current.subtotal = sub;
    current.vatAmount = vat;
    current.total = tot;

    updated[index] = current;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatRate: companyProfile.defaultVatRate || 15,
        subtotal: 0,
        vatAmount: 0,
        total: 0,
      },
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let vatTotal = 0;
    items.forEach((it) => {
      subtotal += it.subtotal;
      vatTotal += it.vatAmount;
    });
    const grandTotal = subtotal + vatTotal;
    return { subtotal, vatTotal, grandTotal };
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const { subtotal, vatTotal, grandTotal } = calculateTotals();

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`,
      issueDate,
      dueDate,
      customerName: customerName.trim(),
      customerTaxId: customerTaxId.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items,
      subtotal,
      vatTotal,
      grandTotal,
      status: "unpaid",
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
    };

    onSaveInvoice(newInvoice);
    setIsCreating(false);
    // Reset form
    setCustomerName("");
    setCustomerTaxId("");
    setCustomerAddress("");
    setCustomerPhone("");
    setItems([
      {
        id: "item-1",
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatRate: companyProfile.defaultVatRate || 15,
        subtotal: 0,
        vatAmount: 0,
        total: 0,
      },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-emerald-600" />
            <span>إدارة الفواتير الضريبية (Simplified Tax Invoices)</span>
          </h2>
          <p className="text-xs text-slate-500">
            إصدار فواتير ضريبية نظامية معتمدة مع حساب ضريبة القيمة المضافة 15% ورمز الاستجابة السريعة
          </p>
        </div>

        <button
          onClick={() => {
            setIssueDate(getTodayDateString());
            setIsCreating(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء فاتورة ضريبية جديدة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: "all", label: `الكل (${invoices.length})` },
          {
            id: "paid",
            label: `مدفوعة (${invoices.filter((i) => i.status === "paid").length})`,
          },
          {
            id: "unpaid",
            label: `غير مدفوعة (${invoices.filter((i) => i.status === "unpaid").length})`,
          },
          {
            id: "overdue",
            label: `متأخرة (${invoices.filter((i) => i.status === "overdue").length})`,
          },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === f.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">تاريخ الإصدار</th>
                <th className="py-3 px-4">تاريخ الاستحقاق</th>
                <th className="py-3 px-4">المبلغ قبل الضريبة</th>
                <th className="py-3 px-4">الضريبة (15%)</th>
                <th className="py-3 px-4">الإجمالي النهائي</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد فواتير مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{inv.customerName}</div>
                      {inv.customerTaxId && (
                        <div className="text-[10px] text-slate-400">
                          رقم ضريبي: {inv.customerTaxId}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.issueDate}</td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {formatCurrency(inv.subtotal, companyProfile.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {formatCurrency(inv.vatTotal, companyProfile.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {formatCurrency(inv.grandTotal, companyProfile.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          inv.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "overdue"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inv.status === "paid" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {inv.status === "paid"
                          ? "مدفوعة"
                          : inv.status === "overdue"
                          ? "متأخرة"
                          : "بانتظار السداد"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>عرض وطباعة</span>
                        </button>
                        <button
                          onClick={() =>
                            onUpdateInvoiceStatus(
                              inv.id,
                              inv.status === "paid" ? "unpaid" : "paid"
                            )
                          }
                          className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                            inv.status === "paid"
                              ? "text-slate-400 hover:text-amber-700"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={
                            inv.status === "paid"
                              ? "تغيير إلى غير مدفوعة"
                              : "تعيين كمدفوعة"
                          }
                        >
                          {inv.status === "paid" ? "إلغاء التحصيل" : "تحصيل"}
                        </button>
                        <button
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف الفاتورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">إنشاء فاتورة ضريبية مبسطة جديدة</h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 text-xs">
              {/* Customer Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block text-sm">بيانات العميل:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">اسم العميل أو المنشأة *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: شركة الأفق للتجارة"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">الرقم الضريبي للعميل (اختياري)</label>
                    <input
                      type="text"
                      value={customerTaxId}
                      onChange={(e) => setCustomerTaxId(e.target.value)}
                      placeholder="300XXXXXXXXXXX"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">عنوان العميل</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="المدينة، الحي..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+966 5X XXX XXXX"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الإصدار *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الاستحقاق *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">بنود الفاتورة:</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة بند</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">وصف البند / الخدمة</th>
                        <th className="py-2 px-3 w-20">الكمية</th>
                        <th className="py-2 px-3 w-28">سعر الوحدة</th>
                        <th className="py-2 px-3 w-24">الضريبة %</th>
                        <th className="py-2 px-3 w-28">الإجمالي</th>
                        <th className="py-2 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="وصف السلعة أو الخدمة المقدمة..."
                              value={it.description}
                              onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) =>
                                handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)
                              }
                              className="w-full border border-slate-200 rounded px-2 py-1 text-center"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={it.unitPrice}
                              onChange={(e) =>
                                handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)
                              }
                              className="w-full border border-slate-200 rounded px-2 py-1 text-center"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={it.vatRate}
                              onChange={(e) =>
                                handleItemChange(idx, "vatRate", parseFloat(e.target.value) || 0)
                              }
                              className="w-full border border-slate-200 rounded px-1.5 py-1 bg-white"
                            >
                              <option value="15">15%</option>
                              <option value="5">5%</option>
                              <option value="0">0%</option>
                            </select>
                          </td>
                          <td className="p-2 font-bold text-slate-800">
                            {formatCurrency(it.total, companyProfile.currency)}
                          </td>
                          <td className="p-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>المجموع الفرعي (بدون ضريبة):</span>
                      <span className="font-semibold">
                        {formatCurrency(calculateTotals().subtotal, companyProfile.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة (15%):</span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(calculateTotals().vatTotal, companyProfile.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                      <span>الإجمالي الكلي:</span>
                      <span className="text-emerald-700">
                        {formatCurrency(calculateTotals().grandTotal, companyProfile.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ملاحظات الفاتورة</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">شروط السداد</label>
                  <input
                    type="text"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  حفظ وإصدار الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Top Toolbar */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between print:hidden">
              <span className="font-bold text-sm">معاينة الفاتورة الضريبية للطباعة</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Invoice Sheet */}
            <div id="printable-invoice" className="p-8 sm:p-12 space-y-8 bg-white text-slate-900">
              {/* Header: Company & Tax Details */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">{companyProfile.name}</h1>
                  <p className="text-xs text-slate-600 mt-1">{companyProfile.address}</p>
                  <p className="text-xs text-slate-600">هاتف: {companyProfile.phone}</p>
                  {companyProfile.email && (
                    <p className="text-xs text-slate-600">بريد إلكتروني: {companyProfile.email}</p>
                  )}
                  <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-50 inline-block px-2.5 py-1 rounded border border-emerald-200">
                    الرقم الضريبي: {companyProfile.taxNumber}
                  </div>
                </div>

                {/* Invoice Type & ZATCA-like QR */}
                <div className="text-left flex flex-col items-end">
                  <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded mb-2">
                    فاتورة ضريبية مبسطة
                  </div>
                  <div className="w-24 h-24 border border-slate-300 rounded p-1.5 flex flex-col items-center justify-center bg-slate-50">
                    <QrCode className="w-16 h-16 text-slate-900" />
                    <span className="text-[8px] text-slate-500 font-mono mt-0.5">ZATCA QR</span>
                  </div>
                </div>
              </div>

              {/* Invoice Meta and Customer Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1 font-semibold">فاتورة إلى (العميل):</span>
                  <div className="text-sm font-bold text-slate-900">{selectedInvoice.customerName}</div>
                  {selectedInvoice.customerTaxId && (
                    <div className="text-slate-600 mt-0.5">
                      الرقم الضريبي: <strong>{selectedInvoice.customerTaxId}</strong>
                    </div>
                  )}
                  {selectedInvoice.customerAddress && (
                    <div className="text-slate-600">{selectedInvoice.customerAddress}</div>
                  )}
                  {selectedInvoice.customerPhone && (
                    <div className="text-slate-600">{selectedInvoice.customerPhone}</div>
                  )}
                </div>

                <div className="text-left space-y-1">
                  <div>
                    <span className="text-slate-500">رقم الفاتورة:</span>{" "}
                    <strong className="font-mono text-slate-900">{selectedInvoice.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">تاريخ الإصدار:</span>{" "}
                    <strong>{selectedInvoice.issueDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">تاريخ الاستحقاق:</span>{" "}
                    <strong>{selectedInvoice.dueDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">حالة السداد:</span>{" "}
                    <span
                      className={`font-bold ${
                        selectedInvoice.status === "paid" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {selectedInvoice.status === "paid" ? "مدفوعة بالكامل" : "غير مدفوعة"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-900 text-white font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">بيان السلعة أو الخدمة</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3">سعر الوحدة</th>
                      <th className="py-2.5 px-3">نسبة الضريبة</th>
                      <th className="py-2.5 px-3">قيمة الضريبة</th>
                      <th className="py-2.5 px-3">المجموع الكلي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedInvoice.items.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {item.description}
                        </td>
                        <td className="py-3 px-3 text-center">{item.quantity}</td>
                        <td className="py-3 px-3">
                          {formatCurrency(item.unitPrice, companyProfile.currency)}
                        </td>
                        <td className="py-3 px-3">{item.vatRate}%</td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {formatCurrency(item.vatAmount, companyProfile.currency)}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {formatCurrency(item.total, companyProfile.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Arabic Words (Tafqeet) */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Tafqeet & Notes */}
                <div className="max-w-md space-y-2 text-xs">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-900 font-medium">
                    <span className="block text-[10px] text-emerald-700 font-bold mb-0.5">
                      المبلغ بالحروف (تفقيط):
                    </span>
                    {arabicNumberToWords(selectedInvoice.grandTotal)}
                  </div>
                  {selectedInvoice.notes && (
                    <div className="text-slate-600 text-[11px]">
                      <strong>ملاحظات:</strong> {selectedInvoice.notes}
                    </div>
                  )}
                  {selectedInvoice.terms && (
                    <div className="text-slate-500 text-[11px]">
                      <strong>الشروط:</strong> {selectedInvoice.terms}
                    </div>
                  )}
                </div>

                {/* Numerical totals */}
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>الإجمالي الخاضع للضريبة:</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedInvoice.subtotal, companyProfile.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(selectedInvoice.vatTotal, companyProfile.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 text-sm pt-2 border-t-2 border-slate-900">
                    <span>الإجمالي النهائي المستحق:</span>
                    <span className="text-emerald-700">
                      {formatCurrency(selectedInvoice.grandTotal, companyProfile.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-700">توقيع وختم المنشأة:</p>
                  <div className="w-36 h-12 border-b border-dashed border-slate-400 mt-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">المستلم / العميل:</p>
                  <div className="w-36 h-12 border-b border-dashed border-slate-400 mt-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
