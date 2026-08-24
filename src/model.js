const groups = [
  { resource: "low", eligible: true, share: 0.3, documentCost: 0.42, informationCost: 0.62 },
  { resource: "high", eligible: true, share: 0.25, documentCost: 0.18, informationCost: 0.36 },
  { resource: "low", eligible: false, share: 0.2, documentCost: 0.42, informationCost: 0.62 },
  { resource: "high", eligible: false, share: 0.25, documentCost: 0.18, informationCost: 0.36 },
];

const logistic = (value) => 1 / (1 + Math.exp(-value));
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function scenarioParameters(name, qualityGap) {
  if (name === "No agent") {
    return {
      reduction: { low: 0, high: 0 },
      error: { low: 0.02, high: 0.02 },
      capacityBoost: 0,
    };
  }

  if (name === "General-purpose agents") {
    return {
      reduction: {
        low: clamp(0.43 - qualityGap / 2, 0, 0.8),
        high: clamp(0.43 + qualityGap / 2, 0, 0.8),
      },
      error: {
        low: 0.12 + qualityGap * 0.12,
        high: Math.max(0.04, 0.12 - qualityGap * 0.1),
      },
      capacityBoost: 0,
    };
  }

  if (name === "Unequal private agents") {
    return {
      reduction: {
        low: clamp(0.27 - qualityGap / 3, 0, 0.85),
        high: clamp(0.58 + qualityGap / 3, 0, 0.85),
      },
      error: {
        low: 0.18 + qualityGap * 0.1,
        high: Math.max(0.03, 0.08 - qualityGap * 0.05),
      },
      capacityBoost: 0,
    };
  }

  return {
    reduction: {
      low: clamp(0.55 - qualityGap * 0.08, 0, 0.8),
      high: clamp(0.55 + qualityGap * 0.08, 0, 0.8),
    },
    error: { low: 0.025, high: 0.025 },
    capacityBoost: 0.05,
  };
}

export const scenarios = [
  "No agent",
  "General-purpose agents",
  "Unequal private agents",
  "Audited public agent",
];

export function runModel({
  scenario,
  agencyCapacity = 0.37,
  verificationResponse = 0.55,
  qualityGap = 0.25,
}) {
  const resolvedCapacity = clamp(finiteOr(agencyCapacity, 0.37), 0.01, 1);
  const resolvedResponse = clamp(finiteOr(verificationResponse, 0.55), 0, 1);
  const resolvedQualityGap = clamp(finiteOr(qualityGap, 0.25), 0, 1);
  const parameters = scenarioParameters(scenario, resolvedQualityGap);
  let verification = 0.16;
  let groupResults = [];
  let applicationVolume = 0;
  let converged = false;
  let iterations = 0;

  for (let iteration = 0; iteration < 200; iteration += 1) {
    iterations = iteration + 1;
    groupResults = groups.map((group) => {
      const informationCost =
        group.informationCost * (1 - parameters.reduction[group.resource]);
      let utility;

      if (group.eligible) {
        const perceivedApproval =
          0.88 - parameters.error[group.resource] * 0.35 - verification * 0.1;
        utility =
          perceivedApproval -
          informationCost -
          verification * group.documentCost -
          0.06;
      } else {
        const perceivedApproval = 0.03 + parameters.error[group.resource] * 1.2;
        utility =
          perceivedApproval * 0.7 -
          informationCost * 0.55 -
          verification * group.documentCost -
          0.18;
      }

      return {
        ...group,
        applyProbability: logistic(6 * utility),
        experiencedBurden: informationCost + verification * group.documentCost,
      };
    });

    applicationVolume = groupResults.reduce(
      (total, group) => total + group.share * group.applyProbability,
      0,
    );

    const effectiveCapacity = resolvedCapacity + parameters.capacityBoost;
    const targetVerification = clamp(
      0.16 +
        resolvedResponse *
          Math.max(0, applicationVolume - effectiveCapacity) /
          effectiveCapacity,
      0.16,
      0.92,
    );
    const nextVerification = verification * 0.65 + targetVerification * 0.35;

    if (Math.abs(nextVerification - verification) < 1e-8) {
      verification = nextVerification;
      converged = true;
      break;
    }
    verification = nextVerification;
  }

  const pick = (resource, eligible) =>
    groupResults.find(
      (group) => group.resource === resource && group.eligible === eligible,
    );
  const lowEligible = pick("low", true);
  const highEligible = pick("high", true);
  const falseApplications = groupResults
    .filter((group) => !group.eligible)
    .reduce((total, group) => total + group.share * group.applyProbability, 0);
  const effectiveCapacity = resolvedCapacity + parameters.capacityBoost;
  const verificationTarget = clamp(
    0.16 + resolvedResponse * Math.max(0, applicationVolume - effectiveCapacity) / effectiveCapacity,
    0.16,
    0.92,
  );

  return {
    scenario,
    applicationVolume,
    verification,
    lowEligibleTakeUp: lowEligible.applyProbability,
    highEligibleTakeUp: highEligible.applyProbability,
    accessGap: highEligible.applyProbability - lowEligible.applyProbability,
    lowResourceBurden: lowEligible.experiencedBurden,
    falseApplicationShare: falseApplications / applicationVolume,
    converged,
    iterations,
    fixedPointResidual: Math.abs(verificationTarget - verification),
    groupResults,
  };
}
