"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Plus, Trash2, Edit, Upload, ExternalLink, FileText, Image, File, Building2, X, Check, Eye, Download } from "lucide-react"

interface Basin { id: string; name: string; basinId: string; type: string; location: string; countryId: string; country: { name: string; code: string } }

interface Block {
  id: string; name: string; blockId: string; status: string; type: string
  operator: string | null; operatorContact: string | null; awardDate: number | null; areaKm2: number | null
}
interface HydrocarbonField {
  id: string; name: string; fieldId: string; type: string; status: string
  operator: string | null; discoveryYear: number | null; productionStart: number | null
  oilMmb: number | null; gasBcf: number | null
}
interface BasinDoc {
  id: string; title: string; description: string | null; type: string
  fileName: string; filePath: string; fileSize: number | null; mimeType: string | null; addedBy: string | null; createdAt: string
}
interface NationalCompany {
  id: string; name: string; acronym: string | null; founded: number | null
  website: string | null; description: string | null; contact: string | null; companyId: string
}

const STATUS_COLORS: Record<string, string> = {
  "Libre": "bg-slate-100 text-slate-600",
  "Attribué": "bg-blue-50 text-blue-700",
  "Exploration": "bg-amber-50 text-amber-700",
  "Production": "bg-green-50 text-green-700",
  "Abandonné": "bg-red-50 text-red-600",
  "En production": "bg-green-50 text-green-700",
  "En développement": "bg-blue-50 text-blue-700",
  "Découverte": "bg-violet-50 text-violet-700",
}

function docIcon(type: string) {
  if (type === "photo") return <Image size={13} className="text-sky-500 shrink-0" />
  if (type === "pdf" || type === "report") return <FileText size={13} className="text-red-400 shrink-0" />
  return <File size={13} className="text-slate-400 shrink-0" />
}
function formatSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function BasinDetailPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const basinId = params.id as string

  const [basin, setBasin] = useState<Basin | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [fields, setFields] = useState<HydrocarbonField[]>([])
  const [docs, setDocs] = useState<BasinDoc[]>([])
  const [tab, setTab] = useState<"blocks" | "fields" | "operators" | "docs">("blocks")
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: "", description: "", type: "document" })
  const [uploadError, setUploadError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewDoc, setPreviewDoc] = useState<BasinDoc | null>(null)

  // Operators / National Companies state
  const [operators, setOperators] = useState<NationalCompany[]>([])
  const [countryId, setCountryId] = useState<string | null>(null)
  const [opForm, setOpForm] = useState({ name: "", acronym: "", founded: "", website: "", description: "", contact: "" })
  const [opEditing, setOpEditing] = useState<NationalCompany | null>(null)
  const [opAdding, setOpAdding] = useState(false)
  const [opLoading, setOpLoading] = useState(false)
  const [opError, setOpError] = useState("")

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])

  const fetchAll = () => {
    fetch(`/api/basins/${basinId}`).then(r => r.json()).then(d => setBasin(d))
    fetch(`/api/blocks?basinId=${basinId}`).then(r => r.json()).then(d => setBlocks(Array.isArray(d) ? d : []))
    fetch(`/api/fields?basinId=${basinId}`).then(r => r.json()).then(d => setFields(Array.isArray(d) ? d : []))
    fetch(`/api/basins/${basinId}/documents`).then(r => r.json()).then(d => setDocs(Array.isArray(d) ? d : []))
  }

  useEffect(() => { if (basinId) fetchAll() }, [basinId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch national companies when basin country is known
  useEffect(() => {
    if (basin?.countryId) {
      const cId = basin.countryId
      setCountryId(cId)
      fetch(`/api/national-companies?countryId=${cId}`)
        .then(r => r.json())
        .then(d => setOperators(Array.isArray(d) ? d : []))
    }
  }, [basin])

  const deleteBlock = async (id: string) => {
    if (!confirm("Supprimer ce bloc ?")) return
    await fetch(`/api/blocks/${id}`, { method: "DELETE" })
    setBlocks(prev => prev.filter(b => b.id !== id))
  }
  const deleteField = async (id: string) => {
    if (!confirm("Supprimer ce champ ?")) return
    await fetch(`/api/fields/${id}`, { method: "DELETE" })
    setFields(prev => prev.filter(f => f.id !== id))
  }
  const deleteDoc = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return
    await fetch(`/api/basin-documents/${id}`, { method: "DELETE" })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const saveOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!countryId) return
    setOpLoading(true); setOpError("")
    try {
      if (opEditing) {
        const res = await fetch(`/api/national-companies/${opEditing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: opForm.name,
            acronym: opForm.acronym || null,
            founded: opForm.founded ? parseInt(opForm.founded) : null,
            website: opForm.website || null,
            description: opForm.description || null,
            contact: opForm.contact || null,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setOperators(prev => prev.map(o => o.id === updated.id ? updated : o))
          setOpEditing(null)
        } else { const d = await res.json(); setOpError(d.error || "Erreur") }
      } else {
        const res = await fetch("/api/national-companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: `SNH-${Date.now()}`,
            name: opForm.name,
            countryId,
            acronym: opForm.acronym || null,
            founded: opForm.founded ? parseInt(opForm.founded) : null,
            website: opForm.website || null,
            description: opForm.description || null,
            contact: opForm.contact || null,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          setOperators(prev => [...prev, created])
          setOpAdding(false)
        } else { const d = await res.json(); setOpError(d.error || "Erreur") }
      }
      setOpForm({ name: "", acronym: "", founded: "", website: "", description: "", contact: "" })
    } catch { setOpError("Erreur réseau") }
    setOpLoading(false)
  }

  const deleteOperator = async (id: string) => {
    if (!confirm("Supprimer cette société nationale ?")) return
    await fetch(`/api/national-companies/${id}`, { method: "DELETE" })
    setOperators(prev => prev.filter(o => o.id !== id))
  }

  const startEditOp = (op: NationalCompany) => {
    setOpEditing(op)
    setOpAdding(false)
    setOpForm({
      name: op.name,
      acronym: op.acronym || "",
      founded: op.founded ? String(op.founded) : "",
      website: op.website || "",
      description: op.description || "",
      contact: op.contact || "",
    })
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !uploadForm.title.trim()) { setUploadError("Fichier et titre requis"); return }
    setUploading(true); setUploadError("")
    const fd = new FormData()
    fd.append("file", file); fd.append("title", uploadForm.title)
    fd.append("description", uploadForm.description); fd.append("type", uploadForm.type)
    const res = await fetch(`/api/basins/${basinId}/documents`, { method: "POST", body: fd })
    if (res.ok) {
      setUploadForm({ title: "", description: "", type: "document" })
      if (fileRef.current) fileRef.current.value = ""
      fetch(`/api/basins/${basinId}/documents`).then(r => r.json()).then(d => setDocs(Array.isArray(d) ? d : []))
    } else {
      const d = await res.json(); setUploadError(d.error || "Erreur upload")
    }
    setUploading(false)
  }

  if (!basin) return null

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/basins" className="text-[#5B8FB9] hover:text-[#1B4F72] text-sm">← Bassins</Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0D2840]">{basin.name}</h1>
          <p className="text-[#5B8FB9] text-sm">{basin.country.name} · {basin.type} · {basin.location}</p>
        </div>
        <Link href={`/admin/basins/${basinId}/edit`} className="ml-auto flex items-center gap-1.5 text-sm text-[#5B8FB9] hover:text-[#1B4F72] border border-[#D0E4F0] px-3 py-1.5 rounded-lg">
          <Edit size={14} /> Modifier le bassin
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#F4F7FB] p-1 rounded-xl w-fit">
        {([["blocks", `Blocs (${blocks.length})`], ["fields", `Champs (${fields.length})`], ["operators", `Opérateurs (${operators.length})`], ["docs", `Documents (${docs.length})`]] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as "blocks" | "fields" | "operators" | "docs")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-[#1B4F72] text-white shadow" : "text-[#5B8FB9] hover:text-[#1B4F72]"}`}
          >{label}</button>
        ))}
      </div>

      {/* BLOCS */}
      {tab === "blocks" && (
        <div>
          <div className="flex justify-end mb-3">
            <Link href={`/admin/basins/${basinId}/blocks/new`} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              <Plus size={16} /> Ajouter un bloc
            </Link>
          </div>
          <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
            {blocks.length === 0 ? (
              <p className="text-center text-[#5B8FB9] text-sm py-8">Aucun bloc défini pour ce bassin.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F4F7FB] border-b border-[#D0E4F0]">
                  <tr>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">ID</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Nom</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Statut</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Type</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Opérateur</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Attribution</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Surface km²</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map(b => (
                    <tr key={b.id} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB]">
                      <td className="px-4 py-3 font-mono text-xs text-[#5B8FB9]">{b.blockId}</td>
                      <td className="px-4 py-3 font-medium text-[#0D2840]">{b.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || "bg-slate-100 text-slate-600"}`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[#5B8FB9]">{b.type}</td>
                      <td className="px-4 py-3 text-[#0D2840]">{b.operator || "—"}</td>
                      <td className="px-4 py-3 text-[#5B8FB9]">{b.awardDate || "—"}</td>
                      <td className="px-4 py-3 text-[#5B8FB9]">{b.areaKm2 ? b.areaKm2.toLocaleString() : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/basins/${basinId}/blocks/${b.id}/edit`} className="text-[#5B8FB9] hover:text-[#1B4F72]"><Edit size={14} /></Link>
                          <button onClick={() => deleteBlock(b.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* CHAMPS */}
      {tab === "fields" && (
        <div>
          <div className="flex justify-end mb-3">
            <Link href={`/admin/basins/${basinId}/fields/new`} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              <Plus size={16} /> Ajouter un champ
            </Link>
          </div>
          <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
            {fields.length === 0 ? (
              <p className="text-center text-[#5B8FB9] text-sm py-8">Aucun champ défini pour ce bassin.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F4F7FB] border-b border-[#D0E4F0]">
                  <tr>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">ID</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Nom</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Statut</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Opérateur</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Découverte</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Prod. départ</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Huile (Mmb)</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Gaz (Bcf)</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(f => (
                    <tr key={f.id} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB]">
                      <td className="px-4 py-3 font-mono text-xs text-[#5B8FB9]">{f.fieldId}</td>
                      <td className="px-4 py-3 font-medium text-[#0D2840]">{f.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[f.status] || "bg-slate-100 text-slate-600"}`}>{f.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[#0D2840]">{f.operator || "—"}</td>
                      <td className="px-4 py-3 text-[#5B8FB9]">{f.discoveryYear || "—"}</td>
                      <td className="px-4 py-3 text-[#5B8FB9]">{f.productionStart || "—"}</td>
                      <td className="px-4 py-3 text-[#5B8FB9]">{f.oilMmb ?? "—"}</td>
                      <td className="px-4 py-3 text-[#5B8FB9]">{f.gasBcf ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/basins/${basinId}/fields/${f.id}/edit`} className="text-[#5B8FB9] hover:text-[#1B4F72]"><Edit size={14} /></Link>
                          <button onClick={() => deleteField(f.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* OPÉRATEURS */}
      {tab === "operators" && (
        <div className="space-y-5">
          {/* Block-derived operators (read-only) */}
          {(() => {
            const opMap = new Map<string, { contact: string | null; blocks: string[] }>()
            blocks.forEach(b => {
              if (b.operator) {
                if (!opMap.has(b.operator)) opMap.set(b.operator, { contact: b.operatorContact ?? null, blocks: [] })
                opMap.get(b.operator)!.blocks.push(b.name)
              }
            })
            const blockOps = Array.from(opMap.entries())
            return (
              <div>
                <h3 className="font-semibold text-[#1B4F72] text-sm mb-2 flex items-center gap-2"><Building2 size={15} />Opérateurs des blocs <span className="text-[#A3C4DC] font-normal">(dédupliqués depuis les blocs de ce bassin)</span></h3>
                <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
                  {blockOps.length === 0 ? (
                    <p className="text-center text-[#5B8FB9] text-sm py-6">Aucun opérateur renseigné dans les blocs de ce bassin.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-[#F4F7FB] border-b border-[#D0E4F0]">
                        <tr>
                          <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Opérateur</th>
                          <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Blocs opérés</th>
                          <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Contact / Site</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockOps.map(([name, info]) => (
                          <tr key={name} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB]">
                            <td className="px-4 py-3 font-medium text-[#0D2840]">{name}</td>
                            <td className="px-4 py-3 text-[#5B8FB9] text-xs">{info.blocks.join(", ")}</td>
                            <td className="px-4 py-3">
                              {info.contact ? (
                                <a href={info.contact.startsWith("http") ? info.contact : `https://${info.contact}`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F72] hover:underline text-xs flex items-center gap-1">
                                  <ExternalLink size={11} />{info.contact}
                                </a>
                              ) : <span className="text-[#A3C4DC] text-xs">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )
          })()}

          {/* National Companies CRUD */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#1B4F72] text-sm flex items-center gap-2"><Building2 size={15} />Sociétés nationales des hydrocarbures — {basin.country.name}</h3>
              {!opAdding && !opEditing && (
                <button onClick={() => { setOpAdding(true); setOpEditing(null); setOpForm({ name: "", acronym: "", founded: "", website: "", description: "", contact: "" }) }}
                  className="flex items-center gap-1.5 text-sm bg-[#1B4F72] hover:bg-[#154060] text-white px-3 py-1.5 rounded-lg transition">
                  <Plus size={14} /> Ajouter une SNH
                </button>
              )}
            </div>

            {(opAdding || opEditing) && (
              <form onSubmit={saveOperator} className="bg-[#EBF3FB] border border-[#D0E4F0] rounded-xl p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#1B4F72] font-semibold text-sm">{opEditing ? "Modifier la SNH" : "Nouvelle SNH"}</span>
                  <button type="button" onClick={() => { setOpAdding(false); setOpEditing(null) }} className="text-[#5B8FB9] hover:text-[#1B4F72]"><X size={16} /></button>
                </div>
                {opError && <p className="text-red-600 text-xs">{opError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#1B4F72] text-xs mb-1">Nom *</label>
                    <input value={opForm.name} onChange={e => setOpForm({...opForm, name: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
                  </div>
                  <div>
                    <label className="block text-[#1B4F72] text-xs mb-1">Sigle / Acronyme</label>
                    <input value={opForm.acronym} onChange={e => setOpForm({...opForm, acronym: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
                  </div>
                  <div>
                    <label className="block text-[#1B4F72] text-xs mb-1">Fondée (année)</label>
                    <input type="number" value={opForm.founded} onChange={e => setOpForm({...opForm, founded: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
                  </div>
                  <div>
                    <label className="block text-[#1B4F72] text-xs mb-1">Site web</label>
                    <input value={opForm.website} onChange={e => setOpForm({...opForm, website: e.target.value})} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
                  </div>
                  <div>
                    <label className="block text-[#1B4F72] text-xs mb-1">Contact</label>
                    <input value={opForm.contact} onChange={e => setOpForm({...opForm, contact: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
                  </div>
                  <div>
                    <label className="block text-[#1B4F72] text-xs mb-1">Description</label>
                    <input value={opForm.description} onChange={e => setOpForm({...opForm, description: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={opLoading} className="flex items-center gap-1.5 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    <Check size={14} />{opLoading ? "Enregistrement..." : "Enregistrer"}
                  </button>
                  <button type="button" onClick={() => { setOpAdding(false); setOpEditing(null) }} className="px-4 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg text-sm hover:bg-white transition">Annuler</button>
                </div>
              </form>
            )}

            <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
              {operators.length === 0 ? (
                <p className="text-center text-[#5B8FB9] text-sm py-6">Aucune société nationale enregistrée pour {basin.country.name}.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#F4F7FB] border-b border-[#D0E4F0]">
                    <tr>
                      <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Nom</th>
                      <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Sigle</th>
                      <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Fondée</th>
                      <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Contact</th>
                      <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Site web</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.map(op => (
                      <tr key={op.id} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB]">
                        <td className="px-4 py-3 font-medium text-[#0D2840]">{op.name}</td>
                        <td className="px-4 py-3 text-[#1B4F72] font-mono text-xs">{op.acronym || "—"}</td>
                        <td className="px-4 py-3 text-[#5B8FB9]">{op.founded || "—"}</td>
                        <td className="px-4 py-3 text-[#5B8FB9] text-xs">{op.contact || "—"}</td>
                        <td className="px-4 py-3 text-xs">
                          {op.website ? (
                            <a href={op.website.startsWith("http") ? op.website : `https://${op.website}`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F72] hover:underline flex items-center gap-1">
                              <ExternalLink size={11} />{op.website}
                            </a>
                          ) : <span className="text-[#A3C4DC]">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEditOp(op)} className="text-[#5B8FB9] hover:text-[#1B4F72]"><Edit size={14} /></button>
                            <button onClick={() => deleteOperator(op.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS */}
      {tab === "docs" && (
        <div className="space-y-4">
          {/* Upload */}
          <form onSubmit={handleUpload} className="bg-white border border-[#D0E4F0] rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-[#1B4F72] text-sm flex items-center gap-2"><Upload size={16} />Ajouter un document / photo</h3>
            {uploadError && <p className="text-red-600 text-xs">{uploadError}</p>}
            <div className="grid grid-cols-3 gap-3">
              <input value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} placeholder="Titre *" required className="px-3 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
              <select value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})} className="px-3 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
                {["photo","pdf","report","map","document"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
              <input type="file" ref={fileRef} accept="image/*,.pdf,.doc,.docx" required className="text-xs text-[#5B8FB9] file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#1B4F72] file:text-white file:text-xs file:cursor-pointer" />
            </div>
            <input value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} placeholder="Description (optionnel)" className="w-full px-3 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
            <button type="submit" disabled={uploading} className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold transition">
              <Upload size={14} />{uploading ? "Upload..." : "Upload"}
            </button>
          </form>
          {/* List */}
          <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
            {docs.length === 0 ? (
              <p className="text-center text-[#5B8FB9] text-sm py-8">Aucun document pour ce bassin.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F4F7FB] border-b border-[#D0E4F0]">
                  <tr>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Type</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Titre</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Fichier</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Taille</th>
                    <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc.id} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB]">
                      <td className="px-4 py-3"><span className="flex items-center gap-1.5">{docIcon(doc.type)}<span className="text-[#5B8FB9] capitalize text-xs">{doc.type}</span></span></td>
                      <td className="px-4 py-3 font-medium text-[#0D2840]">
                        {doc.title}
                        {doc.description && <div className="text-[#5B8FB9] text-xs">{doc.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#5B8FB9] font-mono text-xs">{doc.fileName}</td>
                      <td className="px-4 py-3 text-[#5B8FB9] text-xs">{formatSize(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-[#5B8FB9] text-xs">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPreviewDoc(doc)} title="Aperçu" className="text-[#5B8FB9] hover:text-[#1B4F72]"><Eye size={14} /></button>
                          <a href={`/uploads/${doc.filePath}`} download={doc.fileName} title="Télécharger" className="text-[#5B8FB9] hover:text-[#1B4F72]"><Download size={14} /></a>
                          <button onClick={() => deleteDoc(doc.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setPreviewDoc(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-5xl w-full max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#D0E4F0] bg-[#F4F7FB] shrink-0">
              <div className="flex items-center gap-2">
                {docIcon(previewDoc.type)}
                <div>
                  <p className="font-semibold text-[#0D2840] text-sm">{previewDoc.title}</p>
                  {previewDoc.description && <p className="text-[#5B8FB9] text-xs">{previewDoc.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/uploads/${previewDoc.filePath}`}
                  download={previewDoc.fileName}
                  className="flex items-center gap-1.5 text-xs text-[#1B4F72] border border-[#D0E4F0] px-3 py-1.5 rounded-lg hover:bg-[#EBF3FB] transition"
                >
                  <Download size={12} /> Télécharger
                </a>
                <a
                  href={`/uploads/${previewDoc.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#1B4F72] border border-[#D0E4F0] px-3 py-1.5 rounded-lg hover:bg-[#EBF3FB] transition"
                >
                  <ExternalLink size={12} /> Ouvrir
                </a>
                <button onClick={() => setPreviewDoc(null)} className="text-[#5B8FB9] hover:text-[#1B4F72] ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Modal body */}
            <div className="flex-1 overflow-auto bg-[#0D2840]/5 flex items-center justify-center p-4 min-h-0">
              {(() => {
                const url = `/uploads/${previewDoc.filePath}`
                const mime = previewDoc.mimeType ?? ""
                const isImage = mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|tiff?)$/i.test(previewDoc.fileName)
                const isPdf = mime === "application/pdf" || previewDoc.fileName.toLowerCase().endsWith(".pdf")
                if (isImage) {
                  return (
                    <img
                      src={url}
                      alt={previewDoc.title}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  )
                }
                if (isPdf) {
                  return (
                    <iframe
                      src={url}
                      title={previewDoc.title}
                      className="w-full h-full min-h-[60vh] rounded-lg border-0"
                    />
                  )
                }
                return (
                  <div className="text-center space-y-4">
                    <File size={56} className="text-[#D0E4F0] mx-auto" />
                    <p className="text-[#5B8FB9]">Aperçu non disponible pour ce type de fichier.</p>
                    <a
                      href={url}
                      download={previewDoc.fileName}
                      className="inline-flex items-center gap-2 bg-[#1B4F72] text-white px-5 py-2 rounded-lg hover:bg-[#154060] transition text-sm"
                    >
                      <Download size={16} /> Télécharger {previewDoc.fileName}
                    </a>
                  </div>
                )
              })()}
            </div>
            {/* Modal footer */}
            <div className="px-5 py-2 border-t border-[#D0E4F0] bg-[#F4F7FB] shrink-0 flex items-center justify-between text-xs text-[#5B8FB9]">
              <span>{previewDoc.fileName} {previewDoc.fileSize ? `· ${formatSize(previewDoc.fileSize)}` : ""}</span>
              <span>Ajouté le {new Date(previewDoc.createdAt).toLocaleDateString("fr-FR")} {previewDoc.addedBy ? `par ${previewDoc.addedBy}` : ""}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
