"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { DraggableLegend } from "@/components/DraggableLegend"
import { DataTable } from "@/components/DataTable"
import { ComparePanel } from "@/components/ComparePanel"
import { Overview } from "@/components/Overview"
import { AIAssistant } from "@/components/ai/AIAssistant"

// Dynamic import for Leaflet (SSR disabled)
const AIEMMap = dynamic(() => import("@/components/Map").then(mod => mod.AIEMMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: "#EBF5FB" }}>
      <div style={{ color: "#5B8FB9", fontFamily: "Arial, sans-serif", fontSize: "14px" }}>Chargement de la carte…</div>
    </div>
  ),
})

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState(2024)
  const [selectedRegion, setSelectedRegion] = useState("All")
  const [activeThemes, setActiveThemes] = useState<Set<string>>(new Set())
  const [showLabels, setShowLabels] = useState(true)
  const [showPipelineLabels, setShowPipelineLabels] = useState(false)
  const [viewMode, setViewMode] = useState<"overview" | "map" | "table">("overview")
  const [showCompare, setShowCompare] = useState(false)

  // Handle ?view=map&theme=xxx from Overview stat cards or Navbar
  useEffect(() => {
    const view = searchParams.get("view")
    const theme = searchParams.get("theme")
    if (view === "map") {
      setViewMode("map")
      if (theme) {
        setActiveThemes(new Set([theme]))
      }
      router.replace("/app", { scroll: false })
    }
  }, [searchParams, router])

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
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
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
        <div className="flex-1 relative" style={{ backgroundColor: "#F4F7FB", overflowY: "auto", overflowX: "hidden" }}>
          {viewMode === "overview" ? (
            <Overview />
          ) : viewMode === "map" ? (
            <>
              <AIEMMap
                selectedCountries={selectedCountries}
                selectedYear={selectedYear}
                selectedRegion={selectedRegion}
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
      <AIAssistant />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
