import crypto from "node:crypto";
import { getDb } from "@/lib/db";

type ApiKeyRow = {
  tier: string;
  requests_per_minute: number;
  is_active: number;
};

const minuteBuckets = new Map<string, { minute: number; count: number }>();
const DEFAULT_DEMO_KEY = "demo-dat-radar-key";
const DEFAULT_RATE_LIMIT = 60;

export type ApiKeyValidation = {
  valid: boolean;
  tier?: string;
  reason?: string;
};

function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function checkRateLimit(rawApiKey: string, limit: number): ApiKeyValidation {
  const nowMinute = Math.floor(Date.now() / 60000);
  const bucket = minuteBuckets.get(rawApiKey);
  if (!bucket || bucket.minute !== nowMinute) {
    minuteBuckets.set(rawApiKey, { minute: nowMinute, count: 1 });
    return { valid: true, tier: "free" };
  }
  if (bucket.count >= limit) {
    return { valid: false, reason: "Rate limit exceeded" };
  }
  bucket.count += 1;
  minuteBuckets.set(rawApiKey, bucket);
  return { valid: true, tier: "free" };
}

function validateDemoKey(rawApiKey: string): ApiKeyValidation {
  const demoKey = process.env.DEMO_API_KEY ?? DEFAULT_DEMO_KEY;
  if (rawApiKey !== demoKey) {
    return { valid: false, reason: "Invalid API key" };
  }
  return checkRateLimit(rawApiKey, DEFAULT_RATE_LIMIT);
}

export function validateApiKey(rawApiKey: string | null): ApiKeyValidation {
  if (!rawApiKey) return { valid: false, reason: "Missing API key" };

  try {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT tier, requests_per_minute, is_active FROM api_keys WHERE key_hash = ? LIMIT 1"
      )
      .get(hashKey(rawApiKey)) as ApiKeyRow | undefined;

    if (!row || row.is_active !== 1) {
      return validateDemoKey(rawApiKey);
    }

    const nowMinute = Math.floor(Date.now() / 60000);
    const bucket = minuteBuckets.get(rawApiKey);
    if (!bucket || bucket.minute !== nowMinute) {
      minuteBuckets.set(rawApiKey, { minute: nowMinute, count: 1 });
      return { valid: true, tier: row.tier };
    }

    if (bucket.count >= row.requests_per_minute) {
      return { valid: false, reason: "Rate limit exceeded" };
    }
    bucket.count += 1;
    minuteBuckets.set(rawApiKey, bucket);
    return { valid: true, tier: row.tier };
  } catch {
    return validateDemoKey(rawApiKey);
  }
}
