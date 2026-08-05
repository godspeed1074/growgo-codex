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
    "GROWGO_SESSION_211_50X_ADAPTER_POST_CALLBACK_RETURN_TRACE.md"
  ),
  "utf8"
);

test("phase 211.50x adapter source locks the post-callback return trace markers", () => {
  for (const marker of [
    "adapterPostCallbackResolutionNextStep",
    "adapterEarlyReturnReason",
    "adapterExecutionCompletionReason",
    "PAYLOAD_ASSEMBLY_REACHED",
    "HANDOFF_CREATION_REACHED",
    "SNAPSHOT_INVOCATION_REACHED",
    "adapter.createDrawOperation",
    "adapter.prepareOneFrameSurface",
    "adapter.resolveSnapshotCompatibleMap",
    "adapter.invokeSnapshotCallback"
  ]) {
    assert.match(
      adapterSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50x evidence records the manual Safari post-callback return procedure", () => {
  assert.match(
    evidenceSource,
    /GROWGO SESSION 211\.50x — Trace Adapter Return Path After Callback Resolution/i
  );
  assert.match(evidenceSource, /getCustom25DOneFramePreSnapshotHandoffTrace/);
  assert.match(evidenceSource, /adapterPostCallbackResolutionNextStep/);
  assert.match(evidenceSource, /adapterEarlyReturnReason/);
  assert.match(evidenceSource, /adapterExecutionCompletionReason/);
  assert.match(evidenceSource, /payload assembly/i);
  assert.match(evidenceSource, /http:\/\/127\.0\.0\.1:8000/);
});
