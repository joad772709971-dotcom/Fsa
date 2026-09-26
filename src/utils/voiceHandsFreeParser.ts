/**
 * Voice Hands-Free Parser & Section Controller for Continuous Accounting Input
 * Designed for Mos'ab Al-Sufi Phone Shop & Services
 */

export type VoiceSectionType =
  | 'inventory'          // المخزن والمشتريات
  | 'sales'              // المبيعات واليومية
  | 'expenses'           // المصروفات والخرج
  | 'maintenance'        // الصيانة وقطع الغيار
  | 'withdrawals'        // المسحوبات وحساب مصعب
  | 'account_statement'  // كشف الحساب وسجل الموردين
  | 'suppliers'          // سجل الموردين وحوالات التجار
  | 'official_vouchers'  // سندات الصرف والقبض
  | 'sims'               // قسم الشرائح وباقاتها
  | 'damaged'            // قسم التوالف والخسائر
  | 'assets'             // الأصول الثابتة والمعدات
  | 'delivery'           // طلبات التوصيل وسائقي المتر
  | 'cash_drawer'        // حركة الصندوق وتقفيل الدرج
  | 'invoice_ocr'        // فواتير المشتريات المجمعة والماسح
  | 'cost_pricing_guide' // تحديث الأسعار ودليل التكاليف
  | 'pos_cashier'        // كاشير نقطة البيع
  | 'customers'          // سجل العملاء والديون
  | 'networks'           // شبكات الرصيد (الهادي والقمة)
  | 'employees'          // حسابات العمال والموظفين
  | 'reports'            // التقارير المالية
  | 'monthly_settlement' // التقفيل الشهري
  | 'profit_sharing'     // توزيع نسب الأرباح
  | 'forensic_audit'     // المدقق الجنائي المحاسبي
  | 'shortages'          // النواقص وطلبيات الظهر
  | 'returns'            // سجل المرتجعات
  | 'barcode_manager'    // توليد وطباعة الباركود
  | 'partners_funding'   // تمويل ورأس مال الشركاء
  | 'archive'            // أرشيف الدفاتر
  | 'master_table'       // الجدول المحاسبي الموحد
  | 'dashboard';         // لوحة التحكم الرئيسية

export interface VoiceInspectedItem {
  id: string;
  rawText: string;
  name: string;
  section: VoiceSectionType;
  category: string;
  quantity: number;
  costPrice: number; // سعر الشراء / الضمار / التكلفة
  sellingPrice: number; // سعر البيع / المفرق
  totalCost: number;
  totalPrice: number;
  expectedProfit: number;
  barcode: string;
  supplierName?: string;
  customerName?: string;
  timestamp: string;
}

export type VoiceActionIntent =
  | { type: 'switch_section'; section: VoiceSectionType; label: string; tab: string }
  | { type: 'commit_item' }
  | { type: 'cancel_item' }
  | { type: 'greeting'; text: string; replyText: string }
  | { type: 'conversational'; query: string }
  | { type: 'inspect_item'; item: VoiceInspectedItem }
  | { type: 'unknown'; text: string };

export const SECTION_METADATA: Record<
  VoiceSectionType,
  { label: string; shortDesc: string; tab: string; color: string; bgColor: string; icon: string; categoryGroup?: string }
> = {
  inventory: {
    label: 'المخزن والمشتريات',
    shortDesc: 'إدخال بضاعة جديدة للمخزن وحساب الضمار',
    tab: 'inventory',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    icon: 'Package',
    categoryGroup: 'المخزون',
  },
  sales: {
    label: 'المبيعات اليومية',
    shortDesc: 'تسجيل حركات بيع الجوالات والإكسسوارات',
    tab: 'daily_ledger',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    icon: 'ShoppingBag',
    categoryGroup: 'اليومية',
  },
  expenses: {
    label: 'المصروفات والخرج',
    shortDesc: 'تسجيل مصاريف المحل والغداء والنظافة',
    tab: 'daily_ledger',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/30',
    icon: 'CreditCard',
    categoryGroup: 'اليومية',
  },
  maintenance: {
    label: 'الصيانة وقطع الغيار',
    shortDesc: 'تسجيل صيانة الأجهزة وحساب فايدة المهندس 50%',
    tab: 'maintenance',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    icon: 'Wrench',
    categoryGroup: 'الصيانة',
  },
  withdrawals: {
    label: 'المسحوبات الشخصية',
    shortDesc: 'سحب مصعب والشركاء من حساب الأرباح والبيت',
    tab: 'musab_ledger',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    icon: 'User',
    categoryGroup: 'الحسابات',
  },
  account_statement: {
    label: 'كشف الحساب وسجل الموردين',
    shortDesc: 'مطابقة ومراجعة كشوفات حسابات الموردين والعملاء',
    tab: 'account_statement',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/30',
    icon: 'FileSpreadsheet',
    categoryGroup: 'الحسابات',
  },
  suppliers: {
    label: 'سجل الموردين والتجار',
    shortDesc: 'دليل حسابات التجار والموردين وحوالات السداد',
    tab: 'suppliers',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    icon: 'Truck',
    categoryGroup: 'الحسابات',
  },
  official_vouchers: {
    label: 'سندات الصرف والقبض',
    shortDesc: 'تحرير وطباعة سندات القبض والصرف المالية الرسمية',
    tab: 'official_vouchers',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    icon: 'Receipt',
    categoryGroup: 'السندات',
  },
  sims: {
    label: 'قسم الشرائح وباقاتها',
    shortDesc: 'إدارة وتفعيل شرائح يمن موبايل ويو وسبأفون وتوثيق البصمات',
    tab: 'sims',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/30',
    icon: 'Smartphone',
    categoryGroup: 'الاتصالات',
  },
  damaged: {
    label: 'قسم التوالف والخسائر',
    shortDesc: 'حصر الشاشات والقطع التالفة وخسائر الصيانة والمحل',
    tab: 'damaged',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/30',
    icon: 'AlertTriangle',
    categoryGroup: 'المخزون',
  },
  assets: {
    label: 'الأصول الثابتة والمعدات',
    shortDesc: 'إدارة أصول وديكور وتجهيزات وأجهزة المحل',
    tab: 'assets',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10 border-teal-500/30',
    icon: 'Layers',
    categoryGroup: 'الأصول',
  },
  delivery: {
    label: 'طلبات التوصيل والمتر',
    shortDesc: 'إدارة طلبيات الزبائن وسائقي المتر والدراجات النارية',
    tab: 'delivery',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    icon: 'Bike',
    categoryGroup: 'العمليات',
  },
  cash_drawer: {
    label: 'حركة الصندوق وتقفيل الدرج',
    shortDesc: 'مطابقة رصيد النقدية وجرد وردية الدرج وتقفيل الحسابات',
    tab: 'cash_drawer',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    icon: 'Coins',
    categoryGroup: 'الصندوق',
  },
  invoice_ocr: {
    label: 'فواتير المشتريات المجمعة والماسح',
    shortDesc: 'فحص ومسح فواتير المشتريات وتحديث أسعار المخزن',
    tab: 'invoice_ocr',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/30',
    icon: 'ScanLine',
    categoryGroup: 'المشتريات',
  },
  cost_pricing_guide: {
    label: 'دليل التكاليف وتحديث الأسعار',
    shortDesc: 'دليل أسعار وتكاليف القطع والإكسسوارات وهامش الربح',
    tab: 'cost_pricing_guide',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    icon: 'Tag',
    categoryGroup: 'الأسعار',
  },
  pos_cashier: {
    label: 'كاشير نقطة البيع (POS)',
    shortDesc: 'واجهة الكاشير والبيع السريع وفاتورة الزبون',
    tab: 'pos_cashier',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    icon: 'Calculator',
    categoryGroup: 'المبيعات',
  },
  customers: {
    label: 'سجل العملاء والديون',
    shortDesc: 'متابعة ديون الزبائن والبيع الآجل والتحصيل',
    tab: 'customers',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    icon: 'Users',
    categoryGroup: 'الحسابات',
  },
  networks: {
    label: 'شبكات الرصيد (الهادي والقمة)',
    shortDesc: 'كشوفات وأرصدة تطبيقات الرصيد والتحويلات',
    tab: 'networks',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    icon: 'Wifi',
    categoryGroup: 'الاتصالات',
  },
  employees: {
    label: 'حسابات العمال والموظفين',
    shortDesc: 'رواتب الموظفين وصرفة المهندس والنسب',
    tab: 'employees',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/30',
    icon: 'Briefcase',
    categoryGroup: 'الحسابات',
  },
  reports: {
    label: 'التقارير المالية والطباعة',
    shortDesc: 'كشوفات الأرباح والتصدير والطباعة الشاملة',
    tab: 'reports',
    color: 'text-lime-400',
    bgColor: 'bg-lime-500/10 border-lime-500/30',
    icon: 'FileText',
    categoryGroup: 'التقارير',
  },
  monthly_settlement: {
    label: 'التقفيل الشهري',
    shortDesc: 'تصفية أرباح الشهر وحساب نسب الشركاء',
    tab: 'monthly_settlement',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/30',
    icon: 'Calendar',
    categoryGroup: 'الحسابات',
  },
  profit_sharing: {
    label: 'توزيع نسب الأرباح',
    shortDesc: 'إعدادات حصص الشركاء والمساهمات',
    tab: 'profit_sharing',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    icon: 'PieChart',
    categoryGroup: 'الحسابات',
  },
  forensic_audit: {
    label: 'المدقق الجنائي المحاسبي',
    shortDesc: 'فحص سلامة العمليات وكشف التلاعب والعجز المالي',
    tab: 'forensic_audit',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    icon: 'ShieldCheck',
    categoryGroup: 'التدقيق',
  },
  shortages: {
    label: 'النواقص وطلبيات الظهر',
    shortDesc: 'طلبيات الساعة 2:00 ظهراً ونواقص المحل والصيانة',
    tab: 'shortages',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    icon: 'Clock',
    categoryGroup: 'المخزون',
  },
  returns: {
    label: 'سجل المرتجعات',
    shortDesc: 'بضاعة معادة من الزبائن ومردودات المبيعات',
    tab: 'returns',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/30',
    icon: 'RotateCcw',
    categoryGroup: 'المبيعات',
  },
  barcode_manager: {
    label: 'توليد وطباعة الباركود',
    shortDesc: 'طباعة ملصقات الباركود لقطع الغيار والإكسسوارات',
    tab: 'barcode_manager',
    color: 'text-slate-300',
    bgColor: 'bg-slate-500/10 border-slate-500/30',
    icon: 'Barcode',
    categoryGroup: 'الأدوات',
  },
  partners_funding: {
    label: 'تمويل ورأس مال الشركاء',
    shortDesc: 'مساهمات الشركاء ورأس المال العامل',
    tab: 'partners_funding',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    icon: 'Banknote',
    categoryGroup: 'الحسابات',
  },
  archive: {
    label: 'أرشيف الدفاتر والمحاسبة',
    shortDesc: 'سجلات الأيام والدورات المحاسبية السابقة',
    tab: 'archive',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10 border-slate-500/30',
    icon: 'Archive',
    categoryGroup: 'الأدوات',
  },
  master_table: {
    label: 'الجدول المحاسبي الموحد',
    shortDesc: 'عرض الجدول المحاسبي الموحد لكافة الحركات اليومية',
    tab: 'master_table',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    icon: 'Table',
    categoryGroup: 'التقارير',
  },
  dashboard: {
    label: 'لوحة التحكم الرئيسية',
    shortDesc: 'نظرة عامة على المؤشرات والمبيعات والأرباح',
    tab: 'dashboard',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/30',
    icon: 'LayoutDashboard',
    categoryGroup: 'الرئيسية',
  },
};

/**
 * Normalizes Arabic text for flexible matching
 */
export function normalizeArabicSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[،,.;:!?؟!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts written Arabic numbers into numeric values
 */
export function parseArabicNumberWords(text: string): number | null {
  const normalized = normalizeArabicSpeech(text);

  // Exact digits check
  const digitsMatch = normalized.match(/\b\d+\b/);
  if (digitsMatch) {
    return parseInt(digitsMatch[0], 10);
  }

  // Common single word numbers
  const map: Record<string, number> = {
    درزن: 12,
    درازن: 24,
    'نصف درزن': 6,
    'نص درزن': 6,
    حبتين: 2,
    قطعتين: 2,
    حبة: 1,
    قطعة: 1,
    واحد: 1,
    اثنين: 2,
    ثلاثه: 3,
    اربعه: 4,
    خمسه: 5,
    سته: 6,
    سبعه: 7,
    ثمانيه: 8,
    تسعه: 9,
    عشره: 10,
    عشرين: 20,
    ثلاثين: 30,
    اربعين: 40,
    خمسين: 50,
    ستين: 60,
    سبعين: 70,
    ثمانين: 80,
    تسعين: 90,
    ميه: 100,
    مائه: 100,
    ميتين: 200,
    مئتين: 200,
    خمسميه: 500,
    الف: 1000,
    الفين: 2000,
    'ثلاثه الاف': 3000,
    'اربعة الاف': 4000,
    'خمسة الاف': 5000,
    'عشرة الاف': 10000,
  };

  for (const [phrase, val] of Object.entries(map)) {
    if (normalized.includes(phrase)) {
      return val;
    }
  }

  return null;
}

/**
 * Determines if text contains a section switch command across ALL system screens
 */
export function detectSectionSwitch(text: string): VoiceSectionType | null {
  const norm = normalizeArabicSpeech(text);

  // 1. Account Statement & Supplier Ledger (كشف الحساب وسجل الموردين)
  if (
    norm.includes('كشف حساب') ||
    norm.includes('كشف الحساب') ||
    norm.includes('كشوفات الحساب') ||
    norm.includes('مطابقه حساب') ||
    norm.includes('كشف حساب مورد') ||
    norm.includes('كشف حساب عميل') ||
    norm.includes('كشف العملاء') ||
    norm.includes('افتح كشف حساب')
  ) {
    return 'account_statement';
  }

  // 2. Official Vouchers (سندات الصرف والقبض الرسمية)
  if (
    norm.includes('سند قبض') ||
    norm.includes('سند صرف') ||
    norm.includes('سندات القبض') ||
    norm.includes('سندات الصرف') ||
    norm.includes('سندات قبض') ||
    norm.includes('سندات صرف') ||
    norm.includes('السندات الرسميه') ||
    norm.includes('سند رسمي') ||
    norm.includes('ايصال قبض') ||
    norm.includes('سجل سند قبض') ||
    norm.includes('سجل سند صرف') ||
    norm.includes('سندات') ||
    norm.includes('السندات')
  ) {
    return 'official_vouchers';
  }

  // 3. SIM Cards (قسم الشرائح وباقاتها وتوثيق البصمات)
  if (
    norm.includes('قسم الشرايح') ||
    norm.includes('قسم الشرائح') ||
    norm.includes('شرايح') ||
    norm.includes('الشرايح') ||
    norm.includes('شرائح') ||
    norm.includes('الشرائح') ||
    norm.includes('شريحه') ||
    norm.includes('شريحة') ||
    norm.includes('بدل فاقد') ||
    norm.includes('توثيق بصمه') ||
    norm.includes('توثيق البصمه') ||
    norm.includes('باقات الشرايح') ||
    norm.includes('شريحه يمن موبايل') ||
    norm.includes('شريحه يو') ||
    norm.includes('شريحه سبافون')
  ) {
    return 'sims';
  }

  // 4. Damaged Items (قسم التوالف والخسائر)
  if (
    norm.includes('قسم التوالف') ||
    norm.includes('التوالف') ||
    norm.includes('توالف') ||
    norm.includes('الخسائر') ||
    norm.includes('خسائر') ||
    norm.includes('شاشات تالفه') ||
    norm.includes('شاشه تالفه') ||
    norm.includes('بضاعه تالفه') ||
    norm.includes('تالف') ||
    norm.includes('توالف الصيانه') ||
    norm.includes('توالف المخزن')
  ) {
    return 'damaged';
  }

  // 5. Assets & Shop Equipment (الأصول الثابتة والمعدات وتجهيزات المحل)
  if (
    norm.includes('قسم الاصول') ||
    norm.includes('قسم الأصول') ||
    norm.includes('الاصول الثابته') ||
    norm.includes('الأصول الثابتة') ||
    norm.includes('الاصول') ||
    norm.includes('الأصول') ||
    norm.includes('اصول') ||
    norm.includes('أصول') ||
    norm.includes('معدات المحل') ||
    norm.includes('المعدات') ||
    norm.includes('ديكور المحل') ||
    norm.includes('ديكور') ||
    norm.includes('اجهزه المحل') ||
    norm.includes('أجهزة المحل') ||
    norm.includes('اثاث المحل') ||
    norm.includes('تجهيزات المحل')
  ) {
    return 'assets';
  }

  // 6. Delivery Orders & Motorcycles (طلبات التوصيل والدراجات وسائقي المتر)
  if (
    norm.includes('قسم التوصيل') ||
    norm.includes('طلبات التوصيل') ||
    norm.includes('طلبيات التوصيل') ||
    norm.includes('سائق المتر') ||
    norm.includes('سائقي المتر') ||
    norm.includes('سواق المتر') ||
    norm.includes('دراجات التوصيل') ||
    norm.includes('تسليم توصيل') ||
    norm.includes('اريد تسليم توصيل') ||
    norm.includes('طلب توصيل') ||
    norm.includes('دليفري') ||
    norm.includes('التوصيل') ||
    norm.includes('توصيل')
  ) {
    return 'delivery';
  }

  // 7. Cash Drawer & Reconciler (حركة الصندوق وتقفيل الدرج)
  if (
    norm.includes('حركه الصندوق') ||
    norm.includes('حركة الصندوق') ||
    norm.includes('الصندوق') ||
    norm.includes('صندوق') ||
    norm.includes('تقفيل الصندوق') ||
    norm.includes('تقفيل الدرج') ||
    norm.includes('درج الكاش') ||
    norm.includes('درج النقديه') ||
    norm.includes('الدرج') ||
    norm.includes('درج') ||
    norm.includes('تقفيل الحسابات') ||
    norm.includes('جرد الصندوق') ||
    norm.includes('عجز الصندوق') ||
    norm.includes('ورديه الصندوق') ||
    norm.includes('مطابقه الصندوق')
  ) {
    return 'cash_drawer';
  }

  // 8. Batch Purchase Invoices & OCR Scanner (فواتير المشتريات المجمعة والماسح الضوئي)
  if (
    norm.includes('فواتير المشتريات') ||
    norm.includes('فاتوره مشتريات') ||
    norm.includes('فواتير مشتريات مجمعه') ||
    norm.includes('المشتريات المجمعه') ||
    norm.includes('ماسح الفواتير') ||
    norm.includes('فحص الفاتوره') ||
    norm.includes('مسح فاتوره') ||
    norm.includes('فواتير مجمعه') ||
    norm.includes('مسح الفاتوره')
  ) {
    return 'invoice_ocr';
  }

  // 9. Cost & Pricing Guide / Packages (تحديث الأسعار ودليل التكاليف والباقات)
  if (
    norm.includes('تحديث الاسعار') ||
    norm.includes('تحديث الأسعار') ||
    norm.includes('دليل الاسعار') ||
    norm.includes('دليل الأسعار') ||
    norm.includes('دليل التكاليف') ||
    norm.includes('تسعير الباقات') ||
    norm.includes('دليل الباقات') ||
    norm.includes('اسعار القطع') ||
    norm.includes('اسعار الشاشات') ||
    norm.includes('دليل التكلفه')
  ) {
    return 'cost_pricing_guide';
  }

  // 10. Suppliers Hub & Transfers (سجل الموردين وحوالات التجار)
  if (
    norm.includes('قسم الموردين') ||
    norm.includes('سجل الموردين') ||
    norm.includes('الموردين') ||
    norm.includes('موردين') ||
    norm.includes('التجار') ||
    norm.includes('تجار') ||
    norm.includes('حوالات التجار') ||
    norm.includes('سداد الموردين') ||
    norm.includes('حواله مورد')
  ) {
    return 'suppliers';
  }

  // 11. POS Cashier (كاشير نقطة البيع)
  if (
    norm.includes('الكاشير') ||
    norm.includes('كاشير') ||
    norm.includes('نقطه البيع') ||
    norm.includes('نقطة البيع') ||
    norm.includes('شاشه الكاشير') ||
    norm.includes('بيع سريع') ||
    norm.includes('كاشير المبيعات')
  ) {
    return 'pos_cashier';
  }

  // 12. Customers & Debts (سجل العملاء والديون والآجل)
  if (
    norm.includes('قسم العملاء') ||
    norm.includes('سجل العملاء') ||
    norm.includes('العملاء') ||
    norm.includes('عملاء') ||
    norm.includes('الزبائن') ||
    norm.includes('زبائن') ||
    norm.includes('ديون العملاء') ||
    norm.includes('ديون الزبائن') ||
    norm.includes('الديون') ||
    norm.includes('ديون') ||
    norm.includes('الاجل') ||
    norm.includes('الآجل')
  ) {
    return 'customers';
  }

  // 13. Telecom Networks (شبكات الرصيد - الهادي والقمة)
  if (
    norm.includes('شبكات الرصيد') ||
    norm.includes('الشبكات') ||
    norm.includes('شبكات') ||
    norm.includes('تطبيق الهادي') ||
    norm.includes('رصيد الهادي') ||
    norm.includes('رصيد القمه') ||
    norm.includes('حساب الهادي') ||
    norm.includes('حساب القمه') ||
    norm.includes('محمد مياس') ||
    norm.includes('فايز ابو علي')
  ) {
    return 'networks';
  }

  // 14. Employees (حسابات العمال والموظفين والمهندس)
  if (
    norm.includes('الموظفين') ||
    norm.includes('موظفين') ||
    norm.includes('العمال') ||
    norm.includes('عمال') ||
    norm.includes('حساب المهندس') ||
    norm.includes('صرفه المهندس') ||
    norm.includes('رواتب')
  ) {
    return 'employees';
  }

  // 15. Reports (التقارير المالية والطباعة)
  if (
    norm.includes('التقارير') ||
    norm.includes('تقارير') ||
    norm.includes('تقرير مالي') ||
    norm.includes('كشف الارباح') ||
    norm.includes('طباعه تقارير')
  ) {
    return 'reports';
  }

  // 16. Monthly Settlement (التقفيل الشهري)
  if (
    norm.includes('التقفيل الشهري') ||
    norm.includes('تصفيه الشهر') ||
    norm.includes('تصفية الشهر') ||
    norm.includes('حساب الشهر') ||
    norm.includes('ارباح الشهر') ||
    norm.includes('أرباح الشهر')
  ) {
    return 'monthly_settlement';
  }

  // 17. Profit Sharing (توزيع نسب الأرباح)
  if (
    norm.includes('توزيع الارباح') ||
    norm.includes('توزيع الأرباح') ||
    norm.includes('نسب الشركاء') ||
    norm.includes('ارباح الشركاء')
  ) {
    return 'profit_sharing';
  }

  // 18. Forensic Audit (المدقق الجنائي المحاسبي)
  if (
    norm.includes('المدقق الجنائي') ||
    norm.includes('فحص جنائي') ||
    norm.includes('كشف التلاعب') ||
    norm.includes('تدقيق جنائي') ||
    norm.includes('نزاهه العمليات')
  ) {
    return 'forensic_audit';
  }

  // 19. Shortages & 2:00 PM Orders (النواقص وطلبيات الظهر)
  if (
    norm.includes('النواقص') ||
    norm.includes('نواقص') ||
    norm.includes('طلبيات الظهر') ||
    norm.includes('طلبيات 2 الظهر') ||
    norm.includes('طلبيات الساعه 2') ||
    norm.includes('نواقص المحل') ||
    norm.includes('نواقص الصيانه')
  ) {
    return 'shortages';
  }

  // 20. Returns (سجل المرتجعات)
  if (
    norm.includes('المرتجعات') ||
    norm.includes('مرتجعات') ||
    norm.includes('مرتجع') ||
    norm.includes('بضاعه معاده') ||
    norm.includes('ارجاع بضاعه')
  ) {
    return 'returns';
  }

  // 21. Barcode Manager (الباركود)
  if (
    norm.includes('الباركود') ||
    norm.includes('باركود') ||
    norm.includes('طباعه باركود') ||
    norm.includes('ملصقات باركود')
  ) {
    return 'barcode_manager';
  }

  // 22. Partners Funding (تمويل ورأس مال الشركاء)
  if (
    norm.includes('تمويل الشركاء') ||
    norm.includes('راس المال') ||
    norm.includes('رأس المال') ||
    norm.includes('تمويل المحل')
  ) {
    return 'partners_funding';
  }

  // 23. Archive (أرشيف الدفاتر)
  if (
    norm.includes('الارشيف') ||
    norm.includes('الأرشيف') ||
    norm.includes('ارشيف الدفاتر') ||
    norm.includes('الايام السابقه') ||
    norm.includes('الأيام السابقة')
  ) {
    return 'archive';
  }

  // 24. Master Table (الجدول المحاسبي الموحد)
  if (
    norm.includes('الجدول العام') ||
    norm.includes('الجدول الموحد') ||
    norm.includes('ماستر تيبل')
  ) {
    return 'master_table';
  }

  // 25. Dashboard (الرئيسية)
  if (
    norm.includes('الرئيسيه') ||
    norm.includes('الرئيسية') ||
    norm.includes('لوحه التحكم') ||
    norm.includes('لوحة التحكم') ||
    norm.includes('الداشبورد')
  ) {
    return 'dashboard';
  }

  // 26. Inventory / Purchases (المخزن وبضاعة المحل)
  if (
    norm.includes('مخزن') ||
    norm.includes('المخزن') ||
    norm.includes('مشتريات') ||
    norm.includes('المشتريات') ||
    norm.includes('بضاعه') ||
    norm.includes('البضاعه') ||
    norm.includes('ندخل المخزن') ||
    norm.includes('نرجع للمخزن') ||
    norm.includes('قسم المخزن')
  ) {
    return 'inventory';
  }

  // 27. Sales (المبيعات واليومية العامة)
  if (
    norm.includes('مبيعات') ||
    norm.includes('المبيعات') ||
    norm.includes('اليوميه العامه') ||
    norm.includes('اليومية العامة') ||
    norm.includes('كشف اليوميه') ||
    norm.includes('كشف اليومية') ||
    norm.includes('ندخل المبيعات') ||
    norm.includes('ننتقل للمبيعات') ||
    norm.includes('قسم المبيعات')
  ) {
    return 'sales';
  }

  // 28. Expenses (المصروفات والخرج وصرفة المحل)
  if (
    norm.includes('مصروفات') ||
    norm.includes('المصروفات') ||
    norm.includes('مصاريف') ||
    norm.includes('المصاريف') ||
    norm.includes('صرفيات') ||
    norm.includes('الصرفيات') ||
    norm.includes('الخرج') ||
    norm.includes('خرج') ||
    norm.includes('صرفه المحل') ||
    norm.includes('صرفة المحل') ||
    norm.includes('ندخل المصروفات') ||
    norm.includes('ننتقل للمصروفات') ||
    norm.includes('قسم المصروفات')
  ) {
    return 'expenses';
  }

  // 29. Maintenance (الصيانة وقطع الغيار)
  if (
    norm.includes('صيانه') ||
    norm.includes('الصيانه') ||
    norm.includes('صيانة') ||
    norm.includes('الصيانة') ||
    norm.includes('قطع غيار') ||
    norm.includes('ندخل الصيانه') ||
    norm.includes('ننتقل للصيانه') ||
    norm.includes('قسم الصيانه') ||
    norm.includes('مركز الصيانه')
  ) {
    return 'maintenance';
  }

  // 30. Withdrawals & Mosaab Account (مسحوبات مصعب وحسابه والبيت)
  if (
    norm.includes('مسحوبات') ||
    norm.includes('المسحوبات') ||
    norm.includes('سحب مصعب') ||
    norm.includes('مسحوبات مصعب') ||
    norm.includes('حساب مصعب') ||
    norm.includes('مصعب شخصيا') ||
    norm.includes('صرفه البيت') ||
    norm.includes('سحوبات') ||
    norm.includes('قسم المسحوبات')
  ) {
    return 'withdrawals';
  }

  return null;
}

/**
 * Checks if the utterance is a verbal confirmation command
 * (e.g. "صح", "اعتمد", "احفظ", "تمام", "أكد", "سجل")
 */
export function isVerbalConfirmation(text: string): boolean {
  const norm = normalizeArabicSpeech(text);
  const confirmWords = [
    'صح',
    'اعتمد',
    'احفظ',
    'احفظه',
    'تمام',
    'اكد',
    'سجل',
    'سجله',
    'موافق',
    'نعم',
    'اوكي',
    'تم',
    'اعتمدها',
    'احفظها',
    'اعتمد الصنف',
    'احفظ الصنف',
  ];

  return confirmWords.some((w) => norm === w || norm.startsWith(w + ' ') || norm.endsWith(' ' + w));
}

/**
 * Checks if the utterance is a cancellation command
 * (e.g. "إلغاء", "امسح", "تراجع", "خطأ", "لا")
 */
export function isVerbalCancellation(text: string): boolean {
  const norm = normalizeArabicSpeech(text);
  const cancelWords = [
    'الغاء',
    'امسح',
    'امسحه',
    'تراجع',
    'خطا',
    'لا',
    'الغيه',
    'الغي',
    'احذف',
    'احذفه',
    'غير صحيح',
  ];

  return cancelWords.some((w) => norm === w || norm.startsWith(w + ' ') || norm.endsWith(' ' + w));
}

/**
 * Generates an automated barcode based on category
 */
export function generateAutoBarcode(category: string): string {
  const prefix =
    category === 'phones'
      ? 'PHN'
      : category === 'maintenance'
      ? 'MNT'
      : category === 'sims'
      ? 'SIM'
      : 'ACC';
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${rand}`;
}

/**
 * Detects greetings, salutations, courtesies, and introductory inquiries
 */
export function detectGreeting(text: string): { isGreeting: boolean; reply: string } | null {
  const norm = normalizeArabicSpeech(text);
  if (!norm || norm.length < 2) return null;

  const greetingsMap: Array<{ patterns: string[]; reply: string }> = [
    {
      patterns: ['السلام عليكم', 'سلام عليكم', 'وعليكم السلام', 'سلام الله عليكم'],
      reply: 'وعليكم السلام ورحمة الله وبركاته! أهلاً وسهلاً بك، كيف يمكنني مساعدتك؟',
    },
    {
      patterns: ['صباح الخير', 'صباح النور', 'صباح الورد', 'يسعد صباحك', 'صباح الفل'],
      reply: 'صباح النور والسرور والبركة! مرحباً بك، بماذا أساعدك اليوم؟',
    },
    {
      patterns: ['مساء الخير', 'مساء النور', 'مساء الورد', 'يسعد مساك', 'مساء الفل'],
      reply: 'مساء الخير والمسرات! أهلاً بك، أنا معك في أي وقت، تفضل بما تريد.',
    },
    {
      patterns: ['كيفك', 'كيف حالك', 'شخبارك', 'كيف الصحة', 'علومك', 'اخبارك', 'كيف الامور', 'عساك بخير'],
      reply: 'أهلاً بك! أنا بأفضل حال وفي كامل الجاهزية لمساعدتك في أي استفسار أو عمل، تفضل.',
    },
    {
      patterns: [
        'مرحبا بك',
        'مرحباً بك',
        'مرحبا',
        'مراحب',
        'يا مرحب',
        'مرحبين',
        'اهلا وسهلا',
        'اهلا بك',
        'أهلا بك',
        'اهلين',
        'أهلين',
        'يا هلا',
        'هلا والله',
        'هلا وغلا',
        'هلا بيك',
        'هلا بك',
        'هلا',
      ],
      reply: 'مرحباً بك، بماذا أساعدك؟',
    },
    {
      patterns: ['شكرا', 'شكرا لك', 'مشكور', 'تسلم', 'يعطيك العافيه', 'الله يعافيك', 'ما قصرت', 'جزاك الله خير'],
      reply: 'العفو، على الرحب والسعة دائماً! أنا في خدمتك متى ما أردت.',
    },
    {
      patterns: ['من انت', 'مين انت', 'عرف عن نفسك', 'عرف بنفسك', 'ما هو اسمك', 'ما اسمك', 'شو اسمك'],
      reply: 'أنا رفيقك ومساعدك الذكي الشامل، أساعدك في إدارة كافة شاشات وأقسام النظام، وأجيبك عن أي سؤال أو استفسار في مختلف مجالات المعرفة والحياة.',
    },
  ];

  for (const item of greetingsMap) {
    for (const pat of item.patterns) {
      if (
        norm === pat ||
        norm.startsWith(pat + ' ') ||
        norm.endsWith(' ' + pat) ||
        (norm.length <= pat.length + 15 && norm.includes(pat))
      ) {
        return { isGreeting: true, reply: item.reply };
      }
    }
  }

  return null;
}

/**
 * Checks if the utterance is a question, calculation, or conversational inquiry
 */
export function isConversationalInquiry(text: string): boolean {
  const norm = normalizeArabicSpeech(text);
  if (!norm || norm.length < 2) return false;

  // Question words and inquiry prefixes
  const questionStarters = [
    'كم',
    'ماهو',
    'ما هو',
    'ما هي',
    'ماهي',
    'ماذا',
    'من هو',
    'من هي',
    'من هم',
    'اين',
    'أين',
    'متى',
    'كيف',
    'لماذا',
    'ليه',
    'ليش',
    'هل',
    'احسب',
    'احسب لي',
    'كم يساوي',
    'وش',
    'ايش',
    'شو',
    'عطني',
    'اعطني',
    'عرفني',
    'اشرح',
    'اشرح لي',
    'فهمني',
    'فهمنا',
    'قول لي',
    'قلي',
    'تكلم عن',
    'معلومات عن',
    'من فضلك',
    'ممكن',
    'تنصحني',
    'نصيحة',
    'رايك',
    'رأيك',
    'ايش رايك',
    'شو رايك',
    'فكرة',
    'نكتة',
    'احكي لي',
    'سولف',
    'قصة',
    'حكمة',
  ];

  for (const q of questionStarters) {
    if (norm === q || norm.startsWith(q + ' ') || norm.includes(' ' + q + ' ')) {
      return true;
    }
  }

  // Open-domain life topics, general knowledge, and conversational subjects
  const knowledgeKeywords = [
    'عاصمة',
    'تاريخ',
    'جغرافيا',
    'طقس',
    'الجو',
    'كواكب',
    'شمس',
    'قمر',
    'طبخ',
    'وصفة',
    'اكلة',
    'علاج',
    'صحة',
    'رياضة',
    'سيارة',
    'تقنية',
    'برمجة',
    'كود',
    'ترجمة',
    'معنى',
    'مرادف',
    'سعر الدولار',
    'سعر الصرف',
    'سعر الذهب',
    'كم الساعه',
    'كم الوقت',
  ];

  for (const kw of knowledgeKeywords) {
    if (norm.includes(kw)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the utterance contains explicit intent to record items in inventory or system
 */
export function isCommercialOrInventoryUtterance(text: string): boolean {
  const norm = normalizeArabicSpeech(text);
  if (!norm || norm.length < 2) return false;

  const explicitEntryVerbs = [
    'سجل في المخزن',
    'اضف في المخزن',
    'اضف للمخزن',
    'ادخل في المخزن',
    'ادخل للمخزن',
    'بضاعه جديده',
    'بضاعة جديدة',
    'سجل بضاعه',
    'سجل بضاعة',
    'شراء بضاعه',
    'وارد جديد',
    'سجل صنف',
    'صنف جديد',
    'سجل مبيعات',
    'سجل بيع',
    'سجل مشتريات',
    'سجل مصروف',
    'سجل خرج',
    'سجل صرفه',
    'سجل صيانه',
    'سجل سحب',
    'سجل مسحوبات',
  ];

  return explicitEntryVerbs.some((v) => norm.startsWith(v) || norm.includes(' ' + v));
}

/**
 * Flexible Item Parser:
 * Extracts Item Name, Quantity, Cost/Purchase/Damar price, and Selling price
 * REGARDLESS OF ORDER in spoken Arabic!
 * Strictly requires positive cost or selling price to avoid turning regular chatter into items!
 */
export function parseSpokenItemFlexible(
  rawSpeech: string,
  defaultSection: VoiceSectionType = 'inventory'
): VoiceInspectedItem | null {
  const norm = normalizeArabicSpeech(rawSpeech);
  if (!norm || norm.length < 2) return null;

  // Check if it's purely a section, greeting, or commit/cancel command
  if (
    detectSectionSwitch(norm) ||
    isVerbalConfirmation(norm) ||
    isVerbalCancellation(norm) ||
    detectGreeting(norm)
  ) {
    return null;
  }

  // Must have at least one numeric digit or explicit item/price signal, otherwise treat as conversational inquiry
  const hasNumeric = /\d+/.test(norm);
  const hasPriceOrQuantitySignal = /(?:شراء|سعر|تكلفه|ضمار|بيع|ريال|ر\.ي|درزن|حبتين|قطعتين|حبه|قطعه|الف|الفين|ميه|مائه)/.test(norm);
  if (!hasNumeric && !hasPriceOrQuantitySignal) {
    return null;
  }

  // 1. Determine Section
  let section: VoiceSectionType = defaultSection;
  if (norm.startsWith('مبيعات') || norm.includes(' بيع ')) section = 'sales';
  else if (norm.startsWith('صرفه') || norm.startsWith('صرفيات') || norm.startsWith('مصروفات') || norm.includes(' غداء ') || norm.startsWith('خرج')) section = 'expenses';
  else if (norm.startsWith('صيانه') || norm.includes(' تصليح ') || norm.includes(' شاشه ') || norm.includes(' تغيير ')) section = 'maintenance';
  else if (norm.startsWith('سحب') || norm.includes('سحب مصعب')) section = 'withdrawals';
  else if (norm.startsWith('مشتريات') || norm.startsWith('مخزن') || norm.startsWith('ضمار') || norm.includes(' شراء ')) section = 'inventory';

  // 2. Extract Quantity
  let quantity = 1;
  const qtyPatterns = [
    /(\d+)\s*(?:حبه|حبات|قطعه|قطع|درزن|كيس|باكت)/,
    /(?:كميه|الكميه|عدد|العدد)\s*[:=]?\s*(\d+)/,
    /(?:حبه|قطعه)\s*(\d+)/,
    /(\d+)\s*حبه/,
  ];

  for (const pat of qtyPatterns) {
    const m = norm.match(pat);
    if (m && m[1]) {
      quantity = parseInt(m[1], 10);
      break;
    }
  }

  // If no digits for quantity, check verbal words like "عشرين حبه", "درزن"
  if (quantity === 1) {
    if (norm.includes('درزن')) quantity = 12;
    else if (norm.includes('نصف درزن') || norm.includes('نص درزن')) quantity = 6;
    else if (norm.includes('حبتين') || norm.includes('قطعتين')) quantity = 2;
  }

  // 3. Extract Prices: Cost/Purchase (شراء / ضمار / جملة / تكلفة) & Selling (بيع / مفرق / سعر)
  let costPrice = 0;
  let sellingPrice = 0;

  // Look for cost/purchase price patterns
  const costPatterns = [
    /(?:شراء|سعر الشراء|الضمار|ضمار|جمله|تكلفه|تكلفته|الحبه ب|بـ|ب)\s*(\d+)(?:\s*(?:ريال|ر\.ي))?/,
    /(\d+)\s*(?:شراء|ضمار|جمله|تكلفه)/,
  ];

  for (const pat of costPatterns) {
    const m = norm.match(pat);
    if (m && m[1]) {
      costPrice = parseInt(m[1], 10);
      break;
    }
  }

  // Look for selling price patterns
  const sellPatterns = [
    /(?:بيع|سعر البيع|مفرق|نبيعه ب|نبيع ب|نبيع|فايده|ربح)\s*(\d+)(?:\s*(?:ريال|ر\.ي))?/,
    /(\d+)\s*(?:بيع|مفرق)/,
  ];

  for (const pat of sellPatterns) {
    const m = norm.match(pat);
    if (m && m[1]) {
      sellingPrice = parseInt(m[1], 10);
      break;
    }
  }

  // Look for standalone numbers in text
  const allNumbers = (norm.match(/\b\d+\b/g) || []).map((n) => parseInt(n, 10));

  // If we couldn't match cost or selling prices specifically, deduce from numbers sequence
  if (costPrice === 0 && sellingPrice === 0 && allNumbers.length >= 2) {
    const priceCandidates = allNumbers.filter((n) => n !== quantity);
    if (priceCandidates.length >= 2) {
      costPrice = Math.min(priceCandidates[0], priceCandidates[1]);
      sellingPrice = Math.max(priceCandidates[0], priceCandidates[1]);
    } else if (priceCandidates.length === 1) {
      if (section === 'inventory') costPrice = priceCandidates[0];
      else sellingPrice = priceCandidates[0];
    }
  } else if (costPrice === 0 && sellingPrice > 0 && allNumbers.length >= 2) {
    const remaining = allNumbers.filter((n) => n !== quantity && n !== sellingPrice);
    if (remaining.length > 0) costPrice = remaining[0];
  } else if (costPrice > 0 && sellingPrice === 0 && allNumbers.length >= 2) {
    const remaining = allNumbers.filter((n) => n !== quantity && n !== costPrice);
    if (remaining.length > 0) sellingPrice = remaining[0];
  } else if (costPrice === 0 && sellingPrice === 0 && allNumbers.length === 1) {
    const single = allNumbers[0];
    if (section === 'expenses' || section === 'withdrawals') {
      sellingPrice = single;
      costPrice = single;
    } else if (section === 'inventory') {
      costPrice = single;
      sellingPrice = Math.round(single * 1.35); // Default 35% markup estimation
    } else {
      sellingPrice = single;
    }
  }

  // If selling price is still 0 for inventory, suggest reasonable markup
  if (section === 'inventory' && costPrice > 0 && sellingPrice === 0) {
    sellingPrice = Math.round(costPrice * 1.3);
  }

  // CRITICAL RULE: If costPrice and sellingPrice are both zero or negative,
  // this is NOT a valid commercial item! Return null so it does not pollute the screen.
  if (costPrice <= 0 && sellingPrice <= 0) {
    return null;
  }

  // 4. Extract Clean Item Name
  let cleanName = norm;

  // Remove common prefix triggers
  const triggersToRemove = [
    'سجل في المخزن',
    'اضف في المخزن',
    'اضف للمخزن',
    'ادخل في المخزن',
    'ادخل للمخزن',
    'بضاعه جديده',
    'بضاعة جديدة',
    'سجل بضاعه',
    'سجل بضاعة',
    'مشتريات',
    'مبيعات',
    'صرفيات',
    'صرفه',
    'مصروفات',
    'صيانه',
    'سحب مصعب',
    'سحب',
    'مخزن',
    'اضف',
    'سجل',
    'دخل',
  ];
  for (const trig of triggersToRemove) {
    if (cleanName.startsWith(trig + ' ')) {
      cleanName = cleanName.slice(trig.length).trim();
    }
  }

  // Remove price words & numbers to leave purely the item name
  cleanName = cleanName
    .replace(/(?:سعر الشراء|شراء|الضمار|ضمار|جمله|تكلفه)\s*\d+/g, ' ')
    .replace(/(?:سعر البيع|بيع|مفرق|نبيعه ب|فايده)\s*\d+/g, ' ')
    .replace(/(?:كميه|الكميه|عدد|العدد)\s*\d+/g, ' ')
    .replace(/\b\d+\s*(?:حبه|حبات|قطعه|قطع|درزن)\b/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/(?:ريال|ر\.ي|حبه|حبات|قطعه|قطع|درزن)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If cleanName ended up empty or containing obvious conversational words, abort
  if (
    !cleanName ||
    cleanName.length < 2 ||
    cleanName.startsWith('كم ') ||
    cleanName.startsWith('ما هو') ||
    cleanName.startsWith('ماهو') ||
    cleanName.startsWith('كيف ') ||
    cleanName.includes('مرحبا')
  ) {
    return null;
  }

  // Determine category
  let category = 'accessories';
  if (
    cleanName.includes('جوال') ||
    cleanName.includes('ايفون') ||
    cleanName.includes('سامسونج') ||
    cleanName.includes('ريدمي') ||
    cleanName.includes('شاومي') ||
    cleanName.includes('هاتف')
  ) {
    category = 'phones';
  } else if (section === 'maintenance') {
    category = 'maintenance';
  } else if (section === 'expenses') {
    category = 'expenses';
  } else if (section === 'withdrawals') {
    category = 'mosaab';
  }

  const totalPrice = sellingPrice > 0 ? sellingPrice * quantity : costPrice * quantity;
  const totalCost = costPrice * quantity;
  const expectedProfit = totalPrice > totalCost ? totalPrice - totalCost : 0;

  return {
    id: `vitem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    rawText: rawSpeech,
    name: cleanName,
    section,
    category,
    quantity,
    costPrice,
    sellingPrice,
    totalCost,
    totalPrice,
    expectedProfit,
    barcode: generateAutoBarcode(category),
    timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Main intent router for Hands-Free voice flow with Intent Classification First:
 * 1. Screen / Section Navigation
 * 2. Verbal Confirmation / Cancellation
 * 3. Greetings & Salutations (Natural spoken reply without touching items)
 * 4. General Questions, Math Calculations & Open-Domain Life Chat
 * 5. Commercial Item & Inventory Feeding (Strictly requires prices/quantities)
 */
export function analyzeVoiceAction(
  rawTranscript: string,
  currentSection: VoiceSectionType = 'inventory',
  hasActiveInspectedItem: boolean = false
): VoiceActionIntent {
  const text = rawTranscript.trim();
  if (!text) return { type: 'unknown', text };

  // 1. Check if user wants to switch section
  const targetSection = detectSectionSwitch(text);
  if (targetSection) {
    const meta = SECTION_METADATA[targetSection];
    return {
      type: 'switch_section',
      section: targetSection,
      label: meta.label,
      tab: meta.tab,
    };
  }

  // 2. Check verbal confirmation
  if (isVerbalConfirmation(text)) {
    if (hasActiveInspectedItem) {
      return { type: 'commit_item' };
    }
  }

  // 3. Check verbal cancellation
  if (isVerbalCancellation(text)) {
    if (hasActiveInspectedItem) {
      return { type: 'cancel_item' };
    }
  }

  // 3. Intent Classification First: Check Greetings & Courtesies
  const greeting = detectGreeting(text);
  if (greeting) {
    return {
      type: 'greeting',
      text,
      replyText: greeting.reply,
    };
  }

  // 4. Intent Classification First: Check Conversational Queries, Questions & Calculations
  if (isConversationalInquiry(text)) {
    return {
      type: 'conversational',
      query: text,
    };
  }

  // 5. Intent Classification First: Commercial Operations & Inventory Feeding
  // (Only triggered when utterance explicitly contains entry commands or item with prices)
  const inspected = parseSpokenItemFlexible(text, currentSection);
  if (inspected && (inspected.costPrice > 0 || inspected.sellingPrice > 0)) {
    return {
      type: 'inspect_item',
      item: inspected,
    };
  }

  // 6. Default route: pass to smart open-domain conversational assistant
  return {
    type: 'conversational',
    query: text,
  };
}
