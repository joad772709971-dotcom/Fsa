import React, { useState } from 'react';
import {
  UserCheck,
  PlusCircle,
  Home,
  Wallet,
  ShoppingBag,
  TrendingDown,
  Coins,
  FileDown,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, calculateMonthlySettlement } from '../utils/calculations';

interface MosaabAccountViewProps {
  transactions: Transaction[];
  currentMonth: string;
  onAddNewVoucher: (defaultType: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const MosaabAccountView: React.FC<MosaabAccountViewProps> = ({
  transactions,
  currentMonth,
  onAddNewVoucher,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const settlement = calculateMonthlySettlement(currentMonth, transactions);
  const mosaabTx = transactions.filter(
    (t) =>
      t.type === 'expense_home_mosaab' ||
      t.type === 'withdrawal_mosaab' ||
      t.type === 'mosaab_purchases_fund'
  );

  // Delivered purchases total
  const totalDelivered = mosaabTx
    .filter((t) => t.type === 'mosaab_purchases_fund')
    .reduce((sum, t) => sum + (t.mosaabDeliveredAmount || t.price), 0);

  const totalPurchasedByMosaab = mosaabTx
    .filter((t) => t.type === 'mosaab_purchases_fund')
    .reduce((sum, t) => sum + (t.mosaabPurchasedAmount || 0), 0);

  const remainingPurchasesFund = Math.max(0, totalDelivered - totalPurchasedByMosaab);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-950/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              حساب المالك: مصعب الصوفي
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة الأرباح (ثلثين 2/3)، صرفة البيت، السحوبات الشخصية، والمسلم لشراء البضاعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddNewVoucher('expense_home_mosaab')}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>قيد صرفة بيت</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('withdrawal_mosaab')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>قيد سحب شخصي</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('mosaab_purchases_fund')}
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>مسلم لشراء بضاعة</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Earned Share (2/3) */}
        <div className="bg-emerald-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-md">
          <div className="flex items-center justify-between text-emerald-200 text-xs mb-2">
            <span>حصة الأرباح لشهر ({settlement.monthName}):</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="font-mono text-2xl font-black text-white">
            {formatCurrency(settlement.mosaabTotalShare)}
          </div>
          <div className="text-[11px] text-emerald-300 mt-2">
            تمثل نسبة الثلثين (2/3) من صافي أرباح المحل
          </div>
        </div>

        {/* 2. Home Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>إجمالي صرفة بيت مصعب:</span>
            <Home className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-2xl font-black text-rose-600">
            -{formatCurrency(settlement.mosaabTotalHomeExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            تخصم حصراً من أرباح مصعب ولا تؤثر على المدير
          </div>
        </div>

        {/* 3. Personal Withdrawals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>سحوبات مصعب الشخصية:</span>
            <Wallet className="w-4 h-4 text-slate-700" />
          </div>
          <div className="font-mono text-2xl font-black text-rose-600">
            -{formatCurrency(settlement.mosaabTotalWithdrawals)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            مبالغ نقدية مسحوبة شخصياً
          </div>
        </div>

        {/* 4. Final Net Payable */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-cyan-300 text-xs mb-2">
            <span>صافي المستحق النهائي لمصعب:</span>
            <CheckCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-black text-cyan-300">
            {formatCurrency(settlement.mosaabFinalPayable)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            المتبقي الصافي الواجب تسليمه لمصعب
          </div>
        </div>

      </div>

      {/* Fund for Purchasing Stock (المسلم لمصعب لشراء بضاعة) */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-sm text-amber-900">
              صندوق المشتريات (المسلم لمصعب لشراء بضاعة وإكسسوارات)
            </h3>
          </div>
          <span className="text-xs bg-amber-200/80 text-amber-900 font-bold px-2.5 py-1 rounded-lg">
            عهدة مشتريات
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
          <div className="bg-white p-3 rounded-xl border border-amber-200">
            <span className="text-slate-500 block mb-1">إجمالي المسلم لمصعب:</span>
            <strong className="font-mono text-base text-slate-900">{formatCurrency(totalDelivered)}</strong>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200">
            <span className="text-slate-500 block mb-1">إجمالي ما اشتراه بضاعة:</span>
            <strong className="font-mono text-base text-emerald-700">{formatCurrency(totalPurchasedByMosaab)}</strong>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200">
            <span className="text-slate-500 block mb-1">المتبقي عهدة عند مصعب:</span>
            <strong className="font-mono text-base text-amber-700">{formatCurrency(remainingPurchasesFund)}</strong>
          </div>
        </div>
      </div>

      {/* Mosaab Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            سجل حركات وسحوبات وصرفة بيت مصعب الصوفي
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {mosaabTx.length} حركات مسجلة
          </span>
        </div>

        {mosaabTx.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            لا توجد حركات مسجلة لمصعب حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">البيان</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">ملاحظات</th>
                  <th className="p-3 text-center no-print">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mosaabTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-600">{tx.date}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          tx.type === 'expense_home_mosaab'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'withdrawal_mosaab'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type === 'expense_home_mosaab'
                          ? 'صرفة بيت مصعب'
                          : tx.type === 'withdrawal_mosaab'
                          ? 'سحب شخصي'
                          : 'مسلم لشراء بضاعة'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{tx.description}</td>
                    <td className="p-3 font-mono font-bold text-rose-600">{formatCurrency(tx.price)}</td>
                    <td className="p-3 text-slate-500">{tx.notes || '-'}</td>
                    <td className="p-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
