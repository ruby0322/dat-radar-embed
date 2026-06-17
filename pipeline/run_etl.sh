#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

python3 "${SCRIPT_DIR}/init_db.py"
python3 "${SCRIPT_DIR}/ingest_prices.py"
python3 "${SCRIPT_DIR}/ingest_holdings.py"
python3 "${SCRIPT_DIR}/compute_mnav.py"
python3 "${SCRIPT_DIR}/analytics_mapreduce.py"

echo "ETL pipeline completed."
echo "DB path: ${DB_PATH:-${ROOT_DIR}/data/dat_radar.db}"
