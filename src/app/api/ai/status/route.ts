import { NextResponse } from "next/server"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral"

export async function GET() {
  try {
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: ctrl.signal }).finally(() => clearTimeout(tid))
    if (!res.ok) return NextResponse.json({ available: false })
    const data = await res.json()
    const models: Array<{ name: string }> = data.models ?? []
    const available = models.some((m) => m.name.startsWith(OLLAMA_MODEL))
    return NextResponse.json({ available })
  } catch {
    return NextResponse.json({ available: false })
  }
}
