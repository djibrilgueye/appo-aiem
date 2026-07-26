import { z } from "zod"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

/**
 * A Zod schema for optional number fields posted from HTML forms.
 *
 * HTML `<input type="number">` posts the empty string `""` when left blank,
 * which trips `z.number().optional()` — the schema expects `undefined`, not
 * `""`. Wrapping the number in a preprocess() that maps `""` to `undefined`
 * lets admin forms POST `condensat: ""` (or omit the field entirely) without
 * a 400.
 *
 * Accepts: number | numeric string ("42.5") | "" | null | undefined
 * Rejects: any other string, boolean, object, array
 */
export const optionalNumberFromForm = z.preprocess(
  (v) => {
    if (v === "" || v === undefined) return undefined
    if (typeof v === "string") {
      const n = Number(v)
      return Number.isFinite(n) ? n : v
    }
    return v
  },
  z.number().optional(),
)

/**
 * Same as optionalNumberFromForm but preserves explicit `null` so callers can
 * signal "clear this field" on PUT/PATCH. `""` still becomes `undefined`
 * (form skipped it), only an intentional null means "erase in DB".
 */
export const nullableNumberFromForm = z.preprocess(
  (v) => {
    if (v === "" || v === undefined) return undefined
    if (v === null) return null
    if (typeof v === "string") {
      const n = Number(v)
      return Number.isFinite(n) ? n : v
    }
    return v
  },
  z.number().nullable().optional(),
)

/**
 * Turn a caught error into an actionable NextResponse instead of the
 * generic 500 the app was returning for every mutation failure.
 *
 * - ZodError → 400 with the issue list, so the client can show which field
 * - Prisma P2002 (unique constraint) → 409 with the offending field name, so
 *   admins hitting a duplicate ID see "ID already taken" instead of an
 *   opaque 500
 * - Prisma P2025 (record not found) → 404
 * - Anything else → the fallback the caller passes in (usually 500 with a
 *   short message)
 *
 * Usage:
 *   } catch (error) {
 *     return apiError(error, "Failed to create refinery")
 *   }
 */
export function apiError(error: unknown, fallback: string): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.issues }, { status: 400 })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      // meta.target = ["refineryId"] or ["email"] etc.
      const target = (error.meta?.target as string[] | string | undefined) ?? "unique field"
      const field = Array.isArray(target) ? target.join(", ") : String(target)
      return NextResponse.json(
        { error: `Duplicate value for unique field: ${field}`, code: "P2002", field },
        { status: 409 },
      )
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Record not found", code: "P2025" }, { status: 404 })
    }
    if (error.code === "P2003") {
      // Foreign-key violation on delete
      return NextResponse.json(
        { error: "Cannot delete: this record is still referenced by other rows.", code: "P2003" },
        { status: 409 },
      )
    }
  }
  console.error("[apiError]", error)
  return NextResponse.json({ error: fallback }, { status: 500 })
}
