"use client"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    User,
    Calendar,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    getPendingApprovals,
    approveRequest,
    rejectRequest,
    getApprovals
} from "@/actions/approvals"
import { useTranslation } from "@/hooks/use-translation"
import { formatCurrency } from "@/lib/utils"

interface ApprovalCenterProps {
    companyId: number
    userId: number
}

export function ApprovalCenter({ companyId, userId }: ApprovalCenterProps) {
    const { t } = useTranslation()
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
    const [allApprovals, setAllApprovals] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [selectedApproval, setSelectedApproval] = useState<any>(null)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [activeTab, setActiveTab] = useState<"pending" | "all">("pending")

    useEffect(() => {
        fetchApprovals()
    }, [companyId])

    async function fetchApprovals() {
        setIsLoading(true)

        const pendingRes = await getPendingApprovals(companyId)
        if (pendingRes.success) {
            setPendingApprovals(pendingRes.data || [])
        }

        const allRes = await getApprovals({ companyId })
        if (allRes.success) {
            setAllApprovals(allRes.data || [])
        }

        setIsLoading(false)
    }

    const handleApprove = (approval: any) => {
        startTransition(async () => {
            const res = await approveRequest(approval.id, userId, companyId)
            if (res.success) {
                toast.success("Request approved successfully")
                fetchApprovals()
            } else {
                toast.error(res.error || "Failed to approve")
            }
        })
    }

    const handleRejectClick = (approval: any) => {
        setSelectedApproval(approval)
        setShowRejectDialog(true)
    }

    const handleRejectConfirm = () => {
        if (!selectedApproval) return

        startTransition(async () => {
            const res = await rejectRequest(
                selectedApproval.id,
                userId,
                companyId,
                rejectionReason
            )
            if (res.success) {
                toast.success("Request rejected")
                setShowRejectDialog(false)
                setRejectionReason("")
                fetchApprovals()
            } else {
                toast.error(res.error || "Failed to reject")
            }
        })
    }

    const getModuleIcon = (module: string) => {
        const icons: Record<string, any> = {
            SALES_INVOICE: FileText,
            PURCHASE_INVOICE: FileText,
            JOURNAL_ENTRY: FileText,
            FIXED_ASSET: FileText,
            PAYMENT: FileText
        }
        const Icon = icons[module] || FileText
        return <Icon className="h-5 w-5" />
    }

    const getStatusColor = (status: string) => {
        if (status === "approved") return "bg-green-500/10 text-green-500 border-green-500/20"
        if (status === "rejected") return "bg-red-500/10 text-red-500 border-red-500/20"
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        )
    }

    const displayedApprovals = activeTab === "pending" ? pendingApprovals : allApprovals

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
                        <CheckCircle2 className="h-8 w-8 text-amber-500" />
                        Approval Center
                    </h2>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-2 font-bold">
                        Multi-Level Authorization & Workflow Control
                    </p>
                </div>
                {pendingApprovals.length > 0 && (
                    <Badge className="bg-red-500 text-white h-8 px-4 rounded-full text-sm font-bold">
                        {pendingApprovals.length} Pending
                    </Badge>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-yellow-900/20 to-slate-950 border-yellow-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-yellow-500 text-xs uppercase tracking-widest font-bold">
                            Pending Approvals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-4xl font-light text-white">{pendingApprovals.length}</div>
                            <Clock className="h-10 w-10 text-yellow-700" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-slate-950 border-green-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-green-500 text-xs uppercase tracking-widest font-bold">
                            Approved (Total)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-4xl font-light text-white">
                                {allApprovals.filter(a => a.status === "approved").length}
                            </div>
                            <ThumbsUp className="h-10 w-10 text-green-700" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-900/20 to-slate-950 border-red-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-red-500 text-xs uppercase tracking-widest font-bold">
                            Rejected (Total)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-4xl font-light text-white">
                                {allApprovals.filter(a => a.status === "rejected").length}
                            </div>
                            <ThumbsDown className="h-10 w-10 text-red-700" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === "pending"
                            ? "text-amber-500 border-b-2 border-amber-500"
                            : "text-slate-500 hover:text-slate-400"
                        }`}
                >
                    Pending ({pendingApprovals.length})
                </button>
                <button
                    onClick={() => setActiveTab("all")}
                    className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === "all"
                            ? "text-amber-500 border-b-2 border-amber-500"
                            : "text-slate-500 hover:text-slate-400"
                        }`}
                >
                    All Requests
                </button>
            </div>

            {/* Approvals List */}
            <div className="space-y-4">
                {displayedApprovals.map((approval, idx) => (
                    <motion.div
                        key={approval.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <Card className="bg-slate-900 border-slate-800 hover:border-amber-500/30 transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-none bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                            {getModuleIcon(approval.module)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-white font-light text-lg">
                                                    {approval.module.replace(/_/g, ' ')}
                                                </h3>
                                                <Badge className={`${getStatusColor(approval.status)} text-[8px] uppercase tracking-widest font-bold`}>
                                                    {approval.status}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1 text-sm text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span>Record ID: <span className="font-mono text-white">#{approval.recordId}</span></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <span>Requested by User #{approval.requestedBy}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{new Date(approval.requestedAt).toLocaleString()}</span>
                                                </div>
                                                {approval.approvedAt && (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span>
                                                            {approval.status === "approved" ? "Approved" : "Rejected"} by User #{approval.approvedBy} on{" "}
                                                            {new Date(approval.approvedAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {approval.status === "pending" && (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                onClick={() => handleApprove(approval)}
                                                disabled={isPending}
                                                className="bg-green-600 hover:bg-green-700 text-white h-10 px-6 rounded-none uppercase text-[9px] font-bold tracking-widest"
                                            >
                                                <ThumbsUp className="h-4 w-4 mr-2" /> Approve
                                            </Button>
                                            <Button
                                                onClick={() => handleRejectClick(approval)}
                                                disabled={isPending}
                                                variant="outline"
                                                className="border-red-500 text-red-500 hover:bg-red-500/10 h-10 px-6 rounded-none uppercase text-[9px] font-bold tracking-widest"
                                            >
                                                <ThumbsDown className="h-4 w-4 mr-2" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}

                {displayedApprovals.length === 0 && (
                    <div className="py-32 text-center border border-slate-800 bg-slate-950/20">
                        <AlertCircle className="h-16 w-16 mx-auto text-slate-800 mb-6 opacity-20" />
                        <p className="text-slate-600 italic text-sm">
                            {activeTab === "pending" ? "No pending approvals" : "No approval requests found"}
                        </p>
                    </div>
                )}
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md p-0 overflow-hidden rounded-none shadow-3xl">
                    <div className="h-1 bg-red-500 w-full shadow-lg shadow-red-500/20"></div>
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-2xl font-light tracking-tight">
                            Reject Request
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-10 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">
                                Rejection Reason (Optional)
                            </Label>
                            <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explain why this request is being rejected..."
                                className="bg-slate-900 border-slate-800 focus:border-red-500/50 rounded-none min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-10 pt-6 border-t border-slate-800 flex gap-4">
                        <Button
                            onClick={() => setShowRejectDialog(false)}
                            variant="ghost"
                            className="text-slate-500 uppercase font-black text-[10px] px-8 h-12 rounded-none hover:bg-slate-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRejectConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white h-12 px-12 rounded-none uppercase tracking-[0.2em] text-[10px] font-bold shadow-2xl transition-all"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
