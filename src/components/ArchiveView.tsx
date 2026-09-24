import React, { useState } from 'react';
import { DayRecord } from '../types';
import { formatNumber, calculateDay } from '../utils/accounting';
import { 
  Archive, 
  Search, 
  Calendar, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign 
} from 'lucide-react';
import { exportToExcel, exportArchiveToExcel } from '../utils/excelExport';

interface ArchiveViewProps {
  days: DayRecord[];
  onSelectDay: (dayId: string) => void;
  onRestoreData: (importedDays: DayRecord[]) => void;
  onResetToDefault: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  days,
  onSelectDay,
  onRestoreData,
  onResetToDefault
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const filteredDays = days.filter(d => 
    d.dayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.date.includes(searchQuery) ||
    (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(days, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `qibal_mobile_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onRestoreData(parsed);
            alert('تم استعادة النسخة الاحتياطية بنجاح!');
          } else {
            alert('الملف غير صالح أو لا يحتوي على سجلات محاسبية متوافقة.');
          }
        } catch (err) {
          alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
        }
      };
      setFileInputKey(Date.now());
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Header & Actions */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black shadow-inner shrink-0">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">أرشيف السجلات اليومية والنسخ الاحتياطي</h2>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  {days.length} يوم مؤرشف
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تصفح كافة سجلات الشهر، تصدير إكسل رسمي موسع، وعمل نسخ احتياطي واستعادة كاملة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportArchiveToExcel(days)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
              title="تصدير جدول الأرشيف اليومي إلى إكسل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير أرشيف اليوميات (Excel)</span>
            </button>

            <button
              onClick={() => exportToExcel(days)}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
              title="تصدير المصنف المحاسبي الشامل لكافة الأقسام"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>المصنف الشامل (Excel)</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
            >
              <Download className="w-4 h-4" />
              <span>حفظ نسخة (JSON)</span>
            </button>

            <label className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>استعادة نسخة</span>
              <input
                key={fileInputKey}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>

        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأيام، التواريخ والملاحظات..."
            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Archive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredDays.map(day => {
          const s = calculateDay(day);
          return (
            <div
              key={day.id}
              className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 hover:border-indigo-500/50 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-white text-sm">{day.dayTitle}</h4>
                  <span className="text-[11px] text-slate-400 font-mono-num">{day.date}</span>
                </div>
                <button
                  onClick={() => onSelectDay(day.id)}
                  className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>فتح السجل</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60">
                <div className="bg-[#0F172A] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">إجمالي المقبوضات:</span>
                  <span className="font-mono-num font-bold text-emerald-400 text-xs">
                    {formatNumber(s.grossDailyRevenue)} ر.ي
                  </span>
                </div>
                <div className="bg-[#0F172A] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">إجمالي المخروجات:</span>
                  <span className="font-mono-num font-bold text-rose-400 text-xs">
                    {formatNumber(s.totalOutflows)} ر.ي
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">صافي الصندوق لليوم:</span>
                <span className={`font-mono-num font-black ${s.netDayCashChange >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                  {formatNumber(s.netDayCashChange)} ر.ي
                </span>
              </div>

              {day.notes && (
                <div className="text-[10px] text-slate-400 truncate bg-[#0F172A] p-1.5 rounded-lg border border-slate-800">
                  📝 {day.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
