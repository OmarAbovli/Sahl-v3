"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Diamond, Loader2, ArrowRight } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

export function LoginForm() {
  const { t, isRTL } = useTranslation()
  const [uniqueKey, setUniqueKey] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueKey, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setTimeout(() => {
          switch (data.user.role) {
            case "super_admin":
              router.push("/super-admin")
              break
            case "company_admin":
              router.push("/company-admin")
              break
            case "employee":
              router.push("/employee")
              break
            default:
              router.push("/login")
          }
        }, 800);
      } else {
        setError(data.error || t('login_failed'))
        setIsLoading(false)
      }
    } catch (error) {
      setError(t('error_occurred'))
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-slate-900/50 border border-slate-800 p-10 backdrop-blur-sm shadow-2xl relative overflow-hidden"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

      <div className="mb-10 text-center relative">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <Diamond className="w-5 h-5 text-amber-500" />
          <span className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase">{t('enterprise_access')}</span>
        </motion.div>

        <h1 className="text-3xl font-light text-white tracking-tight">
          Sahl <span className="font-bold">ERP</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold ml-1">{t('client_key')}</label>
            <div className="relative group">
              <Input
                type="text"
                value={uniqueKey}
                onChange={(e) => setUniqueKey(e.target.value)}
                className="h-12 bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all duration-300 rounded-none text-sm placeholder:text-slate-700 font-sans"
                placeholder={t('enter_unique_key')}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold ml-1">{t('password')}</label>
            <div className="relative group">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all duration-300 rounded-none text-sm placeholder:text-slate-700 pr-10 font-sans"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={isRTL ? "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-500 transition-colors" : "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-500 transition-colors"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-400 text-xs text-center py-2 bg-red-500/5 border border-red-500/10"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          className="w-full h-12 bg-white text-black hover:bg-amber-50 rounded-none font-medium tracking-wide transition-all duration-300 border border-transparent hover:border-amber-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs uppercase tracking-widest">{t('verifying')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold">{t('secure_login')}</span>
              <ArrowRight className={isRTL ? "w-4 h-4 rotate-180" : "w-4 h-4"} />
            </div>
          )}
        </Button>
      </form>
    </motion.div>
  )
}
