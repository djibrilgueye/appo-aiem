"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChevronRight, CircleHelp, Droplets, ExternalLink, Factory, Flame, Globe2, Layers3, LayoutDashboard, Map as MapIcon, Maximize2, Menu, PanelLeftClose, Presentation, Search, ShieldCheck, SlidersHorizontal, Table2, X, ChartNoAxesCombined, GitCompareArrows, Info } from "lucide-react"
import type { AssetKind, DatasetKey, EnergyAsset, EnergyCountry, EnergyDataset, Metric, Observation, PreviewData } from "@/lib/preview/types"
import { availableYears, csvCell, formatNumber, getObservation, METRICS, metricValue, metricIssue } from "@/lib/preview/metrics"
import styles from "./EnergyWorkspace.module.css"
import { hasSeriesBreak } from "@/lib/preview/review-issues"

const EnergyAtlas = dynamic(() => import("./EnergyAtlas"), { ssr: false, loading: () => <div className={styles.mapLoading} role="status">Préparation de la carte…</div> })
type View = "overview" | "atlas" | "compare" | "data" | "assets" | "sources"
type Detail = { country: EnergyCountry; row?: Observation; metric: Metric } | { asset: EnergyAsset }

const NAV = [
  { key: "overview", label: "Vue d’ensemble", icon: LayoutDashboard },
  { key: "atlas", label: "Atlas énergétique", icon: MapIcon },
  { key: "compare", label: "Comparer les pays", icon: GitCompareArrows },
  { key: "data", label: "Données nationales", icon: Table2 },
  { key: "assets", label: "Infrastructures", icon: Factory },
  { key: "sources", label: "Sources & méthode", icon: BookOpen },
] as const
const REGIONS: Record<string, string> = { "North Africa": "Afrique du Nord", "West Africa": "Afrique de l’Ouest", "Central Africa": "Afrique centrale", "East Africa": "Afrique de l’Est", "Southern Africa": "Afrique australe" }
const ASSETS: Record<AssetKind, string> = { refineries: "Raffineries", pipelines: "Pipelines", basins: "Bassins", storage: "Stockage & GNL", training: "Formation", rnd: "Recherche", petrochem: "Pétrochimie" }
const STATUSES: Record<string, string> = { "under construction": "En construction", offline: "À l’arrêt", operational: "En exploitation", construction: "En construction", under_construction: "En construction", proposed: "Proposé", concept: "Concept", planned: "Planifié", suspended: "Suspendu", closed: "Fermé", decommissioned: "Démantelé", unknown: "Non précisé" }

export function EnergyWorkspace({ data }: { data: PreviewData }) {
  const [view, setView] = useState<View>("overview")
  const [datasetKey, setDatasetKey] = useState<DatasetKey>(data.production ? "production" : "research")
  const [year, setYear] = useState(2024)
  const [region, setRegion] = useState("all")
  const [selectedCountry, setSelectedCountry] = useState("all")
  const [metric, setMetric] = useState<Metric>("oil")
  const [query, setQuery] = useState("")
  const [presentation, setPresentation] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [assetKind, setAssetKind] = useState<AssetKind>("refineries")
  const [assetStatus, setAssetStatus] = useState("all")
  const [showAssets, setShowAssets] = useState(false)
  const [comparison, setComparison] = useState(["DZA", "NGA", "COG"])
  const [detail, setDetail] = useState<Detail | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dataset = (datasetKey === "production" ? data.production : data[datasetKey]) ?? data.research
  const years = availableYears(dataset)
  const currentMetric = METRICS[metric]
  const countries = dataset.countries.filter(c => (region === "all" || c.region === region) && (selectedCountry === "all" || c.code === selectedCountry) && `${c.name} ${c.code}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")))
  const countryCodes = new Set(countries.map(c => c.code))
  const values = Object.fromEntries(countries.map(country => [country.code, metricValue(getObservation(dataset, country.code, year, metric), metric)]))
  const ranked = countries.map(country => ({ country, value: values[country.code] })).filter((r): r is { country: EnergyCountry; value: number } => r.value != null).sort((a, b) => b.value - a.value)
  const records = countries.map(country => ({ country, row: getObservation(dataset, country.code, year, metric) }))
  const assets = dataset.assets.filter(a => a.countries.some(c => countryCodes.has(c)))
  const filteredAssets = assets.filter(a => a.kind === assetKind && (assetStatus === "all" || a.status === assetStatus))
  const coverage = ranked.length
  const covered = countries.length ? Math.round(coverage / countries.length * 100) : 0
  const selected = dataset.countries.find(c => c.code === selectedCountry)
  const title = { overview: "Panorama énergétique", atlas: "Atlas énergétique", compare: "Comparer les trajectoires", data: "Les données, en détail", assets: "Infrastructures & capacités", sources: "La donnée dans son contexte" }[view]
  const description = { overview: "Une lecture claire des ressources et des infrastructures africaines.", atlas: "Situer les ressources, explorer les pays et comprendre les ordres de grandeur.", compare: "Des observations comparables, une même année et des unités explicites.", data: "Retrouver chaque observation, son millésime et sa documentation.", assets: "Explorer les fiches du dossier et distinguer les statuts des installations.", sources: "Comprendre le périmètre, les limites et la traçabilité de cette édition." }[view]

  useEffect(() => {
    if (detail && !dialogRef.current?.open) dialogRef.current?.showModal()
    if (!detail && dialogRef.current?.open) dialogRef.current?.close()
  }, [detail])

  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === "Escape") { setPresentation(false); setMenuOpen(false) } }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [])

  function navigate(next: View) { setView(next); setMenuOpen(false); setQuery("") }
  function changeDataset(next: DatasetKey) {
    setDatasetKey(next); setSelectedCountry("all"); setRegion("all"); setQuery("")
    const nextYears = availableYears((next === "production" ? data.production : data[next]) ?? data.research)
    if (!nextYears.includes(year)) setYear(nextYears.at(-1) || 2024)
  }
  function openCountry(country: EnergyCountry, nextMetric = metric) { setDetail({ country, row: getObservation(dataset, country.code, year, nextMetric), metric: nextMetric }) }
  function reset() { setSelectedCountry("all"); setRegion("all"); setQuery("") }

  function downloadCsv() {
    const headings = ["Pays", "ISO3", "Année exacte", "Indicateur", "Valeur", "Unité", "Jeu de données", "Source", "URL", "Publication", "Confiance de recherche", "Provisoire", "Notes"]
    const exportCountries = view === "compare" ? dataset.countries.filter(c => comparison.includes(c.code) && (region === "all" || c.region === region)) : countries
    const exportMetrics = view === "compare" ? Object.keys(METRICS) as Metric[] : [metric]
    const rows = exportCountries.flatMap(country => exportMetrics.map(key => {
      const row = getObservation(dataset, country.code, year, key)
      return [country.name, country.code, year, METRICS[key].label, metricValue(row, key), METRICS[key].unit, datasetKey === "production" ? `Production · copie du ${data.productionSnapshot?.capturedAt.slice(0, 10)}` : datasetKey === "research" ? "Dossier de recherche septembre 2026" : "Ancienne base locale", row?.source?.name, row?.source?.url, row?.source?.published, row?.confidence, row ? row.provisional ? "Oui" : "Non signalé" : "", [metricIssue(row, key), row ? row.notes : "Observation absente"].filter(Boolean).join(" | ")]
    }))
    const blob = new Blob(["\ufeff" + [headings, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `AIEM-${datasetKey}-${view === "compare" ? "comparaison" : metric}-${year}.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const metricSelect = <label className={styles.metricSelect}><span className={styles.srOnly}>Indicateur affiché</span><select value={metric} onChange={e => setMetric(e.target.value as Metric)}>{Object.entries(METRICS).map(([key, m]) => <option key={key} value={key}>{m.short}</option>)}</select></label>
  const atlas = <EnergyAtlas countries={dataset.countries} values={values} selectedCountry={selectedCountry} onSelectCountry={code => { setSelectedCountry(code); setRegion("all"); setQuery("") }} assets={filteredAssets} showAssets={showAssets || view === "assets"} unit={currentMetric.unit} metricLabel={currentMetric.label} />

  return <div className={`${styles.workspace} ${presentation ? styles.presentation : ""}`} lang="fr" dir="ltr">
    <a href="#preview-main" className={styles.skipLink}>Aller au contenu</a>
    {menuOpen && <button className={styles.scrim} aria-label="Fermer la navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} aria-label="Navigation principale">
      <Link href="/preview" className={styles.brand}><span className={styles.brandMark}><Globe2 size={24} strokeWidth={1.4} /></span><span>AIEM<span className={styles.brandSub}>AFRICA ENERGY INTELLIGENCE</span></span></Link>
      <div className={styles.platformLabel}>ESPACE D’ANALYSE</div>
      <nav>{NAV.map(item => <button key={item.key} className={`${styles.navItem} ${view === item.key ? styles.navActive : ""}`} aria-current={view === item.key ? "page" : undefined} onClick={() => navigate(item.key)}><item.icon size={18} strokeWidth={1.65} /><span>{item.label}</span>{view === item.key && <span className={styles.navDot} />}</button>)}</nav>
      <div className={styles.sidebarBottom}>
        <div className={styles.edition}><span className={styles.editionIcon}><Layers3 size={19} /></span><strong>Une perspective continentale</strong><p>Ressources, infrastructures<br />et données de référence.</p><span>ÉDITION · SEPTEMBRE 2026</span></div>
        <div className={styles.appo}><Image src="/appo_logo.jpeg" width={37} height={37} alt="APPO" /><span><strong>APPO</strong><small>Organisation des Producteurs<br />de Pétrole Africains</small></span></div>
        <Link className={styles.original} href="/"><ArrowLeft size={14} /> Application actuelle <ArrowUpRight size={13} /></Link>
      </div>
    </aside>

    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.breadcrumb}><button className={styles.mobileMenu} onClick={() => setMenuOpen(!menuOpen)} aria-label="Ouvrir la navigation"><Menu size={20} /></button><Globe2 size={15} /><span>Observatoire de l’énergie</span><ChevronRight size={13} /><strong>{NAV.find(n => n.key === view)?.label}</strong></div>
        <div className={styles.topActions}><span className={styles.previewBadge}><span /> Aperçu local</span><button className={styles.helpButton} aria-label="Consulter la méthode" onClick={() => navigate("sources")}><CircleHelp size={19} /></button><span className={styles.language}>FR</span></div>
      </header>

      <main id="preview-main" className={styles.main}>
        <div className={styles.pageHeading}><div><div className={styles.eyebrow}>AFRICA INTERACTIVE ENERGY MAP <span>/</span> {data.snapshot}</div><h1>{title}<span>.</span></h1><p>{description}</p></div><div className={styles.headingActions}><button className={styles.secondaryButton} onClick={() => setPresentation(!presentation)}>{presentation ? <PanelLeftClose size={16} /> : <Presentation size={16} />}{presentation ? "Quitter la présentation" : "Présenter"}</button>{view !== "assets" && view !== "sources" && <button className={styles.primaryButton} onClick={downloadCsv}><ArrowDownToLine size={15} /> Exporter les données</button>}</div></div>

        <section className={styles.filters} aria-label="Filtres de l’analyse">
          <div className={styles.filterIcon}><SlidersHorizontal size={16} /></div>
          <label><span>JEU DE DONNÉES</span><select aria-label="Jeu de données" value={datasetKey} onChange={e => changeDataset(e.target.value as DatasetKey)}><>{data.production && <option value="production">Production · copie du {data.productionSnapshot?.capturedAt.slice(0, 10).split("-").reverse().join("/")}</option>}<option value="research">Dossier documenté</option><option value="local">Ancienne base locale</option></></select></label>
          <label><span>ANNÉE DES SÉRIES</span><select aria-label="Année des séries" value={year} onChange={e => setYear(Number(e.target.value))}>{years.map(y => <option key={y}>{y}</option>)}</select></label>
          <label><span>RÉGION</span><select aria-label="Région" value={region} onChange={e => { setRegion(e.target.value); setSelectedCountry("all") }}><option value="all">Toutes les régions</option>{Object.entries(REGIONS).filter(([key]) => dataset.countries.some(c => c.region === key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className={styles.countryFilter}><span>PAYS</span><select aria-label="Pays" disabled={view === "compare"} value={view === "compare" ? "all" : selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setQuery("") }}><option value="all">{view === "compare" ? "Sélection dans le comparateur" : "Tous les pays du périmètre"}</option>{dataset.countries.filter(c => region === "all" || c.region === region).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
          <button className={styles.resetButton} onClick={reset}>Réinitialiser</button>
        </section>
        <div className={`${styles.dataNotice} ${datasetKey === "local" ? styles.localNotice : ""}`}><Info size={14} /><span>{datasetKey === "production" ? `Référence : base en ligne, copie locale du ${data.productionSnapshot?.capturedAt.slice(0, 10)}. Consultation isolée ; sources et périmètres à valider.` : datasetKey === "research" ? "Dossier de recherche sourcé, à valider. Seuil de confiance : moyen ou élevé. Les données absentes restent visibles." : "Ancienne base locale : instantané obsolète, conservé pour comparer. Ses écarts ne décrivent pas les données actuellement en ligne."}</span><button onClick={() => navigate("sources")}>Méthode <ArrowRight size={12} /></button></div>

        {view === "overview" && <>
          <section className={styles.kpiGrid} aria-label="Indicateurs de synthèse">
            {(["oil", "gas", "oilReserves"] as Metric[]).map((key, i) => {
              const entries = countries.map(c => metricValue(getObservation(dataset, c.code, year, key), key)).filter((v): v is number => v !== null)
              const sum = entries.length ? entries.reduce((a, b) => a + b, 0) : null
              const m = METRICS[key]; const Icon = i === 0 ? Droplets : i === 1 ? Flame : Layers3
              return <button key={key} className={`${styles.kpiCard} ${metric === key ? styles.kpiActive : ""}`} onClick={() => setMetric(key)} aria-pressed={metric === key}><div className={styles.kpiLabel}><span>{m.short}</span><Icon size={18} strokeWidth={1.6} /></div><div className={styles.kpiValue}>{formatNumber(sum, i === 0 ? 0 : 1)} <span>{m.unit}</span></div><div className={styles.kpiFoot}><span className={styles.smallDot} />{entries.length}/{countries.length} pays renseignés <span>· {year}</span></div><div className={styles.kpiFine}>Somme du périmètre renseigné</div></button>
            })}
            <button className={styles.kpiCard} onClick={() => navigate("assets")}><div className={styles.kpiLabel}><span>Fiches d’infrastructure</span><Factory size={18} strokeWidth={1.6} /></div><div className={styles.kpiValue}>{assets.length}<span> fiches</span></div><div className={styles.kpiFoot}><span className={styles.goldDot} />{countries.length} pays dans le périmètre</div><div className={styles.kpiFine}>Inventaire documentaire · tous statuts</div></button>
          </section>
        </>}

        {(view === "overview" || view === "atlas") && <section className={`${styles.analysisGrid} ${view === "atlas" ? styles.atlasGrid : ""}`}>
          <div className={styles.card}><div className={styles.cardHeader}><div><h2>Une perspective africaine</h2><p>{currentMetric.short} · {year} · {currentMetric.unit}</p></div>{metricSelect}</div><div className={styles.mapFrame}>{atlas}</div><div className={styles.mapFooter}><span><span className={styles.smallDot} />{coverage} pays renseignés sur {countries.length}</span><button onClick={() => view === "overview" ? navigate("atlas") : reset()}>{view === "overview" ? "Explorer l’atlas" : "Vue continentale"}<Maximize2 size={13} /></button></div>{view === "atlas" && <div className={styles.mapLayers}><label><input type="checkbox" checked={showAssets} onChange={e => setShowAssets(e.target.checked)} /> Afficher les infrastructures</label><select aria-label="Couche d’infrastructures" value={assetKind} onChange={e => { setAssetKind(e.target.value as AssetKind); setAssetStatus("all") }}>{Object.entries(ASSETS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span>Inventaire · indépendant de l’année des séries</span></div>}</div>
          <aside className={`${styles.card} ${styles.rankingCard}`}><div className={styles.cardHeader}><div><div className={styles.overline}>{selected ? "FOCUS PAYS" : "REPÈRES NATIONAUX"}</div><h2>{selected ? selected.name : "Principaux contributeurs"}</h2><p>{currentMetric.short} · {year}</p></div><ChartNoAxesCombined size={19} /></div>
            {ranked.length ? <div className={styles.rankingList}>{ranked.slice(0, 6).map(({ country, value }, i) => <button key={country.code} className={styles.rankRow} onClick={() => openCountry(country)}><div className={styles.rankTop}><span className={styles.rankNumber}>{String(i + 1).padStart(2, "0")}</span><strong>{country.name}</strong><span>{formatNumber(value)}</span></div><div className={styles.rankTrack}><span style={{ width: `${ranked[0].value ? value / ranked[0].value * 100 : 0}%` }} /></div></button>)}</div> : <div className={styles.emptyState}>Aucune observation pour ce périmètre en {year}.</div>}
            <div className={styles.rankingNote}>Valeurs en {currentMetric.unit}. Classement limité aux pays renseignés du périmètre sélectionné.</div><button className={styles.textButton} onClick={() => navigate("compare")}>Comparer les pays <ArrowRight size={15} /></button>
          </aside>
        </section>}

        {view === "overview" && <section className={styles.bottomGrid}><div className={`${styles.card} ${styles.coverageCard}`}><div className={styles.coverageIcon}><ShieldCheck size={22} strokeWidth={1.5} /></div><div><div className={styles.overline}>LIRE LES CHIFFRES AVEC LEUR CONTEXTE</div><h2>La traçabilité fait partie de l’analyse.</h2><p>{coverage} pays disposent d’une valeur de {currentMetric.short.toLowerCase()} pour {year}. {countries.length - coverage} restent sans observation affichable. Ce taux mesure la présence d’une valeur, pas sa validation.</p><button className={styles.textButton} onClick={() => navigate("sources")}>Comprendre la couverture <ArrowRight size={14} /></button></div><div className={styles.coverageFigure}><strong>{covered}<span>%</span></strong><small>de couverture</small></div></div><button className={`${styles.card} ${styles.inventoryLink}`} onClick={() => navigate("assets")}><span className={styles.overline}>AU-DELÀ DES VOLUMES</span><h2>L’écosystème énergétique</h2><p>Bassins, raffinage, GNL,<br />formation et recherche.</p><span className={styles.inventoryArrow}><ArrowUpRight size={23} /></span></button></section>}

        {(view === "data" || view === "overview") && <section className={styles.card}><div className={styles.cardHeader}><div><h2>{view === "overview" ? "Les chiffres derrière la carte" : "Observations nationales"}</h2><p>{currentMetric.label} · {year} · {countries.length} pays dans la sélection</p></div>{view === "overview" ? <button className={styles.textButton} onClick={() => navigate("data")}>Toutes les données <ArrowRight size={14} /></button> : <div className={styles.tableTools}>{metricSelect}<label className={styles.search}><Search size={15} /><input aria-label="Rechercher un pays" placeholder="Rechercher un pays…" value={query} onChange={e => setQuery(e.target.value)} /></label></div>}</div><div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Pays</th><th>Région</th><th className={styles.numeric}>Valeur · {currentMetric.unit}</th><th>Année</th><th>Documentation</th><th><span className={styles.srOnly}>Détail</span></th></tr></thead><tbody>{records.slice(0, view === "overview" ? 5 : undefined).map(({ country, row }) => <tr key={country.code}><td><button className={styles.countryName} onClick={() => openCountry(country)}><span className={styles.isoCode}>{country.code}</span>{country.name}</button></td><td>{REGIONS[country.region] || country.region}</td><td className={styles.numeric}><strong>{formatNumber(metricValue(row, metric))}</strong></td><td>{year}</td><td><span className={`${styles.statusTag} ${(!row?.source || metricValue(row, metric) == null) ? styles.pendingTag : ""}`}>{metricIssue(row, metric) ? "Écartée · à réviser" : metricValue(row, metric) == null ? "Non disponible" : row?.source ? row.provisional ? "Référence · provisoire" : datasetKey === "production" ? "Référence concordante" : "Source disponible" : "À rapprocher"}</span></td><td><button className={styles.rowAction} aria-label={`Voir la source : ${country.name}`} onClick={() => openCountry(country)}><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table>{!countries.length && <div className={styles.emptyState}>Aucun pays ne correspond à votre recherche. <button onClick={reset}>Réinitialiser les filtres</button></div>}</div><div className={styles.tableFoot}>{datasetKey === "research" ? "N.D. : donnée non disponible pour l’année exacte. Les zéros du dossier restent distincts des données manquantes." : "N.D. : observation absente ou écartée de l’aperçu. Un zéro stocké peut être technique et ne prouve pas une absence d’activité ; consulter la note de source."}</div></section>}

        {view === "compare" && <Comparison documented={datasetKey !== "local"} dataset={dataset} countries={dataset.countries.filter(c => region === "all" || c.region === region)} year={year} metric={metric} metricSelect={metricSelect} selected={comparison} onChange={setComparison} onDetail={openCountry} />}

        {view === "assets" && <section className={styles.card}><div className={styles.cardHeader}><div><h2>Inventaire des infrastructures</h2><p>{filteredAssets.length} fiches · instantané documentaire, indépendant de l’année des séries</p></div><div className={styles.tableTools}><select aria-label="Type d’infrastructure" value={assetKind} onChange={e => { setAssetKind(e.target.value as AssetKind); setAssetStatus("all") }}>{Object.entries(ASSETS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select aria-label="Statut d’infrastructure" value={assetStatus} onChange={e => setAssetStatus(e.target.value)}><option value="all">Tous les statuts</option>{[...new Set(assets.filter(a => a.kind === assetKind).map(a => a.status))].sort().map(status => <option key={status} value={status}>{STATUSES[status] || status}</option>)}</select></div></div><div className={styles.assetNotice}><Info size={15} />Une fiche ne garantit pas un actif unique. Coordonnées indicatives ; doublons et statuts restent à réconcilier.</div><div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Installation / organisme</th><th>Pays</th><th>Statut déclaré</th>{assetKind === "refineries" && <th className={styles.numeric}>Capacité nominale · kb/j</th>}<th>Source</th></tr></thead><tbody>{filteredAssets.map(a => <tr key={a.id}><td><button className={styles.countryName} onClick={() => setDetail({ asset: a })}>{a.name}</button></td><td>{a.countries.map(code => dataset.countries.find(c => c.code === code)?.name || code).join(", ")}</td><td><span className={`${styles.statusTag} ${a.status !== "operational" ? styles.pendingTag : ""}`}>{STATUSES[a.status] || a.status}</span></td>{assetKind === "refineries" && <td className={styles.numeric}>{formatNumber(a.capacity)}</td>}<td><button className={styles.rowAction} aria-label={`Consulter ${a.name}`} onClick={() => setDetail({ asset: a })}><BookOpen size={16} /></button></td></tr>)}</tbody></table>{!filteredAssets.length && <div className={styles.emptyState}>Aucune fiche ne correspond à ces filtres.</div>}</div></section>}

        {view === "sources" && <Sources dataset={dataset} datasetKey={datasetKey} year={year} countries={countries} excluded={data.research.excluded} onMetric={key => { setMetric(key); navigate("data") }} onPrint={() => window.print()} />}

        <footer className={styles.footer}><span>APPO <span> / </span> Africa Interactive Energy Map</span><span>Proposition de design · Évaluation locale · Septembre 2026</span></footer>
      </main>
    </div>

    <dialog ref={dialogRef} className={styles.detailDialog} onClose={() => setDetail(null)} onClick={e => { if (e.target === e.currentTarget) setDetail(null) }} aria-labelledby="detail-heading">{detail && <div className={styles.detailContent}><div className={styles.detailTop}><span className={styles.overline}>FICHE DE LECTURE</span><button aria-label="Fermer le détail" className={styles.rowAction} onClick={() => setDetail(null)}><X size={20} /></button></div>{"asset" in detail ? <><h2 id="detail-heading">{detail.asset.name}</h2><p>{ASSETS[detail.asset.kind]} · {STATUSES[detail.asset.status] || detail.asset.status}</p>{detail.asset.capacity != null && <div className={styles.detailValue}>{formatNumber(detail.asset.capacity)}<span>kb/j · capacité nominale</span></div>}<SourceNote source={detail.asset.source} notes={detail.asset.notes} /></> : <><h2 id="detail-heading">{detail.country.name}</h2><p>{METRICS[detail.metric].label} · {year}</p><div className={styles.detailValue}>{formatNumber(metricValue(detail.row, detail.metric))}<span>{METRICS[detail.metric].unit}</span></div><div className={styles.definition}>{METRICS[detail.metric].definition}</div>{metricIssue(detail.row, detail.metric) && <div className={styles.reviewIssue}><strong>Valeur écartée des calculs de l’aperçu</strong><p>{metricIssue(detail.row, detail.metric)}</p><p>Valeur brute enregistrée : {formatNumber(detail.metric === "gas" || detail.metric === "gasReserves" ? detail.row?.gas ?? null : detail.row?.oil ?? null)} {detail.metric === "gas" ? "M m³/an" : METRICS[detail.metric].unit}.</p></div>}<SourceNote source={detail.row?.source || null} notes={detail.row?.notes || "Aucune observation disponible pour cette année. Aucune valeur d’une autre année n’est substituée."} /><div className={styles.detailMeta}><span>Qualification de l’observation</span><strong>{detail.row?.confidence === "production-snapshot" ? "Extrait de production" : detail.row?.confidence === "high" ? "Élevée" : detail.row?.confidence === "medium" ? "Moyenne" : "Non évaluée"}</strong><span>Valeur provisoire</span><strong>{detail.row ? detail.row.provisional ? "Oui" : "Non signalée" : "Sans observation"}</strong></div></>}<div className={styles.detailCaution}><Info size={16} />Une référence documentaire n’équivaut pas à une validation institutionnelle.</div></div>}</dialog>
  </div>
}

function SourceNote({ source, notes }: { source: Observation["source"]; notes: string }) {
  return <div className={styles.sourceNote}><h3>Source & traçabilité</h3>{source ? <><strong>{source.name}</strong><p>{source.detail}</p>{source.published && <p>Publication : {source.published}</p>}{source.url && <a href={source.url} target="_blank" rel="noopener noreferrer">Consulter la publication <ExternalLink size={14} /></a>}</> : <p>Aucune provenance attachée à cette observation dans le jeu sélectionné.</p>}{notes && <><h3>Note de lecture du dossier</h3><p className={styles.rawNotes}>{notes}</p></>}</div>
}

function Comparison({ documented, dataset, countries, year, metric, metricSelect, selected, onChange, onDetail }: { documented: boolean; dataset: EnergyDataset; countries: EnergyCountry[]; year: number; metric: Metric; metricSelect: React.ReactNode; selected: string[]; onChange: (codes: string[]) => void; onDetail: (country: EnergyCountry, metric?: Metric) => void }) {
  const chosen = countries.filter(c => selected.includes(c.code))
  const years = availableYears(dataset)
  const colors = ["#225b60", "#b48641", "#648d9e", "#806b87"]
  const points = chosen.map(country => years.map(y => metricValue(getObservation(dataset, country.code, y, metric), metric)))
  const max = Math.max(1, ...points.flat().filter((v): v is number => v != null)) * 1.12
  const x = (index: number) => 68 + index * 680 / Math.max(years.length - 1, 1)
  const y = (value: number) => 254 - value / max * 215
  return <div className={styles.comparisonLayout}><section className={styles.card}><div className={styles.cardHeader}><div><h2>Choisir les pays</h2><p>Jusqu’à 4 pays · filtre régional appliqué</p></div></div><div className={styles.compareChoices}>{countries.map(country => <label key={country.code}><input type="checkbox" checked={selected.includes(country.code)} disabled={!selected.includes(country.code) && chosen.length >= 4} onChange={() => onChange(selected.includes(country.code) ? selected.filter(code => code !== country.code) : [...selected.filter(code => countries.some(c => c.code === code)), country.code])} /><span>{country.name}</span><small>{country.code}</small></label>)}</div></section><div><section className={styles.card}><div className={styles.cardHeader}><div><h2>Évolution des observations</h2><p>{METRICS[metric].label} · {METRICS[metric].unit} · aucune interpolation ; ruptures documentées non reliées</p></div>{metricSelect}</div>{chosen.length ? <><div className={styles.chart}><svg viewBox="0 0 810 300" role="img" aria-label={`Évolution de ${METRICS[metric].label}. Les valeurs détaillées figurent dans le tableau accessible sous le graphique.`}>{[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="68" x2="748" y1={y(max / 4 * i)} y2={y(max / 4 * i)} stroke="#e9edef" /><text x="55" y={y(max / 4 * i) + 4} textAnchor="end" fill="#75818a" fontSize="11">{formatNumber(max / 4 * i, 0)}</text></g>)}{years.map((yr, i) => <text x={x(i)} y="284" textAnchor="middle" key={yr} fill="#75818a" fontSize="12">{yr}</text>)}{points.map((series, index) => <g key={chosen[index].code}>{series.map((value, i) => value == null ? null : <g key={i}>{i > 0 && series[i - 1] != null && !(documented && hasSeriesBreak(chosen[index].code, years[i], metric)) && <line x1={x(i - 1)} y1={y(series[i - 1]!)} x2={x(i)} y2={y(value)} stroke={colors[index]} strokeWidth="2.5" />}<circle cx={x(i)} cy={y(value)} r="4" fill="white" stroke={colors[index]} strokeWidth="2"><title>{chosen[index].name} · {years[i]} : {formatNumber(value)} {METRICS[metric].unit}</title></circle></g>)}</g>)}</svg></div><div className={styles.chartLegend}>{chosen.map((c, i) => <span key={c.code}><i style={{ background: colors[i] }} />{c.name}</span>)}</div><details className={styles.chartValues}><summary>Consulter les valeurs du graphique</summary><div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Pays</th>{years.map(y => <th key={y}>{y}</th>)}</tr></thead><tbody>{chosen.map((c, i) => <tr key={c.code}><td>{c.name}</td>{points[i].map((v, j) => <td key={j}>{formatNumber(v)}</td>)}</tr>)}</tbody></table></div></details></> : <div className={styles.emptyState}>Sélectionnez au moins un pays pour afficher la comparaison.</div>}</section><section className={`${styles.card} ${styles.compareTable}`}><div className={styles.cardHeader}><div><h2>Lecture comparée · {year}</h2><p>Cliquez sur une valeur pour consulter sa source.</p></div></div><div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Indicateur</th>{chosen.map(c => <th key={c.code}>{c.name}</th>)}</tr></thead><tbody>{Object.entries(METRICS).map(([key, m]) => <tr key={key}><td>{m.short}<small className={styles.unitLine}>{m.unit}</small></td>{chosen.map(c => <td key={c.code}><button className={styles.valueButton} onClick={() => onDetail(c, key as Metric)}>{formatNumber(metricValue(getObservation(dataset, c.code, year, key as Metric), key as Metric))}<ArrowUpRight size={12} /></button></td>)}</tr>)}</tbody></table></div></section></div></div>
}

function Sources({ dataset, datasetKey, year, countries, excluded, onMetric, onPrint }: { dataset: EnergyDataset; datasetKey: DatasetKey; year: number; countries: EnergyCountry[]; excluded: number; onMetric: (metric: Metric) => void; onPrint: () => void }) {
  const sources = useMemo(() => [...new Map([...dataset.production, ...dataset.reserves, ...dataset.assets].flatMap(row => row.source ? [[row.source.url + row.source.name, row.source] as const] : [])).values()], [dataset])
  return <><div className={styles.sourcesIntro}><BookOpen size={29} strokeWidth={1.3} /><div><div className={styles.overline}>NOTE MÉTHODOLOGIQUE</div><h2>Documenté ne signifie pas encore validé.</h2><p>La base en ligne constitue la référence actuelle. Sa copie locale, le dossier de recherche et l’ancienne base locale restent distincts. Le rapprochement confirme l’intégration des valeurs documentées ; il ne constitue pas une certification métier. Cet aperçu ne modifie aucune valeur stockée.</p></div><button className={styles.secondaryButton} onClick={onPrint}>Imprimer la note</button></div><div className={styles.methodGrid}>{[
    ["01", "Un millésime exact", "Chaque observation correspond strictement à l’année choisie. Aucun report de la dernière valeur connue ; aucune donnée future affichée comme historique."],
    ["02", "Un périmètre explicite", "Les sommes couvrent seulement les pays renseignés de la sélection. Elles ne représentent pas un total officiel pour l’Afrique ou pour l’APPO."],
    ["03", "Des unités distinctes", "Brut : kb/j. Gaz : Gm³/an (M m³ ÷ 1 000). Réserves : Gbbl et Tcf. Capacités de raffinage : kb/j nominaux, indépendants de la production réelle."],
    ["04", "Des lacunes préservées", `N.D. désigne une absence d’observation affichable. ${excluded} lignes du dossier ont une confiance insuffisante ou un statut exclu ; elles ne sont pas utilisées dans cet aperçu.`],
  ].map(([n, title, text]) => <article className={styles.methodCard} key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div><section className={styles.card}><div className={styles.cardHeader}><div><h2>Couverture effective · {year}</h2><p>{datasetKey === "production" ? "Production · copie locale" : datasetKey === "research" ? "Dossier documenté" : "Ancienne base locale"} · périmètre sélectionné · aucune mesure de certification</p></div></div><div className={styles.coverageRows}>{Object.entries(METRICS).map(([key, m]) => { const count = countries.filter(c => metricValue(getObservation(dataset, c.code, year, key as Metric), key as Metric) != null).length; return <button key={key} onClick={() => onMetric(key as Metric)}><span>{m.short}</span><div><span style={{ width: `${countries.length ? count / countries.length * 100 : 0}%` }} /></div><strong>{count} / {countries.length} pays</strong><ArrowRight size={14} /></button> })}</div></section><section className={`${styles.card} ${styles.reviewPoints}`}><div className={styles.cardHeader}><div><h2>Points identifiés lors de la revue</h2><p>Les valeurs litigieuses ne constituent pas des corrections automatiquement importées.</p></div><ShieldCheck size={20} /></div><ul><li><strong>Référence en ligne confirmée.</strong> Les 69 lignes documentées de production et les 45 de réserves sont présentes en production. Leurs mesures renseignées concordent avec le dossier. Les anciens écarts Angola / Libye / Sénégal concernent la base locale obsolète.</li><li><strong>Commerce extérieur.</strong> Les anciennes erreurs de volumes gaziers ont été corrigées en production. La définition intra/extra et les mélanges de catégories doivent encore être vérifiés ; ces flux ne sont pas utilisés dans la synthèse proposée.</li><li><strong>Inventaires.</strong> Des alias et doublons existent. Les volumes affichés sont des fiches documentaires, sans présumer du nombre d’installations distinctes.</li><li><strong>Périmètres incompatibles.</strong> Angola 2025 brut + condensats et Nigéria 2025 réserves 2P sont écartés des agrégats. Les ruptures de source Libye gaz / Tchad pétrole en 2025 ne sont pas reliées dans les courbes.</li><li><strong>Statut APPO.</strong> La production comporte les 18 membres attendus. Les 21 drapeaux de l’ancienne base locale ne sont pas le référentiel actuel.</li><li><strong>Gaz sénégalais.</strong> Le zéro du dossier avant GTA doit être rapproché de la production historique de Gadiaga. Ces zéros sont écartés dans l’aperçu ; les valeurs brutes restent lisibles dans les fiches de source.</li></ul></section><section className={styles.card}><div className={styles.cardHeader}><div><h2>Références du jeu de données</h2><p>{sources.length} références distinctes enregistrées dans ce jeu. Les détails propres à chaque observation sont accessibles depuis les tableaux.</p></div></div><div className={styles.sourceDirectory}>{sources.length ? sources.map(s => <a key={s.url + s.name} href={s.url || undefined} target="_blank" rel="noopener noreferrer"><BookOpen size={17} /><div><strong>{s.name}</strong><p>{s.published || "Date de publication non renseignée"}</p></div><ExternalLink size={15} /></a>) : <p>Ce jeu ne stocke pas de source par observation. Les références concordantes de la copie de production reposent sur un rapprochement des valeurs pétrole et gaz ; elles ne prouvent pas, à elles seules, la provenance de l’écriture.</p>}</div></section></>
}
