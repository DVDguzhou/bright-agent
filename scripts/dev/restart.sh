#!/usr/bin/env bash
set -euo pipefail

echo "[restart] killing existing processes on :8080 and :3000..."
lsof -i :8080 -t 2>/dev/null | xargs kill 2>/dev/null || true
lsof -i :3000 -t 2>/dev/null | xargs kill 2>/dev/null || true
sleep 1

echo "[restart] starting dev..."
exec bash "$(dirname "$0")/dev.sh"
