import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fontsRoot = resolve(projectRoot, "..");

const readableExtensions = new Set([
  ".cff",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".py",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".pytest_cache",
  ".venv",
  ".vercel",
  "__pycache__",
  "artifacts",
  "build",
  "dist",
  "node_modules",
  "output",
  "outputs",
  "tmp",
]);

const projects = [
  {
    key: "paper-tas",
    group: "Papers",
    project: "Same Numbers, Stale Permission",
    root: process.env.TAS_SOURCE_ROOT || "/Users/hem/Documents/TAS FINAL PAPER /same-numbers-stale-permission",
    primary: "experiments/tas_runtime_v4.py",
    href: "/papers/same-numbers-stale-permission.pdf",
    repository: "https://github.com/bhemaraju138-pixel/same-numbers-stale-permission",
    include: (path) => (
      path === "README.md"
      || path === "REPRODUCING.md"
      || path === "DATA_GUIDE.md"
      || path === "CITATION.cff"
      || path === "requirements.txt"
      || path.startsWith(".github/workflows/")
      || path.startsWith("experiments/")
      || path.startsWith("protocols/")
      || path.startsWith("scripts/")
    ),
  },
  {
    key: "paper-atracc",
    group: "Papers",
    project: "Auditing Evidence Claims",
    root: resolve(projectRoot, "research/atracc-2026"),
    primary: "experiments/atracc_audit.py",
    href: "/papers/auditing-evidence-claims.pdf",
    repository: "https://github.com/bhemaraju138-pixel/auditing-evidence-claims-atracc-2026",
    include: (path) => (
      path === "README.md"
      || path === "CITATION.cff"
      || path === "PACKAGE_MANIFEST.json"
      || path === "requirements.txt"
      || path === "verify_package.py"
      || path.startsWith("experiments/")
      || path.startsWith("protocols/")
    ),
  },
  {
    key: "type-unit-distance",
    group: "Type projects",
    project: "Unit Distance",
    root: fontsRoot,
    primary: "src/unit_distance_font/geometry.py",
    href: "https://hema-unit-distance.vercel.app",
    scanRoots: [
      "README.md",
      "pyproject.toml",
      "requirements.txt",
      "scripts",
      "src/unit_distance_font",
      "tests",
      "site/app",
      "site/components",
      "site/lib",
      "site/package.json",
      "site/tsconfig.json",
      "site/next.config.ts",
      "site/vite.config.ts",
    ],
    include: (path) => (
      path === "README.md"
      || path === "pyproject.toml"
      || path === "requirements.txt"
      || path === "site/package.json"
      || path === "site/tsconfig.json"
      || path === "site/next.config.ts"
      || path === "site/vite.config.ts"
      || path.startsWith("scripts/")
      || path.startsWith("src/unit_distance_font/")
      || path.startsWith("tests/")
      || path.startsWith("site/app/")
      || path.startsWith("site/components/")
      || path.startsWith("site/lib/")
    ),
  },
  {
    key: "type-axis-doctor",
    group: "Type projects",
    project: "AxisDoctor",
    root: resolve(fontsRoot, "axis-doctor"),
    primary: "src/engine/detect.ts",
    href: "https://hema-axis-doctor.vercel.app",
    include: fontProjectInclude,
  },
  {
    key: "type-font-fix",
    group: "Type projects",
    project: "FontFix",
    root: resolve(fontsRoot, "font-playground"),
    primary: "src/font/glyph.ts",
    href: "https://hema-fontfix.vercel.app",
    include: fontProjectInclude,
  },
  {
    key: "type-render-parity",
    group: "Type projects",
    project: "RenderParity",
    root: resolve(fontsRoot, "render-parity"),
    primary: "renderparity/compare.py",
    href: "https://hema-render-parity.vercel.app",
    include: fontProjectInclude,
  },
  {
    key: "type-shape-trace",
    group: "Type projects",
    project: "ShapeTrace",
    root: resolve(fontsRoot, "shape-trace"),
    primary: "src/engine/cluster.ts",
    href: "https://hema-shape-trace.vercel.app",
    include: fontProjectInclude,
  },
];

function fontProjectInclude(path) {
  return (
    path === "README.md"
    || path === "package.json"
    || path === "pyproject.toml"
    || path === "renderparity.yaml"
    || path === "requirements.txt"
    || path === "requirements-dev.txt"
    || path === "tsconfig.json"
    || path === "tsconfig.node.json"
    || path === "vite.config.ts"
    || path === "vitest.config.ts"
    || path.startsWith("renderparity/")
    || path.startsWith("src/")
    || path.startsWith("tests/")
    || path.startsWith("tools/")
  );
}

function normalizedPath(root, absolutePath) {
  return relative(root, absolutePath).split(sep).join("/");
}

async function walk(root, directory = root, collected = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith("._") || entry.name === ".DS_Store") continue;
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      const isDependencyOrBackup = entry.name.startsWith("node_modules") || entry.name.endsWith(".starter-backup");
      if (!ignoredDirectories.has(entry.name) && !isDependencyOrBackup) await walk(root, absolutePath, collected);
      continue;
    }
    if (entry.isFile() && readableExtensions.has(extname(entry.name).toLowerCase())) {
      collected.push({ absolutePath, path: normalizedPath(root, absolutePath) });
    }
  }
  return collected;
}

async function collectCandidates(project) {
  if (!project.scanRoots) return walk(project.root);
  const collected = [];
  for (const scanRoot of project.scanRoots) {
    const absolutePath = resolve(project.root, scanRoot);
    const details = await stat(absolutePath);
    if (details.isDirectory()) await walk(project.root, absolutePath, collected);
    else if (details.isFile() && readableExtensions.has(extname(absolutePath).toLowerCase())) {
      collected.push({ absolutePath, path: normalizedPath(project.root, absolutePath) });
    }
  }
  return collected;
}

function languageFor(path) {
  const extension = extname(path).toLowerCase();
  if (extension === ".py") return "Python";
  if (extension === ".ts") return "TypeScript";
  if (extension === ".tsx") return "TypeScript React";
  if (extension === ".js") return "JavaScript";
  if (extension === ".jsx") return "JavaScript React";
  if (extension === ".json") return "JSON";
  if (extension === ".yaml" || extension === ".yml") return "YAML";
  if (extension === ".toml") return "TOML";
  if (extension === ".md") return "Markdown";
  return "Plain text";
}

function auditSource(path, content) {
  const findings = [];
  if (/\/Users\/hem\b|\/home\/[a-z0-9._-]+\b/i.test(content)) findings.push("local machine path");
  if (/(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][^"']{8,}["']/i.test(content)) findings.push("literal credential");
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) findings.push("private key");
  if (findings.length) throw new Error(`${path}: ${findings.join(", ")}`);
}

const files = [];
for (const project of projects) {
  const candidates = await collectCandidates(project);
  for (const candidate of candidates) {
    if (!project.include(candidate.path)) continue;
    const source = await readFile(candidate.absolutePath, "utf8");
    auditSource(`${project.key}/${candidate.path}`, source);
    files.push({
      projectKey: project.key,
      group: project.group,
      project: project.project,
      path: candidate.path,
      primary: candidate.path === project.primary,
      language: languageFor(candidate.path),
      source,
      href: project.href,
      repository: project.repository || null,
    });
  }
}

files.sort((left, right) => (
  left.group.localeCompare(right.group)
  || left.project.localeCompare(right.project)
  || left.path.localeCompare(right.path)
));

const counts = Object.fromEntries(projects.map((project) => [
  project.key,
  files.filter((file) => file.projectKey === project.key).length,
]));

for (const project of projects) {
  if (!counts[project.key]) throw new Error(`No source files selected for ${project.key}`);
  if (!files.some((file) => file.projectKey === project.key && file.primary)) {
    throw new Error(`Primary file is missing for ${project.key}: ${project.primary}`);
  }
}

await writeFile(
  resolve(projectRoot, "src/dev-source-snapshot.json"),
  `${JSON.stringify({ counts, files }, null, 2)}\n`,
  "utf8",
);

console.log(`Wrote ${files.length} audited source files.`);
for (const [project, count] of Object.entries(counts)) console.log(`${project}: ${count}`);
