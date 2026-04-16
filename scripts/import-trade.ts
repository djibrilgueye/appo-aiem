/**
 * Import trade data — Intra-Africa (Sheet 6) + Extra-Africa (Sheet 7)
 * Source: "Donnees Import Export Algerie Angola.xlsx"
 * Year: 2024 — Source: APPO questionnaire
 *
 * Run: npx tsx scripts/import-trade.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ── Raw rows from Excel ────────────────────────────────────────────────────────

interface TradeRow {
  pays: string       // ISO3 code
  partner: string    // country name or region
  sens: "Export" | "Import"
  hydro: string
  unit: string
  qty: number
  sheet: "intra" | "extra"
}

const RAW: TradeRow[] = [
  // ══════════════════════════════════════════
  // SHEET 6 — Commerce Intra-Africain
  // ══════════════════════════════════════════

  // Algérie — Exports intra
  { pays: "DZA", partner: "Tunisie",              sens: "Export", hydro: "Gaz naturel",       unit: "mscf",     qty: 93592,   sheet: "intra" },
  { pays: "DZA", partner: "Afrique du Sud",        sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 2.9,     sheet: "intra" },
  { pays: "DZA", partner: "Egypte",               sens: "Export", hydro: "GPL",               unit: "TM",       qty: 296.6,   sheet: "intra" },
  { pays: "DZA", partner: "Côte d'Ivoire",         sens: "Export", hydro: "GPL",               unit: "TM",       qty: 67.8,    sheet: "intra" },
  { pays: "DZA", partner: "Nigéria",              sens: "Export", hydro: "GPL",               unit: "TM",       qty: 26.2,    sheet: "intra" },
  { pays: "DZA", partner: "Kenya",                sens: "Export", hydro: "GPL",               unit: "TM",       qty: 82.3,    sheet: "intra" },
  { pays: "DZA", partner: "Tunisie",              sens: "Export", hydro: "GPL",               unit: "TM",       qty: 173.9,   sheet: "intra" },
  { pays: "DZA", partner: "Guinée",               sens: "Export", hydro: "Essence",           unit: "TM",       qty: 32.8,    sheet: "intra" },

  // Angola — Exports intra
  { pays: "AGO", partner: "Afrique du Sud",        sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 10.1,    sheet: "intra" },
  { pays: "AGO", partner: "Namibie",              sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 29241,   sheet: "intra" },
  { pays: "AGO", partner: "Sao Tomé et Principe", sens: "Export", hydro: "Essence",           unit: "TM",       qty: 4865,    sheet: "intra" },
  { pays: "AGO", partner: "Sao Tomé et Principe", sens: "Export", hydro: "Jet fuel",          unit: "TM",       qty: 4795,    sheet: "intra" },
  { pays: "AGO", partner: "Sao Tomé et Principe", sens: "Export", hydro: "Gasoil",            unit: "TM",       qty: 12276.1, sheet: "intra" },
  { pays: "AGO", partner: "Togo",                 sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 448688,  sheet: "intra" },
  { pays: "AGO", partner: "Ile Maurice",          sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 67688.3, sheet: "intra" },
  // Angola — Import intra
  { pays: "AGO", partner: "Nigéria",              sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 390511.9,sheet: "intra" },

  // Bénin — Imports intra
  { pays: "BEN", partner: "Nigéria",              sens: "Import", hydro: "Essence",           unit: "TM",       qty: 7951.6,  sheet: "intra" },
  { pays: "BEN", partner: "Côte d'Ivoire",         sens: "Import", hydro: "Jet fuel",          unit: "TM",       qty: 650.8,   sheet: "intra" },
  { pays: "BEN", partner: "Nigéria",              sens: "Import", hydro: "Jet fuel",          unit: "TM",       qty: 423.7,   sheet: "intra" },
  { pays: "BEN", partner: "Cameroun",             sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 213.7,   sheet: "intra" },
  { pays: "BEN", partner: "Côte d'Ivoire",         sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 50.9,    sheet: "intra" },
  { pays: "BEN", partner: "Togo",                 sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 831.6,   sheet: "intra" },
  { pays: "BEN", partner: "Afrique du Sud",        sens: "Import", hydro: "Fuel Oil",          unit: "TM",       qty: 1714.1,  sheet: "intra" },
  { pays: "BEN", partner: "Angola",               sens: "Import", hydro: "Fuel Oil",          unit: "TM",       qty: 1000,    sheet: "intra" },
  { pays: "BEN", partner: "Congo",                sens: "Import", hydro: "Fuel Oil",          unit: "TM",       qty: 300,     sheet: "intra" },
  { pays: "BEN", partner: "Côte d'Ivoire",         sens: "Import", hydro: "Fuel Oil",          unit: "TM",       qty: 12362.9, sheet: "intra" },

  // Congo — Imports & Exports intra
  { pays: "COG", partner: "Togo",                 sens: "Import", hydro: "Essence",           unit: "TM",       qty: 57814.8, sheet: "intra" },
  { pays: "COG", partner: "Afrique de l'Ouest",   sens: "Export", hydro: "Essence",           unit: "TM",       qty: 26016.9, sheet: "intra" },
  { pays: "COG", partner: "Namibie",              sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 19397,   sheet: "intra" },
  { pays: "COG", partner: "Togo",                 sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 200569.2,sheet: "intra" },
  { pays: "COG", partner: "Ile Maurice",          sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 40460.4, sheet: "intra" },
  { pays: "COG", partner: "Afrique de l'Ouest",   sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 41898.65,sheet: "intra" },

  // Guinée Équatoriale — Exports intra
  { pays: "GNQ", partner: "Togo",                 sens: "Export", hydro: "Essence",           unit: "kt",       qty: 22.31,   sheet: "intra" },
  { pays: "GNQ", partner: "Togo",                 sens: "Export", hydro: "Jet fuel",          unit: "kt",       qty: 12.47,   sheet: "intra" },
  { pays: "GNQ", partner: "Togo",                 sens: "Export", hydro: "Gasoil",            unit: "kt",       qty: 26.73,   sheet: "intra" },

  // ══════════════════════════════════════════
  // SHEET 7 — Commerce Hors Afrique
  // ══════════════════════════════════════════

  // Algérie — Exports extra
  { pays: "DZA", partner: "Amérique",             sens: "Export", hydro: "GNL",               unit: "mscf",     qty: 4.1,     sheet: "extra" },
  { pays: "DZA", partner: "Asie Pacifique",        sens: "Export", hydro: "GNL",               unit: "mscf",     qty: 11.6,    sheet: "extra" },
  { pays: "DZA", partner: "Europe",               sens: "Export", hydro: "Gaz naturel",       unit: "mscf",     qty: 1100.6,  sheet: "extra" },
  { pays: "DZA", partner: "Europe",               sens: "Export", hydro: "GNL",               unit: "mscf",     qty: 523.6,   sheet: "extra" },
  { pays: "DZA", partner: "Amérique",             sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 20.7,    sheet: "extra" },
  { pays: "DZA", partner: "Amérique",             sens: "Export", hydro: "LGN",               unit: "1000b/d",  qty: 23.4,    sheet: "extra" },
  { pays: "DZA", partner: "Amérique",             sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 2793,    sheet: "extra" },
  { pays: "DZA", partner: "Asie Pacifique",        sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 79.2,    sheet: "extra" },
  { pays: "DZA", partner: "Asie Pacifique",        sens: "Export", hydro: "GPL",               unit: "TM",       qty: 885,     sheet: "extra" },
  { pays: "DZA", partner: "Eurasie",              sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 11.8,    sheet: "extra" },
  { pays: "DZA", partner: "Eurasie",              sens: "Export", hydro: "GPL",               unit: "TM",       qty: 192,     sheet: "extra" },
  { pays: "DZA", partner: "Europe",               sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 277.3,   sheet: "extra" },
  { pays: "DZA", partner: "Europe",               sens: "Export", hydro: "LGN",               unit: "1000b/d",  qty: 41.7,    sheet: "extra" },
  { pays: "DZA", partner: "Europe",               sens: "Export", hydro: "GPL",               unit: "TM",       qty: 4287,    sheet: "extra" },
  { pays: "DZA", partner: "Europe",               sens: "Export", hydro: "Essence",           unit: "TM",       qty: 79,      sheet: "extra" },
  { pays: "DZA", partner: "Europe",               sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 2408,    sheet: "extra" },
  { pays: "DZA", partner: "Moyen Orient",         sens: "Export", hydro: "GPL",               unit: "TM",       qty: 67,      sheet: "extra" },
  { pays: "DZA", partner: "Moyen Orient",         sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 30,      sheet: "extra" },
  // Algérie — Import extra (dédupliqué : une seule ligne 0.8 kb/d Pétrole brut / Amérique)
  { pays: "DZA", partner: "Amérique",             sens: "Import", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 0.8,     sheet: "extra" },
  { pays: "DZA", partner: "Europe",               sens: "Import", hydro: "Bitumes",           unit: "TM",       qty: 376,     sheet: "extra" },

  // Angola — Exports extra
  { pays: "AGO", partner: "Amérique",             sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 34.1,    sheet: "extra" },
  { pays: "AGO", partner: "Asie Pacifique",        sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 279.8,   sheet: "extra" },
  { pays: "AGO", partner: "Europe",               sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 63.9,    sheet: "extra" },
  { pays: "AGO", partner: "Moyen Orient",         sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 1,       sheet: "extra" },
  { pays: "AGO", partner: "Amérique",             sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 34162,   sheet: "extra" },
  { pays: "AGO", partner: "Europe",               sens: "Export", hydro: "Fuel Oil",          unit: "TM",       qty: 29048,   sheet: "extra" },
  { pays: "AGO", partner: "Asie Pacifique",        sens: "Export", hydro: "GNL",               unit: "mscf",     qty: 160.5,   sheet: "extra" },
  { pays: "AGO", partner: "Europe",               sens: "Export", hydro: "GNL",               unit: "mscf",     qty: 53.5,    sheet: "extra" },

  // Bénin — Imports extra
  { pays: "BEN", partner: "Amérique",             sens: "Import", hydro: "GPL",               unit: "TM",       qty: 25818.1, sheet: "extra" },
  { pays: "BEN", partner: "Moyen Orient",         sens: "Import", hydro: "Essence",           unit: "TM",       qty: 20158.1, sheet: "extra" },
  { pays: "BEN", partner: "Amérique",             sens: "Import", hydro: "Essence",           unit: "TM",       qty: 364.9,   sheet: "extra" },
  { pays: "BEN", partner: "Europe",               sens: "Import", hydro: "Essence",           unit: "TM",       qty: 54600,   sheet: "extra" },
  { pays: "BEN", partner: "Moyen Orient",         sens: "Import", hydro: "Jet fuel",          unit: "TM",       qty: 134.8,   sheet: "extra" },
  { pays: "BEN", partner: "Asie Pacifique",        sens: "Import", hydro: "Jet fuel",          unit: "TM",       qty: 1468,    sheet: "extra" },
  { pays: "BEN", partner: "Asie Pacifique",        sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 8993,    sheet: "extra" },
  { pays: "BEN", partner: "Eurasie",              sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 248527.3,sheet: "extra" },
  { pays: "BEN", partner: "Amérique",             sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 82.3,    sheet: "extra" },
  { pays: "BEN", partner: "Europe",               sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 4492.7,  sheet: "extra" },
  { pays: "BEN", partner: "Amérique",             sens: "Import", hydro: "Fuel Oil",          unit: "TM",       qty: 10009,   sheet: "extra" },
  { pays: "BEN", partner: "Eurasie",              sens: "Import", hydro: "Fuel Oil",          unit: "TM",       qty: 697,     sheet: "extra" },
  { pays: "BEN", partner: "Europe",               sens: "Import", hydro: "Fuel Oil",          unit: "TM",       qty: 23709.9, sheet: "extra" },
  { pays: "BEN", partner: "Moyen Orient",         sens: "Import", hydro: "Fuel Oil",          unit: "TM",       qty: 9283.8,  sheet: "extra" },

  // Congo — Imports extra
  { pays: "COG", partner: "Europe",               sens: "Import", hydro: "Essence",           unit: "TM",       qty: 3594.9,  sheet: "extra" },
  { pays: "COG", partner: "Europe",               sens: "Import", hydro: "Jet fuel",          unit: "TM",       qty: 1257.2,  sheet: "extra" },
  { pays: "COG", partner: "Europe",               sens: "Import", hydro: "Gasoil",            unit: "TM",       qty: 17114.5, sheet: "extra" },
  // Congo — Exports extra
  { pays: "COG", partner: "Asie Pacifique",        sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 184.1,   sheet: "extra" },
  { pays: "COG", partner: "Europe",               sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 53.9,    sheet: "extra" },
  { pays: "COG", partner: "Moyen Orient",         sens: "Export", hydro: "Pétrole brut",      unit: "1000b/d",  qty: 2.5,     sheet: "extra" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Group rows by country + sens */
function groupBy(rows: TradeRow[], pays: string, sens: "Export" | "Import") {
  return rows.filter(r => r.pays === pays && r.sens === sens)
}

/** Unique partners list from rows */
function partners(rows: TradeRow[]) {
  return [...new Set(rows.map(r => r.partner))]
}

/** Sum kb/d values for oil (crude) */
function sumOilKbd(rows: TradeRow[]) {
  return rows
    .filter(r => r.hydro === "Pétrole brut" && (r.unit === "1000b/d" || r.unit === "1000b/j"))
    .reduce((s, r) => s + r.qty, 0)
}

/** Sum mscf gas values (natural gas pipeline + LNG) */
function sumGasMscf(rows: TradeRow[]) {
  return rows
    .filter(r => (r.hydro === "Gaz naturel" || r.hydro === "GNL") &&
                 (r.unit === "mscf" || r.unit === "mscf (natural gas)"))
    .reduce((s, r) => s + r.qty, 0)
}

/** Sum TM for a given hydro label (kt × 1000 → TM) */
function sumTM(rows: TradeRow[], hydros: string[]) {
  const total = rows
    .filter(r => hydros.includes(r.hydro) && (r.unit === "TM" || r.unit === "kt"))
    .reduce((s, r) => s + (r.unit === "kt" ? r.qty * 1000 : r.qty), 0)
  return total > 0 ? total : null
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🗑  Deleting all existing TradeExport and TradeImport records...")
  await prisma.tradeExport.deleteMany()
  await prisma.tradeImport.deleteMany()
  console.log("✅  Deleted.\n")

  const codes = ["DZA", "AGO", "BEN", "COG", "GNQ"]
  const countries = await prisma.country.findMany({ where: { code: { in: codes } } })
  const byCode: Record<string, string> = {}
  for (const c of countries) byCode[c.code] = c.id
  console.log("Countries found:", Object.keys(byCode).join(", "), "\n")

  const year = 2024

  for (const code of codes) {
    const cid = byCode[code]
    if (!cid) { console.warn(`⚠  Country ${code} not found in DB — skipping`); continue }

    // ── EXPORTS ───────────────────────────────────────────────────────────────
    const exportIntra = groupBy(RAW, code, "Export").filter(r => r.sheet === "intra")
    const exportExtra = groupBy(RAW, code, "Export").filter(r => r.sheet === "extra")
    const allExports  = [...exportIntra, ...exportExtra]

    if (allExports.length > 0) {
      const oilIntraKbD  = sumOilKbd(exportIntra)
      const gasIntraMscf = sumGasMscf(exportIntra)
      const oilExtraKbD  = sumOilKbd(exportExtra)
      const gasExtraMscf = sumGasMscf(exportExtra)
      // Produits raffinés — tous flux confondus (intra + extra)
      const essenceM3    = sumTM(allExports, ["Essence"])
      const gasoilM3     = sumTM(allExports, ["Gasoil", "Fuel Oil", "Bitumes"])
      const gplTM        = sumTM(allExports, ["GPL"])
      const jetFuelTM    = sumTM(allExports, ["Jet fuel", "Jet Fuel"])

      const mainDestinations = partners(allExports)
      const partnersDetail   = allExports.map(r => ({
        partner: r.partner, hydro: r.hydro, qty: r.qty, unit: r.unit, region: r.sheet,
      }))

      await prisma.tradeExport.upsert({
        where: { countryId_year: { countryId: cid, year } },
        create: {
          countryId: cid, year,
          oilIntraKbD, gasIntraBcm: gasIntraMscf,
          oilExtraKbD, gasExtraBcm: gasExtraMscf,
          essenceM3, gasoilM3, gplTM, jetFuelTM,
          mainDestinations: JSON.stringify(mainDestinations),
          partnersDetail:   JSON.stringify(partnersDetail),
        },
        update: {
          oilIntraKbD, gasIntraBcm: gasIntraMscf,
          oilExtraKbD, gasExtraBcm: gasExtraMscf,
          essenceM3, gasoilM3, gplTM, jetFuelTM,
          mainDestinations: JSON.stringify(mainDestinations),
          partnersDetail:   JSON.stringify(partnersDetail),
        },
      })
      console.log(`✅  ${code} TradeExport — intra oil ${oilIntraKbD} kb/d | extra oil ${oilExtraKbD} kb/d | essence ${essenceM3} TM | gasoil ${gasoilM3} TM | ${partnersDetail.length} rows`)
    }

    // ── IMPORTS ───────────────────────────────────────────────────────────────
    const importIntra = groupBy(RAW, code, "Import").filter(r => r.sheet === "intra")
    const importExtra = groupBy(RAW, code, "Import").filter(r => r.sheet === "extra")
    const allImports  = [...importIntra, ...importExtra]

    if (allImports.length > 0) {
      const oilIntraKbD  = sumOilKbd(importIntra)
      const gasIntraMscf = sumGasMscf(importIntra)
      const oilExtraKbD  = sumOilKbd(importExtra)
      const gasExtraMscf = sumGasMscf(importExtra)
      // Produits raffinés — tous flux confondus (intra + extra)
      const essenceM3  = sumTM(allImports, ["Essence"])
      const gasoilM3   = sumTM(allImports, ["Gasoil", "Fuel Oil", "Bitumes"])
      const gplTM      = sumTM(allImports, ["GPL"])
      const jetFuelTM  = sumTM(allImports, ["Jet fuel", "Jet Fuel"])

      const mainSources    = partners(allImports)
      const partnersDetail = allImports.map(r => ({
        partner: r.partner, hydro: r.hydro, qty: r.qty, unit: r.unit, region: r.sheet,
      }))

      await prisma.tradeImport.upsert({
        where: { countryId_year: { countryId: cid, year } },
        create: {
          countryId: cid, year,
          oilIntraKbD, gasIntraBcm: gasIntraMscf,
          oilExtraKbD, gasExtraBcm: gasExtraMscf,
          essenceM3, gasoilM3, gplTM, jetFuelTM,
          mainSources:    JSON.stringify(mainSources),
          partnersDetail: JSON.stringify(partnersDetail),
        },
        update: {
          oilIntraKbD, gasIntraBcm: gasIntraMscf,
          oilExtraKbD, gasExtraBcm: gasExtraMscf,
          essenceM3, gasoilM3, gplTM, jetFuelTM,
          mainSources:    JSON.stringify(mainSources),
          partnersDetail: JSON.stringify(partnersDetail),
        },
      })
      console.log(`✅  ${code} TradeImport — intra oil ${oilIntraKbD} kb/d | extra oil ${oilExtraKbD} kb/d | essence ${essenceM3} TM | gasoil ${gasoilM3} TM | ${partnersDetail.length} rows`)
    }
  }

  console.log("\n🎉  All trade data imported successfully!")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
