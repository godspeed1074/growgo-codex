import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import type { CanonicalCoordinate } from "../../domain/pins/basePinTypes";
import type { AuthoritativeSourceCache, AuthoritativeTransportedPinSource } from "../../domain/pins/authoritativePinAcquisitionTypes";
import {
  buildPositiveAuthoritativeSourceCacheRecord,
  isAuthoritativeSourceCacheRecordUsableAsStale,
  isTransientAuthoritativeSourceFailure,
  validateTransportedPinSource
} from "../../domain/pins/authoritativePinCache";

// Read-only v1 wire contract. Keep independent of the map delivery runtime so
// a capture hotfix cannot accidentally activate unrelated map/bird features.
export const RECOVERY_MAP_GEOMETRY_COLLECTION = "sharedMapGeometryV1";
const MAP_CELL_DEGREES = 0.004;
const MAP_GEOMETRY_STALE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_MAP_GEOMETRY_BYTES = 700_000;
const SHARED_MAP_GEOMETRY_VERSION = 1;

const decompress = promisify(gunzip);

/** Repair missing/outage evidence using ONLY server-written map cells, never
 * client pin definitions. The regular canonical/GPS/daily checks still run.
 * Healthy roads add zero reads/writes; recovery has a hard nine-cell bound. */
export function createMapBackedAuthoritativeSourceCache(params: {
  cache: AuthoritativeSourceCache;
  pin: CanonicalCoordinate;
  player: CanonicalCoordinate;
  readCells(keys: string[]): Promise<unknown[]>;
  now?: () => Date;
}): AuthoritativeSourceCache {
  return {
    write: (reference, record) => params.cache.write(reference, record),
    async read(reference) {
      const existing = await params.cache.read(reference);
      const now = params.now?.() ?? new Date();
      if (existing?.kind === "positive" && isAuthoritativeSourceCacheRecordUsableAsStale({ record: existing, now })) return existing;
      // An explicit missing/invalid source remains fail-closed. Only absence,
      // expiry or provider outages may use independent saved map evidence.
      if (existing?.kind === "negative" && !isTransientAuthoritativeSourceFailure(existing.code)) return existing;
      try {
        const keys = recoveryCellKeys(params.pin, params.player);
        let timer: ReturnType<typeof setTimeout> | undefined;
        const cells = await Promise.race([
          params.readCells(keys),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Map evidence read timed out")), 3000); })
        ]).finally(() => { if (timer) clearTimeout(timer); });
        let recovered: AuthoritativeTransportedPinSource | null = null;
        for (let i = 0; i < keys.length; i++) {
          const stored = cells[i] as { version?: unknown; cellKey?: unknown; data?: unknown } | null;
          if (!stored || stored.version !== SHARED_MAP_GEOMETRY_VERSION || stored.cellKey !== keys[i] ||
              !Buffer.isBuffer(stored.data) || stored.data.length > MAX_MAP_GEOMETRY_BYTES) continue;
          let record;
          try { record = JSON.parse((await decompress(stored.data, { maxOutputLength: 8_000_000 })).toString("utf8")); }
          catch { continue; }
          if (record.version !== SHARED_MAP_GEOMETRY_VERSION || record.cellKey !== keys[i] ||
              !Number.isFinite(record.fetchedAt) || record.fetchedAt > now.getTime() ||
              now.getTime() - record.fetchedAt >= MAP_GEOMETRY_STALE_MS ||
              record.payload?.remark || !Array.isArray(record.payload?.elements)) continue;
          const matches = record.payload.elements.filter((way: any) => way.type === "way" && String(way.id) === reference.sourceId);
          if (matches.length !== 1 || !Array.isArray(matches[0].geometry)) continue;
          const source = {
            ...reference,
            spacingMetres: 50 as const,
            orderedCoordinates: matches[0].geometry.map((point: any) => ({ latitude: point?.lat, longitude: point?.lon })),
            fetchedAt: new Date(record.fetchedAt).toISOString()
          };
          const valid = validateTransportedPinSource({ reference, source });
          if (valid.ok && (!recovered || source.fetchedAt > recovered.fetchedAt)) recovered = valid.source;
        }
        if (!recovered) return existing;
        const repaired = buildPositiveAuthoritativeSourceCacheRecord({
          source: recovered, cachedAt: now,
          // Recovery does not renew the original geometry's 30-day lifetime.
          expiresAt: new Date(Date.parse(recovered.fetchedAt) + MAP_GEOMETRY_STALE_MS)
        });
        await params.cache.write(reference, repaired);
        return repaired;
      } catch {
        return existing; // A failed recovery is never a successful capture.
      }
    }
  };
}

function recoveryCellKeys(pin: CanonicalCoordinate, player: CanonicalCoordinate): string[] {
  const keys = new Set([cellKey(pin), cellKey(player)]);
  for (const [dy, dx] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    keys.add(cellKey({ latitude: pin.latitude + dy * MAP_CELL_DEGREES, longitude: pin.longitude + dx * MAP_CELL_DEGREES }));
  }
  return [...keys].slice(0, 9);
}

function cellKey(point: CanonicalCoordinate): string {
  const lat = Math.min(44_999, Math.max(0, Math.floor((point.latitude + 90) / MAP_CELL_DEGREES)));
  const lng = Math.min(89_999, Math.max(0, Math.floor((point.longitude + 180) / MAP_CELL_DEGREES)));
  return `v1-${lat}-${lng}`;
}
