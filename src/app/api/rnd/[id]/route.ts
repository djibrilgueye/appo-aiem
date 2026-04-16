import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const rndUpdateSchema = z.object({
  centerId: z.string().optional(),
  name: z.string().min(2).optional(),
  countryId: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  focus: z.string().optional(),
  year: z.number().optional().nullable(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const center = await prisma.rnDCenter.findUnique({
      where: { id },
      include: { country: { select: { name: true, code: true } } },
    })
    if (!center) return NextResponse.json({ error: "R&D center not found" }, { status: 404 })
    return NextResponse.json(center)
  } catch {
    return NextResponse.json({ error: "Failed to fetch R&D center" }, { status: 500 })
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
    const data = rndUpdateSchema.parse(body)
    const center = await prisma.rnDCenter.update({
      where: { id },
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "RnDCenter", entityId: id, description: `Updated R&D center ${center.name}` }).catch(console.error)
    return NextResponse.json(center)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update R&D center" }, { status: 500 })
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
    await prisma.rnDCenter.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "RnDCenter", entityId: id, description: `Deleted R&D center ${id}` }).catch(console.error)
    return NextResponse.json({ message: "R&D center deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete R&D center" }, { status: 500 })
  }
}
