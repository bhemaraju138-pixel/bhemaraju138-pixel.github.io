#!/usr/bin/env python3
"""Verify the byte counts and SHA-256 hashes in PACKAGE_MANIFEST.json."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "PACKAGE_MANIFEST.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    expected = {item["path"]: item for item in manifest["files"]}
    actual = {
        path.relative_to(ROOT).as_posix()
        for path in ROOT.rglob("*")
        if path.is_file()
        and path != MANIFEST
        and "__pycache__" not in path.parts
        and not path.name.endswith((".pyc", ".pyo"))
    }

    assert actual == set(expected), "Package file list does not match the manifest"
    for relative, item in expected.items():
        path = ROOT / relative
        assert path.stat().st_size == item["bytes"], f"Byte count differs for {relative}"
        assert sha256(path) == item["sha256"], f"SHA-256 differs for {relative}"

    print(json.dumps({"status": "PASS", "files": len(expected)}, indent=2))


if __name__ == "__main__":
    main()
