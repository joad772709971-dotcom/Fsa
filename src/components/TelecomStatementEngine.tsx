import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Calendar,
  Filter,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Search,
  Layers,
  Copy,
  Check,
  RotateCcw,
  UserPlus,
  AlertCircle,
  Percent,
  Activity,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import {
  TelecomStatementRow,
  TelecomStatementFilter,
  TelecomOperator,
  TelecomOperationType,
  CustomerDebt,
} from '../types';
import {
  loadTelecomStatementRows,
  saveTelecomStatementRows,
  filterTelecomStatementRows,
  calculateTelecomStatementSummary,
  clearAllTelecomStatementRows,
} from '../utils/telecomStatementStorage';
import { findCatalogMatchForOperation } from '../utils/telecomCatalogStorage';
import { parseHadiStatementText } from '../utils/hadiStatementParser';
import { ConvertTelecomDebtModal } from './ConvertTelecomDebtModal';
import { getActiveStoreId, getActiveOwnerId } from '../utils/storage';
import { exportRechargeManagerToExcel } from '../utils/excelExport';
import { getApiBaseUrl } from '../utils/apkConfig';

export const TelecomStatementEngine: React.FC = () => {
  const [rows, setRows] = useState<TelecomStatementRow[]>([]);
  const [filter, setFilter] = useState<TelecomStatementFilter>({
    timePeriod: 'all',
    operator: 'all',
    operationType: 'all',
    status: 'all',
    searchQuery: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal for converting operation to debt
  const [selectedDebtRow, setSelectedDebtRow] = useState<TelecomStatementRow | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRows(loadTelecomStatementRows());
  }, []);

  const refreshRows = () => {
    setRows(loadTelecomStatementRows());
  };

  // Filtered rows and summary
  const filteredRows = useMemo(() => {
    return filterTelecomStatementRows(rows, filter);
  }, [rows, filter]);

  const summary = useMemo(() => {
    return calculateTelecomStatementSummary(filteredRows);
  }, [filteredRows]);

  // Handle PDF or text file upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setStatusMessage('جاري قراءة وتحليل كشف الحساب واستخراج العمليات عبر محرك الذكاء الاصطناعي...');
    setErrorMessage(null);

    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          await sendToGeminiParser(undefined, base64, 'application/pdf', file.name);
        };
        reader.readAsDataURL(file);
      } else {
        // Plain text or CSV
        const text = await file.text();
        // Try local regex parser first as fast pre-parser
        const localRows = parseHadiStatementText(text);
        if (localRows.length > 0) {
          const converted = localRows.map((r, idx) => {
            const match = findCatalogMatchForOperation(
              r.operator || 'yemen_mobile',
              r.packageName || r.description || '',
              r.amount
            );
            const cost = r.amount;
            const sellingPrice = match ? match.customerSellingPrice : Math.round(cost * 1.15);
            return {
              id: `hadi_loc_${Date.now()}_${idx}`,
              date: r.date,
              time: r.time || '12:00',
              operator: r.operator as TelecomOperator,
              operatorNameAr: r.operatorNameAr,
              operationType: (r.type === 'له' ? 'recharge_feed' : 'package_recharge') as TelecomOperationType,
              targetNumber: r.phone || '000000000',
              packageName: r.packageName || (match ? match.packageName : 'باقة رصيد'),
              amount: cost,
              sellingPrice,
              netProfit: sellingPrice - cost,
              balanceBefore: undefined,
              balanceAfter: r.balance,
              referenceId: r.operationId || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
              status: 'success' as const,
              sourceApp: 'الهادي أونلاين',
              notes: r.description,
              storeId: getActiveStoreId(),
              ownerId: getActiveOwnerId(),
            } as TelecomStatementRow;
          });
          saveTelecomStatementRows(converted);
          refreshRows();
        }
        await sendToGeminiParser(text, undefined, undefined, file.name);
      }
    } catch (err: any) {
      console.error('Failed to parse statement:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء معالجة الملف');
      setIsUploading(false);
    }
  };

  const sendToGeminiParser = async (
    rawText?: string,
    fileBase64?: string,
    mimeType?: string,
    fileName?: string
  ) => {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/gemini/parse-telecom-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          fileBase64,
          mimeType,
          sourceApp: fileName?.includes('هادي') ? 'الهادي أونلاين' : 'تطبيق خدمات سداد',
          storeId: getActiveStoreId(),
          ownerId: getActiveOwnerId(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل في تحليل كشف الحساب');
      }

      const data = await res.json();
      const rawOps = data.operations || data.rows || [];
      const extractedRows = rawOps.map((row: any, idx: number) => {
        // Match with pricing catalog to ensure accurate customer selling price and net profit
        const match = findCatalogMatchForOperation(
          row.operator || 'yemen_mobile',
          row.packageName || row.notes || row.description || '',
          Number(row.amount) || 0
        );

        const cost = Number(row.amount) || 0;
        const sellingPrice = match ? match.customerSellingPrice : Number(row.sellingPrice) || Math.round(cost * 1.15);
        const netProfit = sellingPrice - cost;

        return {
          id: `tel_row_${Date.now()}_${idx}`,
          date: row.date || new Date().toISOString().split('T')[0],
          time: row.time || '12:00',
          operator: (row.operator || 'yemen_mobile') as TelecomOperator,
          operatorNameAr: row.operatorNameAr || 'يمن موبايل',
          operationType: (row.operationType || 'package_recharge') as TelecomOperationType,
          targetNumber: row.targetNumber || row.phone || '000000000',
          packageName: row.packageName || (match ? match.packageName : 'باقة رصيد'),
          amount: cost,
          sellingPrice,
          netProfit,
          balanceBefore: Number(row.balanceBefore) || undefined,
          balanceAfter: Number(row.balanceAfter ?? row.balance) || undefined,
          referenceId: row.referenceId || row.operationId || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
          status: (row.status === 'failed' ? 'failed' : 'success') as 'success' | 'failed',
          sourceApp: data.sourceApp || 'الهادي أونلاين',
          notes: row.notes || row.description || '',
          storeId: getActiveStoreId(),
          ownerId: getActiveOwnerId(),
        } as TelecomStatementRow;
      });

      if (extractedRows.length > 0) {
        saveTelecomStatementRows(extractedRows);
        refreshRows();
        setStatusMessage('');
        alert(`✅ تم استخراج وحفظ ${extractedRows.length} عملية بنجاح ومطابقتها مع كتالوج التسعير.`);
      }
    } catch (err: any) {
      console.error('Parser error:', err);
      setErrorMessage(err.message || 'فشل في استخراج العمليات من الملف');
    } finally {
      setIsUploading(false);
    }
  };

  // Sample Yemeni Telecom Statement Loader (Al-Hadi Online simulator)
  const loadSampleAlhadiStatement = () => {
    const today = new Date().toISOString().split('T')[0];
    const sampleRows: TelecomStatementRow[] = [
      {
        id: `sample_1_${Date.now()}`,
        timestamp: `${today} 09:15:00`,
        date: today,
        time: '09:15',
        operator: 'yemen_mobile',
        operatorNameAr: 'يمن موبايل',
        operationType: 'package_yemen_mobile',
        targetNumber: '777412589',
        packageName: 'مزايا الشهرية 2500',
        amount: 2200,
        sellingPrice: 2500,
        netProfit: 300,
        balanceBefore: 45000,
        balanceAfter: 42800,
        referenceId: '8492014',
        status: 'success',
        sourceApp: 'الهادي أونلاين',
        notes: 'باقة مكالمات + 4G',
        storeId: getActiveStoreId(),
        ownerId: getActiveOwnerId(),
      },
      {
        id: `sample_2_${Date.now()}`,
        timestamp: `${today} 10:30:00`,
        date: today,
        time: '10:30',
        operator: 'yemen4g',
        operatorNameAr: 'يمن فورجي 4G',
        operationType: 'package_yemen4g',
        targetNumber: '10238491',
        packageName: 'يمن فورجي 40 جيجا',
        amount: 4000,
        sellingPrice: 4500,
        netProfit: 500,
        balanceBefore: 42800,
        balanceAfter: 38800,
        referenceId: '8492022',
        status: 'success',
        sourceApp: 'الهادي أونلاين',
        notes: 'تجديد مودم فورجي منزلي',
        storeId: getActiveStoreId(),
        ownerId: getActiveOwnerId(),
      },
      {
        id: `sample_3_${Date.now()}`,
        timestamp: `${today} 11:45:00`,
        date: today,
        time: '11:45',
        operator: 'you',
        operatorNameAr: 'يو YOU',
        operationType: 'package_you',
        targetNumber: '733984125',
        packageName: 'سمارت نت 3 جيجا',
        amount: 1400,
        sellingPrice: 1600,
        netProfit: 200,
        balanceBefore: 38800,
        balanceAfter: 37400,
        referenceId: '8492039',
        status: 'success',
        sourceApp: 'الهادي أونلاين',
        notes: 'باقة إنترنت أسبوعية',
        storeId: getActiveStoreId(),
        ownerId: getActiveOwnerId(),
      },
      {
        id: `sample_4_${Date.now()}`,
        timestamp: `${today} 13:10:00`,
        date: today,
        time: '13:10',
        operator: 'sabafon',
        operatorNameAr: 'سبأفون',
        operationType: 'package_sabafon',
        targetNumber: '711234567',
        packageName: 'رصيد فوري مباشر',
        amount: 1000,
        sellingPrice: 1100,
        netProfit: 100,
        balanceBefore: 37400,
        balanceAfter: 36400,
        referenceId: '8492045',
        status: 'success',
        sourceApp: 'الهادي أونلاين',
        notes: 'شحن رصيد نقدي',
        storeId: getActiveStoreId(),
        ownerId: getActiveOwnerId(),
      },
      {
        id: `sample_5_${Date.now()}`,
        timestamp: `${today} 14:20:00`,
        date: today,
        time: '14:20',
        operator: 'adsl_landline',
        operatorNameAr: 'الهاتف الثابت والنت',
        operationType: 'bill_payment',
        targetNumber: '01234567',
        packageName: 'سداد فاتورة هاتف ارضي',
        amount: 2500,
        sellingPrice: 2800,
        netProfit: 300,
        balanceBefore: 36400,
        balanceAfter: 33900,
        referenceId: '8492060',
        status: 'success',
        sourceApp: 'الهادي أونلاين',
        notes: 'سداد فواتير يمن نت',
        storeId: getActiveStoreId(),
        ownerId: getActiveOwnerId(),
      },
      {
        id: `sample_6_${Date.now()}`,
        timestamp: `${today} 16:05:00`,
        date: today,
        time: '16:05',
        operator: 'yemen_mobile',
        operatorNameAr: 'يمن موبايل',
        operationType: 'package_yemen_mobile',
        targetNumber: '771239844',
        packageName: 'باقة هدايا 1000',
        amount: 880,
        sellingPrice: 1000,
        netProfit: 120,
        balanceBefore: 33900,
        balanceAfter: 33020,
        referenceId: '8492078',
        status: 'success',
        sourceApp: 'الهادي أونلاين',
        notes: 'باقة توفير',
        storeId: getActiveStoreId(),
        ownerId: getActiveOwnerId(),
      },
    ];

    saveTelecomStatementRows(sampleRows);
    refreshRows();
    alert('✅ تم تحميل كشف عمليات نموذجي لشبكة الهادي أونلاين بنجاح.');
  };

  const handleCopyNumber = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportExcel = () => {
    const exportData = filteredRows.map((r) => ({
      التاريخ: r.date,
      الوقت: r.time,
      الشبكة: r.operatorNameAr,
      النوع: r.packageName || r.operationType,
      'الرقم المسدد له': r.targetNumber,
      'تكلفة الشراء': r.amount,
      'سعر البيع': r.sellingPrice,
      'صافي الربح': r.netProfit,
      المرجع: r.referenceId,
      الحالة: r.status === 'success' ? 'ناجحة' : 'فاشلة',
      'دين عميل': r.isDebt ? `نعم (${r.customerName})` : 'لا',
      ملاحظات: r.notes || '',
    }));
    exportRechargeManagerToExcel(exportData, `كشف_عمليات_السداد_${filter.timePeriod}.xlsx`);
  };

  const handleClearAll = () => {
    if (confirm('هل تريد مسح جميع عمليات كشوفات السداد؟')) {
      clearAllTelecomStatementRows();
      refreshRows();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-l from-blue-700 via-sky-700 to-slate-900 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sky-200">
            <Activity className="h-5 w-5" />
            <span className="text-xs font-bold tracking-wider uppercase">
              محرك الذكاء الاصطناعي لكشوفات السداد والشبكات
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black">
            معالج تقارير السداد وكشوفات الـ PDF (Balance & Telecom Engine)
          </h1>
          <p className="mt-1 max-w-xl text-xs text-sky-100">
            تحليل وتصنيف كشوفات السداد والرصيد لتطبيقات الشحن (الهادي أونلاين، تطبيق الرقم، يمن موبايل)، وحساب أرباح كل شبكة
            وباقة، مع إمكانية تحويل أي عملية إلى دين مباشر على حساب العميل.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.PDF,application/pdf,.csv,.txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <button
            type="button"
            onClick={loadSampleAlhadiStatement}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20"
          >
            <Sparkles className="h-4 w-4" /> كشف تجريبي (الهادي)
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-blue-900 shadow-md hover:bg-blue-50 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'جاري التحليل...' : 'رفع كشف PDF / نصي'}
          </button>
        </div>
      </div>

      {/* Processing Indicator */}
      {isUploading && (
        <div className="flex items-center gap-3 rounded-2xl border border-sky-300 bg-sky-50 p-4 text-xs font-bold text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Financial KPIs & Analytics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">إجمالي العمليات</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalCount} <span className="text-xs font-normal text-slate-400">عملية</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            تكلفة الشراء من التطبيق
          </span>
          <p className="mt-1 text-xl font-extrabold text-slate-700 dark:text-slate-300">
            {summary.totalAmount.toLocaleString()} <span className="text-xs font-normal">ر.ي</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            إجمالي مبيعات التحصيل
          </span>
          <p className="mt-1 text-xl font-extrabold text-blue-600 dark:text-blue-400">
            {summary.totalSellingPrice.toLocaleString()} <span className="text-xs font-normal">ر.ي</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            صافي أرباح العمليات
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            +{summary.totalNetProfit.toLocaleString()} <span className="text-xs font-normal">ر.ي</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">هامش الربح المتوسط</span>
          <p className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {summary.profitMarginPercentage}%
          </p>
        </div>
      </div>

      {/* Filter Control Bar: Time Periods & Operators */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Time Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
              <Calendar className="h-3.5 w-3.5" /> الفترة:
            </span>
            <button
              type="button"
              onClick={() => setFilter({ ...filter, timePeriod: 'today' })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filter.timePeriod === 'today'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => setFilter({ ...filter, timePeriod: 'month' })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filter.timePeriod === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => setFilter({ ...filter, timePeriod: 'year' })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filter.timePeriod === 'year'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              هذه السنة
            </button>
            <button
              type="button"
              onClick={() => setFilter({ ...filter, timePeriod: 'all' })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filter.timePeriod === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setFilter({ ...filter, timePeriod: 'custom' })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filter.timePeriod === 'custom'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              مخصص
            </button>
          </div>

          {/* Export & Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredRows.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Download className="h-3.5 w-3.5" /> تصدير إكسل
            </button>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1 rounded-xl p-2 text-xs font-bold text-slate-400 hover:text-rose-600"
                title="مسح العمليات"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Inputs if active */}
        {filter.timePeriod === 'custom' && (
          <div className="flex items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">من:</span>
              <input
                type="date"
                value={filter.customStartDate || ''}
                onChange={(e) => setFilter({ ...filter, customStartDate: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">إلى:</span>
              <input
                type="date"
                value={filter.customEndDate || ''}
                onChange={(e) => setFilter({ ...filter, customEndDate: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
        )}

        {/* Operator & Type Dropdowns + Search */}
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-4">
          <select
            value={filter.operator || 'all'}
            onChange={(e) => setFilter({ ...filter, operator: e.target.value as any })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">جميع الشبكات</option>
            <option value="yemen_mobile">يمن موبايل</option>
            <option value="yemen4g">يمن فورجي 4G</option>
            <option value="you">يو YOU (MTN)</option>
            <option value="sabafon">سبأفون</option>
            <option value="adsl_landline">الهاتف والنت</option>
          </select>

          <select
            value={filter.operationType || 'all'}
            onChange={(e) => setFilter({ ...filter, operationType: e.target.value as any })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">جميع أنواع العمليات</option>
            <option value="package_recharge">شحن باقات</option>
            <option value="direct_balance">رصيد عادي مباشر</option>
            <option value="bill_payment">سداد فواتير</option>
            <option value="topup">تغذية رصيد</option>
          </select>

          <select
            value={filter.status || 'all'}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">الحالة (الكل)</option>
            <option value="success">ناجحة فقط</option>
            <option value="failed">فاشلة فقط</option>
          </select>

          <div className="relative">
            <Search className="absolute top-2 right-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الهاتف أو المرجع..."
              value={filter.searchQuery || ''}
              onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
              <tr>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">الشبكة</th>
                <th className="p-3">الرقم المسدد له</th>
                <th className="p-3">البيان / اسم الباقة</th>
                <th className="p-3">سعر التكلفة</th>
                <th className="p-3">سعر البيع</th>
                <th className="p-3">صافي الربح</th>
                <th className="p-3">رقم المرجع</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">تحويل لدين عميل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد عمليات سداد مسجلة تطابق الفلتر الحالي. قم برفع كشف حساب أو تجربة الكشف النموذجي.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const operatorBadgeClass =
                    row.operator === 'yemen_mobile'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      : row.operator === 'yemen4g'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      : row.operator === 'you'
                      ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400'
                      : row.operator === 'sabafon'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-500 font-medium">
                        {row.date} <span className="text-[10px] text-slate-400">{row.time}</span>
                      </td>

                      <td className="p-3">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${operatorBadgeClass}`}>
                          {row.operatorNameAr}
                        </span>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1">
                          <span>{row.targetNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyNumber(row.targetNumber, row.id)}
                            className="rounded p-1 text-slate-400 hover:text-slate-700"
                            title="نسخ الرقم"
                          >
                            {copiedId === row.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="p-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {row.packageName || 'عملية رصيد'}
                        </p>
                        {row.notes && <span className="text-[10px] text-slate-400">{row.notes}</span>}
                      </td>

                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        {row.amount.toLocaleString()} ر.ي
                      </td>

                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {row.sellingPrice.toLocaleString()} ر.ي
                      </td>

                      <td className="p-3">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          +{row.netProfit.toLocaleString()} ر.ي
                        </span>
                      </td>

                      <td className="p-3 font-mono text-slate-400">{row.referenceId}</td>

                      <td className="p-3">
                        {row.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> ناجحة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <XCircle className="h-3.5 w-3.5" /> فاشلة
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {row.isDebt ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            <CreditCard className="h-3 w-3" /> دين: {row.customerName}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedDebtRow(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50/60 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                          >
                            <CreditCard className="h-3 w-3" /> تحويل لدين
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convert Telecom Row to Debt Modal */}
      {selectedDebtRow && (
        <ConvertTelecomDebtModal
          isOpen={!!selectedDebtRow}
          row={selectedDebtRow}
          onClose={() => setSelectedDebtRow(null)}
          onSuccess={(customer) => {
            refreshRows();
            setSelectedDebtRow(null);
            alert(`✅ تم تحويل العملية إلى دين على العميل [${customer.name}] بنجاح.`);
          }}
        />
      )}
    </div>
  );
};
