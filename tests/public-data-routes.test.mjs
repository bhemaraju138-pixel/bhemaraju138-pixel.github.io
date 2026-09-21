import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { publicDataEssays, publications } from "../src/content.js";

test("the public-data series contains six distinct essays", () => {
  assert.equal(publicDataEssays.length, 6);
  assert.equal(new Set(publicDataEssays.map((essay) => essay.slug)).size, 6);
  assert.equal(new Set(publicDataEssays.map((essay) => essay.question)).size, 6);
});

test("every essay figure, local download, and built route exists", async () => {
  for (const essay of publicDataEssays) {
    await access(resolve("public", essay.figure.src.replace(/^\//, "")));
    await access(resolve("dist/client/experiments", essay.slug, "index.html"));
    for (const [, href] of essay.dataLinks) {
      if (href.startsWith("/")) {
        await access(resolve("public", href.replace(/^\//, "")));
      }
    }
  }
});

test("portfolio routes and route-specific metadata are built", async () => {
  for (const route of [
    "research",
    "publications",
    "blogs",
    "writing",
    "about",
    "simulations",
    "simulations/observability-reserve",
    "simulations/verification-queue",
    "simulations/burden-moves",
  ]) {
    await access(resolve("dist/client", route, "index.html"));
  }

  const writingHtml = await readFile(resolve("dist/client/writing/index.html"), "utf8");
  assert.match(writingHtml, /<title>Writing \| Hema Raju Barri<\/title>/);
  assert.match(writingHtml, /og-minimal\.png/);

  const publicationsHtml = await readFile(resolve("dist/client/publications/index.html"), "utf8");
  assert.match(publicationsHtml, /<title>Publications \| Hema Raju Barri<\/title>/);

  const simulationHtml = await readFile(
    resolve("dist/client/simulations/observability-reserve/index.html"),
    "utf8",
  );
  assert.match(simulationHtml, /<title>The Evidence You Stop Seeing \| Hema Raju Barri<\/title>/);
  assert.doesNotMatch(simulationHtml, /property="og:image"/);

  const essayHtml = await readFile(
    resolve("dist/client/experiments/error-message-is-policy/index.html"),
    "utf8",
  );
  assert.match(essayHtml, /<title>The Error Message Is Part of the Policy \| Hema Raju Barri<\/title>/);
  assert.doesNotMatch(essayHtml, /property="og:image"/);
  assert.doesNotMatch(essayHtml, /name="twitter:image"/);

  await assert.rejects(access(resolve("dist/client/timeline/index.html")));
});

test("the accepted ATRACC paper publishes its code and artifact bundle", async () => {
  const paper = publications.find(
    (item) => item.title === "Auditing Evidence Claims in Federal High-Impact AI Exclusions",
  );

  assert.ok(paper);
  assert.match(paper.codeHref, /research\/atracc-2026$/);
  assert.equal(paper.bundleHref, "/data/atracc-2026-reproducibility.zip");
  await access(resolve("research/atracc-2026/README.md"));
  await access(resolve("research/atracc-2026/PACKAGE_MANIFEST.json"));
  await access(resolve("dist/client/data/atracc-2026-reproducibility.zip"));
});
