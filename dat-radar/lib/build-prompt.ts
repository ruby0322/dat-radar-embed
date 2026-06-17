import type { InsightPayload } from "@/types";

export function buildPrompt(payload: InsightPayload): string {
  const {
    current_mnav,
    mnav_30d_ago,
    mnav_min,
    mnav_max,
    mnav_mean,
    btc_price_now,
    btc_price_30d_ago,
    date_range_start,
    date_range_end,
    btc_holdings,
  } = payload;

  const fmt = (n: number) => n.toFixed(3) + "×";
  const fmtUsd = (n: number) => "$" + n.toLocaleString();

  return `You are a financial data analyst. Summarize the mNAV indicator for MicroStrategy (MSTR).

Definition: mNAV = Market Cap / (BTC Holdings × BTC Spot Price). A value > 1.0 means the market prices MSTR at a premium to its BTC treasury.

Current data:
- Current mNAV: ${fmt(current_mnav)}
- mNAV 30 days ago: ${fmt(mnav_30d_ago)}
- Historical range: ${fmt(mnav_min)} – ${fmt(mnav_max)} (mean: ${fmt(mnav_mean)})
- BTC price now: ${fmtUsd(btc_price_now)}
- BTC price 30 days ago: ${fmtUsd(btc_price_30d_ago)}
- Latest BTC holdings: ${btc_holdings.toLocaleString()} BTC
- Analysis window: ${date_range_start} to ${date_range_end}

Write a concise 3–5 bullet summary covering:
1. What the current mNAV level suggests about market sentiment vs the historical range
2. The recent 30-day trend direction and magnitude
3. How mNAV movement relates to BTC price movement
4. Key caveats (holdings data lag, mNAV ignores liabilities, not investment advice)

Do not speculate about future prices. Do not make investment recommendations.`;
}
