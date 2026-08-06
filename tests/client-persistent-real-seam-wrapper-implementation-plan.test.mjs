import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const repoRoot =
  "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex";
const docPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_63_PERSISTENT_REAL_SEAM_WRAPPER_IMPLEMENTATION_PLAN.md"
);
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const scriptPath = path.join(repoRoot, "script.js");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("211.63 plan doc exists and remains planning-only", () => {
  const source = read(docPath);

  assert.match(source, /PERSISTENT REAL-SEAM WRAPPER IMPLEMENTATION PLAN/);
  assert.match(source, /This phase is planning and verification only\./);
  assert.match(source, /No live wrapper is implemented here\./);
  assert.match(source, /do not implement the wrappers/);
  assert.match(source, /do not expose persistent commands on `window`/);
  assert.match(source, /do not create a real Canvas/);
  assert.match(source, /do not register real listeners/);
  assert.match(source, /do not schedule real animation frames/);
  assert.match(source, /do not invoke the renderer/);
});

test("211.63 plan covers every persistent adapter seam with exact planned wrapper APIs", () => {
  const source = read(docPath);

  const seamSections = [
    "Persistent map wrapper",
    "Persistent readiness wrapper",
    "Persistent authorization-status wrapper",
    "Persistent identity wrapper",
    "Persistent retained-surface wrapper",
    "Persistent lifecycle-owner wrapper",
    "Persistent snapshot wrapper",
    "Persistent draw wrapper",
    "Browser scheduler wrapper",
    "Leaflet listener wrapper",
    "Persistent cleanup wrapper",
    "Persistent diagnostics wrapper"
  ];

  for (const section of seamSections) {
    assert.match(source, new RegExp(section.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")));
  }

  const seamNames = [
    "rawMapProvider",
    "readinessProvider",
    "authorizationStatusProvider",
    "identitySnapshotProvider",
    "retainedSurfaceProvider",
    "retainedLifecycleOwnerProvider",
    "frameSnapshotProvider",
    "frameDrawProvider",
    "animationFrameScheduler",
    "animationFrameCanceller",
    "approvedListenerRegistrar",
    "approvedListenerRemover",
    "retainedCleanupProvider"
  ];

  for (const seam of seamNames) {
    assert.match(source, new RegExp(`\\\`${seam}\\\``));
  }

  const apis = [
    "createPersistentAtlasMapProvider(...)",
    "getPersistentAtlasMapIdentity(...)",
    "createPersistentAtlasReadinessProvider(...)",
    "validatePersistentAtlasReadiness(...)",
    "createPersistentAtlasAuthorizationProvider(...)",
    "createPersistentAtlasIdentitySnapshotProvider(...)",
    "createPersistentAtlasRetainedSurfaceProvider(...)",
    "validateRetainedAtlasSurface(...)",
    "createPersistentAtlasLifecycleOwnerProvider(...)",
    "createPersistentAtlasFrameSnapshotProvider(...)",
    "createPersistentAtlasFrameDrawProvider(...)",
    "createPersistentAtlasAnimationFrameScheduler(...)",
    "createPersistentAtlasAnimationFrameCanceller(...)",
    "createPersistentAtlasListenerRegistrar(...)",
    "createPersistentAtlasListenerRemover(...)",
    "createPersistentAtlasCleanupProvider(...)",
    "getPersistentAtlasLiveIntegrationStatus()"
  ];

  for (const api of apis) {
    assert.match(source, new RegExp(api.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")));
  }
});

test("211.63 plan cites exact source candidates and keeps runtime activation prohibited", () => {
  const source = read(docPath);

  const sourceCandidates = [
    "script.js:getCustom25DOneFrameBridge",
    "script.js:getGrowGoMap",
    "client/development-alpha-app.mjs",
    "client/developer-only-live-atlas-renderer-handoff-readiness.mjs:getAtlasRendererHandoffReadiness",
    "client/developer-only-controlled-persistent-atlas-authorization.mjs",
    "client/growgo-custom25d-live-one-frame-surface-operations.mjs:prepareOneFrameSurface",
    "client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs",
    "client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs",
    "script.js:createCustom25DFrameViewportSnapshotForOneFrame",
    "script.js:drawCustom25DMapCanvasWithFrameSnapshot",
    "script.js:drawCustom25DOneFrameFromSnapshot",
    "client/developer-only-atlas-map-attachment-controller.mjs"
  ];

  for (const candidate of sourceCandidates) {
    assert.match(source, new RegExp(candidate.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")));
  }

  assert.match(source, /no diagnostics\/global fallback at runtime/);
  assert.match(source, /do not touch `script.js` startup behavior/);
  assert.match(source, /do not touch development-alpha startup behavior/);
  assert.match(source, /do not activate persistent attachment/);
});

test("211.63 plan defines a dependency-safe implementation order and independently reviewable phases", () => {
  const source = read(docPath);

  const orderedSteps = [
    "1. identity/readiness/map wrappers",
    "2. authorization provider",
    "3. scheduler/canceller wrappers",
    "4. listener registrar/remover wrappers",
    "5. retained surface wrapper",
    "6. lifecycle owner wrapper",
    "7. snapshot wrapper",
    "8. draw wrapper",
    "9. cleanup provider",
    "10. disconnected real-seam composition",
    "11. focused fake-real hybrid tests",
    "12. developer-only manual command",
    "13. Safari manual verification",
    "14. persistent enablement decision"
  ];

  for (const step of orderedSteps) {
    assert.match(source, new RegExp(step.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")));
  }

  const phases = [
    "Phase 211.64 — Persistent Map, Readiness, and Identity Wrappers",
    "Phase 211.65 — Persistent Authorization Wrapper",
    "Phase 211.66 — Persistent Scheduler and Listener Wrappers",
    "Phase 211.67 — Persistent Retained Surface Wrapper",
    "Phase 211.68 — Persistent Lifecycle Owner Wrapper",
    "Phase 211.69 — Persistent Snapshot Wrapper",
    "Phase 211.70 — Persistent Draw Wrapper",
    "Phase 211.71 — Persistent Cleanup Wrapper",
    "Phase 211.72 — Disconnected Real-Seam Composition",
    "Phase 211.73 — Persistent Hybrid Verification",
    "Phase 211.74 — Developer-Only Persistent Manual Command",
    "Phase 211.75 — Safari Persistent Manual Verification and Enablement Decision"
  ];

  for (const phase of phases) {
    assert.match(source, new RegExp(phase.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")));
  }

  assert.match(source, /Keep each phase small enough to review and revert independently|Smallest safe implementation phases/);
  assert.match(source, /files explicitly forbidden from modification/);
  assert.match(source, /rollback boundary/);
  assert.match(source, /suggested commit/);
});

test("211.63 plan explicitly covers risk topics, safety flags, and exactly one recommendation", () => {
  const source = read(docPath);

  const risks = [
    "stale raw-map references",
    "readiness drift",
    "persistent authorization misuse",
    "duplicate Canvas",
    "duplicate pane",
    "duplicate lifecycle owner",
    "duplicate listeners",
    "stale animation-frame callbacks",
    "redraw recursion",
    "parallel draws",
    "cleanup after partial attach",
    "cleanup after draw failure",
    "frozen browser-object cycles",
    "readonly Leaflet position mutation",
    "Safari module-cache delivery",
    "accidental startup activation",
    "accidental window exposure"
  ];

  for (const risk of risks) {
    assert.match(source, new RegExp(risk.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")));
  }

  assert.match(source, /runtimeExecutionEnabled = false/);
  assert.match(source, /mapAttachmentAllowed = false/);
  assert.match(source, /automaticRendererExecutionAllowed = false/);
  assert.match(source, /lifecycleExecutionEnabled = false/);

  const allowedRecommendations = [
    "READY_TO_IMPLEMENT_REAL_SEAM_WRAPPERS_INCREMENTALLY",
    "READY_ONLY_FOR_MAP_IDENTITY_READINESS_WRAPPERS",
    "BLOCKED_BY_SURFACE_LIFECYCLE_DESIGN",
    "BLOCKED_BY_CLEANUP_DESIGN",
    "BLOCKED_BY_UNRESOLVED_LIVE_DEPENDENCIES"
  ];

  const matches = allowedRecommendations.filter((value) => source.includes(`\`${value}\``));
  assert.deepEqual(matches, ["READY_TO_IMPLEMENT_REAL_SEAM_WRAPPERS_INCREMENTALLY"]);
});

test("211.63 planning phase does not add live implementation references to startup files", () => {
  const appSource = read(appPath);
  const scriptSource = read(scriptPath);

  assert.doesNotMatch(appSource, /createPersistentAtlasMapProvider\(/);
  assert.doesNotMatch(appSource, /createPersistentAtlasReadinessProvider\(/);
  assert.doesNotMatch(appSource, /createPersistentAtlasAuthorizationProvider\(/);
  assert.doesNotMatch(appSource, /createPersistentAtlasLiveIntegrationStatus\(/);
  assert.doesNotMatch(scriptSource, /attach persistent Atlas/i);
  assert.doesNotMatch(scriptSource, /createPersistentAtlasFrameDrawProvider\(/);
});
