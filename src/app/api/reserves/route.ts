import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { OPERATIONAL_STATUSES } from "@/lib/operationalStatus"
import { createAuditLog, getAuditContext } from "@/lib/audit"
import { optionalNumberFromForm } from "@/lib/zodHelpers"

const reserveSchema = z.object({
  countryId: z.string(),
  year: z.number(),
  oil: z.number(),
  gas: z.number(),
  condensat: optionalNumberFromForm,
  status: z.enum(OPERATIONAL_STATUSES as unknown as [string, ...string[]]).default("operational"),
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
      const all_records = await prisma.reserve.findMany({
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

    const reserves = await prisma.reserve.findMany({
      where: {
        ...(countryId && { countryId }),
        ...(year && { year: parseInt(year) }),
        ...(all ? {} : { country: { active: true } }),
      },
      include: { country: { select: { name: true, code: true } } },
      orderBy: [{ year: "desc" }, { country: { name: "asc" } }],
    })
    return NextResponse.json(reserves)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reserves" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = reserveSchema.parse(body)

    // Detect existing row before the upsert so the response can tell the
    // client whether this was a create (201) or an implicit overwrite of a
    // previous (country, year) record (200 + wasUpdate:true). The "Add Record"
    // form uses wasUpdate to warn the admin they replaced an existing entry.
    const existing = await prisma.reserve.findUnique({
      where: { countryId_year: { countryId: data.countryId, year: data.year } },
      select: { id: true },
    })

    const reserve = await prisma.reserve.upsert({
      where: { countryId_year: { countryId: data.countryId, year: data.year } },
      update: { oil: data.oil, gas: data.gas, condensat: data.condensat, status: data.status },
      create: data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({
      ...getAuditContext(session, req),
      action:      existing ? "UPDATE" : "CREATE",
      entity:      "Reserve",
      entityId:    reserve.id,
      description: `${existing ? "Overwrote" : "Created"} reserve for ${reserve.country.name} year ${reserve.year}`,
    }).catch(console.error)
    return NextResponse.json({ ...reserve, wasUpdate: Boolean(existing) }, { status: existing ? 200 : 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create reserve" }, { status: 500 })
  }
}
