"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Database, MapPin, Factory, GitBranch, BarChart3, Users, Plus, RefreshCw, Upload, Shield, Mail, FileText, Warehouse, FlaskConical, GraduationCap, Microscope, ArrowLeftRight } from "lucide-react"

interface Stats {
  countries: number
  basins: number
  refineries: number
  pipelines: number
  reserves: number
  productions: number
  users: number
  storage: number
  petrochem: number
  training: number
  rnd: number
  tradeImports: number
  tradeExports: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session && ["admin", "editor"].includes(session.user.role)) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const [countries, basins, refineries, pipelines, reserves, productions, users, storage, petrochem, training, rnd, tradeImports, tradeExports] = await Promise.all([
        fetch("/api/countries?all=1").then(r => r.json()),
        fetch("/api/basins?all=1").then(r => r.json()),
        fetch("/api/refineries?all=1").then(r => r.json()),
        fetch("/api/pipelines").then(r => r.json()),
        fetch("/api/reserves?all=1").then(r => r.json()),
        fetch("/api/production?all=1").then(r => r.json()),
        fetch("/api/admin/users").then(r => r.ok ? r.json() : []),
        fetch("/api/storage").then(r => r.ok ? r.json() : []),
        fetch("/api/petrochem").then(r => r.ok ? r.json() : []),
        fetch("/api/training").then(r => r.ok ? r.json() : []),
        fetch("/api/rnd").then(r => r.ok ? r.json() : []),
        fetch("/api/trade/imports").then(r => r.ok ? r.json() : []),
        fetch("/api/trade/exports").then(r => r.ok ? r.json() : []),
      ])

      setStats({
        countries:    Array.isArray(countries)    ? countries.length    : 0,
        basins:       Array.isArray(basins)        ? basins.length       : 0,
        refineries:   Array.isArray(refineries)    ? refineries.length   : 0,
        pipelines:    Array.isArray(pipelines)     ? pipelines.length    : 0,
        reserves:     Array.isArray(reserves)      ? reserves.length     : 0,
        productions:  Array.isArray(productions)   ? productions.length  : 0,
        users:        Array.isArray(users)         ? users.length        : 0,
        storage:      Array.isArray(storage)       ? storage.length      : 0,
        petrochem:    Array.isArray(petrochem)     ? petrochem.length    : 0,
        training:     Array.isArray(training)      ? training.length     : 0,
        rnd:          Array.isArray(rnd)           ? rnd.length          : 0,
        tradeImports: Array.isArray(tradeImports)  ? tradeImports.length : 0,
        tradeExports: Array.isArray(tradeExports)  ? tradeExports.length : 0,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleSeedDatabase = async () => {
    setSeeding(true)
    setSeedMessage("")
    try {
      const res = await fetch("/api/seed", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setSeedMessage(`Database seeded successfully! Admin: ${data.admin.email} / ${data.admin.password}`)
        fetchStats()
      } else {
        setSeedMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setSeedMessage("Failed to seed database")
    } finally {
      setSeeding(false)
    }
  }

  if (status === "loading") {
    return (
      <div>
        <div className="text-[#0D2840]">Loading...</div>
      </div>
    )
  }

  if (!session || !["admin", "editor"].includes(session.user.role)) {
    return (
      <div>
        <div className="text-[#0D2840]">Access denied. Admin or Editor role required.</div>
      </div>
    )
  }

  const statCards = [
    { label: "Countries",        value: stats?.countries    ?? 0, icon: MapPin,          href: "/admin/countries",   color: "bg-blue-500" },
    { label: "Basins",           value: stats?.basins       ?? 0, icon: Database,        href: "/admin/basins",      color: "bg-amber-500" },
    { label: "Refineries",       value: stats?.refineries   ?? 0, icon: Factory,         href: "/admin/refineries",  color: "bg-purple-500" },
    { label: "Pipelines",        value: stats?.pipelines    ?? 0, icon: GitBranch,       href: "/admin/pipelines",   color: "bg-orange-500" },
    { label: "Reserves Data",    value: stats?.reserves     ?? 0, icon: BarChart3,       href: "/admin/reserves",    color: "bg-green-500" },
    { label: "Production Data",  value: stats?.productions  ?? 0, icon: BarChart3,       href: "/admin/production",  color: "bg-red-500" },
    { label: "Stockage & Dépôts",value: stats?.storage      ?? 0, icon: Warehouse,       href: "/admin/storage",     color: "bg-sky-500" },
    { label: "Pétrochimie",      value: stats?.petrochem    ?? 0, icon: FlaskConical,    href: "/admin/petrochem",   color: "bg-rose-500" },
    { label: "Centres Formation",value: stats?.training     ?? 0, icon: GraduationCap,   href: "/admin/training",    color: "bg-emerald-500" },
    { label: "Centres R&D",      value: stats?.rnd          ?? 0, icon: Microscope,      href: "/admin/rnd",         color: "bg-lime-500" },
    { label: "Commerce Import",  value: stats?.tradeImports ?? 0, icon: ArrowLeftRight,  href: "/admin/trade",       color: "bg-fuchsia-500" },
    { label: "Commerce Export",  value: stats?.tradeExports ?? 0, icon: ArrowLeftRight,  href: "/admin/trade",       color: "bg-yellow-500" },
    { label: "Users",            value: stats?.users        ?? 0, icon: Users,           href: "/admin/users",       color: "bg-teal-500" },
    { label: "Audit Logs",       value: null,                     icon: Shield,          href: "/admin/audit-logs",  color: "bg-violet-500" },
    { label: "Allowed Emails",   value: null,                     icon: Mail,            href: "/admin/allowed-emails", color: "bg-pink-500" },
    { label: "Content",          value: null,                     icon: FileText,        href: "/admin/content",     color: "bg-cyan-500" },
    { label: "Opérateurs",       value: null,                     icon: Users,           href: "/admin/operators",   color: "bg-indigo-500" },
  ]

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840]">Admin Dashboard</h1>
            <p className="text-[#5B8FB9]">Manage AIEM data</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-2 rounded-lg transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            {session.user.role === "admin" && (
              <button
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:bg-[#1B4F72]/50 text-white px-4 py-2 rounded-lg transition"
              >
                <Database size={18} />
                {seeding ? "Seeding..." : "Seed Database"}
              </button>
            )}
          </div>
        </div>

        {seedMessage && (
          <div className={`mb-6 p-4 rounded-lg ${seedMessage.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {seedMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map(card => (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white border border-[#D0E4F0] rounded-xl p-6 hover:border-[#1B4F72]/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#5B8FB9] text-sm">{card.label}</p>
                  {card.value !== null
                    ? <p className="text-3xl font-bold text-[#0D2840] mt-1">{card.value}</p>
                    : <p className="text-sm text-[#A3C4DC] mt-1">View →</p>
                  }
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon size={24} className="text-[#0D2840]" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[#1B4F72] text-sm opacity-0 group-hover:opacity-100 transition">
                <Plus size={16} />
                Manage {card.label.toLowerCase()}
              </div>
            </Link>
          ))}
        </div>

        {/* Data Import Section */}
        {session.user.role === "admin" && (
          <div className="mt-8 bg-gradient-to-r from-[#EBF3FB] to-[#F4F7FB] border border-[#A3C4DC] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0D2840] mb-1 flex items-center gap-2">
                  <Upload size={20} className="text-[#1B4F72]" />
                  Data Import
                </h2>
                <p className="text-[#5B8FB9] text-sm">
                  Import energy data from IEA World Energy Balances
                </p>
              </div>
              <Link
                href="/admin/import"
                className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-5 py-2.5 rounded-lg font-medium transition"
              >
                <Database size={18} />
                Import IEA Data
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white border border-[#D0E4F0] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#0D2840] mb-4 flex items-center gap-2">
            <Users size={20} />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/countries/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Add Country
            </Link>
            <Link
              href="/admin/basins/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Add Basin
            </Link>
            <Link
              href="/admin/refineries/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Add Refinery
            </Link>
            <Link
              href="/admin/pipelines/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Add Pipeline
            </Link>
            <Link
              href="/admin/operators"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Nouvel opérateur
            </Link>
            <Link
              href="/admin/storage/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Nouveau stockage
            </Link>
            <Link
              href="/admin/petrochem/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Nouvelle usine pétrochimique
            </Link>
            <Link
              href="/admin/training/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Nouveau centre formation
            </Link>
            <Link
              href="/admin/rnd/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Nouveau centre R&D
            </Link>
            <Link
              href="/admin/trade/new"
              className="flex items-center gap-2 bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#0D2840] px-4 py-3 rounded-lg transition"
            >
              <Plus size={18} />
              Nouvel enregistrement commerce
            </Link>
          </div>
        </div>
    </div>
  )
}
