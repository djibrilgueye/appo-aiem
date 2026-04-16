"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

const STORAGE_TYPES = ["Crude Oil", "LNG Import Terminal (FSRU)", "LNG Export Terminal", "Products Depot", "LNG"]
const LNG_SUBTYPES = ["Import (regasification)", "Export (liquefaction)"]
const STATUSES = ["operational", "under construction", "planned", "closed"]

export default function NewStoragePage() {
  const { status } = useSession()
  const router = useRouter()
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    storageId: "",
    name: "",
    countryId: "",
    lat: 0,
    lon: 0,
    type: "Crude Oil",
    lngSubtype: "",
    capacityMb: 0,
    regasCapacity: "",
    liquefCapacity: "",
    status: "operational",
  })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { fetch("/api/countries?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setCountries(d) }) }, [])

  const isLng = form.type.toLowerCase().includes("lng")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    const body = {
      ...form,
      lat: parseFloat(String(form.lat)),
      lon: parseFloat(String(form.lon)),
      capacityMb: parseFloat(String(form.capacityMb)) || 0,
      lngSubtype: form.lngSubtype || null,
      regasCapacity: form.regasCapacity ? parseFloat(form.regasCapacity) : null,
      liquefCapacity: form.liquefCapacity ? parseFloat(form.liquefCapacity) : null,
    }
    const res = await fetch("/api/storage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) router.push("/admin/storage")
    else { const d = await res.json(); setError(d.error || "Erreur") }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/storage" className="text-[#5B8FB9] hover:text-[#1B4F72]">←</Link>
        <h1 className="text-2xl font-bold text-[#0D2840]">Nouveau Dépôt / Stockage</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Storage ID <span className="text-[#A3C4DC] text-xs">(ex. STO001)</span></label>
            <input value={form.storageId} onChange={e => setForm({ ...form, storageId: e.target.value })} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Nom</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
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
            <label className="block text-[#1B4F72] text-sm mb-1">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, lngSubtype: "" })} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
              {STORAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {isLng && (
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Sous-type GNL <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
            <select value={form.lngSubtype} onChange={e => setForm({ ...form, lngSubtype: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
              <option value="">-- Aucun --</option>
              {LNG_SUBTYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Latitude</label>
            <input type="number" step="0.0001" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Longitude</label>
            <input type="number" step="0.0001" value={form.lon} onChange={e => setForm({ ...form, lon: parseFloat(e.target.value) || 0 })} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Capacité totale (Mb) <span className="text-[#A3C4DC] text-xs">ou Mm³ pour GNL</span></label>
            <input type="number" step="0.001" value={form.capacityMb} onChange={e => setForm({ ...form, capacityMb: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Statut</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {isLng && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Capacité regazéification (bcm/an) <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" step="0.01" value={form.regasCapacity} onChange={e => setForm({ ...form, regasCapacity: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Capacité liquéfaction (Mt/an) <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" step="0.01" value={form.liquefCapacity} onChange={e => setForm({ ...form, liquefCapacity: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition">
            <Save size={18} />{loading ? "Enregistrement..." : "Enregistrer"}
          </button>
          <Link href="/admin/storage" className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
