import { InventoryItem, DayRecord, AccessoryItem, PhoneItem } from '../types';
import { generateAutoBarcode } from './barcode';

/**
 * Detect product category automatically from product title in Yemeni mobile market
 */
export function detectProductCategory(
  name: string
): 'accessories' | 'spare_parts' | 'phones' | 'sims' | 'tools' {
  const lower = name.toLowerCase().trim();

  // Phones & Handsets
  if (
    lower.includes('جوال') ||
    lower.includes('هاتف') ||
    lower.includes('تلفون') ||
    lower.includes('ايفون') ||
    lower.includes('iphone') ||
    lower.includes('ريدمي') ||
    lower.includes('redmi') ||
    lower.includes('شاومي') ||
    lower.includes('xiaomi') ||
    lower.includes('سامسونج') ||
    lower.includes('samsung') ||
    lower.includes('ريلمي') ||
    lower.includes('realme') ||
    lower.includes('تكنو') ||
    lower.includes('tecno') ||
    lower.includes('انفينكس') ||
    lower.includes('infinix') ||
    lower.includes('نوكيا') ||
    lower.includes('nokia')
  ) {
    return 'phones';
  }

  // Maintenance & Spare Parts
  if (
    lower.includes('شاشة') ||
    lower.includes('بطارية') ||
    lower.includes('فلاتة') ||
    lower.includes('كونكتر') ||
    lower.includes('اي سي') ||
    lower.includes('باغة') ||
    lower.includes('تاتش') ||
    lower.includes('مدخل شحن') ||
    lower.includes('قاعدة شحن') ||
    lower.includes('كاميرا') ||
    lower.includes('جرم') ||
    lower.includes('ظهرية')
  ) {
    return 'spare_parts';
  }

  // SIM Cards
  if (
    lower.includes('شريحة') ||
    lower.includes('شرايح') ||
    lower.includes('سيم') ||
    lower.includes('sim') ||
    lower.includes('باقة')
  ) {
    return 'sims';
  }

  // Tools
  if (
    lower.includes('كاوية') ||
    lower.includes('مفك') ||
    lower.includes('مقص') ||
    lower.includes('لحام') ||
    lower.includes('تنر') ||
    lower.includes('مجهر')
  ) {
    return 'tools';
  }

  // Default: Accessories
  return 'accessories';
}

/**
 * Parse a bulk text string of product names (comma, newline, or bullet separated)
 * and generate ready-to-use InventoryItem objects with auto-generated barcodes
 * and empty prices/stock marked as pending.
 */
export function parseBulkProductNames(
  rawText: string,
  preferredCategory?: 'accessories' | 'spare_parts' | 'phones' | 'sims' | 'tools'
): InventoryItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Split by newlines, commas, Arabic commas، or semicolons
  const lines = rawText
    .split(/[\n\r,،;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const items: InventoryItem[] = [];
  const now = new Date().toISOString().slice(0, 10);

  lines.forEach((line) => {
    // Strip bullet points, numbers, dashes from start of line
    const cleanName = line
      .replace(/^[\d\s.\-•*#+—–()]+/, '')
      .replace(/^[و\s]+/, '')
      .trim();

    if (cleanName.length < 2) return;

    const category = preferredCategory || detectProductCategory(cleanName);
    const barcode = generateAutoBarcode();
    const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    items.push({
      id,
      name: cleanName,
      category,
      barcode,
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      isPendingPricing: true,
      isPendingStock: true,
      dateAdded: now,
      notes: 'إدخال سريع لأسماء الأصناف - بانتظار إدخال التكلفة والعدد',
    });
  });

  return items;
}

/**
 * Represents a sold item whose inventory record or sale entry lacks pricing/stock
 */
export interface UnpricedSoldReconciliationItem {
  itemId: string; // ID inside the day record (accessory or phone)
  section: 'accessories' | 'phones';
  productName: string;
  soldPrice: number;
  currentCost: number;
  dayNumber: number;
  date: string;
  matchedInventoryItem?: InventoryItem;
  suggestedCost?: number;
  suggestedStockQuantity?: number;
}

/**
 * Scan a DayRecord and find all sold items that have missing/zero cost or
 * match an inventory item that is pending pricing / stock.
 */
export function findUnpricedSoldItemsInDay(
  day: DayRecord,
  inventory: InventoryItem[] = []
): UnpricedSoldReconciliationItem[] {
  const results: UnpricedSoldReconciliationItem[] = [];
  const inventoryMap = new Map<string, InventoryItem>();

  inventory.forEach((item) => {
    const key = item.name.trim().toLowerCase();
    inventoryMap.set(key, item);
  });

  // 1. Check Accessories
  (day.accessories || []).forEach((acc) => {
    const cleanName = acc.name.trim().toLowerCase();
    const matchedInv = inventoryMap.get(cleanName);

    const isCostZero = !acc.cost || Number(acc.cost) === 0;
    const isInvPendingPricing = matchedInv ? Boolean(matchedInv.isPendingPricing || !matchedInv.costPrice) : false;
    const isInvPendingStock = matchedInv ? Boolean(matchedInv.isPendingStock || matchedInv.quantity === 0) : false;

    // Trigger reconciliation if cost is zero, or matching inventory is pending
    if (isCostZero || isInvPendingPricing || isInvPendingStock) {
      results.push({
        itemId: acc.id,
        section: 'accessories',
        productName: acc.name,
        soldPrice: acc.price || 0,
        currentCost: acc.cost || (matchedInv?.costPrice || 0),
        dayNumber: day.dayNumber,
        date: day.date,
        matchedInventoryItem: matchedInv,
        suggestedCost: acc.cost || matchedInv?.costPrice || 0,
        suggestedStockQuantity: matchedInv?.quantity || 0,
      });
    }
  });

  // 2. Check Phones
  (day.phones || []).forEach((phone) => {
    const phoneModel = phone.model || phone.name || '';
    const cleanName = phoneModel.trim().toLowerCase();
    const matchedInv = inventoryMap.get(cleanName);

    const isCostZero = !phone.cost || Number(phone.cost) === 0;
    const isInvPendingPricing = matchedInv ? Boolean(matchedInv.isPendingPricing || !matchedInv.costPrice) : false;
    const isInvPendingStock = matchedInv ? Boolean(matchedInv.isPendingStock || matchedInv.quantity === 0) : false;

    if (isCostZero || isInvPendingPricing || isInvPendingStock) {
      results.push({
        itemId: phone.id,
        section: 'phones',
        productName: phoneModel,
        soldPrice: phone.salePrice || phone.price || 0,
        currentCost: phone.cost || (matchedInv?.costPrice || 0),
        dayNumber: day.dayNumber,
        date: day.date,
        matchedInventoryItem: matchedInv,
        suggestedCost: phone.cost || matchedInv?.costPrice || 0,
        suggestedStockQuantity: matchedInv?.quantity || 0,
      });
    }
  });

  return results;
}
