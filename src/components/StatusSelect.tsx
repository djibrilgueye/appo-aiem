import {
  OPERATIONAL_STATUSES,
  STATUS_LABELS_FR,
  type OperationalStatus,
  normalizeStatus,
} from "@/lib/operationalStatus"

interface StatusSelectProps {
  value: string
  onChange: (value: OperationalStatus) => void
  required?: boolean
  className?: string
  id?: string
}

export function StatusSelect({ value, onChange, required, className, id }: StatusSelectProps) {
  return (
    <select
      id={id}
      required={required}
      value={normalizeStatus(value)}
      onChange={e => onChange(e.target.value as OperationalStatus)}
      className={
        className ??
        "w-full px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#D0E4F0] text-[#0D2840] focus:outline-none focus:border-[#1B4F72]"
      }
    >
      {OPERATIONAL_STATUSES.map(s => (
        <option key={s} value={s}>
          {STATUS_LABELS_FR[s]}
        </option>
      ))}
    </select>
  )
}
