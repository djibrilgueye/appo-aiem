"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageContext"

interface ThemeEntry { icon: string; label: string; desc: string }
interface SourceEntry { icon: string; label: string; text: string }

// Color palette for stat cards — cycles through accent colors
const CARD_ACCENTS = [
  "#1B4F72", "#2E7D52", "#7B3F8C", "#B5451B",
  "#1A6E8E", "#7D5A00", "#1B4F72", "#4A1B72",
  "#1B5E20", "#8B2500",
]

export function Overview() {
  const { t, lang } = useLanguage()
  const [stats, setStats] = useState({
    countries: 0, basins: 0, refineries: 0, pipelines: 0,
    training: 0, rnd: 0, storage: 0, petrochem: 0,
    reserves_countries: 0, production_countries: 0,
  })
  const [themes, setThemes] = useState<ThemeEntry[] | null>(null)
  const [sources, setSources] = useState<SourceEntry[] | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/countries").then(r => r.json()).catch(() => []),
      fetch("/api/basins?all=1").then(r => r.json()).catch(() => []),
      fetch("/api/refineries").then(r => r.json()).catch(() => []),
      fetch("/api/pipelines").then(r => r.json()).catch(() => []),
      fetch("/api/training").then(r => r.json()).catch(() => []),
      fetch("/api/rnd").then(r => r.json()).catch(() => []),
      fetch("/api/storage").then(r => r.json()).catch(() => []),
      fetch("/api/petrochem").then(r => r.json()).catch(() => []),
      fetch("/api/reserves").then(r => r.json()).catch(() => []),
      fetch("/api/production").then(r => r.json()).catch(() => []),
    ]).then(([countries, basins, refineries, pipelines, training, rnd, storage, petrochem, reserves, production]) => {
      setStats({
        countries:            Array.isArray(countries)   ? countries.length : 0,
        basins:               Array.isArray(basins)       ? basins.length : 0,
        refineries:           Array.isArray(refineries)   ? refineries.length : 0,
        pipelines:            Array.isArray(pipelines)    ? pipelines.length : 0,
        training:             Array.isArray(training)     ? training.length : 0,
        rnd:                  Array.isArray(rnd)          ? rnd.length : 0,
        storage:              Array.isArray(storage)      ? storage.length : 0,
        petrochem:            Array.isArray(petrochem)    ? petrochem.length : 0,
        reserves_countries:   Array.isArray(reserves)    ? new Set(reserves.map((r: any) => r.countryId || r.country?.id)).size : 0,
        production_countries: Array.isArray(production)  ? new Set(production.map((p: any) => p.countryId || p.country?.id)).size : 0,
      })
    })
  }, [])

  useEffect(() => {
    setThemes(null)
    setSources(null)
    Promise.all([
      fetch(`/api/admin/content?key=themes&lang=${lang}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/admin/content?key=sources&lang=${lang}`).then(r => r.json()).catch(() => ({})),
    ]).then(([themesData, sourcesData]) => {
      setThemes(Array.isArray(themesData[lang]) ? themesData[lang] : null)
      setSources(Array.isArray(sourcesData[lang]) ? sourcesData[lang] : null)
    })
  }, [lang])

  const displayThemes: ThemeEntry[] = themes ?? (t.overview.themes as readonly { icon: string; label: string; desc: string }[]).map(th => ({
    icon: th.icon, label: th.label, desc: th.desc,
  }))

  const statCards = [
    { icon: "🌍", stat: stats.countries,            data: t.overview.stats.countries,  href: "/app?view=map&theme=countries" },
    { icon: "🗺️", stat: stats.basins,               data: t.overview.stats.basins,     href: "/app?view=map&theme=basins" },
    { icon: "🟢", stat: stats.reserves_countries,   data: t.overview.stats.reserves,   href: "/app?view=map&theme=oil_reserves" },
    { icon: "🔴", stat: stats.production_countries, data: t.overview.stats.production, href: "/app?view=map&theme=oil_production" },
    { icon: "🚇", stat: stats.pipelines,            data: t.overview.stats.pipelines,  href: "/app?view=map&theme=pipelines" },
    { icon: "🏭", stat: stats.refineries,           data: t.overview.stats.refineries, href: "/app?view=map&theme=refineries" },
    { icon: "🎓", stat: stats.training,             data: t.overview.stats.training,   href: "/app?view=map&theme=training" },
    { icon: "🔬", stat: stats.rnd,                  data: t.overview.stats.rnd,        href: "/app?view=map&theme=rnd" },
    { icon: "🏪", stat: stats.storage,              data: t.overview.stats.storage,    href: "/app?view=map&theme=storage" },
    { icon: "🧬", stat: stats.petrochem,            data: t.overview.stats.petrochem,  href: "/app?view=map&theme=petrochem" },
  ]

  return (
    <div style={{ color: "#0D2840", fontFamily: "Arial, Helvetica, sans-serif" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 60% 50%, #daeaf7 0%, #eaf3fb 55%, #f0f6fc 100%)" }}>
        {/* Decorative geometry */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {/* Large circle top-right */}
          <div className="absolute" style={{
            width: 420, height: 420, borderRadius: "50%",
            right: -80, top: -120,
            background: "radial-gradient(circle, rgba(91,142,185,0.12) 0%, transparent 70%)",
          }} />
          {/* Small circle bottom-left */}
          <div className="absolute" style={{
            width: 200, height: 200, borderRadius: "50%",
            left: -40, bottom: -60,
            background: "radial-gradient(circle, rgba(244,185,66,0.08) 0%, transparent 70%)",
          }} />
          {/* Diagonal accent line */}
          <div className="absolute" style={{
            width: 2, height: "140%", top: "-20%", right: "18%",
            background: "linear-gradient(to bottom, transparent, rgba(244,185,66,0.15), transparent)",
            transform: "rotate(-15deg)",
          }} />
          <div className="absolute" style={{
            width: 1, height: "140%", top: "-20%", right: "24%",
            background: "linear-gradient(to bottom, transparent, rgba(91,142,185,0.1), transparent)",
            transform: "rotate(-15deg)",
          }} />
          {/* Large watermark continent */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 select-none pointer-events-none"
            style={{ fontSize: 160, opacity: 0.04, lineHeight: 1 }}>🌍</div>
        </div>

        {/* Gold top border */}
        <div className="absolute top-0 left-0 right-0" style={{ height: 3, background: "linear-gradient(90deg, #F4B942 0%, #F7D078 50%, #F4B942 100%)" }} />

        <div className="relative px-10 py-10 max-w-5xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-5">
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#1B4F72" }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72", letterSpacing: "0.15em" }}>
              {t.overview.badge}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-bold mb-3 leading-tight" style={{ fontSize: 36, color: "#0D2840" }}>
            {t.overview.title}<span style={{
              background: "linear-gradient(90deg, #F4B942, #D4920A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>{t.overview.titleHighlight}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base max-w-2xl leading-relaxed mb-4" style={{ color: "#3D6A8A" }}
            dangerouslySetInnerHTML={{ __html: t.overview.subtitle }} />

          {/* Hint banner */}
          <div className="inline-flex items-start gap-3 px-5 py-3 rounded-xl"
            style={{
              backgroundColor: "rgba(27,79,114,0.07)",
              border: "1.5px solid rgba(27,79,114,0.22)",
              boxShadow: "0 2px 8px rgba(27,79,114,0.08)",
              maxWidth: "640px",
            }}>
            <span style={{ fontSize: 16, lineHeight: "20px", flexShrink: 0 }}>💡</span>
            <p className="text-sm leading-snug" style={{ color: "#1B4F72", fontWeight: 500 }}>
              {t.overview.hint}
            </p>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 1, backgroundColor: "rgba(27,79,114,0.1)" }} />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-8 max-w-7xl mx-auto space-y-10">

        {/* Stats grid */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-5 w-1 rounded-full" style={{ background: "linear-gradient(to bottom, #F4B942, #F7D078)" }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72" }}>
              {t.overview.dataSection}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: "#D0E4F0" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {statCards.map((card, i) => (
              <Link key={card.data.label} href={card.href}
                className="group block rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #D0E4F0",
                  boxShadow: "0 1px 4px rgba(27,79,114,0.06)",
                  textDecoration: "none",
                  borderTop: `3px solid ${CARD_ACCENTS[i % CARD_ACCENTS.length]}`,
                }}>
                {/* Icon container */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-base"
                  style={{
                    backgroundColor: `${CARD_ACCENTS[i % CARD_ACCENTS.length]}14`,
                    border: `1px solid ${CARD_ACCENTS[i % CARD_ACCENTS.length]}28`,
                  }}>
                  {card.icon}
                </div>
                {/* Value */}
                <div className="text-2xl font-bold tabular-nums mb-0.5" style={{ color: CARD_ACCENTS[i % CARD_ACCENTS.length] }}>
                  {card.stat}
                </div>
                {/* Label */}
                <div className="text-xs font-semibold leading-snug" style={{ color: "#0D2840" }}>
                  {card.data.label}
                </div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: "#5B8FB9" }}>
                  {card.data.sub}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Themes grid */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-5 w-1 rounded-full" style={{ background: "linear-gradient(to bottom, #F4B942, #F7D078)" }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72" }}>
              {t.overview.themesSection}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: "#D0E4F0" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayThemes.map((theme, i) => (
              <div key={i} className="group flex items-start gap-3 rounded-xl px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ backgroundColor: "#ffffff", border: "1px solid #D0E4F0", boxShadow: "0 1px 4px rgba(27,79,114,0.04)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: "#EBF3FB", border: "1px solid #D0E4F0" }}>
                  {theme.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight mb-1" style={{ color: "#0D2840" }}>{theme.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "#5B8FB9" }}>{theme.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-5 w-1 rounded-full" style={{ background: "linear-gradient(to bottom, #F4B942, #F7D078)" }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72" }}>
              {t.overview.sourcesSection}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: "#D0E4F0" }} />
          </div>
          <div className="rounded-xl px-6 py-5" style={{ backgroundColor: "#ffffff", border: "1px solid #D0E4F0", boxShadow: "0 1px 4px rgba(27,79,114,0.06)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs">
              {sources
                ? sources.map((s, i) => (
                    <div key={i} className="flex items-start gap-2" style={{ color: "#5B8FB9" }}>
                      <span className="mt-0.5 shrink-0">{s.icon}</span>
                      <span><strong style={{ color: "#0D2840" }}>{s.label} :</strong> {s.text}</span>
                    </div>
                  ))
                : <>
                    <div className="flex items-start gap-2" style={{ color: "#5B8FB9" }}><span className="shrink-0">📊</span><span><strong style={{ color: "#0D2840" }}>Réserves :</strong> OPEC Annual Statistical Bulletin — Energy Institute Statistical Review of World Energy</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#5B8FB9" }}><span className="shrink-0">⚡</span><span><strong style={{ color: "#0D2840" }}>Production :</strong> IEA World Energy Balances (WBES) — OPEC Monthly Oil Market Report</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#5B8FB9" }}><span className="shrink-0">🗺️</span><span><strong style={{ color: "#0D2840" }}>Bassins :</strong> USGS World Petroleum Assessment — AAPG/CGG Robertson Tellus</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#5B8FB9" }}><span className="shrink-0">🚇</span><span><strong style={{ color: "#0D2840" }}>Pipelines :</strong> Global Energy Monitor — Gas & Oil Infrastructure Trackers</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#5B8FB9" }}><span className="shrink-0">🏭</span><span><strong style={{ color: "#0D2840" }}>Raffineries :</strong> Oil & Gas Journal Worldwide Refining Survey — ARDA</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#5B8FB9" }}><span className="shrink-0">🎓</span><span><strong style={{ color: "#0D2840" }}>Formation :</strong> APPO Forum of Directors of Oil & Gas Training Institutes</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#5B8FB9" }}><span className="shrink-0">🏪</span><span><strong style={{ color: "#0D2840" }}>Stockage :</strong> GIIGNL Annual Report — Global Energy Monitor</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#5B8FB9" }}><span className="shrink-0">🧬</span><span><strong style={{ color: "#0D2840" }}>Pétrochimie :</strong> GlobalData — publications des opérateurs</span></div>
                  </>
              }
            </div>
            <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid #EBF3FB" }}>
              <span className="text-xs" style={{ color: "#A3C4DC" }}>
                AIEM — Africa Interactive Energy Map &nbsp;|&nbsp; APPO © 2026
              </span>
              <span className="text-xs" style={{ color: "#D0E4F0" }}>
                Données à titre indicatif
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
