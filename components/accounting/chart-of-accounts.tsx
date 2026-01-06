"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  TreePine,
  Building2,
  ArrowRightLeft,
  Wallet,
  PieChart,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { getCOA, createAccount } from "@/actions/accounting"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Account {
  id: number
  accountCode: string
  accountName: string
  accountType: string
  balance: string
  isActive: boolean
}

interface Props {
  user: any
}

export function ChartOfAccounts({ user }: Props) {
  const { t, isRTL } = useTranslation()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchAccounts()
    // eslint-disable-next-line
  }, [user.companyId])

  const fetchAccounts = async () => {
    if (!user.companyId) return
    setLoading(true)
    try {
      const res = await getCOA(user.companyId)
      if (res.success) {
        setAccounts(res.data as any[])
      } else {
        toast.error(t('operation_failed'))
      }
    } catch (err) {
      toast.error(t('error_occurred'))
    } finally {
      setLoading(false)
    }
  }

  const filteredAccounts = accounts.filter(acc =>
    acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'asset': return <Building2 className="h-4 w-4 text-emerald-500" />
      case 'liability': return <ArrowRightLeft className="h-4 w-4 text-rose-500" />
      case 'equity': return <PieChart className="h-4 w-4 text-blue-500" />
      case 'revenue': return <TrendingUp className="h-4 w-4 text-cyan-500" />
      case 'expense': return <Wallet className="h-4 w-4 text-orange-500" />
      default: return <TreePine className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-white">{t('chart_of_accounts')}</h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">{t('financial_structure')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500", isRTL ? "right-3" : "left-3")} />
            <Input
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("bg-slate-950 border-slate-800 text-xs h-10 rounded-none", isRTL ? "pr-10" : "pl-10")}
            />
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-none h-10">
            <Plus className="h-4 w-4 mr-2" />
            {t('add')} {t('account')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-900/50 animate-pulse border border-slate-800" />
          ))
        ) : filteredAccounts.length === 0 ? (
          <div className="py-20 text-center text-slate-600 italic border border-slate-800 bg-slate-950/20">
            {t('no_data')}
          </div>
        ) : (
          filteredAccounts.map((acc, idx) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="group bg-slate-950/50 backdrop-blur-sm border border-slate-800 p-4 flex items-center justify-between hover:border-amber-500/30 transition-all hover:bg-slate-900/50"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-slate-500 font-bold group-hover:text-amber-500 transition-colors uppercase">{acc.accountCode}</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-800"></div>
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{acc.accountName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getAccountIcon(acc.accountType)}
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{t(acc.accountType as any || acc.accountType)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('balance')}</span>
                  <span className={cn(
                    "text-sm font-mono font-medium",
                    Number(acc.balance) < 0 ? "text-rose-500" : "text-emerald-500"
                  )}>
                    {t('currency_symbol')} {Math.abs(Number(acc.balance)).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {acc.isActive ? (
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-emerald-500/20 text-emerald-500 bg-emerald-500/5 rounded-none">{t('active')}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-rose-500/20 text-rose-500 bg-rose-500/10 rounded-none">{t('inactive')}</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
