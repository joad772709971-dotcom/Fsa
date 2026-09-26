import React, { useState } from 'react';
import { Smartphone, Zap, FileSpreadsheet, Activity, Layers, Sparkles } from 'lucide-react';
import { DayRecord } from '../types';
import { HadiDailyBalanceReconciler } from './HadiDailyBalanceReconciler';
import { RechargeManagerView } from './RechargeManagerView';
import { TelecomStatementEngine } from './TelecomStatementEngine';

interface RechargeHubViewProps {
  days: DayRecord[];
  initialTab?: 'daily_balance' | 'apps' | 'engine';
}

export const RechargeHubView: React.FC<RechargeHubViewProps> = ({
  days,
  initialTab = 'daily_balance',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'daily_balance' | 'apps' | 'engine'>(initialTab);

  return (
    <div className="space-y-5" dir="rtl" id="recharge-telecom-hub">
      {/* Top Hub Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              إدارة الرصيد والشبكات وكشوفات السداد (المركز الموحد)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              سجل رصيد الهادي اليومي ومحمد مياس، تطبيقات الرصيد (الهادي والرقم)، ومحرك الكشوفات الذكي
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveSubTab('daily_balance')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'daily_balance'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>مطابقة الهادي ومحمد مياس (اليومي)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('apps')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'apps'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>تطبيقات الرصيد والشبكات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('engine')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'engine'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>محرك الكشوفات وقراءة الـ PDF</span>
          </button>
        </div>
      </div>

      {/* View Rendering */}
      {activeSubTab === 'daily_balance' && <HadiDailyBalanceReconciler />}

      {activeSubTab === 'apps' && <RechargeManagerView days={days} />}

      {activeSubTab === 'engine' && <TelecomStatementEngine />}
    </div>
  );
};
