import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(2),
  countryId: z.string(),
  acronym: z.string().optional().nullable(),
  founded: z.number().int().optional().nullable(),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const countryId = searchParams.get("countryId")
  const companies = await prisma.nationalCompany.findMany({
    where: countryId ? { countryId } : undefined,
    orderBy: { name: "asc" },
  })
  return NextResponse.json(companies)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !["admin", "editor"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const data = schema.parse(await req.json())
    const co = await prisma.nationalCompany.create({ data })
    return NextResponse.json(co, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
