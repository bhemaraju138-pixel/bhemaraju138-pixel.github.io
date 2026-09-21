#!/usr/bin/env python3
"""Cross-check every v7 claim against the archived metamorphic outputs."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SUMMARY = ROOT / "output/experiments/atracc_v7/metamorphic/summary.json"


def main() -> None:
    s = json.loads(SUMMARY.read_text(encoding="utf-8"))
    assert s["source_templates"] == 70
    assert s["verification"] == {"checks": 13, "passed": 13}
    assert s["total_usage"] == {
        "input_tokens": 1066192,
        "cached_input_tokens": 441600,
        "output_tokens": 173043,
        "reasoning_tokens": 74293,
    }

    astra = s["models"]["gpt-6-astra"]
    mini = s["models"]["gpt-5.4-mini-2026-03-17"]
    assert astra["whitespace"]["exact_component_vectors"] == 60
    assert mini["whitespace"]["exact_component_vectors"] == 38
    assert astra["whitespace"]["same_circuit_status"] == 69
    assert mini["whitespace"]["same_circuit_status"] == 61
    assert (astra["human_review"]["new_any_W_among_base_no_W"], astra["human_review"]["denominator_base_no_W"]) == (1, 53)
    assert (mini["human_review"]["new_any_W_among_base_no_W"], mini["human_review"]["denominator_base_no_W"]) == (4, 51)
    assert (astra["human_review"]["nonS_to_S"], astra["human_review"]["denominator_base_non_S"]) == (1, 53)
    assert (mini["human_review"]["nonS_to_S"], mini["human_review"]["denominator_base_non_S"]) == (4, 52)
    assert (astra["human_review"]["eligible_to_S"], astra["human_review"]["eligible_originals_P_yes_O_yes_no_W"]) == (1, 31)
    assert (mini["human_review"]["eligible_to_S"], mini["human_review"]["eligible_originals_P_yes_O_yes_no_W"]) == (4, 33)
    assert (astra["multiple_sources"]["new_any_W_among_base_no_W"], astra["multiple_sources"]["denominator_base_no_W"]) == (1, 53)
    assert (mini["multiple_sources"]["new_any_W_among_base_no_W"], mini["multiple_sources"]["denominator_base_no_W"]) == (6, 51)
    assert (astra["multiple_sources"]["new_W_ind_among_base_not_yes"], astra["multiple_sources"]["denominator_base_W_ind_not_yes"]) == (1, 63)
    assert (mini["multiple_sources"]["new_W_ind_among_base_not_yes"], mini["multiple_sources"]["denominator_base_W_ind_not_yes"]) == (2, 62)
    assert (astra["multiple_sources"]["nonS_to_S"], astra["multiple_sources"]["denominator_base_non_S"]) == (1, 53)
    assert (mini["multiple_sources"]["nonS_to_S"], mini["multiple_sources"]["denominator_base_non_S"]) == (6, 52)
    assert (astra["multiple_sources"]["eligible_to_S"], astra["multiple_sources"]["eligible_originals_P_yes_O_yes_no_W"]) == (1, 31)
    assert (mini["multiple_sources"]["eligible_to_S"], mini["multiple_sources"]["eligible_originals_P_yes_O_yes_no_W"]) == (6, 33)
    assert astra["independent_basis"]["W_ind_yes_all"] == 70
    assert mini["independent_basis"]["W_ind_yes_all"] == 70
    assert (astra["independent_basis"]["repair_eligible_to_S"], astra["independent_basis"]["repair_eligible_originals"]) == (31, 31)
    assert (mini["independent_basis"]["repair_eligible_to_S"], mini["independent_basis"]["repair_eligible_originals"]) == (31, 33)

    report = {
        "result": "PASS",
        "checked_claims": 29,
        "responses": 700,
        "models": list(s["models"]),
        "human_validation_claimed": False,
    }
    (ROOT / "output/experiments/atracc_v7/verification.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
