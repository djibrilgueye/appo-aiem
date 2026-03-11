"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"

interface Reserve {
  id: string
  year: number
  oil: number
  gas: number
  country: { name: string; code: string }
}

export default function ReservesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reserves, setReserves] = useState<Reserve[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (session) fetch("/api/reserves?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setReserves(d) }).finally(() => setLoading(false)) }, [session])

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée de réserves ?")) return
    const res = await fetch(`/api/reserves/${id}`, { method: "DELETE" })
    if (res.ok) setReserves(reserves.filter(r => r.id !== id))
    else alert("Échec de la suppression")
  }

  if (status === "loading") return null

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0D2840]">Proven Reserves</h1>
              <p className="text-[#5B8FB9]">{reserves.length} records</p>
            </div>
          </div>
          <Link href="/admin/reserves/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
            <Plus size={18} /> Add Record
          </Link>
        </div>
        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F4F7FB]">
              <tr>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Country</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Year</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Oil (Gbbl)</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Gas (Tcf)</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reserves.map(r => (
                <tr key={r.id} className="border-t border-[#EBF3FB] hover:bg-[#F4F7FB]">
                  <td className="px-4 py-3 text-[#0D2840]">{r.country?.name} <span className="text-[#A3C4DC] text-xs ml-1">{r.country?.code}</span></td>
                  <td className="px-4 py-3 text-[#1B4F72] text-right font-mono">{r.year}</td>
                  <td className="px-4 py-3 text-green-700 text-right font-mono">{r.oil > 0 ? r.oil.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-blue-400 text-right font-mono">{r.gas > 0 ? r.gas.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/reserves/${r.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
                      {session?.user.role === "admin" && (
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
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
