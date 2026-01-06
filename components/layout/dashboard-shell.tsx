"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useTranslation } from "@/hooks/use-translation"
import {
    LayoutDashboard,
    Users,
    FileText,
    Package,
    Menu,
    LogOut,
    Diamond,
    Warehouse,
    BarChart3,
    Settings,
    CreditCard,
    TrendingUp,
    ShoppingCart,
    Banknote,
    Building,
    BookOpen,
    Calculator,
    Languages,
    Bell,
    Activity,
    Calendar,
    Search,
    Factory
} from "lucide-react"
import { getRecentActivity, getAIInsights } from "@/actions/dashboard"

// Icon Mapping
const IconMap: Record<string, any> = {
    LayoutDashboard,
    Users,
    FileText,
    Package,
    Warehouse,
    BarChart3,
    Settings,
    CreditCard,
    TrendingUp,
    ShoppingCart,
    Banknote,
    Building,
    BookOpen,
    Calculator,
    Factory
}

interface DashboardShellProps {
    children: React.ReactNode
    userRole: string
    userName?: string
    companyId?: number
    navItems: { title: string; items: { name: string; href: string; iconName: string }[] }[]
}

export function DashboardShell({ children, userRole, userName, companyId, navItems }: DashboardShellProps) {
    const { t, language, setLanguage, isRTL } = useTranslation()
    const [open, setOpen] = React.useState(false)
    const [notificationsOpen, setNotificationsOpen] = React.useState(false)
    const [notifications, setNotifications] = React.useState<any[]>([])
    const [aiInsights, setAiInsights] = React.useState<any[]>([])
    const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleSignOut = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            router.push("/login")
            router.refresh()
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en')
    }

    const fetchNotifications = async () => {
        if (!companyId) return
        setIsLoadingNotifications(true)
        setNotificationsOpen(true)
        try {
            const [logsRes, aiRes] = await Promise.all([
                getRecentActivity(companyId, 10),
                getAIInsights(companyId, 10)
            ])
            if (logsRes.success) setNotifications(logsRes.data)
            if (aiRes.success) setAiInsights(aiRes.data)
        } catch (err) {
            console.error("Failed to fetch notifications", err)
        } finally {
            setIsLoadingNotifications(false)
        }
    }

    // Identify current page name for Header
    const allItems = navItems.flatMap(g => g.items)
    const currentItem = allItems.find(i => {
        if (i.href.includes('?')) {
            const [path, query] = i.href.split('?')
            const itemParams = new URLSearchParams(query)
            const viewParam = itemParams.get('view')
            return viewParam && searchParams.get('view') === viewParam && pathname === path
        }
        return pathname === i.href
    })
    const pageName = currentItem ? t(currentItem.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_') as any) : t('dashboard')

    return (
        <div className={cn(
            "flex min-h-screen flex-col md:flex-row bg-[#020617] text-slate-200 selection:bg-amber-500/30",
            isRTL ? "font-arabic text-right selection:bg-amber-500/30" : "font-sans",
            isRTL && "rtl"
        )} dir={isRTL ? "rtl" : "ltr"}>
            {/* Mobile Sidebar Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn("md:hidden fixed z-40 top-4", isRTL ? "right-4" : "left-4")}
                    >
                        <Menu />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side={isRTL ? "right" : "left"} className="p-0 bg-slate-950 border-slate-800 w-64">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Menu</SheetTitle>
                        <SheetDescription>Navigation Menu</SheetDescription>
                    </SheetHeader>
                    <SidebarNav groups={navItems} pathname={pathname} />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className={cn(
                "hidden md:flex w-64 flex-col border-slate-800 bg-slate-950/50 backdrop-blur-xl fixed inset-y-0 z-30",
                isRTL ? "border-l right-0" : "border-r left-0"
            )}>
                <div className="flex h-16 items-center border-b border-slate-800 px-6 gap-2">
                    <Diamond className="w-5 h-5 text-amber-500" />
                    <span className="text-lg font-light text-white tracking-tight">Sahl <span className="font-bold">ERP</span></span>
                </div>
                <ScrollArea className="flex-1 py-4">
                    <SidebarNav groups={navItems} pathname={pathname} />
                </ScrollArea>
                <div className="border-t border-slate-800 p-4">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-500">
                            {userName ? userName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-200">{userName || 'User'}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{userRole.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 border-slate-800"
                        onClick={handleSignOut}
                    >
                        <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                        {t('logout')}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn("flex-1 flex flex-col min-h-screen relative overflow-hidden", isRTL ? "md:pr-64" : "md:pl-64")}>
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1e_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                {/* Top Header (Desktop) */}
                <header className="hidden md:flex h-16 items-center justify-between border-b border-slate-800 px-8 bg-slate-950/50 backdrop-blur-sm z-20 sticky top-0">
                    <h2 className={cn("text-xs font-black text-slate-500 uppercase tracking-[0.4em] transition-all hover:text-amber-500", isRTL && "font-arabic tracking-normal")}>
                        {pageName}
                    </h2>
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleLanguage}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all px-3"
                        >
                            <Languages className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {language === 'en' ? 'العربية' : 'English'}
                        </Button>

                        <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fetchNotifications}
                                className="h-10 w-10 text-slate-400 hover:text-white relative bg-slate-900 border border-slate-800"
                            >
                                <Bell className="h-4 w-4" />
                                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-amber-500 rounded-full border border-slate-950"></span>
                            </Button>
                            <SheetContent side={isRTL ? "left" : "right"} className="bg-slate-950 border-slate-800 p-0 w-80">
                                <div className="flex flex-col h-full">
                                    <SheetHeader className="p-6 border-b border-slate-800">
                                        <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
                                            <Bell className="h-4 w-4 text-amber-500" />
                                            {t('notifications' as any)}
                                        </SheetTitle>
                                        <SheetDescription className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">
                                            Audit Trail Insight
                                        </SheetDescription>
                                    </SheetHeader>
                                    <ScrollArea className="flex-1 p-4">
                                        <div className="space-y-6">
                                            {/* AI Insights Section */}
                                            {aiInsights.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] px-1">AI Intelligence</h4>
                                                    {aiInsights.map((insight) => (
                                                        <div key={insight.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg group hover:bg-amber-500/10 transition-all">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-[10px] font-black uppercase text-amber-500">{insight.insightType}</span>
                                                                <span className="text-[8px] font-mono text-slate-600">{new Date(insight.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-xs text-white font-bold leading-tight">{insight.title}</p>
                                                            <p className="text-[10px] text-slate-400 mt-2">
                                                                {insight.description}
                                                            </p>
                                                            {insight.actionUrl && (
                                                                <Button variant="link" className="p-0 h-auto text-[10px] text-amber-500 hover:text-amber-400 mt-2 uppercase font-bold" onClick={() => {
                                                                    router.push(insight.actionUrl)
                                                                    setNotificationsOpen(false)
                                                                }}>
                                                                    Analyze Details →
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Activity Logs Section */}
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] px-1">Recent Activity</h4>
                                                {isLoadingNotifications ? (
                                                    <div className="py-10 text-center text-slate-500 animate-pulse uppercase text-[10px] tracking-widest">Scanning logs...</div>
                                                ) : notifications.length > 0 ? (
                                                    notifications.map((log) => (
                                                        <div key={log.id} className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg group hover:border-slate-700 transition-all">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{log.tableName}</span>
                                                                <span className="text-[8px] font-mono text-slate-600">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-300 font-medium leading-tight">{log.action}</p>
                                                            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
                                                                {typeof log.details === 'string' ? log.details : 'Operation verified by system.'}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-10 text-center text-slate-600 flex flex-col items-center gap-3">
                                                        <Activity className="h-4 w-4 opacity-10" />
                                                        <p className="text-[10px] uppercase tracking-[0.2em] font-black">Quiet Sector</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </ScrollArea>
                                    <div className="p-4 border-t border-slate-800">
                                        <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest text-slate-500 hover:text-amber-500" onClick={() => setNotificationsOpen(false)}>
                                            Dismiss All
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                                {t('online')}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8 z-10">
                    {children}
                </div>
            </main>
        </div >
    )
}

interface SidebarNavProps {
    groups: { title: string; items: { name: string; href: string; iconName: string }[] }[]
    pathname: string
}

function SidebarNav({ groups, pathname }: SidebarNavProps) {
    const searchParams = useSearchParams()
    const { t, isRTL } = useTranslation()

    return (
        <nav className="flex flex-col gap-6 px-2">
            {groups.map((group, gIndex) => (
                <div key={gIndex} className="flex flex-col gap-1">
                    {group.title && (
                        <h4 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-2">
                            {t(group.title.toLowerCase().replace(/ /g, '_') as any)}
                        </h4>
                    )}
                    {group.items.map((item, index) => {
                        const Icon = IconMap[item.iconName] || Package

                        // Logic for active state
                        let isActive = false
                        if (item.href.includes('?')) {
                            const [path, query] = item.href.split('?')
                            const itemParams = new URLSearchParams(query)
                            const viewParam = itemParams.get('view')
                            if (viewParam && searchParams.get('view') === viewParam && pathname === path) {
                                isActive = true
                            }
                        } else {
                            isActive = pathname === item.href
                        }

                        if (pathname === '/employee' && !searchParams.get('view') && item.href === '/employee') {
                            isActive = true
                        }

                        // Use translation key derived from item name
                        const key = item.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')
                        const translatedName = t(key as any)

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-all duration-300",
                                    isActive
                                        ? "bg-amber-500/10 text-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)] border-l-2 border-amber-500"
                                        : "text-slate-500 hover:text-slate-100 hover:bg-slate-800/30",
                                    isActive && isRTL && "border-l-0 border-r-2"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {translatedName}
                            </Link>
                        )
                    })}
                </div>
            ))}
        </nav>
    )
}
