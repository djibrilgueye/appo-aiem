import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const pipelineSchema = z.object({
  pipelineId: z.string(),
  name: z.string().min(2),
  countries: z.array(z.string()),
  coords: z.array(z.array(z.number())),
  status: z.enum(["operational", "under construction", "proposed", "offline", "concept"]),
  lengthKm: z.number().optional(),
  diametre: z.string().optional(),
  capacity: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const pipelines = await prisma.pipeline.findMany({
      where: status ? { status } : undefined,
      orderBy: { name: "asc" },
    })

    // Parse JSON strings back to arrays
    const parsed = pipelines.map(p => ({
      ...p,
      countries: JSON.parse(p.countries),
      coords: JSON.parse(p.coords),
    }))

    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pipelines" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = pipelineSchema.parse(body)

    const pipeline = await prisma.pipeline.create({
      data: {
        ...data,
        countries: JSON.stringify(data.countries),
        coords: JSON.stringify(data.coords),
      },
    })

    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Pipeline", entityId: pipeline.id, description: `Created pipeline ${pipeline.name}` }).catch(console.error)
    return NextResponse.json({
      ...pipeline,
      countries: JSON.parse(pipeline.countries),
      coords: JSON.parse(pipeline.coords),
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 })
  }
}
