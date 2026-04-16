import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const importSchema = z.object({
  countryId: z.string(),
  year: z.number().int(),
  oilIntraKbD: z.number().default(0),
  gasIntraBcm: z.number().default(0),
  oilExtraKbD: z.number().default(0),
  gasExtraBcm: z.number().default(0),
  essenceM3: z.number().optional().nullable(),
  gasoilM3: z.number().optional().nullable(),
  gplTM: z.number().optional().nullable(),
  jetFuelTM: z.number().optional().nullable(),
  mainSources: z.string().default("[]"),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined

    const imports = await prisma.tradeImport.findMany({
      where: year ? { year } : undefined,
      include: { country: { select: { name: true, code: true, lat: true, lon: true } } },
      orderBy: { year: "desc" },
    })
    return NextResponse.json(imports)
  } catch {
    return NextResponse.json({ error: "Failed to fetch imports" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const data = importSchema.parse(body)
    const record = await prisma.tradeImport.create({
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "TradeImport", entityId: record.id, description: `Created trade import for ${record.countryId} ${record.year}` }).catch(console.error)
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create import record" }, { status: 500 })
  }
}
