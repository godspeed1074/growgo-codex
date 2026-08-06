import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const designPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_51_CONTROLLED_PERSISTENT_ATLAS_ATTACHMENT_DESIGN.md"
);

test("phase 211.51 design records the exact branch clean preflight and committed 211.50aq prerequisite", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(source, /`git status --short` at start:\s+- clean/);
  assert.match(source, /Phase 211\.50aq committed:\s+- `yes`/);
  assert.match(
    source,
    /bfe8056 test\(atlas\): close Safari one-frame activation evidence/
  );
  assert.match(source, /history rewritten:\s+- `no`/);
  assert.match(source, /one snapshot/);
  assert.match(source, /one draw/);
  assert.match(source, /one completed frame/);
  assert.match(source, /references released/);
});

test("phase 211.51 design defines the persistent ownership model state machine and idempotency contract", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(source, /## Ownership Model/);
  assert.match(source, /### Canvas owner/);
  assert.match(source, /### Pane owner/);
  assert.match(source, /### Listener owner/);
  assert.match(source, /### Lifecycle owner/);
  assert.match(source, /### Draw scheduler owner/);
  assert.match(source, /### Cleanup owner/);
  assert.match(source, /## State Machine/);
  assert.match(source, /- `detached`/);
  assert.match(source, /- `authorizing`/);
  assert.match(source, /- `attaching`/);
  assert.match(source, /- `attached_idle`/);
  assert.match(source, /- `redraw_queued`/);
  assert.match(source, /- `drawing`/);
  assert.match(source, /- `detaching`/);
  assert.match(source, /- `failed_closed`/);
  assert.match(source, /## Idempotency Contract/);
  assert.match(source, /repeated attach request does not create another Canvas/);
  assert.match(
    source,
    /repeated listener registration must be idempotent/
  );
  assert.match(source, /repeated detach is harmless/);
  assert.match(source, /redraw requests while drawing are coalesced/);
});

test("phase 211.51 design defines narrow redraw policy failure handling and read-only diagnostics", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(source, /## Redraw Policy/);
  assert.match(source, /- `moveend`/);
  assert.match(source, /- `zoomend`/);
  assert.match(source, /- `resize`/);
  assert.match(source, /one `requestAnimationFrame` may be scheduled at a time/);
  assert.match(source, /Stale snapshots must not be drawn\./);
  assert.match(source, /## Failure Handling Policy/);
  assert.match(source, /### Attach failure/);
  assert.match(source, /### Draw failure/);
  assert.match(source, /### Listener failure/);
  assert.match(source, /### Cleanup failure/);
  assert.match(source, /### Map identity drift/);
  assert.match(source, /### Region\/package\/recipe drift/);
  assert.match(source, /### Authorization invalidation/);
  assert.match(source, /## Diagnostics Contract/);
  assert.match(source, /- `ownedCanvasCount`/);
  assert.match(source, /- `ownedListenerCount`/);
  assert.match(source, /- `redrawCoalescedCount`/);
  assert.match(source, /- `lastFailureReason`/);
  assert.match(source, /- `currentRecipeIdentity`/);
  assert.match(source, /deeply immutable result objects/);
});

test("phase 211.51 design keeps all canonical safety flags false and remains design-only disconnected", () => {
  const source = fs.readFileSync(designPath, "utf8");

  assert.match(source, /`runtimeExecutionEnabled = false`/);
  assert.match(source, /`mapAttachmentAllowed = false`/);
  assert.match(source, /`automaticRendererExecutionAllowed = false`/);
  assert.match(source, /`lifecycleExecutionEnabled = false`/);
  assert.match(source, /developer-only/);
  assert.match(source, /disconnected by default/);
  assert.match(source, /no persistent attachment is implemented/);
  assert.match(source, /no live listeners are added/);
  assert.match(source, /no real Canvas is created/);
  assert.match(source, /no renderer startup is enabled/);
  assert.match(source, /no visual renderer behavior is changed/);
  assert.match(source, /## Manual Controls To Design, Not Yet Activate/);
  assert.match(source, /authorizePersistentAtlasDeveloperSession/);
  assert.match(source, /attachPersistentAtlasRenderer/);
  assert.match(source, /requestPersistentAtlasRedraw/);
  assert.match(source, /detachPersistentAtlasRenderer/);
  assert.match(source, /getPersistentAtlasAttachmentStatus/);
  assert.match(source, /## Test Plan/);
  assert.match(source, /Safari manual verification plan/);
  assert.match(
    source,
    /211\.52 — Persistent Attachment Fake Runtime Contract/
  );
});
