# Hema Raju Barri — Research Portfolio

An editorial research portfolio on AI agents, public institutions, evidence, and
equitable access.

The site distinguishes among:

- accepted papers and preprints;
- notes derived from documented 2024–2025 project work;
- a new, openly labeled stylized simulation published in August 2026; and
- six public-data experiments on interface recovery, metadata, civic channels,
  ranking robustness, rulemaking burden, and cross-country missingness.

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
