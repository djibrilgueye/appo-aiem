import { NextResponse } from "next/server"
import { z } from "zod"
import { SignJWT } from "jose"
import { verifyOtpToken } from "@/lib/otp"

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
})

const OTP_PROOF_SECRET = new TextEncoder().encode(
  (process.env.NEXTAUTH_SECRET ?? "fallback-secret") + "_otp_proof"
)

const ERROR_MESSAGES: Record<string, string> = {
  not_found:    "No active code found. Please request a new one.",
  expired:      "Your code has expired. Please request a new one.",
  invalidated:  "This code is no longer valid. Please request a new one.",
  wrong_code:   "Incorrect code. Please check your email and try again.",
  max_attempts: "Too many incorrect attempts. Please request a new code.",
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, otp } = schema.parse(body)

    const result = await verifyOtpToken(email, otp)

    if (!result.ok) {
      const status = result.reason === "wrong_code" ? 401 : 400
      return NextResponse.json(
        { error: ERROR_MESSAGES[result.reason] ?? "Verification failed" },
        { status }
      )
    }

    // Issue a short-lived signed JWT as proof of successful OTP verification
    // NextAuth authorize() will verify this before granting a session
    const otpProofToken = await new SignJWT({ email, verified: true })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2m")
      .setIssuedAt()
      .sign(OTP_PROOF_SECRET)

    return NextResponse.json({ success: true, otpProofToken })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("[OTP Verify]", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
