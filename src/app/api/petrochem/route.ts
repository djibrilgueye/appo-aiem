import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const plants = await prisma.petrochemical.findMany({
      where: { country: { active: true } },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { name: "asc" },
    })
    const parsed = plants.map(p => ({
      ...p,
      products: JSON.parse(p.products),
    }))
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
