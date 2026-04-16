"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { BarChart3, Info } from "lucide-react"

interface Country {
  id: string; code: string; name: string; region: string
  gdpBnUsd: number | null; economyDesc: string | null
  capital: string | null; currency: string | null; population: number | null
}

export default function CountryEconomicsPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [country, setCountry] = useState<Country | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (!id) return
    fetch(`/api/countries/${id}`)
      .then(r => r.json())
      .then(d => { if (d?.code) setCountry(d) })
      .finally(() => setFetching(false))
  }, [id])

  if (status === "loading" || fetching) return null
  if (!country) return null

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/countries" className="text-[#5B8FB9] hover:text-[#1B4F72]">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0D2840]">Données Économiques</h1>
          <p className="text-[#5B8FB9] font-mono text-sm">{country.code} — {country.name}</p>
        </div>
      </div>

      {/* Current data summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#D0E4F0] rounded-xl p-5">
          <p className="text-[#5B8FB9] text-xs uppercase tracking-wide mb-1">PIB</p>
          <p className="text-2xl font-bold text-[#0D2840]">
            {country.gdpBnUsd != null ? `${country.gdpBnUsd} Mds USD` : "—"}
          </p>
        </div>
        <div className="bg-white border border-[#D0E4F0] rounded-xl p-5">
          <p className="text-[#5B8FB9] text-xs uppercase tracking-wide mb-1">Population</p>
          <p className="text-2xl font-bold text-[#0D2840]">
            {country.population != null ? country.population.toLocaleString() : "—"}
          </p>
        </div>
        <div className="bg-white border border-[#D0E4F0] rounded-xl p-5">
          <p className="text-[#5B8FB9] text-xs uppercase tracking-wide mb-1">Monnaie</p>
          <p className="text-2xl font-bold text-[#0D2840]">{country.currency || "—"}</p>
        </div>
      </div>

      {country.economyDesc && (
        <div className="bg-white border border-[#D0E4F0] rounded-xl p-5 mb-6">
          <p className="text-[#1B4F72] text-sm font-semibold mb-2 flex items-center gap-2"><BarChart3 size={15} />Description économique</p>
          <p className="text-[#0D2840] text-sm">{country.economyDesc}</p>
        </div>
      )}

      {/* Info box */}
      <div className="bg-[#EBF3FB] border border-[#A3C4DC] rounded-xl p-5 flex gap-3">
        <Info size={18} className="text-[#1B4F72] shrink-0 mt-0.5" />
        <div>
          <p className="text-[#1B4F72] font-semibold text-sm mb-1">Séries temporelles économiques</p>
          <p className="text-[#5B8FB9] text-sm mb-3">
            Les données économiques annuelles détaillées (PIB, PIB/habitant, taux de croissance, inflation, taux de change, part des hydrocarbures dans le PIB et dans les exportations) seront disponibles dans une prochaine mise à jour de la base de données.
          </p>
          <p className="text-[#5B8FB9] text-sm mb-3">
            En attendant, vous pouvez modifier le PIB global, la description économique et les données générales du pays via le profil pays.
          </p>
          <Link
            href={`/admin/countries/${id}/profile`}
            className="inline-flex items-center gap-2 bg-[#1B4F72] hover:bg-[#154060] text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <BarChart3 size={15} />
            Gérer via le profil pays
          </Link>
        </div>
      </div>
    </div>
  )
}
