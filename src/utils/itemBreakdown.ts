import { Transaction } from '../types';
import { findBestMatchPrice, normalizeArabic } from './priceMemoryStorage';

export interface DecomposedItem {
  id: string;
  originalTxId: string;
  name: string;
  amount: number;
  cost: number;
  profit: number;
  quantity: number;
  supplierName?: string;
  notes?: string;
  time?: string;
  date: string;
  type: Transaction['type'];
  category: Transaction['category'];
  paymentMethod?: Transaction['paymentMethod'];
}

/**
 * Detects if a description contains multiple items joined by '+'
 */
export function isCompoundDescription(description: string): boolean {
  if (!description) return false;
  // Check for '+' sign
  if (description.includes('+')) return true;
  // Check for compound Arabic keywords like 'و' between known items if explicit
  return false;
}

/**
 * Cleans the prefix or surrounding brackets from descriptions
 * e.g., "إكسسوارات متنوعة (وصلة 500 + لاصق 400)" -> "وصلة 500 + لاصق 400"
 * e.g., "صيانة (شاشة J3 5000 + برمجة 500)" -> "شاشة J3 5000 + برمجة 500"
 */
export function cleanCompoundDescription(raw: string): string {
  let text = raw.trim();
  
  // Extract inside parentheses if present and contains '+'
  const matchParen = text.match(/\(([^()]*\+[^()]*)\)/);
  if (matchParen && matchParen[1]) {
    return matchParen[1].trim();
  }

  // Remove leading prefixes like "إكسسوارات متنوعة:" or "إكسسوارات:" or "صيانة:"
  text = text.replace(/^(إكسسوارات متنوعة|إكسسوارات|صيانة|جوالات|مبيعات|مشتريات|قطع غيار)[\s:：\-–—]+/i, '');
  return text.trim();
}

/**
 * Parses a compound string into individual items with intelligent price/damar resolution
 */
export function parseCompoundItems(
  description: string,
  totalPrice: number,
  totalCost: number,
  category: Transaction['category'] = 'accessories'
): Array<{ name: string; amount: number; cost: number; profit: number; quantity: number }> {
  const cleaned = cleanCompoundDescription(description);
  const parts = cleaned.split('+').map((p) => p.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return [
      {
        name: description.trim(),
        amount: totalPrice,
        cost: totalCost,
        profit: Math.max(0, totalPrice - totalCost),
        quantity: 1,
      },
    ];
  }

  const parsedItems: Array<{ name: string; amount: number; cost: number; profit: number; quantity: number }> = [];

  for (const part of parts) {
    // Check if there is an amount:
    // Case 1: "وصلة كشاف 500" or "وصلة كشاف بـ 500" or "سماعة 1000" or "سماعه 500"
    // Case 2: "2000 بيت شحن" or "500 وصلة" (leading amount)
    // Case 3: "2 بيت شحن 2000" (quantity + name + amount)
    // Case 4: "2 وصلة سوبر ليزر 3000"

    let name = part;
    let amount = 0;
    let quantity = 1;

    // Remove words like "بـ" or "ريال" or "ر.ي"
    const normalizedPart = part.replace(/\b(بـ|ريال|ر\.ي)\b/g, ' ').replace(/\s+/g, ' ').trim();

    // Check quantity at the start: e.g., "2 بيت شحن 2000" or "22 لمبة 2000" or "3 لواصق 1500"
    const qtyMatch = normalizedPart.match(/^(\d+)\s+([^\d]+)\s+(\d+[\d,.]*)$/);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10) || 1;
      name = qtyMatch[2].trim();
      amount = parseFloat(qtyMatch[3].replace(/,/g, '')) || 0;
    } else {
      // Check trailing number: "وصلة كشاف 500"
      const trailingMatch = normalizedPart.match(/^(.*?)(?:\s+)?(\d+[\d,.]*)\s*$/);
      if (trailingMatch && trailingMatch[1].trim().length > 0) {
        name = trailingMatch[1].trim();
        amount = parseFloat(trailingMatch[2].replace(/,/g, '')) || 0;
      } else {
        // Check leading number: "2000 بيت شحن"
        const leadingMatch = normalizedPart.match(/^(\d+[\d,.]*)\s+(.+)$/);
        if (leadingMatch) {
          amount = parseFloat(leadingMatch[1].replace(/,/g, '')) || 0;
          name = leadingMatch[2].trim();
        } else {
          // No number found, keep name as is
          name = normalizedPart;
        }
      }
    }

    // Attempt to lookup damar / cost from persistent price memory
    let itemCost = 0;
    const memoryMatch = findBestMatchPrice(name);
    if (memoryMatch && memoryMatch.costPrice > 0) {
      itemCost = memoryMatch.costPrice * quantity;
    } else if (totalCost > 0 && totalPrice > 0 && amount > 0) {
      // Proportional fallback based on ratio of item amount to total
      const ratio = amount / totalPrice;
      itemCost = Math.round(totalCost * ratio);
    }

    const itemProfit = Math.max(0, amount - itemCost);

    parsedItems.push({
      name: name || part,
      amount,
      cost: itemCost,
      profit: itemProfit,
      quantity,
    });
  }

  // If sum of parsed amounts differs from totalPrice, normalize or keep accurate
  const sumAmount = parsedItems.reduce((acc, i) => acc + i.amount, 0);
  if (sumAmount === 0 && totalPrice > 0) {
    // If amounts couldn't be parsed from text, distribute equally
    const equalShare = Math.round(totalPrice / parsedItems.length);
    const equalCost = Math.round(totalCost / parsedItems.length);
    parsedItems.forEach((item) => {
      item.amount = equalShare;
      item.cost = equalCost;
      item.profit = Math.max(0, equalShare - equalCost);
    });
  }

  return parsedItems;
}

/**
 * Decomposes a compound Transaction into an array of virtual or new standalone Transaction records
 */
export function decomposeTransaction(tx: Transaction): DecomposedItem[] {
  if (!isCompoundDescription(tx.description)) {
    return [
      {
        id: `${tx.id}_0`,
        originalTxId: tx.id,
        name: tx.description,
        amount: tx.price ?? tx.amount ?? 0,
        cost: tx.cost ?? 0,
        profit: tx.profit ?? 0,
        quantity: tx.quantity || 1,
        supplierName: tx.supplierName,
        notes: tx.notes,
        time: tx.time,
        date: tx.date,
        type: tx.type,
        category: tx.category,
        paymentMethod: tx.paymentMethod,
      },
    ];
  }

  const items = parseCompoundItems(tx.description, tx.price ?? tx.amount ?? 0, tx.cost ?? 0, tx.category);

  return items.map((item, idx) => ({
    id: `${tx.id}_item_${idx}`,
    originalTxId: tx.id,
    name: item.name,
    amount: item.amount,
    cost: item.cost,
    profit: item.profit,
    quantity: item.quantity,
    supplierName: tx.supplierName,
    notes: tx.notes ? `${tx.notes} (صنف مستقل)` : undefined,
    time: tx.time,
    date: tx.date,
    type: tx.type,
    category: tx.category,
    paymentMethod: tx.paymentMethod,
  }));
}

/**
 * Splits a compound Transaction into real, independent Transaction objects to replace the lumped one
 */
export function convertDecomposedToTransactions(
  tx: Transaction,
  decomposed: DecomposedItem[]
): Transaction[] {
  return decomposed.map((item, idx) => ({
    id: `tx_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    date: tx.date,
    time: tx.time || '12:00',
    type: tx.type,
    category: tx.category,
    description: item.name,
    quantity: item.quantity || 1,
    price: item.amount,
    cost: item.cost,
    profit: item.profit,
    supplierId: tx.supplierId,
    supplierName: tx.supplierName,
    customerId: tx.customerId,
    customerName: tx.customerName,
    technicianName: tx.technicianName,
    notes: item.notes || (decomposed.length > 1 ? `تم تفكيكه من بيان مجمع: ${item.name}` : undefined),
    paymentMethod: tx.paymentMethod,
  }));
}
