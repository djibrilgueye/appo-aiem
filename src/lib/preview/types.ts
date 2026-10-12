export type DatasetKey = "production" | "research" | "local"
export type Metric = "oil" | "gas" | "oilReserves" | "gasReserves"
export type AssetKind = "refineries" | "pipelines" | "basins" | "storage" | "training" | "rnd" | "petrochem"

export interface DataSource {
  name: string
  url: string
  detail: string
  published: string
}

export interface EnergyCountry {
  code: string
  name: string
  region: string
  lat: number
  lon: number
}

export interface Observation {
  country: string
  year: number
  oil: number | null
  gas: number | null
  source: DataSource | null
  confidence: string
  provisional: boolean
  notes: string
  issues?: { oil?: string; gas?: string }
}

export interface EnergyAsset {
  id: string
  name: string
  kind: AssetKind
  countries: string[]
  lat: number | null
  lon: number | null
  coords: [number, number][]
  status: string
  capacity: number | null
  source: DataSource | null
  notes: string
}

export interface EnergyDataset {
  countries: EnergyCountry[]
  production: Observation[]
  reserves: Observation[]
  assets: EnergyAsset[]
  excluded: number
}

export interface PreviewData {
  production?: EnergyDataset
  productionSnapshot?: { capturedAt: string; origin: string; sha256: string }
  research: EnergyDataset
  local: EnergyDataset
  snapshot: string
}
