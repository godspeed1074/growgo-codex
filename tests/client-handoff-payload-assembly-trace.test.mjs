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
    "GROWGO_SESSION_211_50V_HANDOFF_PAYLOAD_ASSEMBLY_TRACE.md"
  ),
  "utf8"
);

test("phase 211.50v adapter source locks the handoff payload assembly trace markers", () => {
  for (const marker of [
    "handoffPayloadAssemblyStarted",
    "handoffPayloadAssemblyFunction",
    "surfaceInputPresent",
    "surfaceInputHasCanvas",
    "surfaceInputHasMap",
    "surfaceInputHasViewport",
    "handoffMapAssigned",
    "handoffCanvasAssigned",
    "handoffViewportAssigned",
    "handoffSnapshotCallbackAssigned",
    "handoffDrawCallbackAssigned",
    "handoffCreationBranchEntered",
    "handoffCreationSkippedReason",
    "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED",
    "adapter.assembleSnapshotHandoffPayload",
    "adapter.createSnapshotBridgeInput"
  ]) {
    assert.match(
      adapterSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("phase 211.50v evidence records the manual Safari handoff payload assembly procedure", () => {
  assert.match(
    evidenceSource,
    /GROWGO SESSION 211\.50v — Handoff Payload Assembly Trace/i
  );
  assert.match(evidenceSource, /getCustom25DOneFramePreSnapshotHandoffTrace/);
  assert.match(evidenceSource, /resetCustom25DOneFramePreSnapshotHandoffTrace/);
  assert.match(evidenceSource, /handoffPayloadAssemblyStarted/);
  assert.match(evidenceSource, /handoffPayloadAssemblyFunction/);
  assert.match(evidenceSource, /surfaceInputHasCanvas/);
  assert.match(evidenceSource, /handoffCreationSkippedReason/);
  assert.match(evidenceSource, /handoffMapAssigned/);
  assert.match(evidenceSource, /handoffSnapshotCallbackAssigned/);
  assert.match(evidenceSource, /http:\/\/127\.0\.0\.1:8000/);
});
