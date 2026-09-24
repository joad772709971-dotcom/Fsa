import { DayRecord } from '../types';

export const daysData26to30: DayRecord[] = [
  // ========================== يوم 26 ==========================
  {
    id: 'day-26',
    dayNumber: 26,
    date: '2026-08-26',
    dayTitle: 'الملخص اليومي - 26 شهر 8',
    sims: [
      { id: 'd26-sim-1', simType: 'جديد', count: 5, unitPrice: 1000, totalPrice: 5000, notes: '5 شرائح جديد' },
      { id: 'd26-sim-2', simType: 'بدل فاقد', count: 1, unitPrice: 100, totalPrice: 100, notes: 'شريحة بدل فاقد' }
    ],
    accessories: [
      { id: 'd26-acc-1', name: 'لاصق', price: 500 },
      { id: 'd26-acc-2', name: 'غلاف هواوي', price: 1000 },
      { id: 'd26-acc-3', name: 'ذاكرة 32', price: 2200 },
      { id: 'd26-acc-4', name: 'ذاكرة 32', price: 2200 },
      { id: 'd26-acc-5', name: 'ذاكرة 64', price: 3500 },
      { id: 'd26-acc-6', name: 'شاحن ضد العكس للشاشات', price: 800 },
      { id: 'd26-acc-7', name: 'خيط', price: 200 },
      { id: 'd26-acc-8', name: 'غلاف', price: 1000 },
      { id: 'd26-acc-9', name: 'ريموت', price: 400 },
      { id: 'd26-acc-10', name: 'حجار', price: 100 },
      { id: 'd26-acc-11', name: 'غلاف', price: 1000 },
      { id: 'd26-acc-12', name: 'سماعة رقبة بلوتوث (شاشة الصقر)', price: 2700 }
    ],
    phones: [
      {
        id: 'd26-ph-1',
        model: 'جوال J7 مطور',
        salePrice: 21000,
        paidAmount: 21000,
        remainingAmount: 0,
        saleType: 'نقد',
        status: 'تم الدفع بالكامل'
      },
      {
        id: 'd26-ph-2',
        model: 'واصل من قيمة جوال إيتل (ضمن الفقيه)',
        salePrice: 5000,
        paidAmount: 5000,
        remainingAmount: 0,
        guarantor: 'ضمن الفقيه',
        saleType: 'دين',
        status: 'تم الدفع بالكامل',
        notes: 'واصل من قيمة جوال إيتل (ضمن الفقيه) - باقي عليه 22000'
      }
    ],
    maintenance: [
      { id: 'd26-maint-1', deviceOrService: 'إصلاح سماعة', price: 400, type: 'أخرى', status: 'خالص' },
      { id: 'd26-maint-2', deviceOrService: 'ثري جي', price: 500, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd26-maint-3', deviceOrService: 'تعريب', price: 500, type: 'برمجة وفورمات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 31281, // 13034 (القمة) + 18247 (الهادي)
      totalWithoutProfit: 29481, // 12434 + 17047
      totalProfit: 1800, // 600 + 1200
      qimmah: {
        salesWithProfit: 13034,
        salesWithoutProfit: 12434,
        transferredToApp: 10000,
        remainingInApp: 73,
        notes: 'إيداع 10,000 من فايز أبو علي نقد، فائدة 600، متبقي 73 ر.ي'
      },
      hadi: {
        salesWithProfit: 18247,
        salesWithoutProfit: 17047,
        transferredToApp: 20000,
        remainingInApp: 17941.9,
        notes: 'إيداع 20,000 من رصيد سابق + 20,000 دين جديد من محمد خالد مياس، فائدة 1200، متبقي 17941.90 ر.ي'
      }
    },
    returns: [
      {
        id: 'd26-ret-1',
        title: 'مرتجع جوال J7 مطور (أحمد الطويل - المرامي)',
        amount: 10000,
        returnType: 'مرتجع زبون',
        notes: 'تم رده قبل الجرد ويُراعى عزله'
      }
    ],
    expenses: [],
    musabHouse: [
      { id: 'd26-musab-1', amount: 1600, description: 'بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [
      {
        id: 'd26-supp-1',
        supplierName: 'فايز أبو علي',
        amountSent: 10000,
        purchasesReceivedValue: 10000,
        notes: 'قيمة الرصيد المحول تم دفع حسابها معه نقد 10,000'
      },
      {
        id: 'd26-supp-2',
        supplierName: 'محمد مياس',
        amountSent: 20000,
        purchasesReceivedValue: 20000,
        notes: 'الإجمالي 20,000 حساب الدين والسابق + تحويل 20,000 دين جديد رصيد'
      }
    ],
    notes: 'الملخص اليومي للمهندس أبو جواد المحفلي. تم استلام واصل 5,000 من حساب جوال آيتل (ضمانة الفقيه) ومرتجع 10,000 جوال J7 مطور لأحمد الطويل المرامي.'
  },

  // ========================== يوم 27 ==========================
  {
    id: 'day-27',
    dayNumber: 27,
    date: '2026-08-27',
    dayTitle: 'تاريخ 27 شهر 8',
    sims: [
      { id: 'd27-sim-1', simType: 'جديد', count: 1, unitPrice: 1000, totalPrice: 1000, notes: 'شريحة' },
      { id: 'd27-sim-2', simType: 'جديد', count: 1, unitPrice: 1000, totalPrice: 1000, notes: 'شريحة' }
    ],
    accessories: [
      { id: 'd27-acc-1', name: 'خيط', price: 200 },
      { id: 'd27-acc-2', name: 'لاصق', price: 500 },
      { id: 'd27-acc-3', name: 'سلك دش 15 متر', price: 1500 }
    ],
    phones: [],
    maintenance: [
      { id: 'd27-maint-0', deviceOrService: 'صيانة وتصليح', price: 1000, type: 'أخرى', status: 'خالص' },
      { id: 'd27-maint-1', deviceOrService: 'برمجة', price: 1000, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd27-maint-2', deviceOrService: 'حساب قوقل', price: 1000, type: 'برمجة وفورمات', status: 'خالص' },
      { id: 'd27-maint-3', deviceOrService: 'بيت شحن', price: 1000, type: 'بيوت شحن وفلاتات', status: 'خالص' },
      { id: 'd27-maint-4', deviceOrService: 'شاشة ريفل فور', price: 6000, type: 'شاشات', status: 'خالص' }
    ],
    recharge: {
      totalWithProfit: 19300, // 14500 (القمة) + 4800 (الهادي)
      totalWithoutProfit: 18000, // 13600 + 4400
      totalProfit: 1300, // 900 + 400
      qimmah: {
        salesWithProfit: 14500, // 13600 + 900
        salesWithoutProfit: 13600,
        transferredToApp: 14000,
        remainingInApp: 410,
        notes: 'شراء رصيد أبو علي فايز 14,000، مبيع بدون فائدة 13,600، الفائدة 900، الباقي رصيد 410'
      },
      hadi: {
        salesWithProfit: 4800, // 4400 + 400
        salesWithoutProfit: 4400,
        transferredToApp: 0,
        remainingInApp: 13541,
        notes: 'مبيع بدون فائدة 4,400، الفائدة 400، الباقي في البرنامج 13,541'
      }
    },
    returns: [],
    expenses: [
      { id: 'd27-exp-1', category: 'مشاوير وتوصيل', amount: 500, description: 'متر توصيل' }
    ],
    musabHouse: [
      { id: 'd27-musab-1', amount: 1200, description: 'خرج بيت مصعب (لحق)', type: 'بيت مصعب' },
      { id: 'd27-musab-2', amount: 200, description: 'خرج بيت مصعب (لحق)', type: 'بيت مصعب' },
      { id: 'd27-musab-3', amount: 600, description: 'خرج بيت مصعب (مغرب)', type: 'بيت مصعب' }
    ],
    musabPersonal: [
      { id: 'd27-musabp-1', amount: 2000, description: 'خرج مصعب للذي طرح له القات صاحب حورور', type: 'مصعب شخصياً' },
      { id: 'd27-musabp-2', amount: 200, description: 'نقد مكنة دارس بعد العصر', type: 'مصعب شخصياً' },
      { id: 'd27-musabp-3', amount: 100, description: 'واحد شليشان', type: 'مصعب شخصياً' }
    ],
    workers: [
      { id: 'd27-wrk-1', workerName: 'أخرى', amount: 2000, type: 'صرفة', description: 'صرفة المحل' }
    ],
    supplierTransfers: [
      {
        id: 'd27-supp-1',
        supplierName: 'خليل الأغبري',
        amountSent: 7500,
        purchasesReceivedValue: 0,
        notes: 'إرسال 7500 لخليل الأغبري وباقي له 1800'
      },
      {
        id: 'd27-supp-2',
        supplierName: 'فايز أبو علي',
        amountSent: 14000,
        purchasesReceivedValue: 14000,
        notes: 'شراء وتغذية رصيد القمة 14,000'
      }
    ],
    notes: 'تم سداد 7,500 لخليل الأغبري وباقي له 1,800. مشتريات رصيد من فايز أبو علي 14,000.'
  },

  // ========================== يوم 28 ==========================
  {
    id: 'day-28',
    dayNumber: 28,
    date: '2026-08-28',
    dayTitle: 'الملخص اليومي - 28 شهر 8',
    sims: [],
    accessories: [
      { id: 'd28-acc-1', name: 'وصلة ناطق', price: 300 },
      { id: 'd28-acc-2', name: 'سماعة الملك تايبسي', price: 1000 },
      { id: 'd28-acc-3', name: 'لاصق ليزر', price: 1500 }
    ],
    phones: [
      {
        id: 'd28-ph-1',
        model: 'واصل من قيمة جوال إيتل (ضمانة الفقيه)',
        salePrice: 5000,
        paidAmount: 5000,
        remainingAmount: 0,
        guarantor: 'ضمن الفقيه',
        saleType: 'نقد',
        status: 'تم الدفع بالكامل',
        notes: 'واصل 5,000 ر.ي من قيمة جوال إيتل باقي الدين الذي ضمنه الفقيه'
      },
      {
        id: 'd28-ph-2',
        model: 'جوال إكس كفر (Xcover)',
        salePrice: 25000,
        paidAmount: 25000,
        remainingAmount: 0,
        saleType: 'نقد',
        status: 'تم الدفع بالكامل',
        notes: 'مبيع جوال إكس كفر نقد واصل بالكامل 25,000 ر.ي'
      },
      {
        id: 'd28-ph-3',
        model: 'جوال سامسونج A71 (باقي دين)',
        salePrice: 8000,
        paidAmount: 0,
        remainingAmount: 8000,
        guarantor: 'بضمانة مصعب',
        saleType: 'دين',
        status: 'متبقي آجل',
        notes: 'باقي قيمة جوال A71 دين بضمانة مصعب (متبقي 8,000 ر.ي)'
      }
    ],
    maintenance: [],
    recharge: {
      totalWithProfit: 20599, // 20099 (الهادي) + 500 (القمة)
      totalWithoutProfit: 19169, // 18769 (الهادي) + 400 (القمة)
      totalProfit: 1430, // 1330 (الهادي) + 100 (القمة)
      qimmah: {
        salesWithProfit: 500, // 400 + 100
        salesWithoutProfit: 400,
        transferredToApp: 0,
        remainingInApp: 10,
        notes: 'بيع رصيد من تطبيق القمة 400 ريال دين، الفائدة 100، باقي في البرنامج 10 ريال'
      },
      hadi: {
        salesWithProfit: 20099, // 18769 + 1330
        salesWithoutProfit: 18769,
        transferredToApp: 27000,
        remainingInApp: 21772,
        notes: 'شراء رصيد 27,000 (20,000 محفظة جوالي + 7,000 محفظة الكريمي حولت من عبد الحكيم الريمي لمحمد مياس)، مبيع بدون فائدة 18,769، الفائدة 1,330، باقي في البرنامج 21,772'
      },
      generalNotes: 'تم تحويل 20,000 لمحمد مياس عبر محفظة جوالي و7,000 عبر محفظة الكريمي حولتها من عند عبد الحكيم الريمي لشراء رصيد 27,000'
    },
    returns: [],
    expenses: [
      { id: 'd28-exp-1', category: 'صرفة المحل', amount: 1500, description: 'صرفة المحل' }
    ],
    musabHouse: [
      { id: 'd28-musab-1', amount: 1600, description: 'خرج بيت مصعب', type: 'بيت مصعب' }
    ],
    musabPersonal: [
      { id: 'd28-musab-p1', amount: 100, description: 'قيمة 1 شليشان على حساب مصعب شخصياً', type: 'مصعب شخصياً' }
    ],
    workers: [],
    supplierTransfers: [
      {
        id: 'd28-supp-1',
        supplierName: 'محمد مياس',
        amountSent: 27000,
        purchasesReceivedValue: 27000,
        notes: 'شراء رصيد 27,000 (20,000 جوالي + 7,000 الكريمي من عند عبد الحكيم الريمي)'
      }
    ],
    notes: 'الملخص اليومي ليوم 28: واصل 5,000 من قيمة جوال إيتل (ضمان الفقيه)، بيع جوال إكس كفر 25,000 نقد، دين 8,000 باقي قيمة جوال A71 بضمانة مصعب، إكسسوارات 2,800، صرفة 1,500، بيت مصعب 1,600، قيد 100 ريال شليشان على مصعب شخصياً، شراء رصيد 27,000 من محمد مياس.'
  }
];
