import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/content?key=themes&lang=fr
// GET /api/admin/content?key=themes  (all langs)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  const lang = searchParams.get("lang")

  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 })

  const where: { key: string; lang?: string } = { key }
  if (lang) where.lang = lang

  const rows = await prisma.contentBlock.findMany({ where })

  // Return as { fr: value, en: value, pt: value }
  const result: Record<string, unknown> = {}
  for (const row of rows) {
    try { result[row.lang] = JSON.parse(row.value) }
    catch { result[row.lang] = row.value }
  }
  return NextResponse.json(result)
}

// PUT /api/admin/content  body: { key, lang, value }
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !["admin", "editor"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { key, lang, value } = body

  if (!key || !lang || value === undefined) {
    return NextResponse.json({ error: "key, lang, value required" }, { status: 400 })
  }

  const stored = typeof value === "string" ? value : JSON.stringify(value)

  await prisma.contentBlock.upsert({
    where: { key_lang: { key, lang } },
    update: { value: stored },
    create: { key, lang, value: stored },
  })

  return NextResponse.json({ ok: true })
}
