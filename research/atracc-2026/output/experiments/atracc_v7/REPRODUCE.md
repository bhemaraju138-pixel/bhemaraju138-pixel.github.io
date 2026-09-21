# ATRACC v7 Reproduction Guide

The v7 addition is a prospective metamorphic audit of the locked public-rebuttal codebook. It uses 70 distinct inventory rationales, five text conditions, and two OpenAI models. The resulting 700 first responses are archived. This experiment tests whether the computational judges follow declared response relations; it is not independent human validation and does not alter the federal records.

## Offline reproduction

Run these commands from the root of the extracted archive. They require Python 3.11 or later and do not make API calls.

```bash
python experiments/score_atracc_metamorphic_v7.py
python experiments/verify_atracc_v7.py
```

The scorer verifies the frozen inputs and codebook, requires all 700 unique model-case pairs, reconstructs every paired comparison, and writes:

- `output/experiments/atracc_v7/metamorphic/summary.json`
- `output/experiments/atracc_v7/metamorphic/SUMMARY.md`
- `output/experiments/atracc_v7/metamorphic/paired_results.csv`
- `output/experiments/atracc_v7/metamorphic/anomalies.csv`

The frozen plan tests the human-review addition against any new qualifying mechanism and the generic multiple-source addition against a new independent-basis mechanism. It tests both weak additions for any non-S-to-S transition. Aggregate-mechanism and eligible-S subsets reported alongside these endpoints are additional post-review diagnostics; the archived prospective manifest is unchanged.

## Frozen design and evidence

- Codebook SHA-256: `0a1dffe440a2e8d837339873e891c5cabef8076f806ec8f971f52fd314eeaa84`
- Prospective manifest SHA-256: `af2a95dff62fe6466d78a95311589626f7df1d0364fc2dab7ce5d20bea9ea9d6`
- Input file SHA-256: `e08221a0c781985b2dac65efb46297ac059e3e3a7c2093de42e6b8527490eeb7`
- Result file SHA-256: `ea9ce5d49c2ca43db8827bf267ecda255b6b133227c265c9016c7777ef8e64c7`

The API runner is included for protocol inspection. Re-running it would create new observations and is unnecessary for reproducing the paper's counts.

## Earlier analyses

The v5 and v6 reproduction guides and scripts regenerate the census, reconciliation, agency and template sensitivity, identifiable model replication, exact repeats, ambiguity sensitivity, repair routes, and complete-document audit. Their saved outputs remain part of the final package.
