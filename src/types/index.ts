import { ProfitCalculationResult } from './profitSharing';

export type PaymentMethod =
  | 'cash'
  | 'transfer'
  | 'debt'
  | 'bank'
  | 'card'
  | 'credit'
  | string;

export type TransactionType =
  | 'income' // إيرادات عامة
  | 'expense' // مصروفات عامة
  | 'receivable' // ذمم مدينة / مستحقات
  | 'payable' // ذمم دائنة / التزامات
  | 'sale' // بيع جوال أو إكسسوارات
  | 'maintenance' // صيانة جوالات
  | 'balance_hadi' // رصيد تطبيق الهادي (محمد مياس)
  | 'balance_qimma' // رصيد تطبيق الرقم (فايز أبو علي)
  | 'sim' // بيع أو شراء شرائح
  | 'purchase' // مشتريات قطع غيار أو بضاعة
  | 'expense_shop' // صرفة المحل والتشغيل (ضيافة، أدوات، نظافة)
  | 'expense_home_mosaab' // صرفة بيت مصعب
  | 'purchases_home_mosaab' // مشتريات بيت مصعب
  | 'withdrawal_mosaab' // سحب مصعب
  | 'mosaab_bank_deposit_customer' // إيداع مشتريات من حساب زبون الى حساب مصعب البنكي
  | 'mosaab_purchases_fund' // تحويل لمصعب عهدة يدي مشتريات
  | 'mosaab_balance_topup' // رصيد مصعب
  | 'expense_internet_shop' // رصيد إنترنت المحل
  | 'return_to_supplier_musannaf' // مرتجع لتاجر المصنف
  | 'return_to_supplier_aghbari' // مرتجع الاغبري
  | 'return_to_supplier_qasimi' // مرتجع القاسمي
  | 'return_to_supplier_sanaa' // مرتجع تاجر صنعاء جوالات
  | 'withdrawal_store_support' // سحب من الدعم المقدم للمحل
  | 'withdrawal_engineer_third' // سحب المهندس من حسابة الثلث
  | 'transfer_mohammed_mayas' // حوالة محمد مياس (تطبيق الهادي)
  | 'transfer_faiez_abu_ali' // حوالة فايز أبو علي (تطبيق الرقم)
  | 'transfer_khalil_aghbari' // حوالة خليل الاغبري
  | 'transfer_omar_qasimi' // حوالة لعمرالقاسمي
  | 'transfer_musannaf' // حوالة المصنف
  | 'transfer_new_supplier' // حوالة لتاجر جديد
  | 'transfer_to_supplier' // حوالة / سداد تاجر من فاتورة المشتريات
  | 'expense_engineer' // صرفة المهندس (على المحل)
  | 'withdrawal_engineer' // سحب المهندس (يحسب عليه)
  | 'expense_worker' // صرفة العامل (على المحل)
  | 'withdrawal_worker' // سحب/مستحقات العامل
  | 'expense_modem' // خرج الرصيد والمودم (مناصفة)
  | 'shop_tools_outflow' // مخروجات للمحل (شواحن، وصلات، أدوات)
  | 'withdrawal_home' // صرفة البيت والأهل (توافق)
  | 'withdrawal_personal' // مسحوبات شخصية (توافق)
  | 'expense_work' // مصاريف العمل الخارجية (توافق)
  | 'damaged'; // تالف

export type Category =
  | 'phones' // جوالات
  | 'accessories' // إكسسوارات
  | 'maintenance' // صيانة
  | 'balance' // رصيد
  | 'sims' // شرائح
  | 'expenses' // مصاريف
  | 'purchases' // مشتريات
  | 'mosaab' // حساب مصعب
  | 'engineer' // حساب المهندس
  | 'worker' // حساب العامل
  | 'damaged' // تالف
  | string;

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: TransactionType;
  category: Category;
  description: string;
  itemCode?: string;
  quantity?: number;
  price?: number; // المبلغ / سعر البيع / قيمة الخرج
  cost?: number; // التكلفة / رأس المال
  profit?: number; // الربح / الفائدة

  // Accounting & Tax fields
  amount?: number; // المبلغ الإجمالي
  netAmount?: number; // المبلغ الصافي قبل الضريبة
  vatRate?: number; // نسبة الضريبة
  vatAmount?: number; // قيمة الضريبة
  party?: string; // الطرف الثاني (عميل أو مورد)
  debitAccount?: string; // الحساب المدين
  creditAccount?: string; // الحساب الدائن
  referenceNo?: string; // رقم الفاتورة أو المرجع
  status?: 'completed' | 'pending' | 'cancelled' | 'paid' | 'unpaid' | string;
  
  // Multi-tenant isolation fields
  storeId?: string;
  ownerId?: string;

  // Custom metadata
  supplierId?: string; // المورد (العبصري، القاسمي، خليل، الهادي، القمة...)
  supplierName?: string;
  customerId?: string;
  customerName?: string;
  technicianName?: string; // المهندس
  notes?: string;
  attachmentUrl?: string; // صورة توثيق / فاتورة
  paymentMethod?: PaymentMethod; // نقداً، تحويل، آجل، بنك، بطاقة...
  
  // For purchases and supplier tracking
  paidAmount?: number; // المبلغ المحول / المدفوع للتاجر
  remainingAmount?: number; // كم باقي له (المتبقي الآجل)
  destinationCategory?: 'maintenance_parts' | 'maintenance_expense' | 'shop_stock' | 'balance_topup' | string; // وجهة الصنف بالمشتريات

  // For maintenance tracking & pickup lifecycle
  agreedAmount?: number; // إجمالي المبلغ المتفق عليه للصيانة
  customerPhone?: string; // هاتف العميل
  deviceModel?: string; // نوع الجهاز
  maintenanceStatus?: 'received' | 'in_progress' | 'ready' | 'delivered'; // حالة الجهاز
  linkedTransactionId?: string; // ربط حركة تسليم واستلام الباقي بحركة الاستلام الأصلية

  // For delivered purchases to Mosaab
  mosaabDeliveredAmount?: number; // المبلغ المسلم لمصعب
  mosaabPurchasedAmount?: number; // ما اشترى به
  mosaabRemainingAmount?: number; // المتبقي عنده
}

export interface CompanyProfile {
  name: string;
  taxNumber: string;
  crNumber?: string;
  address: string;
  phone: string;
  email?: string;
  currency: string;
  defaultVatRate: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  customerName: string;
  customerTaxId?: string;
  customerAddress?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  status: 'paid' | 'unpaid' | 'overdue';
  notes?: string;
  terms?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  collectedVat: number;
  paidVat: number;
  netVatDue: number;
  receivablesTotal: number;
  payablesTotal: number;
  cashBalance: number;
  bankBalance: number;
}

export interface AdvisorMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  recommendations?: string[];
  metrics?: any;
}

export interface Supplier {
  id: string;
  name: string;
  type: 'spare_parts' | 'balance_network' | 'accessories' | 'general';
  phone: string;
  location: string;
  initialBalance: number; // رصيد سابق
  totalPurchases: number; // إجمالي ما اشترينا منه
  totalPaid: number; // إجمالي ما حولنا له / دفعنا له
  remainingBalance: number; // المتبقي له
  notes?: string;
  storeId?: string;
  ownerId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'engineer' | 'worker';
  phone: string;
  dailyAllowance: number; // الصرفة اليومية
  salaryOrShare: string; // الراتب أو النسبة (مثلاً: 50% من الصيانة، أو ثلثين، أو ثلث، أو يومي 7500)
  totalWithdrawals: number; // إجمالي السحوبات
  totalAllowances: number; // إجمالي الصرفة
  totalEarned: number; // إجمالي المستحق
  currentBalance: number; // الرصيد الحالي
  status: 'active' | 'left' | 'temporary';
  leftDate?: string;
  storeId?: string;
  ownerId?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'phones' | 'accessories' | 'spare_parts' | 'sims' | 'tools' | 'قطع غيار' | 'إكسسوارات' | 'شرايح' | 'أدوات صيانة' | 'جوالات مستعملة/جديدة' | string;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  costPrice?: number;
  purchasePrice?: number;
  sellingPrice: number;
  minQuantity?: number;
  damagedQuantity?: number;
  barcode?: string;
  notes?: string;
  storeId?: string;
  ownerId?: string;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalCost: number;
  totalGrossProfit: number;
  
  // Breakdown of profits
  phonesProfit: number;
  accessoriesProfit: number;
  balanceHadiProfit: number;
  balanceQimmaProfit: number;
  simsProfit: number;
  
  // Maintenance breakdown
  maintenanceTotal: number;
  maintenanceCost: number;
  maintenanceNetProfit: number;
  engineerShare: number; // 50%
  shopMaintenanceShare: number; // 50%
  
  // Expenses breakdown
  shopExpenses: number; // خرج المحل
  engineerExpenses: number; // صرفة المهندس على المحل
  workerExpenses: number; // صرفة العامل
  modemExpenses: number; // خرج المودم والرصيد
  totalSharedDeductions: number; // المصاريف المشتركة المخصومة من رأس أرباح المحل
  
  // Net shop pool before 2/3 and 1/3 split
  netDistributableProfit: number;
  
  // Partners split
  mosaabShare: number; // 2/3
  managerShare: number; // 1/3
  
  // Personal deductions
  mosaabHomeExpenses: number; // صرفة بيت مصعب (تخصم من حصة مصعب)
  mosaabWithdrawals: number; // سحب مصعب شخصي
  mosaabNetBalance: number; // صافي مستحق مصعب لليوم
  
  engineerWithdrawals: number; // سحب المهندس (يخصم من حسابه)
  engineerNetForDay: number;
  
  workerSettlement: number; // تصفية العامل (7500)
  
  // Cash Drawer (الصندوق الكاش)
  totalCashIn: number;
  totalCashOut: number;
  netCashDrawer: number;

  // المحرك المالي لتقسيم الأرباح وفق النموذج المعتمد
  profitSharingResult?: ProfitCalculationResult;
}

export interface MonthlySettlement {
  monthKey: string; // YYYY-MM
  monthName: string;
  daysCount: number;
  
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalGrossProfit: number;
  
  totalMaintenance: number;
  engineerTotalShare: number;
  engineerTotalWithdrawals: number;
  engineerRemaining: number;
  
  workerTotalPaid: number;
  
  shopNetDistributable: number;
  mosaabTotalShare: number; // ثلثين
  managerTotalShare: number; // ثلث
  
  mosaabTotalHomeExpenses: number;
  mosaabTotalWithdrawals: number;
  mosaabFinalPayable: number;
  
  closingCashInDrawer: number;

  // المحرك المالي لتقسيم الأرباح وفق النموذج المعتمد للشهر
  profitSharingResult?: ProfitCalculationResult;
}

export interface CustomerDebt {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  lastTransactionDate: string;
  notes?: string;
  storeId?: string;
  ownerId?: string;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string; // TCK-2024-001
  customerName: string;
  customerPhone: string;
  deviceModel: string; // سامسونج A54، ردمي 12، آيفون 13
  deviceColor?: string;
  passcode?: string; // رمز القفل أو النمط
  issueDescription: string; // العطل المبلغ عنه
  includedItems?: string[]; // بطارية، شريحة، كفر، ذاكرة
  estimatedCost: number; // التكلفة المتوقعة
  depositPaid: number; // العربون المقدم
  sparePartCost: number; // تكلفة القطعة المستخدمة
  technicianName: string; // اسم المهندس المسؤول
  receiveDate: string;
  receiveTime: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  status: 'received' | 'in_progress' | 'waiting_parts' | 'ready' | 'delivered' | 'cancelled';
  notes?: string;
  warrantyDays?: number; // أيام الضمان (مثلاً 3 أيام، أسبوع)
  barcode?: string;
  storeId?: string;
  ownerId?: string;
}

export interface CashDrawerShift {
  id: string;
  date: string;
  openedAt: string;
  closedAt?: string;
  cashierName: string;
  openingCash: number; // العهدة الافتتاحية في الصندوق
  cashSales: number; // مبيعات كاش
  cashMaintenance: number; // صيانة كاش
  cashExpenses: number; // مصاريف كاش
  cashWithdrawals: number; // سحوبات كاش
  expectedCash: number; // الكاش المفترض
  actualCash?: number; // الكاش الفعلي المحسوب في الدرج
  difference?: number; // الفارق (عجز أو زيادة)
  status: 'open' | 'closed';
  notes?: string;
  storeId?: string;
  ownerId?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'engineer' | 'cashier';
  phone?: string;
  avatarBg?: string;
  pin?: string;
  lastLogin?: string;
  storeId?: string;
  ownerId?: string;
}

export interface CloudSyncConfig {
  repoUrl: string;
  githubToken?: string;
  lastSyncTime?: string;
  autoSync: boolean;
  cloudSyncKey?: string;
}

export interface ParsedTransactionItem {
  id?: string;
  date?: string;
  type: TransactionType;
  category: Category;
  description: string;
  price: number;
  cost?: number;
  profit?: number;
  time?: string;
  notes?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  remainingAmount?: number;
  networkType?: 'yemen_mobile' | 'you' | 'sabafon' | 'y';
  networkCategory?: 'balance_transfer' | 'package_activation' | 'bill_payment' | 'other';
  networkNumber?: string;
  packageType?: string;
  paymentMethod?: 'cash' | 'credit' | 'kuraimi';
  isInventoryEntry?: boolean;
  barcode?: string;
  quantity?: number;
  costPrice?: number;
  sellingPrice?: number;
  shorthandCode?: 'ج' | 'ك' | 'ص' | 'ش' | 'ر' | 'م' | string;
}

// ================= Autonomous CFO & Radar Types =================

export interface FinancialRatios {
  quickRatio: number; // نسبة السيولة السريعة
  quickRatioStatus: 'healthy' | 'caution' | 'critical';
  receivablesTurnover: number; // دوران الذمم المدينة
  averageCollectionDays: number; // متوسط فترة التحصيل بالأيام
  marginOfSafetyPercentage: number; // نسبة هامش الأمان
  marginOfSafetyStatus: 'robust' | 'fair' | 'vulnerable';
  totalQuickAssets: number; // إجمالي الأصول السريعة النقدية
  totalCurrentLiabilities: number; // إجمالي الالتزامات الفورية للموردين
  totalReceivables: number; // إجمالي الذمم المدينة
  totalInventoryCost: number; // رأس مال المخزون
  deadStockCapital: number; // رأس المال المجمد في بضاعة راكدة
}

export interface CFORadarAlert {
  id: string;
  generatedAt: string;
  type:
    | 'debt_limit_exceeded'
    | 'dead_stock_liquidity'
    | 'critical_liquidity_ratio'
    | 'cash_discrepancy'
    | 'operating_margin_warning'
    | 'strategic_opportunity';
  severity: 'critical' | 'warning' | 'opportunity';
  title: string;
  insight: string;
  actionableRecommendation: string;
  metricHighlight: string;
  targetEntity?: {
    type: 'customer' | 'inventory' | 'supplier' | 'drawer' | 'general';
    id?: string;
    name?: string;
  };
  actionButtonLabel?: string;
  actionDate?: string;
}

export interface AutonomousCFOContext {
  storeId: string;
  ownerId: string;
  currentUserId: string;
  currentUserName: string;
  userRole: string;
  currentDate: string;

  cashDrawer: {
    status: 'open' | 'closed' | 'no_shift';
    actualCashInDrawer: number;
    expectedCash: number;
    cashDiscrepancy: number;
  };
  networkBalances: {
    hadiBalance: number;
    qimmaBalance: number;
    totalNetworkCash: number;
  };
  totalLiquidCash: number;

  receivables: {
    totalOutstanding: number;
    debtorsCount: number;
    topDebtors: Array<{
      id: string;
      name: string;
      remainingDebt: number;
      phone?: string;
      lastDate?: string;
    }>;
    overLimitDebtors: Array<{
      id: string;
      name: string;
      remainingDebt: number;
      reason: string;
    }>;
  };

  payables: {
    totalOutstanding: number;
    suppliersCount: number;
    topSuppliers: Array<{
      id: string;
      name: string;
      remainingBalance: number;
      type: string;
    }>;
  };

  inventoryAudit: {
    totalItemsCount: number;
    totalInventoryValue: number;
    deadStockItems: Array<{
      id: string;
      name: string;
      quantity: number;
      costPrice: number;
      totalTiedUp: number;
      category: string;
    }>;
    lowStockItems: Array<{
      id: string;
      name: string;
      quantity: number;
      minQuantity?: number;
    }>;
    totalDeadStockCapital: number;
  };

  recentTransactions: Array<{
    id: string;
    date: string;
    time: string;
    type: string;
    description: string;
    price: number;
    cost: number;
    profit: number;
  }>;

  financialRatios: FinancialRatios;
  dailySummary?: any;
  monthlySettlement?: any;
}

export type NavTab =
  | 'dashboard'
  | 'pos_cashier'
  | 'cost_pricing_guide'
  | 'maintenance_tickets'
  | 'cash_drawer'
  | 'stock_alerts'
  | 'official_vouchers'
  | 'barcode_manager'
  | 'account_statement'
  | 'daily_ledger'
  | 'monthly_settlement'
  | 'profit_sharing'
  | 'sales'
  | 'maintenance'
  | 'networks'
  | 'sims'
  | 'expenses'
  | 'suppliers'
  | 'inventory'
  | 'mosaab_account'
  | 'employees'
  | 'customers'
  | 'ai_assistant'
  | 'cloud_sync'
  | 'reports'
  | 'backup_github'
  | 'forensic_audit'
  | 'invoice_ocr'
  | 'telecom_engine'
  | 'package_catalog';

// ================= Independent Forensic Accounting Audit Types =================

export type ForensicSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type ForensicFindingCategory =
  | 'ISOLATION_BREACH'              // خرق عزل المتجر أو تسرب سجلات أجنبية
  | 'MATH_INTEGRITY_MISMATCH'        // تضارب رياضي (الكميات × السعر - الخصم != الإجمالي)
  | 'PROFIT_CALCULATION_DISCREPANCY'// خلل حساب الأرباح (السعر - التكلفة != الربح)
  | 'PRICING_TAMPERING'             // بيع بأقل من التكلفة أو تسعير غير مصرح
  | 'NEGATIVE_INVENTORY'            // رصيد مخزني سالب
  | 'SUPPLIER_BALANCE_CORRUPTION'   // تضارب رصيد المورد التراكمي
  | 'CUSTOMER_DEBT_ANOMALY'         // تضارب رصيد ديون العميل
  | 'CASH_DRAWER_VARIANCE'          // عجز أو تلاعب في حركة النقدية
  | 'UNSTAMPED_TENANT_RECORD';      // سجل غير موسوم بمعرف المتجر

export interface ForensicFinding {
  id: string;
  timestamp: string;
  category: ForensicFindingCategory;
  severity: ForensicSeverity;
  title: string;
  description: string;
  affectedEntityId: string;
  entityType: 'transaction' | 'inventory' | 'supplier' | 'customer' | 'drawer' | 'ticket';
  entityDescription?: string;
  expectedAmount?: number;
  actualAmount?: number;
  discrepancyAmount?: number;
  technicalDetails: string;
  isIsolated: boolean; // هل تم عزل السجل برمجياً لمنع تلويث الحسابات
  remediationGuidance: string; // توجيه استرشادي فقط (دون أي تعديل آلي)
}

export interface OwnerAuditAlert {
  id: string;
  timestamp: string;
  findingId: string;
  severity: ForensicSeverity;
  category: ForensicFindingCategory;
  title: string;
  affectedEntityId: string;
  entityType: string;
  affectedAmount: number;
  discrepancyAmount: number;
  digest: string; // البصمة الرقمية للتقرير
  acknowledgedByOwner?: boolean;
  acknowledgedAt?: string;
}

export interface TenantIsolationStatus {
  activeStoreId: string;
  totalScannedRecords: number;
  matchingRecordsCount: number;
  breachCount: number;
  quarantinedCount: number;
  isCompliant: boolean;
  lastScannedAt: string;
}

export interface MathIntegrityStatus {
  salesInvoicesAudited: number;
  mathMismatchesCount: number;
  profitMismatchesCount: number;
  accuracyRatePercentage: number;
  totalDiscrepancySum: number;
  isCompliant: boolean;
  lastAuditedAt: string;
}

export interface ForensicAuditReport {
  reportId: string;
  generatedAt: string;
  auditorVersion: string;
  readOnlyEnforced: true;
  activeStoreId: string;
  tenantIsolation: TenantIsolationStatus;
  mathIntegrity: MathIntegrityStatus;
  findings: ForensicFinding[];
  criticalAlertsCount: number;
  highAlertsCount: number;
  mediumAlertsCount: number;
  quarantinedEntityIds: string[];
  certifiedBy: string;
  integrityHash: string;
}

// ================= Module 1: Smart Invoice OCR Types =================

export interface ScannedInvoiceItem {
  id: string;
  name: string;
  category: 'screens' | 'spare_parts' | 'batteries' | 'maintenance_tools' | 'accessories' | 'other';
  quantity: number;
  unitCost: number;
  totalCost: number;
  suggestedSalePrice: number;
  barcode?: string;
  notes?: string;
}

export interface ScannedInvoiceResult {
  id: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  supplierId?: string;
  supplierName: string;
  items: ScannedInvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  previousBalance: number; // الباقي السابق المذكور في الفاتورة اليدوية
  paidAmount: number; // المبلغ المدفوع نقداً
  remainingBalance: number; // الباقي الآجل المتبقي
  paymentStatus: 'paid' | 'partial' | 'credit'; // حالة السداد
  linkToSupplierDebt: boolean; // هل تم ترحيل الباقي لحساب المورد
  linkToCustomerDebt?: boolean; // هل تم تحويله لحساب عميل
  debtCustomerName?: string;
  debtCustomerPhone?: string;
  imageBase64?: string; // أرشفة صورة الفاتورة للرجوع إليها
  notes?: string;
  storeId?: string;
  ownerId?: string;
  verifiedAt?: string;
}

// ================= Module 2 & 3: Telecom Statement Engine & Package Catalog Types =================

export type TelecomOperator = 'yemen_mobile' | 'sabafon' | 'you' | 'yemen4g' | 'adsl_landline' | 'other';

export interface TelecomPackagePricing {
  id: string;
  operator: TelecomOperator;
  operatorNameAr: string; // يمن موبايل، سبأفون، يو، يمن فورجي، الهاتف الثابت والنت
  packageName: string; // باقة مزايا 2500، باقة نت فورجي 15 جيجا...
  packageCategory: 'voice_sms' | 'data_net' | 'mix_bundle' | 'renewal_recharge' | 'direct_balance';
  providerCostPrice: number; // سعر الشراء من التطبيق/المزود (مثلاً: 2200)
  customerSellingPrice: number; // سعر البيع للزبون (مثلاً: 2500)
  netProfit: number; // صافي الربح المحتسب = سعر البيع - سعر الشراء
  profitMarginPercent: number; // النسبة المئوية للربح
  matchKeywords?: string[]; // كلمات مطابقة آلية في نصوص الكشوفات
  isActive: boolean;
  notes?: string;
  storeId?: string;
  ownerId?: string;
  updatedAt: string;
}

export type TelecomOperationType =
  | 'recharge_standard'      // تسديد رصيد عادي
  | 'package_yemen_mobile'   // باقات يمن موبايل
  | 'package_sabafon'        // باقات سبأفون
  | 'package_you'            // باقات يو / MTN
  | 'package_yemen4g'        // يمن فورجي 4G
  | 'recharge_feed'          // تغذية الرصيد
  | 'bill_payment';          // فواتير هاتف وثابت وإنترنت

export interface TelecomStatementRow {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  operator: TelecomOperator;
  operatorNameAr: string;
  operationType: TelecomOperationType;
  targetNumber: string; // رقم هاتف المشترك أو رقم الحساب
  packageName?: string;
  amount: number; // المبلغ المخصوم من الحساب (التكلفة)
  sellingPrice: number; // سعر البيع للعميل (المحصل)
  netProfit: number; // صافي الربح = سعر البيع - التكلفة
  balanceBefore?: number; // الرصيد قبل العملية
  balanceAfter?: number; // الرصيد بعد العملية
  referenceId: string; // رقم العملية المرجعي
  status: 'success' | 'failed' | 'pending';
  sourceApp: string; // مثل الهادي أونلاين، القمة، تطبيق يمن موبايل
  notes?: string;
  // ربط الديون
  isDebt?: boolean; // هل تحولت لدين
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  storeId?: string;
  ownerId?: string;
}

export interface TelecomStatementFilter {
  timePeriod: 'all' | 'today' | 'month' | 'year' | 'custom';
  selectedDate?: string; // YYYY-MM-DD
  selectedMonth?: string; // YYYY-MM
  selectedYear?: string; // YYYY
  customStartDate?: string;
  customEndDate?: string;
  operator?: TelecomOperator | 'all';
  operationType?: TelecomOperationType | 'all';
  status?: 'all' | 'success' | 'failed';
  searchQuery?: string;
}

export interface TelecomStatementSummary {
  totalCount: number;
  totalAmount: number;
  totalSellingPrice: number;
  totalNetProfit: number;
  profitMarginPercentage: number;
  successCount: number;
  failedCount: number;
  byOperator: Record<string, { count: number; amount: number; profit: number }>;
  byType: Record<string, { count: number; amount: number; profit: number }>;
}


