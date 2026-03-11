import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, createOtpToken } from "@/lib/otp"
import { sendOtpEmail } from "@/lib/email"
import { createAuditLog } from "@/lib/audit"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    // --- Check user exists ---
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Generic message to prevent user enumeration
      return NextResponse.json(
        { error: "If this email is registered, you will receive a code shortly." },
        { status: 200 }
      )
    }

    // --- AllowedEmail whitelist check (only enforced when whitelist is non-empty) ---
    const allowedCount = await prisma.allowedEmail.count({ where: { active: true } })
    if (allowedCount > 0) {
      const allowed = await prisma.allowedEmail.findUnique({
        where: { email },
        select: { active: true },
      })
      if (!allowed?.active) {
        createAuditLog({
          userId: user.id, userName: user.name ?? undefined, userEmail: user.email, userRole: user.role,
          action: "ACCESS", entity: "System",
          description: `Login denied: ${email} not in allowed email whitelist`,
          status: "failure",
        }).catch(console.error)
        return NextResponse.json({ error: "Your account is not authorized to log in." }, { status: 403 })
      }
    }

    // --- Rate limiting ---
    const { allowed } = await checkRateLimit(email)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before requesting a new code." },
        { status: 429 }
      )
    }

    // --- Generate, store and send OTP ---
    const otp = await createOtpToken(email)
    await sendOtpEmail(email, otp, user.name)

    return NextResponse.json({
      success: true,
      message: "A verification code has been sent to your email.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("[OTP Send]", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
