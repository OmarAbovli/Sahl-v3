import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { db } from "@/db"
import { getLeads, getDeals, getCRMStats } from "@/actions/crm"
import { LeadManager } from "@/components/crm/lead-manager"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { CRMSeeder } from "@/components/crm/crm-seeder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Layout, BarChart, TrendingUp, Wallet } from "lucide-react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getAdminNavItems } from "@/lib/navigation"

export default async function CRMPage({
    searchParams
}: {
    searchParams: { view?: string }
}) {
    const user = await getCurrentUser()
    if (!user) redirect("/login")

    const view = searchParams.view || "leads"

    const companyId = parseInt(user.companyId || "0")
    const navItems = getAdminNavItems()

    // Fetch data in parallel
    const [leadsRes, dealsRes, statsRes] = await Promise.all([
        getLeads(companyId),
        getDeals(companyId),
        getCRMStats(companyId)
    ])

    const leads = leadsRes.success ? leadsRes.data : []
    const deals = dealsRes.success ? dealsRes.data : []
    const stats = statsRes.success ? statsRes.data : { leads: 0, openDeals: 0, wonValue: 0 }

    return (
        <DashboardShell userRole={user.role} userName={user.email} companyId={user.companyId || undefined} navItems={navItems}>
            <div className="space-y-8">
                <CRMSeeder />
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-light text-white tracking-tight">CRM & Sales Pipeline</h1>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Leads</CardTitle>
                            <Users className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.leads}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Pipeline Value</CardTitle>
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.openDeals} Deals Open</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Won Revenue</CardTitle>
                            <Wallet className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">{stats.wonValue?.toLocaleString()} EGP</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue={view} className="space-y-4">
                    <TabsList className="bg-slate-900 border-slate-800">
                        <TabsTrigger value="leads" className="gap-2 data-[state=active]:bg-slate-800">
                            <Users className="h-4 w-4" /> Leads
                        </TabsTrigger>
                        <TabsTrigger value="pipeline" className="gap-2 data-[state=active]:bg-slate-800">
                            <Layout className="h-4 w-4" /> Pipeline
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="leads" className="space-y-4">
                        <LeadManager initialLeads={leads as any} companyId={companyId} />
                    </TabsContent>

                    <TabsContent value="pipeline" className="space-y-4">
                        <PipelineBoard initialDeals={deals as any} companyId={companyId} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    )
}
