import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  companyId: z.string().min(1).optional(),
  name: z.string().min(2).optional(),
  acronym: z.string().optional().nullable(),
  founded: z.number().int().optional().nullable(),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !["admin", "editor"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const data = schema.parse(await req.json())
    const co = await prisma.nationalCompany.update({ where: { id }, data })
    return NextResponse.json(co)
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !["admin", "editor"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.nationalCompany.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
