from __future__ import annotations

import json
import re
import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Iterable

import requests

from config import DB_PATH, HOLDINGS_JSON_PATH, SEC_USER_AGENT

CIK = "0001050446"
SUBMISSIONS_URL = f"https://data.sec.gov/submissions/CIK{CIK}.json"


def _load_baseline(path: Path) -> list[dict]:
  raw = json.loads(path.read_text(encoding="utf-8"))
  out = []
  for row in raw:
    out.append(
      {
        "date": row["date"],
        "btc_holdings": float(row["btc_holdings"]),
        "shares_outstanding": float(row["shares_outstanding"]),
      }
    )
  return sorted(out, key=lambda r: r["date"])


def _extract_holdings(text: str) -> float | None:
  patterns = [
    r"aggregate of\s*([\d,]+)\s*bitcoin",
    r"([\d,]+)\s*bitcoin holdings at a total cost",
    r"holdings\s*\$?\s*([\d,]+)\s*\$",
  ]
  for pattern in patterns:
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if match:
      return float(match.group(1).replace(",", ""))
  return None


def _fetch_recent_holdings(after_date: str) -> list[dict]:
  headers = {"User-Agent": SEC_USER_AGENT}
  out: list[dict] = []
  try:
    submissions = requests.get(SUBMISSIONS_URL, headers=headers, timeout=20).json()
  except Exception:
    return out

  recent = submissions.get("filings", {}).get("recent", {})
  forms = recent.get("form", [])
  dates = recent.get("filingDate", [])
  accessions = recent.get("accessionNumber", [])
  primaries = recent.get("primaryDocument", [])

  for form, filing_date, accession, primary_doc in zip(forms, dates, accessions, primaries):
    if form != "8-K" or filing_date <= after_date or not primary_doc.startswith("mstr-"):
      continue
    acc_no_dashes = accession.replace("-", "")
    filing_url = f"https://www.sec.gov/Archives/edgar/data/{int(CIK)}/{acc_no_dashes}/{primary_doc}"
    try:
      resp = requests.get(filing_url, headers=headers, timeout=20)
      resp.raise_for_status()
      holdings = _extract_holdings(resp.text)
      if holdings is None:
        continue
      out.append(
        {
          "date": filing_date,
          "btc_holdings": holdings,
          "shares_outstanding": 197_000_000.0,
        }
      )
      time.sleep(0.12)
    except Exception:
      continue

  return sorted(out, key=lambda r: r["date"])


def _upsert(conn: sqlite3.Connection, rows: Iterable[dict]) -> None:
  conn.executemany(
    """
    INSERT INTO holdings (ticker, filing_date, btc_holdings, shares_outstanding, source)
    VALUES ('MSTR', ?, ?, ?, 'sec_edgar')
    ON CONFLICT(ticker, filing_date) DO UPDATE SET
      btc_holdings = excluded.btc_holdings,
      shares_outstanding = excluded.shares_outstanding
    """,
    [(row["date"], row["btc_holdings"], row["shares_outstanding"]) for row in rows],
  )


def main() -> None:
  baseline = _load_baseline(HOLDINGS_JSON_PATH)
  latest = max(row["date"] for row in baseline)
  live = _fetch_recent_holdings(latest)

  merged_map = {row["date"]: row for row in baseline}
  for row in live:
    merged_map[row["date"]] = row

  merged = sorted(merged_map.values(), key=lambda r: r["date"])

  conn = sqlite3.connect(DB_PATH)
  try:
    _upsert(conn, merged)
    conn.commit()
  finally:
    conn.close()

  print(
    f"Loaded {len(baseline)} baseline holdings, {len(live)} live rows, total {len(merged)}"
  )
  print(f"Updated at {datetime.utcnow().isoformat()}Z")


if __name__ == "__main__":
  main()
