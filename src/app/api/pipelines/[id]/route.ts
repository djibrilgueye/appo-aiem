import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const pipelineUpdateSchema = z.object({
  pipelineId: z.string().optional(),
  name: z.string().min(2).optional(),
  countries: z.array(z.string()).optional(),
  coords: z.array(z.array(z.number())).optional(),
  status: z.enum(["operational", "under construction", "proposed", "offline", "concept"]).optional(),
  lengthKm: z.number().optional().nullable(),
  diametre: z.string().optional().nullable(),
  capacity: z.string().optional().nullable(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pipeline = await prisma.pipeline.findUnique({ where: { id } })
    if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 })
    return NextResponse.json({
      ...pipeline,
      countries: JSON.parse(pipeline.countries),
      coords: JSON.parse(pipeline.coords),
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch pipeline" }, { status: 500 })
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
    const data = pipelineUpdateSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }
    if (data.countries) updateData.countries = JSON.stringify(data.countries)
    if (data.coords) updateData.coords = JSON.stringify(data.coords)

    const pipeline = await prisma.pipeline.update({ where: { id }, data: updateData })
    createAuditLog({ ...getAuditContext(session, req), action: "UPDATE", entity: "Pipeline", entityId: id, description: `Updated pipeline ${pipeline.name}` }).catch(console.error)
    return NextResponse.json({
      ...pipeline,
      countries: JSON.parse(pipeline.countries),
      coords: JSON.parse(pipeline.coords),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update pipeline" }, { status: 500 })
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
    await prisma.pipeline.delete({ where: { id } })
    createAuditLog({ ...getAuditContext(session, req), action: "DELETE", entity: "Pipeline", entityId: id, description: `Deleted pipeline ${id}` }).catch(console.error)
    return NextResponse.json({ message: "Pipeline deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete pipeline" }, { status: 500 })
  }
}
