export const research = [
  {
    year: "2026",
    type: "Accepted abstract · presentation upcoming",
    publicationStatus: "Accepted · Presentation upcoming",
    venue: "20th ISDSI Global Conference · IMT Hyderabad · December 2026",
    authors: "Hema Raju Barri and Chandana Charitha Peddinti",
    title: "Agent–Infrastructure Fit",
    dek: "Open data can be public and still be unusable by an agent.",
    question:
      "Which properties of public digital infrastructure determine whether an AI agent can act faithfully rather than merely retrieve text?",
    method:
      "A six-dimensional Agent-Readable Infrastructure Index, a controlled civic-task benchmark, and non-causal portal-use analysis across three cities.",
    finding:
      "Representational choices altered both completion and consequential error. A more restrictive interface reduced hallucinated fields but also blocked some legitimate tasks.",
    implication:
      "Agent performance belongs partly to the institutional interface. Public agencies govern AI behavior through schemas, permissions, reference assets, and failure signals, even without changing a model.",
    href: "/papers/agent-infrastructure-fit-abstract.pdf",
    linkLabel: "Read the accepted abstract",
  },
  {
    year: "2026",
    type: "Accepted and presented · INSIGHT 2026",
    publicationStatus: "Accepted · Presented",
    venue: "INSIGHT 2026",
    authors: "Hema Raju Barri and Chandana Charitha Peddinti",
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
    linkLabel: "Read the presented paper",
  },
  {
    year: "2026",
    type: "Sole-authored preprint",
    publicationStatus: "Sole-authored preprint",
    venue: "SSRN · April 2026",
    authors: "Hema Raju Barri",
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
    type: "Open empirical series · public data and code",
    title: "Six Boundaries of Machine-Mediated Government",
    dek: "Before an AI system makes a decision, infrastructure decides what can fail, count, rank, and remain visible.",
    question:
      "Where do public interfaces and measurement rules allocate interpretive capacity before an autonomous system acts?",
    method:
      "Six reproducible descriptive experiments using live public APIs, 6,607 catalog records, 2025 NYC 311 requests, 2024 ACS Summary Files, Federal Register proposals, and World Bank indicators.",
    finding:
      "The strongest pattern was not one technology effect but six separations: publication from legibility, participation from channel, data from rank, calendar time from attention, and geographic coverage from temporal coherence.",
    implication:
      "AI-governance research should measure the institutional interface that makes some errors repairable, some claims machine-ready, and some priorities appear objective.",
    href: "/experiments/",
    linkLabel: "Read the public-data series",
  },
  {
    year: "2026",
    type: "New stylized simulation · open code",
    title: "The Burden Moves",
    dek: "Cheaper claiming does not guarantee easier access once the agency responds.",
    question:
      "When agents reduce the cost of applying for a public benefit, does administrative burden disappear, or return through verification, delay, and documentation?",
    method:
      "A transparent fixed-point model of heterogeneous applicants, unequal agent quality, agency capacity, and endogenous verification, with a parameter sweep rather than real-world calibration.",
    finding:
      "In the baseline parameterization, equal and reliable assistance narrows the access gap; unequal agent quality can widen it. Strong verification responses can erode individual gains by shifting cost downstream.",
    implication:
      "The appropriate unit of analysis is the applicant–agent–agency system. The simulation specifies empirical contrasts; it is not a causal estimate or policy forecast.",
    href: "/simulations/burden-moves/",
    linkLabel: "Run the simulation",
  },
];

export const notes = [
  {
    slug: "labels-are-not-treatments",
    title: "Labels Are Not Treatments",
    eyebrow: "Method note · Work conducted September–December 2025",
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
    eyebrow: "Field note · Work conducted June–August 2025",
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
    eyebrow: "Research note · Accepted work developed in 2026",
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
    eyebrow: "Research memo",
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

export const publicDataEssays = [
  {
    slug: "error-message-is-policy",
    number: "01",
    title: "The Error Message Is Part of the Policy",
    eyebrow: "Interface audit · Live public APIs",
    standfirst:
      "An agent cannot recover from a failure the institution refuses to name. Error semantics decide who gets the capacity to repair a public transaction.",
    question:
      "When a public API receives a malformed request, does it make failure machine-detectable and repairable, or does it leave the caller to guess?",
    evidenceStatus:
      "Point-in-time interface audit, not a permanent product ranking. During one documented audit window, one valid control and one deliberately malformed request were sent to each of eight APIs.",
    metrics: [
      ["APIs probed", "8"],
      ["Invalid requests returning HTTP 200", "3"],
      ["Messages naming the bad input", "6"],
      ["Median recovery score", "5 / 6"],
    ],
    figure: {
      src: "/figures/public-data-series/api-error-recovery.svg",
      alt: "Horizontal bars compare recovery scores for eight public APIs. National Weather Service and openFDA score highest; NASA EONET scores lowest.",
      caption:
        "Recovery score: non-success HTTP status, machine-readable body, message, named input, error code, and recovery hint or link. Red bars denote invalid requests that still returned HTTP 200.",
    },
    blocks: [
      {
        heading: "The overlooked half of an interface",
        paragraphs: [
          "Most evaluations begin after a system has successfully obtained data. That is convenient, but it removes the moment when an autonomous system is most likely to improvise: the request failed, the response is ambiguous, and there is no human standing beside it. In that moment, the error response is not developer polish. It is the institution's instruction about whether to retry, revise, abstain, or escalate.",
          "The IETF's problem-details standard makes this distinction explicit. A status code can announce the general class of failure; a structured body can identify the specific problem and help a client correct it. I wanted to know how far a small set of heavily used public APIs traveled along that path in practice.",
        ],
      },
      {
        heading: "A probe, not a leaderboard",
        paragraphs: [
          "I selected eight keyless, publicly documented APIs spanning health, hazards, vehicles, regulation, development, weather, fiscal data, and natural events. For each, I first sent a valid control request. I then changed one input into a plainly invalid value: a nonnumeric magnitude, a malformed limit, an impossible latitude, an invalid publication date, or a nonexistent indicator. The point was not to exhaust every failure mode. It was to place the same analytical question at eight institutional boundaries: what does the interface give a caller when cooperation breaks down?",
          "I scored six observable properties, one point each. Did HTTP itself signal failure? Was the body machine-readable? Was there a message? Did it identify the offending parameter or value? Was there a machine error code? Did it offer a recovery cue or documentation link? The rule is deliberately simple and published with the data. Someone who disagrees with a component can remove it and reproduce the ordering.",
        ],
      },
      {
        heading: "Three kinds of HTTP 200",
        paragraphs: [
          "Three malformed requests returned HTTP 200, but they did not mean the same thing. NHTSA returned a structured vehicle-decoding result with error information inside the domain payload. The World Bank returned an error object while preserving a success status. NASA EONET appeared to ignore the malformed limit and returned an ordinary events response. Collapsing all three into ‘the API returned 200’ would miss the consequential difference between a domain-level error, an envelope-level contradiction, and silent parameter tolerance.",
          "The strongest responses combined layers. openFDA used a non-success status, JSON, a stable error code, and a direct message about the limit parameter. The National Weather Service returned the standardized problem-details media type and a structured parameter error. USGS used plain text rather than JSON, but the text named the offending magnitude and the expected type. It was less machine-convenient but highly actionable.",
        ],
      },
      {
        heading: "The finding that matters",
        paragraphs: [
          "The headline is not that some APIs are better documented. It is that error design allocates repair capacity. A well-structured failure lets a low-resource caller, or an agent acting for that caller, detect the boundary, correct the request, and preserve a trace of what went wrong. A silent fallback or success-coded error pushes interpretation into bespoke code, vendor heuristics, or human support. The transaction remains nominally open, but recovery becomes privately supplied.",
          "This is a governance issue because autonomous systems multiply edge cases. A human using one portal may recognize an odd result and stop. An agent can propagate the same ambiguity across thousands of requests. The institution therefore governs downstream behavior not only through valid schemas and permissions, but through the semantics of invalid action.",
        ],
      },
      {
        heading: "What this does not show",
        paragraphs: [
          "One malformed request cannot characterize an API. Different endpoints may be maintained by different teams, and a response observed today can change tomorrow. The score also values explicit repair, while security-sensitive interfaces may reasonably disclose less. Nor did I test latency, rate limits, authentication failures, or the correctness of successful data.",
          "A larger benchmark should sample a taxonomy of errors, repeat probes over time, and test whether an agent can actually recover without human intervention. That outcome, not conformity alone, is the dependent variable I ultimately care about. I would weaken the argument if recovery performance proved unrelated to structured failure signals.",
        ],
      },
      {
        heading: "From an audit score to a recovery experiment",
        paragraphs: [
          "The next version should replace my hand-coded actionability proxy with a behavioral outcome. Give the same agent a civic task, inject one of several controlled failures, and record whether it detects the failure, chooses the correct repair, preserves the user's intent, and stops after an unsafe response. Randomly vary only the error representation while holding the underlying invalid request constant. That design would estimate the contribution of status semantics, field-level detail, and repair hints to successful recovery.",
          "The most important outcome may be consequential error rather than task completion. An agent that receives a hard 400 and abstains has failed to complete but protected the transaction. An agent that receives ordinary-looking data after an ignored parameter may complete the workflow while violating the user's constraint. I would therefore pre-register a loss function that separates safe noncompletion, correct recovery, repeated failure, and undetected success. The interface should be judged by the distribution of those outcomes, not a single pass rate.",
        ],
      },
      {
        heading: "Design implication: publish the recovery contract",
        paragraphs: [
          "Public APIs usually publish the contract for valid action. They should publish the recovery contract too: stable failure types, offending fields, safe repair hints, retry semantics, and an escalation path. Agent-readiness should be evaluated at the boundary where the interface says no, because that is where hallucination becomes a design choice rather than merely a model defect.",
        ],
      },
    ],
    dataLinks: [
      ["Download scored probes", "/data/public-data-series/api-error-recovery.csv"],
      ["Download response excerpts", "/data/public-data-series/raw/api-error-probes.json"],
    ],
    sources: [
      ["IETF RFC 9457: Problem Details for HTTP APIs", "https://www.rfc-editor.org/rfc/rfc9457.html"],
      ["Federal Register API documentation", "https://www.federalregister.gov/developers/documentation/api/v1"],
      ["World Bank Indicators API documentation", "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392"],
      ["National Weather Service API documentation", "https://www.weather.gov/documentation/services-web-api"],
      ["U.S. Treasury Fiscal Data API documentation", "https://fiscaldata.treasury.gov/api-documentation/"],
    ],
  },
  {
    slug: "catalog-says-open-columns-say-guess",
    number: "02",
    title: "The Catalog Says Open. The Columns Say Guess.",
    eyebrow: "Metadata census · Six Socrata portals",
    standfirst:
      "Fresh metadata can describe an undocumented table. Old metadata can describe a stable one. Openness needs a clock for data and a separate clock for meaning.",
    question:
      "Across public open-data catalogs, do recent metadata and semantically described fields travel together?",
    evidenceStatus:
      "Complete Discovery-API census of dataset assets returned for six selected Socrata portals at retrieval. The analysis audits catalog metadata, not the truth or social value of the underlying data.",
    metrics: [
      ["Datasets audited", "6,607"],
      ["No column descriptions", "56.6%"],
      ["Metadata older than two years", "30.4%"],
      ["Portals", "6"],
    ],
    figure: {
      src: "/figures/public-data-series/open-data-metadata-audit.svg",
      alt: "Grouped bars compare the share of old metadata and the share of datasets with no column descriptions across six public data portals.",
      caption:
        "The two deficits do not move together. Maryland's metadata was usually recent while field descriptions were usually absent; New York State combined recent metadata with extensive field descriptions.",
    },
    blocks: [
      {
        heading: "A portal can be open at the wrong layer",
        paragraphs: [
          "Open-data programs have spent years making datasets public, downloadable, licensed, and searchable. Those achievements matter. But an agent does not encounter ‘openness’ as one property. It encounters a chain: find the asset, interpret the table, select fields, resolve units, understand missing values, and decide whether the observation is current enough for the task.",
          "A catalog can satisfy the publication layer while failing at the interpretation layer. That gap is easy for a skilled analyst to bridge with institutional knowledge, phone calls, and trial-and-error. For an autonomous system, the same gap becomes a place to infer confidently from field names that were never meant to carry the full meaning.",
        ],
      },
      {
        heading: "A census of 6,607 catalog records",
        paragraphs: [
          "I queried the Socrata Discovery API for every asset classified as a dataset in six portals: New York City, Chicago, Los Angeles, Dallas, New York State, and Maryland. I recorded the dataset and metadata update dates, the number of fields, the share of fields with descriptions, and whether the catalog exposed a license, contact, and update-frequency field.",
          "This is not a representative sample of American open data. It is an intentionally comparable infrastructure slice: six governments using the same catalog family, observed through the same discovery interface. That controls one source of heterogeneity while preserving large differences in publishing practice.",
        ],
      },
      {
        heading: "The unexpected separation",
        paragraphs: [
          "Across the full set, 56.6 percent of datasets had no column descriptions in the Discovery metadata. About 30.4 percent had metadata last updated more than two years before retrieval. I expected those deficits to cluster: old records would be poorly documented, recent records would be legible. The portal comparison resisted that story.",
          "Maryland had a median metadata age of only 76 days, yet 93.9 percent of its datasets exposed no column descriptions in the catalog response. New York State had a median metadata age of 129 days and only 2.7 percent with no column descriptions. Los Angeles sat at the other extreme in time: a median metadata age of roughly 5.7 years. Freshness and semantic coverage were not one maturity ladder. They were separate administrative accomplishments.",
        ],
      },
      {
        heading: "Why one ‘quality score’ would hide the result",
        paragraphs: [
          "It would be tempting to combine freshness, descriptions, license, contact, and update frequency into a single agent-readiness index. I chose not to. The contrast above is the finding: a portal can be strong on cadence and weak on meaning, or strong on field semantics and sparse on license metadata. A composite would rank the portal while obscuring which institutional capability needs repair.",
          "The same caution applies at the dataset level. Old metadata is not necessarily stale data. A historic boundary file may be complete and legitimately static. A frequently updated operational feed can be dangerous if its fields are undocumented. The audit therefore calls the first measure metadata age, not data staleness, and reports the dimensions separately.",
        ],
      },
      {
        heading: "The machine-mediated consequence",
        paragraphs: [
          "Semantic metadata changes what an agent can do safely. Field descriptions can expose units, denominators, scope, suppression, and administrative definitions that are invisible in terse names. Without them, a system may still return syntactically valid rows. That is precisely the risk: successful retrieval can conceal interpretive failure.",
          "The institutional question is who pays to restore meaning. If the publisher supplies descriptions and reference assets, interpretation becomes shared infrastructure. If not, every downstream user rebuilds a private semantic layer. Better-resourced firms and agencies can afford that work; smaller organizations inherit guesswork. A public dataset remains free while reliable use becomes unequal.",
        ],
      },
      {
        heading: "A better test than counting descriptions",
        paragraphs: [
          "Column-description coverage is observable, but it is only a proxy for semantic sufficiency. A short description can repeat the field name; a well-designed codebook can explain the table even when the catalog array is empty. The next experiment should sample tasks from each portal and ask independent agents to select the correct dataset, fields, filters, units, and joins. Documentation would be added or removed experimentally, and errors would be classified by consequence rather than syntax.",
          "That design can also test the two-clock argument. Freeze the schema while varying the age of the observation, then freeze the observation while varying documentation quality. If agents confuse an old but well-described dataset with current reality, freshness signaling is the missing control. If they retrieve current rows but misuse denominators or categories, semantic infrastructure is the bottleneck. Portals need to know which repair changes behavior; a broad maturity score cannot answer that.",
        ],
      },
      {
        heading: "What would change my mind",
        paragraphs: [
          "The Discovery API may not expose documentation available elsewhere on a portal, and some publishers place meaning in attachments or external data dictionaries. A follow-up should crawl those linked artifacts and evaluate whether missing catalog descriptions are recoverable nearby. I would weaken the claim if agents consistently retrieved the right documentation and completed consequential tasks without added errors.",
          "For now, the design implication is modest but concrete: govern two clocks. Monitor when observations change and when their meaning is reviewed. A data refresh should not silently count as a semantic refresh, and a detailed schema should not certify that the underlying observations are current.",
        ],
      },
    ],
    dataLinks: [
      ["Download dataset-level audit", "/data/public-data-series/open-data-metadata-audit.csv"],
      ["Download portal summary", "/data/public-data-series/open-data-metadata-summary.csv"],
    ],
    sources: [
      ["Socrata SODA endpoint documentation", "https://dev.socrata.com/docs/endpoints.html"],
      ["Socrata Discovery API endpoint", "https://api.us.socrata.com/api/catalog/v1"],
      ["Do Agents Need Semantic Metadata?", "https://arxiv.org/abs/2605.28787"],
    ],
  },
  {
    slug: "digital-channel-has-a-constituency",
    number: "03",
    title: "The Digital Channel Has a Constituency",
    eyebrow: "Civic participation analysis · NYC 311 + ACS",
    standfirst:
      "Lower-income neighborhoods were not silent in 311. They were differently routed. An AI channel can change whose signal arrives in machine-ready form.",
    question:
      "Does the mix of phone, online, and mobile 311 participation vary with neighborhood income and broadband access, even when overall request activity is high?",
    evidenceStatus:
      "Descriptive ZIP-code cross-section. Incident ZIP may differ from caller residence, and neither income nor broadband is interpreted causally.",
    metrics: [
      ["2025 requests in analysis", "3.62M"],
      ["NYC ZCTAs", "180"],
      ["Digital share · lower-income quartile", "64.7%"],
      ["Digital share · higher-income quartile", "74.4%"],
    ],
    figure: {
      src: "/figures/public-data-series/nyc-311-channel-access.svg",
      alt: "Scatterplot of median household income against the share of 311 requests submitted online or by mobile across New York City ZIP Code Tabulation Areas.",
      caption:
        "Each point is a ZCTA; point size reflects requests and color reflects broadband subscription. The fitted line summarizes an association, not a causal effect.",
    },
    blocks: [
      {
        heading: "Participation is not a count alone",
        paragraphs: [
          "Administrative datasets often treat a request as a request. But the route matters. Phone calls arrive through conversation, interpretation, and possible operator assistance. Online and mobile requests arrive already structured into fields. If an institution trains triage systems, forecasts demand, or automates routing, the digitally submitted request is easier to reuse. Channel choice can therefore affect not only convenience, but how legible a civic signal becomes to the institution.",
          "That raised a narrower question than the familiar debate about whether disadvantaged neighborhoods report less: where overall participation exists, is it delivered through the same channels? If not, adding an AI assistant to a digital interface may amplify one form of participation without reaching the people already using the public system through another.",
        ],
      },
      {
        heading: "Joining activity to access",
        paragraphs: [
          "I aggregated every 2025 NYC 311 service-request record by incident ZIP and open-data channel. To keep the server query auditable, the code retrieves twelve monthly aggregates and sums them; it does not sample rows. I joined those totals to the Census Bureau's 2024 ACS five-year population, median household income, and broadband estimates for ZCTAs. The analytical set retains ZCTAs with at least 1,000 residents and 100 requests.",
          "Digital participation is defined narrowly as online or mobile submission. Phone, other, and unknown are not counted as digital. The resulting set contains 3.62 million requests across 180 ZCTAs. Because the geographic field describes the incident, not necessarily the caller, the analysis characterizes where digitally routed complaints concern, not the demographic identity of individual complainants.",
        ],
      },
      {
        heading: "A channel gradient inside an active system",
        paragraphs: [
          "The digital share was 64.7 percent in the lowest-income quartile of ZCTAs and 74.4 percent in the highest. Across all ZCTAs, the Spearman correlation between median household income and digital share was 0.405. Broadband subscription had a separate positive association of 0.354 with digital share. The pattern is visible, but far from deterministic: neighborhoods at similar incomes often used different channel mixes.",
          "The result I did not want to lose is that lower-income ZCTAs were not simply absent. Their median request rate was higher than the rate in the top-income quartile, about 459 versus 362 requests per 1,000 residents. That does not prove greater civic voice; duplicate reports, land use, daytime populations, housing conditions, and complaint mix all matter. But it rejects the easiest narrative that the channel gap is merely a participation gap.",
        ],
      },
      {
        heading: "Why AI can widen a representational difference",
        paragraphs: [
          "Suppose a city adds an agent that turns a resident's description into a complete, categorized request. The immediate evaluation might ask whether completion rises. The institutional effect depends on who enters through that channel. If already-digital neighborhoods adopt first, their concerns may become more standardized, more richly documented, and easier to route at scale. Phone-mediated concerns may remain expensive to transcribe and harder to aggregate.",
          "The risk is not simply fewer requests from one group. It is unequal evidentiary form. Two neighborhoods can contact government at similar rates while one produces machine-ready claims and the other produces conversational records that require institutional labor. A downstream model trained on resolved, structured cases can then learn the channel difference as if it were a difference in need or validity.",
        ],
      },
      {
        heading: "A sharper channel experiment",
        paragraphs: [
          "The current analysis deliberately stays above the complaint-type level. A stronger design would create matched cells: the same complaint category, month, borough, and local built-environment conditions, observed across phone and digital channels. It would compare missing fields, resolution time, reopenings, duplicate detection, and whether requests are routed to the same agency. That would show whether channel differences survive after the task is made more comparable.",
          "An intervention could then rotate access to an agent across channels. One treatment would help web users structure a claim; another would give call-center staff the same assistance; a third would provide multilingual voice access directly to residents. If only the web treatment improves machine-readiness, the technology has increased the channel gradient. If staff-mediated assistance equalizes record quality without reducing phone access, the agent functions as public infrastructure rather than a new gate.",
        ],
      },
      {
        heading: "Alternative explanations are the next study",
        paragraphs: [
          "Complaint categories likely explain part of the gradient. Heat and hot-water issues, noise, parking, sanitation, and street conditions have different geographic distributions and may invite different channels. Age, language, housing type, and trust may affect both channel and complaint choice. The current join cannot distinguish those mechanisms.",
          "A stronger design would compare the same complaint category across channels and neighborhoods, study channel-specific resolution times, and exploit a staggered interface change or randomized outreach. I would revise the representation argument if the channel gradient vanished within comparable tasks or if agencies transformed phone and digital requests into equally complete internal records.",
        ],
      },
      {
        heading: "Design implication: evaluate channel portfolios",
        paragraphs: [
          "An AI public-service pilot should report more than aggregate uptake. It should show substitution across phone, web, mobile, and in-person routes; completion quality within each; and whether assistance makes one channel institutionally privileged. The equity question is not ‘did more people use the agent?’ It is ‘whose claims became cheaper for the institution to understand?’",
        ],
      },
    ],
    dataLinks: [
      ["Download ZIP-level analysis", "/data/public-data-series/nyc-311-channel-access.csv"],
      ["Download income-quartile results", "/data/public-data-series/nyc-311-channel-income-quartiles.csv"],
    ],
    sources: [
      ["NYC 311 Service Requests from 2020 to Present", "https://data.cityofnewyork.us/d/erm2-nwe9"],
      ["Census ACS Summary File documentation", "https://www.census.gov/programs-surveys/acs/data/summary-file.html"],
      ["Equity in 311 Reporting", "https://arxiv.org/abs/1710.02452"],
      ["Bias in smart city governance", "https://doi.org/10.1016/j.scs.2020.102503"],
    ],
  },
  {
    slug: "priority-list-is-a-parameter",
    number: "04",
    title: "The Priority List Is a Parameter",
    eyebrow: "Robustness experiment · ACS state data",
    standfirst:
      "A ranking can look like evidence after its policy choices have been hidden inside weights. The honest output is sometimes a probability of priority, not a numbered list.",
    question:
      "How stable is a state priority order when the same public data are combined through alternative, defensible weighting and aggregation choices?",
    evidenceStatus:
      "Illustrative robustness test, not a validated vulnerability index. The variables and weight space are analytical choices and are published precisely so they can be contested.",
    metrics: [
      ["States + DC", "51"],
      ["Random weight draws", "10,000"],
      ["Equal-weight top ten stable ≥80%", "5"],
      ["Median 90% rank interval", "25 places"],
    ],
    figure: {
      src: "/figures/public-data-series/state-ranking-fragility.svg",
      alt: "Interval plot shows wide rank ranges for states that appear near the top of an equal-weight priority score.",
      caption:
        "Dots compare the equal-weight rank with the median rank across 10,000 weight draws; lines show the fifth to ninety-fifth percentile. The broad weight space is a stress test, not a probability distribution over policy preferences.",
    },
    blocks: [
      {
        heading: "The seduction of one ordered list",
        paragraphs: [
          "Resource allocation wants an order. Which state should receive technical assistance first? Which jurisdiction needs an accessible digital-service redesign? Once a dashboard produces ranks, the list appears to be discovered in the data. But a multidimensional priority is not observed. It is constructed from variables, transformations, weights, and a rule about whether strength on one dimension can compensate for weakness on another.",
          "The OECD's composite-indicator handbook treats uncertainty and sensitivity analysis as part of responsible construction. Yet the uncertainty often disappears at the point of use. A map shows five colors; a table shows ranks one through fifty-one; an automated triage system receives a score. I wanted to make the hidden range visible using data familiar enough that the mechanics could not hide behind a complex model.",
        ],
      },
      {
        heading: "Four measures, several reasonable decisions",
        paragraphs: [
          "From the 2024 ACS five-year Summary File, I calculated four state-level rates: poverty, households without broadband, disability, and limited-English-speaking households. Each measure was converted to a percentile so units could not dominate. The baseline averaged them equally. Alternative deterministic rules doubled poverty weight, doubled the digital-access weight, or used a geometric mean that penalizes a state for having one low-risk dimension rather than allowing full compensation.",
          "I then drew 10,000 weight vectors from a uniform Dirichlet distribution and recomputed ranks. That distribution is intentionally broad: it gives equal space to many possible emphases rather than pretending to represent actual public preferences. Its purpose is diagnostic. If a rank changes only under extreme weights, it is robust. If it moves throughout the weight space, the ordered list is doing normative work.",
        ],
      },
      {
        heading: "Half of the apparent top ten was conditional",
        paragraphs: [
          "The equal-weight score placed Alabama, Arkansas, Kentucky, Louisiana, Mississippi, New Mexico, Oklahoma, South Carolina, Tennessee, and West Virginia in the top ten. Across random weights, only five states (Arkansas, Kentucky, Louisiana, New Mexico, and Oklahoma) had at least an 80 percent chance of remaining there. The median state's fifth-to-ninety-fifth percentile rank interval spanned 25 places.",
          "West Virginia provides the clearest warning. It ranked seventh under equal weights and sixth when digital access received double weight, but twenty-fifth under the noncompensatory rule. Across the broad random-weight diagnostic, its central ninety percent interval ran from first to thirty-ninth. None of those answers is a data error. They answer different questions about whether concentrated disadvantage on some dimensions can be offset by strength on another.",
        ],
      },
      {
        heading: "Why the result is not ‘rankings are useless’",
        paragraphs: [
          "A decision still has to be made. Refusing to rank can preserve an implicit allocation rule that is even harder to inspect. The lesson is narrower: the institution should distinguish dominance from preference. A state that remains high across most weights is empirically robust within this variable set. A state that enters the top tier only when one dimension is emphasized is a policy-contingent priority. Those should not be presented with the same visual certainty.",
          "The experiment also understates uncertainty. I held the variable set, geography, vintage, percentile transformation, and Census estimates fixed. Sampling error and measurement validity are absent. In a real index, those decisions may change ranks more than weights do. The published interval is therefore not a confidence interval around a true vulnerability rank; it is a sensitivity interval over one family of value choices.",
        ],
      },
      {
        heading: "What the code actually varies",
        paragraphs: [
          "Every state first receives four percentile positions. For a weight vector w, the score is the weighted sum of those four positions and the rank is recomputed across all fifty states and DC. Drawing weights from a Dirichlet distribution makes them nonnegative and forces them to sum to one. Repeating that operation 10,000 times yields a rank distribution and a top-ten frequency for each state. The seed is fixed so the published table is exactly reproducible.",
          "The deterministic geometric-mean rule asks a different question. Because a very low dimension cannot be completely offset by three high ones, it rewards breadth of disadvantage rather than the additive rule's total. West Virginia's movement is therefore diagnostic, not mysterious: concentrated strength and weakness are treated differently. Publishing both rules makes the disagreement inspectable. Calling one of them ‘the data-driven score’ would erase the choice.",
        ],
      },
      {
        heading: "What changes when an agent uses the score",
        paragraphs: [
          "When a human committee sees the four variables, disagreement can surface. When an AI system receives only the composite score, the value judgment becomes part of its environment. The agent can optimize accurately while allocating inspections, grants, or outreach according to a preference no user sees. Technical performance then legitimizes the hidden aggregation rule.",
          "A contestable system should expose the score's components, show how the decision changes under plausible weights, and allow decision-makers to state the normative tradeoff they intend. Where rank uncertainty is large, the system can return a priority set or probability rather than a false exact order.",
        ],
      },
      {
        heading: "What would make the top ten convincing",
        paragraphs: [
          "I would trust a fixed top tier more if it survived alternative variable definitions, ACS margins of error, normalization rules, aggregation choices, and weight distributions grounded in stakeholder elicitation. External outcomes should also validate that the score predicts the administrative barriers it claims to summarize. Until then, a robustness plot is not an appendix. It is part of the decision object.",
        ],
      },
    ],
    dataLinks: [
      ["Download state robustness results", "/data/public-data-series/state-priority-ranking-fragility.csv"],
      ["Download sampled weights", "/data/public-data-series/raw/rank-fragility-random-weights.csv"],
    ],
    sources: [
      ["OECD/EU/JRC composite-indicator handbook", "https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html"],
      ["Census ACS Summary File documentation", "https://www.census.gov/programs-surveys/acs/data/summary-file.html"],
      ["On the Methodological Framework of Composite Indices", "https://doi.org/10.1007/s11205-017-1832-9"],
    ],
  },
  {
    slug: "thirty-days-is-not-thirty-days",
    number: "05",
    title: "Thirty Days Is Not Thirty Days",
    eyebrow: "Procedural-burden analysis · Federal Register",
    standfirst:
      "A comment window measures calendar time. Participation depends on how much attention must fit inside it and who can parallelize the work.",
    question:
      "Do longer proposed rules reliably receive longer public-comment windows, or does nominally equal time conceal very different attention burdens?",
    evidenceStatus:
      "Descriptive audit of 2025 Federal Register proposed-rule records. Page count is a rough attention proxy, not a reading-time estimate or legal judgment about adequacy.",
    metrics: [
      ["Proposed rules", "1,498"],
      ["Valid window + length", "1,292"],
      ["Median comment window", "45 days"],
      ["Length–window Spearman ρ", "0.109"],
    ],
    figure: {
      src: "/figures/public-data-series/federal-register-comment-burden.svg",
      alt: "Scatterplot shows Federal Register proposed-rule page length against comment-window days, with little relationship between the two.",
      caption:
        "Document length is shown on a log scale. Records with missing close dates or windows outside one to 365 days are excluded from the association analysis.",
    },
    blocks: [
      {
        heading: "Formal openness has a denominator",
        paragraphs: [
          "Notice-and-comment rulemaking is open in a precise procedural sense: an agency publishes a proposal and invites the public to respond during a stated period. The Office of the Federal Register explains that comment periods commonly range from thirty to sixty days and may be longer for complex rulemakings. But a calendar day is not a unit of substantive access. A short, familiar proposal and a sprawling technical rule can offer the same number of days while demanding radically different attention.",
          "Organizations can divide that attention among lawyers, engineers, economists, and trade associations. An affected individual or small nonprofit cannot. The same formal window therefore creates different effective opportunities to identify consequences, gather evidence, and draft a comment the agency can use.",
        ],
      },
      {
        heading: "A rough load measure",
        paragraphs: [
          "Using the Federal Register's public API, I retrieved all 1,498 records classified as proposed rules and published in 2025. The API provides publication date, comment close date, page length, agency, and document URL. I retained 1,292 records with page lengths from one to 3,000 and comment windows from one to 365 days for the main analysis.",
          "I calculated pages per thirty comment days as a deliberately crude load indicator. It does not claim that every page requires equal effort. It omits referenced studies, regulatory-impact analyses, attachments, prior proposals, and the reader's expertise. Its value is transparency: if even a rough measure shows weak proportionality, the calendar window should not be treated as a sufficient account of access.",
        ],
      },
      {
        heading: "Time scaled only weakly with length",
        paragraphs: [
          "The median valid comment window was 45 days. Page length and window length had a Spearman correlation of 0.109, a positive but weak association. Some of the longest rules did receive more time, yet the upper tail shows why the denominator matters. A 910-page Medicare and Medicaid proposal offered 58 days, equivalent to about 471 pages per thirty days. A 490-page inpatient-payment proposal offered 41 days, about 359 pages per thirty days.",
          "Those examples are not evidence that the windows were unlawful or that no one could comment. They show that ‘58 days’ is not a complete description of the participation demand. A technically shorter proposal may also be harder than a long payment table. The more defensible conclusion is not a ranking of procedural fairness, but a measurement gap: public data expose time and length, while effective burden depends on their interaction with expertise and resources.",
        ],
      },
      {
        heading: "The missing close date is not a closed process",
        paragraphs: [
          "About 13.6 percent of proposed-rule records lacked a comment-close date in the fields retrieved. I do not code those as zero-day windows. Some documents may use nonstandard procedures, point to another date, or omit the field from the API representation. Treating missingness as denial would turn a data-quality issue into an unsupported legal claim.",
          "This is also why the experiment keeps source URLs at the row level. Any consequential assessment should return to the document and docket. The API is an index into a legal process, not the legal process itself.",
        ],
      },
      {
        heading: "Why pages per thirty days is intentionally crude",
        paragraphs: [
          "The load calculation divides Federal Register pages by the observed window and multiplies by thirty. It is not a hidden model of reading speed. Its virtue is that every input is public, row-level, and easy to challenge. A reader can replace pages with abstract length, count regulatory subjects, add docket attachments, exclude payment tables, or restrict the analysis to one agency. The code keeps the intermediate variables so those revisions do not require rebuilding the dataset.",
          "A richer burden measure should avoid learning only what large organizations already find difficult. Interviews and process traces could reveal when individuals stop: locating the relevant provision, understanding a cross-reference, quantifying an effect, or learning the submission procedure. Those frictions should become separate outcomes. Otherwise, an AI summarizer may improve a researcher-defined readability score while leaving the actual participation bottleneck untouched.",
        ],
      },
      {
        heading: "Agents lower one burden and can raise another",
        paragraphs: [
          "Language models can summarize rules, locate provisions, and help draft comments. That may broaden participation by reducing reading and writing costs. But if assistance makes high-volume comments cheap, agencies may change how they filter, cluster, or value submissions. The relevant system is not ‘citizen plus summarizer.’ It includes the agency's scarce verification and attention capacity.",
          "A tool that produces fluent but repetitive comments can increase nominal participation while making distinctive evidence harder to find. A better design would help a commenter trace claims to specific provisions, disclose uncertainty, and contribute information not already present in the docket. The goal is not maximal text generation; it is lower cost for substantive, inspectable participation.",
        ],
      },
      {
        heading: "A next metric: effective opportunity to comment",
        paragraphs: [
          "A serious measure would combine document and attachment complexity, novelty relative to prior rules, number of affected domains, translation availability, comment days, extensions, and the resources of likely participants. It would validate those features against who comments and which submissions agencies substantively address. I would abandon the load argument if richer measures showed that longer or more complex rules reliably receive proportionate time and support.",
          "Until then, dashboards should present time beside burden proxies, not alone. Procedural equality is not identical calendars. It is a defensible opportunity to understand and contest what the institution proposes to do.",
        ],
      },
    ],
    dataLinks: [
      ["Download rule-level analysis", "/data/public-data-series/federal-register-comment-burden.csv"],
      ["Download agency summary", "/data/public-data-series/federal-register-agency-comment-burden.csv"],
    ],
    sources: [
      ["Federal Register API documentation", "https://www.federalregister.gov/developers/documentation/api/v1"],
      ["Office of the Federal Register: The Rulemaking Process", "https://uploads.federalregister.gov/uploads/2013/09/The-Rulemaking-Process.pdf"],
    ],
  },
  {
    slug: "global-comparison-cannot-exist",
    number: "06",
    title: "The Global Comparison That Cannot Be Both Global and Current",
    eyebrow: "Missingness experiment · World Bank Indicators",
    standfirst:
      "Same-year data exclude economies. Latest-value data include more of them by comparing different moments. Coverage has a temporal price.",
    question:
      "What happens to geographic coverage and temporal coherence when a cross-country digital-infrastructure comparison replaces same-year data with each economy's latest available value?",
    evidenceStatus:
      "Coverage experiment over four selected indicators and 217 World Bank economies. It is not a digital-readiness ranking and World Bank economy definitions include territories.",
    metrics: [
      ["World Bank economies", "217"],
      ["Complete in 2023", "72.4%"],
      ["Complete using latest 2020–24", "86.6%"],
      ["Latest complete cases mixing years", "23.9%"],
    ],
    figure: {
      src: "/figures/public-data-series/world-bank-missingness.svg",
      alt: "Grouped bars show same-year and latest-window coverage for four indicators across World Bank income groups.",
      caption:
        "Latest-value selection increases coverage in every income group shown, but some included economies combine indicators observed in different years.",
    },
    blocks: [
      {
        heading: "The impossible triangle",
        paragraphs: [
          "A global comparison often promises three things at once: broad geographic coverage, multiple dimensions, and a common time period. Public data rarely supply all three. Analysts then make a quiet choice. They can drop economies with missing values, reduce the number of dimensions, impute observations, or substitute the latest available value. Each fix changes the object being compared.",
          "The issue is especially important for claims about digital government or AI readiness. Infrastructure can change quickly, and the ability to measure it is itself uneven. A polished rank may therefore reward both actual capacity and statistical observability while concealing which economies were compared using older evidence.",
        ],
      },
      {
        heading: "Two honest but incompatible datasets",
        paragraphs: [
          "From the World Bank Indicators API, I retrieved 2020–2024 observations for internet use, fixed-broadband subscriptions, secure internet servers, and access to electricity. These are not a complete theory of digital capacity. They are four public measures with different collection processes and enough conceptual range to make the missing-data choice visible.",
          "The strict dataset requires all four values in 2023. The latest-window dataset takes each economy's most recent nonmissing value from 2020 through 2024 and records the year for every indicator. The analysis does not impute. It asks what coverage is purchased by allowing the comparison to span time within an economy.",
        ],
      },
      {
        heading: "Thirty-one more economies, one new ambiguity",
        paragraphs: [
          "Of 217 World Bank economies, 157 (72.4 percent) had all four values in 2023. Latest-window selection raised the complete set to 188, or 86.6 percent. That is a meaningful inclusion gain: thirty-one additional economies can enter a four-dimensional comparison without a modeled value.",
          "But 23.9 percent of those latest-window complete cases mixed indicator years. Among low-income economies, same-year coverage was 60 percent and latest-window coverage was 80 percent; the median vintage span was one year. The gain is not fraudulent. It answers a different question: what is the latest mosaic we can assemble, rather than what did these infrastructures look like at one common moment?",
        ],
      },
      {
        heading: "A result that resists the easy inequality story",
        paragraphs: [
          "Coverage was not a simple monotonic function of income. In the World Bank economy list, the strict complete share was lower for the high-income group than for the two middle-income groups. Territories and small economies contribute to that pattern. It would be careless to summarize the experiment as ‘poor countries are missing.’ Statistical visibility follows data systems, indicator definitions, reporting arrangements, and the composition of the country list, not income alone.",
          "That complication strengthens the methodological point. Missingness should be reported as a pattern to investigate, not a nuisance deleted before the ranking appears. The set of excluded economies can reveal where a purportedly global construct is least observable.",
        ],
      },
      {
        heading: "Why latest value is not a neutral cleaning step",
        paragraphs: [
          "If an economy's broadband value is from 2024 and electricity value from 2022, the composite describes no single institutional state. That may be acceptable for slow-moving infrastructure and unacceptable during shocks, rapid investment, or conflict. The analyst has made a substantive assumption about temporal comparability.",
          "Complete-case deletion makes another assumption: the observable subset is an adequate stand-in for the world. Imputation makes a third: missing values can be inferred from observed structure. There is no assumption-free repair. The research obligation is to keep the tradeoff visible and test whether conclusions change across these choices.",
        ],
      },
      {
        heading: "The vintage vector as data, not a footnote",
        paragraphs: [
          "The latest-window file stores four value columns and four year columns for every economy. That structure allows a downstream analysis to calculate the within-economy vintage span, exclude comparisons that cross a chosen threshold, or discount older components. It also prevents a common reproducibility failure in which the displayed number survives but the rule used to select its year does not.",
          "A future ranking experiment should carry the vintage vector through every bootstrap or sensitivity draw. One scenario could require a common year. A second could permit a one-year span. A third could model each indicator forward with uncertainty that grows with age. If the membership of a policy tier changes across those scenarios, temporal coherence is part of the decision uncertainty. The right output is not a more precise rank; it is a visible dependence on time.",
        ],
      },
      {
        heading: "Publish the vintage vector",
        paragraphs: [
          "Every cross-country score should carry the year of every component, the reason for substitution, and a sensitivity result under same-year, latest-year, and defensible imputation rules. Where temporal mixing changes top-tier membership, the output should be an interval or scenario set rather than a single rank.",
          "I would weaken the argument if adding reasonable dimensions left nearly every economy complete in a common year, or if latest-value substitution never altered downstream classification. Until then, ‘global’ and ‘current’ should be treated as empirical claims that require their own evidence.",
        ],
      },
    ],
    dataLinks: [
      ["Download strict-year coverage", "/data/public-data-series/world-bank-strict-2023-coverage.csv"],
      ["Download latest-window coverage", "/data/public-data-series/world-bank-latest-window-coverage.csv"],
    ],
    sources: [
      ["World Bank Indicators API documentation", "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392"],
      ["World Bank: Individuals using the Internet", "https://data.worldbank.org/indicator/IT.NET.USER.ZS"],
      ["When is there enough data to create a global statistic?", "https://doi.org/10.3233/SJI-220090"],
      ["Rethinking the methodology of global indexes", "https://pmc.ncbi.nlm.nih.gov/articles/PMC11658712/"],
    ],
  },
];
