import nodemailer from "nodemailer"

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL ?? "http://localhost:5001"
const EMAIL_SERVICE_API_KEY = process.env.EMAIL_SERVICE_API_KEY ?? "aiem-email-service-key-2026"

/** Check if the Python email service is reachable */
async function isPythonServiceAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${EMAIL_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Send OTP email via Python service */
async function sendViaService(
  to: string,
  code: string,
  userName?: string | null
): Promise<boolean> {
  try {
    const res = await fetch(`${EMAIL_SERVICE_URL}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": EMAIL_SERVICE_API_KEY,
      },
      body: JSON.stringify({ to, code, userName: userName ?? "User" }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      console.error("[Email Service] Error:", data.error)
      return false
    }
    console.log(`[Email Service] OTP sent to ${to}`)
    return true
  } catch (error) {
    console.error("[Email Service] Connection error:", error)
    return false
  }
}

/** Send OTP email via nodemailer with STARTTLS (fallback) */
async function sendViaNodemailer(
  to: string,
  code: string,
  userName?: string | null
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false, // STARTTLS — not SSL
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"AIEM - APPO" <${process.env.SMTP_USER}>`,
      to,
      subject: "Your AIEM Login Code",
      html: buildOtpHtml(code, userName),
      text: `Your AIEM one-time login code is: ${code}\n\nThis code expires in 5 minutes. Do not share it.`,
    })

    console.log(`[Nodemailer] OTP sent to ${to}`)
    return true
  } catch (error) {
    console.error("[Nodemailer] Send error:", error)
    return false
  }
}

/**
 * Send OTP email.
 * 1. Try Python email service (STARTTLS via smtplib)
 * 2. Fall back to nodemailer STARTTLS
 * 3. If both fail in dev (no SMTP config) → log to console
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  userName?: string | null
): Promise<{ success: boolean; dev: boolean }> {
  // Dev console fallback when no SMTP configured
  if (!process.env.SMTP_HOST) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`  [AIEM OTP] Email: ${email}`)
    console.log(`  [AIEM OTP] Code:  ${otp}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    return { success: true, dev: true }
  }

  // 1. Try Python service
  const serviceAvailable = await isPythonServiceAvailable()
  if (serviceAvailable) {
    const sent = await sendViaService(email, otp, userName)
    if (sent) return { success: true, dev: false }
  } else {
    console.warn("[Email] Python service unavailable, falling back to nodemailer")
  }

  // 2. Nodemailer STARTTLS fallback
  const sent = await sendViaNodemailer(email, otp, userName)
  return { success: sent, dev: false }
}

function buildOtpHtml(otp: string, userName?: string | null): string {
  const name = userName ?? "User"
  const spaced = otp.split("").join("  ")
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#F4F7FB;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:12px;overflow:hidden;
               box-shadow:0 4px 20px rgba(27,79,114,.12);border:1px solid #D0E4F0;">
        <tr>
          <td style="background:#1B4F72;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <div style="color:#F4B942;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">APPO</div>
                <div style="color:#fff;font-size:20px;font-weight:bold;">AIEM</div>
                <div style="color:#A3C4DC;font-size:12px;">Africa Interactive Energy Map</div>
              </td>
              <td align="right">
                <div style="background:#F4B942;color:#0D2840;font-size:10px;font-weight:bold;padding:4px 10px;border-radius:4px;letter-spacing:1px;">SECURE LOGIN</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 16px;color:#0D2840;font-size:15px;">Hello <strong>${name}</strong>,</p>
            <p style="margin:0 0 28px;color:#5B8FB9;font-size:14px;line-height:1.6;">
              Use the code below to complete your sign in to AIEM.<br/>
              Valid for <strong>5 minutes</strong> — single use only.
            </p>
            <div style="background:#EBF3FB;border:2px solid #1B4F72;border-radius:10px;text-align:center;padding:28px 20px;margin-bottom:28px;">
              <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#1B4F72;font-family:'Courier New',monospace;">${spaced}</div>
              <div style="color:#5B8FB9;font-size:12px;margin-top:10px;">One-Time Password — expires in 5 minutes</div>
            </div>
            <div style="background:#FFF8EC;border-left:3px solid #F4B942;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:24px;">
              <p style="margin:0;color:#7A5C00;font-size:13px;"><strong>Security notice:</strong> If you did not attempt to log in, please ignore this email.</p>
            </div>
            <p style="margin:0;color:#A3C4DC;font-size:12px;">This is an automated message — please do not reply.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#EBF3FB;padding:16px 32px;border-top:1px solid #D0E4F0;">
            <p style="margin:0;color:#5B8FB9;font-size:11px;text-align:center;">APPO &copy; 2026 &mdash; African Petroleum Producers&apos; Organization</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
