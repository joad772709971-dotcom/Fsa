import React, { useState } from 'react';
import { DamagedItem } from '../types';
import { formatNumber } from '../utils/accounting';
import { exportDamagedToExcel } from '../utils/excelExport';
import { getTodayDateString } from '../utils/dateHelper';
import { 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  AlertOctagon, 
  DollarSign, 
  Calendar, 
  User, 
  Printer, 
  FileSpreadsheet,
  CheckCircle2, 
  Edit3,
  MessageSquare
} from 'lucide-react';

interface DamagedViewProps {
  items: DamagedItem[];
  onAddItem: (item: DamagedItem) => void;
  onDeleteItem: (id: string) => void;
}

export const DamagedView: React.FC<DamagedViewProps> = ({
  items,
  onAddItem,
  onDeleteItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<DamagedItem['category']>('قطع غيار تالفة');
  const [lossValue, setLossValue] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [reason, setReason] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('المهندس');

  // Calculations
  const totalLossValue = items.reduce((sum, item) => sum + (item.lossValue || 0), 0);
  const partsLossValue = items.filter(i => i.category === 'قطع غيار تالفة').reduce((sum, i) => sum + (i.lossValue || 0), 0);
  const lostMissingValue = items.filter(i => i.category === 'فاقد/ضياع').reduce((sum, i) => sum + (i.lossValue || 0), 0);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.responsiblePerson && item.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'الكل' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !lossValue) return;

    const newItem: DamagedItem = {
      id: `dmg-${Date.now()}`,
      itemName: itemName.trim(),
      category,
      lossValue: parseFloat(lossValue) || 0,
      date: date || new Date().toISOString().split('T')[0],
      reason: reason.trim() || 'تلف أثناء العمل',
      responsiblePerson: responsiblePerson.trim() || undefined
    };

    onAddItem(newItem);
    setIsAddModalOpen(false);
    setItemName('');
    setLossValue('');
    setReason('');
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Top Header & Metrics */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black shadow-inner shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">سجل التالف والفاقد والضياع</h2>
                <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                  {items.length} حالة مسجلة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                حصر خسائر القطع التالفة أثناء الصيانة والتركيب، الإكسسوارات المعطوبة، والمفقودات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportDamagedToExcel(items)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px] shadow-sm"
              title="تصدير كشف التوالف والفاقد إلى إكسل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير التوالف (Excel)</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل حالة تلف / فاقد</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السجل</span>
            </button>
          </div>

        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/60">
          
          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي قيمة الخسائر المسجلة:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-red-400 font-mono-num">{formatNumber(totalLossValue)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-slate-400 block font-medium">خسائر قطع الصيانة (شاشات/فلاتات):</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono-num">{formatNumber(partsLossValue)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-slate-400 block font-medium">خسائر الفاقد والضياع:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-rose-400 font-mono-num">{formatNumber(lostMissingValue)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
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
              placeholder="ابحث باسم القطعة التالفة أو المسؤول..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            {['الكل', 'قطع غيار تالفة', 'إكسسوار تالف', 'فاقد/ضياع', 'أخرى'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Damaged Items Table */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#0F172A] text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-3.5 font-bold">التاريخ</th>
                <th className="py-3 px-3.5 font-bold">الصنف والقطعة التالفة</th>
                <th className="py-3 px-3.5 font-bold">التصنيف</th>
                <th className="py-3 px-3.5 font-bold">سبب التلف</th>
                <th className="py-3 px-3.5 font-bold">المسؤول</th>
                <th className="py-3 px-3.5 font-bold text-left">قيمة الخسارة</th>
                <th className="py-3 px-3.5 font-bold text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/60" />
                    <p className="font-bold text-sm text-slate-300">لا توجد سجلات تالف أو فاقد مسجلة</p>
                    <p className="text-xs text-slate-500 mt-1">اضغط على زر "تسجيل حالة تلف / فاقد" لتوثيق أي قطع تالفة أو مفقودة</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 font-mono-num text-slate-400">
                      {item.date}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-white">
                      {item.itemName}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#0F172A] border border-slate-700 text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-300">
                      {item.reason}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-indigo-300">
                      {item.responsiblePerson || 'المحل'}
                    </td>
                    <td className="py-3 px-3.5 text-left font-mono-num font-black text-red-400">
                      {formatNumber(item.lossValue)} ر.ي
                    </td>
                    <td className="py-3 px-3.5 text-center no-print">
                      <button
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف (${item.itemName})؟`)) {
                            onDeleteItem(item.id);
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

      {/* Add Damaged Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            
            <div className="p-4 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>تسجيل حالة تلف أو فاقد جديدة</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-400 font-bold mb-1">اسم الصنف أو القطعة التالفة: *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="مثال: شاشة ردمي نوت 9 انكسرت أثناء الكبس، فلاتة مقطوعة..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">التصنيف:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value="قطع غيار تالفة">قطع غيار تالفة (صيانة)</option>
                    <option value="إكسسوار تالف">إكسسوار معطوب</option>
                    <option value="فاقد/ضياع">فاقد / ضياع</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">قيمة الخسارة (ر.ي): *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lossValue}
                    onChange={e => setLossValue(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold text-red-400 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">التاريخ:</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">المسؤول / الشخص:</label>
                  <select
                    value={responsiblePerson}
                    onChange={e => setResponsiblePerson(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value="المهندس">المهندس</option>
                    <option value="حمدان">حمدان</option>
                    <option value="مصعب">مصعب</option>
                    <option value="المحل (عام)">المحل (عام)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">سبب التلف أو الملاحظات:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="مثال: تلف أثناء فك الجهاز، عيب أثناء التركيب..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
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
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black shadow-md transition cursor-pointer"
                >
                  تسجيل في السجل
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
