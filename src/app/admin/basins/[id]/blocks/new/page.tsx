"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

const STATUSES = ["Libre", "Attribué", "Exploration", "Production", "Abandonné"]
const TYPES = ["Oil", "Gas", "Oil & Gas"]

export default function NewBlockPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const basinId = params.id as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [basinName, setBasinName] = useState("")
  const [countryId, setCountryId] = useState("")
  const [form, setForm] = useState({
    blockId: "", name: "", status: "Libre", type: "Oil & Gas",
    operator: "", operatorContact: "", awardDate: "", expiryDate: "",
    areaKm2: "", lat: "", lon: "", description: "", partners: ""
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
      blockId: form.blockId,
      name: form.name,
      basinId,
      countryId,
      status: form.status,
      type: form.type,
      operator: form.operator || undefined,
      operatorContact: form.operatorContact || undefined,
      awardDate: form.awardDate ? parseInt(form.awardDate) : undefined,
      expiryDate: form.expiryDate ? parseInt(form.expiryDate) : undefined,
      areaKm2: form.areaKm2 ? parseInt(form.areaKm2) : undefined,
      lat: form.lat ? parseFloat(form.lat) : undefined,
      lon: form.lon ? parseFloat(form.lon) : undefined,
      description: form.description || undefined,
      partners: form.partners || undefined,
    }
    const res = await fetch("/api/blocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
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
        <h1 className="text-2xl font-bold text-[#0D2840]">Ajouter un bloc</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">ID Bloc <span className="text-[#A3C4DC] text-xs">(ex. BLK001)</span></label>
            <input {...f("blockId")} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Nom</label>
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
            <label className="block text-[#1B4F72] text-sm mb-1">Surface (km²) <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" {...f("areaKm2")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Opérateur principal <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input {...f("operator")} placeholder="ex. TotalEnergies" className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Contact / Site web opérateur <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input {...f("operatorContact")} placeholder="ex. https://totalenergies.com" className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Année d&apos;attribution <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" min="1960" max="2030" {...f("awardDate")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Expiration permis <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" min="1960" max="2060" {...f("expiryDate")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Latitude (centroïde) <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" step="0.0001" {...f("lat")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Longitude (centroïde) <span className="text-[#A3C4DC] text-xs">opt.</span></label>
            <input type="number" step="0.0001" {...f("lon")} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">Associés / Partenaires <span className="text-[#A3C4DC] text-xs">JSON opt., ex. [{`{"name":"Eni","share":25}`}]</span></label>
          <input {...f("partners")} placeholder='[{"name":"Eni","share":25},{"name":"Petrosen","share":10}]' className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] font-mono text-xs focus:outline-none focus:border-[#1B4F72]" />
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
