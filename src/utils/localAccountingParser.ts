import { ParsedTransactionItem, Transaction, InventoryItem, Supplier } from '../types';
import { parseDateFromNaturalText } from './aiDateHelper';
import { generateAutoBarcode } from './barcode';

/**
 * محرك تحليلي محلي ذكي غير معتمد على الإنترنت (100% Offline Local Accounting Parser)
 * تم تدريبه وبرمجته خصيصاً على لهجة ومصطلحات محل مصعب الصوفي:
 * - حرف "ف" يعني فايدة (ربح)
 * - "مياس" هو محمد مياس صاحب تطبيق الهادي للرصيد
 * - الموردين: خليل الأغبري، القاسمي (عمر القاسمي)، فايز أبو علي (الرقم / القمة)، العبصري، المصنف
 * - البحث الذكي في جوالات الصيانة والديون عند قول "واصل باقي جوال كذا"
 * - دعم التواريخ: "اليوم"، أو "6 شهر 8"، "يوم 25 شهر 8"، "6/8"
 * - مشتريات الموردين: "مشتريات خليل كذا بكذا كذا بكذا باقي لة كذا"
 * - سحوبات وصرفة: "بيت مصعب كذا"، "مصعب كذا"، "صرفة كذا"
 */

export interface LocalParseResult {
  summary: string;
  needsClarification: boolean;
  clarificationPrompt?: string;
  items: ParsedTransactionItem[];
  detectedDate?: string;
  detectedSupplier?: string;
}

/**
 * تحويل الأرقام العربية المشرقية (٠١٢٣٤٥٦٧٨٩) إلى أرقام إنجليزية مع فصل الأرقام الملتصقة
 */
function normalizeDigits(str: string): string {
  let res = str
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .trim();
  // فصل حرف "ف" أو "فـ" الملتصق بالأرقام (مثل 1500ف -> 1500 ف)
  res = res.replace(/(\d+)(ف|فـ|=|فايدة|فائدة|ربح)(?=\s|\d|[أ-ي]|$)/gi, '$1 $2 ');
  // فصل الكلمات العربية الملتصقة بالأرقام (مثل 1500بيت -> 1500 بيت، 6500شاشة -> 6500 شاشة)
  res = res.replace(/(\d+)([أ-ي])/g, '$1 $2');
  res = res.replace(/([أ-ي])(\d+)/g, '$1 $2');
  return res.trim();
}

/**
 * خريطة الموردين المعتمدين لمحل مصعب الصوفي
 */
const KNOWN_SUPPLIERS_MAP: { [key: string]: { name: string; type: any } } = {
  خليل: { name: 'خليل الأغبري', type: 'transfer_khalil_aghbari' },
  الاغبري: { name: 'خليل الأغبري', type: 'transfer_khalil_aghbari' },
  الأغبري: { name: 'خليل الأغبري', type: 'transfer_khalil_aghbari' },
  قاسمي: { name: 'عمر القاسمي', type: 'transfer_omar_qasimi' },
  القاسمي: { name: 'عمر القاسمي', type: 'transfer_omar_qasimi' },
  عبصري: { name: 'العبصري', type: 'transfer_to_supplier' },
  العبصري: { name: 'العبصري', type: 'transfer_to_supplier' },
  مصنف: { name: 'المصنف', type: 'transfer_musannaf' },
  المصنف: { name: 'المصنف', type: 'transfer_musannaf' },
  فايز: { name: 'فايز أبو علي', type: 'transfer_faiez_abu_ali' },
  'ابو علي': { name: 'فايز أبو علي', type: 'transfer_faiez_abu_ali' },
  'أبو علي': { name: 'فايز أبو علي', type: 'transfer_faiez_abu_ali' },
  القمة: { name: 'فايز أبو علي (القمة)', type: 'transfer_faiez_abu_ali' },
  الرقم: { name: 'فايز أبو علي (الرقم)', type: 'transfer_faiez_abu_ali' },
};

/**
 * خريطة رموز واختصارات الموردين المعتمدة:
 * م = المصنف (قطع غيار وبضاعة)
 * خ = خليل الأغبري (مورد قطع صيانة)
 * ق = عمر القاسمي (مورد قطع صيانة)
 * ع = العبصري (مورد قطع صيانة)
 * م = مرتجع (عند اقترانه بالمورد مثل "ق م" أو عند كتابته في بند القطعة)
 */
export const SUPPLIER_SHORTHAND_MAP: {
  [key: string]: { code: string; name: string; type: any; fullName: string };
} = {
  م: { code: 'م', name: 'المصنف', type: 'transfer_musannaf', fullName: 'المصنف (قطع غيار وبضاعة)' },
  خ: { code: 'خ', name: 'خليل الأغبري', type: 'transfer_khalil_aghbari', fullName: 'خليل الأغبري (قطع صيانة)' },
  ق: { code: 'ق', name: 'عمر القاسمي', type: 'transfer_omar_qasimi', fullName: 'عمر القاسمي (قطع صيانة)' },
  ع: { code: 'ع', name: 'العبصري', type: 'transfer_to_supplier', fullName: 'العبصري (قطع صيانة)' },
};

export const SUPPLIER_RETURN_TYPE_MAP: { [key: string]: string } = {
  م: 'return_to_supplier_musannaf',
  خ: 'return_to_supplier_aghbari',
  ق: 'return_to_supplier_qasimi',
  ع: 'return_to_supplier_musannaf',
};

export interface DetectedSupplier {
  code: string;
  name: string;
  type: any;
  fullName: string;
  isReturn?: boolean;
}

export function detectSupplierHeader(line: string): DetectedSupplier | null {
  const trimmed = line.trim();

  // 1. فحص صيغة المرتجع للمورد (مثل "ق م" أو "خ م" أو "ع م" أو "م م" أو "ق مرتجع")
  const returnSuffixMatch = trimmed.match(/^([قمخع])\s*(?:م|مرتجع|رجيع|مردود)\b/i);
  if (returnSuffixMatch) {
    const code = returnSuffixMatch[1];
    const base = SUPPLIER_SHORTHAND_MAP[code];
    if (base) {
      return {
        ...base,
        isReturn: true,
        fullName: `${base.name} (مرتجع للمورد)`,
      };
    }
  }

  // 2. فحص صيغة "مرتجع ق" أو "مرتجع القاسمي"
  const prefixReturnMatch = trimmed.match(/^(?:مرتجع|مردودات|رجيع)\s*(?:المورد|التاجر)?\s*([قمخع])\b/i);
  if (prefixReturnMatch) {
    const code = prefixReturnMatch[1];
    const base = SUPPLIER_SHORTHAND_MAP[code];
    if (base) {
      return {
        ...base,
        isReturn: true,
        fullName: `${base.name} (مرتجع للمورد)`,
      };
    }
  }

  // 3. فحص الرموز الأحادية المباشرة (ق، خ، ع، م)
  if (SUPPLIER_SHORTHAND_MAP[trimmed]) {
    return { ...SUPPLIER_SHORTHAND_MAP[trimmed], isReturn: false };
  }

  // 4. فحص "مشتريات ق" أو "مورد خ"
  const prefixMatch = trimmed.match(/^(?:مشتريات|مورد|تاجر|فاتورة|المورد|التاجر)\s*([قمخع])\b/i);
  if (prefixMatch && SUPPLIER_SHORTHAND_MAP[prefixMatch[1]]) {
    return { ...SUPPLIER_SHORTHAND_MAP[prefixMatch[1]], isReturn: false };
  }

  // 5. فحص الأسماء الكاملة للموردين
  if (trimmed.includes('قاسم') || trimmed.includes('القاسمي')) {
    const isRet = trimmed.includes('مرتجع') || trimmed.includes('رجيع') || trimmed.endsWith(' م');
    return { ...SUPPLIER_SHORTHAND_MAP['ق'], isReturn: isRet };
  }
  if (trimmed.includes('خليل') || trimmed.includes('اغبري') || trimmed.includes('الأغبري')) {
    const isRet = trimmed.includes('مرتجع') || trimmed.includes('رجيع') || trimmed.endsWith(' م');
    return { ...SUPPLIER_SHORTHAND_MAP['خ'], isReturn: isRet };
  }
  if (trimmed.includes('عبصري') || trimmed.includes('العبصري')) {
    const isRet = trimmed.includes('مرتجع') || trimmed.includes('رجيع') || trimmed.endsWith(' م');
    return { ...SUPPLIER_SHORTHAND_MAP['ع'], isReturn: isRet };
  }
  if (trimmed.includes('مصنف') || trimmed.includes('المصنف')) {
    const isRet = trimmed.includes('مرتجع') || trimmed.includes('رجيع') || trimmed.endsWith(' م');
    return { ...SUPPLIER_SHORTHAND_MAP['م'], isReturn: isRet };
  }
  return null;
}

function detectSupplierInText(text: string): { name: string; type: any } | null {
  for (const [key, sup] of Object.entries(KNOWN_SUPPLIERS_MAP)) {
    if (text.includes(key)) {
      return sup;
    }
  }
  return null;
}

export function parseEntryLocally(
  rawText: string,
  currentDate: string,
  existingTransactions: Transaction[] = [],
  inventory: InventoryItem[] = [],
  suppliers: Supplier[] = []
): LocalParseResult {
  const clean = normalizeDigits(rawText.trim());

  if (!clean || clean.length < 2) {
    return {
      summary: 'النص فارغ أو قصير جداً.',
      needsClarification: true,
      clarificationPrompt: 'يرجى كتابة أو نطق العملية بوضوح، مثل: سماعة 500 ف400 أو بيت مصعب 3000.',
      items: [],
    };
  }

  // 1. استخراج التاريخ الذكي إن وجد (مثل: "اليوم"، أو "6 شهر 8"، أو "يوم 4 شهر 9")
  let targetDate = currentDate;
  let textToParse = clean;

  const dateCheck = parseDateFromNaturalText(clean, currentDate);
  if (dateCheck.isDateQuery && dateCheck.targetDate) {
    targetDate = dateCheck.targetDate;
    if (dateCheck.cleanedText) {
      textToParse = dateCheck.cleanedText;
    } else {
      // المستخدم قال فقط "اليوم" أو "6 شهر 8" بدون عمليات بعده
      return {
        summary: `تم ضبط وتحديد العمل على ${dateCheck.displayText || targetDate}. المحاسب بانتظار إدخال الحركات المالية لهذا اليوم.`,
        needsClarification: true,
        clarificationPrompt: `تم تحديد ${dateCheck.displayText || targetDate}. تفضل الآن بنطق أو كتابة الحركات، مثل: "مبيعات سماعة 500 ف400" أو "واصل 3000 باقي 1000 ف500" أو "بيت مصعب 5000".`,
        items: [],
        detectedDate: targetDate,
      };
    }
  }

  // كلمات التحية والاستفسار والدردشة العامة
  const greetings = ['مرحبا', 'السلام عليكم', 'الو', 'هلا', 'صباح الخير', 'مساء الخير', 'كيفك', 'يا محاسب'];
  if (greetings.some((g) => textToParse.startsWith(g) || textToParse === g)) {
    return {
      summary: 'تحية وترحيب واستفسار عام',
      needsClarification: false,
      clarificationPrompt: 'أهلاً بك يا غالي! كيف أقدر أساعدك اليوم في المحاسبة، الحسابات الرياضية، استشارات التجارة، أو أي استفسار عام؟',
      items: [],
      detectedDate: targetDate,
    };
  }

  const items: ParsedTransactionItem[] = [];
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // تنظيف كلمة "مبيعات" أو "المبيعات" في بداية النص إذا كانت بمثابة عنوان للأصناف اللاحقة
  let workingText = textToParse;
  let defaultMode = '';
  if (/^(?:مبيعات|المبيعات|مبيع)\s*[:،,-]?\s*/i.test(workingText)) {
    defaultMode = 'sale';
    workingText = workingText.replace(/^(?:مبيعات|المبيعات|مبيع)\s*[:،,-]?\s*/i, '');
  } else if (/^(?:مشتريات|شراء)\s*[:،,-]?\s*/i.test(workingText)) {
    defaultMode = 'purchase';
  }

  // معالجة خاصة لنمط مشتريات الموردين المركب:
  // "مشتريات خليل سماعات 20000 كابلات 15000 باقي لة 10000"
  // أو القاسمي أو فايز أبو علي أو العبصري أو المصنف
  const supplierPurchaseMatch = workingText.match(/^(?:مشتريات|شراء|فاتورة)\s+([أ-ي\s]+?)\s+(.+)$/i);
  if (supplierPurchaseMatch) {
    const rawSupName = supplierPurchaseMatch[1].trim();
    const supInfo = detectSupplierInText(rawSupName);
    if (supInfo) {
      const restContent = supplierPurchaseMatch[2].trim();
      const parsedBlock = parseSupplierPurchaseStream(
        restContent,
        supInfo.name,
        targetDate,
        currentTime
      );
      if (parsedBlock.length > 0) {
        items.push(...parsedBlock);
        return {
          summary: `تم استخراج ${items.length} أصناف مشتريات من المورد (${supInfo.name}) لتاريخ (${targetDate}) بإجمالي ${(items.reduce((s, it) => s + (it.price || 0), 0)).toLocaleString()} ر.ي.`,
          needsClarification: false,
          items,
          detectedDate: targetDate,
          detectedSupplier: supInfo.name,
        };
      }
    }
  }

  // تقسيم الأسطر أو الجمل إذا كتب أو قال أكثر من حركة (بالواو أو السطر الجديد أو الفاصلة أو + أو أو أو بكذا)
  // استخدام "او" و "أو" كفواصل شائعة باللهجة اليمنية عند ذكر عمليات متعددة
  const lines = workingText
    .split(/[\n،,+؛;]|(?:\s+(?:او|أو)\s+)|(?:\s+و\s+(?=[أ-ي]+))|(?:\s+ثم\s+)|(?:\s+بكذا\s+)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  let capturedSupplierName = '';
  let activeSupplier = '';

  for (const line of lines) {
    // التحقق مما إذا كان السطر يذكر المورد (خليل، القاسمي، العبصري، المصنف، فايز، مياس)
    const detectedSup = detectSupplierInText(line);
    if (detectedSup) {
      activeSupplier = detectedSup.name;
      if (!capturedSupplierName) {
        capturedSupplierName = detectedSup.name;
      }
    } else if (line.includes('مياس')) {
      activeSupplier = 'محمد مياس (الهادي)';
      if (!capturedSupplierName) {
        capturedSupplierName = activeSupplier;
      }
    }

    // إذا كان السطر هو فقط اسم مورد أو مشتريات مورد بدون أرقام (مثل: "مشتريات خليل" كعنوان لأسطر تالية)
    if (!/\d/.test(line)) {
      if (line.includes('مشتريات') || line.includes('شراء')) {
        defaultMode = 'purchase';
      }
      continue;
    }

    // استبعاد تام لأسطر الأصفار (مثل: "جوالات: 0", "ديون 0", "صيانة 0", "بطاريات 0", "ش0 ب0", "0")
    if (
      line.match(/^(?:جوالات|ديون|صيانة|شرايح|رصيد|مشتريات|اكسسوارات|بضاعة|بطاريات)?\s*[:=\-]?\s*0\s*$/i) ||
      line.match(/^(?:ش\s*0\s*ب\s*0|ب\s*0\s*ش\s*0|0)$/i)
    ) {
      continue;
    }

    // فحص ما إذا كان السطر هو مجرد إثبات متبقي للمورد: "باقي له 10000" أو "باقي لة 10000"
    const isSupplierRemainingOnly = line.match(/^(?:باقي\s*(?:له|لة)?|متبقي)\s*(\d+)$/i);
    if (isSupplierRemainingOnly && activeSupplier && items.length > 0) {
      const rem = parseFloat(isSupplierRemainingOnly[1]);
      // نربط المتبقي لآخر عنصر مشتريات مسجل للمورد
      const lastItem = items[items.length - 1];
      if (lastItem && lastItem.type === 'purchase') {
        lastItem.remainingAmount = rem;
        lastItem.notes = `${lastItem.notes || ''} | المتبقي للمورد في الذمة: ${rem.toLocaleString()} ر.ي`.trim();
        continue;
      }
    }

    const parsedLine = parseSingleLine(
      line,
      targetDate,
      currentTime,
      existingTransactions,
      inventory,
      defaultMode,
      activeSupplier
    );

    if (parsedLine) {
      // استبعاد تام لأي قيد نتيجته 0 ر.ي في السعر والربح والمتبقي
      if (
        (parsedLine.price || 0) === 0 &&
        (parsedLine.profit || 0) === 0 &&
        !(parsedLine.remainingAmount && parsedLine.remainingAmount > 0)
      ) {
        continue;
      }

      if (!parsedLine.supplierName && activeSupplier) {
        parsedLine.supplierName = activeSupplier;
      }
      if (parsedLine.supplierName && !capturedSupplierName) {
        capturedSupplierName = parsedLine.supplierName;
      }
      items.push(parsedLine);
    }
  }

  if (items.length > 0) {
    const totalAmount = items.reduce((sum, it) => sum + (it.price || 0), 0);
    const totalProfit = items.reduce((sum, it) => sum + (it.profit || 0), 0);
    return {
      summary: `تم استخراج ${items.length} حركة محاسبية لتاريخ (${targetDate}) بإجمالي ${totalAmount.toLocaleString('en-US')} ر.ي وفايدة إجمالية ${totalProfit.toLocaleString('en-US')} ر.ي.`,
      needsClarification: false,
      items,
      detectedDate: targetDate,
      detectedSupplier: capturedSupplierName || undefined,
    };
  }

  // إذا لم نتمكن من استخراج عملية مؤكدة
  return {
    summary: 'لم يتم التعرف على مبالغ أو تفاصيل محددة',
    needsClarification: true,
    clarificationPrompt: 'لم أتمكن من استخراج الأرقام بدقة. يرجى توضيح المبلغ ونوع الحركة (مثال: "سماعة 500 ف400" حيث ف تعني الفايدة، أو "مبيع جوال ردمي 45000 ف5000" أو "بيت مصعب 5000" أو "واصل باقي جوال...").',
    items: [],
    detectedDate: targetDate,
  };
}

/**
 * تحليل سيل من مشتريات المورد مع الأصناف والمتبقي
 * مثال: "سماعات 20000 كابلات 15000 باقي لة 10000"
 */
function parseSupplierPurchaseStream(
  stream: string,
  supplierName: string,
  targetDate: string,
  currentTime: string
): ParsedTransactionItem[] {
  const result: ParsedTransactionItem[] = [];

  // 1. استخراج المتبقي للمورد إن وجد في نهاية النص: "باقي له 10000" أو "باقي لة 10000"
  let remainingAmount: number | undefined;
  const remMatch = stream.match(/(?:باقي\s*(?:له|لة)?|متبقي)\s*(\d+)/i);
  if (remMatch) {
    remainingAmount = parseFloat(remMatch[1]);
  }

  const itemsCleaned = stream
    .replace(/(?:باقي\s*(?:له|لة)?|متبقي)\s*\d+/gi, '')
    .trim();

  // 2. تطبيع وتقسيم الأصناف والأسعار:
  // تقسيم النص عندما يتبع الرقم كلمة جديدة بحرف عربي مثل "سماعات 20000 كابلات 15000"
  const normalizedStream = itemsCleaned.replace(/(\d+)\s+([أ-ي])/g, (_m, p1, p2) => `${p1}\n${p2}`);

  const subItems = normalizedStream
    .split(/[\n،,+؛;]|(?:\s+و\s+(?=[أ-ي]+))|(?:\s+بكذا\s+)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sub of subItems) {
    // استخراج المبلغ والاسم
    // مثال: "سماعات 20000" أو "5 كابلات بـ 15000"
    const numMatch = sub.match(/(\d+)/);
    if (numMatch) {
      const price = parseFloat(numMatch[1]);
      let desc = sub.replace(numMatch[0], '').replace(/(?:بـ|سعر|بقيمة|ب)\s*$/i, '').trim();
      if (!desc) desc = 'صنف مشتريات بضاعة';

      result.push({
        date: targetDate,
        type: 'purchase',
        category: 'purchases',
        description: desc,
        price,
        cost: price,
        profit: 0,
        supplierName,
        time: currentTime,
        notes: `مشتريات من ${supplierName}`,
      });
    }
  }

  // إذا وجد متبقي، نرفقه بآخر صنف
  if (remainingAmount !== undefined && result.length > 0) {
    result[result.length - 1].remainingAmount = remainingAmount;
    result[result.length - 1].notes += ` | باقي له في الحساب: ${remainingAmount.toLocaleString()} ر.ي`;
  }

  return result;
}

function parseSingleLine(
  rawLine: string,
  targetDate: string,
  currentTime: string,
  existingTransactions: Transaction[],
  inventory: InventoryItem[],
  defaultMode: string,
  activeSupplier?: string
): ParsedTransactionItem | null {
  const line = rawLine.trim();
  if (!line || line.length < 2) return null;

  // ================= 0. اختصارات البضاعة والمخزن والمشتريات وتوليد الباركود تلقائياً =================
  // ج = جوالات | ك = إكسسوارات | ص = صيانة | ش = شرايح | ر = رصيد | م = بضاعة سابقة نظيفها
  const shorthandPurchaseMatch =
    line.match(/^(?:مشتريات|شراء)\s+([جكصشر])\s+(.+)$/i) ||
    line.match(/^م\s+(?:([جكصشر])\s+)?(.+)$/i) ||
    line.match(/^(?:بضاعة سابقة|بضاعة قديمة|إضافة مخزن|مخزن سابق)\s+(?:([جكصشر])\s+)?(.+)$/i) ||
    line.match(/^([جكصشر])\s+([^0-9\s].*?\d+.*)$/i);

  if (shorthandPurchaseMatch) {
    const isMCode = line.startsWith('م ') || line.startsWith('بضاعة سابقة') || line.startsWith('بضاعة قديمة') || line.startsWith('إضافة مخزن');
    const shorthandLetter = shorthandPurchaseMatch[1] || (isMCode ? 'م' : 'ك');
    const rest = (shorthandPurchaseMatch[2] || '').trim();

    let category: 'phones' | 'accessories' | 'maintenance' | 'sims' | 'balance' = 'accessories';
    let arabicCategory = 'إكسسوارات';

    if (shorthandLetter === 'ج') {
      category = 'phones';
      arabicCategory = 'جوالات';
    } else if (shorthandLetter === 'ك') {
      category = 'accessories';
      arabicCategory = 'إكسسوارات';
    } else if (shorthandLetter === 'ص') {
      category = 'maintenance';
      arabicCategory = 'صيانة وقطع غيار';
    } else if (shorthandLetter === 'ش') {
      category = 'sims';
      arabicCategory = 'شرايح';
    } else if (shorthandLetter === 'ر') {
      category = 'balance';
      arabicCategory = 'رصيد';
    } else if (shorthandLetter === 'م') {
      category = 'accessories';
      arabicCategory = 'بضاعة سابقة بالمخزن';
    }

    let itemName = rest;
    let unitCost = 0;
    let quantity = 1;

    const explicitQtyMatch = rest.match(/(?:عدد|كمية|حبات|حبه|حبة|قطع|قطعة)\s*(\d+)/i);
    const explicitPriceMatch = rest.match(/(?:سعر|تكلفة|بقيمة|بـ|ب)\s*(\d+)/i);

    if (explicitQtyMatch || explicitPriceMatch) {
      if (explicitQtyMatch) quantity = parseInt(explicitQtyMatch[1], 10) || 1;
      if (explicitPriceMatch) unitCost = parseFloat(explicitPriceMatch[1]) || 0;

      itemName = rest
        .replace(/(?:عدد|كمية|حبات|حبه|حبة|قطع|قطعة)\s*\d+/gi, '')
        .replace(/(?:سعر|تكلفة|بقيمة|بـ|ب)\s*\d+/gi, '')
        .trim();
    } else {
      const trailingNumbers = rest.match(/^(.*?)\s+(\d+)(?:\s+(\d+))?\s*$/);
      if (trailingNumbers) {
        itemName = trailingNumbers[1].trim();
        if (trailingNumbers[3]) {
          unitCost = parseFloat(trailingNumbers[2]);
          quantity = parseInt(trailingNumbers[3], 10) || 1;
        } else {
          unitCost = parseFloat(trailingNumbers[2]);
          quantity = 1;
        }
      }
    }

    if (unitCost > 0 || itemName.length >= 2) {
      itemName = itemName.replace(/^(?:مشتريات|شراء|م|بضاعة)\s*/gi, '').trim();
      if (!itemName) {
        itemName = `صنف ${arabicCategory} جديد`;
      }

      const autoBarcode = generateAutoBarcode();

      let suggestedSellingPrice = unitCost;
      if (category === 'accessories') {
        suggestedSellingPrice = Math.round(unitCost * 1.4);
      } else if (category === 'phones') {
        suggestedSellingPrice = unitCost + (unitCost >= 50000 ? 5000 : 3000);
      } else if (category === 'maintenance') {
        suggestedSellingPrice = Math.round(unitCost * 1.5);
      } else if (category === 'sims') {
        suggestedSellingPrice = unitCost + 300;
      } else if (category === 'balance') {
        suggestedSellingPrice = Math.round(unitCost * 1.02);
      } else {
        suggestedSellingPrice = Math.round(unitCost * 1.35);
      }

      const totalCost = unitCost * quantity;
      const totalExpectedProfit = Math.max(0, (suggestedSellingPrice - unitCost) * quantity);

      return {
        date: targetDate,
        type: 'purchase',
        category,
        description: `بضاعة/مشتريات [${arabicCategory}]: ${itemName} (عدد ${quantity})`,
        price: totalCost,
        cost: totalCost,
        profit: totalExpectedProfit,
        time: currentTime,
        isInventoryEntry: true,
        barcode: autoBarcode,
        quantity,
        costPrice: unitCost,
        sellingPrice: suggestedSellingPrice,
        shorthandCode: shorthandLetter,
        supplierName: activeSupplier || (isMCode ? 'بضاعة سابقة للمحل' : undefined),
        notes: `كود الاختصار (${shorthandLetter} = ${arabicCategory}) | تكلفة القطعة: ${unitCost.toLocaleString()} ر.ي | سعر البيع: ${suggestedSellingPrice.toLocaleString()} ر.ي | الكمية: ${quantity} | باركود: ${autoBarcode}`,
      };
    }
  }

  // ================= 1. البحث في الجوالات عند قول "واصل باقي جوال كذا" أو "باقي جوال كذا" =================
  // مثال: "واصل باقي جوال نوت 9" أو "واصل باقي جوال ردمي 12" أو "واصل باقي جوال عمار" أو "واصل باقي جوال 5000"
  const pickupDevicePattern = /(?:واصل|استلام|تسليم|سداد|سدد)?\s*(?:من)?\s*باقي\s*(?:صيانة|حساب|سعر|قيمة)?\s*(?:جوال|تلفون|هاتف|جهاز)\s*(.*)$/i;
  const pickupMatch = line.match(pickupDevicePattern);
  if (pickupMatch) {
    const fullQuery = pickupMatch[1].trim();
    
    // استخراج المبلغ واسم الجهاز بذكاء (التفريق بين رقم الموديل مثل نوت 9 والمبلغ المدفوع)
    let specifiedAmount = 0;
    let cleanDeviceQuery = fullQuery;

    const explicitAmountMatch = fullQuery.match(/(?:بـ|ب|مبلغ|سعر|واصل|دفع)\s*(\d+)/i);
    if (explicitAmountMatch) {
      specifiedAmount = parseFloat(explicitAmountMatch[1]);
      cleanDeviceQuery = fullQuery.replace(explicitAmountMatch[0], '').trim();
    } else {
      const allNumbers = Array.from(fullQuery.matchAll(/\b\d+\b/g));
      if (allNumbers.length >= 2) {
        // إذا كان هناك أكثر من رقم مثل "نوت 9 5000"، فالرقم الأخير هو المبلغ
        const lastNumMatch = allNumbers[allNumbers.length - 1];
        specifiedAmount = parseFloat(lastNumMatch[0]);
        cleanDeviceQuery = fullQuery.substring(0, lastNumMatch.index).trim();
      } else if (allNumbers.length === 1) {
        const singleNumMatch = allNumbers[0];
        const numVal = parseFloat(singleNumMatch[0]);
        const textBeforeNum = fullQuery.substring(0, singleNumMatch.index).trim().toLowerCase();

        // هل الرقم هو موديل هاتف (مثل نوت 9، ردمي 12، ايفون 11) أم مبلغ سداد
        const isModelIndicator =
          /(?:نوت|ردمي|ايفون|سامسونج|برو|بلس|هواوي|شاومي|تكنو|انفينكس|a|s|note|iphone|pro|plus)\s*$/i.test(textBeforeNum) ||
          numVal <= 30;

        if (isModelIndicator) {
          cleanDeviceQuery = fullQuery.trim();
          specifiedAmount = 0; // سيتم سحب المتبقي المسجل سابقاً للجوال
        } else {
          cleanDeviceQuery = textBeforeNum;
          specifiedAmount = numVal;
        }
      }
    }
    cleanDeviceQuery = cleanDeviceQuery.toLowerCase().replace(/(?:بـ|ب|سعر|مبلغ)\s*$/i, '').trim();

    // البحث الذكي في سجلات المعاملات السابقة (المبيعات، الصيانة، الديون)
    let matchedTx: Transaction | undefined;
    if (cleanDeviceQuery && cleanDeviceQuery.length >= 2) {
      // الأولوية للمعاملات التي عليها متبقي في الذمة
      matchedTx = existingTransactions.find((tx) => {
        const matchScope = `${tx.description} ${tx.customerName || ''} ${tx.notes || ''} ${tx.deviceModel || ''}`.toLowerCase();
        return matchScope.includes(cleanDeviceQuery) && ((tx.remainingAmount || 0) > 0);
      });

      // إذا لم يجد مع متبقي، يبحث في أي حركة متعلقة بالجوال
      if (!matchedTx) {
        matchedTx = existingTransactions.find((tx) => {
          const matchScope = `${tx.description} ${tx.customerName || ''} ${tx.notes || ''} ${tx.deviceModel || ''}`.toLowerCase();
          return matchScope.includes(cleanDeviceQuery);
        });
      }
    }

    // البحث أيضاً في مخزن الجوالات
    let matchedInventoryPhone: InventoryItem | undefined;
    if (!matchedTx && cleanDeviceQuery && inventory && inventory.length > 0) {
      matchedInventoryPhone = inventory.find((it) => {
        const scope = `${it.name} ${it.notes || ''} ${it.barcode || ''}`.toLowerCase();
        return scope.includes(cleanDeviceQuery) && (it.category === 'phones' || it.category === 'جوالات مستعملة/جديدة' || it.category === 'spare_parts' || it.category === 'قطع غيار');
      });
    }

    if (matchedTx) {
      const prevRemaining = matchedTx.remainingAmount || matchedTx.price || 0;
      const collected = specifiedAmount > 0 ? specifiedAmount : prevRemaining;
      const newRemaining = Math.max(0, prevRemaining - collected);
      const estProfit = Math.round(collected * 0.5); // صيانة مناصفة 50%

      return {
        date: targetDate,
        type: 'maintenance',
        category: 'maintenance',
        description: `استلام باقي جوال ${matchedTx.description || cleanDeviceQuery}`,
        price: collected,
        cost: Math.max(0, collected - estProfit),
        profit: estProfit,
        customerName: matchedTx.customerName || undefined,
        remainingAmount: newRemaining,
        time: currentTime,
        notes: `مطابقة ذكية من سجلات الجوالات: تم العثور على (${matchedTx.description || cleanDeviceQuery}) للعميل (${matchedTx.customerName || 'عميل'}) مسجل سابقاً | المتبقي السابق: ${prevRemaining.toLocaleString()} ر.ي | المسدد: ${collected.toLocaleString()} ر.ي ${newRemaining > 0 ? `| الباقي الجديد: ${newRemaining.toLocaleString()} ر.ي` : '| تم الخلوص بالكامل'}`,
      };
    } else if (matchedInventoryPhone) {
      const collected = specifiedAmount > 0 ? specifiedAmount : (matchedInventoryPhone.sellingPrice || matchedInventoryPhone.costPrice || 0);
      const profit = Math.max(0, (matchedInventoryPhone.sellingPrice || collected) - (matchedInventoryPhone.costPrice || 0));

      return {
        date: targetDate,
        type: 'sale',
        category: 'phones',
        description: `استلام باقي حساب جوال ${matchedInventoryPhone.name}`,
        price: collected,
        cost: Math.max(0, collected - profit),
        profit,
        time: currentTime,
        notes: `مطابقة ذكية من مخزن الجوالات: (${matchedInventoryPhone.name}) | السعر: ${collected.toLocaleString()} ر.ي`,
      };
    } else {
      // إذا لم يوجد في الديون السابقة، نسجله كحركة استلام باقي جوال جديدة
      const price = specifiedAmount > 0 ? specifiedAmount : 0;
      const profit = Math.round(price * 0.5);
      return {
        date: targetDate,
        type: 'maintenance',
        category: 'maintenance',
        description: `استلام باقي جوال ${cleanDeviceQuery || 'جوال'}`,
        price,
        cost: Math.max(0, price - profit),
        profit,
        time: currentTime,
        notes: `استلام باقي حساب جوال (${cleanDeviceQuery || 'جوال'})`,
      };
    }
  }

  // ================= 2. نمط واصل كذا الباقي كذا ف كذا =================
  // مثال: "واصل 3000 الباقي 2000 ف 1000" أو "واصل 5000 باقي 1000 ف 800" أو "واصل 4000 باقي 2000"
  const waselRemainingPattern = /واصل\s*(?:مبلغ|سعر)?\s*(\d+)\s*(?:ال?باقي|متبقي)\s*(\d+)(?:\s*(?:ف|فـ|فايدة|ربح)\s*(\d+))?/i;
  const waselMatch = line.match(waselRemainingPattern);
  if (waselMatch) {
    const collected = parseFloat(waselMatch[1]);
    const remaining = parseFloat(waselMatch[2]);
    const profit = waselMatch[3] ? parseFloat(waselMatch[3]) : Math.round(collected * 0.3);
    const cost = Math.max(0, collected - profit);

    return {
      date: targetDate,
      type: 'maintenance',
      category: 'maintenance',
      description: `دفعة واصل صيانة / مبيعات (المتبقي: ${remaining.toLocaleString()} ر.ي)`,
      price: collected,
      cost,
      profit,
      remainingAmount: remaining,
      time: currentTime,
      notes: `دفعة واصل اليوم: ${collected.toLocaleString()} ر.ي | الباقي في الذمة: ${remaining.toLocaleString()} ر.ي | الفايدة: ${profit.toLocaleString()} ر.ي`,
    };
  }

  // ================= 3. نمط مبيعات مع حرف "ف" الصريح (حرف ف يعني فايدة) =================
  // مثال 1: "سماعة 500 ف400"
  // مثال 2: "سماعة 500 ف 400"
  // مثال 3: "سماعة بـ 500 ف400"
  // مثال 4: "سماعة 500 بكذا ف 400"
  // مثال 5: "مبيع جوال ردمي نوت 12 بـ 45000 ف 5000"
  // مثال 6: "مبيع جوال كذا بكذا ف كذا"
  // مثال 7: "شاحن 1200 ف 300"
  const faPattern = /(?:ف|فـ|=|فايدة|فائدة|ربح)\s*(\d+)/i;
  const faMatch = line.match(faPattern);
  if (faMatch && !line.includes('واصل') && !line.includes('مياس') && !line.includes('بيت') && !line.includes('مصعب')) {
    const profit = parseFloat(faMatch[1]);
    const textBeforeFa = line.substring(0, faMatch.index).trim();
    const textAfterFa = line.substring((faMatch.index || 0) + faMatch[0].length).trim();

    // استخراج السعر وهو الرقم الأخير قبل كلمة "ف"
    const numbersBeforeFa = textBeforeFa.match(/\d+/g);
    if (numbersBeforeFa && numbersBeforeFa.length > 0) {
      const price = parseFloat(numbersBeforeFa[numbersBeforeFa.length - 1]);
      let actualProfit = profit;
      let actualCost = Math.max(0, price - profit);
      let alertNote = `مبيعات (الفايدة: ${actualProfit.toLocaleString()} ر.ي | التكلفة: ${actualCost.toLocaleString()} ر.ي)`;

      // تصحيح خطأ منطقي بالتسعير إذا كانت الفائدة أكبر من سعر البيع (ف > ب) مثل: 500 تعريب ف5000
      if (profit > price && price > 0) {
        actualProfit = price;
        actualCost = 0;
        alertNote = `⚠️ تم تصحيح الفائدة تلقائياً (${actualProfit.toLocaleString()} ر.ي) لتساوي الإيراد بعد رصد خطأ مدخل (ف > ب) | التكلفة: 0 ر.ي`;
      }

      // استخراج البيان بتنظيف السعر
      const lastNum = numbersBeforeFa[numbersBeforeFa.length - 1];
      const lastNumIdx = textBeforeFa.lastIndexOf(lastNum);
      let descPart = '';
      if (textBeforeFa.trim().indexOf(lastNum) === 0) {
        // الرقم كُتب في البداية (مثل: 1000 تفعيل فورجي، 500 تعريب)
        descPart = textBeforeFa.trim().substring(lastNum.length).trim();
      } else {
        // الرقم كُتب بعد اسم الصنف (مثل: طفاية سيارة 700، وصله lt 3a بيع 750)
        descPart = textBeforeFa.substring(0, lastNumIdx).trim();
      }

      descPart = descPart
        .replace(/^(?:مبيعات|مبيع|بيع)\s*[:،,-]?\s*/i, '')
        .replace(/(?:بـ|ب|سعر|بقيمة|بكذا)\s*$/i, '')
        .trim();

      const isMaintKeywords =
        defaultMode === 'maintenance' ||
        descPart.includes('صيانة') ||
        descPart.includes('تعريب') ||
        descPart.includes('فورجي') ||
        descPart.includes('4g') ||
        descPart.includes('برمجة') ||
        descPart.includes('شاشة') ||
        descPart.includes('شحن') ||
        descPart.includes('ايسي') ||
        descPart.includes('مفتاح') ||
        descPart.includes('تصليح');

      if (!descPart) {
        descPart = isMaintKeywords
          ? 'خدمة صيانة/برمجة'
          : defaultMode === 'phones'
          ? 'مبيع جوال'
          : defaultMode === 'sale'
          ? 'صنف مبيعات'
          : 'مبيعات صنف';
      }

      const isPhone =
        defaultMode === 'phones' ||
        descPart.includes('جوال') ||
        descPart.includes('تلفون') ||
        descPart.includes('هاتف') ||
        descPart.includes('ردمي') ||
        descPart.includes('ايفون') ||
        descPart.includes('سامسونج') ||
        descPart.includes('شاومي') ||
        descPart.includes('نوت');

      const finalCategory = isMaintKeywords ? 'maintenance' : isPhone ? 'phones' : 'accessories';
      const finalType = isMaintKeywords ? 'maintenance' : 'sale';

      return {
        date: targetDate,
        type: finalType,
        category: finalCategory,
        description: descPart,
        price,
        cost: actualCost,
        profit: actualProfit,
        time: currentTime,
        notes: alertNote,
      };
    }
  }

  // ================= 4. سحوبات وصرفة بيت مصعب الصوفي =================
  // مثال: "بيت مصعب 5000" أو "صرفة بيت مصعب 3000" أو "خرج بيت 2500"
  // ومثال: "مصعب 10000" أو "سحب مصعب 10000" أو "مصعب سحب 7000" أو "مصعب 5000"
  if (line.includes('مصعب') || line.includes('بيت')) {
    const numMatch = line.match(/(\d+)/);
    if (numMatch) {
      const amount = parseFloat(numMatch[1]);
      const isHome = line.includes('بيت') || line.includes('صرفة بيت');

      return {
        date: targetDate,
        type: isHome ? 'expense_home_mosaab' : 'withdrawal_mosaab',
        category: 'mosaab',
        description: isHome ? 'صرفة بيت مصعب الصوفي' : 'سحب شخصي لمصعب الصوفي',
        price: amount,
        cost: amount,
        profit: 0,
        time: currentTime,
        notes: isHome ? '⚠️ سحوبات شخصية للمالك (بيت مصعب)' : 'سحب مصعب الشخصي من الدرج',
      };
    }
  }

  // ================= 5. شبكة رصيد الهادي (محمد مياس) =================
  // "مياس هو محمد مياس صاحب تطبيق الهادي حق الرصيد"
  // مثال 1: "حولت لمياس 50000" -> حوالة / تغذية رصيد لمحمد مياس
  // مثال 2: "حولي مياس 50000" -> استلام رصيد
  // مثال 3: "بعت رصيد مياس 5000 ف 200" -> مبيعات رصيد الهادي وفايدة 200
  if (line.includes('مياس') || line.includes('هادي') || line.includes('الهادي')) {
    const numMatch = line.match(/(\d+)/);
    if (numMatch) {
      const amount = parseFloat(numMatch[1]);

      // هل هي حوالة لمياس؟
      if (line.includes('حولت') || line.includes('رسلت') || line.includes('سداد') || line.includes('تغذية')) {
        return {
          date: targetDate,
          type: 'transfer_mohammed_mayas',
          category: 'expenses',
          description: 'حوالة لمحمد مياس (تغذية رصيد تطبيق الهادي)',
          price: amount,
          cost: amount,
          profit: 0,
          supplierName: 'محمد مياس (الهادي)',
          time: currentTime,
          notes: 'حوالة وتغذية رصيد تطبيق الهادي لمحمد مياس',
        };
      }

      // هل مياس حول له رصيد؟
      if (line.includes('حولي') || line.includes('استلمت من مياس') || line.includes('جاء من مياس') || line.includes('وصل من مياس')) {
        return {
          date: targetDate,
          type: 'balance_hadi',
          category: 'balance',
          description: 'تغذية رصيد مستلمة من محمد مياس (الهادي)',
          price: amount,
          cost: amount,
          profit: 0,
          supplierName: 'محمد مياس (الهادي)',
          time: currentTime,
          notes: 'رصيد تم استقباله وتغذيته في تطبيق الهادي',
        };
      }

      // مبيعات رصيد مياس مع فايدة أو بدون: "بعت رصيد مياس 10000 ف 300"
      const faMatchBalance = line.match(/(?:ف|فـ|فايدة|ربح)\s*(\d+)/i);
      const profit = faMatchBalance ? parseFloat(faMatchBalance[1]) : Math.round(amount * 0.02);
      const cost = Math.max(0, amount - profit);

      return {
        date: targetDate,
        type: 'balance_hadi',
        category: 'balance',
        description: 'رصيد شبكة الهادي (محمد مياس)',
        price: amount,
        cost,
        profit,
        supplierName: 'محمد مياس (الهادي)',
        time: currentTime,
        notes: `مبيعات رصيد الهادي (الفايدة: ${profit.toLocaleString()} ر.ي)`,
      };
    }
  }

  // ================= 6. الموردين (خليل الأغبري، القاسمي، فايز أبو علي، العبصري، المصنف) =================
  const supInfo = detectSupplierInText(line);
  if (supInfo) {
    const numMatch = line.match(/(\d+)/);
    if (numMatch) {
      const amount = parseFloat(numMatch[1]);

      // هل هي حوالة؟ "حولت لخليل الاغبري 20000" أو "حولت للقاسمي 50000"
      if (line.includes('حولت') || line.includes('رسلت') || line.includes('سداد') || line.includes('دفعة للتاجر')) {
        return {
          date: targetDate,
          type: supInfo.type,
          category: 'expenses',
          description: `حوالة وسداد للمورد ${supInfo.name}`,
          price: amount,
          cost: amount,
          profit: 0,
          supplierName: supInfo.name,
          time: currentTime,
          notes: `حوالة وسداد حساب للمورد ${supInfo.name}`,
        };
      }

      // هل هي مشتريات؟ "مشتريات خليل 5 كابلات 1000 باقي له 2000"
      if (line.includes('مشتريات') || line.includes('شراء') || line.includes('فاتورة')) {
        const remainingMatch = line.match(/(?:باقي\s*(?:له|لة)?|متبقي)\s*(\d+)/i);
        const remaining = remainingMatch ? parseFloat(remainingMatch[1]) : 0;
        let desc = line
          .replace(/(?:مشتريات|شراء|فاتورة)\s*/gi, '')
          .replace(new RegExp(supInfo.name, 'gi'), '')
          .replace(/(?:باقي\s*(?:له|لة)?|متبقي)\s*\d+/gi, '')
          .replace(numMatch[0], '')
          .trim();

        if (!desc) desc = `بضاعة من ${supInfo.name}`;

        return {
          date: targetDate,
          type: 'purchase',
          category: 'purchases',
          description: `مشتريات ${desc}`,
          price: amount,
          cost: amount,
          profit: 0,
          remainingAmount: remaining,
          supplierName: supInfo.name,
          time: currentTime,
          notes: `مشتريات من ${supInfo.name} | باقي له: ${remaining.toLocaleString()} ر.ي`,
        };
      }
    }
  }

  // ================= 6.B مشتريات صنف عند وجود مورد نشط أو وضع المشتريات =================
  if (defaultMode === 'purchase' || activeSupplier) {
    if (!line.includes('حولت') && !line.includes('رسلت') && !line.includes('صرفة') && !line.includes('بيت') && !line.includes('واصل')) {
      const remainingMatch = line.match(/(?:باقي\s*(?:له|لة)?|متبقي)\s*(\d+)/i);
      const remaining = remainingMatch ? parseFloat(remainingMatch[1]) : undefined;
      const cleanLine = line.replace(/(?:باقي\s*(?:له|لة)?|متبقي)\s*\d+/i, '').replace(/مشتريات/i, '').trim();

      const numMatch = cleanLine.match(/(\d+)/);
      if (numMatch) {
        const amount = parseFloat(numMatch[1]);
        const desc = cleanLine.replace(numMatch[0], '').replace(/(?:بـ|ب|سعر|بقيمة)\s*$/i, '').trim() || 'صنف مشتريات';
        return {
          date: targetDate,
          type: 'purchase',
          category: 'purchases',
          description: desc,
          price: amount,
          cost: amount,
          profit: 0,
          remainingAmount: remaining,
          supplierName: activeSupplier || undefined,
          time: currentTime,
          notes: `مشتريات ${activeSupplier ? 'من ' + activeSupplier : ''}${remaining ? ` | باقي له: ${remaining.toLocaleString()} ر.ي` : ''}`,
        };
      }
    }
  }

  // ================= 7. صرفة ومصاريف المحل =================
  // مثال: "صرفة 2000" أو "صرفة غداء 1500" أو "خرج محل 2500" أو "صرفة قات 3000"
  if (line.includes('صرفة') || line.includes('خرج') || line.includes('غداء') || line.includes('عشاء') || line.includes('مودم')) {
    const numMatch = line.match(/(\d+)/);
    if (numMatch) {
      const amount = parseFloat(numMatch[1]);
      let desc = line.replace(/\d+/g, '').replace(/(?:صرفة|خرج|محل)\s*/g, '').trim();
      if (!desc) desc = 'مصاريف وصرفة المحل';
      else desc = `صرفة ${desc}`;

      let notes = 'صرفة ومصاريف يومية للمحل';
      if (amount > 5000) {
        notes += ` | ⚠️ تنبيه تدقيق: خرج كبير يتجاوز 5000 ر.ي (${amount.toLocaleString()} ر.ي)`;
      }

      return {
        date: targetDate,
        type: line.includes('مودم') ? 'expense_modem' : 'expense_shop',
        category: 'expenses',
        description: desc,
        price: amount,
        cost: amount,
        profit: 0,
        time: currentTime,
        notes,
      };
    }
  }

  // ================= 8. نمط ديون وباقي مؤجل: "باقي 2000" أو "باقي على احمد 3000" =================
  const debtMatch = line.match(/^(?:باقي|متبقي|دين|آجل|اجل)\s*(?:على|عند|مع)?\s*(.*?)\s*(\d+)$/i);
  if (debtMatch) {
    const cust = debtMatch[1].trim();
    const amount = parseFloat(debtMatch[2]);
    return {
      date: targetDate,
      type: 'maintenance',
      category: 'maintenance',
      description: cust ? `باقي في الذمة على ${cust}` : 'باقي في الذمة / دين مؤجل',
      price: 0,
      cost: 0,
      profit: 0,
      remainingAmount: amount,
      customerName: cust || undefined,
      time: currentTime,
      notes: `متبقي آجل في الذمة: ${amount.toLocaleString()} ر.ي`,
    };
  }

  // ================= 9. نمط الصيانة العامة =================
  if (line.includes('صيانة') || line.includes('شاشة') || line.includes('ايسي') || line.includes('مدخل') || line.includes('تصليح')) {
    const maintCostPattern = /(?:صيانة|تصليح)?\s*(.*?)\s*(?:بـ?|مبلغ|سعر)?\s*(\d+)\s*(?:تكلفة|قطعة|قطع|قطعه|تكلفه)\s*(\d+)/i;
    const maintMatch = line.match(maintCostPattern);
    if (maintMatch) {
      const desc = maintMatch[1].trim() || 'صيانة جوال';
      const price = parseFloat(maintMatch[2]);
      const cost = parseFloat(maintMatch[3]);
      const profit = Math.max(0, price - cost);

      return {
        date: targetDate,
        type: 'maintenance',
        category: 'maintenance',
        description: desc.startsWith('صيانة') ? desc : `صيانة ${desc}`,
        price,
        cost,
        profit,
        time: currentTime,
        notes: 'صيانة (أرباح مناصفة 50/50 بين المحل والمهندس)',
      };
    }

    const maintSimple = /(?:صيانة|تصليح)\s*(.*?)\s*(?:بـ?|مبلغ|سعر)?\s*(\d+)/i;
    const mMatch = line.match(maintSimple);
    if (mMatch) {
      const desc = mMatch[1].trim() || 'صيانة';
      const price = parseFloat(mMatch[2]);
      const profit = Math.round(price * 0.5);
      return {
        date: targetDate,
        type: 'maintenance',
        category: 'maintenance',
        description: `صيانة ${desc}`,
        price,
        cost: price - profit,
        profit,
        time: currentTime,
        notes: 'صيانة كاملة (مناصفة 50/50)',
      };
    }
  }

  // ================= 10. نمط بيع بسيط مع رقم واحد فقط: "بيع كفر 1500" أو "شاحن 2000" أو "مبيع جوال ردمي 45000" =================
  // يعرض في الجدول لكتابة الفايدة (ف) مباشرة ثم الحفظ
  const singleItemSale = /^(?:مبيعات|مبيع|بيع)?\s*(.+?)(?:\s*(?:بـ?|سعر|مبلغ|ب|بكذا)?\s*)(\d+)$/i;
  const matchSingle = line.match(singleItemSale);
  if (matchSingle) {
    let desc = matchSingle[1].trim();
    const price = parseFloat(matchSingle[2]);
    if (price > 0 && desc.length > 1) {
      desc = desc.replace(/^(?:مبيعات|مبيع|بيع)\s*/i, '').trim();
      const isPhone =
        desc.includes('جوال') ||
        desc.includes('تلفون') ||
        desc.includes('هاتف') ||
        desc.includes('ردمي') ||
        desc.includes('ايفون') ||
        desc.includes('سامسونج') ||
        desc.includes('شاومي') ||
        desc.includes('نوت');

      // نضع الفايدة 0 أو تقديرية أولية، والجدول يبرز حقل الفايدة ف للمستخدم ليكتبها ثم يحفظ
      const estimatedProfit = isPhone ? Math.min(5000, Math.round(price * 0.1)) : Math.round(price * 0.25);
      const estimatedCost = Math.max(0, price - estimatedProfit);

      return {
        date: targetDate,
        type: 'sale',
        category: isPhone ? 'phones' : 'accessories',
        description: desc || (isPhone ? 'مبيع جوال' : 'صنف مبيعات'),
        price,
        cost: estimatedCost,
        profit: estimatedProfit,
        time: currentTime,
        notes: 'مبيعات (يمكنك تعديل الفايدة ف في الجدول ثم الحفظ)',
      };
    }
  }

  return null;
}

/**
 * واجهة عناصر فواتير مشتريات الموردين وقطع الغيار
 */
export interface ParsedSupplierInvoiceItem {
  name: string;
  costPrice: number; // ش: سعر الشراء / التكلفة
  sellingPrice: number; // ب: سعر البيع للزبون في المحل
  expectedProfit: number; // ف: الربح المتوقع = ب - ش
  rawText: string;
  isReturn?: boolean; // هل هو مرتجع للمورد (م)
}

/**
 * فاتورة مشتريات المورد المعتمدة
 */
export interface ParsedSupplierInvoice {
  supplierCode: string; // م، خ، ق، ع
  supplierName: string; // المصنف، خليل الأغبري، عمر القاسمي، العبصري
  supplierType: any;
  items: ParsedSupplierInvoiceItem[];
  totalInvoiceCost: number; // إجمالي الفاتورة (مجموع ش للقطع المشتراة)
  totalReturnsCost: number; // إجمالي المرتجعات للمورد (م)
  netInvoiceCost: number; // صافي الفاتورة = totalInvoiceCost - totalReturnsCost
  totalSellingValue: number; // إجمالي البيع المتوقع (مجموع ب)
  totalExpectedProfit: number; // إجمالي الربح المتوقع (مجموع ف)
  transferredAmount: number; // المسدد / المحول للتاجر (ح)
  remainingAmount: number; // باقي له لو باقي = netInvoiceCost - transferredAmount
  status: 'fully_paid' | 'partially_paid' | 'unpaid' | 'overpaid' | 'refund_due';
}

/**
 * عهدة ومشتريات مصعب الصوفي (ص)
 */
export interface ParsedCustodyItem {
  amount: number; // ص: المبلغ المسلم عهدة
  recipient: string; // مصعب الصوفي
  purpose: string; // مسلم عهدة مقابل يدي بضاعة أو يحولها لتاجر حق المودمات أو مشتريات
  rawText: string;
}

/**
 * واجهة بيانات الإدخال اليومي المقسم للأقسام
 */
export interface StructuredDailyInput {
  accessoriesText: string;
  maintenanceText: string;
  phonesText: string;
  balanceText: string;
  expensesText: string;
  purchasesText: string; // 6. قسم المشتريات وقطع الغيار والموردين (م، خ، ق، ع) وعهدة مصعب (ص)
}

export interface StructuredDailyResult {
  date: string;
  items: ParsedTransactionItem[];
  totals: {
    revenue: number;
    profit: number;
    cost: number;
    expenses: number;
    mosaabWithdrawals: number;
    purchasesTotal: number; // إجمالي المشتريات (ش)
    purchasesReturnsTotal: number; // إجمالي المرتجعات للموردين (م)
    netPurchasesTotal: number; // صافي المشتريات بعد خصم المرتجع
    transferredToSuppliers: number; // المحول للتجار (ح)
    remainingSupplierDebts: number; // باقي للموردين في الذمة
    mosaabCustodyTotal: number; // عهدة مصعب الصوفي (ص)
    netCash: number;
  };
  breakdown: {
    accessoriesCount: number;
    accessoriesSales: number;
    accessoriesProfit: number;
    maintenanceCount: number;
    maintenanceSales: number;
    maintenanceProfit: number;
    phonesCount: number;
    phonesSales: number;
    phonesProfit: number;
    balanceCount: number;
    balanceSales: number;
    balanceProfit: number;
    expensesCount: number;
    expensesTotal: number;
    purchasesCount: number;
    purchasesTotal: number;
    supplierPaymentsCount: number;
    supplierPaymentsTotal: number;
  };
  supplierInvoices: ParsedSupplierInvoice[];
  custodyItems: ParsedCustodyItem[];
  auditAlerts: string[];
  summary: string;
}

/**
 * تحليل ومعالجة قسم المشتريات وقطع الغيار والموردين وعهدة مصعب الصوفي:
 * م = المصنف | خ = خليل الأغبري | ق = عمر القاسمي | ع = العبصري
 * ش = شراء (التكلفة) | ب = بيع (سعر البيع المقترح)
 * ح = حولت للتاجر من قيمة الفاتورة | ص = مصعب الصوفي مسلم عهدة
 * حساب المتبقي تلقائياً (باقي له لو باقي): إجمالي الفاتورة (مجموع ش) - المحول (ح)
 */
export function parsePurchasesSection(
  rawText: string,
  targetDate: string,
  currentTime: string
): {
  items: ParsedTransactionItem[];
  supplierInvoices: ParsedSupplierInvoice[];
  custodyItems: ParsedCustodyItem[];
  totals: {
    totalPurchasesCost: number;
    totalReturnsCost: number;
    netPurchasesCost: number;
    totalTransferred: number;
    totalRemainingDebt: number;
    totalCustody: number;
  };
  auditAlerts: string[];
} {
  const items: ParsedTransactionItem[] = [];
  const supplierInvoices: ParsedSupplierInvoice[] = [];
  const custodyItems: ParsedCustodyItem[] = [];
  const auditAlerts: string[] = [];

  if (!rawText || !rawText.trim()) {
    return {
      items,
      supplierInvoices,
      custodyItems,
      totals: {
        totalPurchasesCost: 0,
        totalReturnsCost: 0,
        netPurchasesCost: 0,
        totalTransferred: 0,
        totalRemainingDebt: 0,
        totalCustody: 0,
      },
      auditAlerts,
    };
  }

  const clean = normalizeDigits(rawText.trim());
  const lines = clean.split('\n');

  let currentSupplier: { code: string; name: string; type: any; fullName: string; isReturn?: boolean } | null = null;
  let currentInvoiceItems: ParsedSupplierInvoiceItem[] = [];
  let currentSupplierTransferred = 0;

  const finalizeCurrentSupplier = () => {
    if (!currentSupplier) return;

    const totalCost = currentInvoiceItems
      .filter((it) => !it.isReturn)
      .reduce((acc, it) => acc + it.costPrice, 0);
    const totalReturns = currentInvoiceItems
      .filter((it) => it.isReturn)
      .reduce((acc, it) => acc + it.costPrice, 0);
    const netCost = Math.max(0, totalCost - totalReturns);
    const totalSale = currentInvoiceItems.reduce((acc, it) => acc + it.sellingPrice, 0);
    const totalExpectedProfit = currentInvoiceItems.reduce((acc, it) => acc + it.expectedProfit, 0);
    const remainingDebt = netCost - currentSupplierTransferred;
    const remainingOwed = Math.max(0, remainingDebt);

    const status: 'fully_paid' | 'partially_paid' | 'unpaid' | 'overpaid' | 'refund_due' =
      totalCost === 0 && totalReturns === 0 && currentSupplierTransferred === 0
        ? 'unpaid'
        : remainingDebt < 0
        ? (totalReturns > 0 ? 'refund_due' : 'overpaid')
        : remainingDebt === 0 && (totalCost > 0 || totalReturns > 0 || currentSupplierTransferred > 0)
        ? 'fully_paid'
        : currentSupplierTransferred > 0
        ? 'partially_paid'
        : 'unpaid';

    supplierInvoices.push({
      supplierCode: currentSupplier.code,
      supplierName: currentSupplier.name,
      supplierType: currentSupplier.type,
      items: [...currentInvoiceItems],
      totalInvoiceCost: totalCost,
      totalReturnsCost: totalReturns,
      netInvoiceCost: netCost,
      totalSellingValue: totalSale,
      totalExpectedProfit,
      transferredAmount: currentSupplierTransferred,
      remainingAmount: remainingOwed,
      status,
    });

    // إذا تم تحويل مبلغ للتاجر (ح > 0)، نسجل قيد سداد/حوالة
    if (currentSupplierTransferred > 0) {
      items.push({
        date: targetDate,
        type: currentSupplier.type || 'transfer_to_supplier',
        category: 'expenses',
        description: `حوالة/سداد للتاجر (${currentSupplier.name}) من قيمة فاتورة المشتريات`,
        price: currentSupplierTransferred,
        cost: currentSupplierTransferred,
        profit: 0,
        supplierName: currentSupplier.name,
        remainingAmount: remainingOwed > 0 ? remainingOwed : 0,
        time: currentTime,
        notes: `سداد من قيمة الفاتورة (${totalCost.toLocaleString()} ر.ي)${
          totalReturns > 0 ? ` | المرتجع (م): ${totalReturns.toLocaleString()} ر.ي | الصافي: ${netCost.toLocaleString()} ر.ي` : ''
        } | المسدد (ح): ${currentSupplierTransferred.toLocaleString()} ر.ي | ${
          remainingOwed > 0 ? `المتبقي في الذمة للتاجر: ${remainingOwed.toLocaleString()} ر.ي` : 'تم الخلوص بالكامل'
        }`,
      });
    }

    if (totalReturns > 0) {
      auditAlerts.push(
        `🔄 مورد (${currentSupplier.name}): تم قيد مرتجعات (م) بقيمة ${totalReturns.toLocaleString()} ر.ي | مشتريات: ${totalCost.toLocaleString()} ر.ي | صافي الفاتورة: ${netCost.toLocaleString()} ر.ي | المسدد (ح): ${currentSupplierTransferred.toLocaleString()} ر.ي | باقي له: ${remainingOwed.toLocaleString()} ر.ي`
      );
    } else if (remainingOwed > 0) {
      auditAlerts.push(
        `📌 مورد (${currentSupplier.name}): إجمالي فاتورة القطع ${totalCost.toLocaleString()} ر.ي | المسدد له (ح): ${currentSupplierTransferred.toLocaleString()} ر.ي | باقي له في الذمة: ${remainingOwed.toLocaleString()} ر.ي`
      );
    } else if (totalCost > 0 && currentSupplierTransferred >= totalCost) {
      auditAlerts.push(
        `✅ مورد (${currentSupplier.name}): تم سداد الفاتورة (${totalCost.toLocaleString()} ر.ي) بالكامل وخالص حسابه.`
      );
    }
  };

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // تجاهل العناوين العامة
    if (/^(?:مشتريات|المشتريات|قطع\s*الغيار|قطع\s*غيار|فواتير\s*الموردين|موردين|فواتير|بضاعة)\s*[:،,-]?$/i.test(line)) {
      continue;
    }

    // 1. فحص سطر عهدة مصعب الصوفي (ص)
    const custodyMatch = line.match(/^(?:ص|عهدة\s*مصعب|مصعب\s*عهدة|مسلم\s*عهدة|عهدة)\s*[:=\-]?\s*(\d+)?$/i);
    if (custodyMatch) {
      const amount = custodyMatch[1] ? parseInt(custodyMatch[1], 10) : 0;
      custodyItems.push({
        amount,
        recipient: 'مصعب الصوفي',
        purpose: 'مسلم عهدة مقابل يدي بضاعة أو يحولها لتاجر حق المودمات أو مشتريات',
        rawText: line,
      });

      if (amount > 0) {
        items.push({
          date: targetDate,
          type: 'mosaab_purchases_fund',
          category: 'expenses',
          description: 'عهدة مسلمة لمصعب الصوفي (بضاعة / تحويل لتاجر / مودمات)',
          price: amount,
          cost: amount,
          profit: 0,
          time: currentTime,
          notes: 'مسلم عهدة مقابل يدي بضاعة أو يحولها لتاجر حق المودمات أو مشتريات',
        });
        auditAlerts.push(
          `💵 عهدة نقدية: تم تسليم مصعب الصوفي عهدة بمبلغ (${amount.toLocaleString()} ر.ي) لشراء بضاعة أو تحويلها لتاجر.`
        );
      }
      continue;
    }

    // 2. فحص سطر التحويل للتاجر (ح)
    const transferMatch = line.match(/^(?:ح|حولت|سددت|دفعت|حولت\s*للتاجر|سداد\s*التاجر)\s*[:=\-]?\s*(\d+)?$/i);
    if (transferMatch) {
      const paid = transferMatch[1] ? parseInt(transferMatch[1], 10) : 0;
      currentSupplierTransferred += paid;
      continue;
    }

    // 3. فحص سطر المورد (م، خ، ق، ع، أو ق م، خ م، أو اسم المورد)
    const detectedSupplier = detectSupplierHeader(line);
    if (detectedSupplier) {
      finalizeCurrentSupplier();
      currentSupplier = detectedSupplier;
      currentInvoiceItems = [];
      currentSupplierTransferred = 0;
      continue;
    }

    // فحص تحويل النمط لمرتجع للمورد المفتوح حالياً
    if (currentSupplier && /^(?:مرتجع|رجيع|المرتجع|مردودات)$/i.test(line)) {
      currentSupplier = { ...currentSupplier, isReturn: true };
      continue;
    }

    // 4. فحص سطور الأصناف وقطع الغيار (عادية أو مرتجعة)
    let itemMatched = false;
    let name = '';
    let cost = 0;
    let sale = 0;

    // هل السطر يتضمن مؤشر مرتجع (م / مرتجع / رجيع أو كان المورد الحالي في وضع المرتجع ق م)؟
    const lineHasReturn =
      Boolean(currentSupplier?.isReturn) ||
      /\b(?:مرتجع|رجيع|مردود)\b/i.test(line) ||
      /(?:\s+م\s*$|^م\s+|\s+م\s+)/i.test(line);

    // تنظيف مؤشرات المرتجع من النص لاستخراج الأرقام وقيم ش و ب بدقة
    let cleanItemLine = line
      .replace(/\b(?:مرتجع|رجيع|مردود)\b/gi, '')
      .replace(/(?:\s+م\s*$|^م\s+|\s+م\s+)/gi, ' ')
      .trim();

    // نموذج 1: شاشة a02 ش3500 ب5500
    const shBaMatch = cleanItemLine.match(/^(.*?)\s*ش\s*(\d+)\s*ب\s*(\d+)\s*$/i);
    if (shBaMatch) {
      name = shBaMatch[1].trim() || 'قطع غيار صيانة';
      cost = parseInt(shBaMatch[2], 10);
      sale = parseInt(shBaMatch[3], 10);
      itemMatched = true;
    } else {
      // نموذج 2: شاشة a02 ب5500 ش3500
      const baShMatch = cleanItemLine.match(/^(.*?)\s*ب\s*(\d+)\s*ش\s*(\d+)\s*$/i);
      if (baShMatch) {
        name = baShMatch[1].trim() || 'قطع غيار صيانة';
        sale = parseInt(baShMatch[2], 10);
        cost = parseInt(baShMatch[3], 10);
        itemMatched = true;
      } else {
        // نموذج 3: فلاتة شحن ش 1200 أو شاشة ش5000 (مثال المرتجع ق م: شاشة ش5000)
        const onlyShMatch = cleanItemLine.match(/^(.*?)\s*ش\s*(\d+)\s*$/i);
        if (onlyShMatch) {
          name = onlyShMatch[1].trim() || 'قطع غيار صيانة';
          cost = parseInt(onlyShMatch[2], 10);
          sale = lineHasReturn ? 0 : Math.round(cost * 1.5);
          itemMatched = true;
        } else {
          // نموذج 4: شاشة 3500 ب 5500
          const numBaMatch = cleanItemLine.match(/^(.*?)\s+(\d+)\s*ب\s*(\d+)\s*$/i);
          if (numBaMatch) {
            name = numBaMatch[1].trim() || 'قطع غيار صيانة';
            cost = parseInt(numBaMatch[2], 10);
            sale = parseInt(numBaMatch[3], 10);
            itemMatched = true;
          } else {
            // نموذج 5: سطر يحتوي على ش٠ب٠ أو ش0 ب0 (مسودة فارغة)
            const zeroMatch = cleanItemLine.match(/^(.*?)\s*(?:ش\s*0\s*ب\s*0|ب\s*0\s*ش\s*0|ش0\s*ب0|ش\s*0)\s*$/i);
            if (zeroMatch) {
              name = zeroMatch[1].trim() || 'صنف مسودة';
              cost = 0;
              sale = 0;
              itemMatched = true;
            } else if (lineHasReturn) {
              // نموذج 6: في سياق المرتجع ق م، اسم الصنف ومبلغ مباشر مثل "شاشة 5000"
              const simpleNumMatch = cleanItemLine.match(/^(.*?)\s+(\d+)\s*$/i);
              if (simpleNumMatch) {
                name = simpleNumMatch[1].trim() || 'قطع غيار مرتجعة';
                cost = parseInt(simpleNumMatch[2], 10);
                sale = 0;
                itemMatched = true;
              }
            }
          }
        }
      }
    }

    if (itemMatched) {
      const supName = currentSupplier?.name || 'مورد قطع غيار';
      const expectedProfit = lineHasReturn ? 0 : Math.max(0, sale - cost);

      currentInvoiceItems.push({
        name,
        costPrice: cost,
        sellingPrice: sale,
        expectedProfit,
        rawText: line,
        isReturn: lineHasReturn,
      });

      // إذا كانت التكلفة أكبر من 0 نسجل القيد المناسب
      if (cost > 0) {
        if (lineHasReturn) {
          const returnType = SUPPLIER_RETURN_TYPE_MAP[currentSupplier?.code || ''] || 'return_to_supplier_musannaf';
          items.push({
            date: targetDate,
            type: returnType as any,
            category: 'maintenance',
            description: `مرتجع للمورد [${name}] إلى (${supName})`,
            price: cost,
            cost: cost,
            profit: 0,
            costPrice: cost,
            sellingPrice: sale,
            supplierName: supName,
            time: currentTime,
            isInventoryEntry: false,
            notes: `مرتجع قطع صيانة للمورد (${supName}) | القيمة: ${cost.toLocaleString()} ر.ي تخصم من حساب الفاتورة`,
          });
          auditAlerts.push(
            `🔄 مرتجع مورد (${supName}): قيد مرتجع [${name}] بقيمة (${cost.toLocaleString()} ر.ي) وخصمه من حسابه.`
          );
        } else {
          items.push({
            date: targetDate,
            type: 'purchase',
            category: 'maintenance',
            description: `شراء [${name}] من المورد (${supName})`,
            price: cost,
            cost: cost,
            profit: expectedProfit,
            costPrice: cost,
            sellingPrice: sale,
            supplierName: supName,
            time: currentTime,
            isInventoryEntry: true,
            notes: `مشتريات من ${supName} | ش: ${cost.toLocaleString()} | ب: ${sale.toLocaleString()} | ربح متوقع: ${expectedProfit.toLocaleString()} ر.ي`,
          });
        }
      }
    }
  }

  // إغلاق المورد الأخير
  finalizeCurrentSupplier();

  // حساب الإجماليات
  const totalPurchasesCost = supplierInvoices.reduce((acc, inv) => acc + inv.totalInvoiceCost, 0);
  const totalReturnsCost = supplierInvoices.reduce((acc, inv) => acc + inv.totalReturnsCost, 0);
  const netPurchasesCost = Math.max(0, totalPurchasesCost - totalReturnsCost);
  const totalTransferred = supplierInvoices.reduce((acc, inv) => acc + inv.transferredAmount, 0);
  const totalRemainingDebt = supplierInvoices.reduce((acc, inv) => acc + inv.remainingAmount, 0);
  const totalCustody = custodyItems.reduce((acc, c) => acc + c.amount, 0);

  return {
    items,
    supplierInvoices,
    custodyItems,
    totals: {
      totalPurchasesCost,
      totalReturnsCost,
      netPurchasesCost,
      totalTransferred,
      totalRemainingDebt,
      totalCustody,
    },
    auditAlerts,
  };
}

/**
 * معالجة الإدخال اليومي المنظم عبر الأقسام المعتمدة لمحل مصعب الصوفي:
 * 1. مبيعات الإكسسوارات
 * 2. خدمات الصيانة والبرمجة
 * 3. الجوالات
 * 4. الرصيد والتحويلات
 * 5. الخرج والمصروفات
 * 6. المشتريات وقطع الغيار والموردين (م، خ، ق، ع) وعهدة مصعب (ص)
 * وتطبيق كافة قواعد الرموز (ف، ب، ش، خ، ح، ص) والتنظيف التلقائي واستبعاد الحقول الصفرية
 */
export function parseStructuredDailyEntry(
  input: StructuredDailyInput,
  targetDate: string,
  existingTransactions: Transaction[] = [],
  inventory: InventoryItem[] = [],
  suppliers: Supplier[] = []
): StructuredDailyResult {
  const allItems: ParsedTransactionItem[] = [];
  const auditAlerts: string[] = [];
  const currentTime = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });

  const breakdown = {
    accessoriesCount: 0,
    accessoriesSales: 0,
    accessoriesProfit: 0,
    maintenanceCount: 0,
    maintenanceSales: 0,
    maintenanceProfit: 0,
    phonesCount: 0,
    phonesSales: 0,
    phonesProfit: 0,
    balanceCount: 0,
    balanceSales: 0,
    balanceProfit: 0,
    expensesCount: 0,
    expensesTotal: 0,
    purchasesCount: 0,
    purchasesTotal: 0,
    supplierPaymentsCount: 0,
    supplierPaymentsTotal: 0,
  };

  let totalMosaabWithdrawals = 0;

  // دالة مساعدة لتنظيف الأسطر وتجاهل السطور الفارغة أو الصفرية
  const parseSectionLines = (rawSectionText: string, defaultMode: 'sale' | 'maintenance' | 'phones' | 'balance' | 'expenses') => {
    if (!rawSectionText || !rawSectionText.trim()) return;
    const cleanSection = normalizeDigits(rawSectionText.trim());
    const lines = cleanSection.split('\n');

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // تجاهل الحقول الصفرية تماماً (مثل "0" أو "ش 0 ب 0" أو "فايز 0" أو "ديون 0")
      if (
        line === '0' ||
        line === '٠' ||
        /^(?:ش\s*0\s*ب\s*0|ب\s*0\s*ش\s*0|ش0\s*ب0|0\s*ب|0\s*ش)$/i.test(line) ||
        /^(?:[^\d]*)\s*(?:0|٠)\s*$/i.test(line)
      ) {
        continue;
      }

      // معالجة السطر
      const parsed = parseSingleLine(line, targetDate, currentTime, existingTransactions, inventory, defaultMode);
      if (parsed) {
        // تجاهل إذا كانت القيمة الإجمالية والتكلفة والربح جميعها 0
        if (parsed.price === 0 && parsed.cost === 0 && parsed.profit === 0 && !parsed.remainingAmount) {
          continue;
        }

        // ضبط التصنيف والنوع بناءً على القسم لضمان التوافق التام
        if (defaultMode === 'sale') {
          if (parsed.category !== 'phones') {
            parsed.category = 'accessories';
          }
        } else if (defaultMode === 'maintenance') {
          parsed.category = 'maintenance';
          parsed.type = 'maintenance';
        } else if (defaultMode === 'phones') {
          parsed.category = 'phones';
          parsed.type = 'sale';
        } else if (defaultMode === 'expenses') {
          parsed.category = 'expenses';
          if (line.includes('مصعب') || line.includes('بيت مصعب')) {
            parsed.type = 'expense_home_mosaab';
            parsed.description = 'صرفة بيت مصعب الصوفي';
          }
        }

        // تجميع الإحصائيات حسب القسم
        if (parsed.category === 'accessories') {
          breakdown.accessoriesCount++;
          breakdown.accessoriesSales += parsed.price;
          breakdown.accessoriesProfit += parsed.profit;
        } else if (parsed.category === 'maintenance') {
          breakdown.maintenanceCount++;
          breakdown.maintenanceSales += parsed.price;
          breakdown.maintenanceProfit += parsed.profit;
        } else if (parsed.category === 'phones') {
          breakdown.phonesCount++;
          breakdown.phonesSales += parsed.price;
          breakdown.phonesProfit += parsed.profit;
        } else if (parsed.category === 'balance' || parsed.type?.startsWith('balance_') || parsed.type?.startsWith('transfer_')) {
          breakdown.balanceCount++;
          breakdown.balanceSales += parsed.price;
          breakdown.balanceProfit += parsed.profit;
        } else if (parsed.category === 'expenses') {
          breakdown.expensesCount++;
          breakdown.expensesTotal += parsed.price;
          if (parsed.type === 'expense_home_mosaab' || parsed.description.includes('مصعب')) {
            totalMosaabWithdrawals += parsed.price;
          }
        }

        // تنبيهات التدقيق
        if (parsed.category === 'expenses' && parsed.price > 5000) {
          auditAlerts.push(`⚠️ تدقيق نفقات: تم رصد خرج كبير (${parsed.description}: ${parsed.price.toLocaleString()} ر.ي)`);
        }
        if (parsed.notes?.includes('تم تصحيح الفائدة تلقائياً')) {
          auditAlerts.push(`⚠️ تصحيح تسعير: تم تصحيح الفائدة تلقائياً في (${parsed.description}) لتساوي الإيراد`);
        }

        allItems.push(parsed);
      }
    }
  };

  // معالجة الأقسام الخمسة بالترتيب المحاسبي الدقيق
  parseSectionLines(input.accessoriesText, 'sale');
  parseSectionLines(input.maintenanceText, 'maintenance');
  parseSectionLines(input.phonesText, 'phones');
  parseSectionLines(input.balanceText, 'balance');
  parseSectionLines(input.expensesText, 'expenses');

  // معالجة قسم المشتريات وقطع الغيار والموردين (م، خ، ق، ع) وعهدة مصعب (ص)
  const purchasesResult = parsePurchasesSection(input.purchasesText || '', targetDate, currentTime);
  allItems.push(...purchasesResult.items);
  auditAlerts.push(...purchasesResult.auditAlerts);

  breakdown.purchasesCount = purchasesResult.items.filter((i) => i.type === 'purchase').length;
  breakdown.purchasesTotal = purchasesResult.totals.totalPurchasesCost;
  breakdown.supplierPaymentsCount = purchasesResult.items.filter((i) => i.type !== 'purchase' && i.type !== 'mosaab_purchases_fund').length;
  breakdown.supplierPaymentsTotal = purchasesResult.totals.totalTransferred;

  // حساب الإجماليات المالية
  const totalRevenue = breakdown.accessoriesSales + breakdown.maintenanceSales + breakdown.phonesSales + breakdown.balanceSales;
  const totalProfit = breakdown.accessoriesProfit + breakdown.maintenanceProfit + breakdown.phonesProfit + breakdown.balanceProfit;
  const totalExpenses = breakdown.expensesTotal;
  const totalCost = Math.max(0, totalRevenue - totalProfit);
  const netCash = totalRevenue - totalExpenses - purchasesResult.totals.totalTransferred - purchasesResult.totals.totalCustody;

  // صياغة الملخص المالي الاحترافي
  let summary = `📊 **تقرير الحسابات المعتمد ليوم ${targetDate}**\n\n`;
  summary += `• إجمالي الإيرادات والمبيعات: **${totalRevenue.toLocaleString()} ر.ي**\n`;
  summary += `• إجمالي الأرباح الصافية (ف): **${totalProfit.toLocaleString()} ر.ي**\n`;
  summary += `• إجمالي تكلفة البضاعة والخدمات (ش): **${totalCost.toLocaleString()} ر.ي**\n`;
  summary += `• إجمالي المصروفات والخرج (خ): **${totalExpenses.toLocaleString()} ر.ي**\n`;
  if (totalMosaabWithdrawals > 0) {
    summary += `• منها مسحوبات بيت مصعب: **${totalMosaabWithdrawals.toLocaleString()} ر.ي**\n`;
  }
  if (purchasesResult.totals.totalPurchasesCost > 0) {
    summary += `• إجمالي فواتير قطع الغيار والمشتريات: **${purchasesResult.totals.totalPurchasesCost.toLocaleString()} ر.ي**\n`;
  }
  if (purchasesResult.totals.totalTransferred > 0) {
    summary += `• المسدد والمحول للتجار (ح): **${purchasesResult.totals.totalTransferred.toLocaleString()} ر.ي**\n`;
  }
  if (purchasesResult.totals.totalRemainingDebt > 0) {
    summary += `• إجمالي المتبقي للموردين في الذمة: **${purchasesResult.totals.totalRemainingDebt.toLocaleString()} ر.ي**\n`;
  }
  if (purchasesResult.totals.totalCustody > 0) {
    summary += `• عهدة مسلمة لمصعب الصوفي (ص): **${purchasesResult.totals.totalCustody.toLocaleString()} ر.ي**\n`;
  }
  summary += `• صافي حركة النقدية اليومية: **${netCash.toLocaleString()} ر.ي**\n\n`;

  summary += `📦 **توزيع الحركات حسب الأقسام:**\n`;
  if (breakdown.accessoriesCount > 0) {
    summary += `• الإكسسوارات: ${breakdown.accessoriesCount} حركة | مبيعات: ${breakdown.accessoriesSales.toLocaleString()} ر.ي | أرباح: ${breakdown.accessoriesProfit.toLocaleString()} ر.ي\n`;
  }
  if (breakdown.maintenanceCount > 0) {
    summary += `• الصيانة والبرمجة: ${breakdown.maintenanceCount} عملية | إيراد: ${breakdown.maintenanceSales.toLocaleString()} ر.ي | أرباح: ${breakdown.maintenanceProfit.toLocaleString()} ر.ي\n`;
  }
  if (breakdown.phonesCount > 0) {
    summary += `• الجوالات: ${breakdown.phonesCount} حركة | مبيعات: ${breakdown.phonesSales.toLocaleString()} ر.ي | أرباح: ${breakdown.phonesProfit.toLocaleString()} ر.ي\n`;
  }
  if (breakdown.balanceCount > 0) {
    summary += `• الرصيد والتحويلات: ${breakdown.balanceCount} حركة | مبيعات: ${breakdown.balanceSales.toLocaleString()} ر.ي | أرباح: ${breakdown.balanceProfit.toLocaleString()} ر.ي\n`;
  }
  if (breakdown.expensesCount > 0) {
    summary += `• الخرج والمصروفات: ${breakdown.expensesCount} بنود | إجمالي: ${breakdown.expensesTotal.toLocaleString()} ر.ي\n`;
  }

  if (purchasesResult.supplierInvoices.length > 0) {
    summary += `\n🛒 **فواتير المشتريات والموردين:**\n`;
    purchasesResult.supplierInvoices.forEach((inv) => {
      summary += `• ${inv.supplierName} (${inv.supplierCode}): إجمالي الفاتورة ${inv.totalInvoiceCost.toLocaleString()} ر.ي${
        inv.totalReturnsCost > 0 ? ` | المرتجع (م): ${inv.totalReturnsCost.toLocaleString()} ر.ي | الصافي: ${inv.netInvoiceCost.toLocaleString()} ر.ي` : ''
      } | المحول (ح): ${inv.transferredAmount.toLocaleString()} ر.ي | ${
        inv.remainingAmount > 0 ? `باقي له في الذمة: **${inv.remainingAmount.toLocaleString()} ر.ي**` : 'خالص بالكامل ✅'
      }\n`;
    });
  }

  if (auditAlerts.length > 0) {
    summary += `\n🔍 **تنبيهات وملاحظات التدقيق الذكي:**\n` + auditAlerts.map((a) => `• ${a}`).join('\n');
  }

  return {
    date: targetDate,
    items: allItems,
    totals: {
      revenue: totalRevenue,
      profit: totalProfit,
      cost: totalCost,
      expenses: totalExpenses,
      mosaabWithdrawals: totalMosaabWithdrawals,
      purchasesTotal: purchasesResult.totals.totalPurchasesCost,
      purchasesReturnsTotal: purchasesResult.totals.totalReturnsCost,
      netPurchasesTotal: purchasesResult.totals.netPurchasesCost,
      transferredToSuppliers: purchasesResult.totals.totalTransferred,
      remainingSupplierDebts: purchasesResult.totals.totalRemainingDebt,
      mosaabCustodyTotal: purchasesResult.totals.totalCustody,
      netCash,
    },
    breakdown,
    supplierInvoices: purchasesResult.supplierInvoices,
    custodyItems: purchasesResult.custodyItems,
    auditAlerts,
    summary,
  };
}

/**
 * ميزة التوزيع الذكي: تفكيك نص اليومية الكامل وتوزيعه تلقائياً على الأقسام الـ 6
 */
export function distributeRawDayTextToSections(rawText: string): StructuredDailyInput {
  const clean = normalizeDigits(rawText.trim());
  const lines = clean.split('\n');

  const result: StructuredDailyInput = {
    accessoriesText: '',
    maintenanceText: '',
    phonesText: '',
    balanceText: '',
    expensesText: '',
    purchasesText: '',
  };

  let currentSection: keyof StructuredDailyInput = 'accessoriesText';

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // استكشاف وتغيير الأقسام من خلال العناوين
    if (/^(?:مشتريات|المشتريات|قطع\s*الغيار|قطع\s*غيار|فواتير\s*الموردين|موردين|فواتير|بضاعة)\s*[:،,-]?$/i.test(line)) {
      currentSection = 'purchasesText';
      continue;
    }
    if (/^(?:اكسسوارات|إكسسوارات|اكسوارات|قسم الإكسسوارات)\s*[:،,-]?$/i.test(line)) {
      currentSection = 'accessoriesText';
      continue;
    }
    if (/^(?:صيانة|الصيانة|عمل الصيانة|صيانه|برمجة|خدمات الصيانة)\s*[:،,-]?$/i.test(line)) {
      currentSection = 'maintenanceText';
      continue;
    }
    if (/^(?:جوالات|الجوالات|تلفونات|هواتف|مبيعات الجوالات)\s*[:،,-]?$/i.test(line)) {
      currentSection = 'phonesText';
      continue;
    }
    if (/^(?:رصيد|الرصيد|بيع الرصيد|تطبيق الهادي|تحويلات|سداد)\s*[:،,-]?$/i.test(line)) {
      currentSection = 'balanceText';
      continue;
    }
    if (/^(?:خرج|الخرج|مصاريف|المصاريف|مسحوبات|صرفة)\s*[:،,-]?$/i.test(line)) {
      currentSection = 'expensesText';
      continue;
    }

    // فحص اختصارات ورموز قسم المشتريات والموردين
    // ق، خ، ع، م، ش... ب...، ح...، ص...
    if (
      line === 'ق' ||
      line === 'خ' ||
      line === 'ع' ||
      line === 'م' ||
      line.startsWith('ق ') ||
      line.startsWith('خ ') ||
      line.startsWith('ع ') ||
      line.startsWith('م ') ||
      /^(?:ش\s*\d+|ش٠|ش0|ش\s*0\s*ب\s*0)/i.test(line) ||
      /^(?:ح\s*\d+|ح٠|ح0)/i.test(line) ||
      /^(?:ص\s*\d+|ص٠|ص0)/i.test(line) ||
      line.includes('ش٠ب٠') ||
      line.includes('ش0 ب0') ||
      line.includes('ش0ب0') ||
      /ش\s*\d+\s*ب\s*\d+/i.test(line) ||
      line.includes('مسلم عهدة')
    ) {
      currentSection = 'purchasesText';
      result.purchasesText += (result.purchasesText ? '\n' : '') + line;
      continue;
    }

    // إذا كان السطر يحوي كلمات واضحة ترتبط بقسم محدد نضعه فيه مباشرة
    if (line.includes('بيت مصعب') || (line.includes('صرفة') && !line.includes('ف')) || line.includes('خرج')) {
      result.expensesText += (result.expensesText ? '\n' : '') + line;
    } else if (line.includes('الهادي') || line.includes('مياس') || (line.includes('رصيد') && !line.includes('كفر'))) {
      result.balanceText += (result.balanceText ? '\n' : '') + line;
    } else if (
      line.includes('صيانة') ||
      line.includes('تعريب') ||
      line.includes('تفعيل فورجي') ||
      line.includes('بيت شحن') ||
      line.includes('شاشة') ||
      line.includes('ايسي') ||
      line.includes('مفتاح تشغيل')
    ) {
      result.maintenanceText += (result.maintenanceText ? '\n' : '') + line;
    } else if (
      (line.includes('جوال') || line.includes('تلفون') || line.includes('ردمي') || line.includes('ايفون') || line.includes('سامسونج')) &&
      currentSection === 'phonesText'
    ) {
      result.phonesText += (result.phonesText ? '\n' : '') + line;
    } else {
      // إلحاق بالقسم النشط حالياً
      result[currentSection] += (result[currentSection] ? '\n' : '') + line;
    }
  }

  return result;
}

/**
 * دالة استرجاع القيود اليومية المسجلة وتوزيعها على الأقسام الستة
 * (Reverse Mapping: Transactions -> StructuredDailyInput)
 * تجلب بيانات اليوم المحددة وتضع كل بند في قسمه المعتمد بدقة:
 * - الإكسسوارات في قسم الإكسسوارات (مع الفايدة ف)
 * - الصيانة والخدمات في قسم الصيانة (مع الفايدة ف أو الباقي)
 * - الجوالات في قسم الجوالات (مع الفايدة ف)
 * - الرصيد في قسم الرصيد
 * - المصروفات والخرج والبيت في قسم الخرج
 * - الموردين والمشتريات والعهدة (ص) والحوالات (ح) والمرتجع (ق م / م) في قسم المشتريات
 */
export function reverseTransactionsToStructuredSections(
  dayTransactions: Transaction[]
): StructuredDailyInput {
  const result: StructuredDailyInput = {
    accessoriesText: '',
    maintenanceText: '',
    phonesText: '',
    balanceText: '',
    expensesText: '',
    purchasesText: '',
  };

  if (!dayTransactions || dayTransactions.length === 0) {
    return result;
  }

  // 1. مبيعات الإكسسوارات
  const accessoriesTxs = dayTransactions.filter(
    (t) =>
      t.category === 'accessories' &&
      t.type !== 'purchase' &&
      !t.type?.startsWith('return_') &&
      !t.type?.startsWith('transfer_')
  );
  result.accessoriesText = accessoriesTxs
    .map((t) => {
      const desc = t.description.replace(/^مبيع(?:ات)?\s*/i, '').trim() || 'صنف إكسسوار';
      if (t.profit && t.profit > 0) {
        return `${desc} ${t.price} ف ${t.profit}`;
      }
      return `${desc} ${t.price}`;
    })
    .join('\n');

  // 2. خدمات الصيانة والبرمجة
  const maintenanceTxs = dayTransactions.filter(
    (t) =>
      t.category === 'maintenance' &&
      t.type !== 'purchase' &&
      !t.type?.startsWith('return_') &&
      !t.type?.startsWith('transfer_') &&
      !(t as { isInventoryEntry?: boolean }).isInventoryEntry &&
      !t.supplierName
  );
  result.maintenanceText = maintenanceTxs
    .map((t) => {
      const desc = t.description.replace(/^صيانة\s*/i, '').trim() || 'صيانة جوال';
      if (t.price === 0 && t.remainingAmount && t.remainingAmount > 0) {
        return `باقي ${t.customerName ? `على ${t.customerName} ` : ''}${t.remainingAmount}`;
      }
      if (t.profit && t.profit > 0) {
        return `${desc} ${t.price} ف ${t.profit}`;
      }
      return `${desc} ${t.price}`;
    })
    .join('\n');

  // 3. مبيعات الجوالات
  const phonesTxs = dayTransactions.filter(
    (t) =>
      t.category === 'phones' &&
      t.type !== 'purchase' &&
      !t.type?.startsWith('return_') &&
      !t.type?.startsWith('transfer_')
  );
  result.phonesText = phonesTxs
    .map((t) => {
      const desc = t.description.replace(/^مبيع(?:ات)?\s*/i, '').trim() || 'مبيع جوال';
      if (t.profit && t.profit > 0) {
        return `${desc} ${t.price} ف ${t.profit}`;
      }
      return `${desc} ${t.price}`;
    })
    .join('\n');

  // 4. الرصيد والتحويلات
  const balanceTxs = dayTransactions.filter(
    (t) =>
      t.category === 'balance' ||
      t.category === 'sims' ||
      t.type === 'balance_hadi' ||
      t.type === 'balance_qimma' ||
      t.type === 'sim' ||
      t.type === 'transfer_mohammed_mayas' ||
      t.type === 'transfer_faiez_abu_ali'
  );
  result.balanceText = balanceTxs
    .map((t) => {
      const desc = t.description.trim() || 'رصيد';
      if (t.profit && t.profit > 0) {
        return `${desc} ${t.price} ف ${t.profit}`;
      }
      return `${desc} ${t.price}`;
    })
    .join('\n');

  // 5. الخرج والمصروفات (بدون عهدة مصعب وحوالات الموردين)
  const expensesTxs = dayTransactions.filter(
    (t) =>
      t.category === 'expenses' &&
      t.type !== 'mosaab_purchases_fund' &&
      !t.type?.startsWith('transfer_') &&
      !t.supplierName &&
      t.type !== 'transfer_mohammed_mayas' &&
      t.type !== 'transfer_faiez_abu_ali'
  );
  result.expensesText = expensesTxs
    .map((t) => {
      const desc = t.description.trim() || 'مصروف';
      if (desc.includes('بيت مصعب') || desc.includes('صرفة بيت')) {
        return `${t.price} بيت مصعب`;
      }
      if (desc.includes('صرفة للمحل') || desc === 'صرفة') {
        return `${t.price} صرفة للمحل`;
      }
      return `${t.price} ${desc}`;
    })
    .join('\n');

  // 6. قسم المشتريات والموردين والعهدة والمرتجع
  const purchasesLines: string[] = [];

  const supplierPurchases = dayTransactions.filter(
    (t) =>
      t.type === 'purchase' ||
      t.type?.startsWith('return_to_supplier') ||
      (t.category === 'expenses' &&
        t.type?.startsWith('transfer_') &&
        !t.type.includes('mayas') &&
        !t.type.includes('abu_ali')) ||
      (Boolean(t.supplierName) && t.category === 'maintenance')
  );

  const groupedSuppliers: {
    [code: string]: {
      name: string;
      purchases: Transaction[];
      returns: Transaction[];
      transfers: Transaction[];
    };
  } = {};

  const supplierCodes: { [key: string]: string } = {
    'عمر القاسمي': 'ق',
    القاسمي: 'ق',
    قاسم: 'ق',
    'خليل الأغبري': 'خ',
    'خليل الاغبري': 'خ',
    الأغبري: 'خ',
    الاغبري: 'خ',
    خليل: 'خ',
    العبصري: 'ع',
    عبصري: 'ع',
    المصنف: 'م',
    مصنف: 'م',
  };

  supplierPurchases.forEach((t) => {
    let code = 'ق';
    if (t.type === 'transfer_omar_qasimi' || t.type === 'return_to_supplier_qasimi') code = 'ق';
    else if (t.type === 'transfer_khalil_aghbari' || t.type === 'return_to_supplier_aghbari') code = 'خ';
    else if (t.type === 'transfer_musannaf' || t.type === 'return_to_supplier_musannaf') code = 'م';
    else if (t.supplierName && supplierCodes[t.supplierName]) code = supplierCodes[t.supplierName];
    else if (t.description.includes('قاسم')) code = 'ق';
    else if (t.description.includes('خليل') || t.description.includes('اغبري')) code = 'خ';
    else if (t.description.includes('عبصري')) code = 'ع';
    else if (t.description.includes('مصنف')) code = 'م';

    const supName =
      code === 'ق' ? 'عمر القاسمي' : code === 'خ' ? 'خليل الأغبري' : code === 'ع' ? 'العبصري' : 'المصنف';

    if (!groupedSuppliers[code]) {
      groupedSuppliers[code] = {
        name: supName,
        purchases: [],
        returns: [],
        transfers: [],
      };
    }

    if (t.type?.startsWith('return_to_supplier') || t.description.includes('مرتجع')) {
      groupedSuppliers[code].returns.push(t);
    } else if (
      t.type?.startsWith('transfer_') ||
      t.description.includes('حوالة') ||
      t.description.includes('سداد للتاجر')
    ) {
      groupedSuppliers[code].transfers.push(t);
    } else {
      groupedSuppliers[code].purchases.push(t);
    }
  });

  // صياغة بنود الموردين
  Object.keys(groupedSuppliers).forEach((code) => {
    const sup = groupedSuppliers[code];

    if (sup.purchases.length > 0) {
      purchasesLines.push(code);
      sup.purchases.forEach((p) => {
        let cleanName = p.description
          .replace(/^شراء\s*\[/i, '')
          .replace(/\]\s*من\s*المورد.*$/i, '')
          .trim();
        const cost = p.cost || p.price || 0;
        const profit = p.profit || 0;
        const sale = (p as any).sellingPrice || (profit > 0 ? cost + profit : 0);
        if (sale > 0 && sale !== cost) {
          purchasesLines.push(`${cleanName} ش${cost} ب${sale}`);
        } else {
          purchasesLines.push(`${cleanName} ش${cost}`);
        }
      });
    }

    if (sup.returns.length > 0) {
      if (sup.purchases.length === 0) {
        purchasesLines.push(`${code} م`);
        sup.returns.forEach((r) => {
          let cleanName = r.description
            .replace(/^مرتجع\s*(?:للمورد)?\s*\[/i, '')
            .replace(/\]\s*إلى.*$/i, '')
            .trim();
          const cost = r.cost || r.price || 0;
          purchasesLines.push(`${cleanName} ش${cost}`);
        });
      } else {
        sup.returns.forEach((r) => {
          let cleanName = r.description
            .replace(/^مرتجع\s*(?:للمورد)?\s*\[/i, '')
            .replace(/\]\s*إلى.*$/i, '')
            .trim();
          const cost = r.cost || r.price || 0;
          purchasesLines.push(`${cleanName} ش${cost} م`);
        });
      }
    }

    sup.transfers.forEach((tr) => {
      purchasesLines.push(`ح ${tr.price}`);
    });
  });

  // عهدة مصعب الصوفي (ص)
  const custodyTxs = dayTransactions.filter(
    (t) => t.type === 'mosaab_purchases_fund' || t.description.includes('عهدة مسلمة لمصعب')
  );
  custodyTxs.forEach((c) => {
    purchasesLines.push(`ص ${c.price}`);
  });

  result.purchasesText = purchasesLines.join('\n');

  return result;
}

