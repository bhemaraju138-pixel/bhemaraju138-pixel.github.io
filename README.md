# Hema Raju Barri | Researcher and Systems Builder

An editorial portfolio spanning AI systems, management, public institutions,
human–AI interaction, evidence, and empirical methods.

Portfolio copy, research notes, and project documentation are written and
reviewed by Hema Raju Barri.

The portfolio includes:

- a dual interface: an editorial Read mode and a VS Code–inspired Dev mode
  with Codicons, an explorer, research editor, context inspector, integrated
  terminal, route navigation, simulation commands, and path controls. The
  workbench includes draggable and keyboard-resizable panes, layout toggles,
  Quick Open, collapsible Explorer sections, closable editors, a maximizable
  bottom panel, portfolio-wide Search, a published Source Control view, a Run
  and Debug launcher for the simulations, Output and Problems views, and a
  read-only research Debug Console;
- an optional local research-chat extension powered by the Apache-2.0-licensed
  Qwen 2.5 1.5B Instruct model and WebLLM. The model loads only on request,
  retrieves a question-specific evidence packet from the portfolio, runs with
  WebGPU in the visitor's browser, and requires no API key;
- a publications archive with precise accepted, presented, upcoming, and preprint status;
- a searchable blog archive that brings essays and experiments into one place;
- an interactive research compass linking projects across four intellectual lenses;
- three technical simulations: a heterogeneous claiming fixed point, a Bayesian
  counterfactual-observability model, and an endogenous M/M/c verification queue;
- six reproducible public-data experiments on interface recovery, metadata, civic
  channels, ranking robustness, rulemaking burden, and cross-country missingness; and
- an About page connecting research, engineering, field work, and education.

Use the Read/Dev switch to change interfaces. In Dev mode, type `help`,
press `/`, use the visible files and commands to move through the work, or open
Extensions and choose Local Research LLM. The first model load downloads and
caches model files in the browser; prompts and generation remain on the device.
Use `Cmd/Ctrl+P` for Quick Open, `Cmd/Ctrl+B` for the primary sidebar,
`Cmd/Ctrl+J` for the bottom panel, and drag the pane boundaries to resize them.
The Fit Workbench control restores a balanced layout for the current window;
double-clicking any resize boundary restores that pane's default size. Help-menu
shortcut rows are also clickable actions.

Historical project dates describe when the underlying work was conducted or
when a named research output was formally released.

## Local development

```bash
npm install
python3 experiments/claiming_under_agents.py
python3 experiments/public_data_series.py
npm run package:data
npm run dev
```

## Verification

```bash
npm test
npm run test:data
npm run build
npm run test:routes
```

GitHub Actions publishes the static Vite build to GitHub Pages.
