"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"
import { AdminTable } from "@/components/AdminTable"

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

  const columns = [
    {
      key: 'pipelineId',
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
      className: 'text-[#0D2840] max-w-[200px] truncate'
    },
    {
      key: 'countries',
      label: 'Countries',
      sortable: false,
      searchable: true,
      render: (countries: string) => {
        const parsed = Array.isArray(countries) ? countries : JSON.parse(countries || "[]")
        return parsed.join(", ")
      },
      className: 'text-[#5B8FB9] text-sm'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      searchable: true,
      render: (status: string) => (
        <span className={`px-2 py-0.5 rounded text-xs capitalize ${STATUS_COLORS[status] || "bg-gray-500/20 text-[#5B8FB9]"}`}>
          {status}
        </span>
      )
    },
    {
      key: 'lengthKm',
      label: 'Length (km)',
      sortable: true,
      render: (length: number | null) => length?.toLocaleString() ?? "—",
      className: 'text-[#5B8FB9] text-right'
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      searchable: true,
      className: 'text-[#5B8FB9] text-sm'
    }
  ]

  const actions = (p: Pipeline) => (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/pipelines/${p.id}/edit`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
      {session?.user.role === "admin" && (
        <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
      )}
    </div>
  )

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

        <AdminTable
          data={pipelines}
          columns={columns}
          searchFields={['pipelineId', 'name', 'countries', 'status', 'capacity']}
          actions={actions}
          loading={loading}
        />
    </div>
  )
}
