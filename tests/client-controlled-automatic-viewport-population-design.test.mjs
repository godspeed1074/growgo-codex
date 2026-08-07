import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const designPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_8_CONTROLLED_AUTOMATIC_VIEWPORT_REPOPULATION_DESIGN.md"
);
const previewModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-controlled-viewport-population-preview.mjs"
);
const adapterModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-live-feature-input-adapter.mjs"
);
const schedulerContractPath = path.join(
  repoRoot,
  "client",
  "developer-only-controlled-persistent-atlas-scheduler-listener-contract.mjs"
);
const scriptPath = path.join(repoRoot, "script.js");

test("phase 212.8 design records branch, clean preflight, committed 212.6 checkpoint, and design-only posture", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(source, /`git status --short` at start:\s+- clean/);
  assert.match(
    source,
    /d84f797 feat\(atlas\): add controlled live viewport population/
  );
  assert.match(source, /This phase is design-only\./);
  assert.match(source, /No automatic population is implemented here\./);
  assert.match(source, /No startup population is enabled here\./);
});

test("phase 212.8 design restricts automatic triggers to moveend zoomend and resize only", () => {
  const source = fs.readFileSync(designPath, "utf8");
  const schedulerSource = fs.readFileSync(schedulerContractPath, "utf8");

  assert.match(source, /## Approved Event Policy/);
  assert.match(source, /- `moveend`/);
  assert.match(source, /- `zoomend`/);
  assert.match(source, /- `resize`/);
  assert.match(source, /- `move`/);
  assert.match(source, /- `drag`/);
  assert.match(source, /- `mousemove`/);
  assert.match(source, /- `touchmove`/);
  assert.match(source, /- `wheel`/);
  assert.match(source, /- timers/);
  assert.match(source, /- polling/);
  assert.match(source, /- startup population/);
  assert.match(
    schedulerSource,
    /const APPROVED_EVENTS = \["moveend", "zoomend", "resize"\];/
  );
});

test("phase 212.8 design defines one state machine one generation model and strict stale-work cancellation", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(source, /## Minimum Automatic State Machine/);
  assert.match(source, /- `disabled`/);
  assert.match(source, /- `attached_idle`/);
  assert.match(source, /- `viewport_change_detected`/);
  assert.match(source, /- `population_queued`/);
  assert.match(source, /- `reading_features`/);
  assert.match(source, /- `planning`/);
  assert.match(source, /- `submitting`/);
  assert.match(source, /- `drawing`/);
  assert.match(source, /- `replacing_population`/);
  assert.match(source, /- `cleanup_pending`/);
  assert.match(source, /- `invalidated`/);
  assert.match(source, /- `failed_closed`/);
  assert.match(source, /## Viewport Generation Contract/);
  assert.match(source, /- `viewportGenerationId`/);
  assert.match(source, /- `viewportIdentity`/);
  assert.match(source, /- `mapIdentityId`/);
  assert.match(source, /- `regionId`/);
  assert.match(source, /- `packageId`/);
  assert.match(source, /- `recipeId`/);
  assert.match(source, /- `selectorSeed`/);
  assert.match(source, /older queued work becomes stale immediately/);
  assert.match(source, /older planning results must not submit/);
  assert.match(source, /stale callbacks must be ignored/);
  assert.match(source, /partial mixing of old and new population is forbidden/);
});

test("phase 212.8 design defines one queued refresh max one active refresh max and one follow-up max", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(source, /## Coalescing Policy/);
  assert.match(source, /at most one refresh may be queued/);
  assert.match(source, /at most one refresh may be actively reading, planning, submitting, or drawing/);
  assert.match(source, /mark exactly one latest-generation follow-up/);
  assert.match(source, /do not increment parallel queued work/);
  assert.match(source, /no recursion/);
  assert.match(source, /no parallel planning/);
  assert.match(source, /no parallel draw submission/);
  assert.match(source, /no infinite repopulation loop/);
});

test("phase 212.8 design chooses deterministic full batch replacement and preserves old valid population during planning", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(source, /## Replacement Policy/);
  assert.match(source, /`FULL_DETERMINISTIC_BATCH_REPLACEMENT`/);
  assert.match(source, /keep current valid population visible while the next plan is being built/);
  assert.match(source, /never clear first unless a documented zoom or disable policy explicitly requires an empty batch/);
  assert.match(source, /replacement occurs at the command-batch level/);
  assert.match(source, /old population references are released only after successful new submission/);
  assert.match(source, /duplicate instance accumulation is forbidden/);
  assert.doesNotMatch(source, /partial spatial diffing is required/i);
});

test("phase 212.8 design defines explicit budgets zoom policy move skip policy and resize policy", () => {
  const source = fs.readFileSync(designPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");

  assert.match(source, /## Budget Policy/);
  assert.match(source, /`maxSourceFeaturesPerViewport = 64`/);
  assert.match(source, /`maxNormalizedFeatures = 48`/);
  assert.match(source, /`maxPopulationCommands = 24`/);
  assert.match(source, /`maxVegetationInstances = 18`/);
  assert.match(source, /`maxBuildingInstances = 6`/);
  assert.match(source, /`maximumAutomaticRefreshesPerCompletedViewportGeneration = 1`/);
  assert.match(source, /## Zoom Policy/);
  assert.match(source, /below `16\.2`/);
  assert.match(source, /`16\.2` to `< 16\.5`/);
  assert.match(source, /`16\.5` to `< 18`/);
  assert.match(source, /`>= 18`/);
  assert.match(source, /## Move Policy/);
  assert.match(source, /Population refresh only after:\s+\n\s*- `moveend`/);
  assert.match(source, /skippedUnchangedViewportCount/);
  assert.match(source, /## Resize Policy/);
  assert.match(source, /`resize` is approved/);
  assert.match(scriptSource, /function shouldDrawZoneDetailsAtZoom\(zoom, detailLevel = "medium"\)/);
  assert.match(scriptSource, /if \(detailLevel === "high"\) return zoom >= 18;/);
  assert.match(scriptSource, /function shouldDrawBuildingAtZoom\(zoom\) \{\s*return zoom >= 16\.2;/);
});

test("phase 212.8 design reuses the phase 212.6 adapter forbids public overpass queries and keeps diagnostics read only", () => {
  const source = fs.readFileSync(designPath, "utf8");
  const previewSource = fs.readFileSync(previewModulePath, "utf8");
  const adapterSource = fs.readFileSync(adapterModulePath, "utf8");

  assert.match(source, /## Feature Source Policy/);
  assert.match(source, /reuse the Phase 212\.6 live feature adapter/i);
  assert.match(source, /no direct public OSM\/Overpass query per client/);
  assert.match(source, /## Diagnostics Contract/);
  assert.match(source, /- `schemaId`/);
  assert.match(source, /- `automaticPopulationEnabled`/);
  assert.match(source, /- `currentViewportGenerationId`/);
  assert.match(source, /- `queuedViewportGenerationId`/);
  assert.match(source, /- `activeViewportGenerationId`/);
  assert.match(source, /- `followUpRefreshPending`/);
  assert.match(source, /- `refreshCoalescedCount`/);
  assert.match(source, /- `staleRefreshDiscardedCount`/);
  assert.match(source, /- `lastTriggerReason`/);
  assert.match(source, /No raw references may be exposed/);
  assert.match(previewSource, /extractDeveloperOnlyAtlasLiveViewportFeatures/);
  assert.doesNotMatch(adapterSource, /\bfetch\s*\(|Overpass/i);
});

test("phase 212.8 design defines failure cleanup invalidation and a staged roadmap without enabling live behavior", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(source, /## Readiness \/ Drift Policy/);
  assert.match(source, /persistent authorization/);
  assert.match(source, /attached state/);
  assert.match(source, /map identity/);
  assert.match(source, /lifecycle owner/);
  assert.match(source, /retained surface/);
  assert.match(source, /## Clear \/ Disable Policy/);
  assert.match(source, /block new refreshes/);
  assert.match(source, /invalidate the queued generation/);
  assert.match(source, /do not duplicate the full persistent cleanup path/);
  assert.match(source, /## Failure Policy/);
  assert.match(source, /Feature source unavailable/);
  assert.match(source, /Classification failure/);
  assert.match(source, /Planner failure/);
  assert.match(source, /Draw submission failure/);
  assert.match(source, /Identity drift/);
  assert.match(source, /Readiness blocked/);
  assert.match(source, /Cleanup failure/);
  assert.match(source, /## Cleanup Policy/);
  assert.match(source, /Canvas/);
  assert.match(source, /pane/);
  assert.match(source, /lifecycle owner/);
  assert.match(source, /## Implementation Roadmap/);
  assert.match(source, /212\.9 — Automatic Population Fake Runtime Contract/);
  assert.match(source, /212\.10 — Automatic Population Controller/);
  assert.match(source, /212\.11 — Disabled Live-Event Adapter/);
  assert.match(source, /212\.12 — Developer-Only Automatic Population Toggle/);
  assert.match(source, /212\.13 — Safari Automatic Repopulation Verification/);
  assert.match(source, /212\.14 — Performance and Budget Verification/);
  assert.match(source, /212\.15 — Enablement Decision/);
  assert.match(source, /This phase does not:\s*\n\n- enable automatic population/);
  assert.match(source, /`runtimeExecutionEnabled = false`/);
  assert.match(source, /`mapAttachmentAllowed = false`/);
  assert.match(source, /`automaticRendererExecutionAllowed = false`/);
  assert.match(source, /`lifecycleExecutionEnabled = false`/);
});
