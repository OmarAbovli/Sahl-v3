"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, DollarSign, FileText } from "lucide-react"
import { generatePayroll } from "@/actions/hr/payroll"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface PayrollManagerProps {
    companyId: number
    userId: number
}

export function PayrollManager({ companyId, userId }: PayrollManagerProps) {
    const [loading, setLoading] = useState(false)
    const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString())
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())

    const { toast } = useToast()
    const router = useRouter()

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await generatePayroll(companyId, parseInt(month), parseInt(year), userId)
            if (res.success) {
                toast({ title: "Success", description: res.message, variant: "default" })
                router.refresh()
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate payroll", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const months = [
        { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
        { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
        { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
        { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" }
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll Processing</CardTitle>
                <CardDescription>Generate monthly salaries based on attendance.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 items-end">
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium">Month</label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 w-32">
                        <label className="text-sm font-medium">Year</label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger>
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleGenerate} disabled={loading} className="w-40">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                        Generate Run
                    </Button>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Recent Runs</h4>
                    <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md border border-dashed">
                        No recent payroll runs found.
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
