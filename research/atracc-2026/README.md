# Auditing Evidence Claims in Federal High-Impact AI Exclusions

This directory contains the code and research artifacts for the full paper accepted at ATRACC in the AAAI Fall Symposium Series 2026.

**Authors**

- Hema Raju Barri, Johns Hopkins University
- Venkateswarlu Nagineni, Texas A&M University

[Read the accepted paper](../../public/papers/auditing-evidence-claims-atracc-2026.pdf)

## Package contents

| Path | Contents |
| --- | --- |
| `experiments/` | Analysis, scoring, audit, runner, and verification programs |
| `protocols/` | Locked component codebook used by the study |
| `output/experiments/atracc_v3/` | Archived five-reading panel, prompts, responses, and validation manifests |
| `output/experiments/atracc_v4/` | Constructed conformance cases and repair analyses |
| `output/experiments/atracc_v5/` | Record and template reconciliation, model replication, repair routes, and document audit |
| `output/experiments/atracc_v6/` | Exact-request repeats, stability diagnostics, and ambiguity sensitivity |
| `output/experiments/atracc_v7/` | Prospective evidence-response experiment with 700 saved responses |
| `outputs/atracc_human_validation/` | Blank independent annotation instrument. No completed human labels are claimed |
| `tmp/omb-data/` | Archived federal inventory source snapshot |
| `tmp/M-25-21.pdf` | Policy memorandum used to define the instrument |
| `PACKAGE_MANIFEST.json` | Byte counts and SHA-256 hashes for the published files |

The package includes the prompts, raw response envelopes, parsed outputs, row mappings, saved protocols, full-document checks, and summary tables used in the paper. API credentials are not included.

## Verify the published results

Python 3.11 or newer is required. The verification commands use local files and make no network requests.

```bash
python3 experiments/verify_atracc_v5.py
python3 experiments/verify_atracc_v6.py
python3 experiments/verify_atracc_v7.py
python3 verify_package.py
```

The expected results are:

- 1,309 v5 integrity and numerical checks
- 2,959 v6 repeat and provenance checks
- 29 v7 published-claim checks over 700 responses
- A complete package hash check

These checks reproduce the stored arithmetic and verify artifact identity. They do not establish independent human validation, legal correctness, or semantic ground truth.

## Rebuild the analysis tables

```bash
python3 experiments/atracc_revision_v5.py
python3 experiments/score_atracc_replication_v5.py
python3 experiments/build_atracc_review_queue_v5.py
python3 experiments/score_atracc_repeat_v6.py
python3 experiments/atracc_ambiguity_sensitivity_v6.py
python3 experiments/score_atracc_metamorphic_v7.py
```

The saved result files are sufficient for offline reproduction. The runner programs are included to document the request protocol. A fresh API run creates new observations, may incur provider charges, and is not needed to reproduce the reported counts.

## Study boundaries

The S, U, and D labels are outputs of the stated audit instrument. They are not expert ground truth or legal determinations. Historical model identifiers that were unavailable remain unavailable. No identifiers were guessed or reconstructed.

Please cite the paper and this repository when reusing the materials. Citation metadata is provided in `CITATION.cff`.
