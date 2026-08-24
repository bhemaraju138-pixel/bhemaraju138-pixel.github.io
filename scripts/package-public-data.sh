#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
data_dir="$project_dir/public/data/public-data-series"
archive="$data_dir/public-data-experiments.zip"

cd "$data_dir"
zip -FS -j "$archive" \
  README.md \
  manifest.json \
  api-error-recovery.csv \
  open-data-metadata-audit.csv \
  open-data-metadata-summary.csv \
  nyc-311-channel-access.csv \
  nyc-311-channel-income-quartiles.csv \
  state-priority-ranking-fragility.csv \
  federal-register-comment-burden.csv \
  federal-register-agency-comment-burden.csv \
  world-bank-strict-2023-coverage.csv \
  world-bank-latest-window-coverage.csv \
  world-bank-coverage-by-income.csv
