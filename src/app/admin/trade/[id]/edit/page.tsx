"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

function EditTradeForm() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const direction = (searchParams.get("dir") || "import") === "import" ? "Import" : "Export"
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
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
    partiesInput: "",
  })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { fetch("/api/countries?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setCountries(d) }) }, [])

  useEffect(() => {
    if (!id) return
    const endpoint = direction === "Import" ? `/api/trade/imports/${id}` : `/api/trade/exports/${id}`
    fetch(endpoint)
      .then(r => r.json())
      .then(d => {
        let partiesInput = ""
        try {
          const arr = typeof d.mainSources === "string" ? JSON.parse(d.mainSources) :
                      typeof d.mainDestinations === "string" ? JSON.parse(d.mainDestinations) : []
          partiesInput = Array.isArray(arr) ? arr.join(", ") : ""
        } catch { partiesInput = "" }
        setForm({
          countryId: d.countryId || "",
          year: d.year || new Date().getFullYear(),
          oilIntraKbD: d.oilIntraKbD != null ? String(d.oilIntraKbD) : "",
          gasIntraBcm: d.gasIntraBcm != null ? String(d.gasIntraBcm) : "",
          oilExtraKbD: d.oilExtraKbD != null ? String(d.oilExtraKbD) : "",
          gasExtraBcm: d.gasExtraBcm != null ? String(d.gasExtraBcm) : "",
          essenceM3: d.essenceM3 != null ? String(d.essenceM3) : "",
          gasoilM3: d.gasoilM3 != null ? String(d.gasoilM3) : "",
          gplTM: d.gplTM != null ? String(d.gplTM) : "",
          jetFuelTM: d.jetFuelTM != null ? String(d.jetFuelTM) : "",
          partiesInput,
        })
        setFetching(false)
      })
      .catch(() => { setError("Impossible de charger l'enregistrement"); setFetching(false) })
  }, [id, direction])

  const parseNum = (v: string) => v !== "" ? parseFloat(v) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    const parties = JSON.stringify(form.partiesInput.split(",").map(s => s.trim()).filter(Boolean))
    const isImport = direction === "Import"
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
    const endpoint = isImport ? `/api/trade/imports/${id}` : `/api/trade/exports/${id}`
    const res = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) router.push("/admin/trade")
    else { const d = await res.json(); setError(d.error || "Erreur") }
    setLoading(false)
  }

  if (fetching) return null

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/trade" className="text-[#5B8FB9] hover:text-[#1B4F72]">←</Link>
        <h1 className="text-2xl font-bold text-[#0D2840]">Modifier enregistrement — {direction}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1 rounded text-sm font-medium ${direction === "Import" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>{direction}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-[#1B4F72] text-sm mb-1">Pétrole intra-africain (kb/d)</label>
              <input type="number" step="0.01" value={form.oilIntraKbD} onChange={e => setForm({ ...form, oilIntraKbD: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Pétrole hors Afrique (kb/d)</label>
              <input type="number" step="0.01" value={form.oilExtraKbD} onChange={e => setForm({ ...form, oilExtraKbD: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Gaz intra-africain (bcm)</label>
              <input type="number" step="0.001" value={form.gasIntraBcm} onChange={e => setForm({ ...form, gasIntraBcm: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Gaz hors Afrique (bcm)</label>
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
            {direction === "Import" ? "Principales sources" : "Principales destinations"} <span className="text-[#A3C4DC] text-xs">codes pays séparés par des virgules</span>
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

export default function EditTradePage() {
  return (
    <Suspense fallback={null}>
      <EditTradeForm />
    </Suspense>
  )
}
