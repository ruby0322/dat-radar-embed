import { NextRequest, NextResponse } from "next/server";
import { fetchMstrPrices, fetchBtcPrices } from "@/lib/fetch-market-data";
import { computeRollingMetrics, computeKpi } from "@/lib/compute-indicators";
import { fetchHoldings } from "@/lib/fetch-holdings";
import { getDateRange } from "@/lib/date-range";
import { computeKpiFromRows, loadMnavRowsFromDb } from "@/lib/mnav-data";
import type {
  DateRange,
  DailyRow,
  MarketDataResponse,
  HoldingsEntry,
} from "@/types";

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") ?? "1y";
    const validRanges: DateRange[] = ["30d", "90d", "ytd", "1y", "all"];
    const range: DateRange = validRanges.includes(rangeParam as DateRange)
      ? (rangeParam as DateRange)
      : "1y";

    // Prefer precomputed DB rows from the ETL pipeline.
    try {
      const dbRows = loadMnavRowsFromDb("MSTR", range);
      if (dbRows.length > 0) {
        const body: MarketDataResponse = { rows: dbRows, kpi: computeKpiFromRows(dbRows) };
        return NextResponse.json(body, {
          headers: { "Cache-Control": "no-store", "X-DAT-Radar-Source": "database" },
        });
      }
    } catch {
      // Fall through to live fetch path if DB is unavailable.
    }

    const { startDate, endDate } = getDateRange(range);

    const [mstrPrices, btcPrices] = await Promise.all([
      fetchMstrPrices(startDate, endDate),
      fetchBtcPrices(startDate, endDate),
    ]);

    const holdings = await fetchHoldings();
    const purchaseDates = new Set(holdings.map((h) => h.date));

    // Index price arrays for O(1) lookup
    const mstrMap = new Map(mstrPrices.map((r) => [r.date, r.price]));
    const btcMap = new Map(btcPrices.map((r) => [r.date, r.price]));

    const dateIndex = buildDateIndex(startDate, endDate);

    const rawRows: DailyRow[] = [];

    for (const date of dateIndex) {
      const mstr_price = mstrMap.get(date);
      const btc_price = btcMap.get(date);

      // Skip days where either price is missing (weekends, holidays)
      if (mstr_price == null || btc_price == null) continue;

      // Forward-fill holdings: last entry whose date <= current date
      let lastHolding: HoldingsEntry | null = null;
      for (const h of holdings) {
        if (h.date <= date) lastHolding = h;
        else break;
      }

      if (!lastHolding) continue; // before first disclosure

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

    const rows = computeRollingMetrics(rawRows);
    const kpi = computeKpi(rows);

    const body: MarketDataResponse = { rows, kpi };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store", "X-DAT-Radar-Source": "live-fallback" },
    });
  } catch (err) {
    console.error("[market-data]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
