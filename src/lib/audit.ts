import { prisma } from "./prisma"
import { Session } from "next-auth"

export interface AuditInput {
  userId?: string
  userName?: string
  userEmail?: string
  userRole?: string
  action: string
  entity: string
  entityId?: string
  description: string
  changes?: object
  metadata?: object
  ipAddress?: string
  status?: "success" | "failure" | "error"
}

export async function createAuditLog(data: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId:      data.userId,
      userName:    data.userName,
      userEmail:   data.userEmail,
      userRole:    data.userRole,
      action:      data.action,
      entity:      data.entity,
      entityId:    data.entityId,
      description: data.description,
      changes:     data.changes ? JSON.stringify(data.changes) : undefined,
      metadata:    data.metadata ? JSON.stringify(data.metadata) : undefined,
      ipAddress:   data.ipAddress,
      status:      data.status ?? "success",
    },
  })
}

export function getAuditContext(
  session: Session | null,
  req?: Request
): Pick<AuditInput, "userId" | "userName" | "userEmail" | "userRole" | "ipAddress"> {
  const ipAddress = req
    ? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined
    : undefined

  if (!session?.user) {
    return { ipAddress }
  }

  return {
    userId:    session.user.id,
    userName:  session.user.name ?? undefined,
    userEmail: session.user.email ?? undefined,
    userRole:  session.user.role,
    ipAddress,
  }
}

export function calculateChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of keys) {
    if (before[key] !== after[key]) {
      changes[key] = { old: before[key], new: after[key] }
    }
  }
  return changes
}
