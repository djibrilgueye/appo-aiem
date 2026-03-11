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
  const action   = searchParams.get("action")   || undefined
  const entity   = searchParams.get("entity")   || undefined
  const status   = searchParams.get("status")   || undefined
  const userId   = searchParams.get("userId")   || undefined
  const q        = searchParams.get("q")         || undefined
  const from     = searchParams.get("from")      || undefined
  const to       = searchParams.get("to")        || undefined
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit    = Math.min(200, parseInt(searchParams.get("limit") || "50"))

  const where: Record<string, unknown> = {}
  if (action)  where.action   = action
  if (entity)  where.entity   = entity
  if (status)  where.status   = status
  if (userId)  where.userId   = userId
  if (from || to) {
    where.timestamp = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to)   } : {}),
    }
  }
  if (q) {
    where.OR = [
      { description: { contains: q } },
      { userEmail:   { contains: q } },
      { userName:    { contains: q } },
      { entityId:    { contains: q } },
    ]
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
  ])

  return NextResponse.json({ total, page, limit, logs })
}
