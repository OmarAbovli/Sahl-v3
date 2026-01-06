"use client"

import { useState, useEffect, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Plus,
  Search,
  Wallet,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  History,
  CreditCard,
  Building2,
  DollarSign,
  ChevronRight,
  Loader2,
  RefreshCcw,
  CheckCircle2,
  ArrowRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

import { getCashBankAccounts, createCashBankAccount, recordCustomerPayment, recordSupplierPayment } from "@/actions/treasury"
import { getSalesInvoices } from "@/actions/sales"
import { getPurchaseOrders } from "@/actions/purchasing"

interface CashBankManagementProps {
  user: any
  canManage: boolean
  canView: boolean
}

export function CashBankManagement({ user, canManage, canView }: CashBankManagementProps) {
  const { t, isRTL } = useTranslation()
  const [accounts, setAccounts] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Modals
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false)
  const [isReceiveOpen, setIsReceiveOpen] = useState(false)
  const [isPayOpen, setIsPayOpen] = useState(false)

  // Forms
  const [newAccount, setNewAccount] = useState({ name: "", accountNumber: "", bankName: "", type: "bank" })

  // Payment Forms
  const [paymentData, setPaymentData] = useState({
    invoiceId: "",
    bankAccountId: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    method: "Bank Transfer",
    ref: ""
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line
  }, [user.companyId])

  async function loadData() {
    if (!user.companyId) return
    setIsLoading(true)
    try {
      const [accRes, invRes, poRes] = await Promise.all([
        getCashBankAccounts(user.companyId),
        getSalesInvoices(user.companyId),
        getPurchaseOrders(user.companyId)
      ])

      if (accRes.success) setAccounts(accRes.data as any[])
      if (invRes.success) setInvoices((invRes.data as any[]).filter(i => i.status !== 'draft' && i.status !== 'paid'))
      if (poRes.success) setOrders((poRes.data as any[]).filter(po => po.status === 'received'))
    } catch (error) {
      toast.error(t('error_occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    startTransition(async () => {
      const res = await createCashBankAccount(user.companyId, newAccount)
      if (res.success) {
        toast.success(t('operation_successful'))
        setIsCreateAccountOpen(false)
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleReceivePayment = async () => {
    if (!paymentData.invoiceId || !paymentData.bankAccountId || !paymentData.amount) {
      toast.error(t('action_required'))
      return
    }

    const inv = invoices.find(i => i.id.toString() === paymentData.invoiceId)
    if (!inv) return

    startTransition(async () => {
      const res = await recordCustomerPayment({
        userId: user.id,
        companyId: user.companyId,
        customerId: inv.customerId,
        invoiceId: inv.id,
        amount: parseFloat(paymentData.amount),
        paymentDate: paymentData.date,
        method: paymentData.method,
        reference: paymentData.ref,
        bankAccountId: parseInt(paymentData.bankAccountId)
      })

      if (res.success) {
        toast.success(t('operation_successful'))
        setIsReceiveOpen(false)
        setPaymentData({ invoiceId: "", bankAccountId: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), method: "Bank Transfer", ref: "" })
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }
  const handleSendPayment = async () => {
    if (!paymentData.invoiceId || !paymentData.bankAccountId || !paymentData.amount) {
      toast.error(t('action_required'))
      return
    }

    const order = orders.find(o => o.id.toString() === paymentData.invoiceId)
    if (!order) return

    startTransition(async () => {
      const res = await recordSupplierPayment({
        userId: user.id,
        companyId: user.companyId,
        supplierId: order.supplierId,
        purchaseOrderId: order.id,
        amount: parseFloat(paymentData.amount),
        paymentDate: paymentData.date,
        method: paymentData.method,
        reference: paymentData.ref,
        bankAccountId: parseInt(paymentData.bankAccountId)
      })

      if (res.success) {
        toast.success(t('operation_successful'))
        setIsPayOpen(false)
        setPaymentData({ invoiceId: "", bankAccountId: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), method: "Bank Transfer", ref: "" })
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const totalLiquidity = accounts.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0)

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center space-y-4">
        <div className="h-16 w-16 bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 rounded-none">
          <History className="h-8 w-8 opacity-20" />
        </div>
        <p className="text-slate-500 italic uppercase tracking-widest text-xs">{t('no_access')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">{t('cash_bank')}</h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest font-bold mt-1">{t('treasury_liquidity_management')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="border-slate-800 text-slate-400 hover:text-white h-11 px-6 rounded-none" onClick={loadData}>
            <RefreshCcw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('refresh')}
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white h-11 px-8 rounded-none border-none shadow-xl shadow-amber-600/10 font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsCreateAccountOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t('add')} {t('account')}
          </Button>
        </div>
      </div>

      {/* Liquidity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet className="h-16 w-16 text-white" />
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">{t('total_liquidity')}</p>
          <h3 className="text-4xl font-light text-white mt-2">{t('currency_symbol')} {totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div className="mt-6 flex items-center gap-2">
            <div className="h-1 w-full bg-slate-900 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} className="h-full bg-emerald-500" />
            </div>
          </div>
        </div>

        <motion.div whileHover={{ y: -5 }} onClick={() => setIsReceiveOpen(true)} className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 p-8 cursor-pointer transition-all flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 rounded">
              <ArrowDownRight className="h-6 w-6 text-emerald-500" />
            </div>
            <ArrowRight className={cn("h-5 w-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all", isRTL && "rotate-180")} />
          </div>
          <div className="mt-8">
            <h4 className="text-xl font-light text-white">{t('receive_payment')}</h4>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">{t('capital_inflow_entry')}</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} onClick={() => setIsPayOpen(true)} className="bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 p-8 cursor-pointer transition-all flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-rose-500/10 flex items-center justify-center border border-rose-500/20 rounded">
              <ArrowUpRight className="h-6 w-6 text-rose-500" />
            </div>
            <ArrowRight className={cn("h-5 w-5 text-rose-500 opacity-0 group-hover:opacity-100 transition-all", isRTL && "rotate-180")} />
          </div>
          <div className="mt-8">
            <h4 className="text-xl font-light text-white">{t('issue_disbursement')}</h4>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">{t('capital_outflow_entry')}</p>
          </div>
        </motion.div>
      </div>

      {/* Accounts Ledger */}
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] ml-1">{t('chart_of_accounts')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc, idx) => (
          <motion.div
            key={acc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-8 relative overflow-hidden hover:border-amber-500/30 transition-all shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5">
              {acc.type === 'cash' ? <Wallet className="h-12 w-12 text-white" /> : <Landmark className="h-12 w-12 text-white" />}
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "h-10 w-10 border flex items-center justify-center rounded",
                acc.type === 'cash' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
              )}>
                {acc.type === 'cash' ? <Wallet className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
              </div>
              <Badge variant="outline" className="border-slate-800 text-slate-500 uppercase text-[8px] font-bold tracking-widest px-2 py-1 rounded-none">{t(acc.type as any || acc.type)}</Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-medium text-white group-hover:text-amber-500 transition-colors">{acc.name}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{acc.bankName} {acc.accountNumber && `• ${acc.accountNumber}`}</p>
            </div>

            <div className="mt-8 flex items-baseline justify-between border-t border-slate-800/50 pt-4">
              <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">{t('available_balance')}</span>
              <span className="text-xl font-mono text-white font-light">{t('currency_symbol')} {(parseFloat(acc.balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CREATE ACCOUNT DIALOG */}
      <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-md p-0 overflow-hidden rounded-none">
          <div className="h-1 bg-amber-500 w-full"></div>
          <DialogHeader className="p-8 pb-4 text-center md:text-left">
            <DialogTitle className="text-3xl font-light tracking-tight">{t('institutional_account_setup')}</DialogTitle>
            <DialogDescription className="text-slate-500 uppercase tracking-[0.2em] text-[10px] font-bold">{t('new_treasury_unit_config')}</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('entity_identifier')}</Label>
              <Input
                className="bg-slate-900 border-slate-800 rounded-none h-12 text-sm"
                placeholder="e.g. Master Operating Reserve"
                value={newAccount.name}
                onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('liquidity_class')}</Label>
                <Select value={newAccount.type} onValueChange={v => setNewAccount({ ...newAccount, type: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 rounded-none h-12 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="bank">{t('commercial_bank')}</SelectItem>
                    <SelectItem value="cash">{t('internal_vault_petty')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('associated_bank')}</Label>
                <Input
                  className="bg-slate-900 border-slate-800 rounded-none h-12 text-sm"
                  placeholder="e.g. HSBC, Chase..."
                  value={newAccount.bankName}
                  onChange={e => setNewAccount({ ...newAccount, bankName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('iban_reference')}</Label>
              <Input
                className="bg-slate-900 border-slate-800 rounded-none h-12 text-sm font-mono"
                placeholder="0000 0000 0000..."
                value={newAccount.accountNumber}
                onChange={e => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
              />
            </div>
            <Button className="w-full bg-white text-black hover:bg-amber-50 h-14 rounded-none uppercase tracking-[0.2em] text-[11px] font-bold shadow-2xl transition-all" onClick={handleCreateAccount}>
              {t('initialize_treasury_account')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* RECEIVE PAYMENT SHEET */}
      <Sheet open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <SheetContent side={isRTL ? "left" : "right"} className="bg-slate-950 border-slate-800 text-white sm:max-w-md p-0 overflow-hidden flex flex-col">
          <div className="h-1 bg-emerald-500 w-full"></div>
          <SheetHeader className="p-10 border-b border-slate-800/50">
            <SheetTitle className="text-3xl font-light text-white leading-tight">{t('capital_inflow_entry')}</SheetTitle>
            <SheetDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-2">{t('ar_liquidation')}</SheetDescription>
          </SheetHeader>
          <div className="p-10 space-y-8 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('pending_invoice_selection')}</Label>
                <Select value={paymentData.invoiceId} onValueChange={v => setPaymentData({ ...paymentData, invoiceId: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 rounded-none h-14 text-xs">
                    <SelectValue placeholder={t('locate_invoice')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-[300px]">
                    {invoices.map(inv => (
                      <SelectItem key={inv.id} value={inv.id.toString()} className="text-[11px]">
                        <span className="font-bold text-amber-500">#{inv.invoiceNumber}</span> • {inv.customer?.name} ({t('currency_symbol')} {parseFloat(inv.totalAmount).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('target_deposit_account')}</Label>
                <Select value={paymentData.bankAccountId} onValueChange={v => setPaymentData({ ...paymentData, bankAccountId: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 rounded-none h-14 text-xs">
                    <SelectValue placeholder={t('select_destination_account')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name} ({acc.bankName})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('transfer_amount')}</Label>
                  <Input
                    type="number"
                    className="bg-slate-900 border-slate-800 rounded-none h-12 text-sm font-mono text-emerald-500"
                    value={paymentData.amount}
                    onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('transaction_date')}</Label>
                  <Input
                    type="date"
                    className="bg-slate-900 border-slate-800 rounded-none h-12 text-xs pt-2"
                    value={paymentData.date}
                    onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="p-10 border-t border-slate-800 bg-slate-900/20">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-none uppercase tracking-[0.2em] text-[11px] font-bold shadow-2xl transition-all" onClick={handleReceivePayment} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('authorize_inflow')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* DISBURSEMENT SHEET (OUT) */}
      <Sheet open={isPayOpen} onOpenChange={setIsPayOpen}>
        <SheetContent side={isRTL ? "left" : "right"} className="bg-slate-950 border-slate-800 text-white sm:max-w-md p-0 overflow-hidden flex flex-col">
          <div className="h-1 bg-rose-600 w-full"></div>
          <SheetHeader className="p-10 border-b border-slate-800/50">
            <SheetTitle className="text-3xl font-light text-white leading-tight">{t('capital_disbursement')}</SheetTitle>
            <SheetDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-2">{t('ap_fulfillment')}</SheetDescription>
          </SheetHeader>
          <div className="p-10 space-y-8 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('outstanding_liability')}</Label>
              <Select value={paymentData.invoiceId} onValueChange={v => setPaymentData({ ...paymentData, invoiceId: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-800 rounded-none h-14 text-xs font-mono">
                  <SelectValue placeholder={t('select_purchase_record')} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-[300px]">
                  {orders.map(po => (
                    <SelectItem key={po.id} value={po.id.toString()} className="text-[11px]">
                      <span className="font-bold text-rose-500">#{po.poNumber}</span> • {po.supplier?.name} ({t('currency_symbol')} {parseFloat(po.totalAmount).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('source_funding_account')}</Label>
              <Select value={paymentData.bankAccountId} onValueChange={v => setPaymentData({ ...paymentData, bankAccountId: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-800 rounded-none h-14 text-xs font-sans">
                  <SelectValue placeholder={t('select_withdrawal_source')} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name} ({acc.bankName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('disbursement_amount')}</Label>
                <Input
                  type="number"
                  className="bg-slate-900 border-slate-800 rounded-none h-12 text-sm font-mono text-rose-500"
                  value={paymentData.amount}
                  onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('accounting_date')}</Label>
                <Input
                  type="date"
                  className="bg-slate-900 border-slate-800 rounded-none h-12 text-xs pt-2"
                  value={paymentData.date}
                  onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="p-10 border-t border-slate-800 bg-slate-900/20">
            <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white h-14 rounded-none uppercase tracking-[0.2em] text-[11px] font-bold shadow-2xl transition-all" onClick={handleSendPayment} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('authorize_outflow')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}