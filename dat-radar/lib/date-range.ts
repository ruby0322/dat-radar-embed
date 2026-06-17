import type { DateRange } from "@/types";

export function getDateRange(range: DateRange): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  let startDate: string;

  switch (range) {
    case "30d":
      startDate = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);
      break;
    case "ytd":
      startDate = `${now.getFullYear()}-01-01`;
      break;
    case "1y":
      startDate = new Date(now.getTime() - 365 * 86400000).toISOString().slice(0, 10);
      break;
    case "all":
    default:
      startDate = "2020-08-01";
  }
  return { startDate, endDate };
}
