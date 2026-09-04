"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Settings, LogOut, ChevronDown, LayoutDashboard, Map as MapIcon } from "lucide-react"
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
  const isOnHome = pathname === "/" || pathname === "/app"
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Initiales de l'utilisateur (ex: "DG" pour Djibril Gueye)
  const userName = session?.user?.name || session?.user?.email || "Utilisateur"
  const userInitials = userName
    .split(" ")
    .map(n => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()

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
    <header className="relative z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Liseré supérieur — dégradé APPO */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#0F3B57] via-[#2563EB] to-[#F4B942]" />

      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Gauche : brand lockup */}
        <Link href="/app" className="flex items-center gap-3 group shrink-0">
          <div className="rounded-xl p-1 bg-white border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/appo_logo.jpeg" alt="APPO" className="h-8 w-8 rounded-lg object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base leading-tight tracking-tight text-[#0F3B57]">
                AIEM
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="Système actif" />
            </div>
            <div className="text-[10px] font-medium tracking-wide text-slate-600">
              Africa Interactive Energy Map
            </div>
          </div>
        </Link>

        {/* Droite : navigation, langue, admin, profil */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sélecteur de langue */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 shadow-sm text-[#0F3B57] hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span className="text-sm">{current.flag}</span>
              <span className="tracking-wider">{current.code.toUpperCase()}</span>
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xl z-50 min-w-[145px]">
                {LANG_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => { setLang(opt.code); setLangOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors"
                    style={{
                      color: lang === opt.code ? "#0F3B57" : "#475569",
                      backgroundColor: lang === opt.code ? "#F4F7FA" : "transparent",
                    }}
                  >
                    <span className="text-sm">{opt.flag}</span>
                    <span className="flex-1">{opt.label}</span>
                    {lang === opt.code && <span className="text-[#0F3B57] font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Séparateur discret */}
          <div className="h-4 w-px bg-slate-200" />

          {/* Toggle Vue Générale / Carte */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/80">
            <Link
              href="/app"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                pathname === "/app"
                  ? "bg-white text-[#0F3B57] font-bold shadow-sm"
                  : "text-slate-500 hover:text-slate-900 font-semibold"
              }`}
            >
              <LayoutDashboard size={13} className="text-[#164E73]" />
              <span className="hidden sm:inline">Vue Générale</span>
            </Link>

            {isOnHome ? (
              <button
                onClick={onShowMap}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-all cursor-pointer"
              >
                <MapIcon size={13} className="text-[#0284C7]" />
                <span>Carte</span>
              </button>
            ) : (
              <Link
                href="/app?view=map"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-all"
              >
                <MapIcon size={13} className="text-[#0284C7]" />
                <span>Carte</span>
              </Link>
            )}
          </div>

          {/* Bouton Admin */}
          {session && ["admin", "editor"].includes(session.user?.role) && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-[#0F3B57] hover:bg-[#0F3B57] hover:text-white shadow-sm transition-all"
            >
              <Settings size={13} />
              <span className="hidden sm:inline">{t.nav.admin}</span>
            </Link>
          )}

          {/* Profil utilisateur */}
          {session ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-sm">
                <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white bg-gradient-to-tr from-[#0F3B57] to-[#164E73] shadow-sm">
                  {userInitials}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-slate-800">
                  {userName}
                </span>
              </div>

              <button
                onClick={() => signOut()}
                title="Se déconnecter"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F3B57] hover:bg-[#164E73] shadow-md transition-all"
            >
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
