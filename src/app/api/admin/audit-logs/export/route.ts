import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") || undefined
  const entity = searchParams.get("entity") || undefined
  const status = searchParams.get("status") || undefined
  const from   = searchParams.get("from")   || undefined
  const to     = searchParams.get("to")     || undefined

  const where: Record<string, unknown> = {}
  if (action)  where.action   = action
  if (entity)  where.entity   = entity
  if (status)  where.status   = status
  if (from || to) {
    where.timestamp = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to)   } : {}),
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: 10000,
  })

  const header = ["timestamp", "action", "entity", "entityId", "description", "status", "userEmail", "userName", "userRole", "ipAddress"]
  const rows = logs.map(l => [
    l.timestamp.toISOString(),
    l.action,
    l.entity,
    l.entityId ?? "",
    `"${(l.description ?? "").replace(/"/g, '""')}"`,
    l.status,
    l.userEmail ?? "",
    l.userName  ?? "",
    l.userRole  ?? "",
    l.ipAddress ?? "",
  ])

  const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}
