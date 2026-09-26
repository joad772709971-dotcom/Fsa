import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RotateCcw,
  Sparkles,
  BookOpen,
  HelpCircle,
  Search,
  Filter,
} from 'lucide-react';
import {
  AITrainingRule,
  getAITrainingRules,
  saveAITrainingRule,
  deleteAITrainingRule,
  toggleAITrainingRule,
  resetToDefaultAITrainingRules,
  getCategoryLabel,
} from '../utils/aiTrainingStorage';

interface SmartAITrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesUpdated?: () => void;
}

export const SmartAITrainingModal: React.FC<SmartAITrainingModalProps> = ({
  isOpen,
  onClose,
  onRulesUpdated,
}) => {
  const [rules, setRules] = useState<AITrainingRule[]>(getAITrainingRules);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<AITrainingRule['category']>('accounting');
  const [formContent, setFormContent] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formBehavior, setFormBehavior] = useState('');
  const [formPriority, setFormPriority] = useState<AITrainingRule['priority']>('normal');

  // Test prompt state
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshRules = () => {
    const updated = getAITrainingRules();
    setRules(updated);
    if (onRulesUpdated) onRulesUpdated();
  };

  const handleStartAdd = () => {
    setEditingRuleId(null);
    setFormTitle('');
    setFormCategory('accounting');
    setFormContent('');
    setFormExample('');
    setFormBehavior('');
    setFormPriority('normal');
    setIsAddingNew(true);
  };

  const handleStartEdit = (rule: AITrainingRule) => {
    setEditingRuleId(rule.id);
    setFormTitle(rule.title);
    setFormCategory(rule.category);
    setFormContent(rule.content);
    setFormExample(rule.exampleQuery || '');
    setFormBehavior(rule.expectedBehavior || '');
    setFormPriority(rule.priority);
    setIsAddingNew(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    saveAITrainingRule({
      id: editingRuleId || undefined,
      title: formTitle.trim(),
      category: formCategory,
      content: formContent.trim(),
      exampleQuery: formExample.trim(),
      expectedBehavior: formBehavior.trim(),
      priority: formPriority,
    });

    setIsAddingNew(false);
    setEditingRuleId(null);
    refreshRules();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه المعلومة التدريبية من ذاكرة المحاسب؟')) {
      deleteAITrainingRule(id);
      refreshRules();
    }
  };

  const handleToggle = (id: string) => {
    toggleAITrainingRule(id);
    refreshRules();
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'هل تريد استعادة القواعد المحاسبية التدريبية الافتراضية الخاصة بمحل مصعب؟'
      )
    ) {
      resetToDefaultAITrainingRules();
      refreshRules();
    }
  };

  const handleRunTest = () => {
    if (!testQuery.trim()) return;
    const activeRules = rules.filter((r) => r.isActive);
    const matched = activeRules.filter(
      (r) =>
        testQuery.includes(r.title) ||
        r.content.includes(testQuery) ||
        (r.exampleQuery && testQuery.includes(r.exampleQuery))
    );

    if (matched.length > 0) {
      setTestResult(
        `✅ وجد المحاسب الذكي في ذاكرته التدريبية (${matched.length}) قاعدة مطابقة:\n\n` +
          matched
            .map(
              (m) =>
                `• [${getCategoryLabel(m.category)}] ${m.title}:\n${m.content}\nالتصرف المحاسبي: ${
                  m.expectedBehavior || 'تطبيق القاعدة المباشرة'
                }`
            )
            .join('\n\n')
      );
    } else {
      setTestResult(
        `ℹ️ لا توجد قاعدة مخصصة تطابق نص البحث هذا تحديداً. سيطبق المحاسب القواعد العامة الصارمة لمحل مصعب الصوفي.`
      );
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesCat = activeCategory === 'all' || r.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div
      id="smart-ai-training-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white text-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Brain className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>استوديو تدريب وتعليم المحاسب الذكي</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  ذاكرة دائمة مخصصة
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                علّم المحاسب القواعد الخاصة بمحلك، والأسعار، وسياسات الحسابات ليحفظها ويطبقها فورياً
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-training-modal-btn"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في ذاكرة المحاسب والدروس المحفوظة..."
                className="w-full text-xs pr-9 pl-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
              >
                <option value="all">كل التصنيفات ({rules.length})</option>
                <option value="accounting">📐 قواعد الحسابات والأرباح</option>
                <option value="maintenance">🔧 صيانة وأجور المهندس</option>
                <option value="prices">🏷️ أسعار وقطع غيار</option>
                <option value="customers">👤 عملاء وموردين</option>
                <option value="policies">⚖️ سياسات المحل</option>
                <option value="vocabulary">💡 مصطلحات واختصارات</option>
                <option value="custom">📌 قواعد مخصصة</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-add-training-rule"
              onClick={handleStartAdd}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة معلومة / درس جديد</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              title="استعادة القواعد الأساسية"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Add / Edit Form */}
          {isAddingNew && (
            <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-100">
                <span className="font-black text-sm text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  {editingRuleId ? 'تعديل معلومة تدريبية' : 'تعليم وتدريب المحاسب على معلومة جديدة'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان المعلومة / الدرس: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="مثال: سعر تركيب شاشة A12 الأصلية"
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تصنيف المعلومة:
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) =>
                        setFormCategory(e.target.value as AITrainingRule['category'])
                      }
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-700"
                    >
                      <option value="accounting">📐 قواعد الحسابات والأرباح</option>
                      <option value="maintenance">🔧 صيانة وأجور المهندس</option>
                      <option value="prices">🏷️ أسعار وقطع غيار</option>
                      <option value="customers">👤 عملاء وموردين</option>
                      <option value="policies">⚖️ سياسات وشروط المحل</option>
                      <option value="vocabulary">💡 مصطلحات واختصارات</option>
                      <option value="custom">📌 قواعد مخصصة</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الشرح والتفاصيل التي تريد من المحاسب أن يحفظها ويلتزم بها:{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="اكتب هنا أي معلومة بالعامية أو الفصحى مثل: شاشة A12 سعر تركيبها 12000 وتكلفتها 7000 والفايدة 5000 تقسم مناصفة مع المهندس..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      مثال لكلام أو سؤال المستخدم (اختياري):
                    </label>
                    <input
                      type="text"
                      value={formExample}
                      onChange={(e) => setFormExample(e.target.value)}
                      placeholder="مثال: ركبت شاشة A12"
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      التصرف المحاسبي المطلوب (اختياري):
                    </label>
                    <input
                      type="text"
                      value={formBehavior}
                      onChange={(e) => setFormBehavior(e.target.value)}
                      placeholder="مثال: قيد العملية صيانة دخل 12000 وتكلفة 7000"
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ وتدريب المحاسب الآن</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Testing Simulator Box */}
          <div className="bg-slate-100 rounded-2xl p-3 sm:p-4 border border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>اختبار فوري لذاكرة المحاسب والدروس المدربة:</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunTest()}
                placeholder="اكتب عبارة أو سؤال لاختبار ما تعلمه، مثلاً: صيانة شاشة أو كيف توزع الأرباح..."
                className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRunTest}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                اختبار الفهم
              </button>
            </div>
            {testResult && (
              <div className="mt-2.5 p-3 bg-white rounded-xl border border-indigo-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs">
                {testResult}
              </div>
            )}
          </div>

          {/* Rules List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>قائمة القواعد والمعلومات المحفوظة ({filteredRules.length}):</span>
              <span>يمكنك تعطيل أو تفعيل أي قاعدة بنقرة واحدة</span>
            </div>

            {filteredRules.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">
                  لا توجد معلومات تدريبية مطابقة لمعايير البحث الحالية
                </p>
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    rule.isActive
                      ? 'bg-white border-slate-200 shadow-xs hover:border-indigo-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-black text-sm text-slate-900">{rule.title}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold border border-slate-200">
                          {getCategoryLabel(rule.category)}
                        </span>
                        {rule.priority === 'high' && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">
                            قاعدة أساسية
                          </span>
                        )}
                        {!rule.isActive && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold">
                            معطلة مؤقتاً
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {rule.content}
                      </p>

                      {rule.exampleQuery && (
                        <div className="mt-2 text-[11px] text-indigo-700 bg-indigo-50/80 p-2 rounded-xl flex items-center gap-2">
                          <span className="font-bold">مثال العبارة:</span>
                          <span className="font-mono">{rule.exampleQuery}</span>
                          {rule.expectedBehavior && (
                            <span className="text-slate-600 mr-auto text-[10px]">
                              ← {rule.expectedBehavior}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(rule.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                          rule.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {rule.isActive ? 'مفعلة' : 'معطلة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(rule)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 border-t border-slate-200 p-3 sm:px-5 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>
              يمكنك أيضاً تدريب المحاسب صوتياً أو كتابياً في الشات بقول: <b>"علم المحاسب: ..."</b>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
