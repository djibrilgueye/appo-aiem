import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral"

function detectLang(text: string): "fr" | "en" | "other" {
  const t = text.toLowerCase()
  const frWords = /\b(le|la|les|de|du|des|un|une|et|en|je|tu|il|elle|nous|vous|ils|elles|est|sont|avoir|être|que|qui|dans|pour|sur|avec|par|au|aux|ce|cette|ces|mon|ma|mes|son|sa|ses|leur|leurs|mais|ou|donc|car|ni|or)\b/g
  const enWords = /\b(the|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|of|in|to|for|with|on|at|from|by|about|as|into|through|during|a|an|and|but|or|nor|so|yet)\b/g
  const frCount = (t.match(frWords) || []).length
  const enCount = (t.match(enWords) || []).length
  if (frCount === 0 && enCount === 0) return "other"
  return frCount >= enCount ? "fr" : "en"
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { text, targetLang: requestedTarget } = await req.json()
  if (!text || typeof text !== "string" || text.trim().length < 3) {
    return NextResponse.json({ error: "Texte invalide" }, { status: 400 })
  }

  const sourceLang = detectLang(text)
  const targetLang: "fr" | "en" = requestedTarget === "fr" || requestedTarget === "en"
    ? requestedTarget
    : (sourceLang === "fr" ? "en" : "fr")

  if (sourceLang === targetLang) {
    return NextResponse.json({ translation: text, sourceLang, targetLang, sameLanguage: true })
  }

  const targetLabel = targetLang === "fr" ? "French" : "English"
  const prompt = `Translate the following text into ${targetLabel}. Return ONLY the translation, no explanation, no preamble, no quotes.\n\nText:\n${text}`

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: { num_predict: 800, temperature: 0.2 },
      }),
    })
    if (!res.ok) return NextResponse.json({ error: "Service de traduction indisponible" }, { status: 503 })
    const data = await res.json()
    const translation = data.message?.content?.trim() || ""
    return NextResponse.json({ translation, sourceLang, targetLang })
  } catch {
    return NextResponse.json({ error: "Erreur de traduction" }, { status: 503 })
  }
}
