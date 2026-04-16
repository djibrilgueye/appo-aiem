"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

export default function EditRnDPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    centerId: "",
    name: "",
    countryId: "",
    lat: 0,
    lon: 0,
    focus: "",
    year: "",
  })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { fetch("/api/countries?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setCountries(d) }) }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/rnd/${id}`)
      .then(r => r.json())
      .then(d => {
        setForm({
          centerId: d.centerId || "",
          name: d.name || "",
          countryId: d.countryId || "",
          lat: d.lat || 0,
          lon: d.lon || 0,
          focus: d.focus || "",
          year: d.year != null ? String(d.year) : "",
        })
        setFetching(false)
      })
      .catch(() => { setError("Impossible de charger l'enregistrement"); setFetching(false) })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    const body = {
      ...form,
      lat: parseFloat(String(form.lat)),
      lon: parseFloat(String(form.lon)),
      year: form.year ? parseInt(form.year) : null,
    }
    const res = await fetch(`/api/rnd/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) router.push("/admin/rnd")
    else { const d = await res.json(); setError(d.error || "Erreur") }
    setLoading(false)
  }

  if (fetching) return null

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/rnd" className="text-[#5B8FB9] hover:text-[#1B4F72]">←</Link>
        <h1 className="text-2xl font-bold text-[#0D2840]">Modifier centre R&D</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Center ID</label>
            <input value={form.centerId} onChange={e => setForm({ ...form, centerId: e.target.value })} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
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
            <label className="block text-[#1B4F72] text-sm mb-1">Domaine de recherche (focus)</label>
            <input value={form.focus} onChange={e => setForm({ ...form, focus: e.target.value })} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
        </div>
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
        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">Année de création <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
          <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition">
            <Save size={18} />{loading ? "Enregistrement..." : "Enregistrer"}
          </button>
          <Link href="/admin/rnd" className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
