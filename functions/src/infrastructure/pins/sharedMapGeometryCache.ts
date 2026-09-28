import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { waitForMapOperation, withMapReadDeadline } from "./mapReadDeadline";

import type { CanonicalBoundingBox, CanonicalCoordinate } from "../../domain/pins/basePinTypes";
import type { AuthoritativePinSourceGeometry } from "../../domain/pins/authoritativePinSource";
import type { ClassifiedNearbyPin } from "../../domain/pins/waterPinClassifier";

const compress = promisify(gzip);
const decompress = promisify(gunzip);

// Bump this version when road eligibility, generation, density or water rules change.
export const SHARED_MAP_GEOMETRY_COLLECTION = "sharedMapGeometryV1";
export const SHARED_MAP_GEOMETRY_VERSION = 1;
export const MAP_CELL_DEGREES = 0.004;
export const MAP_GEOMETRY_FRESH_MS = 24 * 60 * 60 * 1_000;
export const MAP_GEOMETRY_STALE_MS = 30 * 24 * 60 * 60 * 1_000;
export const EMPTY_MAP_GEOMETRY_FRESH_MS = 60_000;
export const MAX_MAP_GEOMETRY_BYTES = 700_000;
const MAX_DECODED_BYTES = 8_000_000;
const MAX_MEMORY_BYTES = 16_000_000;
const MAX_MEMORY_CELLS = 100;
const MAX_PREPARED_KEYS = 20_000;
const REFRESH_RETRY_MS = 60_000;
export const MAP_GEOMETRY_LOOKUP_MS = 30_000;
const CACHE_IO_MS = 1_500;
const STALE_REFRESH_MS = 4_000;
const COLD_FAILURE_RETRY_MS = 5_000;
const GEOMETRY_TAGS = [
  "highway", "disused:highway", "natural", "water", "waterway", "landuse"
] as const;

export interface StaticMapGeometry {
  elements: Array<{
    type: "way";
    id: string;
    geometry: Array<{ lat: number; lon: number }>;
    tags: Record<string, string>;
  }>;
}

export interface StaticMapPins {
  pins: ClassifiedNearbyPin[];
  sources: AuthoritativePinSourceGeometry[];
}

// Delivery metadata is static, never a substitute for player/world state.
export interface MapGeometryDelivery {
  version: 1;
  cellKey: string;
  coverage: CanonicalBoundingBox;
  fetchedAt: number;
  expiresAt: number;
  refreshNeeded: boolean;
  retryAfter: number;
}

export interface MapGeometryCell {
  key: string;
  bounds: CanonicalBoundingBox;
}

interface GeometryRecord {
  version: number;
  cellKey: string;
  fetchedAt: number;
  retryAfter?: number;
  payload: StaticMapGeometry;
  preparedPins: string[];
  preparedSources: string[];
}

export interface StoredMapGeometry {
  version: number;
  cellKey: string;
  data: Buffer;
}

export type MapCacheEvent = "memory_hit" | "shared_hit" | "miss" | "refresh" |
  "stale_fallback" | "read_failed" | "write_failed" | "invalid_record" | "oversize" | "retry_cooldown" |
  "immediate_hit";

interface Dependencies {
  read(key: string): Promise<unknown>;
  write(key: string, value: StoredMapGeometry): Promise<void>;
  // Optional compare-and-set. Never replace a cell unless its saved bytes
  // still match the snapshot whose evidence this caller finished preparing.
  persistPrepared?(key: string, expected: StoredMapGeometry, value: StoredMapGeometry, signal: AbortSignal): Promise<boolean>;
  fetch(bounds: CanonicalBoundingBox, signal: AbortSignal): Promise<unknown>;
  extract(payload: StaticMapGeometry, center: CanonicalCoordinate, bounds: CanonicalBoundingBox): StaticMapPins;
  // Resolves only after authoritative source/classification records are persisted.
  prepare(pins: StaticMapPins, signal: AbortSignal): Promise<void>;
  now?: () => number;
  report?: (event: MapCacheEvent) => void;
  timeouts?: { lookupMs?: number; cacheIoMs?: number; staleRefreshMs?: number; failureRetryMs?: number };
}

/** Only map geometry enters this cache. No accounts, captures, crops, points or fish. */
export function normalizeStaticMapGeometry(payload: unknown): StaticMapGeometry {
  const value = payload as { elements?: unknown; remark?: unknown } | null;
  // Overpass can return HTTP 200 with partial/empty data on timeout. Never cache it.
  if (!value || !Array.isArray(value.elements) || value.remark) {
    throw new Error("Incomplete map geometry response");
  }
  const elements: StaticMapGeometry["elements"] = [];
  for (const raw of value.elements) {
    const way = raw as StaticMapGeometry["elements"][number] | null;
    if (!way || way.type !== "way" || !/^[1-9]\d{0,18}$/.test(String(way.id)) ||
        !Array.isArray(way.geometry)) continue;
    const geometry = way.geometry.filter((point) =>
      point && Number.isFinite(point.lat) && Number.isFinite(point.lon) &&
      Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180
    ).map((point) => ({ lat: point.lat, lon: point.lon }));
    if (geometry.length < 2) continue;
    const tags: Record<string, string> = {};
    for (const key of GEOMETRY_TAGS) {
      if (typeof way.tags?.[key] === "string") tags[key] = way.tags[key];
    }
    if (Object.keys(tags).length === 0) continue;
    elements.push({ type: "way", id: String(way.id), geometry, tags });
  }
  return { elements };
}

/** A fixed cell plus the full view radius covers every camera center inside it. */
export function getMapGeometryCell(center: CanonicalCoordinate): MapGeometryCell {
  const latIndex = Math.min(44_999, Math.max(0, Math.floor((center.latitude + 90) / MAP_CELL_DEGREES)));
  const lngIndex = Math.min(89_999, Math.max(0, Math.floor((center.longitude + 180) / MAP_CELL_DEGREES)));
  const south = latIndex * MAP_CELL_DEGREES - 90;
  const north = south + MAP_CELL_DEGREES;
  const west = lngIndex * MAP_CELL_DEGREES - 180;
  const east = west + MAP_CELL_DEGREES;
  const extremeLatitude = Math.max(Math.abs(south), Math.abs(north));
  const longitudeRadius = Math.min(0.018, 0.006 / Math.max(0.25, Math.cos(extremeLatitude * Math.PI / 180)));
  return {
    key: `v${SHARED_MAP_GEOMETRY_VERSION}-${latIndex}-${lngIndex}`,
    bounds: {
      south: Math.max(-90, south - 0.006000001),
      north: Math.min(90, north + 0.006000001),
      west: Math.max(-180, west - longitudeRadius - 0.000000001),
      east: Math.min(180, east + longitudeRadius + 0.000000001)
    }
  };
}

function pinKey(pin: ClassifiedNearbyPin): string {
  return `${pin.pinId}|${pin.type}|${pin.latitude}|${pin.longitude}`;
}

function sourceKey(source: AuthoritativePinSourceGeometry): string {
  return `${source.generatorVersion}|${source.sourceType}|${source.sourceId}`;
}

async function decode(value: unknown, cell: MapGeometryCell, now: number): Promise<GeometryRecord | null> {
  try {
    const stored = value as StoredMapGeometry | null;
    if (!stored || stored.version !== SHARED_MAP_GEOMETRY_VERSION || stored.cellKey !== cell.key ||
        !Buffer.isBuffer(stored.data) || stored.data.length > MAX_MAP_GEOMETRY_BYTES) return null;
    const bytes = await decompress(stored.data, { maxOutputLength: MAX_DECODED_BYTES });
    const record = JSON.parse(bytes.toString("utf8")) as GeometryRecord;
    if (record.version !== SHARED_MAP_GEOMETRY_VERSION || record.cellKey !== cell.key ||
        !Number.isFinite(record.fetchedAt) || record.fetchedAt > now ||
        now - record.fetchedAt >= MAP_GEOMETRY_STALE_MS ||
        (record.retryAfter !== undefined && (!Number.isFinite(record.retryAfter) || record.retryAfter > now + REFRESH_RETRY_MS)) ||
        !Array.isArray(record.preparedPins) || !Array.isArray(record.preparedSources) ||
        record.preparedPins.length + record.preparedSources.length > MAX_PREPARED_KEYS ||
        ![...record.preparedPins, ...record.preparedSources].every((key) => typeof key === "string" && key.length < 200)) return null;
    return { ...record, payload: normalizeStaticMapGeometry(record.payload) };
  } catch {
    return null;
  }
}

export function createSharedMapGeometryCache(deps: Dependencies) {
  const memory = new Map<string, StoredMapGeometry>();
  const pending = new Map<string, { viewport: string; result: Promise<StaticMapPins> }>();
  const failedFetches = new Map<string, { until: number; error: unknown }>();
  const immediate = new Map<string, Promise<(StaticMapPins & { delivery: MapGeometryDelivery }) | null>>();
  const now = deps.now ?? Date.now;
  const lookupMs = deps.timeouts?.lookupMs ?? MAP_GEOMETRY_LOOKUP_MS;
  const cacheIoMs = deps.timeouts?.cacheIoMs ?? CACHE_IO_MS;
  const staleRefreshMs = deps.timeouts?.staleRefreshMs ?? STALE_REFRESH_MS;
  let memoryBytes = 0;

  function remember(key: string, stored: StoredMapGeometry) {
    memoryBytes -= memory.get(key)?.data.length ?? 0;
    memory.delete(key);
    memory.set(key, stored);
    memoryBytes += stored.data.length;
    while (memory.size > MAX_MEMORY_CELLS || memoryBytes > MAX_MEMORY_BYTES) {
      const oldest = memory.keys().next().value!;
      memoryBytes -= memory.get(oldest)!.data.length;
      memory.delete(oldest);
    }
  }

  async function load(center: CanonicalCoordinate, bounds: CanonicalBoundingBox, cell: MapGeometryCell, signal: AbortSignal): Promise<StaticMapPins> {
    const timestamp = now();
    const failed = failedFetches.get(cell.key);
    if (failed && failed.until > timestamp) {
      deps.report?.("retry_cooldown");
      throw failed.error;
    }
    failedFetches.delete(cell.key);
    let stored: unknown = memory.get(cell.key);
    const wasMemoryHit = Boolean(stored);
    if (!stored) {
      try { stored = await withMapReadDeadline(cacheIoMs, () => deps.read(cell.key), signal); }
      catch { signal.throwIfAborted(); deps.report?.("read_failed"); }
    }
    let record = await decode(stored, cell, timestamp);
    signal.throwIfAborted();
    if (stored && !record) deps.report?.("invalid_record");
    const freshMs = record?.payload.elements.length ? MAP_GEOMETRY_FRESH_MS : EMPTY_MAP_GEOMETRY_FRESH_MS;
    let changed = false;
    if (record && timestamp - record.fetchedAt >= freshMs && (record.retryAfter ?? 0) > timestamp) {
      deps.report?.("stale_fallback");
    } else if (!record || timestamp - record.fetchedAt >= freshMs) {
      deps.report?.(record ? "refresh" : "miss");
      try {
        const fetched = record?.payload.elements.length
          ? await withMapReadDeadline(staleRefreshMs, (refreshSignal) => deps.fetch(cell.bounds, refreshSignal), signal)
          : await waitForMapOperation(signal, () => deps.fetch(cell.bounds, signal));
        signal.throwIfAborted();
        const payload = normalizeStaticMapGeometry(fetched);
        record = {
          version: SHARED_MAP_GEOMETRY_VERSION, cellKey: cell.key, fetchedAt: timestamp,
          payload, preparedPins: [], preparedSources: []
        };
        changed = true;
      } catch (error) {
        // An empty cached area is never an outage fallback. Preserve the original
        // fetchedAt so repeated outages cannot keep old geometry alive forever.
        if (!record?.payload.elements.length) {
          failedFetches.set(cell.key, { until: now() + (deps.timeouts?.failureRetryMs ?? COLD_FAILURE_RETRY_MS), error });
          if (failedFetches.size > MAX_MEMORY_CELLS) failedFetches.delete(failedFetches.keys().next().value!);
          throw error;
        }
        signal.throwIfAborted();
        record.retryAfter = Math.min(now() + REFRESH_RETRY_MS, record.fetchedAt + MAP_GEOMETRY_STALE_MS);
        changed = true;
        deps.report?.("stale_fallback");
      }
    } else {
      deps.report?.(wasMemoryHit ? "memory_hit" : "shared_hit");
    }

    const result = deps.extract(record.payload, center, bounds);
    signal.throwIfAborted();
    const preparedPins = new Set(record.preparedPins);
    const preparedSources = new Set(record.preparedSources);
    const needed = {
      pins: result.pins.filter((pin) => !preparedPins.has(pinKey(pin))),
      sources: result.sources.filter((source) => !preparedSources.has(sourceKey(source)))
    };
    if (needed.pins.length || needed.sources.length) {
      await waitForMapOperation(signal, () => deps.prepare(needed, signal));
      signal.throwIfAborted();
      needed.pins.forEach((pin) => preparedPins.add(pinKey(pin)));
      needed.sources.forEach((source) => preparedSources.add(sourceKey(source)));
      record.preparedPins = [...preparedPins];
      record.preparedSources = [...preparedSources];
      changed = true;
    }

    if (changed) {
      // Firestore's 1 MiB document ceiling includes field metadata. Leave ample
      // headroom. The collection also has an explicit index exemption.
      const json = JSON.stringify(record);
      if (Buffer.byteLength(json) <= MAX_DECODED_BYTES &&
          record.preparedPins.length + record.preparedSources.length <= MAX_PREPARED_KEYS) {
        const data = await compress(json);
        signal.throwIfAborted();
        if (data.length <= MAX_MAP_GEOMETRY_BYTES) {
          const encoded: StoredMapGeometry = { version: SHARED_MAP_GEOMETRY_VERSION, cellKey: cell.key, data };
          try { await withMapReadDeadline(cacheIoMs, () => deps.write(cell.key, encoded), signal); }
          catch { signal.throwIfAborted(); deps.report?.("write_failed"); }
          signal.throwIfAborted();
          remember(cell.key, encoded);
          return result;
        }
      }
      deps.report?.("oversize");
    } else if (stored) {
      remember(cell.key, stored as StoredMapGeometry);
    }
    return result;
  }

  const cache = {
    // Interactive delivery never starts an external refresh for a valid saved
    // area. Refresh is an explicit, awaited preparation request, not an orphan
    // promise that Cloud Functions might freeze after returning its response.
    async getForDelivery(center: CanonicalCoordinate, bounds: CanonicalBoundingBox, refresh = false): Promise<StaticMapPins & { delivery?: MapGeometryDelivery }> {
      const cell = getMapGeometryCell(center);
      if (bounds.south < cell.bounds.south || bounds.north > cell.bounds.north ||
          bounds.west < cell.bounds.west || bounds.east > cell.bounds.east) {
        throw new Error("Map view exceeds shared geometry coverage");
      }
      const describe = (record: GeometryRecord): MapGeometryDelivery => ({
        version: 1, cellKey: cell.key, coverage: cell.bounds,
        fetchedAt: record.fetchedAt,
        expiresAt: record.fetchedAt + (record.payload.elements.length ? MAP_GEOMETRY_STALE_MS : EMPTY_MAP_GEOMETRY_FRESH_MS),
        refreshNeeded: now() - record.fetchedAt >= MAP_GEOMETRY_FRESH_MS,
        retryAfter: record.retryAfter ?? 0
      });
      if (!refresh) {
        const key = JSON.stringify([center, bounds]);
        let active = immediate.get(key);
        if (!active) {
          const task = withMapReadDeadline(lookupMs, async (signal) => {
            let stored: unknown = memory.get(cell.key);
            if (!stored) {
              try { stored = await withMapReadDeadline(cacheIoMs, () => deps.read(cell.key), signal); }
              catch { signal.throwIfAborted(); deps.report?.("read_failed"); }
            }
            const record = await decode(stored, cell, now());
            signal.throwIfAborted();
            if (!record || (!record.payload.elements.length && now() - record.fetchedAt >= EMPTY_MAP_GEOMETRY_FRESH_MS)) return null;
            const result = deps.extract(record.payload, center, bounds);
            const preparedPins = new Set(record.preparedPins);
            const preparedSources = new Set(record.preparedSources);
            const needed = {
              pins: result.pins.filter(pin => !preparedPins.has(pinKey(pin))),
              sources: result.sources.filter(source => !preparedSources.has(sourceKey(source)))
            };
            if (needed.pins.length || needed.sources.length) {
              await waitForMapOperation(signal, () => deps.prepare(needed, signal));
              signal.throwIfAborted();
              needed.pins.forEach(pin => preparedPins.add(pinKey(pin)));
              needed.sources.forEach(source => preparedSources.add(sourceKey(source)));
              record.preparedPins = [...preparedPins];
              record.preparedSources = [...preparedSources];
            }
            // Do not write an old snapshot over a concurrently refreshed cell.
            // The normal path persists hints. Optional hot-path persistence
            // below is conditional on the exact previously saved snapshot.
            if (needed.pins.length || needed.sources.length) {
              // Retain verified hints locally so repeated views do not reread
              // the same pin evidence. Never race a newer compressed snapshot.
              const json = JSON.stringify(record);
              if (record.preparedPins.length + record.preparedSources.length <= MAX_PREPARED_KEYS &&
                  Buffer.byteLength(json) <= MAX_DECODED_BYTES) {
                const data = await compress(json);
                signal.throwIfAborted();
                const current = memory.get(cell.key);
                if (data.length <= MAX_MAP_GEOMETRY_BYTES && (!current || current === stored)) {
                  const encoded = { version: SHARED_MAP_GEOMETRY_VERSION, cellKey: cell.key, data };
                  // Amortise the extra conditional read/write: do not persist
                  // tiny additions or touch already-prepared warm views.
                  if (deps.persistPrepared && needed.pins.length >= 16) {
                    try {
                      await withMapReadDeadline(cacheIoMs, () => deps.persistPrepared!(cell.key, stored as StoredMapGeometry, encoded, signal), signal);
                    } catch {
                      signal.throwIfAborted();
                      deps.report?.("write_failed");
                    }
                    signal.throwIfAborted();
                  }
                  // Another request may have refreshed memory during the CAS.
                  const latest = memory.get(cell.key);
                  if (!latest || latest === stored) remember(cell.key, encoded);
                }
              }
            } else {
              const current = memory.get(cell.key);
              if (!current || current === stored) remember(cell.key, stored as StoredMapGeometry);
            }
            deps.report?.("immediate_hit");
            return { ...result, delivery: describe(record) };
          });
          active = task.finally(() => { if (immediate.get(key) === active) immediate.delete(key); });
          immediate.set(key, active);
        }
        const saved = await active;
        if (saved) return saved;
      }
      // First discovery, invalid/expired data, or explicit preparation retains
      // validation, persistence, provider deadlines and single-flight behavior.
      const result = await cache.get(center, bounds);
      const record = await decode(memory.get(cell.key), cell, now());
      return { ...result, ...(record ? { delivery: describe(record) } : {}) };
    },
    async get(center: CanonicalCoordinate, bounds: CanonicalBoundingBox): Promise<StaticMapPins> {
      const cell = getMapGeometryCell(center);
      if (bounds.south < cell.bounds.south || bounds.north > cell.bounds.north ||
          bounds.west < cell.bounds.west || bounds.east > cell.bounds.east) {
        throw new Error("Map view exceeds shared geometry coverage");
      }
      const viewport = JSON.stringify([center, bounds]);
      return withMapReadDeadline(lookupMs, async (signal) => {
        // Keep only the active task, not an ever-growing chain of future retries.
        // Identical views share its result; other cameras reuse the geometry but
        // still extract/prepare their own exact viewport. A failure rejects all
        // current waiters instead of starting one new provider loop per waiter.
        while (true) {
          signal.throwIfAborted();
          const active = pending.get(cell.key);
          if (active) {
            const result = await waitForMapOperation(signal, () => active.result);
            if (active.viewport === viewport) return result;
            continue;
          }
          const task = withMapReadDeadline(lookupMs, (loadSignal) => load(center, bounds, cell, loadSignal), signal);
          const entry = { viewport, result: task.finally(() => {
            if (pending.get(cell.key) === entry) pending.delete(cell.key);
          }) };
          pending.set(cell.key, entry);
          return await waitForMapOperation(signal, () => entry.result);
        }
      });
    }
  };
  return cache;
}
