import React, { useState } from 'react';
import { Truck, PlusCircle, Phone, MapPin, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { Supplier, Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SuppliersViewProps {
  suppliers: Supplier[];
  transactions: Transaction[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onAddNewVoucher: (defaultType: TransactionType) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  transactions,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddNewVoucher,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupLocation, setNewSupLocation] = useState('');
  const [newSupType, setNewSupType] = useState('قطع غيار وصيانة');

  const purchaseTx = transactions.filter((t) => t.type === 'purchase');

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      name: newSupName.trim(),
      phone: newSupPhone.trim() || '',
      location: newSupLocation.trim() || '',
      type: 'spare_parts',
      initialBalance: 0,
      totalPurchases: 0,
      totalPaid: 0,
      remainingBalance: 0,
      notes: newSupType || 'قطع غيار وصيانة',
    };

    onAddSupplier(newSup);
    setNewSupName('');
    setNewSupPhone('');
    setNewSupLocation('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-950/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              الموردين وتجار قطع الغيار والصيانة
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة حسابات وفواتير: العبصري، القاسمي عمر، خليل الأغبري
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة مورد جديد</span>
          </button>
          <button
            onClick={() => onAddNewVoucher('purchase')}
            className="flex items-center gap-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>فاتورة مشتريات / قطع</span>
          </button>
        </div>
      </div>

      {/* Suppliers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers.map((sup) => {
          const supTx = purchaseTx.filter(
            (t) => t.supplierId === sup.id || t.supplierName?.includes(sup.name)
          );
          const totalBought = supTx.reduce((sum, t) => sum + t.price, 0);

          return (
            <div
              key={sup.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-base text-slate-900">{sup.name}</h3>
                  <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md">
                    {sup.type}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-500 mb-4">
                  {sup.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{sup.phone}</span>
                    </div>
                  )}
                  {sup.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">إجمالي الفواتير:</span>
                  <span className="font-bold font-mono text-slate-900">{formatCurrency(totalBought)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">عدد الفواتير:</span>
                  <span className="font-mono text-slate-700">{supTx.length} فواتير</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-3">إضافة مورد جديد</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المورد / المحل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مؤسسة العبصري للإلكترونيات"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع النشاط:</label>
                <input
                  type="text"
                  placeholder="مثال: قطع غيار شاشات وكونكترات"
                  value={newSupType}
                  onChange={(e) => setNewSupType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف (اختياري):</label>
                <input
                  type="text"
                  placeholder="770000000"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان / المحافظة:</label>
                <input
                  type="text"
                  placeholder="صنعاء / التحرير / الحصبة"
                  value={newSupLocation}
                  onChange={(e) => setNewSupLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
