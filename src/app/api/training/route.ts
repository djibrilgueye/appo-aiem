import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const training = await prisma.training.findMany({
      where: { country: { active: true } },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(training)
  } catch {
    return NextResponse.json({ error: "Failed to fetch training institutes" }, { status: 500 })
  }
}
