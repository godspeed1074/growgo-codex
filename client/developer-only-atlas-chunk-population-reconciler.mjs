import {
  createDeveloperOnlyAtlasAssetRegistry,
  resolveDeveloperOnlyAtlasAssetRegistryEntry
} from "./developer-only-atlas-asset-registry.mjs";
import { diffAtlasChunkSets, sortAtlasChunks } from "./developer-only-atlas-chunk-identity.mjs";

const STATUS_SCHEMA_ID = "GROWGO_DEVELOPER_ONLY_ATLAS_CHUNK_POPULATION_RECONCILER_STATUS_001";
const RESULT_SCHEMA_ID = "GROWGO_DEVELOPER_ONLY_ATLAS_CHUNK_POPULATION_RECONCILER_RESULT_001";

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.freeze(value);
}

function fail(reasonCode) {
  throw Object.assign(new Error(reasonCode), { reasonCode });
}

function reason(error, fallback) {
  return typeof error?.reasonCode === "string" ? error.reasonCode : fallback;
}

function available(fn) {
  return typeof fn === "function" && fn.__growgoUnavailable !== true;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function sortedReferences(references) {
  return [...references].sort((a, b) => a.populationId.localeCompare(b.populationId));
}

function validateReferences(chunk, references, registry, knownIds) {
  if (!Array.isArray(references) || references.length === 0) fail("CHUNK_POPULATION_INVALID");
  const local = new Set();
  const normalized = references.map((reference) => {
    const populationId = typeof reference?.populationId === "string" ? reference.populationId : null;
    const assetId = typeof reference?.assetId === "string" ? reference.assetId : null;
    if (!populationId || !assetId) fail("CHUNK_POPULATION_REFERENCE_INVALID");
    if (reference.owningChunkId != null && reference.owningChunkId !== chunk.chunkId) fail("CHUNK_POPULATION_OWNERSHIP_CONFLICT");
    if (local.has(populationId) || knownIds.has(populationId)) fail("CHUNK_POPULATION_DUPLICATE_ID");
    resolveDeveloperOnlyAtlasAssetRegistryEntry(registry, assetId);
    local.add(populationId);
    return deepFreeze({ ...clone(reference), populationId, assetId, owningChunkId: chunk.chunkId });
  });
  return sortedReferences(normalized);
}

function status(reconciler) {
  const internal = reconciler.__internal;
  const chunks = sortAtlasChunks([...internal.ownership.values()].map((entry) => entry.chunk));
  const references = [...internal.ownership.values()].flatMap((entry) => entry.references);
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    ready: reconciler.__state.ready,
    activeChunkIds: chunks.map((chunk) => chunk.chunkId),
    activeChunkCount: chunks.length,
    populationReferenceCount: references.length,
    activePopulationIds: sortedReferences(references).map((reference) => reference.populationId),
    lastFailureReason: reconciler.__state.lastFailureReason
  });
}

export function createAtlasChunkPopulationReconciler({
  assetRegistry = createDeveloperOnlyAtlasAssetRegistry(),
  populationFactory,
  populationApplyProvider,
  populationReleaseProvider
} = {}) {
  const reconciler = {
    __growgoDeveloperOnlyAtlasChunkPopulationReconciler: true,
    __state: { ready: available(populationFactory) && available(populationApplyProvider) && available(populationReleaseProvider), lastFailureReason: null },
    __internal: { assetRegistry, populationFactory, populationApplyProvider, populationReleaseProvider, ownership: new Map() }
  };
  return Object.freeze(reconciler);
}

export function getAtlasChunkPopulationReconcilerStatus(reconciler) {
  if (!reconciler?.__growgoDeveloperOnlyAtlasChunkPopulationReconciler) {
    return deepFreeze({ schemaId: STATUS_SCHEMA_ID, ready: false, activeChunkIds: [], activeChunkCount: 0, populationReferenceCount: 0, activePopulationIds: [], lastFailureReason: "CHUNK_POPULATION_RECONCILER_UNAVAILABLE" });
  }
  return status(reconciler);
}

export function reconcileAtlasChunkPopulation(reconciler, { chunks = [], identity = {} } = {}) {
  if (!reconciler?.__growgoDeveloperOnlyAtlasChunkPopulationReconciler || !reconciler.__state.ready) fail("CHUNK_POPULATION_RECONCILER_UNAVAILABLE");
  const { __internal: internal, __state: state } = reconciler;
  const nextChunks = sortAtlasChunks(chunks);
  const previousChunks = sortAtlasChunks([...internal.ownership.values()].map((entry) => entry.chunk));
  const diff = diffAtlasChunkSets(previousChunks, nextChunks);
  const knownIds = new Set([...internal.ownership.values()].flatMap((entry) => entry.references.map((reference) => reference.populationId)));
  const proposed = new Map();
  try {
    for (const chunk of diff.add) {
      const references = validateReferences(chunk, internal.populationFactory({ chunk: clone(chunk), identity: clone(identity) }), internal.assetRegistry, knownIds);
      for (const reference of references) knownIds.add(reference.populationId);
      proposed.set(chunk.chunkId, { chunk, references });
    }
    // Validate all additions before applying any mutation or release.
    for (const entry of proposed.values()) {
      const result = internal.populationApplyProvider({ chunk: clone(entry.chunk), references: clone(entry.references), identity: clone(identity), scope: "atlas_chunk_population" });
      if (result?.applied !== true) fail(result?.reasonCode ?? "CHUNK_POPULATION_APPLY_FAILED");
    }
    for (const chunk of diff.remove) {
      const entry = internal.ownership.get(chunk.chunkId);
      const result = internal.populationReleaseProvider({ chunk: clone(chunk), references: clone(entry?.references ?? []), identity: clone(identity), scope: "atlas_chunk_population" });
      if (result?.released !== true) fail(result?.reasonCode ?? "CHUNK_POPULATION_RELEASE_FAILED");
    }
  } catch (error) {
    // Best-effort rollback of additions; ownership is deliberately not committed.
    for (const entry of proposed.values()) {
      try { internal.populationReleaseProvider({ chunk: clone(entry.chunk), references: clone(entry.references), identity: clone(identity), scope: "atlas_chunk_population_rollback" }); } catch {}
    }
    state.lastFailureReason = reason(error, "CHUNK_POPULATION_RECONCILIATION_FAILED");
    return deepFreeze({ schemaId: RESULT_SCHEMA_ID, outcome: "failed_closed", reasonCode: state.lastFailureReason, diff, status: status(reconciler) });
  }
  for (const chunk of diff.remove) internal.ownership.delete(chunk.chunkId);
  for (const [chunkId, entry] of proposed) internal.ownership.set(chunkId, entry);
  state.lastFailureReason = null;
  return deepFreeze({ schemaId: RESULT_SCHEMA_ID, outcome: "reconciled", reasonCode: "CHUNK_POPULATION_RECONCILED", diff, addedPopulationIds: sortedReferences([...proposed.values()].flatMap((entry) => entry.references)).map((reference) => reference.populationId), status: status(reconciler) });
}

export function releaseAtlasChunkPopulation(reconciler, { identity = {} } = {}) {
  if (!reconciler?.__growgoDeveloperOnlyAtlasChunkPopulationReconciler || !reconciler.__state.ready) fail("CHUNK_POPULATION_RECONCILER_UNAVAILABLE");
  const { __internal: internal, __state: state } = reconciler;
  const entries = [...internal.ownership.values()];
  for (const entry of entries) {
    const result = internal.populationReleaseProvider({ chunk: clone(entry.chunk), references: clone(entry.references), identity: clone(identity), scope: "atlas_chunk_population_detach" });
    if (result?.released !== true) {
      state.lastFailureReason = result?.reasonCode ?? "CHUNK_POPULATION_RELEASE_FAILED";
      return deepFreeze({ schemaId: RESULT_SCHEMA_ID, outcome: "failed_closed", reasonCode: state.lastFailureReason, status: status(reconciler) });
    }
  }
  internal.ownership.clear();
  state.lastFailureReason = null;
  return deepFreeze({ schemaId: RESULT_SCHEMA_ID, outcome: "released", reasonCode: "CHUNK_POPULATION_RELEASED", status: status(reconciler) });
}
