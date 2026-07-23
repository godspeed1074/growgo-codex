import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const worldInstanceModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-instance-manager-foundation.mjs"
  )
);

test("world instance manager foundation validates a passive deterministic world instance contract", () => {
  const result = worldInstanceModule.validateWorldInstanceManagerFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.worldInstanceManager.foundation.instanceRecord.assetId,
    "BUILDING_BAKERY_SMALL_001"
  );
  assert.equal(
    result.worldInstanceManager.foundation.passiveRendererHandoff.lodProfile,
    "close"
  );
});

test("same location, asset, and world seed produce the same deterministic world instance ID", () => {
  const first = worldInstanceModule.createDeterministicWorldInstanceId({
    locationId: "PLOT_ALPHA_001",
    assetId: "BUILDING_BAKERY_SMALL_001",
    worldSeed: "world-instance-seed-001"
  });
  const second = worldInstanceModule.createDeterministicWorldInstanceId({
    locationId: "PLOT_ALPHA_001",
    assetId: "BUILDING_BAKERY_SMALL_001",
    worldSeed: "world-instance-seed-001"
  });
  const third = worldInstanceModule.createDeterministicWorldInstanceId({
    locationId: "PLOT_ALPHA_001",
    assetId: "BUILDING_BAKERY_SMALL_001",
    worldSeed: "world-instance-seed-002"
  });

  assert.equal(first.instanceId, second.instanceId);
  assert.notEqual(first.instanceId, third.instanceId);
});

test("world instance manager foundation rejects invalid state and mismatched deterministic identity safely", () => {
  const invalidState = worldInstanceModule.validateWorldInstanceManagerFoundation({
    ...worldInstanceModule.worldInstanceManagerFoundationDefinition,
    instanceRecord: {
      ...worldInstanceModule.worldInstanceManagerFoundationDefinition.instanceRecord,
      state: "spawning"
    }
  });

  const invalidIdentity = worldInstanceModule.validateWorldInstanceManagerFoundation({
    ...worldInstanceModule.worldInstanceManagerFoundationDefinition,
    instanceRecord: {
      ...worldInstanceModule.worldInstanceManagerFoundationDefinition.instanceRecord,
      instanceId: "WORLD_INSTANCE_000000001"
    }
  });

  assert.equal(invalidState.ok, false);
  assert.equal(invalidState.errorCode, "invalid_instance_state");
  assert.equal(invalidIdentity.ok, false);
  assert.equal(invalidIdentity.errorCode, "instance_identity_mismatch");
});

test("world instance manager foundation remains passive and spawns no runtime world objects", () => {
  const result = worldInstanceModule.validateWorldInstanceManagerFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.worldInstanceManager, "worldObject"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.worldInstanceManager.rendererHandoffResult,
      "canvas"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.worldInstanceManager.foundation.instanceRecord,
      "gpsHandle"
    ),
    false
  );
});
