"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Save, Mail } from "lucide-react"
import { useLanguage } from "@/i18n/LanguageContext"

export default function NewUserPage() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", email: "", role: "user" })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") return null
  if (!session || session.user.role !== "admin") {
    return <div className="text-[#0D2840]">{t.admin.common.accessDenied}</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError("")
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erreur lors de la création")
      setLoading(false)
      return
    }
    // The user was created but the invitation email couldn't be sent —
    // surface it so the admin knows to communicate the login flow manually
    // instead of assuming the invitee will receive an email.
    if (data.invitationSent === false) {
      alert(t.admin.users.invitationFailed)
    }
    router.push("/admin/users")
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users" className="text-[#5B8FB9] hover:text-[#1B4F72]"></Link>
        <h1 className="text-2xl font-bold text-[#0D2840]">{t.admin.users.addTitle}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D0E4F0] rounded-xl p-6 space-y-4 max-w-2xl">
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded">{error}</div>}

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
            className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
          >
            <option value="user">user — lecture seule</option>
            <option value="editor">{t.admin.users.roleEditor}</option>
            <option value="admin">{t.admin.users.roleAdmin}</option>
          </select>
        </div>

        <div className="bg-[#EBF3FB] border-l-4 border-[#1B4F72] px-4 py-3 rounded text-sm text-[#0D2840] flex gap-3 items-start">
          <Mail size={16} className="text-[#1B4F72] mt-0.5 shrink-0" />
          <div>
            Un email de notification (bilingue FR / EN) sera envoyé à l'utilisateur.
            Il se connectera depuis la page de login en saisissant son email — un code OTP à usage unique
            lui sera alors envoyé.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            <Save size={16} />
            {loading ? "Création..." : "Créer & envoyer la notification"}
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
