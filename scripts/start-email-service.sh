#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start-email-service.sh
# Démarre le service Python email (Flask/STARTTLS) et attend qu'il soit prêt.
# Tué automatiquement quand le processus parent (Next.js) se termine.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$SCRIPT_DIR/../email-service"
VENV="$SERVICE_DIR/venv"
PORT="${EMAIL_SERVICE_PORT:-5001}"
MAX_WAIT=15   # secondes d'attente max avant d'abandonner

# ── 1. Vérifier / créer le virtualenv ────────────────────────────────────────
if [ ! -f "$VENV/bin/python" ]; then
  echo "[email-service] Création du virtualenv…"
  python3 -m venv "$VENV"
fi

# ── 2. Installer les dépendances si nécessaire ────────────────────────────────
if ! "$VENV/bin/pip" show flask &>/dev/null; then
  echo "[email-service] Installation des dépendances Python…"
  "$VENV/bin/pip" install -r "$SERVICE_DIR/requirements.txt" -q
fi

# ── 3. Démarrer Flask en arrière-plan ────────────────────────────────────────
echo "[email-service] Démarrage sur le port ${PORT}…"
PORT="$PORT" "$VENV/bin/python" "$SERVICE_DIR/app.py" &
EMAIL_SERVICE_PID=$!

# ── 4. Arrêter le service email quand ce script se termine ───────────────────
cleanup() {
  if kill -0 "$EMAIL_SERVICE_PID" 2>/dev/null; then
    echo "[email-service] Arrêt (PID $EMAIL_SERVICE_PID)…"
    kill "$EMAIL_SERVICE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# ── 5. Attendre que le service soit prêt ─────────────────────────────────────
elapsed=0
until curl -sf "http://localhost:$PORT/health" &>/dev/null; do
  if [ $elapsed -ge $MAX_WAIT ]; then
    echo "[email-service] ERREUR : le service n'a pas démarré en ${MAX_WAIT}s" >&2
    exit 1
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

echo "[email-service] ✓ Prêt sur http://localhost:$PORT"

# ── 6. Garder le script en vie (il sera tué par le trap à la fin de Next.js) ─
wait "$EMAIL_SERVICE_PID"
