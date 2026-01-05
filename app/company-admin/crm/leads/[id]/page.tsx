
import { getCurrentUser } from "@/lib/session"
export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation"
import { db } from "@/db"
import { leads, activities, deals } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityTimeline } from "@/components/crm/activity-timeline"
import { format } from "date-fns"
import { Mail, Phone, Building, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
    const user = await getCurrentUser()
    if (!user) redirect("/login")

    const leadId = parseInt(params.id)
    const companyId = parseInt(user.companyId)

    const lead = await db.query.leads.findFirst({
        where: eq(leads.id, leadId),
        with: {
            activities: {
                orderBy: [desc(activities.createdAt)],
                with: {
                    user: true
                }
            },
            deals: true
        }
    })

    if (!lead || lead.companyId !== companyId) {
        redirect("/company-admin/crm")
    }

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/company-admin/crm">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">{lead.firstName} {lead.lastName}</h1>
                        <Badge variant="outline" className="capitalize">{lead.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground mt-1">
                        {lead.companyName && (
                            <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" /> {lead.companyName}
                            </div>
                        )}
                        {lead.email && (
                            <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" /> {lead.email}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Info & Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-muted-foreground">Email</span>
                                <span>{lead.email || "-"}</span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-muted-foreground">Phone</span>
                                <span>{lead.phone || "-"}</span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-muted-foreground">Source</span>
                                <span className="capitalize">{lead.source?.replace('_', ' ') || "-"}</span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-muted-foreground">Created</span>
                                <span>{format(new Date(lead.createdAt || new Date()), "PPP")}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {lead.notes || "No notes available."}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Activities & Timeline */}
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="activity">
                        <TabsList>
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                            <TabsTrigger value="deals">Deals ({lead.deals.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="activity" className="space-y-4">
                            <ActivityTimeline
                                initialActivities={lead.activities}
                                entityType="lead"
                                entityId={lead.id}
                                companyId={companyId}
                            />
                        </TabsContent>
                        <TabsContent value="deals">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground text-center py-8">
                                        Deals list coming here...
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
