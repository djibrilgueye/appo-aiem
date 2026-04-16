/**
 * Import Storage Facilities & LNG Terminals for 18 APPO member countries
 * Sources: EIA, GIIGNL, GEM.wiki, IEA, company press releases, TankTerminals
 *
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/import-storage.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface StorageEntry {
  storageId: string
  name: string
  countryCode: string
  lat: number
  lon: number
  type: string         // "Crude Oil" | "Products Depot" | "Strategic Reserve" | "LNG Export Terminal" | "LNG Import Terminal (FSRU)" | "LPG Terminal"
  lngSubtype?: string  // "Export" | "Import"
  capacityMb: number   // Mb for crude/products; MTPA equivalent for LNG
  regasCapacity?: number  // bcm/yr
  liquefCapacity?: number // mtpa
  status: string
  operator?: string
}

const STORAGES: StorageEntry[] = [
  // ─── ALGERIA (DZA) ───────────────────────────────────────────────────────────
  {
    storageId: "STR-DZA-001",
    name: "Arzew-Bethioua LNG Complex (GL1Z/GL2Z/GL3Z)",
    countryCode: "DZA",
    lat: 35.74, lon: -0.32,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 20.8,
    status: "operational",
    operator: "Sonatrach",
  },
  {
    storageId: "STR-DZA-002",
    name: "Skikda LNG Terminal (GL1K)",
    countryCode: "DZA",
    lat: 36.88, lon: 6.93,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 4.5,
    status: "operational",
    operator: "Sonatrach",
  },
  {
    storageId: "STR-DZA-003",
    name: "Arzew Oil Export Terminal",
    countryCode: "DZA",
    lat: 35.73, lon: -0.30,
    type: "Crude Oil",
    capacityMb: 6.0,
    status: "operational",
    operator: "Sonatrach",
  },
  {
    storageId: "STR-DZA-004",
    name: "Bejaia Oil Export Terminal",
    countryCode: "DZA",
    lat: 36.75, lon: 5.09,
    type: "Crude Oil",
    capacityMb: 3.0,
    status: "operational",
    operator: "Sonatrach",
  },
  {
    storageId: "STR-DZA-005",
    name: "Skikda Oil Export Terminal",
    countryCode: "DZA",
    lat: 36.88, lon: 6.94,
    type: "Crude Oil",
    capacityMb: 3.5,
    status: "operational",
    operator: "Sonatrach",
  },

  // ─── ANGOLA (AGO) ────────────────────────────────────────────────────────────
  {
    storageId: "STR-AGO-001",
    name: "Angola LNG Plant — Soyo",
    countryCode: "AGO",
    lat: -6.14, lon: 12.36,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 5.2,
    status: "operational",
    operator: "Angola LNG Ltd (Chevron/Sonangol/Eni/TotalEnergies/bp)",
  },
  {
    storageId: "STR-AGO-002",
    name: "Malongo Crude Terminal — Cabinda",
    countryCode: "AGO",
    lat: -5.50, lon: 12.10,
    type: "Crude Oil",
    capacityMb: 4.5,
    status: "operational",
    operator: "Chevron / Sonangol",
  },
  {
    storageId: "STR-AGO-003",
    name: "Luanda Petroleum Products Terminal",
    countryCode: "AGO",
    lat: -8.84, lon: 13.23,
    type: "Products Depot",
    capacityMb: 2.3,
    status: "operational",
    operator: "Sonangol Logística",
  },

  // ─── BENIN (BEN) ─────────────────────────────────────────────────────────────
  {
    storageId: "STR-BEN-001",
    name: "Sèmè-Kraké Offshore Export Terminal",
    countryCode: "BEN",
    lat: 6.38, lon: 2.68,
    type: "Crude Oil",
    capacityMb: 2.0,
    status: "operational",
    operator: "WAPCO (West Africa Oil Pipeline Company / CNPC)",
  },

  // ─── CAMEROON (CMR) ──────────────────────────────────────────────────────────
  {
    storageId: "STR-CMR-001",
    name: "Kole Marine Terminal",
    countryCode: "CMR",
    lat: 4.10, lon: 8.65,
    type: "Crude Oil",
    capacityMb: 1.5,
    status: "operational",
    operator: "Perenco / SNH",
  },
  {
    storageId: "STR-CMR-002",
    name: "Limboh Terminal — Limbe",
    countryCode: "CMR",
    lat: 4.01, lon: 9.15,
    type: "Crude Oil",
    capacityMb: 0.8,
    status: "operational",
    operator: "SONARA / SNH",
  },
  {
    storageId: "STR-CMR-003",
    name: "SCDP Products Depot — Douala",
    countryCode: "CMR",
    lat: 4.05, lon: 9.70,
    type: "Products Depot",
    capacityMb: 1.55,
    status: "operational",
    operator: "SCDP",
  },

  // ─── CONGO, REPUBLIC OF (COG) ────────────────────────────────────────────────
  {
    storageId: "STR-COG-001",
    name: "Tango FLNG — Marine XII Phase 1",
    countryCode: "COG",
    lat: -4.80, lon: 11.60,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 0.6,
    status: "operational",
    operator: "Eni (65%) / Lukoil (25%) / SNPC (10%)",
  },
  {
    storageId: "STR-COG-002",
    name: "Nguya FLNG — Marine XII Phase 2",
    countryCode: "COG",
    lat: -4.82, lon: 11.62,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 2.4,
    status: "operational",
    operator: "Eni (65%) / Lukoil (25%) / SNPC (10%)",
  },
  {
    storageId: "STR-COG-003",
    name: "Djeno Onshore Crude Terminal — Pointe-Noire",
    countryCode: "COG",
    lat: -4.78, lon: 11.85,
    type: "Crude Oil",
    capacityMb: 2.0,
    status: "operational",
    operator: "TotalEnergies",
  },

  // ─── CÔTE D'IVOIRE (CIV) ─────────────────────────────────────────────────────
  {
    storageId: "STR-CIV-001",
    name: "SIR Tank Farm — Abidjan (Vridi)",
    countryCode: "CIV",
    lat: 5.31, lon: -4.02,
    type: "Products Depot",
    capacityMb: 1.5,
    status: "operational",
    operator: "SIR / Petroci",
  },

  // ─── DEMOCRATIC REPUBLIC OF CONGO (COD) ──────────────────────────────────────
  {
    storageId: "STR-COD-001",
    name: "Matadi Liquids Storage Terminal",
    countryCode: "COD",
    lat: -5.83, lon: 13.45,
    type: "Products Depot",
    capacityMb: 0.16,
    status: "operational",
    operator: "Puma Energy (Trafigura)",
  },
  {
    storageId: "STR-COD-002",
    name: "Lerexcom Petroleum Terminal — Matadi",
    countryCode: "COD",
    lat: -5.84, lon: 13.46,
    type: "Products Depot",
    capacityMb: 0.23,
    status: "operational",
    operator: "Lerexcom Petroleum",
  },

  // ─── EGYPT (EGY) ─────────────────────────────────────────────────────────────
  {
    storageId: "STR-EGY-001",
    name: "Egyptian LNG — Idku (Trains 1&2)",
    countryCode: "EGY",
    lat: 31.28, lon: 30.31,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 7.2,
    status: "operational",
    operator: "ELNG OPCO (Shell/EGAS/Petronas/EGPC/GDF)",
  },
  {
    storageId: "STR-EGY-002",
    name: "Damietta LNG — SEGAS (Train 1)",
    countryCode: "EGY",
    lat: 31.44, lon: 31.74,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 5.5,
    status: "operational",
    operator: "SEGAS (Eni 50% / EGPC 50%)",
  },
  {
    storageId: "STR-EGY-003",
    name: "Ain Sokhna FSRU — Hoegh Galleon",
    countryCode: "EGY",
    lat: 29.59, lon: 32.34,
    type: "LNG Import Terminal (FSRU)", lngSubtype: "Import",
    capacityMb: 0,
    regasCapacity: 7.6,
    status: "operational",
    operator: "Hoegh Evi / EGAS",
  },
  {
    storageId: "STR-EGY-004",
    name: "Damietta FSRU — Energos Winter",
    countryCode: "EGY",
    lat: 31.44, lon: 31.75,
    type: "LNG Import Terminal (FSRU)", lngSubtype: "Import",
    capacityMb: 0,
    regasCapacity: 7.6,
    status: "operational",
    operator: "New Fortress Energy / EGAS",
  },
  {
    storageId: "STR-EGY-005",
    name: "Ain Sokhna Crude Terminal — SUMED South",
    countryCode: "EGY",
    lat: 29.58, lon: 32.33,
    type: "Crude Oil",
    capacityMb: 10.0,
    status: "operational",
    operator: "SUMED (Arab Petroleum Pipelines Co.)",
  },
  {
    storageId: "STR-EGY-006",
    name: "Sidi Kerir Crude Terminal — SUMED North",
    countryCode: "EGY",
    lat: 30.98, lon: 29.62,
    type: "Crude Oil",
    capacityMb: 19.5,
    status: "operational",
    operator: "SUMED (Arab Petroleum Pipelines Co.)",
  },

  // ─── EQUATORIAL GUINEA (GNQ) ─────────────────────────────────────────────────
  {
    storageId: "STR-GNQ-001",
    name: "EG LNG — Punta Europa (Train 1)",
    countryCode: "GNQ",
    lat: 3.78, lon: 8.70,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 3.7,
    status: "operational",
    operator: "EG LNG Ltd (ConocoPhillips/Marathon/Marubeni/GEPetrol/Sonagas)",
  },

  // ─── GABON (GAB) ─────────────────────────────────────────────────────────────
  {
    storageId: "STR-GAB-001",
    name: "Cap Lopez FLNG Terminal — Port-Gentil",
    countryCode: "GAB",
    lat: -0.63, lon: 8.72,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 0.7,
    status: "under construction",
    operator: "Perenco",
  },
  {
    storageId: "STR-GAB-002",
    name: "Cap Lopez Crude Export Terminal",
    countryCode: "GAB",
    lat: -0.63, lon: 8.73,
    type: "Crude Oil",
    capacityMb: 3.0,
    status: "operational",
    operator: "Perenco",
  },

  // ─── GHANA (GHA) ─────────────────────────────────────────────────────────────
  {
    storageId: "STR-GHA-001",
    name: "Tema LNG Terminal (FSRU)",
    countryCode: "GHA",
    lat: 5.62, lon: -0.01,
    type: "LNG Import Terminal (FSRU)", lngSubtype: "Import",
    capacityMb: 0,
    liquefCapacity: 1.7,
    regasCapacity: 2.3,
    status: "under construction",
    operator: "TLTC (Tema LNG Terminal Co.) / Shell",
  },

  // ─── LIBYA (LBY) ─────────────────────────────────────────────────────────────
  {
    storageId: "STR-LBY-001",
    name: "Es Sider Export Terminal",
    countryCode: "LBY",
    lat: 30.63, lon: 18.23,
    type: "Crude Oil",
    capacityMb: 2.5,
    status: "operational",
    operator: "NOC / Waha Oil Co.",
  },
  {
    storageId: "STR-LBY-002",
    name: "Ras Lanuf Export Terminal",
    countryCode: "LBY",
    lat: 30.49, lon: 18.57,
    type: "Crude Oil",
    capacityMb: 7.0,
    status: "operational",
    operator: "NOC / Arabian Gulf Oil Co.",
  },
  {
    storageId: "STR-LBY-003",
    name: "Marsa el Brega Terminal",
    countryCode: "LBY",
    lat: 30.40, lon: 19.59,
    type: "Crude Oil",
    capacityMb: 6.2,
    status: "operational",
    operator: "NOC / Arabian Gulf Oil Co.",
  },
  {
    storageId: "STR-LBY-004",
    name: "Zueitina Export Terminal",
    countryCode: "LBY",
    lat: 30.87, lon: 20.11,
    type: "Crude Oil",
    capacityMb: 4.3,
    status: "operational",
    operator: "NOC / Zueitina Oil Co.",
  },
  {
    storageId: "STR-LBY-005",
    name: "Zawiya Oil Terminal",
    countryCode: "LBY",
    lat: 32.76, lon: 12.73,
    type: "Crude Oil",
    capacityMb: 1.5,
    status: "operational",
    operator: "NOC / Zawia Oil Co.",
  },
  {
    storageId: "STR-LBY-006",
    name: "Marsa El Hariga Terminal — Tobruk",
    countryCode: "LBY",
    lat: 32.07, lon: 24.00,
    type: "Crude Oil",
    capacityMb: 0.73,
    status: "operational",
    operator: "NOC / Sirte Oil Co.",
  },

  // ─── NIGERIA (NGA) ───────────────────────────────────────────────────────────
  {
    storageId: "STR-NGA-001",
    name: "NLNG — Bonny Island (Trains 1–6)",
    countryCode: "NGA",
    lat: 4.44, lon: 7.24,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 22.0,
    status: "operational",
    operator: "NLNG Ltd (NNPC 49% / Shell 25.6% / TotalEnergies 15% / Eni 10.4%)",
  },
  {
    storageId: "STR-NGA-002",
    name: "NLNG Train 7 Expansion — Bonny Island",
    countryCode: "NGA",
    lat: 4.44, lon: 7.24,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 8.0,
    status: "under construction",
    operator: "NLNG Ltd",
  },
  {
    storageId: "STR-NGA-003",
    name: "Qua Iboe Terminal (QIT)",
    countryCode: "NGA",
    lat: 4.21, lon: 8.06,
    type: "Crude Oil",
    capacityMb: 8.52,
    status: "operational",
    operator: "Seplat Energy / NNPC",
  },
  {
    storageId: "STR-NGA-004",
    name: "Forcados Oil Terminal",
    countryCode: "NGA",
    lat: 5.17, lon: 5.35,
    type: "Crude Oil",
    capacityMb: 6.29,
    status: "operational",
    operator: "SPDC (Shell) / NNPC",
  },
  {
    storageId: "STR-NGA-005",
    name: "Escravos Terminal",
    countryCode: "NGA",
    lat: 5.54, lon: 5.12,
    type: "Crude Oil",
    capacityMb: 3.6,
    status: "operational",
    operator: "Chevron Nigeria / NNPC",
  },
  {
    storageId: "STR-NGA-006",
    name: "Brass Terminal — Bayelsa",
    countryCode: "NGA",
    lat: 4.31, lon: 6.24,
    type: "Crude Oil",
    capacityMb: 3.56,
    status: "operational",
    operator: "NAOC (Eni) / NNPC",
  },
  {
    storageId: "STR-NGA-007",
    name: "Bonny Crude Terminal",
    countryCode: "NGA",
    lat: 4.44, lon: 7.22,
    type: "Crude Oil",
    capacityMb: 4.0,
    status: "operational",
    operator: "Renaissance (ex-SPDC) / NNPC",
  },

  // ─── SENEGAL (SEN) ───────────────────────────────────────────────────────────
  {
    storageId: "STR-SEN-001",
    name: "Greater Tortue Ahmeyim FLNG — Gimi (Phase 1)",
    countryCode: "SEN",
    lat: 16.40, lon: -16.60,
    type: "LNG Export Terminal", lngSubtype: "Export",
    capacityMb: 0,
    liquefCapacity: 2.4,
    status: "operational",
    operator: "bp (56.3%) / Kosmos Energy (27%) / PETROSEN (10%) / SMHPM (10%)",
  },

  // ─── SOUTH AFRICA (ZAF) ──────────────────────────────────────────────────────
  {
    storageId: "STR-ZAF-001",
    name: "Richards Bay LNG Import Terminal (FSRU)",
    countryCode: "ZAF",
    lat: -28.79, lon: 32.05,
    type: "LNG Import Terminal (FSRU)", lngSubtype: "Import",
    capacityMb: 0,
    regasCapacity: 3.0,
    status: "under construction",
    operator: "Zululand Energy Terminal (Vopak / Transnet)",
  },
  {
    storageId: "STR-ZAF-002",
    name: "Saldanha Bay Strategic Fuel Reserve",
    countryCode: "ZAF",
    lat: -33.02, lon: 17.94,
    type: "Strategic Reserve",
    capacityMb: 45.0,
    status: "operational",
    operator: "Strategic Fuel Fund (SFF) — Dept. of Energy",
  },
  {
    storageId: "STR-ZAF-003",
    name: "Milnerton Crude Storage Terminal — Cape Town",
    countryCode: "ZAF",
    lat: -33.85, lon: 18.48,
    type: "Crude Oil",
    capacityMb: 7.8,
    status: "operational",
    operator: "Strategic Fuel Fund (SFF)",
  },
  {
    storageId: "STR-ZAF-004",
    name: "Oiltanking MOGS Saldanha (OTMS)",
    countryCode: "ZAF",
    lat: -33.02, lon: 17.95,
    type: "Crude Oil",
    capacityMb: 13.2,
    status: "operational",
    operator: "Oiltanking (Marquard & Bahls)",
  },
]

async function main() {
  console.log(`\n🗄️  Importing ${STORAGES.length} storage facilities & LNG terminals...\n`)

  let upserted = 0
  let errors = 0

  for (const entry of STORAGES) {
    const country = await prisma.country.findUnique({ where: { code: entry.countryCode } })
    if (!country) {
      console.warn(`  ⚠️  Country not found: ${entry.countryCode} — skipping ${entry.name}`)
      errors++
      continue
    }

    try {
      await prisma.storage.upsert({
        where: { storageId: entry.storageId },
        update: {
          name: entry.name,
          countryId: country.id,
          lat: entry.lat,
          lon: entry.lon,
          type: entry.type,
          lngSubtype: entry.lngSubtype ?? null,
          capacityMb: entry.capacityMb,
          regasCapacity: entry.regasCapacity ?? null,
          liquefCapacity: entry.liquefCapacity ?? null,
          status: entry.status,
        },
        create: {
          storageId: entry.storageId,
          name: entry.name,
          countryId: country.id,
          lat: entry.lat,
          lon: entry.lon,
          type: entry.type,
          lngSubtype: entry.lngSubtype ?? null,
          capacityMb: entry.capacityMb,
          regasCapacity: entry.regasCapacity ?? null,
          liquefCapacity: entry.liquefCapacity ?? null,
          status: entry.status,
        },
      })
      console.log(`  ✅  ${entry.countryCode} — ${entry.name}`)
      upserted++
    } catch (err) {
      console.error(`  ❌  ${entry.name}: ${err}`)
      errors++
    }
  }

  console.log(`\n📊  Result: ${upserted} upserted, ${errors} errors\n`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
