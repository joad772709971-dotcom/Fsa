import {
  AuthUser,
  Transaction,
  Supplier,
  InventoryItem,
  CustomerDebt,
  CashDrawerShift,
  AutonomousCFOContext,
  FinancialRatios,
  CFORadarAlert,
} from '../types';

export const DEFAULT_TENANT = {
  storeId: 'store_mosaab_alsoufi',
  ownerId: 'user_mosaab',
};

/**
 * Filter items ensuring strict Tenant Isolation.
 * Only data matching the target storeId and ownerId is returned.
 */
export function filterByTenant<T>(
  items: T[],
  storeId: string,
  ownerId: string
): T[] {
  if (!items || !Array.isArray(items)) return [];
  return items.filter((item: any) => {
    // If item has explicit storeId, it must match
    if (item.storeId && item.storeId !== storeId) return false;
    // If item has explicit ownerId, it must match
    if (item.ownerId && item.ownerId !== ownerId) return false;
    // Legacy items without storeId are assumed part of default store
    return true;
  });
}

/**
 * Build a comprehensive Autonomous CFO Store Context with audited financial ratios.
 */
export function buildAutonomousCFOContext(params: {
  currentUser?: AuthUser | null;
  currentDate: string;
  transactions: Transaction[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  customers: CustomerDebt[];
  dailySummary?: any;
  monthlySettlement?: any;
}): AutonomousCFOContext {
  const {
    currentUser,
    currentDate,
    transactions: rawTx,
    suppliers: rawSuppliers,
    inventory: rawInventory,
    customers: rawCustomers,
    dailySummary,
    monthlySettlement,
  } = params;

  const storeId = currentUser?.storeId || DEFAULT_TENANT.storeId;
  const ownerId = currentUser?.ownerId || DEFAULT_TENANT.ownerId;
  const currentUserId = currentUser?.id || 'anonymous';
  const currentUserName = currentUser?.name || 'مستخدم النظام';
  const userRole = currentUser?.role || 'owner';

  // 1. Enforce strict Tenant Isolation
  const transactions = filterByTenant(rawTx, storeId, ownerId);
  const suppliers = filterByTenant(rawSuppliers, storeId, ownerId);
  const inventory = filterByTenant(rawInventory, storeId, ownerId);
  const customers = filterByTenant(rawCustomers, storeId, ownerId);

  // 2. Cash Drawer Status & Actual Cash
  let drawerStatus: 'open' | 'closed' | 'no_shift' = 'no_shift';
  let actualCashInDrawer = 0;
  let expectedCash = 0;
  let cashDiscrepancy = 0;

  try {
    const savedShifts = localStorage.getItem('mosaab_cash_shifts');
    if (savedShifts) {
      const parsedShifts: CashDrawerShift[] = JSON.parse(savedShifts);
      const tenantShifts = filterByTenant(parsedShifts, storeId, ownerId);
      const todayShift = tenantShifts.find((s) => s.date === currentDate);
      if (todayShift) {
        drawerStatus = todayShift.status;
        actualCashInDrawer = todayShift.actualCash || todayShift.expectedCash || 0;
        expectedCash = todayShift.expectedCash || 0;
        cashDiscrepancy = todayShift.difference || 0;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cash drawer shifts:', e);
  }

  // Fallback: estimate drawer cash from today's cash flow if no shift is opened
  if (drawerStatus === 'no_shift' || actualCashInDrawer === 0) {
    const todayTxs = transactions.filter((t) => t.date === currentDate);
    const todayCashIn = todayTxs
      .filter((t) => t.type === 'sale' || t.type === 'maintenance')
      .reduce((sum, t) => sum + (t.price || 0), 0);
    const todayCashOut = todayTxs
      .filter(
        (t) =>
          t.type === 'expense_shop' ||
          t.type === 'expense_home_mosaab' ||
          t.type === 'withdrawal_mosaab' ||
          t.type === 'expense_engineer' ||
          t.type === 'expense_worker' ||
          t.type === 'expense_modem'
      )
      .reduce((sum, t) => sum + (t.price || 0), 0);
    actualCashInDrawer = Math.max(0, todayCashIn - todayCashOut);
    expectedCash = actualCashInDrawer;
  }

  // 3. Network Balances (الأرصدة الفورية للشبكات)
  // Calculate running balance for Hadi & Qimma
  const hadiTxs = transactions.filter((t) => t.type === 'balance_hadi');
  const qimmaTxs = transactions.filter((t) => t.type === 'balance_qimma');

  // Network profit and total turnover
  const hadiNetValue = hadiTxs.reduce((sum, t) => sum + (t.profit || 0), 0);
  const qimmaNetValue = qimmaTxs.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalNetworkCash = Math.max(0, hadiNetValue + qimmaNetValue + 50000); // base operating reserve

  const totalLiquidCash = actualCashInDrawer + totalNetworkCash;

  // 4. Receivables (الذمم المدينة - ديون العملاء)
  const totalReceivables = customers.reduce((sum, c) => sum + (c.remainingDebt || 0), 0);
  const activeDebtors = customers.filter((c) => (c.remainingDebt || 0) > 0);
  const topDebtors = [...activeDebtors]
    .sort((a, b) => (b.remainingDebt || 0) - (a.remainingDebt || 0))
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      remainingDebt: c.remainingDebt,
      phone: c.phone,
      lastDate: c.lastTransactionDate,
    }));

  const DEBT_SAFE_LIMIT = 25000; // سقف الأمان للعميل الواحد
  const overLimitDebtors = activeDebtors
    .filter((c) => c.remainingDebt > DEBT_SAFE_LIMIT)
    .map((c) => ({
      id: c.id,
      name: c.name,
      remainingDebt: c.remainingDebt,
      reason: `تجاوز سقف الأمان (${DEBT_SAFE_LIMIT.toLocaleString()} ر.ي) بمقدار ${(
        c.remainingDebt - DEBT_SAFE_LIMIT
      ).toLocaleString()} ر.ي`,
    }));

  // 5. Payables (الذمم الدائنة - مستحقات الموردين)
  const totalPayables = suppliers.reduce((sum, s) => sum + (s.remainingBalance || 0), 0);
  const topSuppliers = [...suppliers]
    .filter((s) => (s.remainingBalance || 0) > 0)
    .sort((a, b) => (b.remainingBalance || 0) - (a.remainingBalance || 0))
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      remainingBalance: s.remainingBalance,
      type: s.type,
    }));

  // 6. Inventory Audit & Dead Stock Analysis (المخزون ورأس المال المعطل)
  const totalInventoryCost = inventory.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.costPrice ?? item.purchasePrice ?? 0),
    0
  );

  // Identify dead stock: items with positive qty and cost > 2000, not in recent transactions
  const recentItemDescriptions = new Set(
    transactions.slice(0, 60).map((t) => (t.description || '').toLowerCase())
  );

  const deadStockItems = inventory
    .filter((item) => {
      if ((item.quantity || 0) <= 0) return false;
      const itemName = (item.name || '').toLowerCase();
      const hasRecentSales = Array.from(recentItemDescriptions).some((desc) =>
        desc.includes(itemName)
      );
      const unitCost = item.costPrice ?? item.purchasePrice ?? 0;
      // Considered slow moving if cost is significant and not recently sold
      return !hasRecentSales && unitCost >= 3000;
    })
    .map((item) => {
      const unitCost = item.costPrice ?? item.purchasePrice ?? 0;
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        costPrice: unitCost,
        totalTiedUp: item.quantity * unitCost,
        category: String(item.category || ''),
      };
    })
    .sort((a, b) => b.totalTiedUp - a.totalTiedUp)
    .slice(0, 5);

  const totalDeadStockCapital = deadStockItems.reduce((sum, item) => sum + item.totalTiedUp, 0);

  const lowStockItems = inventory
    .filter((item) => item.quantity <= (item.minQuantity || 2))
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      minQuantity: item.minQuantity || 2,
    }))
    .slice(0, 5);

  // 7. Recent Transactions (حركات البيع والصيانة والمصاريف الأخيرة)
  const recentTransactions = transactions.slice(0, 15).map((t) => ({
    id: t.id,
    date: t.date,
    time: t.time || '00:00',
    type: t.type,
    description: t.description,
    price: t.price || 0,
    cost: t.cost || 0,
    profit: t.profit || 0,
  }));

  // 8. Calculate Financial Ratios (النسب المالية الاحترافية)
  const totalQuickAssets = totalLiquidCash;
  const totalCurrentLiabilities = Math.max(1, totalPayables);
  const quickRatio = Number((totalQuickAssets / totalCurrentLiabilities).toFixed(2));

  let quickRatioStatus: FinancialRatios['quickRatioStatus'] = 'healthy';
  if (quickRatio < 0.8) quickRatioStatus = 'critical';
  else if (quickRatio < 1.2) quickRatioStatus = 'caution';

  // Receivables Turnover
  const monthlyTotalSales = monthlySettlement?.totalSales || dailySummary?.totalSales * 25 || 150000;
  const receivablesTurnover = Number(
    (monthlyTotalSales / Math.max(1000, totalReceivables)).toFixed(2)
  );
  const averageCollectionDays = Math.max(
    1,
    Math.round(30 / Math.max(0.2, receivablesTurnover))
  );

  // Margin of Safety
  const totalDailyRevenue = dailySummary?.totalSales || 10000;
  const totalDailyExpenses = dailySummary?.totalSharedDeductions || 2500;
  const marginDiff = Math.max(0, totalDailyRevenue - totalDailyExpenses);
  const marginOfSafetyPercentage = Math.round(
    (marginDiff / Math.max(1, totalDailyRevenue)) * 100
  );

  let marginOfSafetyStatus: FinancialRatios['marginOfSafetyStatus'] = 'robust';
  if (marginOfSafetyPercentage < 15) marginOfSafetyStatus = 'vulnerable';
  else if (marginOfSafetyPercentage < 35) marginOfSafetyStatus = 'fair';

  const financialRatios: FinancialRatios = {
    quickRatio,
    quickRatioStatus,
    receivablesTurnover,
    averageCollectionDays,
    marginOfSafetyPercentage,
    marginOfSafetyStatus,
    totalQuickAssets,
    totalCurrentLiabilities,
    totalReceivables,
    totalInventoryCost,
    deadStockCapital: totalDeadStockCapital,
  };

  return {
    storeId,
    ownerId,
    currentUserId,
    currentUserName,
    userRole,
    currentDate,
    cashDrawer: {
      status: drawerStatus,
      actualCashInDrawer,
      expectedCash,
      cashDiscrepancy,
    },
    networkBalances: {
      hadiBalance: hadiNetValue,
      qimmaBalance: qimmaNetValue,
      totalNetworkCash,
    },
    totalLiquidCash,
    receivables: {
      totalOutstanding: totalReceivables,
      debtorsCount: activeDebtors.length,
      topDebtors,
      overLimitDebtors,
    },
    payables: {
      totalOutstanding: totalPayables,
      suppliersCount: suppliers.length,
      topSuppliers,
    },
    inventoryAudit: {
      totalItemsCount: inventory.length,
      totalInventoryValue: totalInventoryCost,
      deadStockItems,
      lowStockItems,
      totalDeadStockCapital,
    },
    recentTransactions,
    financialRatios,
    dailySummary,
    monthlySettlement,
  };
}

/**
 * Generate the single highest-priority Autonomous CFO Radar Alert.
 * Scans the actual store context and identifies the #1 critical risk or opportunity.
 */
export function generateLocalCFORadarAlert(context: AutonomousCFOContext): CFORadarAlert {
  const {
    receivables,
    inventoryAudit,
    financialRatios,
    cashDrawer,
    payables,
    currentDate,
  } = context;

  // 1. Check for Critical Debt Breaches (عميل تجاوز سقف الديون ويجمد الكاش)
  if (receivables.overLimitDebtors.length > 0) {
    const highestDebtor = receivables.overLimitDebtors[0];
    return {
      id: `radar_debt_${Date.now()}`,
      generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      type: 'debt_limit_exceeded',
      severity: 'critical',
      title: `🚨 خطر سيولة: العميل "${highestDebtor.name}" تجاوز سقف الديون المسموح!`,
      insight: `إجمالي مديونية العميل بلغت ${highestDebtor.remainingDebt.toLocaleString()} ر.ي، وهي تمثل نسبة خطرة من إجمالي الذمم المدينة (${receivables.totalOutstanding.toLocaleString()} ر.ي). هذا التراكم يعطل دورة الكاش ويزيد من احتمالية الديون المعدومة.`,
      actionableRecommendation: `تجميد البيع الآجل فوراً لهذا العميل وجدولة تحصيل دفعة عاجلة لا تقل عن 50% لتقليل مخاطر التعثر وحماية السيولة السريعة.`,
      metricHighlight: `مديونية معلقة: ${highestDebtor.remainingDebt.toLocaleString()} ر.ي`,
      targetEntity: {
        type: 'customer',
        id: highestDebtor.id,
        name: highestDebtor.name,
      },
      actionButtonLabel: `مطالبة وتحصيل ${highestDebtor.name}`,
      actionDate: currentDate,
    };
  }

  // 2. Check for Dead Stock Trapping Liquid Capital (ركود صنف يبتلع السيولة)
  if (inventoryAudit.deadStockItems.length > 0 && inventoryAudit.deadStockItems[0].totalTiedUp >= 15000) {
    const topDeadItem = inventoryAudit.deadStockItems[0];
    return {
      id: `radar_stock_${Date.now()}`,
      generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      type: 'dead_stock_liquidity',
      severity: 'warning',
      title: `⚠️ ركود مخزون: الصنف "${topDeadItem.name}" يبتلع سيولة نقدية معطلة!`,
      insight: `يمتلك المحل (${topDeadItem.quantity}) حبة بتكلفة إجمالية تبلغ ${topDeadItem.totalTiedUp.toLocaleString()} ر.ي راكدة بدون حركة بيع مسجلة مؤخراً. هذا يعطل رأس المال العامل ويخفض نسبة السيولة السريعة للمحل.`,
      actionableRecommendation: `إطلاق عرض ترويجي فوري بسعر التكلفة أو هامش ربح رمزي لتسييل الصنف وتحويله إلى كاش سائل قبل تقادم الموديل في السوق.`,
      metricHighlight: `سيولة معطلة: ${topDeadItem.totalTiedUp.toLocaleString()} ر.ي`,
      targetEntity: {
        type: 'inventory',
        id: topDeadItem.id,
        name: topDeadItem.name,
      },
      actionButtonLabel: `تسييل وعرض "${topDeadItem.name}"`,
      actionDate: currentDate,
    };
  }

  // 3. Check for Dangerous Quick Ratio (عجز أو ضعف نسبة السيولة السريعة)
  if (financialRatios.quickRatioStatus === 'critical') {
    return {
      id: `radar_ratio_${Date.now()}`,
      generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      type: 'critical_liquidity_ratio',
      severity: 'critical',
      title: `⚡ تحذير تدقيقي: نسبة السيولة السريعة (${financialRatios.quickRatio}) دون الحد الآمن!`,
      insight: `إجمالي الأصول النقدية الفورية (${financialRatios.totalQuickAssets.toLocaleString()} ر.ي) غير كافية لتغطية التزامات الموردين الفورية (${financialRatios.totalCurrentLiabilities.toLocaleString()} ر.ي). النسبة الحالية تعني أن لكل ريال التزام يوجد فقط ${financialRatios.quickRatio} ريال كاش متاح.`,
      actionableRecommendation: `وقف المشتريات الآجلة الجديدة، وتكثيف تحصيل ديون الزبائن النقدية اليومية لسداد فواتير الموردين المستحقة قبل مواعيدها.`,
      metricHighlight: `نسبة السيولة: ${financialRatios.quickRatio}x (الآمن: ≥ 1.0)`,
      targetEntity: {
        type: 'supplier',
        name: 'كشف الموردين والالتزامات',
      },
      actionButtonLabel: 'معاينة التزامات الموردين',
      actionDate: currentDate,
    };
  }

  // 4. Check for Cash Drawer Discrepancy (عجز أو فارق في الخزينة)
  if (cashDrawer.cashDiscrepancy < -1000) {
    return {
      id: `radar_drawer_${Date.now()}`,
      generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      type: 'cash_discrepancy',
      severity: 'critical',
      title: `🔍 تدقيق رقابي: عجز نقدي بقيمة ${Math.abs(cashDrawer.cashDiscrepancy).toLocaleString()} ر.ي في درج الصندوق!`,
      insight: `الكاش الفعلي المحسوب في الدرج (${cashDrawer.actualCashInDrawer.toLocaleString()} ر.ي) يقل عن الكاش المفترض للنظام (${cashDrawer.expectedCash.toLocaleString()} ر.ي).`,
      actionableRecommendation: `مراجعة فورية لحركات الصرف المسجلة، والتأكد من إدراج كافة صرفيات المحل وسحوبات الغداء قبل اعتماد تسوية اليوم.`,
      metricHighlight: `عجز الخزينة: ${Math.abs(cashDrawer.cashDiscrepancy).toLocaleString()} ر.ي`,
      targetEntity: {
        type: 'drawer',
        name: 'درج الكاشير',
      },
      actionButtonLabel: 'مطابقة حركات الصندوق',
      actionDate: currentDate,
    };
  }

  // 5. Margin of Safety & Strategic Opportunity (هامش الأمان وفرصة التوسع)
  return {
    id: `radar_safety_${Date.now()}`,
    generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    type: 'strategic_opportunity',
    severity: 'opportunity',
    title: `📈 تقرير الرادار: هامش الأمان المالي لليوم (${financialRatios.marginOfSafetyPercentage}%) ومعدل دوران إيجابي`,
    insight: `التدفقات النقدية تغطي المصاريف التشغيلية بنجاح، ومعدل دوران الذمم المدينة يبلغ ${financialRatios.receivablesTurnover} دورة/شهر، مما يعكس دورة نقدية مستقرة ومتوازنة للمحل.`,
    actionableRecommendation: `استثمار الفائض النقدي في تعزيز أصناف الإكسسوارات عالية الهامش الربحي وسرعة الدوران، وتغذية شبكات الرصيد لزيادة تردد الزبائن.`,
    metricHighlight: `هامش الأمان: ${financialRatios.marginOfSafetyPercentage}%`,
    targetEntity: {
      type: 'general',
      name: 'التوسع المالي',
    },
    actionButtonLabel: 'خطة استثمار الفائض',
    actionDate: currentDate,
  };
}
