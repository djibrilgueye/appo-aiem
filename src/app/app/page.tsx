"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { DraggableLegend } from "@/components/DraggableLegend"
import { DataTable } from "@/components/DataTable"
import { ComparePanel } from "@/components/ComparePanel"
import { Overview } from "@/components/Overview"
import { AIAssistant } from "@/components/ai/AIAssistant"
import { OPERATIONAL_STATUSES } from "@/lib/operationalStatus"

// Dynamic import for Leaflet (SSR disabled)
const AIEMMap = dynamic(() => import("@/components/Map").then(mod => mod.AIEMMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: "#D4E5F5" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4F72]" />
        <span className="text-sm font-semibold text-[#1B4F72]">Chargement de la carte…</span>
      </div>
    </div>
  ),
})

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026]

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState(2024)
  const [selectedRegion, setSelectedRegion] = useState("All")
  const [activeThemes, setActiveThemes] = useState<Set<string>>(new Set())
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set(OPERATIONAL_STATUSES))
  const [showLabels, setShowLabels] = useState(true)
  const [showPipelineLabels, setShowPipelineLabels] = useState(false)
  const [viewMode, setViewMode] = useState<"overview" | "map" | "table">("overview")
  const [showCompare, setShowCompare] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Handle ?view=<map|table|overview>&theme=xxx from Overview stat cards,
  // Navbar links, or AI assistant links.
  useEffect(() => {
    const view = searchParams.get("view")
    const theme = searchParams.get("theme")
    if (view === "map" || view === "table" || view === "overview") {
      setViewMode(view)
      if (view === "map" && theme) {
        // Add to the existing selection instead of wiping it.
        setActiveThemes(prev => new Set([...prev, theme]))
      }
      router.replace("/app", { scroll: false })
    }
  }, [searchParams, router])

  // Chronological play/pause across YEARS (loops back to 2021 after 2026).
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setSelectedYear(prev => {
          const i = YEARS.indexOf(prev)
          return YEARS[(i + 1) % YEARS.length]
        })
      }, 2500)
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current)
      playTimerRef.current = null
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [isPlaying])

  return (
    <div className="h-screen flex flex-col">
      <Navbar onShowMap={() => setViewMode("map")} />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar — collapsible */}
        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 overflow-auto ${
            sidebarCollapsed ? "w-0 opacity-0" : "w-[340px] opacity-100"
          }`}
          style={{ borderRight: "1px solid #D0E4F0" }}
        >
          <Sidebar
            selectedCountries={selectedCountries}
            setSelectedCountries={setSelectedCountries}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            activeThemes={activeThemes}
            setActiveThemes={setActiveThemes}
            activeStatuses={activeStatuses}
            setActiveStatuses={setActiveStatuses}
            showLabels={showLabels}
            setShowLabels={setShowLabels}
            showPipelineLabels={showPipelineLabels}
            setShowPipelineLabels={setShowPipelineLabels}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onCompare={() => setShowCompare(true)}
          />
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          title={sidebarCollapsed ? "Afficher les filtres" : "Masquer les filtres"}
          className="absolute top-4 z-30 transition-all duration-300 flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-white/90 backdrop-blur-md border border-slate-200 text-[#1B4F72] hover:bg-[#1B4F72] hover:text-white"
          style={{ left: sidebarCollapsed ? "16px" : "324px" }}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

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
                activeStatuses={activeStatuses}
                showLabels={showLabels}
                showPipelineLabels={showPipelineLabels}
              />
              <DraggableLegend activeThemes={activeThemes} />

              {/* Floating interactive timeline (2021 → 2026) with Play/Pause */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] select-none">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/50 shadow-2xl">
                  <button
                    onClick={() => setIsPlaying(p => !p)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-transform hover:scale-105"
                    style={{ backgroundColor: "#1B4F72" }}
                    title={isPlaying ? "Mettre en pause" : "Lancer l'animation chronologique"}
                  >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                  </button>

                  <div className="flex items-center gap-1">
                    {YEARS.map(year => (
                      <button
                        key={year}
                        onClick={() => { setSelectedYear(year); setIsPlaying(false) }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedYear === year
                            ? "bg-[#1B4F72] text-white shadow-sm scale-105"
                            : "text-[#1B4F72] hover:bg-slate-100"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>

                  <span className="w-px h-6 bg-slate-200 mx-1" />

                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Données APPO</span>
                    <span className="text-xs font-extrabold text-[#1B4F72]">Édition {selectedYear}</span>
                  </div>
                </div>
              </div>

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
