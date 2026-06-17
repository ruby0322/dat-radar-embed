import { getDb } from "@/lib/db";
import type { DateRange, DailyRow, KpiSummary } from "@/types";
import { getDateRange } from "@/lib/date-range";

type MnavDailyDbRow = Omit<DailyRow, "is_purchase_event"> & { is_purchase_event: number };

export function loadMnavRowsFromDb(ticker: string, range: DateRange): DailyRow[] {
  const { startDate, endDate } = getDateRange(range);
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT
        date, mstr_price, btc_price, btc_holdings, shares_outstanding,
        market_cap, btc_treasury_value, btc_per_share, mnav, mnav_30d_avg,
        mnav_30d_std, btc_realized_vol_30d, is_purchase_event
      FROM mnav_daily
      WHERE ticker = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `
    )
    .all(ticker, startDate, endDate) as MnavDailyDbRow[];

  return rows.map((row) => ({
    ...row,
    is_purchase_event: row.is_purchase_event === 1,
  }));
}

export function computeKpiFromRows(rows: DailyRow[]): KpiSummary {
  if (rows.length === 0) {
    throw new Error("Cannot compute KPI from empty rows array");
  }
  const last = rows.length - 1;
  const prev = Math.max(0, last - 30);
  return {
    current_mnav: rows[last].mnav,
    mnav_30d_change: rows[last].mnav - rows[prev].mnav,
    btc_holdings: rows[last].btc_holdings,
    btc_per_share: rows[last].btc_per_share,
    last_updated: new Date().toISOString(),
  };
}
