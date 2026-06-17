import EmbedChart from "@/components/embed-chart";
import { loadMnavRows } from "@/lib/mnav-data";
import type { DateRange } from "@/types";

type EmbedPageProps = {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{
    range?: string;
    theme?: string;
    showWatermark?: string;
  }>;
};

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const { ticker } = await params;
  const query = await searchParams;
  const validRanges: DateRange[] = ["30d", "90d", "ytd", "1y", "all"];
  const range = validRanges.includes(query.range as DateRange)
    ? (query.range as DateRange)
    : "1y";
  const theme = query.theme === "light" ? "light" : "dark";
  const showWatermark = query.showWatermark !== "false";
  const symbol = ticker.toUpperCase();
  const { rows } = await loadMnavRows(symbol, range);

  return (
    <main className="mx-auto max-w-4xl p-4">
      <EmbedChart rows={rows} theme={theme} showWatermark={showWatermark} />
    </main>
  );
}
