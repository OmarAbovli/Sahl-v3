"use client"

import { useState, useEffect, useTransition } from "react"
import {
    Users,
    Shield,
    ShieldCheck,
    Plus,
    Trash2,
    Check,
    X,
    Lock,
    Save,
    AlertCircle,
    Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
    getRoles,
    getAllPermissions,
    createRole,
    updateRolePermissions,
    deleteRole,
    seedBasePermissions
} from "@/actions/permissions"

interface RolesPermissionsManagerProps {
    companyId: number
}

export function RolesPermissionsManager({ companyId }: RolesPermissionsManagerProps) {
    const [roles, setRoles] = useState<any[]>([])
    const [permissions, setPermissions] = useState<any[]>([])
    const [selectedRole, setSelectedRole] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    const [newRoleName, setNewRoleName] = useState("")
    const [showAddRole, setShowAddRole] = useState(false)

    // Current permissions for selected role
    const [selectedRolePermissionIds, setSelectedRolePermissionIds] = useState<number[]>([])

    useEffect(() => {
        loadInitialData()
    }, [companyId])

    async function loadInitialData() {
        setLoading(true)

        // 1. Fetch permissions (seed if empty)
        let pRes = await getAllPermissions()
        if (pRes.success && pRes.data && pRes.data.length === 0) {
            await seedBasePermissions()
            pRes = await getAllPermissions()
        }

        if (pRes.success) setPermissions(pRes.data || [])

        // 2. Fetch roles
        const rRes = await getRoles(companyId)
        if (rRes.success) {
            setRoles(rRes.data || [])
            if (rRes.data && rRes.data.length > 0) {
                handleSelectRole(rRes.data[0])
            }
        }

        setLoading(false)
    }

    const handleSelectRole = (role: any) => {
        setSelectedRole(role)
        const pIds = role.rolePermissions?.map((rp: any) => rp.permissionId) || []
        setSelectedRolePermissionIds(pIds)
    }

    const handleTogglePermission = (pId: number) => {
        setSelectedRolePermissionIds(prev =>
            prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
        )
    }

    const handleGrantAll = () => {
        setSelectedRolePermissionIds(permissions.map(p => p.id))
    }

    const handleSavePermissions = () => {
        if (!selectedRole) return
        startTransition(async () => {
            const res = await updateRolePermissions(selectedRole.id, selectedRolePermissionIds)
            if (res.success) {
                toast.success("Permissions updated successfully")
                // Refresh roles to sync data
                const rRes = await getRoles(companyId)
                if (rRes.success) setRoles(rRes.data || [])
            } else {
                toast.error(res.error || "Failed to update permissions")
            }
        })
    }

    const handleCreateRole = async () => {
        if (!newRoleName) return
        const res = await createRole(companyId, newRoleName, "Custom role")
        if (res.success) {
            toast.success("Role created")
            setNewRoleName("")
            setShowAddRole(false)
            loadInitialData()
        } else {
            toast.error(res.error || "Failed to create role")
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Initializing Security Matrix...</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Roles Sidebar */}
            <div className="md:col-span-4 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-light text-white flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-500" /> Roles
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800"
                        onClick={() => setShowAddRole(!showAddRole)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <AnimatePresence>
                    {showAddRole && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="bg-slate-950 border-amber-500/30 rounded-none mb-4">
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500">New Role Name</Label>
                                        <Input
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                            placeholder="e.g. Finance Manager"
                                            className="bg-slate-900 border-slate-800 h-10 rounded-none text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleCreateRole} size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 h-8 text-[10px] font-bold uppercase tracking-widest">
                                            Create
                                        </Button>
                                        <Button onClick={() => setShowAddRole(false)} variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-2">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => handleSelectRole(role)}
                            className={cn(
                                "w-full text-left p-4 flex justify-between items-center transition-all duration-300 border-l-2",
                                selectedRole?.id === role.id
                                    ? "bg-slate-900 border-amber-500 text-white"
                                    : "bg-slate-900/30 border-transparent text-slate-500 hover:bg-slate-900/50 hover:text-slate-300"
                            )}
                        >
                            <div>
                                <p className="text-sm font-medium">{role.name}</p>
                                <p className="text-[10px] text-slate-600 font-mono mt-1">{role.rolePermissions?.length || 0} Permissions</p>
                            </div>
                            {selectedRole?.id === role.id && <Lock className="h-3 w-3 text-amber-500" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Permissions Matrix */}
            <div className="md:col-span-8">
                {selectedRole ? (
                    <Card className="bg-slate-950/40 border-slate-800 rounded-none h-full flex flex-col">
                        <CardHeader className="p-8 border-b border-white/5 flex flex-row justify-between items-center bg-slate-900/50">
                            <div>
                                <CardTitle className="text-2xl font-light text-white">
                                    <span className="text-amber-500 font-bold mr-2">{selectedRole.name}</span> Authority Matrix
                                </CardTitle>
                                <CardDescription className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">
                                    Configure access control levels for this professional role
                                </CardDescription>
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={handleGrantAll}
                                    className="border-slate-800 text-slate-300 hover:bg-slate-900 rounded-none px-6 font-bold uppercase tracking-widest text-[11px] h-11"
                                >
                                    <ShieldCheck className="h-4 w-4 mr-2 text-emerald-500" /> Grant All
                                </Button>
                                <Button
                                    onClick={handleSavePermissions}
                                    disabled={isPending}
                                    className="bg-white text-black hover:bg-amber-50 rounded-none px-8 font-bold uppercase tracking-widest text-[11px] h-11"
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Commit Changes</>}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10 overflow-y-auto max-h-[600px]">
                            {/* Grouping permissions by module prefix if possible */}
                            {["sales", "purchasing", "inventory", "ledger", "reports", "settings", "users", "crm", "hr", "payroll", "attendance", "leave", "assets", "admin"].map(group => {
                                const groupPermissions = permissions.filter(p => p.name.includes(group))
                                if (groupPermissions.length === 0) return null

                                return (
                                    <div key={group} className="space-y-6">
                                        <h4 className="text-xs uppercase font-black tracking-[0.3em] text-slate-700 flex items-center gap-3">
                                            <Shield className="h-3 w-3" /> {group} Module
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {groupPermissions.map(p => (
                                                <div
                                                    key={p.id}
                                                    className={cn(
                                                        "group flex items-center justify-between p-4 border transition-all duration-300",
                                                        selectedRolePermissionIds.includes(p.id)
                                                            ? "bg-slate-900/80 border-amber-500/20 shadow-xl shadow-amber-500/5"
                                                            : "bg-transparent border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                                                    )}
                                                    onClick={() => handleTogglePermission(p.id)}
                                                    role="button"
                                                >
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 group-hover:text-white transition-colors">
                                                            {p.name.replace(/_/g, ' ')}
                                                        </Label>
                                                        <p className="text-[10px] text-slate-500 block max-w-[200px] leading-tight italic">
                                                            {p.description}
                                                        </p>
                                                    </div>
                                                    <Checkbox
                                                        id={`p-${p.id}`}
                                                        checked={selectedRolePermissionIds.includes(p.id)}
                                                        onCheckedChange={() => handleTogglePermission(p.id)}
                                                        className="border-slate-800 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="bg-white/5" />
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-800 text-center space-y-4">
                        <Lock className="h-12 w-12 text-slate-800" />
                        <p className="text-slate-500 text-sm italic font-light">Select a role template to configure the authority matrix.</p>
                    </div>
                )}
            </div>
        </div>
    )
}