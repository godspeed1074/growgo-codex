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

const worldPlacementModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-placement-rules.mjs"
  )
);

const adapterModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "factory-to-renderer-adapter.mjs"
  )
);

function buildAdapterContext() {
  return starterPackModule.buildStarterAssetFactoryLayers();
}

function buildPlacementResult(context, overrides = {}) {
  return worldPlacementModule.calculateDeterministicPlacement(
    {
      placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
      assetId: "BUILDING_BAKERY_SMALL_001",
      locationId: "PLOT_ALPHA_001",
      coordinates: {
        x: 8.25,
        y: 5.5
      },
      seed: "adapter-seed-001",
      terrainType: "grass",
      locationType: "building_plot",
      ...overrides
    },
    context
  );
}

function buildAdapterInput(context, overrides = {}) {
  const manifest =
    context.manifestRegistry.findManifestByAssetId("BUILDING_BAKERY_SMALL_001");
  const placementResult = buildPlacementResult(context);

  return {
    assetId: "BUILDING_BAKERY_SMALL_001",
    manifestReference: {
      assetId: manifest.assetId,
      category: manifest.category
    },
    recipeReference: manifest.recipeId,
    componentReferences: [...manifest.componentReferences],
    placementData: {
      placementRuleId: placementResult.deterministicPlacement.placementRuleId,
      locationId: placementResult.placement.locationId,
      alignmentRule: placementResult.placement.alignmentRule,
      position: {
        x: placementResult.placement.position.x,
        y: placementResult.placement.position.y
      }
    },
    orientation: placementResult.placement.orientation,
    metadata: {
      rendererAdapterProfile: "custom-2.5d-passive",
      placementMetadata: {
        deterministic: true
      }
    },
    ...overrides
  };
}

test("factory-to-renderer adapter produces passive renderer references from approved asset factory input", () => {
  const context = buildAdapterContext();
  const result = adapterModule.adaptFactoryAssetForRenderer(
    buildAdapterInput(context),
    context
  );

  assert.equal(result.ok, true);
  assert.equal(result.rendererAssetReference.assetId, "BUILDING_BAKERY_SMALL_001");
  assert.equal(result.rendererAssetReference.rendererLayer, "structures");
  assert.equal(result.rendererComponentReferences.length, 5);
  assert.equal(result.transformData.locationId, "PLOT_ALPHA_001");
});

test("factory-to-renderer adapter validates required fields and availability dependencies", () => {
  const context = buildAdapterContext();
  const missingMetadata = buildAdapterInput(context);
  delete missingMetadata.metadata;

  const missingRecipe = buildAdapterInput(context, {
    recipeReference: "BUILDING_BAKERY_SMALL_RECIPE_999"
  });

  const missingMetadataResult = adapterModule.adaptFactoryAssetForRenderer(
    missingMetadata,
    context
  );
  const missingRecipeResult = adapterModule.adaptFactoryAssetForRenderer(
    missingRecipe,
    context
  );

  assert.equal(missingMetadataResult.ok, false);
  assert.equal(missingMetadataResult.errorCode, "missing_required_field");
  assert.equal(missingMetadataResult.rendererAssetReference, null);
  assert.equal(missingRecipeResult.ok, false);
  assert.equal(missingRecipeResult.errorCode, "recipe_manifest_mismatch");
  assert.equal(missingRecipeResult.transformData, null);
});

test("factory-to-renderer adapter fails safely for unsupported renderer data and placement incompatibility", () => {
  const context = buildAdapterContext();
  const unsupportedRendererProfile = buildAdapterInput(context, {
    metadata: {
      rendererAdapterProfile: "custom-3d-live",
      placementMetadata: {
        deterministic: true
      }
    }
  });

  const invalidOrientation = buildAdapterInput(context, {
    orientation: "upward"
  });

  const unsupportedRendererResult = adapterModule.adaptFactoryAssetForRenderer(
    unsupportedRendererProfile,
    context
  );
  const invalidOrientationResult = adapterModule.adaptFactoryAssetForRenderer(
    invalidOrientation,
    context
  );

  assert.equal(unsupportedRendererResult.ok, false);
  assert.equal(unsupportedRendererResult.errorCode, "unsupported_renderer_data");
  assert.equal(unsupportedRendererResult.metadata, null);
  assert.equal(invalidOrientationResult.ok, false);
  assert.equal(invalidOrientationResult.errorCode, "invalid_orientation");
  assert.equal(invalidOrientationResult.rendererComponentReferences, null);
});

test("factory-to-renderer adapter rejects mismatched manifest components and placement rules", () => {
  const context = buildAdapterContext();
  const missingComponent = buildAdapterInput(context, {
    componentReferences: ["BAKERY_WALL_PANEL_001"]
  });

  const placementMismatch = buildAdapterInput(context, {
    placementData: {
      ...buildAdapterInput(context).placementData,
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001"
    }
  });

  const missingComponentResult = adapterModule.adaptFactoryAssetForRenderer(
    missingComponent,
    context
  );
  const placementMismatchResult = adapterModule.adaptFactoryAssetForRenderer(
    placementMismatch,
    context
  );

  assert.equal(missingComponentResult.ok, false);
  assert.equal(missingComponentResult.errorCode, "component_reference_mismatch");
  assert.equal(placementMismatchResult.ok, false);
  assert.equal(
    placementMismatchResult.errorCode,
    "placement_category_mismatch"
  );
});

test("factory-to-renderer adapter remains passive and creates no runtime rendering objects", () => {
  const context = buildAdapterContext();
  const result = adapterModule.adaptFactoryAssetForRenderer(
    buildAdapterInput(context),
    context
  );

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.metadata, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.rendererAssetReference, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.transformData, "worldInstance"),
    false
  );
});
