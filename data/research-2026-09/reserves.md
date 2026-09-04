# APPO member countries – proved reserves 2021–2025 (research summary)

Companion to `reserves.json` (90 records = 18 countries × 5 years). Units: oil in Gbbl (billion barrels), gas in Tcf, condensate in Gbbl. Reference year = year of the DATA (year-end), never the publication year.

## Sources consulted

Priority 1 – OPEC Annual Statistical Bulletin (official PDFs downloaded from opec.org and text-extracted; Table 3.1 "World proven crude oil reserves by country" (million barrels, p.22) and Table 9.1 "World proven natural gas reserves by country" (billion standard m³, p.76)):
- ASB 2022 → year-2021 data: https://www.opec.org/assets/assetdb/asb-2022.pdf
- ASB 2023 → year-2022 data: https://www.opec.org/assets/assetdb/asb-2023.pdf
- ASB 2024 → year-2023 data: https://www.opec.org/assets/assetdb/asb-2024.pdf
- ASB 2025 → year-2024 data: https://www.opec.org/assets/assetdb/asb-2025.pdf
- ASB 2026 (year-2025 data): NOT retrievable. `asb-2026.pdf` returns HTTP 403/Cloudflare while asb-2021…2025 download normally, and opec.org HTML pages are bot-blocked, so its existence could not be confirmed. Year-2025 therefore null for all countries except Nigeria.

Priority 2 – Energy Institute Statistical Review of World Energy:
- EI has not updated oil/gas reserves since the 2023 edition (data end-2021); the 2024/2025/2026 editions carry no newer reserves. OWID's re-publication of the EI series (metadata: timespan 1980–2021, last updated 2026-06-30, source "Energy Institute – Statistical Review of World Energy") was used because energyinst.org downloads (`EI-Stats-Review-ALL-data.xlsx`) are Cloudflare-gated (403):
  - https://ourworldindata.org/grapher/oil-proved-reserves (oil, m³) and https://ourworldindata.org/grapher/natural-gas-proved-reserves (gas, m³)
  - Used as the primary value only for 2021 for countries OPEC lumps into "Others" (BEN, TCD, COD, CIV, GHA, NAM, NER, SEN, ZAF, and Cameroon oil); otherwise noted as a cross-check.

Priority 3 – US EIA:
- EIA open data (API v2, `INTL.zip` bulk file dated 2026-08-24) no longer contains crude-oil or natural-gas reserves series (only coal reserves; the OGJ-based series were withdrawn), and the interactive browser is JS-only. Only Country Analysis Briefs were usable:
  - Angola CAB (26 Feb 2025): 2.6 bn bbl / 4.6 Tcf at beginning 2025 (OGJ) – https://www.eia.gov/international/content/analysis/countries_long/Angola/index.htm
  - Libya CAB (3 Dec 2024): 48 bn bbl / 53 Tcf at beginning 2024 (OGJ) – https://www.eia.gov/international/content/analysis/countries_long/libya/
  - Nigeria CAB (18 Nov 2025): "37.5 bn bbl and 211.1 Tcf in 2024, per OPEC ASB 2025" – https://www.eia.gov/international/content/analysis/countries_long/Nigeria/Nigeria-2025.pdf
  - Algeria (5 Jun 2025) and Egypt (13 Aug 2024) CABs contain no reserves figures.

Priority 4 – national regulators/NOCs:
- Nigeria NUPRC annual "National Petroleum Reserves Position as at 1st January" declarations (NUPRC PDFs/site pages return 404/403; figures taken from press reports quoting the NUPRC release verbatim):
  - 1 Jan 2022 (= end-2021): 37.046 bn bbl oil+condensate; 208.62 Tcf (May 2022 declaration; cited as comparator in Leadership 22 Apr 2023 and Nairametrics 16 Apr 2024) – medium confidence.
  - 1 Jan 2023 (= end-2022): crude 31.060 + condensate 5.906 = 36.966 bn bbl; AG 102.32 + NAG 106.51 = 208.83 Tcf – https://leadership.ng/nigerias-gas-pool-rises-by-0-10-nuprc/
  - 1 Jan 2024 (= end-2023): 37.50 bn bbl; AG 102.59 + NAG 106.67 = 209.26 Tcf – https://nairametrics.com/2024/04/16/nigeria-oil-reserves-rise-to-37-50-billion-barrels-in-january-nuprc/
  - 1 Jan 2025 (= end-2024): 2P crude 31.44 + condensate 5.84 = 37.28 bn bbl; AG 101.03 + NAG 109.51 = 210.54 Tcf – https://www.icirnigeria.org/nuprc-puts-nigeria-oil-reserves-at-37-billion-barrels/
  - 1 Jan 2026 (= end-2025): crude 31.09 + condensate 5.92 = 37.01 bn bbl; AG 100.21 + NAG 114.98 = 215.19 Tcf – https://nairametrics.com/2026/04/02/nuprc-declares-37-billion-barrels-oil-215tcf-gas-reserves-as-of-january-2026/ and https://www.premiumtimesng.com/business/business-news/868682-nigerias-oil-gas-reserves-hit-37bn-barrels-215-tcf-nuprc.html
- Ghana Petroleum Commission (petrocom.gov.gh), Energy Commission 2025 Energy Outlook (PDF read): production only, no national proved-reserves total. SNH Cameroon, PASA South Africa, Petrosen, NAMCOR, Petroci, SHT, SONIDEP: no annual proved-reserves series located (sites fetched where reachable; several 403/404).

Priority 5 – secondary confirmation:
- OAPEC Annual Statistical Report 2024, Tables 1 & 4 (2019–2023): https://oapecorg.org/media/2b5842d2-7148-49cb-81ad-54f2b11d6bdb/-465237118/Annual%20Statistical%20Report/2025/Statistical%20Report%202024%20final%20E.pdf

Search-engine note: the WebSearch budget was exhausted mid-task; Bing/DuckDuckGo HTML fallbacks returned anti-bot noise, so the last phase relied on direct fetches of known institutional URLs.

## Coverage matrix (✓ = value present in reserves.json; o/g = oil/gas only)

| ISO | 2021 | 2022 | 2023 | 2024 | 2025 | Basis |
|---|---|---|---|---|---|---|
| DZA | ✓ | ✓ | ✓ | ✓ | – | OPEC |
| AGO | ✓ | ✓ | ✓ | ✓ | – | OPEC |
| BEN | ✓ | – | – | – | – | EI end-2021 only |
| CMR | ✓ (oil EI, gas OPEC) | g | g | g | – | OPEC gas only |
| TCD | o | – | – | – | – | EI end-2021 only (no gas) |
| COD | ✓ | – | – | – | – | EI end-2021 only |
| COG | ✓ | ✓ | ✓ | ✓ | – | OPEC |
| CIV | ✓ | – | – | – | – | EI end-2021 only |
| EGY | ✓ | ✓ | ✓ | ✓ | – | OPEC |
| GNQ | ✓ | ✓ | ✓ | ✓ | – | OPEC |
| GAB | ✓ | ✓ | ✓ | ✓ | – | OPEC |
| GHA | ✓ | – | – | – | – | EI end-2021 only |
| LBY | ✓ | ✓ | ✓ | ✓ | – | OPEC |
| NAM | g | – | – | – | – | EI end-2021 (gas 2.2 Tcf, no oil) |
| NER | o | – | – | – | – | EI end-2021 only (no gas) |
| NGA | ✓ | ✓ | ✓ | ✓ | ✓ | OPEC 2021–24; NUPRC 2025 |
| SEN | – | – | – | – | – | EI reports none (pre-production) |
| ZAF | o | – | – | – | – | EI end-2021 only (no gas) |

Counts of non-null values: 2021 oil 16 / gas 14; 2022 oil 8 / gas 9; 2023 oil 8 / gas 9; 2024 oil 8 / gas 9; 2025 oil 1 / gas 1 (Nigeria). Condensate: Nigeria only (2022: 5.906, 2024: 5.84, 2025: 5.92 Gbbl) – see caveat 3.

## Unit conversions applied
- Oil: OPEC million barrels ÷ 1000 → Gbbl. EI/OWID cubic metres ÷ 0.158987 ÷ 1e9 → Gbbl.
- Gas: OPEC billion standard m³ × 0.0353147 → Tcf (rounded to 2 dp). EI/OWID m³ × 35.3147 ÷ 1e12 → Tcf. NUPRC already in Tcf.

## Caveats
1. Vintage: each year's value is taken from the ASB edition that first published it (ASB N+1 → year N). Where ASB 2025 later revised a year, the revision is recorded in `notes` (Angola gas 2023: 55 → 129 bcm; Cameroon gas 2021/22/23: 179/176/173 → 176/173/170; Equatorial Guinea gas 2023: 39 → 40; Gabon gas 2023: 26 → 27; Nigeria gas 2023: 5,943 → 5,914 bcm).
2. OPEC reserve figures for most African members are static official declarations (Algeria 12,200 mb / 4,504 bcm, Libya 48,363 mb, Congo 1,811 mb, Gabon 2,000 mb, Eq. Guinea 1,100 mb, Egypt 3,300 mb unchanged 2021–2024). Notable moves: Angola oil cut from 7,231 to 2,516 mb in 2021; Angola gas 301 → 129 bcm in 2022; Libya gas 1,505 → 730 bcm in 2024 (ASB 2025).
3. Nigeria: OPEC's oil figure equals NUPRC's oil+condensate total (NUPRC labels it 2P). `condensat` values are NUPRC's separately published condensate component and are ALREADY INCLUDED in `oil` – never add the two. Year-2025 Nigeria comes from NUPRC (1 Jan 2026), medium confidence (press reports of the official release; NUPRC PDFs not retrievable).
4. EIA Nigeria CAB (Nov 2025) quotes "37.5 bn bbl in 2024 per OPEC ASB 2025"; the ASB 2025 PDF Table 3.1 shows 37,280 mb for 2024 (37,500 is the 2023 column). PDF value kept.
5. Cameroon oil, and all of BEN/TCD/COD/CIV/GHA/NAM/NER/SEN/ZAF for 2022–2025, are null: OPEC groups them under "Others" (5,759 mb / ~309–313 bcm for the whole group), EI stopped updating reserves after end-2021, and EIA no longer distributes OGJ reserves. Figures circulating for these countries (Ghana 660 Mbbl, Chad 1.5 Gbbl, CIV 100 Mbbl, ZAF 15 Mbbl, Niger 150 Mbbl, DRC 180 Mbbl, Benin 8 Mbbl) are the same OGJ-lineage values EI carried through 2021 – they were not re-used for later years to avoid fabricating a series.
6. EI end-2021 values for "Others" countries are carried-forward estimates (identical 2019–2021) — medium confidence; sourced via OWID's verbatim re-publication because the EI workbook could not be downloaded.
7. Nothing was interpolated; every null is explicit in `notes`.

## Disagreements between sources (higher-priority kept)
- Egypt oil: OPEC 3.3 Gbbl (2021–2024) vs OAPEC 3.0 (2021) / 2.9 (2022, 2023).
- Angola 2021: OPEC 2.516 Gbbl / 10.63 Tcf vs EI end-2021 7.783 Gbbl / 12.11 Tcf.
- Congo 2021 oil: OPEC 1.811 vs EI 2.882 Gbbl.
- Nigeria 2021: OPEC 37.05 Gbbl / 206.52 Tcf vs EI 36.89 / 203.44 vs NUPRC 37.046 / 208.62. Nigeria 2023 gas: OPEC (ASB 2024) 209.88 Tcf vs ASB 2025 revision 208.85 vs NUPRC 209.26. Nigeria 2024 gas: OPEC 211.15 vs NUPRC 210.54.
- Egypt 2021 gas: OPEC 78.01 Tcf vs EI 63.0 Tcf. Equatorial Guinea 2021 gas: OPEC 1.38 vs EI 4.91 Tcf. Cameroon 2021 gas: OPEC 6.32 vs EI 4.77 Tcf.
- Libya 2024 gas: OPEC ASB 2025 25.78 Tcf (730 bcm) vs EIA CAB/OGJ 53 Tcf at beginning 2024 (which matches OPEC's 2023 value).
- Angola 2024: OPEC 2.55 Gbbl / 4.56 Tcf vs EIA CAB (OGJ) 2.6 / 4.6 – consistent within rounding.
