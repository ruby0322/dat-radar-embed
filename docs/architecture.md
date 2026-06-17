# DAT Radar Architecture Overview

DAT Radar is a B2B data product that exposes MSTR mNAV analytics through an API and embeddable iframe widget.

## End-to-end data flow

```mermaid
flowchart LR
  subgraph ingestion [Ingestion]
    YF[YahooFinance]
    ED[SEC_EDGAR_8K]
  end

  subgraph processing [BatchProcessing]
    ETL[Python_ETL]
    MR[MapReduce_Analytics]
  end

  subgraph storage [Storage]
    SQL[(SQLite_or_PostgreSQL)]
    PQ[Parquet_Archive]
  end

  subgraph delivery [Delivery]
    API[REST_API_v1]
    EMBED[Embed_iframe]
    DEMO[Partner_Demo_Page]
  end

  YF --> ETL
  ED --> ETL
  ETL --> SQL
  ETL --> PQ
  SQL --> MR
  MR --> SQL
  SQL --> API
  API --> EMBED
  API --> DEMO
```

## Components

- `pipeline/`: scheduled ETL, holdings ingestion, mNAV computation, map-reduce style analytics
- `storage/schema.sql`: relational schema for prices, holdings, mNAV daily rows, API keys
- `dat-radar/app/api/v1/mnav/[ticker]/route.ts`: partner-facing API endpoint
- `dat-radar/app/embed/[ticker]/page.tsx`: iframe-safe chart widget
- `dat-radar/app/demo/page.tsx`: integration guide for partner developers

## Scaling notes

- 10x scale: move from SQLite to managed PostgreSQL (Neon/Supabase), add read replicas
- 100x scale: Spark batch on parquet lake, pre-aggregate tiles for embed workloads, add cache/CDN
