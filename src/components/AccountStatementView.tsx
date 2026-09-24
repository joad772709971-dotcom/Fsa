import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  UserCheck,
  Calendar,
  Download,
  Printer,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  DollarSign,
  Layers,
  ChevronDown,
  Building,
  User,
  Wrench,
  Truck,
  Signal,
  CreditCard,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { printHtmlElement } from '../utils/printHelper';
import { isCompoundDescription, parseCompoundItems } from '../utils/itemBreakdown';
import { downloadExcelWorkbook, downloadHtmlReport } from '../utils/fileExportHelper';
import { getTodayDateString, getCurrentMonthString, getCurrentMonthFirstDayString } from '../utils/dateHelper';

interface AccountStatementViewProps {
  transactions: Transaction[];
}

type PartyCategory =
  | 'owner_mosaab'
  | 'engineer'
  | 'worker'
  | 'supplier_absari'
  | 'supplier_qasemi'
  | 'supplier_khalil'
  | 'network_hadi'
  | 'network_qimma'
  | 'customer'
  | 'custom';

export const AccountStatementView: React.FC<AccountStatementViewProps> = ({ transactions }) => {
  // Selection States
  const [partyCategory, setPartyCategory] = useState<PartyCategory>('owner_mosaab');
  const [customPartyName, setCustomPartyName] = useState<string>('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [openingBalanceType, setOpeningBalanceType] = useState<'credit' | 'debit'>('credit'); // credit = له, debit = عليه

  // Date Filter States
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'month' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthString());
  const [startDate, setStartDate] = useState<string>(() => getCurrentMonthFirstDayString());
  const [endDate, setEndDate] = useState<string>(() => getTodayDateString());

  // Resolved Party Info
  const partyInfo = useMemo(() => {
    switch (partyCategory) {
      case 'owner_mosaab':
        return {
          title: 'المالك: مصعب الصوفي',
          role: 'صاحب المحل ورأس المال',
          description: 'كشف حصة الأرباح (ثلثين 2/3)، صرفة البيت، السحوبات، مبالغ شراء البضاعة',
          icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
        };
      case 'engineer':
        return {
          title: 'مهندس الصيانة',
          role: 'فني الصيانة',
          description: 'كشف مستحقات نسبة الصيانة 50%، سحوبات شخصية، صرفة يومية',
          icon: <Wrench className="w-5 h-5 text-purple-600" />,
        };
      case 'worker':
        return {
          title: 'عامل المحل',
          role: 'عامل يومية / تصفية يوم 5',
          description: 'كشف تصفية المستحقات ومبلغ 7,500 ر.ي والصرفة',
          icon: <User className="w-5 h-5 text-cyan-600" />,
        };
      case 'supplier_absari':
        return {
          title: 'مؤسسة العبصري لقطع الغيار',
          role: 'مورد قطع غيار وصيانة',
          description: 'كشف فواتير الشاشات والقطع المشتراة والمبالغ المسددة والمحولة',
          icon: <Truck className="w-5 h-5 text-orange-600" />,
        };
      case 'supplier_qasemi':
        return {
          title: 'التاجر القاسمي عمر',
          role: 'مورد قطع وإكسسوارات',
          description: 'كشف مسحوبات القطع والدفعات النقدية والمحولة',
          icon: <Truck className="w-5 h-5 text-amber-600" />,
        };
      case 'supplier_khalil':
        return {
          title: 'التاجر خليل الأغبري',
          role: 'مورد قطع غيار',
          description: 'كشف فواتير القطع والمسدد والمتبقي',
          icon: <Truck className="w-5 h-5 text-rose-600" />,
        };
      case 'network_hadi':
        return {
          title: 'تطبيق الهادي (محمد مياس)',
          role: 'تاجر رصيد وشبكات',
          description: 'كشف مبيعات وتغذية رصيد الهادي والأرباح والتصفية',
          icon: <Signal className="w-5 h-5 text-teal-600" />,
        };
      case 'network_qimma':
        return {
          title: 'تطبيق الرقم (فايز أبو علي)',
          role: 'تاجر رصيد وشبكات',
          description: 'كشف مبيعات وتغذية وحوالات تطبيق الرقم والفائدة',
          icon: <Signal className="w-5 h-5 text-blue-600" />,
        };
      case 'customer':
        return {
          title: customPartyName || 'عميل محدد',
          role: 'عميل / ديون آجلة',
          description: 'كشف مشتريات العميل الآجلة والدفعات المسددة والمتبقي عليه',
          icon: <CreditCard className="w-5 h-5 text-slate-600" />,
        };
      case 'custom':
      default:
        return {
          title: customPartyName || 'شخص / جهة مخصصة',
          role: 'حساب مخصص',
          description: 'كشف حساب حركات مخصصة محدد له وعليه',
          icon: <Layers className="w-5 h-5 text-indigo-600" />,
        };
    }
  }, [partyCategory, customPartyName]);

  // Filter Transactions for this Party and Date Range
  const statementRows = useMemo(() => {
    // 1. Date Filter
    let filtered = transactions.filter((t) => {
      if (dateFilterMode === 'month') {
        return t.date.startsWith(selectedMonth);
      }
      if (dateFilterMode === 'custom') {
        return t.date >= startDate && t.date <= endDate;
      }
      return true;
    });

    // 2. Filter by Party logic & Build statement ledger entries
    interface StatementEntry {
      id: string;
      date: string;
      time: string;
      description: string;
      debit: number; // مدين (عليه / أخذ)
      credit: number; // دائن (له / دفع أو استحق)
      typeLabel: string;
      notes?: string;
    }

    let rawEntries: StatementEntry[] = [];

    if (partyCategory === 'owner_mosaab') {
      filtered.forEach((t) => {
        if (t.type === 'expense_home_mosaab') {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `صرفة بيت مصعب: ${t.description}`,
            debit: t.price, // أخذها (عليه)
            credit: 0,
            typeLabel: 'صرفة بيت',
            notes: t.notes,
          });
        } else if (t.type === 'withdrawal_mosaab') {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `سحب شخصي لمصعب: ${t.description}`,
            debit: t.price, // أخذها (عليه)
            credit: 0,
            typeLabel: 'سحب شخصي',
            notes: t.notes,
          });
        } else if (t.type === 'mosaab_purchases_fund') {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `عهدة مشتريات بضاعة مسلمة لمصعب: ${t.description}`,
            debit: t.price, // استلم المبلغ (عليه كعهدة)
            credit: t.cost || 0, // ما اشترى به (له)
            typeLabel: 'عهدة مشتريات',
            notes: t.notes,
          });
        }
      });
    } else if (partyCategory === 'engineer') {
      filtered.forEach((t) => {
        if (t.type === 'maintenance') {
          const maintNet = Math.max(0, t.price - t.cost);
          const engineerEarned = maintNet / 2;
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `فايدة صيانة 50%: ${t.description}`,
            debit: 0,
            credit: engineerEarned, // مستحقة له
            typeLabel: 'فايدة صيانة 50%',
            notes: t.notes,
          });
        } else if (t.type === 'withdrawal_engineer') {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `سحب مهندس مخصوم: ${t.description}`,
            debit: t.price, // أخذها (عليه)
            credit: 0,
            typeLabel: 'سحب مهندس',
            notes: t.notes,
          });
        } else if (t.type === 'expense_engineer') {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `صرفة غداء للمهندس (على المحل): ${t.description}`,
            debit: 0,
            credit: t.price, // مدفوعة له من المحل
            typeLabel: 'صرفة مهندس',
            notes: t.notes,
          });
        }
      });
    } else if (partyCategory === 'worker') {
      filtered.forEach((t) => {
        if (t.type === 'withdrawal_worker' || t.type === 'expense_worker') {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: t.description || 'مستحقات وتصفية العامل (7500)',
            debit: t.price,
            credit: 0,
            typeLabel: 'تصفية عامل',
            notes: t.notes,
          });
        }
      });
    } else if (partyCategory === 'supplier_absari') {
      filtered.forEach((t) => {
        if (
          t.supplierId === 'absari' ||
          (t.supplierName && t.supplierName.includes('العبصري')) ||
          t.description.includes('العبصري')
        ) {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `مشتريات/قطع: ${t.description}`,
            debit: 0,
            credit: t.price, // له (قيمة البضاعة المشتراة منه)
            typeLabel: 'فاتورة قطع',
            notes: t.notes,
          });
        }
      });
    } else if (partyCategory === 'supplier_qasemi') {
      filtered.forEach((t) => {
        if (
          t.supplierId === 'qasemi' ||
          (t.supplierName && t.supplierName.includes('القاسمي')) ||
          t.description.includes('القاسمي')
        ) {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `مشتريات: ${t.description}`,
            debit: 0,
            credit: t.price,
            typeLabel: 'فاتورة قطع',
            notes: t.notes,
          });
        }
      });
    } else if (partyCategory === 'supplier_khalil') {
      filtered.forEach((t) => {
        if (
          t.supplierId === 'khalil' ||
          (t.supplierName && t.supplierName.includes('خليل')) ||
          t.description.includes('خليل')
        ) {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `مشتريات: ${t.description}`,
            debit: 0,
            credit: t.price,
            typeLabel: 'فاتورة قطع',
            notes: t.notes,
          });
        }
      });
    } else if (partyCategory === 'network_hadi') {
      filtered.forEach((t) => {
        if (t.type === 'balance_hadi') {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `رصيد الهادي: ${t.description}`,
            debit: t.cost, // تكلفة الرصيد علينا
            credit: t.price, // المبيعات
            typeLabel: 'رصيد الهادي',
            notes: t.notes,
          });
        }
      });
    } else if (partyCategory === 'network_qimma') {
      filtered.forEach((t) => {
        if (t.type === 'balance_qimma') {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: `رصيد الرقم: ${t.description}`,
            debit: t.cost,
            credit: t.price,
            typeLabel: 'رصيد تطبيق الرقم',
            notes: t.notes,
          });
        }
      });
    } else {
      // Custom / Customer search
      const q = customPartyName.trim().toLowerCase();
      filtered.forEach((t) => {
        if (
          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
          (t.supplierName && t.supplierName.toLowerCase().includes(q)) ||
          t.description.toLowerCase().includes(q)
        ) {
          rawEntries.push({
            id: t.id,
            date: t.date,
            time: t.time,
            description: t.description,
            debit: t.paymentMethod === 'debt' ? t.price : 0,
            credit: t.paymentMethod === 'cash' ? t.price : 0,
            typeLabel: t.type,
            notes: t.notes,
          });
        }
      });
    }

    // Sort by date ascending
    rawEntries.sort((a, b) => a.date.localeCompare(b.date));

    // Compute Running Balances
    let currentBal = openingBalanceType === 'credit' ? openingBalance : -openingBalance;
    const finalRows = rawEntries.map((entry) => {
      // Net for entry = credit (له) - debit (عليه)
      currentBal = currentBal + (entry.credit - entry.debit);
      return {
        ...entry,
        runningBalance: currentBal,
      };
    });

    return finalRows;
  }, [
    transactions,
    partyCategory,
    customPartyName,
    dateFilterMode,
    selectedMonth,
    startDate,
    endDate,
    openingBalance,
    openingBalanceType,
  ]);

  // Overall Totals
  const totalDebit = statementRows.reduce((sum, r) => sum + r.debit, 0); // ما عليه
  const totalCredit = statementRows.reduce((sum, r) => sum + r.credit, 0); // ما له
  const initialBalNum = openingBalanceType === 'credit' ? openingBalance : -openingBalance;
  const netClosingBalance = initialBalNum + (totalCredit - totalDebit);

  // Export to Word Document (.doc)
  const handleExportWord = () => {
    let doc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>كشف حساب تفصيلي - ${partyInfo.title}</title>
<style>
  body { font-family: 'Arial', Tahoma, sans-serif; direction: rtl; text-align: right; margin: 20px; color: #111827; }
  .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { color: #047857; font-size: 18pt; margin: 0 0 5px 0; }
  .header h2 { color: #1e3a8a; font-size: 13pt; margin: 0; }
  .info-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 11pt; }
  table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10.5pt; }
  table.data-table th { background: #047857; color: #ffffff; border: 1px solid #065f46; padding: 8px; text-align: center; }
  table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; }
  .summary-box { margin-top: 25px; border: 2px solid #047857; background: #ecfdf5; padding: 15px; border-radius: 6px; font-size: 11.5pt; }
  .positive { color: #047857; font-weight: bold; }
  .negative { color: #b91c1c; font-weight: bold; }
</style>
</head>
<body>
  <div class="header">
    <h1>محل مصعب الصوفي للجوالات والصيانة والشبكات</h1>
    <h2>كشف حساب تفصيلي مالي (محدد له وعليه)</h2>
  </div>

  <div class="info-box">
    <table style="width: 100%;">
      <tr>
        <td><strong>اسم الحساب / الشخص:</strong> ${partyInfo.title}</td>
        <td><strong>الصفة:</strong> ${partyInfo.role}</td>
        <td><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-YE')}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>الفترة:</strong> ${
          dateFilterMode === 'all'
            ? 'كامل الحركات المسجلة'
            : dateFilterMode === 'month'
            ? `شهر: ${selectedMonth}`
            : `من ${startDate} إلى ${endDate}`
        }</td>
        <td><strong>الرصيد الافتتاحي السابق:</strong> ${formatCurrency(openingBalance)} (${openingBalanceType === 'credit' ? 'له' : 'عليه'})</td>
      </tr>
    </table>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 10%;">التاريخ</th>
        <th style="width: 15%;">نوع البند</th>
        <th style="width: 35%;">البيان والتفاصيل</th>
        <th style="width: 13%;">مدين (عليه / أخذ)</th>
        <th style="width: 13%;">دائن (له / استحق)</th>
        <th style="width: 14%;">الرصيد المتحرك</th>
      </tr>
    </thead>
    <tbody>
      ${statementRows
        .map(
          (r) => `
        <tr>
          <td>${r.date}</td>
          <td>${r.typeLabel}</td>
          <td style="text-align: right;">${r.description}</td>
          <td class="negative">${r.debit > 0 ? formatCurrency(r.debit) : '-'}</td>
          <td class="positive">${r.credit > 0 ? formatCurrency(r.credit) : '-'}</td>
          <td style="font-weight: bold; color: ${r.runningBalance >= 0 ? '#047857' : '#b91c1c'};">
            ${formatCurrency(Math.abs(r.runningBalance))} ${r.runningBalance >= 0 ? '(له)' : '(عليه)'}
          </td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="summary-box">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td><strong>إجمالي ما عليه (المدين):</strong> ${formatCurrency(totalDebit)}</td>
        <td><strong>إجمالي ما له (الدائن):</strong> ${formatCurrency(totalCredit)}</td>
      </tr>
      <tr style="border-top: 1px dashed #059669; font-size: 13pt;">
        <td colspan="2" style="padding-top: 8px;">
          <strong>الرصيد النهائي المتبقي:</strong> 
          <span class="${netClosingBalance >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(Math.abs(netClosingBalance))} ${netClosingBalance >= 0 ? 'ر.ي (متبقي لـه)' : 'ر.ي (مطلوب علـيه)'}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 40px; text-align: center;">
    <table style="width: 100%;">
      <tr>
        <td style="width: 50%;"><strong>توقيع ومصادقة صاحب المحل (مصعب الصوفي)</strong><br><br>____________________</td>
        <td style="width: 50%;"><strong>توقيع ومصادقة المستفيد</strong><br><br>____________________</td>
      </tr>
    </table>
  </div>
</body>
</html>`;

    // Safe download as clean HTML report that opens in Word and any browser without file corruption
    downloadHtmlReport(doc, `كشف_حساب_${partyInfo.title.replace(/\s+/g, '_')}.html`);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const data: any[] = [
      ['كشف حساب تفصيلي مالي'],
      ['المحل:', 'محل مصعب الصوفي للجوالات والصيانة'],
      ['الاسم / الحساب:', partyInfo.title],
      ['الصفة:', partyInfo.role],
      ['تاريخ الاستخراج:', new Date().toLocaleDateString('ar-YE')],
      ['الرصيد الافتتاحي:', `${openingBalance} (${openingBalanceType === 'credit' ? 'له' : 'عليه'})`],
      [''],
      ['التاريخ', 'الوقت', 'نوع الحركة', 'البيان والتفاصيل', 'مدين (عليه)', 'دائن (له)', 'الرصيد المتبقي'],
    ];

    statementRows.forEach((r) => {
      data.push([
        r.date,
        r.time || '',
        r.typeLabel,
        r.description,
        Number(r.debit) || 0,
        Number(r.credit) || 0,
        `${Math.abs(r.runningBalance)} ${r.runningBalance >= 0 ? 'له' : 'عليه'}`,
      ]);
    });

    data.push(['']);
    data.push(['المجاميع:']);
    data.push(['إجمالي ما عليه (مدين):', Number(totalDebit) || 0]);
    data.push(['إجمالي ما له (دائن):', Number(totalCredit) || 0]);
    data.push([
      'الرصيد الصافي النهائي:',
      `${Math.abs(netClosingBalance)} (${netClosingBalance >= 0 ? 'متبقي له' : 'مطلوب عليه'})`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    (ws as any)['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(wb, ws, 'كشف الحساب');
    downloadExcelWorkbook(wb, `كشف_حساب_${partyInfo.title.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div id="account-statement-full-view" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-950/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              النظام المطور لإصدار كشف حساب تفصيلي (له وعليه)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              إصدار كشف حساب دقيق لأي طرف (مصعب، المهندس، مورد قطع غيار، مورد رصيد، عامل، أو عميل) مع تصدير Word و Excel وطباعة رسمية
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Word DOC</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          <button
            type="button"
            onClick={() => printHtmlElement('account-statement-full-view', `كشف_حساب_${partyInfo.title.replace(/\s+/g, '_')}`)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة رسمية</span>
          </button>
        </div>
      </div>

      {/* Configuration & Selection Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900">تحديد الحساب والشخص والفترة الزمنية</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* 1. Party Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">اختر الشخص أو الحساب:</label>
            <select
              value={partyCategory}
              onChange={(e) => setPartyCategory(e.target.value as PartyCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-white text-slate-900"
            >
              <option value="owner_mosaab">1. المالك: مصعب الصوفي (حصة 2/3 والبيت)</option>
              <option value="engineer">2. مهندس الصيانة (50% وسحوبات)</option>
              <option value="worker">3. عامل المحل (تصفية 7500)</option>
              <option value="supplier_absari">4. مورد: مؤسسة العبصري لقطع الغيار</option>
              <option value="supplier_qasemi">5. مورد: القاسمي عمر</option>
              <option value="supplier_khalil">6. مورد: خليل الأغبري</option>
              <option value="network_hadi">7. تطبيق الهادي (محمد مياس - رصيد)</option>
              <option value="network_qimma">8. تطبيق الرقم (فايز أبو علي - رصيد)</option>
              <option value="customer">9. عميل محدد (ديون آجلة)</option>
              <option value="custom">10. شخص أو جهة مخصصة (اسم حر)</option>
            </select>
          </div>

          {/* If customer or custom, show name input */}
          {(partyCategory === 'customer' || partyCategory === 'custom') && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم الشخص / العميل:</label>
              <input
                type="text"
                placeholder="اكتب اسم الشخص..."
                value={customPartyName}
                onChange={(e) => setCustomPartyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>
          )}

          {/* Date Filter Mode */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">نطاق الفترة الزمنية:</label>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-white text-slate-900"
            >
              <option value="all">كامل العمل (جميع الحركات)</option>
              <option value="month">شهر محدد</option>
              <option value="custom">فترة مخصصة (من - إلى)</option>
            </select>
          </div>

          {/* Conditional Date Pickers */}
          {dateFilterMode === 'month' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">اختر الشهر:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
              />
            </div>
          )}

          {dateFilterMode === 'custom' && (
            <div className="flex gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">من:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">إلى:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Opening Balance */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">رصيد افتتاحي سابق:</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                min="0"
                value={openingBalance || ''}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                placeholder="0"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
              />
              <select
                value={openingBalanceType}
                onChange={(e) => setOpeningBalanceType(e.target.value as any)}
                className="px-2 py-2 rounded-xl border border-slate-300 font-bold bg-white text-xs"
              >
                <option value="credit">له (دائن)</option>
                <option value="debit">عليه (مدين)</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Target Party Info & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Selected Party */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            {partyInfo.icon}
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">الحساب المستهدف</div>
            <div className="text-sm font-black text-slate-900 truncate">{partyInfo.title}</div>
            <div className="text-[10px] text-slate-500">{partyInfo.role}</div>
          </div>
        </div>

        {/* Card 2: Total Debit (ما عليه) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">إجمالي ما عليه (أخذ / مدين)</div>
            <div className="text-base font-black font-mono text-rose-600">
              {formatCurrency(totalDebit)}
            </div>
            <div className="text-[10px] text-slate-500">مسحوبات وصرفة وعهدة</div>
          </div>
        </div>

        {/* Card 3: Total Credit (ما له) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">إجمالي ما له (استحق / دائن)</div>
            <div className="text-base font-black font-mono text-emerald-600">
              {formatCurrency(totalCredit)}
            </div>
            <div className="text-[10px] text-slate-500">أرباح ونسب وفواتير</div>
          </div>
        </div>

        {/* Card 4: Net Balance (الصافي النهائي) */}
        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3 ${
            netClosingBalance >= 0
              ? 'bg-emerald-900 text-white border-emerald-800'
              : 'bg-rose-900 text-white border-rose-800'
          }`}
        >
          <div className="p-3 bg-white/10 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-300 font-bold">صافي الرصيد الحالي</div>
            <div className="text-lg font-black font-mono">
              {formatCurrency(Math.abs(netClosingBalance))}
            </div>
            <div className="text-[11px] font-bold text-amber-300">
              {netClosingBalance >= 0 ? '✓ متبقي لـه' : '⚠️ مطلوب علـيه'}
            </div>
          </div>
        </div>

      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs text-slate-800">
              جدول حركات وسندات كشف الحساب التفصيلي ({statementRows.length} حركة)
            </span>
          </div>
          <span className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
            الأرصدة متسلسلة زمنياً
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 text-center w-28">التاريخ</th>
                <th className="p-3 w-32">نوع البند</th>
                <th className="p-3">البيان والتفاصيل</th>
                <th className="p-3 text-center w-28 text-rose-600">مدين (عليه)</th>
                <th className="p-3 text-center w-28 text-emerald-600">دائن (له)</th>
                <th className="p-3 text-center w-36 bg-slate-200/50">الرصيد المتبقي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Opening Balance Row */}
              {openingBalance > 0 && (
                <tr className="bg-amber-50/70 font-bold">
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-amber-800">رصيد سابق</td>
                  <td className="p-3 text-slate-800">رصيد افتتاحي سابق مدور</td>
                  <td className="p-3 text-center font-mono text-rose-600">
                    {openingBalanceType === 'debit' ? formatCurrency(openingBalance) : '-'}
                  </td>
                  <td className="p-3 text-center font-mono text-emerald-600">
                    {openingBalanceType === 'credit' ? formatCurrency(openingBalance) : '-'}
                  </td>
                  <td className="p-3 text-center font-mono font-black text-amber-900 bg-amber-100/50">
                    {formatCurrency(openingBalance)} ({openingBalanceType === 'credit' ? 'له' : 'عليه'})
                  </td>
                </tr>
              )}

              {statementRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد حركات مسجلة لهذا الحساب في الفترة المحددة
                  </td>
                </tr>
              ) : (
                statementRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 text-center font-mono text-slate-700">{row.date}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {row.typeLabel}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {isCompoundDescription(row.description) ? (
                        <div>
                          <div className="text-slate-900">{row.description}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {parseCompoundItems(row.description, row.debit || row.credit, 0).map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-200 font-medium"
                              >
                                <span className="font-bold text-slate-900">{sub.name}</span>
                                {sub.quantity > 1 && <span className="text-slate-500 font-mono">({sub.quantity})</span>}
                                <span className="font-mono text-emerald-700">:{formatNumber(sub.amount)} ر.ي</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        row.description
                      )}
                      {row.notes && <span className="text-[10px] text-slate-400 block font-normal">{row.notes}</span>}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-rose-600">
                      {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">
                      {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                    </td>
                    <td className="p-3 text-center font-mono font-black bg-slate-50">
                      <span className={row.runningBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatCurrency(Math.abs(row.runningBalance))}{' '}
                        <span className="text-[10px]">{row.runningBalance >= 0 ? '(له)' : '(عليه)'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Totals */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
          <div>
            <span>المجموع النهائي للحساب: </span>
            <strong className="text-emerald-400">{partyInfo.title}</strong>
          </div>
          <div className="flex items-center gap-6 font-mono">
            <div>
              <span className="text-slate-400 ml-1">إجمالي ما عليه:</span>
              <span className="text-rose-400 text-sm font-black">{formatCurrency(totalDebit)}</span>
            </div>
            <div>
              <span className="text-slate-400 ml-1">إجمالي ما له:</span>
              <span className="text-emerald-400 text-sm font-black">{formatCurrency(totalCredit)}</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-slate-300 ml-1">الصافي:</span>
              <span className={`text-base font-black ${netClosingBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatCurrency(Math.abs(netClosingBalance))} {netClosingBalance >= 0 ? '(له)' : '(عليه)'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
