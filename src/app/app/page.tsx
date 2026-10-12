import { Suspense } from "react"
import { MapWorkspace } from "@/components/MapWorkspace"

export default function Home() {
  return <Suspense><MapWorkspace refined /></Suspense>
}
