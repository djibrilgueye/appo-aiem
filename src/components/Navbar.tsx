"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Settings, User, LogOut } from "lucide-react"
import { useLanguage } from "@/i18n/LanguageContext"
import type { Lang } from "@/i18n/translations"

const LANGS: Lang[] = ["fr", "en", "pt"]

interface NavbarProps {
  onShowMap?: () => void
}

export function Navbar({ onShowMap }: NavbarProps) {
  const { data: session } = useSession()
  const { lang, setLang, t } = useLanguage()

  return (
    <nav style={{ backgroundColor: "#ffffff", borderBottom: "3px solid #F4B942", boxShadow: "0 1px 8px rgba(27,79,114,0.1)" }} className="px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo + Title */}
        <Link href="/" className="flex items-center gap-3">
          <div style={{ backgroundColor: "#EBF3FB", border: "1px solid #A3C4DC" }} className="rounded-lg p-1">
            <img src="/appo_logo.jpeg" alt="APPO" className="h-9 w-9 rounded object-contain bg-white" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight" style={{ color: "#1B4F72", fontFamily: "Arial, sans-serif" }}>
              AIEM
            </div>
            <div className="text-xs leading-tight" style={{ color: "#5B8FB9", fontFamily: "Arial, sans-serif" }}>
              Africa Interactive Energy Map
            </div>
          </div>

        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1">

          {/* Language selector */}
          <div className="flex items-center gap-0.5 mr-2 p-0.5 rounded-lg" style={{ backgroundColor: "#F4F7FB", border: "1px solid #D0E4F0" }}>
            {LANGS.map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-2 py-1 rounded text-xs font-bold transition-colors"
                style={{
                  backgroundColor: lang === l ? "#1B4F72" : "transparent",
                  color: lang === l ? "#ffffff" : "#5B8FB9",
                  fontFamily: "Arial, sans-serif",
                  letterSpacing: "0.05em",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Map button — sets viewMode to map */}
          <button
            onClick={onShowMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors hover:bg-[#EBF3FB]"
            style={{ color: "#1B4F72", fontFamily: "Arial, sans-serif", border: "none", background: "none", cursor: "pointer" }}
          >
            <span>🗺️</span>
            <span>{t.nav.map}</span>
          </button>

          {session ? (
            <>
              {["admin", "editor"].includes(session.user.role) && (
                <Link href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors hover:bg-[#EBF3FB]"
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
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors hover:bg-red-50"
                style={{ color: "#9CA3AF" }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login"
              className="px-4 py-1.5 rounded text-sm font-bold transition-colors hover:opacity-90"
              style={{ backgroundColor: "#F4B942", color: "#0D2840", fontFamily: "Arial, sans-serif" }}>
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
