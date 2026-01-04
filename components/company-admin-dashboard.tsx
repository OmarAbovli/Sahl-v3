"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Package, TrendingUp, Activity, DollarSign, ArrowUpRight, ArrowDownRight, Loader2, Calendar, RefreshCcw, Bell, ShieldCheck } from "lucide-react"
import { getDashboardStats, getRecentActivity } from "@/actions/dashboard"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Button } from "@/components/ui/button"

interface CompanyAdminDashboardProps {
  user: any
  stats: any
}

export function CompanyAdminDashboard({ user, stats: initialStats }: CompanyAdminDashboardProps) {
  const { t, isRTL, language } = useTranslation()
  const [stats, setStats] = useState<any>(initialStats)
  const [activity, setActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line
  }, [user.companyId])

  async function fetchData() {
    setIsLoading(true)
    const companyId = user.companyId
    if (!companyId) return

    try {
      const [statsRes, activityRes] = await Promise.all([
        getDashboardStats(companyId),
        getRecentActivity(companyId)
      ])
      if (statsRes.success) setStats(statsRes.data)
      if (activityRes.success) setActivity(activityRes.data)
    } catch (err) {
      console.error("Fetch error", err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatValue = (val: number, isCurrency = true) => {
    if (!isCurrency) return val.toLocaleString()
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(val)
  }

  const cards = [
    {
      title: t('total_sales'),
      value: formatValue(stats.totalSales || 0),
      icon: DollarSign,
      color: "text-emerald-500",
      trend: "+12.5%",
      isPositive: true
    },
    {
      title: t('pending_receivables'),
      value: formatValue(stats.receivables || 0),
      icon: ArrowUpRight,
      color: "text-blue-500",
      trend: "-2.4%",
      isPositive: false
    },
    {
      title: t('pending_payables'),
      value: formatValue(stats.payables || 0),
      icon: ArrowDownRight,
      color: "text-red-500",
      trend: "+5.1%",
      isPositive: true
    },
    {
      title: t('active_employees'),
      value: formatValue(stats.employees || 0, false),
      icon: Users,
      color: "text-amber-500",
      trend: "+2",
      isPositive: true
    }
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500">Live Insight Engine</p>
          </div>
          <h2 className="text-4xl font-light text-white tracking-tight leading-none">{t('overview')}</h2>
          <p className="text-slate-500 text-sm">{t('welcome_back')}, <span className="text-amber-500/80 font-medium">{user.email}</span>. {t('daily_summary')}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-950/40 border border-slate-800 p-2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white rounded-none border border-transparent hover:border-slate-800" onClick={fetchData}>
              <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white rounded-none relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-amber-500 rounded-full border-2 border-slate-950"></span>
            </Button>
          </div>
          <Button className="bg-white text-black hover:bg-amber-50 rounded-none h-12 px-8 uppercase tracking-[0.2em] font-black text-[10px] shadow-2xl">
            Global Report
          </Button>
        </div>
      </div>

      {/* KPI Architecture */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="bg-slate-950/40 backdrop-blur-3xl border border-slate-800 p-8 relative group overflow-hidden hover:border-amber-500/30 transition-all duration-700 shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <card.icon className="h-20 w-20 text-white" />
            </div>
            <div className="space-y-1 relative z-10">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{card.title}</h3>
              <div className="text-3xl font-light text-white group-hover:text-amber-500 transition-all duration-700 font-mono tracking-tighter">
                {card.value}
              </div>
            </div>
            <div className={cn(
              "mt-6 flex items-center text-[10px] font-black uppercase tracking-widest",
              card.isPositive ? 'text-emerald-500' : 'text-rose-500'
            )}>
              <div className={cn(
                "p-1 rounded-none mr-2 border",
                card.isPositive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
              )}>
                {card.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              </div>
              <span>{card.trend} <span className="text-slate-600 font-bold ml-1">Delta</span></span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full lg:col-span-4 bg-slate-950/40 backdrop-blur-3xl border border-slate-800 p-10 shadow-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <TrendingUp className="h-48 w-48 text-white" />
          </div>
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-light text-white tracking-tight">{t('revenue_overview')}</h3>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 italic">Fiscal Period Performance Metrics</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-none bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{t('revenue')}</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueChart || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#475569"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  reversed={isRTL}
                  dy={10}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${t('currency_symbol')}${v}`}
                  orientation={isRTL ? "right" : "left"}
                  dx={isRTL ? 10 : -10}
                />
                <Tooltip
                  cursor={{ stroke: '#f59e0b', strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: '0',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#f59e0b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  labelStyle={{ color: '#64748b', fontSize: '9px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'black' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-full lg:col-span-3 bg-slate-950/40 backdrop-blur-3xl border border-slate-800 p-10 shadow-3xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-8 w-8 bg-slate-900 border border-slate-800 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-light text-white tracking-tight leading-none">{t('recent_activity')}</h3>
              <p className="text-[9px] uppercase font-black tracking-widest text-slate-600 mt-1">Audit Trail & Synchronization</p>
            </div>
          </div>

          <div className="space-y-8 flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-800">
            {activity.length > 0 ? activity.map((log, i) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={i}
                className="flex items-start gap-5 group"
              >
                <div className="mt-1 h-10 w-10 rounded-none bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-amber-500/50 transition-all duration-500">
                  <Activity className="h-4 w-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-slate-200 leading-tight">
                      {log.action} <span className="text-slate-600 font-bold uppercase text-[9px] ml-1 tracking-widest">{log.tableName}</span>
                    </p>
                    <span className="text-[8px] font-mono text-slate-700 bg-slate-900/50 px-1.5 py-0.5 border border-slate-800/50">ID: {log.id.toString().slice(-4)}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-light leading-relaxed group-hover:text-slate-400 transition-colors">
                    {typeof log.details === 'string' ? (log.details.length > 80 ? log.details.slice(0, 80) + '...' : log.details) : 'Authorized system operation performed.'}
                  </p>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2 mt-2">
                    <Calendar className="h-3 w-3 opacity-30" />
                    {new Date(log.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-700">
                <Activity className="h-12 w-12 mb-6 opacity-5" />
                <p className="italic text-xs font-light uppercase tracking-widest">No spectral events detected.</p>
              </div>
            )}
          </div>

          <div className="mt-10 pt-10 border-t border-white/5">
            <Button variant="ghost" className="w-full text-amber-500 font-black uppercase tracking-[0.3em] text-[10px] hover:text-amber-400 hover:bg-slate-900/50 rounded-none h-12">
              Access Full Audit Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
