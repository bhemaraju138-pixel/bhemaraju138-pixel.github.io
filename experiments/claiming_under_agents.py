#!/usr/bin/env python3
"""Stylized fixed-point model of agent-mediated public-benefit claiming.

This is a theory-building artifact, not a calibrated estimate or policy forecast.
The parameters encode qualitative mechanisms so the implied empirical contrasts
can be inspected, challenged, and redesigned.
"""

from __future__ import annotations

import csv
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"


@dataclass(frozen=True)
class Group:
    resource: str
    eligible: bool
    share: float
    document_cost: float
    information_cost: float


GROUPS = (
    Group("low", True, 0.30, 0.42, 0.62),
    Group("high", True, 0.25, 0.18, 0.36),
    Group("low", False, 0.20, 0.42, 0.62),
    Group("high", False, 0.25, 0.18, 0.36),
)

SCENARIOS = (
    "No agent",
    "General-purpose agents",
    "Unequal private agents",
    "Audited public agent",
)


def logistic(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))


def scenario_parameters(name: str, quality_gap: float) -> dict:
    if name == "No agent":
        return {
            "reduction": {"low": 0.0, "high": 0.0},
            "error": {"low": 0.02, "high": 0.02},
            "capacity_boost": 0.0,
        }
    if name == "General-purpose agents":
        return {
            "reduction": {
                "low": clamp(0.43 - quality_gap / 2, 0.0, 0.8),
                "high": clamp(0.43 + quality_gap / 2, 0.0, 0.8),
            },
            "error": {
                "low": 0.12 + quality_gap * 0.12,
                "high": max(0.04, 0.12 - quality_gap * 0.10),
            },
            "capacity_boost": 0.0,
        }
    if name == "Unequal private agents":
        return {
            "reduction": {
                "low": clamp(0.27 - quality_gap / 3, 0.0, 0.85),
                "high": clamp(0.58 + quality_gap / 3, 0.0, 0.85),
            },
            "error": {
                "low": 0.18 + quality_gap * 0.10,
                "high": max(0.03, 0.08 - quality_gap * 0.05),
            },
            "capacity_boost": 0.0,
        }
    if name == "Audited public agent":
        return {
            "reduction": {
                "low": clamp(0.55 - quality_gap * 0.08, 0.0, 0.8),
                "high": clamp(0.55 + quality_gap * 0.08, 0.0, 0.8),
            },
            "error": {"low": 0.025, "high": 0.025},
            "capacity_boost": 0.05,
        }
    raise ValueError(f"Unknown scenario: {name}")


def run_model(
    scenario: str,
    agency_capacity: float = 0.37,
    verification_response: float = 0.55,
    quality_gap: float = 0.25,
) -> dict:
    parameters = scenario_parameters(scenario, quality_gap)
    verification = 0.16
    group_results: list[dict] = []
    application_volume = 0.0

    for _ in range(200):
        group_results = []
        for group in GROUPS:
            reduction = parameters["reduction"][group.resource]
            error = parameters["error"][group.resource]
            information_cost = group.information_cost * (1 - reduction)

            if group.eligible:
                perceived_approval = 0.88 - error * 0.35 - verification * 0.10
                utility = (
                    perceived_approval
                    - information_cost
                    - verification * group.document_cost
                    - 0.06
                )
            else:
                perceived_approval = 0.03 + error * 1.20
                utility = (
                    perceived_approval * 0.70
                    - information_cost * 0.55
                    - verification * group.document_cost
                    - 0.18
                )

            group_results.append(
                {
                    **asdict(group),
                    "apply_probability": logistic(6 * utility),
                    "experienced_burden": information_cost
                    + verification * group.document_cost,
                }
            )

        application_volume = sum(
            result["share"] * result["apply_probability"]
            for result in group_results
        )
        effective_capacity = agency_capacity + parameters["capacity_boost"]
        target_verification = clamp(
            0.16
            + verification_response
            * max(0.0, application_volume - effective_capacity)
            / effective_capacity,
            0.16,
            0.92,
        )
        next_verification = verification * 0.65 + target_verification * 0.35
        if abs(next_verification - verification) < 1e-8:
            verification = next_verification
            break
        verification = next_verification

    def pick(resource: str, eligible: bool) -> dict:
        return next(
            result
            for result in group_results
            if result["resource"] == resource and result["eligible"] is eligible
        )

    low_eligible = pick("low", True)
    high_eligible = pick("high", True)
    false_applications = sum(
        result["share"] * result["apply_probability"]
        for result in group_results
        if not result["eligible"]
    )

    return {
        "scenario": scenario,
        "application_volume": application_volume,
        "verification": verification,
        "low_eligible_take_up": low_eligible["apply_probability"],
        "high_eligible_take_up": high_eligible["apply_probability"],
        "access_gap": high_eligible["apply_probability"]
        - low_eligible["apply_probability"],
        "low_resource_burden": low_eligible["experienced_burden"],
        "false_application_share": false_applications / application_volume,
        "groups": group_results,
    }


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    baseline_parameters = {
        "agency_capacity": 0.37,
        "verification_response": 0.55,
        "quality_gap": 0.25,
    }
    baseline = [run_model(scenario, **baseline_parameters) for scenario in SCENARIOS]

    sensitivity = []
    for capacity in (0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55):
        for response in (0.0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90):
            for gap in (0.0, 0.10, 0.20, 0.30, 0.40, 0.50):
                for scenario in SCENARIOS:
                    result = run_model(scenario, capacity, response, gap)
                    sensitivity.append(
                        {
                            "agency_capacity": capacity,
                            "verification_response": response,
                            "quality_gap": gap,
                            **{
                                key: value
                                for key, value in result.items()
                                if key != "groups"
                            },
                        }
                    )

    payload = {
        "title": "The Burden Moves",
        "version": "1.0",
        "published": "2026-08-23",
        "evidence_status": (
            "Stylized theory-building simulation; illustrative parameters; "
            "not a causal estimate or forecast."
        ),
        "baseline_parameters": baseline_parameters,
        "baseline_results": baseline,
        "sensitivity_grid": sensitivity,
    }
    json_path = DATA_DIR / "claiming-under-agents-results.json"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    csv_path = DATA_DIR / "claiming-under-agents-sensitivity.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=sensitivity[0].keys())
        writer.writeheader()
        writer.writerows(sensitivity)

    for result in baseline:
        print(
            f"{result['scenario']}: "
            f"low take-up={result['low_eligible_take_up']:.3f}, "
            f"high take-up={result['high_eligible_take_up']:.3f}, "
            f"gap={result['access_gap']:.3f}, "
            f"verification={result['verification']:.3f}"
        )
    print(json_path)
    print(csv_path)


if __name__ == "__main__":
    main()
