"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Lightbulb,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    Users,
    Package,
    DollarSign,
    Settings,
    X,
    Eye,
    Archive,
    Loader2,
    Sparkles
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getActiveInsights, updateInsight, generateInsights } from "@/lib/ai-insights/insight-engine"
import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"

interface InsightsDashboardProps {
    companyId: number
}

export function InsightsDashboard({ companyId }: InsightsDashboardProps) {
    const { t } = useTranslation()
    const router = useRouter()
    const [insights, setInsights] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedInsight, setSelectedInsight] = useState<any>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string>("all")
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        fetchInsights()
    }, [companyId, activeCategory])

    async function fetchInsights() {
        setIsLoading(true)
        const category = activeCategory === "all" ? undefined : activeCategory as any
        const res = await getActiveInsights(companyId, category)
        if (res.success) {
            setInsights(res.data || [])
        }
        setIsLoading(false)
    }

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            await generateInsights(companyId)
            toast.success("AI insights generated successfully")
            fetchInsights()
        } catch (error) {
            toast.error("Failed to generate insights")
        }
        setIsGenerating(false)
    }

    const handleViewDetails = (insight: any) => {
        setSelectedInsight(insight)
        setShowDetails(true)

        if (!insight.isRead) {
            updateInsight(insight.id, { isRead: true })
            fetchInsights()
        }
    }

    const handleArchive = async (insightId: number) => {
        await updateInsight(insightId, { isArchived: true })
        toast.success("Insight archived")
        fetchInsights()
    }

    const handleTakeAction = (url?: string) => {
        if (url) {
            router.push(url)
        }
        setShowDetails(false)
    }

    const getSeverityColor = (severity: string) => {
        if (severity === "critical") return "bg-red-500/10 text-red-500 border-red-500/20"
        if (severity === "high") return "bg-orange-500/10 text-orange-500 border-orange-500/20"
        if (severity === "medium") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }

    const getCategoryIcon = (category: string) => {
        if (category === "financial") return DollarSign
        if (category === "customer") return Users
        if (category === "inventory") return Package
        return Settings
    }

    const getCategoryColor = (category: string) => {
        if (category === "financial") return "text-emerald-500"
        if (category === "customer") return "text-blue-500"
        if (category === "inventory") return "text-purple-500"
        return "text-amber-500"
    }

    const unreadCount = insights.filter(i => !i.isRead).length
    const criticalCount = insights.filter(i => i.severity === "critical").length

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
                        <Sparkles className="h-8 w-8 text-amber-500" />
                        AI-Powered Insights
                    </h2>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-2 font-bold">
                        Proactive Business Intelligence & Smart Recommendations
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    {unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white h-6 px-3 rounded-full">
                            {unreadCount} New
                        </Badge>
                    )}
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-none h-11 px-8 shadow-xl shadow-amber-600/10 transition-all font-bold uppercase tracking-widest text-[10px]"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Generate Insights
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-bold">Total Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-light text-white">{insights.length}</div>
                            <Lightbulb className="h-8 w-8 text-slate-700" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-900/20 to-slate-950 border-red-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-red-500 text-xs uppercase tracking-widest font-bold">Critical</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-light text-white">{criticalCount}</div>
                            <AlertTriangle className="h-8 w-8 text-red-700" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-900/20 to-slate-950 border-emerald-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-emerald-500 text-xs uppercase tracking-widest font-bold">Financial</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-light text-white">
                                {insights.filter(i => i.category === "financial").length}
                            </div>
                            <DollarSign className="h-8 w-8 text-emerald-700" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/20 to-slate-950 border-blue-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-blue-500 text-xs uppercase tracking-widest font-bold">Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-light text-white">
                                {insights.filter(i => i.category === "customer").length}
                            </div>
                            <Users className="h-8 w-8 text-blue-700" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 border-b border-slate-800">
                {['all', 'financial', 'customer', 'inventory', 'operational'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${activeCategory === cat
                                ? "text-amber-500 border-b-2 border-amber-500"
                                : "text-slate-500 hover:text-slate-400"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Insights List */}
            <div className="space-y-4">
                {insights.map((insight, idx) => {
                    const CategoryIcon = getCategoryIcon(insight.category)

                    return (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className={`border-slate-800 hover:border-amber-500/30 transition-all ${!insight.isRead ? 'bg-amber-500/5' : 'bg-slate-900'}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`h-12 w-12 rounded-full bg-slate-950 flex items-center justify-center flex-shrink-0 ${getCategoryColor(insight.category)}`}>
                                                <CategoryIcon className="h-6 w-6" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-white font-medium text-lg">{insight.title}</h3>
                                                    <Badge className={`${getSeverityColor(insight.severity)} text-[8px] uppercase tracking-widest font-bold px-2 py-0.5`}>
                                                        {insight.severity}
                                                    </Badge>
                                                    {!insight.isRead && (
                                                        <Badge className="bg-amber-500 text-black text-[8px] uppercase tracking-widest font-bold px-2 py-0.5">
                                                            NEW
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm mb-3">{insight.description}</p>
                                                <div className="text-xs text-slate-600">
                                                    {new Date(insight.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                onClick={() => handleViewDetails(insight)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-amber-500 h-8 w-8 p-0"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                onClick={() => handleArchive(insight.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-red-500 h-8 w-8 p-0"
                                            >
                                                <Archive className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}

                {insights.length === 0 && (
                    <div className="py-32 text-center border border-slate-800 bg-slate-950/20">
                        <Sparkles className="h-16 w-16 mx-auto text-slate-800 mb-6 opacity-20" />
                        <p className="text-slate-600 italic text-sm mb-4">No insights available</p>
                        <Button
                            onClick={handleGenerate}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            Generate First Insights
                        </Button>
                    </div>
                )}
            </div>

            {/* Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-2xl p-0 overflow-hidden rounded-none shadow-3xl">
                    <div className="h-1 bg-amber-500 w-full shadow-lg shadow-amber-500/20"></div>
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-2xl font-light tracking-tight">
                            Insight Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedInsight && (
                        <div className="p-10 space-y-6">
                            <div>
                                <Badge className={`${getSeverityColor(selectedInsight.severity)} mb-3`}>
                                    {selectedInsight.severity.toUpperCase()}
                                </Badge>
                                <h3 className="text-xl text-white font-medium mb-2">{selectedInsight.title}</h3>
                                <p className="text-slate-400">{selectedInsight.description}</p>
                            </div>

                            {selectedInsight.metadata && (
                                <div>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-600 tracking-widest mb-2">Additional Data</h4>
                                    <pre className="bg-slate-900 border border-slate-800 p-4 rounded-none text-xs text-slate-300 overflow-x-auto font-mono">
                                        {JSON.stringify(JSON.parse(selectedInsight.metadata), null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-800">
                                {selectedInsight.actionUrl && (
                                    <Button
                                        onClick={() => handleTakeAction(selectedInsight.actionUrl)}
                                        className="bg-amber-600 hover:bg-amber-700 flex-1"
                                    >
                                        Take Action
                                    </Button>
                                )}
                                <Button
                                    onClick={() => handleArchive(selectedInsight.id)}
                                    variant="outline"
                                    className="border-slate-700 text-slate-400 hover:bg-slate-900"
                                >
                                    Archive
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
