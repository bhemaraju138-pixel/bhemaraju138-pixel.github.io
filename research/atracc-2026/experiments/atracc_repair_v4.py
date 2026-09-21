#!/usr/bin/env python3
"""Minimal-disclosure repair and artifact recovery-ladder analysis for ATRACC.

The analysis does not invent missing agency facts.  It identifies the smallest
set of *public argumentative roles* that would have to be supplied for a record
to satisfy the locked minimum-support formula.  Records whose component
majorities already satisfy the formula but whose pass-level statuses lack the
four-vote consensus are routed to adjudication rather than treated as missing
disclosure.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import pandas as pd


W_FIELDS = ["consensus_W_ind", "consensus_W_opt", "consensus_W_nar"]
ARTIFACT_FIELDS = [
    "retrievable",
    "same_system",
    "temporally_applicable",
    "same_predicate",
    "qualifying_mechanism",
    "passage_anchor",
]


def support_deficits(row: pd.Series) -> list[str]:
    deficits: list[str] = []
    if row["consensus_P"] != "YES":
        deficits.append("policy predicate")
    if row["consensus_O"] != "YES":
        deficits.append("output/workflow role")
    if not any(row[field] == "YES" for field in W_FIELDS):
        deficits.append("qualifying mechanism")
    return deficits


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--consensus", type=Path, required=True)
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--outdir", type=Path, required=True)
    args = parser.parse_args()
    args.outdir.mkdir(parents=True, exist_ok=True)

    consensus = pd.read_csv(args.consensus)
    rows = []
    for _, row in consensus.iterrows():
        deficits = support_deficits(row)
        status = str(row["consensus_status"])
        if status == "S":
            route = "verify named mechanism"
        elif status == "D":
            route = "answer defeater and disclose mechanism"
        elif not deficits:
            route = "adjudicate pass-level composition"
        else:
            route = "supply missing public roles"
        rows.append({
            "id": row["id"],
            "agency": row["agency"],
            "use_case_name": row["use_case_name"],
            "status": status,
            "minimum_support_repair_size": len(deficits),
            "minimum_support_repair": " | ".join(deficits) if deficits else "none",
            "repair_route": route,
            "predicate_visible": row["consensus_P"] == "YES",
            "output_workflow_visible": row["consensus_O"] == "YES",
            "mechanism_visible": any(row[field] == "YES" for field in W_FIELDS),
            "human_review_load_bearing": row["consensus_H"] == "YES",
            "status_agreement_n": int(row["status_agreement_n"]),
        })
    repair = pd.DataFrame(rows)
    repair.to_csv(args.outdir / "atracc_minimal_disclosure_repairs_v4.csv", index=False)

    unresolved = repair[repair.status.eq("U")]
    defeater = repair[repair.status.eq("D")]
    u_depth = Counter(unresolved.minimum_support_repair_size.astype(int))
    d_depth = Counter(defeater.minimum_support_repair_size.astype(int))
    u_roles = Counter()
    d_roles = Counter()
    for value in unresolved.minimum_support_repair:
        if value != "none":
            u_roles.update(value.split(" | "))
    for value in defeater.minimum_support_repair:
        if value != "none":
            d_roles.update(value.split(" | "))

    artifacts = pd.read_csv(args.artifacts)
    ladder = []
    surviving = pd.Series(True, index=artifacts.index)
    for field in ARTIFACT_FIELDS:
        surviving &= artifacts[field].eq("YES")
        ladder.append({
            "stage": field,
            "surviving_artifacts": int(surviving.sum()),
            "field_yes": int(artifacts[field].eq("YES").sum()),
            "field_unclear": int(artifacts[field].eq("UNCLEAR").sum()),
            "field_no": int(artifacts[field].eq("NO").sum()),
        })
    pd.DataFrame(ladder).to_csv(args.outdir / "atracc_artifact_recovery_ladder_v4.csv", index=False)

    one_field = unresolved[unresolved.minimum_support_repair_size.eq(1)]
    summary = {
        "records": len(repair),
        "unresolved_records": len(unresolved),
        "unresolved_repair_depth": {str(k): int(v) for k, v in sorted(u_depth.items())},
        "unresolved_missing_role_counts": dict(u_roles),
        "unresolved_one_role_away": len(one_field),
        "unresolved_one_role_breakdown": dict(Counter(one_field.minimum_support_repair)),
        "unresolved_adjudication_only": int((unresolved.minimum_support_repair_size == 0).sum()),
        "defeater_records": len(defeater),
        "defeater_repair_depth": {str(k): int(v) for k, v in sorted(d_depth.items())},
        "defeater_missing_role_counts": dict(d_roles),
        "artifact_recovery_ladder": ladder,
        "artifact_complete_chain": int(surviving.sum()),
        "interpretation": (
            "Repair sets identify missing public argumentative roles under the locked codebook; "
            "they do not assert that the corresponding internal facts exist. Zero-deficit U cases "
            "are aggregation disagreements requiring adjudication, not additional disclosure."
        ),
    }
    (args.outdir / "atracc_repair_summary_v4.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
