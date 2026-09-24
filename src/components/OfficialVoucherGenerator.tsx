import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Check,
  User,
  DollarSign,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { tafqeetRiyal } from '../utils/tafqeet';
import { printHtmlElement } from '../utils/printHelper';
import { getTodayDateString } from '../utils/dateHelper';

interface OfficialVoucherGeneratorProps {
  onClose?: () => void;
}

export const OfficialVoucherGenerator: React.FC<OfficialVoucherGeneratorProps> = ({ onClose }) => {
  const [voucherType, setVoucherType] = useState<'receipt' | 'payment'>('payment');
  const [voucherNo, setVoucherNo] = useState(`VCH-${Date.now().toString().slice(-5)}`);
  const [date, setDate] = useState(getTodayDateString());
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'transfer' | 'cheque'>('cash');
  const [description, setDescription] = useState('');
  const [accountantName, setAccountantName] = useState('مصعب الصوفي');
  const [receiverName, setReceiverName] = useState('');

  const handlePrint = () => {
    printHtmlElement('printable-voucher-card', `سند_${voucherType === 'payment' ? 'صرف' : 'قبض'}_${voucherNo}`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileText className="w-6 h-6" />
            </span>
            <h1 className="text-xl font-black tracking-tight">
              دفتر ومولد سندات القبض وسندات الصرف الرسمية
            </h1>
          </div>
          <p className="text-xs text-indigo-200/80">
            تحرير وطباعة سندات معتمدة ومفقطة بالحروف والأرقام مع الترويسة وأختام المحل وتواقيع الاستلام.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <Printer className="w-4 h-4" />
          طباعة السند الرسمي الآن
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            بيانات السند المالي
          </h3>

          {/* Voucher Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVoucherType('payment')}
              className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                voucherType === 'payment'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              سند صرف (دفع مبلغ)
            </button>
            <button
              type="button"
              onClick={() => setVoucherType('receipt')}
              className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                voucherType === 'receipt'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              سند قبض (استلام مبلغ)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم السند</label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">التاريخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {voucherType === 'payment' ? 'اصرفوا للأخ / للجهة:' : 'استلمنا من الأخ / الجهة:'}
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="اسم الشخص أو المورد أو العميل"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">المبلغ بالأرقام (ر.ي)</label>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-indigo-700 font-mono"
            />
            <div className="mt-1.5 p-2 bg-slate-100 rounded-lg text-[11px] text-slate-700 font-bold">
              التفقيط: {tafqeetRiyal(Number(amount) || 0)}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'نقداً (كاش)' },
                { id: 'transfer', label: 'تحويل / محفظة' },
                { id: 'cheque', label: 'شيك' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMode(m.id as any)}
                  className={`py-2 px-1 text-center font-bold rounded-lg ${
                    paymentMode === m.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">وذلك مقابل (البيان والسبب):</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المسؤول / المحاسب</label>
              <input
                type="text"
                value={accountantName}
                onChange={(e) => setAccountantName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المستلم (اختياري)</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="اسم المستلم"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Live Formal Voucher Printable Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-bold text-slate-500">معاينة السند المعتمد للطباعة الرسمية:</div>

          <div
            id="printable-voucher-card"
            className="bg-white rounded-2xl border-2 border-slate-800 p-4 sm:p-8 shadow-md space-y-4 sm:space-y-6 text-slate-900 relative overflow-hidden"
          >
            {/* Watermark/Stamp */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <div className="w-80 h-80 rounded-full border-8 border-slate-900 flex items-center justify-center font-black text-4xl transform -rotate-12">
                محل مصعب الصوفي
              </div>
            </div>

            {/* Voucher Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-lg font-black text-slate-900">محل مصعب الصوفي للجوالات</h2>
                <p className="text-[11px] text-slate-600">
                  بيع وشراء وصيانة وبرمجة الهواتف الذكية • شبكات الرصيد والشرائح
                </p>
                <p className="text-[10px] text-slate-500">الجمهورية اليمنية • تلفون: 777000000</p>
              </div>

              <div className="text-left space-y-1">
                <div
                  className={`px-4 py-1.5 rounded-lg text-white font-black text-sm tracking-wide ${
                    voucherType === 'payment' ? 'bg-rose-800' : 'bg-emerald-800'
                  }`}
                >
                  {voucherType === 'payment' ? 'سند صرف رسمي' : 'سند قبض رسمي'}
                </div>
                <div className="text-xs font-mono font-bold text-slate-700">No: {voucherNo}</div>
                <div className="text-xs font-mono text-slate-600">التاريخ: {date}</div>
              </div>
            </div>

            {/* Amount Box */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-300">
              <div className="text-xs font-bold text-slate-700">المبلغ بالأرقام:</div>
              <div className="font-mono text-xl font-black text-indigo-900 bg-white px-4 py-1 rounded-lg border border-slate-300 shadow-inner">
                {formatCurrency(Number(amount) || 0)}
              </div>
            </div>

            {/* Voucher Body Lines */}
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="flex items-baseline gap-2 border-b border-dotted border-slate-400 pb-1.5">
                <span className="font-bold text-slate-800 whitespace-nowrap">
                  {voucherType === 'payment' ? 'اصرفوا للأخ / الجهة:' : 'استلمنا من الأخ / الجهة:'}
                </span>
                <span className="font-black text-slate-950 flex-1">{personName || '...................................................'}</span>
              </div>

              <div className="flex items-baseline gap-2 border-b border-dotted border-slate-400 pb-1.5">
                <span className="font-bold text-slate-800 whitespace-nowrap">مبلغ وقدره بالحروف:</span>
                <span className="font-black text-slate-950 flex-1">{tafqeetRiyal(Number(amount) || 0)}</span>
              </div>

              <div className="flex items-baseline gap-2 border-b border-dotted border-slate-400 pb-1.5">
                <span className="font-bold text-slate-800 whitespace-nowrap">طريقة التسليم:</span>
                <span className="font-bold text-slate-900 flex-1">
                  {paymentMode === 'cash'
                    ? 'نقداً (من كاش الصندوق)'
                    : paymentMode === 'transfer'
                    ? 'حوالة بنكية / محفظة إلكترونية'
                    : 'بموجب شيك'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 border-b border-dotted border-slate-400 pb-1.5">
                <span className="font-bold text-slate-800 whitespace-nowrap">وذلك مقابل:</span>
                <span className="font-bold text-slate-900 flex-1">{description || '...................................................'}</span>
              </div>
            </div>

            {/* Signatures Area */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-300 text-center text-xs">
              <div className="space-y-8">
                <div className="font-bold text-slate-700">المحاسب / المسؤول</div>
                <div className="font-bold text-slate-950">{accountantName}</div>
              </div>

              <div className="space-y-8">
                <div className="font-bold text-slate-700">ختم المحل المعتمد</div>
                <div className="w-16 h-16 border-2 border-dashed border-slate-400 rounded-full mx-auto flex items-center justify-center text-[10px] text-slate-400">
                  الختم
                </div>
              </div>

              <div className="space-y-8">
                <div className="font-bold text-slate-700">توقيع المستلم</div>
                <div className="font-bold text-slate-950">{receiverName || '...................'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
