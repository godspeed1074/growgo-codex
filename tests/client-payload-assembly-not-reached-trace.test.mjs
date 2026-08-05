import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
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
    "GROWGO_SESSION_211_50W_PAYLOAD_ASSEMBLY_NOT_REACHED_TRACE.md"
  ),
  "utf8"
);

test("phase 211.50w adapter source locks the payload-assembly-not-reached markers", () => {
  for (const marker of [
    "payloadAssemblyEntryMarked",
    "payloadAssemblyEntryFunction",
    "payloadAssemblyNotReachedBranchReason",
    "payloadAssemblyNotReachedReturnReason",
    "postDrawBridgeNextFunction",
    "adapter.createDrawOperation",
    "adapter.prepareOneFrameSurface",
    "adapter.translatePreparedSurfaceToLifecycleBundle",
    "adapter.resolveSnapshotCompatibleMap"
  ]) {
    assert.match(
      adapterSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50w evidence records the manual Safari not-reached procedure", () => {
  assert.match(
    evidenceSource,
    /GROWGO SESSION 211\.50w — Payload Assembly Not Reached Trace/i
  );
  assert.match(evidenceSource, /getCustom25DOneFramePreSnapshotHandoffTrace/);
  assert.match(evidenceSource, /payloadAssemblyEntryMarked/);
  assert.match(evidenceSource, /payloadAssemblyNotReachedBranchReason/);
  assert.match(evidenceSource, /payloadAssemblyNotReachedReturnReason/);
  assert.match(evidenceSource, /postDrawBridgeNextFunction/);
  assert.match(evidenceSource, /http:\/\/127\.0\.0\.1:8000/);
});
