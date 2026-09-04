import { NextRequest, NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

/**
 * SSO Azure AD — étape 2 : callback. Échange le code contre les jetons,
 * lit les claims, restreint au domaine @apposecretariat.org, retrouve
 * l'utilisateur en base (sans en créer), puis pose le cookie de session
 * NextAuth (compatible session.strategy="jwt").
 */
const ALLOWED_DOMAIN = "apposecretariat.org"

function decodeJwtClaims(idToken: string): Record<string, unknown> {
  try {
    const payload = idToken.split(".")[1]
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
    return JSON.parse(json)
  } catch {
    return {}
  }
}

function appOrigin(req: NextRequest): string {
  const h = req.headers
  const proto = h.get("x-forwarded-proto") || "https"
  const host = h.get("x-forwarded-host") || h.get("host") || "aiem.apposecretariat.org"
  const scheme = host.includes("localhost") ? proto : "https"
  return `${scheme}://${host}`.replace(/\/$/, "")
}

export async function GET(req: NextRequest) {
  const APP_URL = appOrigin(req)
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const err = url.searchParams.get("error")

  const fail = (reason: string, extra?: Record<string, unknown>) => {
    console.error(`[azure sso] fail: ${reason}`, extra ?? {})
    return NextResponse.redirect(`${APP_URL}/?error=${encodeURIComponent(reason)}`)
  }

  if (err) return fail(err)
  if (!code) return fail("sso_no_code")

  const cookieState = req.cookies.get("azure_oauth_state")?.value
  if (!cookieState || !state || cookieState !== state) return fail("sso_state_mismatch")

  const TENANT = process.env.AZURE_TENANT_ID
  const CLIENT_ID = process.env.AZURE_CLIENT_ID
  const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET
  const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET
  if (!TENANT || !CLIENT_ID || !CLIENT_SECRET || !NEXTAUTH_SECRET) return fail("sso_not_configured")

  const redirectUri = `${APP_URL}/api/auth/azure/callback`

  let tokenJson: { id_token?: string; access_token?: string; error_description?: string }
  try {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        scope: "openid profile email User.Read",
      }),
    })
    tokenJson = await tokenRes.json()
    if (!tokenRes.ok || !tokenJson.id_token) {
      console.error("[azure sso] token exchange failed:", tokenJson)
      return fail("sso_token_error")
    }
  } catch (e) {
    console.error("[azure sso] token exchange exception:", e)
    return fail("sso_token_error")
  }

  const claims = decodeJwtClaims(tokenJson.id_token)
  const email = String(
    claims.preferred_username || claims.email || claims.upn || ""
  ).trim().toLowerCase()
  if (!email) return fail("sso_no_email")

  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await createAuditLog({
      action: "ACCESS_DENIED",
      entity: "User",
      description: `SSO refusé (domaine non autorisé) : ${email}`,
      metadata: { email, reason: "domain_not_allowed" },
      status: "failure",
    }).catch(() => {})
    return fail("sso_domain_not_allowed")
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) {
    await createAuditLog({
      action: "ACCESS_DENIED",
      entity: "User",
      description: `SSO refusé (compte inexistant ou désactivé) : ${email}`,
      metadata: { email, reason: user ? "user_inactive" : "user_not_found" },
      status: "failure",
    }).catch(() => {})
    return fail("sso_user_not_found")
  }

  const isProd = process.env.NODE_ENV === "production"
  const cookieName = isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token"
  const maxAge = 60 * 60 * 24 * 30

  const nextAuthJwt = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    secret: NEXTAUTH_SECRET,
    maxAge,
  })

  createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userName: user.name ?? undefined,
    userRole: user.role,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    description: `Connexion SSO Microsoft réussie pour ${email}`,
    metadata: { email, method: "SSO_AZURE" },
    status: "success",
  }).catch(() => {})

  console.log(`[azure sso] success: ${email} → session cookie set`)
  const res = NextResponse.redirect(`${APP_URL}/app`)
  res.cookies.set(cookieName, nextAuthJwt, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge,
    path: "/",
  })
  res.cookies.delete("azure_oauth_state")
  return res
}
