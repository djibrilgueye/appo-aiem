import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createOtpToken } from "@/lib/otp"
import { sendInvitationEmail } from "@/lib/email"
import { createAuditLog, getAuditContext } from "@/lib/audit"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      active:    true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

const createSchema = z.object({
  name:  z.string().min(1).max(100),
  email: z.string().email().toLowerCase(),
  role:  z.enum(["admin", "editor", "user"]).default("user"),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: z.infer<typeof createSchema>
  try {
    body = createSchema.parse(await req.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  // Ensure email is unique
  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) {
    return NextResponse.json({ error: "Un utilisateur avec cet email existe déjà" }, { status: 409 })
  }

  // Create user (no password — uses OTP login)
  const user = await prisma.user.create({
    data: {
      name:   body.name,
      email:  body.email,
      role:   body.role,
      active: true,
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })

  // Generate a 24h-valid OTP for the invitation
  const otp = await createOtpToken(body.email, 24 * 60 * 60 * 1000)

  // Send invitation email (failure is non-fatal — the admin still sees the user
  // created and can resend later or share the OTP manually)
  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? ""
  const loginUrl = origin ? `${origin}/login` : "/login"
  const sendResult = await sendInvitationEmail(body.email, body.name, otp, loginUrl).catch(err => {
    console.error("[admin/users POST] invitation send threw:", err)
    return { success: false, dev: false }
  })

  createAuditLog({
    ...getAuditContext(session, req),
    action:      "CREATE",
    entity:      "User",
    entityId:    user.id,
    description: `Created user ${user.email} (role: ${user.role})${sendResult.success ? "" : " — invitation email FAILED"}`,
    status:      sendResult.success ? "success" : "failure",
  }).catch(console.error)

  return NextResponse.json(
    { ...user, invitationSent: sendResult.success, devOtp: sendResult.dev ? otp : undefined },
    { status: 201 },
  )
}
