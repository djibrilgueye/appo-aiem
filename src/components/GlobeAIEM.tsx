"use client"

import React, { memo, useState, useRef, useCallback, useEffect } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import { geoCentroid } from "d3-geo"
import type { Feature, Geometry } from "geojson"

const APPO_MEMBERS = new Set(["DZ","AO","BJ","CM","CG","CD","CI","EG","GQ","GA","GH","LY","NA","NE","NG","SN","ZA","TD"])

const COUNTRY_INFO: Record<string, { fr: string; en: string }> = {
  DZ: { fr: "Algérie", en: "Algeria" },
  AO: { fr: "Angola", en: "Angola" },
  BJ: { fr: "Bénin", en: "Benin" },
  CM: { fr: "Cameroun", en: "Cameroon" },
  CG: { fr: "Rép. du Congo", en: "Congo" },
  CD: { fr: "RD Congo", en: "DR Congo" },
  CI: { fr: "Côte d'Ivoire", en: "Ivory Coast" },
  EG: { fr: "Égypte", en: "Egypt" },
  GQ: { fr: "Guinée équat.", en: "Eq. Guinea" },
  GA: { fr: "Gabon", en: "Gabon" },
  GH: { fr: "Ghana", en: "Ghana" },
  LY: { fr: "Libye", en: "Libya" },
  NA: { fr: "Namibie", en: "Namibia" },
  NE: { fr: "Niger", en: "Niger" },
  NG: { fr: "Nigéria", en: "Nigeria" },
  SN: { fr: "Sénégal", en: "Senegal" },
  ZA: { fr: "Afrique du Sud", en: "South Africa" },
  TD: { fr: "Tchad", en: "Chad" },
}

const COUNTRY_COORDS: Record<string, [number, number]> = {
  DZ: [2.6, 28.0], AO: [17.9, -11.2], BJ: [2.3, 9.3], CM: [12.3, 5.5],
  CG: [15.2, -0.8], CD: [23.0, -4.0], CI: [-5.7, 7.5], EG: [29.5, 26.8],
  GQ: [8.5, 1.7], GA: [11.6, -0.8], GH: [-1.2, 7.9], LY: [17.0, 27.0],
  NA: [17.1, -22.0], NE: [8.1, 17.6], NG: [8.2, 9.5], SN: [-14.2, 14.5],
  ZA: [25.0, -29.0], TD: [18.7, 15.5],
}

interface GeoFeatureProps {
  name: string
  "ISO3166-1-Alpha-2"?: string
  iso_a2?: string
  ISO_A2?: string
}
type GeoFeature = Feature<Geometry, GeoFeatureProps>

interface ProductionEntry {
  country: { code: string }
  oil: number
  gas: number
}

interface ProductionPoint {
  lon: number; lat: number; iso2: string
  oil: number; gas: number
}

interface GlobeAIEMProps {
  onSelectCountry?: (iso2: string) => void
  selectedCountry?: string | null
}

const SENSITIVITY = 0.25
const BASE_SCALE = 380
const GLOBE_DIAMETER_PCT = 88
const INITIAL_ROTATION: [number, number, number] = [-20, -5, 0]

// Animation d'oscillation (pendule)
const CENTER_LNG = -20
const CENTER_LAT = -5
const AMPLITUDE = 15
const PERIOD_MS = 25000

function GlobeAIEM({ onSelectCountry, selectedCountry }: GlobeAIEMProps) {
  const [geoData, setGeoData] = useState<{ features: GeoFeature[] } | null>(null)
  const [prodPoints, setProdPoints] = useState<ProductionPoint[]>([])

  // Drag & rotation states
  const [rotation, setRotation] = useState<[number, number, number]>(INITIAL_ROTATION)
  const [grabbing, setGrabbing] = useState(false)
  const isDragging = useRef(false)
  const hasDragged = useRef(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const rotStart = useRef<[number, number, number]>(INITIAL_ROTATION)

  // Animation automatique
  const animRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const isUserInteracting = useRef(false)

  // Charger le GeoJSON de l'Afrique
  useEffect(() => {
    fetch("/data/africa.geojson")
      .then(r => r.json())
      .then(setGeoData)
      .catch(console.error)
  }, [])

  // Charger les données de production
  useEffect(() => {
    fetch("/api/production")
      .then(r => r.json())
      .then((production: ProductionEntry[]) => {
        const latest: Record<string, ProductionEntry> = {}
        for (const p of production) {
          const iso2 = p.country?.code
          if (!iso2) continue
          if (!latest[iso2] || (p.oil ?? 0) > (latest[iso2].oil ?? 0)) {
            latest[iso2] = p
          }
        }
        const points: ProductionPoint[] = []
        for (const [iso2, p] of Object.entries(latest)) {
          const coords = COUNTRY_COORDS[iso2]
          if (!coords || (!p.oil && !p.gas)) continue
          points.push({ lon: coords[0], lat: coords[1], iso2, oil: p.oil ?? 0, gas: p.gas ?? 0 })
        }
        setProdPoints(points)
      })
      .catch(console.error)
  }, [])

  // Boucle d'animation d'oscillation
  useEffect(() => {
    const animate = (ts: number) => {
      if (!isUserInteracting.current) {
        if (!startTimeRef.current) startTimeRef.current = ts
        const elapsed = ts - startTimeRef.current
        const phase = (elapsed % PERIOD_MS) / PERIOD_MS
        const lng = CENTER_LNG + AMPLITUDE * Math.sin(phase * 2 * Math.PI)
        setRotation([lng, CENTER_LAT, 0])
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const getIso2 = (feat: GeoFeature) =>
    feat.properties?.["ISO3166-1-Alpha-2"] ?? feat.properties?.iso_a2 ?? feat.properties?.ISO_A2 ?? ""

  // Gestion de la rotation à la souris
  const onMouseDown = (e: React.MouseEvent) => {
    isUserInteracting.current = true
    isDragging.current = true
    hasDragged.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    rotStart.current = rotation
    setGrabbing(true)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true
    setRotation([
      rotStart.current[0] + dx * SENSITIVITY,
      Math.max(-85, Math.min(85, rotStart.current[1] - dy * SENSITIVITY)),
      rotStart.current[2],
    ])
  }

  const onMouseUp = () => {
    isDragging.current = false
    dragStart.current = null
    setGrabbing(false)
    // Relancer l'animation après un délai
    setTimeout(() => {
      if (!isDragging.current) {
        startTimeRef.current = null // Réinitialise l'origine temporelle
        isUserInteracting.current = false
      }
    }, 5000)
  }

  // Vérifier si un point est sur l'hémisphère visible
  const isPointVisible = useCallback((lon: number, lat: number) => {
    const [rx] = rotation
    const dLon = ((lon - (-rx)) + 540) % 360 - 180
    return Math.abs(dLon) <= 90
  }, [rotation])

  return (
    <div
      className="w-full h-full flex items-center justify-center relative select-none"
      style={{ cursor: grabbing ? "grabbing" : "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Arrière-plan Constellation (réseau étoilé) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" style={{ zIndex: 0 }}>
        <line x1="15%" y1="20%" x2="45%" y2="15%" stroke="#0F3B57" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="45%" y1="15%" x2="70%" y2="30%" stroke="#0F3B57" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="70%" y1="30%" x2="80%" y2="60%" stroke="#0F3B57" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="80%" y1="60%" x2="50%" y2="85%" stroke="#0F3B57" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="50%" y1="85%" x2="25%" y2="70%" stroke="#0F3B57" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="25%" y1="70%" x2="15%" y2="20%" stroke="#0F3B57" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="45%" y1="15%" x2="50%" y2="85%" stroke="#0F3B57" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="25%" y1="70%" x2="70%" y2="30%" stroke="#0F3B57" strokeWidth="0.8" strokeDasharray="3 3" />
        <circle cx="15%" cy="20%" r="3" fill="#0F3B57" />
        <circle cx="45%" cy="15%" r="3" fill="#F4B942" className="animate-pulse" />
        <circle cx="70%" cy="30%" r="3.5" fill="#0F3B57" />
        <circle cx="80%" cy="60%" r="2.5" fill="#0F3B57" />
        <circle cx="50%" cy="85%" r="4" fill="#F4B942" className="animate-pulse" />
        <circle cx="25%" cy="70%" r="3" fill="#0F3B57" />
      </svg>

      {/* Conteneur Océanique Sphérique du Globe (radial gradient 3D) */}
      <div
        aria-hidden="true"
        className="absolute rounded-full transition-transform duration-300"
        style={{
          width: `${GLOBE_DIAMETER_PCT}%`,
          aspectRatio: "1 / 1",
          background: "radial-gradient(circle at 35% 30%, #164e73 0%, #0c2b42 45%, #05131d 100%)",
          boxShadow: "0 10px 40px rgba(15,59,87,0.25), inset 0 0 45px rgba(0,0,0,0.6)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Carte SimpleMaps vectorielle (projection orthographique) */}
      {geoData && (
        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{ rotate: rotation, scale: BASE_SCALE }}
          className="w-full h-full"
          style={{ outline: "none", background: "transparent", position: "relative", zIndex: 2 }}
        >
          <Geographies geography={geoData}>
            {({ geographies }: { geographies: GeoFeature[] }) => {
              const africanGeos = geographies.filter(geo => getIso2(geo))
              return (
                <>
                  {/* Tracés géographiques des pays */}
                  {africanGeos.map((geo) => {
                    const iso2 = getIso2(geo)
                    const isSelected = selectedCountry === iso2
                    const isAppo = APPO_MEMBERS.has(iso2)
                    return (
                      <Geography
                        key={(geo as unknown as { rsmKey: string }).rsmKey}
                        geography={geo}
                        onClick={() => {
                          if (!hasDragged.current && iso2 && onSelectCountry) {
                            onSelectCountry(iso2)
                          }
                        }}
                        style={{
                          default: {
                            fill: isSelected ? "#F4B942" : isAppo ? "#065586" : "#E5EDF5",
                            stroke: "#FFFFFF",
                            strokeWidth: 0.5,
                            outline: "none",
                            transition: "fill 0.25s",
                          },
                          hover: {
                            fill: isSelected ? "#F4B942" : isAppo ? "#0a73b5" : "#D2E2F0",
                            stroke: "#FFFFFF",
                            strokeWidth: 0.8,
                            outline: "none",
                            cursor: "pointer",
                            transition: "fill 0.25s",
                          },
                          pressed: {
                            fill: "#F4B942",
                            stroke: "#FFFFFF",
                            strokeWidth: 0.8,
                            outline: "none",
                          },
                        }}
                      />
                    )
                  })}

                  {/* Noms des pays membres APPO */}
                  {africanGeos.map((geo) => {
                    const centroid = geoCentroid(geo)
                    const iso2 = getIso2(geo)
                    const isSelected = selectedCountry === iso2
                    const isAppo = APPO_MEMBERS.has(iso2)
                    if (!isAppo || !isPointVisible(centroid[0], centroid[1])) return null

                    const label = COUNTRY_INFO[iso2]?.fr || geo.properties.name

                    return (
                      <Marker key={`${(geo as unknown as { rsmKey: string }).rsmKey}-label`} coordinates={centroid}>
                        <text
                          y="2"
                          fontSize={isSelected ? 10 : 8}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          fill={isSelected ? "#0D2840" : "rgba(255,255,255,0.85)"}
                          fontWeight={isSelected ? "bold" : "normal"}
                          className="pointer-events-none transition-all duration-300"
                          style={{
                            fontFamily: "sans-serif",
                            textShadow: isSelected ? "none" : "1px 1px 2px rgba(0,0,0,0.7)",
                          }}
                        >
                          {label}
                        </text>
                      </Marker>
                    )
                  })}
                </>
              )
            }}
          </Geographies>

          {/* Spinners dynamiques de production (pétrole/gaz) */}
          {prodPoints.map((p) => {
            if (!isPointVisible(p.lon, p.lat)) return null
            const hasOil = p.oil > 0

            return (
              <Marker key={p.iso2} coordinates={[p.lon, p.lat]}>
                <g className="pointer-events-none">
                  {/* Halo d'animation pulsée (effet radar) */}
                  <circle
                    r="12"
                    fill={hasOil ? "rgba(239,68,68,0.2)" : "rgba(244,185,66,0.2)"}
                    className="animate-ping"
                  />

                  {/* Icône du marqueur */}
                  {hasOil ? (
                    /* Baril de pétrole miniature */
                    <g transform="translate(-6, -6) scale(0.5)" filter="drop-shadow(0 0 2px rgba(220,50,40,0.6))">
                      <ellipse cx="12" cy="5" rx="7" ry="2.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                      <path d="M5 5v14c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                      <ellipse cx="12" cy="19" rx="7" ry="2.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                      <path d="M5 9h14M5 15h14" stroke="#FFFFFF" strokeWidth="1.5" />
                    </g>
                  ) : (
                    /* Flamme de gaz miniature */
                    <g transform="translate(-6, -6) scale(0.5)" filter="drop-shadow(0 0 2px rgba(244,185,66,0.8))">
                      <path
                        fill="#F4B942"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        d="M12 2C12 2 8 7 8 11c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-1-3-1-3s-.5 2-1.5 2.5C13 9 12 2 12 2z"
                      />
                    </g>
                  )}
                </g>
              </Marker>
            )
          })}
        </ComposableMap>
      )}
    </div>
  )
}

export default memo(GlobeAIEM)
