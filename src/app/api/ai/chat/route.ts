import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral"

// ─── Préchauffage du modèle au démarrage ─────────────────────────────────────

async function warmupModel() {
  try {
    await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: "hi" }],
        stream: false,
        options: { num_predict: 1 },
      }),
    })
    console.log(`[AI] Modèle ${OLLAMA_MODEL} préchauffé.`)
  } catch {
    console.warn(`[AI] Préchauffage ${OLLAMA_MODEL} échoué.`)
  }
}

warmupModel()

// ─── Cache prompt (TTL 5 min) — évite de requêter la DB à chaque message ─────

const promptCache: Record<string, { text: string; at: number }> = {}
const PROMPT_TTL = 5 * 60 * 1000

// ─── Prompt système avec données réelles de la DB ────────────────────────────

async function buildSystemPrompt(locale: "fr" | "en" = "fr"): Promise<string> {
  const cached = promptCache[locale]
  if (cached && Date.now() - cached.at < PROMPT_TTL) return cached.text

  try {
    const [countries, basins, refineries, pipelines, reserves, productions, training, rndCenters, storages, petrochems] =
      await Promise.all([
        prisma.country.findMany({
          where: { appoMember: true },
          select: { name: true, code: true },
          orderBy: { name: "asc" },
        }),
        prisma.basin.findMany({
          select: { name: true, type: true, country: { select: { name: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.refinery.findMany({
          where: { country: { appoMember: true } },
          select: { name: true, capacityKbd: true, status: true, country: { select: { name: true } } },
          orderBy: { capacityKbd: "desc" },
        }),
        prisma.pipeline.findMany({
          select: { name: true, status: true, lengthKm: true },
          orderBy: { name: "asc" },
        }),
        prisma.reserve.findMany({
          where: { country: { appoMember: true } },
          select: { oil: true, gas: true, year: true, country: { select: { name: true } } },
          orderBy: [{ country: { name: "asc" } }, { year: "desc" }],
          distinct: ["countryId"],
        }),
        prisma.production.findMany({
          where: { country: { appoMember: true } },
          select: { oil: true, gas: true, year: true, country: { select: { name: true } } },
          orderBy: [{ country: { name: "asc" } }, { year: "desc" }],
          distinct: ["countryId"],
        }),
        prisma.training.findMany({
          where: { country: { appoMember: true } },
          select: { name: true, type: true, country: { select: { name: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.rnDCenter.findMany({
          where: { country: { appoMember: true } },
          select: { name: true, focus: true, country: { select: { name: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.storage.findMany({
          where: { country: { appoMember: true } },
          select: { name: true, type: true, capacityMb: true, country: { select: { name: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.petrochemical.findMany({
          where: { country: { appoMember: true } },
          select: { name: true, capacity: true, country: { select: { name: true } } },
          orderBy: { name: "asc" },
        }),
      ])

    // Bassins regroupés par pays
    const basinsByCountry: Record<string, string[]> = {}
    for (const b of basins) {
      const cn = b.country.name
      if (!basinsByCountry[cn]) basinsByCountry[cn] = []
      basinsByCountry[cn].push(b.name)
    }

    const lines = {
      members: countries.map(c => c.name).join(", "),
      basins: Object.entries(basinsByCountry)
        .map(([cn, bs]) => `  ${cn} (${bs.length}): ${bs.join(", ")}`)
        .join("\n") || "  Aucun bassin enregistré.",
      refineries: refineries.length
        ? refineries.map(r => `  ${r.name} (${r.country.name}) — ${r.capacityKbd} kb/j — ${r.status}`).join("\n")
        : "  Aucune raffinerie enregistrée.",
      pipelines: pipelines.length
        ? pipelines.map(p => `  ${p.name} — ${p.status}${p.lengthKm ? ` — ${p.lengthKm} km` : ""}`).join("\n")
        : "  Aucun pipeline enregistré.",
      reserves: reserves.length
        ? reserves.map(r => `  ${r.country.name} (${r.year}): pétrole ${r.oil} Gbbl, gaz ${r.gas} Tcf`).join("\n")
        : "  Aucune réserve enregistrée.",
      production: productions.length
        ? productions.map(p => `  ${p.country.name} (${p.year}): pétrole ${p.oil} kb/j, gaz ${p.gas} M m³/an`).join("\n")
        : "  Aucune production enregistrée.",
      training: training.length
        ? training.map(t => `  ${t.name} (${t.country.name}) — ${t.type}`).join("\n")
        : "  Aucun institut enregistré.",
      rnd: rndCenters.length
        ? rndCenters.map(r => `  ${r.name} (${r.country.name}) — ${r.focus}`).join("\n")
        : "  Aucun centre enregistré.",
      storage: storages.length
        ? storages.map(s => `  ${s.name} (${s.country.name}) — ${s.type} — ${s.capacityMb} Mb`).join("\n")
        : "  Aucun terminal enregistré.",
      petrochem: petrochems.length
        ? petrochems.map(p => `  ${p.name} (${p.country.name}) — capacité: ${p.capacity}`).join("\n")
        : "  Aucune usine enregistrée.",
    }

    const text = locale === "en" ? `You are APPO-IA, the AI assistant of AIEM (Africa Interactive Energy Map), an interactive hydrocarbon intelligence platform developed by APPO (African Petroleum Producers' Organization). You reply ONLY in English.
ALL numbers you give MUST come exclusively from the database below. Never invent or estimate data.

## APPO MEMBER COUNTRIES (${countries.length})
${lines.members}

## SEDIMENTARY BASINS (${basins.length} total)
${lines.basins}

## REFINERIES (${refineries.length})
${lines.refineries}

## PIPELINES (${pipelines.length})
${lines.pipelines}

## PROVED RESERVES — latest year per country
${lines.reserves}

## PRODUCTION — latest year per country
${lines.production}

## TRAINING INSTITUTES (${training.length})
${lines.training}

## R&D CENTERS (${rndCenters.length})
${lines.rnd}

## STORAGE & LNG TERMINALS (${storages.length})
${lines.storage}

## PETROCHEMICALS (${petrochems.length})
${lines.petrochem}

## PLATFORM NAVIGATION — Features & URLs
- **[Overview](/app?view=overview)**: Dashboard with global statistics and key indicators
- **[Interactive Map](/app?view=map)**: Click markers for details; activate themes in the left panel
- **[Data Table](/app?view=table)**: Tabular view with filters by country, theme and year
- Left panel: select regions/countries, choose year, activate themes, compare countries
- Themes available on map: Sedimentary Basins, Oil Reserves, Gas Reserves, Oil Production, Gas Production, Pipelines, Refineries, Training Institutes, R&D Centers, Storage & LNG, Petrochemicals

## RESPONSE RULES
- LANGUAGE: Always reply in English.
- Be concise (3-4 sentences max unless more detail is requested)
- Numbers must come only from the data above — if absent, say so honestly
- **LINKS — MANDATORY**: Every time you mention a platform view or feature, embed a markdown link using the URLs above. Never say "go to the map" without writing [Interactive Map](/app?view=map). Never say "see the overview" without writing [Overview](/app?view=overview). Examples:
  - ✅ "You can visualize pipelines on the [Interactive Map](/app?view=map)."
  - ✅ "Filter data by country in the [Data Table](/app?view=table)."
  - ✅ "The [Overview](/app?view=overview) shows global statistics."
  - ❌ "Go to the map section" (no link = wrong)
- Do not disclose sensitive information (passwords, user data)

IMPORTANT: All your responses must be in English.`
    : `Tu es APPO-IA, l'assistant IA de la plateforme AIEM (Africa Interactive Energy Map), une plateforme d'intelligence interactive sur les hydrocarbures africains développée par l'APPO (Association des Producteurs de Pétrole Africains). Tu réponds UNIQUEMENT en français, sans exception.
TOUS les chiffres que tu donnes doivent provenir EXCLUSIVEMENT de la base de données ci-dessous. Ne jamais inventer ni estimer.

## PAYS MEMBRES DE L'APPO (${countries.length})
${lines.members}

## BASSINS SÉDIMENTAIRES (${basins.length} total)
${lines.basins}

## RAFFINERIES (${refineries.length})
${lines.refineries}

## PIPELINES (${pipelines.length})
${lines.pipelines}

## RÉSERVES PROUVÉES — dernière année par pays
${lines.reserves}

## PRODUCTION — dernière année par pays
${lines.production}

## INSTITUTS DE FORMATION (${training.length})
${lines.training}

## CENTRES R&D (${rndCenters.length})
${lines.rnd}

## STOCKAGE & TERMINAUX GNL (${storages.length})
${lines.storage}

## PÉTROCHIMIE (${petrochems.length})
${lines.petrochem}

## NAVIGATION SUR LA PLATEFORME — Vues et URLs
- **[Vue Générale](/app?view=overview)** : Tableau de bord avec statistiques globales et indicateurs clés
- **[Carte Interactive](/app?view=map)** : Cliquer sur les marqueurs pour les détails ; activer les thèmes dans le panneau gauche
- **[Tableau de données](/app?view=table)** : Vue tabulaire avec filtres par pays, thème et année
- Panneau gauche : sélectionner régions/pays, choisir l'année, activer les thèmes, comparer des pays
- Thèmes disponibles sur la carte : Bassins sédimentaires, Réserves pétrolières, Réserves gazières, Production pétrolière, Production gazière, Pipelines, Raffineries, Instituts de formation, Centres R&D, Stockage & GNL, Pétrochimie

## RÈGLES DE RÉPONSE
- LANGUE : Réponds TOUJOURS en français, même si la question est posée dans une autre langue.
- Sois concis (3-4 phrases max sauf si l'utilisateur demande plus de détails)
- Chiffres basés uniquement sur les données ci-dessus — si absent, le dire honnêtement
- **LIENS — OBLIGATOIRE** : Chaque fois que tu mentionnes une vue ou fonctionnalité de la plateforme, intègre un lien markdown en utilisant les URLs ci-dessus. Ne dis JAMAIS "allez sur la carte" sans écrire [Carte Interactive](/app?view=map). Ne dis JAMAIS "consultez la vue générale" sans écrire [Vue Générale](/app?view=overview). Exemples :
  - ✅ "Vous pouvez visualiser les pipelines sur la [Carte Interactive](/app?view=map)."
  - ✅ "Filtrez les données par pays dans le [Tableau de données](/app?view=table)."
  - ✅ "La [Vue Générale](/app?view=overview) affiche les statistiques globales."
  - ❌ "Rendez-vous sur la carte" (sans lien = incorrect)
- Ne divulgue pas d'informations sensibles (mots de passe, données personnelles)

IMPORTANT : Toutes tes réponses sont en français.`

    promptCache[locale] = { text, at: Date.now() }
    return text
  } catch (err) {
    console.error("[AI] buildSystemPrompt error:", err)
    return locale === "en"
      ? "You are APPO-IA, AI assistant of AIEM (APPO). Reply in English. Data temporarily unavailable."
      : "Tu es APPO-IA, assistant IA de la plateforme AIEM (APPO). Réponds en français. Données temporairement indisponibles."
  }
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const cookieHeader = request.headers.get("cookie") ?? ""

  try {
    const session = await getServerSession(authOptions)
    // Also accept requests coming from the authenticated /app page
    // (cookie is present but getServerSession may not resolve in App Router)
    const hasSessionCookie = cookieHeader.includes("next-auth.session-token") || cookieHeader.includes("__Secure-next-auth.session-token")
    if (!session && !hasSessionCookie) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Messages requis" }, { status: 400 })
    }

    const { messages } = body
    const localeMatch = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/)
    const locale = localeMatch?.[1] === "en" ? "en" : "fr"
    const systemPrompt = await buildSystemPrompt(locale)

    const ollamaController = new AbortController()
    const timeoutId = setTimeout(() => ollamaController.abort(), 60000)

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        stream: true,
        options: { temperature: 0.2, num_predict: 512 },
      }),
      signal: ollamaController.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text()
      console.error("Ollama error:", err)
      if (ollamaRes.status === 404) {
        return NextResponse.json(
          { error: locale === "en"
            ? `Model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL}`
            : `Modèle "${OLLAMA_MODEL}" non trouvé. Lancez : ollama pull ${OLLAMA_MODEL}` },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: locale === "en" ? "AI assistant unavailable." : "L'assistant IA n'est pas disponible." },
        { status: 503 }
      )
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body?.getReader()
        if (!reader) { controller.close(); return }
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = new TextDecoder().decode(value)
            for (const line of chunk.split("\n").filter(Boolean)) {
              try {
                const json = JSON.parse(line)
                if (json.message?.content) controller.enqueue(encoder.encode(json.message.content))
                if (json.done) { controller.close(); return }
              } catch { /* ignore partial chunks */ }
            }
          }
        } catch (e) {
          console.error("Stream error:", e)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    const isAbort = (error as Error)?.name === "AbortError"
    if (!isAbort) console.error("AI chat error:", error)
    const localeMatch = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/)
    const locale = localeMatch?.[1] === "en" ? "en" : "fr"
    return NextResponse.json({
      error: isAbort
        ? (locale === "en" ? "Request timed out." : "Délai dépassé. Veuillez réessayer.")
        : (locale === "en" ? "Server error." : "Erreur serveur.")
    }, { status: isAbort ? 503 : 500 })
  }
}
