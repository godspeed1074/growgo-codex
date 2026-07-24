import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const batchModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-starter-pack-blender-batch-001-foundation.mjs"
  )
);

test("coastal starter Blender Batch 001 validates the approved first production batch", () => {
  const result = batchModule.validateCoastalStarterPackBlenderBatch001();

  assert.equal(result.ok, true);
  assert.equal(
    result.batch.definition.batchId,
    "COASTAL_STARTER_PACK_BLENDER_BATCH_001"
  );
  assert.equal(result.batch.definition.blenderJobs.length, 5);
  assert.deepEqual(
    result.batch.definition.blenderJobs.map((job) => job.assetId),
    [
      "GROUND_COASTAL_GRASS_001",
      "TREE_EUCALYPTUS_001",
      "ROAD_COASTAL_001",
      "BUILDING_COASTAL_COTTAGE_001",
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    ]
  );
});

test("coastal starter Blender Batch 001 preserves the required Blender scene contract and GLB exports", () => {
  const result = batchModule.validateCoastalStarterPackBlenderBatch001();
  const lighthouseJob = result.batch.definition.blenderJobs[4];

  assert.equal(result.ok, true);
  assert.deepEqual(
    lighthouseJob.sceneRequirements.requiredCollections,
    ["GEOMETRY", "MATERIALS", "LOD0", "LOD1", "LOD2", "LOD3", "EXPORT"]
  );
  assert.equal(lighthouseJob.exportRequirements.format, "glb");
  assert.equal(
    lighthouseJob.exportRequirements.lodExports.distantSilhouette,
    "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_DISTANT_SILHOUETTE.glb"
  );
});

test("coastal starter Blender Batch 001 carries mobile performance metadata for each job", () => {
  const result = batchModule.validateCoastalStarterPackBlenderBatch001();
  const treeJob = result.batch.definition.blenderJobs[1];

  assert.equal(result.ok, true);
  assert.equal(
    treeJob.validationRequirements.mobilePerformanceMetadata.storageTargetKb > 0,
    true
  );
  assert.equal(
    treeJob.validationRequirements.mobilePerformanceMetadata.textureStrategy,
    "shared_atlas_mobile_ready"
  );
});

test("coastal starter Blender Batch 001 rejects invalid asset identities safely", () => {
  const invalidBatch = structuredClone(
    batchModule.coastalStarterPackBlenderBatch001Definition
  );
  invalidBatch.blenderJobs[0].assetId = "GROUND_COASTAL_GRASS_INVALID";

  const result = batchModule.validateCoastalStarterPackBlenderBatch001(
    invalidBatch
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_identifier");
});
