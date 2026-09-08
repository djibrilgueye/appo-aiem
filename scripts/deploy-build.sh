#!/usr/bin/env bash
# AIEM zero-race deploy (runs ON THE SERVER, installed at /home/ubuntu/aiem-app/deploy-build.sh).
#
# Builds in a sibling directory so the live pm2 process keeps serving the
# previous build during the ~50 s compile, then swaps .next atomically and
# restarts. Only the swap + restart (~1 s) can race a visitor.
#
# Rollback: mv /home/ubuntu/aiem-app/.next.old /home/ubuntu/aiem-app/.next && pm2 restart aiem-app
set -euo pipefail
APP=/home/ubuntu/aiem-app
BUILD=/home/ubuntu/aiem-build
mkdir -p "$BUILD"
rsync -a --delete --exclude node_modules --exclude .next --exclude .next.old "$APP/" "$BUILD/"
ln -sfn "$APP/node_modules" "$BUILD/node_modules"
# --webpack: Turbopack crashes on the email-service/venv python symlink.
cd "$BUILD" && npx next build --webpack 2>&1 | grep -E "✓ Compiled|Failed|rror" | head -3
rm -rf "$APP/.next.old"
[ -d "$APP/.next" ] && mv "$APP/.next" "$APP/.next.old"
mv "$BUILD/.next" "$APP/.next"
pm2 restart aiem-app --update-env >/dev/null
sleep 3
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://aiem.apposecretariat.org/
