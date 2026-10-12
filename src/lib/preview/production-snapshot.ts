import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { PrismaClient } from "@prisma/client"
import type { EnergyDataset, EnergyAsset, AssetKind, Observation, PreviewData } from "./types"

type Snapshot = { dataset: EnergyDataset; metadata: NonNullable<PreviewData["productionSnapshot"]> }

// Only an isolated local extraction is opened. No network connection is made by the preview.
export async function readProductionSnapshot(countryNames: Record<string, string>, research: EnergyDataset): Promise<Snapshot | null> {
  const root = path.join(process.cwd(), "backups")
  let pointer: { file: string; capturedAt: string; origin: string; sha256: string }
  try {
    pointer = JSON.parse(await readFile(path.join(root, "preview-production.json"), "utf8"))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
    throw error
  }
  const filename = path.resolve(root, pointer.file)
  if (!filename.startsWith(root + path.sep) || path.basename(filename) !== "business-snapshot.db") throw new Error("Invalid local snapshot path")
  if (createHash("sha256").update(await readFile(filename)).digest("hex") !== pointer.sha256) throw new Error("The production snapshot changed after extraction")
  const client = new PrismaClient({ datasources: { db: { url: `file:${filename}?mode=ro` } } })
  try {
    const countryRows = await client.country.findMany({ where: { active: true }, select: { id: true, code: true, name: true, region: true, lat: true, lon: true } })
    const byId = new Map(countryRows.map(c => [c.id, c.code]))
    const active = { country: { active: true } }
    const point = { name: true, countryId: true, lat: true, lon: true, status: true } as const
    const [production, reserves, refineries, pipelines, basins, storage, training, rnd, petrochem] = await Promise.all([
      client.production.findMany({ where: active, select: { countryId: true, year: true, oil: true, gas: true } }),
      client.reserve.findMany({ where: active, select: { countryId: true, year: true, oil: true, gas: true } }),
      client.refinery.findMany({ where: active, select: { ...point, capacityKbd: true } }),
      client.pipeline.findMany({ where: { active: true }, select: { name: true, countries: true, coords: true, status: true } }),
      client.basin.findMany({ where: active, select: point }),
      client.storage.findMany({ where: active, select: point }),
      client.training.findMany({ where: active, select: point }),
      client.rnDCenter.findMany({ where: active, select: point }),
      client.petrochemical.findMany({ where: active, select: point }),
    ])
    function observation(row: { countryId: string; year: number; oil: number; gas: number }, series: "production" | "reserves"): Observation {
      const code = byId.get(row.countryId)!
      const reference = research[series].find(r => r.country === code && r.year === row.year)
      // Matching numbers identify a candidate reference, not proof of a database import's lineage.
      const matches = reference && reference.oil === row.oil && reference.gas === row.gas
      return {
        country: code, year: row.year, oil: row.oil, gas: row.gas,
        source: matches ? reference.source : null, confidence: "production-snapshot", provisional: matches ? reference.provisional : false,
        notes: `Valeur extraite de la base en ligne le ${pointer.capturedAt.slice(0, 10)}. ${matches ? "Les deux valeurs pétrole et gaz concordent avec la référence documentaire ci-dessous. Ce rapprochement numérique ne démontre pas la provenance de l’écriture en base. " + reference.notes : "Aucune provenance individuelle n’est enregistrée dans la table. La valeur reste celle de la production ; elle n’est pas remplacée par le dossier de recherche."}`,
        issues: {
          oil: reference?.oil === row.oil ? reference?.issues?.oil : undefined,
          gas: reference?.gas === row.gas ? reference?.issues?.gas : undefined,
        },
      }
    }
    const groups: [AssetKind, typeof basins][] = [["refineries", refineries], ["basins", basins], ["storage", storage], ["training", training], ["rnd", rnd], ["petrochem", petrochem]]
    const assets: EnergyAsset[] = groups.flatMap(([kind, rows]) => rows.map((row, i) => ({
      id: `${kind}-${i}`, kind, name: row.name, countries: [byId.get(row.countryId)!], lat: row.lat, lon: row.lon,
      coords: [], status: row.status, capacity: "capacityKbd" in row ? Number(row.capacityKbd) : null, source: null,
      notes: "Fiche extraite de la base en ligne. L’historique de provenance est à consulter dans les journaux de campagne ; une source générale ne constitue pas une validation de cette fiche.",
    })))
    const parse = (value: string): unknown[] => { try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed : [] } catch { return [] } }
    for (const [i, row] of pipelines.entries()) {
      assets.push({
        id: `pipelines-${i}`, kind: "pipelines", name: row.name, countries: parse(row.countries).map(String), lat: null, lon: null,
        coords: parse(row.coords).filter((p): p is [number, number] => Array.isArray(p) && p.length >= 2 && p.slice(0, 2).every(v => typeof v === "number" && Number.isFinite(v))),
        status: row.status, capacity: null, source: null, notes: "Pipeline visible en production. Tracé indicatif extrait de la base en ligne.",
      })
    }
    return {
      metadata: { capturedAt: pointer.capturedAt, origin: pointer.origin, sha256: pointer.sha256 },
      dataset: {
        countries: countryRows.map(c => ({ code: c.code, name: countryNames[c.code] || c.name, region: c.region, lat: c.lat, lon: c.lon })).sort((a, b) => a.name.localeCompare(b.name, "fr")),
        production: production.map(r => observation(r, "production")), reserves: reserves.map(r => observation(r, "reserves")), assets, excluded: 0,
      },
    }
  } finally {
    await client.$disconnect()
  }
}
