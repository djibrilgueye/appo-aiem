"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Settings, User, LogOut, ChevronDown } from "lucide-react"
import { useLanguage } from "@/i18n/LanguageContext"
import type { Lang } from "@/i18n/translations"
import { useState, useRef, useEffect } from "react"

const LANG_OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
]

interface NavbarProps {
  onShowMap?: () => void
}

export function Navbar({ onShowMap }: NavbarProps) {
  const { data: session } = useSession()
  const { lang, setLang, t } = useLanguage()
  const pathname = usePathname()
  const isOnHome = pathname === "/"
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const current = LANG_OPTIONS.find(l => l.code === lang) ?? LANG_OPTIONS[0]

  return (
    <nav style={{ backgroundColor: "#f0f4f8", borderBottom: "2px solid #D0E4F0", boxShadow: "0 1px 6px rgba(27,79,114,0.08)" }} className="px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo + Title */}
        <Link href="/" className="flex items-center gap-3">
          <div style={{ border: "1px solid #D0E4F0" }} className="rounded-lg p-1">
            <img src="/appo_logo.jpeg" alt="APPO" className="h-9 w-9 rounded object-contain bg-white" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight" style={{ color: "#0D2840", fontFamily: "Arial, sans-serif" }}>
              AIEM
            </div>
            <div className="text-xs leading-tight" style={{ color: "#5B8FB9", fontFamily: "Arial, sans-serif" }}>
              Africa Interactive Energy Map
            </div>
          </div>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1">

          {/* Language selector — flag dropdown */}
          <div ref={langRef} className="relative mr-2">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #D0E4F0",
                color: "#1B4F72",
                cursor: "pointer",
                fontFamily: "Arial, sans-serif",
              }}
            >
              <span className="text-base leading-none">{current.flag}</span>
              <span style={{ letterSpacing: "0.04em" }}>{current.code.toUpperCase()}</span>
              <ChevronDown size={12} style={{ color: "#5B8FB9", transform: langOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>

            {langOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #D0E4F0",
                  boxShadow: "0 4px 20px rgba(27,79,114,0.12)",
                  zIndex: 9999,
                  minWidth: "148px",
                }}
              >
                {LANG_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => { setLang(opt.code); setLangOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs transition-colors"
                    style={{
                      backgroundColor: lang === opt.code ? "#EBF3FB" : "transparent",
                      color: lang === opt.code ? "#1B4F72" : "#475569",
                      fontWeight: lang === opt.code ? "bold" : "normal",
                      fontFamily: "Arial, sans-serif",
                      cursor: "pointer",
                      border: "none",
                      direction: opt.code === "ar" ? "rtl" : "ltr",
                    }}
                  >
                    <span className="text-base leading-none">{opt.flag}</span>
                    <span>{opt.label}</span>
                    {lang === opt.code && <span style={{ marginLeft: "auto", color: "#1B4F72" }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map button — on home calls onShowMap, elsewhere navigates to /?view=map */}
          {isOnHome ? (
            <button
              onClick={onShowMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
              style={{ color: "#1B4F72", fontFamily: "Arial, sans-serif", border: "none", background: "none", cursor: "pointer" }}
            >
              <span>🗺️</span>
              <span>{t.nav.map}</span>
            </button>
          ) : (
            <Link
              href="/app?view=map"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
              style={{ color: "#1B4F72", fontFamily: "Arial, sans-serif" }}
            >
              <span>🗺️</span>
              <span>{t.nav.map}</span>
            </Link>
          )}

          {session ? (
            <>
              {["admin", "editor"].includes(session.user.role) && (
                <Link href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
                  style={{ color: "#1B4F72", fontFamily: "Arial, sans-serif" }}>
                  <Settings size={16} />
                  <span>{t.nav.admin}</span>
                </Link>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                style={{ color: "#5B8FB9", fontFamily: "Arial, sans-serif" }}>
                <User size={16} />
                <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
              </div>
              <button onClick={() => signOut()}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors"
                style={{ color: "#5B8FB9", background: "none", border: "none", cursor: "pointer" }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login"
              className="px-4 py-1.5 rounded text-sm font-bold transition-colors hover:opacity-90"
              style={{ backgroundColor: "#1B4F72", color: "#ffffff", fontFamily: "Arial, sans-serif" }}>
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
