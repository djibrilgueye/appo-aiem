import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const productionSchema = z.object({
  countryId: z.string(),
  year: z.number(),
  oil: z.number(),
  gas: z.number(),
  condensat: z.number().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const countryId = searchParams.get("countryId")
    const year = searchParams.get("year")
    const all = searchParams.get("all") === "1"

    // When year is provided (map view), return the most recent data ≤ year per country (last-known)
    if (year && !countryId) {
      const yearInt = parseInt(year)
      const all_records = await prisma.production.findMany({
        where: {
          year: { lte: yearInt },
          ...(all ? {} : { country: { active: true } }),
        },
        include: { country: { select: { name: true, code: true } } },
        orderBy: [{ year: "desc" }],
      })
      // Keep only the most recent record per country
      const seen = new Set<string>()
      const latest = all_records.filter(r => {
        if (seen.has(r.countryId)) return false
        seen.add(r.countryId)
        return true
      })
      return NextResponse.json(latest)
    }

    const productions = await prisma.production.findMany({
      where: {
        ...(countryId && { countryId }),
        ...(year && { year: parseInt(year) }),
        ...(all ? {} : { country: { active: true } }),
      },
      include: { country: { select: { name: true, code: true } } },
      orderBy: [{ year: "desc" }, { country: { name: "asc" } }],
    })
    return NextResponse.json(productions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch production data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = productionSchema.parse(body)

    const production = await prisma.production.upsert({
      where: {
        countryId_year: {
          countryId: data.countryId,
          year: data.year,
        }
      },
      update: { oil: data.oil, gas: data.gas, condensat: data.condensat },
      create: data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Production", entityId: production.id, description: `Upserted production for ${production.country.name} year ${production.year}` }).catch(console.error)
    return NextResponse.json(production, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create production data" }, { status: 500 })
  }
}
