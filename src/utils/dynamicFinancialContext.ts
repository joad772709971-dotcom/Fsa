import { InventoryItem, Supplier, CustomerDebt } from '../types';

export interface DynamicFinancialSummary {
  mainAccountsText: string;
  currenciesText: string;
  inventoryCategoriesText: string;
  topStockItemsText: string;
  fullPromptSection: string;
}

/**
 * Builds a dynamic, live financial summary of the shop to inject into the AI system prompt.
 * This guarantees the AI assistant instantly recognizes accounts, currencies, and inventory items
 * without needing them to be re-explained each time.
 */
export function generateDynamicFinancialSummary(params: {
  suppliers?: Supplier[];
  inventory?: InventoryItem[];
  customers?: CustomerDebt[];
}): DynamicFinancialSummary {
  const { suppliers = [], inventory = [], customers = [] } = params;

  // 1. Main Accounts Summary
  const activeSuppliers = suppliers
    .filter((s) => s && s.name)
    .map((s) => `• مورد: ${s.name} (${s.notes || s.type || 'قطع وبضاعة'}) - مستحقاته الحالية: ${(s.remainingBalance || 0).toLocaleString()} ر.ي`);

  const activeDebtors = customers
    .filter((c) => c && c.name && (c.remainingDebt || 0) > 0)
    .slice(0, 8)
    .map((c) => `• عميل/زبون آجل: ${c.name} - مديونيته: ${(c.remainingDebt || 0).toLocaleString()} ر.ي`);

  const mainAccountsLines = [
    '1. [الصندوق العام / الدرج اليومي]: الخزينة النقدية الرئيسية لمقبوضات ومصروفات المحل اليومية.',
    '2. [حساب المالك - مصعب الصوفي]: يستحق ثلثين (2/3) من صافي أرباح المحل، وتخصم منه مسحوباته الشخصية وصرفة البيت.',
    '3. [حساب المدير المستلم]: يستحق ثلث (1/3) من صافي أرباح المحل، وله صرفة يومية ثابتة 2,000 ر.ي كعهدة عمل.',
    '4. [حساب مهندس الصيانة]: يستحق 50% من صافي فايدة الصيانة، وصرفة غدائه على المحل، وتخصم مسحوباته من مستحقاته.',
    '5. [حساب العامل]: صرفيات وأجور العمالة المساعدة بالمحل (مثل حمدان أو العامل الميداني).',
    '6. [حساب شبكة الهادي (محمد مياس)]: تغذية وحوالات ومبيعات رصيد اتصالات وفورجي وباقات (تطبيق الهادي).',
    '7. [حساب شبكة القمة / الرقم (فايز أبو علي)]: تغذية وحوالات ومبيعات رصيد وباقات فورية (تطبيق الرقم / القمة).',
    '8. [حسابات الموردين المعتمدين النشطة]:',
    ...(activeSuppliers.length > 0
      ? activeSuppliers
      : [
          '• مورد: مؤسسة العبصري لقطع الغيار (شاشات وبطاريات)',
          '• مورد: عمر القاسمي لقطع الصيانة (فلاتات وشواحن وقطع هواتف)',
          '• مورد: خليل الأغبري للإكسسوارات وقطع الغيار (شواحن، كفرات، وسماعات)',
          '• مورد: تاجر المصنف وتاجر صنعاء للجوالات',
        ]),
    '9. [حسابات الذمم المدينة والعملاء الآجلين]:',
    ...(activeDebtors.length > 0 ? activeDebtors : ['• لا توجد ديون عملاء معلقة حالياً']),
  ];
  const mainAccountsText = mainAccountsLines.join('\n');

  // 2. Currencies in Use
  const currenciesLines = [
    '• [الريال اليمني - YER / ر.ي]: العملة الأساسية والرسمية للمتجر ولكافة الحسابات واليومية والمخزن والتقارير.',
    '• [الريال السعودي - SAR]: عملة تداول فرعية للمشتريات أو الحوالات، تقيم بسعر الصرف المعتمد في السوق المحلي.',
    '• [الدولار الأمريكي - USD]: عملة تسعير وتداول للأجهزة والمشتريات الكبرى عند الحاجة.',
  ];
  const currenciesText = currenciesLines.join('\n');

  // 3. Inventory Categories and Shorthand Codes
  const categoriesLines = [
    '• [ج] جوالات (phones): هواتف ذكية وأجهزة مستعملة وجديدة (بيع، صيانة، شراء).',
    '• [ك] إكسسوارات (accessories): شواحن، كابلات، سماعات، كفرات، بطاريات، لواصق شاشة.',
    '• [ص] صيانة وقطع غيار (maintenance): شاشات، فلاتات، بطاريات صيانة، أيسيات، لحام، كشوفات أعطال.',
    '• [ش] شرايح (sims): شرايح يمن موبايل، يو، سبأفون جديدة وبدل فاقد.',
    '• [ر] رصيد وشبكات (balance): مبيعات وتغذية رصيد وباقات الهادي والقمة.',
    '• [م] بضاعة سابقة / مشتريات مخزن (inventory): إضافة بضاعة للمخزن وتوليد باركود تلقائي.',
  ];
  const inventoryCategoriesText = categoriesLines.join('\n');

  // 4. Sample Available Stock Items in Store
  const sampleStock = inventory
    .filter((it) => it && it.name && (it.quantity || 0) > 0)
    .slice(0, 15)
    .map((it) => {
      const cost = it.costPrice ?? it.purchasePrice ?? 0;
      const sale = it.sellingPrice ?? Math.round(cost * 1.35);
      return `• ${it.name} [${it.category || 'إكسسوار'}] (كمية: ${it.quantity} | تكلفة: ${cost.toLocaleString()} ر.ي | بيع مقترح: ${sale.toLocaleString()} ر.ي)`;
    });

  const topStockItemsText =
    sampleStock.length > 0
      ? sampleStock.join('\n')
      : '• شواحن أنكر 20W، سماعات بلوتوث، بطاريات سامسونج، كفرات حماية، شاشات أصلية.';

  // 5. Consolidated System Prompt Section
  const fullPromptSection = `
🏛️ السياق المالي والمحاسبي الحي والمحدث للمتجر (Live Dynamic Financial Context):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 1. أسماء الحسابات الرئيسية والدفاتر المعتمدة:
${mainAccountsText}

💵 2. العملات المستخدمة وأسعار الصرف:
${currenciesText}

📦 3. تصنيفات المخزن وأكواد الاختصارات المعتمدة:
${inventoryCategoriesText}

🏷️ 4. عينة من الأصناف المتوفرة حالياً في المخزن وأسعارها:
${topStockItemsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 ملاحظة ملزمة: تعرف فوراً على أسماء الحسابات والأصناف المذكورة أعلاه بمجرد أن ينطقها المستخدم أو يشير إليها دون الحاجة لأن يشرح لك من هو المورد أو ما هو الصنف.
`;

  return {
    mainAccountsText,
    currenciesText,
    inventoryCategoriesText,
    topStockItemsText,
    fullPromptSection,
  };
}
