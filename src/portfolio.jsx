import React, { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./portfolio.css";

const DevMode = lazy(() => import("./dev-mode"));

const researchExperience = [
  {
    period: "May 2026 - Present",
    institution: "University of Oxford, Saïd Business School",
    institutionHref: "https://www.sbs.ox.ac.uk/",
    role: "Predoctoral Research Assistant",
    supervisor: {
      name: "Professor Kejia Hu",
      href: "https://www.ox.ac.uk/news/find-an-expert/dr-kejia-hu",
    },
    detail:
      "Monte Carlo studies of seven missing-data methods under MCAR, MAR, and NMAR; econometric replication and reproducibility checks across tens of thousands of regressions.",
  },
  {
    period: "May 2026 - Present",
    institution: "Generative AI Playbook for People and Culture (Wiley)",
    role: "Research Contributor",
    supervisor: {
      name: "Puneet Zohar Sachdev",
      href: "https://www.linkedin.com/in/puneetsachdevpro",
    },
    detail:
      "Developing a human-centered adoption framework and Work-Contract Map for delegation, oversight, escalation, accountability, and reliable use in sensitive workplace decisions.",
  },
  {
    period: "Sep. 2025 - Dec. 2025",
    institution: "Johns Hopkins Carey Business School",
    institutionHref: "https://carey.jhu.edu/",
    role: "Research Assistant",
    supervisor: {
      name: "Professor Harang Ju",
      href: "https://carey.jhu.edu/faculty/harang-ju-phd",
    },
    detail:
      "Designed conversational AI grounded in systemizing-empathizing theory and built a GEPA/BLOOM evaluation workflow for behavioral fidelity, prompt refinement, and user outcomes.",
  },
  {
    period: "Sep. 2025 - Dec. 2025",
    institution: "Center for Outbreak Response and Innovation",
    institutionHref: "https://cori.centerforhealthsecurity.org/who-we-are/",
    role: "Research Assistant",
    supervisor: {
      name: "Sarah Gillani",
      href: "https://publichealth.jhu.edu/faculty/4842/sarah-gillani",
    },
    detail:
      "Built an AI surveillance pipeline spanning 45 U.S. states, Canada, and Mexico, with schema guardrails, confidence thresholds, failure recovery, and human review.",
  },
  {
    period: "Oct. 2021 - Jan. 2023",
    institution: "Anil Neerukonda Institute of Technology and Sciences, India",
    institutionHref: "https://www.anits.edu.in/",
    role: "Research Assistant",
    supervisor: {
      name: "Professor Sangeeta Viswanadham",
      href: "https://www.gitam.edu/faculty/sangeeta-viswanadham",
    },
    details: [
      "Contributed to an end-to-end ResNet-152 V2 computer-vision pipeline for early plant-disease screening, processing 7,000 healthy and diseased leaf images through resizing, data augmentation, normalization, dataset splitting, deep feature extraction, and softmax classification.",
      "Evaluated the plant-detection model through separate training and validation accuracy and loss analyses, examining model behavior beyond a single aggregate performance measure.",
      "Developed a comparative evaluation workflow for heart-disease prediction in a high-stakes clinical setting, benchmarking six machine-learning methods across 14 selected patient features using accuracy, precision, recall, and F1; identified random forest as the strongest-performing approach.",
    ],
  },
  {
    period: "Jun. 2025 - Aug. 2025",
    institution: "Bloomberg Center for Public Innovation",
    institutionHref: "https://publicinnovation.jhu.edu/",
    role: "Summer Scholar",
    location: "Birmingham, Alabama",
    supervisor: {
      name: "Thomas Yuill",
      href: "https://www.birminghamal.gov/government/city-departments/office-resilience-sustainability",
    },
    detail:
      "Combined municipal, satellite, asset, location, and equity records to study street-lighting gaps and develop policy pathways with Birmingham officials.",
  },
];

const founderExperience = [
  {
    period: "Oct. 2024 - Dec. 2025",
    institution: "SwiftCollab",
    role: "Founder",
    location: "Baltimore, Maryland",
    supervisor: {
      name: "Professor Ryan Hearty",
      href: "https://engineering.jhu.edu/faculty/ryan-hearty/",
    },
    detail:
      "Founded a proactive workflow-automation platform using schema-aware tool selection, grounded API arguments, and durable Temporal workflows with monitoring and recovery.",
    note:
      "Selected for the Johns Hopkins Pava Center Summer Incubator and the Towson University Startup Accelerator.",
    images: [
      {
        src: "/images/experience/pava-center-invitation.png",
        alt: "Pava Center Summer Incubator acceptance message",
        caption: "Johns Hopkins Pava Center Summer Incubator selection",
      },
      {
        src: "/images/experience/towson-startup-cohort.jpeg",
        alt: "Towson University Startup Accelerator cohort display showing SwiftCollab",
        caption: "SwiftCollab in the Towson University Startup Accelerator cohort",
      },
    ],
  },
];

const otherExperience = [
  {
    period: "Jan. 2026 - May 2026",
    institution: "Testing Autonomy",
    role: "AI Software Development Engineer in Test (AI SDET)",
    location: "Delaware",
    detail:
      "Built LLM and RAG evaluations for evidence support, hallucinations, prompt regressions, agent tool use, and recovery behavior; added self-healing Playwright tests and continuous-integration gates.",
  },
  {
    period: "Sep. 2024 - Feb. 2025",
    institution: "Series - Agentic AI Network",
    role: "Business Development Associate",
    location: "New Haven, Connecticut",
    detail:
      "Analyzed user behavior and funnel performance, translating ambiguous drop-off patterns into focused growth recommendations.",
  },
  {
    period: "Oct. 2024 - Dec. 2024",
    institution: "Human BioSciences",
    role: "Product Strategy Consultant",
    location: "Gaithersburg, Maryland",
    supervisor: {
      name: "Ujwal Arunkumar",
      href: "https://in.linkedin.com/in/ujwal-at",
    },
    detail:
      "Synthesized stakeholder outreach and interviews across procurement, supply chain, nursing, and wound care into a prioritized market-access business case and rollout strategy.",
  },
  {
    period: "Aug. 2024 - Oct. 2024",
    institution: "The Johns Hopkins Hospital",
    institutionHref: "https://www.hopkinsmedicine.org/the-johns-hopkins-hospital",
    role: "Clinical Systems Optimization Consultant",
    location: "Baltimore, Maryland",
    supervisor: {
      name: "Ms. Brenda Nack",
      href: "https://www.linkedin.com/in/brenda-nack-80365554",
    },
    detail:
      "Converted field observations, stakeholder interviews, and workflow mapping into redesigned instrument-tracking processes, digital requisition practices, and structured staff training.",
  },
  {
    period: "Jan. 2024 - Jun. 2024",
    institution: "Contor Solutions",
    role: "Software Engineer",
    location: "Hyderabad, India",
    detail:
      "Developed production-ready features across the frontend, Flask backend, and SQL database, owning work from requirements through implementation.",
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
    devFile: "paper-tas",
    sourceCount: 23,
    review: {
      image: "/images/publications/tas-reviewer-comment.png",
      alt: "Reviewer comment describing Same Numbers, Stale Permission as an excellent paper and praising its treatment of semantic authorization and operation-scoped receipts",
    },
  },
  {
    status: "Accepted, ATRACC (AAAI Fall Symposium 2026)",
    title: "Auditing Evidence Claims in Federal High-Impact AI Exclusions",
    authors: "Hema Raju Barri and Venkateswarlu Nagineni",
    summary:
      "Audits 110 federal high-impact AI exclusion records for visible support, interpretive stability, and document-level provenance.",
    href: "/papers/auditing-evidence-claims.pdf",
    image: "/images/publications/auditing-evidence-claims.png",
    alt: "Evidence audit illustration showing records, provenance checks, and three evidence-status outcomes",
    caption: "Evidence audit from source records to supported, unresolved, and human-review-only outcomes",
    devFile: "paper-atracc",
    sourceCount: 26,
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
      "A monospaced display face whose connected letterforms follow a certified geometric rule across a compact lattice.",
    href: "https://hema-unit-distance.vercel.app",
    image: "/images/type-projects/unit-distance.png",
    devFile: "type-unit-distance",
    sourceCount: 20,
  },
  {
    title: "AxisDoctor",
    kind: "Variable-font diagnostics",
    description:
      "A local-first workbench for sampling variable-font axes and locating outline, spacing, and interpolation problems.",
    href: "https://hema-axis-doctor.vercel.app",
    image: "/images/type-projects/axis-doctor.png",
    devFile: "type-axis-doctor",
    sourceCount: 19,
  },
  {
    title: "FontFix",
    kind: "Glyph inspection",
    description:
      "A private browser workbench for inspecting outlines, control points, spacing, metrics, and variation behavior.",
    href: "https://hema-fontfix.vercel.app",
    image: "/images/type-projects/fontfix.png",
    devFile: "type-font-fix",
    sourceCount: 21,
  },
  {
    title: "RenderParity",
    kind: "Cross-platform rendering",
    description:
      "A capture-and-comparison system that traces where font rendering begins to diverge across operating systems.",
    href: "https://hema-render-parity.vercel.app",
    image: "/images/type-projects/render-parity.png",
    devFile: "type-render-parity",
    sourceCount: 20,
  },
  {
    title: "ShapeTrace",
    kind: "OpenType shaping inspection",
    description:
      "A local-first microscope that follows text through shaping and into the final positioned glyph buffer.",
    href: "https://hema-shape-trace.vercel.app",
    image: "/images/type-projects/shape-trace.png",
    devFile: "type-shape-trace",
    sourceCount: 13,
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

function Header({ onDev }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top">Hema Raju Barri</a>
      <nav aria-label="Primary navigation">
        <a href="#experience">Research</a>
        <a href="#founder-experience">Founder</a>
        <a href="#other-experience">Experience</a>
        <a href="#publications">Publications</a>
        <a href="#education">Education</a>
        <a href="#type-projects">Type projects</a>
      </nav>
      <div className="header-actions">
        <button type="button" className="mode-switch" onClick={() => onDev("workspace-readme")}>
          <span>Plain</span><i aria-hidden="true"><b /></i><span>Dev</span>
        </button>
        <a className="header-contact" href="mailto:bhemaraju.138@gmail.com">Email <Arrow /></a>
      </div>
    </header>
  );
}

function SectionHeading({ title, description, id }) {
  return (
    <header className="section-heading">
      <h2 id={id}>{title}</h2>
      {description && <p>{description}</p>}
    </header>
  );
}

function ExperienceList({ items }) {
  return (
    <div className="experience-list">
        {items.map((item) => (
          <article className={`experience-item ${item.images ? "experience-featured" : ""}`} key={item.institution}>
            <div className="item-meta">
              <p>{item.period}</p>
              <p>{item.role}</p>
              {item.location && <p>{item.location}</p>}
            </div>
            <div className="item-copy">
              <h3>
                {item.institutionHref ? (
                  <a href={item.institutionHref} target="_blank" rel="noreferrer">{item.institution}</a>
                ) : item.institution}
              </h3>
              {item.supervisor && (
                <p className="supervisor-line">
                  Supervised by <a href={item.supervisor.href} target="_blank" rel="noreferrer">{item.supervisor.name}</a>
                </p>
              )}
              {item.detail && <p>{item.detail}</p>}
              {item.details && (
                <ul className="experience-points">
                  {item.details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              )}
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
  );
}

function ExperienceSection() {
  return (
    <section className="section-shell" id="experience" aria-labelledby="experience-title">
      <SectionHeading title="Research Experience" id="experience-title" />
      <ExperienceList items={researchExperience} />
    </section>
  );
}

function OtherExperienceSection() {
  return (
    <section className="section-shell" id="other-experience" aria-labelledby="other-experience-title">
      <SectionHeading title="Other Experience" id="other-experience-title" />
      <ExperienceList items={otherExperience} />
    </section>
  );
}

function FounderExperienceSection() {
  return (
    <section className="section-shell" id="founder-experience" aria-labelledby="founder-experience-title">
      <SectionHeading title="Founder Experience" id="founder-experience-title" />
      <ExperienceList items={founderExperience} />
    </section>
  );
}

function PublicationsSection({ onOpenDev }) {
  return (
    <section className="section-shell publication-section" id="publications" aria-labelledby="publications-title">
      <SectionHeading
        title="Publications"
        id="publications-title"
        description="Five papers on reliable agents, evidence, public infrastructure, and institutional deployment."
      />
      <div className="project-list publication-list">
        {publications.map((paper) => (
          <article className="project-row publication-row" key={paper.title}>
            <div className="project-copy">
              <div className="project-index">
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
              {paper.devFile && (
                <button type="button" className="dev-entry-link" onClick={() => onOpenDev(paper.devFile)}>
                  Explore {paper.sourceCount} actual source files <span aria-hidden="true">›_</span>
                </button>
              )}
            </div>
            <figure className="project-visual paper-visual">
              <img src={paper.image} alt={paper.alt} loading="lazy" />
              <figcaption>{paper.caption}</figcaption>
            </figure>
            {paper.review && (
              <figure className="review-evidence">
                <img src={paper.review.image} alt={paper.review.alt} loading="lazy" />
              </figure>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function TypeProjectsSection({ onOpenDev }) {
  return (
    <section className="section-shell" id="type-projects" aria-labelledby="type-projects-title">
      <SectionHeading
        title="Type Design & Font Engineering"
        id="type-projects-title"
        description="Five working studies of letterform construction, variable fonts, shaping, and rendering."
      />
      <div className="project-list type-list">
        {typeProjects.map((project) => (
          <article className="project-row type-row" key={project.title}>
            <div className="project-copy">
              <div className="project-index">
                <p>{project.kind}</p>
              </div>
              <h3>{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-actions">
                <a className="project-link" href={project.href} target="_blank" rel="noreferrer">
                  Visit the project <Arrow />
                </a>
                <button type="button" className="dev-entry-link" onClick={() => onOpenDev(project.devFile)}>
                  Explore {project.sourceCount} actual source files <span aria-hidden="true">›_</span>
                </button>
              </div>
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
      <SectionHeading title="Education" id="education-title" />
      <div className="education-list">
        {education.map((item) => (
          <article key={item.institution}>
            <p>{item.period}</p>
            <h3>{item.institution}</h3>
            <p>{item.degree}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Portfolio({ onOpenDev }) {
  return (
    <>
      <Header onDev={onOpenDev} />
      <main id="top">
        <section className="hero section-shell" aria-labelledby="page-title">
          <div className="hero-title">
            <h1 className="sr-only" id="page-title">Hema Raju Barri</h1>
            <figure className="hero-portrait">
              <img src="/images/profile/hema-certificate-recognition.jpeg" alt="Hema Raju Barri holding a Johns Hopkins University Certificate of Recognition" />
              <figcaption>Johns Hopkins University Certificate of Recognition</figcaption>
            </figure>
          </div>
          <div className="hero-summary">
            <div className="hero-bio">
              <p>
                I study what makes an AI system worthy of belief: not fluency, but the evidence, infrastructure, and human judgment behind its decisions. Across Oxford, Wiley, and Johns Hopkins, my work spans statistical reproducibility, accountable workplace AI, conversational systems, outbreak surveillance, and civic data. I build systems that show not only what they concluded, but why the conclusion should survive scrutiny.
              </p>
              <p className="hero-contact">Contact: <a href="mailto:bhemaraju.138@gmail.com">bhemaraju.138@gmail.com</a></p>
            </div>
            <dl>
              <div><dt>Current</dt><dd>Predoctoral Research Assistant, University of Oxford Saïd Business School</dd></div>
            </dl>
          </div>
        </section>

        <ExperienceSection />
        <FounderExperienceSection />
        <OtherExperienceSection />
        <PublicationsSection onOpenDev={onOpenDev} />
        <EducationSection />
        <TypeProjectsSection onOpenDev={onOpenDev} />

        <section className="contact-section section-shell" aria-labelledby="contact-title">
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

function readDevRoute() {
  const match = window.location.hash.match(/^#dev\/(.+)$/);
  return match?.[1] || null;
}

function App() {
  const initialDevFile = readDevRoute();
  const [mode, setMode] = useState(initialDevFile ? "dev" : "plain");
  const [devFile, setDevFile] = useState(initialDevFile || "workspace-readme");

  useEffect(() => {
    document.body.style.overflow = mode === "dev" ? "hidden" : "";
    document.documentElement.dataset.interface = mode;
    return () => {
      document.body.style.overflow = "";
      delete document.documentElement.dataset.interface;
    };
  }, [mode]);

  const openDev = (fileId) => {
    setDevFile(fileId);
    setMode("dev");
    window.history.replaceState(null, "", `#dev/${fileId}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const openPlain = () => {
    setMode("plain");
    window.history.replaceState(null, "", "#top");
    window.setTimeout(() => document.getElementById("top")?.focus({ preventScroll: true }), 0);
  };

  if (mode === "dev") {
    return (
      <Suspense fallback={<div className="dev-loading" role="status">Opening source workspace…</div>}>
        <DevMode
          initialFileId={devFile}
          onPlain={openPlain}
          publications={publications}
          typeProjects={typeProjects}
          researchExperience={researchExperience}
        />
      </Suspense>
    );
  }

  return <Portfolio onOpenDev={openDev} />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
