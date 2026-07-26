"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Save } from "lucide-react"
import { useLanguage } from "@/i18n/LanguageContext"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  active: boolean
  createdAt: string
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", email: "", role: "user", active: true })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch(`/api/admin/users/${id}`)
      .then(async r => {
        if (r.status === 404) throw new Error("Utilisateur introuvable")
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<User>
      })
      .then(u => setForm({ name: u.name ?? "", email: u.email, role: u.role, active: u.active }))
      .catch(err => setError(err?.message ?? "Erreur de chargement"))
      .finally(() => setFetching(false))
  }, [session, id])

  if (status === "loading" || fetching) return null
  if (!session || session.user.role !== "admin") {
    return <div className="text-[#0D2840]">{t.admin.common.accessDenied}</div>
  }

  const isSelf = session.user.id === id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError("")
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erreur lors de la modification")
      setLoading(false)
      return
    }
    router.push("/admin/users")
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
        <h1 className="text-2xl font-bold text-[#0D2840]">{t.admin.users.editTitle}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4 max-w-2xl">
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}
        {isSelf && (
          <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-2 rounded text-sm text-amber-800">
            C'est votre propre compte — vous ne pouvez ni vous rétrograder ni vous désactiver.
          </div>
        )}

        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">{t.admin.common.fullName}</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
          />
        </div>

        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
          />
        </div>

        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">{t.admin.common.role}</label>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            required
            disabled={isSelf}
            className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72] disabled:opacity-60"
          >
            <option value="user">user — lecture seule</option>
            <option value="editor">{t.admin.users.roleEditor}</option>
            <option value="admin">{t.admin.users.roleAdmin}</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="active"
            type="checkbox"
            checked={form.active}
            onChange={e => setForm({ ...form, active: e.target.checked })}
            disabled={isSelf}
            className="w-4 h-4 disabled:opacity-60"
          />
          <label htmlFor="active" className="text-[#0D2840] text-sm">
            {t.admin.countries.activeCountry.replace('Pays actif','Compte actif')} {isSelf && <span className="text-[#A3C4DC]">{t.admin.common.locked}</span>}
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            <Save size={16} />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
          <Link
            href="/admin/users"
            className="px-4 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg hover:bg-[#EBF3FB] transition"
          >
            {t.admin.common.cancel}
          </Link>
        </div>
      </form>
    </div>
  )
}
