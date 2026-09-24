import { DayRecord, SupplierSummary } from '../types';

export interface DayCalculations {
  accessoriesTotal: number;
  accessoriesCostTotal: number;
  accessoriesProfitTotal: number;
  accessoriesCount: number;
  
  phonesPaidTotal: number;
  phonesTotalSale: number;
  phonesRemainingTotal: number;
  phonesCostTotal: number;
  phonesProfitTotal: number;
  phonesCount: number;

  maintenanceTotal: number;
  maintenanceCostTotal: number;
  maintenanceProfitTotal: number;
  maintenanceCount: number;

  rechargeSalesWithProfit: number;
  rechargeSalesWithoutProfit: number;
  rechargeProfit: number;

  returnsTotal: number;
  returnsCount: number;

  // Gross Daily Income from customers
  grossDailyRevenue: number;

  // Total Estimated Daily Profit
  totalDailyEstimatedProfit: number;

  // Outflows / Outgoings
  expensesTotal: number;
  musabHouseTotal: number;
  musabPersonalTotal: number;
  workersTotal: number;
  hamdanTotal: number;
  engineerTotal: number;
  supplierTransfersTotal: number;
  
  totalOutflows: number;

  // Net Cash Balance for the Day (Cash generated minus direct daily payouts)
  netDayCashChange: number;
}

export function calculateDay(day: DayRecord): DayCalculations {
  if (day.isClosed) {
    return {
      accessoriesTotal: 0,
      accessoriesCostTotal: 0,
      accessoriesProfitTotal: 0,
      accessoriesCount: 0,
      phonesPaidTotal: 0,
      phonesTotalSale: 0,
      phonesRemainingTotal: 0,
      phonesCostTotal: 0,
      phonesProfitTotal: 0,
      phonesCount: 0,
      maintenanceTotal: 0,
      maintenanceCostTotal: 0,
      maintenanceProfitTotal: 0,
      maintenanceCount: 0,
      rechargeSalesWithProfit: 0,
      rechargeSalesWithoutProfit: 0,
      rechargeProfit: 0,
      returnsTotal: 0,
      returnsCount: 0,
      grossDailyRevenue: 0,
      totalDailyEstimatedProfit: 0,
      expensesTotal: 0,
      musabHouseTotal: 0,
      musabPersonalTotal: 0,
      workersTotal: 0,
      hamdanTotal: 0,
      engineerTotal: 0,
      supplierTransfersTotal: 0,
      totalOutflows: 0,
      netDayCashChange: 0,
    };
  }

  const accessoriesTotal = (day.accessories || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const accessoriesCostTotal = (day.accessories || []).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const accessoriesProfitTotal = (day.accessories || []).reduce((sum, item) => {
    if (item.profit !== undefined && item.profit !== null && !isNaN(Number(item.profit))) {
      return sum + Number(item.profit);
    }
    if (item.cost !== undefined && item.cost !== null) {
      return sum + Math.max(0, (Number(item.price) || 0) - Number(item.cost));
    }
    return sum;
  }, 0);
  const accessoriesCount = (day.accessories || []).length;

  const phonesPaidTotal = (day.phones || []).reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const phonesTotalSale = (day.phones || []).reduce((sum, item) => sum + (Number(item.salePrice) || 0), 0);
  const phonesRemainingTotal = (day.phones || []).reduce((sum, item) => sum + (Number(item.remainingAmount) || 0), 0);
  const phonesCostTotal = (day.phones || []).reduce((sum, item) => sum + (Number(item.purchaseCost) || 0), 0);
  const phonesProfitTotal = (day.phones || []).reduce((sum, item) => {
    if (item.profit !== undefined && item.profit !== null && !isNaN(Number(item.profit))) {
      return sum + Number(item.profit);
    }
    if (item.purchaseCost !== undefined && item.purchaseCost !== null) {
      return sum + Math.max(0, (Number(item.salePrice) || 0) - Number(item.purchaseCost));
    }
    return sum;
  }, 0);
  const phonesCount = (day.phones || []).length;

  const maintenanceTotal = (day.maintenance || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const maintenanceCostTotal = (day.maintenance || []).reduce((sum, item) => {
    const cost = Number(item.cost) || (Number(item.partCost || 0) + Number(item.laborCost || 0));
    return sum + cost;
  }, 0);
  const maintenanceProfitTotal = (day.maintenance || []).reduce((sum, item) => {
    if (item.profit !== undefined && item.profit !== null && !isNaN(Number(item.profit))) {
      return sum + Number(item.profit);
    }
    const cost = Number(item.cost) || (Number(item.partCost || 0) + Number(item.laborCost || 0));
    return sum + Math.max(0, (Number(item.price) || 0) - cost);
  }, 0);
  const maintenanceCount = (day.maintenance || []).length;

  const rechargeSalesWithProfit = Number(day.recharge?.totalWithProfit) || 0;
  const rechargeSalesWithoutProfit = Number(day.recharge?.totalWithoutProfit) || 0;
  const rechargeProfit = Number(day.recharge?.totalProfit) || (rechargeSalesWithProfit - rechargeSalesWithoutProfit);

  const returnsTotal = (day.returns || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const returnsCount = (day.returns || []).length;

  // Gross Daily Inflow from Sales & Services
  const grossDailyRevenue = accessoriesTotal + phonesPaidTotal + maintenanceTotal + rechargeSalesWithProfit;

  // Total Daily Estimated Profit (فائدة الرصيد + ربح الإكسسوارات + ربح الصيانة + ربح الجوالات)
  const totalDailyEstimatedProfit = rechargeProfit + accessoriesProfitTotal + maintenanceProfitTotal + phonesProfitTotal;

  // Outflows
  const expensesTotal = (day.expenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const musabHouseTotal = (day.musabHouse || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const musabPersonalTotal = (day.musabPersonal || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const hamdanTotal = (day.workers || [])
    .filter(w => w.workerName === 'حمدان')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const engineerTotal = (day.workers || [])
    .filter(w => w.workerName === 'المهندس')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const workersTotal = (day.workers || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const supplierTransfersTotal = (day.supplierTransfers || []).reduce((sum, item) => sum + (Number(item.amountSent) || 0), 0);

  const totalOutflows = returnsTotal + expensesTotal + musabHouseTotal + musabPersonalTotal + workersTotal + supplierTransfersTotal;
  const netDayCashChange = grossDailyRevenue - totalOutflows;

  return {
    accessoriesTotal,
    accessoriesCostTotal,
    accessoriesProfitTotal,
    accessoriesCount,
    phonesPaidTotal,
    phonesTotalSale,
    phonesRemainingTotal,
    phonesCostTotal,
    phonesProfitTotal,
    phonesCount,
    maintenanceTotal,
    maintenanceCostTotal,
    maintenanceProfitTotal,
    maintenanceCount,
    rechargeSalesWithProfit,
    rechargeSalesWithoutProfit,
    rechargeProfit,
    returnsTotal,
    returnsCount,
    grossDailyRevenue,
    totalDailyEstimatedProfit,
    expensesTotal,
    musabHouseTotal,
    musabPersonalTotal,
    workersTotal,
    hamdanTotal,
    engineerTotal,
    supplierTransfersTotal,
    totalOutflows,
    netDayCashChange,
  };
}

export interface PeriodSummary {
  daysCount: number;
  activeDaysCount: number;
  totalGrossRevenue: number;
  totalEstimatedProfit: number;
  totalAccessories: number;
  totalAccessoriesProfit: number;
  totalPhonesPaid: number;
  totalPhonesSales: number;
  totalPhonesDebt: number; // Remaining
  totalPhonesProfit: number;
  totalMaintenance: number;
  totalMaintenanceProfit: number;
  totalRechargeWithProfit: number;
  totalRechargeWithoutProfit: number;
  totalRechargeProfit: number;
  totalReturns: number;
  totalExpenses: number;
  totalMusabHouse: number;
  totalMusabPersonal: number;
  totalHamdan: number;
  totalEngineer: number;
  totalWorkers: number;
  totalSupplierTransfers: number;
  totalOutflows: number;
  netCashFlow: number;
  musabPurchasingCashFromBox: number; // 217000 (150,000 cash via Bassem + 67,000 Jawali)
  counterfeitCashLoss: number; // 4000 (عملة ورقية تالفة ومزورة تم استبعادها من الصندوق)
  netCashAfterMusabPurchasing: number; // Net shop cash after deducting Musab's purchasing cash
  netCashFinalInBox: number; // Net actual cash remaining in cash box after all deductions (Musab advance + counterfeit cash)
  supplierSummaries: Record<string, SupplierSummary>;
}

export function calculatePeriodSummary(days: DayRecord[]): PeriodSummary {
  const summary: PeriodSummary = {
    daysCount: days.length,
    activeDaysCount: days.filter(d => !d.isClosed).length,
    totalGrossRevenue: 0,
    totalEstimatedProfit: 0,
    totalAccessories: 0,
    totalAccessoriesProfit: 0,
    totalPhonesPaid: 0,
    totalPhonesSales: 0,
    totalPhonesDebt: 0,
    totalPhonesProfit: 0,
    totalMaintenance: 0,
    totalMaintenanceProfit: 0,
    totalRechargeWithProfit: 0,
    totalRechargeWithoutProfit: 0,
    totalRechargeProfit: 0,
    totalReturns: 0,
    totalExpenses: 0,
    totalMusabHouse: 0,
    totalMusabPersonal: 0,
    totalHamdan: 0,
    totalEngineer: 0,
    totalWorkers: 0,
    totalSupplierTransfers: 0,
    totalOutflows: 0,
    netCashFlow: 0,
    musabPurchasingCashFromBox: 217000, // 150,000 كاش + 67,000 جوالي
    counterfeitCashLoss: 4000, // 4,000 زلط تالفة ومزورة
    netCashAfterMusabPurchasing: 0,
    netCashFinalInBox: 0,
    supplierSummaries: {},
  };

  days.forEach(day => {
    const calc = calculateDay(day);
    summary.totalGrossRevenue += calc.grossDailyRevenue;
    summary.totalEstimatedProfit += calc.totalDailyEstimatedProfit;
    summary.totalAccessories += calc.accessoriesTotal;
    summary.totalAccessoriesProfit += calc.accessoriesProfitTotal;
    summary.totalPhonesPaid += calc.phonesPaidTotal;
    summary.totalPhonesSales += calc.phonesTotalSale;
    summary.totalPhonesDebt += calc.phonesRemainingTotal;
    summary.totalPhonesProfit += calc.phonesProfitTotal;
    summary.totalMaintenance += calc.maintenanceTotal;
    summary.totalMaintenanceProfit += calc.maintenanceProfitTotal;
    summary.totalRechargeWithProfit += calc.rechargeSalesWithProfit;
    summary.totalRechargeWithoutProfit += calc.rechargeSalesWithoutProfit;
    summary.totalRechargeProfit += calc.rechargeProfit;
    summary.totalReturns += calc.returnsTotal;
    summary.totalExpenses += calc.expensesTotal;
    summary.totalMusabHouse += calc.musabHouseTotal;
    summary.totalMusabPersonal += calc.musabPersonalTotal;
    summary.totalHamdan += calc.hamdanTotal;
    summary.totalEngineer += calc.engineerTotal;
    summary.totalWorkers += calc.workersTotal;
    summary.totalSupplierTransfers += calc.supplierTransfersTotal;
    summary.totalOutflows += calc.totalOutflows;
    summary.netCashFlow += calc.netDayCashChange;
  });

  summary.netCashAfterMusabPurchasing = summary.netCashFlow - summary.musabPurchasingCashFromBox;
  summary.netCashFinalInBox = summary.netCashAfterMusabPurchasing - summary.counterfeitCashLoss;

  days.forEach(day => {
    // Aggregate suppliers
    (day.supplierTransfers || []).forEach(st => {
      const name = st.supplierName || 'أخرى';
      if (!summary.supplierSummaries[name]) {
        summary.supplierSummaries[name] = {
          name,
          totalTransferred: 0,
          totalPurchases: 0,
          balance: 0,
          transferCount: 0,
          transactions: [],
        };
      }
      summary.supplierSummaries[name].totalTransferred += Number(st.amountSent) || 0;
      summary.supplierSummaries[name].totalPurchases += Number(st.purchasesReceivedValue) || 0;
      summary.supplierSummaries[name].balance += (Number(st.amountSent) || 0) - (Number(st.purchasesReceivedValue) || 0);
      summary.supplierSummaries[name].transferCount += 1;
      summary.supplierSummaries[name].transactions.push({
        dayNumber: day.dayNumber,
        date: day.date,
        amount: Number(st.amountSent) || 0,
        purchases: Number(st.purchasesReceivedValue) || 0,
        method: st.transferMethod,
        notes: st.notes,
      });
    });
  });

  return summary;
}

export function formatCurrency(amount: number | undefined | null): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('ar-YE', {
    maximumFractionDigits: 0,
  }).format(val) + ' ر.ي';
}

export function formatNumber(amount: number | undefined | null): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(val);
}
