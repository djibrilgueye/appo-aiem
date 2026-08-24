import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * SSO Azure AD — étape 1 : redirige vers Microsoft (OpenID Connect,
 * authorization code flow). Réservé aux comptes @apposecretariat.org.
 * Redirect URI à déclarer côté Azure : {APP_URL}/api/auth/azure/callback
 */
function appOrigin(req: NextRequest): string {
  const h = req.headers
  const proto = h.get("x-forwarded-proto") || "https"
  const host = h.get("x-forwarded-host") || h.get("host") || "aiem.apposecretariat.org"
  const scheme = host.includes("localhost") ? proto : "https"
  return `${scheme}://${host}`.replace(/\/$/, "")
}

export async function GET(req: NextRequest) {
  const TENANT = process.env.AZURE_TENANT_ID
  const CLIENT_ID = process.env.AZURE_CLIENT_ID
  const APP_URL = appOrigin(req)

  if (!TENANT || !CLIENT_ID) {
    return NextResponse.redirect(`${APP_URL}/login?error=sso_not_configured`)
  }

  const redirectUri = `${APP_URL}/api/auth/azure/callback`
  const state = crypto.randomBytes(16).toString("hex")

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid profile email User.Read",
    state,
    prompt: "select_account",
  })

  const authUrl = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize?${params}`
  const res = NextResponse.redirect(authUrl)
  res.cookies.set("azure_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })
  return res
}
