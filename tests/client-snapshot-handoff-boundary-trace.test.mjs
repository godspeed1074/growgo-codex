import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const adapterSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-live-one-frame-adapter.mjs"
  ),
  "utf8"
);
const evidenceSource = fs.readFileSync(
  path.join(
    repoRoot,
    "GROWGO_SESSION_211_50S_SNAPSHOT_HANDOFF_BOUNDARY_TRACE.md"
  ),
  "utf8"
);

test("phase 211.50s script source exposes developer-only snapshot handoff trace diagnostics", () => {
  for (const marker of [
    "getCustom25DOneFrameSnapshotHandoffTrace",
    "resetCustom25DOneFrameSnapshotHandoffTrace",
    "traceCustom25DOneFrameSnapshotHandoff",
    "GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE_001",
    "CUSTOM_25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE_LIMIT = 100"
  ]) {
    assert.match(
      scriptSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50s source locks the exact snapshot handoff boundary markers", () => {
  for (const marker of [
    "reachedSurfacePreparationCompletion",
    "reachedSnapshotHandoffCall",
    "reachedCreateCustom25DFrameViewportSnapshotForOneFrame",
    "reachedCreateCustom25DFrameViewportSnapshotPrivateImplementation",
    "reachedCreateCustom25DFrameViewportSnapshot",
    "reachedSnapshotReturn",
    "reachedFrameSnapshotCreatedAssignment",
    "adapter.invokeFrameSnapshotBridge",
    "adapter.assignFrameSnapshotCreated",
    "__GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE__"
  ]) {
    const source = scriptSource.includes(marker) ? scriptSource : adapterSource;
    assert.match(
      source,
      new RegExp(marker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50s evidence records the manual Safari snapshot handoff procedure", () => {
  assert.match(
    evidenceSource,
    /GROWGO SESSION 211\.50s — Snapshot Handoff Boundary Trace/i
  );
  assert.match(evidenceSource, /getCustom25DOneFrameSnapshotHandoffTrace/);
  assert.match(evidenceSource, /resetCustom25DOneFrameSnapshotHandoffTrace/);
  assert.match(evidenceSource, /createCustom25DFrameViewportSnapshotForOneFrame/);
  assert.match(
    evidenceSource,
    /createCustom25DFrameViewportSnapshotPrivateImplementation/
  );
  assert.match(evidenceSource, /createCustom25DFrameViewportSnapshot/);
  assert.match(evidenceSource, /frameSnapshotCreated/);
  assert.match(evidenceSource, /last 100 calls/i);
  assert.match(evidenceSource, /http:\/\/127\.0\.0\.1:8000/);
});
