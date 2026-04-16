"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

export default function NewProductionPage() {
  const { status } = useSession()
  const router = useRouter()
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<{ countryId: string; year: number; oil: number; gas: number; condensat: number | "" }>({ countryId: "", year: new Date().getFullYear(), oil: 0, gas: 0, condensat: "" })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { fetch("/api/countries?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setCountries(d) }) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    const res = await fetch("/api/production", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    if (res.ok) router.push("/admin/production")
    else { const d = await res.json(); setError(d.error || "Erreur") }
    setLoading(false)
  }

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/production" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
          <h1 className="text-2xl font-bold text-[#0D2840]">Add Production Record</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Country</label>
            <select value={form.countryId} onChange={e => setForm({...form, countryId: e.target.value})} required className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
              <option value="">-- Select --</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Year</label>
            <input type="number" min="2000" max="2030" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)||2024})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Oil production (kb/d)</label>
              <input type="number" step="0.1" value={form.oil} onChange={e => setForm({...form, oil: parseFloat(e.target.value)||0})} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Gas production (M m³/yr)</label>
              <input type="number" step="1" value={form.gas} onChange={e => setForm({...form, gas: parseFloat(e.target.value)||0})} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Condensate production (kb/d) <span className="text-[#A3C4DC]">optional</span></label>
              <input type="number" step="0.1" min="0" value={form.condensat} onChange={e => setForm({...form, condensat: e.target.value === "" ? "" : parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition">
              <Save size={18} />{loading ? "Saving..." : "Save"}
            </button>
            <Link href="/admin/production" className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition">Cancel</Link>
          </div>
        </form>
    </div>
  )
}
