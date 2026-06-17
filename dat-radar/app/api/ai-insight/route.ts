import { buildPrompt } from "@/lib/build-prompt";
import type { InsightPayload, InsightResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { APIError } from "openai";

const cache = new Map<string, InsightResponse>();

const REQUIRED_NUMERIC_FIELDS: (keyof InsightPayload)[] = [
  "current_mnav",
  "mnav_30d_ago",
  "mnav_min",
  "mnav_max",
  "mnav_mean",
  "btc_price_now",
  "btc_price_30d_ago",
  "btc_holdings",
];

const REQUIRED_STRING_FIELDS: (keyof InsightPayload)[] = [
  "date_range_start",
  "date_range_end",
];

function isValidPayload(body: unknown): body is InsightPayload {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;

  for (const field of REQUIRED_NUMERIC_FIELDS) {
    if (typeof obj[field] !== "number" || !isFinite(obj[field] as number)) {
      return false;
    }
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof obj[field] !== "string" || (obj[field] as string).trim() === "") {
      return false;
    }
  }

  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: "Missing or invalid fields. All 10 fields are required." },
      { status: 400 }
    );
  }

  const payload: InsightPayload = body;
  const cacheKey = JSON.stringify(payload);

  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is missing or empty. Put it in .env.local next to package.json (not the parent folder), then restart the dev server.",
      },
      { status: 503 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey });
    const prompt = buildPrompt(payload);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const result: InsightResponse = {
      insight: content,
      generated_at: new Date().toISOString(),
    };

    cache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof APIError) {
      const inner =
        err.error &&
        typeof err.error === "object" &&
        "message" in err.error &&
        typeof (err.error as { message: unknown }).message === "string"
          ? (err.error as { message: string }).message
          : err.message;
      return NextResponse.json(
        { error: `OpenAI API error (${String(err.status)}): ${inner}` },
        { status: 500 }
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
