import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const refineryUpdateSchema = z.object({
  refineryId: z.string().optional(),
  name: z.string().min(2).optional(),
  countryId: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  capacityKbd: z.number().optional(),
  status: z.enum(["operational", "under construction", "proposed", "idle", "decommissioned"]).optional(),
  year: z.number().optional().nullable(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const refinery = await prisma.refinery.findUnique({
      where: { id },
      include: { country: { select: { name: true, code: true } } },
    })
    if (!refinery) return NextResponse.json({ error: "Refinery not found" }, { status: 404 })
    return NextResponse.json(refinery)
  } catch {
    return NextResponse.json({ error: "Failed to fetch refinery" }, { status: 500 })
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
    const data = refineryUpdateSchema.parse(body)
    const refinery = await prisma.refinery.update({
      where: { id },
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Refinery", entityId: id, description: `Updated refinery ${refinery.name}` }).catch(console.error)
    return NextResponse.json(refinery)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update refinery" }, { status: 500 })
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
    await prisma.refinery.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "Refinery", entityId: id, description: `Deleted refinery ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Refinery deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete refinery" }, { status: 500 })
  }
}
