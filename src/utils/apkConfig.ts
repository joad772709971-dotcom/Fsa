/**
 * مساعد إعدادات وخادم الاتصال في تطبيق الأندرويد (APK)
 * يضمن وصول تطبيق الأندرويد لسيرفر الذكاء الاصطناعي ومعالجة القيود المحلية.
 */

const STORAGE_KEY_CUSTOM_SERVER = 'mosaab_custom_server_url';

// الرابط الرسمي للتطبيق السحابي في Cloud Run
export const DEFAULT_PRODUCTION_CLOUD_URL = 'https://ais-pre-etyokv2gpewohvcbrisgxt-387456550425.europe-west3.run.app';

/**
 * هل يعمل التطبيق حالياً داخل حزمة تطبيق أندرويد (APK / Capacitor WebView)؟
 */
export function isRunningInApk(): boolean {
  if (typeof window === 'undefined') return false;
  const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.() || (window as any).Capacitor?.platform === 'android');
  const isLocalFile = window.location.protocol === 'capacitor:' || window.location.protocol === 'file:';

  return isCapacitor || isLocalFile;
}

/**
 * جلب رابط السيرفر الأساسي المعتمد للتطبيق
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. إذا حدد المستخدم رابط خادم مخصص في الإعدادات
  const customUrl = localStorage.getItem(STORAGE_KEY_CUSTOM_SERVER);
  if (customUrl && customUrl.startsWith('http')) {
    return customUrl.replace(/\/+$/, '');
  }

  // 2. إذا كان التطبيق يعمل داخل APK على الهاتف
  if (isRunningInApk()) {
    return DEFAULT_PRODUCTION_CLOUD_URL;
  }

  // 3. إذا كان في المتصفح أو في البيئة الحية المحلية
  return '';
}

/**
 * حفظ رابط خادم مخصص (في حال أراد المستخدم ربطه برابط سيرفر خاص به)
 */
export function setCustomServerUrl(url: string): void {
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_SERVER);
  } else {
    localStorage.setItem(STORAGE_KEY_CUSTOM_SERVER, url.trim().replace(/\/+$/, ''));
  }
}

/**
 * رابط السيرفر المخزن حالياً
 */
export function getStoredServerUrl(): string {
  return localStorage.getItem(STORAGE_KEY_CUSTOM_SERVER) || '';
}
