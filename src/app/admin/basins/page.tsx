"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Layers } from "lucide-react"

interface Basin {
  id: string
  basinId: string
  name: string
  type: string
  areaKm2: number | null
  lat: number
  lon: number
  country: { name: string; code: string }
}

export default function BasinsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [basins, setBasins] = useState<Basin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (session) fetch("/api/basins?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setBasins(d) }).finally(() => setLoading(false)) }, [session])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le bassin "${name}" ?`)) return
    const res = await fetch(`/api/basins/${id}`, { method: "DELETE" })
    if (res.ok) setBasins(basins.filter(b => b.id !== id))
    else alert("Échec de la suppression")
  }

  if (status === "loading") return null

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0D2840]">Basins / Fields</h1>
              <p className="text-[#5B8FB9]">{basins.length} basins</p>
            </div>
          </div>
          <Link href="/admin/basins/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
            <Plus size={18} /> Add Basin
          </Link>
        </div>
        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F4F7FB]">
              <tr>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">ID</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Country</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Type</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Area (km²)</th>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Coordinates</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {basins.map(b => (
                <tr key={b.id} className="border-t border-[#EBF3FB] hover:bg-[#F4F7FB]">
                  <td className="px-4 py-3 text-[#1B4F72] font-mono text-sm">{b.basinId}</td>
                  <td className="px-4 py-3 text-[#0D2840]">{b.name}</td>
                  <td className="px-4 py-3 text-[#5B8FB9]">{b.country?.name}</td>
                  <td className="px-4 py-3"><span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs">{b.type}</span></td>
                  <td className="px-4 py-3 text-[#5B8FB9] text-right">{b.areaKm2?.toLocaleString() ?? "—"}</td>
                  <td className="px-4 py-3 text-[#5B8FB9] text-sm">{b.lat.toFixed(2)}, {b.lon.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/basins/${b.id}`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition" title="Blocs, champs & docs"><Layers size={16} /></Link>
                      <Link href={`/admin/basins/${b.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
                      {session?.user.role === "admin" && (
                        <button onClick={() => handleDelete(b.id, b.name)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
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
