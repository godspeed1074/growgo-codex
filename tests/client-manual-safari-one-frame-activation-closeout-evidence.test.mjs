import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_50AQ_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_CLOSEOUT.md"
);

test("phase 211.50aq closeout records the final successful real Safari one-frame execution exactly", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(source, /verification browser:\s+- `Safari`/);
  assert.match(source, /development page:\s+- `http:\/\/127\.0\.0\.1:8000`/);
  assert.match(source, /approved map scope:\s+- `Bellarine`/);
  assert.match(source, /approved Bellarine coordinate used during manual verification:\s+- `\[-38\.12, 144\.61\]`/);
  assert.match(source, /schemaId = ATLAS_CUSTOM25D_ONE_FRAME_COMMAND_RESULT_001/);
  assert.match(source, /outcome = completed/);
  assert.match(source, /reasonCode = MANUAL_GATED_ONE_FRAME_COMMAND_COMPLETED/);
  assert.match(source, /commandState = completed/);
  assert.match(source, /frameSnapshotCreated = true/);
  assert.match(source, /drawAttemptCount = 1/);
  assert.match(source, /completedFrameCount = 1/);
  assert.match(source, /animationFrameScheduleCount = 1/);
  assert.match(source, /paintBoundaryReached = true/);
  assert.match(source, /MANUAL_SAFARI_ONE_FRAME_ACTIVATION_VERIFIED/);
});

test("phase 211.50aq closeout records cleanup proof isolation proof and canonical false safety flags", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /cleanupAttemptCount = 1/);
  assert.match(source, /cleanupCompleted = true/);
  assert.match(source, /cleanupFailed = false/);
  assert.match(source, /cleanupFailureReasons = \[\]/);
  assert.match(source, /referencesReleased = true/);
  assert.match(source, /permanentlyClosed = true/);
  assert.match(source, /automaticInvocation = false/);
  assert.match(source, /networkRequested = false/);
  assert.match(source, /assetDownloadRequested = false/);
  assert.match(source, /runtimeExecutionEnabled = false/);
  assert.match(source, /mapAttachmentAllowed = false/);
  assert.match(source, /automaticRendererExecutionAllowed = false/);
  assert.match(source, /lifecycleExecutionEnabled = false/);
  assert.match(source, /no listener remained/);
  assert.match(source, /no persistent Canvas remained/);
  assert.match(source, /no persistent overlay remained/);
});

test("phase 211.50aq closeout preserves historical failures and records the major confirmed fixes", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /GROWGO_SESSION_211_50_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_VERIFICATION\.md/
  );
  assert.match(
    source,
    /GROWGO_SESSION_211_50B_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_RETEST\.md/
  );
  assert.match(source, /MAXIMUM_CALL_STACK_SIZE_EXCEEDED/);
  assert.match(source, /public `getGrowGoMap` recursion removed/);
  assert.match(source, /raw Leaflet map reference frozen into bridge/);
  assert.match(source, /command-to-adapter bridge injection fixed/);
  assert.match(source, /stale adapter\/map capture fixed/);
  assert.match(source, /Safari ES-module cache-busting added/);
  assert.match(
    source,
    /lifecycle translation `deepFreeze` made cycle-safe with `WeakSet`/
  );
  assert.match(source, /lifecycle owner sourced from `currentRefs`/);
  assert.match(
    source,
    /frozen snapshot position copied into mutable `\{ x, y \}`/
  );
  assert.match(
    source,
    /Leaflet canvas `_leaflet_pos` readonly fallback handled/
  );
  assert.match(source, /draw mutation trace completed cleanly/);
});

test("phase 211.50aq structured evidence proves one-session Safari success and preserved isolation guarantees", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"approvedScope": "Bellarine"/);
  assert.match(source, /"fresh": true/);
  assert.match(source, /"oneSessionOnly": true/);
  assert.match(source, /"authorizationConsumed": true/);
  assert.match(source, /"listenerRemains": false/);
  assert.match(source, /"persistentCanvasRemains": false/);
  assert.match(source, /"persistentOverlayRemains": false/);
  assert.match(source, /"firstSafariFailurePreserved": true/);
  assert.match(source, /"secondSafariFailurePreserved": true/);
  assert.match(source, /"drawMutationSequenceCompleted": true/);
  assert.match(source, /"drawMutationExceptionName": null/);
  assert.match(
    source,
    /"classification": "MANUAL_SAFARI_ONE_FRAME_ACTIVATION_VERIFIED"/
  );
});
