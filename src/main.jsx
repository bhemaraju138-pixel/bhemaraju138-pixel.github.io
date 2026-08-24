import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { notes, publicDataEssays, research, timeline } from "./content";
import { runModel, scenarios } from "./model";
import "./styles.css";

const percent = (value, digits = 0) => `${(value * 100).toFixed(digits)}%`;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Header() {
  const path = window.location.pathname;
  const links = [
    ["/publications/", "Publications"],
    ["/blogs/", "Blogs"],
    ["/experiments/claiming-under-agents/", "Lab"],
    ["/about/", "About"],
  ];

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <a className="wordmark" href="/" aria-label="Hema Raju Barri, home">
        <span>HRB</span>
        <small>Researcher · Builder</small>
      </a>
      <nav aria-label="Primary navigation">
        {links.map(([href, label]) => (
          <a
            href={href}
            key={href}
            aria-current={path.startsWith(href) ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <a className="contact-link" href="mailto:bhemaraju.138@gmail.com">
        Contact <Arrow />
      </a>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Hema Raju Barri</strong>
        <p>Researcher · systems builder · public-interest technologist</p>
      </div>
      <div className="footer-links">
        <a href="mailto:bhemaraju.138@gmail.com">Email</a>
        <a href="https://github.com/bhemaraju138-pixel">GitHub</a>
        <a href="/publications/">Publications</a>
        <a href="/blogs/">Blogs</a>
        <a href="/about/">About</a>
      </div>
      <p className="date-note">
        Historical project dates mark when work was conducted. Portfolio notes were
        published in August 2026 unless otherwise stated.
      </p>
    </footer>
  );
}

function Shell({ children }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

function EvidenceChain() {
  return (
    <div className="system-map" aria-label="Citizen to institution research system">
      <div className="system-node">
        <span>01</span>
        <strong>Citizen</strong>
        <small>eligibility · resources</small>
      </div>
      <div className="system-arrow" aria-hidden="true">→</div>
      <div className="system-node accent-node">
        <span>02</span>
        <strong>Agent</strong>
        <small>capability · error · cost</small>
      </div>
      <div className="system-arrow" aria-hidden="true">→</div>
      <div className="system-node">
        <span>03</span>
        <strong>Evidence</strong>
        <small>schema · documents · claims</small>
      </div>
      <div className="system-arrow" aria-hidden="true">→</div>
      <div className="system-node institution-node">
        <span>04</span>
        <strong>Institution</strong>
        <small>capacity · verification · rules</small>
      </div>
      <div className="return-arrow">
        <span aria-hidden="true">↶</span>
        <p>The institution responds. That response changes the next claim.</p>
      </div>
    </div>
  );
}

function ResearchCard({ item, index }) {
  return (
    <article className="research-card">
      <div className="card-index">0{index + 1}</div>
      <div className="card-meta">
        <span>{item.year}</span>
        <span>{item.type}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="card-dek">{item.dek}</p>
      <dl>
        <div>
          <dt>Question</dt>
          <dd>{item.question}</dd>
        </div>
        <div>
          <dt>What changed</dt>
          <dd>{item.finding}</dd>
        </div>
      </dl>
      <a className="text-link" href={item.href}>
        {item.linkLabel} <Arrow />
      </a>
    </article>
  );
}

const researchLenses = [
  {
    id: "institutions",
    label: "Institutions",
    glyph: "I",
    question: "How do institutions respond when intelligent systems change the cost of acting?",
    thesis:
      "AI does not enter a fixed organization. Agencies and firms change verification, sourcing, queues, and evidence requirements in response.",
    projectIndexes: [1, 4, 6],
    accent: "coral",
  },
  {
    id: "people",
    label: "People",
    glyph: "P",
    question: "For whom does an intelligent system work—and under which interaction conditions?",
    thesis:
      "Performance is relational. The same behavior can help one person and frustrate another because fit depends on the user, task, and stakes.",
    projectIndexes: [3, 4, 6],
    accent: "blue",
  },
  {
    id: "evidence",
    label: "Evidence",
    glyph: "E",
    question: "Which analytical choices determine what remains visible and believable?",
    thesis:
      "A result is only as stable as the assumptions, missing-data decisions, joins, and counterfactual evidence that produced it.",
    projectIndexes: [2, 4, 5],
    accent: "gold",
  },
  {
    id: "systems",
    label: "Systems",
    glyph: "S",
    question: "What infrastructure makes autonomous action reliable, repairable, and contestable?",
    thesis:
      "Schemas, failure signals, permissions, and monitoring are governance mechanisms—not implementation details.",
    projectIndexes: [0, 5, 6],
    accent: "mint",
  },
];

function ResearchCompass() {
  const [activeId, setActiveId] = useState("institutions");
  const active = researchLenses.find((lens) => lens.id === activeId);

  return (
    <div className={`research-compass ${active.accent}`}>
      <div className="compass-controls" role="tablist" aria-label="Explore research by lens">
        {researchLenses.map((lens, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={lens.id === activeId}
            key={lens.id}
            onClick={() => setActiveId(lens.id)}
          >
            <span>0{index + 1}</span>
            {lens.label}
          </button>
        ))}
      </div>
      <div className="compass-reading" role="tabpanel" aria-live="polite">
        <div className="compass-glyph" aria-hidden="true">{active.glyph}</div>
        <p className="eyebrow">A question I keep returning to</p>
        <h3>{active.question}</h3>
        <p>{active.thesis}</p>
      </div>
      <div className="compass-projects">
        <span className="eyebrow">Follow the thread</span>
        {active.projectIndexes.map((index) => (
          <a href={research[index].href} key={research[index].title}>
            <small>{research[index].year} · {research[index].type}</small>
            <strong>{research[index].title}</strong>
            <Arrow />
          </a>
        ))}
      </div>
    </div>
  );
}

function NotebookPreviewCard({ essay }) {
  return (
    <a className="notebook-preview-card" href={`/experiments/${essay.slug}/`}>
      <div>
        <span>{essay.number}</span>
        <small>Experiment · August 2026</small>
      </div>
      <h3>{essay.title}</h3>
      <p>{essay.standfirst}</p>
      <strong className="notebook-card-link">Read the blog <Arrow /></strong>
    </a>
  );
}

function Home() {
  return (
    <Shell>
      <section className="hero portfolio-hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow">Hema Raju Barri · Researcher · Systems builder</p>
          <h1>
            I study the systems <em>around intelligent systems.</em>
          </h1>
          <p className="hero-lede">
            My work crosses AI, management, and public institutions. I build systems,
            run experiments, and study the less visible choices—interfaces, evidence,
            incentives, and rules—that determine who technology actually works for.
          </p>
          <div className="button-row">
            <a className="primary-button" href="/publications/">
              Browse publications <Arrow />
            </a>
            <a className="secondary-button" href="/blogs/">
              Read the blogs
            </a>
          </div>
        </div>
        <aside className="hero-note portfolio-status">
          <span className="status-pulse"><i /> Current desk</span>
          <p>Researching robustness and missing-data decisions at Oxford Saïd.</p>
          <dl>
            <div><dt>Working across</dt><dd>AI · management · public systems</dd></div>
            <div><dt>Perspective</dt><dd>Computer science, management, and field research</dd></div>
            <div><dt>Notebook</dt><dd>Open methods, code, and unfinished questions</dd></div>
          </dl>
        </aside>
      </section>

      <div className="practice-rail" aria-label="Research practices">
        <div>
          <span>01</span> Build the system
          <span>02</span> Test the behavior
          <span>03</span> Trace the institution
          <span>04</span> Publish the uncertainty
        </div>
      </div>

      <section className="compass-section page-shell" aria-labelledby="compass-heading">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Interactive research compass</p>
            <h2 id="compass-heading">Four lenses. One evolving practice.</h2>
          </div>
          <p className="section-side-note">
            Choose a lens to see how projects that look unrelated belong to the same
            research program.
          </p>
        </div>
        <ResearchCompass />
      </section>

      <section className="selected-section portfolio-selected page-shell" aria-labelledby="selected-heading">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Publications</p>
            <h2 id="selected-heading">Presented, forthcoming, and in circulation.</h2>
          </div>
          <a className="text-link" href="/publications/">
            View publications <Arrow />
          </a>
        </div>
        <div className="card-grid portfolio-card-grid">
          {research.slice(0, 3).map((item, index) => (
            <ResearchCard item={item} index={index} key={item.title} />
          ))}
        </div>
      </section>

      <section className="notebook-home page-shell" aria-labelledby="notebook-heading">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Blogs</p>
            <h2 id="notebook-heading">Experiments, essays, and field notes.</h2>
          </div>
          <a className="text-link" href="/blogs/">
            Browse all blogs <Arrow />
          </a>
        </div>
        <div className="notebook-preview-grid">
          {publicDataEssays.slice(0, 4).map((essay) => (
            <NotebookPreviewCard essay={essay} key={essay.slug} />
          ))}
        </div>
        <div className="blog-notes-preview">
          <p className="eyebrow">Research notes</p>
          <div className="notes-list">
            {notes.slice(0, 3).map((note, index) => (
              <a href={`/notes/${note.slug}/`} className="note-row" key={note.slug}>
                <span className="note-row-number">N{index + 1}</span>
                <span><strong>{note.title}</strong><small>{note.eyebrow}</small></span>
                <span className="row-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="experiment-band portfolio-lab" aria-labelledby="experiment-heading">
        <div className="page-shell experiment-band-inner">
          <div>
            <p className="eyebrow light">Interactive lab · Open model</p>
            <h2 id="experiment-heading">The Burden Moves</h2>
            <p>
              Change agency capacity, verification response, and unequal agent
              quality. The model reveals when assistance expands access—and when the
              administrative burden simply reappears somewhere else.
            </p>
          </div>
          <div className="experiment-mark" aria-hidden="true">
            <span>claim ↓</span><span>volume ↑</span><span>verify ?</span>
          </div>
          <a className="light-button" href="/experiments/claiming-under-agents/">
            Run the model <Arrow />
          </a>
        </div>
      </section>

      <section className="home-about page-shell" aria-labelledby="home-about-heading">
        <div className="home-about-statement">
          <p className="eyebrow">About</p>
          <h2 id="home-about-heading">Computer scientist by training. Institution-watcher by habit.</h2>
          <p>
            I have built agentic workflows, studied human–AI interaction, worked with
            municipal policy teams, and replicated econometric studies. The settings
            change; the habit does not: find the hidden assumption, make it observable,
            and test whether the conclusion survives.
          </p>
          <a className="primary-button" href="/about/">More about me <Arrow /></a>
        </div>
        <div className="home-about-facts">
          <div><span>Now</span><strong>Research Assistant, Oxford Saïd</strong></div>
          <div><span>Previously</span><strong>Johns Hopkins · Birmingham Mayor’s Office · AI systems teams</strong></div>
          <div><span>Methods</span><strong>Experiments · econometrics · simulations · field research · systems engineering</strong></div>
          <div><span>Always</span><strong>Open code, careful claims, useful questions</strong></div>
        </div>
      </section>
    </Shell>
  );
}

function ExperimentEssayCard({ essay }) {
  return (
    <a className="experiment-essay-card" href={`/experiments/${essay.slug}/`}>
      <span className="essay-card-number">{essay.number}</span>
      <span className="eyebrow">Public-data experiment</span>
      <h3>{essay.title}</h3>
      <p>{essay.standfirst}</p>
      <span className="card-action">Read methods and results <Arrow /></span>
    </a>
  );
}

function ExperimentsLanding() {
  return (
    <Shell>
      <section className="page-intro page-shell experiments-landing-intro">
        <p className="eyebrow">Open methods · Public data · August 2026</p>
        <h1>Experiments that can tell me I am wrong.</h1>
        <p className="intro-lede">
          Six empirical essays test a different institutional boundary—failure,
          metadata, participation, ranking, procedure, and missingness. Each exposes
          its data, code, exclusions, and defeaters.
        </p>
        <div className="status-box landing-status">
          <strong>Series rule</strong>
          <p>
            No result is presented as causal. A title earns its claim only through a
            reproducible contrast and an explicit account of what the data cannot show.
          </p>
        </div>
      </section>

      <section className="experiment-principles page-shell" aria-label="Experiment design principles">
        <div><span>01</span><strong>One public-data test</strong><small>Not a renamed concept</small></div>
        <div><span>02</span><strong>One result that could reverse</strong><small>Not a confirmatory illustration</small></div>
        <div><span>03</span><strong>One institutional implication</strong><small>Not an AI slogan</small></div>
        <div><span>04</span><strong>One published limitation</strong><small>Not false certainty</small></div>
      </section>

      <section className="experiment-index page-shell" aria-labelledby="experiment-index-heading">
        <div className="section-heading">
          <p className="eyebrow">Public-data essay series</p>
          <h2 id="experiment-index-heading">Six boundaries. Six falsifiable claims.</h2>
        </div>
        <div className="essay-card-grid full-grid">
          {publicDataEssays.map((essay) => (
            <ExperimentEssayCard essay={essay} key={essay.slug} />
          ))}
        </div>
      </section>

      <section className="novelty-audit page-shell" aria-labelledby="novelty-audit-heading">
        <div className="section-heading">
          <p className="eyebrow">Novelty ledger</p>
          <h2 id="novelty-audit-heading">No old concept is relabeled as a discovery.</h2>
        </div>
        <div className="novelty-table" role="table" aria-label="Established ideas and new contribution">
          <div className="novelty-row header-row" role="row">
            <span role="columnheader">Experiment</span>
            <span role="columnheader">Established before this analysis</span>
            <span role="columnheader">Contribution tested here</span>
          </div>
          {[
            ["Error recovery", "Machine-readable problem details", "Failure signals allocate repair capacity"],
            ["Metadata", "Open-data quality audits", "Freshness and semantic legibility behave as separate capabilities"],
            ["311 channels", "Socio-spatial reporting bias", "High participation can coexist with unequal machine-ready form"],
            ["Priority ranks", "Composite-index sensitivity", "A decision-facing probability of priority; method is not claimed as new"],
            ["Comment burden", "Variable comment periods", "Attention-normalized load rather than calendar time alone"],
            ["Global coverage", "Nonrandom missing data", "The vintage vector makes the temporal price of inclusion observable"],
          ].map(([name, established, contribution]) => (
            <div className="novelty-row" role="row" key={name}>
              <strong role="cell">{name}</strong>
              <span role="cell">{established}</span>
              <span role="cell">{contribution}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="simulation-callout page-shell">
        <div>
          <p className="eyebrow">Separate theory-building instrument</p>
          <h2>The Burden Moves</h2>
          <p>
            The essays begin with observed public data. This interactive model does
            something different: it formalizes how applicant assistance and agency
            verification can respond to each other.
          </p>
        </div>
        <a className="primary-button" href="/experiments/claiming-under-agents/">
          Run the simulation <Arrow />
        </a>
      </section>

      <section className="series-download page-shell">
        <p className="eyebrow">Reproducibility bundle</p>
        <h2>Audit every number from the source tables.</h2>
        <p>
          Raw extracts remain separate from processed tables. The bundle carries
          source URLs, scoring rules, the machine manifest, and the result tables used
          in the essays.
        </p>
        <div className="download-row">
          <a className="primary-button" href="/data/public-data-series/public-data-experiments.zip" download>
            Download the audit bundle <Arrow />
          </a>
          <a className="secondary-button" href="/data/public-data-series/manifest.json">
            Read the machine manifest
          </a>
        </div>
      </section>
    </Shell>
  );
}

function PublicationsPage() {
  const publications = research.slice(0, 3);

  return (
    <Shell>
      <section className="page-intro publications-intro page-shell">
        <p className="eyebrow">Publications</p>
        <h1>Research outputs and writing samples.</h1>
        <p className="intro-lede">
          Work on agent-readable public infrastructure, federal generative-AI
          sourcing, and how organizations preserve evidence about strategic paths
          they did not choose.
        </p>
      </section>

      <section className="publication-status-strip page-shell" aria-label="Publication status definitions">
        <div><span>Presented</span><p>The paper has been accepted and presented at the named conference.</p></div>
        <div><span>Upcoming</span><p>The abstract is accepted; the conference presentation is scheduled.</p></div>
        <div><span>Preprint</span><p>The manuscript is publicly available but is not described as peer reviewed.</p></div>
      </section>

      <section className="publications-list page-shell" aria-labelledby="publications-list-heading">
        <div className="section-heading">
          <p className="eyebrow">Selected publications</p>
          <h2 id="publications-list-heading">Status stated precisely.</h2>
        </div>
        {publications.map((item, index) => (
          <article className="publication-entry" key={item.title}>
            <div className="publication-number">0{index + 1}</div>
            <div className="publication-heading">
              <span className="publication-badge">{item.publicationStatus}</span>
              <h3>{item.title}</h3>
              <p className="publication-authors">{item.authors}</p>
              <p className="publication-venue">{item.venue}</p>
            </div>
            <div className="publication-detail">
              <p className="publication-dek">{item.dek}</p>
              <dl>
                <div><dt>Question</dt><dd>{item.question}</dd></div>
                <div><dt>Contribution</dt><dd>{item.implication}</dd></div>
              </dl>
              <a className="primary-button" href={item.href}>{item.linkLabel} <Arrow /></a>
            </div>
          </article>
        ))}
      </section>

      <section className="publication-contact page-shell">
        <p>
          For a copy, presentation materials, or a conversation about the methods,
          email <a href="mailto:bhemaraju.138@gmail.com">bhemaraju.138@gmail.com</a>.
        </p>
      </section>
    </Shell>
  );
}

const experimentTopics = ["systems", "government", "government", "methods", "government", "methods"];
const noteTopics = ["human–AI", "government", "systems", "government"];

function WritingPage() {
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");
  const writingItems = [
    ...publicDataEssays.map((essay, index) => ({
      id: `experiment-${essay.slug}`,
      title: essay.title,
      excerpt: essay.standfirst,
      href: `/experiments/${essay.slug}/`,
      kind: "Public-data experiment",
      date: "August 2026",
      topic: experimentTopics[index],
      marker: essay.number,
    })),
    ...notes.map((note, index) => ({
      id: `note-${note.slug}`,
      title: note.title,
      excerpt: note.standfirst,
      href: `/notes/${note.slug}/`,
      kind: "Research note",
      date: "August 2026",
      topic: noteTopics[index],
      marker: `N${index + 1}`,
    })),
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = writingItems.filter((item) => {
    const topicMatch = topic === "all" || item.topic === topic;
    const textMatch = !normalizedQuery || `${item.title} ${item.excerpt} ${item.kind}`.toLowerCase().includes(normalizedQuery);
    return topicMatch && textMatch;
  });
  const topics = ["all", "government", "methods", "human–AI", "systems"];

  return (
    <Shell>
      <section className="writing-hero page-shell">
        <div>
          <p className="eyebrow">Blogs · Experiments · Working ideas</p>
          <h1>Blogs and notes.</h1>
        </div>
        <p>
          Essays about AI, institutions, evidence, and the unglamorous infrastructure
          between a model and a real decision. Experiments include their data, code,
          exclusions, and the result that would change my mind.
        </p>
      </section>

      <section className="writing-feature page-shell">
        <div className="feature-marker">New / 06</div>
        <div>
          <p className="eyebrow">Featured public-data series</p>
          <h2>Six Boundaries of Machine-Mediated Government</h2>
          <p>
            Six small empirical tests of where institutional power hides before an AI
            system ever makes a decision: in failure messages, metadata, channels,
            rankings, comment windows, and missing observations.
          </p>
          <a className="primary-button" href="/experiments/">Enter the complete series <Arrow /></a>
        </div>
        <div className="feature-index" aria-label="Six experiment themes">
          {["Failure", "Metadata", "Channels", "Ranking", "Procedure", "Missingness"].map((label, index) => (
            <a href={`/experiments/${publicDataEssays[index].slug}/`} key={label}>
              <span>0{index + 1}</span><strong>{label}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="writing-index page-shell" aria-labelledby="writing-index-heading">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Browse the archive</p>
            <h2 id="writing-index-heading">Follow a question, not a format.</h2>
          </div>
          <div className="writing-count" aria-live="polite">{visibleItems.length} entries</div>
        </div>

        <div className="writing-tools">
          <div className="topic-filters" aria-label="Filter writing by topic">
            {topics.map((item) => (
              <button
                type="button"
                key={item}
                className={topic === item ? "active" : ""}
                onClick={() => setTopic(item)}
                aria-pressed={topic === item}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="writing-search">
            <span className="sr-only">Search writing</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the notebook…"
            />
          </label>
        </div>

        <div className="writing-list">
          {visibleItems.map((item) => (
            <a className="writing-row" href={item.href} key={item.id}>
              <span className="writing-marker">{item.marker}</span>
              <span className="writing-row-main">
                <small>{item.kind} · {item.date} · {item.topic}</small>
                <strong>{item.title}</strong>
                <p>{item.excerpt}</p>
              </span>
              <span className="writing-row-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
          {visibleItems.length === 0 && (
            <div className="writing-empty">No note matches that path. Try another word or topic.</div>
          )}
        </div>
      </section>

      <section className="writing-principle page-shell">
        <span className="eyebrow">Notebook rule</span>
        <blockquote>
          A polished argument should still show its seams: the data it excludes, the
          assumption it depends on, and the observation that could reverse it.
        </blockquote>
        <a className="secondary-button" href="/data/public-data-series/public-data-experiments.zip" download>
          Download the evidence bundle <Arrow />
        </a>
      </section>
    </Shell>
  );
}

function AboutPage() {
  const experience = [
    ["2026–now", "University of Oxford, Saïd Business School", "Research Assistant", "Missing-data sensitivity, econometric replication, and reproducible simulation infrastructure."],
    ["2026–now", "Testing Autonomy", "AI SDET", "Evaluation pipelines for LLM, RAG, and agentic workflows, including grounding and failure recovery."],
    ["2025", "Johns Hopkins Carey Business School", "Research Assistant", "A controlled human–AI study of empathizing and systemizing conversational behavior."],
    ["2025", "Center for Outbreak Response Innovation", "Research Assistant", "Self-healing public-health data collection with provenance, validation, and human review."],
    ["2025", "Birmingham Mayor’s Office / Bloomberg Center", "Strategy Analyst", "Municipal evidence integration, streetlighting policy, and implementation pathways."],
    ["2024–25", "SwiftCollab", "AI Engineer", "Schema-aware agent workflows, monitoring, durable execution, and recovery across external applications."],
  ];

  return (
    <Shell>
      <section className="about-hero page-shell">
        <div className="about-monogram" aria-hidden="true"><span>H</span><span>R</span><span>B</span></div>
        <div>
          <p className="eyebrow">About</p>
          <h1>I build things to understand how they behave in institutions.</h1>
          <p className="intro-lede">
            I am Hema Raju Barri, a researcher and systems builder working across AI,
            management, public policy, and empirical methods.
          </p>
        </div>
      </section>

      <section className="about-story page-shell">
        <div className="about-story-lead">
          <span className="eyebrow">The through-line</span>
          <h2>From model output to institutional consequence.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            I began in computer science, where reliability looked like a model that
            generalized or a deployment that reproduced. Building agentic workflows
            made the boundary larger: a fluent answer could still fail through the
            wrong tool, malformed arguments, missing provenance, or poor recovery.
          </p>
          <p>
            Field work in hospitals and city government made it larger again. Data
            systems determine which problems become visible; workflows determine who
            absorbs uncertainty; institutions respond when technology changes the
            volume and form of claims arriving at their door.
          </p>
          <p>
            That is now the center of my work: studying intelligent systems together
            with the people, evidence, infrastructure, and organizations around them.
          </p>
        </div>
      </section>

      <section className="education-strip page-shell" aria-label="Education">
        <div><span>2024–25</span><strong>Johns Hopkins University</strong><small>MSE, Engineering Management</small></div>
        <div><span>2025</span><strong>Imperial College London</strong><small>Winter School</small></div>
        <div><span>2020–24</span><strong>ANITS</strong><small>BTech, Computer Science</small></div>
      </section>

      <section className="experience-section page-shell" aria-labelledby="experience-heading">
        <div className="section-heading split-heading">
          <div><p className="eyebrow">Selected experience</p><h2 id="experience-heading">Research in the wild.</h2></div>
          <p className="section-side-note">Across universities, startups, hospitals, and local government.</p>
        </div>
        <div className="experience-list">
          {experience.map(([year, place, role, description]) => (
            <article key={`${year}-${place}`}>
              <span>{year}</span>
              <div><small>{role}</small><h3>{place}</h3></div>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="practice-section page-shell" aria-labelledby="practice-heading">
        <div className="section-heading"><p className="eyebrow">How I work</p><h2 id="practice-heading">Four commitments.</h2></div>
        <div className="practice-grid">
          <article><span>01</span><h3>Build close to the mechanism.</h3><p>Prototypes, data pipelines, and simulations make vague claims concrete enough to break.</p></article>
          <article><span>02</span><h3>Separate observation from inference.</h3><p>Descriptive evidence, causal claims, and conceptual proposals should never borrow one another’s certainty.</p></article>
          <article><span>03</span><h3>Publish the audit trail.</h3><p>Code, data decisions, exclusions, and falsifiers are part of the contribution.</p></article>
          <article><span>04</span><h3>Design for institutional reality.</h3><p>A technically elegant answer is incomplete if nobody can implement, contest, or maintain it.</p></article>
        </div>
      </section>

      <section className="contact-panel page-shell">
        <p className="eyebrow light">Say hello</p>
        <h2>Good questions travel well.</h2>
        <p>I am always glad to talk about AI evaluation, public systems, research methods, or an argument you think I have wrong.</p>
        <div className="button-row">
          <a className="light-button" href="mailto:bhemaraju.138@gmail.com">Email me <Arrow /></a>
          <a className="light-button" href="https://github.com/bhemaraju138-pixel">GitHub <Arrow /></a>
        </div>
      </section>
    </Shell>
  );
}

function PublicDataEssayPage({ essay }) {
  const currentIndex = publicDataEssays.findIndex((item) => item.slug === essay.slug);
  const previous = publicDataEssays[currentIndex - 1];
  const next = publicDataEssays[currentIndex + 1];

  return (
    <Shell>
      <article className="data-essay page-shell">
        <header className="data-essay-header">
          <div className="data-essay-sequence">Experiment {essay.number} / 06</div>
          <p className="eyebrow">{essay.eyebrow}</p>
          <h1>{essay.title}</h1>
          <p className="essay-standfirst">{essay.standfirst}</p>
          <div className="research-question-box">
            <span>Question</span>
            <p>{essay.question}</p>
          </div>
        </header>

        <section className="data-essay-metrics" aria-label="Key results">
          {essay.metrics.map(([label, value]) => (
            <div key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </section>

        <section className="evidence-status-strip">
          <strong>Evidence status</strong>
          <p>{essay.evidenceStatus}</p>
        </section>

        <figure className="data-essay-figure">
          <img src={essay.figure.src} alt={essay.figure.alt} />
          <figcaption>{essay.figure.caption}</figcaption>
        </figure>

        <div className="data-essay-layout">
          <aside className="essay-contents">
            <strong>Contents</strong>
            <ol>
              {essay.blocks.map((block, index) => (
                <li key={block.heading}>
                  <a href={`#section-${index + 1}`}>{block.heading}</a>
                </li>
              ))}
            </ol>
          </aside>
          <div className="data-essay-body">
            {essay.blocks.map((block, index) => (
              <section id={`section-${index + 1}`} key={block.heading}>
                <span className="section-number">{String(index + 1).padStart(2, "0")}</span>
                <h2>{block.heading}</h2>
                {block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
          </div>
        </div>

        <section className="essay-resources">
          <div>
            <p className="eyebrow">Data and code</p>
            <h2>Reproduce the contrast.</h2>
            <div className="resource-list">
              {essay.dataLinks.map(([label, href]) => (
                <a href={href} key={href}>{label} <Arrow /></a>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow">Sources and context</p>
            <ol className="source-list">
              {essay.sources.map(([label, href]) => (
                <li key={href}><a href={href}>{label}</a></li>
              ))}
            </ol>
          </div>
        </section>

        <nav className="series-nav" aria-label="Public-data experiment series">
          {previous ? (
            <a href={`/experiments/${previous.slug}/`}>
              <span>Previous experiment</span><strong>← {previous.title}</strong>
            </a>
          ) : <a href="/experiments/"><span>Series</span><strong>← All experiments</strong></a>}
          {next ? (
            <a href={`/experiments/${next.slug}/`}>
              <span>Next experiment</span><strong>{next.title} →</strong>
            </a>
          ) : <a href="/experiments/"><span>Series</span><strong>All experiments →</strong></a>}
        </nav>
      </article>
    </Shell>
  );
}

function ResearchPage() {
  return (
    <Shell>
      <section className="page-intro page-shell">
        <p className="eyebrow">Selected work</p>
        <h1>Research built from systems, data, and institutional questions.</h1>
        <p className="intro-lede">
          These studies begin in different settings—civic data, federal sourcing,
          human–AI interaction, strategy, health surveillance, and municipal
          policy—but share a method: make the hidden choice observable, then test
          what changes when it moves.
        </p>
      </section>

      <section className="question-matrix page-shell" aria-label="Research question matrix">
        <div className="matrix-label">Where is the consequential choice?</div>
        <div><span>Interface</span><strong>What can the agent see and do?</strong></div>
        <div><span>Interaction</span><strong>For whom does the behavior work?</strong></div>
        <div><span>Institution</span><strong>How does the counterparty respond?</strong></div>
        <div><span>Evidence</span><strong>What remains observable after action?</strong></div>
      </section>

      <section className="research-stack page-shell" aria-labelledby="work-heading">
        <div className="section-heading">
          <p className="eyebrow">Research trace</p>
          <h2 id="work-heading">Question → method → finding → implication</h2>
        </div>
        {research.map((item, index) => (
          <article className="research-full" key={item.title}>
            <div className="research-full-index">0{index + 1}</div>
            <div className="research-full-title">
              <div className="card-meta"><span>{item.year}</span><span>{item.type}</span></div>
              <h3>{item.title}</h3>
              <p>{item.dek}</p>
            </div>
            <dl className="research-full-details">
              <div><dt>Question</dt><dd>{item.question}</dd></div>
              <div><dt>Method</dt><dd>{item.method}</dd></div>
              <div><dt>Finding</dt><dd>{item.finding}</dd></div>
              <div><dt>Why it matters</dt><dd>{item.implication}</dd></div>
              <a className="text-link" href={item.href}>{item.linkLabel} <Arrow /></a>
            </dl>
          </article>
        ))}
      </section>

    </Shell>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className={`metric ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OutcomeBar({ label, value, secondary }) {
  return (
    <div className="outcome-row">
      <div className="outcome-label"><span>{label}</span><strong>{percent(value)}</strong></div>
      <div className="bar-track" aria-hidden="true">
        <div className={secondary ? "bar-fill secondary" : "bar-fill"} style={{ width: percent(value) }} />
      </div>
    </div>
  );
}

function ExperimentPage() {
  const [agencyCapacity, setAgencyCapacity] = useState(0.37);
  const [verificationResponse, setVerificationResponse] = useState(0.55);
  const [qualityGap, setQualityGap] = useState(0.25);
  const results = useMemo(
    () => scenarios.map((scenario) => runModel({ scenario, agencyCapacity, verificationResponse, qualityGap })),
    [agencyCapacity, verificationResponse, qualityGap],
  );
  const baseline = results[0];

  return (
    <Shell>
      <section className="page-intro experiment-intro page-shell">
        <p className="eyebrow">Open experiment · Version 1.0 · August 23, 2026</p>
        <h1>The Burden Moves</h1>
        <p className="intro-lede">
          A stylized fixed-point simulation of agent-mediated public-benefit claiming.
          The model asks what happens after agents lower the cost of applying and the
          agency responds to the resulting volume.
        </p>
        <div className="status-box">
          <strong>Evidence status</strong>
          <p>
            Theory-building artifact. Parameters are illustrative and are not
            calibrated to a specific benefit program. Outputs are not causal estimates
            or forecasts.
          </p>
        </div>
      </section>

      <section className="model-lab page-shell" aria-labelledby="lab-heading">
        <div className="control-panel">
          <div>
            <p className="eyebrow">Parameter lab</p>
            <h2 id="lab-heading">Change the institution, not only the agent.</h2>
          </div>
          <label>
            <span>Agency capacity <output>{percent(agencyCapacity)}</output></span>
            <input type="range" min="0.25" max="0.55" step="0.01" value={agencyCapacity} onChange={(event) => setAgencyCapacity(Number(event.target.value))} />
            <small>Share of the synthetic population the agency can process before verification intensifies.</small>
          </label>
          <label>
            <span>Verification response <output>{verificationResponse.toFixed(2)}</output></span>
            <input type="range" min="0" max="0.9" step="0.05" value={verificationResponse} onChange={(event) => setVerificationResponse(Number(event.target.value))} />
            <small>How sharply verification rises when application volume exceeds capacity.</small>
          </label>
          <label>
            <span>Agent-quality gap <output>{qualityGap.toFixed(2)}</output></span>
            <input type="range" min="0" max="0.5" step="0.05" value={qualityGap} onChange={(event) => setQualityGap(Number(event.target.value))} />
            <small>Difference in friction reduction and error between lower- and higher-resource users.</small>
          </label>
          <button type="button" className="reset-button" onClick={() => { setAgencyCapacity(0.37); setVerificationResponse(0.55); setQualityGap(0.25); }}>
            Reset baseline
          </button>
        </div>

        <div className="results-panel" aria-live="polite">
          {results.map((result) => (
            <article className="scenario-result" key={result.scenario}>
              <div className="scenario-title">
                <h3>{result.scenario}</h3>
                <span className={result.accessGap > baseline.accessGap ? "gap-worse" : "gap-better"}>
                  {result.scenario === "No agent"
                    ? "reference"
                    : `${Math.abs((result.accessGap - baseline.accessGap) * 100).toFixed(1)} pp ${result.accessGap > baseline.accessGap ? "wider" : "narrower"}`}
                </span>
              </div>
              <div className="outcomes">
                <OutcomeBar label="Eligible take-up · lower-resource" value={result.lowEligibleTakeUp} />
                <OutcomeBar label="Eligible take-up · higher-resource" value={result.highEligibleTakeUp} secondary />
              </div>
              <div className="metric-row">
                <Metric label="Access gap" value={percent(result.accessGap, 1)} tone={result.accessGap > baseline.accessGap ? "warning" : ""} />
                <Metric label="Verification" value={percent(result.verification, 1)} />
                <Metric label="Application volume" value={percent(result.applicationVolume, 1)} />
                <Metric label="Ineligible share" value={percent(result.falseApplicationShare, 1)} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="model-explanation page-shell">
        <div>
          <p className="eyebrow">Mechanism</p>
          <h2>The loop</h2>
        </div>
        <ol>
          <li><span>01</span><p>Agents reduce information and completion costs, but their quality and error differ across users.</p></li>
          <li><span>02</span><p>More eligible and ineligible applicants choose to submit claims.</p></li>
          <li><span>03</span><p>When volume exceeds capacity, the agency raises verification intensity.</p></li>
          <li><span>04</span><p>Verification imposes documentation costs that are larger for lower-resource applicants, changing take-up again.</p></li>
        </ol>
      </section>

      <section className="interpretation page-shell">
        <div className="section-heading">
          <p className="eyebrow">What the model contributes</p>
          <h2>Not an answer. A sharper empirical disagreement.</h2>
        </div>
        <div className="interpretation-grid">
          <article><h3>Prediction to test</h3><p>Equal, low-error assistance should improve access most when capacity is elastic or verification is targeted rather than volume-driven.</p></article>
          <article><h3>Failure mode</h3><p>When quality is stratified, better agents can produce claims that pass screening while weaker agents create new documentation demands for their users.</p></article>
          <article><h3>Design implication</h3><p>Auditing the assistant is insufficient. Evaluation must include institutional response, queueing, appeals, and the distribution of verification costs.</p></article>
          <article><h3>What would falsify it</h3><p>Stable application volume, non-responsive verification, or equal documentation costs would weaken the burden-shifting mechanism.</p></article>
        </div>
        <div className="download-row">
          <a className="primary-button" href="/data/claiming-under-agents-results.json" download>Download baseline results <Arrow /></a>
          <a className="secondary-button" href="https://github.com/bhemaraju138-pixel/bhemaraju138-pixel.github.io/tree/main/experiments">Inspect the code</a>
        </div>
      </section>
    </Shell>
  );
}

function NotePage({ note }) {
  return (
    <Shell>
      <article className="essay page-shell">
        <header className="essay-header">
          <p className="eyebrow">{note.eyebrow}</p>
          <h1>{note.title}</h1>
          <p className="essay-standfirst">{note.standfirst}</p>
        </header>
        <div className="essay-body">
          <aside>
            <strong>Research trace</strong>
            <p>These notes distinguish project period from publication date and separate observations from claims that require further testing.</p>
          </aside>
          <div>
            {note.blocks.map((block) => (
              <section key={block.heading}>
                <h2>{block.heading}</h2>
                {block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
          </div>
        </div>
        <nav className="essay-nav" aria-label="Research notes">
          <a href="/">← Back home</a>
          <a href="/research/">Place this note in the research map →</a>
        </nav>
      </article>
    </Shell>
  );
}

function TimelinePage() {
  return (
    <Shell>
      <section className="page-intro page-shell">
        <p className="eyebrow">Research timeline</p>
        <h1>How the unit of analysis kept getting larger.</h1>
        <p className="intro-lede">From reliable deployment, to human–AI fit, to public evidence systems, to institutions that strategically respond.</p>
      </section>
      <section className="timeline page-shell">
        {timeline.map((item) => (
          <article key={item.year}>
            <div className="timeline-year">{item.year}</div>
            <div><p className="eyebrow">{item.status}</p><h2>{item.title}</h2><p>{item.text}</p></div>
          </article>
        ))}
      </section>
      <section className="timeline-clarity page-shell">
        <strong>A note on dates</strong>
        <p>Work periods describe when the underlying project was conducted. The interpretive notes on this portfolio were written and published in August 2026. The new simulation is also dated August 2026.</p>
      </section>
    </Shell>
  );
}

function NotFound() {
  return (
    <Shell>
      <section className="page-intro page-shell">
        <p className="eyebrow">404</p>
        <h1>This path is not part of the evidence map.</h1>
        <a className="primary-button" href="/">Return home</a>
      </section>
    </Shell>
  );
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return <Home />;
  if (path === "/research") return <ResearchPage />;
  if (path === "/publications") return <PublicationsPage />;
  if (path === "/writing" || path === "/blogs") return <WritingPage />;
  if (path === "/about") return <AboutPage />;
  if (path === "/experiments") return <ExperimentsLanding />;
  if (path === "/experiments/claiming-under-agents") return <ExperimentPage />;
  if (path === "/timeline") return <TimelinePage />;
  const experimentMatch = path.match(/^\/experiments\/([^/]+)$/);
  if (experimentMatch) {
    const essay = publicDataEssays.find((item) => item.slug === experimentMatch[1]);
    if (essay) return <PublicDataEssayPage essay={essay} />;
  }
  const noteMatch = path.match(/^\/notes\/([^/]+)$/);
  if (noteMatch) {
    const note = notes.find((item) => item.slug === noteMatch[1]);
    if (note) return <NotePage note={note} />;
  }
  return <NotFound />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
