import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        nationalCompanies: true,
        reserves: { orderBy: { year: "desc" }, take: 1 },
        productions: { orderBy: { year: "desc" }, take: 1 },
        basins: { select: { id: true, name: true, type: true } },
      },
    })
    if (!country) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(country)
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
