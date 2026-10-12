"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { geoGraticule10, geoMercator, geoPath } from "d3-geo"
import type { Feature, FeatureCollection, Geometry } from "geojson"
import { Minus, Plus, RotateCcw } from "lucide-react"
import type { EnergyAsset, EnergyCountry } from "@/lib/preview/types"
import styles from "./EnergyAtlas.module.css"

interface EnergyAtlasProps {
  countries: EnergyCountry[]
  values: Record<string, number | null>
  selectedCountry: string
  onSelectCountry: (code: string) => void
  assets: EnergyAsset[]
  showAssets: boolean
  unit: string
  metricLabel: string
}

interface CountryProperties {
  name: string
  "ISO3166-1-Alpha-3": string
  "ISO3166-1-Alpha-2": string
}

type CountryFeature = Feature<Geometry, CountryProperties>
type Geography = FeatureCollection<Geometry, CountryProperties>

const WIDTH = 700
const HEIGHT = 470
const LABELS = new Set(["DZA", "LBY", "EGY", "NGA", "AGO", "COG", "SEN", "ZAF", "MOZ"])
const EXCLUDED_TERRITORIES = new Set(["ATF", "SHN", "IOT"])
const STATUS_LABELS: Record<string, string> = {
  operational: "En service", "under construction": "En construction", proposed: "Projet proposé",
  offline: "À l’arrêt", concept: "À l’étude", decommissioned: "Démantelé",
}

function formatValue(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: value < 10 ? 2 : 1 }).format(value)
}

function colorFor(value: number, maximum: number) {
  const position = maximum > 0 ? Math.min(1, Math.max(0, value / maximum)) : 0
  const pale = [213, 231, 225]
  const dark = [20, 72, 80]
  return `rgb(${pale.map((channel, i) => Math.round(channel + (dark[i] - channel) * position)).join(",")})`
}

function countryFor(feature: CountryFeature, index: Map<string, EnergyCountry>) {
  return index.get(feature.properties["ISO3166-1-Alpha-3"])
    ?? index.get(feature.properties["ISO3166-1-Alpha-2"])
}

function isCoordinate(lat: number | null, lon: number | null): lat is number {
  return lat !== null && lon !== null && Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

export default function EnergyAtlas({
  countries, values, selectedCountry, onSelectCountry, assets, showAssets, unit, metricLabel,
}: EnergyAtlasProps) {
  const id = useId().replace(/:/g, "")
  const [geography, setGeography] = useState<Geography | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [hoveredAsset, setHoveredAsset] = useState<EnergyAsset | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/data/africa.geojson", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Carte indisponible")
        return response.json() as Promise<Geography>
      })
      .then(data => {
        if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) throw new Error("Géométries invalides")
        setGeography({ ...data, features: data.features.filter(feature =>
          !EXCLUDED_TERRITORIES.has(feature.properties["ISO3166-1-Alpha-3"])
        ) })
      })
      .catch(error => { if (error.name !== "AbortError") setLoadError(true) })
    return () => controller.abort()
  }, [])

  const countryIndex = useMemo(() => new Map(countries.map(country => [country.code, country])), [countries])
  const maximum = useMemo(() => Math.max(0, ...countries.map(country => {
    const value = values[country.code]
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0
  })), [countries, values])
  const projection = useMemo(() => geography
    ? geoMercator().fitExtent([[92, 22], [618, 438]], geography)
    : null, [geography])
  const path = useMemo(() => projection ? geoPath(projection) : null, [projection])
  const selected = countryIndex.get(selectedCountry)
  const focusPoint = projection && selected && isCoordinate(selected.lat, selected.lon)
    ? projection([selected.lon, selected.lat]) : null
  const center = zoom > 1 && focusPoint ? focusPoint : [WIDTH / 2, HEIGHT / 2]
  const viewWidth = WIDTH / zoom
  const viewHeight = HEIGHT / zoom
  const viewX = Math.min(WIDTH - viewWidth, Math.max(0, center[0] - viewWidth / 2))
  const viewY = Math.min(HEIGHT - viewHeight, Math.max(0, center[1] - viewHeight / 2))
  const activeCountry = countryIndex.get(hoveredCountry ?? selectedCountry)
  const activeValue = activeCountry ? values[activeCountry.code] : null
  const hasActiveValue = typeof activeValue === "number" && Number.isFinite(activeValue) && activeValue >= 0
  const visibleAsset = showAssets ? hoveredAsset : null

  const labels = useMemo(() => geography?.features.flatMap(feature => {
    const country = countryFor(feature, countryIndex)
    if (!country || !projection || (!LABELS.has(feature.properties["ISO3166-1-Alpha-3"]) && country.code !== selectedCountry)) return []
    const point = projection([country.lon, country.lat])
    if (!point) return []
    return [{ country, iso: feature.properties["ISO3166-1-Alpha-3"], point }]
  }) ?? [], [geography, countryIndex, projection, selectedCountry])

  function selectAsset(asset: EnergyAsset) {
    setHoveredAsset(asset)
    const code = asset.countries.find(country => countryIndex.has(country))
    if (code) onSelectCountry(code)
  }

  return (
    <div className={styles.atlas}>
      <div className={styles.mapArea}>
        <div className={styles.mapHeading} aria-hidden="true">
          <span className={styles.eyebrow}>VUE CONTINENTALE</span>
          <span>Afrique</span>
        </div>
        <div className={styles.controls} aria-label="Commandes de la carte">
          <button type="button" title="Agrandir la carte" aria-label="Agrandir la carte" disabled={zoom >= 3 || !geography} onClick={() => setZoom(value => Math.min(3, value + 0.5))}><Plus size={16} /></button>
          <button type="button" title="Réduire la carte" aria-label="Réduire la carte" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - 0.5))}><Minus size={16} /></button>
          <span className={styles.controlDivider} />
          <button type="button" title="Réinitialiser la carte" aria-label="Réinitialiser la carte" disabled={zoom === 1} onClick={() => setZoom(1)}><RotateCcw size={14} /></button>
        </div>

        {!geography || !projection || !path ? (
          <div className={styles.loading} role="status">{loadError ? "La carte locale n’a pas pu être chargée." : "Chargement de la carte…"}</div>
        ) : (
          <svg className={styles.map} viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} aria-label={`Carte interactive de l’Afrique — ${metricLabel}, en ${unit}`} role="group">
            <defs>
              <pattern id={`${id}-nodata`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <rect width="5" height="5" fill="#e5e5dc" />
                <line x1="0" y1="0" x2="0" y2="5" stroke="#d4d7cc" strokeWidth="1" />
              </pattern>
            </defs>
            <path d={path(geoGraticule10()) ?? ""} fill="none" stroke="#dae5e1" strokeWidth="0.45" vectorEffect="non-scaling-stroke" pointerEvents="none" />
            <text x="139" y="288" className={styles.ocean} textAnchor="middle" pointerEvents="none">OCÉAN</text>
            <text x="139" y="302" className={styles.ocean} textAnchor="middle" pointerEvents="none">ATLANTIQUE</text>
            <text x="577" y="306" className={styles.ocean} textAnchor="middle" pointerEvents="none">OCÉAN</text>
            <text x="577" y="320" className={styles.ocean} textAnchor="middle" pointerEvents="none">INDIEN</text>
            {geography.features.map(feature => {
              const country = countryFor(feature, countryIndex)
              const code = country?.code
              const value = code ? values[code] : null
              const hasValue = typeof value === "number" && Number.isFinite(value) && value >= 0
              const isSelected = code === selectedCountry
              const name = country?.name ?? (feature.properties["ISO3166-1-Alpha-3"] === "ESH" ? "Sahara occidental" : feature.properties.name)
              const description = `${name} : ${hasValue ? `${formatValue(value)} ${unit}` : "donnée non renseignée"}`
              return (
                <path key={feature.properties["ISO3166-1-Alpha-3"]} d={path(feature) ?? ""}
                  className={country ? styles.country : styles.territory}
                  fill={isSelected ? "#bd924d" : hasValue ? colorFor(value, maximum) : `url(#${id}-nodata)`}
                  stroke={isSelected ? "#92703b" : "#fff"} strokeWidth={isSelected ? 1.4 : 0.85} vectorEffect="non-scaling-stroke"
                  tabIndex={country ? 0 : undefined} role={country ? "button" : undefined} aria-label={description} aria-pressed={country ? isSelected : undefined}
                  onClick={() => { if (code) { setHoveredAsset(null); onSelectCountry(code) } }}
                  onKeyDown={event => { if (code && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setHoveredAsset(null); onSelectCountry(code) } }}
                  onMouseEnter={() => { setHoveredAsset(null); setHoveredCountry(code ?? null) }} onMouseLeave={() => setHoveredCountry(null)}
                  onFocus={() => { setHoveredAsset(null); setHoveredCountry(code ?? null) }} onBlur={() => setHoveredCountry(null)}>
                  <title>{description}</title>
                </path>
              )
            })}
            {labels.map(({ country, iso, point }) => {
              const leader = iso === "SEN" || iso === "COG"
              const offset = iso === "SEN" ? -23 : iso === "COG" ? -30 : 0
              const labelX = point[0] + offset / zoom
              const labelY = point[1] + (iso === "COG" ? 20 : 0) / zoom
              const countryValue = values[country.code]
              const lightText = country.code !== selectedCountry && typeof countryValue === "number" && maximum > 0 && countryValue / maximum > 0.55
              return <g key={country.code} pointerEvents="none">
                {leader && <line x1={point[0]} y1={point[1]} x2={labelX + 4 / zoom} y2={labelY - 3 / zoom} stroke="#7c8984" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />}
                <text x={labelX} y={labelY} textAnchor={leader ? "end" : "middle"} dominantBaseline="central"
                  className={`${styles.countryLabel} ${lightText && !leader ? styles.lightLabel : ""}`}
                  style={{ fontSize: `${(country.code === selectedCountry ? 10.5 : 9.5) / Math.sqrt(zoom)}px` }}>
                  {iso === "COG" ? "Rép. du Congo" : country.name}
                </text>
              </g>
            })}
            {showAssets && assets.map(asset => {
              const lineCoordinates = asset.coords.filter(([lat, lon]) => isCoordinate(lat, lon))
              const line = asset.kind === "pipelines" && lineCoordinates.length > 1
                ? path({ type: "LineString", coordinates: lineCoordinates.map(([lat, lon]) => [lon, lat]) }) : null
              const point = isCoordinate(asset.lat, asset.lon) ? projection([asset.lon as number, asset.lat]) : null
              if (!line && !point) return null
              const label = `${asset.name} · ${STATUS_LABELS[asset.status] ?? (asset.status || "Statut non renseigné")}${line ? " · tracé indicatif" : " · position indicative"}`
              return <g key={`${asset.kind}-${asset.id}`} role="button" tabIndex={0} aria-label={label} className={styles.asset}
                onMouseEnter={() => setHoveredAsset(asset)} onMouseLeave={() => setHoveredAsset(null)} onFocus={() => setHoveredAsset(asset)} onBlur={() => setHoveredAsset(null)}
                onClick={() => selectAsset(asset)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectAsset(asset) } }}>
                <title>{label}</title>
                {line && <><path d={line} fill="none" stroke="transparent" strokeWidth="12" vectorEffect="non-scaling-stroke" /><path d={line} fill="none" stroke="#b2823b" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" /></>}
                {point && <><circle cx={point[0]} cy={point[1]} r={9 / zoom} fill="transparent" /><circle cx={point[0]} cy={point[1]} r={3.5 / zoom} fill="#fff" stroke="#825f27" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /><circle cx={point[0]} cy={point[1]} r={1.2 / zoom} fill="#825f27" /></>}
              </g>
            })}
          </svg>
        )}

        <div className={styles.readout} role="status" aria-live="polite" aria-atomic="true">
          {visibleAsset ? <>
            <span className={styles.readoutLabel}>INFRASTRUCTURE</span>
            <strong>{visibleAsset.name}</strong>
            <span>{STATUS_LABELS[visibleAsset.status] ?? (visibleAsset.status || "Statut non renseigné")}</span>
            <small>{visibleAsset.kind === "pipelines" ? "Tracé indicatif" : "Position indicative"}</small>
          </> : activeCountry ? <>
            <span className={styles.readoutLabel}>{hoveredCountry && hoveredCountry !== selectedCountry ? "EXPLORER LE PAYS" : "PAYS SÉLECTIONNÉ"}</span>
            <strong>{activeCountry.name}</strong>
            <span className={styles.readoutValue}>{hasActiveValue ? formatValue(activeValue) : "—"} <small>{hasActiveValue ? unit : "Donnée non renseignée"}</small></span>
          </> : <><strong>Explorer le continent</strong><span>Sélectionnez un pays pour consulter ses données.</span></>}
        </div>
        <div className={styles.north} aria-hidden="true"><span>N</span><svg width="10" height="21" viewBox="0 0 10 21"><path d="M5 1 1 12 5 10 9 12Z" fill="#526b66" /><path d="M5 10v10" stroke="#526b66" /></svg></div>
        <span className={styles.attribution}>Contours indicatifs</span>
      </div>
      <div className={styles.legend}>
        <div className={styles.scale}>
          <span className={styles.legendTitle}>{metricLabel} <span>({unit})</span></span>
          <div className={styles.gradient} style={{ background: `linear-gradient(90deg, ${colorFor(0, maximum)}, ${colorFor(maximum, maximum)})` }} />
          <div className={styles.scaleValues}><span>0</span>{maximum > 0 && <><span>{formatValue(maximum / 2)}</span><span>{formatValue(maximum)}</span></>}</div>
        </div>
        <div className={styles.legendKeys}>
          <span><i className={styles.missingSwatch} />Non renseigné</span>
          <span><i className={styles.selectedSwatch} />Sélection</span>
          {showAssets && <span><i className={styles.assetSwatch} />Infrastructure indicative</span>}
        </div>
      </div>
    </div>
  )
}
