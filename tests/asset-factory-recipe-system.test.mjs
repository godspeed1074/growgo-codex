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

function buildValidatedDependencyRegistry() {
  return assetRegistryModule.createAssetRegistry([
    buildAsset(),
    buildAsset({ assetId: "DOOR_WOOD_001" }),
    buildAsset({ assetId: "ROOF_GABLE_001" }),
    buildAsset({ assetId: "SIGN_BAKERY_001" })
  ]);
}

test("valid recipe records normalize and validate successfully", () => {
  const result = recipeModule.validateAssetRecipeRecord(buildRecipe(), {
    assetRegistry: buildValidatedDependencyRegistry()
  });

  assert.equal(result.ok, true);
  assert.equal(result.normalizedRecipe.recipeId, "BAKERY_RECIPE_456");
  assert.equal(result.normalizedRecipe.version, "1.0.0");
  assert.equal(result.normalizedRecipe.status, "validated");
});

test("recipe required fields are enforced", () => {
  const recipe = buildRecipe();
  delete recipe.generationRules;

  const result = recipeModule.validateAssetRecipeRecord(recipe, {
    assetRegistry: buildValidatedDependencyRegistry()
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "missing_required_field");
});

test("recipe version and status rules are enforced", () => {
  const badVersion = recipeModule.validateAssetRecipeRecord(
    buildRecipe({ version: "version-one" }),
    { assetRegistry: buildValidatedDependencyRegistry() }
  );
  const badStatus = recipeModule.validateAssetRecipeRecord(
    buildRecipe({ status: "shipping" }),
    { assetRegistry: buildValidatedDependencyRegistry() }
  );

  assert.equal(badVersion.ok, false);
  assert.equal(badVersion.errorCode, "invalid_version");
  assert.equal(badStatus.ok, false);
  assert.equal(badStatus.errorCode, "invalid_status");
});

test("recipe validation rejects missing and unavailable dependencies through the asset registry", () => {
  const missingDependency = recipeModule.validateAssetRecipeRecord(buildRecipe(), {
    assetRegistry: assetRegistryModule.createAssetRegistry([buildAsset()])
  });

  const unavailableRegistry = assetRegistryModule.createAssetRegistry([
    buildAsset(),
    buildAsset({ assetId: "DOOR_WOOD_001" }),
    buildAsset({ assetId: "ROOF_GABLE_001" }),
    buildAsset({ assetId: "SIGN_BAKERY_001", status: "draft" })
  ]);
  const unavailableDependency = recipeModule.validateAssetRecipeRecord(buildRecipe(), {
    assetRegistry: unavailableRegistry
  });

  assert.equal(missingDependency.ok, false);
  assert.equal(missingDependency.errorCode, "missing_dependency");
  assert.equal(unavailableDependency.ok, false);
  assert.equal(unavailableDependency.errorCode, "unavailable_dependency");
});

test("recipe registry rejects duplicate recipe IDs", () => {
  const registry = recipeModule.createAssetRecipeRegistry([buildRecipe()], {
    assetRegistry: buildValidatedDependencyRegistry()
  });

  assert.throws(
    () => registry.addRecipe(buildRecipe()),
    /already exists in the recipe registry/
  );
});

test("recipe registry supports lookup, components, generation rules, and availability", () => {
  const registry = recipeModule.createAssetRecipeRegistry([buildRecipe()], {
    assetRegistry: buildValidatedDependencyRegistry()
  });

  const recipe = registry.findRecipeById("bakery_recipe_456");
  const dependencies = registry.getRecipeComponents("BAKERY_RECIPE_456");
  const generationRules = registry.getRecipeGenerationRules("BAKERY_RECIPE_456");

  assert.equal(recipe.recipeId, "BAKERY_RECIPE_456");
  assert.deepEqual(dependencies.required, [
    "WALL_BASIC_001",
    "DOOR_WOOD_001",
    "ROOF_GABLE_001"
  ]);
  assert.deepEqual(dependencies.optional, ["SIGN_BAKERY_001"]);
  assert.equal(generationRules.deterministic, true);
  assert.equal(registry.isRecipeAvailable("BAKERY_RECIPE_456"), true);
});

test("recipe registry stays modular for future component library and renderer integration", () => {
  const componentLibrary = {
    hasComponent(componentId) {
      return ["WALL_BASIC_001", "DOOR_WOOD_001", "ROOF_GABLE_001"].includes(
        componentId
      );
    },
    isComponentAvailable() {
      return true;
    }
  };

  const result = recipeModule.validateAssetRecipeRecord(
    buildRecipe({
      optionalComponents: [],
      components: ["WALL_BASIC_001", "DOOR_WOOD_001", "ROOF_GABLE_001"]
    }),
    {
      componentLibrary
    }
  );

  assert.equal(result.ok, true);
  assert.equal(
    typeof result.normalizedRecipe.metadata.rendererBinding,
    "undefined"
  );
  assert.equal(typeof result.normalizedRecipe.metadata.questBinding, "undefined");
});
