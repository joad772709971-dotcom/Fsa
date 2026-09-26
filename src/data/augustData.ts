import { Transaction } from '../types';
import { INITIAL_DAYS_DATA } from './initialRecords';
import { APPROVED_DAMAR_ITEMS_SEED } from './approvedDamarPrices';

export const AUGUST_BASE_TRANSACTIONS: Transaction[] = [
  {
    "id": "tx_20260801_exp_hamdan",
    "date": "2026-08-01",
    "time": "18:00",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة حمدان (على المحل)",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260801_exp_eng",
    "date": "2026-08-01",
    "time": "18:15",
    "type": "expense_engineer",
    "category": "engineer",
    "description": "صرفة المهندس (على المحل)",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260801_wth_eng",
    "date": "2026-08-01",
    "time": "18:30",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "حساب وسحب المهندس (يخصم من حسابه)",
    "price": 2250,
    "cost": 2250,
    "profit": 0
  },
  {
    "id": "tx_20260801_home_mosaab",
    "date": "2026-08-01",
    "time": "19:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2200,
    "cost": 2200,
    "profit": 0
  },
  {
    "id": "tx_20260801_transfer_mayas",
    "date": "2026-08-01",
    "time": "20:00",
    "type": "purchase",
    "category": "purchases",
    "description": "حوالة محمد مياس (رصيد الهادي)",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260802_ret_umax",
    "date": "2026-08-02",
    "time": "17:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "مرتجع جوال يوماكس للزبون",
    "price": 5500,
    "cost": 5500,
    "profit": 0
  },
  {
    "id": "tx_20260802_ret_screen_mosaab",
    "date": "2026-08-02",
    "time": "17:30",
    "type": "withdrawal_mosaab",
    "category": "mosaab",
    "description": "مرتجع شاشة ستايل 6 (على حساب مصعب)",
    "price": 7000,
    "cost": 7000,
    "profit": 0
  },
  {
    "id": "tx_20260802_exp_hamdan",
    "date": "2026-08-02",
    "time": "18:00",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة حمدان",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260802_home_mosaab",
    "date": "2026-08-02",
    "time": "18:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 1800,
    "cost": 1800,
    "profit": 0
  },
  {
    "id": "tx_20260802_transfer_mayas",
    "date": "2026-08-02",
    "time": "19:30",
    "type": "purchase",
    "category": "purchases",
    "description": "حوالة محمد مياس (رصيد)",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260803_home_mosaab",
    "date": "2026-08-03",
    "time": "18:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 1800,
    "cost": 1800,
    "profit": 0
  },
  {
    "id": "tx_20260803_exp_hamdan",
    "date": "2026-08-03",
    "time": "18:15",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة حمدان",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260803_exp_eng",
    "date": "2026-08-03",
    "time": "18:30",
    "type": "expense_engineer",
    "category": "engineer",
    "description": "صرفة المهندس",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260803_exp_modem",
    "date": "2026-08-03",
    "time": "19:00",
    "type": "expense_modem",
    "category": "expenses",
    "description": "رصيد المودم (مناصفة)",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260803_pay_khalil",
    "date": "2026-08-03",
    "time": "20:00",
    "type": "purchase",
    "category": "purchases",
    "description": "مسدد / مرتجع لخليل الأغبري",
    "price": 8500,
    "cost": 8500,
    "profit": 0,
    "supplierId": "sup_3",
    "supplierName": "خليل الأغبري للإكسسوارات وقطع الغيار"
  },
  {
    "id": "tx_20260804_home_mosaab",
    "date": "2026-08-04",
    "time": "17:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2300,
    "cost": 2300,
    "profit": 0
  },
  {
    "id": "tx_20260804_exp_hamdan",
    "date": "2026-08-04",
    "time": "18:00",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة حمدان",
    "price": 1500,
    "cost": 1500,
    "profit": 0
  },
  {
    "id": "tx_20260804_exp_abdulghani",
    "date": "2026-08-04",
    "time": "18:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "صرفة عبدالغني (بضاعة صنعاء)",
    "price": 300,
    "cost": 300,
    "profit": 0
  },
  {
    "id": "tx_20260804_shop_phone_bal",
    "date": "2026-08-04",
    "time": "19:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "رصيد جوال المحل",
    "price": 200,
    "cost": 200,
    "profit": 0
  },
  {
    "id": "tx_20260804_transfer_mayas",
    "date": "2026-08-04",
    "time": "19:30",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس من المحل لتكملة الحوالة",
    "price": 6000,
    "cost": 6000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260805_pay_khalil",
    "date": "2026-08-05",
    "time": "17:00",
    "type": "purchase",
    "category": "purchases",
    "description": "دفعة حساب / تحويل لخليل الأغبري",
    "price": 27000,
    "cost": 27000,
    "profit": 0,
    "supplierId": "sup_3",
    "supplierName": "خليل الأغبري للإكسسوارات وقطع الغيار"
  },
  {
    "id": "tx_20260805_pay_mayas",
    "date": "2026-08-05",
    "time": "17:30",
    "type": "purchase",
    "category": "purchases",
    "description": "حوالة رصيد لمحمد مياس",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260805_modem_jalal",
    "date": "2026-08-05",
    "time": "18:00",
    "type": "withdrawal_mosaab",
    "category": "mosaab",
    "description": "باقة مودم جلال (على حساب مصعب شخصي)",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260805_mazaya_mosaab",
    "date": "2026-08-05",
    "time": "18:15",
    "type": "withdrawal_mosaab",
    "category": "mosaab",
    "description": "باقة مزايا مصعب شخصي",
    "price": 1300,
    "cost": 1300,
    "profit": 0
  },
  {
    "id": "tx_20260805_home_mosaab",
    "date": "2026-08-05",
    "time": "18:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2100,
    "cost": 2100,
    "profit": 0
  },
  {
    "id": "tx_20260805_hamdan_settle",
    "date": "2026-08-05",
    "time": "19:00",
    "type": "withdrawal_worker",
    "category": "worker",
    "description": "تصفية حمدان النهائية (آخر يوم له في المحل)",
    "price": 7500,
    "cost": 7500,
    "profit": 0
  },
  {
    "id": "tx_20260805_exp_eng",
    "date": "2026-08-05",
    "time": "19:30",
    "type": "expense_engineer",
    "category": "engineer",
    "description": "صرفة المهندس",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260805_wth_eng",
    "date": "2026-08-05",
    "time": "20:00",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "سحب المهندس (يحسب عليه)",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260806_pay_khalil",
    "date": "2026-08-06",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لخليل الأغبري",
    "price": 27000,
    "cost": 27000,
    "profit": 0,
    "supplierId": "sup_3",
    "supplierName": "خليل الأغبري للإكسسوارات وقطع الغيار"
  },
  {
    "id": "tx_20260806_pay_mayas",
    "date": "2026-08-06",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس (رصيد)",
    "price": 30000,
    "cost": 30000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260808_pay_omar",
    "date": "2026-08-08",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "حوالة لعمر القاسمي لقطع غيار",
    "price": 28000,
    "cost": 28000,
    "profit": 0,
    "supplierId": "sup_2",
    "supplierName": "القاسمي عمر لقطع الصيانة"
  },
  {
    "id": "tx_20260808_car_exp",
    "date": "2026-08-08",
    "time": "18:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "أجرة سيارة نقل قطع",
    "price": 500,
    "cost": 500,
    "profit": 0
  },
  {
    "id": "tx_20260808_home_mosaab",
    "date": "2026-08-08",
    "time": "19:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 4200,
    "cost": 4200,
    "profit": 0
  },
  {
    "id": "tx_20260808_wth_eng",
    "date": "2026-08-08",
    "time": "20:00",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "حساب وسحب المهندس",
    "price": 1750,
    "cost": 1750,
    "profit": 0
  },
  {
    "id": "tx_20260809_masnaf_purchases",
    "date": "2026-08-09",
    "time": "17:30",
    "type": "purchase",
    "category": "purchases",
    "description": "مشتريات وبضاعة المصنف",
    "price": 22800,
    "cost": 22800,
    "profit": 0
  },
  {
    "id": "tx_20260809_pay_mayas",
    "date": "2026-08-09",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "حوالة رصيد لمحمد مياس",
    "price": 30000,
    "cost": 30000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260809_pay_khalil",
    "date": "2026-08-09",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لخليل الأغبري",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_3",
    "supplierName": "خليل الأغبري للإكسسوارات وقطع الغيار"
  },
  {
    "id": "tx_20260809_home_mosaab",
    "date": "2026-08-09",
    "time": "19:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 21000,
    "cost": 21000,
    "profit": 0
  },
  {
    "id": "tx_20260809_trips",
    "date": "2026-08-09",
    "time": "19:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "مشاوير ونقل بضاعة للمحل",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260809_screen_howror",
    "date": "2026-08-09",
    "time": "20:00",
    "type": "purchase",
    "category": "purchases",
    "description": "قيمة شاشة صاحب حورور",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260810_ret_umax",
    "date": "2026-08-10",
    "time": "17:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "مرتجع جوال يوماكس نقداً للزبون",
    "price": 5000,
    "cost": 5000,
    "profit": 0
  },
  {
    "id": "tx_20260810_home_mosaab",
    "date": "2026-08-10",
    "time": "18:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 1300,
    "cost": 1300,
    "profit": 0
  },
  {
    "id": "tx_20260810_wth_eng",
    "date": "2026-08-10",
    "time": "18:30",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "حساب وسحب المهندس",
    "price": 2250,
    "cost": 2250,
    "profit": 0
  },
  {
    "id": "tx_20260810_pay_khalil",
    "date": "2026-08-10",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لخليل الأغبري",
    "price": 6500,
    "cost": 6500,
    "profit": 0,
    "supplierId": "sup_3",
    "supplierName": "خليل الأغبري للإكسسوارات وقطع الغيار"
  },
  {
    "id": "tx_20260811_exp_modem",
    "date": "2026-08-11",
    "time": "17:30",
    "type": "expense_modem",
    "category": "expenses",
    "description": "رصيد مودم المحل",
    "price": 8000,
    "cost": 8000,
    "profit": 0
  },
  {
    "id": "tx_20260811_exp_shop",
    "date": "2026-08-11",
    "time": "18:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "صرفة ومصاريف المحل",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260811_pay_mayas",
    "date": "2026-08-11",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس (رصيد)",
    "price": 40000,
    "cost": 40000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260811_home_mosaab",
    "date": "2026-08-11",
    "time": "19:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 1600,
    "cost": 1600,
    "profit": 0
  },
  {
    "id": "tx_20260812_home_mosaab",
    "date": "2026-08-12",
    "time": "18:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2200,
    "cost": 2200,
    "profit": 0
  },
  {
    "id": "tx_20260813_ret_itel",
    "date": "2026-08-13",
    "time": "17:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "مرتجع واصل جوال إيتل",
    "price": 10000,
    "cost": 10000,
    "profit": 0
  },
  {
    "id": "tx_20260813_pay_mayas",
    "date": "2026-08-13",
    "time": "17:30",
    "type": "purchase",
    "category": "purchases",
    "description": "حوالة لمحمد مياس",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260813_exp_shop",
    "date": "2026-08-13",
    "time": "18:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "صرفة ومصاريف المحل",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260813_wth_eng",
    "date": "2026-08-13",
    "time": "18:30",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "حساب وسحب المهندس",
    "price": 1750,
    "cost": 1750,
    "profit": 0
  },
  {
    "id": "tx_20260813_home_mosaab",
    "date": "2026-08-13",
    "time": "19:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2200,
    "cost": 2200,
    "profit": 0
  },
  {
    "id": "tx_20260814_wth_eng",
    "date": "2026-08-14",
    "time": "18:00",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "حساب المهندس",
    "price": 1500,
    "cost": 1500,
    "profit": 0
  },
  {
    "id": "tx_20260814_dinner",
    "date": "2026-08-14",
    "time": "19:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "عشاء للمحل",
    "price": 500,
    "cost": 500,
    "profit": 0
  },
  {
    "id": "tx_20260815_ret_a32",
    "date": "2026-08-15",
    "time": "17:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "مرتجع جوال A32 نقداً",
    "price": 36000,
    "cost": 36000,
    "profit": 0
  },
  {
    "id": "tx_20260815_home_mosaab",
    "date": "2026-08-15",
    "time": "18:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب (2500 + 1500)",
    "price": 4000,
    "cost": 4000,
    "profit": 0
  },
  {
    "id": "tx_20260815_meter_phone",
    "date": "2026-08-15",
    "time": "18:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "أجرة صاحب المتر توصيل جوالات",
    "price": 1500,
    "cost": 1500,
    "profit": 0
  },
  {
    "id": "tx_20260815_mazaya_mosaab",
    "date": "2026-08-15",
    "time": "18:45",
    "type": "withdrawal_mosaab",
    "category": "mosaab",
    "description": "باقة مزايا مصعب شخصي",
    "price": 1300,
    "cost": 1300,
    "profit": 0
  },
  {
    "id": "tx_20260815_pay_mayas",
    "date": "2026-08-15",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس",
    "price": 3000,
    "cost": 3000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260815_exp_worker",
    "date": "2026-08-15",
    "time": "19:30",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة العامل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260816_ret_j3",
    "date": "2026-08-16",
    "time": "17:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "مرتجع جوال J3 مطور نقداً",
    "price": 15000,
    "cost": 15000,
    "profit": 0
  },
  {
    "id": "tx_20260816_home_mosaab",
    "date": "2026-08-16",
    "time": "17:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 1700,
    "cost": 1700,
    "profit": 0
  },
  {
    "id": "tx_20260816_pay_mayas",
    "date": "2026-08-16",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس (رصيد)",
    "price": 2000,
    "cost": 2000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260816_pay_omar",
    "date": "2026-08-16",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "حوالة لعمر القاسمي لقطع غيار",
    "price": 15500,
    "cost": 15500,
    "profit": 0,
    "supplierId": "sup_2",
    "supplierName": "القاسمي عمر لقطع الصيانة"
  },
  {
    "id": "tx_20260816_meter_exp",
    "date": "2026-08-16",
    "time": "19:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "كراء متر نقل بضاعة",
    "price": 500,
    "cost": 500,
    "profit": 0
  },
  {
    "id": "tx_20260816_wth_eng",
    "date": "2026-08-16",
    "time": "19:30",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "سحب وحساب المهندس",
    "price": 3500,
    "cost": 3500,
    "profit": 0
  },
  {
    "id": "tx_20260816_exp_worker",
    "date": "2026-08-16",
    "time": "20:00",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة العامل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260817_home_mosaab",
    "date": "2026-08-17",
    "time": "17:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2600,
    "cost": 2600,
    "profit": 0
  },
  {
    "id": "tx_20260817_pay_mayas",
    "date": "2026-08-17",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس",
    "price": 10000,
    "cost": 10000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260817_exp_worker",
    "date": "2026-08-17",
    "time": "18:30",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة العامل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260817_pay_omar",
    "date": "2026-08-17",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "مسدد لعمر القاسمي",
    "price": 6500,
    "cost": 6500,
    "profit": 0,
    "supplierId": "sup_2",
    "supplierName": "القاسمي عمر لقطع الصيانة"
  },
  {
    "id": "tx_20260817_wth_eng",
    "date": "2026-08-17",
    "time": "19:30",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "حساب المهندس",
    "price": 2250,
    "cost": 2250,
    "profit": 0
  },
  {
    "id": "tx_20260818_exp_worker",
    "date": "2026-08-18",
    "time": "17:30",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة العامل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260818_pay_omar",
    "date": "2026-08-18",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "مسدد لعمر القاسمي",
    "price": 7800,
    "cost": 7800,
    "profit": 0,
    "supplierId": "sup_2",
    "supplierName": "القاسمي عمر لقطع الصيانة"
  },
  {
    "id": "tx_20260818_pay_absari",
    "date": "2026-08-18",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "دفعة حساب لمؤسسة العبصري لقطع الغيار",
    "price": 4000,
    "cost": 4000,
    "profit": 0,
    "supplierId": "sup_1",
    "supplierName": "مؤسسة العبصري لقطع الغيار"
  },
  {
    "id": "tx_20260818_meter_exp",
    "date": "2026-08-18",
    "time": "19:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "أجرة نقل متر",
    "price": 1500,
    "cost": 1500,
    "profit": 0
  },
  {
    "id": "tx_20260818_pay_mayas",
    "date": "2026-08-18",
    "time": "19:30",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس",
    "price": 22000,
    "cost": 22000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260818_home_mosaab",
    "date": "2026-08-18",
    "time": "20:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2050,
    "cost": 2050,
    "profit": 0
  },
  {
    "id": "tx_20260819_pay_omar",
    "date": "2026-08-19",
    "time": "17:30",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لعمر القاسمي",
    "price": 19050,
    "cost": 19050,
    "profit": 0,
    "supplierId": "sup_2",
    "supplierName": "القاسمي عمر لقطع الصيانة"
  },
  {
    "id": "tx_20260819_ret_screen_j7",
    "date": "2026-08-19",
    "time": "18:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "مرتجع شاشة وعظمة J7",
    "price": 6000,
    "cost": 6000,
    "profit": 0
  },
  {
    "id": "tx_20260819_home_mosaab",
    "date": "2026-08-19",
    "time": "18:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2200,
    "cost": 2200,
    "profit": 0
  },
  {
    "id": "tx_20260819_exp_worker",
    "date": "2026-08-19",
    "time": "19:00",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة العامل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260819_pay_mayas",
    "date": "2026-08-19",
    "time": "19:30",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260820_home_mosaab",
    "date": "2026-08-20",
    "time": "17:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2200,
    "cost": 2200,
    "profit": 0
  },
  {
    "id": "tx_20260820_exp_worker",
    "date": "2026-08-20",
    "time": "18:00",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة العامل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260820_pay_omar",
    "date": "2026-08-20",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "مسدد لعمر القاسمي",
    "price": 2000,
    "cost": 2000,
    "profit": 0,
    "supplierId": "sup_2",
    "supplierName": "القاسمي عمر لقطع الصيانة"
  },
  {
    "id": "tx_20260820_pay_mayas",
    "date": "2026-08-20",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260823_exp_worker",
    "date": "2026-08-23",
    "time": "17:30",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة العامل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260823_home_mosaab",
    "date": "2026-08-23",
    "time": "18:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260823_buy_balance",
    "date": "2026-08-23",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "شراء رصيد كاش",
    "price": 25000,
    "cost": 25000,
    "profit": 0
  },
  {
    "id": "tx_20260823_pay_abu_ali",
    "date": "2026-08-23",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لفايز أبو علي (شبكة القمة)",
    "price": 15000,
    "cost": 15000,
    "profit": 0,
    "supplierId": "sup_5",
    "supplierName": "شبكة القمة (فايز وأبو علي)"
  },
  {
    "id": "tx_20260823_pay_mayas",
    "date": "2026-08-23",
    "time": "19:30",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس (شبكة الهادي)",
    "price": 15000,
    "cost": 15000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260824_home_mosaab",
    "date": "2026-08-24",
    "time": "17:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260824_buy_sims",
    "date": "2026-08-24",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "شراء شرائح اتصال للمحل",
    "price": 7500,
    "cost": 7500,
    "profit": 0
  },
  {
    "id": "tx_20260824_pay_abu_ali",
    "date": "2026-08-24",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "تحويل لفايز أبو علي (شبكة القمة)",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_5",
    "supplierName": "شبكة القمة (فايز وأبو علي)"
  },
  {
    "id": "tx_20260824_pay_mayas",
    "date": "2026-08-24",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "تحويل لمحمد مياس",
    "price": 5000,
    "cost": 5000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260824_phone_credit",
    "date": "2026-08-24",
    "time": "19:15",
    "type": "expense_shop",
    "category": "expenses",
    "description": "رصيد اتصال للرقم الشخصي/المحل",
    "price": 1500,
    "cost": 1500,
    "profit": 0
  },
  {
    "id": "tx_20260824_exp_worker",
    "date": "2026-08-24",
    "time": "19:30",
    "type": "expense_worker",
    "category": "worker",
    "description": "خرج ومصاريف المحل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260825_exp_worker",
    "date": "2026-08-25",
    "time": "17:30",
    "type": "expense_worker",
    "category": "worker",
    "description": "صرفة العامل",
    "price": 2500,
    "cost": 2500,
    "profit": 0
  },
  {
    "id": "tx_20260825_home_mosaab",
    "date": "2026-08-25",
    "time": "18:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 1600,
    "cost": 1600,
    "profit": 0
  },
  {
    "id": "tx_20260825_pay_khalil",
    "date": "2026-08-25",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "مسدد لخليل الأغبري",
    "price": 2900,
    "cost": 2900,
    "profit": 0,
    "supplierId": "sup_3",
    "supplierName": "خليل الأغبري للإكسسوارات وقطع الغيار"
  },
  {
    "id": "tx_20260826_home_mosaab",
    "date": "2026-08-26",
    "time": "17:30",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب",
    "price": 1600,
    "cost": 1600,
    "profit": 0
  },
  {
    "id": "tx_20260826_pay_abu_ali",
    "date": "2026-08-26",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لفايز أبو علي (شبكة القمة)",
    "price": 10000,
    "cost": 10000,
    "profit": 0,
    "supplierId": "sup_5",
    "supplierName": "شبكة القمة (فايز وأبو علي)"
  },
  {
    "id": "tx_20260826_pay_mayas",
    "date": "2026-08-26",
    "time": "18:30",
    "type": "purchase",
    "category": "purchases",
    "description": "محول لمحمد مياس",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260827_wth_mosaab_qat",
    "date": "2026-08-27",
    "time": "17:00",
    "type": "withdrawal_mosaab",
    "category": "mosaab",
    "description": "مصعب شخصي (قات صاحب حورور)",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260827_tools_dariss",
    "date": "2026-08-27",
    "time": "17:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "مكنة دارس + شليشان للمحل",
    "price": 300,
    "cost": 300,
    "profit": 0
  },
  {
    "id": "tx_20260827_home_mosaab",
    "date": "2026-08-27",
    "time": "18:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب (1200+200+600)",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260827_exp_shop",
    "date": "2026-08-27",
    "time": "18:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "صرفة ومصاريف المحل",
    "price": 2000,
    "cost": 2000,
    "profit": 0
  },
  {
    "id": "tx_20260827_pay_khalil",
    "date": "2026-08-27",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "مسدد لخليل الأغبري",
    "price": 7500,
    "cost": 7500,
    "profit": 0,
    "supplierId": "sup_3",
    "supplierName": "خليل الأغبري للإكسسوارات وقطع الغيار"
  },
  {
    "id": "tx_20260828_pay_mayas",
    "date": "2026-08-28",
    "time": "17:30",
    "type": "purchase",
    "category": "purchases",
    "description": "تحويل رصيد لمحمد مياس (20,000 جوالي + 7,000 الكريمي)",
    "price": 27000,
    "cost": 27000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260828_home_mosaab",
    "date": "2026-08-28",
    "time": "18:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "مسحوبات بيت مصعب",
    "price": 1600,
    "cost": 1600,
    "profit": 0
  },
  {
    "id": "tx_20260828_exp_shop",
    "date": "2026-08-28",
    "time": "18:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "صرفة المحل",
    "price": 1500,
    "cost": 1500,
    "profit": 0
  },
  {
    "id": "tx_20260830_dinner_qat",
    "date": "2026-08-30",
    "time": "18:00",
    "type": "expense_shop",
    "category": "expenses",
    "description": "عشاء وقات للمحل",
    "price": 1000,
    "cost": 1000,
    "profit": 0
  },
  {
    "id": "tx_20260830_pay_mayas",
    "date": "2026-08-30",
    "time": "19:00",
    "type": "purchase",
    "category": "purchases",
    "description": "حوالة لمحمد مياس (عبر الكريمي من عند عبد الحكيم الريمي)",
    "price": 5000,
    "cost": 5000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260831_pay_mayas",
    "date": "2026-08-31",
    "time": "17:00",
    "type": "purchase",
    "category": "purchases",
    "description": "تحويل لمحمد مياس لتغذية رصيد جديد",
    "price": 20000,
    "cost": 20000,
    "profit": 0,
    "supplierId": "sup_4",
    "supplierName": "شبكة الهادي (محمد مياس)"
  },
  {
    "id": "tx_20260831_pay_omar",
    "date": "2026-08-31",
    "time": "17:30",
    "type": "purchase",
    "category": "purchases",
    "description": "مشتريات من عمر القاسمي (فلاتة شحن صيني شبيه S22 ألترا)",
    "price": 3000,
    "cost": 3000,
    "profit": 0,
    "supplierId": "sup_2",
    "supplierName": "القاسمي عمر لقطع الصيانة"
  },
  {
    "id": "tx_20260831_pay_khalil",
    "date": "2026-08-31",
    "time": "18:00",
    "type": "purchase",
    "category": "purchases",
    "description": "مشتريات وتحويل لخليل الأغبري",
    "price": 4900,
    "cost": 4900,
    "profit": 0,
    "supplierId": "sup_3",
    "supplierName": "خليل الأغبري للإكسسوارات وقطع الغيار"
  },
  {
    "id": "tx_20260831_exp_personal",
    "date": "2026-08-31",
    "time": "18:30",
    "type": "expense_shop",
    "category": "expenses",
    "description": "صرفة شخصية ومصاريف",
    "price": 3000,
    "cost": 3000,
    "profit": 0
  },
  {
    "id": "tx_20260831_home_mosaab",
    "date": "2026-08-31",
    "time": "19:00",
    "type": "expense_home_mosaab",
    "category": "mosaab",
    "description": "صرفة بيت مصعب (مسلم لبنت مصعب)",
    "price": 2100,
    "cost": 2100,
    "profit": 0
  },
  {
    "id": "tx_20260831_wth_eng",
    "date": "2026-08-31",
    "time": "19:30",
    "type": "withdrawal_engineer",
    "category": "engineer",
    "description": "حساب وسحب المهندس (عن عمل اليوم)",
    "price": 3300,
    "cost": 3300,
    "profit": 0
  }
];

// استرجاع وتوليد كافة حركات المبيعات والصيانة الفعلية المعتمدة لشهر أغسطس من السجلات اليومية بدقة وبدون تكرار
const damarPriceMap = new Map<string, { costPrice: number; sellingPrice: number; profit: number }>();
APPROVED_DAMAR_ITEMS_SEED.forEach((p) => {
  if (p.name) damarPriceMap.set(p.name.trim(), p);
  (p.aliases || []).forEach((a) => {
    if (a) damarPriceMap.set(a.trim(), p);
  });
});

export function generateAugustSalesAndMaintTransactions(): Transaction[] {
  const generated: Transaction[] = [];

  INITIAL_DAYS_DATA.forEach((day) => {
    const dateCompact = (day.date || '').replace(/-/g, '');

    // 1. مبيعات الإكسسوارات الفعلية
    (day.accessories || []).forEach((acc, idx) => {
      const name = (acc.name || '').trim();
      const matched = damarPriceMap.get(name);
      const price = Number(acc.price) || 0;
      const cost =
        acc.cost !== undefined && acc.cost !== null
          ? Number(acc.cost)
          : matched
          ? matched.costPrice
          : Math.round(price * 0.7);
      const profit =
        acc.profit !== undefined && acc.profit !== null
          ? Number(acc.profit)
          : Math.max(0, price - cost);

      const hour = 10 + Math.floor(idx / 6);
      const minute = (idx % 6) * 10;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      generated.push({
        id: `tx_${dateCompact}_acc_${acc.id || idx + 1}`,
        date: day.date,
        time: timeStr,
        type: 'sale',
        category: 'accessories',
        description: acc.name || 'إكسسوار',
        price,
        cost,
        profit,
        paymentMethod: 'cash',
      });
    });

    // 2. مبيعات الجوالات الفعلية
    (day.phones || []).forEach((ph, idx) => {
      const salePrice = Number(ph.salePrice) || 0;
      const phoneCost = ph.purchaseCost ?? ph.cost;
      const cost =
        phoneCost !== undefined && phoneCost !== null
          ? Number(phoneCost)
          : ph.profit !== undefined && ph.profit !== null
          ? Math.max(0, salePrice - Number(ph.profit))
          : Math.round(salePrice * 0.9);
      const profit =
        ph.profit !== undefined && ph.profit !== null
          ? Number(ph.profit)
          : Math.max(0, salePrice - cost);

      const timeStr = `12:${String(idx * 15).padStart(2, '0').slice(-2)}`;

      generated.push({
        id: `tx_${dateCompact}_ph_${ph.id || idx + 1}`,
        date: day.date,
        time: timeStr,
        type: 'sale',
        category: 'phones',
        description: ph.model || 'جوال',
        price: salePrice,
        cost,
        profit,
        paidAmount: ph.paidAmount !== undefined ? Number(ph.paidAmount) : salePrice,
        remainingAmount: ph.remainingAmount !== undefined ? Number(ph.remainingAmount) : 0,
        notes: ph.notes || ph.status || '',
        paymentMethod: 'cash',
      });
    });

    // 3. عمليات الصيانة الفعلية
    (day.maintenance || []).forEach((m, idx) => {
      const price = Number(m.price) || 0;
      const cost = m.cost !== undefined && m.cost !== null ? Number(m.cost) : 0;
      const profit =
        m.profit !== undefined && m.profit !== null
          ? Number(m.profit)
          : Math.max(0, price - cost);

      const hour = 13 + Math.floor(idx / 4);
      const minute = (idx % 4) * 15;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      generated.push({
        id: `tx_${dateCompact}_maint_${m.id || idx + 1}`,
        date: day.date,
        time: timeStr,
        type: 'maintenance',
        category: 'maintenance',
        description: m.deviceOrService || 'صيانة',
        price,
        cost,
        profit,
        notes: m.type ? `نوع الصيانة: ${m.type}` : '',
        paymentMethod: 'cash',
      });
    });

    // 4. مبيعات رصيد الهادي الفعلية
    if (
      day.recharge &&
      (day.recharge.totalWithProfit > 0 || (day.recharge.hadi && day.recharge.hadi.salesWithProfit > 0))
    ) {
      const price =
        Number(day.recharge.hadi?.salesWithProfit) || Number(day.recharge.totalWithProfit) || 0;
      const cost =
        Number(day.recharge.hadi?.salesWithoutProfit) || Number(day.recharge.totalWithoutProfit) || 0;
      const profit = Number(day.recharge.totalProfit) || Math.max(0, price - cost);

      generated.push({
        id: `tx_${dateCompact}_rec_hadi`,
        date: day.date,
        time: '16:00',
        type: 'balance_hadi',
        category: 'balance',
        description: 'مبيعات رصيد شبكة الهادي',
        price,
        cost,
        profit,
        paymentMethod: 'cash',
      });
    }

    // 5. مبيعات رصيد القمة إن وجدت
    if (day.recharge?.qimmah && day.recharge.qimmah.salesWithProfit > 0) {
      const price = Number(day.recharge.qimmah.salesWithProfit) || 0;
      const cost = Number(day.recharge.qimmah.salesWithoutProfit) || 0;
      const profit = Math.max(0, price - cost);

      generated.push({
        id: `tx_${dateCompact}_rec_qimmah`,
        date: day.date,
        time: '16:15',
        type: 'balance_qimma',
        category: 'balance',
        description: 'مبيعات رصيد شبكة القمة',
        price,
        cost,
        profit,
        paymentMethod: 'cash',
      });
    }
  });

  return generated;
}

export const AUGUST_SALES_MAINT_TRANSACTIONS: Transaction[] = generateAugustSalesAndMaintTransactions();

export const AUGUST_TRANSACTIONS: Transaction[] = [
  ...AUGUST_SALES_MAINT_TRANSACTIONS,
  ...AUGUST_BASE_TRANSACTIONS,
];

