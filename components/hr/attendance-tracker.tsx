"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, LogIn, LogOut, Coffee } from "lucide-react"
import { checkIn, checkOut } from "@/actions/hr/attendance"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface AttendanceTrackerProps {
    employeeId: number
    companyId: number
    todayRecord?: {
        checkIn: string | null
        checkOut: string | null
        status: string
    } | null
}

export function AttendanceTracker({ employeeId, companyId, todayRecord }: AttendanceTrackerProps) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleCheckIn = async () => {
        setLoading(true)
        try {
            const res = await checkIn(employeeId, companyId)
            if (res.success) {
                toast({ title: "Checked In", description: res.message, variant: "default" })
                router.refresh()
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to check in", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleCheckOut = async () => {
        setLoading(true)
        try {
            const res = await checkOut(employeeId)
            if (res.success) {
                toast({ title: "Checked Out", description: res.message, variant: "default" })
                router.refresh()
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to check out", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut
    const isCheckedOut = !!todayRecord?.checkOut

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Attendance</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-2 bg-muted rounded-md mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Today's Status</span>
                        <Badge variant={todayRecord?.status === 'late' ? "destructive" : "secondary"}>
                            {todayRecord?.status?.toUpperCase() || "NOT LOGGED"}
                        </Badge>
                    </div>

                    {todayRecord?.checkIn && (
                        <div className="flex justify-between text-sm mb-2">
                            <span>Check In:</span>
                            <span className="font-mono">{new Date(todayRecord.checkIn).toLocaleTimeString()}</span>
                        </div>
                    )}

                    {todayRecord?.checkOut && (
                        <div className="flex justify-between text-sm mb-4">
                            <span>Check Out:</span>
                            <span className="font-mono">{new Date(todayRecord.checkOut).toLocaleTimeString()}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={handleCheckIn}
                            disabled={loading || !!todayRecord}
                            className="w-full"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                            Check In
                        </Button>
                        <Button
                            onClick={handleCheckOut}
                            disabled={loading || !isCheckedIn || isCheckedOut}
                            variant="secondary"
                            className="w-full"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                            Check Out
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
