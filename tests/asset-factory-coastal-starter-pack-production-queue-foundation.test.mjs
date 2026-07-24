import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const queueModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-starter-pack-production-queue-foundation.mjs"
  )
);

test("coastal starter production queue validates successfully and creates the full queue", () => {
  const result = queueModule.validateCoastalStarterPackProductionQueue();

  assert.equal(result.ok, true);
  assert.equal(
    result.queue.definition.queueId,
    "COASTAL_STARTER_PACK_PRODUCTION_QUEUE_001"
  );
  assert.equal(result.queue.definition.productionJobs.length, 14);
  assert.equal(
    result.queue.definition.productionJobs[0].assetId,
    "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
});

test("coastal starter production queue keeps priority ordering in tier sequence", () => {
  const queue = queueModule.createCoastalStarterPackProductionQueue();
  const tiers = queue.productionJobs.map((job) => job.priorityTier);
  const firstTier2 = tiers.indexOf("tier2");
  const firstTier3 = tiers.indexOf("tier3");

  assert.notEqual(firstTier2, -1);
  assert.notEqual(firstTier3, -1);
  assert.equal(tiers.slice(0, firstTier2).every((tier) => tier === "tier1"), true);
  assert.equal(
    tiers.slice(firstTier2, firstTier3).every((tier) => tier === "tier2"),
    true
  );
  assert.equal(tiers.slice(firstTier3).every((tier) => tier === "tier3"), true);
});

test("coastal starter production queue rejects unresolved dependency references safely", () => {
  const invalidQueue = structuredClone(
    queueModule.coastalStarterPackProductionQueueDefinition
  );
  invalidQueue.productionJobs[10].dependencies.push("MISSING_COASTAL_DEPENDENCY_001");

  const result =
    queueModule.validateCoastalStarterPackProductionQueue(invalidQueue);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "missing_dependency_reference");
});

test("coastal starter production queue rejects invalid asset IDs safely", () => {
  const invalidQueue = structuredClone(
    queueModule.coastalStarterPackProductionQueueDefinition
  );
  invalidQueue.productionJobs[1].assetId = "COASTAL_COTTAGE_INVALID";

  const result =
    queueModule.validateCoastalStarterPackProductionQueue(invalidQueue);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_identifier");
});
