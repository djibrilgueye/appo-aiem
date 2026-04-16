"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/i18n/LanguageContext"

interface Country {
  id: string; code: string; name: string; region: string; appoMember: boolean
}

interface SidebarProps {
  selectedCountries: string[]
  setSelectedCountries: (countries: string[]) => void
  selectedYear: number
  setSelectedYear: (year: number) => void
  selectedRegion: string
  setSelectedRegion: (region: string) => void
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

// ─── Hiérarchie des thèmes ────────────────────────────────────────────────────
// Un nœud peut avoir des enfants ; si aucun enfant, c'est une feuille.
// Cocher un parent coche tous ses enfants. Décocher un parent décoche tous.
// Si certains enfants sont cochés → le parent est "indéterminé".

interface ThemeNode {
  key: string          // clé thème (ou virtuelle pour les groupes purs)
  children?: ThemeNode[]
}

const IMPORT_CHILDREN: ThemeNode[] = [
  { key: "imports_oil_intra" },
  { key: "imports_cond_intra" },
  { key: "imports_gas_intra" },
  { key: "imports_oil_extra" },
  { key: "imports_gas_extra" },
  { key: "imports_essence" },
  { key: "imports_gasoil" },
  { key: "imports_gpl" },
  { key: "imports_jetfuel" },
]

const EXPORT_CHILDREN: ThemeNode[] = [
  { key: "exports_oil_intra" },
  { key: "exports_cond_intra" },
  { key: "exports_gas_intra" },
  { key: "exports_oil_extra" },
  { key: "exports_gas_extra" },
  { key: "exports_essence" },
  { key: "exports_gasoil" },
  { key: "exports_gpl" },
  { key: "exports_jetfuel" },
]

const THEME_TREE: ThemeNode[] = [
  { key: "basins" },
  { key: "oil_reserves" },
  { key: "gas_reserves" },
  { key: "oil_production" },
  { key: "gas_production" },
  { key: "pipelines" },
  { key: "refineries" },
  { key: "training" },
  { key: "rnd" },
  {
    key: "trade_group",
    children: [
      { key: "imports_group", children: IMPORT_CHILDREN },
      { key: "exports_group", children: EXPORT_CHILDREN },
    ],
  },
  { key: "storage" },
  { key: "petrochem" },
]

// Collect all leaf keys (real theme keys used by the map)
function leafKeys(node: ThemeNode): string[] {
  if (!node.children || node.children.length === 0) return [node.key]
  return node.children.flatMap(leafKeys)
}

// All real keys that can be toggled on the map
export const THEME_KEYS = THEME_TREE.flatMap(leafKeys)

// ─── IndeterminateCheckbox ─────────────────────────────────────────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange }: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked
  }, [indeterminate, checked])
  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={onChange}
      style={{ accentColor: "#4cc9f0", cursor: "pointer" }}
    />
  )
}

// ─── ThemeNode renderer (recursive) ──────────────────────────────────────────
function ThemeNodeRow({
  node, depth, activeThemes, setActiveThemes, labels, virtualLabels,
}: {
  node: ThemeNode
  depth: number
  activeThemes: Set<string>
  setActiveThemes: (s: Set<string>) => void
  labels: Record<string, string>
  virtualLabels: Record<string, string>
}) {
  const leaves = leafKeys(node)
  const isVirtual = node.key.endsWith("_group")
  const isLeaf = !node.children || node.children.length === 0

  const checkedLeaves = leaves.filter(k => activeThemes.has(k))
  const allChecked   = checkedLeaves.length === leaves.length
  const someChecked  = checkedLeaves.length > 0 && !allChecked

  // Default open if any child active
  const [open, setOpen] = useState(() => checkedLeaves.length > 0)

  const toggle = () => {
    const s = new Set(activeThemes)
    if (allChecked) {
      leaves.forEach(k => s.delete(k))
    } else {
      leaves.forEach(k => s.add(k))
    }
    setActiveThemes(s)
  }

  const label = isVirtual
    ? (virtualLabels[node.key] ?? node.key)
    : (labels[node.key] ?? node.key)

  const indent = depth * 12

  return (
    <div>
      <div
        className="flex items-center gap-1 cursor-pointer rounded"
        style={{
          padding: `2px 4px 2px ${4 + indent}px`,
          backgroundColor: allChecked ? "rgba(76,201,240,0.15)" : someChecked ? "rgba(76,201,240,0.07)" : "transparent",
          fontSize: depth === 0 ? "11px" : "10px",
        }}
      >
        <IndeterminateCheckbox
          checked={allChecked}
          indeterminate={someChecked}
          onChange={toggle}
        />
        {/* Expand toggle for non-leaf nodes */}
        {!isLeaf && (
          <button
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#4cc9f0", fontSize: "10px", lineHeight: 1 }}
          >
            {open ? "▾" : "▸"}
          </button>
        )}
        <span
          onClick={toggle}
          style={{
            color: allChecked ? "#e6eef7" : someChecked ? "#4cc9f0" : "#b8c7db",
            fontWeight: allChecked ? "bold" : someChecked ? "600" : "normal",
            flex: 1,
            userSelect: "none",
          }}
        >
          {label}
        </span>
      </div>

      {/* Children */}
      {!isLeaf && open && node.children!.map(child => (
        <ThemeNodeRow
          key={child.key}
          node={child}
          depth={depth + 1}
          activeThemes={activeThemes}
          setActiveThemes={setActiveThemes}
          labels={labels}
          virtualLabels={virtualLabels}
        />
      ))}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({
  selectedCountries, setSelectedCountries,
  selectedYear, setSelectedYear,
  selectedRegion, setSelectedRegion,
  activeThemes, setActiveThemes,
  showLabels, setShowLabels,
  showPipelineLabels, setShowPipelineLabels,
  viewMode, setViewMode,
  onCompare,
}: SidebarProps) {
  const { t } = useLanguage()
  const [countries, setCountries] = useState<Country[]>([])

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

  // Labels for real theme keys
  const themeLabels = t.sidebar.themeLabels as Record<string, string>

  // Labels for virtual group nodes (not in translations)
  const virtualLabels: Record<string, string> = {
    trade_group:   t.sidebar.tradeGroup  ?? "🔄 Commerce des Hydrocarbures",
    imports_group: t.sidebar.importGroup ?? "⬇️ Importations",
    exports_group: t.sidebar.exportGroup ?? "⬆️ Exportations",
  }

  const accentColor = "#4cc9f0"

  const section: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "8px",
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#4cc9f0",
    marginBottom: "8px",
    fontFamily: "Arial, sans-serif",
  }

  const viewBtn = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? "#4cc9f0" : "rgba(8,20,40,0.6)",
    color: active ? "#0b1220" : "#b8c7db",
    border: `1px solid ${active ? "#4cc9f0" : "rgba(255,255,255,0.16)"}`,
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
    backgroundColor: "rgba(8,20,40,0.6)",
    color: "#b8c7db",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "6px",
    padding: "4px 9px",
    fontSize: "11px",
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
  }

  return (
    <div className="overflow-auto h-full" style={{ backgroundColor: "#0b2e59", padding: "10px 10px 20px", fontFamily: "Arial, Helvetica, sans-serif" }}>

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
                  style={{ accentColor: "#4cc9f0" }} />
                <span style={{ color: selectedRegion === region ? "#e6eef7" : "#b8c7db", fontWeight: selectedRegion === region ? "bold" : "normal" }}>
                  {t.sidebar.regions[region]}
                </span>
              </label>
            ))}
          </div>

          <div className="flex-1">
            <div className="overflow-auto" style={{ maxHeight: "180px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "4px", backgroundColor: "rgba(255,255,255,0.04)" }}>
              {filteredCountries.map(country => {
                const selected = selectedCountries.includes(country.id)
                return (
                  <label key={country.id} className="flex items-center gap-1.5 cursor-pointer rounded" style={{ fontSize: "11px", padding: "3px 4px", backgroundColor: selected ? "rgba(76,201,240,0.15)" : "transparent" }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleCountry(country.id)} style={{ accentColor: "#4cc9f0" }} />
                    <span style={{ color: selected ? "#e6eef7" : "#b8c7db", fontWeight: selected ? "bold" : "normal" }}>
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
          <button onClick={onCompare} style={{ ...smallBtn, color: "#F4B942", borderColor: "#F4B942", backgroundColor: "rgba(244,185,66,0.12)" }}>
            {t.sidebar.compare}
          </button>
        </div>
      </div>

      {/* Year */}
      <div style={section}>
        <div style={sectionTitle}>{t.sidebar.year}</div>
        <div className="flex items-center gap-2">
          <span style={{ backgroundColor: "#4cc9f0", color: "#0b1220", borderRadius: "6px", padding: "3px 10px", fontWeight: "bold", fontSize: "14px", minWidth: "46px", textAlign: "center" }}>
            {selectedYear}
          </span>
          <input type="range" min="2021" max="2026" value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="flex-1" style={{ accentColor: "#4cc9f0" }} />
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
            <label key={label} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "12px", color: "#b8c7db" }}>
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: "#4cc9f0" }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Themes — arbre hiérarchique */}
      <div style={{ ...section, marginBottom: 0 }}>
        <div style={sectionTitle}>{t.sidebar.themes}</div>
        <div className="flex gap-1.5 mb-2">
          <button onClick={() => setActiveThemes(new Set(THEME_KEYS))} style={smallBtn}>{t.sidebar.allThemes}</button>
          <button onClick={() => setActiveThemes(new Set())} style={smallBtn}>{t.sidebar.noTheme}</button>
        </div>
        <div className="flex flex-col gap-0">
          {THEME_TREE.map(node => (
            <ThemeNodeRow
              key={node.key}
              node={node}
              depth={0}
              activeThemes={activeThemes}
              setActiveThemes={setActiveThemes}
              labels={themeLabels}
              virtualLabels={virtualLabels}
            />
          ))}
        </div>
      </div>

    </div>
  )
}
