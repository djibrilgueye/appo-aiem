"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"
import { AdminTable } from "@/components/AdminTable"

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

  const columns = [
    {
      key: 'country',
      label: 'Country',
      sortable: true,
      searchable: true,
      render: (country: { name: string; code: string }) => (
        <span>
          {country?.name} <span className="text-[#A3C4DC] text-xs ml-1">{country?.code}</span>
        </span>
      ),
      className: 'text-[#0D2840]'
    },
    {
      key: 'year',
      label: 'Year',
      sortable: true,
      searchable: true,
      className: 'text-[#1B4F72] text-right font-mono'
    },
    {
      key: 'oil',
      label: 'Oil (kb/d)',
      sortable: true,
      render: (oil: number) => oil > 0 ? oil.toLocaleString() : "—",
      className: 'text-red-600 text-right font-mono'
    },
    {
      key: 'gas',
      label: 'Gas (M m³/yr)',
      sortable: true,
      render: (gas: number) => gas > 0 ? gas.toLocaleString() : "—",
      className: 'text-orange-400 text-right font-mono'
    }
  ]

  const actions = (p: Production) => (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/production/${p.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
      {session?.user.role === "admin" && (
        <button onClick={() => handleDelete(p.id)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
      )}
    </div>
  )

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

        <AdminTable
          data={productions}
          columns={columns}
          searchFields={['country.name', 'country.code', 'year']}
          actions={actions}
          loading={loading}
        />
    </div>
  )
}
