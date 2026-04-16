"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/i18n/LanguageContext"

interface DataTableProps {
  selectedCountries: string[]
  selectedYear: number
  activeThemes: Set<string>
}

interface Country {
  id: string; code: string; name: string; region: string; appoMember: boolean
}

const THEME_CONFIG: Record<string, { label: string; icon: string; source: string; dataKey?: string }> = {
  basins:         { label: "Basins / Fields",      icon: "🟤", source: "USGS World Petroleum Assessment — AAPG/CGG Robertson Tellus Sedimentary Basins" },
  oil_reserves:   { label: "Oil Reserves",          icon: "🟢", source: "OPEC Annual Statistical Bulletin 2025 — Energy Institute Statistical Review of World Energy 2025", dataKey: "reserves" },
  gas_reserves:   { label: "Gas Reserves",          icon: "🔵", source: "OPEC Annual Statistical Bulletin 2025 — Energy Institute Statistical Review of World Energy 2025", dataKey: "reserves" },
  oil_production: { label: "Oil Production",        icon: "🔴", source: "IEA World Energy Balances (WBES) — OPEC Monthly Oil Market Report", dataKey: "production" },
  gas_production: { label: "Gas Production",        icon: "🔥", source: "IEA World Energy Balances (WBES) — OPEC Monthly Oil Market Report", dataKey: "production" },
  pipelines:      { label: "Pipelines",             icon: "🚇", source: "Global Energy Monitor — Gas & Oil Infrastructure Trackers" },
  refineries:     { label: "Refineries",            icon: "🏭", source: "Oil & Gas Journal Worldwide Refining Survey — ARDA (African Refiners & Distributors Association)" },
  training:       { label: "Training Institutes",   icon: "🎓", source: "APPO Forum of Directors of Oil & Gas Training Institutes" },
  rnd:            { label: "R&D Centers",           icon: "🔬", source: "National Oil Companies (NNPC, Sonatrach, EPRI, SASOL) — publications officielles" },
  storage:        { label: "Storage Facilities",    icon: "🏪", source: "GIIGNL Annual Report — Global Energy Monitor Gas Infrastructure Tracker" },
  petrochem:      { label: "Petrochemical Plants",  icon: "🧬", source: "GlobalData / Offshore Technology — publications des opérateurs (Dangote, SASOL, Sonatrach, ECHEM)" },
  imports:        { label: "Oil/Gas Imports",       icon: "⬇️", source: "IEA World Energy Balances (WBES)" },
  exports:        { label: "Oil/Gas Exports",       icon: "⬆️", source: "IEA World Energy Balances (WBES)" },
}

// Pipeline status badge colors
const PIPELINE_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "operational":        { bg: "#EBF5EB", color: "#1A7A2E" },
  "under construction": { bg: "#FFF8E6", color: "#B45309" },
  "proposed":           { bg: "#EBF3FB", color: "#1B4F72" },
  "offline":            { bg: "#F3F4F6", color: "#6C757D" },
  "concept":            { bg: "#F3EFFE", color: "#7C3AED" },
}

const REFINERY_STATUS_COLORS = PIPELINE_STATUS_COLORS

export function DataTable({ selectedCountries, selectedYear, activeThemes }: DataTableProps) {
  const { t } = useLanguage()
  const [countries, setCountries] = useState<Country[]>([])
  const [data, setData] = useState<Record<string, unknown[]>>({})
  const [activeTab, setActiveTab] = useState<string>("")

  useEffect(() => {
    fetch("/api/countries").then(r => r.json()).then(d => { if (Array.isArray(d)) setCountries(d) })
  }, [])

  useEffect(() => {
    const themes = Array.from(activeThemes)
    if (themes.length > 0 && !activeTab) setActiveTab(themes[0])
    if (activeTab && !activeThemes.has(activeTab) && themes.length > 0) setActiveTab(themes[0])

    const fetches: Promise<[string, unknown[]]>[] = []
    if (activeThemes.has("basins"))                                        fetches.push(fetch("/api/basins").then(r => r.json()).then(d => ["basins", d]))
    if (activeThemes.has("oil_reserves") || activeThemes.has("gas_reserves")) fetches.push(fetch(`/api/reserves?year=${selectedYear}`).then(r => r.json()).then(d => ["reserves", d]))
    if (activeThemes.has("oil_production") || activeThemes.has("gas_production")) fetches.push(fetch(`/api/production?year=${selectedYear}`).then(r => r.json()).then(d => ["production", d]))
    if (activeThemes.has("pipelines"))  fetches.push(fetch("/api/pipelines").then(r => r.json()).then(d => ["pipelines", d]))
    if (activeThemes.has("refineries")) fetches.push(fetch("/api/refineries").then(r => r.json()).then(d => ["refineries", d]))
    if (activeThemes.has("training"))   fetches.push(fetch("/api/training").then(r => r.json()).then(d => ["training", d]))
    if (activeThemes.has("rnd"))        fetches.push(fetch("/api/rnd").then(r => r.json()).then(d => ["rnd", d]))
    if (activeThemes.has("storage"))    fetches.push(fetch("/api/storage").then(r => r.json()).catch(() => []).then(d => ["storage", d]))
    if (activeThemes.has("petrochem"))  fetches.push(fetch("/api/petrochem").then(r => r.json()).catch(() => []).then(d => ["petrochem", d]))

    Promise.all(fetches).then(results => {
      const newData: Record<string, unknown[]> = {}
      for (const [key, value] of results) newData[key] = Array.isArray(value) ? value : []
      setData(newData)
    })
  }, [selectedYear, activeThemes, activeTab])

  const filteredCodes = selectedCountries.length > 0
    ? new Set(countries.filter(c => selectedCountries.includes(c.id)).map(c => c.code))
    : new Set<string>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterByCountry = (items: any[], codeField = "country.code") => {
    if (filteredCodes.size === 0) return items
    return items.filter(item => {
      const code = codeField.split(".").reduce((obj: any, key) => obj?.[key], item)
      return filteredCodes.has(code)
    })
  }

  const themes = Array.from(activeThemes).filter(t => THEME_CONFIG[t])

  // ── Shared table styles ───────────────────────────────────────────────────
  const TH = "p-3 text-left text-xs font-bold uppercase tracking-wider"
  const TD = "p-3 text-sm"
  const TR_EVEN = "bg-white"
  const TR_ODD  = "bg-[#F4F7FB]"

  const statusBadge = (status: string, map: Record<string, { bg: string; color: string }>) => {
    const s = map[status] ?? { bg: "#F3F4F6", color: "#6C757D" }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium capitalize" style={{ backgroundColor: s.bg, color: s.color }}>
        {status}
      </span>
    )
  }

  const renderTable = () => {
    const cfg = THEME_CONFIG[activeTab]
    const dataKey = cfg?.dataKey || activeTab
    const items = data[dataKey] || []

    const thStyle = { color: "#1B4F72", borderBottom: "2px solid #D0E4F0" }

    switch (activeTab) {
      case "basins":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.name}</th>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={TH} style={thStyle}>{t.table.type}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.area}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).map((b: any, i: number) => (
                <tr key={b.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{b.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{b.country?.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{b.type}</td>
                  <td className={`${TD} text-right font-mono`} style={{ color: "#1B4F72" }}>{b.areaKm2?.toLocaleString() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "oil_reserves":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.oilReserves}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.year}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).filter((r: any) => r.oil > 0).map((r: any, i: number) => (
                <tr key={r.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{r.country?.name}</td>
                  <td className={`${TD} text-right font-mono font-bold`} style={{ color: "#1A7A2E" }}>{r.oil.toLocaleString()}</td>
                  <td className={`${TD} text-right`} style={{ color: "#5B8FB9" }}>{r.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "gas_reserves":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.gasReserves}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.year}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).filter((r: any) => r.gas > 0).map((r: any, i: number) => (
                <tr key={r.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{r.country?.name}</td>
                  <td className={`${TD} text-right font-mono font-bold`} style={{ color: "#1B6CA8" }}>{r.gas.toLocaleString()}</td>
                  <td className={`${TD} text-right`} style={{ color: "#5B8FB9" }}>{r.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "oil_production":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.oilProduction}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.year}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).filter((p: any) => p.oil > 0).map((p: any, i: number) => (
                <tr key={p.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{p.country?.name}</td>
                  <td className={`${TD} text-right font-mono font-bold`} style={{ color: "#B91C1C" }}>{p.oil.toLocaleString()}</td>
                  <td className={`${TD} text-right`} style={{ color: "#5B8FB9" }}>{p.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "gas_production":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.gasProduction}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.year}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).filter((p: any) => p.gas > 0).map((p: any, i: number) => (
                <tr key={p.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{p.country?.name}</td>
                  <td className={`${TD} text-right font-mono font-bold`} style={{ color: "#B45309" }}>{p.gas.toLocaleString()}</td>
                  <td className={`${TD} text-right`} style={{ color: "#5B8FB9" }}>{p.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "pipelines":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.name}</th>
                <th className={TH} style={thStyle}>{t.table.countries}</th>
                <th className={TH} style={thStyle}>{t.table.status}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.length}</th>
                <th className={TH} style={thStyle}>{t.table.diameter}</th>
                <th className={TH} style={thStyle}>{t.table.capacity}</th>
              </tr>
            </thead>
            <tbody>
              {items.filter((p: any) => filteredCodes.size === 0 || p.countries?.some((c: string) => filteredCodes.has(c))).map((p: any, i: number) => (
                <tr key={p.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{p.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{p.countries?.join(", ")}</td>
                  <td className={TD}>{statusBadge(p.status, PIPELINE_STATUS_COLORS)}</td>
                  <td className={`${TD} text-right font-mono`} style={{ color: "#1B4F72" }}>{p.lengthKm?.toLocaleString() || "—"}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{p.diametre || "—"}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{p.capacity || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "refineries":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.name}</th>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.capacity}</th>
                <th className={TH} style={thStyle}>{t.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).map((r: any, i: number) => (
                <tr key={r.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{r.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{r.country?.name}</td>
                  <td className={`${TD} text-right font-mono font-bold`} style={{ color: "#1B4F72" }}>{r.capacityKbd?.toLocaleString()}</td>
                  <td className={TD}>{statusBadge(r.status, REFINERY_STATUS_COLORS)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "training":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.name}</th>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={TH} style={thStyle}>{t.table.type}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.established}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).map((inst: any, i: number) => (
                <tr key={inst.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{inst.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{inst.country?.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{inst.type}</td>
                  <td className={`${TD} text-right`} style={{ color: "#1B4F72" }}>{inst.year || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "rnd":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.name}</th>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={TH} style={thStyle}>{t.table.focus}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.established}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).map((r: any, i: number) => (
                <tr key={r.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{r.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{r.country?.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{r.focus}</td>
                  <td className={`${TD} text-right`} style={{ color: "#1B4F72" }}>{r.year || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "storage":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.name}</th>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={TH} style={thStyle}>{t.table.type}</th>
                <th className={`${TH} text-right`} style={thStyle}>{t.table.capMb}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).map((s: any, i: number) => (
                <tr key={s.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{s.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{s.country?.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{s.type}</td>
                  <td className={`${TD} text-right font-mono font-bold`} style={{ color: "#1B4F72" }}>{s.capacityMb?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "petrochem":
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.name}</th>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={TH} style={thStyle}>{t.table.products}</th>
                <th className={TH} style={thStyle}>{t.table.capacity}</th>
              </tr>
            </thead>
            <tbody>
              {filterByCountry(items).map((p: any, i: number) => (
                <tr key={p.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{p.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{p.country?.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{Array.isArray(p.products) ? p.products.join(", ") : p.products}</td>
                  <td className={TD} style={{ color: "#1B4F72" }}>{p.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "imports":
      case "exports": {
        const isImport = activeTab === "imports"
        const codes = isImport
          ? ["MAR", "TUN", "SEN", "KEN", "ZAF", "GHA"]
          : ["NGA", "DZA", "AGO", "LBY", "EGY", "COG", "GAB", "GNQ", "TCD"]
        const filtered = countries
          .filter(c => codes.includes(c.code))
          .filter(c => filteredCodes.size === 0 || filteredCodes.has(c.code))
        return (
          <table className="w-full">
            <thead style={{ backgroundColor: "#EBF3FB" }}>
              <tr>
                <th className={TH} style={thStyle}>{t.table.country}</th>
                <th className={TH} style={thStyle}>{t.table.region}</th>
                <th className={TH} style={thStyle}>{t.table.tradeStatus}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? TR_EVEN : TR_ODD} style={{ borderBottom: "1px solid #EBF3FB" }}>
                  <td className={`${TD} font-medium`} style={{ color: "#0D2840" }}>{c.name}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{c.region}</td>
                  <td className={TD} style={{ color: "#5B8FB9" }}>{isImport ? t.table.netImporter : t.table.netExporter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }

      default:
        return <div className="p-8 text-center text-sm" style={{ color: "#A3C4DC" }}>{t.table.noData}</div>
    }
  }

  const config = THEME_CONFIG[activeTab]
  const currentDataKey = config?.dataKey || activeTab
  const currentItems = data[currentDataKey] || []
  const count = activeTab === "imports" || activeTab === "exports"
    ? countries.filter(c => {
        const codes = activeTab === "imports" ? ["MAR","TUN","SEN","KEN","ZAF","GHA"] : ["NGA","DZA","AGO","LBY","EGY","COG","GAB","GNQ","TCD"]
        return codes.includes(c.code) && (filteredCodes.size === 0 || filteredCodes.has(c.code))
      }).length
    : activeTab === "pipelines"
    ? currentItems.filter((p: any) => filteredCodes.size === 0 || p.countries?.some((c: string) => filteredCodes.has(c))).length
    : activeTab === "oil_reserves"   ? filterByCountry(currentItems).filter((r: any) => r.oil > 0).length
    : activeTab === "gas_reserves"   ? filterByCountry(currentItems).filter((r: any) => r.gas > 0).length
    : activeTab === "oil_production" ? filterByCountry(currentItems).filter((p: any) => p.oil > 0).length
    : activeTab === "gas_production" ? filterByCountry(currentItems).filter((p: any) => p.gas > 0).length
    : filterByCountry(currentItems).length

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "#F4F7FB", fontFamily: "Arial, Helvetica, sans-serif" }}>

      {/* Theme tabs */}
      <div className="flex flex-wrap gap-1.5 p-3" style={{ backgroundColor: "#ffffff", borderBottom: "2px solid #D0E4F0" }}>
        {themes.map(theme => {
          const cfg = THEME_CONFIG[theme]
          if (!cfg) return null
          const isActive = activeTab === theme
          return (
            <button key={theme} onClick={() => setActiveTab(theme)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "#1B4F72" : "#EBF3FB",
                color: isActive ? "#ffffff" : "#1B4F72",
                border: `1px solid ${isActive ? "#1B4F72" : "#D0E4F0"}`,
                fontFamily: "Arial, sans-serif",
              }}>
              {cfg.icon} {cfg.label}
            </button>
          )
        })}
      </div>

      {activeTab && config ? (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #D0E4F0" }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#1B4F72" }}>{config.icon} {config.label}</h2>
              <div className="text-xs mt-0.5" style={{ color: "#5B8FB9" }}>{count} {count !== 1 ? t.table.recordsPlural : t.table.records}</div>
            </div>
            <div className="px-3 py-1 rounded-lg text-sm font-bold" style={{ backgroundColor: "#EBF3FB", color: "#1B4F72" }}>
              {selectedYear}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {renderTable()}
          </div>

          {/* Source */}
          <div className="px-6 py-2.5" style={{ backgroundColor: "#ffffff", borderTop: "1px solid #D0E4F0" }}>
            <div className="text-xs" style={{ color: "#A3C4DC" }}>
              <strong style={{ color: "#5B8FB9" }}>Source :</strong> {config.source}
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-sm" style={{ color: "#A3C4DC" }}>{t.table.selectTheme}</div>
          </div>
        </div>
      )}
    </div>
  )
}
