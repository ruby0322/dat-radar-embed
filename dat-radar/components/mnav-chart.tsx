"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { makeXAxisTickFormatter } from "@/lib/chart-x-axis";
import { DailyRow } from "@/types";

interface MnavChartProps {
  rows: DailyRow[];
}

interface EnrichedRow extends DailyRow {
  mnav_band_low: number | null;
  mnav_band_high: number | null;
}

interface TooltipPayloadEntry {
  name: string;
  value: number | null;
  color: string;
  payload: EnrichedRow;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div
      className="rounded-lg p-3 text-sm font-mono space-y-1 shadow-xl"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
      }}
    >
      <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div>
        <span style={{ color: "var(--text-secondary)" }}>mNAV: </span>
        <span style={{ color: "var(--amber)" }}>{row.mnav.toFixed(3)}×</span>
      </div>
      {row.mnav_30d_avg !== null && (
        <div>
          <span style={{ color: "var(--text-secondary)" }}>30D Avg: </span>
          <span style={{ color: "#999" }}>{row.mnav_30d_avg.toFixed(3)}×</span>
        </div>
      )}
      <div>
        <span style={{ color: "var(--text-secondary)" }}>BTC: </span>
        <span>${row.btc_price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
      </div>
      <div>
        <span style={{ color: "var(--text-secondary)" }}>MSTR: </span>
        <span>${row.mstr_price.toFixed(2)}</span>
      </div>
    </div>
  );
}

const yTickFormatter = (v: number): string => v.toFixed(2) + "×";

export default function MnavChart({ rows }: MnavChartProps) {
  const xTickFormatter = useMemo(() => makeXAxisTickFormatter(rows), [rows]);

  const enrichedRows: EnrichedRow[] = rows.map((row) => ({
    ...row,
    mnav_band_low:
      row.mnav_30d_avg !== null && row.mnav_30d_std !== null
        ? row.mnav_30d_avg - row.mnav_30d_std
        : null,
    mnav_band_high:
      row.mnav_30d_avg !== null && row.mnav_30d_std !== null
        ? row.mnav_30d_avg + row.mnav_30d_std
        : null,
  }));

  const purchaseEventDates = rows
    .filter((r) => r.is_purchase_event)
    .map((r) => r.date);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={enrichedRows} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={xTickFormatter}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["auto", "auto"]}
          tickFormatter={yTickFormatter}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* ±1 std band — upper bound */}
        <Line
          dataKey="mnav_band_high"
          stroke="#f59e0b33"
          strokeWidth={1}
          strokeDasharray="4 2"
          dot={false}
          connectNulls
          legendType="none"
        />
        {/* ±1 std band — lower bound */}
        <Line
          dataKey="mnav_band_low"
          stroke="#f59e0b33"
          strokeWidth={1}
          strokeDasharray="4 2"
          dot={false}
          connectNulls
          legendType="none"
        />

        {/* 30D rolling average */}
        <Line
          dataKey="mnav_30d_avg"
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="4 2"
          dot={false}
          connectNulls
          legendType="none"
        />

        {/* mNAV */}
        <Line
          dataKey="mnav"
          stroke="var(--amber)"
          strokeWidth={2}
          dot={false}
          legendType="none"
        />

        {/* Reference line at NAV = 1 */}
        <ReferenceLine y={1} stroke="#444" strokeDasharray="3 3" />

        {/* Purchase event verticals */}
        {purchaseEventDates.map((date) => (
          <ReferenceLine key={date} x={date} stroke="#f59e0b44" strokeWidth={1} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
