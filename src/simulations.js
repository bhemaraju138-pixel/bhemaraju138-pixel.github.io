const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function normalCdf(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const coefficients = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const polynomial = coefficients.reduceRight((accumulator, coefficient) => (accumulator * t) + coefficient, 0);
  const erf = sign * (1 - polynomial * t * Math.exp(-(x * x)));
  return 0.5 * (1 + erf);
}

export const simulationCatalog = [
  {
    title: "The Burden Moves",
    family: "Heterogeneous fixed-point model",
    href: "/simulations/burden-moves/",
    question: "When applying becomes easier, where does administrative burden reappear?",
    mathematics: "A coupled take-up–verification fixed point.",
    contribution: "Makes the agency response endogenous.",
    status: "Illustrative theory model",
  },
  {
    title: "The Evidence You Stop Seeing",
    family: "Bayesian partial-feedback model",
    href: "/simulations/observability-reserve/",
    question: "How much evidence must survive for an institution to detect a better alternative?",
    mathematics: "Gaussian updating with fractional, decaying evidence.",
    contribution: "Measures the delay between reversal and recognition.",
    status: "Analytical simulation",
  },
  {
    title: "The Queue Answers Back",
    family: "Endogenous M/M/c queue",
    href: "/simulations/verification-queue/",
    question: "Can verification push an agent-expanded queue beyond stability?",
    mathematics: "Erlang-C inside a verification–service-rate fixed point.",
    contribution: "Links induced demand to unequal abandonment.",
    status: "Queueing thought experiment",
  },
];

export function runObservabilityReserve({
  horizon = 60,
  reserve = 0.12,
  evidenceDecay = 0.02,
  signalNoise = 0.22,
  changePoint = 24,
} = {}) {
  const priorMean = 0.5;
  const priorVariance = 0.2 ** 2;
  const signalVariance = signalNoise ** 2;
  const selectedMean = 0.62;
  const alternativeBefore = 0.54;
  const alternativeAfter = 0.74;

  let precisionA = 1 / priorVariance;
  let precisionB = 1 / priorVariance;
  let weightedMeanA = priorMean / priorVariance;
  let weightedMeanB = priorMean / priorVariance;
  let effectiveEvidenceA = 0;
  let effectiveEvidenceB = 0;
  let detectionPeriod = null;
  const series = [];

  for (let period = 1; period <= horizon; period += 1) {
    const alternativeMean = period < changePoint ? alternativeBefore : alternativeAfter;
    const alternativeWeight = reserve * Math.exp(-evidenceDecay * (period - 1));

    precisionA += 1 / signalVariance;
    weightedMeanA += selectedMean / signalVariance;
    effectiveEvidenceA += 1;

    precisionB += alternativeWeight / signalVariance;
    weightedMeanB += (alternativeWeight * alternativeMean) / signalVariance;
    effectiveEvidenceB += alternativeWeight;

    const posteriorMeanA = weightedMeanA / precisionA;
    const posteriorMeanB = weightedMeanB / precisionB;
    const posteriorVarianceA = 1 / precisionA;
    const posteriorVarianceB = 1 / precisionB;
    const comparisonSd = Math.sqrt(posteriorVarianceA + posteriorVarianceB);
    const reversalProbability = normalCdf((posteriorMeanB - posteriorMeanA) / comparisonSd);

    if (period >= changePoint && detectionPeriod === null && reversalProbability >= 0.8) {
      detectionPeriod = period;
    }

    series.push({
      period,
      posteriorMeanA,
      posteriorMeanB,
      posteriorSdB: Math.sqrt(posteriorVarianceB),
      reversalProbability,
      alternativeWeight,
    });
  }

  const final = series.at(-1);
  return {
    ...final,
    horizon,
    reserve,
    evidenceDecay,
    signalNoise,
    changePoint,
    effectiveEvidenceA,
    effectiveEvidenceB,
    observabilityRatio: effectiveEvidenceB / effectiveEvidenceA,
    detectionPeriod,
    detectionDelay: detectionPeriod === null ? null : detectionPeriod - changePoint,
    series,
  };
}

function erlangC(arrivalRate, serviceRate, servers) {
  const offeredLoad = arrivalRate / serviceRate;
  const utilization = offeredLoad / servers;
  if (utilization >= 1) {
    return { utilization, waitProbability: 1, expectedWait: Infinity };
  }

  let term = 1;
  let finiteSum = 1;
  for (let n = 1; n < servers; n += 1) {
    term *= offeredLoad / n;
    finiteSum += term;
  }
  const finalTerm = term * (offeredLoad / servers);
  const delayTerm = finalTerm / (1 - utilization);
  const waitProbability = delayTerm / (finiteSum + delayTerm);
  const expectedWait = waitProbability / ((servers * serviceRate) - arrivalRate);
  return { utilization, waitProbability, expectedWait };
}

function computeVerificationQueue({
  agentAdoption,
  reviewers,
  verificationResponse,
  agentQualityGap,
}) {
  const baseArrival = 36;
  const baseServiceRate = 8;
  const arrivalRate = baseArrival * (1 + (1.35 * agentAdoption));
  let verification = 0.12;
  let serviceRate = baseServiceRate;
  let utilization = arrivalRate / (reviewers * serviceRate);

  for (let iteration = 0; iteration < 120; iteration += 1) {
    serviceRate = baseServiceRate / (1 + (1.55 * verification));
    utilization = arrivalRate / (reviewers * serviceRate);
    const congestionSignal = 1 / (1 + Math.exp(-9 * (utilization - 0.72)));
    const targetVerification = clamp(
      0.06
        + (0.72 * verificationResponse * congestionSignal)
        + (0.2 * agentQualityGap * agentAdoption),
      0.04,
      0.94,
    );
    verification = (0.68 * verification) + (0.32 * targetVerification);
  }

  serviceRate = baseServiceRate / (1 + (1.55 * verification));
  const queue = erlangC(arrivalRate, serviceRate, reviewers);
  const stable = queue.utilization < 1;
  const expectedWait = stable ? queue.expectedWait : Infinity;
  const lowResourcePatience = 0.65;
  const highResourcePatience = 1.35;
  const lowResourceAbandonment = stable ? 1 - Math.exp(-expectedWait / lowResourcePatience) : 1;
  const highResourceAbandonment = stable ? 1 - Math.exp(-expectedWait / highResourcePatience) : 1;
  const meanAbandonment = (0.58 * lowResourceAbandonment) + (0.42 * highResourceAbandonment);
  const serviceCapacity = reviewers * serviceRate;
  const completedPerDay = Math.min(arrivalRate, serviceCapacity) * (1 - meanAbandonment);

  return {
    agentAdoption,
    reviewers,
    verificationResponse,
    agentQualityGap,
    arrivalRate,
    serviceRate,
    serviceCapacity,
    verification,
    stable,
    utilization: queue.utilization,
    waitProbability: queue.waitProbability,
    expectedWait,
    lowResourceAbandonment,
    highResourceAbandonment,
    abandonmentGap: lowResourceAbandonment - highResourceAbandonment,
    completedPerDay,
  };
}

export function runVerificationQueue(parameters = {}) {
  const resolved = {
    agentAdoption: parameters.agentAdoption ?? 0.45,
    reviewers: Math.round(parameters.reviewers ?? 14),
    verificationResponse: parameters.verificationResponse ?? 0.35,
    agentQualityGap: parameters.agentQualityGap ?? 0.2,
  };
  const result = computeVerificationQueue(resolved);
  const curve = Array.from({ length: 11 }, (_, index) => {
    const adoption = index / 10;
    const point = computeVerificationQueue({ ...resolved, agentAdoption: adoption });
    return {
      adoption,
      utilization: point.utilization,
      expectedWait: point.expectedWait,
      verification: point.verification,
      stable: point.stable,
    };
  });
  return { ...result, curve };
}
