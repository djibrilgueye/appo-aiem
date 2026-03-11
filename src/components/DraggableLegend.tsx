"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { useLanguage } from "@/i18n/LanguageContext"

interface DraggableLegendProps {
  activeThemes: Set<string>
}

// Pipeline status line styles
const PIPELINE_STATUSES = [
  { label: "operational",        color: "#1B4F72", dash: undefined },
  { label: "under construction", color: "#F4B942", dash: "10,5" },
  { label: "proposed",           color: "#5B8FB9", dash: "4,6" },
  { label: "offline",            color: "#9CA3AF", dash: "6,4" },
  { label: "concept",            color: "#A78BFA", dash: "3,8" },
]

// Marker items per theme key
function useThemeItems(activeThemes: Set<string>, t: ReturnType<typeof useLanguage>["t"]) {
  const items: { icon: string; label: string }[] = []

  if (activeThemes.has("basins"))
    items.push({ icon: "🟤", label: t.map.basin })
  if (activeThemes.has("refineries"))
    items.push({ icon: "🏭", label: t.map.refinery })
  if (activeThemes.has("rnd"))
    items.push({ icon: "🔬", label: t.map.rnd })
  if (activeThemes.has("training"))
    items.push({ icon: "🎓", label: t.map.training })
  if (activeThemes.has("storage"))
    items.push({ icon: "🏪", label: t.map.storage })
  if (activeThemes.has("petrochem"))
    items.push({ icon: "🧬", label: t.map.petrochem })
  if (activeThemes.has("oil_reserves"))
    items.push({ icon: "🟢", label: t.map.oilReserves })
  if (activeThemes.has("gas_reserves"))
    items.push({ icon: "🔵", label: t.map.gasReserves })
  if (activeThemes.has("oil_production"))
    items.push({ icon: "🔴", label: t.map.oilProduction })
  if (activeThemes.has("gas_production"))
    items.push({ icon: "🔥", label: t.map.gasProduction })
  if (activeThemes.has("imports"))
    items.push({ icon: "⬇️", label: "Imports" })
  if (activeThemes.has("exports"))
    items.push({ icon: "⬆️", label: "Exports" })

  return items
}

export function DraggableLegend({ activeThemes }: DraggableLegendProps) {
  const { t } = useLanguage()
  const legendRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [collapsed, setCollapsed] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const items = useThemeItems(activeThemes, t)
  const showPipelines = activeThemes.has("pipelines")

  // Initialize position to top-right
  useEffect(() => {
    if (legendRef.current && !initialized) {
      const parent = legendRef.current.parentElement
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        const legendRect = legendRef.current.getBoundingClientRect()
        setPos({ x: parentRect.width - legendRect.width - 12, y: 12 })
        setInitialized(true)
      }
    }
  }, [initialized])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    e.preventDefault()
    setDragging(true)
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y })
  }, [pos])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return
    setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }, [dragging, offset])

  const onMouseUp = useCallback(() => setDragging(false), [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
      return () => {
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("mouseup", onMouseUp)
      }
    }
  }, [dragging, onMouseMove, onMouseUp])

  if (items.length === 0 && !showPipelines) return null

  return (
    <div
      ref={legendRef}
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        zIndex: 1000,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
        minWidth: "200px",
        maxWidth: "240px",
        backgroundColor: "#ffffff",
        border: "1px solid #D0E4F0",
        borderRadius: "10px",
        boxShadow: "0 4px 16px rgba(27,79,114,0.12)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        backgroundColor: "#1B4F72",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ color: "#F4B942", fontSize: "11px", fontWeight: "bold", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}>
          {t.map.legend}
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            backgroundColor: "rgba(244,185,66,0.2)",
            border: "1px solid rgba(244,185,66,0.4)",
            color: "#F4B942",
            borderRadius: "4px",
            padding: "1px 6px",
            fontSize: "11px",
            cursor: "pointer",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {collapsed ? "▼" : "▲"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "10px 12px" }}>

          {/* Marker items */}
          {items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: showPipelines ? "10px" : 0 }}>
              {items.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#0D2840", fontFamily: "Arial, sans-serif" }}>
                  <span style={{ fontSize: "14px", lineHeight: 1 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pipeline status lines */}
          {showPipelines && (
            <>
              {items.length > 0 && (
                <div style={{ borderTop: "1px solid #D0E4F0", margin: "8px 0 8px" }} />
              )}
              <div style={{ fontSize: "10px", fontWeight: "bold", color: "#1B4F72", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "Arial, sans-serif" }}>
                Pipelines
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {PIPELINE_STATUSES.map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#0D2840", fontFamily: "Arial, sans-serif" }}>
                    <svg width="28" height="6" style={{ flexShrink: 0 }}>
                      <line x1="0" y1="3" x2="28" y2="3" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash} />
                    </svg>
                    <span style={{ textTransform: "capitalize" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
