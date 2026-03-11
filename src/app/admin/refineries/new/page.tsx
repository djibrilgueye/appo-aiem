"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

const STATUSES = ["operational", "under construction", "proposed", "idle", "decommissioned"]

export default function NewRefineryPage() {
  const { status } = useSession()
  const router = useRouter()
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ refineryId: "", name: "", countryId: "", lat: 0, lon: 0, capacityKbd: 0, status: "operational", year: "" })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { fetch("/api/countries?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setCountries(d) }) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    const body = { ...form, lat: parseFloat(String(form.lat)), lon: parseFloat(String(form.lon)), capacityKbd: parseInt(String(form.capacityKbd)), year: form.year ? parseInt(form.year) : undefined }
    const res = await fetch("/api/refineries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) router.push("/admin/refineries")
    else { const d = await res.json(); setError(d.error || "Erreur") }
    setLoading(false)
  }

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/refineries" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
          <h1 className="text-2xl font-bold text-[#0D2840]">Add Refinery</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Refinery ID <span className="text-[#A3C4DC] text-xs">(ex. REF020)</span></label>
              <input value={form.refineryId} onChange={e => setForm({...form, refineryId: e.target.value})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
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
              <label className="block text-[#1B4F72] text-sm mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Latitude</label>
              <input type="number" step="0.0001" value={form.lat} onChange={e => setForm({...form, lat: parseFloat(e.target.value)||0})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Longitude</label>
              <input type="number" step="0.0001" value={form.lon} onChange={e => setForm({...form, lon: parseFloat(e.target.value)||0})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Capacity (kb/d)</label>
              <input type="number" value={form.capacityKbd} onChange={e => setForm({...form, capacityKbd: parseInt(e.target.value)||0})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Year commissioned <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition">
              <Save size={18} />{loading ? "Saving..." : "Save"}
            </button>
            <Link href="/admin/refineries" className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition">Cancel</Link>
          </div>
        </form>
    </div>
  )
}
