import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Plus,
  Check,
  RotateCcw,
  Bot,
  User,
  Wand2,
  Calendar,
  Layers,
  ArrowRight,
  Volume2,
  VolumeX,
  Square,
  AlertCircle,
  HelpCircle,
  Radio,
  SlidersHorizontal,
  Eye,
  Edit,
  Brain,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Upload,
  Camera,
  FileText,
  Tag,
  FileSpreadsheet,
  Download,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  Category,
  Supplier,
  InventoryItem,
  AuthUser,
  CFORadarAlert,
  AutonomousCFOContext,
  NavTab,
  ScannedInvoiceResult,
  TelecomStatementRow,
  TelecomOperator,
  TelecomOperationType,
} from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  speakArabic,
  stopSpeaking,
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  requestMicrophonePermission,
  unlockAudioAndSpeechSynthesis,
} from '../utils/voiceAndPermissions';
import { getApiBaseUrl, isRunningInApk } from '../utils/apkConfig';
import { compressImageForOcr } from '../utils/imageCompressor';
import { parseEntryLocally } from '../utils/localAccountingParser';
import { DailyStructuredInputDashboard } from './DailyStructuredInputDashboard';
import { SmartAIParsedPreviewTable } from './SmartAIParsedPreviewTable';
import { SmartAIDayEditor } from './SmartAIDayEditor';
import { SmartAIQuickActionsBar, SmartAIAssistantViewMode } from './SmartAIQuickActionsBar';
import { SmartInvoiceOCR } from './SmartInvoiceOCR';
import { TelecomStatementEngine } from './TelecomStatementEngine';
import { PackagePricingCatalog } from './PackagePricingCatalog';
import { SmartSystemAuditView } from './SmartSystemAuditModal';
import { SmartAITrainingModal } from './SmartAITrainingModal';
import { CFORadarBanner } from './CFORadarBanner';
import { buildAutonomousCFOContext, generateLocalCFORadarAlert } from '../utils/cfoContext';
import { loadCustomers, getActiveStoreId, getActiveOwnerId } from '../utils/storage';
import {
  getAITrainingRules,
  saveAITrainingRule,
  getCategoryLabel,
  AITrainingRule,
} from '../utils/aiTrainingStorage';
import {
  parseDateFromNaturalText,
  formatArabicDateDisplay,
  getShiftedDate,
} from '../utils/aiDateHelper';
import { ForensicAuditorService } from '../services/forensicAuditorService';
import { InvoiceVerificationModal } from './InvoiceVerificationModal';
import { AIAssistantTelecomStatementCard, ChatTelecomStatementData } from './AIAssistantTelecomStatementCard';
import { AIAssistantInvoiceCard, ChatScannedInvoiceData } from './AIAssistantInvoiceCard';
import { AIPackagePricingQuickModal } from './AIPackagePricingQuickModal';
import { findCatalogMatchForOperation } from '../utils/telecomCatalogStorage';
import { saveTelecomStatementRows, calculateTelecomStatementSummary } from '../utils/telecomStatementStorage';
import { approveAndPostScannedInvoice } from '../utils/invoiceOcrStorage';
import { VoiceHandsFreeCallModal } from './VoiceHandsFreeCallModal';
import { generateDynamicFinancialSummary } from '../utils/dynamicFinancialContext';

export interface PendingApprovalAction {
  id: string;
  type: 'delete' | 'edit';
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  targetTransactionId: string;
  targetDate: string;
  description: string;
  originalPrice: number;
  newPrice?: number;
  originalTx: Transaction;
  proposedTx?: Transaction;
  diffSummary: string;
  requiresPermissionReason: string;
}

interface SmartAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onDateChange: (date: string) => void;
  transactions: Transaction[];
  onSaveTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  availableDates: string[];
  onAddParsedTransactions: (transactions: Transaction[]) => void;
  onOverwriteDayTransactions?: (date: string, newTxList: Transaction[]) => void;
  shopContext?: any;
  suppliers: Supplier[];
  inventory?: InventoryItem[];
  currentUser?: AuthUser | null;
  dailySummary?: any;
  monthlySettlement?: any;
  onNavigateToTab?: (tab: NavTab) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  parsedItems?: any[];
  isClarification?: boolean;
  linkedDate?: string;
  approvalAction?: PendingApprovalAction;
  isTrainingNotice?: boolean;
  radarAlert?: CFORadarAlert;
  isVoiceResponse?: boolean;
  autoplayBlocked?: boolean;
  telecomStatement?: ChatTelecomStatementData;
  scannedInvoice?: ChatScannedInvoiceData;
  thoughtProcess?: string;
}

export const SmartAIAssistant: React.FC<SmartAIAssistantProps> = ({
  isOpen,
  onClose,
  currentDate,
  onDateChange = () => {},
  transactions = [],
  onSaveTransaction = () => {},
  onDeleteTransaction = () => {},
  availableDates = [],
  onAddParsedTransactions,
  onOverwriteDayTransactions,
  shopContext,
  suppliers = [],
  inventory = [],
  currentUser = null,
  dailySummary,
  monthlySettlement,
  onNavigateToTab,
}: SmartAIAssistantProps) => {
  const [viewMode, setViewMode] = useState<SmartAIAssistantViewMode>('daily_input');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [parsedDetectedDate, setParsedDetectedDate] = useState<string | undefined>(undefined);
  const [parsedDetectedSupplier, setParsedDetectedSupplier] = useState<string | undefined>(undefined);
  const [parseSummary, setParseSummary] = useState<string>('');

  // Autonomous CFO & Proactive Radar state
  const [radarAlert, setRadarAlert] = useState<CFORadarAlert | null>(null);
  const [isRadarScanning, setIsRadarScanning] = useState(false);
  const [isRadarDismissed, setIsRadarDismissed] = useState(true);
  const hasTriggeredInitialRadar = useRef(false);

  // Dynamic Autonomous CFO Store Context with audited financial ratios
  const cfoContext = React.useMemo(() => {
    let customersList: any[] = [];
    try {
      customersList = loadCustomers();
    } catch (e) {
      console.warn('Failed to load customers for CFO context:', e);
    }

    return buildAutonomousCFOContext({
      currentUser,
      currentDate,
      transactions,
      suppliers,
      inventory: inventory || [],
      customers: customersList,
      dailySummary,
      monthlySettlement,
    });
  }, [currentUser, currentDate, transactions, suppliers, inventory, dailySummary, monthlySettlement]);

  // Dynamic Live Financial Context for Gemini System Prompt (Accounts, Currencies, Categories, Top Items)
  const dynamicFinancialContext = React.useMemo(() => {
    let customersList: any[] = [];
    try {
      customersList = loadCustomers();
    } catch (e) {
      console.warn('Failed to load customers for dynamic summary:', e);
    }

    return generateDynamicFinancialSummary({
      suppliers,
      inventory: inventory || [],
      customers: customersList,
    });
  }, [suppliers, inventory]);

  // Voice features state
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isHandsFreeCallOpen, setIsHandsFreeCallOpen] = useState(false);

  // Document, Statement & Invoice OCR State
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [parsingDocStatus, setParsingDocStatus] = useState('');
  const [selectedInvoiceForVerification, setSelectedInvoiceForVerification] = useState<ScannedInvoiceResult | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pendingPdfFileForChoice, setPendingPdfFileForChoice] = useState<File | null>(null);

  // Hidden file input refs
  const statementFileInputRef = useRef<HTMLInputElement>(null);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  // Hints and quick shorthand guide toggle
  const [showHintsSection, setShowHintsSection] = useState<boolean>(false);

  // Default welcome message with shorthand hints
  const INITIAL_WELCOME_MESSAGE: ChatMessage = {
    id: 'msg_init',
    sender: 'assistant',
    text: 'مرحباً بك! أنا رفيقك ومساعدك الذكي الشامل ومستشارك المالي والتنفيذي.\n\nيسعدني دائماً مساعدتك في إدارة حسابات المحل، ضبط المخزون، حل المسائل الحسابية، والإجابة عن أي استفسار في مختلف مجالات المعرفة والحياة العامة.\n\n💡 **أكواد الاختصارات السريعة للبضاعة والمخزن:**\n• **ج**: جوالات\n• **ك**: إكسسوارات\n• **ص**: صيانة\n• **ش**: شرايح\n• **ر**: رصيد وسداد\n• **م**: بضاعة سابقة للمخزن\n\nتفضل بسؤالي عن أي موضوع أو أرسل قيودك وبضاعتك مباشرة وسأتولى كل شيء!',
    timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
  };

  // Persistent Chat: Load from localStorage so background tasks and navigation don't clear chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_smart_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // استبعاد الرسائل الترحيبية المسبقة ورسائل الرادار التلقائية لتوفير مساحة عمل نظيفة تماماً
          const clean = parsed.filter(
            (m) => m && m.id !== 'msg_init' && !m.id.startsWith('radar_msg_')
          );
          return clean;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved chat messages', e);
    }
    return [];
  });

  // Save chat to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('mosaab_smart_ai_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat messages', e);
    }
  }, [messages]);

  // Handler to clear chat history with confirmation
  const handleClearChat = () => {
    if (window.confirm('هل تريد مسح سجل المحادثة مع المحاسب الذكي وبدء محادثة جديدة؟')) {
      setMessages([]);
      localStorage.removeItem('mosaab_smart_ai_chat_history');
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottomBtn(isFarFromBottom);
  };

  const scrollToBottomSmooth = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTopSmooth = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, parsedPreview, isLoading, isRecording]);

  // Handle playing voice response
  const handlePlayVoice = useCallback((text: string, msgId?: string, isUserClick = false) => {
    if (!isSpeechSynthesisSupported()) return;

    if (isUserClick) {
      unlockAudioAndSpeechSynthesis();
    }

    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(msgId || 'temp');
    const started = speakArabic(text, {
      onEnd: () => setSpeakingMsgId(null),
      onError: (err: any) => {
        setSpeakingMsgId(null);
        console.warn('Speech playback error / autoplay blocked:', err);
        if (msgId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, autoplayBlocked: true } : m))
          );
        }
      },
    });

    if (!started && msgId) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, autoplayBlocked: true } : m))
      );
    }
  }, [speakingMsgId]);

  // Handle explicit user approval for deletion or edit
  const handleApproveAction = useCallback(
    (msgId: string, approval: PendingApprovalAction) => {
      if (approval.type === 'delete') {
        onDeleteTransaction(approval.targetTransactionId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId && m.approvalAction
              ? {
                  ...m,
                  approvalAction: { ...m.approvalAction, status: 'approved' },
                }
              : m
          )
        );
        const confirmationText = `✅ تم حذف القيد "${approval.description}" بمبلغ ${approval.originalPrice.toLocaleString()} ر.ي بنجاح من كشف ${approval.targetDate} بناءً على موافقتك وإذنك الصريح.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `confirm_${Date.now()}`,
            sender: 'assistant',
            text: confirmationText,
            timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
            linkedDate: approval.targetDate,
          },
        ]);
        if (autoSpeak) {
          handlePlayVoice(`تم حذف القيد ${approval.description} بنجاح.`);
        }
      } else if (approval.type === 'edit' && approval.proposedTx) {
        onSaveTransaction(approval.proposedTx);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId && m.approvalAction
              ? {
                  ...m,
                  approvalAction: { ...m.approvalAction, status: 'approved' },
                }
              : m
          )
        );
        const confirmationText = `✅ تم تعديل القيد "${approval.description}" إلى مبلغ ${(approval.newPrice || 0).toLocaleString()} ر.ي بنجاح وحفظه في كشف يوم ${approval.targetDate} بناءً على موافقتك وإذنك الصريح.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `confirm_${Date.now()}`,
            sender: 'assistant',
            text: confirmationText,
            timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
            linkedDate: approval.targetDate,
          },
        ]);
        if (autoSpeak) {
          handlePlayVoice(
            `تم تعديل القيد ${approval.description} إلى ${approval.newPrice} ريال يمني بنجاح.`
          );
        }
      }
    },
    [onDeleteTransaction, onSaveTransaction, autoSpeak, handlePlayVoice]
  );

  const handleRejectAction = useCallback(
    (msgId: string, approval: PendingApprovalAction) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.approvalAction
            ? {
                ...m,
                approvalAction: { ...m.approvalAction, status: 'rejected' },
              }
            : m
        )
      );
      const rejectText = `🚫 تم إلغاء العملية بناءً على رفضك. بقيت بيانات "${approval.description}" كما هي في السجلات دون أي مساس أو تغيير.`;
      setMessages((prev) => [
        ...prev,
        {
          id: `reject_${Date.now()}`,
          sender: 'assistant',
          text: rejectText,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          linkedDate: approval.targetDate,
        },
      ]);
      if (autoSpeak) {
        handlePlayVoice('تم إلغاء العملية وبقيت البيانات دون أي تغيير.');
      }
    },
    [autoSpeak, handlePlayVoice]
  );

  // Handle PDF Telecom Statement Parsing & Calculations
  const handleProcessStatementFile = useCallback(async (file: File) => {
    setIsParsingDoc(true);
    setParsingDocStatus('جاري استخراج كشف السداد ومطابقة الباقات وحساب المبيعات والأرباح بالذكاء الاصطناعي...');
    try {
      let fileBase64: string | undefined;
      let rawText: string | undefined;

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        rawText = await file.text();
      }

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/gemini/parse-telecom-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          fileBase64,
          mimeType: file.type || 'application/pdf',
          sourceApp: file.name.includes('هادي') ? 'الهادي أونلاين' : 'تطبيق خدمات سداد',
          storeId: getActiveStoreId(),
          ownerId: getActiveOwnerId(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'تعذر معالجة كشف السداد');
      }

      const data = await res.json();
      const rawOps = data.operations || data.rows || [];

      if (!Array.isArray(rawOps) || rawOps.length === 0) {
        throw new Error('لم يتم العثور على أي عمليات مسجلة داخل هذا الكشف. يرجى التأكد من وضوح الملف.');
      }

      const extractedRows: TelecomStatementRow[] = rawOps.map((row: any, idx: number) => {
        const cost = Number(row.amount) || 0;
        const op = (row.operator || 'yemen_mobile') as TelecomOperator;
        const match = findCatalogMatchForOperation(
          op,
          row.packageName || row.notes || '',
          cost
        );

        const sellingPrice = match ? match.customerSellingPrice : (Number(row.sellingPrice) || Math.round(cost * 1.15));
        const netProfit = sellingPrice - cost;

        const opDate = row.date || new Date().toISOString().split('T')[0];
        const opTime = row.time || '12:00';
        const validOpType: TelecomOperationType =
          row.operationType === 'bill_payment' ? 'bill_payment' :
          row.operationType === 'recharge_feed' ? 'recharge_feed' :
          op === 'sabafon' ? 'package_sabafon' :
          op === 'you' ? 'package_you' :
          op === 'yemen4g' ? 'package_yemen4g' :
          op === 'yemen_mobile' ? 'package_yemen_mobile' : 'recharge_standard';

        return {
          id: `tel_row_${Date.now()}_${idx}`,
          timestamp: `${opDate} ${opTime}:00`,
          date: opDate,
          time: opTime,
          operator: op,
          operatorNameAr: row.operatorNameAr || (op === 'sabafon' ? 'سبأفون' : op === 'you' ? 'يو' : op === 'yemen4g' ? 'يمن فورجي' : 'يمن موبايل'),
          operationType: validOpType,
          targetNumber: row.targetNumber || '000000000',
          packageName: row.packageName || (match ? match.packageName : 'باقة رصيد'),
          amount: cost,
          sellingPrice,
          netProfit,
          balanceBefore: Number(row.balanceBefore) || undefined,
          balanceAfter: Number(row.balanceAfter) || undefined,
          referenceId: row.referenceId || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
          status: (row.status === 'failed' ? 'failed' : 'success') as 'success' | 'failed',
          sourceApp: data.sourceApp || 'الهادي أونلاين',
          notes: row.notes || '',
          storeId: getActiveStoreId(),
          ownerId: getActiveOwnerId(),
        };
      });

      // Save to telecom statement persistent storage
      saveTelecomStatementRows(extractedRows);

      const statementData: ChatTelecomStatementData = {
        statementId: `stmt_${Date.now()}`,
        sourceApp: data.sourceApp || 'الهادي أونلاين',
        statementPeriod: data.statementPeriod,
        fileName: file.name,
        allRows: extractedRows,
        selectedPeriod: 'all',
      };

      const newMsgId = `msg_${Date.now()}`;
      const botMsg: ChatMessage = {
        id: newMsgId,
        sender: 'assistant',
        text: `📊 **تم تحليل كشف السداد بنجاح (${file.name})!**\nاستخرجت لك **${extractedRows.length} عملية**، وطابقتها مع كتالوج أسعار الباقات لحساب المبيعات وصافي الفوائد.\nيمكنك تحديد الأيام أو السنة التي تريد حسابها وتعديل تسعيرة أي باقة مباشرة أدناه:`,
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        telecomStatement: statementData,
        isVoiceResponse: true,
      };

      setMessages((prev) => [...prev, botMsg]);

      const initialSummary = calculateTelecomStatementSummary(extractedRows);
      const voiceSpeech = `تم تحليل كشف السداد بنجاح واستخراج ${extractedRows.length} عملية. إجمالي مبيعات الرصيد ${initialSummary.totalSellingPrice.toLocaleString('ar-YE')} ريال، وصافي الأرباح ${initialSummary.totalNetProfit.toLocaleString('ar-YE')} ريال. يمكنك تحديد الأيام وتعديل أسعار الباقات وحفظها.`;
      if (autoSpeak) {
        handlePlayVoice(voiceSpeech, newMsgId, true);
      }
    } catch (err: any) {
      console.error('Failed to parse statement file:', err);
      alert(err.message || 'حدث خطأ أثناء معالجة كشف السداد');
    } finally {
      setIsParsingDoc(false);
      setParsingDocStatus('');
    }
  }, [autoSpeak, handlePlayVoice]);

  // Handle Handwritten Purchase Invoice Processing via OCR
  const handleProcessInvoiceFile = useCallback(async (file: File) => {
    setIsParsingDoc(true);
    setParsingDocStatus('جاري ضغط الصورة وفحص خط اليد واستخراج الأصناف بالذكاء الاصطناعي...');
    try {
      let base64: string;
      let mimeType: string = file.type || 'image/jpeg';

      try {
        const compressed = await compressImageForOcr(file, 1600, 1600, 0.82);
        base64 = compressed.base64;
        mimeType = compressed.mimeType;
      } catch (compErr) {
        console.warn('Compression fallback to raw reader:', compErr);
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/gemini/ocr-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          storeId: getActiveStoreId(),
          ownerId: getActiveOwnerId(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'تعذر تحليل الفاتورة');
      }

      const data = await res.json();
      const items = (data.items || []).map((item: any, idx: number) => ({
        id: `item_${Date.now()}_${idx}`,
        name: item.name || 'قطعة غيار',
        category: item.category || 'spare_parts',
        quantity: Number(item.quantity) || 1,
        unitCost: Number(item.unitCost) || 0,
        totalCost: Number(item.totalCost) || (Number(item.quantity) || 1) * (Number(item.unitCost) || 0),
        suggestedSalePrice: Number(item.suggestedSalePrice) || Math.round((Number(item.unitCost) || 0) * 1.3),
        notes: item.notes,
      }));

      const subtotal = items.reduce((sum: number, it: any) => sum + (it.totalCost || 0), 0);
      const discount = Number(data.discount) || 0;
      const totalAmount = Math.max(0, subtotal - discount);
      const previousBalance = Number(data.previousBalance) || 0;
      const paidAmount = Number(data.paidAmount) || 0;
      const remainingBalance = Number(data.remainingBalance) || Math.max(0, previousBalance + totalAmount - paidAmount);

      const parsedInvoice: ScannedInvoiceResult = {
        id: `inv_scan_${Date.now()}`,
        invoiceNumber: data.invoiceNumber || `REC-${Date.now().toString().slice(-4)}`,
        invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
        supplierName: data.supplierName || 'مؤسسة قطع الغيار',
        items,
        subtotal,
        discount,
        totalAmount,
        previousBalance,
        paidAmount,
        remainingBalance,
        paymentStatus: remainingBalance === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'credit',
        linkToSupplierDebt: true,
        imageBase64: base64,
        notes: data.notes || '',
        storeId: getActiveStoreId(),
        ownerId: getActiveOwnerId(),
      };

      const newMsgId = `msg_${Date.now()}`;
      const botMsg: ChatMessage = {
        id: newMsgId,
        sender: 'assistant',
        text: `🧾 **تم تحليل فاتورة الشراء (خط اليد) بنجاح من ${parsedInvoice.supplierName}!**\nإجمالي الفاتورة **${parsedInvoice.totalAmount.toLocaleString('ar-YE')} ريال** بعدد **${items.length} أصناف**.\nيمكنك مراجعة وتعديل أي بند والموافقة لاعتمادها وترحيلها إلى المخزن وحساب المورد:`,
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        scannedInvoice: {
          invoice: parsedInvoice,
          isApproved: false,
        },
        isVoiceResponse: true,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Automatically open the verification & approval modal
      setSelectedInvoiceForVerification(parsedInvoice);
      setIsInvoiceModalOpen(true);

      const voiceSpeech = `تم قراءة فاتورة المشتريات من مؤسسة ${parsedInvoice.supplierName} بإجمالي ${parsedInvoice.totalAmount.toLocaleString('ar-YE')} ريال، يمكنك مراجعتها وتعديلها واعتمادها الآن.`;
      if (autoSpeak) {
        handlePlayVoice(voiceSpeech, newMsgId, true);
      }
    } catch (err: any) {
      console.error('Failed to parse invoice file:', err);
      alert(err.message || 'حدث خطأ أثناء قراءة الفاتورة');
    } finally {
      setIsParsingDoc(false);
      setParsingDocStatus('');
    }
  }, [autoSpeak, handlePlayVoice]);

  // Handle Approval & Posting of Verified Invoice
  const handleApproveInvoice = useCallback((verifiedInvoice: ScannedInvoiceResult) => {
    const result = approveAndPostScannedInvoice(verifiedInvoice);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.scannedInvoice?.invoice.id === verifiedInvoice.id) {
            return {
              ...m,
              scannedInvoice: {
                ...m.scannedInvoice,
                isApproved: true,
                approvedTxId: result.transactionId,
              },
            };
          }
          return m;
        })
      );

      setIsInvoiceModalOpen(false);
      setSelectedInvoiceForVerification(null);

      const speech = `تم اعتماد فاتورة المشتريات بنجاح وترحيل ${result.itemsCount} أصناف إلى المخزن وحساب المورد.`;
      if (autoSpeak) {
        handlePlayVoice(speech, `msg_appr_${Date.now()}`, true);
      }
    }
  }, [autoSpeak, handlePlayVoice]);

  // Drag and Drop Events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  }, [isDraggingOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type.startsWith('image/')) {
      handleProcessInvoiceFile(file);
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const lower = file.name.toLowerCase();
      if (
        lower.includes('هادي') ||
        lower.includes('سداد') ||
        lower.includes('رصيد') ||
        lower.includes('كشف') ||
        lower.includes('statement') ||
        lower.includes('telecom')
      ) {
        handleProcessStatementFile(file);
      } else {
        setPendingPdfFileForChoice(file);
      }
    } else if (file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.csv')) {
      handleProcessStatementFile(file);
    } else {
      alert('يرجى رفع ملف كشف رصيد (PDF) أو صورة/PDF لفاتورة مشتريات خط يد.');
    }
  }, [handleProcessInvoiceFile, handleProcessStatementFile]);

  // Stop speaking when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setSpeakingMsgId(null);
      if (recognitionRef.current && isRecordingRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsRecording(false);
    }
  }, [isOpen]);

  // Autonomous CFO Proactive Radar trigger
  const triggerRadarScan = useCallback(
    async (speak = true) => {
      setIsRadarScanning(true);
      // 1. Instant local heuristic and financial ratio calculation
      const localAlert = generateLocalCFORadarAlert(cfoContext);
      setRadarAlert(localAlert);

      // Add proactive alert to messages if not present
      setMessages((prev) => {
        const alreadyHasThisAlert = prev.some(
          (m) => m.radarAlert && m.radarAlert.type === localAlert.type
        );
        if (alreadyHasThisAlert) return prev;

        const radarMsg: ChatMessage = {
          id: `radar_msg_${Date.now()}`,
          sender: 'assistant',
          text: `📡 **تقرير الرادار المالي الاستباقي (Autonomous CFO):**\n\n**${localAlert.title}**\n\n${localAlert.insight}\n\n💡 **التوصية التنفيذية:** ${localAlert.actionableRecommendation}`,
          timestamp: localAlert.generatedAt,
          radarAlert: localAlert,
        };
        return [...prev, radarMsg];
      });

      if (speak && autoSpeak) {
        handlePlayVoice(`${localAlert.title}. التوصية: ${localAlert.actionableRecommendation}`);
      }

      // 2. Query the server AI for contextual deep insight
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/gemini/cfo-radar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeContext: cfoContext,
            storeId: cfoContext.storeId,
            ownerId: cfoContext.ownerId,
          }),
        });

        if (res.ok) {
          const serverAlert: CFORadarAlert = await res.json();
          if (serverAlert && serverAlert.title) {
            setRadarAlert((prev) => ({
              ...prev,
              ...serverAlert,
              generatedAt:
                serverAlert.generatedAt ||
                prev?.generatedAt ||
                new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
            }));
          }
        }
      } catch (err) {
        console.warn('Server CFO radar scan error (local fallback active):', err);
      } finally {
        setIsRadarScanning(false);
      }
    },
    [cfoContext, autoSpeak, handlePlayVoice]
  );

  // Reset proactive radar state when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasTriggeredInitialRadar.current = false;
    }
  }, [isOpen]);

  // Process text and send to AI
  const executeSend = useCallback(async (textToSend: string, isVoiceQuery = false) => {
    const query = textToSend.trim();
    if (!query || isLoading) return;

    const shouldSpeak = isVoiceQuery || autoSpeak;

    // Stop speaking any active speech when user sends a new message
    stopSpeaking();
    setSpeakingMsgId(null);

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLiveTranscript('');
    setIsLoading(true);

    // 0. Check for natural language date view or day queries (e.g., "اعرض عمل يوم 25 شهر 8")
    const dateCheck = parseDateFromNaturalText(query, currentDate, availableDates);
    if (dateCheck.isDayViewQuery && dateCheck.targetDate && !dateCheck.hasAdditionalContent) {
      const targetDate = dateCheck.targetDate;
      onDateChange(targetDate);
      setViewMode('day_detail');

      const targetFormatted = formatArabicDateDisplay(targetDate);
      const replyText = `تم فتح كشف وتفاصيل عمل ${targetFormatted} (${targetDate}) بالكامل.\nيمكنك الآن تعديل أي مبلغ أو بيان أو تكلفة أو نوع مباشرة داخل الجدول، ويتم الحفظ الفوري تلقائياً!`;

      const botMsg: ChatMessage = {
        id: `bot_date_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        linkedDate: targetDate,
        isVoiceResponse: isVoiceQuery,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);

      if (shouldSpeak) {
        handlePlayVoice(`تم فتح كشف عمل ${targetFormatted} بالتفصيل.`, botMsg.id);
      }
      return;
    }

    // 0.B Check for quick statistical inquiry for a specific date (only if user is actually asking for stats, not recording transactions!)
    const isStatsQuestion =
      (query.includes('كم') || query.includes('ما هو') || query.includes('ما هي') || query.startsWith('تقرير') || query.startsWith('احصائيات')) &&
      !query.includes(' ف') &&
      !query.includes('فـ') &&
      !query.includes('=') &&
      !/\d+\s*(?:ف|فـ|=|فايدة)/.test(query) &&
      !dateCheck.hasAdditionalContent;

    if (
      dateCheck.isDateQuery &&
      dateCheck.targetDate &&
      isStatsQuestion
    ) {
      const dayItems = (transactions || []).filter((t) => t && t.date === dateCheck.targetDate);
      let daySales = 0;
      let dayMaint = 0;
      let dayExpenses = 0;
      let dayProfit = 0;

      dayItems.forEach((t) => {
        const p = Number(t.price) || 0;
        const pr = Number(t.profit) || 0;
        if (t.type === 'sale') {
          daySales += p;
          dayProfit += pr;
        } else if (t.type === 'maintenance') {
          dayMaint += p;
          dayProfit += pr;
        } else if (
          t.type.startsWith('expense') ||
          t.type.startsWith('withdrawal') ||
          t.type === 'shop_tools_outflow'
        ) {
          dayExpenses += p;
        } else if (t.type.startsWith('balance')) {
          dayProfit += pr;
        }
      });

      const targetFormatted = formatArabicDateDisplay(dateCheck.targetDate);
      const statsText =
        `إليك ملخص حساب ${targetFormatted} (${dateCheck.targetDate}):\n` +
        `• إجمالي المبيعات: ${daySales.toLocaleString()} ر.ي\n` +
        `• دخل الصيانة: ${dayMaint.toLocaleString()} ر.ي\n` +
        `• إجمالي المصاريف والمسحوبات: ${dayExpenses.toLocaleString()} ر.ي\n` +
        `• صافي الأرباح: ${dayProfit.toLocaleString()} ر.ي\n` +
        `• إجمالي العمليات المسجلة: ${dayItems.length} حركة.\n\n` +
        `اضغط على الزر أدناه أو زر "عرض الكشف" في الأعلى لعرض وتعديل بنود هذا اليوم بالكامل.`;

      const botMsg: ChatMessage = {
        id: `bot_stats_${Date.now()}`,
        sender: 'assistant',
        text: statsText,
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        linkedDate: dateCheck.targetDate,
        isVoiceResponse: isVoiceQuery,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);

      if (shouldSpeak) {
        handlePlayVoice(
          `ملخص ${targetFormatted}: المبيعات ${daySales} ريال، الصيانة ${dayMaint} ريال، وصافي الأرباح ${dayProfit} ريال.`,
          botMsg.id
        );
      }
      return;
    }

    // 0.B2 Direct Voice & Text Commands for the 3 Core AI Tools
    const lowerQ = query.toLowerCase();

    // 1. قارئ الفواتير (OCR) Vision AI
    if (
      lowerQ.includes('فاتور') ||
      lowerQ.includes('فواتير') ||
      lowerQ.includes('ocr') ||
      lowerQ.includes('vision') ||
      lowerQ.includes('قارئ الفواتير') ||
      lowerQ.includes('خط اليد') ||
      lowerQ.includes('فاتورة شراء')
    ) {
      if (
        lowerQ.includes('افتح') ||
        lowerQ.includes('شغل') ||
        lowerQ.includes('قارئ') ||
        lowerQ.includes('اعرض') ||
        lowerQ.includes('كاميرا') ||
        lowerQ.includes('اقرأ') ||
        lowerQ.includes('سحب') ||
        lowerQ.includes('رفع')
      ) {
        setViewMode('invoice_ocr');
        const replyText =
          `📸 تم فتح **قارئ الفواتير الذكي (Vision AI OCR)** بنجاح!\n\n` +
          `يمكنك الآن رفع صورة أو ملف PDF لأي فاتورة مشتريات مكتوبة بخط اليد أو مطبوعة، وسأقوم بتحليل البنود والأسعار والكميات والمطابقة وترحيلها مباشرة إلى المخزن وحساب المورد.`;

        const botMsg: ChatMessage = {
          id: `bot_tool_ocr_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          isVoiceResponse: isVoiceQuery,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);

        if (shouldSpeak) {
          handlePlayVoice(
            'تم فتح قارئ الفواتير الذكي بالرؤية الحاسوبية. يمكنك الآن رفع الفاتورة المكتوبة بخط اليد لاستخراج الأصناف والأسعار وترحيلها للمخزن فورياً.',
            botMsg.id
          );
        }
        return;
      }
    }

    // 2. كشوفات السداد (PDF) محرك PDF
    if (
      lowerQ.includes('كشف سداد') ||
      lowerQ.includes('كشوفات السداد') ||
      lowerQ.includes('كشف رصيد') ||
      lowerQ.includes('محرك pdf') ||
      lowerQ.includes('سداد شبكات') ||
      lowerQ.includes('كشف الرصيد') ||
      (lowerQ.includes('سداد') && lowerQ.includes('pdf'))
    ) {
      if (
        lowerQ.includes('افتح') ||
        lowerQ.includes('شغل') ||
        lowerQ.includes('اعرض') ||
        lowerQ.includes('حلل') ||
        lowerQ.includes('محرك') ||
        lowerQ.includes('ارفع')
      ) {
        setViewMode('telecom_engine');
        const replyText =
          `📄 تم فتح **محرك كشوفات السداد (PDF)** بنجاح!\n\n` +
          `يمكنك الآن رفع كشف سداد الرصيد والشبكات (حتى لعام كامل)، وسأقوم بحساب إجمالي المبيعات، التكلفة، وصافي الأرباح ومطابقة الباقات ومقارنتها فورياً!`;

        const botMsg: ChatMessage = {
          id: `bot_tool_pdf_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          isVoiceResponse: isVoiceQuery,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);

        if (shouldSpeak) {
          handlePlayVoice(
            'تم فتح محرك كشوفات السداد بي دي إف. يمكنك الآن رفع الكشف لتدقيق العمليات وحساب المبيعات وصافي الأرباح.',
            botMsg.id
          );
        }
        return;
      }
    }

    // 3. كتالوج تسعير الباقات
    if (
      lowerQ.includes('كتالوج') ||
      lowerQ.includes('تسعير الباقات') ||
      lowerQ.includes('اسعار الباقات') ||
      lowerQ.includes('أسعار الباقات') ||
      lowerQ.includes('فوائد الباقات') ||
      lowerQ.includes('أرباح الباقات') ||
      lowerQ.includes('كتالوج التسعير')
    ) {
      if (
        lowerQ.includes('افتح') ||
        lowerQ.includes('عدل') ||
        lowerQ.includes('اعرض') ||
        lowerQ.includes('كتالوج') ||
        lowerQ.includes('تسعير')
      ) {
        setViewMode('package_catalog');
        const replyText =
          `🏷️ تم فتح **كتالوج تسعير الباقات** بنجاح!\n\n` +
          `يمكنك الآن مراجعة وضبط أسعار التكلفة وأسعار البيع وصافي الفائدة ونسب الأرباح لجميع شبكات الاتصالات (يمن موبايل، سبأفون، يو، يمن فورجي، الهاتف الثابت) لتعتمد في كافة عمليات المحاسب والتدقيق!`;

        const botMsg: ChatMessage = {
          id: `bot_tool_catalog_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          isVoiceResponse: isVoiceQuery,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);

        if (shouldSpeak) {
          handlePlayVoice(
            'تم فتح كتالوج تسعير الباقات. يمكنك الآن مراجعة وضبط أسعار التكلفة والبيع والأرباح لجميع شبكات الاتصالات.',
            botMsg.id
          );
        }
        return;
      }
    }

    // 0.C Check for AI Training / Learning intent (e.g. "احفظ عندك أن...", "علمتك أن...", "قاعدة جديدة:...")
    const cleanQ = query.trim();
    const isTeaching =
      cleanQ.startsWith('احفظ عندك') ||
      cleanQ.startsWith('علمتك') ||
      cleanQ.startsWith('تعلم') ||
      cleanQ.startsWith('دربتك') ||
      cleanQ.startsWith('قاعدة جديدة') ||
      cleanQ.startsWith('قاعده جديده') ||
      cleanQ.startsWith('تدريب:') ||
      cleanQ.includes('احفظ عندك أن') ||
      cleanQ.includes('احفظ عندك ان') ||
      cleanQ.includes('علمتك أن') ||
      cleanQ.includes('علمتك ان') ||
      cleanQ.includes('قاعدة جديدة:') ||
      cleanQ.includes('قاعده جديده:');

    if (isTeaching) {
      const ruleContent = cleanQ
        .replace(
          /^(احفظ عندك أن|احفظ عندك ان|علمتك أن|علمتك ان|احفظ عندك|علمتك|تعلم أن|تعلم ان|تعلم|دربتك على|قاعدة جديدة:|قاعده جديده:|تدريب:)\s*/i,
          ''
        )
        .trim();

      if (ruleContent.length >= 3) {
        let category: AITrainingRule['category'] = 'custom';
        if (
          ruleContent.includes('سعر') ||
          ruleContent.includes('شاشة') ||
          ruleContent.includes('بطارية') ||
          ruleContent.includes('ريال') ||
          ruleContent.includes('بيبي') ||
          ruleContent.includes('كفر')
        ) {
          category = 'prices';
        } else if (
          ruleContent.includes('صيانة') ||
          ruleContent.includes('مهندس') ||
          ruleContent.includes('شحن') ||
          ruleContent.includes('ايسي') ||
          ruleContent.includes('لحام')
        ) {
          category = 'maintenance';
        } else if (
          ruleContent.includes('ربح') ||
          ruleContent.includes('أرباح') ||
          ruleContent.includes('ثلث') ||
          ruleContent.includes('مصعب') ||
          ruleContent.includes('شريك') ||
          ruleContent.includes('صافي')
        ) {
          category = 'accounting';
        } else if (
          ruleContent.includes('عميل') ||
          ruleContent.includes('زبون') ||
          ruleContent.includes('مورد') ||
          ruleContent.includes('دين') ||
          ruleContent.includes('آجل') ||
          ruleContent.includes('سلف')
        ) {
          category = 'customers';
        } else if (
          ruleContent.includes('شرط') ||
          ruleContent.includes('ضمان') ||
          ruleContent.includes('سياسة') ||
          ruleContent.includes('ممنوع') ||
          ruleContent.includes('سحب')
        ) {
          category = 'policies';
        }

        const title = ruleContent.length > 40 ? ruleContent.substring(0, 40) + '...' : ruleContent;
        saveAITrainingRule({
          title,
          content: ruleContent,
          category,
          priority: 'high',
          isActive: true,
          exampleQuery: query,
          expectedBehavior: 'تطبيق هذه القاعدة والالتزام بها في كافة العمليات والردود المحاسبية القادمة.',
        });

        const replyText = `🧠 تم استيعاب وحفظ القاعدة التدريبية بنجاح!\n\n• محتوى القاعدة: "${ruleContent}"\n• التصنيف: ${getCategoryLabel(
          category
        )}\n\n🛡️ تم تخزين هذه المعلومة في ذاكرة المحاسب الذكي الدائمة، وسألتزم بتطبيقها على كافة العمليات الحسابية والردود القادمة مثل أي نموذج ذكاء اصطناعي مدرب.`;

        const botMsg: ChatMessage = {
          id: `bot_train_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          isTrainingNotice: true,
          isVoiceResponse: isVoiceQuery,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);
        if (shouldSpeak) {
          handlePlayVoice('تم حفظ القاعدة وتدريب المحاسب الذكي عليها بنجاح.', botMsg.id);
        }
        return;
      }
    }

    // 0.D Check for Independent Forensic Audit inquiry (Strict Read-Only)
    if (
      cleanQ.includes('فحص جنائي') ||
      cleanQ.includes('تدقيق جنائي') ||
      cleanQ.includes('عزل المتجر') ||
      cleanQ.includes('الأخطاء الحسابية') ||
      cleanQ.includes('أخطاء حسابية') ||
      cleanQ.includes('تضارب الأرصدة') ||
      cleanQ.includes('فحص الفواتير') ||
      cleanQ.includes('شهادة التدقيق')
    ) {
      const audit = ForensicAuditorService.runFullForensicAudit({
        transactions,
        inventory,
        suppliers,
        currentUser,
      });

      const certSummary = `🛡️ [تقرير وحدة التدقيق الجنائي المحاسبي المستقلة - Read-Only Certified]
• قيد الصلاحيات: مقيد برمجياً للقراءة والفحص والمراقبة فقط (يمنع أي تعديل أو مسح تلقائي).
• العزل الأمني للمتجر (${audit.activeStoreId}): ${audit.tenantIsolation.isCompliant ? '✅ سليم 100% (لا خروقات أجنبية)' : `⚠️ تم رصد ${audit.tenantIsolation.breachCount} سجلات أجنبية وتم عزلها برمجياً`}.
• دقة فواتير المبيعات الحسابية: ${audit.mathIntegrity.accuracyRatePercentage}% (تم فحص ${audit.mathIntegrity.salesInvoicesAudited} فاتورة مبيعات).
• تضاربات حساب الأرباح: ${audit.mathIntegrity.profitMismatchesCount} حالات بإجمالي فوارق ${audit.mathIntegrity.totalDiscrepancySum.toLocaleString()} ر.ي.
• قناة تبليغ المالك المباشرة: تم توثيق ${audit.findings.length} تنبيه في القناة السرية الخاصة بحساب المالك (مصعب الصوفي).

💡 يمكنك فتح تبويب "التدقيق الجنائي المستقل" من القائمة الجانبية للاطلاع على التفاصيل الكاملة وطباعة الشهادة المعتمدة.`;

      const botMsg: ChatMessage = {
        id: `bot_audit_${Date.now()}`,
        sender: 'assistant',
        text: certSummary,
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        isVoiceResponse: isVoiceQuery,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);
      if (shouldSpeak) {
        handlePlayVoice('تم إنجاز الفحص الجنائي المحاسبي المستقل بنجاح، والبيانات محفوظة بعزل تام.', botMsg.id);
      }
      return;
    }

    // 0.E Check for Delete or Edit intent on existing financial transactions (Strict Permission Workflow)
    const isDeleteIntent =
      /^(احذف|امسح|حذف|مسح|ازالة|إزالة)\s+/i.test(cleanQ) ||
      cleanQ.includes('احذف') ||
      cleanQ.includes('امسح') ||
      cleanQ.includes('حذف قيد') ||
      cleanQ.includes('احذف حركة');

    const isEditIntent =
      /^(عدل|تعديل|غير|تغيير|بدل|تبديل)\s+/i.test(cleanQ) ||
      ((cleanQ.includes('عدل') || cleanQ.includes('غير')) &&
        (cleanQ.includes('سعر') ||
          cleanQ.includes('مبلغ') ||
          cleanQ.includes('قيد') ||
          cleanQ.includes('حركة') ||
          cleanQ.includes('إلى') ||
          cleanQ.includes('الى') ||
          cleanQ.includes('بـ')));

    if (isDeleteIntent || isEditIntent) {
      // Search candidate transactions: prefer currentDate, otherwise entire transactions list
      const currentDayTxs = (transactions || []).filter((t) => t && t.date === currentDate);
      const searchPool = currentDayTxs.length > 0 ? currentDayTxs : (transactions || []);

      const queryKeywords = cleanQ
        .replace(
          /^(احذف|امسح|حذف|مسح|ازالة|إزالة|عدل|تعديل|غير|تغيير|بدل|تبديل|قيد|حركة|عملية|في|من|يوم)\s+/gi,
          ''
        )
        .trim()
        .toLowerCase();

      const numbersInQuery = cleanQ.match(/\d+/g)?.map(Number) || [];

      let matchingTx = searchPool.find((t) => {
        const desc = (t.description || '').toLowerCase();
        const matchDesc =
          queryKeywords.length > 2 &&
          (desc.includes(queryKeywords) || queryKeywords.includes(desc));
        const matchPrice = numbersInQuery.includes(t.price);
        return matchDesc || (numbersInQuery.length > 0 && matchPrice);
      });

      // Fallback search by transaction type keyword
      if (!matchingTx) {
        if (cleanQ.includes('صيانة')) matchingTx = searchPool.find((t) => t.type === 'maintenance');
        else if (
          cleanQ.includes('مبيعات') ||
          cleanQ.includes('سماعة') ||
          cleanQ.includes('شاحن') ||
          cleanQ.includes('كفر')
        )
          matchingTx = searchPool.find((t) => t.type === 'sale');
        else if (cleanQ.includes('هادي')) matchingTx = searchPool.find((t) => t.type === 'balance_hadi');
        else if (cleanQ.includes('قمة')) matchingTx = searchPool.find((t) => t.type === 'balance_qimma');
        else if (cleanQ.includes('بيت')) matchingTx = searchPool.find((t) => t.type === 'expense_home_mosaab');
        else if (cleanQ.includes('مهندس'))
          matchingTx = searchPool.find(
            (t) => t.type === 'expense_engineer' || t.type === 'withdrawal_engineer'
          );
        else if (cleanQ.includes('عامل'))
          matchingTx = searchPool.find(
            (t) => t.type === 'expense_worker' || t.type === 'withdrawal_worker'
          );
      }

      if (matchingTx) {
        if (isDeleteIntent) {
          const approval: PendingApprovalAction = {
            id: `appr_${Date.now()}`,
            type: 'delete',
            status: 'pending',
            title: 'طلب إذن وتصريح مالي: حذف قيد محاسبي',
            targetTransactionId: matchingTx.id,
            targetDate: matchingTx.date,
            description: matchingTx.description,
            originalPrice: matchingTx.price,
            originalTx: matchingTx,
            diffSummary: `سيتم حذف قيد "${matchingTx.description}" بالكامل من كشف يوم ${matchingTx.date}.`,
            requiresPermissionReason:
              '🛡️ بموجب صلاحيات الأمان والرقابة المالية الصارمة، لا يمكن للمحاسب الذكي حذف أي قيد مالي إلا بإذن صريح ومباشر منك للتأكد من فهم العملية.',
          };

          const replyText = `⚠️ طلبت مني حذف القيد المالي التالي:\n• البيان: "${matchingTx.description}"\n• المبلغ: ${matchingTx.price.toLocaleString()} ر.ي\n• التاريخ: ${matchingTx.date}\n\n🛡️ لن أقوم بحذف أي بيانات مالية حتى تضغط على زر "أوافق على التنفيذ" أدناه للتأكد من أنني فهمت طلبك تماماً.`;

          const botMsg: ChatMessage = {
            id: `bot_appr_${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
            approvalAction: approval,
            linkedDate: matchingTx.date,
            isVoiceResponse: isVoiceQuery,
          };

          setMessages((prev) => [...prev, botMsg]);
          setIsLoading(false);
          if (shouldSpeak) {
            handlePlayVoice(`طلبت حذف قيد ${matchingTx.description}. يرجى تأكيد موافقتك على التنفيذ.`, botMsg.id);
          }
          return;
        }

        if (isEditIntent) {
          // Determine new price
          let newPrice = matchingTx.price;
          const targetNumberMatch = cleanQ.match(/(?:إلى|الى|بـ|ب|خليه|سعر|مبلغ)\s*(\d+)/);
          if (targetNumberMatch && targetNumberMatch[1]) {
            newPrice = Number(targetNumberMatch[1]);
          } else if (numbersInQuery.length > 0) {
            const diffNum = numbersInQuery.find((n) => n !== matchingTx!.price);
            if (diffNum) newPrice = diffNum;
            else newPrice = numbersInQuery[numbersInQuery.length - 1];
          }

          const updatedTx: Transaction = {
            ...matchingTx,
            price: newPrice,
            profit:
              matchingTx.type === 'maintenance'
                ? Math.round(Math.max(0, newPrice - (matchingTx.cost || 0)) * 0.5)
                : matchingTx.type === 'sale'
                ? Math.max(0, newPrice - (matchingTx.cost || 0))
                : matchingTx.profit,
          };

          const approval: PendingApprovalAction = {
            id: `appr_${Date.now()}`,
            type: 'edit',
            status: 'pending',
            title: 'طلب إذن وتصريح مالي: تعديل قيد محاسبي',
            targetTransactionId: matchingTx.id,
            targetDate: matchingTx.date,
            description: matchingTx.description,
            originalPrice: matchingTx.price,
            newPrice,
            originalTx: matchingTx,
            proposedTx: updatedTx,
            diffSummary: `تعديل المبلغ من ${matchingTx.price.toLocaleString()} ر.ي إلى ${newPrice.toLocaleString()} ر.ي (تاريخ ${matchingTx.date}).`,
            requiresPermissionReason:
              '🛡️ بموجب صلاحيات الأمان والرقابة المالية، لا يمكن للمحاسب الذكي تعديل أي مبلغ أو بيانات عملة إلا بعد إذنك الصريح للتأكد من فهم العملية بدقة.',
          };

          const replyText = `⚠️ طلبت مني تعديل القيد المالي التالي:\n• البيان: "${matchingTx.description}"\n• المبلغ الحالي: ${matchingTx.price.toLocaleString()} ر.ي\n• المبلغ الجديد المطلوب: ${newPrice.toLocaleString()} ر.ي\n• التاريخ: ${matchingTx.date}\n\n🛡️ لن يتم تطبيق أي تعديل في السجلات إلا بعد موافقتك الصريحة عبر الزر أدناه.`;

          const botMsg: ChatMessage = {
            id: `bot_appr_${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
            approvalAction: approval,
            linkedDate: matchingTx.date,
            isVoiceResponse: isVoiceQuery,
          };

          setMessages((prev) => [...prev, botMsg]);
          setIsLoading(false);
          if (shouldSpeak) {
            handlePlayVoice(
              `طلبت تعديل قيد ${matchingTx.description} إلى ${newPrice} ريال. يرجى تأكيد موافقتك.`,
              botMsg.id
            );
          }
          return;
        }
      }
    }

    try {
      const apiBase = getApiBaseUrl();
      const activeTrainedRules = getAITrainingRules().filter((r) => r.isActive);

      // Determine effective target date
      const effectiveDate = (dateCheck.isDateQuery && dateCheck.targetDate) ? dateCheck.targetDate : currentDate;

      // 1. First priority: High-Speed Yemeni Local Accounting Parser
      // Parses shorthand: "سماعة 500 ف400", "بيت مصعب 5000", "حولت لمياس 50000", "واصل 3000 الباقي 2000 ف 1000", "مشتريات خليل..."
      const localResult = parseEntryLocally(query, effectiveDate, transactions, inventory, suppliers);
      if (!localResult.needsClarification && localResult.items.length > 0) {
        const resolvedDate = localResult.detectedDate || effectiveDate;
        setParsedPreview(localResult.items);
        setParsedDetectedDate(resolvedDate);
        setParsedDetectedSupplier(localResult.detectedSupplier);
        setParseSummary(localResult.summary);

        const replyText = `تم استخراج ${localResult.items.length} حركة لتاريخ (${resolvedDate}): ${localResult.summary}. يرجى مراجعة وتعديل الفايدة (ف) والأسعار في الجدول أدناه، ثم الضغط على "حفظ واعتماد الحركات في اليومية".`;

        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          parsedItems: localResult.items,
          isVoiceResponse: isVoiceQuery,
          linkedDate: resolvedDate,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);

        if (shouldSpeak) {
          handlePlayVoice(`تم استخراج الحركات. يمكنك كتابة الفايدة في الجدول ثم الضغط على حفظ.`, botMsg.id);
        }
        return;
      }

      // If user only gave a date command without transactions (e.g. "اليوم" or "6 شهر 8")
      if (localResult.detectedDate && localResult.items.length === 0 && dateCheck.isDateQuery) {
        const targetDate = localResult.detectedDate;
        onDateChange(targetDate);
        setViewMode('day_detail');
        const targetFormatted = formatArabicDateDisplay(targetDate);
        const replyText = `تم ضبط تاريخ العمل على ${targetFormatted} (${targetDate}). يمكنك الآن كتابة المبيعات والحوالات والمشتريات مباشرة، مثل: سماعة 500 ف400 أو بيت مصعب 3000.`;

        const botMsg: ChatMessage = {
          id: `bot_date_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          linkedDate: targetDate,
          isVoiceResponse: isVoiceQuery,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);

        if (shouldSpeak) {
          handlePlayVoice(`تم فتح كشف ${targetFormatted}. تفضل بإدخال الحركات.`, botMsg.id);
        }
        return;
      }

      // 2. Second attempt: Deep AI Parse via Server/Cloud
      let parseSuccess = false;
      try {
        const parseRes = await fetch(`${apiBase}/api/gemini/parse-entry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: query,
            currentDate: effectiveDate,
            trainedRules: activeTrainedRules,
          }),
        });

        if (parseRes.ok) {
          const parseData = await parseRes.json();
          parseSuccess = true;

          // Check if clarification is needed (user didn't provide enough info or AI didn't understand)
          if (parseData.needsClarification) {
            const clarificationText =
              parseData.clarificationPrompt ||
              parseData.summary ||
              'لم أفهم العملية الحسابية بدقة أو تنقصها تفاصيل مالية (مثل سعر البيع أو نوع الصنف). يرجى توضيح المبلغ والبيان حتى لا يتم تسجيل أي خطأ.';

            const botClarificationMsg: ChatMessage = {
              id: `bot_${Date.now()}`,
              sender: 'assistant',
              text: `⚠️ ${clarificationText}`,
              timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
              isClarification: true,
              isVoiceResponse: isVoiceQuery,
            };

            setMessages((prev) => [...prev, botClarificationMsg]);
            setIsLoading(false);

            if (shouldSpeak) {
              handlePlayVoice(clarificationText, botClarificationMsg.id);
            }
            return;
          }

          // If valid items were extracted
          if (parseData.items && parseData.items.length > 0) {
            const resolvedDate = parseData.detectedDate || effectiveDate;
            setParsedPreview(parseData.items);
            setParsedDetectedDate(resolvedDate);
            setParsedDetectedSupplier(parseData.detectedSupplier);
            setParseSummary(parseData.summary || 'تم استخراج الحركات بنجاح');

            const replyText = `تم استخراج ${parseData.items.length} حركة محاسبية لتاريخ (${resolvedDate}): ${parseData.summary || ''}. يرجى مراجعة وتعديل الفايدة (ف) والأسعار في الجدول أدناه، ثم الضغط على "حفظ واعتماد الحركات في اليومية".`;

            const botMsg: ChatMessage = {
              id: `bot_${Date.now()}`,
              sender: 'assistant',
              text: replyText,
              timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
              parsedItems: parseData.items,
              isVoiceResponse: isVoiceQuery,
              linkedDate: resolvedDate,
            };

            setMessages((prev) => [...prev, botMsg]);
            setIsLoading(false);

            if (shouldSpeak) {
              handlePlayVoice(replyText, botMsg.id);
            }
            return;
          }
        }
      } catch (networkErr) {
        console.warn('Network parse request failed (offline / APK mode):', networkErr);
      }

      // 2. High-Precision AI assistant call (Multi-turn History, Dynamic Context Injection, Chain of Thought, Dual-mode Execution)
      try {
        const last8History = messages
          .filter((m) => m && m.text && !m.isTrainingNotice)
          .slice(-8)
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          }));

        const chatRes = await fetch(`${apiBase}/api/gemini/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            history: last8History,
            shopContext: cfoContext,
            financialSummary: dynamicFinancialContext.fullPromptSection,
            currentDate: effectiveDate,
            trainedRules: activeTrainedRules,
            storeId: cfoContext.storeId,
            ownerId: cfoContext.ownerId,
          }),
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          const replyText = chatData.reply || 'تم استلام استفسارك.';
          const action = chatData.action;
          const thoughtProcess = chatData.thoughtProcess;

          // Check if structured items were generated for execution
          if (action && action.items && action.items.length > 0) {
            const resolvedDate = action.detectedDate || effectiveDate;
            setParsedPreview(action.items);
            setParsedDetectedDate(resolvedDate);
            setParsedDetectedSupplier(action.detectedSupplier);
            setParseSummary(action.summary || 'تم استخراج وتجهيز الحركات بنجاح');

            const botMsg: ChatMessage = {
              id: `bot_${Date.now()}`,
              sender: 'assistant',
              text: replyText,
              timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
              parsedItems: action.items,
              isVoiceResponse: isVoiceQuery,
              linkedDate: resolvedDate,
              thoughtProcess,
            };

            setMessages((prev) => [...prev, botMsg]);
            setIsLoading(false);

            if (shouldSpeak) {
              handlePlayVoice(replyText, botMsg.id);
            }
            return;
          }

          // Check if an edit or deletion approval was proposed
          if (action && (action.type === 'propose_edit' || action.type === 'propose_delete')) {
            const matchingTx =
              (transactions || []).find((t) => t.id === action.targetTransactionId) || {
                id: action.targetTransactionId || `tx_${Date.now()}`,
                date: action.detectedDate || effectiveDate,
                type: 'sale' as const,
                category: 'accessories' as const,
                description: action.summary || 'قيد محاسبي',
                price: action.newPrice || 0,
                cost: 0,
                profit: 0,
              };

            const isDelete = action.type === 'propose_delete';
            const newPrice = action.newPrice ?? matchingTx.price;

            const approval: PendingApprovalAction = {
              id: `appr_${Date.now()}`,
              type: isDelete ? 'delete' : 'edit',
              status: 'pending',
              title: isDelete ? 'طلب إذن وتصريح مالي: حذف قيد محاسبي' : 'طلب إذن وتصريح مالي: تعديل قيد محاسبي',
              targetTransactionId: matchingTx.id,
              targetDate: matchingTx.date,
              description: matchingTx.description,
              originalPrice: matchingTx.price,
              newPrice: isDelete ? undefined : newPrice,
              originalTx: matchingTx,
              proposedTx: isDelete ? undefined : { ...matchingTx, price: newPrice },
              diffSummary: isDelete
                ? `حذف نهائي للقيد "${matchingTx.description}" بمبلغ ${matchingTx.price.toLocaleString()} ر.ي.`
                : `تعديل المبلغ من ${matchingTx.price.toLocaleString()} ر.ي إلى ${newPrice.toLocaleString()} ر.ي.`,
              requiresPermissionReason:
                '🛡️ بموجب معايير الرقابة والمحاسبة المالية، لا يتم المساس بالقيود أو تعديلها إلا بعد موافقتك الصريحة.',
            };

            const botMsg: ChatMessage = {
              id: `bot_${Date.now()}`,
              sender: 'assistant',
              text: replyText,
              timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
              approvalAction: approval,
              isVoiceResponse: isVoiceQuery,
              linkedDate: action.detectedDate || effectiveDate,
              thoughtProcess,
            };

            setMessages((prev) => [...prev, botMsg]);
            setIsLoading(false);

            if (shouldSpeak) {
              handlePlayVoice(replyText, botMsg.id);
            }
            return;
          }

          // Conversational / Analytical response
          const botMsg: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
            isVoiceResponse: isVoiceQuery,
            thoughtProcess,
          };

          setMessages((prev) => [...prev, botMsg]);
          setIsLoading(false);

          if (shouldSpeak) {
            handlePlayVoice(replyText, botMsg.id);
          }
          return;
        }
      } catch (chatNetErr) {
        console.warn('Assistant inquiry network error:', chatNetErr);
      }

      // 2.B: Local Autonomous CFO fallback for financial inquiries if offline
      if (
        query.includes('سيولة') ||
        query.includes('نسبة') ||
        query.includes('دين') ||
        query.includes('ديون') ||
        query.includes('مورد') ||
        query.includes('مخزون') ||
        query.includes('صندوق') ||
        query.includes('كاش') ||
        query.includes('خزينة') ||
        query.includes('أمان') ||
        query.includes('أرباح') ||
        query.includes('تحليل') ||
        query.includes('دوران')
      ) {
        const ratios = cfoContext.financialRatios;
        const offlineReply =
          `📊 **بيان المدقق المالي الاستباقي (Autonomous CFO):**\n\n` +
          `• نسبة السيولة السريعة (Quick Ratio): **${ratios.quickRatio}x** (${
            ratios.quickRatioStatus === 'healthy'
              ? 'ممتازة 🟢'
              : ratios.quickRatioStatus === 'caution'
              ? 'حذرة 🟡'
              : 'حرجة 🔴'
          })\n` +
          `• إجمالي الكاش السائل المتاح: **${cfoContext.totalLiquidCash.toLocaleString()} ر.ي** (درج: ${cfoContext.cashDrawer.actualCashInDrawer.toLocaleString()} + شبكات: ${cfoContext.networkBalances.totalNetworkCash.toLocaleString()}).\n` +
          `• الذمم المدينة (ديون الزبائن المعلقة): **${cfoContext.receivables.totalOutstanding.toLocaleString()} ر.ي** عبر ${cfoContext.receivables.debtorsCount} عميل.\n` +
          `• التزامات الموردين الفورية: **${cfoContext.payables.totalOutstanding.toLocaleString()} ر.ي**.\n` +
          `• معدل دوران الذمم: **${ratios.receivablesTurnover} دورة/شهر** (متوسط التحصيل ${ratios.averageCollectionDays} يوم).\n` +
          `• هامش الأمان المالي: **${ratios.marginOfSafetyPercentage}%**.\n` +
          (cfoContext.inventoryAudit.deadStockItems.length > 0
            ? `• مخزون راكد معطل للسيولة: **${cfoContext.inventoryAudit.totalDeadStockCapital.toLocaleString()} ر.ي** (${cfoContext.inventoryAudit.deadStockItems[0].name}).\n`
            : '') +
          `\n💡 **التوجيه الاستباقي:** تكثيف تحصيل الديون المتأخرة لتغذية السيولة السريعة قبل مواعيد سداد الموردين.`;

        const botMsg: ChatMessage = {
          id: `bot_cfo_${Date.now()}`,
          sender: 'assistant',
          text: offlineReply,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          isVoiceResponse: isVoiceQuery,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);

        if (shouldSpeak) {
          handlePlayVoice(
            `نسبة السيولة السريعة ${ratios.quickRatio}، والكاش السائل المتاح ${cfoContext.totalLiquidCash} ريال، وديون الزبائن ${cfoContext.receivables.totalOutstanding} ريال.`,
            botMsg.id
          );
        }
        return;
      }

      // If local parser returned a clarification prompt (e.g. greetings or question)
      if (localResult.clarificationPrompt) {
        const botClarificationMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: localResult.clarificationPrompt,
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          isClarification: true,
          isVoiceResponse: isVoiceQuery,
        };

        setMessages((prev) => [...prev, botClarificationMsg]);

        if (shouldSpeak) {
          handlePlayVoice(localResult.clarificationPrompt, botClarificationMsg.id);
        }
        return;
      }

      throw new Error('تعذر إكمال المعالجة');
    } catch (err: any) {
      console.error('AI assistant error:', err);
      const errorText = 'عذراً، حدث خطأ أثناء معالجة الطلب. يرجى التأكد من كتابة الأرقام والبيانات بوضوح.';
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'assistant',
        text: errorText,
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        isVoiceResponse: isVoiceQuery,
      };
      setMessages((prev) => [...prev, errorMsg]);

      if (shouldSpeak) {
        handlePlayVoice(errorText, errorMsg.id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, isLoading, cfoContext, dynamicFinancialContext, messages, autoSpeak, handlePlayVoice]);

  // Toggle voice recognition
  const toggleRecording = async () => {
    // 1. Immediately unlock Autoplay & SpeechSynthesis during direct user interaction
    unlockAudioAndSpeechSynthesis();

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsRecording(false);
      isRecordingRef.current = false;
      return;
    }

    // Stop speaking if assistant is speaking
    stopSpeaking();
    setSpeakingMsgId(null);
    setSpeechError(null);

    // Check support
    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        'التعرف الصوتي المباشر غير مدعوم في هذا المتصفح. في نظام الأندرويد يمكنك استخدام مايك لوحة المفاتيح (Gboard) للتحدث مباشرة وسيقوم المحاسب الذكي بتحليلها فوراً.'
      );
      return;
    }

    // Tactile vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }

    try {
      let finalSpeechText = '';

      // Try ar-YE first, with graceful fallback
      const recognizer = createSpeechRecognizer(
        (transcript: string, isFinal: boolean) => {
          setLiveTranscript(transcript);
          setInputText(transcript);
          setSpeechError(null);
          if (isFinal) {
            finalSpeechText = transcript;
          }
        },
        (err: any) => {
          const errCode = err?.error || '';
          console.warn('Speech recognition error in Android/Web:', errCode, err);

          if (errCode === 'not-allowed') {
            setSpeechError(
              '⚠️ تم حظر إذن الميكروفون. يرجى الدخول إلى: إعدادات الهاتف > التطبيقات > الرقم الأول > الأذونات > الميكروفون > السماح دائماً.'
            );
          } else if (errCode === 'network') {
            setSpeechError(
              '⚠️ محرك التعرف الصوتي بحاجة لاتصال بالإنترنت (Google Speech Services). يمكنك استخدام مايك لوحة مفاتيح هاتفك (Gboard) للتحدث بدون مشاكل.'
            );
          } else if (errCode === 'no-speech') {
            // No speech heard, quiet retry
          } else if (errCode === 'audio-capture') {
            setSpeechError('⚠️ لا يمكن التقاط الصوت من الميكروفون، يرجى التأكد من عدم استخدام تطبيق آخر للمايك.');
          }

          setIsRecording(false);
          isRecordingRef.current = false;
        },
        () => {
          setIsRecording(false);
          isRecordingRef.current = false;

          // If autoSendVoice is enabled and we captured speech, auto-send immediately
          const captured = finalSpeechText || inputText;
          if (autoSendVoice && captured.trim()) {
            setTimeout(() => {
              executeSend(captured, true);
            }, 300);
          }
        },
        'ar-YE'
      );

      if (recognizer) {
        recognitionRef.current = recognizer;
        recognizer.start();
        setIsRecording(true);
        isRecordingRef.current = true;
        setLiveTranscript('');
      } else {
        setSpeechError('تعذر تشغيل لاقط الصوت. يرجى استخدام مايك لوحة المفاتيح.');
      }
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('حدث خطأ في محرك الصوت. يمكنك استخدام مايك لوحة مفاتيح الجوال (Gboard) للتحدث وسيعمل المحاسب فوراً.');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // Add parsed items to the main daily transactions
  const handleApplyParsedItems = (
    itemsToApply: any[] = parsedPreview || [],
    targetDate: string = parsedDetectedDate || currentDate
  ) => {
    if (!itemsToApply || itemsToApply.length === 0) return;

    const newTransactions: Transaction[] = itemsToApply.map((item, index) => {
      let cat: Category = 'expenses';
      if (item.type === 'sale') cat = (item.description || '').includes('جوال') ? 'phones' : 'accessories';
      else if (item.type === 'maintenance') cat = 'maintenance';
      else if (item.type.startsWith('balance_')) cat = 'balance';
      else if (item.type === 'sim') cat = 'sims';
      else if (item.type === 'purchase') cat = 'purchases';
      else if (item.type.includes('mosaab')) cat = 'mosaab';
      else if (item.type.includes('engineer')) cat = 'engineer';
      else if (item.type.includes('worker')) cat = 'worker';

      return {
        id: `ai_tx_${Date.now()}_${index}`,
        date: targetDate,
        time: item.time || new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        type: item.type as TransactionType,
        category: cat,
        description: item.description || 'حركة مسجلة عبر المحاسب الذكي',
        price: Number(item.price) || 0,
        cost: Number(item.cost) || 0,
        profit: Number(item.profit) || 0,
        remainingAmount: item.remainingAmount ? Number(item.remainingAmount) : undefined,
        supplierName: item.supplierName || undefined,
        customerName: item.customerName || undefined,
        notes: item.notes || 'مدخل عبر المحاسب الذكي بعد تحديد الفايدة',
        paymentMethod: 'cash',
      };
    });

    onAddParsedTransactions(newTransactions);
    if (targetDate !== currentDate) {
      onDateChange(targetDate);
    }
    setParsedPreview(null);
    setParsedDetectedDate(undefined);
    setParsedDetectedSupplier(undefined);
    setParseSummary('');

    const confirmText = `✅ تم بنجاح اعتماد وإضافة ${newTransactions.length} حركة إلى كشف يومية (${targetDate}) وتحديث حسابات الفائدة والأرباح تلقائياً!`;
    const confirmMsg: ChatMessage = {
      id: `bot_applied_${Date.now()}`,
      sender: 'assistant',
      text: confirmText,
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      linkedDate: targetDate,
    };

    setMessages((prev) => [...prev, confirmMsg]);

    if (autoSpeak) {
      handlePlayVoice(`تم إضافة ${newTransactions.length} حركة بنجاح إلى جدول اليومية.`);
    }
  };

  // معالجة وحفظ اليومية المنظمة من لوحة الإدخال اليومي (الأقسام الـ 5)
  const handleSaveStructuredDayTransactions = (targetDate: string, items: any[], isOverwrite: boolean) => {
    if (!items || items.length === 0) return;

    const fullTransactions: Transaction[] = items.map((item, idx) => {
      let cat: Category = item.category || 'accessories';
      let txType: TransactionType = item.type || 'sale';

      return {
        id: `tx_str_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        date: targetDate,
        time: item.time || new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        type: txType,
        category: cat,
        description: item.description || 'حركة مسجلة عبر الإدخال اليومي المنظم',
        price: Number(item.price) || 0,
        cost: Number(item.cost) || 0,
        profit: Number(item.profit) || 0,
        notes: item.notes || 'مسجلة ومحققة محاسبياً عبر الإدخال اليومي',
        remainingAmount: item.remainingAmount ? Number(item.remainingAmount) : undefined,
        supplierName: item.supplierName || undefined,
        customerName: item.customerName || undefined,
        paymentMethod: 'cash',
      };
    });

    if (onOverwriteDayTransactions) {
      onOverwriteDayTransactions(targetDate, fullTransactions);
    } else {
      if (isOverwrite) {
        // حذف القيود السابقة لهذا التاريخ
        const toDelete = transactions.filter((t) => t.date === targetDate);
        toDelete.forEach((t) => onDeleteTransaction(t.id));
      }
      onAddParsedTransactions(fullTransactions);
    }

    if (targetDate !== currentDate) {
      onDateChange(targetDate);
    }

    // إضافة إشعار وتوثيق في المحادثة
    const totalRev = fullTransactions.reduce((sum, t) => sum + (t.category !== 'expenses' ? t.price : 0), 0);
    const totalPrf = fullTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalExp = fullTransactions.reduce((sum, t) => sum + (t.category === 'expenses' ? t.price : 0), 0);

    const botMsg: ChatMessage = {
      id: `bot_day_saved_${Date.now()}`,
      sender: 'assistant',
      text: `✅ **تم بنجاح ${isOverwrite ? 'استبدال وتحديث' : 'اعتماد وتثبيت'} يومية (${targetDate})**\n\n• إجمالي الحركات المعتمدة: **${fullTransactions.length} حركة**\n• إجمالي المبيعات والإيرادات (ب): **${totalRev.toLocaleString()} ر.ي**\n• صافي الأرباح (ف): **${totalPrf.toLocaleString()} ر.ي**\n• المصروفات والخرج (خ): **${totalExp.toLocaleString()} ر.ي**\n\nتم قيد العمليات في سجل اليومية والمخزون وحفظها سحابياً ومحلياً لمنع التكرار.`,
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      linkedDate: targetDate,
    };

    setMessages((prev) => [...prev, botMsg]);

    if (autoSpeak) {
      handlePlayVoice(`تم اعتماد وحفظ يومية ${targetDate} بنجاح.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-3 lg:p-4">
      <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl max-w-6xl w-full h-full sm:h-[92vh] flex flex-col overflow-hidden border-0 sm:border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header with Title & Audio Controls */}
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white px-3.5 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-indigo-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Bot className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-base flex items-center gap-2 truncate">
                <span>المحاسب الذكي (Autonomous CFO & مدقق مالي)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-normal hidden sm:inline">
                  رادار استباقي • تحليل نسب
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-indigo-200 truncate">
                تدقيق استباقي ومراقبة السيولة السريعة • ديون الزبائن • حماية رأس المال
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Hints & Shorthands Button */}
            <button
              type="button"
              onClick={() => setShowHintsSection(!showHintsSection)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-xs ${
                showHintsSection
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
              }`}
              title="دليل التلميحات وأكواد الاختصارات السريعة (ج، ك، ص، ش، ر، م)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">قسم التلميحات</span>
            </button>

            {/* Clear Chat Button */}
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer"
              title="مسح سجل المحادثة وبدء جلسة جديدة"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Hands-Free Voice Continuous Call Mode Button */}
            <button
              type="button"
              onClick={() => {
                unlockAudioAndSpeechSynthesis();
                setIsHandsFreeCallOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20 transition-all cursor-pointer animate-pulse"
              title="بدء وضع المكالمة المستمرة (Hands-Free) للإدخال بالصوت دون لمس الهاتف"
            >
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
              <span>المكالمة المستمرة</span>
            </button>

            {/* Training Studio Button */}
            <button
              type="button"
              onClick={() => setIsTrainingModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 transition-all cursor-pointer shadow-xs"
              title="فتح قسم تدريب وتعليم الذكاء الاصطناعي"
            >
              <Brain className="w-4 h-4 text-indigo-300 animate-pulse" />
              <span className="hidden sm:inline">قسم التدريب</span>
            </button>

            {/* Auto-Speak Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const next = !autoSpeak;
                setAutoSpeak(next);
                if (!next) {
                  stopSpeaking();
                  setSpeakingMsgId(null);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                autoSpeak
                  ? 'bg-emerald-600/90 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={autoSpeak ? 'الرد الصوتي التلقائي مفعّل (انقر للتعطيل)' : 'الرد الصوتي صامت (انقر للتفعيل)'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">{autoSpeak ? 'صوت المساعد: مفعل' : 'صامت'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Developed Quick Action & Date Controls Ribbon (Hidden in full day_detail mode to maximize work details space on mobile) */}
        {viewMode !== 'day_detail' && (
          <SmartAIQuickActionsBar
            currentDate={currentDate}
            onDateChange={(d) => {
              onDateChange(d);
            }}
            availableDates={availableDates}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            onOpenTraining={() => setIsTrainingModalOpen(true)}
            onSaveQuickTransaction={(tx) => {
              onSaveTransaction(tx);
              const confirmText = `✅ تم قيد ${tx.description} بمبلغ ${Number(tx.price).toLocaleString()} ر.ي بنجاح في يوم ${tx.date}!`;
              const botMsg: ChatMessage = {
                id: `bot_quick_${Date.now()}`,
                sender: 'assistant',
                text: confirmText,
                timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
                linkedDate: tx.date,
              };
              setMessages((prev) => [...prev, botMsg]);
              if (autoSpeak) {
                handlePlayVoice(`تم قيد ${tx.description} بمبلغ ${tx.price} ريال يمني بنجاح.`);
              }
            }}
          />
        )}

        {/* Autonomous CFO Proactive Radar Alert Strip (Compact, Dismissible, Non-intrusive in Chat) */}
        {viewMode === 'chat' && !isRadarDismissed && (
          <CFORadarBanner
            radarAlert={radarAlert}
            cfoContext={cfoContext}
            isScanning={isRadarScanning}
            onRescan={() => triggerRadarScan(false)}
            onPlayVoice={(text) => handlePlayVoice(text)}
            isStandaloneView={false}
            onDismissAlert={() => setIsRadarDismissed(true)}
            onOpenDedicatedTab={() => setViewMode('cfo_radar')}
            onNavigateToTab={(tab) => {
              onNavigateToTab?.(tab);
              onClose();
            }}
          />
        )}

        {/* Main Content Area: Structured Daily Input Dashboard OR System Audit OR CFO Dedicated Radar OR Detailed Day Editor OR Embedded Tools OR Smart Chat View */}
        {viewMode === 'daily_input' ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col h-full">
            <DailyStructuredInputDashboard
              currentDate={currentDate}
              onDateChange={onDateChange}
              availableDates={availableDates}
              transactions={transactions}
              onSaveDayTransactions={handleSaveStructuredDayTransactions}
              onDeleteDayTransactions={(dateToDelete) => {
                if (onOverwriteDayTransactions) {
                  onOverwriteDayTransactions(dateToDelete, []);
                } else {
                  const toDelete = transactions.filter((t) => t.date === dateToDelete);
                  toDelete.forEach((t) => onDeleteTransaction(t.id));
                }
              }}
              onDeleteSingleTransaction={(txId) => {
                onDeleteTransaction(txId);
              }}
              onEditSingleTransaction={(tx) => {
                onSaveTransaction(tx);
              }}
              inventory={inventory}
              suppliers={suppliers}
              onViewDayDetail={(date) => {
                if (date !== currentDate) onDateChange(date);
                setViewMode('day_detail');
              }}
              onShowNotification={(msg) => {
                if (!msg || msg.includes('تم جلب') || msg.includes('جلب كل معلومات')) return;
                if (autoSpeak) {
                  handlePlayVoice(msg);
                }
              }}
            />
          </div>
        ) : viewMode === 'system_audit' ? (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-900 flex flex-col p-2 sm:p-4">
            <SmartSystemAuditView
              currentDate={currentDate}
              transactions={transactions}
              suppliers={suppliers}
              inventory={inventory}
              dailySummary={dailySummary}
              monthlySettlement={monthlySettlement}
              onNavigateToTab={(tab) => {
                onNavigateToTab?.(tab as any);
                onClose();
              }}
              onOpenAssistantChat={(initialPrompt) => {
                setViewMode('chat');
                if (initialPrompt) {
                  setInputText(initialPrompt);
                  executeSend(initialPrompt);
                }
              }}
              onClose={() => setViewMode('chat')}
              isStandalone={true}
            />
          </div>
        ) : viewMode === 'cfo_radar' ? (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-900 flex flex-col">
            <CFORadarBanner
              radarAlert={radarAlert}
              cfoContext={cfoContext}
              isScanning={isRadarScanning}
              onRescan={() => triggerRadarScan(false)}
              onPlayVoice={(text) => handlePlayVoice(text)}
              isStandaloneView={true}
              onNavigateToTab={(tab) => {
                onNavigateToTab?.(tab);
                onClose();
              }}
            />
          </div>
        ) : viewMode === 'day_detail' ? (
          <div className="flex-1 min-h-0 overflow-hidden p-0 sm:p-2 bg-slate-100 flex flex-col h-full">
            <SmartAIDayEditor
              currentDate={currentDate}
              onDateChange={onDateChange}
              availableDates={availableDates}
              transactions={transactions}
              onSaveTransaction={onSaveTransaction}
              onDeleteTransaction={onDeleteTransaction}
              onCloseDetailedView={() => setViewMode('chat')}
            />
          </div>
        ) : viewMode === 'invoice_ocr' ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 bg-slate-100 flex flex-col">
            <div className="mb-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-3 rounded-2xl flex items-center justify-between border border-emerald-800/50 shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                    <span>قارئ الفواتير بالذكاء الاصطناعي (Vision AI OCR)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-normal">
                      مرتبط بالمحاسب الذكي
                    </span>
                  </h4>
                  <p className="text-[10px] sm:text-xs text-emerald-200/80">
                    استخراج فواتير المشتريات المكتوبة باليد والمطبوعة، وفحص الأصناف وترحيلها تلقائياً للمخزن وحساب المورد
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/20 shrink-0"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-300" />
                <span>العودة للمحادثة والرادار</span>
              </button>
            </div>
            <div className="flex-1">
              <SmartInvoiceOCR />
            </div>
          </div>
        ) : viewMode === 'telecom_engine' ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 bg-slate-100 flex flex-col">
            <div className="mb-3 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 text-white p-3 rounded-2xl flex items-center justify-between border border-indigo-800/50 shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                    <span>كشوفات السداد (محرك PDF الذكي)</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-normal">
                      مرتبط بالمحاسب الذكي
                    </span>
                  </h4>
                  <p className="text-[10px] sm:text-xs text-indigo-200/80">
                    تدقيق كشوفات سداد الرصيد والشبكات، حساب التكلفة والبيع وصافي الأرباح ومطابقة الباقات لعام كامل
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/20 shrink-0"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-300" />
                <span>العودة للمحادثة والرادار</span>
              </button>
            </div>
            <div className="flex-1">
              <TelecomStatementEngine />
            </div>
          </div>
        ) : viewMode === 'package_catalog' ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 bg-slate-100 flex flex-col">
            <div className="mb-3 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white p-3 rounded-2xl flex items-center justify-between border border-amber-800/50 shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                    <span>كتالوج تسعير الباقات وهوامش الأرباح</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-normal">
                      مرتبط بالمحاسب الذكي
                    </span>
                  </h4>
                  <p className="text-[10px] sm:text-xs text-amber-200/80">
                    ضبط وتعديل تكاليف وأسعار بيع وأرباح باقات يمن موبايل، سبأفون، يو، يمن فورجي، والهاتف الثابت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/20 shrink-0"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-300" />
                <span>العودة للمحادثة والرادار</span>
              </button>
            </div>
            <div className="flex-1">
              <PackagePricingCatalog />
            </div>
          </div>
        ) : (
          <>
            {/* Chat Messages Body with Drag and Drop & Smooth Scroll Support */}
            <div
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/70 relative scroll-smooth"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag and Drop Active Overlay */}
              {isDraggingOver && (
                <div className="sticky top-0 z-30 bg-indigo-950/90 border-2 border-dashed border-indigo-400 rounded-3xl p-6 text-center text-white shadow-2xl backdrop-blur-sm animate-in fade-in flex flex-col items-center justify-center min-h-[220px]">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-600/40 border border-indigo-300/60 flex items-center justify-center mb-3 animate-bounce">
                    <Upload className="w-8 h-8 text-indigo-200" />
                  </div>
                  <h4 className="text-base font-bold text-white">أفلت المستند هنا للمحاسب الذكي!</h4>
                  <p className="text-xs text-indigo-200 mt-1 max-w-sm leading-relaxed">
                    يدعم كشوفات سداد الرصيد (PDF) لحساب مبيعات الرصيد والأرباح ومطابقة الباقات، وفواتير الشراء المكتوبة بخط اليد (صور / PDF) لاستخراج البنود والترحيل للمخزن.
                  </p>
                </div>
              )}

              {/* Dedicated Hints & Shorthand Codes Section (User Requested) */}
              {showHintsSection && (
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 border-2 border-amber-400/60 shadow-xl space-y-3.5 animate-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <h4 className="text-xs sm:text-sm font-black text-amber-300">
                        قسم التلميحات المحاسبية وأكواد الاختصارات السريعة
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHintsSection(false)}
                      className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      إغلاق ✕
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    اكتب للمحاسب الذكي بالأكواد المختصرة وسيتعرف على نوع السلعة تلقائياً ويولد لها باركود ويحفظها في المخزن أو يقيدها باليومية فورياً:
                  </p>

                  {/* Badges of Shorthand Codes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
                    <div className="bg-slate-800/90 border border-indigo-500/40 p-2 rounded-xl">
                      <span className="block text-lg font-black text-amber-300 font-mono">ج</span>
                      <span className="text-[11px] font-bold text-slate-200">جوالات وأجهزة</span>
                    </div>
                    <div className="bg-slate-800/90 border border-indigo-500/40 p-2 rounded-xl">
                      <span className="block text-lg font-black text-amber-300 font-mono">ك</span>
                      <span className="text-[11px] font-bold text-slate-200">إكسسوارات</span>
                    </div>
                    <div className="bg-slate-800/90 border border-indigo-500/40 p-2 rounded-xl">
                      <span className="block text-lg font-black text-amber-300 font-mono">ص</span>
                      <span className="text-[11px] font-bold text-slate-200">صيانة وقطع</span>
                    </div>
                    <div className="bg-slate-800/90 border border-indigo-500/40 p-2 rounded-xl">
                      <span className="block text-lg font-black text-amber-300 font-mono">ش</span>
                      <span className="text-[11px] font-bold text-slate-200">شرايح وباقات</span>
                    </div>
                    <div className="bg-slate-800/90 border border-indigo-500/40 p-2 rounded-xl">
                      <span className="block text-lg font-black text-amber-300 font-mono">ر</span>
                      <span className="text-[11px] font-bold text-slate-200">رصيد وسداد</span>
                    </div>
                    <div className="bg-slate-800/90 border border-emerald-500/40 p-2 rounded-xl">
                      <span className="block text-lg font-black text-emerald-300 font-mono">م</span>
                      <span className="text-[11px] font-bold text-slate-200">بضاعة سابقة للمخزن</span>
                    </div>
                  </div>

                  {/* Interactive Clickable Samples */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      ⚡ اضغط على أي نموذج أدناه لتجربته وتعبئته فورياً في شريط الإدخال:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'مشتريات ك شاحن أنكر 20 واط 1800 10',
                        'م كفر ايفون شفاف 500 20',
                        'مشتريات ج ريدمي نوت 13 رام 8 بـ 55000 2',
                        'ص شاشة سامسونج A12 بـ 7500 تكلفة 5000',
                        'ر تحويل رصيد يمن موبايل 2000',
                        'ش شريحة يو 4G جديدة 1200',
                        'صرفة بيت مصعب 5000',
                        'سحب مصعب 10000',
                        'سحب مهندس 4000',
                      ].map((hint, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setInputText(hint);
                            unlockAudioAndSpeechSynthesis();
                          }}
                          className="bg-indigo-900/60 hover:bg-amber-400 hover:text-slate-950 text-indigo-200 border border-indigo-700/60 text-[11px] font-mono px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 border-t border-indigo-900/60 pt-2 flex items-center justify-between">
                    <span>🔄 يتم توليد باركود تلقائي لكل صنف جديد وإضافته فورياً لمخزن المحل.</span>
                    <span>💾 المحادثة والعمليات محفوظة محلياً وتعمل في الخلفية بأمان.</span>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                        : msg.isClarification
                        ? 'bg-amber-50 text-amber-950 border border-amber-300 rounded-bl-none shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* AI Training Notice Badge */}
                    {msg.isTrainingNotice && (
                      <div className="mt-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-amber-800 font-semibold text-[11px]">
                          <Brain className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>تم تحديث ذاكرة الذكاء الاصطناعي بنجاح</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsTrainingModalOpen(true)}
                          className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          عرض القواعد المدربة
                        </button>
                      </div>
                    )}

                    {/* Interactive Financial Approval Action Card */}
                    {msg.approvalAction && (
                      <div
                        className={`mt-3 rounded-xl border p-3 transition-all ${
                          msg.approvalAction.status === 'pending'
                            ? 'bg-amber-50/90 border-amber-300 shadow-sm ring-1 ring-amber-300/60'
                            : msg.approvalAction.status === 'approved'
                            ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                            : 'bg-slate-100 border-slate-300 text-slate-600'
                        }`}
                      >
                        {/* Approval Header */}
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-amber-200/60">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                            {msg.approvalAction.status === 'pending' ? (
                              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                            ) : msg.approvalAction.status === 'approved' ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <ShieldX className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                            <span>{msg.approvalAction.title}</span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              msg.approvalAction.status === 'pending'
                                ? 'bg-amber-200 text-amber-900 animate-pulse'
                                : msg.approvalAction.status === 'approved'
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {msg.approvalAction.status === 'pending'
                              ? 'بانتظار إذنك وموافقتك'
                              : msg.approvalAction.status === 'approved'
                              ? 'تمت الموافقة والتنفيذ'
                              : 'تم الرفض والإلغاء'}
                          </span>
                        </div>

                        {/* Action Details Table */}
                        <div className="mt-2 space-y-1 text-[11px] text-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">البيان:</span>
                            <span className="font-bold text-slate-900">
                              {msg.approvalAction.description}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">تاريخ القيد:</span>
                            <span className="font-semibold text-indigo-700">
                              {msg.approvalAction.targetDate}
                            </span>
                          </div>

                          {msg.approvalAction.type === 'edit' && (
                            <div className="flex items-center justify-between bg-white/70 p-1.5 rounded-lg border border-amber-200 mt-1">
                              <span className="text-slate-500">تعديل المبلغ:</span>
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="line-through text-slate-400">
                                  {msg.approvalAction.originalPrice.toLocaleString()}
                                </span>
                                <ArrowRight className="w-3 h-3 text-amber-600 rotate-180" />
                                <span className="text-emerald-700 font-extrabold text-xs">
                                  {(msg.approvalAction.newPrice || 0).toLocaleString()} ر.ي
                                </span>
                              </div>
                            </div>
                          )}

                          {msg.approvalAction.type === 'delete' && (
                            <div className="flex items-center justify-between bg-rose-50 p-1.5 rounded-lg border border-rose-200 mt-1">
                              <span className="text-rose-700 font-semibold">المبلغ المطلوب حذفه:</span>
                              <span className="font-bold text-rose-800">
                                {msg.approvalAction.originalPrice.toLocaleString()} ر.ي
                              </span>
                            </div>
                          )}

                          <div className="text-[10px] text-amber-900/80 bg-amber-100/60 p-1.5 rounded-md mt-1.5">
                            {msg.approvalAction.requiresPermissionReason}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {msg.approvalAction.status === 'pending' ? (
                          <div className="mt-3 pt-2 border-t border-amber-200/80 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveAction(msg.id, msg.approvalAction!)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>أوافق واعتمد التنفيذ</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRejectAction(msg.id, msg.approvalAction!)}
                              className="bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>رفض وإلغاء</span>
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 pt-1 text-center text-[10px] font-bold text-slate-500">
                            {msg.approvalAction.status === 'approved'
                              ? '✅ تم تنفيذ هذه العملية بناءً على إذنك المباشر.'
                              : '🚫 تم إلغاء هذه العملية ولم يتم المساس بالبيانات.'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Button to Open Day Editor if message is tied to a specific date */}
                    {msg.linkedDate && (
                      <button
                        type="button"
                        onClick={() => {
                          onDateChange(msg.linkedDate!);
                          setViewMode('day_detail');
                        }}
                        className="mt-2 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>👁️ فتح كشف وتفاصيل يوم ({msg.linkedDate}) للتعديل الفوري</span>
                      </button>
                    )}

                    {/* Internal Chain of Thought & Math Verification Details */}
                    {msg.thoughtProcess && (
                      <details className="mt-2.5 text-[11px] bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2.5 text-indigo-950">
                        <summary className="font-bold cursor-pointer select-none text-indigo-800 hover:text-indigo-950 flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-indigo-600" />
                          <span>التحليل الرياضي الداخلي (Chain of Thought - دقة 100%)</span>
                        </summary>
                        <div className="mt-2 pt-2 border-t border-indigo-200/60 text-slate-700 whitespace-pre-line font-mono text-[10px] leading-relaxed">
                          {msg.thoughtProcess}
                        </div>
                      </details>
                    )}

                    {/* Direct Execution Button for Proactive Radar Alert in chat */}
                    {msg.radarAlert && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToTab) {
                              const type = msg.radarAlert!.type;
                              if (type === 'debt_limit_exceeded') onNavigateToTab('customers');
                              else if (type === 'dead_stock_liquidity') onNavigateToTab('inventory');
                              else if (type === 'critical_liquidity_ratio') onNavigateToTab('suppliers');
                              else if (type === 'cash_discrepancy') onNavigateToTab('cash_drawer');
                              else onNavigateToTab('daily_ledger');
                              onClose();
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{msg.radarAlert.actionButtonLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                        {msg.radarAlert.metricHighlight && (
                          <span className="text-[10px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                            {msg.radarAlert.metricHighlight}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Interactive Telecom Statement Card */}
                    {msg.telecomStatement && (
                      <div className="mt-3">
                        <AIAssistantTelecomStatementCard
                          statement={msg.telecomStatement}
                          onUpdateStatement={(updated) => {
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === msg.id ? { ...m, telecomStatement: updated } : m
                              )
                            );
                          }}
                          onPlayVoice={(text) => handlePlayVoice(text, msg.id, true)}
                          onNavigateToTab={(tab) => {
                            if (onNavigateToTab) {
                              onNavigateToTab(tab);
                              onClose();
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Interactive Scanned Purchase Invoice Card */}
                    {msg.scannedInvoice && (
                      <div className="mt-3">
                        <AIAssistantInvoiceCard
                          data={msg.scannedInvoice}
                          onOpenVerificationModal={(inv) => {
                            setSelectedInvoiceForVerification(inv);
                            setIsInvoiceModalOpen(true);
                          }}
                          onPlayVoice={(text) => handlePlayVoice(text, msg.id, true)}
                        />
                      </div>
                    )}

                <div className="flex flex-col gap-1.5 mt-2 pt-1.5 border-t border-black/5">
                  {/* Autoplay restriction warning notice */}
                  {msg.autoplayBlocked && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1.5 rounded-xl animate-in fade-in">
                      <VolumeX className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>قيد المتصفح تشغيل الصوت تلقائياً — اضغط "إعادة الاستماع" لسماعه:</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] ${
                          msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>

                      {msg.isVoiceResponse && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                          <Mic className="w-2.5 h-2.5 text-emerald-600" />
                          <span>رد صوتي (ar-SA)</span>
                        </span>
                      )}
                    </div>

                    {/* Listen / Re-listen Voice Button for Assistant messages */}
                    {msg.sender === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => handlePlayVoice(msg.text, msg.id, true)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-2xs ${
                          speakingMsgId === msg.id
                            ? 'bg-rose-500 text-white shadow-xs animate-pulse ring-2 ring-rose-200'
                            : msg.autoplayBlocked
                            ? 'bg-amber-500 hover:bg-amber-600 text-white font-extrabold ring-2 ring-amber-300 animate-bounce'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                        title="إعادة الاستماع صوتياً للرد باللغة العربية (ar-SA)"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>إيقاف الصوت</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-current" />
                            <span>إعادة الاستماع</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Live Recording Animation Wave */}
          {isRecording && (
            <div className="bg-rose-50 border-2 border-rose-400/80 rounded-2xl p-3.5 flex items-center gap-3 animate-in fade-in">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-sm">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="font-bold text-xs text-rose-900">جاري الاستماع لصوتك الآن...</span>
                </div>
                <p className="text-[11px] text-rose-700 truncate mt-0.5 font-mono">
                  {liveTranscript || 'تحدث الآن، وسيتحول صوتك فورياً إلى كتابة...'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleRecording}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-xs"
              >
                إنهاء وإرسال
              </button>
            </div>
          )}

          {/* Document / Statement Parsing Progress Banner */}
          {isParsingDoc && (
            <div className="bg-indigo-950 border-2 border-indigo-400 text-white rounded-2xl p-4 flex items-center gap-3.5 shadow-xl animate-in fade-in">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-spin">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs text-white">جاري المعالجة بالذكاء الاصطناعي...</h5>
                <p className="text-[11px] text-indigo-200 mt-0.5 leading-relaxed">{parsingDocStatus}</p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-indigo-700 bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 max-w-sm">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
              <span>جاري التحقق والتدقيق المالي وفصل الحسابات رياضياً...</span>
            </div>
          )}

          {/* Parsed Items Interactive Table (مع إمكانية كتابة الفايدة ف، وتعديل الأسعار قبل الحفظ) */}
          {parsedPreview && parsedPreview.length > 0 && (
            <SmartAIParsedPreviewTable
              items={parsedPreview}
              currentDate={currentDate}
              detectedDate={parsedDetectedDate}
              detectedSupplier={parsedDetectedSupplier}
              onUpdateItems={(updated) => setParsedPreview(updated)}
              onApply={(updated, chosenDate) => handleApplyParsedItems(updated, chosenDate)}
              onCancel={() => {
                setParsedPreview(null);
                setParsedDetectedDate(undefined);
                setParsedDetectedSupplier(undefined);
              }}
              availableDates={availableDates}
            />
          )}

          {/* Floating Quick Scroll Controls inside Chat */}
          {showScrollBottomBtn && (
            <div className="sticky bottom-3 left-4 z-30 flex items-center gap-2 self-start animate-in fade-in slide-in-from-bottom-2">
              <button
                type="button"
                onClick={scrollToBottomSmooth}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-indigo-400 transition-all hover:scale-105 active:scale-95 select-none"
                title="انقر للتمرير إلى أسفل المحادثة"
              >
                <ChevronDown className="w-4 h-4 animate-bounce" />
                <span>⬇️ التمرير لأسفل المحادثة</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 sm:px-4 bg-slate-100/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
          <button
            type="button"
            onClick={() => statementFileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            title="رفع كشف سداد شبكات ورصيد PDF وحساب الأرباح تلقائياً"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📄 كشف سداد PDF</span>
          </button>

          <button
            type="button"
            onClick={() => invoiceFileInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            title="رفع وقراءة فاتورة مشتريات خط اليد لاعتمادها بالمخزن"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📸 فاتورة شراء بخط اليد</span>
          </button>

          {/* Core AI Linked Tools Quick Buttons */}
          <button
            type="button"
            onClick={() => setViewMode('invoice_ocr')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
            title="الانتقال إلى قارئ الفواتير Vision AI"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-200" />
            <span>📸 قارئ الفواتير (Vision AI)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('telecom_engine')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
            title="الانتقال إلى محرك كشوفات السداد PDF"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-200" />
            <span>📄 كشوفات السداد (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('package_catalog')}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
            title="الانتقال إلى كتالوج تسعير الباقات"
          >
            <Tag className="w-3.5 h-3.5 text-amber-200" />
            <span>🏷️ كتالوج تسعير الباقات</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHintsSection(!showHintsSection)}
            className={`font-bold px-3 py-1 rounded-lg transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              showHintsSection
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
            }`}
            title="فتح/إغلاق قسم التلميحات وأكواد الاختصارات"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>💡 قسم التلميحات (ج، ك، ص، ش، ر، م)</span>
          </button>

          <span className="text-slate-400 shrink-0 font-medium mr-1">| اختصارات وأوامر ذكية:</span>
          {[
            '🔍 افحص لي حسابات اليوم والصندوق وطلع أي نقص أو أخطاء',
            '📊 كم صافي أرباحنا اليوم وكم حصة مصعب والمدير والمهندس؟',
            '👥 من هم أخطر ديون الزبائن بالسوق اليوم؟',
            '📦 ما هي البضائع الراكدة بالمخزن؟',
            '💡 كيف أبسط الشغل وأقلل التشتت في المحل؟',
            'مشتريات ك شاحن أنكر 1500 10',
            'م كفر ايفون شفاف 500 20',
            'مشتريات ج ريدمي نوت 13 55000 2',
            'ص شاشة سامسونج A12 بـ 7500 تكلفة 5000',
            'ر تحويل رصيد يمن موبايل 2000',
            'ش شريحة يو 4G جديدة 1200',
            'صرفة بيت مصعب 5000',
            'سحب مصعب 10000',
          ].map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                unlockAudioAndSpeechSynthesis();
                setInputText(sample);
                executeSend(sample);
              }}
              className="bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Voice & Input Controls Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0">
          
          {/* Direct Document Upload & Tools Toolbar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setViewMode('invoice_ocr')}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title="عرض شاشة قارئ الفواتير Vision AI بالكامل"
            >
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>📸 قارئ الفواتير (Vision AI)</span>
            </button>

            <button
              type="button"
              onClick={() => invoiceFileInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="رفع صورة أو PDF فاتورة مباشرة داخل المحادثة"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>رفع فاتورة خط اليد</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('telecom_engine')}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title="عرض محرك كشوفات السداد PDF بالكامل"
            >
              <FileText className="w-4 h-4 text-indigo-700" />
              <span>📄 كشوفات السداد (محرك PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => statementFileInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="رفع كشف سداد PDF مباشرة داخل المحادثة"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>رفع كشف سداد PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('package_catalog')}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title="عرض وضبط كتالوج تسعير الباقات وهوامش الأرباح"
            >
              <Tag className="w-4 h-4 text-amber-700" />
              <span>🏷️ كتالوج تسعير الباقات</span>
            </button>
          </div>

          {/* Speech Error / Guidance Alert */}
          {speechError && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-xs text-amber-950 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{speechError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-amber-700 hover:text-amber-900 font-bold text-sm px-1 cursor-pointer"
                title="إغلاق"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            
            {/* Hands-Free Continuous Voice Call Launcher */}
            <button
              type="button"
              onClick={() => {
                unlockAudioAndSpeechSynthesis();
                setIsHandsFreeCallOpen(true);
              }}
              className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="بدء وضع المكالمة المستمرة (Hands-Free): المايك مفتوح دائماً ومعاينة مرئية للصنف قبل اعتماده بكلمة «صح»"
            >
              <Mic className="w-5 h-5 text-emerald-100" />
            </button>

            {/* Microphone Button (Quick Voice Input) */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-600 animate-pulse shadow-lg shadow-rose-950/30 ring-4 ring-rose-200'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-950/20'
              }`}
              title={isRecording ? 'إيقاف التسجيل الصوتي' : 'تسجيل صوتي لرسالة واحدة'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input Field */}
            <input
              type="text"
              placeholder={
                isRecording
                  ? 'جاري الاستماع لصوتك... تكلم الآن...'
                  : 'تحدث بالمايك أو اكتب هنا... وسيجيبك المحاسب فوراً'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  unlockAudioAndSpeechSynthesis();
                  executeSend(inputText);
                }
              }}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
            />

            {/* Send Button */}
            <button
              type="button"
              disabled={!inputText.trim() || isLoading}
              onClick={() => {
                unlockAudioAndSpeechSynthesis();
                executeSend(inputText);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </div>

          {/* Voice Settings Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSendVoice}
                  onChange={(e) => setAutoSendVoice(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>إرسال تلقائي فوري بعد التوقف عن الكلام</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none hidden sm:flex">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>نطق الرد صوتياً تلقائياً</span>
              </label>
            </div>

            <span className="text-[10px] text-slate-400">
              {isRecording ? '🔴 يسجل الآن...' : '🎙️ اضغط المايك وتحدث بحرية'}
            </span>
          </div>

        </div>
          </>
        )}

      </div>

      {/* Hidden File Inputs for Document Processing */}
      <input
        type="file"
        ref={statementFileInputRef}
        accept=".pdf,.txt,.csv"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleProcessStatementFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      <input
        type="file"
        ref={invoiceFileInputRef}
        accept="image/*,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleProcessInvoiceFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Invoice Verification & Approval Modal */}
      {selectedInvoiceForVerification && (
        <InvoiceVerificationModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedInvoiceForVerification(null);
          }}
          invoice={selectedInvoiceForVerification}
          onApprove={(verified) => handleApproveInvoice(verified)}
        />
      )}

      {/* Package Pricing Quick Management Modal */}
      <AIPackagePricingQuickModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Choice Modal for Uploaded PDF: Statement vs Purchase Invoice */}
      {pendingPdfFileForChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-white">تحديد نوع مستند الـ PDF المرفوع</h3>
              <p className="text-xs text-slate-400 mt-1 truncate">الملف: {pendingPdfFileForChoice.name}</p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const f = pendingPdfFileForChoice;
                  setPendingPdfFileForChoice(null);
                  handleProcessStatementFile(f);
                }}
                className="w-full p-3.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-right flex items-center gap-3 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white">كشف سداد ورصيد شبكات (PDF)</div>
                  <div className="text-[11px] text-indigo-200">لحساب مبيعات الرصيد، التكلفة، وصافي الأرباح ومطابقة الباقات</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const f = pendingPdfFileForChoice;
                  setPendingPdfFileForChoice(null);
                  handleProcessInvoiceFile(f);
                }}
                className="w-full p-3.5 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-right flex items-center gap-3 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white">فاتورة مشتريات / بضاعة (PDF)</div>
                  <div className="text-[11px] text-emerald-200">لاستخراج الأصناف والكميات والأسعار والموافقة للترحيل للمخزن</div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPendingPdfFileForChoice(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* AI Training & Learning Studio Modal */}
      <SmartAITrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
      />

      {/* Hands-Free Voice Continuous Input & Live Inspection Call Modal */}
      <VoiceHandsFreeCallModal
        isOpen={isHandsFreeCallOpen}
        onClose={() => setIsHandsFreeCallOpen(false)}
        currentDate={currentDate}
        onCommitTransaction={(tx) => {
          onSaveTransaction(tx);
          const confirmMsg: ChatMessage = {
            id: `bot_voice_committed_${Date.now()}`,
            sender: 'assistant',
            text: `✅ تم قيد **${tx.description}** بمبلغ **${Number(tx.price).toLocaleString()} ر.ي** بنجاح في كشف (${tx.date}) عبر وضع المكالمة المستمرة!`,
            timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
            linkedDate: tx.date,
          };
          setMessages((prev) => [...prev, confirmMsg]);
        }}
      />
    </div>
  );
};
