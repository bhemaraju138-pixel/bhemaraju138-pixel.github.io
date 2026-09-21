# Reproducing the ATRACC v6 paper

The current paper is an exploratory audit of public reasons and measurement instability. It includes 140 additional exact-request repetitions and an explicit ambiguity-override sensitivity analysis. No independent human annotation was obtained. Agreement and conformance are not semantic accuracy or legal correctness.

## Offline reproduction

From the extracted archive root, use Python 3.12 or newer. No API credentials or network requests are required:

```sh
python3 experiments/atracc_revision_v5.py
python3 experiments/score_atracc_replication_v5.py
python3 experiments/build_atracc_review_queue_v5.py
python3 experiments/verify_atracc_v5.py
python3 experiments/score_atracc_repeat_v6.py
python3 experiments/atracc_ambiguity_sensitivity_v6.py
python3 experiments/verify_atracc_v6.py
```

The v5 commands reproduce the source filter, duplicate reconciliation, agency/template/stage/threshold analyses, repair routes, first model replication, constructed challenges and full-document audit. The v6 commands reproduce all-template exact-repeat comparisons, component-substitution diagnostics and the reported-status sensitivity. The verification scripts pass 1,309 and 2,959 checks, respectively. These checks establish arithmetic and artifact integrity, not semantic validity.

The source snapshot contains 3,611 rows; the exact disclosed category contains 110 rows. Source SHA-256: `a62721202ca4b110ce3c53ffdb688d05ad27a35971a7afda4f1179b2493e31d0`. The unchanged codebook SHA-256 is `0a1dffe440a2e8d837339873e891c5cabef8076f806ec8f971f52fd314eeaa84`.

## Current result map

| File or directory | Meaning |
|---|---|
| `manuscripts/atracc.md` | Current v6 paper source. |
| `output/experiments/atracc_v5/reconciled_records.csv` | Reference partition of 110 records; original labels retained. |
| `output/experiments/atracc_v5/templates.csv` | Seventy whitespace-normalized rationale groups, including one blank. |
| `output/experiments/atracc_v5/replication_v2/` | First replication: 276 completed requests, including 140 inventory readings. |
| `output/experiments/atracc_v6/exact_repeat/` | New run: 140 additional requests, complete raw responses, identical prompts and prospective manifest. |
| `output/experiments/atracc_v6/repeat_summary.json` | Circuit-derived status, component-vector and four-output agreement. |
| `output/experiments/atracc_v6/pair_diagnostics.csv` | Paired component differences and all inclusion-minimal sufficient substitution sets, in both directions. |
| `output/experiments/atracc_v6/template_stability.csv` | Four circuit-derived statuses per template; model order is GPT-5.4 then mini within each round. |
| `output/experiments/atracc_v6/record_review_queue.csv` | Circuit-based stability flags mapped to all 110 records; no expert labels. |
| `output/experiments/atracc_v6/ambiguity_sensitivity.json` | Results using model-reported statuses verbatim. |
| `output/experiments/atracc_v6/reported_circuit_disagreements.csv` | All twelve D-circuit/U-reported differences and their original ambiguity notes. |
| `output/experiments/atracc_v5/full_documents/` | Full PDFs, page-indexed text, retrieval log and bounded-search ledger. |
| `output/experiments/atracc_v5/full_document_audit/` | Fourteen full-document readings, quotation checks and provenance sensitivity. |
| `outputs/atracc_human_validation/` | Original unfilled independent annotation form. |
| `output/revisions/atracc_before_v6/` | Preserved v5 manuscript, Word document and PDF. |

The v5 `REPRODUCE.md` supplies further detail on original data preparation, constructed cases and full-document retrieval. Read it as an earlier version: its ten-case repeat results are preliminary, and its historical field name `formula_status_mismatches` denotes circuit/reported disagreement, not necessarily a model error. The current paper corrects that interpretation.

## Exact-request repeat protocol

Both `gpt-5.4-2026-03-05` and `gpt-5.4-mini-2026-03-17` receive one additional request for every inventory template. Prompt bytes, the opaque identifier and all supplied API settings match their initial inventory requests: medium reasoning, 12,288 maximum output tokens, no tools, low verbosity, `store=false`, with no temperature or seed supplied. Each request contains the unchanged codebook and only one rationale, with no agency, title, existing labels or other records.

The manifest was saved before the additional requests and links each to its original response identifier. It fixes the population, failure rule, settings, input hashes and intended diagnostics. The design was selected after seeing v5; it is not preregistration. All 140 additional first substantive responses were valid and complete. Transport retries, when needed, do not select on semantic correctness. Distinct response IDs establish that saved first-round answers were not reused. Provider backend state and elapsed time are not controlled.

Circuit-status repeat agreement is 62/70 and 57/70; full-vector agreement is 40/70 and 34/70. Four-output status unanimity is 45/70; vector unanimity is 13/70. These observations describe two executions on this finite corpus, not long-run per-case reliability or a universal model property.

The ten v5 diagnostic repeats used changed identifiers and a selected set. Their 6/10 and 7/10 circuit-status agreement is preserved separately. It must not be pooled into the exact-request denominator.

## Ambiguity override correction

Discourse rule 5 in the locked codebook requires U if reasonable interpretations produce different statuses. The six-component circuit does not completely encode that override. H=YES and no W=YES can mechanically produce D while an ambiguity note justifies reporting U.

Seven initial GPT-5.4 responses and five additional responses have this D/U difference; all twelve include ambiguity notes. Four of the initial seven belong to inventory templates and three to the selected diagnostic repeats. They must not automatically be called arithmetic errors. The v6 paper reports circuit-derived outputs as the planned computational decomposition and separately reports the model's returned status verbatim. No new semantic adjudication is invented. This sensitivity was added after inspection of the completed outputs, outside the prospective exact-repeat plan.

Reported-status repeat agreement is 59/70 for GPT-5.4 and 57/70 for mini. Four-output reported-status unanimity is 43/70. GPT-5.4's reported template partition is 32 S / 28 U / 10 D in both rounds, even though eleven template statuses change. Thus aggregate stability can coexist with individual instability under either convention. Mini's reported and circuit statuses coincide.

## Component substitutions

For a pair with different circuit statuses, the scorer replaces subsets of the first component vector with values from the second and enumerates every inclusion-minimal set sufficient to obtain the second status. It repeats this in the reverse direction. Multiple sets may be sufficient; counts are not exclusive causal attributions. No rationale is edited and no model is re-prompted for this diagnostic.

The narrow-role component differs in 26/70 initial between-model comparisons. Its replacement alone suffices in at least one direction for 13/18 initial circuit-status disagreements. Corresponding repeat figures are 7/8 and 5/13. This locates sensitivity in the scoring circuit, not the semantically correct interpretation.

## Prior evidence and its boundaries

Historical v3/v4 artifacts are preserved. Earlier 25/69/16 counts and the withdrawn support interval are not current findings. The reconciled reference is 24/70/16, with U shares 63.6% of records, 50.0% of templates and 48.7% without DOJ. The interval from S to one minus D is not a justified bound on legal correctness or eventual support because D can be repaired.

The initial completed model run contains 276 requests. Both models match 42/47 scoreable synthetic expectations and all eight OPM-anchored constructed challenges. These are construction-time expectations, not independent expert labels. The excluded high-effort/4,096-token pilot and two smoke calls remain separate. Historical five-pass provider model IDs are unavailable and were not invented.

Full-document follow-up covers seven record-PDF pairs representing six distinct PDFs; two collection links did not identify a matching document in bounded searches. Both models mark a candidate mechanism in three pairs, but literal mechanism-and-anchor quotes pass in only two. The strict provenance rule completes zero chains; removing temporal applicability completes one, DHS-310. No inventory label is promoted from these findings. Complete extracted text does not guarantee that visual/scanned content was captured.

## Optional new API executions

`experiments/run_atracc_exact_repeat_v6.py` imports the v5 runner, which imports HTTP helpers from `experiments/run_tas_official_apis_v5.py`. That helper is a code dependency; its unrelated benchmark is not part of ATRACC. The repeat runner resumes already recorded outputs by default. To collect new observations, use a new copy/output directory and preserve the supplied outputs and manifest. Do not replace an unsuccessful or inconvenient semantic answer selectively.

New API executions require a local `.env` containing the user's own `OPEN_AI_API_KEY` and incur provider charges. No credentials are included. Pinned model names do not guarantee future availability or identical judgments. Offline reproduction requires no new calls.

## Paper build

With `python-docx` and Pillow installed:

```sh
python3 scripts/build_atracc_v6.py
```

The output is `output/docx/Barri_ATRACC_2026_Public_Rebuttal_Audit_V6.docx`, using the supplied AAAI 2026 template with named authors. The delivered PDF has seven pages of body text and one page of references, native editable equations and four tables. Its eight pages were visually inspected. All fonts are embedded; the body is Times New Roman. A reference-column break balances the final page and should be rechecked after editing. Convert with Word or LibreOffice and inspect any new export.

Package hashes establish file integrity, not preregistration, expert endorsement or semantic validity.
