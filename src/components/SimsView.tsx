import React, { useState } from 'react';
import { DayRecord, SimCardRecord } from '../types';
import { formatNumber } from '../utils/accounting';
import { 
  Cpu, 
  Smartphone, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Share2, 
  Printer, 
  MessageSquare, 
  CheckCircle2, 
  TrendingUp, 
  Wifi, 
  Trash2,
  PhoneCall,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { exportSimsToExcel } from '../utils/excelExport';
import { getTodayDateString } from '../utils/dateHelper';

interface SimsViewProps {
  days: DayRecord[];
  simRecords: SimCardRecord[];
  onAddSimRecord: (record: SimCardRecord) => void;
  onDeleteSimRecord: (id: string) => void;
}

export const SimsView: React.FC<SimsViewProps> = ({
  days,
  simRecords,
  onAddSimRecord,
  onDeleteSimRecord
}) => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>('الكل');
  const [selectedType, setSelectedType] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [carrier, setCarrier] = useState<SimCardRecord['carrier']>('يمن موبايل');
  const [type, setType] = useState<SimCardRecord['type']>('شريحة دفع مسبق');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(getTodayDateString());

  // Aggregate real SIM-related transactions from the 25 days maintenance/recharge
  const realDaySimSales: {
    id: string;
    carrier: SimCardRecord['carrier'];
    type: SimCardRecord['type'];
    phoneNumber?: string;
    customerName?: string;
    cost: number;
    price: number;
    profit: number;
    date: string;
    notes?: string;
    isFromLedger: boolean;
  }[] = [];

  // Extract any SIM-related items from days maintenance (e.g. برمجة, تفعيل فورجي, ضبط شريحة)
  days.forEach(day => {
    (day.maintenance || []).forEach(m => {
      const lower = m.deviceOrService.toLowerCase();
      if (lower.includes('شريحة') || lower.includes('فورجي') || lower.includes('4g') || lower.includes('volte') || lower.includes('برمجة') || lower.includes('باقة')) {
        let detCarrier: SimCardRecord['carrier'] = 'يمن موبايل';
        if (lower.includes('سبأفون') || lower.includes('سبافون')) detCarrier = 'سبأفون';
        else if (lower.includes('يو') || lower.includes('you') || lower.includes('ام تي ان')) detCarrier = 'يو (YOU)';
        else if (lower.includes('واي')) detCarrier = 'واي (Y)';

        let detType: SimCardRecord['type'] = 'تفعيل 4G/Volte';
        if (lower.includes('شريحة')) detType = 'شريحة دفع مسبق';
        if (lower.includes('باقة')) detType = 'تفعيل باقة';

        realDaySimSales.push({
          id: `ledger-m-${m.id}`,
          carrier: detCarrier,
          type: detType,
          customerName: m.deviceOrService,
          cost: 0,
          price: m.price,
          profit: m.price,
          date: day.date,
          notes: `مسجلة في دفتر اليومية (${day.dayTitle})`,
          isFromLedger: true
        });
      }
    });
  });

  // Combine real user-added SIM records with real ledger entries
  const allSimEntries = [
    ...simRecords.map(r => ({ ...r, isFromLedger: false })),
    ...realDaySimSales
  ];

  // Calculations
  const totalSimRevenue = allSimEntries.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalSimProfit = allSimEntries.reduce((sum, item) => sum + (item.profit || 0), 0);
  const totalSimCount = allSimEntries.length;

  const yemenMobileCount = allSimEntries.filter(i => i.carrier === 'يمن موبايل').length;
  const youCount = allSimEntries.filter(i => i.carrier === 'يو (YOU)').length;
  const sabafonCount = allSimEntries.filter(i => i.carrier === 'سبأفون').length;

  // Filtered List
  const filteredEntries = allSimEntries.filter(item => {
    const matchesCarrier = selectedCarrier === 'الكل' || item.carrier === selectedCarrier;
    const matchesType = selectedType === 'الكل' || item.type === selectedType;
    const matchesSearch = (item.phoneNumber && item.phoneNumber.includes(searchQuery)) ||
                          (item.customerName && item.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCarrier && matchesType && matchesSearch;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price) || 0;
    const c = parseFloat(cost) || 0;
    const profit = Math.max(0, p - c);

    const newRecord: SimCardRecord = {
      id: `sim-${Date.now()}`,
      carrier,
      type,
      phoneNumber: phoneNumber.trim() || undefined,
      customerName: customerName.trim() || undefined,
      cost: c,
      price: p,
      profit: profit,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined
    };

    onAddSimRecord(newRecord);
    setIsAddModalOpen(false);
    setPhoneNumber('');
    setCustomerName('');
    setCost('');
    setPrice('');
    setNotes('');
  };

  const handleShareWhatsApp = (item: typeof allSimEntries[0]) => {
    const msg = `📱 *سند تفعيل وخدمات الشرايح - محل قبال للجوالات*\n` +
      `🌐 الشبكة: *${item.carrier}*\n` +
      `📋 نوع الخدمة: ${item.type}\n` +
      `${item.phoneNumber ? `📞 رقم الهاتف: ${item.phoneNumber}\n` : ''}` +
      `${item.customerName ? `👤 اسم الزبون: ${item.customerName}\n` : ''}` +
      `💰 المبلغ المدفوع: *${formatNumber(item.price)} ر.ي*\n` +
      `📅 التاريخ: ${item.date}\n` +
      `--------------------------------\n` +
      `شكراً لتعاملكم مع محل قبال للجوالات والصيانة - ذمار`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Header & Metrics */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black shadow-inner shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">إدارة الشرايح وباقات الاتصال والتفعيل</h2>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {totalSimCount} عملية مسجلة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة مبيعات شرايح يمن موبايل، يو YOU، سبأفون، تفعيل باقات 4G/VoLTE وبدل فاقد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportSimsToExcel(days, allSimEntries)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
              title="تصدير كشف الشرائح والتفعيل إلى إكسيل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير كشف الشرايح (Excel)</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل بيع شريحة / باقة</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكشف</span>
            </button>
          </div>

        </div>

        {/* 4 Financial KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/60">
          
          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي مبيعات الشرايح والباقات:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-white font-mono-num">{formatNumber(totalSimRevenue)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-emerald-400 block font-medium">صافي أرباح الشرايح والباقات:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono-num">{formatNumber(totalSimProfit)}</span>
              <span className="text-[10px] text-slate-400">ر.ي</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-amber-400 block font-medium">عمليات يمن موبايل:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono-num">{yemenMobileCount}</span>
              <span className="text-[10px] text-slate-400">عملية</span>
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-cyan-400 block font-medium">عمليات يو YOU وسبأفون:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-black text-cyan-400 font-mono-num">{youCount + sabafonCount}</span>
              <span className="text-[10px] text-slate-400">عملية</span>
            </div>
          </div>

        </div>

      </div>

      {/* Network Filters & Search */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الهاتف أو اسم الزبون..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            {['الكل', 'يمن موبايل', 'يو (YOU)', 'سبأفون', 'واي (Y)'].map(c => (
              <button
                key={c}
                onClick={() => setSelectedCarrier(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCarrier === c
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 border-t border-slate-700/60 text-xs">
          <span className="text-slate-400 text-[11px] font-bold shrink-0 ml-1">نوع الخدمة:</span>
          {['الكل', 'شريحة دفع مسبق', 'شريحة فوتر', 'بدل فاقد', 'تفعيل باقة', 'تفعيل 4G/Volte', 'تحويل رصيد'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition whitespace-nowrap cursor-pointer ${
                selectedType === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#0F172A] text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

      </div>

      {/* Table of SIM Records */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#0F172A] text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-3.5 font-bold">التاريخ</th>
                <th className="py-3 px-3.5 font-bold">الشبكة والمزود</th>
                <th className="py-3 px-3.5 font-bold">نوع الخدمة</th>
                <th className="py-3 px-3.5 font-bold">الرقم / اسم الزبون</th>
                <th className="py-3 px-3.5 font-bold text-left">سعر البيع</th>
                <th className="py-3 px-3.5 font-bold text-left">صافي الربح</th>
                <th className="py-3 px-3.5 font-bold text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <Cpu className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-bold text-sm text-slate-300">لا توجد عمليات شرايح مطابقة</p>
                    <p className="text-xs text-slate-500 mt-1">اضغط على زر "تسجيل بيع شريحة / باقة" لإضافة عمليات جديدة</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 font-mono-num text-slate-400">
                      {item.date}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        item.carrier === 'يمن موبايل'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : item.carrier === 'يو (YOU)'
                          ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                          : item.carrier === 'سبأفون'
                          ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {item.carrier}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-200">
                      {item.type}
                    </td>
                    <td className="py-3 px-3.5">
                      {item.phoneNumber && (
                        <div className="font-mono-num font-bold text-white tracking-wide">{item.phoneNumber}</div>
                      )}
                      {item.customerName && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.customerName}</div>
                      )}
                      {item.notes && (
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-left font-mono-num font-black text-white">
                      {formatNumber(item.price)} ر.ي
                    </td>
                    <td className="py-3 px-3.5 text-left font-mono-num font-black text-emerald-400">
                      +{formatNumber(item.profit)} ر.ي
                    </td>
                    <td className="py-3 px-3.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleShareWhatsApp(item)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                          title="إرسال إشعار وسند عبر واتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        {!item.isFromLedger && (
                          <button
                            onClick={() => {
                              if (window.confirm('هل تريد حذف هذه العملية من سجل الشرايح؟')) {
                                onDeleteSimRecord(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add SIM Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            
            <div className="p-4 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>تسجيل بيع شريحة أو باقة جديدة</span>
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
                  <label className="block text-slate-400 font-bold mb-1">الشبكة:</label>
                  <select
                    value={carrier}
                    onChange={e => setCarrier(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="يمن موبايل">يمن موبايل (Yemen Mobile)</option>
                    <option value="يو (YOU)">يو (YOU - MTN سابقاً)</option>
                    <option value="سبأفون">سبأفون (SabaFon)</option>
                    <option value="واي (Y)">واي (Y Telecom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">نوع الخدمة:</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="شريحة دفع مسبق">شريحة دفع مسبق (جديدة)</option>
                    <option value="شريحة فوتر">شريحة فوتر (خط)</option>
                    <option value="بدل فاقد">بدل فاقد</option>
                    <option value="تفعيل باقة">تفعيل باقة (مزايا / نت)</option>
                    <option value="تفعيل 4G/Volte">تفعيل 4G / VoLTE</option>
                    <option value="تحويل رصيد">تحويل رصيد شحن</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">رقم الهاتف / الشريحة:</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="مثال: 777123456"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">اسم الزبون (اختياري):</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="اسم الزبون..."
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">سعر البيع للزبون (ر.ي): *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">سعر التكلفة علينا (ر.ي):</label>
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-amber-500 focus:outline-none"
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
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">ملاحظات إضافية:</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ملاحظات..."
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md transition cursor-pointer"
                >
                  حفظ العملية
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
