import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["ripHistorical", "yahooSurvey"],
});

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
        console.warn(
          `[fetch-market-data] ${label} attempt ${attempt} failed, retrying in ${delay}ms`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw new Error(
    `Failed to fetch ${label} after ${MAX_RETRIES} attempts: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`
  );
}

async function fetchYahooDailyPrices(
  symbol: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; price: number }>> {
  const result = await withRetry(`${symbol} prices`, () =>
    yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    })
  );

  return (result.quotes ?? [])
    .filter((q) => q.date != null && (q.adjclose ?? q.close) != null)
    .map((q) => ({
      date: q.date.toISOString().slice(0, 10),
      price: (q.adjclose ?? q.close) as number,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function fetchMstrPrices(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; price: number }>> {
  return fetchYahooDailyPrices("MSTR", startDate, endDate);
}

export function fetchBtcPrices(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; price: number }>> {
  return fetchYahooDailyPrices("BTC-USD", startDate, endDate);
}
