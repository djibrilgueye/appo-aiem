import { NextResponse } from "next/server"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// The AI assistant runs on Claude (hosted API). No need to probe a local model:
// reporting "available" iff the API key is configured is what the UI needs to
// show its green/red status dot.
export async function GET() {
  return NextResponse.json({ available: Boolean(ANTHROPIC_API_KEY) })
}
