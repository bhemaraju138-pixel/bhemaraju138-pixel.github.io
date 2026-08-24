import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { notes, publicDataEssays } from "../src/content.js";

const siteUrl = "https://bhemaraju138-pixel.github.io";
const routes = [
  {
    route: "research",
    title: "Selected Work | Hema Raju Barri",
    description: "Research across AI systems, human–AI interaction, public institutions, evidence, and empirical methods.",
  },
  {
    route: "publications",
    title: "Publications | Hema Raju Barri",
    description: "Accepted, presented, forthcoming, and preprint research on AI infrastructure, federal AI sourcing, and strategic evidence.",
  },
  {
    route: "blogs",
    title: "Blogs | Hema Raju Barri",
    description: "Public-data experiments, methods, code, and empirical essays by Hema Raju Barri.",
  },
  {
    route: "writing",
    title: "Writing | Hema Raju Barri",
    description: "An open collection of public-data experiments, methods, code, and empirical essays.",
  },
  {
    route: "about",
    title: "About | Hema Raju Barri",
    description: "Hema Raju Barri is a researcher and systems builder working across AI, management, public policy, and empirical methods.",
  },
  {
    route: "simulations",
    title: "Technical Simulations | Hema Raju Barri",
    description: "Interactive mathematical models of administrative burden, counterfactual observability, and endogenous verification queues.",
  },
  {
    route: "simulations/observability-reserve",
    title: "The Evidence You Stop Seeing | Hema Raju Barri",
    description: "A Bayesian partial-feedback simulation of counterfactual evidence reserves, observability decay, and reversal-detection delay.",
    detail: true,
  },
  {
    route: "simulations/verification-queue",
    title: "The Queue Answers Back | Hema Raju Barri",
    description: "An endogenous M/M/c simulation coupling agent-induced demand, verification intensity, service rate, and unequal abandonment.",
    detail: true,
  },
  {
    route: "experiments",
    title: "Public-Data Experiments | Hema Raju Barri",
    description: "Six reproducible studies of failure, metadata, participation, ranking, procedure, and missingness in public systems.",
  },
  {
    route: "simulations/burden-moves",
    title: "The Burden Moves | Hema Raju Barri",
    description: "An interactive model of agent-mediated public-benefit claiming, agency capacity, verification, and unequal access.",
    detail: true,
  },
  ...publicDataEssays.map((essay) => ({
    route: `experiments/${essay.slug}`,
    title: `${essay.title} | Hema Raju Barri`,
    description: essay.standfirst,
    detail: true,
  })),
  ...notes.map((note) => ({
    route: `notes/${note.slug}`,
    title: `${note.title} | Hema Raju Barri`,
    description: note.standfirst,
    detail: true,
  })),
];

const escapeAttribute = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

function setMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"[\\s\\S]*?\\/?>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function removeMeta(html, attribute, key) {
  const pattern = new RegExp(`\\s*<meta\\s+${attribute}="${key}"[\\s\\S]*?\\/?>`, "i");
  return html.replace(pattern, "");
}

function routeHtml(source, record) {
  const title = escapeAttribute(record.title);
  const url = `${siteUrl}/${record.route}/`;
  let html = source.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = setMeta(html, "name", "description", record.description);
  html = setMeta(html, "property", "og:title", record.title);
  html = setMeta(html, "property", "og:description", record.description);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "name", "twitter:title", record.title);
  html = setMeta(html, "name", "twitter:description", record.description);

  if (record.detail) {
    html = removeMeta(html, "property", "og:image");
    html = removeMeta(html, "property", "og:image:width");
    html = removeMeta(html, "property", "og:image:height");
    html = removeMeta(html, "name", "twitter:image");
    html = setMeta(html, "name", "twitter:card", "summary");
  }

  return html;
}

const distRoot = resolve("dist");
const dist = resolve(distRoot, "client");
const sourceIndex = await readFile(resolve(dist, "index.html"), "utf8");

for (const record of routes) {
  const directory = resolve(dist, record.route);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "index.html"), routeHtml(sourceIndex, record));
}

await copyFile(resolve(dist, "index.html"), resolve(dist, "404.html"));
await mkdir(resolve(distRoot, ".openai"), { recursive: true });
await copyFile(
  resolve(".openai", "hosting.json"),
  resolve(distRoot, ".openai", "hosting.json"),
);
await mkdir(resolve(distRoot, "server"), { recursive: true });
await copyFile(resolve("server", "index.js"), resolve(distRoot, "server", "index.js"));
await copyFile(
  resolve("server", "wrangler.json"),
  resolve(distRoot, "server", "wrangler.json"),
);
