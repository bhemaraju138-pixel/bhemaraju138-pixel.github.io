import { notes, publicDataEssays, research } from "./content.js";
import { education, experience, profileSummary } from "./profile.js";
import { simulationCatalog } from "./simulations.js";

const coreRecords = [
  {
    id: "profile",
    title: "Research profile",
    route: "/about/",
    text: `${profileSummary.name} is ${profileSummary.description.charAt(0).toLowerCase()}${profileSummary.description.slice(1)}`,
  },
  ...education.map(([year, institution, program], index) => ({
    id: `education-${index}`,
    title: institution,
    route: "/about/",
    text: `${program}. ${year}.`,
  })),
  ...experience.map(([year, place, role, description], index) => ({
    id: `experience-${index}`,
    title: place,
    route: "/about/",
    text: `${role}. ${year}. ${description}`,
  })),
];

const compact = (values) => values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

const researchRecords = research.map((item, index) => ({
  id: `research-${index}`,
  title: item.title,
  route: item.href,
  text: compact([
    "Publication paper research output.",
    item.year,
    item.type,
    item.publicationStatus,
    item.venue,
    item.authors,
    item.dek,
    `Question: ${item.question}`,
    `Method: ${item.method}`,
    `Finding: ${item.finding}`,
    `Implication: ${item.implication}`,
  ]),
}));

const essayRecords = publicDataEssays.map((essay) => ({
  id: `experiment-${essay.slug}`,
  title: essay.title,
  route: `/experiments/${essay.slug}/`,
  text: compact([
    "Blog public-data experiment.",
    essay.eyebrow,
    essay.standfirst,
    `Question: ${essay.question}`,
    `Evidence status: ${essay.evidenceStatus}`,
    ...(essay.metrics || []).map(([label, value]) => `${label}: ${value}.`),
    ...(essay.blocks || []).slice(0, 2).flatMap((block) => [block.heading, ...(block.paragraphs || [])]),
  ]),
}));

const noteRecords = notes.map((note) => ({
  id: `note-${note.slug}`,
  title: note.title,
  route: `/notes/${note.slug}/`,
  text: compact([
    "Research note blog.",
    note.eyebrow,
    note.standfirst,
    ...(note.blocks || []).flatMap((block) => [block.heading, ...(block.paragraphs || [])]),
  ]),
}));

const simulationRecords = simulationCatalog.map((simulation) => ({
  id: `simulation-${simulation.href.split("/").filter(Boolean).at(-1)}`,
  title: simulation.title,
  route: simulation.href,
  text: compact([
    "Technical simulation model.",
    simulation.family,
    `Question: ${simulation.question}`,
    `Mathematics: ${simulation.mathematics}`,
    `Contribution: ${simulation.contribution}`,
    `Status: ${simulation.status}`,
  ]),
}));

export const portfolioKnowledge = [
  ...coreRecords,
  ...researchRecords,
  ...essayRecords,
  ...noteRecords,
  ...simulationRecords,
];

const stopWords = new Set([
  "about", "also", "and", "are", "can", "did", "does", "for", "from", "has", "have",
  "hema", "her", "how", "into", "portfolio", "raju", "that", "the", "their", "this",
  "was", "what", "when", "where", "which", "who", "why", "with", "work",
]);

function tokens(value) {
  return [...new Set(value.toLowerCase().match(/[a-z0-9]+/g) || [])]
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

const aliases = {
  blog: ["blog", "essay", "note", "experiment"],
  blogs: ["blog", "essay", "note", "experiment"],
  paper: ["paper", "publication", "abstract", "preprint", "presented"],
  papers: ["paper", "publication", "abstract", "preprint", "presented"],
  publication: ["paper", "publication", "abstract", "preprint", "presented"],
  publications: ["paper", "publication", "abstract", "preprint", "presented"],
  simulation: ["simulation", "model", "queue", "fixed", "bayesian"],
  simulations: ["simulation", "model", "queue", "fixed", "bayesian"],
};

function expandedTokens(value) {
  return [...new Set(tokens(value).flatMap((token) => aliases[token] || [token]))];
}

function relevance(record, queryTokens) {
  const title = record.title.toLowerCase();
  const text = record.text.toLowerCase();
  const route = record.route.toLowerCase();
  return queryTokens.reduce((score, token) => {
    if (title.includes(token)) score += 6;
    if (route.includes(token)) score += 4;
    if (text.includes(token)) score += 2;
    return score;
  }, 0);
}

export function retrievePortfolioRecords(query, limit = 5) {
  const queryTokens = expandedTokens(query);
  const ranked = portfolioKnowledge
    .map((record) => ({ record, score: relevance(record, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.record.title.localeCompare(right.record.title));

  const selected = ranked.slice(0, Math.max(1, limit)).map(({ record }) => record);
  const identity = portfolioKnowledge.find((record) => record.id === "profile");
  if (!selected.some((record) => record.id === identity.id)) selected.unshift(identity);
  return selected.slice(0, limit);
}

export function buildPortfolioContext(query, limit = 5) {
  const records = retrievePortfolioRecords(query, limit);
  const evidence = records.map((record) => (
    `[${record.title} | ${record.route}]\n${record.text.slice(0, 1550)}`
  )).join("\n\n");

  return {
    records,
    prompt: `You are the local research guide inside Hema Raju Barri's portfolio.
Use only the EVIDENCE PACKET below. Do not invent positions, results, dates, collaborators, or publication status. Distinguish completed work from illustrative models and open research questions. If the packet does not answer the question, say that plainly. Keep the response concise and include the relevant portfolio route in parentheses.

EVIDENCE PACKET
${evidence}`,
  };
}
