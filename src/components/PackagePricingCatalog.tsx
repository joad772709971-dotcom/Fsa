import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  RotateCcw,
  Tag,
  Percent,
} from 'lucide-react';
import { TelecomPackagePricing, TelecomOperator } from '../types';
import {
  loadTelecomCatalog,
  saveTelecomPackage,
  deleteTelecomPackage,
  DEFAULT_TELECOM_PACKAGES,
} from '../utils/telecomCatalogStorage';
import { getActiveStoreId, getActiveOwnerId } from '../utils/storage';

export const PackagePricingCatalog: React.FC = () => {
  const [packages, setPackages] = useState<TelecomPackagePricing[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<TelecomOperator | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Partial<TelecomPackagePricing> | null>(null);

  useEffect(() => {
    setPackages(loadTelecomCatalog());
  }, []);

  const refreshCatalog = () => {
    setPackages(loadTelecomCatalog());
  };

  const handleOpenAdd = () => {
    setEditingPackage({
      operator: selectedOperator !== 'all' ? selectedOperator : 'yemen_mobile',
      operatorNameAr: getOperatorName(selectedOperator !== 'all' ? selectedOperator : 'yemen_mobile'),
      packageName: '',
      packageCategory: 'mix_bundle',
      providerCostPrice: 0,
      customerSellingPrice: 0,
      netProfit: 0,
      profitMarginPercent: 0,
      matchKeywords: [],
      isActive: true,
      notes: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (pkg: TelecomPackagePricing) => {
    setEditingPackage({ ...pkg });
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (!editingPackage || !editingPackage.packageName?.trim()) {
      alert('يرجى كتابة اسم الباقة');
      return;
    }

    const cost = Number(editingPackage.providerCostPrice) || 0;
    const price = Number(editingPackage.customerSellingPrice) || 0;
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    saveTelecomPackage({
      ...editingPackage,
      packageName: editingPackage.packageName.trim(),
      operator: editingPackage.operator || 'yemen_mobile',
      operatorNameAr: getOperatorName(editingPackage.operator || 'yemen_mobile'),
      packageCategory: editingPackage.packageCategory || 'mix_bundle',
      providerCostPrice: cost,
      customerSellingPrice: price,
      netProfit: profit,
      profitMarginPercent: Number(margin.toFixed(1)),
      isActive: editingPackage.isActive ?? true,
      notes: editingPackage.notes || '',
    } as any);

    setIsEditModalOpen(false);
    setEditingPackage(null);
    refreshCatalog();
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الباقة من الكتالوج؟')) {
      deleteTelecomPackage(id);
      refreshCatalog();
    }
  };

  const handleToggleStatus = (pkg: TelecomPackagePricing) => {
    saveTelecomPackage({
      ...pkg,
      isActive: !pkg.isActive,
    });
    refreshCatalog();
  };

  const handleResetDefaults = () => {
    if (confirm('هل تريد إعادة تعيين كتالوج الباقات إلى قائمة باقات الاتصالات اليمنية الافتراضية؟')) {
      localStorage.removeItem('mosaab_telecom_package_catalog_v1');
      refreshCatalog();
    }
  };

  const getOperatorName = (op: TelecomOperator): string => {
    switch (op) {
      case 'yemen_mobile':
        return 'يمن موبايل';
      case 'yemen4g':
        return 'يمن فورجي 4G';
      case 'you':
        return 'يو YOU (MTN)';
      case 'sabafon':
        return 'سبأفون';
      case 'adsl_landline':
        return 'الهاتف الثابت و ADSL';
      default:
        return 'أخرى';
    }
  };

  // Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    if (selectedOperator !== 'all' && pkg.operator !== selectedOperator) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = pkg.packageName.toLowerCase().includes(q);
      const matchOp = pkg.operatorNameAr.toLowerCase().includes(q);
      const matchCost = pkg.providerCostPrice.toString().includes(q);
      const matchPrice = pkg.customerSellingPrice.toString().includes(q);
      if (!matchName && !matchOp && !matchCost && !matchPrice) return false;
    }
    return true;
  });

  const totalActive = packages.filter((p) => p.isActive).length;
  const avgProfit =
    packages.length > 0
      ? Math.round(packages.reduce((sum, p) => sum + (p.netProfit || 0), 0) / packages.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-l from-indigo-700 via-purple-700 to-slate-800 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-indigo-200">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-bold tracking-wider uppercase">وحدة تسعير خدمات الاتصالات</span>
          </div>
          <h1 className="mt-1 text-2xl font-black">كتالوج تسعير الباقات وتتبع الأرباح (Package Catalog)</h1>
          <p className="mt-1 max-w-xl text-xs text-indigo-100">
            تسجيل وتحديث أسعار شراء وباقات شبكات الاتصالات اليمنية (يمن موبايل، يمن فورجي، سبأفون، يو، الهاتف والنت)
            وحساب الأرباح الصافية تلقائياً عند معالجة كشوفات السداد.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" /> استعادة الباقات النموذجية
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-900 shadow-md hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" /> إضافة باقة جديدة
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي الباقات</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{packages.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">الباقات المفعلة</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalActive}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">متوسط الربح للباقة</span>
          <p className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{avgProfit.toLocaleString()} ر.ي</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">المزودين المعتمدين</span>
          <p className="mt-1 text-2xl font-extrabold text-purple-600 dark:text-purple-400">5 شبكات</p>
        </div>
      </div>

      {/* Operator Filter Tabs & Search */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setSelectedOperator('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedOperator === 'all'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            جميع الشبكات ({packages.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedOperator('yemen_mobile')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedOperator === 'yemen_mobile'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            يمن موبايل ({packages.filter((p) => p.operator === 'yemen_mobile').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedOperator('yemen4g')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedOperator === 'yemen4g'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            يمن فورجي 4G ({packages.filter((p) => p.operator === 'yemen4g').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedOperator('you')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedOperator === 'you'
                ? 'bg-yellow-500 text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            يو YOU ({packages.filter((p) => p.operator === 'you').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedOperator('sabafon')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedOperator === 'sabafon'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            سبأفون ({packages.filter((p) => p.operator === 'sabafon').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedOperator('adsl_landline')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedOperator === 'adsl_landline'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            الهاتف والنت ({packages.filter((p) => p.operator === 'adsl_landline').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute top-2.5 right-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث عن باقة أو سعر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-9 pl-3 text-xs font-medium text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPackages.map((pkg) => {
          const operatorColor =
            pkg.operator === 'yemen_mobile'
              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900'
              : pkg.operator === 'yemen4g'
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
              : pkg.operator === 'you'
              ? 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900'
              : pkg.operator === 'sabafon'
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900'
              : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900';

          return (
            <div
              key={pkg.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all hover:shadow-md dark:bg-slate-900 ${
                pkg.isActive
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200 bg-slate-50/50 opacity-60 dark:border-slate-800/80 dark:bg-slate-900/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${operatorColor}`}>
                    {pkg.operatorNameAr}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(pkg)}
                    className={`rounded-full p-1 transition-colors ${
                      pkg.isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                    title={pkg.isActive ? 'مفعلة (انقر للتعطيل)' : 'معطلة (انقر للتفعيل)'}
                  >
                    {pkg.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </button>
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{pkg.packageName}</h3>
                {pkg.notes && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{pkg.notes}</p>}

                {/* Price & Profit Badges */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">سعر الشراء</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {pkg.providerCostPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">سعر البيع</span>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {pkg.customerSellingPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">صافي الربح</span>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      +{pkg.netProfit.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Profit Margin Badge */}
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">هامش الربح:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{pkg.profitMarginPercent}%</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(pkg)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Edit2 className="h-3.5 w-3.5" /> تعديل
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(pkg.id)}
                  className="rounded-lg p-1 text-slate-400 hover:text-rose-600"
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Package Modal */}
      {isEditModalOpen && editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingPackage.id ? 'تعديل بيانات الباقة والتسعير' : 'إضافة باقة جديدة إلى الكتالوج'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">الشبكة / المزود</label>
                  <select
                    value={editingPackage.operator || 'yemen_mobile'}
                    onChange={(e) => {
                      const op = e.target.value as TelecomOperator;
                      setEditingPackage({
                        ...editingPackage,
                        operator: op,
                        operatorNameAr: getOperatorName(op),
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="yemen_mobile">يمن موبايل</option>
                    <option value="yemen4g">يمن فورجي 4G</option>
                    <option value="you">يو YOU (MTN)</option>
                    <option value="sabafon">سبأفون</option>
                    <option value="adsl_landline">الهاتف والنت ADSL</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">نوع الباقة</label>
                  <select
                    value={editingPackage.packageCategory || 'mix_bundle'}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        packageCategory: e.target.value as any,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="mix_bundle">باقة مكالمات + نت (مزايا/ماكس)</option>
                    <option value="data_net">باقة إنترنت فقط (جيجابايت)</option>
                    <option value="voice_sms">مكالمات ورسائل</option>
                    <option value="direct_balance">رصيد عادي مباشر</option>
                    <option value="renewal_recharge">تجديد اشتراك شهري</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">اسم الباقة</label>
                <input
                  type="text"
                  value={editingPackage.packageName || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, packageName: e.target.value })}
                  placeholder="مثال: باقة مزايا الشهرية 2500"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Price Calculation Box */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      سعر الشراء من التطبيق (التكلفة)
                    </label>
                    <input
                      type="number"
                      value={editingPackage.providerCostPrice || 0}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          providerCostPrice: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-extrabold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      سعر البيع للزبون (المحصل)
                    </label>
                    <input
                      type="number"
                      value={editingPackage.customerSellingPrice || 0}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          customerSellingPrice: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-extrabold text-indigo-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-indigo-200 pt-2.5 dark:border-indigo-900/50">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">صافي الربح المحتسب:</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    +{((editingPackage.customerSellingPrice || 0) - (editingPackage.providerCostPrice || 0)).toLocaleString()}{' '}
                    ر.ي
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  كلمات مطابقة إضافية (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={(editingPackage.matchKeywords || []).join(', ')}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      matchKeywords: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="مزايا، 2500، شهرية..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">ملاحظات</label>
                <input
                  type="text"
                  value={editingPackage.notes || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, notes: e.target.value })}
                  placeholder="ملاحظات توضيحية..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pkg-active-checkbox"
                  checked={editingPackage.isActive ?? true}
                  onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-indigo-600"
                />
                <label htmlFor="pkg-active-checkbox" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  الباقة مفعلة ونشطة في عمليات المحل
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
              >
                حفظ الباقة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
