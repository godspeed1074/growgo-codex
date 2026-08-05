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
    "GROWGO_SESSION_211_50T_PRE_SNAPSHOT_HANDOFF_FAILURE_TRACE.md"
  ),
  "utf8"
);

test("phase 211.50t command source exposes developer-only pre-snapshot handoff trace diagnostics", () => {
  for (const marker of [
    "ATLAS_CUSTOM25D_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE_001",
    "resetCustom25DOneFramePreSnapshotHandoffTrace",
    "getCustom25DOneFramePreSnapshotHandoffTrace",
    "__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__",
    "ensurePreSnapshotHandoffTrace",
    "PRE_SNAPSHOT_HANDOFF_TRACE_LIMIT = 100"
  ]) {
    assert.match(
      commandSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50t command and adapter source lock the pre-snapshot handoff markers", () => {
  for (const marker of [
    "commandBridgePassed",
    "adapterEntryBridgeReceived",
    "snapshotCallbackExists",
    "snapshotCallbackCallable",
    "drawCallbackExists",
    "drawCallbackCallable",
    "handoffObjectCreated",
    "handoffObjectHasMap",
    "handoffObjectHasCanvas",
    "adapter.resolveFrameSnapshotBridge",
    "adapter.resolveDrawBridge",
    "adapter.createSnapshotBridgeInput",
    "adapter.invokeSnapshotCallback"
  ]) {
    const source = commandSource.includes(marker) ? commandSource : adapterSource;
    assert.match(
      source,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50t evidence records the manual Safari pre-snapshot handoff procedure", () => {
  assert.match(
    evidenceSource,
    /GROWGO SESSION 211\.50t — Pre-Snapshot Handoff Failure Boundary/i
  );
  assert.match(evidenceSource, /getCustom25DOneFramePreSnapshotHandoffTrace/);
  assert.match(evidenceSource, /resetCustom25DOneFramePreSnapshotHandoffTrace/);
  assert.match(evidenceSource, /snapshotCallbackExists/);
  assert.match(evidenceSource, /snapshotCallbackCallable/);
  assert.match(evidenceSource, /handoffObjectCreated/);
  assert.match(evidenceSource, /last 100 calls/i);
  assert.match(evidenceSource, /http:\/\/127\.0\.0\.1:8000/);
});
