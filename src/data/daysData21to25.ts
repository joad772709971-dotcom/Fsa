import { DayRecord } from '../types';

export const DAYS_21_TO_25: DayRecord[] = [
  // ========================== يوم 21 (مغلق) ==========================
  {
    id: 'day-21',
    dayNumber: 21,
    date: '2026-08-21',
    dayTitle: 'يوم 21 شهر 8 (مغلق)',
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
    notes: 'إجازة المحل الأسبوعية (مغلق)'
  },

  // ========================== يوم 22 ==========================
  {
    id: 'day-22',
    dayNumber: 22,
    date: '2026-08-22',
    dayTitle: 'يوم 22 شهر 8',
    accessories: [
      { id: 'd22-acc-1', name: 'شاحن', price: 900 },
      { id: 'd22-acc-2', name: 'باقي قيمة خازن راموس', price: 1000, notes: 'باقي قيمة خازن' }
    ],
    phones: [],
    maintenance: [
      { id: 'd22-maint-1', deviceOrService: 'باقي شاشة J7', price: 3000, type: 'شاشات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 7000,
      totalWithoutProfit: 6400,
      totalProfit: 600,
      hadi: { salesWithProfit: 7000, salesWithoutProfit: 6400, transferredToApp: 0, remainingInApp: 0 }
    },
    returns: [],
    expenses: [],
    musabHouse: [],
    musabPersonal: [],
    workers: [],
    supplierTransfers: []
  },

  // ========================== يوم 23 ==========================
  {
    id: 'day-23',
    dayNumber: 23,
    date: '2026-08-23',
    dayTitle: 'يوم 23 شهر 8',
    accessories: [
      { id: 'd23-acc-1', name: 'وصلة', price: 1000 },
      { id: 'd23-acc-2', name: 'لاصق', price: 500 },
      { id: 'd23-acc-3', name: 'توصيلة أوكس AUX', price: 500 },
      { id: 'd23-acc-4', name: 'سماعة', price: 750 },
      { id: 'd23-acc-5', name: 'لاصق ليزر', price: 1300 },
      { id: 'd23-acc-6', name: 'سماعة', price: 500 },
      { id: 'd23-acc-7', name: 'توصيلة أوكس AUX', price: 500 },
      { id: 'd23-acc-8', name: 'ذاكرة 16', price: 2000 },
      { id: 'd23-acc-9', name: 'ذاكرة 128', price: 5000 }
    ],
    phones: [],
    maintenance: [
      { id: 'd23-maint-1', deviceOrService: 'سماعة داخلية', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd23-maint-2', deviceOrService: 'واصل شاشة ريفل', price: 2000, type: 'شاشات', status: 'واصل' },
      { id: 'd23-maint-3', deviceOrService: 'فورجي 4G', price: 1000, type: 'تفعيل 4G/Volte', status: 'خالص' },
      { id: 'd23-maint-4', deviceOrService: 'فورمات وتعريب', price: 1000, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd23-maint-5', deviceOrService: 'شاشة J3', price: 5000, type: 'شاشات', status: 'خالص' },
      { id: 'd23-maint-6', deviceOrService: 'واصل فلاتة شحن A10e', price: 1000, type: 'بيوت شحن وفلاتات', status: 'واصل' },
      { id: 'd23-maint-7', deviceOrService: 'التغطية', price: 1000, type: 'آي سيات وتصليح', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 29100, // 19300 (أبو علي) + 9800 (مياس)
      totalWithoutProfit: 26500,
      totalProfit: 2600,
      qimmah: { salesWithProfit: 19300, salesWithoutProfit: 17500, transferredToApp: 25000, remainingInApp: 0 },
      hadi: { salesWithProfit: 9800, salesWithoutProfit: 9000, transferredToApp: 15000, remainingInApp: 0 }
    },
    returns: [],
    expenses: [],
    musabHouse: [
      { id: 'd23-musab-1', amount: 2500, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd23-supp-1', supplierName: 'فايز أبو علي', amountSent: 25000, purchasesReceivedValue: 0, notes: 'مشتراء رصيد تطبيق القمة' },
      { id: 'd23-supp-2', supplierName: 'محمد مياس', amountSent: 15000, purchasesReceivedValue: 0, notes: 'مشتراء رصيد تطبيق الهادي' }
    ]
  },

  // ========================== يوم 24 ==========================
  {
    id: 'day-24',
    dayNumber: 24,
    date: '2026-08-24',
    dayTitle: 'يوم 24 شهر 8',
    accessories: [
      { id: 'd24-acc-1', name: 'ذاكرة 16', price: 2000 },
      { id: 'd24-acc-2', name: 'وصلة LT 11A', price: 1500 },
      { id: 'd24-acc-3', name: 'لاصق', price: 500 },
      { id: 'd24-acc-4', name: 'سماعة عادي', price: 300 },
      { id: 'd24-acc-5', name: 'ريموت', price: 400 },
      { id: 'd24-acc-6', name: 'حجار', price: 100 },
      { id: 'd24-acc-7', name: 'هدية', price: 500 },
      { id: 'd24-acc-8', name: 'شريحة', price: 1000 }
    ],
    phones: [],
    maintenance: [
      { id: 'd24-maint-1', deviceOrService: 'فورجي 4G', price: 1200, type: 'تفعيل 4G/Volte', status: 'خالص' },
      { id: 'd24-maint-2', deviceOrService: 'فلاتة شحن A11', price: 2000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd24-maint-3', deviceOrService: 'باقي فلاتة شحن A10e', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd24-maint-4', deviceOrService: 'شاشة ستايل فور', price: 8000, type: 'شاشات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 16000, // 8500 (القمة) + 7500 (الهادي)
      totalWithoutProfit: 14980, // 8000 + 6980
      totalProfit: 1020,
      qimmah: {
        salesWithProfit: 8500,
        salesWithoutProfit: 8000,
        transferredToApp: 20000,
        remainingInApp: 11210,
        simPurchases: { count: 10, cost: 750, total: 7500 },
        notes: 'مشتريات 10 شرائح بـ 7500 تم خصمها عبر البرنامج'
      },
      hadi: {
        salesWithProfit: 7500,
        salesWithoutProfit: 6980,
        transferredToApp: 18000,
        remainingInApp: 4148,
        notes: 'محول من محمد مياس 18000 رصيد دين + تحويل 5000 سداد سابق'
      }
    },
    returns: [],
    expenses: [
      { id: 'd24-exp-2', category: 'مودم واشتراكات', amount: 1500, description: 'رصيد اتصال لرقمي' }
    ],
    musabHouse: [
      { id: 'd24-musab-1', amount: 2500, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd24-supp-1', supplierName: 'فايز أبو علي', amountSent: 20000, purchasesReceivedValue: 7500, notes: 'محول لأبو علي 20000 رصيد + شراء 10 شرائح بـ 7500 مخصومة من البرنامج' },
      { id: 'd24-supp-2', supplierName: 'محمد مياس', amountSent: 5000, purchasesReceivedValue: 18000, notes: 'محول لمحمد مياس 5000 باقي حق الرصيد السابق + محول من مياس 18000 رصيد دين' }
    ],
    notes: 'مصعب معاه 4 شلك مخلوط (2 جالها المهندس بالليل، وواحد معه بالليل، وواحد الصباح يوم المولد النبوي)'
  },

  // ========================== يوم 25 ==========================
  {
    id: 'day-25',
    dayNumber: 25,
    date: '2026-08-25',
    dayTitle: 'تاريخ 25 شهر 8',
    accessories: [
      { id: 'd25-acc-1', name: 'شاحن', price: 1500 },
      { id: 'd25-acc-2', name: 'قارع', price: 500 },
      { id: 'd25-acc-3', name: 'لاصق', price: 300 },
      { id: 'd25-acc-4', name: 'غلاف', price: 900 },
      { id: 'd25-acc-5', name: 'خيط', price: 200 },
      { id: 'd25-acc-6', name: 'غلاف', price: 1000 },
      { id: 'd25-acc-7', name: 'شريحة', price: 700 }
    ],
    phones: [
      {
        id: 'd25-ph-1',
        model: 'جوال آيتل Itel A90',
        salePrice: 48000,
        paidAmount: 21000,
        remainingAmount: 27000,
        guarantor: 'الفقيه',
        saleType: 'دين',
        status: 'متبقي آجل',
        notes: 'واصل من قيمته 21000 والباقي عليه 27000 بضمانة الفقيه'
      }
    ],
    maintenance: [
      { id: 'd25-maint-1', deviceOrService: 'شاشة ردمي 9X', price: 7000, type: 'شاشات', status: 'خالص' },
      { id: 'd25-maint-2', deviceOrService: 'شاشة J320', price: 5000, type: 'شاشات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 17200, // 7900 (الهادي) + 9300 (القمة)
      totalWithoutProfit: 16319, // 7616 + 8703
      totalProfit: 881,
      hadi: {
        salesWithProfit: 7900,
        salesWithoutProfit: 7616,
        transferredToApp: 0,
        remainingInApp: 14988,
        notes: 'مبيع رصيد برنامج الهادي، الباقي في البرنامج 14988'
      },
      qimmah: {
        salesWithProfit: 9300,
        salesWithoutProfit: 8703,
        transferredToApp: 0,
        remainingInApp: 2500,
        notes: 'مبيع رصيد برنامج القمة، الباقي في البرنامج 2500'
      }
    },
    returns: [],
    expenses: [],
    musabHouse: [
      { id: 'd25-musab-1', amount: 1600, description: 'بيت مصعب سحب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      { id: 'd25-supp-1', supplierName: 'خليل الأغبري', amountSent: 2900, purchasesReceivedValue: 8500, notes: 'إرسال 2900 باقي حساب الفاتورة السابقة + مشتريات دين: شاشة ردمي 4500، فلاتة A11 بـ 1000، شاشة J320 بـ 3000' }
    ]
  }
];
