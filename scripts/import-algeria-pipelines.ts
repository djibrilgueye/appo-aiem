import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function run() {
  const pipelines = [
    // ── MEDGAZ ──────────────────────────────────────────────────────────────
    {
      pipelineId: "PIP011",
      name: "Medgaz",
      countries: JSON.stringify(["DZA", "ESP"]),
      coords: JSON.stringify([
        [32.11, 3.25],   // Hassi R'Mel
        [32.8, 2.5],
        [33.5, 1.8],
        [34.2, 1.2],
        [35.3, 0.8],
        [35.9, 0.0],     // Beni Saf (coastal)
        [36.5, -0.5],
        [37.5, -1.2],
        [36.834, -2.464] // Almería, Spain
      ]),
      status: "operational",
      lengthKm: 757,
      diametre: "24 in (offshore) / 48 in (onshore)",
      capacity: "10.5 bcm/year",
    },

    // ── GALSI ────────────────────────────────────────────────────────────────
    {
      pipelineId: "PIP012",
      name: "GALSI (Algeria–Sardinia–Italy)",
      countries: JSON.stringify(["DZA", "ITA"]),
      coords: JSON.stringify([
        [32.11, 3.25],   // Hassi R'Mel
        [33.0, 3.5],
        [34.5, 4.5],
        [35.8, 5.9],     // Koudiet Draouche (Algerian coast)
        [38.5, 7.5],     // offshore
        [39.3, 8.4],     // Porto Botte, Sardinia
        [40.5, 9.0],
        [42.0, 10.0],    // offshore Sardinia–Italy
        [42.9, 10.5]     // Piombino, Italy
      ]),
      status: "proposed",
      lengthKm: 1477,
      diametre: "22–48 in",
      capacity: "8 bcm/year",
    },

    // ── HASSI R'MEL – ARZEW (GZ series, merged) ──────────────────────────────
    {
      pipelineId: "PIP013",
      name: "Hassi R'Mel – Arzew Gas Pipeline (GZ1-GZ4)",
      countries: JSON.stringify(["DZA"]),
      coords: JSON.stringify([
        [32.11, 3.25],  // Hassi R'Mel
        [32.5, 2.7],
        [33.1, 1.8],
        [33.7, 1.0],
        [34.3, 0.3],
        [35.3, -0.4],
        [35.72, -0.60] // Arzew
      ]),
      status: "operational",
      lengthKm: 510,
      diametre: "40–48 in",
      capacity: "N/A",
    },

    // ── HASSI R'MEL – SKIKDA (GK1/GK2) ──────────────────────────────────────
    {
      pipelineId: "PIP014",
      name: "Hassi R'Mel – Skikda Gas Pipeline (GK1/GK2)",
      countries: JSON.stringify(["DZA"]),
      coords: JSON.stringify([
        [32.11, 3.25],   // Hassi R'Mel
        [32.7, 3.8],
        [33.4, 4.5],
        [34.2, 5.2],
        [34.9, 5.8],
        [35.6, 6.5],
        [36.87, 6.91]  // Skikda
      ]),
      status: "operational",
      lengthKm: 574,
      diametre: "40–42 in",
      capacity: "N/A",
    },

    // ── IN SALAH GAS PIPELINE ────────────────────────────────────────────────
    {
      pipelineId: "PIP015",
      name: "In Salah Gas Pipeline",
      countries: JSON.stringify(["DZA"]),
      coords: JSON.stringify([
        [27.2, 2.47],  // In Salah
        [28.0, 2.6],
        [28.8, 2.9],
        [29.6, 3.1],
        [30.3, 3.0],
        [31.2, 3.1],
        [32.11, 3.25]  // Hassi R'Mel
      ]),
      status: "operational",
      lengthKm: 830,
      diametre: "48 in",
      capacity: "9 bcm/year",
    },

    // ── ALRAR – HASSI R'MEL ───────────────────────────────────────────────────
    {
      pipelineId: "PIP016",
      name: "Alrar – Hassi R'Mel Gas Pipeline",
      countries: JSON.stringify(["DZA"]),
      coords: JSON.stringify([
        [26.8, 8.8],   // Alrar (Illizi)
        [27.5, 7.8],
        [28.2, 6.8],
        [29.0, 5.8],
        [29.8, 5.0],
        [30.6, 4.3],
        [31.4, 3.8],
        [32.11, 3.25]  // Hassi R'Mel
      ]),
      status: "operational",
      lengthKm: 966,
      diametre: "42–48 in",
      capacity: "N/A",
    },

    // ── GR-5 (SW Gas Phase 1 – Reggane/Adrar) ────────────────────────────────
    {
      pipelineId: "PIP017",
      name: "GR-5 Pipeline (Reggane/Adrar – Hassi R'Mel)",
      countries: JSON.stringify(["DZA"]),
      coords: JSON.stringify([
        [26.7, 0.16],   // Reggane / Adrar area
        [27.5, 0.8],
        [28.3, 1.4],
        [29.2, 1.8],
        [30.1, 2.2],
        [31.0, 2.7],
        [32.11, 3.25]  // Hassi R'Mel
      ]),
      status: "operational",
      lengthKm: 770,
      diametre: "48–56 in",
      capacity: "8.8 bcm/year",
    },

    // ── HAOUD EL HAMRA – ARZEW OIL (OZ1/OZ2) ────────────────────────────────
    {
      pipelineId: "PIP018",
      name: "Haoud El Hamra – Arzew Crude Oil Pipeline (OZ)",
      countries: JSON.stringify(["DZA"]),
      coords: JSON.stringify([
        [31.72, 6.07],  // Haoud El Hamra (near Hassi Messaoud)
        [32.0, 5.2],
        [32.5, 4.3],
        [33.2, 3.4],
        [34.0, 2.5],
        [34.8, 1.5],
        [35.3, 0.5],
        [35.72, -0.60] // Arzew
      ]),
      status: "operational",
      lengthKm: 821,
      diametre: "28–34 in",
      capacity: "45 mt/year",
    },

    // ── HAOUD EL HAMRA – BEJAIA OIL (OB1) ───────────────────────────────────
    {
      pipelineId: "PIP019",
      name: "Haoud El Hamra – Bejaia Crude Oil Pipeline (OB1)",
      countries: JSON.stringify(["DZA"]),
      coords: JSON.stringify([
        [31.72, 6.07],  // Haoud El Hamra
        [32.2, 5.7],
        [32.9, 5.3],
        [33.6, 5.0],
        [34.4, 4.7],
        [35.1, 4.5],
        [36.2, 4.9],
        [36.75, 5.08]  // Bejaia
      ]),
      status: "operational",
      lengthKm: 668,
      diametre: "24 in",
      capacity: "N/A",
    },

    // ── HAOUD EL HAMRA – SKIKDA OIL (OK1) ───────────────────────────────────
    {
      pipelineId: "PIP020",
      name: "Haoud El Hamra – Skikda Crude Oil Pipeline (OK1)",
      countries: JSON.stringify(["DZA"]),
      coords: JSON.stringify([
        [31.72, 6.07],  // Haoud El Hamra
        [32.2, 6.2],
        [32.9, 6.5],
        [33.7, 6.8],
        [34.5, 7.0],
        [35.3, 7.1],
        [36.0, 7.0],
        [36.87, 6.91]  // Skikda
      ]),
      status: "operational",
      lengthKm: 645,
      diametre: "34 in",
      capacity: "N/A",
    },
  ]

  for (const pip of pipelines) {
    const result = await prisma.pipeline.upsert({
      where: { pipelineId: pip.pipelineId },
      create: pip,
      update: pip,
    })
    console.log(`✓ ${result.pipelineId} — ${result.name}`)
  }

  // Update existing PIP003 (TransMed) to include Italy in countries and fix length
  await prisma.pipeline.update({
    where: { pipelineId: "PIP003" },
    data: {
      countries: JSON.stringify(["DZA", "TUN", "ITA"]),
      lengthKm: 2220,
      capacity: "32.7 bcm/year",
      diametre: "48 in (Algeria/Tunisia) / 20 in (offshore)",
    }
  })
  console.log("✓ PIP003 TransMed updated")

  // Update PIP008 TSGP status to "under construction"
  await prisma.pipeline.update({
    where: { pipelineId: "PIP008" },
    data: { status: "under construction" }
  })
  console.log("✓ PIP008 TSGP updated to 'under construction'")

  console.log("\n✅ Algeria pipeline network imported!")
  await prisma.$disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
