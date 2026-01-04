"use client"
import { useTranslation } from "@/hooks/use-translation"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    BookOpen,
    FolderTree,
    CreditCard,
    Edit,
    ArrowRight
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

import { getCOA, createAccount, updateAccount } from "@/actions/accounting"

interface ChartOfAccountsProps {
    user: any
}

export function ChartOfAccounts({ user }: ChartOfAccountsProps) {
    const { t, isRTL } = useTranslation()
    const [accounts, setAccounts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [searchTerm, setSearchTerm] = useState("")

    // Modal
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<any | null>(null)
    const [form, setForm] = useState({
        accountCode: "",
        accountName: "",
        accountType: "asset",
        parentAccountId: "0" // 0 or null for root
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        if (!user.companyId) return
        setIsLoading(true)
        const res = await getCOA(user.companyId)
        if (res.success) setAccounts(res.data as any[])
        setIsLoading(false)
    }

    const handleOpenSheet = (account?: any) => {
        if (account) {
            setEditingAccount(account)
            setForm({
                accountCode: account.accountCode,
                accountName: account.accountName,
                accountType: account.accountType,
                parentAccountId: account.parentAccountId?.toString() || "0"
            })
        } else {
            setEditingAccount(null)
            setForm({
                accountCode: "",
                accountName: "",
                accountType: "asset",
                parentAccountId: "0"
            })
        }
        setIsSheetOpen(true)
    }

    const handleSave = async () => {
        if (!form.accountName || !form.accountCode) {
            toast.error("Code and Name are required")
            return
        }

        startTransition(async () => {
            let res
            const payload = {
                ...form,
                parentAccountId: form.parentAccountId === "0" ? null : form.parentAccountId
            }

            if (editingAccount) {
                res = await updateAccount(editingAccount.id, payload)
            } else {
                res = await createAccount(user.companyId, payload)
            }

            if (res.success) {
                toast.success(editingAccount ? "Account updated" : "Account created")
                setIsSheetOpen(false)
                loadData()
            } else {
                toast.error(res.error)
            }
        })
    }

    // --- HIERARCHY BUILDER ---
    // We want to flatten the list visually but with indentation
    // Simply sorting by Code usually works if codes are structured (e.g. 1000, 1100, 1110)
    // But we also have parentAccountId.

    // Let's just create a flat list sorted by code for now, ensuring hierarchy is visible via Indent.
    const sortedAccounts = [...accounts].sort((a, b) => a.accountCode.localeCompare(b.accountCode))

    const filteredAccounts = sortedAccounts.filter(acc =>
        acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'asset': return "text-emerald-400 border-emerald-400/20 bg-emerald-500/10"
            case 'liability': return "text-red-400 border-red-400/20 bg-red-500/10"
            case 'equity': return "text-blue-400 border-blue-400/20 bg-blue-500/10"
            case 'revenue': return "text-amber-400 border-amber-400/20 bg-amber-500/10"
            case 'expense': return "text-purple-400 border-purple-400/20 bg-purple-500/10"
            default: return "text-slate-400 border-slate-400/20 bg-slate-500/10"
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BookOpen className="w-12 h-12 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Accounts</p>
                        <h3 className="text-3xl font-light text-white mt-1">{accounts.length}</h3>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-950/50 p-4 border border-slate-800 backdrop-blur-xl">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search accounts..."
                        className="pl-9 bg-slate-900/50 border-slate-800 focus:border-amber-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleOpenSheet()}>
                    <Plus className="h-4 w-4 mr-2" /> Add Account
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border border-slate-800 bg-slate-950/30 backdrop-blur-sm overflow-hidden">
                <ScrollArea className="h-[600px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-900/80 text-xs uppercase font-medium text-slate-400 sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="px-6 py-4">Account Code</th>
                                <th className="px-6 py-4">Account Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-6 text-center text-slate-500">Loading...</td></tr>
                            ) : filteredAccounts.map((acc) => (
                                <tr key={acc.id} className="hover:bg-slate-900/50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-slate-400">
                                        <div className="flex items-center">
                                            {/* Minimal indentation logic based on length of code or assumed depth */}
                                            {/* For robust hierarchy we'd traverse tree, but Code convention (100 vs 1000) often implies it */}
                                            <span className={cn("inline-block w-1 h-1 rounded-full bg-slate-700 mr-2", acc.parentAccountId && "ml-4 bg-slate-500")}></span>
                                            {acc.accountCode}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white pl-6">
                                        <div className="flex items-center gap-2">
                                            {acc.accountName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={cn("uppercase text-[10px]", getTypeColor(acc.accountType))}>
                                            {acc.accountType}
                                        </Badge>
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-mono",
                                        parseFloat(acc.balance) < 0 ? "text-red-400" : "text-emerald-400"
                                    )}>
                                        {`${t('currency_symbol')} ${parseFloat(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => handleOpenSheet(acc)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ScrollArea>
            </div>

            {/* Account Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="bg-slate-950 border-l border-slate-800 text-white">
                    <SheetHeader>
                        <SheetTitle className="text-white">{editingAccount ? "Edit Account" : "New Account"}</SheetTitle>
                        <SheetDescription className="text-slate-400">
                            Define the chart of accounts structure.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Account Code</Label>
                                <Input
                                    className="bg-slate-900 border-slate-800"
                                    placeholder="e.g. 1000"
                                    value={form.accountCode}
                                    onChange={e => setForm({ ...form, accountCode: e.target.value })}
                                    disabled={!!editingAccount} // Prevent changing code for now to avoid breaking history
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={form.accountType} onValueChange={v => setForm({ ...form, accountType: v })}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="asset">Asset</SelectItem>
                                        <SelectItem value="liability">Liability</SelectItem>
                                        <SelectItem value="equity">Equity</SelectItem>
                                        <SelectItem value="revenue">Revenue</SelectItem>
                                        <SelectItem value="expense">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Account Name</Label>
                            <Input
                                className="bg-slate-900 border-slate-800"
                                placeholder="e.g. Cash on Hand"
                                value={form.accountName}
                                onChange={e => setForm({ ...form, accountName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Parent Account (Optional)</Label>
                            <Select value={form.parentAccountId} onValueChange={v => setForm({ ...form, parentAccountId: v })}>
                                <SelectTrigger className="bg-slate-900 border-slate-800">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white h-[200px]">
                                    <SelectItem value="0">Current Assets</SelectItem> {/* Simplified, ideally should allow selecting any account */}
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id.toString()}>
                                            {acc.accountCode} - {acc.accountName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-4" onClick={handleSave} disabled={isPending}>
                            {isPending ? "Saving..." : "Save Account"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
