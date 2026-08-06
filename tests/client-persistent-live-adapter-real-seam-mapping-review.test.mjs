import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const reviewPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_58_PERSISTENT_LIVE_ADAPTER_REAL_SEAM_MAPPING_REVIEW.md"
);
const liveAdapterPath = path.join(
  repoRoot,
  "client/developer-only-controlled-persistent-atlas-live-adapter.mjs"
);
const scriptPath = path.join(repoRoot, "script.js");
const appPath = path.join(repoRoot, "client/development-alpha-app.mjs");

const allowedClassifications = [
  "DIRECTLY_REUSABLE",
  "REUSABLE_WITH_NARROW_WRAPPER",
  "REQUIRES_NEW_PERSISTENT_CONTRACT",
  "BLOCKED_BY_CLEANUP_GAP",
  "BLOCKED_BY_IDENTITY_GAP",
  "BLOCKED_BY_AUTHORIZATION_GAP",
  "BLOCKED_BY_SCHEDULER_GAP",
  "NOT_READY"
];

const allowedRecommendations = [
  "READY_FOR_DISCONNECTED_REAL_SEAM_ADAPTERS",
  "READY_ONLY_FOR_SURFACE_AND_CLEANUP_WRAPPERS",
  "BLOCKED_BY_AUTHORIZATION_CONTRACT",
  "BLOCKED_BY_SCHEDULER_AND_LISTENER_CONTRACTS",
  "BLOCKED_BY_MULTIPLE_LIVE_GAPS"
];

test("all 13 adapter seams are mapped and each uses one allowed classification", () => {
  const source = fs.readFileSync(reviewPath, "utf8");

  for (const seam of [
    "rawMapProvider seam",
    "readinessProvider seam",
    "authorizationStatusProvider seam",
    "identitySnapshotProvider seam",
    "retainedSurfaceProvider seam",
    "retainedLifecycleOwnerProvider seam",
    "frameSnapshotProvider seam",
    "frameDrawProvider seam",
    "animationFrameScheduler seam",
    "animationFrameCanceller seam",
    "approvedListenerRegistrar seam",
    "approvedListenerRemover seam",
    "retainedCleanupProvider seam"
  ]) {
    assert.match(source, new RegExp(`### ${seam.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`));
  }

  const found = [
    ...source.matchAll(
      /`(DIRECTLY_REUSABLE|REUSABLE_WITH_NARROW_WRAPPER|REQUIRES_NEW_PERSISTENT_CONTRACT|BLOCKED_BY_CLEANUP_GAP|BLOCKED_BY_IDENTITY_GAP|BLOCKED_BY_AUTHORIZATION_GAP|BLOCKED_BY_SCHEDULER_GAP|NOT_READY)`/g
    )
  ].map((match) => match[1]);

  for (const classification of found) {
    assert.ok(allowedClassifications.includes(classification));
  }

  assert.ok(found.length >= 13);
});

test("each blocker has a smallest next step and one-frame authorization is not silently reused as persistent authorization", () => {
  const source = fs.readFileSync(reviewPath, "utf8");

  assert.match(source, /smallest safe next step/i);
  assert.match(source, /must not be silently reused/i);
  assert.match(source, /consume-once/i);
  assert.match(source, /requires a separate persistent authorization contract/i);
});

test("listener whitelist stays exact and scheduler and canceller are reviewed separately", () => {
  const source = fs.readFileSync(reviewPath, "utf8");

  for (const phrase of [
    "`moveend`",
    "`zoomend`",
    "`resize`",
    "`move`",
    "`drag`",
    "`mousemove`",
    "`touchmove`",
    "### animationFrameScheduler seam",
    "### animationFrameCanceller seam"
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"), "i"));
  }
});

test("retained cleanup order is explicit and Safari-specific fixes are referenced", () => {
  const source = fs.readFileSync(reviewPath, "utf8");

  for (const phrase of [
    "cancel queued frame",
    "remove listeners",
    "remove Canvas",
    "release lifecycle owner",
    "cycle-safe lifecycle translation with `WeakSet`",
    "mutable snapshot-position handoff",
    "Leaflet readonly Canvas-position fallback",
    "module cache-busting and runtime identity checks"
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"), "i"));
  }
});

test("review adds no live adapter wiring, no window exposure, and no new live browser activation", () => {
  const review = fs.readFileSync(reviewPath, "utf8");
  const liveAdapterSource = fs.readFileSync(liveAdapterPath, "utf8");
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");

  assert.match(review, /no live adapter instance created/i);
  assert.match(review, /no `window` exposure/i);
  assert.match(review, /no Canvas creation/i);
  assert.match(review, /no listener registration/i);
  assert.match(review, /no `requestAnimationFrame` scheduling/i);

  assert.doesNotMatch(liveAdapterSource, /\bwindow\b/);
  assert.doesNotMatch(liveAdapterSource, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(liveAdapterSource, /getGrowGoMap\(/);
  assert.doesNotMatch(liveAdapterSource, /requestAnimationFrame/);

  assert.doesNotMatch(appSource, /createControlledPersistentAtlasLiveAdapter\(/);
  assert.doesNotMatch(scriptSource, /createControlledPersistentAtlasLiveAdapter\(/);
});

test("canonical safety flags remain false and overall recommendation is exactly one allowed value", () => {
  const source = fs.readFileSync(reviewPath, "utf8");

  for (const flag of [
    "`runtimeExecutionEnabled = false`",
    "`mapAttachmentAllowed = false`",
    "`automaticRendererExecutionAllowed = false`",
    "`lifecycleExecutionEnabled = false`"
  ]) {
    assert.match(source, new RegExp(flag.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")));
  }

  const found = [
    ...source.matchAll(
      /`(READY_FOR_DISCONNECTED_REAL_SEAM_ADAPTERS|READY_ONLY_FOR_SURFACE_AND_CLEANUP_WRAPPERS|BLOCKED_BY_AUTHORIZATION_CONTRACT|BLOCKED_BY_SCHEDULER_AND_LISTENER_CONTRACTS|BLOCKED_BY_MULTIPLE_LIVE_GAPS)`/g
    )
  ].map((match) => match[1]);
  const unique = [...new Set(found)];

  assert.deepEqual(unique, ["BLOCKED_BY_MULTIPLE_LIVE_GAPS"]);
  assert.ok(allowedRecommendations.includes(unique[0]));
});
