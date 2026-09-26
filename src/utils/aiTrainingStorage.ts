export interface AITrainingRule {
  id: string;
  title: string;
  category: 'prices' | 'accounting' | 'maintenance' | 'customers' | 'policies' | 'vocabulary' | 'custom';
  content: string;
  exampleQuery?: string;
  expectedBehavior?: string;
  priority: 'high' | 'normal' | 'low';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'smart_ai_training_knowledge_v1';

export const DEFAULT_AI_RULES: AITrainingRule[] = [
  {
    id: 'rule_profit_division',
    title: 'قاعدة توزيع الأرباح ونسب الشركاء',
    category: 'accounting',
    content: 'المالك مصعب الصوفي له ثلثين (66.67%) من صافي أرباح المحل، والمدير المستلم له الثلث (33.33%). تخصم مسحوبات وصرفة بيت مصعب من حصته.',
    exampleQuery: 'كيف توزع الأرباح في المحل؟',
    expectedBehavior: 'تطبيق نسبة الثلثين لمصعب والثلث للمدير بعد خصم المصاريف العامة.',
    priority: 'high',
    isActive: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'rule_engineer_split',
    title: 'قاعدة حساب مهندس الصيانة',
    category: 'maintenance',
    content: 'مهندس الصيانة له 50% مناصفة من صافي ربح وفائدة عمليات الصيانة. صرفة غداء المهندس على المحل، وسحوباته الشخصية تخصم من حسابه الخاص.',
    exampleQuery: 'صيانة شاشة 8000 تكلفة 5000 كم نصيب المهندس؟',
    expectedBehavior: 'الربح 3000 ريال، يقسم 1500 للمهندس و 1500 للمحل.',
    priority: 'high',
    isActive: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'rule_mosaab_expenses',
    title: 'خرج ومسحوبات مصعب الصوفي',
    category: 'accounting',
    content: 'صرفة بيت مصعب أو سحب مصعب شخصي أو عهدة مصعب لا تعتبر مصاريف محل عامة، بل تسجل كسحوبات شخصية وتخصم من أرباحه في التصفية.',
    exampleQuery: 'خرج بيت مصعب 4000',
    expectedBehavior: 'تسجيل الحركة كـ withdrawal_mosaab أو expense_home_mosaab مع تصنيف mosaab.',
    priority: 'high',
    isActive: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'rule_worker_status',
    title: 'حساب العامل وتصفيته',
    category: 'policies',
    content: 'العامل عمل بالمحل حتى يوم 5 وتم تسليمه 7500 ريال يمني تصفية نهائية ومشى، وصرفته اليومية قبل ذلك كانت على المحل.',
    exampleQuery: 'كم حساب العامل أو كم باقي له؟',
    expectedBehavior: 'التوضيح بأنه تم تصفية حسابه بـ 7500 ريال ومشى وليس له أي مستحقات.',
    priority: 'normal',
    isActive: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'rule_recharge_networks',
    title: 'شبكات الرصيد والشحن المعتمدة',
    category: 'accounting',
    content: 'تطبيق الهادي يعود للوكيل محمد مياس (balance_hadi). تطبيق الرقم يعود للوكيل فايز أبو علي (balance_qimma). أرباح التحويل والرصيد تسجل لصالح المحل، ويتم دمج مبيعات وصرفات الرصيد.',
    exampleQuery: 'رصيد الهادي تحويل 25000 فايدة 1500',
    expectedBehavior: 'تسجيل الحركة في رصيد الهادي وإضافة الفائدة لحساب الأرباح.',
    priority: 'normal',
    isActive: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'rule_suppliers_list',
    title: 'الموردين المعتمدين لقطع الغيار',
    category: 'customers',
    content: 'الموردين المعتمدين لقطع الغيار والبضاعة هم: العبصري، القاسمي عمر، خليل الأغبري. أي فاتورة مشتريات تخصهم تقيد في حساب المورد.',
    exampleQuery: 'شراء شاشات من العبصري بـ 20000',
    expectedBehavior: 'تسجيل قيد مشتريات باسم المورد العبصري.',
    priority: 'normal',
    isActive: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'rule_quick_sales_formula',
    title: 'صيغة البيع السريع (سعر=فايدة)',
    category: 'vocabulary',
    content: 'عندما يقول المستخدم "سماعة 600=100" فالمعنى: سعر البيع 600، والربح 100، والتكلفة 500. وإذا قال "صيانة 10000=4000" فالبيع 10000 والربح 4000.',
    exampleQuery: 'شاحن 3500=1200',
    expectedBehavior: 'تسجيل بيع شاحن بمبلغ 3500 وتكلفة 2300 وربح 1200.',
    priority: 'high',
    isActive: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
];

export function getAITrainingRules(): AITrainingRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AI_RULES));
      return DEFAULT_AI_RULES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_AI_RULES;
  } catch (e) {
    console.error('Error loading AI training rules:', e);
    return DEFAULT_AI_RULES;
  }
}

export function saveAITrainingRule(ruleInput: Partial<AITrainingRule>): AITrainingRule[] {
  try {
    const current = getAITrainingRules();
    const now = new Date().toISOString().split('T')[0];

    if (ruleInput.id) {
      // Update existing
      const index = current.findIndex((r) => r.id === ruleInput.id);
      if (index >= 0) {
        current[index] = {
          ...current[index],
          ...ruleInput,
          updatedAt: now,
        } as AITrainingRule;
      } else {
        current.unshift({
          id: ruleInput.id,
          title: ruleInput.title || 'قاعدة جديدة',
          category: ruleInput.category || 'custom',
          content: ruleInput.content || '',
          exampleQuery: ruleInput.exampleQuery || '',
          expectedBehavior: ruleInput.expectedBehavior || '',
          priority: ruleInput.priority || 'normal',
          isActive: ruleInput.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      // Create new
      const newRule: AITrainingRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: ruleInput.title || 'قاعدة تدريبية جديدة',
        category: ruleInput.category || 'custom',
        content: ruleInput.content || '',
        exampleQuery: ruleInput.exampleQuery || '',
        expectedBehavior: ruleInput.expectedBehavior || '',
        priority: ruleInput.priority || 'normal',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      current.unshift(newRule);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch (e) {
    console.error('Error saving AI training rule:', e);
    return getAITrainingRules();
  }
}

export function deleteAITrainingRule(id: string): AITrainingRule[] {
  try {
    const current = getAITrainingRules().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch (e) {
    console.error('Error deleting AI training rule:', e);
    return getAITrainingRules();
  }
}

export function toggleAITrainingRule(id: string): AITrainingRule[] {
  try {
    const current = getAITrainingRules().map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString().split('T')[0] } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch (e) {
    console.error('Error toggling AI training rule:', e);
    return getAITrainingRules();
  }
}

export function resetToDefaultAITrainingRules(): AITrainingRule[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AI_RULES));
    return DEFAULT_AI_RULES;
  } catch (e) {
    return DEFAULT_AI_RULES;
  }
}

export function formatRulesForAIContext(rules: AITrainingRule[]): string {
  const activeRules = rules.filter((r) => r.isActive);
  if (activeRules.length === 0) return '';

  return `\nقواعد وتدريبات المحل المخصصة التي حفظها المحاسب الذكي وتعلمها من المالك:\n` +
    activeRules
      .map(
        (r, i) =>
          `${i + 1}. [${getCategoryLabel(r.category)}] ${r.title}:\n   ${r.content}${
            r.expectedBehavior ? ` (التصرف المطلوب: ${r.expectedBehavior})` : ''
          }`
      )
      .join('\n');
}

export function getCategoryLabel(category: AITrainingRule['category']): string {
  switch (category) {
    case 'accounting':
      return '📐 قواعد الحسابات والأرباح';
    case 'maintenance':
      return '🔧 صيانة وأجور المهندس';
    case 'prices':
      return '🏷️ أسعار وقطع غيار';
    case 'customers':
      return '👤 عملاء وموردين';
    case 'policies':
      return '⚖️ سياسات وشروط المحل';
    case 'vocabulary':
      return '💡 مصطلحات واختصارات';
    case 'custom':
    default:
      return '📌 معلومات وقواعد خاصة';
  }
}

/**
 * Detects if the user prompt is attempting to train the AI directly via chat
 * e.g., "علم الذكاء: ...", "احفظ عندك: ...", "تدريب جديد: ..."
 */
export function detectTrainingInstructionFromQuery(query: string): {
  isTraining: boolean;
  title?: string;
  content?: string;
  category?: AITrainingRule['category'];
} {
  const q = query.trim();
  const lower = q.toLowerCase();

  const triggers = [
    'علم الذكاء',
    'علم المحاسب',
    'احفظ عندك',
    'قاعدة جديدة',
    'تدريب جديد',
    'تعلم أن',
    'خلي عندك معلومة',
    'احفظ هذه المعلومة',
    'سجل عندك قاعدة',
  ];

  for (const trigger of triggers) {
    if (lower.startsWith(trigger)) {
      const rest = q.substring(trigger.length).replace(/^[:؛،\s-]+/, '').trim();
      if (rest.length > 5) {
        // Attempt to extract title and body
        let title = 'معلومة تدريبية جديدة';
        let content = rest;

        if (rest.includes(':') || rest.includes(' - ')) {
          const parts = rest.split(/[:\-]/);
          title = parts[0].trim();
          content = parts.slice(1).join(' - ').trim();
        } else {
          title = rest.length > 40 ? rest.substring(0, 37) + '...' : rest;
        }

        let category: AITrainingRule['category'] = 'custom';
        if (content.includes('صيانة') || content.includes('شاشة') || content.includes('مهندس')) {
          category = 'maintenance';
        } else if (content.includes('ربح') || content.includes('نسبة') || content.includes('ثلث')) {
          category = 'accounting';
        } else if (content.includes('سعر') || content.includes('تكلفة') || content.includes('بيع')) {
          category = 'prices';
        } else if (content.includes('مورد') || content.includes('زبون') || content.includes('عميل')) {
          category = 'customers';
        }

        return {
          isTraining: true,
          title,
          content,
          category,
        };
      }
    }
  }

  return { isTraining: false };
}
