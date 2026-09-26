import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  PackagePlus, 
  Barcode, 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Tag, 
  Percent, 
  Layers, 
  Zap, 
  AlertCircle, 
  QrCode,
  CreditCard,
  User,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { 
  InventoryItem, 
  DayRecord, 
  SupplierProfile, 
  SupplierTransaction,
  CustomerDebtItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  POSCartItem,
  SHOP_INFO,
  SHOP_POLICIES
} from '../types';
import { formatNumber } from '../utils/accounting';
import { getTodayDateString } from '../utils/dateHelper';
import { BarcodeBadge, generateBarcodeSVG } from './BarcodeBadge';
import { Transaction } from '../types';

interface CashierViewProps {
  days: DayRecord[];
  currentDay: DayRecord | null;
  onUpdateDay: (updatedDay: DayRecord) => void;
  inventoryItems: InventoryItem[];
  onAddInventoryItem: (item: InventoryItem) => void;
  onUpdateInventoryItem: (item: InventoryItem) => void;
  supplierProfiles: SupplierProfile[];
  onAddSupplierProfile?: (profile: SupplierProfile) => void;
  onAddSupplierTransaction?: (tx: SupplierTransaction) => void;
  onAddCustomerDebt?: (debt: CustomerDebtItem) => void;
  onSaveTransactions?: (transactions: Transaction[]) => void;
  initialMode?: 'purchase' | 'sales';
}

export const CashierView: React.FC<CashierViewProps> = ({
  days,
  currentDay,
  onUpdateDay,
  inventoryItems,
  onAddInventoryItem,
  onUpdateInventoryItem,
  supplierProfiles,
  onAddSupplierProfile,
  onAddSupplierTransaction,
  onAddCustomerDebt,
  onSaveTransactions,
  initialMode = 'sales',
}) => {
  // Main Mode: 'purchase' (كاشير الشراء وفواتير البضاعة) | 'sales' (كاشير المبيعات ونقطة البيع)
  const [cashierMode, setCashierMode] = useState<'purchase' | 'sales'>(initialMode);

  // ==========================================
  // --- SECTION 1: PURCHASE INVOICE STATE ---
  // ==========================================
  const [invoiceType, setInvoiceType] = useState<'new' | 'existing'>('new');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => `INV-${Date.now().toString().slice(-6)}`);
  const [purchaseDate, setPurchaseDate] = useState<string>(() => currentDay?.date || getTodayDateString());
  const [supplierName, setSupplierName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'نقد' | 'آجل' | 'حوالة'>('نقد');
  const [autoBarcode, setAutoBarcode] = useState<boolean>(true);
  const [defaultCategory, setDefaultCategory] = useState<InventoryItem['category']>('قطع غيار');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  useEffect(() => {
    if (currentDay?.date) {
      setPurchaseDate(currentDay.date);
    }
  }, [currentDay?.date]);
  const [savedInvoices, setSavedInvoices] = useState<PurchaseInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('qibal_saved_purchase_invoices_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load purchase invoices', e);
    }
    return [];
  });

  // Purchase Items Table
  const [purchaseItems, setPurchaseItems] = useState<PurchaseInvoiceItem[]>([]);

  // Sequential Input Fields (Enter-Driven)
  const [itemName, setItemName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [manualBarcode, setManualBarcode] = useState('');
  const [itemCategory, setItemCategory] = useState<InventoryItem['category']>('قطع غيار');

  // Input Refs for sequential Enter navigation
  const nameInputRef = useRef<HTMLInputElement>(null);
  const costInputRef = useRef<HTMLInputElement>(null);
  const sellInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Success Notification banner
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // ==========================================
  // --- SECTION 2: SALES POS STATE ---
  // ==========================================
  const [salesSearch, setSalesSearch] = useState('');
  const [salesCart, setSalesCart] = useState<POSCartItem[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posSaleType, setPosSaleType] = useState<'نقد' | 'دين'>('نقد');
  const [posGuarantor, setPosGuarantor] = useState('');
  const [posGuarantorPhone, setPosGuarantorPhone] = useState('');
  const [posWorkplace, setPosWorkplace] = useState('');
  const [posDueDate, setPosDueDate] = useState('');
  const [posPaidAmount, setPosPaidAmount] = useState('');
  const [posDiscount, setPosDiscount] = useState('0');
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);
  const posBarcodeInputRef = useRef<HTMLInputElement>(null);

  // Save invoices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qibal_saved_purchase_invoices_v1', JSON.stringify(savedInvoices));
    } catch (e) {
      console.error('Failed to save purchase invoices', e);
    }
  }, [savedInvoices]);

  // Focus on initial input on mode change
  useEffect(() => {
    if (cashierMode === 'purchase') {
      setTimeout(() => nameInputRef.current?.focus(), 150);
    } else {
      setTimeout(() => posBarcodeInputRef.current?.focus(), 150);
    }
  }, [cashierMode]);

  // Helper to trigger alert banner
  const triggerAlert = (message: string, type: 'success' | 'info' = 'success') => {
    setActionAlert({ type, message });
    setTimeout(() => {
      setActionAlert(null);
    }, 4000);
  };

  // Helper to generate next unique barcode
  const generateNewBarcode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(100 + Math.random() * 900);
    return `QB-${timestamp}-${rand}`;
  };

  // Handle Enter Key Navigation in Purchase Mode
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!itemName.trim()) return;
      costInputRef.current?.focus();
      costInputRef.current?.select();
    }
  };

  const handleCostKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sellInputRef.current?.focus();
      sellInputRef.current?.select();
    }
  };

  const handleSellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Add Item to table and reset
      handleAddItemToPurchaseInvoice();
    }
  };

  // Add Item to Purchase Invoice
  const handleAddItemToPurchaseInvoice = () => {
    const trimmedName = itemName.trim();
    if (!trimmedName) {
      triggerAlert('يرجى إدخال اسم الصنف أولاً', 'info');
      nameInputRef.current?.focus();
      return;
    }

    const cost = Number(purchasePrice) || 0;
    const sell = Number(sellingPrice) || cost;
    const qty = Math.max(1, Number(quantity) || 1);

    // Determine barcode
    let code = manualBarcode.trim();
    if (!code) {
      if (autoBarcode) {
        code = generateNewBarcode();
      } else {
        code = `QB-${Date.now().toString().slice(-8)}`;
      }
    }

    const newItem: PurchaseInvoiceItem = {
      id: `p-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      purchasePrice: cost,
      sellingPrice: sell,
      quantity: qty,
      barcode: code,
      category: (itemCategory || defaultCategory) as any,
      notes: ''
    };

    setPurchaseItems(prev => [newItem, ...prev]);

    // Reset input fields
    setItemName('');
    setPurchasePrice('');
    setSellingPrice('');
    setQuantity('1');
    setManualBarcode('');
    setItemCategory(defaultCategory);

    // Refocus name input for rapid consecutive entries
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);

    triggerAlert(`تم إضافة (${trimmedName}) برقم باركود [${code}] إلى جدول الفاتورة بسرعة ⚡`);
  };

  // Remove Item from Purchase Invoice
  const handleRemovePurchaseItem = (id: string) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculations for Purchase Invoice
  const totalPurchaseCost = purchaseItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
  const totalSellingValue = purchaseItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const totalItemsCount = purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
  const expectedProfit = totalSellingValue - totalPurchaseCost;
  const profitMarginPercent = totalPurchaseCost > 0 ? ((expectedProfit / totalPurchaseCost) * 100).toFixed(1) : '0';

  // Load Existing Invoice
  const handleSelectExistingInvoice = (inv: PurchaseInvoice) => {
    setInvoiceNumber(inv.invoiceNumber);
    setSupplierName(inv.supplierName);
    setPaymentMethod(inv.paymentMethod);
    setAutoBarcode(inv.autoBarcode);
    setPurchaseItems(inv.items || []);
    setInvoiceType('existing');
    triggerAlert(`تم فتح الفاتورة السابقة (${inv.invoiceNumber}) للمورد ${inv.supplierName}`);
  };

  // Commit and Post Purchase Invoice to System (Inventory + Suppliers + Day Ledger)
  const handleSaveAndPostPurchaseInvoice = () => {
    if (purchaseItems.length === 0) {
      triggerAlert('لا توجد أصناف في الفاتورة لحفظها!', 'info');
      return;
    }

    const currentInvoice: PurchaseInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || `INV-${Date.now().toString().slice(-6)}`,
      isExisting: invoiceType === 'existing',
      supplierName: supplierName.trim() || 'مورد عام / نقدي',
      date: purchaseDate || (currentDay ? currentDay.date : getTodayDateString()),
      autoBarcode,
      paymentMethod,
      dayId: currentDay?.id,
      items: purchaseItems,
      totalPurchaseCost,
      totalSellingValue,
      expectedProfit,
      notes: invoiceNotes,
      status: 'مرحلة'
    };

    // 1. Save or Update in Invoice Archive
    setSavedInvoices(prev => [currentInvoice, ...prev.filter(i => i.invoiceNumber !== currentInvoice.invoiceNumber)]);

    // 2. Sync / Add to Inventory
    purchaseItems.forEach(item => {
      const existingInStock = inventoryItems.find(inv => inv.name.toLowerCase() === item.name.toLowerCase() || inv.barcode === item.barcode);
      if (existingInStock) {
        onUpdateInventoryItem({
          ...existingInStock,
          quantity: existingInStock.quantity + item.quantity,
          purchasePrice: item.purchasePrice || existingInStock.purchasePrice,
          sellingPrice: item.sellingPrice || existingInStock.sellingPrice,
          barcode: item.barcode || existingInStock.barcode
        });
      } else {
        onAddInventoryItem({
          id: `inv-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          minQuantity: 2,
          purchasePrice: item.purchasePrice,
          costPrice: item.purchasePrice || 0,
          sellingPrice: item.sellingPrice,
          barcode: item.barcode,
          notes: `وارد من فاتورة مشتريات رقم: ${currentInvoice.invoiceNumber}`
        });
      }
    });

    // 3. Sync with Suppliers Ledger
    if (onAddSupplierProfile && supplierName.trim()) {
      onAddSupplierProfile({
        id: `supp-${Date.now()}`,
        name: supplierName.trim(),
        dealingType: paymentMethod === 'آجل' ? 'دين' : 'نقد ودين',
        category: (defaultCategory === 'sims' || defaultCategory === 'شرايح' ? 'رصيد وباقات' : defaultCategory) as any,
        notes: `تم تقييد فاتورة مشتريات رقم ${currentInvoice.invoiceNumber}`
      });
    }

    if (onAddSupplierTransaction && supplierName.trim()) {
      onAddSupplierTransaction({
        id: `supp-tx-${Date.now()}`,
        supplierName: supplierName.trim(),
        type: 'شراء_بضاعة',
        amount: totalPurchaseCost,
        date: currentInvoice.date,
        invoiceNumber: currentInvoice.invoiceNumber,
        transferMethod: paymentMethod === 'نقد' ? 'نقد' : paymentMethod === 'حوالة' ? 'كريمي' : 'عبر البرنامج',
        notes: `فاتورة مشتريات بضاعة (${purchaseItems.length} صنف - ${totalItemsCount} قطعة)`
      });
    }

    // 4. If paid in Cash from the active day's cash drawer, log as supplier transfer / expense
    if (paymentMethod === 'نقد' && currentDay) {
      const transferRecord = {
        id: `trans-${Date.now()}`,
        supplierName: supplierName.trim() || 'مشتريات بضاعة نقدية',
        amountSent: totalPurchaseCost,
        purchasesReceivedValue: totalPurchaseCost,
        transferMethod: 'نقد' as const,
        invoiceNumber: currentInvoice.invoiceNumber,
        notes: `شراء بضاعة نقدية كاشير - فاتورة ${currentInvoice.invoiceNumber}`
      };
      onUpdateDay({
        ...currentDay,
        supplierTransfers: [...(currentDay.supplierTransfers || []), transferRecord]
      });
    }

    triggerAlert(`🎉 تم حفظ وترحيل الفاتورة (${currentInvoice.invoiceNumber}) بنجاح للمخزون وسجل الموردين!`);

    // Reset for next invoice
    setPurchaseItems([]);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setSupplierName('');
  };

  // Print Barcode Labels for All Items in Invoice
  const handlePrintAllBarcodes = () => {
    if (purchaseItems.length === 0) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const stickersHtml = purchaseItems.flatMap(item => {
      // Repeat sticker for each unit or 1 per item
      const list = [];
      for (let i = 0; i < Math.min(item.quantity, 20); i++) {
        const svg = generateBarcodeSVG(item.barcode, 170, 40);
        list.push(`
          <div class="sticker">
            <div class="shop-name">الرقم الأول لخدمات الجوال (772315106)</div>
            <div class="item-name">${item.name}</div>
            <div class="barcode-svg">${svg}</div>
            <div class="barcode-num">${item.barcode}</div>
            <div class="price">${formatNumber(item.sellingPrice)} ر.ي</div>
          </div>
        `);
      }
      return list;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>طباعة ملصقات باركود الفاتورة ${invoiceNumber}</title>
          <style>
            @page {
              margin: 4mm;
            }
            body {
              font-family: system-ui, sans-serif;
              margin: 0;
              padding: 6px;
              background: white;
              color: black;
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              justify-content: flex-start;
            }
            .sticker {
              width: 48mm;
              height: 28mm;
              border: 1px dashed #ccc;
              box-sizing: border-box;
              padding: 2px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              page-break-inside: avoid;
            }
            .shop-name {
              font-size: 7px;
              font-weight: bold;
            }
            .item-name {
              font-size: 10px;
              font-weight: 800;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 44mm;
            }
            .barcode-svg {
              margin: 1px 0;
            }
            .barcode-num {
              font-family: monospace;
              font-size: 9px;
              font-weight: bold;
            }
            .price {
              font-size: 11px;
              font-weight: 900;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${stickersHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ==========================================
  // --- SECTION 3: SALES POS HANDLERS ---
  // ==========================================
  const handleAddProductToCart = (item: InventoryItem) => {
    setSalesCart(prev => {
      const existing = prev.find(p => p.inventoryItemId === item.id || p.barcode === item.barcode);
      if (existing) {
        return prev.map(p => p.id === existing.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: item.name,
          category: item.category,
          sellingPrice: item.sellingPrice || 0,
          costPrice: item.purchasePrice || 0,
          quantity: 1,
          barcode: item.barcode,
          inventoryItemId: item.id
        },
        ...prev
      ];
    });
    triggerAlert(`تم إضافة (${item.name}) إلى سلة المبيعات`);
  };

  // Scan or Enter Barcode in POS
  const handlePOSBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = salesSearch.trim();
      if (!code) return;

      const foundItem = inventoryItems.find(i => 
        (i.barcode && i.barcode.toLowerCase() === code.toLowerCase()) ||
        i.name.toLowerCase().includes(code.toLowerCase())
      );

      if (foundItem) {
        handleAddProductToCart(foundItem);
        setSalesSearch('');
      } else {
        // Quick add custom item
        const customPrice = 1000;
        setSalesCart(prev => [
          {
            id: `cart-${Date.now()}`,
            name: code,
            category: 'إكسسوارات',
            sellingPrice: customPrice,
            costPrice: customPrice * 0.7,
            quantity: 1,
            barcode: code
          },
          ...prev
        ]);
        setSalesSearch('');
        triggerAlert(`تم إضافة صنف مباشر (${code}) إلى السلة`);
      }
    }
  };

  // Calculate POS totals
  const cartSubtotal = salesCart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const discountVal = Math.max(0, Number(posDiscount) || 0);
  const cartGrandTotal = Math.max(0, cartSubtotal - discountVal);
  const cartCostTotal = salesCart.reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0);
  const cartEstimatedProfit = cartGrandTotal - cartCostTotal;

  // Complete POS Sale
  const handleCompletePOSSale = () => {
    if (salesCart.length === 0) {
      triggerAlert('السلة فارغة!', 'info');
      return;
    }

    const saleDate = currentDay ? currentDay.date : getTodayDateString();
    const customer = posCustomerName.trim() || (posSaleType === 'دين' ? 'عميل آجل' : 'زبون نقدي');
    const phone = posCustomerPhone.trim() || undefined;

    // 1. Post to Active Day Ledger
    if (currentDay) {
      const newAccessories = salesCart.map(item => ({
        id: `acc-pos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        price: item.sellingPrice * item.quantity,
        cost: (item.costPrice || 0) * item.quantity,
        profit: ((item.sellingPrice - (item.costPrice || 0)) * item.quantity),
        qty: item.quantity,
        customerName: customer,
        customerPhone: phone,
        saleType: posSaleType,
        guarantorName: posGuarantor.trim() || undefined,
        guarantorPhone: posGuarantorPhone.trim() || undefined,
        workplace: posWorkplace.trim() || undefined,
        dueDate: posDueDate || undefined,
        notes: `مبيع كاشير نقطة بيع (${item.quantity} حبة)`
      }));

      onUpdateDay({
        ...currentDay,
        accessories: [...(currentDay.accessories || []), ...newAccessories]
      });
    }

    // 2. If Debt, Post to Customer Debts
    if (posSaleType === 'دين' && onAddCustomerDebt) {
      const paid = Number(posPaidAmount) || 0;
      const remaining = Math.max(0, cartGrandTotal - paid);

      onAddCustomerDebt({
        id: `debt-pos-${Date.now()}`,
        customerName: customer,
        phone,
        dayId: currentDay?.id,
        date: saleDate,
        description: `مبيعات كاشير (${salesCart.map(i => `${i.name} ×${i.quantity}`).join('، ')})`,
        totalAmount: cartGrandTotal,
        paidAmount: paid,
        remainingAmount: remaining,
        guarantor: posGuarantor.trim() || undefined,
        guarantorPhone: posGuarantorPhone.trim() || undefined,
        workplace: posWorkplace.trim() || undefined,
        dueDate: posDueDate || undefined,
        saleType: 'دين',
        status: remaining === 0 ? 'سدد بالكامل' : 'متبقي',
        notes: `تم قيد الدين عبر نقطة البيع الكاشير`
      });
    }

    // 3. Deduct Stock from Inventory
    salesCart.forEach(item => {
      if (item.inventoryItemId) {
        const inStock = inventoryItems.find(i => i.id === item.inventoryItemId);
        if (inStock) {
          onUpdateInventoryItem({
            ...inStock,
            quantity: Math.max(0, inStock.quantity - item.quantity)
          });
        }
      }
    });

    // 4. Save into global transactions list if provided
    if (onSaveTransactions && salesCart.length > 0) {
      const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const txs: Transaction[] = salesCart.map((item, idx) => ({
        id: `pos_sale_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        date: saleDate,
        time: currentTime,
        type: 'sale',
        category: 'accessories',
        description: item.name,
        quantity: item.quantity,
        price: item.sellingPrice * item.quantity,
        cost: (item.costPrice || 0) * item.quantity,
        profit: ((item.sellingPrice - (item.costPrice || 0)) * item.quantity),
        customerName: customer,
        customerPhone: phone,
        status: posSaleType === 'دين' ? 'unpaid' : 'paid',
        paymentMethod: posSaleType === 'دين' ? 'delayed' : 'cash',
        notes: `مبيعات كاشير ونقطة البيع (${item.quantity} حبة)`,
      }));
      onSaveTransactions(txs);
    }

    const saleSummary = {
      id: `bill-${Date.now()}`,
      customer,
      phone,
      date: saleDate,
      items: [...salesCart],
      subtotal: cartSubtotal,
      discount: discountVal,
      grandTotal: cartGrandTotal,
      paid: posSaleType === 'دين' ? (Number(posPaidAmount) || 0) : cartGrandTotal,
      remaining: posSaleType === 'دين' ? Math.max(0, cartGrandTotal - (Number(posPaidAmount) || 0)) : 0,
      saleType: posSaleType
    };

    setLastCompletedSale(saleSummary);

    // Reset Cart
    setSalesCart([]);
    setPosCustomerName('');
    setPosCustomerPhone('');
    setPosGuarantor('');
    setPosGuarantorPhone('');
    setPosWorkplace('');
    setPosDueDate('');
    setPosPaidAmount('');
    setPosDiscount('0');

    triggerAlert(`🎉 تم إتمام عملية البيع بنجاح بمبلغ ${formatNumber(cartGrandTotal)} ر.ي وترحيلها لليومية!`);
  };

  // Print POS Thermal Receipt
  const handlePrintReceipt = (sale: any) => {
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) return;

    const itemsHtml = sale.items.map((item: POSCartItem) => `
      <tr>
        <td style="text-align: right; padding: 4px 2px;">${item.name}</td>
        <td style="text-align: center; padding: 4px 2px;">${item.quantity}</td>
        <td style="text-align: left; padding: 4px 2px;">${formatNumber(item.sellingPrice * item.quantity)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>فاتورة مبيعات - ${SHOP_INFO.name}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 3mm;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 6px;
              color: black;
              font-size: 12px;
              line-height: 1.3;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .shop-title {
              font-size: 15px;
              font-weight: 900;
              margin-bottom: 2px;
            }
            .shop-sub {
              font-size: 10px;
              color: #444;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 11px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
              font-size: 11px;
            }
            th {
              border-bottom: 1px solid #000;
              border-top: 1px solid #000;
              padding: 4px 2px;
              font-weight: bold;
            }
            .total-box {
              border-top: 2px dashed #000;
              padding-top: 6px;
              margin-top: 6px;
            }
            .grand-total {
              font-size: 14px;
              font-weight: 900;
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
            }
            .policy-box {
              margin-top: 10px;
              border-top: 1px solid #000;
              padding-top: 6px;
              font-size: 9px;
              text-align: justify;
              color: #333;
            }
            .footer {
              text-align: center;
              margin-top: 8px;
              font-size: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="shop-title">${SHOP_INFO.name}</div>
            <div class="shop-sub">${SHOP_INFO.tagline}</div>
            <div class="shop-sub">المهندس: ${SHOP_INFO.engineerPhone} • المحل: ${SHOP_INFO.shopPhone}</div>
            <div class="shop-sub">${SHOP_INFO.location}</div>
          </div>

          <div class="info-row">
            <span>التاريخ: ${sale.date}</span>
            <span>فاتورة: #${sale.id.slice(-6)}</span>
          </div>
          <div class="info-row">
            <span>العميل: ${sale.customer}</span>
            <span>طريقة الدفع: ${sale.saleType}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: right;">الصنف</th>
                <th style="text-align: center;">الكمية</th>
                <th style="text-align: left;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            ${sale.discount > 0 ? `
              <div class="info-row">
                <span>المجموع:</span>
                <span>${formatNumber(sale.subtotal)} ر.ي</span>
              </div>
              <div class="info-row">
                <span>الخصم:</span>
                <span>-${formatNumber(sale.discount)} ر.ي</span>
              </div>
            ` : ''}
            <div class="grand-total">
              <span>المبلغ المطلوب:</span>
              <span>${formatNumber(sale.grandTotal)} ر.ي</span>
            </div>
            ${sale.saleType === 'دين' ? `
              <div class="info-row">
                <span>المدفوع:</span>
                <span>${formatNumber(sale.paid)} ر.ي</span>
              </div>
              <div class="info-row" style="font-weight: bold;">
                <span>المتبقي ديناً:</span>
                <span>${formatNumber(sale.remaining)} ر.ي</span>
              </div>
            ` : ''}
          </div>

          <div class="policy-box">
            <strong>شروط وسياسة المحل:</strong><br/>
            ${SHOP_POLICIES.generalWarranty}<br/>
            ${SHOP_POLICIES.noTasteReturn}
          </div>

          <div class="footer">
            شكراً لزيارتكم • نسعد بخدمتكم دائماً
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Alert Notification Toast */}
      {actionAlert && (
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-lg transition animate-in fade-in slide-in-from-top-2 ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' 
            : 'bg-indigo-950/80 border-indigo-500/60 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold">{actionAlert.message}</span>
          </div>
          <button 
            onClick={() => setActionAlert(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Main Mode Selector Tabs */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2">
          <button
            id="tab-cashier-purchase"
            onClick={() => setCashierMode('purchase')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
              cashierMode === 'purchase'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>📦 كاشير الشراء وإدخال فواتير البضاعة بالباركود</span>
          </button>

          <button
            id="tab-cashier-sales"
            onClick={() => setCashierMode('sales')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
              cashierMode === 'sales'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>🛒 كاشير المبيعات ونقطة البيع (POS)</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-[#0F172A] px-3 py-1.5 rounded-xl border border-slate-700/70">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>إدخال فائق السرعة والانتقال الفوري بزر <strong>Enter</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PURCHASE INVOICE & FAST SEQUENTIAL ENTRY (قسم الشراء بالباركود) */}
      {/* ========================================================================= */}
      {cashierMode === 'purchase' && (
        <div className="space-y-5">
          
          {/* Top Bar: Invoice Header & Setup Controls */}
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3.5 mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>فاتورة مشتريات وبضاعة جديدة</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-mono-num font-bold">
                      {invoiceNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    توليد الباركود آلياً وإدخال متتالي سريع: اسم الصنف ↵ التكلفة ↵ البيع ↵ الكمية
                  </p>
                </div>
              </div>

              {/* Status / Existing Invoice Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#0F172A] p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => {
                      setInvoiceType('new');
                      setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
                      setPurchaseItems([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      invoiceType === 'new' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    فاتورة جديدة ✨
                  </button>
                  <button
                    onClick={() => setInvoiceType('existing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      invoiceType === 'existing' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    استكمال سابقة ({savedInvoices.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Invoices Quick Drawer if Selected */}
            {invoiceType === 'existing' && savedInvoices.length > 0 && (
              <div className="mb-4 p-3 bg-[#0F172A] rounded-xl border border-amber-500/30">
                <span className="text-xs font-bold text-amber-400 block mb-2">اختر فاتورة سابقة لاستكمال إدخالها أو تعديلها:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {savedInvoices.map(inv => (
                    <button
                      key={inv.id}
                      onClick={() => handleSelectExistingInvoice(inv)}
                      className={`px-3 py-2 rounded-xl text-xs text-right border transition shrink-0 ${
                        invoiceNumber === inv.invoiceNumber 
                          ? 'bg-amber-500/20 border-amber-400 text-white font-bold' 
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="font-mono-num font-bold text-amber-300">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400">{inv.supplierName} • {inv.items?.length || 0} صنف</div>
                      <div className="text-[10px] text-emerald-400 font-mono-num">{formatNumber(inv.totalPurchaseCost)} ر.ي</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Header Configuration Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              
              {/* 1. Invoice Number */}
              <div>
                <label className="text-slate-400 font-bold block mb-1">رقم الفاتورة / السند:</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                  placeholder="مثال: INV-10025"
                />
              </div>

              {/* 2. Invoice Date */}
              <div>
                <label className="text-slate-400 font-bold block mb-1">تاريخ الفاتورة (اليوم):</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-num font-bold focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* 3. Supplier (المورد) */}
              <div>
                <label className="text-slate-400 font-bold block mb-1">اسم المورد / التاجر:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    list="suppliers-datalist"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 focus:outline-hidden"
                    placeholder="اختر أو اكتب اسم المورد..."
                  />
                  <datalist id="suppliers-datalist">
                    {supplierProfiles.map(s => (
                      <option key={s.id} value={s.name}>{s.category || 'قطع غيار'} - {s.location || ''}</option>
                    ))}
                    <option value="محمد مياس">محمد مياس (قطع غيار)</option>
                    <option value="فايز أبو علي">فايز أبو علي (إكسسوارات وجوالات)</option>
                    <option value="عمر القاسمي">عمر القاسمي (شاشات وقطع)</option>
                    <option value="خليل الأغبري">خليل الأغبري (أدوات وصيانة)</option>
                    <option value="العبصري">العبصري</option>
                    <option value="المصنف">المصنف</option>
                    <option value="أبو صالح الأقمري">أبو صالح الأقمري</option>
                  </datalist>
                </div>
              </div>

              {/* 3. Payment Method */}
              <div>
                <label className="text-slate-400 font-bold block mb-1">طريقة سداد المورد:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="نقد">💵 نقد كاش من الصندوق اليومي</option>
                  <option value="آجل">📝 آجل وقيد دين في حساب التاجر</option>
                  <option value="حوالة">🏦 حوالة صرافة / كريمي / جوالي</option>
                </select>
              </div>

              {/* 4. Barcode Generation Mode & Default Category */}
              <div>
                <label className="text-slate-400 font-bold block mb-1">نوعية الباركود والتصنيف:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoBarcode(!autoBarcode)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      autoBarcode 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="توليد الباركود تلقائياً لكل صنف جديد عند الإدخال"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                    <span>{autoBarcode ? 'توليد تلقائي ⚡' : 'إدخال يدوي'}</span>
                  </button>

                  <select
                    value={defaultCategory}
                    onChange={(e) => {
                      setDefaultCategory(e.target.value as any);
                      setItemCategory(e.target.value as any);
                    }}
                    className="bg-[#0F172A] border border-slate-700 rounded-xl px-2 py-2 text-white text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="قطع غيار">قطع غيار</option>
                    <option value="إكسسوارات">إكسسوارات</option>
                    <option value="شرايح">شرايح</option>
                    <option value="أدوات صيانة">أدوات صيانة</option>
                    <option value="جوالات مستعملة/جديدة">جوالات</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEQUENTIAL ENTER-KEY DRIVEN FAST ITEM ENTRY (محرك الإدخال فائق السرعة) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-2 border-indigo-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-sm font-black text-white">
                  محرك الإدخال السريع (اضغط <kbd className="bg-indigo-600 px-1.5 py-0.5 rounded text-[11px] font-mono text-white font-bold">Enter ↵</kbd> للانتقال التلقائي بين الخانات):
                </h4>
              </div>
              <span className="text-[11px] text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                1. الاسم ↵ 2. التكلفة ↵ 3. البيع ↵ 4. الكمية ↵ (إضافة فورية للجدول)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              
              {/* Field 1: Item Name */}
              <div className="sm:col-span-4">
                <label className="text-xs font-bold text-indigo-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>اسم الصنف:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">اضغط Enter</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  list="inventory-suggestions"
                  placeholder="مثال: شاشة سامسونج A12 أصلية..."
                  className="w-full bg-[#0B1120] border-2 border-indigo-500/60 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 shadow-inner"
                />
                <datalist id="inventory-suggestions">
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.name}>{i.category} - سعر البيع: {i.sellingPrice}</option>
                  ))}
                  <option value="شاحن آيفون 20 واط أصلي" />
                  <option value="كيبل تايب سي قماش سريع" />
                  <option value="سماعة بلوتوث أيربودز" />
                  <option value="لاصق حماية زجاجي 11D" />
                  <option value="بطارية سامسونج A20" />
                  <option value="بيت شحن ريدمي نوت 11" />
                  <option value="شاشة ريدمي نوت 10 أصلية وكالة" />
                </datalist>
              </div>

              {/* Field 2: Purchase Price / Cost */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-rose-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    <span>سعر الشراء:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Enter</span>
                </label>
                <div className="relative">
                  <input
                    ref={costInputRef}
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    onKeyDown={handleCostKeyDown}
                    placeholder="0"
                    className="w-full bg-[#0B1120] border-2 border-rose-500/50 focus:border-rose-400 rounded-xl px-3.5 py-2.5 text-rose-300 font-mono-num font-black text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 text-left"
                  />
                  <span className="absolute left-2.5 top-3 text-[10px] text-slate-500">ر.ي</span>
                </div>
              </div>

              {/* Field 3: Selling Price */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    <span>سعر البيع:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Enter</span>
                </label>
                <div className="relative">
                  <input
                    ref={sellInputRef}
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    onKeyDown={handleSellKeyDown}
                    placeholder="0"
                    className="w-full bg-[#0B1120] border-2 border-emerald-500/50 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-emerald-300 font-mono-num font-black text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 text-left"
                  />
                  <span className="absolute left-2.5 top-3 text-[10px] text-slate-500">ر.ي</span>
                </div>
              </div>

              {/* Field 4: Quantity */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-amber-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                    <span>الكمية:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Enter = إضافة</span>
                </label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={handleQtyKeyDown}
                  placeholder="1"
                  className="w-full bg-[#0B1120] border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-amber-300 font-mono-num font-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 text-center"
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <button
                  id="btn-add-purchase-item"
                  type="button"
                  onClick={handleAddItemToPurchaseInvoice}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-lg active:scale-95 transition cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة للجدول ⚡</span>
                </button>
              </div>

            </div>

            {/* Secondary Barcode / Category Override (if manual barcode or custom category is wanted) */}
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">تصنيف الصنف:</span>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value as any)}
                  className="bg-[#0B1120] border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                >
                  <option value="قطع غيار">قطع غيار</option>
                  <option value="إكسسوارات">إكسسوارات</option>
                  <option value="شرايح">شرايح</option>
                  <option value="أدوات صيانة">أدوات صيانة</option>
                  <option value="جوالات مستعملة/جديدة">جوالات</option>
                </select>
              </div>

              {!autoBarcode && (
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <span className="text-slate-400">الباركود اليدوي:</span>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="امسح أو اكتب الباركود..."
                    className="flex-1 bg-[#0B1120] border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                  />
                </div>
              )}

              {/* Instant Profit Preview for the current typed item */}
              {Number(purchasePrice) > 0 && Number(sellingPrice) > 0 && (
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl text-emerald-300 text-xs font-bold">
                  <span>ربح الحبة الواحدة:</span>
                  <span className="font-mono-num">{formatNumber(Number(sellingPrice) - Number(purchasePrice))} ر.ي</span>
                  <span>({(((Number(sellingPrice) - Number(purchasePrice)) / Number(purchasePrice)) * 100).toFixed(0)}%)</span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INVOICE SUMMARY STATS & ACTION CONTROLS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
            
            <div className="bg-[#1E293B] border border-slate-700/80 p-3.5 rounded-2xl">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي عدد الأصناف / القطع:</span>
              <span className="text-lg font-black text-white font-mono-num">
                {purchaseItems.length} <span className="text-xs font-normal text-slate-400">صنف</span> ({totalItemsCount} <span className="text-xs font-normal text-slate-400">قطعة</span>)
              </span>
            </div>

            <div className="bg-[#1E293B] border border-rose-500/30 p-3.5 rounded-2xl">
              <span className="text-[11px] text-rose-300 block mb-1">إجمالي تكلفة الشراء:</span>
              <span className="text-lg font-black text-rose-400 font-mono-num">
                {formatNumber(totalPurchaseCost)} <span className="text-xs font-normal text-slate-400">ر.ي</span>
              </span>
            </div>

            <div className="bg-[#1E293B] border border-emerald-500/30 p-3.5 rounded-2xl">
              <span className="text-[11px] text-emerald-300 block mb-1">إجمالي قيمة البيع المتوقعة:</span>
              <span className="text-lg font-black text-emerald-400 font-mono-num">
                {formatNumber(totalSellingValue)} <span className="text-xs font-normal text-slate-400">ر.ي</span>
              </span>
            </div>

            <div className="bg-[#1E293B] border border-indigo-500/30 p-3.5 rounded-2xl">
              <span className="text-[11px] text-indigo-300 block mb-1">الربح المقدر للفاتورة:</span>
              <span className="text-lg font-black text-indigo-400 font-mono-num">
                +{formatNumber(expectedProfit)} <span className="text-xs font-normal text-slate-400">ر.ي</span>
                <span className="text-[11px] text-slate-400 font-normal mr-1">({profitMarginPercent}%)</span>
              </span>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* PURCHASE ITEMS TABLE (جدول أصناف الفاتورة التفاعلي) */}
          {/* ========================================================================= */}
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            
            <div className="p-4 bg-[#182234] border-b border-slate-700/80 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h4 className="font-black text-white text-sm">
                  جدول أصناف الفاتورة الحالية ({purchaseItems.length} صنف)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintAllBarcodes}
                  disabled={purchaseItems.length === 0}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
                  title="طباعة ملصقات الباركود لجميع أصناف الفاتورة"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة كافة ملصقات الباركود</span>
                </button>

                <button
                  id="btn-save-post-invoice"
                  onClick={handleSaveAndPostPurchaseInvoice}
                  disabled={purchaseItems.length === 0}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-md active:scale-95 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وترحيل الفاتورة 💾</span>
                </button>
              </div>
            </div>

            {purchaseItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Barcode className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold">لا توجد أصناف مدخلة في الفاتورة بعد</p>
                <p className="text-xs text-slate-500 mt-1">
                  اكتب اسم الصنف في المحرك أعلاه واضغط Enter للانتقال السريع والإضافة الفورية للجدول
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0F172A] text-slate-400 font-bold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">الباركود</th>
                      <th className="py-3 px-3">اسم الصنف</th>
                      <th className="py-3 px-3">التصنيف</th>
                      <th className="py-3 px-3">سعر الشراء</th>
                      <th className="py-3 px-3">سعر البيع</th>
                      <th className="py-3 px-3 text-center">الكمية</th>
                      <th className="py-3 px-3">إجمالي الشراء</th>
                      <th className="py-3 px-3">الربح المتوقع</th>
                      <th className="py-3 px-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    {purchaseItems.map((item, idx) => {
                      const itemTotalCost = item.purchasePrice * item.quantity;
                      const itemTotalSell = item.sellingPrice * item.quantity;
                      const itemProfit = itemTotalSell - itemTotalCost;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-3 text-slate-500 font-mono-num">{idx + 1}</td>
                          
                          {/* Barcode with Quick Print */}
                          <td className="py-3 px-3">
                            <BarcodeBadge
                              value={item.barcode}
                              itemName={item.name}
                              price={item.sellingPrice}
                              size="sm"
                              showPrintBtn={true}
                            />
                          </td>

                          <td className="py-3 px-3 font-bold text-white max-w-[200px] truncate">
                            {item.name}
                          </td>

                          <td className="py-3 px-3">
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px]">
                              {item.category}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-rose-300 font-mono-num font-bold">
                            {formatNumber(item.purchasePrice)} ر.ي
                          </td>

                          <td className="py-3 px-3 text-emerald-300 font-mono-num font-bold">
                            {formatNumber(item.sellingPrice)} ر.ي
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="bg-[#0F172A] border border-amber-500/40 text-amber-300 px-2 py-1 rounded-lg font-mono-num font-black text-xs">
                              {item.quantity}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-rose-400 font-mono-num font-bold">
                            {formatNumber(itemTotalCost)} ر.ي
                          </td>

                          <td className="py-3 px-3 text-indigo-300 font-mono-num font-bold">
                            +{formatNumber(itemProfit)} ر.ي
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleRemovePurchaseItem(item.id)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 transition cursor-pointer"
                              title="حذف من الفاتورة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SALES POS CASHIER (قسم المبيعات ونقطة البيع) */}
      {/* ========================================================================= */}
      {cashierMode === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left / Main Column: Products Selection & Barcode Scanning */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Barcode Search & Fast Scan Input */}
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 shadow-md">
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-emerald-400" />
                  <span>مسح الباركود السريع أو البحث عن صنف:</span>
                </span>
                <span className="text-[10px] text-slate-400">امسح بجهاز الباركود أو اكتب واضغط Enter</span>
              </label>
              <div className="relative">
                <input
                  ref={posBarcodeInputRef}
                  type="text"
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  onKeyDown={handlePOSBarcodeScan}
                  placeholder="امسح الباركود هنا أو اكتب اسم المنتج..."
                  className="w-full bg-[#0F172A] border-2 border-emerald-500/50 focus:border-emerald-400 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (salesSearch.trim()) {
                      const found = inventoryItems.find(i => i.name.includes(salesSearch.trim()) || i.barcode === salesSearch.trim());
                      if (found) handleAddProductToCart(found);
                    }
                  }}
                  className="absolute left-2.5 top-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>
            </div>

            {/* Quick Catalog / Common Items Grid */}
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 shadow-md">
              <h4 className="text-xs font-black text-slate-300 mb-3 flex items-center justify-between">
                <span>الأصناف والمخزون المتاح للبيع السريع ({inventoryItems.length} صنف):</span>
                <span className="text-[11px] text-emerald-400">انقر على الصنف لإضافته للسلة</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {inventoryItems
                  .filter(item => !salesSearch || item.name.toLowerCase().includes(salesSearch.toLowerCase()) || (item.barcode && item.barcode.includes(salesSearch)))
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAddProductToCart(item)}
                      className="p-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/50 text-right transition cursor-pointer flex flex-col justify-between group active:scale-95"
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 block">{item.category}</span>
                        <span className="text-xs font-bold text-white block truncate group-hover:text-emerald-300">
                          {item.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-xs">
                        <span className="font-mono-num font-black text-emerald-400">
                          {formatNumber(item.sellingPrice)} ر.ي
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono-num">
                          مخزون: {item.quantity}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

          </div>

          {/* Right Column: POS Cart & Checkout Drawer */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl">
              
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-black text-white">
                    سلة المبيعات الحالية ({salesCart.length})
                  </h4>
                </div>
                {salesCart.length > 0 && (
                  <button
                    onClick={() => setSalesCart([])}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-bold"
                  >
                    تفريغ السلة
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {salesCart.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-bold">
                  السلة فارغة، امسح الباركود أو انقر على صنف لإضافته
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 mb-4">
                  {salesCart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-[#0F172A] border border-slate-700/60 text-xs">
                      <div className="truncate max-w-[140px]">
                        <span className="font-bold text-white block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono-num">{formatNumber(item.sellingPrice)} ر.ي</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSalesCart(prev => prev.map(p => p.id === item.id ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p));
                          }}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono-num font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => {
                            setSalesCart(prev => prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p));
                          }}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                        <span className="font-mono-num font-bold text-emerald-400 w-16 text-left">
                          {formatNumber(item.sellingPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => setSalesCart(prev => prev.filter(p => p.id !== item.id))}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer & Payment Type Options */}
              <div className="space-y-3 pt-3 border-t border-slate-700 text-xs">
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">اسم العميل:</label>
                    <input
                      type="text"
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      placeholder="زبون نقدي..."
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">رقم الهاتف:</label>
                    <input
                      type="text"
                      value={posCustomerPhone}
                      onChange={(e) => setPosCustomerPhone(e.target.value)}
                      placeholder="77XXXXXXX"
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono-num"
                    />
                  </div>
                </div>

                {/* Sale Type: Cash or Credit/Debt */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">طريقة الدفع:</label>
                    <select
                      value={posSaleType}
                      onChange={(e) => setPosSaleType(e.target.value as any)}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                    >
                      <option value="نقد">💵 نقد كاش</option>
                      <option value="دين">📝 آجل / دين على الحساب</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">خصم (إن وجد):</label>
                    <input
                      type="number"
                      value={posDiscount}
                      onChange={(e) => setPosDiscount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-2.5 py-1.5 text-rose-300 font-mono-num font-bold text-left"
                    />
                  </div>
                </div>

                {/* Debt details if posSaleType === 'دين' */}
                {posSaleType === 'دين' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-400 block">بيانات الدين والضمانة وموعد السداد:</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={posGuarantor}
                        onChange={(e) => setPosGuarantor(e.target.value)}
                        placeholder="اسم الضمين..."
                        className="bg-[#0F172A] border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                      />
                      <input
                        type="date"
                        value={posDueDate}
                        onChange={(e) => setPosDueDate(e.target.value)}
                        className="bg-[#0F172A] border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono-num"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={posWorkplace}
                        onChange={(e) => setPosWorkplace(e.target.value)}
                        placeholder="مكان العمل / الوظيفة..."
                        className="bg-[#0F172A] border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                      />
                      <input
                        type="number"
                        value={posPaidAmount}
                        onChange={(e) => setPosPaidAmount(e.target.value)}
                        placeholder="المدفوع مقدماً (0)..."
                        className="bg-[#0F172A] border border-slate-700 rounded-lg px-2 py-1 text-emerald-300 text-xs font-mono-num"
                      />
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700 space-y-1.5 font-bold">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono-num text-white">{formatNumber(cartSubtotal)} ر.ي</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="flex items-center justify-between text-rose-400">
                      <span>الخصم:</span>
                      <span className="font-mono-num">-{formatNumber(discountVal)} ر.ي</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-base pt-1 border-t border-slate-700">
                    <span className="text-white">المبلغ الصافي:</span>
                    <span className="font-mono-num text-emerald-400 text-lg font-black">
                      {formatNumber(cartGrandTotal)} ر.ي
                    </span>
                  </div>
                </div>

                {/* Complete Sale Button */}
                <button
                  id="btn-complete-pos-sale"
                  onClick={handleCompletePOSSale}
                  disabled={salesCart.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer min-h-[46px]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>إتمام البيع وترحيل الفاتورة ⚡</span>
                </button>

              </div>

            </div>

            {/* Last Sale Print Voucher */}
            {lastCompletedSale && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-300 block font-bold">آخر فاتورة تم إتمامها:</span>
                  <span className="text-sm font-black text-white">
                    {lastCompletedSale.customer} ({formatNumber(lastCompletedSale.grandTotal)} ر.ي)
                  </span>
                </div>
                <button
                  onClick={() => handlePrintReceipt(lastCompletedSale)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة</span>
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
