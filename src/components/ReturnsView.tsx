import React, { useState } from 'react';
import { DayRecord, ReturnItem } from '../types';
import { formatNumber } from '../utils/accounting';
import { exportReturnsToExcel } from '../utils/excelExport';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  UserCheck, 
  Truck, 
  MessageSquare, 
  Send, 
  Printer, 
  FileSpreadsheet,
  CheckCircle2, 
  Trash2,
  Edit3
} from 'lucide-react';

interface ReturnsViewProps {
  days: DayRecord[];
  onAddReturnToDay?: (dayId: string, item: ReturnItem) => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({
  days,
  onAddReturnToDay
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('الكل');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Fields
  const [targetDayId, setTargetDayId] = useState(days[days.length - 1]?.id || days[0]?.id);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [returnType, setReturnType] = useState<ReturnItem['returnType']>('مرتجع زبون');
  const [party, setParty] = useState('');
  const [notes, setNotes] = useState('');

  // Collect all returns across all days
  const allReturns: {
    dayId: string;
    dayNumber: number;
    dayTitle: string;
    date: string;
    item: ReturnItem;
  }[] = [];

  days.forEach(day => {
    (day.returns || []).forEach(ret => {
      allReturns.push({
        dayId: day.id,
        dayNumber: day.dayNumber,
        dayTitle: day.dayTitle,
        date: day.date,
        item: ret
      });
    });
  });

  // Calculations
  const totalReturnsAmount = allReturns.reduce((sum, r) => sum + (r.item.amount || 0), 0);
  const customerReturnsAmount = allReturns.filter(r => r.item.returnType === 'مرتجع زبون').reduce((sum, r) => sum + (r.item.amount || 0), 0);
  const supplierReturnsAmount = allReturns.filter(r => r.item.returnType === 'مرتجع لتاجر').reduce((sum, r) => sum + (r.item.amount || 0), 0);
  const musabReturnsAmount = allReturns.filter(r => r.item.returnType === 'مسلم لمصعب').reduce((sum, r) => sum + (r.item.amount || 0), 0);

  // Filtered returns
  const filteredReturns = allReturns.filter(r => {
    const matchesSearch = r.item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.item.party && r.item.party.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (r.item.notes && r.item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          r.dayTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'الكل' || r.item.returnType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSaveReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !onAddReturnToDay) return;

    const newItem: ReturnItem = {
      id: `ret-${Date.now()}`,
      title: title.trim(),
      amount: parseFloat(amount) || 0,
      returnType,
      party: party.trim() || undefined,
      notes: notes.trim() || undefined
    };

    onAddReturnToDay(targetDayId, newItem);
    setIsAddModalOpen(false);
    setTitle('');
    setAmount('');
    setParty('');
    setNotes('');
  };

  // WhatsApp Share Return Receipt
  const handleShareReturnWhatsApp = (r: typeof allReturns[0]) => {
    const msg = `🧾 *سند إرجاع ومردودات - محل قبال للجوالات*\n` +
      `📅 التاريخ: ${r.date} (${r.dayTitle})\n` +
      `🔹 البيان: *${r.item.title}*\n` +
      `💰 المبلغ المرتجع: *${formatNumber(r.item.amount)} ر.ي*\n` +
      `👤 نوع المرتجع: ${r.item.returnType} ${r.item.party ? `(${r.item.party})` : ''}\n` +
      `${r.item.notes ? `📝 ملاحظات: ${r.item.notes}\n` : ''}` +
      `--------------------------------\n` +
      `محل قبال للجوالات والصيانة - ذمار`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Top Header & Metrics Bar */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black shadow-inner shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">إدارة المرتجع والمردودات (زبائن وتجار)</h2>
                <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                  {allReturns.length} حركة مرتجع مسجلة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة مبالغ المرتجع، مستحقات الزبائن، بضائع التجار المرجعة، والمسلم لمصعب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportReturnsToExcel(days)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px] shadow-sm"
              title="تصدير كشف المرتجعات إلى ملف إكسل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير المرتجعات (Excel)</span>
            </button>

            {onAddReturnToDay && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل حركة مرتجع</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
              title="طباعة كشف المرتجع"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>

        </div>

        {/* 4 Financial KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/60">
          
          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي المرتجع والمردودات:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-white font-mono-num">{formatNumber(totalReturnsAmount)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-orange-400 block font-medium">مرتجع للزبائن (مسترجع نقد):</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-orange-400 font-mono-num">{formatNumber(customerReturnsAmount)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-blue-400 block font-medium">مرتجع لتجار وموردين:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-blue-400 font-mono-num">{formatNumber(supplierReturnsAmount)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-emerald-400 block font-medium">مسلم لمصعب أو الطرف الآخر:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono-num">{formatNumber(musabReturnsAmount)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث في البيان أو اسم الزبون / التاجر..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            {['الكل', 'مرتجع زبون', 'مرتجع لتاجر', 'مسلم لمصعب'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedType === type
                    ? 'bg-orange-500 text-slate-950 shadow-sm'
                    : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#0F172A] text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-3.5 font-bold">اليوم والتاريخ</th>
                <th className="py-3 px-3.5 font-bold">البيان وتفاصيل المرتجع</th>
                <th className="py-3 px-3.5 font-bold">النوع والجهة</th>
                <th className="py-3 px-3.5 font-bold text-left">المبلغ المرتجع</th>
                <th className="py-3 px-3.5 font-bold text-center no-print">مشاركة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <RotateCcw className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-bold text-sm text-slate-300">لا توجد حركات مرتجع مطابقة</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map(r => (
                  <tr key={r.item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-white">{r.dayTitle}</div>
                      <div className="text-[10px] text-slate-400 font-mono-num">{r.date}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-200">{r.item.title}</div>
                      {r.item.notes && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{r.item.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        r.item.returnType === 'مرتجع زبون'
                          ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                          : r.item.returnType === 'مرتجع لتاجر'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {r.item.returnType} {r.item.party ? `(${r.item.party})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-left font-mono-num font-black text-sm text-rose-400">
                      {formatNumber(r.item.amount)} ر.ي
                    </td>
                    <td className="py-3 px-3.5 text-center no-print">
                      <button
                        onClick={() => handleShareReturnWhatsApp(r)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                        title="إرسال إشعار وسند الإرجاع عبر واتساب"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Return Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            
            <div className="p-4 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-orange-400" />
                <span>تسجيل حركة مرتجع جديدة</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReturn} className="p-4 sm:p-5 space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-400 font-bold mb-1">اليوم المحاسبي المسجل فيه:</label>
                <select
                  value={targetDayId}
                  onChange={e => setTargetDayId(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none cursor-pointer"
                >
                  {days.map(d => (
                    <option key={d.id} value={d.id}>{d.dayTitle} ({d.date})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">بيان المرتجع: *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: مرتجع شاشة سامسونج تالفة، استرجاع سماعة بلوتوث..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">المبلغ المرتجع (ر.ي): *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold text-rose-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">نوع المرتجع:</label>
                  <select
                    value={returnType}
                    onChange={e => setReturnType(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    <option value="مرتجع زبون">مرتجع زبون (خرج من الصندوق)</option>
                    <option value="مرتجع لتاجر">مرتجع لتاجر / مورد</option>
                    <option value="مسلم لمصعب">مسلم لمصعب</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">اسم الطرف (الزبون / التاجر):</label>
                <input
                  type="text"
                  value={party}
                  onChange={e => setParty(e.target.value)}
                  placeholder="اسم الزبون أو التاجر المورد..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">ملاحظات وسبب الإرجاع:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="السبب: عيب مصنعي، عدم التوافق، إلخ..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
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
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black shadow-md transition cursor-pointer"
                >
                  حفظ المرتجع
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
