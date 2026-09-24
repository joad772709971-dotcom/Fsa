/**
 * مساعد استخراج وتنسيق التاريخ والوقت المحلي الحقيقي لنظام الرقم الأول
 * يضمن أن تاريخ اليوم الحالي (اليوم الفعلي للجهاز) هو الافتراضي في كافة الصفحات والفواتير
 */

/**
 * إرجاع تاريخ اليوم الفعلي الحالي بصيغة YYYY-MM-DD وفق التوقيت المحلي للمستخدم
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * إرجاع الشهر الحالي الفعلي بصيغة YYYY-MM
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * إرجاع أول يوم في الشهر الحالي بصيغة YYYY-MM-01
 */
export function getCurrentMonthFirstDayString(): string {
  return `${getCurrentMonthString()}-01`;
}

/**
 * إرجاع رقم اليوم الحالي في الشهر (مثلاً 7 أو 17)
 */
export function getCurrentDayNumber(): number {
  return new Date().getDate();
}

/**
 * فحص ما إذا كان التاريخ المدخل هو تاريخ اليوم
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}
