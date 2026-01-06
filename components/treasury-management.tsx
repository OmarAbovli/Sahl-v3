"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Banknote,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    Plus,
    History,
    Lock,
    Unlock,
    ShieldCheck,
    AlertCircle,
    ArrowLeftRight,
    CheckCircle2,
    XCircle,
    Clock,
    User
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
    DialogTrigger
} from "@/components/ui/dialog"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
    getActiveTreasurySession,
    openTreasurySession,
    closeTreasurySession,
    getTreasuryTransfers,
    createTreasuryTransfer,
    approveTreasuryTransfer,
    getCashBankAccounts
} from "@/actions/treasury"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TreasuryAdmin } from "./treasury-admin"

interface TreasuryManagementProps {
    user: any
    canManage?: boolean
    canView?: boolean
}

export function TreasuryManagement({ user, canManage, canView }: TreasuryManagementProps) {
    const { t, isRTL, language } = useTranslation()
    const [isLoading, setIsLoading] = useState(true)
    const [session, setSession] = useState<any>(null)
    const [transfers, setTransfers] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])

    // Dialog States
    const [isOpeningShift, setIsOpeningShift] = useState(false)
    const [isClosingShift, setIsClosingShift] = useState(false)
    const [isTransferring, setIsTransferring] = useState(false)

    // Form States
    const [amount, setAmount] = useState("")
    const [currency, setCurrency] = useState("EGP")
    const [rate, setRate] = useState("1")
    const [notes, setNotes] = useState("")
    const [targetAccountId, setTargetAccountId] = useState("")
    const [transferType, setTransferType] = useState("user_to_vault")

    useEffect(() => {
        loadData()
    }, [user.id, user.companyId])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [sessionRes, transferRes, accountRes] = await Promise.all([
                getActiveTreasurySession(user.id, user.companyId),
                getTreasuryTransfers(user.companyId),
                getCashBankAccounts(user.companyId)
            ])

            if (sessionRes.success) setSession(sessionRes.data)
            if (transferRes.success) setTransfers(transferRes.data)
            if (accountRes.success) setAccounts(accountRes.data)
        } catch (error) {
            toast.error("Failed to load treasury data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenShift = async () => {
        const res = await openTreasurySession({
            userId: user.id,
            companyId: user.companyId,
            openingBalance: parseFloat(amount) || 0,
            currency,
            notes
        })
        if (res.success) {
            setSession(res.data)
            setIsOpeningShift(false)
            setAmount("")
            setCurrency("EGP")
            setNotes("")
            toast.success("Shift Opened Successfully")
        }
    }

    const handleCloseShift = async () => {
        if (!session) return
        const res = await closeTreasurySession({
            sessionId: session.id,
            actualBalance: parseFloat(amount) || 0,
            notes
        })
        if (res.success) {
            setSession(null)
            setIsClosingShift(false)
            setAmount("")
            setNotes("")
            toast.success("Shift Closed & Reconciled")
            loadData()
        }
    }

    const handleCreateTransfer = async () => {
        const res = await createTreasuryTransfer({
            userId: user.id,
            companyId: user.companyId,
            fromUserId: transferType === 'user_to_vault' ? user.id : undefined,
            toUserId: transferType === 'vault_to_user' ? user.id : undefined,
            fromAccountId: transferType === 'vault_to_user' ? parseInt(targetAccountId) : undefined,
            toAccountId: transferType === 'user_to_vault' ? parseInt(targetAccountId) : undefined,
            amount: parseFloat(amount),
            currency,
            conversionRate: parseFloat(rate),
            type: transferType,
            notes
        })
        if (res.success) {
            setIsTransferring(false)
            setAmount("")
            setCurrency("EGP")
            setRate("1")
            setNotes("")
            toast.success("Transfer Initiated")
            loadData()
        }
    }

    const handleApproveTransfer = async (id: number) => {
        const res = await approveTreasuryTransfer(id, user.id)
        if (res.success) {
            toast.success("Transfer Approved")
            loadData()
        }
    }

    const formatCurrency = (val: any, curr: string = 'EGP') => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
            style: 'currency',
            currency: curr || 'EGP'
        }).format(parseFloat(val || 0))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCcw className="h-8 w-8 text-amber-500 animate-spin" />
            </div>
        )
    }

    const renderVaultCard = () => (
        <Card className="bg-slate-950/40 border-slate-800 rounded-none overflow-hidden group">
            <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-xs uppercase tracking-[0.3em] font-black text-slate-500 flex items-center justify-between">
                    {t('my_vault_status')}
                    {session ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-none text-[8px] uppercase">{t('active')}</Badge>
                    ) : (
                        <Badge variant="outline" className="border-slate-800 text-slate-500 rounded-none text-[8px] uppercase">{t('inactive')}</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('current_balance')}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-light text-white font-mono tracking-tighter">
                            {formatCurrency(session?.expectedClosingBalance || 0, session?.currency)}
                        </p>
                        <span className="text-slate-500 font-black text-xs uppercase">{session?.currency}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/50">
                    <div>
                        <p className="text-[9px] uppercase font-black text-slate-600">{t('opening')}</p>
                        <p className="text-lg font-light text-slate-300 font-mono">{formatCurrency(session?.openingBalance || 0, session?.currency)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-black text-slate-600">{t('started_at')}</p>
                        <p className="text-xs text-slate-400 mt-1">{session ? format(new Date(session.openedAt), 'hh:mm a') : '--:--'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white rounded-none h-12 uppercase tracking-widest text-[9px] font-black group-hover:border-amber-500/50 transition-all duration-500"
                        onClick={() => setIsTransferring(true)}
                        disabled={!session}
                    >
                        <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
                        {t('vault_transfer')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    const renderStats = () => (
        <>
            <Card className="bg-slate-950/40 border-slate-800 rounded-none">
                <CardContent className="pt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="h-10 w-10 bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t('inflow')} {t('engine')}</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t('total')} {t('revenue')}</h3>
                        <p className="text-2xl font-light text-white font-mono">
                            {formatCurrency(0)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-950/40 border-slate-800 rounded-none">
                <CardContent className="pt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="h-10 w-10 bg-rose-500/5 border border-rose-500/20 flex items-center justify-center">
                            <ArrowDownRight className="h-5 w-5 text-rose-500" />
                        </div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t('outflow')} {t('engine')}</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t('total')} {t('expense')}</h3>
                        <p className="text-2xl font-light text-white font-mono">
                            {formatCurrency(0)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    )

    const renderHistory = () => (
        <div className="col-span-full">
            <Tabs defaultValue="transfers" className="w-full">
                <TabsList className="bg-transparent border-b border-slate-800 w-full justify-start rounded-none h-auto p-0 gap-8">
                    <TabsTrigger value="transfers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 bg-transparent text-slate-500 data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black pb-4 px-0">
                        {t('pending_transfers')}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 bg-transparent text-slate-500 data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black pb-4 px-0">
                        {t('history')}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="transfers" className="mt-8">
                    <div className="space-y-4">
                        {transfers.filter(tx => tx.status === 'pending').length > 0 ? (
                            transfers.filter(tx => tx.status === 'pending').map((tx, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-slate-900/30 border border-slate-800/50 hover:border-slate-800 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-amber-500/5 border border-amber-500/20 flex items-center justify-center">
                                            <ArrowLeftRight className="h-4 w-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{tx.type.replace(/_/g, ' ').toUpperCase()}</p>
                                            <p className="text-[10px] text-slate-500 tracking-wider">REF: {tx.reference || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <p className="text-xl font-mono text-white tracking-tighter">{formatCurrency(tx.amount, tx.currency)}</p>
                                        {tx.toUserId === user.id && (
                                            <Button
                                                size="sm"
                                                className="bg-amber-500 hover:bg-amber-400 text-black rounded-none h-8 font-black uppercase text-[10px]"
                                                onClick={() => handleApproveTransfer(tx.id)}
                                            >
                                                {t('confirm')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center border border-dashed border-slate-800">
                                <p className="text-xs text-slate-600 uppercase tracking-widest">{t('no_data')}</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="history" className="mt-8">
                    <div className="py-20 text-center border border-dashed border-slate-800">
                        <p className="text-xs text-slate-600 uppercase tracking-widest">{t('no_data')}</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-light text-white tracking-tight">{t('treasury_management')}</h2>
                    <p className="text-slate-500 text-sm tracking-widest uppercase text-[10px] font-black">{t('manage_vault_and_reconciliation')}</p>
                </div>

                <div className="flex items-center gap-3">
                    {!session ? (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-none uppercase tracking-widest text-[10px] font-black h-12 px-8"
                            onClick={() => setIsOpeningShift(true)}
                        >
                            <Unlock className="mr-2 h-4 w-4" />
                            {t('open_shift')}
                        </Button>
                    ) : (
                        <Button
                            className="bg-rose-600 hover:bg-rose-500 text-white rounded-none uppercase tracking-widest text-[10px] font-black h-12 px-8"
                            onClick={() => setIsClosingShift(true)}
                        >
                            <Lock className="mr-2 h-4 w-4" />
                            {t('close_shift')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-8">
                {canManage ? (
                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="bg-transparent border-b border-slate-800 w-full justify-start rounded-none h-auto p-0 gap-8 mb-8">
                            <TabsTrigger value="personal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 bg-transparent text-slate-500 data-[state=active]:text-white uppercase tracking-widest text-[11px] font-black pb-4 px-0">
                                {t('my_vault_status')}
                            </TabsTrigger>
                            <TabsTrigger value="admin" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 bg-transparent text-slate-500 data-[state=active]:text-white uppercase tracking-widest text-[11px] font-black pb-4 px-0">
                                {t('treasury_admin')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="personal" className="space-y-8">
                            <div className="grid gap-8 lg:grid-cols-3">
                                {renderVaultCard()}
                                <div className="lg:col-span-2 grid gap-8 grid-cols-1 md:grid-cols-2">
                                    {renderStats()}
                                    {renderHistory()}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="admin">
                            <TreasuryAdmin user={user} />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-3">
                        {renderVaultCard()}
                        <div className="lg:col-span-2 grid gap-8 grid-cols-1 md:grid-cols-2">
                            {renderStats()}
                            {renderHistory()}
                        </div>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <Dialog open={isOpeningShift} onOpenChange={setIsOpeningShift}>
                <DialogContent className="bg-slate-950 border-slate-800 rounded-none max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-white uppercase tracking-widest font-black text-sm italic">{t('open_shift')}</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">{t('manage_vault_and_reconciliation')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">{t('opening')} {t('balance')}</Label>
                                <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-800 rounded-none h-12 text-white font-mono focus:border-amber-500"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">{t('currency')}</Label>
                                <select
                                    className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-white outline-none px-2"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                >
                                    <option value="EGP">EGP</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="SAR">SAR</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500">{t('notes')}</Label>
                            <Input
                                className="bg-slate-900 border-slate-800 rounded-none h-12 text-white italic text-sm focus:border-amber-500"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full bg-white text-black hover:bg-amber-50 rounded-none h-12 font-black uppercase tracking-widest text-xs" onClick={handleOpenShift}>
                            {t('confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isClosingShift} onOpenChange={setIsClosingShift}>
                <DialogContent className="bg-slate-950 border-slate-800 rounded-none max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-white uppercase tracking-widest font-black text-sm italic">{t('close_shift')}</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">{t('assessment')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 text-center">
                        <div className="p-6 bg-slate-900/50 border border-slate-800 mb-4">
                            <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest mb-1">{t('ledger')} {t('balance')}</p>
                            <p className="text-3xl font-light text-amber-500 font-mono italic">{formatCurrency(session?.expectedClosingBalance || 0, session?.currency)}</p>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] uppercase font-black text-slate-500">{t('total')} {t('amount')}</Label>
                            <Input
                                type="number"
                                className="bg-slate-900 border-slate-800 rounded-none h-12 text-white font-mono focus:border-amber-500"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full bg-rose-600 text-white hover:bg-rose-500 rounded-none h-12 font-black uppercase tracking-widest text-xs" onClick={handleCloseShift}>
                            {t('confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isTransferring} onOpenChange={setIsTransferring}>
                <DialogContent className="bg-slate-950 border-slate-800 rounded-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white uppercase tracking-widest font-black text-sm italic">{t('vault_transfer')}</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">{t('liquidity')} {t('engine')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800">
                            <Button
                                variant="ghost"
                                className={cn(
                                    "rounded-none h-10 uppercase tracking-widest text-[9px] font-black transition-all",
                                    transferType === 'user_to_vault' ? "bg-amber-50 text-black" : "text-slate-500 hover:text-white"
                                )}
                                onClick={() => setTransferType('user_to_vault')}
                            >
                                {t('inflow')}
                            </Button>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "rounded-none h-10 uppercase tracking-widest text-[9px] font-black transition-all",
                                    transferType === 'vault_to_user' ? "bg-amber-50 text-black" : "text-slate-500 hover:text-white"
                                )}
                                onClick={() => setTransferType('vault_to_user')}
                            >
                                {t('outflow')}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">{t('account')}</Label>
                                <select
                                    className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-slate-300 text-sm focus:border-amber-500 outline-none px-4"
                                    value={targetAccountId}
                                    onChange={(e) => setTargetAccountId(e.target.value)}
                                >
                                    <option value="">{t('select_placeholder')}</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type.toUpperCase()})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2 col-span-1">
                                    <Label className="text-[10px] uppercase font-black text-slate-500">{t('amount')}</Label>
                                    <Input
                                        type="number"
                                        className="bg-slate-900 border-slate-800 rounded-none h-12 text-white font-mono focus:border-amber-500"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-500">{t('currency')}</Label>
                                    <select
                                        className="w-full bg-slate-900 border-slate-800 rounded-none h-12 text-white outline-none px-2"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        <option value="EGP">EGP</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-500">{t('rate')}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="bg-slate-900 border-slate-800 rounded-none h-12 text-white font-mono focus:border-amber-500"
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">{t('notes')}</Label>
                                <Input
                                    className="bg-slate-900 border-slate-800 rounded-none h-12 text-white italic text-sm focus:border-amber-500"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full bg-white text-black hover:bg-amber-50 rounded-none h-12 font-black uppercase tracking-widest text-xs" onClick={handleCreateTransfer}>
                            {t('confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
