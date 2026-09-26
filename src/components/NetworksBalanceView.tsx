import React, { useState } from 'react';
import { Signal, PlusCircle, ArrowUpRight, ArrowDownLeft, RefreshCw, Smartphone } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/calculations';

interface NetworksBalanceViewProps {
  transactions: Transaction[];
  onAddNewVoucher: (defaultType: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const NetworksBalanceView: React.FC<NetworksBalanceViewProps> = ({
  transactions,
  onAddNewVoucher,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [activeNetwork, setActiveNetwork] = useState<'all' | 'hadi' | 'qimma'>('all');

  // مبيعات وصرفات تطبيق الهادي (محمد مياس)
  const hadiSalesTx = transactions.filter((t) => t.type === 'balance_hadi');
  const hadiOutflowsTx = transactions.filter(
    (t) =>
      t.type === 'transfer_mohammed_mayas' ||
      (t.category === 'balance' && (t.supplierName?.includes('مياس') || t.supplierName?.includes('الهادي') || t.description?.includes('مياس') || t.description?.includes('الهادي')))
  );
  const hadiTx = [...hadiSalesTx, ...hadiOutflowsTx];

  const hadiSales = hadiSalesTx.reduce((sum, t) => sum + (t.price || 0), 0);
  const hadiCost = hadiSalesTx.reduce((sum, t) => sum + (t.cost || 0), 0);
  const hadiProfit = hadiSalesTx.reduce((sum, t) => sum + (t.profit || 0), 0);
  const hadiTransfers = hadiOutflowsTx.reduce((sum, t) => sum + (t.price || t.cost || 0), 0);

  // مبيعات وصرفات تطبيق الرقم (فايز أبو علي)
  const qimmaSalesTx = transactions.filter((t) => t.type === 'balance_qimma');
  const qimmaOutflowsTx = transactions.filter(
    (t) =>
      t.type === 'transfer_faiez_abu_ali' ||
      (t.category === 'balance' && (t.supplierName?.includes('فايز') || t.supplierName?.includes('الرقم') || t.description?.includes('فايز') || t.description?.includes('الرقم') || t.supplierName?.includes('القمة')))
  );
  const qimmaTx = [...qimmaSalesTx, ...qimmaOutflowsTx];

  const qimmaSales = qimmaSalesTx.reduce((sum, t) => sum + (t.price || 0), 0);
  const qimmaCost = qimmaSalesTx.reduce((sum, t) => sum + (t.cost || 0), 0);
  const qimmaProfit = qimmaSalesTx.reduce((sum, t) => sum + (t.profit || 0), 0);
  const qimmaTransfers = qimmaOutflowsTx.reduce((sum, t) => sum + (t.price || t.cost || 0), 0);

  const displayedTx =
    activeNetwork === 'all'
      ? [...hadiTx, ...qimmaTx]
      : activeNetwork === 'hadi'
      ? hadiTx
      : qimmaTx;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-950/20">
            <Signal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              شبكات وتطبيقات الرصيد المدمجة
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              دمج مبيعات الرصيد وصرفات/حوالات: تطبيق الهادي (محمد مياس) وتطبيق الرقم (فايز أبو علي)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onAddNewVoucher('balance_hadi')}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ مبيع رصيد الهادي</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('balance_qimma')}
            className="flex items-center gap-1 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ مبيع رصيد الرقم</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('transfer_mohammed_mayas')}
            className="flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ حوالة الهادي (مياس)</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('transfer_faiez_abu_ali')}
            className="flex items-center gap-1 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ حوالة الرقم (فايز)</span>
          </button>
        </div>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hadi Card */}
        <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-5 rounded-2xl border border-teal-700/50 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-teal-800/80 pb-3">
            <div>
              <span className="text-xs text-teal-300 font-bold block">التطبيق الأول:</span>
              <h3 className="text-base font-black text-white">تطبيق الهادي (محمد مياس)</h3>
            </div>
            <span className="text-xs bg-teal-800/80 text-teal-200 px-2.5 py-1 rounded-lg font-mono">
              {hadiTx.length} عمليات مدمجة
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-slate-400 block mb-0.5">مبيعات الرصيد:</span>
              <strong className="font-mono text-emerald-300 text-sm">{formatCurrency(hadiSales)}</strong>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-slate-400 block mb-0.5">التكلفة ورأس المال:</span>
              <strong className="font-mono text-slate-300 text-sm">{formatCurrency(hadiCost)}</strong>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-slate-400 block mb-0.5">صافي الربح:</span>
              <strong className="font-mono text-amber-300 text-sm">+{formatCurrency(hadiProfit)}</strong>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-slate-400 block mb-0.5">صرفات وحوالات مياس:</span>
              <strong className="font-mono text-sky-300 text-sm">{formatCurrency(hadiTransfers)}</strong>
            </div>
          </div>
        </div>

        {/* Raqam Card */}
        <div className="bg-gradient-to-br from-cyan-950 to-slate-900 text-white p-5 rounded-2xl border border-cyan-700/50 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-800/80 pb-3">
            <div>
              <span className="text-xs text-cyan-300 font-bold block">التطبيق الثاني:</span>
              <h3 className="text-base font-black text-white">تطبيق الرقم (فايز أبو علي)</h3>
            </div>
            <span className="text-xs bg-cyan-800/80 text-cyan-200 px-2.5 py-1 rounded-lg font-mono">
              {qimmaTx.length} عمليات مدمجة
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-slate-400 block mb-0.5">مبيعات الرصيد:</span>
              <strong className="font-mono text-cyan-300 text-sm">{formatCurrency(qimmaSales)}</strong>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-slate-400 block mb-0.5">التكلفة ورأس المال:</span>
              <strong className="font-mono text-slate-300 text-sm">{formatCurrency(qimmaCost)}</strong>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-slate-400 block mb-0.5">صافي الربح:</span>
              <strong className="font-mono text-amber-300 text-sm">+{formatCurrency(qimmaProfit)}</strong>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-slate-400 block mb-0.5">صرفات وحوالات فايز:</span>
              <strong className="font-mono text-violet-300 text-sm">{formatCurrency(qimmaTransfers)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Network Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit text-xs font-bold flex-wrap">
        <button
          onClick={() => setActiveNetwork('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeNetwork === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          الكل مدمج ({displayedTx.length})
        </button>
        <button
          onClick={() => setActiveNetwork('hadi')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeNetwork === 'hadi' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
          }`}
        >
          تطبيق الهادي - محمد مياس ({hadiTx.length})
        </button>
        <button
          onClick={() => setActiveNetwork('qimma')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeNetwork === 'qimma' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600'
          }`}
        >
          تطبيق الرقم - فايز أبو علي ({qimmaTx.length})
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">التطبيق والنوع</th>
                <th className="p-3">البيان</th>
                <th className="p-3">المبلغ (مبيع / صرفة)</th>
                <th className="p-3">التكلفة / السداد</th>
                <th className="p-3">الفائدة / الأثر</th>
                <th className="p-3 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTx.map((tx) => {
                const isHadi = tx.type === 'balance_hadi' || tx.type === 'transfer_mohammed_mayas' || tx.supplierName?.includes('مياس');
                const isSale = tx.type === 'balance_hadi' || tx.type === 'balance_qimma';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-600">{tx.date}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-bold ${isHadi ? 'text-teal-800' : 'text-cyan-800'}`}>
                          {isHadi ? 'تطبيق الهادي (محمد مياس)' : 'تطبيق الرقم (فايز أبو علي)'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold w-fit ${
                          isSale 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                        }`}>
                          {isSale ? 'مبيع رصيد' : 'صرفة / حوالة سداد'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{tx.description}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {formatCurrency(tx.price)}
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      {isSale ? formatCurrency(tx.cost) : 'سداد حساب'}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {isSale ? (
                        <span className="text-emerald-600">+{formatCurrency(tx.profit)}</span>
                      ) : (
                        <span className="text-rose-600">-{formatCurrency(tx.price)}</span>
                      )}
                    </td>
                    <td className="p-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 rounded text-slate-400 hover:text-teal-600 cursor-pointer"
                          title="تعديل"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="حذف"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
