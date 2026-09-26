import React, { useState } from 'react';
import { Truck, Users, FileSpreadsheet, Zap, DollarSign, ArrowLeftRight } from 'lucide-react';
import { Supplier, Transaction, DayRecord, SupplierProfile, SupplierTransaction, SupplierTransferItem } from '../types';
import { SuppliersView } from './SuppliersView';
import { SuppliersLedgerView } from './SuppliersLedgerView';
import { HadiDailyBalanceReconciler } from './HadiDailyBalanceReconciler';

interface SuppliersHubViewProps {
  // SuppliersView props
  suppliers: Supplier[];
  transactions: Transaction[];
  onAddSupplier: (newSup: Supplier) => void;
  onUpdateSupplier: (upd: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onAddNewVoucher?: (type?: any) => void;

  // SuppliersLedgerView props
  days: DayRecord[];
  profiles: SupplierProfile[];
  supplierTransactions: SupplierTransaction[];
  onAddProfile: (p: SupplierProfile) => void;
  onUpdateProfile: (p: SupplierProfile) => void;
  onDeleteProfile: (id: string) => void;
  onAddTransaction: (tx: SupplierTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddTransferToDay: (trans: SupplierTransferItem, dayId: string) => void;
  initialTab?: 'ledger' | 'directory' | 'mayas';
}

export const SuppliersHubView: React.FC<SuppliersHubViewProps> = ({
  suppliers,
  transactions,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddNewVoucher,
  days,
  profiles,
  supplierTransactions,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onAddTransaction,
  onDeleteTransaction,
  onAddTransferToDay,
  initialTab = 'ledger',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'directory' | 'mayas'>(initialTab);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Hub Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              إدارة وحسابات الموردين والتجار (المركز الموحد)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              كشوفات الحسابات والعمليات، دليل الموردين، ومطابقة حساب محمد مياس
            </p>
          </div>
        </div>

        {/* Integrated Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>كشوفات الحسابات والديون</span>
          </button>

          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>دليل الموردين ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mayas')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'mayas'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>حساب محمد مياس (الرصيد)</span>
          </button>
        </div>
      </div>

      {/* Sub-view Rendering */}
      {activeSubTab === 'ledger' && (
        <SuppliersLedgerView
          days={days}
          profiles={profiles}
          transactions={supplierTransactions}
          onAddProfile={onAddProfile}
          onUpdateProfile={onUpdateProfile}
          onDeleteProfile={onDeleteProfile}
          onAddTransaction={onAddTransaction}
          onDeleteTransaction={onDeleteTransaction}
          onAddTransferToDay={onAddTransferToDay}
        />
      )}

      {activeSubTab === 'directory' && (
        <SuppliersView
          suppliers={suppliers}
          transactions={transactions}
          onAddSupplier={onAddSupplier}
          onUpdateSupplier={onUpdateSupplier}
          onDeleteSupplier={onDeleteSupplier}
          onAddNewVoucher={onAddNewVoucher}
        />
      )}

      {activeSubTab === 'mayas' && <HadiDailyBalanceReconciler />}
    </div>
  );
};
