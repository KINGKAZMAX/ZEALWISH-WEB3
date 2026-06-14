#!/usr/bin/env bash
# ZEALWISH — local web preview with StepFun LLM + voice conversation.
# Run on your Mac:  bash run-local.sh
set -e
cd "$(dirname "$0")"

echo "[1/3] Building ZEALWISH Web (v6) bundle (picks up the voice features)..."
npm run build:web

echo "[2/3] Starting StepFun API server on http://127.0.0.1:7291 ..."
( cd ocworld-web && node server.js ) &
API_PID=$!

echo "[3/3] Serving the web frontend on http://127.0.0.1:8789 ..."
python3 -m http.server 8789 --bind 127.0.0.1 --directory frontend-v4 &
WEB_PID=$!

trap "kill $API_PID $WEB_PID 2>/dev/null" EXIT INT TERM
sleep 1
echo ""
echo "  =============================================================="
echo "   ZEALWISH Web app : http://127.0.0.1:8789/web.html#/home"
echo "   Landing page     : http://127.0.0.1:8789/index.html"
echo "   Open in Chrome (mic/voice needs Chrome or Edge). Ctrl+C to stop."
echo "  =============================================================="
wait
