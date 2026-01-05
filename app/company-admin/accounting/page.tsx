import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getAdminNavItems } from "@/lib/navigation"

// Components
import { ChartOfAccounts } from "@/components/chart-of-accounts"
import { GeneralLedger } from "@/components/general-ledger"
import { CashBankManagement } from "@/components/cash-bank-management"
import { TaxManagement } from "@/components/tax-management"
import { FinancialReports } from "@/components/financial-reports"
import { AccountsReceivableManagement } from "@/components/accounts-receivable-management"
import { AccountsPayableManagement } from "@/components/accounts-payable-management"
import { FixedAssetsManagement } from "@/components/fixed-assets-management"

export default async function AdminAccountingPage({
    searchParams
}: {
    searchParams: { view?: string }
}) {
    try {
        const user = await requireAuth(["company_admin"])
        const navItems = getAdminNavItems()
        const view = searchParams.view || "general_ledger"

        const renderView = () => {
            switch (view) {
                case "general_ledger": return <ChartOfAccounts user={user as any} />
                case "cash_bank": return <CashBankManagement user={user as any} canManage={true} canView={true} />
                case "tax_management": return <TaxManagement user={user as any} canManage={true} canView={true} />
                case "financial_reports": return <FinancialReports user={user as any} canManage={true} canView={true} />
                case "accounts_receivable": return <AccountsReceivableManagement user={user as any} canManage={true} canView={true} />
                case "accounts_payable": return <AccountsPayableManagement user={user as any} canManage={true} canView={true} />
                case "fixed_assets": return <FixedAssetsManagement companyId={user.companyId || 0} user={user as any} canManage={true} canView={true} />
                default: return <ChartOfAccounts user={user as any} />
            }
        }

        return (
            <DashboardShell userRole={user.role} userName={user.email} navItems={navItems}>
                <div className="bg-slate-900/50 backdrop-blur-3xl border border-slate-800 p-8 min-h-[calc(100vh-12rem)] shadow-2xl">
                    {renderView()}
                </div>
            </DashboardShell>
        )
    } catch (error) {
        redirect("/login")
    }
}
