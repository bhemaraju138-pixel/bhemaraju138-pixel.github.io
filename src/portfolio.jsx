import React from "react";
import { createRoot } from "react-dom/client";
import "./portfolio.css";

const researchExperience = [
  {
    period: "May 2026 - Present",
    institution: "University of Oxford, Saïd Business School",
    role: "Predoctoral Research Assistant",
    detail:
      "Monte Carlo studies of seven missing-data methods under MCAR, MAR, and NMAR; econometric replication and reproducibility checks across tens of thousands of regressions.",
  },
  {
    period: "May 2026 - Present",
    institution: "Generative AI Playbook for People and Culture (Wiley)",
    role: "Research Contributor",
    detail:
      "Developing a human-centered adoption framework and Work-Contract Map for delegation, oversight, escalation, accountability, and reliable use in sensitive workplace decisions.",
  },
  {
    period: "Jan. 2026 - May 2026",
    institution: "Testing Autonomy",
    role: "AI Software Development Engineer in Test",
    detail:
      "Built LLM and RAG evaluations for evidence support, hallucinations, and prompt regressions; tested agent tool use, recovery behavior, and continuous-integration gates.",
  },
  {
    period: "Sep. 2025 - Dec. 2025",
    institution: "Johns Hopkins Carey Business School",
    role: "Research Assistant",
    detail:
      "Designed conversational AI grounded in systemizing-empathizing theory and built a GEPA/BLOOM evaluation workflow for behavioral fidelity, prompt refinement, and user outcomes.",
  },
  {
    period: "Sep. 2025 - Dec. 2025",
    institution: "Center for Outbreak Response and Innovation",
    role: "Research Assistant",
    detail:
      "Built an AI surveillance pipeline spanning 45 U.S. states, Canada, and Mexico, with schema guardrails, confidence thresholds, failure recovery, and human review.",
  },
  {
    period: "Jun. 2025 - Aug. 2025",
    institution: "Bloomberg Center for Public Innovation",
    role: "Summer Scholar",
    detail:
      "Integrated more than 20,000 municipal, NASA Black Marble, asset, location, and equity records to identify 12 underserved corridors and deliver five policy pathways.",
  },
  {
    period: "Oct. 2024 - Dec. 2025",
    institution: "SwiftCollab",
    role: "Founder",
    detail:
      "Built a proactive workflow-automation platform for more than 50 applications using schema-aware tool selection, API argument grounding, and durable Temporal workflows with retries and monitoring.",
    note:
      "Selected for a Johns Hopkins Pava Center accelerator ($5,000) and Towson University venture funding ($10,000).",
    images: [
      {
        src: "/images/experience/pava-center-invitation.png",
        alt: "Pava Center Summer Incubator acceptance message",
        caption: "Johns Hopkins Pava Center Summer Incubator selection",
      },
      {
        src: "/images/experience/towson-startup-cohort.jpeg",
        alt: "Towson University 2026 Startup Accelerator cohort display showing SwiftCollab",
        caption: "SwiftCollab in the Towson University Startup Accelerator cohort",
      },
    ],
  },
];

const publications = [
  {
    status: "Accepted, TAS 2026 (AAAI Fall Symposium)",
    title: "Same Numbers, Stale Permission: Operation-Scoped Receipts for Statistical Agents",
    authors: "Hema Raju Barri and C. C. Peddinti",
    summary:
      "Tests operation-scoped receipts that revalidate statistical claims when measurement metadata changes between staging and release.",
    href: "/papers/same-numbers-stale-permission.pdf",
    image: "/images/publications/same-numbers-stale-permission.png",
    alt: "Bar chart from the paper comparing payload, metadata, and contract conditions",
    caption: "Figure 1 - exact accuracy, conflict acceptance, and complete-set accuracy",
  },
  {
    status: "Accepted, ATRACC (AAAI Fall Symposium 2026)",
    title: "Auditing Evidence Claims in Federal High-Impact AI Exclusions",
    authors: "Hema Raju Barri and Venkateswarlu Nagineni",
    summary:
      "Audits 110 federal high-impact AI exclusion records for visible support, interpretive stability, and document-level provenance.",
    href: "/papers/auditing-evidence-claims.pdf",
    image: "/images/publications/auditing-evidence-claims.png",
    alt: "Result table from the paper showing supported, unresolved, and human-review-only records",
    caption: "Table 1 - reconciled evidence-status partition across 110 records",
  },
  {
    status: "Accepted, INSIGHT 2026 (Springer proceedings)",
    title: "Privacy-Sensitive Generative AI Sourcing in Federal Information Systems",
    authors: "Hema Raju Barri and Chandana Charitha Peddinti",
    summary:
      "Studies how agency-maintained personal information is associated with vendor-only sourcing across 368 federal generative-AI use cases.",
    href: "/papers/privacy-sensitive-generative-ai-sourcing.pdf",
    image: "/images/publications/privacy-sensitive-sourcing.png",
    alt: "Coefficient plot from the paper showing vendor-only sourcing estimates across agency exclusions",
    caption: "Figure 2 - adjusted estimate and leave-one-agency-out comparisons",
  },
  {
    status: "Accepted, 20th ISDSI Global Conference (Dec. 2026)",
    title: "Agent-Infrastructure Fit: How AI Agents Are Redefining the Governance of Public Digital Data Infrastructure",
    authors: "Hema Raju Barri and Chandana Charitha Peddinti",
    summary:
      "Introduces agent-infrastructure fit and evaluates 810 civic-data runs across no-metadata, schema-only, and structured-infrastructure conditions.",
    href: "/papers/agent-infrastructure-fit.pdf",
    image: "/images/publications/agent-infrastructure-fit.png",
    alt: "Diagram from the paper connecting task requirements, an AI agent, public-data infrastructure, validation, and governance feedback",
    caption: "Figure 1 - agent-infrastructure fit as a governed task system",
  },
  {
    status: "Under review, AIS2C 2027 (IEEE)",
    title: "RULEBLIND-DCRT: Diagnosability-Conserving Repair Transactions for Stateful Agents",
    authors: "Rohini Arunachalam, Gnanodhay Randhi, and Hema Raju Barri",
    summary:
      "Proposes repair transactions that preserve authorized diagnostic evidence before a stateful agent performs a destructive repair.",
    href: "/papers/ruleblind-dcrt.pdf",
    image: "/images/publications/ruleblind-dcrt.png",
    alt: "Protocol diagram and recovery chart from the RULEBLIND-DCRT paper",
    caption: "Figure 1 - durable residual protocol and exact diagnosis after repair",
  },
];

const typeProjects = [
  {
    title: "Unit Distance",
    kind: "Original typeface",
    description:
      "A monospaced display typeface whose connected glyphs follow a certified unit-distance rule on a 5 by 7 lattice.",
    href: "https://hema-unit-distance.vercel.app",
    image: "/images/type-projects/unit-distance.png",
  },
  {
    title: "AxisDoctor",
    kind: "Variable-font diagnostics",
    description:
      "A local-first workbench that samples variable-font axes and identifies outline, spacing, and interpolation problems between endpoints.",
    href: "https://hema-axis-doctor.vercel.app",
    image: "/images/type-projects/axis-doctor.png",
  },
  {
    title: "FontFix",
    kind: "Glyph inspection",
    description:
      "A browser workbench for inspecting outlines, control points, spacing, metrics, and variable-font axes without uploading the font.",
    href: "https://hema-fontfix.vercel.app",
    image: "/images/type-projects/fontfix.png",
  },
  {
    title: "RenderParity",
    kind: "Cross-platform rendering",
    description:
      "A capture and comparison system that locates the first rendering layer where the same font begins to differ across operating systems.",
    href: "https://hema-render-parity.vercel.app",
    image: "/images/type-projects/render-parity.png",
  },
  {
    title: "ShapeTrace",
    kind: "OpenType shaping inspection",
    description:
      "A local-first microscope that follows text from Unicode input through HarfBuzz to the final positioned glyph buffer.",
    href: "https://hema-shape-trace.vercel.app",
    image: "/images/type-projects/shape-trace.png",
  },
];

const education = [
  {
    period: "2024 - 2025",
    institution: "Johns Hopkins University",
    degree: "Master of Science in Engineering Management",
  },
  {
    period: "Jan. 2025",
    institution: "Imperial College London",
    degree: "Winter School - Global Entrepreneurship, Security, and Data Visualization",
  },
  {
    period: "2020 - 2024",
    institution: "Anil Neerukonda Institute of Technology and Sciences",
    degree: "Bachelor of Technology in Computer Science and Engineering - First Class with Distinction",
  },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Header() {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top">Hema Raju Barri</a>
      <nav aria-label="Primary navigation">
        <a href="#experience">Research experience</a>
        <a href="#publications">Publications</a>
        <a href="#type-projects">Type projects</a>
        <a href="#education">Education</a>
      </nav>
      <a className="header-contact" href="mailto:bhemaraju.138@gmail.com">Email <Arrow /></a>
    </header>
  );
}

function SectionHeading({ number, title, description, id }) {
  return (
    <header className="section-heading">
      <span>{number}</span>
      <h2 id={id}>{title}</h2>
      {description && <p>{description}</p>}
    </header>
  );
}

function ExperienceSection() {
  return (
    <section className="section-shell" id="experience" aria-labelledby="experience-title">
      <SectionHeading number="01" title="Research Experience" id="experience-title" />
      <div className="experience-list">
        {researchExperience.map((item, index) => (
          <article className={`experience-item ${item.images ? "experience-featured" : ""}`} key={item.institution}>
            <span className="item-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="item-meta">
              <p>{item.period}</p>
              <p>{item.role}</p>
            </div>
            <div className="item-copy">
              <h3>{item.institution}</h3>
              <p>{item.detail}</p>
              {item.note && <p className="item-note">{item.note}</p>}
            </div>
            {item.images && (
              <div className="experience-media">
                {item.images.map((image) => (
                  <figure key={image.src}>
                    <img src={image.src} alt={image.alt} loading="lazy" />
                    <figcaption>{image.caption}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function PublicationsSection() {
  return (
    <section className="section-shell publication-section" id="publications" aria-labelledby="publications-title">
      <SectionHeading
        number="02"
        title="Publications"
        id="publications-title"
        description="Five papers on reliable agents, evidence, public infrastructure, and institutional deployment."
      />
      <div className="project-list publication-list">
        {publications.map((paper, index) => (
          <article className="project-row publication-row" key={paper.title}>
            <div className="project-copy">
              <div className="project-index">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>Research paper</p>
              </div>
              <h3>{paper.title}</h3>
              <p className="authors">
                {paper.authors.split("Hema Raju Barri").map((part, partIndex, parts) => (
                  <React.Fragment key={`${paper.title}-${partIndex}`}>
                    {part}
                    {partIndex < parts.length - 1 && <strong>Hema Raju Barri</strong>}
                  </React.Fragment>
                ))}
              </p>
              <p className="publication-meta">
                <span>{paper.status},</span>{" "}
                <a href={paper.href} target="_blank" rel="noreferrer">Paper</a>
              </p>
              <p className="project-description">{paper.summary}</p>
            </div>
            <figure className="project-visual paper-visual">
              <img src={paper.image} alt={paper.alt} loading="lazy" />
              <figcaption>{paper.caption}</figcaption>
            </figure>
          </article>
        ))}
      </div>
    </section>
  );
}

function TypeProjectsSection() {
  return (
    <section className="section-shell" id="type-projects" aria-labelledby="type-projects-title">
      <SectionHeading
        number="03"
        title="Type Design & Font Engineering"
        id="type-projects-title"
        description="Five working studies of letterform construction, variable fonts, shaping, and rendering."
      />
      <div className="project-list type-list">
        {typeProjects.map((project, index) => (
          <article className="project-row type-row" key={project.title}>
            <div className="project-copy">
              <div className="project-index">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{project.kind}</p>
              </div>
              <h3>{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <a className="project-link" href={project.href} target="_blank" rel="noreferrer">
                Visit the project <Arrow />
              </a>
            </div>
            <a className="project-visual type-visual" href={project.href} target="_blank" rel="noreferrer" aria-label={`Open ${project.title}`}>
              <img src={project.image} alt={`${project.title} interface`} loading="lazy" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function EducationSection() {
  return (
    <section className="section-shell education-section" id="education" aria-labelledby="education-title">
      <SectionHeading number="04" title="Education" id="education-title" />
      <div className="education-list">
        {education.map((item, index) => (
          <article key={item.institution}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item.period}</p>
            <h3>{item.institution}</h3>
            <p>{item.degree}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Portfolio() {
  return (
    <>
      <Header />
      <main id="top">
        <section className="hero section-shell" aria-labelledby="page-title">
          <div className="hero-title">
            <p>Researcher and systems builder</p>
            <h1 id="page-title">Hema Raju Barri</h1>
          </div>
          <div className="hero-summary">
            <p>
              I study how AI systems interact with evidence, public infrastructure, and organizational decisions. My work combines empirical research, system evaluation, and applied engineering.
            </p>
            <dl>
              <div><dt>Current</dt><dd>Predoctoral Research Assistant, University of Oxford Saïd Business School</dd></div>
              <div><dt>Methods</dt><dd>Experiments, econometrics, simulations, mixed methods, and systems engineering</dd></div>
            </dl>
          </div>
        </section>

        <ExperienceSection />
        <PublicationsSection />
        <TypeProjectsSection />
        <EducationSection />

        <section className="contact-section section-shell" aria-labelledby="contact-title">
          <span>05</span>
          <div>
            <h2 id="contact-title">Contact</h2>
            <p>For research, collaboration, or speaking inquiries:</p>
            <a href="mailto:bhemaraju.138@gmail.com">bhemaraju.138@gmail.com <Arrow /></a>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <p>Hema Raju Barri</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Portfolio />
  </React.StrictMode>,
);
