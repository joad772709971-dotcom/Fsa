import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { calculateDailySummary, calculateMonthlySettlement, getUniqueDates } from './calculations';
import { downloadExcelWorkbook } from './fileExportHelper';

export function exportToExcel(
  monthOrDays: string | any[],
  transactions?: Transaction[] | string,
  shopOwner: string = 'مصعب الصوفي'
): void {
  if (Array.isArray(monthOrDays)) {
    const wb = XLSX.utils.book_new();
    const sheetData: any[][] = [
      ['اليوم / التاريخ', 'المبيعات', 'الصيانة', 'الرصيد', 'المصاريف', 'صافي الصندوق', 'الحالة']
    ];
    monthOrDays.forEach((d: any) => {
      sheetData.push([
        d.dayTitle || d.date || '',
        d.totalSales || d.sales || 0,
        d.totalMaintenance || d.maintenance || 0,
        d.totalRecharge || 0,
        d.totalExpenses || d.expenses || 0,
        d.netCashDrawer || d.boxDiff || 0,
        d.isClosed ? 'مغلق' : 'نشط',
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    (ws as any)['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الأيام');
    const fileName = typeof transactions === 'string' ? transactions : 'كشف_حساب_الأيام.xlsx';
    downloadExcelWorkbook(wb, fileName);
    return;
  }

  const monthKey = monthOrDays;
  const txList = Array.isArray(transactions) ? transactions : [];
  const monthTx = txList.filter((t) => t.date.startsWith(monthKey));
  const uniqueDays = getUniqueDates(monthTx);
  const monthlySettlement = calculateMonthlySettlement(monthKey, txList);

  const wb = XLSX.utils.book_new();

  // 1. Sheet: ملخص الشهر والتصفية
  const summaryData = [
    ['كشف حساب وتصفية الشهر لمحل الجوالات والصيانة'],
    ['المالك:', shopOwner],
    ['الشهر:', monthlySettlement.monthName],
    [''],
    ['البيان', 'المبلغ (ر.ي)'],
    ['إجمالي المبيعات', monthlySettlement.totalSales],
    ['إجمالي المشتريات', monthlySettlement.totalPurchases],
    ['إجمالي المصاريف والخرج', monthlySettlement.totalExpenses],
    ['إجمالي الصيانة المقبوضة', monthlySettlement.totalMaintenance],
    ['مستحق مهندس الصيانة (50%)', monthlySettlement.engineerTotalShare],
    ['سحوبات المهندس المخصومة', monthlySettlement.engineerTotalWithdrawals],
    ['المتبقي للمهندس', monthlySettlement.engineerRemaining],
    ['تصفية العامل (يوم 5)', monthlySettlement.workerTotalPaid],
    ['صافي أرباح المحل القابلة للتوزيع', monthlySettlement.shopNetDistributable],
    ['حصة المالك مصعب الصوفي (ثلثين 2/3)', monthlySettlement.mosaabTotalShare],
    ['حصة المدير المستلم (ثلث 1/3)', monthlySettlement.managerTotalShare],
    ['صرفة بيت مصعب', monthlySettlement.mosaabTotalHomeExpenses],
    ['سحوبات مصعب الشخصية', monthlySettlement.mosaabTotalWithdrawals],
    ['صافي المستحق النهائي لمصعب الصوفي', monthlySettlement.mosaabFinalPayable],
    ['صافي الكاش في الدرج', monthlySettlement.closingCashInDrawer],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  (wsSummary as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'تصفية الشهر');

  // 2. Sheet: سجل الحركات اليومية التفصيلية
  const txRows = [
    [
      'التاريخ',
      'الوقت',
      'النوع',
      'التصنيف',
      'البيان',
      'المبلغ / سعر البيع',
      'التكلفة',
      'الربح / الفائدة',
      'المورد / العميل',
      'ملاحظات',
    ],
  ];

  monthTx.forEach((t) => {
    txRows.push([
      t.date,
      t.time || '',
      t.type,
      t.category,
      t.description,
      Number(t.price) || 0,
      Number(t.cost) || 0,
      Number(t.profit) || 0,
      t.supplierName || t.customerName || '',
      t.notes || '',
    ] as any);
  });

  const wsTx = XLSX.utils.aoa_to_sheet(txRows);
  (wsTx as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsTx, 'سجل الحركات');

  // 3. Sheet: ملخص كل يوم
  const dailySummaryRows = [
    [
      'التاريخ',
      'المبيعات',
      'الأرباح الخام',
      'فايدة الصيانة (محل)',
      'فايدة الصيانة (مهندس)',
      'سحب المهندس',
      'صرفة المحل والعامل',
      'صافي القابل للقسمة',
      'حصة مصعب (2/3)',
      'حصة المدير (1/3)',
      'صرفة بيت مصعب',
      'صافي مستحق مصعب',
      'كاش الدرج',
    ],
  ];

  uniqueDays.forEach((dayDate) => {
    const s = calculateDailySummary(dayDate, monthTx);
    dailySummaryRows.push([
      s.date,
      Number(s.totalSales) || 0,
      Number(s.totalGrossProfit + s.shopMaintenanceShare) || 0,
      Number(s.shopMaintenanceShare) || 0,
      Number(s.engineerShare) || 0,
      Number(s.engineerWithdrawals) || 0,
      Number(s.shopExpenses + s.engineerExpenses + s.workerExpenses + s.workerSettlement) || 0,
      Number(s.netDistributableProfit) || 0,
      Math.round(s.mosaabShare),
      Math.round(s.managerShare),
      Number(s.mosaabHomeExpenses) || 0,
      Math.round(s.mosaabNetBalance),
      Number(s.netCashDrawer) || 0,
    ] as any);
  });

  const wsDaily = XLSX.utils.aoa_to_sheet(dailySummaryRows);
  (wsDaily as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsDaily, 'تصفية الأيام');

  downloadExcelWorkbook(wb, `كشف_حساب_محل_مصعب_${monthKey}.xlsx`);
}

export function exportSingleDayToExcel(dayOrDate: any, transactions?: Transaction[]): void {
  const isObj = typeof dayOrDate === 'object' && dayOrDate !== null;
  const dateStr = isObj ? (dayOrDate.date || dayOrDate.dayTitle || 'اليوم') : String(dayOrDate);

  const wb = XLSX.utils.book_new();

  if (isObj && !transactions) {
    const summaryData = [
      [`كشف حركات يوم ${dateStr} - محل مصعب الصوفي`],
      ['إجمالي المبيعات', dayOrDate.totalSales || dayOrDate.sales || 0],
      ['إجمالي الصيانة', dayOrDate.totalMaintenance || dayOrDate.maintenance || 0],
      ['إجمالي الرصيد', dayOrDate.totalRecharge || 0],
      ['إجمالي المصاريف والخرج', dayOrDate.totalExpenses || dayOrDate.expenses || 0],
      ['صافي الصندوق / الكاش', dayOrDate.netCashDrawer || dayOrDate.boxDiff || 0],
    ];
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    (ws as any)['!views'] = [{ RTL: true }];
    XLSX.utils.book_append_sheet(wb, ws, 'ملخص اليوم');
    downloadExcelWorkbook(wb, `تقرير_يوم_${dateStr}.xlsx`);
    return;
  }

  const txList = transactions || [];
  const dayTx = txList.filter((t) => t.date === dateStr);
  const summary = calculateDailySummary(dateStr, dayTx);

  const summaryData = [
    [`كشف حركات يوم ${dateStr} - محل مصعب الصوفي`],
    ['إجمالي المبيعات', summary.totalSales],
    ['إجمالي الأرباح الإجمالية', summary.totalGrossProfit],
    ['صافي حصة مصعب (2/3)', summary.mosaabShare],
    ['صافي حصة المدير (1/3)', summary.managerShare],
    ['كاش الدرج', summary.netCashDrawer],
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'ملخص اليوم');
  downloadExcelWorkbook(wb, `تقرير_يوم_${dateStr}.xlsx`);
}

export function exportMaintenanceToExcel(items: any[], fileName = 'تقرير_الصيانة.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الصيانة');
  downloadExcelWorkbook(wb, fileName);
}

export function exportMusabLedgerToExcel(items: any[], fileName = 'دفتر_حساب_مصعب.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'حساب_مصعب');
  downloadExcelWorkbook(wb, fileName);
}

export function exportMusabPurchasingToExcel(items: any, fileName = 'مشتريات_مصعب.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const dataArray = Array.isArray(items) ? items : (items && typeof items === 'object' ? (items.returnedPhones || [items]) : []);
  const ws = XLSX.utils.json_to_sheet(dataArray);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'مشتريات_مصعب');
  downloadExcelWorkbook(wb, fileName);
}

export function exportPartnersFundingToExcel(items: any[], fileName = 'تمويل_الشركاء.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الشركاء');
  downloadExcelWorkbook(wb, fileName);
}

export function exportRechargeManagerToExcel(items: any[], fileName = 'كشف_الرصيد.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الرصيد');
  downloadExcelWorkbook(wb, fileName);
}

export function exportReturnsToExcel(items: any[], fileName = 'المرتجعات.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'المرتجعات');
  downloadExcelWorkbook(wb, fileName);
}

export function exportShortagesToExcel(items: any[], fileName = 'النواقص.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'النواقص');
  downloadExcelWorkbook(wb, fileName);
}

export function exportSimsToExcel(items: any[], extraOrFileName: any = 'الشرائح.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const dataToExport = Array.isArray(extraOrFileName) ? extraOrFileName : items;
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الشرائح');
  const fileName = typeof extraOrFileName === 'string' ? extraOrFileName : 'الشرائح.xlsx';
  downloadExcelWorkbook(wb, fileName);
}

export const exportRechargeToExcel = exportRechargeManagerToExcel;
export const exportSimSalesToExcel = exportSimsToExcel;

export function exportSuppliersLedgerToExcel(daysOrItems: any[], supplierName?: string, profiles?: any[]): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(Array.isArray(daysOrItems) ? daysOrItems : []);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الموردين');
  const fileName = supplierName ? `كشف_حساب_المورد_${supplierName}.xlsx` : 'كشف_الموردين.xlsx';
  downloadExcelWorkbook(wb, fileName);
}

export function exportDamagedToExcel(items: any[], fileName = 'التوالف_والتالف.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'التوالف');
  downloadExcelWorkbook(wb, fileName);
}

export function exportAccountsToExcel(items: any[], fileName = 'كشف_الحسابات.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الحسابات');
  downloadExcelWorkbook(wb, fileName);
}

export function exportArchiveToExcel(items: any[], fileName = 'الأرشيف.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الأرشيف');
  downloadExcelWorkbook(wb, fileName);
}

export function exportAssetsToExcel(items: any[], fileName = 'الأصول.xlsx'): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  (ws as any)['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الأصول');
  downloadExcelWorkbook(wb, fileName);
}
