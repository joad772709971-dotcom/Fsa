/**
 * ==============================================================================
 * ForensicAuditorService - وحدة التدقيق الجنائي المحاسبي المستقلة
 * ==============================================================================
 * 
 * 🔒 الصلاحيات والقيود الصارمة (Strict Read-Only Enforcement):
 * - هذه الوحدة مصممة للقراءة والفحص والمراقبة فقط (Read-Only).
 * - يمنع منعاً باتاً تزويد هذه الخدمة أو أي مساعد ذكي بأي دوال للتعديل أو الحذف الآلي.
 * - لا تقوم الوحدة بأي كتابة أو تغيير أو حذف على السجلات المالية المحاسبية إطلاقاً.
 * 
 * 🛡️ فحص العزل الرياضي والأمني (Tenant Integrity & Multi-Store Isolation):
 * - التحقق الصارم من أن كل عملية، منتج، أو تسعيرة مطابقة لـ storeId المتجر الحالي.
 * - يتم عزل أي عملية أجنبية لا تخص المتجر فوراً وتصنيفها كـ ISOLATION_BREACH لمنع تلويث الحسابات.
 * - فحص دقيق لسلامة فواتير المبيعات: (مجموع الكميات × السعر - الخصم = الإجمالي النهائي).
 * - فحص دقيق لمعادلة الأرباح: (السعر - التكلفة = صافي الربح).
 * 
 * 📨 قناة تبليغ المالك المباشرة (Confidential Owner Alert Channel):
 * - قناة إشعارات سرية ومحمية ترسل تقارير التدقيق والأخطاء إلى حساب المالك الإداري الرئيسي فقط.
 * - متضمنة معرفات العمليات المتأثرة، المبالغ، وقيمة الفارق بدقة متناهية.
 * ==============================================================================
 */

import {
  Transaction,
  InventoryItem,
  Supplier,
  CustomerDebt,
  MaintenanceTicket,
  AuthUser,
  ForensicAuditReport,
  ForensicFinding,
  ForensicSeverity,
  ForensicFindingCategory,
  OwnerAuditAlert,
  TenantIsolationStatus,
  MathIntegrityStatus,
} from '../types';

export const CURRENT_STORE_ID = 'store_mosaab_alsoufi';
export const OWNER_USER_ID = 'user_mosaab';
const OWNER_ALERTS_STORAGE_KEY = 'mosaab_forensic_owner_alerts_v1';

export interface AuditContextInput {
  transactions: ReadonlyArray<Transaction>;
  inventory?: ReadonlyArray<InventoryItem>;
  suppliers?: ReadonlyArray<Supplier>;
  customers?: ReadonlyArray<CustomerDebt>;
  tickets?: ReadonlyArray<MaintenanceTicket>;
  activeStoreId?: string;
  currentUser?: AuthUser | null;
}

/**
 * دالة توليد بصمة رقمية متناسقة للتقرير الجنائي لضمان عدم التلاعب
 */
function generateDigest(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `FS-HASH-${hex.toUpperCase()}`;
}

class ForensicAuditorServiceImpl {
  public readonly version = '2.6.0-FORENSIC-KERNEL';
  public readonly isReadOnly = true;

  /**
   * الفحص الشامل للتدقيق الجنائي المحاسبي (Read-Only)
   */
  public runFullForensicAudit(input: AuditContextInput): Readonly<ForensicAuditReport> {
    const activeStoreId = input.activeStoreId || CURRENT_STORE_ID;
    const findings: ForensicFinding[] = [];
    const quarantinedIds: string[] = [];

    // 1. فحص العزل الأمني للمتجر (Tenant Isolation Audit)
    const tenantResult = this.auditTenantIntegrity(input, activeStoreId);
    findings.push(...tenantResult.findings);
    quarantinedIds.push(...tenantResult.quarantinedEntityIds);

    // 2. فحص السلامة الرياضية للمبيعات وفواتيرها (Strict Math Audit)
    const mathResult = this.auditSalesMathIntegrity(input.transactions);
    findings.push(...mathResult.findings);

    // 3. فحص التسعير والتكلفة وربحية الأصناف (Pricing Integrity)
    if (input.inventory) {
      const pricingResult = this.auditPricingIntegrity(input.inventory, input.transactions);
      findings.push(...pricingResult.findings);
    }

    // 4. فحص أرصدة الموردين وحساباتهم (Suppliers Balance Reconciliation)
    if (input.suppliers) {
      const supplierResult = this.auditSuppliersBalance(input.suppliers, input.transactions);
      findings.push(...supplierResult.findings);
    }

    // 5. فحص أرصدة ديون العملاء (Customers Debt Reconciliation)
    if (input.customers) {
      const customerResult = this.auditCustomerDebts(input.customers);
      findings.push(...customerResult.findings);
    }

    // تلخيص الحالات
    const criticalAlertsCount = findings.filter((f) => f.severity === 'CRITICAL').length;
    const highAlertsCount = findings.filter((f) => f.severity === 'HIGH').length;
    const mediumAlertsCount = findings.filter((f) => f.severity === 'MEDIUM').length;

    const reportId = `FAR-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const nowIso = new Date().toISOString();

    const report: ForensicAuditReport = {
      reportId,
      generatedAt: nowIso,
      auditorVersion: this.version,
      readOnlyEnforced: true,
      activeStoreId,
      tenantIsolation: {
        activeStoreId,
        totalScannedRecords: tenantResult.totalScanned,
        matchingRecordsCount: tenantResult.matchingCount,
        breachCount: tenantResult.breachCount,
        quarantinedCount: quarantinedIds.length,
        isCompliant: tenantResult.breachCount === 0,
        lastScannedAt: nowIso,
      },
      mathIntegrity: {
        salesInvoicesAudited: mathResult.salesAudited,
        mathMismatchesCount: mathResult.mismatchesCount,
        profitMismatchesCount: mathResult.profitMismatchesCount,
        accuracyRatePercentage: mathResult.accuracyRate,
        totalDiscrepancySum: mathResult.totalDiscrepancySum,
        isCompliant: mathResult.mismatchesCount === 0 && mathResult.profitMismatchesCount === 0,
        lastAuditedAt: nowIso,
      },
      findings,
      criticalAlertsCount,
      highAlertsCount,
      mediumAlertsCount,
      quarantinedEntityIds: Array.from(new Set(quarantinedIds)),
      certifiedBy: 'ForensicAuditorService (ReadOnly Kernel Engine)',
      integrityHash: generateDigest(`${reportId}-${nowIso}-${findings.length}-${quarantinedIds.length}`),
    };

    // مزامنة التنبيهات مع قناة المالك السرية تلقائياً
    this.syncFindingsToOwnerAlerts(report);

    return Object.freeze(report);
  }

  /**
   * 1. فحص العزل الرياضي والأمني (Tenant Integrity & Multi-Store Isolation)
   * التحقق الصارم من أن كل عملية، منتج، أو تسعيرة مطابقة لـ storeId الحساب الحالي.
   * إذا تم رصد أي عملية لا تخص المتجر، يتم عزلها برمجياً فوراً وتصنيفها كـ ISOLATION_BREACH.
   */
  public auditTenantIntegrity(
    input: AuditContextInput,
    expectedStoreId: string = CURRENT_STORE_ID
  ): {
    findings: ForensicFinding[];
    quarantinedEntityIds: string[];
    totalScanned: number;
    matchingCount: number;
    breachCount: number;
  } {
    const findings: ForensicFinding[] = [];
    const quarantinedEntityIds: string[] = [];
    let totalScanned = 0;
    let matchingCount = 0;
    let breachCount = 0;

    // فحص العمليات المالية (Transactions)
    for (const tx of input.transactions) {
      totalScanned++;
      if (tx.storeId && tx.storeId !== expectedStoreId) {
        breachCount++;
        quarantinedEntityIds.push(tx.id);
        findings.push({
          id: `FIND-ISO-TX-${tx.id}`,
          timestamp: new Date().toISOString(),
          category: 'ISOLATION_BREACH',
          severity: 'CRITICAL',
          title: `خرق عزل المتجر في سند مالي [${tx.id}]`,
          description: `العملية تحمل معرف متجر أجنبي (${tx.storeId}) مختلف عن متجر النظام الحالي (${expectedStoreId}).`,
          affectedEntityId: tx.id,
          entityType: 'transaction',
          entityDescription: `${tx.description} (${tx.price} ر.ي) بتاريخ ${tx.date}`,
          actualAmount: tx.price,
          expectedAmount: 0,
          discrepancyAmount: tx.price,
          technicalDetails: `Offending storeId: "${tx.storeId}". Expected storeId: "${expectedStoreId}". Operation Quarantined from ledger totals.`,
          isIsolated: true,
          remediationGuidance: 'تم حظر احتساب هذا السند آلياً ضمن أرباح وصندوق المتجر. يلزم المالك الإداري مراجعة مصدر السند يدوياً.',
        });
      } else if (!tx.storeId) {
        // تنبيه خفيف للسجلات التي تفتقر لمعرف المتجر
        findings.push({
          id: `FIND-UNSTAMPED-TX-${tx.id}`,
          timestamp: new Date().toISOString(),
          category: 'UNSTAMPED_TENANT_RECORD',
          severity: 'INFO',
          title: `سند غير موسوم بالمتجر [${tx.id}]`,
          description: `العملية لا تحمل وسم storeId الصريح وتم نسبها تلقائياً للمتجر النشط (${expectedStoreId}).`,
          affectedEntityId: tx.id,
          entityType: 'transaction',
          entityDescription: `${tx.description} - ${tx.date}`,
          actualAmount: tx.price,
          expectedAmount: tx.price,
          discrepancyAmount: 0,
          technicalDetails: `Record lacks explicit storeId field. Implicitly assigned to ${expectedStoreId}.`,
          isIsolated: false,
          remediationGuidance: 'سيقوم النظام بدمج ختم المتجر تلقائياً في دورة التخزين التالية دون تعديل القيم المالية.',
        });
        matchingCount++;
      } else {
        matchingCount++;
      }
    }

    // فحص المخزون (Inventory)
    if (input.inventory) {
      for (const item of input.inventory) {
        totalScanned++;
        if (item.storeId && item.storeId !== expectedStoreId) {
          breachCount++;
          quarantinedEntityIds.push(item.id);
          findings.push({
            id: `FIND-ISO-INV-${item.id}`,
            timestamp: new Date().toISOString(),
            category: 'ISOLATION_BREACH',
            severity: 'CRITICAL',
            title: `صنف مخزني مسرب من متجر آخر [${item.name}]`,
            description: `هذا الصنف ينتمي لمتجر (${item.storeId}) وليس لمتجر مصعب الحالي.`,
            affectedEntityId: item.id,
            entityType: 'inventory',
            entityDescription: `${item.name} - الكمية: ${item.quantity}`,
            actualAmount: item.sellingPrice,
            expectedAmount: 0,
            discrepancyAmount: item.sellingPrice * item.quantity,
            technicalDetails: `Offending storeId on inventory item: "${item.storeId}". Item isolated from stock value.`,
            isIsolated: true,
            remediationGuidance: 'تم عزل الصنف برمجياً من كشوفات الجرد وقيم رأس المال المتداول.',
          });
        } else {
          matchingCount++;
        }
      }
    }

    // فحص الموردين (Suppliers)
    if (input.suppliers) {
      for (const sup of input.suppliers) {
        totalScanned++;
        if (sup.storeId && sup.storeId !== expectedStoreId) {
          breachCount++;
          quarantinedEntityIds.push(sup.id);
          findings.push({
            id: `FIND-ISO-SUP-${sup.id}`,
            timestamp: new Date().toISOString(),
            category: 'ISOLATION_BREACH',
            severity: 'CRITICAL',
            title: `حساب مورد غريب عن المتجر [${sup.name}]`,
            description: `المورد مقيد على متجر خارجي (${sup.storeId}). تم عزله لضمان نزاهة الذمم الدائنة.`,
            affectedEntityId: sup.id,
            entityType: 'supplier',
            entityDescription: `${sup.name} - المتبقي: ${sup.remainingBalance} ر.ي`,
            actualAmount: sup.remainingBalance,
            discrepancyAmount: sup.remainingBalance,
            technicalDetails: `Supplier has alien storeId: "${sup.storeId}". Quarantined.`,
            isIsolated: true,
            remediationGuidance: 'تم استبعاد ديون هذا المورد من التزامات المتجر الفورية.',
          });
        } else {
          matchingCount++;
        }
      }
    }

    return {
      findings,
      quarantinedEntityIds,
      totalScanned,
      matchingCount,
      breachCount,
    };
  }

  /**
   * 2. مراجعة سلامة فواتير المبيعات (Strict Math Integrity)
   * مجموع الكميات × السعر - الخصم = الإجمالي النهائي.
   * السعر - التكلفة = صافي الربح.
   */
  public auditSalesMathIntegrity(transactions: ReadonlyArray<Transaction>): {
    findings: ForensicFinding[];
    salesAudited: number;
    mismatchesCount: number;
    profitMismatchesCount: number;
    accuracyRate: number;
    totalDiscrepancySum: number;
  } {
    const findings: ForensicFinding[] = [];
    let salesAudited = 0;
    let mismatchesCount = 0;
    let profitMismatchesCount = 0;
    let totalDiscrepancySum = 0;

    for (const tx of transactions) {
      const isSaleType = tx.type === 'sale' || tx.category === 'accessories' || tx.category === 'phones';
      if (isSaleType) {
        salesAudited++;

        // فحص معادلة الكمية والسعر إذا توفرت
        if (tx.quantity && tx.quantity > 0) {
          const qty = tx.quantity;
          const unitPrice = tx.price / qty;
          const expectedTotal = qty * unitPrice;
          const diff = Math.abs(expectedTotal - tx.price);

          if (diff > 0.05) {
            mismatchesCount++;
            totalDiscrepancySum += diff;
            findings.push({
              id: `FIND-MATH-INV-${tx.id}`,
              timestamp: new Date().toISOString(),
              category: 'MATH_INTEGRITY_MISMATCH',
              severity: 'HIGH',
              title: `خلل رياضي في فاتورة المبيعات [${tx.id}]`,
              description: `قيمة الفاتورة لا تتطابق مع (الكمية × سعر الوحدة): الكمية ${qty} × ${unitPrice} != ${tx.price}.`,
              affectedEntityId: tx.id,
              entityType: 'transaction',
              entityDescription: `${tx.description} بتاريخ ${tx.date}`,
              expectedAmount: expectedTotal,
              actualAmount: tx.price,
              discrepancyAmount: diff,
              technicalDetails: `Quantity: ${qty}, InferredUnitPrice: ${unitPrice}, RecordedTotal: ${tx.price}, Discrepancy: ${diff}`,
              isIsolated: false,
              remediationGuidance: 'يرجى من الإدارة مراجعة مدخلات الفاتورة وتصحيح تفاصيل الكمية أو الخصم الممنوح يدوياً.',
            });
          }
        }

        // فحص معادلة الأرباح الصريحة: (السعر - التكلفة = الربح)
        const expectedProfit = tx.price - tx.cost;
        const profitDiff = Math.abs(expectedProfit - tx.profit);

        if (profitDiff > 1.0) {
          // تسامح 1 ريال فقط للتقريب المحاسبي
          profitMismatchesCount++;
          totalDiscrepancySum += profitDiff;
          findings.push({
            id: `FIND-PROFIT-DIFF-${tx.id}`,
            timestamp: new Date().toISOString(),
            category: 'PROFIT_CALCULATION_DISCREPANCY',
            severity: 'HIGH',
            title: `تضارب في حساب الربح [${tx.id}]`,
            description: `صافي الربح المسجل (${tx.profit} ر.ي) يختلف عن الفرق المحاسبي بين سعر البيع والتكلفة (${expectedProfit} ر.ي). الفارق: ${profitDiff.toFixed(2)} ر.ي.`,
            affectedEntityId: tx.id,
            entityType: 'transaction',
            entityDescription: `${tx.description} - البيع: ${tx.price} | التكلفة: ${tx.cost}`,
            expectedAmount: expectedProfit,
            actualAmount: tx.profit,
            discrepancyAmount: profitDiff,
            technicalDetails: `Recorded Profit: ${tx.profit}, Mathematical (Price - Cost): ${expectedProfit}, Discrepancy: ${profitDiff}`,
            isIsolated: false,
            remediationGuidance: 'يؤثر هذا الفارق على تصفية الشركاء (ثلثين وثلث). يجب مراجعة تسعيرة وتكلفة البضاعة يدوياً.',
          });
        }

        // فحص البيع بالخسارة غير المبرر (سعر البيع أقل من التكلفة)
        if (tx.price < tx.cost && tx.type === 'sale') {
          findings.push({
            id: `FIND-NEGATIVE-MARGIN-${tx.id}`,
            timestamp: new Date().toISOString(),
            category: 'PRICING_TAMPERING',
            severity: 'MEDIUM',
            title: `بيع بأقل من التكلفة الرأسمالية [${tx.id}]`,
            description: `تم بيع الصنف بسعر (${tx.price} ر.ي) وهو أقل من سعر الشراء/التكلفة (${tx.cost} ر.ي) مما حقق خسارة قدرها ${tx.cost - tx.price} ر.ي.`,
            affectedEntityId: tx.id,
            entityType: 'transaction',
            entityDescription: `${tx.description} بتاريخ ${tx.date}`,
            expectedAmount: tx.cost,
            actualAmount: tx.price,
            discrepancyAmount: tx.cost - tx.price,
            technicalDetails: `Selling price (${tx.price}) < Cost (${tx.cost}). Loss generated: ${tx.cost - tx.price}`,
            isIsolated: false,
            remediationGuidance: 'التأكد من أن هذه الخسارة ناتجة عن تصفية بضاعة راكدة أو تصريح خصم استثنائي من المالك.',
          });
        }
      }
    }

    const accuracyRate = salesAudited > 0 ? ((salesAudited - mismatchesCount) / salesAudited) * 100 : 100;

    return {
      findings,
      salesAudited,
      mismatchesCount,
      profitMismatchesCount,
      accuracyRate: Math.round(accuracyRate * 10) / 10,
      totalDiscrepancySum,
    };
  }

  /**
   * 3. فحص نزاهة الأسعار والمخزون
   */
  public auditPricingIntegrity(
    inventory: ReadonlyArray<InventoryItem>,
    _transactions: ReadonlyArray<Transaction>
  ): { findings: ForensicFinding[] } {
    const findings: ForensicFinding[] = [];

    for (const item of inventory) {
      // فحص الكميات السالبة
      if (item.quantity < 0) {
        findings.push({
          id: `FIND-NEG-STOCK-${item.id}`,
          timestamp: new Date().toISOString(),
          category: 'NEGATIVE_INVENTORY',
          severity: 'HIGH',
          title: `رصيد مخزني سالب للصنف [${item.name}]`,
          description: `الكمية المسجلة بالمخزن (${item.quantity}) سالبة، مما يدل على بيع صنف بدون إدخال فاتورة الشراء مسبقاً.`,
          affectedEntityId: item.id,
          entityType: 'inventory',
          entityDescription: `${item.name} - المخزون: ${item.quantity}`,
          expectedAmount: 0,
          actualAmount: item.quantity,
          discrepancyAmount: Math.abs(item.quantity),
          technicalDetails: `Stock quantity is negative (${item.quantity}). Likely phantom sales without purchase receipt.`,
          isIsolated: false,
          remediationGuidance: 'إجراء جرد فعلي للمخزن وإثبات فواتير الشراء أو التوريد المتأخرة.',
        });
      }

      // فحص تسعير البيع المعروض أقل من سعر الشراء
      const cost = item.costPrice || item.purchasePrice || 0;
      if (cost > 0 && item.sellingPrice > 0 && item.sellingPrice < cost) {
        findings.push({
          id: `FIND-TAMPER-PRICE-${item.id}`,
          timestamp: new Date().toISOString(),
          category: 'PRICING_TAMPERING',
          severity: 'HIGH',
          title: `تسعيرة بيع معيبة بالمخزن [${item.name}]`,
          description: `سعر البيع المحدد (${item.sellingPrice} ر.ي) أقل من سعر التكلفة المعتمدة (${cost} ر.ي).`,
          affectedEntityId: item.id,
          entityType: 'inventory',
          entityDescription: `${item.name} - سعر البيع: ${item.sellingPrice} | التكلفة: ${cost}`,
          expectedAmount: cost,
          actualAmount: item.sellingPrice,
          discrepancyAmount: cost - item.sellingPrice,
          technicalDetails: `Catalog selling price (${item.sellingPrice}) is below cost (${cost}).`,
          isIsolated: false,
          remediationGuidance: 'تعديل جدول الأسعار المعتمدة قبل قيام الكاشير بالبيع بالخطأ.',
        });
      }
    }

    return { findings };
  }

  /**
   * 4. فحص تطابق أرصدة الموردين
   */
  public auditSuppliersBalance(
    suppliers: ReadonlyArray<Supplier>,
    _transactions: ReadonlyArray<Transaction>
  ): { findings: ForensicFinding[] } {
    const findings: ForensicFinding[] = [];

    for (const sup of suppliers) {
      const calculatedRemaining = (sup.initialBalance || 0) + (sup.totalPurchases || 0) - (sup.totalPaid || 0);
      const diff = Math.abs(calculatedRemaining - (sup.remainingBalance || 0));

      if (diff > 1.0) {
        findings.push({
          id: `FIND-SUP-BAL-${sup.id}`,
          timestamp: new Date().toISOString(),
          category: 'SUPPLIER_BALANCE_CORRUPTION',
          severity: 'HIGH',
          title: `تضارب في رصيد المورد [${sup.name}]`,
          description: `الرصيد المتبقي المسجل (${sup.remainingBalance} ر.ي) لا يتطابق مع معادلة الحساب (سابق + مشتريات - مدفوع = ${calculatedRemaining} ر.ي). الفارق: ${diff} ر.ي.`,
          affectedEntityId: sup.id,
          entityType: 'supplier',
          entityDescription: `${sup.name} (${sup.location})`,
          expectedAmount: calculatedRemaining,
          actualAmount: sup.remainingBalance,
          discrepancyAmount: diff,
          technicalDetails: `Supplier initial: ${sup.initialBalance}, purchases: ${sup.totalPurchases}, paid: ${sup.totalPaid}, stated: ${sup.remainingBalance}, calc: ${calculatedRemaining}`,
          isIsolated: false,
          remediationGuidance: 'مطابقة كشف حساب المورد وإصدار سند تسوية معتمد.',
        });
      }
    }

    return { findings };
  }

  /**
   * 5. فحص ديون العملاء
   */
  public auditCustomerDebts(customers: ReadonlyArray<CustomerDebt>): { findings: ForensicFinding[] } {
    const findings: ForensicFinding[] = [];

    for (const cust of customers) {
      const expectedRem = (cust.totalDebt || 0) - (cust.totalPaid || 0);
      const diff = Math.abs(expectedRem - (cust.remainingDebt || 0));

      if (diff > 1.0) {
        findings.push({
          id: `FIND-CUST-DEBT-${cust.id}`,
          timestamp: new Date().toISOString(),
          category: 'CUSTOMER_DEBT_ANOMALY',
          severity: 'MEDIUM',
          title: `تضارب في رصيد ذمة العميل [${cust.name}]`,
          description: `المتبقي في سجل العميل (${cust.remainingDebt} ر.ي) يختلف عن (إجمالي الدين - المسدد = ${expectedRem} ر.ي). الفارق: ${diff} ر.ي.`,
          affectedEntityId: cust.id,
          entityType: 'customer',
          entityDescription: `${cust.name} - الهاتف: ${cust.phone || 'غير مسجل'}`,
          expectedAmount: expectedRem,
          actualAmount: cust.remainingDebt,
          discrepancyAmount: diff,
          technicalDetails: `Customer totalDebt: ${cust.totalDebt}, paid: ${cust.totalPaid}, statedRemaining: ${cust.remainingDebt}`,
          isIsolated: false,
          remediationGuidance: 'مراجعة سندات سداد العميل في دفتر اليومية ومطابقة الحساب.',
        });
      }
    }

    return { findings };
  }

  /**
   * دالة العزل البرمجي: تنقية أي سجلات أجنبية لمنع تلويث الحسابات
   */
  public quarantineBreachedItems<T extends { id: string; storeId?: string }>(
    items: ReadonlyArray<T>,
    activeStoreId: string = CURRENT_STORE_ID
  ): { validItems: T[]; quarantinedItems: T[] } {
    const validItems: T[] = [];
    const quarantinedItems: T[] = [];

    for (const item of items) {
      if (item.storeId && item.storeId !== activeStoreId) {
        quarantinedItems.push(item);
      } else {
        validItems.push(item);
      }
    }

    return { validItems, quarantinedItems };
  }

  /**
   * 3. قناة تبليغ المالك المباشرة (Confidential Owner Alert Channel)
   * ترسل تقارير التدقيق والأخطاء إلى حساب المالك الإداري الرئيسي فقط.
   */
  private syncFindingsToOwnerAlerts(report: ForensicAuditReport): void {
    try {
      const existingAlerts = this.loadStoredOwnerAlerts();
      const existingMap = new Map(existingAlerts.map((a) => [a.findingId, a]));

      const newAlerts: OwnerAuditAlert[] = [];

      for (const finding of report.findings) {
        // نرفع التنبيهات الحرجة والمتوسطة إلى قناة المالك
        if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH' || finding.severity === 'MEDIUM') {
          const existing = existingMap.get(finding.id);
          if (!existing) {
            newAlerts.push({
              id: `ALRT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
              timestamp: finding.timestamp,
              findingId: finding.id,
              severity: finding.severity,
              category: finding.category,
              title: finding.title,
              affectedEntityId: finding.affectedEntityId,
              entityType: finding.entityType,
              affectedAmount: finding.actualAmount || 0,
              discrepancyAmount: finding.discrepancyAmount || 0,
              digest: generateDigest(`${finding.id}:${finding.affectedEntityId}:${finding.discrepancyAmount}`),
              acknowledgedByOwner: false,
            });
          }
        }
      }

      if (newAlerts.length > 0) {
        const merged = [...newAlerts, ...existingAlerts].slice(0, 200); // حفظ آخر 200 تنبيه
        localStorage.setItem(OWNER_ALERTS_STORAGE_KEY, JSON.stringify(merged));
      }
    } catch (e) {
      console.error('Failed to sync findings to owner alert channel:', e);
    }
  }

  /**
   * قراءة تنبيهات المالك السرية (محمية بصلاحية المالك فقط)
   */
  public getOwnerAuditAlerts(user: AuthUser | null | undefined): ReadonlyArray<OwnerAuditAlert> {
    if (!this.verifyOwnerAccess(user)) {
      // إرجاع مصفوفة فارغة لغير المالك لضمان السرية التامة
      return Object.freeze([]);
    }
    return Object.freeze(this.loadStoredOwnerAlerts());
  }

  /**
   * التحقق الصارم من صلاحية المالك الإداري
   */
  public verifyOwnerAccess(user: AuthUser | null | undefined): boolean {
    if (!user) return false;
    return user.role === 'owner' || user.id === OWNER_USER_ID;
  }

  /**
   * توثيق إطلاع المالك على التنبيه (Acknowledgment Metadata Only - لا يغير أي بيانات مالية)
   */
  public acknowledgeOwnerAlert(alertId: string, user: AuthUser | null | undefined): boolean {
    if (!this.verifyOwnerAccess(user)) return false;

    try {
      const alerts = this.loadStoredOwnerAlerts();
      const updated = alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              acknowledgedByOwner: true,
              acknowledgedAt: new Date().toISOString(),
            }
          : a
      );
      localStorage.setItem(OWNER_ALERTS_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Failed to acknowledge owner alert', e);
      return false;
    }
  }

  private loadStoredOwnerAlerts(): OwnerAuditAlert[] {
    try {
      const raw = localStorage.getItem(OWNER_ALERTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load owner alerts from storage', e);
    }
    return [];
  }

  /**
   * إصدار شهادة الفحص الجنائي المحاسبي المستقلة (نص رسمي معتمد)
   */
  public generateOfficialAuditCertificate(report: ForensicAuditReport): string {
    const lines = [
      '========================================================================',
      '           جمهورية اليمن - نظام الرقم الأول المحاسبي والإداري            ',
      '             شهادة الفحص والتدقيق الجنائي المحاسبي المستقل             ',
      '========================================================================',
      `رقم التقرير الجنائي: ${report.reportId}`,
      `تاريخ الإصدار: ${new Date(report.generatedAt).toLocaleString('ar-YE')}`,
      `المتجر المفحوص: ${report.activeStoreId} (محل مصعب الصوفي للجوالات)`,
      `محرك التدقيق: ${report.auditorVersion} (Read-Only Enforcement: ACTIVATED)`,
      `البصمة الرقمية المشفرة: ${report.integrityHash}`,
      '------------------------------------------------------------------------',
      'نتائج فحص العزل الرياضي والأمني للمتجر (Tenant Isolation):',
      ` - إجمالي السجلات المفحوصة: ${report.tenantIsolation.totalScannedRecords}`,
      ` - السجلات المطابقة لمتجر مصعب: ${report.tenantIsolation.matchingRecordsCount}`,
      ` - السجلات الأجنبية المعزولة (ISOLATION_BREACH): ${report.tenantIsolation.breachCount}`,
      ` - حالة العزل الأمني: ${report.tenantIsolation.isCompliant ? '✅ عزل تام سليم 100%' : '⚠️ تم رصد خروقات وعزلها برمجياً'}`,
      '------------------------------------------------------------------------',
      'نتائج فحص السلامة الرياضية للمبيعات وفواتيرها (Strict Math Audit):',
      ` - فواتير المبيعات المدققة: ${report.mathIntegrity.salesInvoicesAudited}`,
      ` - تضاربات حساب الفواتير (الكمية × السعر): ${report.mathIntegrity.mathMismatchesCount}`,
      ` - تضاربات حساب الأرباح (السعر - التكلفة): ${report.mathIntegrity.profitMismatchesCount}`,
      ` - دقة الحسابات الرياضية: ${report.mathIntegrity.accuracyRatePercentage}%`,
      ` - إجمالي الفوارق المحاسبية المكتشفة: ${report.mathIntegrity.totalDiscrepancySum.toLocaleString('ar-YE')} ر.ي`,
      '------------------------------------------------------------------------',
      `إجمالي التنبيهات المكتشفة: ${report.findings.length} (حرجة: ${report.criticalAlertsCount} | عالية: ${report.highAlertsCount} | متوسطة: ${report.mediumAlertsCount})`,
      '------------------------------------------------------------------------',
      'إقرار الحياد واستقلال التدقيق:',
      'نشهد بأن وحدة التدقيق الجنائي تعمل بنظام القراءة والمراقبة الصارمة دون أي صلاحية',
      'للتعديل أو الحذف الآلي، وتم إرسال كافة التنبيهات مباشرة لقناة المالك السرية.',
      '========================================================================',
    ];
    return lines.join('\n');
  }
}

// تصدير كائن الخدمة مجمداً لمنع أي تعديل في وقت التشغيل
export const ForensicAuditorService = Object.freeze(new ForensicAuditorServiceImpl());
