import { NextRequest, NextResponse } from "next/server";
import { computeKpiFromRows, loadMnavRows } from "@/lib/mnav-data";
import type { DateRange, MarketDataResponse } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") ?? "1y";
    const validRanges: DateRange[] = ["30d", "90d", "ytd", "1y", "all"];
    const range: DateRange = validRanges.includes(rangeParam as DateRange)
      ? (rangeParam as DateRange)
      : "1y";

    const { rows, source } = await loadMnavRows("MSTR", range);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No market data available" }, { status: 404 });
    }

    const body: MarketDataResponse = { rows, kpi: computeKpiFromRows(rows) };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store", "X-DAT-Radar-Source": source },
    });
  } catch (err) {
    console.error("[market-data]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
