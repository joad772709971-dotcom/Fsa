import React, { useState } from 'react';
import { formatNumber } from '../utils/accounting';
import { exportAssetsToExcel } from '../utils/excelExport';
import { getTodayDateString } from '../utils/dateHelper';
import { 
  HardDrive, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Printer, 
  FileSpreadsheet,
  Trash2, 
  CheckCircle2, 
  Wrench, 
  Shield, 
  Cpu
} from 'lucide-react';

export interface ShopAssetItem {
  id: string;
  name: string;
  category: 'معدات صيانة' | 'أجهزة إلكترونية' | 'طاقة وكهرباء' | 'أثاث وديكور' | 'أخرى';
  purchaseCost: number;
  currentValue: number;
  purchaseDate: string;
  condition: 'ممتازة' | 'جيدة' | 'تحتاج صيانة' | 'تالفة';
  notes?: string;
}

interface AssetsViewProps {
  assets: ShopAssetItem[];
  onAddAsset: (asset: ShopAssetItem) => void;
  onDeleteAsset: (id: string) => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
  assets,
  onAddAsset,
  onDeleteAsset
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('الكل');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ShopAssetItem['category']>('معدات صيانة');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [condition, setCondition] = useState<ShopAssetItem['condition']>('ممتازة');
  const [purchaseDate, setPurchaseDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');

  // Financial Metrics
  const totalAssetsCount = assets.length;
  const totalPurchaseCost = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'الكل' || a.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(purchaseCost) || 0;
    const val = parseFloat(currentValue) || cost;

    const newAsset: ShopAssetItem = {
      id: `asset-${Date.now()}`,
      name: name.trim(),
      category,
      purchaseCost: cost,
      currentValue: val,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      condition,
      notes: notes.trim() || undefined
    };

    onAddAsset(newAsset);
    setIsAddModalOpen(false);
    setName('');
    setPurchaseCost('');
    setCurrentValue('');
    setNotes('');
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Header & Metrics */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black shadow-inner shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">سجل الأصول ومعدات وتجهيزات المحل</h2>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  {totalAssetsCount} أصل مقيد
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                حصر أجهزة ومعدات الصيانة، منظومة الطاقة، أجهزة الكمبيوتر، والفترينات والديكور
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportAssetsToExcel(assets)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px] shadow-sm"
              title="تصدير سجل الأصول إلى إكسل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير الأصول (Excel)</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أصل / معدة جديدة</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة جرد الأصول</span>
            </button>
          </div>

        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/60">
          
          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي القيمة التقديرية الحالية للأصول:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-indigo-400 font-mono-num">{formatNumber(totalCurrentValue)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي تكلفة الشراء الأصلية:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-white font-mono-num">{formatNumber(totalPurchaseCost)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-emerald-400 block font-medium">عدد المعدات والأصول المسجلة:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono-num">{totalAssetsCount}</span>
              <span className="text-[10px] text-slate-400">قطعة / جهاز</span>
            </div>
          </div>

        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أصل أو معدة..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            {['الكل', 'معدات صيانة', 'أجهزة إلكترونية', 'طاقة وكهرباء', 'أثاث وديكور'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#0F172A] text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-3.5 font-bold">اسم الأصل والمعدة</th>
                <th className="py-3 px-3.5 font-bold">التصنيف</th>
                <th className="py-3 px-3.5 font-bold text-left">سعر الشراء</th>
                <th className="py-3 px-3.5 font-bold text-left">القيمة الحالية</th>
                <th className="py-3 px-3.5 font-bold text-center">الحالة الفنية</th>
                <th className="py-3 px-3.5 font-bold">تاريخ الشراء</th>
                <th className="py-3 px-3.5 font-bold">ملاحظات</th>
                <th className="py-3 px-3.5 font-bold text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <HardDrive className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-bold text-sm text-slate-300">لا توجد أصول مقيدة حالياً</p>
                    <p className="text-xs text-slate-500 mt-1">اضغط على زر (إضافة أصل / معدة جديدة) لتقييد كاوية الصيانة، المولد، شاشات الفحص، إلخ.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 font-bold text-white">
                      {asset.name}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-[#0F172A] border border-slate-700 text-slate-300 text-[10px]">
                        {asset.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-left font-mono-num text-slate-300">
                      {formatNumber(asset.purchaseCost)} ر.ي
                    </td>
                    <td className="py-3 px-3.5 text-left font-mono-num font-bold text-emerald-400">
                      {formatNumber(asset.currentValue)} ر.ي
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        asset.condition === 'ممتازة'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : asset.condition === 'جيدة'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : asset.condition === 'تحتاج صيانة'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono-num text-slate-400">
                      {asset.purchaseDate}
                    </td>
                    <td className="py-3 px-3.5 text-slate-400">
                      {asset.notes || '—'}
                    </td>
                    <td className="py-3 px-3.5 text-center no-print">
                      <button
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف (${asset.name})؟`)) {
                            onDeleteAsset(asset.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            
            <div className="p-4 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>إضافة أصل أو معدة محل جديدة</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3.5 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">اسم الأصل / المعدة: *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: هوت إير كويك 861DW، كمبيوتر فحص..."
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">التصنيف:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="معدات صيانة">معدات صيانة</option>
                    <option value="أجهزة إلكترونية">أجهزة إلكترونية</option>
                    <option value="طاقة وكهرباء">طاقة وكهرباء</option>
                    <option value="أثاث وديكور">أثاث وديكور</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">تكلفة الشراء (ر.ي): *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchaseCost}
                    onChange={e => setPurchaseCost(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">القيمة التقديرية الحالية (ر.ي):</label>
                  <input
                    type="number"
                    min="0"
                    value={currentValue}
                    onChange={e => setCurrentValue(e.target.value)}
                    placeholder="إذا لم تحدد ستكون مساوية للشراء"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">الحالة الفنية:</label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ممتازة">ممتازة</option>
                    <option value="جيدة">جيدة</option>
                    <option value="تحتاج صيانة">تحتاج صيانة</option>
                    <option value="تالفة">تالفة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">تاريخ الشراء:</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">ملاحظات ومواصفات:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-700/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-slate-400 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md transition cursor-pointer"
                >
                  حفظ الأصل
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
