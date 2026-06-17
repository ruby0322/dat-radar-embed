from __future__ import annotations

import sqlite3
from pathlib import Path

from config import DB_PATH, ROOT_DIR


def main() -> None:
  schema_path = ROOT_DIR / "storage" / "schema.sql"
  sql = Path(schema_path).read_text(encoding="utf-8")
  conn = sqlite3.connect(DB_PATH)
  try:
    conn.executescript(sql)
    conn.commit()
    print(f"Initialized schema at {DB_PATH}")
  finally:
    conn.close()


if __name__ == "__main__":
  main()
