import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const recommendationModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-recommendation.mjs")
);

test("recommend coastal assets", () => {
  const layer = recommendationModule.createAssetRecommendationLayer();
  const results = layer.recommend({
    environmentType: "COASTAL_PARK",
    biome: "COASTAL",
    objectClassification: "NATURAL_FEATURE",
    atlasUsage: "PARK",
    existingAssetRelationships: ["GROUND_COASTAL_GRASS_001"],
    variantCompatibility: {
      baseReferenceType: "asset",
      baseReferenceId: "TREE_EUCALYPTUS_001"
    }
  });

  assert.equal(results.length > 0, true);
  assert.equal(results[0].assetId, "TREE_COASTAL_001");
});

test("recommend civic assets", () => {
  const layer = recommendationModule.createAssetRecommendationLayer();
  const results = layer.recommend({
    environmentType: "CIVIC_CAMPUS",
    biome: "TEMPERATE_GRASSLAND",
    objectClassification: "BUSINESS",
    atlasUsage: "SCHOOL"
  });

  assert.equal(results.length > 0, true);
  assert.equal(results[0].assetId, "BUILDING_CIVIC_SCHOOL_PRIMARY_001");
});

test("recommend residential assets", () => {
  const layer = recommendationModule.createAssetRecommendationLayer();
  const results = layer.recommend({
    environmentType: "RESIDENTIAL_AREA",
    biome: "SUBURBAN_PARKLAND",
    objectClassification: "RESIDENTIAL",
    atlasUsage: "HOUSE"
  });

  assert.equal(results.length > 0, true);
  assert.equal(results[0].assetId, "BUILDING_RESIDENTIAL_SUBURBAN_001");
});

test("variant-aware recommendation resolves contextual residential target asset", () => {
  const layer = recommendationModule.createAssetRecommendationLayer();
  const results = layer.recommend({
    environmentType: "RESIDENTIAL_COASTAL",
    biome: "COASTAL",
    climate: "COASTAL_TEMPERATE",
    regionProfile: "AUSTRALIAN_COASTAL_WORLD",
    styleProfile: "PAPERCUT_COASTAL",
    objectClassification: "RESIDENTIAL",
    atlasUsage: "HOUSE",
    variantCompatibility: {
      baseReferenceType: "asset",
      baseReferenceId: "BUILDING_RESIDENTIAL_SUBURBAN_001"
    }
  });

  assert.equal(results.length > 0, true);
  assert.equal(results[0].assetId, "BUILDING_RESIDENTIAL_HOUSE_COASTAL_001");
  assert.equal(results[0].compatibilitySummary.variantMatched, true);
});

test("same recommendation context produces deterministic same output", () => {
  const layer = recommendationModule.createAssetRecommendationLayer();
  const context = {
    environmentType: "COASTAL_COMMERCIAL",
    biome: "COASTAL",
    climate: "MARITIME",
    regionProfile: "AUSTRALIAN_COASTAL_WORLD",
    styleProfile: "BRIGHT_COASTAL",
    objectClassification: "BUSINESS",
    atlasUsage: "BAKERY",
    variantCompatibility: {
      baseReferenceType: "recipe",
      baseReferenceId: "BAKERY_RECIPE_001"
    }
  };

  const first = layer.recommend(context);
  const second = layer.recommend(context);

  assert.deepEqual(first, second);
});
