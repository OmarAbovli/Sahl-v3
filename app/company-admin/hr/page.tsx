import { Suspense } from "react"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { db } from "@/db"
import { employees, attendanceRecords } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { AttendanceTracker } from "@/components/hr/attendance-tracker"
import { PayrollManager } from "@/components/hr/payroll-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Users, DollarSign } from "lucide-react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getAdminNavItems } from "@/lib/navigation"

async function HRDashboard({
    searchParams
}: {
    searchParams: { view?: string }
}) {
    const user = await getSession()
    if (!user) redirect("/login")
    if (!user.companyId) redirect("/login")

    const view = searchParams.view || "attendance"

    const companyId = user.companyId

    const navItems = getAdminNavItems()

    // Get current employee record
    const employee = await db.query.employees.findFirst({
        where: and(eq(employees.userId, user.id), eq(employees.companyId, companyId))
    })

    // Get today's attendance record for this employee
    const today = new Date().toISOString().split('T')[0]
    let todayRecord = null
    if (employee) {
        todayRecord = await db.query.attendanceRecords.findFirst({
            where: and(
                eq(attendanceRecords.employeeId, employee.id),
                eq(attendanceRecords.date, today)
            )
        })
    }

    // Simple Stats
    const totalEmployees = await db.$count(employees, eq(employees.companyId, companyId))

    return (
        <DashboardShell userRole={user.role} userName={user.email} companyId={user.companyId} navItems={navItems}>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-light text-white tracking-tight">Human Resources Management</h1>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Employees</CardTitle>
                            <Users className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{totalEmployees}</div>
                            <p className="text-xs text-slate-500">Active workforce</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue={view} className="space-y-4">
                    <TabsList className="bg-slate-900 border-slate-800">
                        <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-slate-800">
                            <CalendarDays className="h-4 w-4" />
                            Attendance
                        </TabsTrigger>
                        <TabsTrigger value="payroll" className="flex items-center gap-2 data-[state=active]:bg-slate-800">
                            <DollarSign className="h-4 w-4" />
                            Payroll
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="attendance" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="col-span-3">
                                {employee ? (
                                    <AttendanceTracker
                                        employeeId={employee.id}
                                        companyId={companyId}
                                        todayRecord={todayRecord ? {
                                            checkIn: todayRecord.checkIn,
                                            checkOut: todayRecord.checkOut,
                                            status: todayRecord.status
                                        } : null}
                                    />
                                ) : (
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardContent className="pt-6 text-slate-400">
                                            You are not linked to an employee record. Contact Admin.
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="payroll" className="space-y-4">
                        <PayrollManager companyId={companyId} userId={user.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    )
}

export default HRDashboard
