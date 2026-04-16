import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const updateSchema = z.object({
  blockId: z.string().optional(),
  name: z.string().optional(),
  basinId: z.string().optional(),
  countryId: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  operator: z.string().optional().nullable(),
  operatorContact: z.string().optional().nullable(),
  partners: z.string().optional().nullable(),
  awardDate: z.number().int().optional().nullable(),
  expiryDate: z.number().int().optional().nullable(),
  areaKm2: z.number().int().optional().nullable(),
  coords: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lon: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const block = await prisma.block.findUnique({
    where: { id },
    include: { basin: { select: { name: true, basinId: true } }, country: { select: { name: true, code: true } } },
  })
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(block)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const data = updateSchema.parse(await req.json())
    const block = await prisma.block.update({ where: { id }, data })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Block", entityId: id, description: `Updated block ${block.name}` }).catch(console.error)
    return NextResponse.json(block)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed to update block" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    await prisma.block.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "Block", entityId: id, description: `Deleted block ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete block" }, { status: 500 })
  }
}
