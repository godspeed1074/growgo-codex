import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const biomePreviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "environment-and-biome-preview-foundation.mjs"
  )
);

test("environment and biome preview foundation validates deterministic biome filling for a controlled real location preview", () => {
  const result =
    biomePreviewModule.validateEnvironmentAndBiomePreviewFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.environmentBiomePreview.selectedBiome.biomeId,
    "COASTAL_GRASSLAND_RECIPE_001"
  );
  assert.deepEqual(
    result.environmentBiomePreview.environmentModules.map((entry) => entry.assetId),
    [
      "GRASS_PATCH_001",
      "TREE_EUCALYPTUS_001",
      "ROCK_COASTAL_001",
      "BUSH_NATIVE_001",
      "TRAIL_PATH_SMALL_001",
      "FENCE_WOOD_001",
      "BENCH_PARK_001"
    ]
  );
  assert.deepEqual(
    result.environmentBiomePreview.environmentModules.map(
      (entry) => entry.moduleGroup
    ),
    ["grass", "trees", "rocks", "shrubs", "paths", "fences", "parkObjects"]
  );
});

test("same location, world seed, and biome produce identical deterministic environment output", () => {
  const first =
    biomePreviewModule.validateEnvironmentAndBiomePreviewFoundation();
  const second =
    biomePreviewModule.validateEnvironmentAndBiomePreviewFoundation();
  const third =
    biomePreviewModule.validateEnvironmentAndBiomePreviewFoundation({
      ...biomePreviewModule.environmentAndBiomePreviewFoundationDefinition,
      locationRequest: {
        ...biomePreviewModule.environmentAndBiomePreviewFoundationDefinition.locationRequest,
        worldSeed: "growgo-coastal-alpha-seed-002"
      }
    });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(third.ok, true);
  assert.deepEqual(
    first.environmentBiomePreview.environmentModules,
    second.environmentBiomePreview.environmentModules
  );
  assert.notDeepEqual(
    first.environmentBiomePreview.environmentModules,
    third.environmentBiomePreview.environmentModules
  );
});

test("environment and biome preview foundation rejects mismatched expected environment assets safely", () => {
  const invalid =
    biomePreviewModule.validateEnvironmentAndBiomePreviewFoundation({
      ...biomePreviewModule.environmentAndBiomePreviewFoundationDefinition,
      expectedEnvironmentAssetIds: [
        "TREE_EUCALYPTUS_001",
        "GRASS_PATCH_001",
        "ROCK_COASTAL_001",
        "BUSH_NATIVE_001",
        "TRAIL_PATH_SMALL_001",
        "FENCE_WOOD_001",
        "BENCH_PARK_001"
      ]
    });

  assert.equal(invalid.ok, false);
  assert.equal(invalid.errorCode, "environment_asset_mismatch");
});

test("environment and biome preview foundation remains passive and does not create live world objects or external map connections", () => {
  const result =
    biomePreviewModule.validateEnvironmentAndBiomePreviewFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.environmentBiomePreview.compatibility.passiveOnly, true);
  assert.equal(
    result.environmentBiomePreview.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.environmentBiomePreview.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    result.environmentBiomePreview.compatibility.liveWorldObjectsCreated,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.environmentBiomePreview,
      "gpsHandle"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.environmentBiomePreview,
      "runtimeWorld"
    ),
    false
  );
});
