import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const paperFiles = [
  "same-numbers-stale-permission.pdf",
  "auditing-evidence-claims.pdf",
  "privacy-sensitive-generative-ai-sourcing.pdf",
  "agent-infrastructure-fit.pdf",
  "ruleblind-dcrt.pdf",
];

const publicationImages = [
  "same-numbers-stale-permission.png",
  "auditing-evidence-claims.png",
  "privacy-sensitive-sourcing.png",
  "agent-infrastructure-fit.png",
  "ruleblind-dcrt.png",
];

const typeProjectImages = [
  "unit-distance.png",
  "axis-doctor.png",
  "fontfix.png",
  "render-parity.png",
  "shape-trace.png",
];

test("the production entry is the simplified portfolio", async () => {
  const html = await readFile(resolve("dist/client/index.html"), "utf8");
  assert.match(html, /Hema Raju Barri \| Researcher and Systems Builder/);
  assert.match(html, /Research experience, publications, and type-design projects/);
  assert.doesNotMatch(html, /Blogs|Technical Simulations|interactive models/);
  await access(resolve("dist/client/404.html"));
});

test("experience and education sections follow the requested editorial order", async () => {
  const source = await readFile(resolve("src/portfolio.jsx"), "utf8");
  const renderedSections = source.slice(source.indexOf("<ExperienceSection />"));
  const sectionMarkers = [
    "<ExperienceSection />",
    "<FounderExperienceSection />",
    "<OtherExperienceSection />",
    "<PublicationsSection />",
    "<EducationSection />",
    "<TypeProjectsSection />",
  ];

  let previousIndex = -1;
  for (const marker of sectionMarkers) {
    const markerIndex = renderedSections.indexOf(marker);
    assert.ok(markerIndex > previousIndex, `${marker} should appear in sequence`);
    previousIndex = markerIndex;
  }

  assert.match(source, /Series - Agentic AI Network/);
  assert.match(source, /Human BioSciences/);
  assert.match(source, /Ms\. Brenda Nack/);
  assert.match(source, /Thomas Yuill/);
  assert.doesNotMatch(source, /more than 50 applications|17% increase|20,000 municipal/);
});

test("all five publication PDFs are included in the public build", async () => {
  for (const filename of paperFiles) {
    const content = await readFile(resolve("dist/client/papers", filename));
    assert.equal(content.subarray(0, 5).toString(), "%PDF-");
  }
});

test("publication figures, profile photograph, type screenshots, and SwiftCollab evidence are included", async () => {
  for (const filename of publicationImages) {
    await access(resolve("dist/client/images/publications", filename));
  }
  for (const filename of typeProjectImages) {
    await access(resolve("dist/client/images/type-projects", filename));
  }
  await access(resolve("dist/client/images/experience/pava-center-invitation.png"));
  await access(resolve("dist/client/images/experience/towson-startup-cohort.jpeg"));
  await access(resolve("dist/client/images/profile/hema-certificate-recognition.jpeg"));
});

test("removed portfolio sections are not emitted as routes", async () => {
  await assert.rejects(access(resolve("dist/client/blogs/index.html")));
  await assert.rejects(access(resolve("dist/client/simulations/index.html")));
  await assert.rejects(access(resolve("dist/client/experiments/index.html")));
  await assert.rejects(access(resolve("dist/client/data")));
  await assert.rejects(access(resolve("dist/client/figures")));
  await assert.rejects(access(resolve("dist/client/papers/privacy-sensitive-sourcing.pdf")));
});

test("the published artifact contains no AppleDouble metadata files", async () => {
  const entries = await readdir(resolve("dist/client"), { recursive: true });
  assert.equal(entries.some((entry) => entry.split("/").at(-1).startsWith("._")), false);
});
