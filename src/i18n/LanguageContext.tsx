"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { translations, Lang, Translations } from "./translations"

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "fr",
  setLang: () => {},
  t: translations.fr,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fr"
    const stored =
      (localStorage.getItem("aiem_lang") as Lang | null) ??
      (localStorage.getItem("ihma_lang") as Lang | null)
    return stored && ["fr", "en", "pt"].includes(stored) ? stored : "fr"
  })

  useEffect(() => {
    const legacy = localStorage.getItem("ihma_lang") as Lang | null
    const current = localStorage.getItem("aiem_lang") as Lang | null
    if (!current && legacy && ["fr", "en", "pt"].includes(legacy)) {
      localStorage.setItem("aiem_lang", legacy)
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem("aiem_lang", l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
