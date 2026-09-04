# APPO member countries – annual oil & gas production 2021–2025

Research date: 2026-09-04. Companion file: `production.json` (90 records, one per country-year).

Units: **oil** = kb/d (thousand barrels per day, annual average, crude only where the source separates crude); **gas** = million m³ per year (marketed production; bcm × 1000); **condensat** = kb/d (never published separately by the institutional sources reached → null everywhere).

## 1. Sources actually used (in priority order)

| # | Source | Vintage / data year | URL | What was taken |
|---|--------|---------------------|-----|----------------|
| 1 | **OPEC Annual Statistical Bulletin 2025** (60th ed., 2 Jul 2025) | data 2020–2024 | https://www.opec.org/assets/assetdb/asb-2025.pdf | Table 3.5 *World crude oil production by country* (p.26, 1,000 b/d) → crude 2021-24 for DZA, AGO, TCD, COG, EGY, GNQ, GAB, GHA, LBY, NGA. Table 9.2 *World marketed production of natural gas by country* (p.77, million std m³) → gas 2021-24 for DZA, AGO, CMR, COG, EGY, GNQ, GAB, LBY, NGA. |
| 1 | **OPEC Monthly Oil Market Report, August 2026** (12 Aug 2026) | full-year 2025 | https://publications.opec.org/momr (PDF mirror: https://egyptoil-gas.com/wp-content/uploads/2026/08/OPEC_MOMR_August_2026.pdf) | Table 5-7 *DoC crude oil production based on secondary sources* (p.56), column "2025" → DZA 935, COG 260, GNQ 53, GAB 227, LBY 1,296, NGA 1,510 tb/d. Table 5-8 *direct communication* logged in notes (DZA 936, COG 271, GNQ 46, LBY 1,372, NGA 1,432). |
| 2 | **Energy Institute Statistical Review of World Energy 2026** (75th ed., Jun/Jul 2026) | data through 2025 | https://www.energyinst.org/statistical-review — the EI xlsx is behind a Cloudflare challenge; the identical dataset was read from Our World in Data's ETL mirror of the EI workbook: https://catalog.ourworldindata.org/meadow/energy_institute/2026-06-30/statistical_review_of_world_energy/statistical_review_of_world_energy.feather (fields `oilprod_crudecond_kbd`, `oilprod_ngl_kbd`, `gasprod_bcm`) | 2025 oil for AGO, TCD, EGY (crude+condensate basis); 2025 gas for DZA, EGY, LBY, NGA; cross-checks for all years. EI 2025 edition (2025-06-27 mirror) used to log revisions. |
| 4 | **SNH Cameroun – Données pétrolières** (xlsx, 2021/2022/2023 full-year; 2024 H1) | 2021–2023 | https://www.snh.cm/chiffres-cles/ → https://snh.cm/wp-content/uploads/2024/10/Statistiques_4e_trim_2021_Fr.xlsx, …/4e_trimestre_2022_TOP_Fcais_ITIE.xlsx, …/Donnees_petrolieres__3e_trimestres_2023_VF.xlsx | Cameroon crude = Part SNH/État + Part associés ("Total annuel", millions de bls). 2024 & 2025 national totals (21.377 / 19.374 M bbl) taken from SNH figures reported by Investir au Cameroun / News du Camer (SNH's 2025 PDF is image-only). |
| 4 | **PIAC Ghana / Petroleum Commission** (2024 Annual Report, 29 Apr 2025) | 2019–2024 | https://www.piacghana.org/ghanas-oil-production-falls-for-fifth-consecutive-year-piac-report/ ; https://gna.org.gh/2025/04/ghanas-2024-oil-production-slightly-lower-than-2023/ | Ghana annual barrels (cross-check of ASB; identical within rounding). |
| 4 | **ITIE-RDC Rapport final 2023** (31 Dec 2025; data = Banque Centrale du Congo) | 2019–2023 | https://www.itierdc.net/rapports-itie-rdc/2023/Rapport%20final%20ITIE%20RDC%202023%20-%2031-12-2025.pdf (§3.2.2, p.102) | DRC crude 2021–2023 (thousand bbl). |
| 4 | **Gouvernement de Côte d'Ivoire – Conseil des ministres 1 Oct 2025** (via AIP, official agency) | 2024 | https://www.aip.ci/257253/aip-la-production-petroliere-en-hausse-de-50-du-1er-janvier-au-31-decembre-2024-gouvernement/ | CIV 2024: 16.1 M bbl = 44 kb/d; gas 2.4 bcm. |
| 4 | **Sénégal – Ministère de l'Énergie, du Pétrole et des Mines** (production reports, via Le Soleil / Reuters-CNBC Africa / MarketScreener) | 2024, 2025 | https://lesoleil.sn/actualites/economie/projet-petrolier-sangomar-169-millions-de-barils-produits-en-2024-au-dela-de-lobjectif-initial/ ; https://www.cnbcafrica.com/2026/senegals-sangomar-oil-project-has-produced-about-18-million-barrels-so-far-this-year-document-says | Sangomar 16.9 M bbl (2024), 36.2 M bbl (2025). |
| 3 | **US EIA Country Analysis Brief – South Africa** (29 Oct 2024) | 2023 | https://eia.gov/international/content/analysis/countries_long/South_Africa | Confirms crude+condensate <1% of ~108 kb/d liquids (rest CTL/GTL) → null. |
| – | NUPRC (Nigeria) figures as relayed by Nairametrics / Oilfield Technology | 2024, 2025 | https://nairametrics.com/2025/01/14/nigeria-produced-566-million-barrels-of-crude-oil-in-2024-nuprc-data/ ; https://www.oilfieldtechnology.com/drilling-and-production/30012026/… | Logged only (NUPRC PDFs/site blocked → condensate split unverifiable). |

Sources tried and **not reachable** (HTTP 402/403/404, JS-only or image-only): OPEC ASB 2026 (61st ed., 29 Apr 2026, 2025 data) PDF and asb.opec.org interactive; EI xlsx direct download; NUPRC annual report PDF and production-status pages; PIAC 2025 report; Petroleum Commission Ghana 2025 xlsx; Ministère MMPE Côte d'Ivoire statistics (flipbook); SNH 2025 PDF (scanned); IMF Niger country reports; INS Niger; ITIE-RDC open-data portal; ANPG/Angola annual; energie.gouv.sn (PHP error). Web search quota was exhausted before Ghana-2025 / Niger / CIV-2025 could be resolved.

## 2. Coverage matrix (oil kb/d | gas million m³)

| ISO3 | 2021 | 2022 | 2023 | 2024 | 2025 |
|------|------|------|------|------|------|
| DZA | 911 \| 105,043 | 1,020 \| 100,513 | 973 \| 104,275 | 907 \| 103,966 | 935 (MOMR) \| 98,021 (EI) |
| AGO | 1,124 \| 8,820 | 1,137 \| 5,390 | 1,098 \| 5,860 | 1,125 \| 5,750 | 1,040 (EI, crude+cond) \| – |
| BEN | 0 \| 0 | 0 \| 0 | 0 \| 0 | 0 \| 0 | 0 \| 0 (Sèmè restart slipped to 2026) |
| CMR | 70.2 (SNH) \| 2,330 | 68.4 \| 2,400 | 65.6 \| 2,500 | 58.4 \| 2,185 | 53.1 \| – |
| TCD | 104 \| – | 104 \| – | 108 \| – | 111 \| – | 111 (EI) \| – |
| COD | 23.3 (ITIE/BCC) \| – | 23.3 \| – | 23.1 \| – | – \| – | – \| – |
| COG | 267 \| 415 | 262 \| 423 | 271 \| 425 | 260 \| 425 | 260 (MOMR) \| – |
| CIV | – \| – | – \| – | – \| – | 44.0 \| 2,400 | – \| – |
| EGY | 445 \| 70,400 | 449 \| 67,000 | 453 \| 59,300 | 450 \| 49,350 | 499 (EI, crude+cond, **not comparable**) \| 40,757 (EI) |
| GNQ | 93 \| 7,047 | 81 \| 8,105 | 55 \| 7,103 | 57 \| 6,914 | 53 (MOMR) \| – |
| GAB | 181 \| 454 | 191 \| 463 | 223 \| 463 | 224 \| 477 | 227 (MOMR) \| – |
| GHA | 151 \| – | 142 \| – | 132 \| – | 132 \| – | – \| – |
| LBY | 1,207 \| 13,010 | 983 \| 12,570 | 1,189 \| 11,750 | 1,136 \| 16,411 | 1,296 (MOMR) \| 11,726 (EI) |
| NAM | 0 \| 0 | 0 \| 0 | 0 \| 0 | 0 \| 0 | 0 \| 0 |
| NER | – | – | – | – | – |
| NGA | 1,323 \| 48,572 | 1,138 \| 44,307 | 1,187 \| 42,403 | 1,345 \| 44,322 | 1,510 (MOMR) \| 50,774 (EI) |
| SEN | 0 \| 0 | 0 \| 0 | 0 \| 0 | 46.2 \| 0 | 99.2 \| – |
| ZAF | – | – | – | – | – |

Counts: oil filled 15/18 for 2021-24 and 13/18 for 2025; gas filled 12-13/18 for 2021-24 and 6/18 for 2025. Zeros are documented non-producers (BEN, NAM, SEN pre-June-2024), not measurements. Condensate: null in all 90 records.

All 2025 values are **full-year** figures from institutional publications (MOMR Aug-2026, EI 2026, ministries); none are year-to-date, so `provisional` = false everywhere — but confidence is "medium/low" because OPEC ASB 2026 (the normal priority-1 source for 2025) could not be retrieved.

## 3. Unit conversions applied

- Gas bcm → million m³: × 1000 (EI 2026: DZA 98.021 → 98,021; EGY 40.757 → 40,757; LBY 11.726 → 11,726; NGA 50.774 → 50,774). OPEC ASB values are already in million standard m³.
- SNH Cameroun gas (gross, "milliards de SCF") → million m³: × 28.3168 (2021: 73.82 bcf → 2,090; 2022: 77.51 → 2,195; 2023: 81.04 → 2,295). Logged in notes only; OPEC marketed figures kept.
- Annual barrels → kb/d: M bbl × 1000 / days (365; 366 for 2024). CMR 25.609/24.950/23.939/21.377/19.374 M bbl → 70.2/68.4/65.6/58.4/53.1; COD 8,499/8,499/8,430 kbbl → 23.3/23.3/23.1; SEN 16.9 M bbl/366 → 46.2 (2024), 36.2/365 → 99.2 (2025); CIV 16.1 M bbl → 44.0 (as stated by government); GHA cross-check 55.05/51.76/48.25/48.24 M bbl → 150.8/141.8/132.2/131.8 (matches ASB 151/142/132/132).
- Côte d'Ivoire gas 2.4 bcm → 2,400 million m³ (government does not state gross vs marketed).

## 4. Crude vs total-liquids caveats

- **OPEC ASB Table 3.5 and MOMR are crude only** (Nigeria series excludes blended condensate since 2020). These are the values in `oil` for 2021-24 (and 2025 for the six OPEC members).
- **EI "oil production – crude, condensate"** includes lease condensate. It is used for `oil` only where no OPEC figure exists for 2025: AGO (EI 2024 = 1,130 vs ASB 1,125 → small gap), TCD (no condensate, but EI runs 10-20% above ASB in all years: 116/124/134/128 vs 104/104/108/111), **EGY (EI 2024 = 537 vs ASB 450 → 2025 = 499 is on a different basis and should not be read as growth)**. Flagged `low` confidence for EGY 2025.
- Large EI–ASB gaps that indicate significant condensate streams: Algeria (EI 1,205 vs ASB 907 in 2024), Nigeria (1,557 vs 1,345), Egypt (537 vs 450), Equatorial Guinea (79 vs 57). None of the sources reached publishes condensate as a separate annual series (NUPRC does, but its PDFs were inaccessible; press-relayed 2024 split of ~1.4 mb/d crude / ~0.15 mb/d condensate not verifiable).
- EI NGL lines (DZA ~268 kb/d, NGA 84-117, EGY ~45, GNQ 10-18, COG 7) are excluded from every value.
- 2025 gas for DZA/EGY/LBY/NGA is on the **EI basis**, whereas 2021-24 gas is on the **OPEC basis**. Differences are small for Algeria/Egypt/Nigeria (2-6%) but large for Libya (ASB 2024 = 16,411 vs EI 12,360), so the LBY 2024→2025 gas step is a series break, not a real decline.

## 5. Disagreements logged (higher-priority value kept)

| Country-year | Kept | Other institutional value(s) |
|---|---|---|
| DZA 2024 crude | ASB 907 | MOMR 905; EI crude+cond 1,205 (EI 2025 ed.: 1,109) |
| DZA 2025 crude | MOMR secondary 935 | direct comm. 936; EI 1,249 |
| AGO 2025 oil | EI 1,040 (crude+cond) | Government/ANPG ~1,070 (357.1 M bbl); ANPG Dec-2025 1,028 |
| TCD 2021-24 crude | ASB 104/104/108/111 | EI 116/124/134/128 |
| COG 2024/2025 | ASB 260 / MOMR 260 | MOMR-2024 253; direct comm. 2025 271; EI 2025 271 |
| EGY 2024 crude | ASB 450 | EI 2026 537; EI 2025 ed. 592 |
| EGY 2024 gas | ASB 49,350 | EI 47,519 |
| GNQ 2025 | MOMR 53 | direct comm. 46; EI 64 |
| LBY 2024 gas | ASB 16,411 | EI 12,360 (EI 2025 ed.: 14,259) |
| LBY 2025 crude | MOMR 1,296 | NOC direct comm. 1,372; EI 1,374 |
| NGA 2024 crude | ASB 1,345 | MOMR 1,429; NUPRC crude-only ~1,400 (1,549 incl. condensate); EI 1,557 |
| NGA 2025 crude | MOMR 1,510 | NUPRC direct comm. 1,432; NUPRC report 554.4 M bbl crude+cond (1.63 mb/d as reported); EI 1,643 |
| NGA 2024 gas | ASB 44,322 | EI 46,846 |
| CMR gas 2021-23 | ASB 2,330/2,400/2,500 | SNH gross 2,090/2,195/2,295 |
| SEN 2024 oil | 46.2 (calendar-year avg) | ~79 kb/d averaged over 213 producing days; plateau 100 kb/d |

## 6. Remaining gaps and how to close them

- **GHA 2025**: PIAC 2025 Annual Report (Apr-2026) or Petroleum Commission "2025 Fields Production Data" xlsx at https://petrocom.gov.gh/production-volume/ (JS-rendered; download manually).
- **NER 2021-25**: Ministère du Pétrole / SONIDEP or IMF Niger Article IV tables (imf.org blocked here). Official statements only give rates (20 kb/d SORAZ + 90 kb/d export from Nov-2023; "110 kb/d" 2025-26).
- **COD 2024-25**: ITIE-RDC 2024 report (due end-2026) or BCC Rapport annuel 2024.
- **CIV 2021-23 & 2025**: DGH statistics (energie.gouv.ci flipbook) or Conseil des ministres communiqués; press cites 63,050 b/d for 2025.
- **2025 gas for AGO, CMR, COG, GNQ, GAB** and 2025 crude on OPEC basis for AGO/EGY/TCD/GHA: OPEC ASB 2026 (asb.opec.org / opec.org PDF, blocked by Cloudflare in this session).
- **SEN 2025 gas**: GTA Phase 1 volumes from the Ministry's monthly bulletin (energie.gouv.sn) or Petrosen.
- **ZAF**: DMRE/PetroSA; crude+condensate is <1 kb/d and gas only as a multi-year EIA average.
- **Condensate** for NGA (NUPRC monthly reports separate blended/unblended condensate), DZA (Sonatrach), EGY, GNQ.
