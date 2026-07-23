import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const streamingModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-streaming-coordinator-foundation.mjs"
  )
);

test("world streaming coordinator foundation validates passive streaming selection around the player", () => {
  const result = streamingModule.validateWorldStreamingCoordinatorFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.worldStreamingCoordinator.foundation.instanceCandidates.length, 4);
  assert.deepEqual(
    result.worldStreamingCoordinator.passiveHandoff.selectedInstances.map((entry) => entry.streamingState),
    ["visible", "ready", "cached"]
  );
});

test("world streaming coordinator foundation produces deterministic selected instance ordering", () => {
  const first = streamingModule.validateWorldStreamingCoordinatorFoundation();
  const second = streamingModule.validateWorldStreamingCoordinatorFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.worldStreamingCoordinator.passiveHandoff.selectedInstances,
    second.worldStreamingCoordinator.passiveHandoff.selectedInstances
  );
});

test("world streaming coordinator foundation rejects invalid priority ordering and invalid radii safely", () => {
  const badPriorityOrder = streamingModule.validateWorldStreamingCoordinatorFoundation({
    ...streamingModule.worldStreamingCoordinatorFoundationDefinition,
    streamingRequest: {
      ...streamingModule.worldStreamingCoordinatorFoundationDefinition.streamingRequest,
      priorityRules: [
        ...streamingModule.worldStreamingCoordinatorFoundationDefinition.streamingRequest.priorityRules
      ].reverse()
    }
  });

  const badRadii = streamingModule.validateWorldStreamingCoordinatorFoundation({
    ...streamingModule.worldStreamingCoordinatorFoundationDefinition,
    streamingRequest: {
      ...streamingModule.worldStreamingCoordinatorFoundationDefinition.streamingRequest,
      loadRadius: 25,
      unloadRadius: 20
    }
  });

  assert.equal(badPriorityOrder.ok, false);
  assert.equal(badPriorityOrder.errorCode, "priority_rule_order_mismatch");
  assert.equal(badRadii.ok, false);
  assert.equal(badRadii.errorCode, "invalid_streaming_radii");
});

test("world streaming coordinator foundation remains passive and creates no runtime world objects", () => {
  const result = streamingModule.validateWorldStreamingCoordinatorFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.worldStreamingCoordinator,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.worldStreamingCoordinator.passiveHandoff,
      "canvas"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.worldStreamingCoordinator.candidateEvaluations[0],
      "gpsHandle"
    ),
    false
  );
});
