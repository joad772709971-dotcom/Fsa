import React from "react";
import {
  Sparkles,
  LayoutDashboard,
  ReceiptText,
  FileSpreadsheet,
  ScanLine,
  Bot,
  Settings,
  PlusCircle,
  Building2,
  FileCheck,
} from "lucide-react";
import { CompanyProfile } from "../types";

export type NavTab = "dashboard" | "transactions" | "invoices" | "scanner" | "advisor" | "tax-report";

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSmartModal: () => void;
  onOpenSettings: () => void;
  companyProfile: CompanyProfile;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenSmartModal,
  onOpenSettings,
  companyProfile,
}) => {
  const navItems = [
    { id: "dashboard", label: "لوحة المؤشرات", icon: LayoutDashboard },
    { id: "transactions", label: "دفتر القيود والمعاملات", icon: FileSpreadsheet },
    { id: "invoices", label: "الفواتير الضريبية", icon: ReceiptText },
    { id: "scanner", label: "مسح الإيصالات الذكي", icon: ScanLine },
    { id: "tax-report", label: "الإقرار الضريبي", icon: FileCheck },
    { id: "advisor", label: "المستشار المالي AI", icon: Bot },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-reverse space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">المحاسب الذكي</h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Gemini AI
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="w-3 h-3" />
                <span>{companyProfile.name}</span>
                {companyProfile.taxNumber && (
                  <span className="text-slate-400">| رقم ضريبي: {companyProfile.taxNumber}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-reverse space-x-3">
            {/* Smart AI Quick Entry Button */}
            <button
              id="header-smart-add-btn"
              onClick={onOpenSmartModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all duration-150 active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>تسجيل ذكي بالذكاء الاصطناعي</span>
            </button>

            {/* Settings button */}
            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              aria-label="إعدادات المنشأة"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              title="إعدادات المنشأة والضريبة"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-reverse space-x-1 sm:space-x-2 overflow-x-auto py-1 scrollbar-none border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
