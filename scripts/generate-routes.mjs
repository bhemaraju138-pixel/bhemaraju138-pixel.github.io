import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { publicDataEssays } from "../src/content.js";

const routes = [
  "research",
  "experiments",
  "experiments/claiming-under-agents",
  ...publicDataEssays.map((essay) => `experiments/${essay.slug}`),
  "notes/labels-are-not-treatments",
  "notes/map-is-a-policy-choice",
  "notes/open-is-not-agent-readable",
  "notes/who-owns-the-verification-layer",
  "timeline",
];

const distRoot = resolve("dist");
const dist = resolve(distRoot, "client");

for (const route of routes) {
  const directory = resolve(dist, route);
  await mkdir(directory, { recursive: true });
  await copyFile(resolve(dist, "index.html"), resolve(directory, "index.html"));
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
