from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops


LAYER_META = {
    "unicode": ("L1", "Unicode", "code points"),
    "shaping": ("L2", "Shaping", "glyph IDs + positions"),
    "outlines": ("L3", "Positioned outlines", "path digest"),
    "raster": ("L4", "Raster output", "pixel diff"),
}


def load_snapshot(path: str | Path) -> tuple[Path, dict[str, Any]]:
    candidate = Path(path)
    snapshot_path = candidate / "snapshot.json" if candidate.is_dir() else candidate
    data = json.loads(snapshot_path.read_text(encoding="utf-8"))
    if data.get("schema") != "renderparity.snapshot.v1":
        raise ValueError(f"Unsupported snapshot schema: {snapshot_path}")
    return snapshot_path.parent, data


def _positions(snapshot: dict[str, Any]) -> list[tuple[int, int, int, int]]:
    return [
        (glyph["x_advance"], glyph["y_advance"], glyph["x_offset"], glyph["y_offset"])
        for glyph in snapshot["layers"]["shaping"]["glyphs"]
    ]


def _pad(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    canvas = Image.new("L", size, 255)
    canvas.paste(image.convert("L"), (0, 0))
    return canvas


def pixel_delta(reference_dir: Path, reference: dict[str, Any], candidate_dir: Path, candidate: dict[str, Any]) -> dict[str, Any]:
    first = Image.open(reference_dir / reference["layers"]["raster"]["file"]).convert("L")
    second = Image.open(candidate_dir / candidate["layers"]["raster"]["file"]).convert("L")
    size = (max(first.width, second.width), max(first.height, second.height))
    difference = ImageChops.difference(_pad(first, size), _pad(second, size))
    histogram = difference.histogram()
    changed = sum(histogram[1:])
    total = size[0] * size[1]
    maximum = max((index for index, count in enumerate(histogram) if count), default=0)
    return {
        "changed_pixels": changed,
        "total_pixels": total,
        "ratio": changed / total if total else 0.0,
        "max_channel_delta": maximum,
        "sizes": [list(first.size), list(second.size)],
    }


def compare_layer(layer: str, reference: dict[str, Any], candidate: dict[str, Any]) -> bool:
    if layer == "unicode":
        return reference["layers"]["unicode"]["signature"] == candidate["layers"]["unicode"]["signature"]
    if layer == "shaping":
        return (
            reference["layers"]["shaping"]["glyph_ids"] == candidate["layers"]["shaping"]["glyph_ids"]
            and _positions(reference) == _positions(candidate)
        )
    if layer == "outlines":
        return reference["layers"]["outlines"]["digest"] == candidate["layers"]["outlines"]["digest"]
    return reference["layers"]["raster"]["sha256"] == candidate["layers"]["raster"]["sha256"]


def _platform_key(snapshot: dict[str, Any], index: int) -> str:
    system = snapshot["platform"]["system"].lower()
    return {"darwin": "macos"}.get(system, system) or f"runner-{index + 1}"


def compare(snapshot_paths: list[str | Path], output_dir: str | Path) -> dict[str, Any]:
    if len(snapshot_paths) < 2:
        raise ValueError("Comparison needs at least two snapshots.")
    loaded = [load_snapshot(path) for path in snapshot_paths]
    reference_dir, reference = loaded[0]
    font_hashes = {snapshot["case"]["font"]["sha256"] for _, snapshot in loaded}
    if len(font_hashes) != 1:
        raise ValueError("Font hashes differ; cross-platform results would not be comparable.")

    platform_rows = []
    raster_metrics: dict[str, dict[str, Any]] = {}
    for index, (directory, snapshot) in enumerate(loaded):
        key = _platform_key(snapshot, index)
        metrics = {"changed_pixels": 0, "total_pixels": 0, "ratio": 0.0, "max_channel_delta": 0, "sizes": []}
        if index:
            metrics = pixel_delta(reference_dir, reference, directory, snapshot)
        raster_metrics[key] = metrics
        platform_rows.append({
            "key": key,
            "name": "macOS" if key == "macos" else snapshot["platform"]["system"],
            "runner": snapshot["platform"]["release"],
            "versions": snapshot["platform"],
            "pixel_delta": metrics,
            "reference": index == 0,
        })

    layer_rows = []
    first_divergence: str | None = None
    for layer, (identifier, name, measure) in LAYER_META.items():
        states = []
        for index, (_, snapshot) in enumerate(loaded):
            matches = index == 0 or compare_layer(layer, reference, snapshot)
            states.append({"status": "base" if index == 0 else "pass" if matches else "fail"})
            if not matches and first_divergence is None:
                first_divergence = layer
        layer_rows.append({"key": layer, "id": identifier, "name": name, "measure": measure, "states": states})

    likely_sources = {
        "unicode": "test input or text decoding",
        "shaping": "HarfBuzz version, features, or segment properties",
        "outlines": "variation instancing or outline extraction",
        "raster": "hinting or rasterizer configuration",
        None: "no recorded divergence",
    }
    titles = {key: value[1] for key, value in LAYER_META.items()}
    first_id = LAYER_META[first_divergence][0] if first_divergence else "—"
    first_title = titles[first_divergence] if first_divergence else "All recorded layers match"
    report = {
        "schema": "renderparity.report.v1",
        "case": reference["case"],
        "platforms": platform_rows,
        "layers": layer_rows,
        "diagnosis": {
            "level": first_id,
            "key": first_divergence,
            "title": first_title,
            "summary": (
                f"The first recorded difference appears at {first_title.lower()}. Earlier layers agree across every runner."
                if first_divergence else "Every recorded layer agrees across every runner."
            ),
            "likely_source": likely_sources[first_divergence],
        },
        "evidence": {
            "font_sha256": reference["case"]["font"]["sha256"],
            "glyph_count": len(reference["layers"]["shaping"]["glyph_ids"]),
            "outline_digest": reference["layers"]["outlines"]["digest"],
            "raster": raster_metrics,
        },
    }

    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    rows = ["# RenderParity report", "", f"First divergence: **{first_id} — {first_title}**", "", "| Layer | " + " | ".join(row["name"] for row in platform_rows) + " |", "|---|" + "|".join(["---"] * len(platform_rows)) + "|"]
    for layer in layer_rows:
        marks = ["—" if state["status"] == "base" else "✓" if state["status"] == "pass" else "✕" for state in layer["states"]]
        rows.append(f"| {layer['id']} {layer['name']} | " + " | ".join(marks) + " |")
    rows.extend(["", f"Likely source: {report['diagnosis']['likely_source']}.", ""])
    (destination / "report.md").write_text("\n".join(rows), encoding="utf-8")
    return report


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Compare RenderParity snapshots layer by layer.")
    parser.add_argument("snapshots", nargs="+", help="Snapshot directories or snapshot.json files; first is the reference")
    parser.add_argument("--output-dir", default="artifacts/report", help="Report output directory")
    args = parser.parse_args(argv)
    report = compare(args.snapshots, args.output_dir)
    diagnosis = report["diagnosis"]
    print(f"first divergence: {diagnosis['level']} {diagnosis['title']}")


if __name__ == "__main__":
    main(sys.argv[1:])

