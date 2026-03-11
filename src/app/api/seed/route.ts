import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Initial data from the original HTML
const initialData = {
  countries: [
    { code: "DZA", name: "Algeria", region: "North Africa", lat: 28.0, lon: 2.6, appoMember: true },
    { code: "EGY", name: "Egypt", region: "North Africa", lat: 26.0, lon: 30.0, appoMember: true },
    { code: "LBY", name: "Libya", region: "North Africa", lat: 27.0, lon: 17.0, appoMember: true },
    { code: "TUN", name: "Tunisia", region: "North Africa", lat: 34.0, lon: 9.0, appoMember: false },
    { code: "MAR", name: "Morocco", region: "North Africa", lat: 32.0, lon: -6.0, appoMember: false },
    { code: "NGA", name: "Nigeria", region: "West Africa", lat: 9.0, lon: 8.0, appoMember: true },
    { code: "GHA", name: "Ghana", region: "West Africa", lat: 7.5, lon: -1.0, appoMember: false },
    { code: "CIV", name: "Ivory Coast", region: "West Africa", lat: 7.5, lon: -5.5, appoMember: true },
    { code: "SEN", name: "Senegal", region: "West Africa", lat: 14.5, lon: -14.5, appoMember: true },
    { code: "NER", name: "Niger", region: "West Africa", lat: 17.6, lon: 8.1, appoMember: true },
    { code: "BEN", name: "Benin", region: "West Africa", lat: 9.3, lon: 2.3, appoMember: true },
    { code: "TGO", name: "Togo", region: "West Africa", lat: 8.6, lon: 0.8, appoMember: true },
    { code: "AGO", name: "Angola", region: "Central Africa", lat: -12.5, lon: 18.5, appoMember: true },
    { code: "COG", name: "Congo", region: "Central Africa", lat: -1.0, lon: 15.0, appoMember: true },
    { code: "COD", name: "Democratic Republic of the Congo", region: "Central Africa", lat: -4.0, lon: 22.0, appoMember: true },
    { code: "GAB", name: "Gabon", region: "Central Africa", lat: -0.8, lon: 11.8, appoMember: true },
    { code: "GNQ", name: "Equatorial Guinea", region: "Central Africa", lat: 1.5, lon: 10.0, appoMember: true },
    { code: "TCD", name: "Chad", region: "Central Africa", lat: 15.0, lon: 19.0, appoMember: true },
    { code: "CMR", name: "Cameroon", region: "Central Africa", lat: 6.0, lon: 12.0, appoMember: true },
    { code: "SDN", name: "Sudan", region: "East Africa", lat: 15.5, lon: 32.5, appoMember: true },
    { code: "SSD", name: "South Sudan", region: "East Africa", lat: 7.0, lon: 30.0, appoMember: true },
    { code: "KEN", name: "Kenya", region: "East Africa", lat: -1.0, lon: 38.0, appoMember: false },
    { code: "TZA", name: "Tanzania", region: "East Africa", lat: -6.0, lon: 35.0, appoMember: false },
    { code: "UGA", name: "Uganda", region: "East Africa", lat: 1.4, lon: 32.3, appoMember: false },
    { code: "MOZ", name: "Mozambique", region: "East Africa", lat: -18.0, lon: 35.0, appoMember: false },
    { code: "ZAF", name: "South Africa", region: "Southern Africa", lat: -29.0, lon: 24.0, appoMember: true },
    { code: "NAM", name: "Namibia", region: "Southern Africa", lat: -22.0, lon: 17.0, appoMember: false },
  ],
  basins: [
    { basinId: "BAS001", name: "Niger Delta Basin", code: "NGA", type: "Oil & Gas", lat: 4.9, lon: 6.3, areaKm2: 75000 },
    { basinId: "BAS002", name: "Anambra Basin", code: "NGA", type: "Oil & Gas", lat: 6.2, lon: 7.0, areaKm2: 30000 },
    { basinId: "BAS005", name: "Hassi Messaoud", code: "DZA", type: "Oil", lat: 31.7, lon: 6.0, areaKm2: 350 },
    { basinId: "BAS006", name: "Hassi R'Mel", code: "DZA", type: "Gas", lat: 32.9, lon: 3.3, areaKm2: 3500 },
    { basinId: "BAS008", name: "Sirte Basin", code: "LBY", type: "Oil & Gas", lat: 29.0, lon: 18.0, areaKm2: 600000 },
    { basinId: "BAS011", name: "Nile Delta Basin", code: "EGY", type: "Gas", lat: 31.0, lon: 31.0, areaKm2: 60000 },
    { basinId: "BAS014", name: "Lower Congo Basin", code: "AGO", type: "Oil & Gas", lat: -6.5, lon: 12.0, areaKm2: 50000 },
    { basinId: "BAS022", name: "Rovuma Basin", code: "MOZ", type: "Gas", lat: -11.0, lon: 40.5, areaKm2: 180000 },
  ],
  refineries: [
    { refineryId: "REF001", name: "Dangote Refinery", code: "NGA", lat: 6.42, lon: 3.53, capacityKbd: 650, status: "operational", year: 2023 },
    { refineryId: "REF002", name: "Port Harcourt Refinery", code: "NGA", lat: 4.78, lon: 7.01, capacityKbd: 210, status: "operational", year: 1989 },
    { refineryId: "REF005", name: "Skikda Refinery", code: "DZA", lat: 36.88, lon: 6.9, capacityKbd: 335, status: "operational", year: 1980 },
    { refineryId: "REF011", name: "Zawia Refinery", code: "LBY", lat: 32.76, lon: 12.73, capacityKbd: 120, status: "operational", year: 1976 },
    { refineryId: "REF014", name: "El-Nasr (MIDOR) Refinery", code: "EGY", lat: 31.13, lon: 29.78, capacityKbd: 160, status: "operational", year: 2001 },
    { refineryId: "REF008", name: "Luanda Refinery", code: "AGO", lat: -8.82, lon: 13.24, capacityKbd: 65, status: "operational", year: 1958 },
  ],
  pipelines: [
    { pipelineId: "PIP001", name: "West African Gas Pipeline (WAGP)", countries: ["NGA", "BEN", "TGO", "GHA"], coords: [[6.43, 3.38], [6.36, 2.39], [6.13, 1.22], [4.91, -1.75]], status: "operational", lengthKm: 678, capacity: "5 bcm/yr" },
    { pipelineId: "PIP002", name: "Niger–Benin Export Pipeline", countries: ["NER", "BEN"], coords: [[16.0, 14.5], [13.0, 2.0], [6.37, 2.62]], status: "operational", lengthKm: 1950, capacity: "90 kb/d" },
    { pipelineId: "PIP003", name: "TransMed (Enrico Mattei)", countries: ["DZA", "TUN"], coords: [[32.75, 3.25], [35.3, 8.1], [36.85, 10.33]], status: "operational", lengthKm: 2475, capacity: "32.5 bcm/yr" },
    { pipelineId: "PIP004", name: "Maghreb–Europe Gas Pipeline (African section)", countries: ["DZA", "MAR"], coords: [[31.7, -2.8], [33.7, -2.0], [34.9, -5.5]], status: "offline", lengthKm: 1620, capacity: "12 bcm/yr" },
    { pipelineId: "PIP005", name: "Greenstream (African section)", countries: ["LBY"], coords: [[32.62, 12.49], [33.0, 12.0], [33.9, 12.6]], status: "operational", lengthKm: 540, capacity: "11 bcm/yr" },
    { pipelineId: "PIP006", name: "ROMPCO — Mozambique–South Africa Gas Pipeline", countries: ["MOZ", "ZAF"], coords: [[-21.23, 35.0], [-25.43, 31.96], [-26.52, 29.17]], status: "operational", lengthKm: 865, capacity: "4.6 bcm/yr" },
    { pipelineId: "PIP007", name: "EACOP — East African Crude Oil Pipeline", countries: ["UGA", "TZA"], coords: [[1.37, 32.29], [-1.95, 33.48], [-5.07, 39.1]], status: "under construction", lengthKm: 1443, capacity: "216 kb/d" },
    { pipelineId: "PIP008", name: "Trans-Saharan Gas Pipeline (TSGP)", countries: ["NGA", "NER", "DZA"], coords: [[6.44, 3.39], [11.99, 8.52], [17.6, 8.1], [27.2, 2.6]], status: "proposed", lengthKm: 4128, capacity: "30 bcm/yr" },
    { pipelineId: "PIP009", name: "Nigeria–Morocco Gas Pipeline (NMGP)", countries: ["NGA", "BEN", "TGO", "GHA", "CIV", "SEN", "MAR"], coords: [[6.44, 3.39], [6.36, 2.39], [6.13, 1.22], [5.55, -0.2], [5.32, -4.02], [6.31, -10.8], [8.48, -13.23], [9.64, -13.58], [11.86, -15.58], [14.69, -17.44], [20.1, -16.0], [33.6, -7.6]], status: "proposed", lengthKm: 5660, capacity: "40 bcm/yr" },
    { pipelineId: "PIP010", name: "Central African Regional Pipeline (concept)", countries: ["COG", "GAB", "CMR"], coords: [[-4.27, 15.28], [0.39, 9.45], [4.06, 9.71]], status: "proposed", lengthKm: 1500 },
  ],
  training: [
    { centerId: "TRN001", name: "PTI — Petroleum Training Institute (Effurun)", code: "NGA", lat: 5.56, lon: 5.79, type: "Technical", year: 1973 },
    { centerId: "TRN002", name: "IAP — Algerian Petroleum Institute (Boumerdès)", code: "DZA", lat: 36.76, lon: 3.47, type: "Academic", year: 1965 },
    { centerId: "TRN003", name: "MIOG — Morendat Institute of Oil & Gas (Nakuru)", code: "KEN", lat: -0.30, lon: 36.07, type: "Technical", year: 2013 },
    { centerId: "TRN004", name: "ESTP — School of Geology & Mining (Brazzaville)", code: "COG", lat: -4.27, lon: 15.29, type: "Academic", year: 1996 },
    { centerId: "TRN005", name: "ENSPM — National School of Petroleum (Hassi Messaoud)", code: "DZA", lat: 31.68, lon: 6.07, type: "Technical", year: 1964 },
  ],
  rndCenters: [
    { centerId: "RND001", name: "NNPC R&D (Port Harcourt)", code: "NGA", lat: 4.81, lon: 7.01, focus: "Upstream & Downstream R&D", year: 1991 },
    { centerId: "RND002", name: "Sonatrach R&D Center (Boumerdès)", code: "DZA", lat: 36.76, lon: 3.48, focus: "Exploration & production technologies", year: 1985 },
    { centerId: "RND003", name: "Egyptian Petroleum Research Institute (Cairo)", code: "EGY", lat: 30.08, lon: 31.28, focus: "Refining & petrochemicals", year: 1973 },
    { centerId: "RND004", name: "iThemba LABS (Cape Town)", code: "ZAF", lat: -33.94, lon: 18.71, focus: "Energy & materials research", year: 2004 },
  ],
  reserves: [
    { code: "DZA", year: 2024, oil: 12.2, gas: 159.06 },
    { code: "AGO", year: 2024, oil: 7.78, gas: 13.5 },
    { code: "NGA", year: 2024, oil: 36.97, gas: 206.53 },
    { code: "LBY", year: 2024, oil: 48.36, gas: 52.99 },
    { code: "EGY", year: 2024, oil: 3.3, gas: 63.0 },
    { code: "GAB", year: 2024, oil: 2.0, gas: 1.0 },
    { code: "COG", year: 2024, oil: 2.88, gas: 10.0 },
    { code: "GNQ", year: 2024, oil: 1.1, gas: 1.3 },
    { code: "TCD", year: 2024, oil: 1.5, gas: 0.0 },
    { code: "SDN", year: 2024, oil: 1.5, gas: 3.0 },
    { code: "SSD", year: 2024, oil: 3.5, gas: 0.2 },
    { code: "GHA", year: 2024, oil: 0.66, gas: 0.8 },
  ],
  storages: [
    { storageId: "STR001", name: "Saldanha Bay Tank Farm", code: "ZAF", lat: -33.01, lon: 17.93, type: "Crude Oil", capacityMb: 45 },
    { storageId: "STR002", name: "Bonny Island LNG Terminal", code: "NGA", lat: 4.42, lon: 7.16, type: "LNG", capacityMb: 22 },
    { storageId: "STR003", name: "Arzew LNG Terminal", code: "DZA", lat: 35.82, lon: -0.26, type: "LNG", capacityMb: 30 },
    { storageId: "STR004", name: "Soyo LNG Terminal", code: "AGO", lat: -6.13, lon: 12.37, type: "LNG", capacityMb: 5.2 },
    { storageId: "STR005", name: "Suez Oil Terminal", code: "EGY", lat: 29.97, lon: 32.55, type: "Crude Oil", capacityMb: 15 },
    { storageId: "STR006", name: "Malabo Storage", code: "GNQ", lat: 3.75, lon: 8.78, type: "LNG", capacityMb: 3.4 },
  ],
  petrochems: [
    { plantId: "PET001", name: "Indorama Eleme Petrochemicals", code: "NGA", lat: 4.79, lon: 7.09, products: '["Polyethylene","Polypropylene"]', capacity: "350 kt/yr" },
    { plantId: "PET002", name: "Dangote Petrochemicals Complex", code: "NGA", lat: 6.43, lon: 3.54, products: '["Polyethylene","Polypropylene","Fertilizer"]', capacity: "900 kt/yr" },
    { plantId: "PET003", name: "Skikda Petrochemical Complex", code: "DZA", lat: 36.87, lon: 6.91, products: '["Ethylene","Polyethylene","Methanol"]', capacity: "600 kt/yr" },
    { plantId: "PET004", name: "MOPCO Fertilizer Plant (Damietta)", code: "EGY", lat: 31.42, lon: 31.81, products: '["Urea","Ammonia"]', capacity: "1,300 kt/yr" },
    { plantId: "PET005", name: "SASOL Secunda Complex", code: "ZAF", lat: -26.55, lon: 29.17, products: '["Ethylene","Propylene","Polymers","Waxes"]', capacity: "2,100 kt/yr" },
    { plantId: "PET006", name: "PetroRabigh (Arzew)", code: "DZA", lat: 35.83, lon: -0.27, products: '["Fertilizer","Methanol","Ammonia"]', capacity: "450 kt/yr" },
  ],
  production: [
    { code: "NGA", year: 2024, oil: 1250, gas: 45000 },
    { code: "DZA", year: 2024, oil: 907, gas: 103966 },
    { code: "AGO", year: 2024, oil: 1100, gas: 8500 },
    { code: "LBY", year: 2024, oil: 1200, gas: 12500 },
    { code: "EGY", year: 2024, oil: 560, gas: 67000 },
    { code: "COG", year: 2024, oil: 270, gas: 2000 },
    { code: "GAB", year: 2024, oil: 181, gas: 400 },
    { code: "GNQ", year: 2024, oil: 85, gas: 6300 },
    { code: "GHA", year: 2024, oil: 145, gas: 300 },
    { code: "TCD", year: 2024, oil: 125, gas: 0 },
  ],
}

export async function POST(req: Request) {
  try {
    // Check for admin key in development
    const { searchParams } = new URL(req.url)
    const key = searchParams.get("key")

    if (process.env.NODE_ENV === "production" && key !== process.env.SEED_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10)
    await prisma.user.upsert({
      where: { email: "admin@aiem.org" },
      update: {},
      create: {
        email: "admin@aiem.org",
        name: "Admin AIEM",
        password: hashedPassword,
        role: "admin",
      },
    })

    // Create countries
    const countryMap: Record<string, string> = {}
    for (const country of initialData.countries) {
      const created = await prisma.country.upsert({
        where: { code: country.code },
        update: country,
        create: country,
      })
      countryMap[country.code] = created.id
    }

    // Create basins
    for (const basin of initialData.basins) {
      const countryId = countryMap[basin.code]
      if (countryId) {
        const { code: _, ...basinData } = basin
        await prisma.basin.upsert({
          where: { basinId: basin.basinId },
          update: { ...basinData, countryId },
          create: { ...basinData, countryId },
        })
      }
    }

    // Create refineries
    for (const refinery of initialData.refineries) {
      const countryId = countryMap[refinery.code]
      if (countryId) {
        const { code: _, ...refineryData } = refinery
        await prisma.refinery.upsert({
          where: { refineryId: refinery.refineryId },
          update: { ...refineryData, countryId },
          create: { ...refineryData, countryId },
        })
      }
    }

    // Create pipelines
    for (const pipeline of initialData.pipelines) {
      await prisma.pipeline.upsert({
        where: { pipelineId: pipeline.pipelineId },
        update: {
          ...pipeline,
          countries: JSON.stringify(pipeline.countries),
          coords: JSON.stringify(pipeline.coords),
        },
        create: {
          ...pipeline,
          countries: JSON.stringify(pipeline.countries),
          coords: JSON.stringify(pipeline.coords),
        },
      })
    }

    // Create training institutes
    for (const training of initialData.training) {
      const countryId = countryMap[training.code]
      if (countryId) {
        const { code: _, ...trainingData } = training
        await prisma.training.upsert({
          where: { centerId: training.centerId },
          update: { ...trainingData, countryId },
          create: { ...trainingData, countryId },
        })
      }
    }

    // Create R&D centers
    for (const rnd of initialData.rndCenters) {
      const countryId = countryMap[rnd.code]
      if (countryId) {
        const { code: _, ...rndData } = rnd
        await prisma.rnDCenter.upsert({
          where: { centerId: rnd.centerId },
          update: { ...rndData, countryId },
          create: { ...rndData, countryId },
        })
      }
    }

    // Create storage facilities
    for (const storage of initialData.storages) {
      const countryId = countryMap[storage.code]
      if (countryId) {
        const { code: _, ...storageData } = storage
        await prisma.storage.upsert({
          where: { storageId: storage.storageId },
          update: { ...storageData, countryId },
          create: { ...storageData, countryId },
        })
      }
    }

    // Create petrochemical plants
    for (const petrochem of initialData.petrochems) {
      const countryId = countryMap[petrochem.code]
      if (countryId) {
        const { code: _, ...petrochemData } = petrochem
        await prisma.petrochemical.upsert({
          where: { plantId: petrochem.plantId },
          update: { ...petrochemData, countryId },
          create: { ...petrochemData, countryId },
        })
      }
    }

    // Create reserves
    for (const reserve of initialData.reserves) {
      const countryId = countryMap[reserve.code]
      if (countryId) {
        await prisma.reserve.upsert({
          where: { countryId_year: { countryId, year: reserve.year } },
          update: { oil: reserve.oil, gas: reserve.gas },
          create: { countryId, year: reserve.year, oil: reserve.oil, gas: reserve.gas },
        })
      }
    }

    // Create production data
    for (const prod of initialData.production) {
      const countryId = countryMap[prod.code]
      if (countryId) {
        await prisma.production.upsert({
          where: { countryId_year: { countryId, year: prod.year } },
          update: { oil: prod.oil, gas: prod.gas },
          create: { countryId, year: prod.year, oil: prod.oil, gas: prod.gas },
        })
      }
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      admin: { email: "admin@aiem.org", password: "admin123" }
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}
