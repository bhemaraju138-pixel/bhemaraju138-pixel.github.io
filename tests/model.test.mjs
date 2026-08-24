import assert from "node:assert/strict";
import test from "node:test";
import { runModel } from "../src/model.js";

const parameters = {
  agencyCapacity: 0.37,
  verificationResponse: 0.55,
  qualityGap: 0.25,
};

test("unequal private agents widen the eligible access gap", () => {
  const baseline = runModel({ scenario: "No agent", ...parameters });
  const unequal = runModel({ scenario: "Unequal private agents", ...parameters });
  assert.ok(unequal.accessGap > baseline.accessGap);
});

test("an audited public agent narrows the eligible access gap", () => {
  const baseline = runModel({ scenario: "No agent", ...parameters });
  const audited = runModel({ scenario: "Audited public agent", ...parameters });
  assert.ok(audited.accessGap < baseline.accessGap);
});

test("verification responds to lower capacity", () => {
  const highCapacity = runModel({
    scenario: "General-purpose agents",
    ...parameters,
    agencyCapacity: 0.55,
  });
  const lowCapacity = runModel({
    scenario: "General-purpose agents",
    ...parameters,
    agencyCapacity: 0.25,
  });
  assert.ok(lowCapacity.verification > highCapacity.verification);
});
