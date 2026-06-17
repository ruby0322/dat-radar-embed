from __future__ import annotations

import sqlite3

import numpy as np
import pandas as pd

from config import DB_PATH, PARQUET_DIR


def _std(values: pd.Series) -> float:
  if len(values) == 0:
    return 0.0
  return float(values.std(ddof=0))


def main() -> None:
  conn = sqlite3.connect(DB_PATH)
  prices = pd.read_sql_query(
    "SELECT date, close_price AS mstr_price FROM daily_prices WHERE ticker='MSTR' ORDER BY date",
    conn,
  )
  btc = pd.read_sql_query(
    "SELECT date, close_price AS btc_price FROM btc_prices ORDER BY date", conn
  )
  holdings = pd.read_sql_query(
    "SELECT filing_date AS date, btc_holdings, shares_outstanding FROM holdings WHERE ticker='MSTR' ORDER BY filing_date",
    conn,
  )

  if prices.empty or btc.empty or holdings.empty:
    print("Skipped: missing source tables")
    return

  merged = prices.merge(btc, on="date", how="inner")
  merged["date"] = pd.to_datetime(merged["date"])
  holdings["date"] = pd.to_datetime(holdings["date"])

  merged = merged.sort_values("date")
  holdings = holdings.sort_values("date")
  merged = pd.merge_asof(merged, holdings, on="date", direction="backward")
  merged = merged.dropna(subset=["btc_holdings", "shares_outstanding"])

  merged["market_cap"] = merged["mstr_price"] * merged["shares_outstanding"]
  merged["btc_treasury_value"] = merged["btc_holdings"] * merged["btc_price"]
  merged["btc_per_share"] = merged["btc_holdings"] / merged["shares_outstanding"]
  merged["mnav"] = merged["market_cap"] / merged["btc_treasury_value"]

  merged["mnav_30d_avg"] = merged["mnav"].rolling(30).mean()
  merged["mnav_30d_std"] = merged["mnav"].rolling(30).apply(_std, raw=False)

  log_returns = np.log(merged["btc_price"] / merged["btc_price"].shift(1))
  merged["btc_realized_vol_30d"] = log_returns.rolling(30).std(ddof=0) * np.sqrt(252)
  merged["is_purchase_event"] = merged["date"].isin(holdings["date"]).astype(int)

  merged["date"] = merged["date"].dt.strftime("%Y-%m-%d")
  rows = merged[
    [
      "date",
      "mstr_price",
      "btc_price",
      "btc_holdings",
      "shares_outstanding",
      "market_cap",
      "btc_treasury_value",
      "btc_per_share",
      "mnav",
      "mnav_30d_avg",
      "mnav_30d_std",
      "btc_realized_vol_30d",
      "is_purchase_event",
    ]
  ]

  conn.execute("DELETE FROM mnav_daily WHERE ticker='MSTR'")
  conn.executemany(
    """
    INSERT INTO mnav_daily (
      ticker, date, mstr_price, btc_price, btc_holdings, shares_outstanding,
      market_cap, btc_treasury_value, btc_per_share, mnav, mnav_30d_avg,
      mnav_30d_std, btc_realized_vol_30d, is_purchase_event
    ) VALUES ('MSTR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
    list(rows.itertuples(index=False, name=None)),
  )
  conn.commit()
  conn.close()

  rows.to_parquet(PARQUET_DIR / "mnav_daily_mstr.parquet", index=False)
  print(f"Computed and stored {len(rows)} mNAV daily rows")


if __name__ == "__main__":
  main()
