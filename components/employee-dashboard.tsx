"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Lock,
  Users,
  FileText,
  Package,
  Warehouse,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
  ShoppingCart,
  Banknote,
  Building,
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import type { User } from "@/lib/auth"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"

// Components
import { EmployeesManagement } from "@/components/employees-management"
import { InvoicesManagement } from "@/components/invoices-management"
import { InventoryManagement } from "@/components/inventory-management"
import { WarehousesManagement } from "@/components/warehouses-management"
import { ReportsView } from "@/components/reports-view"
import { DebtManagement } from "@/components/debt-management"
import { AccountingModules } from "@/components/accounting-modules"
import { SalesManagement } from "@/components/sales-management"
import { PurchasingManagement } from "@/components/purchasing-management"
import { HRPayrollManagement } from "@/components/hr-payroll-management"
import { CashBankManagement } from "@/components/cash-bank-management"
import { FixedAssetsManagement } from "@/components/fixed-assets-management"
import { TaxManagement } from "@/components/tax-management"
import { ChartOfAccounts } from "@/components/chart-of-accounts"
import { GeneralLedger } from "@/components/general-ledger"
import { FinancialReports } from "@/components/financial-reports"
import { AccountsReceivableManagement } from "@/components/accounts-receivable-management"
import { AccountsPayableManagement } from "@/components/accounts-payable-management"

interface EmployeeDashboardProps {
  user: User
}

type ActiveModule =
  | "overview"
  | "accounting"
  | "employees"
  | "invoices"
  | "inventory"
  | "warehouses"
  | "reports"
  | "debts"
  | "sales"
  | "purchasing"
  | "hr_payroll"
  | "cash_bank"
  | "fixed_assets"
  | "tax_management"
  | "general_ledger"
  | "accounts_receivable"
  | "accounts_payable"
  | "financial_reports"

export function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const { t, isRTL } = useTranslation()
  const [permissions, setPermissions] = useState<string[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()

  const viewParam = searchParams.get('view') as ActiveModule
  const activeModule = viewParam || "overview"

  const navigateTo = (view: ActiveModule) => {
    if (view === 'overview') {
      router.push('/employee')
    } else {
      router.push(`/employee?view=${view}`)
    }
  }

  useEffect(() => {
    // Get user permissions safe check
    if (user.permissions && typeof user.permissions === 'object') {
      const userPermissions = Object.keys(user.permissions).filter((permission) => (user.permissions as any)[permission] === true)
      setPermissions(userPermissions)
    }
  }, [user.permissions])

  const canManage = (module: string) => permissions.includes(`manage_${module}`)
  const canView = (module: string) => permissions.includes(`view_${module}`)

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "employees": return Users
      case "invoices": return FileText
      case "inventory": return Package
      case "warehouses": return Warehouse
      case "reports": return BarChart3
      case "debts": return CreditCard
      case "accounting": return LayoutDashboard
      case "sales": return TrendingUp
      case "purchasing": return ShoppingCart
      case "hr_payroll": return Users
      case "cash_bank": return Banknote
      case "fixed_assets": return Building
      case "tax_management": return Calculator
      case "general_ledger": return BookOpen
      case "accounts_receivable": return FileText
      case "accounts_payable": return CreditCard
      case "financial_reports": return BarChart3
      default: return Package
    }
  }

  const availableModules = [
    { id: "accounting", name: t("accounting"), description: t("accounting_modules_desc") },
    { id: "sales", name: t("sales"), description: t("operations_desc") },
    { id: "purchasing", name: t("purchasing"), description: t("operations_desc") },
    { id: "employees", name: t("team_directory"), description: t("hr_desc") },
    { id: "hr_payroll", name: t("hr_payroll"), description: t("hr_desc") },
    { id: "invoices", name: t("invoices"), description: t("operations_desc") },
    { id: "inventory", name: t("inventory"), description: t("operations_desc") },
    { id: "warehouses", name: t("warehouses"), description: t("operations_desc") },
    { id: "general_ledger", name: t("general_ledger"), description: t("finance_desc") },
    { id: "cash_bank", name: t("cash_bank"), description: t("finance_desc") },
    { id: "accounts_receivable", name: t("receivables"), description: t("finance_desc") },
    { id: "accounts_payable", name: t("payables"), description: t("finance_desc") },
    { id: "fixed_assets", name: t("fixed_assets"), description: t("finance_desc") },
    { id: "tax_management", name: t("tax_management"), description: t("finance_desc") },
    { id: "financial_reports", name: t("financial_reports"), description: t("finance_desc") },
    { id: "reports", name: t("general_reports"), description: t("analytics") },
    { id: "debts", name: t("debt_management"), description: t("finance_desc") },
  ].filter(
    (module) => {
      if (module.id === 'accounting') return false // Hide generic accounting if specific modules are used
      return canView(module.id) || canManage(module.id) || (module.id === "debts" && canView("invoices"))
    }
  )

  const renderActiveModule = () => {
    const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
      <div className={cn("bg-slate-900/50 backdrop-blur-3xl border border-slate-800 p-8 min-h-[calc(100vh-12rem)] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700", isRTL && "text-right font-arabic")}>
        <div className={cn("flex items-center gap-3 mb-10 text-slate-500 cursor-pointer hover:text-amber-500 transition-all group", isRTL && "flex-row-reverse justify-end")} onClick={() => navigateTo("overview")}>
          {isRTL ? <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /> : <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />}
          <span className="text-xs font-black uppercase tracking-[0.3em] font-mono">{t("back_to_overview")}</span>
        </div>
        {children}
      </div>
    )

    switch (activeModule) {
      case "accounting": return <ContentWrapper><AccountingModules user={user as any} canManage={canManage} canView={canView} /></ContentWrapper>
      case "employees": return <ContentWrapper><EmployeesManagement user={user as any} canManage={canManage("employees")} /></ContentWrapper>
      case "invoices": return <ContentWrapper><InvoicesManagement user={user as any} canManage={canManage("invoices")} /></ContentWrapper>
      case "inventory": return <ContentWrapper><InventoryManagement user={user as any} canManage={canManage("inventory")} canView={canView("inventory")} /></ContentWrapper>
      case "warehouses": return <ContentWrapper><WarehousesManagement user={user as any} canManage={canManage("warehouses")} /></ContentWrapper>
      case "reports": return <ContentWrapper><ReportsView user={user as any} /></ContentWrapper>
      case "debts": return <ContentWrapper><DebtManagement user={user as any} canManage={canManage("invoices")} /></ContentWrapper>
      case "sales": return <ContentWrapper><SalesManagement user={user as any} canManage={canManage("sales")} canView={canView("sales")} /></ContentWrapper>
      case "purchasing": return <ContentWrapper><PurchasingManagement user={user as any} canManage={canManage("purchasing")} canView={canView("purchasing")} /></ContentWrapper>
      case "hr_payroll": return <ContentWrapper><HRPayrollManagement user={user as any} canManage={canManage("hr_payroll")} canView={canView("hr_payroll")} /></ContentWrapper>
      case "cash_bank": return <ContentWrapper><CashBankManagement user={user as any} canManage={canManage("cash_bank")} canView={canView("cash_bank")} /></ContentWrapper>
      case "fixed_assets": return <ContentWrapper><FixedAssetsManagement user={user as any} canManage={canManage("fixed_assets")} canView={canView("fixed_assets")} /></ContentWrapper>
      case "tax_management": return <ContentWrapper><TaxManagement user={user as any} canManage={canManage("tax_management")} canView={canView("tax_management")} /></ContentWrapper>
      case "general_ledger": return <ContentWrapper><ChartOfAccounts user={user as any} /></ContentWrapper>
      case "accounts_receivable": return <ContentWrapper><AccountsReceivableManagement user={user as any} canManage={canManage("accounts_receivable")} canView={canView("accounts_receivable")} /></ContentWrapper>
      case "accounts_payable": return <ContentWrapper><AccountsPayableManagement user={user as any} canManage={canManage("accounts_payable")} canView={canView("accounts_payable")} /></ContentWrapper>
      case "financial_reports": return <ContentWrapper><FinancialReports user={user as any} canManage={canManage("financial_reports")} canView={canView("financial_reports")} /></ContentWrapper>

      default: return renderOverview()
    }
  }

  const renderOverview = () => (
    <div className={cn("space-y-12 animate-in fade-in duration-1000", isRTL && "text-right")}>
      <div className="space-y-2">
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
          <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500">Secure Environment</p>
        </div>
        <h2 className="text-4xl font-light text-white tracking-tight leading-none">{t("employee_portal")}</h2>
        <p className="text-slate-500 text-sm max-w-xl">{t("employee_portal_desc")}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Permission Card */}
        <div className="bg-slate-950/40 backdrop-blur-3xl border border-slate-800 p-8 relative group overflow-hidden col-span-full border-l-amber-500/50 shadow-2xl">
          <div className="space-y-6">
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Lock className="h-3 w-3 text-amber-500/50" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{t("your_permissions")}</h3>
            </div>
            <div className={cn("flex flex-wrap gap-3", isRTL && "flex-row-reverse")}>
              {permissions.length > 0 ? permissions.map((p) => (
                <Badge key={p} variant="outline" className="text-[9px] bg-slate-900/50 text-slate-300 px-3 py-1 border-slate-800 rounded-none uppercase font-bold tracking-widest hover:border-amber-500/30 transition-all">
                  {p.split('_').map(word => t(word.toLowerCase() as any)).join(' ')}
                </Badge>
              )) : (
                <span className="text-xs text-slate-600 italic">{t("no_permissions")}</span>
              )}
            </div>
          </div>
        </div>

        {availableModules.map((module, idx) => {
          const Icon = getModuleIcon(module.id)
          const hasManagePermission = canManage(module.id) || (module.id === "debts" && canManage("invoices"))

          return (
            <div
              key={module.id}
              className="bg-slate-950/40 backdrop-blur-3xl border border-slate-800 p-8 relative group cursor-pointer hover:border-amber-500/30 transition-all duration-500 shadow-xl overflow-hidden"
              onClick={() => navigateTo(module.id as ActiveModule)}
            >
              {/* Decorative background element */}
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                <Icon className="h-24 w-24 text-white" />
              </div>

              <div className="space-y-4 relative z-10">
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className="h-10 w-10 rounded-none bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-amber-500/30 transition-all duration-500">
                    <Icon className="h-5 w-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 border whitespace-nowrap",
                    hasManagePermission ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-slate-800 text-slate-600'
                  )}>
                    {hasManagePermission ? t("full_access") : t("view_only")}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-light text-white group-hover:text-amber-500 transition-all duration-500 tracking-tight">{module.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{module.description}</p>
                </div>

                <div className={cn("pt-4 flex items-center gap-2 text-slate-600 group-hover:text-white transition-all text-[9px] font-black uppercase tracking-widest", isRTL && "flex-row-reverse")}>
                  <span>Launch Module</span>
                  {isRTL ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {permissions.length === 0 && (
        <div className="text-center py-24 text-slate-700 border border-dashed border-slate-800 bg-slate-950/20">
          <Lock className="h-16 w-16 mx-auto mb-6 opacity-5" />
          <p className="text-[10px] uppercase tracking-[0.5em] font-black">{t("restricted_access")}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen">
      {renderActiveModule()}
    </div>
  )
}
