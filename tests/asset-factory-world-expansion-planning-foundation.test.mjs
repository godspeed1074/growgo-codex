import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-expansion-planning-foundation.mjs"
  )
);
const resolverModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-coordinate-world-resolver-foundation.mjs"
  )
);
const sceneModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-settlement-atlas-scene-expansion.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["WorldExpansionPlanningMaterialA", "WorldExpansionPlanningMaterialB"]
} = {}) {
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: materialNames.map((name) => ({ name }))
  });
  const jsonBytes = new TextEncoder().encode(json);
  const paddedJsonLength = Math.ceil(jsonBytes.length / 4) * 4;
  const totalLength = 12 + 8 + paddedJsonLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, paddedJsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(arrayBuffer, 20, paddedJsonLength).set(jsonBytes);
  return arrayBuffer;
}

function buildLoaderOptions() {
  return {
    existsSync() {
      return true;
    },
    loadArrayBuffer() {
      return Promise.resolve(createSyntheticGlb());
    },
    allowFallbackShowcase: true
  };
}

test("world expansion planning foundation creates a passive region framework anchored to the existing coastal first location", async () => {
  const framework =
    await moduleUnderTest.createWorldExpansionPlanningFoundation(
      moduleUnderTest.worldExpansionPlanningFoundationDefinition,
      buildLoaderOptions()
    );

  const validation =
    moduleUnderTest.validateWorldExpansionPlanningFoundation(framework);

  assert.equal(validation.ok, true);
  assert.match(framework.expansionFrameworkId, /^WORLD_EXPANSION_FRAMEWORK_/);
  assert.equal(framework.activeWorldLocation.activeRegionType, "coastal");
  assert.deepEqual(
    framework.worldExpansionRegistry.map((region) => region.regionType),
    ["coastal", "suburban", "rural", "urban"]
  );
  assert.equal(
    framework.regionGenerationPipeline.regionProfile.generationProfile.status,
    "active-first-location"
  );
  assert.equal(
    framework.regionGenerationPipeline.settlementGeneration.generatorId,
    "coastal-settlement-generator-foundation"
  );
  assert.equal(
    framework.regionGenerationPipeline.sceneAssembly.sceneAssemblyId,
    "map-world-settlement-atlas-scene-expansion"
  );
  assert.equal(
    framework.regionGenerationPipeline.poiSystems.availablePoiCategories.includes(
      "landmark"
    ),
    true
  );
  assert.equal(
    framework.validationResult.deterministicRegionOutputValid,
    true
  );
  assert.equal(
    framework.validationResult.profileCompatibilityValid,
    true
  );
  assert.equal(
    framework.validationResult.existingCoastalWorldUnchangedValid,
    true
  );
  assert.equal(framework.validationResult.cleanupValid, true);
});

test("world expansion planning foundation preserves the existing coastal world resolver and scene output unchanged", async () => {
  const framework =
    await moduleUnderTest.createWorldExpansionPlanningFoundation(
      moduleUnderTest.worldExpansionPlanningFoundationDefinition,
      buildLoaderOptions()
    );
  const directResolver =
    await resolverModule.createMapCoordinateWorldResolverFoundation(
      resolverModule.mapCoordinateWorldResolverFoundationDefinition,
      buildLoaderOptions()
    );
  const directScene =
    await sceneModule.createMapWorldSettlementAtlasSceneExpansion(
      sceneModule.mapWorldSettlementAtlasSceneExpansionDefinition,
      buildLoaderOptions()
    );

  assert.equal(
    framework.regionGenerationPipeline.worldLocation.worldId,
    directResolver.worldLocationResolver.worldId
  );
  assert.equal(
    framework.regionGenerationPipeline.settlementGeneration.settlementId,
    directResolver.settlement.settlementSummary.settlementId
  );
  assert.equal(
    framework.regionGenerationPipeline.sceneAssembly.sceneId,
    directScene.sceneId
  );
  assert.equal(
    framework.regionGenerationPipeline.sceneAssembly.objectInstanceCount,
    directScene.roadInstances.length +
      directScene.buildingInstances.length +
      directScene.vegetationInstances.length +
      directScene.landmarkInstances.length
  );
});

test("world expansion planning foundation remains deterministic and rejects unsupported region entries safely", async () => {
  const first =
    await moduleUnderTest.createWorldExpansionPlanningFoundation(
      moduleUnderTest.worldExpansionPlanningFoundationDefinition,
      buildLoaderOptions()
    );
  const second =
    await moduleUnderTest.createWorldExpansionPlanningFoundation(
      moduleUnderTest.worldExpansionPlanningFoundationDefinition,
      buildLoaderOptions()
    );

  assert.equal(first.expansionFrameworkId, second.expansionFrameworkId);
  assert.deepEqual(first.worldExpansionRegistry, second.worldExpansionRegistry);
  assert.deepEqual(
    first.regionGenerationPipeline.worldLocation,
    second.regionGenerationPipeline.worldLocation
  );

  const invalid = moduleUnderTest.validateWorldExpansionPlanningFoundation({
    ...first,
    worldExpansionRegistry: [
      {
        ...first.worldExpansionRegistry[0],
        regionType: "mountain"
      },
      ...first.worldExpansionRegistry.slice(1)
    ]
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.errorCode, "region_type_invalid");
});
