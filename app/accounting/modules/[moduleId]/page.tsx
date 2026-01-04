import { notFound, redirect } from "next/navigation"
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
import { getSessionUser } from "@/lib/session"
import translations from "@/lib/translations"

const moduleComponents: Record<string, any> = {
  general_ledger: (props: any) => <><ChartOfAccounts {...props} /><JournalEntries {...props} /></>,
  accounts_receivable: AccountsReceivableManagement,
  accounts_payable: AccountsPayableManagement,
  inventory_management: InventoryManagementDashboard,
  purchasing: PurchasingManagement,
  sales: SalesManagement,
  hr_payroll: HRPayrollManagement,
  cash_bank: CashBankManagement,
  fixed_assets: FixedAssetsManagement,
  tax_management: TaxManagement,
  financial_reports: FinancialReports,
}

export default async function ModulePage({ params }: { params: { moduleId: string } }) {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const moduleId = params.moduleId
  const ModuleComponent = moduleComponents[moduleId]

  // Get language from user or default to 'en'
  const language = user.language || 'en'
  const t = (key: keyof typeof translations["en"]) => translations[language]?.[key] || translations["en"][key] || key

  if (!ModuleComponent) {
    return <div className="p-8 text-center text-red-500">{t("no_access")}</div>
  }

  return (
    <div className="py-8">
      <ModuleComponent user={user} canManage={() => true} canView={() => true} />
    </div>
  )
} 