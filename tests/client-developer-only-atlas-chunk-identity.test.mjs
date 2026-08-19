import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATLAS_CHUNK_CONTRACT_VERSION,
  coordinateToAtlasChunk,
  atlasChunkFromCoordinates,
  atlasChunkNeighbours,
  selectVisibleAtlasChunks,
  diffAtlasChunkSets
} from '../client/developer-only-atlas-chunk-identity.mjs';

const phillipIslandTown = { latitude: -38.4835, longitude: 145.2310 };
const phillipIslandWest = { latitude: -38.518, longitude: 145.086 };
const phillipIslandEast = { latitude: -38.455, longitude: 145.239 };
const boundsAt = ({ latitude, longitude }) => ({ south: latitude - .002, west: longitude - .002, north: latitude + .002, east: longitude + .002 });

test('coordinate mapping produces stable serializable V1 chunk identities', () => {
  const first=coordinateToAtlasChunk(phillipIslandTown), second=coordinateToAtlasChunk(phillipIslandTown);
  assert.deepEqual(first, second); assert.equal(first.contractVersion, ATLAS_CHUNK_CONTRACT_VERSION); assert.match(first.chunkId,/^ATLAS_CHUNK_V1_-?\d+_-?\d+$/); assert.doesNotThrow(()=>JSON.stringify(first));
});
test('negative-coordinate and exact-boundary mapping is stable', () => {
  const left=coordinateToAtlasChunk({latitude:-38.49,longitude:145.20}); const right=coordinateToAtlasChunk({latitude:-38.49,longitude:145.200000000});
  assert.equal(left.chunkId,right.chunkId); assert.equal(coordinateToAtlasChunk({latitude:-38.490000001,longitude:145.20}).y,left.y-1);
});
test('chunk coordinates round-trip to deterministic geographic bounds', () => {
  const source=coordinateToAtlasChunk(phillipIslandTown); const roundTrip=atlasChunkFromCoordinates({x:source.x,y:source.y,chunkSizeDegrees:source.chunkSizeDegrees});
  assert.deepEqual(roundTrip,source); assert.equal(source.bounds.south<=phillipIslandTown.latitude&&source.bounds.north>phillipIslandTown.latitude,true);
});
test('neighbour calculation is cardinal and deterministic', () => {
  const chunk=coordinateToAtlasChunk(phillipIslandTown), n=atlasChunkNeighbours(chunk);
  assert.equal(n.north.y,chunk.y+1); assert.equal(n.south.y,chunk.y-1); assert.equal(n.east.x,chunk.x+1); assert.equal(n.west.x,chunk.x-1);
});
test('same Phillip Island viewport selects the same ordered unique chunks', () => {
  const first=selectVisibleAtlasChunks({bounds:boundsAt(phillipIslandTown)}),second=selectVisibleAtlasChunks({bounds:boundsAt(phillipIslandTown)});
  assert.deepEqual(first,second); assert.equal(new Set(first.chunkIds).size,first.chunkIds.length); assert.equal([...first.chunkIds].every((id,i,a)=>i===0||id!==a[i-1]),true);
});
test('small movement within one chunk retains the same relevant chunk set', () => {
  const first=selectVisibleAtlasChunks({bounds:boundsAt({latitude:-38.4834,longitude:145.2311})}); const second=selectVisibleAtlasChunks({bounds:boundsAt({latitude:-38.4836,longitude:145.2313})});
  assert.deepEqual(first.chunkIds,second.chunkIds); assert.deepEqual(diffAtlasChunkSets(first.chunks,second.chunks).addedChunkIds,[]);
});
test('crossing a chunk boundary yields a precise add retain remove diff', () => {
  const before=selectVisibleAtlasChunks({bounds:{south:-38.490,west:145.200,north:-38.489, east:145.201}}); const after=selectVisibleAtlasChunks({bounds:{south:-38.490,west:145.210,north:-38.489,east:145.211}}); const diff=diffAtlasChunkSets(before.chunks,after.chunks);
  assert.equal(diff.addedChunkIds.length>0,true); assert.equal(diff.removedChunkIds.length>0,true); assert.equal(new Set(diff.addedChunkIds).size,diff.addedChunkIds.length);
});
test('Phillip Island multi-area traversal creates no duplicate identities and return is stable', () => {
  const west=selectVisibleAtlasChunks({bounds:boundsAt(phillipIslandWest)}), east=selectVisibleAtlasChunks({bounds:boundsAt(phillipIslandEast)}), returned=selectVisibleAtlasChunks({bounds:boundsAt(phillipIslandWest)});
  assert.equal(new Set([...west.chunkIds,...east.chunkIds]).size,[...new Set([...west.chunkIds,...east.chunkIds])].length); assert.deepEqual(returned.chunkIds,west.chunkIds);
});
test('margin adds deterministic nearby chunks without changing identity format', () => {
  const base=selectVisibleAtlasChunks({bounds:boundsAt(phillipIslandTown)}), buffered=selectVisibleAtlasChunks({bounds:boundsAt(phillipIslandTown),marginChunks:1});
  assert.equal(buffered.chunkIds.length>base.chunkIds.length,true); assert.equal(buffered.chunkIds.every(id=>id.startsWith('ATLAS_CHUNK_V1_')),true);
});
test('empty or malformed viewport inputs fail closed', () => {
  assert.throws(()=>selectVisibleAtlasChunks({}),/ATLAS_VIEWPORT_BOUNDS_INVALID/); assert.throws(()=>selectVisibleAtlasChunks({bounds:{south:-38,west:145,north:-39,east:146}}),/ATLAS_VIEWPORT_BOUNDS_INVALID/);
});
