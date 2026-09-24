import React, { useState, useMemo } from 'react';
import {
  Calendar,
  PlusCircle,
  Plus,
  Edit2,
  Trash2,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Wrench,
  Smartphone,
  Signal,
  Truck,
  Coins,
  Check,
  X,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  Save,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Split,
  ChevronDown,
  ChevronUp,
  Percent,
  Calculator,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  Building2,
  Receipt,
  Send,
  HelpCircle,
  Boxes,
  ArrowDownLeft,
} from 'lucide-react';
import { Transaction, DailySummary, TransactionType, Category, Supplier, PaymentMethod, InventoryItem } from '../types';
import { PriceCategory } from '../types/pricing';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { learnOrUpdatePriceMemory } from '../utils/priceMemoryStorage';
import { printHtmlElement } from '../utils/printHelper';
import { getProfitSharingConfig, calculateProfitDistribution } from '../utils/profitSharingEngine';
import { loadSuppliers, normalizeSupplierName } from '../utils/storage';
import { BatchPurchaseInvoiceModal } from './BatchPurchaseInvoiceModal';
import { MaintenancePickupModal } from './MaintenancePickupModal';
import { DailySoldReconciliationModal, UnpricedSoldEntry } from './DailySoldReconciliationModal';
import {
  isCompoundDescription,
  decomposeTransaction,
  convertDecomposedToTransactions,
  DecomposedItem,
} from '../utils/itemBreakdown';

interface DailyLedgerViewProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  transactions: Transaction[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddNewForSection: (defaultType: TransactionType) => void;
  dailySummary: DailySummary;
  onSaveTransaction?: (tx: Transaction) => void;
  onSplitCompoundTransaction?: (originalTxId: string, newTxList: Transaction[]) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenAIModal?: () => void;
  inventory?: InventoryItem[];
  onUpdateInventoryItem?: (item: InventoryItem) => void;
  onAddInventoryItem?: (item: InventoryItem) => void;
}

interface InlineEditState {
  id: string;
  description: string;
  price: number;
  cost: number;
  paidAmount?: number;
  remainingAmount?: number;
  supplierName?: string;
  technicianName?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  time?: string;
  type: TransactionType;
  category?: Category;
}

export const DEFAULT_MERCHANTS_LIST = [
  'مؤسسة العبصري لقطع الغيار',
  'خليل الأغبري للإكسسوارات وقطع الغيار',
  'عمر القاسمي لقطع الصيانة',
  'تاجر المصنف',
  'تاجر صنعاء جوالات',
  'محمد مياس (تطبيق الهادي)',
  'فايز أبو علي (شبكة القمة)',
];

export const EXPENSE_LEDGER_OPTIONS = [
  {
    value: 'expense_home_mosaab',
    label: 'صرفة بيت مصعب',
    defaultDesc: 'صرفة بيت مصعب',
    accountingRule: 'تُخصم حصراً من حصة أرباح مصعب (2/3)',
    badgeText: 'صرفة بيت مصعب',
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    category: 'mosaab' as Category,
  },
  {
    value: 'purchases_home_mosaab',
    label: 'مشتريات بيت مصعب',
    defaultDesc: 'مشتريات بيت مصعب',
    accountingRule: 'مشتريات تخص منزل مصعب (تخصم من رصيده)',
    badgeText: 'مشتريات بيت مصعب',
    colorClass: 'bg-teal-100 text-teal-800 border-teal-300',
    category: 'mosaab' as Category,
  },
  {
    value: 'withdrawal_mosaab',
    label: 'سحب مصعب',
    defaultDesc: 'سحب مصعب',
    accountingRule: 'سحب نقدي يخصم من رصيد وأرباح مصعب',
    badgeText: 'سحب مصعب',
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    category: 'mosaab' as Category,
  },
  {
    value: 'mosaab_bank_deposit_customer',
    label: 'إيداع مشتريات من حساب زبون الى حساب مصعب البنكي',
    defaultDesc: 'إيداع مشتريات من حساب زبون الى حساب مصعب البنكي',
    accountingRule: 'قيد إيداع بنكي لحساب مصعب (يُحسب في رصيد مصعب)',
    badgeText: 'إيداع بنكي زبون لمصعب',
    colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    category: 'mosaab' as Category,
  },
  {
    value: 'mosaab_purchases_fund',
    label: 'تحويل لمصعب عهدة يدي مشتريات',
    defaultDesc: 'تحويل لمصعب عهدة يدي مشتريات',
    accountingRule: 'عهدة مشتريات مسلمة لمصعب لحين إحضار الفواتير',
    badgeText: 'عهدة مشتريات لمصعب',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
    category: 'mosaab' as Category,
  },
  {
    value: 'mosaab_balance_topup',
    label: 'رصيد مصعب',
    defaultDesc: 'رصيد مصعب',
    accountingRule: 'شحن رصيد هاتف يخصم من حساب مصعب',
    badgeText: 'رصيد مصعب',
    colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    category: 'mosaab' as Category,
  },
  {
    value: 'expense_shop',
    label: 'صرفة المحل',
    defaultDesc: 'صرفة المحل',
    accountingRule: 'تُخصم من إجمالي أرباح المحل التشغيلية',
    badgeText: 'صرفة المحل',
    colorClass: 'bg-rose-100 text-rose-800 border-rose-300',
    category: 'expenses' as Category,
  },
  {
    value: 'expense_internet_shop',
    label: 'رصيد إنترنت المحل',
    defaultDesc: 'رصيد إنترنت المحل',
    accountingRule: 'مصروف تشغيل شبكة المحل (يخصم من أرباح التشغيل)',
    badgeText: 'رصيد إنترنت المحل',
    colorClass: 'bg-blue-100 text-blue-800 border-blue-300',
    category: 'expenses' as Category,
  },
  {
    value: 'return_to_supplier_musannaf',
    label: 'مرتجع لتاجر المصنف',
    defaultDesc: 'مرتجع لتاجر المصنف',
    accountingRule: 'مرتجع بضاعة دائن/مدين لتاجر المصنف',
    supplierName: 'تاجر المصنف',
    badgeText: 'مرتجع لتاجر المصنف',
    colorClass: 'bg-orange-100 text-orange-800 border-orange-300',
    category: 'purchases' as Category,
  },
  {
    value: 'return_to_supplier_aghbari',
    label: 'مرتجع الاغبري',
    defaultDesc: 'مرتجع الاغبري',
    accountingRule: 'مرتجع بضاعة يخصم من حساب خليل الأغبري',
    supplierName: 'خليل الأغبري',
    badgeText: 'مرتجع الاغبري',
    colorClass: 'bg-orange-100 text-orange-800 border-orange-300',
    category: 'purchases' as Category,
  },
  {
    value: 'return_to_supplier_qasimi',
    label: 'مرتجع القاسمي',
    defaultDesc: 'مرتجع القاسمي',
    accountingRule: 'مرتجع بضاعة يخصم من حساب عمر القاسمي',
    supplierName: 'عمر القاسمي',
    badgeText: 'مرتجع القاسمي',
    colorClass: 'bg-orange-100 text-orange-800 border-orange-300',
    category: 'purchases' as Category,
  },
  {
    value: 'return_to_supplier_sanaa',
    label: 'مرتجع تاجر صنعاء جوالات',
    defaultDesc: 'مرتجع تاجر صنعاء جوالات',
    accountingRule: 'مرتجع جوالات لتاجر صنعاء',
    supplierName: 'تاجر صنعاء جوالات',
    badgeText: 'مرتجع تاجر صنعاء جوالات',
    colorClass: 'bg-orange-100 text-orange-800 border-orange-300',
    category: 'purchases' as Category,
  },
  {
    value: 'withdrawal_store_support',
    label: 'سحب من الدعم المقدم للمحل',
    defaultDesc: 'سحب من الدعم المقدم للمحل',
    accountingRule: 'سحب يخصم من حساب الدعم/رأس المال المقدم',
    badgeText: 'سحب من الدعم المقدم للمحل',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
    category: 'expenses' as Category,
  },
  {
    value: 'withdrawal_engineer_third',
    label: 'سحب المهندس من حسابة الثلث',
    defaultDesc: 'سحب المهندس من حسابة الثلث',
    accountingRule: 'سحب نقدي يخصم من حصة أرباح المهندس (1/3)',
    badgeText: 'سحب المهندس من حسابة الثلث',
    colorClass: 'bg-purple-100 text-purple-800 border-purple-300',
    category: 'engineer' as Category,
  },
  {
    value: 'transfer_mohammed_mayas',
    label: 'حوالة محمد مياس (تطبيق الهادي)',
    defaultDesc: 'حوالة محمد مياس (تطبيق الهادي)',
    accountingRule: 'سداد / حوالة مورد لتغذية رصيد تطبيق الهادي (محمد مياس)',
    supplierName: 'محمد مياس (تطبيق الهادي)',
    badgeText: 'حوالة تطبيق الهادي',
    colorClass: 'bg-sky-100 text-sky-800 border-sky-300',
    category: 'balance' as Category,
  },
  {
    value: 'transfer_faiez_abu_ali',
    label: 'حوالة فايز أبو علي (شبكة القمة)',
    defaultDesc: 'حوالة فايز أبو علي (شبكة القمة)',
    accountingRule: 'سداد / حوالة مورد لتغذية رصيد شبكة القمة (فايز أبو علي)',
    supplierName: 'فايز أبو علي (شبكة القمة)',
    badgeText: 'حوالة شبكة القمة',
    colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    category: 'balance' as Category,
  },
  {
    value: 'transfer_khalil_aghbari',
    label: 'حوالة خليل الاغبري',
    defaultDesc: 'حوالة خليل الاغبري',
    accountingRule: 'سداد حوالة للمورد خليل الأغبري',
    supplierName: 'خليل الأغبري',
    badgeText: 'حوالة خليل الاغبري',
    colorClass: 'bg-violet-100 text-violet-800 border-violet-300',
    category: 'purchases' as Category,
  },
  {
    value: 'transfer_omar_qasimi',
    label: 'حوالة لعمرالقاسمي',
    defaultDesc: 'حوالة لعمرالقاسمي',
    accountingRule: 'سداد حوالة للمورد عمر القاسمي',
    supplierName: 'عمر القاسمي',
    badgeText: 'حوالة لعمرالقاسمي',
    colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    category: 'purchases' as Category,
  },
  {
    value: 'transfer_musannaf',
    label: 'حوالة المصنف',
    defaultDesc: 'حوالة المصنف',
    accountingRule: 'سداد حوالة للمورد المصنف',
    supplierName: 'تاجر المصنف',
    badgeText: 'حوالة المصنف',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
    category: 'purchases' as Category,
  },
  {
    value: 'transfer_new_supplier',
    label: 'حوالة لتاجر جديد',
    defaultDesc: 'حوالة لتاجر جديد',
    accountingRule: 'سداد حوالة لمورد بضاعة/قطع جديد',
    badgeText: 'حوالة لتاجر جديد',
    colorClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    category: 'purchases' as Category,
  },
];

export const DailyLedgerView: React.FC<DailyLedgerViewProps> = ({
  currentDate,
  onDateChange,
  availableDates,
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onAddNewForSection,
  dailySummary,
  onSaveTransaction,
  onSplitCompoundTransaction,
  onNavigateTab,
  onOpenAIModal,
  inventory = [],
  onUpdateInventoryItem,
  onAddInventoryItem,
}) => {
  // Filter transactions for current date
  const dayTx = transactions.filter((t) => t.date === currentDate);

  // Unpriced sold products reconciliation state & calculation (End-of-day feature)
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const unpricedSoldEntries: UnpricedSoldEntry[] = useMemo(() => {
    const daySales = dayTx.filter((t) => t.type === 'sale');
    return daySales
      .filter((tx) => {
        const descLower = (tx.description || '').trim().toLowerCase();
        const matched = inventory.find((i) => i.name.trim().toLowerCase() === descLower);
        const isUnpricedInInventory =
          matched && (matched.isPendingPricing || matched.costPrice === 0 || matched.isPendingStock);
        const isZeroCostTx = !tx.cost || tx.cost === 0;
        return isZeroCostTx || isUnpricedInInventory;
      })
      .map((tx) => {
        const descLower = (tx.description || '').trim().toLowerCase();
        const matched = inventory.find((i) => i.name.trim().toLowerCase() === descLower);
        return {
          transaction: tx,
          matchedInventoryItem: matched,
          productName: tx.description,
          salePrice: tx.price,
          currentCost: tx.cost || (matched?.costPrice || 0),
        };
      });
  }, [dayTx, inventory]);

  const handleSaveReconciledEntry = (
    transactionId: string,
    costPrice: number,
    sellingPrice: number,
    stockQuantity: number,
    inventoryItemId?: string
  ) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (tx && onSaveTransaction) {
      const updatedTx: Transaction = {
        ...tx,
        cost: costPrice,
        profit: Math.max(0, tx.price - costPrice),
      };
      onSaveTransaction(updatedTx);
    }

    if (inventoryItemId && onUpdateInventoryItem) {
      const existing = inventory.find((i) => i.id === inventoryItemId);
      if (existing) {
        onUpdateInventoryItem({
          ...existing,
          costPrice,
          sellingPrice,
          quantity: stockQuantity,
          isPendingPricing: false,
          isPendingStock: false,
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (tx && onAddInventoryItem) {
      const newItem: InventoryItem = {
        id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        barcode: 'AUTO' + Date.now().toString().slice(-6),
        name: tx.description,
        category: (tx.category as any) || 'accessories',
        costPrice,
        sellingPrice,
        quantity: stockQuantity,
        minQuantity: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPendingPricing: false,
        isPendingStock: false,
      };
      onAddInventoryItem(newItem);
    }
  };

  // Load profit sharing configuration & compute active model
  const profitConfig = getProfitSharingConfig();
  const profitResult = dailySummary.profitSharingResult || calculateProfitDistribution(dayTx, profitConfig, 1);
  const [showAuditTrail, setShowAuditTrail] = useState<boolean>(false);

  // All known merchants list: standard defaults + stored suppliers + past transactions (normalized)
  const allKnownSuppliers = useMemo(() => {
    const loadedSups = loadSuppliers().map((s) => normalizeSupplierName(s.name)).filter(Boolean);
    const txSups = transactions.map((t) => normalizeSupplierName(t.supplierName || '')).filter(Boolean);
    const defaultSups = DEFAULT_MERCHANTS_LIST.map((d) => normalizeSupplierName(d));
    const set = new Set([...defaultSups, ...loadedSups, ...txSups]);
    return Array.from(set).filter(Boolean);
  }, [transactions]);

  const salesTx = dayTx.filter((t) => t.type === 'sale');
  const maintTx = dayTx.filter((t) => t.type === 'maintenance');
  const purchTx = dayTx.filter((t) => t.type === 'purchase');

  // مبيعات وصرفات وتغذية وحوالات الرصيد المدمجة (تطبيق الهادي - محمد مياس & تطبيق الرقم - فايز أبو علي)
  const isBalanceOutflow = (t: Transaction) => {
    // مبيعات الرصيد هي إيراد وليست تدفقاً خارجاً
    if (t.type === 'balance_hadi' || t.type === 'balance_qimma') {
      return false;
    }
    return (
      t.type === 'transfer_mohammed_mayas' ||
      t.type === 'transfer_faiez_abu_ali' ||
      t.type === 'expense_internet_shop' ||
      t.type === 'expense_modem' ||
      (t.category === 'balance') ||
      (t.type === 'purchase' && (
        t.supplierName?.includes('مياس') ||
        t.supplierName?.includes('الهادي') ||
        t.supplierName?.includes('فايز') ||
        t.supplierName?.includes('الرقم') ||
        t.supplierName?.includes('القمة')
      )) ||
      (t.type.startsWith('expense_') && (
        t.supplierName?.includes('مياس') ||
        t.supplierName?.includes('الهادي') ||
        t.supplierName?.includes('فايز') ||
        t.supplierName?.includes('الرقم') ||
        t.supplierName?.includes('القمة')
      ))
    );
  };

  const hadiTx = dayTx.filter((t) => t.type === 'balance_hadi');
  const qimmaTx = dayTx.filter((t) => t.type === 'balance_qimma');
  const balanceSalesTx = [...hadiTx, ...qimmaTx];
  const balanceOutflowsTx = dayTx.filter((t) => isBalanceOutflow(t));

  // دمج العمليات مع ضمان عدم تكرار أي عملية بنفس المفتاح
  const mergedBalanceMap = new Map<string, Transaction>();
  [...balanceSalesTx, ...balanceOutflowsTx].forEach((t) => {
    if (t.id && !mergedBalanceMap.has(t.id)) {
      mergedBalanceMap.set(t.id, t);
    }
  });
  const mergedBalanceTx = Array.from(mergedBalanceMap.values());

  const [balanceFilterTab, setBalanceFilterTab] = useState<'all' | 'sales' | 'outflows' | 'hadi' | 'raqam'>('all');

  const displayedMergedBalanceTx = mergedBalanceTx.filter((t) => {
    if (balanceFilterTab === 'sales') return t.type === 'balance_hadi' || t.type === 'balance_qimma';
    if (balanceFilterTab === 'outflows') return isBalanceOutflow(t);
    if (balanceFilterTab === 'hadi') {
      return (
        t.type === 'balance_hadi' ||
        t.type === 'transfer_mohammed_mayas' ||
        t.supplierName?.includes('مياس') ||
        t.supplierName?.includes('الهادي') ||
        t.description?.includes('مياس') ||
        t.description?.includes('الهادي')
      );
    }
    if (balanceFilterTab === 'raqam') {
      return (
        t.type === 'balance_qimma' ||
        t.type === 'transfer_faiez_abu_ali' ||
        t.supplierName?.includes('فايز') ||
        t.supplierName?.includes('الرقم') ||
        t.supplierName?.includes('القمة') ||
        t.description?.includes('فايز') ||
        t.description?.includes('الرقم')
      );
    }
    return true;
  });

  const totalRechargeSales = balanceSalesTx.reduce((sum, t) => sum + (t.price || 0), 0);
  const totalRechargeCost = balanceSalesTx.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalRechargeProfit = balanceSalesTx.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalRechargeOutflows = balanceOutflowsTx.reduce((sum, t) => sum + (t.price || t.cost || 0), 0);
  const netRechargeCashFlow = totalRechargeSales - totalRechargeOutflows;

  // المصاريف والمسحوبات العامة (المدمج منها في قسم الرصيد يتم استبعاده لتفادي الازدواجية)
  const expTx = dayTx.filter(
    (t) =>
      !isBalanceOutflow(t) &&
      (t.type.startsWith('expense_') ||
        t.type.startsWith('withdrawal_') ||
        t.type.startsWith('transfer_') ||
        t.type.startsWith('return_to_') ||
        t.type === 'shop_tools_outflow' ||
        t.type === 'mosaab_purchases_fund' ||
        t.type === 'purchases_home_mosaab' ||
        t.type === 'mosaab_bank_deposit_customer' ||
        t.type === 'mosaab_balance_topup')
  );

  // View mode: detailed itemized rows (default) vs summary vouchers
  const [detailedViewMode, setDetailedViewMode] = useState<boolean>(true);

  // Inline editing state (Unlocked row)
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<InlineEditState | null>(null);

  // Master Global Edit Toggle (One button controls all sections)
  const [isGlobalEditMode, setIsGlobalEditMode] = useState<boolean>(false);

  // Table unlock state for quick batch editing
  const [unlockedTables, setUnlockedTables] = useState<Record<string, boolean>>({
    sales: false,
    maintenance: false,
    balance: false,
    purchases: false,
    expenses: false,
  });

  // Check if a section is unlocked (global edit mode unlocks all sections at once)
  const isSectionUnlocked = (sectionKey: string) => isGlobalEditMode || !!unlockedTables[sectionKey];

  // Toggle master global edit mode for all sections with 1 click
  const toggleGlobalEdit = () => {
    const nextState = !isGlobalEditMode;
    setIsGlobalEditMode(nextState);
    setUnlockedTables({
      sales: nextState,
      maintenance: nextState,
      balance: nextState,
      purchases: nextState,
      expenses: nextState,
    });
    if (!nextState) {
      cancelInlineEdit();
      showToast('تم قفل كشف اليومية لجميع الأقسام بنجاح 🔒');
    } else {
      showToast('تم تفعيل وضع التعديل الشامل عبر الزر الموحد! كافة الأقسام مفتوحة للإضافة والتعديل والعمليات 🔓');
    }
  };

  // Expanded compound rows mapping
  const [expandedCompoundMap, setExpandedCompoundMap] = useState<Record<string, boolean>>({});

  // Success alert message
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  // Toggle individual table unlock
  const toggleTableUnlock = (sectionKey: string) => {
    setUnlockedTables((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Start inline editing for a single row
  const startInlineEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditFormData({
      id: tx.id,
      description: tx.description,
      price: tx.price,
      cost: tx.cost,
      paidAmount: tx.paidAmount !== undefined ? tx.paidAmount : (tx.type === 'purchase' ? tx.price : undefined),
      remainingAmount: tx.remainingAmount !== undefined ? tx.remainingAmount : 0,
      supplierName: tx.supplierName || '',
      technicianName: tx.technicianName || '',
      paymentMethod: tx.paymentMethod || 'cash',
      notes: tx.notes || '',
      time: tx.time || '',
      type: tx.type,
      category: tx.category,
    });
  };

  // Cancel inline editing
  const cancelInlineEdit = () => {
    setEditingTxId(null);
    setEditFormData(null);
  };

  // Save inline editing directly without opening any modal
  const saveInlineEdit = () => {
    if (!editFormData) return;
    const originalTx = transactions.find((t) => t.id === editFormData.id);
    if (!originalTx) return;

    const numPrice = Number(editFormData.price) || 0;
    const numCost = Number(editFormData.cost) || 0;
    const numPaid = editFormData.paidAmount !== undefined ? Number(editFormData.paidAmount) : undefined;
    const numRemaining = editFormData.remainingAmount !== undefined ? Number(editFormData.remainingAmount) : undefined;
    const numProfit = Math.max(0, numPrice - numCost);

    const updatedTx: Transaction = {
      ...originalTx,
      type: editFormData.type || originalTx.type,
      category: editFormData.category || originalTx.category,
      description: editFormData.description.trim() || originalTx.description,
      price: numPrice,
      cost: numCost,
      paidAmount: numPaid,
      remainingAmount: numRemaining,
      profit: numProfit,
      supplierName: editFormData.supplierName?.trim() || undefined,
      technicianName: editFormData.technicianName?.trim() || undefined,
      paymentMethod: editFormData.paymentMethod,
      notes: editFormData.notes?.trim() || undefined,
      time: editFormData.time?.trim() || originalTx.time,
    };

    // Auto learn or update price memory
    if (updatedTx.description && (numCost > 0 || numPrice > 0)) {
      try {
        const priceCat: PriceCategory =
          (updatedTx.category as any) === 'maintenance'
            ? 'spare_parts'
            : (updatedTx.category as any) || 'other';

        learnOrUpdatePriceMemory(
          updatedTx.description,
          numCost,
          numPrice,
          priceCat,
          updatedTx.supplierName,
          'تم التعديل المباشر في الجدول وحفظه'
        );
      } catch (e) {
        console.error('Error auto-learning price:', e);
      }
    }

    if (onSaveTransaction) {
      onSaveTransaction(updatedTx);
    }

    showToast(`تم حفظ تعديل "${updatedTx.description}" بنجاح في الجدول والمزامنة السحابية!`);
    setEditingTxId(null);
    setEditFormData(null);
  };

  // Batch Purchase Modal and Maintenance Pickup Modal states
  const [isBatchPurchaseModalOpen, setIsBatchPurchaseModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);

  const handleSaveBatchPurchases = (
    purchasesTransactions: Transaction[],
    expenseTransferTx?: Transaction
  ) => {
    if (onSaveTransaction) {
      purchasesTransactions.forEach((tx) => onSaveTransaction(tx));
      if (expenseTransferTx) {
        onSaveTransaction(expenseTransferTx);
      }
    }
    showToast(`تم حفظ فاتورة المشتريات المجمعة (${purchasesTransactions.length} أصناف) بنجاح وترحيل الحسابات ⚡`);
  };

  const handleDeliverMaintenanceDevice = (
    originalTx: Transaction,
    collectedToday: number,
    paymentMethod: string,
    pickupNotes?: string
  ) => {
    const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // 1. Create a new maintenance revenue transaction for today (cost 0 so parts are not double-counted!)
    const pickupTx: Transaction = {
      id: `maint_pickup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: currentDate,
      time: currentTime,
      type: 'maintenance',
      category: 'maintenance',
      description: `استلام باقي صيانة [${originalTx.description}] - الزبون: ${originalTx.customerName || 'الزبون'} (بز الجوال)`,
      price: collectedToday,
      cost: 0,
      profit: collectedToday,
      technicianName: originalTx.technicianName || 'المهندس',
      supplierName: originalTx.supplierName,
      customerName: originalTx.customerName,
      customerPhone: originalTx.customerPhone,
      maintenanceStatus: 'delivered',
      linkedTransactionId: originalTx.id,
      notes: pickupNotes || `تم تسليم الجهاز واستلام المتبقي (${collectedToday.toLocaleString()} ر.ي) - كان واصل سابقاً: ${(originalTx.price || 0).toLocaleString()} ر.ي`,
      paymentMethod: paymentMethod as any,
    };

    // 2. Update original transaction
    const updatedOriginal: Transaction = {
      ...originalTx,
      remainingAmount: 0,
      maintenanceStatus: 'delivered',
      notes: `${originalTx.notes || ''} [تم تسليم الجهاز وسداد الباقي في ${currentDate}]`.trim(),
    };

    if (onSaveTransaction) {
      onSaveTransaction(pickupTx);
      onSaveTransaction(updatedOriginal);
    }

    showToast(`تم توثيق تسليم الجهاز واستلام ${collectedToday.toLocaleString()} ر.ي في صندوق اليوم بنجاح ⚡`);
  };

  // Inline new row state for adding directly into tables without opening an invoice modal
  const [activeNewSection, setActiveNewSection] = useState<
    | 'sales'
    | 'maintenance'
    | 'balance_hadi'
    | 'balance_qimma'
    | 'transfer_mohammed_mayas'
    | 'transfer_faiez_abu_ali'
    | 'expense_internet_shop'
    | 'purchases'
    | 'expenses'
    | null
  >(null);

  const [newRowData, setNewRowData] = useState<{
    time: string;
    description: string;
    price: string;
    cost: string;
    amount: string;
    paidAmount: string;
    remainingAmount: string;
    agreedAmount: string;
    destinationCategory: string;
    supplierName: string;
    isCustomSupplier: boolean;
    customSupplierName: string;
    technicianName: string;
    paymentMethod: 'cash' | 'transfer' | 'debt';
    notes: string;
    expenseType: string;
    balanceNetwork: 'balance_hadi' | 'balance_qimma' | 'transfer_mohammed_mayas' | 'transfer_faiez_abu_ali' | 'expense_internet_shop';
  }>({
    time: '',
    description: '',
    price: '',
    cost: '',
    amount: '',
    paidAmount: '',
    remainingAmount: '',
    agreedAmount: '',
    destinationCategory: 'maintenance_parts',
    supplierName: DEFAULT_MERCHANTS_LIST[0],
    isCustomSupplier: false,
    customSupplierName: '',
    technicianName: '',
    paymentMethod: 'cash',
    notes: '',
    expenseType: 'expense_home_mosaab',
    balanceNetwork: 'balance_hadi',
  });

  const openNewInlineRow = (
    section:
      | 'sales'
      | 'maintenance'
      | 'balance_hadi'
      | 'balance_qimma'
      | 'transfer_mohammed_mayas'
      | 'transfer_faiez_abu_ali'
      | 'expense_internet_shop'
      | 'purchases'
      | 'expenses',
    defaultType?: string,
    defaultDescription?: string,
    initialSupplier?: string
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const defaultSup = initialSupplier || allKnownSuppliers[0] || 'مؤسسة العبصري لقطع الغيار';

    let defaultBalanceNet:
      | 'balance_hadi'
      | 'balance_qimma'
      | 'transfer_mohammed_mayas'
      | 'transfer_faiez_abu_ali'
      | 'expense_internet_shop' = 'balance_hadi';

    if (
      section === 'balance_qimma' ||
      section === 'transfer_mohammed_mayas' ||
      section === 'transfer_faiez_abu_ali' ||
      section === 'expense_internet_shop'
    ) {
      defaultBalanceNet = section;
    }

    setActiveNewSection(section);
    setNewRowData({
      time: timeStr,
      description: defaultDescription || '',
      price: '',
      cost: '',
      amount: '',
      paidAmount: '',
      remainingAmount: '',
      agreedAmount: '',
      destinationCategory: section === 'purchases' ? 'maintenance_parts' : '',
      supplierName:
        section === 'purchases'
          ? defaultSup
          : section === 'transfer_mohammed_mayas' || section === 'balance_hadi'
          ? 'محمد مياس (تطبيق الهادي)'
          : section === 'transfer_faiez_abu_ali' || section === 'balance_qimma'
          ? 'فايز أبو علي (شبكة القمة)'
          : '',
      isCustomSupplier: false,
      customSupplierName: '',
      technicianName: section === 'maintenance' ? 'المهندس' : '',
      paymentMethod: 'cash',
      notes: '',
      expenseType: defaultType || 'expense_home_mosaab',
      balanceNetwork: defaultBalanceNet,
    });

    setTimeout(() => {
      let targetId = 'new-row-sales-desc';
      if (section === 'purchases') targetId = 'new-row-purch-desc';
      else if (section === 'maintenance') targetId = 'new-row-maint-desc';
      else if (section === 'expenses') targetId = 'new-row-exp-desc';
      else if (
        section.startsWith('balance') ||
        section.startsWith('transfer_') ||
        section === 'expense_internet_shop'
      )
        targetId = 'new-row-balance-desc';
      const el = document.getElementById(targetId);
      if (el) el.focus();
    }, 80);
  };

  const handleSaveNewRow = (keepNextRowOpen: boolean = true) => {
    if (!activeNewSection) return;

    let numPrice = Number(newRowData.price || newRowData.amount) || 0;
    let numCost = Number(newRowData.cost) || 0;
    const desc = newRowData.description.trim();

    let txType: TransactionType = 'sale';
    let txCat: Category = 'accessories';
    let supName = newRowData.supplierName?.trim() || undefined;
    let techName = newRowData.technicianName?.trim() || undefined;
    let paidAmt: number | undefined = undefined;
    let remAmt: number | undefined = undefined;

    if (activeNewSection === 'maintenance') {
      txType = 'maintenance';
      txCat = 'maintenance';
      techName = techName || 'المهندس';
      const agreedNum = Number(newRowData.agreedAmount) || (numPrice + (Number(newRowData.remainingAmount) || 0));
      const remNum = Number(newRowData.remainingAmount) || (agreedNum > numPrice ? agreedNum - numPrice : 0);
      remAmt = remNum;
    } else if (activeNewSection === 'balance_hadi') {
      txType = 'balance_hadi';
      txCat = 'balance';
      supName = 'محمد مياس (تطبيق الهادي)';
    } else if (activeNewSection === 'balance_qimma') {
      txType = 'balance_qimma';
      txCat = 'balance';
      supName = 'فايز أبو علي (شبكة القمة)';
    } else if (activeNewSection === 'transfer_mohammed_mayas') {
      txType = 'transfer_mohammed_mayas';
      txCat = 'balance';
      supName = 'محمد مياس (تطبيق الهادي)';
      numCost = numPrice;
    } else if (activeNewSection === 'transfer_faiez_abu_ali') {
      txType = 'transfer_faiez_abu_ali';
      txCat = 'balance';
      supName = 'فايز أبو علي (شبكة القمة)';
      numCost = numPrice;
    } else if (activeNewSection === 'expense_internet_shop') {
      txType = 'expense_internet_shop';
      txCat = 'balance';
      numCost = numPrice;
    } else if (activeNewSection === 'purchases') {
      txType = 'purchase';
      txCat = 'purchases';
      supName = newRowData.isCustomSupplier
        ? (newRowData.customSupplierName.trim() || 'تاجر جديد')
        : (newRowData.supplierName || 'مؤسسة العبصري لقطع الغيار');

      paidAmt = Number(newRowData.paidAmount || newRowData.amount) || 0;
      remAmt = Number(newRowData.remainingAmount) || 0;
      const totalPurchCost = paidAmt + remAmt;

      numPrice = paidAmt;
      numCost = totalPurchCost > 0 ? totalPurchCost : (Number(newRowData.cost) || paidAmt);

      if (!desc && paidAmt === 0 && remAmt === 0 && numCost === 0) {
        showToast('يرجى كتابة بيان المشتريات أو المبلغ المحول لإتمام الإضافة');
        return;
      }
    } else if (activeNewSection === 'expenses') {
      txType = (newRowData.expenseType as TransactionType) || 'expense_home_mosaab';
      const chosenOpt = EXPENSE_LEDGER_OPTIONS.find((o) => o.value === txType);
      if (chosenOpt) {
        txCat = chosenOpt.category;
        if (chosenOpt.supplierName && !supName) {
          supName = chosenOpt.supplierName;
        }
      } else {
        txCat = 'expenses';
      }

      if (!desc && numPrice === 0) {
        showToast('يرجى كتابة البيان أو المبلغ لإتمام الإضافة');
        return;
      }
    }

    if (activeNewSection !== 'purchases' && activeNewSection !== 'expenses') {
      if (!desc && numPrice === 0 && numCost === 0) {
        showToast('يرجى كتابة البيان أو المبلغ لإتمام الإضافة');
        return;
      }
    }

    const calculatedProfit =
      txType === 'purchase' ||
      txType.startsWith('expense_') ||
      txType.startsWith('withdrawal_') ||
      txType.startsWith('transfer_') ||
      txType.startsWith('return_to_') ||
      txType === 'mosaab_purchases_fund' ||
      txType === 'purchases_home_mosaab'
        ? 0
        : Math.max(0, numPrice - numCost);

    const chosenExpenseOpt = EXPENSE_LEDGER_OPTIONS.find((o) => o.value === txType);

    const agreedVal = activeNewSection === 'maintenance'
      ? (Number(newRowData.agreedAmount) || (numPrice + (remAmt || 0)))
      : undefined;

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: currentDate,
      time:
        newRowData.time.trim() ||
        new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type: txType,
      category: txCat,
      description:
        desc ||
        (txType === 'purchase'
          ? `مشتريات من ${supName}`
          : chosenExpenseOpt?.defaultDesc ||
            (txType === 'balance_hadi'
              ? 'مبيع رصيد - تطبيق الهادي (محمد مياس)'
              : txType === 'balance_qimma'
              ? 'مبيع رصيد - شبكة القمة (فايز أبو علي)'
              : txType === 'transfer_mohammed_mayas'
              ? 'حوالة / سداد تطبيق الهادي (محمد مياس)'
              : txType === 'transfer_faiez_abu_ali'
              ? 'حوالة / سداد شبكة القمة (فايز أبو علي)'
              : txType === 'expense_internet_shop'
              ? 'صرفة رصيد إنترنت ومودم المحل'
              : 'عملية بدون بيان')),
      price: numPrice,
      cost: numCost,
      paidAmount: paidAmt,
      remainingAmount: remAmt,
      agreedAmount: agreedVal,
      maintenanceStatus: activeNewSection === 'maintenance' ? (remAmt && remAmt > 0 ? 'received' : 'ready') : undefined,
      destinationCategory: activeNewSection === 'purchases' ? (newRowData.destinationCategory as any) : undefined,
      profit: calculatedProfit,
      paymentMethod: newRowData.paymentMethod,
      supplierName: supName ? normalizeSupplierName(supName) : undefined,
      technicianName: techName,
      notes: newRowData.notes?.trim() || (remAmt && remAmt > 0 ? (activeNewSection === 'maintenance' ? `الاتفاق: ${agreedVal?.toLocaleString()} | واصل: ${numPrice.toLocaleString()} | باقي: ${remAmt.toLocaleString()} ر.ي` : `المتبقي له: ${remAmt} ر.ي`) : undefined),
    };

    if (onSaveTransaction) {
      onSaveTransaction(newTx);
    }

    showToast(`تمت إضافة "${newTx.description}" بنجاح في الجدول والمخزن ⚡`);

    if (keepNextRowOpen) {
      const now = new Date();
      const nextTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentSection = activeNewSection;
      const defaultSup = allKnownSuppliers[0] || 'مؤسسة العبصري لقطع الغيار';

      setNewRowData({
        time: nextTime,
        description: '',
        price: '',
        cost: '',
        amount: '',
        paidAmount: '',
        remainingAmount: '',
        agreedAmount: '',
        destinationCategory: currentSection === 'purchases' ? 'maintenance_parts' : '',
        supplierName:
          currentSection === 'purchases'
            ? defaultSup
            : currentSection === 'transfer_mohammed_mayas' || currentSection === 'balance_hadi'
            ? 'محمد مياس (تطبيق الهادي)'
            : currentSection === 'transfer_faiez_abu_ali' || currentSection === 'balance_qimma'
            ? 'فايز أبو علي (شبكة القمة)'
            : '',
        isCustomSupplier: false,
        customSupplierName: '',
        technicianName: currentSection === 'maintenance' ? 'المهندس' : '',
        paymentMethod: 'cash',
        notes: '',
        expenseType: newRowData.expenseType || 'expense_home_mosaab',
        balanceNetwork: newRowData.balanceNetwork || 'balance_hadi',
      });
      setTimeout(() => {
        let targetId = 'new-row-sales-desc';
        if (currentSection === 'purchases') targetId = 'new-row-purch-desc';
        else if (currentSection === 'maintenance') targetId = 'new-row-maint-desc';
        else if (currentSection === 'expenses') targetId = 'new-row-exp-desc';
        else if (
          currentSection &&
          (currentSection.startsWith('balance') ||
            currentSection.startsWith('transfer_') ||
            currentSection === 'expense_internet_shop')
        )
          targetId = 'new-row-balance-desc';
        const el = document.getElementById(targetId);
        if (el) el.focus();
      }, 60);
    } else {
      setActiveNewSection(null);
    }
  };

  // Split compound transaction into separate independent transactions
  const handleSplitCompound = (tx: Transaction) => {
    const decomposed = decomposeTransaction(tx);
    if (decomposed.length <= 1) {
      showToast('هذه الحركة لا تحتوي على أصناف متعددة مفصولة بـ (+)');
      return;
    }

    const newTransactions = convertDecomposedToTransactions(tx, decomposed);

    if (
      window.confirm(
        `هل تريد تفكيك هذا البيان المجمع إلى (${newTransactions.length}) حركات وسطور مستقلة في الجدول وقاعدة البيانات نهائياً؟`
      )
    ) {
      if (onSplitCompoundTransaction) {
        onSplitCompoundTransaction(tx.id, newTransactions);
        showToast(`تم تفكيك البيان بنجاح إلى ${newTransactions.length} أسطر مستقلة مع حفظ التكلفة والربح لكل صنف!`);
      }
    }
  };

  // Toggle expand compound items
  const toggleExpandCompound = (txId: string) => {
    setExpandedCompoundMap((prev) => ({
      ...prev,
      [txId]: !prev[txId],
    }));
  };

  // Navigate next/prev date
  const currentIndex = availableDates.indexOf(currentDate);
  const handlePrevDay = () => {
    if (currentIndex < availableDates.length - 1 && currentIndex !== -1) {
      onDateChange(availableDates[currentIndex + 1]);
    }
  };
  const handleNextDay = () => {
    if (currentIndex > 0) {
      onDateChange(availableDates[currentIndex - 1]);
    }
  };

  return (
    <div id="daily-ledger-printable-content" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast notification for fast saves */}
      {successToast && (
        <div className="fixed bottom-5 left-5 z-50 bg-emerald-900 text-white border border-emerald-500/50 shadow-2xl px-4 py-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-emerald-300">تم الحفظ التلقائي الفوري</div>
            <div className="text-xs text-emerald-100">{successToast}</div>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-white mr-2 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Day Navigator */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-xl font-black text-slate-900">
              كشف اليومية والجداول التفصيلية
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 font-mono-numbers">
              {currentDate}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              تعديل مباشر بدون نوافذ ⚡
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            إمكانية تعديل أي بيان وسعر وتكلفة مباشرة في الجدول عبر إلغاء القفل + تفصيل تلقائي لكل صنف
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Detailed Mode vs Summary Mode Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setDetailedViewMode(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                detailedViewMode
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض كل صنف وعملية في جدول مستقل مع التكلفة والربح"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>عرض تفصيلي للأصناف</span>
            </button>
            <button
              onClick={() => setDetailedViewMode(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                !detailedViewMode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض السندات التجميعية كما هي"
            >
              <span>عرض السند المجمع</span>
            </button>
          </div>

          {/* Day navigation buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs justify-between">
            <button
              onClick={handlePrevDay}
              disabled={currentIndex >= availableDates.length - 1 || currentIndex === -1}
              className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
              title="اليوم السابق"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 px-1 focus:outline-none cursor-pointer text-center"
            />
            <button
              onClick={handleNextDay}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
              title="اليوم اللاحق"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          {/* Master Global One-Click Edit Toggle Button */}
          <button
            onClick={toggleGlobalEdit}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md no-print ${
              isGlobalEditMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-300 animate-pulse'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 ring-1 ring-amber-600/30'
            }`}
            title="زر تحكم موحد: ضغطة واحدة تسمح لك بالتعديل والإضافة في جميع الأقسام دفعة واحدة"
          >
            {isGlobalEditMode ? (
              <>
                <Lock className="w-4 h-4 text-white" />
                <span>قفل اليومية (التعديل مفعّل 🔓)</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-slate-950" />
                <span>تعديل اليومية (زر موحد لكافة الأقسام)</span>
              </>
            )}
          </button>

          {/* Export / Print */}
          <button
            onClick={() => printHtmlElement('daily-ledger-printable-content', `كشف_يومية_${currentDate}`)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors no-print shrink-0 cursor-pointer shadow-2xs"
            title="طباعة كشف هذا اليوم مع الجداول والتصفية"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">طباعة اليومية</span>
          </button>
        </div>
      </div>

      {/* Master Global Operations Toolbar when isGlobalEditMode is Active */}
      {isGlobalEditMode && (
        <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border-2 border-amber-400 shadow-xl space-y-3 animate-in slide-in-from-top-3 duration-200 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <Unlock className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-white">وضع التعديل والإضافة الشامل لجميع الأقسام مفعل الآن 🔓</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                    جميع الجداول مفتوحة
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  يمكنك الآن تعديل أو حذف أي حركة في أي جدول، أو إضافة عمليات جديدة لأي قسم بضغطة زر واحدة أدناه:
                </p>
              </div>
            </div>

            <button
              onClick={toggleGlobalEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all self-start sm:self-auto cursor-pointer"
              title="إنهاء وضع التعديل وقفل كشف اليومية"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>إنهاء وقفل التعديل</span>
            </button>
          </div>

          {/* Quick action buttons to add or perform operations in ANY section */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-300 ml-1">إضافة عمليات فورية في الجدول:</span>
            <button
              onClick={() => openNewInlineRow('sales')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-200" />
              <span>+ إضافة مبيعات</span>
            </button>

            <button
              onClick={() => openNewInlineRow('maintenance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-purple-200" />
              <span>+ إضافة صيانة</span>
            </button>

            <button
              onClick={() => openNewInlineRow('balance_hadi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-teal-200" />
              <span>+ مبيع الهادي (مياس)</span>
            </button>

            <button
              onClick={() => openNewInlineRow('balance_qimma')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-200" />
              <span>+ مبيع الرقم (فايز)</span>
            </button>

            <button
              onClick={() => openNewInlineRow('transfer_mohammed_mayas')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-600 text-white transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-200" />
              <span>+ حوالة الهادي (مياس)</span>
            </button>

            <button
              onClick={() => openNewInlineRow('transfer_faiez_abu_ali')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-700 hover:bg-indigo-600 text-white transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-200" />
              <span>+ حوالة الرقم (فايز)</span>
            </button>

            <button
              onClick={() => setIsBatchPurchaseModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-teal-400 hover:from-amber-300 hover:to-teal-300 text-slate-950 transition-all shadow-xs cursor-pointer ring-1 ring-amber-500"
              title="إدخال مشتريات لأي يوم وتحديد التاجر وسعر الشراء وسعر البيع مع ترحيل الخرج (كم رسلت له)"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-950" />
              <span>🛒 فاتورة مشتريات تاجر وترحيل الخرج ⚡</span>
            </button>

            {onOpenAIModal && (
              <button
                onClick={onOpenAIModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all shadow-xs cursor-pointer ring-1 ring-purple-400"
                title="المحاسب الذكي الصوتي والنصي: يحلل اختصاراتك (سماعة 500 ف400، بيت مصعب، مياس، واصل باقي...)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>🤖 المحاسب والمساعد الذكي ⚡</span>
              </button>
            )}

            <button
              onClick={() => openNewInlineRow('purchases')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-200" />
              <span>+ مشتريات وقطع</span>
            </button>

            <button
              onClick={() => openNewInlineRow('expenses', 'expense_shop')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-rose-200" />
              <span>+ خرج ومصاريف</span>
            </button>

            <button
              onClick={() => openNewInlineRow('expenses', 'withdrawal_mosaab')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>+ سحب أرباح/صرفة</span>
            </button>
          </div>
        </div>
      )}

      {/* Info notice about inline editing & item breakdown */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/80 rounded-2xl p-3 sm:p-4 text-xs flex items-center justify-between gap-3 text-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block sm:inline">
              ✨ ميزة الجداول التفصيلية والتعديل المباشر:
            </span>{' '}
            <span className="text-slate-600">
              اضغط على زر <strong className="text-blue-700">"تعديل ✏️"</strong> لإلغاء قفل السطر وتعديل اسم الصنف، سعر البيع، وسعر التكلفة مباشرة داخل الجدول دون فتح نوافذ، مع احتساب الربح تلقائياً فور كتابة الأرقام!
            </span>
          </div>
        </div>
      </div>

      {/* End-of-Day Unpriced Sold Items Warning & Quick Reconciliation Banner */}
      {unpricedSoldEntries.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 rounded-2xl shadow-lg border border-amber-300 flex flex-wrap items-center justify-between gap-3 animate-in fade-in no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Boxes className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm text-white">
                  تنبيه نهاية اليوم: منتجات تم بيعها اليوم ({unpricedSoldEntries.length}) بدون سعر تكلفة أو كمية بالمخزن!
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-950 text-amber-300">
                  بحاجة لتسعير وجرد
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                (مثل: {unpricedSoldEntries.slice(0, 3).map((e) => e.productName).join('، ')}
                {unpricedSoldEntries.length > 3 ? '...' : ''}) — انقر لتحديث سعر الشراء والبيع وكمية المخزن فوراً لحساب صافي الأرباح بدقة.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsReconcileModalOpen(true)}
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>تحديث بيانات المنتجات والمخزن الآن ⚡</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. قسم المبيعات والجوالات والإكسسوارات */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm">1. جدول المبيعات والجوالات والإكسسوارات</h3>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-md text-slate-300 font-mono">
              {salesTx.length} حركات
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTableUnlock('sales')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                isSectionUnlocked('sales')
                  ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="حالة القفل والتعديل"
            >
              {isSectionUnlocked('sales') ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-950" />
                  <span>مفتوح للتعديل 🔓</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>تعديل مباشر</span>
                </>
              )}
            </button>
            <button
              onClick={() => openNewInlineRow('sales')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'sales'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
              title="إضافة صنف إكسسوار أو جوال فارغ في الجدول مباشرة"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة مبيعات (في الجدول)</span>
            </button>
            <button
              onClick={() => onAddNewForSection('sale')}
              className="text-[11px] text-blue-600 hover:text-blue-800 underline decoration-dotted px-1 py-1"
              title="فتح نافذة الفاتورة التفصيلية الكاملة"
            >
              فاتورة
            </button>
          </div>
        </div>

        {salesTx.length === 0 && activeNewSection !== 'sales' ? (
          <div className="p-4 text-center text-xs text-slate-400">لا توجد مبيعات مسجلة لهذا اليوم.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] sm:min-w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-16">الوقت</th>
                  <th className="p-3">البيان / الصنف</th>
                  <th className="p-3 w-28">سعر البيع</th>
                  <th className="p-3 w-28">التكلفة (الضمار)</th>
                  <th className="p-3 w-28">الربح / الفائدة</th>
                  <th className="p-3 w-24">طريقة الدفع</th>
                  <th className="p-3 text-center w-36 no-print">إجراءات والتعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* NEW INLINE ROW FOR RAPID ENTRY WITHOUT MODAL */}
                {activeNewSection === 'sales' && (
                  <tr className="bg-emerald-50/90 border-2 border-emerald-500 shadow-sm animate-fadeIn">
                    <td className="p-2">
                      <input
                        type="text"
                        value={newRowData.time}
                        onChange={(e) => setNewRowData({ ...newRowData, time: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('new-row-sales-desc')?.focus();
                          }
                        }}
                        className="w-16 p-1.5 bg-white border border-emerald-300 rounded font-mono text-xs text-center focus:ring-2 focus:ring-emerald-500"
                        placeholder="الوقت"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        id="new-row-sales-desc"
                        type="text"
                        autoFocus
                        value={newRowData.description}
                        onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('new-row-sales-price')?.focus();
                          } else if (e.key === 'Escape') {
                            setActiveNewSection(null);
                          }
                        }}
                        className="w-full p-2 bg-white border-2 border-emerald-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="اسم الصنف / الإكسسوار (اضغط Enter للانتقال للسعر)..."
                      />
                      <input
                        type="text"
                        value={newRowData.notes}
                        onChange={(e) => setNewRowData({ ...newRowData, notes: e.target.value })}
                        className="w-full p-1 mt-1 bg-white/90 border border-slate-200 rounded text-[11px] text-slate-600"
                        placeholder="ملاحظات اختيارية..."
                      />
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <input
                          id="new-row-sales-price"
                          type="number"
                          value={newRowData.price}
                          onChange={(e) => setNewRowData({ ...newRowData, price: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              document.getElementById('new-row-sales-cost')?.focus();
                            } else if (e.key === 'Escape') {
                              setActiveNewSection(null);
                            }
                          }}
                          className="w-full p-2 bg-white border-2 border-emerald-400 rounded-lg text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-emerald-500"
                          placeholder="سعر البيع"
                        />
                        <span className="text-[10px] text-slate-400 absolute left-2 bottom-2">ر.ي</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <input
                          id="new-row-sales-cost"
                          type="number"
                          value={newRowData.cost}
                          onChange={(e) => setNewRowData({ ...newRowData, cost: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewRow(true);
                            } else if (e.key === 'Escape') {
                              setActiveNewSection(null);
                            }
                          }}
                          className="w-full p-2 bg-white border-2 border-emerald-400 rounded-lg text-xs font-mono text-slate-700 text-left focus:ring-2 focus:ring-emerald-500"
                          placeholder="التكلفة (ضمار)"
                        />
                        <span className="text-[10px] text-slate-400 absolute left-2 bottom-2">ر.ي</span>
                      </div>
                    </td>
                    <td className="p-2 font-bold font-mono text-emerald-700">
                      <div className="bg-emerald-100 text-emerald-900 px-2 py-2 rounded-lg border border-emerald-300 text-center font-bold">
                        +{formatNumber(Math.max(0, (Number(newRowData.price) || 0) - (Number(newRowData.cost) || 0)))}
                      </div>
                    </td>
                    <td className="p-2">
                      <select
                        value={newRowData.paymentMethod}
                        onChange={(e) => setNewRowData({ ...newRowData, paymentMethod: e.target.value as any })}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        <option value="cash">نقداً</option>
                        <option value="transfer">تحويل</option>
                        <option value="debt">آجل</option>
                      </select>
                    </td>
                    <td className="p-2 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSaveNewRow(true)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title="حفظ وإضافة سطر جديد (أو اضغط Enter في خانة التكلفة)"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حفظ (Enter)</span>
                        </button>
                        <button
                          onClick={() => setActiveNewSection(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="إلغاء الإضافة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {salesTx.map((tx) => {
                  const isEditing = editingTxId === tx.id || isSectionUnlocked('sales');
                  const isCompound = isCompoundDescription(tx.description);
                  const decomposed = isCompound ? decomposeTransaction(tx) : [];
                  const isExpanded = detailedViewMode || expandedCompoundMap[tx.id];

                  // If this row is in inline edit mode
                  if (isEditing && editingTxId === tx.id && editFormData) {
                    const dynamicProfit = Math.max(
                      0,
                      (Number(editFormData.price) || 0) - (Number(editFormData.cost) || 0)
                    );
                    return (
                      <tr key={tx.id} className="bg-amber-50/70 border-2 border-amber-400 transition-all">
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.time || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                            className="w-16 p-1 bg-white border border-amber-300 rounded font-mono text-xs text-center"
                            placeholder="الوقت"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="بيان الصنف أو العملية..."
                          />
                          <input
                            type="text"
                            value={editFormData.notes || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            className="w-full p-1 mt-1 bg-white/80 border border-slate-200 rounded text-[11px] text-slate-600"
                            placeholder="ملاحظات اختيارية..."
                          />
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <input
                              type="number"
                              value={editFormData.price}
                              onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                              className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="text-[10px] text-slate-400 absolute left-1 bottom-0.5">ر.ي</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <input
                              type="number"
                              value={editFormData.cost}
                              onChange={(e) => setEditFormData({ ...editFormData, cost: parseFloat(e.target.value) || 0 })}
                              className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono text-slate-700 text-left focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="text-[10px] text-slate-400 absolute left-1 bottom-0.5">ر.ي</span>
                          </div>
                        </td>
                        <td className="p-2 font-bold font-mono text-emerald-700">
                          <div className="bg-emerald-100 text-emerald-900 px-2 py-1.5 rounded-lg border border-emerald-300 text-center">
                            +{formatNumber(dynamicProfit)}
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            value={editFormData.paymentMethod || 'cash'}
                            onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value as any })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          >
                            <option value="cash">نقداً</option>
                            <option value="transfer">تحويل</option>
                            <option value="debt">آجل</option>
                          </select>
                        </td>
                        <td className="p-2 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={saveInlineEdit}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                              title="حفظ التعديلات فورياً في الجدول"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>حفظ</span>
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                              title="إلغاء التعديل"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Default display row
                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-3 text-slate-500 font-mono">{tx.time || '-'}</td>
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{tx.description}</span>
                            {tx.attachmentUrl && (
                              <span title="يوجد صورة توثيق" className="text-emerald-600">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {isCompound && (
                              <button
                                onClick={() => toggleExpandCompound(tx.id)}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 hover:bg-blue-200 cursor-pointer"
                                title="عرض تفاصيل الأصناف"
                              >
                                <span>مجمع ({decomposed.length} أصناف)</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                          {tx.notes && <div className="text-[10px] text-slate-400 mt-0.5">{tx.notes}</div>}
                        </td>
                        <td className="p-3 font-bold font-mono text-slate-900">{formatCurrency(tx.price)}</td>
                        <td className="p-3 font-mono text-slate-500">{formatCurrency(tx.cost)}</td>
                        <td className="p-3 font-bold font-mono text-emerald-600">
                          +{formatCurrency(tx.profit)}
                        </td>
                        <td className="p-3 text-slate-600">
                          {tx.paymentMethod === 'transfer' ? 'تحويل' : tx.paymentMethod === 'debt' ? 'آجل' : 'نقداً'}
                        </td>
                        <td className="p-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Unlock & edit inline button */}
                            <button
                              onClick={() => startInlineEdit(tx)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                                isSectionUnlocked('sales')
                                  ? 'text-amber-950 bg-amber-400 hover:bg-amber-300 shadow-xs ring-1 ring-amber-500'
                                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                              }`}
                              title="تعديل مباشر في الجدول"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>تعديل</span>
                            </button>

                            {/* Detailed modal edit button */}
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 border border-blue-200"
                              title="تعديل مفصل بنافذة السند"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            {/* Split compound items button */}
                            {isCompound && (
                              <button
                                onClick={() => handleSplitCompound(tx)}
                                className="p-1 rounded text-purple-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-200"
                                title="تفكيك إلى حركات وسطور مستقلة في الجدول نهائياً"
                              >
                                <Split className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete button */}
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Decomposed Items Sub-table when compound */}
                      {isCompound && isExpanded && (
                        <tr className="bg-blue-50/40 border-y border-blue-100">
                          <td colSpan={7} className="p-3 pr-8">
                            <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs space-y-2">
                              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2 font-bold text-blue-900">
                                  <Layers className="w-4 h-4 text-blue-600" />
                                  <span>تفصيل الأصناف والعمليات المستقلة لهذا البيان:</span>
                                </div>
                                <button
                                  onClick={() => handleSplitCompound(tx)}
                                  className="flex items-center gap-1 text-[11px] bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-2 py-1 rounded-lg transition-colors border border-purple-200"
                                >
                                  <Split className="w-3 h-3" />
                                  <span>تحويل نهائي لـ ({decomposed.length}) أسطر مستقلة بالجدول</span>
                                </button>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-right">
                                  <thead className="bg-slate-50 text-slate-500 text-[11px]">
                                    <tr>
                                      <th className="p-2">#</th>
                                      <th className="p-2">اسم الصنف المستقل</th>
                                      <th className="p-2">الكمية</th>
                                      <th className="p-2">سعر البيع</th>
                                      <th className="p-2">سعر الضمار (التكلفة)</th>
                                      <th className="p-2">صافي الربح</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {decomposed.map((item, idx) => (
                                      <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="p-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                        <td className="p-2 font-bold text-slate-800">{item.name}</td>
                                        <td className="p-2 font-mono text-slate-600">{item.quantity} حبة</td>
                                        <td className="p-2 font-bold font-mono text-slate-900">
                                          {formatCurrency(item.amount)}
                                        </td>
                                        <td className="p-2 font-mono text-amber-700">
                                          {formatCurrency(item.cost)}
                                        </td>
                                        <td className="p-2 font-bold font-mono text-emerald-600">
                                          +{formatCurrency(item.profit)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Quick add bottom row when section is unlocked */}
                {isSectionUnlocked('sales') && (
                  <tr className="bg-blue-50/50 border-t-2 border-blue-200 no-print">
                    <td colSpan={7} className="p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <span>قسم المبيعات مفتوح للتعديل والعمليات والإضافة السريعة 🔓</span>
                        </span>
                        <button
                          onClick={() => openNewInlineRow('sales')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>+ إضافة مبيعات جديدة في هذا الجدول</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. قسم الصيانة وحساب المهندس */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-purple-950 text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-purple-300" />
            <h3 className="font-bold text-sm">
              2. جدول الصيانة وحساب المهندس (الفايدة مناصفة 50% محل و 50% مهندس)
            </h3>
            <span className="text-xs bg-purple-900 px-2 py-0.5 rounded-md text-purple-200 font-mono">
              {maintTx.length} حركات
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTableUnlock('maintenance')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                isSectionUnlocked('maintenance')
                  ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-purple-900 text-purple-200 hover:bg-purple-800'
              }`}
              title="حالة القفل والتعديل"
            >
              {isSectionUnlocked('maintenance') ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-950" />
                  <span>مفتوح للتعديل 🔓</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>تعديل مباشر</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsPickupModalOpen(true)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all shadow-xs cursor-pointer"
              title="تسليم جهاز صيانة سابق واستلام المبلغ المتبقي (بز الجوال)"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-950" />
              <span>📦 تسليم جهاز واستلام الباقي (بز الجوال) ⚡</span>
            </button>
            <button
              onClick={() => openNewInlineRow('maintenance')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'maintenance'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
              title="إضافة حركة صيانة فارغة في الجدول مباشرة"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة صيانة (في الجدول)</span>
            </button>
            <button
              onClick={() => onAddNewForSection('maintenance')}
              className="text-[11px] text-purple-300 hover:text-white underline decoration-dotted px-1 py-1"
              title="فتح نافذة الفاتورة التفصيلية"
            >
              فاتورة
            </button>
          </div>
        </div>

        {maintTx.length === 0 && activeNewSection !== 'maintenance' ? (
          <div className="p-4 text-center text-xs text-slate-400">لا توجد حركات صيانة مسجلة لهذا اليوم.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] sm:min-w-full text-xs text-right">
              <thead className="bg-purple-50/60 text-purple-900 border-b border-purple-100">
                <tr>
                  <th className="p-3 w-16">الوقت</th>
                  <th className="p-3">بيان الصيانة والجهاز</th>
                  <th className="p-3 w-32">المورد (القطع)</th>
                  <th className="p-3 w-28">المقبوض</th>
                  <th className="p-3 w-28">تكلفة القطع</th>
                  <th className="p-3 w-28">فايدة المحل (50%)</th>
                  <th className="p-3 w-28">فايدة المهندس (50%)</th>
                  <th className="p-3 text-center w-36 no-print">إجراءات والتعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* NEW INLINE ROW FOR MAINTENANCE */}
                {activeNewSection === 'maintenance' && (
                  <tr className="bg-purple-50/90 border-2 border-purple-500 shadow-sm animate-fadeIn">
                    <td className="p-2">
                      <input
                        type="text"
                        value={newRowData.time}
                        onChange={(e) => setNewRowData({ ...newRowData, time: e.target.value })}
                        className="w-16 p-1.5 bg-white border border-purple-300 rounded font-mono text-xs text-center focus:ring-2 focus:ring-purple-500"
                        placeholder="الوقت"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        id="new-row-maint-desc"
                        type="text"
                        autoFocus
                        value={newRowData.description}
                        onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('new-row-maint-price')?.focus();
                          } else if (e.key === 'Escape') {
                            setActiveNewSection(null);
                          }
                        }}
                        className="w-full p-2 bg-white border-2 border-purple-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="بيان الصيانة ونوع الجهاز (اضغط Enter للمبلغ)..."
                      />
                    </td>
                    <td className="p-2">
                      <input
                        id="new-row-maint-supplier"
                        type="text"
                        value={newRowData.supplierName}
                        onChange={(e) => setNewRowData({ ...newRowData, supplierName: e.target.value })}
                        className="w-full p-1.5 bg-white border border-purple-300 rounded-lg text-xs text-slate-800"
                        placeholder="مورد القطعة (العبصري...)"
                      />
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <div className="relative">
                          <input
                            id="new-row-maint-price"
                            type="number"
                            value={newRowData.price}
                            onChange={(e) => {
                              const p = e.target.value;
                              const agreed = Number(newRowData.agreedAmount) || 0;
                              const rem = agreed > Number(p) ? (agreed - Number(p)).toString() : '';
                              setNewRowData({ ...newRowData, price: p, remainingAmount: rem });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                document.getElementById('new-row-maint-cost')?.focus();
                              } else if (e.key === 'Escape') {
                                setActiveNewSection(null);
                              }
                            }}
                            className="w-full p-1.5 bg-white border-2 border-purple-400 rounded-lg text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-purple-500"
                            placeholder="الواصل اليوم"
                            title="المبلغ المستلم كواصل اليوم (يدخل الصندوق)"
                          />
                          <span className="text-[9px] text-slate-400 absolute left-1.5 bottom-1.5">ر.ي</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            id="new-row-maint-agreed"
                            type="number"
                            value={newRowData.agreedAmount}
                            onChange={(e) => {
                              const agr = e.target.value;
                              const p = Number(newRowData.price) || 0;
                              const rem = Number(agr) > p ? (Number(agr) - p).toString() : '';
                              setNewRowData({ ...newRowData, agreedAmount: agr, remainingAmount: rem });
                            }}
                            className="w-1/2 p-1 bg-purple-50/80 border border-purple-300 rounded text-[10px] font-mono text-slate-800"
                            placeholder="الاتفاق"
                            title="إجمالي الاتفاق مع الزبون"
                          />
                          <input
                            type="number"
                            value={newRowData.remainingAmount}
                            onChange={(e) => setNewRowData({ ...newRowData, remainingAmount: e.target.value })}
                            className="w-1/2 p-1 bg-amber-50 border border-amber-300 rounded text-[10px] font-mono text-rose-700 font-bold"
                            placeholder="باقي"
                            title="المتبقي آجل على الزبون"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <input
                          id="new-row-maint-cost"
                          type="number"
                          value={newRowData.cost}
                          onChange={(e) => setNewRowData({ ...newRowData, cost: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewRow(true);
                            } else if (e.key === 'Escape') {
                              setActiveNewSection(null);
                            }
                          }}
                          className="w-full p-2 bg-white border-2 border-purple-400 rounded-lg text-xs font-mono text-slate-700 text-left focus:ring-2 focus:ring-purple-500"
                          placeholder="تكلفة القطع"
                        />
                        <span className="text-[10px] text-slate-400 absolute left-2 bottom-2">ر.ي</span>
                      </div>
                    </td>
                    <td className="p-2 font-bold font-mono text-purple-900 text-center">
                      <div className="bg-purple-100 px-2 py-2 rounded-lg border border-purple-300">
                        {formatNumber(Math.max(0, (Number(newRowData.price) || 0) - (Number(newRowData.cost) || 0)) / 2)}
                      </div>
                    </td>
                    <td className="p-2 font-bold font-mono text-blue-900 text-center">
                      <div className="bg-blue-100 px-2 py-2 rounded-lg border border-blue-300">
                        {formatNumber(Math.max(0, (Number(newRowData.price) || 0) - (Number(newRowData.cost) || 0)) / 2)}
                      </div>
                    </td>
                    <td className="p-2 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSaveNewRow(true)}
                          className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title="حفظ وإضافة سطر جديد (أو اضغط Enter في خانة تكلفة القطع)"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حفظ (Enter)</span>
                        </button>
                        <button
                          onClick={() => setActiveNewSection(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="إلغاء الإضافة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {maintTx.map((tx) => {
                  const isEditing = editingTxId === tx.id || isSectionUnlocked('maintenance');
                  const isCompound = isCompoundDescription(tx.description);
                  const decomposed = isCompound ? decomposeTransaction(tx) : [];
                  const isExpanded = detailedViewMode || expandedCompoundMap[tx.id];

                  if (isEditing && editingTxId === tx.id && editFormData) {
                    const priceNum = Number(editFormData.price) || 0;
                    const costNum = Number(editFormData.cost) || 0;
                    const netProfit = Math.max(0, priceNum - costNum);
                    const half = netProfit / 2;

                    return (
                      <tr key={tx.id} className="bg-amber-50/70 border-2 border-amber-400 transition-all">
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.time || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                            className="w-16 p-1 bg-white border border-amber-300 rounded font-mono text-xs text-center"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900"
                            placeholder="عطل الجهاز والقطع..."
                          />
                          <input
                            type="text"
                            value={editFormData.notes || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            className="w-full p-1 mt-1 bg-white/80 border border-slate-200 rounded text-[11px] text-slate-600"
                            placeholder="ملاحظات..."
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.supplierName || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, supplierName: e.target.value })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            placeholder="المورد (العبصري/القاسمي...)"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editFormData.price}
                            onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editFormData.cost}
                            onChange={(e) => setEditFormData({ ...editFormData, cost: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono text-slate-700"
                          />
                        </td>
                        <td className="p-2 font-bold font-mono text-purple-700 text-center">
                          +{formatNumber(half)}
                        </td>
                        <td className="p-2 font-bold font-mono text-indigo-700 text-center">
                          +{formatNumber(half)}
                        </td>
                        <td className="p-2 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={saveInlineEdit}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>حفظ</span>
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const net = Math.max(0, tx.price - tx.cost);
                  const half = net / 2;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-purple-50/30 transition-colors">
                        <td className="p-3 text-slate-500 font-mono">{tx.time || '-'}</td>
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{tx.description}</span>
                            {isCompound && (
                              <button
                                onClick={() => toggleExpandCompound(tx.id)}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 hover:bg-purple-200 cursor-pointer"
                              >
                                <span>مجمع ({decomposed.length} قطع)</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                          {/* Maintenance agreement / remaining balance tags */}
                          {Boolean((tx.remainingAmount && tx.remainingAmount > 0) || (tx.agreedAmount && tx.agreedAmount > (tx.price || 0))) && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                <span>الاتفاق: {(tx.agreedAmount || ((tx.price || 0) + (tx.remainingAmount || 0))).toLocaleString()} ر.ي</span>
                                <span className="text-slate-400">|</span>
                                <span className="text-emerald-700">واصل: {(tx.price || 0).toLocaleString()}</span>
                                <span className="text-slate-400">|</span>
                                <span className="text-rose-700">باقي: {(tx.remainingAmount || 0).toLocaleString()} ر.ي</span>
                              </span>
                              {tx.maintenanceStatus !== 'delivered' && (
                                <button
                                  onClick={() => setIsPickupModalOpen(true)}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                                  title="تسليم الجهاز واستلام باقي المبلغ اليوم"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>بز الجوال وسدد الباقي ⚡</span>
                                </button>
                              )}
                            </div>
                          )}
                          {tx.maintenanceStatus === 'delivered' && (
                            <div className="mt-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>تم تسليم الجهاز (مبزوز) والقبض بالكامل</span>
                              </span>
                            </div>
                          )}
                          {tx.notes && <div className="text-[10px] text-slate-400 mt-0.5">{tx.notes}</div>}
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{tx.supplierName || 'من المحل'}</td>
                        <td className="p-3 font-bold font-mono text-slate-900">{formatCurrency(tx.price)}</td>
                        <td className="p-3 font-mono text-slate-500">{formatCurrency(tx.cost)}</td>
                        <td className="p-3 font-bold font-mono text-purple-700">{formatCurrency(half)}</td>
                        <td className="p-3 font-bold font-mono text-indigo-700">{formatCurrency(half)}</td>
                        <td className="p-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => startInlineEdit(tx)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                                isSectionUnlocked('maintenance')
                                  ? 'text-amber-950 bg-amber-400 hover:bg-amber-300 shadow-xs ring-1 ring-amber-500'
                                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                              }`}
                              title="تعديل مباشر في الجدول"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>تعديل</span>
                            </button>
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 rounded text-purple-600 hover:bg-purple-50 border border-purple-200"
                              title="تعديل مفصل بنموذج الصيانة"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            {isCompound && (
                              <button
                                onClick={() => handleSplitCompound(tx)}
                                className="p-1 rounded text-purple-600 hover:bg-purple-50 border border-purple-200"
                                title="تفكيك إلى حركات مستقلة"
                              >
                                <Split className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Decomposed sub-rows */}
                      {isCompound && isExpanded && (
                        <tr className="bg-purple-50/40 border-y border-purple-100">
                          <td colSpan={8} className="p-3 pr-8">
                            <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-xs space-y-2">
                              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2 font-bold text-purple-900">
                                  <Layers className="w-4 h-4 text-purple-600" />
                                  <span>تفصيل قطع الصيانة والعمليات:</span>
                                </div>
                                <button
                                  onClick={() => handleSplitCompound(tx)}
                                  className="flex items-center gap-1 text-[11px] bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-2 py-1 rounded-lg border border-purple-200"
                                >
                                  <Split className="w-3 h-3" />
                                  <span>تحويل لـ ({decomposed.length}) سطور مستقلة</span>
                                </button>
                              </div>

                              <table className="w-full text-xs text-right">
                                <thead className="bg-slate-50 text-slate-500 text-[11px]">
                                  <tr>
                                    <th className="p-2">#</th>
                                    <th className="p-2">القطعة / العطل</th>
                                    <th className="p-2">المقبوض</th>
                                    <th className="p-2">التكلفة (الضمار)</th>
                                    <th className="p-2">حصة المحل 50%</th>
                                    <th className="p-2">حصة المهندس 50%</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {decomposed.map((item, idx) => {
                                    const itemNet = Math.max(0, item.amount - item.cost);
                                    const itemHalf = itemNet / 2;
                                    return (
                                      <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                                        <td className="p-2 font-bold text-slate-800">{item.name}</td>
                                        <td className="p-2 font-bold font-mono text-slate-900">{formatCurrency(item.amount)}</td>
                                        <td className="p-2 font-mono text-purple-700">{formatCurrency(item.cost)}</td>
                                        <td className="p-2 font-mono font-bold text-purple-600">+{formatCurrency(itemHalf)}</td>
                                        <td className="p-2 font-mono font-bold text-indigo-600">+{formatCurrency(itemHalf)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Quick add bottom row when section is unlocked */}
                {isSectionUnlocked('maintenance') && (
                  <tr className="bg-purple-50/50 border-t-2 border-purple-200 no-print">
                    <td colSpan={8} className="p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span>قسم الصيانة مفتوح للتعديل والعمليات والإضافة السريعة 🔓</span>
                        </span>
                        <button
                          onClick={() => openNewInlineRow('maintenance')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>+ إضافة حركة صيانة جديدة في هذا الجدول</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. قسم الرصيد المدمج: تطبيق الهادي (محمد مياس) & تطبيق الرقم (فايز أبو علي) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-teal-950 text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Signal className="w-4 h-4 text-teal-300" />
            <h3 className="font-bold text-sm">
              3. قسم الرصيد المدمج: تطبيق الهادي (محمد مياس) وتطبيق الرقم (فايز أبو علي)
            </h3>
            <span className="text-[11px] bg-teal-900/80 px-2 py-0.5 rounded-md text-teal-200 font-mono">
              {mergedBalanceTx.length} حركة مدمجة
            </span>
            <span className="text-[11px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-md font-mono">
              مبيعات: {balanceSalesTx.length}
            </span>
            <span className="text-[11px] bg-sky-900/80 text-sky-200 px-2 py-0.5 rounded-md font-mono">
              حوالات وصرفات: {balanceOutflowsTx.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => toggleTableUnlock('balance')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                isSectionUnlocked('balance')
                  ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-teal-900 text-teal-200 hover:bg-teal-800'
              }`}
            >
              {isSectionUnlocked('balance') ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-950" />
                  <span>مفتوح للتعديل 🔓</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>تعديل مباشر</span>
                </>
              )}
            </button>
            <button
              onClick={() => openNewInlineRow('balance_hadi')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'balance_hadi'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-teal-700 hover:bg-teal-600 text-white'
              }`}
              title="إضافة مبيع رصيد لتطبيق الهادي (محمد مياس)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ مبيع الهادي</span>
            </button>
            <button
              onClick={() => openNewInlineRow('balance_qimma')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'balance_qimma'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-cyan-700 hover:bg-cyan-600 text-white'
              }`}
              title="إضافة مبيع رصيد لتطبيق الرقم (فايز أبو علي)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ مبيع الرقم</span>
            </button>
            <button
              onClick={() => openNewInlineRow('transfer_mohammed_mayas')}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'transfer_mohammed_mayas'
                  ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                  : 'bg-sky-800 hover:bg-sky-700 text-sky-100'
              }`}
              title="إضافة حوالة / سداد مورد تطبيق الهادي (محمد مياس)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ حوالة الهادي (مياس)</span>
            </button>
            <button
              onClick={() => openNewInlineRow('transfer_faiez_abu_ali')}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'transfer_faiez_abu_ali'
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                  : 'bg-indigo-800 hover:bg-indigo-700 text-indigo-100'
              }`}
              title="إضافة حوالة / سداد مورد تطبيق الرقم (فايز أبو علي)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ حوالة الرقم (فايز)</span>
            </button>
            <button
              onClick={() => openNewInlineRow('expense_internet_shop')}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'expense_internet_shop'
                  ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                  : 'bg-amber-800/80 hover:bg-amber-700 text-amber-100'
              }`}
              title="إضافة صرفة رصيد إنترنت ومودم المحل"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ صرفة نت المحل</span>
            </button>
          </div>
        </div>

        {/* Section 3 Control Bar: Sub-filters & Quick Metrics */}
        <div className="bg-teal-50/70 border-b border-teal-100 p-3 flex flex-wrap items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-teal-950 ml-1">عرض:</span>
            <button
              onClick={() => setBalanceFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                balanceFilterTab === 'all'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100'
              }`}
            >
              الكل المدمج ({mergedBalanceTx.length})
            </button>
            <button
              onClick={() => setBalanceFilterTab('sales')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                balanceFilterTab === 'sales'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              مبيعات الرصيد فقط ({balanceSalesTx.length})
            </button>
            <button
              onClick={() => setBalanceFilterTab('outflows')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                balanceFilterTab === 'outflows'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-50'
              }`}
            >
              حوالات وصرفات وتغذية ({balanceOutflowsTx.length})
            </button>
            <button
              onClick={() => setBalanceFilterTab('hadi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                balanceFilterTab === 'hadi'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white text-teal-800 border border-teal-200 hover:bg-teal-50'
              }`}
            >
              تطبيق الهادي (محمد مياس)
            </button>
            <button
              onClick={() => setBalanceFilterTab('raqam')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                balanceFilterTab === 'raqam'
                  ? 'bg-cyan-800 text-white shadow-xs'
                  : 'bg-white text-cyan-800 border border-cyan-200 hover:bg-cyan-50'
              }`}
            >
              تطبيق الرقم (فايز أبو علي)
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs font-mono">
              <span className="text-slate-500 text-[10px] ml-1">مبيعات:</span>
              <span className="font-bold text-slate-800">{formatCurrency(totalRechargeSales)}</span>
            </div>
            <div className="bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs font-mono">
              <span className="text-slate-500 text-[10px] ml-1">التكلفة:</span>
              <span className="font-semibold text-slate-600">{formatCurrency(totalRechargeCost)}</span>
            </div>
            <div className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs font-mono">
              <span className="text-emerald-700 text-[10px] ml-1 font-bold">ربح المبيعات:</span>
              <span className="font-bold text-emerald-700">+{formatCurrency(totalRechargeProfit)}</span>
            </div>
            <div className="bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-300 shadow-2xs font-mono">
              <span className="text-sky-700 text-[10px] ml-1 font-bold">حوالات وصرفات:</span>
              <span className="font-bold text-sky-700">-{formatCurrency(totalRechargeOutflows)}</span>
            </div>
            <div className="bg-teal-900 text-white px-3 py-1 rounded-lg shadow-2xs font-mono font-bold">
              <span className="text-teal-200 text-[10px] ml-1">صافي الحركة:</span>
              <span>{formatCurrency(netRechargeCashFlow)}</span>
            </div>
          </div>
        </div>

        {displayedMergedBalanceTx.length === 0 &&
        activeNewSection !== 'balance_hadi' &&
        activeNewSection !== 'balance_qimma' &&
        activeNewSection !== 'transfer_mohammed_mayas' &&
        activeNewSection !== 'transfer_faiez_abu_ali' &&
        activeNewSection !== 'expense_internet_shop' ? (
          <div className="p-6 text-center text-xs text-slate-400">
            لا توجد حركات مطابقة في قسم الرصيد لهذا اليوم. يمكنك إضافة مبيع أو حوالة عبر الأزرار بالأعلى ⚡
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] sm:min-w-full text-xs text-right">
              <thead className="bg-teal-50/80 text-teal-950 border-b border-teal-100 font-bold">
                <tr>
                  <th className="p-3 w-52">التطبيق / نوع العملية</th>
                  <th className="p-3">البيان ووقت الحركة</th>
                  <th className="p-3 w-32">المبلغ (المباع/المصروف)</th>
                  <th className="p-3 w-32">التكلفة / السداد</th>
                  <th className="p-3 w-36 text-center">الأثر المحاسبي / الفائدة</th>
                  <th className="p-3 w-28">طريقة الدفع</th>
                  <th className="p-3 text-center w-36 no-print">إجراءات والتعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* NEW INLINE ROW FOR MERGED BALANCE */}
                {(activeNewSection === 'balance_hadi' ||
                  activeNewSection === 'balance_qimma' ||
                  activeNewSection === 'transfer_mohammed_mayas' ||
                  activeNewSection === 'transfer_faiez_abu_ali' ||
                  activeNewSection === 'expense_internet_shop') && (
                  <tr className="bg-teal-50/95 border-2 border-teal-500 shadow-sm animate-fadeIn">
                    <td className="p-2">
                      <select
                        value={activeNewSection}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setActiveNewSection(val);
                          setNewRowData((prev) => ({
                            ...prev,
                            balanceNetwork: val,
                            supplierName:
                              val === 'transfer_mohammed_mayas' || val === 'balance_hadi'
                                ? 'محمد مياس (تطبيق الهادي)'
                                : val === 'transfer_faiez_abu_ali' || val === 'balance_qimma'
                                ? 'فايز أبو علي (تطبيق الرقم)'
                                : '',
                          }));
                        }}
                        className="w-full p-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-950"
                      >
                        <option value="balance_hadi">مبيع رصيد - تطبيق الهادي (محمد مياس)</option>
                        <option value="balance_qimma">مبيع رصيد - تطبيق الرقم (فايز أبو علي)</option>
                        <option value="transfer_mohammed_mayas">حوالة / سداد - تطبيق الهادي (محمد مياس)</option>
                        <option value="transfer_faiez_abu_ali">حوالة / سداد - تطبيق الرقم (فايز أبو علي)</option>
                        <option value="expense_internet_shop">صرفة رصيد إنترنت ومودم المحل</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        id="new-row-balance-desc"
                        type="text"
                        autoFocus
                        value={newRowData.description}
                        onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('new-row-balance-price')?.focus();
                          } else if (e.key === 'Escape') {
                            setActiveNewSection(null);
                          }
                        }}
                        className="w-full p-2 bg-white border-2 border-teal-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder={
                          activeNewSection.startsWith('transfer_')
                            ? 'بيان الحوالة والسداد ورقم الإشعار (Enter للمبلغ)...'
                            : activeNewSection === 'expense_internet_shop'
                            ? 'بيان صرفة النت أو باقة المودم (Enter للمبلغ)...'
                            : 'بيان الرصيد أو رقم الهاتف والعميل (Enter للمبلغ)...'
                        }
                      />
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <input
                          id="new-row-balance-price"
                          type="number"
                          value={newRowData.price}
                          onChange={(e) => setNewRowData({ ...newRowData, price: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (
                                activeNewSection.startsWith('transfer_') ||
                                activeNewSection === 'expense_internet_shop'
                              ) {
                                handleSaveNewRow(true);
                              } else {
                                document.getElementById('new-row-balance-cost')?.focus();
                              }
                            } else if (e.key === 'Escape') {
                              setActiveNewSection(null);
                            }
                          }}
                          className="w-full p-2 bg-white border-2 border-teal-400 rounded-lg text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-teal-500"
                          placeholder={
                            activeNewSection.startsWith('transfer_') || activeNewSection === 'expense_internet_shop'
                              ? 'المبلغ المصروف'
                              : 'المبلغ المباع'
                          }
                        />
                        <span className="text-[10px] text-slate-400 absolute left-2 bottom-2">ر.ي</span>
                      </div>
                    </td>
                    <td className="p-2">
                      {activeNewSection.startsWith('transfer_') || activeNewSection === 'expense_internet_shop' ? (
                        <div className="bg-slate-100 p-2 rounded-lg text-center text-slate-500 text-[11px] font-mono">
                          {newRowData.price ? `${formatNumber(Number(newRowData.price) || 0)} ر.ي` : 'سداد حساب المورد'}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            id="new-row-balance-cost"
                            type="number"
                            value={newRowData.cost}
                            onChange={(e) => setNewRowData({ ...newRowData, cost: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveNewRow(true);
                              } else if (e.key === 'Escape') {
                                setActiveNewSection(null);
                              }
                            }}
                            className="w-full p-2 bg-white border-2 border-teal-400 rounded-lg text-xs font-mono text-slate-700 text-left focus:ring-2 focus:ring-teal-500"
                            placeholder="التكلفة (رأس المال)"
                          />
                          <span className="text-[10px] text-slate-400 absolute left-2 bottom-2">ر.ي</span>
                        </div>
                      )}
                    </td>
                    <td className="p-2 font-bold font-mono text-center">
                      {activeNewSection.startsWith('transfer_') || activeNewSection === 'expense_internet_shop' ? (
                        <div className="bg-rose-100 text-rose-800 px-2 py-2 rounded-lg border border-rose-200 text-xs">
                          -{formatNumber(Number(newRowData.price) || 0)} (خرج نقدي)
                        </div>
                      ) : (
                        <div className="bg-teal-100 text-teal-800 px-2 py-2 rounded-lg border border-teal-300 text-xs">
                          +{formatNumber(Math.max(0, (Number(newRowData.price) || 0) - (Number(newRowData.cost) || 0)))}
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <select
                        value={newRowData.paymentMethod}
                        onChange={(e) => setNewRowData({ ...newRowData, paymentMethod: e.target.value as any })}
                        className="w-full p-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-slate-800"
                      >
                        <option value="cash">نقداً</option>
                        <option value="transfer">حوالة بنكية</option>
                        <option value="debt">آجل</option>
                      </select>
                    </td>
                    <td className="p-2 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSaveNewRow(true)}
                          className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title="حفظ وإضافة سطر جديد (أو اضغط Enter)"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حفظ (Enter)</span>
                        </button>
                        <button
                          onClick={() => setActiveNewSection(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="إلغاء الإضافة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* DISPLAY MERGED ROWS */}
                {displayedMergedBalanceTx.map((tx) => {
                  const isEditing = editingTxId === tx.id || isSectionUnlocked('balance');
                  const isOutflow = isBalanceOutflow(tx);

                  // Inline Edit Row
                  if (isEditing && editingTxId === tx.id && editFormData) {
                    const priceNum = Number(editFormData.price) || 0;
                    const costNum = Number(editFormData.cost) || 0;
                    const profitNum = isOutflow ? 0 : Math.max(0, priceNum - costNum);

                    return (
                      <tr key={tx.id} className="bg-amber-50/70 border-2 border-amber-400 transition-all">
                        <td className="p-2 font-bold text-teal-900">
                          {tx.type === 'balance_hadi'
                            ? 'تطبيق الهادي (محمد مياس)'
                            : tx.type === 'balance_qimma'
                            ? 'تطبيق الرقم (فايز أبو علي)'
                            : tx.type === 'transfer_mohammed_mayas'
                            ? 'حوالة الهادي (محمد مياس)'
                            : tx.type === 'transfer_faiez_abu_ali'
                            ? 'حوالة الرقم (فايز أبو علي)'
                            : tx.type === 'expense_internet_shop'
                            ? 'صرفة نت ومودم المحل'
                            : 'حركة رصيد'}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editFormData.price}
                            onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editFormData.cost}
                            onChange={(e) => setEditFormData({ ...editFormData, cost: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 font-bold font-mono text-center">
                          {isOutflow ? (
                            <span className="text-rose-600">-{formatNumber(priceNum)} (سداد/صرفة)</span>
                          ) : (
                            <span className="text-emerald-600">+{formatNumber(profitNum)}</span>
                          )}
                        </td>
                        <td className="p-2 text-center text-slate-500 text-xs">
                          {tx.paymentMethod === 'transfer' ? 'حوالة' : tx.paymentMethod === 'debt' ? 'آجل' : 'نقداً'}
                        </td>
                        <td className="p-2 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={saveInlineEdit}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>حفظ</span>
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Normal Row
                  return (
                    <tr key={tx.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="p-3">
                        {tx.type === 'balance_hadi' ? (
                          <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            <Signal className="w-3 h-3 text-teal-600" />
                            <span>مبيع - تطبيق الهادي (محمد مياس)</span>
                          </span>
                        ) : tx.type === 'balance_qimma' ? (
                          <span className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            <Signal className="w-3 h-3 text-cyan-600" />
                            <span>مبيع - تطبيق الرقم (فايز أبو علي)</span>
                          </span>
                        ) : tx.type === 'transfer_mohammed_mayas' ? (
                          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            <Truck className="w-3 h-3 text-sky-600" />
                            <span>حوالة / سداد - تطبيق الهادي (محمد مياس)</span>
                          </span>
                        ) : tx.type === 'transfer_faiez_abu_ali' ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            <Truck className="w-3 h-3 text-indigo-600" />
                            <span>حوالة / سداد - تطبيق الرقم (فايز أبو علي)</span>
                          </span>
                        ) : tx.type === 'expense_internet_shop' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            <Signal className="w-3 h-3 text-amber-600" />
                            <span>صرفة رصيد نت ومودم المحل</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            <span>صرفة رصيد وتغذية</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{tx.description}</span>
                          {tx.time && (
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              {tx.time}
                            </span>
                          )}
                        </div>
                        {tx.notes && <div className="text-[10px] text-slate-500 mt-0.5">{tx.notes}</div>}
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-900">
                        {isOutflow ? (
                          <span className="text-slate-400">--</span>
                        ) : (
                          formatCurrency(tx.price)
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {isOutflow ? (
                          <span className="font-bold text-rose-700">{formatCurrency(tx.price || tx.cost)}</span>
                        ) : (
                          formatCurrency(tx.cost)
                        )}
                      </td>
                      <td className="p-3 font-bold font-mono text-center">
                        {isOutflow ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 text-xs">
                            -{formatCurrency(tx.price || tx.cost)} (سداد)
                          </span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 text-xs">
                            +{formatCurrency(tx.profit)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 text-xs font-semibold">
                        {tx.paymentMethod === 'transfer' ? (
                          <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">حوالة</span>
                        ) : tx.paymentMethod === 'debt' ? (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">آجل</span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">نقداً</span>
                        )}
                      </td>
                      <td className="p-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startInlineEdit(tx)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                              isSectionUnlocked('balance')
                                ? 'text-amber-950 bg-amber-400 hover:bg-amber-300 shadow-xs ring-1 ring-amber-500'
                                : 'text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200'
                            }`}
                            title="تعديل مباشر في الجدول"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 rounded text-teal-600 hover:bg-teal-50 border border-teal-200 cursor-pointer"
                            title="تعديل مفصل بالنافذة"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="حذف الحركة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Quick add bottom row when section is unlocked */}
                {isSectionUnlocked('balance') && (
                  <tr className="bg-teal-50/50 border-t-2 border-teal-200 no-print">
                    <td colSpan={7} className="p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-teal-600" />
                          <span>قسم الرصيد المدمج مفتوح للتعديل والعمليات والإضافة السريعة 🔓</span>
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => openNewInlineRow('balance_hadi')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>+ مبيع الهادي (مياس)</span>
                          </button>
                          <button
                            onClick={() => openNewInlineRow('balance_qimma')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>+ مبيع الرقم (فايز)</span>
                          </button>
                          <button
                            onClick={() => openNewInlineRow('transfer_mohammed_mayas')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>+ حوالة الهادي (مياس)</span>
                          </button>
                          <button
                            onClick={() => openNewInlineRow('transfer_faiez_abu_ali')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>+ حوالة الرقم (فايز)</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. المشتريات والقطع (العبصري / القاسمي / خليل) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-amber-950 text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-300" />
            <h3 className="font-bold text-sm">
              4. المشتريات والقطع (العبصري / القاسمي عمر / خليل الأغبري)
            </h3>
            <span className="text-xs bg-amber-900 px-2 py-0.5 rounded-md text-amber-200 font-mono">
              {purchTx.length} فواتير
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTableUnlock('purchases')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                isSectionUnlocked('purchases')
                  ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-amber-900 text-amber-200 hover:bg-amber-800'
              }`}
            >
              {isSectionUnlocked('purchases') ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-950" />
                  <span>مفتوح للتعديل 🔓</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>تعديل مباشر</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsBatchPurchaseModalOpen(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg transition-all shadow-xs cursor-pointer"
              title="فاتورة مجمعة لعدة منتجات مع تحديد وجهتها (صيانة، خرج صيانة، بضاعة محل، رصيد) وحساب المسدد والمتبقي للتاجر"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-950" />
              <span>🛒 فاتورة مجمعة من تاجر (متعددة الأصناف) ⚡</span>
            </button>
            <button
              onClick={() => openNewInlineRow('purchases', undefined, 'سداد دفعة للمخزن / المورد')}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg transition-all shadow-xs cursor-pointer"
              title="دفع وسداد دفعة نقدية جديدة للمخزن أو المورد مباشرة"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-slate-950" />
              <span>💵 ادفع من جديد للمخزن / المورد ⚡</span>
            </button>
            <button
              onClick={() => openNewInlineRow('purchases')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'purchases'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
              title="إضافة مشتريات أو فاتورة مورد في الجدول مباشرة"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة مشتريات (في الجدول)</span>
            </button>
            <button
              onClick={() => onAddNewForSection('purchase')}
              className="text-[11px] text-amber-300 hover:text-white underline decoration-dotted px-1 py-1"
              title="فتح نافذة الفاتورة التفصيلية"
            >
              فاتورة
            </button>
          </div>
        </div>

        {purchTx.length === 0 && activeNewSection !== 'purchases' ? (
          <div className="p-4 text-center text-xs text-slate-400">لا توجد مشتريات مسجلة لهذا اليوم.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] sm:min-w-full text-xs text-right">
              <thead className="bg-amber-50/70 text-amber-950 border-b border-amber-200">
                <tr>
                  <th className="p-3 w-48">اسم التاجر / المورد</th>
                  <th className="p-3">ايش المشتريات (بيان القطع)</th>
                  <th className="p-3 w-36">المبلغ المحول / المدفوع</th>
                  <th className="p-3 w-32">كم باقي له (آجل)</th>
                  <th className="p-3 w-32">إجمالي الفاتورة</th>
                  <th className="p-3">ملاحظات ورقم الحوالة</th>
                  <th className="p-3 text-center w-36 no-print">إجراءات والتعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* NEW INLINE ROW FOR PURCHASES */}
                {activeNewSection === 'purchases' && (
                  <tr className="bg-amber-50/95 border-2 border-amber-500 shadow-md animate-fadeIn">
                    <td className="p-2 space-y-1.5">
                      <select
                        value={newRowData.isCustomSupplier ? '__custom__' : newRowData.supplierName}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setNewRowData({ ...newRowData, isCustomSupplier: true });
                          } else {
                            setNewRowData({
                              ...newRowData,
                              isCustomSupplier: false,
                              supplierName: e.target.value,
                            });
                          }
                        }}
                        className="w-full p-2 bg-white border-2 border-amber-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        {allKnownSuppliers.map((sup) => (
                          <option key={sup} value={sup}>
                            🏢 {sup}
                          </option>
                        ))}
                        <option value="__custom__">➕ إضافة تاجر جديد يدوي...</option>
                      </select>
                      {newRowData.isCustomSupplier && (
                        <input
                          type="text"
                          value={newRowData.customSupplierName}
                          onChange={(e) => setNewRowData({ ...newRowData, customSupplierName: e.target.value })}
                          placeholder="اكتب اسم التاجر الجديد..."
                          className="w-full p-1.5 bg-amber-100/60 border border-amber-400 rounded-lg text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white"
                        />
                      )}
                    </td>
                    <td className="p-2 space-y-1">
                      <input
                        id="new-row-purch-desc"
                        type="text"
                        autoFocus
                        value={newRowData.description}
                        onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('new-row-purch-paid')?.focus();
                          } else if (e.key === 'Escape') {
                            setActiveNewSection(null);
                          }
                        }}
                        className="w-full p-2 bg-white border-2 border-amber-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="ايش المشتريات (شاشات، بطاريات، قطع...)"
                      />
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-amber-900 font-bold">الجهة:</span>
                        <select
                          value={newRowData.destinationCategory}
                          onChange={(e) => setNewRowData({ ...newRowData, destinationCategory: e.target.value })}
                          className="bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-950 cursor-pointer"
                        >
                          <option value="maintenance_parts">🔧 قطع صيانة</option>
                          <option value="maintenance_expense">🧪 خرج صيانة (شلك/معدات)</option>
                          <option value="shop_inventory">📱 بضاعة للمحل</option>
                          <option value="balance_recharge">💳 رصيد للشبكات</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <input
                          id="new-row-purch-paid"
                          type="number"
                          value={newRowData.paidAmount}
                          onChange={(e) => setNewRowData({ ...newRowData, paidAmount: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              document.getElementById('new-row-purch-remaining')?.focus();
                            } else if (e.key === 'Escape') {
                              setActiveNewSection(null);
                            }
                          }}
                          className="w-full p-2 bg-white border-2 border-amber-400 rounded-lg text-xs font-mono font-bold text-slate-900 text-left focus:ring-2 focus:ring-amber-500"
                          placeholder="المبلغ المحول"
                        />
                        <span className="text-[10px] text-slate-400 absolute left-2 bottom-2">ر.ي</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <input
                          id="new-row-purch-remaining"
                          type="number"
                          value={newRowData.remainingAmount}
                          onChange={(e) => setNewRowData({ ...newRowData, remainingAmount: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              document.getElementById('new-row-purch-notes')?.focus();
                            } else if (e.key === 'Escape') {
                              setActiveNewSection(null);
                            }
                          }}
                          className="w-full p-2 bg-white border-2 border-amber-400 rounded-lg text-xs font-mono font-bold text-rose-700 text-left focus:ring-2 focus:ring-amber-500"
                          placeholder="كم باقي له"
                        />
                        <span className="text-[10px] text-rose-400 absolute left-2 bottom-2">ر.ي</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="p-2 rounded-lg bg-amber-100/80 border border-amber-300 text-center">
                        <span className="text-[10px] text-amber-800 block font-semibold">الإجمالي</span>
                        <span className="font-mono font-black text-amber-950 text-xs">
                          {formatCurrency(
                            (Number(newRowData.paidAmount) || 0) + (Number(newRowData.remainingAmount) || 0)
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        id="new-row-purch-notes"
                        type="text"
                        value={newRowData.notes}
                        onChange={(e) => setNewRowData({ ...newRowData, notes: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveNewRow(true);
                          } else if (e.key === 'Escape') {
                            setActiveNewSection(null);
                          }
                        }}
                        className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs text-slate-700"
                        placeholder="رقم الحوالة أو ملاحظات (اضغط Enter للحفظ)..."
                      />
                    </td>
                    <td className="p-2 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSaveNewRow(true)}
                          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title="حفظ وإضافة سطر جديد (Enter)"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حفظ (Enter)</span>
                        </button>
                        <button
                          onClick={() => setActiveNewSection(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="إلغاء الإضافة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {purchTx.map((tx) => {
                  const isEditing = editingTxId === tx.id || isSectionUnlocked('purchases');
                  const isCompound = isCompoundDescription(tx.description);
                  const decomposed = isCompound ? decomposeTransaction(tx) : [];
                  const isExpanded = detailedViewMode || expandedCompoundMap[tx.id];

                  const paidVal = tx.paidAmount !== undefined ? tx.paidAmount : tx.price;
                  const remVal = tx.remainingAmount || 0;
                  const totalInvoiceVal = tx.cost || paidVal + remVal;

                  if (isEditing && editingTxId === tx.id && editFormData) {
                    const editPaid = editFormData.paidAmount !== undefined ? editFormData.paidAmount : editFormData.price;
                    const editRem = editFormData.remainingAmount || 0;
                    const editTotal = editPaid + editRem;

                    return (
                      <tr key={tx.id} className="bg-amber-50/70 border-2 border-amber-400 transition-all">
                        <td className="p-2">
                          <select
                            value={editFormData.supplierName || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, supplierName: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900"
                          >
                            {allKnownSuppliers.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                            {editFormData.supplierName && !allKnownSuppliers.includes(editFormData.supplierName) && (
                              <option value={editFormData.supplierName}>{editFormData.supplierName}</option>
                            )}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                            placeholder="ايش المشتريات..."
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editPaid}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditFormData({
                                ...editFormData,
                                paidAmount: val,
                                price: val,
                                cost: val + (editFormData.remainingAmount || 0),
                              });
                            }}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                            placeholder="المبلغ المحول"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editRem}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditFormData({
                                ...editFormData,
                                remainingAmount: val,
                                cost: (editFormData.paidAmount || editFormData.price || 0) + val,
                              });
                            }}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-rose-700"
                            placeholder="كم باقي له"
                          />
                        </td>
                        <td className="p-2">
                          <span className="font-mono font-bold text-xs text-amber-950 block text-center">
                            {formatCurrency(editTotal)}
                          </span>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.notes || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            placeholder="ملاحظات..."
                          />
                        </td>
                        <td className="p-2 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={saveInlineEdit}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>حفظ</span>
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-950 border border-amber-200">
                            <Building2 className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>{tx.supplierName || 'مورد عام'}</span>
                          </span>
                        </td>
                        <td className="p-3 text-slate-900 font-semibold">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{tx.description}</span>
                            {isCompound && (
                              <button
                                onClick={() => toggleExpandCompound(tx.id)}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"
                              >
                                <span>مجمع ({decomposed.length} بنود)</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-bold font-mono text-emerald-800">
                          {formatCurrency(paidVal)}
                        </td>
                        <td className="p-3">
                          {remVal > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-rose-100 text-rose-800 border border-rose-200">
                              <span>باقي:</span>
                              <span>{formatCurrency(remVal)}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">خالص 0</span>
                          )}
                        </td>
                        <td className="p-3 font-bold font-mono text-amber-950">
                          {formatCurrency(totalInvoiceVal)}
                        </td>
                        <td className="p-3 text-slate-500">{tx.notes || '-'}</td>
                        <td className="p-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            {remVal > 0 && (
                              <button
                                onClick={() =>
                                  openNewInlineRow(
                                    'purchases',
                                    undefined,
                                    `سداد دفعة للمورد (${tx.supplierName || 'المورد'})`,
                                    tx.supplierName
                                  )
                                }
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                                title="تسجيل دفعة سداد جديدة لهذا المورد"
                              >
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>ادفع للمورد</span>
                              </button>
                            )}
                            <button
                              onClick={() => startInlineEdit(tx)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                                isSectionUnlocked('purchases')
                                  ? 'text-amber-950 bg-amber-400 hover:bg-amber-300 shadow-xs ring-1 ring-amber-500'
                                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                              }`}
                              title="تعديل مباشر في الجدول"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>تعديل</span>
                            </button>
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 rounded text-amber-600 hover:bg-amber-50 border border-amber-200"
                              title="تعديل مفصل بالفاتورة"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            {isCompound && (
                              <button
                                onClick={() => handleSplitCompound(tx)}
                                className="p-1 rounded text-purple-600 hover:bg-purple-50 border border-purple-200"
                                title="تفكيك لبنود مستقلة"
                              >
                                <Split className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Decomposed items for purchases */}
                      {isCompound && isExpanded && (
                        <tr className="bg-amber-50/40 border-y border-amber-100">
                          <td colSpan={7} className="p-3 pr-8">
                            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs space-y-2">
                              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                <span className="font-bold text-amber-900">تفصيل قطع الفاتورة المستقلة:</span>
                                <button
                                  onClick={() => handleSplitCompound(tx)}
                                  className="flex items-center gap-1 text-[11px] bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-2 py-1 rounded-lg border border-purple-200"
                                >
                                  <Split className="w-3 h-3" />
                                  <span>تحويل لـ ({decomposed.length}) فواتير مستقلة</span>
                                </button>
                              </div>
                              <table className="w-full text-xs text-right">
                                <thead className="bg-slate-50 text-slate-500 text-[11px]">
                                  <tr>
                                    <th className="p-2">#</th>
                                    <th className="p-2">الصنف / القطعة</th>
                                    <th className="p-2">المبلغ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {decomposed.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                      <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                                      <td className="p-2 font-bold text-slate-800">{item.name}</td>
                                      <td className="p-2 font-bold font-mono text-rose-700">{formatCurrency(item.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Table Footer Totals */}
                {purchTx.length > 0 && (
                  <tr className="bg-amber-100/50 font-bold border-t-2 border-amber-300 text-amber-950">
                    <td colSpan={2} className="p-3 text-right">
                      <span>إجمالي مشتريات اليوم:</span>
                    </td>
                    <td className="p-3 font-mono font-black text-emerald-800">
                      {formatCurrency(
                        purchTx.reduce(
                          (sum, t) => sum + (t.paidAmount !== undefined ? t.paidAmount : t.price),
                          0
                        )
                      )}
                    </td>
                    <td className="p-3 font-mono font-black text-rose-800">
                      {formatCurrency(
                        purchTx.reduce((sum, t) => sum + (t.remainingAmount || 0), 0)
                      )}
                    </td>
                    <td className="p-3 font-mono font-black text-amber-950">
                      {formatCurrency(
                        purchTx.reduce(
                          (sum, t) =>
                            sum +
                            (t.cost ||
                              (t.paidAmount !== undefined ? t.paidAmount : t.price) +
                                (t.remainingAmount || 0)),
                          0
                        )
                      )}
                    </td>
                    <td colSpan={2} className="p-3 text-xs text-slate-600">
                      (إجمالي الفواتير = المدفوع + الآجل المتبقي للتجار)
                    </td>
                  </tr>
                )}

                {/* Quick add bottom row when section is unlocked */}
                {isSectionUnlocked('purchases') && (
                  <tr className="bg-amber-50/50 border-t-2 border-amber-200 no-print">
                    <td colSpan={7} className="p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>قسم المشتريات مفتوح للتعديل والعمليات والإضافة السريعة 🔓</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openNewInlineRow('purchases', undefined, 'سداد دفعة للمخزن / المورد')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                            <span>+ ادفع من جديد للمخزن / المورد</span>
                          </button>
                          <button
                            onClick={() => openNewInlineRow('purchases')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>+ إضافة فاتورة مشتريات / قطع جديدة</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. الخرج والمصروفات والسحوبات ومخروجات المحل */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-rose-950 text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-300" />
            <h3 className="font-bold text-sm">5. الخرج والمصروفات والسحوبات وصرفة البيت</h3>
            <span className="text-xs bg-rose-900 px-2 py-0.5 rounded-md text-rose-200 font-mono">
              {expTx.length} بنود
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTableUnlock('expenses')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                isSectionUnlocked('expenses')
                  ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-rose-900 text-rose-200 hover:bg-rose-800'
              }`}
            >
              {isSectionUnlocked('expenses') ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-950" />
                  <span>مفتوح للتعديل 🔓</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>تعديل مباشر</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsBatchPurchaseModalOpen(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg transition-all shadow-xs cursor-pointer ring-1 ring-amber-500"
              title="إدخال مشتريات تاجر لأي يوم، تحديد أسعار الشراء والبيع، وتسجيل كم رسلت له في الخرج"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-950" />
              <span>🛒 مشتريات تاجر وحوالة الخرج ⚡</span>
            </button>
            <button
              onClick={() => openNewInlineRow('expenses')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                activeNewSection === 'expenses'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
              title="إضافة بند خرج أو سحب مباشرة في الجدول"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة خرج / سحب (في الجدول)</span>
            </button>
            <button
              onClick={() => onAddNewForSection('expense_shop')}
              className="text-[11px] text-rose-300 hover:text-white underline decoration-dotted px-1 py-1"
              title="فتح نافذة الفاتورة والسند"
            >
              سند
            </button>
          </div>
        </div>

        {expTx.length === 0 && activeNewSection !== 'expenses' ? (
          <div className="p-4 text-center text-xs text-slate-400">لا توجد مصاريف أو سحوبات مسجلة لهذا اليوم.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] sm:min-w-full text-xs text-right">
              <thead className="bg-rose-50/60 text-rose-900 border-b border-rose-100">
                <tr>
                  <th className="p-3 w-40">نوع البند</th>
                  <th className="p-3">التفاصيل والبيان</th>
                  <th className="p-3 w-32">المبلغ</th>
                  <th className="p-3">طريقة المعالجة المحاسبية</th>
                  <th className="p-3 text-center w-36 no-print">إجراءات والتعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* NEW INLINE ROW FOR EXPENSES */}
                {activeNewSection === 'expenses' && (
                  <tr className="bg-rose-50/95 border-2 border-rose-500 shadow-md animate-fadeIn">
                    <td className="p-2">
                      <select
                        value={newRowData.expenseType}
                        onChange={(e) => {
                          const chosen = EXPENSE_LEDGER_OPTIONS.find((o) => o.value === e.target.value);
                          setNewRowData({
                            ...newRowData,
                            expenseType: e.target.value,
                            description: !newRowData.description || EXPENSE_LEDGER_OPTIONS.some((o) => o.defaultDesc === newRowData.description)
                              ? (chosen?.defaultDesc || '')
                              : newRowData.description,
                          });
                        }}
                        className="w-full p-2 bg-white border-2 border-rose-400 rounded-lg text-xs font-bold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                      >
                        {EXPENSE_LEDGER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        id="new-row-exp-desc"
                        type="text"
                        autoFocus
                        value={newRowData.description}
                        onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('new-row-exp-amount')?.focus();
                          } else if (e.key === 'Escape') {
                            setActiveNewSection(null);
                          }
                        }}
                        className="w-full p-2 bg-white border-2 border-rose-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="بيان المصروف أو السحب (اضغط Enter للمبلغ)..."
                      />
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <input
                          id="new-row-exp-amount"
                          type="number"
                          value={newRowData.amount}
                          onChange={(e) => setNewRowData({ ...newRowData, amount: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewRow(true);
                            } else if (e.key === 'Escape') {
                              setActiveNewSection(null);
                            }
                          }}
                          className="w-full p-2 bg-white border-2 border-rose-400 rounded-lg text-xs font-mono font-bold text-rose-800 text-left focus:ring-2 focus:ring-rose-500"
                          placeholder="المبلغ"
                        />
                        <span className="text-[10px] text-slate-400 absolute left-2 bottom-2">ر.ي</span>
                      </div>
                    </td>
                    <td className="p-2 text-xs text-slate-600">
                      <span className="text-[11px] font-semibold bg-white/90 px-2 py-1 rounded-md border border-rose-200 block">
                        {EXPENSE_LEDGER_OPTIONS.find((o) => o.value === newRowData.expenseType)?.accountingRule ||
                          'يخصم وفق القواعد المعتمدة'}
                      </span>
                    </td>
                    <td className="p-2 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSaveNewRow(true)}
                          className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title="حفظ وإضافة سطر جديد (أو اضغط Enter في خانة المبلغ)"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حفظ (Enter)</span>
                        </button>
                        <button
                          onClick={() => setActiveNewSection(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="إلغاء الإضافة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {expTx.map((tx) => {
                  const isEditing = editingTxId === tx.id || isSectionUnlocked('expenses');

                  if (isEditing && editingTxId === tx.id && editFormData) {
                    return (
                      <tr key={tx.id} className="bg-amber-50/70 border-2 border-amber-400 transition-all">
                        <td className="p-2">
                          <select
                            value={editFormData.type}
                            onChange={(e) => {
                              const chosen = EXPENSE_LEDGER_OPTIONS.find((o) => o.value === e.target.value);
                              setEditFormData({
                                ...editFormData,
                                type: e.target.value as TransactionType,
                                category: chosen?.category || editFormData.category,
                              });
                            }}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900"
                          >
                            {EXPENSE_LEDGER_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editFormData.price}
                            onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-rose-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editFormData.notes || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            placeholder="ملاحظات..."
                          />
                        </td>
                        <td className="p-2 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={saveInlineEdit}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>حفظ</span>
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const matchedOpt = EXPENSE_LEDGER_OPTIONS.find((o) => o.value === tx.type);
                  let badge = matchedOpt?.badgeText || 'خرج عام';
                  let rule = matchedOpt?.accountingRule || 'يخصم وفق المعالجة المحاسبية';
                  let colorClass = matchedOpt?.colorClass || 'bg-rose-100 text-rose-800 border-rose-200';

                  if (!matchedOpt) {
                    if (tx.type === 'expense_home_mosaab' || tx.type === 'withdrawal_home') {
                      badge = 'صرفة بيت مصعب';
                      rule = 'تخصم حصراً من حصة مصعب (2/3)';
                      colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    } else if (tx.type === 'withdrawal_mosaab' || tx.type === 'withdrawal_personal') {
                      badge = 'سحب مصعب';
                      rule = 'يخصم من رصيد مصعب الشخصي';
                      colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    } else if (tx.type === 'mosaab_purchases_fund') {
                      badge = 'تحويل لمصعب عهدة يدي مشتريات';
                      rule = tx.mosaabPurchasedAmount
                        ? `أشترى بـ ${formatCurrency(tx.mosaabPurchasedAmount || 0)} وباقي عنده ${formatCurrency(tx.mosaabRemainingAmount || 0)}`
                        : 'عهدة مشتريات مسلمة لمصعب';
                      colorClass = 'bg-amber-100 text-amber-800 border-amber-300';
                    } else if (tx.type === 'expense_engineer') {
                      badge = 'صرفة مهندس';
                      rule = 'غداء على المحل (من رأس الفائدة)';
                      colorClass = 'bg-purple-100 text-purple-800 border-purple-300';
                    } else if (tx.type === 'withdrawal_engineer' || tx.type === 'withdrawal_engineer_third') {
                      badge = 'سحب المهندس من حسابة الثلث';
                      rule = 'يحسب عليه ويخصم من حسابه الثلث';
                      colorClass = 'bg-purple-100 text-purple-800 border-purple-300';
                    } else if (tx.type === 'expense_worker') {
                      badge = 'صرفة عامل';
                      rule = 'صرفة يومية على المحل';
                      colorClass = 'bg-slate-100 text-slate-800 border-slate-300';
                    } else if (tx.type === 'withdrawal_worker') {
                      badge = 'تصفية عامل';
                      rule = 'تصفية مستحقات العامل';
                      colorClass = 'bg-slate-100 text-slate-800 border-slate-300';
                    } else if (tx.type === 'expense_modem') {
                      badge = 'خرج مودم ورصيد';
                      rule = 'يخصم مناصفة بين المالك والمدير';
                      colorClass = 'bg-cyan-100 text-cyan-800 border-cyan-300';
                    } else if (tx.type === 'shop_tools_outflow') {
                      badge = 'مخروجات للمحل';
                      rule = 'شواحن/وصلات للمحل (على المحل)';
                      colorClass = 'bg-rose-100 text-rose-800 border-rose-300';
                    }
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${colorClass}`}>
                          {badge}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{tx.description}</td>
                      <td className="p-3 font-bold font-mono text-rose-700">{formatCurrency(tx.price)}</td>
                      <td className="p-3 text-[11px] text-slate-500">{rule}</td>
                      <td className="p-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startInlineEdit(tx)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                              isSectionUnlocked('expenses')
                                ? 'text-amber-950 bg-amber-400 hover:bg-amber-300 shadow-xs ring-1 ring-amber-500'
                                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                            }`}
                            title="تعديل مباشر في الجدول"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-rose-200"
                            title="تعديل مفصل بالسند"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Table Footer Totals */}
                {expTx.length > 0 && (
                  <tr className="bg-rose-100/50 font-bold border-t-2 border-rose-300 text-rose-950">
                    <td colSpan={2} className="p-3 text-right">
                      <span>إجمالي المنصرفات والسحوبات لليوم:</span>
                    </td>
                    <td className="p-3 font-mono font-black text-rose-800">
                      {formatCurrency(expTx.reduce((sum, t) => sum + (Number(t.price) || 0), 0))}
                    </td>
                    <td colSpan={2} className="p-3 text-xs text-slate-600">
                      (تتضمن صرفة البيت، السحوبات، المرتجعات، والحوالات)
                    </td>
                  </tr>
                )}

                {/* Quick add bottom row when section is unlocked */}
                {isSectionUnlocked('expenses') && (
                  <tr className="bg-rose-50/50 border-t-2 border-rose-200 no-print">
                    <td colSpan={5} className="p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-rose-600" />
                          <span>قسم المصاريف والسحوبات مفتوح للتعديل والعمليات والإضافة السريعة 🔓</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openNewInlineRow('expenses')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>+ إضافة خرج / سحب في هذا الجدول</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. تصفية وخلاصة الأرباح اليومية وفق النموذج المعتمد (الشاشات الأربع) */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-2xl border-2 border-indigo-500/30 print-break-inside-avoid space-y-6">
        
        {/* Top Header: Title, Active Model Badge, Settings Shortcut & Drawer Cash */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <Coins className="w-5 h-5" />
              </span>
              <h3 className="font-black text-base sm:text-lg text-white">
                تصفية وخلاصة أرباح يوم: {currentDate}
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>{profitResult.modelTitle}</span>
              </span>
            </div>
            <p className="text-xs text-slate-300">
              توزيع الأرباح واحتساب صافي مستحق المهندس وباقي المحل وفق القواعد المالية المعتمدة 100% بالريال اليمني
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('profit_sharing')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-slate-200 transition-all cursor-pointer no-print shadow-xs"
                title="تعديل أو تغيير نموذج تقسيم الأرباح النشط"
              >
                <Percent className="w-3.5 h-3.5 text-indigo-400" />
                <span>إعدادات ونماذج الأرباح ⚙️</span>
              </button>
            )}

            <div className="bg-slate-900/90 px-4 py-2 rounded-2xl border border-cyan-500/40 text-right shrink-0">
              <span className="text-[10px] text-cyan-300 block font-bold">صافي كاش الدرج المتوفر:</span>
              <span className="font-mono font-black text-base sm:text-lg text-cyan-200">
                {formatCurrency(dailySummary.netCashDrawer)}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* الشاشات الأربع للأرباح والخرج (The 4 Financial Screens) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* 1. شاشة إجمالي الأرباح قبل الخصم */}
          <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-amber-500/30 shadow-lg space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-black text-xs sm:text-sm text-amber-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>1. إجمالي الأرباح قبل الخصم</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                  خام
                </span>
              </div>

              <div className="text-xs space-y-2 pt-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">أرباح الصيانة:</span>
                  <span className="font-mono font-bold text-purple-300">
                    {formatCurrency(profitResult.grossMaintenanceProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">أرباح المبيعات والإكسسوار:</span>
                  <span className="font-mono font-bold text-blue-300">
                    {formatCurrency(profitResult.grossSalesProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">أرباح شبكات الرصيد والشرائح:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatCurrency(profitResult.grossNetworksProfit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-amber-200">الإجمالي العام الخام:</span>
              <span className="font-mono font-black text-base text-amber-300">
                {formatCurrency(profitResult.totalGrossProfit)}
              </span>
            </div>
          </div>

          {/* 2. شاشة الصرفة والخرج المخصومة أولاً */}
          <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-rose-500/30 shadow-lg space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-black text-xs sm:text-sm text-rose-300 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span>2. الصرفة والمصاريف المخصومة</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                  تخصم أولاً
                </span>
              </div>

              <div className="text-xs space-y-2 pt-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">صرفة الأكل والمعيشة اليومية:</span>
                  <span className="font-mono font-bold text-rose-300">
                    -{formatCurrency(profitResult.shopExpensesBreakdown.dailyFoodLivingExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">مصاريف وتجهيزات المحل:</span>
                  <span className="font-mono font-bold text-rose-300">
                    -{formatCurrency(profitResult.shopExpensesBreakdown.shopExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">خرج الرصيد والمودم:</span>
                  <span className="font-mono font-bold text-rose-300">
                    -{formatCurrency(profitResult.shopExpensesBreakdown.modemNetExpenses)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 mt-2">
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-200">إجمالي الصرفة المخصومة:</span>
                <span className="font-mono font-black text-sm text-rose-300">
                  -{formatCurrency(profitResult.totalOperatingExpenses)}
                </span>
              </div>
              <div className="text-[11px] text-emerald-300 text-center flex justify-between px-1">
                <span>الصافي بعد الصرفة:</span>
                <strong className="font-mono text-emerald-200">{formatCurrency(profitResult.netDistributableProfit)}</strong>
              </div>
            </div>
          </div>

          {/* 3. شاشة كم يطلع للعامل المهندس */}
          <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border-2 border-indigo-500/50 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-black text-xs sm:text-sm text-indigo-300 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-indigo-400" />
                  <span>3. كم يطلع للعامل المهندس</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  مستحق الصرف
                </span>
              </div>

              <div className="text-xs space-y-2 pt-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">نصيبه من الصيانة:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {formatCurrency(profitResult.engineerMaintenanceShare)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">حصة المحل / المعاش اليومي:</span>
                  <span className="font-mono font-bold text-indigo-200">
                    {formatCurrency(profitResult.engineerShopShare + profitResult.engineerSalaryShare)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span className="text-rose-400">سلفيات ومسحوبات شخصية:</span>
                  <span className="font-mono">
                    {profitResult.engineerDeductions > 0 ? `-${formatCurrency(profitResult.engineerDeductions)}` : '0 ر.ي'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border-2 border-indigo-400/50 rounded-xl p-3 flex flex-col justify-between gap-1 mt-2">
              <span className="text-xs font-bold text-indigo-200">صافي استحقاق المهندس للاستلام:</span>
              <span className="font-mono font-black text-lg text-indigo-300 text-left">
                {formatCurrency(profitResult.engineerNetPayout)}
              </span>
            </div>
          </div>

          {/* 4. شاشة كم باقي للمحل (لصاحب المحل مصعب الصوفي) */}
          <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/50 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-black text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>4. كم باقي للمحل (مصعب)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  صاحب المحل
                </span>
              </div>

              <div className="text-xs space-y-2 pt-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">صافي أرباح المحل المتبقية:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatCurrency(profitResult.shopNetPayout)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span className="text-rose-400">خصم صرفة بيت مصعب:</span>
                  <span className="font-mono">
                    {dailySummary.mosaabHomeExpenses > 0 ? `-${formatCurrency(dailySummary.mosaabHomeExpenses)}` : '0 ر.ي'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span className="text-rose-400">خصم سحوبات مصعب:</span>
                  <span className="font-mono">
                    {dailySummary.mosaabWithdrawals > 0 ? `-${formatCurrency(dailySummary.mosaabWithdrawals)}` : '0 ر.ي'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border-2 border-emerald-400/50 rounded-xl p-3 flex flex-col justify-between gap-1 mt-2">
              <span className="text-xs font-bold text-emerald-200">صافي رصيد مصعب لليوم:</span>
              <span className="font-mono font-black text-lg text-emerald-300 text-left">
                {formatCurrency(dailySummary.mosaabNetBalance)}
              </span>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* سجل التدقيق الرياضي والعمليات خطوة بخطوة (Collapsible) */}
        {/* ======================================================== */}
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>كشف العمليات الحسابية خطوة بخطوة بالريال اليمني ({profitResult.stepByStepLog.length} خطوات)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px]">{showAuditTrail ? 'إخفاء التفاصيل' : 'عرض التدقيق الرياضي'}</span>
              {showAuditTrail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showAuditTrail && (
            <div className="p-4 pt-1 border-t border-slate-800 space-y-2 text-xs font-mono">
              {profitResult.stepByStepLog.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Voucher Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 flex-wrap">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>تسجيل سندات الصرف المرتبطة باليومية:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onAddNewForSection('withdrawal_engineer')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ سند صرف مستحقات المهندس</span>
            </button>

            <button
              onClick={() => onAddNewForSection('expense_home_mosaab')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ قيد صرفة بيت مصعب</span>
            </button>

            <button
              onClick={() => onAddNewForSection('withdrawal_mosaab')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ سند سحب شخصي لمصعب</span>
            </button>
          </div>
        </div>

      </div>

      {/* 🛒 مودال فاتورة المشتريات المجمعة لعدة أصناف وتحديد جهتها */}
      {isBatchPurchaseModalOpen && (
        <BatchPurchaseInvoiceModal
          isOpen={isBatchPurchaseModalOpen}
          onClose={() => setIsBatchPurchaseModalOpen(false)}
          currentDate={currentDate}
          allKnownSuppliers={allKnownSuppliers}
          onSaveBatch={handleSaveBatchPurchases}
        />
      )}

      {/* 📦 مودال تسليم جهاز الصيانة واستلام المبلغ المتبقي (بز الجوال) */}
      {isPickupModalOpen && (
        <MaintenancePickupModal
          isOpen={isPickupModalOpen}
          onClose={() => setIsPickupModalOpen(false)}
          currentDate={currentDate}
          transactions={transactions}
          onDeliverDevice={handleDeliverMaintenanceDevice}
        />
      )}

      {/* ⚡ مودال جرد وتحديث أسعار وكميات مبيعات اليوم غير المسعرة بالمخزن */}
      {isReconcileModalOpen && (
        <DailySoldReconciliationModal
          isOpen={isReconcileModalOpen}
          onClose={() => setIsReconcileModalOpen(false)}
          entries={unpricedSoldEntries}
          currentDate={currentDate}
          onSaveEntry={handleSaveReconciledEntry}
        />
      )}

    </div>
  );
};
