#!/usr/bin/env python3
"""Reproduce the ATRACC synthetic construct-conformance checks.

The expected labels are construction-time test expectations, not independent
human ground truth. The lexical comparator is an implementation baseline, not
the five-pass semantic coding protocol used on the public inventory.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/experiments/atracc_v4/conformance"
CASES = OUT / "atracc_50_synthetic_conformance_cases.csv"
RESULTS = OUT / "atracc_50_lexical_conformance_results.csv"
SUMMARY = OUT / "atracc_50_conformance_summary.json"
MANIFEST = OUT / "atracc_50_conformance_manifest.json"

COMPONENTS = ("P", "O", "Wind", "Wopt", "Wnar", "H")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def derive_status(p: str, o: str, wind: str, wopt: str, wnar: str, h: str) -> str:
    mechanism = any(value == "YES" for value in (wind, wopt, wnar))
    supported = p == "YES" and o == "YES" and mechanism
    if supported:
        return "S"
    if h == "YES" and not mechanism:
        return "D"
    return "U"


DENIAL_VERB_RE = re.compile(
    r"\b(?:not|does not|is not|do not)\s+(?:solely\s+)?"
    r"(?:serve as|rely on|use|treat|present|meet|based on|treated as|determine)\b",
    re.IGNORECASE,
)
SPECIFIC_PREDICATE_RE = re.compile(
    r"(principal basis|high-impact predicate|C\.F\.R\.|M-25-21|eligibility threshold|\bthreshold\b|"
    r"regardless of the (?:score|recommendation|checklist|ranking|estimate|output))",
    re.IGNORECASE,
)
OUTPUT_NOUNS_RE = re.compile(
    r"\b(score|recommendation|summary|ranking|checklist|estimate|output|metric|letter|"
    r"result|list|rating|suggestion|answer\w*|response\w*|disposition)\b",
    re.IGNORECASE,
)
PRODUCTION_VERB_RE = re.compile(
    r"\b(generat\w*|produc\w*|comput\w*|calculat\w*|draft\w*|rank\w*|flag\w*|extract\w*|answer\w*)\b",
    re.IGNORECASE,
)
WORKFLOW_PHRASE_RE = re.compile(
    r"(entered (?:directly )?into|attached to|recorded in|written into|logged in|placed in|"
    r"used to|receives|to consider|sequence|assigned|queue position|populate|case file|"
    r"case management system|awaiting|authorization queue|for (?:approval|denial|benefit|"
    r"permit|grant|tax|disaster|license|loan|personnel|zoning|adjudication|examination|"
    r"assistance|scheduling)|before any|any (?:zoning determination|denial|adjudication|"
    r"examination|personnel action|consequential action|determination)|support(?:s|ed)? the "
    r"adjudication|combined with)",
    re.IGNORECASE,
)
NEGATED_INDEPENDENT_RE = re.compile(r"\bnot\s+independently\b", re.IGNORECASE)
JUDGMENT_EXCLUSION_RE = re.compile(r"independent\s+(?:judgment|discretion|assessment)\b", re.IGNORECASE)
INDEPENDENT_RE = re.compile(r"\bindependent(?:ly)?\b", re.IGNORECASE)
SOURCE_VERB_RE = re.compile(
    r"\b(verif\w*|re-?deriv\w*|reverif\w*|cross-?check\w*|recomput\w*|recalculat\w*|"
    r"reconstruct\w*|confirm\w*|sourced)\b",
    re.IGNORECASE,
)
OPTIONAL_PATH_RE = re.compile(
    r"(manual review path|manual scheduling system|manual document-review workflow|"
    r"remains (?:fully )?available|not required to (?:rely|use))",
    re.IGNORECASE,
)
NARROW_BOUND_RE = re.compile(
    r"(technically restricted|cannot (?:read or write|independently trigger)|read-only|"
    r"no write-back|isolated (?:evaluation )?sandbox|no output field mapped|capped so)",
    re.IGNORECASE,
)
HUMAN_REVIEW_RE = re.compile(
    r"(review(?:s|ed|ing)?|approv\w*|discretion|sign\w*\s+off|oversight|validat\w*|"
    r"exercising[^.]{0,20}judgment|final decision|decision-maker|makes? the [^.]{0,20}decision|"
    r"assessment of[^.]{0,30}controls?)",
    re.IGNORECASE,
)


def code_p(text: str) -> str:
    if DENIAL_VERB_RE.search(text):
        return "YES" if SPECIFIC_PREDICATE_RE.search(text) else "UNCLEAR"
    return "NO"


def code_o(text: str) -> str:
    noun = OUTPUT_NOUNS_RE.search(text)
    verb = PRODUCTION_VERB_RE.search(text)
    workflow = WORKFLOW_PHRASE_RE.search(text)
    if (noun or verb) and (workflow or (noun and verb)):
        return "YES"
    if noun or verb:
        return "UNCLEAR"
    return "NO"


def code_wind(text: str) -> str:
    if NEGATED_INDEPENDENT_RE.search(text):
        return "NO"
    for sentence in re.split(r"[.;]", text):
        if JUDGMENT_EXCLUSION_RE.search(sentence):
            continue
        if INDEPENDENT_RE.search(sentence) and SOURCE_VERB_RE.search(sentence):
            return "YES"
    return "NO"


def code_case(text: str) -> dict[str, str]:
    coded = {
        "P": code_p(text),
        "O": code_o(text),
        "Wind": code_wind(text),
        "Wopt": "YES" if OPTIONAL_PATH_RE.search(text) else "NO",
        "Wnar": "YES" if NARROW_BOUND_RE.search(text) else "NO",
        "H": "YES" if HUMAN_REVIEW_RE.search(text) else "NO",
    }
    coded["status"] = derive_status(*(coded[name] for name in COMPONENTS))
    return coded


def main() -> None:
    with CASES.open(newline="", encoding="utf-8") as handle:
        cases = list(csv.DictReader(handle))
    if len(cases) != 50 or len({row["id"] for row in cases}) != 50:
        raise ValueError("The conformance suite must contain 50 unique cases.")

    rows: list[dict[str, str]] = []
    formula_mismatches: list[str] = []
    for row in cases:
        expected_components = [row[f"expected_{name}"] for name in COMPONENTS]
        recomputed = derive_status(*expected_components)
        if row["expected_status"] != "contested" and recomputed != row["expected_status"]:
            formula_mismatches.append(row["id"])
        predicted = code_case(row["rationale"])
        rows.append(
            {
                "id": row["id"],
                "category": row["category"],
                "expected_status": row["expected_status"],
                **{f"lexical_{name}": predicted[name] for name in COMPONENTS},
                "lexical_status": predicted["status"],
            }
        )

    scoreable = [row for row in rows if row["expected_status"] != "contested"]
    case_lookup = {row["id"]: row for row in cases}
    status_correct = sum(row["lexical_status"] == row["expected_status"] for row in scoreable)
    component_correct = {
        name: sum(
            row[f"lexical_{name}"] == case_lookup[row["id"]][f"expected_{name}"]
            for row in scoreable
        )
        for name in COMPONENTS
    }
    mismatch_ids = [
        row["id"] for row in scoreable if row["lexical_status"] != row["expected_status"]
    ]

    OUT.mkdir(parents=True, exist_ok=True)
    with RESULTS.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    summary = {
        "interpretation_boundary": (
            "Purpose-built synthetic construct-conformance test; not independent human ground truth "
            "and not an accuracy estimate for the public inventory."
        ),
        "cases": len(cases),
        "scoreable_cases": len(scoreable),
        "contested_cases": len(cases) - len(scoreable),
        "expected_status_counts": dict(Counter(row["expected_status"] for row in cases)),
        "formula_mismatch_count": len(formula_mismatches),
        "formula_mismatch_ids": formula_mismatches,
        "lexical_status_correct": status_correct,
        "lexical_status_accuracy": status_correct / len(scoreable),
        "component_correct_out_of_47": component_correct,
        "component_accuracy": {
            name: component_correct[name] / len(scoreable) for name in COMPONENTS
        },
        "lexical_status_mismatch_ids": mismatch_ids,
    }
    SUMMARY.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    manifest = {
        "cases": {"path": str(CASES.relative_to(ROOT)), "sha256": sha256(CASES)},
        "script": {"path": str(Path(__file__).resolve().relative_to(ROOT)), "sha256": sha256(Path(__file__))},
        "results": {"path": str(RESULTS.relative_to(ROOT)), "sha256": sha256(RESULTS)},
        "summary": {"path": str(SUMMARY.relative_to(ROOT)), "sha256": sha256(SUMMARY)},
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
