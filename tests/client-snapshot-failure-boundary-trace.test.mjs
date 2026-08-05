import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const evidenceSource = fs.readFileSync(
  path.join(
    repoRoot,
    "GROWGO_SESSION_211_50N_SNAPSHOT_FAILURE_BOUNDARY_TRACE.md"
  ),
  "utf8"
);

test("phase 211.50n script source exposes developer-only snapshot boundary trace diagnostics", () => {
  for (const marker of [
    "getCustom25DOneFrameSnapshotBoundaryTrace",
    "resetCustom25DOneFrameSnapshotBoundaryTrace",
    "traceCustom25DOneFrameSnapshotBoundary",
    "GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_BOUNDARY_TRACE_001",
    "CUSTOM_25D_ONE_FRAME_SNAPSHOT_BOUNDARY_TRACE_LIMIT = 100"
  ]) {
    assert.match(
      scriptSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50n script source locks the exact snapshot failure boundary markers", () => {
  for (const marker of [
    "createCustom25DFrameViewportSnapshotForOneFrame",
    "createCustom25DFrameViewportSnapshotPrivateImplementation",
    "createCustom25DFrameViewportSnapshot",
    "snapshot.validation",
    "snapshot.map.getSize",
    "snapshot.map.getBounds",
    "snapshot.bounds.getNorthWest",
    "snapshot.map.latLngToLayerPoint",
    "snapshot.window.devicePixelRatio",
    "snapshot.validation.result",
    "last100Calls",
    "lastFailedFunctionName",
    "previousFunctionNameBeforeFailure",
    "stackOverflowDetected",
    "reachedMapGetSize",
    "reachedMapGetBounds",
    "reachedNorthWestConversion",
    "reachedLatLngToLayerPoint",
    "reachedDevicePixelRatioRead",
    "createCustom25DFrameRootViewportSnapshotPresent"
  ]) {
    assert.match(
      scriptSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50n evidence records the manual Safari snapshot failure boundary procedure", () => {
  assert.match(
    evidenceSource,
    /GROWGO SESSION 211\.50n — Instrument Snapshot Creation Failure Boundary/i
  );
  assert.match(evidenceSource, /getCustom25DOneFrameSnapshotBoundaryTrace/);
  assert.match(evidenceSource, /resetCustom25DOneFrameSnapshotBoundaryTrace/);
  assert.match(evidenceSource, /createCustom25DFrameViewportSnapshotForOneFrame/);
  assert.match(
    evidenceSource,
    /createCustom25DFrameViewportSnapshotPrivateImplementation/
  );
  assert.match(evidenceSource, /createCustom25DFrameViewportSnapshot/);
  assert.match(evidenceSource, /snapshot\.map\.getSize/);
  assert.match(evidenceSource, /snapshot\.map\.getBounds/);
  assert.match(evidenceSource, /snapshot\.bounds\.getNorthWest/);
  assert.match(evidenceSource, /snapshot\.map\.latLngToLayerPoint/);
  assert.match(evidenceSource, /snapshot\.window\.devicePixelRatio/);
  assert.match(evidenceSource, /last 100 calls/i);
  assert.match(evidenceSource, /http:\/\/127\.0\.0\.1:8000/);
  assert.match(
    evidenceSource,
    /`createCustom25DFrameRootViewportSnapshot` is not present in the current live path/i
  );
});
