"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Layers } from "lucide-react"
import { AdminTable } from "@/components/AdminTable"

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

  const columns = [
    {
      key: 'basinId',
      label: 'ID',
      sortable: true,
      searchable: true,
      className: 'text-[#1B4F72] font-mono text-sm'
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      searchable: true,
      className: 'text-[#0D2840]'
    },
    {
      key: 'country.name',
      label: 'Country',
      sortable: true,
      searchable: true,
      render: (name: string) => name,
      className: 'text-[#5B8FB9]'
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      searchable: true,
      render: (type: string) => <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs">{type}</span>
    },
    {
      key: 'areaKm2',
      label: 'Area (km²)',
      sortable: true,
      render: (area: number | null) => area?.toLocaleString() ?? "—",
      className: 'text-[#5B8FB9] text-right'
    },
    {
      key: 'coordinates',
      label: 'Coordinates',
      sortable: false,
      render: (_: any, basin: Basin) => `${basin.lat.toFixed(2)}, ${basin.lon.toFixed(2)}`,
      className: 'text-[#5B8FB9] text-sm'
    }
  ]

  const actions = (basin: Basin) => (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/basins/${basin.id}`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition" title="Blocs, champs & docs"><Layers size={16} /></Link>
      <Link href={`/admin/basins/${basin.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
      {session?.user.role === "admin" && (
        <button onClick={() => handleDelete(basin.id, basin.name)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
      )}
    </div>
  )

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

        <AdminTable
          data={basins}
          columns={columns}
          searchFields={['basinId', 'name', 'country.name', 'type']}
          actions={actions}
          loading={loading}
        />
    </div>
  )
}
