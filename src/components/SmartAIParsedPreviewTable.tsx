import React, { useState } from 'react';
import {
  Check,
  Trash2,
  Plus,
  Calendar,
  Sparkles,
  DollarSign,
  TrendingUp,
  X,
  AlertCircle,
  Tag,
  User,
} from 'lucide-react';
import { ParsedTransactionItem, TransactionType, Category } from '../types';

interface SmartAIParsedPreviewTableProps {
  items: ParsedTransactionItem[];
  currentDate: string;
  detectedDate?: string;
  detectedSupplier?: string;
  onUpdateItems: (items: ParsedTransactionItem[]) => void;
  onApply: (items: ParsedTransactionItem[], targetDate: string) => void;
  onCancel: () => void;
  availableDates?: string[];
}

export const SmartAIParsedPreviewTable: React.FC<SmartAIParsedPreviewTableProps> = ({
  items,
  currentDate,
  detectedDate,
  detectedSupplier,
  onUpdateItems,
  onApply,
  onCancel,
}) => {
  const [targetDate, setTargetDate] = useState<string>(detectedDate || currentDate);

  const handleRowChange = (index: number, updates: Partial<ParsedTransactionItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...updates };
    onUpdateItems(next);
  };

  const handlePriceChange = (index: number, rawPrice: string) => {
    const price = parseFloat(rawPrice) || 0;
    const item = items[index];
    // إذا كان للمستخدم فايدة محددة، نحدث التكلفة، وإلا نحافظ على نسبة الفايدة
    const currentProfit = Number(item.profit) || 0;
    const cost = Math.max(0, price - currentProfit);
    handleRowChange(index, { price, cost });
  };

  const handleProfitChange = (index: number, rawProfit: string) => {
    const profit = parseFloat(rawProfit) || 0;
    const item = items[index];
    const price = Number(item.price) || 0;
    const cost = Math.max(0, price - profit);
    handleRowChange(index, { profit, cost });
  };

  const handleCostChange = (index: number, rawCost: string) => {
    const cost = parseFloat(rawCost) || 0;
    const item = items[index];
    const price = Number(item.price) || 0;
    const profit = Math.max(0, price - cost);
    handleRowChange(index, { cost, profit });
  };

  const handleDeleteRow = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onUpdateItems(next);
  };

  const handleAddNewRow = () => {
    const newRow: ParsedTransactionItem = {
      type: 'sale',
      category: 'accessories',
      description: 'صنف مبيعات جديد',
      price: 0,
      profit: 0,
      cost: 0,
      date: targetDate,
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    };
    onUpdateItems([...items, newRow]);
  };

  // إجماليات مالية فورية
  const totalPrice = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalProfit = items.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
  const totalCost = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const getCategoryFromType = (type: TransactionType): Category => {
    if (type === 'sale') return 'accessories';
    if (type === 'maintenance') return 'maintenance';
    if (type.startsWith('balance_')) return 'balance';
    if (type === 'sim') return 'sims';
    if (type === 'purchase') return 'purchases';
    if (type.includes('mosaab')) return 'mosaab';
    if (type.includes('engineer')) return 'engineer';
    if (type.includes('worker')) return 'worker';
    return 'expenses';
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-500 p-3 sm:p-5 shadow-xl mt-2 space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Header Bar with Date Controls & Supplier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>جدول تسجيل ومراجعة الفائدة والمبيعات</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {items.length} حركات
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              يمكنك كتابة أو تعديل الفايدة (ف) أو السعر لكل صنف مباشرة قبل الحفظ والاعتماد في اليومية
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700">تاريخ القيد:</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer p-0"
          />
          {detectedDate && detectedDate !== currentDate && (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              تم التعرف من الكلام
            </span>
          )}
        </div>
      </div>

      {detectedSupplier && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-blue-900 font-semibold">
          <User className="w-3.5 h-3.5 text-blue-600" />
          <span>المورد / الطرف المرتبط: <strong className="text-blue-950 underline">{detectedSupplier}</strong></span>
        </div>
      )}

      {/* Editable Grid Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
        <table className="w-full text-xs text-right border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
              <th className="p-2.5 w-10 text-center">#</th>
              <th className="p-2.5 w-32">النوع / القسم</th>
              <th className="p-2.5">البيان / اسم الصنف أو الجوال</th>
              <th className="p-2.5 w-28">السعر / المبلغ</th>
              <th className="p-2.5 w-28 text-emerald-900 bg-emerald-50 border-x border-emerald-200">
                الفايدة (ف) ⚡
              </th>
              <th className="p-2.5 w-24">التكلفة</th>
              <th className="p-2.5 w-24">الباقي</th>
              <th className="p-2.5 w-10 text-center">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                {/* Index */}
                <td className="p-2.5 text-center font-bold text-slate-400">
                  {index + 1}
                </td>

                {/* Type Selection */}
                <td className="p-2">
                  <select
                    value={item.type}
                    onChange={(e) => {
                      const newType = e.target.value as TransactionType;
                      handleRowChange(index, {
                        type: newType,
                        category: getCategoryFromType(newType),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 font-bold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="sale">🛍️ مبيعات</option>
                    <option value="maintenance">🔧 صيانة</option>
                    <option value="balance_hadi">📲 رصيد الهادي (مياس)</option>
                    <option value="balance_qimma">📱 رصيد الرقم (أبو علي)</option>
                    <option value="sim">💳 شرائح</option>
                    <option value="purchase">📦 مشتريات بضاعة</option>
                    <option value="expense_home_mosaab">🏠 بيت مصعب</option>
                    <option value="withdrawal_mosaab">💵 سحب مصعب</option>
                    <option value="expense_shop">🏪 خرج ومصاريف محل</option>
                    <option value="transfer_to_supplier">🚚 حوالة مورد</option>
                    <option value="transfer_hadi">📤 حوالة للهادي (مياس)</option>
                  </select>
                </td>

                {/* Description */}
                <td className="p-2">
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleRowChange(index, { description: e.target.value })}
                    placeholder="مثال: سماعة بلوتوث، كفر..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500"
                  />
                </td>

                {/* Price / Amount */}
                <td className="p-2">
                  <input
                    type="number"
                    value={item.price ?? ''}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </td>

                {/* Profit (الفايدة ف) - Highlighted in Emerald */}
                <td className="p-2 bg-emerald-50/50 border-x border-emerald-200">
                  <input
                    type="number"
                    value={item.profit ?? ''}
                    onChange={(e) => handleProfitChange(index, e.target.value)}
                    placeholder="0"
                    title="الفايدة الصافية (ف)"
                    className="w-full bg-emerald-50 border-2 border-emerald-500 rounded-lg text-xs p-1.5 font-mono font-bold text-emerald-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 text-left"
                    dir="ltr"
                  />
                </td>

                {/* Cost */}
                <td className="p-2">
                  <input
                    type="number"
                    value={item.cost ?? ''}
                    onChange={(e) => handleCostChange(index, e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 font-mono text-slate-600 focus:bg-white focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </td>

                {/* Remaining Amount (الباقي) */}
                <td className="p-2">
                  <input
                    type="number"
                    value={item.remainingAmount ?? ''}
                    onChange={(e) =>
                      handleRowChange(index, {
                        remainingAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 font-mono text-amber-700 focus:bg-white focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </td>

                {/* Delete */}
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(index)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="حذف هذا البند"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row & Quick Action */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleAddNewRow}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة صنف مبيعات يدوي في الجدول</span>
        </button>

        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>تتغير التكلفة تلقائياً عند تعديل الفايدة، والعكس صحيح.</span>
        </span>
      </div>

      {/* Financial Summary Card */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
        <div>
          <span className="text-[10px] font-bold text-slate-500 block">إجمالي المقبوض / السعر</span>
          <span className="text-sm font-extrabold font-mono text-slate-900">
            {totalPrice.toLocaleString('en-US')} <small className="text-[10px] font-normal">ر.ي</small>
          </span>
        </div>
        <div className="bg-emerald-100/70 p-1.5 rounded-lg border border-emerald-300">
          <span className="text-[10px] font-bold text-emerald-800 block flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-700" />
            إجمالي الفايدة (الربح الصافي) ⚡
          </span>
          <span className="text-base font-black font-mono text-emerald-800">
            {totalProfit.toLocaleString('en-US')} <small className="text-[10px] font-bold">ر.ي</small>
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 block">إجمالي رأس المال / التكلفة</span>
          <span className="text-sm font-bold font-mono text-slate-600">
            {totalCost.toLocaleString('en-US')} <small className="text-[10px] font-normal">ر.ي</small>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          <span>إلغاء وتجاهل</span>
        </button>

        <button
          type="button"
          onClick={() => onApply(items, targetDate)}
          disabled={items.length === 0}
          className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Check className="w-4 h-4" />
          <span>حفظ واعتماد الحركات في اليومية (مع الفايدة) ⚡</span>
        </button>
      </div>
    </div>
  );
};
