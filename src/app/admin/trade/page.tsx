"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"
import { AdminTable } from "@/components/AdminTable"

interface TradeRecord {
  id: string
  direction: "Import" | "Export"
  countryId: string
  year: number
  oilIntraKbD: number
  oilExtraKbD: number
  gasIntraBcm: number
  gasExtraBcm: number
  country: { name: string; code: string }
}

export default function TradePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<TradeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])

  useEffect(() => {
    if (!session) return
    Promise.all([
      fetch("/api/trade/imports").then(r => r.json()),
      fetch("/api/trade/exports").then(r => r.json()),
    ]).then(([imports, exports]) => {
      const combined: TradeRecord[] = [
        ...(Array.isArray(imports) ? imports.map((i: TradeRecord) => ({ ...i, direction: "Import" as const })) : []),
        ...(Array.isArray(exports) ? exports.map((e: TradeRecord) => ({ ...e, direction: "Export" as const })) : []),
      ]
      combined.sort((a, b) => b.year - a.year || a.country?.name.localeCompare(b.country?.name || "") || 0)
      setRecords(combined)
    }).finally(() => setLoading(false))
  }, [session])

  const handleDelete = async (id: string, direction: "Import" | "Export") => {
    if (!confirm(`Supprimer cet enregistrement de commerce ?`)) return
    const endpoint = direction === "Import" ? `/api/trade/imports/${id}` : `/api/trade/exports/${id}`
    const res = await fetch(endpoint, { method: "DELETE" })
    if (res.ok) setRecords(records.filter(r => r.id !== id))
    else alert("Échec de la suppression")
  }

  if (status === "loading") return null

  const columns = [
    {
      key: 'country',
      label: 'Pays',
      sortable: true,
      searchable: true,
      render: (country: { name: string }) => country?.name,
      className: 'text-[#0D2840]'
    },
    {
      key: 'year',
      label: 'Année',
      sortable: true,
      searchable: true,
      className: 'text-[#5B8FB9] text-right font-mono'
    },
    {
      key: 'direction',
      label: 'Direction',
      sortable: true,
      searchable: true,
      render: (direction: string) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${direction === "Import" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
          {direction}
        </span>
      )
    },
    {
      key: 'oilIntraKbD',
      label: 'Pétrole intra (kb/d)',
      sortable: true,
      render: (value: number) => value > 0 ? value.toFixed(1) : "—",
      className: 'text-[#0D2840] text-right font-mono text-sm'
    },
    {
      key: 'oilExtraKbD',
      label: 'Pétrole extra (kb/d)',
      sortable: true,
      render: (value: number) => value > 0 ? value.toFixed(1) : "—",
      className: 'text-[#0D2840] text-right font-mono text-sm'
    },
    {
      key: 'gasIntraBcm',
      label: 'Gaz intra (bcm)',
      sortable: true,
      render: (value: number) => value > 0 ? value.toFixed(2) : "—",
      className: 'text-[#0D2840] text-right font-mono text-sm'
    },
    {
      key: 'gasExtraBcm',
      label: 'Gaz extra (bcm)',
      sortable: true,
      render: (value: number) => value > 0 ? value.toFixed(2) : "—",
      className: 'text-[#0D2840] text-right font-mono text-sm'
    }
  ]

  const actions = (r: TradeRecord) => (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/trade/${r.id}/edit?dir=${r.direction.toLowerCase()}`} className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"><Edit size={16} /></Link>
      {session?.user.role === "admin" && (
        <button onClick={() => handleDelete(r.id, r.direction)} className="p-2 text-[#5B8FB9] hover:text-red-600 transition"><Trash2 size={16} /></button>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840]">Commerce (Imports / Exports)</h1>
            <p className="text-[#5B8FB9]">{records.length} enregistrement{records.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link href="/admin/trade/new" className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Nouvel enregistrement
        </Link>
      </div>

      <AdminTable
        data={records}
        columns={columns}
        searchFields={['country.name', 'year', 'direction']}
        actions={actions}
        loading={loading}
      />
    </div>
  )
}
