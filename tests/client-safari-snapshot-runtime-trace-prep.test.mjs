import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const traceSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-execution-trace.mjs"
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
    "GROWGO_SESSION_211_50I_SAFARI_SNAPSHOT_RUNTIME_TRACE.md"
  ),
  "utf8"
);

test("phase 211.50i trace install exposes both reset and read helpers for real Safari runtime capture", () => {
  assert.match(traceSource, /trace\.reset,/);
  assert.match(
    traceSource,
    /namespace\.resetAtlasCustom25DOneFrameExecutionTrace = \(reasonCode\) =>/
  );
  assert.match(
    traceSource,
    /namespace\.getAtlasCustom25DOneFrameExecutionTrace = \(\) =>/
  );
});

test("phase 211.50i adapter source locks the real snapshot runtime trace points", () => {
  for (const marker of [
    "traceSafariSnapshotRuntime",
    "devicePixelRatioProvider",
    "resolveSnapshotMapTarget",
    "defaultSnapshotMapNormalizer",
    "normalizedSnapshotMap.getSize",
    "normalizedSnapshotMap.getBounds",
    "normalizedSnapshotMap.latLngToLayerPoint",
    "normalizedSnapshotMap.getZoom"
  ]) {
    assert.match(adapterSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("phase 211.50i evidence records the exact Safari runtime trace preparation procedure", () => {
  assert.match(
    evidenceSource,
    /GROWGO SESSION 211\.50i — Safari Snapshot Runtime Trace/i
  );
  assert.match(
    evidenceSource,
    /resetAtlasCustom25DOneFrameExecutionTrace/
  );
  assert.match(
    evidenceSource,
    /getAtlasCustom25DOneFrameExecutionTrace/
  );
  assert.match(evidenceSource, /createCustom25DFrameViewportSnapshotForOneFrame/);
  assert.match(
    evidenceSource,
    /createCustom25DFrameViewportSnapshotPrivateImplementation/
  );
  assert.match(evidenceSource, /createCustom25DFrameViewportSnapshot/);
  assert.match(evidenceSource, /defaultSnapshotMapNormalizer/);
  assert.match(evidenceSource, /resolveSnapshotMapTarget/);
  assert.match(evidenceSource, /normalizedSnapshotMap\.getSize/);
  assert.match(evidenceSource, /normalizedSnapshotMap\.getBounds/);
  assert.match(evidenceSource, /normalizedSnapshotMap\.latLngToLayerPoint/);
  assert.match(evidenceSource, /devicePixelRatioProvider/);
  assert.match(evidenceSource, /http:\/\/127\.0\.0\.1:8000/);
  assert.match(evidenceSource, /last 50 calls/i);
});
