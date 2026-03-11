"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { DraggableLegend } from "@/components/DraggableLegend"
import { DataTable } from "@/components/DataTable"
import { ComparePanel } from "@/components/ComparePanel"
import { Overview } from "@/components/Overview"

// Dynamic import for Leaflet (SSR disabled)
const AIEMMap = dynamic(() => import("@/components/Map").then(mod => mod.AIEMMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: "#EBF5FB" }}>
      <div style={{ color: "#5B8FB9", fontFamily: "Arial, sans-serif", fontSize: "14px" }}>Chargement de la carte…</div>
    </div>
  ),
})

export default function Home() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState(2024)
  const [activeThemes, setActiveThemes] = useState<Set<string>>(
    new Set(["basins", "oil_reserves", "gas_reserves", "oil_production", "gas_production", "pipelines", "refineries", "training", "rnd"])
  )
  const [showLabels, setShowLabels] = useState(true)
  const [showPipelineLabels, setShowPipelineLabels] = useState(false)
  const [viewMode, setViewMode] = useState<"overview" | "map" | "table">("overview")
  const [showCompare, setShowCompare] = useState(false)

  return (
    <div className="h-screen flex flex-col">
      <Navbar onShowMap={() => setViewMode("map")} />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[340px] flex-shrink-0 overflow-auto" style={{ borderRight: "1px solid #D0E4F0" }}>
          <Sidebar
            selectedCountries={selectedCountries}
            setSelectedCountries={setSelectedCountries}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            activeThemes={activeThemes}
            setActiveThemes={setActiveThemes}
            showLabels={showLabels}
            setShowLabels={setShowLabels}
            showPipelineLabels={showPipelineLabels}
            setShowPipelineLabels={setShowPipelineLabels}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onCompare={() => setShowCompare(true)}
          />
        </div>
        <div className="flex-1 relative overflow-auto">
          {viewMode === "overview" ? (
            <Overview />
          ) : viewMode === "map" ? (
            <>
              <AIEMMap
                selectedCountries={selectedCountries}
                selectedYear={selectedYear}
                activeThemes={activeThemes}
                showLabels={showLabels}
                showPipelineLabels={showPipelineLabels}
              />
              <DraggableLegend activeThemes={activeThemes} />
              {/* Footer */}
              <div className="absolute right-3 bottom-3 px-3 py-1 rounded-lg text-xs z-[1000]"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#1B4F72", border: "1px solid #D0E4F0", fontFamily: "Arial, sans-serif" }}>
                APPO © 2026
              </div>
            </>
          ) : (
            <DataTable
              selectedCountries={selectedCountries}
              selectedYear={selectedYear}
              activeThemes={activeThemes}
            />
          )}
          {showCompare && (
            <ComparePanel
              selectedCountries={selectedCountries}
              selectedYear={selectedYear}
              onClose={() => setShowCompare(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
