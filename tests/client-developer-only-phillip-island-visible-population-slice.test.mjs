import test from "node:test";
import assert from "node:assert/strict";
import { phillipIslandProofChunks } from "../client/developer-only-phillip-island-geography-manifest.mjs";
import {
  createDeveloperOnlyPhillipIslandVisiblePopulationSlice,
  getDeveloperOnlyPhillipIslandVisiblePopulationSliceStatus,
  reconcileDeveloperOnlyPhillipIslandVisiblePopulation,
  releaseDeveloperOnlyPhillipIslandVisiblePopulation
} from "../client/developer-only-phillip-island-visible-population-slice.mjs";

function createSharedRenderer({ blocked = false } = {}) {
  const state = { initializeCount: 0, createCalls: [], removeCalls: [], clearCount: 0, slots: new Map() };
  return {
    state,
    initializeSharedApprovedLiveAssetRenderer() {
      state.initializeCount += 1;
      return blocked ? { outcome: "blocked", reasonCode: "ATLAS_NOT_ATTACHED" } : { outcome: "ready" };
    },
    async createApprovedSharedAssetModelInstance(input) {
      state.createCalls.push(input);
      state.slots.set(input.slotId, input);
      return { outcome: "created", reasonCode: "ATLAS_TRUE_3D_RENDERED" };
    },
    removeApprovedSharedAssetModelInstance({ slotId }) {
      state.removeCalls.push(slotId);
      state.slots.delete(slotId);
      return { outcome: "removed" };
    },
    clearApprovedSharedAssetModelInstances() {
      state.clearCount += 1;
      state.slots.clear();
      return { outcome: "removed" };
    }
  };
}

test("manifest feeds Cowes, rural, and coastal chunk ownership through the shared renderer contract", async () => {
  const renderer = createSharedRenderer();
  const slice = createDeveloperOnlyPhillipIslandVisiblePopulationSlice({ sharedAssetController: renderer });
  const chunks = phillipIslandProofChunks();

  const cowes = await reconcileDeveloperOnlyPhillipIslandVisiblePopulation(slice, { chunks: [chunks.COWES] });
  assert.equal(cowes.outcome, "rendered");
  assert.equal(cowes.status.populationReferenceCount, 3);
  assert.equal(cowes.status.visibleAssetIds.includes("BUILDING_CIVIC_SPORTS_PAVILION_001"), true);
  const cowesPopulation = cowes.status.visiblePopulationIds;

  const rural = await reconcileDeveloperOnlyPhillipIslandVisiblePopulation(slice, { chunks: [chunks.CENTRAL_RURAL] });
  assert.equal(rural.outcome, "rendered");
  assert.equal(rural.status.populationReferenceCount, 2);
  assert.equal(rural.status.visibleAssetIds.includes("BUILDING_CIVIC_SPORTS_PAVILION_001"), false);

  const coastal = await reconcileDeveloperOnlyPhillipIslandVisiblePopulation(slice, { chunks: [chunks.WESTERN_COASTAL] });
  assert.equal(coastal.outcome, "rendered");
  assert.deepEqual(coastal.status.visibleAssetIds, ["SHRUB_COASTAL_LOW_001", "TREE_BOTTLEBRUSH_001"]);
  assert.equal(renderer.state.slots.size, 2);

  const returnToCowes = await reconcileDeveloperOnlyPhillipIslandVisiblePopulation(slice, { chunks: [chunks.COWES] });
  assert.equal(returnToCowes.outcome, "rendered");
  assert.deepEqual(returnToCowes.status.visiblePopulationIds, cowesPopulation);
  assert.equal(new Set(returnToCowes.status.visiblePopulationIds).size, returnToCowes.status.populationReferenceCount);
  assert.equal(renderer.state.initializeCount, 4);
});

test("movement release and detach clear chunk ownership and all shared-renderer slots", async () => {
  const renderer = createSharedRenderer();
  const slice = createDeveloperOnlyPhillipIslandVisiblePopulationSlice({ sharedAssetController: renderer });
  const chunks = phillipIslandProofChunks();
  await reconcileDeveloperOnlyPhillipIslandVisiblePopulation(slice, { chunks: [chunks.COWES] });
  await reconcileDeveloperOnlyPhillipIslandVisiblePopulation(slice, { chunks: [chunks.CENTRAL_RURAL] });
  const released = await releaseDeveloperOnlyPhillipIslandVisiblePopulation(slice);
  assert.equal(released.outcome, "released");
  assert.equal(released.status.activeChunkCount, 0);
  assert.equal(released.status.populationReferenceCount, 0);
  assert.equal(released.status.orphanOwnershipCount, 0);
  assert.equal(renderer.state.slots.size, 0);
  assert.equal(renderer.state.clearCount, 1);
});

test("an unauthorized shared renderer fails closed and leaves no population ownership", async () => {
  const renderer = createSharedRenderer({ blocked: true });
  const slice = createDeveloperOnlyPhillipIslandVisiblePopulationSlice({ sharedAssetController: renderer });
  const result = await reconcileDeveloperOnlyPhillipIslandVisiblePopulation(slice, { chunks: [phillipIslandProofChunks().COWES] });
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "ATLAS_NOT_ATTACHED");
  const resultStatus = getDeveloperOnlyPhillipIslandVisiblePopulationSliceStatus(slice);
  assert.equal(resultStatus.activeChunkCount, 0);
  assert.equal(resultStatus.populationReferenceCount, 0);
  assert.equal(renderer.state.slots.size, 0);
});
