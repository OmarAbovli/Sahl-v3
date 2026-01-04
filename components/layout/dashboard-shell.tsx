"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
    Languages
} from "lucide-react"

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
    Calculator
}

interface DashboardShellProps {
    children: React.ReactNode
    userRole: string
    userName?: string
    navItems: { title: string; items: { name: string; href: string; iconName: string }[] }[]
}

export function DashboardShell({ children, userRole, userName, navItems }: DashboardShellProps) {
    const { t, language, setLanguage, isRTL } = useTranslation()
    const [open, setOpen] = React.useState(false)
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
