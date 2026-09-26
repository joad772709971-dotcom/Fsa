import React, { useState } from 'react';
import { UserCheck, FileSpreadsheet, Home, PieChart } from 'lucide-react';
import { Transaction, DayRecord, MusabItem } from '../types';
import { MosaabAccountView } from './MosaabAccountView';
import { MusabLedgerView } from './MusabLedgerView';

interface MosaabHubViewProps {
  transactions: Transaction[];
  currentMonth: string;
  onAddNewVoucher?: (type?: any) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  days: DayRecord[];
  onAddMusabEntry: (dayId: string, item: MusabItem) => void;
  ownerName?: string;
  initialTab?: 'summary' | 'detailed_ledger';
}

export const MosaabHubView: React.FC<MosaabHubViewProps> = ({
  transactions,
  currentMonth,
  onAddNewVoucher,
  onEditTransaction,
  onDeleteTransaction,
  days,
  onAddMusabEntry,
  ownerName = 'مصعب',
  initialTab = 'summary',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'detailed_ledger'>(initialTab);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Hub Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              حساب وكشف مصعب والمسحوبات الشخصية والبيت (موحد)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              متابعة مسحوبات المالك اليومية، مصاريف البيت، والكشف الدفتري المحاسبي التراكمي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'summary'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>ملخص ومسحوبات مصعب والبيت</span>
          </button>

          <button
            onClick={() => setActiveSubTab('detailed_ledger')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'detailed_ledger'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>الكشف الدفتري المفصل للأيام</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'summary' && (
        <MosaabAccountView
          transactions={transactions}
          currentMonth={currentMonth}
          onAddNewVoucher={onAddNewVoucher}
          onEditTransaction={onEditTransaction}
          onDeleteTransaction={onDeleteTransaction}
        />
      )}

      {activeSubTab === 'detailed_ledger' && (
        <MusabLedgerView
          days={days}
          onAddMusabEntry={onAddMusabEntry}
          ownerName={ownerName}
        />
      )}
    </div>
  );
};
