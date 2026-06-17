import type { DailyRow } from "@/types";

/** Parse YYYY-MM-DD at local noon to avoid DST edge cases in day bucketing. */
function dateAtNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

/**
 * X-axis tick labels for daily series: short spans show month+day; longer spans
 * show month+year so labels stay meaningful regardless of which dates Recharts samples.
 */
export function makeXAxisTickFormatter(rows: DailyRow[]): (value: string) => string {
  if (rows.length === 0) {
    return () => "";
  }
  if (rows.length === 1) {
    const d = dateAtNoon(rows[0].date);
    return () =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const start = dateAtNoon(rows[0].date).getTime();
  const end = dateAtNoon(rows[rows.length - 1].date).getTime();
  const spanDays = Math.max(1, (end - start) / 86_400_000);

  if (spanDays <= 60) {
    return (iso: string) =>
      dateAtNoon(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (iso: string) =>
    dateAtNoon(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
