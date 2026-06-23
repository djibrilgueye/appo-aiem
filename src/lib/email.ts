import nodemailer from "nodemailer"

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL ?? "http://localhost:5003"
const EMAIL_SERVICE_API_KEY = process.env.EMAIL_SERVICE_API_KEY ?? "appo-email-service-key-2026"

// Sender display name (overrides the shared email-service's default FROM_NAME).
// Plumbed per request via the `fromName` body field on /send and /send-otp.
const FROM_NAME = "APPO AIEM Platform"

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
      body: JSON.stringify({ to, code, userName: userName ?? "User", fromName: FROM_NAME }),
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
      from: process.env.SMTP_FROM ?? `"${FROM_NAME}" <${process.env.SMTP_USER}>`,
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

// ─── Invitation email (admin creates user) ───────────────────────────────────

/** Build the HTML body for the invitation email (bilingual FR + EN, no OTP). */
function buildInvitationHtml(userName: string, loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#F4F7FB;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:40px 20px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:12px;overflow:hidden;
               box-shadow:0 4px 20px rgba(27,79,114,.12);border:1px solid #D0E4F0;">
        <tr>
          <td style="background:#1B4F72;padding:24px 32px;">
            <div style="color:#F4B942;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">APPO</div>
            <div style="color:#fff;font-size:20px;font-weight:bold;">AIEM</div>
            <div style="color:#A3C4DC;font-size:12px;">Africa Interactive Energy Map</div>
          </td>
        </tr>

        <!-- French -->
        <tr>
          <td style="padding:32px 32px 16px;">
            <div style="display:inline-block;background:#EBF3FB;color:#1B4F72;font-size:10px;font-weight:bold;letter-spacing:1px;padding:3px 8px;border-radius:4px;margin-bottom:12px;">FRANÇAIS</div>
            <p style="margin:0 0 12px;color:#0D2840;font-size:16px;"><strong>Bonjour ${userName},</strong></p>
            <p style="margin:0 0 14px;color:#5B8FB9;font-size:14px;line-height:1.6;">
              Un compte vient d'être créé pour vous sur la plateforme <strong>AIEM</strong> (Africa Interactive Energy Map).
            </p>
            <p style="margin:0 0 14px;color:#5B8FB9;font-size:14px;line-height:1.6;">
              Pour vous connecter, rendez-vous sur
              <a href="${loginUrl}" style="color:#1B4F72;font-weight:bold;">${loginUrl}</a>
              et saisissez votre adresse email : un code de connexion à usage unique vous sera envoyé par email.
            </p>
          </td>
        </tr>

        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #EBF3FB;margin:0;"/></td></tr>

        <!-- English -->
        <tr>
          <td style="padding:16px 32px 24px;">
            <div style="display:inline-block;background:#EBF3FB;color:#1B4F72;font-size:10px;font-weight:bold;letter-spacing:1px;padding:3px 8px;border-radius:4px;margin-bottom:12px;">ENGLISH</div>
            <p style="margin:0 0 12px;color:#0D2840;font-size:16px;"><strong>Hello ${userName},</strong></p>
            <p style="margin:0 0 14px;color:#5B8FB9;font-size:14px;line-height:1.6;">
              An account has just been created for you on the <strong>AIEM</strong> platform (Africa Interactive Energy Map).
            </p>
            <p style="margin:0 0 14px;color:#5B8FB9;font-size:14px;line-height:1.6;">
              To sign in, go to
              <a href="${loginUrl}" style="color:#1B4F72;font-weight:bold;">${loginUrl}</a>
              and enter your email address: a one-time login code will be sent to your inbox.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 28px;">
            <div style="background:#FFF8EC;border-left:3px solid #F4B942;padding:12px 16px;border-radius:0 6px 6px 0;">
              <p style="margin:0;color:#7A5C00;font-size:12px;line-height:1.5;">
                <strong>FR —</strong> Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message.<br/>
                <strong>EN —</strong> If you weren't expecting this invitation, you can safely ignore this message.
              </p>
            </div>
            <p style="margin:14px 0 0;color:#A3C4DC;font-size:11px;text-align:center;">
              Message automatique — merci de ne pas répondre · Automated message — please do not reply
            </p>
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

/**
 * Send an invitation email to a newly-created user.
 * Bilingual FR + EN body. Does NOT include any OTP code — the user requests a
 * fresh login code from the login page when they connect for the first time.
 * Uses the generic /send endpoint of the Python email service.
 * Falls back to nodemailer if the service is unavailable.
 * Logs to the console in dev mode when no SMTP is configured.
 */
export async function sendInvitationEmail(
  email: string,
  userName: string,
  loginUrl: string,
): Promise<{ success: boolean; dev: boolean }> {
  const subject = "Invitation AIEM — Africa Interactive Energy Map"
  const html = buildInvitationHtml(userName, loginUrl)
  const text =
    `Bonjour ${userName},\n\n` +
    `Un compte AIEM vient d'être créé pour vous.\n` +
    `Pour vous connecter, rendez-vous sur ${loginUrl} et saisissez votre email — ` +
    `un code de connexion à usage unique vous sera envoyé par email.\n\n` +
    `— — —\n\n` +
    `Hello ${userName},\n\n` +
    `An account has been created for you on AIEM.\n` +
    `To sign in, go to ${loginUrl} and enter your email — a one-time login code will be sent to your inbox.\n`

  // Dev console fallback
  if (!process.env.SMTP_HOST) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`  [AIEM INVITE] To:    ${email}`)
    console.log(`  [AIEM INVITE] Name:  ${userName}`)
    console.log(`  [AIEM INVITE] URL:   ${loginUrl}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    return { success: true, dev: true }
  }

  // 1. Try Python /send
  try {
    const res = await fetch(`${EMAIL_SERVICE_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": EMAIL_SERVICE_API_KEY },
      body: JSON.stringify({ to: email, subject, html, text, fromName: FROM_NAME }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (res.ok && data.success) {
      console.log(`[Email Service] Invitation sent to ${email}`)
      return { success: true, dev: false }
    }
    console.error("[Email Service] Invite error:", data.error)
  } catch (err) {
    console.error("[Email Service] Invite connection error:", err)
  }

  // 2. Fallback to nodemailer
  try {
    const nodemailer = await import("nodemailer")
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      requireTLS: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    })
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"${FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
      text,
    })
    console.log(`[Nodemailer] Invitation sent to ${email}`)
    return { success: true, dev: false }
  } catch (err) {
    console.error("[Nodemailer] Invite send error:", err)
    return { success: false, dev: false }
  }
}
