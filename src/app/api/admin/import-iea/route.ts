import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"

const execAsync = promisify(exec)

// Default IEA database path - can be overridden via environment variable
const DEFAULT_IEA_PATH = process.env.IEA_DATABASE_PATH ||
  "/Users/macbookpro/Library/CloudStorage/OneDrive-APPOSECRETARIAT/IEA DATABASE"

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { year, dryRun = false, ieaPath = DEFAULT_IEA_PATH } = body

    // Validate IEA path exists
    if (!fs.existsSync(ieaPath)) {
      return NextResponse.json({
        error: `IEA database path not found: ${ieaPath}`
      }, { status: 400 })
    }

    // Check for WBES.zip
    const wbesZip = path.join(ieaPath, "WBES.zip")
    if (!fs.existsSync(wbesZip)) {
      return NextResponse.json({
        error: `WBES.zip not found in ${ieaPath}`
      }, { status: 400 })
    }

    // Build command
    const scriptPath = path.join(process.cwd(), "scripts", "import-iea.ts")
    let command = `npx tsx "${scriptPath}" --path="${ieaPath}"`

    if (year) {
      command += ` --year=${year}`
    }

    if (dryRun) {
      command += " --dry-run"
    }

    // Run import script
    console.log(`Running IEA import: ${command}`)

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 600000  // 10 minutes timeout
    })

    // Parse output for summary
    const lines = stdout.split("\n")
    const summaryStart = lines.findIndex(l => l.includes("Import Summary"))
    const summary = summaryStart >= 0 ? lines.slice(summaryStart).join("\n") : stdout

    return NextResponse.json({
      success: true,
      dryRun,
      year: year || "all",
      output: summary,
      fullOutput: stdout,
      errors: stderr || null
    })

  } catch (error) {
    console.error("IEA import error:", error)
    return NextResponse.json({
      error: "Import failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Return import status and last import info
    const lastProduction = await prisma.production.findFirst({
      orderBy: { updatedAt: "desc" },
      include: { country: true }
    })

    const productionCount = await prisma.production.count()
    const countriesWithData = await prisma.country.count({
      where: {
        productions: { some: {} }
      }
    })

    const yearsWithData = await prisma.production.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" }
    })

    // Check if IEA files exist
    const ieaPath = DEFAULT_IEA_PATH
    const filesExist = {
      wbes: fs.existsSync(path.join(ieaPath, "WBES.zip")),
      conv: fs.existsSync(path.join(ieaPath, "WCONV.zip")),
      bbl: fs.existsSync(path.join(ieaPath, "WORLD_BBL.zip"))
    }

    return NextResponse.json({
      status: "ready",
      ieaPath,
      filesAvailable: filesExist,
      database: {
        productionRecords: productionCount,
        countriesWithData,
        yearsAvailable: yearsWithData.map(y => y.year),
        lastUpdate: lastProduction?.updatedAt || null
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: "Failed to get import status",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
