import test from "node:test";
import assert from "node:assert/strict";
import { atlasChunkFromCoordinates } from "../client/developer-only-atlas-chunk-identity.mjs";
import { createAtlasChunkPopulationReconciler, getAtlasChunkPopulationReconcilerStatus, reconcileAtlasChunkPopulation, releaseAtlasChunkPopulation } from "../client/developer-only-atlas-chunk-population-reconciler.mjs";

const identity = { regionId: "BELLARINE", packageId: "ATLAS_DEVELOPER_PACKAGE", recipeId: "COASTAL_LOCATION_RECIPE_001", selectorSeed: "PI_SEED_001" };
const a = atlasChunkFromCoordinates({ x: 32523, y: 5151 });
const b = atlasChunkFromCoordinates({ x: 32524, y: 5151 });
const c = atlasChunkFromCoordinates({ x: 32525, y: 5151 });

function harness({ factory, apply, release } = {}) {
  const calls = { factory: [], apply: [], release: [] };
  const populationFactory = factory ?? (({ chunk }) => ["TREE_EUCALYPTUS_001", "SHRUB_COASTAL_LOW_001"].map((assetId, index) => ({ populationId: `ATLAS_POP_${chunk.chunkId}_${index + 1}`, assetId, placement: { x: chunk.x + index, y: chunk.y, rotation: index * 90 } })));
  return {
    calls,
    reconciler: createAtlasChunkPopulationReconciler({
      populationFactory: (input) => { calls.factory.push(input.chunk.chunkId); return populationFactory(input); },
      populationApplyProvider: (input) => { calls.apply.push(input); return apply ? apply(input) : { applied: true }; },
      populationReleaseProvider: (input) => { calls.release.push(input); return release ? release(input) : { released: true }; }
    })
  };
}

test("creates deterministic registry-backed population for added chunks", () => {
  const h = harness();
  const result = reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a, b], identity });
  assert.equal(result.outcome, "reconciled");
  assert.deepEqual(h.calls.factory, [a.chunkId, b.chunkId]);
  assert.equal(result.status.populationReferenceCount, 4);
  assert.equal(new Set(result.status.activePopulationIds).size, 4);
});

test("retained chunks are a no-op under repeated reconciliation", () => {
  const h = harness();
  reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a], identity });
  const again = reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a], identity });
  assert.equal(again.diff.retain.length, 1);
  assert.equal(h.calls.factory.length, 1);
  assert.equal(h.calls.apply.length, 1);
});

test("removed chunks release only their owned population", () => {
  const h = harness();
  reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a, b], identity });
  reconcileAtlasChunkPopulation(h.reconciler, { chunks: [b], identity });
  assert.equal(h.calls.release.length, 1);
  assert.equal(h.calls.release[0].chunk.chunkId, a.chunkId);
  assert.deepEqual(getAtlasChunkPopulationReconcilerStatus(h.reconciler).activeChunkIds, [b.chunkId]);
});

test("A to B to C to A recreates the exact same deterministic population IDs", () => {
  const h = harness();
  const first = reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a], identity }).status.activePopulationIds;
  reconcileAtlasChunkPopulation(h.reconciler, { chunks: [b], identity });
  reconcileAtlasChunkPopulation(h.reconciler, { chunks: [c], identity });
  const returned = reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a], identity }).status.activePopulationIds;
  assert.deepEqual(returned, first);
});

test("rejects duplicate population IDs before applying corrupted ownership", () => {
  const h = harness({ factory: () => [{ populationId: "DUP", assetId: "TREE_EUCALYPTUS_001" }, { populationId: "DUP", assetId: "SHRUB_COASTAL_LOW_001" }] });
  const result = reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a], identity });
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "CHUNK_POPULATION_DUPLICATE_ID");
  assert.equal(h.calls.apply.length, 0);
});

test("rejects unregistered assets without committing any ownership", () => {
  const h = harness({ factory: () => [{ populationId: "UNKNOWN", assetId: "NOT_REGISTERED" }] });
  const result = reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a], identity });
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "UNKNOWN_ASSET_ID");
  assert.equal(result.status.activeChunkCount, 0);
});

test("apply failure leaves the last-good ownership intact", () => {
  let fail = false;
  const h = harness({ apply: () => fail ? { applied: false, reasonCode: "APPLY_FAIL" } : { applied: true } });
  reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a], identity });
  fail = true;
  const result = reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a, b], identity });
  assert.equal(result.reasonCode, "APPLY_FAIL");
  assert.deepEqual(result.status.activeChunkIds, [a.chunkId]);
});

test("release failure preserves ownership rather than silently dropping references", () => {
  let fail = false;
  const h = harness({ release: () => fail ? { released: false, reasonCode: "RELEASE_FAIL" } : { released: true } });
  reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a], identity });
  fail = true;
  const result = reconcileAtlasChunkPopulation(h.reconciler, { chunks: [], identity });
  assert.equal(result.reasonCode, "RELEASE_FAIL");
  assert.deepEqual(result.status.activeChunkIds, [a.chunkId]);
});

test("detach releases every active chunk and clears all references", () => {
  const h = harness();
  reconcileAtlasChunkPopulation(h.reconciler, { chunks: [a, b], identity });
  const result = releaseAtlasChunkPopulation(h.reconciler, { identity });
  assert.equal(result.outcome, "released");
  assert.equal(result.status.activeChunkCount, 0);
  assert.equal(result.status.populationReferenceCount, 0);
  assert.equal(h.calls.release.length, 2);
});
