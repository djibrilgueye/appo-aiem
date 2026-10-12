import type { EnergyDataset, Metric, Observation } from "./types"

export const METRICS = {
  oil: { label: "Production de pétrole brut", short: "Production de brut", unit: "kb/j", definition: "Milliers de barils par jour. Moyenne annuelle ; vérifier le périmètre brut / condensats dans la note de source.", divisor: 1 },
  gas: { label: "Production de gaz naturel", short: "Production de gaz", unit: "Gm³/an", definition: "Milliards de mètres cubes par an. Les millions de m³ de la base sont divisés par 1 000. Le périmètre gaz commercialisé / brut dépend de la source.", divisor: 1000 },
  oilReserves: { label: "Réserves de pétrole", short: "Réserves de pétrole", unit: "Gbbl", definition: "Milliards de barils. Réserves déclarées pour l’année sélectionnée ; aucune reconduction d’une année antérieure.", divisor: 1 },
  gasReserves: { label: "Réserves de gaz naturel", short: "Réserves de gaz", unit: "Tcf", definition: "Milliers de milliards de pieds cubes. Réserves déclarées pour l’année sélectionnée.", divisor: 1 },
} as const

export function getObservation(data: EnergyDataset, code: string, year: number, metric: Metric): Observation | undefined {
  const series = metric === "oilReserves" || metric === "gasReserves" ? data.reserves : data.production
  return series.find(row => row.country === code && row.year === year)
}

export function metricValue(row: Observation | undefined, metric: Metric): number | null {
  if (metricIssue(row, metric)) return null
  const value = metric === "gas" || metric === "gasReserves" ? row?.gas : row?.oil
  return value == null ? null : value / METRICS[metric].divisor
}

export function metricIssue(row: Observation | undefined, metric: Metric): string | undefined {
  return metric === "gas" || metric === "gasReserves" ? row?.issues?.gas : row?.issues?.oil
}

export function availableYears(data: EnergyDataset): number[] {
  return [...new Set([...data.production, ...data.reserves].map(row => row.year))].sort((a, b) => a - b)
}

export function formatNumber(value: number | null, maximumFractionDigits = 1): string {
  return value == null ? "N.D." : new Intl.NumberFormat("fr-FR", { maximumFractionDigits }).format(value)
}

export function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
