import React, { useState } from 'react';
import { DayRecord, MusabItem } from '../types';
import { formatNumber } from '../utils/accounting';
import { Home, User, DollarSign, Calendar, Filter, Plus, FileSpreadsheet, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Briefcase, Smartphone, Wallet, RotateCcw, Printer } from 'lucide-react';
import { INITIAL_OWNER_DAY4_SETTLEMENT } from '../data/initialPartnersData';
import { exportMusabLedgerToExcel } from '../utils/excelExport';

interface MusabLedgerViewProps {
  days: DayRecord[];
  onAddMusabEntry: (dayId: string, item: MusabItem) => void;
  ownerName?: string;
}

export const MusabLedgerView: React.FC<MusabLedgerViewProps> = ({
  days,
  onAddMusabEntry,
  ownerName = 'مصعب',
}) => {
  const [filterType, setFilterType] = useState<'all' | 'house' | 'personal'>('all');
  const [showDay4Settlement, setShowDay4Settlement] = useState(false);

  const houseTitle = `بيت ${ownerName}`;
  const personalTitle = `${ownerName} شخصياً`;

  // Collect all transactions
  const allEntries: {
    dayId: string;
    dayNumber: number;
    dayTitle: string;
    date: string;
    item: MusabItem;
    category: string;
  }[] = [];

  let totalHouse = 0;
  let totalPersonal = 0;

  days.forEach(day => {
    (day.musabHouse || []).forEach(mh => {
      totalHouse += Number(mh.amount) || 0;
      allEntries.push({
        dayId: day.id,
        dayNumber: day.dayNumber,
        dayTitle: day.dayTitle,
        date: day.date,
        item: mh,
        category: houseTitle,
      });
    });

    (day.musabPersonal || []).forEach(mp => {
      totalPersonal += Number(mp.amount) || 0;
      allEntries.push({
        dayId: day.id,
        dayNumber: day.dayNumber,
        dayTitle: day.dayTitle,
        date: day.date,
        item: mp,
        category: personalTitle,
      });
    });
  });

  const filteredEntries = allEntries.filter(entry => {
    if (filterType === 'house') return entry.category === houseTitle;
    if (filterType === 'personal') return entry.category === personalTitle;
    return true;
  });

  const exportMusabExcel = () => {
    exportMusabLedgerToExcel(days, filterType);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">كشف حساب {houseTitle} وحساب {ownerName} المنفصل</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            فصل تام ومستقل بين مسحوبات البيت المنزلية ومصاريف {ownerName} الشخصية والباقات والتسليمات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 no-print">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">عرض الكل ({houseTitle} + شخصي)</option>
            <option value="house">حساب {houseTitle} فقط</option>
            <option value="personal">حساب {personalTitle} فقط</option>
          </select>

          <button
            onClick={exportMusabExcel}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسل</span>
          </button>
        </div>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* House Account */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-[#1E293B] to-[#1E293B] p-5 rounded-2xl border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300">١. إجمالي مسحوبات {houseTitle}</span>
            <Home className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-400 font-mono-num">
              {formatNumber(totalHouse)}
            </span>
            <span className="text-xs text-emerald-500 font-bold mr-1">ريال يمني</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">المسحوبات المنزلية اليومية</p>
        </div>

        {/* Personal Account */}
        <div className="bg-gradient-to-br from-amber-950/40 via-[#1E293B] to-[#1E293B] p-5 rounded-2xl border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">٢. إجمالي {personalTitle} والباقات</span>
            <User className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-400 font-mono-num">
              {formatNumber(totalPersonal)}
            </span>
            <span className="text-xs text-amber-500 font-bold mr-1">ريال يمني</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">باقات، تحويلات ومصاريف شخصية</p>
        </div>

        {/* Combined Total */}
        <div className="bg-[#1E293B] p-5 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">المجموع الكلي لحسابات مصعب</span>
            <DollarSign className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono-num">
              {formatNumber(totalHouse + totalPersonal)}
            </span>
            <span className="text-xs text-slate-400 font-bold mr-1">ريال يمني</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">إجمالي ما تم سحبه وتغطيته لمصعب وبيته</p>
        </div>

      </div>

      {/* Day 4 Special Trip Settlement Banner for Owner */}
      <div className="bg-[#1E293B] border border-indigo-500/30 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              💼
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                تسليمات المالك وحركة السيولة في يوم الدعم (يوم 4 شهر 8)
              </h4>
              <p className="text-[11px] text-slate-400">
                استلام مبيعات الجوالات من حمدان (270.5k - 2k تالفة) وزلط المحل (50k) وتصفية رحلة صنعاء
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDay4Settlement(!showDay4Settlement)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            <span>{showDay4Settlement ? 'إخفاء التفاصيل' : 'عرض تفاصيل التصفية'}</span>
            {showDay4Settlement ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showDay4Settlement && (
          <div className="mt-4 pt-4 border-t border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                استلام من حمدان (مبيعات جوالات)
              </span>
              <div className="flex justify-between text-slate-300">
                <span>المستلم:</span>
                <span className="font-mono-num font-bold">270,500 ر.ي</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>رد عملة تالفة:</span>
                <span className="font-mono-num font-bold">- 2,000 ر.ي</span>
              </div>
              <div className="flex justify-between text-cyan-400 font-bold border-t border-slate-800 pt-1">
                <span>الصافي المقبول:</span>
                <span className="font-mono-num">268,500 ر.ي</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="text-indigo-300 font-bold flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                استلام من زلط المحل (50 ألف)
              </span>
              <div className="flex justify-between text-amber-300">
                <span>توفية لشراء الدعم:</span>
                <span className="font-mono-num font-bold">15,000 ر.ي</span>
              </div>
              <div className="flex justify-between text-teal-300">
                <span>مرسل لمحمد مياس (يوم 4):</span>
                <span className="font-mono-num font-bold">18,500 ر.ي</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                <span>المتبقي المردود للمحل:</span>
                <span className="font-mono-num">16,500 ر.ي</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                إجمالي المردود لدرج المحل
              </span>
              <div className="flex justify-between text-slate-300">
                <span>متبقي زلط المحل:</span>
                <span className="font-mono-num font-bold">16,500 ر.ي</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>عملة تالفة من حمدان:</span>
                <span className="font-mono-num font-bold">2,000 ر.ي</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-black text-sm border-t border-slate-800 pt-1">
                <span>إجمالي الكاش المردود:</span>
                <span className="font-mono-num">18,500 ر.ي</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Ledger Table */}
      <div className="bg-[#1E293B] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">سجل العمليات والمسحوبات التفصيلي</h3>
          <span className="text-xs text-slate-400 font-mono-num">عدد العمليات: {filteredEntries.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700 font-bold">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">اليوم</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">نوع الحساب</th>
                <th className="py-3 px-4">المبلغ المسحوب</th>
                <th className="py-3 px-4">البيان والتفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredEntries.map((entry, index) => (
                <tr key={`${entry.dayId}-${index}`} className="hover:bg-slate-700/30 transition">
                  <td className="py-3 px-4 text-slate-500 font-mono-num">{index + 1}</td>
                  <td className="py-3 px-4 font-bold text-white">{entry.dayTitle}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono-num">{entry.date}</td>
                  <td className="py-3 px-4">
                    {entry.category === 'بيت مصعب' ? (
                      <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        بيت مصعب
                      </span>
                    ) : (
                      <span className="bg-amber-950/80 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        مصعب شخصياً
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono-num text-sm font-bold">
                    <span className={entry.category === 'بيت مصعب' ? 'text-emerald-400' : 'text-amber-400'}>
                      {formatNumber(entry.item.amount)} ر.ي
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-medium">{entry.item.description}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0F172A] font-black text-white text-xs border-t-2 border-slate-700">
                <td colSpan={4} className="py-4 px-4 text-sm text-emerald-400">
                  إجمالي المسحوبات المعروضة
                </td>
                <td className="py-4 px-4 font-mono-num text-base text-emerald-400">
                  {formatNumber(filteredEntries.reduce((sum, e) => sum + (Number(e.item.amount) || 0), 0))} ر.ي
                </td>
                <td className="py-4 px-4 text-slate-400 font-normal">
                  سجل مدقق ومفصول
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
