"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"

interface StorageRecord {
  id: string
  storageId: string
  name: string
  type: string
  lngSubtype: string | null
  capacityMb: number
  status: string
  lat: number
  lon: number
  country: { name: string; code: string }
}

const STATUS_COLORS: Record<string, string> = {
  operational: "bg-green-50 text-green-700",
  "under construction": "bg-blue-500/20 text-blue-600",
  planned: "bg-amber-500/20 text-amber-700",
  closed: "bg-red-50 text-red-600",
}

export default function StoragePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<StorageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => {
    if (session) {
      fetch("/api/storage").then(r => r.json()).then(d => { if (Array.isArray(d)) setRecords(d) }).finally(() => setLoading(false))
    }
  }, [session])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le dépôt/stockage "${name}" ?`)) return
    const res = await fetch(`/api/storage/${id}`, { method: "DELETE" })
    if (res.ok) setRecords(records.filter(r => r.id !== id))
    else alert("Échec de la suppression")
  }

  if (status === "loading") return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840]">Stockage & Dépôts</h1>
            <p className="text-[#5B8FB9]">{records.length} enregistrement{records.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link href="/admin/storage/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Nouveau
        </Link>
      </div>
      <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F4F7FB]">
            <tr>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">ID</th>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Nom</th>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Pays</th>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Type</th>
              <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Capacité (Mb)</th>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Statut</th>
              <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#5B8FB9]">Chargement...</td></tr>
            )}
            {!loading && records.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#5B8FB9]">Aucun dépôt/stockage enregistré.</td></tr>
            )}
            {records.map(r => (
              <tr key={r.id} className="border-t border-[#EBF3FB] hover:bg-[#F4F7FB]">
                <td className="px-4 py-3 text-[#1B4F72] font-mono text-sm">{r.storageId}</td>
                <td className="px-4 py-3 text-[#0D2840]">{r.name}</td>
                <td className="px-4 py-3 text-[#5B8FB9]">{r.country?.name}</td>
                <td className="px-4 py-3 text-[#5B8FB9] text-sm">{r.type}{r.lngSubtype ? ` — ${r.lngSubtype}` : ""}</td>
                <td className="px-4 py-3 text-[#0D2840] text-right font-mono">{r.capacityMb.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs capitalize ${STATUS_COLORS[r.status] || "bg-gray-500/20 text-[#5B8FB9]"}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/storage/${r.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
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
