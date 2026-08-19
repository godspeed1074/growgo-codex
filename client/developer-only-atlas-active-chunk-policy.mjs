import { sortAtlasChunks } from "./developer-only-atlas-chunk-identity.mjs";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MAX_ACTIVE_CHUNKS = 16;
const MAX_CONFIGURABLE_ACTIVE_CHUNKS = 64;

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.freeze(value);
}

function fail(reasonCode) { throw Object.assign(new Error(reasonCode), { reasonCode }); }

function activeCap(value = DEFAULT_DEVELOPER_ONLY_ATLAS_MAX_ACTIVE_CHUNKS) {
  const cap = Number(value);
  if (!Number.isInteger(cap) || cap < 1 || cap > MAX_CONFIGURABLE_ACTIVE_CHUNKS) fail("ATLAS_ACTIVE_CHUNK_CAP_INVALID");
  return cap;
}

function bounds(value = {}) {
  const south = Number(value.south), west = Number(value.west), north = Number(value.north), east = Number(value.east);
  if (![south, west, north, east].every(Number.isFinite) || south > north || west > east) fail("ATLAS_VIEWPORT_BOUNDS_INVALID");
  return { south, west, north, east };
}

function intersects(chunk, view) {
  return chunk.bounds.south < view.north && chunk.bounds.north > view.south && chunk.bounds.west < view.east && chunk.bounds.east > view.west;
}

function distanceSquared(chunk, view) {
  const latitude = (view.south + view.north) / 2;
  const longitude = (view.west + view.east) / 2;
  const chunkLatitude = (chunk.bounds.south + chunk.bounds.north) / 2;
  const chunkLongitude = (chunk.bounds.west + chunk.bounds.east) / 2;
  return (chunkLatitude - latitude) ** 2 + (chunkLongitude - longitude) ** 2;
}

/** Pure deterministic pressure policy; chunks never own renderer resources. */
export function prioritizeAtlasActiveChunks({ chunks = [], viewportBounds, maxActiveChunks } = {}) {
  const view = bounds(viewportBounds);
  const cap = activeCap(maxActiveChunks);
  const requestedChunks = sortAtlasChunks(chunks);
  const ranked = requestedChunks.map((chunk) => ({
    chunk,
    visible: intersects(chunk, view),
    distanceSquared: distanceSquared(chunk, view)
  })).sort((left, right) =>
    Number(right.visible) - Number(left.visible) ||
    left.distanceSquared - right.distanceSquared ||
    left.chunk.y - right.chunk.y ||
    left.chunk.x - right.chunk.x ||
    left.chunk.chunkId.localeCompare(right.chunk.chunkId)
  );
  const active = ranked.slice(0, cap).map((entry) => entry.chunk);
  const evicted = ranked.slice(cap).map((entry) => entry.chunk);
  return deepFreeze({
    maxActiveChunks: cap,
    requestedChunks,
    requestedChunkIds: requestedChunks.map((chunk) => chunk.chunkId),
    activeChunks: sortAtlasChunks(active),
    activeChunkIds: sortAtlasChunks(active).map((chunk) => chunk.chunkId),
    evictedChunks: sortAtlasChunks(evicted),
    evictedChunkIds: sortAtlasChunks(evicted).map((chunk) => chunk.chunkId),
    visibleRequestedChunkCount: ranked.filter((entry) => entry.visible).length
  });
}
