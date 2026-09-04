# Campagne de collecte de données AIEM — septembre 2026

Données institutionnelles 2021–2025 pour les 18 États membres de l'APPO, importées en production le 4 septembre 2026.

- `*.json` — enregistrements recherchés, chacun avec `source` (nom, URL, page/table, date de publication), `confidence` (high/medium/low) et `notes`.
- `*.md` — sources consultées, matrices de couverture, conversions d'unités, désaccords entre sources, limites.
- `aliases.json` — correspondances manuelles nom recherché → nom en base (pipelines, bassins) pour éviter les doublons.
- `sources_block.json` — bloc « Sources » fr/en de la Vue Générale (table ContentBlock).
- `logs/` — journaux d'application : chaque insertion/mise à jour avec sa provenance (le schéma n'a pas de colonne source).
- `scripts/` — importeurs (`--apply` pour écrire, simulation par défaut) et réconciliation.
- `dossier-de-revue.html` — dossier de revue soumis avant import.

Backups pré-import : `~/backups/aiem/aiem-prod-preimport-20260904-075822.db` (local) et `/home/ubuntu/backups/aiem/` (serveur).
Seuil appliqué : confiance ≥ medium ; lignes « low » non importées (listées dans les logs, section `skipped`).
