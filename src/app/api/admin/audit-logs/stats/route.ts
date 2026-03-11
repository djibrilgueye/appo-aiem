import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [total, success, failure, error, distinctUsers, recentLogs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { status: "success" } }),
    prisma.auditLog.count({ where: { status: "failure" } }),
    prisma.auditLog.count({ where: { status: "error" } }),
    prisma.auditLog.findMany({
      where: { userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.auditLog.findMany({
      where: { timestamp: { gte: since7d } },
      select: { action: true, entity: true, status: true },
    }),
  ])

  // Breakdown by action
  const byAction: Record<string, number> = {}
  const byEntity: Record<string, number> = {}
  for (const log of recentLogs) {
    byAction[log.action] = (byAction[log.action] || 0) + 1
    byEntity[log.entity] = (byEntity[log.entity] || 0) + 1
  }

  return NextResponse.json({
    total,
    success,
    failure,
    error,
    distinctUsers: distinctUsers.length,
    byAction,
    byEntity,
  })
}
