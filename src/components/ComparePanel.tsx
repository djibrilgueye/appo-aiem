"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Download, GripHorizontal, X, FileText, ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react"

interface Country {
  id: string
  code: string
  name: string
  region: string
}

interface ComparePanelProps {
  selectedCountries: string[]
  selectedYear: number
  onClose: () => void
}

// ISO3 → ISO2 for flag emoji (DB country codes are ISO3).
const ISO3_TO_ISO2: Record<string, string> = {
  DZA: "DZ", AGO: "AO", BEN: "BJ", CMR: "CM", TCD: "TD", COD: "CD", COG: "CG", CIV: "CI",
  EGY: "EG", GNQ: "GQ", GAB: "GA", GHA: "GH", LBY: "LY", NAM: "NA", NER: "NE", NGA: "NG",
  SEN: "SN", ZAF: "ZA", SDN: "SD", SSD: "SS", TZA: "TZ", TUN: "TN", MOZ: "MZ", MAR: "MA",
  RWA: "RW", TGO: "TG", KEN: "KE", ETH: "ET", UGA: "UG", MRT: "MR",
}

function getCountryFlag(code: string): string {
  const iso2 = code.length === 2 ? code : (ISO3_TO_ISO2[code] ?? "")
  if (!iso2 || iso2.length !== 2) return "🌍"
  return [...iso2.toUpperCase()]
    .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("")
}

function ExpandableBadgeList({
  items,
  label,
  colorClass = "bg-blue-50 text-[#0F3B57] border-blue-200/70",
}: {
  items: string[]
  label: string
  colorClass?: string
}) {
  const [expanded, setExpanded] = useState(false)
  if (!items || items.length === 0) return <span className="text-slate-400">—</span>

  return (
    <div className="flex flex-col gap-1.5 items-start">
      <button
        onClick={() => setExpanded(e => !e)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer hover:shadow-sm ${colorClass}`}
      >
        <span>{items.length} {label}{items.length > 1 ? "s" : ""}</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200/80 shadow-inner flex flex-col gap-1 max-h-44 overflow-y-auto w-full">
          {items.map((item, idx) => (
            <div key={idx} className="text-[11px] font-medium text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-100">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BenchmarkMetricBar({
  value,
  maxValue,
  unit,
  barColor = "bg-cyan-500",
}: {
  value: number
  maxValue: number
  unit: string
  barColor?: string
}) {
  if (!value || value <= 0) return <span className="text-slate-400 font-medium">—</span>
  const pct = maxValue > 0 ? Math.min(100, Math.max(8, (value / maxValue) * 100)) : 0

  return (
    <div className="flex flex-col gap-1 w-full max-w-[170px]">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-bold text-slate-900">{value.toLocaleString()}</span>
        <span className="text-[10px] text-slate-400 font-medium ml-1">{unit}</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ComparePanel({ selectedCountries, selectedYear, onClose }: ComparePanelProps) {
  const [countries, setCountries]   = useState<Country[]>([])
  const [reserves, setReserves]     = useState<any[]>([])
  const [production, setProduction] = useState<any[]>([])
  const [refineries, setRefineries] = useState<any[]>([])
  const [training, setTraining]     = useState<any[]>([])
  const [rnd, setRnd]               = useState<any[]>([])
  const [pipelines, setPipelines]   = useState<any[]>([])
  const [storage, setStorage]       = useState<any[]>([])
  const [petrochem, setPetrochem]   = useState<any[]>([])
  const [showExport, setShowExport] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [isMaximized, setIsMaximized] = useState(false)

  // Drag state
  const panelRef  = useRef<HTMLDivElement>(null)
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })
  const [pos, setPos] = useState({ x: 360, y: 70 })

  useEffect(() => {
    Promise.all([
      fetch("/api/countries").then(r => r.json()),
      fetch(`/api/reserves?year=${selectedYear}`).then(r => r.json()),
      fetch(`/api/production?year=${selectedYear}`).then(r => r.json()),
      fetch("/api/refineries").then(r => r.json()),
      fetch("/api/training").then(r => r.json()),
      fetch("/api/rnd").then(r => r.json()),
      fetch("/api/pipelines").then(r => r.json()),
      fetch("/api/storage").then(r => r.json()).catch(() => []),
      fetch("/api/petrochem").then(r => r.json()).catch(() => []),
    ]).then(([c, res, prod, ref, tr, rd, pip, sto, pet]) => {
      if (Array.isArray(c)) setCountries(c)
      setReserves(Array.isArray(res) ? res : [])
      setProduction(Array.isArray(prod) ? prod : [])
      setRefineries(Array.isArray(ref) ? ref : [])
      setTraining(Array.isArray(tr) ? tr : [])
      setRnd(Array.isArray(rd) ? rd : [])
      setPipelines(Array.isArray(pip) ? pip : [])
      setStorage(Array.isArray(sto) ? sto : [])
      setPetrochem(Array.isArray(pet) ? pet : [])
      setLoading(false)
    })
  }, [selectedYear])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return // no drag while maximized
    if ((e.target as HTMLElement).closest("button")) return
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y }
    e.preventDefault()
  }, [pos, isMaximized])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current.dragging) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      setPos({ x: Math.max(10, dragState.current.originX + dx), y: Math.max(10, dragState.current.originY + dy) })
    }
    const onUp = () => { dragState.current.dragging = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

  const selected = countries.filter(c => selectedCountries.includes(c.id))

  const getByCode = (items: any[], code: string, codeField = "country.code") =>
    items.filter(item => {
      const val = codeField.split(".").reduce((obj: any, key) => obj?.[key], item)
      return val === code
    })

  const maxOilProd = Math.max(...selected.map(c => getByCode(production, c.code)[0]?.oil || 0), 1)
  const maxGasProd = Math.max(...selected.map(c => getByCode(production, c.code)[0]?.gas || 0), 1)
  const maxOilRes  = Math.max(...selected.map(c => getByCode(reserves, c.code)[0]?.oil || 0), 1)
  const maxGasRes  = Math.max(...selected.map(c => getByCode(reserves, c.code)[0]?.gas || 0), 1)

  const exportCsv = () => {
    const header = ["Indicateur", ...selected.map(c => c.name)].join(",")
    const body = [
      ["Production Pétrole (kb/j)", ...selected.map(c => getByCode(production, c.code)[0]?.oil || 0)],
      ["Production Gaz (M m³/an)", ...selected.map(c => getByCode(production, c.code)[0]?.gas || 0)],
      ["Réserves Pétrole (Gbbl)", ...selected.map(c => getByCode(reserves, c.code)[0]?.oil || 0)],
      ["Réserves Gaz (Tcf)", ...selected.map(c => getByCode(reserves, c.code)[0]?.gas || 0)],
      ["Raffineries", ...selected.map(c => getByCode(refineries, c.code).length)],
      ["Pipelines", ...selected.map(c => pipelines.filter((p: any) => p.countries?.includes(c.code)).length)],
    ].map(row => row.map(v => `"${v}"`).join(",")).join("\n")

    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `comparaison-pays-${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  // Floating (draggable) or maximized (fixed inset) shell
  const panelStyle: React.CSSProperties = isMaximized
    ? {
        position: "fixed",
        top: "20px",
        left: "20px",
        right: "20px",
        bottom: "20px",
        zIndex: 1500,
        backgroundColor: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: "24px",
        border: "1px solid rgba(226,232,240,0.9)",
        boxShadow: "0 25px 80px rgba(15,59,87,0.3)",
      }
    : {
        position: "absolute",
        left: pos.x,
        top:  pos.y,
        zIndex: 1450,
        width: "720px",
        maxWidth: "92vw",
        maxHeight: "85vh",
        backgroundColor: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "20px",
        border: "1px solid rgba(226,232,240,0.9)",
        boxShadow: "0 25px 60px -15px rgba(15,59,87,0.22)",
      }

  if (loading || selected.length === 0) {
    return (
      <div ref={panelRef} style={{ ...panelStyle, width: "380px" }} className="overflow-hidden">
        <header
          onMouseDown={onMouseDown}
          className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/80 bg-[#0F3B57] text-white cursor-grab active:cursor-grabbing select-none"
        >
          <GripHorizontal size={15} className="opacity-70 shrink-0" />
          <span className="flex-1 text-xs font-bold uppercase tracking-wider">Comparaison des pays</span>
          <button onClick={onClose} className="hover:opacity-75 transition text-white">
            <X size={15} />
          </button>
        </header>
        <div className="p-5 text-slate-500 text-xs">
          {loading ? "Chargement des données…" : "Veuillez cocher au moins 2 pays dans la liste pour les comparer."}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      className="overflow-hidden flex flex-col transition-all duration-200"
    >
      {/* Header: draggable + maximize / export / close */}
      <header
        onMouseDown={onMouseDown}
        className={`flex items-center gap-3 px-5 py-3 border-b border-slate-200/80 bg-white select-none shrink-0 ${
          isMaximized ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        {!isMaximized && (
          <GripHorizontal size={16} className="text-slate-400 hover:text-slate-600 transition" />
        )}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-extrabold text-[#0F3B57]">Comparaison des Pays</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {selectedYear}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            ({selected.length} pays sélectionnés)
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowExport(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#0F3B57] border border-slate-200/80 transition"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[140px] overflow-hidden">
              <button
                onClick={exportCsv}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <FileText size={13} className="text-[#0F3B57]" /> Export CSV
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsMaximized(m => !m)}
          title={isMaximized ? "Réduire à la fenêtre flottante" : "Agrandir en plein écran"}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0F3B57] hover:bg-slate-100 transition"
        >
          {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        <button
          onClick={onClose}
          title="Fermer la comparaison"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X size={16} />
        </button>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-[200px] border-b border-slate-200">
                Indicateurs
              </th>
              {selected.map(c => (
                <th key={c.id} className="p-3 text-left border-b border-slate-200 min-w-[180px]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{getCountryFlag(c.code)}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 leading-tight">{c.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{c.code}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan={selected.length + 1} className="pt-4 pb-1.5 px-3 text-[10px] font-extrabold text-[#0F3B57] uppercase tracking-wider bg-slate-50/80 border-y border-slate-200/60">
                📊 Production & Réserves ({selectedYear})
              </td>
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Production pétrole brut</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <BenchmarkMetricBar value={getByCode(production, c.code)[0]?.oil || 0} maxValue={maxOilProd} unit="kb/j" barColor="bg-cyan-500" />
                </td>
              ))}
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Production gaz naturel</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <BenchmarkMetricBar value={getByCode(production, c.code)[0]?.gas || 0} maxValue={maxGasProd} unit="M m³/an" barColor="bg-amber-500" />
                </td>
              ))}
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Réserves pétrole</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <BenchmarkMetricBar value={getByCode(reserves, c.code)[0]?.oil || 0} maxValue={maxOilRes} unit="Gbbl" barColor="bg-cyan-600" />
                </td>
              ))}
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Réserves gaz</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <BenchmarkMetricBar value={getByCode(reserves, c.code)[0]?.gas || 0} maxValue={maxGasRes} unit="Tcf" barColor="bg-amber-600" />
                </td>
              ))}
            </tr>

            <tr>
              <td colSpan={selected.length + 1} className="pt-5 pb-1.5 px-3 text-[10px] font-extrabold text-[#0F3B57] uppercase tracking-wider bg-slate-50/80 border-y border-slate-200/60">
                🏭 Infrastructures Énergétiques
              </td>
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Raffineries</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <ExpandableBadgeList items={getByCode(refineries, c.code).map((r: any) => r.name)} label="Raffinerie" colorClass="bg-rose-50 text-rose-800 border-rose-200" />
                </td>
              ))}
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Pipelines</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <ExpandableBadgeList items={pipelines.filter((p: any) => p.countries?.includes(c.code)).map((p: any) => p.name)} label="Pipeline" colorClass="bg-amber-50 text-amber-900 border-amber-200" />
                </td>
              ))}
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Stockage</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <ExpandableBadgeList items={getByCode(storage, c.code).map((s: any) => `${s.name} (${s.capacityMb} Mb)`)} label="Site Stockage" colorClass="bg-sky-50 text-sky-800 border-sky-200" />
                </td>
              ))}
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Pétrochimie</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <ExpandableBadgeList items={getByCode(petrochem, c.code).map((p: any) => p.name)} label="Usine" colorClass="bg-purple-50 text-purple-800 border-purple-200" />
                </td>
              ))}
            </tr>

            <tr>
              <td colSpan={selected.length + 1} className="pt-5 pb-1.5 px-3 text-[10px] font-extrabold text-[#0F3B57] uppercase tracking-wider bg-slate-50/80 border-y border-slate-200/60">
                🎓 Formation & R&D
              </td>
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Centres de formation</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <ExpandableBadgeList items={getByCode(training, c.code).map((t: any) => t.name)} label="Centre" colorClass="bg-emerald-50 text-emerald-800 border-emerald-200" />
                </td>
              ))}
            </tr>

            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td className="p-3 text-xs font-semibold text-slate-700">Instituts R&D</td>
              {selected.map(c => (
                <td key={c.id} className="p-3">
                  <ExpandableBadgeList items={getByCode(rnd, c.code).map((r: any) => r.name)} label="Institut R&D" colorClass="bg-indigo-50 text-indigo-800 border-indigo-200" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
