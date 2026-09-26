/**
 * مساعد استخراج وتحديد التواريخ باللغة العربية
 * يفهم التعبيرات الطبيعية مثل:
 * "عرض عمل يوم 25 شهر 8"
 * "عرض كشف يوم 4 شهر 9"
 * "اعرض لي يوم 15"
 * "كشف يوم امس"
 * "عرض اليوم"
 * "عمل يوم 25/8"
 */

export interface DateQueryResult {
  isDateQuery: boolean;
  isDayViewQuery: boolean;
  targetDate: string | null;
  dayNumber?: number;
  monthNumber?: number;
  displayText?: string;
  cleanedText?: string;
  hasAdditionalContent?: boolean;
}

const ARABIC_MONTHS: Record<string, number> = {
  'يناير': 1,
  'كانون الثاني': 1,
  'فبراير': 2,
  'شباط': 2,
  'مارس': 3,
  'آذار': 3,
  'ابريل': 4,
  'أبريل': 4,
  'نيسان': 4,
  'مايو': 5,
  'أيار': 5,
  'يونيو': 6,
  'حزيران': 6,
  'يوليو': 7,
  'تموز': 7,
  'اغسطس': 8,
  'أغسطس': 8,
  'آب': 8,
  'سبتمبر': 9,
  'أيلول': 9,
  'اكتوبر': 10,
  'أكتوبر': 10,
  'تشرين الأول': 10,
  'نوفمبر': 11,
  'تشرين الثاني': 11,
  'ديسمبر': 12,
  'كانون الأول': 12,
};

/**
 * تحويل الأرقام المشرقية إلى لاتينية
 */
export function normalizeDigits(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .trim();
}

/**
 * فحص ما إذا كان النص يحتوي على تاريخ أو يطلب عرض كشف يوم محدد
 */
export function parseDateFromNaturalText(
  rawText: string,
  referenceDate: string,
  availableDates: string[] = []
): DateQueryResult {
  const normalized = normalizeDigits(rawText);
  const text = normalized.toLowerCase().trim();

  // كلمات مفتاحية صريحة لطلب العرض والجلب فقط
  const explicitViewKeywords = [
    'عرض',
    'اعرض',
    'كشف',
    'وريني',
    'افتح',
    'هات',
    'شوف',
    'اطّلع',
    'اطلع',
    'اجلب',
    'جلب',
    'جيب',
    'هات لي',
    'بيانات',
    'معلومات',
    'ادخال',
    'إدخال',
    'يومية',
  ];

  const hasExplicitViewIntent = explicitViewKeywords.some((k) => text.startsWith(k) || text.includes(k));

  // استخراج السنة والشهر الافتراضي من التاريخ المرجعي (مثلاً 2026-08-31)
  const [refYearStr, refMonthStr] = referenceDate.split('-');
  const defaultYear = parseInt(refYearStr, 10) || 2026;
  const defaultMonth = parseInt(refMonthStr, 10) || 8;

  // 1. فحص ما إذا كان النص سؤالاً أو محادثة أو استشارة أو مسألة حسابية (لتجنب تفسيره كأمر انتقال لليوم)
  // إذا كان هناك نية صريحة لجلب أو فتح اليومية نتجاوز شرط المحادثة
  const isConversationalOrQuestion =
    !hasExplicitViewIntent &&
    (text.includes('؟') ||
      text.includes('?') ||
      /\b(كيف|هل|ليش|لماذا|ماذا|ماهو|ما هو|ما هي|ماهي|ايش|شو|كم|احسب|حساب|استشر|استشارة|نصيحة|رايك|رأيك|اشرح|فهم|عرف|مرحبا|سلام|هلا|صباح|مساء)\b/i.test(
        text
      ));

  // 1. فحص ذكر "اليوم"
  if (text.includes('اليوم') || text.includes('عمل اليوم') || text.includes('كشف اليوم')) {
    // إزالة كلمة "اليوم" أو "عمل اليوم" لمعرفة ما إذا كان هناك عمليات مسجلة بعدها
    const cleaned = text
      .replace(/^(?:عمل|كشف|حساب|سجل|قيود)?\s*اليوم(?:\s*هذا)?\s*[:،,-]?\s*/i, '')
      .replace(/\b(?:عمل|كشف|حساب)?\s*اليوم\b/g, '')
      .trim();

    const hasAdditionalContent =
      cleaned.length > 2 &&
      (/\d/.test(cleaned) ||
        cleaned.includes('مبيع') ||
        cleaned.includes('صرفة') ||
        cleaned.includes('سحب') ||
        cleaned.includes('واصل'));

    const isPureDayKeyword =
      text === 'اليوم' ||
      text === 'اليوم هذا' ||
      text === 'كشف اليوم' ||
      text === 'عمل اليوم' ||
      text === 'حساب اليوم';

    return {
      isDateQuery: !isConversationalOrQuestion,
      isDayViewQuery: !isConversationalOrQuestion && (hasExplicitViewIntent || isPureDayKeyword),
      targetDate: referenceDate,
      displayText: `اليوم (${referenceDate})`,
      cleanedText: cleaned,
      hasAdditionalContent,
    };
  }

  // 2. فحص طلب "أمس" أو "امس"
  if (text.includes('أمس') || text.includes('امس')) {
    const yesterday = getShiftedDate(referenceDate, -1);
    const cleaned = text.replace(/\b(أمس|امس|عمل امس|كشف امس)\b/g, '').trim();
    const hasAdditionalContent = cleaned.length > 2 && /\d/.test(cleaned);
    const isPureYesterdayKeyword =
      text === 'أمس' ||
      text === 'امس' ||
      text === 'كشف امس' ||
      text === 'كشف أمس' ||
      text === 'عمل امس' ||
      text === 'عمل أمس';

    return {
      isDateQuery: !isConversationalOrQuestion,
      isDayViewQuery: !isConversationalOrQuestion && (hasExplicitViewIntent || isPureYesterdayKeyword),
      targetDate: yesterday,
      displayText: `أمس (${yesterday})`,
      cleanedText: cleaned,
      hasAdditionalContent,
    };
  }

  // 3. فحص صيغة "25/8" أو "25-8" أو "2026-08-25"
  const slashPattern = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/;
  const slashMatch = text.match(slashPattern);
  if (slashMatch) {
    const d = parseInt(slashMatch[1], 10);
    const m = parseInt(slashMatch[2], 10);
    const y = slashMatch[3] ? parseInt(slashMatch[3], 10) : defaultYear;

    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const formatted = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const cleaned = text.replace(slashMatch[0], '').trim();
      const hasAdditionalContent = cleaned.length > 2 && (/\d/.test(cleaned) || cleaned.includes('مبيع') || cleaned.includes('صرفة') || cleaned.includes('واصل'));

      return {
        isDateQuery: !isConversationalOrQuestion,
        isDayViewQuery: !isConversationalOrQuestion && (hasExplicitViewIntent || !hasAdditionalContent),
        targetDate: formatted,
        dayNumber: d,
        monthNumber: m,
        displayText: `يوم ${d} شهر ${m}`,
        cleanedText: cleaned,
        hasAdditionalContent,
      };
    }
  }

  // 4. فحص صيغ: "6 شهر 8" أو "يوم 6 شهر 8" أو "يوم 6 من شهر 8" أو "يوم 25 اغسطس" أو "عمل يوم 4 شهر 9"
  // يجب أن يكون مسبوقاً بكلمة (يوم/تاريخ) أو متبوعاً بكلمة (شهر) أو اسم الشهر صراحة
  // ونضع حدود أرقام (?!\d) حتى لا نقتطع جزءاً من مبالغ مثل 3000 أو 1500
  let d: number | null = null;
  let m: number = defaultMonth;
  let matchedStr = '';

  // أ) صيغة: "6 شهر 8" أو "25 شهر 8"
  const patternWithMonthWord = /(?:^|[^\d])(\d{1,2})\s*(?:من)?\s*(?:شهر|ش)\s*([أ-ي]+|\d{1,2})(?!\d)/i;
  const matchMonthWord = text.match(patternWithMonthWord);

  // ب) صيغة: "يوم 6 شهر 8" أو "يوم 25" أو "تاريخ 6"
  const patternWithDayWord = /(?:^|[^\d])(?:يوم|يومية|عمل يوم|تاريخ)\s*(\d{1,2})(?:\s*(?:من)?\s*(?:شهر|ش)\s*([أ-ي]+|\d{1,2}))?(?!\d)/i;
  const matchDayWord = text.match(patternWithDayWord);

  // ج) صيغة: "25 اغسطس" أو "6 ايلول"
  const monthNamesList = Object.keys(ARABIC_MONTHS).join('|');
  const patternWithMonthName = new RegExp(`(?:^|[^\\d])(\\d{1,2})\\s*(?:من)?\\s*(${monthNamesList})(?!\\d)`, 'i');
  const matchMonthName = text.match(patternWithMonthName);

  if (matchMonthWord) {
    d = parseInt(matchMonthWord[1], 10);
    const monthPart = matchMonthWord[2].trim();
    const numM = parseInt(monthPart, 10);
    if (!isNaN(numM) && numM >= 1 && numM <= 12) {
      m = numM;
    } else if (ARABIC_MONTHS[monthPart]) {
      m = ARABIC_MONTHS[monthPart];
    }
    matchedStr = matchMonthWord[0].trim();
  } else if (matchDayWord) {
    d = parseInt(matchDayWord[1], 10);
    if (matchDayWord[2]) {
      const monthPart = matchDayWord[2].trim();
      const numM = parseInt(monthPart, 10);
      if (!isNaN(numM) && numM >= 1 && numM <= 12) {
        m = numM;
      } else if (ARABIC_MONTHS[monthPart]) {
        m = ARABIC_MONTHS[monthPart];
      }
    }
    matchedStr = matchDayWord[0].trim();
  } else if (matchMonthName) {
    d = parseInt(matchMonthName[1], 10);
    const monthName = matchMonthName[2].trim();
    if (ARABIC_MONTHS[monthName]) {
      m = ARABIC_MONTHS[monthName];
    }
    matchedStr = matchMonthName[0].trim();
  }

  if (d !== null && d >= 1 && d <= 31) {
    const dateStr = `${defaultYear}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    
    const matchedAvailable = availableDates.find((ad) => {
      const parts = ad.split('-');
      return parseInt(parts[2], 10) === d && parseInt(parts[1], 10) === m;
    });

    const finalDate = matchedAvailable || dateStr;
    const cleaned = text.replace(matchedStr, '').trim();
    const hasAdditionalContent = cleaned.length > 2 && (/\d/.test(cleaned) || cleaned.includes('مبيع') || cleaned.includes('صرفة') || cleaned.includes('واصل') || cleaned.includes('ف'));

    return {
      isDateQuery: !isConversationalOrQuestion,
      isDayViewQuery: !isConversationalOrQuestion && (hasExplicitViewIntent || !hasAdditionalContent),
      targetDate: finalDate,
      dayNumber: d,
      monthNumber: m,
      displayText: `يوم ${d} شهر ${m}`,
      cleanedText: cleaned,
      hasAdditionalContent,
    };
  }

  return {
    isDateQuery: false,
    isDayViewQuery: false,
    targetDate: null,
  };
}

/**
 * إزاحة التاريخ بعدد أيام محدد (+1 أو -1)
 */
export function getShiftedDate(dateStr: string, days: number): string {
  try {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  } catch {
    return dateStr;
  }
}

/**
 * تنسيق التاريخ باللغة العربية مع اليوم والشهر
 */
export function formatArabicDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const d = new Date(dateStr);
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = !isNaN(d.getDay()) ? dayNames[d.getDay()] : '';

    return `${dayName ? dayName + ' ' : ''}${day} ${monthNames[month - 1] || month} ${year}`;
  } catch {
    return dateStr;
  }
}

export { getTodayDateString, getCurrentMonthString, getCurrentMonthFirstDayString, getCurrentDayNumber, isToday } from './dateHelper';
