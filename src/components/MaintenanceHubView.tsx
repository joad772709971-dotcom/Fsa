import React, { useState } from 'react';
import { Wrench, Ticket, ShieldCheck, Cpu } from 'lucide-react';
import { Transaction, DayRecord, MaintenanceDevice } from '../types';
import { MaintenanceTicketsView } from './MaintenanceTicketsView';
import { MaintenanceView } from './MaintenanceView';

interface MaintenanceHubViewProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  devices: MaintenanceDevice[];
  onUpdateDevices: React.Dispatch<React.SetStateAction<MaintenanceDevice[]>>;
  days: DayRecord[];
  initialTab?: 'tickets' | 'center';
}

export const MaintenanceHubView: React.FC<MaintenanceHubViewProps> = ({
  transactions,
  onAddTransaction,
  devices,
  onUpdateDevices,
  days,
  initialTab = 'tickets',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tickets' | 'center'>(initialTab);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Hub Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              مركز وكروت الصيانة والأجهزة (موحد)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              إدارة تذاكر الصيانة للزبائن، متابعة تسليم الأجهزة، وحساب نسبة الأرباح 50%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('tickets')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'tickets'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>كروت وتذاكر الصيانة</span>
          </button>

          <button
            onClick={() => setActiveSubTab('center')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'center'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>سجل أجهزة الصيانة (نسبة 50%)</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'tickets' && (
        <MaintenanceTicketsView
          transactions={transactions}
          onAddTransaction={onAddTransaction}
        />
      )}

      {activeSubTab === 'center' && (
        <MaintenanceView
          devices={devices}
          onUpdateDevices={onUpdateDevices}
          days={days}
        />
      )}
    </div>
  );
};
