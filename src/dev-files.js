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

const workspaceReadme = `# Navigate this workspace

Dev mode is a read-only code viewer arranged like a compact VS Code workspace. Use it to move through the published research, type, and portfolio files without changing the originals.

## Find and open files

- Choose Explorer in the left activity bar, expand a project, and select a filename to open it.
- Type in Filter files to search by project, path, filename, or file type.
- Use Cmd/Ctrl+P for Quick Open and enter part of a filename.
- Open files remain available as tabs. Select a tab to return to it or use its close button to remove it from the editor.
- The breadcrumb above the editor shows the selected file's full path.

## Inspect, copy, and download

- Scroll the editor or use the minimap at its right edge to move through longer files.
- Copy source places the complete selected file on the clipboard.
- Download saves the selected file with its original filename.
- When available, Repository opens the public code repository and Open paper or Open project opens the related work.

## Panels and shortcuts

- Cmd/Ctrl+B toggles the Explorer. Cmd/Ctrl+J toggles the bottom panel.
- Drag pane boundaries to resize the workspace. Double-click a boundary to restore its default size; Fit Workbench restores the full layout.
- The terminal accepts help, ls, open <name>, model, plain, and clear.
- Plain mode returns to the portfolio presentation.

## Extensions and local AI

The sparkle icon opens the optional Local Research LLM extension in the right sidebar. The AI model is not loaded automatically when Dev mode opens or while files are being browsed.

Choose Load model to download Qwen 2.5 1.5B model files into browser storage on first use. A WebGPU-capable browser is required. Prompts and inference stay on the device; no API key or server chat log is used. Answers are limited to the evidence published in this portfolio and may still be incomplete or incorrect.

Closing the sidebar hides the extension but does not erase model files already cached by the browser.`;

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
