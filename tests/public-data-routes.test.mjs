import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { publicDataEssays } from "../src/content.js";

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
  for (const route of ["research", "publications", "blogs", "writing", "about", "experiments/claiming-under-agents"]) {
    await access(resolve("dist/client", route, "index.html"));
  }

  const writingHtml = await readFile(resolve("dist/client/writing/index.html"), "utf8");
  assert.match(writingHtml, /<title>Writing — Hema Raju Barri<\/title>/);
  assert.match(writingHtml, /og-minimal\.png/);

  const publicationsHtml = await readFile(resolve("dist/client/publications/index.html"), "utf8");
  assert.match(publicationsHtml, /<title>Publications — Hema Raju Barri<\/title>/);

  const essayHtml = await readFile(
    resolve("dist/client/experiments/error-message-is-policy/index.html"),
    "utf8",
  );
  assert.match(essayHtml, /<title>The Error Message Is Part of the Policy — Hema Raju Barri<\/title>/);
  assert.doesNotMatch(essayHtml, /property="og:image"/);
  assert.doesNotMatch(essayHtml, /name="twitter:image"/);
});
