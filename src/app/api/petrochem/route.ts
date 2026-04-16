import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const petrochemSchema = z.object({
  plantId: z.string(),
  name: z.string().min(2),
  countryId: z.string(),
  lat: z.number(),
  lon: z.number(),
  products: z.string(), // stored as JSON string
  capacity: z.string(),
})

export async function GET() {
  try {
    const plants = await prisma.petrochemical.findMany({
      where: { country: { appoMember: true } },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { name: "asc" },
    })
    const parsed = plants.map(p => ({
      ...p,
      products: (() => { try { return JSON.parse(p.products) } catch { return [] } })(),
    }))
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const data = petrochemSchema.parse(body)
    const plant = await prisma.petrochemical.create({
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Petrochemical", entityId: plant.id, description: `Created petrochem plant ${plant.name}` }).catch(console.error)
    return NextResponse.json(plant, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create petrochem plant" }, { status: 500 })
  }
}
