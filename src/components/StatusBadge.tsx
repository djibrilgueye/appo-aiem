import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS_FR,
  normalizeStatus,
} from "@/lib/operationalStatus"

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const canon = normalizeStatus(status)
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE_CLASSES[canon]}`}>
      {STATUS_LABELS_FR[canon]}
    </span>
  )
}
