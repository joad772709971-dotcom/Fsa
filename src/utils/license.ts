// License validation and generator utility for commercial sales & offline activation

export interface LicenseValidationResult {
  isValid: boolean;
  message: string;
  daysRemaining?: number;
  clientName?: string;
  clientPhone?: string;
  licenseType?: 'trial' | 'annual' | 'two_years' | 'lifetime';
  expiresAt?: string;
}

// Generate simple deterministic fingerprint for current machine/browser
export function getDeviceFingerprint(): string {
  try {
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const userAgent = navigator.userAgent;
    const lang = navigator.language;
    let hash = 0;
    const str = `${screenRes}_${userAgent}_${lang}_NESMA_GROW`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `NESMA-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
  } catch (e) {
    return 'NESMA-DEV-7723';
  }
}

/**
 * Key Generation Algorithm:
 * Format: NESMA-[TYPE]-[DURATION_CODE]-[CLIENT_HASH]-[SIGNATURE]
 * E.g.
 * Lifetime: NESMA-LFT-9999-XXXX-YYYY
 * 1 Year:   NESMA-1YR-YYYYMMDD-XXXX-YYYY
 * 2 Years:  NESMA-2YR-YYYYMMDD-XXXX-YYYY
 * Trial:    NESMA-TRL-YYYYMMDD-XXXX-YYYY
 */
export function generateLicenseKey(
  clientName: string,
  clientPhone: string,
  type: 'trial' | 'annual' | 'two_years' | 'lifetime'
): { key: string; expiresAt: string } {
  const now = new Date();
  let expDate = new Date();

  if (type === 'trial') {
    expDate.setDate(now.getDate() + 14); // 14 days trial
  } else if (type === 'annual') {
    expDate.setFullYear(now.getFullYear() + 1); // 1 year
  } else if (type === 'two_years') {
    expDate.setFullYear(now.getFullYear() + 2); // 2 years
  } else {
    expDate.setFullYear(now.getFullYear() + 99); // lifetime
  }

  const expStr = type === 'lifetime' ? 'LIFETIME' : expDate.toISOString().split('T')[0];
  const dateCode = type === 'lifetime' ? '9999' : expStr.replace(/-/g, '');
  
  const typeCode = type === 'lifetime' ? 'LFT' : type === 'two_years' ? '2YR' : type === 'annual' ? '1YR' : 'TRL';
  
  // Hash client details
  let clientHash = 0;
  const rawClient = `${clientName.trim()}_${clientPhone.trim()}_NESMA`;
  for (let i = 0; i < rawClient.length; i++) {
    clientHash = (clientHash << 5) - clientHash + rawClient.charCodeAt(i);
    clientHash |= 0;
  }
  const clientCode = Math.abs(clientHash).toString(16).toUpperCase().padStart(4, '0').slice(-4);

  // Security checksum
  let checkSum = 0;
  const checkRaw = `${typeCode}-${dateCode}-${clientCode}-SECRET_SALT_772315106`;
  for (let i = 0; i < checkRaw.length; i++) {
    checkSum = (checkSum << 3) - checkSum + checkRaw.charCodeAt(i);
    checkSum |= 0;
  }
  const checkCode = Math.abs(checkSum).toString(16).toUpperCase().padStart(4, '0').slice(-4);

  const key = `NESMA-${typeCode}-${dateCode}-${clientCode}-${checkCode}`;

  return {
    key,
    expiresAt: expStr,
  };
}

/**
 * Validates any entered license key or stored license
 */
export function validateLicenseKey(
  key: string,
  clientName: string,
  clientPhone: string
): LicenseValidationResult {
  if (!key || typeof key !== 'string') {
    return { isValid: false, message: 'مفتاح الترخيص غير موجود أو فارغ' };
  }

  const cleanKey = key.trim().toUpperCase();

  // ميزة التجديد السريع لمالك النظام: إدخال الرقم 777503191 يجدد الترخيص تلقائياً لمدة سنة كاملة
  if (cleanKey === '777503191' || key.trim() === '777503191') {
    const now = new Date();
    const expDate = new Date();
    expDate.setFullYear(now.getFullYear() + 1);
    const expStr = expDate.toISOString().split('T')[0];
    return {
      isValid: true,
      message: `تم تجديد وتفعيل ترخيص النظام لمالك النظام بنجاح لمدة سنة كاملة حتى ${expStr}.`,
      daysRemaining: 365,
      clientName: clientName || 'محل مصعب الصوفي',
      clientPhone: '777503191',
      licenseType: 'annual',
      expiresAt: expStr,
    };
  }

  const parts = cleanKey.split('-');

  // Format: NESMA-TYPE-DATE-CLIENT-CHECKSUM
  if (parts.length !== 5 || parts[0] !== 'NESMA') {
    return { isValid: false, message: 'صيغة كود التفعيل غير صحيحة' };
  }

  const [, typeCode, dateCode, clientCode, checkCode] = parts;

  // Validate checksum
  let checkSum = 0;
  const checkRaw = `${typeCode}-${dateCode}-${clientCode}-SECRET_SALT_772315106`;
  for (let i = 0; i < checkRaw.length; i++) {
    checkSum = (checkSum << 3) - checkSum + checkRaw.charCodeAt(i);
    checkSum |= 0;
  }
  const expectedCheckCode = Math.abs(checkSum).toString(16).toUpperCase().padStart(4, '0').slice(-4);

  if (checkCode !== expectedCheckCode) {
    return { isValid: false, message: 'رمز الحماية الرقمي للترخيص غير صالح أو تم التلاعب به' };
  }

  // Type & Expiry
  let licenseType: 'trial' | 'annual' | 'two_years' | 'lifetime' = 'annual';
  if (typeCode === 'LFT') licenseType = 'lifetime';
  else if (typeCode === '2YR') licenseType = 'two_years';
  else if (typeCode === '1YR') licenseType = 'annual';
  else if (typeCode === 'TRL') licenseType = 'trial';

  if (licenseType === 'lifetime' || dateCode === '9999') {
    return {
      isValid: true,
      message: 'الترخيص نشط ومفعل لمدى الحياة (نسخة مفتوحة دائمة)',
      daysRemaining: 99999,
      clientName,
      clientPhone,
      licenseType: 'lifetime',
      expiresAt: 'LIFETIME',
    };
  }

  // Parse date YYYYMMDD
  if (dateCode.length === 8) {
    const year = parseInt(dateCode.substring(0, 4), 10);
    const month = parseInt(dateCode.substring(4, 6), 10) - 1;
    const day = parseInt(dateCode.substring(6, 8), 10);
    const expDate = new Date(year, month, day, 23, 59, 59);

    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        isValid: false,
        message: `انتهت صلاحية هذا الترخيص بتاريخ ${expDate.toLocaleDateString('ar-EG')}. يرجى التجديد.`,
        daysRemaining: 0,
        licenseType,
        expiresAt: expDate.toISOString().split('T')[0],
      };
    }

    return {
      isValid: true,
      message: `الترخيص مفعل وصالح لمدة ${daysRemaining} يوماً قادمة.`,
      daysRemaining,
      clientName,
      clientPhone,
      licenseType,
      expiresAt: expDate.toISOString().split('T')[0],
    };
  }

  return { isValid: false, message: 'تاريخ انتهاء الترخيص غير معروف' };
}
