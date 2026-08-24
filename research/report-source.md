# Public-data essay series: research source report

Research run: 23 August 2026 (America/New_York). Data retrieval timestamps are
recorded in `public/data/public-data-series/manifest.json` in UTC.

## Question and novelty test

The series asks a single broad question from six non-overlapping empirical
angles: where does institutional power move when public action becomes more
machine-mediated? An idea was retained only if it had (1) a public-data test,
(2) a finding that could have contradicted the initial intuition, (3) a distinct
unit of analysis, and (4) a practical implication that did not depend on calling
an existing concept by a new name.

| Essay | Unit of analysis | Prior literature usually asks | Gap tested here | Evidence that would weaken the claim |
| --- | --- | --- | --- | --- |
| Error message | API failure response | Is the API available or standards-compliant? | Does the response allocate repair capacity to the caller? | Malformed requests fail consistently, identify the input, and give machine-actionable recovery across APIs. |
| Catalog columns | Dataset metadata record | Is data published, fresh, licensed, downloadable? | Are freshness and semantic legibility independent? | Fresh metadata reliably predicts described fields and recoverable schemas. |
| 311 channel | ZIP-code-by-channel request pattern | Who reports more or less? | Does digital participation differ even where overall participation is high? | Channel mix is unrelated to income and broadband after basic restrictions. |
| Priority ranking | State under alternative score constructions | Which place is most vulnerable? | How much of a priority list is chosen by weights and aggregation? | Top-ten membership is stable across defensible weight choices. |
| Comment burden | Proposed rule | How long is the comment window? | Does calendar time scale with the attention the proposal demands? | Page length and comment time move closely together, especially in the upper tail. |
| Global comparison | Country/economy-indicator-year | Which economy is digitally ready? | What is traded away when analysts improve geographic coverage? | A same-year, four-indicator comparison covers nearly all economies, or latest-value inclusion adds no mixed vintages. |

## Source hierarchy

Primary data and documentation were preferred:

- IETF RFC 9457, *Problem Details for HTTP APIs*: https://www.rfc-editor.org/rfc/rfc9457.html
- Official API documentation for openFDA, USGS, NHTSA, Federal Register,
  World Bank, NASA EONET, National Weather Service, and U.S. Treasury (links in
  `api-error-recovery.csv`).
- Socrata Discovery/SODA documentation: https://dev.socrata.com/docs/endpoints.html
- NYC 311 data: https://data.cityofnewyork.us/d/erm2-nwe9
- Census ACS table-based Summary File documentation:
  https://www.census.gov/programs-surveys/acs/data/summary-file.html
- OECD/EU/JRC composite-indicator handbook:
  https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html
- Federal Register API documentation:
  https://www.federalregister.gov/developers/documentation/api/v1
- Office of the Federal Register, *The Rulemaking Process*:
  https://uploads.federalregister.gov/uploads/2013/09/The-Rulemaking-Process.pdf
- World Bank Indicators API documentation:
  https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

Contextual research used to locate the contribution rather than substitute for
the new analysis:

- Kontokosta et al., *Equity in 311 Reporting*:
  https://arxiv.org/abs/1710.02452
- Clark et al., *Bias in smart city governance*:
  https://doi.org/10.1016/j.scs.2020.102503
- Greco et al., *On the Methodological Framework of Composite Indices*:
  https://doi.org/10.1007/s11205-017-1832-9
- Mahler, Serajuddin, and Maeda, *When is there enough data to create a global statistic?*:
  https://doi.org/10.3233/SJI-220090
- Wiśniewski et al., *Do Agents Need Semantic Metadata?*:
  https://arxiv.org/abs/2605.28787

## Interpretation rules

1. Associations are described as associations; none of the six studies is
   presented as causal.
2. A live-API probe is a dated snapshot, not a permanent product ranking.
3. Metadata age is not data staleness. Static datasets can be legitimately old.
4. Incident ZIP is not necessarily a 311 caller's residence.
5. The state score is an illustrative decision rule, not a validated index.
6. Federal Register page count is a rough burden proxy and omits attachments,
   prior expertise, and organizational capacity.
7. World Bank “countries” include economies and territories; coverage patterns
   therefore should not be simplified into a rich-country/poor-country story.

## Compact claim-to-source ledger

| Claim | Direct evidence | Scope/qualifier |
| --- | --- | --- |
| Three of eight malformed requests returned HTTP 200. | `api-error-recovery.csv` | One deliberately malformed request per API, observed 23 Aug 2026 ET. |
| 56.6% of 6,607 catalogued datasets exposed no column descriptions. | `open-data-metadata-audit.csv` | Six Socrata portals; all dataset assets returned by the Discovery API at retrieval. |
| Higher-income NYC ZCTAs used digital 311 channels more often. | `nyc-311-channel-access.csv` | 2025 cross-section; incident ZIP and ACS ZCTA joined; not causal. |
| Only five equal-weight top-ten states had at least 80% top-ten probability under random weights. | `state-priority-ranking-fragility.csv` | Broad Dirichlet weight diagnostic; four chosen dimensions. |
| Page length and comment-window length were only weakly associated. | `federal-register-comment-burden.csv` | 2025 proposed rules with 1–365 day windows and 1–3,000 pages. |
| Latest-value selection raised complete coverage but mixed vintages in 23.9% of included economies. | `world-bank-latest-window-coverage.csv` | Four specified infrastructure indicators; latest non-null observation from 2020–2024. |

