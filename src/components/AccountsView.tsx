import React, { useState } from 'react';
import { DayRecord } from '../types';
import { formatNumber, calculatePeriodSummary } from '../utils/accounting';
import { exportAccountsToExcel } from '../utils/excelExport';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Printer, 
  FileSpreadsheet, 
  CheckCircle2,
  PieChart,
  Coins,
  Receipt
} from 'lucide-react';

interface AccountsViewProps {
  days: DayRecord[];
}

export const AccountsView: React.FC<AccountsViewProps> = ({ days }) => {
  const summary = calculatePeriodSummary(days);

  const totalInflows = summary.totalGrossRevenue;
  const totalOutflows = summary.totalOutflows;
  const netFundBalance = summary.netCashFlow;

  const totalCashSales = summary.totalAccessories;
  const totalPhonesSales = summary.totalPhonesPaid;
  const totalMaintenanceRevenue = summary.totalMaintenance;
  const totalRechargeGross = summary.totalRechargeWithProfit;

  const totalWorkerOutflows = summary.totalWorkers;
  const totalShopExpenses = summary.totalExpenses;
  const totalMusabPayments = summary.totalMusabHouse + summary.totalMusabPersonal;
  const totalSuppliersPayments = summary.totalSupplierTransfers;

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Header */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black shadow-inner shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">دليل الحسابات والصناديق والسيولة المالية</h2>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  مركز الخزينة العام
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                موازين المراجعة، حركة النقدية الداخلة والخارجة، وإجمالي أرصدة الصناديق وحسابات الشركاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportAccountsToExcel(days)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px] shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير دليل الحسابات والصندوق (Excel)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الميزان</span>
            </button>
          </div>

        </div>

        {/* Main Treasury Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-700/60">
          
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700/70">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-medium">إجمالي المقبوضات النقدية:</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-black text-emerald-400 font-mono-num">{formatNumber(totalInflows)}</span>
              <span className="text-xs text-slate-400">ر.ي</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">مبيعات نقدية + جوالات + صيانة + رصيد</span>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700/70">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-400 font-medium">إجمالي المدفوعات اليومية:</span>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-black text-rose-400 font-mono-num">{formatNumber(totalOutflows)}</span>
              <span className="text-xs text-slate-400">ر.ي</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">مصاريف + سلف عمال + دفعات تجار + بيت مصعب</span>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-medium">عهدة مشتريات مصعب:</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-black text-amber-400 font-mono-num">{formatNumber(summary.musabPurchasingCashFromBox)}</span>
              <span className="text-xs text-slate-400">ر.ي</span>
            </div>
            <span className="text-[10px] text-amber-300/80 block mt-1">150,000 كاش + 67,000 جوالي (للبضاعة)</span>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-rose-500/40 bg-gradient-to-br from-[#0F172A] to-rose-950/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-300 font-medium">زلط تالفة ومزورة (مخصومة):</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-black text-rose-400 font-mono-num">{formatNumber(summary.counterfeitCashLoss || 4000)}</span>
              <span className="text-xs text-slate-400">ر.ي</span>
            </div>
            <span className="text-[10px] text-rose-300/80 block mt-1">تم استبعادها وخصمها من الصندوق فقط</span>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-emerald-500/50 bg-gradient-to-br from-[#0F172A] to-emerald-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-bold">صافي المتبقي بالصندوق فعلياً:</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-black text-emerald-300 font-mono-num">{formatNumber(summary.netCashFinalInBox)}</span>
              <span className="text-xs text-slate-400">ر.ي</span>
            </div>
            <span className="text-[10px] text-emerald-300/70 block mt-1">الرصيد الفعلي بالخزينة بعد كافة الخصومات</span>
          </div>

        </div>
      </div>

      {/* Account Ledgers Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Inflows Tree */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>تحليل مصادر الدخل والمقبوضات (الداخل)</span>
            </h3>
            <span className="text-xs font-mono-num font-black text-emerald-400">{formatNumber(totalInflows)} ر.ي</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-300">مبيعات الإكسسوارات والنقدية العادية:</span>
              </div>
              <span className="font-mono-num font-bold text-white">{formatNumber(totalCashSales)} ر.ي</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-300">مبيعات قسم الجوالات المسددة:</span>
              </div>
              <span className="font-mono-num font-bold text-white">{formatNumber(totalPhonesSales)} ر.ي</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">إيرادات قسم الصيانة والبرمجة:</span>
              </div>
              <span className="font-mono-num font-bold text-white">{formatNumber(totalMaintenanceRevenue)} ر.ي</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">إجمالي مبيعات الرصيد (يمن موبايل، سبأفون، يو، باقات):</span>
              </div>
              <span className="font-mono-num font-bold text-white">{formatNumber(totalRechargeGross)} ر.ي</span>
            </div>
          </div>
        </div>

        {/* Outflows Tree */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>تحليل المصروفات والمدفوعات (الخارج)</span>
            </h3>
            <span className="text-xs font-mono-num font-black text-rose-400">{formatNumber(totalOutflows)} ر.ي</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">مسحوبات وسلف الكادر (حمدان، المهندس، عبد الغني):</span>
              </div>
              <span className="font-mono-num font-bold text-white">{formatNumber(totalWorkerOutflows)} ر.ي</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-300">مصاريف المحل والتشغيل (غداء، أكياس، نظافة...):</span>
              </div>
              <span className="font-mono-num font-bold text-white">{formatNumber(totalShopExpenses)} ر.ي</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-300">حساب وسحوبات بيت مصعب:</span>
              </div>
              <span className="font-mono-num font-bold text-white">{formatNumber(totalMusabPayments)} ر.ي</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-slate-300">سداد وتحويلات التجار والموردين:</span>
              </div>
              <span className="font-mono-num font-bold text-white">{formatNumber(totalSuppliersPayments)} ر.ي</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
