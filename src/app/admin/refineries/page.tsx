"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"

interface Refinery {
  id: string
  refineryId: string
  name: string
  capacityKbd: number
  status: string
  year: number | null
  lat: number
  lon: number
  country: { name: string; code: string }
}

const STATUS_COLORS: Record<string, string> = {
  operational: "bg-green-50 text-green-700",
  "under construction": "bg-yellow-500/20 text-yellow-400",
  proposed: "bg-blue-500/20 text-blue-400",
  idle: "bg-gray-500/20 text-[#5B8FB9]",
  decommissioned: "bg-red-50 text-red-600",
}

export default function RefineriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [refineries, setRefineries] = useState<Refinery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (session) fetch("/api/refineries?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setRefineries(d) }).finally(() => setLoading(false)) }, [session])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer la raffinerie "${name}" ?`)) return
    const res = await fetch(`/api/refineries/${id}`, { method: "DELETE" })
    if (res.ok) setRefineries(refineries.filter(r => r.id !== id))
    else alert("Échec de la suppression")
  }

  if (status === "loading") return null

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0D2840]">Refineries</h1>
              <p className="text-[#5B8FB9]">{refineries.length} refineries</p>
            </div>
          </div>
          <Link href="/admin/refineries/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
            <Plus size={18} /> Add Refinery
          </Link>
        </div>
        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F4F7FB]">
              <tr>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">ID</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Country</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Capacity (kb/d)</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Year</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refineries.map(r => (
                <tr key={r.id} className="border-t border-[#EBF3FB] hover:bg-[#F4F7FB]">
                  <td className="px-4 py-3 text-[#1B4F72] font-mono text-sm">{r.refineryId}</td>
                  <td className="px-4 py-3 text-[#0D2840]">{r.name}</td>
                  <td className="px-4 py-3 text-[#5B8FB9]">{r.country?.name}</td>
                  <td className="px-4 py-3 text-[#0D2840] text-right font-mono">{r.capacityKbd.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs capitalize ${STATUS_COLORS[r.status] || "bg-gray-500/20 text-[#5B8FB9]"}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-[#5B8FB9] text-right">{r.year ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/refineries/${r.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
                      {session?.user.role === "admin" && (
                        <button onClick={() => handleDelete(r.id, r.name)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  )
}
