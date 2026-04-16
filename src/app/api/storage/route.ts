import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const storageSchema = z.object({
  storageId: z.string(),
  name: z.string().min(2),
  countryId: z.string(),
  lat: z.number(),
  lon: z.number(),
  type: z.string(),
  lngSubtype: z.string().optional().nullable(),
  capacityMb: z.number(),
  regasCapacity: z.number().optional().nullable(),
  liquefCapacity: z.number().optional().nullable(),
  status: z.string().default("operational"),
})

export async function GET() {
  try {
    const storages = await prisma.storage.findMany({
      where: { country: { appoMember: true } },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(storages)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const data = storageSchema.parse(body)
    const storage = await prisma.storage.create({
      data,
      include: { country: { select: { name: true, code: true } } },
    })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Storage", entityId: storage.id, description: `Created storage ${storage.name}` }).catch(console.error)
    return NextResponse.json(storage, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create storage" }, { status: 500 })
  }
}
