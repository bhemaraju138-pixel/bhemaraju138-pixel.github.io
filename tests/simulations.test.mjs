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

test("fractional Gaussian precision matches the displayed weighted-evidence equation", () => {
  const result = runObservabilityReserve({ horizon: 12, reserve: 0.4, evidenceDecay: 0.03, signalNoise: 0.2 });
  const expectedWeight = Array.from({ length: 12 }, (_, index) => 0.4 * Math.exp(-0.03 * index))
    .reduce((total, weight) => total + weight, 0);
  const expectedVariance = 1 / ((1 / result.priorVariance) + (expectedWeight / result.signalVariance));
  assert.ok(Math.abs(result.effectiveEvidenceB - expectedWeight) < 1e-12);
  assert.ok(Math.abs((result.posteriorSdB ** 2) - expectedVariance) < 1e-12);
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

test("the stable queue matches the Erlang-C waiting equation and solves its fixed point", () => {
  const result = runVerificationQueue({ agentAdoption: 0.2, reviewers: 18, verificationResponse: 0.25, agentQualityGap: 0.1 });
  const x = result.arrivalRate / result.serviceRate;
  let term = 1;
  let finiteSum = 1;
  for (let n = 1; n < result.reviewers; n += 1) {
    term *= x / n;
    finiteSum += term;
  }
  const delayTerm = (term * (x / result.reviewers)) / (1 - (x / result.reviewers));
  const erlangC = delayTerm / (finiteSum + delayTerm);
  const expectedWait = erlangC / ((result.reviewers * result.serviceRate) - result.arrivalRate);
  assert.equal(result.stable, true);
  assert.equal(result.converged, true);
  assert.ok(result.fixedPointResidual < 1e-8);
  assert.ok(Math.abs(result.expectedWait - expectedWait) < 1e-12);
});
