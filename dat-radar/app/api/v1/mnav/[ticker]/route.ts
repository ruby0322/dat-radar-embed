import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth-api-key";
import { loadMnavRowsFromDb, computeKpiFromRows } from "@/lib/mnav-data";
import type { ApiV1MnavResponse, DateRange } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
): Promise<NextResponse> {
  try {
    const apiKey = request.headers.get("x-api-key");
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 401 });
    }

    const { ticker } = await params;
    const symbol = ticker.toUpperCase();
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") ?? "1y";
    const validRanges: DateRange[] = ["30d", "90d", "ytd", "1y", "all"];
    const range: DateRange = validRanges.includes(rangeParam as DateRange)
      ? (rangeParam as DateRange)
      : "1y";

    const rows = loadMnavRowsFromDb(symbol, range);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No data found. Run pipeline/run_etl.sh first." },
        { status: 404 }
      );
    }

    const body: ApiV1MnavResponse = {
      ticker: symbol,
      range,
      rows,
      kpi: computeKpiFromRows(rows),
      source: "database",
    };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
