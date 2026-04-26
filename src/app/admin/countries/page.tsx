"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, FolderOpen, User, BarChart3 } from "lucide-react"
import { AdminTable } from "@/components/AdminTable"

interface Country {
  id: string
  code: string
  name: string
  region: string
  lat: number
  lon: number
  appoMember: boolean
  active: boolean
}

export default function CountriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchCountries()
    }
  }, [session])

  const fetchCountries = async () => {
    try {
      const res = await fetch("/api/countries?all=1")
      const data = await res.json()
      if (Array.isArray(data)) setCountries(data)
    } catch (error) {
      console.error("Failed to fetch countries:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/countries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !current }),
      })
      if (res.ok) {
        setCountries(prev => prev.map(c => c.id === id ? { ...c, active: !current } : c))
      }
    } catch (error) {
      console.error("Failed to toggle active:", error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all related data.`)) {
      return
    }

    try {
      const res = await fetch(`/api/countries/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCountries(countries.filter(c => c.id !== id))
      } else {
        alert("Failed to delete country")
      }
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  if (status === "loading" || loading) return null

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      searchable: true,
      className: 'text-[#1B4F72] font-mono'
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      searchable: true,
      className: 'text-[#0D2840]'
    },
    {
      key: 'region',
      label: 'Region',
      sortable: true,
      searchable: true,
      className: 'text-[#5B8FB9]'
    },
    {
      key: 'coordinates',
      label: 'Coordinates',
      sortable: false,
      render: (_: any, country: Country) => `${country.lat.toFixed(2)}, ${country.lon.toFixed(2)}`,
      className: 'text-[#5B8FB9] text-sm'
    },
    {
      key: 'appoMember',
      label: 'APPO',
      sortable: true,
      render: (appoMember: boolean) => appoMember ? (
        <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">Yes</span>
      ) : (
        <span className="bg-gray-500/20 text-[#5B8FB9] px-2 py-1 rounded text-xs">No</span>
      )
    },
    {
      key: 'active',
      label: 'Active',
      sortable: true,
      render: (active: boolean, country: Country) => (
        <div className="text-center">
          <button
            onClick={() => toggleActive(country.id, active)}
            title={active ? "Désactiver" : "Activer"}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              active ? "bg-[#1B4F72]" : "bg-[#EBF3FB]"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              active ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      ),
      className: 'text-center'
    }
  ]

  const actions = (country: Country) => (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/countries/${country.id}/profile`}
        className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"
        title="Profil pays & SNH"
      >
        <User size={16} />
      </Link>
      <Link
        href={`/admin/countries/${country.id}/economics`}
        className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"
        title="Données économiques"
      >
        <BarChart3 size={16} />
      </Link>
      <Link
        href={`/admin/countries/${country.id}/documents`}
        className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"
        title="Documents & Photos"
      >
        <FolderOpen size={16} />
      </Link>
      <Link
        href={`/admin/countries/${country.id}/edit`}
        className="p-2 text-[#5B8FB9] hover:text-[#1B4F72] transition"
      >
        <Edit size={16} />
      </Link>
      {session?.user.role === "admin" && (
        <button
          onClick={() => handleDelete(country.id, country.name)}
          className="p-2 text-[#5B8FB9] hover:text-red-600 transition"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]">

            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0D2840]">Countries</h1>
              <p className="text-[#5B8FB9]">{countries.length} countries</p>
            </div>
          </div>
          <Link
            href="/admin/countries/new"
            className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={18} />
            Add Country
          </Link>
        </div>

        <AdminTable
          data={countries}
          columns={columns}
          searchFields={['code', 'name', 'region']}
          actions={actions}
          loading={loading}
        />
    </div>
  )
}
