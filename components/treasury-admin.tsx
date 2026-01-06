"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    ShieldCheck,
    Users,
    Activity,
    Plus,
    Lock,
    Unlock,
    ArrowLeftRight,
    RefreshCcw,
    DollarSign,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    Building2,
    History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
    getAllTreasurySessions,
    getAllCompanyUsers,
    getTreasuryTransfers,
    approveTreasuryTransfer,
    getCashBankAccounts,
    openTreasurySession,
    createTreasuryTransfer
} from "@/actions/treasury"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TreasuryAdmin({ user }: { user: any }) {
    const { t, isRTL, language } = useTranslation()
    const [isLoading, setIsLoading] = useState(true)
    const [sessions, setSessions] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [transfers, setTransfers] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])

    // Dialogs
    const [isOpenVaultOpen, setIsOpenVaultOpen] = useState(false)
    const [isTransferOpen, setIsTransferOpen] = useState(false)

    // Form States
    const [selectedUserId, setSelectedUserId] = useState("")
    const [amount, setAmount] = useState("")
    const [currency, setCurrency] = useState("EGP")
    const [rate, setRate] = useState("1")
    const [notes, setNotes] = useState("")
    const [transferType, setTransferType] = useState("bank_to_user_vault")
    const [fromAccount, setFromAccount] = useState("")
    const [toAccount, setToAccount] = useState("")

    useEffect(() => {
        loadData()
    }, [user.companyId])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [sessionsRes, usersRes, transferRes, accountRes] = await Promise.all([
                getAllTreasurySessions(user.companyId),
                getAllCompanyUsers(user.companyId),
                getTreasuryTransfers(user.companyId),
                getCashBankAccounts(user.companyId)
            ])

            if (sessionsRes.success) setSessions(sessionsRes.data)
            if (usersRes.success) setUsers(usersRes.data)
            if (transferRes.success) setTransfers(transferRes.data)
            if (accountRes.success) setAccounts(accountRes.data)
        } catch (error) {
            toast.error("Failed to load admin treasury data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenVault = async () => {
        if (!selectedUserId) return
        const res = await openTreasurySession({
            userId: parseInt(selectedUserId),
            companyId: user.companyId,
            openingBalance: parseFloat(amount) || 0,
            currency,
            notes
        })
        if (res.success) {
            toast.success(t('open_shift') + " " + t('completed'))
            setIsOpenVaultOpen(false)
            loadData()
        }
    }

    const handleCreateAdminTransfer = async () => {
        const res = await createTreasuryTransfer({
            userId: user.id,
            companyId: user.companyId,
            fromUserId: transferType === 'user_vault_to_bank' ? parseInt(selectedUserId) : undefined,
            toUserId: transferType === 'bank_to_user_vault' ? parseInt(selectedUserId) : undefined,
            fromAccountId: transferType === 'bank_to_user_vault' ? parseInt(fromAccount) : undefined,
            toAccountId: transferType === 'user_vault_to_bank' ? parseInt(toAccount) : undefined,
            amount: parseFloat(amount),
            currency,
            conversionRate: parseFloat(rate),
            type: transferType,
            notes
        })
        if (res.success) {
            toast.success(t('vault_transfer') + " " + t('completed'))
            setIsTransferOpen(false)
            loadData()
        }
    }

    const handleApprove = async (id: number) => {
        const res = await approveTreasuryTransfer(id, user.id)
        if (res.success) {
            toast.success(t('confirm') + " " + t('completed'))
            loadData()
        }
    }

    const formatCurrency = (val: any, curr: string = 'EGP') => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
            style: 'currency',
            currency: curr
        }).format(parseFloat(val || 0))
    }

    if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><RefreshCcw className="animate-spin h-8 w-8 text-amber-500" /></div>

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-light text-white tracking-tight">{t('treasury_admin')}</h2>
                    <p className="text-slate-500 text-sm tracking-widest uppercase text-[10px] font-black">{t('manage_vault_and_reconciliation')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-none uppercase tracking-widest text-[10px] font-black h-12 px-8"
                        onClick={() => setIsOpenVaultOpen(true)}
                    >
                        <Unlock className="mr-2 h-4 w-4" />
                        {t('open_for_user')}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white rounded-none h-12 uppercase tracking-widest text-[10px] font-black px-8"
                        onClick={() => setIsTransferOpen(true)}
                    >
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        {t('vault_transfer')}
                    </Button>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="sessions" className="w-full">
                <TabsList className="bg-transparent border-b border-slate-800 w-full justify-start rounded-none h-auto p-0 gap-8 mb-8">
                    <TabsTrigger value="sessions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 bg-transparent text-slate-500 data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black pb-4 px-0">
                        {t('active_shifts')}
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 bg-transparent text-slate-500 data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black pb-4 px-0">
                        {t('pending_transfers')}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-400 bg-transparent text-slate-500 data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black pb-4 px-0">
                        {t('all_sessions')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sessions">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sessions.filter(s => s.status === 'open').map(s => (
                            <Card key={s.id} className="bg-slate-950/40 border-slate-800 rounded-none hover:border-emerald-500/50 transition-all duration-500 group">
                                <CardHeader className="border-b border-slate-900 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center rounded-none group-hover:scale-110 transition-transform">
                                                <User className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{s.user?.email}</p>
                                                <p className="text-[9px] text-slate-500 uppercase font-black">{s.user?.role}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-none text-[8px]">{s.currency}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">{t('current_balance')}</p>
                                            <p className="text-2xl font-light text-white font-mono tracking-tighter">{formatCurrency(s.expectedClosingBalance, s.currency)}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(s.openedAt), 'MMM dd, h:mm a')}
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 h-8 text-[9px] font-black uppercase tracking-widest rounded-none">
                                            {t('close_shift')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="pending">
                    <Card className="bg-slate-950/40 border-slate-800 rounded-none">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest text-slate-500 h-12">{t('type')}</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest text-slate-500 h-12">{t('user')}</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest text-slate-500 h-12">{t('amount')}</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest text-slate-500 h-12">{t('currency')}</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest text-slate-500 h-12">{t('rate')}</TableHead>
                                    <TableHead className="text-right text-[9px] uppercase font-black tracking-widest text-slate-500 h-12">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transfers.filter(t => t.status === 'pending').map(tx => (
                                    <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-900/40 transition-colors">
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className="rounded-none text-[8px] uppercase border-slate-800 text-slate-400">
                                                {tx.type.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-300">
                                            {tx.fromUserId || tx.toUserId || t('unknown')}
                                        </TableCell>
                                        <TableCell className="font-mono text-white text-base">
                                            {parseFloat(tx.amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-slate-400 font-black text-[10px]">
                                            {tx.currency}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs">
                                            x {tx.conversionRate}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                className="bg-amber-500 hover:bg-amber-400 text-black rounded-none h-8 font-black uppercase text-[9px] tracking-widest px-4"
                                                onClick={() => handleApprove(tx.id)}
                                            >
                                                {t('confirm')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="all">
                    {/* Simplified list of all history */}
                    <div className="py-20 text-center border border-dashed border-slate-800">
                        <History className="h-10 w-10 text-slate-800 mx-auto mb-4" />
                        <p className="text-xs text-slate-600 uppercase tracking-widest">{t('no_data')}</p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <Dialog open={isOpenVaultOpen} onOpenChange={setIsOpenVaultOpen}>
                <DialogContent className="bg-slate-950 border-slate-800 rounded-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white uppercase tracking-widest font-black text-sm italic">{t('open_for_user')}</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">{t('select_user')} and initialize their shift.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500">{t('user')}</Label>
                            <select
                                className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-slate-300 text-sm focus:border-emerald-500 outline-none px-4"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            >
                                <option value="">{t('select_user')}</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.email} ({u.role})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">{t('opening')} {t('balance')}</Label>
                                <Input type="number" className="bg-slate-900 border-slate-800 rounded-none h-12 text-white font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">{t('currency')}</Label>
                                <select className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-white outline-none px-2" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                    <option value="EGP">EGP</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="SAR">SAR</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full bg-emerald-600 text-white rounded-none h-12 font-black uppercase text-xs tracking-widest" onClick={handleOpenVault}>
                            {t('confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent className="bg-slate-950 border-slate-800 rounded-none max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white uppercase tracking-widest font-black text-sm italic">{t('vault_transfer')}</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">{t('liquidity')} {t('engine')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <select className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-white outline-none px-4 text-xs font-black uppercase" value={transferType} onChange={(e) => setTransferType(e.target.value)}>
                            <option value="bank_to_user_vault">{t('bank_to_vault')}</option>
                            <option value="user_vault_to_bank">{t('vault_to_bank')}</option>
                        </select>

                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">{t('user')}</Label>
                                <select className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-white outline-none px-4" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                                    <option value="">{t('select_user')}</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">{t('account')}</Label>
                                <select className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-white outline-none px-4" value={transferType.includes('bank') ? (transferType === 'bank_to_user_vault' ? fromAccount : toAccount) : ''} onChange={(e) => transferType === 'bank_to_user_vault' ? setFromAccount(e.target.value) : setToAccount(e.target.value)}>
                                    <option value="">{t('select_placeholder')}</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2 col-span-1">
                                    <Label className="text-[10px] uppercase font-black text-slate-500">{t('amount')}</Label>
                                    <Input type="number" className="bg-slate-900 border-slate-800 rounded-none h-12 text-white font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-500">{t('currency')}</Label>
                                    <select className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-white outline-none px-2" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                        <option value="EGP">EGP</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-500">{t('conversion_rate')}</Label>
                                    <Input type="number" step="0.0001" className="bg-slate-900 border-slate-800 rounded-none h-12 text-white font-mono" value={rate} onChange={(e) => setRate(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full bg-white text-black rounded-none h-12 font-black uppercase text-xs tracking-widest" onClick={handleCreateAdminTransfer}>
                            {t('confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
