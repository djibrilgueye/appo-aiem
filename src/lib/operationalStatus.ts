// Single source of truth for operational status across all asset themes.
// Values are stored in DB as the lowercase English strings below.

export const OPERATIONAL_STATUSES = [
  "operational",
  "under construction",
  "proposed",
  "offline",
  "concept",
  "decommissioned",
] as const

export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number]

export const STATUS_LABELS_FR: Record<OperationalStatus, string> = {
  "operational":        "Opérationnel",
  "under construction": "En construction",
  "proposed":           "Proposé",
  "offline":            "À l'arrêt",
  "concept":            "Concept",
  "decommissioned":     "Démantelé",
}

export const STATUS_LABELS_EN: Record<OperationalStatus, string> = {
  "operational":        "Operational",
  "under construction": "Under construction",
  "proposed":           "Proposed",
  "offline":            "Offline",
  "concept":            "Concept",
  "decommissioned":     "Decommissioned",
}

// Tailwind-friendly badge styles
export const STATUS_BADGE_CLASSES: Record<OperationalStatus, string> = {
  "operational":        "bg-green-100  text-green-800  border border-green-300",
  "under construction": "bg-yellow-100 text-yellow-800 border border-yellow-300",
  "proposed":           "bg-blue-100   text-blue-800   border border-blue-300",
  "offline":            "bg-gray-200   text-gray-800   border border-gray-400",
  "concept":            "bg-gray-100   text-gray-600   border border-gray-300",
  "decommissioned":     "bg-red-100    text-red-800    border border-red-300",
}

// Hex colors for map markers
export const STATUS_COLORS: Record<OperationalStatus, string> = {
  "operational":        "#16a34a",
  "under construction": "#eab308",
  "proposed":           "#3b82f6",
  "offline":            "#6b7280",
  "concept":            "#d1d5db",
  "decommissioned":     "#dc2626",
}

// Maps legacy / theme-specific values to the canonical 6-value vocabulary.
// Used during DB migration and at read time as a defensive fallback.
const LEGACY_STATUS_MAP: Record<string, OperationalStatus> = {
  // refineries / storage
  "planned":          "proposed",
  "idle":             "offline",
  "closed":           "decommissioned",
  // blocks (FR)
  "Libre":            "proposed",
  "Attribué":         "operational",
  "Exploration":      "under construction",
  "Production":       "operational",
  "Abandonné":        "decommissioned",
  // fields (FR)
  "En production":    "operational",
  "En développement": "under construction",
  "Découverte":       "concept",
}

/** Normalize any raw status string (legacy or empty) to a canonical value. */
export function normalizeStatus(raw: string | null | undefined): OperationalStatus {
  if (!raw) return "operational"
  const trimmed = raw.trim()
  if ((OPERATIONAL_STATUSES as readonly string[]).includes(trimmed)) {
    return trimmed as OperationalStatus
  }
  if (trimmed in LEGACY_STATUS_MAP) return LEGACY_STATUS_MAP[trimmed]
  // Case-insensitive fallback
  const lower = trimmed.toLowerCase()
  for (const s of OPERATIONAL_STATUSES) {
    if (s === lower) return s
  }
  return "operational"
}

export function statusLabel(status: string | null | undefined, lang: "fr" | "en" = "fr"): string {
  const canon = normalizeStatus(status)
  return (lang === "en" ? STATUS_LABELS_EN : STATUS_LABELS_FR)[canon]
}
