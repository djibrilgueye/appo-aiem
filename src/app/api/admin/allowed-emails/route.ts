import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, getAuditContext } from "@/lib/audit"
import { z } from "zod"

const createSchema = z.object({
  email: z.string().email(),
  notes: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const emails = await prisma.allowedEmail.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(emails)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const data = createSchema.parse(body)

  const entry = await prisma.allowedEmail.create({
    data: { ...data, addedBy: session.user.email ?? undefined },
  })

  createAuditLog({
    ...getAuditContext(session, req),
    action:      "CREATE",
    entity:      "AllowedEmail",
    entityId:    entry.id,
    description: `Added allowed email: ${entry.email}`,
    status:      "success",
  }).catch(console.error)

  return NextResponse.json(entry, { status: 201 })
}
