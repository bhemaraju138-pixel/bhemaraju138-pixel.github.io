import React, { useEffect, useMemo, useRef, useState } from "react";
import "@vscode/codicons/dist/codicon.css";
import { devFiles, getDevFile } from "./dev-files";
import "./dev-mode.css";

const LOCAL_MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

function Icon({ name }) {
  return <i className={`codicon codicon-${name}`} aria-hidden="true" />;
}

function fileIcon(file) {
  if (file.language === "Python") return "symbol-method";
  if (file.language === "TypeScript") return "symbol-class";
  if (file.language === "CSS") return "symbol-color";
  if (file.language.includes("React")) return "symbol-variable";
  return "markdown";
}

function simpleTokens(value) {
  return [...new Set((value.toLowerCase().match(/[a-z0-9-]+/g) || []).filter((token) => token.length > 2))];
}

function makeKnowledge(publications, typeProjects, researchExperience) {
  return [
    ...publications.map((paper, index) => ({
      id: `publication-${index}`,
      title: paper.title,
      route: paper.href,
      text: `${paper.status}. ${paper.authors}. ${paper.summary}`,
    })),
    ...typeProjects.map((project, index) => ({
      id: `type-${index}`,
      title: project.title,
      route: project.href,
      text: `${project.kind}. ${project.description}`,
    })),
    ...researchExperience.map((experience, index) => ({
      id: `experience-${index}`,
      title: experience.institution,
      route: "/#experience",
      text: `${experience.period}. ${experience.role}. ${experience.detail || (experience.details || []).join(" ")}`,
    })),
    ...devFiles.map((file) => ({
      id: `file-${file.id}`,
      title: file.path,
      route: `#dev/${file.id}`,
      text: `${file.kind}. ${file.language}. ${file.source.slice(0, 2200)}`,
    })),
  ];
}

function retrieve(records, query, limit = 5) {
  const queryTokens = simpleTokens(query);
  return records
    .map((record) => {
      const title = record.title.toLowerCase();
      const text = record.text.toLowerCase();
      const score = queryTokens.reduce((total, token) => (
        total + (title.includes(token) ? 6 : 0) + (text.includes(token) ? 2 : 0)
      ), 0);
      return { record, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ record }) => record);
}

function LocalModelPanel({ publications, typeProjects, researchExperience, onClose }) {
  const knowledge = useMemo(
    () => makeKnowledge(publications, typeProjects, researchExperience),
    [publications, typeProjects, researchExperience],
  );
  const [loadState, setLoadState] = useState("idle");
  const [loadLabel, setLoadLabel] = useState("Not loaded");
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState("");
  const [sources, setSources] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Ask about the papers, research experience, type projects, or the source files in this workspace.",
    },
  ]);
  const [generating, setGenerating] = useState(false);
  const engineRef = useRef(null);
  const transcriptRef = useRef(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadModel = async () => {
    if (engineRef.current || loadState === "loading") return;
    if (!("gpu" in navigator)) {
      setLoadState("unsupported");
      setLoadLabel("WebGPU is unavailable in this browser");
      return;
    }
    setLoadState("loading");
    setLoadLabel("Preparing the local runtime");
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      engineRef.current = await CreateMLCEngine(LOCAL_MODEL_ID, {
        initProgressCallback: (report) => {
          setProgress(Number.isFinite(report.progress) ? report.progress : 0);
          setLoadLabel(report.text || "Loading model files");
        },
      });
      setProgress(1);
      setLoadState("ready");
      setLoadLabel("Ready on this device");
    } catch (error) {
      setLoadState("error");
      setLoadLabel(error instanceof Error ? error.message : "The model could not be loaded");
    }
  };

  const submit = async (event, suggestedPrompt) => {
    event?.preventDefault();
    const prompt = (suggestedPrompt ?? draft).trim();
    if (!prompt || generating) return;
    if (!engineRef.current) {
      setLoadLabel("Load the local model before asking a question");
      return;
    }
    const selectedSources = retrieve(knowledge, prompt);
    const evidence = selectedSources.map((source) => (
      `[${source.title} | ${source.route}]\n${source.text.slice(0, 1700)}`
    )).join("\n\n");
    const messageSequence = messages.length;
    const userMessage = { id: `user-${messageSequence}`, role: "user", content: prompt };
    const answerId = `answer-${messageSequence}`;
    const history = [...messages.filter((message) => message.id !== "welcome"), userMessage]
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));
    setSources(selectedSources);
    setMessages((current) => [...current, userMessage, { id: answerId, role: "assistant", content: "" }]);
    setDraft("");
    setGenerating(true);

    try {
      const stream = await engineRef.current.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are the local research guide inside Hema Raju Barri's portfolio. Use only the evidence packet. Do not invent findings, dates, publication status, collaborators, or source-code capabilities. Say plainly when the evidence is insufficient. Keep the answer concise and cite the relevant file or route in parentheses.\n\nEVIDENCE PACKET\n${evidence}`,
          },
          ...history,
        ],
        temperature: 0.1,
        max_tokens: 360,
        stream: true,
      });
      let response = "";
      for await (const chunk of stream) {
        response += chunk.choices[0]?.delta?.content || "";
        setMessages((current) => current.map((message) => (
          message.id === answerId ? { ...message, content: response } : message
        )));
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Generation failed";
      setMessages((current) => current.map((message) => (
        message.id === answerId
          ? { ...message, content: `The local runtime stopped: ${detail}` }
          : message
      )));
    } finally {
      setGenerating(false);
    }
  };

  const suggestions = [
    "How do the TAS receipts preserve authorization?",
    "What connects the five type projects?",
    "Which source files are reproducibility code?",
  ];

  return (
    <aside className="dev-model" aria-label="Local research model">
      <header className="dev-model-header">
        <div>
          <p>LOCAL RESEARCH MODEL</p>
          <h2>Qwen 2.5 · 1.5B</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close local model" title="Close"><Icon name="close" /></button>
      </header>

      <div className={`dev-model-loader ${loadState}`}>
        <div><span>{loadLabel}</span><strong>{loadState === "loading" ? `${Math.round(progress * 100)}%` : loadState === "ready" ? "LOCAL" : ""}</strong></div>
        <span className="dev-model-progress" aria-hidden="true"><i style={{ width: `${Math.max(2, progress * 100)}%` }} /></span>
        <button type="button" onClick={loadModel} disabled={loadState === "loading" || loadState === "ready"}>
          <Icon name={loadState === "ready" ? "check" : "cloud-download"} />
          {loadState === "ready" ? "Model ready" : loadState === "loading" ? "Loading" : "Load model"}
        </button>
        <small>First use downloads model weights into browser storage. Prompts and inference stay on this device; no API key or server chat log is used.</small>
      </div>

      <div className="dev-model-suggestions">
        {suggestions.map((suggestion) => (
          <button type="button" key={suggestion} onClick={(event) => submit(event, suggestion)} disabled={loadState !== "ready" || generating}>{suggestion}</button>
        ))}
      </div>

      <div className="dev-model-transcript" ref={transcriptRef} aria-live="polite">
        {messages.map((message) => (
          <article className={message.role} key={message.id}>
            <Icon name={message.role === "user" ? "account" : "sparkle"} />
            <p>{message.content || (generating ? "Thinking…" : "")}</p>
          </article>
        ))}
      </div>

      <div className="dev-model-sources">
        <span>{sources.length ? "Evidence loaded" : `${knowledge.length} local records indexed`}</span>
        {sources.map((source) => <small key={source.id}>{source.title}</small>)}
      </div>

      <form className="dev-model-compose" onSubmit={submit}>
        <label htmlFor="dev-model-prompt">Ask this portfolio</label>
        <div>
          <textarea
            id="dev-model-prompt"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={loadState === "ready" ? "Ask about the evidence or source…" : "Load the model to begin"}
            disabled={loadState !== "ready" || generating}
            rows="3"
          />
          <button type="submit" disabled={loadState !== "ready" || generating || !draft.trim()} aria-label="Send question"><Icon name="send" /></button>
        </div>
      </form>
      <p className="dev-model-note">Experimental and fallible. Answers are retrieval-bounded to this published portfolio.</p>
    </aside>
  );
}

function Explorer({ activeId, onSelect, query, onQueryChange }) {
  const groups = [...new Set(devFiles.map((file) => file.group))];
  const normalized = query.trim().toLowerCase();
  const activeProject = getDevFile(activeId).project;
  const [openProjects, setOpenProjects] = useState(() => new Set([activeProject]));

  const toggleProject = (project) => {
    setOpenProjects((current) => {
      const next = new Set(current);
      if (next.has(project)) next.delete(project);
      else next.add(project);
      return next;
    });
  };

  return (
    <aside className="dev-explorer" aria-label="Source explorer">
      <header><strong>EXPLORER</strong><span>•••</span></header>
      <label className="dev-search">
        <Icon name="search" />
        <span className="sr-only">Filter source files</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Filter files" />
      </label>
      <p className="dev-workspace-title"><Icon name="chevron-down" /> HRB_PORTFOLIO</p>
      <div className="dev-tree">
        {groups.map((group) => {
          const files = devFiles.filter((file) => file.group === group && (!normalized || `${file.path} ${file.kind}`.toLowerCase().includes(normalized)));
          if (!files.length) return null;
          const projects = [...new Set(files.map((file) => file.project))];
          return (
            <section key={group}>
              <h2><Icon name="chevron-down" /> {group}</h2>
              {projects.map((project) => {
                const projectFiles = files.filter((file) => file.project === project);
                const isOpen = Boolean(normalized) || project === activeProject || openProjects.has(project);
                return (
                  <div className="dev-tree-project" key={project}>
                    <button type="button" className="dev-tree-project-toggle" onClick={() => toggleProject(project)} aria-expanded={Boolean(isOpen)}>
                      <Icon name={isOpen ? "chevron-down" : "chevron-right"} />
                      <Icon name={isOpen ? "folder-opened" : "folder"} />
                      <span>{project}</span><small>{projectFiles.length}</small>
                    </button>
                    {isOpen && projectFiles.map((file) => (
                      <button type="button" className={`dev-tree-file ${file.id === activeId ? "active" : ""}`} onClick={() => onSelect(file.id)} key={file.id} title={file.path}>
                        <Icon name={fileIcon(file)} /><span>{file.sourcePath.split("/").at(-1)}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
      <footer>
        <p><Icon name="lock" /> Published read-only snapshot</p>
        <small>Private repositories remain private. Only these intentionally selected files are exposed here.</small>
      </footer>
    </aside>
  );
}

function SourceEditor({ file, onCopy, copied }) {
  const lines = file.source.replace(/\n$/, "").split("\n");
  const downloadSource = () => {
    const blob = new Blob([file.source], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.sourcePath.split("/").at(-1);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <section className="dev-editor" aria-label={`Source editor: ${file.path}`}>
      <div className="dev-tabbar">
        <div className="active"><Icon name={fileIcon(file)} /><span>{file.path.split("/").at(-1)}</span><Icon name="close" /></div>
      </div>
      <div className="dev-breadcrumbs">
        {file.path.split("/").map((part, index) => <React.Fragment key={`${part}-${index}`}><span>{part}</span>{index < file.path.split("/").length - 1 && <Icon name="chevron-right" />}</React.Fragment>)}
      </div>
      <div className="dev-source-banner">
        <div><span>{file.kind}</span><small>{file.language} · {lines.length.toLocaleString()} lines · {file.sourcePath}</small></div>
        <div>
          {file.repositoryHref && <a href={file.repositoryHref} target="_blank" rel="noreferrer">Repository <Icon name="github" /></a>}
          {file.openHref && <a href={file.openHref} target="_blank" rel="noreferrer">{file.openLabel} <Icon name="link-external" /></a>}
          <button type="button" onClick={downloadSource}><Icon name="desktop-download" /> Download</button>
          <button type="button" onClick={onCopy}><Icon name={copied ? "check" : "copy"} /> {copied ? "Copied" : "Copy source"}</button>
        </div>
      </div>
      <pre className="dev-code" aria-label={`${file.path} source code`}>
        <code>
          {lines.map((line, index) => (
            <span className="dev-code-line" key={`${file.id}-${index}`}><i>{index + 1}</i><b>{line || " "}</b></span>
          ))}
        </code>
      </pre>
    </section>
  );
}

function BottomPanel({ activeTab, onTabChange, file, onSelect, onPlain, onModel }) {
  const [command, setCommand] = useState("");
  const [entries, setEntries] = useState([
    "HRB source workspace initialized",
    "Type `help` for commands or select a file in Explorer.",
  ]);

  const run = (event) => {
    event.preventDefault();
    const raw = command.trim();
    if (!raw) return;
    const normalized = raw.toLowerCase();
    if (normalized === "clear") setEntries([]);
    else if (normalized === "help") setEntries((current) => [...current, `$ ${raw}`, "ls · open <name> · model · plain · clear"]);
    else if (normalized === "ls") setEntries((current) => [...current, `$ ${raw}`, "README.md  papers/  type/  portfolio/"]);
    else if (normalized === "model" || normalized === "llm") {
      setEntries((current) => [...current, `$ ${raw}`, "Opening the local research model…"]);
      onModel();
    } else if (normalized === "plain" || normalized === "read") {
      setEntries((current) => [...current, `$ ${raw}`, "Returning to Plain mode…"]);
      window.setTimeout(onPlain, 120);
    } else if (normalized.startsWith("open ")) {
      const term = normalized.slice(5);
      const match = devFiles.find((candidate) => `${candidate.path} ${candidate.id}`.toLowerCase().includes(term));
      if (match) {
        onSelect(match.id);
        setEntries((current) => [...current, `$ ${raw}`, `Opened ${match.path}`]);
      } else setEntries((current) => [...current, `$ ${raw}`, `No source file matches “${term}”.`]);
    } else setEntries((current) => [...current, `$ ${raw}`, `Command not found: ${raw}`]);
    setCommand("");
  };

  return (
    <section className="dev-bottom" aria-label="Development panel">
      <nav aria-label="Panel tabs">
        {[
          ["terminal", "TERMINAL"],
          ["output", "OUTPUT"],
          ["problems", "PROBLEMS"],
        ].map(([value, label]) => <button type="button" className={activeTab === value ? "active" : ""} onClick={() => onTabChange(value)} key={value}>{label}{value === "problems" && <span>0</span>}</button>)}
      </nav>
      {activeTab === "terminal" && (
        <div className="dev-terminal">
          <div aria-live="polite">{entries.slice(-6).map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}</div>
          <form onSubmit={run}><label htmlFor="dev-command">hema@portfolio:~$</label><input id="dev-command" value={command} onChange={(event) => setCommand(event.target.value)} autoComplete="off" spellCheck="false" /><button type="submit">Run</button></form>
        </div>
      )}
      {activeTab === "output" && <div className="dev-panel-copy"><p>[source] Opened {file.path}</p><p>[scope] {file.kind}</p><p>[privacy] This workspace exposes a curated published snapshot only.</p></div>}
      {activeTab === "problems" && <div className="dev-panel-empty"><Icon name="check-all" /><span>No problems detected in this published workspace.</span></div>}
    </section>
  );
}

export default function DevMode({ initialFileId, onPlain, publications, typeProjects, researchExperience }) {
  const [activeId, setActiveId] = useState(() => getDevFile(initialFileId).id);
  const [query, setQuery] = useState("");
  const [panelTab, setPanelTab] = useState("terminal");
  const [modelOpen, setModelOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const file = getDevFile(activeId);

  const selectFile = (id) => {
    setActiveId(id);
    setCopied(false);
    window.history.replaceState(null, "", `#dev/${id}`);
  };

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(file.source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`dev-shell ${explorerOpen ? "explorer-open" : ""} ${modelOpen ? "model-open" : ""}`}>
      <header className="dev-titlebar">
        <div className="dev-window-dots" aria-hidden="true"><i /><i /><i /></div>
        <p>HRB_PORTFOLIO — Visual Studio Code</p>
        <button type="button" onClick={onPlain}><Icon name="preview" /> Plain mode</button>
      </header>
      <aside className="dev-activity" aria-label="Development mode activity bar">
        <button type="button" className={explorerOpen ? "active" : ""} onClick={() => setExplorerOpen((current) => !current)} aria-label="Toggle Explorer" title="Explorer"><Icon name="files" /></button>
        <button type="button" onClick={() => { setExplorerOpen(true); setQuery(""); }} aria-label="Search files" title="Search"><Icon name="search" /></button>
        <button type="button" onClick={() => setPanelTab("output")} aria-label="Source control summary" title="Source control"><Icon name="source-control" /></button>
        <button type="button" onClick={() => setModelOpen((current) => !current)} className={modelOpen ? "active" : ""} aria-label="Toggle local research model" title="Local research model"><Icon name="sparkle" /></button>
        <span />
        <button type="button" onClick={onPlain} aria-label="Return to plain portfolio" title="Plain mode"><Icon name="account" /></button>
        <button type="button" onClick={() => setPanelTab("output")} aria-label="Workspace settings" title="Workspace settings"><Icon name="gear" /></button>
      </aside>
      {explorerOpen && <Explorer activeId={file.id} onSelect={selectFile} query={query} onQueryChange={setQuery} />}
      <main className="dev-main">
        <SourceEditor file={file} onCopy={copySource} copied={copied} />
        <BottomPanel activeTab={panelTab} onTabChange={setPanelTab} file={file} onSelect={selectFile} onPlain={onPlain} onModel={() => setModelOpen(true)} />
      </main>
      {modelOpen && <LocalModelPanel publications={publications} typeProjects={typeProjects} researchExperience={researchExperience} onClose={() => setModelOpen(false)} />}
      <footer className="dev-statusbar">
        <span><Icon name="source-control" /> main*</span>
        <span><Icon name="sync" /> published snapshot</span>
        <span />
        <span>Ln 1, Col 1</span>
        <span>UTF-8</span>
        <span>{file.language}</span>
        <span><Icon name="broadcast" /> Local</span>
      </footer>
    </div>
  );
}
