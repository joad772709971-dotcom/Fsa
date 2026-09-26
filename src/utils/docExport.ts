import { Transaction } from '../types';
import { calculateDailySummary, calculateMonthlySettlement, formatCurrency, getUniqueDates } from './calculations';
import { downloadHtmlReport } from './fileExportHelper';

/**
 * Exports a fully formatted table document
 * structured strictly by days, sub-tables for each section,
 * daily settlement at bottom of each day, and grand monthly settlement at the end.
 * Compatible with Word and all web browsers without any file corruption warnings.
 */
export function exportMonthlyDocReport(
  monthKey: string, // YYYY-MM
  transactions: Transaction[],
  shopOwner: string = 'مصعب الصوفي'
): void {
  const monthTx = transactions.filter((t) => t.date.startsWith(monthKey));
  const uniqueDays = getUniqueDates(monthTx);
  const monthlySettlement = calculateMonthlySettlement(monthKey, transactions);

  let docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>كشف حساب وتصفية الشهر - ${monthKey}</title>
<style>
  body {
    font-family: 'Arial', 'Segoe UI', Tahoma, sans-serif;
    direction: rtl;
    text-align: right;
    background-color: #ffffff;
    color: #111827;
    margin: 20px;
  }
  .header {
    text-align: center;
    border-bottom: 3px double #1e3a8a;
    padding-bottom: 12px;
    margin-bottom: 25px;
  }
  .header h1 {
    color: #1e3a8a;
    font-size: 22pt;
    margin: 0 0 8px 0;
  }
  .header h2 {
    color: #047857;
    font-size: 14pt;
    margin: 0;
  }
  .meta-box {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    padding: 10px 15px;
    margin-bottom: 25px;
    border-radius: 6px;
    font-size: 11pt;
  }
  .day-card {
    border: 2px solid #0284c7;
    margin-bottom: 30px;
    page-break-inside: avoid;
    border-radius: 8px;
    overflow: hidden;
  }
  .day-title {
    background-color: #0284c7;
    color: #ffffff;
    padding: 10px 15px;
    font-size: 13pt;
    font-weight: bold;
  }
  .section-title {
    background-color: #e0f2fe;
    color: #0369a1;
    padding: 6px 12px;
    font-size: 11pt;
    font-weight: bold;
    border-top: 1px solid #bae6fd;
    border-bottom: 1px solid #bae6fd;
    margin-top: 10px;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 10pt;
  }
  table.data-table th {
    background-color: #f1f5f9;
    color: #334155;
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    text-align: center;
  }
  table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    text-align: center;
  }
  .daily-settlement {
    background-color: #ecfdf5;
    border-top: 2px dashed #059669;
    padding: 12px 15px;
    font-size: 10.5pt;
  }
  .settlement-grid {
    width: 100%;
    border-collapse: collapse;
  }
  .settlement-grid td {
    padding: 4px 8px;
    border-bottom: 1px dotted #a7f3d0;
  }
  .grand-monthly {
    border: 3px solid #047857;
    background-color: #f0fdf4;
    padding: 20px;
    margin-top: 40px;
    page-break-before: always;
    border-radius: 8px;
  }
  .badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
  }
  .positive { color: #047857; font-weight: bold; }
  .negative { color: #b91c1c; font-weight: bold; }
</style>
</head>
<body>

<div class="header">
  <h1>كشف حساب وتصفية عمل المحل اليومي والشهري</h1>
  <h2>محل جوالات وصيانة وإكسسوارات ورصيد - المالك: ${shopOwner}</h2>
</div>

<div class="meta-box">
  <table style="width: 100%;">
    <tr>
      <td><strong>الفترة / الشهر:</strong> ${monthlySettlement.monthName}</td>
      <td><strong>عدد أيام العمل المسجلة:</strong> ${monthlySettlement.daysCount} يوم</td>
      <td><strong>تاريخ استخراج التقرير:</strong> ${new Date().toLocaleDateString('ar-YE')}</td>
    </tr>
    <tr>
      <td colspan="3"><strong>ملاحظة التقرير:</strong> الكشف مبوب يومياً مع تصفية أرباح المبيعات، الصيانة (مناصفة 50% مع المهندس)، شبكات الرصيد (الهادي والرقم)، والمصاريف وتوزيع الثلثين (مصعب) والثلث (المدير).</td>
    </tr>
  </table>
</div>
`;

  // Iterate over each day in order
  uniqueDays.forEach((dayDate) => {
    const dayTx = monthTx.filter((t) => t.date === dayDate);
    const daySummary = calculateDailySummary(dayDate, monthTx);

    const salesTx = dayTx.filter((t) => t.type === 'sale');
    const maintTx = dayTx.filter((t) => t.type === 'maintenance');
    const hadiTx = dayTx.filter((t) => t.type === 'balance_hadi');
    const qimmaTx = dayTx.filter((t) => t.type === 'balance_qimma');
    const simsTx = dayTx.filter((t) => t.type === 'sim');
    const purchTx = dayTx.filter((t) => t.type === 'purchase');
    const expTx = dayTx.filter(
      (t) =>
        t.type.startsWith('expense_') ||
        t.type.startsWith('withdrawal_') ||
        t.type === 'shop_tools_outflow' ||
        t.type === 'mosaab_purchases_fund'
    );

    docContent += `
<div class="day-card">
  <div class="day-title">كشف يوم: ${dayDate}</div>
`;

    // 1. Sales Table
    if (salesTx.length > 0) {
      docContent += `
  <div class="section-title">1. المبيعات والجوالات والإكسسوارات</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 10%;">الوقت</th>
        <th style="width: 40%;">البيان / الصنف</th>
        <th style="width: 15%;">سعر البيع</th>
        <th style="width: 15%;">التكلفة</th>
        <th style="width: 20%;">الربح / الفائدة</th>
      </tr>
    </thead>
    <tbody>
      ${salesTx
        .map(
          (t) => `
        <tr>
          <td>${t.time || '-'}</td>
          <td style="text-align: right;">${t.description}</td>
          <td>${formatCurrency(t.price)}</td>
          <td>${formatCurrency(t.cost)}</td>
          <td class="positive">${formatCurrency(t.profit)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>`;
    }

    // 2. Maintenance Table
    if (maintTx.length > 0) {
      docContent += `
  <div class="section-title">2. قسم الصيانة وحساب المهندس (الفايدة مناصفة 50% محل و 50% مهندس)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 10%;">الوقت</th>
        <th style="width: 35%;">بيان الصيانة والعطل</th>
        <th style="width: 15%;">الإجمالي المقبوض</th>
        <th style="width: 15%;">تكلفة القطع</th>
        <th style="width: 12%;">فايدة المحل</th>
        <th style="width: 13%;">فايدة المهندس</th>
      </tr>
    </thead>
    <tbody>
      ${maintTx
        .map((t) => {
          const net = Math.max(0, t.price - t.cost);
          const half = net / 2;
          return `
        <tr>
          <td>${t.time || '-'}</td>
          <td style="text-align: right;">${t.description} ${t.supplierName ? `(قطع: ${t.supplierName})` : ''}</td>
          <td>${formatCurrency(t.price)}</td>
          <td>${formatCurrency(t.cost)}</td>
          <td class="positive">${formatCurrency(half)}</td>
          <td class="positive">${formatCurrency(half)}</td>
        </tr>`;
        })
        .join('')}
    </tbody>
  </table>`;
    }

    // 3. Balance Networks Table (Hadi & Qimma)
    if (hadiTx.length > 0 || qimmaTx.length > 0) {
      docContent += `
  <div class="section-title">3. قسم الرصيد وشبكات الاتصال (تطبيق الهادي - محمد مياس & تطبيق الرقم - فايز أبو علي)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">التطبيق / المورد</th>
        <th style="width: 35%;">البيان</th>
        <th style="width: 15%;">المبلغ المباع</th>
        <th style="width: 12%;">التكلفة</th>
        <th style="width: 13%;">الفائدة</th>
      </tr>
    </thead>
    <tbody>
      ${[...hadiTx, ...qimmaTx]
        .map(
          (t) => `
        <tr>
          <td><strong>${t.type === 'balance_hadi' ? 'تطبيق الهادي (محمد مياس)' : 'تطبيق الرقم (فايز أبو علي)'}</strong></td>
          <td style="text-align: right;">${t.description}</td>
          <td>${formatCurrency(t.price)}</td>
          <td>${formatCurrency(t.cost)}</td>
          <td class="positive">${formatCurrency(t.profit)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>`;
    }

    // 4. SIM Cards Table
    if (simsTx.length > 0) {
      docContent += `
  <div class="section-title">4. قسم الشرائح</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 10%;">الوقت</th>
        <th style="width: 45%;">البيان</th>
        <th style="width: 15%;">المبلغ</th>
        <th style="width: 15%;">التكلفة</th>
        <th style="width: 15%;">الفائدة</th>
      </tr>
    </thead>
    <tbody>
      ${simsTx
        .map(
          (t) => `
        <tr>
          <td>${t.time || '-'}</td>
          <td style="text-align: right;">${t.description}</td>
          <td>${formatCurrency(t.price)}</td>
          <td>${formatCurrency(t.cost)}</td>
          <td class="positive">${formatCurrency(t.profit)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>`;
    }

    // 5. Purchases & Spare parts Table
    if (purchTx.length > 0) {
      docContent += `
  <div class="section-title">5. المشتريات والقطع (العبصري / القاسمي عمر / خليل الأغبري)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 10%;">الوقت</th>
        <th style="width: 30%;">المورد</th>
        <th style="width: 40%;">بيان القطع والمشتريات</th>
        <th style="width: 20%;">المبلغ المدفوع / المحول</th>
      </tr>
    </thead>
    <tbody>
      ${purchTx
        .map(
          (t) => `
        <tr>
          <td>${t.time || '-'}</td>
          <td><strong>${t.supplierName || 'مورد عام'}</strong></td>
          <td style="text-align: right;">${t.description}</td>
          <td class="negative">${formatCurrency(t.price)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>`;
    }

    // 6. Expenses & Withdrawals Table
    if (expTx.length > 0) {
      docContent += `
  <div class="section-title">6. الخرج والمصروفات والسحوبات ومخروجات المحل</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 10%;">الوقت</th>
        <th style="width: 25%;">نوع البند</th>
        <th style="width: 45%;">التفاصيل والبيان</th>
        <th style="width: 20%;">المبلغ</th>
      </tr>
    </thead>
    <tbody>
      ${expTx
        .map((t) => {
          let typeLabel = 'خرج محل';
          if (t.type === 'expense_home_mosaab') typeLabel = 'صرفة بيت مصعب';
          if (t.type === 'withdrawal_mosaab') typeLabel = 'سحب مصعب شخصي';
          if (t.type === 'mosaab_purchases_fund') typeLabel = 'مسلم لمصعب لشراء بضاعة';
          if (t.type === 'expense_engineer') typeLabel = 'صرفة مهندس (على المحل)';
          if (t.type === 'withdrawal_engineer') typeLabel = 'سحب مهندس (يحسب عليه)';
          if (t.type === 'expense_worker') typeLabel = 'صرفة عامل (على المحل)';
          if (t.type === 'withdrawal_worker') typeLabel = 'تصفية/سحب العامل (7500)';
          if (t.type === 'expense_modem') typeLabel = 'خرج مودم ورصيد نت (مناصفة)';
          if (t.type === 'shop_tools_outflow') typeLabel = 'مخروجات للمحل (وصلات/شواحن)';

          return `
        <tr>
          <td>${t.time || '-'}</td>
          <td><strong>${typeLabel}</strong></td>
          <td style="text-align: right;">${t.description} ${t.notes ? `(${t.notes})` : ''}</td>
          <td class="negative">${formatCurrency(t.price)}</td>
        </tr>`;
        })
        .join('')}
    </tbody>
  </table>`;
    }

    // Daily Settlement Table Box at bottom of each day
    docContent += `
  <div class="daily-settlement">
    <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 11.5pt;">تصفية حساب يوم ${dayDate}</h3>
    <table class="settlement-grid">
      <tr>
        <td style="width: 33%;"><strong>إجمالي مبيعات اليوم:</strong> ${formatCurrency(daySummary.totalSales)}</td>
        <td style="width: 33%;"><strong>إجمالي أرباح اليوم الخام:</strong> ${formatCurrency(daySummary.totalGrossProfit + daySummary.shopMaintenanceShare)}</td>
        <td style="width: 34%;"><strong>صافي فايدة الصيانة:</strong> ${formatCurrency(daySummary.maintenanceNetProfit)}</td>
      </tr>
      <tr>
        <td><strong>فايدة الصيانة للمحل (50%):</strong> ${formatCurrency(daySummary.shopMaintenanceShare)}</td>
        <td><strong>فايدة الصيانة للمهندس (50%):</strong> ${formatCurrency(daySummary.engineerShare)}</td>
        <td><strong>سحب المهندس المخصوم:</strong> ${formatCurrency(daySummary.engineerWithdrawals)}</td>
      </tr>
      <tr>
        <td><strong>صرفة المحل + المهندس + العامل:</strong> ${formatCurrency(daySummary.shopExpenses + daySummary.engineerExpenses + daySummary.workerExpenses + daySummary.workerSettlement)}</td>
        <td><strong>خرج المودم والرصيد (مناصفة):</strong> ${formatCurrency(daySummary.modemExpenses)}</td>
        <td><strong>صافي الربح القابل للقسمة:</strong> <span class="positive">${formatCurrency(daySummary.netDistributableProfit)}</span></td>
      </tr>
      <tr>
        <td style="background-color: #d1fae5;"><strong>حصة مصعب الصوفي (ثلثين 2/3):</strong> ${formatCurrency(daySummary.mosaabShare)}</td>
        <td style="background-color: #d1fae5;"><strong>حصة المدير المستلم (ثلث 1/3):</strong> ${formatCurrency(daySummary.managerShare)}</td>
        <td><strong>صرفة بيت مصعب المخصومة:</strong> ${formatCurrency(daySummary.mosaabHomeExpenses)}</td>
      </tr>
      <tr>
        <td colspan="2" style="background-color: #fef3c7;"><strong>صافي مستحق مصعب لليوم (بعد خصم صرفة بيته وسحبه):</strong> <span class="positive">${formatCurrency(daySummary.mosaabNetBalance)}</span></td>
        <td style="background-color: #fef3c7;"><strong>صافي الكاش المتبقي في الدرج:</strong> ${formatCurrency(daySummary.netCashDrawer)}</td>
      </tr>
    </table>
  </div>
</div>
`;
  });

  // Grand Monthly Settlement Page
  docContent += `
<div class="grand-monthly">
  <h2 style="text-align: center; color: #047857; font-size: 16pt; margin: 0 0 15px 0;">ورقة تصفية وخلاصة عمل الشهر كامل (${monthlySettlement.monthName})</h2>
  
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
    <tr style="background-color: #dcfce7;">
      <td style="padding: 10px; border: 1px solid #86efac;"><strong>إجمالي المبيعات المحققة:</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold;">${formatCurrency(monthlySettlement.totalSales)}</td>
      <td style="padding: 10px; border: 1px solid #86efac;"><strong>إجمالي المشتريات والقطع:</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold;">${formatCurrency(monthlySettlement.totalPurchases)}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #86efac;"><strong>إجمالي مصاريف المحل والعامل:</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold;">${formatCurrency(monthlySettlement.totalExpenses)}</td>
      <td style="padding: 10px; border: 1px solid #86efac;"><strong>إجمالي أعمال الصيانة:</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold;">${formatCurrency(monthlySettlement.totalMaintenance)}</td>
    </tr>
    <tr style="background-color: #dcfce7;">
      <td style="padding: 10px; border: 1px solid #86efac;"><strong>مستحقات مهندس الصيانة (50%):</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold; color: #047857;">${formatCurrency(monthlySettlement.engineerTotalShare)}</td>
      <td style="padding: 10px; border: 1px solid #86efac;"><strong>سحوبات المهندس المخصومة:</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold; color: #b91c1c;">${formatCurrency(monthlySettlement.engineerTotalWithdrawals)}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #86efac;"><strong>متبقي حساب المهندس:</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold;">${formatCurrency(monthlySettlement.engineerRemaining)}</td>
      <td style="padding: 10px; border: 1px solid #86efac;"><strong>إجمالي المسلم للعامل (يوم 5):</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold;">${formatCurrency(monthlySettlement.workerTotalPaid)}</td>
    </tr>
    <tr style="background-color: #bbf7d0;">
      <td style="padding: 12px; border: 2px solid #16a34a;"><strong>صافي أرباح المحل القابلة للتوزيع:</strong></td>
      <td colspan="3" style="padding: 12px; border: 2px solid #16a34a; font-size: 13pt; font-weight: bold; color: #15803d;">${formatCurrency(monthlySettlement.shopNetDistributable)}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #86efac; background-color: #fef08a;"><strong>حصة المالك مصعب الصوفي (ثلثين 2/3):</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold; font-size: 12pt;">${formatCurrency(monthlySettlement.mosaabTotalShare)}</td>
      <td style="padding: 10px; border: 1px solid #86efac; background-color: #fef08a;"><strong>حصة المدير المستلم (ثلث 1/3):</strong></td>
      <td style="padding: 10px; border: 1px solid #86efac; font-weight: bold; font-size: 12pt;">${formatCurrency(monthlySettlement.managerTotalShare)}</td>
    </tr>
    <tr style="background-color: #fee2e2;">
      <td style="padding: 10px; border: 1px solid #fca5a5;"><strong>إجمالي صرفة بيت مصعب:</strong></td>
      <td style="padding: 10px; border: 1px solid #fca5a5; font-weight: bold; color: #b91c1c;">${formatCurrency(monthlySettlement.mosaabTotalHomeExpenses)}</td>
      <td style="padding: 10px; border: 1px solid #fca5a5;"><strong>إجمالي سحوبات مصعب الشخصية:</strong></td>
      <td style="padding: 10px; border: 1px solid #fca5a5; font-weight: bold; color: #b91c1c;">${formatCurrency(monthlySettlement.mosaabTotalWithdrawals)}</td>
    </tr>
    <tr style="background-color: #10b981; color: #ffffff;">
      <td style="padding: 14px; border: 2px solid #047857; font-size: 12pt;"><strong>صافي المستحق النهائي للمالك مصعب:</strong></td>
      <td colspan="3" style="padding: 14px; border: 2px solid #047857; font-size: 15pt; font-weight: 900;">${formatCurrency(monthlySettlement.mosaabFinalPayable)}</td>
    </tr>
  </table>

  <div style="margin-top: 30px; border-top: 1px dashed #6b7280; padding-top: 15px;">
    <table style="width: 100%; text-align: center;">
      <tr>
        <td style="width: 50%;"><strong>توقيع المستلم / المدير</strong><br><br>____________________</td>
        <td style="width: 50%;"><strong>توقيع واعتراض / موافقة المالك مصعب الصوفي</strong><br><br>____________________</td>
      </tr>
    </table>
  </div>
</div>

</body>
</html>`;

  // Trigger safe download as clean HTML report that opens in any browser and Word without corruption
  downloadHtmlReport(docContent, `كشف_حساب_محل_مصعب_الصوفي_${monthKey}.html`);
}
