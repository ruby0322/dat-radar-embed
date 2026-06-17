from __future__ import annotations

import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
PARQUET_DIR = DATA_DIR / "parquet"
DB_PATH = os.getenv("DB_PATH", str(DATA_DIR / "dat_radar.db"))
HOLDINGS_JSON_PATH = ROOT_DIR / "dat-radar" / "data" / "holdings.json"
SEC_USER_AGENT = os.getenv("SEC_USER_AGENT", "DATRadar/1.0 (student project)")

PARQUET_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
