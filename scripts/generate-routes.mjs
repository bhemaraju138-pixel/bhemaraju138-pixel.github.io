import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const distRoot = resolve("dist");
const dist = resolve(distRoot, "client");

async function removeAppleDoubleFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(directory, entry.name);
    if (entry.name.startsWith("._")) {
      await rm(entryPath, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      await removeAppleDoubleFiles(entryPath);
    }
  }));
}

await Promise.all([
  rm(resolve(dist, "data"), { recursive: true, force: true }),
  rm(resolve(dist, "figures"), { recursive: true, force: true }),
  rm(resolve(dist, "images", "same-numbers-stale-permission.svg"), { force: true }),
  rm(resolve(dist, "papers", "agent-infrastructure-fit-abstract.pdf"), { force: true }),
  rm(resolve(dist, "papers", "auditing-evidence-claims-atracc-2026.pdf"), { force: true }),
  rm(resolve(dist, "papers", "privacy-sensitive-sourcing.pdf"), { force: true }),
]);

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

await removeAppleDoubleFiles(distRoot);
