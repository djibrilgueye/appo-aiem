import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: { name, email, role: "user" },
    })

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
