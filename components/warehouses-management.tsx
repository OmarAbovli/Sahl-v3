"use client"
import { useTranslation } from "@/hooks/use-translation"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Search, MapPin, Package, ArrowRightLeft, ShoppingCart, Eye, CreditCard } from "lucide-react"
import type { User, Warehouse, InventoryItem } from "@/lib/database"

interface WarehousesManagementProps {
  user: User
  canManage: boolean
}

interface WarehouseWithInventory extends Warehouse {
  inventory_count: number
  total_value: number
}

interface TransferData {
  item_id: string
  from_warehouse_id: string
  to_warehouse_id: string
  quantity: string
  notes: string
}

interface SaleData {
  warehouse_id: string
  client_name: string
  items: Array<{
    item_id: number
    quantity: number
    unit_price: number
  }>
  notes: string
}

interface DebtSaleData {
  warehouse_id: string
  debtor_name: string
  debtor_type: string
  debtor_contact: string
  items: Array<{
    item_id: number
    quantity: number
    unit_price: number
  }>
  due_date: string
  notes: string
}

export function WarehousesManagement({ user, canManage }: WarehousesManagementProps) {
  const { t, isRTL } = useTranslation()
  const [warehouses, setWarehouses] = useState<WarehouseWithInventory[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredWarehouses, setFilteredWarehouses] = useState<WarehouseWithInventory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("warehouses")

  // Dialog states
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false)
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isDebtSaleDialogOpen, setIsDebtSaleDialogOpen] = useState(false)
  const [isViewInventoryDialogOpen, setIsViewInventoryDialogOpen] = useState(false)

  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseWithInventory | null>(null)
  const [warehouseInventory, setWarehouseInventory] = useState<InventoryItem[]>([])

  // Form states
  const [warehouseFormData, setWarehouseFormData] = useState({
    name: "",
    location: "",
  })

  const [inventoryFormData, setInventoryFormData] = useState({
    warehouse_id: "",
    item_name: "",
    item_code: "",
    quantity: "",
    unit_price: "",
    category: "",
  })

  const [transferFormData, setTransferFormData] = useState<TransferData>({
    item_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    quantity: "",
    notes: "",
  })

  const [saleFormData, setSaleFormData] = useState<SaleData>({
    warehouse_id: "",
    client_name: "",
    items: [],
    notes: "",
  })

  const [debtSaleFormData, setDebtSaleFormData] = useState<DebtSaleData>({
    warehouse_id: "",
    debtor_name: "",
    debtor_type: "individual",
    debtor_contact: "",
    items: [],
    due_date: "",
    notes: "",
  })

  const [saleItems, setSaleItems] = useState<
    Array<{
      item_id: string
      quantity: string
      unit_price: string
    }>
  >([{ item_id: "", quantity: "", unit_price: "" }])

  const [debtSaleItems, setDebtSaleItems] = useState<
    Array<{
      item_id: string
      quantity: string
      unit_price: string
    }>
  >([{ item_id: "", quantity: "", unit_price: "" }])

  const [error, setError] = useState("")

  // Get available items for a specific warehouse
  const getAvailableItemsForWarehouse = (warehouseId: string) => {
    if (!warehouseId || !inventory.length) {
      return []
    }

    const filtered = inventory.filter((item) => {
      return item.warehouse_id === Number.parseInt(warehouseId) && item.quantity > 0
    })

    return filtered
  }

  // Get item details by ID
  const getItemDetails = (itemId: string) => {
    if (!itemId || !inventory.length) return null
    return inventory.find((item) => item.id === Number.parseInt(itemId))
  }

  // Calculate sale summary in real-time
  const saleSummary = useMemo(() => {
    const validItems = saleItems.filter((item) => {
      const isValid =
        item.item_id &&
        item.quantity &&
        item.unit_price &&
        item.item_id.trim() !== "" &&
        item.quantity.trim() !== "" &&
        item.unit_price.trim() !== "" &&
        Number.parseInt(item.quantity) > 0 &&
        Number.parseFloat(item.unit_price) > 0

      return isValid
    })

    const items = validItems.map((item) => {
      const itemDetails = getItemDetails(item.item_id)
      const quantity = Number.parseFloat(item.quantity)
      const unitPrice = Number.parseFloat(item.unit_price)
      const total = quantity * unitPrice

      return {
        name: itemDetails?.item_name || "Unknown Item",
        quantity: item.quantity,
        total,
      }
    })

    const grandTotal = items.reduce((sum, item) => sum + item.total, 0)

    return { items, grandTotal }
  }, [saleItems, inventory])

  // Calculate debt sale summary in real-time
  const debtSaleSummary = useMemo(() => {
    const validItems = debtSaleItems.filter((item) => {
      const isValid =
        item.item_id &&
        item.quantity &&
        item.unit_price &&
        item.item_id.trim() !== "" &&
        item.quantity.trim() !== "" &&
        item.unit_price.trim() !== "" &&
        Number.parseInt(item.quantity) > 0 &&
        Number.parseFloat(item.unit_price) > 0

      return isValid
    })

    const items = validItems.map((item) => {
      const itemDetails = getItemDetails(item.item_id)
      const quantity = Number.parseFloat(item.quantity)
      const unitPrice = Number.parseFloat(item.unit_price)
      const total = quantity * unitPrice

      return {
        name: itemDetails?.item_name || "Unknown Item",
        quantity: item.quantity,
        total,
      }
    })

    const grandTotal = items.reduce((sum, item) => sum + item.total, 0)

    return { items, grandTotal }
  }, [debtSaleItems, inventory])

  useEffect(() => {
    fetchWarehouses()
    fetchInventory()
  }, [])

  useEffect(() => {
    const filtered = warehouses.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (warehouse.location && warehouse.location.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredWarehouses(filtered)
  }, [warehouses, searchTerm])

  const fetchWarehouses = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/employee/warehouses-enhanced")
      if (response.ok) {
        const data = await response.json()
        setWarehouses(data.warehouses || [])
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/employee/inventory")
      if (response.ok) {
        const data = await response.json()
        setInventory(data.inventory || [])
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
    }
  }

  const fetchWarehouseInventory = async (warehouseId: number) => {
    try {
      const response = await fetch(`/api/employee/warehouses/${warehouseId}/inventory`)
      if (response.ok) {
        const data = await response.json()
        setWarehouseInventory(data.inventory || [])
      }
    } catch (error) {
      console.error("Error fetching warehouse inventory:", error)
    }
  }

  // Warehouse CRUD operations
  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const url = editingWarehouse ? `/api/employee/warehouses/${editingWarehouse.id}` : "/api/employee/warehouses"
      const method = editingWarehouse ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(warehouseFormData),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchWarehouses()
        setIsWarehouseDialogOpen(false)
        setEditingWarehouse(null)
        setWarehouseFormData({ name: "", location: "" })
      } else {
        setError(data.error || "Failed to save warehouse")
      }
    } catch (error) {
      setError("An error occurred while saving the warehouse")
    } finally {
      setIsLoading(false)
    }
  }

  // Inventory operations
  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/employee/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inventoryFormData,
          quantity: Number.parseInt(inventoryFormData.quantity) || 0,
          unit_price: Number.parseFloat(inventoryFormData.unit_price) || 0,
          warehouse_id: Number.parseInt(inventoryFormData.warehouse_id),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchWarehouses()
        await fetchInventory()
        setIsInventoryDialogOpen(false)
        setInventoryFormData({
          warehouse_id: "",
          item_name: "",
          item_code: "",
          quantity: "",
          unit_price: "",
          category: "",
        })
      } else {
        setError(data.error || "Failed to add inventory item")
      }
    } catch (error) {
      setError("An error occurred while adding the inventory item")
    } finally {
      setIsLoading(false)
    }
  }

  // Transfer operations
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/employee/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transferFormData,
          item_id: Number.parseInt(transferFormData.item_id),
          from_warehouse_id: Number.parseInt(transferFormData.from_warehouse_id),
          to_warehouse_id: Number.parseInt(transferFormData.to_warehouse_id),
          quantity: Number.parseInt(transferFormData.quantity),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchWarehouses()
        await fetchInventory()
        setIsTransferDialogOpen(false)
        setTransferFormData({
          item_id: "",
          from_warehouse_id: "",
          to_warehouse_id: "",
          quantity: "",
          notes: "",
        })
      } else {
        setError(data.error || "Failed to transfer inventory")
      }
    } catch (error) {
      setError("An error occurred during the transfer")
    } finally {
      setIsLoading(false)
    }
  }

  // Sale operations
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate that we have at least one valid item
      const validSaleItems = saleItems.filter((item) => {
        return (
          item.item_id &&
          item.quantity &&
          item.unit_price &&
          item.item_id.trim() !== "" &&
          item.quantity.trim() !== "" &&
          item.unit_price.trim() !== "" &&
          Number.parseInt(item.quantity) > 0 &&
          Number.parseFloat(item.unit_price) > 0
        )
      })

      if (validSaleItems.length === 0) {
        setError("Please add at least one valid item to the sale")
        setIsLoading(false)
        return
      }

      const items = validSaleItems.map((item) => ({
        item_id: Number.parseInt(item.item_id),
        quantity: Number.parseInt(item.quantity),
        unit_price: Number.parseFloat(item.unit_price),
      }))

      const response = await fetch("/api/employee/inventory/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: Number.parseInt(saleFormData.warehouse_id),
          client_name: saleFormData.client_name,
          items,
          notes: saleFormData.notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchWarehouses()
        await fetchInventory()
        setIsSaleDialogOpen(false)
        setSaleFormData({
          warehouse_id: "",
          client_name: "",
          items: [],
          notes: "",
        })
        setSaleItems([{ item_id: "", quantity: "", unit_price: "" }])

        // Show success message with invoice number
        alert(`Sale completed successfully! Invoice #${data.invoice.invoice_number} created.`)
      } else {
        setError(data.error || "Failed to complete sale")
      }
    } catch (error) {
      setError("An error occurred during the sale")
    } finally {
      setIsLoading(false)
    }
  }

  // Debt sale operations
  const handleDebtSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate that we have at least one valid item
      const validDebtSaleItems = debtSaleItems.filter((item) => {
        return (
          item.item_id &&
          item.quantity &&
          item.unit_price &&
          item.item_id.trim() !== "" &&
          item.quantity.trim() !== "" &&
          item.unit_price.trim() !== "" &&
          Number.parseInt(item.quantity) > 0 &&
          Number.parseFloat(item.unit_price) > 0
        )
      })

      if (validDebtSaleItems.length === 0) {
        setError("Please add at least one valid item to the debt sale")
        setIsLoading(false)
        return
      }

      const items = validDebtSaleItems.map((item) => ({
        item_id: Number.parseInt(item.item_id),
        quantity: Number.parseInt(item.quantity),
        unit_price: Number.parseFloat(item.unit_price),
      }))

      const response = await fetch("/api/employee/inventory/debt-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: Number.parseInt(debtSaleFormData.warehouse_id),
          debtor_name: debtSaleFormData.debtor_name,
          debtor_type: debtSaleFormData.debtor_type,
          debtor_contact: debtSaleFormData.debtor_contact,
          items,
          due_date: debtSaleFormData.due_date || null,
          notes: debtSaleFormData.notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchWarehouses()
        await fetchInventory()
        setIsDebtSaleDialogOpen(false)
        setDebtSaleFormData({
          warehouse_id: "",
          debtor_name: "",
          debtor_type: "individual",
          debtor_contact: "",
          items: [],
          due_date: "",
          notes: "",
        })
        setDebtSaleItems([{ item_id: "", quantity: "", unit_price: "" }])

        // Show success message with invoice number
        alert(
          `Debt sale completed successfully! Invoice #${data.invoice.invoice_number} created. Debt ID: ${data.debt.id}`,
        )
      } else {
        setError(data.error || "Failed to complete debt sale")
      }
    } catch (error) {
      setError("An error occurred during the debt sale")
    } finally {
      setIsLoading(false)
    }
  }

  const addSaleItem = () => {
    setSaleItems([...saleItems, { item_id: "", quantity: "", unit_price: "" }])
  }

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const updateSaleItem = (index: number, field: string, value: string) => {
    const newSaleItems = [...saleItems]
    newSaleItems[index] = { ...newSaleItems[index], [field]: value }
    setSaleItems(newSaleItems)
  }

  const addDebtSaleItem = () => {
    setDebtSaleItems([...debtSaleItems, { item_id: "", quantity: "", unit_price: "" }])
  }

  const removeDebtSaleItem = (index: number) => {
    setDebtSaleItems(debtSaleItems.filter((_, i) => i !== index))
  }

  const updateDebtSaleItem = (index: number, field: string, value: string) => {
    const newDebtSaleItems = [...debtSaleItems]
    newDebtSaleItems[index] = { ...newDebtSaleItems[index], [field]: value }
    setDebtSaleItems(newDebtSaleItems)
  }

  const viewWarehouseInventory = async (warehouse: WarehouseWithInventory) => {
    setSelectedWarehouse(warehouse)
    await fetchWarehouseInventory(warehouse.id)
    setIsViewInventoryDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Warehouses Management</CardTitle>
              <CardDescription>Manage warehouses, inventory, transfers, and sales</CardDescription>
            </div>
            <div className="flex gap-2">
              {canManage && (
                <>
                  <Button onClick={() => setIsTransferDialogOpen(true)} variant="outline">
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer
                  </Button>
                  <Button onClick={() => setIsSaleDialogOpen(true)} variant="outline">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Cash Sale
                  </Button>
                  <Button onClick={() => setIsDebtSaleDialogOpen(true)} variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Credit Sale
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
              <TabsTrigger value="inventory">All Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="warehouses" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search warehouses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsInventoryDialogOpen(true)} variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingWarehouse(null)
                        setWarehouseFormData({ name: "", location: "" })
                        setIsWarehouseDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Warehouse
                    </Button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading warehouses...</div>
              ) : filteredWarehouses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No warehouses found matching your search." : "No warehouses found."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWarehouses.map((warehouse) => (
                    <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {warehouse.location || "No location specified"}
                            </CardDescription>
                          </div>
                          <Badge variant={warehouse.is_active ? "default" : "secondary"}>
                            {warehouse.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Items:</span>
                            <span className="font-medium">{warehouse.inventory_count}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Value:</span>
                            <span className="font-medium">{t('currency_symbol')}{Number(warehouse.total_value || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewWarehouseInventory(warehouse)}
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Items
                            </Button>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingWarehouse(warehouse)
                                  setWarehouseFormData({
                                    name: warehouse.name,
                                    location: warehouse.location || "",
                                  })
                                  setIsWarehouseDialogOpen(true)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              {inventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No inventory items found.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item) => {
                        const warehouse = warehouses.find((w) => w.id === item.warehouse_id)
                        const totalValue = (item.unit_price || 0) * item.quantity

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.item_name}</TableCell>
                            <TableCell className="font-mono">{item.item_code || "N/A"}</TableCell>
                            <TableCell>{warehouse?.name || "Unknown"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.quantity === 0 ? "destructive" : item.quantity < 10 ? "secondary" : "default"
                                }
                              >
                                {item.quantity}
                              </Badge>
                            </TableCell>
                            <TableCell>{t('currency_symbol')}{Number(item.unit_price ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="font-medium">{t('currency_symbol')}{totalValue.toFixed(2)}</TableCell>
                            <TableCell>{item.category || "N/A"}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Warehouse Dialog */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
            <DialogDescription>
              {editingWarehouse ? "Update warehouse information" : "Enter the details for the new warehouse"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWarehouseSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input
                  id="name"
                  value={warehouseFormData.name}
                  onChange={(e) => setWarehouseFormData({ ...warehouseFormData, name: e.target.value })}
                  placeholder="e.g., Main Warehouse, Storage Unit A"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Textarea
                  id="location"
                  value={warehouseFormData.location}
                  onChange={(e) => setWarehouseFormData({ ...warehouseFormData, location: e.target.value })}
                  placeholder="Enter the full address or location details"
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsWarehouseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : editingWarehouse ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Inventory Dialog */}
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Product to Warehouse</DialogTitle>
            <DialogDescription>Add a new product to one of your warehouses</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInventorySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="warehouse_id">Warehouse</Label>
                <Select
                  value={inventoryFormData.warehouse_id}
                  onValueChange={(value) => setInventoryFormData({ ...inventoryFormData, warehouse_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="item_name">Product Name</Label>
                <Input
                  id="item_name"
                  value={inventoryFormData.item_name}
                  onChange={(e) => setInventoryFormData({ ...inventoryFormData, item_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="item_code">Product Code</Label>
                <Input
                  id="item_code"
                  value={inventoryFormData.item_code}
                  onChange={(e) => setInventoryFormData({ ...inventoryFormData, item_code: e.target.value })}
                  placeholder="SKU or product code"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={inventoryFormData.category}
                  onChange={(e) => setInventoryFormData({ ...inventoryFormData, category: e.target.value })}
                  placeholder="e.g., Electronics, Office Supplies"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={inventoryFormData.quantity}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={inventoryFormData.unit_price}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, unit_price: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInventoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Products</DialogTitle>
            <DialogDescription>Transfer products between warehouses</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTransferSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="from_warehouse">From Warehouse</Label>
                <Select
                  value={transferFormData.from_warehouse_id}
                  onValueChange={(value) =>
                    setTransferFormData({ ...transferFormData, from_warehouse_id: value, item_id: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="to_warehouse">To Warehouse</Label>
                <Select
                  value={transferFormData.to_warehouse_id}
                  onValueChange={(value) => setTransferFormData({ ...transferFormData, to_warehouse_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((w) => w.id.toString() !== transferFormData.from_warehouse_id)
                      .map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="item">Product</Label>
                <Select
                  value={transferFormData.item_id}
                  onValueChange={(value) => setTransferFormData({ ...transferFormData, item_id: value })}
                  disabled={!transferFormData.from_warehouse_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product to transfer" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableItemsForWarehouse(transferFormData.from_warehouse_id).map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.item_name} (Available: {item.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="transfer_quantity">Quantity to Transfer</Label>
                {(() => {
                  const available = getItemDetails(transferFormData.item_id)?.quantity
                  return (
                    <Input
                      id="transfer_quantity"
                      type="number"
                      min={1}
                      {...(available ? { max: available } : {})}
                      value={transferFormData.quantity}
                      onChange={(e) => setTransferFormData({ ...transferFormData, quantity: e.target.value })}
                      required
                    />
                  )
                })()}
                {transferFormData.item_id && (
                  <p className="text-xs text-muted-foreground">
                    Available: {getItemDetails(transferFormData.item_id)?.quantity || 0}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="transfer_notes">Notes (Optional)</Label>
                <Textarea
                  id="transfer_notes"
                  value={transferFormData.notes}
                  onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                  placeholder="Reason for transfer or additional notes"
                  rows={2}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Transferring..." : "Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cash Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cash Sale</DialogTitle>
            <DialogDescription>Create a cash sale and generate an invoice</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="sale_warehouse">Warehouse</Label>
                <Select
                  value={saleFormData.warehouse_id}
                  onValueChange={(value) => {
                    setSaleFormData({ ...saleFormData, warehouse_id: value })
                    // Reset sale items when warehouse changes
                    setSaleItems([{ item_id: "", quantity: "", unit_price: "" }])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={saleFormData.client_name}
                  onChange={(e) => setSaleFormData({ ...saleFormData, client_name: e.target.value })}
                  placeholder="Customer or company name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Sale Items</Label>
                <div className="space-y-3">
                  {saleItems.map((item, index) => {
                    const availableItems = getAvailableItemsForWarehouse(saleFormData.warehouse_id)
                    const selectedItem = getItemDetails(item.item_id)

                    return (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Select
                            key={`${index}-${saleFormData.warehouse_id}`}
                            value={item.item_id}
                            onValueChange={(value) => {
                              // Create new array with updated item
                              const newSaleItems = [...saleItems]
                              newSaleItems[index] = { ...newSaleItems[index], item_id: value }
                              setSaleItems(newSaleItems)

                              // Auto-fill unit price if available
                              const itemDetails = getItemDetails(value)
                              if (itemDetails && itemDetails.unit_price) {
                                newSaleItems[index] = {
                                  ...newSaleItems[index],
                                  unit_price: Number(itemDetails.unit_price).toString(),
                                }
                                setSaleItems(newSaleItems)
                              }
                            }}
                            disabled={!saleFormData.warehouse_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableItems.length === 0 ? (
                                <SelectItem value="no-items" disabled>
                                  No products available
                                </SelectItem>
                              ) : (
                                availableItems.map((inventoryItem) => (
                                  <SelectItem key={inventoryItem.id} value={inventoryItem.id.toString()}>
                                    {inventoryItem.item_name} (Stock: {inventoryItem.quantity})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            {...(selectedItem?.quantity ? { max: selectedItem.quantity } : {})}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateSaleItem(index, "quantity", e.target.value)}
                          />
                          {selectedItem && (
                            <p className="text-xs text-muted-foreground mt-1">Available: {selectedItem.quantity}</p>
                          )}
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => updateSaleItem(index, "unit_price", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          {saleItems.length > 1 && (
                            <Button type="button" variant="outline" size="sm" onClick={() => removeSaleItem(index)}>
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <Button type="button" variant="outline" onClick={addSaleItem} className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sale_notes">Notes (Optional)</Label>
                <Textarea
                  id="sale_notes"
                  value={saleFormData.notes}
                  onChange={(e) => setSaleFormData({ ...saleFormData, notes: e.target.value })}
                  placeholder="Additional notes for the sale"
                  rows={2}
                />
              </div>

              {/* Sale Summary */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Sale Summary</h4>
                <div className="space-y-1 text-sm">
                  {saleSummary.items.length > 0 ? (
                    <>
                      {saleSummary.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>
                            {item.name} x {item.quantity}
                          </span>
                          <span>{t('currency_symbol')}{item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 font-medium flex justify-between">
                        <span>Total:</span>
                        <span>{t('currency_symbol')}{saleSummary.grandTotal.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No items added yet</p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSaleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || saleSummary.items.length === 0}>
                {isLoading ? "Processing..." : "Complete Sale"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credit/Debt Sale Dialog */}
      <Dialog open={isDebtSaleDialogOpen} onOpenChange={setIsDebtSaleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Credit Sale</DialogTitle>
            <DialogDescription>Create a credit sale and track debt</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDebtSaleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="debt_sale_warehouse">Warehouse</Label>
                <Select
                  value={debtSaleFormData.warehouse_id}
                  onValueChange={(value) => {
                    setDebtSaleFormData({ ...debtSaleFormData, warehouse_id: value })
                    // Reset debt sale items when warehouse changes
                    setDebtSaleItems([{ item_id: "", quantity: "", unit_price: "" }])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="debtor_name">Debtor Name</Label>
                  <Input
                    id="debtor_name"
                    value={debtSaleFormData.debtor_name}
                    onChange={(e) => setDebtSaleFormData({ ...debtSaleFormData, debtor_name: e.target.value })}
                    placeholder="Customer or company name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="debtor_type">Debtor Type</Label>
                  <Select
                    value={debtSaleFormData.debtor_type}
                    onValueChange={(value) => setDebtSaleFormData({ ...debtSaleFormData, debtor_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="debtor_contact">Contact Information</Label>
                <Input
                  id="debtor_contact"
                  value={debtSaleFormData.debtor_contact}
                  onChange={(e) => setDebtSaleFormData({ ...debtSaleFormData, debtor_contact: e.target.value })}
                  placeholder="Phone, email, or address"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={debtSaleFormData.due_date}
                  onChange={(e) => setDebtSaleFormData({ ...debtSaleFormData, due_date: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Sale Items</Label>
                <div className="space-y-3">
                  {debtSaleItems.map((item, index) => {
                    const availableItems = getAvailableItemsForWarehouse(debtSaleFormData.warehouse_id)
                    const selectedItem = getItemDetails(item.item_id)

                    return (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Select
                            key={`debt-${index}-${debtSaleFormData.warehouse_id}`}
                            value={item.item_id}
                            onValueChange={(value) => {
                              // Create new array with updated item
                              const newDebtSaleItems = [...debtSaleItems]
                              newDebtSaleItems[index] = { ...newDebtSaleItems[index], item_id: value }
                              setDebtSaleItems(newDebtSaleItems)

                              // Auto-fill unit price if available
                              const itemDetails = getItemDetails(value)
                              if (itemDetails && itemDetails.unit_price) {
                                newDebtSaleItems[index] = {
                                  ...newDebtSaleItems[index],
                                  unit_price: Number(itemDetails.unit_price).toString(),
                                }
                                setDebtSaleItems(newDebtSaleItems)
                              }
                            }}
                            disabled={!debtSaleFormData.warehouse_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableItems.length === 0 ? (
                                <SelectItem value="no-items" disabled>
                                  No products available
                                </SelectItem>
                              ) : (
                                availableItems.map((inventoryItem) => (
                                  <SelectItem key={inventoryItem.id} value={inventoryItem.id.toString()}>
                                    {inventoryItem.item_name} (Stock: {inventoryItem.quantity})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            {...(selectedItem?.quantity ? { max: selectedItem.quantity } : {})}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateDebtSaleItem(index, "quantity", e.target.value)}
                          />
                          {selectedItem && (
                            <p className="text-xs text-muted-foreground mt-1">Available: {selectedItem.quantity}</p>
                          )}
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => updateDebtSaleItem(index, "unit_price", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          {debtSaleItems.length > 1 && (
                            <Button type="button" variant="outline" size="sm" onClick={() => removeDebtSaleItem(index)}>
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <Button type="button" variant="outline" onClick={addDebtSaleItem} className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="debt_sale_notes">Notes (Optional)</Label>
                <Textarea
                  id="debt_sale_notes"
                  value={debtSaleFormData.notes}
                  onChange={(e) => setDebtSaleFormData({ ...debtSaleFormData, notes: e.target.value })}
                  placeholder="Additional notes for the credit sale"
                  rows={2}
                />
              </div>

              {/* Debt Sale Summary */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Credit Sale Summary</h4>
                <div className="space-y-1 text-sm">
                  {debtSaleSummary.items.length > 0 ? (
                    <>
                      {debtSaleSummary.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>
                            {item.name} x {item.quantity}
                          </span>
                          <span>{t('currency_symbol')}{item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 font-medium flex justify-between">
                        <span>Total Debt:</span>
                        <span className="text-orange-600">{t('currency_symbol')}{debtSaleSummary.grandTotal.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No items added yet</p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDebtSaleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || debtSaleSummary.items.length === 0}>
                {isLoading ? "Processing..." : "Create Credit Sale"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Warehouse Inventory Dialog */}
      <Dialog open={isViewInventoryDialogOpen} onOpenChange={setIsViewInventoryDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedWarehouse?.name} - Inventory</DialogTitle>
            <DialogDescription>Products currently stored in this warehouse</DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            {warehouseInventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No products in this warehouse</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouseInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="font-mono">{item.item_code || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.quantity === 0 ? "destructive" : item.quantity < 10 ? "secondary" : "default"}
                        >
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>{t('currency_symbol')}{Number(item.unit_price ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">
                        {t('currency_symbol')}{((item.unit_price || 0) * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsViewInventoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
