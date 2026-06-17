import * as fs from "fs";
import * as path from "path";
import YahooFinance from "yahoo-finance2";
import type { HoldingsEntry } from "@/types";

const yahooFinance = new YahooFinance();

const EDGAR_DATA_API = "https://data.sec.gov";
const EDGAR_ARCHIVES = "https://www.sec.gov/Archives/edgar/data";
const MSTR_CIK_PADDED = "0001050446";
const MSTR_CIK = "1050446";
const EDGAR_USER_AGENT =
  process.env.EDGAR_USER_AGENT ??
  "bitcoin-robo-advisor noreply@example.com";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * All confirmed BTC-count formats seen across MSTR 8-K filings:
 *
 * TABLE FORMAT (2025-present weekly purchase 8-Ks, in primary doc):
 *   "{acquired} $ {price_m} $ {avg_price} {holdings} $ {total_b} $ {avg_cost}"
 *   e.g. "196 $ 22.1 $ 113,048 640,031 $ 47.35 $ 73,983"
 *   → captured in group 2
 *
 * NARRATIVE FORMAT (2025 quarterly earnings exhibit 99.1):
 *   "{holdings} bitcoin holdings at a total cost of ${X} billion"
 *   e.g. "553,555 bitcoin holdings at a total cost of $37.90 billion"
 *   → captured in group 1
 *
 * OLD NARRATIVE FORMAT (pre-2025 press releases):
 *   "aggregate of X bitcoin"  /  "aggregate of approximately X bitcoin"
 *   → captured in group 1
 */

// Table format: captures group 2 (the cumulative "Aggregate BTC Holdings" column)
const TABLE_RE =
  /([\d,]+)\s+\$\s+[\d.,]+\s+\$\s+[\d,]+\s+([\d,]+)\s+\$\s+[\d.,]+\s+\$\s+[\d,]+/;

// Narrative formats: captured in group 1
const NARRATIVE_RES = [
  /([\d,]+)\s+bitcoin\s+holdings?\s+at\s+a\s+total\s+cost/i,
  /aggregate of (?:approximately )?([\d,]+)\s+bitcoin/i,
  /holds?\s+(?:an aggregate of\s+)?(?:approximately\s+)?([\d,]+)\s+bitcoin/i,
  /total of (?:approximately\s+)?([\d,]+)\s+bitcoin/i,
];

interface CacheStore {
  holdings: HoldingsEntry[];
  fetchedAt: number;
}

// Module-level in-memory cache; survives across requests in the same server process
// Set to null to force a fresh fetch on the next request after a code change
let holdingsCache: CacheStore | null = null;

function loadStaticHoldings(): HoldingsEntry[] {
  const filePath = path.join(process.cwd(), "data", "holdings.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as HoldingsEntry[];
}

function parseBtcFromText(text: string): number | null {
  // Strip HTML tags and collapse whitespace for clean matching
  const stripped = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ");

  // Try table format first (group 2 = aggregate BTC holdings column)
  const tableMatch = TABLE_RE.exec(stripped);
  if (tableMatch) {
    const val = parseInt(tableMatch[2].replace(/,/g, ""), 10);
    // Sanity check: aggregate MSTR holdings should be well above 100k
    if (val > 100_000) return val;
  }

  // Fall back to narrative formats (group 1)
  for (const re of NARRATIVE_RES) {
    const m = re.exec(stripped);
    if (m) {
      const val = parseInt(m[1].replace(/,/g, ""), 10);
      if (val > 0) return val;
    }
  }
  return null;
}

// Minimum gap between successive EDGAR requests (10 req/s hard limit)
const EDGAR_RATE_DELAY_MS = 120;

let lastEdgarRequestAt = 0;

async function edgarGet(url: string): Promise<string | null> {
  // Honour EDGAR's 10 req/s rate limit with a simple sequential delay
  const gap = Date.now() - lastEdgarRequestAt;
  if (gap < EDGAR_RATE_DELAY_MS) {
    await new Promise((r) => setTimeout(r, EDGAR_RATE_DELAY_MS - gap));
  }
  lastEdgarRequestAt = Date.now();

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": EDGAR_USER_AGENT,
        Accept: "text/html,application/json,*/*",
      },
    });
    if (!resp.ok) {
      console.warn(
        `[fetch-holdings] EDGAR HTTP ${resp.status} for ${url.split("/").slice(-1)[0]}`
      );
      return null;
    }
    return await resp.text();
  } catch (err) {
    console.warn(`[fetch-holdings] EDGAR fetch error: ${err}`);
    return null;
  }
}

async function fetchLiveHoldingsFromEdgar(
  afterDate: string
): Promise<HoldingsEntry[]> {
  const subUrl = `${EDGAR_DATA_API}/submissions/CIK${MSTR_CIK_PADDED}.json`;
  let subText = await edgarGet(subUrl);
  if (!subText) {
    // One retry after a brief pause (handles transient rate-limit windows)
    await new Promise((r) => setTimeout(r, 2000));
    subText = await edgarGet(subUrl);
  }
  if (!subText) throw new Error("Could not fetch EDGAR submissions JSON");

  const submissions = JSON.parse(subText) as {
    filings: {
      recent: {
        accessionNumber: string[];
        filingDate: string[];
        form: string[];
        primaryDocument: string[];
      };
    };
  };

  const { accessionNumber, filingDate, form, primaryDocument } =
    submissions.filings.recent;

  const newFilings: Array<{ date: string; accession: string; doc: string }> =
    [];

  for (let i = 0; i < form.length; i++) {
    if (form[i] === "8-K" && filingDate[i] > afterDate) {
      const doc = primaryDocument[i];
      // Skip non-MSTR-prefixed docs (d*d8k.htm, etc.) — they are ATM / preferred stock
      // 8-Ks and never contain BTC purchase data
      if (!doc.toLowerCase().startsWith("mstr-")) continue;
      newFilings.push({
        date: filingDate[i],
        accession: accessionNumber[i].replace(/-/g, ""),
        doc,
      });
    }
  }

  // Oldest first so forward-fill ordering stays consistent
  newFilings.sort((a, b) => a.date.localeCompare(b.date));

  console.log(
    `[fetch-holdings] found ${newFilings.length} new 8-K filings after ${afterDate}`
  );

  const entries: HoldingsEntry[] = [];

  for (const filing of newFilings) {
    const baseUrl = `${EDGAR_ARCHIVES}/${MSTR_CIK}/${filing.accession}`;

    let btc: number | null = null;

    // 1. Try the primary document (sometimes this IS the ex-99.1 press release)
    const primaryUrl = `${baseUrl}/${filing.doc}`;
    const primaryText = await edgarGet(primaryUrl);
    if (primaryText) btc = parseBtcFromText(primaryText);

    console.log(
      `[fetch-holdings] ${filing.date} primary="${filing.doc}" btc=${btc ?? "not found"}`
    );

    // 2. If primary doc had no BTC count, try the standard exhibit 99.1 name used
    //    by MSTR's external filing agents (Donnelley, Workiva, etc.)
    if (btc === null) {
      const exhibitText = await edgarGet(`${baseUrl}/mstr-ex99_1.htm`);
      if (exhibitText) {
        btc = parseBtcFromText(exhibitText);
        if (btc !== null) {
          console.log(
            `[fetch-holdings] ${filing.date} matched mstr-ex99_1.htm btc=${btc}`
          );
        }
      }
    }

    // Non-BTC 8-K filings (exec comp, board changes, etc.) won't match — skip them
    if (btc === null) continue;

    entries.push({
      date: filing.date,
      btc_holdings: btc,
      shares_outstanding: 0, // placeholder; filled in by fetchHoldings()
    });
  }

  console.log(`[fetch-holdings] parsed ${entries.length} live BTC entries`);
  return entries;
}

async function fetchCurrentSharesOutstanding(): Promise<number> {
  const result = await yahooFinance.quoteSummary("MSTR", {
    modules: ["defaultKeyStatistics"],
  });
  const shares = result.defaultKeyStatistics?.sharesOutstanding;
  if (!shares || shares <= 0) {
    throw new Error("sharesOutstanding unavailable from Yahoo Finance");
  }
  return shares;
}

/**
 * Returns the full holdings timeline, merging static history from
 * data/holdings.json with any new 8-K filings from SEC EDGAR.
 * Result is cached in memory for 24 hours. Falls back to static
 * data if the live fetch fails.
 */
export async function fetchHoldings(): Promise<HoldingsEntry[]> {
  const now = Date.now();
  if (holdingsCache && now - holdingsCache.fetchedAt < CACHE_TTL_MS) {
    return holdingsCache.holdings;
  }

  const staticHoldings = loadStaticHoldings();
  const lastStaticDate = staticHoldings[staticHoldings.length - 1].date;

  try {
    const [liveEntries, sharesOutstanding] = await Promise.all([
      fetchLiveHoldingsFromEdgar(lastStaticDate),
      fetchCurrentSharesOutstanding(),
    ]);

    // Apply current shares outstanding to all newly-parsed entries
    for (const entry of liveEntries) {
      entry.shares_outstanding = sharesOutstanding;
    }

    // Merge: static baseline + live entries; live wins on duplicate dates
    const liveByDate = new Map(liveEntries.map((e) => [e.date, e]));
    const merged: HoldingsEntry[] = [
      ...staticHoldings.filter((e) => !liveByDate.has(e.date)),
      ...liveEntries,
    ].sort((a, b) => a.date.localeCompare(b.date));

    holdingsCache = { holdings: merged, fetchedAt: now };
    return merged;
  } catch (err) {
    console.error(
      "[fetch-holdings] live fetch failed, falling back to static data:",
      err
    );
    // Cache the static result too so we do not hammer failing endpoints
    holdingsCache = { holdings: staticHoldings, fetchedAt: now };
    return staticHoldings;
  }
}
