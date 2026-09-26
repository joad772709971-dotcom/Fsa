import { DayRecord, SupplierTransferItem } from '../types';
import { Transaction } from '../types/index';
import { HadiDailyBalanceSummary, HadiTransaction } from './hadiStatementData';

export interface HadiOfficialDailyRecord {
  date: string;
  openingBalance: number; // كم كان باقي بالبرنامج (الافتتاح المرحل من اليوم السابق)
  sales: number; // إجمالي البيع
  profit: number; // الفايدة (7.5%)
  salesWithoutProfit: number; // إجمالي البيع بدون فائدة
  purchasesFromMayas: number; // مشترى/تأمين من مياس
  transfersOutToMayas: number; // ما تم تحويله له
  closingBalance: number; // رصيد نهاية اليوم بالتطبيق
  notes: string; // ملاحظات
}

// 49 Officially Approved Records from 2026-08-01 through 2026-09-22
export const HADI_RAW_OFFICIAL_TABLE = [
  { date: '2026-08-01', sales: 20700.00, profit: 1552.50, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 1344.30, notes: 'رصيد سابق 2,037.30 + تحويل مصعب 20,000' },
  { date: '2026-08-02', sales: 20778.00, profit: 1558.35, purchasesFromMayas: 40001.00, transfersOutToMayas: 40001.00, closingBalance: 20567.30, notes: 'مبلغ تأمين (20,000 + 20,001)' },
  { date: '2026-08-03', sales: 12740.00, profit: 955.50, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 7828.30, notes: 'مبيعات رصيد فقط' },
  { date: '2026-08-04', sales: 9890.00, profit: 741.75, purchasesFromMayas: 18000.00, transfersOutToMayas: 18000.00, closingBalance: 15938.30, notes: 'تحويلين من مياس (10,000 + 8,000)' },
  { date: '2026-08-05', sales: 19554.00, profit: 1466.55, purchasesFromMayas: 18500.00, transfersOutToMayas: 18500.00, closingBalance: 376.30, notes: 'تحويل من مياس 18,500' },
  { date: '2026-08-06', sales: 25090.00, profit: 1881.75, purchasesFromMayas: 25000.00, transfersOutToMayas: 25000.00, closingBalance: 286.30, notes: 'تحويل من مياس 25,000' },
  { date: '2026-08-07', sales: 1125.00, profit: 84.38, purchasesFromMayas: 30000.00, transfersOutToMayas: 30000.00, closingBalance: 29161.30, notes: 'تحويل من مياس 30,000' },
  { date: '2026-08-08', sales: 10040.00, profit: 753.00, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 20721.30, notes: 'مبيعات رصيد فقط' },
  { date: '2026-08-09', sales: 21500.50, profit: 1612.54, purchasesFromMayas: 10000.00, transfersOutToMayas: 10000.00, closingBalance: 7256.80, notes: 'تحويل من مياس 10,000' },
  { date: '2026-08-10', sales: 18342.00, profit: 1375.65, purchasesFromMayas: 15000.00, transfersOutToMayas: 15000.00, closingBalance: 3914.80, notes: 'تحويل من مياس 15,000' },
  { date: '2026-08-11', sales: 16384.00, profit: 1228.80, purchasesFromMayas: 15000.00, transfersOutToMayas: 15000.00, closingBalance: 1988.80, notes: 'تحويل 15,000 (يشمل تسديد باقة مياس 8,080)' },
  { date: '2026-08-12', sales: 10714.00, profit: 803.55, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 10790.80, notes: 'تحويل من مياس 20,000' },
  { date: '2026-08-13', sales: 14068.00, profit: 1055.10, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 16722.80, notes: 'تحويل من مياس 20,000' },
  { date: '2026-08-14', sales: 6710.00, profit: 503.25, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 10012.80, notes: 'مبيعات رصيد فقط' },
  { date: '2026-08-15', sales: 18747.70, profit: 1406.08, purchasesFromMayas: 10000.00, transfersOutToMayas: 10000.00, closingBalance: 1060.10, notes: 'تحويل من مياس 10,000' },
  { date: '2026-08-16', sales: 17466.00, profit: 1309.95, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 3394.10, notes: 'تحويل من مياس 20,000' },
  { date: '2026-08-17', sales: 7655.50, profit: 574.16, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 14528.60, notes: 'تحويل من مياس 20,000' },
  { date: '2026-08-18', sales: 23289.00, profit: 1746.68, purchasesFromMayas: 12000.00, transfersOutToMayas: 12000.00, closingBalance: 7110.60, notes: 'تحويلين من مياس (10,000 + 2,000)' },
  { date: '2026-08-19', sales: 13016.00, profit: 976.20, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 10931.60, notes: 'تحويل من مياس 20,000' },
  { date: '2026-08-20', sales: 22243.70, profit: 1668.28, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 6326.90, notes: 'تحويل من مياس 20,000' },
  { date: '2026-08-22', sales: 6260.00, profit: 469.50, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 66.90, notes: 'مبيعات رصيد فقط' },
  { date: '2026-08-23', sales: 8939.00, profit: 670.43, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 11127.90, notes: 'تحويل من مياس 20,000' },
  { date: '2026-08-24', sales: 7484.00, profit: 561.30, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 4148.90, notes: 'مبيعات رصيد فقط' },
  { date: '2026-08-25', sales: 7160.00, profit: 537.00, purchasesFromMayas: 18000.00, transfersOutToMayas: 18000.00, closingBalance: 14988.90, notes: 'تحويل من مياس 18,000' },
  { date: '2026-08-26', sales: 19991.00, profit: 1499.33, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 17941.90, notes: 'تحويل من مياس 20,000' },
  { date: '2026-08-27', sales: 4400.00, profit: 330.00, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 13541.90, notes: 'مبيعات رصيد فقط' },
  { date: '2026-08-28', sales: 15310.00, profit: 1148.25, purchasesFromMayas: 27000.00, transfersOutToMayas: 27000.00, closingBalance: 21772.90, notes: 'تحويل من مياس 27,000' },
  { date: '2026-08-30', sales: 2440.00, profit: 183.00, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 19332.90, notes: 'مبيعات رصيد فقط' },
  { date: '2026-08-31', sales: 27157.00, profit: 2036.78, purchasesFromMayas: 25000.00, transfersOutToMayas: 25000.00, closingBalance: 15592.90, notes: 'تحويلين من مياس (5,000 + 20,000)' },
  { date: '2026-09-01', sales: 18376.00, profit: 1378.20, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 17216.90, notes: 'تحويل من مياس 20,000' },
  { date: '2026-09-02', sales: 20847.00, profit: 1563.53, purchasesFromMayas: 10000.00, transfersOutToMayas: 10000.00, closingBalance: 9628.90, notes: 'تحويل من مياس 10,000' },
  { date: '2026-09-03', sales: 3208.00, profit: 240.60, purchasesFromMayas: 11000.00, transfersOutToMayas: 11000.00, closingBalance: 17420.90, notes: 'تحويلين من مياس (10,000 + 1,000)' },
  { date: '2026-09-04', sales: 3284.00, profit: 246.30, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 14136.90, notes: 'مبيعات رصيد فقط' },
  { date: '2026-09-06', sales: 7108.00, profit: 533.10, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 8428.90, notes: 'مبيعات رصيد فقط' },
  { date: '2026-09-07', sales: 27877.00, profit: 2090.78, purchasesFromMayas: 35999.00, transfersOutToMayas: 35999.00, closingBalance: 16662.90, notes: 'تحويلين (18,000 + 17,999) بعد عكس 18,000' },
  { date: '2026-09-08', sales: 20348.70, profit: 1526.15, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 13025.20, notes: 'تحويل من مياس 20,000' },
  { date: '2026-09-09', sales: 24015.00, profit: 1801.13, purchasesFromMayas: 10000.00, transfersOutToMayas: 10000.00, closingBalance: 5552.20, notes: 'تحويل من مياس 10,000' },
  { date: '2026-09-10', sales: 16565.00, profit: 1242.38, purchasesFromMayas: 30000.00, transfersOutToMayas: 30000.00, closingBalance: 19997.20, notes: 'تحويلين من مياس (10,000 + 20,000)' },
  { date: '2026-09-11', sales: 1250.00, profit: 93.75, purchasesFromMayas: 0.00, transfersOutToMayas: 0.00, closingBalance: 18747.20, notes: 'مبيعات رصيد فقط' },
  { date: '2026-09-13', sales: 22236.20, profit: 1667.72, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 17391.20, notes: 'تحويل من مياس 20,000' },
  { date: '2026-09-14', sales: 20765.00, profit: 1557.38, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 19826.20, notes: 'تحويل من مياس 20,000' },
  { date: '2026-09-15', sales: 19853.00, profit: 1488.98, purchasesFromMayas: 10000.00, transfersOutToMayas: 10000.00, closingBalance: 2708.20, notes: 'تحويل من مياس 10,000' },
  { date: '2026-09-16', sales: 16747.00, profit: 1256.03, purchasesFromMayas: 16000.00, transfersOutToMayas: 16000.00, closingBalance: 3269.20, notes: 'تحويلين من مياس (10,000 + 6,000)' },
  { date: '2026-09-17', sales: 19406.00, profit: 1455.45, purchasesFromMayas: 33000.00, transfersOutToMayas: 33000.00, closingBalance: 19163.20, notes: 'تحويلين من مياس (13,000 + 20,000)' },
  { date: '2026-09-18', sales: 14365.00, profit: 1077.38, purchasesFromMayas: 3700.00, transfersOutToMayas: 3700.00, closingBalance: 10498.20, notes: 'عمولة شهر 8 من مياس: 3,700' },
  { date: '2026-09-19', sales: 9999.00, profit: 749.93, purchasesFromMayas: 15000.00, transfersOutToMayas: 15000.00, closingBalance: 14169.20, notes: 'تحويل من مياس 15,000' },
  { date: '2026-09-20', sales: 16001.00, profit: 1200.08, purchasesFromMayas: 11000.00, transfersOutToMayas: 11000.00, closingBalance: 7827.20, notes: 'تحويل من مياس 11,000' },
  { date: '2026-09-21', sales: 26058.00, profit: 1954.35, purchasesFromMayas: 29000.00, transfersOutToMayas: 29000.00, closingBalance: 14084.20, notes: 'تحويلين من مياس (9,000 + 20,000)' },
  { date: '2026-09-22', sales: 9209.00, profit: 690.68, purchasesFromMayas: 20000.00, transfersOutToMayas: 20000.00, closingBalance: 24640.20, notes: 'تحويل من مياس 20,000' }
];

// Compute sequential automatic rollover for opening balance
export const HADI_OFFICIAL_DAILY_RECORDS: HadiOfficialDailyRecord[] = (() => {
  let prevClosing = 2037.30; // Initial pre-period balance before 2026-08-01
  return HADI_RAW_OFFICIAL_TABLE.map((row, index) => {
    const openingBalance = index === 0 ? 2037.30 : prevClosing;
    prevClosing = row.closingBalance;
    const salesWithoutProfit = Math.round((row.sales - row.profit) * 100) / 100;
    return {
      date: row.date,
      openingBalance: Math.round(openingBalance * 100) / 100,
      sales: row.sales,
      profit: row.profit,
      salesWithoutProfit,
      purchasesFromMayas: row.purchasesFromMayas,
      transfersOutToMayas: row.transfersOutToMayas,
      closingBalance: row.closingBalance,
      notes: row.notes
    };
  });
})();

// Official Totals
export const HADI_OFFICIAL_TOTALS = {
  totalSales: 735597.10, // Kشف حساب الهادي أونلاين
  actualRowsSalesSum: HADI_OFFICIAL_DAILY_RECORDS.reduce((s, r) => s + r.sales, 0),
  totalProfit: 55169.78, // (750 ريال لكل 10,000 = 7.5%)
  actualRowsProfitSum: HADI_OFFICIAL_DAILY_RECORDS.reduce((s, r) => s + r.profit, 0),
  totalPurchasesMayas: 738200.00,
  totalTransfersOutMayas: 738200.00,
  finalClosingBalance: 24640.20, // الرصيد الختامي في 2026-09-22
  daysCount: HADI_OFFICIAL_DAILY_RECORDS.length
};

// Convert to HadiDailyBalanceSummary[] for the Reconciler
export function generateOfficialHadiDailySummaries(): HadiDailyBalanceSummary[] {
  return HADI_OFFICIAL_DAILY_RECORDS.map((rec) => {
    const syntheticTx: HadiTransaction[] = [];
    
    // Purchase/Insurance transaction
    if (rec.purchasesFromMayas > 0) {
      syntheticTx.push({
        id: `hadi_official_in_${rec.date}`,
        page: 1,
        date: rec.date,
        description: `لكم، تغذية وتأمين رصيد من العميل: أبو البراء محمد خالد مياس (${rec.notes})`,
        amount: rec.purchasesFromMayas,
        type: 'له',
        balanceAfter: rec.openingBalance + rec.purchasesFromMayas,
        isMayasPurchase: true,
        isMayasTransferOut: false
      });
    }

    // Sales transaction
    if (rec.sales > 0) {
      syntheticTx.push({
        id: `hadi_official_sale_${rec.date}`,
        page: 1,
        date: rec.date,
        description: `عليكم، إجمالي مبيعات وتسديدات الرصيد والباقات بالبرنامج (فائدة 7.5% = ${rec.profit.toLocaleString()} ر.ي)`,
        amount: rec.sales,
        type: 'عليه',
        balanceAfter: rec.closingBalance,
        isMayasPurchase: false,
        isMayasTransferOut: false
      });
    }

    return {
      date: rec.date,
      openingBalance: rec.openingBalance,
      purchasesFromMayas: rec.purchasesFromMayas,
      otherPurchasesOrDeposits: 0,
      totalCredits: rec.purchasesFromMayas,
      sales: rec.sales,
      transfersOutToMayas: rec.transfersOutToMayas,
      otherDebits: 0,
      closingBalance: rec.closingBalance,
      transactionsCount: (rec.purchasesFromMayas > 0 ? 1 : 0) + (rec.sales > 0 ? 1 : 0),
      transactions: syntheticTx,
      // Attached official accounting fields
      profit: rec.profit,
      salesWithoutProfit: rec.salesWithoutProfit,
      notes: rec.notes
    } as HadiDailyBalanceSummary;
  });
}

// Helper to apply the official Hadi reconciliation onto any list of DayRecords
export function applyOfficialHadiToDayRecords(existingDays: DayRecord[]): DayRecord[] {
  const hadiMap = new Map<string, HadiOfficialDailyRecord>(
    HADI_OFFICIAL_DAILY_RECORDS.map((r) => [r.date, r])
  );

  // 1. Update existing days
  const updatedDays = existingDays.map((day) => {
    const hadi = hadiMap.get(day.date);
    if (!hadi) return day;

    // Filter out old/conflicting Mayas transfers for this day
    const cleanSupplierTransfers = (day.supplierTransfers || []).filter(
      (st) => !st.supplierName.includes('مياس') && !st.notes?.includes('الهادي')
    );

    // If there was a transfer / purchase for Mayas, add the official entry
    if (hadi.transfersOutToMayas > 0 || hadi.purchasesFromMayas > 0) {
      cleanSupplierTransfers.push({
        id: `hadi-supp-${day.date}`,
        supplierName: 'محمد مياس',
        amountSent: hadi.transfersOutToMayas,
        purchasesReceivedValue: hadi.purchasesFromMayas,
        transferMethod: 'عبر البرنامج',
        notes: hadi.notes
      });
    }

    const prevQimmah = day.recharge?.qimmah;
    const qimmahWith = prevQimmah?.salesWithProfit || 0;
    const qimmahWithout = prevQimmah?.salesWithoutProfit || 0;

    return {
      ...day,
      recharge: {
        totalWithProfit: Math.round((hadi.sales + qimmahWith) * 100) / 100,
        totalWithoutProfit: Math.round((hadi.salesWithoutProfit + qimmahWithout) * 100) / 100,
        totalProfit: Math.round((hadi.profit + (qimmahWith - qimmahWithout)) * 100) / 100,
        hadi: {
          salesWithProfit: hadi.sales,
          salesWithoutProfit: hadi.salesWithoutProfit,
          transferredToApp: hadi.purchasesFromMayas,
          remainingInApp: hadi.closingBalance,
          notes: hadi.notes
        },
        qimmah: prevQimmah,
        generalNotes: hadi.notes
      },
      supplierTransfers: cleanSupplierTransfers
    };
  });

  // 2. Ensure all 49 days exist in the list
  const existingDates = new Set(updatedDays.map((d) => d.date));
  const missingDays: DayRecord[] = [];

  HADI_OFFICIAL_DAILY_RECORDS.forEach((hadi) => {
    if (!existingDates.has(hadi.date)) {
      const parts = hadi.date.split('-');
      const dayNum = parseInt(parts[2] || '1', 10);
      const isAugust = parts[1] === '08';
      const dayTitle = isAugust ? `يوم ${dayNum} شهر 8` : `يوم ${dayNum} شهر 9`;

      const transfers: SupplierTransferItem[] = [];
      if (hadi.transfersOutToMayas > 0 || hadi.purchasesFromMayas > 0) {
        transfers.push({
          id: `hadi-supp-${hadi.date}`,
          supplierName: 'محمد مياس',
          amountSent: hadi.transfersOutToMayas,
          purchasesReceivedValue: hadi.purchasesFromMayas,
          transferMethod: 'عبر البرنامج',
          notes: hadi.notes
        });
      }

      missingDays.push({
        id: `day-${hadi.date}`,
        dayNumber: isNaN(dayNum) ? 1 : dayNum,
        date: hadi.date,
        dayTitle,
        isClosed: false,
        notes: hadi.notes,
        accessories: [],
        phones: [],
        maintenance: [],
        recharge: {
          totalWithProfit: hadi.sales,
          totalWithoutProfit: hadi.salesWithoutProfit,
          totalProfit: hadi.profit,
          hadi: {
            salesWithProfit: hadi.sales,
            salesWithoutProfit: hadi.salesWithoutProfit,
            transferredToApp: hadi.purchasesFromMayas,
            remainingInApp: hadi.closingBalance,
            notes: hadi.notes
          },
          generalNotes: hadi.notes
        },
        returns: [],
        expenses: [],
        musabHouse: [],
        musabPersonal: [],
        workers: [],
        supplierTransfers: transfers
      });
    }
  });

  // Merge and sort chronologically
  const allDays = [...updatedDays, ...missingDays];
  allDays.sort((a, b) => a.date.localeCompare(b.date));
  return allDays;
}

// Generate official ledger transactions for the period 2026-08-01 through 2026-09-22
export function generateHadiOfficialTransactions(): Transaction[] {
  const txs: Transaction[] = [];

  HADI_OFFICIAL_DAILY_RECORDS.forEach((rec) => {
    // 1. Sales Transaction
    if (rec.sales > 0) {
      txs.push({
        id: `hadi-sale-${rec.date}`,
        date: rec.date,
        type: 'balance_hadi',
        category: 'رصيد وباقات',
        description: `مبيعات وتسديد رصيد تطبيق الهادي (${rec.sales.toLocaleString()} ر.ي بفائدة 7.5% = ${rec.profit.toLocaleString()} ر.ي)`,
        price: rec.sales,
        amount: rec.sales,
        cost: rec.salesWithoutProfit,
        profit: rec.profit,
        party: 'عملاء رصيد وباقات الهادي',
        customerName: 'عملاء رصيد وباقات الهادي',
        status: 'completed',
        notes: rec.notes
      });
    }

    // 2. Purchase / Top-up from Mayas
    if (rec.purchasesFromMayas > 0) {
      txs.push({
        id: `hadi-purchase-${rec.date}`,
        date: rec.date,
        type: 'purchase',
        category: 'رصيد وباقات',
        description: `تغذية رصيد/تأمين تطبيق الهادي مستلم من العميل: أبو البراء محمد خالد مياس (${rec.notes})`,
        price: rec.purchasesFromMayas,
        amount: rec.purchasesFromMayas,
        cost: rec.purchasesFromMayas,
        profit: 0,
        paidAmount: rec.purchasesFromMayas,
        remainingAmount: 0,
        destinationCategory: 'balance_topup',
        party: 'محمد مياس (تطبيق الهادي)',
        supplierName: 'محمد مياس (تطبيق الهادي)',
        status: 'completed',
        notes: rec.notes
      });
    }

    // 3. Transfer sent to Mayas
    if (rec.transfersOutToMayas > 0) {
      txs.push({
        id: `hadi-transfer-${rec.date}`,
        date: rec.date,
        type: 'transfer_mohammed_mayas',
        category: 'حوالات موردين',
        description: `حوالة مسددة لمحمد مياس مقابل تغذية وتأمين رصيد الهادي (${rec.notes})`,
        price: rec.transfersOutToMayas,
        amount: rec.transfersOutToMayas,
        cost: rec.transfersOutToMayas,
        profit: 0,
        paidAmount: rec.transfersOutToMayas,
        remainingAmount: 0,
        party: 'محمد مياس (تطبيق الهادي)',
        supplierName: 'محمد مياس (تطبيق الهادي)',
        status: 'completed',
        notes: rec.notes
      });
    }
  });

  return txs;
}
