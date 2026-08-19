import { createDeveloperOnlyAtlasAssetRegistry } from "./developer-only-atlas-asset-registry.mjs";
import {
  createAtlasChunkPopulationReconciler,
  getAtlasChunkPopulationReconcilerStatus,
  reconcileAtlasChunkPopulation,
  releaseAtlasChunkPopulation
} from "./developer-only-atlas-chunk-population-reconciler.mjs";
import { createPhillipIslandProofPopulation } from "./developer-only-phillip-island-geography-manifest.mjs";

const SLOT_IDS = Object.freeze(["first", "second", "third", "fourth"]);
const PHILLIP_ISLAND_SLICE_IDENTITY = Object.freeze({
  mapIdentityId: "MAP_PHILLIP_ISLAND_DEVELOPER_V1",
  regionId: "REGION_PHILLIP_ISLAND_V1",
  packageId: "PHILLIP_ISLAND_WORLD_PACKAGE_V1",
  recipeId: "COASTAL_LOCATION_RECIPE_001",
  selectorSeed: "PHILLIP_ISLAND_VISIBLE_SLICE_V1"
});

function deepFreeze(value) { return Object.freeze(value); }
function fail(reasonCode) { throw Object.assign(new Error(reasonCode), { reasonCode }); }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function sorted(values) { return [...values].sort((a, b) => a.populationId.localeCompare(b.populationId)); }

function status(slice) {
  const ownership = getAtlasChunkPopulationReconcilerStatus(slice.__internal.reconciler);
  return deepFreeze({
    schemaId: "GROWGO_DEVELOPER_ONLY_PHILLIP_ISLAND_VISIBLE_POPULATION_SLICE_STATUS_V1",
    ready: slice.__state.ready,
    visiblePopulationIds: sorted([...slice.__internal.references.values()]).map((reference) => reference.populationId),
    visibleAssetIds: sorted([...slice.__internal.references.values()]).map((reference) => reference.assetId),
    activeChunkIds: ownership.activeChunkIds,
    activeChunkCount: ownership.activeChunkCount,
    populationReferenceCount: ownership.populationReferenceCount,
    orphanOwnershipCount: 0,
    rendererSlotCount: slice.__internal.references.size,
    lastFailureReason: slice.__state.lastFailureReason,
    canonicalSafetyFlags: deepFreeze({ runtimeExecutionEnabled: false, mapAttachmentAllowed: false, automaticRendererExecutionAllowed: false, lifecycleExecutionEnabled: false })
  });
}

function requireSlice(slice) {
  if (!slice?.__growgoDeveloperOnlyPhillipIslandVisiblePopulationSlice || !slice.__internal) fail("PHILLIP_ISLAND_VISIBLE_SLICE_UNAVAILABLE");
  return slice;
}

async function syncRenderer(slice) {
  const renderer = slice.__internal.sharedAssetController;
  const references = sorted([...slice.__internal.references.values()]);
  if (references.length > SLOT_IDS.length) fail("PHILLIP_ISLAND_VISIBLE_SLICE_CAP_EXCEEDED");
  const initialize = renderer.initializeSharedApprovedLiveAssetRenderer();
  if (initialize?.outcome === "blocked" || initialize?.outcome === "failed_closed") fail(initialize.reasonCode ?? "PHILLIP_ISLAND_SHARED_RENDERER_BLOCKED");
  for (let index = 0; index < SLOT_IDS.length; index += 1) {
    const reference = references[index];
    const outcome = reference
      ? await renderer.createApprovedSharedAssetModelInstance({ slotId: SLOT_IDS[index], assetId: reference.assetId, assetVersion: reference.placement.assetVersion, latitude: reference.coordinate.latitude, longitude: reference.coordinate.longitude })
      : renderer.removeApprovedSharedAssetModelInstance({ slotId: SLOT_IDS[index] });
    if (outcome?.outcome === "blocked" || outcome?.outcome === "failed_closed") fail(outcome.reasonCode ?? "PHILLIP_ISLAND_SHARED_RENDERER_FAILED");
  }
}

export function createDeveloperOnlyPhillipIslandVisiblePopulationSlice({
  sharedAssetController,
  assetRegistry = createDeveloperOnlyAtlasAssetRegistry()
} = {}) {
  if (!sharedAssetController?.initializeSharedApprovedLiveAssetRenderer || !sharedAssetController?.createApprovedSharedAssetModelInstance || !sharedAssetController?.removeApprovedSharedAssetModelInstance) fail("PHILLIP_ISLAND_SHARED_RENDERER_UNAVAILABLE");
  const references = new Map();
  const reconciler = createAtlasChunkPopulationReconciler({
    assetRegistry,
    populationFactory: ({ chunk }) => createPhillipIslandProofPopulation(chunk, { registry: assetRegistry }).population.map((reference) => ({ ...reference, owningChunkId: chunk.chunkId })),
    populationApplyProvider: ({ references: next }) => {
      for (const reference of next) references.set(reference.populationId, reference);
      return { applied: true };
    },
    populationReleaseProvider: ({ references: removed }) => {
      for (const reference of removed) references.delete(reference.populationId);
      return { released: true };
    }
  });
  return Object.freeze({ __growgoDeveloperOnlyPhillipIslandVisiblePopulationSlice: true, __state: { ready: true, lastFailureReason: null }, __internal: { assetRegistry, sharedAssetController, reconciler, references } });
}

export async function reconcileDeveloperOnlyPhillipIslandVisiblePopulation(slice, { chunks = [], identity = PHILLIP_ISLAND_SLICE_IDENTITY } = {}) {
  requireSlice(slice);
  const result = reconcileAtlasChunkPopulation(slice.__internal.reconciler, { chunks, identity });
  if (result.outcome !== "reconciled") {
    slice.__state.lastFailureReason = result.reasonCode;
    return deepFreeze({ outcome: "failed_closed", reasonCode: result.reasonCode, status: status(slice) });
  }
  try {
    await syncRenderer(slice);
    slice.__state.lastFailureReason = null;
    return deepFreeze({ outcome: "rendered", reasonCode: "PHILLIP_ISLAND_VISIBLE_POPULATION_RENDERED", diff: result.diff, status: status(slice) });
  } catch (error) {
    const reasonCode = error?.reasonCode ?? "PHILLIP_ISLAND_SHARED_RENDERER_FAILED";
    releaseAtlasChunkPopulation(slice.__internal.reconciler, { identity });
    slice.__internal.references.clear();
    try { slice.__internal.sharedAssetController.clearApprovedSharedAssetModelInstances?.(); } catch {}
    slice.__state.lastFailureReason = reasonCode;
    return deepFreeze({ outcome: "failed_closed", reasonCode, status: status(slice) });
  }
}

export async function releaseDeveloperOnlyPhillipIslandVisiblePopulation(slice, { identity = PHILLIP_ISLAND_SLICE_IDENTITY } = {}) {
  requireSlice(slice);
  const released = releaseAtlasChunkPopulation(slice.__internal.reconciler, { identity });
  slice.__internal.references.clear();
  const rendererResult = slice.__internal.sharedAssetController.clearApprovedSharedAssetModelInstances?.();
  if (released.outcome !== "released" || rendererResult?.outcome === "failed_closed") {
    const reasonCode = released.reasonCode ?? rendererResult?.reasonCode ?? "PHILLIP_ISLAND_VISIBLE_RELEASE_FAILED";
    slice.__state.lastFailureReason = reasonCode;
    return deepFreeze({ outcome: "failed_closed", reasonCode, status: status(slice) });
  }
  slice.__state.lastFailureReason = null;
  return deepFreeze({ outcome: "released", reasonCode: "PHILLIP_ISLAND_VISIBLE_POPULATION_RELEASED", status: status(slice) });
}

export function getDeveloperOnlyPhillipIslandVisiblePopulationSliceStatus(slice) { requireSlice(slice); return status(slice); }
