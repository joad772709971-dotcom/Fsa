/**
 * أنماط وإعدادات تقسيم الأرباح لنظام الرقم الأول
 * محل مصعب الصوفي للجوالات
 */

export type ProfitSharingModelType =
  | 'maintenance_half_plus_shop_share' // رقم 1: خصم الصرفة من رأس الأرباح + المهندس النص بالصيانة + (نسبة أو معاش من أرباح المحل)
  | 'net_profit_share'                  // رقم 2: خصم الصرفة من رأس أرباح المحل كامل + نسبة للعامل (الثلث أو النص أو نسبة مخصصة)
  | 'salary_with_expenses'             // رقم 3: معاش شهري مع الخرج (المحل يتحمل الصرفة كإضافة)
  | 'salary_without_expenses'          // رقم 4: معاش شهري بدون الخرج (الصرفة مخصومة عليه)
  | 'daily_qabal'                      // رقم 5: قبال للمحل بمبلغ يومي ثابت يقدم لصاحب المحل
  | 'equal_partnership_half';          // رقم 6: شراكة بالنص (50% لصاحب المحل و 50% للشريك مناصفة بعد الصرفة)

export type ShopProfitAdditionType = 'percentage' | 'monthly_salary';

export interface ExpenseDistributionRules {
  engineerFoodBearer: 'shop_pool' | 'shared_half' | 'engineer_personal'; // صرفة وأكل المهندس: على المحل من رأس الأرباح | مناصفة 50-50 | على المهندس
  modemNetBearer: 'shared_half' | 'shop_pool' | 'engineer_personal';      // خرج المودم والنت: مناصفة 50-50 (افتراضي) | من رأس أرباح المحل | على المهندس
  shopToolsBearer: 'shop_pool' | 'owner_only';                           // مصاريف وتجهيزات وأدوات المحل: من رأس أرباح المحل | على صاحب المحل
}

export interface ProfitSharingConfig {
  activeModel: ProfitSharingModelType;

  // إعدادات وقواعد توزيع المصاريف المشتركة بين المحل والمهندس
  expenseRules: ExpenseDistributionRules;

  // إعدادات النموذج رقم 1: نص صيانة + (نسبة أو معاش من أرباح المحل)
  model1: {
    deductExpensesFirst: boolean;       // خصم الصرفة أولاً من رأس أرباح المحل (دائماً نعم افتراضياً)
    engineerMaintenancePercent: number; // نسبة المهندس في الصيانة (افتراضياً 50% أي النص)
    shopAdditionType: ShopProfitAdditionType; // إما نسبة من أرباح المحل أو معاش شهري
    shopAdditionPercent: number;        // نسبة المهندس من أرباح المحل (مثلاً 10% أو 20% أو 33.33%)
    shopAdditionMonthlySalary: number;  // المعاش الشهري إن كان خياره معاشاً
  };

  // إعدادات النموذج رقم 2: خصم الصرفة من رأس الأرباح كامل + نسبة من الصافي (ثلث، نص، أو مخصص)
  model2: {
    deductExpensesFirst: boolean;
    ratioPreset: 'half' | 'third' | 'custom'; // النص (50%) أو الثلث (33.33%) أو مخصص
    customPercent: number;                    // النسبة المخصصة للعامل/المهندس
  };

  // إعدادات النموذج رقم 3 و 4: المعاش الشهري
  salaryModel: {
    monthlyAmount: number;              // المعاش الشهري المتفق عليه (مثلاً 80,000 ر.ي)
    workingDaysPerMonth: number;        // عدد أيام العمل في الشهر لحساب اليومية (مثلاً 30 أو 26)
    shopCoversExpenses: boolean;        // true = مع الخرج (المحل يدفع الصرفة)، false = بدون الخرج (تخصم من راتبه)
  };

  // إعدادات النموذج رقم 5: نظام القبال اليومي للمحل
  qabalModel: {
    dailyTargetAmount: number;          // المبلغ اليومي المقدم لصاحب المحل (مثلاً 10,000 ر.ي)
    operatingExpensesBearer: 'shop' | 'worker'; // من يتحمل الصرفة اليومية (المحل أو العامل)
  };

  // إعدادات النموذج رقم 6: الشراكة بالنصف مناصفة
  partnershipModel: {
    deductExpensesFirst: boolean;
    ownerSharePercent: number;          // 50%
    partnerSharePercent: number;        // 50%
  };
}

/**
 * مخرجات الحساب المالي التفصيلي
 */
export interface ProfitCalculationResult {
  // 1. شاشة الأرباح قبل الخصم
  grossSalesProfit: number;             // أرباح المبيعات والإكسسوارات والجوالات
  grossMaintenanceProfit: number;       // أرباح الصيانة الإجمالية
  grossNetworksProfit: number;          // أرباح شبكات الرصيد والشرائح
  totalGrossProfit: number;             // إجمالي الأرباح العام قبل أي خصم

  // 2. شاشة الصرفة والخرج والمصروفات المخصومة
  totalOperatingExpenses: number;       // إجمالي الصرفة والخرج المخصوم من رأس أرباح المحل
  shopExpensesBreakdown: {
    shopExpenses: number;               // مصاريف وتجهيزات المحل
    dailyFoodLivingExpenses: number;    // الصرفة اليومية (غداء وعشاء)
    modemNetExpenses: number;           // خرج الرصيد والمودم
  };

  // تفصيل توزيع المصاريف الفعلي بين المحل والمهندس
  expenseDistribution: {
    shopCoveredExpenses: number;        // ما تحمله رأس مال المحل من المصاريف
    engineerCoveredExpenses: number;    // ما تحمله المهندس من المصاريف (مناصفة المودم أو الصرفة)
    foodShopShare: number;              // حصة المحل من الصرفة
    foodEngineerShare: number;          // حصة المهندس من الصرفة
    modemShopShare: number;             // حصة المحل من المودم
    modemEngineerShare: number;         // حصة المهندس من المودم
  };

  // 3. صافي الأرباح القابلة للتوزيع بعد خصم الصرفة
  netDistributableProfit: number;

  // 4. شاشة نصيب العامل / المهندس (كم يطلع له)
  engineerMaintenanceShare: number;     // نصيبه من الصيانة
  engineerShopShare: number;            // نصيبه من أرباح المحل (إن وجد)
  engineerSalaryShare: number;          // معاشه اليومي أو الشهري (إن وجد)
  engineerGrossTotal: number;           // إجمالي مستحقات المهندس قبل الخصم
  engineerExpenseDeductions: number;    // خصم نصيبه من المصاريف المشتركة (المودم/الصرفة)
  engineerDeductions: number;           // مسحوباته وسلفياته الشخصية
  engineerTotalDeductions: number;      // إجمالي الخصومات (المسحوبات + حصة المصاريف)
  engineerNetPayout: number;            // **كم يطلع للعامل المهندس صافي للاستلام**

  // 5. شاشة نصيب المحل وصاحب المحل مصعب الصوفي (كم باقي للمحل)
  shopGrossShare: number;               // إجمالي دخل المحل
  shopExpensesPaid: number;             // المصاريف التي تكفل بها المحل
  shopNetPayout: number;                // **كم باقي للمحل (لصاحب المحل مصعب الصوفي)**
  mosaabHomeAndWithdrawals?: number;    // مسحوبات مصعب وصرفة بيته
  mosaabFinalNet?: number;              // صافي مصعب بعد خصم بيته ومسحوباته

  // التحليل والخطوات الرياضية
  modelTitle: string;
  stepByStepLog: string[];
}
