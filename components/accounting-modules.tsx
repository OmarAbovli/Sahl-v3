"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  FileText,
  Users,
  Package,
  ShoppingCart,
  Building,
  Calculator,
  TrendingUp,
  Settings,
  CreditCard,
  Banknote,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Eye,
  Lock,
  Loader2
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { ChartOfAccounts } from "@/components/accounting/chart-of-accounts"
import { JournalEntries } from "@/components/accounting/journal-entries"
import { CashBankManagement } from "@/components/cash-bank-management"
import { FixedAssetsManagement } from "@/components/fixed-assets-management"
import { AccountsReceivableManagement } from "@/components/accounts-receivable-management"
import { AccountsPayableManagement } from "@/components/accounts-payable-management"
import { HRPayrollManagement } from "@/components/hr-payroll-management"
import { TaxManagement } from "@/components/tax-management"
import { SalesManagement } from "@/components/sales-management"
import { PurchasingManagement } from "@/components/purchasing-management"
import { InventoryManagementDashboard } from "@/components/inventory-management-dashboard"
import { FinancialReports } from "@/components/financial-reports"

interface AccountingModulesProps {
  user: any
  canManage: (module: string) => boolean
  canView: (module: string) => boolean
}

export function AccountingModules({ user, canManage, canView }: AccountingModulesProps) {
  const { t, isRTL } = useTranslation()
  const [activeModule, setActiveModule] = useState<string | null>(null)

  const modules = [
    { id: "general_ledger", name: t("general_ledger"), icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "accounts_receivable", name: t("accounts_receivable"), icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "accounts_payable", name: t("accounts_payable"), icon: CreditCard, color: "text-rose-500", bg: "bg-rose-500/10" },
    { id: "inventory_management", name: t("inventory"), icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "purchasing", name: t("purchasing"), icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "sales", name: t("sales"), icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { id: "hr_payroll", name: t("hr_payroll"), icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { id: "cash_bank", name: t("cash_bank"), icon: Banknote, color: "text-green-500", bg: "bg-green-500/10" },
    { id: "fixed_assets", name: t("fixed_assets"), icon: Building, color: "text-slate-400", bg: "bg-slate-400/10" },
    { id: "tax_management", name: t("tax_management"), icon: Calculator, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: "financial_reports", name: t("reports"), icon: FileText, color: "text-pink-500", bg: "bg-pink-500/10" },
  ]

  if (activeModule) {
    let Component = null
    switch (activeModule) {
      case "general_ledger": Component = <JournalEntries user={user} canManage={canManage("general_ledger")} canView={canView("general_ledger")} accounts={[]} />; break
      case "accounts_receivable": Component = <AccountsReceivableManagement canManage={canManage('accounts_receivable')} canView={canView('accounts_receivable')} user={user} />; break
      case "accounts_payable": Component = <AccountsPayableManagement canManage={canManage('accounts_payable')} canView={canView('accounts_payable')} user={user} />; break
      case "inventory_management": Component = <InventoryManagementDashboard user={user} />; break
      case "purchasing": Component = <PurchasingManagement canManage={canManage('purchasing')} canView={canView('purchasing')} user={user} />; break
      case "sales": Component = <SalesManagement canManage={canManage('sales')} canView={canView('sales')} user={user} />; break
      case "hr_payroll": Component = <HRPayrollManagement canManage={canManage('hr_payroll')} canView={canView('hr_payroll')} user={user} />; break
      case "cash_bank": Component = <CashBankManagement canManage={canManage('cash_bank')} canView={canView('cash_bank')} user={user} />; break
      case "fixed_assets": Component = <FixedAssetsManagement canManage={canManage('fixed_assets')} canView={canView('fixed_assets')} user={user} />; break
      case "tax_management": Component = <TaxManagement canManage={canManage('tax_management')} canView={canView('tax_management')} user={user} />; break
      case "financial_reports": Component = <FinancialReports user={user} canManage={canManage('financial_reports')} canView={canView('financial_reports')} />; break
    }

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => setActiveModule(null)} className="text-slate-500 hover:text-white">
            <ChevronRight className={cn("h-4 w-4", isRTL ? "" : "rotate-180")} />
            {t('back')}
          </Button>
          <h2 className="text-2xl font-light text-white">{modules.find(m => m.id === activeModule)?.name}</h2>
        </div>
        {Component}
      </motion.div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-light text-white tracking-tight">{t('accounting_modules')}</h2>
        <p className="text-slate-400">{t('accounting_modules_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((module, idx) => {
          const hasAccess = canView(module.id) || canManage(module.id)
          const Icon = module.icon

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={hasAccess ? { y: -5 } : {}}
              onClick={() => hasAccess && setActiveModule(module.id)}
              className={cn(
                "group relative bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 transition-all duration-300",
                hasAccess ? "cursor-pointer hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)]" : "opacity-60 grayscale cursor-not-allowed"
              )}
            >
              {/* Decoration */}
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="h-12 w-12 text-white" />
              </div>

              <div className="flex flex-col gap-4 relative z-10">
                <div className={cn("h-12 w-12 rounded-none flex items-center justify-center border border-slate-800 transition-colors group-hover:border-amber-500/50", module.bg)}>
                  <Icon className={cn("h-6 w-6", module.color)} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-light text-white group-hover:text-amber-500 transition-colors">{module.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage(module.id) ? (
                      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-emerald-500 font-bold">
                        <ShieldCheck className="h-3 w-3" />
                        {t('full_access')}
                      </div>
                    ) : canView(module.id) ? (
                      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-blue-500 font-bold">
                        <Eye className="h-3 w-3" />
                        {t('view_only')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                        <Lock className="h-3 w-3" />
                        {t('restricted_access')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">{isRTL ? "افتح الوحدة" : "Open Module"}</span>
                  <ArrowRight className={cn("h-3 w-3 text-slate-500 group-hover:text-amber-500 transition-all", isRTL && "rotate-180")} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
