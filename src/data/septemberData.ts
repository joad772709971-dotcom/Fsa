import { Transaction } from '../types';

export const SEPTEMBER_TRANSACTIONS: Transaction[] = [
  // مبيعات إكسسوارات يوم 1 شهر 9
  {
    id: "tx_20260901_acc_1",
    date: "2026-09-01",
    time: "10:15",
    type: "sale",
    category: "accessories",
    description: "طفاية سيارة",
    price: 700,
    cost: 500,
    profit: 200,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_2",
    date: "2026-09-01",
    time: "10:30",
    type: "sale",
    category: "accessories",
    description: "لاصق حماية",
    price: 500,
    cost: 100,
    profit: 400,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_3",
    date: "2026-09-01",
    time: "11:00",
    type: "sale",
    category: "accessories",
    description: "وصلة LT 3A",
    price: 750,
    cost: 400,
    profit: 350,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_4",
    date: "2026-09-01",
    time: "11:30",
    type: "sale",
    category: "accessories",
    description: "سماعة LT",
    price: 1500,
    cost: 1100,
    profit: 400,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_5",
    date: "2026-09-01",
    time: "12:00",
    type: "sale",
    category: "accessories",
    description: "ريسيفر ستار إكس",
    price: 3200,
    cost: 2800,
    profit: 400,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_6",
    date: "2026-09-01",
    time: "12:30",
    type: "sale",
    category: "accessories",
    description: "أمبيثري 811",
    price: 2500,
    cost: 2000,
    profit: 500,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_7",
    date: "2026-09-01",
    time: "13:00",
    type: "sale",
    category: "accessories",
    description: "شاحن الملك K4",
    price: 1000,
    cost: 850,
    profit: 150,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_8",
    date: "2026-09-01",
    time: "13:30",
    type: "sale",
    category: "accessories",
    description: "وصلة سوبر ليزر",
    price: 1200,
    cost: 900,
    profit: 300,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_9",
    date: "2026-09-01",
    time: "14:00",
    type: "sale",
    category: "accessories",
    description: "كشاف 6622",
    price: 2500,
    cost: 2250,
    profit: 250,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_acc_10",
    date: "2026-09-01",
    time: "14:30",
    type: "sale",
    category: "accessories",
    description: "سماعة ملون",
    price: 500,
    cost: 200,
    profit: 300,
    paymentMethod: "cash"
  },

  // عمليات صيانة يوم 1 شهر 9
  {
    id: "tx_20260901_maint_1",
    date: "2026-09-01",
    time: "15:00",
    type: "maintenance",
    category: "maintenance",
    description: "تفعيل فورجي 4G",
    price: 1000,
    cost: 0,
    profit: 1000,
    paymentMethod: "cash",
    notes: "برمجة وتفعيل"
  },
  {
    id: "tx_20260901_maint_2",
    date: "2026-09-01",
    time: "15:30",
    type: "maintenance",
    category: "maintenance",
    description: "تعريب جهاز",
    price: 500,
    cost: 0,
    profit: 500,
    paymentMethod: "cash",
    notes: "برمجة وتعريب"
  },
  {
    id: "tx_20260901_maint_3",
    date: "2026-09-01",
    time: "16:00",
    type: "maintenance",
    category: "maintenance",
    description: "مفتاح تشغيل باور",
    price: 1000,
    cost: 0,
    profit: 1000,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_maint_4",
    date: "2026-09-01",
    time: "16:30",
    type: "maintenance",
    category: "maintenance",
    description: "تركيب بيت شحن",
    price: 1500,
    cost: 50,
    profit: 1450,
    paymentMethod: "cash"
  },
  {
    id: "tx_20260901_maint_5",
    date: "2026-09-01",
    time: "17:00",
    type: "maintenance",
    category: "maintenance",
    description: "شاشة A02",
    price: 6000,
    cost: 4000,
    profit: 2000,
    paymentMethod: "cash",
    notes: "تغيير شاشة سامسونج A02"
  },
  {
    id: "tx_20260901_maint_6",
    date: "2026-09-01",
    time: "17:15",
    type: "maintenance",
    category: "maintenance",
    description: "شاشة J7",
    price: 6500,
    cost: 4500,
    profit: 2000,
    paymentMethod: "cash",
    notes: "تغيير شاشة J7"
  },

  // مبيعات رصيد الهادي
  {
    id: "tx_20260901_rec_hadi",
    date: "2026-09-01",
    time: "17:20",
    type: "balance_hadi",
    category: "balance",
    description: "مبيعات رصيد تطبيق الهادي",
    price: 18300,
    cost: 16600,
    profit: 1700,
    paymentMethod: "cash"
  },

  // المشتريات والمصاريف الحالية
  {
    "id": "tx_20260901_pay_omar",
    "date": "2026-09-01",
    "time": "17:30",
    "type": "purchase",
    "category": "purchases",
    "description": "خرج ومشتريات قطع الصيانة محولة لعمر القاسمي (شاشة J7 بـ 4500 + 3 أسنان بطارية J7 بـ 500)",
    "price": 5000,
    "cost": 5000,
    "profit": 0,
    "supplierId": "sup_2",
    "supplierName": "القاسمي عمر لقطع الصيانة",
    "notes": "4500 شاشة J7 + 500 3 أسنان بطارية J7 = 5000 محولة لعمر"
  },
  {
    "id": "tx_20260901_transfer_mayas",
    "date": "2026-09-01",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "تحويل لمحمد مياس لتغذية رصيد جديد (دين رصيد جديد 20,000 ر.ي)",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)",
    "notes": "حول محمد مياس رصيد بـ 20 ألف دين جديد"
  },
  {
    "id": "tx_20260901_home_mosaab",
    "date": "2026-09-01",
    "time": "19:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 1200,
    "cost": 1200,
    "profit": 0,
    "notes": "صرفة بيت مصعب 1,200 ر.ي"
  },
  {
    "id": "tx_20260901_exp_shop",
    "date": "2026-09-01",
    "time": "19:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "صرفة شخصية ومصاريف يومية",
    "price": 3000,
    "cost": 3000,
    "profit": 0,
    "notes": "3000 صرفة يومية"
  }
];
