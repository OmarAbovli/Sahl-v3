"use client"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
  Boxes,
  Plus,
  Edit3,
  TrendingDown,
  Calendar,
  DollarSign,
  Loader2,
  Calculator,
  Archive,
  PlayCircle,
  FileText,
  BarChart3
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  getFixedAssets,
  createFixedAsset,
  updateFixedAsset,
  runDepreciationBatch,
  getAssetDepreciationSchedule,
  disposeAsset
} from "@/actions/fixed-assets"
import { useTranslation } from "@/hooks/use-translation"
import { formatCurrency } from "@/lib/utils"

interface FixedAssetsManagementProps {
  companyId: number
  user?: any
  canManage?: boolean
  canView?: boolean
}

export function FixedAssetsManagement({ companyId, user, canManage, canView }: FixedAssetsManagementProps) {
  const { t } = useTranslation()
  const [assets, setAssets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [schedule, setSchedule] = useState<any>(null)

  const [formData, setFormData] = useState({
    assetCode: "",
    assetName: "",
    category: "",
    purchaseDate: "",
    purchaseCost: "",
    usefulLifeYears: "5",
    depreciationMethod: "straight_line",
    residualValue: "0"
  })

  useEffect(() => {
    fetchAssets()
  }, [companyId])

  async function fetchAssets() {
    setIsLoading(true)
    const res = await getFixedAssets(companyId)
    if (res.success) {
      setAssets(res.data || [])
    } else {
      toast.error("Failed to load fixed assets")
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        ...formData,
        companyId,
        purchaseCost: parseFloat(formData.purchaseCost),
        usefulLifeYears: parseInt(formData.usefulLifeYears),
        residualValue: parseFloat(formData.residualValue || "0"),
        depreciationMethod: formData.depreciationMethod as "straight_line" | "declining_balance"
      }

      const res = await createFixedAsset(data)

      if (res.success) {
        toast.success("Fixed asset created successfully")
        setIsDialogOpen(false)
        fetchAssets()
        resetForm()
      } else {
        toast.error(res.error || "Operation failed")
      }
    })
  }

  const handleRunDepreciation = () => {
    startTransition(async () => {
      const today = new Date().toISOString().split('T')[0]
      const res = await runDepreciationBatch(companyId, today)

      if (res.success) {
        toast.success(
          `Depreciation processed for ${res.data?.processedAssets} assets. Total: ${formatCurrency(res.data?.totalDepreciation || 0)}`
        )
        fetchAssets()
      } else {
        toast.error(res.error || "Failed to run depreciation")
      }
    })
  }

  const handleViewSchedule = async (asset: any) => {
    const res = await getAssetDepreciationSchedule(asset.id)
    if (res.success) {
      setSchedule(res.data)
      setShowSchedule(true)
    } else {
      toast.error("Failed to load schedule")
    }
  }

  const handleToggleActive = (asset: any) => {
    startTransition(async () => {
      const res = await updateFixedAsset(asset.id, { isActive: !asset.isActive })
      if (res.success) {
        toast.success(asset.isActive ? "Asset deactivated" : "Asset activated")
        fetchAssets()
      } else {
        toast.error("Failed to update asset")
      }
    })
  }

  const resetForm = () => {
    setFormData({
      assetCode: "",
      assetName: "",
      category: "",
      purchaseDate: "",
      purchaseCost: "",
      usefulLifeYears: "5",
      depreciationMethod: "straight_line",
      residualValue: "0"
    })
    setEditingAsset(null)
  }

  const totalBookValue = assets.reduce((sum, a) => sum + parseFloat(a.bookValue || "0"), 0)
  const totalAccumulatedDep = assets.reduce((sum, a) => sum + parseFloat(a.accumulatedDepreciation || "0"), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
            <Boxes className="h-8 w-8 text-amber-500" />
            Fixed Assets Management
          </h2>
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-2 font-bold">
            Professional Asset Lifecycle & Automated Depreciation
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleRunDepreciation}
            disabled={isPending}
            variant="outline"
            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-none h-11 px-6 uppercase tracking-widest text-[10px] font-bold"
          >
            <Calculator className="h-4 w-4 mr-2" /> Run Depreciation
          </Button>
          <Button
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-none h-11 px-8 shadow-xl shadow-amber-600/10 transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            <Plus className="h-4 w-4 mr-2" /> New Asset
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-bold">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-light text-white">{assets.length}</div>
              <Boxes className="h-8 w-8 text-slate-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-bold">Book Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-light text-emerald-400">{formatCurrency(totalBookValue)}</div>
              <DollarSign className="h-8 w-8 text-emerald-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-bold">Accumulated Depreciation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-light text-red-400">{formatCurrency(totalAccumulatedDep)}</div>
              <TrendingDown className="h-8 w-8 text-red-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Asset Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs uppercase font-bold text-slate-500 pb-3 tracking-widest">Code</th>
                  <th className="text-left text-xs uppercase font-bold text-slate-500 pb-3 tracking-widest">Asset Name</th>
                  <th className="text-left text-xs uppercase font-bold text-slate-500 pb-3 tracking-widest">Category</th>
                  <th className="text-right text-xs uppercase font-bold text-slate-500 pb-3 tracking-widest">Purchase Cost</th>
                  <th className="text-right text-xs uppercase font-bold text-slate-500 pb-3 tracking-widest">Book Value</th>
                  <th className="text-center text-xs uppercase font-bold text-slate-500 pb-3 tracking-widest">Method</th>
                  <th className="text-center text-xs uppercase font-bold text-slate-500 pb-3 tracking-widest">Status</th>
                  <th className="text-center text-xs uppercase font-bold text-slate-500 pb-3 tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, idx) => (
                  <motion.tr
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4">
                      <span className="font-mono text-sm text-white">{asset.assetCode}</span>
                    </td>
                    <td className="py-4">
                      <div>
                        <div className="text-white font-light">{asset.assetName}</div>
                        <div className="text-xs text-slate-500">{new Date(asset.purchaseDate).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-400 text-sm">{asset.category || 'N/A'}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-white font-mono">{formatCurrency(parseFloat(asset.purchaseCost || "0"))}</span>
                    </td>
                    <td className="py-4 text-right">
                      <div>
                        <div className="text-emerald-400 font-mono font-bold">{formatCurrency(parseFloat(asset.bookValue || "0"))}</div>
                        <div className="text-xs text-red-500">-{formatCurrency(parseFloat(asset.accumulatedDepreciation || "0"))}</div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-[9px] uppercase tracking-widest">
                        {asset.depreciationMethod === 'straight_line' ? 'SL' : 'DB'}
                      </Badge>
                    </td>
                    <td className="py-4 text-center">
                      <Badge
                        variant={asset.isActive ? "default" : "secondary"}
                        className={asset.isActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-slate-700 text-slate-400"}
                      >
                        {asset.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => handleViewSchedule(asset)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-amber-500 h-8 w-8 p-0"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleToggleActive(asset)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-500 h-8 w-8 p-0"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {assets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Boxes className="h-16 w-16 mx-auto text-slate-800 mb-4 opacity-20" />
                      <p className="text-slate-600 italic">No fixed assets registered</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Asset Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-2xl p-0 overflow-hidden rounded-none shadow-3xl">
          <div className="h-1 bg-amber-500 w-full shadow-lg shadow-amber-500/20"></div>
          <DialogHeader className="p-10 pb-4">
            <DialogTitle className="text-3xl font-light tracking-tight">
              Register New Fixed Asset
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Asset Code</Label>
                <Input
                  value={formData.assetCode}
                  onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                  placeholder="FA-001"
                  required
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none font-mono"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Asset Name</Label>
                <Input
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  placeholder="Industrial Equipment"
                  required
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Machinery, Vehicles, etc."
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Purchase Date</Label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Purchase Cost (EGP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchaseCost}
                  onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                  placeholder="100000.00"
                  required
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none font-mono"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Useful Life (Years)</Label>
                <Input
                  type="number"
                  value={formData.usefulLifeYears}
                  onChange={(e) => setFormData({ ...formData, usefulLifeYears: e.target.value })}
                  required
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Depreciation Method</Label>
                <Select
                  value={formData.depreciationMethod}
                  onValueChange={(val) => setFormData({ ...formData, depreciationMethod: val })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 h-12 rounded-none focus:ring-amber-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white rounded-none">
                    <SelectItem value="straight_line">Straight-Line</SelectItem>
                    <SelectItem value="declining_balance">Declining Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Residual Value (EGP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.residualValue}
                  onChange={(e) => setFormData({ ...formData, residualValue: e.target.value })}
                  placeholder="0.00"
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-6 flex border-t border-white/5 gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-500 uppercase font-black text-[10px] px-8 h-12 rounded-none hover:bg-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-white text-black hover:bg-amber-50 h-12 px-12 rounded-none uppercase tracking-[0.2em] text-[10px] font-bold shadow-2xl transition-all"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Register Asset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Depreciation Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-4xl p-0 overflow-hidden rounded-none shadow-3xl max-h-[80vh]">
          <div className="h-1 bg-amber-500 w-full shadow-lg shadow-amber-500/20"></div>
          <DialogHeader className="p-10 pb-4">
            <DialogTitle className="text-2xl font-light tracking-tight">
              Depreciation Schedule: {schedule?.asset?.name}
            </DialogTitle>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mt-2">
              {schedule?.asset?.code} | {schedule?.asset?.usefulLifeYears} Years Life
            </p>
          </DialogHeader>

          <div className="p-10 overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-950">
                <tr className="border-b border-slate-800">
                  <th className="text-left pb-3 text-[9px] uppercase font-bold text-slate-500 tracking-widest">Month</th>
                  <th className="text-right pb-3 text-[9px] uppercase font-bold text-slate-500 tracking-widest">Depreciation</th>
                  <th className="text-right pb-3 text-[9px] uppercase font-bold text-slate-500 tracking-widest">Accumulated</th>
                  <th className="text-right pb-3 text-[9px] uppercase font-bold text-slate-500 tracking-widest">Book Value</th>
                </tr>
              </thead>
              <tbody>
                {schedule?.schedule?.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-800/30">
                    <td className="py-2 text-slate-400">{row.month}</td>
                    <td className="py-2 text-right text-red-400 font-mono">{formatCurrency(row.depreciation)}</td>
                    <td className="py-2 text-right text-orange-400 font-mono">{formatCurrency(row.accumulatedDepreciation)}</td>
                    <td className="py-2 text-right text-emerald-400 font-mono font-bold">{formatCurrency(row.bookValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter className="p-10 pt-6 border-t border-slate-800">
            <Button
              onClick={() => setShowSchedule(false)}
              className="bg-slate-800 text-white hover:bg-slate-700 h-12 px-8 rounded-none uppercase tracking-widest text-[10px] font-bold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}