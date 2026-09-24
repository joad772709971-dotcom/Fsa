import { SHOP_INFO, SHOP_POLICIES } from '../types';

export const cleanPhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '967' + cleaned.slice(1);
  } else if (cleaned.length === 9 && !cleaned.startsWith('967')) {
    cleaned = '967' + cleaned;
  }
  return cleaned;
};

export const openWhatsApp = (phone?: string, text?: string) => {
  const cleaned = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(text || '');
  const url = cleaned 
    ? `https://wa.me/${cleaned}?text=${encoded}` 
    : `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank');
};

export const openSMS = (phone?: string, text?: string) => {
  const cleaned = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(text || '');
  const url = cleaned ? `sms:${cleaned}?body=${encoded}` : `sms:?body=${encoded}`;
  window.open(url, '_blank');
};

export interface InvoiceDetails {
  type: 'مبيع إكسسوار' | 'بيع جوال' | 'صيانة وبرمجة' | 'سند قبض' | 'فاتورة مشتريات' | 'شريحة وباقة' | 'مرتجع';
  customerName?: string;
  customerPhone?: string;
  itemName: string;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  saleType?: 'نقد' | 'دين';
  guarantorName?: string;
  guarantorPhone?: string;
  workplace?: string;
  dueDate?: string;
  dueTime?: string;
  notes?: string;
  date?: string;
}

/**
 * إنشاء نص فاتورة رسمية مع الشروط والسياسات المعتمدة لمحل الرقم الأول
 */
export const buildCustomerInvoiceMessage = (inv: InvoiceDetails): string => {
  const dateStr = inv.date || new Date().toLocaleDateString('ar-YE');
  const paid = inv.paidAmount !== undefined ? inv.paidAmount : inv.totalAmount;
  const remaining = inv.remainingAmount !== undefined ? inv.remainingAmount : Math.max(0, inv.totalAmount - paid);

  let msg = `📱 *${SHOP_INFO.name}* 📱\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🧾 *سند وفاتورة إلكترونية* (${inv.type})\n`;
  msg += `📅 التاريخ: ${dateStr}\n`;
  if (inv.customerName) msg += `👤 العميل: ${inv.customerName}\n`;
  if (inv.customerPhone) msg += `📞 هاتف العميل: ${inv.customerPhone}\n`;
  msg += `🏷️ البيان / الصنف: ${inv.itemName}\n`;
  msg += `💰 المبلغ الإجمالي: ${inv.totalAmount.toLocaleString('ar-EG')} ر.ي\n`;
  msg += `💵 المدفوع نقداً: ${paid.toLocaleString('ar-EG')} ر.ي\n`;
  
  if (remaining > 0 || inv.saleType === 'دين') {
    msg += `⚠️ المتبقي (آجل/دين): *${remaining.toLocaleString('ar-EG')} ر.ي*\n`;
    if (inv.dueDate) msg += `⏳ موعد السداد المحدد: ${inv.dueDate} ${inv.dueTime ? `(الساعة ${inv.dueTime})` : '(8:00 مساءً)'}\n`;
    if (inv.guarantorName) msg += `🤝 الضمين / المعرف: ${inv.guarantorName} ${inv.guarantorPhone ? `(${inv.guarantorPhone})` : ''}\n`;
    if (inv.workplace) msg += `🏢 جهة العمل / العنوان: ${inv.workplace}\n`;
  }

  if (inv.notes) {
    msg += `📝 ملاحظات: ${inv.notes}\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `⚖️ *الشروط والسياسات الرسمية للمحل:*\n`;
  msg += `1️⃣ ${SHOP_POLICIES.generalWarranty}\n`;
  
  if (inv.type === 'بيع جوال') {
    msg += `2️⃣ *خاص بالجوالات:* ${SHOP_POLICIES.phonesWarranty}\n`;
  } else if (inv.type === 'صيانة وبرمجة') {
    msg += `2️⃣ *خاص بالصيانة:* ${SHOP_POLICIES.maintenanceStorage}\n`;
  }
  
  msg += `3️⃣ ${SHOP_POLICIES.noTasteReturn}\n`;
  msg += `4️⃣ _${SHOP_POLICIES.customerCourtesy}_\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📞 *للتواصل والاستفسار:*\n`;
  msg += `👨‍🔧 المهندس: ${SHOP_INFO.engineerPhone}\n`;
  msg += `🏪 إدارة المحل: ${SHOP_INFO.shopPhone}\n`;
  msg += `💬 _${SHOP_POLICIES.contactPreference}_`;

  return msg;
};

/**
 * رسالة تنبيه للضمين أو المعرف بشأن سداد الدين (مجدولة افتراضياً 8:00 مساءً)
 */
export const buildGuarantorAlertMessage = (
  guarantorName: string,
  customerName: string,
  remainingAmount: number,
  itemName: string,
  dueDate?: string,
  dueTime: string = '8:00 مساءً'
): string => {
  let msg = `السلام عليكم ورحمة الله وبركاته، الأخ العزيز / ${guarantorName} المحترم\n`;
  msg += `تحية طيبة من *${SHOP_INFO.name}* 📱\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `نود إحاطتكم كضمين ومعرف للأخ الكريم: *${customerName}*\n`;
  msg += `بشأن سداد المبلغ المتبقي عليه وقدره: *${remainingAmount.toLocaleString('ar-EG')} ر.ي*\n`;
  msg += `عن قيمة: (${itemName})\n`;
  if (dueDate) msg += `موعد السداد المتفق عليه: *${dueDate}* (تنبيه الساعة ${dueTime})\n`;
  msg += `يرجى التكرم بالتواصل معه والتأكيد على السداد في الموعد المحدد لإبراء الذمة.\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📞 للتواصل مع المحل:\n`;
  msg += `المهندس: ${SHOP_INFO.engineerPhone} | المحل: ${SHOP_INFO.shopPhone}\n`;
  msg += `شاكرين حسن تعاونكم وثقتكم.`;
  return msg;
};

/**
 * كرت استلام صيانة رسمي للعميل عبر الواتساب
 */
export const buildMaintenanceTicketMessage = (device: {
  ticketNumber: string | number;
  customerName: string;
  customerPhone?: string;
  deviceModel: string;
  issueDescription: string;
  receivedDate: string;
  expectedCost?: number;
  estimatedCost?: number;
  paidAdvance?: number;
  paidAmount?: number;
  remainingAmount: number;
  technician?: string;
  notes?: string;
}): string => {
  const total = device.estimatedCost !== undefined ? device.estimatedCost : (device.expectedCost || 0);
  const paid = device.paidAmount !== undefined ? device.paidAmount : (device.paidAdvance || 0);

  let msg = `📱 *${SHOP_INFO.name}* 📱\n`;
  msg += `🔧 *كرت وسند استلام صيانة رقم:* #${device.ticketNumber}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📅 تاريخ الاستلام: ${device.receivedDate}\n`;
  msg += `👤 اسم العميل: ${device.customerName}\n`;
  msg += `📱 الجهاز والموديل: *${device.deviceModel}*\n`;
  msg += `🔍 العطل المشكو منه: ${device.issueDescription}\n`;
  msg += `💰 تكلفة الصيانة المتفق عليها: ${total.toLocaleString('ar-EG')} ر.ي\n`;
  msg += `💵 المقدم المدفوع: ${paid.toLocaleString('ar-EG')} ر.ي\n`;
  msg += `⚠️ المتبقي عند الاستلام: *${device.remainingAmount.toLocaleString('ar-EG')} ر.ي*\n`;
  if (device.technician) msg += `👨‍🔧 الفني المستلم: ${device.technician}\n`;
  if (device.notes) msg += `📝 ملاحظات الفحص: ${device.notes}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `⚖️ *شروط وقواعد الصيانة المعتمدة بالمحل:*\n`;
  msg += `1️⃣ ${SHOP_POLICIES.generalWarranty}\n`;
  msg += `2️⃣ ⚠️ *هام جداً:* ${SHOP_POLICIES.maintenanceStorage}\n`;
  msg += `3️⃣ ${SHOP_POLICIES.noTasteReturn}\n`;
  msg += `4️⃣ _${SHOP_POLICIES.customerCourtesy}_\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📍 العنوان: ${SHOP_INFO.location}\n`;
  msg += `👨‍🔧 تلفون المهندس: ${SHOP_INFO.engineerPhone}\n`;
  msg += `🏪 إدارة المحل: ${SHOP_INFO.shopPhone}`;
  return msg;
};

/**
 * إشعار جاهزية الجهاز واستلامه
 */
export const buildMaintenanceReadyMessage = (device: {
  ticketNumber: string | number;
  customerName: string;
  customerPhone?: string;
  deviceModel: string;
  remainingAmount: number;
}): string => {
  let msg = `السلام عليكم ورحمة الله وبركاته، أستاذ / ${device.customerName} المحترم 🌸\n`;
  msg += `نحيطكم علماً بأن جهازكم (*${device.deviceModel}*) تم إصلاحه بنجاح وهو الآن *جاهز للاستلام* في المحل 📱✅\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🔖 رقم كرت الصيانة: #${device.ticketNumber}\n`;
  msg += `💵 المبلغ المتبقي للسداد: *${device.remainingAmount.toLocaleString('ar-EG')} ر.ي*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `⚠️ يرجى التكرم بالمرور واستلام الجهاز وتجربته فوراً قبل المغادرة.\n`;
  msg += `📍 العنوان: ${SHOP_INFO.location}\n`;
  msg += `📞 المهندس: ${SHOP_INFO.engineerPhone} | المحل: ${SHOP_INFO.shopPhone}\n`;
  msg += `أهلاً وسهلاً بكم في *${SHOP_INFO.name}* ✨`;
  return msg;
};

/**
 * تنبيه مهلة تخزين الجوال (تنبيه قبل المصادرة)
 */
export const buildStorageWarningMessage = (device: {
  ticketNumber: string | number;
  customerName: string;
  deviceModel: string;
  receivedDate: string;
  remainingAmount: number;
}): string => {
  let msg = `⚠️ *تنبيه عاجل من ${SHOP_INFO.name}* ⚠️\n`;
  msg += `الأخ الكريم / ${device.customerName} المحترم\n`;
  msg += `نود تذكيركم بأن جهازكم (*${device.deviceModel}*) المستلم بتاريخ (${device.receivedDate}) برقم كرت (${device.ticketNumber}) لا يزال موجوداً في المحل.\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `وفقاً لسياسة المحل المعتمدة: ("في حال إبلاغك بجاهزية الجوال وتأخرت عن استلامه لمدة شهر يتم مصادرة الجوال، وأي جوال متروك بالمحل دون متابعة لمدة شهر يصادر تلقائياً").\n`;
  msg += `المبلغ المتبقي: ${device.remainingAmount.toLocaleString('ar-EG')} ر.ي\n`;
  msg += `يرجى سرعة الحضور لاستلام جهازكم تفادياً لتطبيق اللائحة.\n`;
  msg += `📞 للتواصل: ${SHOP_INFO.engineerPhone} - ${SHOP_INFO.shopPhone}`;
  return msg;
};

/**
 * كشف حساب ومطابقة مع المورد / التاجر عبر الواتساب
 */
export const buildSupplierStatementMessage = (supplier: {
  name: string;
  phone?: string;
  location?: string;
  dealingType?: string;
  totalTransferred: number;
  totalPurchases: number;
  balance: number;
  transactionsCount: number;
  recentTransactions?: { date: string; type?: string; amount: number; method?: string; notes?: string }[];
}): string => {
  let msg = `🏪 *${SHOP_INFO.name}* 🏪\n`;
  msg += `📄 *كشف حساب ومطابقة مالية للمورد:* ${supplier.name}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  if (supplier.location) msg += `📍 العنوان/السوق: ${supplier.location}\n`;
  if (supplier.dealingType) msg += `⚙️ نظام التعامل: ${supplier.dealingType}\n`;
  msg += `📅 تاريخ التقرير: ${new Date().toLocaleDateString('ar-YE')}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💸 إجمالي الحوالات والمدفوعات المرسلة: *${supplier.totalTransferred.toLocaleString('ar-EG')} ر.ي*\n`;
  msg += `📦 إجمالي المشتريات والبضائع المستلمة: *${supplier.totalPurchases.toLocaleString('ar-EG')} ر.ي*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  
  if (supplier.balance > 0) {
    msg += `⚖️ *حالة الحساب / الرصيد:* لنا عندكم فارق تحويلات بمبلغ (*${supplier.balance.toLocaleString('ar-EG')} ر.ي*)\n`;
  } else if (supplier.balance < 0) {
    msg += `⚖️ *حالة الحساب / الرصيد:* لكم عندنا متبقي بضائع بمبلغ (*${Math.abs(supplier.balance).toLocaleString('ar-EG')} ر.ي*)\n`;
  } else {
    msg += `⚖️ *حالة الحساب / الرصيد:* الحساب مسوى ومطابق تماماً (0 ر.ي) ✅\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📊 إجمالي عدد العمليات المقيدة: ${supplier.transactionsCount} عملية\n`;
  
  if (supplier.recentTransactions && supplier.recentTransactions.length > 0) {
    msg += `\n*آخر العمليات المسجلة:*\n`;
    supplier.recentTransactions.slice(0, 5).forEach((t, i) => {
      msg += `${i + 1}. [${t.date}] - ${t.type || 'حوالة/مشتريات'}: ${t.amount.toLocaleString('ar-EG')} ر.ي ${t.method ? `(${t.method})` : ''} ${t.notes ? `- ${t.notes}` : ''}\n`;
    });
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `يرجى مراجعة الكشف وتأكيد المطابقة.\n`;
  msg += `📞 المحل: ${SHOP_INFO.shopPhone} | المهندس: ${SHOP_INFO.engineerPhone}\n`;
  msg += `شكراً لحسن تعاملكم معنا ✨`;
  return msg;
};

/**
 * إشعار إرسال حوالة / دفعة جديدة للمورد
 */
export const buildSupplierTransferAlertMessage = (transfer: {
  supplierName: string;
  amount: number;
  date: string;
  method?: string;
  transferNumber?: string;
  invoiceNumber?: string;
  notes?: string;
}): string => {
  let msg = `🏪 *${SHOP_INFO.name}* 🏪\n`;
  msg += `💸 *إشعار إرسال حوالة / دفعة مالية*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 التاجر / المورد: ${transfer.supplierName}\n`;
  msg += `💰 المبلغ المرسل: *${transfer.amount.toLocaleString('ar-EG')} ر.ي*\n`;
  msg += `📅 التاريخ: ${transfer.date}\n`;
  if (transfer.method) msg += `💳 طريقة التحويل / الصراف: ${transfer.method}\n`;
  if (transfer.transferNumber) msg += `🔖 رقم السند / الحوالة: ${transfer.transferNumber}\n`;
  if (transfer.invoiceNumber) msg += `🧾 مقابل فاتورة رقم: ${transfer.invoiceNumber}\n`;
  if (transfer.notes) msg += `📝 البيان: ${transfer.notes}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `يرجى تأكيد الاستلام وتقييدها في حسابنا لديكم.\n`;
  msg += `📞 ${SHOP_INFO.engineerPhone} - ${SHOP_INFO.shopPhone}`;
  return msg;
};
