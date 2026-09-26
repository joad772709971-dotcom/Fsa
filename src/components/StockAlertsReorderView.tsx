import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShoppingCart,
  Send,
  Printer,
  Copy,
  Check,
  Plus,
  Trash2,
  Boxes,
  Building2,
  Phone,
  Share2,
  Sparkles,
  Search,
  Image as ImageIcon,
  Camera,
  Upload,
  X,
  ExternalLink,
  MessageCircle,
  PackageCheck,
  FileText,
} from 'lucide-react';
import { InventoryItem, Supplier } from '../types';
import { formatCurrency } from '../utils/calculations';
import { printHtmlElement } from '../utils/printHelper';

interface StockAlertsReorderViewProps {
  inventory: InventoryItem[];
  suppliers: Supplier[];
}

export interface OrderItem {
  itemId: string;
  name: string;
  category: string;
  currentStock: number;
  orderQuantity: number;
  expectedCost: number;
  supplierName: string;
  supplierPhone?: string;
  notes?: string;
  itemImage?: string; // Base64 data URL or photo preview
}

export const StockAlertsReorderView: React.FC<StockAlertsReorderViewProps> = ({
  inventory,
  suppliers,
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [customOrderItems, setCustomOrderItems] = useState<OrderItem[]>([]);
  const [newCustomItemName, setNewCustomItemName] = useState('');
  const [newCustomQty, setNewCustomQty] = useState(1);
  const [newCustomSupplier, setNewCustomSupplier] = useState('مؤسسة العبصري لقطع الغيار');
  const [newCustomNotes, setNewCustomNotes] = useState('');
  const [newCustomImage, setNewCustomImage] = useState<string>('');

  // Selected item modal for preview or photo attach
  const [selectedItemForPhoto, setSelectedItemForPhoto] = useState<OrderItem | null>(null);

  // Find all low stock items (quantity <= minQuantity or quantity <= 2)
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => {
      const min = item.minQuantity !== undefined ? item.minQuantity : 2;
      return item.quantity <= min;
    });
  }, [inventory]);

  // Prepared order list (from low stock + custom additions)
  const orderList = useMemo(() => {
    const fromStock: OrderItem[] = lowStockItems.map((item) => {
      const matchedSup = suppliers.find((s) => s.name === item.supplierName);
      return {
        itemId: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.quantity,
        orderQuantity: Math.max(1, (item.minQuantity || 3) * 2 - item.quantity),
        expectedCost: item.costPrice,
        supplierName: item.supplierName || 'مؤسسة العبصري لقطع الغيار',
        supplierPhone: matchedSup?.phone || '',
      };
    });

    return [...fromStock, ...customOrderItems];
  }, [lowStockItems, customOrderItems, suppliers]);

  // Filtered by supplier
  const filteredOrderList = useMemo(() => {
    if (selectedSupplier === 'all') return orderList;
    return orderList.filter((item) => item.supplierName.includes(selectedSupplier));
  }, [orderList, selectedSupplier]);

  // Total order expected amount
  const totalOrderAmount = useMemo(() => {
    return filteredOrderList.reduce((sum, item) => sum + item.orderQuantity * item.expectedCost, 0);
  }, [filteredOrderList]);

  // Supplier phone lookup
  const getSupplierPhone = (supName: string) => {
    const s = suppliers.find((item) => item.name.includes(supName) || supName.includes(item.name));
    return s?.phone?.replace(/[^0-9]/g, '') || '';
  };

  // Generate WhatsApp formatted text
  const generateWhatsAppMessage = () => {
    let msg = `*طلبية بضاعة وقطع غيار - محل مصعب الصوفي للجوالات*\n`;
    msg += `التاريخ: ${new Date().toLocaleDateString('ar-YE')}\n`;
    msg += `المورد: ${selectedSupplier === 'all' ? 'عام' : selectedSupplier}\n`;
    msg += `------------------------------------\n`;

    filteredOrderList.forEach((item, index) => {
      msg += `*${index + 1}. ${item.name}*\n`;
      msg += `   • الكمية المطلوبة: *${item.orderQuantity} حبة*\n`;
      if (item.notes) {
        msg += `   • ملاحظة: ${item.notes}\n`;
      }
      if (item.itemImage) {
        msg += `   • (مرفق صورة توضيحية للقطعة المطلوبة أدناه)\n`;
      }
    });

    msg += `------------------------------------\n`;
    msg += `يرجى التجهيز وإفادتنا بالأسعار والفاتورة فوراً. شاكرين تعاونكم.`;
    return msg;
  };

  const handleCopyOrderText = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Direct WhatsApp Send (with supplier phone or prompt)
  const handleOpenWhatsApp = (phoneParam?: string) => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    let targetPhone = phoneParam || (selectedSupplier !== 'all' ? getSupplierPhone(selectedSupplier) : '');
    
    // If target phone has Yemen local 77x/73x/71x/70x, prefix with country code 967
    if (targetPhone.length === 9 && (targetPhone.startsWith('7') || targetPhone.startsWith('0'))) {
      targetPhone = '967' + targetPhone.replace(/^0+/, '');
    }

    if (targetPhone) {
      window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
  };

  // Handle image upload for custom piece
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachImageToExisting = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (file && selectedItemForPhoto) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCustomOrderItems((prev) => {
          const index = prev.findIndex((i) => i.itemId === itemId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...updated[index], itemImage: dataUrl };
            return updated;
          } else {
            return [
              ...prev,
              {
                ...selectedItemForPhoto,
                itemImage: dataUrl,
              },
            ];
          }
        });
        setSelectedItemForPhoto((prev) => (prev ? { ...prev, itemImage: dataUrl } : null));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomItemName.trim()) return;

    const matchedSup = suppliers.find((s) => s.name === newCustomSupplier);

    const newItem: OrderItem = {
      itemId: 'custom-' + Date.now(),
      name: newCustomItemName.trim(),
      category: 'spare_parts',
      currentStock: 0,
      orderQuantity: Number(newCustomQty) || 1,
      expectedCost: 0,
      supplierName: newCustomSupplier,
      supplierPhone: matchedSup?.phone || '',
      notes: newCustomNotes.trim() || undefined,
      itemImage: newCustomImage || undefined,
    };

    setCustomOrderItems([...customOrderItems, newItem]);
    setNewCustomItemName('');
    setNewCustomQty(1);
    setNewCustomNotes('');
    setNewCustomImage('');
  };

  const handleRemoveCustomItem = (itemId: string) => {
    setCustomOrderItems(customOrderItems.filter((i) => i.itemId !== itemId));
  };

  // Print Order List with Images
  const handlePrintOrder = () => {
    printHtmlElement('printable-stock-alerts-order', 'طلبية شراء نواقص وقطع غيار');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </span>
            <h1 className="text-xl font-black tracking-tight">
              تنبيهات نواقص المخزون ومولد طلبيات الشراء وصور القطع للواتساب
            </h1>
          </div>
          <p className="text-xs text-amber-200/80">
            تجميع النواقص تلقائياً، إرفاق صور القطع والشاشات المطلوبة، وإرسالها مباشرة بالواتساب للموردين (العبصري، القاسمي، خليل الأغبري) مع الطباعة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyOrderText}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'تم النسخ بنجاح' : 'نسخ الطلبية نصياً'}
          </button>

          <button
            onClick={handlePrintOrder}
            className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            طباعة الطلبية
          </button>

          <button
            onClick={() => handleOpenWhatsApp()}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
            إرسال بالواتساب للمورد
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500">الأصناف الناقصة حالياً في المحل</div>
          <div className="text-2xl font-black text-rose-700 flex items-center gap-2">
            {lowStockItems.length} صنف بحاجة لطلب
          </div>
          <div className="text-[11px] text-slate-400">الكمية بالمخزن وصلت للحد الحرج أو صفر</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500">إجمالي قطع الطلبية الحالية</div>
          <div className="text-2xl font-black text-indigo-700">
            {filteredOrderList.reduce((sum, item) => sum + item.orderQuantity, 0)} قطعة
          </div>
          <div className="text-[11px] text-slate-400">شاشات، بطاريات، شواحن، إكسسوارات</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500">التكلفة التقديرية للطلبية</div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalOrderAmount)}
          </div>
          <div className="text-[11px] text-slate-400">بناءً على أسعار الشراء السابقة المسجلة</div>
        </div>
      </div>

      {/* Supplier Filter & Add Custom Item Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Table & Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                قائمة أصناف الطلبية وصور القطع
              </h3>

              {/* Filter supplier */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">تصفية حسب المورد:</span>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">كافة الموردين ({orderList.length} صنف)</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>
                      {sup.name}
                    </option>
                  ))}
                  <option value="العبصري">مؤسسة العبصري لقطع الغيار</option>
                  <option value="القاسمي">القاسمي عمر</option>
                  <option value="الأغبري">خليل الأغبري</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">صورة القطعة</th>
                    <th className="p-3">اسم القطعة / الصنف</th>
                    <th className="p-3">المخزون الحالي</th>
                    <th className="p-3">الكمية المطلوبة</th>
                    <th className="p-3">المورد الموصى به</th>
                    <th className="p-3 text-center">إجراءات والواتساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrderList.map((item, idx) => (
                    <tr key={item.itemId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        {item.itemImage ? (
                          <div
                            onClick={() => setSelectedItemForPhoto(item)}
                            className="w-12 h-12 rounded-lg overflow-hidden border border-amber-400 cursor-pointer relative group shadow-xs"
                          >
                            <img
                              src={item.itemImage}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold">
                              عرض
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedItemForPhoto(item)}
                            className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-amber-700 transition-all text-[9px] font-bold"
                            title="إرفاق صورة القطعة"
                          >
                            <Camera className="w-4 h-4" />
                            <span>+ صورة</span>
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">{item.notes}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                            item.currentStock === 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.currentStock} متوفر
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg">
                          {item.orderQuantity} حبة
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{item.supplierName}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const singleMsg = encodeURIComponent(
                                `*طلب صنف من محل مصعب الصوفي:*\nالصنف: *${item.name}*\nالكمية المطلوبة: *${item.orderQuantity} حبة*\n${
                                  item.notes ? `ملاحظة: ${item.notes}\n` : ''
                                }يرجى التأكيد وتجهيز الفاتورة.`
                              );
                              const phone = getSupplierPhone(item.supplierName);
                              if (phone) {
                                window.open(`https://wa.me/967${phone.replace(/^0+/, '')}?text=${singleMsg}`, '_blank');
                              } else {
                                window.open(`https://api.whatsapp.com/send?text=${singleMsg}`, '_blank');
                              }
                            }}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors"
                            title="إرسال هذا الصنف فقط بالواتساب للمورد"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-700" />
                          </button>

                          {item.itemId.startsWith('custom-') && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomItem(item.itemId)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                              title="حذف هذا الطلب المخصص"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrderList.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                لا توجد نواقص مطابقة للمورد المحدد حالياً. يمكنك إضافة قطع يدوياً من النموذج الجانبي.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Add Custom Item with Photo & WhatsApp Preview */}
        <div className="space-y-4">
          {/* Add custom item with photo */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              إضافة قطعة أو طلب خاص مع صورة للطلبية
            </h3>

            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الصنف أو القطعة المطلوبة *</label>
                <input
                  type="text"
                  required
                  value={newCustomItemName}
                  onChange={(e) => setNewCustomItemName(e.target.value)}
                  placeholder="مثال: شاشة ردمي نوت 11 برو أصلية وكالة"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكمية المطلوبة</label>
                  <input
                    type="number"
                    min={1}
                    value={newCustomQty}
                    onChange={(e) => setNewCustomQty(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المورد</label>
                  <select
                    value={newCustomSupplier}
                    onChange={(e) => setNewCustomSupplier(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="مؤسسة العبصري لقطع الغيار">العبصري لقطع الغيار</option>
                    <option value="القاسمي عمر">القاسمي عمر</option>
                    <option value="خليل الأغبري">خليل الأغبري</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="مورد عام">مورد عام</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظة للقطعة (الموديل، الفلاتة، اللون)</label>
                <input
                  type="text"
                  value={newCustomNotes}
                  onChange={(e) => setNewCustomNotes(e.target.value)}
                  placeholder="مثال: إطار أسود فلاتة عريضة"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Photo Upload Box */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">صورة القطعة (اختياري للواتساب):</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 border-dashed rounded-xl cursor-pointer text-amber-800 font-bold transition-colors">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>{newCustomImage ? 'تغيير صورة القطعة' : 'التقاط أو رفع صورة القطعة'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {newCustomImage && (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                      <img src={newCustomImage} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewCustomImage('')}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                + إضافة الصنف للطلبية
              </button>
            </form>
          </div>

          {/* WhatsApp Text Preview Box */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                معاينة نص رسالة الواتساب
              </span>
              <button
                onClick={handleCopyOrderText}
                className="text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded transition-colors"
              >
                {copied ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>

            <pre className="text-[11px] font-sans text-slate-300 whitespace-pre-wrap bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto leading-relaxed">
              {generateWhatsAppMessage()}
            </pre>

            <button
              type="button"
              onClick={() => handleOpenWhatsApp()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              إرسال القائمة كاملة بالواتساب للمورد
            </button>
          </div>
        </div>
      </div>

      {/* Item Image / Attach Modal */}
      {selectedItemForPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-xs">{selectedItemForPhoto.name}</h3>
              </div>
              <button
                onClick={() => setSelectedItemForPhoto(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {selectedItemForPhoto.itemImage ? (
                <div className="space-y-3">
                  <div className="max-h-72 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img
                      src={selectedItemForPhoto.itemImage}
                      alt={selectedItemForPhoto.name}
                      className="max-h-72 w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">تم إرفاق صورة القطعة بنجاح</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItemForPhoto((prev) => (prev ? { ...prev, itemImage: undefined } : null));
                        setCustomOrderItems((prev) =>
                          prev.map((i) =>
                            i.itemId === selectedItemForPhoto.itemId ? { ...i, itemImage: undefined } : i
                          )
                        );
                      }}
                      className="text-rose-600 hover:text-rose-700 font-bold"
                    >
                      حذف الصورة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 space-y-3">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-slate-600 font-medium text-xs">
                    لم يتم إرفاق صورة لهذه القطعة بعد. يمكنك التقاط صورة من كاميرا الهاتف أو رفعها من المعرض لإرسالها بالواتساب للمورد.
                  </p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>رفع صورة جديدة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAttachImageToExisting(e, selectedItemForPhoto.itemId)}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setSelectedItemForPhoto(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Document */}
      <div id="printable-stock-alerts-order" className="hidden">
        <div className="p-8 font-sans space-y-6 text-slate-900 bg-white" dir="rtl">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">محل مصعب الصوفي للجوالات</h1>
              <p className="text-xs text-slate-600">طلب شراء ونواقص بضاعة وقطع غيار</p>
              <p className="text-[11px] text-slate-500">التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-700">
                المورد: {selectedSupplier === 'all' ? 'كافة الموردين' : selectedSupplier}
              </div>
              <div className="text-xs text-slate-500">عدد الأصناف: {filteredOrderList.length} صنف</div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-right text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-l border-slate-300">#</th>
                <th className="p-2 border-l border-slate-300">اسم الصنف / القطعة المطلوبة</th>
                <th className="p-2 border-l border-slate-300 text-center">الكمية المطلوبة</th>
                <th className="p-2 border-l border-slate-300">المورد المقترح</th>
                <th className="p-2">ملاحظات / وصف القطعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrderList.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border-l border-slate-300 font-mono">{idx + 1}</td>
                  <td className="p-2 border-l border-slate-300 font-bold">{item.name}</td>
                  <td className="p-2 border-l border-slate-300 text-center font-bold">
                    {item.orderQuantity} حبة
                  </td>
                  <td className="p-2 border-l border-slate-300">{item.supplierName}</td>
                  <td className="p-2 text-slate-600">{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures */}
          <div className="pt-12 flex justify-between text-xs font-bold border-t border-slate-300">
            <div>توقيع المسؤول / المحاسب: .................................</div>
            <div>ختم المحل: .................................</div>
          </div>
        </div>
      </div>
    </div>
  );
};
