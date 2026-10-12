import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import path from "node:path"

const root = process.cwd()
const backupRoot = path.join(root, "backups")
const reference = JSON.parse(await readFile(path.join(backupRoot, "preview-production.json"), "utf8"))
const snapshot = path.resolve(backupRoot, reference.file)
if (!snapshot.startsWith(backupRoot + path.sep) || path.basename(snapshot) !== "business-snapshot.db") throw new Error("Chemin de copie locale invalide")
if (createHash("sha256").update(await readFile(snapshot)).digest("hex") !== reference.sha256) throw new Error("La copie de référence a changé. Vérifier son intégrité avant de relancer l’aperçu.")

console.log("AIEM · Aperçu local de l’interface existante · http://127.0.0.1:3334/preview")
console.log(`Copie métier de production du ${reference.capturedAt.slice(0, 10)} · lecture seule`)
const child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3334"], {
  cwd: root, stdio: "inherit",
  env: { ...process.env, DATABASE_URL: `file:${snapshot}?mode=ro`, AIEM_REVIEW_MODE: "1", NEXTAUTH_URL: "http://127.0.0.1:3334" },
})
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal))
child.on("exit", code => { process.exitCode = code ?? 0 })
