import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  Copy,
  CheckCircle2,
  Eye,
  EyeOff,
  Cpu,
  Fingerprint,
  FileWarning,
  Activity,
  Layers,
  ArrowUpDown,
  Search,
  Check,
} from 'lucide-react';
import {
  Transaction,
  InventoryItem,
  Supplier,
  CustomerDebt,
  MaintenanceTicket,
  AuthUser,
  ForensicAuditReport,
  ForensicFinding,
  OwnerAuditAlert,
} from '../types';
import {
  ForensicAuditorService,
  CURRENT_STORE_ID,
} from '../services/forensicAuditorService';
import { formatCurrency } from '../utils/calculations';
import { MASTER_PASSWORD } from './LoginView';
import * as XLSX from 'xlsx';

interface ForensicAuditorViewProps {
  transactions: Transaction[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  customers?: CustomerDebt[];
  tickets?: MaintenanceTicket[];
  currentUser: AuthUser | null;
  onNavigateToTab?: (tab: any) => void;
}

export const ForensicAuditorView: React.FC<ForensicAuditorViewProps> = ({
  transactions,
  inventory,
  suppliers,
  customers = [],
  tickets = [],
  currentUser,
}) => {
  const [auditNonce, setAuditNonce] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'owner_channel' | 'math_invoices' | 'tenant_isolation' | 'certificate'>('owner_channel');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCert, setCopiedCert] = useState<boolean>(false);

  // Owner confidential channel access control
  const [ownerUnlocked, setOwnerUnlocked] = useState<boolean>(() => {
    return currentUser?.role === 'owner';
  });
  const [ownerPinInput, setOwnerPinInput] = useState<string>('');
  const [ownerPinError, setOwnerPinError] = useState<string>('');
  const [simulatedBreachActive, setSimulatedBreachActive] = useState<boolean>(false);

  // Re-run audit when dependencies or nonce changes
  const auditReport: ForensicAuditReport = useMemo(() => {
    // If simulation active, include a mock external store transaction to demonstrate immediate detection & isolation
    const dataset = simulatedBreachActive
      ? [
          {
            id: 'mock_breach_tx_external_99',
            date: '2026-09-08',
            time: '18:45',
            type: 'sale' as const,
            category: 'phones' as const,
            description: 'محاولة تسريب عملية من متجر خارجي غير معتمد (متجر الأمانة)',
            price: 45000,
            cost: 40000,
            profit: 5000,
            storeId: 'store_external_alien_breach',
            ownerId: 'user_alien_attacker',
          },
          ...transactions,
        ]
      : transactions;

    return ForensicAuditorService.runFullForensicAudit({
      transactions: dataset,
      inventory,
      suppliers,
      customers,
      tickets,
      activeStoreId: CURRENT_STORE_ID,
      currentUser,
    });
  }, [transactions, inventory, suppliers, customers, tickets, currentUser, auditNonce, simulatedBreachActive]);

  // Load confidential owner alerts
  const [ownerAlerts, setOwnerAlerts] = useState<ReadonlyArray<OwnerAuditAlert>>([]);

  useEffect(() => {
    if (ownerUnlocked) {
      setOwnerAlerts(ForensicAuditorService.getOwnerAuditAlerts(currentUser));
    }
  }, [ownerUnlocked, auditReport, currentUser]);

  const handleManualScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setAuditNonce((v) => v + 1);
      setIsScanning(false);
    }, 450);
  };

  const handleUnlockOwnerChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerPinInput === MASTER_PASSWORD || ownerPinInput === '772315106') {
      setOwnerUnlocked(true);
      setOwnerPinError('');
    } else {
      setOwnerPinError('رمز المالك غير صحيح. المصادقة مطلوبة للوصول للقناة السرية.');
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    ForensicAuditorService.acknowledgeOwnerAlert(alertId, currentUser);
    setOwnerAlerts(ForensicAuditorService.getOwnerAuditAlerts(currentUser));
  };

  const certificateText = useMemo(() => {
    return ForensicAuditorService.generateOfficialAuditCertificate(auditReport);
  }, [auditReport]);

  const handleCopyCertificate = () => {
    navigator.clipboard.writeText(certificateText);
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2500);
  };

  const handlePrintCertificate = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <title>شهادة التدقيق الجنائي المحاسبي المستقل</title>
          <style>
            body { font-family: 'Cairo', system-ui, sans-serif; padding: 30px; line-height: 1.6; color: #0f172a; }
            pre { font-family: 'Courier New', monospace; white-space: pre-wrap; font-size: 13px; background: #f8fafc; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 5px; }
            .badge { display: inline-block; background: #0284c7; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>جمهورية اليمن - نظام الرقم الأول المحاسبي</h1>
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge">تقرير التدقيق الجنائي المستقل (Read-Only Certified)</span>
          </div>
          <pre>${certificateText}</pre>
          <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleExportXLSX = () => {
    try {
      const summarySheet = [
        { البند: 'رقم التقرير', القيمة: auditReport.reportId },
        { البند: 'تاريخ الفحص', القيمة: auditReport.generatedAt },
        { البند: 'معرف المتجر النشط', القيمة: auditReport.activeStoreId },
        { البند: 'حالة القراءة فقط', القيمة: 'صارمة 100% (Read-Only Enforced)' },
        { البند: 'إجمالي السجلات المفحوصة', القيمة: auditReport.tenantIsolation.totalScannedRecords },
        { البند: 'السجلات المطابقة لمتجر مصعب', القيمة: auditReport.tenantIsolation.matchingRecordsCount },
        { البند: 'خروقات العزل الأجنبية المعزولة', القيمة: auditReport.tenantIsolation.breachCount },
        { البند: 'فواتير المبيعات المدققة رياضياً', القيمة: auditReport.mathIntegrity.salesInvoicesAudited },
        { البند: 'تضاربات العمليات الحسابية', القيمة: auditReport.mathIntegrity.mathMismatchesCount },
        { البند: 'تضاربات حساب الأرباح', القيمة: auditReport.mathIntegrity.profitMismatchesCount },
        { البند: 'نسبة الدقة الرياضية', القيمة: `${auditReport.mathIntegrity.accuracyRatePercentage}%` },
        { البند: 'إجمالي الفوارق المحاسبية', القيمة: `${auditReport.mathIntegrity.totalDiscrepancySum} ر.ي` },
      ];

      const findingsSheet = auditReport.findings.map((f) => ({
        معرف_الملاحظة: f.id,
        التصنيف: f.category,
        الخطورة: f.severity,
        العنوان: f.title,
        معرف_السجل: f.affectedEntityId,
        نوع_السجل: f.entityType,
        المبلغ_الفعلي: f.actualAmount || 0,
        المبلغ_المتوقع: f.expectedAmount || 0,
        الفارق: f.discrepancyAmount || 0,
        معزول_برمجياً: f.isIsolated ? 'نعم (Quarantined)' : 'لا',
        التفاصيل: f.technicalDetails,
        التوجيه_المحاسبي: f.remediationGuidance,
      }));

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summarySheet);
      const wsFindings = XLSX.utils.json_to_sheet(findingsSheet);

      XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص التدقيق الجنائي');
      XLSX.utils.book_append_sheet(wb, wsFindings, 'سجل الملاحظات والتنبيهات');

      XLSX.writeFile(wb, `تقرير_التدقيق_الجنائي_${auditReport.reportId}.xlsx`);
    } catch (e) {
      console.error('Failed to export XLSX', e);
    }
  };

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return auditReport.findings.filter((f) => {
      if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.affectedEntityId.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditReport.findings, selectedSeverity, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Strict Read-Only Certification */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 rounded-2xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                وحدة التدقيق الجنائي المحاسبي المستقلة
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                Read-Only Enforcement: صارم
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                v{auditReport.auditorVersion}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              محرك تدقيق محاسبي رقابي مستقل يعمل على فحص ومراقبة البيانات واكتشاف الأخطاء الحسابية وتضارب الأرصدة وعزل أي سجلات أجنبية برمجياً دون امتلاك أي صلاحية للتعديل أو الحذف الآلي.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleManualScan}
              disabled={isScanning}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'جاري الفحص الجنائي...' : 'فحص شامل فوري'}</span>
            </button>
            <button
              onClick={handlePrintCertificate}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="طباعة شهادة التدقيق الجنائي"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">طباعة الشهادة</span>
            </button>
            <button
              onClick={handleExportXLSX}
              className="px-3 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border border-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="تصدير إلى إكسل"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Read-Only Mandate Notice Banner */}
        <div className="mt-4 pt-3 border-t border-indigo-900/60 flex items-center gap-2 text-xs text-indigo-200 bg-indigo-950/40 px-3 py-2 rounded-xl border border-indigo-500/20">
          <Fingerprint className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>العهد الرقابي الصارم:</strong> لا يتم تزويد الذكاء الاصطناعي أو المدقق بأي دوال تعديل أو حذف. حركات وأسعار المنشأة محفوظة بعزل تام، ويتم توجيه تقارير التناقضات لقناة المالك مباشرة.
          </span>
        </div>
      </div>

      {/* 2. Key Forensic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tenant Isolation Status */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">العزل الأمني للمتجر</span>
            <span className={`p-1.5 rounded-lg ${auditReport.tenantIsolation.isCompliant ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {auditReport.tenantIsolation.isCompliant ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">
              {auditReport.tenantIsolation.isCompliant ? '100% سليم' : `${auditReport.tenantIsolation.breachCount} خرق`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({auditReport.tenantIsolation.matchingRecordsCount} مطابقة)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>المتجر:</span>
            <span className="font-mono font-semibold text-indigo-600 truncate max-w-[130px]">{auditReport.activeStoreId}</span>
          </div>
          {auditReport.tenantIsolation.quarantinedCount > 0 && (
            <div className="mt-1.5 py-0.5 px-2 bg-rose-50 text-rose-700 rounded text-[10px] font-bold">
              🛡️ تم عزل {auditReport.tenantIsolation.quarantinedCount} سجلات أجنبية برمجياً
            </div>
          )}
        </div>

        {/* Math Integrity & Accuracy */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">سلامة الفواتير الرياضية</span>
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-blue-700 font-mono">
              {auditReport.mathIntegrity.accuracyRatePercentage}%
            </span>
            <span className="text-[10px] text-slate-400">دقة حسابية</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>فواتير مفحوصة:</span>
            <span className="font-bold text-slate-700 font-mono">{auditReport.mathIntegrity.salesInvoicesAudited} فاتورة</span>
          </div>
        </div>

        {/* Discrepancy Amount */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">الفوارق والتضارب المحاسبي</span>
            <span className={`p-1.5 rounded-lg ${auditReport.mathIntegrity.totalDiscrepancySum > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <ArrowUpDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-800 font-mono">
              {formatCurrency(auditReport.mathIntegrity.totalDiscrepancySum)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>فوارق الأرباح:</span>
            <span className="font-bold text-slate-700 font-mono">{auditReport.mathIntegrity.profitMismatchesCount} حالات</span>
          </div>
        </div>

        {/* Owner Confidential Alerts Count */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">قناة تبليغ المالك</span>
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-indigo-900 font-mono">
              {auditReport.findings.length}
            </span>
            <span className="text-[10px] text-slate-400">تنبيهات تدقيق</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>حالات حرجة:</span>
            <span className={`font-bold font-mono ${auditReport.criticalAlertsCount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
              {auditReport.criticalAlertsCount} حرج
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('owner_channel')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'owner_channel'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>قناة تبليغ المالك المباشرة</span>
          {auditReport.criticalAlertsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
              {auditReport.criticalAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('math_invoices')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'math_invoices'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>سلامة فواتير المبيعات والحسابات ({auditReport.mathIntegrity.salesInvoicesAudited})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tenant_isolation')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'tenant_isolation'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>رادار العزل الأمني للمتجر</span>
        </button>

        <button
          onClick={() => setActiveSubTab('certificate')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'certificate'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5" />
          <span>شهادة التدقيق الرسمية والتقرير</span>
        </button>
      </div>

      {/* 4. Tab 1: Confidential Owner Channel */}
      {activeSubTab === 'owner_channel' && (
        <div className="space-y-4">
          {!ownerUnlocked ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                قناة سرية ومحمية للمالك الإداري الرئيسي
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                تقارير التدقيق والأخطاء تُرسل وتُحفظ في هذه القناة المباشرة للمالك فقط. يرجى إدخال رمز المالك لفك التشفير واستعراض المعرفات والمبالغ المتأثرة.
              </p>

              <form onSubmit={handleUnlockOwnerChannel} className="space-y-3 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز مرور المالك الإداري:</label>
                  <input
                    type="password"
                    value={ownerPinInput}
                    onChange={(e) => {
                      setOwnerPinInput(e.target.value);
                      setOwnerPinError('');
                    }}
                    placeholder="أدخل رمز المالك (Master PIN)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  {ownerPinError && <p className="text-[11px] text-rose-600 mt-1">{ownerPinError}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  فتح القناة السرية للمالك 🔓
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Channel Status Header */}
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold text-indigo-950">قناة المالك المباشرة النشطة:</span>
                  <span className="text-indigo-800">مصعب الصوفي (حساب المالك الرئيسي)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-200/80 text-indigo-900 font-mono font-semibold">
                    {ownerAlerts.length} تنبيه مسجل
                  </span>
                  <button
                    onClick={() => setOwnerUnlocked(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    قفل القناة 🔒
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في التنبيهات أو المعرفات..."
                    className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedSeverity === sev
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {sev === 'all'
                        ? 'الكل'
                        : sev === 'CRITICAL'
                        ? 'حرج 🔴'
                        : sev === 'HIGH'
                        ? 'عالي 🟠'
                        : sev === 'MEDIUM'
                        ? 'متوسط 🟡'
                        : 'معلومات ℹ️'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Findings & Alerts List */}
              {filteredFindings.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">كافة السجلات سليمة وخالية من التناقضات</h4>
                  <p className="text-xs text-slate-400 mt-1">لم يتم رصد أي تضارب حسابي أو خرق لعزل المتجر في نطاق البحث الحالي.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className={`p-3.5 rounded-xl border bg-white shadow-xs transition-all ${
                        finding.severity === 'CRITICAL'
                          ? 'border-rose-300 bg-rose-50/20'
                          : finding.severity === 'HIGH'
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                finding.severity === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : finding.severity === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {finding.severity}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                              {finding.category}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">{finding.title}</h4>
                            {finding.isIsolated && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-600 text-white">
                                معزول برمجياً 🛡️
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed">{finding.description}</p>

                          {finding.entityDescription && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 font-mono">
                              <strong>السجل: </strong> {finding.entityDescription}
                            </div>
                          )}

                          <div className="text-[11px] text-indigo-900 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100 flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>التوجيه الإرشادي: </strong> {finding.remediationGuidance}
                            </span>
                          </div>
                        </div>

                        {/* Affected Amounts & Details */}
                        <div className="text-left sm:text-right shrink-0 bg-slate-50 p-2 rounded-lg border border-slate-200 sm:min-w-[170px]">
                          <div className="text-[10px] text-slate-400 font-mono">معرف: {finding.affectedEntityId}</div>
                          {finding.actualAmount !== undefined && (
                            <div className="text-xs text-slate-700 font-bold mt-0.5">
                              المسجل: <span className="font-mono text-slate-900">{formatCurrency(finding.actualAmount)}</span>
                            </div>
                          )}
                          {finding.expectedAmount !== undefined && (
                            <div className="text-[11px] text-slate-500">
                              المفترض: <span className="font-mono">{formatCurrency(finding.expectedAmount)}</span>
                            </div>
                          )}
                          {finding.discrepancyAmount !== undefined && finding.discrepancyAmount > 0 && (
                            <div className="text-[11px] font-bold text-rose-700 mt-0.5">
                              الفارق: <span className="font-mono">{formatCurrency(finding.discrepancyAmount)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Sales Math Integrity (فواتير المبيعات) */}
      {activeSubTab === 'math_invoices' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              <span>مراجعة سلامة فواتير المبيعات (Strict Sales Invoices Math)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              يقوم المدقق بفحص كافة فواتير المبيعات والإكسسوارات والجوالات والتأكد من مطابقة معادلة الفاتورة: (الكميات × السعر - الخصم = الإجمالي النهائي) ومقارنة (السعر - التكلفة = صافي الربح).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] font-bold text-blue-800">إجمالي الفواتير المفحوصة</span>
                <div className="text-xl font-black text-blue-900 font-mono mt-1">
                  {auditReport.mathIntegrity.salesInvoicesAudited}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800">الفواتير المتطابقة رياضياً</span>
                <div className="text-xl font-black text-emerald-900 font-mono mt-1">
                  {auditReport.mathIntegrity.salesInvoicesAudited - auditReport.mathIntegrity.mathMismatchesCount}
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-bold text-amber-800">فواتير بها فوارق أرباح أو تسعير</span>
                <div className="text-xl font-black text-amber-900 font-mono mt-1">
                  {auditReport.mathIntegrity.profitMismatchesCount}
                </div>
              </div>
            </div>

            {/* Table of Sales Samples & Verifications */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="p-2 font-bold">التاريخ</th>
                    <th className="p-2 font-bold">البيان والصنف</th>
                    <th className="p-2 font-bold">الكمية</th>
                    <th className="p-2 font-bold">سعر البيع</th>
                    <th className="p-2 font-bold">التكلفة</th>
                    <th className="p-2 font-bold">الربح المسجل</th>
                    <th className="p-2 font-bold">المعادلة الرياضية</th>
                    <th className="p-2 font-bold text-center">حالة التدقيق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions
                    .filter((t) => t.type === 'sale' || t.category === 'accessories' || t.category === 'phones')
                    .slice(0, 25)
                    .map((tx) => {
                      const expectedProfit = tx.price - tx.cost;
                      const isMatch = Math.abs(expectedProfit - tx.profit) <= 1.0;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 font-mono text-slate-500 whitespace-nowrap">{tx.date}</td>
                          <td className="p-2 font-medium text-slate-800 max-w-[200px] truncate">{tx.description}</td>
                          <td className="p-2 font-mono text-slate-700">{tx.quantity || 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-900">{formatCurrency(tx.price)}</td>
                          <td className="p-2 font-mono text-slate-600">{formatCurrency(tx.cost)}</td>
                          <td className="p-2 font-mono font-bold text-emerald-600">{formatCurrency(tx.profit)}</td>
                          <td className="p-2 font-mono text-[11px] text-slate-500">
                            {tx.price} - {tx.cost} = {expectedProfit}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            {isMatch ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✅ سليم
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                ⚠️ فارق {Math.abs(expectedProfit - tx.profit)} ر.ي
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Tenant & Store Integrity (العزل الأمني) */}
      {activeSubTab === 'tenant_isolation' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>محرك العزل الأمني الرياضي (Tenant Isolation Engine)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  يضمن هذا المحرك أن كافة الحسابات والأصناف والتسعيرات ملك حصري لـ ({CURRENT_STORE_ID}).
                </p>
              </div>

              {/* Stress Test Simulation Button */}
              <button
                onClick={() => setSimulatedBreachActive((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  simulatedBreachActive
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                }`}
              >
                <FileWarning className="w-3.5 h-3.5" />
                <span>
                  {simulatedBreachActive ? 'إلغاء تجربة الاختراق (نشط ⚠️)' : 'تجربة محاكاة تسريب عملية غريبة'}
                </span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">معرف المتجر النشط:</span>
                <span className="font-mono bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-bold">
                  {CURRENT_STORE_ID}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">مالك المتجر المعتمد:</span>
                <span className="font-mono text-slate-800">مصعب الصوفي (user_mosaab)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">سياسة التعامل مع العمليات الأجنبية:</span>
                <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  عزل فوري (ISOLATION_BREACH) واستبعاد تام من الصندوق
                </span>
              </div>
            </div>

            {simulatedBreachActive && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs space-y-1 text-rose-950">
                <div className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>تم رصد خرق عزل أمني فوري في المحاكاة (ISOLATION_BREACH)</span>
                </div>
                <p>
                  تم حقن عملية تحمل storeId = "store_external_alien_breach". قام محرك التدقيق الجنائي بعزلها فوراً ومنع تسرب الـ 45,000 ر.ي إلى خزينة مصعب، وتم تصعيد إشعار عاجل إلى قناة المالك السرية.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Tab 4: Official Certificate */}
      {activeSubTab === 'certificate' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div>
                <h3 className="font-bold text-sm text-slate-900">شهادة التدقيق الجنائي المحاسبي المعتمدة</h3>
                <p className="text-xs text-slate-500">
                  وثيقة إلكترونية رسمية متضمنة البصمة الرقمية المشفرة ونتائج الفحص الكاملة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCertificate}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCert ? 'تم النسخ ✅' : 'نسخ النص'}</span>
                </button>
                <button
                  onClick={handlePrintCertificate}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الشهادة</span>
                </button>
              </div>
            </div>

            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] sm:text-xs overflow-x-auto whitespace-pre-wrap border border-slate-800 leading-relaxed">
              {certificateText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
