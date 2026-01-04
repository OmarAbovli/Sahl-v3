"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  Download,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  FileText,
  PieChart as PieIcon,
  Calendar,
  Lock,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import { getFinancialMetrics, getFinancialTrend, getTopSellingItems, getBalanceSheet, getExportData } from "@/actions/reports"

interface FinancialReportsProps {
  user: any
  canManage?: boolean
  canView?: boolean
}

export function FinancialReports({ user, canManage, canView }: FinancialReportsProps) {
  const { t, isRTL, language } = useTranslation()
  const [metrics, setMetrics] = useState<any>(null)
  const [trend, setTrend] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  const [balanceSheet, setBalanceSheet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Export State
  const [exportType, setExportType] = useState('sales')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line
  }, [user.companyId])

  async function loadData() {
    if (!user.companyId) return
    setLoading(true)

    try {
      const [mRes, tRes, iRes, bRes] = await Promise.all([
        getFinancialMetrics(user.companyId),
        getFinancialTrend(user.companyId),
        getTopSellingItems(user.companyId),
        getBalanceSheet(user.companyId)
      ])

      if (mRes.success) setMetrics(mRes.data)
      if (tRes.success) setTrend(tRes.data as any[])
      if (bsRes.success) setBalanceSheet(bsRes.data)
    } catch (error) {
      toast.error(t('error_occurred'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(val)
  }

  // Colors
  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">{t('financial_reports')}</h1>
          <p className="text-slate-400 text-sm">{t('analytics')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="border-slate-800 text-slate-400 hover:text-white" onClick={loadData}>
            <RefreshCcw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('refresh')}
          </Button>
          {canManage && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none border-none"
              onClick={() => {
                if (!metrics || !balanceSheet) return
                import("@/lib/export").then(mod => {
                  mod.exportFinancialStatement(balanceSheet, metrics, `Financial_Report_${new Date().toISOString().split('T')[0]}`)
                })
              }}
            >
              <Download className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('export')}
            </Button>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title={t('revenue')}
          value={metrics?.revenue}
          icon={DollarSign}
          trend="up"
          color="amber"
          format={formatCurrency}
        />
        <KpiCard
          title={t('profit_loss')}
          value={metrics?.netProfit}
          icon={TrendingUp}
          trend={metrics?.netProfit >= 0 ? "up" : "down"}
          color={metrics?.netProfit >= 0 ? "emerald" : "rose"}
          format={formatCurrency}
        />
        <KpiCard
          title={t('expense')}
          value={metrics?.expenses}
          icon={TrendingDown}
          trend="neutral"
          color="rose"
          format={formatCurrency}
        />
        <KpiCard
          title="Profit Margin"
          value={metrics?.profitMargin}
          icon={Activity}
          trend="up"
          color="indigo"
          format={(v: any) => `${v?.toFixed(1)}%`}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
          <TabsList className="bg-transparent p-0 h-auto gap-8">
            <TabsTrigger value="overview" className="bg-transparent p-0 rounded-none h-10 border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-slate-500 text-xs font-bold uppercase tracking-widest">{t('overview')}</TabsTrigger>
            <TabsTrigger value="statements" className="bg-transparent p-0 rounded-none h-10 border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-slate-500 text-xs font-bold uppercase tracking-widest">{t('financial_reports')}</TabsTrigger>
            {canManage && (
              <TabsTrigger value="export" className="bg-transparent p-0 rounded-none h-10 border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-slate-500 text-xs font-bold uppercase tracking-widest">{t('export')}</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-10 focus-visible:ring-0 outline-none">
          {/* MAIN CHART */}
          <Card className="bg-slate-950/40 border-slate-800 rounded-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="h-32 w-32 text-amber-500" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl font-light text-white">{t('revenue_overview')}</CardTitle>
              <CardDescription className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Performance Analytics Trajectory</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] p-8 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} reversed={isRTL} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} orientation={isRTL ? "right" : "left"} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: 0, fontSize: 12 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 20, fontSize: 10, textTransform: 'uppercase' }} />
                  <Area type="monotone" dataKey="revenue" name={t('revenue')} stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" name={t('expense')} stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* PROFIT COMPOSITION */}
            <Card className="bg-slate-950/40 border-slate-800 rounded-none relative overflow-hidden group">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-light text-white">{t('profit_loss')}</CardTitle>
                <CardDescription className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Monthly Variance Analysis</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] p-8 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} reversed={isRTL} />
                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} orientation={isRTL ? "right" : "left"} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: 0 }} />
                    <Bar dataKey="profit" name={t('profit_loss')} fill="#3b82f6" radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* TOP PRODUCTS */}
            <Card className="bg-slate-950/40 border-slate-800 rounded-none relative overflow-hidden group">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-light text-white">{t('revenue')}</CardTitle>
                <CardDescription className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Portfolio Contribution</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] p-8 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topItems}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {topItems.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: 0 }} />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 10, textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statements" className="grid grid-cols-1 md:grid-cols-2 gap-10 focus-visible:ring-0 outline-none">
          {/* BALANCE SHEET VISUALIZER */}
          <Card className="bg-slate-950/40 border-slate-800 rounded-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <PieIcon className="h-32 w-32 text-amber-500" />
            </div>
            <CardHeader className="p-8 border-b border-slate-800/50">
              <CardTitle className="text-2xl font-light text-white">{t('balance')} {t('sheet' as any || 'Statement')}</CardTitle>
              <CardDescription className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Snapshot of Financial Position</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-6 bg-slate-900/50 border border-slate-800/50 relative group">
                  <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
                  <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">{language === 'ar' ? 'الأصول' : 'Asset'}</span>
                  <span className="text-emerald-500 font-mono text-xl">{formatCurrency(balanceSheet?.totalAssets || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-slate-900/50 border border-slate-800/50 relative group">
                  <div className="absolute left-0 top-0 w-1 h-full bg-rose-500"></div>
                  <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">{t('liability')}</span>
                  <span className="text-rose-500 font-mono text-xl">{formatCurrency(balanceSheet?.totalLiabilities || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-slate-900/50 border border-slate-800/50 relative group">
                  <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
                  <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">{t('equity')}</span>
                  <span className="text-blue-500 font-mono text-xl">{formatCurrency(balanceSheet?.totalEquity || 0)}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800">
                <h4 className="text-amber-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Detailed Allocations</h4>
                <ScrollArea className="h-[250px] pr-4">
                  <div className="space-y-2">
                    {balanceSheet?.assets.map((a: any) => (
                      <div key={a.code} className="flex justify-between py-2 border-b border-white/5 group hover:bg-white/5 transition-colors px-2">
                        <span className="text-slate-500 text-xs group-hover:text-slate-300 transition-colors">{a.code} - {a.name}</span>
                        <span className="text-slate-300 font-mono text-xs">{formatCurrency(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Detailed P&L */}
          <Card className="bg-slate-950/40 border-slate-800 rounded-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <FileText className="h-32 w-32 text-amber-500" />
            </div>
            <CardHeader className="p-8 border-b border-slate-800/50">
              <CardTitle className="text-2xl font-light text-white">{t('profit_loss')} {t('reports')}</CardTitle>
              <CardDescription className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Year-To-Date Performance Ledger</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <table className="w-full">
                <tbody className="divide-y divide-slate-800">
                  <tr className="group">
                    <td className="py-5 text-slate-300 font-light text-sm">{t('revenue')}</td>
                    <td className="py-5 text-right text-emerald-500 font-bold font-mono text-base">{formatCurrency(metrics?.revenue || 0)}</td>
                  </tr>
                  <tr className="group">
                    <td className="py-5 text-slate-500 font-light text-sm pl-6 italic">Estimated Cost Basis</td>
                    <td className="py-5 text-right text-rose-400 font-mono text-sm">({formatCurrency(metrics?.expenses * 0.7 || 0)})</td>
                  </tr>
                  <tr className="bg-slate-900/40">
                    <td className="py-5 text-white font-bold text-sm px-4 uppercase tracking-widest">Gross Yield</td>
                    <td className="py-5 text-right text-white font-bold font-mono text-base px-4">{formatCurrency((metrics?.revenue || 0) - (metrics?.expenses * 0.7 || 0))}</td>
                  </tr>
                  <tr className="group">
                    <td className="py-5 text-slate-500 font-light text-sm pl-6 italic">{t('expense')}</td>
                    <td className="py-5 text-right text-rose-400 font-mono text-sm">({formatCurrency(metrics?.expenses * 0.3 || 0)})</td>
                  </tr>
                  <tr className="bg-amber-500/10 h-24">
                    <td className="py-4 text-amber-500 font-bold text-xl uppercase tracking-tighter px-6">{t('profit_loss')} (NET)</td>
                    <td className="py-4 text-right text-amber-500 font-bold font-mono text-2xl px-6">{formatCurrency(metrics?.netProfit || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="focus-visible:ring-0 outline-none">
          <Card className="bg-slate-950/40 border-slate-800 rounded-none relative overflow-hidden group max-w-2xl mx-auto shadow-3xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Download className="h-32 w-32 text-amber-500" />
            </div>
            <CardHeader className="p-10 border-b border-slate-800/50 text-center">
              <CardTitle className="text-3xl font-light text-white">{t('export')} Intelligence</CardTitle>
              <CardDescription className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">Data Integrity & Extraction Engine</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Dataset Selection</label>
                  <Select value={exportType} onValueChange={setExportType}>
                    <SelectTrigger className="bg-slate-900 border-slate-800 rounded-none h-12 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="sales">Sales Ledger</SelectItem>
                      <SelectItem value="debts">Customer Balances</SelectItem>
                      <SelectItem value="inventory">Inventory Valuation</SelectItem>
                      <SelectItem value="payroll">Payroll Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Temporal Range</label>
                  <div className="flex gap-2">
                    <Input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="bg-slate-900 border-slate-800 rounded-none h-12 text-xs pt-2" />
                    <Input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="bg-slate-900 border-slate-800 rounded-none h-12 text-xs pt-2" />
                  </div>
                </div>
              </div>
              <Button
                onClick={async () => {
                  setIsExporting(true)
                  const res = await getExportData(user.companyId, exportType, dateRange.start, dateRange.end)
                  if (res.success && res.data) {
                    const mod = await import("@/lib/export")
                    const filename = `${exportType}_${new Date().toISOString().split('T')[0]}`
                    mod.exportToExcel(res.data, filename)
                    toast.success("Extraction complete. Download initializing.")
                  } else {
                    toast.error("Extraction engine failed.")
                  }
                  setIsExporting(false)
                }}
                disabled={isExporting}
                className="w-full bg-white text-black hover:bg-amber-50 rounded-none h-14 uppercase tracking-[0.2em] text-[11px] font-bold transition-all shadow-xl hover:shadow-amber-500/10"
              >
                {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                {isExporting ? t('generating') : t('generate')} Excel Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div >
  )
}

function KpiCard({ title, value, icon: Icon, trend, color, format }: any) {
  const colorMap = {
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/20 shadow-amber-500/5",
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/20 shadow-rose-500/5",
    indigo: "text-indigo-500 bg-indigo-500/5 border-indigo-500/20 shadow-indigo-500/5",
  }

  const selectedColor = colorMap[color as keyof typeof colorMap] || colorMap.amber

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("bg-slate-950/50 border-slate-800 rounded-none backdrop-blur-sm transition-all hover:border-slate-700 h-full relative overflow-hidden group")}>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon className="h-12 w-12 text-white" />
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded h-8 w-8 flex items-center justify-center border", selectedColor)}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{title}</p>
            </div>
            <div>
              <h3 className="text-3xl font-light text-white tracking-tight">
                {value !== undefined ? format(value) : "--"}
              </h3>
              <div className="mt-4 flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-widest py-0.5 px-1.5 rounded-none",
                  trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : trend === 'down' ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-500"
                )}>
                  {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                  {trend === 'up' ? "High" : trend === 'down' ? "Low" : "Med"}
                </div>
                <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">vs Prev Term</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}