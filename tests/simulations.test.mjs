import assert from "node:assert/strict";
import test from "node:test";
import { runObservabilityReserve, runVerificationQueue } from "../src/simulations.js";

test("a larger observability reserve reduces uncertainty about the unchosen strategy", () => {
  const thinReserve = runObservabilityReserve({ reserve: 0.05, evidenceDecay: 0.01, signalNoise: 0.18 });
  const thickReserve = runObservabilityReserve({ reserve: 0.8, evidenceDecay: 0.01, signalNoise: 0.18 });
  assert.ok(thickReserve.posteriorSdB < thinReserve.posteriorSdB);
  assert.ok(thickReserve.reversalProbability > thinReserve.reversalProbability);
});

test("sufficient persistent counterfactual evidence detects the latent reversal", () => {
  const result = runObservabilityReserve({ reserve: 0.9, evidenceDecay: 0, signalNoise: 0.14 });
  assert.notEqual(result.detectionDelay, null);
  assert.ok(result.detectionDelay >= 0);
});

test("additional reviewers reduce utilization and waiting in the endogenous queue", () => {
  const constrained = runVerificationQueue({ agentAdoption: 0.55, reviewers: 13, verificationResponse: 0.3, agentQualityGap: 0.15 });
  const expanded = runVerificationQueue({ agentAdoption: 0.55, reviewers: 18, verificationResponse: 0.3, agentQualityGap: 0.15 });
  assert.ok(expanded.utilization < constrained.utilization);
  assert.ok(expanded.expectedWait < constrained.expectedWait);
});

test("the queue curve crosses the stability boundary under high adoption", () => {
  const result = runVerificationQueue({ reviewers: 14, verificationResponse: 0.35, agentQualityGap: 0.2 });
  assert.ok(result.curve.some((point) => point.stable));
  assert.ok(result.curve.some((point) => !point.stable));
});
