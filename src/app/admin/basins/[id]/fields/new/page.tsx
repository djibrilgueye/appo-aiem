"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

const STATUSES = ["Découverte", "En développement", "En production", "Abandonné"]
const TYPES = ["Oil", "Gas", "Oil & Gas", "Condensate"]

export default function NewFieldPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const basinId = params.id as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [basinName, setBasinName] = useState("")
  const [countryId, setCountryId] = useState("")
  const [form, setForm] = useState({
    fieldId: "", name: "", status: "Découverte", type: "Oil & Gas",
    operator: "", partners: "",
    discoveryYear: "", productionStart: "",
    peakOilKbd: "", peakGasMmcmd: "",
    oilMmb: "", gasBcf: "",
    lat: "", lon: "", description: ""
  })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => {
    if (!basinId) return
    fetch(`/api/basins/${basinId}`).then(r => r.json()).then(d => {
      setBasinName(d.name || "")
      setCountryId(d.countryId || "")
    })
  }, [basinId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    const body = {
      fieldId: form.fieldId,
      name: form.name,
      basinId,
      countryId,
      status: form.status,
      type: form.type,
      operator: form.operator || undefined,
      partners: form.partners || undefined,
      discoveryYear: form.discoveryYear ? parseInt(form.discoveryYear) : undefined,
      productionStart: form.productionStart ? parseInt(form.productionStart) : undefined,
      peakOilKbd: form.peakOilKbd ? parseFloat(form.peakOilKbd) : undefined,
      peakGasMmcmd: form.peakGasMmcmd ? parseFloat(form.peakGasMmcmd) : undefined,
      oilMmb: form.oilMmb ? parseFloat(form.oilMmb) : undefined,
      gasBcf: form.gasBcf ? parseFloat(form.gasBcf) : undefined,
      lat: parseFloat(form.lat) || 0,
      lon: parseFloat(form.lon) || 0,
      description: form.description || undefined,
    }
    const res = await fetch("/api/fields", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) router.push(`/admin/basins/${basinId}`)
    else { const d = await res.json(); setError(d.error || "Erreur") }
    setLoading(false)
  }

  const f = (field: keyof typeof form) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [field]: e.target.value })
  })

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/basins/${basinId}`} className="text-[#5B8FB9] hover:text-[#1B4F72] text-sm">← {basinName}</Link>
        <h1 className="text-2xl font-bold text-[#0D2840]">Ajouter un champ</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">ID Champ <span className="text-[#A3C4DC] text-xs">(ex. FLD001)</span></label>
            <input {...f("fieldId")} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Nom du champ</label>
            <input {...f("name")} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Statut</label>
            <select {...f("status")} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Type</label>
            <select {...f("type")} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Opérateur <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input {...f("operator")} placeholder="ex. Woodside Energy" className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Découverte <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" min="1900" max="2030" {...f("discoveryYear")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Début production <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" min="1900" max="2030" {...f("productionStart")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Latitude *</label>
            <input type="number" step="0.0001" {...f("lat")} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Longitude *</label>
            <input type="number" step="0.0001" {...f("lon")} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Huile récup. (Mmb) <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" step="0.1" {...f("oilMmb")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Gaz (Bcf) <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" step="0.1" {...f("gasBcf")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Peak huile (kb/d) <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" step="0.1" {...f("peakOilKbd")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Peak gaz (MMcm/d) <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" step="0.01" {...f("peakGasMmcmd")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">Partenaires <span className="text-[#A3C4DC] text-xs">JSON opt.</span></label>
          <input {...f("partners")} placeholder='[{"name":"Petrosen","share":18}]' className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] font-mono text-xs focus:outline-none focus:border-[#1B4F72]" />
        </div>
        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">Description <span className="text-[#A3C4DC] text-xs">opt.</span></label>
          <textarea {...f("description")} rows={2} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition">
            <Save size={18} />{loading ? "Saving..." : "Save"}
          </button>
          <Link href={`/admin/basins/${basinId}`} className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
