import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const bridgeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "blender-api-bridge-foundation.mjs"
  )
);

test("blender api bridge foundation validates the lighthouse generation request", () => {
  const result = bridgeModule.validateBlenderApiBridgeFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.bridge.request.assetId, "LIGHTHOUSE_COASTAL_FAMILY_001");
  assert.equal(result.bridge.request.recipeId, "LIGHTHOUSE_CLASSIC_RECIPE_001");
  assert.equal(result.bridge.compatibility.blenderWorkflowCompatibilityVerified, true);
});

test("blender api bridge foundation validates component mapping and export preparation metadata", () => {
  const result = bridgeModule.validateBlenderApiBridgeFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.bridge.request.componentReferences.length, 9);
  assert.equal(
    result.bridge.request.metadata.generationHooks.length,
    result.bridge.request.componentReferences.length
  );
  assert.equal(result.bridge.request.exportRequirements.format, "glb");
});

test("blender api bridge foundation rejects mismatched components and recipe safely", () => {
  const badComponents = bridgeModule.validateBlenderApiBridgeFoundation({
    ...bridgeModule.blenderApiBridgeFoundationDefinition,
    componentReferences: ["LIGHTHOUSE_TOWER_BASE_001"]
  });

  const badRecipe = bridgeModule.validateBlenderApiBridgeFoundation({
    ...bridgeModule.blenderApiBridgeFoundationDefinition,
    recipeId: "LIGHTHOUSE_UNKNOWN_RECIPE_001"
  });

  assert.equal(badComponents.ok, false);
  assert.equal(badComponents.errorCode, "component_reference_mismatch");
  assert.equal(badRecipe.ok, false);
  assert.equal(badRecipe.errorCode, "recipe_reference_mismatch");
});

test("blender api bridge foundation remains passive and non-rendering", () => {
  const result = bridgeModule.validateBlenderApiBridgeFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.bridge, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.bridge, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.bridge, "runtimeRenderer"),
    false
  );
});
