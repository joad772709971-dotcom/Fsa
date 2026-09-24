import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Printer,
  Smartphone,
  Phone,
  User,
  KeyRound,
  Calendar,
  DollarSign,
  Share2,
  Filter,
  Check,
  X,
  Layers,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { MaintenanceTicket, Transaction } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { printHtmlElement } from '../utils/printHelper';
import {
  findBestMatchPrice,
  searchPriceMemory,
  learnOrUpdatePriceMemory,
  normalizeArabic,
} from '../utils/priceMemoryStorage';
import { PriceMemoryItem } from '../types/pricing';
import { getTodayDateString } from '../utils/dateHelper';

interface MaintenanceTicketsViewProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
}

const INITIAL_TICKETS: MaintenanceTicket[] = [];

export const MaintenanceTicketsView: React.FC<MaintenanceTicketsViewProps> = ({
  transactions,
  onAddTransaction,
}) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = localStorage.getItem('mosaab_maintenance_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TICKETS;
      }
    }
    return INITIAL_TICKETS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState<MaintenanceTicket | null>(null);
  const [deliveryModalTicket, setDeliveryModalTicket] = useState<MaintenanceTicket | null>(null);

  // New ticket state
  const [formData, setFormData] = useState<Partial<MaintenanceTicket>>({
    customerName: '',
    customerPhone: '',
    deviceModel: '',
    deviceColor: '',
    passcode: '',
    issueDescription: '',
    includedItems: [],
    estimatedCost: 0,
    depositPaid: 0,
    sparePartCost: 0,
    technicianName: 'مهندس الصيانة',
    receiveDate: getTodayDateString(),
    receiveTime: new Date().toTimeString().slice(0, 5),
    expectedDeliveryDate: getTodayDateString(),
    status: 'received',
    warrantyDays: 3,
    notes: '',
  });

  const [tempIncludedItem, setTempIncludedItem] = useState('');
  const [damarSuggestions, setDamarSuggestions] = useState<PriceMemoryItem[]>([]);
  const [matchedDamar, setMatchedDamar] = useState<PriceMemoryItem | null>(null);

  // Auto-search price memory for spare parts when user types issue or device
  const handleIssueOrDeviceChange = (device: string, issue: string) => {
    const combinedQuery = `${device} ${issue}`.trim();
    if (combinedQuery.length > 1) {
      const screensAndParts = searchPriceMemory(combinedQuery, undefined, 5);
      setDamarSuggestions(screensAndParts);

      // Check for exact/best match
      const best = findBestMatchPrice(combinedQuery) || findBestMatchPrice(issue) || findBestMatchPrice(device);
      if (best) {
        setMatchedDamar(best);
        if (!formData.sparePartCost || formData.sparePartCost === 0) {
          setFormData((prev) => ({
            ...prev,
            sparePartCost: best.costPrice,
            estimatedCost: prev.estimatedCost || best.sellingPrice,
          }));
        }
      }
    } else {
      setDamarSuggestions([]);
    }
  };

  const handleSelectDamarItem = (item: PriceMemoryItem) => {
    setMatchedDamar(item);
    setFormData((prev) => ({
      ...prev,
      sparePartCost: item.costPrice,
      estimatedCost: prev.estimatedCost || item.sellingPrice,
    }));
    setDamarSuggestions([]);
  };

  // Persist tickets
  const saveTickets = (updated: MaintenanceTicket[]) => {
    setTickets(updated);
    localStorage.setItem('mosaab_maintenance_tickets', JSON.stringify(updated));
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerPhone.includes(searchQuery) ||
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.issueDescription.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress' || t.status === 'received').length;
    const ready = tickets.filter((t) => t.status === 'ready').length;
    const delivered = tickets.filter((t) => t.status === 'delivered').length;
    const waitingParts = tickets.filter((t) => t.status === 'waiting_parts').length;
    return { total, inProgress, ready, delivered, waitingParts };
  }, [tickets]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.deviceModel || !formData.issueDescription) {
      alert('يرجى تعبئة الحقول الأساسية: اسم العميل، نوع الجهاز، ووصف العطل.');
      return;
    }

    const nextNumber = tickets.length + 101;
    const newTicket: MaintenanceTicket = {
      id: 'tck-' + Date.now(),
      ticketNumber: `TCK-24-${nextNumber}`,
      customerName: formData.customerName || '',
      customerPhone: formData.customerPhone || '',
      deviceModel: formData.deviceModel || '',
      deviceColor: formData.deviceColor || '',
      passcode: formData.passcode || 'لا يوجد',
      issueDescription: formData.issueDescription || '',
      includedItems: formData.includedItems || [],
      estimatedCost: Number(formData.estimatedCost) || 0,
      depositPaid: Number(formData.depositPaid) || 0,
      sparePartCost: Number(formData.sparePartCost) || 0,
      technicianName: formData.technicianName || 'مهندس الصيانة',
      receiveDate: formData.receiveDate || new Date().toISOString().split('T')[0],
      receiveTime: formData.receiveTime || new Date().toTimeString().slice(0, 5),
      expectedDeliveryDate: formData.expectedDeliveryDate || new Date().toISOString().split('T')[0],
      status: 'received',
      warrantyDays: Number(formData.warrantyDays) || 3,
      barcode: `TCK24${nextNumber}`,
      notes: formData.notes || '',
    };

    const updated = [newTicket, ...tickets];
    saveTickets(updated);
    setIsNewModalOpen(false);
    setSelectedTicketForPrint(newTicket); // open print preview directly

    // Reset form
    setFormData({
      customerName: '',
      customerPhone: '',
      deviceModel: '',
      deviceColor: '',
      passcode: '',
      issueDescription: '',
      includedItems: [],
      estimatedCost: 0,
      depositPaid: 0,
      sparePartCost: 0,
      technicianName: 'مهندس الصيانة',
      receiveDate: getTodayDateString(),
      receiveTime: new Date().toTimeString().slice(0, 5),
      expectedDeliveryDate: getTodayDateString(),
      status: 'received',
      warrantyDays: 3,
      notes: '',
    });
  };

  const handleUpdateStatus = (ticketId: string, newStatus: MaintenanceTicket['status']) => {
    if (newStatus === 'delivered') {
      const target = tickets.find((t) => t.id === ticketId);
      if (target) {
        setDeliveryModalTicket(target);
        return;
      }
    }

    const updated = tickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t));
    saveTickets(updated);
  };

  const handleConfirmDelivery = (postToDailyLedger: boolean) => {
    if (!deliveryModalTicket) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    const updated = tickets.map((t) =>
      t.id === deliveryModalTicket.id
        ? {
            ...t,
            status: 'delivered' as const,
            actualDeliveryDate: todayStr,
          }
        : t
    );
    saveTickets(updated);

    // If posting to daily ledger automatically
    if (postToDailyLedger) {
      const price = deliveryModalTicket.estimatedCost;
      const cost = deliveryModalTicket.sparePartCost;
      const profit = Math.max(0, price - cost);

      const newTx: Transaction = {
        id: 'tx-maint-' + Date.now(),
        date: todayStr,
        time: nowTime,
        type: 'maintenance',
        category: 'maintenance',
        description: `صيانة ${deliveryModalTicket.deviceModel} - ${deliveryModalTicket.issueDescription} (${deliveryModalTicket.ticketNumber})`,
        customerName: deliveryModalTicket.customerName,
        technicianName: deliveryModalTicket.technicianName,
        price: price,
        cost: cost,
        profit: profit,
        paymentMethod: 'cash',
        notes: `تم تسليم الجهاز وضمان ${deliveryModalTicket.warrantyDays || 3} أيام. كود الكرت: ${deliveryModalTicket.ticketNumber}`,
      };

      onAddTransaction(newTx);

      // Auto-learn spare part cost into persistent price memory
      if (cost > 0 || price > 0) {
        try {
          const itemName = deliveryModalTicket.issueDescription.includes('شاشة') || deliveryModalTicket.issueDescription.includes('شاشه')
            ? `شاشة ${deliveryModalTicket.deviceModel}`
            : `${deliveryModalTicket.deviceModel} - ${deliveryModalTicket.issueDescription}`;
          
          learnOrUpdatePriceMemory(
            itemName,
            cost,
            price,
            deliveryModalTicket.issueDescription.includes('شاشة') ? 'screens' : 'spare_parts',
            'صيانة وهاردوير',
            `تم التعلم تلقائياً من كرت الصيانة ${deliveryModalTicket.ticketNumber}`
          );
        } catch (e) {
          console.error('Failed to learn price from maintenance ticket:', e);
        }
      }
    }

    setDeliveryModalTicket(null);
  };

  const getStatusBadge = (status: MaintenanceTicket['status']) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> تم الاستلام
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Wrench className="w-3 h-3" /> قيد التصليح
          </span>
        );
      case 'waiting_parts':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Truck className="w-3 h-3" /> بانتظار قطع
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> جاهز للتسليم
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Check className="w-3 h-3 text-emerald-600" /> تم التسليم بنجاح
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <X className="w-3 h-3" /> ملغي / تعذر
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Wrench className="w-6 h-6" />
            </span>
            <h1 className="text-xl font-black tracking-tight">
              نظام كروت واستلام أجهزة الصيانة الذكي
            </h1>
          </div>
          <p className="text-xs text-slate-300">
            استلام هواتف العملاء، تسجيل الأعطال والرموز، طباعة كروت التسليم، وتوزيع الأرباح (50% مهندس و 50% محل).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            استلام جهاز صيانة جديد
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-bold mb-1">إجمالي الأجهزة</div>
          <div className="text-xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-amber-700 text-xs font-bold mb-1">قيد الفحص والتصليح</div>
          <div className="text-xl font-black text-amber-900">{stats.inProgress}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-xs">
          <div className="text-purple-700 text-xs font-bold mb-1">بانتظار قطع غيار</div>
          <div className="text-xl font-black text-purple-900">{stats.waitingParts}</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-emerald-700 text-xs font-bold mb-1">جاهز للتسليم الآن</div>
          <div className="text-xl font-black text-emerald-900">{stats.ready}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-600 text-xs font-bold mb-1">تم تسليمها</div>
          <div className="text-xl font-black text-slate-800">{stats.delivered}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل، الهاتف، رقم الكرت، الموديل..."
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'received', label: 'مستلم' },
            { id: 'in_progress', label: 'قيد الصيانة' },
            { id: 'waiting_parts', label: 'بانتظار قطع' },
            { id: 'ready', label: 'جاهز للتسليم' },
            { id: 'delivered', label: 'تم التسليم' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((ticket) => {
          const remainingAmount = Math.max(0, ticket.estimatedCost - ticket.depositPaid);
          const estimatedProfit = Math.max(0, ticket.estimatedCost - ticket.sparePartCost);
          const engineerShare = Math.round(estimatedProfit * 0.5);

          return (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs px-2.5 py-1 bg-slate-900 text-amber-300 rounded-lg shadow-xs">
                    {ticket.ticketNumber}
                  </span>
                  {getStatusBadge(ticket.status)}
                </div>

                <div className="flex items-start justify-between pt-1">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                      {ticket.deviceModel}
                    </h3>
                    {ticket.deviceColor && (
                      <span className="text-[11px] text-slate-500 mr-5">اللون: {ticket.deviceColor}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTicketForPrint(ticket)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="طباعة كرت استلام صيانة"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Customer & Specs Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {ticket.customerName}
                  </div>
                  <a
                    href={`tel:${ticket.customerPhone}`}
                    className="flex items-center gap-1 text-indigo-600 hover:underline font-mono text-[11px]"
                  >
                    <Phone className="w-3 h-3" />
                    {ticket.customerPhone}
                  </a>
                </div>

                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span className="flex items-center gap-1 font-bold text-amber-800">
                    <KeyRound className="w-3 h-3 text-amber-600" />
                    الرمز: {ticket.passcode || 'بدون رمز'}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {ticket.receiveDate}
                  </span>
                </div>

                <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200/60">
                  <strong className="text-slate-900">العطل:</strong> {ticket.issueDescription}
                </div>

                {ticket.includedItems && ticket.includedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ticket.includedItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Box */}
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-indigo-950">التكلفة الإجمالية:</span>
                  <span className="text-indigo-700 font-mono text-sm">
                    {formatCurrency(ticket.estimatedCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>المدفوع مقدماً: {formatCurrency(ticket.depositPaid)}</span>
                  <span className="font-bold text-rose-700">
                    المتبقي: {formatCurrency(remainingAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-800 pt-1 border-t border-indigo-100 font-medium">
                  <span>قطعة الغيار: {formatCurrency(ticket.sparePartCost)}</span>
                  <span>حصة المهندس (50%): {formatCurrency(engineerShare)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2">
                {ticket.status !== 'delivered' && ticket.status !== 'cancelled' && (
                  <div className="relative flex-1">
                    <select
                      value={ticket.status}
                      onChange={(e) =>
                        handleUpdateStatus(ticket.id, e.target.value as MaintenanceTicket['status'])
                      }
                      className="w-full text-xs font-bold py-2 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="received">1. تم الاستلام</option>
                      <option value="in_progress">2. قيد الفحص والتصليح</option>
                      <option value="waiting_parts">3. بانتظار قطع غيار</option>
                      <option value="ready">4. جاهز للتسليم (جاهز)</option>
                      <option value="delivered">5. تسليم للعميل وتصفية</option>
                      <option value="cancelled">6. ملغي / تعذر</option>
                    </select>
                  </div>
                )}

                {ticket.status === 'ready' && (
                  <button
                    onClick={() => setDeliveryModalTicket(ticket)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    تسليم واستلام
                  </button>
                )}

                {ticket.status === 'delivered' && (
                  <div className="w-full text-center text-xs text-slate-500 font-bold py-1 bg-slate-100 rounded-lg">
                    تم التسليم في {ticket.actualDeliveryDate || ticket.receiveDate} ✓
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">لا توجد كروت صيانة مطابقة</h3>
          <p className="text-xs text-slate-400">
            يمكنك إضافة كرت استلام صيانة جديد الآن وتوثيق كافة الأجهزة المستلمة.
          </p>
        </div>
      )}

      {/* New Maintenance Ticket Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">إصدار كرت استلام صيانة جديد</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Customer details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName || ''}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="مثال: صادق المريسي"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone || ''}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="777123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Device details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع وموديل الجهاز *</label>
                  <input
                    type="text"
                    required
                    value={formData.deviceModel || ''}
                    onChange={(e) => {
                      const newDev = e.target.value;
                      setFormData({ ...formData, deviceModel: newDev });
                      handleIssueOrDeviceChange(newDev, formData.issueDescription || '');
                    }}
                    placeholder="مثال: سامسونج A12، ردمي 9X، LG ستايل 4"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">لون الجهاز</label>
                  <input
                    type="text"
                    value={formData.deviceColor || ''}
                    onChange={(e) => setFormData({ ...formData, deviceColor: e.target.value })}
                    placeholder="أسود، أزرق، أبيض"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز القفل أو النمط</label>
                  <input
                    type="text"
                    value={formData.passcode || ''}
                    onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                    placeholder="مثال: 0000 أو نمط L"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Issue & Included Items */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف العطل المطلوب إصلاحه *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.issueDescription || ''}
                  onChange={(e) => {
                    const newIssue = e.target.value;
                    setFormData({ ...formData, issueDescription: newIssue });
                    handleIssueOrDeviceChange(formData.deviceModel || '', newIssue);
                  }}
                  placeholder="مثال: تغيير شاشة سامسونج A12، فلاتة شحن A20، برمجة وتخطي جوجل"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Damar price suggestions list */}
                {damarSuggestions.length > 0 && (
                  <div className="mt-1.5 p-2 bg-slate-900 text-white rounded-xl text-xs space-y-1">
                    <div className="text-[10px] font-bold text-amber-300 flex items-center justify-between">
                      <span>⚡ تم العثور على قطع غيار في ذاكرة الأسعار (اضغط للملء التلقائي):</span>
                      <button type="button" onClick={() => setDamarSuggestions([])} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {damarSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectDamarItem(item)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-900 text-[11px] border border-slate-700 flex items-center gap-1.5 cursor-pointer text-right"
                        >
                          <span className="font-medium text-slate-200">{item.name}</span>
                          <span className="font-mono text-amber-400 font-bold">ضمار: {formatNumber(item.costPrice)} ر.ي</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchedDamar && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      تم ربط الضمار من الذاكرة ({matchedDamar.name}): تكلفة القطعة <strong>{formatNumber(matchedDamar.costPrice)} ر.ي</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Included items chips */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الملحقات المسلمة مع الجهاز</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tempIncludedItem}
                    onChange={(e) => setTempIncludedItem(e.target.value)}
                    placeholder="شريحة، بطارية، كفر، كرت ذاكرة..."
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempIncludedItem.trim()) {
                        setFormData({
                          ...formData,
                          includedItems: [...(formData.includedItems || []), tempIncludedItem.trim()],
                        });
                        setTempIncludedItem('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 text-white font-bold rounded-xl"
                  >
                    إضافة
                  </button>
                </div>
                {formData.includedItems && formData.includedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.includedItems.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] px-2 py-0.5 rounded-lg"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              includedItems: formData.includedItems?.filter((_, idx) => idx !== i),
                            })
                          }
                          className="hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial calculations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التكلفة المتوقعة (المبلغ من العميل)</label>
                  <input
                    type="number"
                    value={formData.estimatedCost || ''}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ المدفوع مقدماً (عربون)</label>
                  <input
                    type="number"
                    value={formData.depositPaid || ''}
                    onChange={(e) => setFormData({ ...formData, depositPaid: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تكلفة قطعة الغيار (رأس المال)</label>
                  <input
                    type="number"
                    value={formData.sparePartCost || ''}
                    onChange={(e) => setFormData({ ...formData, sparePartCost: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* Dates and technician */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المهندس المسؤول</label>
                  <input
                    type="text"
                    value={formData.technicianName || 'مهندس الصيانة'}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">موعد التسليم المتوقع</label>
                  <input
                    type="date"
                    value={formData.expectedDeliveryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مدة الضمان (أيام)</label>
                  <input
                    type="number"
                    value={formData.warrantyDays || 3}
                    onChange={(e) => setFormData({ ...formData, warrantyDays: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  حفظ الكرت وطباعة الإيصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {deliveryModalTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">تأكيد تسليم جهاز الصيانة وتصفية الحساب</h3>
              </div>
              <button
                onClick={() => setDeliveryModalTicket(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>الجهاز:</span>
                  <span>{deliveryModalTicket.deviceModel}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>العميل:</span>
                  <span>{deliveryModalTicket.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>رقم الكرت:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {deliveryModalTicket.ticketNumber}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-emerald-800">
                  <span>المبلغ المستحق للدفع:</span>
                  <span>
                    {formatCurrency(
                      deliveryModalTicket.estimatedCost - deliveryModalTicket.depositPaid
                    )}
                  </span>
                </div>
              </div>

              {/* Profit auto split notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  تقسيم الصيانة التلقائي (قاعدة 50% / 50%):
                </div>
                <p className="text-[11px] text-emerald-900">
                  إجمالي المبلغ: {formatCurrency(deliveryModalTicket.estimatedCost)} | تكلفة القطعة:{' '}
                  {formatCurrency(deliveryModalTicket.sparePartCost)}
                  <br />
                  صافي الفائدة ={' '}
                  <strong>
                    {formatCurrency(
                      deliveryModalTicket.estimatedCost - deliveryModalTicket.sparePartCost
                    )}
                  </strong>
                  <br />
                  • حصة المهندس (50%):{' '}
                  {formatCurrency(
                    (deliveryModalTicket.estimatedCost - deliveryModalTicket.sparePartCost) * 0.5
                  )}
                  <br />• حصة المحل (50%):{' '}
                  {formatCurrency(
                    (deliveryModalTicket.estimatedCost - deliveryModalTicket.sparePartCost) * 0.5
                  )}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleConfirmDelivery(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  تأكيد التسليم والترحيل إلى دفتر اليومية التلقائي
                </button>
                <button
                  onClick={() => handleConfirmDelivery(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
                >
                  تسليم فقط بدون ترحيل لليومية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Maintenance Ticket Modal (Thermal / Receipt Style) */}
      {selectedTicketForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs">معاينة كرت استلام الصيانة للطباعة</h3>
              <button
                onClick={() => setSelectedTicketForPrint(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Ticket Format */}
            <div id="printable-maintenance-job-ticket" className="p-6 bg-white font-mono text-slate-900 text-xs space-y-3 border border-slate-200 m-4 rounded-xl shadow-inner">
              <div className="text-center border-b border-dashed border-slate-400 pb-3">
                <h2 className="font-black text-sm tracking-wide">محل مصعب الصوفي للجوالات</h2>
                <p className="text-[10px] text-slate-600">خدمات صيانة وبرمجة وبيع وشراء الأجهزة</p>
                <p className="text-[10px] text-slate-600">تلفون: 777000000 • اليمن</p>
              </div>

              <div className="text-center font-bold py-1 bg-slate-100 rounded text-xs">
                كرت استلام صيانة (JOB TICKET)
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>رقم الكرت:</span>
                  <span className="font-black">{selectedTicketForPrint.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ والوقت:</span>
                  <span>
                    {selectedTicketForPrint.receiveDate} {selectedTicketForPrint.receiveTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>اسم العميل:</span>
                  <span className="font-bold">{selectedTicketForPrint.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>هاتف العميل:</span>
                  <span>{selectedTicketForPrint.customerPhone}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>نوع الجهاز:</span>
                  <span className="font-bold">{selectedTicketForPrint.deviceModel}</span>
                </div>
                <div className="flex justify-between">
                  <span>رمز القفل/النمط:</span>
                  <span className="font-bold text-rose-700">
                    {selectedTicketForPrint.passcode || 'لا يوجد'}
                  </span>
                </div>
                <div className="text-[10px]">
                  <span>العطل: </span>
                  <strong>{selectedTicketForPrint.issueDescription}</strong>
                </div>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between font-bold">
                  <span>التكلفة المقدرة:</span>
                  <span>{formatCurrency(selectedTicketForPrint.estimatedCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>العربون المسلم:</span>
                  <span>{formatCurrency(selectedTicketForPrint.depositPaid)}</span>
                </div>
                <div className="flex justify-between font-black text-rose-800">
                  <span>المتبقي عند الاستلام:</span>
                  <span>
                    {formatCurrency(
                      selectedTicketForPrint.estimatedCost - selectedTicketForPrint.depositPaid
                    )}
                  </span>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="text-center pt-2">
                <div className="font-mono text-base tracking-[0.25em] font-black border-y-2 border-slate-800 py-1">
                  ||||| | |||| ||| |||||
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  *{selectedTicketForPrint.barcode || selectedTicketForPrint.ticketNumber}*
                </div>
              </div>

              <div className="text-[9px] text-slate-500 text-center leading-tight pt-2 border-t border-dashed border-slate-400">
                * المحل غير مسؤول عن الأجهزة بعد مرور 30 يوماً من تاريخ الإشعار بالجاهزية.
                <br />* الضمان يسري على القطعة المستبدلة فقط لمدة {selectedTicketForPrint.warrantyDays || 3} أيام.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedTicketForPrint(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-slate-700 text-xs transition-colors"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  printHtmlElement('printable-maintenance-job-ticket', `كرت_صيانة_${selectedTicketForPrint.ticketNumber}`);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                طباعة الكرت الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
