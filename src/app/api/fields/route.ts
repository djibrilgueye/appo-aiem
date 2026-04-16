import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const fieldSchema = z.object({
  fieldId: z.string().min(1),
  name: z.string().min(1),
  basinId: z.string(),
  countryId: z.string(),
  type: z.string().default("Oil & Gas"),
  status: z.enum(["En production", "En développement", "Découverte", "Abandonné"]).default("Découverte"),
  operator: z.string().optional(),
  partners: z.string().optional(),
  discoveryYear: z.number().int().optional(),
  productionStart: z.number().int().optional(),
  peakOilKbd: z.number().optional(),
  peakGasMmcmd: z.number().optional(),
  oilMmb: z.number().optional(),
  gasBcf: z.number().optional(),
  lat: z.number(),
  lon: z.number(),
  description: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const basinId = searchParams.get("basinId")
    const countryId = searchParams.get("countryId")

    const fields = await prisma.hydrocarbonField.findMany({
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
    return NextResponse.json(fields)
  } catch {
    return NextResponse.json({ error: "Failed to fetch fields" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const data = fieldSchema.parse(body)
    const field = await prisma.hydrocarbonField.create({
      data,
      include: { basin: { select: { name: true } }, country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Field", entityId: field.id, description: `Created field ${field.name}` }).catch(console.error)
    return NextResponse.json(field, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 })
  }
}
