"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Globe, { GlobeMethods } from "react-globe.gl"

const APPO_MEMBERS = new Set(["DZ","AO","BJ","CM","CG","CD","CI","EG","GQ","GA","GH","LY","NA","NE","NG","SN","ZA","TD"])

// ISO3 → ISO2
const ISO3_TO_ISO2: Record<string, string> = {
  DZA:"DZ", AGO:"AO", BEN:"BJ", CMR:"CM", COG:"CG", COD:"CD", CIV:"CI",
  EGY:"EG", GNQ:"GQ", GAB:"GA", GHA:"GH", LBY:"LY", NAM:"NA", NER:"NE",
  NGA:"NG", SEN:"SN", ZAF:"ZA", TCD:"TD",
}

// Coordonnées pays (centroïdes) pour les marqueurs de production
const COUNTRY_COORDS: Record<string, [number, number]> = {
  DZ:[28.0,2.6], AO:[-11.2,17.9], BJ:[9.3,2.3], CM:[5.5,12.3],
  CG:[-0.8,15.2], CD:[-4.0,23.0], CI:[7.5,-5.7], EG:[26.8,29.5],
  GQ:[1.7,8.5], GA:[-0.8,11.6], GH:[7.9,-1.2], LY:[27.0,17.0],
  NA:[-22.0,17.1], NE:[17.6,8.1], NG:[9.5,8.2], SN:[14.5,-14.2],
  ZA:[-29.0,25.0], TD:[15.5,18.7],
}

interface GeoFeature {
  type: string
  properties: { name: string; "ISO3166-1-Alpha-2"?: string; iso_a2?: string; ISO_A2?: string }
  geometry: object
}

interface ProductionEntry {
  country: { code: string }
  oil: number
  gas: number
}

interface PipelineEntry {
  name: string
  countries: string[]
  coords: [number, number][]
  status: string
}

interface ProductionPoint {
  lat: number; lng: number; iso2: string
  oil: number; gas: number
}

interface ArcEntry {
  name: string
  startLat: number; startLng: number
  endLat: number; endLng: number
  color: string
  status: string
}

interface TooltipState {
  iso2?: string
  name: string
  isMember?: boolean
  kind: "country" | "pipeline"
  status?: string
  x: number
  y: number
}

interface GlobeAIEMProps {
  onSelectCountry?: (iso2: string) => void
  selectedCountry?: string | null
}

export default function GlobeAIEM({ onSelectCountry, selectedCountry }: GlobeAIEMProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 800 })
  const [geoData, setGeoData] = useState<{ features: GeoFeature[] } | null>(null)
  const [prodPoints, setProdPoints] = useState<ProductionPoint[]>([])
  const [arcs, setArcs] = useState<ArcEntry[]>([])
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Resize
  useEffect(() => {
    if (!containerRef.current) return
    const update = () => {
      if (containerRef.current)
        setSize({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // GeoJSON
  useEffect(() => {
    fetch("/data/africa.geojson").then(r => r.json()).then(setGeoData).catch(console.error)
  }, [])

  // Production + Pipelines
  useEffect(() => {
    Promise.all([
      fetch("/api/production").then(r => r.json()).catch(() => []),
      fetch("/api/pipelines").then(r => r.json()).catch(() => []),
    ]).then(([production, pipelines]: [ProductionEntry[], PipelineEntry[]]) => {
      // Production: dernière année disponible par pays
      const latest: Record<string, ProductionEntry> = {}
      for (const p of production) {
        const iso2 = ISO3_TO_ISO2[p.country?.code] ?? p.country?.code
        if (!latest[iso2] || (p.oil ?? 0) > (latest[iso2].oil ?? 0)) {
          latest[iso2] = p
        }
      }
      const points: ProductionPoint[] = []
      for (const [iso2, p] of Object.entries(latest)) {
        const coords = COUNTRY_COORDS[iso2]
        if (!coords || (!p.oil && !p.gas)) continue
        points.push({ lat: coords[0], lng: coords[1], iso2, oil: p.oil ?? 0, gas: p.gas ?? 0 })
      }
      setProdPoints(points)

      // Pipelines multi-pays uniquement
      const arcList: ArcEntry[] = []
      for (const pipe of pipelines) {
        if (!pipe.coords || pipe.coords.length < 2) continue
        const isMulti = pipe.countries && pipe.countries.length > 1
        if (!isMulti) continue
        // Couleur selon statut
        const color =
          pipe.status === "operational"      ? "rgba(244,185,66,0.85)" :
          pipe.status === "under construction"? "rgba(76,201,240,0.75)" :
          "rgba(180,180,180,0.45)"
        // Découper en segments consécutifs
        for (let i = 0; i < pipe.coords.length - 1; i++) {
          arcList.push({
            name: pipe.name,
            startLat: pipe.coords[i][0], startLng: pipe.coords[i][1],
            endLat: pipe.coords[i+1][0], endLng: pipe.coords[i+1][1],
            color,
            status: pipe.status,
          })
        }
      }
      setArcs(arcList)
    })
  }, [])

  const getIso2 = (feat: GeoFeature) =>
    feat.properties?.["ISO3166-1-Alpha-2"] ?? feat.properties?.iso_a2 ?? feat.properties?.ISO_A2 ?? ""

  const getColor = useCallback((feat: object) => {
    const iso2 = getIso2(feat as GeoFeature)
    if (iso2 === selectedCountry) return "rgba(244, 185, 66, 0.95)"
    return APPO_MEMBERS.has(iso2) ? "rgba(27, 100, 160, 0.88)" : "rgba(200, 218, 232, 0.75)"
  }, [selectedCountry])

  const getSideColor = useCallback((feat: object) => {
    const iso2 = getIso2(feat as GeoFeature)
    if (iso2 === selectedCountry) return "rgba(200, 140, 20, 1)"
    return APPO_MEMBERS.has(iso2) ? "rgba(15, 70, 120, 1)" : "rgba(160, 185, 205, 0.8)"
  }, [selectedCountry])

  const getAltitude = useCallback((feat: object) => {
    const iso2 = getIso2(feat as GeoFeature)
    if (iso2 === selectedCountry) return 0.02
    return APPO_MEMBERS.has(iso2) ? 0.012 : 0.004
  }, [selectedCountry])

  const handleClick = useCallback((feat: object, event: MouseEvent) => {
    const f = feat as GeoFeature
    const iso2 = getIso2(f)
    if (!iso2) return
    const isMember = APPO_MEMBERS.has(iso2)
    const name = f.properties?.name ?? iso2
    const rect = containerRef.current?.getBoundingClientRect()
    const x = rect ? event.clientX - rect.left : event.clientX
    const y = rect ? event.clientY - rect.top : event.clientY
    setTooltip({ iso2, name, isMember, kind: "country", x, y })
    if (onSelectCountry) onSelectCountry(iso2)
  }, [onSelectCountry])

  const handleArcClick = useCallback((arc: object, event: MouseEvent) => {
    const a = arc as ArcEntry
    const rect = containerRef.current?.getBoundingClientRect()
    const x = rect ? event.clientX - rect.left : event.clientX
    const y = rect ? event.clientY - rect.top : event.clientY
    setTooltip({ name: a.name, status: a.status, kind: "pipeline", x, y })
  }, [])

  // Marqueurs HTML pour production — icônes baril et flamme
  const makeHtmlElement = useCallback((d: object) => {
    const p = d as ProductionPoint
    const hasOil = p.oil > 0
    const hasGas = p.gas > 0
    const el = document.createElement("div")
    el.style.cssText = "display:flex;gap:2px;align-items:center;pointer-events:none;"

    if (hasOil) {
      const size = Math.min(22, Math.max(10, Math.log10(p.oil + 1) * 6))
      const wrap = document.createElement("div")
      wrap.style.cssText = `
        width:${size}px; height:${size}px;
        filter: drop-shadow(0 0 3px rgba(220,80,60,0.7));
      `
      wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(220,80,60,0.95)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}">
        <ellipse cx="12" cy="5" rx="7" ry="2.5"/>
        <ellipse cx="12" cy="19" rx="7" ry="2.5"/>
        <line x1="5" y1="5" x2="5" y2="19"/>
        <line x1="19" y1="5" x2="19" y2="19"/>
        <path d="M5 9 Q12 11 19 9"/>
        <path d="M5 15 Q12 17 19 15"/>
      </svg>`
      el.appendChild(wrap)
    }

    if (hasGas) {
      const size = Math.min(22, Math.max(10, Math.log10(p.gas + 1) * 4))
      const wrap = document.createElement("div")
      wrap.style.cssText = `
        width:${size}px; height:${size}px;
        filter: drop-shadow(0 0 3px rgba(251,191,36,0.7));
      `
      wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="rgba(251,191,36,0.9)" stroke="none" width="${size}" height="${size}">
        <path d="M12 2C12 2 8 7 8 11c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-1-3-1-3s-.5 2-1.5 2.5C13 9 12 2 12 2z"/>
        <path d="M7 17c0-2.8 2.2-5 5-5s5 2.2 5 5c0 2.2-1.8 4-5 4s-5-1.8-5-4z" opacity="0.7"/>
        <path d="M12 14c0 0-1.5 1.5-1.5 3s.7 2 1.5 2 1.5-.7 1.5-2S12 14 12 14z" fill="white" opacity="0.5"/>
      </svg>`
      el.appendChild(wrap)
    }

    return el
  }, [])

  // Animation ±20° autour du centre Afrique
  const animRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const CENTER_LNG = 20
  const CENTER_LAT = 2
  const AMPLITUDE = 15
  const PERIOD_MS = 30000

  const handleGlobeReady = useCallback(() => {
    const g = globeRef.current
    if (!g) return
    g.pointOfView({ lat: CENTER_LAT, lng: CENTER_LNG, altitude: 1.65 }, 0)
    const ctrl = g.controls()
    ctrl.autoRotate = false
    ctrl.enableZoom = false
    ctrl.enablePan = false

    const animate = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current
      const phase = (elapsed % PERIOD_MS) / PERIOD_MS
      const lng = CENTER_LNG + AMPLITUDE * Math.sin(phase * 2 * Math.PI)
      g.pointOfView({ lat: CENTER_LAT, lng, altitude: 1.65 }, 0)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full" onClick={(e) => {
      // Ferme le tooltip si clic en dehors d'un pays
      if ((e.target as HTMLElement).tagName === "CANVAS") setTooltip(null)
    }}>
      {/* Tooltip au clic — stable, ne dépend pas du hover */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: Math.min(tooltip.x + 12, size.w - 200),
            top: Math.max(tooltip.y - 70, 8),
            zIndex: 20,
            pointerEvents: "none",
            background: "rgba(13,40,64,0.95)",
            color: "white",
            padding: "8px 13px",
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "Arial, sans-serif",
            border: `1px solid ${tooltip.kind === "pipeline" ? "rgba(244,185,66,0.55)" : tooltip.isMember ? "rgba(244,185,66,0.6)" : "rgba(255,255,255,0.15)"}`,
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            whiteSpace: "nowrap",
            minWidth: "120px",
          }}
        >
          {tooltip.kind === "pipeline" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: tooltip.status === "operational" ? "#F4B942" : tooltip.status === "under construction" ? "#4cc9f0" : "#aaa", flexShrink: 0 }} />
                <div style={{ fontWeight: "bold" }}>{tooltip.name}</div>
              </div>
              <div style={{
                fontSize: "10px",
                color: tooltip.status === "operational" ? "#F4B942" : tooltip.status === "under construction" ? "#4cc9f0" : "#aaa",
              }}>
                {tooltip.status === "operational" ? "● Opérationnel" : tooltip.status === "under construction" ? "● En construction" : `● ${tooltip.status}`}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: "bold", marginBottom: tooltip.isMember ? 3 : 0 }}>{tooltip.name}</div>
              {tooltip.isMember && <div style={{ color: "#F4B942", fontSize: "10px" }}>● Membre APPO</div>}
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginTop: 2 }}>Voir le profil →</div>
            </>
          )}
        </div>
      )}
      {geoData && (
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl=""
          atmosphereColor="#a8d0ee"
          atmosphereAltitude={0.18}
          // Polygones pays
          polygonsData={geoData.features}
          polygonCapColor={getColor}
          polygonSideColor={getSideColor}
          polygonStrokeColor={() => "rgba(100,150,190,0.4)"}
          polygonAltitude={getAltitude}
          onPolygonClick={handleClick}
          polygonsTransitionDuration={200}
          // Arcs pipelines multi-pays
          arcsData={arcs}
          arcStartLat={(d) => (d as ArcEntry).startLat}
          arcStartLng={(d) => (d as ArcEntry).startLng}
          arcEndLat={(d) => (d as ArcEntry).endLat}
          arcEndLng={(d) => (d as ArcEntry).endLng}
          arcColor={(d: object) => (d as ArcEntry).color}
          arcStroke={1.8}
          arcAltitude={0.03}
          onArcClick={handleArcClick}
          // Marqueurs production HTML
          htmlElementsData={prodPoints}
          htmlLat={(d) => (d as ProductionPoint).lat}
          htmlLng={(d) => (d as ProductionPoint).lng}
          htmlAltitude={0.025}
          htmlElement={makeHtmlElement}
          onGlobeReady={handleGlobeReady}
          rendererConfig={{ antialias: true, alpha: true }}
        />
      )}
      {/* Légende */}
      <div className="absolute bottom-16 left-3 z-10 flex flex-col gap-1.5 px-3 py-2 rounded-lg"
        style={{ backgroundColor: "rgba(255,255,255,0.88)", border: "1px solid #D0E4F0", boxShadow: "0 2px 8px rgba(27,79,114,0.1)" }}>
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(220,80,60,0.95)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, flexShrink: 0 }}>
            <ellipse cx="12" cy="5" rx="7" ry="2.5"/><ellipse cx="12" cy="19" rx="7" ry="2.5"/>
            <line x1="5" y1="5" x2="5" y2="19"/><line x1="19" y1="5" x2="19" y2="19"/>
            <path d="M5 9 Q12 11 19 9"/><path d="M5 15 Q12 17 19 15"/>
          </svg>
          <span className="text-[10px] font-medium" style={{ color: "#1B4F72" }}>Production pétrolière</span>
        </div>
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="rgba(251,191,36,0.95)" stroke="none" style={{ width: 14, height: 14, flexShrink: 0 }}>
            <path d="M12 2C12 2 8 7 8 11c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-1-3-1-3s-.5 2-1.5 2.5C13 9 12 2 12 2z"/>
            <path d="M7 17c0-2.8 2.2-5 5-5s5 2.2 5 5c0 2.2-1.8 4-5 4s-5-1.8-5-4z" opacity="0.7"/>
          </svg>
          <span className="text-[10px] font-medium" style={{ color: "#1B4F72" }}>Production gazière</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5" style={{ backgroundColor: "rgba(244,185,66,0.85)" }} />
          <span className="text-[10px] font-medium" style={{ color: "#1B4F72" }}>Pipeline (opérationnel)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5" style={{ backgroundColor: "rgba(76,201,240,0.75)" }} />
          <span className="text-[10px] font-medium" style={{ color: "#1B4F72" }}>Pipeline (en construction)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5" style={{ backgroundColor: "rgba(180,180,180,0.55)" }} />
          <span className="text-[10px] font-medium" style={{ color: "#1B4F72" }}>Pipeline (proposé)</span>
        </div>
      </div>
    </div>
  )
}
