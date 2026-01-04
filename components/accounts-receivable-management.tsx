"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  FileText,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Lock
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHead, TableRow, TableCell, TableBody, TableHeader } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import { getSalesInvoices } from "@/actions/sales"
import { getCustomerPayments } from "@/actions/treasury"

interface AccountsReceivableManagementProps {
  canManage: boolean
  canView: boolean
  user: any
}

export function AccountsReceivableManagement({ canManage, canView, user }: AccountsReceivableManagementProps) {
  const { t, isRTL } = useTranslation()
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (canView && user.companyId) {
      loadData()
    }
    // eslint-disable-next-line
  }, [canView, user.companyId])

  async function loadData() {
    setLoading(true)
    try {
      const companyId = user.companyId
      const [invRes, payRes] = await Promise.all([
        getSalesInvoices(companyId),
        getCustomerPayments(companyId)
      ])

      if (invRes.success) setInvoices(invRes.data || [])
      if (payRes.success) setPayments(payRes.data || [])

      if (!invRes.success || !payRes.success) {
        toast.error(t('operation_failed'))
      }
    } catch (error) {
      toast.error(t('error_occurred'))
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalOutstanding: invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.paidAmount || 0)), 0),
    totalReceived: payments.reduce((acc, pay) => acc + Number(pay.amount), 0),
    invoiceCount: invoices.length
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center space-y-4">
        <Lock className="h-12 w-12 text-slate-800" />
        <p className="text-slate-500 italic uppercase tracking-widest text-xs">{t('no_access')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 text-emerald-500" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('total_amount' as any || 'Total Outstanding')}</p>
            <h3 className="text-3xl font-light text-white mt-1">{`${t('currency_symbol')} ${stats.totalOutstanding.toLocaleString()}`}</h3>
          </div>
        </div>
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight className="w-12 h-12 text-blue-500" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('paid_amount' as any || 'Total Received')}</p>
            <h3 className="text-3xl font-light text-white mt-1">{`${t('currency_symbol')} ${stats.totalReceived.toLocaleString()}`}</h3>
          </div>
        </div>
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-12 h-12 text-amber-500" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('invoices')}</p>
            <h3 className="text-3xl font-light text-white mt-1">{stats.invoiceCount}</h3>
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <Card className="bg-slate-950/50 backdrop-blur-xl border-slate-800 rounded-none shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-light text-white">{t('accounts_receivable')}</CardTitle>
              <CardDescription className="text-slate-500 text-xs uppercase tracking-widest">{t('recent_activity')}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden md:block">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500", isRTL ? "right-3" : "left-3")} />
              <Input
                placeholder={t('search_invoices' as any)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("bg-slate-900/50 border-slate-800 text-xs h-9", isRTL ? "pr-9" : "pl-9")}
              />
            </div>
            {canManage && (
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-none" onClick={() => setShowInvoiceDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> {t('add_invoice' as any || 'New Invoice')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/50 border-b border-slate-800">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('invoice_number')}</TableHead>
                  <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('customer')}</TableHead>
                  <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('date')}</TableHead>
                  <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 text-right">{t('total_amount' as any || 'Total')}</TableHead>
                  <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 text-right">{t('paid_amount' as any || 'Paid')}</TableHead>
                  <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 text-right">{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i} className="border-slate-800"><TableCell colSpan={6}><div className="h-10 w-full bg-slate-900/50 animate-pulse rounded" /></TableCell></TableRow>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="text-center py-24 text-slate-600 italic">No invoices found.</TableCell></TableRow>
                ) : (
                  filteredInvoices.map(inv => (
                    <TableRow key={inv.id} className="border-slate-800 hover:bg-slate-900/30 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <span className="font-mono text-xs text-amber-500 font-bold tracking-tighter group-hover:text-amber-400 transition-colors">{inv.invoiceNumber}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-slate-500" />
                          <span className="text-slate-300 text-sm">{inv.customer?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span className="text-slate-400 text-xs">{new Date(inv.invoiceDate).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono text-white text-sm font-light">
                        {`${t('currency_symbol')} ${Number(inv.totalAmount).toLocaleString()}`}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono text-emerald-500 text-sm font-bold">
                        {`${t('currency_symbol')} ${Number(inv.paidAmount || 0).toLocaleString()}`}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold uppercase tracking-tighter rounded-none border-0 px-3 py-1",
                          inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                            inv.status === 'partial' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-red-500/10 text-red-500'
                        )}>
                          {t(inv.status as any || 'pending')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card className="bg-slate-950/50 backdrop-blur-xl border-slate-800 rounded-none shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/30"></div>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6 px-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <History className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-light text-white">{t('payments')}</CardTitle>
              <CardDescription className="text-slate-500 text-xs uppercase tracking-widest">{t('payment_history' as any)}</CardDescription>
            </div>
          </div>
          {canManage && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none" onClick={() => setShowPaymentDialog(true)}>
              <ArrowDownLeft className="h-4 w-4 mr-1" /> {t('record_payment' as any)}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="px-8 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('date')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('customer')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 text-right">{t('amount')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('invoices')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('payment_method')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? null : payments.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-600 italic">No payments recorded.</TableCell></TableRow>
                ) : (
                  payments.map(pay => (
                    <TableRow key={pay.id} className="border-slate-800 hover:bg-slate-900/20 transition-all group">
                      <TableCell className="px-8 py-4 font-mono text-[11px] text-slate-400 group-hover:text-white transition-colors">
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 text-slate-300 text-sm font-medium">
                        {pay.customer?.name}
                      </TableCell>
                      <TableCell className="py-4 text-right text-emerald-500 font-bold font-mono text-sm leading-none">
                        {`${t('currency_symbol')} ${Number(pay.amount).toLocaleString()}`}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[9px] border-slate-800 bg-slate-950 font-mono text-slate-500">
                          {pay.invoice?.invoiceNumber || "U-CREDIT"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-amber-500 transition-colors">
                        {t(pay.method as any || 'cash')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Information Dialogs */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2 font-light text-amber-500 uppercase tracking-widest text-xs">
              <TrendingUp className="h-4 w-4" /> System Intelligence
            </div>
            <DialogTitle className="text-2xl font-light">{t('add_invoice' as any || 'Create New Invoice')}</DialogTitle>
          </DialogHeader>
          <div className="py-10 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-500">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
              Sales Invoice operations are integrated within the <span className="text-white font-bold">Sales & Operations</span> module for seamless stock handling.
            </p>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-none" onClick={() => setShowInvoiceDialog(false)}>
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
