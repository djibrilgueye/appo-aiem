import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const refinerySchema = z.object({
  refineryId: z.string(),
  name: z.string().min(2),
  countryId: z.string(),
  lat: z.number(),
  lon: z.number(),
  capacityKbd: z.number(),
  status: z.enum(["operational", "under construction", "proposed", "idle", "decommissioned"]),
  year: z.number().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const countryId = searchParams.get("countryId")
    const status = searchParams.get("status")

    const all = searchParams.get("all") === "1"
    const refineries = await prisma.refinery.findMany({
      where: {
        ...(countryId && { countryId }),
        ...(status && { status }),
        ...(all ? {} : { country: { active: true, appoMember: true } }),
      },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { capacityKbd: "desc" },
    })
    return NextResponse.json(refineries)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch refineries" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = refinerySchema.parse(body)

    const refinery = await prisma.refinery.create({
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Refinery", entityId: refinery.id, description: `Created refinery ${refinery.name}` }).catch(console.error)
    return NextResponse.json(refinery, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create refinery" }, { status: 500 })
  }
}
