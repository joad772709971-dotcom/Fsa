const fs = require('fs');
const path = require('path');
const rawTx = require('./hadi_parsed.json');

const initialOpeningBalance = 2037.30;

const daysOrder = [];
const dayMap = {};

rawTx.forEach((tx, idx) => {
  if (!dayMap[tx.date]) {
    daysOrder.push(tx.date);
    dayMap[tx.date] = {
      date: tx.date,
      transactions: [],
      purchasesFromMayas: 0,
      otherPurchasesOrDeposits: 0,
      totalCredits: 0,
      sales: 0,
      transfersOutToMayas: 0,
      otherDebits: 0,
      openingBalance: 0,
      closingBalance: 0
    };
  }
  const d = dayMap[tx.date];
  const enhancedTx = {
    ...tx,
    id: `hadi_tx_${idx + 1}`
  };
  d.transactions.push(enhancedTx);

  if (tx.type === 'له') {
    d.totalCredits += tx.amount;
    if (tx.isMayasPurchase) {
      d.purchasesFromMayas += tx.amount;
    } else {
      d.otherPurchasesOrDeposits += tx.amount;
    }
  } else if (tx.type === 'عليه') {
    if (tx.isMayasTransferOut) {
      d.transfersOutToMayas += tx.amount;
    } else {
      d.sales += tx.amount;
    }
  }
});

let currentBal = initialOpeningBalance;

daysOrder.forEach((dateStr) => {
  const d = dayMap[dateStr];
  d.openingBalance = currentBal;
  const lastTx = d.transactions[d.transactions.length - 1];
  d.closingBalance = lastTx ? lastTx.balanceAfter : currentBal;
  currentBal = d.closingBalance;
});

const tsContent = `// Real Telecom & Mayas Statement Data (الهادي أونلاين - محمد مياس)
// 679 transactions from 2026-08-01 through 2026-09-14
// Official Statement Totals: 602,411.10 عليه | 622,537.30 له | 20,126.20 رصيد

export interface HadiTransaction {
  id: string;
  page: number;
  date: string;
  description: string;
  amount: number;
  type: 'له' | 'عليه';
  balanceAfter: number;
  phone?: string;
  isMayasPurchase?: boolean;
  isMayasTransferOut?: boolean;
}

export interface HadiDailyBalanceSummary {
  date: string;
  openingBalance: number;              // كم كان في البرنامج باقي (رصيد الافتتاح)
  purchasesFromMayas: number;          // كم اشتريت من محمد مياس (تغذية رصيد)
  otherPurchasesOrDeposits: number;    // إيداعات وتأمينات أخرى
  totalCredits: number;                // إجمالي الوارد (له)
  sales: number;                       // كم بعت (تسديد رصيد، باقات، يمن فورجي)
  transfersOutToMayas: number;         // تحويلات خارجة لمياس
  otherDebits: number;
  closingBalance: number;              // كم باقي في البرنامج في نهاية اليوم
  transactionsCount: number;
  transactions: HadiTransaction[];
}

export const INITIAL_HADI_OPENING_BALANCE = ${initialOpeningBalance};

export const HADI_STATEMENT_TRANSACTIONS: HadiTransaction[] = ${JSON.stringify(rawTx.map((t, idx) => ({
  id: `hadi_tx_${idx + 1}`,
  page: t.page,
  date: t.date,
  description: t.description,
  amount: t.amount,
  type: t.type,
  balanceAfter: t.balanceAfter,
  phone: t.phone || '',
  isMayasPurchase: !!t.isMayasPurchase,
  isMayasTransferOut: !!t.isMayasTransferOut
})), null, 2)};

export const HADI_DAILY_SUMMARIES: HadiDailyBalanceSummary[] = ${JSON.stringify(daysOrder.map(date => {
  const d = dayMap[date];
  return {
    date: d.date,
    openingBalance: Math.round(d.openingBalance * 100) / 100,
    purchasesFromMayas: Math.round(d.purchasesFromMayas * 100) / 100,
    otherPurchasesOrDeposits: Math.round(d.otherPurchasesOrDeposits * 100) / 100,
    totalCredits: Math.round(d.totalCredits * 100) / 100,
    sales: Math.round(d.sales * 100) / 100,
    transfersOutToMayas: Math.round(d.transfersOutToMayas * 100) / 100,
    otherDebits: Math.round(d.otherDebits * 100) / 100,
    closingBalance: Math.round(d.closingBalance * 100) / 100,
    transactionsCount: d.transactions.length,
    transactions: d.transactions
  };
}), null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/hadiStatementData.ts'), tsContent);
console.log('Successfully re-generated src/data/hadiStatementData.ts with detailed fields');
