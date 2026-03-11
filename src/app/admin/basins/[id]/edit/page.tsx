"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

const TYPES = ["Oil", "Gas", "Oil & Gas"]

export default function EditBasinPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ basinId: "", name: "", countryId: "", type: "Oil & Gas", lat: 0, lon: 0, areaKm2: "" })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])

  useEffect(() => {
    fetch("/api/countries?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setCountries(d) })
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/basins/${id}`)
      .then(r => r.json())
      .then(d => {
        setForm({
          basinId: d.basinId || "",
          name: d.name || "",
          countryId: d.countryId || "",
          type: d.type || "Oil & Gas",
          lat: d.lat || 0,
          lon: d.lon || 0,
          areaKm2: d.areaKm2 != null ? String(d.areaKm2) : "",
        })
        setFetching(false)
      })
      .catch(() => { setError("Failed to load basin"); setFetching(false) })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    const body = { ...form, lat: parseFloat(String(form.lat)), lon: parseFloat(String(form.lon)), areaKm2: form.areaKm2 ? parseInt(form.areaKm2) : undefined }
    const res = await fetch(`/api/basins/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) router.push("/admin/basins")
    else { const d = await res.json(); setError(d.error || "Erreur") }
    setLoading(false)
  }

  if (fetching) return null

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/basins" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
          <h1 className="text-2xl font-bold text-[#0D2840]">Edit Basin / Field</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Basin ID <span className="text-[#A3C4DC] text-xs">(ex. BAS023)</span></label>
              <input value={form.basinId} onChange={e => setForm({...form, basinId: e.target.value})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Country</label>
              <select value={form.countryId} onChange={e => setForm({...form, countryId: e.target.value})} required className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
                <option value="">-- Select --</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Latitude</label>
              <input type="number" step="0.0001" value={form.lat} onChange={e => setForm({...form, lat: parseFloat(e.target.value)||0})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Longitude</label>
              <input type="number" step="0.0001" value={form.lon} onChange={e => setForm({...form, lon: parseFloat(e.target.value)||0})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Area (km²) <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" value={form.areaKm2} onChange={e => setForm({...form, areaKm2: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition">
              <Save size={18} />{loading ? "Saving..." : "Save"}
            </button>
            <Link href="/admin/basins" className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition">Cancel</Link>
          </div>
        </form>
    </div>
  )
}
