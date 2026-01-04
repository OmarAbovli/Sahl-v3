"use client"

import { useEffect, useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Loader2, Fingerprint, Activity, User, MapPin, Clock, Calendar, RefreshCcw } from "lucide-react"
import { getAttendanceLogs } from "@/actions/employees"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Props {
  user: any
}

export function AttendanceLogs({ user }: Props) {
  const { t, isRTL, language } = useTranslation()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line
  }, [user.companyId])

  const fetchLogs = async () => {
    const companyId = user.companyId
    if (!companyId) return

    setLoading(true)
    try {
      const res = await getAttendanceLogs(companyId)
      if (res.success) {
        setLogs(res.data || [])
      } else {
        toast.error(t('operation_failed'))
      }
    } catch (err: any) {
      toast.error(t('error_occurred'))
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-none bg-slate-900 flex items-center justify-center border border-slate-800 shadow-2xl relative">
            <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
            <Fingerprint className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <h2 className="text-3xl font-light text-white tracking-tight">{t('attendance')}</h2>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.3em] mt-1">Biometric Ledger Synchronization</p>
          </div>
        </div>
        <Button variant="ghost" onClick={fetchLogs} className="border-slate-800 text-slate-400 hover:text-white rounded-none h-11 px-8">
          <RefreshCcw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2", loading && "animate-spin")} /> {t('refresh')}
        </Button>
      </div>

      <div className="bg-slate-950/40 backdrop-blur-3xl border border-slate-800 rounded-none overflow-hidden shadow-3xl">
        {loading ? (
          <div className="flex h-96 flex-col items-center justify-center text-slate-500">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500/20" />
              <Fingerprint className="h-6 w-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black mt-6 animate-pulse">Syncing Secure Node...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-32 text-slate-700">
            <Activity className="h-16 w-16 mx-auto mb-6 opacity-5" />
            <p className="italic text-sm font-light uppercase tracking-widest">No active sessions retrieved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/40 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="px-10 h-16 text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500">{t('employees')}</TableHead>
                  <TableHead className="px-10 h-16 text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500">{t('location' as any || 'Point of Entry')}</TableHead>
                  <TableHead className="px-10 h-16 text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500">{t('date' as any || 'Timeline')}</TableHead>
                  <TableHead className="px-10 h-16 text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500 text-right">{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/[0.03]">
                {logs.map((log, idx) => {
                  const { date, time } = formatDateTime(log.timestamp)
                  return (
                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-900/30 transition-all duration-500 group">
                      <TableCell className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:border-amber-500/40 transition-colors">
                            <User className="h-4 w-4 text-slate-600 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-200 text-base leading-tight">
                              {log.employee ? `${log.firstName || log.employee.firstName} ${log.lastName || log.employee.lastName}` : "System Entity"}
                            </p>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Dossier: {log.employee?.employeeNumber || 'X-000'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
                          <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">{log.device?.deviceName || "Commercial Terminal Alpha"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-6">
                        <div className="flex flex-col space-y-1">
                          <span className="text-slate-300 text-xs font-bold uppercase tracking-tighter flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-600" />
                            {date}
                          </span>
                          <span className="text-amber-500/60 text-[11px] font-mono flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-6 text-right">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase tracking-[0.2em] rounded-none border-0 px-4 py-1.5",
                          (log.eventType === 'check_in' || log.eventType === '0')
                            ? "bg-emerald-500/5 text-emerald-500 border border-emerald-500/10"
                            : "bg-rose-500/5 text-rose-500 border border-rose-500/10"
                        )}>
                          {log.eventType === 'check_in' || log.eventType === '0' ? t('active' as any || 'Verified Entry') : t('inactive' as any || 'Verified Exit')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
