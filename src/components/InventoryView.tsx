import React, { useState } from 'react';
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  Smartphone,
  Wrench,
  ShieldAlert,
  Plus,
  Trash2,
  X,
  Barcode,
  Sparkles,
  Check,
  Edit3,
  Search,
  Filter,
  Layers,
} from 'lucide-react';
import { InventoryItem, Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/calculations';
import { FastProductNamesModal } from './FastProductNamesModal';
import { resetAllDamarPricesAndQuantitiesToZero } from '../utils/priceMemoryStorage';

interface InventoryViewProps {
  transactions: Transaction[];
  onAddNewVoucher: (defaultType: TransactionType) => void;
  inventory?: InventoryItem[];
  onAddInventoryItem?: (item: InventoryItem) => void;
  onUpdateInventoryItem?: (item: InventoryItem) => void;
  onBatchAddInventoryItems?: (items: InventoryItem[]) => void;
  onDeleteInventoryItem?: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  transactions,
  onAddNewVoucher,
  inventory = [],
  onAddInventoryItem,
  onUpdateInventoryItem,
  onBatchAddInventoryItems,
  onDeleteInventoryItem,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'damaged' | 'outflows'>('inventory');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFastModalOpen, setIsFastModalOpen] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'pending' | 'fast_count'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline edit state for rows: itemId -> { costPrice, sellingPrice, quantity }
  const [editingRows, setEditingRows] = useState<{
    [id: string]: { costPrice: string; sellingPrice: string; quantity: string };
  }>({});
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  const handleZeroOutAllInventory = () => {
    if (
      confirm(
        '⚠️ هل أنت متأكد من تصفير جميع أسعار الضمار والتكلفة (0 ر.ي) وجميع الكميات بالمخزن (0 حبة) لكافة الأصناف؟\n\nستتمكن بعدها من بدء جرد وتسعير جديد والانتقال السريع بالإنتر.'
      )
    ) {
      resetAllDamarPricesAndQuantitiesToZero();
      window.dispatchEvent(new CustomEvent('inventory_updated'));
      window.dispatchEvent(new CustomEvent('price_memory_updated'));
    }
  };

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'accessories' | 'spare_parts' | 'phones' | 'sims' | 'tools'>('accessories');
  const [newItemQuantity, setNewItemQuantity] = useState<number | ''>(1);
  const [newItemCost, setNewItemCost] = useState<number | ''>('');
  const [newItemSellingPrice, setNewItemSellingPrice] = useState<number | ''>('');
  const [newItemSupplier, setNewItemSupplier] = useState('');
  const [newItemMinQty, setNewItemMinQty] = useState<number | ''>(2);

  const damagedTx = transactions.filter((t) => t.type === 'damaged');
  const outflowsTx = transactions.filter((t) => t.type === 'shop_tools_outflow');

  const totalDamagedCost = damagedTx.reduce((sum, t) => sum + (t.cost || t.price), 0);
  const totalOutflowCost = outflowsTx.reduce((sum, t) => sum + t.price, 0);
  const totalInventoryCost = inventory.reduce((sum, it) => sum + (it.quantity || 0) * (it.costPrice || 0), 0);

  const pendingItemsCount = inventory.filter(
    (it) => it.isPendingPricing || it.isPendingStock || !it.costPrice || it.quantity === 0
  ).length;

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery));

    if (!matchesSearch) return false;

    if (inventoryFilter === 'pending') {
      return item.isPendingPricing || item.isPendingStock || !item.costPrice || item.quantity === 0;
    }
    return true;
  });

  const handleRowChange = (id: string, field: 'costPrice' | 'sellingPrice' | 'quantity', val: string) => {
    setEditingRows((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { costPrice: '', sellingPrice: '', quantity: '' }),
        [field]: val,
      },
    }));
  };

  const handleSaveInline = (item: InventoryItem) => {
    const row = editingRows[item.id];
    const newCost = row && row.costPrice !== '' ? Number(row.costPrice) : item.costPrice;
    const newSell = row && row.sellingPrice !== '' ? Number(row.sellingPrice) : item.sellingPrice;
    const newQty = row && row.quantity !== '' ? Number(row.quantity) : item.quantity;

    const updated: InventoryItem = {
      ...item,
      costPrice: newCost,
      sellingPrice: newSell,
      quantity: newQty,
      isPendingPricing: newCost > 0 ? false : item.isPendingPricing,
      isPendingStock: newQty > 0 ? false : item.isPendingStock,
    };

    if (onUpdateInventoryItem) {
      onUpdateInventoryItem(updated);
    }
    // Clean up local row state
    setEditingRows((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const handleInventoryKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: 'costPrice' | 'quantity' | 'sellingPrice',
    item: InventoryItem
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInline(item);
      setJustSavedId(item.id);
      setTimeout(() => setJustSavedId((prev) => (prev === item.id ? null : prev)), 2000);

      let nextRow = index;
      let nextField: 'costPrice' | 'quantity' | 'sellingPrice' = 'quantity';

      if (field === 'costPrice') {
        nextField = 'quantity';
        nextRow = index;
      } else if (field === 'quantity') {
        nextField = 'costPrice';
        nextRow = index + 1;
      } else if (field === 'sellingPrice') {
        nextField = 'costPrice';
        nextRow = index + 1;
      }

      if (nextRow < filteredInventory.length) {
        const target = document.querySelector<HTMLInputElement>(
          `input[data-inv-row="${nextRow}"][data-inv-field="${nextField}"]`
        );
        if (target) {
          target.focus();
          target.select();
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemQuantity || newItemCost === '' || newItemSellingPrice === '') {
      alert('يرجى تعبئة كافة الحقول المطلوبة');
      return;
    }

    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: Number(newItemQuantity),
      costPrice: Number(newItemCost),
      sellingPrice: Number(newItemSellingPrice),
      supplierName: newItemSupplier.trim() || undefined,
      minQuantity: Number(newItemMinQty) || 2,
      isPendingPricing: false,
      isPendingStock: false,
    };

    if (onAddInventoryItem) {
      onAddInventoryItem(newItem);
    }
    
    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemCost('');
    setNewItemSellingPrice('');
    setNewItemSupplier('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-950/20">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              المخزون وقطع الغيار والتالف ومخروجات المحل
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة كميات البضاعة، قطع الصيانة، التالف، وأدوات المحل (وصلات وشواحن)
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsFastModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
            title="إدخال سريع لأسماء الأصناف فقط، وسيقوم النظام بتوليد باركود لكل صنف وإضافتها بدون أسعار لتسعيرها أو جردها لاحقاً"
          >
            <Barcode className="w-4 h-4 text-amber-300" />
            <span>⚡ إدخال سريع لأسماء المنتجات (توليد باركود)</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف مفصل</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('shop_tools_outflow')}
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>قيد مخروج للمحل</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('damaged')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>قيد بضاعة تالفة</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          بضاعة ومخزون المحل ({inventory.length})
        </button>
        <button
          onClick={() => setActiveSubTab('outflows')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'outflows' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600'
          }`}
        >
          مخروجات للمحل ({outflowsTx.length})
        </button>
        <button
          onClick={() => setActiveSubTab('damaged')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'damaged' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'
          }`}
        >
          سجل التالف والخسائر ({damagedTx.length})
        </button>
      </div>

      {/* 1. Inventory Stock Table */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Sub-header & Filtering Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInventoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                كل الأصناف ({inventory.length})
              </button>

              <button
                type="button"
                onClick={() => setInventoryFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  inventoryFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>أصناف تحتاج تسعير أو جرد ({pendingItemsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setInventoryFilter(inventoryFilter === 'fast_count' ? 'all' : 'fast_count')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  inventoryFilter === 'fast_count'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                }`}
                title="تفعيل التعديل المباشر في خلايا الجدول للتسعير والجرد السريع بالإنتر"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{inventoryFilter === 'fast_count' ? 'إغلاق وضع الجرد السريع' : '📝 وضع الجرد السريع (تعديل مباشر بالإنتر)'}</span>
              </button>

              <button
                type="button"
                onClick={handleZeroOutAllInventory}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                title="تصفير جميع أسعار الضمار والكميات لكافة الأصناف للبدء بجرد وتسعير جديد"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>تصفير الضمار والكميات (0)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الصنف أو الباركود..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-500 outline-none shadow-2xs"
              />
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              عرض <strong className="text-slate-900 font-bold">{filteredInventory.length}</strong> من أصل {inventory.length} صنف
            </span>
            <span className="font-bold">
              إجمالي قيمة المخزون الحالي: <strong className="text-amber-800 font-mono">{formatCurrency(totalInventoryCost)}</strong>
            </span>
          </div>

          {inventory.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">المخزون فارغ حالياً</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                لم يتم تسجيل أي بضاعة بعد. يمكنك الإدخال السريع بالأسماء فقط وسيتولى النظام توليد الباركود فورياً!
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFastModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Barcode className="w-4 h-4" />
                  <span>إدخال سريع لأسماء الأصناف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة صنف مفصل</span>
                </button>
              </div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              لا توجد أصناف تطابق الفلترة أو البحث المحدد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] sm:min-w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">اسم الصنف / القطعة</th>
                    <th className="p-3">الباركود</th>
                    <th className="p-3">القسم</th>
                    <th className="p-3">الكمية المتوفرة</th>
                    <th className="p-3">سعر التكلفة (الشراء)</th>
                    <th className="p-3">سعر البيع المقترح</th>
                    <th className="p-3">إجمالي القيمة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item, index) => {
                    const isPending = item.isPendingPricing || item.isPendingStock || !item.costPrice || item.quantity === 0;
                    const isRowEditing = inventoryFilter === 'fast_count' || Boolean(editingRows[item.id]) || isPending;
                    const rowData = editingRows[item.id] || {
                      costPrice: item.costPrice > 0 ? String(item.costPrice) : '',
                      sellingPrice: item.sellingPrice > 0 ? String(item.sellingPrice) : '',
                      quantity: item.quantity > 0 ? String(item.quantity) : '',
                    };

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isPending ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Name & Badges */}
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              {justSavedId === item.id && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-1.5 py-0.2 rounded animate-pulse">
                                  ✓ تم الحفظ
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.isPendingPricing || !item.costPrice ? (
                                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                                  ⚠️ يحتاج تسعير
                                </span>
                              ) : null}
                              {item.isPendingStock || item.quantity === 0 ? (
                                <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-300 font-bold px-1.5 py-0.2 rounded">
                                  ⚠️ بدون جرد كمية
                                </span>
                              ) : null}
                              {item.lastSoldDate && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  بيع مؤخراً: {item.lastSoldPrice ? `${item.lastSoldPrice} ر.ي` : ''} ({item.lastSoldDate})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Barcode */}
                        <td className="p-3">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                            <Barcode className="w-3 h-3 text-indigo-600" />
                            {item.barcode || '-'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                            {item.category === 'spare_parts'
                              ? 'قطع صيانة'
                              : item.category === 'sims'
                              ? 'شرائح'
                              : item.category === 'phones'
                              ? 'جوالات'
                              : 'إكسسوارات'}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="p-3">
                          {isRowEditing ? (
                            <input
                              type="number"
                              placeholder="0"
                              data-inv-row={index}
                              data-inv-field="quantity"
                              value={rowData.quantity}
                              onChange={(e) => handleRowChange(item.id, 'quantity', e.target.value)}
                              onKeyDown={(e) => handleInventoryKeyDown(e, index, 'quantity', item)}
                              onFocus={(e) => e.target.select()}
                              className="w-20 bg-white border border-slate-300 rounded-lg p-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 outline-none"
                              title="الكمية - اكتب ثم اضغط Enter للانتقال لسعر ضمار الصنف التالي وحفظ هذا الصنف"
                            />
                          ) : (
                            <span className="font-mono font-bold text-slate-800">{item.quantity || 0} حبة</span>
                          )}
                        </td>

                        {/* Cost Price */}
                        <td className="p-3">
                          {isRowEditing ? (
                            <input
                              type="number"
                              placeholder="سعر التكلفة"
                              data-inv-row={index}
                              data-inv-field="costPrice"
                              value={rowData.costPrice}
                              onChange={(e) => handleRowChange(item.id, 'costPrice', e.target.value)}
                              onKeyDown={(e) => handleInventoryKeyDown(e, index, 'costPrice', item)}
                              onFocus={(e) => e.target.select()}
                              className="w-24 bg-white border border-slate-300 rounded-lg p-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 outline-none"
                              title="سعر الضمار (التكلفة) - اكتب ثم اضغط Enter للانتقال لكمية نفس الصنف"
                            />
                          ) : (
                            <span className="font-mono text-slate-600">{formatCurrency(item.costPrice || 0)}</span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="p-3">
                          {isRowEditing ? (
                            <input
                              type="number"
                              placeholder="سعر البيع"
                              data-inv-row={index}
                              data-inv-field="sellingPrice"
                              value={rowData.sellingPrice}
                              onChange={(e) => handleRowChange(item.id, 'sellingPrice', e.target.value)}
                              onKeyDown={(e) => handleInventoryKeyDown(e, index, 'sellingPrice', item)}
                              onFocus={(e) => e.target.select()}
                              className="w-24 bg-white border border-slate-300 rounded-lg p-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 outline-none"
                            />
                          ) : (
                            <span className="font-mono text-emerald-700 font-bold">{formatCurrency(item.sellingPrice || 0)}</span>
                          )}
                        </td>

                        {/* Total Value */}
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {formatCurrency((item.quantity || 0) * (item.costPrice || 0))}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isRowEditing && (
                              <button
                                type="button"
                                onClick={() => handleSaveInline(item)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="حفظ التعديلات على هذا الصنف"
                              >
                                <Check className="w-3 h-3" />
                                <span>حفظ</span>
                              </button>
                            )}

                            {onDeleteInventoryItem && (
                              <button
                                onClick={() => {
                                  if (confirm(`هل تريد بالتأكيد حذف الصنف (${item.name}) من المخزون؟`)) {
                                    onDeleteInventoryItem(item.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="حذف الصنف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Shop Outflows */}
      {activeSubTab === 'outflows' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">مخروجات استخدام المحل (شواحن، وصلات، كاوية، أدوات)</h3>
            <span className="text-xs font-bold text-rose-700">
              إجمالي التكلفة: {formatCurrency(totalOutflowCost)}
            </span>
          </div>

          {outflowsTx.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-8">
              لا توجد مخروجات مسجلة للمحل حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] sm:min-w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">بيان المخروج</th>
                    <th className="p-3">القيمة</th>
                    <th className="p-3">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outflowsTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-600">{tx.date}</td>
                      <td className="p-3 font-bold text-slate-900">{tx.description}</td>
                      <td className="p-3 font-mono font-bold text-rose-600">{formatCurrency(tx.price)}</td>
                      <td className="p-3 text-slate-500">{tx.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Damaged items */}
      {activeSubTab === 'damaged' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">سجل البضاعة التالفة والخسائر</h3>
            <span className="text-xs font-bold text-amber-800">
              إجمالي قيمة التالف: {formatCurrency(totalDamagedCost)}
            </span>
          </div>

          {damagedTx.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-8">
              لا توجد عناصر تالفة مسجلة حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] sm:min-w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">بيان التالف</th>
                    <th className="p-3">الخسارة / التكلفة</th>
                    <th className="p-3">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {damagedTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-600">{tx.date}</td>
                      <td className="p-3 font-bold text-slate-900">{tx.description}</td>
                      <td className="p-3 font-mono font-bold text-amber-800">{formatCurrency(tx.cost || tx.price)}</td>
                      <td className="p-3 text-slate-500">{tx.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add New Inventory Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">إضافة صنف جديد للمخزون</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الصنف أو القطعة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شاشة سامسونج A12، كفر حماية، شاحن سريع..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم:</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                  >
                    <option value="accessories">إكسسوارات</option>
                    <option value="spare_parts">قطع صيانة</option>
                    <option value="phones">جوالات</option>
                    <option value="sims">شرائح</option>
                    <option value="tools">أدوات ومعدات</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المورد (اختياري):</label>
                  <input
                    type="text"
                    placeholder="العبصري، القاسمي..."
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكمية:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التكلفة (ر.ي):</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر البيع (ر.ي):</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newItemSellingPrice}
                    onChange={(e) => setNewItemSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">حد تنبيه النواقص (أقل كمية للطلب):</label>
                <input
                  type="number"
                  min="1"
                  value={newItemMinQty}
                  onChange={(e) => setNewItemMinQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md cursor-pointer"
                >
                  إضافة الصنف للمخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fast Bulk Product Names Modal */}
      <FastProductNamesModal
        isOpen={isFastModalOpen}
        onClose={() => setIsFastModalOpen(false)}
        onAddItems={(items) => {
          if (onBatchAddInventoryItems) {
            onBatchAddInventoryItems(items);
          } else if (onAddInventoryItem) {
            items.forEach((it) => onAddInventoryItem(it));
          }
        }}
      />
    </div>
  );
};
