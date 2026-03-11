"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Users, Trash2, RefreshCw } from "lucide-react"

interface AdminUser {
  id: string
  name?: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  admin:  "bg-violet-500/20 text-violet-400 border border-violet-500/30",
  editor: "bg-[#EBF3FB] text-[#1B4F72] border border-[#A3C4DC]",
  user:   "bg-gray-500/20 text-[#5B8FB9] border border-gray-500/30",
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers]         = useState<AdminUser[]>([])
  const [loading, setLoading]     = useState(false)
  const [message, setMessage]     = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/users")
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    if (session?.user.role === "admin") fetchUsers()
  }, [session])

  const notify = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(""), 4000) }

  const handleRoleChange = async (user: AdminUser, role: string) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role } : u))
      notify(`Role updated for ${user.email}`)
    } else {
      const d = await res.json()
      notify(`Error: ${d.error}`)
    }
  }

  const handleToggleActive = async (user: AdminUser) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u))
      notify(`${user.email} ${!user.active ? "activated" : "deactivated"}`)
    } else {
      const d = await res.json()
      notify(`Error: ${d.error}`)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      notify(`Deleted ${deleteTarget.email}`)
    } else {
      const d = await res.json()
      notify(`Error: ${d.error}`)
    }
    setDeleteTarget(null)
  }

  const initials = (name?: string, email?: string) => {
    if (name) return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    return (email ?? "?")[0].toUpperCase()
  }

  if (status === "loading") return <div className="pt-2 flex items-center justify-center text-[#0D2840]">Loading...</div>
  if (!session || !["admin", "editor"].includes(session.user.role as string)) return null

  return (
    <div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840] flex items-center gap-2">
              <Users size={24} className="text-teal-400" /> User Management
            </h1>
            <p className="text-[#5B8FB9] text-sm mt-1">{users.length} registered user(s)</p>
          </div>
          <button onClick={fetchUsers} className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-3 py-2 rounded-lg text-sm transition">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        )}

        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D0E4F0] text-[#5B8FB9] text-xs uppercase">
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Active</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-left p-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center text-[#5B8FB9] p-8">Loading…</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EBF3FB] text-[#1B4F72] flex items-center justify-center font-bold text-sm shrink-0">
                          {initials(user.name, user.email)}
                        </div>
                        <div>
                          <p className="text-[#0D2840] font-medium">{user.name ?? "—"}</p>
                          <p className="text-[#5B8FB9] text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.id === session.user.id ? (
                        <span className={`px-2 py-1 rounded text-xs ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user, e.target.value)}
                          className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1B4F72]"
                        >
                          <option value="admin">admin</option>
                          <option value="editor">editor</option>
                          <option value="user">user</option>
                        </select>
                      )}
                    </td>
                    <td className="p-4">
                      {user.id === session.user.id ? (
                        <span className="text-green-700 text-xs">active</span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`relative w-11 h-6 rounded-full transition ${user.active ? "bg-green-500" : "bg-gray-600"}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${user.active ? "left-5" : "left-0.5"}`} />
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-[#5B8FB9] text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {user.id !== session.user.id && (
                        <button onClick={() => setDeleteTarget(user)} className="text-red-600 hover:text-red-300 transition">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D0E4F0] rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-[#0D2840] font-semibold mb-2">Delete user?</h2>
            <p className="text-[#5B8FB9] text-sm mb-4">
              This will permanently delete <span className="text-[#0D2840]">{deleteTarget.email}</span> and all their sessions.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-2 rounded-lg text-sm transition">
                Cancel
              </button>
              <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-[#0D2840] px-4 py-2 rounded-lg text-sm transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
