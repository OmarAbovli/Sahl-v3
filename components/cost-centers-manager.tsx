"use client"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
    Building2,
    Plus,
    Edit3,
    Power,
    Search,
    Loader2,
    TrendingUp,
    FolderKanban
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
import { toast } from "sonner"
import { getCostCenters, createCostCenter, updateCostCenter, deleteCostCenter } from "@/actions/cost-centers"
import { useTranslation } from "@/hooks/use-translation"

interface CostCentersManagerProps {
    companyId: number
}

export function CostCentersManager({ companyId }: CostCentersManagerProps) {
    const { t } = useTranslation()
    const [costCenters, setCostCenters] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCenter, setEditingCenter] = useState<any>(null)

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: ""
    })

    useEffect(() => {
        fetchCostCenters()
    }, [companyId])

    async function fetchCostCenters() {
        setIsLoading(true)
        const res = await getCostCenters(companyId)
        if (res.success) {
            setCostCenters(res.data || [])
        } else {
            toast.error("Failed to load cost centers")
        }
        setIsLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            let res
            if (editingCenter) {
                res = await updateCostCenter(editingCenter.id, formData)
            } else {
                res = await createCostCenter({ ...formData, companyId })
            }

            if (res.success) {
                toast.success(editingCenter ? "Cost center updated" : "Cost center created")
                setIsDialogOpen(false)
                fetchCostCenters()
                resetForm()
            } else {
                toast.error(res.error || "Operation failed")
            }
        })
    }

    const handleEdit = (center: any) => {
        setEditingCenter(center)
        setFormData({
            code: center.code || "",
            name: center.name || "",
            description: center.description || ""
        })
        setIsDialogOpen(true)
    }

    const handleToggleActive = (center: any) => {
        startTransition(async () => {
            const res = await updateCostCenter(center.id, { isActive: !center.isActive })
            if (res.success) {
                toast.success(center.isActive ? "Cost center deactivated" : "Cost center activated")
                fetchCostCenters()
            } else {
                toast.error("Failed to update status")
            }
        })
    }

    const resetForm = () => {
        setFormData({ code: "", name: "", description: "" })
        setEditingCenter(null)
    }

    const filteredCenters = costCenters.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                        <FolderKanban className="h-8 w-8 text-amber-500" />
                        Cost Centers
                    </h2>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-2 font-bold">
                        Financial Segmentation & Performance Tracking
                    </p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-none h-11 px-8 shadow-xl shadow-amber-600/10 transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                    <Plus className="h-4 w-4 mr-2" /> New Cost Center
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <Input
                    placeholder="Search by code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-950 border-slate-800 text-white h-12 rounded-none"
                />
            </div>

            {/* Cost Centers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCenters.map((center, idx) => (
                    <motion.div
                        key={center.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <Card className={`bg-slate-900 border-slate-800 hover:border-amber-500/30 transition-all ${!center.isActive ? 'opacity-50' : ''}`}>
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-none bg-amber-500/10 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-white text-sm font-mono">{center.code}</CardTitle>
                                            <p className="text-slate-600 text-[9px] uppercase font-bold tracking-widest mt-0.5">
                                                {center.isActive ? 'Active' : 'Inactive'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="text-white font-light text-lg mb-2">{center.name}</h3>
                                    {center.description && (
                                        <p className="text-slate-500 text-xs">{center.description}</p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-slate-800">
                                    <Button
                                        onClick={() => handleEdit(center)}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-none text-[10px] uppercase tracking-widest font-bold"
                                    >
                                        <Edit3 className="h-3 w-3 mr-1" /> Edit
                                    </Button>
                                    <Button
                                        onClick={() => handleToggleActive(center)}
                                        variant="outline"
                                        size="sm"
                                        className={`border-slate-700 rounded-none text-[10px] uppercase tracking-widest font-bold ${center.isActive ? 'text-red-400 hover:bg-red-950' : 'text-green-400 hover:bg-green-950'}`}
                                    >
                                        <Power className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}

                {filteredCenters.length === 0 && (
                    <div className="col-span-full py-32 text-center border border-slate-800 bg-slate-950/20">
                        <Building2 className="h-16 w-16 mx-auto text-slate-800 mb-6 opacity-20" />
                        <p className="text-slate-600 italic text-sm">No cost centers found</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-xl p-0 overflow-hidden rounded-none shadow-3xl">
                    <div className="h-1 bg-amber-500 w-full shadow-lg shadow-amber-500/20"></div>
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-3xl font-light tracking-tight">
                            {editingCenter ? "Update Cost Center" : "New Cost Center"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Cost Center Code</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="CC-001"
                                    required
                                    className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none font-mono"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Sales Department"
                                    required
                                    className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional details about this cost center..."
                                className="bg-slate-900 border-slate-800 focus:border-amber-500/50 rounded-none min-h-[100px]"
                            />
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
                                {editingCenter ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
