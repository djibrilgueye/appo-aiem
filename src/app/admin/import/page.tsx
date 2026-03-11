"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Database,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Calendar,
  AlertTriangle,
  Info
} from "lucide-react"

interface ImportStatus {
  status: string
  ieaPath: string
  filesAvailable: {
    wbes: boolean
    conv: boolean
    bbl: boolean
  }
  database: {
    productionRecords: number
    countriesWithData: number
    yearsAvailable: number[]
    lastUpdate: string | null
  }
}

interface ImportResult {
  success: boolean
  dryRun: boolean
  year: string
  output: string
  fullOutput?: string
  errors?: string | null
  error?: string
  details?: string
}

export default function ImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Import options
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [dryRun, setDryRun] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user.role === "admin") {
      fetchImportStatus()
    }
  }, [session])

  const fetchImportStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/import-iea")
      if (res.ok) {
        const data = await res.json()
        setImportStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch import status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch("/api/admin/import-iea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear === "all" ? undefined : parseInt(selectedYear),
          dryRun
        })
      })

      const data = await res.json()
      setImportResult(data)

      if (data.success && !dryRun) {
        fetchImportStatus()
      }
    } catch (error) {
      setImportResult({
        success: false,
        dryRun,
        year: selectedYear,
        output: "",
        error: "Failed to run import",
        details: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setImporting(false)
    }
  }

  if (status === "loading" || loading) return null

  if (!session || session.user.role !== "admin") {
    return (
      <div>
        <div className="text-[#0D2840]">Access denied. Admin role required.</div>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="p-2 hover:bg-[#EBF3FB] rounded-lg transition"
          >
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840]">Import IEA Data</h1>
            <p className="text-[#5B8FB9]">Import energy data from IEA World Energy Balances</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-[#D0E4F0] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#0D2840] mb-4 flex items-center gap-2">
            <Database size={20} />
            Import Status
          </h2>

          {importStatus ? (
            <div className="space-y-4">
              {/* IEA Files Status */}
              <div>
                <p className="text-[#5B8FB9] text-sm mb-2">IEA Database Files</p>
                <div className="flex gap-4">
                  <FileStatus
                    name="WBES.zip"
                    available={importStatus.filesAvailable.wbes}
                    description="World Energy Balances"
                  />
                  <FileStatus
                    name="WCONV.zip"
                    available={importStatus.filesAvailable.conv}
                    description="Conversion factors"
                  />
                  <FileStatus
                    name="WORLD_BBL.zip"
                    available={importStatus.filesAvailable.bbl}
                    description="Barrels data"
                  />
                </div>
              </div>

              {/* Database Status */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#D0E4F0]">
                <div>
                  <p className="text-[#5B8FB9] text-sm">Countries with data</p>
                  <p className="text-2xl font-bold text-[#0D2840]">{importStatus.database.countriesWithData}</p>
                </div>
                <div>
                  <p className="text-[#5B8FB9] text-sm">Production records</p>
                  <p className="text-2xl font-bold text-[#0D2840]">{importStatus.database.productionRecords}</p>
                </div>
                <div>
                  <p className="text-[#5B8FB9] text-sm">Years available</p>
                  <p className="text-lg font-bold text-[#0D2840]">
                    {importStatus.database.yearsAvailable.length > 0
                      ? `${Math.min(...importStatus.database.yearsAvailable)} - ${Math.max(...importStatus.database.yearsAvailable)}`
                      : "None"}
                  </p>
                </div>
              </div>

              {importStatus.database.lastUpdate && (
                <div className="pt-4 border-t border-[#D0E4F0]">
                  <p className="text-[#5B8FB9] text-sm">
                    Last update: {new Date(importStatus.database.lastUpdate).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#5B8FB9]">Unable to fetch import status</p>
          )}
        </div>

        {/* Import Form */}
        <div className="bg-white border border-[#D0E4F0] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#0D2840] mb-4 flex items-center gap-2">
            <Download size={20} />
            Run Import
          </h2>

          <div className="space-y-4">
            {/* Year Selection */}
            <div>
              <label className="block text-[#5B8FB9] text-sm mb-2">
                <Calendar size={16} className="inline mr-2" />
                Year to import
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-[#F4F7FB] border border-[#D0E4F0] rounded-lg px-4 py-2 text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
              >
                <option value="all">All years</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Dry Run Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-5 h-5 rounded bg-[#F4F7FB] border-[#D0E4F0] text-[#1B4F72] focus:ring-cyan-400"
              />
              <label htmlFor="dryRun" className="text-[#0D2840]">
                Dry run (preview only, no changes)
              </label>
            </div>

            {/* Warning for live import */}
            {!dryRun && (
              <div className="flex items-start gap-3 bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
                <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-amber-400 font-medium">Live Import Mode</p>
                  <p className="text-amber-400/80 text-sm">
                    This will update the database with IEA data. Existing records for the selected year(s) will be overwritten.
                  </p>
                </div>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={importing || !importStatus?.filesAvailable.wbes}
              className="w-full flex items-center justify-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:bg-[#1B4F72]/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition"
            >
              {importing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {dryRun ? "Running preview..." : "Importing..."}
                </>
              ) : (
                <>
                  <Download size={20} />
                  {dryRun ? "Preview Import" : "Start Import"}
                </>
              )}
            </button>

            {!importStatus?.filesAvailable.wbes && (
              <p className="text-red-600 text-sm text-center">
                WBES.zip file not found. Please ensure IEA database files are available.
              </p>
            )}
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`bg-white border rounded-xl p-6 ${
            importResult.success
              ? "border-green-500/30"
              : "border-red-500/30"
          }`}>
            <h2 className="text-lg font-semibold text-[#0D2840] mb-4 flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="text-green-700" size={20} />
              ) : (
                <XCircle className="text-red-600" size={20} />
              )}
              {importResult.dryRun ? "Preview Result" : "Import Result"}
            </h2>

            {importResult.error ? (
              <div className="text-red-600">
                <p className="font-medium">{importResult.error}</p>
                {importResult.details && (
                  <p className="text-sm mt-1 text-red-600/80">{importResult.details}</p>
                )}
              </div>
            ) : (
              <pre className="bg-black/30 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {importResult.output}
              </pre>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 bg-[#F4F7FB]0 border border-[#EBF3FB] rounded-xl p-6">
          <h3 className="text-[#0D2840] font-medium mb-3 flex items-center gap-2">
            <Info size={18} />
            About IEA Data Import
          </h3>
          <div className="text-[#5B8FB9] text-sm space-y-2">
            <p>
              This tool imports energy production and trade data from the IEA (International Energy Agency)
              World Energy Balances database.
            </p>
            <p>
              <strong className="text-gray-300">Data source:</strong> IEA World Energy Balances (subscription required)
            </p>
            <p>
              <strong className="text-gray-300">Data imported:</strong> Crude oil production (kb/d),
              Natural gas production (million m³/yr), Oil & gas exports/imports
            </p>
            <p>
              <strong className="text-gray-300">Coverage:</strong> All African countries with available data
            </p>
            <p>
              <strong className="text-gray-300">Recommended:</strong> Run this import annually when IEA
              releases updated data (typically mid-year)
            </p>
          </div>
        </div>
    </div>
  )
}

function FileStatus({
  name,
  available,
  description
}: {
  name: string
  available: boolean
  description: string
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      available ? "bg-green-500/20" : "bg-red-500/20"
    }`}>
      {available ? (
        <CheckCircle className="text-green-700" size={16} />
      ) : (
        <XCircle className="text-red-600" size={16} />
      )}
      <div>
        <p className={`text-sm font-medium ${available ? "text-green-700" : "text-red-600"}`}>
          {name}
        </p>
        <p className="text-xs text-[#A3C4DC]">{description}</p>
      </div>
    </div>
  )
}
