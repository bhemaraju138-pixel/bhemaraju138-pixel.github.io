import assert from "node:assert/strict";
import test from "node:test";
import { buildPortfolioContext, portfolioKnowledge, retrievePortfolioRecords } from "../src/portfolio-knowledge.js";

test("the local model index is built from every portfolio collection", () => {
  assert.ok(portfolioKnowledge.length >= 20);
  assert.ok(portfolioKnowledge.every((record) => record.id && record.title && record.route && record.text));
});

test("publication questions retrieve the matching paper and its status", () => {
  const records = retrievePortfolioRecords("privacy sensitive sourcing INSIGHT presented", 5);
  const paper = records.find((record) => record.title === "Privacy-Sensitive Generative AI Sourcing");
  assert.ok(paper);
  assert.match(paper.text, /Accepted · Presented/);
  assert.equal(paper.route, "/papers/privacy-sensitive-sourcing.pdf");
});

test("broad publication questions still retrieve research outputs", () => {
  const records = retrievePortfolioRecords("show me the publications", 5);
  assert.ok(records.some((record) => record.route.endsWith(".pdf")));
});

test("technical questions retrieve the relevant simulation", () => {
  const records = retrievePortfolioRecords("Erlang queue verification service rate", 5);
  assert.ok(records.some((record) => record.title === "The Queue Answers Back"));
});

test("the generated model prompt requires evidence-bounded answers", () => {
  const context = buildPortfolioContext("Oxford missing data", 4);
  assert.match(context.prompt, /Use only the EVIDENCE PACKET/);
  assert.match(context.prompt, /University of Oxford, Saïd Business School/);
  assert.ok(context.records.length <= 4);
});
