import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_14_MANUAL_SAFARI_ZERO_DRAW_RENDERER_HANDOFF_READINESS_VERIFICATION.md"
);

test("phase 211.14 records Safari localhost execution and clean closeout truth", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(
    source,
    /feat\(atlas\): expose explicit zero-draw renderer handoff readiness diagnostic/
  );
  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"developmentPageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(source, /"executionStatus": "PASS"/);
  assert.match(source, /overall Phase 211\.14:\s+- `PASS`/);
  assert.match(source, /application implementation files changed during closeout:\s+- `none`/);
});

test("phase 211.14 records the detached initial and final controller state", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"schemaId": "ATLAS_MAP_ATTACHMENT_CONTROLLER_STATUS_001"/);
  assert.match(source, /"attached": false/);
  assert.match(source, /"source": "canonical"/);
  assert.match(source, /"seamApplied": false/);
  assert.match(source, /"canonicalMapAttachmentAllowed": false/);
  assert.match(source, /"effectiveMapAttachmentAllowed": false/);
  assert.match(source, /"attachAllowed": false/);
  assert.match(source, /"listenerEventName": "moveend"/);
  assert.match(source, /"ownedListenerCount": 0/);
  assert.match(source, /"diagnosticInvocationCount": 0/);
  assert.match(source, /"lastDiagnosticStatus": null/);
  assert.match(source, /"lastReasonCode": null/);
  assert.match(source, /"automaticStartupAttachment": false/);
  assert.match(source, /"livePageDetachedByDefault": true/);
});

test("phase 211.14 records the approved Bellarine readiness result", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /"schemaId": "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001"/
  );
  assert.match(source, /"latitude": -38\.12/);
  assert.match(source, /"longitude": 144\.61/);
  assert.match(source, /"latBucket": -38\.12/);
  assert.match(source, /"lngBucket": 144\.61/);
  assert.match(source, /"diagnosticStatus": "resolved"/);
  assert.match(source, /"reasonCode": "RESOLVED"/);
  assert.match(
    source,
    /REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION/
  );
  assert.match(source, /"environmentProfile": "COASTAL_EXPLORATION"/);
  assert.match(
    source,
    /ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001/
  );
  assert.match(source, /"packageVersion": "v001"/);
  assert.match(
    source,
    /"packageFingerprint": "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"/
  );
  assert.match(source, /"recipeId": "COASTAL_LOCATION_RECIPE_001"/);
  assert.match(source, /"selectedVersion": "v001"/);
  assert.match(source, /"confidenceScore": 100/);
  assert.match(source, /"fallbackApplied": false/);
  assert.match(
    source,
    /"selectorSeed": "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0"/
  );
  assert.match(
    source,
    /"rendererHandoffStatus": "ready_for_future_renderer_attachment"/
  );
  assert.match(source, /"rendererConsumerAvailable": true/);
  assert.match(source, /"rendererIdentityValidated": true/);
  assert.match(source, /"reasonCode": "HANDOFF_READY"/);
});

test("phase 211.14 records the out-of-scope fail-closed result and restored approved result", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"latitude": -38\.10768216541524/);
  assert.match(source, /"longitude": 144\.6348810195923/);
  assert.match(source, /"latBucket": -38\.11/);
  assert.match(source, /"lngBucket": 144\.63/);
  assert.match(source, /"diagnosticStatus": "blocked"/);
  assert.match(source, /"reasonCode": "REGION_OUT_OF_SCOPE"/);
  assert.match(source, /"rendererHandoffStatus": "blocked"/);
  assert.match(source, /"resolvedRegion": null/);
  assert.match(source, /"resolvedPackage": null/);
  assert.match(source, /"resolvedRecipe": null/);
  assert.match(source, /"selectorSeed": null/);
  assert.match(source, /"rendererConsumerAvailable": true/);
  assert.match(source, /"rendererIdentityValidated": false/);
  assert.match(
    source,
    /returning to `-38\.12, 144\.61` restored the resolved readiness result/
  );
  assert.match(source, /"approvedRegionPackageRecipeRestoredCorrectly": true/);
  assert.match(source, /"staleRegionOutOfScopeStateRemained": false/);
  assert.match(source, /no stale blocked state remained/i);
});

test("phase 211.14 records zero-draw zero-side-effect guarantees and canonical false flags", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"rendererInitializationRequested": false/);
  assert.match(source, /"rendererAttached": false/);
  assert.match(source, /"drawRequested": false/);
  assert.match(source, /"canvasCreated": false/);
  assert.match(source, /"webglContextCreated": false/);
  assert.match(source, /"overlayCreated": false/);
  assert.match(source, /"listenerAdded": false/);
  assert.match(source, /"networkRequested": false/);
  assert.match(source, /"assetDownloadRequested": false/);
  assert.match(source, /"automaticInvocation": false/);
  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
  assert.match(source, /"ownedListenerCountRemainedZero": true/);
  assert.match(source, /"diagnosticInvocationCountRemainedZero": true/);
  assert.match(source, /"noRendererInitializationOccurred": true/);
  assert.match(source, /"noRendererAttachmentOccurred": true/);
  assert.match(source, /"noDrawingOccurred": true/);
  assert.match(source, /"noCanvasAppeared": true/);
  assert.match(source, /"noWebglSurfaceAppeared": true/);
  assert.match(source, /"noDomOverlayAppeared": true/);
  assert.match(source, /"noListenerWasAdded": true/);
  assert.match(source, /"noAtlasNetworkRequestOccurred": true/);
  assert.match(source, /"noAssetDownloadOccurred": true/);
  assert.match(source, /"noAutomaticInvocationOccurred": true/);
  assert.match(source, /"normalLeafletMapBehaviorRemainedUnchanged": true/);
});
