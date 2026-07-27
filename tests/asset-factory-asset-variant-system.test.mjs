import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assetVariantModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-variant-system.mjs")
);

test("tree variant selection resolves coastal presentation deterministically", () => {
  const system = assetVariantModule.createAssetVariantSystem();
  const assignment = system.resolveVariant({
    baseAssetId: "TREE_EUCALYPTUS_001",
    environmentContext: {
      biome: "COASTAL",
      climate: "MARITIME",
      regionProfile: "SMALL_COASTAL_TOWN",
      environmentType: "COASTAL_PARK",
      styleProfile: "PAPERCUT_COASTAL"
    }
  });

  assert.equal(assignment.assetId, "TREE_COASTAL_001");
  assert.equal(assignment.selectedVariant, "coastal");
  assert.match(assignment.reason, /matched_coastal/);
});

test("house variant selection resolves rural presentation deterministically", () => {
  const system = assetVariantModule.createAssetVariantSystem();
  const assignment = system.resolveVariant({
    baseAssetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    environmentContext: {
      biome: "FARMLAND",
      climate: "DRY_TEMPERATE",
      regionProfile: "REGIONAL_TOWN",
      environmentType: "RURAL_RESIDENTIAL",
      styleProfile: "QUIET_RURAL"
    }
  });

  assert.equal(assignment.assetId, "BUILDING_RESIDENTIAL_HOUSE_RURAL_001");
  assert.equal(assignment.selectedVariant, "rural");
  assert.equal(assignment.validation.compatibilityPreserved, true);
});

test("commercial variant selection resolves coastal bakery presentation deterministically", () => {
  const system = assetVariantModule.createAssetVariantSystem();
  const assignment = system.resolveVariant({
    baseRecipeId: "BAKERY_RECIPE_001",
    environmentContext: {
      biome: "COASTAL",
      climate: "MARITIME",
      regionProfile: "SMALL_COASTAL_TOWN",
      environmentType: "COASTAL_COMMERCIAL",
      styleProfile: "BRIGHT_COASTAL"
    }
  });

  assert.equal(assignment.assetId, "BUILDING_COMMERCIAL_BAKERY_SMALL_001");
  assert.equal(assignment.selectedVariant, "coastal");
  assert.match(assignment.reason, /regionProfile:SMALL_COASTAL_TOWN/);
});

test("same variant input produces deterministic same output", () => {
  const system = assetVariantModule.createAssetVariantSystem();
  const selection = {
    baseAssetId: "TREE_EUCALYPTUS_001",
    environmentContext: {
      biome: "URBAN_STREET",
      climate: "TEMPERATE",
      regionProfile: "SUBURBAN_CITY_EDGE",
      environmentType: "STREET_TREE",
      styleProfile: "CLEAN_URBAN"
    }
  };

  const first = system.resolveVariant(selection);
  const second = system.resolveVariant(selection);

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicVariantHash,
    second.validation.deterministicVariantHash
  );
});

test("explicit asset variant system validation passes contract checks", () => {
  const system = assetVariantModule.createAssetVariantSystem();
  const validation = assetVariantModule.validateAssetVariantSystem(system);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetVariantSystem.validation.baseAssetExists, true);
  assert.equal(validation.assetVariantSystem.validation.compatibilityPreserved, true);
});

test("explicit asset variant assignment validation passes contract checks", () => {
  const system = assetVariantModule.createAssetVariantSystem();
  const assignment = system.resolveVariant({
    baseAssetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    environmentContext: {
      biome: "SUBURBAN_PARKLAND",
      climate: "TEMPERATE",
      regionProfile: "SUBURBAN_CITY_EDGE",
      environmentType: "RESIDENTIAL_AREA",
      styleProfile: "CLEAN_SUBURBAN"
    }
  });
  const validation = assetVariantModule.validateAssetVariantAssignment(assignment, system);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetVariantAssignment.validation.variantExists, true);
  assert.equal(validation.assetVariantAssignment.validation.validationPassed, true);
});
