/**
 * Import verified refineries for all 18 APPO member countries
 * Sources: EIA, OGJ, S&P Global, ARDA Africa, Argus Media, offshore-technology.com
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-refineries.ts
 */

import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

interface RefineryInput {
  refineryId: string
  name: string
  countryCode: string // ISO3
  city: string
  lat: number
  lon: number
  capacityKbd: number
  status: string
  nelsonIndex?: number
  operator?: string
}

const REFINERIES: RefineryInput[] = [
  // ── ALGERIA (DZA) ──────────────────────────────────────────────────────────
  { refineryId: "dza-skikda-ra1k",          name: "Skikda Refinery (RA1K)",            countryCode: "DZA", city: "Skikda",          lat: 36.88, lon: 6.90,  capacityKbd: 335, status: "operational",        operator: "Naftec / Sonatrach" },
  { refineryId: "dza-skikda-ra2k",          name: "Skikda Condensate Refinery (RA2K)", countryCode: "DZA", city: "Skikda",          lat: 36.87, lon: 6.91,  capacityKbd: 72,  status: "operational",        operator: "Naftec / Sonatrach" },
  { refineryId: "dza-arzew",                name: "Arzew Refinery",                    countryCode: "DZA", city: "Arzew",           lat: 35.73, lon: -0.32, capacityKbd: 60,  status: "operational",        operator: "Naftec / Sonatrach" },
  { refineryId: "dza-algiers-sidi-rezine",  name: "Algiers Refinery (Sidi Rezine)",    countryCode: "DZA", city: "Algiers",         lat: 36.77, lon: 3.33,  capacityKbd: 60,  status: "operational",        operator: "Naftec / Sonatrach" },
  { refineryId: "dza-hassi-messaoud",       name: "Hassi Messaoud Refinery",           countryCode: "DZA", city: "Hassi Messaoud",  lat: 31.67, lon: 6.07,  capacityKbd: 30,  status: "operational",        operator: "Naftec / Sonatrach" },
  { refineryId: "dza-adrar",               name: "Adrar Refinery",                    countryCode: "DZA", city: "Adrar",           lat: 27.87, lon: -0.29, capacityKbd: 13,  status: "operational",        operator: "Naftec / Sonatrach" },
  { refineryId: "dza-hassi-messaoud-new",  name: "Hassi Messaoud New Refinery",       countryCode: "DZA", city: "Hassi Messaoud",  lat: 31.67, lon: 6.07,  capacityKbd: 110, status: "under construction", operator: "Sonatrach" },

  // ── ANGOLA (AGO) ───────────────────────────────────────────────────────────
  { refineryId: "ago-luanda",   name: "Luanda Refinery (Fina)",  countryCode: "AGO", city: "Luanda",  lat: -8.82,  lon: 13.24, capacityKbd: 65,  status: "operational",        operator: "Sonaref / Eni" },
  { refineryId: "ago-cabinda",  name: "Cabinda Refinery",        countryCode: "AGO", city: "Cabinda", lat: -5.55,  lon: 12.20, capacityKbd: 30,  status: "operational",        operator: "Gemcorp / Sonangol" },
  { refineryId: "ago-lobito",   name: "Lobito Refinery",         countryCode: "AGO", city: "Lobito",  lat: -12.35, lon: 13.55, capacityKbd: 200, status: "under construction", operator: "Sonaref / Private consortium" },

  // ── CAMEROON (CMR) ─────────────────────────────────────────────────────────
  { refineryId: "cmr-sonara",  name: "SONARA Refinery",  countryCode: "CMR", city: "Limbé",  lat: 4.02,  lon: 9.19, capacityKbd: 42, status: "under construction", operator: "SONARA (Société Nationale de Raffinage)" },

  // ── CHAD (TCD) ─────────────────────────────────────────────────────────────
  { refineryId: "tcd-ndjamena",  name: "N'Djaména Refinery (SRN)",  countryCode: "TCD", city: "N'Djaména",  lat: 12.11, lon: 15.04, capacityKbd: 20, status: "operational", operator: "SRN (CNPC 60% / SHT 40%)" },

  // ── CONGO (COG) ────────────────────────────────────────────────────────────
  { refineryId: "cog-pointe-noire",  name: "Pointe-Noire Refinery (CORAF)",  countryCode: "COG", city: "Pointe-Noire",  lat: -4.78, lon: 11.87, capacityKbd: 21, status: "operational", operator: "CORAF / SNPC" },

  // ── CÔTE D'IVOIRE (CIV) ────────────────────────────────────────────────────
  { refineryId: "civ-abidjan-sir",      name: "Abidjan Refinery (SIR)",    countryCode: "CIV", city: "Abidjan (Vridi)", lat: 5.28, lon: -4.00, capacityKbd: 76,  status: "operational", operator: "SIR (Société Ivoirienne de Raffinage)" },
  { refineryId: "civ-abidjan-new",      name: "New Abidjan Refinery",      countryCode: "CIV", city: "Abidjan",         lat: 5.35, lon: -4.00, capacityKbd: 170, status: "planned",      operator: "Government of Côte d'Ivoire / TBD" },

  // ── DR CONGO (COD) ─────────────────────────────────────────────────────────
  { refineryId: "cod-muanda",  name: "Muanda Refinery (SOCIR)",  countryCode: "COD", city: "Muanda",  lat: -5.92, lon: 12.35, capacityKbd: 14, status: "idle", operator: "SOCIR (Société Congo-Italienne de Raffinage)" },

  // ── EGYPT (EGY) ────────────────────────────────────────────────────────────
  { refineryId: "egy-midor",       name: "MIDOR Refinery",                           countryCode: "EGY", city: "Alexandria (Ameriyah)",  lat: 31.07, lon: 29.70, capacityKbd: 160, status: "operational", operator: "MIDOR / EGPC" },
  { refineryId: "egy-apc",         name: "Alexandria Petroleum Company (APC)",        countryCode: "EGY", city: "Alexandria (El-Mex)",    lat: 31.05, lon: 29.67, capacityKbd: 100, status: "operational", operator: "Alexandria Petroleum Co. / EGPC" },
  { refineryId: "egy-erc",         name: "Egypt Refining Company (ERC) Mostorod",    countryCode: "EGY", city: "Cairo (Mostorod)",       lat: 30.16, lon: 31.35, capacityKbd: 100, status: "operational", operator: "Egyptian Refining Company / EGPC" },
  { refineryId: "egy-corc",        name: "Cairo Oil Refining Company (CORC)",        countryCode: "EGY", city: "Cairo (Mostorod)",       lat: 30.15, lon: 31.34, capacityKbd: 75,  status: "operational", operator: "Cairo Oil Refining Co. / EGPC" },
  { refineryId: "egy-npc-suez",    name: "El-Nasr Petroleum Company (NPC) Refinery", countryCode: "EGY", city: "Suez",                  lat: 29.97, lon: 32.55, capacityKbd: 131, status: "operational", operator: "El-Nasr Petroleum Co. / EGPC" },
  { refineryId: "egy-sopc",        name: "Suez Petroleum Processing Company (SOPC)", countryCode: "EGY", city: "Suez",                  lat: 29.96, lon: 32.53, capacityKbd: 66,  status: "operational", operator: "Suez Petroleum Processing Co. / EGPC" },
  { refineryId: "egy-asorc",       name: "Assiut Oil Refining Company (ASORC)",      countryCode: "EGY", city: "Assiut",                lat: 27.18, lon: 31.19, capacityKbd: 91,  status: "operational", operator: "Assiut Oil Refining Co. / EGPC" },

  // ── GABON (GAB) ────────────────────────────────────────────────────────────
  { refineryId: "gab-port-gentil",  name: "Port Gentil Refinery (SOGARA)",  countryCode: "GAB", city: "Port Gentil",  lat: -0.72, lon: 8.79, capacityKbd: 25, status: "operational", nelsonIndex: 8.3, operator: "SOGARA (TotalEnergies 44% / Govt 25%)" },

  // ── GHANA (GHA) ────────────────────────────────────────────────────────────
  { refineryId: "gha-tema",  name: "Tema Oil Refinery (TOR)",  countryCode: "GHA", city: "Tema",  lat: 5.63, lon: -0.02, capacityKbd: 45, status: "operational", operator: "Tema Oil Refinery Ltd (state-owned)" },

  // ── LIBYA (LBY) ────────────────────────────────────────────────────────────
  { refineryId: "lby-ras-lanuf",  name: "Ras Lanuf Refinery",  countryCode: "LBY", city: "Ras Lanuf",  lat: 30.50, lon: 18.58, capacityKbd: 220, status: "idle",        operator: "NOC / Ras Lanuf Oil & Gas Processing Co." },
  { refineryId: "lby-zawiya",     name: "Zawiya Refinery",     countryCode: "LBY", city: "Zawiya",     lat: 32.76, lon: 12.73, capacityKbd: 120, status: "operational",  operator: "Zawia Oil Refining Co. / NOC" },
  { refineryId: "lby-tobruk",     name: "Tobruk Refinery",     countryCode: "LBY", city: "Tobruk",     lat: 32.08, lon: 23.98, capacityKbd: 20,  status: "operational",  operator: "Arabian Gulf Oil Co. (AGOCO) / NOC" },
  { refineryId: "lby-brega",      name: "Brega Refinery",      countryCode: "LBY", city: "Brega",      lat: 30.40, lon: 19.58, capacityKbd: 10,  status: "operational",  operator: "Sirte Oil Co. / NOC" },
  { refineryId: "lby-sarir",      name: "Sarir Refinery",      countryCode: "LBY", city: "Sarir",      lat: 27.12, lon: 22.37, capacityKbd: 10,  status: "operational",  operator: "Arabian Gulf Oil Co. (AGOCO) / NOC" },

  // ── NAMIBIA (NAM) ──────────────────────────────────────────────────────────
  { refineryId: "nam-walvis-bay",  name: "Namibia-Botswana Joint Refinery (proposed)",  countryCode: "NAM", city: "Walvis Bay",  lat: -22.96, lon: 14.51, capacityKbd: 100, status: "planned", operator: "TBD (Namibia/Botswana JV)" },

  // ── NIGER (NER) ────────────────────────────────────────────────────────────
  { refineryId: "ner-zinder",  name: "Zinder Refinery (SORAZ)",  countryCode: "NER", city: "Zinder",  lat: 13.81, lon: 8.99, capacityKbd: 20, status: "operational", operator: "SORAZ (CNPC 60% / Sonidep 40%)" },

  // ── NIGERIA (NGA) ──────────────────────────────────────────────────────────
  { refineryId: "nga-dangote",       name: "Dangote Refinery",               countryCode: "NGA", city: "Lagos (Lekki)",              lat: 6.42,  lon: 3.53, capacityKbd: 650, status: "operational",        operator: "Dangote Industries Ltd" },
  { refineryId: "nga-phrc-old",      name: "Port Harcourt Refinery (Old)",   countryCode: "NGA", city: "Port Harcourt (Alesa-Eleme)", lat: 4.78,  lon: 7.08, capacityKbd: 60,  status: "operational",        operator: "NNPC Ltd" },
  { refineryId: "nga-phrc-new",      name: "Port Harcourt Refinery (New)",   countryCode: "NGA", city: "Port Harcourt (Alesa-Eleme)", lat: 4.79,  lon: 7.09, capacityKbd: 150, status: "under construction", operator: "NNPC Ltd" },
  { refineryId: "nga-warri",         name: "Warri Refinery (WRPC)",          countryCode: "NGA", city: "Warri",                      lat: 5.52,  lon: 5.74, capacityKbd: 125, status: "operational",        operator: "NNPC Ltd" },
  { refineryId: "nga-kaduna",        name: "Kaduna Refinery (KRPC)",         countryCode: "NGA", city: "Kaduna",                     lat: 10.52, lon: 7.44, capacityKbd: 110, status: "under construction", operator: "NNPC Ltd" },

  // ── SENEGAL (SEN) ──────────────────────────────────────────────────────────
  { refineryId: "sen-sar",      name: "SAR Refinery (Société Africaine de Raffinage)",  countryCode: "SEN", city: "Dakar (Mbao)",       lat: 14.73, lon: -17.37, capacityKbd: 30, status: "operational", operator: "SAR (Petrosen 46% / Locafrique 34%)" },
  { refineryId: "sen-sar2",     name: "SAR 2.0 New Refinery",                           countryCode: "SEN", city: "Dakar region (TBD)", lat: 14.73, lon: -17.37, capacityKbd: 80, status: "planned",      operator: "SAR / Government of Senegal" },

  // ── SOUTH AFRICA (ZAF) ─────────────────────────────────────────────────────
  { refineryId: "zaf-sapref",   name: "SAPREF (South African Petroleum Refinery)",  countryCode: "ZAF", city: "Durban",             lat: -29.92, lon: 31.00, capacityKbd: 180, status: "idle",        operator: "CEF / SANPC (formerly Shell/BP)" },
  { refineryId: "zaf-natref",   name: "Natref Refinery",                            countryCode: "ZAF", city: "Sasolburg",          lat: -26.81, lon: 27.83, capacityKbd: 108, status: "operational", operator: "Natref (Sasol 64% / TotalEnergies 36%)" },
  { refineryId: "zaf-astron",   name: "Astron Energy Refinery (Cape Town)",         countryCode: "ZAF", city: "Cape Town (Milnerton)", lat: -33.87, lon: 18.50, capacityKbd: 100, status: "operational", operator: "Astron Energy (Glencore)" },
  { refineryId: "zaf-secunda",  name: "Sasol Secunda CTL Plant",                   countryCode: "ZAF", city: "Secunda",            lat: -26.52, lon: 29.18, capacityKbd: 150, status: "operational", operator: "Sasol Ltd" },
]

async function main() {
  let imported = 0
  let skipped = 0

  for (const r of REFINERIES) {
    const country = await prisma.country.findUnique({ where: { code: r.countryCode } })
    if (!country) {
      console.warn(`  ⚠ Country not found: ${r.countryCode} (${r.name}) — skipped`)
      skipped++
      continue
    }

    await prisma.refinery.upsert({
      where: { refineryId: r.refineryId },
      update: {
        name:         r.name,
        countryId:    country.id,
        lat:          r.lat,
        lon:          r.lon,
        capacityKbd:  r.capacityKbd,
        status:       r.status,
        nelsonIndex:  r.nelsonIndex ?? null,
      },
      create: {
        refineryId:   r.refineryId,
        name:         r.name,
        countryId:    country.id,
        lat:          r.lat,
        lon:          r.lon,
        capacityKbd:  r.capacityKbd,
        status:       r.status,
        nelsonIndex:  r.nelsonIndex ?? null,
      },
    })

    console.log(`  ✓ ${r.name} (${r.countryCode}) — ${r.capacityKbd} kb/d — ${r.status}`)
    imported++
  }

  console.log(`\nDone: ${imported} imported, ${skipped} skipped (country not in DB)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
