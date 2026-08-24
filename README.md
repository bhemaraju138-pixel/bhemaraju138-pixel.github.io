# Hema Raju Barri | Researcher and Systems Builder

An editorial portfolio spanning AI systems, management, public institutions,
human–AI interaction, evidence, and empirical methods.

Portfolio copy, research notes, and project documentation are written and
reviewed by Hema Raju Barri.

The portfolio includes:

- a full-screen command interface with route navigation, simulation commands,
  path controls, command history, and keyboard focus;
- a publications archive with precise accepted, presented, upcoming, and preprint status;
- a searchable blog archive that brings essays and experiments into one place;
- an interactive research compass linking projects across four intellectual lenses;
- three technical simulations: a heterogeneous claiming fixed point, a Bayesian
  counterfactual-observability model, and an endogenous M/M/c verification queue;
- six reproducible public-data experiments on interface recovery, metadata, civic
  channels, ranking robustness, rulemaking burden, and cross-country missingness; and
- an About page connecting research, engineering, field work, and education.

The portfolio runs entirely inside `HRB_OS / RESEARCH_INTERFACE`. Type `help`,
press `/`, or use the visible commands to move through the work.

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
