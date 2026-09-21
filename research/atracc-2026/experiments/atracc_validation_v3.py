#!/usr/bin/env python3
"""Prepare and aggregate a locked, blinded, five-lens ATRACC validation.

This does not impersonate a human reliability study. It creates an auditable
multi-pass expert-model sensitivity panel whose prompts are frozen by the hash
of the accompanying codebook. Legacy regex labels are never shown to panel
passes. Consensus is conservative: fewer than four agreeing passes becomes U.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

import pandas as pd


NEGATIVE = "Presumed High-Impact, but Not High-impact"
COMPONENTS = ["P", "O", "W_ind", "W_opt", "W_nar", "H"]
VALUES = {"YES", "NO", "UNCLEAR"}
STATUSES = {"S", "U", "D"}
LENSES = {
    1: (
        "literal entailment",
        "Credit only propositions entailed by the disclosed words. Penalize missing links and do not repair vague prose.",
    ),
    2: (
        "policy-burden mapping",
        "Map the text to the principal-basis burden in M-25-21. Distinguish a conclusion from an answer to the burden.",
    ),
    3: (
        "linguistic scope and negation",
        "Resolve negation, modality, coreference, clause attachment, and whether evidence is connected to the claimed limit.",
    ),
    4: (
        "adversarial false-positive audit",
        "Assume a weak rationale may use persuasive keywords. Try to falsify every proposed YES, especially validation and human review.",
    ),
    5: (
        "assurance-case completeness",
        "Ask whether a skeptical outsider can reconstruct claim, mechanism, and rebuttal from the public rationale without hidden premises.",
    ),
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean(value: object) -> str:
    if pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def base_record_id(row: pd.Series | dict[str, Any]) -> str:
    public_id = clean(row.get("id", ""))
    if public_id:
        return public_id
    key = f"{clean(row.get('agency', ''))}|{clean(row.get('use_case_name', ''))}"
    return "MISSING-" + hashlib.sha256(key.encode()).hexdigest()[:12].upper()


def assign_stable_ids(frame: pd.DataFrame) -> pd.Series:
    base = frame.apply(base_record_id, axis=1)
    occurrence = base.groupby(base, sort=False).cumcount() + 1
    totals = base.map(base.value_counts())
    return pd.Series(
        [f"{b}-R{o:02d}" if total > 1 else b for b, o, total in zip(base, occurrence, totals)],
        index=frame.index,
    )


def output_schema() -> str:
    return (
        '{"id":"...","P":"YES|NO|UNCLEAR","O":"YES|NO|UNCLEAR",'
        '"W_ind":"YES|NO|UNCLEAR","W_opt":"YES|NO|UNCLEAR",'
        '"W_nar":"YES|NO|UNCLEAR","H":"YES|NO|UNCLEAR",'
        '"status":"S|U|D","excerpts":{"P":"...","O":"...","W":"...","H":"..."},'
        '"ambiguity":"...","confidence":0.0}'
    )


def prepare(args: argparse.Namespace) -> None:
    codebook = args.codebook.read_text(encoding="utf-8")
    codebook_sha = digest(args.codebook)
    data = pd.read_csv(args.input, encoding="utf-8-sig")
    data = data.loc[data["is_high_impact"].eq(NEGATIVE)].copy()
    if len(data) != 110:
        raise RuntimeError(f"Expected 110 records, found {len(data)}")
    data["_stable_id"] = assign_stable_ids(data)
    records = []
    for _, row in data.sort_values(["agency", "id"]).iterrows():
        records.append({
            "id": row["_stable_id"],
            "inventory_id": clean(row["id"]),
            "agency": clean(row["agency"]),
            "use_case_name": clean(row["use_case_name"]),
            "development_stage": clean(row.get("development_stage", "")),
            "topic_area": clean(row.get("topic_area", "")),
            "rationale": clean(row.get("HI_justification", "")),
        })
    out = args.outdir
    (out / "prompts").mkdir(parents=True, exist_ok=True)
    (out / "responses").mkdir(parents=True, exist_ok=True)
    (out / "blinded_records.jsonl").write_text(
        "".join(json.dumps(r, ensure_ascii=True) + "\n" for r in records), encoding="utf-8"
    )
    manifest = {
        "codebook_path": str(args.codebook),
        "codebook_sha256": codebook_sha,
        "source_path": str(args.input),
        "source_sha256": digest(args.input),
        "records": len(records),
        "lenses": {str(k): {"name": v[0], "instruction": v[1]} for k, v in LENSES.items()},
        "blinding": "Legacy regex flags and labels excluded from every panel prompt.",
        "missing_id_rule": "Blank inventory IDs receive MISSING- plus the first 12 SHA-256 hex characters of agency|use_case_name.",
        "duplicate_id_rule": "Repeated public IDs receive deterministic R01/R02 suffixes in source-row order.",
        "consensus_rule": "4/5 same status required; otherwise U. Component majority uses YES/NO/UNCLEAR with ties UNCLEAR.",
        "integrity_boundary": "Computational expert-model panel, not independent human coding.",
    }
    (out / "validation_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    batch_size = args.batch_size
    for lens, (name, instruction) in LENSES.items():
        for batch_no, start in enumerate(range(0, len(records), batch_size), 1):
            batch = records[start:start + batch_size]
            prompt = (
                "You are one blinded coding pass in an AI-governance measurement audit. "
                "Code every record independently. Do not use tools, browse, or infer hidden agency practices. "
                "Return exactly one compact JSON object per line, in input order, with no markdown or prose.\n\n"
                f"LOCKED CODEBOOK SHA-256: {codebook_sha}\n\n{codebook}\n\n"
                f"THIS PASS LENS: {name}. {instruction}\n\n"
                "Apply the primary-status formula mechanically after component coding. "
                "Quote only short exact excerpts from the rationale; use an empty string when none exists. "
                "Confidence must be between 0 and 1. Required schema:\n"
                f"{output_schema()}\n\nRECORDS:\n{json.dumps(batch, ensure_ascii=True)}"
            )
            (out / "prompts" / f"lens{lens}_batch{batch_no}.txt").write_text(prompt, encoding="utf-8")
    print(json.dumps(manifest, indent=2))


def load_json_objects(path: Path) -> list[dict[str, Any]]:
    rows = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict) and obj.get("id"):
            rows.append(obj)
    return rows


def validate_row(row: dict[str, Any]) -> dict[str, Any]:
    for field in COMPONENTS:
        value = str(row.get(field, "UNCLEAR")).upper()
        row[field] = value if value in VALUES else "UNCLEAR"
    status = str(row.get("status", "U")).upper()
    row["status"] = status if status in STATUSES else "U"
    # Enforce the locked formula rather than trusting a prose label.
    supported = row["P"] == row["O"] == "YES" and any(row[f] == "YES" for f in ["W_ind", "W_opt", "W_nar"])
    defeater = row["H"] == "YES" and not any(row[f] == "YES" for f in ["W_ind", "W_opt", "W_nar"])
    derived = "S" if supported else ("D" if defeater else "U")
    row["reported_status"] = row["status"]
    row["status"] = derived
    row["formula_corrected"] = int(derived != row["reported_status"])
    try:
        row["confidence"] = min(1.0, max(0.0, float(row.get("confidence", 0.0))))
    except (TypeError, ValueError):
        row["confidence"] = 0.0
    return row


def majority(values: list[str], threshold: int = 3, fallback: str = "UNCLEAR") -> str:
    counts = Counter(values)
    value, n = counts.most_common(1)[0]
    return value if n >= threshold and list(counts.values()).count(n) == 1 else fallback


def aggregate(args: argparse.Namespace) -> None:
    expected = [json.loads(line) for line in (args.outdir / "blinded_records.jsonl").read_text().splitlines() if line]
    expected_ids = [r["id"] for r in expected]
    panel_rows = []
    for lens in LENSES:
        found: dict[str, dict[str, Any]] = {}
        for path in sorted((args.outdir / "responses").glob(f"lens{lens}_batch*.jsonl")):
            for row in load_json_objects(path):
                found[str(row["id"])] = validate_row(row)
        missing = [x for x in expected_ids if x not in found]
        extra = [x for x in found if x not in set(expected_ids)]
        if missing or extra:
            raise RuntimeError(f"Lens {lens}: missing={missing[:8]} extra={extra[:8]}")
        for record_id in expected_ids:
            panel_rows.append({"lens": lens, "lens_name": LENSES[lens][0], **found[record_id]})
    panel = pd.DataFrame(panel_rows)
    panel.to_csv(args.outdir / "atracc_panel_codings.csv", index=False)

    consensus_rows = []
    for record in expected:
        group = panel.loc[panel["id"].astype(str).eq(str(record["id"]))]
        status_counts = Counter(group["status"])
        top_status, top_n = status_counts.most_common(1)[0]
        status = top_status if top_n >= 4 else "U"
        components = {field: majority(group[field].tolist()) for field in COMPONENTS}
        excerpts = []
        for value in group.get("excerpts", pd.Series(dtype=object)):
            if isinstance(value, dict):
                excerpts.extend(str(x) for x in value.values() if str(x).strip())
        consensus_rows.append({
            **record,
            **{f"consensus_{k}": v for k, v in components.items()},
            "consensus_status": status,
            "status_votes": json.dumps(dict(status_counts), sort_keys=True),
            "status_agreement_n": top_n,
            "unanimous": int(top_n == 5),
            "mean_confidence": float(group["confidence"].mean()),
            "formula_corrections": int(group["formula_corrected"].sum()),
            "representative_excerpts": " || ".join(dict.fromkeys(excerpts))[:2000],
        })
    consensus = pd.DataFrame(consensus_rows)
    consensus.to_csv(args.outdir / "atracc_consensus_codings.csv", index=False)

    legacy = pd.read_csv(args.legacy)
    legacy["id"] = assign_stable_ids(legacy)
    comparison = consensus.merge(
        legacy[["id", "argument_status"]].assign(id=lambda x: x.id.astype(str)),
        on="id", how="left",
    )
    comparison["legacy_status"] = comparison["argument_status"].str[0]
    comparison["legacy_matches_consensus"] = comparison["legacy_status"].eq(comparison["consensus_status"])
    comparison.to_csv(args.outdir / "atracc_legacy_vs_consensus.csv", index=False)

    counts = consensus["consensus_status"].value_counts().to_dict()
    n = len(consensus)
    s, u, d = (int(counts.get(k, 0)) for k in ["S", "U", "D"])
    summary = {
        "n": n,
        "panel_passes": 5,
        "status_counts": {"S": s, "U": u, "D": d},
        "logical_support_bounds": [s / n, (s + u) / n],
        "unanimous_n": int(consensus["unanimous"].sum()),
        "four_or_five_agreement_n": int(consensus["status_agreement_n"].ge(4).sum()),
        "forced_unresolved_n": int(consensus["status_agreement_n"].lt(4).sum()),
        "legacy_agreement": float(comparison["legacy_matches_consensus"].mean()),
        "panel_formula_corrections": int(panel["formula_corrected"].sum()),
        "codebook_sha256": json.loads((args.outdir / "validation_manifest.json").read_text())["codebook_sha256"],
        "integrity_boundary": "Five blinded computational coding passes. Not independent human inter-rater reliability.",
    }
    (args.outdir / "atracc_validation_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prepare")
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--codebook", type=Path, required=True)
    p.add_argument("--outdir", type=Path, required=True)
    p.add_argument("--batch-size", type=int, default=22)
    p.set_defaults(func=prepare)
    a = sub.add_parser("aggregate")
    a.add_argument("--outdir", type=Path, required=True)
    a.add_argument("--legacy", type=Path, required=True)
    a.set_defaults(func=aggregate)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
