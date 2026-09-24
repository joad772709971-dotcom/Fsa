import React, { useState } from 'react';
import { Sparkles, X, Check, Boxes, AlertTriangle, ArrowRight, DollarSign, Barcode } from 'lucide-react';
import { Transaction, InventoryItem } from '../types';
import { formatCurrency } from '../utils/calculations';

export interface UnpricedSoldEntry {
  transaction: Transaction;
  matchedInventoryItem?: InventoryItem;
  productName: string;
  salePrice: number;
  currentCost: number;
}

interface DailySoldReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: UnpricedSoldEntry[];
  currentDate: string;
  onSaveEntry: (
    transactionId: string,
    costPrice: number,
    sellingPrice: number,
    stockQuantity: number,
    inventoryItemId?: string
  ) => void;
  onSaveAllEntries?: (
    updatedList: {
      transactionId: string;
      costPrice: number;
      sellingPrice: number;
      stockQuantity: number;
      inventoryItemId?: string;
    }[]
  ) => void;
}

export const DailySoldReconciliationModal: React.FC<DailySoldReconciliationModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentDate,
  onSaveEntry,
  onSaveAllEntries,
}) => {
  const [formState, setFormState] = useState<
    Record<string, { costPrice: string; sellingPrice: string; quantity: string }>
  >(() => {
    const initial: Record<string, { costPrice: string; sellingPrice: string; quantity: string }> = {};
    entries.forEach((entry) => {
      const defaultCost = entry.currentCost > 0 ? String(entry.currentCost) : '';
      const defaultSelling = entry.salePrice > 0 ? String(entry.salePrice) : '';
      const defaultQty = entry.matchedInventoryItem && entry.matchedInventoryItem.quantity > 0
        ? String(entry.matchedInventoryItem.quantity)
        : '1';
      initial[entry.transaction.id] = {
        costPrice: defaultCost,
        sellingPrice: defaultSelling,
        quantity: defaultQty,
      };
    });
    return initial;
  });

  if (!isOpen || entries.length === 0) return null;

  const handleFieldChange = (
    txId: string,
    field: 'costPrice' | 'sellingPrice' | 'quantity',
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [txId]: {
        ...prev[txId],
        [field]: value,
      },
    }));
  };

  const handleSaveSingle = (entry: UnpricedSoldEntry) => {
    const values = formState[entry.transaction.id] || {
      costPrice: '',
      sellingPrice: String(entry.salePrice),
      quantity: '1',
    };
    const cost = parseFloat(values.costPrice) || 0;
    const selling = parseFloat(values.sellingPrice) || entry.salePrice;
    const qty = parseInt(values.quantity, 10) || 1;

    onSaveEntry(
      entry.transaction.id,
      cost,
      selling,
      qty,
      entry.matchedInventoryItem?.id
    );
  };

  const handleSaveAll = () => {
    const list = entries.map((entry) => {
      const values = formState[entry.transaction.id] || {
        costPrice: '',
        sellingPrice: String(entry.salePrice),
        quantity: '1',
      };
      return {
        transactionId: entry.transaction.id,
        costPrice: parseFloat(values.costPrice) || 0,
        sellingPrice: parseFloat(values.sellingPrice) || entry.salePrice,
        stockQuantity: parseInt(values.quantity, 10) || 1,
        inventoryItemId: entry.matchedInventoryItem?.id,
      };
    });

    if (onSaveAllEntries) {
      onSaveAllEntries(list);
    } else {
      list.forEach((item) => {
        onSaveEntry(
          item.transactionId,
          item.costPrice,
          item.sellingPrice,
          item.stockQuantity,
          item.inventoryItemId
        );
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                تحديث بيانات منتجات تم بيعها اليوم ({currentDate})
              </h3>
              <p className="text-[11px] text-amber-100 mt-0.5">
                أدخل سعر الشراء والبيع والكمية لتثبيتها في المخزن وضبط أرباح اليوم بدقة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative notification */}
        <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            هذه المنتجات تم بيعها في كشف اليوم ولم تكن مسعرة مسبقاً أو غير مجرودة في المخزن.
            عند إدخال سعر التكلفة والكمية، سيتم حساب الربح فورياً وتحديث المخزن.
          </span>
        </div>

        {/* Entries list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-100 flex-1">
          {entries.map((entry) => {
            const currentVals = formState[entry.transaction.id] || {
              costPrice: '',
              sellingPrice: String(entry.salePrice),
              quantity: '1',
            };
            const costNum = parseFloat(currentVals.costPrice) || 0;
            const profitNum = entry.salePrice - costNum;

            return (
              <div key={entry.transaction.id} className="pt-3.5 first:pt-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {entry.productName}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>سعر البيع اليوم: <strong className="text-emerald-700 font-mono font-bold">{formatCurrency(entry.salePrice)}</strong></span>
                      {entry.matchedInventoryItem?.barcode && (
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {entry.matchedInventoryItem.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500">الربح المتوقع:</span>
                    <span
                      className={`font-mono font-bold ${
                        profitNum >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(profitNum)}
                    </span>
                  </div>
                </div>

                {/* Input fields */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      سعر الشراء / التكلفة:
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={currentVals.costPrice}
                      onChange={(e) =>
                        handleFieldChange(entry.transaction.id, 'costPrice', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      سعر البيع المعتمد:
                    </label>
                    <input
                      type="number"
                      placeholder="سعر البيع"
                      value={currentVals.sellingPrice}
                      onChange={(e) =>
                        handleFieldChange(entry.transaction.id, 'sellingPrice', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-emerald-700 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      الكمية المتوفرة بالمخزن:
                    </label>
                    <input
                      type="number"
                      placeholder="الكمية"
                      value={currentVals.quantity}
                      onChange={(e) =>
                        handleFieldChange(entry.transaction.id, 'quantity', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتحديث بيانات كافة المنتجات والمخزن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
