"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"

interface Production {
  id: string
  year: number
  oil: number
  gas: number
  country: { name: string; code: string }
}

export default function ProductionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (session) fetch("/api/production?all=1").then(r => r.json()).then(d => { if (Array.isArray(d)) setProductions(d) }).finally(() => setLoading(false)) }, [session])

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée de production ?")) return
    const res = await fetch(`/api/production/${id}`, { method: "DELETE" })
    if (res.ok) setProductions(productions.filter(p => p.id !== id))
    else alert("Échec de la suppression")
  }

  if (status === "loading") return null

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0D2840]">Oil & Gas Production</h1>
              <p className="text-[#5B8FB9]">{productions.length} records</p>
            </div>
          </div>
          <Link href="/admin/production/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
            <Plus size={18} /> Add Record
          </Link>
        </div>
        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F4F7FB]">
              <tr>
                <th className="text-left text-[#1B4F72] px-4 py-3 text-sm font-medium">Country</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Year</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Oil (kb/d)</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Gas (M m³/yr)</th>
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productions.map(p => (
                <tr key={p.id} className="border-t border-[#EBF3FB] hover:bg-[#F4F7FB]">
                  <td className="px-4 py-3 text-[#0D2840]">{p.country?.name} <span className="text-[#A3C4DC] text-xs ml-1">{p.country?.code}</span></td>
                  <td className="px-4 py-3 text-[#1B4F72] text-right font-mono">{p.year}</td>
                  <td className="px-4 py-3 text-red-600 text-right font-mono">{p.oil > 0 ? p.oil.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-orange-400 text-right font-mono">{p.gas > 0 ? p.gas.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/production/${p.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
                      {session?.user.role === "admin" && (
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
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
