"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Mail, Plus, Trash2, RefreshCw } from "lucide-react"

interface AllowedEmail {
  id: string
  email: string
  active: boolean
  notes?: string
  addedBy?: string
  createdAt: string
}

export default function AllowedEmailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries]   = useState<AllowedEmail[]>([])
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState("")
  const [showForm, setShowForm] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AllowedEmail | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const fetchEntries = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/allowed-emails")
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    if (session?.user.role === "admin") fetchEntries()
  }, [session])

  const notify = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(""), 4000) }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    setSubmitting(true)
    const res = await fetch("/api/admin/allowed-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), notes: newNotes.trim() || undefined }),
    })
    if (res.ok) {
      const entry = await res.json()
      setEntries(prev => [entry, ...prev])
      setNewEmail(""); setNewNotes(""); setShowForm(false)
      notify(`Added ${entry.email}`)
    } else {
      const d = await res.json()
      notify(`Error: ${d.error}`)
    }
    setSubmitting(false)
  }

  const handleToggle = async (entry: AllowedEmail) => {
    const res = await fetch(`/api/admin/allowed-emails/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !entry.active }),
    })
    if (res.ok) {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, active: !e.active } : e))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/admin/allowed-emails/${deleteTarget.id}`, { method: "DELETE" })
    if (res.ok) {
      setEntries(prev => prev.filter(e => e.id !== deleteTarget.id))
      notify(`Removed ${deleteTarget.email}`)
    } else {
      const d = await res.json()
      notify(`Error: ${d.error}`)
    }
    setDeleteTarget(null)
  }

  const active   = entries.filter(e => e.active).length
  const inactive = entries.filter(e => !e.active).length

  if (status === "loading") return <div className="pt-2 flex items-center justify-center text-[#0D2840]">Loading...</div>
  if (!session || !["admin", "editor"].includes(session.user.role as string)) return null

  return (
    <div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840] flex items-center gap-2">
              <Mail size={24} className="text-pink-400" /> Allowed Emails
            </h1>
            <p className="text-[#5B8FB9] text-sm mt-1">OTP login whitelist — when non-empty, only listed emails can authenticate</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchEntries} className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-3 py-2 rounded-lg text-sm transition">
              <RefreshCw size={15} />
            </button>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/30 px-3 py-2 rounded-lg text-sm transition">
              <Plus size={15} /> Add email
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total",    value: entries.length, color: "text-[#0D2840]" },
            { label: "Active",   value: active,         color: "text-green-700" },
            { label: "Inactive", value: inactive,        color: "text-[#5B8FB9]" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#D0E4F0] rounded-xl p-4">
              <p className="text-[#5B8FB9] text-xs">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-white border border-pink-300 rounded-xl p-4 mb-4">
            <h3 className="text-[#0D2840] font-medium mb-3">Add new allowed email</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="user@example.com" required
                className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-3 py-2 text-sm placeholder-[#A3C4DC] focus:outline-none focus:border-[#1B4F72]"
              />
              <input
                value={newNotes} onChange={e => setNewNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-3 py-2 text-sm placeholder-[#A3C4DC] focus:outline-none focus:border-[#1B4F72]"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button type="submit" disabled={submitting} className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-[#0D2840] px-4 py-2 rounded-lg text-sm transition">
                {submitting ? "Adding…" : "Add"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-2 rounded-lg text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D0E4F0] text-[#5B8FB9] text-xs uppercase">
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Active</th>
                <th className="text-left p-4">Notes</th>
                <th className="text-left p-4">Added by</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center text-[#5B8FB9] p-8">Loading…</td></tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <p className="text-[#5B8FB9] mb-1">No allowed emails configured.</p>
                    <p className="text-[#A3C4DC] text-xs">When this list is empty, all registered users can log in.</p>
                  </td>
                </tr>
              ) : entries.map(entry => (
                <tr key={entry.id} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB] transition">
                  <td className="p-4 text-[#0D2840] font-mono text-sm">{entry.email}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggle(entry)}
                      className={`relative w-11 h-6 rounded-full transition ${entry.active ? "bg-green-500" : "bg-gray-600"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${entry.active ? "left-5" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="p-4 text-[#5B8FB9] text-xs">{entry.notes ?? "—"}</td>
                  <td className="p-4 text-[#5B8FB9] text-xs">{entry.addedBy ?? "—"}</td>
                  <td className="p-4 text-[#5B8FB9] text-xs">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button onClick={() => setDeleteTarget(entry)} className="text-red-600 hover:text-red-300 transition">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D0E4F0] rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-[#0D2840] font-semibold mb-2">Remove email?</h2>
            <p className="text-[#5B8FB9] text-sm mb-4">
              Remove <span className="text-[#0D2840] font-mono">{deleteTarget.email}</span> from the whitelist?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-2 rounded-lg text-sm transition">
                Cancel
              </button>
              <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-[#0D2840] px-4 py-2 rounded-lg text-sm transition">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
