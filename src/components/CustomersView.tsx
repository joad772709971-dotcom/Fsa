import React, { useState, useEffect } from 'react';
import { UserSquare2, PlusCircle, Phone, Search, DollarSign } from 'lucide-react';
import { CustomerDebt, Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/calculations';
import { loadCustomers, saveCustomers } from '../utils/storage';

interface CustomersViewProps {
  transactions: Transaction[];
  onAddNewVoucher: (defaultType: TransactionType) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  transactions,
  onAddNewVoucher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debts, setDebts] = useState<CustomerDebt[]>(() => loadCustomers());

  useEffect(() => {
    saveCustomers(debts);
  }, [debts]);

  const filteredDebts = debts.filter(
    (d) =>
      (d.name && d.name.includes(searchTerm)) || (d.phone && d.phone.includes(searchTerm))
  );

  const totalOutstanding = debts.reduce((sum, d) => sum + d.remainingDebt, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shadow-slate-950/20">
            <UserSquare2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              حسابات العملاء والديون الآجلة
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة مبيعات الصيانة والإكسسوارات الآجلة والتحصيلات
            </p>
          </div>
        </div>

        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2">
          <span className="text-slate-400">إجمالي الديون القائمة:</span>
          <span className="font-mono font-black text-amber-300 text-sm">
            {formatCurrency(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث باسم العميل أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none w-full text-slate-800"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] sm:min-w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3">اسم العميل</th>
                <th className="p-3">رقم الهاتف</th>
                <th className="p-3">آخر حركة</th>
                <th className="p-3">إجمالي الحساب</th>
                <th className="p-3">المسدد</th>
                <th className="p-3">المتبقي المطلوب</th>
                <th className="p-3">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{c.name}</td>
                  <td className="p-3 font-mono text-slate-600">{c.phone || '-'}</td>
                  <td className="p-3 font-mono text-slate-500">{c.lastTransactionDate}</td>
                  <td className="p-3 font-mono text-slate-800">{formatCurrency(c.totalDebt)}</td>
                  <td className="p-3 font-mono text-emerald-600">{formatCurrency(c.totalPaid)}</td>
                  <td className="p-3 font-mono font-bold text-rose-600 text-sm">
                    {formatCurrency(c.remainingDebt)}
                  </td>
                  <td className="p-3 text-slate-500">{c.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
