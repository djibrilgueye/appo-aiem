"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Save, Plus, Trash2, ChevronDown, ChevronUp, Globe } from "lucide-react"

type Lang = "fr" | "en" | "pt"

interface ThemeEntry {
  icon: string
  label: string
  desc: string
}

interface SourceEntry {
  icon: string
  label: string
  text: string
}

interface ContentState {
  themes: ThemeEntry[]
  sources: SourceEntry[]
}

const LANGS: { code: Lang; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
]

const DEFAULT_THEMES: Record<Lang, ThemeEntry[]> = {
  fr: [
    { icon: "🗺️", label: "Bassins & Champs",      desc: "Localisation des bassins sédimentaires et champs pétroliers et gaziers à travers l'Afrique." },
    { icon: "🟢", label: "Réserves pétrolières",   desc: "Réserves prouvées de pétrole brut par pays (Gbbl), données OPEC ASB." },
    { icon: "🔵", label: "Réserves gazières",      desc: "Réserves prouvées de gaz naturel par pays (Tcf), données OPEC ASB." },
    { icon: "🔴", label: "Production pétrolière",  desc: "Production journalière de pétrole brut (kb/d), données IEA/OPEC." },
    { icon: "🔥", label: "Production gazière",     desc: "Production annuelle de gaz naturel (M m³/yr), données IEA/OPEC." },
    { icon: "🚇", label: "Pipelines",              desc: "Réseau de pipelines africains : opérationnels, en construction, proposés et concepts." },
    { icon: "🏭", label: "Raffineries",            desc: "Capacités et statuts des raffineries à travers le continent." },
    { icon: "🎓", label: "Formation",              desc: "Instituts de formation pétrolière membres du Forum APPO." },
    { icon: "🔬", label: "R&D",                    desc: "Centres de recherche & développement des compagnies nationales." },
    { icon: "🏪", label: "Stockage",               desc: "Terminaux de stockage de pétrole brut, GNL et produits pétroliers." },
    { icon: "🧬", label: "Pétrochimie",            desc: "Complexes pétrochimiques et capacités de production." },
    { icon: "⬇️⬆️", label: "Imports / Exports",   desc: "Flux d'importations et d'exportations de pétrole et gaz par pays." },
  ],
  en: [
    { icon: "🗺️", label: "Basins & Fields",       desc: "Location of sedimentary basins and oil and gas fields across Africa." },
    { icon: "🟢", label: "Oil reserves",           desc: "Proved crude oil reserves by country (Gbbl), OPEC ASB data." },
    { icon: "🔵", label: "Gas reserves",           desc: "Proved natural gas reserves by country (Tcf), OPEC ASB data." },
    { icon: "🔴", label: "Oil production",         desc: "Daily crude oil production (kb/d), IEA/OPEC data." },
    { icon: "🔥", label: "Gas production",         desc: "Annual natural gas production (M m³/yr), IEA/OPEC data." },
    { icon: "🚇", label: "Pipelines",              desc: "African pipeline network: operational, under construction, proposed and concepts." },
    { icon: "🏭", label: "Refineries",             desc: "Refinery capacities and statuses across the continent." },
    { icon: "🎓", label: "Training",               desc: "Oil & gas training institutes — APPO Forum members." },
    { icon: "🔬", label: "R&D",                    desc: "Research & development centres of national oil companies." },
    { icon: "🏪", label: "Storage",                desc: "Crude oil, LNG and petroleum products storage terminals." },
    { icon: "🧬", label: "Petrochemicals",         desc: "Petrochemical complexes and production capacities." },
    { icon: "⬇️⬆️", label: "Imports / Exports",   desc: "Oil and gas import and export flows by country." },
  ],
  pt: [
    { icon: "🗺️", label: "Bacias & Campos",        desc: "Localização das bacias sedimentares e campos de petróleo e gás em toda a África." },
    { icon: "🟢", label: "Reservas de petróleo",    desc: "Reservas provadas de petróleo bruto por país (Gbbl), dados OPEC ASB." },
    { icon: "🔵", label: "Reservas de gás",         desc: "Reservas provadas de gás natural por país (Tcf), dados OPEC ASB." },
    { icon: "🔴", label: "Produção de petróleo",    desc: "Produção diária de petróleo bruto (kb/d), dados IEA/OPEC." },
    { icon: "🔥", label: "Produção de gás",         desc: "Produção anual de gás natural (M m³/yr), dados IEA/OPEC." },
    { icon: "🚇", label: "Oleodutos",               desc: "Rede de oleodutos africanos: operacionais, em construção, propostos e conceitos." },
    { icon: "🏭", label: "Refinarias",              desc: "Capacidades e estatutos das refinarias em todo o continente." },
    { icon: "🎓", label: "Formação",                desc: "Institutos de formação petrolífera — membros do Fórum APPO." },
    { icon: "🔬", label: "P&D",                     desc: "Centros de investigação e desenvolvimento das companhias nacionais." },
    { icon: "🏪", label: "Armazenamento",           desc: "Terminais de armazenamento de petróleo bruto, GNL e produtos petrolíferos." },
    { icon: "🧬", label: "Petroquímica",            desc: "Complexos petroquímicos e capacidades de produção." },
    { icon: "⬇️⬆️", label: "Importações / Exportações", desc: "Fluxos de importações e exportações de petróleo e gás por país." },
  ],
}

const DEFAULT_SOURCES: Record<Lang, SourceEntry[]> = {
  fr: [
    { icon: "📊", label: "Réserves",    text: "OPEC Annual Statistical Bulletin — Energy Institute Statistical Review of World Energy" },
    { icon: "⚡", label: "Production",  text: "IEA World Energy Balances (WBES) — OPEC Monthly Oil Market Report" },
    { icon: "🗺️", label: "Bassins",    text: "USGS World Petroleum Assessment — AAPG/CGG Robertson Tellus" },
    { icon: "🚇", label: "Pipelines",   text: "Global Energy Monitor — Gas & Oil Infrastructure Trackers" },
    { icon: "🏭", label: "Raffineries", text: "Oil & Gas Journal Worldwide Refining Survey — ARDA" },
    { icon: "🎓", label: "Formation",   text: "APPO Forum of Directors of Oil & Gas Training Institutes" },
    { icon: "🏪", label: "Stockage",    text: "GIIGNL Annual Report — Global Energy Monitor" },
    { icon: "🧬", label: "Pétrochimie", text: "GlobalData — publications des opérateurs" },
  ],
  en: [
    { icon: "📊", label: "Reserves",    text: "OPEC Annual Statistical Bulletin — Energy Institute Statistical Review of World Energy" },
    { icon: "⚡", label: "Production",  text: "IEA World Energy Balances (WBES) — OPEC Monthly Oil Market Report" },
    { icon: "🗺️", label: "Basins",     text: "USGS World Petroleum Assessment — AAPG/CGG Robertson Tellus" },
    { icon: "🚇", label: "Pipelines",   text: "Global Energy Monitor — Gas & Oil Infrastructure Trackers" },
    { icon: "🏭", label: "Refineries",  text: "Oil & Gas Journal Worldwide Refining Survey — ARDA" },
    { icon: "🎓", label: "Training",    text: "APPO Forum of Directors of Oil & Gas Training Institutes" },
    { icon: "🏪", label: "Storage",     text: "GIIGNL Annual Report — Global Energy Monitor" },
    { icon: "🧬", label: "Petrochemicals", text: "GlobalData — operator publications" },
  ],
  pt: [
    { icon: "📊", label: "Reservas",     text: "OPEC Annual Statistical Bulletin — Energy Institute Statistical Review of World Energy" },
    { icon: "⚡", label: "Produção",     text: "IEA World Energy Balances (WBES) — OPEC Monthly Oil Market Report" },
    { icon: "🗺️", label: "Bacias",      text: "USGS World Petroleum Assessment — AAPG/CGG Robertson Tellus" },
    { icon: "🚇", label: "Oleodutos",    text: "Global Energy Monitor — Gas & Oil Infrastructure Trackers" },
    { icon: "🏭", label: "Refinarias",   text: "Oil & Gas Journal Worldwide Refining Survey — ARDA" },
    { icon: "🎓", label: "Formação",     text: "APPO Forum of Directors of Oil & Gas Training Institutes" },
    { icon: "🏪", label: "Armazenamento", text: "GIIGNL Annual Report — Global Energy Monitor" },
    { icon: "🧬", label: "Petroquímica", text: "GlobalData — publicações dos operadores" },
  ],
}

export default function ContentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeLang, setActiveLang] = useState<Lang>("fr")
  const [content, setContent] = useState<Record<Lang, ContentState>>({
    fr: { themes: DEFAULT_THEMES.fr, sources: DEFAULT_SOURCES.fr },
    en: { themes: DEFAULT_THEMES.en, sources: DEFAULT_SOURCES.en },
    pt: { themes: DEFAULT_THEMES.pt, sources: DEFAULT_SOURCES.pt },
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const loadContent = useCallback(async () => {
    const [themesRes, sourcesRes] = await Promise.all([
      fetch("/api/admin/content?key=themes"),
      fetch("/api/admin/content?key=sources"),
    ])
    const themesData = await themesRes.json()
    const sourcesData = await sourcesRes.json()

    setContent(prev => {
      const next = { ...prev }
      for (const lang of ["fr", "en", "pt"] as Lang[]) {
        next[lang] = {
          themes: Array.isArray(themesData[lang]) ? themesData[lang] : DEFAULT_THEMES[lang],
          sources: Array.isArray(sourcesData[lang]) ? sourcesData[lang] : DEFAULT_SOURCES[lang],
        }
      }
      return next
    })
  }, [])

  useEffect(() => { loadContent() }, [loadContent])

  const save = async (section: "themes" | "sources") => {
    setSaving(section)
    setSaved(null)
    for (const lang of ["fr", "en", "pt"] as Lang[]) {
      await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: section, lang, value: content[lang][section] }),
      })
    }
    setSaving(null)
    setSaved(section)
    setTimeout(() => setSaved(null), 3000)
  }

  const updateTheme = (lang: Lang, idx: number, field: keyof ThemeEntry, val: string) => {
    setContent(prev => {
      const themes = prev[lang].themes.map((t, i) => i === idx ? { ...t, [field]: val } : t)
      return { ...prev, [lang]: { ...prev[lang], themes } }
    })
  }

  const addTheme = (lang: Lang) => {
    setContent(prev => ({
      ...prev,
      [lang]: { ...prev[lang], themes: [...prev[lang].themes, { icon: "📌", label: "", desc: "" }] },
    }))
  }

  const removeTheme = (lang: Lang, idx: number) => {
    setContent(prev => ({
      ...prev,
      [lang]: { ...prev[lang], themes: prev[lang].themes.filter((_, i) => i !== idx) },
    }))
  }

  const updateSource = (lang: Lang, idx: number, field: keyof SourceEntry, val: string) => {
    setContent(prev => {
      const sources = prev[lang].sources.map((s, i) => i === idx ? { ...s, [field]: val } : s)
      return { ...prev, [lang]: { ...prev[lang], sources } }
    })
  }

  const addSource = (lang: Lang) => {
    setContent(prev => ({
      ...prev,
      [lang]: { ...prev[lang], sources: [...prev[lang].sources, { icon: "📖", label: "", text: "" }] },
    }))
  }

  const removeSource = (lang: Lang, idx: number) => {
    setContent(prev => ({
      ...prev,
      [lang]: { ...prev[lang], sources: prev[lang].sources.filter((_, i) => i !== idx) },
    }))
  }

  if (status === "loading") return <div className="text-[#0D2840]">Loading...</div>
  if (!session || !["admin", "editor"].includes(session.user.role)) {
    return <div className="text-[#0D2840]">Access denied.</div>
  }

  const cur = content[activeLang]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2840]">Contenu de la page d&apos;accueil</h1>
          <p className="text-[#5B8FB9] text-sm mt-0.5">Modifiez les descriptions des thèmes et les sources de données</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#5B8FB9]">
          <Globe size={14} />
          Modifications sauvegardées pour toutes les langues simultanément
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-[#D0E4F0] rounded-lg p-1 w-fit">
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => setActiveLang(l.code)}
            className="px-4 py-1.5 rounded text-sm font-medium transition"
            style={activeLang === l.code
              ? { backgroundColor: "#1B4F72", color: "#ffffff" }
              : { color: "#5B8FB9" }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Themes section */}
      <div className="bg-white border border-[#D0E4F0] rounded-xl mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0E4F0]">
          <div>
            <h2 className="text-base font-semibold text-[#0D2840]">Thèmes disponibles</h2>
            <p className="text-xs text-[#5B8FB9] mt-0.5">Icône, nom et description de chaque thème affichés sur la page d&apos;accueil</p>
          </div>
          <div className="flex items-center gap-2">
            {saved === "themes" && (
              <span className="text-xs text-green-600 font-medium">Sauvegardé ✓</span>
            )}
            <button
              onClick={() => save("themes")}
              disabled={saving === "themes"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: saving === "themes" ? "#5B8FB9" : "#1B4F72" }}
            >
              <Save size={14} />
              {saving === "themes" ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {cur.themes.map((theme, idx) => (
            <div key={idx} className="border border-[#D0E4F0] rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7FB] transition text-left"
                onClick={() => setExpandedTheme(expandedTheme === idx ? null : idx)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-7">{theme.icon}</span>
                  <span className="text-sm font-medium text-[#0D2840]">{theme.label || <span className="text-[#A3C4DC] italic">Nouveau thème</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); removeTheme(activeLang, idx) }}
                    className="p-1 rounded hover:bg-red-50 text-[#A3C4DC] hover:text-red-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expandedTheme === idx ? <ChevronUp size={16} className="text-[#5B8FB9]" /> : <ChevronDown size={16} className="text-[#5B8FB9]" />}
                </div>
              </button>

              {expandedTheme === idx && (
                <div className="px-4 pb-4 pt-1 border-t border-[#D0E4F0] bg-[#F4F7FB] space-y-3">
                  <div className="grid grid-cols-[80px_1fr] gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#5B8FB9] mb-1">Icône</label>
                      <input
                        value={theme.icon}
                        onChange={e => updateTheme(activeLang, idx, "icon", e.target.value)}
                        className="w-full border border-[#D0E4F0] rounded px-2 py-1.5 text-sm text-center bg-white text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                        placeholder="🗺️"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5B8FB9] mb-1">Nom du thème</label>
                      <input
                        value={theme.label}
                        onChange={e => updateTheme(activeLang, idx, "label", e.target.value)}
                        className="w-full border border-[#D0E4F0] rounded px-3 py-1.5 text-sm bg-white text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                        placeholder="Nom du thème"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5B8FB9] mb-1">Description</label>
                    <textarea
                      value={theme.desc}
                      onChange={e => updateTheme(activeLang, idx, "desc", e.target.value)}
                      rows={2}
                      className="w-full border border-[#D0E4F0] rounded px-3 py-1.5 text-sm bg-white text-[#0D2840] focus:outline-none focus:border-[#1B4F72] resize-none"
                      placeholder="Description du thème…"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => addTheme(activeLang)}
            className="flex items-center gap-2 text-sm text-[#1B4F72] hover:text-[#0D2840] transition px-1"
          >
            <Plus size={16} />
            Ajouter un thème
          </button>
        </div>
      </div>

      {/* Sources section */}
      <div className="bg-white border border-[#D0E4F0] rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0E4F0]">
          <div>
            <h2 className="text-base font-semibold text-[#0D2840]">Sources de données</h2>
            <p className="text-xs text-[#5B8FB9] mt-0.5">Sources bibliographiques par type de données affichées en bas de la page d&apos;accueil</p>
          </div>
          <div className="flex items-center gap-2">
            {saved === "sources" && (
              <span className="text-xs text-green-600 font-medium">Sauvegardé ✓</span>
            )}
            <button
              onClick={() => save("sources")}
              disabled={saving === "sources"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: saving === "sources" ? "#5B8FB9" : "#1B4F72" }}
            >
              <Save size={14} />
              {saving === "sources" ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {cur.sources.map((source, idx) => (
            <div key={idx} className="grid grid-cols-[60px_160px_1fr_36px] gap-2 items-center">
              <div>
                <label className="block text-xs font-medium text-[#5B8FB9] mb-1">Icône</label>
                <input
                  value={source.icon}
                  onChange={e => updateSource(activeLang, idx, "icon", e.target.value)}
                  className="w-full border border-[#D0E4F0] rounded px-2 py-1.5 text-sm text-center bg-white text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                  placeholder="📊"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5B8FB9] mb-1">Libellé</label>
                <input
                  value={source.label}
                  onChange={e => updateSource(activeLang, idx, "label", e.target.value)}
                  className="w-full border border-[#D0E4F0] rounded px-3 py-1.5 text-sm bg-white text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                  placeholder="Réserves"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5B8FB9] mb-1">Texte / Références</label>
                <input
                  value={source.text}
                  onChange={e => updateSource(activeLang, idx, "text", e.target.value)}
                  className="w-full border border-[#D0E4F0] rounded px-3 py-1.5 text-sm bg-white text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
                  placeholder="OPEC ASB — IEA…"
                />
              </div>
              <div className="pt-5">
                <button
                  onClick={() => removeSource(activeLang, idx)}
                  className="p-1.5 rounded hover:bg-red-50 text-[#A3C4DC] hover:text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => addSource(activeLang)}
            className="flex items-center gap-2 text-sm text-[#1B4F72] hover:text-[#0D2840] transition px-1 mt-2"
          >
            <Plus size={16} />
            Ajouter une source
          </button>
        </div>
      </div>
    </div>
  )
}
