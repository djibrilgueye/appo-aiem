"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/i18n/LanguageContext"

interface Country {
  id: string; code: string; name: string; region: string; appoMember: boolean
}

interface SidebarProps {
  selectedCountries: string[]
  setSelectedCountries: (countries: string[]) => void
  selectedYear: number
  setSelectedYear: (year: number) => void
  activeThemes: Set<string>
  setActiveThemes: (themes: Set<string>) => void
  showLabels: boolean
  setShowLabels: (show: boolean) => void
  showPipelineLabels: boolean
  setShowPipelineLabels: (show: boolean) => void
  viewMode: "overview" | "map" | "table"
  setViewMode: (mode: "overview" | "map" | "table") => void
  onCompare: () => void
}

const REGION_KEYS = ["All", "North Africa", "West Africa", "Central Africa", "East Africa", "Southern Africa"] as const

const THEME_KEYS = [
  "basins", "oil_reserves", "gas_reserves", "oil_production", "gas_production",
  "pipelines", "refineries", "training", "rnd", "imports", "exports", "storage", "petrochem",
] as const

export function Sidebar({
  selectedCountries, setSelectedCountries,
  selectedYear, setSelectedYear,
  activeThemes, setActiveThemes,
  showLabels, setShowLabels,
  showPipelineLabels, setShowPipelineLabels,
  viewMode, setViewMode,
  onCompare,
}: SidebarProps) {
  const { t } = useLanguage()
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedRegion, setSelectedRegion] = useState<typeof REGION_KEYS[number]>("All")

  useEffect(() => {
    fetch("/api/countries")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCountries(data) })
      .catch(console.error)
  }, [])

  const filteredCountries = selectedRegion === "All"
    ? countries
    : countries.filter(c => c.region === selectedRegion)

  const toggleCountry = (id: string) =>
    selectedCountries.includes(id)
      ? setSelectedCountries(selectedCountries.filter(c => c !== id))
      : setSelectedCountries([...selectedCountries, id])

  const toggleTheme = (key: string) => {
    const s = new Set(activeThemes)
    s.has(key) ? s.delete(key) : s.add(key)
    setActiveThemes(s)
  }

  const section: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1px solid #D0E4F0",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "8px",
    boxShadow: "0 1px 3px rgba(27,79,114,0.06)",
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#1B4F72",
    marginBottom: "8px",
    fontFamily: "Arial, sans-serif",
  }

  const viewBtn = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? "#1B4F72" : "#F4F7FB",
    color: active ? "#ffffff" : "#5B8FB9",
    border: `1px solid ${active ? "#1B4F72" : "#D0E4F0"}`,
    borderRadius: "6px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: active ? "bold" : "normal",
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
  })

  const smallBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#F4F7FB",
    color: "#1B4F72",
    border: "1px solid #D0E4F0",
    borderRadius: "6px",
    padding: "4px 9px",
    fontSize: "11px",
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
  }

  return (
    <div className="overflow-auto h-full" style={{ backgroundColor: "#F4F7FB", padding: "10px 10px 20px", fontFamily: "Arial, Helvetica, sans-serif" }}>

      {/* View Mode */}
      <div style={section}>
        <div style={sectionTitle}>{t.sidebar.view}</div>
        <div className="flex flex-col gap-1.5">
          <button onClick={() => setViewMode("overview")} style={{ ...viewBtn(viewMode === "overview"), width: "100%", textAlign: "left" }}>
            {t.sidebar.overview}
          </button>
          <div className="flex gap-1.5">
            <button onClick={() => setViewMode("map")} style={{ ...viewBtn(viewMode === "map"), flex: 1, textAlign: "center" }}>
              {t.sidebar.map}
            </button>
            <button onClick={() => setViewMode("table")} style={{ ...viewBtn(viewMode === "table"), flex: 1, textAlign: "center" }}>
              {t.sidebar.table}
            </button>
          </div>
        </div>
      </div>

      {/* Region & Countries */}
      <div style={section}>
        <div style={sectionTitle}>{t.sidebar.regionCountries}</div>
        <div className="flex gap-2">
          <div style={{ minWidth: "88px" }}>
            {REGION_KEYS.map(region => (
              <label key={region} className="flex items-center gap-1.5 cursor-pointer" style={{ fontSize: "11px", padding: "2px 0" }}>
                <input type="radio" name="region" checked={selectedRegion === region}
                  onChange={() => { setSelectedRegion(region); setSelectedCountries([]) }}
                  style={{ accentColor: "#1B4F72" }} />
                <span style={{ color: selectedRegion === region ? "#1B4F72" : "#5B8FB9", fontWeight: selectedRegion === region ? "bold" : "normal" }}>
                  {t.sidebar.regions[region]}
                </span>
              </label>
            ))}
          </div>

          <div className="flex-1">
            <div className="overflow-auto" style={{ maxHeight: "180px", border: "1px solid #D0E4F0", borderRadius: "6px", padding: "4px", backgroundColor: "#F4F7FB" }}>
              {filteredCountries.map(country => {
                const selected = selectedCountries.includes(country.id)
                return (
                  <label key={country.id} className="flex items-center gap-1.5 cursor-pointer rounded" style={{ fontSize: "11px", padding: "3px 4px", backgroundColor: selected ? "#EBF3FB" : "transparent" }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleCountry(country.id)} style={{ accentColor: "#1B4F72" }} />
                    <span style={{ color: selected ? "#1B4F72" : "#5B8FB9", fontWeight: selected ? "bold" : "normal" }}>
                      {country.name}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 mt-2">
          <button onClick={() => setSelectedCountries(filteredCountries.map(c => c.id))} style={smallBtn}>{t.sidebar.selectAll}</button>
          <button onClick={() => setSelectedCountries([])} style={smallBtn}>{t.sidebar.clear}</button>
          <button onClick={onCompare} style={{ ...smallBtn, color: "#F4B942", borderColor: "#F4B942", backgroundColor: "#FFFBF0" }}>
            {t.sidebar.compare}
          </button>
        </div>
      </div>

      {/* Year */}
      <div style={section}>
        <div style={sectionTitle}>{t.sidebar.year}</div>
        <div className="flex items-center gap-2">
          <span style={{ backgroundColor: "#1B4F72", color: "#ffffff", borderRadius: "6px", padding: "3px 10px", fontWeight: "bold", fontSize: "14px", minWidth: "46px", textAlign: "center" }}>
            {selectedYear}
          </span>
          <input type="range" min="2021" max="2026" value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="flex-1" style={{ accentColor: "#1B4F72" }} />
        </div>
      </div>

      {/* Display options */}
      <div style={section}>
        <div style={sectionTitle}>{t.sidebar.display}</div>
        <div className="flex flex-col gap-1.5">
          {[
            { label: t.sidebar.countryLabels,  val: showLabels,         set: setShowLabels },
            { label: t.sidebar.pipelineLabels, val: showPipelineLabels, set: setShowPipelineLabels },
          ].map(({ label, val, set }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "12px", color: "#5B8FB9" }}>
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: "#1B4F72" }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Themes */}
      <div style={{ ...section, marginBottom: 0 }}>
        <div style={sectionTitle}>{t.sidebar.themes}</div>
        <div className="flex gap-1.5 mb-2">
          <button onClick={() => setActiveThemes(new Set(THEME_KEYS))} style={smallBtn}>{t.sidebar.allThemes}</button>
          <button onClick={() => setActiveThemes(new Set())} style={smallBtn}>{t.sidebar.noTheme}</button>
        </div>
        <div className="flex flex-col gap-0.5">
          {THEME_KEYS.map(key => {
            const active = activeThemes.has(key)
            return (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer rounded" style={{ fontSize: "11px", padding: "3px 4px", backgroundColor: active ? "#EBF3FB" : "transparent" }}>
                <input type="checkbox" checked={active} onChange={() => toggleTheme(key)} style={{ accentColor: "#1B4F72" }} />
                <span style={{ color: active ? "#1B4F72" : "#5B8FB9", fontWeight: active ? "bold" : "normal" }}>
                  {t.sidebar.themeLabels[key]}
                </span>
              </label>
            )
          })}
        </div>
      </div>

    </div>
  )
}
