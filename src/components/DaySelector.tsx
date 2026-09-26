import React from 'react';
import { DayRecord } from '../types';
import { calculateDay, formatNumber } from '../utils/accounting';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

interface DaySelectorProps {
  days: DayRecord[];
  selectedDayId: string;
  onSelectDay: (id: string) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  selectedDayId,
  onSelectDay,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#0F172A] border-b border-slate-700/80 py-3 px-4 sm:px-6 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs shrink-0">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>اختر اليوم:</span>
        </div>

        {/* Scroll Buttons & List */}
        <div className="relative flex items-center flex-1 overflow-hidden">
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-slate-300 border border-slate-700 transition z-10 shrink-0 ml-1 cursor-pointer"
            title="السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div
            ref={containerRef}
            className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none scroll-smooth w-full"
          >
            {days.map(day => {
              const isSelected = day.id === selectedDayId;
              const calc = calculateDay(day);
              return (
                <button
                  key={day.id}
                  id={`day-select-btn-${day.dayNumber}`}
                  onClick={() => onSelectDay(day.id)}
                  className={`flex flex-col items-start px-3.5 py-1.5 rounded-xl border text-right transition shrink-0 cursor-pointer min-w-[130px] ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-sm font-bold'
                      : day.isClosed
                      ? 'bg-[#1E293B]/50 text-slate-500 border-slate-800 hover:border-slate-700'
                      : 'bg-[#1E293B] hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="font-bold">{day.dayTitle}</span>
                    {day.isClosed ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-emerald-400'}`} />
                    )}
                  </div>
                  
                  <div className="text-[11px] mt-0.5 font-mono-num font-semibold">
                    {day.isClosed ? (
                      <span className="text-rose-400 font-normal">مغلق</span>
                    ) : (
                      <span className={isSelected ? 'text-emerald-300' : 'text-emerald-400'}>
                        دخل: {formatNumber(calc.grossDailyRevenue)} ر.ي
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-slate-300 border border-slate-700 transition z-10 shrink-0 mr-1 cursor-pointer"
            title="التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

