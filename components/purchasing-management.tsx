"use client"
import { useTranslation } from "@/hooks/use-translation"

import { useState, useEffect, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Truck,
  Package
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
  SheetDescription
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
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
import { DataExportModal } from "@/components/data-export-modal"

import { getPurchaseOrders, getInventoryItems, createPurchaseOrder, updatePOStatus, deletePurchaseOrder } from "@/actions/purchasing"
import { createSupplier, getSuppliers } from "@/actions/suppliers"

interface PurchasingManagementProps {
  user: any
  canManage: boolean
  canView: boolean
}

export function PurchasingManagement({ user, canManage, canView }: PurchasingManagementProps) {
  const { t, isRTL } = useTranslation()
  const [orders, setOrders] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewOrder, setViewOrder] = useState<any | null>(null)

  // Form State
  const [newOrder, setNewOrder] = useState({
    supplierId: "",
    orderDate: format(new Date(), "yyyy-MM-dd"),
    expectedDate: "",
    status: "pending",
    lines: [] as { inventoryItemId: string; quantity: number; unitPrice: number; description: string }[]
  })

  // Supplier Form
  const [isSupplierOpen, setIsSupplierOpen] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    supplierCode: "",
    email: "",
    phone: "",
    address: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (!user.companyId) return
    setIsLoading(true)
    try {
      const [poRes, suppRes, invRes] = await Promise.all([
        getPurchaseOrders(user.companyId),
        getSuppliers(user.companyId),
        getInventoryItems(user.companyId)
      ])

      if (poRes.success) setOrders(poRes.data as any[])
      if (suppRes.success) setSuppliers(suppRes.data as any[])
      if (invRes.success) setInventoryItems(invRes.data as any[])
    } catch (err) {
      toast.error("Failed to load purchasing data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!newOrder.supplierId) {
      toast.error("Please select a supplier")
      return
    }
    if (newOrder.lines.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    startTransition(async () => {
      const res = await createPurchaseOrder({
        userId: user.id,
        companyId: user.companyId,
        supplierId: parseInt(newOrder.supplierId),
        orderDate: newOrder.orderDate,
        expectedDate: newOrder.expectedDate || undefined,
        status: newOrder.status,
        lines: newOrder.lines.map(l => ({
          ...l,
          inventoryItemId: parseInt(l.inventoryItemId)
        }))
      })

      if (res.success) {
        toast.success(res.message || "Purchase Order created successfully")
        setIsCreateOpen(false)
        setNewOrder({
          supplierId: "",
          orderDate: format(new Date(), "yyyy-MM-dd"),
          expectedDate: "",
          status: "pending",
          lines: []
        })
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleCreateSupplier = async () => {
    if (!newSupplier.name || !newSupplier.supplierCode) {
      toast.error("Name and Code are required")
      return
    }

    startTransition(async () => {
      const res = await createSupplier({
        companyId: user.companyId,
        ...newSupplier
      })

      if (res.success) {
        toast.success("Supplier added")
        setIsSupplierOpen(false)
        setNewSupplier({ name: "", supplierCode: "", email: "", phone: "", address: "" })

        // Refresh supplier list and select the new one
        const suppRes = await getSuppliers(user.companyId)
        if (suppRes.success) {
          setSuppliers(suppRes.data)
          setNewOrder(prev => ({ ...prev, supplierId: res.data.id.toString() }))
        }
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    startTransition(async () => {
      const res = await updatePOStatus(id, newStatus)
      if (res.success) {
        toast.success(`Order marked as ${newStatus}`)
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will delete the order and revert any stock changes.")) return
    startTransition(async () => {
      const res = await deletePurchaseOrder(id)
      if (res.success) {
        toast.success("Order deleted")
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const addLineItem = () => {
    setNewOrder(prev => ({
      ...prev,
      lines: [...prev.lines, { inventoryItemId: "", quantity: 1, unitPrice: 0, description: "" }]
    }))
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLines = [...newOrder.lines]
    newLines[index] = { ...newLines[index], [field]: value }

    if (field === 'inventoryItemId') {
      const item = inventoryItems.find(i => i.id.toString() === value)
      if (item) {
        // Suggesting last purchase price or 0? 
        // Here we just set name.
        newLines[index].description = item.itemName
        // newLines[index].unitPrice = parseFloat(item.unitPrice || '0') // Often cost price is different from sell price
      }
    }

    setNewOrder({ ...newOrder, lines: newLines })
  }

  const removeLineItem = (index: number) => {
    const newLines = [...newOrder.lines]
    newLines.splice(index, 1)
    setNewOrder({ ...newOrder, lines: newLines })
  }

  const filteredOrders = orders.filter(po =>
    po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Truck className="w-12 h-12 text-blue-500" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{t('active_orders')}</p>
            <h3 className="text-3xl font-light text-white mt-1">
              {orders.filter(o => o.status === 'pending').length}
            </h3>
          </div>
        </div>

        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-12 h-12 text-emerald-500" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{t('received_this_month')}</p>
            <h3 className="text-3xl font-light text-white mt-1">
              {orders.filter(o => o.status === 'received').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-950/50 p-4 border border-slate-800 backdrop-blur-xl">
        <div className="relative w-full md:w-96">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={t('search_placeholder')}
            className={cn("bg-slate-900/50 border-slate-800 focus:border-amber-500/50", isRTL ? "pr-9" : "pl-9")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DataExportModal
            model="purchase_invoices"
            title={t('purchases' as any)}
            companyId={user.companyId}
          />
          {canManage && (
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> {t('new_purchase_order')}
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-md border border-slate-800 bg-slate-950/30 backdrop-blur-sm overflow-hidden">
        <ScrollArea className="h-[600px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 text-xs uppercase font-medium text-slate-400 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="px-6 py-4">{t('po_number')}</th>
                <th className="px-6 py-4">{t('supplier')}</th>
                <th className="px-6 py-4">{t('ordered')}</th>
                <th className="px-6 py-4">{t('expected')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4 text-right">{t('amount')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4 bg-slate-900/50"></td>
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((po, idx) => (
                  <tr key={po.id} className="hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{po.poNumber}</td>
                    <td className="px-6 py-4 text-slate-300">{po.supplier?.name}</td>
                    <td className="px-6 py-4 text-slate-400">{format(new Date(po.orderDate), 'MMM dd')}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {po.expectedDate ? format(new Date(po.expectedDate), 'MMM dd') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn(
                        "capitalize border-0",
                        po.status === 'received' && "bg-emerald-500/10 text-emerald-500",
                        po.status === 'pending' && "bg-amber-500/10 text-amber-500",
                        po.status === 'cancelled' && "bg-red-500/10 text-red-500",
                      )}>
                        {po.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400">
                      {`${t('currency_symbol')} ${parseFloat(po.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                          <DropdownMenuItem onClick={() => setViewOrder(po)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          {canManage && po.status === 'pending' && (
                            <DropdownMenuItem
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50"
                              onClick={() => handleStatusChange(po.id, 'received')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Receive Goods
                            </DropdownMenuItem>
                          )}
                          {canManage && (
                            <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-950/50" onClick={() => handleDelete(po.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No purchase orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Create PO Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="bg-slate-950 border-l border-slate-800 text-white w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">New Purchase Order</SheetTitle>
            <SheetDescription className="text-slate-400">
              Create a new order for supplies. Marking as 'Received' will add items to inventory immediately.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('supplier')}</Label>
                  <Button variant="link" size="sm" className="h-auto p-0 text-amber-500" onClick={() => setIsSupplierOpen(true)}>
                    + {t('new_supplier')}
                  </Button>
                </div>
                <Select value={newOrder.supplierId} onValueChange={(v) => setNewOrder({ ...newOrder, supplierId: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-800">
                    <SelectValue placeholder={t('select_supplier')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('status')}</Label>
                <Select defaultValue="pending" onValueChange={(v) => setNewOrder({ ...newOrder, status: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-800">
                    <SelectValue placeholder={t('status')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="received">{t('received')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('date')}</Label>
                <Input
                  type="date"
                  className="bg-slate-900 border-slate-800"
                  value={newOrder.orderDate}
                  onChange={(e) => setNewOrder({ ...newOrder, orderDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('expected')} {t('date')}</Label>
                <Input
                  type="date"
                  className="bg-slate-900 border-slate-800"
                  value={newOrder.expectedDate}
                  onChange={(e) => setNewOrder({ ...newOrder, expectedDate: e.target.value })}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">{t('order')} {t('items')}</h3>
                <Button variant="ghost" size="sm" onClick={addLineItem} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
                  <Plus className="h-3 w-3 mr-1" /> {t('add')} {t('item')}
                </Button>
              </div>

              {newOrder.lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-900/30 p-3 rounded-md border border-slate-800/50">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs text-slate-500">Item</Label>
                    <Select value={line.inventoryItemId} onValueChange={(v) => updateLineItem(idx, 'inventoryItemId', v)}>
                      <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-800">
                        <SelectValue placeholder={t('select_item')} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {inventoryItems.map(item => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.itemName} (Current: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-slate-500">{t('quantity_short')}</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs bg-slate-900 border-slate-800"
                      value={line.quantity}
                      onChange={(e) => updateLineItem(idx, 'quantity', parseInt(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs text-slate-500">{t('cost')}</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs bg-slate-900 border-slate-800"
                      value={line.unitPrice}
                      onChange={(e) => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-950/30" onClick={() => removeLineItem(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {newOrder.lines.length === 0 && (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-md">
                  No items added
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <div className="text-right space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Estimated Total</p>
                  <h3 className="text-2xl font-light text-white">
                    {`${t('currency_symbol')} ${newOrder.lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0).toFixed(2)}`}
                  </h3>
                </div>
              </div>
            </div>

            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateOrder} disabled={isPending}>
              {isPending ? t('processing') : t('create_order')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Order Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order #{viewOrder?.poNumber}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Placed on {viewOrder && format(new Date(viewOrder.orderDate), 'PPP')}
            </DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Supplier</Label>
                  <p className="font-medium">{viewOrder.supplier?.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase">{t('status')}</Label>
                  <Badge variant="outline" className={cn(
                    "capitalize border-0",
                    viewOrder.status === 'received' && "bg-emerald-500/10 text-emerald-500",
                  )}>
                    {viewOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase">{t('total')} {t('amount')}</Label>
                  <p className="font-mono text-emerald-500">{t('currency_symbol')}{viewOrder.totalAmount}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">{t('order')} {t('items')}</h4>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-500 bg-slate-900">
                    <tr>
                      <th className="px-4 py-2 text-left">{t('item')}</th>
                      <th className="px-4 py-2 text-right">{t('quantity_short')}</th>
                      <th className="px-4 py-2 text-right">{t('unit_cost')}</th>
                      <th className="px-4 py-2 text-right">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {viewOrder.lines?.map((line: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{line.description}</td>
                        <td className="px-4 py-2 text-right">{line.quantity}</td>
                        <td className="px-4 py-2 text-right">{t('currency_symbol')}{line.unitPrice}</td>
                        <td className="px-4 py-2 text-right">{t('currency_symbol')}{line.lineTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Add Supplier Dialog */}
      <Dialog open={isSupplierOpen} onOpenChange={setIsSupplierOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{t('add_new_supplier')}</DialogTitle>
            <DialogDescription>{t('add_supplier_desc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('supplier')} {t('name')}</Label>
                <Input
                  className="bg-slate-900 border-slate-800"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('supplier_code')}</Label>
                <Input
                  className="bg-slate-900 border-slate-800"
                  value={newSupplier.supplierCode}
                  placeholder="e.g. SUP-001"
                  onChange={(e) => setNewSupplier({ ...newSupplier, supplierCode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <Input
                  type="email"
                  className="bg-slate-900 border-slate-800"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('phone')}</Label>
                <Input
                  className="bg-slate-900 border-slate-800"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('address')}</Label>
              <Input
                className="bg-slate-900 border-slate-800"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              />
            </div>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateSupplier} disabled={isPending}>
            {isPending ? t('processing') : t('add_supplier')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
