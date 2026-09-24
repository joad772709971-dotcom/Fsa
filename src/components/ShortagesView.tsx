import React, { useState, useEffect } from 'react';
import { ShortageItem, InventoryItem } from '../types';
import { exportShortagesToExcel } from '../utils/excelExport';
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  Plus, 
  CheckCircle2, 
  MessageSquare, 
  PhoneCall, 
  Send, 
  Filter, 
  Search, 
  Trash2, 
  Edit3, 
  PackageCheck, 
  Volume2, 
  VolumeX,
  Sparkles,
  ShoppingBag,
  Wrench,
  Radio,
  Share2,
  Camera,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  HelpCircle,
  ExternalLink,
  X
} from 'lucide-react';

interface ShortagesViewProps {
  shortages: ShortageItem[];
  onAddShortage: (item: ShortageItem) => void;
  onUpdateShortage: (item: ShortageItem) => void;
  onDeleteShortage: (id: string) => void;
  onMarkAsReceived?: (shortage: ShortageItem) => void;
}

export const ShortagesView: React.FC<ShortagesViewProps> = ({
  shortages,
  onAddShortage,
  onUpdateShortage,
  onDeleteShortage,
  onMarkAsReceived
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('الكل');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortageItem | null>(null);

  // Multi-supplier search modal state
  const [multiSearchItem, setMultiSearchItem] = useState<ShortageItem | null>(null);
  
  // Image preview modal state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ShortageItem['category']>('نواقص الصيانة');
  const [quantityNeeded, setQuantityNeeded] = useState('1');
  const [supplierName, setSupplierName] = useState('خليل الأغبري');
  const [customSupplier, setCustomSupplier] = useState('');
  const [urgency, setUrgency] = useState<ShortageItem['urgency']>('عاجل جداً');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [notes, setNotes] = useState('');

  // 2:00 PM Alarm & Audio State
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [alarmDismissedToday, setAlarmDismissedToday] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeUntil2PM, setTimeUntil2PM] = useState<string>('');

  // Pleasant Web Audio Chime synthesizer
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Double-bell chime sequence
      playTone(587.33, 0.0, 0.6); // D5
      playTone(880.00, 0.15, 0.8); // A5
      playTone(1174.66, 0.35, 1.0); // D6
    } catch (e) {
      console.warn('Web Audio chime not available', e);
    }
  };

  // Clock checker for 2:00 PM (14:00 Yemen GMT+3)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      // Calculate Yemen time (UTC+3)
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const yemenTime = new Date(utc + (3600000 * 3));
      
      const hours = yemenTime.getHours();
      const minutes = yemenTime.getMinutes();
      const seconds = yemenTime.getSeconds();

      // Countdown to 14:00 (2 PM)
      let target = new Date(yemenTime);
      target.setHours(14, 0, 0, 0);
      if (yemenTime.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const diffMs = target.getTime() - yemenTime.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntil2PM(`${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);

      // Alarm trigger at exactly 14:00:00 to 14:00:59
      if (hours === 14 && minutes === 0 && !alarmDismissedToday && soundEnabled) {
        setIsAlarmPlaying(true);
        playChime();
      }
    };

    checkTime();
    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [alarmDismissedToday, soundEnabled]);

  // Distinct suppliers with their phone numbers and specializations
  const suppliersDirectory = [
    { name: 'خليل الأغبري', role: 'قطع غيار وصيانة وكالة', phone: '777000001' },
    { name: 'عمر القاسمي', role: 'شاشات وكاميرات وفلاتات', phone: '777000002' },
    { name: 'العبصري', role: 'إكسسوارات وبطاريات وشواحن', phone: '777000003' },
    { name: 'المصنف', role: 'شاشات درجة أولى وأدوات صيانة', phone: '777000004' },
    { name: 'محمد مياس (تطبيق الهادي)', role: 'تطبيق الهادي وشحن رصيد وباقات', phone: '777000005' },
    { name: 'فايز أبو علي (تطبيق الرقم)', role: 'تطبيق الرقم وشحن فوري وباقات', phone: '777000006' },
    { name: 'أبو صالح الأقمري', role: 'شاشات وجوالات', phone: '777000007' },
    { name: 'أخرى', role: 'مورد مخصص', phone: '' }
  ];

  const standardSuppliers = suppliersDirectory.map(s => s.name);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemName('');
    setCategory('نواقص الصيانة');
    setQuantityNeeded('1');
    setSupplierName('خليل الأغبري');
    setCustomSupplier('');
    setUrgency('عاجل جداً');
    setImageUrl('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: ShortageItem) => {
    setEditingItem(item);
    setItemName(item.itemName);
    setCategory(item.category);
    setQuantityNeeded(item.quantityNeeded.toString());
    if (standardSuppliers.includes(item.supplierName || '')) {
      setSupplierName(item.supplierName || 'خليل الأغبري');
      setCustomSupplier('');
    } else {
      setSupplierName('أخرى');
      setCustomSupplier(item.supplierName || '');
    }
    setUrgency(item.urgency);
    setImageUrl(item.imageUrl || '');
    setNotes(item.notes || '');
    setIsAddModalOpen(true);
  };

  // Image Upload Handler (from file or phone camera)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const resolvedSupplier = supplierName === 'أخرى' ? (customSupplier.trim() || 'عام') : supplierName;

    const newShortage: ShortageItem = {
      id: editingItem ? editingItem.id : `shortage-${Date.now()}`,
      itemName: itemName.trim(),
      category,
      quantityNeeded: parseInt(quantityNeeded) || 1,
      supplierName: resolvedSupplier,
      urgency,
      status: editingItem ? editingItem.status : 'معلق',
      addedDate: editingItem ? editingItem.addedDate : new Date().toISOString().split('T')[0],
      imageUrl: imageUrl || undefined,
      notes: notes.trim() || undefined
    };

    if (editingItem) {
      onUpdateShortage(newShortage);
    } else {
      onAddShortage(newShortage);
    }

    setIsAddModalOpen(false);
  };

  // Filtered shortages
  const filteredShortages = shortages.filter(item => {
    const matchesCategory = activeCategory === 'الكل' || item.category === activeCategory;
    const matchesSupplier = selectedSupplier === 'الكل' || item.supplierName === selectedSupplier;
    const matchesStatus = statusFilter === 'الكل' || item.status === statusFilter;
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.supplierName && item.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSupplier && matchesStatus && matchesSearch;
  });

  // Pending Count
  const pendingCount = shortages.filter(s => s.status === 'معلق').length;
  const orderedCount = shortages.filter(s => s.status === 'تم الطلب').length;
  const receivedCount = shortages.filter(s => s.status === 'وصل للمحل').length;

  // WhatsApp Order Generator
  const handleSendWhatsAppOrder = (targetSupplier?: string) => {
    const itemsToOrder = targetSupplier && targetSupplier !== 'الكل'
      ? shortages.filter(s => s.supplierName === targetSupplier && s.status !== 'وصل للمحل')
      : filteredShortages.filter(s => s.status !== 'وصل للمحل');

    if (itemsToOrder.length === 0) {
      alert('لا توجد أصناف معلقة للطلب حالياً!');
      return;
    }

    const supplierTitle = targetSupplier && targetSupplier !== 'الكل' ? targetSupplier : 'الأخ التاجر / المورد';
    const lines = itemsToOrder.map((item, idx) => ` ${idx + 1}. *${item.itemName}* - عدد (${item.quantityNeeded}) [${item.category}] ${item.notes ? `(${item.notes})` : ''}`);

    const message = `📋 *طلبية نواقص المحل اليومية*\n` +
      `👤 إلى: *${supplierTitle}*\n` +
      `📅 التاريخ: ${new Date().toLocaleDateString('ar-YE')}\n` +
      `⏰ وقت الطلب: ${new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}\n` +
      `--------------------------------\n` +
      `الأصناف والقطع المطلوبة:\n` +
      lines.join('\n') +
      `\n--------------------------------\n` +
      `📱 محل قبال للجوالات والصيانة - ذمار\n` +
      `يرجى التجهيز والإفادة بالتوفر وإرسال الفاتورة مع صاحب التوصيل.`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Quick Supplier Invoice Request
  const handleRequestSupplierInvoice = (supplierNameParam?: string) => {
    const target = supplierNameParam || (selectedSupplier !== 'الكل' ? selectedSupplier : 'الأخ التاجر / المورد');
    const message = `🧾 *طلب فاتورة مشتريات وحساب*\n` +
      `👤 الأخ الكريم: *${target}*\n` +
      `السلام عليكم ورحمة الله وبركاته،\n` +
      `يرجى التكرم بإرسال فاتورة المشتريات والحساب للقطع والطلبيات المسلمة لمحلنا لمطابقتها وتصفية الحساب.\n\n` +
      `📱 محل قبال للجوالات والصيانة - ذمار\n` +
      `شاكرين حسن تعاونكم الدائم.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Direct Inquiry for a specific item to an alternative supplier
  const handleInquireSupplier = (item: ShortageItem, supplier: string) => {
    const message = `السلام عليكم ورحمة الله وبركاته يا أخ *${supplier}*،\n` +
      `هل متوفر لديكم حالياً القطعة التالية:\n` +
      `🔹 الصنف: *${item.itemName}*\n` +
      `🔹 الكمية المطلوبة: *${item.quantityNeeded}*\n` +
      (item.notes ? `🔹 ملاحظات: ${item.notes}\n` : '') +
      `يرجى إفادتنا بالتوفر والسعر والنوعية (وكالة / درجة أولى).\n\n` +
      `📱 محل قبال للجوالات - ذمار`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // SMS Order Generator
  const handleSendSMSOrder = (targetSupplier?: string) => {
    const itemsToOrder = targetSupplier && targetSupplier !== 'الكل'
      ? shortages.filter(s => s.supplierName === targetSupplier && s.status !== 'وصل للمحل')
      : filteredShortages.filter(s => s.status !== 'وصل للمحل');

    if (itemsToOrder.length === 0) {
      alert('لا توجد أصناف معلقة للطلب!');
      return;
    }

    const lines = itemsToOrder.map((item, idx) => `${idx + 1}-${item.itemName} (${item.quantityNeeded})`);
    const message = `طلبية نواقص قبال: ${lines.join(', ')}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* 2:00 PM Alarm Notification Banner */}
      {isAlarmPlaying && (
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-2xl p-4 shadow-xl border border-rose-400 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">حان الآن موعد إرسال طلبيات النواقص اليومية (2:00 ظهراً)!</h3>
              <p className="text-xs text-white/90">يرجى مراجعة قائمة النواقص وإرسالها للموردين والتجار عبر الواتساب لتجهيزها.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendWhatsAppOrder()}
              className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition cursor-pointer"
            >
              إرسال الآن
            </button>
            <button
              onClick={() => {
                setIsAlarmPlaying(false);
                setAlarmDismissedToday(true);
              }}
              className="px-3 py-1.5 bg-black/30 hover:bg-black/40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إيقاف التنبيه
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header & Alarm Status */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black shadow-inner shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">المحور السادس: إدارة النواقص، طلبيات الموردين، والبحث المتعدد</h2>
                <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  {pendingCount} صنف بانتظار الطلب
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>موعد التنبيه اليومي: 2:00 ظهراً (متبقي: {timeUntil2PM})</span>
                </span>
                <span>• دعم رفع صور القطع والجوالات، طلب الفواتير السريع، والبحث عند موردين بدلاء</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportShortagesToExcel(shortages)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px] shadow-sm"
              title="تصدير كشف النواقص والطلبيات إلى إكسل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير النواقص (Excel)</span>
            </button>

            <button
              onClick={playChime}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
              title="تجربة صوت المنبه (جرس التنبيه)"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>تجربة الجرس</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل ناقص / صورة</span>
            </button>

            <button
              onClick={() => handleSendWhatsAppOrder(selectedSupplier !== 'الكل' ? selectedSupplier : undefined)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
              title="إرسال قائمة النواقص المحددة عبر واتساب للمورد"
            >
              <MessageSquare className="w-4 h-4" />
              <span>واتساب للتاجر</span>
            </button>

            <button
              onClick={() => handleRequestSupplierInvoice()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
              title="طلب فاتورة سريعة من المورد لتصفية الحساب"
            >
              <FileText className="w-4 h-4" />
              <span>طلب فاتورة من المورد</span>
            </button>

            <button
              onClick={() => handleSendSMSOrder(selectedSupplier !== 'الكل' ? selectedSupplier : undefined)}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
              title="إرسال رسالة نصية SMS سريعة بالطلبية"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>SMS</span>
            </button>
          </div>

        </div>

        {/* 4 Status KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/60">
          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي النواقص المسجلة:</span>
            <span className="text-lg font-black text-white font-mono-num mt-1 block">{shortages.length}</span>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-rose-400 block font-medium">بانتظار الإرسال والطلب:</span>
            <span className="text-lg font-black text-rose-400 font-mono-num mt-1 block">{pendingCount}</span>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-amber-400 block font-medium">تم إرسال الطلب للتاجر:</span>
            <span className="text-lg font-black text-amber-400 font-mono-num mt-1 block">{orderedCount}</span>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/70">
            <span className="text-[11px] text-emerald-400 block font-medium">وصلت وتم استلامها:</span>
            <span className="text-lg font-black text-emerald-400 font-mono-num mt-1 block">{receivedCount}</span>
          </div>
        </div>

      </div>

      {/* Filter and Category Controls */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث في النواقص أو اسم التاجر..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto scrollbar-none pb-1 lg:pb-0">
            {['الكل', 'نواقص الصيانة', 'نواقص المحل', 'نواقص الشرايح', 'طلبية خاصة'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Supplier Selector */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap">التاجر:</span>
            <select
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
              className="bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-rose-500 focus:outline-none cursor-pointer w-full lg:w-auto"
            >
              <option value="الكل">جميع التجار والموردين</option>
              {standardSuppliers.filter(s => s !== 'أخرى').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap">الحالة:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-rose-500 focus:outline-none cursor-pointer w-full lg:w-auto"
            >
              <option value="الكل">كل الحالات</option>
              <option value="معلق">معلق فقط</option>
              <option value="تم الطلب">تم الطلب فقط</option>
              <option value="وصل للمحل">وصل للمحل فقط</option>
            </select>
          </div>

        </div>
      </div>

      {/* Shortages List Table */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#0F172A] text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-3.5 font-bold">الصورة</th>
                <th className="py-3 px-3.5 font-bold">الصنف المطلوب</th>
                <th className="py-3 px-3.5 font-bold">القسم</th>
                <th className="py-3 px-3.5 font-bold text-center">الكمية</th>
                <th className="py-3 px-3.5 font-bold">المورد / التاجر المقترح</th>
                <th className="py-3 px-3.5 font-bold text-center">الأهمية</th>
                <th className="py-3 px-3.5 font-bold text-center">حالة الطلب</th>
                <th className="py-3 px-3.5 font-bold text-center">إجراءات وبحث بديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredShortages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/60" />
                    <p className="font-bold text-sm text-slate-300">لا توجد نواقص في هذا القسم</p>
                    <p className="text-xs text-slate-500 mt-1">اضغط على زر "تسجيل ناقص / صورة" لإضافة القطع المطلوبة للمحل أو الزبائن</p>
                  </td>
                </tr>
              ) : (
                filteredShortages.map(item => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      
                      {/* Image Thumbnail */}
                      <td className="py-3 px-3.5">
                        {item.imageUrl ? (
                          <div 
                            onClick={() => setPreviewImage(item.imageUrl || null)}
                            className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-500/40 cursor-pointer hover:scale-105 transition shadow-xs bg-slate-900 flex items-center justify-center group relative"
                            title="اضغط لتكبير الصورة"
                          >
                            <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Search className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#0F172A] border border-slate-700 flex items-center justify-center text-slate-600">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-200">{item.itemName}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                          <span>سُجل بتاريخ: {item.addedDate}</span>
                          {item.notes && <span className="text-amber-300/80">• {item.notes}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          item.category === 'نواقص الصيانة'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : item.category === 'نواقص المحل'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : item.category === 'نواقص الشرايح'
                            ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="font-black text-sm font-mono-num text-white bg-[#0F172A] px-2 py-1 rounded-lg border border-slate-700">
                          {item.quantityNeeded}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-indigo-300">
                        {item.supplierName || 'غير محدد'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.urgency === 'عاجل جداً'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : item.urgency === 'متوسط'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {item.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <select
                          value={item.status}
                          onChange={e => onUpdateShortage({ ...item, status: e.target.value as any })}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                            item.status === 'وصل للمحل'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : item.status === 'تم الطلب'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          <option value="معلق" className="bg-slate-900 text-white">معلق</option>
                          <option value="تم الطلب" className="bg-slate-900 text-white">تم الطلب للتاجر</option>
                          <option value="وصل للمحل" className="bg-slate-900 text-white">وصل للمحل (تم الاستلام)</option>
                        </select>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          
                          {/* Search Alternative Suppliers Button */}
                          <button
                            onClick={() => setMultiSearchItem(item)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="البحث عن هذه القطعة عند موردين آخرين إذا لم تتوفر"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">بحث عند آخرين</span>
                          </button>

                          {item.status !== 'وصل للمحل' && onMarkAsReceived && (
                            <button
                              onClick={() => onMarkAsReceived(item)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                              title="استلام الصنف وإدخاله للمخزن مباشرة"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-indigo-400 border border-slate-700 transition cursor-pointer"
                            title="تعديل"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف الناقص (${item.itemName})؟`)) {
                                onDeleteShortage(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Supplier Alternate Search & Inquiry Modal */}
      {multiSearchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            
            <div className="p-4 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">البحث عن الصنف عند موردين بدلاء</h3>
                  <p className="text-[11px] text-slate-400">الصنف: <span className="text-amber-300 font-bold">{multiSearchItem.itemName}</span></p>
                </div>
              </div>
              <button
                onClick={() => setMultiSearchItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">المورد الأساسي الحالي:</span>
                  <span className="text-white font-black text-sm">{multiSearchItem.supplierName || 'غير محدد'}</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block text-[11px]">الكمية المطلوبة:</span>
                  <span className="text-amber-400 font-black font-mono-num text-sm">{multiSearchItem.quantityNeeded} قطعة</span>
                </div>
              </div>

              <div>
                <h4 className="text-slate-300 font-bold mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  <span>اختر المورد للاستفسار الفوري عبر الواتساب:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {suppliersDirectory.filter(s => s.name !== 'أخرى').map(supp => (
                    <div 
                      key={supp.name}
                      className="p-3 bg-[#0F172A] hover:bg-slate-800/80 border border-slate-700/70 hover:border-indigo-500/50 rounded-xl transition flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-white block">{supp.name}</span>
                        <span className="text-[10px] text-slate-400 block">{supp.role}</span>
                      </div>
                      <button
                        onClick={() => handleInquireSupplier(multiSearchItem, supp.name)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 shadow-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>استفسار</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/90 leading-relaxed">
                💡 <span className="font-bold">ملاحظة:</span> عند الضغط على "استفسار"، سيتم فتح محادثة واتساب مجهزة بنص الاستفسار التلقائي عن توفر القطعة وسعرها مباشرة.
              </div>
            </div>

            <div className="p-3 bg-[#0F172A] border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setMultiSearchItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Image Fullscreen Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="معاينة الصورة" className="max-w-full max-h-[75vh] object-contain rounded-xl mx-auto" />
            <div className="p-3 text-center text-xs text-slate-300 font-bold">
              صورة القطعة / الجوال المسجلة
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Shortage Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            
            <div className="p-4 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{editingItem ? 'تعديل بيانات الناقص' : 'تسجيل ناقص / طلبية جديدة للمحل'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              
              <div>
                <label className="block text-slate-400 font-bold mb-1">اسم الصنف أو القطعة المطلوبة: *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="مثال: شاشة سامسونج A32 أصلية، فلاتة شحن ردمي نوت 10، شرايح يمن موبايل..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">القسم / التصنيف:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="نواقص الصيانة">نواقص الصيانة (شاشات/فلاتات/قطع)</option>
                    <option value="نواقص المحل">نواقص المحل (إكسسوارات/شواحن/كفرات)</option>
                    <option value="نواقص الشرايح">نواقص الشرايح وكروت التعبئة</option>
                    <option value="طلبية خاصة">طلبية خاصة لزبون</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">الكمية المطلوبة:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityNeeded}
                    onChange={e => setQuantityNeeded(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">المورد / التاجر المقترح:</label>
                  <select
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    {standardSuppliers.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">درجة الأهمية:</label>
                  <select
                    value={urgency}
                    onChange={e => setUrgency(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="عاجل جداً">عاجل جداً (اليوم ظهراً)</option>
                    <option value="متوسط">متوسط</option>
                    <option value="عادي">عادي</option>
                  </select>
                </div>
              </div>

              {supplierName === 'أخرى' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">اسم التاجر / المورد المخصص:</label>
                  <input
                    type="text"
                    value={customSupplier}
                    onChange={e => setCustomSupplier(e.target.value)}
                    placeholder="اكتب اسم التاجر أو المتجر..."
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Image Upload for Shortage Item / Phone / Spare Part */}
              <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/80 space-y-2">
                <label className="block text-slate-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span>صورة القطعة / الجوال من الهاتف (اختياري):</span>
                  </span>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-xs text-slate-400 file:mr-0 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
                  />
                  {imageUrl && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-indigo-500 shrink-0 bg-slate-900">
                      <img src={imageUrl} alt="معاينة" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">ملاحظات أو مواصفات خاصة للقطعة:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="مثال: أصلي وكالة درجة أولى، أو لزبون أحمد..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-700/80 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-slate-400 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-md transition cursor-pointer"
                >
                  {editingItem ? 'حفظ التعديلات' : 'تسجيل الناقص'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

