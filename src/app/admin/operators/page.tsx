"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, ExternalLink, Building2, X, Check } from "lucide-react"

interface NationalCompany {
  id: string; companyId: string; name: string; acronym: string | null
  founded: number | null; website: string | null; description: string | null
  contact: string | null; countryId: string
}
interface Country { id: string; code: string; name: string }
interface BlockOp {
  operator: string
  countries: string[]
  basins: string[]
  blocks: string[]
  contact: string | null
}

const emptyForm = { name: "", acronym: "", founded: "", website: "", description: "", contact: "", countryId: "" }

export default function OperatorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [companies, setCompanies] = useState<NationalCompany[]>([])
  const [blockOps, setBlockOps] = useState<BlockOp[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<NationalCompany | null>(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (session) fetchAll()
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [cRes, ncRes, bRes] = await Promise.all([
        fetch("/api/countries?all=1").then(r => r.json()),
        fetch("/api/national-companies").then(r => r.json()),
        fetch("/api/blocks?all=1").then(r => r.json()),
      ])
      setCountries(Array.isArray(cRes) ? cRes : [])
      setCompanies(Array.isArray(ncRes) ? ncRes : [])

      // Build deduplicated block operator list
      if (Array.isArray(bRes)) {
        const map = new Map<string, { countries: Set<string>; basins: Set<string>; blocks: string[]; contact: string | null }>()
        bRes.forEach((b: { operator: string | null; operatorContact: string | null; name: string; country?: { name: string }; basin?: { name: string } }) => {
          if (!b.operator) return
          if (!map.has(b.operator)) map.set(b.operator, { countries: new Set(), basins: new Set(), blocks: [], contact: b.operatorContact ?? null })
          const entry = map.get(b.operator)!
          if (b.country?.name) entry.countries.add(b.country.name)
          if (b.basin?.name) entry.basins.add(b.basin.name)
          entry.blocks.push(b.name)
          if (!entry.contact && b.operatorContact) entry.contact = b.operatorContact
        })
        setBlockOps(Array.from(map.entries()).map(([operator, v]) => ({
          operator,
          countries: Array.from(v.countries),
          basins: Array.from(v.basins),
          blocks: v.blocks,
          contact: v.contact,
        })))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const countryName = (id: string) => countries.find(c => c.id === id)?.name ?? "—"

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setFormError("")
    try {
      if (editing) {
        const res = await fetch(`/api/national-companies/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            acronym: form.acronym || null,
            founded: form.founded ? parseInt(form.founded) : null,
            website: form.website || null,
            description: form.description || null,
            contact: form.contact || null,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c))
          cancelForm()
        } else { const d = await res.json(); setFormError(d.error || "Erreur") }
      } else {
        if (!form.countryId) { setFormError("Veuillez sélectionner un pays"); setSaving(false); return }
        const res = await fetch("/api/national-companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: `SNH-${Date.now()}`,
            name: form.name,
            countryId: form.countryId,
            acronym: form.acronym || null,
            founded: form.founded ? parseInt(form.founded) : null,
            website: form.website || null,
            description: form.description || null,
            contact: form.contact || null,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          setCompanies(prev => [...prev, created])
          cancelForm()
        } else { const d = await res.json(); setFormError(d.error || "Erreur") }
      }
    } catch { setFormError("Erreur réseau") }
    setSaving(false)
  }

  const deleteCompany = async (id: string) => {
    if (!confirm("Supprimer cette société nationale ?")) return
    await fetch(`/api/national-companies/${id}`, { method: "DELETE" })
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  const startEdit = (co: NationalCompany) => {
    setEditing(co)
    setAdding(false)
    setForm({ name: co.name, acronym: co.acronym || "", founded: co.founded ? String(co.founded) : "", website: co.website || "", description: co.description || "", contact: co.contact || "", countryId: co.countryId })
  }

  const cancelForm = () => { setEditing(null); setAdding(false); setForm(emptyForm); setFormError("") }

  if (status === "loading" || loading) return null
  if (!session || !["admin", "editor"].includes(session.user.role)) {
    return <div className="text-[#0D2840]">Accès refusé.</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#5B8FB9] hover:text-[#1B4F72]">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0D2840]">Opérateurs Pétroliers</h1>
            <p className="text-[#5B8FB9]">{companies.length} sociétés nationales · {blockOps.length} opérateurs de blocs</p>
          </div>
        </div>
        {!adding && !editing && (
          <button
            onClick={() => { setAdding(true); setEditing(null); setForm(emptyForm) }}
            className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Plus size={16} /> Nouvelle SNH
          </button>
        )}
      </div>

      {/* ===== SECTION 1: SNH ===== */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#0D2840] mb-3 flex items-center gap-2">
          <Building2 size={18} className="text-[#1B4F72]" />
          Sociétés Nationales des Hydrocarbures (SNH)
        </h2>

        {/* Add/Edit form */}
        {(adding || editing) && (
          <form onSubmit={saveCompany} className="bg-[#EBF3FB] border border-[#A3C4DC] rounded-xl p-5 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#1B4F72] font-semibold text-sm">{editing ? "Modifier la SNH" : "Nouvelle SNH"}</span>
              <button type="button" onClick={cancelForm} className="text-[#5B8FB9] hover:text-[#1B4F72]"><X size={16} /></button>
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {!editing && (
                <div className="md:col-span-3">
                  <label className="block text-[#1B4F72] text-xs mb-1">Pays *</label>
                  <select value={form.countryId} onChange={e => setForm({...form, countryId: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]">
                    <option value="">-- Sélectionner un pays --</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[#1B4F72] text-xs mb-1">Nom *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#1B4F72] text-xs mb-1">Sigle</label>
                <input value={form.acronym} onChange={e => setForm({...form, acronym: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#1B4F72] text-xs mb-1">Fondée</label>
                <input type="number" value={form.founded} onChange={e => setForm({...form, founded: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#1B4F72] text-xs mb-1">Site web</label>
                <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#1B4F72] text-xs mb-1">Contact</label>
                <input value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#1B4F72] text-xs mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white border border-[#D0E4F0] text-sm text-[#0D2840] focus:outline-none focus:border-[#1B4F72]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                <Check size={14} />{saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button type="button" onClick={cancelForm} className="px-4 py-2 border border-[#D0E4F0] text-[#0D2840] rounded-lg text-sm hover:bg-[#EBF3FB] transition">Annuler</button>
            </div>
          </form>
        )}

        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          {companies.length === 0 ? (
            <p className="text-center text-[#5B8FB9] text-sm py-8">Aucune société nationale enregistrée.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F4F7FB] border-b border-[#D0E4F0]">
                <tr>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Pays</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Nom</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Sigle</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Fondée</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Site web</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {companies.map(co => (
                  <tr key={co.id} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB]">
                    <td className="px-4 py-3 text-[#5B8FB9] text-sm">{countryName(co.countryId)}</td>
                    <td className="px-4 py-3 font-medium text-[#0D2840]">{co.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#1B4F72]">{co.acronym || "—"}</td>
                    <td className="px-4 py-3 text-[#5B8FB9]">{co.founded || "—"}</td>
                    <td className="px-4 py-3 text-[#5B8FB9] text-xs">{co.contact || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {co.website ? (
                        <a href={co.website.startsWith("http") ? co.website : `https://${co.website}`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F72] hover:underline flex items-center gap-1">
                          <ExternalLink size={11} />{co.website}
                        </a>
                      ) : <span className="text-[#A3C4DC]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(co)} className="text-[#5B8FB9] hover:text-[#1B4F72]"><Edit size={14} /></button>
                        {session.user.role === "admin" && (
                          <button onClick={() => deleteCompany(co.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ===== SECTION 2: Block Operators ===== */}
      <section>
        <h2 className="text-lg font-semibold text-[#0D2840] mb-3 flex items-center gap-2">
          <Building2 size={18} className="text-[#1B4F72]" />
          Opérateurs de blocs <span className="text-[#5B8FB9] font-normal text-base">(issus des données blocs)</span>
        </h2>
        <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
          {blockOps.length === 0 ? (
            <p className="text-center text-[#5B8FB9] text-sm py-8">Aucun opérateur renseigné dans les blocs.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F4F7FB] border-b border-[#D0E4F0]">
                <tr>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Opérateur</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Pays</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Bassins</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Blocs opérés</th>
                  <th className="text-left px-4 py-3 text-[#1B4F72] font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody>
                {blockOps.map(op => (
                  <tr key={op.operator} className="border-b border-[#EBF3FB] hover:bg-[#F4F7FB]">
                    <td className="px-4 py-3 font-medium text-[#0D2840]">{op.operator}</td>
                    <td className="px-4 py-3 text-[#5B8FB9] text-xs">{op.countries.join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-[#5B8FB9] text-xs">{op.basins.join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-[#5B8FB9] text-xs">{op.blocks.join(", ")}</td>
                    <td className="px-4 py-3 text-xs">
                      {op.contact ? (
                        <a href={op.contact.startsWith("http") ? op.contact : `https://${op.contact}`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F72] hover:underline flex items-center gap-1">
                          <ExternalLink size={11} />{op.contact}
                        </a>
                      ) : <span className="text-[#A3C4DC]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
