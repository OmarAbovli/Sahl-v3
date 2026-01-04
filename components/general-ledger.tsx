"use client"
import { useTranslation } from "@/hooks/use-translation"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Book,
    FileText,
    ArrowRightLeft,
    Trash2,
    Eye
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
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

import { getJournalEntries, createJournalEntry, getCOA } from "@/actions/accounting"
import { DataExportModal } from "@/components/data-export-modal"

interface GeneralLedgerProps {
    user: any
}

export function GeneralLedger({ user }: GeneralLedgerProps) {
    const { t, isRTL } = useTranslation()
    const [entries, setEntries] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([]) // For Picking Accounts
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [searchTerm, setSearchTerm] = useState("")

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [viewEntry, setViewEntry] = useState<any | null>(null)

    // Form
    const [newRef, setNewRef] = useState("")
    const [newDesc, setNewDesc] = useState("")
    const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [newLines, setNewLines] = useState<{ accountId: string, debit: number, credit: number, description: string }[]>([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        if (!user.companyId) return
        setIsLoading(true)
        const [jeRes, coaRes] = await Promise.all([
            getJournalEntries(user.companyId),
            getCOA(user.companyId)
        ])
        if (jeRes.success) setEntries(jeRes.data as any[])
        if (coaRes.success) setAccounts(coaRes.data as any[])
        setIsLoading(false)
    }

    const addLine = () => {
        setNewLines([...newLines, { accountId: "", debit: 0, credit: 0, description: "" }])
    }

    const updateLine = (idx: number, field: string, value: any) => {
        const lines = [...newLines]
        lines[idx] = { ...lines[idx], [field]: value }

        // Auto-balance logic? Maybe complicated. Let user handle it.
        // But if Debit entered, Credit should be 0, and vice versa typically.
        if (field === 'debit' && value > 0) lines[idx].credit = 0
        if (field === 'credit' && value > 0) lines[idx].debit = 0

        setNewLines(lines)
    }

    const removeLine = (idx: number) => {
        const lines = [...newLines]
        lines.splice(idx, 1)
        setNewLines(lines)
    }

    const handleCreate = async () => {
        if (newLines.length < 2) {
            toast.error("Entry must have at least 2 lines")
            return
        }
        // Validate Balance
        const totalDebit = newLines.reduce((s, l) => s + l.debit, 0)
        const totalCredit = newLines.reduce((s, l) => s + l.credit, 0)

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            toast.error(`Unbalanced Entry! Debit: ${totalDebit}, Credit: ${totalCredit}`)
            return
        }

        startTransition(async () => {
            const res = await createJournalEntry({
                userId: user.id,
                companyId: user.companyId,
                entryDate: newDate,
                description: newDesc || "Manual Journal Entry",
                reference: newRef,
                lines: newLines.map(l => ({
                    accountId: parseInt(l.accountId),
                    description: l.description,
                    debit: l.debit,
                    credit: l.credit
                }))
            })

            if (res.success) {
                toast.success("Journal Entry Posted")
                setIsCreateOpen(false)
                setNewLines([])
                setNewDesc("")
                setNewRef("")
                loadData()
            } else {
                toast.error(res.error)
            }
        })
    }

    const filteredEntries = entries.filter(je =>
        je.entryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        je.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowRightLeft className="w-12 h-12 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Transactions</p>
                        <h3 className="text-3xl font-light text-white mt-1">{entries.length}</h3>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-950/50 p-4 border border-slate-800 backdrop-blur-xl">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search entries..."
                        className="pl-9 bg-slate-900/50 border-slate-800 focus:border-amber-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <DataExportModal
                        model="journal_entries"
                        title={t('general_ledger' as any)}
                        companyId={user.companyId}
                    />
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> New Journal Entry
                    </Button>
                </div>
            </div>

            {/* Entries Table */}
            <div className="rounded-md border border-slate-800 bg-slate-950/30 backdrop-blur-sm overflow-hidden">
                <ScrollArea className="h-[600px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-900/80 text-xs uppercase font-medium text-slate-400 sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="px-6 py-4">Entry #</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Debit</th>
                                <th className="px-6 py-4 text-right">Credit</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading...</td></tr>
                            ) : filteredEntries.map((je) => (
                                <tr key={je.id} className="hover:bg-slate-900/50 transition-colors cursor-pointer" onClick={() => setViewEntry(je)}>
                                    <td className="px-6 py-4 font-mono text-white">{je.entryNumber}</td>
                                    <td className="px-6 py-4 text-slate-400">{format(new Date(je.entryDate), 'MMM dd, yyyy')}</td>
                                    <td className="px-6 py-4 text-slate-300">{je.description}</td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-400">
                                        {`${t('currency_symbol')} ${parseFloat(je.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-400">
                                        {`${t('currency_symbol')} ${parseFloat(je.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Eye className="h-4 w-4 text-slate-500" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ScrollArea>
            </div>

            {/* Create JE Sheet */}
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent className="bg-slate-950 border-l border-slate-800 text-white w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-white">New Manual Journal Entry</SheetTitle>
                        <SheetDescription className="text-slate-400">
                            Create a double-entry transaction. Debits must equal Credits.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    className="bg-slate-900 border-slate-800"
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Reference</Label>
                                <Input
                                    className="bg-slate-900 border-slate-800"
                                    placeholder="e.g. ADJ-001"
                                    value={newRef}
                                    onChange={e => setNewRef(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                className="bg-slate-900 border-slate-800"
                                placeholder="Description of transaction"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-slate-300">Lines</h3>
                                <Button variant="ghost" size="sm" onClick={addLine} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
                                    <Plus className="h-3 w-3 mr-1" /> Add Line
                                </Button>
                            </div>

                            {newLines.map((line, idx) => (
                                <div key={idx} className="bg-slate-900/30 p-3 rounded-md border border-slate-800/50 space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Account</Label>
                                        <Select value={line.accountId} onValueChange={v => updateLine(idx, 'accountId', v)}>
                                            <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-800">
                                                <SelectValue placeholder="Select Account" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id.toString()}>
                                                        {acc.accountCode} - {acc.accountName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">Debit</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs bg-slate-900 border-slate-800"
                                                value={line.debit}
                                                onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">Credit</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs bg-slate-900 border-slate-800"
                                                value={line.credit}
                                                onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Input
                                            placeholder="Line description (optional)"
                                            className="h-8 text-xs bg-slate-900 border-slate-800 w-3/4"
                                            value={line.description}
                                            onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                        />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-950/30" onClick={() => removeLine(idx)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between items-center text-sm pt-2 font-mono">
                                <div className={cn("text-emerald-400", Math.abs(newLines.reduce((s, l) => s + l.debit, 0) - newLines.reduce((s, l) => s + l.credit, 0)) > 0.01 && "text-red-500")}>
                                    Total Debit: {newLines.reduce((s, l) => s + l.debit, 0)}
                                </div>
                                <div className={cn("text-emerald-400", Math.abs(newLines.reduce((s, l) => s + l.debit, 0) - newLines.reduce((s, l) => s + l.credit, 0)) > 0.01 && "text-red-500")}>
                                    Total Credit: {newLines.reduce((s, l) => s + l.credit, 0)}
                                </div>
                            </div>
                        </div>

                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-4" onClick={handleCreate} disabled={isPending}>
                            {isPending ? "Posting..." : "Post Entry"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* View Entry Dialog */}
            <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Journal Entry #{viewEntry?.entryNumber}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Posted on {viewEntry && format(new Date(viewEntry.entryDate), 'PPP')}
                        </DialogDescription>
                    </DialogHeader>
                    {viewEntry && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-900/50 rounded-lg">
                                <p className="text-white mb-2">{viewEntry.description}</p>
                                {viewEntry.reference && <Badge variant="outline">{viewEntry.reference}</Badge>}
                            </div>

                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase text-slate-500 bg-slate-900">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Account</th>
                                        <th className="px-4 py-2 text-right">Debit</th>
                                        <th className="px-4 py-2 text-right">Credit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {viewEntry.lines?.map((line: any, i: number) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white">{line.account?.accountName}</span>
                                                    <span className="text-xs text-slate-500">{line.account?.accountCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-right text-slate-300">
                                                {parseFloat(line.debitAmount) > 0 ? parseFloat(line.debitAmount).toFixed(2) : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-right text-slate-300">
                                                {parseFloat(line.creditAmount) > 0 ? parseFloat(line.creditAmount).toFixed(2) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-900/50 font-bold">
                                        <td className="px-4 py-2 text-right text-slate-400">Totals</td>
                                        <td className="px-4 py-2 text-right text-emerald-400">{viewEntry.totalDebit}</td>
                                        <td className="px-4 py-2 text-right text-emerald-400">{viewEntry.totalCredit}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
