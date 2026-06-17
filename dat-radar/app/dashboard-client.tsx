"use client";

import { useState, useEffect } from "react";
import KpiCard from "@/components/kpi-card";
import MnavChart from "@/components/mnav-chart";
import BtcChart from "@/components/btc-chart";
import DateRangeSelector from "@/components/date-range-selector";
import { AiInsightPanel } from "@/components/ai-insight-panel";
import { buildInsightPayload } from "@/lib/compute-indicators";
import type { DateRange, MarketDataResponse, InsightPayload } from "@/types";

function formatDelta(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(3)}×`;
}

function formatLastUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function DashboardClient() {
  const [range, setRange] = useState<DateRange>("1y");
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleRangeChange = (next: DateRange) => {
    setLoading(true);
    setError(null);
    setRange(next);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount((c) => c + 1);
  };

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/market-data?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json() as Promise<MarketDataResponse>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range, retryCount]);

  const insightPayload: InsightPayload | null =
    data && data.rows.length > 0 ? buildInsightPayload(data.rows) : null;

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--amber)" }}
            >
              DAT Radar
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              MSTR mNAV Dashboard · B2B Embed Data Feed
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            {data && (
              <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                Updated {formatLastUpdated(data.kpi.last_updated)}
              </p>
            )}
            <a href="/demo" className="text-xs underline" style={{ color: "var(--amber)" }}>
              Partner integration demo
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div
              className="animate-pulse rounded-full"
              style={{
                width: 40,
                height: 40,
                backgroundColor: "var(--amber-dim)",
              }}
            />
            <p style={{ color: "var(--text-secondary)" }}>Loading market data…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-24">
            <p style={{ color: "var(--red)" }}>{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard content */}
        {!loading && !error && data && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Current mNAV"
                value={data.kpi.current_mnav.toFixed(3) + "×"}
                delta={formatDelta(data.kpi.mnav_30d_change)}
                deltaPositive={data.kpi.mnav_30d_change > 0}
              />
              <KpiCard
                label="30D Change"
                value={formatDelta(data.kpi.mnav_30d_change)}
                deltaPositive={data.kpi.mnav_30d_change > 0}
              />
              <KpiCard
                label="BTC Holdings"
                value={data.kpi.btc_holdings.toLocaleString() + " BTC"}
              />
              <KpiCard
                label="BTC / Share"
                value={data.kpi.btc_per_share.toFixed(6) + " BTC"}
              />
            </div>

            {/* Date range selector */}
            <DateRangeSelector value={range} onChange={handleRangeChange} />

            {/* mNAV chart */}
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: "var(--text-secondary)" }}
              >
                mNAV — Market Cap / BTC Treasury Value
              </p>
              <MnavChart rows={data.rows} />
            </div>

            {/* BTC price chart */}
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: "var(--text-secondary)" }}
              >
                Bitcoin Spot Price (USD)
              </p>
              <BtcChart rows={data.rows} />
            </div>

            {/* AI Insight panel */}
            {insightPayload && <AiInsightPanel payload={insightPayload} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          marginTop: "auto",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <p className="text-xs font-mono">
            <strong style={{ color: "var(--text-primary)" }}>mNAV</strong> ={" "}
            Market Cap / (BTC Holdings × BTC Spot Price)
          </p>
          <p className="text-xs">
            Sources: MSTR & BTC-USD daily prices via Yahoo Finance ·
            Holdings from SEC 8-K / 10-Q filings
          </p>
          <p className="text-xs">
            For informational purposes only. Not investment advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
