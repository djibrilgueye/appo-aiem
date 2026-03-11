#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh  —  Lance le service email puis Next.js (mode développement).
# Ctrl-C arrête les deux processus proprement.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
PORT="${PORT:-3333}"
EMAIL_SERVICE_PORT="${EMAIL_SERVICE_PORT:-5001}"

export EMAIL_SERVICE_PORT

# ── Démarrer le service email en arrière-plan ─────────────────────────────────
bash "$SCRIPT_DIR/start-email-service.sh" &
EMAIL_SCRIPT_PID=$!

# ── Arrêt propre de tout quand on quitte ─────────────────────────────────────
cleanup() {
  echo ""
  echo "[aiem] Arrêt des services…"
  kill "$EMAIL_SCRIPT_PID" 2>/dev/null || true
  wait "$EMAIL_SCRIPT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── Attendre que le service email soit prêt ───────────────────────────────────
MAX_WAIT=15
elapsed=0
until curl -sf "http://localhost:$EMAIL_SERVICE_PORT/health" &>/dev/null; do
  if [ $elapsed -ge $MAX_WAIT ]; then
    echo "[aiem] ERREUR : le service email n'a pas démarré." >&2
    exit 1
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

# ── Démarrer Next.js ──────────────────────────────────────────────────────────
echo "[aiem] Démarrage de Next.js sur le port ${PORT}…"
cd "$ROOT" && PORT="$PORT" npx next dev
