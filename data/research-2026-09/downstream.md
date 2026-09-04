# AIEM — Downstream infrastructure inventory (APPO 18), status 2024–2025

Deliverables (same directory):

| File | Records | Content |
|---|---|---|
| `refineries.json` | 69 | crude refineries + conversion-only plants (CDU-less) + projects |
| `storage.json` | 92 | 39 crude terminals/FSOs, 16 products depots, 20 LNG export plants/trains, 17 LNG import (FSRU) terminals/projects |
| `petrochem.json` | 52 | gas-based petrochemical & nitrogen-fertiliser plants (+ a few refinery-based units flagged in notes) |

All three files validate with `python3 -m json.tool`. Field names follow the brief exactly; status vocabulary is limited to `operational | under construction | proposed | concept | offline | decommissioned`.

## 1. Counts per country

| ISO3 | Country | Refineries | Crude terminals | Products depots | LNG export | LNG import | Petrochem | Total |
|---|---|---|---|---|---|---|---|---|
| DZA | Algeria | 10 | 3 | 0 | 6 | 0 | 9 | 28 |
| AGO | Angola | 4 | 3 | 0 | 1 | 0 | 1 | 9 |
| BEN | Benin | 1 | 0 | 0 | 0 | 2 | 0 | 3 |
| CMR | Cameroon | 1 | 1 | 6 | 1 | 0 | 0 | 9 |
| TCD | Chad | 1 | 1 | 0 | 0 | 0 | 0 | 2 |
| COD | DR Congo | 1 | 1 | 2 | 0 | 0 | 0 | 4 |
| COG | Rep. Congo | 2 | 1 | 1 | 2 | 0 | 1 | 7 |
| CIV | Côte d'Ivoire | 1 | 0 | 4 | 0 | 1 | 0 | 6 |
| EGY | Egypt | 13 | 6 | 1 | 2 | 6 | 20 | 48 |
| GNQ | Equatorial Guinea | 1 | 0 | 0 | 1 | 0 | 2 | 4 |
| GAB | Gabon | 2 | 2 | 0 | 1 | 0 | 0 | 5 |
| GHA | Ghana | 2 | 0 | 0 | 0 | 1 | 1 | 4 |
| LBY | Libya | 6 | 9 | 0 | 0 | 0 | 4 | 19 |
| NAM | Namibia | 0 | 0 | 1 | 0 | 1 | 0 | 2 |
| NER | Niger | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| NGA | Nigeria | 15 | 5 | 2 | 4 | 0 | 9 | 35 |
| SEN | Senegal | 2 | 0 | 2 | 2 | 1 | 1 | 8 |
| ZAF | South Africa | 6 | 2 | 2 | 0 | 5 | 4 | 19 |
| **Total** | | **69** | **39** | **16** | **20** | **17** | **52** | **213** |

Status mix — refineries: 40 operational, 10 offline, 5 under construction, 7 proposed, 6 concept, 1 decommissioned. Storage: 67 operational, 5 under construction, 8 proposed, 8 concept, 2 offline, 2 decommissioned. Petrochem: 33 operational, 3 under construction, 3 proposed, 6 concept, 6 offline, 1 decommissioned. Confidence across all 213 records: 66 high / 100 medium / 47 low.

## 2. Reference cross-checks made by the coordinator (institutional tables)

**OPEC Annual Statistical Bulletin 2025** (https://www.opec.org/assets/assetdb/asb-2025.pdf), Table 4.1 "Refinery capacity in OPEC Members by company and location" and Table 4.2 "World refinery capacity by country", 1,000 b/cd, 2024 column:

| Country | ASB 2024 (kb/d) | Sites listed by OPEC | Inventory total (operational + offline nameplate) |
|---|---|---|---|
| Algeria | 677 | Skikda 355, Skikda condensate 122, Arzew 87, Algiers 78, Hassi Messaoud 22, Adrar 13 | 677 (RA1Z/RA1G at 81/77 per EIA; OPEC 87/78) |
| Congo | 21 | Pointe-Noire 21 | 21 |
| Gabon | 25 | (Sogara) | 24 (Sogara nameplate per ARDA/operator) |
| Libya | 666 | Ras Lanuf 220, Zawia 120, Tobruk 20, Marsa El-Brega 10, Sarir 10 (+32 kb/d 2024 addition) | 380 (Ras Lanuf 220 coded *offline*) |
| Nigeria | 1,125 | New PH 150, Warri 125, Kaduna 110, old PH 60, Edo 1, Ogbele 11, Ibigwe 5, OPAC 10, Dangote 650, Duport 3 | 1,131.5 (four NNPC sites coded *offline*, 445 kb/d) |
| Egypt | 893 | (Table 4.2 total) | ~831 CDU + conversion-only plants at 0 (see caveats) |
| Angola | 80 | (Table 4.2) | 102 (Luanda 72 per EIA, Cabinda 30 commissioned 2025) |
| South Africa | 210 | (Table 4.2: 520 in 2020 → 210 in 2024, reflecting Enref/Sapref closures) | 208.5 operating (Natref 108.5, Astron 100) + 345 offline/decommissioned + Secunda CTL 160 |
| Equatorial Guinea | na | "does not have refining capacities" (footnote 3) | 0 operating (one concept) |

**GIIGNL Annual Report 2026** (liquefaction-plants table, p. 28+; regasification table) — the coordinator extracted the Africa rows from the PDF (https://www.americaslngsummit.com/media/anfhb5t1/2026-giignl-annual-report.pdf) and they match `storage.json`:
Arzew GL3Z 4.7 mtpa / 320,000 m³ (2014); GL1Z 7.9 / 300,000 (1978); GL2Z 8.2 / 300,000 (1981); Skikda GL1K 4.5 / 150,000 (2013); Angola LNG 5.2 / 320,000 (2013); Kribi Hilli FLNG 2.4 / 125,000 (2018); Congo Tango FLNG 0.6 / 16,100 (2024); Damietta 5.0 / 300,000 (2005); Idku T1+T2 3.6+3.6 / 280,000 (2005); EG LNG 3.7 / 272,000 (2007); GTA Gimi FLNG 2.4 / 126,200 (2025); NLNG T1–T6 3.3+3.3+3.3+4.1+4.1+4.1 = 22.2 / 336,800 (1999–2008). Regas: Ain Sokhna Energos Power 174,000 m³ / 5.7 mtpa (2025), Höegh Galleon 170,000 / 5.7 (2024), Energos Eskimo 160,000 / 5.7 (2025), Damietta Energos Winter 138,000 / 3.4 (2025); Dakar KARMOL 125,000 / 0.5 (2021). GIIGNL 2026 narrative: Nguya FLNG shipped its first cargo in Feb 2026, bringing Congo LNG to 3 mtpa (outside the 2024–25 window; record kept as *under construction*).

## 3. Sources used by the research agents (URLs)

### Refineries — West/Central Africa
- EIA Nigeria CAB (Nov 2025): https://www.eia.gov/international/content/analysis/countries_long/Nigeria/
- NNPC PHRC maintenance shutdown (May 2025): https://nnpcgroup.com/insights/nnpc-ltd-announces-planned-maintenance-shutdown-of-phrc
- Argus, NNPC rehab review (Jul 2025): https://www.argusmedia.com/en/news-and-insights/latest-market-news/2708943-nigeria-s-nnpc-reviewing-refinery-rehabilitation-plans
- OGJ, NNPC rehab/expansion MoU (May 2026): https://www.ogj.com/refining-processing/article/55375885/nnpc-advances-rehab-expansion-plans-for-idled-refineries
- NNPC PH restart/shutdown as quoted: https://www.rigzone.com/news/port_harcourt_refinery_in_nigeria_to_shut_down_for_maintenance-26-may-2025-180634-article/ ; https://www.premiumtimesng.com/business/business-news/796551-maintenance-nnpc-announces-shutdown-of-port-harcourt-refinery.html
- NMDPRA figures as quoted (Kaduna 81 %; new licences): https://nairametrics.com/2025/04/16/kaduna-refinery-hits-81-completion-nmdpra-says/ ; https://www.channelstv.com/2025/03/08/nmdpra-issues-new-refinery-licenses-in-edo-delta-abia/
- Aradel Holdings 2024 annual report (NGX): https://doclib.ngxgroup.com/Financial_NewsDocs/43494_ARADEL_HOLDINGS_PLC-_QUARTER_5_-_FINANCIAL_STATEMENT_FOR_2024_FINANCIAL_STATEMENTS_MARCH_2025.pdf
- OGJ Waltersmith: https://www.ogj.com/refining-processing/refining/operations/article/14188040/waltersmith-commissions-phase-1-of-grassroots-nigerian-refinery
- OGJ Azikel: https://www.ogj.com/refining-processing/refining/construction/article/14199510/azikel-selects-epc-contractor-for-nigerian-modular-refinery
- OGJ Sentuo: https://www.ogj.com/refining-processing/refining/article/14304514/chinese-investor-starts-operations-at-new-refinery-in-ghana ; https://www.sorlgh.com/
- TOR restart (Dec 2025): https://www.myjoyonline.com/tema-oil-refinery-resumes-crude-refining-after-years-of-shutdown/
- ARDA profiles: https://arda.africa/societe-ivoirienne-de-raffinage/ ; https://arda.africa/societe-africaine-de-raffinage-sar/ ; https://arda.africa/societe-gabonaise-de-raffinage-sogara/ ; https://arda.africa/congolaise-de-raffinage-coraf/
- Operators: https://www.sar.sn/ ; https://www.sir.ci/
- Argus Sonara restart target 2027: https://www.argusmedia.com/en/news-and-insights/latest-market-news/2724016-cameroon-targets-partial-refinery-restart-in-2027 ; GEO Sonara: https://globalenergyobservatory.org/geoid/39188
- AidData (Chad Djermaya, Niger Soraz): https://china.aiddata.org/projects/91918 ; https://china.aiddata.org/projects/73319/ ; GEM Soraz: https://www.gem.wiki/Soraz_Zinder_Refinery_power_plant
- Congo Atlantic Petrochemical refinery: https://www.enerdata.net/publications/daily-energy-news/chinese-company-starts-building-25-mtyear-refinery-congo.html ; https://aecweek.com/republic-of-congo-eyes-accelerated-oil-gas-sustainable-projects/
- OGJ Punta Europa refinery project: https://www.ogj.com/refining-processing/refining/article/14183875/equatorial-guinea-advances-punta-europa-refinery-project
- GlobalData profiles (Nelson index only): https://www.offshore-technology.com/marketdata/ogbele-refinery-nigeria/ (and tema-iii, abidjan-i, port-gentil-i, ndjamena)

### Refineries — North/South Africa
- EIA Algeria CAB (Jun 2025, Table 2): https://www.eia.gov/international/content/analysis/countries_long/Algeria/algeria.pdf
- EIA Angola CAB (Feb 2025, Table 3): https://www.eia.gov/international/content/analysis/countries_long/Angola/angola.pdf
- EIA CABs Libya / Egypt / South Africa: https://www.eia.gov/international/analysis/country/LBY ; /EGY ; /ZAF
- Sonatrach refining: https://sonatrach.com/refining-petrochemicals/
- NOC Libya subsidiaries: https://zallaf.com/projects/south-refinery/ ; https://arc.com.ly/ ; https://raslanuf.ly/ ; https://agoco.ly/
- MEES (Libya South refinery, Ras Lanuf): https://www.mees.com/2025/8/1/refining-petrochemicals/financing-challenges-complicate-libyas-south-refinery-development-plans/ ; https://www.mees.com/2022/3/4/news-in-brief/libyas-ras-lanuf-refinery-closer-to-a-return/
- Egypt Ministry of Petroleum refining projects: https://www.petroleum.gov.eg/en/gas-and-petrol/Refining-petrochemical/Pages/Refining-Projects.aspx ; EPROM ASORC: https://eprom.com.eg/portfolio/asorc/
- Egypt Oil & Gas (ministry-sourced): https://egyptoil-gas.com/tag/midor/ ; https://egyptoil-gas.com/tag/anopc/ ; https://egyptoil-gas.com/features/egypts-refineries-a-complete-picture/
- OGJ (ERC, Cabinda, Lobito, Enref): https://www.ogj.com/refining-processing/refining/article/14189543/ ; https://www.ogj.com/refining-processing/refining/article/14187427/ ; https://www.ogj.com/refining-processing/refining/construction/article/14275990/ ; https://www.ogj.com/refining-processing/refining/operations/article/14188559/
- Angola Cabinda start-up: https://www.industrialinfo.com/iirenergy/industry-news/article/angolas-first-new-refinery-in-50-years-starts-production--357743
- South Africa: https://www.moneyweb.co.za/news/companies-and-deals/government-buys-sapref-oil-refinery-in-durban/ ; https://totalenergies.co.za/natref ; https://www.glencore.com/what-we-do/energy/oil ; https://www.engineeringnews.co.za/article/astron-energy-refinery-plays-a-key-role-in-supporting-sa-economy-2025-01-30 ; https://www.argusmedia.com/en/news/2208554-engen-to-convert-durban-refinery-to-import-terminal ; https://www.gem.wiki/Sasol ; https://www.namcor.com.na/
- Coordinates: Global Energy Observatory geoid pages (39192, 39189, 39190, 39191, 42447, 6875, 6874, 6873, 6809, 6338, 6339, 6230, 6229, 6488, 6489, 6252, 6487, 39002, 39124, 39007, 39102, 6345)

### LNG export plants
- GEM (canonical URLs; read via Wayback because gem.wiki returns 403): https://www.gem.wiki/Nigeria_LNG_Terminal ; https://www.gem.wiki/UTM_Offshore_FLNG_Terminal ; https://www.gem.wiki/Arzew-Bethioua_LNG_Terminal ; https://www.gem.wiki/Skikda_LNG_Terminal ; https://www.gem.wiki/Damietta_SEGAS_LNG_Terminal ; https://www.gem.wiki/Egyptian_LNG_Terminal ; https://www.gem.wiki/Angola_LNG_Terminal ; https://www.gem.wiki/Punta_Europa_LNG_Terminal ; https://www.gem.wiki/Greater_Tortue_Ahmeyim_FLNG_Terminal ; https://www.gem.wiki/Congo_FLNG_Terminal ; https://www.gem.wiki/Eni_Congo_FLNG_II_Terminal ; https://www.gem.wiki/Cameroon_FLNG_Terminal ; https://www.gem.wiki/Cap_Lopez_FLNG_Terminal
- GIIGNL Annual Report 2025 (liquefaction table p. 32): https://cdn.prod.website-files.com/67bdb9fc993751711c5f54fd/685278fda1e68e3b4324e2cf_0432365c1c5b8fb129ae8055cca8cb9b_%23GIIGNL%20-%20Livre%202025-20250610-Simple.pdf ; GIIGNL 2024 (p. 36): https://cdn.prod.website-files.com/67bdb9fc993751711c5f54fd/6854051dda46281e5ec60285_GIIGNL%20Annual%20Report%202024.pdf ; GIIGNL 2026 (coordinator cross-check, above)
- NLNG Facts & Figures 2024: https://www.nlng.com/documents/2024_NLNG_FACTS_FIGURESB_compressed.pdf
- Angola LNG: https://www.angolalng.com/operations/plant/ ; Golar fleet/press: https://www.golarlng.com/fleet.aspx ; https://www.golarlng.com/investors/press-releases/2025.aspx ; Perenco Cap Lopez FID: https://www.perenco.com/wp-content/uploads/2024/01/Final-Investment-Decision-for-LNG-production-unit-Gabon.pdf ; EG LNG: https://www.eglng.com/

### LNG import terminals
- GEM (via Wayback): https://www.gem.wiki/Ain_Sokhna_FSRU ; https://www.gem.wiki/Tema_FSRU ; https://www.gem.wiki/Karmol_Dakar_FSRU ; https://www.gem.wiki/Richards_Bay_Transnet_FSRU ; https://www.gem.wiki/Richards_Bay_FSRU ; https://www.gem.wiki/Coega_FSRU ; https://www.gem.wiki/Saldanha_Bay_FSRU ; https://www.gem.wiki/Ivory_Coast_FSRU ; https://www.gem.wiki/Walvis_Bay_LNG_Terminal ; https://www.gem.wiki/Benin_FSRU_Terminal ; https://www.gem.wiki/Cotonou_FSRU
- EIA Today in Energy (Egypt LNG imports, 2025-09-09): https://www.eia.gov/todayinenergy/detail.php?id=66064
- Egypt Ministry of Petroleum (Energos Eskimo): https://www.petroleum.gov.eg/en/media-center/news/news-pages/Pages/mop_25062025_01.aspx ; minister statement via https://egyptoil-gas.com/news/badawi-energos-ceo-review-egypts-expanded-lng-import-infrastructure/
- Höegh / NFE / Energos figures as relayed: https://www.enerdata.net/publications/daily-energy-news/hoegh-lng-signs-agreement-deploy-4-bcmyear-fsru-egypt.html ; https://www.rivieramm.com/news-content-hub/news-content-hub/fsru-energos-eskimo-secures-10-year-egas-charter-83301 ; https://www.offshore-mag.com/vessels/news/55303783/new-fortress-energy-egas-contracts-second-fsru-for-damietta-terminal-offshore-egypt ; https://pgjonline.com/news/2025/may/egypt-secures-10-year-floating-lng-terminal-deal-with-hoegh-evi
- Ghana Tema: https://www.reganosa.com/en/reganosa-to-operate-and-mantain-sub-saharan-africas-first-offshore-lng-receiving-terminal-in-ghana/ ; https://www.heliosinvestment.com/investments/tema-lng-terminal-company ; https://www.industrialinfo.com/news/article/ghanas-tema-lng-import-project-awaits-final-commissioning--316332
- Senegal KARMOL: https://www.lngindustry.com/floating-lng/18062021/karmols-fsru-arrives-in-dakar/ ; https://www.energyintel.com/0000019d-20bb-dedf-a5dd-33fbde560000
- South Africa: https://www.vopak.com/newsroom/news/news-zululand-energy-terminal-signs-agreement-operate-south-africas-first-lng?language_content_entity=en ; https://www.engineeringnews.co.za/article/tnpa-signs-25-year-lng-terminal-agreement-for-port-of-ngqura-2026-05-28
- TotalEnergies (Côte d'Ivoire, Benin): https://totalenergies.com/media/news/press-releases/ivory-coast-total-becomes-operator-lng-terminal-project ; https://totalenergies.com/media/news/press-releases/total-will-develop-lng-market-benin

### Crude terminals — North/South
- SUMED: https://www.sumed.org/?p=facilities ; https://www.sumed.org/?p=history ; https://www.sumed.org/?p=shareholders
- Egypt Maritime Transport Sector port pages (Sidi Kerir, Ain Sokhna, Ras Shukeir, Ras Gharib, Wadi Feiran, Marsa El Hamra): https://www.mts.gov.eg/en/port/…
- EIA Egypt / Libya (current + 2015 archive Table 1) / Algeria / South Africa CABs: https://www.eia.gov/international/analysis/country/EGY ; https://www.eia.gov/international/analysis/country/LBY ; https://www.eia.gov/international/content/analysis/countries_long/Libya/archive/pdf/libya_2015.pdf ; https://www.eia.gov/international/content/analysis/countries_long/Algeria/algeria.pdf ; https://www.eia.gov/international/analysis/country/ZAF
- NGA World Port Index (coordinates): https://msi.nga.mil/Publications/WPI
- Libya operators: https://harouge.com/العمليات/رأس-لانوف ; https://agoco.ly/our-locations-2/ ; https://arc.com.ly/?page_id=3533 ; https://mabrukoil.com/aljurf-project/ ; https://www.eni.com/en-IT/global-presence/africa/libya.html ; https://totalenergies.com/libya ; https://noc.ly/index.php/en/
- Sonatrach pipelines/ports: https://sonatrach.com/en/transport-par-canalisation/
- CEF Integrated Annual Report 2024/25 (Saldanha 45 Mb, SANPC): https://cefgroup.co.za/wp-content/uploads/2025/12/CEF-2025-Final-21-OCT.pdf ; https://cefgroup.co.za/2025/09/25/cef-welcomes-minister-creecys-commitment-to-transformation-and-energy-security-through-durban-island-view-terminal/ ; https://www.sapref.com/ivt-operations

### Crude terminals — West/Central
- GEM pipeline/complex pages (via Wayback): https://www.gem.wiki/Bonny-Port_Harcourt_Refinery_Pipeline ; https://www.gem.wiki/Rapele-Forcados_Oil_Pipeline ; https://www.gem.wiki/Edop-Qua_Iboe_Terminal_Oil_Pipeline ; https://www.gem.wiki/Escravos-Warri-Kaduna_Oil_Pipeline ; https://www.gem.wiki/Ogoda-Brass_Oil_Pipeline ; https://www.gem.wiki/Numbi-Malongo_Oil_Pipeline ; https://www.gem.wiki/Block_3/05_Oil_and_Gas_Complex_(Angola) ; https://www.gem.wiki/Chad%E2%80%93Cameroon_Oil_Pipeline
- EIA Nigeria CAB (Nov 2025): https://www.eia.gov/international/content/analysis/countries_long/Nigeria/Nigeria-2025.pdf ; EIA Angola CAB (Feb 2025)
- Operator releases: https://www.shell.com/news-and-insights/newsroom/news-and-media-releases/2025/shell-completes-sale-of-spdc.html ; https://www.oandoplc.com/press_release/oando-plc-completes-783-million-acquisition-of-enis-subsidiary-nigerian-agip-oil-company-naoc/ ; Maurel & Prom (Seplat/MPNU, Assala, Gamba): https://www.maureletprom.fr/en/documents/download/1745/ ; /1553/ ; /1472/ ; https://www.chevron.com/worldwide/nigeria ; https://angola.chevron.com/who-we-are/our-history-in-angola ; https://totalenergies.cg/terminal-de-djeno-des-activites-multiples-pour-une-energie-meilleure ; https://www.assalaenergy.com/assala-gabon/ ; https://www.savannah-energy.com/operations/hydrocarbons/cameroon/ ; https://www.perenco.com/wp-content/uploads/2024/05/Active-drilling-campaign-offshore-in-DRC.pdf ; https://www.eni.com/en-IT/eni-worldwide/africa/nigeria.html

### Products depots — West Africa
- Pinnacle Oil & Gas: https://pinnacleoilandgas.com/storage-facilities/ ; Dangote: https://www.dangote.com/lq-project/oil-refinery/
- GESTOCI: https://www.gestoci.ci/nos-activites/depots/abidjan-t-p-a-v/ ; https://www.gestoci.ci/nos-activites/depots/yamoussoukro/ ; https://www.gestoci.ci/presentation/ ; SIR: https://www.sir.ci/exploitation/
- Senstock: https://senstock.sn/prestations/ ; SAR: https://www.sar.sn/fr/activites/
- NNPC NPSC: https://nnpcgroup.com/nigerian-pipelines-and-storage-company-npsc ; Ghana Energy Commission statistics: https://www.energycom.gov.gh/index.php/planning/energy-statistics

### Products depots — Central/South/North
- SCDP Cameroon: https://www.scdp.cm/ ; https://scdp.cm/depot-de-la-scdp/ ; https://scdp.cm/terminal-a-hydrocarbures-de-kribi-le-projet-prend-corps-et-forme/
- Vopak: https://www.vopak.com/terminals/vopak-terminal-durban ; https://www.vopak.com/terminals/vopak-terminal-lesedi
- NAMCOR NOSF: https://www.namcor.com.na/national-oil-storage-facility/
- SEP Congo: https://sepcongo.com/le-reseau-sep-congo/ ; https://sepcongo.com/pipeline/ ; https://sepcongo.com/2024/08/16/communique-de-presse-sur-lincendie-survenu-dans-la-concession-ango-ango/
- SNPC Distribution: https://www.snpc-group.com/SNPC-DISTRIBUTION_a132.html ; SCZONE Ain Sokhna port: https://sczone.eg/ports/ain-sokhna-port/

### Petrochemicals
- Nigeria: https://indoramaeleme.com/products-&-services ; https://disclosures.ifc.org/project-detail/SII/47723/indorama-eleme-fertilizer-iii ; https://notore.com/our-businesses/ ; https://fertiliser.dangote.com/ ; https://www.dangote.com/dangotes-2-billion-petrochemical-plant-to-produce-77-grades-of-polypropylene/ ; https://worldoil.com/news/2024/10/11/nigeria-signs-deal-to-supply-gas-to-3-3-billion-methanol-plant/ ; https://nnpcgroup.com/
- Algeria: https://fertiglobe.com/our-business/production-facilities/ ; https://arabfertilizer.org/companies/algerian-omani-fertilizers-company ; https://arabfertilizer.org/companies/sorfert ; https://www.kbr.com/en/insights-news/press-release/kbr-wins-contract-licensing-design-services-two-ammonia-plants-algeria ; https://sonatrach.com/en/refining-petrochemicals/ ; https://www.oilmines.gov.dz/?rubrique=produits-petroliers ; https://www.ogj.com/refining-processing/petrochemicals/article/14295171/sonatrach-lets-contract-for-greenfield-petrochemical-complex
- Egypt: https://abuqir.net/production-facility/abuqir-1/ ; https://arabfertilizer.org/companies/abu-qir-fertilizers-company ; https://arabfertilizer.org/companies/misr-fertilizers-production-company ; https://www.alexfert.com/ ; https://www.hfcegypt.com/?lang=en ; https://orascom.com/projects/kima-fertilizer-plant/ ; https://www.ebrd.com/home/news-and-events/news/2018/ebrd-supports-growth-of-fertiliser-industry-in-egypt.html ; https://www.thyssenkrupp-uhde.com/en/media/press-releases/press-detail/thyssenkrupp-uhde-signs-agreement-with-delta-company-for-fertilizer-and-chemical-industries-to-recommission-an-ammonia-plant-in-dakahlia-egypt-251390 ; https://www.hassanallam.com/projects/ehcs-ammonium-nitrate-plant ; https://www.sidpec.com/PageDetails.aspx?MenuID=54&MenuDID=56 ; https://www.methanex.com/about-us/global-locations/egypt/ ; https://www.echem-eg.com/ ; https://www.elab-eg.com/ ; https://www.estyrenics.com/ ; https://www.meed.com/eppc-selects-uhde-for-port-said-plant/ ; https://egyptoil-gas.com/features/petrochemical-sector-update-ongoing-projects-and-fruitful-results/ ; https://egyptoil-gas.com/features/tahrir-petrochemicals-complex/ ; https://egyptoil-gas.com/news/egyptian-chinese-jv-established-for-first-phase-of-red-sea-petrochemicals-complex-in-ain-sokhna/
- Equatorial Guinea (AMPCO): Marathon Oil 10-K 2023 https://www.sec.gov/Archives/edgar/data/101778/000010177824000023/mro-20231231.htm
- South Africa: https://www.sasol.com/our-businesses ; https://www.safripol.com/
- Angola: https://www.afreximbank.com/afreximbank-and-opaia-group-partner-in-historic-deal-to-construct-fertilizer-plant-in-angola/
- Congo / Ghana: https://www.hydrocarbures.gouv.cg/ ; https://phdc.gov.gh/
- Libya: https://lifeco.com.ly/ ; https://www.yara.com/corporate-releases/yara-sells-lifeco-stake-to-libyas-national-oil-corporation/ ; https://noc.ly/index.php/en/companies
- Senegal (ICS, phosphate — flagged not gas-based): https://www.ics.com.sn/

## 4. Caveats (merged)

### Research-process limits
- **WebSearch budget exhausted.** The session cap (200 calls) was reached early; most agents worked only with direct WebFetch of known institutional URLs. Discovery of smaller/less-documented assets (Nigerian private depots, BOST Ghana, Naftal Algeria, Brega Petroleum Marketing Libya, SONIDEP Niger, SONACOP/Oryx Benin, SGEPP Gabon, SHT Chad, SCLOG Congo, EGPC/PPC/APC Egypt depots) was therefore **not possible** — these are omitted, not disproven. Products-depot coverage is the weakest layer (16 records in 8 countries).
- **Global Energy Monitor wiki returned HTTP 403** (Cloudflare) to every direct fetch, curl and API call. LNG and crude-terminal agents read GEM pages via Wayback Machine snapshots (dates noted in each record's `source.published`/notes); refinery agents found no GEM refinery pages for sub-Saharan sites and used Global Energy Observatory / operator pages instead.
- OPEC ASB 2025 and GIIGNL 2026 were read directly by the coordinator (PDF → text) and used as cross-checks (section 2); GIIGNL 2025/2024 were used by the LNG agent. IGU World LNG Report 2025 could not be fetched (figures cited as relayed by GEM).

### Coordinates
- **Exact (GEM/operator)**: Bonny, Arzew, Skikda, Damietta, Idku, Soyo, Punta Europa LNG; Karmol Dakar, Coega FSRU; refineries with Global Energy Observatory entries (Algeria, Libya main sites, Egypt main sites, Luanda, South African refineries).
- **Approximate** (town / port / pipeline-endpoint centroid; flagged "approx." in notes and confidence lowered): all West/Central African refineries except Sonara and Soraz; all products depots; all Libyan/Egyptian/Algerian crude terminals (NGA World Port Index harbour positions, to the nearest minute); Nigerian/Angolan/Gabonese crude terminals (GEM pipeline endpoints, ± a few km); all petrochemical plants; FLNG units (GTA, Tango/Nguya, Hilli, Cap Lopez, UTM); Tema FSRU (GEM placeholder 5.6667, 0.0). **Libya Farwah FPSO has lat/lon = null** (no institutional coordinate). Snap to satellite imagery before high-zoom display.

### Capacity definitions and known discrepancies
- `capacityKbd` = crude distillation nameplate (b/cd). Conversion-only plants without a CDU (ERC Mostorod 81 kb/d feed hydrocracker, ANOPC Assiut, ANRPC) carry `capacityKbd: 0` with feed capacity in notes to avoid double counting with the CDUs that feed them. Sasol Secunda CTL (160 kb/d fuels-equivalent) is included as a refinery-equivalent and must not be summed with crude capacity. Benin PPP refinery and Gabon–CRBC project have no published capacity (0).
- Source disagreements retained in notes: Arzew 81 (EIA) vs 87 (OPEC), Algiers 77 vs 78; Egypt El-Nasr 80–131, Mostorod 145–161; Luanda 60–72; NLNG 22.0 (operator) vs 22.2 (GIIGNL); GTA 2.4 (GEM/IGU) / 2.5 (bp, GIIGNL 2025) / 2.7 nameplate (Golar); Hilli 2.4 nameplate vs ~1.4 actual; SUMED tankage: operator 3.1 Mm³ Sidi Kerir / 2.9 Mm³ Ain Sukhna (used) vs EIA 20 Mb / 10 Mb.
- `capacityMb` for LNG = thousand m³ of LNG tank storage (GIIGNL); for FLNGs it is the vessel's own cargo storage. Crude/products in million barrels (m³ × 6.2898 / 1e6). Libya crude terminals: all tankage null (no NOC/EIA figure published). Most Nigerian/Angolan/Gabonese crude terminals: tankage null (only port-directory figures exist, not used).
- Nelson complexity indices come from GlobalData profiles (offshore-technology.com), not OGJ; null where unpublished.
- Refinery storage fields (`storageOilMb`, `storageProductsMb`) are populated only where an operator figure was found (SAR 220,000 m³ crude; Cabinda). Dangote's ~4.7 bn-litre tank farm is widely cited but no operator page was retrieved, so it is null in both files.

### Status conventions (idle vs operational)
- **Nigeria NNPC refineries** (old PH 60, new PH 150, Warri 125, Kaduna 110 kb/d) are coded **offline**: old Port Harcourt restarted Nov 2024 at reduced rates and was shut again 24 May 2025 for maintenance (NNPC); Warri ran briefly Dec 2024–Jan 2025; Kaduna 81 % rehabilitated (NMDPRA, Apr 2025); NNPC announced a rehabilitation review (Jul 2025) and rehab/expansion MoUs (May 2026). Both Port Harcourt units are kept as separate records per OPEC ASB.
- **Libya Ras Lanuf refinery** offline (closed since 2013 per EIA) while the Ras Lanuf export terminal operates. **Sonara Limbe** offline since the May 2019 fire (partial restart targeted 2027). **SOCIR Muanda** offline (single source, low confidence). **TOR Ghana** coded operational only because crude runs resumed 19 Dec 2025 (~28 kb/d); it was idle for most of 2024–25. **Sapref** offline (idle since 2022, sold to CEF 2024, now "SANPC Refinery"); **Enref** decommissioned (converted to import terminal); **PetroSA Mossel Bay GTL** offline since 2020.
- **Egypt Damietta/Idku LNG** coded operational per GIIGNL/GEM but were largely idle in 2024–25 (Egypt net importer); utilisation is very low. **Ghana Tema LNG** coded offline (built but no commercial operation through 2025). **KARMOL Dakar FSRU** under construction/commissioning through 2025 (operational by 2026 per Energy Intelligence). **Nguya FLNG** under construction (first cargo Feb 2026, outside window).
- **Cancelled/shelved projects** (Karpowership Richards Bay/Coega/Saldanha, Abidjan CI-GNL, Walvis Bay, Benin/Cotonou FSRUs, NLNG Trains 8–12) are coded **concept** with CANCELLED/SHELVED in notes because the fixed vocabulary has no cancelled value — consider adding one.
- Several 2024–25 statuses rest on a single source and should be re-verified at publication: Chad Djermaya and Niger Soraz run status, Gabon–CRBC refinery, DRC SOCIR, Atlantic Petrochemical Refinery (Congo) start-up, In Amenas topping unit, Fertial/Sasol/LIFECO/RASCO/EBIC/ELAB/E-Styrenics/EPC/WRPC/KRPC capacities, Ertugrul Gazi 2025 deployment in Egypt.

### Scope notes
- Petrochem file includes some **non-gas-based** units for completeness, flagged in notes: Dangote PP (refinery propylene), WRPC/KRPC petrochemical units, ELAB (kerosene), E-Styrenics (imported styrene), Safripol Durban PET, Tahrir/Red Sea (naphtha crackers), ICS Senegal (phosphate). AECI, Omnia, Foskor excluded (purchased ammonia). Gabon (Olam/Tata Port-Gentil urea) and Cameroon (Ferrostaal Kribi) fertiliser concepts lapsed and lacked institutional sources — not listed. No gas-based petrochem found in Benin, Chad, DRC, Niger, Namibia, Côte d'Ivoire, Gabon, Cameroon.
- Namibia has no refinery (NAMCOR lists only the Walvis Bay NOSF). Equatorial Guinea has no refining capacity (OPEC ASB footnote); one concept listed.
- GTA is a shared Mauritania–Senegal asset coded SEN. Luba Freeport (GNQ) and Abidjan/Vridi (CIV) excluded as non-export crude facilities; FPSO offloading points excluded per brief except Kome-Kribi 1, Palanca, Bouri/Sloug and Farwah, which act as fixed export terminals.
- Post-window events noted but not used to change status: Zawiya May 2026 shutdown/restart, Damietta FSRU incident Jul 2026, Ngqura LNG operator agreement May 2026, Cabinda first shipments 2026.
