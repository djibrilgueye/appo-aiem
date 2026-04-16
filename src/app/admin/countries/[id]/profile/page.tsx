"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"

interface NationalCompany {
  id: string
  companyId: string
  name: string
  acronym: string | null
  founded: number | null
  website: string | null
  description: string | null
  contact: string | null
}

interface CountryProfile {
  id: string
  name: string
  code: string
  flagEmoji: string | null
  capital: string | null
  currency: string | null
  independence: string | null
  population: number | null
  gdpBnUsd: number | null
  economyDesc: string | null
  nationalCompanies: NationalCompany[]
}

const emptyCompany = (): Omit<NationalCompany, "id"> => ({
  companyId: "",
  name: "",
  acronym: null,
  founded: null,
  website: null,
  description: null,
  contact: null,
})

export default function CountryProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [profile, setProfile] = useState<CountryProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  // Profile fields
  const [flagEmoji, setFlagEmoji] = useState("")
  const [capital, setCapital] = useState("")
  const [currency, setCurrency] = useState("")
  const [independence, setIndependence] = useState("")
  const [population, setPopulation] = useState("")
  const [gdpBnUsd, setGdpBnUsd] = useState("")
  const [economyDesc, setEconomyDesc] = useState("")

  // National companies
  const [companies, setCompanies] = useState<(NationalCompany | Omit<NationalCompany, "id"> & { _new?: true })[]>([])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch(`/api/countries/${id}/profile`)
      .then(r => r.json())
      .then((d: CountryProfile) => {
        setProfile(d)
        setFlagEmoji(d.flagEmoji ?? "")
        setCapital(d.capital ?? "")
        setCurrency(d.currency ?? "")
        setIndependence(d.independence ?? "")
        setPopulation(d.population ? String(d.population) : "")
        setGdpBnUsd(d.gdpBnUsd ? String(d.gdpBnUsd) : "")
        setEconomyDesc(d.economyDesc ?? "")
        setCompanies(d.nationalCompanies)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session, id])

  const saveProfile = async () => {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch(`/api/countries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagEmoji: flagEmoji || null,
          capital: capital || null,
          currency: currency || null,
          independence: independence || null,
          population: population ? parseInt(population) : null,
          gdpBnUsd: gdpBnUsd ? parseFloat(gdpBnUsd) : null,
          economyDesc: economyDesc || null,
        }),
      })
      if (!res.ok) throw new Error()
      setMessage("Profil enregistré.")
    } catch {
      setMessage("Erreur lors de la sauvegarde.")
    } finally {
      setSaving(false)
    }
  }

  const saveCompany = async (co: NationalCompany | (Omit<NationalCompany, "id"> & { _new?: true }), idx: number) => {
    const isNew = !("id" in co) || ("_new" in co && co._new)
    const url = isNew ? "/api/national-companies" : `/api/national-companies/${(co as NationalCompany).id}`
    const method = isNew ? "POST" : "PUT"
    const body = { ...co, countryId: id }
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) {
      const saved = await res.json()
      setCompanies(prev => {
        const next = [...prev]
        next[idx] = saved
        return next
      })
    }
  }

  const deleteCompany = async (co: NationalCompany | (Omit<NationalCompany, "id"> & { _new?: true }), idx: number) => {
    if ("id" in co && !("_new" in co)) {
      await fetch(`/api/national-companies/${(co as NationalCompany).id}`, { method: "DELETE" })
    }
    setCompanies(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="p-8 text-[#5B8FB9]">Chargement…</div>
  if (!profile) return <div className="p-8 text-red-500">Pays introuvable.</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/countries" className="text-[#5B8FB9] hover:text-[#1B4F72] flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Pays
        </Link>
        <span className="text-[#D0E4F0]">/</span>
        <h1 className="text-xl font-bold text-[#0D2840]">
          {profile.flagEmoji || "🌍"} {profile.name} — Profil pays
        </h1>
      </div>

      {/* General info */}
      <div className="bg-white border border-[#D0E4F0] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-bold text-[#1B4F72] uppercase tracking-wider mb-4">Informations générales</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Emoji drapeau</label>
            <input value={flagEmoji} onChange={e => setFlagEmoji(e.target.value)} placeholder="🇩🇿"
              className="w-full border border-[#D0E4F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Capitale</label>
            <input value={capital} onChange={e => setCapital(e.target.value)} placeholder="Alger"
              className="w-full border border-[#D0E4F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Monnaie</label>
            <input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="Dinar algérien (DZD)"
              className="w-full border border-[#D0E4F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Date d&apos;indépendance</label>
            <input value={independence} onChange={e => setIndependence(e.target.value)} placeholder="1er novembre 1962"
              className="w-full border border-[#D0E4F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Population</label>
            <input type="number" value={population} onChange={e => setPopulation(e.target.value)} placeholder="44000000"
              className="w-full border border-[#D0E4F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">PIB (Mrd USD)</label>
            <input type="number" step="0.1" value={gdpBnUsd} onChange={e => setGdpBnUsd(e.target.value)} placeholder="200.5"
              className="w-full border border-[#D0E4F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Description de l&apos;économie</label>
            <textarea value={economyDesc} onChange={e => setEconomyDesc(e.target.value)} rows={3}
              placeholder="Économie basée principalement sur les hydrocarbures…"
              className="w-full border border-[#D0E4F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72] resize-none" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={saveProfile} disabled={saving}
            className="flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition">
            <Save size={15} /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {message && <span className={`text-xs ${message.includes("Erreur") ? "text-red-500" : "text-green-600"}`}>{message}</span>}
        </div>
      </div>

      {/* National companies */}
      <div className="bg-white border border-[#D0E4F0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1B4F72] uppercase tracking-wider">Sociétés Nationales des Hydrocarbures</h2>
          <button onClick={() => setCompanies(prev => [...prev, { ...emptyCompany(), _new: true } as NationalCompany & { _new: true }])}
            className="flex items-center gap-1 text-xs bg-[#F4F7FB] hover:bg-[#EBF3FB] text-[#1B4F72] px-3 py-1.5 rounded-lg border border-[#D0E4F0] transition">
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {companies.length === 0 && (
          <p className="text-xs text-[#5B8FB9] text-center py-4">Aucune société enregistrée.</p>
        )}

        {companies.map((co, idx) => (
          <div key={idx} className="border border-[#EBF3FB] rounded-lg p-4 mb-3 bg-[#F4F7FB]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">ID unique *</label>
                <input value={co.companyId} onChange={e => setCompanies(prev => { const n = [...prev]; (n[idx] as any).companyId = e.target.value; return n })}
                  placeholder="SONATRACH-DZA"
                  className="w-full border border-[#D0E4F0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B4F72] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Nom complet *</label>
                <input value={co.name} onChange={e => setCompanies(prev => { const n = [...prev]; (n[idx] as any).name = e.target.value; return n })}
                  placeholder="Société Nationale des Hydrocarbures"
                  className="w-full border border-[#D0E4F0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B4F72] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Acronyme</label>
                <input value={co.acronym ?? ""} onChange={e => setCompanies(prev => { const n = [...prev]; (n[idx] as any).acronym = e.target.value || null; return n })}
                  placeholder="SONATRACH"
                  className="w-full border border-[#D0E4F0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B4F72] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Fondée</label>
                <input type="number" value={co.founded ?? ""} onChange={e => setCompanies(prev => { const n = [...prev]; (n[idx] as any).founded = e.target.value ? parseInt(e.target.value) : null; return n })}
                  placeholder="1963"
                  className="w-full border border-[#D0E4F0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B4F72] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Site web</label>
                <input value={co.website ?? ""} onChange={e => setCompanies(prev => { const n = [...prev]; (n[idx] as any).website = e.target.value || null; return n })}
                  placeholder="https://sonatrach.com"
                  className="w-full border border-[#D0E4F0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B4F72] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Contact</label>
                <input value={co.contact ?? ""} onChange={e => setCompanies(prev => { const n = [...prev]; (n[idx] as any).contact = e.target.value || null; return n })}
                  placeholder="contact@sonatrach.com"
                  className="w-full border border-[#D0E4F0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B4F72] bg-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#5B8FB9] mb-1">Description</label>
                <textarea value={co.description ?? ""} onChange={e => setCompanies(prev => { const n = [...prev]; (n[idx] as any).description = e.target.value || null; return n })}
                  rows={2} placeholder="Présentation sommaire de la société…"
                  className="w-full border border-[#D0E4F0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B4F72] bg-white resize-none" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => saveCompany(co, idx)}
                className="flex items-center gap-1 text-xs bg-[#1B4F72] hover:bg-[#154060] text-white px-3 py-1.5 rounded-lg transition">
                <Save size={12} /> Sauvegarder
              </button>
              <button onClick={() => deleteCompany(co, idx)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg transition">
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
