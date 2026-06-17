import type { DailyRow, InsightPayload, KpiSummary } from "@/types";

function stdDev(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}

export function computeRollingMetrics(rows: DailyRow[]): DailyRow[] {
  return rows.map((row, i) => {
    const mnavWindow =
      i >= 29 ? rows.slice(i - 29, i + 1).map((r) => r.mnav) : null;

    const mnav_30d_avg =
      mnavWindow !== null
        ? mnavWindow.reduce((sum, v) => sum + v, 0) / mnavWindow.length
        : null;

    const mnav_30d_std =
      mnavWindow !== null ? stdDev(mnavWindow) : null;

    let btc_realized_vol_30d: number | null = null;
    if (i >= 30) {
      const logReturns: number[] = [];
      for (let k = i - 29; k <= i; k++) {
        logReturns.push(Math.log(rows[k].btc_price / rows[k - 1].btc_price));
      }
      btc_realized_vol_30d = stdDev(logReturns) * Math.sqrt(252);
    }

    return {
      ...row,
      mnav_30d_avg,
      mnav_30d_std,
      btc_realized_vol_30d,
    };
  });
}

export function computeKpi(rows: DailyRow[]): KpiSummary {
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

export function buildInsightPayload(rows: DailyRow[]): InsightPayload {
  if (rows.length === 0) {
    throw new Error("Cannot build insight payload from empty rows array");
  }
  const last = rows.length - 1;
  const prev = Math.max(0, last - 30);
  const mnavValues = rows.map((r) => r.mnav);
  return {
    current_mnav: rows[last].mnav,
    mnav_30d_ago: rows[prev].mnav,
    mnav_min: Math.min(...mnavValues),
    mnav_max: Math.max(...mnavValues),
    mnav_mean: mnavValues.reduce((sum, v) => sum + v, 0) / mnavValues.length,
    btc_price_now: rows[last].btc_price,
    btc_price_30d_ago: rows[prev].btc_price,
    date_range_start: rows[0].date,
    date_range_end: rows[last].date,
    btc_holdings: rows[last].btc_holdings,
  };
}
