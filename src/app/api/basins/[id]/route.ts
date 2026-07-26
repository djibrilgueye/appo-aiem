import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { OPERATIONAL_STATUSES } from "@/lib/operationalStatus"
import { createAuditLog, getAuditContext } from "@/lib/audit"
import { apiError } from "@/lib/zodHelpers"

const basinUpdateSchema = z.object({
  basinId: z.string().optional(),
  name: z.string().min(2).optional(),
  countryId: z.string().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  areaKm2: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(OPERATIONAL_STATUSES as unknown as [string, ...string[]]).optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const basin = await prisma.basin.findUnique({
      where: { id },
      include: { country: { select: { name: true, code: true } } },
    })
    if (!basin) return NextResponse.json({ error: "Basin not found" }, { status: 404 })
    return NextResponse.json(basin)
  } catch {
    return NextResponse.json({ error: "Failed to fetch basin" }, { status: 500 })
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
    const data = basinUpdateSchema.parse(body)
    const basin = await prisma.basin.update({
      where: { id },
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Basin", entityId: id, description: `Updated basin ${basin.name}` }).catch(console.error)
    return NextResponse.json(basin)
  } catch (error) {
    return apiError(error, "Failed to update basin")
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
    await prisma.basin.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "Basin", entityId: id, description: `Deleted basin ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Basin deleted" })
  } catch (error) {
    return apiError(error, "Failed to delete basin")
  }
}
