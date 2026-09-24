import React, { useState } from 'react';
import { MaintenanceDevice, SHOP_INFO, SHOP_POLICIES } from '../types';
import { formatNumber } from '../utils/accounting';
import { 
  buildMaintenanceTicketMessage, 
  buildMaintenanceReadyMessage, 
  buildStorageWarningMessage, 
  openWhatsApp,
  openSMS
} from '../utils/messaging';
import { DocumentModal } from './DocumentModal';
import { AppLogo } from './AppLogo';
import { generateBarcodeSVG } from './BarcodeBadge';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Phone, 
  Camera, 
  Printer, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  Smartphone, 
  DollarSign,
  TrendingUp,
  FileText,
  User,
  ShieldAlert,
  ArrowRight,
  Copy,
  Share2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { exportMaintenanceToExcel } from '../utils/excelExport';

interface MaintenanceViewProps {
  devices: MaintenanceDevice[];
  onUpdateDevices: (devices: MaintenanceDevice[]) => void;
  days?: import('../types').DayRecord[];
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  devices,
  onUpdateDevices,
  days = []
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');

  // Intake / Create Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<MaintenanceDevice | null>(null);

  // Document / Camera Modal
  const [documentModalData, setDocumentModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    whatsappMessage?: string;
    customerPhone?: string;
    onSave: (url: string | undefined) => void;
  }>({
    isOpen: false,
    title: '',
    onSave: () => {}
  });

  // Printable Ticket Modal
  const [printableTicket, setPrintableTicket] = useState<MaintenanceDevice | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [color, setColor] = useState('');
  const [passcode, setPasscode] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [serviceType, setServiceType] = useState<MaintenanceDevice['serviceType']>('شاشات');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [profit, setProfit] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [technicianName, setTechnicianName] = useState<MaintenanceDevice['technicianName']>('المهندس');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const nextTicketNumber = devices.length > 0 
    ? Math.max(...devices.map(d => Number(d.ticketNumber) || 0)) + 1 
    : 101;

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDeviceModel('');
    setColor('');
    setPasscode('');
    setIssueDescription('');
    setServiceType('شاشات');
    setEstimatedCost('');
    setActualCost('');
    setProfit('');
    setPaidAmount('');
    setTechnicianName('المهندس');
    setImageUrl(undefined);
    setNotes('');
    setEditingDevice(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (device: MaintenanceDevice) => {
    setEditingDevice(device);
    setCustomerName(device.customerName);
    setCustomerPhone(device.customerPhone);
    setDeviceModel(device.deviceModel);
    setColor(device.color || '');
    setPasscode(device.passcode || '');
    setIssueDescription(device.issueDescription);
    setServiceType(device.serviceType);
    setEstimatedCost(device.estimatedCost.toString());
    setActualCost(device.actualCost !== undefined ? device.actualCost.toString() : '');
    setProfit(device.profit !== undefined ? device.profit.toString() : '');
    setPaidAmount(device.paidAmount.toString());
    setTechnicianName(device.technicianName);
    setImageUrl(device.imageUrl);
    setNotes(device.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !deviceModel || !issueDescription) return;

    const estCost = Number(estimatedCost) || 0;
    const actCost = actualCost !== '' ? Number(actualCost) : undefined;
    const prof = profit !== '' ? Number(profit) : (actCost !== undefined ? Math.max(0, estCost - actCost) : undefined);
    const paid = Number(paidAmount) || 0;
    const remaining = Math.max(0, estCost - paid);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });

    if (editingDevice) {
      const updated: MaintenanceDevice = {
        ...editingDevice,
        customerName,
        customerPhone,
        deviceModel,
        color: color || undefined,
        passcode: passcode || undefined,
        issueDescription,
        serviceType,
        estimatedCost: estCost,
        actualCost: actCost,
        profit: prof,
        paidAmount: paid,
        remainingAmount: remaining,
        technicianName,
        imageUrl,
        notes: notes || undefined,
      };
      onUpdateDevices(devices.map(d => d.id === updated.id ? updated : d));
    } else {
      const newDev: MaintenanceDevice = {
        id: `maint-dev-${Date.now()}`,
        ticketNumber: nextTicketNumber,
        customerName,
        customerPhone,
        deviceModel,
        color: color || undefined,
        passcode: passcode || undefined,
        issueDescription,
        serviceType,
        receivedDate: dateStr,
        receivedTime: timeStr,
        estimatedCost: estCost,
        actualCost: actCost,
        profit: prof,
        paidAmount: paid,
        remainingAmount: remaining,
        status: 'قيد الفحص',
        technicianName,
        imageUrl,
        notes: notes || undefined,
      };
      onUpdateDevices([newDev, ...devices]);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDeleteDevice = (id: string) => {
    if (confirm('هل أنت متأكد من حذف كرت الصيانة هذا؟')) {
      onUpdateDevices(devices.filter(d => d.id !== id));
    }
  };

  const handleUpdateStatus = (device: MaintenanceDevice, newStatus: MaintenanceDevice['status']) => {
    const now = new Date().toISOString().split('T')[0];
    const updated: MaintenanceDevice = {
      ...device,
      status: newStatus,
      readyDate: newStatus === 'جاهز للتسليم' ? now : device.readyDate,
      deliveredDate: newStatus === 'تم التسليم والمحاسبة' ? now : device.deliveredDate,
      remainingAmount: newStatus === 'تم التسليم والمحاسبة' ? 0 : device.remainingAmount
    };
    onUpdateDevices(devices.map(d => d.id === device.id ? updated : d));
  };

  // Helper to open Document Modal
  const openDocumentViewer = (
    title: string,
    subtitle: string,
    img: string | undefined,
    onSave: (url: string | undefined) => void,
    whatsappMessage?: string,
    phoneNum?: string
  ) => {
    setDocumentModalData({
      isOpen: true,
      title,
      subtitle,
      imageUrl: img,
      whatsappMessage,
      customerPhone: phoneNum,
      onSave
    });
  };

  // Calculations
  const inWorkshopCount = devices.filter(d => ['قيد الفحص', 'بانتظار قطع الغيار', 'جاري الصيانة'].includes(d.status)).length;
  const readyCount = devices.filter(d => d.status === 'جاهز للتسليم').length;
  const deliveredCount = devices.filter(d => d.status === 'تم التسليم والمحاسبة').length;
  const confiscatedCount = devices.filter(d => d.status === 'تمت المصادرة (تجاوز شهر)').length;

  const totalAgreedRevenue = devices.reduce((sum, d) => sum + d.estimatedCost, 0);
  const totalPartsCost = devices.reduce((sum, d) => sum + (d.actualCost || 0), 0);
  const totalEstimatedProfit = devices.reduce((sum, d) => sum + (d.profit || 0), 0);
  const totalRemainingDue = devices
    .filter(d => d.status !== 'تم التسليم والمحاسبة' && d.status !== 'ملغي / لم يصلح' && d.status !== 'تمت المصادرة (تجاوز شهر)')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  // Filtered devices
  const filteredDevices = devices.filter(d => {
    const matchesSearch = 
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerPhone.includes(searchTerm) ||
      d.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ticketNumber.toString().includes(searchTerm) ||
      d.issueDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesTech = technicianFilter === 'all' || d.technicianName === technicianFilter;

    return matchesSearch && matchesStatus && matchesTech;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">نظام كروت الصيانة ومتابعة الأجهزة</h1>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  {SHOP_INFO.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                إصدار كروت الفحص، أجور اليد، وتكلفة قطع الغيار، مع تنبيهات الواتساب وسياسة الاستلام (مصادرة بعد شهر)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportMaintenanceToExcel(devices)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            title="تصدير كشف وسجل كروت الصيانة والأجهزة إلى إكسيل"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير كشف الصيانة (Excel)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ كرت صيانة واستلام جهاز</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* 1. In workshop */}
        <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700 text-center">
          <span className="text-xs text-slate-400 font-medium block">أجهزة قيد الصيانة بالمحل</span>
          <span className="text-2xl font-black text-amber-400 font-mono-num block mt-1">
            {inWorkshopCount}
          </span>
          <span className="text-[10px] text-amber-300 font-normal">جهاز في الورشة</span>
        </div>

        {/* 2. Ready */}
        <div className="bg-[#1E293B] p-4 rounded-xl border border-emerald-500/40 text-center bg-emerald-950/10">
          <span className="text-xs text-emerald-300 font-bold block">جاهزة للتسليم</span>
          <span className="text-2xl font-black text-emerald-400 font-mono-num block mt-1">
            {readyCount}
          </span>
          <span className="text-[10px] text-emerald-500 font-normal">بانتظار قدوم الزبون</span>
        </div>

        {/* 3. Expected Profit */}
        <div className="bg-[#1E293B] p-4 rounded-xl border border-indigo-500/40 text-center bg-indigo-950/10">
          <span className="text-xs text-indigo-300 font-bold block">إجمالي أرباح وأجر اليد المقدرة</span>
          <span className="text-2xl font-black text-indigo-400 font-mono-num block mt-1">
            {formatNumber(totalEstimatedProfit)}
          </span>
          <span className="text-[10px] text-indigo-400 font-normal">ريال يمني</span>
        </div>

        {/* 4. Total Remaining Due */}
        <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700 text-center">
          <span className="text-xs text-slate-400 font-medium block">المتبقي للتحصيل عند التسليم</span>
          <span className="text-2xl font-black text-cyan-400 font-mono-num block mt-1">
            {formatNumber(totalRemainingDue)}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">ريال يمني</span>
        </div>

        {/* 5. Delivered */}
        <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700 text-center col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-400 font-medium block">تم تسليمها ومحاسبتها</span>
          <span className="text-2xl font-black text-slate-200 font-mono-num block mt-1">
            {deliveredCount}
          </span>
          <span className="text-[10px] text-slate-500 font-normal">جهاز مكتمل</span>
        </div>

      </div>

      {/* Policy Warning Banner */}
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 text-xs text-amber-200">
        <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
        <div>
          <strong className="text-amber-300 block mb-0.5">سياسة وشروط الصيانة بمحل الرقم الأول:</strong>
          <span>{SHOP_POLICIES.maintenanceStorage}</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#1E293B] p-4 rounded-2xl border border-slate-700 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الكرت، اسم الزبون، الهاتف، الموديل..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Status & Tech Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#0F172A] border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">كل الحالات ({devices.length})</option>
            <option value="قيد الفحص">قيد الفحص</option>
            <option value="بانتظار قطع الغيار">بانتظار قطع الغيار</option>
            <option value="جاري الصيانة">جاري الصيانة</option>
            <option value="جاهز للتسليم">جاهز للتسليم</option>
            <option value="تم التسليم والمحاسبة">تم التسليم والمحاسبة</option>
            <option value="تمت المصادرة (تجاوز شهر)">تمت المصادرة (تجاوز شهر)</option>
            <option value="ملغي / لم يصلح">ملغي / لم يصلح</option>
          </select>

          <select
            value={technicianFilter}
            onChange={e => setTechnicianFilter(e.target.value)}
            className="bg-[#0F172A] border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">كل الفنيين</option>
            <option value="المهندس">المهندس (772315106)</option>
            <option value="حمدان">حمدان</option>
            <option value="عبد الغني">عبد الغني</option>
          </select>
        </div>
      </div>

      {/* Devices List / Cards */}
      {filteredDevices.length === 0 ? (
        <div className="bg-[#1E293B] rounded-2xl p-12 text-center border border-slate-700 text-slate-400">
          <Wrench className="w-12 h-12 mx-auto text-slate-600 mb-3 opacity-50" />
          <h3 className="text-base font-bold text-slate-300">لا توجد أجهزة صيانة مطابقة</h3>
          <p className="text-xs text-slate-500 mt-1">قم بإضافة كرت صيانة جديد للبدء بمتابعة الأجهزة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => {
            const ticketMsg = buildMaintenanceTicketMessage({
              ticketNumber: device.ticketNumber,
              customerName: device.customerName,
              customerPhone: device.customerPhone,
              deviceModel: device.deviceModel,
              issueDescription: device.issueDescription,
              estimatedCost: device.estimatedCost,
              paidAmount: device.paidAmount,
              remainingAmount: device.remainingAmount,
              receivedDate: device.receivedDate
            });

            const readyMsg = buildMaintenanceReadyMessage({
              ticketNumber: device.ticketNumber,
              customerName: device.customerName,
              customerPhone: device.customerPhone,
              deviceModel: device.deviceModel,
              remainingAmount: device.remainingAmount
            });

            const warningMsg = buildStorageWarningMessage({
              ticketNumber: device.ticketNumber,
              customerName: device.customerName,
              deviceModel: device.deviceModel,
              receivedDate: device.receivedDate,
              remainingAmount: device.remainingAmount
            });

            // Status color helper
            const getStatusBadge = (status: MaintenanceDevice['status']) => {
              switch (status) {
                case 'قيد الفحص':
                  return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                case 'بانتظار قطع الغيار':
                  return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                case 'جاري الصيانة':
                  return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                case 'جاهز للتسليم':
                  return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse';
                case 'تم التسليم والمحاسبة':
                  return 'bg-slate-700 text-slate-300 border-slate-600';
                case 'تمت المصادرة (تجاوز شهر)':
                  return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                default:
                  return 'bg-slate-700 text-slate-300 border-slate-600';
              }
            };

            return (
              <div 
                key={device.id}
                className={`bg-[#1E293B] rounded-2xl border ${device.status === 'جاهز للتسليم' ? 'border-emerald-500/60 shadow-emerald-950/30' : 'border-slate-700'} p-5 flex flex-col justify-between shadow-lg space-y-4 hover:border-indigo-500/50 transition`}
              >
                {/* Card Top: Ticket Number & Status */}
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-lg font-mono-num shadow-sm">
                        #{device.ticketNumber}
                      </span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 font-medium">
                        {device.serviceType}
                      </span>
                    </div>

                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${getStatusBadge(device.status)}`}>
                      {device.status}
                    </span>
                  </div>

                  {/* Device & Customer Details */}
                  <div className="mt-3 space-y-2">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{device.deviceModel}</span>
                        {device.color && <span className="text-xs text-slate-400 font-normal">({device.color})</span>}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                        <span className="font-semibold text-amber-300">العطل: </span>
                        {device.issueDescription}
                      </p>
                    </div>

                    {/* Passcode & Tech */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>
                        <span>الزبون: </span>
                        <strong className="text-slate-200">{device.customerName}</strong>
                      </div>
                      <div>
                        <span>الهاتف: </span>
                        <strong className="text-indigo-300 font-mono-num">{device.customerPhone || 'غير مسجل'}</strong>
                      </div>
                      {device.passcode && (
                        <div>
                          <span>الرمز/النمط: </span>
                          <strong className="text-amber-300 font-mono-num bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                            {device.passcode}
                          </strong>
                        </div>
                      )}
                      <div>
                        <span>الفني: </span>
                        <strong className="text-slate-200">{device.technicianName}</strong>
                      </div>
                    </div>

                    {/* Financial Numbers Bar */}
                    <div className="mt-2 bg-[#0F172A] p-2.5 rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">المتفق عليه</span>
                        <strong className="text-white font-mono-num font-bold">{formatNumber(device.estimatedCost)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-400 block">الواصل/عربون</span>
                        <strong className="text-emerald-400 font-mono-num font-bold">{formatNumber(device.paidAmount)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-400 block">المتبقي</span>
                        <strong className="text-rose-400 font-mono-num font-bold">{formatNumber(device.remainingAmount)}</strong>
                      </div>
                    </div>

                    {/* Cost & Profit Info */}
                    {(device.profit !== undefined || device.actualCost !== undefined) && (
                      <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-indigo-950/30 border border-indigo-500/20 rounded-lg">
                        {device.actualCost !== undefined && (
                          <span className="text-slate-400">تكلفة قطع: <strong className="text-slate-200 font-mono-num">{formatNumber(device.actualCost)}</strong> ر.ي</span>
                        )}
                        {device.profit !== undefined && (
                          <span className="text-emerald-400 font-bold">فائدة/أجر يد: +<strong className="font-mono-num">{formatNumber(device.profit)}</strong> ر.ي</span>
                        )}
                      </div>
                    )}

                    {/* Image / Notes */}
                    {device.imageUrl && (
                      <div className="pt-1">
                        <button
                          onClick={() => openDocumentViewer(
                            `كرت صيانة #${device.ticketNumber}`,
                            `${device.deviceModel} - ${device.customerName}`,
                            device.imageUrl,
                            (url) => {
                              onUpdateDevices(devices.map(d => d.id === device.id ? { ...d, imageUrl: url } : d));
                            },
                            ticketMsg,
                            device.customerPhone
                          )}
                          className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg flex items-center gap-1.5 hover:bg-indigo-500/30 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>عرض صورة الجهاز / السند المرفق</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-slate-700/80 space-y-2">
                  
                  {/* Status Quick Updater Dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">تغيير الحالة:</span>
                    <select
                      value={device.status}
                      onChange={e => handleUpdateStatus(device, e.target.value as any)}
                      className="bg-[#0F172A] border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="قيد الفحص">قيد الفحص</option>
                      <option value="بانتظار قطع الغيار">بانتظار قطع الغيار</option>
                      <option value="جاري الصيانة">جاري الصيانة</option>
                      <option value="جاهز للتسليم">جاهز للتسليم</option>
                      <option value="تم التسليم والمحاسبة">تم التسليم والمحاسبة</option>
                      <option value="تمت المصادرة (تجاوز شهر)">تمت المصادرة (تجاوز شهر)</option>
                      <option value="ملغي / لم يصلح">ملغي / لم يصلح</option>
                    </select>
                  </div>

                  {/* Messaging & Call Buttons Grid */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    
                    {/* 1. Send Ticket */}
                    <button
                      onClick={() => openWhatsApp(device.customerPhone, ticketMsg)}
                      className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="إرسال سند وكرت الاستلام للزبون عبر واتساب"
                    >
                      <Send className="w-3 h-3" />
                      <span>سند الاستلام</span>
                    </button>

                    {/* 2. Send Ready Notification */}
                    <button
                      onClick={() => openWhatsApp(device.customerPhone, readyMsg)}
                      className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="إرسال إشعار جاهزية الجهاز للتسليم"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>إشعار جاهز</span>
                    </button>

                    {/* 3. Send 30-day storage warning */}
                    <button
                      onClick={() => openWhatsApp(device.customerPhone, warningMsg)}
                      className="p-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="إرسال إنذار وتنبيه شرط المصادرة (تجاوز شهر)"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>تنبيه شهر</span>
                    </button>

                  </div>

                  {/* Secondary Actions (Print, Camera, Edit, Delete) */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1">
                      {/* Print Ticket */}
                      <button
                        onClick={() => setPrintableTicket(device)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="طباعة كرت الاستلام الورقي"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Camera / Document */}
                      <button
                        onClick={() => openDocumentViewer(
                          `كرت صيانة #${device.ticketNumber}`,
                          `${device.deviceModel} - ${device.customerName}`,
                          device.imageUrl,
                          (url) => {
                            onUpdateDevices(devices.map(d => d.id === device.id ? { ...d, imageUrl: url } : d));
                          },
                          ticketMsg,
                          device.customerPhone
                        )}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                        title="إرفاق / عرض صورة الجهاز أو السند"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {/* Call Customer */}
                      {device.customerPhone && (
                        <a
                          href={`tel:${device.customerPhone}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                          title="اتصال بالزبون"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(device)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="تعديل بيانات الكرت"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Maintenance Device Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                <Wrench className="w-5 h-5" />
                <span>{editingDevice ? `تعديل كرت الصيانة #${editingDevice.ticketNumber}` : `إصدار كرت صيانة جديد #${nextTicketNumber}`}</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDevice} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Customer Name */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">اسم العميل / الزبون: *</label>
                  <input
                    type="text"
                    placeholder="مثال: يحيى القاضي، عبد الله أحمد..."
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">رقم هاتف العميل (واتساب): *</label>
                  <input
                    type="text"
                    placeholder="مثال: 772315106"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num text-sm focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Device Model */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">موديل ونوع الجهاز: *</label>
                  <input
                    type="text"
                    placeholder="مثال: ردمي نوت 11، سامسونج A32، آيفون 11..."
                    value={deviceModel}
                    onChange={e => setDeviceModel(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Service Type */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">نوع الخدمة / القسم:</label>
                  <select
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none font-semibold"
                  >
                    <option value="شاشات">شاشات وتاتش</option>
                    <option value="بيوت شحن وفلاتات">بيوت شحن وفلاتات</option>
                    <option value="آي سيات وتصليح">آي سيات وتصليح ماذر بورد</option>
                    <option value="برمجة وفورمات">برمجة وسوفتوير وفورمات</option>
                    <option value="تفعيل 4G/Volte">تفعيل 4G / Volte</option>
                    <option value="حسابات وتخطي">حسابات وتخطي FRP</option>
                    <option value="أخرى">صيانة وقطع أخرى</option>
                  </select>
                </div>

                {/* Color & Passcode */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">لون الجهاز (اختياري):</label>
                  <input
                    type="text"
                    placeholder="مثال: أزرق، أسود، فضي..."
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">رمز القفل / النمط (للفحص):</label>
                  <input
                    type="text"
                    placeholder="رمز الشاشة أو النمط"
                    value={passcode}
                    onChange={e => setPasscode(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Issue Description */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 font-semibold block mb-1">وصف المشكلة والعطل المطلوب إصلاحه: *</label>
                  <textarea
                    rows={2}
                    placeholder="مثال: كسر بالشاشة ولا توجد إضاءة، يحتاج شاشة أصلية مع فحص مدخل الشحن..."
                    value={issueDescription}
                    onChange={e => setIssueDescription(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Financial Fields */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">المبلغ المتفق عليه للإصلاح (ر.ي): *</label>
                  <input
                    type="number"
                    placeholder="إجمالي السعر للزبون"
                    value={estimatedCost}
                    onChange={e => {
                      setEstimatedCost(e.target.value);
                      if (actualCost !== '' && e.target.value !== '') {
                        setProfit(Math.max(0, (Number(e.target.value) || 0) - (Number(actualCost) || 0)).toString());
                      }
                    }}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold text-sm focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">العربون أو المدفوع مقدماً (ر.ي):</label>
                  <input
                    type="number"
                    placeholder="0 إن لم يدفع"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Cost & Profit Box */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-3 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl">
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">تكلفة قطع الغيار (ر.ي):</label>
                    <input
                      type="number"
                      placeholder="تكلفة الشاشة/القطعة"
                      value={actualCost}
                      onChange={e => {
                        setActualCost(e.target.value);
                        if (estimatedCost !== '' && e.target.value !== '') {
                          setProfit(Math.max(0, (Number(estimatedCost) || 0) - (Number(e.target.value) || 0)).toString());
                        }
                      }}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono-num text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-emerald-400 font-bold block mb-1">صافي الربح التقديري / أجر اليد:</label>
                    <input
                      type="number"
                      placeholder="الفائدة المقدرة (ر.ي)"
                      value={profit}
                      onChange={e => setProfit(e.target.value)}
                      className="w-full bg-[#0F172A] border border-emerald-500/40 rounded-xl px-3 py-1.5 text-emerald-400 font-mono-num font-bold text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Technician Assignment */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">الفني المستلم / المباشر:</label>
                  <select
                    value={technicianName}
                    onChange={e => setTechnicianName(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none font-semibold"
                  >
                    <option value="المهندس">المهندس (772315106)</option>
                    <option value="حمدان">حمدان</option>
                    <option value="عبد الغني">عبد الغني</option>
                  </select>
                </div>

                {/* Device Camera / Image Attachment */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">صورة الجهاز / السند الورقي:</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer bg-[#0F172A] hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-indigo-400 flex items-center justify-center gap-1.5 font-bold transition">
                      <Camera className="w-4 h-4" />
                      <span>{imageUrl ? 'تم إرفاق صورة (تغيير)' : 'التقاط أو اختيار صورة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImageUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl(undefined)}
                        className="p-2 bg-rose-500/20 text-rose-300 rounded-xl hover:bg-rose-500/30 cursor-pointer"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 font-semibold block mb-1">ملاحظات إضافية:</label>
                  <input
                    type="text"
                    placeholder="ملاحظات حول حالة الجرم، الخدوش، أو طلبات الزبون..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Policy Notice */}
                <div className="sm:col-span-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="text-amber-300 font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>تذكير السياسة والضوابط:</span>
                  </div>
                  <p>• {SHOP_POLICIES.maintenanceStorage}</p>
                  <p>• {SHOP_POLICIES.generalWarranty}</p>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  {editingDevice ? 'حفظ التعديلات' : 'إصدار وحفظ الكرت'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Printable Compact Mobile Ticket Voucher Modal */}
      {printableTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto" dir="rtl">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-[340px] sm:max-w-[380px] overflow-hidden shadow-2xl my-4 p-3.5 sm:p-4 border border-slate-300 print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print-thermal">
            
            {/* Header with App Logo */}
            <div className="text-center border-b border-dashed border-slate-400 pb-2.5">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AppLogo size="xs" />
                <span className="text-sm font-black text-slate-950 tracking-tight">نسمة نمو لخدمات الجوالات</span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold leading-tight">{SHOP_INFO.tagline}</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">{SHOP_INFO.location} • هاتف: {SHOP_INFO.engineerPhone}</p>
              
              {/* Ticket Badge */}
              <div className="mt-1.5 inline-flex items-center gap-1.5 bg-slate-950 text-white text-xs font-black px-3 py-0.5 rounded-full shadow-xs">
                <span>سند استلام صيانة</span>
                <span className="font-mono-num text-amber-400">#{printableTicket.ticketNumber}</span>
              </div>

              {/* Barcode Graphic */}
              <div className="mt-1.5 flex flex-col items-center justify-center">
                <div 
                  className="h-7 w-40 overflow-hidden flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: generateBarcodeSVG(`REP-${printableTicket.ticketNumber}-${printableTicket.customerPhone || '000'}`, 160, 28)
                  }}
                />
                <span className="text-[8px] font-mono-num text-slate-500 tracking-widest block">
                  *REP-{printableTicket.ticketNumber}*
                </span>
              </div>
            </div>

            {/* Ticket Info Grid (Ultra Compact for Mobile) */}
            <div className="py-2.5 space-y-2 text-[11px]">
              
              {/* Customer & Device Row */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[9px] block">العميل:</span>
                  <strong className="block text-slate-900 font-black truncate">{printableTicket.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] block">الهاتف:</span>
                  <strong className="block text-slate-900 font-bold font-mono-num text-[10px]">
                    {printableTicket.customerPhone || 'غير مسجل'}
                  </strong>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[9px]">الجهاز: </span>
                    <strong className="text-indigo-950 font-bold">{printableTicket.deviceModel} {printableTicket.color ? `(${printableTicket.color})` : ''}</strong>
                  </div>
                  {printableTicket.passcode && (
                    <div className="text-[10px] bg-amber-100 text-amber-900 font-mono-num font-bold px-1.5 py-0.5 rounded border border-amber-300">
                      قفل: {printableTicket.passcode}
                    </div>
                  )}
                </div>
              </div>

              {/* Problem / Service Description */}
              <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-200/80">
                <span className="text-indigo-900 text-[9px] font-bold block mb-0.5">العطل المطلوب فحصه وإصلاحه:</span>
                <p className="font-bold text-slate-900 leading-snug text-[10.5px]">{printableTicket.issueDescription}</p>
              </div>

              {/* Date & Technician */}
              <div className="flex items-center justify-between text-[9.5px] text-slate-600 px-1">
                <span>تاريخ الاستلام: <strong>{printableTicket.receivedDate} {printableTicket.receivedTime || ''}</strong></span>
                <span>المستلم: <strong>{printableTicket.technicianName || 'المهندس'}</strong></span>
              </div>

              {/* Financial Box (High Contrast) */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900 text-white p-2 rounded-xl text-center">
                <div>
                  <span className="text-slate-400 text-[8.5px] block leading-none">المتفق عليه</span>
                  <strong className="text-white font-black text-xs font-mono-num">{formatNumber(printableTicket.estimatedCost)}</strong>
                  <span className="text-[7.5px] text-slate-400 block">ر.ي</span>
                </div>
                <div className="border-x border-slate-700">
                  <span className="text-emerald-400 text-[8.5px] block leading-none">الواصل/عربون</span>
                  <strong className="text-emerald-400 font-black text-xs font-mono-num">{formatNumber(printableTicket.paidAmount)}</strong>
                  <span className="text-[7.5px] text-slate-400 block">ر.ي</span>
                </div>
                <div>
                  <span className="text-rose-300 text-[8.5px] block leading-none">المتبقي</span>
                  <strong className="text-rose-300 font-black text-xs font-mono-num">{formatNumber(printableTicket.remainingAmount)}</strong>
                  <span className="text-[7.5px] text-slate-400 block">ر.ي</span>
                </div>
              </div>

              {/* Policy & Terms (Compact Warning) */}
              <div className="text-[8.5px] text-slate-700 bg-amber-50/90 p-1.5 rounded-lg border border-amber-300 leading-tight space-y-0.5">
                <div className="text-amber-950 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>تنبيه وإخلاء مسؤولية مهم:</span>
                </div>
                <p>• {SHOP_POLICIES.maintenanceStorage}</p>
                <p>• {SHOP_POLICIES.generalWarranty}</p>
              </div>

              {/* Signature Line */}
              <div className="flex items-center justify-between pt-2 text-[9.5px] font-bold text-slate-700 border-t border-dashed border-slate-300">
                <div>توقيع المستلم: _______</div>
                <div>توقيع العميل: _______</div>
              </div>
            </div>

            {/* Modal Actions (No Print) */}
            <div className="pt-3 border-t border-slate-300 space-y-2 no-print">
              
              {/* Primary Buttons: Print & WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="print-maintenance-receipt-btn"
                  onClick={() => window.print()}
                  className="py-2 px-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition"
                  title="طباعة السند حرارياً أو حفظه PDF"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>طباعة حرارية 🖨️</span>
                </button>

                <button
                  id="send-whatsapp-receipt-btn"
                  onClick={() => {
                    const msg = buildMaintenanceTicketMessage(printableTicket);
                    openWhatsApp(printableTicket.customerPhone, msg);
                  }}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition"
                  title="إرسال سند الاستلام كرسالة واتساب مفصلة"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال واتساب 💬</span>
                </button>
              </div>

              {/* Secondary Buttons: SMS & Copy & Close */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const msg = buildMaintenanceTicketMessage(printableTicket);
                    openSMS(printableTicket.customerPhone, msg);
                  }}
                  className="flex-1 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                  title="إرسال رسالة نصية قصيرة SMS"
                >
                  <Smartphone className="w-3 h-3 text-sky-700" />
                  <span>رسالة SMS</span>
                </button>

                <button
                  onClick={() => {
                    const msg = buildMaintenanceTicketMessage(printableTicket);
                    navigator.clipboard.writeText(msg);
                    alert('تم نسخ تفاصيل السند إلى الحافظة بنجاح!');
                  }}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                  title="نسخ نص السند"
                >
                  <Copy className="w-3 h-3 text-slate-600" />
                  <span>نسخ النص</span>
                </button>

                <button
                  onClick={() => setPrintableTicket(null)}
                  className="py-1.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-bold cursor-pointer transition"
                >
                  إغلاق ✕
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Document Viewer & Uploader Modal */}
      <DocumentModal
        isOpen={documentModalData.isOpen}
        onClose={() => setDocumentModalData({ ...documentModalData, isOpen: false })}
        title={documentModalData.title}
        subtitle={documentModalData.subtitle}
        imageUrl={documentModalData.imageUrl}
        whatsappMessage={documentModalData.whatsappMessage}
        customerPhone={documentModalData.customerPhone}
        onSave={documentModalData.onSave}
      />

    </div>
  );
};
