"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"

interface RnDRecord {
  id: string
  centerId: string
  name: string
  focus: string
  year: number | null
  lat: number
  lon: number
  country: { name: string; code: string }
}

export default function RnDPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<RnDRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => {
    if (session) {
      fetch("/api/rnd").then(r => r.json()).then(d => { if (Array.isArray(d)) setRecords(d) }).finally(() => setLoading(false))
    }
  }, [session])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le centre R&D "${name}" ?`)) return
    const res = await fetch(`/api/rnd/${id}`, { method: "DELETE" })
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
            <h1 className="text-2xl font-bold text-[#0D2840]">Centres R&D</h1>
            <p className="text-[#5B8FB9]">{records.length} centre{records.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link href="/admin/rnd/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Nouveau centre
        </Link>
      </div>
      <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F4F7FB]">
            <tr>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">ID</th>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Nom</th>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Pays</th>
              <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Domaine (focus)</th>
              <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Année</th>
              <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#5B8FB9]">Chargement...</td></tr>
            )}
            {!loading && records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#5B8FB9]">Aucun centre R&D enregistré.</td></tr>
            )}
            {records.map(r => (
              <tr key={r.id} className="border-t border-[#EBF3FB] hover:bg-[#F4F7FB]">
                <td className="px-4 py-3 text-[#1B4F72] font-mono text-sm">{r.centerId}</td>
                <td className="px-4 py-3 text-[#0D2840]">{r.name}</td>
                <td className="px-4 py-3 text-[#5B8FB9]">{r.country?.name}</td>
                <td className="px-4 py-3 text-[#5B8FB9] text-sm max-w-xs truncate">{r.focus}</td>
                <td className="px-4 py-3 text-[#5B8FB9] text-right">{r.year ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/rnd/${r.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
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
