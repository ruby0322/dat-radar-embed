import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const demoApiKey = process.env.DEMO_API_KEY ?? "demo-dat-radar-key";
  return NextResponse.json({
    token: demoApiKey,
    note: "Demo token for course grading. Replace with per-partner issued key in production.",
  });
}
