# Deployment Guide (Vercel + Neon + GitHub Actions)

## 1. Provision database

1. Create a Neon (or Supabase) PostgreSQL project.
2. Import `storage/schema.sql`.
3. Seed `api_keys` with hashed partner keys.

For local/demo, SQLite (`data/dat_radar.db`) remains supported.

## 2. Configure Vercel

Deploy `dat-radar/` as the project root and set environment variables:

- `DB_PATH` (for SQLite demo) or migrate `lib/db.ts` to PostgreSQL DSN mode
- `OPENAI_API_KEY` (optional AI narrative)
- `DEMO_API_KEY` (default demo key fallback exists)
- `NEXT_PUBLIC_BASE_URL` (for demo snippets)

## 3. Schedule ETL

GitHub Actions workflow exists at `.github/workflows/daily-etl.yml`.

Required repository secrets (if needed for hosted DB):

- `SEC_USER_AGENT`
- `DATABASE_URL` (if using PostgreSQL variant)

## 4. Smoke checks after deploy

- `GET /api/v1/mnav/MSTR?range=90d` with `X-API-Key`
- `/embed/MSTR?range=1y&theme=dark`
- `/demo`
