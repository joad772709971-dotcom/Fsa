import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Search,
  Save,
  CheckCircle2,
  Plus,
  Sparkles,
  TrendingUp,
  DollarSign,
  Layers,
  Filter,
} from 'lucide-react';
import { TelecomPackagePricing, TelecomOperator } from '../types';
import {
  loadTelecomCatalog,
  saveTelecomPackage,
  DEFAULT_TELECOM_PACKAGES,
} from '../utils/telecomCatalogStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPricingUpdated?: () => void;
}

export const AIPackagePricingQuickModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPricingUpdated,
}) => {
  const [catalog, setCatalog] = useState<TelecomPackagePricing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCatalog(loadTelecomCatalog());
      setEditedPrices({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const operators: { id: string; name: string }[] = [
    { id: 'all', name: 'جميع الشبكات' },
    { id: 'yemen_mobile', name: 'يمن موبايل' },
    { id: 'sabafon', name: 'سبأفون' },
    { id: 'you', name: 'يو (YOU)' },
    { id: 'yemen4g', name: 'يمن فورجي 4G' },
    { id: 'adsl_landline', name: 'هاتف ونت أرضي' },
  ];

  const filteredCatalog = catalog.filter((pkg) => {
    if (selectedOperator !== 'all' && pkg.operator !== selectedOperator) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = pkg.packageName.toLowerCase().includes(q);
      const matchOp = (pkg.operator || '').toLowerCase().includes(q);
      const matchCost = pkg.providerCostPrice.toString().includes(q);
      if (!matchName && !matchOp && !matchCost) return false;
    }
    return true;
  });

  const handlePriceChange = (id: string, newSellingPrice: number) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: newSellingPrice,
    }));
  };

  const handleSavePackage = (pkg: TelecomPackagePricing) => {
    const newPrice = editedPrices[pkg.id] ?? pkg.customerSellingPrice;
    saveTelecomPackage({
      ...pkg,
      customerSellingPrice: newPrice,
    });

    setCatalog(loadTelecomCatalog());
    setSaveSuccessMsg(`تم حفظ تسعيرة باقة "${pkg.packageName}" بنجاح.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    if (onPricingUpdated) onPricingUpdated();
  };

  const handleSaveAll = () => {
    Object.entries(editedPrices).forEach(([pkgId, newPrice]) => {
      const target = catalog.find((c) => c.id === pkgId);
      if (target) {
        saveTelecomPackage({
          ...target,
          customerSellingPrice: newPrice,
        });
      }
    });

    setCatalog(loadTelecomCatalog());
    setSaveSuccessMsg('تم حفظ جميع تعديلات التسعيرات بنجاح في كتالوج المحاسب!');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    if (onPricingUpdated) onPricingUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">كتالوج تسعيرة الباقات والفوائد</h3>
              <p className="text-xs text-slate-400">
                عدل سعر بيع أي باقة للزبون ليقوم المحاسب بحساب الفائدة تلقائياً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الباقة أو السعر..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {Object.keys(editedPrices).length > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الكل ({Object.keys(editedPrices).length})</span>
              </button>
            )}
          </div>

          {/* Operator Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
            {operators.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setSelectedOperator(op.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  selectedOperator === op.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {op.name}
              </button>
            ))}
          </div>

          {saveSuccessMsg && (
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Packages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredCatalog.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              لا توجد باقات مطابقة للبحث
            </div>
          ) : (
            filteredCatalog.map((pkg) => {
              const currentSelling = editedPrices[pkg.id] ?? pkg.customerSellingPrice;
              const netProfit = Math.max(0, currentSelling - pkg.providerCostPrice);
              const isEdited = pkg.id in editedPrices;

              return (
                <div
                  key={pkg.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all text-xs ${
                    isEdited
                      ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-sm truncate">{pkg.packageName}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
                      <span>الشبكة: {pkg.operator}</span>
                      <span>•</span>
                      <span>سعر التكلفة: <strong className="text-amber-300 font-mono">{pkg.providerCostPrice} ر.ي</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400">سعر البيع للزبون:</span>
                      <input
                        type="number"
                        value={currentSelling}
                        onChange={(e) => handlePriceChange(pkg.id, Number(e.target.value) || 0)}
                        className="w-24 bg-slate-900 text-white font-bold font-mono px-2 py-1 rounded-xl border border-slate-600 text-center text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="w-16 text-center">
                      <span className="text-[10px] text-slate-400 block">صافي الفائدة:</span>
                      <span className="font-bold font-mono text-emerald-400 text-xs">
                        +{netProfit} ر.ي
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSavePackage(pkg)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isEdited
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md animate-pulse'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title="حفظ التسعيرة"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>إجمالي الباقات المسجلة: {catalog.length} باقة</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
