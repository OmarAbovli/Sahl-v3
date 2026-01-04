"use client"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
    Activity,
    Search,
    Filter,
    Download,
    Eye,
    Loader2,
    FileText,
    User,
    Calendar,
    Database,
    BarChart3
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
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getAuditLogs, getAuditStatistics } from "@/lib/audit-logger"
import { useTranslation } from "@/hooks/use-translation"

interface AuditTrailViewerProps {
    companyId: number
}

export function AuditTrailViewer({ companyId }: AuditTrailViewerProps) {
    const { t } = useTranslation()
    const [logs, setLogs] = useState<any[]>([])
    const [stats, setStats] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [selectedLog, setSelectedLog] = useState<any>(null)
    const [showDetails, setShowDetails] = useState(false)

    const [filters, setFilters] = useState({
        action: "",
        tableName: "",
        startDate: "",
        endDate: "",
        searchTerm: ""
    })

    useEffect(() => {
        fetchLogs()
        fetchStats()
    }, [companyId])

    async function fetchLogs() {
        setIsLoading(true)
        const res = await getAuditLogs({
            companyId,
            action: filters.action || undefined,
            tableName: filters.tableName || undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            limit: 200
        })
        if (res.success) {
            setLogs(res.data || [])
        } else {
            toast.error("Failed to load audit logs")
        }
        setIsLoading(false)
    }

    async function fetchStats() {
        const res = await getAuditStatistics(companyId, 30)
        if (res.success) {
            setStats(res.data || [])
        }
    }

    const handleViewDetails = (log: any) => {
        setSelectedLog(log)
        setShowDetails(true)
    }

    const handleApplyFilters = () => {
        fetchLogs()
    }

    const handleClearFilters = () => {
        setFilters({
            action: "",
            tableName: "",
            startDate: "",
            endDate: "",
            searchTerm: ""
        })
    }

    const filteredLogs = logs.filter(log => {
        if (!filters.searchTerm) return true
        const searchLower = filters.searchTerm.toLowerCase()
        return (
            log.action?.toLowerCase().includes(searchLower) ||
            log.tableName?.toLowerCase().includes(searchLower) ||
            log.user?.email?.toLowerCase().includes(searchLower)
        )
    })

    const actionColors: Record<string, string> = {
        CREATE: "bg-green-500/10 text-green-500 border-green-500/20",
        UPDATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
        APPROVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        REJECT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        LOCK: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        UNLOCK: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }

    const getActionColor = (action: string) => {
        for (const [key, color] of Object.entries(actionColors)) {
            if (action.includes(key)) return color
        }
        return "bg-slate-700 text-slate-400"
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
                        <Activity className="h-8 w-8 text-amber-500" />
                        Audit Trail
                    </h2>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-2 font-bold">
                        Complete Activity Log & Compliance Monitoring
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-none h-11 px-6 uppercase tracking-widest text-[10px] font-bold"
                >
                    <Download className="h-4 w-4 mr-2" /> Export Report
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-bold">
                            Total Events (30d)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-light text-white">
                                {stats.reduce((sum, s) => sum + s.count, 0)}
                            </div>
                            <Activity className="h-8 w-8 text-slate-700" />
                        </div>
                    </CardContent>
                </Card>

                {stats.slice(0, 3).map((stat, idx) => (
                    <Card key={idx} className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-bold">
                                {stat.action}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-3xl font-light text-amber-400">{stat.count}</div>
                                <BarChart3 className="h-8 w-8 text-amber-700" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" /> Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Search</Label>
                            <Input
                                placeholder="Action, table, user..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                className="bg-slate-950 border-slate-800 h-10 rounded-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Start Date</Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="bg-slate-950 border-slate-800 h-10 rounded-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">End Date</Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="bg-slate-950 border-slate-800 h-10 rounded-none"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button
                                onClick={handleApplyFilters}
                                className="bg-amber-600 hover:bg-amber-700 h-10 px-6 rounded-none uppercase text-[9px] font-bold tracking-widest flex-1"
                            >
                                Apply
                            </Button>
                            <Button
                                onClick={handleClearFilters}
                                variant="outline"
                                className="border-slate-700 text-slate-400 h-10 px-6 rounded-none uppercase text-[9px] font-bold tracking-widest"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1 max-h-[600px] overflow-y-auto pr-4">
                        {filteredLogs.map((log, idx) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="flex items-center gap-4 p-4 border border-slate-800/50 hover:border-amber-500/30 hover:bg-slate-800/30 transition-all group rounded-none"
                            >
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-amber-500" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={`${getActionColor(log.action)} text-[8px] uppercase tracking-widest font-bold px-2 py-0.5`}>
                                            {log.action}
                                        </Badge>
                                        {log.tableName && (
                                            <span className="text-slate-600 text-xs font-mono">
                                                {log.tableName}
                                                {log.recordId && ` #${log.recordId}`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {log.user?.email || `User #${log.userId}`}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Button
                                        onClick={() => handleViewDetails(log)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-500 hover:text-amber-500 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}

                        {filteredLogs.length === 0 && (
                            <div className="py-16 text-center">
                                <Activity className="h-16 w-16 mx-auto text-slate-800 mb-4 opacity-20" />
                                <p className="text-slate-600 italic">No audit logs found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-2xl p-0 overflow-hidden rounded-none shadow-3xl">
                    <div className="h-1 bg-amber-500 w-full shadow-lg shadow-amber-500/20"></div>
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-2xl font-light tracking-tight">
                            Audit Log Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Action</Label>
                                    <div className="mt-2">
                                        <Badge className={`${getActionColor(selectedLog.action)}`}>
                                            {selectedLog.action}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">User</Label>
                                    <div className="text-white mt-2">{selectedLog.user?.email || `User #${selectedLog.userId}`}</div>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Table</Label>
                                    <div className="text-white mt-2 font-mono">{selectedLog.tableName || 'N/A'}</div>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Record ID</Label>
                                    <div className="text-white mt-2 font-mono">{selectedLog.recordId || 'N/A'}</div>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Timestamp</Label>
                                    <div className="text-white mt-2">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                                </div>
                            </div>

                            {selectedLog.details && (
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest mb-2 block">Details</Label>
                                    <pre className="bg-slate-900 border border-slate-800 p-4 rounded-none text-xs text-slate-300 overflow-x-auto font-mono">
                                        {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
