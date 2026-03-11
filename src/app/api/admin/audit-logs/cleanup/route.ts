import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, getAuditContext } from "@/lib/audit"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const days = typeof body.days === "number" ? body.days : 90
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { count } = await prisma.auditLog.deleteMany({
    where: { timestamp: { lt: cutoff } },
  })

  createAuditLog({
    ...getAuditContext(session, req),
    action:      "DELETE",
    entity:      "System",
    description: `Cleaned up ${count} audit log(s) older than ${days} days`,
    status:      "success",
  }).catch(console.error)

  return NextResponse.json({ deleted: count, olderThanDays: days })
}
