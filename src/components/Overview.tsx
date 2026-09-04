"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Globe2, Layers, Droplet, Flame, GitBranch, Factory,
  GraduationCap, FlaskConical, Warehouse, Beaker, ArrowRight,
} from "lucide-react"
import { useLanguage } from "@/i18n/LanguageContext"

interface ThemeEntry { icon: string; label: string; desc: string }
interface SourceEntry { icon: string; label: string; text: string }

// Pastel accents for KPI cards — soft daylight tones (bg / ring / icon).
const KPI_ACCENTS = [
  { bg: "#E0F2FE", ring: "#BAE6FD", icon: "#0284C7" }, // sky
  { bg: "#DCFCE7", ring: "#BBF7D0", icon: "#15803D" }, // mint
  { bg: "#FEE2E2", ring: "#FECACA", icon: "#B91C1C" }, // rose
  { bg: "#FEF3C7", ring: "#FDE68A", icon: "#B45309" }, // amber
  { bg: "#EDE9FE", ring: "#DDD6FE", icon: "#6D28D9" }, // lavender
  { bg: "#CCFBF1", ring: "#99F6E4", icon: "#0F766E" }, // teal
  { bg: "#FCE7F3", ring: "#FBCFE8", icon: "#BE185D" }, // pink
  { bg: "#DBEAFE", ring: "#BFDBFE", icon: "#1D4ED8" }, // blue
  { bg: "#FFEDD5", ring: "#FED7AA", icon: "#C2410C" }, // orange
  { bg: "#E0E7FF", ring: "#C7D2FE", icon: "#4338CA" }, // indigo
]

// Deterministic pseudo-random sparkline path so each card looks unique
// while the visual stays stable across renders.
function sparklinePath(seed: number, w = 100, h = 30, points = 12): string {
  const values: number[] = []
  let x = seed
  for (let i = 0; i < points; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff
    values.push((x >>> 16) & 0xff)
  }
  const min = Math.min(...values), max = Math.max(...values)
  const norm = values.map(v => (v - min) / (max - min || 1))
  const stepX = w / (points - 1)
  return norm
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(h - v * h * 0.85 - h * 0.075).toFixed(1)}`)
    .join(" ")
}

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
        reserves_countries:   Array.isArray(reserves)    ? new Set(reserves.map((r: { countryId?: string; country?: { id?: string } }) => r.countryId || r.country?.id)).size : 0,
        production_countries: Array.isArray(production)  ? new Set(production.map((p: { countryId?: string; country?: { id?: string } }) => p.countryId || p.country?.id)).size : 0,
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
    { Icon: Globe2,        stat: stats.countries,            data: t.overview.stats.countries,  href: "/app?view=map" },
    { Icon: Layers,        stat: stats.basins,               data: t.overview.stats.basins,     href: "/app?view=map&theme=basins" },
    { Icon: Droplet,       stat: stats.reserves_countries,   data: t.overview.stats.reserves,   href: "/app?view=map&theme=oil_reserves" },
    { Icon: Flame,         stat: stats.production_countries, data: t.overview.stats.production, href: "/app?view=map&theme=oil_production" },
    { Icon: GitBranch,     stat: stats.pipelines,            data: t.overview.stats.pipelines,  href: "/app?view=map&theme=pipelines" },
    { Icon: Factory,       stat: stats.refineries,           data: t.overview.stats.refineries, href: "/app?view=map&theme=refineries" },
    { Icon: GraduationCap, stat: stats.training,             data: t.overview.stats.training,   href: "/app?view=map&theme=training" },
    { Icon: FlaskConical,  stat: stats.rnd,                  data: t.overview.stats.rnd,        href: "/app?view=map&theme=rnd" },
    { Icon: Warehouse,     stat: stats.storage,              data: t.overview.stats.storage,    href: "/app?view=map&theme=storage" },
    { Icon: Beaker,        stat: stats.petrochem,            data: t.overview.stats.petrochem,  href: "/app?view=map&theme=petrochem" },
  ]

  return (
    <div className="min-h-full" style={{ backgroundColor: "#F8FAFC", color: "#0F172A" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-6 max-w-7xl mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm p-8 md:p-10"
        >
          {/* Discreet gold ribbon at the top */}
          <div className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: "linear-gradient(90deg, #F4B942 0%, #F7D078 50%, #F4B942 100%)" }} />

          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            {/* Left: identity + copy */}
            <div className="flex-1 min-w-0 max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#0284C7" }} />
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "#0284C7" }}>
                  {t.overview.badge}
                </span>
              </div>

              <h1 className="font-bold leading-tight mb-3" style={{ fontSize: "2.1rem", color: "#0F172A" }}>
                {t.overview.title}
                <span style={{
                  background: "linear-gradient(90deg, #F4B942, #D4920A)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>{t.overview.titleHighlight}</span>
              </h1>

              <p
                className="text-[15px] leading-relaxed mb-5"
                style={{ color: "#475569" }}
                dangerouslySetInnerHTML={{ __html: t.overview.subtitle }}
              />

              <Link
                href="/app?view=map"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "#0284C7", color: "#fff", boxShadow: "0 6px 20px rgba(2,132,199,0.22)" }}
              >
                Explorer la carte <ArrowRight size={16} />
              </Link>
            </div>

            {/* Right: consolidated headline metrics */}
            <div className="flex-shrink-0 grid grid-cols-3 gap-4 lg:min-w-[400px]">
              <div className="text-center px-3 py-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-bold tabular-nums" style={{ color: "#0F172A" }}>18</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold mt-1" style={{ color: "#64748B" }}>Pays membres</div>
              </div>
              <div className="text-center px-3 py-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-bold tabular-nums" style={{ color: "#0F172A" }}>125<span className="text-sm font-semibold" style={{ color: "#64748B" }}>B</span></div>
                <div className="text-[10px] uppercase tracking-wider font-semibold mt-1" style={{ color: "#64748B" }}>Réserves brut (bbl)</div>
              </div>
              <div className="text-center px-3 py-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-bold tabular-nums" style={{ color: "#0F172A" }}>700<span className="text-sm font-semibold" style={{ color: "#64748B" }}>+</span></div>
                <div className="text-[10px] uppercase tracking-wider font-semibold mt-1" style={{ color: "#64748B" }}>Réserves gaz (Tcf)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="px-6 pb-10 max-w-7xl mx-auto space-y-10">

        {/* KPIs */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-5 w-1 rounded-full" style={{ background: "linear-gradient(to bottom, #F4B942, #F7D078)" }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72" }}>
              {t.overview.dataSection}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: "#E2E8F0" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((card, i) => {
              const accent = KPI_ACCENTS[i % KPI_ACCENTS.length]
              const Icon = card.Icon
              return (
                <Link
                  key={card.data.label}
                  href={card.href}
                  className="group block rounded-2xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  style={{ textDecoration: "none" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accent.bg, boxShadow: `0 0 0 1px ${accent.ring} inset` }}
                    >
                      <Icon size={18} style={{ color: accent.icon }} />
                    </div>
                    {/* Sparkline */}
                    <svg width="60" height="24" viewBox="0 0 100 30" className="opacity-80" aria-hidden="true">
                      <path d={sparklinePath(i * 97 + 13)} fill="none" stroke={accent.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold tabular-nums leading-none mb-1" style={{ color: "#0F172A" }}>
                    {card.stat}
                  </div>
                  <div className="text-xs font-semibold leading-snug" style={{ color: "#0F172A" }}>
                    {card.data.label}
                  </div>
                  <div className="text-[11px] leading-snug mt-0.5" style={{ color: "#64748B" }}>
                    {card.data.sub}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Themes */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-5 w-1 rounded-full" style={{ background: "linear-gradient(to bottom, #F4B942, #F7D078)" }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#1B4F72" }}>
              {t.overview.themesSection}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: "#E2E8F0" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayThemes.map((theme, i) => (
              <div
                key={i}
                className="group flex items-start gap-3 rounded-2xl px-4 py-4 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: "#F1F5F9", boxShadow: "0 0 0 1px #E2E8F0 inset" }}>
                  {theme.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight mb-1" style={{ color: "#0F172A" }}>{theme.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "#64748B" }}>{theme.desc}</div>
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
            <div className="flex-1 h-px" style={{ backgroundColor: "#E2E8F0" }} />
          </div>
          <div className="rounded-2xl px-6 py-5 bg-white border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs">
              {sources
                ? sources.map((s, i) => (
                    <div key={i} className="flex items-start gap-2" style={{ color: "#64748B" }}>
                      <span className="mt-0.5 shrink-0">{s.icon}</span>
                      <span><strong style={{ color: "#0F172A" }}>{s.label} :</strong> {s.text}</span>
                    </div>
                  ))
                : <>
                    <div className="flex items-start gap-2" style={{ color: "#64748B" }}><span className="shrink-0">📊</span><span><strong style={{ color: "#0F172A" }}>{t.admin.overview.reservesLabel}</strong> OPEC Annual Statistical Bulletin — Energy Institute Statistical Review of World Energy</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#64748B" }}><span className="shrink-0">⚡</span><span><strong style={{ color: "#0F172A" }}>Production :</strong> IEA World Energy Balances (WBES) — OPEC Monthly Oil Market Report</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#64748B" }}><span className="shrink-0">🗺️</span><span><strong style={{ color: "#0F172A" }}>Bassins :</strong> USGS World Petroleum Assessment — AAPG/CGG Robertson Tellus</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#64748B" }}><span className="shrink-0">🚇</span><span><strong style={{ color: "#0F172A" }}>Pipelines :</strong> Global Energy Monitor — Gas & Oil Infrastructure Trackers</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#64748B" }}><span className="shrink-0">🏭</span><span><strong style={{ color: "#0F172A" }}>Raffineries :</strong> Oil & Gas Journal Worldwide Refining Survey — ARDA</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#64748B" }}><span className="shrink-0">🎓</span><span><strong style={{ color: "#0F172A" }}>Formation :</strong> APPO Forum of Directors of Oil & Gas Training Institutes</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#64748B" }}><span className="shrink-0">🏪</span><span><strong style={{ color: "#0F172A" }}>{t.admin.overview.storageLabel}</strong> GIIGNL Annual Report — Global Energy Monitor</span></div>
                    <div className="flex items-start gap-2" style={{ color: "#64748B" }}><span className="shrink-0">🧬</span><span><strong style={{ color: "#0F172A" }}>{t.admin.overview.petrochemLabel}</strong> {t.admin.overview.petrochemSource}</span></div>
                  </>
              }
            </div>
            <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid #F1F5F9" }}>
              <span className="text-xs" style={{ color: "#94A3B8" }}>
                AIEM — Africa Interactive Energy Map &nbsp;|&nbsp; APPO © 2026
              </span>
              <span className="text-xs" style={{ color: "#CBD5E1" }}>
                Données à titre indicatif
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
