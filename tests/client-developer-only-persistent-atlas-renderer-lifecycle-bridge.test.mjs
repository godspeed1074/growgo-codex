import test from "node:test";
import assert from "node:assert/strict";
import { createDeveloperOnlyPersistentAtlasRendererLifecycleBridge } from "../client/developer-only-persistent-atlas-renderer-lifecycle-bridge.mjs";

test("bridge owns one prepared one-frame surface and delegates exact cleanup to the dedicated owner", () => {
  const map = { off() {} };
  const surface = { pane: {}, canvas: {} };
  const calls = { rollback: 0, clear: 0 };
  const bridge = createDeveloperOnlyPersistentAtlasRendererLifecycleBridge({
    mapProvider: () => map,
    surfaceProvider: () => surface,
    surfaceRollbackProvider: ({ surface: owned }) => {
      assert.equal(owned, surface);
      calls.rollback += 1;
      return { outcome: "rolled_back" };
    },
    clearRuntimeReferences: () => { calls.clear += 1; }
  });
  const lifecycle = bridge.attach({ lifecycleOwnerId: "OWNER_A", lifecycleGenerationId: "GEN_A", surfaceOwnerId: "SURFACE_A" });
  assert.equal(lifecycle.ownerId, "OWNER_A");
  assert.equal(lifecycle.status().canvasRetained, true);
  const result = lifecycle.dispose();
  assert.equal(result.outcome, "disposed");
  assert.equal(calls.rollback, 1);
  assert.equal(calls.clear, 1);
  assert.equal(lifecycle.status().canvasRetained, false);
  assert.equal(lifecycle.dispose().outcome, "noop");
});

test("bridge rejects duplicate attach and missing prepared surfaces", () => {
  let surface = null;
  const bridge = createDeveloperOnlyPersistentAtlasRendererLifecycleBridge({
    mapProvider: () => ({ off() {} }), surfaceProvider: () => surface,
    surfaceRollbackProvider: () => ({ outcome: "rolled_back" }), clearRuntimeReferences: () => {}
  });
  assert.throws(() => bridge.attach({}), /MISSING_PREPARED_SURFACE/);
  surface = { pane: {}, canvas: {} };
  bridge.attach({ lifecycleOwnerId: "OWNER_A", lifecycleGenerationId: "GEN_A", surfaceOwnerId: "SURFACE_A" });
  assert.throws(() => bridge.attach({}), /DUPLICATE_LIFECYCLE_OWNER_ACQUISITION/);
});
