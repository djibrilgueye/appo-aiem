"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Shield, Download, Trash2, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react"

interface AuditLog {
  id: string
  userId?: string
  userName?: string
  userEmail?: string
  userRole?: string
  action: string
  entity: string
  entityId?: string
  description: string
  changes?: string
  metadata?: string
  ipAddress?: string
  status: string
  timestamp: string
}

interface Stats {
  total: number
  success: number
  failure: number
  error: number
  distinctUsers: number
  byAction: Record<string, number>
  byEntity: Record<string, number>
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700",
  UPDATE: "bg-blue-500/20 text-blue-400",
  DELETE: "bg-red-50 text-red-600",
  LOGIN:  "bg-purple-500/20 text-purple-400",
  LOGOUT: "bg-gray-500/20 text-[#5B8FB9]",
  ACCESS: "bg-yellow-500/20 text-yellow-400",
  EXPORT: "bg-[#EBF3FB] text-[#1B4F72]",
  IMPORT: "bg-orange-500/20 text-orange-400",
}

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-50 text-green-700",
  failure: "bg-yellow-500/20 text-yellow-400",
  error:   "bg-red-50 text-red-600",
}

const ACTIONS  = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "ACCESS", "EXPORT", "IMPORT"]
const ENTITIES = ["User", "Country", "Basin", "Refinery", "Pipeline", "Reserve", "Production", "AllowedEmail", "System"]

export default function AuditLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [logs, setLogs]       = useState<AuditLog[]>([])
  const [stats, setStats]     = useState<Stats | null>(null)
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<AuditLog | null>(null)

  // Filters
  const [filterAction, setFilterAction] = useState("")
  const [filterEntity, setFilterEntity] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterFrom,   setFilterFrom]   = useState("")
  const [filterTo,     setFilterTo]     = useState("")
  const [filterQ,      setFilterQ]      = useState("")

  // Cleanup
  const [cleanupMsg, setCleanupMsg] = useState("")
  const [cleaning, setCleaning]     = useState(false)

  const LIMIT = 50

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/audit-logs/stats")
    if (res.ok) setStats(await res.json())
  }, [])

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (filterAction) params.set("action", filterAction)
    if (filterEntity) params.set("entity", filterEntity)
    if (filterStatus) params.set("status", filterStatus)
    if (filterFrom)   params.set("from", filterFrom)
    if (filterTo)     params.set("to", filterTo)
    if (filterQ)      params.set("q", filterQ)
    const res = await fetch(`/api/admin/audit-logs?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    }
    setLoading(false)
  }, [filterAction, filterEntity, filterStatus, filterFrom, filterTo, filterQ])

  useEffect(() => {
    if (session?.user.role === "admin") {
      fetchStats()
      fetchLogs(1)
    }
  }, [session, fetchStats, fetchLogs])

  const handleSearch = () => { setPage(1); fetchLogs(1) }
  const handleReset  = () => {
    setFilterAction(""); setFilterEntity(""); setFilterStatus("")
    setFilterFrom(""); setFilterTo(""); setFilterQ("")
    setPage(1)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filterAction) params.set("action", filterAction)
    if (filterEntity) params.set("entity", filterEntity)
    if (filterStatus) params.set("status", filterStatus)
    if (filterFrom)   params.set("from", filterFrom)
    if (filterTo)     params.set("to", filterTo)
    window.location.href = `/api/admin/audit-logs/export?${params}`
  }

  const handleCleanup = async () => {
    if (!confirm("Delete all audit logs older than 90 days?")) return
    setCleaning(true)
    setCleanupMsg("")
    const res = await fetch("/api/admin/audit-logs/cleanup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: 90 }) })
    const data = await res.json()
    setCleanupMsg(res.ok ? `Deleted ${data.deleted} logs older than 90 days.` : `Error: ${data.error}`)
    setCleaning(false)
    if (res.ok) { fetchStats(); fetchLogs(1) }
  }

  const totalPages = Math.ceil(total / LIMIT)

  if (status === "loading") return <div className="pt-2 flex items-center justify-center text-[#0D2840]">Loading...</div>
  if (!session || !["admin", "editor"].includes(session.user.role as string)) return null

  return (
    <div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840] flex items-center gap-2">
              <Shield size={24} className="text-violet-400" /> Audit Logs
            </h1>
            <p className="text-[#5B8FB9] text-sm mt-1">Activity journal — all admin operations</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { fetchStats(); fetchLogs(page) }} className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-3 py-2 rounded-lg text-sm transition">
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 bg-[#EBF3FB] hover:bg-[#D0E4F0] text-[#1B4F72] border border-[#A3C4DC] px-3 py-2 rounded-lg text-sm transition">
              <Download size={15} /> Export CSV
            </button>
            <button onClick={handleCleanup} disabled={cleaning} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 border border-red-500/30 px-3 py-2 rounded-lg text-sm transition">
              <Trash2 size={15} /> {cleaning ? "Cleaning…" : "Cleanup (90d)"}
            </button>
          </div>
        </div>

        {cleanupMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${cleanupMsg.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {cleanupMsg}
          </div>
        )}

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Total",    value: stats.total,         color: "text-[#0D2840]" },
              { label: "Success",  value: stats.success,       color: "text-green-700" },
              { label: "Failure",  value: stats.failure,       color: "text-yellow-400" },
              { label: "Error",    value: stats.error,         color: "text-red-600" },
              { label: "Users",    value: stats.distinctUsers, color: "text-[#1B4F72]" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#D0E4F0] rounded-xl p-4">
                <p className="text-[#5B8FB9] text-xs">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-[#D0E4F0] rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
              className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]">
              <option value="">All actions</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
              className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]">
              <option value="">All entities</option>
              {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]">
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="error">Error</option>
            </select>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              placeholder="From"
              className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              placeholder="To"
              className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
            <input value={filterQ} onChange={e => setFilterQ(e.target.value)}
              placeholder="Search…"
              className="bg-white border border-[#D0E4F0] text-[#0D2840] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSearch} className="bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg text-sm transition">Apply</button>
            <button onClick={handleReset}  className="bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-2 rounded-lg text-sm transition">Reset</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D0E4F0] text-[#5B8FB9] text-xs uppercase">
                  <th className="text-left p-3">Timestamp</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Entity</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-[#5B8FB9] p-8">Loading…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-[#5B8FB9] p-8">No logs found.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB] transition">
                    <td className="p-3 text-[#5B8FB9] whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-[#0D2840]">{log.userEmail ?? log.userName ?? <span className="text-[#A3C4DC]">—</span>}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${ACTION_COLORS[log.action] ?? "bg-gray-500/20 text-[#5B8FB9]"}`}>{log.action}</span>
                    </td>
                    <td className="p-3 text-gray-300">{log.entity}</td>
                    <td className="p-3 text-gray-300 max-w-xs truncate">{log.description}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[log.status] ?? "bg-gray-500/20 text-[#5B8FB9]"}`}>{log.status}</span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => setSelected(log)} className="text-[#1B4F72] hover:text-[#1B4F72] text-xs">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-[#D0E4F0]">
            <span className="text-[#5B8FB9] text-sm">{total} log(s) — page {page}/{Math.max(1, totalPages)}</span>
            <div className="flex gap-2">
              <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchLogs(p) }} disabled={page <= 1}
                className="p-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] disabled:opacity-40 text-[#0D2840] rounded-lg transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchLogs(p) }} disabled={page >= totalPages}
                className="p-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] disabled:opacity-40 text-[#0D2840] rounded-lg transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white border border-[#D0E4F0] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#0D2840] font-semibold">Log Detail</h2>
              <button onClick={() => setSelected(null)} className="text-[#5B8FB9] hover:text-[#1B4F72]"><X size={18} /></button>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ["ID",          selected.id],
                ["Timestamp",   new Date(selected.timestamp).toLocaleString()],
                ["User",        selected.userEmail ?? selected.userName ?? "—"],
                ["Role",        selected.userRole ?? "—"],
                ["IP",          selected.ipAddress ?? "—"],
                ["Action",      selected.action],
                ["Entity",      `${selected.entity}${selected.entityId ? ` (${selected.entityId})` : ""}`],
                ["Status",      selected.status],
                ["Description", selected.description],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-[#5B8FB9] w-28 shrink-0">{k}</dt>
                  <dd className="text-[#0D2840] break-all">{v}</dd>
                </div>
              ))}
              {selected.changes && (
                <div>
                  <dt className="text-[#5B8FB9] mb-1">Changes</dt>
                  <pre className="bg-[#EBF3FB] text-[#1B4F72] text-xs rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(JSON.parse(selected.changes), null, 2)}
                  </pre>
                </div>
              )}
              {selected.metadata && (
                <div>
                  <dt className="text-[#5B8FB9] mb-1">Metadata</dt>
                  <pre className="bg-[#F4F7FB] text-[#5B8FB9] text-xs rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(JSON.parse(selected.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
