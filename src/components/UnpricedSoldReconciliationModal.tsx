import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  Boxes,
  Tag,
  Barcode,
  TrendingUp,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  UnpricedSoldReconciliationItem,
} from '../utils/fastProductManager';
import { InventoryItem, DayRecord } from '../types';
import { generateAutoBarcode } from '../utils/barcode';

interface UnpricedSoldReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: UnpricedSoldReconciliationItem[];
  inventory: InventoryItem[];
  onUpdateInventory: (updatedInventory: InventoryItem[]) => void;
  currentDay: DayRecord;
  onUpdateDay: (updatedDay: DayRecord) => void;
}

export const UnpricedSoldReconciliationModal: React.FC<UnpricedSoldReconciliationModalProps> = ({
  isOpen,
  onClose,
  items,
  inventory,
  onUpdateInventory,
  currentDay,
  onUpdateDay,
}) => {
  if (!isOpen || items.length === 0) return null;

  // Local state for each item's editable fields
  const [formData, setFormData] = useState<{
    [itemId: string]: {
      cost: string;
      sellingPrice: string;
      quantity: string;
    };
  }>(() => {
    const initial: { [id: string]: { cost: string; sellingPrice: string; quantity: string } } = {};
    items.forEach((item) => {
      initial[item.itemId] = {
        cost: item.currentCost > 0 ? String(item.currentCost) : '',
        sellingPrice: item.soldPrice > 0 ? String(item.soldPrice) : '',
        quantity: item.matchedInventoryItem && item.matchedInventoryItem.quantity > 0 ? String(item.matchedInventoryItem.quantity) : '',
      };
    });
    return initial;
  });

  const handleFieldChange = (
    itemId: string,
    field: 'cost' | 'sellingPrice' | 'quantity',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = () => {
    let updatedInv = [...inventory];
    let updatedDay: DayRecord = {
      ...currentDay,
      accessories: [...(currentDay.accessories || [])],
      phones: [...(currentDay.phones || [])],
    };

    items.forEach((recItem) => {
      const data = formData[recItem.itemId];
      if (!data) return;

      const costNum = Number(data.cost) || 0;
      const sellNum = Number(data.sellingPrice) || recItem.soldPrice;
      const qtyNum = Number(data.quantity) || 0;

      // 1. Update matching sale item inside DayRecord (to correct real profit)
      if (recItem.section === 'accessories') {
        updatedDay.accessories = updatedDay.accessories.map((acc) => {
          if (acc.id === recItem.itemId) {
            return {
              ...acc,
              cost: costNum,
              profit: Math.max(0, (acc.price || 0) - costNum),
            };
          }
          return acc;
        });
      } else if (recItem.section === 'phones') {
        updatedDay.phones = updatedDay.phones.map((ph) => {
          if (ph.id === recItem.itemId) {
            return {
              ...ph,
              cost: costNum,
              profit: Math.max(0, (ph.salePrice || ph.price || 0) - costNum),
            };
          }
          return ph;
        });
      }

      // 2. Update or Create Inventory Item
      const cleanName = recItem.productName.trim().toLowerCase();
      const existingIdx = updatedInv.findIndex(
        (it) => it.name.trim().toLowerCase() === cleanName
      );

      if (existingIdx >= 0) {
        // Update existing inventory item
        const existing = updatedInv[existingIdx];
        updatedInv[existingIdx] = {
          ...existing,
          costPrice: costNum,
          sellingPrice: sellNum,
          quantity: qtyNum,
          isPendingPricing: false,
          isPendingStock: false,
          lastSoldPrice: recItem.soldPrice,
          lastSoldDate: recItem.date,
          barcode: existing.barcode || generateAutoBarcode(),
        };
      } else {
        // Create new inventory item
        const newInv: InventoryItem = {
          id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: recItem.productName.trim(),
          category: recItem.section === 'phones' ? 'phones' : 'accessories',
          barcode: generateAutoBarcode(),
          costPrice: costNum,
          sellingPrice: sellNum,
          quantity: qtyNum,
          isPendingPricing: false,
          isPendingStock: false,
          lastSoldPrice: recItem.soldPrice,
          lastSoldDate: recItem.date,
          dateAdded: recItem.date,
          notes: `تم اعتماد بيانات التكلفة والعدد تلقائياً بعد عملية البيع في يوم ${recItem.dayNumber}`,
        };
        updatedInv = [newInv, ...updatedInv];
      }
    });

    onUpdateInventory(updatedInv);
    onUpdateDay(updatedDay);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-indigo-950 text-white p-5 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  تحديث بيانات وتكلفة منتجات بعتها اليوم
                </h3>
                <span className="text-[11px] bg-amber-500/30 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                  {items.length} منتج
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                قمت ببيع هذه الأصناف اليوم بدون تكلفة مسجلة أو عدد محدد بالمخزن. أدخل سعر الشراء والكمية المتوفرة حالياً ليتم تحديث الأرباح والمخزن فورياً!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of items */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/70">
          {items.map((item, idx) => {
            const data = formData[item.itemId] || { cost: '', sellingPrice: '', quantity: '' };
            const costVal = Number(data.cost) || 0;
            const profitVal = costVal > 0 ? (item.soldPrice - costVal) : (item.soldPrice);

            return (
              <div
                key={item.itemId}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-400/60 p-4 shadow-xs transition-all space-y-3"
              >
                {/* Title & Sold Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-black text-slate-900">{item.productName}</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      {item.section === 'phones' ? 'جوالات' : 'إكسسوارات'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">
                      سعر البيع اليوم: <strong className="text-slate-900 font-mono font-bold">{item.soldPrice.toLocaleString()} ر.ي</strong>
                    </span>
                    {costVal > 0 && (
                      <span className={`font-bold font-mono px-2 py-0.5 rounded-md text-[11px] ${profitVal >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                        الربح: {profitVal.toLocaleString()} ر.ي
                      </span>
                    )}
                  </div>
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Purchase Cost */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      سعر الشراء / التكلفة (ر.ي) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="مثال: 1500"
                      value={data.cost}
                      onChange={(e) => handleFieldChange(item.itemId, 'cost', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  {/* Store Selling Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      سعر البيع المعتمد للمخزن (ر.ي)
                    </label>
                    <input
                      type="number"
                      placeholder={String(item.soldPrice)}
                      value={data.sellingPrice}
                      onChange={(e) => handleFieldChange(item.itemId, 'sellingPrice', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  {/* Stock Quantity in Store */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      الكمية المتوفرة بالمخزن (حبة)
                    </label>
                    <input
                      type="number"
                      placeholder="مثال: 10"
                      value={data.quantity}
                      onChange={(e) => handleFieldChange(item.itemId, 'quantity', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Barcode status indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Barcode className="w-3.5 h-3.5 text-indigo-500" />
                    الباركود: {item.matchedInventoryItem?.barcode || 'سيتم توليد باركود تلقائي'}
                  </span>
                  <span className="text-amber-700 font-medium">
                    {item.matchedInventoryItem ? 'موجود بالمخزن (يحتاج تسعير)' : 'صنف جديد (سيضاف للمخزن فورياً)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            تخطي والإغلاق
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>حفظ وتحديث المخزن وتكلفة المبيعات فورياً</span>
          </button>
        </div>
      </div>
    </div>
  );
};
