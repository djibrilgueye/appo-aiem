"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"

const REGIONS = ["North Africa", "West Africa", "Central Africa", "East Africa", "Southern Africa"]

export default function NewCountryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    region: "North Africa",
    lat: 0,
    lon: 0,
    appoMember: false,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push("/admin/countries")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to create country")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div>
        <div className="text-[#0D2840]">Loading...</div>
      </div>
    )
  }

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/countries" className="text-[#5B8FB9] hover:text-[#1B4F72]">

          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840]">Add Country</h1>
            <p className="text-[#5B8FB9]">Create a new country entry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Country Code (3 letters)</label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={3}
                className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                required
              />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[#1B4F72] text-sm mb-1">Region</label>
            <select
              value={formData.region}
              onChange={e => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
            >
              {REGIONS.map(region => (
                <option key={region} value={region} className="bg-white">
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Latitude</label>
              <input
                type="number"
                step="0.01"
                value={formData.lat}
                onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                required
              />
            </div>
            <div>
              <label className="block text-[#1B4F72] text-sm mb-1">Longitude</label>
              <input
                type="number"
                step="0.01"
                value={formData.lon}
                onChange={e => setFormData({ ...formData, lon: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.appoMember}
                onChange={e => setFormData({ ...formData, appoMember: e.target.checked })}
                className="accent-[#1B4F72] w-4 h-4"
              />
              <span className="text-[#0D2840]">APPO Member</span>
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:bg-[#1B4F72]/50 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Country"}
            </button>
            <Link
              href="/admin/countries"
              className="px-6 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition"
            >
              Cancel
            </Link>
          </div>
        </form>
    </div>
  )
}
