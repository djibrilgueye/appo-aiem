"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

const STATUSES = ["operational", "under construction", "proposed", "offline", "concept"]

export default function EditPipelinePage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    pipelineId: "", name: "", countries: "", status: "operational",
    lengthKm: "", diametre: "", capacity: "", coords: ""
  })

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])

  useEffect(() => {
    if (!id) return
    fetch(`/api/pipelines/${id}`)
      .then(r => r.json())
      .then(d => {
        setForm({
          pipelineId: d.pipelineId || "",
          name: d.name || "",
          countries: Array.isArray(d.countries) ? d.countries.join(",") : "",
          status: d.status || "operational",
          lengthKm: d.lengthKm != null ? String(d.lengthKm) : "",
          diametre: d.diametre || "",
          capacity: d.capacity || "",
          coords: Array.isArray(d.coords) ? d.coords.map((p: number[]) => p.join(",")).join("|") : "",
        })
        setFetching(false)
      })
      .catch(() => { setError("Failed to load pipeline"); setFetching(false) })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    let coordsParsed: number[][]
    let countriesParsed: string[]
    try {
      countriesParsed = form.countries.split(",").map(s => s.trim().toUpperCase()).filter(Boolean)
      coordsParsed = form.coords.split("|").map(pair => {
        const [lat, lon] = pair.split(",").map(Number)
        return [lat, lon]
      })
    } catch {
      setError("Format coords invalide. Utilisez: lat,lon|lat,lon|...")
      setLoading(false); return
    }
    const body = {
      pipelineId: form.pipelineId, name: form.name, status: form.status,
      countries: countriesParsed, coords: coordsParsed,
      lengthKm: form.lengthKm ? parseInt(form.lengthKm) : undefined,
      diametre: form.diametre || undefined,
      capacity: form.capacity || undefined,
    }
    const res = await fetch(`/api/pipelines/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) router.push("/admin/pipelines")
    else { const d = await res.json(); setError(JSON.stringify(d.error) || "Erreur") }
    setLoading(false)
  }

  if (fetching) return null

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/pipelines" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
          <h1 className="text-2xl font-bold text-[#0D2840]">Edit Pipeline</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Pipeline ID <span className="text-[#A3C4DC] text-xs">(ex. PIP011)</span></label>
              <input value={form.pipelineId} onChange={e => setForm({...form, pipelineId: e.target.value})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-white border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Countries <span className="text-[#A3C4DC] text-xs">codes ISO séparés par virgule (ex. NGA,BEN,GHA)</span></label>
            <input value={form.countries} onChange={e => setForm({...form, countries: e.target.value})} required placeholder="NGA,BEN,GHA" className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Coordinates <span className="text-[#A3C4DC] text-xs">lat,lon|lat,lon|... (point par point du tracé)</span></label>
            <textarea value={form.coords} onChange={e => setForm({...form, coords: e.target.value})} required rows={3} placeholder="6.43,3.38|6.36,2.39|4.91,-1.75" className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72] font-mono text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Length (km) <span className="text-[#A3C4DC] text-xs">optionnel</span></label>
              <input type="number" value={form.lengthKm} onChange={e => setForm({...form, lengthKm: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Diamètre <span className="text-[#A3C4DC] text-xs">ex. 48 pouces</span></label>
              <input value={form.diametre} onChange={e => setForm({...form, diametre: e.target.value})} placeholder='ex. 48"' className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Capacity <span className="text-[#A3C4DC] text-xs">ex. 5 bcm/yr</span></label>
              <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition">
              <Save size={18} />{loading ? "Saving..." : "Save"}
            </button>
            <Link href="/admin/pipelines" className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition">Cancel</Link>
          </div>
        </form>
    </div>
  )
}
