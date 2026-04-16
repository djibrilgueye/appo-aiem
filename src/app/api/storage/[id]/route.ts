import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const storageUpdateSchema = z.object({
  storageId: z.string().optional(),
  name: z.string().min(2).optional(),
  countryId: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  type: z.string().optional(),
  lngSubtype: z.string().optional().nullable(),
  capacityMb: z.number().optional(),
  regasCapacity: z.number().optional().nullable(),
  liquefCapacity: z.number().optional().nullable(),
  status: z.string().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storage = await prisma.storage.findUnique({
      where: { id },
      include: { country: { select: { name: true, code: true } } },
    })
    if (!storage) return NextResponse.json({ error: "Storage not found" }, { status: 404 })
    return NextResponse.json(storage)
  } catch {
    return NextResponse.json({ error: "Failed to fetch storage" }, { status: 500 })
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
    const data = storageUpdateSchema.parse(body)
    const storage = await prisma.storage.update({
      where: { id },
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Storage", entityId: id, description: `Updated storage ${storage.name}` }).catch(console.error)
    return NextResponse.json(storage)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update storage" }, { status: 500 })
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
    await prisma.storage.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "Storage", entityId: id, description: `Deleted storage ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Storage deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete storage" }, { status: 500 })
  }
}
