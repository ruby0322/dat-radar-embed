from __future__ import annotations

import math
import sqlite3
from multiprocessing import Pool, cpu_count

import pandas as pd

from config import DB_PATH


def mapper(chunk: pd.DataFrame) -> tuple[float, float, float, int]:
  valid = chunk.dropna(subset=["mnav", "btc_return"])
  if valid.empty:
    return (0.0, 0.0, 0.0, 0)
  xy = (valid["mnav"] * valid["btc_return"]).sum()
  xx = (valid["mnav"] * valid["mnav"]).sum()
  yy = (valid["btc_return"] * valid["btc_return"]).sum()
  return (float(xy), float(xx), float(yy), len(valid))


def reducer(mapped: list[tuple[float, float, float, int]]) -> dict[str, float]:
  sum_xy = sum(x[0] for x in mapped)
  sum_xx = sum(x[1] for x in mapped)
  sum_yy = sum(x[2] for x in mapped)
  count = sum(x[3] for x in mapped)
  denom = math.sqrt(sum_xx * sum_yy) if sum_xx > 0 and sum_yy > 0 else 0.0
  corr = sum_xy / denom if denom else 0.0
  return {"count": float(count), "cosine_like_corr": corr}


def main() -> None:
  conn = sqlite3.connect(DB_PATH)
  df = pd.read_sql_query(
    "SELECT date, mnav, btc_price FROM mnav_daily WHERE ticker='MSTR' ORDER BY date",
    conn,
  )
  conn.close()
  if df.empty:
    print("No mnav_daily data, run compute_mnav.py first.")
    return

  df["btc_return"] = df["btc_price"].pct_change()
  workers = max(1, min(4, cpu_count()))
  chunks = [df.iloc[i::workers].copy() for i in range(workers)]

  with Pool(processes=workers) as pool:
    mapped = pool.map(mapper, chunks)
  result = reducer(mapped)

  print("MapReduce analytics result")
  print(f"rows={int(result['count'])}")
  print(f"mnav_btc_return_correlation={result['cosine_like_corr']:.6f}")


if __name__ == "__main__":
  main()
