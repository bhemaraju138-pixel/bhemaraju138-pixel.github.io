import { access } from "node:fs/promises";
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
