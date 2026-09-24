import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Download,
  Calculator,
  Tag,
  Check,
  X,
  Smartphone,
  Wrench,
  Cpu,
  Layers,
  Sparkles,
  Signal,
  ArrowUpDown,
  Filter,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Printer,
  ChevronDown,
  ShieldCheck,
  Save,
  Lock,
  Unlock,
  Sliders,
  CheckSquare,
  Square,
  DollarSign,
  Truck,
  FolderSync,
  CornerDownLeft,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PriceMemoryItem, PriceCategory } from '../types/pricing';
import {
  loadPriceMemory,
  savePriceMemory,
  learnOrUpdatePriceMemory,
  deletePriceMemoryItem,
  resetPriceMemoryToDefaults,
  resetAllDamarPricesAndQuantitiesToZero,
  saveSinglePriceMemoryItem,
  calculateBalanceValues,
  normalizeArabic,
  bulkUpdatePriceMemory,
  bulkApplyAdjustment,
  bulkDeletePriceMemoryItems,
  BulkAdjustmentType,
} from '../utils/priceMemoryStorage';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { downloadExcelWorkbook } from '../utils/fileExportHelper';

interface CostPricingGuideViewProps {
  onSelectItemForVoucher?: (item: PriceMemoryItem) => void;
}

export const CostPricingGuideView: React.FC<CostPricingGuideViewProps> = ({
  onSelectItemForVoucher,
}) => {
  // Main data state
  const [items, setItems] = useState<PriceMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PriceCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'code' | 'profit' | 'costPrice' | 'sellingPrice' | 'name' | 'quantity'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Lock / Unlock Protection State
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [modifiedItemIds, setModifiedItemIds] = useState<Set<string>>(new Set());
  const [recentlySavedIds, setRecentlySavedIds] = useState<Set<string>>(new Set());

  // In-table working copy for rapid inline editing
  const [workingItems, setWorkingItems] = useState<Map<string, PriceMemoryItem>>(new Map());

  // Bulk Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBulkAdjustModalOpen, setIsBulkAdjustModalOpen] = useState(false);
  const [bulkAdjustType, setBulkAdjustType] = useState<BulkAdjustmentType>('increase_selling_percent');
  const [bulkAdjustValue, setBulkAdjustValue] = useState<string>('10');
  const [bulkSupplierName, setBulkSupplierName] = useState<string>('خليل الأغبري');
  const [bulkCategory, setBulkCategory] = useState<PriceCategory>('accessories');

  // Quick Add Row State
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState<PriceCategory>('accessories');
  const [quickCostPrice, setQuickCostPrice] = useState<number | ''>('');
  const [quickSellingPrice, setQuickSellingPrice] = useState<number | ''>('');
  const [quickQuantity, setQuickQuantity] = useState<number | ''>(10);
  const [quickMinAlert, setQuickMinAlert] = useState<number | ''>(2);
  const [quickSupplier, setQuickSupplier] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Edit / Add Modal State (Fallback / Detailed edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceMemoryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<PriceCategory>('accessories');
  const [formCostPrice, setFormCostPrice] = useState<number | ''>('');
  const [formSellingPrice, setFormSellingPrice] = useState<number | ''>('');
  const [formQuantity, setFormQuantity] = useState<number | ''>(10);
  const [formMinAlert, setFormMinAlert] = useState<number | ''>(2);
  const [formSupplier, setFormSupplier] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Balance Profit Live Calculator
  const [balanceCalcAmount, setBalanceCalcAmount] = useState<number | ''>(10000);
  const balanceResult = useMemo(() => {
    return calculateBalanceValues(Number(balanceCalcAmount) || 0);
  }, [balanceCalcAmount]);

  // Load items from local storage
  const reloadItems = () => {
    const loaded = loadPriceMemory();
    setItems(loaded);
    const map = new Map<string, PriceMemoryItem>();
    loaded.forEach((i) => map.set(i.id, { ...i }));
    setWorkingItems(map);
    setModifiedItemIds(new Set());
  };

  useEffect(() => {
    reloadItems();

    const handleUpdate = () => reloadItems();
    window.addEventListener('price_memory_updated', handleUpdate);
    return () => window.removeEventListener('price_memory_updated', handleUpdate);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Get current active items (merging working inline changes if unlocked)
  const currentDisplayItems = useMemo(() => {
    return items.map((item) => {
      if (!isLocked && workingItems.has(item.id)) {
        return workingItems.get(item.id)!;
      }
      return item;
    });
  }, [items, isLocked, workingItems]);

  // Filter & Sort items
  const filteredItems = useMemo(() => {
    let result = [...currentDisplayItems];

    if (selectedCategory !== 'all') {
      result = result.filter((i) => i.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = normalizeArabic(searchQuery);
      result = result.filter((item) => {
        if (item.code.toString() === searchQuery.trim()) return true;
        if (normalizeArabic(item.name).includes(q)) return true;
        if (item.aliases && item.aliases.some((a) => normalizeArabic(a).includes(q))) return true;
        if (item.supplierName && normalizeArabic(item.supplierName).includes(q)) return true;
        if (item.notes && normalizeArabic(item.notes).includes(q)) return true;
        return false;
      });
    }

    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'name') {
        valA = a.name;
        valB = b.name;
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [currentDisplayItems, selectedCategory, searchQuery, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = items.length;
    const accessoriesCount = items.filter((i) => i.category === 'accessories').length;
    const screensCount = items.filter((i) => i.category === 'screens').length;
    const sparePartsCount = items.filter((i) => i.category === 'spare_parts').length;
    const softwareCount = items.filter((i) => i.category === 'software').length;
    const balanceCount = items.filter((i) => i.category === 'balance').length;
    const phonesCount = items.filter((i) => i.category === 'phones').length;

    const itemsWithCost = items.filter((i) => i.costPrice > 0);
    const avgProfitPercent =
      itemsWithCost.length > 0
        ? Math.round(
            itemsWithCost.reduce((acc, i) => acc + (i.profitMarginPercent || 0), 0) / itemsWithCost.length
          )
        : 0;

    const totalStockQuantity = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
    const totalInventoryCost = items.reduce(
      (acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0),
      0
    );
    const totalInventorySalesValue = items.reduce(
      (acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.sellingPrice) || 0),
      0
    );
    const totalExpectedProfit = items.reduce(
      (acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.profit) || 0),
      0
    );
    const lowStockCount = items.filter(
      (i) => (Number(i.quantity) || 0) <= (i.minQuantityAlert ?? 2) && i.category !== 'software' && i.category !== 'balance'
    ).length;

    return {
      totalCount,
      accessoriesCount,
      screensCount,
      sparePartsCount,
      softwareCount,
      balanceCount,
      phonesCount,
      avgProfitPercent,
      totalStockQuantity,
      totalInventoryCost,
      totalInventorySalesValue,
      totalExpectedProfit,
      lowStockCount,
    };
  }, [items]);

  // Handle Inline cell modification
  const handleInlineChange = (
    id: string,
    field: 'name' | 'costPrice' | 'sellingPrice' | 'supplierName' | 'notes' | 'quantity',
    value: string | number
  ) => {
    setWorkingItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (!existing) return prev;

      const updated = { ...existing };
      if (field === 'costPrice') {
        updated.costPrice = Math.max(0, Number(value) || 0);
        updated.profit = Math.max(0, updated.sellingPrice - updated.costPrice);
        updated.profitMarginPercent =
          updated.costPrice > 0 ? Number(((updated.profit / updated.costPrice) * 100).toFixed(1)) : 100.0;
      } else if (field === 'sellingPrice') {
        updated.sellingPrice = Math.max(0, Number(value) || 0);
        updated.profit = Math.max(0, updated.sellingPrice - updated.costPrice);
        updated.profitMarginPercent =
          updated.costPrice > 0 ? Number(((updated.profit / updated.costPrice) * 100).toFixed(1)) : 100.0;
      } else if (field === 'quantity') {
        updated.quantity = Math.max(0, Number(value) || 0);
      } else if (field === 'name') {
        updated.name = String(value);
      } else if (field === 'supplierName') {
        updated.supplierName = String(value);
      } else if (field === 'notes') {
        updated.notes = String(value);
      }

      next.set(id, updated);
      return next;
    });

    setModifiedItemIds((prev) => new Set(prev).add(id));
  };

  // حفظ فوري وتلقائي لصنف واحد في الذاكرة الدائمة (يحتفظ باللي قبله تلقائياً)
  const handleAutoSaveSingleItem = (id: string) => {
    const item = workingItems.get(id);
    if (!item) return;

    saveSinglePriceMemoryItem(item);
    setRecentlySavedIds((prev) => new Set(prev).add(id));
    setModifiedItemIds((prev) => new Set(prev).add(id));

    // تحديث الحالة المحلية بانسيابية
    setItems((prev) => prev.map((i) => (i.id === id ? { ...item } : i)));
  };

  // زر تفعيل الإدخال السريع بالإنتر بضغطة واحدة
  const handleToggleQuickEntryMode = () => {
    if (isLocked) {
      setIsLocked(false);
      showNotification('⚡ تم فتح وضع الإدخال السريع! اكتب سعر الضمار ثم اضغط Enter للانتقال للكمية ثم للمنتج التالي مباشرة مع الحفظ التلقائي.');
      setTimeout(() => {
        const firstInput =
          document.querySelector<HTMLInputElement>('input[data-row-index="0"][data-field="costPrice"]') ||
          document.querySelector<HTMLInputElement>('input[data-row-index="0"][data-field="quantity"]');
        if (firstInput) {
          firstInput.focus();
          firstInput.select();
        }
      }, 120);
    } else {
      handleSaveAllInline();
    }
  };

  // تصفير جميع أسعار الضمار والكميات في المخزن للبدء من الصفر
  const handleZeroOutAll = () => {
    if (
      confirm(
        '⚠️ هل أنت متأكد تماماً من تصفير جميع أسعار الضمار (التكلفة = 0 ر.ي) وجميع الكميات بالمخزن (0 حبة) لكافة المنتجات؟\n\nستتمكن بعدها من البدء بتسجيل الضمار والكميات من الصفر عبر الإدخال السريع بالإنتر.'
      )
    ) {
      const zeroed = resetAllDamarPricesAndQuantitiesToZero();
      setItems(zeroed);
      const map = new Map<string, PriceMemoryItem>();
      zeroed.forEach((i) => map.set(i.id, { ...i }));
      setWorkingItems(map);
      setModifiedItemIds(new Set());
      setRecentlySavedIds(new Set());
      showNotification('✅ تم تصفير جميع أسعار الضمار والكميات بنجاح (0 ر.ي / 0 حبة). الجدول جاهز للإدخال الآن!');
    }
  };

  // التنقل بزر Enter والأسهم مع حفظ الصنف السابق فورياً
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: 'quantity' | 'costPrice' | 'sellingPrice',
    itemId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 1. حفظ الصنف الحالي فورياً ولحظياً في الذاكرة الدائمة (احتفظ باللي قبل)
      handleAutoSaveSingleItem(itemId);

      // 2. تحديد الخانة التالية للتنقل إليها
      let nextRow = rowIndex;
      let nextField: 'quantity' | 'costPrice' | 'sellingPrice' = 'quantity';

      if (field === 'costPrice') {
        // الانتقال من سعر الضمار إلى كمية نفس المنتج
        nextField = 'quantity';
        nextRow = rowIndex;
      } else if (field === 'quantity') {
        // الانتقال من الكمية إلى سعر ضمار المنتج التالي مباشرة!
        nextField = 'costPrice';
        nextRow = rowIndex + 1;
      } else if (field === 'sellingPrice') {
        // في حال كان في سعر البيع ينتقل لسعر ضمار المنتج التالي
        nextField = 'costPrice';
        nextRow = rowIndex + 1;
      }

      if (nextRow >= filteredItems.length) {
        showNotification('✅ تم الوصول لنهاية قائمة الأصناف، وجميع أسعار الضمار والكميات محفوظة بالكامل في الذاكرة الدائمة!');
        return;
      }

      // 3. البحث عن العنصر التالي والتركيز عليه وتحديد النص مباشرة
      const targetSelector = `input[data-row-index="${nextRow}"][data-field="${nextField}"]`;
      const targetEl = document.querySelector<HTMLInputElement>(targetSelector);
      if (targetEl) {
        targetEl.focus();
        targetEl.select();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleAutoSaveSingleItem(itemId);
      const nextRow = Math.min(filteredItems.length - 1, rowIndex + 1);
      const targetEl = document.querySelector<HTMLInputElement>(`input[data-row-index="${nextRow}"][data-field="${field}"]`);
      if (targetEl) {
        targetEl.focus();
        targetEl.select();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleAutoSaveSingleItem(itemId);
      const nextRow = Math.max(0, rowIndex - 1);
      const targetEl = document.querySelector<HTMLInputElement>(`input[data-row-index="${nextRow}"][data-field="${field}"]`);
      if (targetEl) {
        targetEl.focus();
        targetEl.select();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Save all inline modifications
  const handleSaveAllInline = () => {
    if (modifiedItemIds.size === 0) {
      showNotification('لم يتم تعديل أي صنف');
      setIsLocked(true);
      return;
    }

    const modifiedList: PriceMemoryItem[] = [];
    workingItems.forEach((item) => {
      if (modifiedItemIds.has(item.id)) {
        modifiedList.push(item);
      }
    });

    bulkUpdatePriceMemory(modifiedList);
    reloadItems();
    setIsLocked(true);
    showNotification(`تم بنجاح حفظ وتثبيت أسعار وكميات (${modifiedItemIds.size}) صنف في الذاكرة الدائمة وقفل الجدول.`);
  };

  // Cancel and discard inline modifications
  const handleCancelInline = () => {
    if (modifiedItemIds.size > 0) {
      if (!confirm('هل تريد إلغاء التعديلات غير المحفوظة والعودة للوضع المقفل؟')) {
        return;
      }
    }
    reloadItems();
    setIsLocked(true);
  };

  // Quick Add submit
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    try {
      const newItem = learnOrUpdatePriceMemory(
        quickName.trim(),
        Number(quickCostPrice) || 0,
        Number(quickSellingPrice) || 0,
        quickCategory,
        quickSupplier.trim() || undefined,
        undefined,
        quickQuantity !== '' ? Number(quickQuantity) : undefined,
        quickMinAlert !== '' ? Number(quickMinAlert) : undefined
      );

      reloadItems();
      setQuickName('');
      setQuickCostPrice('');
      setQuickSellingPrice('');
      setQuickQuantity(10);
      setQuickSupplier('');
      setIsQuickAddOpen(false);
      showNotification(`تمت إضافة الصنف (${newItem.name}) بنجاح إلى المخزن وجدول الضمار`);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الإضافة');
    }
  };

  // Selection toggle
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const allFilteredIds = filteredItems.map((i) => i.id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedItemIds.has(id));

    if (areAllSelected) {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // Apply Bulk Adjustment
  const handleApplyBulkAdjustment = () => {
    if (selectedItemIds.size === 0) return;

    const ids = Array.from(selectedItemIds);
    let val: string | number = bulkAdjustValue;

    if (bulkAdjustType === 'set_supplier') {
      val = bulkSupplierName;
    } else if (bulkAdjustType === 'set_category') {
      val = bulkCategory;
    } else {
      val = Number(bulkAdjustValue) || 0;
    }

    bulkApplyAdjustment(ids, bulkAdjustType, val);
    reloadItems();
    setIsBulkAdjustModalOpen(false);
    showNotification(`تم تطبيق التعديل الجماعي بنجاح على (${ids.length}) صنف.`);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedItemIds.size === 0) return;
    if (
      confirm(
        `هل أنت متأكد تماماً من حذف (${selectedItemIds.size}) صنف من جدول الأسعار؟ هذه العملية ستحذف الأصناف المحددة.`
      )
    ) {
      const ids = Array.from(selectedItemIds);
      bulkDeletePriceMemoryItems(ids);
      setSelectedItemIds(new Set());
      reloadItems();
      showNotification(`تم حذف (${ids.length}) صنف بنجاح من الذاكرة.`);
    }
  };

  // Reset to default seed
  const handleResetDefaults = () => {
    if (
      confirm(
        'هل تريد استعادة قائمة أسعار وضمار المحل الأصلية المعتمدة (162+ صنفاً)؟ ستتم استعادة جميع القيم الأولية للأقسام.'
      )
    ) {
      resetPriceMemoryToDefaults();
      reloadItems();
      showNotification('تمت استعادة جدول الأصناف المعتمدة بنجاح (162+ صنف)');
    }
  };

  // Export to Excel Workbook
  const handleExportExcel = () => {
    const dataRows = filteredItems.map((item) => ({
      'رقم الكود': item.code,
      'اسم الصنف / القطعة / الخدمة': item.name,
      'القسم': item.categoryNameAr,
      'الكمية المتوفرة بالمخزن': item.quantity ?? 0,
      'سعر الضمار (التكلفة)': item.costPrice,
      'سعر البيع المقترح': item.sellingPrice,
      'صافي الفائدة (الربح)': item.profit,
      'نسبة الفائدة %': `${item.profitMarginPercent}%`,
      'إجمالي قيمة الضمار': (item.quantity ?? 0) * item.costPrice,
      'إجمالي قيمة البيع': (item.quantity ?? 0) * item.sellingPrice,
      'إجمالي الأرباح المتوقعة': (item.quantity ?? 0) * item.profit,
      'المورد المعتاد': item.supplierName || 'محلي',
      'الملاحظات': item.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 35 },
      { wch: 22 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'مخزن_الضمار_والأسعار');
    downloadExcelWorkbook(wb, `المخزن_وجدول_الضمار_والاسعار_المعتمدة_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('تم تصدير ملف إكسل المخزن والأسعار بنجاح');
  };

  // Print Catalog
  const handlePrintCatalog = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة');
      return;
    }

    const rowsHtml = filteredItems
      .map(
        (i) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${i.code}</td>
        <td style="font-weight: bold;">${i.name}</td>
        <td>${i.categoryNameAr}</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold; color: #1e1b4b;">${i.quantity ?? 0}</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold; color: #b45309;">${formatNumber(
          i.costPrice
        )} ر.ي</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold;">${formatNumber(
          i.sellingPrice
        )} ر.ي</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold; color: #047857;">${formatNumber(
          i.profit
        )} ر.ي</td>
        <td style="text-align: center; font-family: monospace;">${i.profitMarginPercent}%</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold;">${formatNumber((i.quantity ?? 0) * i.costPrice)} ر.ي</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold;">${formatNumber((i.quantity ?? 0) * i.sellingPrice)} ر.ي</td>
        <td>${i.supplierName || '-'}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>المخزن وجدول الأسعار والضمار المعتمد - محل مصعب</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          h1 { margin: 0 0 6px 0; font-size: 20px; color: #0f172a; }
          .meta { font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          th { background: #0f172a; color: #fff; padding: 8px 6px; border: 1px solid #334155; text-align: right; }
          td { padding: 6px; border: 1px solid #cbd5e1; }
          tr:nth-child(even) { background: #f8fafc; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>المخزن: جدول الكميات والأسعار والضمار المعتمد والتكلفة - محل مصعب لخدمات الجوالات</h1>
          <div class="meta">
            تاريخ الطباعة: ${new Date().toLocaleDateString('ar-YE')} | عدد الأصناف: ${filteredItems.length} صنف | إجمالي القطع: ${stats.totalStockQuantity} | إجمالي قيمة المخزون ضمار: ${formatNumber(stats.totalInventoryCost)} ر.ي
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>اسم الصنف / القطعة / الخدمة</th>
              <th>القسم</th>
              <th style="text-align: center;">الكمية</th>
              <th style="text-align: center;">سعر الضمار</th>
              <th style="text-align: center;">سعر البيع</th>
              <th style="text-align: center;">صافي الفائدة</th>
              <th style="text-align: center;">النسبة</th>
              <th style="text-align: center;">إجمالي الضمار</th>
              <th style="text-align: center;">إجمالي البيع</th>
              <th>المورد المعتاد</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Open Edit modal
  const handleOpenEdit = (item: PriceMemoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormCostPrice(item.costPrice);
    setFormSellingPrice(item.sellingPrice);
    setFormQuantity(item.quantity !== undefined ? item.quantity : 10);
    setFormMinAlert(item.minQuantityAlert !== undefined ? item.minQuantityAlert : 2);
    setFormSupplier(item.supplierName || '');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Open Create modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(selectedCategory !== 'all' ? selectedCategory : 'accessories');
    setFormCostPrice('');
    setFormSellingPrice('');
    setFormQuantity(10);
    setFormMinAlert(2);
    setFormSupplier('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      learnOrUpdatePriceMemory(
        formName.trim(),
        Number(formCostPrice) || 0,
        Number(formSellingPrice) || 0,
        formCategory,
        formSupplier.trim() || undefined,
        formNotes.trim() || undefined,
        formQuantity !== '' ? Number(formQuantity) : undefined,
        formMinAlert !== '' ? Number(formMinAlert) : undefined
      );

      reloadItems();
      setIsModalOpen(false);
      showNotification(
        editingItem ? 'تم تحديث بيانات الصنف والكمية في المخزن بنجاح' : 'تمت إضافة الصنف والمخزون بنجاح'
      );
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  // Delete item
  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الصنف (${name}) من قائمة الأسعار؟`)) {
      deletePriceMemoryItem(id);
      reloadItems();
      showNotification('تم حذف الصنف من الذاكرة');
    }
  };

  // Category Tabs Configuration
  const categoriesConfig: { id: PriceCategory | 'all'; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: 'الكل (كافة الأصناف)', count: items.length, icon: <Layers className="w-3.5 h-3.5" /> },
    {
      id: 'accessories',
      label: 'الإكسسوارات والملحقات',
      count: stats.accessoriesCount,
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
    { id: 'screens', label: 'شاشات الصيانة', count: stats.screensCount, icon: <Smartphone className="w-3.5 h-3.5" /> },
    {
      id: 'spare_parts',
      label: 'قطع الغيار والبطاريات',
      count: stats.sparePartsCount,
      icon: <Wrench className="w-3.5 h-3.5" />,
    },
    {
      id: 'software',
      label: 'خدمات البرمجة والشبكات',
      count: stats.softwareCount,
      icon: <Cpu className="w-3.5 h-3.5" />,
    },
    {
      id: 'balance',
      label: 'الرصيد والشرائح',
      count: stats.balanceCount,
      icon: <Signal className="w-3.5 h-3.5" />,
    },
    {
      id: 'phones',
      label: 'الجوالات والأجهزة',
      count: stats.phonesCount,
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 left-5 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>المخزن والذاكرة الدائمة المعتمدة (Inventory & Pricing)</span>
              </span>
              <span className="text-xs text-slate-400">محل مصعب لخدمات الهواتف</span>

              {/* Lock Status Pill */}
              {isLocked ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>المخزن محمي ومقفل (للقراءة والبحث)</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400 flex items-center gap-1 animate-pulse">
                  <Unlock className="w-3 h-3 text-amber-300" />
                  <span>وضع التعديل الفوري للكميات والأسعار مفتوح (Unlocked)</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
              <span>المخزن (الكميات، والأسعار، وجدول الضمار المعتمد)</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              إدارة جرد المخزون، الكميات المتوفرة، أسعار الضمار (التكلفة)، أسعار البيع، وهامش الربح المعتمد لمحل مصعب (162+ صنف): شواحن، كابلات، شاشات سامسونج وآيفون وريدمي، قطع غيار، خدمات برمجة، ورصيد. محمي بالقفل لمنع التعديل غير المقصود مع إمكانية فك القفل والتعديل الجماعي السريع لحظياً.
            </p>
          </div>

          {/* Master Action Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Primary One-Click Toggle for Quick Enter Mode */}
            <button
              onClick={handleToggleQuickEntryMode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer ${
                !isLocked
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-300'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-300/60 animate-pulse'
              }`}
              title="اضغط لمرة واحدة لفتح تعديل الخانات بالكامل وكتابة سعر الضمار والكمية والتنقل بزر Enter مع الحفظ التلقائي لكل منتج"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {!isLocked
                  ? `حفظ وقفل الجدول (${modifiedItemIds.size > 0 ? modifiedItemIds.size + ' صنف تم حفظه' : 'جاهز'})`
                  : '⚡ وضع الإدخال السريع بالإنتر (تسجيل الضمار والكميات)'}
              </span>
            </button>

            {/* Zero Out All Damar Prices and Quantities Button */}
            <button
              onClick={handleZeroOutAll}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-rose-200 border border-rose-800/80 shadow-sm transition-all cursor-pointer"
              title="تصفير جميع أسعار الضمار والكميات لكافة منتجات المخزن للبدء من الصفر"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>تصفير الضمار والكميات (0)</span>
            </button>

            {!isLocked && (
              <button
                onClick={handleCancelInline}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all cursor-pointer"
                title="إلغاء التعديلات غير المحفوظة والعودة للوضع المقفل"
              >
                <X className="w-4 h-4" />
                <span>تراجع</span>
              </button>
            )}

            {/* Quick Add Button */}
            <button
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{isQuickAddOpen ? 'إغلاق الإضافة' : 'إضافة صنف وكمية للمخزن'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrintCatalog}
              title="طباعة كتالوج المخزن والأسعار المعتمد"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة المخزن</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              title="تصدير بيانات المخزن والضمار لملف إكسل مفصل وشامل"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير إكسل</span>
            </button>

            {/* Reset Defaults */}
            <button
              onClick={handleResetDefaults}
              title="استعادة الـ 162 صنف الأصلية المعتمدة بأسعار البذور"
              className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-5 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/80 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-medium">إجمالي الأصناف الموثقة</span>
            <div className="text-base font-black text-white mt-0.5">{stats.totalCount} صنف</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700">
            <span className="text-[10px] text-emerald-300 block font-medium">إجمالي القطع في المخزن</span>
            <div className="text-base font-black text-emerald-400 mt-0.5 font-mono">{formatNumber(stats.totalStockQuantity)} حبة</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700">
            <span className="text-[10px] text-amber-300 block font-medium">إجمالي قيمة الضمار (التكلفة)</span>
            <div className="text-base font-black text-amber-400 mt-0.5 font-mono">{formatNumber(stats.totalInventoryCost)} ر.ي</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700">
            <span className="text-[10px] text-sky-300 block font-medium">القيمة البيعية للمخزون</span>
            <div className="text-base font-black text-sky-400 mt-0.5 font-mono">{formatNumber(stats.totalInventorySalesValue)} ر.ي</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700">
            <span className="text-[10px] text-emerald-300 block font-medium">صافي الأرباح المتوقعة</span>
            <div className="text-base font-black text-emerald-400 mt-0.5 font-mono">+{formatNumber(stats.totalExpectedProfit)} ر.ي</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700">
            <span className="text-[10px] text-rose-300 block font-medium">أصناف قاربت على النفاد</span>
            <div className="text-base font-black text-rose-400 mt-0.5 flex items-center gap-1 font-mono">
              <span>{stats.lowStockCount}</span>
              <span className="text-[10px] text-slate-400">أصناف</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unlocked Active Alert / Instructions Bar */}
      {!isLocked && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-4 text-amber-950 shadow-md animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-xs font-black text-amber-950 flex items-center gap-2">
                  <span>⚡ وضع الإدخال السريع بالإنتر مفعّل وجاهز</span>
                  {modifiedItemIds.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-black flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {modifiedItemIds.size} صنف تم حفظه تلقائياً
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-amber-900 mt-0.5 font-medium leading-relaxed">
                  اكتب <strong>الكمية</strong> ثم اضغط <strong>Enter</strong> للانتقال إلى <strong>سعر الضمار</strong>، ثم اضغط <strong>Enter</strong> للانتقال لكمية <strong>المنتج التالي</strong> مباشرة. يتم حفظ كل منتج تلقائياً ولحظياً في الذاكرة الدائمة!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveAllInline}
                className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
                title="تأكيد حفظ وقفل المخزن"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وقفل الجدول</span>
              </button>
              <button
                onClick={handleCancelInline}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Form Row (Toggled or inline) */}
      {isQuickAddOpen && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs animate-in slide-in-from-top-2">
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-emerald-950 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>إضافة صنف جديد سريعاً إلى جدول الضمار</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2.5">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="اسم الصنف (مثلاً: شاحن سريع 30W، شاشة A03...)"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value as PriceCategory)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-emerald-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="accessories">الإكسسوارات</option>
                  <option value="screens">شاشات الصيانة</option>
                  <option value="spare_parts">قطع الغيار والبطاريات</option>
                  <option value="software">خدمات البرمجة</option>
                  <option value="balance">الرصيد والشرائح</option>
                  <option value="phones">الجوالات والأجهزة</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="الكمية المتوفرة (حبة)"
                  value={quickQuantity}
                  onChange={(e) => setQuickQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-300 bg-indigo-50/40 font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  placeholder="سعر الضمار (التكلفة)"
                  value={quickCostPrice}
                  onChange={(e) => setQuickCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/50 font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  placeholder="سعر البيع المقترح"
                  value={quickSellingPrice}
                  onChange={(e) => setQuickSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="المورد (خليل، العبصري...)"
                  value={quickSupplier}
                  onChange={(e) => setQuickSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
              <div className="text-xs text-emerald-800 font-bold flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span>الربح للقطعة:</span>
                  <span className="font-mono text-xs text-emerald-700 font-black">
                    {formatCurrency(
                      Math.max(0, (Number(quickSellingPrice) || 0) - (Number(quickCostPrice) || 0))
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-800">
                  <span>إجمالي أرباح الدفعة:</span>
                  <span className="font-mono text-xs text-indigo-700 font-black">
                    {formatCurrency(
                      (Number(quickQuantity) || 0) * Math.max(0, (Number(quickSellingPrice) || 0) - (Number(quickCostPrice) || 0))
                    )}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>إضافة فورية للجدول</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Balance Profit Rule Box & Quick Interactive Calculator */}
      <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Signal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-teal-950 flex items-center gap-2">
                <span>قاعدة احتساب أرباح الرصيد المعتمدة (7%):</span>
                <span className="px-2 py-0.5 rounded-md bg-teal-200/80 text-teal-900 font-mono text-[11px]">
                  700 ر.ي ربح صافي لكل 10,000 ر.ي مبيعات
                </span>
              </h3>
              <p className="text-[11px] text-teal-800 mt-0.5">
                تطبق آلياً في سندات رصيد الهادي (محمد مياس) ورصيد الرقم (فايز أبو علي) لحساب التكلفة والربح تلقائياً.
              </p>
            </div>
          </div>

          {/* Quick interactive balance profit preview */}
          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-teal-200 shrink-0 text-xs">
            <span className="font-bold text-slate-700">حاسبة فورية:</span>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="المبلغ"
              value={balanceCalcAmount}
              onChange={(e) => setBalanceCalcAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-24 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-slate-400">←</span>
            <div className="text-[11px] text-slate-700">
              التكلفة: <strong className="font-mono text-slate-900">{formatCurrency(balanceResult.cost)}</strong>
            </div>
            <div className="text-[11px] text-emerald-800">
              الربح الصافي:{' '}
              <strong className="font-mono text-emerald-600">{formatCurrency(balanceResult.profit)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoriesConfig.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === cat.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input + Sort options */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الرقم (مثلاً 17)، أو الموديل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Controls & Batch Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs flex-wrap">
            <span className="text-slate-500 text-[11px] font-medium">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="code">الرقم التسلسلي (الكود)</option>
              <option value="quantity">الكمية المتوفرة بالمخزن</option>
              <option value="profit">أعلى ربح / فائدة</option>
              <option value="costPrice">سعر الضمار / التكلفة</option>
              <option value="sellingPrice">سعر البيع</option>
              <option value="name">الاسم أبجدياً</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating / Pinned Bulk Action Toolbar when items are selected */}
      {selectedItemIds.size > 0 && (
        <div className="sticky top-2 z-40 bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              {selectedItemIds.size}
            </span>
            <div>
              <span className="font-bold text-xs text-white">تم تحديد {selectedItemIds.size} صنف</span>
              <span className="text-[11px] text-slate-400 block">إجراء تعديل جماعي موحد على الأصناف المحددة</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsBulkAdjustModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>تعديل جماعي للأسعار / المورد</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/90 hover:bg-rose-600 text-white transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف المحدد</span>
            </button>

            <button
              onClick={() => setSelectedItemIds(new Set())}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Prices Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                {/* Select All Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAllFiltered}
                    className="text-slate-300 hover:text-white cursor-pointer"
                    title="تحديد الكل"
                  >
                    {filteredItems.length > 0 && filteredItems.every((i) => selectedItemIds.has(i.id)) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2 w-14 text-center">#</th>
                <th className="py-3 px-4">اسم الصنف / القطعة / الخدمة</th>
                <th className="py-3 px-3">القسم</th>
                <th className="py-3 px-3 text-center bg-indigo-950/60 text-indigo-200">
                  الكمية بالمخزن {!isLocked && <span className="text-[10px] text-indigo-300">(مباشر)</span>}
                </th>
                <th className="py-3 px-3 text-center bg-amber-950/40 text-amber-300">
                  سعر الضمار (التكلفة) {!isLocked && <span className="text-[10px] text-amber-400">(مباشر)</span>}
                </th>
                <th className="py-3 px-3 text-center">
                  سعر البيع المقترح {!isLocked && <span className="text-[10px] text-emerald-400">(مباشر)</span>}
                </th>
                <th className="py-3 px-3 text-center bg-emerald-950/40 text-emerald-300">صافي الفائدة (الربح)</th>
                <th className="py-3 px-3 text-center">نسبة الفائدة</th>
                <th className="py-3 px-3">المورد المعتاد / الملاحظات</th>
                <th className="py-3 px-3 text-center w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold">لا توجد نتائج تطابق بحثك</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يمكنك الضغط على زر "إضافة صنف وكمية للمخزن" لإضافة صنف جديد
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const isModified = modifiedItemIds.has(item.id);
                  const isRecentlySaved = recentlySavedIds.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors group ${
                        isSelected
                          ? 'bg-indigo-50/70 hover:bg-indigo-50'
                          : isRecentlySaved
                          ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                          : isModified
                          ? 'bg-amber-50/50 hover:bg-amber-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                        />
                      </td>

                      {/* Code Number */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500 bg-slate-50/40">
                        {item.code}
                      </td>

                      {/* Name - Inline or Display */}
                      <td className="py-2 px-4 font-bold text-slate-900">
                        {!isLocked ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleInlineChange(item.id, 'name', e.target.value)}
                              onBlur={() => handleAutoSaveSingleItem(item.id)}
                              className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500"
                            />
                            {isRecentlySaved && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                <Check className="w-2.5 h-2.5" /> تم الحفظ في الذاكرة
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.isCustomLearned && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                مُتعلم تلقائياً
                              </span>
                            )}
                            {isRecentlySaved && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> محفوظ
                              </span>
                            )}
                            {isModified && !isRecentlySaved && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                مُعدّل
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Category badge */}
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.category === 'accessories'
                              ? 'bg-blue-50 text-blue-700'
                              : item.category === 'screens'
                              ? 'bg-purple-50 text-purple-700'
                              : item.category === 'spare_parts'
                              ? 'bg-orange-50 text-orange-700'
                              : item.category === 'software'
                              ? 'bg-teal-50 text-teal-700'
                              : item.category === 'balance'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.category === 'phones'
                              ? 'bg-sky-50 text-sky-800 font-black'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.categoryNameAr}
                        </span>
                      </td>

                      {/* Stock Quantity - INLINE INPUT WHEN UNLOCKED */}
                      <td className="py-1.5 px-3 text-center bg-indigo-50/40">
                        {!isLocked ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newQ = Math.max(0, (item.quantity ?? 0) - 1);
                                handleInlineChange(item.id, 'quantity', newQ);
                                setTimeout(() => handleAutoSaveSingleItem(item.id), 50);
                              }}
                              className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-black flex items-center justify-center text-xs cursor-pointer"
                              title="إنقاص حبة"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              data-row-index={index}
                              data-field="quantity"
                              value={item.quantity ?? 0}
                              onChange={(e) => handleInlineChange(item.id, 'quantity', e.target.value)}
                              onBlur={() => handleAutoSaveSingleItem(item.id)}
                              onKeyDown={(e) => handleCellKeyDown(e, index, 'quantity', item.id)}
                              onFocus={(e) => e.target.select()}
                              className="w-16 px-1 py-1 text-center font-mono font-black text-indigo-950 bg-white border border-indigo-400 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs shadow-xs"
                              title="الكمية في المخزن - اضغط Enter للانتقال لسعر ضمار المنتج التالي وحفظ هذا المنتج فوراً"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newQ = (item.quantity ?? 0) + 1;
                                handleInlineChange(item.id, 'quantity', newQ);
                                setTimeout(() => handleAutoSaveSingleItem(item.id), 50);
                              }}
                              className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-black flex items-center justify-center text-xs cursor-pointer"
                              title="زيادة حبة"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-mono font-black text-xs text-indigo-950">
                              {item.quantity ?? 0}{' '}
                              <span className="text-[10px] font-normal text-slate-400">حبة</span>
                            </span>
                            {(item.quantity ?? 0) <= (item.minQuantityAlert ?? 2) && item.category !== 'software' && item.category !== 'balance' && (
                              <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full mt-0.5">
                                {(item.quantity ?? 0) === 0 ? 'نفدت الكمية!' : 'قارب النفاد!'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Cost (Damar) Price - INLINE INPUT WHEN UNLOCKED */}
                      <td className="py-1.5 px-3 text-center bg-amber-50/40">
                        {!isLocked ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="50"
                              data-row-index={index}
                              data-field="costPrice"
                              value={item.costPrice}
                              onChange={(e) => handleInlineChange(item.id, 'costPrice', e.target.value)}
                              onBlur={() => handleAutoSaveSingleItem(item.id)}
                              onKeyDown={(e) => handleCellKeyDown(e, index, 'costPrice', item.id)}
                              onFocus={(e) => e.target.select()}
                              className="w-20 px-1.5 py-1 text-center font-mono font-bold text-amber-900 bg-white border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs shadow-xs"
                              title="سعر الضمار (التكلفة) - اضغط Enter للانتقال لكمية نفس الصنف وحفظ التغيير فوراً"
                            />
                            <span className="text-[10px] text-amber-700 font-bold">ر.ي</span>
                          </div>
                        ) : (
                          <div className="font-mono font-bold text-amber-800">
                            {formatNumber(item.costPrice)}{' '}
                            <span className="text-[10px] font-normal text-slate-400">ر.ي</span>
                          </div>
                        )}
                      </td>

                      {/* Selling Price - INLINE INPUT WHEN UNLOCKED */}
                      <td className="py-1.5 px-3 text-center">
                        {!isLocked ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="50"
                              data-row-index={index}
                              data-field="sellingPrice"
                              value={item.sellingPrice}
                              onChange={(e) => handleInlineChange(item.id, 'sellingPrice', e.target.value)}
                              onBlur={() => handleAutoSaveSingleItem(item.id)}
                              onKeyDown={(e) => handleCellKeyDown(e, index, 'sellingPrice', item.id)}
                              onFocus={(e) => e.target.select()}
                              className="w-20 px-1.5 py-1 text-center font-mono font-bold text-slate-900 bg-white border border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs shadow-xs"
                              title="سعر البيع المقترح - اضغط Enter للانتقال للمنتج التالي والحفظ"
                            />
                            <span className="text-[10px] text-slate-500">ر.ي</span>
                          </div>
                        ) : (
                          <div className="font-mono font-bold text-slate-800">
                            {formatNumber(item.sellingPrice)}{' '}
                            <span className="text-[10px] font-normal text-slate-400">ر.ي</span>
                          </div>
                        )}
                      </td>

                      {/* Profit - Auto computed */}
                      <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                        {formatNumber(item.profit)}{' '}
                        <span className="text-[10px] font-normal text-emerald-500">ر.ي</span>
                      </td>

                      {/* Margin percent */}
                      <td className="py-2 px-3 text-center font-mono text-[11px] font-semibold text-slate-600">
                        {item.costPrice > 0 ? (
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              item.profitMarginPercent >= 50
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.profitMarginPercent >= 30
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.profitMarginPercent}%
                          </span>
                        ) : (
                          <span className="text-teal-700 font-bold">100% (شغل يد)</span>
                        )}
                      </td>

                      {/* Supplier / Notes */}
                      <td className="py-1.5 px-3 text-[11px] text-slate-500 max-w-xs">
                        {!isLocked ? (
                          <input
                            type="text"
                            placeholder="المورد..."
                            value={item.supplierName || ''}
                            onChange={(e) => handleInlineChange(item.id, 'supplierName', e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        ) : item.notes ? (
                          <span className="block truncate text-slate-600" title={item.notes}>
                            {item.notes}
                          </span>
                        ) : (
                          <span className="text-slate-400">{item.supplierName || '-'}</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          {onSelectItemForVoucher && (
                            <button
                              onClick={() => onSelectItemForVoucher(item)}
                              title="اختيار في السند الحالي"
                              className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="تعديل تفصيلي"
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            title="حذف من القائمة"
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Adjustment Modal */}
      {isBulkAdjustModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">
                  تعديل جماعي على ({selectedItemIds.size}) صنف محدد
                </h3>
              </div>
              <button
                onClick={() => setIsBulkAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع العملية الجماعية:</label>
                <select
                  value={bulkAdjustType}
                  onChange={(e) => setBulkAdjustType(e.target.value as BulkAdjustmentType)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="increase_selling_percent">زيادة سعر البيع بنسبة (+%)</option>
                  <option value="decrease_selling_percent">تخفيض سعر البيع بنسبة (-%)</option>
                  <option value="increase_cost_percent">زيادة سعر الضمار (التكلفة) بنسبة (+%)</option>
                  <option value="decrease_cost_percent">تخفيض سعر الضمار (التكلفة) بنسبة (-%)</option>
                  <option value="increase_selling_amount">إضافة مبلغ ثابت على سعر البيع (+ ر.ي)</option>
                  <option value="decrease_selling_amount">خصم مبلغ ثابت من سعر البيع (- ر.ي)</option>
                  <option value="increase_cost_amount">إضافة مبلغ ثابت على سعر الضمار (+ ر.ي)</option>
                  <option value="set_margin_percent">ضبط هامش ربح ثابت فوق التكلفة (% فوري)</option>
                  <option value="set_supplier">تعيين المورد المعتاد لكافة الأصناف المحددة</option>
                  <option value="set_category">نقل الأصناف المحددة إلى قسم محدد</option>
                </select>
              </div>

              {bulkAdjustType === 'set_supplier' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد المعتاد:</label>
                  <input
                    type="text"
                    placeholder="مثال: خليل الأغبري، مؤسسة العبصري، القاسمي..."
                    value={bulkSupplierName}
                    onChange={(e) => setBulkSupplierName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              ) : bulkAdjustType === 'set_category' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم المستهدف:</label>
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value as PriceCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="accessories">الإكسسوارات والملحقات</option>
                    <option value="screens">شاشات الصيانة</option>
                    <option value="spare_parts">قطع الغيار والبطاريات</option>
                    <option value="software">خدمات البرمجة والشبكات</option>
                    <option value="balance">الرصيد والشرائح</option>
                    <option value="phones">الجوالات والأجهزة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    القيمة {bulkAdjustType.includes('percent') ? '(نسبة مئوية %)' : '(مبلغ بالريال ر.ي)'}:
                  </label>
                  <input
                    type="number"
                    value={bulkAdjustValue}
                    onChange={(e) => setBulkAdjustValue(e.target.value)}
                    placeholder="مثال: 10 أو 200"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
                💡 سيتم تطبيق هذا التعديل فوراً على كافة الـ <strong>{selectedItemIds.size}</strong> صنف المحددة مع إعادة احتساب صافي الربح والنسب لكل صنف تلقائياً.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkAdjustModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkAdjustment}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md font-black cursor-pointer"
                >
                  تطبيق التعديل الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Item Detailed Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  {editingItem ? `تعديل صنف: ${editingItem.name}` : 'إضافة صنف جديد لجدول الضمار'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصنف أو الخدمة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شاحن الملك K8، شاشة A12..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">القسم والتصنيف:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PriceCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="accessories">الإكسسوارات والملحقات</option>
                  <option value="screens">شاشات الصيانة</option>
                  <option value="spare_parts">قطع الغيار والبطاريات</option>
                  <option value="software">خدمات البرمجة والشبكات</option>
                  <option value="balance">الرصيد والشرائح</option>
                  <option value="phones">الجوالات والأجهزة</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              {/* Stock Quantity Grid */}
              <div className="grid grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-200">
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">الكمية المتوفرة بالمخزن:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="العدد الحالي"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold font-mono text-indigo-950 rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <span className="text-[10px] text-indigo-600 mt-0.5 block font-medium">
                    (عدد الحبات / القطع المتوفرة حالياً)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-800 mb-1">حد تنبيه قرب النفاد:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="مثال: 2 أو 5"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold font-mono text-rose-900 rounded-lg border border-rose-300 focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    (يظهر تنبيه باللون الأحمر إذا قلت الكمية عنه)
                  </span>
                </div>
              </div>

              {/* Prices Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">سعر الضمار (التكلفة ر.ي):</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="سعر الشراء"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold font-mono text-amber-900 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    (ضع 0 إذا كانت الخدمة شغل يد خالص)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">سعر البيع المقترح (ر.ي):</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="سعر البيع"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold font-mono text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    (سعر البيع للزبون أو التركيب)
                  </span>
                </div>
              </div>

              {/* Profit & Valuation preview */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex flex-col justify-between text-xs">
                  <span className="font-bold text-emerald-900">ربح الحبة الواحدة:</span>
                  <span className="font-bold font-mono text-sm text-emerald-700 mt-1">
                    {formatCurrency(
                      Math.max(0, (Number(formSellingPrice) || 0) - (Number(formCostPrice) || 0))
                    )}
                  </span>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex flex-col justify-between text-xs">
                  <span className="font-bold text-indigo-900">إجمالي ربح الكمية بالكامل:</span>
                  <span className="font-bold font-mono text-sm text-indigo-700 mt-1">
                    {formatCurrency(
                      (Number(formQuantity) || 0) * Math.max(0, (Number(formSellingPrice) || 0) - (Number(formCostPrice) || 0))
                    )}
                  </span>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المورد المعتاد (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: خليل الأغبري، مؤسسة العبصري، القاسمي..."
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الصنف:</label>
                <input
                  type="text"
                  placeholder="مثال: أصلي وكالة، تركيب مع الضمان، درجة أولى..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-950/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ في الذاكرة الدائمة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
