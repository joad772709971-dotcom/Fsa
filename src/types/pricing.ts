export type PriceCategory =
  | 'accessories' // أولاً: الإكسسوارات والملحقات
  | 'screens' // ثانياً: شاشات الصيانة
  | 'spare_parts' // ثالثاً: قطع الغيار والهاردوير
  | 'software' // رابعاً: خدمات البرمجة وضبط الشبكات
  | 'balance' // خامساً: الرصيد والشبكات
  | 'phones' // سادساً: الجوالات
  | 'other'; // أخرى

export interface PriceMemoryItem {
  id: string;
  code: number;
  name: string;
  category: PriceCategory;
  categoryNameAr: string;
  costPrice: number; // سعر الضمار / التكلفة المعتمدة
  sellingPrice: number; // سعر البيع المقترح / المعتاد
  profit: number; // صافي الفائدة المباشر (sellingPrice - costPrice)
  profitMarginPercent: number; // نسبة هامش الربح %
  quantity?: number; // الكمية المتوفرة بالمخزن
  minQuantityAlert?: number; // الحد الأدنى للكمية للتنبيه عند النقص
  supplierName?: string; // المورد المعتاد
  aliases: string[]; // كلمات مرادفة للتطابق التلقائي الذكي
  unit?: string;
  notes?: string;
  isCustomLearned?: boolean; // هل تم تعلمه تلقائياً من إدخالات المستخدم
  lastUpdated?: string;
}

export interface BalanceProfitRule {
  ratioPer10000: number; // 700 ر.ي لكل 10,000 ر.ي مبيعات
  percentage: number; // 7%
  notes: string;
}
