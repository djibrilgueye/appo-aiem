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
  const [lang, setLangState] = useState<Lang>("fr")

  useEffect(() => {
    const stored =
      (localStorage.getItem("aiem_lang") as Lang | null) ??
      (localStorage.getItem("ihma_lang") as Lang | null)
    if (stored && ["fr", "en", "pt", "es", "ar"].includes(stored)) {
      setLangState(stored)
      localStorage.setItem("aiem_lang", stored)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }, [lang])

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
