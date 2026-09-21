#!/usr/bin/env python3
"""Agreement, sensitivity, and legacy-baseline diagnostics for ATRACC v3."""

from __future__ import annotations

import argparse
import itertools
import json
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd


LABELS = ["S", "U", "D"]


def cohen_kappa(a: list[str], b: list[str]) -> float:
    observed = float(np.mean(np.array(a) == np.array(b)))
    pa = Counter(a); pb = Counter(b); n = len(a)
    expected = sum((pa[x] / n) * (pb[x] / n) for x in LABELS)
    return (observed - expected) / (1 - expected) if expected < 1 else 1.0


def fleiss_kappa(matrix: np.ndarray) -> float:
    n_items, n_raters = matrix.shape
    p = np.array([(matrix == label).sum() for label in LABELS], dtype=float) / (n_items * n_raters)
    per_item = np.array([
        sum(c * (c - 1) for c in Counter(row).values()) / (n_raters * (n_raters - 1))
        for row in matrix
    ])
    p_bar = float(per_item.mean())
    p_e = float((p ** 2).sum())
    return (p_bar - p_e) / (1 - p_e) if p_e < 1 else 1.0


def partition(matrix: np.ndarray, threshold: int) -> dict[str, int | float]:
    decisions = []
    for row in matrix:
        label, votes = Counter(row).most_common(1)[0]
        decisions.append(label if votes >= threshold else "U")
    counts = Counter(decisions)
    n = len(decisions)
    s, u, d = (int(counts.get(x, 0)) for x in LABELS)
    return {"threshold": threshold, "S": s, "U": u, "D": d, "lower": s / n, "upper": (s + u) / n}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--panel", type=Path, required=True)
    parser.add_argument("--comparison", type=Path, required=True)
    parser.add_argument("--outdir", type=Path, required=True)
    args = parser.parse_args()
    args.outdir.mkdir(parents=True, exist_ok=True)
    panel = pd.read_csv(args.panel)
    ids = list(dict.fromkeys(panel.id.astype(str)))
    pivot = panel.assign(id=panel.id.astype(str)).pivot(index="id", columns="lens", values="status").loc[ids]
    matrix = pivot.to_numpy()
    pairs = []
    for a, b in itertools.combinations(pivot.columns, 2):
        x, y = pivot[a].tolist(), pivot[b].tolist()
        pairs.append({
            "lens_a": int(a), "lens_b": int(b),
            "raw_agreement": float(np.mean(np.array(x) == np.array(y))),
            "cohen_kappa": cohen_kappa(x, y),
        })
    pd.DataFrame(pairs).to_csv(args.outdir / "atracc_pairwise_agreement.csv", index=False)
    curve = [partition(matrix, t) for t in [3, 4, 5]]
    pd.DataFrame(curve).to_csv(args.outdir / "atracc_vote_threshold_curve.csv", index=False)

    leave_one_out = []
    for removed in pivot.columns:
        sub = pivot.drop(columns=removed).to_numpy()
        result = partition(sub, 3)
        leave_one_out.append({"removed_lens": int(removed), **result})
    pd.DataFrame(leave_one_out).to_csv(args.outdir / "atracc_leave_one_lens_out.csv", index=False)

    comparison = pd.read_csv(args.comparison)
    legacy = comparison.legacy_status.astype(str).tolist()
    consensus = comparison.consensus_status.astype(str).tolist()
    confusion = pd.crosstab(comparison.legacy_status, comparison.consensus_status).reindex(index=LABELS, columns=LABELS, fill_value=0)
    confusion.to_csv(args.outdir / "atracc_legacy_confusion.csv")
    metrics = {}
    for label in ["S", "D"]:
        tp = sum(a == label and b == label for a, b in zip(legacy, consensus))
        fp = sum(a == label and b != label for a, b in zip(legacy, consensus))
        fn = sum(a != label and b == label for a, b in zip(legacy, consensus))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        metrics[label] = {"precision": precision, "recall": recall, "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0.0}
    summary = {
        "items": len(pivot),
        "passes": len(pivot.columns),
        "fleiss_kappa_nominal": fleiss_kappa(matrix),
        "mean_pairwise_agreement": float(np.mean([x["raw_agreement"] for x in pairs])),
        "mean_pairwise_cohen_kappa": float(np.mean([x["cohen_kappa"] for x in pairs])),
        "vote_threshold_curve": curve,
        "leave_one_lens_out_ranges": {
            label: [int(min(x[label] for x in leave_one_out)), int(max(x[label] for x in leave_one_out))]
            for label in LABELS
        },
        "legacy_vs_consensus_kappa": cohen_kappa(legacy, consensus),
        "legacy_class_metrics": metrics,
        "interpretation": "Agreement is among blinded computational passes, not independent human coders. Threshold and leave-one-lens-out results quantify coding-rule sensitivity.",
    }
    (args.outdir / "atracc_sensitivity_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
