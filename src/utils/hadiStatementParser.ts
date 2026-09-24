/**
 * Hadi Online PDF & Statement Parser Utility
 * Designed specifically for Al-Hadi Online (الهادي أونلاين - محمد مياس) and Yemeni Telecom Statements.
 * Includes:
 * 1. RTL text reversal handling (fixing reversed Arabic strings from PDF render engines).
 * 2. Multi-page document boundary parsing.
 * 3. Robust Regex for: Date, Description, له (Credit), عليه (Debit), Balance (الرصيد), Phone/Operation ID.
 */

export interface ParsedHadiRow {
  id: string;
  page: number;
  date: string;
  time?: string;
  description: string;
  amount: number;
  type: 'له' | 'عليه';
  debit?: number;   // عليه (خصم)
  credit?: number;  // له (إيداع/تغذية)
  balance: number;  // الرصيد
  phone?: string;
  operationId?: string;
  operator: 'yemen_mobile' | 'sabafon' | 'you' | 'yemen4g' | 'other';
  operatorNameAr: string;
  packageName?: string;
}

/**
 * Normalizes and corrects Arabic text that was reversed (visual RTL encoding issue in PDF text streams)
 */
export function fixArabicRtlReversal(text: string): string {
  if (!text) return '';

  // Check if common known terms appear reversed
  const reversedIndicators = ['ليابوم', 'نوفتلتلا', 'مقر', 'عافدإ', 'سداسي', 'هيدالهلا', 'نيالنوا'];
  const hasReversedTerm = reversedIndicators.some((rev) => text.includes(rev));

  if (!hasReversedTerm) {
    return text;
  }

  // Reverse words or character sequences that are Arabic
  return text
    .split('\n')
    .map((line) => {
      // If line looks heavily reversed, reverse Arabic word sequences
      return line
        .replace(/([\u0600-\u06FF\s]+)/g, (arabicSegment) => {
          // If the segment contains typical reversed words, reverse it
          if (reversedIndicators.some((w) => arabicSegment.includes(w))) {
            return arabicSegment.split('').reverse().join('');
          }
          return arabicSegment;
        })
        .replace(/ليابوم/g, 'موبايل')
        .replace(/نوفتلتلا/g, 'التلفون')
        .replace(/مقر/g, 'رقم')
        .replace(/هيدالهلا/g, 'الهادي')
        .replace(/نيالنوا/g, 'أونلاين')
        .replace(/ديصر/g, 'رصيد')
        .replace(/هقفص/g, 'صفحة');
    })
    .join('\n');
}

/**
 * Parses raw text extracted from single or multi-page Hadi PDF statements
 */
export function parseHadiStatementText(rawText: string): ParsedHadiRow[] {
  if (!rawText || !rawText.trim()) return [];

  const normalized = fixArabicRtlReversal(rawText);
  const rows: ParsedHadiRow[] = [];

  // Detect page breaks or split by page indicators
  const pageSections = normalized.split(/(?:صفحة|Page)\s*[:#\-]?\s*(\d+)/i);
  let currentPage = 1;

  // If text doesn't explicitly have page markers, treat as continuous document
  const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Regex patterns tailored to Hadi Online statement formats
  const dateRegex = /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/;
  const timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/;
  const phoneRegex = /(?:77\d{7}|73\d{7}|71\d{7}|70\d{7}|10\d{6,7})/;
  const opIdRegex = /(?:عملية|مرجع|سند|قيد|رقم|Ref)?[.:\s#]*([0-9]{5,12})/i;
  const numberClean = (str: string) => {
    if (!str) return 0;
    const clean = str.replace(/[^\d.-]/g, '');
    return parseFloat(clean) || 0;
  };

  let bufferDescription = '';
  let pendingDate = '';
  let pendingTime = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for page markers
    const pageMatch = line.match(/(?:صفحة|Page)\s*[:#\-]?\s*(\d+)/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10) || currentPage + 1;
      continue;
    }

    // Check for date in line
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      pendingDate = dateMatch[1];
    }
    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      pendingTime = timeMatch[1];
    }

    // Determine if this line represents an operation row
    const isCredit = line.includes('لكم') || line.includes('له') || line.includes('إيداع') || line.includes('تغذية') || line.includes('تحويل مبلغ وقدره');
    const isDebit = line.includes('عليكم') || line.includes('عليه') || line.includes('تسديد') || line.includes('خصم') || line.includes('شحن');

    if (isCredit || isDebit) {
      // Extract amounts
      // Often format: [Amount] ... [Balance]
      const numbersInLine = line.match(/[-+]?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?/g) || [];
      const parsedNumbers = numbersInLine.map(numberClean).filter((n) => n > 0 && n !== 77 && n !== 73 && n !== 71);

      let amount = 0;
      let balance = 0;

      // Extract phone number
      const phoneMatch = line.match(phoneRegex);
      const phone = phoneMatch ? phoneMatch[0] : undefined;

      // Extract operation ID
      const opMatch = line.match(opIdRegex);
      const operationId = opMatch && opMatch[1] !== phone ? opMatch[1] : undefined;

      // In Hadi statements:
      // If line contains 'رصيدكم: X' or 'رصيد: X'
      const balanceMatch = line.match(/رصيد(?:كم)?[.:\s]*([0-9,.]+)/);
      if (balanceMatch) {
        balance = numberClean(balanceMatch[1]);
      }

      // If line contains 'مبلغ وقدره X'
      const amountMatch = line.match(/(?:مبلغ وقدره|المبلغ|مبلغ)?[.:\s]*([0-9,.]+)/);
      if (amountMatch) {
        amount = numberClean(amountMatch[1]);
      } else if (parsedNumbers.length > 0) {
        amount = parsedNumbers[0];
        if (parsedNumbers.length > 1 && balance === 0) {
          balance = parsedNumbers[parsedNumbers.length - 1];
        }
      }

      // Operator classification
      let operator: ParsedHadiRow['operator'] = 'other';
      let operatorNameAr = 'أخرى';
      if (phone?.startsWith('77') || line.includes('موبايل') || line.includes('يمن موبايل')) {
        operator = 'yemen_mobile';
        operatorNameAr = 'يمن موبايل';
      } else if (phone?.startsWith('73') || line.includes('يو') || line.includes('MTN')) {
        operator = 'you';
        operatorNameAr = 'يو (MTN)';
      } else if (phone?.startsWith('71') || line.includes('سبأفون')) {
        operator = 'sabafon';
        operatorNameAr = 'سبأفون';
      } else if (phone?.startsWith('10') || line.includes('فورجي') || line.includes('4G')) {
        operator = 'yemen4g';
        operatorNameAr = 'يمن فورجي';
      }

      // Extract package name if present
      let packageName = '';
      if (line.includes('مزايا')) packageName = 'باقة مزايا';
      else if (line.includes('نت فورجي') || line.includes('4G')) packageName = 'نت فورجي';
      else if (line.includes('توفير')) packageName = 'باقة توفير';
      else if (line.includes('رصيد')) packageName = 'رصيد مباشر';

      const type = isCredit ? 'له' : 'عليه';

      rows.push({
        id: `hadi_tx_${Date.now()}_${rows.length + 1}`,
        page: currentPage,
        date: pendingDate || new Date().toISOString().split('T')[0],
        time: pendingTime || undefined,
        description: line,
        amount: Math.abs(amount),
        type,
        debit: type === 'عليه' ? Math.abs(amount) : 0,
        credit: type === 'له' ? Math.abs(amount) : 0,
        balance,
        phone,
        operationId,
        operator,
        operatorNameAr,
        packageName,
      });
    }
  }

  return rows;
}
