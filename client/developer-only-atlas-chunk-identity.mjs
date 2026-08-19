export const ATLAS_CHUNK_CONTRACT_VERSION = "V1";
export const DEFAULT_ATLAS_CHUNK_SIZE_DEGREES = 0.01;
const EPSILON = 1e-9;
const MAX_VISIBLE_CHUNKS = 4096;

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

function number(value, reasonCode) {
  const result = Number(value);
  if (!Number.isFinite(result)) fail(reasonCode);
  return result;
}

function chunkSize(value = DEFAULT_ATLAS_CHUNK_SIZE_DEGREES) {
  const result = number(value, "ATLAS_CHUNK_SIZE_INVALID");
  if (result <= 0 || result > 10) fail("ATLAS_CHUNK_SIZE_INVALID");
  return result;
}

function normalizedCoordinate(value) {
  return Number(Number(value).toFixed(9));
}

function coordinateIndex(value, offset, size) {
  // Rounding before flooring makes exact decimal boundaries stable across binary floats.
  return Math.floor(Number(((normalizedCoordinate(value) + offset) / size).toFixed(9)));
}

export function coordinateToAtlasChunk({ latitude, longitude, chunkSizeDegrees } = {}) {
  const lat = number(latitude, "ATLAS_CHUNK_LATITUDE_INVALID");
  const lng = number(longitude, "ATLAS_CHUNK_LONGITUDE_INVALID");
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) fail("ATLAS_CHUNK_COORDINATE_OUT_OF_RANGE");
  const size = chunkSize(chunkSizeDegrees);
  const y = coordinateIndex(lat, 90, size);
  const x = coordinateIndex(lng, 180, size);
  return atlasChunkFromCoordinates({ x, y, chunkSizeDegrees: size });
}

export function atlasChunkFromCoordinates({ x, y, chunkSizeDegrees } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) fail("ATLAS_CHUNK_GRID_COORDINATE_INVALID");
  const size = chunkSize(chunkSizeDegrees);
  const south = Number((-90 + y * size).toFixed(9));
  const west = Number((-180 + x * size).toFixed(9));
  return deepFreeze({
    contractVersion: ATLAS_CHUNK_CONTRACT_VERSION,
    chunkId: `ATLAS_CHUNK_${ATLAS_CHUNK_CONTRACT_VERSION}_${x}_${y}`,
    x, y,
    chunkSizeDegrees: size,
    bounds: deepFreeze({ south, west, north: Number((south + size).toFixed(9)), east: Number((west + size).toFixed(9)) })
  });
}

export function atlasChunkNeighbours(chunk) {
  if (!chunk || !Number.isInteger(chunk.x) || !Number.isInteger(chunk.y)) fail("ATLAS_CHUNK_IDENTITY_INVALID");
  const size = chunkSize(chunk.chunkSizeDegrees);
  return deepFreeze({
    north: atlasChunkFromCoordinates({ x: chunk.x, y: chunk.y + 1, chunkSizeDegrees: size }),
    south: atlasChunkFromCoordinates({ x: chunk.x, y: chunk.y - 1, chunkSizeDegrees: size }),
    east: atlasChunkFromCoordinates({ x: chunk.x + 1, y: chunk.y, chunkSizeDegrees: size }),
    west: atlasChunkFromCoordinates({ x: chunk.x - 1, y: chunk.y, chunkSizeDegrees: size })
  });
}

function normalizeBounds(bounds = {}) {
  const south = number(bounds.south ?? bounds.getSouth?.(), "ATLAS_VIEWPORT_BOUNDS_INVALID");
  const west = number(bounds.west ?? bounds.getWest?.(), "ATLAS_VIEWPORT_BOUNDS_INVALID");
  const north = number(bounds.north ?? bounds.getNorth?.(), "ATLAS_VIEWPORT_BOUNDS_INVALID");
  const east = number(bounds.east ?? bounds.getEast?.(), "ATLAS_VIEWPORT_BOUNDS_INVALID");
  if (south < -90 || north > 90 || west < -180 || east > 180 || south > north || west > east) fail("ATLAS_VIEWPORT_BOUNDS_INVALID");
  return { south: normalizedCoordinate(south), west: normalizedCoordinate(west), north: normalizedCoordinate(north), east: normalizedCoordinate(east) };
}

export function sortAtlasChunks(chunks = []) {
  const unique = new Map();
  for (const chunk of chunks) if (chunk?.chunkId && Number.isInteger(chunk.x) && Number.isInteger(chunk.y) && !unique.has(chunk.chunkId)) unique.set(chunk.chunkId, chunk);
  return deepFreeze([...unique.values()].sort((a, b) => a.y - b.y || a.x - b.x || a.chunkId.localeCompare(b.chunkId)));
}

export function selectVisibleAtlasChunks({ bounds, chunkSizeDegrees, marginChunks = 0, zoom = null } = {}) {
  const view = normalizeBounds(bounds);
  const size = chunkSize(chunkSizeDegrees);
  const margin = Number(marginChunks);
  if (!Number.isInteger(margin) || margin < 0 || margin > 4) fail("ATLAS_CHUNK_MARGIN_INVALID");
  // north/east are viewport edges, not an additional adjacent visible cell when exactly on a boundary.
  const southWest = coordinateToAtlasChunk({ latitude: view.south, longitude: view.west, chunkSizeDegrees: size });
  const northEast = coordinateToAtlasChunk({ latitude: Math.max(-90, view.north - EPSILON), longitude: Math.max(-180, view.east - EPSILON), chunkSizeDegrees: size });
  const minX = southWest.x - margin, maxX = northEast.x + margin, minY = southWest.y - margin, maxY = northEast.y + margin;
  const count = (maxX - minX + 1) * (maxY - minY + 1);
  if (count > MAX_VISIBLE_CHUNKS) fail("ATLAS_VISIBLE_CHUNK_LIMIT_EXCEEDED");
  const chunks = [];
  for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) chunks.push(atlasChunkFromCoordinates({ x, y, chunkSizeDegrees: size }));
  return deepFreeze({ contractVersion: ATLAS_CHUNK_CONTRACT_VERSION, zoom: zoom == null ? null : number(zoom, "ATLAS_VIEWPORT_ZOOM_INVALID"), viewportBounds: deepFreeze(view), chunkSizeDegrees: size, marginChunks: margin, chunks: sortAtlasChunks(chunks), chunkIds: deepFreeze(sortAtlasChunks(chunks).map(chunk => chunk.chunkId)) });
}

export function diffAtlasChunkSets(previousChunks = [], nextChunks = []) {
  const previous = sortAtlasChunks(previousChunks);
  const next = sortAtlasChunks(nextChunks);
  const before = new Map(previous.map(chunk => [chunk.chunkId, chunk]));
  const after = new Map(next.map(chunk => [chunk.chunkId, chunk]));
  const retain = next.filter(chunk => before.has(chunk.chunkId));
  const add = next.filter(chunk => !before.has(chunk.chunkId));
  const remove = previous.filter(chunk => !after.has(chunk.chunkId));
  return deepFreeze({ retain: sortAtlasChunks(retain), add: sortAtlasChunks(add), remove: sortAtlasChunks(remove), retainedChunkIds: deepFreeze(sortAtlasChunks(retain).map(chunk => chunk.chunkId)), addedChunkIds: deepFreeze(sortAtlasChunks(add).map(chunk => chunk.chunkId)), removedChunkIds: deepFreeze(sortAtlasChunks(remove).map(chunk => chunk.chunkId)) });
}
