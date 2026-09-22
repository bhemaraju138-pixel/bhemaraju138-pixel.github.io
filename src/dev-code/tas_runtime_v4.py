#!/usr/bin/env python3
"""Model-conditioned commit replay and receipt robustness for TAS.

The experiment replays the twelve locked model-condition runs through six
release policies.  Each model first has an opportunity to authorize the valid
plan member.  The environment then transitions to valid, conflicting, missing,
or irrelevant state before release.  Deterministic contract evaluation is used
only by policies that explicitly revalidate at the commit boundary.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
import unicodedata
from pathlib import Path
from typing import Any

import pandas as pd

from tas_benchmark_v3 import table_oracle


def normalize_scalar(value: Any) -> Any:
    if isinstance(value, str):
        text = unicodedata.normalize("NFC", " ".join(value.split()))
        # Canonicalize only unambiguous numeric lexemes; semantic aliases remain
        # deliberately outside the present contract.
        try:
            number = float(text)
        except ValueError:
            return text
        if math.isfinite(number) and text.replace(".", "", 1).replace("-", "", 1).isdigit():
            return int(number) if number.is_integer() else number
        return text
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def canonicalize(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): canonicalize(value[k]) for k in sorted(value)}
    if isinstance(value, list):
        return [canonicalize(x) for x in value]
    return normalize_scalar(value)


def digest(value: Any) -> str:
    payload = json.dumps(canonicalize(value), sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def dependency_fields(rule: dict[str, Any]) -> list[str]:
    fields: list[str] = []
    for field in rule.get("required_present", []) + rule.get("required_equal", []) + list(rule.get("required_values", {})):
        if field not in fields:
            fields.append(field)
    return fields


def payload_projection(task: dict[str, Any]) -> dict[str, Any]:
    return {
        "operation": task["operation"],
        "instruction": task["instruction"],
        "operands": [
            {
                "provider": x["provider"],
                "series_id": x["series_id"],
                "period": x["period"],
                "value": x["value"],
            }
            for x in task["operands"]
        ],
    }


def full_projection(task: dict[str, Any], contract_sha: str) -> dict[str, Any]:
    return {
        "contract_sha256": contract_sha,
        **payload_projection(task),
        "metadata": [x["metadata"] for x in task["operands"]],
    }


def scoped_projection(task: dict[str, Any], contract: dict[str, Any], contract_sha: str) -> dict[str, Any]:
    fields = dependency_fields(contract["operations"][task["operation"]])
    return {
        "contract_sha256": contract_sha,
        **payload_projection(task),
        "metadata": [{field: x["metadata"].get(field) for field in fields} for x in task["operands"]],
    }


def strategy_result(
    strategy: str,
    plan_accept: bool,
    plan_payload: str,
    plan_full: str,
    plan_scoped: str,
    current_payload: str,
    current_full: str,
    current_scoped: str,
    oracle: str,
) -> tuple[bool, bool, str]:
    if not plan_accept:
        return False, False, "plan did not authorize"
    if strategy == "stale_authorization":
        return True, False, "cached model ACCEPT"
    if strategy == "payload_receipt":
        return current_payload == plan_payload, False, "payload receipt"
    if strategy == "full_state_fail_closed":
        return current_full == plan_full, False, "full-state equality"
    if strategy == "full_state_revalidate":
        changed = current_full != plan_full
        return (oracle == "ACCEPT") if changed else True, changed, "full-state revalidation" if changed else "full-state match"
    if strategy == "operation_scoped_revalidate":
        changed = current_scoped != plan_scoped
        return (oracle == "ACCEPT") if changed else True, changed, "scoped revalidation" if changed else "scoped match"
    if strategy == "always_revalidate":
        return oracle == "ACCEPT", True, "commit-time revalidation"
    raise ValueError(strategy)


def representation_variants(task: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    variants = []
    reversed_keys = copy.deepcopy(task)
    for operand in reversed_keys["operands"]:
        operand["metadata"] = dict(reversed(list(operand["metadata"].items())))
    variants.append(("key_order", reversed_keys))

    whitespace = copy.deepcopy(task)
    for operand in whitespace["operands"]:
        for key, value in list(operand["metadata"].items()):
            if isinstance(value, str):
                operand["metadata"][key] = f"  {value}  "
    variants.append(("outer_whitespace", whitespace))

    unicode_form = copy.deepcopy(task)
    for operand in unicode_form["operands"]:
        for key, value in list(operand["metadata"].items()):
            if isinstance(value, str):
                operand["metadata"][key] = unicodedata.normalize("NFD", value)
    variants.append(("unicode_normalization", unicode_form))
    return variants


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--benchmark", type=Path, required=True)
    parser.add_argument("--contract", type=Path, required=True)
    parser.add_argument("--agent-cases", type=Path, required=True)
    parser.add_argument("--outdir", type=Path, required=True)
    args = parser.parse_args()
    args.outdir.mkdir(parents=True, exist_ok=True)

    all_tasks = [json.loads(line) for line in args.benchmark.read_text().splitlines() if line]
    tasks = [x for x in all_tasks if x["split"] == "evaluation"]
    contract = json.loads(args.contract.read_text())
    contract_sha = hashlib.sha256(args.contract.read_bytes()).hexdigest()
    by_set: dict[str, dict[str, dict[str, Any]]] = {}
    for task in tasks:
        by_set.setdefault(task["set_id"], {})[task["variant"]] = task
    all_by_set: dict[str, dict[str, dict[str, Any]]] = {}
    for task in all_tasks:
        all_by_set.setdefault(task["set_id"], {})[task["variant"]] = task

    cases = pd.read_csv(args.agent_cases)
    plans = cases[cases.variant.eq("valid")].copy()
    run_keys = cases[["model", "condition", "replication"]].drop_duplicates()
    expected_plans = len(run_keys) * len(by_set)
    if len(plans) != expected_plans:
        raise RuntimeError(f"Expected {expected_plans} model-conditioned plans, found {len(plans)}")

    strategies = [
        "stale_authorization",
        "payload_receipt",
        "full_state_fail_closed",
        "full_state_revalidate",
        "operation_scoped_revalidate",
        "always_revalidate",
    ]
    rows = []
    for _, plan_row in plans.iterrows():
        variants = by_set[str(plan_row.set_id)]
        plan = variants["valid"]
        plan_accept = str(plan_row.decision) == "ACCEPT"
        plan_payload = digest(payload_projection(plan))
        plan_full = digest(full_projection(plan, contract_sha))
        plan_scoped = digest(scoped_projection(plan, contract, contract_sha))
        for variant_name in ["valid", "plausible_conflict", "missing_obligation", "irrelevant_metadata"]:
            current = variants[variant_name]
            oracle, oracle_field = table_oracle(current, contract)
            current_payload = digest(payload_projection(current))
            current_full = digest(full_projection(current, contract_sha))
            current_scoped = digest(scoped_projection(current, contract, contract_sha))
            expected_release = oracle == "ACCEPT"
            for strategy in strategies:
                released, revalidated, reason = strategy_result(
                    strategy, plan_accept, plan_payload, plan_full, plan_scoped,
                    current_payload, current_full, current_scoped, oracle,
                )
                rows.append({
                    "model": plan_row.model,
                    "condition": plan_row.condition,
                    "set_id": plan_row.set_id,
                    "operation": current["operation"],
                    "variant": variant_name,
                    "strategy": strategy,
                    "plan_decision": plan_row.decision,
                    "oracle_decision": oracle,
                    "oracle_field": oracle_field,
                    "released": released,
                    "expected_release": expected_release,
                    "unsafe_release": released and not expected_release,
                    "false_invalidation": (not released) and expected_release,
                    "correct_release_boundary": released == expected_release,
                    "revalidated": revalidated,
                    "reason": reason,
                })
    frame = pd.DataFrame(rows)
    frame.to_csv(args.outdir / "tas_model_conditioned_commit_replay_v4.csv", index=False)

    metrics = frame.groupby(["condition", "strategy"]).agg(
        n=("set_id", "size"),
        release_boundary_accuracy=("correct_release_boundary", "mean"),
        unsafe_release_rate=("unsafe_release", "mean"),
        false_invalidation_rate=("false_invalidation", "mean"),
        revalidation_rate=("revalidated", "mean"),
    ).reset_index()
    invalid = frame[frame.variant.isin(["plausible_conflict", "missing_obligation"])]
    unsafe_cond = invalid.groupby(["condition", "strategy"]).unsafe_release.mean()
    relevant = frame[frame.variant.isin(["valid", "irrelevant_metadata"])]
    coverage_cond = relevant.groupby(["condition", "strategy"]).released.mean()
    metrics["unsafe_release_given_invalid"] = [unsafe_cond.loc[(r.condition, r.strategy)] for _, r in metrics.iterrows()]
    metrics["valid_release_coverage"] = [coverage_cond.loc[(r.condition, r.strategy)] for _, r in metrics.iterrows()]
    metrics.to_csv(args.outdir / "tas_model_conditioned_commit_metrics_v4.csv", index=False)

    canonical_rows = []
    for set_id, variants in sorted(all_by_set.items()):
        plan = variants["valid"]
        base = digest(scoped_projection(plan, contract, contract_sha))
        for name, changed in representation_variants(plan):
            canonical_rows.append({
                "set_id": set_id,
                "transformation": name,
                "digest_preserved": digest(scoped_projection(changed, contract, contract_sha)) == base,
            })
    canonical = pd.DataFrame(canonical_rows)
    canonical.to_csv(args.outdir / "tas_canonicalization_tests_v4.csv", index=False)
    if not canonical.digest_preserved.all():
        raise RuntimeError("Canonicalization invariance failed")

    necessity = []
    for family in sorted({x["mutation_family"] for x in all_tasks if x["variant"] == "plausible_conflict"}):
        subset = [x for x in all_tasks if x["variant"] == "plausible_conflict" and x["mutation_family"] == family]
        necessity.append({
            "dependency": family,
            "witness_pairs": len(subset),
            "same_numeric_payload": all(digest(payload_projection(x)) == digest(payload_projection(all_by_set[x["set_id"]]["valid"])) for x in subset),
            "authorization_changed": all(table_oracle(x, contract)[0] != "ACCEPT" for x in subset),
            "scoped_receipt_changed": all(digest(scoped_projection(x, contract, contract_sha)) != digest(scoped_projection(all_by_set[x["set_id"]]["valid"], contract, contract_sha)) for x in subset),
        })

    special_specs = {
        "period": ("difference", lambda task: task["operands"][1].__setitem__("period", str(task["operands"][0]["period"]) + "-changed")),
        "series_id": ("growth", lambda task: task["operands"][1].__setitem__("series_id", str(task["operands"][0]["series_id"]) + "-changed")),
        "zero_denominator": ("ratio", lambda task: task["operands"][1].__setitem__("value", 0)),
    }
    valid_all = [x for x in all_tasks if x["variant"] == "valid"]
    for dependency, (operation, mutate) in special_specs.items():
        plan = copy.deepcopy(next(x for x in valid_all if x["operation"] == operation))
        changed = copy.deepcopy(plan)
        mutate(changed)
        changed_decision, changed_field = table_oracle(changed, contract)
        necessity.append({
            "dependency": dependency,
            "witness_pairs": 1,
            "same_numeric_payload": digest(payload_projection(changed)) == digest(payload_projection(plan)),
            "authorization_changed": changed_decision != "ACCEPT" and changed_field == dependency,
            "scoped_receipt_changed": digest(scoped_projection(changed, contract, contract_sha)) != digest(scoped_projection(plan, contract, contract_sha)),
        })
    necessity_frame = pd.DataFrame(necessity)
    necessity_frame.to_csv(args.outdir / "tas_dependency_witnesses_v4.csv", index=False)
    if not necessity_frame[["authorization_changed", "scoped_receipt_changed"]].all().all():
        raise RuntimeError("Dependency witness failed")

    selected = metrics[metrics.condition.eq("contract")].set_index("strategy")
    summary = {
        "model_conditioned_plans": len(plans),
        "sets": len(by_set),
        "transitions_per_plan": 4,
        "release_policies": len(strategies),
        "decisions": len(frame),
        "canonicalization_tests": len(canonical),
        "canonicalization_passed": int(canonical.digest_preserved.sum()),
        "dependency_families_witnessed": len(necessity_frame),
        "contract_condition": {
            strategy: {
                "boundary_accuracy": float(selected.loc[strategy, "release_boundary_accuracy"]),
                "unsafe_given_invalid": float(selected.loc[strategy, "unsafe_release_given_invalid"]),
                "valid_release_coverage": float(selected.loc[strategy, "valid_release_coverage"]),
                "revalidation_rate": float(selected.loc[strategy, "revalidation_rate"]),
            }
            for strategy in strategies
        },
        "interpretation": (
            "The replay composes observed plan-time model decisions with an executable commit controller. "
            "It is a trace-replay experiment over controlled provider-faithful states, not a live external deployment."
        ),
    }
    (args.outdir / "tas_runtime_summary_v4.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
