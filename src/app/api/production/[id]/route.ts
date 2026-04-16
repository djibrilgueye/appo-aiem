import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const productionUpdateSchema = z.object({
  countryId: z.string().optional(),
  year: z.number().optional(),
  oil: z.number().optional(),
  gas: z.number().optional(),
  condensat: z.number().nullable().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const production = await prisma.production.findUnique({
      where: { id },
      include: { country: { select: { name: true, code: true } } },
    })
    if (!production) return NextResponse.json({ error: "Production record not found" }, { status: 404 })
    return NextResponse.json(production)
  } catch {
    return NextResponse.json({ error: "Failed to fetch production record" }, { status: 500 })
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
    const data = productionUpdateSchema.parse(body)
    const production = await prisma.production.update({
      where: { id },
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Production", entityId: id, description: `Updated production record ${id}` }).catch(console.error)
    return NextResponse.json(production)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update production record" }, { status: 500 })
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
    await prisma.production.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "Production", entityId: id, description: `Deleted production record ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Production record deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete production record" }, { status: 500 })
  }
}
