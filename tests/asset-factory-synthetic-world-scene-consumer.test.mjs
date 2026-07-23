import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const syntheticWorldModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "synthetic-world-scene-consumer.mjs"
  )
);

test("synthetic world scene consumer validates the complete passive world pipeline for the lighthouse, house, road, tree, and footpath scene", () => {
  const result = syntheticWorldModule.validateSyntheticWorldSceneConsumer();

  assert.equal(result.ok, true);
  assert.equal(result.syntheticWorldScene.world.assetInstances.length, 5);
  assert.equal(result.syntheticWorldScene.bridgeResult.rendererHandoffOutputs.length, 5);
  assert.equal(result.syntheticWorldScene.consumerResults.length, 5);
  assert.equal(
    result.syntheticWorldScene.consumerResults.every((entry) => entry.ok === true),
    true
  );
});

test("synthetic world scene consumer preserves landmark, building, and environment priority ordering", () => {
  const result = syntheticWorldModule.validateSyntheticWorldSceneConsumer();

  assert.equal(result.ok, true);
  const evaluations = result.syntheticWorldScene.candidateEvaluations;
  const lighthouse = evaluations.find(
    (entry) => entry.assetInstance.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
  const house = evaluations.find(
    (entry) => entry.assetInstance.assetId === "BUILDING_HOUSE_SMALL_COASTAL_001"
  );
  const tree = evaluations.find(
    (entry) => entry.assetInstance.assetId === "TREE_EUCALYPTUS_001"
  );

  assert.equal(
    lighthouse.candidateEvaluation.loadingPriority >
      house.candidateEvaluation.loadingPriority,
    true
  );
  assert.equal(
    house.candidateEvaluation.loadingPriority >
      tree.candidateEvaluation.loadingPriority,
    true
  );
});

test("same synthetic world seed and location produce identical passive world outputs", () => {
  const first = syntheticWorldModule.buildSyntheticWorldSceneConsumer();
  const second = syntheticWorldModule.buildSyntheticWorldSceneConsumer();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.syntheticWorldScene.bridgeResult.rendererHandoffOutputs,
    second.syntheticWorldScene.bridgeResult.rendererHandoffOutputs
  );
  assert.deepEqual(
    first.syntheticWorldScene.consumerResults.map((entry) => entry.acceptedPayload),
    second.syntheticWorldScene.consumerResults.map((entry) => entry.acceptedPayload)
  );
});

test("synthetic world scene consumer rejects invalid priority hierarchy and incomplete asset set safely", () => {
  const invalidPriority = syntheticWorldModule.validateSyntheticWorldSceneConsumer({
    ...syntheticWorldModule.syntheticWorldSceneConsumerDefinition,
    assetInstances: syntheticWorldModule.syntheticWorldSceneConsumerDefinition.assetInstances.map(
      (entry) =>
        entry.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001"
          ? {
              ...entry,
              priorityCategory: "environment_objects"
            }
          : entry
    )
  });

  const incompleteAssetSet = syntheticWorldModule.validateSyntheticWorldSceneConsumer({
    ...syntheticWorldModule.syntheticWorldSceneConsumerDefinition,
    assetInstances:
      syntheticWorldModule.syntheticWorldSceneConsumerDefinition.assetInstances.slice(0, 4)
  });

  assert.equal(invalidPriority.ok, false);
  assert.equal(invalidPriority.errorCode, "priority_hierarchy_mismatch");
  assert.equal(incompleteAssetSet.ok, false);
  assert.equal(incompleteAssetSet.errorCode, "scene_asset_set_mismatch");
});

test("synthetic world scene consumer remains passive and creates no renderer runtime or live world objects", () => {
  const result = syntheticWorldModule.validateSyntheticWorldSceneConsumer();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.syntheticWorldScene, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.syntheticWorldScene.bridgeResult.rendererHandoffOutputs[0],
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.syntheticWorldScene.consumerResults[0].acceptedPayload,
      "worldObject"
    ),
    false
  );
});
