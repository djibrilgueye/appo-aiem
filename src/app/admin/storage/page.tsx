"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"
import { AdminTable } from "@/components/AdminTable"

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

  const columns = [
    {
      key: 'storageId',
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
      key: 'type',
      label: 'Type',
      sortable: true,
      searchable: true,
      render: (_: any, r: StorageRecord) => `${r.type}${r.lngSubtype ? ` — ${r.lngSubtype}` : ""}`,
      className: 'text-[#5B8FB9] text-sm'
    },
    {
      key: 'capacityMb',
      label: 'Capacité (Mb)',
      sortable: true,
      render: (capacity: number) => capacity.toLocaleString(),
      className: 'text-[#0D2840] text-right font-mono'
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      searchable: true,
      render: (status: string) => (
        <span className={`px-2 py-0.5 rounded text-xs capitalize ${STATUS_COLORS[status] || "bg-gray-500/20 text-[#5B8FB9]"}`}>
          {status}
        </span>
      )
    }
  ]

  const actions = (r: StorageRecord) => (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/storage/${r.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
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
            <h1 className="text-2xl font-bold text-[#0D2840]">Stockage</h1>
            <p className="text-[#5B8FB9]">{records.length} dépôt{records.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link href="/admin/storage/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Nouveau
        </Link>
      </div>

      <AdminTable
        data={records}
        columns={columns}
        searchFields={['storageId', 'name', 'country.name', 'type', 'lngSubtype', 'status']}
        actions={actions}
        loading={loading}
      />
    </div>
  )
}
