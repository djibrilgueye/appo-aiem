/**
 * One-shot migration: normalize all status values across tables to the canonical
 * 6-value vocabulary defined in src/lib/operationalStatus.ts.
 *
 * Idempotent — safe to run multiple times. Already-canonical rows are left alone.
 *
 * Usage:
 *   npx tsx scripts/migrate-status-vocab.ts
 */
import { PrismaClient } from "@prisma/client"
import { normalizeStatus, OPERATIONAL_STATUSES } from "../src/lib/operationalStatus"

const prisma = new PrismaClient()
const CANONICAL = new Set<string>(OPERATIONAL_STATUSES)

async function migrateModel<T extends { id: string; status: string }>(
  label: string,
  rows: T[],
  updater: (id: string, status: string) => Promise<unknown>,
) {
  let changed = 0
  let skipped = 0
  for (const row of rows) {
    const canon = normalizeStatus(row.status)
    if (CANONICAL.has(row.status) && row.status === canon) {
      skipped++
      continue
    }
    await updater(row.id, canon)
    changed++
  }
  console.log(`  ${label.padEnd(20)} → ${changed} updated, ${skipped} already canonical`)
}

async function main() {
  console.log("Migrating status vocabulary to canonical 6-value set...\n")

  const basins = await prisma.basin.findMany({ select: { id: true, status: true } })
  await migrateModel("Basin", basins, (id, status) =>
    prisma.basin.update({ where: { id }, data: { status } }),
  )

  const blocks = await prisma.block.findMany({ select: { id: true, status: true } })
  await migrateModel("Block", blocks, (id, status) =>
    prisma.block.update({ where: { id }, data: { status } }),
  )

  const fields = await prisma.hydrocarbonField.findMany({ select: { id: true, status: true } })
  await migrateModel("HydrocarbonField", fields, (id, status) =>
    prisma.hydrocarbonField.update({ where: { id }, data: { status } }),
  )

  const refineries = await prisma.refinery.findMany({ select: { id: true, status: true } })
  await migrateModel("Refinery", refineries, (id, status) =>
    prisma.refinery.update({ where: { id }, data: { status } }),
  )

  const pipelines = await prisma.pipeline.findMany({ select: { id: true, status: true } })
  await migrateModel("Pipeline", pipelines, (id, status) =>
    prisma.pipeline.update({ where: { id }, data: { status } }),
  )

  const storages = await prisma.storage.findMany({ select: { id: true, status: true } })
  await migrateModel("Storage", storages, (id, status) =>
    prisma.storage.update({ where: { id }, data: { status } }),
  )

  // The other models gained `status` via this migration with a sensible default —
  // they don't need value normalization since they had no prior values.
  console.log("\nDone.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
