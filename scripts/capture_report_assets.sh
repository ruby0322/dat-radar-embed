#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ASSETS_DIR="${ROOT_DIR}/report/assets"
BASE_URL="${REPORT_BASE_URL:-http://localhost:3000}"

CHROME_CANDIDATES=(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
)

CHROME=""
for candidate in "${CHROME_CANDIDATES[@]}"; do
  if [ -x "$candidate" ]; then
    CHROME="$candidate"
    break
  fi
done

if ! curl -fsS "${BASE_URL}/" >/dev/null 2>&1; then
  echo "Error: DAT Radar dev server is not reachable at ${BASE_URL}"
  echo "Start it first: cd dat-radar && npm run dev"
  exit 1
fi

mkdir -p "${ASSETS_DIR}"
python3 "${SCRIPT_DIR}/generate_architecture_diagram.py"

if [ -z "$CHROME" ]; then
  echo "Warning: No headless Chrome found. Skipping UI screenshots."
  exit 0
fi

capture() {
  local url="$1"
  local outfile="$2"
  local width="$3"
  local height="$4"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size="${width},${height}" --screenshot="${outfile}" "$url" >/dev/null 2>&1
  echo "Captured ${outfile}"
}

capture "${BASE_URL}/demo" "${ASSETS_DIR}/demo.png" 1440 1600
capture "${BASE_URL}/embed/MSTR?range=1y&theme=dark" "${ASSETS_DIR}/embed.png" 960 400

echo "Report assets written to ${ASSETS_DIR}"
