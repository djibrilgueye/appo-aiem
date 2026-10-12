import { readFile } from "node:fs/promises"
import path from "node:path"
import { prisma } from "@/lib/prisma"
import type { AssetKind, DataSource, EnergyAsset, EnergyCountry, Observation, PreviewData } from "./types"
import { getReviewIssues, type ReviewSeries } from "./review-issues"
import { readProductionSnapshot } from "./production-snapshot"

type ArchiveRow = Record<string, unknown>

const countryNames: Record<string, string> = {
  DZA: "Algérie", AGO: "Angola", BEN: "Bénin", CMR: "Cameroun", COG: "Congo", COD: "RD Congo",
  CIV: "Côte d’Ivoire", EGY: "Égypte", GNQ: "Guinée équatoriale", GAB: "Gabon", GHA: "Ghana",
  LBY: "Libye", NAM: "Namibie", NER: "Niger", NGA: "Nigéria", SEN: "Sénégal", ZAF: "Afrique du Sud",
  TCD: "Tchad", SDN: "Soudan", SSD: "Soudan du Sud", TGO: "Togo",
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function source(value: unknown): DataSource | null {
  if (!value || typeof value !== "object") return null
  const s = value as ArchiveRow
  // Some archive entries append a mirror URL in prose. Only use the first URL as href.
  const url = String(s.url || "").match(/https?:\/\/[^\s<>"()]+/)?.[0] || ""
  return { name: String(s.name || "Source non précisée"), url, detail: String(s.table_or_page || ""), published: String(s.published || "") }
}

async function archive(name: string): Promise<ArchiveRow[]> {
  return JSON.parse(await readFile(path.join(process.cwd(), "data/research-2026-09", `${name}.json`), "utf8"))
}

function observation(row: ArchiveRow, documented: boolean, series: ReviewSeries = "production"): Observation {
  return {
    country: String(row.country), year: Number(row.year), oil: number(row.oil), gas: number(row.gas),
    source: documented ? source(row.source) : null, confidence: String(row.confidence || "unreviewed"),
    provisional: Boolean(row.provisional), notes: String(row.notes || (documented ? "" : "Valeur de la base locale. Provenance non enregistrée au niveau de l’observation ; rapprochement nécessaire avant présentation.")),
    issues: documented ? getReviewIssues(String(row.country), Number(row.year), series) : {},
  }
}

function parseArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try { const result: unknown = JSON.parse(value); return Array.isArray(result) ? result : [] } catch { return [] }
  }
  return []
}

function asset(row: ArchiveRow, kind: AssetKind, index: number, documented: boolean): EnergyAsset {
  const coords = parseArray(row.coords).filter((p): p is [number, number] => Array.isArray(p) && p.length >= 2 && number(p[0]) !== null && number(p[1]) !== null)
  return {
    id: `${kind}-${index}`, name: String(row.name), kind,
    countries: row.country ? [String(row.country)] : parseArray(row.countries).map(String),
    lat: number(row.lat), lon: number(row.lon), coords,
    status: String(row.status || "unknown"), capacity: kind === "refineries" ? number(row.capacityKbd) : null,
    source: documented ? source(row.source) : null, notes: String(row.notes || ""),
  }
}

// No import or correction is performed here. The two datasets remain separate.
export async function getPreviewData(): Promise<PreviewData> {
  const countryRows = await prisma.country.findMany({
    select: { id: true, code: true, name: true, region: true, lat: true, lon: true, active: true },
  })
  const byId = new Map(countryRows.map(c => [c.id, c.code]))
  const countries: EnergyCountry[] = countryRows.map(c => ({ code: c.code, name: countryNames[c.code] || c.name, region: c.region, lat: c.lat, lon: c.lon })).sort((a, b) => a.name.localeCompare(b.name, "fr"))
  const kinds: [AssetKind, string][] = [["refineries", "refineries"], ["pipelines", "pipelines"], ["basins", "basins"], ["storage", "storage"], ["training", "training"], ["rnd", "rnd_centers"], ["petrochem", "petrochem"]]
  const [production, reserves, inventories, localProduction, localReserves, ...localInventories] = await Promise.all([
    archive("production"), archive("reserves"), Promise.all(kinds.map(([, name]) => archive(name))),
    prisma.production.findMany({ where: { country: { active: true } }, select: { countryId: true, year: true, oil: true, gas: true } }),
    prisma.reserve.findMany({ where: { country: { active: true } }, select: { countryId: true, year: true, oil: true, gas: true } }),
    prisma.refinery.findMany({ where: { country: { active: true } }, select: { name: true, countryId: true, lat: true, lon: true, capacityKbd: true, status: true } }),
    readLocalPipelines(),
    prisma.basin.findMany({ where: { country: { active: true } }, select: { name: true, countryId: true, lat: true, lon: true, status: true } }),
    prisma.storage.findMany({ where: { country: { active: true } }, select: { name: true, countryId: true, lat: true, lon: true, status: true } }),
    prisma.training.findMany({ where: { country: { active: true } }, select: { name: true, countryId: true, lat: true, lon: true, status: true } }),
    prisma.rnDCenter.findMany({ where: { country: { active: true } }, select: { name: true, countryId: true, lat: true, lon: true, status: true } }),
    prisma.petrochemical.findMany({ where: { country: { active: true } }, select: { name: true, countryId: true, lat: true, lon: true, status: true } }),
  ])
  const eligible = (row: ArchiveRow) => ["high", "medium"].includes(String(row.confidence)) && !/cancelled|shelved/i.test(String(row.status))
  const researchCountries = new Set([...production, ...reserves].map(row => String(row.country)))
  const allRows = [...production, ...reserves, ...inventories.flat()]
  const data: PreviewData = {
    snapshot: "Septembre 2026",
    research: {
      countries: countries.filter(c => researchCountries.has(c.code)),
      production: production.filter(eligible).map(row => observation(row, true)),
      reserves: reserves.filter(eligible).map(row => observation(row, true, "reserves")),
      assets: inventories.flatMap((rows, i) => rows.filter(eligible).map((row, index) => asset(row, kinds[i][0], index, true))),
      excluded: allRows.filter(row => !eligible(row)).length,
    },
    local: {
      countries: countries.filter(c => countryRows.some(row => row.code === c.code && row.active)),
      production: localProduction.map(row => observation({ ...row, country: byId.get(row.countryId) }, false)),
      reserves: localReserves.map(row => observation({ ...row, country: byId.get(row.countryId) }, false)),
      assets: localInventories.flatMap((rows, i) => rows.map((row, index) => asset({ ...row, country: "countryId" in row ? byId.get(String(row.countryId)) : undefined }, kinds[i][0], index, false))),
      excluded: 0,
    },
  }
  const productionSnapshot = await readProductionSnapshot(countryNames, data.research)
  if (productionSnapshot) {
    data.production = productionSnapshot.dataset
    data.productionSnapshot = productionSnapshot.metadata
  }
  return data
}

async function readLocalPipelines(): Promise<{ name: string; countries: string; coords: string; status: string }[]> {
  // Older local snapshots predate the visibility column. Read without migrating the user's database.
  const columns = await prisma.$queryRaw<{ name: string }[]>`PRAGMA table_info("Pipeline")`
  if (columns.some(column => column.name === "active")) {
    return prisma.$queryRaw`SELECT name, countries, coords, status FROM Pipeline WHERE active = 1`
  }
  return prisma.$queryRaw`SELECT name, countries, coords, status FROM Pipeline`
}
