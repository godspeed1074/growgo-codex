// Local-only HTTP source for the regional pin-pack prototype.
// This file is deliberately outside the Firebase Functions export tree.
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 57531;
const MAX_RADIUS_KM = 2;
const MAX_PINS = 20_000;
const MAX_CACHED_REGIONS = 5;
const MAX_BODY_BYTES = 4_096;
const MAX_UPSTREAM_BYTES = 12 * 1024 * 1024;
const EARTH_KM_PER_DEGREE = 111.195;
const DEFAULT_OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const SANDBOX_HIGHWAY_TYPES = ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'residential',
  'living_street', 'unclassified', 'tertiary', 'tertiary_link', 'secondary', 'secondary_link',
  'primary', 'primary_link', 'service', 'road', 'track', 'raceway', 'path', 'footway', 'cycleway', 'pedestrian'];
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const canonicalJson = value => Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]` :
  isRecord(value) ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}` : JSON.stringify(value);
const sha256 = value => createHash('sha256').update(canonicalJson(value)).digest('hex');

function boundsFor(center, radiusKm) {
  const latitudeRadius = radiusKm / EARTH_KM_PER_DEGREE;
  const longitudeRadius = latitudeRadius / Math.max(0.25, Math.cos(center.lat * Math.PI / 180));
  return {south: center.lat - latitudeRadius, west: center.lng - longitudeRadius,
    north: center.lat + latitudeRadius, east: center.lng + longitudeRadius};
}

function distanceKm(a, b) {
  const x = (b.longitude - a.longitude) * EARTH_KM_PER_DEGREE * Math.cos(a.latitude * Math.PI / 180);
  const y = (b.latitude - a.latitude) * EARTH_KM_PER_DEGREE;
  return Math.hypot(x, y);
}

function buildSandboxQuery(bounds) {
  const area = `(${bounds.south},${bounds.west},${bounds.north},${bounds.east})`;
  const highways = SANDBOX_HIGHWAY_TYPES.join('|');
  return `[out:json][timeout:10];(way["highway"~"^(${highways})$"]${area};way["disused:highway"="raceway"]${area};way["natural"="water"]${area};way["natural"="coastline"]${area};way["water"]${area};way["waterway"~"^(river|stream|canal)$"]${area};way["landuse"~"^(reservoir|basin)$"]${area};);out geom;`;
}

async function readBoundedJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Map source returned no response body.');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_UPSTREAM_BYTES) {
        await reader.cancel();
        throw new Error('Map response exceeds the 12 MB sandbox limit.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function createSandboxOverpassLoader({fetchImpl = globalThis.fetch,
  endpoint = DEFAULT_OVERPASS_ENDPOINT, extractPins} = {}) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || typeof fetchImpl !== 'function' || typeof extractPins !== 'function')
    throw new TypeError('Sandbox map loader requires an HTTPS Overpass endpoint, fetch, and canonical pin extractor.');
  return async ({center, bounds, maxPins}) => {
    const response = await fetchImpl(url, {method: 'POST',
      headers: {'content-type': 'text/plain', 'user-agent': 'GrowGo Regional Pin Pack Local Preview/1.0'},
      body: buildSandboxQuery(bounds), signal: AbortSignal.timeout(15_000)});
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error(`Map source request failed (HTTP ${response.status}).`);
    }
    const payload = await readBoundedJson(response);
    return extractPins(payload, center, bounds, {maxPins});
  };
}

async function readJson(request) {
  let text = '';
  for await (const chunk of request) {
    text += chunk;
    if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw Object.assign(new Error('Request too large.'), {status: 413});
  }
  try { return JSON.parse(text); } catch { throw Object.assign(new Error('Invalid JSON.'), {status: 400}); }
}

function json(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store', 'content-length': Buffer.byteLength(body)});
  response.end(body);
}

export function createRegionalPinPackSandboxServer({loadPins, host = DEFAULT_HOST, port = DEFAULT_PORT,
  now = Date.now, maxRadiusKm = MAX_RADIUS_KM} = {}) {
  if (host !== DEFAULT_HOST || typeof loadPins !== 'function' || !Number.isInteger(port) || port < 0 || port > 65_535 ||
      !Number.isFinite(maxRadiusKm) || maxRadiusKm <= 0 || maxRadiusKm > MAX_RADIUS_KM)
    throw new TypeError('Sandbox server must use loopback and a loader, with a radius no greater than 2 km.');
  const packs = new Map();
  const cache = new Map();

  const server = createServer(async (request, response) => {
    try {
      const origin = request.headers.origin;
      const localOrigins = [`http://${host}:${port}`, `http://localhost:${port}`];
      if (origin && !localOrigins.includes(origin)) return json(response, 403, {error: 'Origin not allowed.'});
      if (origin) {
        response.setHeader('access-control-allow-origin', origin);
        response.setHeader('vary', 'Origin');
      }
      const hostHeader = request.headers.host;
      if (hostHeader && !/^127\.0\.0\.1(?::\d+)?$/.test(hostHeader) && !/^localhost(?::\d+)?$/.test(hostHeader))
        return json(response, 403, {error: 'Loopback requests only.'});
      if (request.method === 'OPTIONS') {
        response.writeHead(204, {'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'content-type', 'access-control-max-age': '300'});
        return response.end();
      }
      const url = new URL(request.url ?? '/', `http://${host}:${port}`);
      const previewFiles = new Map([
        ['/preview', [new URL('../tests/regional-pin-pack-sandbox.html', import.meta.url), 'text/html; charset=utf-8']],
        ['/', [new URL('../tests/regional-pin-pack-sandbox.html', import.meta.url), 'text/html; charset=utf-8']],
        ['/modules/regional-pin-pack-preview.mjs', [new URL('../client/regional-pin-pack-preview.mjs', import.meta.url), 'text/javascript; charset=utf-8']],
        ['/modules/regional-pin-pack-sandbox-transport.mjs', [new URL('../client/regional-pin-pack-sandbox-transport.mjs', import.meta.url), 'text/javascript; charset=utf-8']]
      ]);
      if (request.method === 'GET' && previewFiles.has(url.pathname)) {
        const [file, contentType] = previewFiles.get(url.pathname);
        const body = await readFile(file);
        response.writeHead(200, {'content-type': contentType, 'cache-control': 'no-store', 'content-length': body.length});
        return response.end(body);
      }
      if (request.method === 'GET' && url.pathname === '/health')
        return json(response, 200, {mode: 'local-sandbox', liveWrites: false, maxRadiusKm, cachedRegions: cache.size});

      if (request.method === 'POST' && url.pathname === '/manifest') {
        const body = await readJson(request), center = body?.center, radiusKm = body?.radiusKm;
        if (!isRecord(center) || !Number.isFinite(center.lat) || !Number.isFinite(center.lng) ||
            Math.abs(center.lat) > 85 || Math.abs(center.lng) > 180 ||
            !Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > maxRadiusKm)
          return json(response, 400, {error: `Center is invalid or radius exceeds ${maxRadiusKm} km sandbox cap.`});
        const key = `${center.lat}|${center.lng}|${radiusKm}`;
        let pack = cache.get(key);
        if (!pack || pack.expiresAt <= now()) {
          const bounds = boundsFor(center, radiusKm);
          const acquired = await loadPins({center: {latitude: center.lat, longitude: center.lng}, bounds, maxPins: MAX_PINS});
          if (!isRecord(acquired) || !Array.isArray(acquired.pins)) throw new Error('Canonical pin loader returned an invalid result.');
          const pins = acquired.pins.filter(pin => isRecord(pin) && typeof pin.pinId === 'string' &&
            Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude) &&
            distanceKm({latitude: center.lat, longitude: center.lng}, pin) <= radiusKm)
            .map(pin => ({pinId: pin.pinId, latitude: pin.latitude, longitude: pin.longitude,
              type: pin.type === 'water' ? 'water' : 'base'}))
            .sort((a, b) => a.pinId.localeCompare(b.pinId));
          if (pins.length > MAX_PINS) throw new Error('Canonical pin result exceeds the sandbox cap.');
          const revision = sha256(pins);
          const shardId = `preview-${revision.slice(0, 24)}`;
          const serializedPins = canonicalJson(pins);
          pack = {expiresAt: now() + 5 * 60_000, manifest: {schemaVersion: 1,
            catalogVersion: 'growgo-canonical-v1', revision, center, radiusKm,
            shards: [{id: shardId, revision, sha256: revision,
              byteSize: Buffer.byteLength(serializedPins)}]},
          shard: {id: shardId, revision, catalogVersion: 'growgo-canonical-v1', sha256: revision, pins},
          cursor: `empty-${revision.slice(0, 12)}`};
          cache.set(key, pack); packs.set(shardId, pack);
          while (cache.size > MAX_CACHED_REGIONS) {
            const oldestKey = cache.keys().next().value;
            const oldest = cache.get(oldestKey);
            cache.delete(oldestKey); packs.delete(oldest?.manifest.shards[0]?.id);
          }
          console.info(JSON.stringify({component: 'regional_pin_pack_sandbox', event: 'region_built',
            pins: pins.length, bytes: Buffer.byteLength(serializedPins)}));
        }
        return json(response, 200, pack.manifest);
      }

      if (request.method === 'GET' && url.pathname === '/shard') {
        const pack = packs.get(url.searchParams.get('id'));
        if (!pack || pack.shard.revision !== url.searchParams.get('revision'))
          return json(response, 404, {error: 'Shard not found or stale.'});
        return json(response, 200, pack.shard);
      }

      if (request.method === 'GET' && url.pathname === '/delta') {
        const pack = packs.get(url.searchParams.get('shardId'));
        if (!pack) return json(response, 404, {error: 'Shard not found.'});
        const cursor = url.searchParams.get('cursor');
        if (cursor !== pack.cursor) return json(response, 200, {catalogVersion: pack.manifest.catalogVersion,
          reset: true, nextCursor: pack.cursor, changes: []});
        return json(response, 200, {catalogVersion: pack.manifest.catalogVersion,
          baseCursor: cursor, nextCursor: pack.cursor, changes: []});
      }

      return json(response, 404, {error: 'Not found.'});
    } catch (error) {
      return json(response, Number.isInteger(error?.status) ? error.status : 502,
        {error: error instanceof Error ? error.message : 'Sandbox request failed.'});
    }
  });

  return Object.freeze({server, listen: () => new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(port, host, () => { server.removeListener('error', reject); resolve(server.address()); });
  }), close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))});
}

async function start() {
  if (process.env.GROWGO_REGIONAL_PIN_PACK_SANDBOX !== '1') {
    throw new Error('Set GROWGO_REGIONAL_PIN_PACK_SANDBOX=1 to explicitly start the loopback-only sandbox.');
  }
  const {extractCanonicalPins} = await import('../functions/lib/api/getNearbyBasePins.js');
  const loadPins = createSandboxOverpassLoader({extractPins: extractCanonicalPins});
  const app = createRegionalPinPackSandboxServer({loadPins,
    port: Number(process.env.GROWGO_REGIONAL_PIN_PACK_PORT || DEFAULT_PORT)});
  const address = await app.listen();
  console.info(`Regional pin-pack sandbox listening at http://${address.address}:${address.port} (max radius ${MAX_RADIUS_KM} km).`);
  const shutdown = () => app.close().finally(() => process.exit(0));
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  start().catch(error => { console.error(error instanceof Error ? error.message : 'Sandbox startup failed.'); process.exitCode = 1; });
}
