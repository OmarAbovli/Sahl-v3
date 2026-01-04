"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Language, getTranslation, type TranslationKeys } from "@/lib/translations"

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof TranslationKeys) => string
  isRTL: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    // Load language preference from localStorage or user preferences
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ar")) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    // Save language preference
    localStorage.setItem("language", language)

    // Update document direction for RTL languages
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = language

    // Add RTL class to body for styling
    if (language === "ar") {
      document.body.classList.add("rtl")
    } else {
      document.body.classList.remove("rtl")
    }
  }, [language])

  const t = (key: keyof TranslationKeys): string => {
    return getTranslation(key, language)
  }

  const isRTL = language === "ar"

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isRTL }}>{children}</TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
