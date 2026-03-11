"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

// Map URL segments → human-readable labels
const SEGMENT_LABELS: Record<string, string> = {
  admin:         "Admin",
  countries:     "Countries",
  basins:        "Basins",
  refineries:    "Refineries",
  pipelines:     "Pipelines",
  reserves:      "Reserves",
  production:    "Production",
  users:         "Users",
  "audit-logs":  "Audit Logs",
  "allowed-emails": "Allowed Emails",
  content:       "Content",
  import:        "Import",
  new:           "New",
  edit:          "Edit",
}

function labelFor(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment
}

// Detect dynamic segment (cuid-like IDs: starts with 'c' or long alphanumeric)
function isDynamicId(segment: string): boolean {
  return /^[a-z0-9]{20,}$/i.test(segment)
}

export function AdminBreadcrumb() {
  const pathname = usePathname()

  // Build crumbs from path segments
  const segments = pathname.split("/").filter(Boolean)
  // e.g. ["admin", "countries", "abc123", "edit"]

  type Crumb = { label: string; href: string; current: boolean }
  const crumbs: Crumb[] = []

  let path = ""
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    path += `/${seg}`

    // Skip dynamic IDs in the breadcrumb trail (they get merged with next label)
    if (isDynamicId(seg)) continue

    const isLast = i === segments.length - 1 ||
      // if next segment is an ID then "edit" after it is last
      (i === segments.length - 2 && isDynamicId(segments[i + 1]))

    crumbs.push({ label: labelFor(seg), href: path, current: isLast })
  }

  if (crumbs.length <= 1) return null // on admin root, no breadcrumb needed

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm mb-4">
      <Link
        href="/"
        className="flex items-center gap-1 text-[#5B8FB9] hover:text-[#1B4F72] transition-colors"
      >
        <Home size={14} />
      </Link>

      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-[#D0E4F0]" />
          {crumb.current ? (
            <span className="text-[#1B4F72] font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-[#5B8FB9] hover:text-[#1B4F72] transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
