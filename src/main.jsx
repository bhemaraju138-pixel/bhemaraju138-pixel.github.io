import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { notes, publicDataEssays, research, timeline } from "./content";
import { runModel, scenarios } from "./model";
import { runObservabilityReserve, runVerificationQueue, simulationCatalog } from "./simulations";
import "@vscode/codicons/dist/codicon.css";
import "./styles.css";

const percent = (value, digits = 0) => `${(value * 100).toFixed(digits)}%`;

const commandRoutes = {
  about: "/",
  home: "/",
  profile: "/",
  research: "/research/",
  publications: "/publications/",
  papers: "/publications/",
  blogs: "/blogs/",
  writing: "/blogs/",
  simulations: "/simulations/",
  timeline: "/timeline/",
};

const simulationRoutes = {
  burden: "/simulations/burden-moves/",
  observability: "/simulations/observability-reserve/",
  queue: "/simulations/verification-queue/",
};

const LOCAL_MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const PORTFOLIO_CONTEXT = `
You are the local research guide inside Hema Raju Barri's portfolio. Answer only
from the context below. Be concise, distinguish completed work from research
questions, and say when the portfolio does not contain an answer.

Hema studies the systems around intelligent systems at the intersection of AI,
management, economics, and public institutions. The recurring concern is how
agents change access, evidence, verification, and institutional response.

Trajectory and experience:
- Computer-science training at ANITS (BTech, 2020-2024), followed by an MSE in
  Engineering Management at Johns Hopkins University (2024-2025) and an Imperial
  College London winter school in 2025.
- Research Assistant at Oxford Saïd from 2026, working on missing-data
  sensitivity, econometric replication, and reproducible simulation infrastructure.
- AI SDET at Testing Autonomy from 2026, building evaluation pipelines for LLM,
  RAG, and agentic workflows, including grounding and failure recovery.
- Research Assistant at Johns Hopkins Carey in 2025 on a controlled human-AI
  study of empathizing and systemizing conversational behavior.
- Research Assistant at the Center for Outbreak Response Innovation in 2025 on
  public-health data collection with provenance, validation, and human review.
- Strategy Analyst with the Birmingham Mayor's Office and Bloomberg Center in
  2025 on municipal evidence integration, streetlighting policy, and implementation.
- AI Engineer at SwiftCollab in 2024-2025 on schema-aware agent workflows,
  monitoring, durable execution, and recovery across external applications.

Selected work:
- Agent-Infrastructure Fit: How AI Agents Are Redefining the Governance of Public
  Digital Data Infrastructure. Coauthored paper; abstract accepted for the 20th
  ISDSI Global Conference at IMT Hyderabad, with the presentation upcoming in
  December 2026.
- Privacy-Sensitive Generative AI Sourcing in Federal Information Systems.
  Coauthored empirical paper; accepted and presented at INSIGHT 2026.
- Keeping Strategic Futures Observable in AI Strategy: Counterfactual
  Observability and Evidence Architecture under Radical Uncertainty.
  Sole-authored SSRN preprint, April 2026.

The portfolio also contains public-data experiments and three technical
simulations: Burden Moves, Observability Reserve, and Verification Queue.
Visitors can inspect the Research, Publications, Blogs, Simulations, and About
files for the full evidence and caveats.
`;

function Icon({ name }) {
  return <i className={`codicon codicon-${name}`} aria-hidden="true" />;
}

function readWorkspaceSetting(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function ModeSwitch({ mode, onChange }) {
  return (
    <div className="mode-switch" role="group" aria-label="Portfolio interface mode">
      <button type="button" className={mode === "reader" ? "active" : ""} aria-pressed={mode === "reader"} onClick={() => onChange("reader")}>Read</button>
      <button type="button" className={mode === "command" ? "active" : ""} aria-pressed={mode === "command"} onClick={() => onChange("command")}>Command</button>
    </div>
  );
}

function ReaderHeader({ mode, onModeChange }) {
  const path = window.location.pathname;
  const links = [
    ["/publications/", "Publications"],
    ["/blogs/", "Blogs"],
    ["/simulations/", "Simulations"],
    ["/about/", "About"],
  ];

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <a className="wordmark" href="/" aria-label="Hema Raju Barri, home"><span>Hema Raju Barri</span></a>
      <nav aria-label="Primary navigation">
        {links.map(([href, label]) => (
          <a href={href} key={href} aria-current={path.startsWith(href) || (href === "/about/" && path === "/") ? "page" : undefined}>{label}</a>
        ))}
      </nav>
      <div className="header-actions">
        <ModeSwitch mode={mode} onChange={onModeChange} />
        <a className="contact-link" href="mailto:bhemaraju.138@gmail.com">Contact <Arrow /></a>
      </div>
    </header>
  );
}

function ReaderFooter() {
  return (
    <footer className="site-footer">
      <div><strong>Hema Raju Barri</strong><p>Researcher · systems builder · public-interest technologist</p></div>
      <div className="footer-links">
        <a href="mailto:bhemaraju.138@gmail.com">Email</a>
        <a href="/publications/">Publications</a>
        <a href="/blogs/">Blogs</a>
        <a href="/simulations/">Simulations</a>
        <a href="/about/">About</a>
      </div>
      <p className="date-note">Historical project dates mark when work was conducted. Portfolio notes were published in August 2026 unless otherwise stated.</p>
    </footer>
  );
}

function CommandConsole({ onModeChange, onOpenLLM, onPanelChange, onCommand }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    { kind: "system", text: "HRB research interface ready." },
    { kind: "system", text: "Type help or choose a command." },
  ]);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleShortcut = (event) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
      if ((event.key === "/" && !isTyping) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") {
        setInput("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const write = (command, response) => {
    setHistory((current) => [...current.slice(-7), { kind: "command", text: command }, { kind: "system", text: response }]);
  };

  const navigate = (command, href) => {
    write(command, `Opening ${href}`);
    window.setTimeout(() => window.location.assign(href), 120);
  };

  const runCommand = (rawValue) => {
    const raw = rawValue.trim();
    if (!raw) return;
    const normalized = raw.toLowerCase().replace(/^open\s+/, "").replace(/^cd\s+/, "");
    onCommand(raw);

    if (normalized === "clear") {
      setHistory([]);
      setInput("");
      return;
    }
    if (normalized === "help" || normalized === "?") {
      write(raw, "about · research · publications · blogs · simulations · timeline · llm · panel terminal|output|problems|debug · run burden|observability|queue · connect · scatter · whoami · status · contact · read · clear");
    } else if (normalized === "ls") {
      write(raw, "about/  research/  publications/  blogs/  simulations/  timeline/");
    } else if (normalized === "whoami") {
      write(raw, "Hema Raju Barri: researcher, systems builder, and public-interest technologist studying the institutions around intelligent systems.");
    } else if (normalized === "status") {
      write(raw, `route=${window.location.pathname}  interface=HRB_OS  focus=AI+management+public institutions`);
    } else if (normalized === "read" || normalized === "reader" || normalized === "mode read") {
      write(raw, "Returning to Read mode.");
      window.setTimeout(() => onModeChange("reader"), 120);
    } else if (normalized === "llm" || normalized === "chat" || normalized === "extensions") {
      onOpenLLM();
      write(raw, "Opening the local research model. Load it explicitly when you are ready.");
    } else if (normalized.startsWith("panel ")) {
      const target = normalized.replace("panel ", "").replace("debug console", "debug");
      if (["terminal", "output", "problems", "debug"].includes(target)) {
        onPanelChange(target);
        write(raw, `Panel switched to ${target}.`);
      } else {
        write(raw, "Panel not found. Try: panel terminal, output, problems, or debug.");
      }
    } else if (normalized === "connect" || normalized === "connect path") {
      if (window.location.pathname === "/" || window.location.pathname === "/about/") {
        window.dispatchEvent(new CustomEvent("portfolio:path", { detail: { connected: true } }));
        write(raw, "Path connected. Five moments now resolve into one trajectory.");
      } else {
        navigate(raw, "/?run=connect");
      }
    } else if (normalized === "scatter" || normalized === "scatter path") {
      if (window.location.pathname === "/" || window.location.pathname === "/about/") {
        window.dispatchEvent(new CustomEvent("portfolio:path", { detail: { connected: false } }));
        write(raw, "Path released into its component moments.");
      } else {
        navigate(raw, "/");
      }
    } else if (normalized === "email" || normalized === "contact") {
      write(raw, "Opening a new email to Hema.");
      window.setTimeout(() => { window.location.href = "mailto:bhemaraju.138@gmail.com"; }, 120);
    } else if (normalized.startsWith("run ") || normalized.startsWith("simulate ")) {
      const target = normalized.replace(/^(run|simulate)\s+/, "").trim();
      if (simulationRoutes[target]) navigate(raw, simulationRoutes[target]);
      else write(raw, "Simulation not found. Try: run burden, run observability, or run queue.");
    } else if (commandRoutes[normalized]) {
      navigate(raw, commandRoutes[normalized]);
    } else {
      write(raw, `Command not found: ${raw}. Type help to inspect the interface.`);
    }
    setInput("");
  };

  const quickCommands = ["help", "about", "research", "publications", "simulations", "llm", "read"];

  return (
    <aside className="command-console" aria-label="Portfolio command interface">
      <div className="command-console-body">
        <div className="command-history" aria-live="polite">
          {history.slice(-5).map((entry, index) => (
            <p className={`command-line ${entry.kind}`} key={`${entry.text}-${index}`}>
              <span aria-hidden="true">{entry.kind === "command" ? "$" : "::"}</span>{entry.text}
            </p>
          ))}
        </div>
        <form className="command-form" onSubmit={(event) => { event.preventDefault(); runCommand(input); }}>
          <label htmlFor="portfolio-command">hema@portfolio:~$</label>
          <input
            id="portfolio-command"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoComplete="off"
            spellCheck="false"
            placeholder="type a command"
          />
          <button type="submit">RUN</button>
        </form>
        <div className="command-shortcuts" aria-label="Suggested commands">
          {quickCommands.map((command) => <button type="button" key={command} onClick={() => runCommand(command)}>{command}</button>)}
        </div>
      </div>
    </aside>
  );
}

function editorFileForPath(path) {
  if (path === "/" || path.startsWith("/about")) return "about.md";
  if (path.startsWith("/publications")) return "publications.md";
  if (path.startsWith("/blogs") || path.startsWith("/writing")) return "blogs.index";
  if (path === "/simulations/" || path === "/simulations") return "simulations.run";
  if (path.includes("burden-moves")) return "burden_moves.sim";
  if (path.includes("observability-reserve")) return "observability_reserve.sim";
  if (path.includes("verification-queue")) return "verification_queue.sim";
  if (path.startsWith("/research")) return "research.md";
  if (path.startsWith("/timeline")) return "timeline.log";
  if (path.startsWith("/experiments/")) return `${path.split("/").filter(Boolean).at(-1)}.experiment`;
  if (path.startsWith("/notes/")) return `${path.split("/").filter(Boolean).at(-1)}.note`;
  return "not_found.log";
}

const WORKSPACE_FILES = [
  ["/", "about.md"],
  ["/research/", "research.md"],
  ["/publications/", "publications.md"],
  ["/blogs/", "blogs.index"],
  ["/simulations/", "simulations.run"],
  ["/simulations/burden-moves/", "burden_moves.sim"],
  ["/simulations/observability-reserve/", "observability_reserve.sim"],
  ["/simulations/verification-queue/", "verification_queue.sim"],
  ["/timeline/", "timeline.log"],
];

function iconForFile(file) {
  if (file.endsWith(".run") || file.endsWith(".sim")) return "play";
  if (file.endsWith(".log")) return "output";
  if (file.endsWith(".index")) return "list-tree";
  return "markdown";
}

function ExtensionsSidebar({ onOpenLLM }) {
  const [query, setQuery] = useState("");
  const matches = "local research llm qwen webllm private browser ai chat".includes(query.trim().toLowerCase());

  return (
    <aside className="ide-explorer ide-extensions" aria-label="Research extensions">
      <div className="ide-pane-title"><strong>EXTENSIONS</strong><button type="button" aria-label="Open local research LLM" title="Open Local Research LLM" onClick={onOpenLLM}><Icon name="sparkle" /></button></div>
      <label className="ide-extension-search">
        <span className="sr-only">Search research extensions</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Extensions" />
      </label>
      <p className="ide-extension-section"><Icon name="chevron-down" /> LOCAL</p>
      {matches ? (
        <article className="ide-extension-card">
          <div className="ide-extension-mark" aria-hidden="true"><Icon name="sparkle" /></div>
          <div>
            <h2>Local Research LLM</h2>
            <p>Qwen 2.5 · 0.5B Instruct</p>
            <small>WebGPU · Apache 2.0 · no API key</small>
            <button type="button" onClick={onOpenLLM}>Open</button>
          </div>
        </article>
      ) : <p className="ide-extension-empty">No local extension matches “{query}”.</p>}
      <div className="ide-extension-note">
        <Icon name="info" />
        <p>Model weights are downloaded only after you choose <strong>Load model</strong>.</p>
      </div>
    </aside>
  );
}

function SearchSidebar() {
  const [query, setQuery] = useState("");
  const documents = [
    { href: "/", file: "about.md", text: "Hema Raju Barri computer science engineering management researcher builder systems around intelligent systems Oxford Johns Hopkins Birmingham" },
    { href: "/research/", file: "research.md", text: research.map((item) => `${item.title} ${item.question} ${item.method} ${item.finding}`).join(" ") },
    { href: "/publications/", file: "publications.md", text: research.slice(0, 3).map((item) => `${item.title} ${item.type} ${item.venue}`).join(" ") },
    { href: "/blogs/", file: "blogs.index", text: [...notes, ...publicDataEssays].map((item) => `${item.title} ${item.standfirst}`).join(" ") },
    { href: "/simulations/", file: "simulations.run", text: simulationCatalog.map((item) => `${item.title} ${item.question} ${item.mathematics}`).join(" ") },
    { href: "/timeline/", file: "timeline.log", text: "research experience education Oxford Saïd Testing Autonomy Johns Hopkins CORI Birmingham SwiftCollab" },
  ];
  const normalized = query.trim().toLowerCase();
  const matches = normalized ? documents.filter((item) => `${item.file} ${item.text}`.toLowerCase().includes(normalized)) : [];

  return (
    <aside className="ide-explorer ide-search-sidebar" aria-label="Search portfolio">
      <div className="ide-pane-title"><strong>SEARCH</strong><span>{matches.length || ""}</span></div>
      <form onSubmit={(event) => event.preventDefault()}>
        <label><span className="sr-only">Search the portfolio</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></label>
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" title="Clear Search"><Icon name="close" /></button>}
      </form>
      {!normalized && <div className="ide-sidebar-empty"><Icon name="search" /><p>Search across research, publications, blogs, simulations, and experience.</p><small>Try “verification”, “Oxford”, or “infrastructure”.</small></div>}
      {normalized && !matches.length && <div className="ide-sidebar-empty"><Icon name="search-stop" /><p>No results found.</p><small>Try a broader research term.</small></div>}
      {matches.length > 0 && <div className="ide-search-results">
        <p><Icon name="chevron-down" /> HRB_PORTFOLIO <span>{matches.length}</span></p>
        {matches.map((item) => <a href={item.href} key={item.href}><Icon name={iconForFile(item.file)} /><span><strong>{item.file}</strong><small>{item.text.slice(0, 92)}…</small></span></a>)}
      </div>}
    </aside>
  );
}

function SourceControlSidebar() {
  const [checkedAt, setCheckedAt] = useState("just now");
  return (
    <aside className="ide-explorer ide-source-sidebar" aria-label="Source control">
      <div className="ide-pane-title"><strong>SOURCE CONTROL</strong><button type="button" aria-label="Refresh source status" title="Refresh" onClick={() => setCheckedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}><Icon name="refresh" /></button></div>
      <div className="ide-source-branch"><Icon name="git-branch" /><span><strong>main</strong><small>Published snapshot · checked {checkedAt}</small></span></div>
      <div className="ide-source-clean"><Icon name="check-all" /><strong>No pending changes</strong><p>The live portfolio matches its published source state.</p></div>
      <div className="ide-tree-spacer" />
      <a className="ide-source-link" href="https://github.com/bhemaraju138-pixel/bhemaraju138-pixel.github.io" target="_blank" rel="noreferrer"><Icon name="github" /> Open repository <Icon name="link-external" /></a>
    </aside>
  );
}

function RunSidebar({ activeFile }) {
  const [configuration, setConfiguration] = useState(() => {
    if (activeFile.includes("burden")) return "burden";
    if (activeFile.includes("observability")) return "observability";
    if (activeFile.includes("verification")) return "queue";
    return "burden";
  });
  const routes = {
    burden: "/simulations/burden-moves/",
    observability: "/simulations/observability-reserve/",
    queue: "/simulations/verification-queue/",
  };
  return (
    <aside className="ide-explorer ide-run-sidebar" aria-label="Run and debug simulations">
      <div className="ide-pane-title"><strong>RUN AND DEBUG</strong><Icon name="debug-alt" /></div>
      <div className="ide-run-config">
        <label><span>Configuration</span><select value={configuration} onChange={(event) => setConfiguration(event.target.value)}><option value="burden">Burden Moves</option><option value="observability">Observability Reserve</option><option value="queue">Verification Queue</option></select></label>
        <button type="button" onClick={() => window.location.assign(routes[configuration])}><Icon name="debug-start" /> Run simulation</button>
      </div>
      <p className="ide-extension-section"><Icon name="chevron-down" /> SIMULATIONS</p>
      <div className="ide-run-list">
        {simulationCatalog.map((item, index) => {
          const href = Object.values(routes)[index];
          return <a href={href} key={item.title}><Icon name="play-circle" /><span><strong>{item.title}</strong><small>{item.family}</small></span></a>;
        })}
      </div>
      <div className="ide-extension-note"><Icon name="info" /><p>Each run opens an interactive model with adjustable parameters, equations, assumptions, and stability conditions.</p></div>
    </aside>
  );
}

function ResearchContext({ path, activeFile }) {
  return (
    <div className="ide-inspector-body">
      <p className="ide-inspector-label">ACTIVE QUESTION</p>
      <h2>Who gets to write the next page?</h2>
      <p>I study how intelligent systems change evidence, access, verification, and institutional response.</p>
      <dl>
        <div><dt>ROUTE</dt><dd>{path}</dd></div>
        <div><dt>FILE</dt><dd>{activeFile}</dd></div>
        <div><dt>METHODS</dt><dd>experiments · econometrics · simulation · systems</dd></div>
      </dl>
      <div className="ide-command-reference">
        <span>TRY IN TERMINAL</span>
        <code>help</code><code>publications</code><code>run queue</code><code>llm</code><code>read</code>
      </div>
    </div>
  );
}

function LocalLLMPanel() {
  const initialMessage = {
    id: "welcome",
    role: "assistant",
    content: "Ask me about Hema's research, publications, simulations, or intellectual trajectory. I answer from a compact portfolio context loaded with the model.",
  };
  const [messages, setMessages] = useState([initialMessage]);
  const [draft, setDraft] = useState("");
  const [loadState, setLoadState] = useState("idle");
  const [loadLabel, setLoadLabel] = useState("Not loaded");
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const engineRef = useRef(null);
  const transcriptRef = useRef(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loadLabel]);

  const loadModel = async () => {
    if (engineRef.current || loadState === "loading") return;
    if (!("gpu" in navigator)) {
      setLoadState("unsupported");
      setLoadLabel("WebGPU is unavailable in this browser");
      return;
    }

    setLoadState("loading");
    setLoadLabel("Preparing the local runtime");
    setProgress(0);
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      const engine = await CreateMLCEngine(LOCAL_MODEL_ID, {
        initProgressCallback: (report) => {
          const nextProgress = Number.isFinite(report.progress) ? report.progress : 0;
          setProgress(nextProgress);
          setLoadLabel(report.text || "Loading model files");
        },
      });
      engineRef.current = engine;
      setProgress(1);
      setLoadLabel("Ready on this device");
      setLoadState("ready");
    } catch (error) {
      setLoadState("error");
      setLoadLabel(error instanceof Error ? error.message : "The local model could not be loaded");
    }
  };

  const submitPrompt = async (event) => {
    event.preventDefault();
    const prompt = draft.trim();
    if (!prompt || isGenerating) return;
    if (!engineRef.current) {
      setLoadLabel("Load the model before starting a chat");
      return;
    }

    const userEntry = { id: `user-${Date.now()}`, role: "user", content: prompt };
    const assistantId = `assistant-${Date.now()}`;
    const conversation = [...messages.filter((message) => message.id !== "welcome"), userEntry]
      .map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userEntry, { id: assistantId, role: "assistant", content: "" }]);
    setDraft("");
    setIsGenerating(true);

    try {
      const stream = await engineRef.current.chat.completions.create({
        messages: [{ role: "system", content: PORTFOLIO_CONTEXT }, ...conversation],
        temperature: 0.3,
        max_tokens: 420,
        stream: true,
      });
      let response = "";
      for await (const chunk of stream) {
        response += chunk.choices[0]?.delta?.content || "";
        setMessages((current) => current.map((message) => (
          message.id === assistantId ? { ...message, content: response } : message
        )));
      }
      if (!response) {
        setMessages((current) => current.map((message) => (
          message.id === assistantId ? { ...message, content: "I could not form a response. Try a shorter, more specific question." } : message
        )));
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Generation failed";
      setMessages((current) => current.map((message) => (
        message.id === assistantId ? { ...message, content: `The local runtime stopped: ${detail}` } : message
      )));
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([initialMessage]);
    setDraft("");
  };

  return (
    <div className="local-llm-panel">
      <div className="local-llm-hero">
        <div className="local-llm-logo"><Icon name="sparkle" /></div>
        <div>
          <p>LOCAL RESEARCH LLM</p>
          <h2>Qwen 2.5 · 0.5B</h2>
          <span>Runs in this browser with WebLLM</span>
        </div>
        <button type="button" className="icon-button" aria-label="Clear chat" title="Clear chat" onClick={clearChat}><Icon name="trash" /></button>
      </div>

      <div className={`local-model-state ${loadState}`}>
        <div className="local-model-state-line"><span>{loadLabel}</span><strong>{loadState === "loading" ? `${Math.round(progress * 100)}%` : loadState === "ready" ? "LOCAL" : ""}</strong></div>
        <div className="local-model-progress" aria-hidden="true"><span style={{ width: `${Math.max(2, progress * 100)}%` }} /></div>
        <button type="button" onClick={loadModel} disabled={loadState === "loading" || loadState === "ready"}>
          <Icon name={loadState === "ready" ? "check" : "cloud-download"} />
          {loadState === "ready" ? "Model ready" : loadState === "loading" ? "Loading model" : "Load model"}
        </button>
        <small>A substantial first-time download is cached by your browser. Inference stays on your device; no API key or server chat log.</small>
      </div>

      <div className="local-llm-transcript" ref={transcriptRef} aria-live="polite">
        {messages.map((message) => (
          <article className={`local-message ${message.role}`} key={message.id}>
            <div><Icon name={message.role === "user" ? "account" : "sparkle"} /></div>
            <p>{message.content || (isGenerating ? "Thinking…" : "")}</p>
          </article>
        ))}
      </div>

      <form className="local-llm-composer" onSubmit={submitPrompt}>
        <label htmlFor="local-llm-prompt">Ask the portfolio</label>
        <div>
          <textarea
            id="local-llm-prompt"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={loadState !== "ready" || isGenerating}
            placeholder={loadState === "ready" ? "Ask about the research…" : "Load the model to begin"}
            rows="3"
          />
          <button type="submit" disabled={loadState !== "ready" || isGenerating || !draft.trim()} aria-label="Send message"><Icon name="send" /></button>
        </div>
      </form>

      <p className="local-llm-credits">
        Experimental, compact, and fallible. <a href="https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct" target="_blank" rel="noreferrer">Model</a> · <a href="https://github.com/mlc-ai/web-llm" target="_blank" rel="noreferrer">WebLLM</a>
      </p>
    </div>
  );
}

function QuickOpen({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const matches = WORKSPACE_FILES.filter(([, file]) => file.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  const select = (href) => {
    onClose();
    window.location.assign(href);
  };

  return (
    <div className="ide-quick-open-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="ide-quick-open" role="dialog" aria-modal="true" aria-label="Quick Open">
        <label>
          <span className="sr-only">Search files by name</span>
          <Icon name="search" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches[0]) select(matches[0][0]);
              if (event.key === "Escape") onClose();
            }}
            placeholder="Search files by name"
          />
          <kbd>esc</kbd>
        </label>
        <p>recently opened</p>
        <div className="ide-quick-results">
          {matches.map(([href, file], index) => (
            <button type="button" className={index === 0 ? "selected" : ""} key={href} onClick={() => select(href)}>
              <Icon name={iconForFile(file)} />
              <span><strong>{file}</strong><small>HRB_PORTFOLIO{href}</small></span>
            </button>
          ))}
          {!matches.length && <span className="ide-quick-empty">No matching files</span>}
        </div>
      </section>
    </div>
  );
}

function OutputPanel({ entries, onClear }) {
  const [channel, setChannel] = useState("portfolio");
  const visibleEntries = channel === "research" ? entries.filter((entry) => entry.id === "index") : entries;
  return (
    <div className="ide-output-panel">
      <div className="ide-panel-toolbar">
        <label><span className="sr-only">Output channel</span><select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="portfolio">HRB Portfolio</option><option value="research">Research Index</option></select></label>
        <button type="button" aria-label="Clear output" title="Clear Output" onClick={onClear}><Icon name="clear-all" /></button>
      </div>
      <div className="ide-output-lines" aria-live="polite">
        {visibleEntries.length ? visibleEntries.map((entry) => <p key={entry.id}><span>[{entry.time}]</span> {entry.text}</p>) : <p><span>[output]</span> Channel cleared.</p>}
      </div>
    </div>
  );
}

function ProblemsPanel() {
  const [filter, setFilter] = useState("");
  const summary = "No errors or warnings are recorded in this published workspace.";
  const visible = summary.toLowerCase().includes(filter.trim().toLowerCase());
  return (
    <div className="ide-problems-panel">
      <div className="ide-panel-toolbar">
        <label className="ide-problem-filter"><Icon name="filter" /><span className="sr-only">Filter problems</span><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter (e.g. text, file)" /></label>
        <span><Icon name="error" /> 0</span><span><Icon name="warning" /> 0</span>
      </div>
      {visible ? (
        <div className="ide-empty-state"><Icon name="check-all" /><strong>No problems detected</strong><p>{summary}</p><small>Methods, uncertainty, and publication-status caveats remain visible inside the research files rather than being treated as software errors.</small></div>
      ) : <div className="ide-empty-state"><Icon name="search-stop" /><strong>No filtered results</strong></div>}
    </div>
  );
}

function DebugConsole({ path, activeFile }) {
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([
    { id: "debug-ready", kind: "result", text: "Research debug session ready. Type help to inspect available expressions." },
  ]);

  const values = {
    route: path,
    file: activeFile,
    "research.length": research.length,
    "publications.length": research.slice(0, 3).length,
    "blogs.length": publicDataEssays.length + notes.length,
    "simulations.length": simulationCatalog.length,
    "research[0].title": research[0]?.title,
    "simulation[0].family": simulationCatalog[0]?.family,
  };

  const runExpression = (event) => {
    event.preventDefault();
    const raw = expression.trim();
    if (!raw) return;
    if (raw.toLowerCase() === "clear") {
      setHistory([]);
      setExpression("");
      return;
    }
    let result;
    if (raw.toLowerCase() === "help") result = Object.keys(values).join(" · ") + " · clear";
    else if (Object.hasOwn(values, raw)) result = typeof values[raw] === "string" ? values[raw] : JSON.stringify(values[raw]);
    else result = `ReferenceError: ${raw} is not exposed in this read-only research session.`;
    setHistory((current) => [...current.slice(-9), { id: `input-${Date.now()}`, kind: "input", text: raw }, { id: `result-${Date.now()}`, kind: "result", text: result }]);
    setExpression("");
  };

  return (
    <div className="ide-debug-console">
      <div className="ide-debug-history" aria-live="polite">
        {history.map((entry) => <p className={entry.kind} key={entry.id}><Icon name={entry.kind === "input" ? "chevron-right" : "debug-console"} />{entry.text}</p>)}
      </div>
      <form onSubmit={runExpression}>
        <Icon name="chevron-right" />
        <input value={expression} onChange={(event) => setExpression(event.target.value)} placeholder="Evaluate a workspace expression" spellCheck="false" />
      </form>
    </div>
  );
}

function CommandWorkspace({ children, onModeChange }) {
  const path = window.location.pathname;
  const activeFile = editorFileForPath(path);
  const [activeSidebar, setActiveSidebar] = useState("explorer");
  const [rightPanel, setRightPanel] = useState("context");
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (window.innerWidth <= 860) return false;
    const stored = readWorkspaceSetting("hrb-sidebar");
    return stored ? stored !== "hidden" : true;
  });
  const [inspectorVisible, setInspectorVisible] = useState(() => {
    if (window.innerWidth <= 1240) return false;
    const stored = readWorkspaceSetting("hrb-inspector");
    return stored ? stored !== "hidden" : true;
  });
  const [panelVisible, setPanelVisible] = useState(() => {
    if (window.innerWidth <= 680) return false;
    const stored = readWorkspaceSetting("hrb-panel");
    return stored ? stored !== "hidden" : true;
  });
  const [panelMaximized, setPanelMaximized] = useState(false);
  const [panelTab, setPanelTab] = useState("terminal");
  const [quickOpen, setQuickOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(readWorkspaceSetting("hrb-sidebar-width")) || 250);
  const [inspectorWidth, setInspectorWidth] = useState(() => Number(readWorkspaceSetting("hrb-inspector-width")) || 360);
  const [panelHeight, setPanelHeight] = useState(() => Number(readWorkspaceSetting("hrb-panel-height")) || 210);
  const [treeOpen, setTreeOpen] = useState({ editors: true, portfolio: true, outline: false, evidence: false });
  const [outputEntries, setOutputEntries] = useState(() => [
    { id: "boot", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), text: `Workspace opened ${activeFile} at ${path}` },
    { id: "index", time: "index", text: `${research.length} research records · ${publicDataEssays.length + notes.length} blogs and notes · ${simulationCatalog.length} simulations indexed` },
  ]);

  const setPanel = (nextPanel) => {
    setPanelTab(nextPanel);
    setPanelVisible(true);
  };

  const addOutput = (command) => {
    setOutputEntries((current) => [...current.slice(-29), {
      id: `${Date.now()}-${command}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      text: `terminal executed: ${command}`,
    }]);
  };

  const selectSidebar = (sidebar) => {
    if (activeSidebar === sidebar && sidebarVisible) {
      setSidebarVisible(false);
      return;
    }
    setActiveSidebar(sidebar);
    setSidebarVisible(true);
  };

  const fitWorkbench = () => {
    setSidebarWidth(250);
    setInspectorWidth(360);
    setPanelHeight(210);
    setSidebarVisible(window.innerWidth > 860);
    setInspectorVisible(window.innerWidth > 1240);
    setPanelVisible(window.innerWidth > 680);
    setPanelMaximized(false);
    setHelpOpen(false);
  };

  const openLocalModel = () => {
    setActiveSidebar("extensions");
    setSidebarVisible(true);
    setRightPanel("llm");
    setInspectorVisible(true);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem("hrb-sidebar", sidebarVisible ? "visible" : "hidden");
      window.localStorage.setItem("hrb-inspector", inspectorVisible ? "visible" : "hidden");
      window.localStorage.setItem("hrb-panel", panelVisible ? "visible" : "hidden");
      window.localStorage.setItem("hrb-sidebar-width", String(sidebarWidth));
      window.localStorage.setItem("hrb-inspector-width", String(inspectorWidth));
      window.localStorage.setItem("hrb-panel-height", String(panelHeight));
    } catch {
      // The workbench remains fully usable when browser storage is unavailable.
    }
  }, [sidebarVisible, inspectorVisible, panelVisible, sidebarWidth, inspectorWidth, panelHeight]);

  useEffect(() => {
    const handleWorkbenchShortcut = (event) => {
      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (modifier && key === "p") {
        event.preventDefault();
        setQuickOpen(true);
      } else if (modifier && key === "b") {
        event.preventDefault();
        setSidebarVisible((current) => !current);
      } else if (modifier && key === "j") {
        event.preventDefault();
        setPanelVisible((current) => !current);
      } else if (modifier && event.shiftKey && key === "e") {
        event.preventDefault();
        setActiveSidebar("explorer");
        setSidebarVisible(true);
      } else if (modifier && event.shiftKey && key === "f") {
        event.preventDefault();
        setActiveSidebar("search");
        setSidebarVisible(true);
      } else if (modifier && event.shiftKey && key === "g") {
        event.preventDefault();
        setActiveSidebar("source");
        setSidebarVisible(true);
      } else if (modifier && event.shiftKey && key === "d") {
        event.preventDefault();
        setActiveSidebar("run");
        setSidebarVisible(true);
      } else if (modifier && event.shiftKey && key === "x") {
        event.preventDefault();
        openLocalModel();
      } else if (event.key === "Escape") {
        setQuickOpen(false);
        setHelpOpen(false);
      }
    };
    window.addEventListener("keydown", handleWorkbenchShortcut);
    return () => window.removeEventListener("keydown", handleWorkbenchShortcut);
  });

  const beginResize = (kind, event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startSidebar = sidebarWidth;
    const startInspector = inspectorWidth;
    const startPanel = panelHeight;
    document.body.classList.add("ide-is-resizing");

    const move = (moveEvent) => {
      if (kind === "sidebar") setSidebarWidth(Math.min(430, Math.max(170, startSidebar + moveEvent.clientX - startX)));
      if (kind === "inspector") setInspectorWidth(Math.min(560, Math.max(280, startInspector + startX - moveEvent.clientX)));
      if (kind === "panel") setPanelHeight(Math.min(window.innerHeight * 0.72, Math.max(125, startPanel + startY - moveEvent.clientY)));
    };
    const stop = () => {
      document.body.classList.remove("ide-is-resizing");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  const resizeWithKeyboard = (kind, event) => {
    const step = event.shiftKey ? 30 : 10;
    if (kind === "sidebar" && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      setSidebarWidth((current) => Math.min(430, Math.max(170, current + (event.key === "ArrowRight" ? step : -step))));
    }
    if (kind === "inspector" && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      setInspectorWidth((current) => Math.min(560, Math.max(280, current + (event.key === "ArrowLeft" ? step : -step))));
    }
    if (kind === "panel" && ["ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setPanelHeight((current) => Math.min(window.innerHeight * 0.72, Math.max(125, current + (event.key === "ArrowUp" ? step : -step))));
    }
  };

  const toggleTree = (key) => setTreeOpen((current) => ({ ...current, [key]: !current[key] }));
  const workbenchClass = [
    "ide-workbench",
    sidebarVisible ? "" : "sidebar-hidden",
    inspectorVisible ? "" : "inspector-hidden",
  ].filter(Boolean).join(" ");
  const editorClass = [
    "ide-editor-shell",
    panelVisible ? "" : "panel-hidden",
    panelMaximized && panelVisible ? "panel-maximized" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="ide-screen">
      <header className="ide-titlebar">
        <div className="ide-title-left">
          <div className="ide-history-controls">
            <button type="button" aria-label="Go back" title="Go Back" onClick={() => window.history.back()}><Icon name="arrow-left" /></button>
            <button type="button" aria-label="Go forward" title="Go Forward" onClick={() => window.history.forward()}><Icon name="arrow-right" /></button>
          </div>
          <div className="ide-menu-strip" aria-label="Application menu">
            <button type="button" onClick={() => setQuickOpen(true)}>File</button>
            <button type="button" onClick={() => setSidebarVisible((current) => !current)}>View</button>
            <a href="/simulations/">Run</a>
            <button type="button" onClick={() => setPanelVisible((current) => !current)}>Terminal</button>
            <button type="button" onClick={() => setHelpOpen((current) => !current)}>Help</button>
          </div>
        </div>
        <button type="button" className="ide-command-center" onClick={() => setQuickOpen(true)} title="Quick Open (⌘P)"><Icon name="search" /><span>HRB_OS / {activeFile}</span><kbd>⌘P</kbd></button>
        <div className="ide-title-actions">
          <button type="button" onClick={fitWorkbench} aria-label="Fit workbench to window" title="Fit Workbench to Window"><Icon name="layout" /></button>
          <button type="button" className={sidebarVisible ? "active" : ""} onClick={() => setSidebarVisible((current) => !current)} aria-label="Toggle primary side bar" title="Toggle Primary Side Bar (⌘B)"><Icon name={sidebarVisible ? "layout-sidebar-left" : "layout-sidebar-left-off"} /></button>
          <button type="button" className={panelVisible ? "active" : ""} onClick={() => setPanelVisible((current) => !current)} aria-label="Toggle panel" title="Toggle Panel (⌘J)"><Icon name={panelVisible ? "layout-panel" : "layout-panel-off"} /></button>
          <button type="button" className={inspectorVisible ? "active" : ""} onClick={() => setInspectorVisible((current) => !current)} aria-label="Toggle secondary side bar" title="Toggle Secondary Side Bar"><Icon name={inspectorVisible ? "layout-sidebar-right" : "layout-sidebar-right-off"} /></button>
          <ModeSwitch mode="command" onChange={onModeChange} />
        </div>
      </header>

      <div className={workbenchClass} style={{ "--ide-sidebar-width": `${sidebarWidth}px`, "--ide-inspector-width": `${inspectorWidth}px` }}>
        <nav className="ide-activitybar" aria-label="Workspace shortcuts">
          <button type="button" className={activeSidebar === "explorer" && sidebarVisible ? "active" : ""} aria-label="Explorer" title="Explorer (⇧⌘E)" onClick={() => selectSidebar("explorer")}><Icon name="files" /></button>
          <button type="button" className={activeSidebar === "search" && sidebarVisible ? "active" : ""} aria-label="Search" title="Search (⇧⌘F)" onClick={() => selectSidebar("search")}><Icon name="search" /></button>
          <button type="button" className={activeSidebar === "source" && sidebarVisible ? "active" : ""} aria-label="Source Control" title="Source Control (⌃⇧G)" onClick={() => selectSidebar("source")}><Icon name="source-control" /></button>
          <button type="button" className={activeSidebar === "run" && sidebarVisible ? "active" : ""} aria-label="Run and Debug" title="Run and Debug (⇧⌘D)" onClick={() => selectSidebar("run")}><Icon name="debug-alt" /></button>
          <button type="button" className={activeSidebar === "extensions" && sidebarVisible ? "active" : ""} aria-label="Extensions" title="Extensions (⇧⌘X)" onClick={() => selectSidebar("extensions")}><Icon name="extensions" /></button>
          <span className="ide-activity-spacer" />
          <a href="mailto:bhemaraju.138@gmail.com" aria-label="Contact Hema" title="Contact"><Icon name="account" /></a>
        </nav>

        {sidebarVisible && (activeSidebar === "extensions" ? <ExtensionsSidebar onOpenLLM={() => { setRightPanel("llm"); setInspectorVisible(true); }} /> : activeSidebar === "search" ? <SearchSidebar /> : activeSidebar === "source" ? <SourceControlSidebar /> : activeSidebar === "run" ? <RunSidebar activeFile={activeFile} /> : (
          <aside className="ide-explorer" aria-label="Portfolio explorer">
            <div className="ide-pane-title"><strong>EXPLORER</strong><button type="button" aria-label="Collapse all sections" title="Collapse All" onClick={() => setTreeOpen({ editors: false, portfolio: false, outline: false, evidence: false })}><Icon name="collapse-all" /></button></div>
            <div className="ide-tree-group">
              <button type="button" className="ide-tree-header" onClick={() => toggleTree("editors")} aria-expanded={treeOpen.editors}><Icon name={treeOpen.editors ? "chevron-down" : "chevron-right"} /> OPEN EDITORS <span>1</span></button>
              {treeOpen.editors && editorOpen && <a className="active" href={path}><Icon name={iconForFile(activeFile)} />{activeFile}</a>}
            </div>
            <div className="ide-tree-group">
              <button type="button" className="ide-tree-header" onClick={() => toggleTree("portfolio")} aria-expanded={treeOpen.portfolio}><Icon name={treeOpen.portfolio ? "chevron-down" : "chevron-right"} /> HRB_PORTFOLIO</button>
              {treeOpen.portfolio && WORKSPACE_FILES.map(([href, file]) => (
                <a className={activeFile === file ? "active" : ""} href={href} key={href}>
                  <Icon name={iconForFile(file)} />{file}
                </a>
              ))}
            </div>
            <div className="ide-tree-spacer" />
            <button type="button" className="ide-collapsed-pane" onClick={() => toggleTree("outline")} aria-expanded={treeOpen.outline}><Icon name={treeOpen.outline ? "chevron-down" : "chevron-right"} /> OUTLINE</button>
            {treeOpen.outline && <div className="ide-pane-details"><a href="#main">Document root</a><a href="/research/">Research program</a><a href="/publications/">Selected outputs</a></div>}
            <button type="button" className="ide-collapsed-pane" onClick={() => toggleTree("evidence")} aria-expanded={treeOpen.evidence}><Icon name={treeOpen.evidence ? "chevron-down" : "chevron-right"} /> EVIDENCE LOG</button>
            {treeOpen.evidence && <div className="ide-pane-details"><span><Icon name="pass" /> Presented paper</span><span><Icon name="clock" /> Upcoming conference</span><span><Icon name="book" /> Sole-authored preprint</span></div>}
          </aside>
        ))}

        {sidebarVisible && <div className="ide-resizer ide-resizer-vertical ide-resizer-sidebar" role="separator" aria-label="Resize primary side bar" aria-orientation="vertical" tabIndex="0" title="Drag to resize · Double-click to reset" onPointerDown={(event) => beginResize("sidebar", event)} onDoubleClick={() => setSidebarWidth(250)} onKeyDown={(event) => resizeWithKeyboard("sidebar", event)} />}

        <section className={editorClass} style={{ "--ide-panel-height": `${panelHeight}px` }} aria-label="Research editor">
          <div className="ide-tabs">
            {editorOpen && <div className="ide-tab active"><Icon name={iconForFile(activeFile)} />{activeFile}<button type="button" aria-label={`Close ${activeFile}`} title="Close Editor" onClick={() => setEditorOpen(false)}><Icon name="close" /></button></div>}
            <div className="ide-editor-actions"><button type="button" aria-label="Open research context to the side" title="Open Research to the Side" onClick={() => { setRightPanel("context"); setInspectorVisible(true); }}><Icon name="split-horizontal" /></button><button type="button" aria-label="Quick Open" title="Quick Open" onClick={() => setQuickOpen(true)}><Icon name="more" /></button></div>
          </div>
          <div className="ide-breadcrumb">{editorOpen ? <><span>HRB_PORTFOLIO</span><Icon name="chevron-right" /><span>{path.split("/").filter(Boolean).join("  ›  ") || "about"}</span><Icon name="chevron-right" /><span>{activeFile}</span></> : <span>HRB_PORTFOLIO</span>}</div>
          {editorOpen ? <main className="ide-editor-content" id="main">{children}</main> : <main className="ide-empty-editor" id="main"><Icon name="files" /><p>No editor is open</p><button type="button" onClick={() => setQuickOpen(true)}>Quick Open <kbd>⌘P</kbd></button></main>}
          {panelVisible && <section className="ide-terminal-panel" aria-label="Integrated panel">
            {!panelMaximized && <div className="ide-resizer ide-resizer-horizontal" role="separator" aria-label="Resize bottom panel" aria-orientation="horizontal" tabIndex="0" title="Drag to resize · Double-click to reset" onPointerDown={(event) => beginResize("panel", event)} onDoubleClick={() => setPanelHeight(210)} onKeyDown={(event) => resizeWithKeyboard("panel", event)} />}
            <div className="ide-panel-tabs">
              <div role="tablist" aria-label="Bottom panel">
                {[["terminal", "TERMINAL"], ["output", "OUTPUT"], ["problems", "PROBLEMS"], ["debug", "DEBUG CONSOLE"]].map(([id, label]) => (
                  <button type="button" role="tab" aria-selected={panelTab === id} className={panelTab === id ? "active" : ""} key={id} onClick={() => setPanel(id)}>{label}{id === "problems" && <span>0</span>}</button>
                ))}
              </div>
              <div className="ide-panel-actions">
                <button type="button" aria-label={panelMaximized ? "Restore panel size" : "Maximize panel"} title={panelMaximized ? "Restore Panel Size" : "Maximize Panel Size"} onClick={() => setPanelMaximized((current) => !current)}><Icon name={panelMaximized ? "chrome-restore" : "chrome-maximize"} /></button>
                <button type="button" aria-label="Close panel" title="Close Panel (⌘J)" onClick={() => setPanelVisible(false)}><Icon name="close" /></button>
              </div>
            </div>
            <div className="ide-panel-content">
              <div hidden={panelTab !== "terminal"}><CommandConsole onModeChange={onModeChange} onOpenLLM={openLocalModel} onPanelChange={setPanel} onCommand={addOutput} /></div>
              <div hidden={panelTab !== "output"}><OutputPanel entries={outputEntries} onClear={() => setOutputEntries([])} /></div>
              <div hidden={panelTab !== "problems"}><ProblemsPanel /></div>
              <div hidden={panelTab !== "debug"}><DebugConsole path={path} activeFile={activeFile} /></div>
            </div>
          </section>
          }
        </section>

        {inspectorVisible && <div className="ide-resizer ide-resizer-vertical ide-resizer-inspector" role="separator" aria-label="Resize secondary side bar" aria-orientation="vertical" tabIndex="0" title="Drag to resize · Double-click to reset" onPointerDown={(event) => beginResize("inspector", event)} onDoubleClick={() => setInspectorWidth(360)} onKeyDown={(event) => resizeWithKeyboard("inspector", event)} />}

        {inspectorVisible && <aside className={`ide-inspector ${rightPanel === "llm" ? "llm-open" : ""}`} aria-label="Research context">
          <div className="ide-inspector-tabs" role="tablist" aria-label="Inspector panel">
            <button type="button" role="tab" aria-selected={rightPanel === "context"} className={rightPanel === "context" ? "active" : ""} onClick={() => setRightPanel("context")}>RESEARCH</button>
            <button type="button" role="tab" aria-selected={rightPanel === "llm"} className={rightPanel === "llm" ? "active" : ""} onClick={() => setRightPanel("llm")}><Icon name="sparkle" /> LOCAL LLM</button>
            <button type="button" className="ide-inspector-close" aria-label="Close secondary side bar" title="Close Secondary Side Bar" onClick={() => setInspectorVisible(false)}><Icon name="close" /></button>
          </div>
          {rightPanel === "llm" ? <LocalLLMPanel /> : <ResearchContext path={path} activeFile={activeFile} />}
        </aside>}
      </div>

      <footer className="ide-statusbar">
        <div><button type="button" title="Show workspace output" onClick={() => setPanel("output")}><Icon name="git-branch" /> main</button><button type="button" title="No workspace problems" onClick={() => setPanel("problems")}><Icon name="error" /> 0 <Icon name="warning" /> 0</button></div>
        <span><Icon name="check" /> {activeFile}</span>
        <div><span>UTF-8</span><span>LF</span><span>HRB_OS</span><button type="button" title="Toggle Panel" onClick={() => setPanelVisible((current) => !current)}><Icon name="layout-panel" /></button><button type="button" title="Workspace notifications" onClick={() => setPanel("problems")}><Icon name="bell" /></button></div>
      </footer>
      <QuickOpen open={quickOpen} onClose={() => setQuickOpen(false)} />
      {helpOpen && <aside className="ide-help-popover" aria-label="Workbench shortcuts">
        <header><strong>Keyboard Shortcuts</strong><button type="button" aria-label="Close help" onClick={() => setHelpOpen(false)}><Icon name="close" /></button></header>
        <div className="ide-help-actions">
          <button type="button" onClick={() => { setHelpOpen(false); setQuickOpen(true); }}><span>Quick Open</span><kbd>⌘ / Ctrl + P</kbd></button>
          <button type="button" onClick={() => { setHelpOpen(false); setSidebarVisible((current) => !current); }}><span>Toggle primary sidebar</span><kbd>⌘ / Ctrl + B</kbd></button>
          <button type="button" onClick={() => { setHelpOpen(false); setPanelVisible((current) => !current); }}><span>Toggle bottom panel</span><kbd>⌘ / Ctrl + J</kbd></button>
          <button type="button" onClick={() => { setHelpOpen(false); selectSidebar("explorer"); }}><span>Explorer</span><kbd>⇧⌘ / Ctrl + E</kbd></button>
          <button type="button" onClick={() => { setHelpOpen(false); selectSidebar("search"); }}><span>Search</span><kbd>⇧⌘ / Ctrl + F</kbd></button>
          <button type="button" onClick={() => { setHelpOpen(false); selectSidebar("run"); }}><span>Run and Debug</span><kbd>⇧⌘ / Ctrl + D</kbd></button>
          <button type="button" onClick={() => { setHelpOpen(false); selectSidebar("extensions"); }}><span>Extensions</span><kbd>⇧⌘ / Ctrl + X</kbd></button>
        </div>
        <button type="button" onClick={() => { setHelpOpen(false); setPanel("terminal"); }}>Open integrated terminal</button>
      </aside>}
    </div>
  );
}

function Shell({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return window.localStorage.getItem("hrb-interface") === "command" ? "command" : "reader";
    } catch {
      return "reader";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.interface = mode;
    try {
      window.localStorage.setItem("hrb-interface", mode);
    } catch {
      // Mode remains available for the current page when storage is unavailable.
    }
  }, [mode]);

  if (mode === "command") return <CommandWorkspace onModeChange={setMode}>{children}</CommandWorkspace>;

  return (
    <>
      <ReaderHeader mode={mode} onModeChange={setMode} />
      <main id="main">{children}</main>
      <ReaderFooter />
    </>
  );
}

function EvidenceChain() {
  return (
    <div className="system-map" aria-label="Citizen to institution research system">
      <div className="system-node">
        <strong>Citizen</strong>
        <small>eligibility · resources</small>
      </div>
      <div className="system-arrow" aria-hidden="true">→</div>
      <div className="system-node accent-node">
        <strong>Agent</strong>
        <small>capability · error · cost</small>
      </div>
      <div className="system-arrow" aria-hidden="true">→</div>
      <div className="system-node">
        <strong>Evidence</strong>
        <small>schema · documents · claims</small>
      </div>
      <div className="system-arrow" aria-hidden="true">→</div>
      <div className="system-node institution-node">
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

function ResearchCard({ item }) {
  return (
    <article className="research-card">
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
    question: "For whom does an intelligent system work, and under which interaction conditions?",
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
      "Schemas, failure signals, permissions, and monitoring are governance mechanisms, not implementation details.",
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
        {researchLenses.map((lens) => (
          <button
            type="button"
            role="tab"
            aria-selected={lens.id === activeId}
            key={lens.id}
            onClick={() => setActiveId(lens.id)}
          >
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
            run experiments, and study the less visible choices: interfaces, evidence,
            incentives, and rules that determine who technology actually works for.
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
          <span>Build the system</span><i aria-hidden="true">·</i>
          <span>Test the behavior</span><i aria-hidden="true">·</i>
          <span>Trace the institution</span><i aria-hidden="true">·</i>
          <span>Publish the uncertainty</span>
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
          {research.slice(0, 3).map((item) => (
            <ResearchCard item={item} key={item.title} />
          ))}
        </div>
      </section>

      <section className="notebook-home page-shell" aria-labelledby="notebook-heading">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Blogs</p>
            <h2 id="notebook-heading">Experiments and public-data essays.</h2>
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
      </section>

      <section className="experiment-band portfolio-simulations" aria-labelledby="experiment-heading">
        <div className="page-shell experiment-band-inner">
          <div>
            <p className="eyebrow light">Technical simulations · Three open models</p>
            <h2 id="experiment-heading">Simulations</h2>
            <p>
              Explore coupled fixed points, Bayesian partial feedback, and an
              endogenous multi-server queue. Every model exposes its equations,
              assumptions, stability conditions, and novelty boundary.
            </p>
          </div>
          <div className="experiment-mark" aria-hidden="true">
            <span>claim ↓</span><span>volume ↑</span><span>verify ?</span>
          </div>
          <a className="light-button" href="/simulations/">
            Browse simulations <Arrow />
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
          Six empirical essays test a different institutional boundary: failure,
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
        <div><strong>One public-data test</strong><small>Not a renamed concept</small></div>
        <div><strong>One result that could reverse</strong><small>Not a confirmatory illustration</small></div>
        <div><strong>One institutional implication</strong><small>Not an AI slogan</small></div>
        <div><strong>One published limitation</strong><small>Not false certainty</small></div>
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
        <a className="primary-button" href="/simulations/burden-moves/">
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

function SimulationIndexCard({ simulation }) {
  return (
    <a className="simulation-index-card" href={simulation.href}>
      <span>{simulation.family}</span>
      <h2>{simulation.title}</h2>
      <p>{simulation.question}</p>
      <dl>
        <div><dt>Model</dt><dd>{simulation.mathematics}</dd></div>
        <div><dt>Test</dt><dd>{simulation.contribution}</dd></div>
      </dl>
      <div className="simulation-card-footer">
        <small>{simulation.status}</small>
        <strong>Open <Arrow /></strong>
      </div>
    </a>
  );
}

function SimulationsPage() {
  return (
    <Shell>
      <section className="simulation-heading page-shell">
        <h1>SEE THROUGH MY LENS</h1>
      </section>
      <section className="simulation-index page-shell" aria-label="Available simulations">
        {simulationCatalog.map((simulation) => (
          <SimulationIndexCard simulation={simulation} key={simulation.title} />
        ))}
      </section>
    </Shell>
  );
}

function Equation({ children }) {
  return <div className="equation"><code>{children}</code></div>;
}

function ObservabilitySimulationPage() {
  const [reserve, setReserve] = useState(0.25);
  const [evidenceDecay, setEvidenceDecay] = useState(0.01);
  const [signalNoise, setSignalNoise] = useState(0.18);
  const [changePoint, setChangePoint] = useState(24);
  const result = useMemo(
    () => runObservabilityReserve({ reserve, evidenceDecay, signalNoise, changePoint }),
    [reserve, evidenceDecay, signalNoise, changePoint],
  );
  const timeline = result.series.filter((point) => point.period % 5 === 0 || point.period === changePoint);

  return (
    <Shell>
      <section className="page-intro technical-sim-intro page-shell">
        <p className="eyebrow">Bayesian partial-feedback simulation</p>
        <h1>The Evidence You Stop Seeing</h1>
        <p className="intro-lede">
          Strategy B becomes superior after commitment to A. Can a decaying evidence reserve reveal the reversal in time?
        </p>
        <div className="status-box technical-status">
          <strong>Evidence status</strong>
          <p>Illustrative Gaussian thought experiment; not an empirical estimate.</p>
        </div>
      </section>

      <section className="technical-model page-shell" aria-labelledby="observability-controls-heading">
        <div className="technical-controls">
          <p className="eyebrow">Parameter controls</p>
          <h2 id="observability-controls-heading">Fund the counterfactual.</h2>
          <label>
            <span>Observability reserve <output>{percent(reserve)}</output></span>
            <input type="range" min="0" max="1" step="0.05" value={reserve} onChange={(event) => setReserve(Number(event.target.value))} />
            <small>Evidence retained about the unchosen strategy.</small>
          </label>
          <label>
            <span>Evidence decay <output>{evidenceDecay.toFixed(3)}</output></span>
            <input type="range" min="0" max="0.06" step="0.005" value={evidenceDecay} onChange={(event) => setEvidenceDecay(Number(event.target.value))} />
            <small>How quickly unchosen evidence loses relevance.</small>
          </label>
          <label>
            <span>Signal noise σ <output>{signalNoise.toFixed(2)}</output></span>
            <input type="range" min="0.08" max="0.4" step="0.01" value={signalNoise} onChange={(event) => setSignalNoise(Number(event.target.value))} />
            <small>Payoff-signal uncertainty.</small>
          </label>
          <label>
            <span>Reversal period <output>t = {changePoint}</output></span>
            <input type="range" min="10" max="40" step="1" value={changePoint} onChange={(event) => setChangePoint(Number(event.target.value))} />
            <small>When Strategy B becomes superior.</small>
          </label>
        </div>

        <div className="technical-results" aria-live="polite">
          <div className="technical-metrics">
            <Metric label="B evidence / A evidence" value={percent(result.observabilityRatio, 1)} />
            <Metric label="Posterior SD of B" value={result.posteriorSdB.toFixed(3)} />
            <Metric label="P(B > A) at horizon" value={percent(result.reversalProbability, 1)} />
            <Metric label="80% detection delay" value={result.detectionDelay === null ? "Not detected" : `${result.detectionDelay} periods`} tone={result.detectionDelay === null ? "warning" : ""} />
          </div>
          <div className="belief-chart" aria-label="Posterior probability that Strategy B is better across time">
            <div className="chart-threshold"><span>80% detection threshold</span></div>
            {timeline.map((point) => (
              <div className="belief-column" key={point.period}>
                <div className={point.period === changePoint ? "belief-bar change" : "belief-bar"} style={{ height: `${Math.max(2, point.reversalProbability * 100)}%` }} />
                <span>{point.period}</span>
              </div>
            ))}
          </div>
          <p className="chart-caption">Bars show Pr(B &gt; A | evidence). The outline marks the true reversal; detection begins above 80%.</p>
        </div>
      </section>

      <section className="mathematical-core page-shell">
        <div><p className="eyebrow">Mathematical core</p><h2>Fractional Bayesian evidence.</h2></div>
        <div className="equation-stack">
          <Equation>{"w(B,t) = r · exp[−δ(t−1)]"}</Equation>
          <Equation>{"τ(B,t) = τ₀ + Σ w(B,k) / σ²"}</Equation>
          <Equation>{"Pr(B>A | Dₜ) = Φ[(mᴮ−mᴬ) / √(Vᴬ+Vᴮ)]"}</Equation>
          <p>Gaussian updating is standard. The experiment measures how reserve r and decay δ delay institutional recognition.</p>
        </div>
      </section>

      <section className="simulation-interpretation page-shell">
        <article><span>Established</span><h3>Decisions create selective labels.</h3><p>Rejected options are harder to observe.</p></article>
        <article><span>Tested here</span><h3>Observability can be budgeted.</h3><p>Treat counterfactual evidence as a decaying reserve.</p></article>
        <article><span>Failure</span><h3>A reserve may still be too weak.</h3><p>High decay or noise can hide the reversal.</p></article>
      </section>

      <section className="simulation-sources page-shell">
        <p className="eyebrow">Primary foundations</p>
        <a href="https://www.cs.cornell.edu/home/kleinber/kdd17-selective.pdf">Lakkaraju et al. (2017), The Selective Labels Problem <Arrow /></a>
        <a href="https://proceedings.mlr.press/v139/wei21a/wei21a.pdf">Wei (2021), Decision-Making Under Selective Labels <Arrow /></a>
      </section>
    </Shell>
  );
}

function VerificationQueuePage() {
  const [agentAdoption, setAgentAdoption] = useState(0.45);
  const [reviewers, setReviewers] = useState(14);
  const [verificationResponse, setVerificationResponse] = useState(0.35);
  const [agentQualityGap, setAgentQualityGap] = useState(0.2);
  const result = useMemo(
    () => runVerificationQueue({ agentAdoption, reviewers, verificationResponse, agentQualityGap }),
    [agentAdoption, reviewers, verificationResponse, agentQualityGap],
  );
  const waitLabel = result.stable ? `${(result.expectedWait * 24).toFixed(2)} h` : "Diverges";

  return (
    <Shell>
      <section className="page-intro technical-sim-intro page-shell">
        <p className="eyebrow">Endogenous queueing simulation</p>
        <h1>The Queue Answers Back</h1>
        <p className="intro-lede">
          Agents increase submissions; congestion raises verification; verification slows service. Does the loop cross ρ = 1?
        </p>
        <div className="status-box technical-status">
          <strong>Evidence status</strong>
          <p>Illustrative steady-state queue; not a program forecast.</p>
        </div>
      </section>

      <section className="technical-model page-shell" aria-labelledby="queue-controls-heading">
        <div className="technical-controls">
          <p className="eyebrow">Parameter controls</p>
          <h2 id="queue-controls-heading">Move the stability boundary.</h2>
          <label>
            <span>Agent adoption <output>{percent(agentAdoption)}</output></span>
            <input type="range" min="0" max="1" step="0.05" value={agentAdoption} onChange={(event) => setAgentAdoption(Number(event.target.value))} />
            <small>Agent use increases arrival volume.</small>
          </label>
          <label>
            <span>Concurrent reviewers <output>{reviewers}</output></span>
            <input type="range" min="6" max="20" step="1" value={reviewers} onChange={(event) => setReviewers(Number(event.target.value))} />
            <small>Parallel service channels.</small>
          </label>
          <label>
            <span>Verification response β <output>{verificationResponse.toFixed(2)}</output></span>
            <input type="range" min="0" max="0.9" step="0.05" value={verificationResponse} onChange={(event) => setVerificationResponse(Number(event.target.value))} />
            <small>How verification responds to utilization.</small>
          </label>
          <label>
            <span>Agent-quality gap g <output>{agentQualityGap.toFixed(2)}</output></span>
            <input type="range" min="0" max="0.6" step="0.05" value={agentQualityGap} onChange={(event) => setAgentQualityGap(Number(event.target.value))} />
            <small>Verification added by unequal claim quality.</small>
          </label>
        </div>

        <div className="technical-results" aria-live="polite">
          <div className="technical-metrics">
            <Metric label="Utilization ρ" value={percent(result.utilization, 1)} tone={result.stable ? "" : "warning"} />
            <Metric label="Expected queue wait" value={waitLabel} tone={result.stable ? "" : "warning"} />
            <Metric label="Verification intensity" value={percent(result.verification, 1)} />
            <Metric label="Abandonment gap" value={result.stable ? `${(result.abandonmentGap * 100).toFixed(2)} pp` : "Queue unstable"} />
          </div>
          <div className="queue-chart" aria-label="Queue utilization across agent adoption levels">
            <div className="queue-boundary"><span>ρ = 1 stability boundary</span></div>
            {result.curve.map((point) => (
              <div className="queue-column" key={point.adoption}>
                <div className={point.stable ? "queue-bar" : "queue-bar unstable"} style={{ height: `${Math.min(100, (point.utilization / 1.25) * 100)}%` }} />
                <span>{Math.round(point.adoption * 100)}</span>
              </div>
            ))}
          </div>
          <p className="chart-caption">Utilization across adoption. Dark bars cross the boundary where steady-state waiting ceases to exist.</p>
        </div>
      </section>

      <section className="mathematical-core page-shell">
        <div><p className="eyebrow">Mathematical core</p><h2>An Erlang-C queue inside a fixed point.</h2></div>
        <div className="equation-stack">
          <Equation>{"λ(a) = λ₀(1 + 1.35a)"}</Equation>
          <Equation>{"μ(v) = μ₀ / (1 + 1.55v),   ρ = λ / cμ"}</Equation>
          <Equation>{"v* = .06 + .72β·logit⁻¹[9(ρ−.72)] + .20ga"}</Equation>
          <Equation>{"Wq = C(c,λ/μ) / (cμ−λ),   only if ρ < 1"}</Equation>
          <p>Erlang-C is standard. The experiment closes the loop between congestion, verification v, and service rate μ.</p>
        </div>
      </section>

      <section className="simulation-interpretation page-shell">
        <article><span>Nonlinearity</span><h3>Small changes can tip the queue.</h3><p>Waiting diverges as utilization crosses one.</p></article>
        <article><span>Distribution</span><h3>Equal waiting, unequal exit.</h3><p>Different patience creates an abandonment gap.</p></article>
        <article><span>Falsifier</span><h3>Elastic service breaks the loop.</h3><p>Capacity or targeted audits can restore stability.</p></article>
      </section>

      <section className="simulation-sources page-shell">
        <p className="eyebrow">Primary foundation</p>
        <a href="https://www.columbia.edu/~ww2040/HalfinWW1981.pdf">Halfin &amp; Whitt (1981), Heavy-Traffic Limits for Queues with Many Exponential Servers <Arrow /></a>
      </section>
    </Shell>
  );
}

function PublicationsPage() {
  const publications = research.slice(0, 3);

  return (
    <Shell>
      <section className="publications-list page-shell" aria-label="Publications">
        {publications.map((item) => (
          <article className="publication-entry" key={item.title}>
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
    })),
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = writingItems.filter((item) => {
    const topicMatch = topic === "all" || item.topic === topic;
    const textMatch = !normalizedQuery || `${item.title} ${item.excerpt} ${item.kind}`.toLowerCase().includes(normalizedQuery);
    return topicMatch && textMatch;
  });
  const topics = ["all", "government", "methods", "systems"];

  return (
    <Shell>
      <section className="writing-index page-shell" aria-label="Blog archive">
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
            <a className="writing-row no-marker" href={item.href} key={item.id}>
              <span className="writing-row-main">
                <small>{item.kind} · {item.date} · {item.topic}</small>
                <strong>{item.title}</strong>
                <p>{item.excerpt}</p>
              </span>
              <span className="writing-row-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
          {visibleItems.length === 0 && (
            <div className="writing-empty">No blog matches that path. Try another word or topic.</div>
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
  const [pathMade, setPathMade] = useState(false);
  useEffect(() => {
    const handlePathCommand = (event) => setPathMade(Boolean(event.detail?.connected));
    window.addEventListener("portfolio:path", handlePathCommand);
    const params = new URLSearchParams(window.location.search);
    if (params.get("run") === "connect") {
      setPathMade(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    return () => window.removeEventListener("portfolio:path", handlePathCommand);
  }, []);
  const pathMoments = [
    ["Roots", "India", "Where computer science became a way to turn uncertainty into something I could build."],
    ["Leap", "Across an ocean", "I chose unfamiliar rooms before I knew exactly how I would fit inside them."],
    ["Learn", "Systems + people", "Engineering taught me how systems run; research taught me to ask whom they run for."],
    ["Serve", "Inside institutions", "Hospitals and city government made abstract questions of reliability consequential."],
    ["Become", "Researcher–builder", "I now build models, tools, and evidence that make hidden institutional choices visible."],
  ];
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
      <section className="about-path-hero page-shell">
        <div className="about-path-intro">
          <p className="path-kicker">Hello, I’m</p>
          <h1>Hema Raju <em>Barri.</em></h1>
          <p>
            I cross disciplines, institutions, and assumptions, then build the missing
            map between intelligent systems and the people who must live with them.
          </p>
        </div>

        <p className="path-manifesto">
          <span>AS AI AGENTS TAKE THE STAGE,</span>
          <span>I ASK WHO GETS TO WRITE THE NEXT PAGE.</span>
        </p>

        <div className={pathMade ? "about-path-stage is-connected" : "about-path-stage"} aria-live="polite">
          <div className="path-stage-label">
            <span>{pathMade ? "My path, so far" : "The pieces, before the path"}</span>
            <span>{pathMade ? "One direction, still unfolding" : "Connect them below"}</span>
          </div>
          <svg className="about-journey-line" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
            <path d="M85,340 C175,170 270,150 350,285 C430,420 510,440 580,286 C645,142 735,115 790,245 C835,350 895,360 945,196" />
          </svg>
          {pathMoments.map(([label, title, description], index) => (
            <article className={`path-card path-card-${index + 1}`} key={label}>
              <p>{label}</p>
              <h2>{title}</h2>
              <small>{description}</small>
            </article>
          ))}
        </div>

        <button
          className="path-toggle"
          type="button"
          aria-pressed={pathMade}
          onClick={() => setPathMade((current) => !current)}
        >
          <span aria-hidden="true">{pathMade ? "↺" : "↗"}</span>
          <span><small>{pathMade ? "Look again" : "A small experiment"}</small>{pathMade ? "Scatter the pieces" : "Connect my path"}</span>
        </button>
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

      <section className="contact-panel page-shell">
        <p className="eyebrow light">Say hello</p>
        <h2>Good questions travel well.</h2>
        <p>I am always glad to talk about AI evaluation, public systems, research methods, or an argument you think I have wrong.</p>
        <div className="button-row">
          <a className="light-button" href="mailto:bhemaraju.138@gmail.com">Email me <Arrow /></a>
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
          <div className="data-essay-label">Public-data experiment</div>
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
            <ul>
              {essay.blocks.map((block, index) => (
                <li key={block.heading}>
                  <a href={`#section-${index + 1}`}>{block.heading}</a>
                </li>
              ))}
            </ul>
          </aside>
          <div className="data-essay-body">
            {essay.blocks.map((block, index) => (
              <section id={`section-${index + 1}`} key={block.heading}>
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
          These studies begin in different settings: civic data, federal sourcing,
          human–AI interaction, strategy, health surveillance, and municipal
          policy, but share a method: make the hidden choice observable, then test
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
        {research.map((item) => (
          <article className="research-full" key={item.title}>
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

function BurdenMovesSimulationPage() {
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
        <p className="eyebrow">Fixed-point simulation · August 2026</p>
        <h1>The Burden Moves</h1>
        <p className="intro-lede">
          A fixed-point model of how easier applications can trigger verification and redistribute administrative burden.
        </p>
        <div className="status-box">
          <strong>Evidence status</strong>
          <p>Illustrative theory model; not a causal estimate or forecast.</p>
        </div>
      </section>

      <section className="model-simulation page-shell" aria-labelledby="simulation-controls-heading">
        <div className="control-panel">
          <div>
            <p className="eyebrow">Simulation controls</p>
            <h2 id="simulation-controls-heading">Change the institution.</h2>
          </div>
          <label>
            <span>Agency capacity <output>{percent(agencyCapacity)}</output></span>
            <input type="range" min="0.25" max="0.55" step="0.01" value={agencyCapacity} onChange={(event) => setAgencyCapacity(Number(event.target.value))} />
            <small>Volume processed before verification rises.</small>
          </label>
          <label>
            <span>Verification response <output>{verificationResponse.toFixed(2)}</output></span>
            <input type="range" min="0" max="0.9" step="0.05" value={verificationResponse} onChange={(event) => setVerificationResponse(Number(event.target.value))} />
            <small>Response after volume exceeds capacity.</small>
          </label>
          <label>
            <span>Agent-quality gap <output>{qualityGap.toFixed(2)}</output></span>
            <input type="range" min="0" max="0.5" step="0.05" value={qualityGap} onChange={(event) => setQualityGap(Number(event.target.value))} />
            <small>Assistance-quality difference across users.</small>
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
          <li><p>Agents reduce application costs unevenly.</p></li>
          <li><p>Submission volume rises.</p></li>
          <li><p>Capacity pressure raises verification.</p></li>
          <li><p>Documentation costs reshape take-up.</p></li>
        </ol>
      </section>

      <section className="interpretation page-shell">
        <div className="section-heading">
          <p className="eyebrow">What the model contributes</p>
          <h2>A testable disagreement.</h2>
        </div>
        <div className="interpretation-grid">
          <article><h3>Prediction</h3><p>Elastic capacity or targeted review should improve access.</p></article>
          <article><h3>Failure mode</h3><p>Unequal agent quality can create new documentation burdens.</p></article>
          <article><h3>Design implication</h3><p>Audit the institutional response, not only the assistant.</p></article>
          <article><h3>Falsifier</h3><p>Stable volume or equal documentation costs weaken the mechanism.</p></article>
        </div>
        <div className="download-row">
          <a className="primary-button" href="/data/claiming-under-agents-results.json" download>Download baseline results <Arrow /></a>
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
  if (path === "/") return <AboutPage />;
  if (path === "/research") return <ResearchPage />;
  if (path === "/publications") return <PublicationsPage />;
  if (path === "/writing" || path === "/blogs") return <WritingPage />;
  if (path === "/about") return <AboutPage />;
  if (path === "/simulations") return <SimulationsPage />;
  if (path === "/simulations/burden-moves") return <BurdenMovesSimulationPage />;
  if (path === "/simulations/observability-reserve") return <ObservabilitySimulationPage />;
  if (path === "/simulations/verification-queue") return <VerificationQueuePage />;
  if (path === "/experiments") return <ExperimentsLanding />;
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
