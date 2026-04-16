"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Download, GripHorizontal, X, FileText, Image } from "lucide-react"

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
  const [loading, setLoading] = useState(true)

  // Drag state
  const panelRef  = useRef<HTMLDivElement>(null)
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })
  const [pos, setPos] = useState({ x: 12, y: 12 })

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

  // Drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current.dragging) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      setPos({ x: dragState.current.originX + dx, y: dragState.current.originY + dy })
    }
    const onUp = () => { dragState.current.dragging = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  const selected = countries.filter(c => selectedCountries.includes(c.id))

  const getByCode = (items: any[], code: string, codeField = "country.code") =>
    items.filter(item => {
      const val = codeField.split(".").reduce((obj: any, key) => obj?.[key], item)
      return val === code
    })

  const rows: { label: string; values: (string | number)[] }[] = [
    {
      label: "Oil production (kb/d)",
      values: selected.map(c => {
        const p = getByCode(production, c.code)
        return p.length > 0 && p[0].oil > 0 ? p[0].oil.toLocaleString() : "—"
      }),
    },
    {
      label: "Gas production (M m³/yr)",
      values: selected.map(c => {
        const p = getByCode(production, c.code)
        return p.length > 0 && p[0].gas > 0 ? p[0].gas.toLocaleString() : "—"
      }),
    },
    {
      label: "Oil reserves (Gbbl)",
      values: selected.map(c => {
        const r = getByCode(reserves, c.code)
        return r.length > 0 && r[0].oil > 0 ? r[0].oil.toLocaleString() : "—"
      }),
    },
    {
      label: "Gas reserves (Tcf)",
      values: selected.map(c => {
        const r = getByCode(reserves, c.code)
        return r.length > 0 && r[0].gas > 0 ? r[0].gas.toLocaleString() : "—"
      }),
    },
    {
      label: "Refineries",
      values: selected.map(c => {
        const items = getByCode(refineries, c.code)
        return items.length > 0 ? items.map((r: any) => r.name).join(", ") : "—"
      }),
    },
    {
      label: "Pipelines",
      values: selected.map(c => {
        const items = pipelines.filter((p: any) => p.countries?.includes(c.code))
        return items.length > 0 ? items.map((p: any) => p.name).join(", ") : "—"
      }),
    },
    {
      label: "Training institutes",
      values: selected.map(c => {
        const items = getByCode(training, c.code)
        return items.length > 0 ? items.map((t: any) => t.name).join(", ") : "—"
      }),
    },
    {
      label: "R&D centers",
      values: selected.map(c => {
        const items = getByCode(rnd, c.code)
        return items.length > 0 ? items.map((r: any) => r.name).join(", ") : "—"
      }),
    },
    {
      label: "Storage facilities",
      values: selected.map(c => {
        const items = getByCode(storage, c.code)
        return items.length > 0 ? items.map((s: any) => `${s.name} (${s.capacityMb} Mb)`).join(", ") : "—"
      }),
    },
    {
      label: "Petrochemical plants",
      values: selected.map(c => {
        const items = getByCode(petrochem, c.code)
        return items.length > 0 ? items.map((p: any) => p.name).join(", ") : "—"
      }),
    },
  ]

  // Export CSV
  const exportCsv = () => {
    const header = ["Indicator", ...selected.map(c => c.name)].join(",")
    const body = rows.map(row =>
      [`"${row.label}"`, ...row.values.map(v => `"${String(v).replace(/"/g, '""')}"`)]
        .join(",")
    ).join("\n")
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `country-comparison-${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  // Export PNG (html2canvas-free: use native print on a hidden iframe)
  const exportPng = async () => {
    setShowExport(false)
    if (!panelRef.current) return

    // Build a standalone HTML snapshot
    const countryHeaders = selected.map(c => `<th style="padding:8px 12px;text-align:left;border-bottom:2px solid #D0E4F0;white-space:nowrap;color:#0D2840;font-weight:700">${c.name}</th>`).join("")
    const bodyRows = rows.map(row => {
      const cells = row.values.map(v => `<td style="padding:6px 12px;border-bottom:1px solid #EBF3FB;color:#334155;vertical-align:top">${v}</td>`).join("")
      return `<tr><th style="padding:6px 12px;border-bottom:1px solid #EBF3FB;text-align:left;color:#1B4F72;font-weight:600;white-space:nowrap">${row.label}</th>${cells}</tr>`
    }).join("")

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>body{margin:0;font-family:Arial,sans-serif;background:#F4F7FB;padding:24px;}
.card{background:#fff;border-radius:12px;border:1px solid #D0E4F0;overflow:hidden;box-shadow:0 2px 12px rgba(27,79,114,.1);}
h2{margin:0;padding:16px 20px;background:#1B4F72;color:#fff;font-size:15px;}
table{width:100%;border-collapse:collapse;font-size:13px;}
</style></head><body>
<div class="card">
<h2>Country Comparison — ${selectedYear}</h2>
<table>
<thead><tr><th style="padding:8px 12px;text-align:left;border-bottom:2px solid #D0E4F0;color:#0D2840"></th>${countryHeaders}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
</div></body></html>`

    const iframe = document.createElement("iframe")
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:900px;height:600px;border:none"
    document.body.appendChild(iframe)
    iframe.contentDocument!.write(html)
    iframe.contentDocument!.close()
    await new Promise(r => setTimeout(r, 300))
    iframe.contentWindow!.print()
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    left: pos.x,
    top:  pos.y,
    zIndex: 1450,
  }

  if (loading || selected.length === 0) {
    return (
      <div ref={panelRef} style={panelStyle} className="w-[360px] bg-white text-[#0b2e59] rounded-xl border border-[#D0E4F0] shadow-xl">
        <header
          onMouseDown={onMouseDown}
          className="flex items-center gap-2 px-3 py-2 border-b border-[#D0E4F0] font-bold cursor-grab active:cursor-grabbing select-none bg-[#1B4F72] text-white rounded-t-xl"
        >
          <GripHorizontal size={14} className="opacity-60 shrink-0" />
          <span className="flex-1 text-sm">Comparaison des pays</span>
          <button onClick={onClose} title="Close" className="hover:opacity-70 transition ml-1">
            <X size={15} />
          </button>
        </header>
        <div className="p-3 text-[#5B8FB9] text-sm">
          {loading ? "Chargement…" : "Sélectionnez au moins un pays dans la liste."}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      className="max-w-[640px] bg-white text-[#0b2e59] rounded-xl border border-[#D0E4F0] shadow-xl"
    >
      {/* Header */}
      <header
        onMouseDown={onMouseDown}
        className="flex items-center gap-2 px-3 py-2 border-b border-[#D0E4F0] cursor-grab active:cursor-grabbing select-none bg-[#1B4F72] text-white rounded-t-xl sticky top-0 z-10"
      >
        <GripHorizontal size={14} className="opacity-60 shrink-0" />
        <span className="flex-1 text-sm font-bold">Country comparison — {selectedYear}</span>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExport(v => !v)}
            title="Export"
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-2 py-1 rounded text-xs transition"
          >
            <Download size={12} /> Export
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#D0E4F0] rounded-lg shadow-lg z-50 min-w-[140px] overflow-hidden">
              <button
                onClick={exportCsv}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#0D2840] hover:bg-[#F4F7FB] transition"
              >
                <FileText size={13} className="text-[#1B4F72]" /> Export CSV
              </button>
              <button
                onClick={exportPng}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#0D2840] hover:bg-[#F4F7FB] transition"
              >
                <Image size={13} className="text-[#1B4F72]" /> Export / Print
              </button>
            </div>
          )}
        </div>

        <button onClick={onClose} title="Close" className="hover:opacity-70 transition ml-1 text-white">
          <X size={15} />
        </button>
      </header>

      {/* Table */}
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="sticky top-0 bg-[#EBF3FB] z-[1] border-b border-[#D0E4F0] p-2 text-left text-[#5B8FB9] text-xs uppercase font-semibold" />
              {selected.map(c => (
                <th key={c.id} className="sticky top-0 bg-[#EBF3FB] z-[1] border-b border-[#D0E4F0] p-2 text-left font-bold text-[#0D2840] text-sm whitespace-nowrap">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="hover:bg-[#F4F7FB] transition">
                <th className="border-b border-[#EBF3FB] p-2 text-left font-semibold text-[#1B4F72] whitespace-nowrap text-xs">
                  {row.label}
                </th>
                {row.values.map((val, i) => (
                  <td key={i} className="border-b border-[#EBF3FB] p-2 text-left align-top text-[#334155]">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
