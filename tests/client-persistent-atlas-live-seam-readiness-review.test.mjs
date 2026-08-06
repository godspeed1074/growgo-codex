import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const reviewPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_55_PERSISTENT_ATTACHMENT_LIVE_SEAM_READINESS_REVIEW.md"
);
const scriptPath = path.join(repoRoot, "script.js");
const appPath = path.join(repoRoot, "client/development-alpha-app.mjs");

const allowedClassifications = [
  "READY_FOR_ADAPTER",
  "READY_WITH_NARROW_WRAPPER",
  "BLOCKED_BY_MISSING_CONTRACT",
  "BLOCKED_BY_LIFECYCLE_MISMATCH",
  "BLOCKED_BY_IDENTITY_RISK",
  "BLOCKED_BY_CLEANUP_RISK",
  "NOT_APPLICABLE"
];

const allowedRecommendations = [
  "READY_FOR_DISCONNECTED_LIVE_ADAPTER_IMPLEMENTATION",
  "READY_ONLY_FOR_MORE_FAKE_COMPOSITION",
  "BLOCKED_BY_LIVE_SEAM_GAPS",
  "BLOCKED_BY_CLEANUP_GAPS",
  "BLOCKED_BY_IDENTITY_GAPS"
];

test("every required seam is reviewed and every seam uses one allowed classification", () => {
  const source = fs.readFileSync(reviewPath, "utf8");

  for (const seam of [
    "Real map seam",
    "Real readiness seam",
    "Real authorization seam",
    "Real surface seam",
    "Real lifecycle-owner seam",
    "Real snapshot seam",
    "Real draw seam",
    "Real scheduler seam",
    "Real listener seam",
    "Real cleanup seam",
    "Real diagnostics seam"
  ]) {
    assert.match(source, new RegExp(`### ${seam.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`));
  }

  const found = [...source.matchAll(/`(READY_FOR_ADAPTER|READY_WITH_NARROW_WRAPPER|BLOCKED_BY_MISSING_CONTRACT|BLOCKED_BY_LIFECYCLE_MISMATCH|BLOCKED_BY_IDENTITY_RISK|BLOCKED_BY_CLEANUP_RISK|NOT_APPLICABLE)`/g)].map((match) => match[1]);
  for (const classification of found) {
    assert.ok(allowedClassifications.includes(classification));
  }
  assert.ok(found.length >= 11);
});

test("every blocker has a next step and forbidden events remain forbidden", () => {
  const source = fs.readFileSync(reviewPath, "utf8");

  for (const phrase of [
    "smallest safe next step",
    "forbidden events",
    "`move`",
    "`drag`",
    "`mousemove`",
    "`touchmove`"
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"), "i"));
  }
});

test("review keeps live startup and live exposure disconnected in this phase", () => {
  const review = fs.readFileSync(reviewPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  const appSource = fs.readFileSync(appPath, "utf8");

  assert.match(review, /no live map attachment/i);
  assert.match(review, /no persistent controls exposed on `window`/i);
  assert.match(review, /no startup behavior enabled/i);

  assert.doesNotMatch(scriptSource, /PersistentAtlas/i);
  assert.doesNotMatch(appSource, /createControlledPersistentAtlasAdapterComposition/);
  assert.doesNotMatch(appSource, /createPersistentControllerFromComposition/);
  assert.doesNotMatch(appSource, /getPersistentAdapterCompositionStatus/);
});

test("review references the proven one-frame Safari fixes and keeps all canonical safety flags false", () => {
  const source = fs.readFileSync(reviewPath, "utf8");

  assert.match(source, /cycle-safe lifecycle translation with `WeakSet`/);
  assert.match(source, /mutable snapshot-position handoff/);
  assert.match(source, /Leaflet readonly Canvas-position fallback/);
  assert.match(source, /module cache-busting and runtime identity checks/);
  assert.match(source, /`runtimeExecutionEnabled = false`/);
  assert.match(source, /`mapAttachmentAllowed = false`/);
  assert.match(source, /`automaticRendererExecutionAllowed = false`/);
  assert.match(source, /`lifecycleExecutionEnabled = false`/);
});

test("review recommendation is exactly one allowed value", () => {
  const source = fs.readFileSync(reviewPath, "utf8");
  const found = [...source.matchAll(/`(READY_FOR_DISCONNECTED_LIVE_ADAPTER_IMPLEMENTATION|READY_ONLY_FOR_MORE_FAKE_COMPOSITION|BLOCKED_BY_LIVE_SEAM_GAPS|BLOCKED_BY_CLEANUP_GAPS|BLOCKED_BY_IDENTITY_GAPS)`/g)].map((match) => match[1]);
  const unique = [...new Set(found)];

  assert.deepEqual(unique, ["BLOCKED_BY_CLEANUP_GAPS"]);
  assert.ok(allowedRecommendations.includes(unique[0]));
});
