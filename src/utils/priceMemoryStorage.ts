import { PriceMemoryItem, PriceCategory } from '../types/pricing';
import { APPROVED_DAMAR_ITEMS_SEED, BALANCE_PROFIT_RULE } from '../data/approvedDamarPrices';

const STORAGE_KEY_PRICING = 'mosaab_price_memory_catalog_v2';
const DAMAR_ZEROED_FLAG = 'mosaab_damar_and_quantities_zeroed_v2';

/**
 * Normalizes Arabic text for flexible matching:
 * - Removes tashkeel / diacritics
 * - Normalizes Alef forms (أ إ آ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Yaa (ى -> ي)
 * - Removes tatweel (ـ)
 * - Trims and normalizes whitespace
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove diacritics
    .replace(/ـ/g, '') // remove tatweel
    .replace(/[أإآ]/g, 'ا') // normalize alef
    .replace(/ة/g, 'ه') // normalize taa marbuta
    .replace(/ى/g, 'ي') // normalize yaa
    .replace(/\s+/g, ' '); // collapse spaces
}

/**
 * Helper to provide realistic initial stock quantities based on product category.
 */
export function getDefaultStockQuantity(category: PriceCategory, code?: number): number {
  if (category === 'software') return 999;
  if (category === 'balance') return 1000;
  if (category === 'accessories') {
    // Chargers, cables, protectors
    if (code && (code <= 10 || code >= 20 && code <= 35)) return 20;
    return 15;
  }
  if (category === 'screens') return 4;
  if (category === 'spare_parts') return 8;
  if (category === 'phones') return 2;
  return 10;
}

/**
 * Loads the persistent price memory catalog from localStorage.
 * Initializes and merges with the approved 162+ item seed so that all default prices and stock quantities are always available.
 */
export function loadPriceMemory(): PriceMemoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRICING);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with seed to ensure all 162+ seed items exist even after updates
        const storedMap = new Map<string, PriceMemoryItem>();
        let hasChanges = false;

        parsed.forEach((item: PriceMemoryItem) => {
          if (item && item.id) {
            // Ensure valid quantity
            const qty = item.quantity !== undefined && item.quantity !== null && !isNaN(Number(item.quantity))
              ? Math.max(0, Number(item.quantity))
              : getDefaultStockQuantity(item.category, item.code);
            const minAlert = item.minQuantityAlert !== undefined && !isNaN(Number(item.minQuantityAlert))
              ? Number(item.minQuantityAlert)
              : (item.category === 'screens' || item.category === 'phones' ? 1 : 3);

            if (item.quantity !== qty || item.minQuantityAlert !== minAlert) {
              item.quantity = qty;
              item.minQuantityAlert = minAlert;
              hasChanges = true;
            }

            storedMap.set(item.id, item);
          }
        });

        // Add any missing items from APPROVED_DAMAR_ITEMS_SEED
        let hasNewSeed = false;
        APPROVED_DAMAR_ITEMS_SEED.forEach((seedItem) => {
          if (!storedMap.has(seedItem.id)) {
            // Check if matched by code
            const foundByCode = Array.from(storedMap.values()).find((i) => i.code === seedItem.code);
            if (!foundByCode) {
              const seedWithQty: PriceMemoryItem = {
                ...seedItem,
                quantity: seedItem.quantity !== undefined ? seedItem.quantity : getDefaultStockQuantity(seedItem.category, seedItem.code),
                minQuantityAlert: seedItem.minQuantityAlert !== undefined ? seedItem.minQuantityAlert : (seedItem.category === 'screens' || seedItem.category === 'phones' ? 1 : 3),
              };
              storedMap.set(seedItem.id, seedWithQty);
              hasNewSeed = true;
            }
          }
        });

        const merged = Array.from(storedMap.values());
        // Sort by code or learned order
        merged.sort((a, b) => (a.code || 9999) - (b.code || 9999));

        if (hasNewSeed || hasChanges) {
          savePriceMemory(merged);
        }

        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading price memory from localStorage:', e);
  }

  // Fallback to approved 162+ seed items with quantities
  const defaultList: PriceMemoryItem[] = APPROVED_DAMAR_ITEMS_SEED.map((it) => ({
    ...it,
    quantity: it.quantity !== undefined ? it.quantity : getDefaultStockQuantity(it.category, it.code),
    minQuantityAlert: it.minQuantityAlert !== undefined ? it.minQuantityAlert : (it.category === 'screens' || it.category === 'phones' ? 1 : 3),
  }));

  savePriceMemory(defaultList);
  return defaultList;
}

/**
 * Saves price memory catalog to localStorage.
 */
export function savePriceMemory(items: PriceMemoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PRICING, JSON.stringify(items));
    // Dispatch a custom window event so all open views immediately update
    window.dispatchEvent(new CustomEvent('price_memory_updated', { detail: { itemsCount: items.length } }));
  } catch (e) {
    console.error('Error saving price memory to localStorage:', e);
  }
}

/**
 * Automatically calculates balance profit based on the approved 7% rule:
 * 700 YER gross profit for every 10,000 YER sales.
 */
export function calculateBalanceValues(salesPrice: number): {
  cost: number;
  profit: number;
  profitPercent: number;
} {
  const price = Math.max(0, Number(salesPrice) || 0);
  const profit = Math.round(price * 0.07); // 700 per 10,000
  const cost = Math.max(0, price - profit);
  return {
    cost,
    profit,
    profitPercent: BALANCE_PROFIT_RULE.percentage,
  };
}

/**
 * Auto-learns or updates a price memory entry.
 * Triggered automatically upon every voucher entry, POS sale, or ticket creation.
 */
export function learnOrUpdatePriceMemory(
  name: string,
  costPrice: number,
  sellingPrice: number,
  category: PriceCategory = 'accessories',
  supplierName?: string,
  notes?: string,
  quantity?: number,
  minQuantityAlert?: number
): PriceMemoryItem {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Item name cannot be empty');
  }

  const items = loadPriceMemory();
  const normQuery = normalizeArabic(trimmedName);

  const safeCost = Math.max(0, Number(costPrice) || 0);
  const safeSelling = Math.max(0, Number(sellingPrice) || 0);
  const profit = Math.max(0, safeSelling - safeCost);
  const profitMarginPercent = safeCost > 0 ? Number(((profit / safeCost) * 100).toFixed(1)) : 100.0;

  // Check if item already exists by exact name, normalized name, or alias
  const existingIndex = items.findIndex((item) => {
    if (normalizeArabic(item.name) === normQuery) return true;
    return item.aliases.some((alias) => normalizeArabic(alias) === normQuery);
  });

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    // Update existing item with the newly entered cost/selling values
    const current = items[existingIndex];
    const safeQty = quantity !== undefined && quantity !== null && !isNaN(Number(quantity))
      ? Math.max(0, Number(quantity))
      : current.quantity;
    const safeMinAlert = minQuantityAlert !== undefined && minQuantityAlert !== null && !isNaN(Number(minQuantityAlert))
      ? Number(minQuantityAlert)
      : current.minQuantityAlert;

    const updated: PriceMemoryItem = {
      ...current,
      costPrice: safeCost,
      sellingPrice: safeSelling,
      profit,
      profitMarginPercent,
      quantity: safeQty,
      minQuantityAlert: safeMinAlert,
      supplierName: supplierName || current.supplierName,
      notes: notes || current.notes,
      isCustomLearned: true,
      lastUpdated: now,
    };
    // Add alias if not present
    if (!updated.aliases.includes(trimmedName)) {
      updated.aliases.push(trimmedName);
    }
    items[existingIndex] = updated;
    savePriceMemory(items);

    // Non-blocking sync to cloud
    try {
      import('./syncService').then((m) => m.syncPriceMemoryToCloud(updated)).catch(() => {});
    } catch (e) {
      // Ignore offline
    }

    return updated;
  } else {
    // Create new learned entry
    const maxCode = items.reduce((max, item) => Math.max(max, item.code || 0), 0);
    const categoryLabels: Record<PriceCategory, string> = {
      accessories: 'الإكسسوارات والملحقات',
      screens: 'شاشات الصيانة',
      spare_parts: 'قطع الغيار والهاردوير',
      software: 'خدمات البرمجة والشبكات',
      balance: 'الرصيد والشبكات',
      phones: 'الجوالات والأجهزة',
      other: 'أصناف متنوعة',
    };

    const safeQty = quantity !== undefined && quantity !== null && !isNaN(Number(quantity))
      ? Math.max(0, Number(quantity))
      : getDefaultStockQuantity(category, maxCode + 1);

    const safeMinAlert = minQuantityAlert !== undefined && minQuantityAlert !== null && !isNaN(Number(minQuantityAlert))
      ? Number(minQuantityAlert)
      : (category === 'screens' || category === 'phones' ? 1 : 3);

    const newItem: PriceMemoryItem = {
      id: `damar_learned_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      code: maxCode + 1,
      name: trimmedName,
      category,
      categoryNameAr: categoryLabels[category] || 'أصناف متنوعة',
      costPrice: safeCost,
      sellingPrice: safeSelling,
      profit,
      profitMarginPercent,
      quantity: safeQty,
      minQuantityAlert: safeMinAlert,
      supplierName: supplierName || 'مورد محلي',
      aliases: [trimmedName],
      notes: notes || 'صنف تم إضافته لجدول المخزن والأسعار',
      isCustomLearned: true,
      lastUpdated: now,
    };

    items.unshift(newItem); // put latest learned items near top
    savePriceMemory(items);

    // Non-blocking sync to cloud
    try {
      import('./syncService').then((m) => m.syncPriceMemoryToCloud(newItem)).catch(() => {});
    } catch (e) {
      // Ignore offline
    }

    return newItem;
  }
}

/**
 * Finds the closest matching price memory item by name query.
 */
export function findBestMatchPrice(query: string): PriceMemoryItem | null {
  if (!query || !query.trim()) return null;
  const items = loadPriceMemory();
  const normQuery = normalizeArabic(query);

  // 1. Exact normalized name match
  const exactMatch = items.find((item) => normalizeArabic(item.name) === normQuery);
  if (exactMatch) return exactMatch;

  // 2. Exact alias match
  const aliasMatch = items.find((item) =>
    item.aliases.some((alias) => normalizeArabic(alias) === normQuery)
  );
  if (aliasMatch) return aliasMatch;

  // 3. Substring match (query is contained in item name or alias)
  const substringMatch = items.find(
    (item) =>
      normalizeArabic(item.name).includes(normQuery) ||
      normQuery.includes(normalizeArabic(item.name)) ||
      item.aliases.some((alias) => normalizeArabic(alias).includes(normQuery))
  );

  return substringMatch || null;
}

/**
 * Searches price memory with ranked relevance for auto-complete dropdowns.
 */
export function searchPriceMemory(
  query: string,
  categoryFilter?: PriceCategory,
  limit: number = 20
): PriceMemoryItem[] {
  const items = loadPriceMemory();
  const normQuery = normalizeArabic(query);

  let filtered = items;
  if (categoryFilter) {
    filtered = filtered.filter((i) => i.category === categoryFilter);
  }

  if (!normQuery) {
    return filtered.slice(0, limit);
  }

  // Score matching items
  const scored = filtered.map((item) => {
    let score = 0;
    const normName = normalizeArabic(item.name);

    if (normName === normQuery) score += 100;
    else if (normName.startsWith(normQuery)) score += 50;
    else if (normName.includes(normQuery)) score += 30;

    for (const alias of item.aliases) {
      const normAlias = normalizeArabic(alias);
      if (normAlias === normQuery) {
        score = Math.max(score, 90);
      } else if (normAlias.startsWith(normQuery)) {
        score = Math.max(score, 45);
      } else if (normAlias.includes(normQuery)) {
        score = Math.max(score, 25);
      }
    }

    if (item.code.toString() === query.trim()) {
      score += 100;
    }

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.item.code - b.item.code)
    .map((s) => s.item)
    .slice(0, limit);
}

/**
 * Resets the entire price memory catalog back to the official August approved seed.
 */
export function resetPriceMemoryToDefaults(): void {
  savePriceMemory(APPROVED_DAMAR_ITEMS_SEED);
}

/**
 * تصفير جميع أسعار الضمار (التكلفة) والكميات لكافة منتجات المخزن
 * يضبط سعر الضمار = 0 والكمية = 0 لجميع الأصناف مع تحديث الأرباح والتخزين
 */
export function zeroOutAllCostPricesAndQuantities(): PriceMemoryItem[] {
  const currentItems = loadPriceMemory();
  const now = new Date().toISOString();
  const resetItems = currentItems.map((item) => ({
    ...item,
    costPrice: 0,
    quantity: 0,
    profit: Math.max(0, item.sellingPrice || 0),
    profitMarginPercent: 100.0,
    lastUpdated: now,
  }));

  savePriceMemory(resetItems);

  // تحديث ومزامنة مخزون الأصناف في localStorage إن وجد
  try {
    const invKeys = ['mosaab_shop_inventory_v2', 'mosaab_inventory_items_v2', 'mosaab_inventory_v1'];
    invKeys.forEach((key) => {
      const rawInv = localStorage.getItem(key);
      if (rawInv) {
        const invList = JSON.parse(rawInv);
        if (Array.isArray(invList)) {
          const resetInv = invList.map((it: any) => ({
            ...it,
            quantity: 0,
            costPrice: 0,
            purchasePrice: 0,
          }));
          localStorage.setItem(key, JSON.stringify(resetInv));
        }
      }
    });
    window.dispatchEvent(new CustomEvent('inventory_updated', { detail: { count: 0 } }));
  } catch (e) {
    console.error('Error syncing zeroed inventory items:', e);
  }

  return resetItems;
}

export const resetAllDamarPricesAndQuantitiesToZero = zeroOutAllCostPricesAndQuantities;

/**
 * حفظ وتحديث صنف واحد فورياً ولحظياً في الذاكرة الدائمة
 * يضمن حفظ الصنف السابق تلقائياً فور الانتقال للصنف التالي
 */
export function saveSinglePriceMemoryItem(item: PriceMemoryItem): PriceMemoryItem {
  const currentItems = loadPriceMemory();
  const now = new Date().toISOString();
  const cost = Math.max(0, Number(item.costPrice) || 0);
  const selling = Math.max(0, Number(item.sellingPrice) || 0);
  const profit = Math.max(0, selling - cost);
  const profitMarginPercent = cost > 0 ? Number(((profit / cost) * 100).toFixed(1)) : 100.0;
  const qty = Math.max(0, Number(item.quantity) || 0);

  const updated: PriceMemoryItem = {
    ...item,
    costPrice: cost,
    sellingPrice: selling,
    profit,
    profitMarginPercent,
    quantity: qty,
    lastUpdated: now,
  };

  const idx = currentItems.findIndex((i) => i.id === item.id);
  let nextList: PriceMemoryItem[];
  if (idx !== -1) {
    nextList = [...currentItems];
    nextList[idx] = updated;
  } else {
    nextList = [updated, ...currentItems];
  }

  savePriceMemory(nextList);
  return updated;
}

/**
 * Deletes a single price item by ID.
 */
export function deletePriceMemoryItem(id: string): void {
  const items = loadPriceMemory().filter((i) => i.id !== id);
  savePriceMemory(items);
}

/**
 * Bulk updates multiple price memory items simultaneously.
 * Automatically recalculates profit and margins for each updated item.
 */
export function bulkUpdatePriceMemory(updatedItems: Partial<PriceMemoryItem> & { id: string }[]): PriceMemoryItem[] {
  const currentItems = loadPriceMemory();
  const updateMap = new Map<string, Partial<PriceMemoryItem>>();
  updatedItems.forEach((u) => updateMap.set(u.id, u));

  const now = new Date().toISOString();
  const result = currentItems.map((item) => {
    const update = updateMap.get(item.id);
    if (!update) return item;

    const newCost = update.costPrice !== undefined ? Math.max(0, Number(update.costPrice) || 0) : item.costPrice;
    const newSelling = update.sellingPrice !== undefined ? Math.max(0, Number(update.sellingPrice) || 0) : item.sellingPrice;
    const profit = Math.max(0, newSelling - newCost);
    const profitMarginPercent = newCost > 0 ? Number(((profit / newCost) * 100).toFixed(1)) : 100.0;
    const newQuantity = update.quantity !== undefined ? Math.max(0, Number(update.quantity) || 0) : (item.quantity ?? 10);
    const newMinAlert = update.minQuantityAlert !== undefined ? Math.max(0, Number(update.minQuantityAlert) || 0) : (item.minQuantityAlert ?? 2);

    return {
      ...item,
      ...update,
      costPrice: newCost,
      sellingPrice: newSelling,
      profit,
      profitMarginPercent,
      quantity: newQuantity,
      minQuantityAlert: newMinAlert,
      name: update.name ? update.name.trim() : item.name,
      lastUpdated: now,
    };
  });

  savePriceMemory(result);
  return result;
}

export type BulkAdjustmentType =
  | 'increase_cost_percent'
  | 'decrease_cost_percent'
  | 'increase_selling_percent'
  | 'decrease_selling_percent'
  | 'increase_cost_amount'
  | 'decrease_cost_amount'
  | 'increase_selling_amount'
  | 'decrease_selling_amount'
  | 'set_margin_percent'
  | 'set_supplier'
  | 'set_category'
  | 'set_quantity'
  | 'increase_quantity'
  | 'decrease_quantity';

/**
 * Applies a batch adjustment across multiple items by their IDs.
 */
export function bulkApplyAdjustment(
  targetIds: string[],
  adjustmentType: BulkAdjustmentType,
  value: number | string
): PriceMemoryItem[] {
  if (!targetIds || targetIds.length === 0) return loadPriceMemory();
  const idSet = new Set(targetIds);
  const currentItems = loadPriceMemory();
  const now = new Date().toISOString();

  const result = currentItems.map((item) => {
    if (!idSet.has(item.id)) return item;

    let costPrice = item.costPrice;
    let sellingPrice = item.sellingPrice;
    let supplierName = item.supplierName;
    let category = item.category;
    let categoryNameAr = item.categoryNameAr;
    let quantity = item.quantity !== undefined ? item.quantity : 10;

    const numVal = Number(value) || 0;

    switch (adjustmentType) {
      case 'increase_cost_percent':
        costPrice = Math.round(costPrice * (1 + numVal / 100));
        break;
      case 'decrease_cost_percent':
        costPrice = Math.max(0, Math.round(costPrice * (1 - numVal / 100)));
        break;
      case 'increase_selling_percent':
        sellingPrice = Math.round(sellingPrice * (1 + numVal / 100));
        break;
      case 'decrease_selling_percent':
        sellingPrice = Math.max(0, Math.round(sellingPrice * (1 - numVal / 100)));
        break;
      case 'increase_cost_amount':
        costPrice = Math.round(costPrice + numVal);
        break;
      case 'decrease_cost_amount':
        costPrice = Math.max(0, Math.round(costPrice - numVal));
        break;
      case 'increase_selling_amount':
        sellingPrice = Math.round(sellingPrice + numVal);
        break;
      case 'decrease_selling_amount':
        sellingPrice = Math.max(0, Math.round(sellingPrice - numVal));
        break;
      case 'set_margin_percent':
        // Selling = Cost + (Cost * margin / 100)
        sellingPrice = Math.round(costPrice * (1 + numVal / 100));
        break;
      case 'set_quantity':
        quantity = Math.max(0, Math.round(numVal));
        break;
      case 'increase_quantity':
        quantity = Math.max(0, quantity + Math.round(numVal));
        break;
      case 'decrease_quantity':
        quantity = Math.max(0, quantity - Math.round(numVal));
        break;
      case 'set_supplier':
        if (typeof value === 'string' && value.trim()) {
          supplierName = value.trim();
        }
        break;
      case 'set_category':
        if (typeof value === 'string') {
          category = value as PriceCategory;
          const categoryLabels: Record<string, string> = {
            accessories: 'الإكسسوارات والملحقات',
            screens: 'شاشات الصيانة',
            spare_parts: 'قطع الغيار والهاردوير',
            software: 'خدمات البرمجة والشبكات',
            balance: 'الرصيد والشبكات',
            phones: 'الجوالات والأجهزة',
            other: 'أخرى',
          };
          categoryNameAr = categoryLabels[category] || item.categoryNameAr;
        }
        break;
    }

    const profit = Math.max(0, sellingPrice - costPrice);
    const profitMarginPercent = costPrice > 0 ? Number(((profit / costPrice) * 100).toFixed(1)) : 100.0;

    return {
      ...item,
      costPrice,
      sellingPrice,
      profit,
      profitMarginPercent,
      quantity,
      supplierName,
      category,
      categoryNameAr,
      lastUpdated: now,
    };
  });

  savePriceMemory(result);
  return result;
}

/**
 * Bulk deletes multiple items by IDs.
 */
export function bulkDeletePriceMemoryItems(idsToDelete: string[]): PriceMemoryItem[] {
  const deleteSet = new Set(idsToDelete);
  const items = loadPriceMemory().filter((i) => !deleteSet.has(i.id));
  savePriceMemory(items);
  return items;
}

