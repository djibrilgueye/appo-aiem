import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const trainingSchema = z.object({
  centerId: z.string(),
  name: z.string().min(2),
  countryId: z.string(),
  lat: z.number(),
  lon: z.number(),
  type: z.string(),
  year: z.number().optional().nullable(),
})

export async function GET() {
  try {
    const training = await prisma.training.findMany({
      where: { country: { appoMember: true } },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(training)
  } catch {
    return NextResponse.json({ error: "Failed to fetch training institutes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const data = trainingSchema.parse(body)
    const center = await prisma.training.create({
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Training", entityId: center.id, description: `Created training center ${center.name}` }).catch(console.error)
    return NextResponse.json(center, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create training center" }, { status: 500 })
  }
}
