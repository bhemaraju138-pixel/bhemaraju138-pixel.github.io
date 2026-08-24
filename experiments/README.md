# The Burden Moves

A stylized fixed-point simulation of agent-mediated public-benefit claiming.

The model represents four applicant groups that differ in eligibility and
resources. AI assistance can reduce information friction and introduce errors.
When total application volume exceeds agency capacity, verification intensity
increases. Documentation is more costly for lower-resource applicants, so the
agency response changes take-up again.

This is a theory-building artifact, not a calibrated estimate, causal result, or
policy forecast. Its purpose is to expose assumptions and produce empirical
contrasts that could be tested in controlled experiments or public-sector
partnerships.

Run:

```bash
python3 experiments/claiming_under_agents.py
```

Outputs:

- `public/data/claiming-under-agents-results.json`
- `public/data/claiming-under-agents-sensitivity.csv`

The browser implementation in `src/model.js` mirrors the Python equations. The
test suite checks that the two central qualitative contrasts hold under the
default parameterization: unequal private agents widen the eligible access gap
relative to no agent, while an audited public agent narrows it.
