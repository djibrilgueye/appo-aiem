/**
 * Envoi d'emails via Microsoft Graph (OAuth 2.0, permission Mail.Send de type
 * application). Auth "client credentials" — aucun mot de passe SMTP, aucune
 * dépendance aux Security Defaults. La boîte expéditrice est GRAPH_MAIL_SENDER
 * (ex. online@apposecretariat.org) et doit exister dans le tenant Azure.
 *
 * Variables d'environnement requises :
 *   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, GRAPH_MAIL_SENDER
 *
 * Tant qu'une variable manque, isGraphMailConfigured() renvoie false et
 * sendMailViaGraph() renvoie false immédiatement — le caller retombe alors sur
 * son fallback SMTP.
 */

const TENANT = process.env.AZURE_TENANT_ID
const CLIENT_ID = process.env.AZURE_CLIENT_ID
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET
const GRAPH_MAIL_SENDER = process.env.GRAPH_MAIL_SENDER || ""

export function isGraphMailConfigured(): boolean {
  return !!(TENANT && CLIENT_ID && CLIENT_SECRET && GRAPH_MAIL_SENDER)
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const body = new URLSearchParams({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  })
  const res = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Graph token error ${res.status}: ${err}`)
  }
  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

export interface GraphMailOptions {
  to: string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  /** Nom d'affichage de l'expéditeur. Défaut : "AIEM Portal". */
  fromName?: string
}

/**
 * Envoie un email via Graph `sendMail` depuis GRAPH_MAIL_SENDER.
 * Renvoie true si Graph accepte (202), false sinon.
 */
export async function sendMailViaGraph(opts: GraphMailOptions): Promise<boolean> {
  if (!isGraphMailConfigured()) return false
  try {
    const token = await getAppToken()
    const senderName = opts.fromName || "AIEM Portal"

    const message: Record<string, unknown> = {
      subject: opts.subject,
      body: { contentType: "HTML", content: opts.html },
      from: { emailAddress: { name: senderName, address: GRAPH_MAIL_SENDER } },
      toRecipients: opts.to.map((address) => ({ emailAddress: { address } })),
      ...(opts.replyTo ? { replyTo: [{ emailAddress: { address: opts.replyTo } }] } : {}),
    }

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(GRAPH_MAIL_SENDER)}/sendMail`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message, saveToSentItems: true }),
      }
    )

    if (res.status === 202) return true
    const err = await res.text()
    console.error(`[graph mail] échec ${res.status}: ${err}`)
    return false
  } catch (e) {
    console.error("[graph mail] exception:", e)
    return false
  }
}
