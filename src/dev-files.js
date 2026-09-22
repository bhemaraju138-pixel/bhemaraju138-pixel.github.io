import tasRuntime from "./dev-code/tas_runtime_v4.py?raw";
import atraccAudit from "./dev-code/atracc_audit.py?raw";
import axisDoctorDetect from "./dev-code/axisdoctor_detect.ts?raw";
import fontFixGlyph from "./dev-code/fontfix_glyph.ts?raw";
import renderParityCompare from "./dev-code/renderparity_compare.py?raw";
import shapeTraceCluster from "./dev-code/shapetrace_cluster.ts?raw";
import unitDistanceGeometry from "./dev-code/unit_distance_geometry.py?raw";
import portfolioSource from "./portfolio.jsx?raw";
import portfolioStyles from "./portfolio.css?raw";

const workspaceReadme = `# HRB_PORTFOLIO / published code view

This is a curated, read-only source workspace for Hema Raju Barri's portfolio.

## What is here

- Reproducibility code for Same Numbers, Stale Permission and the federal evidence audit
- Method manifests for papers whose full research package is not published here
- Representative implementation files from five type-design and font-engineering projects
- The React and CSS source for the portfolio itself

## Boundaries

The code view publishes only the files intentionally selected for this portfolio. A paper PDF is the authoritative description of the reported study. A method manifest is documentation, not a claim that an unpublished replication package exists.

Use the Explorer to open a file, the terminal to navigate, or the sparkle icon to load the optional local research model.`;

const privacyMethod = `# Privacy-Sensitive Generative AI Sourcing

artifact: method manifest
paper: /papers/privacy-sensitive-generative-ai-sourcing.pdf
status: Accepted, INSIGHT 2026 (Springer proceedings)

question:
  Is agency-maintained personal information associated with vendor-only sourcing
  in federal generative-AI use cases?

reported_scope:
  use_cases: 368
  unit: federal generative-AI use case

analysis:
  - define vendor-only sourcing from the inventory record
  - identify use cases involving agency-maintained personal information
  - estimate an adjusted sourcing difference
  - repeat the estimate while excluding each identifying agency in turn

evidence:
  - the paper PDF is the authoritative research artifact
  - the portfolio figure reports the adjusted estimate and agency deletions

This manifest documents the public portfolio representation. It is not a substitute
for the paper, nor is it presented as a complete replication package.`;

const infrastructureMethod = `# Agent-Infrastructure Fit

artifact: method manifest
paper: /papers/agent-infrastructure-fit.pdf
status: Accepted, 20th ISDSI Global Conference (December 2026)

construct:
  agent_infrastructure_fit = alignment(
    task_requirements,
    agent_capabilities,
    public_data_affordances,
    validation_requirements
  )

reported_design:
  runs: 810
  conditions:
    - no metadata
    - schema only
    - structured infrastructure

outcomes:
  - completion
  - reliability
  - traceability
  - graceful failure

governance_loop:
  failure traces -> stewardship priorities -> improved manifests, joins, and warnings

The paper PDF contains the authoritative argument, design, results, and limitations.`;

const dcrtMethod = `# RULEBLIND-DCRT

artifact: protocol manifest
paper: /papers/ruleblind-dcrt.pdf
status: Under review, AIS2C 2027 (IEEE)

protocol:
  observe selected probes
  encode an authorized residual
  prepare and durably append the residual
  repair state
  verify by decoding and checking the residual
  commit success or explicit diagnostic debt

invariant:
  destructive repair cannot precede durable evidence for the authorized diagnosis

comparison:
  no-retention baselines lose exact original-fault diagnosis as repair history is erased
  DCRT composes the authorized residual across repair steps

This protocol card is an inspectable summary. The paper PDF is authoritative and the
submission is still under review.`;

export const devFiles = [
  {
    id: "workspace-readme",
    group: "Workspace",
    path: "README.md",
    language: "Markdown",
    kind: "Published workspace guide",
    source: workspaceReadme,
  },
  {
    id: "paper-tas",
    group: "Papers",
    path: "papers/tas/tas_runtime_v4.py",
    language: "Python",
    kind: "Reproducibility source",
    source: tasRuntime,
    openHref: "/papers/same-numbers-stale-permission.pdf",
    openLabel: "Open paper",
  },
  {
    id: "paper-atracc",
    group: "Papers",
    path: "papers/atracc/atracc_audit.py",
    language: "Python",
    kind: "Reproducibility source",
    source: atraccAudit,
    openHref: "/papers/auditing-evidence-claims.pdf",
    openLabel: "Open paper",
  },
  {
    id: "paper-privacy",
    group: "Papers",
    path: "papers/privacy-sensitive/method.md",
    language: "Markdown",
    kind: "Method manifest",
    source: privacyMethod,
    openHref: "/papers/privacy-sensitive-generative-ai-sourcing.pdf",
    openLabel: "Open paper",
  },
  {
    id: "paper-infrastructure",
    group: "Papers",
    path: "papers/agent-infrastructure-fit/method.md",
    language: "Markdown",
    kind: "Method manifest",
    source: infrastructureMethod,
    openHref: "/papers/agent-infrastructure-fit.pdf",
    openLabel: "Open paper",
  },
  {
    id: "paper-dcrt",
    group: "Papers",
    path: "papers/ruleblind-dcrt/protocol.md",
    language: "Markdown",
    kind: "Protocol manifest",
    source: dcrtMethod,
    openHref: "/papers/ruleblind-dcrt.pdf",
    openLabel: "Open paper",
  },
  {
    id: "type-unit-distance",
    group: "Type projects",
    path: "type/unit-distance/geometry.py",
    language: "Python",
    kind: "Project source",
    source: unitDistanceGeometry,
    openHref: "https://hema-unit-distance.vercel.app",
    openLabel: "Open project",
  },
  {
    id: "type-axis-doctor",
    group: "Type projects",
    path: "type/axis-doctor/detect.ts",
    language: "TypeScript",
    kind: "Project source",
    source: axisDoctorDetect,
    openHref: "https://hema-axis-doctor.vercel.app",
    openLabel: "Open project",
  },
  {
    id: "type-font-fix",
    group: "Type projects",
    path: "type/fontfix/glyph.ts",
    language: "TypeScript",
    kind: "Project source",
    source: fontFixGlyph,
    openHref: "https://hema-fontfix.vercel.app",
    openLabel: "Open project",
  },
  {
    id: "type-render-parity",
    group: "Type projects",
    path: "type/render-parity/compare.py",
    language: "Python",
    kind: "Project source",
    source: renderParityCompare,
    openHref: "https://hema-render-parity.vercel.app",
    openLabel: "Open project",
  },
  {
    id: "type-shape-trace",
    group: "Type projects",
    path: "type/shape-trace/cluster.ts",
    language: "TypeScript",
    kind: "Project source",
    source: shapeTraceCluster,
    openHref: "https://hema-shape-trace.vercel.app",
    openLabel: "Open project",
  },
  {
    id: "portfolio-react",
    group: "Portfolio",
    path: "portfolio/portfolio.jsx",
    language: "JavaScript React",
    kind: "Live portfolio source",
    source: portfolioSource,
  },
  {
    id: "portfolio-css",
    group: "Portfolio",
    path: "portfolio/portfolio.css",
    language: "CSS",
    kind: "Live portfolio source",
    source: portfolioStyles,
  },
];

export function getDevFile(id) {
  return devFiles.find((file) => file.id === id) || devFiles[0];
}

