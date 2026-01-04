"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    Loader2,
    X,
    Users,
    Package,
    FileText,
    Building2,
    Briefcase,
    TrendingUp,
    Calendar,
    Boxes,
    FolderKanban,
    Command
} from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { globalSearch } from "@/actions/global-search"
import { useRouter } from "next/navigation"import { cn } from "@/lib/utils"

interface GlobalSearchBarProps {
    companyId: number
}

export function GlobalSearchBar({ companyId }: GlobalSearchBarProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isSearching, setIsSearching] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [activeCategory, setActiveCategory] = useState<string>("all")

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Search with debouncing
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([])
            return
        }

        const timer = setTimeout(() => {
            performSearch()
        }, 300)

        return () => clearTimeout(timer)
    }, [query, companyId])

    const performSearch = async () => {
        setIsSearching(true)
        const res = await globalSearch(query, companyId)
        if (res.success) {
            setResults(res.data?.results || [])
        }
        setIsSearching(false)
    }

    const handleSelect = (result: any) => {
        router.push(result.url)
        setIsOpen(false)
        setQuery("")
        setResults([])
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % filteredResults.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length)
            } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
                e.preventDefault()
                handleSelect(filteredResults[selectedIndex])
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, selectedIndex, results])

    const filteredResults = activeCategory === "all"
        ? results
        : results.filter(r => r.type === activeCategory)

    const getTypeIcon = (type: string) => {
        const icons: Record<string, any> = {
            customer: Users,
            supplier: Building2,
            product: Package,
            sales_invoice: FileText,
            purchase_invoice: FileText,
            employee: Briefcase,
            fixed_asset: Boxes,
            cost_center: FolderKanban,
            journal_entry: Calendar
        }
        return icons[type] || FileText
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            customer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            supplier: "bg-purple-500/10 text-purple-500 border-purple-500/20",
            product: "bg-green-500/10 text-green-500 border-green-500/20",
            sales_invoice: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            employee: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
            fixed_asset: "bg-orange-500/10 text-orange-500 border-orange-500/20",
            cost_center: "bg-pink-500/10 text-pink-500 border-pink-500/20",
            journal_entry: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
        }
        return colors[type] || "bg-slate-700 text-slate-400"
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 px-4 h-10 bg-slate-900 border border-slate-800 rounded-none text-slate-500 hover:text-white hover:border-amber-500/30 transition-all group w-64"
            >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search...</span>
                <div className="ml-auto flex items-center gap-1">
                    <kbd className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 border border-slate-700 rounded">
                        {typeof navigator !== 'undefined' && navigator.platform.indexOf('Mac') !== -1 ? '⌘' : 'Ctrl'}
                    </kbd>
                    <kbd className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 border border-slate-700 rounded">K</kbd>
                </div>
            </button>

            {/* Search Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-3xl p-0 overflow-hidden rounded-none shadow-3xl">
                    <div className="h-1 bg-amber-500 w-full shadow-lg shadow-amber-500/20"></div>

                    {/* Search Input */}
                    <div className="p-6 pb-0">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search customers, invoices, products, employees..."
                                className="bg-slate-900 border-slate-800 h-14 pl-12 pr-12 text-lg rounded-none focus:border-amber-500/50"
                                autoFocus
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500 animate-spin" />
                            )}
                            {query && !isSearching && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="h-4 w-4 text-slate-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Filters */}
                    {results.length > 0 && (
                        <div className="px-6 pt-4 flex gap-2 overflow-x-auto pb-2">
                            {['all', 'customer', 'product', 'sales_invoice', 'employee', 'fixed_asset'].map(cat => {
                                const count = cat === 'all' ? results.length : results.filter(r => r.type === cat).length
                                if (count === 0 && cat !== 'all') return null

                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            "px-4 py-2 text-xs uppercase font-bold tracking-widest rounded-none transition-all whitespace-nowrap",
                                            activeCategory === cat
                                                ? "bg-amber-500 text-black"
                                                : "bg-slate-900 text-slate-500 hover:text-white border border-slate-800"
                                        )}
                                    >
                                        {cat.replace('_', ' ')} ({count})
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Results */}
                    <div className="max-h-[500px] overflow-y-auto p-6 pt-4">
                        {query.length < 2 && (
                            <div className="text-center py-16">
                                <Command className="h-16 w-16 mx-auto text-slate-800 mb-4 opacity-20" />
                                <p className="text-slate-600 text-sm">Type to search across all modules...</p>
                                <p className="text-slate-700 text-xs mt-2">Customers • Invoices • Products • Employees • Assets</p>
                            </div>
                        )}

                        {query.length >= 2 && filteredResults.length === 0 && !isSearching && (
                            <div className="text-center py-16">
                                <Search className="h-16 w-16 mx-auto text-slate-800 mb-4 opacity-20" />
                                <p className="text-slate-600 italic">No results found for "{query}"</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <AnimatePresence>
                                {filteredResults.map((result, idx) => {
                                    const Icon = getTypeIcon(result.type)
                                    const isSelected = idx === selectedIndex

                                    return (
                                        <motion.button
                                            key={`${result.type}-${result.id}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => handleSelect(result)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 border rounded-none transition-all text-left",
                                                isSelected
                                                    ? "border-amber-500 bg-amber-500/10"
                                                    : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                                            )}
                                        >
                                            <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                                                <Icon className="h-5 w-5 text-amber-500" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-white font-medium truncate">{result.title}</h4>
                                                    <Badge className={`${getTypeColor(result.type)} text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 flex-shrink-0`}>
                                                        {result.type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="font-mono">{result.subtitle}</span>
                                                    {result.description && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate">{result.description}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <kbd className="px-2 py-1 text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 rounded text-amber-500">
                                                        ↵
                                                    </kbd>
                                                </div>
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">↑</kbd>
                                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">↓</kbd>
                                <span className="ml-1">Navigate</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">↵</kbd>
                                <span className="ml-1">Select</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Esc</kbd>
                                <span className="ml-1">Close</span>
                            </div>
                        </div>
                        {filteredResults.length > 0 && (
                            <span className="text-amber-500 font-bold">{filteredResults.length} results</span>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
