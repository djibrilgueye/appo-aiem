"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"
import { AdminTable } from "@/components/AdminTable"

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

  const columns = [
    {
      key: 'centerId',
      label: 'ID',
      sortable: true,
      searchable: true,
      className: 'text-[#1B4F72] font-mono text-sm'
    },
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      searchable: true,
      className: 'text-[#0D2840]'
    },
    {
      key: 'country',
      label: 'Pays',
      sortable: true,
      searchable: true,
      render: (country: { name: string }) => country?.name,
      className: 'text-[#5B8FB9]'
    },
    {
      key: 'focus',
      label: 'Domaine (focus)',
      sortable: true,
      searchable: true,
      className: 'text-[#5B8FB9] text-sm max-w-xs truncate'
    },
    {
      key: 'year',
      label: 'Année',
      sortable: true,
      render: (year: number | null) => year ?? "—",
      className: 'text-[#5B8FB9] text-right'
    }
  ]

  const actions = (r: RnDRecord) => (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/rnd/${r.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
      {session?.user.role === "admin" && (
        <button onClick={() => handleDelete(r.id, r.name)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
      )}
    </div>
  )

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

      <AdminTable
        data={records}
        columns={columns}
        searchFields={['centerId', 'name', 'country.name', 'focus']}
        actions={actions}
        loading={loading}
      />
    </div>
  )
}
