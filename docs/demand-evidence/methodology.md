# Demand Evidence Methodology

This document records how we collect evidence that a B2B embedded mNAV feed has real demand and willingness-to-pay.

## Process

1. **Define customer segment**
   - Role: FinTech engineers and product managers building crypto-facing dashboards
   - Job-to-be-done: show reliable DAT.co treasury valuation signals without maintaining a custom SEC parser
2. **Benchmark competitor pricing**
   - Reference products: Messari, Finnhub, TradingView widgets
   - Collect baseline monthly prices and packaging differences
3. **Collect market signal data**
   - Hacker News keyword counts (`bitcoin treasury`, `MSTR mNAV`)
   - Reddit community size and activity (`r/Bitcoin`, `r/MSTR`, `r/CryptoCurrency`)
4. **Estimate economic value**
   - Compare subscription fee vs. in-house implementation costs (engineering hours + maintenance)
5. **Record reproducibility**
   - Save all raw outputs under `docs/demand-evidence/raw/`

## Reproducible command

```bash
python3 scripts/collect_demand_evidence.py
```

## Optional interview/survey template

- Current workflow for DAT treasury data?
- How often does stale/incorrect data create incidents?
- Would you pay for API + embed + SLA? If yes, acceptable monthly budget?
- Preferred packaging: API-only, embed-only, or bundled?
