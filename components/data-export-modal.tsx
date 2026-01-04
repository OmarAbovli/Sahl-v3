"use client"

import React, { useState } from "react"
import {
    Download,
    Calendar as CalendarIcon,
    FileSpreadsheet,
    X,
    Loader2,
    CalendarDays
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { exportModelData } from "@/actions/export"
import { exportToExcel } from "@/lib/export"
import { toast } from "sonner"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"

interface DataExportModalProps {
    model: string
    title: string
    companyId: number
    trigger?: React.ReactNode
}

export function DataExportModal({ model, title, companyId, trigger }: DataExportModalProps) {
    const { t, isRTL } = useTranslation()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const handleExport = async () => {
        try {
            setLoading(true)
            const res = await exportModelData(companyId, model, startDate || undefined, endDate || undefined)

            if (res.success && res.data) {
                if (res.data.length === 0) {
                    toast.error(t('no_data'))
                    return
                }

                const filename = `${title}_${new Date().toISOString().split('T')[0]}`
                exportToExcel(res.data, filename)
                toast.success(t('operation_successful'))
                setOpen(false)
            } else {
                toast.error(res.error || t('operation_failed' as any))
            }
        } catch (error) {
            toast.error(t('operation_failed' as any))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="border-slate-800 text-slate-400 hover:text-white rounded-none">
                        <Download className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('export' as any)}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-slate-800 rounded-none sm:max-w-[425px] text-white overflow-hidden p-0">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <FileSpreadsheet className="h-24 w-24" />
                </div>

                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-light">{t('export' as any)} {title}</DialogTitle>
                    <DialogDescription className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                        Configure data extraction parameters
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 pt-4 space-y-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Start Date</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        className="bg-slate-900 border-slate-800 rounded-none h-12 [color-scheme:dark]"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">End Date</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        className="bg-slate-900 border-slate-800 rounded-none h-12 [color-scheme:dark]"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 flex gap-4 items-start">
                            <CalendarDays className="h-5 w-5 text-blue-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-blue-500 tracking-widest">Date Filtering</p>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    If no dates are selected, the system will export all historical records for this model.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-900/50 gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="rounded-none text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-white"
                    >
                        {t('cancel' as any)}
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-none border-none shadow-xl shadow-amber-600/10 font-bold uppercase tracking-widest text-[10px] h-12 px-8 min-w-[120px]"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>{t('generate' as any)} Excel</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
