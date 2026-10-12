import { Suspense } from "react"
import { notFound } from "next/navigation"
import { MapWorkspace } from "@/components/MapWorkspace"

export const dynamic = "force-dynamic"
export const metadata = { title: "AIEM — Ajustements de l’interface actuelle", robots: { index: false, follow: false } }

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ appearance?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound()
  const { appearance } = await searchParams
  return <Suspense><MapWorkspace preview refined={appearance !== "original"} initialView="map" /></Suspense>
}
