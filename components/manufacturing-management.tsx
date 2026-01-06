"use client"

import * as React from "react"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Factory,
    Settings,
    ClipboardList,
    Wrench,
    Plus,
    Play,
    CheckCircle2,
    AlertTriangle,
    Clock,
    User,
    ArrowRight
} from "lucide-react"
import { getMachines, getProductionOrders, getBOMs } from "@/actions/manufacturing"
import { useToast } from "@/hooks/use-toast"

interface ManufacturingManagementProps {
    user: any
    canManage?: boolean
}

export function ManufacturingManagement({ user, canManage = false }: ManufacturingManagementProps) {
    const { t, isRTL } = useTranslation()
    const { toast } = useToast()
    const [machinesList, setMachinesList] = React.useState<any[]>([])
    const [orders, setOrders] = React.useState<any[]>([])
    const [boms, setBoms] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [mRes, oRes, bRes] = await Promise.all([
                getMachines(user.companyId),
                getProductionOrders(user.companyId),
                getBOMs(user.companyId)
            ])
            setMachinesList(mRes)
            setOrders(oRes)
            setBoms(bRes)
        } catch (error) {
            console.error("Failed to fetch manufacturing data", error)
        } finally {
            setIsLoading(false)
        }
    }, [user.companyId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Factory className="h-8 w-8 text-amber-500" />
                        {t('manufacturing')}
                    </h1>
                    <p className="text-slate-400 mt-1 uppercase text-[10px] tracking-[0.3em] font-black">
                        {t('production_intelligence')}
                    </p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2">
                            <Plus className="h-4 w-4" />
                            {t('create')} {t('production_orders')}
                        </Button>
                    </div>
                )}
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 h-auto">
                    <TabsTrigger value="overview" className="py-2.5 px-5 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 transition-all">
                        {t('overview')}
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="py-2.5 px-5 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 transition-all">
                        {t('production_orders')}
                    </TabsTrigger>
                    <TabsTrigger value="machines" className="py-2.5 px-5 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 transition-all">
                        {t('machines')}
                    </TabsTrigger>
                    <TabsTrigger value="bom" className="py-2.5 px-5 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 transition-all">
                        {t('bill_of_materials')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm group hover:border-amber-500/30 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('active_orders')}</CardTitle>
                                <Play className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'in_progress').length}</div>
                                <p className="text-[8px] text-slate-500 mt-1 uppercase font-black">{t('currently_in_production')}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm group hover:border-amber-500/30 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('machine_health')}</CardTitle>
                                <Wrench className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {machinesList.length > 0 ? Math.round(machinesList.reduce((acc, m) => acc + (m.healthScore || 100), 0) / machinesList.length) : 0}%
                                </div>
                                <Progress value={machinesList.length > 0 ? Math.round(machinesList.reduce((acc, m) => acc + (m.healthScore || 100), 0) / machinesList.length) : 0} className="h-1 mt-2 bg-slate-800" />
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm group hover:border-amber-500/30 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('quality_pass_rate')}</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">98.4%</div>
                                <p className="text-[8px] text-slate-500 mt-1 uppercase font-black">{t('historical_average')}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm group hover:border-amber-500/30 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('maintenance_due')}</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {machinesList.filter(m => m.healthScore < 80).length}
                                </div>
                                <p className="text-[8px] text-slate-500 mt-1 uppercase font-black">{t('units_require_attention')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Active Production List */}
                        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-emerald-500" />
                                    {t('active_production_monitor')}
                                </CardTitle>
                                <CardDescription className="text-[10px] uppercase font-bold tracking-tighter">{t('real_time_stage_tracking')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {orders.length === 0 ? (
                                    <div className="py-12 text-center text-slate-600 uppercase text-[10px] font-black">{t('no_active_production')}</div>
                                ) : (
                                    orders.filter(o => o.status !== 'completed').map(order => (
                                        <div key={order.id} className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg group hover:border-slate-700 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-amber-500 uppercase">{order.orderNumber}</span>
                                                        <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-500 uppercase">{t(order.status as any)}</Badge>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white mt-1">{order.product?.name}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 block">{t('quantity')}</span>
                                                    <span className="text-sm font-black text-white">{order.quantity} {t('units')}</span>
                                                </div>
                                            </div>

                                            {/* Stages Visual */}
                                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                                {order.stages?.sort((a: any, b: any) => a.sequence - b.sequence).map((stage: any, idx: number) => (
                                                    <React.Fragment key={stage.id}>
                                                        <div className={cn(
                                                            "flex-shrink-0 p-2 rounded border text-[10px] font-bold uppercase transition-all",
                                                            stage.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" :
                                                                stage.status === 'active' ? "bg-amber-500/10 border-amber-500/50 text-amber-500 animate-pulse" :
                                                                    "bg-slate-900 border-slate-800 text-slate-500"
                                                        )}>
                                                            {stage.name}
                                                        </div>
                                                        {idx < order.stages.length - 1 && <ArrowRight className="h-3 w-3 text-slate-700 shrink-0" />}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Machine Status Sidebar */}
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-emerald-500" />
                                    {t('machine_activity')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {machinesList.map(machine => (
                                    <div key={machine.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                machine.status === 'operational' ? "bg-emerald-500" :
                                                    machine.status === 'maintenance' ? "bg-amber-500" : "bg-red-500"
                                            )}></div>
                                            <div>
                                                <p className="text-xs font-bold text-white">{machine.name}</p>
                                                <p className="text-[8px] uppercase font-black text-slate-500">{t(machine.type as any) || machine.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-white">{machine.healthScore}%</p>
                                            <Progress value={machine.healthScore} className="h-0.5 w-12 bg-slate-800" />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="orders">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="py-12 text-center">
                            <ClipboardList className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest">{t('production_order_management')}</p>
                            <Button variant="outline" className="mt-4 border-slate-800 text-slate-400 hover:text-white" onClick={fetchData}>
                                {t('refresh_registry')}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="machines">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="py-12 text-center">
                            <Wrench className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest">{t('asset_fleet_monitoring')}</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bom">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="py-12 text-center">
                            <Settings className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest">{t('bom_configuration_center')}</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
