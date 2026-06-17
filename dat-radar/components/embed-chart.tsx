"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyRow } from "@/types";

type Props = {
  rows: DailyRow[];
  theme: "dark" | "light";
  showWatermark?: boolean;
};

export default function EmbedChart({ rows, theme, showWatermark = true }: Props) {
  return (
    <div
      className="w-full rounded-xl border p-3"
      style={{
        borderColor: theme === "dark" ? "#334155" : "#d1d5db",
        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
      }}
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#e5e7eb"} />
            <XAxis dataKey="date" minTickGap={32} stroke={theme === "dark" ? "#94a3b8" : "#64748b"} />
            <YAxis domain={["auto", "auto"]} stroke={theme === "dark" ? "#94a3b8" : "#64748b"} />
            <Tooltip />
            <ReferenceLine y={1} stroke={theme === "dark" ? "#f59e0b" : "#ca8a04"} />
            <Line type="monotone" dataKey="mnav" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showWatermark ? (
        <p className="mt-2 text-right text-xs text-slate-500">Powered by DAT Radar</p>
      ) : null}
    </div>
  );
}
