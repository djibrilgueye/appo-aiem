/**
 * Import verified petroleum/sedimentary basins for all APPO member countries.
 * Sources: USGS, Wikipedia (cross-checked), published geological surveys.
 * Only basins with high confidence are included.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface BasinInput {
  countryCode: string
  basinId: string
  name: string
  type: string
  lat: number
  lon: number
  areaKm2?: number
  description?: string
}

const BASINS: BasinInput[] = [
  // ─── ALGERIA (DZA) — 2 existing: Hassi Messaoud, Hassi R'Mel ────────────────
  {
    countryCode: "DZA", basinId: "DZA-BERK", name: "Berkine Basin",
    type: "Onshore sedimentary", lat: 31.5, lon: 6.5, areaKm2: 200000,
    description: "Intra-cratonic basin shared with Tunisia & Libya (Ghadames). 150+ oil pools, Silurian/Devonian source rocks.",
  },
  {
    countryCode: "DZA", basinId: "DZA-ILLZ", name: "Illizi Basin",
    type: "Onshore sedimentary", lat: 26.5, lon: 8.0, areaKm2: 120000,
    description: "Contains ~15% of national oil reserves. Silurian Tanezzuft Formation primary source rock.",
  },

  // ─── ANGOLA (AGO) — 1 existing: Lower Congo Basin ───────────────────────────
  {
    countryCode: "AGO", basinId: "AGO-KWAN", name: "Kwanza Basin",
    type: "Offshore sedimentary", lat: -10.0, lon: 12.5, areaKm2: 150000,
    description: "Major offshore passive margin basin. Pre-salt and post-rift systems; Semba oil discovery (2001).",
  },
  {
    countryCode: "AGO", basinId: "AGO-BENG", name: "Benguela Basin",
    type: "Offshore sedimentary", lat: -15.0, lon: 12.0, areaKm2: 100000,
    description: "Southern extension of the Kwanza system. Early Cretaceous rifting; deep-water exploration.",
  },

  // ─── BENIN (BEN) ────────────────────────────────────────────────────────────
  {
    countryCode: "BEN", basinId: "BEN-DAHO", name: "Dahomey Basin",
    type: "Offshore sedimentary", lat: 6.3, lon: 2.4, areaKm2: 12000,
    description: "Cretaceous-Cenozoic coastal/offshore basin (Dahomeyan Embayment). Part of the West African transform margin.",
  },

  // ─── CAMEROON (CMR) ─────────────────────────────────────────────────────────
  {
    countryCode: "CMR", basinId: "CMR-DOUA", name: "Douala Basin",
    type: "Offshore sedimentary", lat: 3.3, lon: 9.5, areaKm2: 12800,
    description: "Lower Cretaceous–Cenozoic offshore basin. Part of the West-Central Coastal Province (USGS).",
  },
  {
    countryCode: "CMR", basinId: "CMR-KRIB", name: "Kribi-Campo Basin",
    type: "Offshore sedimentary", lat: 3.0, lon: 9.9, areaKm2: 30000,
    description: "Shared with Equatorial Guinea. Aptian salt basin; Albian-Turonian source rocks.",
  },

  // ─── CHAD (TCD) ─────────────────────────────────────────────────────────────
  {
    countryCode: "TCD", basinId: "TCD-CHAD", name: "Chad Basin",
    type: "Onshore sedimentary", lat: 13.0, lon: 17.0, areaKm2: 300000,
    description: "Large intracratonic basin shared with Nigeria, Niger and Cameroon. Doba oil discovery (~1 Gbbl). Late Jurassic–Tertiary fill.",
  },

  // ─── CONGO REPUBLIC (COG) ───────────────────────────────────────────────────
  {
    countryCode: "COG", basinId: "COG-OFFS", name: "Coastal Congolese Basin",
    type: "Offshore sedimentary", lat: -4.5, lon: 9.5, areaKm2: 30000,
    description: "Offshore passive margin basin. Multiple petroleum systems (Melania-Gamba, Azile-Senonian). Deep-water discoveries since 1995.",
  },

  // ─── CÔTE D'IVOIRE (CIV) ────────────────────────────────────────────────────
  {
    countryCode: "CIV", basinId: "CIV-TANO", name: "Tano Basin",
    type: "Offshore sedimentary", lat: 4.5, lon: -3.5, areaKm2: 40000,
    description: "Cretaceous offshore basin. Baleine discovery (2021): ~2.5 Gbbl oil + 3.3 Tcf gas. Shared with Ghana.",
  },

  // ─── DR CONGO (COD) ─────────────────────────────────────────────────────────
  {
    countryCode: "COD", basinId: "COD-CONG", name: "Congo Basin",
    type: "Onshore intracontinental sedimentary", lat: -2.5, lon: 23.5, areaKm2: 350000,
    description: "Cuvette Centrale intracontinental basin (DRC portion). Exploration-stage petroleum potential.",
  },
  {
    countryCode: "COD", basinId: "COD-ALBT", name: "Albertine Rift Basin",
    type: "Onshore rift sedimentary", lat: 1.5, lon: 30.0, areaKm2: 15000,
    description: "East African Rift System. Confirmed oil seeps and discoveries along Lake Albert; shared with Uganda.",
  },

  // ─── EGYPT (EGY) — 1 existing: Nile Delta Basin ─────────────────────────────
  {
    countryCode: "EGY", basinId: "EGY-WEST", name: "Western Desert Basin",
    type: "Onshore sedimentary", lat: 28.5, lon: 27.0, areaKm2: 700000,
    description: "Major onshore basin. Multiple oil and gas fields including Abu Gharadig and Farafra sub-basins. Cretaceous reservoirs.",
  },
  {
    countryCode: "EGY", basinId: "EGY-GULF", name: "Gulf of Suez Basin",
    type: "Offshore rift sedimentary", lat: 28.5, lon: 33.0, areaKm2: 19000,
    description: "Rift basin containing >80% of Egypt's oil production. Miocene-age rift; Morgan, Ramadan and Zeit fields.",
  },

  // ─── EQUATORIAL GUINEA (GNQ) ────────────────────────────────────────────────
  {
    countryCode: "GNQ", basinId: "GNQ-RIOM", name: "Rio Muni Basin",
    type: "Offshore sedimentary", lat: 1.5, lon: 9.5, areaKm2: 25000,
    description: "Part of the Kribi-Campo complex. Aptian salt basin. Albian-Turonian source rocks (USGS West-Central Coastal Province).",
  },

  // ─── GABON (GAB) ────────────────────────────────────────────────────────────
  {
    countryCode: "GAB", basinId: "GAB-GABN", name: "Gabon Basin",
    type: "Offshore sedimentary", lat: -0.5, lon: 9.0, areaKm2: 150000,
    description: "Gabon-Congo Province. 295+ oil fields discovered. Multiple petroleum systems; pre-salt discoveries ongoing.",
  },

  // ─── GHANA (GHA) ────────────────────────────────────────────────────────────
  {
    countryCode: "GHA", basinId: "GHA-TANO", name: "Tano Basin",
    type: "Offshore sedimentary", lat: 4.8, lon: -2.0, areaKm2: 40000,
    description: "Cretaceous trans-tensional offshore basin. Jubilee field (~800 MMbbl). Eastern extension of the Ivorian Basin.",
  },

  // ─── LIBYA (LBY) — 1 existing: Sirte Basin ──────────────────────────────────
  {
    countryCode: "LBY", basinId: "LBY-MURZ", name: "Murzuq Basin",
    type: "Onshore intracontinental sedimentary", lat: 25.0, lon: 13.0, areaKm2: 400000,
    description: "Intra-cratonic basin in south-central Libya. Paleozoic exploration; El Sharara field (~300 MMbbl).",
  },
  {
    countryCode: "LBY", basinId: "LBY-GHAD", name: "Ghadames Basin",
    type: "Onshore sedimentary", lat: 30.0, lon: 10.5, areaKm2: 200000,
    description: "Shared with Algeria and Tunisia. Silurian/Devonian source rocks. 150+ oil pools (USGS Total Petroleum Systems).",
  },

  // ─── NAMIBIA (NAM) ──────────────────────────────────────────────────────────
  {
    countryCode: "NAM", basinId: "NAM-WALV", name: "Walvis Basin",
    type: "Offshore passive margin sedimentary", lat: -22.0, lon: 12.0, areaKm2: 150000,
    description: "TotalEnergies/Shell Orange Basin discovery (2022, ~11 Gbbl). Cenomanian-Turonian and Aptian source rocks.",
  },
  {
    countryCode: "NAM", basinId: "NAM-ORAN", name: "Orange Basin",
    type: "Offshore passive margin sedimentary", lat: -28.5, lon: 15.0, areaKm2: 180000,
    description: "Deepwater offshore basin shared with South Africa. Venus discovery (TotalEnergies, 2022): ~11 Gbbl light oil.",
  },

  // ─── NIGER (NER) ────────────────────────────────────────────────────────────
  {
    countryCode: "NER", basinId: "NER-TERM", name: "Termit Basin",
    type: "Onshore rift sedimentary", lat: 15.0, lon: 11.5, areaKm2: 180000,
    description: "Eastern Niger rift system. Proven petroleum potential; Agadem oil field (China National Petroleum Corp).",
  },
  {
    countryCode: "NER", basinId: "NER-IULL", name: "Iullemeden Basin",
    type: "Onshore intracontinental sedimentary", lat: 17.0, lon: 5.0, areaKm2: 300000,
    description: "Large Paleozoic–Cretaceous intracontinental basin. Petroleum potential by analogy with Illizi/Murzuq basins.",
  },

  // ─── NIGERIA (NGA) — 2 existing: Niger Delta, Anambra ───────────────────────
  {
    countryCode: "NGA", basinId: "NGA-BENU", name: "Benue Trough",
    type: "Onshore intracontinental rift sedimentary", lat: 8.0, lon: 10.0, areaKm2: 150000,
    description: "Cretaceous rift/trough. Kolmani River-1 discovery (33+ Bcf gas). Emerging frontier petroleum province.",
  },
  {
    countryCode: "NGA", basinId: "NGA-CHAD", name: "Chad Basin (Nigerian)",
    type: "Onshore sedimentary", lat: 12.5, lon: 13.5, areaKm2: 80000,
    description: "Nigerian portion of the Chad Basin. Prospective Cretaceous–Tertiary sequences; frontier exploration.",
  },

  // ─── SENEGAL (SEN) — 1 existing: Sangomar Basin ─────────────────────────────
  {
    countryCode: "SEN", basinId: "SEN-MSGB", name: "MSGBC Basin",
    type: "Offshore passive margin sedimentary", lat: 14.5, lon: -17.5, areaKm2: 100000,
    description: "Mauritania-Senegal-Guinea Bissau-Conakry Basin. Tortue/Ahmeyim gas field (BP/Kosmos). Cretaceous-Cenozoic passive margin.",
  },

  // ─── SOUTH AFRICA (ZAF) ─────────────────────────────────────────────────────
  {
    countryCode: "ZAF", basinId: "ZAF-BRED", name: "Bredasdorp Basin",
    type: "Offshore passive margin sedimentary", lat: -35.0, lon: 21.5, areaKm2: 18000,
    description: "Upper Jurassic–Lower Cretaceous synrift. Offshore southern Indian Ocean. Depleted gas fields (Block 9, Soekor).",
  },
  {
    countryCode: "ZAF", basinId: "ZAF-ORAN", name: "Orange Basin",
    type: "Offshore passive margin sedimentary", lat: -32.0, lon: 16.5, areaKm2: 190000,
    description: "Deepwater offshore basin. 3.4 Tcf gas (Block 11b/12b). Shared with Namibia. TotalEnergies Venus discovery context.",
  },

  // ─── SOUTH SUDAN (SSD) ──────────────────────────────────────────────────────
  {
    countryCode: "SSD", basinId: "SSD-MELT", name: "Melut Basin",
    type: "Onshore rift sedimentary", lat: 7.5, lon: 32.5, areaKm2: 100000,
    description: "Great Palogue field (~900 MMbbl reserves). Extends into Ethiopia as Gambella Basin. Jurassic–Miocene fill.",
  },
  {
    countryCode: "SSD", basinId: "SSD-MUGL", name: "Muglad Basin (South Sudan)",
    type: "Onshore rift sedimentary", lat: 9.5, lon: 29.5, areaKm2: 120000,
    description: "Southern extension of the Muglad rift system. Unity and Heglig fields. Late Jurassic–Miocene sedimentary fill.",
  },

  // ─── SUDAN (SDN) ────────────────────────────────────────────────────────────
  {
    countryCode: "SDN", basinId: "SDN-MUGL", name: "Muglad Basin",
    type: "Onshore rift sedimentary", lat: 10.5, lon: 28.5, areaKm2: 200000,
    description: "Main Sudan oil basin. Contains majority of Sudan's reserves. Late Jurassic–Miocene rift fill.",
  },
  {
    countryCode: "SDN", basinId: "SDN-MELT", name: "Melut Basin",
    type: "Onshore rift sedimentary", lat: 8.5, lon: 33.0, areaKm2: 150000,
    description: "Shared with South Sudan. Dar Blend crude. 1,380 km export pipeline to Port Sudan.",
  },

  // ─── TOGO (TGO) ─────────────────────────────────────────────────────────────
  {
    countryCode: "TGO", basinId: "TGO-ACCR", name: "Accra-Keta Basin",
    type: "Offshore sedimentary", lat: 6.1, lon: 1.5, areaKm2: 8000,
    description: "Cretaceous wrench pull-apart basin (Dahomeyan Embayment extension). Shared with Benin and Ghana. Limited offshore exploration.",
  },
]

async function main() {
  console.log("Fetching APPO member countries...")
  const countries = await prisma.country.findMany({
    where: { appoMember: true },
    select: { id: true, code: true, name: true },
  })
  const byCode = Object.fromEntries(countries.map(c => [c.code, c]))

  // Remove only the basins we are about to insert (by basinId), keep existing ones
  const basinIds = BASINS.map(b => b.basinId)
  const deleted = await prisma.basin.deleteMany({ where: { basinId: { in: basinIds } } })
  console.log(`Deleted ${deleted.count} existing basins with matching IDs.`)

  let created = 0
  let skipped = 0

  for (const b of BASINS) {
    const country = byCode[b.countryCode]
    if (!country) {
      console.warn(`  SKIP — country not found: ${b.countryCode}`)
      skipped++
      continue
    }
    await prisma.basin.create({
      data: {
        basinId:     b.basinId,
        name:        b.name,
        type:        b.type,
        lat:         b.lat,
        lon:         b.lon,
        areaKm2:     b.areaKm2 ?? null,
        description: b.description ?? null,
        countryId:   country.id,
      },
    })
    console.log(`  ✓ ${b.name} (${b.countryCode})`)
    created++
  }

  console.log(`\nDone. ${created} basins created, ${skipped} skipped.`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
