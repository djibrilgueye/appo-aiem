import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, getAuditContext } from "@/lib/audit"
import { z } from "zod"

const patchSchema = z.object({
  active: z.boolean().optional(),
  notes:  z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const data = patchSchema.parse(body)

  const entry = await prisma.allowedEmail.update({
    where: { id },
    data,
  })

  createAuditLog({
    ...getAuditContext(session, req),
    action:      "UPDATE",
    entity:      "AllowedEmail",
    entityId:    id,
    description: `Updated allowed email ${entry.email}: ${Object.keys(data).join(", ")}`,
    status:      "success",
  }).catch(console.error)

  return NextResponse.json(entry)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const entry = await prisma.allowedEmail.findUnique({ where: { id } })
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.allowedEmail.delete({ where: { id } })

  createAuditLog({
    ...getAuditContext(session, req),
    action:      "DELETE",
    entity:      "AllowedEmail",
    entityId:    id,
    description: `Removed allowed email: ${entry.email}`,
    status:      "success",
  }).catch(console.error)

  return NextResponse.json({ success: true })
}
