import type { Metric } from "./types"

export type ReviewSeries = "production" | "reserves"
export type ReviewIssues = { oil?: string; gas?: string }

/**
 * Findings about the September 2026 research archive, not the local database.
 * A finding excludes that metric from comparable values; the original value
 * and this explanation remain available in the observation details.
 */
export function getReviewIssues(country: string, year: number, series: ReviewSeries): ReviewIssues {
  if (series === "production") {
    if (country === "SEN" && year >= 2021 && year <= 2024) {
      return {
        gas: "À réviser : le zéro du dossier omet la production de gaz de Gadiaga, antérieure au démarrage de GTA. L’ITIE rapporte notamment 2 777 767,50 Nm³ pour 2024. Source : https://www.itie.sn/wp-content/uploads/2026/01/COMPRENDRE-POUR-AGIR-2024.pdf ; historique PETROSEN : https://www.petrosen.sn/historique-de-lexploitation-petroliere-au-senegal/",
      }
    }

    if (country === "AGO" && year === 2025) {
      return {
        oil: "Périmètre différent : la valeur 2025 du dossier provient de la série Energy Institute « brut + condensats ». Elle est exclue du comparatif de pétrole brut seul jusqu’à harmonisation. Source : https://www.energyinst.org/statistical-review ; définition documentée dans la note de l’observation.",
      }
    }
  }

  if (series === "reserves" && country === "NGA" && year === 2025) {
    const source = "Source : https://www.nuprc.gov.ng/media/news/5fa3f1a3c8223aa7c4dc4a39"
    return {
      oil: `Catégorie différente : la NUPRC déclare des réserves 2P au 1er janvier 2026, et non des réserves prouvées 1P seules. Les 37,01 Gbbl incluent les condensats ; ne pas y ajouter le détail condensats. Valeur exclue du comparatif homogène. ${source}`,
      gas: `Catégorie différente : les 215,19 Tcf déclarés par la NUPRC au 1er janvier 2026 sont des réserves 2P, et non des réserves prouvées 1P seules. Valeur exclue du comparatif homogène. ${source}`,
    }
  }

  return {}
}

/**
 * True when the archive explicitly documents a change of source/basis between
 * year - 1 and year. Apply only to the research dataset and year-over-year
 * comparisons. It is not an assertion that the observation itself is false.
 * Evidence: data/research-2026-09/production.json and production.md, sections 4–5.
 */
export function hasSeriesBreak(country: string, year: number, metric: Metric): boolean {
  if (year !== 2025) return false

  // Libya: 2024 OPEC gas 16,411 M m³ vs EI's 2024 baseline of 12,360.
  // Chad: 2024 OPEC oil 111 kb/d vs EI's 2024 baseline of 128.
  return (country === "LBY" && metric === "gas") || (country === "TCD" && metric === "oil")
}
