import { PartnerFundingItem, MusabPurchasingSettlement } from '../types';

export const INITIAL_PARTNERS_FUNDING: PartnerFundingItem[] = [
  {
    id: 'fund-1',
    funderName: 'عبد الغني',
    funderRole: 'داعم ذمار للمحل',
    date: '2026-08-04',
    dayNumber: 4,
    amount: 134000,
    category: 'مشتريات إكسسوارات',
    description: 'مشتريات من حسين بيلة',
    supplierOrParty: 'حسين بيلة',
    paymentMethod: 'نقد',
    status: 'مقيد في رأس المال',
    notes: 'تمويل شراء بضاعة إكسسوارات من المورد حسين بيلة - دعم ذمار للمحل',
    createdAt: '2026-08-04T10:00:00.000Z'
  },
  {
    id: 'fund-2',
    funderName: 'عبد الغني',
    funderRole: 'داعم ذمار للمحل',
    date: '2026-08-04',
    dayNumber: 4,
    amount: 114000,
    category: 'مشتريات إكسسوارات',
    description: 'مشتريات إكسسوارات من مراد بيلة',
    supplierOrParty: 'مراد بيلة',
    paymentMethod: 'نقد',
    status: 'مقيد في رأس المال',
    notes: 'تمويل شراء إكسسوارات من المورد مراد بيلة - دعم ذمار للمحل',
    createdAt: '2026-08-04T11:00:00.000Z'
  },
  {
    id: 'fund-3',
    funderName: 'عبد الغني',
    funderRole: 'داعم ذمار للمحل',
    date: '2026-08-04',
    dayNumber: 4,
    amount: 230500,
    category: 'شراء جوالات',
    description: 'شراء دفعة جوالات جملة (10 جوالات من صنعاء)',
    supplierOrParty: 'سوق الجوالات - صنعاء',
    phonesList: [
      { id: 'ph-1', name: 'جوال J3 مطور', count: 1, notes: 'سامسونج جي 3 مطور' },
      { id: 'ph-2', name: 'جوال Samsung A32', count: 1, notes: 'سامسونج ايه 32' },
      { id: 'ph-3', name: 'جوال Samsung A11', count: 2, notes: 'سامسونج ايه 11 (عدد 2)' },
      { id: 'ph-4', name: 'جوال ريفل (Revvl)', count: 2, notes: 'ريفل فور / بلس (عدد 2)' },
      { id: 'ph-5', name: 'جوال LG K51', count: 1, notes: 'ال جي كي 51' },
      { id: 'ph-6', name: 'جوال Samsung A10e', count: 2, notes: 'سامسونج ايه 10 اي (عدد 2)' },
      { id: 'ph-7', name: 'جوال Samsung S10e', count: 1, notes: 'سامسونج اس 10 اي' }
    ],
    paymentMethod: 'نقد',
    status: 'مقيد في رأس المال',
    notes: 'تمويل شراء دفعة أجهزة وجوالات مستخدمة وجديدة (إجمالي 10 أجهزة) - دعم ذمار للمحل',
    createdAt: '2026-08-04T12:00:00.000Z'
  },
  {
    id: 'fund-4',
    funderName: 'عبد الغني',
    funderRole: 'داعم ذمار للمحل',
    date: '2026-08-04',
    dayNumber: 4,
    amount: 6500,
    category: 'مصاريف ومخاريج طلعة',
    description: 'مصروف ومخاريج طلعة صنعاء',
    supplierOrParty: 'مصاريف سفر وانتقال',
    paymentMethod: 'نقد',
    status: 'مقيد في رأس المال',
    notes: 'مصروف ومخاريج وانتقال طلعة صنعاء لجلب بضاعة الجوالات والإكسسوارات - دعم ذمار للمحل',
    createdAt: '2026-08-04T13:00:00.000Z'
  },
  {
    id: 'fund-6',
    funderName: 'عبد الغني',
    funderRole: 'داعم ذمار للمحل',
    date: '2026-08-04',
    dayNumber: 4,
    amount: 4800,
    category: 'قطع غيار وصيانة',
    description: 'شراء قطع غيار',
    supplierOrParty: 'محلات قطع الغيار',
    paymentMethod: 'نقد',
    status: 'مقيد في رأس المال',
    notes: 'تمويل شراء قطع غيار في يوم 4 شهر 8 - دعم ذمار للمحل',
    createdAt: '2026-08-04T14:00:00.000Z'
  },
  {
    id: 'fund-5',
    funderName: 'عبد الغني',
    funderRole: 'داعم ذمار للمحل',
    date: '2026-08-05',
    dayNumber: 5,
    amount: 56500,
    category: 'إرسالية بضاعة',
    description: 'مرسلة للمصنف إكسسوارات',
    supplierOrParty: 'المصنف',
    paymentMethod: 'حوالة',
    status: 'مقيد في رأس المال',
    notes: 'تمويل مرسل للمصنف لشراء إكسسوارات وبضاعة للمحل - دعم ذمار للمحل',
    createdAt: '2026-08-05T09:30:00.000Z'
  }
];

export const INITIAL_OWNER_DAY4_SETTLEMENT = {
  id: 'settlement-day-4',
  date: '2026-08-04',
  dayNumber: 4,
  title: 'تسليمات المالك وحركة السيولة في يوم دعم المحل (يوم 4 شهر 8)',
  hamdanHandover: {
    totalReceived: 270500,
    damagedReturned: 2000,
    netAccepted: 268500,
    details: 'مبلغ 270,500 ر.ي تم استلامه من العامل حمدان كانت محفوظة عنده خاصة بمبيعات الجوالات التي باعها، وتم إرجاع مبلغ 2,000 ر.ي عملة تالفة لم تقبل.'
  },
  shopCashHandover: {
    totalReceived: 50000,
    sourceDescription: 'استلام من زلط المحل حق عمل الأيام (1 + 2 + 3)',
    disbursements: {
      fundingCoverage: 15000,
      mohammedMayasTransfer: 18500,
      returnedToShop: 16500
    },
    totalReturnedToShop: 18500 // 16500 متبقي الـ 50 ألف + 2000 تالفة من حمدان
  },
  summaryNotes: 'تمت تصفية مبالغ رحلة صنعاء ويوم الدعم بالكامل، ورد 16,500 ريال متبقي زلط المحل + 2,000 ريال تالفة من عهدة حمدان لدرج المحل بإجمالي 18,500 ريال نقدية مردودة.'
};

export const INITIAL_MUSAB_PURCHASING_SETTLEMENT: MusabPurchasingSettlement = {
  id: 'musab-purchasing-settlement-1',
  title: 'كشف مشتريات وعهدة وتصفية مصعب (الجوالات، المرتجعات، والسيولة النقدية)',
  returnedPhones: [
    {
      id: 'ret-1',
      name: 'جوال Samsung Galaxy A32',
      amount: 32000,
      notes: 'مرتجع للتاجر تم تسليمه واستلام قيمته كاش',
      status: 'تم الإرجاع واستلام القيمة'
    },
    {
      id: 'ret-2',
      name: 'جوال Samsung Galaxy A10e',
      amount: 17000,
      notes: 'مرتجع للتاجر تم تسليمه واستلام قيمته كاش',
      status: 'تم الإرجاع واستلام القيمة'
    },
    {
      id: 'ret-3',
      name: '2× جوالات ريفل (Revvl)',
      amount: 24000,
      notes: 'مرتجع عدد 2 جوالات ريفل (12,000 ر.ي للجهاز)',
      status: 'تم الإرجاع واستلام القيمة'
    }
  ],
  totalReturnedPhonesAmount: 75000, // 32000 + 17000 + 24000
  cashSources: [
    {
      id: 'cash-1',
      sourceType: 'نقد',
      amount: 150000,
      deliveredBy: 'باسم (تمكين وتحويل نقد)',
      description: 'زلط نقد 150,000 ر.ي مكنت باسم حولها له كاش',
      date: '2026-08-27'
    },
    {
      id: 'cash-2',
      sourceType: 'حوالة جوالي',
      amount: 67000,
      deliveredBy: 'محفظة جوالي',
      description: 'حوالة إلكترونية عبر محفظة جوالي 67,000 ر.ي',
      date: '2026-08-27'
    },
    {
      id: 'cash-3',
      sourceType: 'استرداد مرتجع',
      amount: 75000,
      deliveredBy: 'استرداد من التجار',
      description: 'إجمالي قيمة المرتجعات التي شل قيمتها من التجار (A32 + A10e + 2×Revvl)',
      date: '2026-08-27'
    }
  ],
  totalCashReceived: 292000, // 150000 + 67000 + 75000
  purchasedPhonesAmount: 252500,
  purchasedPhonesDetails: 'جوالات جديدة أداها للمحل بقيمة 252,500 ر.ي',
  paidToSuppliers: 217000, // ما سلمه للتاجر فعلياً
  remainingToSuppliers: 35500, // 252500 - 217000 (باقي للتجار)
  remainingCashWithMusab: 75000, // 292000 - 217000 (السيولة المتبقية عند مصعب كاش)
  surplusValueVsPhones: 39500, // 292000 - 252500
  modemTransaction: {
    amount: 25000,
    customerName: 'عبد المجيد القيسي',
    itemName: 'مودم أوبرا (Opera)',
    timeReceived: 'نقد نص الليل',
    action: 'حولها مصعب لتجار المودمات وفعلوا المودم للمشتري بالكامل',
    status: 'مكتمل ومفعل 100%'
  },
  notes: 'تصفية شاملة لعهدة مصعب ومشتريات الجوالات والمرتجعات. إجمالي السيولة التي صارت عنده 292,000 ر.ي، سلم للتجار 217,000 ر.ي، والمتبقي كاش في يده 75,000 ر.ي، بالإضافة إلى توريد جوالات بـ 252,500 ر.ي ومتبقي للتاجر 35,500 ر.ي.'
};


