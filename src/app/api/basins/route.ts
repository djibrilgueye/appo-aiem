import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const LOCATIONS = ["Onshore", "Offshore", "Deep Offshore", "Ultra Deep Offshore", "Onshore & Offshore"]

const basinSchema = z.object({
  basinId: z.string(),
  name: z.string().min(2),
  countryId: z.string(),
  type: z.string(),
  location: z.enum(["Onshore", "Offshore", "Deep Offshore", "Ultra Deep Offshore", "Onshore & Offshore"]).default("Onshore"),
  lat: z.number(),
  lon: z.number(),
  areaKm2: z.number().optional(),
  description: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const countryId = searchParams.get("countryId")

    const all = searchParams.get("all") === "1"
    const basins = await prisma.basin.findMany({
      where: {
        ...(countryId && { countryId }),
        ...(all ? {} : { country: { active: true } }),
      },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(basins)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch basins" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = basinSchema.parse(body)

    const basin = await prisma.basin.create({
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Basin", entityId: basin.id, description: `Created basin ${basin.name}` }).catch(console.error)
    return NextResponse.json(basin, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create basin" }, { status: 500 })
  }
}
