import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const blockSchema = z.object({
  blockId: z.string().min(1),
  name: z.string().min(1),
  basinId: z.string(),
  countryId: z.string(),
  status: z.enum(["Libre", "Attribué", "Exploration", "Production", "Abandonné"]).default("Libre"),
  type: z.string().default("Oil & Gas"),
  operator: z.string().optional(),
  operatorContact: z.string().optional(),
  partners: z.string().optional(),
  awardDate: z.number().int().optional(),
  expiryDate: z.number().int().optional(),
  areaKm2: z.number().int().optional(),
  coords: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  description: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const basinId = searchParams.get("basinId")
    const countryId = searchParams.get("countryId")

    const blocks = await prisma.block.findMany({
      where: {
        ...(basinId && { basinId }),
        ...(countryId && { countryId }),
      },
      include: {
        basin: { select: { name: true, basinId: true } },
        country: { select: { name: true, code: true } },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(blocks)
  } catch {
    return NextResponse.json({ error: "Failed to fetch blocks" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const data = blockSchema.parse(body)
    const block = await prisma.block.create({
      data,
      include: { basin: { select: { name: true } }, country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Block", entityId: block.id, description: `Created block ${block.name}` }).catch(console.error)
    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed to create block" }, { status: 500 })
  }
}
