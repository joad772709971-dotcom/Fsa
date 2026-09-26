import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DailyLedgerView } from './components/DailyLedgerView';
import { MonthlySettlementView } from './components/MonthlySettlementView';
import { MosaabAccountView } from './components/MosaabAccountView';
import { NetworksBalanceView } from './components/NetworksBalanceView';
import { SuppliersView } from './components/SuppliersView';
import { EmployeesView } from './components/EmployeesView';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { ExportReportsView } from './components/ExportReportsView';
import { BackupGitHubModal } from './components/BackupGitHubModal';
import { CashierPOSView } from './components/CashierPOSView';
import { CostPricingGuideView } from './components/CostPricingGuideView';
import { MaintenanceTicketsView } from './components/MaintenanceTicketsView';
import { CashDrawerShiftView } from './components/CashDrawerShiftView';
import { StockAlertsReorderView } from './components/StockAlertsReorderView';
import { OfficialVoucherGenerator } from './components/OfficialVoucherGenerator';
import { BarcodeGeneratorView } from './components/BarcodeGeneratorView';
import { AccountStatementView } from './components/AccountStatementView';
import { PermissionsModal } from './components/PermissionsModal';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { PrintModal } from './components/PrintModal';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { VoucherModal } from './components/VoucherModal';
import { SmartAIAssistant } from './components/SmartAIAssistant';
import { SmartSystemAuditModal } from './components/SmartSystemAuditModal';
import { LoginView, DEFAULT_USERS } from './components/LoginView';
import { CloudSyncManagerView } from './components/CloudSyncManagerView';
import { ProfitSharingSettingsView } from './components/ProfitSharingSettingsView';
import { ForensicAuditorView } from './components/ForensicAuditorView';
import { SmartInvoiceOCR } from './components/SmartInvoiceOCR';
import { TelecomStatementEngine } from './components/TelecomStatementEngine';
import { PackagePricingCatalog } from './components/PackagePricingCatalog';

// Merged Hubs & Daily Balance Reconciler
import { SuppliersHubView } from './components/SuppliersHubView';
import { MosaabHubView } from './components/MosaabHubView';
import { MaintenanceHubView } from './components/MaintenanceHubView';
import { RechargeHubView } from './components/RechargeHubView';
import { HadiDailyBalanceReconciler } from './components/HadiDailyBalanceReconciler';

// Restored System Pages
import { PartnersFundingView } from './components/PartnersFundingView';
import { DeliveryView } from './components/DeliveryView';
import { DamagedView } from './components/DamagedView';
import { ReturnsView } from './components/ReturnsView';
import { AssetsView, ShopAssetItem } from './components/AssetsView';
import { MasterTableView } from './components/MasterTableView';
import { OwnerPortalView } from './components/OwnerPortalView';
import { RechargeManagerView } from './components/RechargeManagerView';
import { ArchiveView } from './components/ArchiveView';
import { AccountsView } from './components/AccountsView';
import { SimsView } from './components/SimsView';
import { MaintenanceView } from './components/MaintenanceView';
import { SuppliersLedgerView, initialSupplierProfiles } from './components/SuppliersLedgerView';
import { MusabLedgerView } from './components/MusabLedgerView';
import { ShortagesView } from './components/ShortagesView';
import { ReportsView } from './components/ReportsView';
import { CashierView } from './components/CashierView';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { LicenseModal } from './components/LicenseModal';
import { VoiceHandsFreeCallModal } from './components/VoiceHandsFreeCallModal';
import { getTodayDateString, getCurrentMonthString } from './utils/dateHelper';

// Initial Data Sources
import { INITIAL_DAYS_DATA } from './data/initialRecords';
import { applyOfficialHadiToDayRecords } from './data/hadiOfficialRecords';
import { INITIAL_PARTNERS_FUNDING, INITIAL_MUSAB_PURCHASING_SETTLEMENT } from './data/initialPartnersData';
import { INITIAL_DAMAGED_ITEMS } from './data/initialDamagedData';
import { INITIAL_SHOP_OUTGOINGS_AND_ASSETS } from './data/initialShopAssets';

import {
  Transaction,
  Supplier,
  TransactionType,
  InventoryItem,
  AuthUser,
  DayRecord,
  PartnerFundingItem,
  MusabPurchasingSettlement,
  DeliveryOrder,
  DamagedItem,
  ShortageItem,
  MaintenanceDevice,
  SimCardRecord,
  SubscribedShop,
  ShopSettings,
  SystemLicense,
  SupplierProfile,
  SupplierTransaction,
  SupplierTransferItem,
  ReturnItem,
  MusabItem,
  DEFAULT_SHOP_SETTINGS,
} from './types';
import {
  loadTransactions,
  saveTransactions,
  loadSuppliers,
  saveSuppliers,
  loadInventory,
  saveInventory,
  clearAllSystemData,
  INITIAL_SUPPLIERS,
  normalizeSupplierName,
} from './utils/storage';
import {
  startRealtimeSync,
  syncTransactionToCloud,
  deleteTransactionFromCloud,
  triggerFullSync,
  syncInventoryToCloud,
  syncDayToCloud,
} from './utils/syncService';
import { initKeyboardHelper } from './utils/keyboardHelper';
import {
  calculateDailySummary,
  calculateMonthlySettlement,
  getUniqueDates,
} from './utils/calculations';

function getOrCreateDayForDate(targetDate: string, dayList: DayRecord[]): DayRecord {
  const existing = dayList.find((d) => d.date === targetDate);
  if (existing) return existing;
  const parts = targetDate.split('-');
  const dayNum = parseInt(parts[2] || '1', 10);
  return {
    id: `day-${targetDate}`,
    dayNumber: isNaN(dayNum) ? 1 : dayNum,
    date: targetDate,
    dayTitle: `يوم ${isNaN(dayNum) ? targetDate : dayNum}`,
    isClosed: false,
    notes: `يومية تاريخ ${targetDate}`,
    accessories: [],
    phones: [],
    maintenance: [],
    recharge: {
      totalWithoutProfit: 0,
      totalWithProfit: 0,
      totalProfit: 0,
    },
    returns: [],
    expenses: [],
    musabHouse: [],
    musabPersonal: [],
    workers: [],
    supplierTransfers: [],
  };
}

export default function App() {
  // Auth state - Require Login initially unless remembered
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('mosaab_auth_current_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadSuppliers());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadInventory());

  // Restored Days Records State (الدورة المحاسبية والأيام) - تتغير تلقائياً حسب اليوم الحالي مع استرجاع المبيعات والصيانة الأصلية المعتمدة
  const [days, setDays] = useState<DayRecord[]>(() => {
    let list: DayRecord[] = INITIAL_DAYS_DATA;
    try {
      const saved = localStorage.getItem('mosaab_days_data_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
          const today = getTodayDateString();
          if (!list.some((d) => d.date === today)) {
            return [getOrCreateDayForDate(today, list), ...list];
          }
          return list;
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Enforce official verified Hadi accounting update only on pristine initialization
    list = applyOfficialHadiToDayRecords(list);

    const today = getTodayDateString();
    if (!list.some((d) => d.date === today)) {
      return [getOrCreateDayForDate(today, list), ...list];
    }
    return list;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_days_data_v2', JSON.stringify(days));
    } catch (e) {
      console.error(e);
    }
  }, [days]);

  // Restored Partners Funding State (تمويل الشركاء وتصفية المشتريات)
  const [fundingItems, setFundingItems] = useState<PartnerFundingItem[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_partners_funding_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PARTNERS_FUNDING;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_partners_funding_v2', JSON.stringify(fundingItems));
    } catch (e) {}
  }, [fundingItems]);

  const [musabSettlement, setMusabSettlement] = useState<MusabPurchasingSettlement>(() => {
    try {
      const saved = localStorage.getItem('mosaab_musab_settlement_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MUSAB_PURCHASING_SETTLEMENT;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_musab_settlement_v2', JSON.stringify(musabSettlement));
    } catch (e) {}
  }, [musabSettlement]);

  // Restored Delivery Orders State (توصيل الطلبات والدراجات)
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_delivery_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'del_1',
        recipientName: 'صلاح العنسي',
        recipientPhone: '777123456',
        driverName: 'أبو فهد (سائق المتر)',
        driverPhone: '771234567',
        address: 'شارع تعز - جوار مدرسة بلقيس',
        orderDetails: 'شاشة سامسونج A12 + كفر سيليكون + لصقة ليزر ضد الكسر',
        itemCost: 18500,
        deliveryFee: 1500,
        totalAmount: 20000,
        collectedFromCustomer: 20000,
        paidToShop: 18500,
        status: 'تم التسليم والمحاسبة',
        date: '2026-08-31',
        notes: 'تم استلام المبلغ نقداً وتوريده للصندوق',
      },
      {
        id: 'del_2',
        recipientName: 'عبدالرحمن المتوكل',
        recipientPhone: '773998877',
        driverName: 'جمال السائق',
        driverPhone: '770112233',
        address: 'حي الجمارك - خلف مستشفى الهلال',
        orderDetails: 'شاحن أنكر 20 واط سريع أصلي',
        itemCost: 6500,
        deliveryFee: 1000,
        totalAmount: 7500,
        collectedFromCustomer: 7500,
        paidToShop: 6500,
        status: 'قيد التوصيل',
        date: '2026-08-31',
        notes: 'طلب عاجل للزبون',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_delivery_orders_v2', JSON.stringify(deliveryOrders));
    } catch (e) {}
  }, [deliveryOrders]);

  // Restored Damaged Items State (التوالف والخسائر)
  const [damagedItems, setDamagedItems] = useState<DamagedItem[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_damaged_items_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DAMAGED_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_damaged_items_v2', JSON.stringify(damagedItems));
    } catch (e) {}
  }, [damagedItems]);

  // Restored Shop Assets State (أصول وديكور وتجهيزات المحل - بدون كهرباء أو إيجار)
  const [shopAssets, setShopAssets] = useState<ShopAssetItem[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_shop_assets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // استبعاد أي أصل كهرباء أو إيجار من جميع الأصول
          return parsed.filter(
            (a: any) =>
              a.id !== 'shop-lights-1' &&
              a.id !== 'shop-chargers-hb' &&
              a.id !== 'shop-sheleshan-1' &&
              !a.name?.includes('كهرباء') &&
              !a.name?.includes('إيجار') &&
              !a.name?.includes('ايجار') &&
              !a.notes?.includes('إيجار') &&
              !a.notes?.includes('ايجار')
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SHOP_OUTGOINGS_AND_ASSETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_shop_assets_v2', JSON.stringify(shopAssets));
    } catch (e) {}
  }, [shopAssets]);

  // Restored Shortages State (النواقص وطلبيات 2:00 ظهراً)
  const [shortages, setShortages] = useState<ShortageItem[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_shortages_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'sh_1',
        itemName: 'شاشات سامسونج A10s وكالة أصلية',
        category: 'نواقص الصيانة',
        quantityNeeded: 5,
        supplierName: 'القمة',
        urgency: 'عاجل جداً',
        status: 'معلق',
        addedDate: '2026-08-31',
        notes: 'الزبائن منتظرين لتسليم أجهزتهم وقت الظهيرة',
      },
      {
        id: 'sh_2',
        itemName: 'شواحن سريع 25W تايب سي PD',
        category: 'نواقص المحل',
        quantityNeeded: 15,
        supplierName: 'الهادي',
        urgency: 'متوسط',
        status: 'معلق',
        addedDate: '2026-08-31',
        notes: 'الطلب عالي جداً هذا الأسبوع',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_shortages_v2', JSON.stringify(shortages));
    } catch (e) {}
  }, [shortages]);

  // Restored Maintenance Devices State (أجهزة الصيانة والورشة)
  const [maintenanceDevices, setMaintenanceDevices] = useState<MaintenanceDevice[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_maintenance_devices_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_maintenance_devices_v2', JSON.stringify(maintenanceDevices));
    } catch (e) {}
  }, [maintenanceDevices]);

  // Restored Sim Records State (شرايح الاتصالات وتوثيق البصمات)
  const [simRecords, setSimRecords] = useState<SimCardRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_sim_records_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'sim_1',
        carrier: 'يمن موبايل',
        simType: 'شريحة بدل فاقد 4G',
        serialNumber: '8996701122334455',
        phoneNumber: '777456789',
        customerName: 'يحيى علي الشامي',
        costPrice: 1000,
        sellingPrice: 1500,
        profit: 500,
        date: '2026-08-31',
        notes: 'تفعيل فوري مع باقة مزايا الشهرية',
      },
      {
        id: 'sim_2',
        carrier: 'يو (YOU)',
        simType: 'شريحة رقم جديد مفوتر 4G',
        serialNumber: '8996709988776655',
        phoneNumber: '733123456',
        customerName: 'صادق يحيى الحصامي',
        costPrice: 800,
        sellingPrice: 1500,
        profit: 700,
        date: '2026-08-31',
        notes: 'شريحة نت 4G',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_sim_records_v2', JSON.stringify(simRecords));
    } catch (e) {}
  }, [simRecords]);

  // Restored Subscribed Shops State (بوابة المالك والتراخيص الموزعة)
  const [subscribedShops, setSubscribedShops] = useState<SubscribedShop[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_subscribed_shops_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'shop_main',
        name: 'نمو لخدمات الجوالات - المركز الرئيسي ذمار',
        ownerName: 'مصعب الصوفي',
        phone: '777000000',
        address: 'ذمار - الشارع العام - مجمع النور',
        subscriptionType: 'مدى الحياة',
        startDate: '2026-08-01',
        status: 'نشط',
        deviceLimit: 10,
        pricePaid: 0,
        notes: 'الترخيص الرئيسي للمؤسس والمالك',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_subscribed_shops_v2', JSON.stringify(subscribedShops));
    } catch (e) {}
  }, [subscribedShops]);

  // Restored Shop Settings & Identity
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem('mosaab_shop_settings_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SHOP_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_shop_settings_v2', JSON.stringify(shopSettings));
    } catch (e) {}
  }, [shopSettings]);

  // Restored System License State
  const [systemLicense, setSystemLicense] = useState<SystemLicense | null>(() => {
    try {
      const saved = localStorage.getItem('mosaab_system_license_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  useEffect(() => {
    if (systemLicense) {
      try {
        localStorage.setItem('mosaab_system_license_v2', JSON.stringify(systemLicense));
      } catch (e) {}
    }
  }, [systemLicense]);

  // Restored Supplier Profiles & Transactions Ledger
  const [supplierProfiles, setSupplierProfiles] = useState<SupplierProfile[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_supplier_profiles_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialSupplierProfiles;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_supplier_profiles_v2', JSON.stringify(supplierProfiles));
    } catch (e) {}
  }, [supplierProfiles]);

  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('mosaab_supplier_transactions_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mosaab_supplier_transactions_v2', JSON.stringify(supplierTransactions));
    } catch (e) {}
  }, [supplierTransactions]);

  // Modal dialog states
  const [isShopSettingsModalOpen, setIsShopSettingsModalOpen] = useState<boolean>(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);
  const [isHandsFreeVoiceModalOpen, setIsHandsFreeVoiceModalOpen] = useState<boolean>(false);

  const getTodayStr = () => {
    return getTodayDateString();
  };
  const getThisMonthStr = () => {
    return getCurrentMonthString();
  };

  const [currentDate, setCurrentDate] = useState<string>(() => getTodayStr());
  const [currentMonth, setCurrentMonth] = useState<string>(() => getThisMonthStr());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // تحديث اليوم التلقائي عند فتح البرنامج أو تنشيط الشاشة
  useEffect(() => {
    const syncCurrentDay = () => {
      const today = getTodayDateString();
      setDays((prev) => {
        if (!prev.some((d) => d.date === today)) {
          return [getOrCreateDayForDate(today, prev), ...prev];
        }
        return prev;
      });
    };
    syncCurrentDay();
    window.addEventListener('focus', syncCurrentDay);
    return () => window.removeEventListener('focus', syncCurrentDay);
  }, []);

  // Modals state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultVoucherType, setDefaultVoucherType] = useState<TransactionType>('sale');
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isSystemAuditModalOpen, setIsSystemAuditModalOpen] = useState<boolean>(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isExitConfirmModalOpen, setIsExitConfirmModalOpen] = useState<boolean>(false);

  // Global search shortcut (Ctrl+K or Cmd+K or /)
  useEffect(() => {
    const cleanupKeyboard = initKeyboardHelper();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        !(e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cleanupKeyboard();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync auth user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mosaab_auth_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mosaab_auth_current_user');
    }
  }, [currentUser]);

  // Sync online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Floating Real-time Sync Alert
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Start Firebase Cloud Real-time synchronization
  useEffect(() => {
    const handleRefreshAllLocalState = () => {
      setTransactions(loadTransactions());
      setSuppliers(loadSuppliers());
      setInventory(loadInventory());
      try {
        const savedDays = localStorage.getItem('mosaab_days_data_v2');
        if (savedDays) setDays(JSON.parse(savedDays));
      } catch (e) {}
    };

    const stopSync = startRealtimeSync((type, details) => {
      if (type === 'transactions') {
        const updated = loadTransactions();
        setTransactions(updated);
        if (details?.newTransactions && details.newTransactions.length > 0) {
          const first = details.newTransactions[0];
          const count = details.newTransactions.length;
          const msg =
            count === 1
              ? `⚡ مزامنة فورية: تم تسجيل بيع جديد من الجوال: ${first.description} (${first.price.toLocaleString('ar-YE')} ر.ي)`
              : `⚡ مزامنة فورية: تم استلام ${count} عمليات جديدة من الجوال`;
          setSyncToastMessage(msg);
          setTimeout(() => setSyncToastMessage(null), 5000);
        }
      } else if (type === 'suppliers') {
        setSuppliers(loadSuppliers());
      } else if (type === 'inventory') {
        setInventory(loadInventory());
      } else if (type === 'days' && details?.days) {
        setDays(details.days);
      }
    });

    const handleInventoryUpdated = () => {
      setInventory(loadInventory());
    };
    window.addEventListener('inventory_updated', handleInventoryUpdated);
    window.addEventListener('cloud_data_synced', handleRefreshAllLocalState);

    // Auto sync on app wake/focus (crucial when switching between apps or returning to APK)
    const handleAppResume = () => {
      if (navigator.onLine) {
        triggerFullSync().catch(() => {});
      }
    };
    window.addEventListener('focus', handleAppResume);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleAppResume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Run initial sync swiftly on startup
    let syncTimer: any;
    if (navigator.onLine) {
      syncTimer = setTimeout(() => {
        triggerFullSync().catch(() => {});
      }, 500);
    }

    // Periodic fast reconciliation every 30 seconds
    const intervalTimer = setInterval(() => {
      if (navigator.onLine && !document.hidden) {
        triggerFullSync().catch(() => {});
      }
    }, 30000);

    return () => {
      window.removeEventListener('inventory_updated', handleInventoryUpdated);
      window.removeEventListener('cloud_data_synced', handleRefreshAllLocalState);
      window.removeEventListener('focus', handleAppResume);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (syncTimer) clearTimeout(syncTimer);
      clearInterval(intervalTimer);
      stopSync();
    };
  }, []);

  // Save transactions to LocalStorage whenever modified
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // Save suppliers to LocalStorage whenever modified
  useEffect(() => {
    saveSuppliers(suppliers);
  }, [suppliers]);

  // Save inventory to LocalStorage whenever modified
  useEffect(() => {
    saveInventory(inventory);
  }, [inventory]);

  // Available dates in database - تتضمن تلقائياً اليوم الحالي وكافة الأيام المسجلة
  const availableDates = useMemo(() => {
    const todayStr = getTodayDateString();
    const rawDates = getUniqueDates(transactions);
    const dayDates = days.map((d) => d.date).filter(Boolean);
    const combined = Array.from(new Set([todayStr, ...rawDates, ...dayDates]));
    return combined.sort((a, b) => b.localeCompare(a));
  }, [transactions, days]);

  // Financial calculations
  const [profitVersion, setProfitVersion] = useState(0);
  const dailySummary = useMemo(
    () => calculateDailySummary(currentDate, transactions),
    [currentDate, transactions, profitVersion]
  );
  const monthlySettlement = useMemo(
    () => calculateMonthlySettlement(currentMonth, transactions),
    [currentMonth, transactions, profitVersion]
  );

  // Helper to auto-register sold items in inventory if they don't exist
  const autoRegisterSaleInInventory = (tx: Transaction) => {
    if (tx.type === 'sale' && tx.description && tx.description.trim()) {
      const cleanDesc = tx.description.trim();
      setInventory((prevInv) => {
        const alreadyExists = prevInv.some(
          (inv) => inv.name.trim().toLowerCase() === cleanDesc.toLowerCase()
        );
        if (!alreadyExists) {
          const newInvItem: InventoryItem = {
            id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: cleanDesc,
            category:
              tx.category === 'phones'
                ? 'جوالات مستعملة/جديدة'
                : tx.category === 'sims'
                ? 'شرايح'
                : 'إكسسوارات',
            quantity: 0,
            costPrice: tx.cost || 0,
            sellingPrice: tx.price || 0,
            notes: `صنف أضيف تلقائياً من المبيعات بتاريخ ${tx.date || new Date().toISOString().slice(0, 10)}`,
          };
          syncInventoryToCloud(newInvItem);
          return [newInvItem, ...prevInv];
        }
        return prevInv;
      });
    }
  };

  // Handlers for transactions
  const handleSaveTransaction = (rawTx: Transaction) => {
    const tx: Transaction = {
      ...rawTx,
      supplierName: rawTx.supplierName ? normalizeSupplierName(rawTx.supplierName) : undefined,
    };
    syncTransactionToCloud(tx);
    setTransactions((prev) => {
      const existsIndex = prev.findIndex((item) => item.id === tx.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = tx;
        return updated;
      } else {
        return [tx, ...prev];
      }
    });
    autoRegisterSaleInInventory(tx);
  };

  const handleSaveBatchTransactions = (newTxList: Transaction[]) => {
    const sanitizedList = newTxList.map((t) => ({
      ...t,
      supplierName: t.supplierName ? normalizeSupplierName(t.supplierName) : undefined,
    }));
    sanitizedList.forEach((t) => {
      syncTransactionToCloud(t);
      autoRegisterSaleInInventory(t);
    });
    setTransactions((prev) => [...sanitizedList, ...prev]);
  };

  const handleSplitCompoundTransaction = (originalTxId: string, newTxList: Transaction[]) => {
    deleteTransactionFromCloud(originalTxId);
    newTxList.forEach((t) => syncTransactionToCloud(t));
    setTransactions((prev) => {
      const filtered = prev.filter((t) => t.id !== originalTxId);
      return [...newTxList, ...filtered];
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السند؟')) {
      deleteTransactionFromCloud(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setDefaultVoucherType(tx.type);
    setIsVoucherModalOpen(true);
  };

  const handleOpenNewVoucher = (defaultType: TransactionType = 'sale') => {
    setEditingTransaction(null);
    setDefaultVoucherType(defaultType);
    setIsVoucherModalOpen(true);
  };

  const handleAddParsedTransactions = (parsed: Transaction[]) => {
    setTransactions((prev) => [...parsed, ...prev]);
  };

  const handleOverwriteDayTransactions = (date: string, newTxList: Transaction[]) => {
    // 1. حذف جميع القيود السابقة لهذا التاريخ محلياً وسحابياً لمنع التكرار (Overwrite)
    const existingForDate = transactions.filter((t) => t.date === date);
    existingForDate.forEach((t) => {
      deleteTransactionFromCloud(t.id);
    });

    // 2. تهيئة وتدقيق القيود الجديدة
    const sanitizedList = newTxList.map((t) => ({
      ...t,
      date,
      supplierName: t.supplierName ? normalizeSupplierName(t.supplierName) : undefined,
    }));

    // 3. الحفظ السحابي وإدراج الأصناف غير المسجلة في المخزون
    sanitizedList.forEach((t) => {
      syncTransactionToCloud(t);
      autoRegisterSaleInInventory(t);
    });

    // 4. تحديث حالة الذاكرة المحلية للمعاملات
    setTransactions((prev) => {
      const remaining = prev.filter((t) => t.date !== date);
      return [...sanitizedList, ...remaining];
    });

    // 5. تحديث سجل اليومية (days / DayRecord) فورياً وتزامنه سحابياً
    setDays((prev) => {
      const targetDay = getOrCreateDayForDate(date, prev);
      const accItems: { id: string; name: string; price: number }[] = [];
      const maintItems: { id: string; deviceOrService: string; price: number; type: string; status: string }[] = [];
      const phoneItems: { id: string; name: string; sellingPrice: number; costPrice: number; profit: number }[] = [];
      let rechargeTotal = 0;
      let rechargeProfit = 0;
      const expenseList: { id: string; description: string; amount: number }[] = [];
      const supTransfers: { id: string; supplier: string; amount: number }[] = [];

      sanitizedList.forEach((t, i) => {
        if (t.category === 'accessories' || (t.type === 'sale' && t.category !== 'phones')) {
          accItems.push({ id: t.id || `acc_${i}`, name: t.description, price: t.price });
        } else if (t.category === 'maintenance' || t.type === 'maintenance') {
          maintItems.push({ id: t.id || `maint_${i}`, deviceOrService: t.description, price: t.price, type: 'شاشات وصيانة', status: 'خالص' });
        } else if (t.category === 'phones') {
          phoneItems.push({ id: t.id || `phone_${i}`, name: t.description, sellingPrice: t.price, costPrice: t.cost || 0, profit: t.profit || 0 });
        } else if (t.category === 'balance' || t.category === 'sims' || t.type?.startsWith('balance')) {
          rechargeTotal += t.price;
          rechargeProfit += (t.profit || 0);
        } else if (t.category === 'expenses' || t.type?.startsWith('expense')) {
          expenseList.push({ id: t.id || `exp_${i}`, description: t.description, amount: t.price });
        } else if (t.supplierName) {
          supTransfers.push({ id: t.id || `sup_${i}`, supplier: t.supplierName, amount: t.price });
        }
      });

      const updatedDay: DayRecord = {
        ...targetDay,
        accessories: accItems,
        maintenance: maintItems,
        phones: phoneItems,
        recharge: {
          totalWithProfit: rechargeTotal,
          profit: rechargeProfit,
        },
        expenses: expenseList,
        supplierTransfers: supTransfers,
        updatedAt: new Date().toISOString(),
      };

      syncDayToCloud(updatedDay);
      return prev.map((d) => (d.date === date ? updatedDay : d));
    });
  };

  const handleRestoreData = () => {
    setTransactions(loadTransactions());
    setSuppliers(loadSuppliers());
    setInventory(loadInventory());
  };

  const handleClearAllData = () => {
    clearAllSystemData();
    setTransactions([]);
    setSuppliers(INITIAL_SUPPLIERS);
    setInventory([]);
  };

  const handleDateChange = (date: string) => {
    setCurrentDate(date);
    if (date.length >= 7) {
      setCurrentMonth(date.substring(0, 7));
    }
  };

  const handleSelectDayById = (dayId: string) => {
    const targetDay = days.find((d) => d.id === dayId);
    if (targetDay) {
      setCurrentDate(targetDay.date);
      if (targetDay.date && targetDay.date.length >= 7) {
        setCurrentMonth(targetDay.date.substring(0, 7));
      }
    }
    setActiveTab('daily_ledger');
  };

  // If user logged out or lock screen active
  if (!currentUser) {
    return (
      <LoginView
        onLogin={(user, remember = true) => {
          if (remember) {
            try {
              localStorage.setItem('mosaab_auth_current_user', JSON.stringify(user));
            } catch (e) {
              console.error(e);
            }
          }
          setCurrentUser(user);
        }}
        onClearAllData={handleClearAllData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased selection:bg-amber-500 selection:text-black w-full overflow-x-hidden" dir="rtl">
      {/* Top Navigation Bar */}
      <Navbar
        currentDate={currentDate}
        onDateChange={handleDateChange}
        dailySummary={dailySummary}
        onOpenNewVoucher={() => handleOpenNewVoucher('sale')}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenHandsFreeVoice={() => setIsHandsFreeVoiceModalOpen(true)}
        onOpenSystemAudit={() => setIsSystemAuditModalOpen(true)}
        onOpenExportModal={() => setActiveTab('reports')}
        onOpenPOS={() => setActiveTab('pos_cashier')}
        onOpenPermissions={() => setIsPermissionsModalOpen(true)}
        onOpenGitHubModal={() => setActiveTab('backup_github')}
        onOpenSettings={() => setActiveTab('profit_sharing')}
        onOpenForensicAudit={() => setActiveTab('forensic_audit')}
        currentUser={currentUser}
        onLockScreen={() => {
          setCurrentUser(null);
          try {
            localStorage.removeItem('mosaab_auth_current_user');
          } catch (e) {}
        }}
        onLogout={() => {
          setIsExitConfirmModalOpen(true);
        }}
        isOnline={isOnline}
        onToggleSidebar={() => setIsOpenMobile((prev) => !prev)}
        isSidebarOpen={isOpenMobile}
        onSyncComplete={() => {
          setTransactions(loadTransactions());
          setSuppliers(loadSuppliers());
          setInventory(loadInventory());
          try {
            const savedDays = localStorage.getItem('mosaab_days_data_v2');
            if (savedDays) setDays(JSON.parse(savedDays));
          } catch (e) {}
        }}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenPermissions={() => setIsPermissionsModalOpen(true)}
          onOpenShopSettings={() => setIsShopSettingsModalOpen(true)}
          onOpenLicense={() => setIsLicenseModalOpen(true)}
          onLockScreen={() => setCurrentUser(null)}
          onExitSystem={() => setIsExitConfirmModalOpen(true)}
          onSelectTab={(tab) => {
            if (tab === 'ai_assistant') {
              setIsAIModalOpen(true);
            } else if (tab === 'system_audit') {
              setIsSystemAuditModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          isOpenMobile={isOpenMobile}
          onToggleMobile={() => setIsOpenMobile((prev) => !prev)}
          transactionsCount={transactions.length}
        />

        {/* Content View Container - mobile responsive padding with bottom spacing for mobile */}
        <main className="flex-1 w-full p-2 sm:p-4 lg:p-6 pb-20 sm:pb-8 overflow-y-auto overflow-x-hidden min-w-0 max-w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentDate={currentDate}
              dailySummary={dailySummary}
              monthlySettlement={monthlySettlement}
              transactions={transactions}
              onOpenNewVoucher={handleOpenNewVoucher}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              onOpenSystemAudit={() => setIsSystemAuditModalOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectDate={handleDateChange}
            />
          )}

          {(activeTab === 'pos_cashier' || activeTab === 'cashier_full') && (
            <CashierView
              days={days}
              currentDay={getOrCreateDayForDate(currentDate, days)}
              onUpdateDay={(upd) => {
                syncDayToCloud(upd);
                setDays((prev) => {
                  const idx = prev.findIndex((d) => d.id === upd.id || d.date === upd.date);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = upd;
                    return copy;
                  }
                  return [upd, ...prev];
                });
              }}
              inventoryItems={inventory}
              onAddInventoryItem={(item) => setInventory((prev) => [item, ...prev])}
              onUpdateInventoryItem={(item) =>
                setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)))
              }
              supplierProfiles={supplierProfiles}
              onAddSupplierProfile={(p) => setSupplierProfiles((prev) => [p, ...prev])}
              onAddSupplierTransaction={(tx) =>
                setSupplierTransactions((prev) => [tx, ...prev])
              }
              onSaveTransactions={handleSaveBatchTransactions}
              initialMode="sales"
            />
          )}

          {activeTab === 'cost_pricing_guide' && (
            <CostPricingGuideView
              onSelectItemForVoucher={(item) => {
                setDefaultVoucherType(
                  item.category === 'screens' || item.category === 'spare_parts'
                    ? 'maintenance'
                    : item.category === 'balance'
                    ? 'balance_hadi'
                    : 'sale'
                );
                setEditingTransaction({
                  id: `tx_${Date.now()}`,
                  date: currentDate,
                  time: '12:00',
                  type: item.category === 'screens' || item.category === 'spare_parts' ? 'maintenance' : 'sale',
                  category: item.category === 'screens' || item.category === 'spare_parts' ? 'maintenance' : 'accessories',
                  description: item.name,
                  price: item.sellingPrice,
                  cost: item.costPrice,
                  profit: item.profit,
                });
                setIsVoucherModalOpen(true);
              }}
            />
          )}

          {(activeTab === 'maintenance' || activeTab === 'maintenance_tickets') && (
            <MaintenanceHubView
              transactions={transactions}
              onAddTransaction={handleSaveTransaction}
              devices={maintenanceDevices}
              onUpdateDevices={setMaintenanceDevices}
              days={days}
              initialTab={activeTab === 'maintenance_tickets' ? 'tickets' : 'center'}
            />
          )}

          {activeTab === 'cash_drawer' && (
            <CashDrawerShiftView
              transactions={transactions}
              currentDate={currentDate}
            />
          )}

          {activeTab === 'stock_alerts' && (
            <StockAlertsReorderView
              inventory={inventory}
              suppliers={suppliers}
            />
          )}

          {activeTab === 'official_vouchers' && (
            <OfficialVoucherGenerator />
          )}

          {activeTab === 'barcode_manager' && <BarcodeGeneratorView />}

          {activeTab === 'account_statement' && (
            <AccountStatementView transactions={transactions} />
          )}

          {(activeTab === 'daily_ledger' ||
            activeTab === 'sales' ||
            activeTab === 'expenses') && (
            <DailyLedgerView
              currentDate={currentDate}
              onDateChange={handleDateChange}
              availableDates={availableDates}
              transactions={transactions}
              onEditTransaction={handleEditTransaction}
              onSaveTransaction={handleSaveTransaction}
              onSplitCompoundTransaction={handleSplitCompoundTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddNewForSection={handleOpenNewVoucher}
              dailySummary={dailySummary}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              inventory={inventory}
              onUpdateInventoryItem={(item) => {
                setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
                syncInventoryToCloud(item);
              }}
              onAddInventoryItem={(item) => {
                setInventory((prev) => [item, ...prev]);
                syncInventoryToCloud(item);
              }}
            />
          )}

          {activeTab === 'monthly_settlement' && (
            <MonthlySettlementView
              transactions={transactions}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onSelectDate={(d) => {
                handleDateChange(d);
                setActiveTab('daily_ledger');
              }}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'profit_sharing' && (
            <ProfitSharingSettingsView
              transactions={transactions}
              onConfigSaved={() => setProfitVersion((v) => v + 1)}
            />
          )}

          {(activeTab === 'mosaab_account' || activeTab === 'musab_ledger') && (
            <MosaabHubView
              transactions={transactions}
              currentMonth={currentMonth}
              onAddNewVoucher={handleOpenNewVoucher}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              days={days}
              onAddMusabEntry={(dayId, item) =>
                setDays((prev) =>
                  prev.map((d) =>
                    d.id === dayId
                      ? {
                          ...d,
                          musabPersonal:
                            item.type === 'مصعب شخصياً'
                              ? [item, ...(d.musabPersonal || [])]
                              : d.musabPersonal || [],
                          musabHouse:
                            item.type !== 'مصعب شخصياً'
                              ? [item, ...(d.musabHouse || [])]
                              : d.musabHouse || [],
                        }
                      : d
                  )
                )
              }
              ownerName={shopSettings.ownerName || 'مصعب الصوفي'}
              initialTab={activeTab === 'musab_ledger' ? 'detailed_ledger' : 'summary'}
            />
          )}

          {activeTab === 'networks' && (
            <NetworksBalanceView
              transactions={transactions}
              onAddNewVoucher={handleOpenNewVoucher}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {(activeTab === 'suppliers' || activeTab === 'suppliers_ledger') && (
            <SuppliersHubView
              suppliers={suppliers}
              transactions={transactions}
              onAddSupplier={(newSup) => setSuppliers((prev) => [newSup, ...prev])}
              onUpdateSupplier={(upd) =>
                setSuppliers((prev) => prev.map((s) => (s.id === upd.id ? upd : s)))
              }
              onDeleteSupplier={(id) => setSuppliers((prev) => prev.filter((s) => s.id !== id))}
              onAddNewVoucher={handleOpenNewVoucher}
              days={days}
              profiles={supplierProfiles}
              supplierTransactions={supplierTransactions}
              onAddProfile={(p) => setSupplierProfiles((prev) => [p, ...prev])}
              onUpdateProfile={(p) =>
                setSupplierProfiles((prev) =>
                  prev.map((x) => (x.id === p.id ? p : x))
                )
              }
              onDeleteProfile={(id) =>
                setSupplierProfiles((prev) => prev.filter((x) => x.id !== id))
              }
              onAddTransaction={(tx) =>
                setSupplierTransactions((prev) => [tx, ...prev])
              }
              onDeleteTransaction={(id) =>
                setSupplierTransactions((prev) => prev.filter((tx) => tx.id !== id))
              }
              onAddTransferToDay={(trans, dayId) =>
                setDays((prev) =>
                  prev.map((d) =>
                    d.id === dayId
                      ? {
                          ...d,
                          supplierTransfers: [
                            trans,
                            ...(d.supplierTransfers || []),
                          ],
                        }
                      : d
                  )
                )
              }
              initialTab={activeTab === 'suppliers_ledger' ? 'ledger' : 'directory'}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesView
              transactions={transactions}
              currentMonth={currentMonth}
              onAddNewVoucher={handleOpenNewVoucher}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              transactions={transactions}
              onAddNewVoucher={handleOpenNewVoucher}
              inventory={inventory}
              onAddInventoryItem={(item) => {
                setInventory((prev) => [item, ...prev]);
                syncInventoryToCloud(item);
              }}
              onUpdateInventoryItem={(item) => {
                setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
                syncInventoryToCloud(item);
              }}
              onBatchAddInventoryItems={(items) => {
                setInventory((prev) => [...items, ...prev]);
                items.forEach((it) => syncInventoryToCloud(it));
              }}
              onDeleteInventoryItem={(id) => setInventory((prev) => prev.filter((i) => i.id !== id))}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              transactions={transactions}
              onAddNewVoucher={handleOpenNewVoucher}
            />
          )}

          {activeTab === 'cloud_sync' && (
            <CloudSyncManagerView
              transactions={transactions}
              suppliers={suppliers}
              onRefreshData={handleRestoreData}
            />
          )}

          {activeTab === 'reports' && (
            <ExportReportsView
              transactions={transactions}
              currentMonth={currentMonth}
            />
          )}

          {activeTab === 'backup_github' && (
            <BackupGitHubModal
              transactions={transactions}
              suppliers={suppliers}
              onRestoreData={handleRestoreData}
            />
          )}

          {activeTab === 'forensic_audit' && (
            <ForensicAuditorView
              transactions={transactions}
              inventory={inventory}
              suppliers={suppliers}
              currentUser={currentUser}
              onNavigateToTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'invoice_ocr' && <SmartInvoiceOCR />}

          {activeTab === 'package_catalog' && <PackagePricingCatalog />}

          {/* Restored Complete Accounting and Operations Views */}
          {activeTab === 'master_table' && (
            <MasterTableView
              days={days}
              onSelectDay={handleSelectDayById}
            />
          )}

          {activeTab === 'partners_funding' && (
            <PartnersFundingView
              fundingItems={fundingItems}
              onAddFundingItem={(item) => setFundingItems((prev) => [item, ...prev])}
              onUpdateFundingItem={(item) =>
                setFundingItems((prev) => prev.map((f) => (f.id === item.id ? item : f)))
              }
              onDeleteFundingItem={(id) =>
                setFundingItems((prev) => prev.filter((f) => f.id !== id))
              }
              musabSettlement={musabSettlement}
              onUpdateMusabSettlement={setMusabSettlement}
            />
          )}

          {activeTab === 'delivery' && (
            <DeliveryView
              orders={deliveryOrders}
              onAddOrder={(o) => setDeliveryOrders((prev) => [o, ...prev])}
              onUpdateOrder={(o) =>
                setDeliveryOrders((prev) => prev.map((x) => (x.id === o.id ? o : x)))
              }
              onDeleteOrder={(id) =>
                setDeliveryOrders((prev) => prev.filter((x) => x.id !== id))
              }
            />
          )}

          {activeTab === 'damaged' && (
            <DamagedView
              items={damagedItems}
              onAddItem={(item) => setDamagedItems((prev) => [item, ...prev])}
              onDeleteItem={(id) =>
                setDamagedItems((prev) => prev.filter((x) => x.id !== id))
              }
            />
          )}

          {activeTab === 'returns' && (
            <ReturnsView
              days={days}
              onAddReturnToDay={(dayId, ret) =>
                setDays((prev) =>
                  prev.map((d) =>
                    d.id === dayId ? { ...d, returns: [ret, ...(d.returns || [])] } : d
                  )
                )
              }
            />
          )}

          {activeTab === 'assets' && (
            <AssetsView
              assets={shopAssets}
              onAddAsset={(a) => setShopAssets((prev) => [a, ...prev])}
              onDeleteAsset={(id) =>
                setShopAssets((prev) => prev.filter((a) => a.id !== id))
              }
            />
          )}

          {activeTab === 'owner_portal' && (
            <OwnerPortalView
              subscribedShops={subscribedShops}
              onAddSubscribedShop={(s) =>
                setSubscribedShops((prev) => [
                  { ...s, id: `shop_${Date.now()}` },
                  ...prev,
                ])
              }
              onUpdateSubscribedShop={(id, upd) =>
                setSubscribedShops((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, ...upd } : s))
                )
              }
              onDeleteSubscribedShop={(id) =>
                setSubscribedShops((prev) => prev.filter((s) => s.id !== id))
              }
              shopSettings={shopSettings}
            />
          )}

          {(activeTab === 'recharge_manager' || activeTab === 'telecom_engine') && (
            <RechargeHubView
              days={days}
              initialTab={activeTab === 'telecom_engine' ? 'engine' : 'daily_balance'}
            />
          )}

          {activeTab === 'archive' && (
            <ArchiveView
              days={days}
              onSelectDay={handleSelectDayById}
              onRestoreData={(restored) => setDays(restored)}
              onResetToDefault={() => setDays(INITIAL_DAYS_DATA)}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsView days={days} />
          )}

          {activeTab === 'sims' && (
            <SimsView
              days={days}
              simRecords={simRecords}
              onAddSimRecord={(r) => setSimRecords((prev) => [r, ...prev])}
              onDeleteSimRecord={(id) =>
                setSimRecords((prev) => prev.filter((r) => r.id !== id))
              }
            />
          )}

          {activeTab === 'shortages' && (
            <ShortagesView
              shortages={shortages}
              onAddShortage={(item) => setShortages((prev) => [item, ...prev])}
              onUpdateShortage={(item) =>
                setShortages((prev) =>
                  prev.map((s) => (s.id === item.id ? item : s))
                )
              }
              onDeleteShortage={(id) =>
                setShortages((prev) => prev.filter((s) => s.id !== id))
              }
              onMarkAsReceived={(item) =>
                setShortages((prev) =>
                  prev.map((s) =>
                    s.id === item.id ? { ...s, status: 'وصل للمحل' } : s
                  )
                )
              }
            />
          )}

          {activeTab === 'notebook_matcher' && (
            <ReportsView
              days={days}
              onSelectDay={handleSelectDayById}
            />
          )}
        </main>
      </div>

      {/* Voucher Input & Edit Modal */}
      <VoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => {
          setIsVoucherModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
        suppliers={suppliers}
        currentDate={currentDate}
        defaultType={defaultVoucherType}
      />

      {/* Smart AI Accountant Assistant Modal */}
      <SmartAIAssistant
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        transactions={transactions}
        onSaveTransaction={handleSaveTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        availableDates={availableDates}
        onAddParsedTransactions={handleAddParsedTransactions}
        onOverwriteDayTransactions={handleOverwriteDayTransactions}
        shopContext={{
          currentDate,
          dailySummary,
          monthlySettlement,
          suppliersCount: suppliers.length,
          transactionsCount: transactions.length,
        }}
        suppliers={suppliers}
        inventory={inventory}
        currentUser={currentUser}
        dailySummary={dailySummary}
        monthlySettlement={monthlySettlement}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setIsAIModalOpen(false);
        }}
      />

      {/* Direct Hands-Free Voice Continuous Call Modal */}
      <VoiceHandsFreeCallModal
        isOpen={isHandsFreeVoiceModalOpen}
        onClose={() => setIsHandsFreeVoiceModalOpen(false)}
        currentDate={currentDate}
        onCommitTransaction={handleSaveTransaction}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as any);
          setIsHandsFreeVoiceModalOpen(false);
        }}
        transactions={transactions}
        suppliers={suppliers}
        inventory={inventory}
        dailySummary={dailySummary}
        monthlySettlement={monthlySettlement}
      />

      {/* Smart AI System Audit Modal */}
      <SmartSystemAuditModal
        isOpen={isSystemAuditModalOpen}
        onClose={() => setIsSystemAuditModalOpen(false)}
        currentDate={currentDate}
        transactions={transactions}
        suppliers={suppliers}
        inventory={inventory}
        dailySummary={dailySummary}
        monthlySettlement={monthlySettlement}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as any);
          setIsSystemAuditModalOpen(false);
        }}
        onOpenAssistantChat={() => {
          setIsSystemAuditModalOpen(false);
          setIsAIModalOpen(true);
        }}
      />

      {/* Permissions Modal */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />

      {/* Universal Search Modal (Ctrl+K) */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        transactions={transactions}
        suppliers={suppliers}
        onNavigateToDate={(date) => {
          handleDateChange(date);
          setActiveTab('daily_ledger');
        }}
        onEditTransaction={(tx) => {
          setEditingTransaction(tx);
          setDefaultVoucherType(tx.type);
          setIsVoucherModalOpen(true);
        }}
        onViewAccountStatement={(_name) => {
          setActiveTab('account_statement');
        }}
      />

      {/* Universal Print Modal (for all pages & direct printing) */}
      <PrintModal />

      {/* Exit & Logout Confirmation Modal */}
      <ExitConfirmModal
        isOpen={isExitConfirmModalOpen}
        onClose={() => setIsExitConfirmModalOpen(false)}
        userName={currentUser?.name}
        onConfirm={() => {
          setIsExitConfirmModalOpen(false);
          setCurrentUser(null);
          try {
            localStorage.removeItem('mosaab_auth_current_user');
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* Shop Settings & Branding Modal */}
      <ShopSettingsModal
        isOpen={isShopSettingsModalOpen}
        onClose={() => setIsShopSettingsModalOpen(false)}
        settings={shopSettings}
        onSaveSettings={setShopSettings}
      />

      {/* License Activation Modal */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        currentLicense={systemLicense}
        shopSettings={shopSettings}
        onActivateLicense={setSystemLicense}
      />

      {/* Instant Cross-Device Sync Floating Notification */}
      {syncToastMessage && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 backdrop-blur animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-md">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-emerald-400 font-bold mb-0.5">مزامنة سحابية لحظية نشطة</div>
            <div className="text-xs sm:text-sm font-medium text-slate-100">{syncToastMessage}</div>
          </div>
          <button
            onClick={() => setSyncToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Hidden printable area container for direct system printing */}
      <div id="printableArea" className="hidden print:block" aria-hidden="true" />
    </div>
  );
}
