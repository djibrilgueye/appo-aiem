import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const countryUpdateSchema = z.object({
  code: z.string().length(3).optional(),
  name: z.string().min(2).optional(),
  region: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  appoMember: z.boolean().optional(),
  active: z.boolean().optional(),
  // Profile fields (TdR §1)
  capital: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  independence: z.string().optional().nullable(),
  population: z.number().int().optional().nullable(),
  gdpBnUsd: z.number().optional().nullable(),
  economyDesc: z.string().optional().nullable(),
  flagEmoji: z.string().optional().nullable(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        basins: true,
        reserves: { orderBy: { year: "desc" } },
        productions: { orderBy: { year: "desc" } },
        refineries: true,
        trainings: true,
        rndCenters: true,
        storages: true,
        petrochemicals: true,
      }
    })

    if (!country) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 })
    }

    return NextResponse.json(country)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch country" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const data = countryUpdateSchema.parse(body)

    const country = await prisma.country.update({ where: { id }, data })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Country", entityId: id, description: `Updated country ${country.name}` }).catch(console.error)
    return NextResponse.json(country)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update country" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.country.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "Country", entityId: id, description: `Deleted country ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Country deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete country" }, { status: 500 })
  }
}
