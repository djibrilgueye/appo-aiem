"use client"

import { LocaleContext } from "@/lib/locale-context"

export function AIProvider({ children }: { children: React.ReactNode }) {
  return (
    <LocaleContext.Provider value="fr">
      {children}
    </LocaleContext.Provider>
  )
}
