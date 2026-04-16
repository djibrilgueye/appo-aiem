import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const updateSchema = z.object({
  fieldId: z.string().optional(),
  name: z.string().optional(),
  basinId: z.string().optional(),
  countryId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  operator: z.string().optional().nullable(),
  partners: z.string().optional().nullable(),
  discoveryYear: z.number().int().optional().nullable(),
  productionStart: z.number().int().optional().nullable(),
  peakOilKbd: z.number().optional().nullable(),
  peakGasMmcmd: z.number().optional().nullable(),
  oilMmb: z.number().optional().nullable(),
  gasBcf: z.number().optional().nullable(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  description: z.string().optional().nullable(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const field = await prisma.hydrocarbonField.findUnique({
    where: { id },
    include: { basin: { select: { name: true, basinId: true } }, country: { select: { name: true, code: true } } },
  })
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(field)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const data = updateSchema.parse(await req.json())
    const field = await prisma.hydrocarbonField.update({ where: { id }, data })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Field", entityId: id, description: `Updated field ${field.name}` }).catch(console.error)
    return NextResponse.json(field)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    await prisma.hydrocarbonField.delete({ where: { id } })
    return NextResponse.json({ message: "Deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 })
  }
}
