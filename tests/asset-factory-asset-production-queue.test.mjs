import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assetProductionQueueModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-production-queue.mjs")
);

test("queue generation ranks registry assets into a deterministic production order", () => {
  const layer = assetProductionQueueModule.createAssetProductionQueueLayer();
  const topFive = layer.queue.entries.slice(0, 5);

  assert.equal(layer.queue.summary.candidateCount > 20, true);
  assert.deepEqual(
    topFive.map((entry) => entry.assetId),
    [
      "BUILDING_CIVIC_SPORTS_PAVILION_001",
      "BUILDING_CIVIC_SCHOOL_PRIMARY_001",
      "BUILDING_CIVIC_COMMUNITY_HALL_001",
      "BUILDING_CIVIC_LIBRARY_SMALL_001",
      "ROAD_SURFACE_RESIDENTIAL_STREET_001"
    ]
  );
  assert.deepEqual(
    topFive.map((entry) => entry.recommendedOrder),
    [1, 2, 3, 4, 5]
  );
});

test("priority ordering keeps scores descending and preserves pack context", () => {
  const layer = assetProductionQueueModule.createAssetProductionQueueLayer();
  const roadEntry = layer.getQueueEntry("ROAD_SURFACE_RESIDENTIAL_STREET_001");
  const shopEntry = layer.getQueueEntry("BUILDING_COMMERCIAL_SMALL_SHOP_001");

  assert.ok(roadEntry);
  assert.ok(shopEntry);
  assert.equal(roadEntry.pack, "ROAD_AND_STREET_ASSET_PACK_001");
  assert.equal(shopEntry.pack, "COMMERCIAL_ASSET_PACK_001");
  assert.equal(roadEntry.priorityScore >= shopEntry.priorityScore, true);
  assert.equal(roadEntry.scoreBreakdown.variantValueScore, 100);
});

test("missing asset handling rejects unknown queue candidates", () => {
  assert.throws(
    () =>
      assetProductionQueueModule.createAssetProductionQueueLayer({
        candidateAssetIds: ["BUILDING_RESIDENTIAL_SUBURBAN_001", "UNKNOWN_ASSET_001"]
      }),
    /does not exist in the Asset Factory registry/
  );
});

test("same inputs produce deterministic same queue output", () => {
  const first = assetProductionQueueModule.createAssetProductionQueueLayer();
  const second = assetProductionQueueModule.createAssetProductionQueueLayer();

  assert.deepEqual(first.queue, second.queue);
  assert.equal(
    first.validation.deterministicQueueHash,
    second.validation.deterministicQueueHash
  );
});

test("explicit queue validation passes contract checks", () => {
  const layer = assetProductionQueueModule.createAssetProductionQueueLayer();
  const validation = assetProductionQueueModule.validateAssetProductionQueue(layer.queue);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetProductionQueue.validation.deterministicOrdering, true);
  assert.equal(validation.assetProductionQueue.validation.validAssetIds, true);
  assert.equal(validation.assetProductionQueue.validation.validPriorityScores, true);
  assert.equal(validation.assetProductionQueue.validation.noDuplicateQueueEntries, true);
});
