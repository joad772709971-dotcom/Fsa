import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  CreditCard,
  Banknote,
  UserCheck,
  Camera,
  X,
  Smartphone,
  Wrench,
  Signal,
  Boxes,
  RotateCcw,
  Sparkles,
  DollarSign,
  QrCode,
} from 'lucide-react';
import { Transaction, InventoryItem, TransactionType } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { getBarcodeSVGString } from '../utils/barcode';
import { printHtmlElement } from '../utils/printHelper';
import { loadPriceMemory, learnOrUpdatePriceMemory } from '../utils/priceMemoryStorage';
import { PriceCategory } from '../types/pricing';

interface PosCartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  barcode?: string;
  type: TransactionType;
}

interface CashierPOSViewProps {
  transactions: Transaction[];
  onSaveTransactions: (newTxList: Transaction[]) => void;
  currentDate: string;
  inventory?: InventoryItem[];
}

export const CashierPOSView: React.FC<CashierPOSViewProps> = ({
  transactions,
  onSaveTransactions,
  currentDate,
  inventory = [],
}) => {
  // Quick Products Catalog for POS (Loaded from Price Memory seed + localStorage)
  const [posProducts, setPosProducts] = useState<PosCartItem[]>(() => {
    try {
      const memoryItems = loadPriceMemory();
      if (memoryItems && memoryItems.length > 0) {
        return memoryItems.map((m) => ({
          id: m.id,
          name: m.name,
          category: m.categoryNameAr,
          price: m.sellingPrice || (m.costPrice > 0 ? Math.round(m.costPrice * 1.3) : 500),
          cost: m.costPrice,
          quantity: 1,
          barcode: `${m.code}`,
          type: (m.category === 'screens' || m.category === 'spare_parts'
            ? 'maintenance'
            : m.category === 'balance'
            ? 'balance_hadi'
            : 'sale') as TransactionType,
        }));
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  // Reload when price memory updates
  useEffect(() => {
    const handleUpdate = () => {
      const memoryItems = loadPriceMemory();
      if (memoryItems && memoryItems.length > 0) {
        setPosProducts(
          memoryItems.map((m) => ({
            id: m.id,
            name: m.name,
            category: m.categoryNameAr,
            price: m.sellingPrice || (m.costPrice > 0 ? Math.round(m.costPrice * 1.3) : 500),
            cost: m.costPrice,
            quantity: 1,
            barcode: `${m.code}`,
            type: (m.category === 'screens' || m.category === 'spare_parts'
              ? 'maintenance'
              : m.category === 'balance'
              ? 'balance_hadi'
              : 'sale') as TransactionType,
          }))
        );
      }
    };
    window.addEventListener('price_memory_updated', handleUpdate);
    return () => window.removeEventListener('price_memory_updated', handleUpdate);
  }, []);

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCat, setNewProductCat] = useState('إكسسوارات');
  const [newProductPrice, setNewProductPrice] = useState<number | ''>('');
  const [newProductCost, setNewProductCost] = useState<number | ''>('');
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductType, setNewProductType] = useState<TransactionType>('sale');

  // Save posProducts and sync with priceMemoryStorage
  const savePosProducts = (items: PosCartItem[]) => {
    setPosProducts(items);
  };

  const handleCreateNewPosProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) {
      alert('يرجى كتابة اسم الصنف وسعر البيع');
      return;
    }

    const numCost = Number(newProductCost) || 0;
    const numPrice = Number(newProductPrice) || 0;

    let cat: PriceCategory = 'accessories';
    if (newProductCat.includes('شاشات')) cat = 'screens';
    else if (newProductCat.includes('صيانة') || newProductCat.includes('قطع')) cat = 'spare_parts';
    else if (newProductCat.includes('برمجة')) cat = 'software';
    else if (newProductCat.includes('رصيد')) cat = 'balance';

    // Auto-save into persistent offline memory
    learnOrUpdatePriceMemory(newProductName.trim(), numCost, numPrice, cat);

    const newItem: PosCartItem = {
      id: `p_${Date.now()}`,
      name: newProductName.trim(),
      category: newProductCat,
      price: numPrice,
      cost: numCost,
      quantity: 1,
      barcode: newProductBarcode.trim() || generateQuickBarcode(),
      type: newProductType,
    };

    savePosProducts([newItem, ...posProducts]);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductCost('');
    setNewProductBarcode('');
    setIsAddProductModalOpen(false);
  };

  function generateQuickBarcode(): string {
    return `${Date.now().toString().slice(-8)}`;
  }

  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('عميل نقدي');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debt' | 'transfer'>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidCashAmount, setPaidCashAmount] = useState<number>(0);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [completedInvoice, setCompletedInvoice] = useState<{
    id: string;
    date: string;
    time: string;
    items: PosCartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paid: number;
    change: number;
    customer: string;
    paymentMethod: string;
  } | null>(null);

  // Barcode Scanner Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotalCost = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  const netTotal = Math.max(0, cartSubtotal - discountAmount);
  const expectedProfit = Math.max(0, netTotal - cartTotalCost);
  const changeAmount = Math.max(0, paidCashAmount - netTotal);

  // Add Item to Cart
  const handleAddToCart = (product: PosCartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Update Cart Quantity
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  // Remove from cart
  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // Scan Barcode Submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = posProducts.find(
      (p) => p.barcode?.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched);
      setBarcodeInput('');
    } else {
      // Create quick on-the-fly item
      const newItem: PosCartItem = {
        id: `custom_${Date.now()}`,
        name: `صنف باركود (${barcodeInput})`,
        category: 'إكسسوارات',
        price: 1000,
        cost: 600,
        quantity: 1,
        barcode: barcodeInput.trim(),
        type: 'sale',
      };
      handleAddToCart(newItem);
      setBarcodeInput('');
    }
  };

  // Toggle Camera Barcode Scanner
  const startCameraScanner = async () => {
    try {
      setIsCameraActive(true);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('لم يتم السماح بالوصول للكاميرا أو لا توجد كاميرا متصلة. يرجى تفعيل إذن الكاميرا.');
      setIsCameraActive(false);
    }
  };

  const stopCameraScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  // Complete Sale / Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('السلة فارغة، أضف أصنافاً أولاً');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

    // Convert cart items to real Transactions
    const newTxList: Transaction[] = cart.map((item, idx) => {
      const itemProfit = Math.max(0, item.price * item.quantity - item.cost * item.quantity);
      return {
        id: `tx_pos_${Date.now()}_${idx}`,
        date: currentDate,
        time: timeStr,
        type: item.type,
        category:
          item.type === 'maintenance'
            ? 'maintenance'
            : item.type === 'sim'
            ? 'sims'
            : item.type.includes('balance')
            ? 'balance'
            : 'accessories',
        description: `${item.name} (${item.quantity} حبة) - كاشير`,
        itemCode: item.barcode || item.id,
        quantity: item.quantity,
        price: item.price * item.quantity,
        cost: item.cost * item.quantity,
        profit: itemProfit,
        customerName: customerName.trim() || 'عميل نقدي',
        paymentMethod: paymentMethod,
        notes: `فاتورة كاشير #${invoiceId} • خصم: ${discountAmount}`,
      };
    });

    onSaveTransactions(newTxList);

    setCompletedInvoice({
      id: invoiceId,
      date: currentDate,
      time: timeStr,
      items: [...cart],
      subtotal: cartSubtotal,
      discount: discountAmount,
      total: netTotal,
      paid: paidCashAmount || netTotal,
      change: changeAmount,
      customer: customerName || 'عميل نقدي',
      paymentMethod:
        paymentMethod === 'cash' ? 'نقداً (كاش)' : paymentMethod === 'debt' ? 'آجل (دين)' : 'تحويل بنكي',
    });

    // Reset Cart
    setCart([]);
    setDiscountAmount(0);
    setPaidCashAmount(0);
    setShowReceiptModal(true);
  };

  // Filter Products
  const categories = ['الكل', 'إكسسوارات', 'صيانة', 'شرائح', 'رصيد'];
  const filteredProducts = posProducts.filter((p) => {
    const matchesCat = activeCategory === 'الكل' || p.category === activeCategory;
    const matchesSearch =
      p.name.includes(searchQuery) || (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-950/20 shrink-0">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900">
              نظام الكاشير ونقاط البيع السريعة (POS)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              بيع بالباركود، فواتير حرارية 80mm/58mm، وقيد تلقائي في اليومية
            </p>
          </div>
        </div>

        {/* Barcode Quick Input & Camera Button */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                placeholder="امسح أو اكتب الباركود..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer"
            >
              إضافة
            </button>
          </form>

          <button
            onClick={isCameraActive ? stopCameraScanner : startCameraScanner}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
              isCameraActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isCameraActive ? 'إيقاف' : 'كاميرا'}</span>
          </button>
        </div>
      </div>

      {/* Camera Live Scanner Box (When active) */}
      {isCameraActive && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3 relative animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Camera className="w-4 h-4 animate-spin" />
              <span>ماسح الباركود بالكاميرا نشط — وجّه الكاميرا نحو كود السلعة</span>
            </div>
            <button
              onClick={stopCameraScanner}
              className="text-slate-400 hover:text-white text-xs bg-white/10 px-2.5 py-1 rounded-lg"
            >
              إغلاق
            </button>
          </div>

          <div className="relative w-full max-w-sm mx-auto h-48 bg-black rounded-xl overflow-hidden border-2 border-emerald-500/50 flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <div className="absolute inset-0 border-2 border-dashed border-emerald-400/80 m-6 rounded-lg pointer-events-none animate-pulse" />
          </div>

          <p className="text-[11px] text-center text-slate-400">
            يمكنك أيضاً كتابة رقم الباركود مباشرة في خانة الإدخال بالأعلى أو اختيار الصنف من القائمة أدناه.
          </p>
        </div>
      )}

      {/* Main POS Screen Split (Left: Cart & Checkout, Right: Products Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right 7 Cols: Products Catalog */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Category Filter & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-[140px] max-w-xs">
                  <input
                    type="text"
                    placeholder="بحث عن سلعة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف للكتالوج</span>
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">لا توجد أصناف في الكتالوج حالياً</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                يمكنك كتابة أو مسح الباركود مباشرة في الأعلى، أو الضغط على "إضافة صنف للكتالوج" لتسجيل أصناف جديدة بالأسعار والتكلفة.
              </p>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول صنف الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAddToCart(p)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-right flex flex-col justify-between group active:scale-95 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{p.barcode}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mb-1.5 group-hover:text-emerald-700">
                      {p.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <span className="font-mono font-black text-sm text-emerald-700">
                      {formatCurrency(p.price)}
                    </span>
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Left 5 Cols: Cart & Billing Screen */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">سلة المبيعات والفاتورة</h3>
              </div>
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                disabled={cart.length === 0}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إفراغ</span>
              </button>
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <ShoppingCart className="w-8 h-8 stroke-1 text-slate-300" />
                  <span>السلة فارغة. اضغط على أي صنف لإضافته للفاتورة.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatCurrency(item.price)} × {item.quantity} ={' '}
                        <strong className="text-slate-700">{formatCurrency(item.price * item.quantity)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-bold cursor-pointer transition-colors"
                        title="إنقاص الكمية"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-slate-900 text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-bold cursor-pointer transition-colors"
                        title="زيادة الكمية"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-rose-500 hover:bg-rose-50 active:bg-rose-100 flex items-center justify-center ml-1 cursor-pointer transition-colors"
                        title="حذف من السلة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Controls */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            
            {/* Customer & Payment Method */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم العميل:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">طريقة الدفع:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                >
                  <option value="cash">نقداً (كاش)</option>
                  <option value="debt">آجل (دين على العميل)</option>
                  <option value="transfer">تحويل بنكي / محفظة</option>
                </select>
              </div>
            </div>

            {/* Discount & Paid Amount */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">الخصم (ر.ي):</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">المستلم نقداً (للباقي):</label>
                <input
                  type="number"
                  min="0"
                  value={paidCashAmount || ''}
                  onChange={(e) => setPaidCashAmount(Number(e.target.value))}
                  placeholder="المبلغ المدفوع"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Totals Summary Box */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{formatCurrency(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>الخصم الممنوح:</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black border-t border-slate-800 pt-1.5">
                <span>صافي الفاتورة:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(netTotal)}</span>
              </div>
              {paidCashAmount > 0 && (
                <div className="flex justify-between text-xs text-cyan-300 border-t border-slate-800 pt-1">
                  <span>الباقي للعميل:</span>
                  <span className="font-mono font-bold">{formatCurrency(changeAmount)}</span>
                </div>
              )}
            </div>

            {/* Checkout & Print Buttons */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>إتمام البيع وطباعة الفاتورة الحرارية</span>
            </button>

          </div>
        </div>

      </div>

      {/* Instant Thermal Receipt Modal */}
      {showReceiptModal && completedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header / Actions */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-800">معاينة الفاتورة الحرارية (80mm)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printHtmlElement('thermal-receipt-printable', `فاتورة_${completedInvoice.id}`)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Thermal Slip Content (Print Area) */}
            <div id="thermal-receipt-printable" className="p-6 overflow-y-auto font-mono text-xs text-slate-900 bg-white space-y-3 leading-tight print:p-0">
              <div className="text-center border-b border-dashed border-slate-400 pb-3">
                <h3 className="font-black text-sm text-slate-950 font-sans">
                  محل مصعب الصوفي للجوالات
                </h3>
                <p className="text-[10px] text-slate-600 mt-0.5 font-sans">
                  صيانة وبرمجة وبيع الجوالات والإكسسوارات والشبكات
                </p>
                <div className="text-[10px] text-slate-500 mt-1">
                  رقم الفاتورة: <strong>#{completedInvoice.id}</strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  التاريخ: {completedInvoice.date} • {completedInvoice.time}
                </div>
              </div>

              <div className="text-[10px] border-b border-dashed border-slate-300 pb-2 space-y-1">
                <div className="flex justify-between">
                  <span>العميل:</span>
                  <span className="font-bold">{completedInvoice.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span>طريقة الدفع:</span>
                  <span>{completedInvoice.paymentMethod}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-[10px] border-b border-dashed border-slate-400 pb-2">
                <thead>
                  <tr className="border-b border-slate-200 text-right">
                    <th className="py-1">الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-left">السعر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{it.name}</td>
                      <td className="py-1 text-center">{it.quantity}</td>
                      <td className="py-1 text-left font-bold">{formatCurrency(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-1 text-xs pt-1 border-b border-dashed border-slate-400 pb-3">
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span>{formatCurrency(completedInvoice.subtotal)}</span>
                </div>
                {completedInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم:</span>
                    <span>-{formatCurrency(completedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1">
                  <span>الصافي المطلوب:</span>
                  <span>{formatCurrency(completedInvoice.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>المدفوع:</span>
                  <span>{formatCurrency(completedInvoice.paid)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>المتبقي:</span>
                  <span>{formatCurrency(completedInvoice.change)}</span>
                </div>
              </div>

              {/* Barcode / Footer */}
              <div className="text-center pt-2 space-y-2">
                <div
                  className="flex justify-center"
                  dangerouslySetInnerHTML={{
                    __html: getBarcodeSVGString(completedInvoice.id, 160, 45, true),
                  }}
                />
                <p className="text-[9px] text-slate-500 font-sans">
                  شكراً لزيارتكم • البضاعة المباعة ترد وتستبدل خلال 24 ساعة بموجب الفاتورة
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add New Product to POS Catalog Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">إضافة صنف جديد لكتالوج الكاشير</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPosProduct} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الصنف أو القطعة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شاحن أصلي وكالة، شاشة ردمي نوت 11..."
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">القسم:</label>
                  <select
                    value={newProductCat}
                    onChange={(e) => setNewProductCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                  >
                    <option value="إكسسوارات">إكسسوارات</option>
                    <option value="صيانة">صيانة</option>
                    <option value="شرائح">شرائح</option>
                    <option value="رصيد">رصيد</option>
                    <option value="جوالات">جوالات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">نوع الحركة:</label>
                  <select
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                  >
                    <option value="sale">مبيعات عادية</option>
                    <option value="maintenance">صيانة (مناصفة 50/50)</option>
                    <option value="sim">شرائح</option>
                    <option value="balance_hadi">رصيد الهادي (مياس)</option>
                    <option value="balance_qimma">رصيد الرقم (فايز)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">سعر البيع للزبون (ر.ي):</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">سعر التكلفة (ر.ي):</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الباركود (اختياري - سيتم توليده تلقائياً إن ترك فارغاً):</label>
                <input
                  type="text"
                  placeholder="امسح أو اكتب الباركود..."
                  value={newProductBarcode}
                  onChange={(e) => setNewProductBarcode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md cursor-pointer"
                >
                  حفظ الصنف في الكتالوج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
