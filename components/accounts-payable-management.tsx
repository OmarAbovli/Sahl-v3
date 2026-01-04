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
  History,
  ArrowUpRight,
  TrendingDown,
  ArrowRightLeft,
  Search,
  Lock,
  ShoppingCart
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
import { getPurchaseOrders } from "@/actions/purchasing"
import { getSupplierPayments } from "@/actions/treasury"

interface AccountsPayableManagementProps {
  canManage: boolean
  canView: boolean
  user: any
}

export function AccountsPayableManagement({ canManage, canView, user }: AccountsPayableManagementProps) {
  const { t, isRTL } = useTranslation()
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
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
        getPurchaseOrders(companyId),
        getSupplierPayments(companyId)
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

  const stats = {
    totalToPay: invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.paidAmount || 0)), 0),
    totalPaid: payments.reduce((acc, pay) => acc + Number(pay.amount), 0),
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
            <TrendingDown className="w-12 h-12 text-rose-500" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('balance_due' as any || 'Total Payable')}</p>
            <h3 className="text-3xl font-light text-white mt-1">{t('currency_symbol')} {stats.totalToPay.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowRightLeft className="w-12 h-12 text-blue-500" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('paid_amount' as any || 'Total Paid')}</p>
            <h3 className="text-3xl font-light text-white mt-1">{t('currency_symbol')} {stats.totalPaid.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingCart className="w-12 h-12 text-amber-500" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('purchases')}</p>
            <h3 className="text-3xl font-light text-white mt-1">{stats.invoiceCount}</h3>
          </div>
        </div>
      </div>

      <Card className="bg-slate-950/50 backdrop-blur-xl border-slate-800 rounded-none shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <CreditCard className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-light text-white">{t('accounts_payable')}</CardTitle>
              <CardDescription className="text-slate-500 text-xs uppercase tracking-widest">{t('manage' as any)} {t('supplier' as any)} {t('invoices')}</CardDescription>
            </div>
          </div>
          {canManage && (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-none" onClick={() => setShowInvoiceDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> {t('add_invoice' as any)}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900/50 border-b border-slate-800">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('invoice_number')}</TableHead>
                <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('supplier')}</TableHead>
                <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('date')}</TableHead>
                <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 text-right">{t('total')}</TableHead>
                <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 text-right">{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500" /></TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="text-center py-24 text-slate-600 italic">No payable invoices found.</TableCell></TableRow>
              ) : (
                invoices.map(inv => (
                  <TableRow key={inv.id} className="border-slate-800 hover:bg-slate-900/30 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <span className="font-mono text-xs text-rose-500 font-bold group-hover:text-rose-400">{inv.poNumber}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-slate-300 text-sm font-medium">{inv.supplier?.name}</TableCell>
                    <TableCell className="px-6 py-4 text-slate-400 text-xs">{new Date(inv.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-white text-sm font-light">{t('currency_symbol')} {Number(inv.totalAmount).toLocaleString()}</TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold uppercase tracking-tighter rounded-none border-0 px-3 py-1",
                        inv.status === 'received' ? 'bg-emerald-500/10 text-emerald-500' :
                          inv.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
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
        </CardContent>
      </Card>

      <Card className="bg-slate-950/50 backdrop-blur-xl border-slate-800 rounded-none shadow-2xl mt-8">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <History className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-light text-white">{t('supplier_payments' as any || 'Outgoing Payments')}</CardTitle>
              <CardDescription className="text-slate-500 text-xs uppercase tracking-widest">{t('payment_history' as any)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="px-6 h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('date')}</TableHead>
                <TableHead className="h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('supplier')}</TableHead>
                <TableHead className="h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 text-right">{t('amount')}</TableHead>
                <TableHead className="h-12 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('payment_method')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(pay => (
                <TableRow key={pay.id} className="border-slate-800 hover:bg-slate-900/20 transition-all">
                  <TableCell className="px-6 py-4 font-mono text-[11px] text-slate-400">{new Date(pay.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell className="py-4 text-slate-300 text-sm font-medium">{pay.supplier?.name}</TableCell>
                  <TableCell className="py-4 text-right text-rose-500 font-bold font-mono text-sm">-{t('currency_symbol')} {Number(pay.amount).toLocaleString()}</TableCell>
                  <TableCell className="py-4 text-[10px] uppercase tracking-widest text-slate-500">{t(pay.method as any || 'bank')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2 font-light text-rose-500 uppercase tracking-widest text-xs">
              <ShoppingCart className="h-4 w-4" /> Purchasing Intelligence
            </div>
            <DialogTitle className="text-2xl font-light">{t('add_invoice' as any || 'Record Supplier Invoice')}</DialogTitle>
          </DialogHeader>
          <div className="py-10 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-rose-500">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
              Supplier invoices are generated during the <span className="text-white font-bold">Purchasing Workflow</span> to ensure direct linkage with Received Goods.
            </p>
            <Button className="bg-slate-800 hover:bg-slate-700 text-white rounded-none" onClick={() => setShowInvoiceDialog(false)}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
