import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(req.url)
    const yearParam = url.searchParams.get("year")
    const year = yearParam ? parseInt(yearParam, 10) : null

    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        nationalCompanies: true,
        basins: { select: { id: true, name: true, type: true } },
      },
    })
    if (!country) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Reserves: try requested year, fall back to most recent available
    let reserves = year
      ? await prisma.reserve.findMany({ where: { countryId: id, year }, take: 1 })
      : []
    if (reserves.length === 0) {
      reserves = await prisma.reserve.findMany({
        where: { countryId: id },
        orderBy: { year: "desc" },
        take: 1,
      })
    }

    // Productions: same fallback strategy
    let productions = year
      ? await prisma.production.findMany({ where: { countryId: id, year }, take: 1 })
      : []
    if (productions.length === 0) {
      productions = await prisma.production.findMany({
        where: { countryId: id },
        orderBy: { year: "desc" },
        take: 1,
      })
    }

    return NextResponse.json({ ...country, reserves, productions })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
