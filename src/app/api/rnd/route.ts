import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const rndCenters = await prisma.rnDCenter.findMany({
      where: { country: { active: true } },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(rndCenters)
  } catch {
    return NextResponse.json({ error: "Failed to fetch R&D centers" }, { status: 500 })
  }
}
