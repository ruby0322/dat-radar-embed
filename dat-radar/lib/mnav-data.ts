import { getDb } from "@/lib/db";
import { fetchMstrPrices, fetchBtcPrices } from "@/lib/fetch-market-data";
import { fetchHoldings } from "@/lib/fetch-holdings";
import { computeRollingMetrics } from "@/lib/compute-indicators";
import { getDateRange } from "@/lib/date-range";
import type { DateRange, DailyRow, HoldingsEntry, KpiSummary } from "@/types";

type MnavDailyDbRow = Omit<DailyRow, "is_purchase_event"> & { is_purchase_event: number };

export type MnavDataSource = "database" | "live-fallback";

function buildDateIndex(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

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

export async function loadMnavRowsLive(
  ticker: string,
  range: DateRange
): Promise<DailyRow[]> {
  if (ticker !== "MSTR") {
    return [];
  }

  const { startDate, endDate } = getDateRange(range);
  const [mstrPrices, btcPrices] = await Promise.all([
    fetchMstrPrices(startDate, endDate),
    fetchBtcPrices(startDate, endDate),
  ]);

  const holdings = await fetchHoldings();
  const purchaseDates = new Set(holdings.map((h) => h.date));
  const mstrMap = new Map(mstrPrices.map((r) => [r.date, r.price]));
  const btcMap = new Map(btcPrices.map((r) => [r.date, r.price]));
  const dateIndex = buildDateIndex(startDate, endDate);
  const rawRows: DailyRow[] = [];

  for (const date of dateIndex) {
    const mstr_price = mstrMap.get(date);
    const btc_price = btcMap.get(date);
    if (mstr_price == null || btc_price == null) continue;

    let lastHolding: HoldingsEntry | null = null;
    for (const h of holdings) {
      if (h.date <= date) lastHolding = h;
      else break;
    }
    if (!lastHolding) continue;

    const { btc_holdings, shares_outstanding } = lastHolding;
    const market_cap = shares_outstanding * mstr_price;
    const btc_treasury_value = btc_holdings * btc_price;
    const btc_per_share = btc_holdings / shares_outstanding;
    const mnav = market_cap / btc_treasury_value;

    rawRows.push({
      date,
      mstr_price,
      btc_price,
      btc_holdings,
      shares_outstanding,
      market_cap,
      btc_treasury_value,
      btc_per_share,
      mnav,
      mnav_30d_avg: null,
      mnav_30d_std: null,
      btc_realized_vol_30d: null,
      is_purchase_event: purchaseDates.has(date),
    });
  }

  return computeRollingMetrics(rawRows);
}

export async function loadMnavRows(
  ticker: string,
  range: DateRange
): Promise<{ rows: DailyRow[]; source: MnavDataSource }> {
  try {
    const dbRows = loadMnavRowsFromDb(ticker, range);
    if (dbRows.length > 0) {
      return { rows: dbRows, source: "database" };
    }
  } catch {
    // Fall through to live fetch when SQLite is unavailable (e.g. Vercel).
  }

  const rows = await loadMnavRowsLive(ticker, range);
  return { rows, source: "live-fallback" };
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
