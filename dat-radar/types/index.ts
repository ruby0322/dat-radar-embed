// One record per calendar day — the canonical shape passed between API and UI
export interface DailyRow {
  date: string; // ISO date string, e.g. "2024-01-15"

  // Raw market data
  mstr_price: number; // MSTR closing price (USD)
  btc_price: number; // BTC closing price (USD)

  // From holdings.json (forward-filled)
  btc_holdings: number; // Total BTC held by MSTR
  shares_outstanding: number; // Diluted shares outstanding

  // Derived
  market_cap: number; // shares_outstanding × mstr_price
  btc_treasury_value: number; // btc_holdings × btc_price
  btc_per_share: number; // btc_holdings / shares_outstanding
  mnav: number; // market_cap / btc_treasury_value

  // Rolling metrics (null for early rows where window is incomplete)
  mnav_30d_avg: number | null;
  mnav_30d_std: number | null;
  btc_realized_vol_30d: number | null; // annualised, e.g. 0.65 = 65%

  // Whether this date is a known BTC purchase event
  is_purchase_event: boolean;
}

// Latest-value snapshot for the four KPI cards
export interface KpiSummary {
  current_mnav: number;
  mnav_30d_change: number; // absolute delta
  btc_holdings: number;
  btc_per_share: number;
  last_updated: string; // ISO datetime string
}

// The 9 numeric fields sent to /api/ai-insight
export interface InsightPayload {
  current_mnav: number;
  mnav_30d_ago: number;
  mnav_min: number;
  mnav_max: number;
  mnav_mean: number;
  btc_price_now: number;
  btc_price_30d_ago: number;
  date_range_start: string;
  date_range_end: string;
  btc_holdings: number;
}

// Response shape from /api/ai-insight
export interface InsightResponse {
  insight: string;
  generated_at: string;
}

// Response shape from /api/market-data
export interface MarketDataResponse {
  rows: DailyRow[];
  kpi: KpiSummary;
}

export interface ApiV1MnavResponse {
  ticker: string;
  range: DateRange;
  rows: DailyRow[];
  kpi: KpiSummary;
  source: "database" | "live-fallback";
}

// Holdings entry from data/holdings.json
export interface HoldingsEntry {
  date: string; // ISO date of disclosure
  btc_holdings: number;
  shares_outstanding: number;
}

export type DateRange = "30d" | "90d" | "ytd" | "1y" | "all";
