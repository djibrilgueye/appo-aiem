"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { X, MapPin } from "lucide-react"
import { useLanguage } from "@/i18n/LanguageContext"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Country {
  id: string; code: string; name: string; region: string; lat: number; lon: number; appoMember: boolean
}
interface Basin {
  id: string; name: string; type: string; lat: number; lon: number; areaKm2?: number; country: { name: string; code: string }
}
interface Refinery {
  id: string; name: string; lat: number; lon: number; capacityKbd: number; status: string; country: { name: string; code: string }
}
interface Pipeline {
  id: string; name: string; countries: string[]; coords: number[][]; status: string; lengthKm?: number; diametre?: string; capacity?: string
}
interface Reserve {
  id: string; oil: number; gas: number; year: number; country: { name: string; code: string; lat: number; lon: number }
}
interface Production {
  id: string; oil: number; gas: number; year: number; country: { name: string; code: string; lat: number; lon: number }
}
interface TrainingInstitute {
  id: string; name: string; lat: number; lon: number; type: string; year?: number; country: { name: string; code: string }
}
interface RnDCenter {
  id: string; name: string; lat: number; lon: number; focus: string; year?: number; country: { name: string; code: string }
}
interface StorageFacility {
  id: string; name: string; lat: number; lon: number; type: string; capacityMb: number; country: { name: string; code: string }
}
interface PetrochemPlant {
  id: string; name: string; lat: number; lon: number; products: string[]; capacity: string; country: { name: string; code: string }
}

interface MapProps {
  selectedCountries: string[]
  selectedYear: number
  activeThemes: Set<string>
  showLabels: boolean
  showPipelineLabels?: boolean
}

// ─── APPO Map Colors ──────────────────────────────────────────────────────────

const MC = {
  ocean:            "#EBF5FB",
  countryDefault:   "#D5E8F3",
  countryNonMember: "#C8C8C8",
  countryHover:     "#A8D4EA",
  countrySelected:  "#1B4F72",
  countrySelectedH: "#154060",
  border:           "#7FB3CC",
  borderHover:      "#1B4F72",
}

// ─── ISO3 → ISO2 mapping ──────────────────────────────────────────────────────

const ISO3_TO_ISO2: Record<string, string> = {
  DZA:"DZ",AGO:"AO",BEN:"BJ",BWA:"BW",BFA:"BF",BDI:"BI",CMR:"CM",CPV:"CV",CAF:"CF",TCD:"TD",
  COM:"KM",COD:"CD",COG:"CG",CIV:"CI",DJI:"DJ",EGY:"EG",GNQ:"GQ",ERI:"ER",SWZ:"SZ",ETH:"ET",
  GAB:"GA",GMB:"GM",GHA:"GH",GIN:"GN",GNB:"GW",KEN:"KE",LSO:"LS",LBR:"LR",LBY:"LY",MDG:"MG",
  MWI:"MW",MLI:"ML",MRT:"MR",MUS:"MU",MAR:"MA",MOZ:"MZ",NAM:"NA",NER:"NE",NGA:"NG",RWA:"RW",
  STP:"ST",SEN:"SN",SYC:"SC",SLE:"SL",SOM:"SO",ZAF:"ZA",SSD:"SS",SDN:"SD",TZA:"TZ",TGO:"TG",
  TUN:"TN",UGA:"UG",ZMB:"ZM",ZWE:"ZW",
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipData {
  title: string
  subtitle?: string
  rows: { label: string; value: string | string[] }[]
  x: number; y: number; locked: boolean
}

function MapTooltip({ tooltip, onClose, onMouseEnter, onMouseLeave }: {
  tooltip: TooltipData
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const { t } = useLanguage()
  const left = Math.min(tooltip.x + 16, (typeof window !== "undefined" ? window.innerWidth : 1200) - 300)
  const top  = Math.max(tooltip.y - 20, 10)

  return (
    <div className="fixed z-[2000] pointer-events-auto" style={{ left, top }}
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className={`bg-white rounded-xl shadow-xl border overflow-hidden w-64 ${tooltip.locked ? "border-[#1B4F72] ring-2 ring-[#A3C4DC]" : "border-slate-200"}`}>
        <div className="px-4 py-3 flex items-start justify-between" style={{ background: "linear-gradient(135deg, #1B4F72, #2980B9)" }}>
          <div>
            <div className="font-bold text-white text-sm leading-tight">{tooltip.title}</div>
            {tooltip.subtitle && <div className="text-blue-200 text-xs mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{tooltip.subtitle}</div>}
          </div>
          {tooltip.locked && (
            <button onClick={onClose} className="text-blue-200 hover:text-white ml-2 flex-shrink-0"><X className="h-4 w-4" /></button>
          )}
        </div>
        <div className="px-4 py-3 space-y-1.5">
          {tooltip.rows.map(r => (
            <div key={r.label} className="flex justify-between text-xs gap-2">
              <span style={{ color: "#6C757D" }} className="shrink-0">{r.label}</span>
              <span className="font-semibold text-right leading-relaxed" style={{ color: "#0D2840" }}>
                {Array.isArray(r.value) ? r.value.join(" → ") : r.value}
              </span>
            </div>
          ))}
        </div>
        {tooltip.locked && <p className="text-xs text-center pb-2" style={{ color: "#A3C4DC" }}>{t.map.legend}</p>}
      </div>
    </div>
  )
}

// ─── Tooltip handler helpers ──────────────────────────────────────────────────

type TipArgs = Omit<TooltipData, "locked">

function bindTip(
  layer: L.Layer,
  getTip: (e: L.LeafletMouseEvent) => TipArgs,
  locked: { current: boolean },
  timer: { current: ReturnType<typeof setTimeout> | null },
  show: (tip: TipArgs, locked?: boolean) => void,
  hide: () => void,
  clickable = true,
) {
  layer.on("mouseover", (e: L.LeafletMouseEvent) => {
    if (!locked.current) show(getTip(e))
  })
  layer.on("mouseout", () => {
    if (!locked.current) timer.current = setTimeout(hide, 150)
  })
  if (clickable) {
    layer.on("click", (e: L.LeafletMouseEvent) => {
      locked.current = true
      show(getTip(e), true)
      L.DomEvent.stopPropagation(e)
    })
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    if (line && (line + " " + w).length > maxChars) { lines.push(line); line = w }
    else line = line ? line + " " + w : w
  }
  if (line) lines.push(line)
  return lines
}

// ─── Pipeline colors ──────────────────────────────────────────────────────────

function pipelineStyle(status: string) {
  const colors: Record<string, string> = {
    "operational":        "#1B4F72",
    "under construction": "#F4B942",
    "proposed":           "#5B8FB9",
    "offline":            "#9CA3AF",
    "concept":            "#A78BFA",
  }
  const dashes: Record<string, string> = {
    "proposed":           "4,6",
    "under construction": "10,5",
    "concept":            "3,8",
    "offline":            "6,4",
  }
  return { color: colors[status] ?? "#5B8FB9", dash: dashes[status] }
}

// ─── Marker factories ─────────────────────────────────────────────────────────

function pulsingMarker(color: string, emoji?: string) {
  return L.divIcon({
    html: `
      <div style="position:relative;width:24px;height:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.2;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
          ${emoji ? `<span style="font-size:8px">${emoji}</span>` : ""}
        </div>
      </div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function emojiMarker(emoji: string, size = 22) {
  return L.divIcon({
    html: `<span style="font-size:${size}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${emoji}</span>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Main Map Component ────────────────────────────────────────────────────────

export function AIEMMap({ selectedCountries, selectedYear, activeThemes, showLabels, showPipelineLabels = false }: MapProps) {
  const { t } = useLanguage()
  const mapRef       = useRef<HTMLDivElement>(null)
  const leafletMap   = useRef<L.Map | null>(null)
  const geoLayer     = useRef<L.GeoJSON | null>(null)
  const markersGrp   = useRef<L.LayerGroup | null>(null)
  const polylinesGrp = useRef<L.LayerGroup | null>(null)
  const labelsGrp    = useRef<L.LayerGroup | null>(null)
  const hoveredLayer   = useRef<L.Path | null>(null)
  const tooltipLocked  = useRef(false)
  const tooltipTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const memberCodesRef   = useRef<Set<string>>(new Set())
  const geoCentroidsRef  = useRef<Map<string, [number, number]>>(new Map())

  const [tooltip,     setTooltip]     = useState<TooltipData | null>(null)
  const [geoReady,    setGeoReady]    = useState(false)
  const [countries,   setCountries]   = useState<Country[]>([])
  const [basins,      setBasins]      = useState<Basin[]>([])
  const [refineries,  setRefineries]  = useState<Refinery[]>([])
  const [pipelines,   setPipelines]   = useState<Pipeline[]>([])
  const [reserves,    setReserves]    = useState<Reserve[]>([])
  const [productions, setProductions] = useState<Production[]>([])
  const [training,    setTraining]    = useState<TrainingInstitute[]>([])
  const [rndCenters,  setRndCenters]  = useState<RnDCenter[]>([])
  const [storages,    setStorages]    = useState<StorageFacility[]>([])
  const [petrochems,  setPetrochems]  = useState<PetrochemPlant[]>([])

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/countries").then(r => r.json()),
      fetch("/api/basins").then(r => r.json()),
      fetch("/api/refineries").then(r => r.json()),
      fetch("/api/pipelines").then(r => r.json()),
      fetch(`/api/reserves?year=${selectedYear}`).then(r => r.json()),
      fetch(`/api/production?year=${selectedYear}`).then(r => r.json()),
      fetch("/api/training").then(r => r.json()),
      fetch("/api/rnd").then(r => r.json()),
      fetch("/api/storage").then(r => r.json()).catch(() => []),
      fetch("/api/petrochem").then(r => r.json()).catch(() => []),
    ]).then(([c, b, r, p, rv, pr, tr, rn, st, pc]) => {
      setCountries(Array.isArray(c) ? c : [])
      setBasins(Array.isArray(b) ? b : [])
      setRefineries(Array.isArray(r) ? r : [])
      setPipelines(Array.isArray(p) ? p : [])
      setReserves(Array.isArray(rv) ? rv : [])
      setProductions(Array.isArray(pr) ? pr : [])
      setTraining(Array.isArray(tr) ? tr : [])
      setRndCenters(Array.isArray(rn) ? rn : [])
      setStorages(Array.isArray(st) ? st : [])
      setPetrochems(Array.isArray(pc) ? pc : [])
    }).catch(console.error)
  }, [selectedYear])

  const showTip = useCallback((data: Omit<TooltipData, "locked">, locked = false) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltip({ ...data, locked })
  }, [])

  const closeTip = useCallback(() => {
    tooltipLocked.current = false
    setTooltip(null)
  }, [])

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    const container = mapRef.current as HTMLElement & { _leaflet_id?: number }
    if (container._leaflet_id) delete container._leaflet_id
    let destroyed = false

    const map = L.map(mapRef.current, {
      center: [3, 20], zoom: 4,
      zoomControl: false, attributionControl: false,
      scrollWheelZoom: true, minZoom: 3, maxZoom: 9,
    })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", { maxZoom: 19, opacity: 0.25 }).addTo(map)
    L.control.zoom({ position: "bottomleft" }).addTo(map)

    // Create groups but don't add to map yet — added after GeoJSON so they stay on top
    const mg = L.layerGroup()
    const pg = L.layerGroup()
    const lg = L.layerGroup()
    markersGrp.current   = mg
    polylinesGrp.current = pg
    labelsGrp.current    = lg
    leafletMap.current   = map

    fetch("/data/africa.json")
      .then(r => r.json())
      .then(geo => {
        if (destroyed) return

        // Build centroid map: iso2 → [lat, lon] from GeoJSON geometry
        const centroids = new Map<string, [number, number]>()
        ;(geo.features as GeoJSON.Feature[]).forEach(f => {
          const iso2 = f.properties?.iso2
          if (!iso2 || !f.geometry) return
          // Find largest ring across all polygons
          let rings: number[][][] = []
          if (f.geometry.type === "Polygon") rings = (f.geometry as GeoJSON.Polygon).coordinates as number[][][]
          else if (f.geometry.type === "MultiPolygon") {
            const mp = (f.geometry as GeoJSON.MultiPolygon).coordinates as number[][][][]
            // pick the polygon with most vertices
            let best: number[][] = []
            mp.forEach(poly => { if (poly[0].length > best.length) best = poly[0] })
            rings = [best]
          }
          if (!rings[0] || rings[0].length === 0) return
          let latSum = 0, lonSum = 0
          rings[0].forEach(([lon, lat]) => { latSum += lat; lonSum += lon })
          centroids.set(iso2, [latSum / rings[0].length, lonSum / rings[0].length])
        })
        geoCentroidsRef.current = centroids

        const layer = L.geoJSON(geo, {
          style: () => ({ fillColor: MC.countryNonMember, fillOpacity: 0.55, color: MC.border, weight: 0.8 }),
          onEachFeature: (feature, lyr) => {
            const iso2 = feature.properties?.iso2
            // Store iso2 on the layer for membership checks in hover
            ;(lyr as any)._iso2 = iso2
            lyr.on({
              mouseover: (e) => {
                const tgt = e.target as L.Path & { _iso2?: string }
                const tgtIso2 = tgt._iso2
                // Only highlight APPO member countries
                const isMember = tgtIso2 && memberCodesRef.current.has(tgtIso2)
                if (!isMember) return
                if (hoveredLayer.current && hoveredLayer.current !== tgt)
                  geoLayer.current?.resetStyle(hoveredLayer.current)
                hoveredLayer.current = tgt
                tgt.setStyle({ fillColor: MC.countryHover, fillOpacity: 0.9, color: MC.borderHover, weight: 1.5 })
              },
              mouseout: (e) => {
                const tgt = e.target as L.Path & { _iso2?: string }
                const tgtIso2 = tgt._iso2
                const isMember = tgtIso2 && memberCodesRef.current.has(tgtIso2)
                // Restore the correct style (blue for members, gray for non-members)
                tgt.setStyle(isMember
                  ? { fillColor: MC.countryDefault, fillOpacity: 0.7, color: MC.border, weight: 0.8 }
                  : { fillColor: MC.countryNonMember, fillOpacity: 0.45, color: MC.border, weight: 0.8 }
                )
                if (hoveredLayer.current === tgt) hoveredLayer.current = null
                if (!tooltipLocked.current) {
                  tooltipTimer.current = setTimeout(() => setTooltip(null), 150)
                }
              },
              click: () => {
                if (!iso2) return
                tooltipLocked.current = false
                setTooltip(null)
              },
            })
          },
        }).addTo(map)
        geoLayer.current = layer
        // Add marker/pipeline/label groups AFTER GeoJSON so they render on top
        mg.addTo(map)
        pg.addTo(map)
        lg.addTo(map)
        setGeoReady(true)
      })
      .catch(err => console.error("GeoJSON error:", err))

    map.on("click", () => { tooltipLocked.current = false; setTooltip(null) })

    return () => {
      destroyed = true
      hoveredLayer.current = null
      map.remove()
      leafletMap.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update GeoJSON fill based on selected countries & APPO membership ───────
  useEffect(() => {
    if (!geoLayer.current) return
    // DB stores ISO3 codes — convert to ISO2 for GeoJSON comparison
    const toIso2 = (iso3: string) => ISO3_TO_ISO2[iso3] ?? iso3
    const selectedIso2 = new Set(
      selectedCountries.length > 0
        ? countries.filter(c => selectedCountries.includes(c.id)).map(c => toIso2(c.code))
        : []
    )
    const memberCodes = new Set(countries.filter(c => c.appoMember).map(c => toIso2(c.code)))
    memberCodesRef.current = memberCodes  // keep ref in sync for hover handler
    geoLayer.current.setStyle((feature) => {
      const iso2 = feature?.properties?.iso2
      const isSelected = selectedIso2.size > 0 && iso2 && selectedIso2.has(iso2)
      const isMember   = iso2 && memberCodes.has(iso2)
      const fillColor  = isSelected ? MC.countrySelected
                       : isMember   ? MC.countryDefault
                       :              MC.countryNonMember
      const fillOpacity = isSelected ? 0.85 : isMember ? 0.7 : 0.45
      return {
        fillColor,
        fillOpacity,
        color: isSelected ? MC.borderHover : MC.border,
        weight: isSelected ? 1.2 : 0.8,
      }
    })
  }, [selectedCountries, countries, geoReady])

  // ── Render markers & layers ───────────────────────────────────────────────
  useEffect(() => {
    const mg = markersGrp.current
    const pg = polylinesGrp.current
    const lg = labelsGrp.current
    if (!mg || !pg || !lg) return

    mg.clearLayers()
    pg.clearLayers()
    lg.clearLayers()

    const filteredCountries = selectedCountries.length > 0
      ? countries.filter(c => selectedCountries.includes(c.id))
      : countries
    const filteredCodes = new Set(filteredCountries.map(c => c.code))

    // Country labels
    if (showLabels) {
      // Manual offsets [dLat, dLon] and optional wrap width override
      const LABEL_OFFSET: Record<string, [number, number]> = {
        CG: [0.9, 0.9],  // Congo: +15px up, +15px right
        NA: [0, -1.7],   // Namibia: +10px right (cumul: was -2.3, now -1.7)
        SN: [0.6, 0],    // Senegal
        EG: [-2, -4],    // Egypt
        CM: [-0.6, -0.6], // Cameroon: -10px down, -10px left
      }
      // Force word-wrap width (chars) for specific countries
      const LABEL_WRAP: Record<string, number> = {
        CI: 6,          // "Ivory Coast" → "Ivory\nCoast"
      }
      const toIso2Label = (iso3: string) => ISO3_TO_ISO2[iso3] ?? iso3
      filteredCountries.forEach(country => {
        const iso2 = toIso2Label(country.code)
        const centroid = geoCentroidsRef.current.get(iso2)
        const [baseLat, baseLon] = centroid ?? [country.lat, country.lon]
        const [dLat, dLon] = LABEL_OFFSET[iso2] ?? [0, 0]
        const [lat, lon] = [baseLat + dLat, baseLon + dLon]
        const lines = wrapText(country.name, LABEL_WRAP[iso2] ?? 14)
        const html = lines.map(l =>
          `<div style="line-height:1.2">${l}</div>`
        ).join("")
        const h = lines.length * 14
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:transparent;color:#0D2840;font-size:10px;font-weight:bold;font-family:Arial,sans-serif;text-align:center;text-shadow:0 0 3px white,0 0 6px white,0 0 3px white">${html}</div>`,
          iconSize: [90, h],
          iconAnchor: [45, h / 2],
        })
        L.marker([lat, lon], { icon, interactive: false }).addTo(lg)
      })
    }

    // Basins
    if (activeThemes.has("basins")) {
      basins.filter(b => filteredCodes.size === 0 || filteredCodes.has(b.country.code)).forEach(basin => {
        const rows = [
          { label: t.map.type, value: basin.type },
          ...(basin.areaKm2 ? [{ label: t.map.area, value: `${basin.areaKm2.toLocaleString()} km²` }] : []),
        ]
        const m = L.marker([basin.lat, basin.lon], { icon: pulsingMarker("#8B5E3C") })
        bindTip(m, e => ({ title: basin.name, subtitle: basin.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        m.addTo(mg)
      })
    }

    // Refineries
    if (activeThemes.has("refineries")) {
      refineries.filter(r => filteredCodes.size === 0 || filteredCodes.has(r.country.code)).forEach(ref => {
        const rows = [
          { label: t.map.capacity, value: `${ref.capacityKbd.toLocaleString()} kb/d` },
          { label: t.map.status,   value: ref.status },
        ]
        const m = L.marker([ref.lat, ref.lon], { icon: pulsingMarker("#F4B942", "🏭") })
        bindTip(m, e => ({ title: ref.name, subtitle: ref.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        m.addTo(mg)
      })
    }

    // Oil Reserves
    if (activeThemes.has("oil_reserves")) {
      reserves.filter(r => (filteredCodes.size === 0 || filteredCodes.has(r.country.code)) && r.oil > 0).forEach(rv => {
        const c = countries.find(c => c.code === rv.country.code); if (!c) return
        const m = L.marker([c.lat - 0.6, c.lon - 1.2], { icon: emojiMarker("🟢", 20) })
        bindTip(m, e => ({ title: `${c.name} — ${t.map.oilReserves}`, rows: [{ label: t.map.oilReserves, value: `${rv.oil} Gbbl` }, { label: t.map.year, value: `${rv.year}` }], x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null), false)
        m.addTo(mg)
      })
    }

    // Gas Reserves
    if (activeThemes.has("gas_reserves")) {
      reserves.filter(r => (filteredCodes.size === 0 || filteredCodes.has(r.country.code)) && r.gas > 0).forEach(rv => {
        const c = countries.find(c => c.code === rv.country.code); if (!c) return
        const m = L.marker([c.lat - 0.6, c.lon + 1.2], { icon: emojiMarker("🔵", 20) })
        bindTip(m, e => ({ title: `${c.name} — ${t.map.gasReserves}`, rows: [{ label: t.map.gasReserves, value: `${rv.gas} Tcf` }, { label: t.map.year, value: `${rv.year}` }], x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null), false)
        m.addTo(mg)
      })
    }

    // Oil Production
    if (activeThemes.has("oil_production")) {
      productions.filter(p => (filteredCodes.size === 0 || filteredCodes.has(p.country.code)) && p.oil > 0).forEach(pr => {
        const c = countries.find(c => c.code === pr.country.code); if (!c) return
        const m = L.marker([c.lat + 0.6, c.lon - 1.2], { icon: emojiMarker("🔴", 20) })
        bindTip(m, e => ({ title: `${c.name} — ${t.map.oilProduction}`, rows: [{ label: t.map.oilProduction, value: `${pr.oil.toLocaleString()} kb/d` }, { label: t.map.year, value: `${pr.year}` }], x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null), false)
        m.addTo(mg)
      })
    }

    // Gas Production
    if (activeThemes.has("gas_production")) {
      productions.filter(p => (filteredCodes.size === 0 || filteredCodes.has(p.country.code)) && p.gas > 0).forEach(pr => {
        const c = countries.find(c => c.code === pr.country.code); if (!c) return
        const m = L.marker([c.lat + 0.6, c.lon + 1.2], { icon: emojiMarker("🔥", 20) })
        bindTip(m, e => ({ title: `${c.name} — ${t.map.gasProduction}`, rows: [{ label: t.map.gasProduction, value: `${pr.gas.toLocaleString()} M m³/yr` }, { label: t.map.year, value: `${pr.year}` }], x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null), false)
        m.addTo(mg)
      })
    }

    // Pipelines
    if (activeThemes.has("pipelines")) {
      pipelines.filter(p => filteredCodes.size === 0 || p.countries.some(c => filteredCodes.has(c))).forEach(pipe => {
        const { color, dash } = pipelineStyle(pipe.status)
        const routeStr = pipe.countries.join(" → ")
        const rows = [
          { label: t.map.status, value: pipe.status },
          { label: "Route",      value: routeStr },
          ...(pipe.lengthKm ? [{ label: t.map.length,   value: `${pipe.lengthKm.toLocaleString()} km` }] : []),
          ...(pipe.diametre  ? [{ label: "Diamètre",     value: pipe.diametre }] : []),
          ...(pipe.capacity  ? [{ label: t.map.capacity, value: pipe.capacity }] : []),
        ]
        const coords = pipe.coords.map(c => [c[0], c[1]] as [number, number])
        const getTip = (e: L.LeafletMouseEvent) => ({ title: pipe.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY })
        // Visible line
        const pl = L.polyline(coords, { color, weight: 3, dashArray: dash, opacity: 0.85 })
        bindTip(pl, getTip, tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        pl.addTo(pg)
        // Invisible wide hit area for easier clicking
        const hit = L.polyline(coords, { color, weight: 16, opacity: 0, interactive: true })
        bindTip(hit, getTip, tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        hit.addTo(pg)

        if (showPipelineLabels && pipe.coords.length > 0) {
          const mid = pipe.coords[Math.floor(pipe.coords.length / 2)]
          L.marker([mid[0], mid[1]], {
            icon: L.divIcon({
              className: "",
              html: `<div style="background:${color};color:white;padding:2px 6px;border-radius:4px;font-size:10px;white-space:nowrap;font-weight:bold;font-family:Arial,sans-serif">${pipe.name}</div>`,
              iconSize: [200, 16], iconAnchor: [100, 8],
            }),
          }).addTo(pg)
        }
      })
    }

    // Training
    if (activeThemes.has("training")) {
      training.filter(inst => filteredCodes.size === 0 || filteredCodes.has(inst.country.code)).forEach(inst => {
        const rows = [
          { label: t.map.type, value: inst.type },
          ...(inst.year ? [{ label: t.map.year, value: `${inst.year}` }] : []),
        ]
        const m = L.marker([inst.lat, inst.lon], { icon: emojiMarker("🎓", 22) })
        bindTip(m, e => ({ title: inst.name, subtitle: inst.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null), false)
        m.addTo(mg)
      })
    }

    // R&D
    if (activeThemes.has("rnd")) {
      rndCenters.filter(r => filteredCodes.size === 0 || filteredCodes.has(r.country.code)).forEach(center => {
        const rows = [
          { label: "Focus", value: center.focus },
          ...(center.year ? [{ label: t.map.year, value: `${center.year}` }] : []),
        ]
        const m = L.marker([center.lat, center.lon], { icon: pulsingMarker("#1B4F72", "🔬") })
        bindTip(m, e => ({ title: center.name, subtitle: center.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null), false)
        m.addTo(mg)
      })
    }

    // Storage
    if (activeThemes.has("storage")) {
      storages.filter(s => filteredCodes.size === 0 || filteredCodes.has(s.country.code)).forEach(st => {
        const rows = [
          { label: t.map.type,     value: st.type },
          { label: t.map.capacity, value: `${st.capacityMb.toLocaleString()} Mb` },
        ]
        const m = L.marker([st.lat, st.lon], { icon: emojiMarker("🏪", 22) })
        bindTip(m, e => ({ title: st.name, subtitle: st.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null), false)
        m.addTo(mg)
      })
    }

    // Petrochem
    if (activeThemes.has("petrochem")) {
      petrochems.filter(p => filteredCodes.size === 0 || filteredCodes.has(p.country.code)).forEach(pc => {
        const rows = [
          { label: t.map.type,     value: pc.products.slice(0, 2).join(", ") },
          { label: t.map.capacity, value: pc.capacity },
        ]
        const m = L.marker([pc.lat, pc.lon], { icon: emojiMarker("🧬", 22) })
        bindTip(m, e => ({ title: pc.name, subtitle: pc.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null), false)
        m.addTo(mg)
      })
    }

  }, [countries, basins, refineries, pipelines, reserves, productions, training, rndCenters, storages, petrochems, selectedCountries, selectedYear, activeThemes, showLabels, showPipelineLabels, showTip, t])

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Ocean background */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #EBF5FB 0%, #D6EAF8 100%)" }} />

      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0 z-10" />

      {/* Tooltip */}
      {tooltip && (
        <MapTooltip
          tooltip={tooltip}
          onClose={closeTip}
          onMouseEnter={() => { if (tooltipTimer.current) clearTimeout(tooltipTimer.current) }}
          onMouseLeave={() => { if (!tooltipLocked.current) tooltipTimer.current = setTimeout(() => setTooltip(null), 120) }}
        />
      )}
    </div>
  )
}
