#!/usr/bin/env python3
"""Reconcile published headline numbers against the processed public-data files."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from scipy.stats import spearmanr


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data" / "public-data-series"
manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))["experiments"]


def close(actual: float, expected: float, tolerance: float = 1e-10) -> None:
    assert abs(actual - expected) <= tolerance, (actual, expected)


errors = pd.read_csv(DATA / "api-error-recovery.csv")
assert len(errors) == manifest["errors"]["n_apis"] == 8
assert int((errors["invalid_status"] == 200).sum()) == manifest["errors"]["status_200_on_invalid_count"]
close(float(errors["recovery_score_0_to_6"].median()), manifest["errors"]["median_score"])

metadata = pd.read_csv(DATA / "open-data-metadata-audit.csv")
assert len(metadata) == manifest["metadata"]["n_datasets"] == 6607
close(float((metadata["metadata_age_days"] > 730).mean()), manifest["metadata"]["overall_metadata_older_than_two_years"])
close(float((metadata["described_column_count"] == 0).mean()), manifest["metadata"]["overall_no_column_descriptions"])

channels = pd.read_csv(DATA / "nyc-311-channel-access.csv")
assert len(channels) == manifest["311"]["n_zctas"] == 180
assert int(channels["total_requests"].sum()) == manifest["311"]["n_requests_in_analysis"]
rho, _ = spearmanr(channels["median_household_income"], channels["digital_share"])
close(float(rho), manifest["311"]["income_digital_share_spearman_rho"])

ranking = pd.read_csv(DATA / "state-priority-ranking-fragility.csv")
assert len(ranking) == manifest["ranking"]["n_states_including_dc"] == 51
stable = sorted(ranking.loc[ranking["probability_top_10"] >= 0.8, "state_name"].tolist())
assert stable == manifest["ranking"]["states_with_at_least_80_percent_top_10_probability"]

comments = pd.read_csv(DATA / "federal-register-comment-burden.csv")
assert len(comments) == manifest["comments"]["n_proposed_rules"] == 1498
valid = comments[
    comments["comment_window_days"].between(1, 365)
    & comments["page_length"].between(1, 3000)
]
assert len(valid) == manifest["comments"]["n_with_valid_window_and_length"]
rho, _ = spearmanr(valid["page_length"], valid["comment_window_days"])
close(float(rho), manifest["comments"]["page_length_window_spearman_rho"])

strict = pd.read_csv(DATA / "world-bank-strict-2023-coverage.csv")
latest = pd.read_csv(DATA / "world-bank-latest-window-coverage.csv")
assert len(strict) == len(latest) == manifest["missingness"]["n_countries"] == 217
close(float(strict["complete_case"].mean()), manifest["missingness"]["strict_complete_share"])
close(float(latest["complete_latest_window"].mean()), manifest["missingness"]["latest_2020_2024_complete_share"])

print("Public-data headline reconciliation passed.")
