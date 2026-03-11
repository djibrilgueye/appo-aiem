import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const OTP_EXPIRES_MINUTES = 5
export const OTP_MAX_ATTEMPTS = 3
export const OTP_RATE_LIMIT_MAX = 5
export const OTP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/** Generate a cryptographically random 6-digit OTP */
export function generateOtp(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(array[0] % 1_000_000).padStart(6, "0")
}

/** Check and update the rate limit for an email (max 5 OTPs/hour).
 *  Returns { allowed, remaining } */
export async function checkRateLimit(
  email: string
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date()
  const windowStart = new Date(
    Math.floor(now.getTime() / OTP_RATE_LIMIT_WINDOW_MS) * OTP_RATE_LIMIT_WINDOW_MS
  )

  const existing = await prisma.otpRateLimit.findUnique({
    where: { identifier_windowStart: { identifier: email, windowStart } },
  })

  if (!existing) {
    await prisma.otpRateLimit.create({ data: { identifier: email, windowStart, count: 1 } })
    return { allowed: true, remaining: OTP_RATE_LIMIT_MAX - 1 }
  }

  if (existing.count >= OTP_RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  await prisma.otpRateLimit.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } },
  })
  return { allowed: true, remaining: OTP_RATE_LIMIT_MAX - existing.count - 1 }
}

/** Invalidate existing tokens for email, then create and return a new plaintext OTP */
export async function createOtpToken(email: string): Promise<string> {
  const otp = generateOtp()
  const hashedOtp = await bcrypt.hash(otp, 10)
  const expires = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

  // Atomically invalidate all previous tokens for this email
  await prisma.otpToken.updateMany({
    where: { identifier: email, invalidated: false },
    data: { invalidated: true },
  })

  await prisma.otpToken.create({ data: { identifier: email, hashedOtp, expires } })

  return otp
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "invalidated" | "wrong_code" | "max_attempts" }

/** Verify a submitted OTP against the stored hash. Handles all security checks. */
export async function verifyOtpToken(
  email: string,
  submittedOtp: string
): Promise<OtpVerifyResult> {
  const token = await prisma.otpToken.findFirst({
    where: { identifier: email, invalidated: false },
    orderBy: { createdAt: "desc" },
  })

  if (!token) return { ok: false, reason: "not_found" }

  if (token.expires < new Date()) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { invalidated: true } })
    return { ok: false, reason: "expired" }
  }

  if (token.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { invalidated: true } })
    return { ok: false, reason: "max_attempts" }
  }

  const isMatch = await bcrypt.compare(submittedOtp, token.hashedOtp)

  if (!isMatch) {
    const newAttempts = token.attempts + 1
    if (newAttempts >= OTP_MAX_ATTEMPTS) {
      await prisma.otpToken.update({
        where: { id: token.id },
        data: { attempts: newAttempts, invalidated: true },
      })
      return { ok: false, reason: "max_attempts" }
    }
    await prisma.otpToken.update({ where: { id: token.id }, data: { attempts: newAttempts } })
    return { ok: false, reason: "wrong_code" }
  }

  // Consume the token immediately after successful verification
  await prisma.otpToken.update({ where: { id: token.id }, data: { invalidated: true } })
  return { ok: true }
}
