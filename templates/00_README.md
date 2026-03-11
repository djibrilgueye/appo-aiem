# AIEM — Modèles de collecte de données
## Guide d'utilisation

Ce dossier contient les **11 fichiers CSV** de collecte de données correspondant à toutes les thématiques de la plateforme AIEM.

---

## Liste des fichiers

| Fichier | Thématique | Source de référence |
|---------|-----------|---------------------|
| `01_COUNTRIES.csv` | Pays africains (liste de référence) | APPO / UN M49 |
| `02_RESERVES.csv` | Réserves prouvées pétrole & gaz | OPEC ASB — Energy Institute SRoWE |
| `03_PRODUCTION.csv` | Production pétrole & gaz | IEA WBES — OPEC MOMR |
| `04_BASINS_FIELDS.csv` | Bassins sédimentaires & champs | USGS WPA — AAPG/CGG Robertson |
| `05_REFINERIES.csv` | Raffineries | OGJ Refining Survey — ARDA |
| `06_PIPELINES.csv` | Pipelines (tracés & statuts) | Global Energy Monitor |
| `07_TRAINING_INSTITUTES.csv` | Instituts de formation pétrolière | APPO Forum Directors |
| `08_RND_CENTERS.csv` | Centres de R&D | NOCs — Publications officielles |
| `09_STORAGE_FACILITIES.csv` | Terminaux & stockages | GIIGNL — GEM Gas Infrastructure |
| `10_PETROCHEMICALS.csv` | Complexes pétrochimiques | GlobalData / Offshore Technology |
| `11_IMPORTS_EXPORTS.csv` | Importations & exportations | IEA World Energy Balances |

---

## Règles générales

1. **Encodage** : UTF-8 avec BOM (les fichiers sont préconfigurés ainsi)
2. **Séparateur décimal** : point `.` (jamais la virgule)
3. **Séparateur CSV** : virgule `,`
4. **Valeur inconnue** : laisser la cellule **vide** (ne pas écrire 0 sauf si c'est réellement zéro)
5. **Commentaires** : les lignes commençant par `#` sont ignorées à l'import
6. **Coordonnées GPS** : format décimal, point comme séparateur (ex. `-33.94` pas `-33°56'`)
7. **Codes pays** : toujours utiliser l'ISO 3166-1 alpha-3 (3 lettres majuscules)

---

## Codes pays de référence

| Code | Pays | Région | Membre APPO |
|------|------|--------|-------------|
| DZA | Algeria | North Africa | ✅ |
| EGY | Egypt | North Africa | ✅ |
| LBY | Libya | North Africa | ✅ |
| TUN | Tunisia | North Africa | ❌ |
| MAR | Morocco | North Africa | ❌ |
| NGA | Nigeria | West Africa | ✅ |
| GHA | Ghana | West Africa | ❌ |
| CIV | Ivory Coast | West Africa | ✅ |
| SEN | Senegal | West Africa | ✅ |
| NER | Niger | West Africa | ✅ |
| BEN | Benin | West Africa | ✅ |
| TGO | Togo | West Africa | ✅ |
| AGO | Angola | Central Africa | ✅ |
| COG | Congo | Central Africa | ✅ |
| COD | DR Congo | Central Africa | ✅ |
| GAB | Gabon | Central Africa | ✅ |
| GNQ | Equatorial Guinea | Central Africa | ✅ |
| TCD | Chad | Central Africa | ✅ |
| CMR | Cameroon | Central Africa | ✅ |
| SDN | Sudan | East Africa | ✅ |
| SSD | South Sudan | East Africa | ✅ |
| KEN | Kenya | East Africa | ❌ |
| TZA | Tanzania | East Africa | ❌ |
| UGA | Uganda | East Africa | ❌ |
| MOZ | Mozambique | East Africa | ❌ |
| ZAF | South Africa | Southern Africa | ✅ |
| NAM | Namibia | Southern Africa | ❌ |

---

## Unités de mesure

| Grandeur | Unité | Champ CSV |
|----------|-------|-----------|
| Réserves pétrole | Milliards de barils (Gbbl) | `oil_gbbl` |
| Réserves gaz | Trillions de pieds cubes (Tcf) | `gas_tcf` |
| Production pétrole | Kilobarils par jour (kb/d) | `oil_kbd` |
| Production gaz | Millions de m³/an (M m³/yr) | `gas_mm3yr` |
| Capacité raffinerie | Kilobarils par jour (kb/d) | `capacity_kbd` |
| Longueur pipeline | Kilomètres (km) | `length_km` |
| Capacité stockage | Millions de barils (Mb) | `capacity_mb` |
| Importations/Exportations gaz | Milliards de m³/an (bcm/yr) | `gas_bcm` |
| Capacité pétrochimie | Milliers de tonnes/an (kt/yr) | `capacity` |

---

## Statuts autorisés

### Raffineries (`status`)
- `operational` — en exploitation
- `under construction` — en cours de construction
- `proposed` — projeté / en étude
- `idle` — à l'arrêt temporaire
- `decommissioned` — déclassée / fermée

### Pipelines (`status`)
- `operational` — opérationnel
- `under construction` — en construction
- `proposed` — proposé / en étude
- `offline` — hors service / suspendu
- `concept` — concept / préfaisabilité

### Instituts de formation (`type`)
- `Technical` — formation technique
- `Academic` — académique / universitaire
- `Corporate` — formation d'entreprise
- `Research/Training` — recherche et formation combinées

### Types de stockage (`type`)
- `Crude Oil` — pétrole brut
- `LNG` — gaz naturel liquéfié
- `Products` — produits pétroliers raffinés
- `LPG` — gaz de pétrole liquéfié
- `Strategic Reserve` — réserve stratégique

### Types de bassin (`type`)
- `Oil` — bassin pétrolier
- `Gas` — bassin gazier
- `Oil & Gas` — pétrole et gaz

---

## Procédure d'intégration

Une fois les fichiers CSV complétés et validés :

1. Placer les fichiers dans le dossier `/data/` du serveur (ou transmettre à l'équipe technique)
2. L'équipe technique intègre les données via le script de seed : `POST /api/seed`
3. Vérifier les données sur la plateforme après import
4. En cas d'erreur, corriger le CSV et relancer le seed (les upserts sont idempotents)

---

*AIEM — Africa Interactive Energy Map | APPO © 2026*
