import sourceSnapshot from "./dev-source-snapshot.json";
import portfolioSource from "./portfolio.jsx?raw";
import portfolioStyles from "./portfolio.css?raw";

const projectFolders = {
  "paper-tas": "papers/same-numbers-stale-permission",
  "paper-atracc": "papers/auditing-evidence-claims",
  "type-unit-distance": "type/unit-distance",
  "type-axis-doctor": "type/axis-doctor",
  "type-font-fix": "type/fontfix",
  "type-render-parity": "type/render-parity",
  "type-shape-trace": "type/shape-trace",
};

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const workspaceReadme = `# HRB_PORTFOLIO / actual source workspace

This read-only workspace publishes ${sourceSnapshot.files.length} audited files from the codebases that were actually used for the research and font projects shown in the portfolio.

## Research repositories

- Same Numbers, Stale Permission: 23 real files, including the complete experiment suite, scoring and validation scripts, the receipt contract, repository checks, requirements, and reproducibility documentation.
- Auditing Evidence Claims: 26 real files, including audit, validation, sensitivity, repair, conformance, replication, exact-repeat, and metamorphic experiment code.

## Type and font repositories

- Unit Distance: geometry, glyph definitions, font builder, SVG renderer, tests, build script, and site source.
- AxisDoctor: analysis engine, worker, scan hook, reports, tests, command-line tools, and interface source.
- FontFix: parser, glyph view, export engine, tests, design-space tools, fixtures, and interface source.
- RenderParity: capture and comparison engine, configuration, reports, tests, fixture tool, and interface source.
- ShapeTrace: HarfBuzz worker, cluster logic, type definitions, tests, shaper hook, and interface source.

No experiment repository or local code folder was found for Privacy-Sensitive Generative AI Sourcing, Agent-Infrastructure Fit, or RULEBLIND-DCRT. Their earlier method cards have been removed rather than represented as code. Their paper PDFs remain available in Plain mode.

Use Explorer to inspect each real file. Every selected source can be copied or downloaded with its original filename. The sparkle icon opens the optional local research model.`;

const repositoryFiles = sourceSnapshot.files.map((file) => ({
  id: file.primary ? file.projectKey : `${file.projectKey}--${slug(file.path)}`,
  projectKey: file.projectKey,
  group: file.group,
  project: file.project,
  path: `${projectFolders[file.projectKey]}/${file.path}`,
  sourcePath: file.path,
  language: file.language,
  kind: file.group === "Papers" ? "Actual research repository file" : "Actual project source file",
  source: file.source,
  openHref: file.href,
  openLabel: file.group === "Papers" ? "Open paper" : "Open project",
  repositoryHref: file.repository,
}));

export const devFiles = [
  {
    id: "workspace-readme",
    group: "Workspace",
    project: "Source index",
    path: "README.md",
    sourcePath: "README.md",
    language: "Markdown",
    kind: "Published workspace guide",
    source: workspaceReadme,
  },
  ...repositoryFiles,
  {
    id: "portfolio-react",
    projectKey: "portfolio",
    group: "Portfolio",
    project: "Portfolio",
    path: "portfolio/portfolio.jsx",
    sourcePath: "portfolio.jsx",
    language: "JavaScript React",
    kind: "Live portfolio source",
    source: portfolioSource,
  },
  {
    id: "portfolio-css",
    projectKey: "portfolio",
    group: "Portfolio",
    project: "Portfolio",
    path: "portfolio/portfolio.css",
    sourcePath: "portfolio.css",
    language: "CSS",
    kind: "Live portfolio source",
    source: portfolioStyles,
  },
];

const fileById = new Map(devFiles.map((file) => [file.id, file]));

export function getDevFile(id) {
  return fileById.get(id) || devFiles[0];
}

export const sourceCounts = sourceSnapshot.counts;
