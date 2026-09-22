import type { GlyphSample, Issue } from "./types";

function percentChange(value: number, reference: number): number {
  if (Math.abs(reference) < 0.000001) return 0;
  return ((value - reference) / reference) * 100;
}

function linearReference(first: number, last: number, index: number, length: number): number {
  return first + (last - first) * (index / Math.max(1, length - 1));
}

export function detectIssues(samples: GlyphSample[]): Issue[] {
  const issues: Issue[] = [];
  if (samples.length < 3) return issues;

  for (let index = 1; index < samples.length - 1; index += 1) {
    const previous = samples[index - 1].metrics;
    const current = samples[index].metrics;
    const next = samples[index + 1].metrics;
    const sample = samples[index];

    if (current.intersections > Math.max(previous.intersections, next.intersections)) {
      issues.push({ glyph: sample.glyph, axis: sample.axis, coordinate: sample.coordinate, kind: "contour crossing", change: `+${current.intersections - Math.max(previous.intersections, next.intersections)} intersections`, severity: "high", sampleIndex: index });
    }

    const localCurvature = (previous.maxCurvature + next.maxCurvature) / 2;
    if (localCurvature > 0 && current.maxCurvature > localCurvature * 1.45) {
      issues.push({ glyph: sample.glyph, axis: sample.axis, coordinate: sample.coordinate, kind: "curvature spike", change: `+${Math.round(percentChange(current.maxCurvature, localCurvature))}% κ`, severity: "medium", sampleIndex: index });
    }

    const expectedArea = linearReference(samples[0].metrics.area, samples[samples.length - 1].metrics.area, index, samples.length);
    if (expectedArea > 0 && current.area < expectedArea * 0.78) {
      issues.push({ glyph: sample.glyph, axis: sample.axis, coordinate: sample.coordinate, kind: "counter collapse", change: `${Math.round(percentChange(current.area, expectedArea))}% area`, severity: "high", sampleIndex: index });
    }

    const localGap = (previous.minGap + next.minGap) / 2;
    if (localGap > 0 && current.minGap < localGap * 0.58) {
      issues.push({ glyph: sample.glyph, axis: sample.axis, coordinate: sample.coordinate, kind: "minimum-gap collapse", change: `${Math.round(percentChange(current.minGap, localGap))}% gap`, severity: "high", sampleIndex: index });
    }

    const expectedAdvance = linearReference(samples[0].metrics.advanceWidth, samples[samples.length - 1].metrics.advanceWidth, index, samples.length);
    if (expectedAdvance > 0 && Math.abs(percentChange(current.advanceWidth, expectedAdvance)) > 18) {
      issues.push({ glyph: sample.glyph, axis: sample.axis, coordinate: sample.coordinate, kind: "interpolation spike", change: `${Math.round(percentChange(current.advanceWidth, expectedAdvance))}% width`, severity: "medium", sampleIndex: index });
    }
  }

  return issues;
}
