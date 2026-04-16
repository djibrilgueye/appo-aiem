import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const importUpdateSchema = z.object({
  countryId: z.string().optional(),
  year: z.number().int().optional(),
  oilIntraKbD: z.number().optional(),
  gasIntraBcm: z.number().optional(),
  oilExtraKbD: z.number().optional(),
  gasExtraBcm: z.number().optional(),
  essenceM3: z.number().optional().nullable(),
  gasoilM3: z.number().optional().nullable(),
  gplTM: z.number().optional().nullable(),
  jetFuelTM: z.number().optional().nullable(),
  mainSources: z.string().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await prisma.tradeImport.findUnique({
      where: { id },
      include: { country: { select: { name: true, code: true } } },
    })
    if (!record) return NextResponse.json({ error: "Import record not found" }, { status: 404 })
    return NextResponse.json(record)
  } catch {
    return NextResponse.json({ error: "Failed to fetch import record" }, { status: 500 })
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
    const data = importUpdateSchema.parse(body)
    const record = await prisma.tradeImport.update({
      where: { id },
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "TradeImport", entityId: id, description: `Updated trade import ${id}` }).catch(console.error)
    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update import record" }, { status: 500 })
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
    await prisma.tradeImport.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "TradeImport", entityId: id, description: `Deleted trade import ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Import record deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete import record" }, { status: 500 })
  }
}
