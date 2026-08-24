#!/usr/bin/env python3
"""Build six small, reproducible public-data experiments for the portfolio.

The analyses are descriptive and theory-generating. They do not estimate causal
effects. Every network source, retrieval time, transformation, exclusion, and
derived table is written to public/data/public-data-series/.
"""

from __future__ import annotations

import argparse
import calendar
import json
import math
import re
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import requests
from scipy.stats import spearmanr


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data" / "public-data-series"
FIGURE_DIR = ROOT / "public" / "figures" / "public-data-series"
RAW_DIR = DATA_DIR / "raw"
CACHE_DIR = ROOT / "experiments" / ".cache"
RUN_AT = datetime.now(timezone.utc)
RUN_AT_ISO = RUN_AT.replace(microsecond=0).isoformat().replace("+00:00", "Z")
USER_AGENT = "Hema-Raju-Barri-research-portfolio/1.0 (bhemaraju.138@gmail.com)"
INK = "#10231e"
RED = "#c75036"
MINT = "#7ba995"
GOLD = "#d9a441"
PAPER = "#f4f0e8"
GRAY = "#8b918d"


def ensure_dirs() -> None:
    for path in (DATA_DIR, FIGURE_DIR, RAW_DIR, CACHE_DIR):
        path.mkdir(parents=True, exist_ok=True)


def fetch(url: str, *, params: Any = None, timeout: int = 120) -> requests.Response:
    response = requests.get(
        url,
        params=params,
        timeout=timeout,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json,text/plain,*/*"},
    )
    return response


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding="utf-8")


def clean_html(value: Any) -> str:
    if value is None:
        return ""
    text = re.sub(r"<[^>]+>", " ", str(value))
    return re.sub(r"\s+", " ", text).strip()


def set_plot_style() -> None:
    plt.rcParams.update(
        {
            "figure.facecolor": PAPER,
            "axes.facecolor": PAPER,
            "savefig.facecolor": PAPER,
            "font.family": "DejaVu Sans",
            "text.color": INK,
            "axes.labelcolor": INK,
            "axes.edgecolor": INK,
            "xtick.color": INK,
            "ytick.color": INK,
            "axes.titleweight": "bold",
            "axes.spines.top": False,
            "axes.spines.right": False,
        }
    )


def finish_plot(filename: str) -> None:
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / filename, format="svg", bbox_inches="tight")
    plt.close()


def nested_strings(value: Any) -> list[str]:
    strings: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if str(key).lower() in {
                "error",
                "errors",
                "message",
                "detail",
                "description",
                "errortext",
                "faultstring",
                "title",
            }:
                if isinstance(child, (str, int, float)):
                    strings.append(str(child))
            strings.extend(nested_strings(child))
    elif isinstance(value, list):
        for child in value[:25]:
            strings.extend(nested_strings(child))
    return strings


def has_machine_code(value: Any) -> bool:
    if isinstance(value, dict):
        for key, child in value.items():
            key_l = str(key).lower()
            if key_l in {"code", "errorcode", "error_code", "status", "faultcode"}:
                if child not in (None, "", 0, "0"):
                    return True
            if has_machine_code(child):
                return True
    if isinstance(value, list):
        return any(has_machine_code(child) for child in value[:25])
    return False


def experiment_error_recovery() -> dict[str, Any]:
    """Probe how seven public APIs expose a single malformed request."""

    probes = [
        {
            "api": "openFDA",
            "docs": "https://open.fda.gov/apis/",
            "valid": "https://api.fda.gov/drug/event.json?limit=1",
            "invalid": "https://api.fda.gov/drug/event.json?limit=banana",
            "parameter": "limit",
            "offender": "banana",
        },
        {
            "api": "USGS Earthquake Catalog",
            "docs": "https://earthquake.usgs.gov/fdsnws/event/1/",
            "valid": "https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&starttime=2025-01-01&endtime=2025-01-02",
            "invalid": "https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&minmagnitude=banana",
            "parameter": "minmagnitude",
            "offender": "banana",
        },
        {
            "api": "NHTSA vPIC",
            "docs": "https://vpic.nhtsa.dot.gov/api/",
            "valid": "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/1HGCM82633A004352?format=json",
            "invalid": "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/NOT_A_REAL_VIN?format=json",
            "parameter": "VIN",
            "offender": "NOT_A_REAL_VIN",
        },
        {
            "api": "Federal Register",
            "docs": "https://www.federalregister.gov/developers/documentation/api/v1",
            "valid": "https://www.federalregister.gov/api/v1/documents.json?per_page=1&conditions[publication_date][gte]=2025-01-01",
            "invalid": "https://www.federalregister.gov/api/v1/documents.json?per_page=1&conditions[publication_date][gte]=not-a-date",
            "parameter": "publication_date",
            "offender": "not-a-date",
        },
        {
            "api": "World Bank Indicators",
            "docs": "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392",
            "valid": "https://api.worldbank.org/v2/country/US/indicator/SP.POP.TOTL?format=json&date=2023",
            "invalid": "https://api.worldbank.org/v2/country/US/indicator/NOT.A.REAL.INDICATOR?format=json&date=2023",
            "parameter": "indicator",
            "offender": "NOT.A.REAL.INDICATOR",
        },
        {
            "api": "NASA EONET",
            "docs": "https://eonet.gsfc.nasa.gov/docs/v3",
            "valid": "https://eonet.gsfc.nasa.gov/api/v3/events?limit=1",
            "invalid": "https://eonet.gsfc.nasa.gov/api/v3/events?limit=banana",
            "parameter": "limit",
            "offender": "banana",
        },
        {
            "api": "National Weather Service",
            "docs": "https://www.weather.gov/documentation/services-web-api",
            "valid": "https://api.weather.gov/points/38.8894,-77.0352",
            "invalid": "https://api.weather.gov/points/banana,-77.0352",
            "parameter": "latitude",
            "offender": "banana",
        },
        {
            "api": "U.S. Treasury Fiscal Data",
            "docs": "https://fiscaldata.treasury.gov/api-documentation/",
            "valid": "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?format=json&page[size]=1",
            "invalid": "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?format=json&page[size]=banana",
            "parameter": "page size",
            "offender": "banana",
        },
    ]

    rows: list[dict[str, Any]] = []
    raw: list[dict[str, Any]] = []
    for probe in probes:
        valid_response = fetch(probe["valid"], timeout=60)
        invalid_response = fetch(probe["invalid"], timeout=60)
        try:
            payload = invalid_response.json()
            parseable = True
        except ValueError:
            payload = None
            parseable = False
        body = invalid_response.text[:12000]
        messages = nested_strings(payload) if parseable else []
        message = " | ".join(dict.fromkeys(messages))[:1200]
        message_text = f"{message} {body}".lower()
        semantic_status = int(invalid_response.status_code >= 400)
        message_present = int(bool((message or body).strip()))
        names_input = int(
            probe["offender"].lower() in message_text
            or probe["parameter"].lower() in message_text
        )
        code_present = int(has_machine_code(payload)) if parseable else 0
        recovery_hint = int(
            bool(
                re.search(
                    r"\b(valid|invalid|required|must|check|correct|supported|unknown|not found|use|expected)\b",
                    message_text,
                )
            )
        )
        docs_link = int(bool(re.search(r"https?://", message or body)))
        score = semantic_status + int(parseable) + message_present + names_input + code_present + max(recovery_hint, docs_link)
        rows.append(
            {
                "api": probe["api"],
                "valid_control_status": valid_response.status_code,
                "invalid_status": invalid_response.status_code,
                "content_type": invalid_response.headers.get("content-type", ""),
                "machine_parseable": int(parseable),
                "http_status_signals_failure": semantic_status,
                "message_present": message_present,
                "message_names_bad_input": names_input,
                "machine_error_code_present": code_present,
                "recovery_hint_or_link": max(recovery_hint, docs_link),
                "recovery_score_0_to_6": score,
                "observed_message_excerpt": clean_html(message or body)[:500],
                "invalid_probe_url": probe["invalid"],
                "documentation_url": probe["docs"],
                "retrieved_at_utc": RUN_AT_ISO,
            }
        )
        raw.append(
            {
                "api": probe["api"],
                "valid_url": probe["valid"],
                "valid_status": valid_response.status_code,
                "invalid_url": probe["invalid"],
                "invalid_status": invalid_response.status_code,
                "invalid_headers": dict(invalid_response.headers),
                "invalid_body_excerpt": body,
            }
        )

    frame = pd.DataFrame(rows).sort_values(["recovery_score_0_to_6", "api"], ascending=[False, True])
    frame.to_csv(DATA_DIR / "api-error-recovery.csv", index=False)
    write_json(RAW_DIR / "api-error-probes.json", raw)

    plt.figure(figsize=(9.2, 5.0))
    colors = [RED if status == 200 else MINT for status in frame["invalid_status"]]
    plt.barh(frame["api"], frame["recovery_score_0_to_6"], color=colors)
    plt.xlim(0, 6.2)
    plt.xlabel("Recovery score (transparent rule, 0–6)")
    plt.title("A public API can return data cleanly and still fail opaquely")
    plt.gca().invert_yaxis()
    for index, value in enumerate(frame["recovery_score_0_to_6"]):
        plt.text(value + 0.08, index, str(value), va="center", fontsize=9)
    finish_plot("api-error-recovery.svg")

    return {
        "n_apis": len(frame),
        "median_score": float(frame["recovery_score_0_to_6"].median()),
        "status_200_on_invalid_count": int((frame["invalid_status"] == 200).sum()),
        "named_bad_input_count": int(frame["message_names_bad_input"].sum()),
        "top_api": frame.iloc[0]["api"],
        "bottom_api": frame.iloc[-1]["api"],
    }


SOCRATA_PORTALS = [
    ("New York City", "data.cityofnewyork.us"),
    ("Chicago", "data.cityofchicago.org"),
    ("Los Angeles", "data.lacity.org"),
    ("Dallas", "www.dallasopendata.com"),
    ("New York State", "data.ny.gov"),
    ("Maryland", "opendata.maryland.gov"),
]


def fetch_socrata_catalog(domain: str) -> list[dict[str, Any]]:
    first = fetch(
        "https://api.us.socrata.com/api/catalog/v1",
        params={"domains": domain, "only": "datasets", "limit": 1},
    ).json()
    total = int(first.get("resultSetSize", 0))
    results: list[dict[str, Any]] = []
    for offset in range(0, total, 500):
        response = fetch(
            "https://api.us.socrata.com/api/catalog/v1",
            params={
                "domains": domain,
                "only": "datasets",
                "limit": 500,
                "offset": offset,
            },
        )
        response.raise_for_status()
        results.extend(response.json().get("results", []))
    return results


def experiment_metadata_decay() -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    raw_counts: dict[str, int] = {}
    for portal, domain in SOCRATA_PORTALS:
        results = fetch_socrata_catalog(domain)
        raw_counts[domain] = len(results)
        for result in results:
            resource = result.get("resource", {})
            classification = result.get("classification", {})
            metadata = result.get("metadata", {})
            column_names = resource.get("columns_name") or []
            column_descriptions = resource.get("columns_description") or []
            described = sum(bool(clean_html(value)) for value in column_descriptions)
            metadata_entries = classification.get("domain_metadata") or []
            metadata_map = {
                str(entry.get("key", "")).lower(): clean_html(entry.get("value", ""))
                for entry in metadata_entries
            }
            frequency = next(
                (value for key, value in metadata_map.items() if "frequency" in key), ""
            )
            contact = resource.get("contact_email") or next(
                (value for key, value in metadata_map.items() if "contact" in key and "@" in value),
                "",
            )
            metadata_date = pd.to_datetime(resource.get("metadata_updated_at"), utc=True, errors="coerce")
            data_date = pd.to_datetime(resource.get("data_updated_at"), utc=True, errors="coerce")
            metadata_age = (pd.Timestamp(RUN_AT) - metadata_date).days if pd.notna(metadata_date) else np.nan
            data_age = (pd.Timestamp(RUN_AT) - data_date).days if pd.notna(data_date) else np.nan
            rows.append(
                {
                    "portal": portal,
                    "domain": domain,
                    "dataset_id": resource.get("id", ""),
                    "name": clean_html(resource.get("name", "")),
                    "description_present": int(bool(clean_html(resource.get("description")))),
                    "column_count": len(column_names),
                    "described_column_count": described,
                    "column_description_coverage": described / len(column_names) if column_names else np.nan,
                    "metadata_updated_at": resource.get("metadata_updated_at"),
                    "data_updated_at": resource.get("data_updated_at"),
                    "metadata_age_days": metadata_age,
                    "data_age_days": data_age,
                    "license_present": int(bool(metadata.get("license"))),
                    "contact_present": int(bool(contact)),
                    "declared_frequency_present": int(bool(frequency)),
                    "permalink": result.get("permalink", ""),
                    "catalog_source": f"https://api.us.socrata.com/api/catalog/v1?domains={domain}&only=datasets",
                    "retrieved_at_utc": RUN_AT_ISO,
                }
            )

    frame = pd.DataFrame(rows)
    frame.to_csv(DATA_DIR / "open-data-metadata-audit.csv", index=False)
    write_json(RAW_DIR / "socrata-catalog-counts.json", {"retrieved_at_utc": RUN_AT_ISO, "counts": raw_counts})
    summary = (
        frame.groupby("portal", as_index=False)
        .agg(
            datasets=("dataset_id", "count"),
            median_metadata_age_days=("metadata_age_days", "median"),
            metadata_older_than_two_years=("metadata_age_days", lambda s: float((s > 730).mean())),
            mean_column_description_coverage=("column_description_coverage", "mean"),
            datasets_with_no_column_descriptions=("described_column_count", lambda s: float((s == 0).mean())),
            license_coverage=("license_present", "mean"),
            contact_coverage=("contact_present", "mean"),
            frequency_coverage=("declared_frequency_present", "mean"),
        )
        .sort_values("metadata_older_than_two_years", ascending=False)
    )
    summary.to_csv(DATA_DIR / "open-data-metadata-summary.csv", index=False)

    plot = summary.sort_values("metadata_older_than_two_years")
    y = np.arange(len(plot))
    plt.figure(figsize=(9.5, 5.2))
    plt.barh(y - 0.18, plot["metadata_older_than_two_years"] * 100, height=0.34, color=RED, label="Metadata >2 years old")
    plt.barh(y + 0.18, plot["datasets_with_no_column_descriptions"] * 100, height=0.34, color=MINT, label="No column descriptions")
    plt.yticks(y, plot["portal"])
    plt.xlabel("Share of catalogued datasets (%)")
    plt.title("Publication and legibility are different properties")
    plt.legend(frameon=False, loc="lower right")
    finish_plot("open-data-metadata-audit.svg")

    return {
        "n_portals": len(SOCRATA_PORTALS),
        "n_datasets": int(len(frame)),
        "overall_metadata_older_than_two_years": float((frame["metadata_age_days"] > 730).mean()),
        "overall_no_column_descriptions": float((frame["described_column_count"] == 0).mean()),
        "overall_frequency_coverage": float(frame["declared_frequency_present"].mean()),
        "portal_summary": summary.to_dict(orient="records"),
    }


def census_table(url: str) -> pd.DataFrame:
    response = fetch(url)
    response.raise_for_status()
    rows = response.json()
    return pd.DataFrame(rows[1:], columns=rows[0])


ACS_DATA_BASE = (
    "https://www2.census.gov/programs-surveys/acs/summary_file/2024/"
    "table-based-SF/data/5YRData"
)
ACS_GEO_URL = (
    "https://www2.census.gov/programs-surveys/acs/summary_file/2024/"
    "table-based-SF/documentation/Geos20245YR.txt"
)


def cached_download(url: str, filename: str) -> Path:
    census_dir = CACHE_DIR / "census-2024-acs5-table-based"
    census_dir.mkdir(parents=True, exist_ok=True)
    path = census_dir / filename
    if path.exists() and path.stat().st_size > 0:
        return path
    with requests.get(url, stream=True, timeout=300, headers={"User-Agent": USER_AGENT}) as response:
        response.raise_for_status()
        with path.open("wb") as output:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    output.write(chunk)
    return path


def acs_geographies(sumlevel: str) -> pd.DataFrame:
    path = cached_download(ACS_GEO_URL, "Geos20245YR.txt")
    geographies = pd.read_csv(
        path,
        sep="|",
        dtype=str,
        usecols=["SUMLEVEL", "COMPONENT", "STATE", "ZCTA5", "GEO_ID", "NAME"],
        low_memory=False,
    )
    return geographies[
        (geographies["SUMLEVEL"] == sumlevel) & (geographies["COMPONENT"] == "00")
    ].copy()


def acs_table(table_id: str, columns: list[str]) -> pd.DataFrame:
    table_lower = table_id.lower()
    url = f"{ACS_DATA_BASE}/acsdt5y2024-{table_lower}.dat"
    path = cached_download(url, f"acsdt5y2024-{table_lower}.dat")
    return pd.read_csv(path, sep="|", usecols=["GEO_ID", *columns], low_memory=False)


def acs_zcta_characteristics() -> pd.DataFrame:
    geographies = acs_geographies("860")[["GEO_ID", "ZCTA5", "NAME"]]
    population = acs_table("B01003", ["B01003_E001"])
    income = acs_table("B19013", ["B19013_E001"])
    broadband = acs_table("B28002", ["B28002_E001", "B28002_E004"])
    frame = geographies.merge(population, on="GEO_ID").merge(income, on="GEO_ID").merge(broadband, on="GEO_ID")
    frame = frame.rename(
        columns={
            "ZCTA5": "incident_zip",
            "B01003_E001": "population",
            "B19013_E001": "median_household_income",
            "B28002_E001": "households",
            "B28002_E004": "broadband_households",
        }
    )
    for column in ["population", "median_household_income", "households", "broadband_households"]:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    frame["broadband_household_percent"] = frame["broadband_households"] / frame["households"] * 100
    return frame


def acs_state_characteristics() -> pd.DataFrame:
    geographies = acs_geographies("040")[["GEO_ID", "STATE", "NAME"]]
    poverty = acs_table("B17001", ["B17001_E001", "B17001_E002"])
    broadband = acs_table("B28002", ["B28002_E001", "B28002_E004"])
    disability_fields = [
        "B18101_E001",
        "B18101_E004",
        "B18101_E007",
        "B18101_E010",
        "B18101_E013",
        "B18101_E016",
        "B18101_E019",
        "B18101_E023",
        "B18101_E026",
        "B18101_E029",
        "B18101_E032",
        "B18101_E035",
        "B18101_E038",
    ]
    disability = acs_table("B18101", disability_fields)
    language = acs_table(
        "C16002", ["C16002_E001", "C16002_E004", "C16002_E007", "C16002_E010", "C16002_E013"]
    )
    frame = geographies.merge(poverty, on="GEO_ID").merge(broadband, on="GEO_ID").merge(disability, on="GEO_ID").merge(language, on="GEO_ID")
    numeric_columns = [column for column in frame.columns if re.fullmatch(r"[BC]\d+_E\d+", column)]
    for column in numeric_columns:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    disability_numerator = frame[[column for column in disability_fields if column != "B18101_E001"]].sum(axis=1)
    language_numerator = frame[["C16002_E004", "C16002_E007", "C16002_E010", "C16002_E013"]].sum(axis=1)
    return pd.DataFrame(
        {
            "state": frame["STATE"],
            "state_name": frame["NAME"],
            "poverty_percent": frame["B17001_E002"] / frame["B17001_E001"] * 100,
            "broadband_percent": frame["B28002_E004"] / frame["B28002_E001"] * 100,
            "disability_percent": disability_numerator / frame["B18101_E001"] * 100,
            "limited_english_household_percent": language_numerator / frame["C16002_E001"] * 100,
        }
    )


def experiment_311_channels() -> dict[str, Any]:
    # A single full-year group-by intermittently exceeds Socrata's execution
    # window. Month-sized indexed queries cover the same period and are summed
    # below; this is an execution change, not a sampling change.
    raw_path = RAW_DIR / "nyc-311-2025-by-zip-channel.csv"
    if raw_path.exists():
        channels = pd.read_csv(raw_path, dtype={"incident_zip": str})
    else:
        monthly_frames: list[pd.DataFrame] = []
        for month in range(1, 13):
            last_day = calendar.monthrange(2025, month)[1]
            start = f"2025-{month:02d}-01T00:00:00"
            if month == 12:
                end = "2026-01-01T00:00:00"
            else:
                end = f"2025-{month + 1:02d}-01T00:00:00"
            query = {
                "$select": "incident_zip,open_data_channel_type,count(*) as requests",
                "$where": f"created_date >= '{start}' and created_date < '{end}' and incident_zip is not null",
                "$group": "incident_zip,open_data_channel_type",
                "$limit": 50000,
            }
            response = fetch(
                "https://data.cityofnewyork.us/resource/erm2-nwe9.json",
                params=query,
                timeout=180,
            )
            response.raise_for_status()
            monthly = pd.DataFrame(response.json())
            monthly["month"] = month
            monthly["month_last_day"] = last_day
            monthly_frames.append(monthly)
        channels = pd.concat(monthly_frames, ignore_index=True)
        channels.to_csv(raw_path, index=False)
    channels["incident_zip"] = channels["incident_zip"].astype(str).str[:5]
    channels = channels[channels["incident_zip"].str.fullmatch(r"\d{5}")].copy()
    channels["requests"] = pd.to_numeric(channels["requests"], errors="coerce").fillna(0)
    channels = (
        channels.groupby(["incident_zip", "open_data_channel_type"], as_index=False)["requests"]
        .sum()
    )
    channels["is_digital"] = channels["open_data_channel_type"].str.upper().isin(["ONLINE", "MOBILE"])
    channels["digital_request_component"] = channels["requests"].where(channels["is_digital"], 0)
    channel_pivot = (
        channels.groupby("incident_zip")
        .agg(
            total_requests=("requests", "sum"),
            digital_requests=("digital_request_component", "sum"),
        )
        .reset_index()
    )

    acs = acs_zcta_characteristics()
    acs.to_csv(RAW_DIR / "acs-2024-nyc-zcta-characteristics.csv", index=False)
    merged = channel_pivot.merge(acs, on="incident_zip", how="inner")
    merged = merged[(merged["population"] >= 1000) & (merged["total_requests"] >= 100)].copy()
    merged["digital_share"] = merged["digital_requests"] / merged["total_requests"]
    merged["requests_per_1000"] = merged["total_requests"] / merged["population"] * 1000
    merged["income_quartile"] = pd.qcut(
        merged["median_household_income"], 4, labels=["Q1 · lower", "Q2", "Q3", "Q4 · higher"]
    )
    merged.to_csv(DATA_DIR / "nyc-311-channel-access.csv", index=False)

    income_rho, income_p = spearmanr(merged["median_household_income"], merged["digital_share"], nan_policy="omit")
    broadband_rho, broadband_p = spearmanr(merged["broadband_household_percent"], merged["digital_share"], nan_policy="omit")
    quartiles = (
        merged.groupby("income_quartile", observed=True)
        .apply(lambda g: pd.Series({
            "zctas": len(g),
            "digital_share_weighted": float(g["digital_requests"].sum() / g["total_requests"].sum()),
            "median_requests_per_1000": float(g["requests_per_1000"].median()),
        }), include_groups=False)
        .reset_index()
    )
    quartiles.to_csv(DATA_DIR / "nyc-311-channel-income-quartiles.csv", index=False)

    plt.figure(figsize=(9.2, 5.7))
    sizes = 18 + 120 * np.sqrt(merged["total_requests"] / merged["total_requests"].max())
    plt.scatter(
        merged["median_household_income"] / 1000,
        merged["digital_share"] * 100,
        s=sizes,
        c=merged["broadband_household_percent"],
        cmap="YlGn",
        edgecolor=INK,
        linewidth=0.35,
        alpha=0.82,
    )
    coeff = np.polyfit(merged["median_household_income"] / 1000, merged["digital_share"] * 100, 1)
    xs = np.linspace(merged["median_household_income"].min() / 1000, merged["median_household_income"].max() / 1000, 100)
    plt.plot(xs, coeff[0] * xs + coeff[1], color=RED, linewidth=2)
    plt.xlabel("Median household income ($000s, ACS 2024 5-year)")
    plt.ylabel("311 requests submitted online or by mobile (%)")
    plt.title("A digital channel does not create channel-neutral participation")
    colorbar = plt.colorbar()
    colorbar.set_label("Households with broadband (%)")
    finish_plot("nyc-311-channel-access.svg")

    return {
        "year": 2025,
        "n_zctas": int(len(merged)),
        "n_requests_in_analysis": int(merged["total_requests"].sum()),
        "income_digital_share_spearman_rho": float(income_rho),
        "income_digital_share_p_value": float(income_p),
        "broadband_digital_share_spearman_rho": float(broadband_rho),
        "broadband_digital_share_p_value": float(broadband_p),
        "lower_income_quartile_digital_share": float(quartiles.iloc[0]["digital_share_weighted"]),
        "higher_income_quartile_digital_share": float(quartiles.iloc[-1]["digital_share_weighted"]),
        "channel_values": sorted(channels["open_data_channel_type"].dropna().unique().tolist()),
    }


def percentile_risk(series: pd.Series) -> pd.Series:
    return series.rank(pct=True, method="average")


def experiment_rank_fragility() -> dict[str, Any]:
    states = acs_state_characteristics()
    states = states[states["state"] != "72"].copy()
    numeric = ["poverty_percent", "broadband_percent", "disability_percent", "limited_english_household_percent"]
    for column in numeric:
        states[column] = pd.to_numeric(states[column], errors="coerce")
    states["no_broadband_percent"] = 100 - states["broadband_percent"]
    risk_columns = ["poverty_percent", "no_broadband_percent", "disability_percent", "limited_english_household_percent"]
    risk = states[risk_columns].apply(percentile_risk)
    states["equal_weight_score"] = risk.mean(axis=1)
    states["equal_weight_rank"] = states["equal_weight_score"].rank(ascending=False, method="min")
    states["poverty_double_rank"] = (
        risk.mul([0.4, 0.2, 0.2, 0.2], axis=1).sum(axis=1).rank(ascending=False, method="min")
    )
    states["digital_double_rank"] = (
        risk.mul([0.2, 0.4, 0.2, 0.2], axis=1).sum(axis=1).rank(ascending=False, method="min")
    )
    states["noncompensatory_rank"] = (
        np.exp(np.log(0.05 + 0.95 * risk).mean(axis=1)).rank(ascending=False, method="min")
    )

    rng = np.random.default_rng(20260823)
    weights = rng.dirichlet(np.ones(4), size=10000)
    scores = risk.to_numpy() @ weights.T
    ranks = np.argsort(np.argsort(-scores, axis=0), axis=0) + 1
    states["median_random_weight_rank"] = np.median(ranks, axis=1)
    states["rank_p05"] = np.quantile(ranks, 0.05, axis=1)
    states["rank_p95"] = np.quantile(ranks, 0.95, axis=1)
    states["probability_top_10"] = (ranks <= 10).mean(axis=1)
    states["deterministic_rank_range"] = states[
        ["equal_weight_rank", "poverty_double_rank", "digital_double_rank", "noncompensatory_rank"]
    ].max(axis=1) - states[
        ["equal_weight_rank", "poverty_double_rank", "digital_double_rank", "noncompensatory_rank"]
    ].min(axis=1)
    states.to_csv(DATA_DIR / "state-priority-ranking-fragility.csv", index=False)
    pd.DataFrame(weights, columns=["poverty", "no_broadband", "disability", "limited_english_households"]).to_csv(
        RAW_DIR / "rank-fragility-random-weights.csv", index=False
    )

    plot = states.sort_values("equal_weight_rank").head(20).sort_values("median_random_weight_rank", ascending=False)
    y = np.arange(len(plot))
    plt.figure(figsize=(9.4, 7.2))
    plt.hlines(y, plot["rank_p05"], plot["rank_p95"], color=GRAY, linewidth=3)
    plt.scatter(plot["equal_weight_rank"], y, color=RED, s=42, label="Equal-weight rank", zorder=3)
    plt.scatter(plot["median_random_weight_rank"], y, color=INK, s=30, label="Median across 10,000 weights", zorder=3)
    plt.yticks(y, plot["state_name"])
    plt.xlabel("Priority rank (1 = highest illustrated vulnerability)")
    plt.title("The input data do not determine one priority order")
    plt.legend(frameon=False, loc="lower right")
    plt.gca().invert_xaxis()
    finish_plot("state-ranking-fragility.svg")

    base_top = set(states.loc[states["equal_weight_rank"] <= 10, "state_name"])
    stable_top = set(states.loc[states["probability_top_10"] >= 0.8, "state_name"])
    return {
        "n_states_including_dc": int(len(states)),
        "random_weight_draws": 10000,
        "equal_weight_top_10": sorted(base_top),
        "states_with_at_least_80_percent_top_10_probability": sorted(stable_top),
        "median_state_90_percent_rank_interval_width": float((states["rank_p95"] - states["rank_p05"]).median()),
        "max_deterministic_rank_range": int(states["deterministic_rank_range"].max()),
        "state_with_max_deterministic_rank_range": states.loc[states["deterministic_rank_range"].idxmax(), "state_name"],
    }


def experiment_comment_burden() -> dict[str, Any]:
    fields = [
        "title",
        "document_number",
        "publication_date",
        "comments_close_on",
        "start_page",
        "end_page",
        "page_length",
        "agencies",
        "html_url",
        "abstract",
    ]
    base_params: list[tuple[str, Any]] = [
        ("per_page", 1000),
        ("conditions[type][]", "PRORULE"),
        ("conditions[publication_date][gte]", "2025-01-01"),
        ("conditions[publication_date][lte]", "2025-12-31"),
    ] + [("fields[]", field) for field in fields]
    documents: list[dict[str, Any]] = []
    page = 1
    while True:
        params = base_params + [("page", page)]
        response = fetch("https://www.federalregister.gov/api/v1/documents.json", params=params)
        response.raise_for_status()
        payload = response.json()
        documents.extend(payload.get("results", []))
        if page >= int(payload.get("total_pages", 1)):
            break
        page += 1
    write_json(RAW_DIR / "federal-register-2025-proposed-rules.json", documents)

    rows = []
    for document in documents:
        agencies = document.get("agencies") or []
        rows.append(
            {
                "document_number": document.get("document_number"),
                "title": clean_html(document.get("title")),
                "publication_date": document.get("publication_date"),
                "comments_close_on": document.get("comments_close_on"),
                "page_length": document.get("page_length"),
                "lead_agency": agencies[0].get("name", "") if agencies else "",
                "agency_count": len(agencies),
                "html_url": document.get("html_url"),
                "abstract_word_count": len(clean_html(document.get("abstract")).split()),
            }
        )
    frame = pd.DataFrame(rows)
    frame["publication_date"] = pd.to_datetime(frame["publication_date"], errors="coerce")
    frame["comments_close_on"] = pd.to_datetime(frame["comments_close_on"], errors="coerce")
    frame["page_length"] = pd.to_numeric(frame["page_length"], errors="coerce")
    frame["comment_window_days"] = (frame["comments_close_on"] - frame["publication_date"]).dt.days
    frame["pages_per_30_comment_days"] = frame["page_length"] / frame["comment_window_days"] * 30
    frame["retrieved_at_utc"] = RUN_AT_ISO
    frame.to_csv(DATA_DIR / "federal-register-comment-burden.csv", index=False)
    valid = frame[
        frame["comment_window_days"].between(1, 365)
        & frame["page_length"].between(1, 3000)
    ].copy()
    rho, p_value = spearmanr(valid["page_length"], valid["comment_window_days"], nan_policy="omit")
    long_rules = valid[valid["page_length"] >= 100]
    agency = (
        valid.groupby("lead_agency", as_index=False)
        .agg(
            proposed_rules=("document_number", "count"),
            median_window_days=("comment_window_days", "median"),
            median_pages=("page_length", "median"),
            median_pages_per_30_days=("pages_per_30_comment_days", "median"),
        )
        .query("proposed_rules >= 10")
        .sort_values("median_pages_per_30_days", ascending=False)
    )
    agency.to_csv(DATA_DIR / "federal-register-agency-comment-burden.csv", index=False)

    plt.figure(figsize=(9.2, 5.7))
    plt.scatter(
        valid["comment_window_days"],
        valid["page_length"],
        s=18,
        alpha=0.42,
        color=MINT,
        edgecolor="none",
    )
    plt.yscale("log")
    plt.axvline(30, color=RED, linewidth=1.6, linestyle="--", label="30 days")
    plt.axvline(60, color=INK, linewidth=1.2, linestyle=":", label="60 days")
    plt.xlabel("Comment window (calendar days)")
    plt.ylabel("Federal Register document length (pages, log scale)")
    plt.title("Longer proposals do not reliably receive longer comment windows")
    plt.legend(frameon=False)
    finish_plot("federal-register-comment-burden.svg")

    return {
        "n_proposed_rules": int(len(frame)),
        "n_with_valid_window_and_length": int(len(valid)),
        "share_missing_comment_close_date": float(frame["comments_close_on"].isna().mean()),
        "median_comment_window_days": float(valid["comment_window_days"].median()),
        "page_length_window_spearman_rho": float(rho),
        "page_length_window_p_value": float(p_value),
        "n_rules_at_least_100_pages": int(len(long_rules)),
        "share_100_page_rules_with_30_days_or_less": float((long_rules["comment_window_days"] <= 30).mean()) if len(long_rules) else None,
        "highest_median_load_agencies_min_10_rules": agency.head(5).to_dict(orient="records"),
    }


WB_INDICATORS = {
    "IT.NET.USER.ZS": "internet_users_percent",
    "IT.NET.BBND.P2": "fixed_broadband_per_100",
    "IT.NET.SECR.P6": "secure_servers_per_million",
    "EG.ELC.ACCS.ZS": "electricity_access_percent",
}


def experiment_global_missingness() -> dict[str, Any]:
    countries_response = fetch(
        "https://api.worldbank.org/v2/country", params={"format": "json", "per_page": 400}
    )
    countries_response.raise_for_status()
    countries_payload = countries_response.json()[1]
    countries = pd.DataFrame(
        [
            {
                "iso3": item["id"],
                "country": item["name"],
                "region": item["region"]["value"],
                "income_group": item["incomeLevel"]["value"],
            }
            for item in countries_payload
            if item.get("region", {}).get("value") != "Aggregates"
        ]
    )
    records: list[dict[str, Any]] = []
    for indicator, label in WB_INDICATORS.items():
        response = fetch(
            f"https://api.worldbank.org/v2/country/all/indicator/{indicator}",
            params={"format": "json", "per_page": 20000, "date": "2020:2024"},
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, list) or len(payload) < 2:
            raise RuntimeError(f"World Bank returned no data for {indicator}: {payload}")
        for item in payload[1] or []:
            if item.get("countryiso3code") in set(countries["iso3"]):
                records.append(
                    {
                        "iso3": item.get("countryiso3code"),
                        "indicator_code": indicator,
                        "indicator": label,
                        "year": int(item["date"]),
                        "value": item.get("value"),
                        "source_url": response.url,
                    }
                )
    long = pd.DataFrame(records)
    long["value"] = pd.to_numeric(long["value"], errors="coerce")
    long.to_csv(RAW_DIR / "world-bank-digital-governance-2020-2024.csv", index=False)

    strict = long[long["year"] == 2023].pivot(index="iso3", columns="indicator", values="value")
    strict = countries.set_index("iso3").join(strict).reset_index()
    indicator_labels = list(WB_INDICATORS.values())
    strict["complete_case"] = strict[indicator_labels].notna().all(axis=1)
    latest = (
        long.dropna(subset=["value"])
        .sort_values("year")
        .groupby(["iso3", "indicator"], as_index=False)
        .tail(1)
    )
    latest_values = latest.pivot(index="iso3", columns="indicator", values="value")
    latest_years = latest.pivot(index="iso3", columns="indicator", values="year").add_suffix("_year")
    latest_wide = countries.set_index("iso3").join(latest_values).join(latest_years).reset_index()
    latest_wide["complete_latest_window"] = latest_wide[indicator_labels].notna().all(axis=1)
    year_columns = [f"{label}_year" for label in indicator_labels]
    latest_wide["within_country_vintage_span_years"] = (
        latest_wide[year_columns].max(axis=1) - latest_wide[year_columns].min(axis=1)
    )
    strict.to_csv(DATA_DIR / "world-bank-strict-2023-coverage.csv", index=False)
    latest_wide.to_csv(DATA_DIR / "world-bank-latest-window-coverage.csv", index=False)

    strict_group = (
        strict.groupby("income_group", as_index=False)
        .agg(countries=("iso3", "count"), strict_complete_share=("complete_case", "mean"))
    )
    latest_group = (
        latest_wide.groupby("income_group", as_index=False)
        .agg(
            countries=("iso3", "count"),
            latest_complete_share=("complete_latest_window", "mean"),
            median_vintage_span=("within_country_vintage_span_years", "median"),
        )
    )
    groups = strict_group.merge(latest_group, on=["income_group", "countries"], how="outer")
    order = ["Low income", "Lower middle income", "Upper middle income", "High income"]
    groups["order"] = groups["income_group"].map({name: index for index, name in enumerate(order)})
    groups = groups.sort_values("order")
    groups.to_csv(DATA_DIR / "world-bank-coverage-by-income.csv", index=False)

    plot = groups[groups["income_group"].isin(order)].copy()
    x = np.arange(len(plot))
    width = 0.36
    plt.figure(figsize=(9.2, 5.2))
    plt.bar(x - width / 2, plot["strict_complete_share"] * 100, width, color=RED, label="Same-year (2023)")
    plt.bar(x + width / 2, plot["latest_complete_share"] * 100, width, color=MINT, label="Latest value, 2020–2024")
    plt.xticks(x, plot["income_group"], rotation=15, ha="right")
    plt.ylim(0, 105)
    plt.ylabel("Countries with all four indicators (%)")
    plt.title("Global coverage improves by mixing institutional time")
    plt.legend(frameon=False, loc="upper left")
    finish_plot("world-bank-missingness.svg")

    strict_complete = strict[strict["complete_case"]]
    latest_complete = latest_wide[latest_wide["complete_latest_window"]]
    mixed_vintage = latest_complete["within_country_vintage_span_years"] > 0
    return {
        "n_countries": int(len(countries)),
        "strict_year": 2023,
        "strict_complete_count": int(len(strict_complete)),
        "strict_complete_share": float(strict["complete_case"].mean()),
        "latest_2020_2024_complete_count": int(len(latest_complete)),
        "latest_2020_2024_complete_share": float(latest_wide["complete_latest_window"].mean()),
        "share_of_latest_complete_cases_mixing_vintages": float(mixed_vintage.mean()),
        "median_vintage_span_among_latest_complete": float(latest_complete["within_country_vintage_span_years"].median()),
        "coverage_by_income_group": groups.drop(columns="order").to_dict(orient="records"),
    }


def write_manifest(results: dict[str, Any]) -> None:
    manifest = {
        "title": "Public-data research series",
        "retrieved_at_utc": RUN_AT_ISO,
        "scope_note": (
            "Six descriptive, reproducible experiments. Findings are associations or interface audits, "
            "not causal effects. Live APIs may produce different results when rerun."
        ),
        "experiments": results,
        "primary_sources": [
            "https://open.fda.gov/apis/",
            "https://earthquake.usgs.gov/fdsnws/event/1/",
            "https://vpic.nhtsa.dot.gov/api/",
            "https://www.federalregister.gov/developers/documentation/api/v1",
            "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392",
            "https://eonet.gsfc.nasa.gov/docs/v3",
            "https://www.weather.gov/documentation/services-web-api",
            "https://fiscaldata.treasury.gov/api-documentation/",
            "https://dev.socrata.com/docs/endpoints.html",
            "https://data.cityofnewyork.us/d/erm2-nwe9",
            "https://www.census.gov/programs-surveys/acs/data/summary-file.html",
        ],
    }
    write_json(DATA_DIR / "manifest.json", manifest)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--only",
        choices=["errors", "metadata", "311", "ranking", "comments", "missingness"],
        help="Run one experiment instead of the full series.",
    )
    args = parser.parse_args()
    ensure_dirs()
    set_plot_style()
    functions = {
        "errors": experiment_error_recovery,
        "metadata": experiment_metadata_decay,
        "311": experiment_311_channels,
        "ranking": experiment_rank_fragility,
        "comments": experiment_comment_burden,
        "missingness": experiment_global_missingness,
    }
    selected = {args.only: functions[args.only]} if args.only else functions
    results: dict[str, Any] = {}
    for name, function in selected.items():
        print(f"Running {name}…", flush=True)
        results[name] = function()
        print(textwrap.shorten(json.dumps(results[name]), width=180), flush=True)
    if args.only and (DATA_DIR / "manifest.json").exists():
        existing = json.loads((DATA_DIR / "manifest.json").read_text(encoding="utf-8"))
        combined = existing.get("experiments", {})
        combined.update(results)
        write_manifest(combined)
    else:
        write_manifest(results)
    print(f"Wrote reproducibility outputs to {DATA_DIR}")


if __name__ == "__main__":
    main()
