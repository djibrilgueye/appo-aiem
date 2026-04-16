"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

export default function NewTradePage() {
  const { status } = useSession()
  const router = useRouter()
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    direction: "Import",
    countryId: "",
    year: new Date().getFullYear(),
    oilIntraKbD: "",
    gasIntraBcm: "",
    oilExtraKbD: "",
    gasExtraBcm: "",
    essenceM3: "",
    gasoilM3: "",
    gplTM: "",
    jetFuelTM: "",
    partiesInput: "", // mainSources or mainDestinations, comma-separated
  })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { fetch("/api/countries?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setCountries(d) }) }, [])

  const parseNum = (v: string) => v !== "" ? parseFloat(v) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    const parties = JSON.stringify(form.partiesInput.split(",").map(s => s.trim()).filter(Boolean))
    const isImport = form.direction === "Import"
    const body = {
      countryId: form.countryId,
      year: parseInt(String(form.year)),
      oilIntraKbD: parseFloat(form.oilIntraKbD) || 0,
      gasIntraBcm: parseFloat(form.gasIntraBcm) || 0,
      oilExtraKbD: parseFloat(form.oilExtraKbD) || 0,
      gasExtraBcm: parseFloat(form.gasExtraBcm) || 0,
      essenceM3: parseNum(form.essenceM3),
      gasoilM3: parseNum(form.gasoilM3),
      gplTM: parseNum(form.gplTM),
      jetFuelTM: parseNum(form.jetFuelTM),
      ...(isImport ? { mainSources: parties } : { mainDestinations: parties }),
    }
    const endpoint = isImport ? "/api/trade/imports" : "/api/trade/exports"
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) router.push("/admin/trade")
    else { const d = await res.json(); setError(d.error || "Erreur") }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/trade" className="text-[#5B8FB9] hover:text-[#1B4F72]">←</Link>
        <h1 className="text-2xl font-bold text-[#0D2840]">Nouvel enregistrement commerce</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Direction</label>
            <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
              <option value="Import">Import</option>
              <option value="Export">Export</option>
            </select>
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Pays</label>
            <select value={form.countryId} onChange={e => setForm({ ...form, countryId: e.target.value })} required className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
              <option value="">-- Sélectionner --</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Année</label>
            <input type="number" min="2000" max="2030" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>

        <div className="border-t border-[#EBF3FB] pt-4">
          <p className="text-[#1B4F72] text-sm font-medium mb-3">Hydrocarbures bruts</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Pétrole intra-africain (kb/d) <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" step="0.01" value={form.oilIntraKbD} onChange={e => setForm({ ...form, oilIntraKbD: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Pétrole hors Afrique (kb/d) <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" step="0.01" value={form.oilExtraKbD} onChange={e => setForm({ ...form, oilExtraKbD: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Gaz intra-africain (bcm) <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" step="0.001" value={form.gasIntraBcm} onChange={e => setForm({ ...form, gasIntraBcm: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Gaz hors Afrique (bcm) <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" step="0.001" value={form.gasExtraBcm} onChange={e => setForm({ ...form, gasExtraBcm: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
        </div>

        <div className="border-t border-[#EBF3FB] pt-4">
          <p className="text-[#1B4F72] text-sm font-medium mb-3">Produits raffinés <span className="text-[#A3C4DC] text-xs font-normal">optionnel</span></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Essence (m³)</label>
              <input type="number" step="1" value={form.essenceM3} onChange={e => setForm({ ...form, essenceM3: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Gasoil (m³)</label>
              <input type="number" step="1" value={form.gasoilM3} onChange={e => setForm({ ...form, gasoilM3: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">GPL (tonnes)</label>
              <input type="number" step="1" value={form.gplTM} onChange={e => setForm({ ...form, gplTM: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Jet Fuel (tonnes)</label>
              <input type="number" step="1" value={form.jetFuelTM} onChange={e => setForm({ ...form, jetFuelTM: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">
            {form.direction === "Import" ? "Principales sources" : "Principales destinations"} <span className="text-[#A3C4DC] text-xs">codes pays séparés par des virgules, ex: DZA, NGA</span>
          </label>
          <input value={form.partiesInput} onChange={e => setForm({ ...form, partiesInput: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" placeholder="DZA, NGA, LBY" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition">
            <Save size={18} />{loading ? "Enregistrement..." : "Enregistrer"}
          </button>
          <Link href="/admin/trade" className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
