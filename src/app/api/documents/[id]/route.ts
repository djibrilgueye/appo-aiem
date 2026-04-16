import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const doc = await prisma.countryDocument.findUnique({ where: { id } })
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Delete file from disk (non-blocking, ignore if missing)
    const filePath = path.join(process.cwd(), "public", "uploads", doc.filePath)
    unlink(filePath).catch(() => {})

    await prisma.countryDocument.delete({ where: { id } })
    return NextResponse.json({ message: "Deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, description, type } = body

    const doc = await prisma.countryDocument.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
      },
    })
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
