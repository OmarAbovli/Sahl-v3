"use client"

import { useState, useEffect, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  TrendingUp,
  Download,
  Edit2,
  Printer,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
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
import { DataExportModal } from "@/components/data-export-modal"

import { getSalesInvoices, getCustomers, getSellableInventory, saveSalesInvoice, deleteSalesInvoice, getTaxRules } from "@/actions/sales"

interface SalesManagementProps {
  user: any
  canManage: boolean
  canView: boolean
}

export function SalesManagement({ user, canManage, canView }: SalesManagementProps) {
  const { t, isRTL } = useTranslation()
  const [invoices, setInvoices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [taxRules, setTaxRules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")

  // Modals
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<any | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form State
  const initialForm = {
    customerId: "",
    invoiceDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: "",
    status: "draft",
    lines: [] as { inventoryItemId: string; quantity: number; unitPrice: number; description: string }[]
  }
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line
  }, [user.companyId])

  async function loadData() {
    const companyId = user.companyId
    if (!companyId) return
    setIsLoading(true)
    try {
      const [invRes, custRes, invItemRes, taxRes] = await Promise.all([
        getSalesInvoices(companyId),
        getCustomers(companyId),
        getSellableInventory(companyId),
        getTaxRules(companyId)
      ])

      if (invRes.success) setInvoices(invRes.data as any[])
      if (custRes.success) setCustomers(custRes.data as any[])
      if (invItemRes.success) setInventoryItems(invItemRes.data as any[])
      if (taxRes.success) setTaxRules(taxRes.data as any[])
    } catch (err) {
      toast.error(t('operation_failed' as any))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveInvoice = async () => {
    if (!formData.customerId) {
      toast.error(t('customer' as any) + " is required")
      return
    }
    if (formData.lines.length === 0) {
      toast.error(t('details' as any) + " are required")
      return
    }

    startTransition(async () => {
      const res = await saveSalesInvoice({
        id: editingId || undefined,
        userId: user.id,
        companyId: user.companyId,
        customerId: parseInt(formData.customerId),
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
        lines: formData.lines.map(l => ({
          ...l,
          inventoryItemId: parseInt(l.inventoryItemId)
        }))
      })

      if (res.success) {
        toast.success(res.message)
        setIsSheetOpen(false)
        setFormData(initialForm)
        setEditingId(null)
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleEdit = (inv: any) => {
    setEditingId(inv.id)
    setFormData({
      customerId: inv.customerId.toString(),
      invoiceDate: format(new Date(inv.invoiceDate), "yyyy-MM-dd"),
      dueDate: inv.dueDate ? format(new Date(inv.dueDate), "yyyy-MM-dd") : "",
      status: inv.status,
      lines: inv.lines.map((l: any) => ({
        inventoryItemId: l.inventoryItemId.toString(),
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unitPrice),
        description: l.description
      }))
    })
    setIsSheetOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm' as any))) return
    startTransition(async () => {
      const res = await deleteSalesInvoice(id)
      if (res.success) {
        toast.success(t('operation_successful' as any))
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const addLineItem = () => {
    // Use default tax rule if available
    const defaultTax = taxRules.find(r => r.isDefault)?.rate || 0
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { inventoryItemId: "", quantity: 1, unitPrice: 0, description: "", taxRate: parseFloat(defaultTax.toString()) }]
    }))
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines]
    newLines[index] = { ...newLines[index], [field]: value }

    if (field === 'inventoryItemId') {
      const item = inventoryItems.find(i => i.id.toString() === value)
      if (item) {
        newLines[index].unitPrice = parseFloat(item.unitPrice || '0')
        newLines[index].description = item.itemName
      }
    }
    setFormData({ ...formData, lines: newLines })
  }

  const removeLineItem = (index: number) => {
    const newLines = [...formData.lines]
    newLines.splice(index, 1)
    setFormData({ ...formData, lines: newLines })
  }

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = invoices.reduce((acc, curr) => acc + parseFloat(curr.totalAmount || '0'), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 text-emerald-500" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{t('revenue')}</p>
            <h3 className="text-3xl font-light text-white mt-1">
              {`${t('currency_symbol')} ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </h3>
          </div>
        </div>

        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-12 h-12 text-blue-500" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{t('invoices')}</p>
            <h3 className="text-3xl font-light text-white mt-1">{invoices.length}</h3>
          </div>
        </div>

        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle className="w-12 h-12 text-amber-500" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{t('status')}</p>
            <h3 className="text-3xl font-light text-white mt-1">
              {invoices.filter(i => i.status !== 'paid').length} {t('pending')}
            </h3>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-950/50 p-4 border border-slate-800 backdrop-blur-xl">
        <div className="relative w-full md:w-96">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={t('search')}
            className={cn("bg-slate-900/50 border-slate-800 focus:border-amber-500/50", isRTL ? "pr-9" : "pl-9")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DataExportModal
            model="sales_invoices"
            title={t('sales')}
            companyId={user.companyId}
          />
          {canManage && (
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setEditingId(null); setFormData(initialForm); setIsSheetOpen(true); }}>
              <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('new_invoice' as any)}
            </Button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-md border border-slate-800 bg-slate-950/30 backdrop-blur-sm overflow-hidden">
        <ScrollArea className="h-[600px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 text-xs uppercase font-medium text-slate-400 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="px-6 py-4">{t('invoice_number')}</th>
                <th className="px-6 py-4">{t('customer')}</th>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4 text-right">{t('amount')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-slate-800 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {inv.customer?.name || inv.clientName || t('unknown')}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{format(new Date(inv.invoiceDate), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn(
                        "capitalize border-0",
                        inv.status === 'paid' && "bg-emerald-500/10 text-emerald-500",
                        inv.status === 'pending' && "bg-amber-500/10 text-amber-500",
                        inv.status === 'draft' && "bg-slate-500/10 text-slate-500",
                      )}>
                        {t(inv.status as any)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">
                      {`${t('currency_symbol')} ${parseFloat(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800 text-slate-300 shadow-2xl">
                          <DropdownMenuItem onClick={() => setViewInvoice(inv)}>
                            <Eye className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('details')}
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(inv)}>
                                <Edit2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-950/50" onClick={() => handleDelete(inv.id)}>
                                <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('delete')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>{t('no_data' as any)}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Save Invoice Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side={isRTL ? "right" : "left"} className="bg-slate-950 border-slate-800 text-white w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white text-2xl font-light">
              {editingId ? t('edit') : t('new')} {t('invoices')}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              {t('accounting_modules_desc' as any)}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">{t('customer')}</Label>
                <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 h-10">
                    <SelectValue placeholder={t('customer')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">{t('status')}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 h-10">
                    <SelectValue placeholder={t('status')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="draft">{t('draft' as any)}</SelectItem>
                    <SelectItem value="pending">{t('pending' as any)}</SelectItem>
                    <SelectItem value="paid">{t('paid' as any)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">{t('date')}</Label>
                <Input
                  type="date"
                  className="bg-slate-900 border-slate-800 h-10"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">{t('due_date')}</Label>
                <Input
                  type="date"
                  className="bg-slate-900 border-slate-800 h-10"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-widest">{t('invoice_items')}</h3>
                <Button variant="ghost" size="sm" onClick={addLineItem} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
                  <Plus className="h-3 w-3 mr-1" /> {t('add')} {t('item')}
                </Button>
              </div>

              {formData.lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-900/30 p-3 rounded-md border border-slate-800/50 relative group">
                  <div className="col-span-3 space-y-1">
                    <Label className="text-[10px] text-slate-500 uppercase">{t('inventory')}</Label>
                    <Select value={line.inventoryItemId} onValueChange={(v) => updateLineItem(idx, 'inventoryItemId', v)}>
                      <SelectTrigger className="h-9 text-[10px] bg-slate-950 border-slate-800">
                        <SelectValue placeholder={t('select')} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {inventoryItems.map(item => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.itemName} ({t('currency_symbol')}{parseFloat(item.unitPrice || '0').toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-slate-500 uppercase">{t('quantity')}</Label>
                    <Input
                      type="number"
                      className="h-9 text-[10px] bg-slate-950 border-slate-800"
                      value={line.quantity}
                      onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-slate-500 uppercase">{t('price')}</Label>
                    <Input
                      type="number"
                      className="h-9 text-[10px] bg-slate-950 border-slate-800"
                      value={line.unitPrice}
                      onChange={(e) => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-slate-500 uppercase">{t('tax_rate')}</Label>
                    <Select value={line.taxRate?.toString()} onValueChange={(v) => updateLineItem(idx, 'taxRate', parseFloat(v))}>
                      <SelectTrigger className="h-9 text-[10px] bg-slate-950 border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        {taxRules.map(r => (
                          <SelectItem key={r.id} value={r.taxRate?.toString()}>{r.taxName} ({parseFloat(r.taxRate).toFixed(0)}%)</SelectItem>
                        ))}
                        <SelectItem value="0">Zero (0%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-slate-500 uppercase">{t('total')}</Label>
                    <div className="h-9 flex items-center text-[10px] font-mono text-emerald-500 font-bold bg-slate-950 px-2 rounded border border-slate-800">
                      {t('currency_symbol')}{(line.quantity * line.unitPrice * (1 + (line.taxRate || 0) / 100)).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end pb-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-950/30" onClick={() => removeLineItem(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-6">
                <div className="text-right space-y-1 bg-slate-900/50 p-4 rounded-lg border border-slate-800 min-w-48">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">{t('total')}</p>
                  <h3 className="text-3xl font-light text-white font-mono">
                    {`${t('currency_symbol')} ${formData.lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </h3>
                </div>
              </div>
            </div>

            <Button className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-medium text-lg shadow-[0_4px_14px_0_rgba(217,119,6,0.3)] transition-all" onClick={handleSaveInvoice} disabled={isPending}>
              {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : (editingId ? t('update') : t('create')) + " " + t('invoice')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Details Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <DialogHeader className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-light">{t('invoice_number')} {viewInvoice?.invoiceNumber}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {viewInvoice && format(new Date(viewInvoice.invoiceDate), 'PPP')}
                </DialogDescription>
              </div>
              <Button variant="outline" className="border-slate-800 text-slate-400" onClick={() => window.print()}>
                <Printer className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('print')}
              </Button>
            </div>
          </DialogHeader>

          {viewInvoice && (
            <div className="space-y-8 mt-4 print:p-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500 uppercase font-bold">{t('customer')}</Label>
                  <p className="font-medium text-lg">{viewInvoice.customer?.name || viewInvoice.clientName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500 uppercase font-bold">{t('status')}</Label>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-0 uppercase text-[10px]">
                    {t(viewInvoice.status as any)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500 uppercase font-bold">{t('total')}</Label>
                  <p className="font-mono text-xl text-emerald-500 font-bold">{t('currency_symbol')}{parseFloat(viewInvoice.totalAmount).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-slate-500 bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold">{t('inventory')}</th>
                      <th className="px-6 py-3 text-right font-bold">{t('quantity')}</th>
                      <th className="px-6 py-3 text-right font-bold">{t('price')}</th>
                      <th className="px-6 py-3 text-right font-bold">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/10">
                    {viewInvoice.lines?.map((line: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 text-slate-300">{line.description}</td>
                        <td className="px-6 py-4 text-right font-mono">{line.quantity}</td>
                        <td className="px-6 py-4 text-right font-mono">{t('currency_symbol')}{parseFloat(line.unitPrice).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-mono text-white">{t('currency_symbol')}{parseFloat(line.lineTotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 font-bold text-white border-t border-slate-800">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right uppercase text-[10px] text-slate-500">{t('total')}</td>
                      <td className="px-6 py-4 text-right font-mono text-lg text-emerald-400">{t('currency_symbol')}{parseFloat(viewInvoice.totalAmount).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
