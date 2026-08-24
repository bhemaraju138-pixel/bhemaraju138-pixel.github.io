# Hema Raju Barri — Researcher & Systems Builder

An editorial portfolio spanning AI systems, management, public institutions,
human–AI interaction, evidence, and empirical methods.

The portfolio includes:

- a selected-work archive connecting questions, methods, findings, and implications;
- a searchable writing notebook that brings essays and experiments into one place;
- an interactive research compass linking projects across four intellectual lenses;
- a parameterized simulation of agent-mediated public-benefit claiming;
- six reproducible public-data experiments on interface recovery, metadata, civic
  channels, ranking robustness, rulemaking burden, and cross-country missingness; and
- an About page connecting research, engineering, field work, and education.

Historical project dates describe when work was conducted. Interpretive notes
are labeled with their actual portfolio publication date.

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
