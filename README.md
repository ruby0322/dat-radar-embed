# DAT Radar Embed (BDA Final Project)

DAT Radar is a data-monetization project built from the previous MSTR mNAV dashboard homework.
It turns raw SEC + market data into a **B2B product**: API feed + embeddable iframe widget.

## Repository structure

- `dat-radar/`: Next.js app (dashboard + partner API + embed widget)
- `pipeline/`: Python ETL pipeline and MapReduce-style analytics
- `storage/schema.sql`: database schema
- `docs/`: architecture and demand-evidence methodology
- `scripts/collect_demand_evidence.py`: reproducible demand-signal collector
- `report/report.md`: final report source

## Quick start

### 1) Install dependencies

```bash
cd dat-radar
npm install
cd ..
python3 -m pip install -r pipeline/requirements.txt
```

### 2) Run ETL (build local DB)

```bash
./pipeline/run_etl.sh
```

This creates `data/dat_radar.db` and parquet outputs under `data/parquet/`.

### 3) Start app

```bash
cd dat-radar
npm run dev
```

Open:

- Dashboard: `http://localhost:3000/`
- Partner demo: `http://localhost:3000/demo`
- Embed widget: `http://localhost:3000/embed/MSTR?range=1y&theme=dark`

### 4) Test B2B API

```bash
curl "http://localhost:3000/api/v1/mnav/MSTR?range=90d" \
  -H "X-API-Key: demo-dat-radar-key"
```

## Deployment setup

- App deployment: Vercel (`dat-radar/`)
- Database: Neon/Supabase Postgres (or SQLite for demo)
- Scheduled ETL: GitHub Actions workflow (`.github/workflows/daily-etl.yml`)

## Demand evidence reproduction

```bash
python3 scripts/collect_demand_evidence.py
```

Raw outputs are written into `docs/demand-evidence/raw/`.

## Report figures (screenshots + diagram)

With the dev server running:

```bash
./scripts/capture_report_assets.sh
cd report && ./convert-to-pdf.sh report.md r14725076.pdf
```

Uses headless Chrome (no Playwright download) to capture dashboard, demo, and embed pages.
