"use client";

import { DateRange } from "@/types";

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const RANGES: { label: string; value: DateRange }[] = [
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "YTD", value: "ytd" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {RANGES.map((range) => {
        const isActive = range.value === value;
        return (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: isActive ? "var(--amber)" : "var(--surface)",
              color: isActive ? "#0d0d0d" : "var(--text-secondary)",
              border: isActive ? "1px solid var(--amber)" : "1px solid var(--border)",
            }}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
