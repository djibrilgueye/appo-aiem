const XLSX = require("xlsx")
const fs = require("fs")
const path = require("path")

const templatesDir = path.join(__dirname, "../templates")

// Read all CSV files
const csvFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith(".csv")).sort()

// Create a workbook with one sheet per CSV
const wb = XLSX.utils.book_new()

for (const csvFile of csvFiles) {
  const filePath = path.join(templatesDir, csvFile)
  const raw = fs.readFileSync(filePath, "utf-8")

  // Parse all non-blank lines, keeping comments
  const rawLines = raw.split("\n").filter(line => line.trim().length > 0)

  // Build array-of-arrays: comment lines go in column A as a single cell
  // data lines are split by comma
  const aoa = rawLines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith("#")) {
      return [trimmed] // comment: single cell in col A
    }
    return trimmed.split(",").map(cell => cell.trim())
  })

  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Track which rows are comments and which is the header
  // so we can mark them with merge + italic metadata (best effort in xlsx)
  const commentRows = []
  let headerRow = -1
  rawLines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith("#")) commentRows.push(i)
    else if (headerRow === -1) headerRow = i
  })

  // Determine max column count (from header row)
  const maxCols = aoa.reduce((m, row) => Math.max(m, row.length), 1)

  // Merge comment rows across all columns so the text spans the full width
  ws["!merges"] = commentRows.map(r => ({
    s: { r, c: 0 },
    e: { r, c: maxCols - 1 },
  }))

  // Auto-size columns based on data rows only
  const ref = ws["!ref"]
  if (ref) {
    const range = XLSX.utils.decode_range(ref)
    const colWidths = []
    for (let C = range.s.c; C <= range.e.c; C++) {
      let maxLen = 10
      for (let R = range.s.r; R <= range.e.r; R++) {
        if (commentRows.includes(R)) continue // skip comment rows for width calc
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
        if (cell && cell.v) {
          const len = String(cell.v).length
          if (len > maxLen) maxLen = len
        }
      }
      colWidths.push({ wch: Math.min(maxLen + 2, 60) })
    }
    ws["!cols"] = colWidths
  }

  // Sheet name: strip file extension and numbering prefix for readability
  // e.g. "01_COUNTRIES.csv" → "COUNTRIES"
  const sheetName = csvFile
    .replace(".csv", "")
    .replace(/^\d+_/, "")
    .replace(/_/g, " ")
    .slice(0, 31) // Excel sheet name max 31 chars

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  console.log(`  ✓ ${csvFile} → sheet "${sheetName}"`)
}

const outputPath = path.join(templatesDir, "AIEM_Data_Collection_Templates.xlsx")
XLSX.writeFile(wb, outputPath)
console.log(`\n✅ Fichier créé : ${outputPath}`)
