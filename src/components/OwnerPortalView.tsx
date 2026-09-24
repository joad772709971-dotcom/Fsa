import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Sparkles, 
  Store, 
  Phone, 
  User, 
  Calendar, 
  Search, 
  Plus, 
  Copy, 
  Trash2, 
  Edit, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Share2, 
  FileSpreadsheet,
  Lock,
  Building,
  Check
} from 'lucide-react';
import { SubscribedShop, ShopSettings, SystemLicense } from '../types';
import { generateLicenseKey } from '../utils/license';
import { formatNumber } from '../utils/accounting';
import * as XLSX from 'xlsx';

interface OwnerPortalViewProps {
  subscribedShops: SubscribedShop[];
  onAddSubscribedShop: (shop: Omit<SubscribedShop, 'id'>) => void;
  onUpdateSubscribedShop: (id: string, shop: Partial<SubscribedShop>) => void;
  onDeleteSubscribedShop: (id: string) => void;
  shopSettings: ShopSettings;
}

export const OwnerPortalView: React.FC<OwnerPortalViewProps> = ({
  subscribedShops,
  onAddSubscribedShop,
  onUpdateSubscribedShop,
  onDeleteSubscribedShop,
  shopSettings,
}) => {
  // Generator form state
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('ذمار');
  const [licenseType, setLicenseType] = useState<'trial' | 'annual' | 'two_years' | 'lifetime'>('annual');
  const [pricePaid, setPricePaid] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedExpiry, setGeneratedExpiry] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Edit modal
  const [editingShop, setEditingShop] = useState<SubscribedShop | null>(null);

  // Generate Key Handler
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !phone.trim()) {
      alert('يرجى كتابة اسم المحل ورقم الهاتف');
      return;
    }

    const res = generateLicenseKey(shopName.trim(), phone.trim(), licenseType);
    setGeneratedKey(res.key);
    setGeneratedExpiry(res.expiresAt);
    setCopiedKey(false);
  };

  // Add to Registry
  const handleSaveToRegistry = () => {
    if (!generatedKey) return;

    onAddSubscribedShop({
      shopName: shopName.trim(),
      ownerName: ownerName.trim() || 'غير محدد',
      phone: phone.trim(),
      city: city.trim(),
      licenseKey: generatedKey,
      licenseType,
      startDate: new Date().toISOString().split('T')[0],
      expiresAt: generatedExpiry,
      pricePaid: pricePaid ? parseFloat(pricePaid) : 0,
      status: licenseType === 'trial' ? 'تجريبي' : 'نشط',
      notes: notes.trim(),
    });

    // Reset Form
    setShopName('');
    setOwnerName('');
    setPhone('');
    setPricePaid('');
    setNotes('');
    setGeneratedKey(null);
    alert('تم حفظ المحل المشترك في السجل بنجاح!');
  };

  // Copy Key
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // WhatsApp Message
  const handleSendWhatsapp = (shop: SubscribedShop) => {
    const msg = `مرحباً أخي العزيز (${shop.ownerName})،
تم إصدار وتفعيل ترخيص نظام (${shopSettings.name}) لمحلكم (${shop.shopName}).

🔑 كود التفعيل الخاص بكم:
${shop.licenseKey}

📅 مدة الترخيص: ${shop.licenseType === 'lifetime' ? 'مدى الحياة مفتوح' : shop.licenseType === 'two_years' ? 'سنتين' : shop.licenseType === 'annual' ? 'سنة كاملة' : 'تجريبي 14 يوم'}
تاريخ الانتهاء: ${shop.expiresAt}

شكراً لثقتكم بنا! ⚡`;
    const cleanPhone = shop.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (subscribedShops.length === 0) {
      alert('لا توجد بيانات محلات لتصديرها');
      return;
    }

    const data = subscribedShops.map((s, idx) => ({
      'م': idx + 1,
      'اسم المحل': s.shopName,
      'اسم المالك': s.ownerName,
      'رقم الهاتف': s.phone,
      'المدينة': s.city || '',
      'نوع الترخيص': s.licenseType === 'lifetime' ? 'مدى الحياة' : s.licenseType === 'two_years' ? 'سنتين' : s.licenseType === 'annual' ? 'سنة' : 'تجريبي',
      'مفتاح الترخيص': s.licenseKey,
      'تاريخ التفعيل': s.startDate,
      'تاريخ الانتهاء': s.expiresAt,
      'المبلغ المدفوع (ريال)': s.pricePaid || 0,
      'الحالة': s.status,
      'ملاحظات': s.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المحلات المشتركة');
    XLSX.writeFile(wb, `سجل_المحلات_المشتركة_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filtered subscribers
  const filteredShops = subscribedShops.filter(s => {
    const matchesSearch = 
      s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      s.licenseKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalSubscribers = subscribedShops.length;
  const activeCount = subscribedShops.filter(s => s.status === 'نشط').length;
  const totalRevenue = subscribedShops.reduce((sum, s) => sum + (s.pricePaid || 0), 0);
  const trialCount = subscribedShops.filter(s => s.status === 'تجريبي').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>لوحة المالك وإدارة تراخيص المحلات</span>
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold px-2 py-0.5 rounded-md">خاص بمالك النظام</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">توليد أكواد التفعيل، توثيق المحلات المشتركة، ومتابعة اشتراكات النسخ</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير إكسل</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] text-slate-400 font-medium block">إجمالي المحلات المشتركة</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono-num">{totalSubscribers}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] text-emerald-400 font-medium block">التراخيص النشطة</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono-num">{activeCount}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] text-amber-400 font-medium block">النسخ التجريبية</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono-num">{trialCount}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] text-cyan-400 font-medium block">إجمالي مبيعات التراخيص</span>
            <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono-num">{formatNumber(totalRevenue)} <small className="text-[10px]">ريال</small></span>
          </div>
        </div>
      </div>

      {/* Main Grid: Generator (Right) & Registry (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Generator Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm sm:text-base font-black text-white">توليد كود ترخيص تجاري جديد</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">اسم المحل المشترك / النشاط: *</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                    placeholder="مثال: مركز الأمل للجوالات"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">اسم صاحب المحل:</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      placeholder="اسم التاجر"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">رقم الهاتف / واتساب: *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-white font-mono-num focus:outline-none focus:border-amber-500"
                      placeholder="77XXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">المدينة / المحافظة:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="ذمار / صنعاء / إب"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">المبلغ المحصل (ريال):</label>
                  <input
                    type="number"
                    value={pricePaid}
                    onChange={e => setPricePaid(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono-num font-bold focus:outline-none focus:border-amber-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">مدة وصلاحية الترخيص:</label>
                <select
                  value={licenseType}
                  onChange={e => setLicenseType(e.target.value as any)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="lifetime">⭐ مدى الحياة (دائم ومفتوح)</option>
                  <option value="annual">📅 سنة كاملة (365 يوم)</option>
                  <option value="two_years">📅 سنتين (730 يوم)</option>
                  <option value="trial">⏳ تجريبي (14 يوماً)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="ملاحظات العقد أو الضمان"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>توليد كود التفعيل الآن ⚡</span>
              </button>
            </form>

            {/* Generated Output */}
            {generatedKey && (
              <div className="bg-[#0F172A] border border-amber-500/50 rounded-2xl p-4 space-y-3 animate-in zoom-in-95">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-bold">كود التفعيل الجاهز:</span>
                  <span className="text-slate-400 font-mono-num text-[11px]">انتهاء: {generatedExpiry}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-amber-300 font-mono-num font-black text-center text-xs tracking-wider break-all select-all">
                  {generatedKey}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedKey)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToRegistry}
                    className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>حفظ في سجل المشتركين</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscribed Shops Registry (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm sm:text-base font-black text-white">سجل المحلات المشتركة والتراخيص</h2>
              </div>

              {/* Status Filter */}
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'نشط', label: 'نشط' },
                  { id: 'تجريبي', label: 'تجريبي' },
                  { id: 'منتهي', label: 'منتهي' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      filterStatus === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="ابحث باسم المحل، المالك، رقم الهاتف، أو كود الترخيص..."
              />
            </div>

            {/* List of Subscribed Shops */}
            {filteredShops.length === 0 ? (
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <Store className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-300">لا توجد محلات مشتركة مسجلة بعد</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    استخدم نموذج التوليد على اليمين لإنشاء كود تفعيل وإضافة أول محل مشترك في النظام التجاري.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {filteredShops.map(shop => (
                  <div
                    key={shop.id}
                    className="bg-[#0F172A] border border-slate-700/70 hover:border-slate-600 rounded-2xl p-3.5 space-y-2.5 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-white">{shop.shopName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            shop.status === 'نشط'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : shop.status === 'تجريبي'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          }`}>
                            {shop.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          المالك: <strong className="text-slate-200">{shop.ownerName}</strong> | المدينة: {shop.city || '—'}
                        </p>
                      </div>

                      <div className="text-left font-mono-num text-[11px]">
                        <span className="text-slate-400 block text-[10px]">المحصل:</span>
                        <span className="text-emerald-400 font-bold">{formatNumber(shop.pricePaid || 0)} ريال</span>
                      </div>
                    </div>

                    {/* License Details Bar */}
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2 font-mono-num">
                      <div className="text-slate-400">
                        <span>النوع: </span>
                        <strong className="text-amber-400">
                          {shop.licenseType === 'lifetime' ? 'مدى الحياة' : shop.licenseType === 'two_years' ? 'سنتين' : shop.licenseType === 'annual' ? 'سنة' : 'تجريبي'}
                        </strong>
                      </div>
                      <div className="text-slate-400">
                        <span>الانتهاء: </span>
                        <strong className="text-slate-200">{shop.expiresAt}</strong>
                      </div>
                      <div className="text-slate-400">
                        <span>الهاتف: </span>
                        <strong className="text-cyan-400">{shop.phone}</strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
                      <button
                        onClick={() => handleCopy(shop.licenseKey)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="نسخ مفتاح الترخيص"
                      >
                        <Copy className="w-3 h-3 text-amber-400" />
                        <span>نسخ الكود</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSendWhatsapp(shop)}
                          className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="إرسال عبر الواتساب"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>إرسال واتساب</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف اشتراك محل ${shop.shopName}؟`)) {
                              onDeleteSubscribedShop(shop.id);
                            }
                          }}
                          className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg cursor-pointer transition"
                          title="حذف المحل المشترك"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
