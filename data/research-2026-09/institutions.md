# AIEM – Institutional data research: sources, counts and caveats

Research date: 2026-09-04. Deliverables in this directory:
`country_profiles.json` (A, 18 records), `national_companies.json` (B, 135), `training.json` (C, 96), `rnd_centers.json` (D, 50).
Working inputs kept for audit: `wb_pop.json`, `wb_gdp.json`, `imf_ngdpd.json`, `imf_lp.json` (raw API pulls), `build_profiles.py`, `merge.py`, `parts/` (per-group raw outputs and sources).

## 1. Counts per country

| ISO3 | Country | Profiles (A) | Companies (B) | Training (C) | R&D (D) | low-confidence records (B+C+D) |
|---|---|---|---|---|---|---|
| DZA | Algeria | 1 | 8 | 10 | 6 | 3 |
| AGO | Angola | 1 | 9 | 5 | 2 | 1 |
| BEN | Benin | 1 | 3 | 2 | 1 | 3 |
| CMR | Cameroon | 1 | 6 | 5 | 2 | 2 |
| TCD | Chad | 1 | 4 | 3 | 1 | 4 |
| COD | DR Congo | 1 | 3 | 3 | 1 | 1 |
| COG | Republic of Congo | 1 | 9 | 1 | 0 | 1 |
| CIV | Côte d'Ivoire | 1 | 5 | 3 | 1 | 0 |
| EGY | Egypt | 1 | 16 | 8 | 2 | 9 |
| GNQ | Equatorial Guinea | 1 | 4 | 2 | 0 | 1 |
| GAB | Gabon | 1 | 6 | 4 | 2 | 4 |
| GHA | Ghana | 1 | 9 | 8 | 6 | 3 |
| LBY | Libya | 1 | 16 | 6 | 2 | 4 |
| NAM | Namibia | 1 | 2 | 4 | 3 | 2 |
| NER | Niger | 1 | 3 | 3 | 1 | 3 |
| NGA | Nigeria | 1 | 16 | 14 | 11 | 9 |
| SEN | Senegal | 1 | 8 | 6 | 1 | 6 |
| ZAF | South Africa | 1 | 8 | 9 | 8 | 5 |
| **Total** | | **18** | **135** | **96** | **50** | **61** |

Confidence distribution — B: high 56 / medium 55 / low 24; C: high 22 / medium 48 / low 26; D: high 18 / medium 21 / low 11.
Null `founded`: B 54, C 53, D 34. Null coordinates: C 2, D 1. Records whose notes flag approximate (city/district-centre) coordinates: 88 of 146 geocoded records.
Countries with no verifiable hydrocarbon R&D centre: COG, GNQ (empty by design — see group 3 notes).

## 2. Country profiles (A) — sources and method

- Population 2021–2024: World Bank WDI `SP.POP.TOTL`, pulled 2026-09-04 from `https://api.worldbank.org/v2/country/<ISO3>/indicator/SP.POP.TOTL?date=2021:2024&format=json` (API stamp "lastupdated 2026-07-13"). Landing page per country: `https://data.worldbank.org/indicator/SP.POP.TOTL?locations=<ISO3>`.
- GDP 2021–2024 (current US$): World Bank WDI `NY.GDP.MKTP.CD`, same API/date. Values stored in billions, 3 decimals.
- GDP 2025: IMF World Economic Outlook **April 2026** (DataMapper `NGDPD`, indicator metadata "last-modified 2026-04-08"), `https://www.imf.org/external/datamapper/api/v1/NGDPD/<ISO3>`; flagged in each record as a projection (`gdpBnUsd.2025_flag`). The full IMF 2021–2025 series is kept in `gdpImfWeoBnUsd` so the two vintages can be compared. Note: the brief mentioned "IMF WEO April 2025"; the live DataMapper now serves the April 2026 vintage, which was used and labelled accordingly.
- Economy narratives (FR/EN): drafted from the World Bank country overview pages fetched 2026-09-04 (`https://www.worldbank.org/en/country/<slug>/overview`); all quantitative statements in the narratives are taken from those pages (e.g. Algeria hydrocarbons 13 % GDP / 83 % exports / 46 % revenues 2020–2024; Angola ~20 % / 60 % / 95 %; Chad ~15 % / 41 % / 76 %; Libya 65 % / 93 % / 72 % in 2024; Congo ~50 % GDP / 80 % exports). No page for Benin mentioned oil; the Sèmè/Niger–Benin pipeline sentence is institutional knowledge and is qualitative only.
- Capital, currency, independence date: standard reference facts (UN Statistics / CIA World Factbook as locator); edge cases documented in `notes` (Benin Porto-Novo vs Cotonou; Côte d'Ivoire Yamoussoukro vs Abidjan; Egypt 1922 vs 1953 republic; South Africa 1910 Union vs 1961 Republic; Senegal 4 April 1960; Equatorial Guinea planned capital).
- Divergences noted: WB vs IMF nominal USD GDP differ materially for AGO (103.1 vs 119.6 bn, 2024) and COG (15.7 vs 14.8 bn); WB series retained for 2021–2024. IMF population differs from WB for GNQ and NER. Nigeria's 2024 USD GDP reflects the naira devaluation and the July 2025 NBS rebasing. Libya figures are subject to large revisions.

## 3. Cross-cutting caveats (B, C, D)

1. **WebSearch budget.** The session's web-search quota (200 calls) was exhausted early; the four research groups worked almost entirely from direct fetches of official domains (WebFetch/curl), with Wikipedia used only as a pointer to primary sites. This reduces discovery breadth: institutions without a reachable official website may be missing.
2. **Unreachable official sites** (URL kept, fact left null or lowered confidence): DZA Naftal, IFEG, CREDEG, ENIP; LBY Libyan Petroleum Institute (lpilibya.com/lpi.ly), Sirte Oil, Waha, Zueitina, Brega, STC; EGY Ganope, Misr Petroleum, Co-op Petroleum, Petrogas, Town Gas, Suez University, Cairo University Eng.; NGA ABU, UNIBEN, Kaduna Poly, UGSET, NIW, RMRDC; GHA BOST, TOR (old domain), Ghana Gas (JS-only), KNUST Petroleum dept; ZAF SFF, iGas, Transnet Pipelines, UP/UJ (403); AGO Refinaria de Luanda, Universidade Óscar Ribas; CMR SONARA (only contact page), Hydrac, Université de Douala, Maroua, Ngaoundéré, MINRESI; GAB GOC, SOGARA, SGEPP, USTM, DGH legacy site; GNQ GEPetrol (all domains dead), MHDM (bad TLS); COD Ministry of Hydrocarbons (bot wall), CRGM; SEN PETROSEN, INPG, Ministry of Energy, IST, EPT, UAM, CERER; BEN SONACOP, SoBeGaz, OBRGM, MEEM, EPAC; NER SONIDEP, SORAZ, Ministry of Petroleum, Université d'Agadez, CNES; TCD SHT, SRN, Ministry, Université de N'Djamena, CNRD, INSPM; NAM MME, PETROFUND, NIMT.
3. **Coordinates.** Nominatim rate-limited/blocked every group after 20–30 queries (group 3 switched to Photon/komoot, OSM data). Roughly half of training/R&D coordinates are city- or district-centre approximations, each flagged "coordinates approximate" in `notes`. Two training and one R&D record have null coordinates (location unknown).
4. **Founding years.** 141 records carry `founded: null` because the year is not displayed on a primary page; where a widely reported year exists it is quoted in `notes` with lowered confidence, never in the `founded` field. Examples: NOC Libya 1970, EPRI 1974, PTDF/PTI 1973, SFF 1964, PASA 1999, SA universities, SHT 2006, PETROSEN 1981, INP-HB 1996.
5. **Contradictions with the brief resolved from official pages:** SONAHYDROC renamed 2016 (Law 15/012), not 2019; SEP Congo describes itself as private-majority (SONAHYDROC 36.6 %), not state-majority; RGS Senegal created 2019, not 2020; NNPC RTI is headquartered in Abuja, not Port Harcourt; CORAF created 31 Jan 1981 (SNPC site), refinery in service 1982; NAMCOR's "E&P" and "Trading" are business units, not legal subsidiaries; SANPC (South Africa) is operational since 1 May 2025 as a CEF subsidiary under an interim arrangement, with PetroSA continuing as a ring-fenced legacy entity; GOIL originated in 1960 as AGIP Ghana (state-owned 1974, renamed 1976); Sonelgaz training now runs through Sonelgaz-Services schools rather than a single IFEG; ANPG created by Decreto Presidencial 49/19 (2019) as concessionaire; IRDP Angola created by DP 133/13 (2013).
6. **Entities requested in the brief but not verifiable on any official source and therefore omitted or kept as low-confidence placeholders:** SIRB Benin (no such entity found; SoBeGaz kept low), INSTM Côte d'Ivoire, SONIHY Niger, Institut du Pétrole et de l'Énergie / ITC Congo, ITNHGE and Universidad Africana (GNQ), ENSI Libreville, IUC/ISTDI Cameroon, Ghana Oil and Gas Learning Foundation (placeholder, status unverified), Namibia Petroleum Fund, Comité National des Hydrocarbures Senegal, ARH DR Congo, Institut National du Pétrole et du Gaz DRC.
7. **Scope decisions.** Private or JV entities are included only where the brief asked for a note (Angola LNG, EG LNG, NLNG, SORAZ, SRN, Sasol, WAPCO Niger noted in text only) and are labelled as such in `type`/`notes`. Electricity utilities are excluded unless gas-related (Sonelgaz kept for its gas distribution and training network). Renewable/solar or geology institutes (CDER, CSERS, CERER, CNES, OBRGM, CRGM, Council for Geoscience) are included in R&D only where they carry an energy mandate, at medium/low confidence, and are labelled by `focus`.
8. **APPO Forum of Directors of Oil & Gas Training Institutes.** APPO pages confirm the Forum's launch at IAP Skikda (21–22 June 2023, 14 institutions), a 2024 explainer and the 4th Forum in Tripoli (16–18 June 2026), but publish no member roster; therefore no training record is tagged as a Forum member. Roster should be requested from the APPO Secretariat.
9. **Language.** Descriptions are bilingual FR/EN, written from the official pages; a native-speaker editorial pass is recommended before publication.

## 4. Detailed sources by research group (verbatim from the four group reports)


### Group 1 — Algeria, Libya, Egypt

## G1 research — Algeria (DZA), Libya (LBY), Egypt (EGY): sources, counts, caveats

Research date: 2026-09-04. Method: official company / ministry / university / regulator sites fetched directly (WebFetch, and `curl -k` for sites with broken TLS chains), APPO Secretariat publications, US Treasury (NOC subsidiary list). Wikipedia used only to locate primary sites; never cited. WebSearch budget for the session was exhausted after the first 12 queries, so the rest of the work relied on direct fetches of known official URLs.

### Counts

| Country | Companies (B) | Training institutes (C) | R&D centres (D) |
|---|---|---|---|
| DZA | 8 | 10 | 6 |
| LBY | 16 | 6 | 2 |
| EGY | 16 | 8 | 2 |
| **Total** | **40** | **24** | **10** |

Confidence distribution — companies: high 15 / medium 17 / low 8; training: high 5 / medium 14 / low 5; R&D: high 2 / medium 7 / low 1.

### Algeria (DZA)

Official / primary sources used:
- Sonatrach — https://sonatrach.com/en/ ; subsidiaries: https://sonatrach.com/subsidiaries-and-shareholding/ and https://sonatrach.com/fr/filiales-et-participations/ ; IAP: https://sonatrach.com/en/algerien-institute-of-petroleum/ ; R&D: https://sonatrach.com/en/research-and-development/
- Naftal — https://www.naftal.dz/fr/index.php/a-propos-de-naftal/historique (server refused connections from our network; facts taken from indexed text of that page)
- ALNAFT — https://www.alnaft.dz/who-are-we/ ("Since April 28, 2005")
- ARH — https://www.arh.gov.dz/ and /30/statut (TLS certificate chain not verifiable; fetched with verification disabled)
- Sonelgaz — https://www.sonelgaz.dz/fr/category/historique (ordonnance 69-59 du 28/07/1969), /fr/category/qui-sommes-nous, /fr/filiales, /fr/category/nos-ecoles
- Ministère de l'Énergie et des Mines — "Les instituts de formation": https://www.oilmines.gov.dz/?article=les-instituts-de-formation (IAP-CU 4 sites, CPE Sonatrach, IFEG Sonelgaz)
- Université M'Hamed Bougara Boumerdès — https://www.univ-boumerdes.dz/ (décret 98-189 du 02/06/1998); FHC: https://fhc.univ-boumerdes.dz/
- Université Kasdi Merbah Ouargla — https://www.univ-ouargla.dz/ (faculty site fherstu.univ-ouargla.dz returned 404)
- ENP Alger — https://www.enp.edu.dz/ and /fr/histoire/
- CDER — https://www.cder.dz/spip.php?rubrique225 (created 22 March 1988; units UDES/URAER/URERMS), rubrique231 (missions), rubrique229 (units)
- APPO — Forum of Directors of O&G Training Institutes: https://apposecretariat.org/what-you-need-to-know-about-the-appo-forum-of-directors-of-oil-and-gas-training-institutes-…/ ; APPO Bulletin Oct 2023 (PDF) https://apposecretariat.org/wp-content/uploads/2023/10/WEB-VERSION.pdf (14 institutions at the inaugural meeting, Skikda 21–22 June 2023, hosted by IAP)
- Geocoding: Nominatim (IAP Boumerdès, FHC, Ben Aknoun, Sonatrach HQ, ARH, Sonelgaz HQ, Arzew, Skikda, Hassi Messaoud)

Caveats (DZA):
- Naftal, IFEG, CREDEG, ENIP sites unreachable/unresolvable; ENIP and ENAC confirmed only by name on Sonatrach's affiliates page (founding years null).
- CREDEG is not among the 11 subsidiaries on Sonelgaz's current site — status flagged "unknown".
- Sonelgaz's training network now appears as Sonelgaz-Services schools (EFGB Ben Aknoun, EMEB Blida, EMGA Aïn M'lila, EMPEG Ghardaïa, EMEGA Adrar); the Ministry page still names IFEG. Both recorded.
- ENP founding year (1925) and FHC lineage from INH not extracted from official pages → null / noted.
- CRD Sonatrach founding year not stated officially → null.
- Coordinates for Ouargla, El Harrach, Bouzaréah, Aïn M'lila, Ghardaïa, Adrar, Bou Ismaïl are city-centre approximations (Nominatim started blocking our IP mid-way).

### Libya (LBY)

Official / primary sources used:
- NOC — https://noc.ly/en/ and https://noc.ly/en/companies/ (24 subsidiaries with domains: ptqi.edu.ly, stc.edu.ly, sirteoil.com.ly, zueitina.com.ly, sarir-oil.com, mabrukoil.com, harouge.com, akakusoil.com, raslanuf.ly, wahaoil.ly, nafusah.com, mellitahog.com.ly, arc.com.ly, brega.ly, lercorefinery.com, nwd.ly, jowfe.ly, taknia.ly, nageco.com, oilclinic.ly, lifeco.com.ly, nofcat.com, petroair.ly)
- AGOCO — https://agoco.ly/ (founded 1971, Benghazi)
- Zawia Oil Refining — https://arc.com.ly/ (production start 1974; 2nd unit 1977; asphalt plants 1980/1984)
- Ras Lanuf Oil & Gas — https://raslanuf.ly/en/ (Resolution 137 of 1982; amended 523/1986)
- Jowfe Oil Technology — https://jowfe.ly/en/company-overview/ (Resolution 577 of 28/07/1983; HQ Ganfouda, Benghazi)
- NOWDC — https://nwd.ly/ (training centre "مركز الوطنية للتدريب والتطوير")
- Akakus — https://akakusoil.com/ (founded 1995 as Repsol Oil Operations)
- Mabruk — https://mabrukoil.com/company-profile/ ; Harouge — https://harouge.com/ ; Taknia — https://taknia.ly/ (2009) ; Mellitah — https://www.mellitahog.ly/ ; NAGECO — https://nageco.com/ (under construction)
- PTQI — https://ptqi.edu.ly/ (cabinet decision 26/08/1970; T&D Centre 1987; Gargaresh Rd 9 km)
- University of Tripoli, Faculty of Engineering — https://uot.edu.ly/eng/index.php (faculty 1961; petroleum college 1972; merged 1985)
- Libyan Academy — https://academy.edu.ly/ (1988)
- CSERS — https://csers.ly/en/ (no founding year on site)
- US Treasury press release TG-1114 (22 March 2011) — https://home.treasury.gov/news/press-releases/tg1114 (14 NOC-owned companies)
- APPO — Libya membership page https://apposecretariat.org/membership/libya/ ; 4th Forum of APPO Training Institutes held in Tripoli, 16–18 June 2026 (speech by H.E. Farid Ghezali: https://apposecretariat.org/speech-by-h-e-farid-ghezali-at-the-opening-of-the-4th-forum-of-appo-training-institutes/) — host institute not named in the speech.

Caveats (LBY):
- NOC founding year (1970) is not on noc.ly; taken from secondary sources → record confidence "medium", noted.
- Sirte Oil, Waha, Zueitina, Brega sites are JavaScript-only or Cloudflare-blocked; recorded from the noc.ly subsidiary list with founding years null.
- Libyan Petroleum Institute: lpilibya.com / lpi.ly do not resolve; founding 1977 and address from the former site's indexed text; noc.ly lists it as "Petroleum Research Center". LPI appears in both training and R&D datasets.
- Specific Training Center (stc.edu.ly) returned 403 — location unknown.
- LERCO, Nafusah, Sarir, Oil Clinic, Petro Air, LIFECO, NOFCAT omitted (support/JV entities or dead sites) except those with fetched pages.
- Coordinates for Tripoli-area entities partly approximate.

### Egypt (EGY)

Official / primary sources used:
- EGPC — http://www.egpc.com.eg/About_EGPC.aspx (Law 135/1956; 12 public companies, 41 JVs, 87 investment-law cos; HQ Palestine St., New Maadi); training pages http://www.egpc.com.eg/Training_Types_Centers_Programs.aspx (content did not render)
- EGAS — https://www.egas.com.eg/ (August 2001; 85 Nasr Road, Nasr City; lists GASCO, Petrogas, Town Gas, EGPC, Enppi, Egypt Gas, Petrojet, Ganope, ECHEM)
- ECHEM — https://www.echem-eg.com/history (2002); subsidiaries ETHYDCO, SIDPEC, MOPCO, EPC, E-LAB, E-Methanex, EPPC, ESTYRENICS
- GASCO — https://www.gasco.com.eg/index.php/about/ (March 1997; Law 230/1989 amended by Law 8/1997) — TLS chain issue
- MIDOR — https://www.midor.com.eg/shareholders.html (EGPC 80%, Petrojet 10%, Enppi 10%; USD 2.2 bn capital; Amreya Free Zone)
- Egypt Gas — https://www.egyptgas.com.eg/CompanyHistory.aspx?Id=2 (Decree 142/1983; 30 Mofatisheen St., Heliopolis)
- Ministry of Petroleum — https://www.petroleum.gov.eg/en/ (EGPC, EGAS, ECHEM, Ganope, EMRA)
- ETHYDCO — https://ethydco-eg.com/en/posts/faculty-of-petroleum-and-mining-engineering-suez-university
- EPRI — http://www.epri.sci.eg/ and /training-center (address; JS-rendered); WIPO TISC entry https://www.wipo.int/tisc/en/search/details.jsp?id=10037 ; Egyptian Journal of Petroleum https://ejp.researchcommons.org/journal/about.html (EPRI publishes since 1991)
- NRC — https://www.nrc.sci.eg/about-us (1956; petroleum research institute spun off from NRC)
- AUC — https://sse.aucegypt.edu/departments/petroleum-energy-engineering
- BUE — https://www.bue.edu.eg/our-faculties (Faculty of Energy & Environmental Engineering)
- FUE — https://www.fue.edu.eg/ (2006; Petroleum Engineering programme with Missouri S&T)
- AASTMT — https://aast.edu/en/ (1972; "Oil and Gas Hub")

Caveats (EGY):
- Ganope (ganope.com), Misr Petroleum, Cooperation Petroleum, Petrogas, Town Gas, Suez University, Cairo University Faculty of Engineering sites were unreachable (DNS failure or connection refused/timeout from our network). They are recorded with founding years null and confidence low/medium, sourced from EGPC/EGAS/ETHYDCO pages that name them.
- Petrojet, Enppi, ERC sites are JavaScript-only; full legal names of Petrojet/Enppi confirmed via MIDOR's shareholders page; founding years null.
- EPRI founding year (1974, Decree 541) not on the official site → from secondary sources, flagged.
- ERC is not majority state-owned (EGPC minority stake, unverified) — included only as a note-level record with confidence low.
- No dedicated "petroleum sector research centre" beyond EPRI/NRC could be verified from official pages; GASCO's PIMCOE (pipeline integrity centre) exists in site navigation but was not documented enough to include.
- All Egyptian coordinates are approximate (city/district centre) except FUE (OSM object).

### Cross-cutting caveats
- Nominatim blocked our IP after ~30 requests; ~45% of coordinates are city-centre approximations and are flagged in `notes`.
- `type` vocabulary for companies was constrained to NOC|downstream|gas|petrochemicals|regulator|holding; NOC-owned upstream/service operating subsidiaries are tagged "NOC", pipeline-construction (ENAC) is tagged "downstream" with a note.
- No records were created from Wikipedia alone; where a fact exists only in secondary sources it is either null or explicitly flagged in `notes` with confidence lowered.

### Group 2 — Nigeria, Ghana, South Africa

## G2 research sources — Nigeria (NGA), Ghana (GHA), South Africa (ZAF)

Research date: 2026-09-04. Method: official sites fetched directly (WebFetch, and curl for sites blocking the fetch tool); geocoding via Nominatim (OpenStreetMap) with User-Agent "AIEM-research". The session's web-search budget was exhausted before this task started, so every fact below comes from a directly fetched official page; where an official page could not be reached, the field is null and confidence is lowered.

### Counts

| Country | Companies (B) | Training (C) | R&D (D) |
|---|---|---|---|
| NGA | 16 | 14 | 11 |
| GHA | 9 | 8 | 6 |
| ZAF | 8 | 9 | 8 |
| **Total** | **33** | **31** | **25** |

### Nigeria (NGA)

Official / primary sources used:
- NNPC Ltd – Who we are (1977 merger, 16 Aug 2021 incorporation): https://nnpcgroup.com/who-we-are
- NNPC Ltd – Our Businesses (BU list incl. RTI, NNPC Academy): https://nnpcgroup.com/businesses
- NNPC Ltd – List of business units & subsidiaries (PDF, Dec 2022): https://cms1977.nnpcgroup.com/uploads/LIST_OF_THE_NNPC_LIMITED_B_Us_and_S_Us_604b6ef090.pdf
- NNPC Ltd – Research, Technology & Innovation (est. 16 March 2020, Abuja): https://nnpcgroup.com/research-technology-and-innovation-rti
- NNPC Ltd – NNPC Academy (NNPC Towers, Abuja): https://nnpcgroup.com/nnpc-academy
- NUPRC – History / homepage (address Jabi, Abuja): https://www.nuprc.gov.ng/history ; https://www.nuprc.gov.ng/
- NMDPRA – About (PIA 2021; DPR/PPPRA/PEF merger): https://nmdpra.gov.ng/about/
- NCDMB – homepage (NOGICD Act 2010, Nigerian Content Tower Yenagoa): https://ncdmb.gov.ng/ ; R&D: https://www.ncdmb.gov.ng/research-development/
- PTDF – About us / homepage (address, UGSET, CSDT Port Harcourt): https://ptdf.gov.ng/about-us/ ; https://ptdf.gov.ng/
- NLNG – About us (incorporated 1989, Bonny Island, shareholders): https://www.nlng.com/about-us
- PTI – homepage (1 PTI Road Effurun, programmes): https://pti.edu.ng/
- FUPRE – homepage: https://fupre.edu.ng/
- University of Port Harcourt – Centres & Institutes: https://www.uniport.edu.ng/centres-and-institutes/
- IPES UNIPORT (founded 2003, IFP School partnership): https://ipes.uniport.edu.ng/
- Emerald Energy Institute: https://eeiuniport.edu.ng/
- ACE-CEFOR (est. 2013, World Bank ACE): https://aceceforuniport.edu.ng/
- University of Ibadan (est. 1948): https://www.ui.edu.ng/
- AUST Abuja (est. 2007, Galadimawa): https://aust.edu.ng/
- Energy Commission of Nigeria – homepage (Act 62 of 1979, address) and Energy Research Centres page (NCERD, SERC, NCEEC, NACHRED, NCEE, NCPRD): https://energy.gov.ng/ ; https://energy.gov.ng/research-centers.html
- NISLT (Act 2003, Ibadan): https://nislt.gov.ng/

Caveats (NGA):
- Refining companies (PHRC, WRPC, KRPC) are not named individually in NNPC's 2022 BU list (grouped under NNPC RefChem / NDIS); their entries carry commissioning years and confidence "low".
- Founding years for NEPL/NGIC are those of predecessors NPDC/NGC (1988) and are not stated on official pages; NGML, NRL, NPSC, NETCO founding years left null.
- PTDF 1973 (Decree 25) and PTI 1973 (Decree 37) are not displayed on the official homepages fetched.
- NNPC RTI: official address is Abuja (RTI Nexus Building), not Port Harcourt as expected in the brief.
- Sites unreachable/blocked: abu.edu.ng (connection refused), uniben.edu (403), kadunapolytechnic.edu.ng (403 / certificate mismatch), ugset.edu.ng (DNS), niw.org.ng (DNS), cgrpng.org (500), rmrdc.gov.ng (403). Corresponding entries have null years and low/medium confidence.
- Coordinates: exact OSM points for PTI, UNIPORT/IPS, UI, UNIBEN, UNN, UDUS, UNILAG, Kaduna Polytechnic, Kaduna refinery, Bonny; city/district-centre approximations flagged in notes for the others.

### Ghana (GHA)

Official / primary sources used:
- GNPC – homepage, Overview (PNDC Law 64, 1983; Petroleum House Tema; Explorco, Foundation), Divisions (Research & Technology): https://www.gnpcghana.com/ ; https://www.gnpcghana.com/about-us/overview ; https://www.gnpcghana.com/about-us/divisions
- GNPC Law 1983 (PNDCL 64) text (hosted by Petroleum Commission): https://petrocom.gov.gh/wp-content/uploads/2022/08/ghana_national_petroleum_corporation_law_19831.pdf
- SIGA (State Interests and Governance Authority) entity profiles: GNPC https://siga.gov.gh/entity/ghana-national-petroleum-corporation-2/ ; BOST https://siga.gov.gh/entity/bulk-oil-and-storage-company/ ; Ghana Gas https://siga.gov.gh/entity/ghana-gas-company-limited/ ; TOR https://siga.gov.gh/entity/tema-oil-refinery/
- GOIL – About us (1960 as AGIP Ghana; state ownership 1974; renamed 1976): https://goil.com.gh/about-us/
- Tema Oil Refinery – official site (est. 1963): https://torghana.gov.gh/
- Petroleum Commission – About (Act 821, 2011; Plot 4A George Bush Highway): https://petrocom.gov.gh/about/ ; KNUST–Halliburton research deal (July 2026): https://petrocom.gov.gh/2026/07/29/petroleum-commission-and-halliburton-ghana-operations-sign-us15-million-deal-to-strengthen-teaching-and-research-at-knust/
- National Petroleum Authority (Act 691, 2005; 6 George Walker Bush Highway): https://www.npa.gov.gh/
- Energy Commission (Act 541, 1997; Airport Residential Area): https://www.energycom.gov.gh/
- Ghana Atomic Energy Commission: https://gaec.gov.gh/
- CSIR Institute of Industrial Research: https://www.iir.csir.org.gh/
- KNUST homepage: https://www.knust.edu.gh/ ; UMaT: https://www.umat.edu.gh/ ; University of Ghana Earth Science: https://www.ug.edu.gh/earthscience/ ; UCC (since 1962): https://ucc.edu.gh/ ; TTU (Sept 2016): https://ttu.edu.gh/ ; KsTU (1954/2016): https://kstu.edu.gh/

Caveats (GHA):
- bost.com.gh / bost.gov.gh and tor.com.gh do not resolve; BOST facts from SIGA, TOR from torghana.gov.gh (the current official domain).
- ghanagas.com.gh is a JavaScript-only site with no extractable text; facts from SIGA (incorporated July 2011; production Nov 2014; HQ 225 Osibisa Close, Airport West, Accra; plant at Atuabo).
- GNPC Explorco founding year not stated on GNPC pages (null).
- Ghana Oil and Gas Learning Foundation (GOGLF) could not be found on any official site; kept as a low-confidence placeholder with status "unverified".
- KNUST petroleum department site and The Brew-Hammond Energy Centre site did not resolve; UMaT blocked structured extraction (403); petroleum programme names at TTU/KsTU/UCC not confirmed.
- Coordinates: exact OSM points for GNPC Petroleum House, TOR, NPA, Energy Commission, Atuabo, KNUST, UMaT, UG, UCC, KsTU; approximations flagged for GOIL, BOST, Petroleum Commission, Ghana Gas HQ, TTU, CSIR-IIR, GAEC.

### South Africa (ZAF)

Official / primary sources used:
- CEF Group – homepage (CEF Act 38 of 1977; subsidiaries PetroSA, iGas, SFF, AEMFC, PASA, SA-NPC; Sandton address): https://www.cefgroup.co.za/ ; iGas page (Ministerial Directive 2 Oct 2000): https://www.cefgroup.co.za/igas/
- PetroSA – homepage / Our History (Soekor 1965, launch 2002, Parow address): https://www.petrosa.co.za/ ; Centre of Excellence Mossel Bay (est. 2002): https://www.petrosa.co.za/excellence.html
- Parliament of RSA – SANPC starts work (live 1 May 2025; launch 23 May 2025; 420 staff; Bill status; PFMA s54 / CEF Act basis): https://www.parliament.gov.za/news/new-state-petroleum-company-starts-its-work-committee-calls-urgent-tabling-national-petroleum-bill
- SAnews.gov.za – Meet SA's new petroleum company (Sept 2024 approval; entities merged): https://www.sanews.gov.za/south-africa/meet-sas-new-petroleum-company
- Engineering News – SANPC starts operating (PetroSA legacy ring-fenced, 620 staff; lease-and-assign model): https://www.engineeringnews.co.za/article/new-national-petroleum-company-starts-operating-one-week-later-than-planned-2025-04-09 (trade press, used only to corroborate the parliamentary source)
- Petroleum Agency SA – homepage / company profile (mandate, Century City address): https://www.petroleumagencysa.com/ ; https://www.petroleumagencysa.com/company-profile/
- NERSA – homepage (Act 40 of 2004; three regulated industries; Kulawula House, Pretoria): https://www.nersa.org.za/
- Transnet SOC Ltd – homepage (Pipelines listed among seven divisions): https://www.transnet.net/
- SANEDI (National Energy Act 34 of 2008; operational 2011): https://www.sanedi.org.za/
- Council for Geoscience (Geoscience Act 1993; Silverton address): https://www.geoscience.org.za/
- Mintek (est. 1934; 200 Malibongwe Drive): https://www.mintek.co.za/
- CSIR (Act of Parliament 1945; energy research area): https://www.csir.co.za/
- CRSES Stellenbosch (est. 2007): https://www.crses.sun.ac.za/
- Universities: Wits https://www.wits.ac.za/about-wits/ ; UCT https://www.uct.ac.za/ ; Stellenbosch https://www.su.ac.za/ ; NMU https://www.mandela.ac.za/ ; DUT https://www.dut.ac.za/ ; UP https://www.up.ac.za/ (403) ; UJ https://www.uj.ac.za/ (403)
- Sasol – homepage (private company): https://www.sasol.com/

Caveats (ZAF):
- SANPC status verified: operational since 1 May 2025 as a CEF subsidiary under an interim (PFMA / CEF Act) arrangement; the National Petroleum Company Bill had not been tabled in Parliament at the date of the parliamentary source. sanpc.co.za is only a domain-reservation page; headquarters not confirmed (coordinates use CEF Sandton address).
- PetroSA continues as a legacy entity (non-viable assets ring-fenced); iGas and SFF operations folded into SANPC.
- SFF founding year (secondary sources: 1964) and PASA establishment year (secondary sources: 1999) are not shown on official pages, left null. sffsa.co.za did not resolve; igas.co.za returned HTTP 500.
- Transnet Pipelines division page could not be retrieved (site error redirect); founding year and network length null.
- University founding years (Wits 1922, UCT 1829, SU 1918, UP 1908, UJ 2005, NMU 2005, DUT 2002) are not displayed on the fetched homepages and are therefore recorded in notes only, with null in the "founded" field.
- Sasol entries are private-sector and flagged as such (task asked for them as notes).
- Coordinates: exact OSM points for CEF, PetroSA Parow, PASA Century City, NERSA, Wits, UCT, SU, UP, UJ, NMU, CSIR Pretoria, Mintek; approximations flagged for SANPC, SFF, SANEDI, CGS, DUT, Mossel Bay, Sasolburg, Secunda, Transnet Pipelines Durban.

### Geocoding
All coordinates were obtained from Nominatim (https://nominatim.openstreetmap.org/) using the official address where available; entries whose notes say "coordinates approximate" use a district or city-centre point.

### Group 3 — Angola, Cameroon, Republic of Congo, Gabon, Equatorial Guinea

## G3 research sources — AGO, CMR, COG, GAB, GNQ

Research date: 2026-09-04. Method note: the session's WebSearch budget was exhausted before this task
started, so discovery was done by fetching official domains directly (WebFetch / curl), Wikipedia used only
as a pointer to primary sources, and a small number of Yahoo/Brave HTML lookups before those were throttled.
Geocoding: Nominatim blocked the session; coordinates come from Photon (photon.komoot.io, OSM data).
Where an OSM feature for the exact campus/site was not found, city-centre coordinates are used and the
record's `notes` says "coordinates approximate".

Counts: companies 34 (AGO 9, CMR 6, COG 9, GAB 6, GNQ 4) · training 17 (AGO 5, CMR 5, COG 1, GAB 4, GNQ 2)
· R&D 6 (AGO 2, CMR 2, COG 0, GAB 2, GNQ 0).

---

### AGO — Angola

#### Companies (9)
- Sonangol E.P. — history (Decreto-lei 52/76): https://www.sonangol.co.ao/breve-historial/ ; structure: https://www.sonangol.co.ao/estrutura/ ; homepage (business units incl. SNL E&P, Distribuição, Gás e Energias Renováveis): https://www.sonangol.co.ao
- ANPG — https://anpg.co.ao/sobre-nos/ (Decreto Presidencial 49/19 de 6 de Fevereiro; address Torres do Carmo, Ingombota)
- IRDP — creation decree DP 133/13: https://lex.ao/docs/presidente-da-republica/2013/decreto-presidencial-n-o-133-13-de-05-de-setembro/ ; statute DP 133/18: https://lex.ao/docs/presidente-da-republica/2018/decreto-presidencial-n-o-133-18-de-18-de-maio/ ; MIREMPET news (6th anniversary, May 2024): https://mirempet.gov.ao/web/noticias/irdp-celebra-6%C2%BA-anivers%C3%A1rio ; official site (maintenance page, address): https://www.irdp.gov.ao
- MIREMPET — https://mirempet.gov.ao
- Refinaria de Luanda — derived from Sonangol history ("57 anos" in 2015); refinariadeluanda.com unreachable; ANGOP on Lobito refinery 2027: https://www.angop.ao/noticias/economia/pca-da-sonangol-garante-arranque-da-refinaria-do-lobito-em-2027/
- Angola LNG — https://www.angolalng.com/about-angola-lng (partners, 5.2 Mt/yr, Soyo); shareholding percentages only via en.wikipedia (Angola_LNG)
- Sonangol HQ address via en.wikipedia (Sonangol_Group) — not verified on official site.

#### Training (5)
- INP Sumbe — https://www.inp.gov.ao/quem-somos/historia-instituto (Decreto 84/83 de 15 de Setembro); homepage/courses: https://www.inp.gov.ao
- ISPTEC — https://www.isptec.co.ao ; pt.wikipedia (Instituto_Superior_Politécnico_de_Tecnologias_e_Ciências) for the 2005 origin / Decreto Executivo 111/11
- Universidade Agostinho Neto — https://www.uan.ao ; pt.wikipedia (Universidade_Agostinho_Neto) for 1962 and Engenharia de Petróleo
- Academia Sonangol — https://www.sonangol.co.ao/academia-sonangol-promove-seminario-sobre-lideranca/
- UCAN — https://www.ucan.co.ao/

#### R&D (2)
- CNIC — https://www.cnic.gov.ao
- UAN Centro de Ciências da Terra e Sustentabilidade — https://www.uan.ao (name only)

Caveats: Universidade Óscar Ribas omitted (uor.ed.ao unreachable; no primary source). Sonagás creation year not found. ISPTEC's research centre (CICSA) is social-science oriented, so not listed as hydrocarbon R&D.

---

### CMR — Cameroon

#### Companies (6)
- SNH — https://www.snh.cm/histoire/ (12 March 1980; decrees 17 Jan 2008 and 9 July 2019); portfolio (12 companies): https://www.snh.cm/organisation/portefeuille-snh/ ; homepage (Rue Dragages, partners Tradex/Hydrac/Chanas): https://www.snh.cm
- SONARA — official site (contact only): https://www.sonara-cm.cm/ ; founding 1973, capacity 2.2 Mt/yr, shareholding, 2019 fire & reconstruction status: https://fr.wikipedia.org/wiki/Sonara (Wikipedia-only → low confidence on those figures). www.sonara.cm does not resolve.
- SCDP — https://www.scdp.cm (1 July 1979; Carrefour Agip, Douala)
- CSPH — https://www.csph.cm/presentation.php (décret 74/458 du 10 mai 1974; 98/165; 2019/032); contact: https://www.csph.cm
- Tradex — https://tradexsa.co/ (founded 1999 by SNH; Bonanjo, Douala)
- Hydrac — listed by SNH; site https://www.hydrac-sa.cm unreachable

#### Training (5)
- University of Buea, Dept. of Chemical and Petroleum Engineering — https://www.ubuea.cm/index.php/faculties-schools/faculty-of-engineering-and-technology-fet/chemical-and-petroleum-engineering-cpe/ ; homepage: https://www.ubuea.cm
- ENSP Yaoundé — https://www.polytechnique.cm (1971)
- Université de Douala — SNH education page (geosciences lab, Pétromines): https://www.snh.cm/education/ ; univ-douala.cm suspended; fr.wikipedia (Université_de_Douala) for decree 93/030
- ENSMIP Kaélé (Université de Maroua) — https://www.snh.cm/education/ ; fr.wikipedia (Université_de_Maroua) for Décret 2022/011; univ-maroua.cm serves only webmail
- EGEM Meiganga (Université de Ngaoundéré) — https://www.snh.cm/education/ ; univ-ndere.cm unreachable

#### R&D (2)
- IRGM — https://irgm-cameroun.org/presentation/cadre-juridique-et-institutionnel (décret 79/495 du 4 déc. 1979; MINRESI; Rue Mgr Vogt)
- SNH–Schlumberger petroleum-geosciences laboratory at Université de Douala — https://www.snh.cm/education/

Caveats: IUC (myiuc.com) and ISTDI (istdi.net) could not be verified (sites down) — omitted. SNH has no separate training institute (training is an SNH mission since 1980). MINRESI site unreachable.

---

### COG — Republic of Congo

#### Companies (9)
- SNPC — https://www.snpc-group.com/Presentation_a99.html ; contacts (Tour SNPC, Bd Denis Sassou-Nguesso, BP 188): https://www.snpc-group.com/Nous-contacter_a58.html ; homepage ("26 ans", six subsidiaries): https://www.snpc-group.com ; creation date 23 April 1998: https://fr.wikipedia.org/wiki/Société_nationale_des_pétroles_du_Congo
- CORAF — https://www.snpc-group.com/CORAF_a29.html (31 Jan 1981) ; https://www.coraf.cg (1,000,000 t/yr; BP 755 Pointe-Noire; 40th anniversary Dec 2022)
- SNPC Distribution — https://www.snpc-group.com/SNPC-DISTRIBUTION_a132.html (27 Sept 2011)
- SONAREP — https://www.snpc-group.com/SONAREP_a26.html (23 Jan 2002)
- SFP — https://www.snpc-group.com/SFP_a27.html (10 Feb 2010)
- ILOGS — https://www.snpc-group.com/ILOGS_a28.html
- SNPC Trading — https://www.snpc-group.com/SNPC-TRADING_a110.html
- Ministère des Hydrocarbures — https://www.hydrocarbures.gouv.cg (four DGs; Immeuble Mines et Énergie, BP 2120)
- Hydro-Congo (dissolved 2002) — https://fr.wikipedia.org/wiki/Hydro-Congo (low)

#### Training (1)
- Université Marien Ngouabi (ENSP master in petroleum engineering with Total E&P Congo; FST) — https://www.umng.cg/?q=en/node/250 ; homepage: https://www.umng.cg ; fr.wikipedia (Université_Marien-Ngouabi) for 1971

#### R&D (0)
No verifiable hydrocarbon R&D centre found: no SNPC/CORAF laboratory page exists on the group site, no "Centre de Recherches Géologiques et Minières" located, and UMNG's "Labs & Research Team" pages do not name a petroleum-specific laboratory. Output is empty for COG.

Caveats: "Institut du Pétrole et de l'Énergie", "Institut Pétrolier et Gazier", "ITC" and an SNPC training centre could not be sourced — omitted. Ministry site mentions the Université Catholique du Congo (Faculty of Sciences and Technologies, 2024) without hydrocarbon detail — not listed.

---

### GAB — Gabon

#### Companies (6)
- Ministère du Pétrole et du Gaz — agences sous tutelle (GOC, SGEPP, SOGARA, Pizolub): https://minpetrole.ga/agences-sous-tutelles/ ; SGEPP mission page: https://minpetrole.ga/2025/04/01/agence-sous-tutelle-2-2/ ; homepage: https://minpetrole.ga/ . Legacy site petrole.gouv.ga (DGH pages) unreachable.
- Gabon Oil Company — decree 1017/PR/MMPH of 24 Aug 2011: https://fr.wikipedia.org/wiki/Gabon_Oil_Company ; HQ/website: https://en.wikipedia.org/wiki/Gabon_Oil_Company ; gabonoil.com unreachable
- Gabon Oil Marketing — https://www.union.sonapresse.com/fr/secteur-des-hydrocarbures-gabon-oil-marketing-gom-commercialiser-des-produits-petroliers-finis (state daily; low)
- SOGARA — ministry tutelle page; https://fr.wikipedia.org/wiki/Société_gabonaise_de_raffinage (1964 as SER; shareholding) ; sogara.info expired
- SGEPP — https://sgepp.com (Cloudflare error 1001 / TLS failure — kept URL)
- Pizolub — ministry tutelle page only

#### Training (4)
- INPG Port-Gentil — https://minpetrole.ga/la-formation/
- USTM Franceville — https://minpetrole.ga/la-formation/ ; https://fr.wikipedia.org/wiki/Université_des_sciences_et_techniques_de_Masuku (law of 29 Jan 1986; site www.univ-masuku.ga unreachable)
- E3MG Moanda — https://www.e3mg.ga/histoire ; programmes: https://www.e3mg.ga/filiere-formation
- Université Omar Bongo — https://fr.wikipedia.org/wiki/Université_Omar-Bongo (low; no hydrocarbon programme)

#### R&D (2)
- CENAREST — https://cenarest-gabon.org/ (five institutes; BP 842 Libreville)
- E3MG laboratories — https://www.e3mg.ga/lab-genie-procede ; https://www.e3mg.ga/lab-geoscience

Caveats: "École Nationale Supérieure d'Ingénieurs de Libreville" not found — omitted. GOC laboratories and USTM research units not sourced. IPG creation year (brief suggested 2012) not confirmed.

---

### GNQ — Equatorial Guinea

#### Companies (4)
- Sonagas G.E. — https://www.sonagas-ge.com/sobre (founded 2005) ; homepage (Autopista Malabo II): https://www.sonagas-ge.com
- GEPetrol — https://en.wikipedia.org/wiki/GEPetrol (low); creation decree PDF on minhacienda-gob.com returned 404; gepetrol.gq offline; gepetrol.com for sale; subsidiary claim on https://www.gepoil.net/about_us.html (unofficial)
- MHDM — https://mhdm.gob.gq/es (retrieved via curl; TLS certificate invalid for WebFetch)
- EG LNG — https://eglng.com/en/about/shareholders (ConocoPhillips, Sonagas G.E., Marubeni)

#### Training (2)
- UNGE — https://ungecampus.com/ ; https://es.wikipedia.org/wiki/Universidad_Nacional_de_Guinea_Ecuatorial (Ley 12/1995)
- AAUCA — https://aaucauniversity.com/ ; https://en.wikipedia.org/wiki/Afro-American_University_of_Central_Africa (2015; coordinates)

#### R&D (0)
No verifiable R&D centre: UNGE only lists a "Dirección de Investigación Científica" administrative unit; the MHDM site mentions scholarships and a training agreement with BANGE Business School but no laboratory. Output is empty for GNQ.

Caveats: "Instituto Tecnológico Nacional de Hidrocarburos de Guinea Ecuatorial (ITNHGE)" and "Universidad Africana de Guinea Ecuatorial" could not be located in any official source — omitted.

---

### APPO Forum of Directors of Oil & Gas Training Institutes
- Launched 21–22 June 2023 at the Institut Algérien du Pétrole, Skikda: https://apposecretariat.org/the-forum-of-directors-of-training-institutes-in-the-oil-and-gas-industry-of-appo-member-countries/ ; explainer (13 May 2024): https://apposecretariat.org/what-you-need-to-know-about-the-appo-forum-of-directors-of-oil-and-gas-training-institutes-ce-que-vous-devez-savoir-sur-le-forum-des-directeurs-dinstituts-de-formation-dans-le-secteur-petrolier-e/ ; 4th Forum, Tripoli, 16–18 June 2026: https://apposecretariat.org/speech-by-h-e-farid-ghezali-at-the-opening-of-the-4th-forum-of-appo-training-institutes/
- None of these pages publishes a roster of member institutes, so no training record is tagged as a Forum member.

### Group 4 — DR Congo, Côte d'Ivoire, Senegal, Benin, Niger, Chad, Namibia

## G4 research – sources, counts and caveats

Countries: COD, CIV, SEN, BEN, NER, TCD, NAM. Research date: 2026-09-04.

### Method and global caveats

- The session's WebSearch budget was exhausted before this task started, so research relied exclusively on direct fetches of official sites (company, ministry, university, EITI/ITIE) plus curl probes to verify URL reachability. No blogs or Wikipedia were used.
- Many official hosts in the region did not resolve or refused connections from this environment (listed per country). Where a site is unreachable the URL is kept in the record and flagged in `notes`.
- Founding years that could not be read on a primary source are either `null` or given with confidence `low`/`medium` and an explicit note ("institutional history, not confirmed on a primary source in this session").
- Coordinates: Nominatim (OpenStreetMap) was used with the `AIEM-research` User-Agent; after ~20 queries the service returned HTTP 429 for every further call. Records geocoded successfully: NAMCOR/Petroleum House, NUST, UNAM, NamPower, PETROCI Plateau, Yopougon, Vridi (SIR, GESTOCI), INP-HB, UFHB, Immeuble SCIAM, SAR/Mbao, RGS/Ngor, ESP, UCAD, UGB, EPT. All other records use city-centre (or commune-centre) coordinates and say "coordinates approximate" in `notes`.
- Counts: companies 28, training 24, R&D 9.

### COD – DR Congo (companies 3, training 3, R&D 1)

Sources
- SONAHYDROC SA – https://www.sonahydroc.cd (creation decree-law 245 of 9 Aug 1999 as COHYDRO; SONAHYDROC name effective 7 Nov 2016 under Law 15/012; 36.6% of SEP-CONGO; HQ 1 av. Comité Urbain, Gombe)
- SEP Congo – https://sepcongo.com/mission/ and https://sepcongo.com/mission/historique/ (Petrocongo 1910; SEP Congo 1997; SA 2014; "capital majoritaire privé"; 4 labs; HQ 1 av. des Pétroles)
- EITI – DRC – https://eiti.org/countries/democratic-republic-congo (Ministry of Hydrocarbons role; hydrocarbons law)
- ITIE-RDC – https://www.itierdc.net (link to ministry https://hydrocarbures.gouv.cd/fr/)
- Université de Kinshasa – https://www.unikin.ac.cd (13 faculties incl. "Pétrole, gaz et énergies renouvelables")
- Université de Lubumbashi – https://www.unilu.ac.cd (faculties Polytechnique, Sciences; route de Kasapa)
- ISTA Kinshasa – https://site.ista.myeduc.space/ (redirect from ista.ac.cd)

Caveats
- The brief said SONAHYDROC was renamed in 2019; the company site says 2016.
- The brief described SEP Congo as state-majority; the company itself says private-majority capital (SONAHYDROC 36.6%). Full cap table not published.
- No hydrocarbons regulatory authority ("ARH") could be verified; the ministry is recorded as regulator. hydrocarbures.gouv.cd sits behind a browser-verification page.
- CRGM (crgm.cd) resolves but times out; kept at low confidence. CREN-K (nuclear) excluded. No "Institut National du Pétrole et du Gaz" verified for DRC.

### CIV – Côte d'Ivoire (companies 5, training 3, R&D 1)

Sources
- PETROCI – https://www.petroci.ci, https://www.petroci.ci/historique/, https://www.petroci.ci/car/ (1975; 1997 split / 2000 reunification; SMB March 1976; GESTOCI Sept 1983; CAR created 1986, Yopougon)
- SIR – https://www.sir.ci and https://www.sir.ci/societe/ (3 Oct 1962; PETROCI 45.74%, Sahara 27.33%, Sonangol 20%, Burkina Faso 5.39%, Côte d'Ivoire 1.54%)
- GESTOCI – https://www.gestoci.ci (decree 83-1009 of 14 Sept 1983; Bd de Vridi; ISO 9001/14001/45001)
- SMB – https://smb.ci (1976; inside SIR refinery at Vridi; BRVM since 1995)
- Ministère des Mines, du Pétrole et de l'Énergie – https://energie.gouv.ci (DGH; address Immeuble SCIAM, BP V 50 Abidjan); DGH portal http://dgh.energie.gouv.ci (TLS mismatch), https://dgh.ci
- EITI – Côte d'Ivoire – https://eiti.org/countries/cote-divoire (PETROCI Holding, PETROCI CI-11, DGH role)
- INP-HB – https://inphb.edu.ci/nos-ecoles/, https://inphb.edu.ci/nos-ecoles/escpe/ (ESCPE 2019, ex-ESPE), https://inphb.edu.ci/nos-ecoles/esmg/ (ESMG 1973)
- Université Félix Houphouët-Boigny – https://univ-fhb.edu.ci (blocks automated readers; read via curl)

Caveats
- PETROCI's current stake in SMB not published. SIR capacity not given on the site.
- CI-Energies excluded (electricity). No "INSTM" or SIR training centre could be verified. UFHB's UFR STRM is listed from institutional knowledge (site content not readable).
- INP-HB founding year 1996 is institutional history (site only mentions 2023 statutes).

### SEN – Senegal (companies 8, training 6, R&D 1)

Sources
- SAR – https://www.sar.sn/fr/ (1961; start 31 Oct 1963; 1.5 Mt/yr; SAR 2 = 5.5 Mt/yr; Mbao km 18 route de Rufisque; ISO 17025 lab)
- COS-PETROGAZ – https://www.cospetrogaz.sn (decree 2016-1542 of 3 Oct 2016; 18 bd de la République)
- RGS – https://rgs.sn (created 2019; State majority with PETROSEN, SENELEC, FONSIS, APIX; Ngor-Almadies)
- SENSTOCK – https://senstock.sn (2008 SNH+PETROSEN, SPP joined 2010; Mbao)
- EITI – Senegal – https://eiti.org/countries/senegal (PETROSEN as SOE; ministry role)
- ESP – https://esp.sn (1964; Corniche Ouest, BP 5085 Dakar-Fann)
- UCAD – https://ucad.sn ; UGB – https://www.ugb.sn (1990; IPSL–TotalEnergies 2025)

Unreachable / broken
- petrosen.sn (connection refused), inpg.sn (connection refused), energie.gouv.sn (PHP fatal error), ist.ucad.sn (serves CESTI content), ept.sn (empty directory), uam.sn / uam.edu.sn (no DNS), cerer.ucad.sn (no DNS), itie.sn (TLS chain error).

Caveats
- PETROSEN Holding / E&P / Trading & Services: 1981 creation and 2020 restructuring not confirmed on a primary page (medium/low confidence).
- RGS: brief said 2020, site says 2019.
- No "Comité National des Hydrocarbures" verified. "Senstock" verified as PETROSEN-linked storage company (state share unpublished).
- INPG recorded in training (founded 2018, medium) – site unreachable. ITA excluded (food technology). PETROSEN data centre and INPG research not verifiable → not recorded in R&D; CERER kept at low confidence (renewables, not hydrocarbons).

### BEN – Benin (companies 3, training 2, R&D 1)

Sources
- Gouvernement du Bénin – Ministères – https://www.gouv.bj/ministeres/ (MEEM, site eau-mines.gouv.bj)
- Université d'Abomey-Calavi – https://www.uac.bj ; UNSTIM – https://unstim.bj (Abomey, BP 486)

Unreachable
- eau-mines.gouv.bj (HTTP 503, Retry-After 3600), epac.uac.bj (TLS mismatch, empty body), sonacop.bj / sobegaz.bj / obrgm.bj / cbrsi.bj (no DNS).

Caveats
- SONACOP (1974) and SoBeGaz could not be verified on a primary source; both recorded at low confidence, SoBeGaz with founded null. Current operational status of SONACOP should be re-checked.
- No verifiable hydrocarbon R&D centre: OBRGM (geology) recorded at low confidence; CBRSI excluded (not energy). SBEE excluded (electricity). "IFAG" not identified.

### NER – Niger (companies 3, training 3, R&D 1)

Sources
- ITIE Niger – https://itieniger.ne and https://itieniger.ne/sonidep/ (Ordinance 77-01 of 20 Jan 1977; capital CFAF 10 bn; 2020 upstream mandate; PSCs R5/R6/R7/Bilma March 2024; ministry link http://www.petrole.gouv.ne)
- EITI – Niger – https://eiti.org/countries/niger (Petroleum Code; ministry role)
- Université Abdou Moumouni – https://www.uam.edu.ne (1971/1973/1992; FAST; doctoral schools; Rive droite/Harobanda)
- EMIG – https://emig-niger.org (13 Sept 1982 CEAO; operational 1990; Law 2004-019; 7 departments; China University of Petroleum partnership)

Unreachable
- sonidep.ne, soraz.ne, petrole.gouv.ne (no DNS); univ-agadez.ne (no DNS); cnes.ne (no DNS).

Caveats
- SORAZ recorded at low confidence (2008 JV, CNPC 60/Niger 40, start Nov 2011) – no primary page found.
- "SONIHY" could not be verified and was not recorded. WAPCO Niger is a CNPC subsidiary (private) and is noted here only, not as a state company.
- Université d'Agadez recorded at low confidence (no site). No "Institut de Formation aux Métiers du Pétrole" identified. CNES recorded at low confidence (solar, not hydrocarbons).

### TCD – Chad (companies 4, training 3, R&D 1)

Sources
- ARSAT – https://arsat.td and https://arsat.td/a-propos/ (Ordinance 005/PR/2012 of 7 Feb 2012; EPA; Sabangali, BP 2695)
- EITI – Chad – https://eiti.org/countries/chad (SHT as material SOE; 10% CNPCI stake 2014; Djermaya refinery SRN; Ministry of Petroleum, Mines and Energy)
- INSTA – https://insta.td/presentation.php (1997; public establishment; 10 departments incl. génie énergétique, énergies renouvelables)

Unreachable
- sht.td and variants (no DNS), petrole.gouv.td (parked hosting page), univ-ndjamena.org (empty/404), cnrd.td (hosting placeholder), inspm.td (no DNS), itie-tchad.org (no DNS).

Caveats
- SHT founding year 2006 and SRN (2011 start; CNPC 60/SHT 40) are institutional history, not confirmed on a primary page (medium/low).
- TOTCO/COTCO noted in the ministry record; not recorded as separate entities.
- INSPM Mao recorded at low confidence with status unknown. INSTA = former IUSTA (same institution). Université de N'Djamena founding not verified.
- CNRD kept at low confidence with status unknown (domain shows only a hosting placeholder).

### NAM – Namibia (companies 2, training 4, R&D 3)

Sources
- NAMCOR – https://www.namcor.com.na, https://www.namcor.com.na/overview/ (Companies Act 28 of 2004; mandate from Petroleum (E&P) Act 1991; sole shareholder Government; NOSF Walvis Bay), https://www.namcor.com.na/national-legal-frame-work/ (Acts; Commissioner for Petroleum Affairs), https://www.namcor.com.na/petroleum-data-centre/ (national repository; Petroleum House, 1 Aviation Road; GIS portal)
- NUST – https://www.nust.na (1994 Polytechnic / 2015 NUST; 13 Jackson Kaujeua St; Mining and Process Engineering; NEI)
- Namibia Energy Institute – https://nei.nust.na (17 Brahm Street; oil & gas centre)
- UNAM – https://www.unam.edu.na (Faculty of Agriculture, Engineering & Natural Sciences; School of Engineering)
- NamPower – https://www.nampower.com.na (checked; no Kudu mention → excluded)

Unreachable
- mme.gov.na (no DNS via 8.8.8.8/1.1.1.1), petrofund.org.na (no DNS), nimt.edu.na → nimtnam.com (expired certificate, legacy page).

Caveats
- NAMCOR founding year 1991 is inferred from the Act cited on its site; no incorporation date published. Upstream/Downstream are business units; no separate "NAMCOR Petroleum Trading" or "NAMCOR E&P" legal subsidiaries verified.
- Namibia Petroleum Fund not verified. PETROFUND (a fund, reported 1993) and NIMT (reported 1991) recorded at low confidence in training.
- Geological Survey of Namibia recorded via the NAMCOR PDC page (medium); MME site unreachable.
