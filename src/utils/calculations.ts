import { Transaction, DailySummary, MonthlySettlement } from '../types';
import { calculateProfitDistribution, getProfitSharingConfig } from './profitSharingEngine';

/**
 * Calculates a detailed DailySummary for a given date
 */
export function calculateDailySummary(date: string, transactions: Transaction[]): DailySummary {
  const dayTx = transactions.filter((t) => t.date === date);

  let totalSales = 0;
  let totalCost = 0;
  let totalGrossProfit = 0;

  let phonesProfit = 0;
  let accessoriesProfit = 0;
  let balanceHadiProfit = 0;
  let balanceQimmaProfit = 0;
  let simsProfit = 0;

  let maintenanceTotal = 0;
  let maintenanceCost = 0;

  let shopExpenses = 0;
  let engineerExpenses = 0;
  let workerExpenses = 0;
  let modemExpenses = 0;
  let mosaabHomeExpenses = 0;
  let mosaabWithdrawals = 0;
  let engineerWithdrawals = 0;
  let workerSettlement = 0;

  let totalCashIn = 0;
  let totalCashOut = 0;

  dayTx.forEach((tx) => {
    switch (tx.type) {
      case 'sale':
        totalSales += tx.price;
        totalCost += tx.cost;
        totalGrossProfit += tx.profit;
        totalCashIn += tx.price;
        if (tx.category === 'phones') {
          phonesProfit += tx.profit;
        } else {
          accessoriesProfit += tx.profit;
        }
        break;

      case 'maintenance':
        maintenanceTotal += tx.price;
        maintenanceCost += tx.cost;
        totalCashIn += tx.price;
        break;

      case 'balance_hadi':
        totalSales += tx.price;
        totalCost += tx.cost;
        balanceHadiProfit += tx.profit;
        totalGrossProfit += tx.profit;
        totalCashIn += tx.price;
        break;

      case 'balance_qimma':
        totalSales += tx.price;
        totalCost += tx.cost;
        balanceQimmaProfit += tx.profit;
        totalGrossProfit += tx.profit;
        totalCashIn += tx.price;
        break;

      case 'sim':
        totalSales += tx.price;
        totalCost += tx.cost;
        simsProfit += tx.profit;
        totalGrossProfit += tx.profit;
        totalCashIn += tx.price;
        break;

      case 'purchase':
        totalCost += tx.price;
        totalCashOut += tx.price;
        break;

      case 'expense_shop':
      case 'shop_tools_outflow':
      case 'expense_internet_shop':
      case 'expense_work':
        shopExpenses += tx.price;
        totalCashOut += tx.price;
        break;

      case 'expense_home_mosaab':
      case 'withdrawal_home':
        mosaabHomeExpenses += tx.price;
        totalCashOut += tx.price;
        break;

      case 'withdrawal_mosaab':
      case 'withdrawal_personal':
      case 'purchases_home_mosaab':
      case 'mosaab_balance_topup':
        mosaabWithdrawals += tx.price;
        totalCashOut += tx.price;
        break;

      case 'mosaab_purchases_fund':
      case 'mosaab_bank_deposit_customer':
      case 'withdrawal_store_support':
      case 'transfer_mohammed_mayas':
      case 'transfer_khalil_aghbari':
      case 'transfer_omar_qasimi':
      case 'transfer_musannaf':
      case 'transfer_new_supplier':
        totalCashOut += tx.price;
        break;

      case 'expense_engineer':
        engineerExpenses += tx.price;
        totalCashOut += tx.price;
        break;

      case 'withdrawal_engineer':
      case 'withdrawal_engineer_third':
        engineerWithdrawals += tx.price;
        totalCashOut += tx.price;
        break;

      case 'expense_worker':
        workerExpenses += tx.price;
        totalCashOut += tx.price;
        break;

      case 'withdrawal_worker':
        workerSettlement += tx.price;
        totalCashOut += tx.price;
        break;

      case 'expense_modem':
        modemExpenses += tx.price;
        totalCashOut += tx.price;
        break;

      case 'damaged':
        totalCost += tx.cost || tx.price;
        break;
    }
  });

  // Calculate active profit sharing rules
  const profitConfig = getProfitSharingConfig();
  const profitSharingResult = calculateProfitDistribution(dayTx, profitConfig, 1);

  // Maintenance split based on active profit-sharing model
  const maintenanceNetProfit = Math.max(0, maintenanceTotal - maintenanceCost);
  const engineerShare = profitSharingResult.engineerGrossTotal;
  const shopMaintenanceShare = Math.max(0, maintenanceNetProfit - profitSharingResult.engineerMaintenanceShare);

  // Shared Deductions from the Shop Head (راس أرباح المحل):
  const sharedDeductions = profitSharingResult.totalOperatingExpenses;

  // Net Distributable Profit
  const netDistributableProfit = profitSharingResult.netDistributableProfit;

  // Profit Split: Mosaab (Shop Owner) & Worker/Engineer
  const mosaabShare = profitSharingResult.shopNetPayout;
  const managerShare = profitSharingResult.engineerShopShare;

  // Deduct Mosaab's personal expenses from his share
  const mosaabNetBalance = Math.max(0, mosaabShare - mosaabHomeExpenses - mosaabWithdrawals);

  // Engineer net balance for day = engineer net payout (after deductions)
  const engineerNetForDay = profitSharingResult.engineerNetPayout;

  const netCashDrawer = totalCashIn - totalCashOut;

  return {
    date,
    totalSales,
    totalCost,
    totalGrossProfit,
    phonesProfit,
    accessoriesProfit,
    balanceHadiProfit,
    balanceQimmaProfit,
    simsProfit,
    maintenanceTotal,
    maintenanceCost,
    maintenanceNetProfit,
    engineerShare,
    shopMaintenanceShare,
    shopExpenses,
    engineerExpenses,
    workerExpenses,
    modemExpenses,
    totalSharedDeductions: sharedDeductions,
    netDistributableProfit,
    mosaabShare,
    managerShare,
    mosaabHomeExpenses,
    mosaabWithdrawals,
    mosaabNetBalance,
    engineerWithdrawals,
    engineerNetForDay,
    workerSettlement,
    totalCashIn,
    totalCashOut,
    netCashDrawer,
    profitSharingResult,
  };
}

/**
 * Groups all transactions by unique dates sorted descending
 */
export function getUniqueDates(transactions: Transaction[]): string[] {
  const dates = Array.from(new Set(transactions.map((t) => t.date)));
  return dates.sort((a, b) => b.localeCompare(a));
}

/**
 * Calculates monthly settlements from transactions
 */
export function calculateMonthlySettlement(
  monthKey: string, // YYYY-MM
  transactions: Transaction[]
): MonthlySettlement {
  const monthTx = transactions.filter((t) => t.date.startsWith(monthKey));
  const uniqueDays = getUniqueDates(monthTx);

  let totalSales = 0;
  let totalPurchases = 0;
  let totalExpenses = 0;
  let totalGrossProfit = 0;
  let totalMaintenance = 0;
  let engineerTotalShare = 0;
  let engineerTotalWithdrawals = 0;
  let workerTotalPaid = 0;
  let shopNetDistributable = 0;
  let mosaabTotalShare = 0;
  let managerTotalShare = 0;
  let mosaabTotalHomeExpenses = 0;
  let mosaabTotalWithdrawals = 0;
  let closingCashInDrawer = 0;

  uniqueDays.forEach((d) => {
    const summary = calculateDailySummary(d, monthTx);
    totalSales += summary.totalSales;
    totalGrossProfit += summary.totalGrossProfit;
    totalMaintenance += summary.maintenanceTotal;
    engineerTotalShare += summary.engineerShare;
    engineerTotalWithdrawals += summary.engineerWithdrawals;
    workerTotalPaid += summary.workerExpenses + summary.workerSettlement;
    shopNetDistributable += summary.netDistributableProfit;
    mosaabTotalShare += summary.mosaabShare;
    managerTotalShare += summary.managerShare;
    mosaabTotalHomeExpenses += summary.mosaabHomeExpenses;
    mosaabTotalWithdrawals += summary.mosaabWithdrawals;
    closingCashInDrawer += summary.netCashDrawer;
  });

  monthTx.forEach((tx) => {
    if (tx.type === 'purchase') {
      totalPurchases += tx.price;
    }
    if (tx.type.startsWith('expense_') || tx.type === 'shop_tools_outflow') {
      totalExpenses += tx.price;
    }
  });

  const [year, month] = monthKey.split('-');
  const monthNames = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = `${monthNames[monthIndex] || month} ${year}`;

  // Month-wide profit distribution according to active config
  const profitConfig = getProfitSharingConfig();
  const profitSharingResult = calculateProfitDistribution(monthTx, profitConfig, uniqueDays.length);

  // Synchronize with profit sharing result if available
  const engineerRemaining = profitSharingResult
    ? profitSharingResult.engineerNetPayout
    : Math.max(0, engineerTotalShare - engineerTotalWithdrawals);

  const mosaabFinalPayable = profitSharingResult
    ? (profitSharingResult.mosaabFinalNet ?? Math.max(0, profitSharingResult.shopNetPayout - mosaabTotalHomeExpenses - mosaabTotalWithdrawals))
    : Math.max(0, mosaabTotalShare - mosaabTotalHomeExpenses - mosaabTotalWithdrawals);

  return {
    monthKey,
    monthName,
    daysCount: uniqueDays.length,
    totalSales,
    totalPurchases,
    totalExpenses,
    totalGrossProfit,
    totalMaintenance,
    engineerTotalShare,
    engineerTotalWithdrawals,
    engineerRemaining,
    workerTotalPaid,
    shopNetDistributable,
    mosaabTotalShare,
    managerTotalShare,
    mosaabTotalHomeExpenses,
    mosaabTotalWithdrawals,
    mosaabFinalPayable,
    closingCashInDrawer,
    profitSharingResult,
  };
}

/**
 * Calculates settlements for any arbitrary list of transactions across any date range or all days
 */
export function calculatePeriodSettlement(
  periodTransactions: Transaction[],
  periodLabel: string = 'كافة الأيام'
): MonthlySettlement {
  const uniqueDays = getUniqueDates(periodTransactions);

  let totalSales = 0;
  let totalPurchases = 0;
  let totalExpenses = 0;
  let totalGrossProfit = 0;
  let totalMaintenance = 0;
  let engineerTotalShare = 0;
  let engineerTotalWithdrawals = 0;
  let workerTotalPaid = 0;
  let shopNetDistributable = 0;
  let mosaabTotalShare = 0;
  let managerTotalShare = 0;
  let mosaabTotalHomeExpenses = 0;
  let mosaabTotalWithdrawals = 0;
  let closingCashInDrawer = 0;

  uniqueDays.forEach((d) => {
    const summary = calculateDailySummary(d, periodTransactions);
    totalSales += summary.totalSales;
    totalGrossProfit += summary.totalGrossProfit;
    totalMaintenance += summary.maintenanceTotal;
    engineerTotalShare += summary.engineerShare;
    engineerTotalWithdrawals += summary.engineerWithdrawals;
    workerTotalPaid += summary.workerExpenses + summary.workerSettlement;
    shopNetDistributable += summary.netDistributableProfit;
    mosaabTotalShare += summary.mosaabShare;
    managerTotalShare += summary.managerShare;
    mosaabTotalHomeExpenses += summary.mosaabHomeExpenses;
    mosaabTotalWithdrawals += summary.mosaabWithdrawals;
    closingCashInDrawer += summary.netCashDrawer;
  });

  periodTransactions.forEach((tx) => {
    if (tx.type === 'purchase') {
      totalPurchases += tx.price;
    }
    if (tx.type.startsWith('expense_') || tx.type === 'shop_tools_outflow') {
      totalExpenses += tx.price;
    }
  });

  const profitConfig = getProfitSharingConfig();
  const profitSharingResult = calculateProfitDistribution(periodTransactions, profitConfig, uniqueDays.length);

  const engineerRemaining = profitSharingResult
    ? profitSharingResult.engineerNetPayout
    : Math.max(0, engineerTotalShare - engineerTotalWithdrawals);

  const mosaabFinalPayable = profitSharingResult
    ? (profitSharingResult.mosaabFinalNet ?? Math.max(0, profitSharingResult.shopNetPayout - mosaabTotalHomeExpenses - mosaabTotalWithdrawals))
    : Math.max(0, mosaabTotalShare - mosaabTotalHomeExpenses - mosaabTotalWithdrawals);

  return {
    monthKey: 'period',
    monthName: periodLabel,
    daysCount: uniqueDays.length,
    totalSales,
    totalPurchases,
    totalExpenses,
    totalGrossProfit,
    totalMaintenance,
    engineerTotalShare,
    engineerTotalWithdrawals,
    engineerRemaining,
    workerTotalPaid,
    shopNetDistributable,
    mosaabTotalShare,
    managerTotalShare,
    mosaabTotalHomeExpenses,
    mosaabTotalWithdrawals,
    mosaabFinalPayable,
    closingCashInDrawer,
    profitSharingResult,
  };
}

/**
 * Format currency with Yemeni Rial (ر.ي) or formatted number
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ر.ي';
  return `${new Intl.NumberFormat('ar-YE').format(Math.round(amount))} ر.ي`;
}

export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('ar-YE').format(Math.round(amount));
}
