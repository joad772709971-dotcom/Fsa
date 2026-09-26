import React, { useState } from 'react';
import { 
  DayRecord 
} from '../types';
import { calculateDay, formatNumber } from '../utils/accounting';
import { exportToExcel } from '../utils/excelExport';
import { 
  BookOpen, 
  Calendar, 
  ShoppingBag, 
  Smartphone, 
  Wrench, 
  Zap, 
  Receipt, 
  Home, 
  Users, 
  Truck, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  FileSpreadsheet,
  Copy, 
  Check, 
  ArrowRight,
  Sparkles,
  Info,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DailyNotebookMatcherProps {
  days: DayRecord[];
  onSelectDay?: (dayId: string) => void;
}

export const DailyNotebookMatcher: React.FC<DailyNotebookMatcherProps> = ({ 
  days, 
  onSelectDay 
}) => {
  const [selectedDayId, setSelectedDayId] = useState<string>(days.length > 0 ? days[0].id : '');
  const [copied, setCopied] = useState(false);

  const currentDay = days.find(d => d.id === selectedDayId) || days[0];
  if (!currentDay) return null;

  const calc = calculateDay(currentDay);

  // Copy structured ledger text for WhatsApp / Records
  const handleCopySummary = () => {
    const lines = [
      `📖 *مطابقة الدفتر اليومي - ${currentDay.dayTitle}*`,
      `📅 التاريخ: ${currentDay.date}`,
      currentDay.isClosed ? '🔴 حالة المحل: مغلق (إجازة)' : '',
      `━━━━━━━━━━━━━━━━━━`,
      `🟢 *المقبوضات والدخل:*`,
      `• إكسسوارات وشرايح: ${formatNumber(calc.accessoriesTotal)} ر.ي (${(currentDay.accessories || []).length} صنف)`,
      `• مبيعات جوالات (الواصل): ${formatNumber(calc.phonesPaidTotal)} ر.ي`,
      `• أجور صيانة وبرمجة: ${formatNumber(calc.maintenanceTotal)} ر.ي`,
      `• مبيعات رصيد شامل الفائدة: ${formatNumber(calc.rechargeSalesWithProfit)} ر.ي (فائدة: ${formatNumber(calc.rechargeProfit)} ر.ي)`,
      `💰 *إجمالي الدخل المحصل: ${formatNumber(calc.grossDailyRevenue)} ر.ي*`,
      `━━━━━━━━━━━━━━━━━━`,
      `🔴 *المخروجات والمدفوعات:*`,
      `• صرفة ومصروفات المحل: ${formatNumber(calc.expensesTotal)} ر.ي`,
      `• مسحوبات بيت مصعب: ${formatNumber(calc.musabHouseTotal)} ر.ي`,
      calc.musabPersonalTotal > 0 ? `• مصعب شخصياً وباقات: ${formatNumber(calc.musabPersonalTotal)} ر.ي` : '',
      `• صرفة ومستحقات العمال: ${formatNumber(calc.workersTotal)} ر.ي`,
      `• حوالات ومشتريات تجار: ${formatNumber(calc.supplierTransfersTotal)} ر.ي`,
      calc.returnsTotal > 0 ? `• مرتجعات: ${formatNumber(calc.returnsTotal)} ر.ي` : '',
      `💸 *إجمالي المخروجات: ${formatNumber(calc.totalOutflows)} ر.ي*`,
      `━━━━━━━━━━━━━━━━━━`,
      `⚖️ *صافي الصندوق لليوم: ${formatNumber(calc.netDayCashChange)} ر.ي*`,
      currentDay.notes ? `📝 ملاحظات: ${currentDay.notes}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrintDay = () => {
    window.print();
  };

  return (
    <div className="bg-[#1E293B] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
      
      {/* Top Header of Matcher */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-[#1E293B] to-[#1E293B] border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>أداة مطابقة الدفتر اليومي السريعة</span>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-normal">
                  مطابقة فورية 1:1
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر أي يوم بنقرة واحدة لتظهر لك كافة تفاصيل الدفتر الورقي لمطابقة الصندوق والبنود بنداً ببند
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 no-print shrink-0 flex-wrap">
          <button
            onClick={() => exportToExcel([currentDay])}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer min-h-[40px]"
            title="تصدير هذا اليوم المحدد إلى ملف إكسل شامل"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير اليوم (Excel)</span>
          </button>

          <button
            onClick={handleCopySummary}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer min-h-[40px] ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="نسخ كشف مطابقة اليوم لمشاركته عبر الواتساب"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ الكشف!' : 'نسخ كشف اليوم'}</span>
          </button>

          <button
            onClick={handlePrintDay}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer min-h-[40px]"
            title="طباعة كشف مطابقة اليوم"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة اليوم</span>
          </button>
        </div>
      </div>

      {/* Fast Interactive Day Selector Bar */}
      <div className="p-3 sm:p-4 bg-[#0F172A] border-b border-slate-700 no-print">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>اختر اليوم للمطابقة:</span>
          </span>
          <span className="text-[11px] text-slate-400">
            اليوم المعروض: <strong className="text-indigo-300 font-bold">{currentDay.dayTitle}</strong>
          </span>
        </div>

        {/* Day Pills Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
          {days.map(d => {
            const isSelected = d.id === selectedDayId;
            return (
              <button
                key={d.id}
                id={`match-day-pill-${d.dayNumber}`}
                onClick={() => setSelectedDayId(d.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition shrink-0 cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-105'
                    : d.isClosed
                    ? 'bg-slate-900/60 text-slate-500 border-slate-800 hover:border-slate-700'
                    : 'bg-[#1E293B] hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {d.isClosed ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                )}
                <span>يوم {d.dayNumber}</span>
                {d.isClosed && <span className="text-[10px] text-rose-400 font-normal">(مغلق)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Ledger Content for Selected Day */}
      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Closed Day Banner */}
        {currentDay.isClosed && (
          <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-2xl flex items-center gap-3 text-rose-200">
            <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">هذا اليوم تم تسجيله كمحل مغلق (إجازة)</h4>
              <p className="text-xs text-rose-300 mt-0.5">{currentDay.notes || 'لا توجد حركة مبيعات أو صيانة أو مصاريف في هذا اليوم.'}</p>
            </div>
          </div>
        )}

        {/* Daily Scorecard Matcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          <div className="bg-[#0F172A] p-4 rounded-2xl border border-emerald-500/30">
            <span className="text-xs font-bold text-emerald-400 block mb-1">🟢 إجمالي مقبوضات ودخل اليوم:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-300 font-mono-num">
                {formatNumber(calc.grossDailyRevenue)}
              </span>
              <span className="text-xs text-emerald-500">ر.ي</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              إكسسوارات ({formatNumber(calc.accessoriesTotal)}) + جوالات ({formatNumber(calc.phonesPaidTotal)}) + صيانة ({formatNumber(calc.maintenanceTotal)}) + رصيد ({formatNumber(calc.rechargeSalesWithProfit)})
            </p>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-2xl border border-rose-500/30">
            <span className="text-xs font-bold text-rose-400 block mb-1">🔴 إجمالي مخروجات ومدفوعات اليوم:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-300 font-mono-num">
                {formatNumber(calc.totalOutflows)}
              </span>
              <span className="text-xs text-rose-500">ر.ي</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              مصروفات ({formatNumber(calc.expensesTotal)}) + بيت مصعب ({formatNumber(calc.musabHouseTotal + calc.musabPersonalTotal)}) + عمال ({formatNumber(calc.workersTotal)}) + تجار ({formatNumber(calc.supplierTransfersTotal)})
            </p>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-2xl border border-indigo-500/30">
            <span className="text-xs font-bold text-indigo-300 block mb-1">⚖️ صافي الصندوق المقفل لليوم:</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono-num ${calc.netDayCashChange >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                {formatNumber(calc.netDayCashChange)}
              </span>
              <span className="text-xs text-indigo-400">ر.ي</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {calc.netDayCashChange >= 0 ? 'فائض كاش في الصندوق' : 'عجز / سحب كاش من الصندوق'}
            </p>
          </div>

        </div>

        {/* Detailed Breakdown Grid - Like Physical Notebook */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Section 1: Accessories */}
          <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">1. كشف الإكسسوارات والشرايح</h4>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono-num">
                {formatNumber(calc.accessoriesTotal)} ر.ي ({currentDay.accessories.length} صنف)
              </span>
            </div>

            {(!currentDay.accessories || currentDay.accessories.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">لا توجد مبيعات إكسسوارات مسجلة في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs max-h-56 overflow-y-auto">
                {(currentDay.accessories || []).map((item, idx) => (
                  <div key={item.id || idx} className="py-2 flex items-center justify-between">
                    <span className="text-slate-300">
                      <span className="text-slate-500 font-mono ml-1.5">{idx + 1}.</span>
                      {item.name}
                    </span>
                    <span className="font-mono-num font-bold text-amber-300">{formatNumber(item.price)} ر.ي</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Phones Sales */}
          <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">2. كشف مبيعات الجوالات</h4>
              </div>
              <span className="text-xs font-bold text-cyan-400 font-mono-num">
                واصل: {formatNumber(calc.phonesPaidTotal)} ر.ي
              </span>
            </div>

            {(!currentDay.phones || currentDay.phones.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">لا توجد مبيعات أجهزة جوال في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs">
                {(currentDay.phones || []).map((phone, idx) => (
                  <div key={phone.id || idx} className="py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-cyan-300">{phone.model}</strong>
                      <span className="font-mono-num font-bold text-white">{formatNumber(phone.salePrice)} ر.ي</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>الواصل نقد: <strong className="text-emerald-400 font-mono-num">{formatNumber(phone.paidAmount)}</strong></span>
                      {phone.remainingAmount ? (
                        <span className="text-rose-400">المتبقي: {formatNumber(phone.remainingAmount)} {phone.guarantor ? `(بضمانة ${phone.guarantor})` : ''}</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">{phone.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Maintenance & Programming */}
          <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white">3. كشف الصيانة والبرمجة والقطع</h4>
              </div>
              <span className="text-xs font-bold text-indigo-400 font-mono-num">
                {formatNumber(calc.maintenanceTotal)} ر.ي
              </span>
            </div>

            {(!currentDay.maintenance || currentDay.maintenance.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">لا توجد عمليات صيانة أو برمجة مسجلة في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs max-h-56 overflow-y-auto">
                {(currentDay.maintenance || []).map((m, idx) => (
                  <div key={m.id || idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="text-slate-200 block">{m.deviceOrService}</span>
                      <span className="text-[10px] text-indigo-400 font-semibold">{m.type}</span>
                    </div>
                    <span className="font-mono-num font-bold text-indigo-300">{formatNumber(m.price)} ر.ي</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Recharge (الهادي والرقم) */}
          <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">4. حركة مبيعات الرصيد (الهادي والرقم)</h4>
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono-num">
                {formatNumber(calc.rechargeSalesWithProfit)} ر.ي (ربح: {formatNumber(calc.rechargeProfit)})
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {currentDay.recharge?.hadi && (
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-300 font-bold block">برنامج الهادي (مياس):</span>
                    <span className="text-[10px] text-slate-400">
                      مع الفائدة: {formatNumber(currentDay.recharge.hadi.salesWithProfit)} | بدون فائدة: {formatNumber(currentDay.recharge.hadi.salesWithoutProfit)}
                    </span>
                  </div>
                  {currentDay.recharge.hadi.remainingInApp > 0 && (
                    <span className="text-[11px] text-amber-300 font-mono-num">
                      الباقي بالتطبيق: {formatNumber(currentDay.recharge.hadi.remainingInApp)}
                    </span>
                  )}
                </div>
              )}

              {currentDay.recharge?.qimmah && (
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-cyan-300 font-bold block">برنامج الرقم (فايز أبو علي):</span>
                    <span className="text-[10px] text-slate-400">
                      مع الفائدة: {formatNumber(currentDay.recharge.qimmah.salesWithProfit)} | بدون فائدة: {formatNumber(currentDay.recharge.qimmah.salesWithoutProfit)}
                    </span>
                  </div>
                  {currentDay.recharge.qimmah.remainingInApp > 0 && (
                    <span className="text-[11px] text-amber-300 font-mono-num">
                      الباقي بالتطبيق: {formatNumber(currentDay.recharge.qimmah.remainingInApp)}
                    </span>
                  )}
                </div>
              )}

              {currentDay.recharge?.generalNotes && (
                <p className="text-[11px] text-slate-400 italic mt-1 bg-slate-900/40 p-2 rounded-lg">
                  {currentDay.recharge.generalNotes}
                </p>
              )}
            </div>
          </div>

          {/* Section 5: Expenses & Outflows */}
          <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-white">5. صرفة ومصروفات المحل</h4>
              </div>
              <span className="text-xs font-bold text-rose-400 font-mono-num">
                {formatNumber(calc.expensesTotal)} ر.ي
              </span>
            </div>

            {(!currentDay.expenses || currentDay.expenses.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">لا توجد مصروفات مسجلة في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs">
                {(currentDay.expenses || []).map((exp, idx) => (
                  <div key={exp.id || idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="text-slate-200 block">{exp.description}</span>
                      <span className="text-[10px] text-rose-400">{exp.category} {exp.recipient ? `(مستلم: ${exp.recipient})` : ''}</span>
                    </div>
                    <span className="font-mono-num font-bold text-rose-300">{formatNumber(exp.amount)} ر.ي</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Musab Account (House + Personal) */}
          <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">6. مسحوبات بيت مصعب وشخصي</h4>
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono-num">
                {formatNumber(calc.musabHouseTotal + calc.musabPersonalTotal)} ر.ي
              </span>
            </div>

            {(!currentDay.musabHouse || currentDay.musabHouse.length === 0) && (!currentDay.musabPersonal || currentDay.musabPersonal.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">لا توجد مسحوبات لمصعب في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs">
                {(currentDay.musabHouse || []).map((mh, idx) => (
                  <div key={mh.id || idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-300 font-semibold block">{mh.description}</span>
                      <span className="text-[10px] text-slate-400">حساب بيت مصعب (المنزل)</span>
                    </div>
                    <span className="font-mono-num font-bold text-emerald-400">{formatNumber(mh.amount)} ر.ي</span>
                  </div>
                ))}

                {(currentDay.musabPersonal || []).map((mp, idx) => (
                  <div key={mp.id || idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="text-amber-300 font-semibold block">{mp.description}</span>
                      <span className="text-[10px] text-slate-400">{mp.type}</span>
                    </div>
                    <span className="font-mono-num font-bold text-amber-400">{formatNumber(mp.amount)} ر.ي</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Workers (Hamdan & Engineer) */}
          <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-white">7. صرفة وحساب العمال (حمدان والمهندس)</h4>
              </div>
              <span className="text-xs font-bold text-blue-400 font-mono-num">
                {formatNumber(calc.workersTotal)} ر.ي
              </span>
            </div>

            {(!currentDay.workers || currentDay.workers.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">لا توجد صرفة عمال مسجلة في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs">
                {(currentDay.workers || []).map((w, idx) => (
                  <div key={w.id || idx} className="py-2 flex items-center justify-between">
                    <div>
                      <strong className="text-blue-300 block">{w.workerName}</strong>
                      <span className="text-[10px] text-slate-400">{w.description || w.type}</span>
                    </div>
                    <span className="font-mono-num font-bold text-blue-400">{formatNumber(w.amount)} ر.ي</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 8: Supplier Transfers & Purchases */}
          <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">8. حوالات ومشتريات الموردين والتجار</h4>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono-num">
                محول: {formatNumber(calc.supplierTransfersTotal)} ر.ي
              </span>
            </div>

            {(!currentDay.supplierTransfers || currentDay.supplierTransfers.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">لا توجد حوالات تجار مسجلة في هذا اليوم</p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs">
                {(currentDay.supplierTransfers || []).map((st, idx) => (
                  <div key={st.id || idx} className="py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-amber-300">{st.supplierName}</strong>
                      <span className="font-mono-num font-bold text-amber-400">محول: {formatNumber(st.amountSent)} ر.ي</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{st.notes || 'حوالة رصيد أو قطع غيار'}</span>
                      {st.purchasesReceivedValue > 0 && (
                        <span className="text-indigo-300">مشتريات مقابلة: {formatNumber(st.purchasesReceivedValue)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Day Notes & Ledger Verification Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-1">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>ملاحظات وإيضاحات الدفتر ليوم ({currentDay.dayTitle}):</span>
            </div>
            <p className="text-xs text-slate-300">
              {currentDay.notes || 'تمت مطابقة كافة البنود المسجلة في هذا اليوم مع الدفتر المحاسبي بنجاح.'}
            </p>
          </div>

          {onSelectDay && (
            <button
              onClick={() => onSelectDay(currentDay.id)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>فتح وتعديل يوم {currentDay.dayNumber}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
