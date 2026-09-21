#!/usr/bin/env python3
"""Passage-level validation of ATRACC linked-artifact recovery candidates."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

import pandas as pd

from atracc_audit import bytes_to_text, clean, tokens


PASSES = {
    1: (
        "traceability",
        "Require explicit system identity, dates/scope, the relevant policy burden, and a passage-level mechanism. Do not infer across documents.",
    ),
    2: (
        "adversarial burden",
        "Try to disprove recovery. Generic privacy, accuracy, review, or governance language is not a rebuttal to principal-basis influence.",
    ),
}
VALUES = {"YES", "NO", "UNCLEAR"}
FIELDS = ["retrievable", "same_system", "temporally_applicable", "same_predicate", "qualifying_mechanism", "passage_anchor"]


def sha_text(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def artifact_text(url: str, cache: Path, content_type: str) -> str:
    key = hashlib.sha256(url.encode()).hexdigest()[:20]
    body = cache / f"{key}.bin"
    if not body.exists():
        return ""
    return clean(bytes_to_text(body.read_bytes(), content_type))


def relevant_excerpt(text: str, title: str, limit: int = 22000) -> str:
    if not text:
        return ""
    terms = [
        "principal basis", "high-impact", "high impact", "decision", "output", "human review",
        "independent", "corrobor", "validat", "verify", "oversight", "system", "artificial intelligence",
    ] + [t for t in tokens(title) if len(t) >= 5][:8]
    spans = [(0, min(len(text), 3500))]
    low = text.lower()
    for term in terms:
        start = 0
        for _ in range(4):
            pos = low.find(term.lower(), start)
            if pos < 0:
                break
            spans.append((max(0, pos - 650), min(len(text), pos + 1200)))
            start = pos + len(term)
    spans.sort()
    merged: list[tuple[int, int]] = []
    for a, b in spans:
        if merged and a <= merged[-1][1] + 100:
            merged[-1] = (merged[-1][0], max(merged[-1][1], b))
        else:
            merged.append((a, b))
    pieces = []
    used = 0
    for a, b in merged:
        piece = text[a:b]
        if used + len(piece) > limit:
            piece = piece[: max(0, limit - used)]
        if piece:
            pieces.append(piece)
            used += len(piece)
        if used >= limit:
            break
    return "\n[...PASSAGE BREAK...]\n".join(pieces)


def prepare(args: argparse.Namespace) -> None:
    audit = pd.read_csv(args.audit)
    consensus = pd.read_csv(args.consensus)
    records = []
    for _, row in audit.iterrows():
        match = consensus[
            consensus.agency.astype(str).eq(str(row.agency))
            & consensus.use_case_name.astype(str).eq(str(row.use_case_name))
        ]
        if len(match) != 1:
            raise RuntimeError(f"Cannot uniquely map artifact: {row.agency} / {row.use_case_name}")
        case = match.iloc[0]
        url = str(row.url)
        text = artifact_text(url, args.cache, str(row.get("content_type", "")))
        key = hashlib.sha256(f"{case.id}|{url}".encode()).hexdigest()[:16]
        records.append({
            "artifact_id": key,
            "case_id": case.id,
            "agency": row.agency,
            "use_case_name": row.use_case_name,
            "inventory_status": case.consensus_status,
            "inventory_rationale": case.rationale,
            "url": url,
            "resolved_url": str(row.get("resolved_url", "")),
            "http_status": int(row.get("http_status", 0) or 0),
            "content_type": str(row.get("content_type", "")),
            "artifact_excerpt": relevant_excerpt(text, str(row.use_case_name)),
            "artifact_text_sha256": sha_text(text),
            "artifact_text_characters": len(text),
        })
    args.outdir.mkdir(parents=True, exist_ok=True)
    (args.outdir / "prompts").mkdir(exist_ok=True)
    (args.outdir / "responses").mkdir(exist_ok=True)
    (args.outdir / "artifact_records.jsonl").write_text(
        "".join(json.dumps(x, ensure_ascii=True) + "\n" for x in records), encoding="utf-8"
    )
    for pass_no, (name, instruction) in PASSES.items():
        for batch_no, start in enumerate(range(0, len(records), args.batch_size), 1):
            batch = records[start:start + args.batch_size]
            prompt = (
                "You are conducting a blinded passage-level audit of public documents linked from a federal AI inventory. "
                "Use only the supplied excerpt. Do not browse or use tools. Return exactly one JSON object per artifact, one per line, no prose. "
                "For each field use YES, NO, or UNCLEAR. A qualifying mechanism must identify a non-AI basis, available non-AI path, or bounded operational role and explicitly connect it to why the AI output is not a principal basis. Human review, accuracy testing, privacy controls, generic validation, or a bare conclusion do not qualify. "
                "Temporally applicable requires evidence that the document/version plausibly covers the 2025 inventory determination; absent dates or scope is UNCLEAR. "
                f"PASS: {name}. {instruction}\n"
                "Schema: {\"artifact_id\":\"...\",\"retrievable\":\"YES|NO|UNCLEAR\",\"same_system\":\"YES|NO|UNCLEAR\",\"temporally_applicable\":\"YES|NO|UNCLEAR\",\"same_predicate\":\"YES|NO|UNCLEAR\",\"qualifying_mechanism\":\"YES|NO|UNCLEAR\",\"passage_anchor\":\"YES|NO|UNCLEAR\",\"mechanism_type\":\"independent|alternative|narrow|none|unclear\",\"exact_passage\":\"short exact quote\",\"reason\":\"one sentence\",\"confidence\":0.0}\n"
                f"ARTIFACTS:\n{json.dumps(batch, ensure_ascii=True)}"
            )
            (args.outdir / "prompts" / f"pass{pass_no}_batch{batch_no}.txt").write_text(prompt, encoding="utf-8")
    manifest = {
        "artifacts": len(records),
        "passes": PASSES,
        "strict_recovery_rule": "All six fields YES in both passes.",
        "excerpt_rule": "First 3,500 characters plus merged windows around title and burden-bearing terms, capped at 22,000 characters.",
        "integrity_boundary": "Two computational passage audits, not human review.",
    }
    (args.outdir / "artifact_validation_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


def parse(path: Path) -> list[dict[str, Any]]:
    rows = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line.lstrip().startswith("{"):
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if row.get("artifact_id"):
            rows.append(row)
    return rows


def aggregate(args: argparse.Namespace) -> None:
    records = [json.loads(x) for x in (args.outdir / "artifact_records.jsonl").read_text().splitlines() if x]
    expected = [x["artifact_id"] for x in records]
    panel = []
    for pass_no in PASSES:
        found: dict[str, dict[str, Any]] = {}
        for path in sorted((args.outdir / "responses").glob(f"pass{pass_no}_batch*.jsonl")):
            for row in parse(path):
                found[str(row["artifact_id"])] = row
        missing = [x for x in expected if x not in found]
        if missing:
            raise RuntimeError(f"Pass {pass_no} missing {missing}")
        for artifact_id in expected:
            row = found[artifact_id]
            for field in FIELDS:
                value = str(row.get(field, "UNCLEAR")).upper()
                row[field] = value if value in VALUES else "UNCLEAR"
            row["pass"] = pass_no
            panel.append(row)
    pd.DataFrame(panel).to_csv(args.outdir / "artifact_panel_codings.csv", index=False)
    results = []
    panel_df = pd.DataFrame(panel)
    for record in records:
        group = panel_df[panel_df.artifact_id.eq(record["artifact_id"])]
        consensus = {}
        for field in FIELDS:
            values = group[field].tolist()
            consensus[field] = values[0] if len(set(values)) == 1 else "UNCLEAR"
        qualifies = all(consensus[f] == "YES" for f in FIELDS)
        passages = [str(x) for x in group.get("exact_passage", []) if str(x).strip()]
        results.append({
            **{k: record[k] for k in ["artifact_id", "case_id", "agency", "use_case_name", "inventory_status", "url", "resolved_url", "http_status", "artifact_text_sha256", "artifact_text_characters"]},
            **consensus,
            "strict_recovery": int(qualifies),
            "pass_agreement_all_fields": int(all(group[f].nunique() == 1 for f in FIELDS)),
            "exact_passages": " || ".join(dict.fromkeys(passages))[:2500],
        })
    result = pd.DataFrame(results)
    result.to_csv(args.outdir / "atracc_artifact_validated.csv", index=False)
    summary = {
        "artifacts": len(result),
        "http_resolved": int(result.http_status.between(200, 399).sum()),
        "two_pass_all_field_agreement": int(result.pass_agreement_all_fields.sum()),
        "strict_recovery_n": int(result.strict_recovery.sum()),
        "inventory_U_to_S_candidates": int(((result.inventory_status == "U") & (result.strict_recovery == 1)).sum()),
        "field_yes_counts": {f: int(result[f].eq("YES").sum()) for f in FIELDS},
        "integrity_boundary": "Strict recovery requires two-pass unanimity on every field; computational, not human adjudication.",
    }
    (args.outdir / "atracc_artifact_validation_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prepare")
    p.add_argument("--audit", type=Path, required=True)
    p.add_argument("--consensus", type=Path, required=True)
    p.add_argument("--cache", type=Path, required=True)
    p.add_argument("--outdir", type=Path, required=True)
    p.add_argument("--batch-size", type=int, default=3)
    p.set_defaults(func=prepare)
    a = sub.add_parser("aggregate")
    a.add_argument("--outdir", type=Path, required=True)
    a.set_defaults(func=aggregate)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
