import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_7_LIVE_PAGE_DEFAULT_DENIED_ATLAS_ATTACHMENT_VERIFICATION.md"
);

test("phase 211.7 evidence record preserves completed default-denied live-page truth", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"executionStatus": "PASS"/);
  assert.match(source, /overall Phase 211\.7: `PASS`/);
  assert.match(source, /no application implementation changes were made in Phase 211\.7/i);
  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"developmentPageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(
    source,
    /feat\(atlas\): implement gated developer map attachment controller/
  );
});

test("phase 211.7 evidence record documents the verified live denied attach flow", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"source": "canonical"/);
  assert.match(source, /"seamApplied": false/);
  assert.match(source, /"canonicalMapAttachmentAllowed": false/);
  assert.match(source, /"effectiveMapAttachmentAllowed": false/);
  assert.match(source, /"attachAllowed": false/);
  assert.match(source, /"attached": false/);
  assert.match(source, /"ownedListenerCount": 0/);
  assert.match(source, /"diagnosticInvocationCount": 0/);
  assert.match(source, /"listenerEventName": "moveend"/);
  assert.match(source, /"automaticStartupAttachment": false/);
  assert.match(source, /"livePageDetachedByDefault": true/);
  assert.match(source, /MAP_ATTACHMENT_NOT_AUTHORIZED/);
  assert.match(source, /ALREADY_DETACHED/);
  assert.match(source, /"operation": "detach"/);
  assert.match(source, /"outcome": "noop"/);
  assert.match(source, /"lastDiagnosticStatus": null/);
  assert.match(source, /"lastReasonCode": null/);
});

test("phase 211.7 evidence record preserves canonical safety flags and no-op pan zoom observations", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
  assert.match(source, /"rendererActivity": false/);
  assert.match(source, /"overlayActivity": false/);
  assert.match(source, /"networkActivity": false/);
  assert.match(source, /"pollingOrTimerActivity": false/);
  assert.match(source, /diagnosticInvocationCount` remained `0`/);
  assert.match(source, /ownedListenerCount` remained `0`/);
  assert.match(source, /no Atlas listener appeared/);
  assert.match(source, /normal map behaviour remained unchanged/);
});
