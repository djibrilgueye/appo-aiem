"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"

interface Pipeline {
  id: string
  pipelineId: string
  name: string
  countries: string
  status: string
  lengthKm: number | null
  capacity: string | null
}

const STATUS_COLORS: Record<string, string> = {
  operational: "bg-green-50 text-green-700",
  "under construction": "bg-yellow-500/20 text-yellow-400",
  proposed: "bg-blue-500/20 text-blue-400",
  offline: "bg-gray-500/20 text-[#5B8FB9]",
  concept: "bg-purple-500/20 text-purple-400",
}

export default function PipelinesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => {
    if (session) fetch("/api/pipelines").then(r => r.json()).then(d => { if (Array.isArray(d)) setPipelines(d) }).finally(() => setLoading(false))
  }, [session])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le pipeline "${name}" ?`)) return
    const res = await fetch(`/api/pipelines/${id}`, { method: "DELETE" })
    if (res.ok) setPipelines(pipelines.filter(p => p.id !== id))
    else alert("Échec de la suppression")
  }

  if (status === "loading") return null

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0D2840]">Pipelines</h1>
              <p className="text-[#5B8FB9]">{pipelines.length} pipelines</p>
            </div>
          </div>
          <Link href="/admin/pipelines/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
            <Plus size={18} /> Add Pipeline
          </Link>
        </div>
        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F4F7FB]">
              <tr>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">ID</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Countries</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Length (km)</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Capacity</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map(p => {
                const countries = Array.isArray(p.countries) ? p.countries : JSON.parse(p.countries || "[]")
                return (
                  <tr key={p.id} className="border-t border-[#EBF3FB] hover:bg-[#F4F7FB]">
                    <td className="px-4 py-3 text-[#1B4F72] font-mono text-sm">{p.pipelineId}</td>
                    <td className="px-4 py-3 text-[#0D2840] max-w-[200px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-[#5B8FB9] text-sm">{countries.join(", ")}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs capitalize ${STATUS_COLORS[p.status] || "bg-gray-500/20 text-[#5B8FB9]"}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-[#5B8FB9] text-right">{p.lengthKm?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-3 text-[#5B8FB9] text-sm">{p.capacity ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/pipelines/${p.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
                        {session?.user.role === "admin" && (
                          <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
    </div>
  )
}
