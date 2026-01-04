"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MoreVertical, Shield, UserX, UserCheck, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toggleUserStatus } from "@/actions/employees"
import { toast } from "sonner" // Assuming sonner is available or we'll use standard alert

interface Employee {
    id: number
    userId: number
    user: {
        uniqueKey: string
        isActive: boolean
        lastLogin: string | null
    }
    firstName: string
    lastName: string
    position: string
    department: string
}

export function EmployeesTable({ data }: { data: Employee[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isUpdating, setIsUpdating] = useState<number | null>(null)

    const filteredData = data.filter(emp =>
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.user.uniqueKey.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        setIsUpdating(userId)
        const result = await toggleUserStatus(userId, currentStatus)
        if (result.success) {
            // Toast success
        }
        setIsUpdating(null)
    }

    return (
        <div className="space-y-6">
            {/* Table Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div className="relative w-96 group">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search employees by name, role or ID..."
                        className="w-full bg-transparent border-none text-sm text-white placeholder:text-slate-600 focus:outline-none pl-6"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">
                        TOTAL: <span className="text-white">{filteredData.length.toString().padStart(3, '0')}</span>
                    </span>
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid gap-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold select-none">
                    <div className="col-span-3">Employee Name</div>
                    <div className="col-span-2">Position</div>
                    <div className="col-span-2">Access Key</div>
                    <div className="col-span-2">Last Login</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* Rows */}
                {filteredData.map((emp) => (
                    <motion.div
                        key={emp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-12 gap-4 px-4 py-4 items-center bg-slate-900/50 border border-slate-800/50 hover:border-amber-500/30 hover:bg-slate-900 transition-all group rounded-none relative overflow-hidden"
                    >
                        {/* Active Indicator Line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${emp.user.isActive ? 'bg-emerald-500/50' : 'bg-red-500/50'} opacity-0 group-hover:opacity-100 transition-opacity`} />

                        <div className="col-span-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-500">
                                    {emp.firstName[0]}
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                                    <p className="text-slate-600 text-xs">{emp.department}</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <span className="text-slate-400 text-xs px-2 py-1 rounded bg-slate-950 border border-slate-800">
                                {emp.position}
                            </span>
                        </div>

                        <div className="col-span-2 font-mono text-xs text-amber-500/80">
                            {emp.user.uniqueKey}
                        </div>

                        <div className="col-span-2 text-xs text-slate-500">
                            {emp.user.lastLogin ? new Date(emp.user.lastLogin).toLocaleDateString() : 'Never'}
                        </div>

                        <div className="col-span-2 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${emp.user.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                            <span className={`text-xs ${emp.user.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                                {emp.user.isActive ? 'Active' : 'Frozen'}
                            </span>
                        </div>

                        <div className="col-span-1 text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800 rounded-none w-48">
                                    <DropdownMenuItem className="focus:bg-slate-900 focus:text-white text-slate-400 cursor-pointer">
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Reset Password
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="focus:bg-slate-900 focus:text-white text-slate-400 cursor-pointer">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Edit Permissions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleToggleStatus(emp.userId, emp.user.isActive)}
                                        disabled={isUpdating === emp.userId}
                                        className={`focus:bg-slate-900 cursor-pointer ${emp.user.isActive ? 'text-red-500 focus:text-red-400' : 'text-emerald-500 focus:text-emerald-400'}`}
                                    >
                                        {emp.user.isActive ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                        {emp.user.isActive ? 'Freeze Account' : 'Activate Account'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
