# AIEM — Hydrocarbon trade (exports & imports), APPO members, 2021–2025

Files: `trade_exports.json`, `trade_imports.json` (one record per country × year × flow). Data vintage = reference year of the data.
2025 records are included only where a full-year institutional series exists (JODI 12 months and/or UN Comtrade annual reporter data).

## 1. Sources actually used (institutional only)

| # | Source | What was taken | URL |
|---|--------|----------------|-----|
| 1 | **UN Comtrade** public preview API (HS, annual) | Reporter data AND mirror (partner-reported) data for HS 2709 (crude), 271111 (LNG), 271121 (gaseous-state gas), 271112/271113 (LPG), 271012 (light oils = gasoline + naphtha), 271019 (other oils = gasoil/jet/fuel oil/lubes); net weight (kg) or m³ | https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=…&period=…&cmdCode=…&flowCode=X\|M (also `reporterCode=all&partnerCode=<member>` for mirror) |
| 2 | **JODI-Oil** World Database, primary & secondary bulk CSV (Aug-2026 release) | Monthly crude exports/imports (TOTEXPSB/TOTIMPSB, kb/d) and product exports/imports (GASOLINE, GASDIES, JETKERO, LPG; kt and kb/d) → annual totals/averages, 12-month coverage only | https://www.jodidata.org/oil/database/data-downloads.aspx (files world_primary_csv.zip, world_secondary_csv.zip) |
| 3 | **OPEC Annual Statistical Bulletin 2025** (60th ed., 2 Jul 2025) | T5.1 crude exports by destination (DZA, COG, GNQ, GAB, LBY, NGA; includes an "Africa" line), T5.2 crude exports (AGO, EGY), T5.6 crude imports (DZA, EGY, NGA, ZAF), T5.3/T5.7/T5.9 product exports/imports, T9.3/T9.4 natural-gas exports/imports (mcm) | https://www.opec.org/assets/assetdb/asb-2025.pdf (pp. 46-58, 78-79) |
| 4 | **GIIGNL Annual Reports** 2022, 2023, 2024, 2025 editions | LNG import matrices "Quantities (in MT) received in 2021/2022/2023/2024" — columns Algeria, Angola, Cameroon, Egypt, Equatorial Guinea, Nigeria, (Rep. of the Congo 2024) by importing country; Egypt importer row | 2022 ed.: https://cdn.prod.website-files.com/67bdb9fc993751711c5f54fd/67d40f9112efb57309cae007_GIIGNL-2022-Annual-Report.pdf · 2023 ed.: …/67d40f91fd8b5ad05589ef9e_GIIGNL-2023-Annual-Report.pdf · 2024 ed.: …/6854051dda46281e5ec60285_GIIGNL%20Annual%20Report%202024.pdf · 2025 ed.: …/685278fda1e68e3b4324e2cf_0432365c1c5b8fb129ae8055cca8cb9b_%23GIIGNL%20-%20Livre%202025-20250610-Simple.pdf |

Sources tried but not usable in this run: Energy Institute Statistical Review 2025 workbook/PDF (energyinst.org returns HTTP 403 to non-browser clients); OPEC ASB 2026 (61st ed., 2025 data — opec.org/asb.opec.org behind Cloudflare 403/402); JODI-Gas bulk file (only a 2018 beta CSV is published); GIIGNL 2026 edition tables (members only). No blogs or press were used.

## 2. Field construction

| Field | Rule |
|---|---|
| `oilIntraKbD` / `oilExtraKbD` | OPEC members (DZA, COG, GNQ, GAB, LBY, NGA), exports: OPEC T5.1 total and its "Africa" destination line (intra), extra = total − Africa. AGO/EGY exports: OPEC T5.2 total; DZA/EGY/NGA/ZAF imports: OPEC T5.6 total. Otherwise JODI 12-month average, otherwise UN Comtrade (reporter, else mirror). When a headline total comes from OPEC/JODI but the split comes from Comtrade, intra = African partners in Comtrade (kb/d), extra = total − intra. When no partner detail exists at all, total is placed in `extra` and `intra` is null (stated in notes). |
| `gasIntraBcm` / `gasExtraBcm` | LNG exports of DZA, AGO, CMR, EGY, GNQ, NGA, COG: GIIGNL matrix by importing country (Mt × 1.36). Pipeline / gaseous-state gas: UN Comtrade HS 271121 (m³ if reported, else t × 1.36 bcm/Mt). Other LNG flows (importers, non-GIIGNL exporters): Comtrade HS 271111. Intra = African counterparties. OPEC T9.3/T9.4 totals used as headline when no partner data exists and quoted as cross-checks otherwise. South Africa's gas imports (OPEC T9.4) are Mozambican pipeline gas → intra. |
| `essenceM3`, `gasoilM3`, `gplTM`, `jetFuelTM` | JODI secondary 12-month totals (kt, or kb/d when kt is 0) where JODI covers the country (AGO, DZA, EGY, GAB partial, GNQ, NGA, ZAF); otherwise UN Comtrade HS6 net weight: essence = HS 271012, gasoil = HS 271019, LPG = 271112 + 271113. **Jet fuel is only available from JODI (JETKERO)**; HS6 cannot isolate it from 271019, so it is null for non-JODI countries. |
| `partners` | Top 3–6 per flow: crude (kb/d), lng / gas (bcm), gasoline & gasoil (m³), LPG (t). Country-level partners from Comtrade or GIIGNL; when only OPEC regional destinations exist, the partners are OPEC regions (flagged in notes). |

## 3. Conversions (all shown in record notes)

* Crude: t × 7.33 bbl/t; kb/d = bbl/yr ÷ 365 ÷ 1000.
* Gasoline: t × 8.35 bbl/t × 0.158987 m³/bbl = 1.3275 m³/t. Gasoil: t × 7.46 × 0.158987 = 1.1860 m³/t. JODI kb/d → m³/yr = kb/d × 1000 × 365 × 0.158987.
* Jet/kerosene in t (JODI kt × 1000; if only kb/d: ÷ 7.88 bbl/t). LPG in t (if only kb/d: ÷ 11.6 bbl/t).
* LNG: 1 Mt = 1.36 bcm (EI convention). Gaseous gas reported by weight: same 1.36 bcm/Mt (flagged); m³ used directly when reported.
* OPEC gas tables: million standard m³ ÷ 1000 = bcm.

## 4. Caveats

* **Mirror data.** For non-reporting or weight-less reporters (NGA crude has value but no weight; LBY, COG, GNQ, GAB, TCD, COD, NER do not report or report sparsely) partner-reported figures are used and flagged "MIRROR DATA" in notes. Mirror imports are CIF, dated on arrival, and include cargoes transhipped or blended en route (e.g. Nigerian crude landed in the Netherlands and re-exported), which overstates European and understates final Asian destinations.
* **Re-exports / hubs.** Comtrade partner lists for products are shaped by hub trading (Netherlands, Belgium, Malta, UAE, Singapore, Togo (Lomé STS), South Africa) rather than origin of refining. Intra-Africa product flows through Lomé/Durban/Walvis Bay can appear as African partners.
* **Intra/extra split method.** "Africa" per the ISO-3166 African country list (incl. Western Sahara, Réunion, Mayotte). Areas n.e.s., bunkers and free zones are treated as extra-Africa. OPEC T5.1's "Africa" line for Nigeria 2024 (379 kb/d) is far above Comtrade African partners; it likely includes crude supplied to Nigerian refiners (Dangote) recorded as exports and oil in transit — flagged in the record.
* **HS6 product granularity.** HS 271012 includes naphtha and other light oils, not only motor gasoline; HS 271019 includes gasoil, jet/kerosene, fuel oil and lubricants. Fields built from Comtrade therefore over-state "essence" and "gasoil" relative to JODI product definitions; the notes name the HS code used. South Africa's HS 271012 line is implausibly large (reporter classification), so ZAF products come from JODI.
* **Comtrade public preview limits.** 500 rows per call; capped combinations (BEN, CMR, CIV-2025, GHA, NAM, ZAF) were re-pulled per HS code. Records also filter to `partner2 = World`, `mode of transport = total`, `customs = total` to avoid double counting.
* **JODI.** Only 12-month-complete country-years are used; JODI assessment codes 2–3 ("mostly/complete") apply. JODI TOTCRUDE sometimes carries kb/d but zero kt — kb/d used directly.
* **GIIGNL.** Matrices are on a received basis (importer side) and net of re-exports; 2025 edition rounds to 0.1 Mt so column sums can differ ±0.5 Mt from the published total (difference added to extra-Africa). Egypt's importer row supplies Egyptian LNG-import origins (2024: US 2.0, Nigeria 0.2, Angola 0.1 Mt).
* **Congo 2024 imports.** Comtrade mirror data (Algeria's reported exports) show 38.9 kb/d of crude and 1.67 Mm³ of light oils shipped to the Republic of Congo in 2024; OPEC T5.1 gives Algeria only 3 kb/d of crude to all of Africa that year. The line is kept as reported but flagged (medium confidence).
* **JODI vs OPEC crude definitions.** Where JODI is the crude headline (2025 rows, South Africa), note JODI's crude series includes condensate for some countries (Algeria 2023: JODI 685 vs OPEC 483 kb/d). OPEC ASB is used for 2021-2024 wherever available.
* **OPEC gas totals vs partner data.** OPEC T9.3 Nigeria gas exports (29-38 bcm) exceed GIIGNL LNG (17.7-22 bcm) plus WAGP pipeline volumes; the OPEC figure is used as headline (rank 4 source) and the GIIGNL-based figure is stated in each record's notes.
* **Comtrade unit/reporting errors** were removed by rule and named in notes: a partner-reported crude quantity larger than 50% of the headline total when the partner sum exceeds the total by >25% (e.g. Libya 2023 "Thailand 817 kb/d"); Comtrade gas totals >1.5x the OPEC total (e.g. South Africa 2021: 107 bcm) replaced by the OPEC total split by partner share.
* **QA flags.** A post-pass marks any field >3x the median of the same country's other years (29 of 158 records); confidence is capped at medium for those. Full list below.
* **Not interpolated.** Any field with no institutional figure is null and explained in the record's notes.

## 5. Coverage matrix

(filled by `build_trade.py`: fields populated out of 8, confidence h/m/l — exports · imports)


Records: 79 export + 79 import. Confidence: {'medium': 140, 'high': 13, 'low': 5}. Records containing mirror data: 84.
Years: 2021-2024 for all 18 countries (144 records); 2025 for DZA, AGO, CIV, EGY, GHA, NGA, ZAF (14 records) where full-year JODI or Comtrade annual reporter data exist.

| ISO | 2021 X / M | 2022 X / M | 2023 X / M | 2024 X / M | 2025 X / M |
|---|---|---|---|---|---|
| DZA | 8/8 m · 7/8 m | 8/8 m · 6/8 m | 8/8 m · 8/8 m | 7/8 m · 6/8 m | 6/8 m · 7/8 m |
| AGO | 8/8 h · 8/8 m | 8/8 m · 8/8 m | 7/8 m · 7/8 m | 7/8 m · 7/8 m | 5/8 m · 7/8 m |
| BEN | 3/8 m · 5/8 m | 2/8 l · 7/8 m | 5/8 m · 7/8 m | 2/8 l · 5/8 m | -/8  · -/8  |
| CMR | 7/8 h · 7/8 m | 7/8 m · 5/8 m | 7/8 h · 7/8 m | 6/8 m · 5/8 m | -/8  · -/8  |
| TCD | 4/8 m · 3/8 m | 3/8 m · 2/8 l | 4/8 m · 3/8 m | 4/8 m · 2/8 l | -/8  · -/8  |
| COD | 4/8 m · 7/8 m | 5/8 m · 7/8 m | 7/8 m · 7/8 m | 4/8 m · 7/8 m | -/8  · -/8  |
| COG | 6/8 m · 7/8 m | 6/8 m · 5/8 m | 7/8 m · 7/8 m | 7/8 m · 5/8 m | -/8  · -/8  |
| CIV | 7/8 m · 7/8 m | 7/8 m · 7/8 m | 7/8 m · 7/8 m | 7/8 m · 5/8 m | 7/8 m · 5/8 m |
| EGY | 8/8 m · 7/8 m | 8/8 m · 7/8 m | 8/8 m · 7/8 h | 7/8 m · 7/8 m | 5/8 h · 7/8 m |
| GNQ | 8/8 m · 6/8 m | 8/8 m · 7/8 m | 8/8 m · 8/8 m | 7/8 m · 4/8 m | -/8  · -/8  |
| GAB | 7/8 h · 7/8 m | 7/8 h · 7/8 m | 8/8 m · 8/8 m | 4/8 m · 3/8 m | -/8  · -/8  |
| GHA | 7/8 m · 7/8 m | 5/8 m · 7/8 m | 7/8 m · 7/8 m | 7/8 m · 7/8 m | 5/8 m · 7/8 m |
| LBY | 7/8 m · 5/8 m | 7/8 m · 2/8 l | 7/8 m · 3/8 m | 7/8 m · 3/8 m | -/8  · -/8  |
| NAM | 7/8 m · 7/8 m | 7/8 m · 7/8 m | 7/8 m · 7/8 m | 7/8 m · 7/8 m | -/8  · -/8  |
| NER | 5/8 m · 3/8 m | 5/8 m · 3/8 m | 4/8 m · 5/8 m | 6/8 m · 5/8 m | -/8  · -/8  |
| NGA | 8/8 m · 8/8 m | 8/8 m · 6/8 m | 8/8 m · 8/8 m | 8/8 m · 8/8 m | 6/8 m · 7/8 m |
| SEN | 7/8 m · 5/8 m | 7/8 m · 5/8 m | 7/8 m · 7/8 m | 7/8 m · 7/8 m | -/8  · -/8  |
| ZAF | 8/8 h · 8/8 m | 8/8 h · 8/8 h | 8/8 h · 8/8 h | 8/8 h · 8/8 m | 7/8 m · 7/8 m |


### QA-flagged records

* DZA 2021 X: essenceM3 (9,170,089) is >3x the median of this country's other years (222,628)
* DZA 2022 X: jetFuelTM (178,200) is >3x the median of this country's other years (45,850)
* DZA 2024 X: essenceM3 (7,728,410) is >3x the median of this country's other years (222,628)
* AGO 2022 X: gasoilM3 (495,410) is >3x the median of this country's other years (109,638)
* COG 2021 X: gplTM (29,863) is >3x the median of this country's other years (1,803)
* COG 2022 X: gplTM (23,783) is >3x the median of this country's other years (1,803)
* EGY 2021 X: essenceM3 (5,024,531) is >3x the median of this country's other years (979,608)
* EGY 2021 X: gasoilM3 (3,310,151) is >3x the median of this country's other years (97,858)
* EGY 2021 X: gplTM (238,983) is >3x the median of this country's other years (5,059)
* EGY 2022 X: essenceM3 (4,614,086) is >3x the median of this country's other years (979,608)
* EGY 2022 X: gplTM (30,863) is >3x the median of this country's other years (5,059)
* EGY 2024 X: gasoilM3 (486,278) is >3x the median of this country's other years (97,858)
* NGA 2022 X: gplTM (469,103) is >3x the median of this country's other years (3,204)
* NGA 2023 X: gplTM (506,224) is >3x the median of this country's other years (3,204)
* NGA 2024 X: gasoilM3 (1,659,393) is >3x the median of this country's other years (77,652)
* NGA 2025 X: essenceM3 (1,561,056) is >3x the median of this country's other years (465,822)
* NGA 2025 X: gasoilM3 (2,724,815) is >3x the median of this country's other years (77,652)
* SEN 2024 X: oilExtraKbD (28) is >3x the median of this country's other years (1)
* ZAF 2025 X: essenceM3 (4,547,147) is >3x the median of this country's other years (377,022)
* DZA 2025 M: gasoilM3 (405,034) is >3x the median of this country's other years (91,130)
* AGO 2021 M: gasoilM3 (1,776,218) is >3x the median of this country's other years (61,236)
* AGO 2022 M: gasoilM3 (2,772,138) is >3x the median of this country's other years (61,236)
* COD 2022 M: essenceM3 (981,687) is >3x the median of this country's other years (192,774)
* COD 2022 M: gasoilM3 (1,698,838) is >3x the median of this country's other years (225,324)
* COD 2023 M: essenceM3 (3,864,097) is >3x the median of this country's other years (192,774)
* COD 2023 M: gasoilM3 (5,138,526) is >3x the median of this country's other years (225,324)
* COG 2023 M: gasoilM3 (336,382) is >3x the median of this country's other years (34,121)
* COG 2024 M: essenceM3 (1,672,110) is >3x the median of this country's other years (7,685)
* EGY 2025 M: essenceM3 (12,532,740) is >3x the median of this country's other years (2,849,568)
* GAB 2021 M: gplTM (43,798) is >3x the median of this country's other years (6,650)
* GAB 2023 M: gasoilM3 (391,276) is >3x the median of this country's other years (89,246)
* GAB 2023 M: gplTM (43,200) is >3x the median of this country's other years (6,650)
* GHA 2024 M: gasoilM3 (3,217,981) is >3x the median of this country's other years (135,786)
* GHA 2025 M: gasoilM3 (4,612,199) is >3x the median of this country's other years (135,786)
* GHA 2025 M: oilIntraKbD (17) is >3x the median of this country's other years (1)
* ZAF 2024 M: gplTM (589,467) is >3x the median of this country's other years (23,500)
* ZAF 2025 M: essenceM3 (26,076,379) is >3x the median of this country's other years (1,263,156)
* ZAF 2025 M: gplTM (683,021) is >3x the median of this country's other years (23,500)

