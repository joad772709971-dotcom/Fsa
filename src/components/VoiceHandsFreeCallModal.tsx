import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Package,
  ShoppingBag,
  CreditCard,
  Wrench,
  User,
  ArrowRightLeft,
  Sparkles,
  Info,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Receipt,
  Smartphone,
  AlertTriangle,
  Layers,
  Bike,
  Coins,
  ScanLine,
  Tag,
  Calculator,
  Users,
  Wifi,
  Briefcase,
  FileText,
  Calendar,
  PieChart,
  ShieldCheck,
  Clock,
  RotateCcw,
  Barcode,
  Banknote,
  Archive,
  Table,
  LayoutDashboard,
  Truck,
  MessageSquare,
  Bot,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  VoiceSectionType,
  VoiceInspectedItem,
  SECTION_METADATA,
  analyzeVoiceAction,
  normalizeArabicSpeech,
} from '../utils/voiceHandsFreeParser';
import {
  speakArabic,
  stopSpeaking,
  playVoiceChime,
  createContinuousVoiceSession,
  ContinuousVoiceSessionController,
  isAndroidNativeTTSAvailable,
  playAudioTts,
  requestMicrophonePermission,
} from '../utils/voiceAndPermissions';
import { getApiBaseUrl } from '../utils/apkConfig';
import { Transaction, TransactionType, Category } from '../types';

interface VoiceHandsFreeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onCommitTransaction: (tx: Transaction) => void;
  onCommitMultipleTransactions?: (txs: Transaction[]) => void;
  onNavigateToTab?: (tab: any) => void;
  transactions?: Transaction[];
  suppliers?: any[];
  inventory?: any[];
  dailySummary?: any;
  monthlySettlement?: any;
}

const SECTION_ICONS: Record<VoiceSectionType, React.ComponentType<{ className?: string }>> = {
  inventory: Package,
  sales: ShoppingBag,
  expenses: CreditCard,
  maintenance: Wrench,
  withdrawals: User,
  account_statement: FileSpreadsheet,
  suppliers: Truck,
  official_vouchers: Receipt,
  sims: Smartphone,
  damaged: AlertTriangle,
  assets: Layers,
  delivery: Bike,
  cash_drawer: Coins,
  invoice_ocr: ScanLine,
  cost_pricing_guide: Tag,
  pos_cashier: Calculator,
  customers: Users,
  networks: Wifi,
  employees: Briefcase,
  reports: FileText,
  monthly_settlement: Calendar,
  profit_sharing: PieChart,
  forensic_audit: ShieldCheck,
  shortages: Clock,
  returns: RotateCcw,
  barcode_manager: Barcode,
  partners_funding: Banknote,
  archive: Archive,
  master_table: Table,
  dashboard: LayoutDashboard,
};

// Priority quick-access categories for the toolbar
const POPULAR_SECTIONS: VoiceSectionType[] = [
  'inventory',
  'sales',
  'account_statement',
  'official_vouchers',
  'sims',
  'cash_drawer',
  'expenses',
  'maintenance',
  'damaged',
  'assets',
  'delivery',
  'invoice_ocr',
  'cost_pricing_guide',
  'suppliers',
  'customers',
  'withdrawals',
  'shortages',
  'networks',
  'reports',
];

export const VoiceHandsFreeCallModal: React.FC<VoiceHandsFreeCallModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onCommitTransaction,
  onNavigateToTab,
  transactions = [],
  suppliers = [],
  inventory = [],
  dailySummary,
  monthlySettlement,
}) => {
  const [activeSection, setActiveSection] = useState<VoiceSectionType>('inventory');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [audioState, setAudioState] = useState<'listening' | 'speaking' | 'paused' | 'stopped'>('stopped');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [pendingItem, setPendingItem] = useState<VoiceInspectedItem | null>(null);
  const [committedItems, setCommittedItems] = useState<VoiceInspectedItem[]>([]);
  const [voiceLog, setVoiceLog] = useState<{ id: string; text: string; sender: 'user' | 'assistant'; time: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [isAnsweringQuery, setIsAnsweringQuery] = useState(false);
  const [showAllSectionsDrawer, setShowAllSectionsDrawer] = useState(false);

  const sessionControllerRef = useRef<ContinuousVoiceSessionController | null>(null);
  const pendingItemRef = useRef<VoiceInspectedItem | null>(null);
  const activeSectionRef = useRef<VoiceSectionType>(activeSection);
  const isSpeakingRef = useRef<boolean>(false);

  // Synchronize refs with state for asynchronous event loop access
  useEffect(() => {
    pendingItemRef.current = pendingItem;
  }, [pendingItem]);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // Add message to in-call visual log
  const logMessage = useCallback((text: string, sender: 'user' | 'assistant') => {
    const time = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
    setVoiceLog((prev) => [{ id: `log_${Date.now()}_${Math.random()}`, text, sender, time }, ...prev.slice(0, 20)]);
  }, []);

  // Hands-free voice speech out with controller pause/resume
  const speakAssistant = useCallback(
    (text: string, onDone?: () => void) => {
      if (speakerMuted) {
        onDone?.();
        return;
      }

      isSpeakingRef.current = true;
      sessionControllerRef.current?.pauseForSpeech();

      speakArabic(text, {
        rate: 1.05,
        onStart: () => {
          setAudioState('speaking');
        },
        onEnd: () => {
          isSpeakingRef.current = false;
          setAudioState('listening');
          sessionControllerRef.current?.resumeAfterSpeech();
          onDone?.();
        },
        onError: () => {
          isSpeakingRef.current = false;
          setAudioState('listening');
          sessionControllerRef.current?.resumeAfterSpeech();
          onDone?.();
        },
      });
    },
    [speakerMuted]
  );

  // Commit pending item to system
  const handleCommitItem = useCallback(
    (itemToCommit: VoiceInspectedItem) => {
      let txType: TransactionType = 'sale';
      let cat: Category = 'accessories';

      if (itemToCommit.section === 'inventory') {
        txType = 'purchase';
        cat = itemToCommit.category === 'phones' ? 'phones' : 'accessories';
      } else if (itemToCommit.section === 'sales') {
        txType = 'sale';
        cat = itemToCommit.category === 'phones' ? 'phones' : 'accessories';
      } else if (itemToCommit.section === 'expenses') {
        txType = 'expense_shop';
        cat = 'expenses';
      } else if (itemToCommit.section === 'maintenance') {
        txType = 'maintenance';
        cat = 'maintenance';
      } else if (itemToCommit.section === 'withdrawals') {
        txType = 'withdrawal_mosaab';
        cat = 'mosaab';
      }

      const newTx: Transaction = {
        id: `voice_tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: currentDate,
        time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        type: txType,
        category: cat,
        description: `${itemToCommit.name} (${itemToCommit.quantity} حبة) [باركود: ${itemToCommit.barcode}]`,
        price: itemToCommit.totalPrice,
        cost: itemToCommit.totalCost,
        profit: itemToCommit.expectedProfit,
        notes: `إدخال صوتي مستمر - قسم ${SECTION_METADATA[itemToCommit.section]?.label || itemToCommit.section}`,
        paymentMethod: 'cash',
      };

      onCommitTransaction(newTx);
      setCommittedItems((prev) => [itemToCommit, ...prev]);
      setPendingItem(null);
      pendingItemRef.current = null;
      setLiveTranscript('');

      playVoiceChime('success');
      logMessage(`تم اعتماد وحفظ: ${itemToCommit.name}`, 'assistant');
      speakAssistant('تم الحفظ بنجاح، تفضل بالذي بعده.');
    },
    [currentDate, logMessage, onCommitTransaction, speakAssistant]
  );

  // Cancel / discard pending item
  const handleCancelItem = useCallback(() => {
    if (!pendingItemRef.current) return;
    const discardedName = pendingItemRef.current.name;
    setPendingItem(null);
    pendingItemRef.current = null;
    setLiveTranscript('');

    playVoiceChime('cancel');
    logMessage(`تم إلغاء: ${discardedName}`, 'assistant');
    speakAssistant('تم الإلغاء، تفضل بما تريد.');
  }, [logMessage, speakAssistant]);

  // Switch active section across all system screens
  const handleSwitchSection = useCallback(
    (newSec: VoiceSectionType, verbally = false) => {
      setActiveSection(newSec);
      activeSectionRef.current = newSec;
      playVoiceChime('switch');

      const meta = SECTION_METADATA[newSec];
      if (onNavigateToTab && meta?.tab) {
        onNavigateToTab(meta.tab);
      }

      logMessage(`تم التوجيه إلى: ${meta?.label || newSec}`, 'assistant');

      if (verbally) {
        speakAssistant(`تم التبديل إلى قسم ${meta?.label || newSec}، تفضل أنا معك.`);
      }
    },
    [logMessage, onNavigateToTab, speakAssistant]
  );

  // Conversational response & Financial consultation
  const handleConversationalQuery = useCallback(
    async (queryText: string) => {
      setIsAnsweringQuery(true);
      const norm = normalizeArabicSpeech(queryText);

      // Check for simple spoken math questions like "احسب 20 في 5" or "100 زائد 50"
      const mathMul = norm.match(/(?:احسب|كم|ضرب|حاصل)?\s*(\d+)\s*(?:في|ضرب|\*|x)\s*(\d+)/);
      if (mathMul && mathMul[1] && mathMul[2]) {
        const a = parseInt(mathMul[1], 10);
        const b = parseInt(mathMul[2], 10);
        const result = a * b;
        const ans = `ناتج ضرب ${a} في ${b} يساوي ${result.toLocaleString()}.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      const mathAdd = norm.match(/(?:احسب|كم|مجموع)?\s*(\d+)\s*(?:زائد|مع|\+)\s*(\d+)/);
      if (mathAdd && mathAdd[1] && mathAdd[2]) {
        const a = parseInt(mathAdd[1], 10);
        const b = parseInt(mathAdd[2], 10);
        const result = a + b;
        const ans = `مجموع ${a} زائد ${b} يساوي ${result.toLocaleString()}.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      const mathSub = norm.match(/(?:احسب|كم|طرح)?\s*(\d+)\s*(?:ناقص|\-)\s*(\d+)/);
      if (mathSub && mathSub[1] && mathSub[2]) {
        const a = parseInt(mathSub[1], 10);
        const b = parseInt(mathSub[2], 10);
        const result = a - b;
        const ans = `ناتج طرح ${b} من ${a} يساوي ${result.toLocaleString()}.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      const mathDiv = norm.match(/(?:احسب|كم|قسمة)?\s*(\d+)\s*(?:قسمه|قسمة|\/)\s*(\d+)/);
      if (mathDiv && mathDiv[1] && mathDiv[2]) {
        const a = parseInt(mathDiv[1], 10);
        const b = parseInt(mathDiv[2], 10);
        if (b !== 0) {
          const result = Math.round((a / b) * 100) / 100;
          const ans = `ناتج قسمة ${a} على ${b} يساوي ${result.toLocaleString()}.`;
          logMessage(ans, 'assistant');
          speakAssistant(ans, () => setIsAnsweringQuery(false));
          return;
        }
      }

      // 1. Instant local calculations (Zero latency responses)
      if (norm.includes('مبيعات') && (norm.includes('كم') || norm.includes('اليوم') || norm.includes('اجمالي'))) {
        const sales = dailySummary?.totalSales || 0;
        const count = transactions.filter((t) => t.type === 'sale').length;
        const ans = `إجمالي مبيعات اليوم هو ${sales.toLocaleString()} ريال يمني، من واقع ${count} حركة بيع مسجلة.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      if ((norm.includes('ارباح') || norm.includes('أرباح')) && (norm.includes('كم') || norm.includes('اليوم') || norm.includes('صافي'))) {
        const profit = dailySummary?.netProfit || 0;
        const ans = `صافي أرباح اليوم المحققة هو ${profit.toLocaleString()} ريال يمني بعد خصم تكلفة الشراء والمصاريف.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      if ((norm.includes('صندوق') || norm.includes('درج') || norm.includes('نقديه') || norm.includes('نقدية')) && (norm.includes('كم') || norm.includes('رصيد'))) {
        const cash = dailySummary?.cashNet || 0;
        const ans = `رصيد الصندوق والنقدية الحالية بالدرج هو ${cash.toLocaleString()} ريال يمني.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      if ((norm.includes('مصروفات') || norm.includes('مصاريف') || norm.includes('خرج')) && (norm.includes('كم') || norm.includes('اليوم'))) {
        const exp = dailySummary?.totalExpenses || 0;
        const ans = `إجمالي المصروفات والخرج اليوم هو ${exp.toLocaleString()} ريال يمني.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      if (norm.includes('موردين') || norm.includes('الموردين')) {
        const supCount = suppliers.length;
        const ans = `لديك ${supCount} موردين مسجلين في كشف الحساب. يمكنك أن تطلب مني فتح كشف الحساب أو سجل الموردين لعرض التفاصيل.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      if (norm.includes('مخزن') || norm.includes('المخزن') || norm.includes('بضاعه')) {
        const invCount = inventory.length;
        const ans = `يحتوي المخزن حالياً على ${invCount} صنف مسجل. يمكنك ذكر أي بضاعة جديدة مع السعر لتسجيلها، أو طلب فتح المخزن.`;
        logMessage(ans, 'assistant');
        speakAssistant(ans, () => setIsAnsweringQuery(false));
        return;
      }

      // 2. Intelligent AI Open-Domain Life Companion & Consultative Backend Call
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/gemini/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: queryText,
            isVoiceCall: true,
            currentDate,
            shopContext: {
              currentDate,
              totalSales: dailySummary?.totalSales || 0,
              netProfit: dailySummary?.netProfit || 0,
              totalExpenses: dailySummary?.totalExpenses || 0,
              transactionsCount: transactions.length,
              suppliersCount: suppliers.length,
              inventoryCount: inventory.length,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawReply = data.reply || data.message || '';
          const cleanReply = rawReply
            .replace(/[*#_`~\[\]]/g, '')
            .replace(/[-•]/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();

          if (cleanReply) {
            logMessage(cleanReply, 'assistant');
            speakAssistant(cleanReply, () => setIsAnsweringQuery(false));
            return;
          }
        }
      } catch (err) {
        console.warn('Voice AI consultation error:', err);
      }

      // 3. Fallback natural advisory reply
      const fallbackAns = 'أنا معك واستمع إليك، يمكنك سؤالي عن أي موضوع في الحياة العامة أو استفسارات المحل، أو توجيهي لأي قسم.';
      logMessage(fallbackAns, 'assistant');
      speakAssistant(fallbackAns, () => setIsAnsweringQuery(false));
    },
    [currentDate, dailySummary, inventory, logMessage, speakAssistant, suppliers, transactions]
  );

  // Process voice utterance
  const processUtterance = useCallback(
    (transcriptText: string) => {
      const clean = transcriptText.trim();
      if (!clean) return;

      logMessage(clean, 'user');

      const currentSec = activeSectionRef.current;
      const currentPending = pendingItemRef.current;

      const action = analyzeVoiceAction(clean, currentSec, Boolean(currentPending));

      if (action.type === 'switch_section') {
        handleSwitchSection(action.section, true);
        return;
      }

      if (action.type === 'greeting') {
        logMessage(action.replyText, 'assistant');
        speakAssistant(action.replyText);
        return;
      }

      if (action.type === 'conversational') {
        handleConversationalQuery(action.query);
        return;
      }

      if (action.type === 'commit_item') {
        if (currentPending) {
          handleCommitItem(currentPending);
        } else {
          speakAssistant('لا يوجد صنف بالمعاينة حالياً، تفضل بذكر الصنف وسأقوم بتجهيزه لك.');
        }
        return;
      }

      if (action.type === 'cancel_item') {
        if (currentPending) {
          handleCancelItem();
        } else {
          speakAssistant('لا يوجد صنف معروض لإلغائه.');
        }
        return;
      }

      if (action.type === 'inspect_item') {
        setPendingItem(action.item);
        pendingItemRef.current = action.item;
        setLiveTranscript('');

        playVoiceChime('prepared');
        logMessage(`تم تجهيز الصنف للمعاينة: ${action.item.name}`, 'assistant');
        speakAssistant('تم تجهيزه في الشاشة، تفضل بالذي بعده.');
        return;
      }

      // If neither an item nor a navigation/confirmation command:
      // Provide conversational consultation or answer question
      handleConversationalQuery(clean);
    },
    [handleCancelItem, handleCommitItem, handleConversationalQuery, handleSwitchSection, logMessage, speakAssistant]
  );

  const processUtteranceRef = useRef(processUtterance);
  const logMessageRef = useRef(logMessage);
  const speakAssistantRef = useRef(speakAssistant);

  useEffect(() => {
    processUtteranceRef.current = processUtterance;
  }, [processUtterance]);

  useEffect(() => {
    logMessageRef.current = logMessage;
  }, [logMessage]);

  useEffect(() => {
    speakAssistantRef.current = speakAssistant;
  }, [speakAssistant]);

  // Initialize and start continuous voice session on modal open
  useEffect(() => {
    if (!isOpen) {
      if (sessionControllerRef.current) {
        sessionControllerRef.current.stop();
        sessionControllerRef.current = null;
      }
      stopSpeaking();
      setIsSessionActive(false);
      setAudioState('stopped');
      setPendingItem(null);
      setLiveTranscript('');
      return;
    }

    // Modal Opened: Launch Continuous Voice Call silently without any annoying radar chime
    setIsSessionActive(true);

    // Request Android / Browser microphone permission programmatically on launch
    requestMicrophonePermission().catch((permErr) => {
      console.warn('Microphone permission request error:', permErr);
    });

    const controller = createContinuousVoiceSession({
      onTranscript: (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          processUtteranceRef.current(transcript);
        }
      },
      onError: (err) => {
        console.warn('Voice session error:', err);
      },
      onStateChange: (state) => {
        setAudioState(state);
      },
      langPreference: 'ar-YE',
    });

    sessionControllerRef.current = controller;

    // Welcome verbal greeting: speak greeting first, then seamlessly engage continuous mic listening
    logMessageRef.current('مرحباً بك، بماذا أساعدك؟', 'assistant');
    let hasStartedListening = false;

    const startListeningSafely = () => {
      if (hasStartedListening) return;
      hasStartedListening = true;
      if (sessionControllerRef.current) {
        sessionControllerRef.current.start();
      }
    };

    // Speak greeting and start listening on completion
    speakAssistantRef.current('مرحباً بك، بماذا أساعدك؟', () => {
      startListeningSafely();
    });

    // Fallback safety timer: ensure listening starts within 2.5s even if TTS is silent or slow
    const fallbackTimer = setTimeout(() => {
      startListeningSafely();
    }, 2200);

    return () => {
      clearTimeout(fallbackTimer);
      controller.stop();
      stopSpeaking();
      sessionControllerRef.current = null;
    };
  }, [isOpen]);

  // Audio test helper for Android / mobile users
  const handleTestAudio = () => {
    setIsTestingAudio(true);
    playVoiceChime('prepared');
    speakArabic('الصوت يعمل بنجاح في تطبيق الأندرويد. المايك جاهز للاستماع المستمر لكافة الأقسام.', {
      onEnd: () => setIsTestingAudio(false),
      onError: () => {
        setIsTestingAudio(false);
        playAudioTts('الصوت يعمل بنجاح عبر قناة الصوت الاحتياطية.');
      },
    });
  };

  if (!isOpen) return null;

  const currentSectionMeta = SECTION_METADATA[activeSection] || SECTION_METADATA.inventory;
  const ActiveIcon = SECTION_ICONS[activeSection] || Package;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 text-slate-100 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header: Call Status & Main Controls */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  audioState === 'speaking' || isAnsweringQuery
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/20 animate-pulse'
                    : audioState === 'listening'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-pulse'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Mic className="w-5 h-5" />
              </div>
              {audioState === 'listening' && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">المساعد الصوتي المفتوح لكافة الأقسام</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  المكالمة مفتوحة
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAnsweringQuery
                  ? 'المساعد يحلل ويستشير...'
                  : audioState === 'speaking'
                  ? 'المساعد يتحدث الآن...'
                  : audioState === 'listening'
                  ? 'المايك يستمع إليك باستمرار دون انقطاع'
                  : 'متوقف مؤقتاً'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpeakerMuted(!speakerMuted)}
              title={speakerMuted ? 'تشغيل صوت المساعد' : 'كتم صوت المساعد'}
              className={`p-2 rounded-lg border transition-colors ${
                speakerMuted
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {speakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleTestAudio}
              disabled={isTestingAudio}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
              title="تجربة خروج الصوت في الأندرويد والكمبيوتر"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              فحص الصوت
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-md shadow-rose-600/20"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              إنهاء المكالمة
            </button>
          </div>
        </div>

        {/* Section Navigation Quick Bar (Covers All Sections) */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs text-slate-400 whitespace-nowrap pl-1">القسم المستهدف:</span>
          {POPULAR_SECTIONS.map((secId) => {
            const meta = SECTION_METADATA[secId];
            if (!meta) return null;
            const Icon = SECTION_ICONS[secId] || Package;
            const isSelected = activeSection === secId;
            return (
              <button
                key={secId}
                onClick={() => handleSwitchSection(secId, false)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
                title={meta.shortDesc}
              >
                <Icon className="w-3.5 h-3.5" />
                {meta.label}
              </button>
            );
          })}

          <button
            onClick={() => setShowAllSectionsDrawer(!showAllSectionsDrawer)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 whitespace-nowrap"
            title="عرض جميع أقسام النظام الـ 30"
          >
            <SlidersHorizontal className="w-3 h-3" />
            كل الشاشات
          </button>
        </div>

        {/* Extended All Screens Drawer */}
        {showAllSectionsDrawer && (
          <div className="p-3 bg-slate-950 border-b border-slate-800 max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs animate-in slide-in-from-top-2">
            {(Object.keys(SECTION_METADATA) as VoiceSectionType[]).map((secKey) => {
              const meta = SECTION_METADATA[secKey];
              const Icon = SECTION_ICONS[secKey] || Package;
              const isSelected = activeSection === secKey;
              return (
                <button
                  key={secKey}
                  onClick={() => {
                    handleSwitchSection(secKey, false);
                    setShowAllSectionsDrawer(false);
                  }}
                  className={`p-2 rounded-lg text-right flex items-center gap-2 border transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Active Live Inspection Card */}
          {pendingItem ? (
            <div className="bg-gradient-to-b from-slate-800 to-slate-850 border-2 border-amber-500/60 rounded-xl p-4 sm:p-5 shadow-xl relative animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {SECTION_METADATA[pendingItem.section]?.label || pendingItem.section}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    باركود: {pendingItem.barcode}
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  جاهز بالمعاينة (في انتظار الأمر)
                </span>
              </div>

              {/* Item Name Headline */}
              <div className="mb-4">
                <div className="text-xs text-slate-400 mb-1">اسم الصنف المستخرج:</div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {pendingItem.name}
                </h3>
              </div>

              {/* Numerical Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-center">
                  <div className="text-xs text-slate-400 mb-1">الكمية</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-400">
                    {pendingItem.quantity} <span className="text-xs font-normal text-slate-400">حبة</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-center">
                  <div className="text-xs text-slate-400 mb-1">سعر الضمار (الشراء)</div>
                  <div className="text-lg sm:text-xl font-bold text-slate-200">
                    {pendingItem.costPrice.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">ر.ي</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-center">
                  <div className="text-xs text-slate-400 mb-1">سعر البيع (المفرق)</div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-400">
                    {pendingItem.sellingPrice.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">ر.ي</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-center">
                  <div className="text-xs text-slate-400 mb-1">الربح المتوقع</div>
                  <div className="text-lg sm:text-xl font-bold text-cyan-400">
                    {pendingItem.expectedProfit.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">ر.ي</span>
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm bg-slate-950/60 rounded-lg p-2.5 border border-slate-800 mb-4 font-mono">
                <span className="text-slate-300">
                  إجمالي الشراء: <strong className="text-amber-300">{pendingItem.totalCost.toLocaleString()} ر.ي</strong>
                </span>
                <span className="text-slate-300">
                  إجمالي المبيعات: <strong className="text-emerald-300">{pendingItem.totalPrice.toLocaleString()} ر.ي</strong>
                </span>
              </div>

              {/* Spoken Action Helper Banner */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-amber-200">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    قل بصوتك: <strong>«صح»</strong> أو <strong>«اعتمد»</strong> للحفظ، أو <strong>«إلغاء»</strong> للمسح، أو اذكر الصنف التالي مباشرة.
                  </span>
                </div>
              </div>

              {/* Quick Click Fallback Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCommitItem(pendingItem)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  اعتماد وحفظ [قل: صح]
                </button>
                <button
                  onClick={handleCancelItem}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <X className="w-4 h-4 text-rose-400" />
                  إلغاء وتراجع [قل: إلغاء]
                </button>
              </div>
            </div>
          ) : (
            /* Idle Listening Stage & Live Interactive Chat History */
            <div className="space-y-4">
              {/* Section Header Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">أنت الآن في قسم:</div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      {currentSectionMeta.label}
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {currentSectionMeta.categoryGroup || 'النظام'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 text-left">
                  <span>{currentSectionMeta.shortDesc}</span>
                </div>
              </div>

              {/* Conversational Stream Log */}
              {voiceLog.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto p-3 rounded-xl bg-slate-950/60 border border-slate-800 scrollbar-thin">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-800/80 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>سجل المحادثة والاستشارات الحية للجلسة:</span>
                  </div>
                  {voiceLog.map((log) => (
                    <div
                      key={log.id}
                      className={`flex gap-2.5 text-xs p-2 rounded-lg ${
                        log.sender === 'assistant'
                          ? 'bg-purple-950/40 border border-purple-800/30 text-purple-100'
                          : 'bg-slate-800/70 text-slate-200 mr-4'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {log.sender === 'assistant' ? (
                          <Bot className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-bold text-[11px] text-slate-300">
                            {log.sender === 'assistant' ? 'المساعد المحاسبي' : 'أنت'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                        </div>
                        <p className="leading-relaxed">{log.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state guidance */
                <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/50 p-6 text-center flex flex-col items-center justify-center min-h-[160px]">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse mb-3">
                    <Mic className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">
                    تحدث بحرية وبأي لهجة، المساعد يفهم كافة أقسام واستفسارات النظام
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mb-3">
                    يمكنك طلب فتح أي قسم مباشرة أو الاستفسار عن الأرباح والمبيعات، أو ذكر الأصناف لتسجيلها فوراً.
                  </p>
                </div>
              )}

              {/* Natural Voice Command Examples */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-amber-300 mb-1">توجيه الأقسام:</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    «افتح كشف الحساب» • «سجل سند قبض» • «قسم الشرائح» • «حركة الصندوق» • «قسم التوالف»
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-cyan-300 mb-1">الاستشارات والأسئلة:</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    «كم مبيعات اليوم؟» • «كم رصيد الصندوق؟» • «كم أرباح اليوم؟» • «من هم الموردين؟»
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-emerald-300 mb-1">تسجيل البضاعة والأسعار:</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    «شاحن أنكر 10 حبات شراء 2500 بيع 3500» • ثم قل «صح» للحفظ فوراً
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Transcript Stream */}
          {liveTranscript && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center gap-3 animate-in fade-in">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <div className="flex-1 text-xs sm:text-sm text-slate-200">
                <span className="text-slate-400 ml-1">ما تقوله الآن:</span>
                <strong className="text-white font-medium">{liveTranscript}</strong>
              </div>
            </div>
          )}

          {/* Session Committed Items Drawer */}
          {committedItems.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-slate-900/80"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تم اعتماد وحفظ ({committedItems.length}) صنف في هذه الجلسة</span>
                </div>
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showHistory && (
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto border-t border-slate-800">
                  {committedItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 text-xs border border-slate-800"
                    >
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {SECTION_METADATA[item.section]?.label || item.section} • {item.quantity} حبة • ضمار {item.costPrice} • بيع {item.sellingPrice}
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <div className="text-emerald-400 font-bold">+{item.expectedProfit.toLocaleString()} ر.ي</div>
                        <div className="text-[10px] text-slate-500">{item.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Diagnostic & Quick Instructions */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>المحرك: {isAndroidNativeTTSAvailable() ? 'Native Android TTS (APK)' : 'Web/Audio Stream Engine'}</span>
          </div>

          <div className="text-slate-400">
            كشف يومية: <strong className="text-slate-200 font-mono">{currentDate}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
