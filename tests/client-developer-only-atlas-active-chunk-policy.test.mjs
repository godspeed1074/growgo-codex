import test from "node:test";
import assert from "node:assert/strict";
import { selectVisibleAtlasChunks } from "../client/developer-only-atlas-chunk-identity.mjs";
import { DEFAULT_DEVELOPER_ONLY_ATLAS_MAX_ACTIVE_CHUNKS, prioritizeAtlasActiveChunks } from "../client/developer-only-atlas-active-chunk-policy.mjs";
import { createAtlasChunkPopulationReconciler, reconcileAtlasChunkPopulation, releaseAtlasChunkPopulation, getAtlasChunkPopulationReconcilerStatus } from "../client/developer-only-atlas-chunk-population-reconciler.mjs";

const cap = 4;
const identity = { regionId: "BELLARINE", packageId: "ATLAS_DEVELOPER_PACKAGE", recipeId: "COASTAL_LOCATION_RECIPE_001", selectorSeed: "PRESSURE_SEED" };
const viewports = [
  { name: "Cowes", bounds: { south: -38.465, west: 145.235, north: -38.455, east: 145.245 } },
  { name: "Silverleaves", bounds: { south: -38.455, west: 145.255, north: -38.445, east: 145.265 } },
  { name: "Rhyll", bounds: { south: -38.505, west: 145.295, north: -38.495, east: 145.305 } },
  { name: "Central", bounds: { south: -38.485, west: 145.335, north: -38.475, east: 145.345 } },
  { name: "Western", bounds: { south: -38.495, west: 145.165, north: -38.485, east: 145.175 } }
];

function requested(bounds) { return selectVisibleAtlasChunks({ bounds, marginChunks: 2 }).chunks; }
function policy(bounds) { return prioritizeAtlasActiveChunks({ chunks: requested(bounds), viewportBounds: bounds, maxActiveChunks: cap }); }

test("default active cap is conservative and explicitly bounded", () => {
  assert.equal(DEFAULT_DEVELOPER_ONLY_ATLAS_MAX_ACTIVE_CHUNKS, 16);
  assert.throws(() => prioritizeAtlasActiveChunks({ chunks: [], viewportBounds: viewports[0].bounds, maxActiveChunks: 0 }), /ATLAS_ACTIVE_CHUNK_CAP_INVALID/);
});

test("visible chunks win over safety-margin chunks and ordering is deterministic", () => {
  const first = policy(viewports[0].bounds);
  const second = policy(viewports[0].bounds);
  assert.deepEqual(first.activeChunkIds, second.activeChunkIds);
  assert.equal(first.activeChunks.length, cap);
  assert.equal(first.visibleRequestedChunkCount > 0, true);
  assert.equal(first.evictedChunks.length > 0, true);
  assert.equal(first.activeChunks.every((chunk) => chunk.bounds.south < viewports[0].bounds.north && chunk.bounds.north > viewports[0].bounds.south && chunk.bounds.west < viewports[0].bounds.east && chunk.bounds.east > viewports[0].bounds.west), true);
});

test("long Phillip Island traversal remains bounded, unique, and recreates prior population deterministically", () => {
  const operations = { apply: 0, release: 0 };
  const reconciler = createAtlasChunkPopulationReconciler({
    populationFactory: ({ chunk }) => [
      { populationId: `TREE_${chunk.chunkId}`, assetId: "TREE_EUCALYPTUS_001", placement: { x: chunk.x, y: chunk.y, rotation: 0 } },
      { populationId: `SHRUB_${chunk.chunkId}`, assetId: "SHRUB_COASTAL_LOW_001", placement: { x: chunk.x + 0.25, y: chunk.y, rotation: 90 } }
    ],
    populationApplyProvider: () => { operations.apply += 1; return { applied: true }; },
    populationReleaseProvider: () => { operations.release += 1; return { released: true }; }
  });
  const sequence = [...viewports, ...viewports.slice().reverse(), ...viewports, viewports[0]];
  let peakRequested = 0, peakActive = 0, peakReferences = 0;
  let cowesIds = null;
  for (const viewport of sequence) {
    const selection = policy(viewport.bounds);
    peakRequested = Math.max(peakRequested, selection.requestedChunks.length);
    peakActive = Math.max(peakActive, selection.activeChunks.length);
    const result = reconcileAtlasChunkPopulation(reconciler, { chunks: selection.activeChunks, identity });
    assert.equal(result.outcome, "reconciled");
    assert.equal(result.status.activeChunkCount <= cap, true);
    assert.equal(new Set(result.status.activePopulationIds).size, result.status.populationReferenceCount);
    peakReferences = Math.max(peakReferences, result.status.populationReferenceCount);
    if (viewport.name === "Cowes" && cowesIds == null) cowesIds = result.status.activePopulationIds;
  }
  const finalCowes = getAtlasChunkPopulationReconcilerStatus(reconciler).activePopulationIds;
  assert.deepEqual(finalCowes, cowesIds);
  assert.equal(peakRequested > cap, true);
  assert.equal(peakActive, cap);
  assert.equal(peakReferences, cap * 2);
  assert.equal(operations.apply > 0 && operations.release > 0, true);
  assert.equal(releaseAtlasChunkPopulation(reconciler, { identity }).status.populationReferenceCount, 0);
});

test("A to B boundary churn and four-way intersections do not accumulate ownership", () => {
  const a = viewports[0].bounds;
  const b = { south: -38.465, west: 145.245, north: -38.455, east: 145.255 };
  const intersection = { south: -38.46, west: 145.24, north: -38.44, east: 145.26 };
  const ids = [a, b, a, b, a, intersection, b, a].map((bounds) => policy(bounds).activeChunkIds);
  assert.deepEqual(ids[0], ids[2]);
  assert.deepEqual(ids[1], ids[3]);
  assert.equal(new Set(ids.flat()).size >= cap, true);
  assert.equal(ids.every((chunkIds) => chunkIds.length <= cap), true);
});
