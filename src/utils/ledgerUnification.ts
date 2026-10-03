import { Transaction, DayRecord, AccessoryItem, MaintenanceItem, PhoneItem, ExpenseItem, SupplierTransferItem, MusabItem } from '../types';

/**
 * وحدة توحيد الدفاتر المحاسبية (Ledger Unification Engine)
 * تضمن المطابقة الفورية والتامة بين:
 * 1. سجل المعاملات والسندات المالية (transactions)
 * 2. دفتر وسجل الأيام واليوميات المعتمدة (days / DayRecord)
 * بحيث تظهر أي عملية يتم إدخالها في الكاشير، دفتر اليومية، أو السندات، على الهاتف (APK) أو المتصفح أو الكمبيوتر فوراً.
 */

export function getOrCreateDayInList(targetDate: string, daysList: DayRecord[]): { day: DayRecord; list: DayRecord[]; isNew: boolean } {
  const existingIdx = daysList.findIndex((d) => d.date === targetDate);
  if (existingIdx >= 0) {
    return { day: daysList[existingIdx], list: daysList, isNew: false };
  }

  const parts = targetDate.split('-');
  const dayNum = parseInt(parts[2] || '1', 10);
  const newDay: DayRecord = {
    id: `day-${targetDate}`,
    dayNumber: isNaN(dayNum) ? 1 : dayNum,
    date: targetDate,
    dayTitle: `يوم ${isNaN(dayNum) ? targetDate : dayNum}`,
    isClosed: false,
    notes: `يومية تاريخ ${targetDate}`,
    accessories: [],
    phones: [],
    maintenance: [],
    recharge: {
      totalWithoutProfit: 0,
      totalWithProfit: 0,
      totalProfit: 0,
    },
    returns: [],
    expenses: [],
    musabHouse: [],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [],
    updatedAt: new Date().toISOString(),
  };

  return { day: newDay, list: [newDay, ...daysList], isNew: true };
}

/**
 * دمج معاملة جديدة أو معدلة داخل سجل اليومية المقابل لتاريخها
 */
export function syncTransactionIntoDays(tx: Transaction, daysList: DayRecord[]): DayRecord[] {
  if (!tx || !tx.date) return daysList;

  const { day, list } = getOrCreateDayInList(tx.date, daysList);
  const updatedDay: DayRecord = { ...day, updatedAt: new Date().toISOString() };

  // 1. مبيعات الإكسسوارات
  if (tx.category === 'accessories' || (tx.type === 'sale' && tx.category !== 'phones')) {
    const accs = [...(updatedDay.accessories || [])];
    const idx = accs.findIndex((a) => a.id === tx.id);
    const item: AccessoryItem = {
      id: tx.id,
      name: tx.description,
      price: tx.price,
      cost: tx.cost || 0,
      profit: tx.profit || (tx.price - (tx.cost || 0)),
      qty: tx.quantity || 1,
      notes: tx.notes || (tx.time ? `الوقت: ${tx.time}` : undefined),
    };
    if (idx >= 0) {
      accs[idx] = item;
    } else {
      accs.push(item);
    }
    updatedDay.accessories = accs;
  }

  // 2. عمليات الصيانة
  else if (tx.category === 'maintenance' || tx.type === 'maintenance') {
    const maints = [...(updatedDay.maintenance || [])];
    const idx = maints.findIndex((m) => m.id === tx.id);
    const item: MaintenanceItem = {
      id: tx.id,
      deviceOrService: tx.description,
      price: tx.price,
      cost: tx.cost || 0,
      profit: tx.profit || (tx.price - (tx.cost || 0)),
      type: 'أخرى',
      status: 'خالص',
      technician: tx.technicianName || 'المهندس',
      notes: tx.notes || (tx.time ? `الوقت: ${tx.time}` : undefined),
    };
    if (idx >= 0) {
      maints[idx] = item;
    } else {
      maints.push(item);
    }
    updatedDay.maintenance = maints;
  }

  // 3. مبيعات الهواتف
  else if (tx.category === 'phones') {
    const phones = [...(updatedDay.phones || [])];
    const idx = phones.findIndex((p) => p.id === tx.id);
    const item: PhoneItem = {
      id: tx.id,
      model: tx.description,
      name: tx.description,
      salePrice: tx.price,
      purchaseCost: tx.cost || 0,
      cost: tx.cost || 0,
      paidAmount: tx.price,
      profit: tx.profit || (tx.price - (tx.cost || 0)),
      status: 'تم الدفع بالكامل',
      notes: tx.notes || (tx.time ? `الوقت: ${tx.time}` : undefined),
    };
    if (idx >= 0) {
      phones[idx] = item;
    } else {
      phones.push(item);
    }
    updatedDay.phones = phones;
  }

  // 4. الرصيد والباقات والشبكات
  else if (tx.category === 'balance' || tx.type?.startsWith('balance') || tx.category === 'sims') {
    const prevRecharge = updatedDay.recharge || { totalWithoutProfit: 0, totalWithProfit: 0, totalProfit: 0 };
    const profitVal = tx.profit || 0;
    updatedDay.recharge = {
      totalWithProfit: (prevRecharge.totalWithProfit || 0) + tx.price,
      totalWithoutProfit: Math.max(0, ((prevRecharge.totalWithProfit || 0) + tx.price) - ((prevRecharge.totalProfit || 0) + profitVal)),
      totalProfit: (prevRecharge.totalProfit || 0) + profitVal,
    };
  }

  // 5. صرفة بيت مصعب
  else if (tx.type === 'expense_home_mosaab') {
    const house = [...(updatedDay.musabHouse || [])];
    const idx = house.findIndex((h) => h.id === tx.id);
    const item: MusabItem = {
      id: tx.id,
      description: tx.description,
      amount: tx.price || tx.amount || 0,
      type: 'بيت مصعب',
      notes: tx.notes,
    };
    if (idx >= 0) house[idx] = item;
    else house.push(item);
    updatedDay.musabHouse = house;
  }

  // 6. سحب مصعب شخصي ومشتريات
  else if (tx.type === 'withdrawal_mosaab' || tx.type === 'mosaab_purchases_fund') {
    const pers = [...(updatedDay.musabPersonal || [])];
    const idx = pers.findIndex((p) => p.id === tx.id);
    const item: MusabItem = {
      id: tx.id,
      description: tx.description,
      amount: tx.price || tx.amount || 0,
      type: 'مصعب شخصياً',
      notes: tx.notes,
    };
    if (idx >= 0) pers[idx] = item;
    else pers.push(item);
    updatedDay.musabPersonal = pers;
  }

  // 7. مصاريف المحل والمودم
  else if (tx.type === 'expense_shop' || tx.type === 'expense_modem' || tx.category === 'expenses') {
    const exps = [...(updatedDay.expenses || [])];
    const idx = exps.findIndex((e) => e.id === tx.id);
    const item: ExpenseItem = {
      id: tx.id,
      description: tx.description,
      amount: tx.price || tx.amount || 0,
      category: tx.type === 'expense_modem' ? 'مودم واشتراكات' : 'صرفة المحل',
      notes: tx.notes,
    };
    if (idx >= 0) exps[idx] = item;
    else exps.push(item);
    updatedDay.expenses = exps;
  }

  // 8. حوالات وتوريد الموردين
  else if (tx.supplierName || tx.type === 'purchase' || tx.type === 'transfer_to_supplier') {
    const sups = [...(updatedDay.supplierTransfers || [])];
    const idx = sups.findIndex((s) => s.id === tx.id);
    const item: SupplierTransferItem = {
      id: tx.id,
      supplierName: tx.supplierName || 'مورد بضاعة',
      amountSent: tx.price || tx.amount || 0,
      purchasesReceivedValue: tx.cost || 0,
      notes: tx.notes,
    };
    if (idx >= 0) sups[idx] = item;
    else sups.push(item);
    updatedDay.supplierTransfers = sups;
  }

  return list.map((d) => (d.date === tx.date ? updatedDay : d));
}

/**
 * إزالة معاملة محذوفة من سجل الأيام المقابل
 */
export function removeTransactionFromDays(txId: string, daysList: DayRecord[]): DayRecord[] {
  return daysList.map((d) => {
    let changed = false;
    const accs = (d.accessories || []).filter((a) => a.id !== txId);
    if (accs.length !== (d.accessories || []).length) changed = true;

    const maints = (d.maintenance || []).filter((m) => m.id !== txId);
    if (maints.length !== (d.maintenance || []).length) changed = true;

    const phones = (d.phones || []).filter((p) => p.id !== txId);
    if (phones.length !== (d.phones || []).length) changed = true;

    const exps = (d.expenses || []).filter((e) => e.id !== txId);
    if (exps.length !== (d.expenses || []).length) changed = true;

    const house = (d.musabHouse || []).filter((h) => h.id !== txId);
    if (house.length !== (d.musabHouse || []).length) changed = true;

    const pers = (d.musabPersonal || []).filter((p) => p.id !== txId);
    if (pers.length !== (d.musabPersonal || []).length) changed = true;

    const sups = (d.supplierTransfers || []).filter((s) => s.id !== txId);
    if (sups.length !== (d.supplierTransfers || []).length) changed = true;

    if (!changed) return d;

    return {
      ...d,
      accessories: accs,
      maintenance: maints,
      phones,
      expenses: exps,
      musabHouse: house,
      musabPersonal: pers,
      supplierTransfers: sups,
      updatedAt: new Date().toISOString(),
    };
  });
}
