#!/usr/bin/env python3
"""Defeater-aware public audit of federal high-impact AI exclusions.

The estimand is the public support carried by a negative determination, not
whether the agency's underlying legal conclusion is correct. The 2025 OMB
inventory is a finite population, so the script reports exact quantities and a
rationale-portability randomization test rather than census bootstrap intervals.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import subprocess
import tempfile
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


NEGATIVE = "Presumed High-Impact, but Not High-impact"
CORE_FIELDS = ["problem_solved", "benefits", "system_outputs", "data_description"]

POLICY_TARGET = re.compile(
    r"principal\s+basis|legal[, ]+material[, ]+binding|similarly\s+significant|"
    r"significant\s+effect|civil rights|civil liberties|rights or safety|"
    r"high[- ]impact definition|section\s+[56]|basis for (?:a |any )?(?:decision|action)", re.I
)
OUTPUT = re.compile(
    r"\bAI(?:'s|’s)?\s+output|\boutput|alert|score|prediction|recommendation|detection|"
    r"classification|assessment|translation|transcription|search result|tag|summary|"
    r"image|report|lead|insight|risk profile|bounding box|digital track|signal|model result", re.I
)
ACTOR = re.compile(
    r"\bhuman|officer|agent|analyst|user|reviewer|personnel|supervisor|operator|"
    r"investigator|employee|official|attorney|judge|staff|crew|traveler", re.I
)
ACTION = re.compile(
    r"\bdecision|action|enforcement|inspection|investigation|prosecut|adjudicat|"
    r"eligib|benefit|audit|dispatch|respond|arrest|detention|follow[- ]?up|"
    r"secondary inspection|mitigat|access|target|select|referr|permit|grant|repair", re.I
)
INDEPENDENT_BASIS = re.compile(
    r"independent|validat|verif|corroborat|other (?:source|data|information)|"
    r"additional (?:source|evidence|review)|source material|multiple sources|"
    r"broader (?:process|investigation)|full .* investigation process|"
    r"judicial|supervisory review|government data holdings|vetted through|"
    r"multiple information sources|"
    r"does not rely solely|not solely|along with other", re.I
)
OPTIONAL_ALTERNATIVE = re.compile(
    r"\boptional|not a requirement|may continue|alternative (?:process|method)|"
    r"another (?:process|method)|opt[- ]?out|manual (?:process|option)", re.I
)
NARROW_MECHANISM = re.compile(
    r"informational purposes? only|does not take any action|only gives information|"
    r"only identifies|simply identifying|used solely for|output(?:s)? (?:is|are) limited to|"
    r"limited to (?:normalized|extracting|identifying|technical)|cannot harm humans|"
    r"not used for tracking or analysis|narrowly (?:defined|focused)", re.I
)
HUMAN_REVIEW_WARRANT = re.compile(
    r"human (?:review|oversight|approval|decision)|reviewed by (?:a )?human|"
    r"humans? (?:make|makes|perform|review|approve|decide)|final decisions? (?:is|are) made|"
    r"recommendations? only|only recommendations?|authorized staff to review|"
    r"does not approve|mandatory human review", re.I
)
STAGE = re.compile(
    r"not yet (?:live|deployed|in production)|pre[- ]?deployment|pilot|research|"
    r"further review|development stage|retired|exploratory R&D|not an operational", re.I
)
ARTIFACT_ANCHOR = re.compile(
    r"privacy impact assessment|\bPIA\b|assessment|audit|test(?:ing)?|protocol|"
    r"policy|standard operating procedure|SOP|record|documentation", re.I
)
URL_RE = re.compile(r"https?://[^\s,;]+", re.I)

STOP = {
    "a", "an", "and", "are", "as", "at", "be", "because", "by", "does", "for", "from",
    "has", "have", "in", "is", "it", "its", "not", "of", "on", "or", "that", "the",
    "their", "this", "to", "use", "used", "uses", "with", "would", "ai", "case", "high",
    "impact", "output", "outputs", "decision", "decisions", "action", "actions", "principal",
    "basis", "individual", "entity", "legal", "material", "binding", "significant", "effect",
    "system", "serve", "serves",
}


def clean(value: object) -> str:
    if pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def tokens(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z][a-z0-9-]{2,}", text.lower()) if w not in STOP]


def public_argument(text: str) -> dict[str, object]:
    """Classify the public rationale under a conservative, defeater-first rule."""
    criterion = bool(POLICY_TARGET.search(text))
    output = bool(OUTPUT.search(text))
    actor = bool(ACTOR.search(text))
    action = bool(ACTION.search(text))
    independent = bool(INDEPENDENT_BASIS.search(text))
    optional = bool(OPTIONAL_ALTERNATIVE.search(text))
    narrow = bool(NARROW_MECHANISM.search(text))
    oversight = bool(HUMAN_REVIEW_WARRANT.search(text))
    stage = bool(STAGE.search(text))
    artifact = bool(ARTIFACT_ANCHOR.search(text))

    rebuttal_mechanism = independent or optional or narrow
    supported = bool(text and criterion and output and rebuttal_mechanism)
    human_only_defeater = bool(text and oversight and not rebuttal_mechanism)
    if human_only_defeater:
        status = "D: public defeater undefeated"
    elif supported:
        status = "S: minimally supported rebuttal"
    else:
        status = "U: publicly unresolved"

    if not text:
        ladder = "L0 missing"
    elif supported and artifact:
        ladder = "L3 claim-mechanism-anchor"
    elif supported:
        ladder = "L2 claim-mechanism"
    elif criterion:
        ladder = "L1 policy conclusion"
    else:
        ladder = "L0 ungrounded narrative"
    return {
        "criterion": int(criterion), "output": int(output), "actor": int(actor),
        "action": int(action), "independent_basis": int(independent),
        "optional_alternative": int(optional), "narrow_mechanism": int(narrow),
        "human_review_warrant": int(oversight), "stage_only_signal": int(stage),
        "artifact_anchor": int(artifact), "rebuttal_mechanism": int(rebuttal_mechanism),
        "supported": int(status.startswith("S:")), "defeater": int(status.startswith("D:")),
        "unresolved": int(status.startswith("U:")), "argument_status": status,
        "evidence_ladder": ladder,
    }


def tfidf_vectors(rationales: Iterable[str], records: Iterable[str]) -> tuple[list[dict[str, float]], list[dict[str, float]]]:
    docs = [tokens(x) for x in list(rationales) + list(records)]
    df = Counter()
    for doc in docs:
        df.update(set(doc))
    n = len(docs)

    def vector(doc: list[str]) -> dict[str, float]:
        counts = Counter(doc)
        raw = {w: (1.0 + math.log(c)) * (math.log((1 + n) / (1 + df[w])) + 1.0) for w, c in counts.items()}
        norm = math.sqrt(sum(v * v for v in raw.values())) or 1.0
        return {w: v / norm for w, v in raw.items()}

    vecs = [vector(doc) for doc in docs]
    half = len(vecs) // 2
    return vecs[:half], vecs[half:]


def cosine(a: dict[str, float], b: dict[str, float]) -> float:
    if len(a) > len(b):
        a, b = b, a
    return sum(v * b.get(k, 0.0) for k, v in a.items())


def portability_test(neg: pd.DataFrame, reps: int = 20_000, seed: int = 20260901) -> tuple[pd.DataFrame, dict[str, object]]:
    """Randomize rationales within agency to measure case-specific fit."""
    rationales = neg["justification"].tolist()
    records = neg["record_without_justification"].tolist()
    rv, xv = tfidf_vectors(rationales, records)
    observed_scores = np.array([cosine(a, b) for a, b in zip(rv, xv)])
    groups: dict[str, list[int]] = defaultdict(list)
    for i, agency in enumerate(neg["agency"].astype(str)):
        groups[agency].append(i)
    permutable = [i for ids in groups.values() if len(ids) > 1 for i in ids]
    observed = float(observed_scores[permutable].mean())
    rng = np.random.default_rng(seed)
    null = np.empty(reps)
    indices = np.arange(len(neg))
    for r in range(reps):
        assigned = indices.copy()
        for ids in groups.values():
            if len(ids) > 1:
                assigned[ids] = rng.permutation(ids)
        null[r] = np.mean([cosine(rv[assigned[i]], xv[i]) for i in permutable])
    p = float((1 + np.count_nonzero(null >= observed - 1e-15)) / (reps + 1))

    top_fraction = []
    for i, agency in enumerate(neg["agency"].astype(str)):
        candidates = groups[agency]
        scores = np.array([cosine(rv[i], xv[j]) for j in candidates])
        best = scores.max()
        ties = [j for j, score in zip(candidates, scores) if abs(score - best) < 1e-12]
        top_fraction.append((1.0 / len(ties)) if i in ties else 0.0)

    rows = neg[["agency", "id", "use_case_name"]].copy()
    rows["own_rationale_record_tfidf_cosine"] = observed_scores
    rows["own_record_is_top_match_fractional"] = top_fraction
    result = {
        "design": "20,000 within-agency rationale-label permutations; case text fixed",
        "n_permutable_cases": len(permutable), "observed_mean_fit": observed,
        "null_mean": float(null.mean()),
        "null_quantiles_025_975": [float(np.quantile(null, .025)), float(np.quantile(null, .975))],
        "one_sided_randomization_p": p, "specificity_gap": float(observed - null.mean()),
        "fractional_top1_rate": float(np.mean(top_fraction)),
        "chance_top1_rate": float(np.mean([1 / len(groups[a]) for a in neg["agency"].astype(str)])),
        "interpretation": "A positive gap means rationales contain more case-specific language than agency-matched alternatives; it does not validate the policy conclusion.",
    }
    return rows, result


def extract_urls(value: object) -> list[str]:
    return [u.rstrip(").]>'\"") for u in URL_RE.findall(clean(value))]


def bytes_to_text(body: bytes, content_type: str) -> str:
    if body[:4] == b"%PDF" or "pdf" in content_type.lower():
        with tempfile.TemporaryDirectory() as td:
            pdf = Path(td) / "artifact.pdf"
            txt = Path(td) / "artifact.txt"
            pdf.write_bytes(body)
            proc = subprocess.run(["pdftotext", "-layout", str(pdf), str(txt)], capture_output=True)
            if proc.returncode == 0 and txt.exists():
                return txt.read_text(encoding="utf-8", errors="ignore")
        return ""
    decoded = body.decode("utf-8", errors="ignore")
    decoded = re.sub(r"(?is)<script.*?</script>|<style.*?</style>", " ", decoded)
    return re.sub(r"(?s)<[^>]+>", " ", decoded)


def audit_url(url: str, raw_dir: Path) -> dict[str, object]:
    digest = hashlib.sha256(url.encode()).hexdigest()[:20]
    body_path = raw_dir / f"{digest}.bin"
    meta_path = raw_dir / f"{digest}.json"
    raw_dir.mkdir(parents=True, exist_ok=True)
    if body_path.exists() and meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        text = bytes_to_text(body_path.read_bytes(), str(meta.get("content_type", "")))
        return {**meta, "text": clean(text)}
    req = urllib.request.Request(url, headers={"User-Agent": "AAAI-ATRACC-public-artifact-audit/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = response.read(15_000_000)
            meta = {"url": url, "resolved_url": response.geturl(), "http_status": response.status,
                    "content_type": response.headers.get("Content-Type", ""), "bytes": len(body), "error": ""}
        body_path.write_bytes(body)
        meta_path.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
        return {**meta, "text": clean(bytes_to_text(body, meta["content_type"]))}
    except Exception as exc:
        return {"url": url, "resolved_url": "", "http_status": 0, "content_type": "", "bytes": 0,
                "error": f"{type(exc).__name__}: {exc}", "text": ""}


def artifact_audit(neg: pd.DataFrame, raw_dir: Path) -> tuple[pd.DataFrame, dict[str, object]]:
    jobs = []
    for i, row in neg.iterrows():
        for url in extract_urls(row.get("pia_url", "")):
            jobs.append((i, url))
    fetched: dict[str, dict[str, object]] = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(audit_url, url, raw_dir): url for _, url in jobs}
        for future in as_completed(futures):
            fetched[futures[future]] = future.result()

    rows = []
    for i, url in jobs:
        case = neg.loc[i]
        result = fetched[url]
        text = str(result.get("text", ""))
        title_terms = [t for t in tokens(clean(case["use_case_name"])) if len(t) >= 4]
        matched = sorted({term for term in title_terms if re.search(rf"\b{re.escape(term)}\b", text, re.I)})
        capitals = re.findall(r"\b[A-Z][A-Za-z]+\b", clean(case["use_case_name"]))
        acronym = "".join(w[0] for w in capitals)
        same_system = bool(len(matched) >= 2 or (len(acronym) >= 3 and acronym.lower() in text.lower()))
        criterion = bool(POLICY_TARGET.search(text))
        control = bool(INDEPENDENT_BASIS.search(text))
        candidate = bool(result.get("http_status") and same_system and criterion and control)
        rows.append({
            "agency": case["agency"], "id": case["id"], "use_case_name": case["use_case_name"],
            "url": url, "resolved_url": result.get("resolved_url", ""),
            "http_status": result.get("http_status", 0), "content_type": result.get("content_type", ""),
            "bytes": result.get("bytes", 0), "error": result.get("error", ""),
            "same_system_signal": int(same_system), "matched_title_terms": "; ".join(matched[:12]),
            "policy_criterion_signal": int(criterion), "independent_control_signal": int(control),
            "rebuttal_support_candidate": int(candidate),
        })
    frame = pd.DataFrame(rows)
    summary = {
        "inventory_rows_with_pia_field": int(neg["pia_url"].map(clean).ne("").sum()),
        "extracted_urls": len(rows),
        "http_resolved": int(frame["http_status"].between(200, 399).sum()) if len(frame) else 0,
        "same_system_signal": int(frame["same_system_signal"].sum()) if len(frame) else 0,
        "policy_criterion_signal": int(frame["policy_criterion_signal"].sum()) if len(frame) else 0,
        "rebuttal_support_candidates": int(frame["rebuttal_support_candidate"].sum()) if len(frame) else 0,
        "boundary": "Automated recovery signals only. Links do not upgrade S/U/D status and are not findings about the adequacy of a PIA.",
    }
    return frame, summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--outdir", type=Path, required=True)
    parser.add_argument("--skip-artifacts", action="store_true")
    args = parser.parse_args()
    args.outdir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.input)
    neg = df.loc[df["is_high_impact"].eq(NEGATIVE)].copy()
    if len(neg) != 110:
        raise RuntimeError(f"Expected the 110-row 2025 population; found {len(neg)}")
    neg["justification"] = neg["HI_justification"].map(clean)
    neg["record_without_justification"] = neg.apply(
        lambda row: " ".join(clean(row.get(c, "")) for c in ["use_case_name", "topic_area"] + CORE_FIELDS), axis=1
    )
    coded = neg["justification"].map(public_argument).apply(pd.Series)
    neg = pd.concat([neg, coded], axis=1)
    neg["word_count"] = neg["justification"].str.findall(r"\b\w+(?:[-']\w+)*\b").str.len()
    neg["exact_reuse_n"] = neg.groupby("justification")["justification"].transform("size")

    portability_rows, portability = portability_test(neg)
    portability_rows.to_csv(args.outdir / "atracc_portability_case_scores.csv", index=False)

    if args.skip_artifacts:
        artifact_summary = {"skipped": True}
    else:
        artifacts, artifact_summary = artifact_audit(neg, args.outdir / "artifact_cache")
        artifacts.to_csv(args.outdir / "atracc_artifact_audit.csv", index=False)

    n = len(neg)
    s = int(neg["supported"].sum())
    d = int(neg["defeater"].sum())
    u = int(neg["unresolved"].sum())
    agency = neg.groupby("agency").agg(
        n=("use_case_name", "size"), supported=("supported", "sum"),
        unresolved=("unresolved", "sum"), defeater=("defeater", "sum")
    ).reset_index()
    agency.to_csv(args.outdir / "atracc_agency_partition.csv", index=False)

    summary = {
        "source": {"path": str(args.input), "sha256": sha256(args.input), "rows": len(df), "columns": len(df.columns)},
        "population": {
            "n": n, "agencies": int(neg["agency"].nunique()),
            "agency_counts": {str(k): int(v) for k, v in neg["agency"].value_counts().items()},
            "nonblank_justifications": int(neg["justification"].ne("").sum()),
            "unique_nonblank_justifications": int(neg.loc[neg.justification.ne(""), "justification"].nunique()),
            "rows_in_reuse_clusters": int(neg.loc[neg.exact_reuse_n.gt(1)].shape[0]),
            "median_words": float(neg.word_count.median()),
            "iqr_words": [float(neg.word_count.quantile(.25)), float(neg.word_count.quantile(.75))],
        },
        "defeater_partition": {
            "supported_n": s, "supported_share": s / n,
            "unresolved_n": u, "unresolved_share": u / n,
            "defeater_n": d, "defeater_share": d / n,
            "logical_support_bounds": [s / n, (s + u) / n],
            "identity_check": s + u + d,
            "status_counts": {str(k): int(v) for k, v in neg["argument_status"].value_counts().items()},
        },
        "evidence_ladder": {str(k): int(v) for k, v in neg["evidence_ladder"].value_counts().items()},
        "signals": {
            key: int(neg[key].sum()) for key in ["criterion", "output", "actor", "action", "independent_basis",
                                                        "optional_alternative", "narrow_mechanism", "human_review_warrant",
                                                        "stage_only_signal", "artifact_anchor"]
        },
        "portability_test": portability,
        "artifact_recovery": artifact_summary,
        "no_sampling_interval_reason": "The 110 records are the complete disclosed 2025 population under the stated filter, not a probability sample.",
        "interpretation_boundary": "S/U/D describe public argumentative support. They do not determine legal compliance, internal evidence, or the correctness of an agency classification.",
    }

    export = [
        "agency", "agency_name", "id", "use_case_name", "development_stage", "topic_area",
        "justification", "word_count", "exact_reuse_n", "criterion", "output", "actor", "action",
        "independent_basis", "optional_alternative", "narrow_mechanism", "human_review_warrant",
        "stage_only_signal", "artifact_anchor", "rebuttal_mechanism", "supported", "unresolved", "defeater",
        "argument_status", "evidence_ladder", "problem_solved", "benefits", "system_outputs",
        "data_description", "link_to_data", "pia_url", "code_url", "system_name_ato",
    ]
    neg[export].to_csv(args.outdir / "atracc_case_audit.csv", index=False)
    (args.outdir / "atracc_summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    (args.outdir / "atracc_codebook.json").write_text(json.dumps({
        "policy_target": POLICY_TARGET.pattern, "output": OUTPUT.pattern, "actor": ACTOR.pattern,
        "action": ACTION.pattern, "independent_basis": INDEPENDENT_BASIS.pattern,
        "optional_alternative": OPTIONAL_ALTERNATIVE.pattern, "narrow_mechanism": NARROW_MECHANISM.pattern,
        "human_review_warrant": HUMAN_REVIEW_WARRANT.pattern, "stage": STAGE.pattern,
        "supported_rule": "criterion AND output AND (independent_basis OR optional_alternative OR narrow_mechanism)",
        "defeater_rule": "human_review_warrant AND NOT rebuttal_mechanism; defeater takes precedence",
        "unresolved_rule": "neither supported nor undefeated public defeater",
    }, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
