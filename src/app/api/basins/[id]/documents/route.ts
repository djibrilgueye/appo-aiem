import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const docs = await prisma.basinDocument.findMany({
      where: { basinId: id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(docs)
  } catch {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const basin = await prisma.basin.findUnique({ where: { id } })
    if (!basin) return NextResponse.json({ error: "Basin not found" }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const type = (formData.get("type") as string) || "document"

    if (!file || !title) return NextResponse.json({ error: "file and title are required" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public", "uploads", "basins", id)
    await mkdir(uploadDir, { recursive: true })

    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const fileName = `${Date.now()}_${sanitized}`
    const filePath = `basins/${id}/${fileName}`

    await writeFile(path.join(uploadDir, fileName), buffer)

    const doc = await prisma.basinDocument.create({
      data: {
        basinId: id,
        title,
        description: description || null,
        type,
        fileName: file.name,
        filePath,
        fileSize: buffer.byteLength,
        mimeType: file.type || null,
        addedBy: session.user.email || null,
      },
    })
    return NextResponse.json(doc, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
