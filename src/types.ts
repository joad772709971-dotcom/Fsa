export * from './types/index';
export * from './types/profitSharing';
export * from './types/pricing';

export interface AccessoryItem {
  id: string;
  name: string;
  price: number; // سعر البيع للزبون
  cost?: number; // التكلفة / رأس المال
  profit?: number; // الفائدة والربح التقريبي
  qty?: number;
  customerName?: string;
  customerPhone?: string;
  saleType?: 'نقد' | 'دين';
  guarantorName?: string;
  guarantorPhone?: string;
  workplace?: string;
  dueDate?: string;
  dueTime?: string;
  imageUrl?: string;
  notes?: string;
}

export interface PhoneItem {
  id: string;
  model: string;
  name?: string; // alias for model
  salePrice: number; // سعر البيع
  price?: number; // alias for salePrice
  purchaseCost?: number; // سعر الشراء / التكلفة
  cost?: number; // التكلفة (مكافئ لسعر الشراء)
  profit?: number; // الفائدة والربح التقريبي
  paidAmount: number;
  remainingAmount?: number;
  guarantor?: string; // بضمانة
  guarantorPhone?: string;
  buyerName?: string;
  customerPhone?: string;
  saleType?: 'نقد' | 'دين';
  workplace?: string;
  dueDate?: string;
  dueTime?: string;
  imageUrl?: string;
  status: 'تم الدفع بالكامل' | 'متبقي آجل' | 'مرتجع';
  notes?: string;
}

export interface MaintenanceItem {
  id: string;
  deviceOrService: string;
  price: number; // سعر الصيانة أو الخدمة للزبون
  cost?: number; // إجمالي التكلفة
  partCost?: number; // تكلفة قطع الغيار
  laborCost?: number; // تكلفة الفني / الشغل
  profit?: number; // الفائدة والربح التقريبي الصافي
  type: 'شاشات' | 'بيوت شحن وفلاتات' | 'آي سيات وتصليح' | 'برمجة وفورمات' | 'تفعيل 4G/Volte' | 'حسابات وتخطي' | 'أخرى';
  status?: 'واصل' | 'باقي' | 'خالص';
  partUsedName?: string;
  partDeductedFromInventory?: boolean;
  partAddedToShortages?: boolean;
  customerName?: string;
  customerPhone?: string;
  saleType?: 'نقد' | 'دين';
  guarantorName?: string;
  guarantorPhone?: string;
  workplace?: string;
  dueDate?: string;
  dueTime?: string;
  technician?: string;
  imageUrl?: string;
  notes?: string;
}

export type MaintenanceStatus = 
  | 'قيد الفحص'
  | 'بانتظار قطع الغيار'
  | 'جاري الصيانة'
  | 'جاهز للتسليم'
  | 'تم التسليم والمحاسبة'
  | 'تمت المصادرة (تجاوز شهر)'
  | 'ملغي / لم يصلح'
  | 'قيد الانتظار'
  | 'قيد الفحص والتصليح'
  | 'بانتظار قطع غيار'
  | 'تم التسليم'
  | 'متأخر (تجاوز مهلة الشهر)'
  | 'ملغي / غير قابل للإصلاح';

export interface MaintenanceDevice {
  id: string;
  ticketNumber: number | string; // رقم كرت الصيانة / السند (مثلاً: 101 أو #REP-101)
  customerName: string;
  customerPhone: string;
  deviceModel: string; // موديل ونوع الجوال
  color?: string;
  passcode?: string; // رمز القفل / النمط
  issueDescription: string; // وصف العطل والمشكلة
  serviceType?: 'شاشات' | 'بيوت شحن وفلاتات' | 'آي سيات وتصليح' | 'برمجة وفورمات' | 'تفعيل 4G/Volte' | 'حسابات وتخطي' | 'بطاريات' | 'أخرى';
  maintenanceType?: 'شاشات' | 'بيوت شحن وفلاتات' | 'آي سيات وتصليح' | 'برمجة وفورمات' | 'تفعيل 4G/Volte' | 'حسابات وتخطي' | 'بطاريات' | 'أخرى';
  receivedDate: string; // تاريخ الاستلام
  receivedTime?: string;
  estimatedCost: number; // سعر الصيانة المتفق عليه (سعر البيع)
  expectedCost?: number;
  actualCost?: number; // تكلفة قطع الغيار المستخدمة
  partsCost?: number;
  laborCost?: number;
  profit?: number; // صافي الربح المتوقع / أجر اليد
  estimatedProfit?: number;
  paidAmount: number; // المبلغ المقدم المدفوع
  paidAdvance?: number;
  remainingAmount: number; // المبلغ المتبقي عند الاستلام
  status: MaintenanceStatus;
  technicianName?: 'المهندس' | 'حمدان' | 'عبد الغني' | 'صيانة خارجية' | string;
  technician?: 'المهندس' | 'حمدان' | 'عبد الغني' | 'صيانة خارجية' | string;
  partUsedName?: string;
  partDeductedFromInventory?: boolean;
  readyDate?: string;
  deliveredDate?: string;
  saleType?: 'نقد' | 'دين';
  guarantorName?: string;
  guarantorPhone?: string;
  workplace?: string;
  dueDate?: string;
  dueTime?: string;
  imageUrl?: string; // صورة الجهاز / العطل / السند
  storageWarningNoticeSent?: boolean;
  notes?: string;
}

export interface RechargeAppDayData {
  salesWithProfit: number;
  salesWithoutProfit: number;
  transferredToApp: number; // المبلغ المحول للبرنامج لشراء رصيد
  remainingInApp: number; // الرصيد المتبقي في التطبيق
  simPurchases?: { count: number; cost: number; total: number };
  notes?: string;
}

export interface RechargeDaySummary {
  totalWithProfit: number;
  totalWithoutProfit: number;
  totalProfit: number;
  hadi?: RechargeAppDayData; // تطبيق الهادي (محمد مياس)
  qimmah?: RechargeAppDayData; // تطبيق الرقم (فايز أبو علي)
  generalNotes?: string;
}

export interface ReturnItem {
  id: string;
  title: string;
  amount: number;
  returnType: 'مرتجع زبون' | 'مرتجع لتاجر' | 'مسلم لمصعب';
  party?: string; // الطرف
  customerPhone?: string;
  imageUrl?: string; // صورة سند الإرجاع أو القطعة
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  amount: number;
  category: 'صرفة المحل' | 'مشاوير وتوصيل' | 'مودم واشتراكات' | 'أدوات ومعدات' | 'شخصي' | 'أخرى';
  description: string;
  recipient?: string;
  imageUrl?: string; // صورة سند القبض / فاتورة المشتريات الخارجية / الورقيات
  invoiceNumber?: string;
  notes?: string;
}

export interface MusabItem {
  id: string;
  amount: number;
  description: string;
  type: 'بيت مصعب' | 'مصعب شخصياً' | 'باقة مزايا' | 'باقة مودم جلال';
  imageUrl?: string;
  notes?: string;
}

export interface WorkerItem {
  id: string;
  workerName: 'حمدان' | 'المهندس' | 'عبد الغني' | 'أخرى';
  amount: number;
  type: 'صرفة' | 'حساب' | 'أجر' | 'سحب';
  description?: string;
  imageUrl?: string;
  notes?: string;
}

export interface SupplierProfile {
  id: string;
  name: string;
  phone?: string;
  location?: string; // الموقع / المدينة / السوق (مثل: صنعاء - شارع القصر / ذمار - الشارع العام)
  dealingType: 'نقد' | 'دين' | 'نقد ودين'; // نظام التعامل
  category?: 'قطع غيار' | 'جوالات' | 'إكسسوارات' | 'رصيد وباقات' | 'أخرى';
  initialBalance?: number; // رصيد افتتاحي
  openingBalance?: number;
  notes?: string;
}

export interface SupplierTransaction {
  id: string;
  supplierName: string;
  type: 'حوالة_مرسلة' | 'شراء_بضاعة' | 'دفعة_نقدية' | 'مرتجع_بضاعة' | 'خصم_تسوية';
  amount: number;
  date: string;
  transferMethod?: 'نقد' | 'كريمي' | 'جوالي' | 'جيب' | 'صاحب المتر' | 'عبر البرنامج' | 'أخرى';
  transferNumber?: string; // رقم الحوالة / السند
  invoiceNumber?: string; // رقم الفاتورة
  imageUrl?: string; // صورة السند أو الفاتورة
  notes?: string;
}

export interface SupplierTransferItem {
  id: string;
  supplierName: 'محمد مياس' | 'فايز أبو علي' | 'عمر القاسمي' | 'خليل الأغبري' | 'العبصري' | 'المصنف' | 'أبو صالح الأقمري' | string;
  amountSent: number;
  purchasesReceivedValue: number; // قيمة المشتريات المقابلة إن وجدت
  transferMethod?: 'نقد' | 'كريمي' | 'جوالي' | 'جيب' | 'صاحب المتر' | 'عبر البرنامج' | string;
  invoiceNumber?: string;
  imageUrl?: string; // صورة السند أو الحوالة أو فاتورة المشتريات
  notes?: string;
}

export interface DayRecord {
  id: string;
  dayNumber: number;
  date: string; // e.g. "2026-08-01"
  dayTitle: string; // e.g. "تاريخ 1 شهر 8"
  isClosed?: boolean;
  notes?: string;
  
  // Sections
  accessories: AccessoryItem[];
  phones: PhoneItem[];
  maintenance: MaintenanceItem[];
  sims?: any[];
  recharge: RechargeDaySummary;
  returns: ReturnItem[];
  expenses: ExpenseItem[];
  musabHouse: MusabItem[];
  musabPersonal: MusabItem[];
  workers: WorkerItem[];
  supplierTransfers: SupplierTransferItem[];

  // Optional computed / cached accounting metrics
  totalSales?: number;
  sales?: number;
  totalPurchases?: number;
  totalExpenses?: number;
  totalMaintenance?: number;
  maintenanceAmount?: number;
  totalRecharge?: number;
  remainingAmount?: number;
  netCashDrawer?: number;
  boxDiff?: number;
  grossProfit?: number;
  mosaabShare?: number;
  managerShare?: number;
  updatedAt?: string;
}

export interface SupplierSummary {
  name: string;
  totalTransferred: number;
  totalPurchases: number;
  balance: number; // Net
  transferCount: number;
  transactions: {
    dayNumber: number;
    date: string;
    amount: number;
    purchases: number;
    method?: string;
    notes?: string;
  }[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'cashier'
  | 'daily'
  | 'partners'
  | 'maintenance'
  | 'recharge'
  | 'sims'
  | 'inventory'
  | 'shortages'
  | 'returns'
  | 'damaged'
  | 'customers'
  | 'delivery'
  | 'employees'
  | 'accounts'
  | 'assets'
  | 'archive'
  | 'reports'
  | 'master'
  | 'musab'
  | 'suppliers'
  | 'owner_portal';

export interface PhoneFunderItem {
  id: string;
  name: string;
  count: number;
  notes?: string;
}

export interface PartnerFundingItem {
  id: string;
  funderName: string; // اسم الداعم / الشريك (مثلاً: عبد الغني)
  funderRole?: 'شريك وممول' | 'داعم ذمار للمحل' | 'رأس مال تأسيسي' | 'مستثمر';
  date: string; // e.g. "2026-08-04"
  dayNumber?: number; // e.g. 4
  amount: number; // المبلغ بالريال اليمني
  category: 'مشتريات إكسسوارات' | 'شراء جوالات' | 'إرسالية بضاعة' | 'قطع غيار وصيانة' | 'قطع غيار' | 'مصاريف ومخاريج طلعة' | 'تمويل عام ورأس مال';
  description: string; // البيان التفصيلي
  phonesList?: PhoneFunderItem[]; // قائمة الجوالات المشتراة في حال كان البند شراء جوالات
  supplierOrParty?: string; // المورد / المحل المشتري منه (مثلاً: حسين بيلة / مراد بيلة / المصنف / قطع غيار)
  paymentMethod?: 'نقد' | 'حوالة' | 'تحويل بنكي' | 'كريمي' | 'أخرى';
  status: 'مقيد في رأس المال' | 'قيد المتابعة' | 'مسدد جزئياً' | 'خالص';
  notes?: string;
  createdAt?: string;
}

export interface MusabReturnPhoneItem {
  id: string;
  name: string; // اسم الجوال المرتجع
  amount: number; // قيمة المرتجع بالريال اليمني
  notes?: string;
  status: 'تم الإرجاع واستلام القيمة' | 'قيد الإرجاع';
}

export interface MusabCashSourceItem {
  id: string;
  sourceType: 'نقد' | 'حوالة جوالي' | 'استرداد مرتجع' | 'أخرى';
  amount: number;
  deliveredBy: string;
  description: string;
  date?: string;
}

export interface MusabPurchasingSettlement {
  id: string;
  title: string;
  updatedAt?: string;
  returnedPhones: MusabReturnPhoneItem[];
  totalReturnedPhonesAmount: number;
  cashSources: MusabCashSourceItem[];
  totalCashReceived: number;
  purchasedPhonesAmount: number;
  purchasedPhonesDetails: string;
  paidToSuppliers: number;
  remainingToSuppliers: number;
  remainingCashWithMusab: number;
  surplusValueVsPhones: number;
  modemTransaction: {
    amount: number;
    customerName: string;
    itemName: string;
    timeReceived: string;
    action: string;
    status: 'مكتمل ومفعل 100%' | 'قيد المتابعة';
  };
  notes?: string;
}

export interface OwnerDay4Settlement {
  id: string;
  date: string;
  dayNumber: number;
  title: string;
  // 1. مبالغ استلمها المالك من العامل حمدان (مبيعات جوالات سابقة)
  hamdanHandover: {
    totalReceived: number; // 270,500
    damagedReturned: number; // 2,000 (تالفة لم تقبل)
    netAccepted: number; // 268,500
    details: string; // "مبلغ 270,500 ر.ي من العامل حمدان كانت محفوظة عنده خاصة بالجوالات التي باعها، وتم إرجاع 2,000 ر.ي تالفة لم تُقبل"
  };
  // 2. مبالغ استلمها المالك من صندوق المحل (إيرادات عمل 1+2+3)
  shopCashHandover: {
    totalReceived: number; // 50,000
    sourceDescription: string; // "من زلط المحل حق عمل الأيام 1 + 2 + 3"
    disbursements: {
      fundingCoverage: number; // 15,000 (توفية للشراء والدعم في صنعاء)
      mohammedMayasTransfer: number; // 18,500 (أرسلها لمحمد مياس مسجلة في يوم 4)
      returnedToShop: number; // 16,500 (الباقي تم رده للمحل)
    };
    totalReturnedToShop: number; // 18,500 (16,500 متبقي الـ 50 ألف + 2,000 عملة تالفة من حمدان)
  };
  notes: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  name: string;
  purchasePrice: number; // سعر الشراء / التكلفة
  sellingPrice: number;  // سعر البيع
  quantity: number;      // الكمية
  barcode: string;       // الباركود (توليد تلقائي أو يدوي)
  category: 'قطع غيار' | 'إكسسوارات' | 'شرايح' | 'أدوات صيانة' | 'جوالات مستعملة/جديدة';
  notes?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string; // رقم الفاتورة
  isExisting: boolean;   // سابقة في المحل أم جديدة
  supplierName: string;  // من المورد
  date: string;
  autoBarcode: boolean;  // نوعية الباركود: توليد تلقائي أم يدوي
  paymentMethod: 'نقد' | 'آجل' | 'حوالة';
  dayId?: string;
  items: PurchaseInvoiceItem[];
  totalPurchaseCost: number;
  totalSellingValue: number;
  expectedProfit: number;
  notes?: string;
  status: 'مسودة' | 'مرحلة' | 'ملغية';
}

export interface POSCartItem {
  id: string;
  name: string;
  category?: string;
  sellingPrice: number;
  costPrice?: number;
  quantity: number;
  barcode?: string;
  inventoryItemId?: string;
  discount?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'قطع غيار' | 'إكسسوارات' | 'شرايح' | 'أدوات صيانة' | 'جوالات مستعملة/جديدة' | 'phones' | 'accessories' | 'spare_parts' | 'sims' | 'tools';
  quantity: number;
  minQuantity?: number;
  purchasePrice?: number;
  costPrice?: number;
  sellingPrice: number;
  barcode?: string;
  imageUrl?: string;
  notes?: string;
  supplierId?: string;
  supplierName?: string;
  damagedQuantity?: number;
  storeId?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  isPendingPricing?: boolean; // هل يحتاج تسعير (سعر التكلفة أو البيع غير محدد)
  isPendingStock?: boolean;   // هل يحتاج جرد كمية (العدد بالمخزن غير معروف بعد)
  lastSoldDate?: string;      // تاريخ آخر بيع
  lastSoldPrice?: number;     // سعر آخر بيع
  dateAdded?: string;         // تاريخ إضافة الصنف للمخزن
}

export interface ShortageItem {
  id: string;
  itemName: string;
  category: 'نواقص المحل' | 'نواقص الصيانة' | 'نواقص الشرايح' | 'طلبية خاصة';
  quantityNeeded: number;
  supplierName?: string;
  urgency: 'عاجل جداً' | 'متوسط' | 'عادي';
  status: 'معلق' | 'تم الطلب' | 'وصل للمحل';
  addedDate: string;
  imageUrl?: string;
  notes?: string;
}

export interface DamagedItem {
  id: string;
  itemName: string;
  category: 'قطع غيار تالفة' | 'إكسسوار تالف' | 'فاقد/ضياع' | 'أخرى';
  lossValue: number;
  date: string;
  reason: string;
  responsiblePerson?: string;
}

export interface CustomerDebtItem {
  id: string;
  customerName: string;
  phone?: string;
  dayId?: string;
  date: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  guarantor?: string; // الضمين
  guarantorPhone?: string; // رقم هاتف الضمين
  workplace?: string; // مكان عمل العميل / وظيفته / عنوانه
  dueDate?: string; // موعد السداد
  dueTime?: string; // وقت السداد التنبيه
  saleType?: 'دين' | 'نقد';
  status: 'متبقي' | 'سدد بالكامل' | 'مسدد جزئياً';
  notes?: string;
}

export interface DeliveryOrder {
  id: string;
  driverName: string;
  driverPhone: string;
  customerName: string;
  customerPhone?: string;
  merchantName?: string;
  merchantPhone?: string;
  deliveryAddress: string;
  itemDescription: string;
  cost: number;
  status: 'جاري التوصيل' | 'تم الاستلام والتسليم' | 'ملغي';
  date: string;
  time?: string;
  notes?: string;
}

export interface SimCardRecord {
  id: string;
  carrier: 'يمن موبايل' | 'سبأفون' | 'يو (YOU)' | 'واي (Y)';
  type: 'شريحة فوتر' | 'شريحة دفع مسبق' | 'بدل فاقد' | 'تفعيل باقة' | 'تفعيل 4G/Volte' | 'تحويل رصيد';
  phoneNumber?: string;
  customerName?: string;
  cost: number;
  price: number;
  profit: number;
  date: string;
  dayId?: string;
  notes?: string;
}

export interface AssetItem {
  id: string;
  name: string;
  category: 'أجهزة صيانة' | 'أثاث وديكور' | 'مودم وشبكة' | 'معدات فحص' | 'أخرى';
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  condition: 'ممتاز' | 'جيد' | 'يحتاج صيانة';
}

export interface ShopSettings {
  name: string;
  ownerName: string;
  tagline: string;
  engineerPhone: string;
  shopPhone: string;
  location: string;
  defaultDueTime: string;
  customLogoUrl?: string;
}

export interface SubscribedShop {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  city?: string;
  licenseKey: string;
  licenseType: 'trial' | 'annual' | 'two_years' | 'lifetime';
  startDate: string;
  expiresAt: string;
  pricePaid?: number;
  status: 'نشط' | 'منتهي' | 'تجريبي' | 'ملغي';
  notes?: string;
}

export interface UserAccount {
  id: string;
  username: string; // e.g. 'owner', 'admin', 'engineer', 'cashier'
  displayName: string;
  role: 'admin' | 'engineer' | 'cashier';
  pinCode: string; // 4-digit PIN
  isActive: boolean;
  canManageSettings?: boolean;
  canViewReports?: boolean;
  isMasterOwner?: boolean;
}

export interface SystemLicense {
  licenseKey: string;
  clientName: string;
  clientPhone: string;
  activatedAt: string;
  expiresAt: string; // ISO date or 'LIFETIME'
  licenseType: 'trial' | 'annual' | 'two_years' | 'lifetime';
  deviceFingerprint: string;
  isActivated: boolean;
}

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr_owner',
    username: 'owner',
    displayName: 'مالك النظام العام',
    role: 'admin',
    pinCode: '7727',
    isActive: true,
    canManageSettings: true,
    canViewReports: true,
    isMasterOwner: true,
  },
  {
    id: 'usr_admin',
    username: 'admin',
    displayName: 'المدير العام (مصعب)',
    role: 'admin',
    pinCode: '1234',
    isActive: true,
    canManageSettings: true,
    canViewReports: true,
  },
  {
    id: 'usr_engineer',
    username: 'engineer',
    displayName: 'مهندس الصيانة والبرمجة',
    role: 'engineer',
    pinCode: '0000',
    isActive: true,
    canManageSettings: false,
    canViewReports: false,
  },
  {
    id: 'usr_cashier',
    username: 'cashier',
    displayName: 'موظف الكاشير والمبيعات',
    role: 'cashier',
    pinCode: '1111',
    isActive: true,
    canManageSettings: false,
    canViewReports: false,
  }
];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  name: 'نمو لخدمات الجوالات',
  ownerName: 'مصعب',
  tagline: 'صيانة وبرمجة احترافية، بيع وبرمجة الجوالات، إكسسوارات وشرايح وتطبيقات الشحن',
  engineerPhone: '772315106',
  shopPhone: '779040507',
  location: 'ذمار - الشارع العام',
  defaultDueTime: '20:00' // 8:00 PM default alert time
};

export const SHOP_INFO = DEFAULT_SHOP_SETTINGS;

export const SHOP_POLICIES = {
  generalWarranty: 'لا توجد أي ضمانات في الصيانة أو البيع نهائياً. جرب بضاعتك وجوالك قبل مغادرة المحل، وأي بضاعة تخرج من المحل لا ترد ولا تستبدل.',
  phonesWarranty: 'بالنسبة للجوالات: ضمانة تجربة قوة البطارية وضعف التغطية لمدة 24 ساعة فقط، بشرط تسجيل مقطع فيديو يثبت المشكلة، ولا يرد الجوال طافياً أو مكسوراً أو عليه علامات سوء استخدام.',
  noTasteReturn: 'لا ترد أو تستبدل أي بضاعة أو جوال أو إكسسوار بسبب عدم الإعجاب.',
  maintenanceStorage: 'الصيانة: في حال إبلاغك بجاهزية الجوال وتأخرت عن استلامه لمدة شهر يتم مصادرة الجوال، وأي جوال متروك بالمحل دون متابعة لمدة شهر يصادر تلقائياً.',
  customerCourtesy: 'شروطنا هذه لكم وليست عليكم لضمان الدقة وحفظ الحقوق.',
  contactPreference: 'في حال الاتصال على أرقام المحل ولم يتم الرد، يرجى إرسال الطلب أو المشكلة فوراً عبر الواتساب أو رسالة SMS.'
};
