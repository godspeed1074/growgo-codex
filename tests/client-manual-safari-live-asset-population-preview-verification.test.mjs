import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_5_SAFARI_LIVE_ASSET_POPULATION_PREVIEW_VERIFICATION.md"
);

test("phase 212.5 evidence records the real Safari verification environment and approved Bellarine retry", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(
    source,
    /5ec246f feat\(atlas\): add developer asset population preview/
  );
  assert.match(source, /Verification browser:\s+- `Safari`/);
  assert.match(source, /Safari version:\s+- `26\.6`/);
  assert.match(source, /Development page:\s+- `http:\/\/127\.0\.0\.1:8000`/);
  assert.match(source, /Approved map scope:\s+- `Bellarine`/);
  assert.match(source, /`\[-38\.1264, 144\.6134\]`/);
  assert.match(source, /`latBucket = -38\.13`/);
  assert.match(source, /`\[-38\.12436167080344, 144\.609432220459\]`/);
  assert.match(source, /`latBucket = -38\.12`/);
  assert.match(source, /`lngBucket = 144\.61`/);
  assert.match(source, /`rendererHandoffStatus = ready_for_future_renderer_attachment`/);
  assert.match(source, /`reasonCode = HANDOFF_READY`/);
});

test("phase 212.5 evidence records successful live authorization attach and initial persistent draw", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /`outcome = authorized`/);
  assert.match(
    source,
    /`reasonCode = AUTHORIZED_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION`/
  );
  assert.match(source, /`outcome = attached`/);
  assert.match(source, /`reasonCode = ATTACH_COMPLETED`/);
  assert.match(source, /`sessionId = LIVE_PERSISTENT_ATLAS_SESSION_001`/);
  assert.match(source, /`ownedCanvasCount = 1`/);
  assert.match(source, /`ownedPaneCount = 1`/);
  assert.match(source, /`ownedListenerCount = 3`/);
  assert.match(source, /`integrationState = attached_idle`/);
  assert.match(source, /`redrawPermissionAllowed = true`/);
  assert.match(source, /`snapshotCompletedCount = 1`/);
  assert.match(source, /`drawCompletedCount = 1`/);
  assert.match(source, /`lastCompletedRedrawReason = initial_attach`/);
});

test("phase 212.5 evidence preserves the live preview authorization blocker honestly", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /`command = previewAtlasAssetPopulation`/);
  assert.match(source, /`outcome = failed_closed`/);
  assert.match(source, /`reasonCode = ATLAS_NOT_AUTHORIZED`/);
  assert.match(source, /`previewActive = false`/);
  assert.match(source, /`populationPlanId = null`/);
  assert.match(source, /`batchId = null`/);
  assert.match(source, /`plannedCommandCount = 0`/);
  assert.match(source, /`submittedCommandCount = 0`/);
  assert.match(source, /`drawCompleted = false`/);
  assert.match(source, /`previewReferenceCount = 0`/);
  assert.match(source, /`lastFailureReason = ATLAS_NOT_AUTHORIZED`/);
  assert.match(source, /`PREVIEW_COMMAND_BLOCKED_BEFORE_POPULATION_DRAW`/);
  assert.match(
    source,
    /`BLOCKED_BY_LIVE_PREVIEW_AUTHORIZATION_MISMATCH`/
  );
});

test("phase 212.5 evidence records duplicate protection clean detach and canonical false safety flags", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /Duplicate preview retry result:/);
  assert.match(source, /`duplicatePreviewBlocked\": true`|duplicatePreviewBlocked/);
  assert.match(source, /`command = clearAtlasAssetPopulationPreview`/);
  assert.match(source, /`previewClearCompleted = false`/);
  assert.match(source, /`outcome = released`/);
  assert.match(source, /`reasonCode = RELEASED`/);
  assert.match(source, /`cleanupCompleted = true`/);
  assert.match(source, /`referencesReleased = true`/);
  assert.match(source, /`finalOwnedCanvasCount\": 0`|`ownedCanvasCount = 0`/);
  assert.match(source, /`finalOwnedPaneCount\": 0`|`ownedPaneCount = 0`/);
  assert.match(source, /`finalOwnedListenerCount\": 0`|`ownedListenerCount = 0`/);
  assert.match(source, /`runtimeExecutionEnabled = false`/);
  assert.match(source, /`mapAttachmentAllowed = false`/);
  assert.match(source, /`automaticRendererExecutionAllowed = false`/);
  assert.match(source, /`lifecycleExecutionEnabled = false`/);
});
