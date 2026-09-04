# AIEM upstream & midstream inventory — sources, counts, caveats

Status reference: 2024–2025 (with 2026 developments noted where found, since research ran Sept 2026).
Files: `pipelines.json`, `basins.json`, `blocks.json`, `fields.json` (same directory).

## Method

1. Targeted web verification (WebSearch, 32 queries) of every status-sensitive item named in the brief: Niger–Benin, AKK, OB3, WAGP, Trans-Saharan, Nigeria–Morocco, GME, Medgaz/Transmed, Chad–Cameroon, EMG/AGP/SUMED, GTA, Sangomar, Baleine, Agogo, Block 11B/12B, Namibia Venus/Mopane/Graff, Libya field rates, Zohr, Ghana 2024 output, Congo Moho/Marine XII, Gabon Dussafu, GNQ Alen, DRC SEP Congo, Ghana Atuabo, Cameroon Kribi, Angola Lobito, TNP/Renaissance.
2. Remaining entries (Algerian Sonatrach trunk lines, Libyan onshore crude lines, ZAF Lilly/ROMPCO/NMPP, Kudu, CIV Foxtrot lines, Angola Block 0 lines) rely on well-established published figures; they are tagged `confidence: medium/low` and cite the institutional owner (Sonatrach TRC, NOC, Sasol, Transnet, NAMCOR, Petroci) rather than a dated page.
3. Coordinates: terminal/city/field centroids from standard gazetteer values; intermediate route points are approximate and flagged in `notes`. GEM's route geometries could not be pulled (gem.wiki returns HTTP 403 to automated fetches, and the session's search budget was exhausted before a fallback) — see caveats.

## Counts

### pipelines.json — 70 records (counted by first-listed country)
| Country (primary) | Records | Notes |
|---|---|---|
| NGA | 12 | ELPS I/II, AKK, OB3, TNP, TFP, NCTL, System 2B + cross-border WAGP, TSGP, NMGP, GoG–GNQ (concept) |
| DZA | 12 | Medgaz, Transmed, GME (offline), GZ1-3, GK1/2, GR1/2, GR5, OZ1/2, OK1, OB1, OT1, LZ1/NK1 |
| LBY | 7 | Greenstream, Sarir–Tobruk, Waha–Es Sider, Sharara–Zawiya, El Feel link, Wafa–Mellitah, Bahr Essalam/Bouri |
| EGY | 6 | SUMED, AGP, EMG (reverse), GASCO grid, Western Desert line, Zohr trunklines |
| AGO | 5 | Block 0/Malongo, Congo River crossing, ALNG gathering, Lobito–Lusaka (proposed), Lobito refinery (concept) |
| GHA | 4 | Atuabo–Aboadze, TTIP, Jubilee gas, OCTP gas |
| CMR | 4 | Bipaga–Mpolongwe, Sanaga Sud, Logbaba, Rio del Rey (Chad–Cameroon counted under TCD) |
| ZAF | 4 | ROMPCO (ZAF/MOZ), Lilly, NMPP, F-A–Mossel Bay (offline) |
| TCD | 2 | Chad–Cameroon, Koudalwa–Djermaya |
| NER | 2 | Niger–Benin, Agadem–Zinder |
| COG | 2 | Djeno export lines, Marine XII gas |
| GAB | 2 | Rabi–Cap Lopez, Gamba |
| CIV | 2 | CI-27 Foxtrot lines, Baleine gas |
| SEN | 2 | GTA subsea system, RGS (proposed) |
| GNQ | 2 | Alen–Punta Europa, Alba–Punta Europa |
| NAM | 1 | Kudu (concept) |
| COD | 1 | Matadi–Kinshasa (SEP Congo) |
| BEN | 0 own | Covered by WAGP, Niger–Benin, NMGP; Sèmè has no export pipeline |

Status mix: operational 58, under construction 2 (AKK, OB3), proposed 4, concept 3, offline 3 (GME, NNPC System 2B, F-A–Mossel Bay). EMG is recorded *operational* (reverse flow).

### basins.json — 51 records (by first-listed country)
DZA 6 · EGY 5 · LBY 5 · AGO 4 · NAM 4 · TCD 4 · NGA 3 · GHA 3 · ZAF 3 · COD 3 · BEN 2 · CMR 2 · GAB 2 · NER 2 · CIV 1 · GNQ 1 · SEN 1 · COG 0 own (Lower Congo and Cuvette Centrale listed under AGO/COD with COG as co-country).
Status mix: operational 28, exploration 21, decommissioned 1 (Saltpond), concept 1 (Karoo).

### blocks.json — 96 records
NGA 12 · AGO 12 · EGY 11 · DZA 9 · LBY 6 · NAM 6 · CIV 5 · ZAF 5 · CMR 4 · GAB 4 · GHA 4 · GNQ 4 · COG 3 · SEN 3 · TCD 3 · BEN 2 · COD 2 · NER 1.
Phase mix: production 73, exploration 13, development 10, relinquished/free 0 (none recorded; Benin Block 1 is 'development' but dormant).

### fields.json — 90 records
AGO 13 · NGA 10 · DZA 9 · EGY 9 · LBY 9 · CIV 5 · GNQ 5 · NAM 5 · GAB 4 · GHA 4 · CMR 3 · SEN 3 · TCD 3 · ZAF 3 · COG 2 · BEN 1 · COD 1 · NER 1.
Status mix: operational 73, under construction 5 (Ubeta, Kolmani, Cameia–Golfinho, Quiluma & Maboqueiro, Structures A&E), proposed 10, offline 2 (Sèmè, F-A/E-M).

## Key verified statuses (2024–2025)

- **Niger–Benin (Agadem–Sèmè)**: first cargo May 2024; sabotage + border dispute June 2024; exports resumed Aug 2024; 90 kb/d through 2025 (Bloomberg 19 Aug 2024; PGJ Oct 2025 quoting CNPC).
- **AKK**: 72% complete Q1 2025; River Niger crossing Jul 2025; mainline welding complete 29 Dec 2025; commissioning 2026 (NNPC).
- **OB3**: last section (River Niger HDD) completed Apr 2026; status end-2025 = under construction (NNPC/GEM).
- **WAGP**: operational; 2025 avg ~218 mmscf/d, 99.8% reliability, record ~80 m MMBtu (WAPCo).
- **Trans-Saharan / Nigeria–Morocco**: both proposed; NMGP Moroccan tenders 2025, TSGP ministerial revival Oct 2024 (GEM).
- **GME**: no Algerian flow since 31 Oct 2021; reverse Spain→Morocco only; Algeria refused reopening 2024–2025 (GEM/North Africa Post).
- **Medgaz**: 10.5 bcm/y, 9.4 bcm in 2024. **Transmed**: 33.5 bcm/y capacity, ~21 bcm in 2024 (CIDOB/Snam).
- **EMG**: reverse flow Israel→Egypt ~1 bcf/d H1 2024; Ashdod–Ashkelon link 2025 raises capacity (GEM/MEES).
- **GTA**: first gas 2 Jan 2025, first LNG 10 Feb 2025, first cargo 17 Apr 2025 (bp/Kosmos).
- **Sangomar**: first oil 11 Jun 2024; 100 kb/d nameplate reached (Woodside).
- **Baleine**: Phase 2 Dec 2024 (60 kb/d + 70 mmcf/d); Vitol 30% closed Sept 2025 (Eni).
- **Agogo IWH**: first oil 29 Jul 2025 (Eni/Azule/ANPG).
- **Block 11B/12B**: TotalEnergies, QatarEnergy, CNR withdrew Jul 2024; Africa Energy operator (TotalEnergies PR).
- **Namibia**: Venus FID targeted 2026 (160 kb/d FPSO); TotalEnergies took PEL 83/Mopane operatorship via Galp swap (2025); Shell wrote off PEL 39 (Jan 2025).
- **Libya 2025**: NOC average 1.374 mb/d (decade high); Sharara 306 kb/d; El Feel 80–90 kb/d.
- **Zohr**: ~1.9 bcf/d early 2024 vs 2.7 bcf/d peak; Zohr-6 (+65 mmcf/d) Aug 2025 (Eni AR 2025 / Ministry).
- **Ghana 2024**: 48.24 Mmbbl (Jubilee 66%, SGN 20%, TEN 14%); H1 2025 −26% (Petroleum Commission/PIAC).
- **Moho Nord**: ~140 kb/d; TotalEnergies +10% from Trident (2024), USD 500–600 m infill for +40 kb/d.
- **Dussafu**: 33.2 kb/d gross 2025 (BW Energy).
- **SPDC → Renaissance**: completed 13 Mar 2025 (Shell); TNP now Renaissance-operated.
- **Seplat–MPN**: completed 12 Dec 2024.

## Principal sources (URLs)

Regulators / NOCs: NNPC (nnpcgroup.com), NUPRC (nuprc.gov.ng), NMDPRA, ANPG (anpg.co.ao), Azule Energy PR (azule-energy.com), Sonatrach (sonatrach.com), ALNAFT, NOC Libya (noc.ly), EGAS/EGPC, Petroci, SNH (snh.cm), SHT, SNPC, MMH Equatorial Guinea, Gabon DGH / Gabon Oil Company, Ghana Petroleum Commission (petrocom.gov.gh) & Energy Commission outlooks, NAMCOR, Petrosen, PASA, SEP Congo (sepcongo.com/pipeline), WAPCo (wagpco.com).
Operators: TotalEnergies, Eni (incl. Annual Report 2025 E&P KPIs), Shell, ExxonMobil, Chevron, bp, Woodside, Kosmos, Tullow, BW Energy, VAALCO, Maurel & Prom, Seplat, Renaissance Africa Energy, Galp, CNPC.
Trackers / IFIs / analysis: Global Energy Monitor gem.wiki pages (Trans-Sahara, Nigeria–Morocco, Medgaz, GME, WAGP, OB3, AGP, EMG, SUMED, Libya pipelines, Atuabo–Aboadze, Matadi–Kinshasa), EIB (Chad–Cameroon brief), CIDOB/OIES (Transmed volumes), MEES (EMG), USGS World Petroleum Assessment (basin provinces).
Press used only where quoting an operator/regulator figure: Bloomberg (Niger–Benin), PGJ (AKK, CNPC Niger), Nairametrics (AKK/OB3 NNPC statements), World Oil (Venus FID, Congo), GNA/PIAC (Ghana), Business in Cameroon (COTCO shares), NS Energy (Alen project data), Egypt Oil & Gas (Zohr).

## Caveats

1. **Geometry**: only start/end/terminal coordinates are reliable; intermediate vertices are hand-placed approximations. GEM route shapefiles should replace them (GEM blocks automated fetches; download the Global Gas/Oil Infrastructure Tracker CSV/GeoJSON manually from globalenergymonitor.org).
2. **Composite records**: several "pipelines" are network summaries (GASCO grid, Angola LNG gathering, Block 0/Malongo lines, Hassi R'Mel LPG/condensate, Rio del Rey lines). Split before mapping if per-line rendering is needed.
3. **Algerian nomenclature**: the brief's "GR" lines are Sonatrach's GK (Hassi R'Mel–Skikda) and GR (Rhourde Nouss–Hassi R'Mel); both included. Capacities are engineering estimates, not Sonatrach-published.
4. **Unverified this session** (search budget exhausted): Lilly, NMPP, ROMPCO capacities/lengths; Kudu pipeline; CI-27 pipeline lengths; Chad Bongor/Mangara volumes; Angola Block 0 pipeline lengths. All flagged medium/low.
5. **Nigeria licence IDs**: post-PIA conversion assigns PML/PPL numbers; legacy OML/OPL IDs retained for traceability.
6. **Reserve fields** (`oilMmb`, `gasBcf`): mix of recoverable and in-place volumes where operators only publish in-place (Baleine, Zohr, Sarir, Mopane) — each such case is stated in `notes`. Null where no institutional figure exists (never estimated).
7. **Ownership in flux**: Petronas exit from Chad Doba (2024), Kosmos exit from Block G (2025), Block 31 partner shares after Azule formation, DWOB partners, ROMPCO shareholding — marked "verify" in notes.
8. **Date context**: research executed Sept 2026; where 2026 events change a 2025 status (OB3 crossing, AKK commissioning, SUMED expansion, Venus FID) the record keeps the end-2025 status and notes the 2026 development.
