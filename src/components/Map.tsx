"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { X, MapPin, FileText, Image, File, ExternalLink, FolderOpen } from "lucide-react"
import { useLanguage } from "@/i18n/LanguageContext"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Country {
  id: string; code: string; name: string; region: string; lat: number; lon: number; appoMember: boolean
  capital?: string | null; currency?: string | null; independence?: string | null
  population?: number | null; gdpBnUsd?: number | null; economyDesc?: string | null; flagEmoji?: string | null
}

interface NationalCompany {
  id: string; name: string; acronym: string | null; founded: number | null; website: string | null; description: string | null
}

interface CountryProfile {
  id: string; name: string; code: string; flagEmoji: string | null
  capital: string | null; currency: string | null; independence: string | null
  population: number | null; gdpBnUsd: number | null; economyDesc: string | null
  nationalCompanies: NationalCompany[]
  reserves: { oil: number; gas: number; year: number }[]
  productions: { oil: number; gas: number; year: number }[]
  basins: { id: string; name: string; type: string }[]
}
interface Basin {
  id: string; name: string; type: string; lat: number; lon: number; areaKm2?: number; description?: string | null; country: { name: string; code: string }
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
interface OilBlock {
  id: string; name: string; blockId: string; status: string; type: string
  operator: string | null; awardDate: number | null; areaKm2: number | null
  lat: number | null; lon: number | null; basinId: string
  country: { name: string; code: string }; basin: { name: string }
}
interface OilField {
  id: string; name: string; fieldId: string; type: string; status: string
  operator: string | null; discoveryYear: number | null; productionStart: number | null
  oilMmb: number | null; gasBcf: number | null; lat: number; lon: number; basinId: string
  country: { name: string; code: string }; basin: { name: string }
}
interface TradePartner { partner: string; hydro: string; qty: number; unit: string }
interface TradeRow {
  id: string; year: number
  oilIntraKbD: number; gasIntraBcm: number
  oilExtraKbD: number; gasExtraBcm: number
  essenceM3: number | null; gasoilM3: number | null; gplTM: number | null; jetFuelTM: number | null
  partnersDetail: string   // JSON: TradePartner[]
  country: { name: string; code: string; lat: number; lon: number }
}

interface MapProps {
  selectedCountries: string[]
  selectedYear: number
  selectedRegion?: string
  activeThemes: Set<string>
  showLabels: boolean
  showPipelineLabels?: boolean
}

// ─── APPO Map Colors ──────────────────────────────────────────────────────────

const MC = {
  ocean:              "#B8D0E8",   // bleu océan soutenu
  countryDefault:     "#5B9EC9",   // APPO member, région active — bleu moyen franc
  countryMemberOff:   "#4A82A6",   // APPO member, hors région — bleu atténué
  countryNonMember:   "#D4DCE4",   // non-APPO member — gris bleuté neutre
  countryHover:       "#2E86C1",   // survol — bleu vif
  countrySelected:    "#0D3B5E",   // sélectionné — bleu très foncé
  countrySelectedH:   "#092D4A",
  border:             "#3A7CA5",   // bordure bien définie
  borderHover:        "#1B4F72",
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

// ─── Partner name → ISO2 (for trade highlight) ────────────────────────────────
// Maps French country/zone names used in partnersDetail to GeoJSON iso2 codes.
// Zones hors-Afrique (Europe, Amérique, etc.) are not on the map → ignored.
const PARTNER_NAME_TO_ISO2: Record<string, string> = {
  "Algérie": "DZ", "Algeria": "DZ",
  "Angola": "AO",
  "Bénin": "BJ", "Benin": "BJ",
  "Botswana": "BW",
  "Burkina Faso": "BF",
  "Burundi": "BI",
  "Cameroun": "CM", "Cameroon": "CM",
  "Cap-Vert": "CV",
  "Centrafrique": "CF",
  "Tchad": "TD", "Chad": "TD",
  "Comores": "KM",
  "Congo": "CG",
  "RD Congo": "CD", "RDC": "CD",
  "Côte d'Ivoire": "CI",
  "Djibouti": "DJ",
  "Égypte": "EG", "Egypte": "EG", "Egypt": "EG",
  "Guinée Équatoriale": "GQ", "Equatorial Guinea": "GQ",
  "Érythrée": "ER",
  "Eswatini": "SZ",
  "Éthiopie": "ET", "Ethiopia": "ET",
  "Gabon": "GA",
  "Gambie": "GM",
  "Ghana": "GH",
  "Guinée": "GN", "Guinea": "GN",
  "Guinée-Bissau": "GW",
  "Kenya": "KE",
  "Lesotho": "LS",
  "Libéria": "LR", "Liberia": "LR",
  "Libye": "LY", "Libya": "LY",
  "Madagascar": "MG",
  "Malawi": "MW",
  "Mali": "ML",
  "Mauritanie": "MR", "Mauritania": "MR",
  "Maurice": "MU",
  "Maroc": "MA", "Morocco": "MA",
  "Mozambique": "MZ",
  "Namibie": "NA", "Namibia": "NA",
  "Niger": "NE",
  "Nigéria": "NG", "Nigeria": "NG",
  "Rwanda": "RW",
  "Sao Tomé & P.": "ST", "Sao Tomé-et-Principe": "ST", "São Tomé": "ST",
  "Sénégal": "SN", "Senegal": "SN",
  "Seychelles": "SC",
  "Sierra Leone": "SL",
  "Somalie": "SO",
  "Afrique du Sud": "ZA", "South Africa": "ZA",
  "Soudan du Sud": "SS", "South Sudan": "SS",
  "Soudan": "SD", "Sudan": "SD",
  "Tanzanie": "TZ", "Tanzania": "TZ",
  "Togo": "TG",
  "Tunisie": "TN", "Tunisia": "TN",
  "Ouganda": "UG", "Uganda": "UG",
  "Zambie": "ZM", "Zambia": "ZM",
  "Zimbabwe": "ZW",
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

  // Draggable state — only active when locked
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  // When tooltip first locks, capture position
  useEffect(() => {
    if (tooltip.locked && pos === null) {
      const x = Math.min(tooltip.x + 16, window.innerWidth - 280)
      const y = Math.max(tooltip.y - 20, 10)
      setPos({ x, y })
    }
    if (!tooltip.locked) setPos(null)
  }, [tooltip.locked]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tooltip.locked) return
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 270, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 80,  e.clientY - dragOffset.current.y)),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [tooltip.locked])

  const left = pos ? pos.x : Math.min(tooltip.x + 16, window.innerWidth - 280)
  const top  = pos ? pos.y : Math.max(tooltip.y - 20, 10)

  return (
    <div className="fixed z-[2000] pointer-events-auto select-none" style={{ left, top }}
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className={`bg-white rounded-xl shadow-xl border overflow-hidden w-64 ${tooltip.locked ? "border-[#1B4F72] ring-2 ring-[#A3C4DC]" : "border-slate-200"}`}>
        <div
          className={`px-4 py-3 flex items-start justify-between ${tooltip.locked ? "cursor-grab active:cursor-grabbing" : ""}`}
          style={{ background: "linear-gradient(135deg, #1B4F72, #2980B9)" }}
          onMouseDown={tooltip.locked ? (e) => {
            dragging.current = true
            dragOffset.current = { x: e.clientX - left, y: e.clientY - top }
            e.preventDefault()
          } : undefined}
        >
          <div>
            <div className="font-bold text-white text-sm leading-tight">{tooltip.title}</div>
            {tooltip.subtitle && <div className="text-blue-200 text-xs mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{tooltip.subtitle}</div>}
          </div>
          {tooltip.locked && (
            <button onClick={onClose} className="text-blue-200 hover:text-white ml-2 flex-shrink-0"><X className="h-4 w-4" /></button>
          )}
        </div>
        <div className="px-4 py-3 space-y-1.5 max-h-64 overflow-y-auto">
          {tooltip.rows.map((r, i) => (
            <div key={`${r.label}-${i}`}>
              {i === 2 && (
                <div className="border-t border-[#EBF3FB] pt-1.5 mb-1">
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#5B8FB9" }}>
                    Partenaires
                  </div>
                </div>
              )}
              <div className="flex justify-between text-xs gap-2">
                <span style={{ color: i >= 2 ? "#1B4F72" : "#6C757D" }} className="shrink-0">{r.label}</span>
                <span className="font-semibold text-right leading-relaxed" style={{ color: "#0D2840" }}>
                  {Array.isArray(r.value) ? r.value.join(" → ") : r.value}
                </span>
              </div>
            </div>
          ))}
        </div>
        {tooltip.locked && <p className="text-xs text-center pb-2" style={{ color: "#A3C4DC" }}>{t.map.legend}</p>}
      </div>
    </div>
  )
}

// ─── Country Documents Panel ─────────────────────────────────────────────────

interface CountryDoc {
  id: string; title: string; description: string | null; type: string
  fileName: string; filePath: string; mimeType: string | null
}

function docIcon(type: string) {
  if (type === "photo") return <Image size={13} className="text-sky-500 shrink-0" />
  if (type === "pdf" || type === "report") return <FileText size={13} className="text-red-400 shrink-0" />
  if (type === "map") return <File size={13} className="text-green-500 shrink-0" />
  return <File size={13} className="text-slate-400 shrink-0" />
}

function DocsPanel({ countryId, countryName, onClose, previewDoc, setPreviewDoc }: {
  countryId: string
  countryName: string
  onClose: () => void
  previewDoc: CountryDoc | null
  setPreviewDoc: (d: CountryDoc | null) => void
}) {
  const [docs, setDocs] = useState<CountryDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/countries/${countryId}/documents`)
      .then(r => r.json())
      .then(d => { setDocs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [countryId])

  return (
    <div className="fixed z-[2100] bottom-4 right-4 w-72 bg-white rounded-xl shadow-2xl border border-[#D0E4F0] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "linear-gradient(135deg, #1B4F72, #2980B9)" }}>
        <div className="flex items-center gap-2">
          <FolderOpen size={15} className="text-blue-200" />
          <span className="text-white text-sm font-semibold truncate">{countryName}</span>
        </div>
        <button onClick={onClose} className="text-blue-200 hover:text-white"><X size={16} /></button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <p className="text-center text-[#5B8FB9] text-xs py-4">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="text-center text-[#5B8FB9] text-xs py-4">No documents for this country.</p>
        ) : (
          <ul className="divide-y divide-[#EBF3FB]">
            {docs.map(doc => (
              <li key={doc.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#F4F7FB]">
                {docIcon(doc.type)}
                <span className="flex-1 text-xs text-[#0D2840] truncate" title={doc.title}>{doc.title}</span>
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="text-[#1B4F72] hover:text-[#5B8FB9] text-xs font-semibold underline underline-offset-2"
                >Preview</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function PreviewModal({ doc, onClose }: { doc: CountryDoc; onClose: () => void }) {
  const isImage = doc.mimeType?.startsWith("image/") || doc.type === "photo"
  const isPdf = doc.mimeType === "application/pdf" || doc.type === "pdf"
  const src = `/uploads/${doc.filePath}`

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#D0E4F0]">
          <div>
            <p className="font-semibold text-[#0D2840] text-sm">{doc.title}</p>
            {doc.description && <p className="text-[#5B8FB9] text-xs">{doc.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <a href={src} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#1B4F72] hover:text-[#5B8FB9] text-xs">
              <ExternalLink size={14} /> Open
            </a>
            <button onClick={onClose} className="text-[#5B8FB9] hover:text-[#1B4F72]"><X size={18} /></button>
          </div>
        </div>
        <div className="p-4 flex justify-center bg-[#F4F7FB]" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={doc.title} className="max-w-full max-h-[60vh] object-contain rounded" />
          ) : isPdf ? (
            <iframe src={src} className="w-full rounded" style={{ height: "60vh" }} title={doc.title} />
          ) : (
            <div className="text-center py-8">
              <File size={48} className="mx-auto text-[#D0E4F0] mb-3" />
              <p className="text-[#5B8FB9] text-sm mb-3">Preview not available for this file type.</p>
              <a href={src} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1B4F72] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#154060] transition">
                <ExternalLink size={15} /> Download / Open
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Country Docs Section (inline, inside profile panel) ─────────────────────

function CountryDocsSection({ countryId }: { countryId: string }) {
  const [docs, setDocs] = useState<CountryDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<CountryDoc | null>(null)

  useEffect(() => {
    fetch(`/api/countries/${countryId}/documents`)
      .then(r => r.json())
      .then(d => { setDocs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [countryId])

  if (!loading && docs.length === 0) return null

  return (
    <div className="px-4 py-2.5 border-b border-[#EBF3FB]">
      <button
        className="flex items-center justify-between w-full"
        onClick={() => setOpen(o => !o)}
      >
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">
          Documents {loading ? "" : `(${docs.length})`}
        </div>
        <span className="text-[#5B8FB9] text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && !loading && (
        <ul className="mt-2 space-y-1">
          {docs.map(doc => (
            <li key={doc.id} className="flex items-center gap-2">
              {docIcon(doc.type)}
              <span className="flex-1 text-xs text-[#0D2840] truncate" title={doc.title}>{doc.title}</span>
              <button
                onClick={() => setPreviewDoc(doc)}
                className="text-[#1B4F72] hover:text-[#5B8FB9] text-[10px] font-semibold underline underline-offset-2"
              >Voir</button>
            </li>
          ))}
        </ul>
      )}
      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}

// ─── Country Profile Panel (draggable) ───────────────────────────────────────

function CountryProfilePanel({ profile, onClose }: { profile: CountryProfile; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState({ x: window.innerWidth - 380, y: 80 })

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 360, e.clientX - offset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offset.current.y)),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  const latestReserve = profile.reserves?.[0]
  const latestProd = profile.productions?.[0]

  return (
    <div
      ref={panelRef}
      className="fixed z-[2500] w-[350px] rounded-xl shadow-2xl overflow-hidden select-none"
      style={{ left: pos.x, top: pos.y, border: "1px solid #D0E4F0" }}
    >
      {/* Header — drag handle */}
      <div
        className="flex items-start justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
        style={{ background: "linear-gradient(135deg, #0D2840, #1B4F72)", borderBottom: "3px solid #F4B942" }}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-3">
          {profile.flagEmoji && <span className="text-3xl leading-none">{profile.flagEmoji}</span>}
          <div>
            <div className="text-white font-bold text-base leading-tight">{profile.name}</div>
            <div className="text-[#A3C4DC] text-xs mt-0.5 flex items-center gap-1">
              <span>🌍</span> {profile.capital ?? "—"}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-blue-200 hover:text-white mt-0.5 ml-2 flex-shrink-0">
          <X size={16} />
        </button>
      </div>

      <div className="bg-white max-h-[70vh] overflow-y-auto">
        {/* Key facts */}
        <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 border-b border-[#EBF3FB]">
          {profile.currency && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">Monnaie</div>
              <div className="text-xs font-semibold text-[#0D2840] mt-0.5">{profile.currency}</div>
            </div>
          )}
          {profile.independence && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">Indépendance</div>
              <div className="text-xs font-semibold text-[#0D2840] mt-0.5">{profile.independence}</div>
            </div>
          )}
          {profile.population && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">Population</div>
              <div className="text-xs font-semibold text-[#0D2840] mt-0.5">{(profile.population / 1e6).toFixed(1)} M</div>
            </div>
          )}
          {profile.gdpBnUsd && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">PIB</div>
              <div className="text-xs font-semibold text-[#0D2840] mt-0.5">{profile.gdpBnUsd.toFixed(1)} Mrd USD</div>
            </div>
          )}
        </div>

        {/* Economy */}
        {profile.economyDesc && (
          <div className="px-4 py-2.5 border-b border-[#EBF3FB]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9] mb-1">Économie</div>
            <p className="text-xs text-[#0D2840] leading-relaxed">{profile.economyDesc}</p>
          </div>
        )}

        {/* Hydrocarbons */}
        {(latestReserve || latestProd) && (
          <div className="px-4 py-2.5 border-b border-[#EBF3FB]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9] mb-2">Hydrocarbures</div>
            <div className="grid grid-cols-2 gap-2">
              {latestReserve && (
                <>
                  <div className="bg-[#F4F7FB] rounded-lg px-2.5 py-2 text-center">
                    <div className="text-lg font-bold text-[#1B4F72]">{latestReserve.oil.toFixed(1)}</div>
                    <div className="text-[10px] text-[#5B8FB9]">Réserves pétrole</div>
                    <div className="text-[9px] text-[#A3C4DC]">Gbbl — {latestReserve.year}</div>
                  </div>
                  <div className="bg-[#F4F7FB] rounded-lg px-2.5 py-2 text-center">
                    <div className="text-lg font-bold text-[#1B4F72]">{latestReserve.gas.toFixed(1)}</div>
                    <div className="text-[10px] text-[#5B8FB9]">Réserves gaz</div>
                    <div className="text-[9px] text-[#A3C4DC]">Tcf — {latestReserve.year}</div>
                  </div>
                </>
              )}
              {latestProd && (
                <>
                  <div className="bg-[#EBF3FB] rounded-lg px-2.5 py-2 text-center">
                    <div className="text-lg font-bold text-[#1B4F72]">{latestProd.oil.toFixed(0)}</div>
                    <div className="text-[10px] text-[#5B8FB9]">Production pétrole</div>
                    <div className="text-[9px] text-[#A3C4DC]">kb/d — {latestProd.year}</div>
                  </div>
                  <div className="bg-[#EBF3FB] rounded-lg px-2.5 py-2 text-center">
                    <div className="text-lg font-bold text-[#1B4F72]">{latestProd.gas.toFixed(0)}</div>
                    <div className="text-[10px] text-[#5B8FB9]">Production gaz</div>
                    <div className="text-[9px] text-[#A3C4DC]">M m³/an — {latestProd.year}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Basins */}
        {profile.basins && profile.basins.length > 0 && (
          <div className="px-4 py-2.5 border-b border-[#EBF3FB]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9] mb-1.5">
              Bassins sédimentaires ({profile.basins.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.basins.map(b => (
                <span key={b.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EBF3FB] text-[#1B4F72]">
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* National companies */}
        {profile.nationalCompanies && profile.nationalCompanies.length > 0 && (
          <div className="px-4 py-2.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9] mb-2">
              Société(s) Nationale(s) des Hydrocarbures
            </div>
            {profile.nationalCompanies.map(co => (
              <div key={co.id} className="mb-2 last:mb-0 border border-[#EBF3FB] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0D2840]">{co.acronym ?? co.name}</span>
                  {co.acronym && <span className="text-[10px] text-[#5B8FB9] truncate">{co.name}</span>}
                </div>
                {co.founded && <div className="text-[10px] text-[#5B8FB9] mt-0.5">Fondée en {co.founded}</div>}
                {co.description && <p className="text-[10px] text-[#0D2840] mt-1 leading-snug">{co.description}</p>}
                {co.website && (
                  <a href={co.website} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-[#1B4F72] underline mt-0.5 block" onClick={e => e.stopPropagation()}>
                    {co.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Documents */}
        <CountryDocsSection countryId={profile.id} />

        {/* No data message */}
        {!profile.capital && !profile.currency && !latestReserve && !latestProd && profile.nationalCompanies?.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-[#5B8FB9]">
            Aucune donnée de profil pour ce pays.<br />
            <span className="text-[#A3C4DC]">Renseignez les informations via le panneau Admin.</span>
          </div>
        )}
      </div>

      <div className="px-4 py-1.5 text-[9px] text-[#A3C4DC] text-center bg-[#F4F7FB]" style={{ borderTop: "1px solid #EBF3FB" }}>
        Glisser pour déplacer · Cliquer × pour fermer
      </div>
    </div>
  )
}

// ─── Basin Panel (draggable) ──────────────────────────────────────────────────

interface BasinDoc {
  id: string; title: string; type: string; fileName: string; filePath: string; mimeType: string | null; description: string | null
}

const BLOCK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Libre":       { bg: "#F1F5F9", text: "#64748B" },
  "Attribué":    { bg: "#DBEAFE", text: "#1D4ED8" },
  "Exploration": { bg: "#FEF3C7", text: "#92400E" },
  "Production":  { bg: "#D1FAE5", text: "#065F46" },
  "Abandonné":   { bg: "#FEE2E2", text: "#991B1B" },
}

function BasinPanel({
  basin, blocks, fields, onClose, setPreviewDoc,
}: {
  basin: Basin
  blocks: OilBlock[]
  fields: OilField[]
  onClose: () => void
  setPreviewDoc: (d: CountryDoc | null) => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const offset   = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState({ x: window.innerWidth - 380, y: 80 })
  const [docs, setDocs]       = useState<BasinDoc[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [activeTab, setActiveTab]     = useState<"info" | "blocks" | "fields" | "docs">("info")

  const basinBlocks = blocks.filter(b => b.basinId === basin.id)
  const basinFields = fields.filter(f => f.basinId === basin.id)

  useEffect(() => {
    setDocsLoading(true)
    fetch(`/api/basins/${basin.id}/documents`)
      .then(r => r.json())
      .then(d => { setDocs(Array.isArray(d) ? d : []); setDocsLoading(false) })
      .catch(() => setDocsLoading(false))
  }, [basin.id])

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 360, e.clientX - offset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offset.current.y)),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  const TABS = [
    { key: "info",   label: "Infos" },
    { key: "blocks", label: `Blocs (${basinBlocks.length})` },
    { key: "fields", label: `Champs (${basinFields.length})` },
    { key: "docs",   label: `Docs (${docsLoading ? "…" : docs.length})` },
  ] as const

  return (
    <div
      ref={panelRef}
      className="fixed z-[2500] w-[350px] rounded-xl shadow-2xl overflow-hidden select-none"
      style={{ left: pos.x, top: pos.y, border: "1px solid #D0E4F0" }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
        style={{ background: "linear-gradient(135deg, #4A2C17, #8B5E3C)", borderBottom: "3px solid #F4B942" }}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">🗺️</span>
          <div>
            <div className="text-white font-bold text-sm leading-tight">{basin.name}</div>
            <div className="text-amber-200 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {basin.country.name}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-amber-200 hover:text-white mt-0.5 ml-2 flex-shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EBF3FB] bg-[#F4F7FB]">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-[11px] font-semibold py-2 transition ${
              activeTab === tab.key
                ? "text-[#8B5E3C] border-b-2 border-[#8B5E3C] bg-white"
                : "text-[#5B8FB9] hover:text-[#0D2840]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white max-h-[60vh] overflow-y-auto">
        {/* Info tab */}
        {activeTab === "info" && (
          <div className="px-4 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">Type</div>
                <div className="text-xs font-semibold text-[#0D2840] mt-0.5">{basin.type}</div>
              </div>
              {basin.areaKm2 && (
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">Superficie</div>
                  <div className="text-xs font-semibold text-[#0D2840] mt-0.5">{basin.areaKm2.toLocaleString()} km²</div>
                </div>
              )}
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">Blocs</div>
                <div className="text-xs font-semibold text-[#0D2840] mt-0.5">{basinBlocks.length}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9]">Champs</div>
                <div className="text-xs font-semibold text-[#0D2840] mt-0.5">{basinFields.length}</div>
              </div>
            </div>
            {basin.description && (
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9] mb-1">Description</div>
                <p className="text-xs text-[#0D2840] leading-relaxed">{basin.description}</p>
              </div>
            )}
            {/* Block status summary */}
            {basinBlocks.length > 0 && (
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#5B8FB9] mb-1.5">Statut des blocs</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(
                    basinBlocks.reduce<Record<string, number>>((acc, b) => {
                      acc[b.status] = (acc[b.status] ?? 0) + 1
                      return acc
                    }, {})
                  ).map(([status, count]) => {
                    const c = BLOCK_STATUS_COLORS[status] ?? { bg: "#F1F5F9", text: "#64748B" }
                    return (
                      <span key={status} style={{ background: c.bg, color: c.text }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {count} {status}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blocks tab */}
        {activeTab === "blocks" && (
          <div>
            {basinBlocks.length === 0 ? (
              <p className="text-center text-[#5B8FB9] text-xs py-6">Aucun bloc enregistré pour ce bassin.</p>
            ) : (
              <ul className="divide-y divide-[#EBF3FB]">
                {basinBlocks.map(blk => {
                  const c = BLOCK_STATUS_COLORS[blk.status] ?? { bg: "#F1F5F9", text: "#64748B" }
                  return (
                    <li key={blk.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#0D2840] truncate">{blk.name}</span>
                        <span style={{ background: c.bg, color: c.text }}
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap flex-shrink-0">
                          {blk.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#5B8FB9] mt-0.5 flex gap-3">
                        <span>{blk.blockId}</span>
                        {blk.operator && <span>· {blk.operator}</span>}
                        {blk.areaKm2 && <span>· {blk.areaKm2.toLocaleString()} km²</span>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Fields tab */}
        {activeTab === "fields" && (
          <div>
            {basinFields.length === 0 ? (
              <p className="text-center text-[#5B8FB9] text-xs py-6">Aucun champ enregistré pour ce bassin.</p>
            ) : (
              <ul className="divide-y divide-[#EBF3FB]">
                {basinFields.map(fld => (
                  <li key={fld.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0D2840] truncate">{fld.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap flex-shrink-0 bg-[#EBF3FB] text-[#1B4F72]">
                        {fld.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#5B8FB9] mt-0.5 flex gap-3">
                      <span>{fld.type}</span>
                      {fld.operator && <span>· {fld.operator}</span>}
                      {fld.discoveryYear && <span>· Dép. {fld.discoveryYear}</span>}
                    </div>
                    {(fld.oilMmb || fld.gasBcf) && (
                      <div className="text-[10px] text-[#5B8FB9] mt-0.5 flex gap-3">
                        {fld.oilMmb && <span>🛢 {fld.oilMmb} Mmb</span>}
                        {fld.gasBcf && <span>💨 {fld.gasBcf} Bcf</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Docs tab */}
        {activeTab === "docs" && (
          <div>
            {docsLoading ? (
              <p className="text-center text-[#5B8FB9] text-xs py-6">Chargement…</p>
            ) : docs.length === 0 ? (
              <p className="text-center text-[#5B8FB9] text-xs py-6">Aucun document pour ce bassin.</p>
            ) : (
              <ul className="divide-y divide-[#EBF3FB]">
                {docs.map(doc => (
                  <li key={doc.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#F4F7FB]">
                    {docIcon(doc.type)}
                    <span className="flex-1 text-xs text-[#0D2840] truncate" title={doc.title}>{doc.title}</span>
                    <button
                      onClick={() => setPreviewDoc(doc as unknown as CountryDoc)}
                      className="text-[#8B5E3C] hover:text-[#5B8FB9] text-xs font-semibold underline underline-offset-2"
                    >Voir</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-1.5 text-[9px] text-[#A3C4DC] text-center bg-[#F4F7FB]" style={{ borderTop: "1px solid #EBF3FB" }}>
        Glisser pour déplacer · Cliquer × pour fermer
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

export function AIEMMap({ selectedCountries, selectedYear, selectedRegion = "All", activeThemes, showLabels, showPipelineLabels = false }: MapProps) {
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
  const memberCodesRef    = useRef<Set<string>>(new Set())
  const regionCodesRef    = useRef<Set<string>>(new Set())  // ISO2 codes in the active region
  const selectedCodesRef  = useRef<Set<string>>(new Set())  // ISO2 codes of selected countries
  const geoCentroidsRef   = useRef<Map<string, [number, number]>>(new Map())
  const countriesRef      = useRef<Country[]>([])
  const yearRef           = useRef<number>(selectedYear)     // mirror of selectedYear, readable inside Leaflet closures
  const tradeHighlightRef = useRef<Set<L.Path>>(new Set())   // layers highlighted for trade partners
  const tradeLabelsRef    = useRef<L.Marker[]>([])           // temp labels for non-member partners

  const [tooltip,        setTooltip]       = useState<TooltipData | null>(null)
  const [geoReady,       setGeoReady]      = useState(false)
  const [countries,      setCountries]     = useState<Country[]>([])
  const [docsCountry,    setDocsCountry]   = useState<{ id: string; name: string } | null>(null)
  const [previewDoc,     setPreviewDoc]    = useState<CountryDoc | null>(null)
  const [countryProfile, setCountryProfile] = useState<CountryProfile | null>(null)
  const [basinPanel,     setBasinPanel]    = useState<Basin | null>(null)
  const [basins,      setBasins]      = useState<Basin[]>([])
  const [refineries,  setRefineries]  = useState<Refinery[]>([])
  const [pipelines,   setPipelines]   = useState<Pipeline[]>([])
  const [reserves,    setReserves]    = useState<Reserve[]>([])
  const [productions, setProductions] = useState<Production[]>([])
  const [training,    setTraining]    = useState<TrainingInstitute[]>([])
  const [rndCenters,  setRndCenters]  = useState<RnDCenter[]>([])
  const [storages,    setStorages]    = useState<StorageFacility[]>([])
  const [petrochems,  setPetrochems]  = useState<PetrochemPlant[]>([])
  const [oilBlocks,   setOilBlocks]   = useState<OilBlock[]>([])
  const [oilFields,   setOilFields]   = useState<OilField[]>([])
  const [tradeImports, setTradeImports] = useState<TradeRow[]>([])
  const [tradeExports, setTradeExports] = useState<TradeRow[]>([])

  // Keep yearRef in sync so Leaflet click handlers (closures) read the current year,
  // and refetch the open country profile when the user changes the year slider.
  useEffect(() => {
    yearRef.current = selectedYear
    if (countryProfile?.id) {
      fetch(`/api/countries/${countryProfile.id}/profile?year=${selectedYear}`)
        .then(r => r.json())
        .then(setCountryProfile)
        .catch(console.error)
    }
  }, [selectedYear]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/countries?all=1").then(r => r.json()),
      fetch("/api/basins").then(r => r.json()),
      fetch("/api/refineries").then(r => r.json()),
      fetch("/api/pipelines").then(r => r.json()),
      fetch(`/api/reserves?year=${selectedYear}`).then(r => r.json()),
      fetch(`/api/production?year=${selectedYear}`).then(r => r.json()),
      fetch("/api/training").then(r => r.json()),
      fetch("/api/rnd").then(r => r.json()),
      fetch("/api/storage").then(r => r.json()).catch(() => []),
      fetch("/api/petrochem").then(r => r.json()).catch(() => []),
      fetch("/api/blocks").then(r => r.json()).catch(() => []),
      fetch("/api/fields").then(r => r.json()).catch(() => []),
      fetch(`/api/trade/imports?year=${selectedYear}`).then(r => r.json()).catch(() => []),
      fetch(`/api/trade/exports?year=${selectedYear}`).then(r => r.json()).catch(() => []),
    ]).then(([c, b, r, p, rv, pr, tr, rn, st, pc, blk, fld, ti, te]) => {
      const countryList = Array.isArray(c) ? c : []
      setCountries(countryList)
      countriesRef.current = countryList
      setBasins(Array.isArray(b) ? b : [])
      setRefineries(Array.isArray(r) ? r : [])
      setPipelines(Array.isArray(p) ? p : [])
      setReserves(Array.isArray(rv) ? rv : [])
      setProductions(Array.isArray(pr) ? pr : [])
      setTraining(Array.isArray(tr) ? tr : [])
      setRndCenters(Array.isArray(rn) ? rn : [])
      setStorages(Array.isArray(st) ? st : [])
      setPetrochems(Array.isArray(pc) ? pc : [])
      setOilBlocks(Array.isArray(blk) ? blk : [])
      setOilFields(Array.isArray(fld) ? fld : [])
      setTradeImports(Array.isArray(ti) ? ti : [])
      setTradeExports(Array.isArray(te) ? te : [])
    }).catch(console.error)
  }, [selectedYear])

  const showTip = useCallback((data: Omit<TooltipData, "locked">, locked = false) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltip({ ...data, locked })
  }, [])

  const closeTip = useCallback(() => {
    tooltipLocked.current = false
    setTooltip(null)
    clearTradeHighlight()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear all trade partner highlights and temp labels
  const clearTradeHighlight = useCallback(() => {
    // Remove temp labels
    tradeLabelsRef.current.forEach(m => m.remove())
    tradeLabelsRef.current = []
    // Restore GeoJSON styles
    if (!geoLayer.current) return
    tradeHighlightRef.current.forEach(lyr => {
      const iso2 = (lyr as L.Path & { _iso2?: string })._iso2
      if (!iso2) return
      const isSelected = selectedCodesRef.current.has(iso2)
      const isMember   = memberCodesRef.current.has(iso2)
      const isInRegion = regionCodesRef.current.size === 0 || regionCodesRef.current.has(iso2)
      lyr.setStyle(
        isSelected  ? { fillColor: MC.countrySelected,  fillOpacity: 0.85, color: MC.borderHover, weight: 1.2 }
        : !isMember ? { fillColor: MC.countryNonMember, fillOpacity: 0.45, color: MC.border,      weight: 0.8 }
        : isInRegion? { fillColor: MC.countryDefault,   fillOpacity: 0.7,  color: MC.border,      weight: 0.8 }
        :             { fillColor: MC.countryMemberOff, fillOpacity: 0.55, color: MC.border,      weight: 0.8 }
      )
    })
    tradeHighlightRef.current.clear()
  }, [])

  // Highlight African partner countries and add temp labels for non-members
  const highlightPartners = useCallback((partnerNames: string[], color: string) => {
    if (!geoLayer.current || !labelsGrp.current || !leafletMap.current) return
    clearTradeHighlight()
    const iso2Set = new Set(
      partnerNames.map(n => PARTNER_NAME_TO_ISO2[n]).filter(Boolean)
    )
    if (iso2Set.size === 0) return

    // Highlight GeoJSON layers
    geoLayer.current.eachLayer(lyr => {
      const path = lyr as L.Path & { _iso2?: string }
      if (!path._iso2 || !iso2Set.has(path._iso2)) return
      path.setStyle({ fillColor: color, fillOpacity: 0.75, color: "#fff", weight: 2 })
      tradeHighlightRef.current.add(path)
    })

    // Add temp labels for non-APPO-member partners
    iso2Set.forEach(iso2 => {
      if (memberCodesRef.current.has(iso2)) return  // already has a label if showLabels is on
      // Find the country name from countriesRef or fallback from PARTNER_NAME_TO_ISO2 reverse
      const countryEntry = countriesRef.current.find(c => (ISO3_TO_ISO2[c.code] ?? c.code) === iso2)
      const name = countryEntry?.name ?? Object.entries(PARTNER_NAME_TO_ISO2).find(([, v]) => v === iso2)?.[0] ?? iso2
      const centroid = geoCentroidsRef.current.get(iso2)
      if (!centroid) return
      const [lat, lon] = centroid
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:transparent;color:#ffffff;font-size:10px;font-weight:bold;font-family:Arial,sans-serif;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,0.6);white-space:nowrap">${name}</div>`,
        iconSize: [100, 14],
        iconAnchor: [50, 7],
      })
      const m = L.marker([lat, lon], { icon, interactive: false }).addTo(labelsGrp.current!)
      tradeLabelsRef.current.push(m)
    })
  }, [clearTradeHighlight])

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
                // Do not override style for selected countries
                if (tgtIso2 && selectedCodesRef.current.has(tgtIso2)) return
                // Only highlight if active in current region filter
                const isActive = tgtIso2 && memberCodesRef.current.has(tgtIso2) &&
                  (regionCodesRef.current.size === 0 || regionCodesRef.current.has(tgtIso2))
                if (!isActive) return
                if (hoveredLayer.current && hoveredLayer.current !== tgt)
                  geoLayer.current?.resetStyle(hoveredLayer.current)
                hoveredLayer.current = tgt
                tgt.setStyle({ fillColor: MC.countryHover, fillOpacity: 0.9, color: MC.borderHover, weight: 1.5 })
              },
              mouseout: (e) => {
                const tgt = e.target as L.Path & { _iso2?: string }
                const tgtIso2 = tgt._iso2
                const isSelected = tgtIso2 && selectedCodesRef.current.has(tgtIso2)
                const isMember = tgtIso2 && memberCodesRef.current.has(tgtIso2)
                const isInRegion = !tgtIso2 || regionCodesRef.current.size === 0 || regionCodesRef.current.has(tgtIso2)
                // Restore the correct style (4-tier: selected > non-member > in-region > off-region)
                tgt.setStyle(
                  isSelected
                    ? { fillColor: MC.countrySelected, fillOpacity: 0.85, color: MC.borderHover, weight: 1.2 }
                    : !isMember
                    ? { fillColor: MC.countryNonMember, fillOpacity: 0.45, color: MC.border, weight: 0.8 }
                    : isInRegion
                    ? { fillColor: MC.countryDefault, fillOpacity: 0.7, color: MC.border, weight: 0.8 }
                    : { fillColor: MC.countryMemberOff, fillOpacity: 0.55, color: MC.border, weight: 0.8 }
                )
                if (hoveredLayer.current === tgt) hoveredLayer.current = null
                if (!tooltipLocked.current) {
                  tooltipTimer.current = setTimeout(() => setTooltip(null), 150)
                }
              },
              click: () => {
                if (!iso2) return
                // Only interactive for members in the active region
                const isActive = memberCodesRef.current.has(iso2) &&
                  (regionCodesRef.current.size === 0 || regionCodesRef.current.has(iso2))
                if (!isActive) return
                tooltipLocked.current = false
                setTooltip(null)
                const ISO2_TO_ISO3: Record<string, string> = Object.fromEntries(
                  Object.entries(ISO3_TO_ISO2).map(([k, v]) => [v, k])
                )
                const iso3 = ISO2_TO_ISO3[iso2]
                const found = countriesRef.current.find((c: Country) => c.code === iso3)
                if (found) {
                  fetch(`/api/countries/${found.id}/profile?year=${yearRef.current}`)
                    .then(r => r.json())
                    .then(setCountryProfile)
                    .catch(console.error)
                }
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

    map.on("click", () => { tooltipLocked.current = false; setTooltip(null); setDocsCountry(null); setCountryProfile(null); setBasinPanel(null); clearTradeHighlight() })

    return () => {
      destroyed = true
      hoveredLayer.current = null
      map.remove()
      leafletMap.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update GeoJSON fill based on selected countries, region & APPO membership
  useEffect(() => {
    if (!geoLayer.current) return
    const toIso2 = (iso3: string) => ISO3_TO_ISO2[iso3] ?? iso3
    const selectedIso2 = new Set(
      selectedCountries.length > 0
        ? countries.filter(c => selectedCountries.includes(c.id)).map(c => toIso2(c.code))
        : []
    )
    const memberCodes = new Set(countries.filter(c => c.appoMember).map(c => toIso2(c.code)))
    // Region codes: ISO2 of APPO members in the active region (empty = no filter = all)
    const regionIso2 = selectedRegion === "All"
      ? new Set<string>()
      : new Set(countries.filter(c => c.appoMember && c.region === selectedRegion).map(c => toIso2(c.code)))
    memberCodesRef.current = memberCodes
    regionCodesRef.current = regionIso2
    selectedCodesRef.current = selectedIso2

    geoLayer.current.setStyle((feature) => {
      const iso2 = feature?.properties?.iso2
      const isSelected  = selectedIso2.size > 0 && iso2 && selectedIso2.has(iso2)
      const isMember    = iso2 && memberCodes.has(iso2)
      const isInRegion  = regionIso2.size === 0 || (iso2 && regionIso2.has(iso2))

      const fillColor   = isSelected   ? MC.countrySelected
                        : !isMember    ? MC.countryNonMember
                        : isInRegion   ? MC.countryDefault
                        :                MC.countryMemberOff
      const fillOpacity = isSelected ? 0.85
                        : !isMember  ? 0.45
                        : isInRegion ? 0.7
                        :              0.5
      return {
        fillColor,
        fillOpacity,
        color: isSelected ? MC.borderHover : MC.border,
        weight: isSelected ? 1.2 : 0.8,
      }
    })
  }, [selectedCountries, countries, selectedRegion, geoReady])

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

    // Basins / Blocks / Fields (merged under a single "basins" theme)
    if (activeThemes.has("basins")) {
      // Basin markers
      basins.filter(b => filteredCodes.size === 0 || filteredCodes.has(b.country.code)).forEach(basin => {
        const rows = [
          { label: t.map.type, value: basin.type },
          ...(basin.areaKm2 ? [{ label: t.map.area, value: `${basin.areaKm2.toLocaleString()} km²` }] : []),
        ]
        const m = L.marker([basin.lat, basin.lon], { icon: pulsingMarker("#8B5E3C") })
        bindTip(m, e => ({ title: basin.name, subtitle: basin.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        m.on("click", (e: L.LeafletMouseEvent) => {
          tooltipLocked.current = false
          setTooltip(null)
          setBasinPanel(basin)
          L.DomEvent.stopPropagation(e)
        })
        m.addTo(mg)
      })

      // Block markers
      const BLOCK_COLORS: Record<string, string> = {
        "Libre": "#9CA3AF",
        "Attribué": "#3B82F6",
        "Exploration": "#F59E0B",
        "Production": "#10B981",
        "Abandonné": "#EF4444",
      }
      oilBlocks
        .filter(b => b.lat && b.lon && (filteredCodes.size === 0 || filteredCodes.has(b.country.code)))
        .forEach(blk => {
          const color = BLOCK_COLORS[blk.status] ?? "#9CA3AF"
          const rows = [
            { label: "Statut",    value: blk.status },
            { label: t.map.type,  value: blk.type },
            ...(blk.operator ? [{ label: "Opérateur", value: blk.operator }] : []),
            ...(blk.awardDate ? [{ label: "Attribution", value: `${blk.awardDate}` }] : []),
            ...(blk.areaKm2 ? [{ label: t.map.area, value: `${blk.areaKm2.toLocaleString()} km²` }] : []),
            { label: "Bassin", value: blk.basin.name },
          ]
          const icon = L.divIcon({
            html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
            className: "", iconSize: [14, 14], iconAnchor: [7, 7],
          })
          const m = L.marker([blk.lat!, blk.lon!], { icon })
          bindTip(m, e => ({ title: blk.name, subtitle: `${blk.country.name} · ${blk.blockId}`, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
          m.addTo(mg)
        })

      // Field markers
      const FIELD_COLORS: Record<string, string> = {
        "En production": "#10B981",
        "En développement": "#3B82F6",
        "Découverte": "#8B5CF6",
        "Abandonné": "#EF4444",
      }
      oilFields
        .filter(f => filteredCodes.size === 0 || filteredCodes.has(f.country.code))
        .forEach(fld => {
          const color = FIELD_COLORS[fld.status] ?? "#8B5CF6"
          const rows = [
            { label: "Statut",    value: fld.status },
            { label: t.map.type,  value: fld.type },
            ...(fld.operator ? [{ label: "Opérateur", value: fld.operator }] : []),
            ...(fld.discoveryYear ? [{ label: "Découverte", value: `${fld.discoveryYear}` }] : []),
            ...(fld.productionStart ? [{ label: "Prod. depuis", value: `${fld.productionStart}` }] : []),
            ...(fld.oilMmb ? [{ label: "Huile", value: `${fld.oilMmb} Mmb` }] : []),
            ...(fld.gasBcf ? [{ label: "Gaz", value: `${fld.gasBcf} Bcf` }] : []),
            { label: "Bassin", value: fld.basin.name },
          ]
          const icon = L.divIcon({
            html: `<div style="width:16px;height:16px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="font-size:8px;color:white;font-weight:bold;">★</span></div>`,
            className: "", iconSize: [16, 16], iconAnchor: [8, 8],
          })
          const m = L.marker([fld.lat, fld.lon], { icon })
          bindTip(m, e => ({ title: fld.name, subtitle: `${fld.country.name} · ${fld.fieldId}`, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
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

    // Helper: proportional oil barrel icon — vert pour pétrole
    function oilBarrelIcon(value: number, maxVal: number, label: string) {
      const s = Math.round(22 + (value / maxVal) * 26)
      const svg = `<svg viewBox="0 0 24 24" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.45))"><line x1="5" y1="5.5" x2="5" y2="18.5" stroke="#145a32" stroke-width="1.5"/><line x1="19" y1="5.5" x2="19" y2="18.5" stroke="#145a32" stroke-width="1.5"/><rect x="5" y="5.5" width="14" height="13" fill="#27ae60" stroke="none"/><path d="M5 9.5 Q12 11 19 9.5" stroke="#145a32" stroke-width="1.1" fill="none"/><path d="M5 14.5 Q12 16 19 14.5" stroke="#145a32" stroke-width="1.1" fill="none"/><ellipse cx="12" cy="18.5" rx="7" ry="2.5" fill="#1e8449" stroke="#145a32" stroke-width="1.2"/><ellipse cx="12" cy="5.5" rx="7" ry="2.5" fill="#58d68d" stroke="#145a32" stroke-width="1.2"/></svg>`
      return L.divIcon({
        html: `<div title="${label}" style="line-height:0;">${svg}</div>`,
        className: "", iconSize: [s, s], iconAnchor: [s / 2, s / 2],
      })
    }

    // Helper: proportional gas flame icon — bleu pour gaz
    function gasFlameIcon(value: number, maxVal: number, label: string) {
      const s = Math.round(22 + (value / maxVal) * 26)
      const svg = `<svg viewBox="0 0 24 24" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.45))"><path fill="#1a5276" stroke="none" d="M12 2s-4 5-4 9c0 1.5.5 2.8 1.4 3.8-.3-1.3-.4-2.5-.4-2.8 0-2 2-4 2-4s0 3 2 4.5c.6.5 1 1.2 1 2 0 .5-.1.9-.4 1.3.9-.6 1.4-1.6 1.4-2.8 0-1.5-1-3-1-3s2 1.5 2 4c0 2.2-1.8 4-4 4s-4-1.8-4-4c0-.8.2-1.5.6-2.1-.4.7-.6 1.5-.6 2.4 0 2.8 2.2 5 5 5s5-2.2 5-5c0-3.5-2-6-2-6s.5 1 .5 2c0 .8-.3 1.6-.8 2.1.5-1.1.8-2.6.8-4.4 0-3-4-6-4-6z"/><path fill="#2980b9" stroke="none" d="M12 8s-2 2-2 4c0 1.1.9 2 2 2s2-.9 2-2c0-1.3-.8-2.5-1.2-3 .1.5.2 1 .2 1.5 0 .6-.4 1.1-1 1.1s-1-.5-1-1.1c0-.9.7-1.9 1-2.5z"/><path fill="#5dade2" stroke="none" opacity="0.5" d="M12 14s-1 1-1 2.5c0 .5.2 1 .5 1.3-.1-.3-.1-.6-.1-.9 0-.7.6-1.4.6-1.4z"/></svg>`
      return L.divIcon({
        html: `<div title="${label}" style="line-height:0;">${svg}</div>`,
        className: "", iconSize: [s, s], iconAnchor: [s / 2, s / 2],
      })
    }

    // Per-country marker offsets [oilLat, oilLon, gasLat, gasLon]
    // Oil barrel: left column  | Gas flame: right column
    // Vertical stack: oil above (positive lat = north), gas below
    // Small countries get tighter offsets to stay within borders
    const MARKER_OFFSETS: Record<string, [number, number, number, number]> = {
      // iso3 → [oilDlat, oilDlon, gasDlat, gasDlon]
      DZA: [ 1.5, -2.0,  1.5,  2.0],  // Algeria — large, spread out
      LBY: [ 1.5, -2.0,  1.5,  2.0],  // Libya — large
      NGA: [ 0.5, -1.2,  0.5,  1.2],  // Nigeria — medium
      AGO: [ 0.5, -1.2,  0.5,  1.2],  // Angola — medium
      EGY: [ 1.0, -2.0,  1.0,  2.0],  // Egypt — large
      COG: [ 0.3, -0.6, -0.3, -0.6],  // Congo — small, vertical stack left side
      GAB: [ 0.3, -0.5, -0.3, -0.5],  // Gabon — small
      GNQ: [ 0.2,  0.4, -0.2,  0.4],  // Equatorial Guinea — tiny, stack vertically right
      GHA: [ 0.3,  0.0, -0.3,  0.0],  // Ghana — small, centered vertical stack
      CMR: [ 0.4, -0.8,  0.4,  0.8],  // Cameroon
      CIV: [ 0.3, -0.5,  0.3,  0.5],  // Côte d'Ivoire
      SEN: [ 0.3, -0.5,  0.3,  0.5],  // Senegal
      TCD: [ 0.8, -1.0,  0.8,  1.0],  // Chad — large
      NER: [ 0.8, -1.0,  0.8,  1.0],  // Niger — large
      SDN: [ 1.0, -1.5,  1.0,  1.5],  // Sudan — large
      SSD: [ 0.8, -1.0,  0.8,  1.0],  // South Sudan
      TUN: [ 0.5, -0.8,  0.5,  0.8],  // Tunisia
      MOZ: [ 0.8, -1.0,  0.8,  1.0],  // Mozambique
      BEN: [ 0.2,  0.0, -0.2,  0.0],  // Benin — very small, centered vertical
      COD: [ 1.0, -1.5,  1.0,  1.5],  // DRC — large
      MAR: [ 0.5, -1.0,  0.5,  1.0],  // Morocco
      ZAF: [ 0.5, -1.0,  0.5,  1.0],  // South Africa
      TZA: [ 0.5, -1.0,  0.5,  1.0],  // Tanzania
      RWA: [ 0.2,  0.0, -0.2,  0.0],  // Rwanda — tiny
    }
    const defaultOffset: [number, number, number, number] = [0.6, -1.0, 0.6, 1.0]

    // Oil Reserves — proportional barrel icons
    if (activeThemes.has("oil_reserves")) {
      const filtered = reserves.filter(r => (filteredCodes.size === 0 || filteredCodes.has(r.country.code)) && r.oil > 0)
      const maxVal = Math.max(...filtered.map(r => r.oil), 1)
      filtered.forEach(rv => {
        const c = countries.find(c => c.code === rv.country.code); if (!c) return
        const [dlat, dlon] = (MARKER_OFFSETS[c.code] ?? defaultOffset).slice(0, 2) as [number, number]
        const m = L.marker([c.lat + dlat, c.lon + dlon], { icon: oilBarrelIcon(rv.oil, maxVal, `${rv.oil} Gbbl`) })
        bindTip(m, e => ({ title: `${c.name} — ${t.map.oilReserves}`, rows: [{ label: t.map.oilReserves, value: `${rv.oil} Gbbl` }, { label: t.map.year, value: `${rv.year}` }], x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        m.addTo(mg)
      })
    }

    // Gas Reserves — proportional flame icons
    if (activeThemes.has("gas_reserves")) {
      const filtered = reserves.filter(r => (filteredCodes.size === 0 || filteredCodes.has(r.country.code)) && r.gas > 0)
      const maxVal = Math.max(...filtered.map(r => r.gas), 1)
      filtered.forEach(rv => {
        const c = countries.find(c => c.code === rv.country.code); if (!c) return
        const [,, dlat, dlon] = MARKER_OFFSETS[c.code] ?? defaultOffset
        const m = L.marker([c.lat + dlat, c.lon + dlon], { icon: gasFlameIcon(rv.gas, maxVal, `${rv.gas} Tcf`) })
        bindTip(m, e => ({ title: `${c.name} — ${t.map.gasReserves}`, rows: [{ label: t.map.gasReserves, value: `${rv.gas} Tcf` }, { label: t.map.year, value: `${rv.year}` }], x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        m.addTo(mg)
      })
    }

    // Oil Production — proportional barrel icons
    if (activeThemes.has("oil_production")) {
      const filtered = productions.filter(p => (filteredCodes.size === 0 || filteredCodes.has(p.country.code)) && p.oil > 0)
      const maxVal = Math.max(...filtered.map(p => p.oil), 1)
      filtered.forEach(pr => {
        const c = countries.find(c => c.code === pr.country.code); if (!c) return
        const [dlat, dlon] = (MARKER_OFFSETS[c.code] ?? defaultOffset).slice(0, 2) as [number, number]
        const m = L.marker([c.lat + dlat, c.lon + dlon], { icon: oilBarrelIcon(pr.oil, maxVal, `${pr.oil.toLocaleString()} kb/d`) })
        bindTip(m, e => ({ title: `${c.name} — ${t.map.oilProduction}`, rows: [{ label: t.map.oilProduction, value: `${pr.oil.toLocaleString()} kb/d` }, { label: t.map.year, value: `${pr.year}` }], x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        m.addTo(mg)
      })
    }

    // Gas Production — proportional flame icons
    if (activeThemes.has("gas_production")) {
      const filtered = productions.filter(p => (filteredCodes.size === 0 || filteredCodes.has(p.country.code)) && p.gas > 0)
      const maxVal = Math.max(...filtered.map(p => p.gas), 1)
      filtered.forEach(pr => {
        const c = countries.find(c => c.code === pr.country.code); if (!c) return
        const [,, dlat, dlon] = MARKER_OFFSETS[c.code] ?? defaultOffset
        const m = L.marker([c.lat + dlat, c.lon + dlon], { icon: gasFlameIcon(pr.gas, maxVal, `${pr.gas.toLocaleString()} M m³/yr`) })
        bindTip(m, e => ({ title: `${c.name} — ${t.map.gasProduction}`, rows: [{ label: t.map.gasProduction, value: `${pr.gas.toLocaleString()} M m³/yr` }, { label: t.map.year, value: `${pr.year}` }], x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
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
        bindTip(m, e => ({ title: inst.name, subtitle: inst.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
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
        bindTip(m, e => ({ title: center.name, subtitle: center.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
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
        bindTip(m, e => ({ title: st.name, subtitle: st.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
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
        bindTip(m, e => ({ title: pc.name, subtitle: pc.country.name, rows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => setTooltip(null))
        m.addTo(mg)
      })
    }

    // ── Imports / Exports — cercles proportionnels ─────────────────────────
    type TradeField = "oilIntraKbD"|"gasIntraBcm"|"oilExtraKbD"|"gasExtraBcm"|"essenceM3"|"gasoilM3"|"gplTM"|"jetFuelTM"
    // hydroKeys: liste des valeurs `hydro` dans partnersDetail correspondant à ce thème
    const TRADE_SUB: Record<string, { dir: "imports"|"exports"; field: TradeField; label: string; unit: string; color: string; hydroKeys: string[] }> = {
      imports_oil_intra:  { dir: "imports", field: "oilIntraKbD",  label: "Pétrole brut Intra-Afrique", unit: "kb/d",  color: "#1B4F72", hydroKeys: ["Pétrole brut"] },
      imports_cond_intra: { dir: "imports", field: "oilIntraKbD",  label: "Condensat Intra-Afrique",    unit: "kb/d",  color: "#2980B9", hydroKeys: ["Condensat"] },
      imports_gas_intra:  { dir: "imports", field: "gasIntraBcm",  label: "Gaz Intra-Afrique",          unit: "Mscf",  color: "#5DADE2", hydroKeys: ["Gaz naturel"] },
      imports_oil_extra:  { dir: "imports", field: "oilExtraKbD",  label: "Pétrole brut Extra-Afrique", unit: "kb/d",  color: "#154360", hydroKeys: ["Pétrole brut","LGN"] },
      imports_gas_extra:  { dir: "imports", field: "gasExtraBcm",  label: "Gaz Extra-Afrique",          unit: "Mscf",  color: "#1A5276", hydroKeys: ["Gaz naturel","GNL","Gaz naturel liquefié"] },
      imports_essence:    { dir: "imports", field: "essenceM3",    label: "Essence",                    unit: "TM",    color: "#F39C12", hydroKeys: ["Essence"] },
      imports_gasoil:     { dir: "imports", field: "gasoilM3",     label: "Gasoil",                     unit: "TM",    color: "#E67E22", hydroKeys: ["Gasoil","Bitumes"] },
      imports_gpl:        { dir: "imports", field: "gplTM",        label: "GPL",                        unit: "TM",    color: "#D35400", hydroKeys: ["GPL"] },
      imports_jetfuel:    { dir: "imports", field: "jetFuelTM",    label: "Jet Fuel",                   unit: "TM",    color: "#CA6F1E", hydroKeys: ["Jet fuel","Jet Fuel"] },
      exports_oil_intra:  { dir: "exports", field: "oilIntraKbD",  label: "Pétrole brut Intra-Afrique", unit: "kb/d",  color: "#1E8449", hydroKeys: ["Pétrole brut"] },
      exports_cond_intra: { dir: "exports", field: "oilIntraKbD",  label: "Condensat Intra-Afrique",    unit: "kb/d",  color: "#27AE60", hydroKeys: ["Condensat"] },
      exports_gas_intra:  { dir: "exports", field: "gasIntraBcm",  label: "Gaz Intra-Afrique",          unit: "Mscf",  color: "#52BE80", hydroKeys: ["Gaz naturel"] },
      exports_oil_extra:  { dir: "exports", field: "oilExtraKbD",  label: "Pétrole brut Extra-Afrique", unit: "kb/d",  color: "#145A32", hydroKeys: ["Pétrole brut","LGN"] },
      exports_gas_extra:  { dir: "exports", field: "gasExtraBcm",  label: "Gaz Extra-Afrique",          unit: "Mscf",  color: "#1A7431", hydroKeys: ["Gaz naturel","GNL","Gaz naturel liquefié"] },
      exports_essence:    { dir: "exports", field: "essenceM3",    label: "Essence",                    unit: "TM",    color: "#8E44AD", hydroKeys: ["Essence"] },
      exports_gasoil:     { dir: "exports", field: "gasoilM3",     label: "Gasoil",                     unit: "TM",    color: "#7D3C98", hydroKeys: ["Gasoil","Bitumes","Fuel Oil"] },
      exports_gpl:        { dir: "exports", field: "gplTM",        label: "GPL",                        unit: "TM",    color: "#6C3483", hydroKeys: ["GPL"] },
      exports_jetfuel:    { dir: "exports", field: "jetFuelTM",    label: "Jet Fuel",                   unit: "TM",    color: "#5B2C6F", hydroKeys: ["Jet fuel","Jet Fuel"] },
    }

    Object.entries(TRADE_SUB).forEach(([themeKey, cfg]) => {
      if (!activeThemes.has(themeKey)) return
      const rows = cfg.dir === "imports" ? tradeImports : tradeExports
      const filtered = rows.filter(r => filteredCodes.size === 0 || filteredCodes.has(r.country.code))
      if (filtered.length === 0) return

      const vals = filtered.map(r => Number(r[cfg.field] ?? 0)).filter(v => v > 0)
      const maxVal = Math.max(...vals, 1)

      filtered.forEach(r => {
        const val = Number(r[cfg.field] ?? 0)
        if (val <= 0) return
        const radius = 8 + (val / maxVal) * 28
        const dir = cfg.dir === "imports" ? "⬇️" : "⬆️"
        const icon = L.divIcon({
          html: `<div style="width:${radius*2}px;height:${radius*2}px;background:${cfg.color};border:2px solid white;border-radius:50%;opacity:0.75;display:flex;align-items:center;justify-content:center;font-size:${Math.max(8,radius/2)}px;color:white;font-weight:bold;">${dir}</div>`,
          className: "", iconSize: [radius*2, radius*2], iconAnchor: [radius, radius],
        })

        // Parse partner details and filter by hydrocarbon keys for this theme
        const allPartners: TradePartner[] = (() => {
          try { return JSON.parse(r.partnersDetail) } catch { return [] }
        })()
        const relevant = allPartners.filter(p => cfg.hydroKeys.includes(p.hydro))

        const tipRows: { label: string; value: string }[] = [
          { label: cfg.label,  value: `${val.toLocaleString()} ${cfg.unit}` },
          { label: t.map.year, value: `${r.year}` },
        ]
        // Add one row per partner sorted by qty descending
        const sortedPartners = [...relevant].sort((a, b) => b.qty - a.qty)
        sortedPartners.forEach(p => {
          tipRows.push({ label: p.partner, value: `${p.qty.toLocaleString()} ${p.unit}` })
        })

        const subtitle = cfg.dir === "imports" ? `⬇️ Importation ${selectedYear}` : `⬆️ Exportation ${selectedYear}`
        const partnerNames = relevant.map(p => p.partner)
        const m = L.marker([r.country.lat, r.country.lon], { icon })
        bindTip(m, e => ({ title: r.country.name, subtitle, rows: tipRows, x: e.originalEvent.clientX, y: e.originalEvent.clientY }), tooltipLocked, tooltipTimer, showTip, () => { setTooltip(null); clearTradeHighlight() })
        m.on("click", () => highlightPartners(partnerNames, cfg.color))
        m.addTo(mg)
      })
    })

    // Country labels — rendered LAST so they appear above all markers
    if (showLabels) {
      const LABEL_OFFSET: Record<string, [number, number]> = {
        CG: [0.9, 0.9],
        NA: [0, -1.7],
        SN: [0.6, 0],
        EG: [-2, -4],
        CM: [-0.6, -0.6],
      }
      const LABEL_WRAP: Record<string, number> = {
        CI: 4,
      }
      const toIso2Label = (iso3: string) => ISO3_TO_ISO2[iso3] ?? iso3
      const selectedIso2Set = new Set(selectedCodesRef.current)
      filteredCountries.filter(c => c.appoMember).forEach(country => {
        const iso2 = toIso2Label(country.code)
        const centroid = geoCentroidsRef.current.get(iso2)
        const [baseLat, baseLon] = centroid ?? [country.lat, country.lon]
        const [dLat, dLon] = LABEL_OFFSET[iso2] ?? [0, 0]
        const [lat, lon] = [baseLat + dLat, baseLon + dLon]
        const lines = wrapText(country.name, LABEL_WRAP[iso2] ?? 14)
        const html = lines.map(l => `<div style="line-height:1.2">${l}</div>`).join("")
        const h = lines.length * 14
        const isSelected = selectedIso2Set.has(iso2)
        const color = isSelected ? "#ffffff" : "#0D2840"
        const shadow = isSelected
          ? "0 1px 3px rgba(0,0,0,0.7)"
          : "0 0 2px rgba(255,255,255,0.9),0 0 4px rgba(255,255,255,0.7)"
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:transparent;color:${color};font-size:10px;font-weight:bold;font-family:Arial,sans-serif;text-align:center;text-shadow:${shadow}">${html}</div>`,
          iconSize: [90, h],
          iconAnchor: [45, h / 2],
        })
        L.marker([lat, lon], { icon, interactive: false, zIndexOffset: 2000 }).addTo(lg)
      })
    }

  }, [countries, basins, refineries, pipelines, reserves, productions, training, rndCenters, storages, petrochems, oilBlocks, oilFields, tradeImports, tradeExports, selectedCountries, selectedYear, activeThemes, showLabels, showPipelineLabels, showTip, highlightPartners, clearTradeHighlight, t, geoReady])

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Ocean background */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #A8C8E0 0%, #B8D0E8 60%, #9DBCD8 100%)" }} />

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

      {/* Country profile panel (draggable) */}
      {countryProfile && (
        <CountryProfilePanel profile={countryProfile} onClose={() => setCountryProfile(null)} />
      )}

      {/* Basin panel (draggable) */}
      {basinPanel && (
        <BasinPanel
          basin={basinPanel}
          blocks={oilBlocks}
          fields={oilFields}
          onClose={() => setBasinPanel(null)}
          setPreviewDoc={setPreviewDoc}
        />
      )}

      {/* Country documents panel */}
      {docsCountry && (
        <DocsPanel
          countryId={docsCountry.id}
          countryName={docsCountry.name}
          onClose={() => setDocsCountry(null)}
          previewDoc={previewDoc}
          setPreviewDoc={setPreviewDoc}
        />
      )}

      {/* Document preview modal */}
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
