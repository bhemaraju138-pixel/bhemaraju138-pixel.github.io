#!/usr/bin/env python3
"""Run the frozen TAS benchmark through the official OpenAI and Anthropic APIs.

Each task is sent in a fresh, single-turn, tool-free request. The runner never
opens the gold-label file. Transport failures are retried; model outputs are
never regenerated merely because they are malformed or incorrect.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import random
import re
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MODEL_SPECS = {
    "luna": ("openai", "gpt-5.6-luna"),
    "terra": ("openai", "gpt-5.6-terra"),
    "sol": ("openai", "gpt-5.6-sol"),
    "claude": ("anthropic", "claude-sonnet-5"),
}
CONDITIONS = ("payload_only", "metadata", "contract")
SYSTEM_INSTRUCTION = (
    "You are a statistical claim-release agent. Return exactly one compact JSON object with "
    "task_id, decision (ACCEPT, REJECT, or ABSTAIN), and decisive_field. ACCEPT a "
    "measurement-admissible claim, REJECT a known violation, and ABSTAIN when a load-bearing "
    "field is missing. Do not use tools and do not add prose."
)
DECISIONS = {"ACCEPT", "REJECT", "ABSTAIN"}
WRITE_LOCK = threading.Lock()


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_env(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        result[key.strip()] = value.strip().strip('"').strip("'")
    return result


def sha_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def condition_task(task: dict[str, Any], condition: str) -> dict[str, Any]:
    projected = {
        "task_id": task["task_id"],
        "operation": task["operation"],
        "instruction": task["instruction"],
        "operands": [],
    }
    for operand in task["operands"]:
        item = {"title": operand["title"], "period": operand["period"], "value": operand["value"]}
        if condition != "payload_only":
            item["metadata"] = operand["metadata"]
        projected["operands"].append(item)
    return projected


def user_prompt(task: dict[str, Any], condition: str, contract: dict[str, Any]) -> str:
    pieces = []
    if condition == "contract":
        pieces.append(
            "Apply this exact locked operation contract. Ignore catalogue_language. "
            "Check required fields in the listed order. Contract: "
            + json.dumps(contract["operations"], sort_keys=True, separators=(",", ":"))
        )
    pieces.append(
        "Evaluate only this task: "
        + json.dumps(condition_task(task, condition), ensure_ascii=True, separators=(",", ":"))
    )
    return "\n".join(pieces)


def http_json(
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    max_attempts: int,
) -> tuple[dict[str, Any], dict[str, str], int, int]:
    body = json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        request = urllib.request.Request(
            url,
            data=body,
            headers={**headers, "content-type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                return json.load(response), dict(response.headers.items()), response.status, attempt
        except urllib.error.HTTPError as exc:
            last_error = exc
            retryable = exc.code == 429 or 500 <= exc.code < 600
            if not retryable or attempt == max_attempts:
                detail = exc.read().decode("utf-8", "replace")[:800]
                raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            last_error = exc
            if attempt == max_attempts:
                raise RuntimeError(f"Transport failure: {type(exc).__name__}") from exc
        time.sleep(min(20.0, (2 ** (attempt - 1)) + random.random()))
    raise RuntimeError(f"Unreachable retry state: {last_error}")


def openai_text(response: dict[str, Any]) -> str:
    chunks = []
    for item in response.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                chunks.append(str(content.get("text", "")))
    return "\n".join(chunks).strip()


def anthropic_text(response: dict[str, Any]) -> str:
    return "\n".join(
        str(block.get("text", ""))
        for block in response.get("content", [])
        if block.get("type") == "text"
    ).strip()


def parse_object(text: str, expected_task_id: str) -> tuple[dict[str, str], bool, str]:
    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*", "", candidate, flags=re.I)
        candidate = re.sub(r"\s*```$", "", candidate)
    try:
        row = json.loads(candidate)
    except json.JSONDecodeError:
        match = re.search(r"\{.*?\}", candidate, flags=re.S)
        if not match:
            return {"task_id": expected_task_id, "decision": "MISSING", "decisive_field": ""}, False, "no_json_object"
        try:
            row = json.loads(match.group(0))
        except json.JSONDecodeError:
            return {"task_id": expected_task_id, "decision": "MISSING", "decisive_field": ""}, False, "invalid_json"
    if not isinstance(row, dict):
        return {"task_id": expected_task_id, "decision": "MISSING", "decisive_field": ""}, False, "json_not_object"
    decision = str(row.get("decision", "")).upper()
    task_id = str(row.get("task_id", ""))
    decisive_field = str(row.get("decisive_field", ""))
    valid = task_id == expected_task_id and decision in DECISIONS and bool(decisive_field)
    error = "" if valid else "schema_or_task_id_mismatch"
    return {
        "task_id": expected_task_id,
        "decision": decision if decision in DECISIONS else "MISSING",
        "decisive_field": decisive_field,
    }, valid, error


def one_request(
    task: dict[str, Any],
    model_alias: str,
    condition: str,
    contract: dict[str, Any],
    env: dict[str, str],
    max_attempts: int,
) -> dict[str, Any]:
    provider, requested_model = MODEL_SPECS[model_alias]
    prompt = user_prompt(task, condition, contract)
    started = now_utc()
    start_clock = time.monotonic()
    if provider == "openai":
        payload = {
            "model": requested_model,
            "instructions": SYSTEM_INSTRUCTION,
            "input": prompt,
            "reasoning": {"effort": "medium"},
            "max_output_tokens": 2048,
            "tools": [],
            "store": False,
            "text": {"verbosity": "low"},
        }
        response, headers, http_status, attempts = http_json(
            "https://api.openai.com/v1/responses",
            {"authorization": "Bearer " + env["OPEN_AI_API_KEY"]},
            payload,
            max_attempts,
        )
        raw_text = openai_text(response)
        resolved_model = str(response.get("model", requested_model))
        request_id = str(response.get("id") or headers.get("x-request-id", ""))
        usage = response.get("usage", {})
        stop_status = response.get("status")
    else:
        workspace_id = env.get("CLAUDE_WORKSPACE_ID") or env.get("ANTHROPIC_WORKSPACE_ID")
        payload = {
            "model": requested_model,
            "max_tokens": 2048,
            "system": SYSTEM_INSTRUCTION,
            "messages": [{"role": "user", "content": prompt}],
            "thinking": {"type": "adaptive"},
            "output_config": {"effort": "medium"},
        }
        anthropic_headers = {
            "x-api-key": env["CLAUDE_API_KEY"],
            "anthropic-version": "2023-06-01",
        }
        if workspace_id:
            anthropic_headers["anthropic-workspace-id"] = workspace_id
        response, headers, http_status, attempts = http_json(
            "https://api.anthropic.com/v1/messages",
            anthropic_headers,
            payload,
            max_attempts,
        )
        raw_text = anthropic_text(response)
        resolved_model = str(response.get("model", requested_model))
        request_id = str(response.get("id") or headers.get("request-id", ""))
        usage = response.get("usage", {})
        stop_status = response.get("stop_reason")
    parsed, parse_ok, parse_error = parse_object(raw_text, task["task_id"])
    return {
        "task_id": task["task_id"],
        "model_alias": model_alias,
        "provider": provider,
        "condition": condition,
        "requested_model": requested_model,
        "resolved_model": resolved_model,
        "reasoning_effort": "medium",
        "started_utc": started,
        "completed_utc": now_utc(),
        "latency_ms": round((time.monotonic() - start_clock) * 1000),
        "http_status": http_status,
        "transport_attempts": attempts,
        "request_id": request_id,
        "usage": usage,
        "stop_status": stop_status,
        "prompt_sha256": sha_text(SYSTEM_INSTRUCTION + "\n" + prompt),
        "raw_text": raw_text,
        "parsed": parsed,
        "parse_ok": parse_ok,
        "parse_error": parse_error,
    }


def read_completed(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    completed: dict[str, dict[str, Any]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            completed[row["task_id"]] = row
    return completed


def append_record(path: Path, record: dict[str, Any]) -> None:
    with WRITE_LOCK, path.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(record, ensure_ascii=True, separators=(",", ":")) + "\n")
        stream.flush()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env", type=Path, default=ROOT / ".env")
    parser.add_argument("--inputs", type=Path, required=True)
    parser.add_argument("--contract", type=Path, required=True)
    parser.add_argument("--outdir", type=Path, required=True)
    parser.add_argument("--models", nargs="+", choices=sorted(MODEL_SPECS), default=list(MODEL_SPECS))
    parser.add_argument("--conditions", nargs="+", choices=CONDITIONS, default=list(CONDITIONS))
    parser.add_argument("--concurrency", type=int, default=12)
    parser.add_argument("--max-attempts", type=int, default=5)
    args = parser.parse_args()

    env = load_env(args.env)
    for key in ("CLAUDE_WORKSPACE_ID", "ANTHROPIC_WORKSPACE_ID"):
        if os.environ.get(key):
            env[key] = os.environ[key]
    required = {"OPEN_AI_API_KEY" if MODEL_SPECS[m][0] == "openai" else "CLAUDE_API_KEY" for m in args.models}
    missing = sorted(key for key in required if not env.get(key))
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")
    tasks = [json.loads(line) for line in args.inputs.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(tasks) != 160 or len({task["task_id"] for task in tasks}) != 160:
        raise RuntimeError("Input lock must contain exactly 160 unique tasks")
    contract = json.loads(args.contract.read_text(encoding="utf-8"))
    records_dir = args.outdir / "api_records"
    runs_dir = args.outdir / "agent_runs"
    records_dir.mkdir(parents=True, exist_ok=True)
    runs_dir.mkdir(parents=True, exist_ok=True)

    run_summaries = []
    for model_alias in args.models:
        for condition in args.conditions:
            record_path = records_dir / f"{model_alias}_{condition}_r1.jsonl"
            existing = read_completed(record_path)
            pending = [task for task in tasks if task["task_id"] not in existing]
            print(json.dumps({"model": model_alias, "condition": condition, "completed": len(existing), "pending": len(pending)}), flush=True)
            failures: list[dict[str, str]] = []
            if pending:
                with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
                    futures = {
                        pool.submit(one_request, task, model_alias, condition, contract, env, args.max_attempts): task
                        for task in pending
                    }
                    completed_now = 0
                    for future in concurrent.futures.as_completed(futures):
                        task = futures[future]
                        try:
                            record = future.result()
                            append_record(record_path, record)
                        except Exception as exc:
                            failures.append({"task_id": task["task_id"], "error": str(exc)[:800]})
                        completed_now += 1
                        if completed_now % 20 == 0 or completed_now == len(pending):
                            print(json.dumps({"model": model_alias, "condition": condition, "finished_now": completed_now, "pending_total": len(pending), "failures": len(failures)}), flush=True)
            all_records = read_completed(record_path)
            ordered = [all_records[task["task_id"]] for task in tasks if task["task_id"] in all_records]
            output_path = runs_dir / f"{model_alias}_{condition}_r1_b1.jsonl"
            output_path.write_text(
                "".join(json.dumps(record["parsed"], ensure_ascii=True, separators=(",", ":")) + "\n" for record in ordered),
                encoding="utf-8",
            )
            summary = {
                "model": model_alias,
                "provider": MODEL_SPECS[model_alias][0],
                "requested_model": MODEL_SPECS[model_alias][1],
                "condition": condition,
                "requests_expected": len(tasks),
                "requests_recorded": len(ordered),
                "parse_ok": sum(bool(record["parse_ok"]) for record in ordered),
                "transport_failures": failures,
                "resolved_models": sorted({record["resolved_model"] for record in ordered}),
                "input_tokens": sum(int(record.get("usage", {}).get("input_tokens", 0)) for record in ordered),
                "output_tokens": sum(int(record.get("usage", {}).get("output_tokens", 0)) for record in ordered),
            }
            run_summaries.append(summary)
            print(json.dumps(summary), flush=True)
            if failures or len(ordered) != len(tasks):
                raise RuntimeError(f"Incomplete run for {model_alias}/{condition}; rerun to resume")

    manifest = {
        "protocol": "TAS official-API v5 single-task independent requests",
        "created_utc": now_utc(),
        "input_path": str(args.inputs),
        "input_sha256": hashlib.sha256(args.inputs.read_bytes()).hexdigest(),
        "contract_path": str(args.contract),
        "contract_sha256": hashlib.sha256(args.contract.read_bytes()).hexdigest(),
        "models": [MODEL_SPECS[m][1] for m in args.models],
        "conditions": args.conditions,
        "reasoning_effort": "medium",
        "replications_per_model_condition": 1,
        "requests_are_single_task": True,
        "tools_supplied": [],
        "provider_storage_requested": False if all(MODEL_SPECS[m][0] == "openai" for m in args.models) else "provider default for Anthropic",
        "gold_file_access": False,
        "runs": run_summaries,
    }
    (args.outdir / "official_api_manifest_v5.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": str(args.outdir / 'official_api_manifest_v5.json'), "runs": len(run_summaries)}, indent=2))


if __name__ == "__main__":
    main()
