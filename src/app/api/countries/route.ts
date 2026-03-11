import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { createAuditLog, getAuditContext } from "@/lib/audit"

const countrySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(2),
  region: z.string(),
  lat: z.number(),
  lon: z.number(),
  appoMember: z.boolean().default(false),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get("all") === "1"

    const countries = await prisma.country.findMany({
      where: all ? undefined : { active: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            basins: true,
            refineries: true,
          }
        }
      }
    })
    return NextResponse.json(countries)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = countrySchema.parse(body)

    const country = await prisma.country.create({ data })
    createAuditLog({ ...getAuditContext(session, req), action: "CREATE", entity: "Country", entityId: country.id, description: `Created country ${country.name}` }).catch(console.error)
    return NextResponse.json(country, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create country" }, { status: 500 })
  }
}
