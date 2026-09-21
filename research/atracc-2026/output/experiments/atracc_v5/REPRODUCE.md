# Reproducing the ATRACC revision

The manuscript is an exploratory audit of disclosed public reasons and the measurement instrument. S/U/D are instrument outputs, not expert ground truth, legal determinations, or observed internal controls.

## Offline numerical reproduction

Use Python 3.12 or newer from the extracted archive root. These scripts use the standard library and do not make network requests:

```sh
python3 experiments/atracc_revision_v5.py
python3 experiments/score_atracc_replication_v5.py
python3 experiments/build_atracc_review_queue_v5.py
python3 experiments/verify_atracc_v5.py
```

The first command regenerates the conservative duplicate-text reconciliation, agency/template/stage/threshold analyses and repair routes. The second scores the two fully logged model runs and the full-document audit. The third writes flags for future review without inventing additional labels. The fourth verifies source/codebook hashes, corpus identity, 550 archived formula evaluations, agreement statistics, lexical conformance, 276 completed pinned-model responses, prompt/raw-output correspondence, repeat text identity and source quotations. It reports 1,309 passing checks in this version. These checks establish integrity and reproducible arithmetic, not semantic validity.

The full text of the 3,611-row inventory is retained at the original relative path under `tmp/omb-data/`. Its SHA-256 is `a62721202ca4b110ce3c53ffdb688d05ad27a35971a7afda4f1179b2493e31d0`. The unchanged codebook is `protocols/atracc_locked_codebook_v3.md`, SHA-256 `0a1dffe440a2e8d837339873e891c5cabef8076f806ec8f971f52fd314eeaa84`.

## How to read the outputs

| Location | Purpose |
|---|---|
| `output/experiments/atracc_v3/` | Historical five-lens and excerpt-based document readings, prompts, outputs, aggregation and manifests. |
| `output/experiments/atracc_v4/conformance/` | Fifty constructed cases and lexical comparator; 47 scoreable, three contested. |
| `output/experiments/atracc_v5/reconciled_records.csv` | All 110 records, original status, text-group ID, reconciled status/components, and conflict flags. |
| `output/experiments/atracc_v5/templates.csv` | Seventy whitespace-normalized rationale groups, including one blank group. |
| `output/experiments/atracc_v5/agency_sensitivity.csv` | Agency composition and leave-one-agency-out results. |
| `output/experiments/atracc_v5/repair_routes.csv` | Missing P/O/W roles and the separate interpretation-review route. |
| `output/experiments/atracc_v5/replication_v2/` | The completed 276-request replication: prompts, input manifest, raw responses, scores and summary. |
| `output/experiments/atracc_v5/replication/` | Excluded high-effort/4,096-token pilot, plus a two-request smoke test; not pooled with completed-run results. |
| `output/experiments/atracc_v5/external_expectations.json` | Construction-time expectations, OPM source page, provenance and boundaries for eight challenges. |
| `output/experiments/atracc_v5/full_documents/` | Source PDFs, complete extracted text, recovered landing page, retrieval log and bounded-search ledger. |
| `output/experiments/atracc_v5/full_document_audit/` | Fourteen full-text model readings, exact page quotation checks, strict and no-time-condition results. |
| `output/experiments/atracc_v5/review_queue.csv` | Future review flags for all 110 records; contains no new expert labels. |
| `outputs/atracc_human_validation/` | Original unfilled 110-record independent annotation form. Its blank label fields are not missing computational outputs. |

The historical v3/v4 folders are immutable reference evidence. Some historical files contain the earlier 25/69/16 partition or a now-withdrawn support interval. They are retained for traceability and must not be read as the revised manuscript's findings. Current results are in v5 and `manuscripts/atracc.md`.

## Fixed rules and post-review decisions

The v3 codebook predates the archived panel. The following are expressly post-review analyses: whitespace-only rationale grouping, conservative reconciliation, agency and template sensitivity, the new model replication, unchanged-text repeat diagnostics, the OPM-anchored challenge construction, complete-document audit, and temporal ablation. They were not preregistered as a confirmatory study.

Within each text group, a status conflict sends every occurrence to U and a component conflict sends that component to UNCLEAR. This policy makes equivalent disclosed inputs consistent; it does not decide which interpretation is correct. Only DHS-2543 changes its status. Components also conflict in the DHS-123/49 and DHS-125/2427/48 groups.

The completed model run uses `gpt-5.4-2026-03-05` and `gpt-5.4-mini-2026-03-17`, medium reasoning, a 12,288-token maximum output budget, no tools and no prior labels. All 276 completed requests have valid six-component outputs. Seven GPT-5.4 reported statuses disagree with their components; scores always use the circuit-derived status. Exact-substring flags are evidence-fidelity diagnostics, not automatic semantic recodings.

The pilot exhausted its 4,096-token output budget. Of 36 logged responses, 19 were incomplete. It was stopped as a whole and every planned input was restarted under the completed-run conditions. In-flight requests terminated on the client may lack a locally saved completed response. The two blank-input smoke-test calls and all pilot outputs remain outside the 276-request denominator.

Ten repeats per model contain identical rationale text but a different opaque identifier. The selection includes one known discordant template and nine fixed hash-ordered templates; it is a diagnostic set, not a random reliability sample. Both models belong to one provider and related family. Historical model identifiers are unavailable and have not been invented.

## Complete-document coverage

The original analysis contained 22 record-link pairs, 18 distinct URLs, and nine U cases. Follow-up covers seven record-PDF pairs, representing six distinct PDFs. All extracted pages are supplied to both models; full text is not capped at 22,000 characters. DHS-81 and DHS-95 deliberately share a PDF but represent separate record-to-document identity questions.

Successful PDF extraction establishes retrievability. Four of the 14 responses omit this redundant schema field; the scorer retains their five complete semantic judgments and the raw omission. A strict chain requires both models to mark all five semantic conditions YES and every corresponding quotation to match its cited PDF page after whitespace normalization. Omitting the temporal condition is an explicit separate sensitivity analysis. It changes zero strict chains to one, DHS-310. Both models mark candidate mechanisms in three pairs, but verified mechanism and anchor quotations occur in only two. No record status is automatically promoted using these document findings.

DHS-401 and the HHS/ACF collection link did not identify a matching full document in a bounded follow-up. The search ledger records queries, access failure, collection inspection and nonmatching leads. It does not prove that no matching document exists anywhere.

Full text was extracted with Poppler `pdftotext -layout`. PDF page indices in the prompts count from one, including cover pages. The PDFs and their text extractions are both included so this step can be inspected. Extraction may miss visual or scanned material; no OCR-based completeness claim is made.

## Optional fresh API runs

The new runners are `experiments/run_atracc_replication_v5.py` and `experiments/atracc_full_documents_v5.py`. They use the HTTP helper functions in `experiments/run_tas_official_apis_v5.py`; that file is included as a code dependency only, and its unrelated benchmark is not part of ATRACC.

Fresh runs require the user's own API credentials in a local `.env` key named `OPEN_AI_API_KEY`. No credentials are supplied. The runners resume existing output directories by default. To perform a genuinely fresh experiment, work in a new copy, change the output directory, preserve the published outputs, and record the new manifest and conditions. Pinning a model name does not guarantee future availability or byte-identical stochastic judgments. New API runs incur provider charges and are unnecessary for offline reproduction.

## Paper build

The Word source uses the supplied AAAI 2026 camera-ready template for named-author review. With `python-docx` and Pillow installed:

```sh
python3 scripts/build_atracc_v5.py
```

This produces `output/docx/Barri_ATRACC_2026_Public_Rebuttal_Audit_Final.docx`. Convert it to PDF with Word or LibreOffice and inspect the result. The delivered PDF was rendered with LibreOffice and visually reviewed on all seven pages. Native editable equations and four tables are retained. The title has the extra first-page top spacing while subsequent pages use the required 0.75-inch top margin. No page numbers are printed. A deliberate reference-column break balances the last page; recheck it after editing prose.

The outer archive manifest records SHA-256 hashes of every included file. It establishes package integrity, not prior registration or independent validation.
