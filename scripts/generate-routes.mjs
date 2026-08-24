import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const routes = [
  "research",
  "experiments/claiming-under-agents",
  "notes/labels-are-not-treatments",
  "notes/map-is-a-policy-choice",
  "notes/open-is-not-agent-readable",
  "notes/who-owns-the-verification-layer",
  "timeline",
];

const dist = resolve("dist");

for (const route of routes) {
  const directory = resolve(dist, route);
  await mkdir(directory, { recursive: true });
  await copyFile(resolve(dist, "index.html"), resolve(directory, "index.html"));
}

await copyFile(resolve(dist, "index.html"), resolve(dist, "404.html"));
await mkdir(resolve(dist, ".openai"), { recursive: true });
await copyFile(
  resolve(".openai", "hosting.json"),
  resolve(dist, ".openai", "hosting.json"),
);
