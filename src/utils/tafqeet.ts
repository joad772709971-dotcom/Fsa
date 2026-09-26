// Tafqeet: Convert numbers to Arabic written currency words

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const TENS = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
const ELEVENS = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

function convertChunk(num: number): string {
  if (num === 0) return '';
  let str = '';
  
  const h = Math.floor(num / 100);
  const rem = num % 100;
  const t = Math.floor(rem / 10);
  const o = rem % 10;

  if (h > 0) {
    str += HUNDREDS[h];
  }

  if (rem > 0) {
    if (str !== '') str += ' و';
    if (rem >= 10 && rem <= 19) {
      str += ELEVENS[rem - 10];
    } else {
      if (o > 0 && t > 0) {
        str += ONES[o] + ' و' + TENS[t];
      } else if (o > 0) {
        str += ONES[o];
      } else if (t > 0) {
        str += TENS[t];
      }
    }
  }

  return str;
}

export function tafqeetRiyal(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'صفر ريال يمني';

  const millions = Math.floor(amount / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const remaining = Math.floor(amount % 1000);

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions >= 3 && millions <= 10) parts.push(convertChunk(millions) + ' ملايين');
    else parts.push(convertChunk(millions) + ' مليون');
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(convertChunk(thousands) + ' آلاف');
    else parts.push(convertChunk(thousands) + ' ألف');
  }

  if (remaining > 0) {
    parts.push(convertChunk(remaining));
  }

  return 'فقط ' + parts.join(' و') + ' ريال يمني لا غير';
}
