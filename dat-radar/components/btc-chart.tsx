"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { makeXAxisTickFormatter } from "@/lib/chart-x-axis";
import { DailyRow } from "@/types";

interface BtcChartProps {
  rows: DailyRow[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: DailyRow }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const price = payload[0]?.value;
  if (price === undefined) return null;

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
        <span style={{ color: "var(--text-secondary)" }}>BTC: </span>
        <span style={{ color: "#60a5fa" }}>
          ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}

const yTickFormatter = (v: number): string =>
  v >= 1000 ? "$" + (v / 1000).toFixed(0) + "k" : "$" + v.toFixed(0);

export default function BtcChart({ rows }: BtcChartProps) {
  const xTickFormatter = useMemo(() => makeXAxisTickFormatter(rows), [rows]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
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
        <Line
          dataKey="btc_price"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
