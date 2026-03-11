import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const reserveUpdateSchema = z.object({
  countryId: z.string().optional(),
  year: z.number().optional(),
  oil: z.number().optional(),
  gas: z.number().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reserve = await prisma.reserve.findUnique({
      where: { id },
      include: { country: { select: { name: true, code: true } } },
    })
    if (!reserve) return NextResponse.json({ error: "Reserve not found" }, { status: 404 })
    return NextResponse.json(reserve)
  } catch {
    return NextResponse.json({ error: "Failed to fetch reserve" }, { status: 500 })
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
    const data = reserveUpdateSchema.parse(body)
    const reserve = await prisma.reserve.update({
      where: { id },
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Reserve", entityId: id, description: `Updated reserve ${id}` }).catch(console.error)
    return NextResponse.json(reserve)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update reserve" }, { status: 500 })
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
    await prisma.reserve.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "Reserve", entityId: id, description: `Deleted reserve ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Reserve deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete reserve" }, { status: 500 })
  }
}
