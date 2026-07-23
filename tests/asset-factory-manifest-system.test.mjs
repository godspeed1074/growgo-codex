import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assetRegistryModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-registry.mjs"
  )
);

const recipeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-recipe-system.mjs"
  )
);

const componentLibraryModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "component-library.mjs"
  )
);

const manifestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-manifest-system.mjs"
  )
);

function buildAsset(overrides = {}) {
  return {
    assetId: "WALL_BASIC_001",
    category: "buildings",
    version: "1.0.0",
    status: "validated",
    components: [],
    tags: ["module"],
    metadata: {
      creatorSource: "internal",
      performanceTargets: {
        storageBudget: "low",
        ramBudget: "low",
        gpuBudget: "low"
      },
      lod: {
        profile: "mobile-default"
      },
      validationState: "validated"
    },
    ...overrides
  };
}

function buildComponent(overrides = {}) {
  return {
    componentId: "WALL_BASIC_001",
    category: "walls",
    type: "straight_wall",
    version: "1.0.0",
    status: "validated",
    dimensions: {
      width: 2,
      height: 3,
      depth: 0.25
    },
    attachmentPoints: [
      {
        pointId: "TOP_CENTER",
        type: "roof_anchor",
        position: {
          x: 0,
          y: 3,
          z: 0
        }
      }
    ],
    compatibilityRules: {
      allowedCategories: ["roofs", "doors"],
      allowedTypes: ["gable_roof", "wood_door"],
      disallowedComponentIds: []
    },
    tags: ["wall", "building", "module"],
    metadata: {
      creatorSource: "internal",
      validationState: "validated"
    },
    ...overrides
  };
}

function buildRecipe(overrides = {}) {
  return {
    recipeId: "BAKERY_RECIPE_456",
    assetType: "bakery",
    version: "1.0.0",
    status: "validated",
    components: ["WALL_BASIC_001", "DOOR_WOOD_001", "ROOF_GABLE_001"],
    optionalComponents: ["SIGN_BAKERY_001"],
    metadata: {
      creatorSource: "internal",
      compatibilityProfile: "mobile-default",
      tags: ["bakery", "town"]
    },
    generationRules: {
      deterministic: true,
      seedMode: "explicit",
      variantPolicy: "version-pinned"
    },
    ...overrides
  };
}

function buildManifest(overrides = {}) {
  return {
    assetId: "BUILDING_BAKERY_001",
    category: "buildings",
    version: "1.0.0",
    status: "validated",
    recipeId: "BAKERY_RECIPE_456",
    componentReferences: [
      "WALL_BASIC_001",
      "DOOR_WOOD_001",
      "ROOF_GABLE_001",
      "SIGN_BAKERY_001"
    ],
    metadata: {
      creatorSource: "internal",
      validationState: "validated",
      manifestRole: "complete_reusable_asset"
    },
    tags: ["bakery", "town", "shopfront"],
    generationRules: {
      deterministic: true,
      seedMode: "explicit",
      recipeVersionLocked: true
    },
    ...overrides
  };
}

function buildLibraries() {
  const componentLibrary = componentLibraryModule.createComponentLibrary([
    buildComponent(),
    buildComponent({
      componentId: "DOOR_WOOD_001",
      category: "doors",
      type: "wood_door"
    }),
    buildComponent({
      componentId: "ROOF_GABLE_001",
      category: "roofs",
      type: "gable_roof"
    }),
    buildComponent({
      componentId: "SIGN_BAKERY_001",
      category: "windows",
      type: "sign_panel",
      compatibilityRules: {
        allowedCategories: [],
        allowedTypes: [],
        disallowedComponentIds: []
      }
    })
  ]);

  const assetRegistry = assetRegistryModule.createAssetRegistry([
    buildAsset(),
    buildAsset({ assetId: "DOOR_WOOD_001" }),
    buildAsset({ assetId: "ROOF_GABLE_001" }),
    buildAsset({ assetId: "SIGN_BAKERY_001" })
  ]);

  const recipeRegistry = recipeModule.createAssetRecipeRegistry([buildRecipe()], {
    assetRegistry,
    componentLibrary
  });

  return {
    assetRegistry,
    componentLibrary,
    recipeRegistry
  };
}

test("valid manifest records normalize and validate successfully", () => {
  const { recipeRegistry, componentLibrary } = buildLibraries();
  const result = manifestModule.validateAssetManifestRecord(buildManifest(), {
    recipeRegistry,
    componentLibrary
  });

  assert.equal(result.ok, true);
  assert.equal(result.normalizedManifest.assetId, "BUILDING_BAKERY_001");
  assert.equal(result.normalizedManifest.recipeId, "BAKERY_RECIPE_456");
  assert.equal(result.normalizedManifest.status, "validated");
});

test("manifest required fields are enforced", () => {
  const { recipeRegistry, componentLibrary } = buildLibraries();
  const manifest = buildManifest();
  delete manifest.generationRules;

  const result = manifestModule.validateAssetManifestRecord(manifest, {
    recipeRegistry,
    componentLibrary
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "missing_required_field");
});

test("manifest version, status, and category rules are enforced", () => {
  const { recipeRegistry, componentLibrary } = buildLibraries();
  const badVersion = manifestModule.validateAssetManifestRecord(
    buildManifest({ version: "v1" }),
    { recipeRegistry, componentLibrary }
  );
  const badStatus = manifestModule.validateAssetManifestRecord(
    buildManifest({ status: "shipping" }),
    { recipeRegistry, componentLibrary }
  );
  const badCategory = manifestModule.validateAssetManifestRecord(
    buildManifest({ category: "quests" }),
    { recipeRegistry, componentLibrary }
  );

  assert.equal(badVersion.ok, false);
  assert.equal(badVersion.errorCode, "invalid_version");
  assert.equal(badStatus.ok, false);
  assert.equal(badStatus.errorCode, "invalid_status");
  assert.equal(badCategory.ok, false);
  assert.equal(badCategory.errorCode, "invalid_category");
});

test("manifest validation rejects missing or unavailable recipe and component dependencies", () => {
  const { componentLibrary } = buildLibraries();
  const missingRecipeRegistry = recipeModule.createAssetRecipeRegistry([], {
    assetRegistry: assetRegistryModule.createAssetRegistry([]),
    componentLibrary
  });

  const missingRecipe = manifestModule.validateAssetManifestRecord(buildManifest(), {
    recipeRegistry: missingRecipeRegistry,
    componentLibrary
  });

  const { recipeRegistry } = buildLibraries();
  const unavailableComponentLibrary = componentLibraryModule.createComponentLibrary([
    buildComponent(),
    buildComponent({
      componentId: "DOOR_WOOD_001",
      category: "doors",
      type: "wood_door"
    }),
    buildComponent({
      componentId: "ROOF_GABLE_001",
      category: "roofs",
      type: "gable_roof"
    }),
    buildComponent({
      componentId: "SIGN_BAKERY_001",
      category: "windows",
      type: "sign_panel",
      status: "draft",
      compatibilityRules: {
        allowedCategories: [],
        allowedTypes: [],
        disallowedComponentIds: []
      }
    })
  ]);

  const unavailableComponent = manifestModule.validateAssetManifestRecord(
    buildManifest(),
    {
      recipeRegistry,
      componentLibrary: unavailableComponentLibrary
    }
  );

  assert.equal(missingRecipe.ok, false);
  assert.equal(missingRecipe.errorCode, "missing_recipe_reference");
  assert.equal(unavailableComponent.ok, false);
  assert.equal(unavailableComponent.errorCode, "unavailable_component_reference");
});

test("manifest registry rejects duplicate asset IDs", () => {
  const { recipeRegistry, componentLibrary } = buildLibraries();
  const registry = manifestModule.createAssetManifestRegistry([buildManifest()], {
    recipeRegistry,
    componentLibrary
  });

  assert.throws(
    () => registry.addManifest(buildManifest()),
    /already exists in the manifest registry/
  );
});

test("manifest registry supports lookup, recipe references, components, generation rules, and availability", () => {
  const { recipeRegistry, componentLibrary } = buildLibraries();
  const registry = manifestModule.createAssetManifestRegistry([buildManifest()], {
    recipeRegistry,
    componentLibrary
  });

  const manifest = registry.findManifestByAssetId("building_bakery_001");
  const recipeReference = registry.getManifestRecipeReference(
    "BUILDING_BAKERY_001"
  );
  const components = registry.getManifestComponents("BUILDING_BAKERY_001");
  const generationRules = registry.getManifestGenerationRules(
    "BUILDING_BAKERY_001"
  );

  assert.equal(manifest.assetId, "BUILDING_BAKERY_001");
  assert.equal(recipeReference, "BAKERY_RECIPE_456");
  assert.deepEqual(components, [
    "WALL_BASIC_001",
    "DOOR_WOOD_001",
    "ROOF_GABLE_001",
    "SIGN_BAKERY_001"
  ]);
  assert.equal(generationRules.deterministic, true);
  assert.equal(registry.isManifestAvailable("BUILDING_BAKERY_001"), true);
});

test("manifest system remains modular for future renderer and procedural generation integration", () => {
  const { recipeRegistry, componentLibrary } = buildLibraries();
  const result = manifestModule.validateAssetManifestRecord(buildManifest(), {
    recipeRegistry,
    componentLibrary
  });

  assert.equal(result.ok, true);
  assert.equal(
    typeof result.normalizedManifest.metadata.rendererBinding,
    "undefined"
  );
  assert.equal(
    typeof result.normalizedManifest.metadata.proceduralPlacementBinding,
    "undefined"
  );
});
