/**
 * IEA Data Import Script for AIEM
 *
 * This script imports energy data from IEA (International Energy Agency) database files
 * into the AIEM application database.
 *
 * Data source: IEA World Energy Balances (subscription required)
 * Files expected:
 *   - WBES.TXT: World Energy Balances (main data)
 *   - CONV_.TXT: Conversion factors
 *   - BBL_.TXT: Data in barrels
 *
 * Usage:
 *   npx tsx scripts/import-iea.ts --path="/path/to/IEA DATABASE" [--year=2024] [--dry-run]
 *
 * The script is designed to be run annually when IEA updates their database.
 */

import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"
import * as readline from "readline"
import { execSync } from "child_process"

const prisma = new PrismaClient()

// ============================================================================
// CONFIGURATION
// ============================================================================

// African countries mapping: IEA code -> { isoCode, name }
const AFRICAN_COUNTRIES: Record<string, { code: string; name: string; region: string }> = {
  "ALGERIA": { code: "DZA", name: "Algeria", region: "North Africa" },
  "ANGOLA": { code: "AGO", name: "Angola", region: "Central Africa" },
  "BENIN": { code: "BEN", name: "Benin", region: "West Africa" },
  "BOTSWANA": { code: "BWA", name: "Botswana", region: "Southern Africa" },
  "BURKINAFASO": { code: "BFA", name: "Burkina Faso", region: "West Africa" },
  "CAMEROON": { code: "CMR", name: "Cameroon", region: "Central Africa" },
  "CHAD": { code: "TCD", name: "Chad", region: "Central Africa" },
  "CONGO_DRC": { code: "COD", name: "Democratic Republic of the Congo", region: "Central Africa" },
  "CONGO_REPUB": { code: "COG", name: "Congo", region: "Central Africa" },
  "COTEIVOIRE": { code: "CIV", name: "Côte d'Ivoire", region: "West Africa" },
  "EGYPT": { code: "EGY", name: "Egypt", region: "North Africa" },
  "EQGUINEA": { code: "GNQ", name: "Equatorial Guinea", region: "Central Africa" },
  "ERITREA": { code: "ERI", name: "Eritrea", region: "East Africa" },
  "ESWATINI": { code: "SWZ", name: "Eswatini", region: "Southern Africa" },
  "ETHIOPIA": { code: "ETH", name: "Ethiopia", region: "East Africa" },
  "GABON": { code: "GAB", name: "Gabon", region: "Central Africa" },
  "GAMBIA": { code: "GMB", name: "Gambia", region: "West Africa" },
  "GHANA": { code: "GHA", name: "Ghana", region: "West Africa" },
  "GUINEA": { code: "GIN", name: "Guinea", region: "West Africa" },
  "GUINEABISSAU": { code: "GNB", name: "Guinea-Bissau", region: "West Africa" },
  "KENYA": { code: "KEN", name: "Kenya", region: "East Africa" },
  "LESOTHO": { code: "LSO", name: "Lesotho", region: "Southern Africa" },
  "LIBERIA": { code: "LBR", name: "Liberia", region: "West Africa" },
  "LIBYA": { code: "LBY", name: "Libya", region: "North Africa" },
  "MADAGASCAR": { code: "MDG", name: "Madagascar", region: "East Africa" },
  "MALAWI": { code: "MWI", name: "Malawi", region: "East Africa" },
  "MALI": { code: "MLI", name: "Mali", region: "West Africa" },
  "MAURITANIA": { code: "MRT", name: "Mauritania", region: "West Africa" },
  "MAURITIUS": { code: "MUS", name: "Mauritius", region: "East Africa" },
  "MOROCCO": { code: "MAR", name: "Morocco", region: "North Africa" },
  "MOZAMBIQUE": { code: "MOZ", name: "Mozambique", region: "East Africa" },
  "NAMIBIA": { code: "NAM", name: "Namibia", region: "Southern Africa" },
  "NIGER": { code: "NER", name: "Niger", region: "West Africa" },
  "NIGERIA": { code: "NGA", name: "Nigeria", region: "West Africa" },
  "RWANDA": { code: "RWA", name: "Rwanda", region: "East Africa" },
  "SAOTOME": { code: "STP", name: "São Tomé and Príncipe", region: "Central Africa" },
  "SENEGAL": { code: "SEN", name: "Senegal", region: "West Africa" },
  "SEYCHELLES": { code: "SYC", name: "Seychelles", region: "East Africa" },
  "SIERRALEONE": { code: "SLE", name: "Sierra Leone", region: "West Africa" },
  "SOMALIA": { code: "SOM", name: "Somalia", region: "East Africa" },
  "SOUTH_AFRICA": { code: "ZAF", name: "South Africa", region: "Southern Africa" },
  "SOUTHAFRICA": { code: "ZAF", name: "South Africa", region: "Southern Africa" },
  "SSUDAN": { code: "SSD", name: "South Sudan", region: "East Africa" },
  "SUDAN": { code: "SDN", name: "Sudan", region: "North Africa" },
  "TANZANIA": { code: "TZA", name: "Tanzania", region: "East Africa" },
  "TOGO": { code: "TGO", name: "Togo", region: "West Africa" },
  "TUNISIA": { code: "TUN", name: "Tunisia", region: "North Africa" },
  "UGANDA": { code: "UGA", name: "Uganda", region: "East Africa" },
  "ZAMBIA": { code: "ZMB", name: "Zambia", region: "Southern Africa" },
  "ZIMBABWE": { code: "ZWE", name: "Zimbabwe", region: "Southern Africa" },
}

// APPO member countries
const APPO_MEMBERS = new Set([
  "DZA", "AGO", "BEN", "CMR", "COG", "COD", "CIV", "EGY", "GAB", "GNQ",
  "GHA", "LBY", "MRT", "NER", "NGA", "SEN", "ZAF", "TCD", "TUN"
])

// Conversion factors
// IEA WBES data is in ktoe (thousand tonnes of oil equivalent) per year
// Verified against known production values:
//   - Nigeria 2023: 60,042 ktoe crude → ~1,200 kb/d (OPEC data)
//   - Algeria 2023: 4,169,089 ktoe gas → ~100 Bcm/yr (OPEC data)
// For crude oil: factor ≈ 7.3 (1 ktoe/yr ≈ 7.3/365 kb/d)
// For natural gas: factor ≈ 0.024 (1 ktoe ≈ 0.024 million m³)
const KTOE_TO_KBD = 7.3 / 365  // Convert ktoe/year to thousand barrels per day
const KTOE_TO_MCM = 0.024  // Convert ktoe to million cubic meters

// Country coordinates (approximate centroids for display)
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  "DZA": { lat: 28.0, lon: 3.0 },
  "AGO": { lat: -12.5, lon: 18.5 },
  "BEN": { lat: 9.3, lon: 2.3 },
  "BWA": { lat: -22.3, lon: 24.7 },
  "BFA": { lat: 12.2, lon: -1.5 },
  "CMR": { lat: 6.0, lon: 12.0 },
  "TCD": { lat: 15.0, lon: 19.0 },
  "COD": { lat: -4.0, lon: 22.0 },
  "COG": { lat: -1.0, lon: 15.0 },
  "CIV": { lat: 7.5, lon: -5.5 },
  "EGY": { lat: 26.8, lon: 30.8 },
  "GNQ": { lat: 1.5, lon: 10.0 },
  "ERI": { lat: 15.2, lon: 39.8 },
  "SWZ": { lat: -26.5, lon: 31.5 },
  "ETH": { lat: 9.1, lon: 40.5 },
  "GAB": { lat: -0.8, lon: 11.8 },
  "GMB": { lat: 13.4, lon: -15.4 },
  "GHA": { lat: 7.9, lon: -1.0 },
  "GIN": { lat: 9.9, lon: -9.7 },
  "GNB": { lat: 12.0, lon: -15.0 },
  "KEN": { lat: -1.3, lon: 36.8 },
  "LSO": { lat: -29.6, lon: 28.2 },
  "LBR": { lat: 6.4, lon: -9.4 },
  "LBY": { lat: 27.0, lon: 17.0 },
  "MDG": { lat: -18.9, lon: 47.5 },
  "MWI": { lat: -13.3, lon: 34.3 },
  "MLI": { lat: 17.6, lon: -4.0 },
  "MRT": { lat: 20.3, lon: -10.9 },
  "MUS": { lat: -20.3, lon: 57.6 },
  "MAR": { lat: 31.8, lon: -7.1 },
  "MOZ": { lat: -18.7, lon: 35.5 },
  "NAM": { lat: -22.6, lon: 17.1 },
  "NER": { lat: 17.6, lon: 8.1 },
  "NGA": { lat: 9.1, lon: 8.7 },
  "RWA": { lat: -1.9, lon: 29.9 },
  "STP": { lat: 0.2, lon: 6.6 },
  "SEN": { lat: 14.5, lon: -14.5 },
  "SYC": { lat: -4.7, lon: 55.5 },
  "SLE": { lat: 8.5, lon: -11.8 },
  "SOM": { lat: 5.2, lon: 46.2 },
  "ZAF": { lat: -30.6, lon: 22.9 },
  "SSD": { lat: 7.9, lon: 30.0 },
  "SDN": { lat: 15.5, lon: 32.5 },
  "TZA": { lat: -6.4, lon: 34.9 },
  "TGO": { lat: 8.6, lon: 0.8 },
  "TUN": { lat: 34.0, lon: 9.0 },
  "UGA": { lat: 1.4, lon: 32.3 },
  "ZMB": { lat: -13.1, lon: 27.8 },
  "ZWE": { lat: -19.0, lon: 29.2 },
}

// ============================================================================
// TYPES
// ============================================================================

interface IEARecord {
  country: string
  product: string
  year: number
  flow: string
  value: number
  flag: string
}

interface ProductionData {
  countryCode: string
  year: number
  oil: number  // kb/d
  gas: number  // million m³/yr
}

interface TradeData {
  countryCode: string
  year: number
  oilExport: number
  oilImport: number
  gasExport: number
  gasImport: number
}

interface ImportStats {
  countriesCreated: number
  countriesUpdated: number
  productionRecords: number
  tradeExportRecords: number
  tradeImportRecords: number
  errors: string[]
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

function parseIEALine(line: string): IEARecord | null {
  // IEA files use fixed-width columns
  // Column positions (0-indexed):
  // 0-29: Country
  // 30-59: Product
  // 60-89: Year
  // 90-119: Flow
  // 120-149: Value
  // 150+: Flag

  if (line.length < 120) return null

  const country = line.substring(0, 30).trim()
  const product = line.substring(30, 60).trim()
  const yearStr = line.substring(60, 90).trim()
  const flow = line.substring(90, 120).trim()
  const valueStr = line.substring(120, 150).trim()
  const flag = line.substring(150).trim()

  const year = parseInt(yearStr, 10)
  const value = parseFloat(valueStr)

  if (isNaN(year) || isNaN(value)) return null

  return { country, product, year, flow, value, flag }
}

async function* readFileLines(filePath: string): AsyncGenerator<string> {
  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    yield line
  }
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

async function extractProductionData(
  wbesPath: string,
  targetYear?: number
): Promise<Map<string, ProductionData>> {
  console.log("📊 Extracting production data from WBES...")

  const productionMap = new Map<string, ProductionData>()
  let lineCount = 0
  let matchCount = 0

  for await (const line of readFileLines(wbesPath)) {
    lineCount++
    if (lineCount % 1000000 === 0) {
      console.log(`   Processed ${(lineCount / 1000000).toFixed(1)}M lines...`)
    }

    const record = parseIEALine(line)
    if (!record) continue

    // Filter for African countries
    const countryInfo = AFRICAN_COUNTRIES[record.country]
    if (!countryInfo) continue

    // Filter for production flow
    if (record.flow !== "INDPROD") continue

    // Filter for oil and gas products
    if (record.product !== "CRUDE_OIL" && record.product !== "NATURAL_GAS") continue

    // Filter for target year if specified
    if (targetYear && record.year !== targetYear) continue

    // Skip zero or negative values
    if (record.value <= 0) continue

    matchCount++

    const key = `${countryInfo.code}-${record.year}`
    let data = productionMap.get(key)

    if (!data) {
      data = {
        countryCode: countryInfo.code,
        year: record.year,
        oil: 0,
        gas: 0
      }
      productionMap.set(key, data)
    }

    if (record.product === "CRUDE_OIL") {
      // Convert ktoe to kb/d
      data.oil = Math.round(record.value * KTOE_TO_KBD * 10) / 10
    } else if (record.product === "NATURAL_GAS") {
      // Convert ktoe to million m³/yr
      data.gas = Math.round(record.value * KTOE_TO_MCM * 10) / 10
    }
  }

  console.log(`   ✓ Processed ${lineCount} lines, found ${matchCount} matching records`)
  console.log(`   ✓ Extracted production data for ${productionMap.size} country-year combinations`)

  return productionMap
}

async function extractTradeData(
  wbesPath: string,
  targetYear?: number
): Promise<Map<string, TradeData>> {
  console.log("📊 Extracting trade data from WBES...")

  const tradeMap = new Map<string, TradeData>()
  let lineCount = 0
  let matchCount = 0

  for await (const line of readFileLines(wbesPath)) {
    lineCount++

    const record = parseIEALine(line)
    if (!record) continue

    // Filter for African countries
    const countryInfo = AFRICAN_COUNTRIES[record.country]
    if (!countryInfo) continue

    // Filter for trade flows
    if (record.flow !== "EXPORTS" && record.flow !== "IMPORTS") continue

    // Filter for oil and gas products
    if (record.product !== "CRUDE_OIL" && record.product !== "NATURAL_GAS") continue

    // Filter for target year if specified
    if (targetYear && record.year !== targetYear) continue

    matchCount++

    const key = `${countryInfo.code}-${record.year}`
    let data = tradeMap.get(key)

    if (!data) {
      data = {
        countryCode: countryInfo.code,
        year: record.year,
        oilExport: 0,
        oilImport: 0,
        gasExport: 0,
        gasImport: 0
      }
      tradeMap.set(key, data)
    }

    const value = Math.abs(record.value)  // IEA uses negative for exports

    if (record.product === "CRUDE_OIL") {
      if (record.flow === "EXPORTS") {
        data.oilExport = Math.round(value * KTOE_TO_KBD * 10) / 10
      } else {
        data.oilImport = Math.round(value * KTOE_TO_KBD * 10) / 10
      }
    } else if (record.product === "NATURAL_GAS") {
      if (record.flow === "EXPORTS") {
        data.gasExport = Math.round(value * KTOE_TO_MCM / 1000 * 100) / 100  // Convert to Bcm
      } else {
        data.gasImport = Math.round(value * KTOE_TO_MCM / 1000 * 100) / 100
      }
    }
  }

  console.log(`   ✓ Extracted trade data for ${tradeMap.size} country-year combinations`)

  return tradeMap
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function ensureCountriesExist(
  productionData: Map<string, ProductionData>,
  stats: ImportStats
): Promise<Map<string, string>> {
  console.log("🌍 Ensuring countries exist in database...")

  const countryIdMap = new Map<string, string>()
  const countryCodes = new Set<string>()

  // Collect all country codes from production data
  for (const data of productionData.values()) {
    countryCodes.add(data.countryCode)
  }

  for (const code of countryCodes) {
    // Find country info
    const countryEntry = Object.entries(AFRICAN_COUNTRIES).find(
      ([, info]) => info.code === code
    )

    if (!countryEntry) continue

    const [, countryInfo] = countryEntry
    const coords = COUNTRY_COORDS[code] || { lat: 0, lon: 0 }

    // Check if country exists
    let country = await prisma.country.findUnique({
      where: { code }
    })

    if (country) {
      countryIdMap.set(code, country.id)
      stats.countriesUpdated++
    } else {
      // Create country
      country = await prisma.country.create({
        data: {
          code,
          name: countryInfo.name,
          region: countryInfo.region,
          lat: coords.lat,
          lon: coords.lon,
          appoMember: APPO_MEMBERS.has(code)
        }
      })
      countryIdMap.set(code, country.id)
      stats.countriesCreated++
      console.log(`   + Created country: ${countryInfo.name} (${code})`)
    }
  }

  console.log(`   ✓ ${stats.countriesCreated} countries created, ${stats.countriesUpdated} already existed`)

  return countryIdMap
}

async function importProductionData(
  productionData: Map<string, ProductionData>,
  countryIdMap: Map<string, string>,
  stats: ImportStats,
  dryRun: boolean
): Promise<void> {
  console.log("⛽ Importing production data...")

  for (const data of productionData.values()) {
    const countryId = countryIdMap.get(data.countryCode)
    if (!countryId) {
      stats.errors.push(`Country not found: ${data.countryCode}`)
      continue
    }

    if (dryRun) {
      console.log(`   [DRY-RUN] Would upsert production: ${data.countryCode} ${data.year} - Oil: ${data.oil} kb/d, Gas: ${data.gas} M m³/yr`)
      stats.productionRecords++
      continue
    }

    try {
      await prisma.production.upsert({
        where: {
          countryId_year: {
            countryId,
            year: data.year
          }
        },
        update: {
          oil: data.oil,
          gas: data.gas
        },
        create: {
          countryId,
          year: data.year,
          oil: data.oil,
          gas: data.gas
        }
      })
      stats.productionRecords++
    } catch (error) {
      stats.errors.push(`Failed to import production for ${data.countryCode} ${data.year}: ${error}`)
    }
  }

  console.log(`   ✓ Imported ${stats.productionRecords} production records`)
}

async function importTradeData(
  tradeData: Map<string, TradeData>,
  countryIdMap: Map<string, string>,
  stats: ImportStats,
  dryRun: boolean
): Promise<void> {
  console.log("🚢 Importing trade data...")

  for (const data of tradeData.values()) {
    const countryId = countryIdMap.get(data.countryCode)
    if (!countryId) continue

    // Import exports
    if (data.oilExport > 0 || data.gasExport > 0) {
      if (dryRun) {
        console.log(`   [DRY-RUN] Would upsert export: ${data.countryCode} ${data.year}`)
        stats.tradeExportRecords++
      } else {
        try {
          await prisma.tradeExport.upsert({
            where: {
              countryId_year: {
                countryId,
                year: data.year
              }
            },
            update: {
              oilExtraKbD: data.oilExport,
              gasExtraBcm: data.gasExport,
            },
            create: {
              countryId,
              year: data.year,
              oilExtraKbD: data.oilExport,
              gasExtraBcm: data.gasExport,
            }
          })
          stats.tradeExportRecords++
        } catch (error) {
          stats.errors.push(`Failed to import export for ${data.countryCode} ${data.year}: ${error}`)
        }
      }
    }

    // Import imports
    if (data.oilImport > 0 || data.gasImport > 0) {
      if (dryRun) {
        console.log(`   [DRY-RUN] Would upsert import: ${data.countryCode} ${data.year}`)
        stats.tradeImportRecords++
      } else {
        try {
          await prisma.tradeImport.upsert({
            where: {
              countryId_year: {
                countryId,
                year: data.year
              }
            },
            update: {
              oilExtraKbD: data.oilImport,
              gasExtraBcm: data.gasImport,
            },
            create: {
              countryId,
              year: data.year,
              oilExtraKbD: data.oilImport,
              gasExtraBcm: data.gasImport,
            }
          })
          stats.tradeImportRecords++
        } catch (error) {
          stats.errors.push(`Failed to import import for ${data.countryCode} ${data.year}: ${error}`)
        }
      }
    }
  }

  console.log(`   ✓ Imported ${stats.tradeExportRecords} export records, ${stats.tradeImportRecords} import records`)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("═══════════════════════════════════════════════════════════════")
  console.log("  IEA Data Import Script for AIEM")
  console.log("  International Energy Agency → AIEM Database")
  console.log("═══════════════════════════════════════════════════════════════")
  console.log("")

  // Parse arguments
  const args = process.argv.slice(2)
  let ieaPath = ""
  let targetYear: number | undefined
  let dryRun = false

  for (const arg of args) {
    if (arg.startsWith("--path=")) {
      ieaPath = arg.substring(7)
    } else if (arg.startsWith("--year=")) {
      targetYear = parseInt(arg.substring(7), 10)
    } else if (arg === "--dry-run") {
      dryRun = true
    }
  }

  if (!ieaPath) {
    console.error("❌ Error: --path argument is required")
    console.log("")
    console.log("Usage:")
    console.log('  npx tsx scripts/import-iea.ts --path="/path/to/IEA DATABASE" [--year=2024] [--dry-run]')
    console.log("")
    console.log("Options:")
    console.log("  --path    Path to IEA database folder containing WBES.zip")
    console.log("  --year    Import only data for a specific year (optional)")
    console.log("  --dry-run Show what would be imported without making changes")
    process.exit(1)
  }

  console.log(`📁 IEA Database Path: ${ieaPath}`)
  console.log(`📅 Target Year: ${targetYear || "All years"}`)
  console.log(`🔍 Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE IMPORT"}`)
  console.log("")

  // Check for WBES file
  const wbesZip = path.join(ieaPath, "WBES.zip")
  const wbesTxt = "/tmp/iea_import/WBES.TXT"

  if (!fs.existsSync(wbesZip)) {
    console.error(`❌ Error: WBES.zip not found at ${wbesZip}`)
    process.exit(1)
  }

  // Extract WBES.zip if needed
  if (!fs.existsSync(wbesTxt)) {
    console.log("📦 Extracting WBES.zip...")
    fs.mkdirSync("/tmp/iea_import", { recursive: true })
    execSync(`unzip -o "${wbesZip}" -d /tmp/iea_import`)
  }

  const stats: ImportStats = {
    countriesCreated: 0,
    countriesUpdated: 0,
    productionRecords: 0,
    tradeExportRecords: 0,
    tradeImportRecords: 0,
    errors: []
  }

  try {
    // Extract data
    const productionData = await extractProductionData(wbesTxt, targetYear)
    const tradeData = await extractTradeData(wbesTxt, targetYear)

    // Import data
    if (!dryRun) {
      const countryIdMap = await ensureCountriesExist(productionData, stats)
      await importProductionData(productionData, countryIdMap, stats, dryRun)
      await importTradeData(tradeData, countryIdMap, stats, dryRun)
    } else {
      console.log("")
      console.log("🔍 DRY RUN - Preview of data to import:")
      console.log(`   Countries: ${new Set([...productionData.values()].map(d => d.countryCode)).size}`)
      console.log(`   Production records: ${productionData.size}`)
      console.log(`   Trade records: ${tradeData.size}`)

      // Show sample data
      console.log("")
      console.log("   Sample production data:")
      let count = 0
      for (const [key, data] of productionData) {
        if (count >= 5) break
        console.log(`     ${key}: Oil ${data.oil} kb/d, Gas ${data.gas} M m³/yr`)
        count++
      }
    }

    // Summary
    console.log("")
    console.log("═══════════════════════════════════════════════════════════════")
    console.log("  Import Summary")
    console.log("═══════════════════════════════════════════════════════════════")
    console.log(`  Countries created:     ${stats.countriesCreated}`)
    console.log(`  Countries updated:     ${stats.countriesUpdated}`)
    console.log(`  Production records:    ${stats.productionRecords}`)
    console.log(`  Trade export records:  ${stats.tradeExportRecords}`)
    console.log(`  Trade import records:  ${stats.tradeImportRecords}`)

    if (stats.errors.length > 0) {
      console.log("")
      console.log("  ⚠️  Errors:")
      for (const error of stats.errors.slice(0, 10)) {
        console.log(`     - ${error}`)
      }
      if (stats.errors.length > 10) {
        console.log(`     ... and ${stats.errors.length - 10} more errors`)
      }
    }

    console.log("")
    console.log("✅ Import completed successfully!")

  } catch (error) {
    console.error("❌ Import failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
