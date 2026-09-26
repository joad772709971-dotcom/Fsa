import { Transaction } from '../types';
import { ProfitSharingConfig, ProfitCalculationResult, ProfitSharingModelType } from '../types/profitSharing';

const STORAGE_KEY = 'mosaab_profit_sharing_config_v2';

export const DEFAULT_PROFIT_SHARING_CONFIG: ProfitSharingConfig = {
  activeModel: 'maintenance_half_plus_shop_share',

  expenseRules: {
    engineerFoodBearer: 'shop_pool',    // صرفة وأكل المهندس: على المحل من رأس الأرباح أولاً
    modemNetBearer: 'shared_half',      // خرج المودم والنت: مناصفة 50% على المحل و 50% على المهندس
    shopToolsBearer: 'shop_pool',       // مصاريف وتجهيزات المحل: من رأس أرباح المحل
  },

  model1: {
    deductExpensesFirst: true,          // تخصم الصرفة أولاً من رأس أرباح المحل
    engineerMaintenancePercent: 50,     // المهندس النص (50%) في الصيانة
    shopAdditionType: 'percentage',     // ومعه من أرباح المحل: إما نسبة أو معاش شهري
    shopAdditionPercent: 20,            // النسبة من أرباح المحل
    shopAdditionMonthlySalary: 60000,   // المعاش الشهري إن اختار معاشاً
  },

  model2: {
    deductExpensesFirst: true,          // تخصم الصرفة من رأس أرباح المحل كامل
    ratioPreset: 'third',               // إما الثلث أو النص
    customPercent: 33.33,
  },

  salaryModel: {
    monthlyAmount: 90000,               // 90,000 ريال شهرياً
    workingDaysPerMonth: 30,
    shopCoversExpenses: true,           // مع الخرج (المحل يتحمل الصرفة) أو بدون الخرج
  },

  qabalModel: {
    dailyTargetAmount: 10000,           // 10,000 ر.ي يومياً للمحل
    operatingExpensesBearer: 'shop',
  },

  partnershipModel: {
    deductExpensesFirst: true,
    ownerSharePercent: 50,              // شراكة بالنص
    partnerSharePercent: 50,
  },
};

/**
 * استرجاع إعدادات تقسيم الأرباح من التخزين المحلي
 */
export function getProfitSharingConfig(): ProfitSharingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFIT_SHARING_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFIT_SHARING_CONFIG,
      ...parsed,
      expenseRules: {
        ...DEFAULT_PROFIT_SHARING_CONFIG.expenseRules,
        ...(parsed?.expenseRules || {}),
      },
      model1: {
        ...DEFAULT_PROFIT_SHARING_CONFIG.model1,
        ...(parsed?.model1 || {}),
      },
      model2: {
        ...DEFAULT_PROFIT_SHARING_CONFIG.model2,
        ...(parsed?.model2 || {}),
      },
      salaryModel: {
        ...DEFAULT_PROFIT_SHARING_CONFIG.salaryModel,
        ...(parsed?.salaryModel || {}),
      },
      qabalModel: {
        ...DEFAULT_PROFIT_SHARING_CONFIG.qabalModel,
        ...(parsed?.qabalModel || {}),
      },
      partnershipModel: {
        ...DEFAULT_PROFIT_SHARING_CONFIG.partnershipModel,
        ...(parsed?.partnershipModel || {}),
      },
    };
  } catch (e) {
    console.error('Failed to load profit sharing config:', e);
    return DEFAULT_PROFIT_SHARING_CONFIG;
  }
}

/**
 * حفظ إعدادات تقسيم الأرباح في التخزين المحلي
 */
export function saveProfitSharingConfig(config: ProfitSharingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save profit sharing config:', e);
  }
}

/**
 * محرك الحسابات المالية فائق الدقة لتقسيم الأرباح
 * يضمن صحة الرياضيات ودقة المبالغ بالريال اليمني 100%
 */
export function calculateProfitDistribution(
  transactions: Transaction[],
  config: ProfitSharingConfig,
  customDaysCount?: number
): ProfitCalculationResult {
  // حساب عدد الأيام الفعلي بناء على الحركات
  const uniqueDates = new Set(transactions.map((t) => t.date).filter(Boolean));
  const daysCount = customDaysCount && customDaysCount > 0 ? customDaysCount : Math.max(1, uniqueDates.size);

  let grossSalesProfit = 0;
  let grossMaintenanceProfit = 0;
  let grossNetworksProfit = 0;

  let shopExpenses = 0;
  let dailyFoodLivingExpenses = 0;
  let modemNetExpenses = 0;
  let engineerWithdrawals = 0;
  let mosaabHomeExpenses = 0;
  let mosaabWithdrawals = 0;

  transactions.forEach((tx) => {
    switch (tx.type) {
      case 'sale':
        grossSalesProfit += tx.profit || 0;
        break;

      case 'maintenance':
        grossMaintenanceProfit += tx.profit || Math.max(0, (tx.price || 0) - (tx.cost || 0));
        break;

      case 'balance_hadi':
      case 'balance_qimma':
      case 'sim':
        grossNetworksProfit += tx.profit || 0;
        break;

      case 'expense_shop':
      case 'shop_tools_outflow':
      case 'expense_internet_shop':
      case 'expense_work':
        shopExpenses += tx.price || 0;
        break;

      case 'expense_engineer':
      case 'expense_worker':
        dailyFoodLivingExpenses += tx.price || 0;
        break;

      case 'expense_modem':
        modemNetExpenses += tx.price || 0;
        break;

      case 'withdrawal_engineer':
      case 'withdrawal_engineer_third':
      case 'withdrawal_worker':
        engineerWithdrawals += tx.price || 0;
        break;

      case 'expense_home_mosaab':
      case 'withdrawal_home':
        mosaabHomeExpenses += tx.price || 0;
        break;

      case 'withdrawal_mosaab':
      case 'withdrawal_personal':
      case 'purchases_home_mosaab':
      case 'mosaab_balance_topup':
        mosaabWithdrawals += tx.price || 0;
        break;

      default:
        break;
    }
  });

  // إجمالي الأرباح قبل الخصم
  const totalGrossProfit = Math.round(grossSalesProfit + grossMaintenanceProfit + grossNetworksProfit);

  // إجمالي الصرفة والخرج والمصروفات العامة
  const totalOperatingExpenses = Math.round(shopExpenses + dailyFoodLivingExpenses + modemNetExpenses);

  // استخراج وتطبيق قواعد توزيع المصاريف
  const rules = config.expenseRules || DEFAULT_PROFIT_SHARING_CONFIG.expenseRules;

  // 1. توزيع صرفة ومعيشة المهندس/العامل
  let foodShopShare = 0;
  let foodEngineerShare = 0;
  if (config.activeModel === 'salary_without_expenses') {
    foodShopShare = 0;
    foodEngineerShare = dailyFoodLivingExpenses;
  } else if (config.activeModel === 'salary_with_expenses') {
    foodShopShare = dailyFoodLivingExpenses;
    foodEngineerShare = 0;
  } else {
    if (rules.engineerFoodBearer === 'shop_pool') {
      foodShopShare = dailyFoodLivingExpenses;
      foodEngineerShare = 0;
    } else if (rules.engineerFoodBearer === 'shared_half') {
      foodShopShare = Math.round(dailyFoodLivingExpenses / 2);
      foodEngineerShare = dailyFoodLivingExpenses - foodShopShare;
    } else {
      foodShopShare = 0;
      foodEngineerShare = dailyFoodLivingExpenses;
    }
  }

  // 2. توزيع خرج المودم وشبكة النت (مناصفة 50% افتراضياً)
  let modemShopShare = 0;
  let modemEngineerShare = 0;
  if (rules.modemNetBearer === 'shared_half') {
    modemShopShare = Math.round(modemNetExpenses / 2);
    modemEngineerShare = modemNetExpenses - modemShopShare;
  } else if (rules.modemNetBearer === 'shop_pool') {
    modemShopShare = modemNetExpenses;
    modemEngineerShare = 0;
  } else {
    modemShopShare = 0;
    modemEngineerShare = modemNetExpenses;
  }

  // 3. مصاريف وتجهيزات وأدوات المحل
  let shopToolsPool = 0;
  let shopToolsOwner = 0;
  if (rules.shopToolsBearer === 'shop_pool') {
    shopToolsPool = shopExpenses;
  } else {
    shopToolsOwner = shopExpenses;
  }

  // ما تحمله رأس أرباح المحل من المصاريف المشتركة
  const shopCoveredExpenses = Math.round(shopToolsPool + foodShopShare + modemShopShare);

  // ما يتحمله المهندس من المصاريف المشتركة (تخصم من مستحقاته)
  const engineerExpenseDeductions = Math.round(foodEngineerShare + modemEngineerShare);

  const stepByStepLog: string[] = [];
  stepByStepLog.push(`1. إجمالي أرباح المحل قبل الخصم = ${totalGrossProfit.toLocaleString('en-US')} ر.ي (صيانة: ${grossMaintenanceProfit.toLocaleString('en-US')} | مبيعات: ${grossSalesProfit.toLocaleString('en-US')} | شبكات: ${grossNetworksProfit.toLocaleString('en-US')})`);
  stepByStepLog.push(`2. تفصيل المصاريف والخرج: صرفة معيشة: ${dailyFoodLivingExpenses.toLocaleString('en-US')} ر.ي (${foodShopShare > 0 && foodEngineerShare > 0 ? 'مناصفة 50/50' : foodShopShare > 0 ? 'على المحل' : 'على المهندس'}) | خرج مودم: ${modemNetExpenses.toLocaleString('en-US')} ر.ي (${rules.modemNetBearer === 'shared_half' ? 'مناصفة 50/50' : 'على المحل'}) | مصاريف المحل: ${shopExpenses.toLocaleString('en-US')} ر.ي`);
  stepByStepLog.push(`3. نصيب رأس أرباح المحل من المصاريف = ${shopCoveredExpenses.toLocaleString('en-US')} ر.ي | نصيب المهندس من المصاريف المشتركة = ${engineerExpenseDeductions.toLocaleString('en-US')} ر.ي`);

  let engineerMaintenanceShare = 0;
  let engineerShopShare = 0;
  let engineerSalaryShare = 0;
  let engineerGrossTotal = 0;
  const engineerDeductions = engineerWithdrawals;
  const engineerTotalDeductions = engineerWithdrawals + engineerExpenseDeductions;
  let engineerNetPayout = 0;
  let shopGrossShare = 0;
  const shopExpensesPaid = shopCoveredExpenses;
  let shopNetPayout = 0;
  let netDistributableProfit = 0;
  let modelTitle = '';

  switch (config.activeModel) {
    // -------------------------------------------------------------
    // النموذج 1: خصم الصرفة أولاً من رأس الأرباح + المهندس النص (50%) في الصيانة + (نسبة أو معاش من أرباح المحل)
    // -------------------------------------------------------------
    case 'maintenance_half_plus_shop_share': {
      modelTitle = 'النموذج 1: نصف الصيانة للمهندس + (نسبة/معاش) من أرباح المحل بعد تغطية المصاريف';

      // المهندس له النص في الصيانة (50% افتراضياً)
      const maintRatio = (config.model1.engineerMaintenancePercent || 50) / 100;
      engineerMaintenanceShare = Math.round(grossMaintenanceProfit * maintRatio);
      const shopMaintenanceGross = Math.round(grossMaintenanceProfit - engineerMaintenanceShare);

      // رأس أرباح المحل المتبقية = أرباح المبيعات + أرباح الشبكات + نصيب المحل من الصيانة
      const shopGrossPool = grossSalesProfit + grossNetworksProfit + shopMaintenanceGross;

      // أول شي: تخصم حصة المحل من الصرفة والمصاريف من رأس أرباح المحل
      let shopNetAfterExpenses = 0;
      if (config.model1.deductExpensesFirst) {
        shopNetAfterExpenses = Math.max(0, shopGrossPool - shopCoveredExpenses);
        stepByStepLog.push(`4. خصم حصة المحل من الصرفة والمصاريف (${shopGrossPool.toLocaleString('en-US')} - ${shopCoveredExpenses.toLocaleString('en-US')}) = ${shopNetAfterExpenses.toLocaleString('en-US')} ر.ي صافي أرباح المحل`);
      } else {
        shopNetAfterExpenses = shopGrossPool;
        stepByStepLog.push(`4. رأس أرباح المحل قبل خصم المصاريف = ${shopGrossPool.toLocaleString('en-US')} ر.ي`);
      }

      netDistributableProfit = shopNetAfterExpenses;

      // ومعه من أرباح المحل: إما نسبة أو معاش شهري
      if (config.model1.shopAdditionType === 'percentage') {
        const ratio = (config.model1.shopAdditionPercent || 0) / 100;
        engineerShopShare = Math.round(shopNetAfterExpenses * ratio);
        stepByStepLog.push(`5. نصيب المهندس من صافي أرباح المحل (${config.model1.shopAdditionPercent}%) = ${engineerShopShare.toLocaleString('en-US')} ر.ي`);
      } else {
        const dailyRate = config.model1.shopAdditionMonthlySalary / 30;
        engineerSalaryShare = Math.round(dailyRate * daysCount);
        stepByStepLog.push(`5. معاش المهندس للفترة (${daysCount} يوم من أصل 30 يوم) = ${engineerSalaryShare.toLocaleString('en-US')} ر.ي`);
      }

      engineerGrossTotal = engineerMaintenanceShare + engineerShopShare + engineerSalaryShare;
      engineerNetPayout = Math.max(0, engineerGrossTotal - engineerTotalDeductions);

      shopGrossShare = shopGrossPool;
      shopNetPayout = Math.max(0, shopNetAfterExpenses - engineerShopShare - engineerSalaryShare - shopToolsOwner);

      stepByStepLog.push(`6. حصة المهندس من أرباح الصيانة (النصف 50%) = ${engineerMaintenanceShare.toLocaleString('en-US')} ر.ي`);
      stepByStepLog.push(`7. إجمالي استحقاق المهندس قبل الخصومات = ${engineerGrossTotal.toLocaleString('en-US')} ر.ي`);
      if (engineerExpenseDeductions > 0) {
        stepByStepLog.push(`8. خصم نصيب المهندس من المصاريف المشتركة (المودم/الصرفة) = ${engineerExpenseDeductions.toLocaleString('en-US')} ر.ي`);
      }
      if (engineerDeductions > 0) {
        stepByStepLog.push(`9. خصم سلفيات ومسحوبات المهندس الشخصية = ${engineerDeductions.toLocaleString('en-US')} ر.ي`);
      }
      stepByStepLog.push(`10. النتيجة: صافي استحقاق المهندس للاستلام = ${engineerNetPayout.toLocaleString('en-US')} ر.ي | كم باقي للمحل (مصعب الصوفي) = ${shopNetPayout.toLocaleString('en-US')} ر.ي`);
      break;
    }

    // -------------------------------------------------------------
    // النموذج 2: خصم الصرفة من رأس أرباح المحل كامل + نسبة للعامل (الثلث أو النص أو نسبة مخصصة)
    // -------------------------------------------------------------
    case 'net_profit_share': {
      let percent = 33.33;
      if (config.model2.ratioPreset === 'half') percent = 50;
      else if (config.model2.ratioPreset === 'third') percent = 33.3333;
      else percent = config.model2.customPercent || 33.33;

      modelTitle = `النموذج 2: خصم المصاريف من رأس الأرباح كامل ونسبة ${config.model2.ratioPreset === 'half' ? 'النصف (50%)' : config.model2.ratioPreset === 'third' ? 'الثلث (33.3%)' : percent + '%'} للعامل/المهندس`;

      // تخصم الصرفة من رأس أرباح المحل كامل
      netDistributableProfit = Math.max(0, totalGrossProfit - shopCoveredExpenses);
      stepByStepLog.push(`4. خصم المصاريف من رأس أرباح المحل (${totalGrossProfit.toLocaleString('en-US')} - ${shopCoveredExpenses.toLocaleString('en-US')}) = ${netDistributableProfit.toLocaleString('en-US')} ر.ي صافي قابل للتقسيم`);

      engineerShopShare = Math.round((netDistributableProfit * percent) / 100);
      engineerGrossTotal = engineerShopShare;
      engineerNetPayout = Math.max(0, engineerGrossTotal - engineerTotalDeductions);

      shopGrossShare = totalGrossProfit;
      shopNetPayout = Math.max(0, netDistributableProfit - engineerShopShare - shopToolsOwner);

      stepByStepLog.push(`5. احتساب نسبة العامل/المهندس (${percent.toFixed(1)}%) = ${engineerGrossTotal.toLocaleString('en-US')} ر.ي`);
      if (engineerExpenseDeductions > 0) {
        stepByStepLog.push(`6. خصم حصة المصاريف المشتركة عليه = ${engineerExpenseDeductions.toLocaleString('en-US')} ر.ي`);
      }
      if (engineerDeductions > 0) {
        stepByStepLog.push(`7. خصم مسحوبات العامل الشخصية = ${engineerDeductions.toLocaleString('en-US')} ر.ي`);
      }
      stepByStepLog.push(`8. النتيجة: كم يطلع للعامل = ${engineerNetPayout.toLocaleString('en-US')} ر.ي | كم باقي للمحل (مصعب الصوفي) = ${shopNetPayout.toLocaleString('en-US')} ر.ي`);
      break;
    }

    // -------------------------------------------------------------
    // النموذج 3: معاش شهري مع الخرج (المحل يتحمل الصرفة كإضافة فوق المعاش)
    // -------------------------------------------------------------
    case 'salary_with_expenses': {
      modelTitle = 'النموذج 3: معاش شهري ثابت مع الخرج (المحل يتحمل صرفته وأكله)';
      const workingDays = config.salaryModel.workingDaysPerMonth || 30;
      const dailyRate = config.salaryModel.monthlyAmount / workingDays;
      engineerSalaryShare = Math.round(dailyRate * daysCount);
      engineerGrossTotal = engineerSalaryShare;

      // في هذا النموذج، الصرفة كاملة على المحل، يخصم فقط المودم إن كان مناصفة والمسحوبات
      engineerNetPayout = Math.max(0, engineerGrossTotal - (engineerDeductions + modemEngineerShare));

      // الصرفة يدفعها المحل كاملة من أرباحه
      netDistributableProfit = Math.max(0, totalGrossProfit - totalOperatingExpenses);
      shopNetPayout = Math.max(0, netDistributableProfit - engineerSalaryShare);
      shopGrossShare = totalGrossProfit;

      stepByStepLog.push(`4. معاش العامل للفترة (${daysCount} يوم @ ${(dailyRate).toFixed(0)} ر.ي/يوم) = ${engineerSalaryShare.toLocaleString('en-US')} ر.ي`);
      stepByStepLog.push(`5. الصرفة والخرج اليومي (${dailyFoodLivingExpenses.toLocaleString('en-US')} ر.ي) يتحملها المحل كإكرامية ومصاريف تشغيلية`);
      if (modemEngineerShare > 0) {
        stepByStepLog.push(`6. خصم نصف خرج المودم المشترك = ${modemEngineerShare.toLocaleString('en-US')} ر.ي`);
      }
      if (engineerDeductions > 0) {
        stepByStepLog.push(`7. خصم مسحوبات وسلفيات العامل = ${engineerDeductions.toLocaleString('en-US')} ر.ي`);
      }
      stepByStepLog.push(`8. النتيجة: كم يستلم العامل = ${engineerNetPayout.toLocaleString('en-US')} ر.ي | كم باقي للمحل (مصعب الصوفي) = ${shopNetPayout.toLocaleString('en-US')} ر.ي`);
      break;
    }

    // -------------------------------------------------------------
    // النموذج 4: معاش شهري بدون الخرج (الصرفة مخصومة عليه أو تخصم من معاشه)
    // -------------------------------------------------------------
    case 'salary_without_expenses': {
      modelTitle = 'النموذج 4: معاش شهري ثابت بدون الخرج (الصرفة مخصومة من حسابه)';
      const workingDays = config.salaryModel.workingDaysPerMonth || 30;
      const dailyRate = config.salaryModel.monthlyAmount / workingDays;
      engineerSalaryShare = Math.round(dailyRate * daysCount);
      engineerGrossTotal = engineerSalaryShare;

      // الصرفة اليومية الشخصية تخصم من مستحقات العامل مع المودم
      const totalWorkerDeduction = engineerDeductions + dailyFoodLivingExpenses + modemEngineerShare;
      engineerNetPayout = Math.max(0, engineerGrossTotal - totalWorkerDeduction);

      // المحل يتحمل فقط مصاريف المحل العامة ونصف المودم الخاص به
      const pureShopExpenses = shopExpenses + modemShopShare;
      netDistributableProfit = Math.max(0, totalGrossProfit - pureShopExpenses);
      shopNetPayout = Math.max(0, netDistributableProfit - engineerSalaryShare);
      shopGrossShare = totalGrossProfit;

      stepByStepLog.push(`4. معاش العامل للفترة = ${engineerSalaryShare.toLocaleString('en-US')} ر.ي`);
      stepByStepLog.push(`5. خصم الصرفة والخرج الشخصي (${dailyFoodLivingExpenses.toLocaleString('en-US')} ر.ي) من معاش العامل`);
      if (modemEngineerShare > 0) {
        stepByStepLog.push(`6. خصم نصف خرج المودم المشترك = ${modemEngineerShare.toLocaleString('en-US')} ر.ي`);
      }
      if (engineerDeductions > 0) {
        stepByStepLog.push(`7. خصم مسحوبات إضافية = ${engineerDeductions.toLocaleString('en-US')} ر.ي`);
      }
      stepByStepLog.push(`8. النتيجة: صافي استلام العامل = ${engineerNetPayout.toLocaleString('en-US')} ر.ي | كم باقي للمحل = ${shopNetPayout.toLocaleString('en-US')} ر.ي`);
      break;
    }

    // -------------------------------------------------------------
    // النموذج 5: نظام القبال للمحل (مبلغ يومي ثابت متفق عليه يقدم لصاحب المحل)
    // -------------------------------------------------------------
    case 'daily_qabal': {
      modelTitle = 'النموذج 5: نظام القبال (مبلغ يومي متفق عليه يسلم لصاحب المحل مصعب)';
      const targetDaily = config.qabalModel.dailyTargetAmount || 10000;
      const totalQabalToOwner = Math.round(targetDaily * daysCount);

      // المحل (صاحب المحل) يستلم مقطوعيته اليومية بالكامل
      shopNetPayout = totalQabalToOwner;

      // الباقي من الأرباح بعد سداد الصرفة يذهب للعامل/المهندس
      const remainderAfterExpenses = Math.max(0, totalGrossProfit - totalOperatingExpenses);
      engineerGrossTotal = Math.max(0, remainderAfterExpenses - totalQabalToOwner);
      engineerNetPayout = Math.max(0, engineerGrossTotal - engineerTotalDeductions);
      netDistributableProfit = remainderAfterExpenses;

      stepByStepLog.push(`4. قبال صاحب المحل مصعب (${daysCount} يوم @ ${targetDaily.toLocaleString('en-US')} ر.ي) = ${totalQabalToOwner.toLocaleString('en-US')} ر.ي`);
      stepByStepLog.push(`5. صافي الأرباح بعد الصرفة والمصاريف = ${remainderAfterExpenses.toLocaleString('en-US')} ر.ي`);
      stepByStepLog.push(`6. الفائض بعد تسليم قبال المحل يؤول للمهندس/المشغل = ${engineerGrossTotal.toLocaleString('en-US')} ر.ي`);
      stepByStepLog.push(`7. النتيجة: كم يطلع للعامل = ${engineerNetPayout.toLocaleString('en-US')} ر.ي | قبال المحل (لصاحب المحل) = ${shopNetPayout.toLocaleString('en-US')} ر.ي`);
      break;
    }

    // -------------------------------------------------------------
    // النموذج 6: شراكة بالنص (50% لصاحب المحل و 50% للشريك مناصفة بعد الصرفة)
    // -------------------------------------------------------------
    case 'equal_partnership_half':
    default: {
      modelTitle = 'النموذج 6: شراكة بالنص (50% لصاحب المحل و 50% للشريك مناصفة من الصافي)';

      // تخصم الصرفة والمصاريف أولاً من رأس أرباح المحل كامل
      netDistributableProfit = Math.max(0, totalGrossProfit - shopCoveredExpenses);
      stepByStepLog.push(`4. خصم المصاريف من رأس أرباح المحل كامل (${totalGrossProfit.toLocaleString('en-US')} - ${shopCoveredExpenses.toLocaleString('en-US')}) = ${netDistributableProfit.toLocaleString('en-US')} ر.ي صافي قابل للقسمة مناصفة`);

      const half = Math.round(netDistributableProfit / 2);
      engineerShopShare = half;
      engineerGrossTotal = half;
      engineerNetPayout = Math.max(0, engineerGrossTotal - engineerTotalDeductions);

      shopGrossShare = totalGrossProfit;
      shopNetPayout = Math.max(0, netDistributableProfit - half - shopToolsOwner);

      stepByStepLog.push(`5. نصيب الشريك (50% النص) = ${engineerGrossTotal.toLocaleString('en-US')} ر.ي`);
      if (engineerExpenseDeductions > 0) {
        stepByStepLog.push(`6. خصم حصة المصاريف المشتركة عليه = ${engineerExpenseDeductions.toLocaleString('en-US')} ر.ي`);
      }
      if (engineerDeductions > 0) {
        stepByStepLog.push(`7. خصم مسحوبات الشريك = ${engineerDeductions.toLocaleString('en-US')} ر.ي`);
      }
      stepByStepLog.push(`8. النتيجة: كم يطلع للشريك = ${engineerNetPayout.toLocaleString('en-US')} ر.ي | كم يطلع للمحل (مصعب الصوفي) = ${shopNetPayout.toLocaleString('en-US')} ر.ي`);
      break;
    }
  }

  const mosaabHomeAndWithdrawals = mosaabHomeExpenses + mosaabWithdrawals;
  const mosaabFinalNet = Math.max(0, shopNetPayout - mosaabHomeAndWithdrawals);

  return {
    grossSalesProfit,
    grossMaintenanceProfit,
    grossNetworksProfit,
    totalGrossProfit,
    totalOperatingExpenses,
    shopExpensesBreakdown: {
      shopExpenses,
      dailyFoodLivingExpenses,
      modemNetExpenses,
    },
    expenseDistribution: {
      shopCoveredExpenses,
      engineerCoveredExpenses: engineerExpenseDeductions,
      foodShopShare,
      foodEngineerShare,
      modemShopShare,
      modemEngineerShare,
    },
    netDistributableProfit,
    engineerMaintenanceShare,
    engineerShopShare,
    engineerSalaryShare,
    engineerGrossTotal,
    engineerExpenseDeductions,
    engineerDeductions,
    engineerTotalDeductions,
    engineerNetPayout,
    shopGrossShare,
    shopExpensesPaid,
    shopNetPayout,
    mosaabHomeAndWithdrawals,
    mosaabFinalNet,
    modelTitle,
    stepByStepLog,
  };
}
