"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Filter,
    History,
    User as UserIcon,
    Database,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Info,
    AlertTriangle,
    Download
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { getAuditLogs } from "@/actions/audit"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

interface AuditTrailViewerProps {
    companyId: number
}

export function AuditTrailViewer({ companyId }: AuditTrailViewerProps) {
    const { t, isRTL } = useTranslation()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [expandedLog, setExpandedLog] = useState<number | null>(null)

    useEffect(() => {
        const fetchLogs = async () => {
            const data = await getAuditLogs({ companyId })
            setLogs(data)
            setLoading(false)
        }
        fetchLogs()
    }, [companyId])

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
            default: return <Info className="w-4 h-4 text-blue-500" />
        }
    }

    const renderDiff = (oldVal: any, newVal: any) => {
        if (!oldVal && !newVal) return null

        const allKeys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]))

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                <div className="space-y-1">
                    <div className="text-xs font-bold text-muted-foreground uppercase mb-2">{t('old_value')}</div>
                    {allKeys.map(key => {
                        const isChanged = JSON.stringify(oldVal?.[key]) !== JSON.stringify(newVal?.[key])
                        if (oldVal?.[key] === undefined) return null
                        return (
                            <div key={key} className={cn("p-1 rounded", isChanged && "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400")}>
                                <span className="font-bold">{key}:</span> {JSON.stringify(oldVal[key])}
                            </div>
                        )
                    })}
                </div>
                <div className="space-y-1 border-t md:border-t-0 md:border-l pl-0 md:pl-4 mt-4 md:mt-0">
                    <div className="text-xs font-bold text-muted-foreground uppercase mb-2">{t('new_value')}</div>
                    {allKeys.map(key => {
                        const isChanged = JSON.stringify(oldVal?.[key]) !== JSON.stringify(newVal?.[key])
                        if (newVal?.[key] === undefined) return null
                        return (
                            <div key={key} className={cn("p-1 rounded", isChanged && "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400")}>
                                <span className="font-bold">{key}:</span> {JSON.stringify(newVal[key])}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(logs.map(log => ({
            Action: log.action,
            Table: log.tableName,
            RecordID: log.recordId,
            User: log.user?.email || 'System',
            Date: format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
            IP: log.ipAddress,
            Severity: log.severity,
            Details: log.details || ''
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs")
        XLSX.writeFile(workbook, `audit_trail_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('audit_trails')}</h1>
                    <p className="text-muted-foreground">{t('monitor_system_changes')}</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <Button variant="outline" onClick={exportToExcel} disabled={logs.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        {t('export')}
                    </Button>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t('search_logs')}
                            className={cn("pl-8", isRTL && "pl-3 pr-8")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">{t('loading')}...</div>
                ) : logs.length === 0 ? (
                    <Card>
                        <CardContent className="py-20 text-center">
                            <History className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                            <p className="text-muted-foreground">{t('no_logs_found')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    logs.map((log) => (
                        <Card key={log.id} className={cn("overflow-hidden border-l-4",
                            log.severity === 'critical' ? "border-l-red-500" :
                                log.severity === 'warning' ? "border-l-amber-500" : "border-l-blue-500")}>
                            <CardHeader className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-muted">
                                            {getSeverityIcon(log.severity)}
                                        </div>
                                        <div>
                                            <div className="font-bold flex items-center gap-2">
                                                {log.action}
                                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-muted-foreground font-normal">{log.tableName}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <UserIcon className="w-3 h-3" />
                                                    {log.user?.email || 'System'}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Database className="w-3 h-3" />
                                                    ID: {log.recordId}
                                                </span>
                                                <span>•</span>
                                                <span>{format(new Date(log.createdAt), 'PPP p')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{log.ipAddress}</Badge>
                                        {expandedLog === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                </div>
                            </CardHeader>
                            {expandedLog === log.id && (
                                <CardContent className="p-4 border-t bg-muted/20">
                                    <div className="space-y-4">
                                        {log.details && (
                                            <div>
                                                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">{t('details')}</div>
                                                <p className="text-sm">{log.details}</p>
                                            </div>
                                        )}
                                        {(log.oldValues || log.newValues) && (
                                            <div className="bg-background p-4 rounded-md border">
                                                {renderDiff(log.oldValues, log.newValues)}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-4">
                                            {t('user_agent')}: {log.userAgent}
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
