"use client"

import { createContext, useContext } from "react"

export type Locale = "fr" | "en"

export const LocaleContext = createContext<Locale>("fr")

export function useLocale() {
  return useContext(LocaleContext)
}
