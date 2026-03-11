import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, getAuditContext, calculateChanges } from "@/lib/audit"
import { z } from "zod"

const patchSchema = z.object({
  role:   z.enum(["admin", "editor", "user"]).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const data = patchSchema.parse(body)

  const before = await prisma.user.findUnique({
    where: { id },
    select: { role: true, active: true, email: true, name: true },
  })
  if (!before) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Prevent admin from deactivating or demoting themselves
  if (id === session.user.id && (data.active === false || (data.role && data.role !== "admin"))) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })

  createAuditLog({
    ...getAuditContext(session, req),
    action:      "UPDATE",
    entity:      "User",
    entityId:    id,
    description: `Updated user ${before.email}: ${Object.keys(data).join(", ")}`,
    changes:     calculateChanges(before as Record<string, unknown>, data as Record<string, unknown>),
    status:      "success",
  }).catch(console.error)

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, name: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await prisma.user.delete({ where: { id } })

  createAuditLog({
    ...getAuditContext(session, req),
    action:      "DELETE",
    entity:      "User",
    entityId:    id,
    description: `Deleted user ${user.email}`,
    status:      "success",
  }).catch(console.error)

  return NextResponse.json({ success: true })
}
