import { DayRecord } from '../types';

export const DAYS_11_TO_20: DayRecord[] = [
  // ========================== يوم 11 ==========================
  {
    id: 'day-11',
    dayNumber: 11,
    date: '2026-08-11',
    dayTitle: '11 شهر 8',
    accessories: [
      { id: 'd11-acc-1', name: 'أمبيثري صغير MP3', price: 1500 },
      { id: 'd11-acc-2', name: 'قارع', price: 300 },
      { id: 'd11-acc-3', name: 'خازن قوة 20 ألف', price: 7000 },
      { id: 'd11-acc-4', name: 'ريموت', price: 400 },
      { id: 'd11-acc-5', name: 'حجار', price: 100 },
      { id: 'd11-acc-6', name: 'سماعة LT', price: 1300 }
    ],
    phones: [
      {
        id: 'd11-ph-1',
        model: 'جوال A11',
        salePrice: 26500,
        paidAmount: 26500,
        status: 'تم الدفع بالكامل'
      }
    ],
    maintenance: [
      { id: 'd11-maint-1', deviceOrService: 'برمجة', price: 1000, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd11-maint-2', deviceOrService: 'حساب قوقل', price: 800, type: 'حسابات وتخطي', status: 'خالص' },
      { id: 'd11-maint-3', deviceOrService: 'بيت شحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd11-maint-4', deviceOrService: 'فلاتة شحن ستايل فور', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 11000,
      totalWithoutProfit: 10000,
      totalProfit: 1000,
      hadi: { salesWithProfit: 11000, salesWithoutProfit: 10000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [
      { id: 'd11-exp-1', category: 'مودم واشتراكات', amount: 8000, description: 'رصيد للمودم حق المحل' },
      { id: 'd11-exp-3', category: 'أدوات ومعدات', amount: 1000, description: 'فلاتة شحن' }
    ],
    musabHouse: [
      { id: 'd11-musab-1', amount: 1600, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd11-supp-1', supplierName: 'محمد مياس', amountSent: 40000, purchasesReceivedValue: 0, notes: 'محول لمحمد مياس' }
    ],
    notes: 'مع بيت مصعب ستايل فور جديد'
  },

  // ========================== يوم 12 ==========================
  {
    id: 'day-12',
    dayNumber: 12,
    date: '2026-08-12',
    dayTitle: '12 شهر 8',
    accessories: [
      { id: 'd12-acc-1', name: 'أمبيثري MP3', price: 1500 },
      { id: 'd12-acc-2', name: 'شاحن', price: 1500 },
      { id: 'd12-acc-3', name: 'لاصق', price: 500 },
      { id: 'd12-acc-4', name: 'بطارية J3', price: 2500 },
      { id: 'd12-acc-5', name: 'وصلة LT', price: 1200 },
      { id: 'd12-acc-6', name: 'غلاف', price: 1000 },
      { id: 'd12-acc-7', name: 'خيط', price: 250 },
      { id: 'd12-acc-8', name: 'خيط', price: 250 },
      { id: 'd12-acc-9', name: 'قاعدة شحن', price: 1000 }
    ],
    phones: [
      {
        id: 'd12-ph-1',
        model: 'واصل جوال آيتل Itel',
        salePrice: 1000,
        paidAmount: 1000,
        status: 'تم الدفع بالكامل',
        notes: 'واصل من قيمة جوال آيتل'
      }
    ],
    maintenance: [
      { id: 'd12-maint-1', deviceOrService: 'تطبيقات', price: 500, type: 'برمجة وفورمات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 12000,
      totalWithoutProfit: 11000,
      totalProfit: 1000,
      hadi: { salesWithProfit: 12000, salesWithoutProfit: 11000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [],
    musabHouse: [
      { id: 'd12-musab-1', amount: 2200, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: []
  },

  // ========================== يوم 13 ==========================
  {
    id: 'day-13',
    dayNumber: 13,
    date: '2026-08-13',
    dayTitle: '13 شهر 8',
    accessories: [
      { id: 'd13-acc-1', name: 'شاحن', price: 1000 },
      { id: 'd13-acc-2', name: 'وصلة', price: 500 },
      { id: 'd13-acc-3', name: 'سماعة', price: 500 },
      { id: 'd13-acc-4', name: 'خيط', price: 200 },
      { id: 'd13-acc-5', name: 'لاصق', price: 500 },
      { id: 'd13-acc-6', name: 'لاصق', price: 500 },
      { id: 'd13-acc-7', name: 'غلاف', price: 1000 },
      { id: 'd13-acc-8', name: 'ذاكرة 16', price: 1800 },
      { id: 'd13-acc-9', name: 'ريموت', price: 400 },
      { id: 'd13-acc-10', name: 'حجار', price: 100 }
    ],
    phones: [
      {
        id: 'd13-ph-1',
        model: 'جوال J3 مطور',
        salePrice: 15000,
        paidAmount: 15000,
        status: 'تم الدفع بالكامل'
      }
    ],
    maintenance: [
      { id: 'd13-maint-1', deviceOrService: 'شاشة موترلا 2043', price: 6500, type: 'شاشات', status: 'خالص' },
      { id: 'd13-maint-2', deviceOrService: 'بيت شحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd13-maint-3', deviceOrService: 'واصل شاشة LG 676', price: 3500, type: 'شاشات', status: 'واصل' },
      { id: 'd13-maint-4', deviceOrService: 'برمجة', price: 500, type: 'برمجة وفورمات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 14150,
      totalWithoutProfit: 13000,
      totalProfit: 1150,
      hadi: { salesWithProfit: 14150, salesWithoutProfit: 13000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [
      { id: 'd13-ret-1', title: 'واصل جوال آيتل Itel', amount: 10000, returnType: 'مرتجع زبون' }
    ],
    expenses: [],
    musabHouse: [
      { id: 'd13-musab-1', amount: 2200, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [
      { id: 'd13-wrk-1', workerName: 'المهندس', amount: 1750, type: 'حساب', description: 'المهندس' }
    ],
    supplierTransfers: [
      { id: 'd13-supp-1', supplierName: 'محمد مياس', amountSent: 20000, purchasesReceivedValue: 0, notes: 'حولت له 20000' }
    ]
  },

  // ========================== يوم 14 ==========================
  {
    id: 'day-14',
    dayNumber: 14,
    date: '2026-08-14',
    dayTitle: '14 شهر 8',
    accessories: [
      { id: 'd14-acc-1', name: 'بطارية 676', price: 1500 },
      { id: 'd14-acc-2', name: 'سماعة عادي', price: 500 },
      { id: 'd14-acc-3', name: 'شاحن سيارة', price: 1000 }
    ],
    phones: [],
    maintenance: [
      { id: 'd14-maint-1', deviceOrService: 'باقي شاشة LG 676', price: 2000, type: 'شاشات', status: 'خالص' },
      { id: 'd14-maint-2', deviceOrService: 'بيت شحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 7100,
      totalWithoutProfit: 6500,
      totalProfit: 600,
      hadi: { salesWithProfit: 7100, salesWithoutProfit: 6500, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [
      { id: 'd14-exp-1', category: 'صرفة المحل', amount: 500, description: 'عشاء' }
    ],
    musabHouse: [],
    musabPersonal: [],
    workers: [
      { id: 'd14-wrk-1', workerName: 'المهندس', amount: 1500, type: 'حساب', description: 'المهندس' }
    ],
    supplierTransfers: []
  },

  // ========================== يوم 15 ==========================
  {
    id: 'day-15',
    dayNumber: 15,
    date: '2026-08-15',
    dayTitle: '15 شهر 8',
    accessories: [
      { id: 'd15-acc-1', name: 'خازن قوة 10 آلاف', price: 6000 },
      { id: 'd15-acc-2', name: 'لاصق', price: 200 },
      { id: 'd15-acc-3', name: 'ذاكرة 32', price: 2500 },
      { id: 'd15-acc-4', name: 'سماعة', price: 350 },
      { id: 'd15-acc-5', name: 'غلاف', price: 1000 },
      { id: 'd15-acc-6', name: 'خازن قوة 20 ألف', price: 8000 }
    ],
    phones: [
      {
        id: 'd15-ph-1',
        model: 'جوال LT M20',
        salePrice: 50000,
        paidAmount: 50000,
        status: 'تم الدفع بالكامل'
      },
      {
        id: 'd15-ph-2',
        model: 'جوال LT طويل',
        salePrice: 58000,
        paidAmount: 58000,
        status: 'تم الدفع بالكامل'
      }
    ],
    maintenance: [
      { id: 'd15-maint-1', deviceOrService: 'حساب قوقل', price: 1000, type: 'حسابات وتخطي', status: 'خالص' },
      { id: 'd15-maint-2', deviceOrService: 'شاشة J7', price: 6300, type: 'شاشات', status: 'خالص' },
      { id: 'd15-maint-3', deviceOrService: 'برمجة', price: 500, type: 'برمجة وفورمات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 21000,
      totalWithoutProfit: 19000,
      totalProfit: 2000,
      hadi: { salesWithProfit: 21000, salesWithoutProfit: 19000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [
      { id: 'd15-ret-1', title: 'جوال A32', amount: 36000, returnType: 'مرتجع زبون' }
    ],
    expenses: [
      { id: 'd15-exp-1', category: 'مشاوير وتوصيل', amount: 1500, description: 'صاحب المتر اللي أدى الجوالات' }
    ],
    musabHouse: [
      { id: 'd15-musab-1', amount: 2500, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [
      { id: 'd15-musab-p1', amount: 1300, description: 'باقة مزايا مصعب', type: 'باقة مزايا' }
    ],
    workers: [],
    supplierTransfers: [
      { id: 'd15-supp-1', supplierName: 'محمد مياس', amountSent: 3000, purchasesReceivedValue: 0, notes: 'محول لمياس' }
    ]
  },

  // ========================== يوم 16 ==========================
  {
    id: 'day-16',
    dayNumber: 16,
    date: '2026-08-16',
    dayTitle: '16 شهر 8',
    accessories: [
      { id: 'd16-acc-1', name: 'غلاف', price: 1000 },
      { id: 'd16-acc-2', name: 'لاصق', price: 500 },
      { id: 'd16-acc-3', name: 'لاصق', price: 500 },
      { id: 'd16-acc-4', name: 'ريموت', price: 400 },
      { id: 'd16-acc-5', name: 'حجار', price: 100 },
      { id: 'd16-acc-6', name: 'وصلة', price: 1000 },
      { id: 'd16-acc-7', name: 'تحويلة', price: 200 },
      { id: 'd16-acc-8', name: 'وصلة كشاف', price: 300 },
      { id: 'd16-acc-9', name: 'وصلة مضخة', price: 300 },
      { id: 'd16-acc-10', name: 'وصلة كشاف', price: 300 },
      { id: 'd16-acc-11', name: 'حجار ريموت', price: 100 },
      { id: 'd16-acc-12', name: 'لاصق ليزر', price: 1000 }
    ],
    phones: [
      {
        id: 'd16-ph-1',
        model: 'جوال LG K51',
        salePrice: 27000,
        paidAmount: 27000,
        status: 'تم الدفع بالكامل'
      }
    ],
    maintenance: [
      { id: 'd16-maint-1', deviceOrService: 'بيت شحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd16-maint-2', deviceOrService: 'شاشة ستايل فور', price: 8000, type: 'شاشات', status: 'خالص' },
      { id: 'd16-maint-3', deviceOrService: 'برمجة', price: 1000, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd16-maint-4', deviceOrService: 'ثريجي 3G', price: 1000, type: 'تفعيل 4G/Volte', status: 'خالص' },
      { id: 'd16-maint-5', deviceOrService: 'خريطة خازن قوة 20 ألف', price: 3500, type: 'آي سيات وتصليح', status: 'خالص' },
      { id: 'd16-maint-6', deviceOrService: 'واصل شاشة ستايل فور', price: 2000, type: 'شاشات', status: 'واصل' }
    ],
    recharge: {
      totalWithProfit: 18700,
      totalWithoutProfit: 17000,
      totalProfit: 1700,
      hadi: { salesWithProfit: 18700, salesWithoutProfit: 17000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [
      { id: 'd16-ret-1', title: 'جوال J3 مطور', amount: 15000, returnType: 'مرتجع زبون' }
    ],
    expenses: [],
    musabHouse: [
      { id: 'd16-musab-1', amount: 1700, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [
      { id: 'd16-wrk-1', workerName: 'المهندس', amount: 3500, type: 'حساب', description: 'المهندس' }
    ],
    supplierTransfers: [
      { id: 'd16-supp-1', supplierName: 'محمد مياس', amountSent: 2000, purchasesReceivedValue: 0, notes: 'محمد مياس' },
      { id: 'd16-supp-2', supplierName: 'عمر القاسمي', amountSent: 16000, purchasesReceivedValue: 0, notes: 'نحول لعمر 15500 + 500 كراء المتر' }
    ]
  },

  // ========================== يوم 17 ==========================
  {
    id: 'day-17',
    dayNumber: 17,
    date: '2026-08-17',
    dayTitle: '17 شهر 8',
    accessories: [
      { id: 'd17-acc-1', name: 'غلاف عادي', price: 500 },
      { id: 'd17-acc-2', name: 'لاصق', price: 500 },
      { id: 'd17-acc-3', name: 'مسكة', price: 500 },
      { id: 'd17-acc-4', name: 'شاحن', price: 1000 },
      { id: 'd17-acc-5', name: 'توصيلة', price: 1000 }
    ],
    phones: [],
    maintenance: [
      { id: 'd17-maint-1', deviceOrService: 'شاشة A12', price: 6000, type: 'شاشات', status: 'خالص' },
      { id: 'd17-maint-2', deviceOrService: 'تفعيل 4G فورجي', price: 1000, type: 'تفعيل 4G/Volte', status: 'خالص' },
      { id: 'd17-maint-3', deviceOrService: 'تخطي حساب', price: 1000, type: 'حسابات وتخطي', status: 'خالص' },
      { id: 'd17-maint-4', deviceOrService: 'بيت شحن', price: 1500, type: 'بيوت شحن وفلاتات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 9700,
      totalWithoutProfit: 8800,
      totalProfit: 900,
      hadi: { salesWithProfit: 9700, salesWithoutProfit: 8800, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [
      { id: 'd17-exp-2', category: 'أدوات ومعدات', amount: 16000, description: 'أداة تفعيل الفورجي تفعيل اشتراك' }
    ],
    musabHouse: [
      { id: 'd17-musab-1', amount: 2600, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [
      { id: 'd17-wrk-1', workerName: 'المهندس', amount: 2250, type: 'حساب', description: 'المهندس' }
    ],
    supplierTransfers: [
      { id: 'd17-supp-1', supplierName: 'محمد مياس', amountSent: 10000, purchasesReceivedValue: 0, notes: 'مياس 10000' },
      { id: 'd17-supp-2', supplierName: 'عمر القاسمي', amountSent: 6500, purchasesReceivedValue: 0, notes: 'عمر القاسمي 6500' }
    ]
  },

  // ========================== يوم 18 ==========================
  {
    id: 'day-18',
    dayNumber: 18,
    date: '2026-08-18',
    dayTitle: '18 شهر 8',
    accessories: [
      { id: 'd18-acc-1', name: 'كشاف', price: 3000 },
      { id: 'd18-acc-2', name: 'وصلة', price: 1000 },
      { id: 'd18-acc-3', name: 'كشاف', price: 2500 },
      { id: 'd18-acc-4', name: 'ذاكرة 8 قيقا', price: 1400 },
      { id: 'd18-acc-5', name: 'سماعة رقبة', price: 3200 },
      { id: 'd18-acc-6', name: 'وصلة سوبر ليزر', price: 1500 },
      { id: 'd18-acc-7', name: 'تحويلة', price: 200 },
      { id: 'd18-acc-8', name: 'خيط', price: 250 },
      { id: 'd18-acc-9', name: 'شاحن عادي', price: 650 },
      { id: 'd18-acc-10', name: 'ماكينة حلاقة', price: 3500 }
    ],
    phones: [],
    maintenance: [
      { id: 'd18-maint-1', deviceOrService: 'شاشة LG K51', price: 6000, type: 'شاشات', status: 'خالص' },
      { id: 'd18-maint-2', deviceOrService: 'فلاتة شحن A20', price: 2000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd18-maint-3', deviceOrService: 'باقي شاشة ستايل فور', price: 6000, type: 'شاشات', status: 'خالص' },
      { id: 'd18-maint-4', deviceOrService: 'تفعيل فورجي', price: 1000, type: 'تفعيل 4G/Volte', status: 'خالص' },
      { id: 'd18-maint-5', deviceOrService: 'تفعيل فولت VoLTE', price: 1000, type: 'تفعيل 4G/Volte', status: 'خالص' },
      { id: 'd18-maint-6', deviceOrService: 'واصل شاشة J7', price: 3000, type: 'شاشات', status: 'واصل' }
    ],
    recharge: {
      totalWithProfit: 21000,
      totalWithoutProfit: 19000,
      totalProfit: 2000,
      hadi: { salesWithProfit: 21000, salesWithoutProfit: 19000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [
      { id: 'd18-exp-2', category: 'مشاوير وتوصيل', amount: 1500, description: 'المتر' }
    ],
    musabHouse: [
      { id: 'd18-musab-1', amount: 2050, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd18-supp-1', supplierName: 'عمر القاسمي', amountSent: 7800, purchasesReceivedValue: 0, notes: 'محول لعمر 7800' },
      { id: 'd18-supp-2', supplierName: 'العبصري', amountSent: 4000, purchasesReceivedValue: 0, notes: 'العبصري 4000' },
      { id: 'd18-supp-3', supplierName: 'محمد مياس', amountSent: 22000, purchasesReceivedValue: 0, notes: 'محمد مياس 22000' }
    ]
  },

  // ========================== يوم 19 ==========================
  {
    id: 'day-19',
    dayNumber: 19,
    date: '2026-08-19',
    dayTitle: '19 شهر 8',
    accessories: [
      { id: 'd19-acc-1', name: 'غلاف', price: 1000 },
      { id: 'd19-acc-2', name: 'قاعدة شحن', price: 750 },
      { id: 'd19-acc-3', name: 'وصلة كشاف', price: 250 },
      { id: 'd19-acc-4', name: 'سيفر HD اتش دي', price: 5500 },
      { id: 'd19-acc-5', name: 'كشاف دبل', price: 3000 },
      { id: 'd19-acc-6', name: 'شاحن الملك', price: 1000 },
      { id: 'd19-acc-7', name: 'راديو عالمي', price: 2800 },
      { id: 'd19-acc-8', name: 'سماعة رقبة', price: 3000 },
      { id: 'd19-acc-9', name: 'كشاف', price: 2500 },
      { id: 'd19-acc-10', name: 'سيفر عادي', price: 3000 },
      { id: 'd19-acc-11', name: 'سماعة', price: 500 },
      { id: 'd19-acc-12', name: 'لاصق', price: 599 },
      { id: 'd19-acc-13', name: 'خازن قوة 20 ألف', price: 8000 }
    ],
    phones: [],
    maintenance: [
      { id: 'd19-maint-1', deviceOrService: 'شاشة A13', price: 6500, type: 'شاشات', status: 'خالص' },
      { id: 'd19-maint-2', deviceOrService: 'شاشة موترلا 2043', price: 7000, type: 'شاشات', status: 'خالص' },
      { id: 'd19-maint-3', deviceOrService: 'فلاتة شحن ستايل فور', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd19-maint-4', deviceOrService: 'تفعيل فورجي 4G', price: 10000, type: 'تفعيل 4G/Volte', status: 'خالص' },
      { id: 'd19-maint-5', deviceOrService: 'تخطي وتعريب', price: 1599, type: 'حسابات وتخطي', status: 'خالص' },
      { id: 'd19-maint-6', deviceOrService: 'بيت شاحن', price: 100, type: 'بيوت شحن وفلاتات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 17500,
      totalWithoutProfit: 16000,
      totalProfit: 1500,
      hadi: { salesWithProfit: 17500, salesWithoutProfit: 16000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [],
    musabHouse: [
      { id: 'd19-musab-1', amount: 2200, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd19-supp-1', supplierName: 'عمر القاسمي', amountSent: 19050, purchasesReceivedValue: 0, notes: 'محول لعمر القاسمي 19050 + 6000 مرتجع له شاشة هواوي وعظمة J7' },
      { id: 'd19-supp-2', supplierName: 'محمد مياس', amountSent: 20000, purchasesReceivedValue: 0, notes: 'مياس محول له 20000' }
    ]
  },

  // ========================== يوم 20 ==========================
  {
    id: 'day-20',
    dayNumber: 20,
    date: '2026-08-20',
    dayTitle: '20 شهر 8',
    accessories: [
      { id: 'd20-acc-1', name: 'وصلة', price: 1000 },
      { id: 'd20-acc-2', name: 'لمبة', price: 600 },
      { id: 'd20-acc-3', name: 'أمبيثري MP3', price: 4000 },
      { id: 'd20-acc-4', name: 'لاصق', price: 500 },
      { id: 'd20-acc-5', name: 'غلاف', price: 1000 },
      { id: 'd20-acc-6', name: 'غلاف', price: 1000 },
      { id: 'd20-acc-7', name: 'لاصق', price: 500 }
    ],
    phones: [],
    maintenance: [
      { id: 'd20-maint-1', deviceOrService: 'بيت شحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd20-maint-2', deviceOrService: 'برمجة', price: 1000, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd20-maint-3', deviceOrService: 'آيسي شبكة', price: 2000, type: 'آي سيات وتصليح', status: 'خالص' },
      { id: 'd20-maint-4', deviceOrService: 'ضغط معالج', price: 1500, type: 'آي سيات وتصليح', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 26200,
      totalWithoutProfit: 24000,
      totalProfit: 2200,
      hadi: { salesWithProfit: 26200, salesWithoutProfit: 24000, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [],
    musabHouse: [
      { id: 'd20-musab-1', amount: 2200, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd20-supp-1', supplierName: 'عمر القاسمي', amountSent: 2000, purchasesReceivedValue: 0, notes: 'عمر القاسمي 2000' },
      { id: 'd20-supp-2', supplierName: 'محمد مياس', amountSent: 20000, purchasesReceivedValue: 0, notes: 'مياس 20000' }
    ]
  }
];
