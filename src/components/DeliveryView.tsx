import React, { useState } from 'react';
import { DeliveryOrder } from '../types';
import { formatNumber } from '../utils/accounting';
import { getTodayDateString } from '../utils/dateHelper';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Navigation, 
  User, 
  Building, 
  DollarSign,
  Share2
} from 'lucide-react';

interface DeliveryViewProps {
  orders: DeliveryOrder[];
  onAddOrder: (order: DeliveryOrder) => void;
  onUpdateOrder: (order: DeliveryOrder) => void;
  onDeleteOrder: (id: string) => void;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  orders,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'جاري التوصيل' | 'تم الاستلام والتسليم' | 'ملغي'>('الكل');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DeliveryOrder | null>(null);

  // Form states
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<DeliveryOrder['status']>('جاري التوصيل');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingOrder(null);
    setDriverName('');
    setDriverPhone('');
    setCustomerName('');
    setCustomerPhone('');
    setMerchantName('محل قبال للجوالات');
    setMerchantPhone('');
    setDeliveryAddress('');
    setItemDescription('');
    setCost('');
    setStatus('جاري التوصيل');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (order: DeliveryOrder) => {
    setEditingOrder(order);
    setDriverName(order.driverName);
    setDriverPhone(order.driverPhone);
    setCustomerName(order.customerName);
    setCustomerPhone(order.customerPhone || '');
    setMerchantName(order.merchantName || '');
    setMerchantPhone(order.merchantPhone || '');
    setDeliveryAddress(order.deliveryAddress);
    setItemDescription(order.itemDescription);
    setCost(order.cost.toString());
    setStatus(order.status);
    setNotes(order.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !customerName.trim()) return;

    const newOrder: DeliveryOrder = {
      id: editingOrder ? editingOrder.id : `delivery-${Date.now()}`,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      merchantName: merchantName.trim() || undefined,
      merchantPhone: merchantPhone.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || 'الموقع محدد مسبقاً',
      itemDescription: itemDescription.trim() || 'طلبية جوالات / قطع غيار',
      cost: Number(cost) || 0,
      status,
      date: editingOrder ? editingOrder.date : getTodayDateString(),
      time: editingOrder ? editingOrder.time : new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      notes: notes.trim() || undefined
    };

    if (editingOrder) {
      onUpdateOrder(newOrder);
    } else {
      onAddOrder(newOrder);
    }

    setIsAddModalOpen(false);
  };

  // WhatsApp Dispatch to Driver
  const handleSendDriverWhatsApp = (order: DeliveryOrder) => {
    const text = `🛵 *إشعار مشوار وتوصيل طلبية - محل قبال للجوالات*\n` +
      `👤 الأخ السائق: *${order.driverName}*\n` +
      `📅 التاريخ: ${order.date} | ⏰ الوقت: ${order.time || 'الآن'}\n` +
      `--------------------------------\n` +
      `🏢 *نقطة الاستلام (التاجر/المحل)*:\n` +
      `• ${order.merchantName || 'محل قبال للجوالات'}\n` +
      (order.merchantPhone ? `• هاتف: ${order.merchantPhone}\n` : '') +
      `📍 *نقطة التسليم (الزبون)*:\n` +
      `• العميل: *${order.customerName}*\n` +
      (order.customerPhone ? `• هاتف: ${order.customerPhone}\n` : '') +
      `• العنوان: *${order.deliveryAddress}*\n` +
      `📦 *محتوى الطلبية*: ${order.itemDescription}\n` +
      `💵 *أجرة التوصيل*: ${formatNumber(order.cost)} ر.ي\n` +
      (order.notes ? `📝 *ملاحظات*: ${order.notes}\n` : '') +
      `--------------------------------\n` +
      `يرجى تأكيد الاستلام والتسليم للعميل فوراً.`;

    const phoneClean = order.driverPhone.replace(/\D/g, '');
    const url = phoneClean 
      ? `https://wa.me/${phoneClean.startsWith('967') ? phoneClean : '967' + phoneClean}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // WhatsApp Dispatch to Customer
  const handleSendCustomerWhatsApp = (order: DeliveryOrder) => {
    const text = `📦 *إشعار خروج طلبيتك مع سائق التوصيل*\n` +
      `👤 عزيزي العميل: *${order.customerName}*\n` +
      `طلبيتك (${order.itemDescription}) في طريقها إليك الآن.\n` +
      `🛵 *سائق المشوار*: ${order.driverName} (${order.driverPhone || 'بدون رقم'})\n` +
      `📍 *العنوان المسجل*: ${order.deliveryAddress}\n` +
      `--------------------------------\n` +
      `✨ شكراً لتعاملك مع محل قبال للجوالات والصيانة - ذمار`;

    const phoneClean = (order.customerPhone || '').replace(/\D/g, '');
    const url = phoneClean 
      ? `https://wa.me/${phoneClean.startsWith('967') ? phoneClean : '967' + phoneClean}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'الكل' || o.status === statusFilter;
    const matchesSearch = o.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.itemDescription && o.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.merchantName && o.merchantName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalCost = orders.reduce((sum, o) => sum + (o.cost || 0), 0);
  const activeCount = orders.filter(o => o.status === 'جاري التوصيل').length;
  const completedCount = orders.filter(o => o.status === 'تم الاستلام والتسليم').length;

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Top Banner */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black shadow-inner shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">خدمة التوصيل والمشاوير (المتر)</h2>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {orders.length} مشوار مسجل
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                إرسال إشعارات التوصيل الفورية لسائقي المتر والزبائن والتجار عبر الواتساب وتوثيق أجور المشاوير
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مشوار توصيل جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/60">
          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">مشاوير جارية الآن:</span>
              <span className="text-lg font-black text-amber-400 font-mono-num">{activeCount} مشوار</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">مشاوير تم تسليمها:</span>
              <span className="text-lg font-black text-emerald-400 font-mono-num">{completedCount} مشوار</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">إجمالي أجور المشاوير:</span>
              <span className="text-lg font-black text-cyan-400 font-mono-num">{formatNumber(totalCost)} ر.ي</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم السائق، العميل، التاجر، أو العنوان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto pb-1">
          {(['الكل', 'جاري التوصيل', 'تم الاستلام والتسليم', 'ملغي'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-10 text-center">
          <Truck className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-slate-300 mb-1">لا توجد مشاوير توصيل مطابقة</h3>
          <p className="text-xs text-slate-400 mb-4">اضغط على زر "تسجيل مشوار توصيل جديد" لإضافة بيانات السائق والعميل والتاجر</p>
          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل أول مشوار الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map(order => (
            <div 
              key={order.id}
              className="bg-[#1E293B] border border-slate-700/80 hover:border-amber-500/50 rounded-2xl p-4 transition shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-amber-400" />
                        سائق المشوار: {order.driverName}
                      </h4>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                        order.status === 'تم الاستلام والتسليم'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : order.status === 'ملغي'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.date} {order.time && `• ${order.time}`}
                    </span>
                  </div>

                  <div className="text-left font-mono-num">
                    <span className="text-xs text-slate-400 block">الأجرة:</span>
                    <span className="text-sm font-black text-amber-400">{formatNumber(order.cost)} ر.ي</span>
                  </div>
                </div>

                {/* Details Card */}
                <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                      التاجر/المحل:
                    </span>
                    <span className="font-bold text-slate-200">
                      {order.merchantName || 'محل قبال'} {order.merchantPhone && `(${order.merchantPhone})`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      الزبون المستلم:
                    </span>
                    <span className="font-bold text-slate-200">
                      {order.customerName} {order.customerPhone && `(${order.customerPhone})`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      عنوان التسليم:
                    </span>
                    <span className="font-medium text-slate-300 text-left max-w-[200px] truncate">
                      {order.deliveryAddress}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                    📦 <span className="text-slate-300 font-medium">الطلبية:</span> {order.itemDescription}
                    {order.notes && <span className="block mt-0.5 text-amber-300/80">📝 {order.notes}</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {order.driverPhone && (
                    <a
                      href={`tel:${order.driverPhone}`}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="اتصال بالسائق"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => handleSendDriverWhatsApp(order)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                    title="إرسال تفاصيل المشوار لسائق المتر بالواتساب"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>إشعار السائق</span>
                  </button>

                  <button
                    onClick={() => handleSendCustomerWhatsApp(order)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition cursor-pointer"
                    title="إرسال إشعار للزبون بأن الطلبية مع السائق"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>إشعار الزبون</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(order)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                    title="تعديل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف مشوار السائق (${order.driverName})؟`)) {
                        onDeleteOrder(order.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingOrder ? 'تعديل مشوار التوصيل' : 'تسجيل مشوار توصيل جديد'}
                  </h3>
                  <p className="text-xs text-slate-400">إدخال تفاصيل السائق، التاجر، العميل، وأجرة المشوار</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              
              {/* Driver Details */}
              <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-700/70 space-y-3">
                <span className="text-xs font-bold text-amber-400 block">🛵 بيانات سائق المشوار (المتر):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">اسم السائق *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: فهد صاحب المتر"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">رقم هاتف السائق (واتساب/اتصال)</label>
                    <input
                      type="tel"
                      placeholder="77XXXXXXX"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Merchant / Pickup */}
              <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-700/70 space-y-3">
                <span className="text-xs font-bold text-indigo-400 block">🏢 نقطة الاستلام (التاجر أو المحل):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">اسم التاجر / المحل</label>
                    <input
                      type="text"
                      placeholder="مثال: محل خليل الأغبري / قبال"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">رقم هاتف التاجر</label>
                    <input
                      type="tel"
                      placeholder="رقم التاجر"
                      value={merchantPhone}
                      onChange={(e) => setMerchantPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Customer / Dropoff */}
              <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-700/70 space-y-3">
                <span className="text-xs font-bold text-cyan-400 block">📍 نقطة التسليم (الزبون المستلم):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">اسم العميل المستلم *</label>
                    <input
                      type="text"
                      required
                      placeholder="اسم الزبون"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">رقم هاتف العميل</label>
                    <input
                      type="tel"
                      placeholder="77XXXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">عنوان وموقع التسليم</label>
                  <input
                    type="text"
                    placeholder="مثال: ذمار - الشارع العام بجانب مستشفى..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Order & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">وصف الطلبية والقطع</label>
                  <input
                    type="text"
                    placeholder="مثال: شاشة سامسونج A12 + شاحن سريع"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">أجرة المشوار (ر.ي)</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">حالة المشوار</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="جاري التوصيل">جاري التوصيل 🛵</option>
                    <option value="تم الاستلام والتسليم">تم الاستلام والتسليم ✅</option>
                    <option value="ملغي">ملغي ❌</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    placeholder="أي تعليمات للسائق أو الزبون"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
                >
                  {editingOrder ? 'حفظ التعديلات' : 'تسجيل المشوار'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
