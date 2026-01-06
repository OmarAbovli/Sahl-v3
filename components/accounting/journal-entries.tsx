"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  FileText,
  Calendar,
  User,
  Hash,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Loader2,
  ChevronDown,
  MoreVertical,
  Trash2,
  Edit3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"
import { getJournalEntries, createJournalEntry, getCOA } from "@/actions/accounting"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface JournalEntriesProps {
  user: any
  canManage: boolean
  canView: boolean
}

export function JournalEntries({ user, canManage, canView }: JournalEntriesProps) {
  const { t, isRTL } = useTranslation()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    if (canView) {
      loadData()
      fetchAccounts()
    }
    // eslint-disable-next-line
  }, [canView, user.companyId])

  async function loadData() {
    setLoading(true)
    try {
      const res = await getJournalEntries(user.companyId)
      if (res.success) setEntries(res.data || [])
    } catch (error) {
      toast.error(t('error_occurred'))
    } finally {
      setLoading(false)
    }
  }

  async function fetchAccounts() {
    const res = await getCOA(user.companyId)
    if (res.success) setAccounts(res.data as any[])
  }

  const filteredEntries = entries.filter(entry =>
    entry.entryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!canView) return <div className="p-12 text-center text-slate-500 italic">{t('no_access')}</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-white">{t('journal_entries')}</h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">{t('ledger_records')}</p>
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
          {canManage && (
            <NewEntryDialog
              user={user}
              accounts={accounts}
              onSuccess={loadData}
              trigger={
                <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-none h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add')} {t('transaction')}
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-32 w-full bg-slate-900/50 animate-pulse border border-slate-800" />
          ))
        ) : filteredEntries.length === 0 ? (
          <div className="py-24 text-center text-slate-600 italic border border-slate-800 bg-slate-950/20">
            {t('no_data')}
          </div>
        ) : (
          filteredEntries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-slate-950/40 backdrop-blur-sm border border-slate-800 overflow-hidden hover:border-amber-500/30 transition-all"
            >
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/20">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold leading-none mb-1">{t('invoice_number')}</span>
                    <span className="font-mono text-xs text-amber-500 font-bold">{entry.entryNumber}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-800"></div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span className="text-xs text-slate-400">{new Date(entry.entryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-800 px-0"></div>
                  <p className="text-sm text-slate-200 font-light truncate max-w-md">{entry.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">{t('total')} {t('amount')}</span>
                    <span className="text-xs font-mono text-emerald-500 font-bold">{t('currency_symbol')} {Number(entry.totalDebit).toLocaleString()}</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-none text-[8px] uppercase tracking-widest h-5 px-2">{t('posted')}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-white"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="p-0">
                <table className="w-full text-[11px]">
                  <thead className="text-slate-500 uppercase tracking-widest font-bold">
                    <tr className="border-b border-slate-800/30 bg-slate-950/20">
                      <th className="px-6 py-2 text-left font-bold">{t('account')}</th>
                      <th className="px-6 py-2 text-left font-bold">{t('description')}</th>
                      <th className="px-6 py-2 text-right font-bold w-24">{t('debit')}</th>
                      <th className="px-6 py-2 text-right font-bold w-24">{t('credit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines?.map((line: any, lIdx: number) => (
                      <tr key={line.id} className={cn(
                        "border-b border-slate-800/20 hover:bg-slate-800/10 transition-colors",
                        lIdx === entry.lines.length - 1 && "border-b-0"
                      )}>
                        <td className="px-6 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-medium">{line.account?.accountName}</span>
                            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">{line.account?.accountCode}</span>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 text-slate-400 italic font-light">{line.description}</td>
                        <td className="px-6 py-2.5 text-right font-mono text-emerald-500/80">
                          {Number(line.debitAmount) > 0 ? `${t('currency_symbol')} ${Number(line.debitAmount).toLocaleString()}` : "-"}
                        </td>
                        <td className="px-6 py-2.5 text-right font-mono text-rose-500/80">
                          {Number(line.creditAmount) > 0 ? `${t('currency_symbol')} ${Number(line.creditAmount).toLocaleString()}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

function NewEntryDialog({ user, accounts, onSuccess, trigger }: any) {
  const { t, isRTL } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState("")
  const [reference, setReference] = useState("")
  const [lines, setLines] = useState<any[]>([
    { accountId: "", debit: 0, credit: 0, description: "" },
    { accountId: "", debit: 0, credit: 0, description: "" }
  ])

  const addLine = () => setLines([...lines, { accountId: "", debit: 0, credit: 0, description: "" }])
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx))
  const updateLine = (idx: number, field: string, val: any) => {
    const newLines = [...lines]
    newLines[idx][field] = val
    setLines(newLines)
  }

  const totalDebit = lines.reduce((acc, l) => acc + Number(l.debit || 0), 0)
  const totalCredit = lines.reduce((acc, l) => acc + Number(l.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  const handleSave = async () => {
    if (!isBalanced) return toast.error("Entry is not balanced")

    setLoading(true)
    try {
      const res = await createJournalEntry({
        userId: user.id,
        companyId: user.companyId,
        entryDate: date,
        description,
        reference,
        lines: lines.map(l => ({
          accountId: parseInt(l.accountId),
          debit: Number(l.debit),
          credit: Number(l.credit),
          description: l.description
        }))
      })

      if (res.success) {
        toast.success(t('operation_successful'))
        setOpen(false)
        onSuccess()
        // Reset form
        setDescription("")
        setReference("")
        setLines([
          { accountId: "", debit: 0, credit: 0, description: "" },
          { accountId: "", debit: 0, credit: 0, description: "" }
        ])
      } else {
        toast.error(res.error || t('operation_failed'))
      }
    } catch (error) {
      toast.error(t('error_occurred'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-4xl p-0 overflow-hidden rounded-none">
        <div className="h-1 bg-amber-500 w-full"></div>
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-3xl font-light tracking-tight">{t('new')} {t('journal_entries')}</DialogTitle>
          <DialogDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">{t('manual_ledger_allocation')}</DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('date')}</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-slate-900 border-slate-800 rounded-none h-11 text-sm pt-2" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('description')}</label>
              <Input placeholder={t('transaction_narrative_placeholder')} value={description} onChange={e => setDescription(e.target.value)} className="bg-slate-900 border-slate-800 rounded-none h-11 text-sm" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold">{t('ledger_allocations')}</h4>
              <Button variant="ghost" size="sm" onClick={addLine} className="text-amber-500 hover:text-amber-400 text-[10px] uppercase font-bold tracking-widest">
                <Plus className="h-3 w-3 mr-1" /> {t('add_line')}
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-start animate-in fade-in slide-in-from-left duration-300">
                  <div className="col-span-4">
                    <Select value={line.accountId} onValueChange={v => updateLine(idx, 'accountId', v)}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 rounded-none h-10 text-xs">
                        <SelectValue placeholder={t('select_account')} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {accounts.map((acc: any) => (
                          <SelectItem key={acc.id} value={acc.id.toString()}>{acc.accountName} ({acc.accountCode})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input placeholder={t('line_description')} value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} className="bg-slate-900 border-slate-800 rounded-none h-10 text-xs" />
                  </div>
                  <div className="col-span-1.5 flex flex-col gap-1">
                    <Input type="number" step="0.01" placeholder={t('debit')} value={line.debit} onChange={e => updateLine(idx, 'debit', e.target.value)} className="bg-slate-900 border-slate-800 rounded-none h-10 text-xs font-mono text-emerald-500 text-right" />
                  </div>
                  <div className="col-span-1.5 flex flex-col gap-1">
                    <Input type="number" step="0.01" placeholder={t('credit')} value={line.credit} onChange={e => updateLine(idx, 'credit', e.target.value)} className="bg-slate-900 border-slate-800 rounded-none h-10 text-xs font-mono text-rose-500 text-right" />
                  </div>
                  <div className="col-span-1 flex pt-1 justify-center">
                    <Button variant="ghost" size="icon" disabled={lines.length <= 2} onClick={() => removeLine(idx)} className="h-8 w-8 text-slate-600 hover:text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-950 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-1">{t('total_debit')}</span>
              <span className="text-xl font-mono text-emerald-500 font-light">{t('currency_symbol')} {totalDebit.toLocaleString()}</span>
            </div>
            <div className="flex flex-col border-l border-slate-800 pl-10">
              <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-1">{t('total_credit')}</span>
              <span className="text-xl font-mono text-rose-500 font-light">{t('currency_symbol')} {totalCredit.toLocaleString()}</span>
            </div>
            <div className="flex flex-col border-l border-slate-800 pl-10">
              <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-1">{t('status')}</span>
              {isBalanced ? (
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs uppercase font-bold tracking-widest mt-2 animate-in pulse duration-1000">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t('balanced')}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-500 text-xs uppercase font-bold tracking-widest mt-2">
                  <XCircle className="h-3.5 w-3.5" /> {t('out_of_balance')} ({t('currency_symbol')} {Math.abs(totalDebit - totalCredit).toFixed(2)})
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="border-slate-800 text-slate-400 hover:bg-slate-900 rounded-none h-12 px-8 uppercase tracking-widest text-[10px] font-bold" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button disabled={!isBalanced || loading} onClick={handleSave} className="bg-white text-black hover:bg-amber-50 rounded-none h-12 px-10 uppercase tracking-widest text-[10px] font-bold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('post_to_gl')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function XCircle(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}
