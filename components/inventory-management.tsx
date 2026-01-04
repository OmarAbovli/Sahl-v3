"use client"

import { useState, useEffect, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Package,
  Warehouse as WarehouseIcon,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Edit,
  Trash2,
  Save,
  MapPin,
  Box,
  TrendingUp,
  AlertTriangle,
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
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import { DataExportModal } from "@/components/data-export-modal"

import {
  getInventory,
  getWarehouses,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  createWarehouse
} from "@/actions/inventory"

interface InventoryManagementProps {
  canManage: boolean
  canView: boolean
  user: any
}

export function InventoryManagement({ canManage, canView, user }: InventoryManagementProps) {
  const { t, isRTL } = useTranslation()
  const [activeTab, setActiveTab] = useState("items")
  const [items, setItems] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")

  // Modals
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false)
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)

  // Selection
  const [editingItem, setEditingItem] = useState<any>(null)
  const [adjustingItem, setAdjustingItem] = useState<any>(null)

  // Forms
  const [itemForm, setItemForm] = useState({
    itemName: "",
    itemCode: "",
    category: "",
    warehouseId: "",
    unitPrice: "0"
  })

  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    location: ""
  })

  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: "0",
    type: "in", // "in" or "out"
    reason: ""
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line
  }, [user.companyId])

  async function loadData() {
    if (!user.companyId) return
    setIsLoading(true)
    try {
      const [invRes, whRes] = await Promise.all([
        getInventory(user.companyId),
        getWarehouses(user.companyId)
      ])

      if (invRes.success) setItems(invRes.data as any[])
      if (whRes.success) setWarehouses(whRes.data as any[])
    } catch (err) {
      toast.error(t('operation_failed' as any))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveItem = async () => {
    startTransition(async () => {
      let res
      if (editingItem) {
        res = await updateInventoryItem(editingItem.id, itemForm)
      } else {
        res = await createInventoryItem({ ...itemForm, companyId: user.companyId })
      }

      if (res.success) {
        toast.success(t('operation_successful' as any))
        setIsItemSheetOpen(false)
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm(t('confirm' as any))) return
    startTransition(async () => {
      const res = await deleteInventoryItem(id)
      if (res.success) {
        toast.success(t('operation_successful' as any))
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleAdjustStock = async () => {
    if (!adjustingItem) return
    startTransition(async () => {
      const res = await adjustStock(
        adjustingItem.id,
        parseInt(adjustmentForm.quantity),
        adjustmentForm.type as any
      )
      if (res.success) {
        toast.success(t('operation_successful' as any))
        setIsAdjustDialogOpen(false)
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleCreateWarehouse = async () => {
    startTransition(async () => {
      const res = await createWarehouse({ ...warehouseForm, companyId: user.companyId })
      if (res.success) {
        toast.success(t('operation_successful' as any))
        setIsWarehouseDialogOpen(false)
        loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalStockValue = items.reduce((acc, curr) => acc + (parseFloat(curr.unitPrice || '0') * curr.quantity), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-12 h-12 text-amber-500" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('inventory' as any)}</p>
            <h3 className="text-3xl font-light text-white mt-1">{items.length} {t('items' as any || 'Items')}</h3>
          </div>
        </div>

        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 text-emerald-500" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('total_value' as any || 'Stock Value')}</p>
            <h3 className="text-3xl font-light text-white mt-1">{`${t('currency_symbol')} ${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</h3>
          </div>
        </div>

        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <WarehouseIcon className="w-12 h-12 text-blue-500" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('warehouses' as any)}</p>
            <h3 className="text-3xl font-light text-white mt-1">{warehouses.length}</h3>
          </div>
        </div>

        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Low Stock</p>
            <h3 className="text-3xl font-light text-white mt-1">{items.filter(i => i.quantity < 10).length}</h3>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/50 p-4 border border-slate-800 backdrop-blur-xl mb-6">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="items" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">{t('items' as any || 'Inventory Items')}</TabsTrigger>
            <TabsTrigger value="warehouses" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">{t('warehouses' as any)}</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <DataExportModal
              model="inventory"
              title={t('inventory' as any)}
              companyId={user.companyId}
            />
            <div className="relative flex-1 md:w-64">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500", isRTL ? "right-3" : "left-3")} />
              <Input
                placeholder={t('search')}
                className={cn("bg-slate-900 border-slate-800 h-9 text-xs", isRTL ? "pr-9" : "pl-9")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {canManage && (
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => activeTab === "items" ? setIsItemSheetOpen(true) : setIsWarehouseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> {activeTab === "items" ? t('add') : t('new') + " " + t('warehouses')}
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="items">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-lg bg-slate-900/50 border border-slate-800 animate-pulse" />
              ))
            ) : filteredItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={item.id}
                className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 hover:border-amber-500/30 transition-all group relative"
              >
                <div className="absolute top-4 right-4 group-hover:opacity-100 opacity-0 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800 text-slate-300">
                      <DropdownMenuItem onClick={() => { setEditingItem(item); setItemForm({ itemName: item.itemName, itemCode: item.itemCode, category: item.category, warehouseId: item.warehouseId?.toString() || "", unitPrice: item.unitPrice || "0" }); setIsItemSheetOpen(true); }}>
                        <Edit className="h-4 w-4 mr-2" /> {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setAdjustingItem(item); setIsAdjustDialogOpen(true); }}>
                        <History className="h-4 w-4 mr-2" /> Stock Adjustment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-800" />
                      <DropdownMenuItem className="text-red-400" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Box className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-light text-lg">{item.itemName}</h4>
                    <p className="text-[10px] text-amber-500/70 font-mono tracking-widest uppercase">{item.itemCode}</p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800/50 pt-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter block">{t('stock' as any || 'Stock On Hand')}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={cn("text-2xl font-light", item.quantity < 10 ? "text-rose-500" : "text-white")}>{item.quantity}</span>
                      <span className="text-[10px] text-slate-500">units</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter block">{t('price')}</span>
                    <div className="mt-1">
                      <span className="text-2xl font-mono font-bold text-emerald-500">{t('currency_symbol')}{parseFloat(item.unitPrice || '0').toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                  <MapPin className="h-3 w-3" />
                  <span>{item.warehouse?.name || 'Unassigned Warehouse'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="warehouses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((wh) => (
              <div key={wh.id} className="bg-slate-950/50 border border-slate-800 p-6 hover:border-amber-500/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <WarehouseIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-light text-lg">{wh.name}</h4>
                    <p className="text-xs text-slate-500">{wh.location || 'Central Location'}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800/50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-tighter">{t('items' as any || 'Items')}</span>
                    <span className="text-white font-mono">{wh.items?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Sheets & Dialogs */}
      <Sheet open={isItemSheetOpen} onOpenChange={setIsItemSheetOpen}>
        <SheetContent className="bg-slate-950 border-slate-800 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white text-2xl font-light">{editingItem ? t('edit') : t('new')} {t('items' as any || 'Inventory Item')}</SheetTitle>
            <SheetDescription className="text-slate-400">Configure item details and warehouse stock.</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-slate-500">{t('name')}</Label>
              <Input className="bg-slate-900 border-slate-800" value={itemForm.itemName} onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">Code</Label>
                <Input className="bg-slate-900 border-slate-800 font-mono" value={itemForm.itemCode} onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">{t('price')}</Label>
                <Input type="number" className="bg-slate-900 border-slate-800" value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-slate-500">{t('warehouses' as any)}</Label>
              <Select value={itemForm.warehouseId} onValueChange={(v) => setItemForm({ ...itemForm, warehouseId: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-800">
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-white">
                  {warehouses.map(wh => <SelectItem key={wh.id} value={wh.id.toString()}>{wh.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSaveItem} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-light">Stock Adjustment: {adjustingItem?.itemName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">Type</Label>
                <Select value={adjustmentForm.type} onValueChange={(v) => setAdjustmentForm({ ...adjustmentForm, type: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-white">
                    <SelectItem value="in">Manual Add (Stock In)</SelectItem>
                    <SelectItem value="out">Manual Reduction (Stock Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">{t('quantity')}</Label>
                <Input type="number" className="bg-slate-900 border-slate-800" value={adjustmentForm.quantity} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-slate-400" onClick={() => setIsAdjustDialogOpen(false)}>{t('cancel')}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAdjustStock} disabled={isPending}>Apply Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
