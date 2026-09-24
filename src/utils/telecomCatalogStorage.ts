import { TelecomPackagePricing, TelecomOperator } from '../types';
import { getActiveStoreId, getActiveOwnerId } from './storage';

const CATALOG_STORAGE_KEY = 'mosaab_telecom_package_catalog_v1';

export const DEFAULT_TELECOM_PACKAGES: Omit<TelecomPackagePricing, 'id' | 'updatedAt' | 'storeId' | 'ownerId'>[] = [
  // Yemen Mobile
  {
    operator: 'yemen_mobile',
    operatorNameAr: 'يمن موبايل',
    packageName: 'باقة مزايا الشهرية (مكالمات + نت + رسائل)',
    packageCategory: 'mix_bundle',
    providerCostPrice: 2250,
    customerSellingPrice: 2500,
    netProfit: 250,
    profitMarginPercent: 10,
    matchKeywords: ['مزايا', 'مزايا الشهرية', '2500', 'شهرية'],
    isActive: true,
    notes: 'الباقة الأكثر طلباً في المحل',
  },
  {
    operator: 'yemen_mobile',
    operatorNameAr: 'يمن موبايل',
    packageName: 'باقة مزايا الأسبوعية (800)',
    packageCategory: 'mix_bundle',
    providerCostPrice: 720,
    customerSellingPrice: 800,
    netProfit: 80,
    profitMarginPercent: 10,
    matchKeywords: ['مزايا الأسبوعية', 'اسبوعية', '800'],
    isActive: true,
  },
  {
    operator: 'yemen_mobile',
    operatorNameAr: 'يمن موبايل',
    packageName: 'باقة نت فورجي 15 جيجا (4000)',
    packageCategory: 'data_net',
    providerCostPrice: 3700,
    customerSellingPrice: 4000,
    netProfit: 300,
    profitMarginPercent: 7.5,
    matchKeywords: ['15G', '15 جيجا', '4000', 'فورجي'],
    isActive: true,
  },
  {
    operator: 'yemen_mobile',
    operatorNameAr: 'يمن موبايل',
    packageName: 'باقة نت فورجي 30 جيجا (7500)',
    packageCategory: 'data_net',
    providerCostPrice: 6950,
    customerSellingPrice: 7500,
    netProfit: 550,
    profitMarginPercent: 7.3,
    matchKeywords: ['30G', '30 جيجا', '7500'],
    isActive: true,
  },
  {
    operator: 'yemen_mobile',
    operatorNameAr: 'يمن موبايل',
    packageName: 'باقة توفير الشهرية (1500)',
    packageCategory: 'mix_bundle',
    providerCostPrice: 1350,
    customerSellingPrice: 1500,
    netProfit: 150,
    profitMarginPercent: 10,
    matchKeywords: ['توفير', '1500'],
    isActive: true,
  },
  {
    operator: 'yemen_mobile',
    operatorNameAr: 'يمن موبايل',
    packageName: 'شحن رصيد مباشر عادي (يمن موبايل)',
    packageCategory: 'direct_balance',
    providerCostPrice: 975,
    customerSellingPrice: 1000,
    netProfit: 25,
    profitMarginPercent: 2.5,
    matchKeywords: ['رصيد مباشر', 'تسديد مباشر', 'عادي'],
    isActive: true,
    notes: 'هامش عمولة 2.5% إلى 3%',
  },

  // Yemen 4G
  {
    operator: 'yemen4g',
    operatorNameAr: 'يمن فورجي 4G',
    packageName: 'يمن فورجي باقة 20 جيجا (4800)',
    packageCategory: 'data_net',
    providerCostPrice: 4500,
    customerSellingPrice: 4800,
    netProfit: 300,
    profitMarginPercent: 6.25,
    matchKeywords: ['يمن فورجي 20', '20 جيجا', '4800'],
    isActive: true,
  },
  {
    operator: 'yemen4g',
    operatorNameAr: 'يمن فورجي 4G',
    packageName: 'يمن فورجي باقة 40 جيجا (9000)',
    packageCategory: 'data_net',
    providerCostPrice: 8450,
    customerSellingPrice: 9000,
    netProfit: 550,
    profitMarginPercent: 6.1,
    matchKeywords: ['يمن فورجي 40', '40 جيجا', '9000'],
    isActive: true,
  },
  {
    operator: 'yemen4g',
    operatorNameAr: 'يمن فورجي 4G',
    packageName: 'تجديد اشتراك يمن فورجي الأساسي (2400)',
    packageCategory: 'renewal_recharge',
    providerCostPrice: 2250,
    customerSellingPrice: 2400,
    netProfit: 150,
    profitMarginPercent: 6.25,
    matchKeywords: ['تجديد فورجي', 'اشتراك', '2400'],
    isActive: true,
  },

  // YOU (MTN)
  {
    operator: 'you',
    operatorNameAr: 'يو YOU (MTN)',
    packageName: 'باقة يو ماكس الأسبوعية (1000)',
    packageCategory: 'mix_bundle',
    providerCostPrice: 920,
    customerSellingPrice: 1000,
    netProfit: 80,
    profitMarginPercent: 8,
    matchKeywords: ['ماكس', 'يو ماكس', '1000'],
    isActive: true,
  },
  {
    operator: 'you',
    operatorNameAr: 'يو YOU (MTN)',
    packageName: 'باقة يو الشهرية (3000)',
    packageCategory: 'mix_bundle',
    providerCostPrice: 2750,
    customerSellingPrice: 3000,
    netProfit: 250,
    profitMarginPercent: 8.3,
    matchKeywords: ['يو شهرية', '3000'],
    isActive: true,
  },

  // SabaFon
  {
    operator: 'sabafon',
    operatorNameAr: 'سبأفون SabaFon',
    packageName: 'باقة سبأفون سوبر نت الشهرية (2500)',
    packageCategory: 'data_net',
    providerCostPrice: 2300,
    customerSellingPrice: 2500,
    netProfit: 200,
    profitMarginPercent: 8,
    matchKeywords: ['سوبر نت', 'سبأفون 2500', 'سوبر'],
    isActive: true,
  },

  // ADSL & Landline
  {
    operator: 'adsl_landline',
    operatorNameAr: 'سداد الهاتف الثابت و ADSL',
    packageName: 'سداد فاتورة إنترنت منزلي ADSL',
    packageCategory: 'direct_balance',
    providerCostPrice: 2900,
    customerSellingPrice: 3000,
    netProfit: 100,
    profitMarginPercent: 3.3,
    matchKeywords: ['ADSL', 'انترنت منزلي', 'هاتف ثابت', 'فاتورة نت'],
    isActive: true,
  },
];

export function loadTelecomCatalog(): TelecomPackagePricing[] {
  try {
    const storeId = getActiveStoreId();
    const ownerId = getActiveOwnerId();
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) {
      // Seed default catalog with active store & owner stamping
      const seeded: TelecomPackagePricing[] = DEFAULT_TELECOM_PACKAGES.map((pkg, idx) => ({
        ...pkg,
        id: `pkg_${Date.now()}_${idx}`,
        storeId,
        ownerId,
        updatedAt: new Date().toISOString(),
      }));
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const items: TelecomPackagePricing[] = JSON.parse(raw);
    // Tenant isolation filter
    const tenantItems = items.filter((item) => !item.storeId || item.storeId === storeId);
    return tenantItems;
  } catch (err) {
    console.error('Error loading telecom catalog:', err);
    return [];
  }
}

export function saveTelecomPackage(pkg: Omit<TelecomPackagePricing, 'id' | 'updatedAt' | 'storeId' | 'ownerId'> & { id?: string }): TelecomPackagePricing {
  const storeId = getActiveStoreId();
  const ownerId = getActiveOwnerId();
  const all = loadTelecomCatalog();

  const netProfit = Number(pkg.customerSellingPrice || 0) - Number(pkg.providerCostPrice || 0);
  const profitMarginPercent = pkg.customerSellingPrice > 0 ? (netProfit / pkg.customerSellingPrice) * 100 : 0;

  if (pkg.id) {
    // Update
    const updatedIndex = all.findIndex((i) => i.id === pkg.id);
    if (updatedIndex >= 0) {
      all[updatedIndex] = {
        ...all[updatedIndex],
        ...pkg,
        id: pkg.id,
        netProfit,
        profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
        storeId,
        ownerId,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(all));
      return all[updatedIndex];
    }
  }

  // Create new
  const newPkg: TelecomPackagePricing = {
    ...pkg,
    id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    netProfit,
    profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
    storeId,
    ownerId,
    updatedAt: new Date().toISOString(),
  };

  all.unshift(newPkg);
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(all));
  return newPkg;
}

export function deleteTelecomPackage(id: string): void {
  const all = loadTelecomCatalog();
  const filtered = all.filter((i) => i.id !== id);
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Match an extracted telecom operation against catalog
 * to automatically compute customer selling price and net profit
 */
export function matchPackageAndCalculateProfit(
  operator: TelecomOperator,
  costAmount: number,
  packageNameOrNotes?: string
): { matchedPackage?: TelecomPackagePricing; suggestedSellingPrice: number; netProfit: number; isMatched: boolean } {
  const catalog = loadTelecomCatalog().filter((p) => p.isActive);
  const text = (packageNameOrNotes || '').toLowerCase();

  // 1. First priority: match by operator and exact providerCostPrice or customerSellingPrice
  const exactCostMatch = catalog.find(
    (p) => p.operator === operator && Math.abs(p.providerCostPrice - costAmount) <= 15
  );
  if (exactCostMatch) {
    return {
      matchedPackage: exactCostMatch,
      suggestedSellingPrice: exactCostMatch.customerSellingPrice,
      netProfit: exactCostMatch.netProfit,
      isMatched: true,
    };
  }

  // 2. Second priority: match by keyword in package name / notes
  if (text) {
    const keywordMatch = catalog.find((p) => {
      if (p.operator !== operator && p.operator !== 'other') return false;
      if (p.matchKeywords?.some((kw) => text.includes(kw.toLowerCase()))) return true;
      if (text.includes(p.packageName.toLowerCase())) return true;
      return false;
    });

    if (keywordMatch) {
      const net = keywordMatch.customerSellingPrice - costAmount;
      return {
        matchedPackage: keywordMatch,
        suggestedSellingPrice: keywordMatch.customerSellingPrice,
        netProfit: net > 0 ? net : keywordMatch.netProfit,
        isMatched: true,
      };
    }
  }

  // 3. Fallback: default profit margin (e.g. 10% for packages, or standard 25-50 YER for small recharges)
  let fallbackProfit = 50;
  if (costAmount >= 5000) {
    fallbackProfit = Math.round(costAmount * 0.07);
  } else if (costAmount >= 2000) {
    fallbackProfit = Math.round(costAmount * 0.08);
  } else if (costAmount >= 1000) {
    fallbackProfit = 100;
  } else if (costAmount >= 500) {
    fallbackProfit = 50;
  } else {
    fallbackProfit = Math.max(20, Math.round(costAmount * 0.03));
  }

  return {
    matchedPackage: undefined,
    suggestedSellingPrice: costAmount + fallbackProfit,
    netProfit: fallbackProfit,
    isMatched: false,
  };
}

export function findCatalogMatchForOperation(
  operator: TelecomOperator,
  packageNameOrNotes: string,
  costAmount: number
): TelecomPackagePricing | null {
  const res = matchPackageAndCalculateProfit(operator, costAmount, packageNameOrNotes);
  return res.matchedPackage || null;
}
