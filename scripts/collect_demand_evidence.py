from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "docs" / "demand-evidence" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)


def fetch_hn_mentions(query: str) -> dict:
  url = "https://hn.algolia.com/api/v1/search"
  params = {"query": query, "tags": "story", "hitsPerPage": 20}
  try:
    data = requests.get(url, params=params, timeout=20).json()
    return {"query": query, "hits": data.get("nbHits", 0)}
  except Exception:
    return {"query": query, "hits": 0}


def fetch_reddit_subreddit_size(name: str) -> dict:
  url = f"https://www.reddit.com/r/{name}/about.json"
  headers = {"User-Agent": "DATRadarEvidence/1.0"}
  try:
    payload = requests.get(url, headers=headers, timeout=20).json()
    subscribers = payload["data"]["subscribers"]
    active = payload["data"]["active_user_count"]
    return {"subreddit": name, "subscribers": subscribers, "active_user_count": active}
  except Exception:
    return {"subreddit": name, "subscribers": 0, "active_user_count": 0}


def write_csv(path: Path, rows: list[dict]) -> None:
  if not rows:
    return
  with path.open("w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)


def main() -> None:
  pricing_rows = [
    {
      "provider": "Messari Pro",
      "price_hint_usd_month": 29,
      "notes": "Research analytics subscription baseline for crypto users.",
    },
    {
      "provider": "Finnhub",
      "price_hint_usd_month": 59,
      "notes": "API-oriented pricing baseline for market data products.",
    },
    {
      "provider": "TradingView Widgets",
      "price_hint_usd_month": 0,
      "notes": "Embed baseline; free widgets with branding constraints.",
    },
  ]
  write_csv(RAW_DIR / "competitor_pricing.csv", pricing_rows)

  hn_rows = [fetch_hn_mentions("bitcoin treasury"), fetch_hn_mentions("MSTR mNAV")]
  write_csv(RAW_DIR / "hn_signal.csv", hn_rows)

  reddit_rows = [
    fetch_reddit_subreddit_size("Bitcoin"),
    fetch_reddit_subreddit_size("MSTR"),
    fetch_reddit_subreddit_size("CryptoCurrency"),
  ]
  write_csv(RAW_DIR / "reddit_signal.csv", reddit_rows)

  summary = {
    "generated_at": f"{datetime.utcnow().isoformat()}Z",
    "files": ["competitor_pricing.csv", "hn_signal.csv", "reddit_signal.csv"],
    "notes": "Use these raw tables as reproducible demand evidence inputs in the final report.",
  }
  (RAW_DIR / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
  print(json.dumps(summary, indent=2))


if __name__ == "__main__":
  main()
