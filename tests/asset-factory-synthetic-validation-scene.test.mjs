import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const starterPackModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "starter-asset-manifest-pack.mjs"
  )
);

const sceneModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "synthetic-factory-renderer-validation-scene.mjs"
  )
);

function buildSceneContext() {
  return starterPackModule.buildStarterAssetFactoryLayers();
}

test("synthetic validation scene proves the complete passive factory-to-renderer chain", () => {
  const context = buildSceneContext();
  const result = sceneModule.buildSyntheticFactoryRendererValidationScene(
    sceneModule.syntheticFactoryRendererValidationSceneDefinition,
    context
  );

  assert.equal(result.ok, true);
  assert.equal(
    result.scene.assetReferences[0],
    "BUILDING_HOUSE_SMALL_COASTAL_001"
  );
  assert.equal(
    result.scene.rendererAdapterOutput.rendererAssetReference.assetId,
    "BUILDING_HOUSE_SMALL_COASTAL_001"
  );
  assert.equal(
    result.scene.rendererAdapterOutput.rendererAssetReference.rendererLayer,
    "structures"
  );
});

test("synthetic validation scene is deterministic for the same scene and seed", () => {
  const context = buildSceneContext();
  const first = sceneModule.buildSyntheticFactoryRendererValidationScene(
    sceneModule.syntheticFactoryRendererValidationSceneDefinition,
    context
  );
  const second = sceneModule.buildSyntheticFactoryRendererValidationScene(
    sceneModule.syntheticFactoryRendererValidationSceneDefinition,
    context
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.scene, second.scene);
});

test("synthetic validation scene fails safely for missing assets and missing placement rules", () => {
  const context = buildSceneContext();
  const missingAssetScene = {
    ...sceneModule.syntheticFactoryRendererValidationSceneDefinition,
    assetReferences: ["BUILDING_HOUSE_UNKNOWN_001"],
    placementReferences: [
      {
        ...sceneModule.syntheticFactoryRendererValidationSceneDefinition
          .placementReferences[0],
        assetId: "BUILDING_HOUSE_UNKNOWN_001"
      }
    ]
  };

  const missingPlacementRuleScene = {
    ...sceneModule.syntheticFactoryRendererValidationSceneDefinition,
    placementReferences: [
      {
        ...sceneModule.syntheticFactoryRendererValidationSceneDefinition
          .placementReferences[0],
        placementRuleId: "PLACEMENT_UNKNOWN_001"
      }
    ]
  };

  const missingAssetResult =
    sceneModule.buildSyntheticFactoryRendererValidationScene(
      missingAssetScene,
      context
    );
  const missingPlacementRuleResult =
    sceneModule.buildSyntheticFactoryRendererValidationScene(
      missingPlacementRuleScene,
      context
    );

  assert.equal(missingAssetResult.ok, false);
  assert.equal(missingAssetResult.errorCode, "missing_asset_reference");
  assert.equal(missingAssetResult.scene, null);
  assert.equal(missingPlacementRuleResult.ok, false);
  assert.equal(
    missingPlacementRuleResult.errorCode,
    "missing_placement_rule"
  );
  assert.equal(missingPlacementRuleResult.scene, null);
});

test("synthetic validation scene validation rejects scene shape mismatches", () => {
  const context = buildSceneContext();
  const invalidScene = {
    ...sceneModule.syntheticFactoryRendererValidationSceneDefinition,
    assetReferences: [
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "BUILDING_SHOP_SMALL_001"
    ]
  };

  const result = sceneModule.validateSyntheticFactoryRendererValidationScene(
    invalidScene,
    context
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_scene_shape");
});

test("synthetic validation scene remains passive and creates no runtime rendering objects", () => {
  const context = buildSceneContext();
  const result = sceneModule.buildSyntheticFactoryRendererValidationScene(
    sceneModule.syntheticFactoryRendererValidationSceneDefinition,
    context
  );

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.scene.rendererAdapterOutput,
      "canvas"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.scene.rendererAdapterOutput.rendererAssetReference,
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.scene, "worldInstance"),
    false
  );
});
