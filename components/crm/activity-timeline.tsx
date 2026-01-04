"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Mail, Calendar, MessageSquare, Plus, CheckCircle2 } from "lucide-react"
import { logActivity } from "@/actions/crm" // You need to export this or similar
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface Activity {
    id: number
    type: string
    subject: string
    description: string | null
    createdAt: string | null
    user?: { name: string | null, email: string }
}

interface ActivityTimelineProps {
    initialActivities: any[]
    entityType: 'lead' | 'deal'
    entityId: number
    companyId: number
}

export function ActivityTimeline({ initialActivities, entityType, entityId, companyId }: ActivityTimelineProps) {
    const [activities, setActivities] = useState(initialActivities)
    const [isLogging, setIsLogging] = useState(false)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleLogActivity = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const type = formData.get("type") as string

        const data = {
            companyId,
            type,
            subject: formData.get("subject") as string,
            description: formData.get("description") as string,
            [entityType === 'lead' ? 'leadId' : 'dealId']: entityId,
            status: 'completed',
            createdAt: new Date().toISOString()
        }

        // We assume logActivity is a server action that returns {success: true, data: newActivity} 
        // Or we just reload. For now, let's reload or opt update.
        const res = await logActivity(data)

        if (res.success) {
            toast({ title: "Activity Logged" })
            setIsLogging(false)
            window.location.reload()
        } else {
            toast({ title: "Error", variant: "destructive" })
        }
        setLoading(false)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="h-4 w-4" />
            case 'email': return <Mail className="h-4 w-4" />
            case 'meeting': return <Calendar className="h-4 w-4" />
            default: return <MessageSquare className="h-4 w-4" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Timeline</h3>
                <Button size="sm" onClick={() => setIsLogging(!isLogging)} variant={isLogging ? "secondary" : "default"}>
                    {isLogging ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Log Activity</>}
                </Button>
            </div>

            {isLogging && (
                <Card className="p-4 bg-muted/50 border-dashed">
                    <form onSubmit={handleLogActivity} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Select name="type" defaultValue="call">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="call">Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="note">Note</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input name="subject" placeholder="Subject (e.g. Discovery Call)" required />
                        </div>
                        <Textarea name="description" placeholder="Details..." required />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>Log Activity</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            {getIcon(activity.type)}
                        </div>

                        {/* Card */}
                        <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm capitalize flex items-center gap-2">
                                    {activity.subject}
                                </span>
                                <time className="text-xs text-muted-foreground">
                                    {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                                </time>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">
                                {activity.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-[9px]">U</AvatarFallback>
                                </Avatar>
                                {activity.user?.name || "Unknown User"}
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    )
}
