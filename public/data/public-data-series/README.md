# Public-data experiment bundle

Generated on August 23, 2026 (America/New_York). Exact UTC retrieval time is in
`manifest.json`. These are descriptive analyses, not causal estimates.

## Core outputs

- `api-error-recovery.csv` — one malformed-request probe for eight public APIs;
  the six scoring columns are visible and additive.
- `open-data-metadata-audit.csv` — dataset-level Socrata Discovery metadata for
  six portals.
- `open-data-metadata-summary.csv` — portal-level aggregation of that audit.
- `nyc-311-channel-access.csv` — 2025 NYC 311 ZIP/channel aggregates joined to
  2024 ACS five-year ZCTA characteristics.
- `nyc-311-channel-income-quartiles.csv` — request-weighted digital channel
  shares by median-income quartile.
- `state-priority-ranking-fragility.csv` — four-variable state score under
  deterministic and random weights.
- `federal-register-comment-burden.csv` — 2025 proposed rules with page length,
  comment window, and pages per thirty comment days.
- `federal-register-agency-comment-burden.csv` — agency summaries for agencies
  with at least ten valid proposed-rule records.
- `world-bank-strict-2023-coverage.csv` — same-year coverage for four digital
  infrastructure indicators.
- `world-bank-latest-window-coverage.csv` — latest nonmissing 2020–2024 value
  and vintage for those indicators.
- `world-bank-coverage-by-income.csv` — coverage summaries by World Bank income
  group.
- `manifest.json` — compact results, source list, and run metadata.

Large live-API response excerpts and Census inputs are not included in this
compact download archive. The included files document the published results,
sources, and exclusions.

## Key exclusions

- NYC ZCTAs require at least 1,000 ACS residents and 100 service requests.
- Puerto Rico is excluded from the state ranking; DC is included.
- Federal Register association analysis keeps page lengths from 1–3,000 and
  comment windows from 1–365 days.
- The World Bank analysis uses the Bank's economy list, which includes
  territories, and four specified indicators only.
