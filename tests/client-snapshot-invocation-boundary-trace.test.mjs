import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const commandSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-command.mjs"
  ),
  "utf8"
);
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
    "GROWGO_SESSION_211_50O_SNAPSHOT_INVOCATION_BOUNDARY_TRACE.md"
  ),
  "utf8"
);

test("phase 211.50o command source exposes developer-only invocation-boundary trace diagnostics", () => {
  for (const marker of [
    "ATLAS_CUSTOM25D_ONE_FRAME_INVOCATION_BOUNDARY_TRACE_001",
    "resetCustom25DOneFrameInvocationBoundaryTrace",
    "getCustom25DOneFrameInvocationBoundaryTrace",
    "resetAtlasCustom25DOneFrameInvocationBoundaryTrace",
    "getAtlasCustom25DOneFrameInvocationBoundaryTrace",
    "__GROWGO_ATLAS_ONE_FRAME_INVOCATION_BOUNDARY_TRACE__",
    "traceInvocationBoundary",
    "INVOCATION_BOUNDARY_TRACE_LIMIT = 100"
  ]) {
    assert.match(
      commandSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50o command and adapter source lock the snapshot invocation boundary markers", () => {
  for (const marker of [
    "runAuthorizedAtlasCustom25DOneFrame",
    "command.adapter.executeDeveloperOnlyLiveOneFrameAdapter",
    "executeDeveloperOnlyLiveOneFrameAdapter",
    "adapter.resolveFrameSnapshotBridge",
    "adapter.translatePreparedSurfaceToLifecycleBundle",
    "adapter.resolveSnapshotCompatibleMap",
    "adapter.createSnapshotBridgeInput",
    "adapter.invokeFrameSnapshotBridge",
    "reachedSnapshotBridgeProvider",
    "reachedSnapshotArgumentConstruction",
    "reachedSnapshotBridgeInvocation",
    "reachedCreateCustom25DFrameViewportSnapshotCaller"
  ]) {
    const source = commandSource.includes(marker) ? commandSource : adapterSource;
    assert.match(
      source,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50o evidence records the manual Safari invocation-boundary procedure", () => {
  assert.match(
    evidenceSource,
    /GROWGO SESSION 211\.50o — Trace Snapshot Invocation Boundary/i
  );
  assert.match(
    evidenceSource,
    /getCustom25DOneFrameInvocationBoundaryTrace/
  );
  assert.match(
    evidenceSource,
    /resetCustom25DOneFrameInvocationBoundaryTrace/
  );
  assert.match(
    evidenceSource,
    /getAtlasCustom25DOneFrameInvocationBoundaryTrace/
  );
  assert.match(
    evidenceSource,
    /resetAtlasCustom25DOneFrameInvocationBoundaryTrace/
  );
  assert.match(evidenceSource, /runAuthorizedAtlasCustom25DOneFrame/);
  assert.match(evidenceSource, /executeDeveloperOnlyLiveOneFrameAdapter/);
  assert.match(evidenceSource, /adapter\.resolveFrameSnapshotBridge/);
  assert.match(evidenceSource, /adapter\.createSnapshotBridgeInput/);
  assert.match(evidenceSource, /adapter\.invokeFrameSnapshotBridge/);
  assert.match(evidenceSource, /last 100 calls/i);
  assert.match(evidenceSource, /http:\/\/127\.0\.0\.1:8000/);
});
