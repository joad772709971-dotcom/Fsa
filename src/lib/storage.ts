import { CompanyProfile, FinancialSummary, Invoice, Transaction } from "../types";
import { initialCompanyProfile, initialInvoices, initialTransactions } from "../data/initialData";

const STORAGE_KEYS = {
  TRANSACTIONS: "smart_accountant_transactions_v1",
  INVOICES: "smart_accountant_invoices_v1",
  PROFILE: "smart_accountant_profile_v1",
};

export function loadCompanyProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load company profile", e);
  }
  return initialCompanyProfile;
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save company profile", e);
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load transactions", e);
  }
  // Initialize with realistic seed transactions
  saveTransactions(initialTransactions);
  return initialTransactions;
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error("Failed to save transactions", e);
  }
}

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load invoices", e);
  }
  saveInvoices(initialInvoices);
  return initialInvoices;
}

export function saveInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } catch (e) {
    console.error("Failed to save invoices", e);
  }
}

export function resetAllData(): {
  profile: CompanyProfile;
  transactions: Transaction[];
  invoices: Invoice[];
} {
  saveCompanyProfile(initialCompanyProfile);
  saveTransactions(initialTransactions);
  saveInvoices(initialInvoices);
  return {
    profile: initialCompanyProfile,
    transactions: initialTransactions,
    invoices: initialInvoices,
  };
}

export function computeFinancialSummary(transactions: Transaction[]): FinancialSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let collectedVat = 0; // ضريبة المخرجات
  let paidVat = 0; // ضريبة المدخلات
  let receivablesTotal = 0;
  let payablesTotal = 0;
  let cashBalance = 5000; // رصيد افتتاحي
  let bankBalance = 45000; // رصيد افتتاحي

  transactions.forEach((tx) => {
    if (tx.status === "cancelled") return;

    const txAmount = tx.amount ?? tx.price ?? 0;
    const txNet = tx.netAmount ?? txAmount;
    const txVat = tx.vatAmount ?? 0;

    if (tx.type === "income") {
      totalIncome += txNet;
      collectedVat += txVat;

      if (tx.paymentMethod === "cash") {
        cashBalance += txAmount;
      } else if (tx.paymentMethod === "bank" || tx.paymentMethod === "card") {
        bankBalance += txAmount;
      }
    } else if (tx.type === "expense") {
      totalExpense += txNet;
      paidVat += txVat;

      if (tx.paymentMethod === "cash") {
        cashBalance -= txAmount;
      } else if (tx.paymentMethod === "bank" || tx.paymentMethod === "card") {
        bankBalance -= txAmount;
      }
    } else if (tx.type === "receivable") {
      if (tx.status !== "completed") {
        receivablesTotal += txAmount;
      }
    } else if (tx.type === "payable") {
      if (tx.status !== "completed") {
        payablesTotal += txAmount;
      }
    }
  });

  const netProfit = totalIncome - totalExpense;
  const netVatDue = collectedVat - paidVat;

  return {
    totalIncome,
    totalExpense,
    netProfit,
    collectedVat,
    paidVat,
    netVatDue,
    receivablesTotal,
    payablesTotal,
    cashBalance,
    bankBalance,
  };
}

export function formatCurrency(amount: number = 0, currency = "ر.س"): string {
  const formatted = new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  return `${formatted} ${currency}`;
}

// Arabic number to words conversion for tax invoice tafqeet
export function arabicNumberToWords(amount: number, currencyUnit = "ريال سعودي", fractionUnit = "هللة"): string {
  if (!amount || isNaN(amount)) return `صفر ${currencyUnit}`;

  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  function convertGroup(n: number): string {
    let res = "";
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    const o = rem % 10;

    if (h > 0) {
      res += hundreds[h];
      if (rem > 0) res += " و ";
    }

    if (rem >= 10 && rem <= 19) {
      res += teens[rem - 10];
    } else {
      if (o > 0) {
        res += ones[o];
        if (t > 0) res += " و ";
      }
      if (t > 0) {
        res += tens[t];
      }
    }
    return res;
  }

  const intPart = Math.floor(amount);
  const fracPart = Math.round((amount - intPart) * 100);

  let words = "";

  if (intPart === 0) {
    words = "صفر";
  } else {
    const thousands = Math.floor(intPart / 1000);
    const rest = intPart % 1000;

    if (thousands > 0) {
      if (thousands === 1) words += "ألف";
      else if (thousands === 2) words += "ألفان";
      else if (thousands >= 3 && thousands <= 10) words += `${convertGroup(thousands)} آلاف`;
      else words += `${convertGroup(thousands)} ألف`;

      if (rest > 0) words += " و ";
    }

    if (rest > 0) {
      words += convertGroup(rest);
    }
  }

  words = `فقط ${words} ${currencyUnit}`;

  if (fracPart > 0) {
    words += ` و ${convertGroup(fracPart)} ${fractionUnit}`;
  }

  words += " لا غير";
  return words;
}
