import { DayRecord } from '../types';

export const DAYS_1_TO_10: DayRecord[] = [
  // ========================== يوم 1 ==========================
  {
    id: 'day-1',
    dayNumber: 1,
    date: '2026-08-01',
    dayTitle: 'تاريخ 1 شهر 8',
    accessories: [
      { id: 'd1-acc-1', name: 'وصلة كشاف', price: 500 },
      { id: 'd1-acc-2', name: 'لاصق', price: 400 },
      { id: 'd1-acc-3', name: 'بطارية J7', price: 1500 },
      { id: 'd1-acc-4', name: 'ريموت مع الحجار', price: 500 },
      { id: 'd1-acc-6', name: 'سماعة عادي', price: 300 },
      { id: 'd1-acc-7', name: 'رايحة', price: 1000 }
    ],
    phones: [
      {
        id: 'd1-ph-1',
        model: 'جوال يوماكس UMAX',
        salePrice: 5500,
        paidAmount: 5500,
        status: 'تم الدفع بالكامل'
      }
    ],
    maintenance: [
      { id: 'd1-maint-1', deviceOrService: 'واصل ستايل فور', price: 8000, type: 'شاشات', status: 'واصل' },
      { id: 'd1-maint-2', deviceOrService: 'برمجة', price: 1000, type: 'برمجة وفورمات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 22000,
      totalWithoutProfit: 20000,
      totalProfit: 2000,
      hadi: { salesWithProfit: 22000, salesWithoutProfit: 20000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [],
    musabHouse: [
      { id: 'd1-musab-1', amount: 2200, description: 'مسحوب لبيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [
      { id: 'd1-wrk-1', workerName: 'حمدان', amount: 2000, type: 'صرفة', description: 'صرفة حمدان العامل' },
      { id: 'd1-wrk-2', workerName: 'المهندس', amount: 2000, type: 'صرفة', description: 'صرفة المهندس' },
      { id: 'd1-wrk-3', workerName: 'المهندس', amount: 2250, type: 'حساب', description: 'حساب المهندس' }
    ],
    supplierTransfers: [
      { id: 'd1-supp-1', supplierName: 'محمد مياس', amountSent: 20000, purchasesReceivedValue: 0, notes: 'حولنا له رصيد' }
    ]
  },

  // ========================== يوم 2 ==========================
  {
    id: 'day-2',
    dayNumber: 2,
    date: '2026-08-02',
    dayTitle: 'تاريخ 2 شهر 8',
    accessories: [
      { id: 'd2-acc-1', name: '22 لمبة من حق المولد النبوي', price: 2000 },
      { id: 'd2-acc-2', name: 'غلاف', price: 1000 },
      { id: 'd2-acc-3', name: 'لاصق', price: 500 },
      { id: 'd2-acc-4', name: 'سماعة بلوتوث', price: 1000 },
      { id: 'd2-acc-5', name: 'لاصق', price: 500 },
      { id: 'd2-acc-6', name: 'غلاف', price: 1000 },
      { id: 'd2-acc-7', name: 'لاصق', price: 500 },
      { id: 'd2-acc-8', name: 'سماعة عادي', price: 500 },
      { id: 'd2-acc-9', name: 'تحويلة', price: 300 },
      { id: 'd2-acc-10', name: 'شاحن سيارة الملك', price: 1000 },
      { id: 'd2-acc-11', name: 'وصلة LT 4A', price: 1000 }
    ],
    phones: [],
    maintenance: [
      { id: 'd2-maint-1', deviceOrService: 'شاشة J3', price: 5000, type: 'شاشات', status: 'خالص' },
      { id: 'd2-maint-2', deviceOrService: 'برمجة', price: 500, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd2-maint-3', deviceOrService: 'بيت شاحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd2-maint-4', deviceOrService: 'شاشة A32', price: 6000, type: 'شاشات', status: 'خالص' },
      { id: 'd2-maint-5', deviceOrService: 'شاشة LG 210', price: 6000, type: 'شاشات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 22000,
      totalWithoutProfit: 20000,
      totalProfit: 2000,
      hadi: { salesWithProfit: 22000, salesWithoutProfit: 20000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [
      { id: 'd2-ret-1', title: 'جوال يوماكس مطور', amount: 5500, returnType: 'مرتجع زبون' }
    ],
    expenses: [],
    musabHouse: [
      { id: 'd2-musab-1', amount: 1800, description: 'مسحوب لبيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [
      { id: 'd2-musab-p1', amount: 7000, description: 'قيمة مرتجع شاشة ستايل 6 مسلمة لمصعب قبل القبال', type: 'مصعب شخصياً' }
    ],
    workers: [
      { id: 'd2-wrk-1', workerName: 'المهندس', amount: 3250, type: 'حساب', description: 'حساب المهندس' },
      { id: 'd2-wrk-2', workerName: 'حمدان', amount: 2000, type: 'صرفة', description: 'صرفة حمدان العامل' }
    ],
    supplierTransfers: [
      { id: 'd2-supp-1', supplierName: 'محمد مياس', amountSent: 20000, purchasesReceivedValue: 0, notes: 'حولنا له' }
    ],
    notes: 'مرتجع شاشة ستايل 6 بقيمة 7000 مسلمة قيمتها لمصعب قبل تاريخ القبال وسجلت على حسابه'
  },

  // ========================== يوم 3 ==========================
  {
    id: 'day-3',
    dayNumber: 3,
    date: '2026-08-03',
    dayTitle: 'يوم 3 شهر 8',
    accessories: [
      { id: 'd3-acc-1', name: 'لاصق', price: 400 },
      { id: 'd3-acc-2', name: 'سماعة', price: 300 },
      { id: 'd3-acc-3', name: 'غلاف', price: 1000 },
      { id: 'd3-acc-4', name: 'وصلة 7 أمبير', price: 1000 },
      { id: 'd3-acc-5', name: 'وصلة 11 أمبير', price: 1000 },
      { id: 'd3-acc-6', name: 'سماعة صفراء', price: 1000 }
    ],
    phones: [
      {
        id: 'd3-ph-1',
        model: 'جوال إل تي LT',
        salePrice: 39000,
        paidAmount: 39000,
        status: 'تم الدفع بالكامل',
        notes: 'واصل جوال إل تي'
      }
    ],
    maintenance: [
      { id: 'd3-maint-1', deviceOrService: 'بيت شحن', price: 2000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd3-maint-2', deviceOrService: 'آي سي شحن', price: 2000, type: 'آي سيات وتصليح', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 29500,
      totalWithoutProfit: 27000,
      totalProfit: 2500,
      hadi: { salesWithProfit: 29500, salesWithoutProfit: 27000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [
      { id: 'd3-ret-1', title: 'شاشة ستايل 6', amount: 8500, returnType: 'مرتجع لتاجر', notes: 'مرتجع شاشة ستايل 6' }
    ],
    expenses: [
      { id: 'd3-exp-3', category: 'مودم واشتراكات', amount: 2500, description: 'رصيد المودم' }
    ],
    musabHouse: [
      { id: 'd3-musab-1', amount: 1800, description: 'لبيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [
      { id: 'd3-wrk-1', workerName: 'حمدان', amount: 2000, type: 'صرفة', description: 'صرفة للعامل حمدان' },
      { id: 'd3-wrk-2', workerName: 'المهندس', amount: 2000, type: 'صرفة', description: 'صرفة للمهندس' }
    ],
    supplierTransfers: [
      { id: 'd3-supp-1', supplierName: 'خليل الأغبري', amountSent: 8500, purchasesReceivedValue: 0, transferMethod: 'نقد', notes: 'نقد لخليل مرسل مع صاحب السكريم' }
    ]
  },

  // ========================== يوم 4 ==========================
  {
    id: 'day-4',
    dayNumber: 4,
    date: '2026-08-04',
    dayTitle: 'بيانات يوم 4/8',
    accessories: [
      { id: 'd4-acc-1', name: 'غلاف', price: 800 },
      { id: 'd4-acc-2', name: 'لاصق', price: 500 },
      { id: 'd4-acc-3', name: 'شاحن عادي', price: 600 },
      { id: 'd4-acc-4', name: 'بطارية J7', price: 1500 },
      { id: 'd4-acc-5', name: 'تحويلة Type-C', price: 200 },
      { id: 'd4-acc-6', name: 'لمبة 4 وات', price: 400 },
      { id: 'd4-acc-7', name: 'تحويلة تايبسي', price: 200 }
    ],
    phones: [],
    maintenance: [
      { id: 'd4-maint-1', deviceOrService: 'واصل شاشة', price: 4000, type: 'شاشات', status: 'واصل' }
    ],
    recharge: {
      totalWithProfit: 15470,
      totalWithoutProfit: 14000,
      totalProfit: 1470,
      hadi: { salesWithProfit: 15470, salesWithoutProfit: 14000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [
      { id: 'd4-exp-3', category: 'مودم واشتراكات', amount: 200, description: 'رصيد لجوال المحل' }
    ],
    musabHouse: [
      { id: 'd4-musab-1', amount: 2300, description: 'لبيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [
      { id: 'd4-wrk-1', workerName: 'حمدان', amount: 1500, type: 'صرفة', description: 'للعامل حمدان' },
      { id: 'd4-wrk-2', workerName: 'عبد الغني', amount: 300, type: 'صرفة', description: 'لعبد الغني' }
    ],
    supplierTransfers: [
      { id: 'd4-supp-1', supplierName: 'محمد مياس', amountSent: 24500, purchasesReceivedValue: 0, notes: 'تحويل 18500 من قبل عبد الغني من زلط السحب + 6000 من المحل' }
    ],
    notes: 'سحب عبد الغني طلع صنعاء يدي بضاعة 50000 (تمت تصفيته ورد المتبقي 18500 في يوم 5)'
  },

  // ========================== يوم 5 ==========================
  {
    id: 'day-5',
    dayNumber: 5,
    date: '2026-08-05',
    dayTitle: 'بيانات يوم 5 شهر 8',
    accessories: [
      { id: 'd5-acc-1', name: 'سماعة بلوتوث رقبة', price: 2500 },
      { id: 'd5-acc-2', name: 'لاصق', price: 500 },
      { id: 'd5-acc-3', name: 'وصلة LT 11 أمبير', price: 1500 },
      { id: 'd5-acc-4', name: 'شاحن عادي', price: 700 },
      { id: 'd5-acc-5', name: 'وصلة LT 5 أمبير', price: 1000 },
      { id: 'd5-acc-6', name: 'وصلة LT 11 أمبير', price: 1500 },
      { id: 'd5-acc-7', name: 'سلك سايفر', price: 1000 }
    ],
    phones: [
      {
        id: 'd5-ph-1',
        model: 'جوال هواوي مكسور الشاشة',
        salePrice: 15000,
        paidAmount: 15000,
        status: 'تم الدفع بالكامل'
      }
    ],
    maintenance: [
      { id: 'd5-maint-1', deviceOrService: 'باقي شاشة ستايل فور', price: 6500, type: 'شاشات', status: 'خالص' },
      { id: 'd5-maint-2', deviceOrService: 'باقي شاشة A11', price: 3000, type: 'شاشات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 31000,
      totalWithoutProfit: 28500,
      totalProfit: 2500,
      hadi: { salesWithProfit: 31000, salesWithoutProfit: 28500, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [],
    musabHouse: [
      { id: 'd5-musab-1', amount: 2100, description: 'لبيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [
      { id: 'd5-musab-p1', amount: 2500, description: 'باقة مودم جلال على حساب مصعب', type: 'باقة مودم جلال' },
      { id: 'd5-musab-p2', amount: 1300, description: 'باقة مزايا مصعب', type: 'باقة مزايا' }
    ],
    workers: [
      { id: 'd5-wrk-1', workerName: 'حمدان', amount: 7500, type: 'صرفة', description: 'للعامل حمدان' },
      { id: 'd5-wrk-2', workerName: 'المهندس', amount: 2000, type: 'صرفة', description: 'للمهندس صرفة' },
      { id: 'd5-wrk-3', workerName: 'المهندس', amount: 2000, type: 'سحب', description: 'سحب المهندس' }
    ],
    supplierTransfers: [
      { id: 'd5-supp-1', supplierName: 'خليل الأغبري', amountSent: 27000, purchasesReceivedValue: 0, notes: 'تحويل لخليل' },
      { id: 'd5-supp-2', supplierName: 'محمد مياس', amountSent: 20000, purchasesReceivedValue: 0, notes: 'تحويل لمحمد مياس' }
    ],
    notes: 'مرتجع زلط من عبد الغني 18500 ر.ي تم توريدها لدرج المحل وتصفية عهدة صنعاء'
  },

  // ========================== يوم 6 ==========================
  {
    id: 'day-6',
    dayNumber: 6,
    date: '2026-08-06',
    dayTitle: 'بيانات يوم 6/8',
    accessories: [
      { id: 'd6-acc-1', name: 'سماعة', price: 500 },
      { id: 'd6-acc-2', name: 'سماعة رقبة عادي', price: 2500 },
      { id: 'd6-acc-3', name: 'سماعة بلوتوث', price: 1500 },
      { id: 'd6-acc-4', name: 'غلاف', price: 1000 },
      { id: 'd6-acc-5', name: 'وصلة كشاف', price: 300 },
      { id: 'd6-acc-6', name: 'طفاية شاحن سيارة', price: 700 }
    ],
    phones: [
      {
        id: 'd6-ph-1',
        model: 'جوال UMAX',
        salePrice: 5000,
        paidAmount: 5000,
        status: 'تم الدفع بالكامل'
      },
      {
        id: 'd6-ph-2',
        model: 'جوال A10e',
        salePrice: 20000,
        paidAmount: 20000,
        status: 'تم الدفع بالكامل'
      }
    ],
    maintenance: [
      { id: 'd6-maint-1', deviceOrService: 'شاشة A02', price: 6000, type: 'شاشات', status: 'خالص' },
      { id: 'd6-maint-2', deviceOrService: 'بيت شحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd6-maint-3', deviceOrService: 'تفعيل 4G', price: 1000, type: 'تفعيل 4G/Volte', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 26700,
      totalWithoutProfit: 24500,
      totalProfit: 2200,
      hadi: { salesWithProfit: 26700, salesWithoutProfit: 24500, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [],
    musabHouse: [],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd6-supp-1', supplierName: 'خليل الأغبري', amountSent: 27000, purchasesReceivedValue: 0, notes: 'محول لخليل' },
      { id: 'd6-supp-2', supplierName: 'محمد مياس', amountSent: 30000, purchasesReceivedValue: 0, notes: 'محول لمحمد مياس' }
    ]
  },

  // ========================== يوم 7 (مغلق) ==========================
  {
    id: 'day-7',
    dayNumber: 7,
    date: '2026-08-07',
    dayTitle: 'يوم 7 شهر 8 (مغلق)',
    isClosed: true,
    accessories: [],
    phones: [],
    maintenance: [],
    recharge: { totalWithProfit: 0, totalWithoutProfit: 0, totalProfit: 0 },
    returns: [],
    expenses: [],
    musabHouse: [],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [],
    notes: 'إجازة المحل الأسبوعية'
  },

  // ========================== يوم 8 ==========================
  {
    id: 'day-8',
    dayNumber: 8,
    date: '2026-08-08',
    dayTitle: '8 شهر 8',
    accessories: [
      { id: 'd8-acc-1', name: 'وصلة سوبر ليزر', price: 1500 },
      { id: 'd8-acc-2', name: 'وصلة سوبر ليزر', price: 1500 },
      { id: 'd8-acc-3', name: 'شاحن', price: 1000 },
      { id: 'd8-acc-4', name: 'لاصق', price: 600 },
      { id: 'd8-acc-5', name: 'شاحن', price: 1000 },
      { id: 'd8-acc-6', name: 'ذاكرة 128', price: 4700 },
      { id: 'd8-acc-7', name: 'وصلة عادي', price: 500 }
    ],
    phones: [
      {
        id: 'd8-ph-1',
        model: 'جوال J7 Pro',
        salePrice: 19000,
        paidAmount: 19000,
        status: 'تم الدفع بالكامل'
      },
      {
        id: 'd8-ph-2',
        model: 'جوال LT',
        salePrice: 55000,
        paidAmount: 55000,
        status: 'تم الدفع بالكامل'
      },
      {
        id: 'd8-ph-3',
        model: 'جوال A32',
        salePrice: 36000,
        paidAmount: 36000,
        status: 'تم الدفع بالكامل'
      }
    ],
    maintenance: [
      { id: 'd8-maint-1', deviceOrService: 'شاشة Honor 8C', price: 6000, type: 'شاشات', status: 'خالص' },
      { id: 'd8-maint-2', deviceOrService: 'برمجة', price: 1000, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd8-maint-3', deviceOrService: 'بيت شحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 9400,
      totalWithoutProfit: 8500,
      totalProfit: 900,
      hadi: { salesWithProfit: 9400, salesWithoutProfit: 8500, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [
      { id: 'd8-exp-2', category: 'مشاوير وتوصيل', amount: 500, description: 'للسيارة' }
    ],
    musabHouse: [
      { id: 'd8-musab-1', amount: 2700, description: 'بيت مصعب', type: 'بيت مصعب' },
      { id: 'd8-musab-2', amount: 1500, description: 'لبيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [
      { id: 'd8-musab-p1', amount: 1500, description: 'مصعب تم تسليمها له من قبل الزبون أبو صالح الأقمري (دين وصلة)', type: 'مصعب شخصياً' }
    ],
    workers: [
      { id: 'd8-wrk-1', workerName: 'المهندس', amount: 1750, type: 'حساب', description: 'للمهندس' }
    ],
    supplierTransfers: [
      { id: 'd8-supp-1', supplierName: 'عمر القاسمي', amountSent: 17250, purchasesReceivedValue: 0, notes: 'محول لعمر 7500 + 9750 = 17250' }
    ]
  },

  // ========================== يوم 9 ==========================
  {
    id: 'day-9',
    dayNumber: 9,
    date: '2026-08-09',
    dayTitle: 'يوم 9 شهر 8',
    accessories: [
      { id: 'd9-acc-1', name: 'سماعة', price: 500 },
      { id: 'd9-acc-2', name: 'لاصق', price: 500 },
      { id: 'd9-acc-3', name: 'لاصق ليزر', price: 1000 },
      { id: 'd9-acc-4', name: 'سماعة سوبر ليزر', price: 3500 },
      { id: 'd9-acc-5', name: 'وصلة سوبر ليزر', price: 1200 },
      { id: 'd9-acc-6', name: 'ذاكرة 32', price: 2500 },
      { id: 'd9-acc-7', name: 'سماعة بلوتوث علبة', price: 1800 },
      { id: 'd9-acc-8', name: 'ذاكرة 16', price: 2000 },
      { id: 'd9-acc-9', name: 'اشتراك سيفر', price: 1000 },
      { id: 'd9-acc-10', name: 'أم بي ثري قاطرة', price: 2000 },
      { id: 'd9-acc-11', name: 'شريحة', price: 700 },
      { id: 'd9-acc-12', name: 'شريحة', price: 700 },
      { id: 'd9-acc-13', name: 'بطارية LG 210', price: 2000 },
      { id: 'd9-acc-14', name: 'قيمة بطارية صاحب حورور LG 210 مع مصعب', price: 2000 }
    ],
    phones: [],
    maintenance: [
      { id: 'd9-maint-1', deviceOrService: 'واصل شاشة نوت 9', price: 16000, type: 'شاشات', status: 'واصل' },
      { id: 'd9-maint-2', deviceOrService: 'بيت شحن', price: 1200, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd9-maint-3', deviceOrService: 'برمجة', price: 1000, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd9-maint-4', deviceOrService: 'برمجة', price: 500, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd9-maint-5', deviceOrService: 'ثريجي 3G', price: 500, type: 'تفعيل 4G/Volte', status: 'خالص' },
      { id: 'd9-maint-6', deviceOrService: 'بيت شحن', price: 1500, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd9-maint-7', deviceOrService: 'شاشة A02', price: 6000, type: 'شاشات', status: 'خالص' },
      { id: 'd9-maint-8', deviceOrService: 'شاشة LG 210', price: 3500, type: 'شاشات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 27000,
      totalWithoutProfit: 24500,
      totalProfit: 2500,
      hadi: { salesWithProfit: 27000, salesWithoutProfit: 24500, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [
      { id: 'd9-exp-1', category: 'أدوات ومعدات', amount: 2500, description: 'قيمة شاشة LG 210 حق صاحب حورور' },
      { id: 'd9-exp-3', category: 'مشاوير وتوصيل', amount: 2000, description: 'مشاوير' }
    ],
    musabHouse: [
      { id: 'd9-musab-1', amount: 21000, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd9-supp-1', supplierName: 'المصنف', amountSent: 0, purchasesReceivedValue: 22800, notes: 'مشتريات 22800 من المصنف' },
      { id: 'd9-supp-2', supplierName: 'محمد مياس', amountSent: 30000, purchasesReceivedValue: 0, notes: 'محول له 30000' },
      { id: 'd9-supp-3', supplierName: 'خليل الأغبري', amountSent: 20000, purchasesReceivedValue: 0, notes: '15000 جوالي + 3000 نقد + 2000 جيب' }
    ],
    notes: '1000 محول عبر الكريمي من عبد الحكيم'
  },

  // ========================== يوم 10 ==========================
  {
    id: 'day-10',
    dayNumber: 10,
    date: '2026-08-10',
    dayTitle: 'تاريخ 10 شهر 8',
    accessories: [
      { id: 'd10-acc-1', name: 'لاصق', price: 500 },
      { id: 'd10-acc-2', name: 'لاصق', price: 400 },
      { id: 'd10-acc-3', name: 'سماعة رقبة', price: 3000 },
      { id: 'd10-acc-4', name: 'غلاف', price: 1000 },
      { id: 'd10-acc-5', name: 'شاحن الملك', price: 1200 },
      { id: 'd10-acc-6', name: 'ذاكرة 4 قيقا', price: 1300 },
      { id: 'd10-acc-7', name: 'خنجر', price: 500 },
      { id: 'd10-acc-8', name: 'وصلة كشاف', price: 300 }
    ],
    phones: [],
    maintenance: [
      { id: 'd10-maint-1', deviceOrService: 'شاشة كولباد', price: 8000, type: 'شاشات', status: 'خالص' },
      { id: 'd10-maint-2', deviceOrService: 'خريطة خازن', price: 1500, type: 'آي سيات وتصليح', status: 'خالص' },
      { id: 'd10-maint-3', deviceOrService: 'واتساب', price: 500, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd10-maint-4', deviceOrService: 'فورجي 4G', price: 1000, type: 'تفعيل 4G/Volte', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 19700,
      totalWithoutProfit: 18000,
      totalProfit: 1700,
      hadi: { salesWithProfit: 19700, salesWithoutProfit: 18000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [
      { id: 'd10-ret-1', title: 'جوال يوماكس', amount: 5000, returnType: 'مرتجع زبون' }
    ],
    expenses: [],
    musabHouse: [
      { id: 'd10-musab-1', amount: 1000, description: 'بيت مصعب', type: 'بيت مصعب' },
      { id: 'd10-musab-2', amount: 300, description: 'وصلة كشاف لبيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [
      { id: 'd10-wrk-1', workerName: 'المهندس', amount: 2250, type: 'حساب', description: 'حساب المهندس' }
    ],
    supplierTransfers: [
      { id: 'd10-supp-1', supplierName: 'خليل الأغبري', amountSent: 6500, purchasesReceivedValue: 0, notes: 'محول لخليل' }
    ]
  }
];
