import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_13_SAFARI_AUTOMATIC_REPOPULATION_VERIFICATION.md"
);

test("phase 212.13 evidence records the real Safari verification environment and startup-off proof", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(source, /Commit tested:\s+- `b9905c8`/);
  assert.match(source, /Verification browser:\s+- `Safari`/);
  assert.match(source, /Safari version:\s+- `26\.6`/);
  assert.match(source, /Local URL:\s+- `http:\/\/127\.0\.0\.1:8000\/\?atlas21213=1`/);
  assert.match(source, /`automaticPopulationEnabled = false`/);
  assert.match(source, /`automaticStartupPopulationDetected = false`/);
  assert.match(source, /`runtimeExecutionEnabled = false`/);
  assert.match(source, /`mapAttachmentAllowed = false`/);
  assert.match(source, /`automaticRendererExecutionAllowed = false`/);
  assert.match(source, /`lifecycleExecutionEnabled = false`/);
});

test("phase 212.13 evidence records approved Bellarine readiness and healthy persistent attach", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /`\[-38\.12436167080344, 144\.609432220459\]`/);
  assert.match(source, /`diagnosticStatus = resolved`/);
  assert.match(source, /`reasonCode = RESOLVED`/);
  assert.match(source, /`rendererHandoffStatus = ready_for_future_renderer_attachment`/);
  assert.match(source, /`rendererIdentityValidated = true`/);
  assert.match(
    source,
    /`regionId = REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION`/
  );
  assert.match(
    source,
    /`packageId = ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001`/
  );
  assert.match(source, /`recipeId = COASTAL_LOCATION_RECIPE_001`/);
  assert.match(
    source,
    /`reasonCode = AUTHORIZED_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION`/
  );
  assert.match(source, /`reasonCode = ATTACH_COMPLETED`/);
  assert.match(source, /`sessionId = LIVE_PERSISTENT_ATLAS_SESSION_001`/);
  assert.match(source, /`integrationState = attached_idle`/);
  assert.match(source, /`ownedCanvasCount = 1`/);
  assert.match(source, /`ownedPaneCount = 1`/);
  assert.match(source, /`ownedListenerCount = 3`/);
  assert.match(source, /`redrawCompletedCount = 1`/);
});

test("phase 212.13 evidence preserves the real automatic-enable blocker honestly", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /enableControlledAutomaticAtlasPopulation\(\{ confirmation: "ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION" \}\)/
  );
  assert.match(source, /`command = enableControlledAutomaticAtlasPopulation`/);
  assert.match(source, /`outcome = blocked`/);
  assert.match(source, /`reasonCode = PERSISTENT_ATLAS_UNAUTHORIZED`/);
  assert.match(source, /`automaticPopulationEnabled = false`/);
  assert.match(source, /`controllerState = disabled`/);
  assert.match(source, /`ownedAutomaticListenerCount = 0`/);
  assert.match(source, /Moveend \/ zoomend \/ resize \/ coalescing \/ determinism/);
  assert.match(source, /These verification steps were not reached\./);
  assert.match(
    source,
    /`ATLAS_AUTOMATIC_REPOPULATION_BLOCKED_BY_CONTROLLER`/
  );
});

test("phase 212.13 evidence records clean detach and screenshot preservation", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /`command = detachControlledPersistentAtlas`/);
  assert.match(source, /`outcome = released`/);
  assert.match(source, /`reasonCode = RELEASED`/);
  assert.match(source, /`cleanupCompleted = true`/);
  assert.match(source, /`referencesReleased = true`/);
  assert.match(source, /`cleanupAttemptCount = 1`/);
  assert.match(source, /`ownedCanvasCount = 0`/);
  assert.match(source, /`ownedPaneCount = 0`/);
  assert.match(source, /`ownedListenerCount = 0`/);
  assert.match(
    source,
    /\/private\/tmp\/growgo-atlas-212-13-safari-automatic-repopulation\.png/
  );
});
