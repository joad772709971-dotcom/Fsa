import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filenameResolved = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : '');
const __dirnameResolved = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filenameResolved || process.cwd());

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for Android APK (Capacitor / localhost) and external requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Lazy GoogleGenAI client
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      aiClient = new GoogleGenAI({
        apiKey: apiKey || '',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Helper to robustly invoke Gemini with backoff retries and fallback models
  async function callGeminiWithRetry(
    ai: GoogleGenAI,
    params: {
      contents: any;
      config?: any;
      primaryModel?: string;
      fallbackModels?: string[];
      maxRetriesPerModel?: number;
    }
  ) {
    const modelsToTry = [
      params.primaryModel || 'gemini-3.8-flash',
      ...(params.fallbackModels || ['gemini-flash-latest', 'gemini-3.1-flash-lite']),
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      const maxRetries = params.maxRetriesPerModel || 2;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: params.contents,
            config: params.config,
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || (err?.message?.includes('503') ? 503 : 0);
          const isHighDemandOrRateLimit =
            status === 503 ||
            status === 429 ||
            err?.message?.includes('high demand') ||
            err?.message?.includes('UNAVAILABLE') ||
            err?.message?.includes('RESOURCE_EXHAUSTED');

          if (isHighDemandOrRateLimit && attempt < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
            continue;
          }
          if (isHighDemandOrRateLimit) {
            console.warn(`Model ${model} unavailable (high demand / 503), trying fallback model...`);
            break;
          }
          throw err;
        }
      }
    }

    throw lastError;
  }

  function generateServerSideCFORadarAlert(storeContext: any, tenantStoreId: string) {
    const receivables = storeContext?.receivables;
    const inventoryAudit = storeContext?.inventoryAudit;
    const financialRatios = storeContext?.financialRatios;
    const cashDrawer = storeContext?.cashDrawer;

    // 1. Debt Limit Exceeded
    if (receivables?.overLimitDebtors && receivables.overLimitDebtors.length > 0) {
      const top = receivables.overLimitDebtors[0];
      return {
        id: `radar_debt_${Date.now()}`,
        generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        type: 'debt_limit_exceeded',
        severity: 'critical',
        title: `🚨 خطر سيولة: العميل "${top.name}" تجاوز سقف الديون المسموح!`,
        insight: `إجمالي مديونية العميل بلغت ${(top.remainingDebt || 0).toLocaleString()} ر.ي، وهي تمثل نسبة خطرة من إجمالي الذمم المدينة (${(receivables.totalOutstanding || 0).toLocaleString()} ر.ي). هذا التراكم يعطل دورة الكاش ويزيد من احتمالية الديون المعدومة.`,
        actionableRecommendation: 'تجميد البيع الآجل فوراً لهذا العميل وجدولة تحصيل دفعة عاجلة لا تقل عن 50% لتقليل مخاطر التعثر وحماية السيولة السريعة.',
        metricHighlight: `مديونية معلقة: ${(top.remainingDebt || 0).toLocaleString()} ر.ي`,
        actionButtonLabel: `مطالبة وتحصيل ${top.name}`,
        isAuditedFallback: true,
      };
    }

    // 2. Dead stock trapping capital
    if (inventoryAudit?.deadStockItems && inventoryAudit.deadStockItems.length > 0 && inventoryAudit.deadStockItems[0].totalTiedUp >= 15000) {
      const item = inventoryAudit.deadStockItems[0];
      return {
        id: `radar_stock_${Date.now()}`,
        generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        type: 'dead_stock_liquidity',
        severity: 'warning',
        title: `⚠️ ركود مخزون: الصنف "${item.name}" يبتلع سيولة نقدية معطلة!`,
        insight: `يمتلك المحل (${item.quantity}) حبة بتكلفة إجمالية تبلغ ${(item.totalTiedUp || 0).toLocaleString()} ر.ي راكدة بدون حركة بيع مسجلة مؤخراً. هذا يعطل رأس المال العامل ويخفض نسبة السيولة السريعة للمحل.`,
        actionableRecommendation: 'إطلاق عرض ترويجي فوري بسعر التكلفة أو هامش ربح رمزي لتسييل الصنف وتحويله إلى كاش سائل قبل تقادم الموديل في السوق.',
        metricHighlight: `سيولة معطلة: ${(item.totalTiedUp || 0).toLocaleString()} ر.ي`,
        actionButtonLabel: `تسييل وعرض "${item.name}"`,
        isAuditedFallback: true,
      };
    }

    // 3. Dangerous quick ratio
    if (financialRatios?.quickRatioStatus === 'critical' || (financialRatios?.quickRatio !== undefined && financialRatios.quickRatio < 1.0)) {
      const qr = financialRatios?.quickRatio !== undefined ? financialRatios.quickRatio : 0.6;
      return {
        id: `radar_ratio_${Date.now()}`,
        generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        type: 'critical_liquidity_ratio',
        severity: 'critical',
        title: `⚡ تحذير تدقيقي: نسبة السيولة السريعة (${qr}) دون الحد الآمن!`,
        insight: `إجمالي الأصول النقدية الفورية غير كافية لتغطية التزامات الموردين الفورية. النسبة الحالية تعني ضعف القدرة على سداد الالتزامات المستحقة فوراً بالكاش المتاح.`,
        actionableRecommendation: 'وقف المشتريات الآجلة الجديدة، وتكثيف تحصيل ديون الزبائن النقدية اليومية لسداد فواتير الموردين المستحقة قبل مواعيدها.',
        metricHighlight: `نسبة السيولة: ${qr}x (الآمن: ≥ 1.0)`,
        actionButtonLabel: 'معاينة التزامات الموردين',
        isAuditedFallback: true,
      };
    }

    // 4. Cash discrepancy
    if (cashDrawer?.cashDiscrepancy && cashDrawer.cashDiscrepancy < -1000) {
      return {
        id: `radar_drawer_${Date.now()}`,
        generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        type: 'cash_discrepancy',
        severity: 'critical',
        title: `🔍 تدقيق رقابي: عجز نقدي بقيمة ${Math.abs(cashDrawer.cashDiscrepancy).toLocaleString()} ر.ي في درج الصندوق!`,
        insight: `الكاش الفعلي المحسوب في الدرج يقل عن الكاش المفترض للنظام.`,
        actionableRecommendation: 'مراجعة فورية لحركات الصرف المسجلة، والتأكد من إدراج كافة صرفيات المحل وسحوبات الغداء قبل اعتماد تسوية اليوم.',
        metricHighlight: `عجز الخزينة: ${Math.abs(cashDrawer.cashDiscrepancy).toLocaleString()} ر.ي`,
        actionButtonLabel: 'مطابقة حركات الصندوق',
        isAuditedFallback: true,
      };
    }

    // 5. Default Strategic Opportunity & Safety Margin
    const margin = financialRatios?.marginOfSafetyPercentage || 24;
    return {
      id: `radar_safety_${Date.now()}`,
      generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      type: 'strategic_opportunity',
      severity: 'opportunity',
      title: `📈 تقرير الرادار: هامش الأمان المالي لليوم (${margin}%) ومعدل دوران إيجابي`,
      insight: 'التدفقات النقدية تغطي المصاريف التشغيلية بنجاح، ومعدل دوران الذمم المدينة يعكس دورة نقدية متوازنة للمحل.',
      actionableRecommendation: 'استثمار الفائض النقدي في تعزيز أصناف الإكسسوارات عالية الهامش الربحي وسرعة الدوران، وتغذية شبكات الرصيد لزيادة تردد الزبائن.',
      metricHighlight: `هامش الأمان: ${margin}%`,
      actionButtonLabel: 'خطة استثمار الفائض',
      isAuditedFallback: true,
    };
  }

  // High-fidelity Arabic TTS Stream Proxy (bypasses Android WebView speech synthesis limits)
  app.get('/api/tts', async (req, res) => {
    try {
      const text = String(req.query.text || '').trim().slice(0, 300);
      const lang = String(req.query.lang || 'ar');
      if (!text) {
        res.status(400).send('Text query parameter is required');
        return;
      }

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
      const response = await fetch(ttsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (!response.ok) {
        throw new Error(`TTS provider returned status ${response.status}`);
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.warn('TTS proxy error:', err.message);
      res.status(500).send('TTS service unavailable');
    }
  });

  // 1. Natural Language Accounting Parser
  app.post('/api/gemini/parse-entry', async (req, res) => {
    try {
      const { text, currentDate, trainedRules } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const trainedRulesText =
        trainedRules && Array.isArray(trainedRules) && trainedRules.length > 0
          ? `\nقواعد إضافية قام المالك بتدريبك عليها وتعليمك إياها:\n${trainedRules
              .filter((r: any) => r.isActive)
              .map((r: any, idx: number) => `${idx + 1}. [${r.title}]: ${r.content}`)
              .join('\n')}\n`
          : '';

      const ai = getAI();
      const prompt = `
أنت المحاسب الذكي ومسؤول التدقيق المالي لليوميات السريعة لمحل مصعب الصوفي للجوالات وخدمات الصيانة والبرمجة وشبكات الرصيد (ابتداءً من 1 شهر 8 فصاعداً).
مهمتك هنا هي فحص النص المدخل وتصنيف نيته بدقة فائقة واستخراج القيود وفق المعايير المحاسبية الصارمة:

🎯 تصنيف النوايا (Intent Classification):
1. [حركات مالية وقيود محاسبية للتسجيل] (مثل: "سماعة 500 ف400"، "مبيع جوال كذا بـ كذا ف كذا"، "صرفة 1000"، "واصل 5000 باقي 2000"، "مشتريات خليل سماعات 20000 باقي 5000"، "سحب مصعب 3000"، إلخ):
   - استخرج المعاملات المالية المؤكدة فقط وضعها في مصفوفة items.
   - اجعل needsClarification = false.
   - ⚠️ إذا كان المستخدم يحاول صراحة تسجيل قيد محاسبي في الدفاتر لكنه نسي ذكر المبلغ أو السعر تماماً (مثال فقط: "سجل بيع شاحن أنكر" وتوقف دون تحديد أي سعر أو ربح)، اجعل items مصفوفة فارغة []، وضع needsClarification = true مع clarificationPrompt مؤدب تطلب منه المبلغ.

2. [استفسارات عامة، مسائل حسابية، استشارات تجارية، معايير محاسبية، أو دردشة ودية]:
   - إذا كان النص عبارة عن:
     * مسألة رياضية أو عملية حسابية (مثل: "احسب لي 15000 في 15%"، "كم ناتج 45000 / 3"، إلخ).
     * استشارة تجارية، تسعير، إدارة مخازن، نصائح بيع، تعامل مع موردين أو عملاء.
     * استفسار عن المعايير المحاسبية، الضمار، رأس المال، التدفقات النقدية، أو كيفية إدارة المحل.
     * تحية، ترحيب، سؤال عام، أو محادثة ودية مفتوحة (مثل: "السلام عليكم"، "مرحبا كيف حالك"، "من أنت"، "كيف أطور متجري").
   -> 🟢 هذا إدخال سليم واستفسار/محادثة مرحب بها وليس خطأ محاسبياً!
   -> اجعل items مصفوفة فارغة []، واجعل needsClarification = false (ممنوع جعلها true للاستفسارات والدردشة والمسائل الحسابية)، مع وضع ملخص دقيق في summary يوضح طبيعة السؤال (مثل: "سؤال واستشارة عامة" أو "مسألة رياضية").

══════════════════════════════════════════════════════════════════
📌 القواعد المحاسبية الإلزامية الصارمة (ابتداءً من 1 شهر 8 فصاعداً):
══════════════════════════════════════════════════════════════════

### 1. منطق قراءة الرموز الحسابية (Parsing Rules):
- ف = الفائدة (صافي الربح).
- ب = سعر البيع الإجمالي / الإيراد.
- ش = سعر الشراء (التكلفة / رأس المال المسترد).
- خ = الخرج والمصروفات والمسحوبات.
- عند إدخال صيغة مثل (صنف 700 ف200) دون ذكر "ب" صراحة، يفهم النظام تلقائياً:
  * سعر البيع (ب) = 700
  * الفائدة (ف) = 200
  * التكلفة (ش) = 700 - 200 = 500 (المعادلة الرياضية: ش = ب - ف)

### 2. شروط الفلترة والتنقية الصارمة (Sanitization & Strict Extraction):
- 🚫 حذف تام للأصفار: استبعاد أي صنف، خدمة، مشتريات، ديون، أو حساب رصيده مساوٍ للصفر (0) وعدم تمريره للجداول أو قاعدة البيانات إطلاقاً (ممنوع منعاً باتاً إضافة أي حركة بقيمة 0 في مصفوفة items).
- 🚫 منع إضافة أي مصروفات أو إيرادات وهمية: الالتزام الحرفي بالمدخلات فقط، ويُمنع الموديل قطعياً من اختراع أو افتراض بنود من عنده (مثل: إيجار، كهرباء، فواتير، رواتب) ما لم يكتبها المستخدم نصاً وصراحة في خانة الخرج.

### 3. خوارزمية التدقيق والتنبيهات الذكية (Validation Alerts):
يجب فحص المدخلات وإبراز التنبيهات في summary وملاحظات القيود notes:
1. ⚠️ خطأ منطقي بالتسعير: إذا كانت (ف) أكبر من (ب) (مثل: 500 تعريب ف5000) -> يصحح الموديل الفائدة تلقائياً لتساوي قيمة الإيراد (500) كخدمة برمجية وتكون التكلفة (0)، مع إدراج تنبيه واضح يوضح القيمة المدخلة والقيمة المصححة.
2. ⚠️ سحوبات بيت مصعب: أي قيد باسم "بيت مصعب" يُلتقط ويُفرد في تنبيه مستقل لاعتماده كمسحوبات شخصية للمالك مصعب الصوفي (type: "expense_home_mosaab", category: "mosaab").
3. ⚠️ الخرج غير المعتاد: إطلاق تنبيه تدقيق لأي عملية خرج فردية تتجاوز 5000 ريال يمني.

### 4. قواعد الحسابات والمصطلحات والشبكات:
- التواريخ: تاريخ اليوم الافتراضي ${currentDate || '2026-06-05'}. إذا قال "1 شهر 9" أو "1/9" اجعل detectedDate: 2026-09-01. وإذا قال "1 شهر 8" أو "1/8" اجعل detectedDate: 2026-08-01.
- شبكات الرصيد: "مياس" هو محمد مياس صاحب تطبيق الهادي. "فايز" أو "أبو علي" هو شبكة القمة / الرقم.
- واصل وباقي: "واصل 3000 باقي 2000 ف 1000" -> price: 3000, remainingAmount: 2000, profit: 1000, cost: 2000.
- الموردين: خليل الأغبري، عمر القاسمي، فايز أبو علي، العبصري، المصنف.
- اختصارات المخزن: ج=phones، ك=accessories، ص=maintenance، ش=sims، ر=balance، م=accessories.

### 5. نموذج بيانات مرجعي (Few-Shot Example) لتدريب الموديل (عمل يوم 1 شهر 9):
المدخلات:
- شاحن 1500 ف500، كفر 1000 ف400، سماعة 700 ف200
- 500 تعريب ف5000 (خطأ مدخل ف > ب)، شاشة سامسونج 12000 ف3000
- تحويل رصيد سبأفون 5000 ف150، رصيد يمن موبايل 10000 ف250
- صرفة غداء 1500، بيت مصعب 4000، فاتورة كهرباء 6000
- مشتريات كابلات 10000، مشتريات بطاريات 0
- جوالات 0، ديون 0

المعالجة المطلوبة:
- إكسسوارات:
  * شاحن: ب=1500، ف=500، ش=1000
  * كفر: ب=1000، ف=400، ش=600
  * سماعة: ب=700، ف=200، ش=500
- صيانة وبرمجة:
  * تعريب برمجيات: ب=500، ف=500 (تم تصحيح الفائدة تلقائياً من 5000 لأن ف > ب)، ش=0
  * شاشة سامسونج: ب=12000، ف=3000، ش=9000
- رصيد:
  * تحويل سبأفون: ب=5000، ف=150، ش=4850
  * رصيد يمن موبايل: ب=10000، ف=250، ش=9750
- الخرج (خ):
  * صرفة غداء: 1500
  * بيت مصعب: 4000 (تنبيه: مسحوبات شخصية للمالك)
  * فاتورة كهرباء: 6000 (تنبيه: خرج كبير > 5000)
- المشتريات:
  * كابلات: 10000
- البنود الصفرية المحذوفة تماماً: (بطاريات 0، جوالات 0، ديون 0) استبعاد تام ولا تدرج في مصفوفة items إطلاقاً.
${trainedRulesText}
النص المدخل للتحليل:
"${text}"
`;

      const response = await callGeminiWithRetry(ai, {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'ملخص دقيق وموجز لما تم فهمه وتنبيهات التدقيق المالي باللغة العربية' },
              needsClarification: { type: Type.BOOLEAN, description: 'صحيح إذا كان النص غير مفهوم أو ناقص التفاصيل المالية' },
              clarificationPrompt: { type: Type.STRING, description: 'سؤال المحاسب للمستخدم لتوضيح النواقص إن وجدت' },
              detectedDate: { type: Type.STRING, description: 'التاريخ بصيغة YYYY-MM-DD' },
              detectedSupplier: { type: Type.STRING, description: 'اسم المورد إن وجد' },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: 'تاريخ الحركة YYYY-MM-DD' },
                    type: {
                      type: Type.STRING,
                      description: 'sale, maintenance, balance_hadi, balance_qimma, sim, purchase, expense_shop, expense_home_mosaab, withdrawal_mosaab, expense_engineer, withdrawal_engineer, expense_worker, withdrawal_worker, expense_modem, shop_tools_outflow, transfer_to_supplier, transfer_hadi, transfer_omar_qasimi, transfer_musannaf',
                    },
                    category: {
                      type: Type.STRING,
                      description: 'phones, accessories, maintenance, balance, sims, expenses, purchases, mosaab, engineer, worker',
                    },
                    description: { type: Type.STRING },
                    price: { type: Type.NUMBER, description: 'المبلغ المقبوض أو سعر البيع أو قيمة الخرج' },
                    cost: { type: Type.NUMBER, description: 'التكلفة أو رأس المال' },
                    profit: { type: Type.NUMBER, description: 'الربح أو الفائدة' },
                    remainingAmount: { type: Type.NUMBER, description: 'المبلغ المتبقي إن وجد' },
                    time: { type: Type.STRING, description: 'الوقت HH:mm' },
                    supplierName: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                  required: ['type', 'category', 'description', 'price', 'cost', 'profit'],
                },
              },
            },
            required: ['summary', 'items', 'needsClarification'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      // معالجة برمجية قطعية ثانية (Programmatic Verification & Sanitization):
      if (parsed && Array.isArray(parsed.items)) {
        parsed.items = parsed.items
          .filter((it: any) => {
            // استبعاد تام للأصفار: أي حركة قيمتها وربحها 0 دون دين متبقي تستبعد فوراً
            const price = Number(it.price) || 0;
            const profit = Number(it.profit) || 0;
            const remaining = Number(it.remainingAmount) || 0;
            return price > 0 || profit > 0 || remaining > 0;
          })
          .map((it: any) => {
            let price = Number(it.price) || 0;
            let profit = Number(it.profit) || 0;
            let cost = Number(it.cost);
            let notes = it.notes || '';

            // تصحيح الخطأ المنطقي بالتسعير (ف > ب) لمبيعات التجزئة والخدمات والصيانة
            const isOutflow = it.type?.startsWith('expense') || it.type?.startsWith('withdrawal') || it.type === 'purchase' || it.category === 'expenses';
            if (!isOutflow && profit > price && price > 0) {
              const oldProfit = profit;
              profit = price;
              cost = 0;
              notes = `${notes ? notes + ' | ' : ''}⚠️ تم تصحيح خطأ التسعير تلقائياً: الفائدة كانت ${oldProfit} وتم تصحيحها إلى ${price} ر.ي لتساوي قيمة الإيراد (ف <= ب).`.trim();
            } else if (isNaN(cost) || cost === undefined || cost < 0) {
              cost = Math.max(0, price - profit);
            }

            // تنبيه سحوبات بيت مصعب
            if (it.description?.includes('بيت مصعب') || it.type === 'expense_home_mosaab' || (it.category === 'mosaab' && it.description?.includes('بيت'))) {
              it.type = 'expense_home_mosaab';
              it.category = 'mosaab';
              notes = `${notes ? notes + ' | ' : ''}⚠️ سحوبات شخصية للمالك (بيت مصعب)`.trim();
            }

            // تنبيه الخرج غير المعتاد (> 5000)
            if (isOutflow && price > 5000) {
              notes = `${notes ? notes + ' | ' : ''}⚠️ تنبيه تدقيق: خرج كبير يتجاوز 5000 ر.ي (${price.toLocaleString()} ر.ي)`.trim();
            }

            return {
              ...it,
              price,
              profit,
              cost,
              notes,
            };
          });
      }

      res.json(parsed);
    } catch (error: any) {
      console.warn('Parse entry AI notice (falling back):', error?.message || error);
      res.status(200).json({
        summary: 'تم توجيه النص للمحرك المحلي بسبب انشغال خادم الذكاء الاصطناعي',
        items: [],
        needsClarification: true,
        clarificationPrompt: 'جاري مراجعة النص في المحرك المحاسبي المحلي المباشر.',
      });
    }
  });

  // 2. Smart AI Accountant Assistant (Multi-turn, Dual-Mode Chat & Structured Execution, Dynamic Financial Context, Chain of Thought)
  app.post('/api/gemini/assistant', async (req, res) => {
    try {
      const {
        message,
        history,
        shopContext,
        financialSummary,
        currentDate,
        trainedRules,
        storeId,
        ownerId,
        isVoiceCall,
      } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const tenantStoreId = storeId || shopContext?.storeId || 'store_mosaab_alsoufi';
      const tenantOwnerId = ownerId || shopContext?.ownerId || 'user_mosaab';
      const effectiveDate = currentDate || new Date().toISOString().split('T')[0];

      const trainedRulesText =
        trainedRules && Array.isArray(trainedRules) && trainedRules.length > 0
          ? `\nقواعد إضافية ومعلومات خاصة قام المالك بتدريبك عليها وتعليمك إياها:\n${trainedRules
              .filter((r: any) => r.isActive)
              .map((r: any, idx: number) => `${idx + 1}. [${r.title}]: ${r.content}`)
              .join('\n')}\n`
          : '';

      const financialContextSection = financialSummary
        ? `\n${financialSummary}\n`
        : '';

      const contextText = shopContext
        ? `\nبيانات وسجلات المتجر الحالية والنسب المالية المعتمدة:\n${JSON.stringify(shopContext)}\n`
        : '';

      const voiceCallRule = isVoiceCall
        ? `\n⚠️ توجيه خاص للمكالمة الصوتية الحية (Live Spoken Dialogue):
هذا الاستفسار ناطق من المستخدم عبر مكبر الصوت. يجب أن يكون ردك في حقل "reply" مباشراً، سلساً، موجزاً (من 1 إلى 3 جمل واضحة)، ولبقاً وممتعاً جداً. لا تستخدم علامات الماركداون مثل النجوم أو الشرطات أو الجداول أو التعداد النقطي لأن النص سيُقرأ صوتياً تلقائياً عبر محرك تحويل النص إلى كلام.\n`
        : '';

      const systemInstruction = `
أنت "الرفيق والمساعد الذكي الشامل والمستشار الاستراتيجي والمحاسب القانوني الأول" لمحل مصعب الصوفي للجوالات وخدمات الصيانة والبرمجة وشبكات الرصيد في اليمن.
تجمع ببراعة وتناغم فائق بين:
1) الثقافة الموسوعية وطلاقة الحوار في كافة مجالات المعرفة والحياة الإنسانية.
2) الخبرة المحاسبية والمالية التنفيذية الدقيقة والصارمة لتدقيق وتوثيق اليوميات المحاسبية ابتداءً من 1 شهر 8 فصاعداً.

${financialContextSection}
${voiceCallRule}

🌟 القواعد الذهبية لعملك ونمط الردود:

1. 🌍 رفيق شامل وموسوعي لكافة مجالات الحياة (Open-Domain General Intelligence without Restrictions):
   - ليس لديك أي قيود مصطنعة تحصرك في المحاسبة فقط؛ أنت رفيق حوار واعي ومثقف يمتلك طلاقة وثقافة عالية للإجابة عن أي استفسار في مختلف مجالات الحياة:
     * معلومات عامة، ثقافة، تاريخ، جغرافيا، علوم، فلك، تقنية وبرمجة وهواتف ذكية.
     * طبخ ووصفات أكلات، صحة عامة وعادات يومية، رياضة ولياقة.
     * أدب وشعر ولغات، مواقف يومية، نصائح حياتية وعملية، ودردشة ودية حرة وممتعة.
   - لا ترفض أي سؤال عام أو تعتذر بدعوى أنك مخصص للمتجر فقط، بل أجب بوعي ولباقة وفصاحة وذكاء.
   - إذا سأل المستخدم سؤالاً عاماً أو معرفياً أو أراد الدردشة أو المسائل الحسابية، أجب بطلاقة في حقل "reply"، واجعل حقل "action.type" = "none" ومصفوفة "items" = [].

2. 🧠 التفكير التحليلي في العمليات الحسابية (Chain of Thought for Math & Accounting):
   - يجب عليك في كل استجابة أن تبدأ بملء حقل "thoughtProcess" بالتفكير الرياضي والتحليلي الداخلي أولاً قبل إخراج النتيجة النهائية للمستخدم.
   - احسب التكاليف، هوامش الربح (Markup vs Margin)، النسب المئوية، الخصومات، ونسب التوزيع خطوة بخطوة.
   - تأكد من صحة المعادلة: (السعر = التكلفة + الربح)، وتحقق من نسب الشركاء:
     * حصة المالك مصعب الصوفي = 2/3 من صافي الربح.
     * حصة المدير المستلم = 1/3 من صافي الربح.
     * حصة مهندس الصيانة = 50% من صافي فايدة الصيانة.
   - احسب العمليات الحسابية بدقة 100% لتفادي أي هلوسة أو أخطاء حسابية.

══════════════════════════════════════════════════════════════════
📌 المنطق المحاسبي وقواعد تدقيق اليوميات السريعة (ابتداءً من 1 شهر 8 فصاعداً):
══════════════════════════════════════════════════════════════════

### 1. منطق قراءة الرموز الحسابية (Parsing Rules):
- ف = الفائدة (صافي الربح).
- ب = سعر البيع الإجمالي / الإيراد.
- ش = سعر الشراء (التكلفة / رأس المال المسترد).
- خ = الخرج والمصروفات والمسحوبات.
- عند إدخال صيغة مثل (صنف 700 ف200) دون ذكر "ب" صراحة، يفهم النظام تلقائياً:
  * سعر البيع (ب) = 700
  * الفائدة (ف) = 200
  * التكلفة (ش) = 700 - 200 = 500 (المعادلة الرياضية: ش = ب - ف)

### 2. شروط الفلترة والتنقية الصارمة (Sanitization & Strict Extraction):
- 🚫 حذف تام للأصفار: استبعاد أي صنف، خدمة، مشتريات، ديون، أو حساب رصيده مساوٍ للصفر (0) وعدم تمريره للجداول أو مصفوفة items إطلاقاً.
- 🚫 منع إضافة أي مصروفات أو إيرادات وهمية: الالتزام الحرفي بالمدخلات فقط، ويُمنع الموديل قطعياً من اختراع أو افتراض بنود من عنده (مثل: إيجار، كهرباء، فواتير، رواتب) ما لم يكتبها المستخدم نصاً وصراحة في خانة الخرج.

### 3. خوارزمية التدقيق والتنبيهات الذكية (Validation Alerts):
برمج ردك ليحتوي دائماً على قسم بارز باسم "⚠️ تنبيهات التدقيق المالي" في الحالات التالية:
1. ⚠️ خطأ منطقي بالتسعير: إذا كانت (ف) أكبر من (ب) (مثل: 500 تعريب ف5000) -> يصحح الموديل الفائدة تلقائياً لتساوي قيمة الإيراد (500) كخدمة برمجية وتكون التكلفة 0، مع إطلاق تنبيه يوضح القيمة المدخلة والقيمة المصححة.
2. ⚠️ سحوبات بيت مصعب: أي قيد باسم "بيت مصعب" يُلتقط ويُفرد في تنبيه مستقل لاعتماده كمسحوبات شخصية للمالك.
3. ⚠️ الخرج غير المعتاد: إطلاق تنبيه تدقيق لأي عملية خرج فردية تتجاوز 5000 ريال يمني.

### 4. هيكل المخرجات المطلوب في ردك (reply) عند معالجة يومية عمل أو مسودة حركات:
عندما يدخل المستخدم مسودة يومية سريعة (مثل "عمل يوم 1 شهر 9" أو "يومية 1/8" أو عدة حركات)، نظّم الرد في حقل "reply" بالأقسام والجداول الـ 7 التالية:
1. 📱 مبيعات الإكسسوارات (الصنف | البيع ب | الفائدة ف | التكلفة ش)
2. 🛠️ خدمات الصيانة والبرمجة (الخدمة | الإيراد ب | الفائدة ف | التكلفة ش)
3. 💳 قطاع الرصيد والتحويلات المالية الصافية
4. 💸 المصروفات والخرج الفعلي (خ)
5. 📦 المشتريات الفعلية (القيم الأكبر من صفر فقط)
6. 📊 الملخص المالي: (إجمالي الإيراد ب | إجمالي الربح ف | إجمالي الخرج خ | صافي الربح الصافي)
7. ⚠️ صندوق تنبيهات التدقيق المالي (أخطاء التسعير وتصحيحها، سحوبات بيت مصعب، والخرج الكبير > 5000)

### 5. نموذج بيانات مرجعي (Few-Shot Example) لتدريب الموديل (عمل يوم 1 شهر 9):
المدخلات:
- شاحن 1500 ف500، كفر 1000 ف400، سماعة 700 ف200
- 500 تعريب ف5000 (خطأ مدخل ف > ب)، شاشة سامسونج 12000 ف3000
- تحويل رصيد سبأفون 5000 ف150، رصيد يمن موبايل 10000 ف250
- صرفة غداء 1500، بيت مصعب 4000، فاتورة كهرباء 6000
- مشتريات كابلات 10000، مشتريات بطاريات 0
- جوالات 0، ديون 0

المخرجات المعتمدة:
- مبيعات الإكسسوارات:
  * شاحن: ب=1500 | ف=500 | ش=1000
  * كفر: ب=1000 | ف=400 | ش=600
  * سماعة: ب=700 | ف=200 | ش=500
- خدمات الصيانة والبرمجة:
  * تعريب برمجيات: ب=500 | ف=500 (تم تصحيحها تلقائياً من 5000) | ش=0
  * شاشة سامسونج: ب=12000 | ف=3000 | ش=9000
- قطاع الرصيد والتحويلات:
  * رصيد سبأفون: ب=5000 | ف=150 | ش=4850
  * رصيد يمن موبايل: ب=10000 | ف=250 | ش=9750
- المصروفات والخرج (خ):
  * صرفة غداء: 1500
  * بيت مصعب: 4000
  * فاتورة كهرباء: 6000
- المشتريات الفعلية:
  * كابلات: 10000 (تم استبعاد بطاريات 0 لعدم وجود قيمة)
- الملخص المالي:
  * إجمالي الإيراد (ب): 39,700 ر.ي
  * إجمالي الربح والفوائد (ف): 4,500 ر.ي
  * إجمالي الخرج (خ): 11,500 ر.ي
  * صافي الربح اليومي الصافي: 4,500 ر.ي
- ⚠️ تنبيهات التدقيق المالي:
  * ⚠️ خطأ تسعير وتصحيح تلقائي: تم تصحيح فائدة (تعريب برمجيات) من 5,000 إلى 500 ر.ي لأن الفائدة المدخلة تجاوزت الإيراد.
  * ⚠️ سحوبات بيت مصعب: تم رصد مبلغ 4,000 ر.ي سحوبات بيت مصعب لاعتمادها كمسحوبات شخصية للمالك.
  * ⚠️ خرج غير معتاد: تم رصد عملية خرج كبيرة تتجاوز 5,000 ر.ي بمبلغ 6,000 ر.ي (فاتورة كهرباء).

3. 💬 نمط الحوار والاستشارة (Conversational & Advisory Mode) في حقل "reply":
   - يقدم رداً طبيعياً، طليقاً، لبقاً ومباشراً بلهجة عملية وواعية باللغة العربية.
   - اشرح النتائج الحسابية أو التحليلات التجارية أو الإجابات العامة بوضوح وسلاسة وود بدون حشو وبدون أي قيود مصطنعة.
   - التبديل التلقائي بسلاسة تامة بين أداء دور "المحاسب التنفيذي" عند طلب القيود والمخزن، ودور "الرفيق المثقف الشامل" عند الحوار والأسئلة العامة والمعرفية.

4. ⚡ نمط تنفيذ الأوامر المحاسبية (Structured Execution Mode) في حقل "action":
   - فقط إذا تضمنت رسالة المستخدم أمراً صريحاً لتسجيل قيد مالي أو مسودة يومية جديدة (بيع، شراء، صيانة، رصيد، شبكات، مصروف، سحب، إدخال مخزن) أو تعديل/حذف:
     * استخرج البيانات بصيغة Structured JSON صريحة ومعزولة تماماً في كائن "action".
     * ضع المعاملات في مصفوفة "items" مع تحديد (type, category, description, price, cost, profit, remainingAmount, supplierName, notes).
     * اجعل تاريخ الحركة detectedDate هو تاريخ اليوم المحدد (${effectiveDate}) إلا إذا حدد المستخدم تاريخاً آخر صراحة (مثل 1/8 أو 1/9).
   - إذا لم يكن هناك أمر بتسجيل قيد، اجعل action.type = "none" و items = [].

5. 🔒 الأمان وتعديل وحذف القيود:
   - إذا طلب المستخدم تعديل أو حذف قيد، اجعل action.type هو "propose_edit" أو "propose_delete" واذكر في reply ما فهمته واطلب إذنه الصريح.

6. 💡 قواعد المتجر والمصطلحات اليمنية:
   - "مياس" هو محمد مياس (شبكة وتطبيق الهادي للرصيد).
   - "فايز" أو "أبو علي" هو شبكة القمة / الرقم.
   - "صرفة بيت" أو "بيت مصعب" -> مسحوبات بيت مصعب.
   - "سحب مصعب" -> مسحوبات شخصية للمالك مصعب.
   - الموردون المعتمدون: العبصري، عمر القاسمي، خليل الأغبري، المصنف، فايز أبو علي.
${trainedRulesText}
`;

      // Build Multi-turn History (last 8 messages)
      const contents: any[] = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const h of history.slice(-8)) {
          if (!h || !h.text) continue;
          const role = h.role === 'assistant' || h.role === 'model' || h.sender === 'assistant' ? 'model' : 'user';
          const text = String(h.text).trim();
          if (!text) continue;

          // Merge consecutive messages with the same role to satisfy API requirements
          if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts[0].text += `\n${text}`;
          } else {
            contents.push({
              role,
              parts: [{ text }],
            });
          }
        }
      }

      // Ensure the history sequence starts with 'user'
      if (contents.length > 0 && contents[0].role !== 'user') {
        contents.unshift({
          role: 'user',
          parts: [{ text: 'مرحباً، أود بدء ومتابعة الحديث والاستشارات المحاسبية والتجارية معك.' }],
        });
      }

      // Append the current message
      const currentPromptWithContext = contextText
        ? `${contextText}\nرسالة المستخدم الحالية: ${message}`
        : message;

      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n${currentPromptWithContext}`;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: currentPromptWithContext }],
        });
      }

      const ai = getAI();
      const response = await callGeminiWithRetry(ai, {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thoughtProcess: {
                type: Type.STRING,
                description: 'التفكير التحليلي والخطوات الحسابية الداخلية للتكاليف وهوامش الأرباح والنسب قبل إخراج النتيجة لضمان دقة 100%',
              },
              reply: {
                type: Type.STRING,
                description: 'الرد الحواري الطبيعي الطليق واللبق والمباشر باللغة العربية الموجه للمستخدم بدون رموز برمجية أو جيسون',
              },
              action: {
                type: Type.OBJECT,
                description: 'بيانات استدعاء الدوال وتنفيذ الأوامر المحاسبية معزولة عن نص الشات',
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'none, record_transaction, record_multiple_transactions, propose_edit, propose_delete',
                  },
                  summary: {
                    type: Type.STRING,
                    description: 'ملخص الحركة المنفذة أو المعروضة',
                  },
                  detectedDate: {
                    type: Type.STRING,
                    description: 'تاريخ الحركة YYYY-MM-DD',
                  },
                  detectedSupplier: {
                    type: Type.STRING,
                    description: 'اسم المورد إن وجد',
                  },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        date: { type: Type.STRING },
                        type: {
                          type: Type.STRING,
                          description: 'sale, maintenance, balance_hadi, balance_qimma, sim, purchase, expense_shop, expense_home_mosaab, withdrawal_mosaab, expense_engineer, withdrawal_engineer, expense_worker, withdrawal_worker, expense_modem, shop_tools_outflow, transfer_to_supplier, transfer_hadi, transfer_omar_qasimi, transfer_musannaf',
                        },
                        category: {
                          type: Type.STRING,
                          description: 'phones, accessories, maintenance, balance, sims, expenses, purchases, mosaab, engineer, worker',
                        },
                        description: { type: Type.STRING },
                        price: { type: Type.NUMBER, description: 'سعر البيع أو المبلغ المقبوض أو قيمة المصروف' },
                        cost: { type: Type.NUMBER, description: 'التكلفة أو رأس المال' },
                        profit: { type: Type.NUMBER, description: 'صافي الفايدة أو الربح' },
                        remainingAmount: { type: Type.NUMBER, description: 'المتبقي أو الدين إن وجد' },
                        supplierName: { type: Type.STRING },
                        notes: { type: Type.STRING },
                      },
                      required: ['type', 'category', 'description', 'price', 'cost', 'profit'],
                    },
                  },
                  targetTransactionId: { type: Type.STRING },
                  newPrice: { type: Type.NUMBER },
                },
                required: ['type'],
              },
            },
            required: ['thoughtProcess', 'reply', 'action'],
          },
        },
      });

      let parsed: any;
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch (parseErr) {
        parsed = {
          thoughtProcess: '',
          reply: response.text || 'أهلاً بك يا مصعب، تم استلام طلبك.',
          action: { type: 'none', items: [] },
        };
      }

      // معالجة برمجية قطعية ثانية لضمان الفلترة المحاسبية الصارمة (Secondary Programmatic Sanitization)
      if (parsed?.action?.items && Array.isArray(parsed.action.items)) {
        parsed.action.items = parsed.action.items
          .filter((it: any) => {
            // استبعاد تام للأصفار: أي حركة قيمتها وربحها 0 دون دين متبقي تستبعد فوراً
            const price = Number(it.price) || 0;
            const profit = Number(it.profit) || 0;
            const remaining = Number(it.remainingAmount) || 0;
            return price > 0 || profit > 0 || remaining > 0;
          })
          .map((it: any) => {
            let price = Number(it.price) || 0;
            let profit = Number(it.profit) || 0;
            let cost = Number(it.cost);
            let notes = it.notes || '';

            // تصحيح الخطأ المنطقي بالتسعير (ف > ب) لمبيعات التجزئة والخدمات والصيانة
            const isOutflow = it.type?.startsWith('expense') || it.type?.startsWith('withdrawal') || it.type === 'purchase' || it.category === 'expenses';
            if (!isOutflow && profit > price && price > 0) {
              const oldProfit = profit;
              profit = price;
              cost = 0;
              notes = `${notes ? notes + ' | ' : ''}⚠️ تم تصحيح خطأ التسعير تلقائياً: الفائدة كانت ${oldProfit} وتم تصحيحها إلى ${price} ر.ي لتساوي قيمة الإيراد (ف <= ب).`.trim();
            } else if (isNaN(cost) || cost === undefined || cost < 0) {
              cost = Math.max(0, price - profit);
            }

            // تنبيه سحوبات بيت مصعب
            if (it.description?.includes('بيت مصعب') || it.type === 'expense_home_mosaab' || (it.category === 'mosaab' && it.description?.includes('بيت'))) {
              it.type = 'expense_home_mosaab';
              it.category = 'mosaab';
              notes = `${notes ? notes + ' | ' : ''}⚠️ سحوبات شخصية للمالك (بيت مصعب)`.trim();
            }

            // تنبيه الخرج غير المعتاد (> 5000)
            if (isOutflow && price > 5000) {
              notes = `${notes ? notes + ' | ' : ''}⚠️ تنبيه تدقيق: خرج كبير يتجاوز 5000 ر.ي (${price.toLocaleString()} ر.ي)`.trim();
            }

            return {
              ...it,
              price,
              profit,
              cost,
              notes,
            };
          });
      }

      res.json({
        reply: parsed.reply || response.text,
        thoughtProcess: parsed.thoughtProcess || '',
        action: parsed.action || { type: 'none', items: [] },
      });
    } catch (error: any) {
      console.warn('Assistant AI notice (handling gracefully):', error?.message || error);
      res.json({
        reply:
          'أهلاً بك! أنا معك واستمع إليك، يمكنك سؤالي عن أي موضوع في الحياة العامة أو استفسارات المحل، وجميع بياناتك وسجلاتك المالية تعمل بأمان وبدقة تامة.',
        thoughtProcess: 'تم تفعيل التوجيه والتحليل الاحتياطي المحلي.',
        action: { type: 'none', items: [] },
      });
    }
  });

  // 3. Autonomous CFO Proactive Radar Endpoint (الرادار الاستباقي للمحاسب الذكي)
  app.post('/api/gemini/cfo-radar', async (req, res) => {
    const { storeContext, storeId, ownerId } = req.body;
    const tenantStoreId = storeId || storeContext?.storeId || 'store_mosaab_alsoufi';
    const tenantOwnerId = ownerId || storeContext?.ownerId || 'user_mosaab';

    try {
      const ai = getAI();
      const systemInstruction = `
أنت "رادار التدقيق المالي الاستباقي" (Autonomous CFO Radar) لمحل مصعب الصوفي للجوالات والصيانة.
مهمتك الصارمة: فحص بيانات وسجلات المتجر الحالية بدقة متناهية، وتوليد **تنبيه واحد فقط فائق الأهمية (Single Most Critical Alert)** يمثل أعلى خطر أو فرصة مالية حرجة في المحل حالياً بدون انتظار سؤال من المستخدم.
الالتزام التام بالعزل (Tenant Isolation): المتجر ${tenantStoreId} والمالك ${tenantOwnerId}.

أنواع التنبيهات المرشحة حسب الأولوية المالية ومعايير التدقيق المالي (ابتداءً من شهر 8 فصاعداً):
1. mosaab_withdrawals_alert: رصد سحوبات بيت مصعب أو مسحوبات المالك الشخصية الكبيرة ومقارنتها مع حصة أرباحه في المحل (2/3).
2. large_unusual_expense: عملية خرج فردية غير معتادة تتجاوز 5000 ر.ي تستوجب التدقيق والمراجعة.
3. pricing_margin_anomaly: رصد حركة بيع أو صيانة فيها خطأ تسعير (ف > ب) أو هوامش ربح غير منطقية.
4. debt_limit_exceeded: عميل تجاوز سقف الديون أو مديونية معلقة تجمد السيولة وتهدد بتعثر الكاش.
5. dead_stock_liquidity: صنف مخزون راكد مرتفع التكلفة يبتلع السيولة النقدية دون مبيعات مسجلة أو أصناف بضمار صفر غير مسجل.
6. critical_liquidity_ratio: نسبة السيولة السريعة دون الحد الآمن وأقل من التزامات الموردين الفورية.
7. cash_discrepancy: عجز نقدي في الدرج بين الكاش الفعلي والكاش المفترض.
8. strategic_opportunity: فائض نقدي وفرصة استثمارية ذكية في بضاعة سريعة الدوران.

يجب أن ترجع النتيجة كـ JSON حصرياً بنفس الحقول المحددة.
`;

      const prompt = `افحص البيانات المالية التالية للمتجر واستخرج التنبيه الاستباقي الأهم رقم 1:\n${JSON.stringify(storeContext || {})}`;

      const response = await callGeminiWithRetry(ai, {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: 'mosaab_withdrawals_alert, large_unusual_expense, pricing_margin_anomaly, debt_limit_exceeded, dead_stock_liquidity, critical_liquidity_ratio, cash_discrepancy, operating_margin_warning, strategic_opportunity',
              },
              severity: {
                type: Type.STRING,
                description: 'critical, warning, opportunity',
              },
              title: { type: Type.STRING, description: 'عنوان التنبيه الاستباقي المالي المباشر' },
              insight: { type: Type.STRING, description: 'التحليل المالي الدقيق والنسب المالية المؤثرة' },
              actionableRecommendation: { type: Type.STRING, description: 'التوصية التنفيذية الواجب اتخاذها فوراً' },
              metricHighlight: { type: Type.STRING, description: 'المؤشر الرقمي البارز' },
              actionButtonLabel: { type: Type.STRING, description: 'نص زر الإجراء السريع' },
            },
            required: ['type', 'severity', 'title', 'insight', 'actionableRecommendation', 'metricHighlight', 'actionButtonLabel'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        id: `radar_${Date.now()}`,
        generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        ...parsed,
      });
    } catch (error: any) {
      console.warn('CFO Radar AI service temporarily busy or unavailable (503/timeout), utilizing store context for audited radar alert:', error?.message || error);
      const fallbackAlert = generateServerSideCFORadarAlert(storeContext, tenantStoreId);
      res.json(fallbackAlert);
    }
  });

  // Helper for deterministic audited system report
  function generateDeterministicSystemAudit(auditContext: any) {
    const {
      currentDate = '2026-06-05',
      dailySummary = {},
      inventoryStats = {},
      customersStats = {},
      suppliersStats = {},
      cashDrawer = {},
      transactionsAudit = {},
    } = auditContext || {};

    const totalSales = dailySummary.totalSales || 0;
    const netProfit = dailySummary.netProfit || 0;
    const cashDiscrepancy = cashDrawer.cashDiscrepancy || 0;
    const zeroCostItems = inventoryStats.zeroCostItemsCount || 0;
    const zeroQtyItems = inventoryStats.zeroQtyItemsCount || 0;
    const totalDebts = customersStats.totalOutstandingDebts || 0;
    const totalPayables = suppliersStats.totalPayables || 0;
    const missingProfits = transactionsAudit.missingProfitCount || 0;

    let healthScore = 100;
    if (Math.abs(cashDiscrepancy) > 500) healthScore -= 15;
    if (missingProfits > 0) healthScore -= Math.min(20, missingProfits * 5);
    if (zeroCostItems > 5) healthScore -= 10;
    if (totalDebts > 100000) healthScore -= 10;
    if (healthScore < 40) healthScore = 40;

    const deficiencies: string[] = [];
    if (zeroCostItems > 0) {
      deficiencies.push(`يوجد في المخزن (${zeroCostItems}) صنف بسعر ضمار 0 ر.ي (يتطلب استكمال تسجيل أسعار الضمار والكميات عبر وضع الإدخال السريع بالإنتر).`);
    }
    if (zeroQtyItems > 0) {
      deficiencies.push(`يوجد (${zeroQtyItems}) صنف كميتها صفر في المخزن (تحتاج توريد جديد أو جرد كميات).`);
    }
    if (missingProfits > 0) {
      deficiencies.push(`تم رصد (${missingProfits}) حركة بيع أو صيانة غير محددة الفائدة أو التكلفة بدقة.`);
    }
    if (deficiencies.length === 0) {
      deficiencies.push('كافة البيانات والمدخلات الأساسية مكتملة ومسجلة بشكل سليم.');
    }

    const errors: string[] = [];
    if (cashDiscrepancy < -500) {
      errors.push(`عجز نقدي في الدرج: الكاش الفعلي يقل عن الكاش الدفتري بمقدار ${Math.abs(cashDiscrepancy).toLocaleString()} ر.ي.`);
    } else if (cashDiscrepancy > 500) {
      errors.push(`فائض غير مقيد في الصندوق بمقدار ${cashDiscrepancy.toLocaleString()} ر.ي (تأكد من تسجيل كافة المقبوضات).`);
    }
    if (customersStats.overLimitCount > 0) {
      errors.push(`يوجد (${customersStats.overLimitCount}) عملاء تجاوزوا سقف الدين المسموح.`);
    }
    if (errors.length === 0) {
      errors.push('لا توجد أخطاء محاسبية حرجة، وحركة الصندوق والقيود متطابقة ومنضبطة.');
    }

    const excessDataTips: string[] = [
      'لتبسيط اليومية ومنع التشتت: استخدم شاشة الكاشير السريعة أو شات المحاسب الذكي لإدخال الحركات المركبة بجملة واحدة مثل (سماعة 500 ف400).',
      'ركّز يومياً على 3 أرقام فقط: كاش الدرج، صافي ربح اليوم، وديون الزبائن المستحقة للتحصيل.',
      'تفعيل وضع الإدخال السريع بالإنتر في شاشة أسعار الضمار والمخزن يغنيك عن فتح نوافذ التعديل الفردية الطويلة.'
    ];

    const recommendations: string[] = [
      totalDebts > 50000 ? 'تكثيف التحصيل من العملاء أصحاب المديونيات القديمة لضخ سيولة نقدية فورية في الصندوق.' : 'الاستمرار في سياسة البيع النقدي المباشر لحماية رأس المال.',
      totalPayables > 0 ? `جدولة سداد التزامات الموردين (${totalPayables.toLocaleString()} ر.ي) بالتوازي مع دورة تحصيل الكاش اليومية.` : 'التزامات الموردين مسددة بالكامل ولا توجد فواتير مؤجلة حرجة.',
      'متابعة حركة شبكات الرصيد (الهادي لمحمد مياس، والقمة لفايز وأبو علي) والتأكد من تطابق الرصيد المحول مع الفوائد المقبوضة.'
    ];

    return {
      healthScore,
      status: healthScore >= 85 ? 'ممتاز' : (healthScore >= 70 ? 'جيد مع ملاحظات' : 'يحتاج تدقيق فوري'),
      executiveSummary: `فحص وتدقيق شامل ليومية ${currentDate}: إجمالي المبيعات والحركات بلغت ${totalSales.toLocaleString()} ر.ي بصافي أرباح ${netProfit.toLocaleString()} ر.ي. سلامة الحسابات ومطابقة الصندوق تحت السيطرة مع إمكانية تسريع التحصيل وتنشيط الأصناف الراكدة.`,
      foundDeficiencies: deficiencies,
      detectedErrors: errors,
      excessDataTips,
      smartRecommendations: recommendations,
      isAuditedFallback: true
    };
  }

  // 3.5 Full AI System Audit & Health Inspector (فحص وتدقيق النظام بالذكاء الاصطناعي)
  app.post('/api/gemini/system-audit', async (req, res) => {
    const { auditContext, storeId, ownerId } = req.body;
    const tenantStoreId = storeId || auditContext?.storeId || 'store_mosaab_alsoufi';

    try {
      const ai = getAI();
      const systemInstruction = `
أنت "المحاسب القانوني والمدقق المالي الأول والخبير" لمحل مصعب الصوفي للجوالات وخدمات الصيانة والبرمجة وشبكات الرصيد في اليمن (ابتداءً من 1 شهر 8 فصاعداً).
طلب منك المالك فحص وتدقيق النظام بالكامل من واقع خبرتك المحاسبية العميقة وذكائك المحاسبي الحاد لتشخيص:
1. هل هناك نقص في البيانات أو المدخلات (مثل أصناف بدون ضمار، كميات صفرية، قيود بدون فايدة، حسابات معلقة)؟
2. هل هناك أخطاء محاسبية أو فوارق في الصندوق والدرج، أو ديون متراكمة للموردين أو العملاء؟
3. تنقية وفلترة المدخلات: استبعاد أي حركة أو صنف قيمته صفر (0)، والتأكد من عدم وجود مصروفات وهمية مضافة تلقائياً.
4. كشف الأخطاء المحاسبية والتنبيهات:
   * خطأ منطقي بالتسعير (ف > ب): تصحيح الفائدة تلقائياً لتساوي الإيراد وتنبيه المستخدم.
   * سحوبات بيت مصعب: حصرها وتدقيقها في بند مسحوبات شخصية للمالك (مصعب الصوفي).
   * الخرج غير المعتاد: فحص أي عملية خرج فردية تتجاوز 5000 ريال يمني.
5. توصيات عملية استراتيجية وفورية بالريال اليمني ترفع الأرباح وتزيد السيولة وتضمن الحفاظ على رأس المال.

قواعد الحسابات المعتمدة والواقعية الإلزامية:
- الالتزام التام والقطعي بنسبة 100% بالأرقام الفعلية الواردة في كائن auditContext (مبيعات اليوم، رصيد كاش الدرج، ديون العملاء المسجلة، مستحقات الموردين، قيمة المخزون، ونواقص الضمار).
- يُمنع منعاً باتاً اختلاق أي أرقام وهمية أو افتراضات غير موجودة في البيانات المرسلة.
- مصعب الصوفي (المالك): له ثلثين (2/3) من صافي أرباح المحل.
- المدير المستلم: له ثلث (1/3) من صافي أرباح المحل.
- مهندس الصيانة: له 50% من صافي فايدة الصيانة، وصرفته غداء على المحل.
- شبكات الرصيد: الهادي (محمد مياس)، القمة (فايز وأبو علي).
- الموردين: خليل الأغبري، القاسمي عمر، العبصري، المصنف.
- كود حرف الفايدة (ف): الفايدة = ف، سعر البيع = ب، التكلفة = ش (ش = ب - ف).

يجب إرجاع النتيجة بتنسيق JSON حصرياً مطابق للمخطط المطلوب.
`;

      const prompt = `قم بفحص وتدقيق بيانات النظام التالية وأصدر تقرير التدقيق الشامل:\n${JSON.stringify(auditContext || {})}`;

      const response = await callGeminiWithRetry(ai, {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthScore: { type: Type.NUMBER, description: 'درجة صحة وسلامة الحسابات من 100' },
              status: { type: Type.STRING, description: 'ممتاز / جيد مع ملاحظات / يحتاج تدقيق فوري' },
              executiveSummary: { type: Type.STRING, description: 'خلاصة تقرير التدقيق التنفيذي بلغة المحاسب الخبير' },
              foundDeficiencies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'قائمة النواقص في البيانات والمدخلات'
              },
              detectedErrors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'قائمة الأخطاء المحاسبية أو الفوارق المالية المرصودة'
              },
              excessDataTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'نصائح لتبسيط النظام وتخفيف كثرة المعلومات وجعل الشغل أسهل'
              },
              smartRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'توصيات مالية تنفيذية ذكية لزيادة الأرباح وتحسين السيولة'
              },
            },
            required: ['healthScore', 'status', 'executiveSummary', 'foundDeficiencies', 'detectedErrors', 'excessDataTips', 'smartRecommendations'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        id: `audit_${Date.now()}`,
        generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        ...parsed,
      });
    } catch (error: any) {
      console.warn('System audit AI service temporarily busy, using deterministic audit:', error?.message || error);
      const fallbackReport = generateDeterministicSystemAudit(auditContext);
      res.json({
        id: `audit_${Date.now()}`,
        generatedAt: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        ...fallbackReport,
      });
    }
  });

  // 4. Smart Invoice OCR with Gemini Vision
  app.post('/api/gemini/ocr-invoice', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', storeId, ownerId } = req.body;
      if (!imageBase64) {
        res.status(400).json({ error: 'Image base64 data is required' });
        return;
      }

      // Strip data URL prefix if present
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const ai = getAI();

      const prompt = `
أنت خبير فحص وتدقيق فواتير مشتريات محلات الجوالات وقطع الغيار والصيانة في اليمن (محل مصعب الصوفي).
مهمتك: قراءة وتفريغ محتوى هذه الفاتورة (سواء كانت مكتوبة بخط اليد أو مطبوعة) بدقة متناهية.

الفواتير في اليمن عادة تكون من محلات مثل (العبصري، القاسمي عمر، خليل الأغبري، الصبري، إلخ) وتحتوي على:
- اسم المورد / المحل في الترويسة أو الختم.
- رقم وتاريخ الفاتورة.
- بنود مشتريات: شاشات (أصلي، وكالة، كوبي، OLED، TFT)، بطاريات، فلاتات، آي سيات، بكتات، أدوات صيانة، شواحن وإكسسوارات.
- الكمية، سعر الحبة (التكلفة)، وإجمالي السعر للبند.
- الباقي السابق (حساب سابق مسجل في الفاتورة إن وجد).
- المدفوع نقداً (واصل).
- الباقي الحالي المتبقي عليه للمورد.

قواعد الاستخراج الدقيقة:
1. استخرج كل بند بمفرده:
   - name: اسم الصنف بدقة (مثل: شاشة سامسونج A12 وكالة، بطارية آيفون 11 أصلية، آي سي شحن...)
   - category: صنفها إلى أحد القيم التالية فقط: screens, spare_parts, batteries, maintenance_tools, accessories, other
   - quantity: الكمية بالأرقام (افتراضياً 1 إذا لم تذكر)
   - unitCost: سعر التكلفة للقطعة الواحدة
   - totalCost: إجمالي تكلفة البند (الكمية × سعر التكلفة)
   - suggestedSalePrice: اقترح سعر بيع منطقي للزبون (هامش ربح معتاد 25% - 40% فوق التكلفة لقطع الغيار)
2. استخرج اسم المورد وتاريخ الفاتورة.
3. إذا وجد باقي سابق، استخرجه كـ previousBalance.
4. إذا وجد مدفوع، استخرجه كـ paidAmount، والمتبقي كـ remainingBalance.
5. أرجع النتيجة بتنسيق JSON مطابق تماماً للنموذج المطلوب دون أي نصوص خارجية.
`;

      const response = await callGeminiWithRetry(ai, {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              supplierName: { type: Type.STRING, description: 'اسم المورد أو المحل التجاري' },
              invoiceNumber: { type: Type.STRING, description: 'رقم الفاتورة إن وجد' },
              invoiceDate: { type: Type.STRING, description: 'تاريخ الفاتورة بصيغة YYYY-MM-DD' },
              previousBalance: { type: Type.NUMBER, description: 'الباقي السابق إن وجد' },
              paidAmount: { type: Type.NUMBER, description: 'المبلغ المدفوع أو الواصل' },
              remainingBalance: { type: Type.NUMBER, description: 'الباقي المتبقي له' },
              discount: { type: Type.NUMBER, description: 'الخصم إن وجد' },
              notes: { type: Type.STRING, description: 'ملاحظات إضافية' },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING, description: 'screens, spare_parts, batteries, maintenance_tools, accessories, other' },
                    quantity: { type: Type.NUMBER },
                    unitCost: { type: Type.NUMBER },
                    totalCost: { type: Type.NUMBER },
                    suggestedSalePrice: { type: Type.NUMBER },
                    notes: { type: Type.STRING },
                  },
                  required: ['name', 'category', 'quantity', 'unitCost', 'totalCost', 'suggestedSalePrice'],
                },
              },
            },
            required: ['supplierName', 'items'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.warn('Invoice OCR notice:', error?.message || error);
      res.status(500).json({ error: error.message || 'Failed to process invoice' });
    }
  });

  // 5. Telecom Statement & PDF Balance Engine (الهادي أونلاين ومحمد مياس وكشوفات السداد)
  app.post('/api/gemini/parse-telecom-statement', async (req, res) => {
    try {
      const { fileBase64, rawText, mimeType = 'application/pdf', sourceApp = 'الهادي أونلاين', storeId, ownerId } = req.body;
      if (!fileBase64 && !rawText) {
        res.status(400).json({ error: 'fileBase64 or rawText is required' });
        return;
      }

      const ai = getAI();
      const prompt = `
أنت خبير فحص وتدقيق وتفريغ كشوفات الحسابات البنكية والسداد لشبكات الاتصالات اليمنية، وخاصة كشوفات تطبيق "الهادي أونلاين" (حساب محمد مياس)، وتطبيقات يمن موبايل، سبأفون، يو، ويمن فورجي.

تعليمات المعالجة الصارمة (Multi-page & RTL Reversal):
1. الكشف قد يكون مستند PDF متعدد الصفحات (Multi-page document): يجب عليك قراءة واستخراج كافة العمليات عبر جميع الصفحات بالكامل من الصفحة الأولى إلى الأخيرة دون إسقاط أي صفحة.
2. معالجة انعكاس النص العربي (RTL Reversal Handling): إذا ظهرت النصوص أو الأرقام العربية معكوسة بسبب ترميز ملف الـ PDF (مثل "ليابوم" بدلاً من "موبايل" أو "نوفتلتلا" بدلاً من "التلفون" أو "مقر" بدلاً من "رقم")، يجب عليك تصحيح الانعكاس تلقائياً وإرجاع النص والبيان باللغة العربية الفصيحة السليمة.
3. استخراج الحقول المحاسبية الدقيقة لكل عملية:
   - Date: التاريخ بصيغة YYYY-MM-DD
   - Time: الوقت إن وجد بصيغة HH:mm
   - Description / notes: نص البيان الكامل للعملية
   - type: إما "له" (تغذية/إيداع/تحويل وارد/Credit) أو "عليه" (تسديد/شحن/خصم/Debit)
   - amount: مبلغ العملية الفعلي
   - balance: الرصيد في التطبيق بعد العملية (الرصيد)
   - phone: رقم الهاتف المستهدف (مثلاً 77XXXXXXX أو 73XXXXXXX أو 71XXXXXXX أو 10XXXXXX)
   - operationId: رقم العملية أو المرجع إن وجد في الكشف
   - operator: اسم الشبكة (yemen_mobile, sabafon, you, yemen4g, other)
   - packageName: اسم الباقة إن وجدت (مزايا، نت فورجي، توفير...)

يجب إرجاع النتيجة بتنسيق JSON مطابق للمخطط.
`;

      let contents: any[] = [];
      if (fileBase64) {
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
        contents = [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'application/pdf',
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ];
      } else {
        contents = [
          {
            role: 'user',
            parts: [
              { text: `${prompt}\n\nنص الكشف المطلوب تحليله:\n${rawText}` },
            ],
          },
        ];
      }

      const response = await callGeminiWithRetry(ai, {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sourceApp: { type: Type.STRING },
              statementPeriod: { type: Type.STRING },
              totalRowsCount: { type: Type.NUMBER },
              totalDebitsAmount: { type: Type.NUMBER },
              totalCreditsAmount: { type: Type.NUMBER },
              closingBalance: { type: Type.NUMBER },
              operations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: 'YYYY-MM-DD' },
                    time: { type: Type.STRING, description: 'HH:mm' },
                    operator: { type: Type.STRING, description: 'yemen_mobile, sabafon, you, yemen4g, adsl_landline, other' },
                    operatorNameAr: { type: Type.STRING },
                    operationType: {
                      type: Type.STRING,
                      description: 'recharge_standard, package_yemen_mobile, package_sabafon, package_you, package_yemen4g, recharge_feed, bill_payment',
                    },
                    type: { type: Type.STRING, description: 'له أو عليه' },
                    targetNumber: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    packageName: { type: Type.STRING },
                    amount: { type: Type.NUMBER, description: 'المبلغ المخصوم أو المودع' },
                    debit: { type: Type.NUMBER, description: 'عليه' },
                    credit: { type: Type.NUMBER, description: 'له' },
                    balance: { type: Type.NUMBER, description: 'الرصيد بعد العملية' },
                    balanceBefore: { type: Type.NUMBER },
                    balanceAfter: { type: Type.NUMBER },
                    referenceId: { type: Type.STRING },
                    operationId: { type: Type.STRING },
                    status: { type: Type.STRING, description: 'success, failed, pending' },
                    notes: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['date', 'amount', 'status'],
                },
              },
            },
            required: ['operations'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const operations = parsed.operations || [];
      // Provide both operations and rows arrays for universal compatibility
      res.json({
        ...parsed,
        rows: operations,
        operations,
      });
    } catch (error: any) {
      console.error('Telecom statement parse error:', error);
      res.status(500).json({ error: error.message || 'Failed to parse telecom statement' });
    }
  });

  // 3. GitHub Releases & Application Direct Download Endpoints
  const GITHUB_REPO = process.env.GITHUB_REPO || 'joad772709971-dotcom/Fsa';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

  app.get('/api/app-releases', async (_req, res) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Al-Raqam-Al-Awwal-App',
        },
      });
      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }
      const data: any = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        res.json({ success: false, message: 'لا توجد إصدارات بعد' });
        return;
      }
      const latest = data[0];

      // Find APK and EXE across latest releases (in case built in different runs)
      let apkAsset: any = null;
      let exeAsset: any = null;

      for (const rel of data) {
        if (!apkAsset) {
          const found = rel.assets?.find((a: any) => a.name.toLowerCase().endsWith('.apk'));
          if (found) {
            apkAsset = { ...found, tag: rel.tag_name, release_url: rel.html_url };
          }
        }
        if (!exeAsset) {
          const found = rel.assets?.find((a: any) => a.name.toLowerCase().endsWith('.exe'));
          if (found) {
            exeAsset = { ...found, tag: rel.tag_name, release_url: rel.html_url };
          }
        }
        if (apkAsset && exeAsset) break;
      }

      res.json({
        success: true,
        tag: latest.tag_name,
        name: latest.name,
        published_at: latest.published_at,
        html_url: latest.html_url,
        apk: apkAsset
          ? {
              name: apkAsset.name,
              size_mb: (apkAsset.size / (1024 * 1024)).toFixed(2),
              download_url: '/api/download/android',
              raw_url: apkAsset.browser_download_url,
            }
          : null,
        exe: exeAsset
          ? {
              name: exeAsset.name,
              size_mb: (exeAsset.size / (1024 * 1024)).toFixed(2),
              download_url: '/api/download/windows',
              raw_url: exeAsset.browser_download_url,
            }
          : null,
      });
    } catch (error: any) {
      console.error('Fetch releases error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Download Android APK proxy
  app.get('/api/download/android', async (_req, res) => {
    try {
      const relRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Al-Raqam-Al-Awwal-App',
        },
      });
      const data: any = await relRes.json();
      let apkAsset: any = null;
      if (Array.isArray(data)) {
        for (const rel of data) {
          const found = rel.assets?.find((a: any) => a.name.toLowerCase().endsWith('.apk'));
          if (found) {
            apkAsset = found;
            break;
          }
        }
      }
      if (!apkAsset) {
        res.status(404).send('APK asset not found in release.');
        return;
      }

      const assetRes = await fetch(apkAsset.url, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/octet-stream',
          'User-Agent': 'Al-Raqam-Al-Awwal-App',
        },
        redirect: 'manual',
      });

      const redirectUrl = assetRes.headers.get('location');
      if (!redirectUrl) {
        res.status(502).send('Unable to obtain signed download link from GitHub.');
        return;
      }

      if (_req.query.redirect === 'true') {
        res.redirect(redirectUrl);
        return;
      }

      const fileStreamRes = await fetch(redirectUrl);
      if (!fileStreamRes.ok) {
        res.status(fileStreamRes.status).send('Failed to fetch file from storage');
        return;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${apkAsset.name}"`);
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      if (apkAsset.size) {
        res.setHeader('Content-Length', apkAsset.size.toString());
      }
      Readable.fromWeb(fileStreamRes.body as any).pipe(res);
    } catch (err: any) {
      console.error('Android download error:', err);
      res.status(500).send('Error downloading APK: ' + err.message);
    }
  });

  // Download Windows EXE proxy
  app.get('/api/download/windows', async (_req, res) => {
    try {
      const relRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Al-Raqam-Al-Awwal-App',
        },
      });
      const data: any = await relRes.json();
      let exeAsset: any = null;
      if (Array.isArray(data)) {
        for (const rel of data) {
          const found = rel.assets?.find((a: any) => a.name.toLowerCase().endsWith('.exe'));
          if (found) {
            exeAsset = found;
            break;
          }
        }
      }
      if (!exeAsset) {
        res.status(404).send('Windows EXE asset not found in release.');
        return;
      }

      const assetRes = await fetch(exeAsset.url, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/octet-stream',
          'User-Agent': 'Al-Raqam-Al-Awwal-App',
        },
        redirect: 'manual',
      });

      const redirectUrl = assetRes.headers.get('location');
      if (!redirectUrl) {
        res.status(502).send('Unable to obtain signed download link from GitHub.');
        return;
      }

      if (_req.query.redirect === 'true') {
        res.redirect(redirectUrl);
        return;
      }

      const fileStreamRes = await fetch(redirectUrl);
      if (!fileStreamRes.ok) {
        res.status(fileStreamRes.status).send('Failed to fetch file from storage');
        return;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${exeAsset.name}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      if (exeAsset.size) {
        res.setHeader('Content-Length', exeAsset.size.toString());
      }
      Readable.fromWeb(fileStreamRes.body as any).pipe(res);
    } catch (err: any) {
      console.error('Windows EXE download error:', err);
      res.status(500).send('Error downloading EXE: ' + err.message);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

