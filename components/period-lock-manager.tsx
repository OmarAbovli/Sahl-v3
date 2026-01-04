"use client"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
    Lock,
    Unlock,
    Calendar,
    AlertTriangle,
    Shield,
    Loader2,
    Plus,
    CheckCircle2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    getPeriodLocks,
    lockPeriod,
    unlockPeriod,
    suggestNextLockPeriod,
    getCurrentUnlockedPeriod
} from "@/actions/period-locks"
import { useTranslation } from "@/hooks/use-translation"

interface PeriodLockManagerProps {
    companyId: number
    userId: number
}

export function PeriodLockManager({ companyId, userId }: PeriodLockManagerProps) {
    const { t } = useTranslation()
    const [locks, setLocks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [showLockDialog, setShowLockDialog] = useState(false)
    const [showUnlockDialog, setShowUnlockDialog] = useState(false)
    const [selectedLock, setSelectedLock] = useState<any>(null)
    const [currentPeriodInfo, setCurrentPeriodInfo] = useState<any>(null)

    const [lockForm, setLockForm] = useState({
        periodStart: "",
        periodEnd: ""
    })

    useEffect(() => {
        fetchLocks()
        fetchCurrentPeriod()
    }, [companyId])

    async function fetchLocks() {
        setIsLoading(true)
        const res = await getPeriodLocks(companyId)
        if (res.success) {
            setLocks(res.data || [])
        } else {
            toast.error("Failed to load period locks")
        }
        setIsLoading(false)
    }

    async function fetchCurrentPeriod() {
        const res = await getCurrentUnlockedPeriod(companyId)
        if (res.success) {
            setCurrentPeriodInfo(res.data)
        }
    }

    const handleOpenLockDialog = async () => {
        const suggestion = await suggestNextLockPeriod(companyId)
        if (suggestion.success) {
            setLockForm(suggestion.data!)
        }
        setShowLockDialog(true)
    }

    const handleLockPeriod = () => {
        if (!lockForm.periodStart || !lockForm.periodEnd) {
            toast.error("Please select both start and end dates")
            return
        }

        startTransition(async () => {
            const res = await lockPeriod({
                companyId,
                periodStart: lockForm.periodStart,
                periodEnd: lockForm.periodEnd,
                lockedBy: userId
            })

            if (res.success) {
                toast.success("Period locked successfully")
                setShowLockDialog(false)
                fetchLocks()
                fetchCurrentPeriod()
            } else {
                toast.error(res.error || "Failed to lock period")
            }
        })
    }

    const handleUnlockClick = (lock: any) => {
        setSelectedLock(lock)
        setShowUnlockDialog(true)
    }

    const handleUnlockConfirm = () => {
        if (!selectedLock) return

        startTransition(async () => {
            const res = await unlockPeriod(selectedLock.id, userId, companyId)
            if (res.success) {
                toast.success("Period unlocked - This action has been logged")
                setShowUnlockDialog(false)
                fetchLocks()
                fetchCurrentPeriod()
            } else {
                toast.error(res.error || "Failed to unlock period")
            }
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-amber-500" />
                        Period Lock Management
                    </h2>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-2 font-bold">
                        Data Integrity Protection & Period Closing Control
                    </p>
                </div>
                <Button
                    onClick={handleOpenLockDialog}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-none h-11 px-8 shadow-xl shadow-amber-600/10 transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                    <Plus className="h-4 w-4 mr-2" /> Lock Period
                </Button>
            </div>

            {/* Current Status */}
            <Card className={`${currentPeriodInfo?.isLocked ? 'bg-gradient-to-br from-red-900/20 to-slate-950 border-red-500/30' : 'bg-gradient-to-br from-green-900/20 to-slate-950 border-green-500/30'}`}>
                <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        {currentPeriodInfo?.isLocked ? (
                            <>
                                <Lock className="h-5 w-5 text-red-500" />
                                <span>Current Period: LOCKED</span>
                            </>
                        ) : (
                            <>
                                <Unlock className="h-5 w-5 text-green-500" />
                                <span>Current Period: UNLOCKED</span>
                            </>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm mb-2">
                                {currentPeriodInfo?.isLocked
                                    ? "Current date falls within a locked period. Transactions cannot be modified."
                                    : "No restrictions on current transactions."}
                            </p>
                            {currentPeriodInfo?.earliestUnlockedDate && (
                                <p className="text-white font-mono text-sm">
                                    Earliest unlocked date: <span className="text-green-400">{currentPeriodInfo.earliestUnlockedDate}</span>
                                </p>
                            )}
                        </div>
                        {currentPeriodInfo?.isLocked ? (
                            <Lock className="h-16 w-16 text-red-700 opacity-20" />
                        ) : (
                            <CheckCircle2 className="h-16 w-16 text-green-700 opacity-20" />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Locked Periods List */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg">Locked Periods History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {locks.map((lock, idx) => (
                            <motion.div
                                key={lock.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex items-center justify-between p-5 border rounded-none transition-all ${lock.isLocked
                                        ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-none flex items-center justify-center ${lock.isLocked ? 'bg-red-500/10' : 'bg-slate-700'
                                        }`}>
                                        {lock.isLocked ? (
                                            <Lock className="h-6 w-6 text-red-500" />
                                        ) : (
                                            <Unlock className="h-6 w-6 text-slate-500" />
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-white font-mono font-bold">
                                                {new Date(lock.periodStart).toLocaleDateString()} - {new Date(lock.periodEnd).toLocaleDateString()}
                                            </span>
                                            <Badge className={lock.isLocked
                                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                : "bg-slate-700 text-slate-400"
                                            }>
                                                {lock.isLocked ? "Locked" : "Unlocked"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Calendar className="h-3 w-3" />
                                            <span>Locked on {new Date(lock.lockedAt).toLocaleString()}</span>
                                            {lock.updatedAt && lock.updatedAt !== lock.lockedAt && (
                                                <span className="text-yellow-500">• Modified {new Date(lock.updatedAt).toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {lock.isLocked && (
                                    <Button
                                        onClick={() => handleUnlockClick(lock)}
                                        variant="outline"
                                        size="sm"
                                        className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 rounded-none uppercase text-[9px] font-bold tracking-widest"
                                    >
                                        <Unlock className="h-4 w-4 mr-2" /> Unlock
                                    </Button>
                                )}
                            </motion.div>
                        ))}

                        {locks.length === 0 && (
                            <div className="py-16 text-center">
                                <Shield className="h-16 w-16 mx-auto text-slate-800 mb-4 opacity-20" />
                                <p className="text-slate-600 italic">No locked periods yet</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Lock Period Dialog */}
            <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md p-0 overflow-hidden rounded-none shadow-3xl">
                    <div className="h-1 bg-amber-500 w-full shadow-lg shadow-amber-500/20"></div>
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-2xl font-light tracking-tight">
                            Lock Accounting Period
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm mt-2">
                            Once locked, transactions in this period cannot be created or modified.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-10 space-y-6">
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-none">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-200">
                                    <strong className="block mb-1">Warning:</strong>
                                    This action will prevent all users from creating or modifying transactions within the selected period.
                                    Only administrators can unlock periods.
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Period Start</Label>
                                <Input
                                    type="date"
                                    value={lockForm.periodStart}
                                    onChange={(e) => setLockForm({ ...lockForm, periodStart: e.target.value })}
                                    className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Period End</Label>
                                <Input
                                    type="date"
                                    value={lockForm.periodEnd}
                                    onChange={(e) => setLockForm({ ...lockForm, periodEnd: e.target.value })}
                                    className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-10 pt-6 border-t border-slate-800 flex gap-4">
                        <Button
                            onClick={() => setShowLockDialog(false)}
                            variant="ghost"
                            className="text-slate-500 uppercase font-black text-[10px] px-8 h-12 rounded-none hover:bg-slate-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLockPeriod}
                            className="bg-amber-600 hover:bg-amber-700 text-white h-12 px-12 rounded-none uppercase tracking-[0.2em] text-[10px] font-bold shadow-2xl transition-all"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                            Lock Period
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unlock Confirmation Dialog */}
            <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md p-0 overflow-hidden rounded-none shadow-3xl">
                    <div className="h-1 bg-red-500 w-full shadow-lg shadow-red-500/20"></div>
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-2xl font-light tracking-tight">
                            Unlock Period - Admin Override
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-10 space-y-6">
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-none">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-200">
                                    <strong className="block mb-1">Critical Action:</strong>
                                    Unlocking this period will allow modifications to historical data.
                                    This action will be logged in the audit trail for compliance.
                                </div>
                            </div>
                        </div>

                        {selectedLock && (
                            <div className="text-center">
                                <p className="text-slate-400 mb-2">Period to unlock:</p>
                                <p className="text-xl text-white font-mono">
                                    {new Date(selectedLock.periodStart).toLocaleDateString()} -{" "}
                                    {new Date(selectedLock.periodEnd).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-10 pt-6 border-t border-slate-800 flex gap-4">
                        <Button
                            onClick={() => setShowUnlockDialog(false)}
                            variant="ghost"
                            className="text-slate-500 uppercase font-black text-[10px] px-8 h-12 rounded-none hover:bg-slate-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUnlockConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white h-12 px-12 rounded-none uppercase tracking-[0.2em] text-[10px] font-bold shadow-2xl transition-all"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                            Confirm Unlock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
