"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Upload, Trash2, FileText, Image, File, ExternalLink } from "lucide-react"
import { AdminTable } from "@/components/AdminTable"

interface CountryDoc {
  id: string
  title: string
  description: string | null
  type: string
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  addedBy: string | null
  createdAt: string
}

const DOC_TYPES = ["photo", "pdf", "report", "map", "document"]

function fileIcon(type: string) {
  if (type === "photo") return <Image size={16} className="text-sky-500" />
  if (type === "pdf" || type === "report") return <FileText size={16} className="text-red-500" />
  if (type === "map") return <File size={16} className="text-green-600" />
  return <File size={16} className="text-slate-400" />
}

function formatSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function CountryDocumentsPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const countryId = params.id as string

  const [countryName, setCountryName] = useState("")
  const [docs, setDocs] = useState<CountryDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ title: "", description: "", type: "document" })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])

  const fetchDocs = () => {
    setLoading(true)
    fetch(`/api/countries/${countryId}/documents`)
      .then(r => r.json())
      .then(d => { setDocs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (!countryId) return
    fetch(`/api/countries/${countryId}`)
      .then(r => r.json())
      .then(d => setCountryName(d.name || ""))
    fetchDocs()
  }, [countryId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !form.title.trim()) { setError("File and title are required"); return }
    setUploading(true); setError("")
    const fd = new FormData()
    fd.append("file", file)
    fd.append("title", form.title)
    fd.append("description", form.description)
    fd.append("type", form.type)
    const res = await fetch(`/api/countries/${countryId}/documents`, { method: "POST", body: fd })
    if (res.ok) {
      setForm({ title: "", description: "", type: "document" })
      if (fileRef.current) fileRef.current.value = ""
      fetchDocs()
    } else {
      const d = await res.json()
      setError(d.error || "Upload failed")
    }
    setUploading(false)
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return
    await fetch(`/api/documents/${docId}`, { method: "DELETE" })
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/countries" className="text-[#5B8FB9] hover:text-[#1B4F72] text-sm">← Countries</Link>
        <h1 className="text-2xl font-bold text-[#0D2840]">
          Documents & Photos — {countryName}
        </h1>
      </div>

      {/* Upload form */}
      <form onSubmit={handleUpload} className="bg-white border border-[#D0E4F0] rounded-xl p-6 mb-6 space-y-4">
        <h2 className="font-semibold text-[#1B4F72] flex items-center gap-2"><Upload size={18} /> Add document / photo</h2>
        {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Photo puits Sangomar"
              className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] text-sm focus:outline-none focus:border-[#1B4F72]"
            />
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] text-sm focus:outline-none focus:border-[#1B4F72]"
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#1B4F72] text-sm mb-1">File *</label>
            <input
              type="file"
              ref={fileRef}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              required
              className="w-full px-3 py-1.5 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] text-sm focus:outline-none focus:border-[#1B4F72] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#1B4F72] file:text-white file:text-xs file:cursor-pointer"
            />
          </div>
        </div>
        <div>
          <label className="block text-[#1B4F72] text-sm mb-1">Description</label>
          <input
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            className="w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] text-sm focus:outline-none focus:border-[#1B4F72]"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold text-sm transition"
        >
          <Upload size={16} />{uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {/* Documents list */}
      <AdminTable
        data={docs}
        columns={[
          {
            key: 'type',
            label: 'Type',
            sortable: true,
            searchable: true,
            render: (type: string) => (
              <span className="flex items-center gap-1.5">
                {fileIcon(type)}
                <span className="text-[#5B8FB9] capitalize">{type}</span>
              </span>
            )
          },
          {
            key: 'title',
            label: 'Title',
            sortable: true,
            searchable: true,
            render: (_: any, doc: CountryDoc) => (
              <div className="font-medium text-[#0D2840]">
                {doc.title}
                {doc.description && <div className="text-[#5B8FB9] text-xs mt-0.5">{doc.description}</div>}
              </div>
            )
          },
          {
            key: 'fileName',
            label: 'File',
            sortable: true,
            searchable: true,
            className: 'text-[#5B8FB9] font-mono text-xs'
          },
          {
            key: 'fileSize',
            label: 'Size',
            sortable: true,
            render: (fileSize: number | null) => formatSize(fileSize),
            className: 'text-[#5B8FB9]'
          },
          {
            key: 'addedBy',
            label: 'Added by',
            sortable: true,
            searchable: true,
            render: (addedBy: string | null) => addedBy || "—",
            className: 'text-[#5B8FB9] text-xs'
          },
          {
            key: 'createdAt',
            label: 'Date',
            sortable: true,
            render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
            className: 'text-[#5B8FB9] text-xs'
          }
        ]}
        searchFields={['type', 'title', 'fileName', 'addedBy']}
        actions={(doc: CountryDoc) => (
          <div className="flex items-center gap-2">
            <a
              href={`/uploads/${doc.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5B8FB9] hover:text-[#1B4F72]"
              title="Open"
            >
              <ExternalLink size={15} />
            </a>
            <button
              onClick={() => handleDelete(doc.id)}
              className="text-red-400 hover:text-red-600"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
        loading={loading}
      />
    </div>
  )
}
