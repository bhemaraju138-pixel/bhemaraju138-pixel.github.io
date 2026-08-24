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
    ["/research/", "Research"],
    ["/experiments/", "Experiments"],
    ["/timeline/", "Timeline"],
  ];

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <a className="wordmark" href="/" aria-label="Hema Raju Barri, home">
        <span>HRB</span>
        <small>Research portfolio</small>
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
        <p>AI agents · institutions · evidence · equitable access</p>
      </div>
      <div className="footer-links">
        <a href="mailto:bhemaraju.138@gmail.com">Email</a>
        <a href="https://github.com/bhemaraju138-pixel">GitHub</a>
        <a href="/research/">Research</a>
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

function Home() {
  return (
    <Shell>
      <section className="hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow">Hema Raju Barri · Information systems researcher</p>
          <h1>
            When AI becomes the claimant, <em>who rewrites the rules?</em>
          </h1>
          <p className="hero-lede">
            I study what happens when autonomous systems become counterparties to
            institutions—changing not only decisions, but the evidence,
            infrastructure, and verification rules surrounding them.
          </p>
          <div className="button-row">
            <a className="primary-button" href="/research/">
              Enter the research program <Arrow />
            </a>
            <a className="secondary-button" href="/experiments/claiming-under-agents/">
              Run the systems simulation
            </a>
          </div>
        </div>
        <aside className="hero-note">
          <span className="note-number">Thesis / 01</span>
          <p>
            The effect of an AI agent is not contained in the model. It emerges from
            the fit among the agent, the person, the task, and the institution that
            can change the rules in response.
          </p>
        </aside>
      </section>

      <section className="map-section page-shell" aria-labelledby="system-heading">
        <div className="section-heading compact-heading">
          <p className="eyebrow">The object of study</p>
          <h2 id="system-heading">One action. Four moving parts.</h2>
        </div>
        <EvidenceChain />
      </section>

      <section className="thesis-section page-shell" aria-labelledby="thesis-heading">
        <div className="section-heading">
          <p className="eyebrow">Working thesis</p>
          <h2 id="thesis-heading">The burden rarely disappears. It changes address.</h2>
        </div>
        <ol className="propositions">
          <li>
            <span>01</span>
            <h3>Interfaces govern action.</h3>
            <p>
              Schemas, permissions, and reference assets decide which tasks an agent
              can complete and which errors remain invisible.
            </p>
          </li>
          <li>
            <span>02</span>
            <h3>Institutions are not fixed endpoints.</h3>
            <p>
              As agents lower transaction costs, organizations can change screening,
              verification, sourcing, and evidence requirements.
            </p>
          </li>
          <li>
            <span>03</span>
            <h3>Distribution is a systems property.</h3>
            <p>
              Whether AI expands access depends on who has a capable agent, who can
              satisfy new burdens, and what the institution learns to reward.
            </p>
          </li>
        </ol>
      </section>

      <section className="selected-section page-shell" aria-labelledby="selected-heading">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Selected research</p>
            <h2 id="selected-heading">Findings that changed the question.</h2>
          </div>
          <a className="text-link" href="/research/">
            View the full research map <Arrow />
          </a>
        </div>
        <div className="card-grid">
          {research.slice(0, 4).map((item, index) => (
            <ResearchCard item={item} index={index} key={item.title} />
          ))}
        </div>
      </section>

      <section className="experiment-band" aria-labelledby="experiment-heading">
        <div className="page-shell experiment-band-inner">
          <div>
            <p className="eyebrow light">New open experiment · August 2026</p>
            <h2 id="experiment-heading">The Burden Moves</h2>
            <p>
              A stylized model of heterogeneous applicants, unequal agent quality,
              agency capacity, and endogenous verification. Change the assumptions;
              inspect when assistance narrows the access gap and when it widens it.
            </p>
          </div>
          <div className="experiment-mark" aria-hidden="true">
            <span>claim ↓</span>
            <span>volume ↑</span>
            <span>verify ?</span>
          </div>
          <a className="light-button" href="/experiments/claiming-under-agents/">
            Open the model <Arrow />
          </a>
        </div>
      </section>

      <section className="public-series-section page-shell" aria-labelledby="public-series-heading">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Six public-data experiments · August 2026</p>
            <h2 id="public-series-heading">Small tests of where institutional power hides.</h2>
          </div>
          <a className="text-link" href="/experiments/">
            Enter the full series <Arrow />
          </a>
        </div>
        <div className="essay-card-grid">
          {publicDataEssays.slice(0, 3).map((essay) => (
            <ExperimentEssayCard essay={essay} key={essay.slug} />
          ))}
        </div>
      </section>

      <section className="notes-section page-shell" aria-labelledby="notes-heading">
        <div className="section-heading">
          <p className="eyebrow">Research notes</p>
          <h2 id="notes-heading">Ideas with a falsifiable edge.</h2>
        </div>
        <div className="notes-list">
          {notes.map((note, index) => (
            <a href={`/notes/${note.slug}/`} className="note-row" key={note.slug}>
              <span className="note-row-number">0{index + 1}</span>
              <span>
                <strong>{note.title}</strong>
                <small>{note.eyebrow}</small>
              </span>
              <span className="row-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
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
        <p className="eyebrow">Research</p>
        <h1>A research program, not a collection of AI projects.</h1>
        <p className="intro-lede">
          These studies begin in different settings—civic data, federal sourcing,
          human–AI interaction, strategy, and municipal policy—but converge on one
          claim: autonomous systems alter the institutional conditions under which
          action becomes possible.
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

      <section className="next-questions page-shell">
        <p className="eyebrow">Questions I want a dissertation to answer</p>
        <div className="large-question">01 / When does agent assistance change take-up rather than merely shift who completes an application?</div>
        <div className="large-question">02 / Which verification responses return burden to the people agents were meant to help?</div>
        <div className="large-question">03 / What public infrastructure makes machine-mediated claims contestable, inspectable, and equally reachable?</div>
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
