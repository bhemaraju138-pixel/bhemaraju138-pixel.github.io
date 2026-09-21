#!/usr/bin/env python3
"""Verify and score the ATRACC v7 metamorphic experiment."""

from __future__ import annotations

import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "output/experiments/atracc_v7/metamorphic"
FIELDS = ("P", "O", "W_ind", "W_opt", "W_nar", "H")
W_FIELDS = ("W_ind", "W_opt", "W_nar")
CONDITIONS = ("original", "whitespace", "human_review", "multiple_sources", "independent_basis")
MODELS = ("gpt-6-astra", "gpt-5.4-mini-2026-03-17")


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]


def components(row: dict[str, Any]) -> tuple[str, ...]:
    return tuple(row["parsed"][field] for field in FIELDS)


def no_w(row: dict[str, Any]) -> bool:
    return all(row["parsed"][field] != "YES" for field in W_FIELDS)


def pct(n: int, d: int) -> float:
    return round(100 * n / d, 1) if d else 0.0


def main() -> None:
    manifest = json.loads((BASE / "prospective_manifest.json").read_text(encoding="utf-8"))
    inputs_text = (BASE / "all_inputs.jsonl").read_text(encoding="utf-8")
    inputs = [json.loads(line) for line in inputs_text.splitlines() if line]
    results = load_jsonl(BASE / "results.jsonl")
    checks: list[tuple[str, bool]] = []

    def check(name: str, value: bool) -> None:
        checks.append((name, bool(value)))
        if not value:
            raise AssertionError(name)

    check("input_count_350", len(inputs) == 350)
    check("result_count_700", len(results) == 700)
    check("inputs_hash", sha(inputs_text) == manifest["inputs_sha256"])
    check("codebook_hash", sha((ROOT / "protocols/atracc_locked_codebook_v3.md").read_text(encoding="utf-8")) == manifest["codebook_sha256"])
    check("unique_input_ids", len({row["id"] for row in inputs}) == 350)
    check("unique_result_pairs", len({(row["id"], row["requested_model"]) for row in results}) == 700)
    check("all_parse_ok", all(row.get("parse_ok") for row in results))
    check("all_http_200", all(row.get("http_status") == 200 for row in results))
    check("all_resolved_exact", all(row.get("resolved_model") == row.get("requested_model") for row in results))
    check("all_conditions_70", all(sum(row["condition"] == c for row in inputs) == 70 for c in CONDITIONS))
    input_by_id = {row["id"]: row for row in inputs}
    check("result_ids_known", all(row["id"] in input_by_id for row in results))
    check("result_metadata_match", all(row["template_id"] == input_by_id[row["id"]]["template_id"] and row["condition"] == input_by_id[row["id"]]["condition"] for row in results))
    check("whitespace_semantics", all(" ".join(row["rationale"].split()) == " ".join(next(candidate["rationale"] for candidate in inputs if candidate["template_id"] == row["template_id"] and candidate["condition"] == "original").split()) for row in inputs if row["condition"] == "whitespace"))

    by_key = {(row["requested_model"], row["template_id"], row["condition"]): row for row in results}
    summary: dict[str, Any] = {
        "design": manifest["design"],
        "source_templates": 70,
        "conditions": list(CONDITIONS),
        "models": {},
        "cross_model": {},
        "verification": {"checks": len(checks), "passed": sum(v for _, v in checks)},
    }
    pair_rows: list[dict[str, Any]] = []
    anomaly_rows: list[dict[str, Any]] = []

    for model in MODELS:
        original = {template: by_key[(model, template, "original")] for template in {row["template_id"] for row in inputs}}
        variant = {
            condition: {template: by_key[(model, template, condition)] for template in original}
            for condition in CONDITIONS[1:]
        }
        base_no_w = sum(no_w(row) for row in original.values())
        base_wind_not_yes = sum(row["parsed"]["W_ind"] != "YES" for row in original.values())
        base_non_s = sum(row["derived_status"] != "S" for row in original.values())
        repair_eligible = [
            template
            for template, row in original.items()
            if row["parsed"]["P"] == "YES"
            and row["parsed"]["O"] == "YES"
            and no_w(row)
        ]

        whitespace_vector = sum(components(original[t]) == components(variant["whitespace"][t]) for t in original)
        whitespace_circuit = sum(original[t]["derived_status"] == variant["whitespace"][t]["derived_status"] for t in original)
        whitespace_reported = sum(original[t]["reported_status"] == variant["whitespace"][t]["reported_status"] for t in original)

        human_w_gains = sum(no_w(original[t]) and not no_w(variant["human_review"][t]) for t in original)
        human_s_gains = sum(original[t]["derived_status"] != "S" and variant["human_review"][t]["derived_status"] == "S" for t in original)
        human_eligible_s = sum(
            variant["human_review"][template]["derived_status"] == "S"
            for template in repair_eligible
        )
        sources_w_gains = sum(no_w(original[t]) and not no_w(variant["multiple_sources"][t]) for t in original)
        sources_wind_gains = sum(original[t]["parsed"]["W_ind"] != "YES" and variant["multiple_sources"][t]["parsed"]["W_ind"] == "YES" for t in original)
        sources_s_gains = sum(original[t]["derived_status"] != "S" and variant["multiple_sources"][t]["derived_status"] == "S" for t in original)
        sources_eligible_s = sum(
            variant["multiple_sources"][template]["derived_status"] == "S"
            for template in repair_eligible
        )
        explicit_wind_yes = sum(variant["independent_basis"][t]["parsed"]["W_ind"] == "YES" for t in original)
        explicit_wind_gains = sum(original[t]["parsed"]["W_ind"] != "YES" and variant["independent_basis"][t]["parsed"]["W_ind"] == "YES" for t in original)
        explicit_s_gains = sum(original[t]["derived_status"] != "S" and variant["independent_basis"][t]["derived_status"] == "S" for t in original)

        usage = Counter()
        for row in results:
            if row["requested_model"] != model:
                continue
            u = row.get("usage") or {}
            usage["input_tokens"] += int(u.get("input_tokens", 0))
            usage["cached_input_tokens"] += int((u.get("input_tokens_details") or {}).get("cached_tokens", 0))
            usage["output_tokens"] += int(u.get("output_tokens", 0))
            usage["reasoning_tokens"] += int((u.get("output_tokens_details") or {}).get("reasoning_tokens", 0))

        condition_counts = {}
        for condition in CONDITIONS:
            rows = [by_key[(model, t, condition)] for t in original]
            condition_counts[condition] = {
                "circuit_status": dict(sorted(Counter(row["derived_status"] for row in rows).items())),
                "reported_status": dict(sorted(Counter(row["reported_status"] for row in rows).items())),
                "W_ind": dict(sorted(Counter(row["parsed"]["W_ind"] for row in rows).items())),
            }

        summary["models"][model] = {
            "n": 70,
            "base_no_W": base_no_w,
            "base_W_ind_not_yes": base_wind_not_yes,
            "base_non_S": base_non_s,
            "whitespace": {
                "exact_component_vectors": whitespace_vector,
                "exact_component_vectors_pct": pct(whitespace_vector, 70),
                "same_circuit_status": whitespace_circuit,
                "same_circuit_status_pct": pct(whitespace_circuit, 70),
                "same_reported_status": whitespace_reported,
                "same_reported_status_pct": pct(whitespace_reported, 70),
            },
            "human_review": {
                "new_any_W_among_base_no_W": human_w_gains,
                "denominator_base_no_W": base_no_w,
                "new_any_W_pct": pct(human_w_gains, base_no_w),
                "nonS_to_S": human_s_gains,
                "denominator_base_non_S": base_non_s,
                "eligible_originals_P_yes_O_yes_no_W": len(repair_eligible),
                "eligible_to_S": human_eligible_s,
            },
            "multiple_sources": {
                "new_any_W_among_base_no_W": sources_w_gains,
                "denominator_base_no_W": base_no_w,
                "new_any_W_pct": pct(sources_w_gains, base_no_w),
                "new_W_ind_among_base_not_yes": sources_wind_gains,
                "denominator_base_W_ind_not_yes": base_wind_not_yes,
                "new_W_ind_pct": pct(sources_wind_gains, base_wind_not_yes),
                "nonS_to_S": sources_s_gains,
                "denominator_base_non_S": base_non_s,
                "eligible_originals_P_yes_O_yes_no_W": len(repair_eligible),
                "eligible_to_S": sources_eligible_s,
            },
            "independent_basis": {
                "W_ind_yes_all": explicit_wind_yes,
                "W_ind_yes_all_pct": pct(explicit_wind_yes, 70),
                "new_W_ind_among_base_not_yes": explicit_wind_gains,
                "denominator_base_W_ind_not_yes": base_wind_not_yes,
                "new_W_ind_pct": pct(explicit_wind_gains, base_wind_not_yes),
                "nonS_to_S": explicit_s_gains,
                "repair_eligible_originals": len(repair_eligible),
                "repair_eligible_to_S": sum(
                    variant["independent_basis"][template]["derived_status"] == "S"
                    for template in repair_eligible
                ),
            },
            "circuit_reported_mismatches": sum(row["derived_status"] != row["reported_status"] for row in results if row["requested_model"] == model),
            "condition_counts": condition_counts,
            "usage": dict(usage),
        }

        for template in sorted(original):
            base = original[template]
            outrow: dict[str, Any] = {
                "model": model,
                "template_id": template,
                "original_vector": "/".join(components(base)),
                "original_status": base["derived_status"],
            }
            for condition in CONDITIONS[1:]:
                item = variant[condition][template]
                outrow[f"{condition}_vector"] = "/".join(components(item))
                outrow[f"{condition}_status"] = item["derived_status"]
            pair_rows.append(outrow)

            reasons = []
            if components(base) != components(variant["whitespace"][template]):
                reasons.append("whitespace_vector_change")
            if no_w(base) and not no_w(variant["human_review"][template]):
                reasons.append("human_created_W")
            if base["derived_status"] != "S" and variant["human_review"][template]["derived_status"] == "S":
                reasons.append("human_created_S")
            if no_w(base) and not no_w(variant["multiple_sources"][template]):
                reasons.append("multiple_sources_created_W")
            if variant["independent_basis"][template]["parsed"]["W_ind"] != "YES":
                reasons.append("explicit_basis_not_W_ind_yes")
            if reasons:
                anomaly_rows.append({**outrow, "reasons": ";".join(reasons)})

    for condition in CONDITIONS:
        same_vector = 0
        same_circuit = 0
        same_reported = 0
        for template in {row["template_id"] for row in inputs}:
            a = by_key[(MODELS[0], template, condition)]
            b = by_key[(MODELS[1], template, condition)]
            same_vector += components(a) == components(b)
            same_circuit += a["derived_status"] == b["derived_status"]
            same_reported += a["reported_status"] == b["reported_status"]
        summary["cross_model"][condition] = {
            "same_component_vector": same_vector,
            "same_component_vector_pct": pct(same_vector, 70),
            "same_circuit_status": same_circuit,
            "same_circuit_status_pct": pct(same_circuit, 70),
            "same_reported_status": same_reported,
            "same_reported_status_pct": pct(same_reported, 70),
        }

    total_usage = Counter()
    for model in MODELS:
        total_usage.update(summary["models"][model]["usage"])
    summary["total_usage"] = dict(total_usage)
    summary["verification"] = {"checks": len(checks), "passed": sum(v for _, v in checks)}

    (BASE / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    with (BASE / "paired_results.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(pair_rows[0]))
        writer.writeheader(); writer.writerows(pair_rows)
    with (BASE / "anomalies.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(anomaly_rows[0]))
        writer.writeheader(); writer.writerows(anomaly_rows)

    lines = [
        "# ATRACC Metamorphic Audit Summary",
        "",
        "This is a prospective computational stress test of a locked codebook. It is not human validation.",
        "The saved plan tests human review against any new W and generic-source language against new W_ind. Aggregate-W and eligible-S summaries for generic-source language are additional post-review diagnostics.",
        "",
    ]
    for model in MODELS:
        s = summary["models"][model]
        lines.extend([
            f"## {model}",
            "",
            f"- Whitespace exact vectors: {s['whitespace']['exact_component_vectors']}/70",
            f"- Whitespace circuit-status invariance: {s['whitespace']['same_circuit_status']}/70",
            f"- Planned human-only new W: {s['human_review']['new_any_W_among_base_no_W']}/{s['human_review']['denominator_base_no_W']}",
            f"- Planned human-only non-S to S: {s['human_review']['nonS_to_S']}/{s['human_review']['denominator_base_non_S']}",
            f"- Planned generic-source new W_ind: {s['multiple_sources']['new_W_ind_among_base_not_yes']}/{s['multiple_sources']['denominator_base_W_ind_not_yes']}",
            f"- Planned generic-source non-S to S: {s['multiple_sources']['nonS_to_S']}/{s['multiple_sources']['denominator_base_non_S']}",
            f"- Additional generic-source new W: {s['multiple_sources']['new_any_W_among_base_no_W']}/{s['multiple_sources']['denominator_base_no_W']}",
            f"- Additional human-only eligible to S: {s['human_review']['eligible_to_S']}/{s['human_review']['eligible_originals_P_yes_O_yes_no_W']}",
            f"- Additional generic-source eligible to S: {s['multiple_sources']['eligible_to_S']}/{s['multiple_sources']['eligible_originals_P_yes_O_yes_no_W']}",
            f"- Explicit-basis W_ind yes: {s['independent_basis']['W_ind_yes_all']}/70",
            f"- Explicit-basis new W_ind: {s['independent_basis']['new_W_ind_among_base_not_yes']}/{s['independent_basis']['denominator_base_W_ind_not_yes']}",
            f"- Explicit-basis non-S to S: {s['independent_basis']['nonS_to_S']}",
            "",
        ])
    (BASE / "SUMMARY.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
