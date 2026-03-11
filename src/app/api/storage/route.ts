import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const storages = await prisma.storage.findMany({
      where: { country: { active: true } },
      include: { country: { select: { name: true, code: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(storages)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
