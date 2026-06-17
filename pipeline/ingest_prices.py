from __future__ import annotations

import sqlite3
from datetime import date

import pandas as pd
import yfinance as yf

from config import DB_PATH, PARQUET_DIR


def _normalize_price_df(df: pd.DataFrame, symbol: str) -> pd.DataFrame:
  if df.empty:
    return pd.DataFrame(columns=["ticker", "date", "close_price"])

  out = df.reset_index()[["Date", "Close"]].copy()
  out["Date"] = pd.to_datetime(out["Date"]).dt.strftime("%Y-%m-%d")
  out.rename(columns={"Date": "date", "Close": "close_price"}, inplace=True)
  out["ticker"] = symbol
  return out[["ticker", "date", "close_price"]]


def _upsert_prices(conn: sqlite3.Connection, table: str, rows: pd.DataFrame) -> None:
  if rows.empty:
    return
  if table == "daily_prices":
    conn.executemany(
      """
      INSERT INTO daily_prices (ticker, date, close_price)
      VALUES (?, ?, ?)
      ON CONFLICT(ticker, date) DO UPDATE SET
        close_price = excluded.close_price
      """,
      rows[["ticker", "date", "close_price"]].itertuples(index=False, name=None),
    )
  else:
    conn.executemany(
      """
      INSERT INTO btc_prices (date, close_price)
      VALUES (?, ?)
      ON CONFLICT(date) DO UPDATE SET
        close_price = excluded.close_price
      """,
      rows[["date", "close_price"]].itertuples(index=False, name=None),
    )


def main() -> None:
  start = "2020-08-01"
  end = date.today().isoformat()

  mstr_df = yf.download("MSTR", start=start, end=end, progress=False, auto_adjust=True)
  btc_df = yf.download("BTC-USD", start=start, end=end, progress=False, auto_adjust=True)

  mstr_rows = _normalize_price_df(mstr_df, "MSTR")
  btc_rows = _normalize_price_df(btc_df, "BTC-USD")
  btc_rows = btc_rows.drop(columns=["ticker"])

  conn = sqlite3.connect(DB_PATH)
  try:
    _upsert_prices(conn, "daily_prices", mstr_rows)
    _upsert_prices(conn, "btc_prices", btc_rows)
    conn.commit()
  finally:
    conn.close()

  mstr_rows.to_parquet(PARQUET_DIR / "daily_prices_mstr.parquet", index=False)
  btc_rows.to_parquet(PARQUET_DIR / "btc_prices.parquet", index=False)
  print(f"Ingested {len(mstr_rows)} MSTR rows and {len(btc_rows)} BTC rows")


if __name__ == "__main__":
  main()
