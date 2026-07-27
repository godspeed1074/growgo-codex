import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const pipelineModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-creation-pipeline.mjs")
);

test("create asset request resolves registered nature asset with recipe and budget", () => {
  const pipeline = pipelineModule.createAssetCreationPipelineLayer();
  const request = pipeline.createRequest({
    baseAssetId: "GROUND_BEACH_SAND_001",
    environmentContext: {
      biome: "COASTAL",
      climate: "MARITIME",
      regionProfile: "SMALL_COASTAL_TOWN",
      environmentType: "BEACH_EDGE_PREVIEW",
      styleProfile: "PAPERCUT_COASTAL"
    }
  });

  assert.equal(request.assetId, "GROUND_BEACH_SAND_001");
  assert.equal(request.recipeId, "BEACH_ENVIRONMENT_RECIPE_001");
  assert.equal(request.state, "REQUESTED");
  assert.equal(request.validation.assetExistsInRegistry, true);
});

test("recipe validation succeeds for registered bakery creation request through variant system", () => {
  const pipeline = pipelineModule.createAssetCreationPipelineLayer();
  const request = pipeline.createRequest({
    baseRecipeId: "BAKERY_RECIPE_001",
    environmentContext: {
      biome: "COASTAL",
      climate: "MARITIME",
      regionProfile: "SMALL_COASTAL_TOWN",
      environmentType: "COASTAL_COMMERCIAL",
      styleProfile: "BRIGHT_COASTAL"
    },
    performanceBudgetOverride: {
      polygonBudget: "medium",
      materialBudget: "shared_commercial_material",
      instanceFriendly: true
    }
  });

  assert.equal(request.recipeId, "BAKERY_RECIPE_001");
  assert.equal(request.validation.recipeExists, true);
  assert.equal(request.metadata.performanceBudgetSource, "request_override");
});

test("variant validation succeeds for rural residential asset request", () => {
  const pipeline = pipelineModule.createAssetCreationPipelineLayer();
  const request = pipeline.createRequest({
    baseAssetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    environmentContext: {
      biome: "FARMLAND",
      climate: "DRY_TEMPERATE",
      regionProfile: "REGIONAL_TOWN",
      environmentType: "RURAL_RESIDENTIAL",
      styleProfile: "QUIET_RURAL"
    },
    performanceBudgetOverride: {
      polygonBudget: "medium",
      materialBudget: "shared_residential_material",
      instanceFriendly: true
    }
  });

  assert.equal(request.assetId, "BUILDING_RESIDENTIAL_HOUSE_RURAL_001");
  assert.equal(request.selectedVariant, "rural");
  assert.equal(request.validation.variantCompatible, true);
});

test("lod validation succeeds when registered asset exposes lod rules", () => {
  const pipeline = pipelineModule.createAssetCreationPipelineLayer();
  const request = pipeline.createRequest({
    baseAssetId: "FOREST_UNDERGROWTH_SET_001",
    environmentContext: {
      biome: "FOREST_EDGE",
      climate: "TEMPERATE",
      regionProfile: "ALPINE_WORLD",
      environmentType: "FOREST",
      styleProfile: "NATURAL_LAYERED"
    }
  });

  assert.ok(request.lodRequirements.length > 0);
  assert.equal(request.validation.lodDefined, true);
  assert.equal(request.validation.performanceBudgetDefined, true);
});

test("same input produces deterministic same asset creation request", () => {
  const pipeline = pipelineModule.createAssetCreationPipelineLayer();
  const input = {
    baseAssetId: "RESERVE_HABITAT_SET_001",
    environmentContext: {
      biome: "PROTECTED_AREA",
      climate: "TEMPERATE",
      regionProfile: "COASTAL_REGION",
      environmentType: "NATURE_RESERVE",
      styleProfile: "PAPERCUT_STANDARD"
    }
  };

  const first = pipeline.createRequest(input);
  const second = pipeline.createRequest(input);

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicRequestHash,
    second.validation.deterministicRequestHash
  );
});

test("pipeline request can advance through valid workflow states", () => {
  const pipeline = pipelineModule.createAssetCreationPipelineLayer();
  const requested = pipeline.createRequest({
    baseAssetId: "PARK_TREATMENT_GREENERY_SET_001",
    environmentContext: {
      biome: "SUBURBAN_PARKLAND",
      climate: "TEMPERATE",
      regionProfile: "SUBURBAN_CITY_EDGE",
      environmentType: "PARK_TREATMENT",
      styleProfile: "CLEAN_SUBURBAN"
    }
  });

  const inProgress = pipeline.advanceRequest(requested, "IN_PROGRESS");
  const validationPending = pipeline.advanceRequest(inProgress, "VALIDATION_PENDING");

  assert.equal(inProgress.state, "IN_PROGRESS");
  assert.equal(validationPending.state, "VALIDATION_PENDING");
});

test("explicit asset creation request validation passes contract checks", () => {
  const pipeline = pipelineModule.createAssetCreationPipelineLayer();
  const request = pipeline.createRequest({
    baseAssetId: "GROUND_BEACH_SAND_001",
    environmentContext: {
      biome: "COASTAL",
      climate: "MARITIME",
      regionProfile: "SMALL_COASTAL_TOWN",
      environmentType: "BEACH_EDGE_PREVIEW",
      styleProfile: "PAPERCUT_COASTAL"
    }
  });
  const validation = pipelineModule.validateAssetCreationRequest(request);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetCreationRequest.validation.validationPassed, true);
});
