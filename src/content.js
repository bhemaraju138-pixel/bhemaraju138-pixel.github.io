export const research = [
  {
    year: "2026",
    type: "Accepted conference paper",
    title: "Agent–Infrastructure Fit",
    dek: "Open data can be public and still be unusable by an agent.",
    question:
      "Which properties of public digital infrastructure determine whether an AI agent can act faithfully rather than merely retrieve text?",
    method:
      "A six-dimensional Agent-Readable Infrastructure Index, a controlled civic-task benchmark, and non-causal portal-use analysis across three cities.",
    finding:
      "Representational choices altered both completion and consequential error. A more restrictive interface reduced hallucinated fields but also blocked some legitimate tasks.",
    implication:
      "Agent performance belongs partly to the institutional interface. Public agencies govern AI behavior through schemas, permissions, reference assets, and failure signals—even without changing a model.",
    href: "/papers/agent-infrastructure-fit-abstract.pdf",
    linkLabel: "Read the accepted abstract",
  },
  {
    year: "2026",
    type: "Accepted empirical paper · coauthored",
    title: "Privacy-Sensitive Generative AI Sourcing",
    dek: "The governance of a public AI system begins with who supplies it.",
    question:
      "How is sensitive information associated with federal agencies’ decisions to build, buy, or combine generative-AI systems?",
    method:
      "An observational study of the federal AI-use-case inventory with agency and use-case controls, robustness checks, and explicit limits on causal interpretation.",
    finding:
      "Systems involving personally identifiable information were more often vendor-only in the observed inventory; small-cluster inference and missing architecture data qualify that result.",
    implication:
      "Sourcing determines who can inspect a system, where operational knowledge accumulates, and who can be held accountable when the system acts on sensitive data.",
    href: "/papers/privacy-sensitive-sourcing.pdf",
    linkLabel: "Read the empirical writing sample",
  },
  {
    year: "2026",
    type: "Sole-authored preprint",
    title: "Keeping Strategic Futures Observable",
    dek: "AI can change the evidence an institution sees after it acts.",
    question:
      "When an AI-supported strategy enters execution, how can an organization continue learning about paths it did not choose?",
    method:
      "A conceptual account of counterfactual observability and an evidence architecture for preserving alternative strategic futures under uncertainty.",
    finding:
      "Execution produces rich feedback about the chosen path while serious alternatives become progressively harder to observe.",
    implication:
      "Evaluation should preserve evidence about foregone options, not simply optimize the strategy already in motion.",
    href: "/papers/counterfactual-observability.pdf",
    linkLabel: "Read the preprint",
  },
  {
    year: "2025",
    type: "Human–AI experiment · research assistantship",
    title: "Treatment Fidelity Before Treatment Effects",
    dek: "Calling an agent ‘empathizing’ does not make empathy the treatment.",
    question:
      "Do theory-derived conversational styles remain behaviorally distinct across scenarios, and do users respond differently when the style fits their cognitive orientation?",
    method:
      "Theory-to-prompt translation, GEPA refinement, BLOOM-based behavioral evaluation, a common baseline turn, and randomized assignment in a continuing human-subject study.",
    finding:
      "The first research problem was construct validity: treatment labels were not evidence that the agents delivered different experiences. Early participant results suggested a provisional crossover pattern rather than a universally superior style.",
    implication:
      "Before estimating an AI treatment effect, researchers must establish that the system enacted the intended treatment and identify the user–agent–task fit that produced the outcome.",
    href: "/notes/labels-are-not-treatments/",
    linkLabel: "Read the method note",
  },
  {
    year: "2025",
    type: "Public-sector field project",
    title: "The Map Is a Policy Choice",
    dek: "An underserved corridor does not exist in any single dataset.",
    question:
      "How do evidence joins determine which neighborhoods become visible to a public decision process?",
    method:
      "Integration of municipal asset and location records with nighttime radiance and equity layers, followed by peer-city ordinance analysis and implementation design.",
    finding:
      "No source alone identified where intervention was warranted. The consequential analytical decision was which records to connect and which forms of need the resulting map could represent.",
    implication:
      "Data integration is not clerical preprocessing. It defines the population and places a policy system can perceive.",
    href: "/notes/map-is-a-policy-choice/",
    linkLabel: "Read the field note",
  },
  {
    year: "2026",
    type: "New stylized simulation · open code",
    title: "The Burden Moves",
    dek: "Cheaper claiming does not guarantee easier access once the agency responds.",
    question:
      "When agents reduce the cost of applying for a public benefit, does administrative burden disappear—or return through verification, delay, and documentation?",
    method:
      "A transparent fixed-point model of heterogeneous applicants, unequal agent quality, agency capacity, and endogenous verification, with a parameter sweep rather than real-world calibration.",
    finding:
      "In the baseline parameterization, equal and reliable assistance narrows the access gap; unequal agent quality can widen it. Strong verification responses can erode individual gains by shifting cost downstream.",
    implication:
      "The appropriate unit of analysis is the applicant–agent–agency system. The simulation specifies empirical contrasts; it is not a causal estimate or policy forecast.",
    href: "/experiments/claiming-under-agents/",
    linkLabel: "Run the simulation",
  },
];

export const notes = [
  {
    slug: "labels-are-not-treatments",
    title: "Labels Are Not Treatments",
    eyebrow: "Method note · Work conducted September–December 2025 · Note published August 2026",
    standfirst:
      "A clean randomization cannot rescue a treatment that exists only in the prompt writer’s vocabulary.",
    blocks: [
      {
        heading: "The failure we could have missed",
        paragraphs: [
          "We had two conversational systems and a theoretically grounded distinction: one should communicate through perspective-taking and relational language; the other through structure, rules, and analytic decomposition. It would have been easy to name the two conditions, randomize participants, and interpret any difference as an effect of empathizing versus systemizing AI.",
          "But a label is not an intervention. If the two agents converge in difficult scenarios, drift across turns, or differ along an unintended dimension such as verbosity, the experiment estimates the effect of an unknown bundle. Randomization balances people across conditions; it does not prove that the conditions contain what the researcher says they contain.",
        ],
      },
      {
        heading: "What changed in the design",
        paragraphs: [
          "I treated treatment construction as a measurement problem. Theory-derived behavioral characteristics were translated into prompts, refined with GEPA, and evaluated with BLOOM-based behavioral tests across scenarios. The human study began with a common deterministic response before treatment assignment, giving every participant the same initial encounter. Only then did the conversational styles diverge.",
          "This separated two questions that are too often collapsed: Did the system enact the intended behavior? Did that behavior change a human outcome? The first is model-level construct validity. The second is a treatment effect. Both are necessary, and neither substitutes for the other.",
        ],
      },
      {
        heading: "The larger research lesson",
        paragraphs: [
          "Early participant results suggested a provisional crossover: different users appeared to respond to different styles. I do not treat that early pattern as a final finding. Its value was conceptual. It moved the unit of performance from the model alone to a relation among system behavior, user orientation, task, and decision context.",
          "For agent research, treatment fidelity should be a first-class artifact: a behavioral specification, an evaluation set, drift checks, and an account of plausible confounds. Otherwise, fluent systems invite precise causal language about interventions that were never actually delivered.",
        ],
      },
    ],
  },
  {
    slug: "map-is-a-policy-choice",
    title: "The Map Is a Policy Choice",
    eyebrow: "Field note · Work conducted June–August 2025 · Note published August 2026",
    standfirst:
      "A city does not discover an underserved corridor. It constructs the evidentiary conditions under which that corridor can be seen.",
    blocks: [
      {
        heading: "No authoritative layer",
        paragraphs: [
          "The streetlighting question looked spatial, but the hard part was epistemic. Asset records described what the city had installed. Location records described where objects were recorded. Nighttime radiance approximated what was visible from above. Equity measures represented a different theory of need. None of these sources, alone, identified where intervention should occur.",
          "Integrating them did more than improve a dataset. Each join established which mismatches counted: a recorded asset without corresponding radiance, a dark area without a mapped asset, or a corridor whose infrastructure status looked different after an equity layer entered the analysis.",
        ],
      },
      {
        heading: "From visibility to action",
        paragraphs: [
          "The analysis became useful only when paired with institutional options. I compared peer-city ordinances and translated the evidence into pathways officials could actually implement. A technically elegant map without an administrative route would have been descriptive, not decision-support.",
          "That sequence changed how I understand public-sector data work. Evidence architecture decides what enters the field of view; implementation rules decide what the institution can do about it. The two should be designed together.",
        ],
      },
      {
        heading: "Why this matters for agents",
        paragraphs: [
          "An AI agent working over municipal data inherits every representational choice in those layers. It may act quickly while reproducing blind spots that were previously slow and visible. The question is therefore not simply whether the agent reads the map correctly. It is whether the map encodes the right objects, joins, absences, and avenues for action.",
        ],
      },
    ],
  },
  {
    slug: "open-is-not-agent-readable",
    title: "Open Is Not Agent-Readable",
    eyebrow: "Research note · Accepted work developed in 2026 · Note published August 2026",
    standfirst:
      "Publication grants permission to look. It does not guarantee the capacity to act faithfully.",
    blocks: [
      {
        heading: "The category error",
        paragraphs: [
          "Open-data policy usually asks whether information is public, licensed, documented, and downloadable. An agent attempting a civic task faces a different object. It must identify the right resource, interpret a schema, resolve identifiers, respect permissions, recognize missing reference data, and know when an apparently successful action is wrong.",
          "Calling both situations ‘open’ hides the operational distance between a human-readable portal and an infrastructure an agent can use reliably.",
        ],
      },
      {
        heading: "A result with a tradeoff",
        paragraphs: [
          "In our controlled benchmark, concise schemas improved successful completion. Stronger semantic constraints sharply reduced hallucinated fields but also prevented some tasks from finishing. That is not a contradiction. Completion and consequential error are different outcomes, and infrastructure can trade one against the other.",
          "The finding is useful because it resists the standard optimization story. More guardrails are not simply better, and more permissive interfaces are not simply more capable. Public infrastructure needs explicit policies for uncertainty, abstention, repair, and escalation.",
        ],
      },
      {
        heading: "The governance hidden in the interface",
        paragraphs: [
          "Schemas, reference assets, and permissions are often treated as implementation detail. For an acting agent, they are a constitution: they define valid moves, invisible populations, recoverable errors, and the boundary between assistance and fabrication.",
        ],
      },
    ],
  },
  {
    slug: "who-owns-the-verification-layer",
    title: "Who Owns the Verification Layer?",
    eyebrow: "Research memo · August 2026",
    standfirst:
      "When AI makes claims cheap to produce, verification becomes the scarce institutional resource.",
    blocks: [
      {
        heading: "The second-order problem",
        paragraphs: [
          "Most discussions of government AI assistants stop at the citizen: Can the system identify a benefit, prepare evidence, or explain an adverse decision? At scale, those capabilities alter the stream of claims arriving at the institution. Volume, polish, and strategic adaptation can all change, even when eligibility rules do not.",
          "The state is not a fixed endpoint. It can demand new documentation, change triage rules, procure verification tools, or redesign interfaces around machine-prepared submissions. An evaluation that holds this response constant may measure the first month of adoption while missing the system that follows.",
        ],
      },
      {
        heading: "A new allocation question",
        paragraphs: [
          "Verification capacity determines whose claims receive scrutiny, how long decisions take, and which errors are costly. If better-resourced citizens use higher-quality agents, they may produce claims that survive automated screening while weaker agents trigger requests for evidence their users struggle to supply. Assistance can then widen the very access gap it was expected to close.",
          "This is why agent quality, agency capacity, and documentation cost belong in the same model. The distributional outcome is not a property of the assistant alone.",
        ],
      },
      {
        heading: "What evidence would change my mind",
        paragraphs: [
          "A useful research program should identify its own defeaters. I would revise this account if field or experimental evidence showed that application volume remains stable after agent assistance, that verification does not respond to volume or error, or that documentation costs are evenly distributed across applicants. The purpose of the model is not to protect the thesis. It is to make those empirical disagreements visible.",
        ],
      },
    ],
  },
];

export const timeline = [
  {
    year: "2024",
    title: "Reliability before autonomy",
    text: "Cloud deployment work and a clinical workflow redesign taught me the same lesson in two settings: failures often arise at handoffs, dependencies, and representations—not in the nominal core technology.",
    status: "Work conducted in 2024",
  },
  {
    year: "2025",
    title: "Behavior and institutions enter the frame",
    text: "I studied treatment fidelity in conversational agents, built public-health data infrastructure, and joined fragmented municipal evidence into policy pathways. These experiences shifted my question from whether a model works to what system makes its action meaningful.",
    status: "Work conducted in 2025",
  },
  {
    year: "2026",
    title: "A research program takes shape",
    text: "Work on agent-readable infrastructure, federal AI sourcing, counterfactual observability, and econometric robustness converged on one problem: how autonomous systems change the evidence and rules of the institutions they mediate.",
    status: "Research and accepted outputs in 2026",
  },
  {
    year: "Now",
    title: "Government as a responding counterparty",
    text: "The Burden Moves simulation formalizes the next claim: an agent’s effect on access depends on how agencies change verification under capacity constraints. It is a theory-building artifact designed to generate testable contrasts.",
    status: "New simulation published August 2026",
  },
];
