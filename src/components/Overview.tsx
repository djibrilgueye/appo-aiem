"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/i18n/LanguageContext"

interface ThemeEntry { icon: string; label: string; desc: string }
interface SourceEntry { icon: string; label: string; text: string }

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
      fetch("/api/basins").then(r => r.json()).catch(() => []),
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

  // Load dynamic content (themes + sources) for current language
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

  // Fall back to translation defaults if no DB content
  const displayThemes: ThemeEntry[] = themes ?? (t.overview.themes as readonly { icon: string; label: string; desc: string }[]).map(th => ({
    icon: th.icon,
    label: th.label,
    desc: th.desc,
  }))

  const statCards = [
    { icon: "🌍", stat: stats.countries,            data: t.overview.stats.countries },
    { icon: "🗺️", stat: stats.basins,               data: t.overview.stats.basins },
    { icon: "🟢", stat: stats.reserves_countries,   data: t.overview.stats.reserves },
    { icon: "🔴", stat: stats.production_countries, data: t.overview.stats.production },
    { icon: "🚇", stat: stats.pipelines,            data: t.overview.stats.pipelines },
    { icon: "🏭", stat: stats.refineries,           data: t.overview.stats.refineries },
    { icon: "🎓", stat: stats.training,             data: t.overview.stats.training },
    { icon: "🔬", stat: stats.rnd,                  data: t.overview.stats.rnd },
    { icon: "🏪", stat: stats.storage,              data: t.overview.stats.storage },
    { icon: "🧬", stat: stats.petrochem,            data: t.overview.stats.petrochem },
  ]

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: "#F4F7FB", color: "#0D2840", fontFamily: "Arial, Helvetica, sans-serif" }}>

      {/* Hero */}
      <div className="relative px-10 py-10" style={{ background: "linear-gradient(135deg, #1B4F72 0%, #0D2840 100%)", borderBottom: "3px solid #F4B942" }}>
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: "#F4B942" }} />
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded"
            style={{ backgroundColor: "rgba(244,185,66,0.15)", border: "1px solid rgba(244,185,66,0.4)" }}>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#F4B942" }}>
              {t.overview.badge}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-2 leading-tight" style={{ color: "#ffffff" }}>
            {t.overview.title}<span style={{ color: "#F4B942" }}>{t.overview.titleHighlight}</span>
          </h1>
          <p className="text-base max-w-2xl leading-relaxed" style={{ color: "#A3C4DC" }}
            dangerouslySetInnerHTML={{ __html: t.overview.subtitle }} />
          <p className="text-sm mt-3" style={{ color: "rgba(163,196,220,0.6)" }}>
            {t.overview.hint}
          </p>
        </div>
        <div className="absolute right-10 top-1/2 -translate-y-1/2 select-none pointer-events-none text-[110px]" style={{ opacity: 0.07 }}>🌍</div>
      </div>

      <div className="px-8 py-8 max-w-7xl mx-auto">

        {/* Stats grid */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-1 rounded" style={{ backgroundColor: "#F4B942" }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72" }}>{t.overview.dataSection}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {statCards.map(card => (
              <div key={card.data.label} className="rounded-lg p-4 transition-all hover:shadow-md"
                style={{ backgroundColor: "#ffffff", border: "1px solid #D0E4F0", boxShadow: "0 1px 4px rgba(27,79,114,0.06)" }}>
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="text-2xl font-bold" style={{ color: "#1B4F72" }}>{card.stat}</div>
                <div className="text-xs font-semibold mt-1" style={{ color: "#0D2840" }}>{card.data.label}</div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: "#5B8FB9" }}>{card.data.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Themes */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-1 rounded" style={{ backgroundColor: "#F4B942" }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72" }}>{t.overview.themesSection}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayThemes.map((theme, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg px-4 py-3 transition-all hover:shadow-md"
                style={{ backgroundColor: "#ffffff", border: "1px solid #D0E4F0" }}>
                <span className="text-lg mt-0.5 shrink-0">{theme.icon}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#0D2840" }}>{theme.label}</div>
                  <div className="text-xs mt-0.5 leading-snug" style={{ color: "#5B8FB9" }}>{theme.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="rounded-lg px-6 py-5" style={{ backgroundColor: "#ffffff", border: "1px solid #D0E4F0", boxShadow: "0 1px 4px rgba(27,79,114,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-1 rounded" style={{ backgroundColor: "#F4B942" }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72" }}>{t.overview.sourcesSection}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs" style={{ color: "#5B8FB9" }}>
            {sources
              ? sources.map((s, i) => (
                  <div key={i}>
                    {s.icon} <strong style={{ color: "#0D2840" }}>{s.label} :</strong> {s.text}
                  </div>
                ))
              : <>
                  <div>📊 <strong style={{ color: "#0D2840" }}>Réserves :</strong> OPEC Annual Statistical Bulletin — Energy Institute Statistical Review of World Energy</div>
                  <div>⚡ <strong style={{ color: "#0D2840" }}>Production :</strong> IEA World Energy Balances (WBES) — OPEC Monthly Oil Market Report</div>
                  <div>🗺️ <strong style={{ color: "#0D2840" }}>Bassins :</strong> USGS World Petroleum Assessment — AAPG/CGG Robertson Tellus</div>
                  <div>🚇 <strong style={{ color: "#0D2840" }}>Pipelines :</strong> Global Energy Monitor — Gas & Oil Infrastructure Trackers</div>
                  <div>🏭 <strong style={{ color: "#0D2840" }}>Raffineries :</strong> Oil & Gas Journal Worldwide Refining Survey — ARDA</div>
                  <div>🎓 <strong style={{ color: "#0D2840" }}>Formation :</strong> APPO Forum of Directors of Oil & Gas Training Institutes</div>
                  <div>🏪 <strong style={{ color: "#0D2840" }}>Stockage :</strong> GIIGNL Annual Report — Global Energy Monitor</div>
                  <div>🧬 <strong style={{ color: "#0D2840" }}>Pétrochimie :</strong> GlobalData — publications des opérateurs</div>
                </>
            }
          </div>
          <div className="mt-4 pt-4 text-xs" style={{ borderTop: "1px solid #D0E4F0", color: "#A3C4DC" }}>
            AIEM — Africa Interactive Energy Map &nbsp;|&nbsp; APPO © 2026 &nbsp;|&nbsp; Données à titre indicatif
          </div>
        </div>

      </div>
    </div>
  )
}
