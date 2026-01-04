"use client"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, isRTL } = useTranslation()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all px-4 rounded-none h-10",
        className
      )}
    >
      <Languages className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
      <span className="text-xs font-bold tracking-widest uppercase">
        {language === 'en' ? 'العربية' : 'English'}
      </span>
    </Button>
  )
}
